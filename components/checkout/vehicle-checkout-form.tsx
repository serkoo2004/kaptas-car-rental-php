"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CalendarDays,
  CarFront,
  Check,
  CreditCard,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SupportedCurrency } from "@/lib/exchange-rates";

type CheckoutVehicle = {
  brand: string;
  id: string;
  imageUrl: string | null;
  model: string;
  title: string;
};

type AccountDefaults = {
  address: string;
  city: string;
  district: string;
  email: string;
  name: string;
  phone: string;
};

type RentalDefaults = {
  dropoffDate: string;
  dropoffTime: string;
  pickupDate: string;
  pickupTime: string;
};

export function VehicleCheckoutForm({
  account,
  action,
  currency,
  dailyPrice,
  errorMessage,
  exchangeRateLabel,
  isAdmin,
  iyzicoReady,
  leadId,
  location,
  rental,
  vehicle,
}: {
  account: AccountDefaults;
  action: (formData: FormData) => Promise<void>;
  currency: SupportedCurrency;
  dailyPrice: number;
  errorMessage: string | null;
  exchangeRateLabel: string | null;
  isAdmin: boolean;
  iyzicoReady: boolean;
  leadId: string;
  location: string;
  rental: RentalDefaults;
  vehicle: CheckoutVehicle | null;
}) {
  const [period, setPeriod] = useState(rental);
  const minimumPickupDate = useMemo(todayInTurkey, []);
  const minimumDropoffDate = period.pickupDate || minimumPickupDate;
  const billableDays = useMemo(() => rentalDays(period), [period]);
  const total = billableDays && dailyPrice > 0 ? billableDays * dailyPrice : 0;
  const priceReady = dailyPrice > 0;
  const checkoutReady = Boolean(vehicle && billableDays && priceReady && iyzicoReady);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <CheckoutSteps />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form action={action} className="space-y-4">
          {vehicle ? <input name="vehicleId" type="hidden" value={vehicle.id} /> : null}
          {leadId ? <input name="leadId" type="hidden" value={leadId} /> : null}
          <input name="currency" type="hidden" value={currency} />
          <input name="pickupLocation" type="hidden" value={location} />
          <input name="dropoffLocation" type="hidden" value={location} />

          {errorMessage ? (
            <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {!vehicle ? (
            <CheckoutNotice title="Araç seçimi bulunamadı">
              Ödeme adımına geçmek için ana sayfadan kiralamak istediğiniz aracı seçin.
            </CheckoutNotice>
          ) : null}

          {vehicle && (!priceReady || !iyzicoReady) ? (
            <CheckoutNotice title="Online ödeme henüz hazır değil">
              {!priceReady
                ? "Bu araç için kiralama fiyatı henüz tanımlanmadı."
                : "Güvenli ödeme bağlantısı kısa süreli olarak kullanılamıyor."}
              {isAdmin ? (
                <span className="mt-2 block text-xs font-semibold text-amber-900/70">
                  {!priceReady
                    ? "Yönetici olarak araç detayından başlangıç fiyatını kaydedin."
                    : "Sunucuda IYZICO_API_KEY ve IYZICO_SECRET_KEY değerlerini tanımlayın."}
                </span>
              ) : null}
              {isAdmin && !priceReady ? (
                <Link className="mt-3 inline-flex font-bold text-amber-900 underline" href={`/admin/araclar/${vehicle.id}`}>
                  Araç fiyatını düzenle
                </Link>
              ) : null}
            </CheckoutNotice>
          ) : null}

          <CheckoutSection icon={<CalendarDays />} number="01" subtitle="Tarih ve teslim noktası" title="Kiralama Bilgileri">
            <div className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2" label="Alış ve İade Noktası">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-foreground/45" />
                  <Input className="h-11 bg-[#f7f7f5] pl-10 font-semibold" readOnly value={location} />
                </div>
              </Field>
              <Field label="Alış Tarihi">
                <Input className="h-11" min={minimumPickupDate} name="pickupDate" onChange={(event) => setPeriod((current) => ({ ...current, pickupDate: event.target.value }))} required type="date" value={period.pickupDate} />
              </Field>
              <Field label="Alış Saati">
                <Input className="h-11" name="pickupTime" onChange={(event) => setPeriod((current) => ({ ...current, pickupTime: event.target.value }))} required type="time" value={period.pickupTime} />
              </Field>
              <Field label="Bırakış Tarihi">
                <Input className="h-11" min={minimumDropoffDate} name="dropoffDate" onChange={(event) => setPeriod((current) => ({ ...current, dropoffDate: event.target.value }))} required type="date" value={period.dropoffDate} />
              </Field>
              <Field label="Bırakış Saati">
                <Input className="h-11" name="dropoffTime" onChange={(event) => setPeriod((current) => ({ ...current, dropoffTime: event.target.value }))} required type="time" value={period.dropoffTime} />
              </Field>
              <Field className="md:col-span-2" label="Teslim Notu (isteğe bağlı)">
                <Textarea className="min-h-20 resize-y" name="pickupNote" placeholder="Uçuş numarası veya teslimat notunuz" />
              </Field>
            </div>
          </CheckoutSection>

          <CheckoutSection icon={<UserRound />} number="02" subtitle="Sürücü ve iletişim" title="Kişisel Bilgiler">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ad Soyad">
                <Input autoComplete="name" className="h-11" defaultValue={account.name} name="customerName" placeholder="Adınız Soyadınız" required />
              </Field>
              <Field label="Cep Telefonu">
                <Input autoComplete="tel" className="h-11" defaultValue={account.phone} name="customerPhone" placeholder="05XX XXX XX XX" required type="tel" />
              </Field>
              <Field label="E-posta">
                <Input autoComplete="email" className="h-11" defaultValue={account.email} name="customerEmail" placeholder="ornek@email.com" required type="email" />
              </Field>
              <Field label="T.C. Kimlik No">
                <Input autoComplete="off" className="h-11" inputMode="numeric" maxLength={11} minLength={11} name="identityNumber" placeholder="11 haneli kimlik numarası" required />
              </Field>
            </div>
          </CheckoutSection>

          <CheckoutSection icon={<FileText />} number="03" subtitle="Fatura ve teslimat adresi" title="Adres Bilgileri">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="İl">
                <Input autoComplete="address-level1" className="h-11" defaultValue={account.city} name="city" placeholder="İl" required />
              </Field>
              <Field label="İlçe">
                <Input autoComplete="address-level2" className="h-11" defaultValue={account.district} name="district" placeholder="İlçe" />
              </Field>
              <Field className="md:col-span-2" label="Açık Adres">
                <Textarea autoComplete="street-address" className="min-h-24 resize-y" defaultValue={account.address} name="address" placeholder="Mahalle, cadde, sokak, bina ve daire bilgisi" required />
              </Field>
            </div>
          </CheckoutSection>

          <CheckoutSection icon={<CreditCard />} number="04" subtitle="iyzico 3D Secure" title="Kart Bilgileri">
            <div className="grid gap-4 md:grid-cols-6">
              <Field className="md:col-span-6" label="Kart Üzerindeki Ad Soyad">
                <Input autoComplete="cc-name" className="h-11 uppercase" name="cardHolderName" placeholder="AD SOYAD" required />
              </Field>
              <Field className="md:col-span-6" label="Kart Numarası">
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-foreground/45" />
                  <Input autoComplete="cc-number" className="h-11 pl-10" inputMode="numeric" maxLength={19} name="cardNumber" placeholder="0000 0000 0000 0000" required />
                </div>
              </Field>
              <Field className="md:col-span-2" label="Ay">
                <Input autoComplete="cc-exp-month" className="h-11" inputMode="numeric" maxLength={2} name="expireMonth" placeholder="AA" required />
              </Field>
              <Field className="md:col-span-2" label="Yıl">
                <Input autoComplete="cc-exp-year" className="h-11" inputMode="numeric" maxLength={4} name="expireYear" placeholder="YYYY" required />
              </Field>
              <Field className="md:col-span-2" label="CVC">
                <Input autoComplete="cc-csc" className="h-11" inputMode="numeric" maxLength={4} name="cvc" placeholder="123" required />
              </Field>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-[#ecece7] pt-4 text-sm leading-6 text-foreground/70">
              <input className="mt-1 h-4 w-4 accent-amber-500" required type="checkbox" />
              <span>
                <Link className="font-bold text-foreground underline" href="/kiralama-kosullari">Kiralama koşullarını</Link> ve kişisel verilerin işlenmesine ilişkin bilgilendirmeyi okudum, kabul ediyorum.
              </span>
            </label>
          </CheckoutSection>

          <CheckoutSubmit currency={currency} disabled={!checkoutReady} total={total} />
        </form>

        <aside className="lg:sticky lg:top-28">
          <div className="overflow-hidden border border-[#deded8] bg-white shadow-[0_12px_32px_rgba(20,20,20,0.08)]">
            <div className="flex items-center justify-between bg-[#202020] px-5 py-4 text-white">
              <div>
                <div className="text-xs font-semibold text-white/60">REZERVASYON</div>
                <h2 className="mt-0.5 text-lg font-bold">Ödeme Özeti</h2>
              </div>
              <LockKeyhole className="h-5 w-5 text-amber-400" />
            </div>

            {vehicle ? (
              <div className="p-5">
                <div className="flex items-center gap-4 border-b border-[#ecece7] pb-5">
                  <div className="relative h-20 w-32 flex-none overflow-hidden bg-[#f7f7f5]">
                    {vehicle.imageUrl ? (
                      <Image alt={`${vehicle.brand} ${vehicle.model}`} className="object-contain p-1" fill sizes="128px" src={vehicle.imageUrl} unoptimized />
                    ) : (
                      <CarFront className="absolute inset-0 m-auto h-8 w-8 text-foreground/25" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase text-amber-700">Seçilen araç</div>
                    <h3 className="mt-1 text-lg font-bold leading-6 text-[#262626]">{vehicle.brand} {vehicle.model}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground/55">{vehicle.title}</p>
                  </div>
                </div>

                <div className="space-y-3 py-5 text-sm">
                  <SummaryLine label="Teslim noktası" value={location} />
                  <SummaryLine label="Kiralama süresi" value={billableDays ? `${billableDays} gün` : "Tarihleri kontrol edin"} />
                  <SummaryLine label="Günlük ücret" value={priceReady ? formatMoney(dailyPrice, currency) : "Tanımlanmadı"} />
                  {exchangeRateLabel ? <p className="text-right text-[11px] leading-4 text-foreground/45">{exchangeRateLabel}</p> : null}
                </div>

                <div className="flex items-end justify-between border-y border-[#ecece7] py-5">
                  <div>
                    <div className="text-sm font-semibold text-foreground/55">Toplam ödeme</div>
                    <div className="mt-1 text-xs text-foreground/40">Vergiler dahil</div>
                  </div>
                  <strong className="text-2xl font-extrabold text-[#202020]">{total > 0 ? formatMoney(total, currency) : "-"}</strong>
                </div>

                <div className="mt-5 space-y-3 text-xs leading-5 text-foreground/60">
                  <TrustLine text="Kart bilgileriniz KAPTAŞ sistemlerinde saklanmaz." />
                  <TrustLine text="Rezervasyon yalnızca başarılı 3D Secure ödemeden sonra kesinleşir." />
                  <TrustLine text="Ödeme sonucu e-posta ile tarafınıza iletilir." />
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm text-foreground/60">Henüz araç seçilmedi.</div>
            )}
          </div>

          <Link className="mt-4 flex h-11 items-center justify-center border border-[#d8d8d2] bg-white text-sm font-bold text-foreground transition hover:border-amber-400 hover:bg-amber-50" href="/">
            Araç seçimine dön
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CheckoutSteps() {
  const steps = [
    [CarFront, "Araç"],
    [UserRound, "Sürücü"],
    [FileText, "Adres"],
    [CreditCard, "Ödeme"],
  ] as const;

  return (
    <ol className="grid grid-cols-4 border border-[#deded8] bg-white">
      {steps.map(([Icon, label], index) => (
        <li className="relative flex min-h-16 items-center justify-center gap-2 border-r border-[#ecece7] px-2 text-xs font-bold text-[#444] last:border-r-0 sm:text-sm" key={label}>
          <span className="grid h-8 w-8 place-items-center bg-amber-50 text-amber-800"><Icon className="h-4 w-4" /></span>
          <span className="hidden sm:inline">{label}</span>
          <span className="absolute left-2 top-1 text-[10px] font-bold text-foreground/25">0{index + 1}</span>
        </li>
      ))}
    </ol>
  );
}

function CheckoutSection({ children, icon, number, subtitle, title }: { children: ReactNode; icon: ReactNode; number: string; subtitle: string; title: string }) {
  return (
    <section className="border border-[#deded8] bg-white">
      <header className="flex items-center gap-3 border-b border-[#ecece7] px-5 py-4">
        <span className="grid h-10 w-10 place-items-center bg-amber-50 text-amber-800 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#292929]">{title}</h2>
          <p className="text-xs font-medium text-foreground/50">{subtitle}</p>
        </div>
        <span className="text-sm font-extrabold text-foreground/20">{number}</span>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function CheckoutNotice({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
      <strong className="block text-base">{title}</strong>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-bold text-[#3b3b3b]">{label}</span>
      {children}
    </label>
  );
}

function CheckoutSubmit({ currency, disabled, total }: { currency: SupportedCurrency; disabled: boolean; total: number }) {
  const { pending } = useFormStatus();

  return (
    <button className="flex h-14 w-full items-center justify-center gap-3 bg-primary px-5 text-base font-extrabold text-primary-foreground transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-[#d8d8d2] disabled:text-[#777]" disabled={disabled || pending} type="submit">
      {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
      {pending ? "3D Secure hazırlanıyor..." : total > 0 ? `${formatMoney(total, currency)} Öde` : "3D Secure ile Ödemeye Geç"}
    </button>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-foreground/55">{label}</span><strong className="max-w-[210px] text-right text-[#333]">{value}</strong></div>;
}

function TrustLine({ text }: { text: string }) {
  return <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-emerald-700" /><span>{text}</span></div>;
}

function rentalDays(period: RentalDefaults) {
  if (!period.pickupDate || !period.pickupTime || !period.dropoffDate || !period.dropoffTime) return null;
  const pickup = new Date(`${period.pickupDate}T${period.pickupTime}:00`);
  const dropoff = new Date(`${period.dropoffDate}T${period.dropoffTime}:00`);
  const duration = dropoff.getTime() - pickup.getTime();
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return Math.max(1, Math.ceil(duration / 86_400_000));
}

function todayInTurkey() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(new Date());
}

function formatMoney(value: number, currency: SupportedCurrency) {
  return new Intl.NumberFormat("tr-TR", {
    currency,
    maximumFractionDigits: currency === "TRY" ? 0 : 2,
    minimumFractionDigits: currency === "TRY" ? 0 : 2,
    style: "currency",
  }).format(value);
}
