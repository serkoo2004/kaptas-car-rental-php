import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  APPROVED: "Onaylandi",
  CANCELLED: "Iptal",
  CONFIRMED: "Kesinleşti",
  COMPLETED: "Tamamlandi",
  CONTRACT_STAGE: "Sozlesme",
  DELIVERY_PLANNED: "Teslimat",
  OFFER_SENT: "Teklif gonderildi",
  PREPARING_OFFER: "Teklif hazirlaniyor",
  RECEIVED: "Alindi",
  REJECTED: "Reddedildi",
  REVIEWING: "Inceleniyor",
  REVISION_REQUESTED: "Revizyon",
  WAITING_DOCUMENTS: "Evrak bekliyor",
  ARCHIVED: "Arsiv",
  DRAFT: "Taslak",
  PUBLISHED: "Yayinda",
  EXPIRED: "Suresi doldu",
  HOLD: "Ödeme bekliyor",
  REQUESTED: "Talep edildi",
  UPLOADED: "Yuklendi",
};

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "APPROVED" || status === "COMPLETED" || status === "CONFIRMED"
      ? "success"
      : status === "REJECTED" || status === "CANCELLED"
        ? "danger"
        : status === "WAITING_DOCUMENTS" ||
            status === "REVISION_REQUESTED" ||
            status === "DRAFT" ||
            status === "REQUESTED" ||
            status === "UPLOADED" ||
            status === "HOLD"
          ? "warning"
          : "default";

  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}

export function statusLabel(status: string) {
  return statusLabels[status] ?? status;
}
