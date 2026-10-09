import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const TURKEY_UTC_OFFSET = "+03:00";
const INITIAL_HOLD_MINUTES = 15;
const PAYMENT_HOLD_MINUTES = 30;
const MAX_RENTAL_DAYS = 90;

type DbClient = Prisma.TransactionClient | typeof prisma;

export type RentalPeriod = {
  pickupAt: Date;
  dropoffAt: Date;
};

type RentalPeriodInput = {
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
};

type CreateHoldInput = RentalPeriod & {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  dropoffLocation?: string | null;
  paymentIntentId?: string | null;
  pickupLocation?: string | null;
  quoteRequestId?: string | null;
  userId?: string | null;
  vehicleId: string;
};

export class RentalPeriodError extends Error {
  constructor(message = "Kiralama tarih ve saat bilgileri geçersiz.") {
    super(message);
    this.name = "RentalPeriodError";
  }
}

export class ReservationUnavailableError extends Error {
  constructor(message = "Seçilen araç bu tarih aralığında müsait değil.") {
    super(message);
    this.name = "ReservationUnavailableError";
  }
}

export function parseRentalPeriod(input: RentalPeriodInput): RentalPeriod {
  const pickupAt = localTurkeyDate(input.pickupDate, input.pickupTime);
  const dropoffAt = localTurkeyDate(input.dropoffDate, input.dropoffTime);
  const now = Date.now();

  if (pickupAt.getTime() < now - 5 * 60 * 1000) {
    throw new RentalPeriodError("Alış zamanı geçmişte olamaz.");
  }

  if (dropoffAt <= pickupAt) {
    throw new RentalPeriodError("Bırakış zamanı alış zamanından sonra olmalıdır.");
  }

  if (dropoffAt.getTime() - pickupAt.getTime() > MAX_RENTAL_DAYS * 86_400_000) {
    throw new RentalPeriodError(`Kiralama süresi ${MAX_RENTAL_DAYS} günü aşamaz.`);
  }

  return { dropoffAt, pickupAt };
}

export async function expireStaleReservationHolds(
  client: DbClient = prisma,
  vehicleId?: string,
) {
  return client.reservation.updateMany({
    data: { status: "EXPIRED" },
    where: {
      holdExpiresAt: { lte: new Date() },
      status: "HOLD",
      vehicleId,
    },
  });
}

export async function getAvailableVehicleIds(
  vehicleIds: string[],
  period: RentalPeriod,
) {
  const availabilityCounts = await getVehicleAvailabilityCounts(vehicleIds, period);

  return new Set(
    [...availabilityCounts.entries()]
      .filter(([, count]) => count > 0)
      .map(([vehicleId]) => vehicleId),
  );
}

export async function getVehicleAvailabilityCounts(
  vehicleIds: string[],
  period: RentalPeriod,
) {
  if (vehicleIds.length === 0) {
    return new Map<string, number>();
  }

  await expireStaleReservationHolds();

  const [vehicles, overlappingReservations] = await Promise.all([
    prisma.vehicle.findMany({
      select: { id: true, stockCount: true },
      where: { id: { in: vehicleIds }, stockCount: { gt: 0 } },
    }),
    prisma.reservation.groupBy({
      _count: { _all: true },
      by: ["vehicleId"],
      where: activeOverlapWhere(period, vehicleIds),
    }),
  ]);

  const reservedByVehicle = new Map(
    overlappingReservations.map((entry) => [entry.vehicleId, entry._count._all]),
  );

  return new Map(
    vehicles.map((vehicle) => [
      vehicle.id,
      Math.max(0, vehicle.stockCount - (reservedByVehicle.get(vehicle.id) ?? 0)),
    ]),
  );
}

export async function isVehicleAvailable(
  vehicleId: string,
  period: RentalPeriod,
) {
  const availableIds = await getAvailableVehicleIds([vehicleId], period);
  return availableIds.has(vehicleId);
}

export async function createReservationHold(input: CreateHoldInput) {
  return prisma.$transaction(
    async (transaction) => {
      await lockVehicle(transaction, input.vehicleId);
      await expireStaleReservationHolds(transaction, input.vehicleId);
      await assertCapacity(transaction, input.vehicleId, input);

      return transaction.reservation.create({
        data: {
          customerEmail: input.customerEmail.trim().toLowerCase(),
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone?.trim() || null,
          dropoffAt: input.dropoffAt,
          dropoffLocation: input.dropoffLocation?.trim() || null,
          holdExpiresAt: minutesFromNow(INITIAL_HOLD_MINUTES),
          paymentIntentId: input.paymentIntentId || null,
          pickupAt: input.pickupAt,
          pickupLocation: input.pickupLocation?.trim() || null,
          quoteRequestId: input.quoteRequestId || null,
          status: "HOLD",
          userId: input.userId || null,
          vehicleId: input.vehicleId,
        },
      });
    },
    { isolationLevel: "ReadCommitted", maxWait: 5_000, timeout: 10_000 },
  );
}

export async function attachPaymentAndExtendHold(input: {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  dropoffAt: Date;
  dropoffLocation?: string | null;
  paymentIntentId: string;
  pickupAt: Date;
  pickupLocation?: string | null;
  reservationId: string;
  userId?: string | null;
  vehicleId: string;
}) {
  return prisma.$transaction(
    async (transaction) => {
      const reservation = await transaction.reservation.findUnique({
        where: { id: input.reservationId },
      });

      if (
        !reservation ||
        reservation.status !== "HOLD" ||
        reservation.vehicleId !== input.vehicleId
      ) {
        throw new ReservationUnavailableError();
      }

      await lockVehicle(transaction, reservation.vehicleId);
      await expireStaleReservationHolds(transaction, reservation.vehicleId);
      await assertCapacity(
        transaction,
        reservation.vehicleId,
        { dropoffAt: input.dropoffAt, pickupAt: input.pickupAt },
        reservation.id,
      );

      return transaction.reservation.update({
        data: {
          customerEmail: input.customerEmail.trim().toLowerCase(),
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone?.trim() || null,
          dropoffAt: input.dropoffAt,
          dropoffLocation: input.dropoffLocation?.trim() || null,
          holdExpiresAt: minutesFromNow(PAYMENT_HOLD_MINUTES),
          paymentIntentId: input.paymentIntentId,
          pickupAt: input.pickupAt,
          pickupLocation: input.pickupLocation?.trim() || null,
          status: "HOLD",
          userId: input.userId || reservation.userId || null,
        },
        where: { id: reservation.id },
      });
    },
    { isolationLevel: "ReadCommitted", maxWait: 5_000, timeout: 10_000 },
  );
}

export async function cancelReservationForPayment(
  paymentIntentId: string,
  note: string,
) {
  return prisma.reservation.updateMany({
    data: {
      cancellationNote: note,
      holdExpiresAt: null,
      status: "CANCELLED",
    },
    where: { paymentIntentId, status: "HOLD" },
  });
}

function activeOverlapWhere(
  period: RentalPeriod,
  vehicleIds?: string[],
): Prisma.ReservationWhereInput {
  return {
    dropoffAt: { gt: period.pickupAt },
    pickupAt: { lt: period.dropoffAt },
    vehicleId: vehicleIds ? { in: vehicleIds } : undefined,
    OR: [
      { status: "CONFIRMED" },
      {
        holdExpiresAt: { gt: new Date() },
        status: "HOLD",
      },
    ],
  };
}

async function assertCapacity(
  transaction: Prisma.TransactionClient,
  vehicleId: string,
  period: RentalPeriod,
  excludeReservationId?: string,
) {
  const vehicle = await transaction.vehicle.findFirst({
    select: { stockCount: true },
    where: {
      id: vehicleId,
      isPublishedWeb: true,
      status: "PUBLISHED",
    },
  });

  if (!vehicle || vehicle.stockCount <= 0) {
    throw new ReservationUnavailableError();
  }

  const overlappingCount = await transaction.reservation.count({
    where: {
      ...activeOverlapWhere(period),
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      vehicleId,
    },
  });

  if (overlappingCount >= vehicle.stockCount) {
    throw new ReservationUnavailableError();
  }
}

async function lockVehicle(
  transaction: Prisma.TransactionClient,
  vehicleId: string,
) {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM Vehicle WHERE id = ${vehicleId} FOR UPDATE
  `;

  if (rows.length === 0) {
    throw new ReservationUnavailableError();
  }
}

function localTurkeyDate(dateText: string, timeText: string) {
  if (!isCalendarDate(dateText) || !isClockTime(timeText)) {
    throw new RentalPeriodError();
  }

  const date = new Date(`${dateText}T${timeText}:00${TURKEY_UTC_OFFSET}`);

  if (Number.isNaN(date.getTime())) {
    throw new RentalPeriodError();
  }

  return date;
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function isClockTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
