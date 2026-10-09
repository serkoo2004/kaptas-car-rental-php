import Link from "next/link";
import { resetPassword } from "@/app/(auth)/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isDatabaseAvailable } from "@/lib/db/runtime";

const errorMessages: Record<string, string> = {
  database: "Şifre yenileme için veritabanı bağlantısı gereklidir.",
  expired: "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.",
  validation: "Yeni şifre en az 8 karakter olmalıdır.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const email = String(Array.isArray(params.email) ? params.email[0] : params.email ?? "");
  const token = String(Array.isArray(params.token) ? params.token[0] : params.token ?? "");
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const databaseReady = await isDatabaseAvailable();

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl">
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-normal text-primary">
          Yeni şifre belirleyin
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          Hesabınız için yeni ve güçlü bir şifre oluşturun.
        </p>
        {error ? (
          <div className="mt-5 rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessages[error] ?? errorMessages.validation}
          </div>
        ) : null}
        {!databaseReady ? (
          <div className="mt-5 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Şifre yenileme için veritabanı çalışır durumda olmalıdır.
          </div>
        ) : null}
        <form action={resetPassword} className="mt-6 space-y-4">
          <input name="email" type="hidden" value={email} />
          <input name="token" type="hidden" value={token} />
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Yeni şifre</span>
            <Input autoComplete="new-password" minLength={8} name="password" required type="password" />
          </label>
          <Button className="w-full" disabled={!databaseReady} type="submit">
            Şifreyi Güncelle
          </Button>
        </form>
        <Link className="mt-5 inline-block text-sm font-semibold text-accent" href="/login">
          Giriş ekranına dön
        </Link>
      </CardContent>
    </Card>
  );
}
