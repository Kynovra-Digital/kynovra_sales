import type { TeamMemberWithPermissions } from "@/lib/supabase/queries/team";

export type OnboardingChecklistItem = {
  label: string;
  completed?: boolean;
};

export type OnboardingChecklistProps = {
  items: OnboardingChecklistItem[];
};

export type ConfirmationLevel = "light" | "medium" | "severe";

export type ConfirmationKeyword =
  | "CONFIRMAR"
  | "ARQUIVAR"
  | "REMOVER"
  | "BLOQUEAR"
  | "EXPIRAR";

export type ConfirmationLevelDialogProps = {
  level: ConfirmationLevel;
  actionLabel: string;
  keyword?: ConfirmationKeyword;
};

export type TeamGroupsPanelProps = {
  canManageTeam: boolean;
  organizationId: string;
};

export type TeamGroupFormState = {
  description: string;
  groupId?: string;
  memberIds: string[];
  name: string;
  permissionKeys: string[];
};

export type MemberPermissionFormState = {
  member: TeamMemberWithPermissions | null;
  permissionKeys: string[];
};
