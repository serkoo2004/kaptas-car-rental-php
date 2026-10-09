import { createQuoteRequest } from "@/app/(public)/teklif-al/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  Send,
  SlidersHorizontal,
} from "lucide-react";

const steps = [
  {
    title: "Ihtiyac",
    text: "Arac adedi, sure ve kilometre",
    icon: SlidersHorizontal,
  },
  { title: "Teklif", text: "Paket ve aylik maliyet", icon: Send },
  { title: "Belge", text: "Sirket evraklari ve onay", icon: FileCheck2 },
  { title: "Teslimat", text: "Operasyon planlama", icon: ClipboardCheck },
];

export default async function QuoteRequestPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const hasValidationError = params.error === "validation";

  return (
    <div className="bg-background">
      <section className="border-b bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="animate-reveal-up">
            <p className="text-sm font-semibold text-accent">Teklif akisi</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
              Filo ihtiyacini netlestir, teklif surecini baslat.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/66">
              Arac adedi, sure, kilometre ve hizmet beklentisini girin. Satis
              ekibi kaydi lead olarak takip eder, belge ve operasyon sureci ayni
              dosyada ilerler.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  className={`animate-reveal-up rounded-lg border border-white/12 bg-white/[0.06] p-4 ${
                    index === 1
                      ? "motion-delay-1"
                      : index > 1
                        ? "motion-delay-2"
                        : ""
                  }`}
                  key={step.title}
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <div className="mt-5 text-xs font-semibold uppercase text-white/42">
                    0{index + 1}
                  </div>
                  <h2 className="mt-1 font-semibold text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <div className="rounded-lg border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-primary">
            Basvuru kaydi nasil ilerler?
          </h2>
          <div className="mt-6 grid gap-4">
            {steps.map((step, index) => (
              <div className="flex gap-3" key={step.title}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent/10 text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                <div>
                  <div className="font-semibold">{step.title}</div>
                  <p className="mt-1 text-sm leading-6 text-foreground/62">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Card className="shadow-panel">
          <CardContent className="p-6">
            {hasValidationError ? (
              <div className="mb-5 rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                Form bilgilerini kontrol edin ve zorunlu alanlari tamamlayin.
              </div>
            ) : null}
            <form action={createQuoteRequest} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Kullanici tipi</span>
                  <select
                    className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    name="userType"
                    required
                  >
                    <option value="SME">KOBI</option>
                    <option value="CORPORATE">Kurumsal</option>
                    <option value="SOLE_PROPRIETORSHIP">Sahis sirketi</option>
                    <option value="INDIVIDUAL">Bireysel</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Arac adedi</span>
                  <Input
                    defaultValue="1"
                    min="1"
                    name="quantity"
                    required
                    type="number"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Marka</span>
                  <Input name="brandText" required />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Model</span>
                  <Input name="modelText" />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Sure</span>
                  <select
                    className="flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    name="durationMonths"
                    required
                  >
                    <option value="24">24 ay</option>
                    <option value="36">36 ay</option>
                    <option value="48">48 ay</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Yillik kilometre</span>
                  <Input
                    defaultValue="20000"
                    min="5000"
                    name="annualKm"
                    required
                    type="number"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Firma adi</span>
                  <Input name="companyName" />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Yetkili kisi</span>
                  <Input name="contactName" required />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Email</span>
                  <Input name="contactEmail" required type="email" />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>Telefon</span>
                  <Input name="contactPhone" required type="tel" />
                </label>
              </div>
              <label className="block space-y-1.5 text-sm font-medium">
                <span>Not</span>
                <Textarea name="note" />
              </label>
              <label className="flex gap-3 text-sm leading-6 text-foreground/70">
                <input
                  className="mt-1 h-4 w-4"
                  name="kvkkAccepted"
                  required
                  type="checkbox"
                />
                KVKK kapsaminda bilgilerimin teklif sureci icin islenmesini
                kabul ediyorum.
              </label>
              <label className="flex gap-3 text-sm leading-6 text-foreground/70">
                <input
                  className="mt-1 h-4 w-4"
                  name="commercialConsent"
                  type="checkbox"
                />
                Teklif ve bilgilendirme amacli benimle iletisime gecilebilir.
              </label>
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                size="lg"
                type="submit"
              >
                Basvuruyu Gonder
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
