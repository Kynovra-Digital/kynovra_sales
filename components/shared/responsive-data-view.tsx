import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClientAppOrigin } from "@/lib/url/get-app-origin";
import { buildProductAttendanceLink } from "@/lib/url/public-links";

export type ModuleRow = {
  id: string;
  name: string;
  status?: string;
  [key: string]: unknown;
};

type ResponsiveDataViewProps = {
  columns: string[];
  rows: ModuleRow[];
  onOpen: (row: ModuleRow) => void;
  renderActions?: (row: ModuleRow) => ReactNode;
};

function getAttendanceLink(row: ModuleRow, origin: string) {
  const slug = row.Slug;

  if (!slug) return "";

  return buildProductAttendanceLink(origin, String(slug));
}

function readValue(row: ModuleRow, column: string, origin: string) {
  if (column === "Nome") return row.name;
  if (column === "Status") return row.Status ?? row.status;
  if (column === "Link de atendimento") return getAttendanceLink(row, origin);
  return row[column];
}

export function ResponsiveDataView({
  columns,
  rows,
  onOpen,
  renderActions,
}: ResponsiveDataViewProps) {
  const [origin, setOrigin] = useState("");
  const canCopyAttendanceLink = columns.includes("Link de atendimento");
  const secondaryColumns = columns.filter(
    (column) => !["Nome", "Status"].includes(column),
  );

  useEffect(() => {
    setOrigin(getClientAppOrigin());
  }, []);

  return (
    <>
      <div className="hidden min-w-0 overflow-hidden lg:block">
        <div className="premium-scrollbar overflow-x-auto">
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="border-white/10 bg-white/[0.025] hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    className="h-10 px-3 text-[10px] text-muted-foreground uppercase tracking-[0.12em]"
                    key={column}
                  >
                    {column}
                  </TableHead>
                ))}
                <TableHead className="h-10 px-3 text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  className="border-white/10 hover:bg-white/[0.04]"
                  key={row.id}
                >
                  {columns.map((column) => {
                    const value = readValue(row, column, origin);

                    return (
                      <TableCell
                        className="whitespace-nowrap px-3 py-3 text-sm"
                        key={column}
                      >
                        {column === "Status" ? (
                          <StatusBadge label={String(value)} />
                        ) : (
                          String(value ?? "--")
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="px-3">
                    <div className="flex flex-wrap gap-2">
                      {renderActions ? renderActions(row) : null}
                      {canCopyAttendanceLink && row.Slug ? (
                        <Button
                          aria-label="Copiar link de atendimento"
                          onClick={() => copyAttendanceLink(row)}
                          size="sm"
                          variant="outline"
                        >
                          Copiar link
                        </Button>
                      ) : null}
                      <Button
                        className="gap-1"
                        onClick={() => onOpen(row)}
                        size="sm"
                        variant="outline"
                      >
                        Abrir
                        <ChevronRight data-icon="inline-end" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 p-3 lg:hidden">
        {rows.map((row) => (
          <article
            className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition-colors hover:bg-white/[0.055]"
            key={row.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{row.name}</p>
                {secondaryColumns[0] ? (
                  <p className="mt-1 truncate text-muted-foreground text-xs">
                    {secondaryColumns[0]}:{" "}
                    {String(
                      readValue(row, secondaryColumns[0], origin) ?? "--",
                    )}
                  </p>
                ) : null}
              </div>
              <StatusBadge label={String(row.Status ?? row.status)} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {secondaryColumns.slice(1, 5).map((column) => (
                <div
                  className="rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5"
                  key={column}
                >
                  <p className="truncate text-muted-foreground">{column}</p>
                  <p className="mt-0.5 truncate">
                    {String(readValue(row, column, origin) ?? "--")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {renderActions ? renderActions(row) : null}
              {canCopyAttendanceLink && row.Slug ? (
                <Button
                  className="flex-1 gap-2"
                  onClick={() => copyAttendanceLink(row)}
                  size="sm"
                  variant="outline"
                >
                  Copiar link
                </Button>
              ) : null}
              <Button
                className="flex-1 gap-1"
                onClick={() => onOpen(row)}
                size="sm"
                variant="outline"
              >
                Abrir
                <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

async function copyAttendanceLink(row: ModuleRow) {
  const link = getAttendanceLink(row, getClientAppOrigin());
  await navigator.clipboard?.writeText(link);
  toast.success("Link de atendimento copiado.");
}
