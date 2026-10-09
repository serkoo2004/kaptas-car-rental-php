"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteVehicleImageButton({
  action,
  imageId,
  vehicleId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  imageId: string;
  vehicleId: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Bu araç görseli kalıcı olarak silinsin mi?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="imageId" type="hidden" value={imageId} />
      <input name="vehicleId" type="hidden" value={vehicleId} />
      <Button size="sm" type="submit" variant="destructive">
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Sil
      </Button>
    </form>
  );
}
