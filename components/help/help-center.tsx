"use client";

import { BookOpen, LifeBuoy, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShortcutList } from "@/components/ux/shortcut-list";
import { useUiStore } from "@/stores/ui-store";

export function HelpCenter() {
  const isOpen = useUiStore((state) => state.isHelpOpen);
  const setOpen = useUiStore((state) => state.setHelpOpen);

  return (
    <Sheet onOpenChange={setOpen} open={isOpen}>
      <SheetContent className="premium-scrollbar w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Central de Ajuda</SheetTitle>
          <SheetDescription>
            Atalhos, orientacoes operacionais e guias internos do Kynovra Sales.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-3 pb-6 sm:px-4">
          <div className="space-y-2">
            <label
              className="text-muted-foreground text-xs font-medium"
              htmlFor="help-search"
            >
              Buscar na central de ajuda
            </label>
            <Input
              className="premium-input"
              id="help-search"
              placeholder="Ajuda, atalhos ou boas práticas..."
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Primeiros passos", icon: BookOpen },
              { label: "Atendimento e suporte", icon: LifeBuoy },
              { label: "Boas práticas de IA", icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="glass-card rounded-lg p-3" key={item.label}>
                  <Icon
                    aria-hidden="true"
                    className="mb-3 size-5 text-blue-200"
                  />
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Conteúdo operacional preparado para documentação interna.
                  </p>
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Produtos: mantenha argumentos de venda e suporte atualizados.",
              "Campanhas: revise conversão por etapa antes de aumentar tráfego.",
              "IA: use fallback humano quando a confiança estiver baixa.",
              "Suporte: gere código de continuidade em casos longos.",
            ].map((tip) => (
              <div
                className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm"
                key={tip}
              >
                {tip}
              </div>
            ))}
          </div>
          <ShortcutList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
