import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateBuyVsLease,
  formatTry,
  toNumber,
} from "@/lib/pricing/buy-vs-lease";

export default async function CostCalculatorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const months = toNumber(params.months) || 36;
  const result = calculateBuyVsLease({
    casco: toNumber(params.casco),
    creditCost: toNumber(params.creditCost),
    depreciation: toNumber(params.depreciation),
    downPayment: toNumber(params.downPayment),
    insurance: toNumber(params.insurance),
    leaseMonthly: toNumber(params.leaseMonthly),
    maintenance: toNumber(params.maintenance),
    months,
    mtv: toNumber(params.mtv),
    operationTimeCost: toNumber(params.operationTimeCost),
    tire: toNumber(params.tire),
    vehiclePrice: toNumber(params.vehiclePrice),
  });

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">
          Satin alma mi kiralama mi?
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/65">
          Temel maliyet kalemlerini girerek iki secenegin toplam ve aylik
          etkisini karsilastirin.
        </p>
        <form className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["vehiclePrice", "Arac bedeli"],
            ["downPayment", "Pesinat"],
            ["creditCost", "Kredi maliyeti"],
            ["mtv", "MTV"],
            ["insurance", "Trafik sigortasi"],
            ["casco", "Kasko"],
            ["maintenance", "Bakim"],
            ["tire", "Lastik"],
            ["depreciation", "Deger kaybi"],
            ["operationTimeCost", "Operasyon zamani"],
            ["leaseMonthly", "Kiralama aylik bedeli"],
            ["months", "Sure"],
          ].map(([name, label]) => (
            <label className="space-y-1.5 text-sm font-medium" key={name}>
              <span>{label}</span>
              <Input min="0" name={name} type="number" />
            </label>
          ))}
          <Button className="sm:col-span-2" type="submit">
            Hesapla
          </Button>
        </form>
      </div>
      <Card>
        <CardContent className="space-y-5 p-6">
          <ResultRow label="Satin alma toplam maliyet" value={formatTry(result.ownershipTotal)} />
          <ResultRow label="Kiralama toplam maliyet" value={formatTry(result.leaseTotal)} />
          <ResultRow label="Satin alma aylik ortalama" value={formatTry(result.ownershipMonthly)} />
          <ResultRow label="Kiralama aylik bedel" value={formatTry(result.leaseMonthly)} />
          <ResultRow label="Nakit akisi avantaji" value={formatTry(result.cashFlowAdvantage)} />
          <ResultRow label="Operasyonel yuk farki" value={formatTry(result.operationalDifference)} />
          <div className="rounded-md bg-surface-muted p-4 text-sm font-medium">
            Fark: {formatTry(result.difference)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 text-sm">
      <span className="text-foreground/65">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
