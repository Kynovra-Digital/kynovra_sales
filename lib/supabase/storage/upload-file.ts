"use client";

import { createClient } from "@/lib/supabase/client";

type UploadFileParams = {
  bucket: string;
  file: File;
  fileNamePrefix?: string;
  folder?: string;
};

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
  const extension = params.file.name.split(".").pop()?.toLowerCase() || "bin";
  const safePrefix = safeFilePart(params.fileNamePrefix ?? "file") || "file";
  const safeName = `${safePrefix}-${crypto.randomUUID()}.${extension}`;
  const path = params.folder ? `${params.folder}/${safeName}` : safeName;

  const { error: uploadError } = await supabase.storage
    .from(params.bucket)
    .upload(path, params.file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(params.bucket).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}
