"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Shield, Trash2, UserRoundX, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import {
  banClient,
  listClients,
  transformClientToLead,
  unbanClient,
  updateClientRole,
} from "@/lib/supabase/queries/clients";

const PRIVILEGED_ROLES = [
  "admin",
  "superadmin",
  "supervisor",
  "management",
  "founder",
  "owner",
];

const AVAILABLE_ROLES = [
  { value: "user", label: "Usuário" },
  { value: "support", label: "Suporte" },
  { value: "attendance", label: "Atendimento" },
  { value: "admin", label: "Admin" },
  { value: "supervisor", label: "Supervisor" },
  { value: "management", label: "Gestor" },
  { value: "superadmin", label: "Superadmin" },
];

export default function ClientsPage() {
  const { profile: currentProfile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    full_name: string | null;
    role: string;
  } | null>(null);
  const [newRole, setNewRole] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const banMutation = useMutation({
    mutationFn: banClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente banido com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao banir cliente: " + error.message);
    },
  });

  const unbanMutation = useMutation({
    mutationFn: unbanClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente desbanido com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao desbanir cliente: " + error.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      updateClientRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cargo atualizado com sucesso");
      setRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar cargo: " + error.message);
    },
  });

  const transformMutation = useMutation({
    mutationFn: transformClientToLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente convertido para lead");
    },
    onError: (error: Error) => {
      toast.error("Erro ao converter para lead: " + error.message);
    },
  });

  const filteredClients = clients.filter((client) =>
    client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.id.toLowerCase().includes(search.toLowerCase())
  );

  function openRoleDialog(client: (typeof clients)[0]) {
    setSelectedClient(client);
    setNewRole(client.role);
    setRoleDialogOpen(true);
  }

  function confirmRoleChange() {
    if (!selectedClient || !newRole) return;
    updateRoleMutation.mutate({ id: selectedClient.id, role: newRole });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Gerencie contas de clientes sem acesso privilegiado"
        title="Clientes"
      />

      <div className="px-6">
        <Input
          className="max-w-sm bg-white/5 border-white/10"
          placeholder="Buscar por nome ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          description="Nenhum cliente encontrado"
          title="Sem clientes"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="relative flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-kynovra-tech-purple/20 text-sm font-bold">
                      {client.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() ?? "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {client.full_name ?? "Sem nome"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {client.id}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="text-muted-foreground hover:text-white"
                      size="icon"
                      variant="ghost"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {client.is_banned ? (
                      <DropdownMenuItem
                        onClick={() => unbanMutation.mutate(client.id)}
                      >
                        <UserCheck className="mr-2 size-4" />
                        Desbanir
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => banMutation.mutate(client.id)}
                      >
                        <UserRoundX className="mr-2 size-4" />
                        Banir
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openRoleDialog(client)}>
                      <Shield className="mr-2 size-4" />
                      Dar cargo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => transformMutation.mutate(client.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Transformar em lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    client.is_banned
                      ? "bg-destructive/20 text-destructive"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  {client.is_banned ? "Banido" : "Ativo"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Criado em{" "}
                  {new Date(client.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog onOpenChange={setRoleDialogOpen} open={roleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar cargo</DialogTitle>
            <DialogDescription>
              Alterar o cargo de{" "}
              <span className="font-medium text-white">
                {selectedClient?.full_name ?? "Cliente"}
              </span>
              . Se o cargo for admin ou superior, o cliente dejará de aparecer
              nesta aba.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Novo cargo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="w-full justify-between"
                  variant="outline"
                >
                  {
                    AVAILABLE_ROLES.find((r) => r.value === newRole)
                      ?.label ?? "Selecione..."
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar cargo..." />
                  <CommandList>
                    <CommandEmpty>Cargo não encontrado</CommandEmpty>
                    <CommandGroup>
                      {AVAILABLE_ROLES.map((role) => (
                        <CommandItem
                          key={role.value}
                          onSelect={() => setNewRole(role.value)}
                          value={role.value}
                        >
                          {role.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button
              onClick={confirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}