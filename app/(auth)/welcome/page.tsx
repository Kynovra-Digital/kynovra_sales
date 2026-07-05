"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { createInitialOrganization } from "@/lib/supabase/queries/onboarding";

const cnpjDigitsRegex = /^\d{14}$/;

const onboardingSchema = z
  .object({
    about: z
      .string()
      .trim()
      .min(12, "Descreva a organização com pelo menos 12 caracteres."),
    cnpj: z.string().optional(),
    name: z.string().trim().min(2, "Informe o nome da organização."),
    personType: z.enum(["individual", "legal_entity"], {
      message: "Selecione o tipo de pessoa.",
    }),
  })
  .superRefine((data, context) => {
    if (data.personType !== "legal_entity") {
      return;
    }

    const digits = onlyDigits(data.cnpj ?? "");

    if (!cnpjDigitsRegex.test(digits)) {
      context.addIssue({
        code: "custom",
        message: "Informe um CNPJ válido com 14 dígitos.",
        path: ["cnpj"],
      });
    }
  });

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function WelcomePage() {
  const router = useRouter();
  const { isLoading, organization, profile, user } = useAuth();
  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      about: "",
      cnpj: "",
      name: "",
      personType: "legal_entity",
    },
    resolver: zodResolver(onboardingSchema),
  });
  const personType = form.watch("personType");
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login?next=/welcome");
      return;
    }

    if (profile?.organization_id && organization?.id) {
      router.replace("/dashboard");
    }
  }, [isLoading, organization?.id, profile?.organization_id, router, user]);

  async function onSubmit(values: OnboardingFormValues) {
    try {
      await createInitialOrganization({
        about: values.about,
        cnpj: onlyDigits(values.cnpj ?? ""),
        name: values.name,
        personType: values.personType,
      });

      toast.success("Organização criada com sucesso.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        "Não foi possível criar a organização. Verifique os dados e tente novamente.",
      );
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050A18] text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <Loader2 className="size-5 animate-spin text-blue-200" />
          <span className="text-blue-100 text-sm">Carregando acesso...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050A18] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgb(37_99_235_/_0.28),transparent_25rem),radial-gradient(circle_at_86%_28%,rgb(124_58_237_/_0.22),transparent_28rem),radial-gradient(circle_at_50%_100%,rgb(16_185_129_/_0.12),transparent_24rem)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 font-bold text-blue-100 shadow-[0_0_32px_rgb(37_99_235_/_0.24)]">
              K
            </span>
            <div>
              <span className="block font-bold tracking-[0.3em]">KYNOVRA</span>
              <span className="block text-blue-300/80 text-xs tracking-[0.45em]">
                SALES
              </span>
            </div>
          </div>

          <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-blue-100 text-xs">
            Primeiro acesso
          </p>
          <h1 className="max-w-xl font-semibold text-5xl leading-[1.04]">
            Configure a organização antes de entrar na operação.
          </h1>
          <p className="mt-5 max-w-xl text-blue-100/78 text-lg leading-8">
            O Kynovra Sales é multiempresa. Cada produto, campanha, ticket,
            configuração, IA e relatório precisa nascer vinculado a uma
            organização.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "Cria a organização com isolamento por RLS.",
              "Cria configurações gerais e IA padrão.",
              "Define você como Owner com acesso total.",
            ].map((item) => (
              <div
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm"
                key={item}
              >
                <CheckCircle2 className="size-4 text-kynovra-digital-green" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-[#080E1E]/90 p-5 shadow-[0_26px_90px_rgb(0_0_0_/_0.42)] backdrop-blur-2xl sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm">Onboarding obrigatório</p>
              <h2 className="mt-2 font-semibold text-2xl">
                Dados da organização
              </h2>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                Esses dados criam o isolamento da sua operação e liberam o
                painel administrativo.
              </p>
            </div>
            <span className="rounded-full border border-kynovra-digital-green/25 bg-kynovra-digital-green/10 p-2 text-kynovra-digital-green">
              <ShieldCheck className="size-5" />
            </span>
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="organization-name">Nome da organização</Label>
              <Input
                id="organization-name"
                placeholder="Ex: Kynovra Digital"
                {...form.register("name")}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization-about">Sobre a organização</Label>
              <Textarea
                className="min-h-32 resize-y"
                id="organization-about"
                placeholder="Descreva o que a organização vende, atende e opera."
                {...form.register("about")}
              />
              <FieldError message={form.formState.errors.about?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="person-type">Tipo de pessoa</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue(
                      "personType",
                      value as OnboardingFormValues["personType"],
                      { shouldDirty: true, shouldValidate: true },
                    )
                  }
                  value={personType}
                >
                  <SelectTrigger id="person-type">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="size-4" />
                        Pessoa Física
                      </span>
                    </SelectItem>
                    <SelectItem value="legal_entity">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="size-4" />
                        Pessoa Jurídica
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError
                  message={form.formState.errors.personType?.message}
                />
              </div>

              {personType === "legal_entity" ? (
                <div className="space-y-2">
                  <Label htmlFor="organization-cnpj">CNPJ</Label>
                  <Input
                    id="organization-cnpj"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    {...form.register("cnpj")}
                  />
                  <FieldError message={form.formState.errors.cnpj?.message} />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4 text-blue-100 text-sm leading-6">
              Ao concluir, o Supabase cria organização, configurações gerais,
              configuração global de IA e seu perfil como Owner.
            </div>

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight data-icon="inline-start" />
              )}
              Criar organização e entrar
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-destructive text-xs">{message}</p>;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}
