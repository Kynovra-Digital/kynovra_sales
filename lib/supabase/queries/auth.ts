"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type AuthProfile = Tables<"profiles">;
export type AuthOrganization = Tables<"organizations">;

export type AuthContextData = {
  organization: AuthOrganization | null;
  permissions: string[];
  profile: AuthProfile | null;
  session: Session | null;
  user: User | null;
};

export async function getAuthContext(): Promise<AuthContextData> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const user = session?.user ?? null;

  if (!user) {
    return {
      organization: null,
      permissions: [],
      profile: null,
      session: null,
      user: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return {
      organization: null,
      permissions: [],
      profile: null,
      session,
      user,
    };
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (organizationError) {
    throw organizationError;
  }

  const { data: permissionsData, error: permissionsError } = await supabase.rpc(
    "current_user_permissions",
  );

  if (permissionsError) {
    console.warn(
      "Não foi possível carregar permissões do Supabase.",
      permissionsError,
    );
  }

  return {
    organization: organization ?? null,
    permissions: permissionsError
      ? resolveVisualPermissions(profile.role)
      : (permissionsData ?? []),
    profile,
    session,
    user,
  };
}

function resolveVisualPermissions(role: string) {
  if (["founder", "owner"].includes(role)) {
    return ["*"];
  }

  if (["admin", "management", "superadmin", "supervisor"].includes(role)) {
    return [
      "sales.ticket.accept",
      "sales.ticket.open",
      "sales.ticket.transfer",
      "sales.ticket.close",
      "support.ticket.accept",
      "support.ticket.open",
      "support.ticket.transfer",
      "support.ticket.close",
    ];
  }

  if (role === "support") {
    return [
      "support.ticket.accept",
      "support.ticket.open",
      "support.ticket.transfer",
      "support.ticket.close",
    ];
  }

  if (role === "attendance") {
    return [
      "sales.ticket.accept",
      "sales.ticket.open",
      "sales.ticket.transfer",
      "sales.ticket.close",
    ];
  }

  return [];
}
