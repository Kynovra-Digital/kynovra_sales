import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  MessageCircleMore,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center">
          <h1 className="font-semibold text-4xl">Bem-vindo ao Kynovra Sales</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Sua central inteligente para campanhas, atendimentos, IA, suporte e
            conversão em tempo real.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Venda com inteligência", icon: ChartNoAxesCombined },
            { title: "Atenda com IA e humanos", icon: Bot },
            { title: "Meça toda a jornada", icon: MessageCircleMore },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <div className="glass-card rounded-2xl p-6" key={card.title}>
                <Icon className="mb-5 size-7 text-blue-200" />
                <h2 className="font-semibold text-xl">{card.title}</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Guia inicial para orientar o primeiro acesso ao painel.
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button>
            Começar configuração
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
