"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type KnowledgeBaseRow = Tables<"knowledge_bases">;

const KNOWLEDGE_BUCKET = "knowledge-base-files";

export async function listKnowledgeBases(options?: {
  includeArchived?: boolean;
}) {
  const supabase = createClient();
  let query = supabase
    .from("knowledge_bases")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!options?.includeArchived) query = query.neq("status", "archived");
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createKnowledgeBase(input: {
  category?: string | null;
  description?: string | null;
  file: File;
  organizationId: string;
  status: "active" | "draft";
  title: string;
}) {
  validateMarkdownFile(input.file);
  const supabase = createClient();
  const safeName = input.file.name
    .replace(/\.md$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const storagePath = `${input.organizationId}/${crypto.randomUUID()}-${safeName || "base"}.md`;
  const contentText = await input.file.text();

  const { error: uploadError } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: "3600",
      contentType: "text/markdown",
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("knowledge_bases")
    .insert({
      category: input.category ?? null,
      content_text: contentText,
      description: input.description ?? null,
      file_name: input.file.name,
      file_size: input.file.size,
      mime_type: input.file.type || "text/markdown",
      organization_id: input.organizationId,
      public_url: null,
      status: input.status,
      storage_bucket: KNOWLEDGE_BUCKET,
      storage_path: storagePath,
      title: input.title,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(KNOWLEDGE_BUCKET).remove([storagePath]);
    throw error;
  }
  return data;
}

export async function updateKnowledgeBase(
  id: string,
  values: Partial<
    Pick<
      TablesUpdate<"knowledge_bases">,
      "category" | "description" | "status" | "title"
    >
  >,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .update({
      ...values,
      archived_at:
        values.status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export function archiveKnowledgeBase(id: string) {
  return updateKnowledgeBase(id, { status: "archived" });
}

function validateMarkdownFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".md")) {
    throw new Error("Selecione um arquivo Markdown com extensão .md.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("O arquivo Markdown deve ter no máximo 5 MB.");
  }
}
