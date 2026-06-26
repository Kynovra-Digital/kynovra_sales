"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  actionPermissions,
  getPermissionLabel,
  visibleTabPermissions,
} from "@/lib/permissions/admin-permissions";
import {
  listTeamManagementData,
  saveMemberPermissions,
  saveTeamGroup,
  type TeamGroup,
  type TeamMemberWithPermissions,
} from "@/lib/supabase/queries/team";
import { queryKeys } from "@/lib/supabase/query-keys";

type TeamGroupsPanelProps = {
  canManageTeam: boolean;
  organizationId: string;
};

type TeamGroupFormState = {
  description: string;
  groupId?: string;
  memberIds: string[];
  name: string;
  permissionKeys: string[];
};

type MemberPermissionFormState = {
  member: TeamMemberWithPermissions | null;
  permissionKeys: string[];
};

const emptyFormState: TeamGroupFormState = {
  description: "",
  memberIds: [],
  name: "",
  permissionKeys: [],
};

export function TeamGroupsPanel({
  canManageTeam,
  organizationId,
}: TeamGroupsPanelProps) {
  const queryClient = useQueryClient();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isMemberSheetOpen, setMemberSheetOpen] = useState(false);
  const [formState, setFormState] =
    useState<TeamGroupFormState>(emptyFormState);
  const [memberFormState, setMemberFormState] =
    useState<MemberPermissionFormState>({
      member: null,
      permissionKeys: [],
    });
  const { data, isError, isLoading } = useQuery({
    queryFn: listTeamManagementData,
    queryKey: queryKeys.team.groups,
  });

  const availablePermissionKeys = useMemo(
    () =>
      new Set((data?.permissions ?? []).map((permission) => permission.key)),
    [data?.permissions],
  );
  const availableVisibleTabs = visibleTabPermissions.filter((permission) =>
    availablePermissionKeys.has(permission.key),
  );
  const availableActions = actionPermissions.filter((permission) =>
    availablePermissionKeys.has(permission.key),
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      return saveTeamGroup({
        description: formState.description,
        groupId: formState.groupId,
        memberIds: formState.memberIds,
        name: formState.name,
        organizationId,
        permissionKeys: formState.permissionKeys,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        "Não foi possível salvar a equipe. Verifique permissões e dados.",
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.team.groups }),
        queryClient.invalidateQueries({ queryKey: queryKeys.team.members }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.modules.record("team"),
        }),
      ]);
      toast.success("Equipe salva com sucesso.");
      closeSheet();
    },
  });
  const memberPermissionMutation = useMutation({
    mutationFn: () => {
      if (!organizationId) {
        throw new Error("Organização não carregada.");
      }

      if (!memberFormState.member) {
        throw new Error("Membro não selecionado.");
      }

      return saveMemberPermissions({
        organizationId,
        permissionKeys: memberFormState.permissionKeys,
        profileId: memberFormState.member.id,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Não foi possível salvar as permissões do membro.");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.team.groups }),
        queryClient.invalidateQueries({ queryKey: queryKeys.team.members }),
      ]);
      toast.success("Permissões do membro salvas.");
      closeMemberSheet();
    },
  });

  function openCreateSheet() {
    setFormState(emptyFormState);
    setSheetOpen(true);
  }

  function openEditSheet(group: TeamGroup) {
    setFormState({
      description: group.description ?? "",
      groupId: group.id,
      memberIds: group.memberIds,
      name: group.name,
      permissionKeys: group.permissionKeys,
    });
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setFormState(emptyFormState);
  }

  function openMemberSheet(member: TeamMemberWithPermissions) {
    setMemberFormState({
      member,
      permissionKeys: member.directPermissionKeys,
    });
    setMemberSheetOpen(true);
  }

  function closeMemberSheet() {
    setMemberSheetOpen(false);
    setMemberFormState({
      member: null,
      permissionKeys: [],
    });
  }

  function toggleMember(memberId: string) {
    setFormState((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  }

  function togglePermission(permissionKey: string) {
    setFormState((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((key) => key !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  }

  function toggleMemberPermission(permissionKey: string) {
    setMemberFormState((current) => ({
      ...current,
      permissionKeys: current.permissionKeys.includes(permissionKey)
        ? current.permissionKeys.filter((key) => key !== permissionKey)
        : [...current.permissionKeys, permissionKey],
    }));
  }

  const canSubmit =
    canManageTeam &&
    formState.name.trim().length > 0 &&
    Boolean(organizationId);

  return (
    <div className="data-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-white/10 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-base">Camada Equipe</h2>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Crie equipes, aloque membros e defina permissões operacionais. O
            owner tem acesso total; outros usuários só gerenciam se receberem
            permissão.
          </p>
        </div>
        <Button
          className="gap-2"
          disabled={!canManageTeam || !organizationId}
          onClick={openCreateSheet}
          size="sm"
        >
          <Plus className="size-4" />
          Nova equipe
        </Button>
      </div>

      {isLoading ? (
        <div className="p-4 text-muted-foreground text-sm">
          Carregando equipes e permissões...
        </div>
      ) : isError ? (
        <div className="p-4 text-destructive text-sm">
          Não foi possível carregar equipes. Verifique RLS, sessão e políticas
          do Supabase.
        </div>
      ) : data?.groups.length ? (
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {data.groups.map((group) => (
            <div
              className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
              key={group.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-sm">
                    {group.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                    {group.description || "Sem descrição operacional."}
                  </p>
                </div>
                <Button
                  disabled={!canManageTeam}
                  onClick={() => openEditSheet(group)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Edit3 className="size-3.5" />
                  Editar
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                  <p className="flex items-center gap-2 font-medium text-xs">
                    <UsersRound className="size-3.5 text-primary" />
                    Membros
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {group.members.length}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.members.slice(0, 4).map((member) => (
                      <Badge key={member.id} variant="secondary">
                        {member.full_name ?? member.role}
                      </Badge>
                    ))}
                    {group.members.length > 4 ? (
                      <Badge variant="outline">
                        +{group.members.length - 4}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                  <p className="flex items-center gap-2 font-medium text-xs">
                    <ShieldCheck className="size-3.5 text-kynovra-green" />
                    Permissões
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {group.permissionKeys.length}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.permissionKeys.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="outline">
                        {getPermissionLabel(permission)}
                      </Badge>
                    ))}
                    {group.permissionKeys.length > 3 ? (
                      <Badge variant="outline">
                        +{group.permissionKeys.length - 3}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
            <h3 className="font-semibold text-sm">Nenhuma equipe criada</h3>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground text-sm">
              Crie equipes para agrupar colaboradores e distribuir permissões
              sem conceder acesso total individualmente.
            </p>
            <Button
              className="mt-4 gap-2"
              disabled={!canManageTeam || !organizationId}
              onClick={openCreateSheet}
            >
              <Plus className="size-4" />
              Criar primeira equipe
            </Button>
          </div>
        </div>
      )}

      <Sheet onOpenChange={(open) => !open && closeSheet()} open={isSheetOpen}>
        <SheetContent className="grid w-screen max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl xl:max-w-5xl 2xl:max-w-6xl">
          <SheetHeader className="border-white/10 border-b px-4 py-4 sm:px-5">
            <SheetTitle>
              {formState.groupId ? "Editar equipe" : "Nova equipe"}
            </SheetTitle>
            <SheetDescription>
              Defina a equipe, aloque membros e selecione as permissões
              concedidas pelo owner ou por quem recebeu permissão.
            </SheetDescription>
          </SheetHeader>

          <div className="premium-scrollbar min-h-0 space-y-5 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-muted-foreground text-xs font-medium"
                  htmlFor="team-group-name"
                >
                  Nome da equipe
                </label>
                <Input
                  id="team-group-name"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={formState.name}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label
                  className="text-muted-foreground text-xs font-medium"
                  htmlFor="team-group-description"
                >
                  Descrição
                </label>
                <Textarea
                  id="team-group-description"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  value={formState.description}
                />
              </div>
            </div>

            <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
              <SelectionPanel title="Membros alocados">
                {(data?.members ?? []).map((member) => (
                  <div
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 hover:bg-white/[0.05] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                    key={member.id}
                  >
                    <Checkbox
                      checked={formState.memberIds.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {member.full_name ?? member.role}
                      </span>
                      <span className="block truncate text-muted-foreground text-xs">
                        {member.role} · {member.id.slice(0, 8)}
                      </span>
                    </span>
                    <Button
                      className="col-span-2 w-full shrink-0 sm:col-span-1 sm:w-auto"
                      disabled={!canManageTeam}
                      onClick={() => openMemberSheet(member)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <UserCog className="size-3.5" />
                      Permissões
                    </Button>
                  </div>
                ))}
              </SelectionPanel>

              <SelectionPanel title="Abas visíveis para a equipe">
                {availableVisibleTabs.map((permission) => (
                  <PermissionOptionRow
                    checked={formState.permissionKeys.includes(permission.key)}
                    key={permission.key}
                    onToggle={() => togglePermission(permission.key)}
                    permission={permission}
                  />
                ))}
              </SelectionPanel>

              <SelectionPanel title="Permissões de ação da equipe">
                {availableActions.map((permission) => (
                  <PermissionOptionRow
                    checked={formState.permissionKeys.includes(permission.key)}
                    key={permission.key}
                    onToggle={() => togglePermission(permission.key)}
                    permission={permission}
                  />
                ))}
              </SelectionPanel>
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 border-white/10 border-t p-4 sm:flex-row sm:justify-between">
            <Button
              className="w-full sm:w-auto"
              onClick={closeSheet}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!canSubmit || mutation.isPending}
              onClick={() => mutation.mutate()}
              type="button"
            >
              {mutation.isPending ? "Salvando..." : "Salvar equipe"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        onOpenChange={(open) => !open && closeMemberSheet()}
        open={isMemberSheetOpen}
      >
        <SheetContent className="grid w-screen max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl xl:max-w-4xl">
          <SheetHeader className="border-white/10 border-b px-4 py-4 sm:px-5">
            <SheetTitle>Permissões do membro</SheetTitle>
            <SheetDescription>
              Escolha abas e ações extras para{" "}
              {memberFormState.member?.full_name ??
                memberFormState.member?.role ??
                "este membro"}
              . Essas permissões somam às permissões da equipe.
            </SheetDescription>
          </SheetHeader>
          <div className="premium-scrollbar min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
            <SelectionPanel title="Abas visíveis para este membro">
              {availableVisibleTabs.map((permission) => (
                <PermissionOptionRow
                  checked={memberFormState.permissionKeys.includes(
                    permission.key,
                  )}
                  key={permission.key}
                  onToggle={() => toggleMemberPermission(permission.key)}
                  permission={permission}
                />
              ))}
            </SelectionPanel>
            <SelectionPanel title="Permissões de ação deste membro">
              {availableActions.map((permission) => (
                <PermissionOptionRow
                  checked={memberFormState.permissionKeys.includes(
                    permission.key,
                  )}
                  key={permission.key}
                  onToggle={() => toggleMemberPermission(permission.key)}
                  permission={permission}
                />
              ))}
            </SelectionPanel>
          </div>
          <SheetFooter className="flex-col gap-2 border-white/10 border-t p-4 sm:flex-row sm:justify-between">
            <Button
              className="w-full sm:w-auto"
              onClick={closeMemberSheet}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={!canManageTeam || memberPermissionMutation.isPending}
              onClick={() => memberPermissionMutation.mutate()}
              type="button"
            >
              {memberPermissionMutation.isPending
                ? "Salvando..."
                : "Salvar permissões"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PermissionOptionRow({
  checked,
  onToggle,
  permission,
}: {
  checked: boolean;
  onToggle: () => void;
  permission: { description: string; key: string; label: string };
}) {
  return (
    <div className="grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 hover:bg-white/[0.05]">
      <Checkbox
        checked={checked}
        className="mt-0.5"
        onCheckedChange={onToggle}
      />
      <span className="min-w-0">
        <span className="block break-words text-sm leading-snug">
          {permission.label}
        </span>
        <span className="mt-1 block break-words text-muted-foreground text-xs leading-relaxed">
          {permission.description}
        </span>
      </span>
    </div>
  );
}

function SelectionPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <div className="border-white/10 border-b px-4 py-3">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="premium-scrollbar grid max-h-[460px] min-w-0 gap-2 overflow-y-auto overflow-x-hidden p-3">
        {children}
      </div>
    </div>
  );
}
