"use server";

import { redirect } from "next/navigation";
import { completePasswordReset } from "@/lib/auth/password-reset";
import { isDatabaseAvailable } from "@/lib/db/runtime";

export async function resetPassword(formData: FormData) {
  if (!(await isDatabaseAvailable())) {
    redirect("/reset-password?error=database");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !token || password.length < 8) {
    redirect("/reset-password?error=validation");
  }

  let resetCompleted = false;

  try {
    resetCompleted = await completePasswordReset({ email, password, token });
  } catch {
    redirect("/reset-password?error=database");
  }

  if (!resetCompleted) {
    redirect("/reset-password?error=expired");
  }

  redirect("/login?reset=1");
}
