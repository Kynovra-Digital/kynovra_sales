"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type CampaignRow = Tables<"campaigns">;
export type CampaignProductRow = Tables<"campaign_products">;

export async function listCampaigns(options?: { includeArchived?: boolean }) {
  const supabase = createClient();
  let query = supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function createCampaign(
  campaign: Omit<CampaignRow, "created_at" | "id" | "updated_at">,
  productIds: string[] = [],
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert(campaign)
    .select("*")
    .single();

  if (error) throw error;

  if (productIds.length > 0) {
    const links: Array<
      Omit<CampaignProductRow, "created_at" | "id" | "sort_order"> & {
        sort_order: number;
      }
    > = productIds.map((productId, index) => ({
      campaign_id: data.id,
      organization_id: campaign.organization_id,
      product_id: productId,
      sort_order: index,
    }));

    const { error: linkError } = await supabase
      .from("campaign_products")
      .insert(links);

    if (linkError) throw linkError;
  }

  return data;
}

export async function getCampaignConfiguration(campaignId: string) {
  const supabase = createClient();
  const [campaignResult, productsResult] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", campaignId).single(),
    supabase
      .from("campaign_products")
      .select("product_id")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true }),
  ]);

  if (campaignResult.error) throw campaignResult.error;
  if (productsResult.error) throw productsResult.error;

  return {
    campaign: campaignResult.data,
    productIds: (productsResult.data ?? []).map((item) => item.product_id),
  };
}

export async function updateCampaign(
  id: string,
  campaign: Partial<Omit<CampaignRow, "created_at" | "id" | "updated_at">>,
  productIds?: string[],
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update(campaign)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  if (productIds) {
    const { error: deleteError } = await supabase
      .from("campaign_products")
      .delete()
      .eq("campaign_id", id);

    if (deleteError) throw deleteError;

    if (productIds.length > 0) {
      const links: Array<
        Omit<CampaignProductRow, "created_at" | "id" | "sort_order"> & {
          sort_order: number;
        }
      > = productIds.map((productId, index) => ({
        campaign_id: id,
        organization_id: data.organization_id,
        product_id: productId,
        sort_order: index,
      }));

      const { error: linkError } = await supabase
        .from("campaign_products")
        .insert(links);

      if (linkError) throw linkError;
    }
  }

  return data;
}

export function archiveCampaign(id: string) {
  return updateCampaign(id, { status: "archived" });
}
