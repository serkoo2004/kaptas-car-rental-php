"use server";

import { redirect } from "next/navigation";
import { createPasswordResetToken } from "@/lib/auth/password-reset-token";
import { prisma } from "@/lib/db/prisma";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { sendPasswordResetEmail } from "@/lib/mail/smtp";

export async function requestPasswordReset(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/forgot-password?error=database");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    redirect("/forgot-password?error=validation");
  }

  const user = await prisma.user
    .findUnique({
      select: { email: true },
      where: { email },
    })
    .catch(() => null);

  if (!user) {
    redirect("/forgot-password?sent=1");
  }

  const { token, tokenHash } = createPasswordResetToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  try {
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });
    await prisma.verificationToken.create({
      data: {
        expires,
        identifier: email,
        token: tokenHash,
      },
    });
  } catch {
    redirect("/forgot-password?error=database");
  }

  const baseUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;
  let sent = false;

  try {
    sent = Boolean(baseUrl) && await sendPasswordResetEmail({
      email,
      resetUrl: `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`,
    });
  } catch {
    sent = false;
  }

  if (!sent) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, token: tokenHash },
    });
    redirect("/forgot-password?error=smtp");
  }

  redirect("/forgot-password?sent=1");
}
