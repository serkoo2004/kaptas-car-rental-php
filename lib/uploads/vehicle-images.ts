import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_SIZE = 40 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

const imageTypes = {
  "image/avif": { extension: "avif", mimeType: "image/avif" },
  "image/jpeg": { extension: "jpg", mimeType: "image/jpeg" },
  "image/png": { extension: "png", mimeType: "image/png" },
  "image/webp": { extension: "webp", mimeType: "image/webp" },
} as const;

type SupportedMimeType = keyof typeof imageTypes;

export type StoredVehicleImage = {
  absolutePath: string;
  url: string;
};

export class VehicleImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleImageUploadError";
  }
}

export function vehicleImageFiles(
  formData: FormData,
  key = "images",
  options: { required?: boolean; single?: boolean } = {},
) {
  const files = formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (options.required && files.length === 0) {
    throw new VehicleImageUploadError("En az bir araç görseli seçin.");
  }

  if (options.single && files.length > 1) {
    throw new VehicleImageUploadError("Tek seferde yalnızca bir görsel değiştirilebilir.");
  }

  if (files.length > MAX_FILE_COUNT) {
    throw new VehicleImageUploadError(`Tek seferde en fazla ${MAX_FILE_COUNT} görsel yükleyebilirsiniz.`);
  }

  let totalSize = 0;

  for (const file of files) {
    if (!(file.type in imageTypes)) {
      throw new VehicleImageUploadError("Yalnızca JPG, PNG, WEBP veya AVIF görseller yüklenebilir.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new VehicleImageUploadError("Her görsel en fazla 8 MB olabilir.");
    }

    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    throw new VehicleImageUploadError("Toplam görsel boyutu 40 MB sınırını aşamaz.");
  }

  return files;
}

export async function storeVehicleImages(vehicleId: string, files: File[]) {
  const safeVehicleId = safeSegment(vehicleId);
  const directory = path.join(storageRoot(), safeVehicleId);
  await mkdir(directory, { recursive: true });

  const stored: StoredVehicleImage[] = [];

  try {
    for (const file of files) {
      const type = imageTypes[file.type as SupportedMimeType];
      const fileName = `${randomUUID()}.${type.extension}`;
      const absolutePath = path.join(directory, fileName);
      await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
      stored.push({
        absolutePath,
        url: `/api/media/vehicles/${safeVehicleId}/${fileName}`,
      });
    }

    return stored;
  } catch (error) {
    await Promise.all(stored.map((item) => unlink(item.absolutePath).catch(() => null)));
    throw error;
  }
}

export async function removeStoredVehicleImage(url: string) {
  const parts = managedImageParts(url);

  if (!parts) {
    return;
  }

  await unlink(path.join(storageRoot(), parts.vehicleId, parts.fileName)).catch(() => null);
}

export async function readStoredVehicleImage(vehicleId: string, fileName: string) {
  const safeVehicleId = safeSegment(vehicleId);
  const safeFileName = safeImageFileName(fileName);
  const filePath = path.join(storageRoot(), safeVehicleId, safeFileName);
  const extension = path.extname(safeFileName).slice(1).toLowerCase();
  const mimeType = Object.values(imageTypes).find((item) => item.extension === extension)?.mimeType;

  if (!mimeType) {
    throw new VehicleImageUploadError("Görsel biçimi desteklenmiyor.");
  }

  return {
    body: await readFile(filePath),
    mimeType,
  };
}

function storageRoot() {
  const configured = process.env.VEHICLE_IMAGE_STORAGE_DIR?.trim();
  return path.resolve(configured || path.join(process.cwd(), "storage", "vehicle-images"));
}

function managedImageParts(url: string) {
  const match = /^\/api\/media\/vehicles\/([a-zA-Z0-9_-]+)\/([a-f0-9-]+\.(?:avif|jpg|png|webp))$/.exec(url);

  if (!match) {
    return null;
  }

  return { fileName: match[2], vehicleId: match[1] };
}

function safeSegment(value: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new VehicleImageUploadError("Geçersiz araç kimliği.");
  }

  return value;
}

function safeImageFileName(value: string) {
  if (!/^[a-f0-9-]+\.(?:avif|jpg|png|webp)$/.test(value)) {
    throw new VehicleImageUploadError("Geçersiz görsel dosyası.");
  }

  return value;
}
