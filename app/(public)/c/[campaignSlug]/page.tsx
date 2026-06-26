"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PoweredBy } from "@/components/public/powered-by";
import { Button } from "@/components/ui/button";
import { listPublicActiveProducts } from "@/lib/supabase/queries/public";

export default function CampaignShowcasePage() {
  const { data: products = [] } = useQuery({
    queryFn: listPublicActiveProducts,
    queryKey: ["public", "campaign-products"],
  });

  return (
    <main className="public-surface min-h-screen text-slate-950">
      <section className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-5 sm:px-5 md:py-8">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0d132b,#2563eb_56%,#7c3aed)] p-5 text-white shadow-[0_28px_80px_rgb(37_99_235_/_0.22)] md:p-8">
          <div className="-right-20 -top-24 absolute size-72 rounded-full bg-white/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 font-semibold">
              K
            </span>
            <span className="font-semibold tracking-[0.18em]">
              KYNOVRA SALES
            </span>
          </div>
          <h1 className="relative mt-6 max-w-3xl font-semibold text-3xl md:text-4xl">
            Campanha premium para produtos digitais de alta conversão
          </h1>
          <p className="relative mt-3 max-w-2xl text-blue-50 text-sm md:text-base">
            Escolha o produto ideal e entre em uma sala segura com um
            especialista.
          </p>
        </div>
        {products.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgb(15_23_42_/_0.08)] transition-transform hover:-translate-y-1"
                key={product.slug}
              >
                <div className="mb-4 flex aspect-[16/9] items-center justify-center rounded-xl bg-[radial-gradient(circle_at_30%_20%,#bfdbfe,transparent_35%),linear-gradient(135deg,#eef2ff,#f8fafc)]">
                  <div className="h-24 w-32 rounded-xl border border-white bg-white/70 shadow-xl" />
                </div>
                <h2 className="font-semibold text-lg">{product.name}</h2>
                <p className="mt-2 text-slate-600 text-sm">
                  {product.main_benefit ??
                    "Produto disponível para atendimento."}
                </p>
                <Button asChild className="mt-4 w-full sm:w-fit">
                  <Link href={`/p/${product.slug}`}>Ver detalhes</Link>
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
            Nenhum produto público ativo no momento.
          </div>
        )}
        <PoweredBy />
      </section>
    </main>
  );
}
