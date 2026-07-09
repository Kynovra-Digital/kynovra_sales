"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/lib/supabase/database.types";

export type TeamMember = Tables<"profiles">;
export type TeamPermission = Tables<"permissions">;
export type TeamMemberWithPermissions = TeamMember & {
  directPermissionKeys: string[];
};
export type TeamGroup = Tables<"groups"> & {
  memberIds: string[];
  members: TeamMemberWithPermissions[];
  permissionKeys: string[];
};

export type TeamManagementData = {
  groups: TeamGroup[];
  members: TeamMemberWithPermissions[];
  permissions: TeamPermission[];
};

export async function listTeamMembers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listTeamManagementData(): Promise<TeamManagementData> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_team_management_data");

  if (error) throw error;

  return normalizeTeamManagementData(data);
}

function normalizeTeamManagementData(data: Json): TeamManagementData {
  const value = isRecord(data) ? data : {};

  return {
    groups: toArray(value.groups).map((group) => ({
      created_at: stringFromRecord(group, "created_at"),
      description: nullableStringFromRecord(group, "description"),
      id: stringFromRecord(group, "id"),
      memberIds: toStringArray(group.memberIds),
      members: toArray(group.members).map(normalizeMember),
      name: stringFromRecord(group, "name"),
      organization_id: stringFromRecord(group, "organization_id"),
      permissionKeys: toStringArray(group.permissionKeys),
      updated_at: stringFromRecord(group, "updated_at"),
    })),
    members: toArray(value.members).map(normalizeMember),
    permissions: toArray(value.permissions).map((permission) => ({
      created_at: stringFromRecord(permission, "created_at"),
      description: nullableStringFromRecord(permission, "description"),
      id: stringFromRecord(permission, "id"),
      key: stringFromRecord(permission, "key"),
    })),
  };
}

function normalizeMember(
  member: Record<string, Json>,
): TeamMemberWithPermissions {
  return {
    created_at: stringFromRecord(member, "created_at"),
    directPermissionKeys: toStringArray(member.directPermissionKeys),
    full_name: nullableStringFromRecord(member, "full_name"),
    id: stringFromRecord(member, "id"),
    organization_id: stringFromRecord(member, "organization_id"),
    role: stringFromRecord(member, "role"),
    updated_at: stringFromRecord(member, "updated_at"),
  };
}

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toArray(value: Json | undefined): Array<Record<string, Json>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function toStringArray(value: Json | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function stringFromRecord(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function nullableStringFromRecord(record: Record<string, Json>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export async function saveTeamGroup(params: {
  description?: string;
  groupId?: string;
  memberIds: string[];
  name: string;
  organizationId: string;
  permissionKeys: string[];
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_team_group", {
    p_description: params.description ?? undefined,
    p_group_id: params.groupId ?? "",
    p_member_ids: params.memberIds,
    p_name: params.name,
    p_organization_id: params.organizationId,
    p_permission_keys: params.permissionKeys,
  });

  if (error) throw error;
  return data;
}

export async function saveMemberPermissions(params: {
  organizationId: string;
  permissionKeys: string[];
  profileId: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_member_permissions", {
    p_organization_id: params.organizationId,
    p_permission_keys: params.permissionKeys,
    p_profile_id: params.profileId,
  });

  if (error) throw error;
  return data;
}
