"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PoweredBy } from "@/components/public/powered-by";
import { Button } from "@/components/ui/button";
import { getPublicProductBySlug } from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";

export default function ProductPreSalePage() {
  const params = useParams<{ productSlug: string }>();
  const { data: product, isLoading } = useQuery({
    queryFn: () => getPublicProductBySlug(params.productSlug),
    queryKey: queryKeys.products.public(params.productSlug),
  });

  if (isLoading) {
    return (
      <main className="public-surface grid min-h-screen place-items-center text-slate-950">
        <p>Carregando produto...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="public-surface grid min-h-screen place-items-center text-slate-950">
        <p>Produto não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="public-surface min-h-screen text-slate-950">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-5 md:py-8 lg:grid-cols-2">
        <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-white bg-[radial-gradient(circle_at_30%_20%,#bfdbfe,transparent_34%),linear-gradient(135deg,#e0e7ff,#f8fafc)] p-4 shadow-[0_22px_70px_rgb(15_23_42_/_0.1)] md:min-h-96">
          <div className="w-full max-w-72 rounded-2xl border border-white bg-white/85 p-4 shadow-2xl">
            <div className="h-36 rounded-xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)]" />
            <p className="mt-4 font-semibold">{product.name}</p>
            <p className="mt-1 text-slate-500 text-sm">Oferta segura</p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-semibold text-3xl md:text-4xl">{product.name}</h1>
          <p className="mt-3 text-xl text-slate-700 md:text-2xl">
            {product.main_benefit ??
              "Atendimento seguro para finalizar sua compra."}
          </p>
          <p className="mt-3 text-slate-600 text-sm md:text-base">
            {product.support_info ??
              "Fale com um especialista para receber orientação personalizada."}
          </p>
          <p className="mt-5 font-semibold text-2xl md:text-3xl">
            {typeof product.price === "number"
              ? product.price.toLocaleString("pt-BR", {
                  currency: "BRL",
                  style: "currency",
                })
              : "Preço sob consulta"}
          </p>
          <Button asChild className="mt-5 w-full sm:w-fit">
            <Link href={`/a/${product.slug}`}>Adquirir Produto</Link>
          </Button>
        </div>
      </section>
      <PoweredBy />
    </main>
  );
}
