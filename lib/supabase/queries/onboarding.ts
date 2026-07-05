"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";

export type CreateInitialOrganizationInput = {
  about: string;
  cnpj?: string;
  name: string;
  personType: "individual" | "legal_entity";
};

export type CreateInitialOrganizationResult = {
  organization_id: string;
  profile_role: string;
};

export async function createInitialOrganization(
  input: CreateInitialOrganizationInput,
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_initial_organization", {
    p_about: input.about,
    p_cnpj: input.personType === "legal_entity" ? (input.cnpj ?? "") : null,
    p_name: input.name,
    p_person_type: input.personType,
  });

  if (error) throw error;

  return normalizeCreateInitialOrganizationResult(data);
}

function normalizeCreateInitialOrganizationResult(
  value: Json,
): CreateInitialOrganizationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Resposta inválida ao criar organização.");
  }

  const record = value as Record<string, unknown>;
  const organizationId = String(record.organization_id ?? "");

  if (!organizationId) {
    throw new Error("Organização não foi criada.");
  }

  return {
    organization_id: organizationId,
    profile_role: String(record.profile_role ?? "owner"),
  };
}
