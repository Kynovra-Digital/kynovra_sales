"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ONBOARDING_TUTORIAL_STORAGE_KEY =
  "kynovra-sales:onboarding-tutorial-seen";

const tutorialSteps = [
  "Configure os dados da organização, logo e preferências gerais.",
  "Cadastre produtos e publique links canônicos de atendimento.",
  "Ajuste a IA global em Configurações Gerais antes de operar.",
  "Acompanhe filas de vendas e suporte pelo Command Center.",
  "Use o sino da topbar para notificações e a Auditoria para rastreabilidade.",
];

export function OnboardingTutorialModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_TUTORIAL_STORAGE_KEY)) return;
    setOpen(true);
  }, []);

  function closeTutorial() {
    localStorage.setItem(ONBOARDING_TUTORIAL_STORAGE_KEY, "true");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
          return;
        }

        closeTutorial();
      }}
    >
      <DialogContent className="max-w-2xl overflow-hidden border-primary/20 bg-[#0D132B] p-0 text-white shadow-[0_0_60px_rgb(37_99_235_/_0.24)] sm:max-w-2xl">
        <div className="relative overflow-hidden p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.25),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.22),transparent_34%)]" />
          <div className="relative grid gap-6">
            <DialogHeader className="gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-blue-100 shadow-[0_0_24px_rgb(37_99_235_/_0.24)]">
                <Sparkles className="size-5" />
              </span>
              <div className="grid gap-2">
                <DialogTitle className="text-2xl font-black tracking-tight text-white">
                  Boas-vindas ao Kynovra Sales
                </DialogTitle>
                <DialogDescription className="max-w-xl text-blue-100/70">
                  Este tutorial aparece na primeira entrada para orientar a
                  configuração inicial do seu Command Center.
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="grid gap-3">
              {tutorialSteps.map((step, index) => (
                <div
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm"
                  key={step}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-kynovra-digital-green/25 bg-kynovra-digital-green/10 text-kynovra-digital-green">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200/45">
                      Passo {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/88">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:justify-between">
          <Button
            className="rounded-xl border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={closeTutorial}
            variant="outline"
          >
            Pular tutorial
          </Button>
          <Button
            asChild
            className="rounded-xl bg-primary font-bold text-white shadow-[0_0_20px_rgb(37_99_235_/_0.28)] hover:bg-primary/90"
            onClick={closeTutorial}
          >
            <Link href="/settings">Começar pelas configurações</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
