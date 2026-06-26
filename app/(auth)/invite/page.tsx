import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="glass-card w-full max-w-2xl rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-semibold text-3xl">
              Você foi convidado para o Kynovra Sales
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complete seus dados para acessar a organização.
            </p>
          </div>
          <StatusBadge label="Ativo" />
        </div>
        <div className="mt-6 grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-2">
          <Info label="Organização" value="Kynovra Demo" />
          <Info label="Cargo" value="Supervisor comercial" />
          <Info label="E-mail" value="membro@empresa.com" />
          <Info label="Quem convidou" value="Victor Souza" />
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Seu nome" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button className="md:col-span-2" type="button">
            Aceitar convite e acessar
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge label="Expirado" />
          <StatusBadge label="Arquivado" />
          <StatusBadge label="Online" />
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
