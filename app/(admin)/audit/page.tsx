"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Download,
  Fingerprint,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AuditLog,
  listAuditLogs,
  listAuditMembersByIds,
} from "@/lib/supabase/queries/audit";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";

const ALL_FILTER_VALUE = "all";
const CRITICAL_ACTIONS = [
  "accept",
  "close",
  "transfer",
  "confirm",
  "settings",
  "permission",
  "prompt",
  "ai",
  "archive",
  "expire",
  "generate",
];

const REDACTED_VALUE = "[ocultado por segurança]";
const SENSITIVE_METADATA_KEYS = [
  "access_token",
  "api_key",
  "apikey",
  "authorization",
  "bearer",
  "client_secret",
  "cookie",
  "credential",
  "jwt",
  "password",
  "private_key",
  "prompt",
  "refresh_token",
  "secret",
  "service_role",
  "session",
  "signature",
  "token",
  "webhook_secret",
];

const SENSITIVE_VALUE_PATTERNS = [
  /bearer\s+[a-z0-9._~+/=-]+/i,
  /eyj[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+/i,
  /sk-[a-z0-9_-]{16,}/i,
  /sb_(?:secret|service_role|publishable)_[a-z0-9_-]+/i,
  /supabase[a-z0-9_-]*service[a-z0-9_-]*role/i,
];

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState(ALL_FILTER_VALUE);
  const [levelFilter, setLevelFilter] = useState(ALL_FILTER_VALUE);

  const {
    data: logs = [],
    error,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: listAuditLogs,
    queryKey: queryKeys.audit.logs,
  });

  const actorIds = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map((log) => log.actor_id)
            .filter((actorId): actorId is string => Boolean(actorId)),
        ),
      ),
    [logs],
  );

  const { data: members = [] } = useQuery({
    enabled: actorIds.length > 0,
    queryFn: () => listAuditMembersByIds(actorIds),
    queryKey: [...queryKeys.audit.logs, "members", actorIds] as const,
  });

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const entityOptions = useMemo(
    () =>
      Array.from(
        new Set(logs.map((log) => log.entity_type).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesEntity =
        entityFilter === ALL_FILTER_VALUE || log.entity_type === entityFilter;
      const level = getAuditLevel(log.action);
      const matchesLevel =
        levelFilter === ALL_FILTER_VALUE || level.key === levelFilter;
      const matchesSearch = normalizedSearch
        ? [
            log.action,
            log.entity_type,
            log.entity_id,
            log.actor_id,
            getActorName(log.actor_id, memberById),
            formatMetadata(log.metadata),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesEntity && matchesLevel && matchesSearch;
    });
  }, [entityFilter, levelFilter, logs, memberById, search]);

  const summary = useMemo(() => {
    const critical = logs.filter(
      (log) => getAuditLevel(log.action).key === "critical",
    ).length;
    const entities = new Set(logs.map((log) => log.entity_type)).size;
    const actors = new Set(
      logs.map((log) => getActorName(log.actor_id, memberById)),
    ).size;

    return {
      actors,
      critical,
      entities,
      total: logs.length,
    };
  }, [logs, memberById]);

  const handleExport = () => {
    const csv = buildAuditCsv(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `kynovra-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="rounded-xl border-white/10 bg-white/[0.03]"
              disabled={isFetching}
              onClick={() => void refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={cn("mr-2 size-4", isFetching && "animate-spin")}
              />
              Atualizar
            </Button>
            <Button
              className="rounded-xl"
              disabled={filteredLogs.length === 0}
              onClick={handleExport}
              size="sm"
            >
              <Download className="mr-2 size-4" />
              Exportar CSV
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: "Admin" },
          { label: "Gestão" },
          { label: "Auditoria e Histórico" },
        ]}
        description="Acompanhe ações críticas registradas por RPCs, triggers e Edge Functions no Supabase."
        title="Auditoria e Histórico"
      />

      <section className="grid min-w-0 gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Eventos retornados pelo Supabase"
          glow="blue"
          title="Registros"
          value={String(summary.total)}
        />
        <MetricCard
          description="Ações sensíveis identificadas"
          glow="purple"
          title="Críticos"
          value={String(summary.critical)}
        />
        <MetricCard
          description="Tipos de entidade impactados"
          glow="green"
          title="Entidades"
          value={String(summary.entities)}
        />
        <MetricCard
          description="Membros ou automações registrados"
          glow="blue"
          title="Membros"
          value={String(summary.actors)}
        />
      </section>

      <Card className="data-panel min-w-0 gap-0 overflow-hidden p-0">
        <CardHeader className="border-white/5 border-b bg-white/[0.01] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <ShieldCheck className="size-5 text-primary" />
                Linha do tempo operacional
              </CardTitle>
              <CardDescription>
                Filtre por ação, entidade, membro ou metadados sem sair do
                painel.
              </CardDescription>
            </div>

            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-[1fr_180px_180px]">
              <div className="grid min-w-0 gap-2 sm:col-span-2 xl:col-span-1">
                <Label htmlFor="audit-search">Buscar no histórico</Label>
                <div className="relative min-w-0">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/60" />
                  <Input
                    className="h-10 rounded-xl border-white/10 bg-white/[0.03] pl-10"
                    id="audit-search"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ação, entidade, membro ou metadado"
                    value={search}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audit-entity-filter">Entidade</Label>
                <Select onValueChange={setEntityFilter} value={entityFilter}>
                  <SelectTrigger
                    className="h-10 w-full rounded-xl border-white/10 bg-white/[0.03]"
                    id="audit-entity-filter"
                  >
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>Todas</SelectItem>
                    {entityOptions.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {formatEntity(entity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audit-level-filter">Nível</Label>
                <Select onValueChange={setLevelFilter} value={levelFilter}>
                  <SelectTrigger
                    className="h-10 w-full rounded-xl border-white/10 bg-white/[0.03]"
                    id="audit-level-filter"
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER_VALUE}>Todos</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="info">Informativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? <AuditSkeleton /> : null}

          {!isLoading && error ? (
            <div className="p-5">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                Não foi possível carregar a auditoria. Verifique suas permissões
                e tente novamente.
              </div>
            </div>
          ) : null}

          {!isLoading && !error && logs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                description="A auditoria aparecerá aqui quando RPCs, triggers ou Edge Functions registrarem ações críticas."
                title="Nenhum log de auditoria registrado"
              />
            </div>
          ) : null}

          {!isLoading && !error && logs.length > 0 ? (
            <>
              <div className="flex items-center justify-between border-white/5 border-b px-5 py-3 text-muted-foreground text-xs">
                <span>
                  Exibindo {filteredLogs.length} de {logs.length} registros
                </span>
                <span>Fonte: public.audit_logs</span>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    description="Altere os filtros ou limpe a busca para ver outros eventos."
                    title="Nenhum registro encontrado"
                  />
                </div>
              ) : (
                <div className="hidden min-w-0 md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="px-5">Quando</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Membro</TableHead>
                        <TableHead className="text-right">Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const level = getAuditLevel(log.action);

                        return (
                          <TableRow
                            className="border-white/5 hover:bg-white/[0.03]"
                            key={log.id}
                          >
                            <TableCell className="px-5 text-muted-foreground">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-foreground">
                                  {formatDate(log.created_at)}
                                </span>
                                <span className="text-xs">
                                  {formatTime(log.created_at)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "flex size-8 items-center justify-center rounded-lg border",
                                    level.className,
                                  )}
                                >
                                  {level.key === "critical" ? (
                                    <AlertTriangle className="size-4" />
                                  ) : (
                                    <Activity className="size-4" />
                                  )}
                                </span>
                                <div className="flex min-w-0 flex-col">
                                  <span className="max-w-[220px] truncate font-medium">
                                    {formatAction(log.action)}
                                  </span>
                                  <Badge
                                    className="mt-1 w-fit"
                                    variant={
                                      level.key === "critical"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {level.label}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="font-medium">
                                  {formatEntity(log.entity_type)}
                                </span>
                                <span className="max-w-[180px] truncate text-muted-foreground text-xs">
                                  {log.entity_id ?? "Sem entidade vinculada"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <UserRound className="size-4" />
                                <span className="max-w-[160px] truncate">
                                  {getActorName(log.actor_id, memberById)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <MetadataDialog log={log} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredLogs.length > 0 ? (
                <div className="grid gap-3 p-4 md:hidden">
                  {filteredLogs.map((log) => {
                    const level = getAuditLevel(log.action);

                    return (
                      <article
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                        key={log.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {formatAction(log.action)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatDate(log.created_at)} às{" "}
                              {formatTime(log.created_at)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              level.key === "critical"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {level.label}
                          </Badge>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm">
                          <AuditMobileRow
                            icon={<Fingerprint className="size-4" />}
                            label="Entidade"
                            value={`${formatEntity(log.entity_type)} · ${log.entity_id ?? "sem ID"}`}
                          />
                          <AuditMobileRow
                            icon={<UserRound className="size-4" />}
                            label="Membro"
                            value={getActorName(log.actor_id, memberById)}
                          />
                          <MetadataDialog log={log} mobile />
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetadataDialog({
  log,
  mobile = false,
}: {
  log: AuditLog;
  mobile?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "rounded-xl border-white/10 bg-white/[0.03]",
            mobile && "w-full justify-center",
          )}
          size="sm"
          variant="outline"
        >
          <Info className="mr-2 size-4" />
          Ver metadados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Metadados da auditoria</DialogTitle>
          <DialogDescription>
            Dados técnicos vinculados à ação {formatAction(log.action)}.
            Informações sensíveis são ocultadas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <div className="grid gap-1">
            <span className="text-muted-foreground text-xs">Entidade</span>
            <span>{formatEntity(log.entity_type)}</span>
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground text-xs">
              ID da entidade
            </span>
            <span className="break-all">
              {log.entity_id ?? "Sem entidade vinculada"}
            </span>
          </div>
          <div className="grid gap-1">
            <span className="text-muted-foreground text-xs">
              Data do evento
            </span>
            <span>
              {formatDate(log.created_at)} às {formatTime(log.created_at)}
            </span>
          </div>
        </div>
        <pre className="max-h-[45vh] overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-5 text-muted-foreground">
          {formatMetadata(log.metadata, true)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}

function AuditSkeleton() {
  return (
    <div className="grid gap-3 p-5">
      {Array.from({ length: 6 }, (_, index) => `audit-skeleton-${index}`).map(
        (key) => (
          <div
            className="grid gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 md:grid-cols-[160px_1fr_1fr]"
            key={key}
          >
            <Skeleton className="h-5" />
            <Skeleton className="h-5" />
            <Skeleton className="h-5" />
          </div>
        ),
      )}
    </div>
  );
}

function AuditMobileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-white/[0.02] p-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="break-words text-sm">{value}</p>
      </div>
    </div>
  );
}

function getAuditLevel(action: string) {
  const normalized = action.toLowerCase();
  const isCritical = CRITICAL_ACTIONS.some((keyword) =>
    normalized.includes(keyword),
  );

  if (isCritical) {
    return {
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      key: "critical",
      label: "Crítico",
    } as const;
  }

  return {
    className: "border-primary/30 bg-primary/10 text-primary",
    key: "info",
    label: "Informativo",
  } as const;
}

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatEntity(entity: string) {
  return entity
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMetadata(metadata: AuditLog["metadata"], pretty = false) {
  if (
    !metadata ||
    (typeof metadata === "object" && Object.keys(metadata).length === 0)
  ) {
    return "Sem metadados adicionais";
  }

  try {
    return JSON.stringify(sanitizeMetadata(metadata), null, pretty ? 2 : 0);
  } catch {
    return "Metadados indisponíveis";
  }
}

function sanitizeMetadata(value: unknown, parentKey = ""): unknown {
  if (isSensitiveMetadataKey(parentKey)) {
    return REDACTED_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item, parentKey));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sanitizeMetadata(item, key),
      ]),
    );
  }

  if (typeof value === "string" && isSensitiveMetadataValue(value)) {
    return REDACTED_VALUE;
  }

  return value;
}

function isSensitiveMetadataKey(key: string) {
  const normalizedKey = key.toLowerCase().replaceAll(/[^a-z0-9]/g, "_");

  return SENSITIVE_METADATA_KEYS.some(
    (sensitiveKey) =>
      normalizedKey === sensitiveKey ||
      normalizedKey.includes(`_${sensitiveKey}`) ||
      normalizedKey.includes(`${sensitiveKey}_`),
  );
}

function isSensitiveMetadataValue(value: string) {
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

function getActorName(
  actorId: string | null,
  memberById: Map<string, { full_name: string | null }>,
) {
  if (!actorId) {
    return "Sistema";
  }

  return memberById.get(actorId)?.full_name?.trim() || "Membro sem nome";
}

function buildAuditCsv(logs: AuditLog[]) {
  const rows = logs.map((log) => [
    log.created_at,
    log.action,
    log.entity_type,
    log.entity_id ?? "",
    "",
    formatMetadata(log.metadata),
  ]);

  return [
    ["created_at", "action", "entity_type", "entity_id", "actor", "metadata"],
    ...rows,
  ]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
