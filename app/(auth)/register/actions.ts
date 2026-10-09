"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { registerFormSchema } from "@/lib/validations/auth";

export async function registerUser(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/register?error=database");
  }

  const parsed = registerFormSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    redirect("/register?error=validation");
  }

  const data = parsed.data;
  let existingUser: { id: string } | null;

  try {
    existingUser = await prisma.user.findUnique({
      select: { id: true },
      where: { email: data.email },
    });
  } catch {
    redirect("/register?error=database");
  }

  if (existingUser) {
    redirect("/register?error=exists");
  }

  try {
    const acceptedAt = new Date();
    const consentRecords = [
      {
        acceptedAt,
        email: data.email,
        type: "KVKK",
        version: "2026-07-13",
      },
      ...(data.commercialConsent
        ? [
            {
              acceptedAt,
              email: data.email,
              type: "COMMERCIAL_COMMUNICATION",
              version: "2026-07-13",
            },
          ]
        : []),
    ];

    await prisma.user.create({
      data: {
        consentRecords: { create: consentRecords },
        email: data.email,
        name: data.name,
        passwordHash: await hashPassword(data.password),
        role: "USER",
        status: "ACTIVE",
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/register?error=exists");
    }

    redirect("/register?error=database");
  }

  redirect("/login?registered=1");
}
