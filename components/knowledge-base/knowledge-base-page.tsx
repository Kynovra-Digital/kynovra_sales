"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenText,
  Edit3,
  FileText,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  type ModuleRow,
  ResponsiveDataView,
} from "@/components/shared/responsive-data-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  archiveKnowledgeBase,
  createKnowledgeBase,
  type KnowledgeBaseRow,
  listKnowledgeBases,
  updateKnowledgeBase,
} from "@/lib/supabase/queries/knowledge-bases";

const queryKey = ["knowledge-bases", "list"] as const;

export function KnowledgeBasePage() {
  const { organization, profile } = useAuth();
  const organizationId = organization?.id ?? profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<KnowledgeBaseRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("draft");
  const [file, setFile] = useState<File | null>(null);

  const { data: bases = [], isLoading } = useQuery({
    queryFn: () => listKnowledgeBases(),
    queryKey,
  });
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return bases;
    return bases.filter((base) =>
      `${base.title} ${base.description ?? ""} ${base.category ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [bases, query]);
  const rows = useMemo<ModuleRow[]>(
    () =>
      filtered.map((base) => ({
        Arquivo: base.file_name,
        Categoria: base.category ?? "Sem categoria",
        Status: base.status,
        id: base.id,
        name: base.title,
        status: base.status,
      })),
    [filtered],
  );

  const createMutation = useMutation({
    mutationFn: () => {
      if (!organizationId || !file || !title.trim()) {
        throw new Error("Informe título e arquivo Markdown.");
      }
      return createKnowledgeBase({
        category: category.trim() || null,
        description: description.trim() || null,
        file,
        organizationId,
        status,
        title: title.trim(),
      });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Falha ao criar base.",
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      resetCreate();
      toast.success("Base de conhecimento criada.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Base não selecionada.");
      return updateKnowledgeBase(selected.id, {
        category: selected.category,
        description: selected.description,
        status: selected.status,
        title: selected.title,
      });
    },
    onError: () => toast.error("Não foi possível atualizar a base."),
    onSuccess: async (base) => {
      await queryClient.invalidateQueries({ queryKey });
      setSelected(base);
      toast.success("Base atualizada.");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveKnowledgeBase(id),
    onError: () => toast.error("Não foi possível arquivar a base."),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      setSelected(null);
      toast.success("Base arquivada.");
    },
  });

  function resetCreate() {
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setCategory("");
    setStatus("draft");
    setFile(null);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <PageHeader
        actions={
          <Button
            className="gap-2"
            onClick={() => setCreateOpen(true)}
            size="sm"
          >
            <Plus data-icon="inline-start" />
            Nova base
          </Button>
        }
        breadcrumbs={[{ label: "Admin" }, { label: "Base de Conhecimentos" }]}
        description="Centralize documentação Markdown usada pelas IAs de venda e suporte dos produtos."
        title="Base de Conhecimentos"
      />

      <section className="data-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-white/10 border-b p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <BookOpenText className="size-4 text-blue-200" /> Bases
              cadastradas
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {isLoading
                ? "Carregando..."
                : `${bases.length} bases disponíveis.`}
            </p>
          </div>
          <div className="premium-input flex h-10 min-w-0 items-center gap-2 rounded-lg border px-3 sm:w-80">
            <Search className="size-4 text-muted-foreground" />
            <Input
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome ou categoria"
              value={query}
            />
          </div>
        </div>
        <ResponsiveDataView
          columns={["Nome", "Categoria", "Status", "Arquivo"]}
          onOpen={(row) =>
            setSelected(bases.find((base) => base.id === row.id) ?? null)
          }
          renderActions={(row) => (
            <>
              <Button
                className="gap-1"
                onClick={() =>
                  setSelected(bases.find((base) => base.id === row.id) ?? null)
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Edit3 className="size-3.5" />
                Editar
              </Button>
              <Button
                className="gap-1"
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate(row.id)}
                size="sm"
                type="button"
                variant="destructive"
              >
                <Trash2 className="size-3.5" />
                Excluir
              </Button>
            </>
          )}
          rows={rows}
        />
      </section>

      <Sheet
        onOpenChange={(open) => !open && resetCreate()}
        open={isCreateOpen}
      >
        <SheetContent className="grid w-screen grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-xl">
          <SheetHeader className="border-white/10 border-b p-5">
            <SheetTitle>Nova base de conhecimento</SheetTitle>
            <SheetDescription>
              Envie um arquivo Markdown de até 5 MB.
            </SheetDescription>
          </SheetHeader>
          <div className="premium-scrollbar grid min-h-0 gap-4 overflow-y-auto p-5">
            <Field label="Nome">
              <Input
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </Field>
            <Field label="Categoria">
              <Input
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              />
            </Field>
            <Field label="Status">
              <Select
                onValueChange={(value) =>
                  setStatus(value as "active" | "draft")
                }
                value={status}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Arquivo .md">
              <Input
                accept=".md,text/markdown,text/plain"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </Field>
          </div>
          <SheetFooter className="border-white/10 border-t p-4">
            <Button onClick={resetCreate} variant="outline">
              Cancelar
            </Button>
            <Button
              disabled={createMutation.isPending || !file || !title.trim()}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Enviando..." : "Criar base"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet
        onOpenChange={(open) => !open && setSelected(null)}
        open={Boolean(selected)}
      >
        <SheetContent className="grid w-screen grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <SheetHeader className="border-white/10 border-b p-5">
            <SheetTitle>{selected?.title}</SheetTitle>
            <SheetDescription>{selected?.file_name}</SheetDescription>
          </SheetHeader>
          {selected ? (
            <div className="premium-scrollbar grid min-h-0 gap-4 overflow-y-auto p-5">
              <Field label="Nome">
                <Input
                  onChange={(event) =>
                    setSelected({ ...selected, title: event.target.value })
                  }
                  value={selected.title}
                />
              </Field>
              <Field label="Descrição">
                <Textarea
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      description: event.target.value,
                    })
                  }
                  value={selected.description ?? ""}
                />
              </Field>
              <Field label="Categoria">
                <Input
                  onChange={(event) =>
                    setSelected({ ...selected, category: event.target.value })
                  }
                  value={selected.category ?? ""}
                />
              </Field>
              <Field label="Status">
                <Select
                  onValueChange={(value) =>
                    setSelected({ ...selected, status: value })
                  }
                  value={selected.status}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="archived">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <p className="flex items-center gap-2 font-medium text-sm">
                  <FileText className="size-4" /> Conteúdo Markdown
                </p>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-muted-foreground text-xs">
                  {selected.content_text || "Conteúdo não armazenado em cache."}
                </pre>
              </div>
            </div>
          ) : null}
          <SheetFooter className="flex-row justify-between border-white/10 border-t p-4">
            <Button
              disabled={archiveMutation.isPending}
              onClick={() => selected && archiveMutation.mutate(selected.id)}
              variant="destructive"
            >
              <Trash2 /> Excluir
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              <Save /> Salvar alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2 text-muted-foreground text-xs font-medium">
      <span>{label}</span>
      {children}
    </div>
  );
}
