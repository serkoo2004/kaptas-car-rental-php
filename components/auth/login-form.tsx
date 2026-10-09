"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      setError("Giriş servisine şu anda ulaşılamıyor.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(null);

    const requestedCallback = searchParams.get("callbackUrl");
    const isAdminLogin =
      requestedCallback === "/admin" || requestedCallback?.startsWith("/admin/");
    const callbackUrl =
      isAdminLogin && requestedCallback ? requestedCallback : "/?account=overview";

    const result = await signIn("credentials", {
      callbackUrl,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    }).catch(() => null);

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("E-posta veya şifre hatalı.");
      return;
    }

    if (isAdminLogin) {
      const session = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null);

      if (!["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
        await signOut({ redirect: false }).catch(() => null);
        setError("Bu hesap admin paneline erişim yetkisine sahip değil.");
        return;
      }
    }

    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <label className="block space-y-1.5 text-sm font-medium">
        <span>E-posta</span>
        <Input autoComplete="email" name="email" required type="email" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Şifre</span>
        <Input autoComplete="current-password" name="password" required type="password" />
      </label>
      <Button className="w-full" disabled={disabled || isSubmitting} type="submit">
        {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
      </Button>
    </form>
  );
}
