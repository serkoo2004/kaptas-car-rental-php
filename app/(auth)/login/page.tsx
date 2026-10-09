import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { isDatabaseAvailable } from "@/lib/db/runtime";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const isAdminLogin = callbackUrl?.startsWith("/admin") ?? false;
  const databaseReady = await isDatabaseAvailable();

  return (
    <Card className="w-full max-w-md border border-[#ddddda] border-t-4 border-t-[#d5ab31] shadow-xl">
      <CardContent className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-normal text-primary">
          Hesabınıza giriş yapın
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          {isAdminLogin
            ? "Admin paneli yalnızca yetkili yönetici hesaplarıyla açılır."
            : "Rezervasyonlarınızı ve kiralama bilgilerinizi takip edin."}
        </p>
        {!databaseReady ? (
          <div className="mt-5 rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Giriş servisine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.
          </div>
        ) : null}
        <div className="mt-6">
          <Suspense>
            <LoginForm disabled={!databaseReady} />
          </Suspense>
        </div>
        {isAdminLogin ? (
          <div className="mt-5 rounded-md border bg-surface-muted px-4 py-3 text-sm text-foreground/65">
            Admin hesabı herkese açık kayıt ekranından oluşturulamaz.
          </div>
        ) : (
          <div className="mt-5 text-sm text-foreground/65">
            Hesabınız yok mu?{" "}
            <Link className="font-semibold text-accent" href="/register">
              Kayıt olun
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
