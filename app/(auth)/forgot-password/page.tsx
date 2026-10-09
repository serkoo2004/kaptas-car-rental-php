import Link from "next/link";
import { requestPasswordReset } from "@/app/(auth)/forgot-password/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isDatabaseAvailable } from "@/lib/db/runtime";

const errorMessages: Record<string, string> = {
  database: "Şifre sıfırlama için veritabanı bağlantısı gereklidir.",
  smtp: "SMTP bilgileri tanimli olmadigi icin sifirlama emaili gonderilemedi.",
  validation: "Gecerli bir email adresi girin.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const sent = params.sent === "1";
  const databaseReady = await isDatabaseAvailable();

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl">
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-normal text-primary">
          Şifre sıfırlama
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          E-posta adresinizi girin. Şifre sıfırlama bağlantısı kayıtlı e-posta
          adresinize gonderilir.
        </p>
        {error ? (
          <div className="mt-5 rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessages[error] ?? errorMessages.validation}
          </div>
        ) : null}
        {sent ? (
          <div className="mt-5 rounded-md border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            E-posta adresi kayıtlıysa sıfırlama bağlantısı gönderildi.
          </div>
        ) : null}
        {!databaseReady ? (
          <div className="mt-5 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Şifre sıfırlama servisi için veritabanı bağlantısı kurulmalıdır.
          </div>
        ) : null}
        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Email</span>
            <Input autoComplete="email" name="email" required type="email" />
          </label>
          <Button className="w-full" disabled={!databaseReady} type="submit">
            Sıfırlama Bağlantısı Gönder
          </Button>
        </form>
        <Link className="mt-5 inline-block text-sm font-semibold text-accent" href="/login">
          Giriş ekranına dön
        </Link>
      </CardContent>
    </Card>
  );
}
