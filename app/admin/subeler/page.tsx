import type { BranchLocation } from "@prisma/client";
import Image from "next/image";
import type { ReactNode } from "react";
import { Building2, MapPin, Plane, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isDatabaseAvailable } from "@/lib/db/runtime";
import { prisma } from "@/lib/db/prisma";
import {
  createBranchLocation,
  setBranchLocationStatus,
  updateBranchLocation,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const branches = (await isDatabaseAvailable())
    ? await prisma.branchLocation.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      })
    : [];

  const activeCount = branches.filter((branch) => branch.isActive).length;
  const airportCount = branches.filter((branch) => branch.type === "airport").length;
  const cityCount = branches.filter((branch) => branch.type !== "airport").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Public sitede gorunen sube ve teslim noktalarini buradan ekleyin, siralayin ve yayindan kaldirin."
        title="Şube yönetimi"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<MapPin className="h-5 w-5" />}
          label="Toplam sube"
          value={branches.length.toLocaleString("tr-TR")}
        />
        <MetricCard
          icon={<Building2 className="h-5 w-5" />}
          label="Webde aktif"
          value={activeCount.toLocaleString("tr-TR")}
        />
        <MetricCard
          icon={<Plane className="h-5 w-5" />}
          label="Teslim tipleri"
          subValue={`${cityCount.toLocaleString("tr-TR")} sehir ici`}
          value={`${airportCount.toLocaleString("tr-TR")} havalimani`}
        />
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-[#765a0d]" />
            Yeni şube ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BranchForm action={createBranchLocation} submitLabel="Şubeyi ekle" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {branches.length === 0 ? (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-8">
              <div className="text-sm font-semibold text-slate-950">
                Henüz şube kaydı yok
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Ilk subeyi eklediginizde public sitedeki Subelerimiz sayfasi
                otomatik olarak bu veriyi kullanir.
              </p>
            </CardContent>
          </Card>
        ) : (
          branches.map((branch) => (
            <Card
              className="border-slate-200 bg-white shadow-sm"
              key={branch.id}
            >
              <CardHeader className="flex flex-col gap-3 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {branch.name}
                    <Badge variant={branch.isActive ? "success" : "warning"}>
                      {branch.isActive ? "Yayinda" : "Pasif"}
                    </Badge>
                    <Badge variant="outline">
                      {branch.type === "airport" ? "Havalimani" : "Sehir ici"}
                    </Badge>
                  </CardTitle>
                  <p className="mt-1 text-xs text-slate-500">
                    Sira {branch.sortOrder} · {branch.slug}
                  </p>
                </div>
                <form action={setBranchLocationStatus}>
                  <input name="id" type="hidden" value={branch.id} />
                  <input
                    name="isActive"
                    type="hidden"
                    value={branch.isActive ? "false" : "true"}
                  />
                  <Button size="sm" type="submit" variant="outline">
                    {branch.isActive ? "Pasife al" : "Yayina al"}
                  </Button>
                </form>
              </CardHeader>
              <CardContent className="pt-6">
                <BranchForm
                  action={updateBranchLocation}
                  branch={branch}
                  submitLabel="Değişiklikleri kaydet"
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-3xl font-bold text-slate-950">{value}</div>
          {subValue ? (
            <div className="mt-1 text-xs font-medium text-slate-500">
              {subValue}
            </div>
          ) : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#fff2bf] text-[#765a0d]">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function BranchForm({
  action,
  branch,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  branch?: BranchLocation;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {branch ? <input name="id" type="hidden" value={branch.id} /> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <Field label="Şube adi">
          <Input
            defaultValue={branch?.name ?? ""}
            name="name"
            placeholder="Merkez Ofis"
            required
          />
        </Field>
        <Field label="Kısa açıklama">
          <Input
            defaultValue={branch?.subtitle ?? ""}
            name="subtitle"
            placeholder="Teslim ve iade noktasi"
          />
        </Field>
        <Field label="Tip">
          <select
            className="h-10 w-full rounded-md border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={branch?.type ?? "city"}
            name="type"
          >
            <option value="city">Sehir ici</option>
            <option value="airport">Havalimani</option>
            <option value="delivery">Teslim noktasi</option>
          </select>
        </Field>
        <Field label="Siralama">
          <Input
            defaultValue={branch?.sortOrder ?? 0}
            min={0}
            name="sortOrder"
            type="number"
          />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Field label="Il">
          <Input defaultValue={branch?.city ?? ""} name="city" />
        </Field>
        <Field label="Ilce / bolge">
          <Input defaultValue={branch?.district ?? ""} name="district" />
        </Field>
        <Field label="Telefon">
          <Input defaultValue={branch?.phone ?? "0"} name="phone" />
        </Field>
        <Field label="E-posta">
          <Input
            defaultValue={branch?.email ?? "info@arackiralama.local"}
            name="email"
            type="email"
          />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Field label="Adres">
          <Textarea
            defaultValue={branch?.address ?? ""}
            name="address"
            placeholder="Müşteriye görünecek açık adres"
            required
          />
        </Field>
        <div className="grid gap-4">
          <Field label="Şube görseli">
            <Input
              accept="image/jpeg,image/png,image/webp,image/avif"
              name="image"
              type="file"
            />
            <span className="text-xs font-normal text-slate-500">
              Bilgisayarınızdan JPG, PNG, WEBP veya AVIF seçin. En fazla 8 MB.
            </span>
            {branch?.imageUrl ? (
              <span className="relative mt-2 block aspect-[16/7] overflow-hidden border border-slate-200 bg-slate-100">
                <Image
                  alt={`${branch.name} şube görseli`}
                  className="object-cover"
                  fill
                  sizes="320px"
                  src={branch.imageUrl}
                  unoptimized
                />
              </span>
            ) : null}
          </Field>
          <Field label="Puan">
            <Input
              defaultValue={branch?.rating?.toString() ?? "5.0"}
              max={5}
              min={0}
              name="rating"
              step="0.1"
              type="number"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            className="h-4 w-4 rounded border-slate-300"
            defaultChecked={branch?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Public sitede yayinda
        </label>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
