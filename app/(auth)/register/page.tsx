import Link from "next/link";
import { registerUser } from "@/app/(auth)/register/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isDatabaseAvailable } from "@/lib/db/runtime";

const errorMessages: Record<string, string> = {
  database: "Kayıt için veritabanı bağlantısı gereklidir.",
  exists: "Bu e-posta adresiyle kayıtlı bir hesap var.",
  validation: "Form bilgilerini kontrol edin.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const databaseReady = await isDatabaseAvailable();

  return (
    <Card className="w-full max-w-lg border border-[#ddddda] border-t-4 border-t-[#d5ab31] shadow-xl">
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-normal text-primary">
          Hesabınızı oluşturun
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          Rezervasyonlarınızı ve kiralama bilgilerinizi tek panelden takip edin.
        </p>
        {error ? (
          <div className="mt-5 rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessages[error] ?? errorMessages.validation}
          </div>
        ) : null}
        {!databaseReady ? (
          <div className="mt-5 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Kayıt servisine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.
          </div>
        ) : null}
        <form action={registerUser} className="mt-6 space-y-4">
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Ad soyad</span>
            <Input autoComplete="name" name="name" required />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>E-posta</span>
            <Input autoComplete="email" name="email" required type="email" />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Şifre</span>
            <Input autoComplete="new-password" minLength={8} name="password" required type="password" />
          </label>
          <label className="flex gap-3 text-sm leading-6 text-foreground/70">
            <input className="mt-1 h-4 w-4" name="kvkkAccepted" required type="checkbox" />
            KVKK kapsamında hesap bilgilerimin işlenmesini kabul ediyorum.
          </label>
          <label className="flex gap-3 text-sm leading-6 text-foreground/70">
            <input className="mt-1 h-4 w-4" name="commercialConsent" type="checkbox" />
            Kampanya ve bilgilendirmelerden haberdar olmak istiyorum.
          </label>
          <Button className="w-full" disabled={!databaseReady} type="submit">
            Kayıt Ol
          </Button>
        </form>
        <div className="mt-5 text-sm text-foreground/65">
          Zaten hesabınız var mı?{" "}
          <Link className="font-semibold text-accent" href="/login">
            Giriş yapın
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
