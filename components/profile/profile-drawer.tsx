"use client";

import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";

export function ProfileDrawer() {
  const router = useRouter();
  const { organization, profile, signOut, user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const isOpen = useUiStore((state) => state.isProfileOpen);
  const setOpen = useUiStore((state) => state.setProfileOpen);
  const displayName = profile?.full_name || user?.email || "Usuário";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleSignOut() {
    startTransition(async () => {
      try {
        await signOut();
        setOpen(false);
        toast.success("Você saiu da conta.");
        router.replace("/login");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível sair agora.");
      }
    });
  }

  return (
    <Sheet onOpenChange={setOpen} open={isOpen}>
      <SheetContent className="w-full sm:max-w-md lg:max-w-lg">
        <SheetHeader>
          <SheetTitle>Perfil do usuario</SheetTitle>
          <SheetDescription>
            Informações carregadas do Supabase Auth e do perfil da organização.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-3 pb-6 sm:px-4">
          <div className="glass-card flex items-center gap-3 rounded-lg p-3">
            <Avatar className="size-12">
              <AvatarFallback>{initials || "KS"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{displayName}</p>
              <p className="truncate text-muted-foreground text-sm">
                {user?.email ?? organization?.name ?? "Kynovra Sales"}
              </p>
            </div>
            <StatusBadge label="Online" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 p-3">
              <UserRound className="mb-3 size-5 text-blue-200" />
              <p className="font-medium text-sm">Cargo</p>
              <p className="text-muted-foreground text-sm">
                {profile?.role ?? "Sem perfil"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <ShieldCheck className="mb-3 size-5 text-purple-200" />
              <p className="font-medium text-sm">Organização</p>
              <p className="text-muted-foreground text-sm">
                {organization?.name ?? "Não carregada"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button className="flex-1">Editar perfil</Button>
            <Button className="flex-1" variant="outline">
              Segurança
            </Button>
          </div>
          <Button
            className="w-full justify-center gap-2"
            disabled={isPending}
            onClick={handleSignOut}
            variant="destructive"
          >
            <LogOut className="size-4" />
            {isPending ? "Saindo..." : "Sair da conta"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
