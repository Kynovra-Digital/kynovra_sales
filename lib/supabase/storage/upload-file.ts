"use client";

import { createClient } from "@/lib/supabase/client";

type UploadFileParams = {
  bucket: string;
  file: File;
  fileNamePrefix?: string;
  folder?: string;
};

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function safeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function uploadFileToBucket(params: UploadFileParams) {
  const supabase = createClient();
  const extension = resolveSafeImageExtension(params.file);
  const safePrefix = safeFilePart(params.fileNamePrefix ?? "file") || "file";
  const safeName = `${safePrefix}-${crypto.randomUUID()}.${extension}`;
  const path = params.folder ? `${params.folder}/${safeName}` : safeName;

  const { error: uploadError } = await supabase.storage
    .from(params.bucket)
    .upload(path, params.file, {
      cacheControl: "3600",
      contentType: params.file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(params.bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}

function resolveSafeImageExtension(file: File) {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("Arquivo excede o limite de 5MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const expectedExtension = ALLOWED_IMAGE_TYPES.get(file.type);

  if (!expectedExtension) {
    throw new Error("Formato de imagem não permitido. Use JPG, PNG ou WebP.");
  }

  if (extension && ![expectedExtension, "jpeg"].includes(extension)) {
    throw new Error("Extensão do arquivo não corresponde ao tipo da imagem.");
  }

  return expectedExtension;
}
