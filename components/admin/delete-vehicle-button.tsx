"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteVehicleButton({
  action,
  vehicleId,
  vehicleTitle,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vehicleId: string;
  vehicleTitle: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const approved = window.confirm(
          `“${vehicleTitle}” aracı kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
        );

        if (!approved) {
          event.preventDefault();
        }
      }}
    >
      <input name="vehicleId" type="hidden" value={vehicleId} />
      <Button
        aria-label={`${vehicleTitle} aracını sil`}
        size="sm"
        title="Aracı kalıcı olarak sil"
        type="submit"
        variant="destructive"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Sil
      </Button>
    </form>
  );
}
