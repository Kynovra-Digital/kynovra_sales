import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "amber" | "blue" | "gray" | "green" | "purple" | "red";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const statusToneByLabel: Record<string, StatusTone> = {
  "Agente contextual": "purple",
  "Aguardando aceite": "amber",
  "Aguardando retorno": "amber",
  Arquivado: "gray",
  Ativo: "green",
  "Campanha ativa": "blue",
  "Checkout acessado": "green",
  "Checkout enviado": "blue",
  Copiloto: "purple",
  Encerrado: "gray",
  Esgotado: "red",
  "Erro de IA": "red",
  Expirado: "red",
  "Fallback acionado": "purple",
  "IA automática": "purple",
  "Lead morno": "amber",
  "Lead perdido": "red",
  "Não resolvido": "red",
  Online: "green",
  Pausado: "gray",
  "Requer revisão": "amber",
  Resolvido: "green",
  "Venda confirmada": "green",
  accepted: "blue",
  closed: "gray",
  in_progress: "green",
  transferred: "amber",
  waiting: "amber",
};

const toneClassName: Record<StatusTone, string> = {
  green:
    "border-kynovra-digital-green/35 bg-kynovra-digital-green/10 text-kynovra-digital-green",
  blue: "border-kynovra-electric-blue/35 bg-kynovra-electric-blue/10 text-blue-200",
  purple:
    "border-kynovra-tech-purple/40 bg-kynovra-tech-purple/12 text-purple-200",
  amber: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  red: "border-destructive/40 bg-destructive/10 text-red-200",
  gray: "border-border bg-muted/35 text-muted-foreground",
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const resolvedTone: StatusTone =
    tone ??
    statusToneByLabel[label as keyof typeof statusToneByLabel] ??
    "gray";

  return (
    <Badge
      className={cn(
        "status-badge max-w-full gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap border",
        toneClassName[resolvedTone],
      )}
      variant="outline"
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label}
    </Badge>
  );
}
