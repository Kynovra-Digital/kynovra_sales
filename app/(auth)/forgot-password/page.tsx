"use client";

import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/welcome`
            : undefined,
      });

      if (error) {
        toast.error("Não foi possível iniciar a recuperação agora.");
        return;
      }

      setSent(true);
      toast.success("Instruções de recuperação enviadas, se o e-mail existir.");
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6">
        <h1 className="font-semibold text-3xl">Recuperar acesso</h1>
        <p className="mt-3 text-muted-foreground">
          Informe seu e-mail cadastrado para receber as instruções de
          redefinição de senha.
        </p>
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              required
              type="email"
              value={email}
            />
          </div>
          <Button className="mt-5 w-full" disabled={isPending} type="submit">
            {isPending ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>
        {sent ? (
          <p className="mt-4 rounded-lg border border-kynovra-digital-green/30 bg-kynovra-digital-green/10 p-3 text-sm text-kynovra-digital-green">
            Se este e-mail estiver cadastrado, enviaremos as instruções para
            redefinir sua senha em instantes.
          </p>
        ) : null}
      </div>
    </main>
  );
}
