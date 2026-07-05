"use client";

import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  CreditCard,
  Globe,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  RefreshCw,
  Search,
  Share2,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PoweredBy } from "@/components/public/powered-by";
import { PublicAccessModal } from "@/components/public/public-access-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { storefrontPrimaryCategories } from "@/lib/store/categories";
import { createClient } from "@/lib/supabase/client";
import {
  getPublicStorefront,
  getPublicStorefrontCategories,
  type PublicStorefrontCampaign,
  type PublicStorefrontCategory,
  type PublicStorefrontProduct,
} from "@/lib/supabase/queries/public";
import { queryKeys } from "@/lib/supabase/query-keys";

const STORE_VISITOR_SESSION_KEY = "kynovra-store:visitor-session";
const STORE_ALL_CATEGORIES_FILTER = "__all_categories__";

export default function StorefrontPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<
    string | null
  >(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { data, isError, isLoading } = useQuery({
    queryFn: getPublicStorefront,
    queryKey: queryKeys.publicStorefront.detail,
  });
  const { data: categories = [] } = useQuery({
    queryFn: getPublicStorefrontCategories,
    queryKey: queryKeys.publicStorefront.categories,
  });
  const campaigns = data?.campaigns ?? [];
  const normalizedSearch = normalizeSearch(searchTerm);
  const visibleCampaigns = useMemo(
    () => filterCampaignsBySearch(campaigns, normalizedSearch),
    [campaigns, normalizedSearch],
  );
  const selectedSubcategory = useMemo(
    () =>
      categories
        .flatMap((category) =>
          category.subcategories.map((subcategory) => ({
            ...subcategory,
            parentName: category.name,
            parentSlug: category.slug,
          })),
        )
        .find((subcategory) => subcategory.slug === selectedSubcategorySlug) ??
      null,
    [categories, selectedSubcategorySlug],
  );
  const isAllCategoriesSelected =
    selectedSubcategorySlug === STORE_ALL_CATEGORIES_FILTER;
  const filteredProductsBySubcategory = useMemo(() => {
    if (!selectedSubcategory) return [];

    return dedupeProductsBySlug(
      visibleCampaigns
        .flatMap((campaign) => campaign.products)
        .filter((product) =>
          isProductInSubcategory(product, selectedSubcategory.slug),
        ),
    );
  }, [selectedSubcategory, visibleCampaigns]);
  const visibleProducts = useMemo(
    () =>
      dedupeProductsBySlug(
        visibleCampaigns.flatMap((campaign) => campaign.products),
      ),
    [visibleCampaigns],
  );
  const subcategoryProductCounts = useMemo(
    () => buildSubcategoryProductCounts(visibleProducts, categories),
    [categories, visibleProducts],
  );
  const campaignsWithBanners = campaigns.filter(
    (campaign) => campaign.banner_url,
  );
  const heroCampaigns = campaignsWithBanners.length
    ? campaignsWithBanners
    : campaigns;
  const spotlightProducts = visibleCampaigns
    .flatMap((campaign) => campaign.products)
    .slice(0, 6);
  const hasSearch = normalizedSearch.length > 0;

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: sessionData }) => {
      const user = sessionData.session?.user ?? null;
      setCurrentUser(user);

      if (!user && !hasValidStoreVisitorSession()) {
        setShowAccessModal(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <PublicAccessModal
        description="Faça login com e-mail e senha ou continue com Google para ver ofertas, produtos e campanhas da Kynovra."
        onOpenChange={setShowAccessModal}
        open={showAccessModal}
        redirectPath="/loja"
        title="Como deseja continuar?"
      />
      <header className="sticky top-0 z-30 w-full border-fuchsia-500/45 border-b bg-[#050507]/92 shadow-[0_0_28px_rgba(168,85,247,0.18)] backdrop-blur-xl">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 md:px-5">
          <Link className="flex shrink-0 items-center gap-2" href="/">
            <span className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-500 font-black text-sm text-white">
              N
            </span>
            <span className="font-black text-[10px] uppercase tracking-[0.18em] text-white">
              Kynovra
            </span>
          </Link>

          <label className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-white/70 shadow-[inset_0_0_24px_rgba(255,255,255,0.03)] transition focus-within:border-fuchsia-400/70 focus-within:bg-white/[0.09]">
            <Search className="size-4 shrink-0" />
            <span className="sr-only">Buscar produtos</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar produtos, campanhas e ofertas..."
              type="search"
              value={searchTerm}
            />
          </label>

          <div className="flex items-center gap-2 text-white/80">
            <Link
              aria-label="Abrir suporte"
              className="flex size-9 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white"
              href="/suporte"
            >
              <Headphones className="size-4" />
            </Link>
            <button
              aria-label="Notificações"
              className="hidden size-9 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white sm:flex"
              type="button"
            >
              <Bell className="size-4" />
            </button>
            {currentUser ? (
              <StorefrontUserMenu
                onSignedOut={() => setShowAccessModal(true)}
                user={currentUser}
              />
            ) : (
              <button
                className="rounded-md border border-white/25 px-3 py-1.5 font-bold text-[11px] text-white transition hover:border-fuchsia-400 hover:bg-white/10"
                onClick={() => setShowAccessModal(true)}
                type="button"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        <StoreCategoryTopbar
          categories={categories}
          onSelectSubcategory={setSelectedSubcategorySlug}
          selectedSubcategorySlug={selectedSubcategorySlug}
        />
      </header>

      {selectedSubcategory || isAllCategoriesSelected ? null : (
        <Hero campaigns={heroCampaigns} />
      )}

      <div id="topo" className="mx-auto max-w-7xl px-4 pb-10 lg:px-6">
        <section className="py-8" id="campanhas">
          {isLoading ? (
            <StorefrontState text="Carregando loja pública..." />
          ) : null}
          {isError ? (
            <StorefrontState text="Não foi possível carregar a loja agora. Tente novamente em alguns instantes." />
          ) : null}
          {!isLoading && !isError && campaigns.length === 0 ? (
            <StorefrontState text="Nenhuma campanha ativa disponível na loja neste momento." />
          ) : null}
          {!isLoading && !isError && campaigns.length > 0 && hasSearch ? (
            <div className="rounded-none border border-white/10 bg-[#0b0b0b] px-4 py-3 text-center text-slate-300 text-sm">
              Mostrando resultados para{" "}
              <span className="font-bold text-white">
                “{searchTerm.trim()}”
              </span>
            </div>
          ) : null}
          {!isLoading &&
          !isError &&
          campaigns.length > 0 &&
          hasSearch &&
          visibleCampaigns.length === 0 ? (
            <StorefrontState text="Nenhum produto ou campanha encontrado para essa busca." />
          ) : null}
        </section>

        {selectedSubcategory || isAllCategoriesSelected ? (
          <SubcategoryShowcase
            categories={categories}
            onClear={() => setSelectedSubcategorySlug(null)}
            onSelectAll={() =>
              setSelectedSubcategorySlug(STORE_ALL_CATEGORIES_FILTER)
            }
            onSelectSubcategory={setSelectedSubcategorySlug}
            products={
              isAllCategoriesSelected
                ? visibleProducts
                : filteredProductsBySubcategory
            }
            productCounts={subcategoryProductCounts}
            title={
              isAllCategoriesSelected
                ? "Todas as categorias"
                : (selectedSubcategory?.name ?? "")
            }
            description={
              isAllCategoriesSelected
                ? "Todos os produtos ativos disponíveis na loja."
                : "Produtos filtrados pela subcategoria selecionada na loja."
            }
            parentName={selectedSubcategory?.parentName ?? null}
            selectedSubcategorySlug={selectedSubcategory?.slug ?? null}
          />
        ) : null}

        {!selectedSubcategory &&
        !isAllCategoriesSelected &&
        spotlightProducts.length ? (
          <section className="py-7" id="ofertas">
            <SectionTitle eyebrow="Best offers" title="Produtos em destaque" />
            <ProductGrid products={spotlightProducts} />
          </section>
        ) : null}

        {!selectedSubcategory &&
          !isAllCategoriesSelected &&
          visibleCampaigns.map((campaign) => (
            <CampaignShowcase campaign={campaign} key={campaign.id} />
          ))}
      </div>
      <StorefrontFooter />
    </main>
  );
}

function StorefrontUserMenu({
  onSignedOut,
  user,
}: {
  onSignedOut: () => void;
  user: User;
}) {
  const profile = getStorefrontUserProfile(user);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const canAccessAdminPanel = ["owner", "superadmin", "admin"].includes(
    profileRole ?? "",
  );

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          console.warn("Não foi possível carregar o cargo do perfil.", error);
          setProfileRole(null);
          return;
        }

        setProfileRole(data?.role ?? null);
      });

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  async function handleSignOut() {
    setIsSigningOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setIsSigningOut(false);

    if (error) {
      toast.error("Não foi possível sair da conta agora.");
      return;
    }

    toast.success("Você saiu da conta.");
    onSignedOut();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`Perfil de ${profile.name}`}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1 pr-2 pl-1 text-white transition hover:border-fuchsia-400/60 hover:bg-white/[0.1]"
          type="button"
        >
          <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 font-black text-sm uppercase shadow-[0_0_18px_rgba(168,85,247,0.35)]">
            {profile.avatarUrl ? (
              <Image
                alt={`Foto de perfil de ${profile.name}`}
                className="object-cover"
                fill
                sizes="32px"
                src={profile.avatarUrl}
              />
            ) : (
              profile.initial
            )}
          </span>
          <ChevronDown className="size-4 text-white/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-48 border-white/10 bg-[#08080b] p-1.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
      >
        <DropdownMenuItem
          className="cursor-pointer gap-2 rounded-md px-3 py-2 font-black text-red-300 uppercase tracking-[0.14em] focus:bg-red-500/10 focus:text-red-200"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="size-4" />
          {isSigningOut ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
        {canAccessAdminPanel ? (
          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-semibold text-white/85 text-sm transition focus:bg-white/10 focus:text-white"
              href="/dashboard"
            >
              <LayoutDashboard className="size-4 text-fuchsia-300" />
              Painel
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="px-3 py-2 text-white/65 text-xs">
          <p className="truncate font-semibold text-white">{profile.name}</p>
          {user.email ? <p className="truncate">{user.email}</p> : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getStorefrontUserProfile(user: User) {
  const metadata = user.user_metadata ?? {};
  const name =
    getStringMetadata(metadata, "full_name") ||
    getStringMetadata(metadata, "name") ||
    user.email ||
    "Visitante";
  const avatarUrl =
    getStringMetadata(metadata, "avatar_url") ||
    getStringMetadata(metadata, "picture");
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return { avatarUrl, initial, name };
}

function getStringMetadata(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function hasValidStoreVisitorSession() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const rawSession = window.localStorage.getItem(STORE_VISITOR_SESSION_KEY);

    if (!rawSession) {
      return false;
    }

    const session = JSON.parse(rawSession) as {
      email?: string;
      expiresAt?: number;
      name?: string;
      visitorId?: string;
    };

    if (
      typeof session.visitorId !== "string" ||
      !session.visitorId ||
      typeof session.name !== "string" ||
      !session.name.trim() ||
      typeof session.email !== "string" ||
      !session.email.trim() ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(STORE_VISITOR_SESSION_KEY);
      return false;
    }

    return true;
  } catch {
    window.localStorage.removeItem(STORE_VISITOR_SESSION_KEY);
    return false;
  }
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function filterCampaignsBySearch(
  campaigns: PublicStorefrontCampaign[],
  normalizedSearch: string,
) {
  if (!normalizedSearch) {
    return campaigns;
  }

  return campaigns.reduce<PublicStorefrontCampaign[]>((filtered, campaign) => {
    const campaignMatches = [
      campaign.name,
      campaign.headline,
      campaign.description,
      campaign.slug,
    ].some((value) => normalizeSearch(value ?? "").includes(normalizedSearch));
    const matchingProducts = campaign.products.filter((product) =>
      [
        product.name,
        product.category,
        product.main_benefit,
        product.public_cta,
        product.public_description,
        product.public_headline,
        product.short_description,
        product.slug,
        product.subcategory,
        product.support_info,
      ].some((value) =>
        normalizeSearch(value ?? "").includes(normalizedSearch),
      ),
    );

    if (!campaignMatches && matchingProducts.length === 0) {
      return filtered;
    }

    filtered.push({
      ...campaign,
      products: campaignMatches ? campaign.products : matchingProducts,
    });
    return filtered;
  }, []);
}

function isProductInSubcategory(
  product: PublicStorefrontProduct,
  subcategorySlug: string,
) {
  const normalizedSubcategorySlug = normalizeSearch(subcategorySlug);
  return [product.subcategory, product.category]
    .map((value) => normalizeSearch(value ?? ""))
    .some(
      (value) =>
        value === normalizedSubcategorySlug ||
        value.includes(normalizedSubcategorySlug),
    );
}

function dedupeProductsBySlug(products: PublicStorefrontProduct[]) {
  const productsBySlug = new Map<string, PublicStorefrontProduct>();

  for (const product of products) {
    productsBySlug.set(product.slug, product);
  }

  return Array.from(productsBySlug.values());
}

function buildSubcategoryProductCounts(
  products: PublicStorefrontProduct[],
  categories: PublicStorefrontCategory[],
) {
  const counts = new Map<string, number>();

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const count = products.filter((product) =>
        isProductInSubcategory(product, subcategory.slug),
      ).length;
      counts.set(subcategory.slug, count);
    }
  }

  return counts;
}

function Hero({ campaigns }: { campaigns: PublicStorefrontCampaign[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = campaigns.length ? campaigns : [undefined];
  const visibleIndex = activeIndex < slides.length ? activeIndex : 0;
  const campaign = slides[visibleIndex];
  const heroProduct = campaign?.products[0];
  const hasMultipleSlides = slides.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 9000);

    return () => window.clearInterval(interval);
  }, [hasMultipleSlides, slides.length]);

  return (
    <section
      aria-label="Banners de campanhas ativas"
      className="relative overflow-hidden border-white/10 border-b bg-[#070707]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_45%,rgba(37,99,235,.42),transparent_28%),radial-gradient(circle_at_70%_30%,rgba(124,58,237,.34),transparent_30%),linear-gradient(90deg,rgba(2,6,23,.88),rgba(2,6,23,.18),rgba(0,0,0,.86))]" />
      {slides.map((slide, index) =>
        slide?.banner_url ? (
          <Image
            alt={`Banner da campanha ${slide.name}`}
            className={`object-cover transition duration-700 ease-out ${index === visibleIndex ? "opacity-55" : "opacity-0"}`}
            fill
            key={slide.id}
            priority={index === 0}
            sizes="100vw"
            src={slide.banner_url}
          />
        ) : null,
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/45 to-black/88" />

      <div className="relative grid min-h-[28rem] items-center px-5 py-10 md:px-10 lg:min-h-[34rem]">
        <div className="max-w-xl">
          <p className="font-bold text-red-500 text-xs uppercase tracking-[0.24em]">
            {campaign ? "Campanha em destaque" : "Loja pública"}
          </p>
          <h1 className="mt-3 font-black text-4xl uppercase leading-[0.95] tracking-tight md:text-6xl">
            {campaign?.headline || campaign?.name || "Evolve your experience"}
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-none bg-white px-5 font-black text-black hover:bg-red-50"
            >
              <a href={campaign ? `#${campaign.slug}` : "#campanhas"}>
                Comprar agora
                <ArrowRight className="size-4" />
              </a>
            </Button>
            {heroProduct ? (
              <Button
                asChild
                className="rounded-none border-white/30 bg-black/35 px-5 font-black text-white hover:bg-white/10"
                variant="outline"
              >
                <Link href={`/a/${heroProduct.slug}`}>
                  Falar com especialista
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {hasMultipleSlides ? (
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center px-5">
          <fieldset className="flex min-w-0 items-center gap-2 border-0 p-0">
            <legend className="sr-only">Selecionar banner da campanha</legend>
            {slides.map((slide, index) => (
              <button
                aria-label={`Ir para o banner ${index + 1}${slide ? `: ${slide.name}` : ""}`}
                aria-current={index === visibleIndex ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all ${index === visibleIndex ? "w-8 bg-red-500" : "w-2.5 bg-white/35 hover:bg-white/70"}`}
                key={slide?.id ?? "empty-slide"}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </fieldset>
        </div>
      ) : null}
    </section>
  );
}

function CampaignShowcase({
  campaign,
}: {
  campaign: PublicStorefrontCampaign;
}) {
  const remainingProducts = campaign.products.slice(0, 5);

  return (
    <section className="py-7" id={campaign.slug}>
      <PromoBanner campaign={campaign} />
      <div className="mt-8">
        <SectionTitle eyebrow="New arrivals" title={campaign.name} />
        {remainingProducts.length ? (
          <ProductGrid products={remainingProducts} />
        ) : (
          <StorefrontState text="Esta campanha ainda não possui produtos ativos vinculados." />
        )}
      </div>
    </section>
  );
}

function PromoBanner({ campaign }: { campaign: PublicStorefrontCampaign }) {
  const sectionBannerUrl = campaign.section_banner_url ?? campaign.banner_url;

  return (
    <div className="overflow-hidden border border-white/10 bg-black">
      {sectionBannerUrl ? (
        <Image
          alt={`Banner da campanha ${campaign.name}`}
          className="block h-auto w-full"
          height={640}
          sizes="(max-width: 768px) 100vw, 1280px"
          src={sectionBannerUrl as string}
          width={2458}
        />
      ) : null}
    </div>
  );
}

function ProductGrid({ products }: { products: PublicStorefrontProduct[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function SubcategoryShowcase({
  categories,
  description,
  onClear,
  onSelectAll,
  onSelectSubcategory,
  parentName,
  products,
  productCounts,
  selectedSubcategorySlug,
  title,
}: {
  categories: PublicStorefrontCategory[];
  description: string;
  onClear: () => void;
  onSelectAll: () => void;
  onSelectSubcategory: (slug: string) => void;
  parentName: string | null;
  products: PublicStorefrontProduct[];
  productCounts: Map<string, number>;
  selectedSubcategorySlug: string | null;
  title: string;
}) {
  return (
    <section className="py-7" id="ofertas">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-white/10 border-b pb-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-slate-500 text-xs">
            <button
              className="transition hover:text-white"
              onClick={onClear}
              type="button"
            >
              Início
            </button>
            <span>/</span>
            {parentName ? (
              <>
                <span>{parentName}</span>
                <span>/</span>
              </>
            ) : null}
            <span className="text-slate-300">{title}</span>
          </div>
          <h1 className="font-black text-2xl text-white md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-slate-400 text-sm">{description}</p>
        </div>
        <Button
          className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
          onClick={onClear}
          type="button"
          variant="outline"
        >
          Limpar filtro
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="grid gap-4 self-start lg:sticky lg:top-28">
          <StoreCategorySidebar
            categories={categories}
            onSelectAll={onSelectAll}
            onSelectSubcategory={onSelectSubcategory}
            productCounts={productCounts}
            selectedSubcategorySlug={selectedSubcategorySlug}
          />
          <StoreSidebarBenefits />
        </div>
        <div className="min-w-0">
          {products.length ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-300 text-sm">
                  {products.length} produto{products.length === 1 ? "" : "s"}{" "}
                  encontrado
                  {products.length === 1 ? "" : "s"}
                </p>
                {parentName ? (
                  <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 font-bold text-blue-100 text-xs">
                    {parentName}
                  </span>
                ) : null}
              </div>
              <ProductGrid products={products} />
            </>
          ) : (
            <StorefrontState text="Nenhum produto ativo encontrado." />
          )}
        </div>
      </div>
    </section>
  );
}

function StoreCategorySidebar({
  categories,
  onSelectAll,
  onSelectSubcategory,
  productCounts,
  selectedSubcategorySlug,
}: {
  categories: PublicStorefrontCategory[];
  onSelectAll: () => void;
  onSelectSubcategory: (slug: string) => void;
  productCounts: Map<string, number>;
  selectedSubcategorySlug: string | null;
}) {
  const selectedParentSlug = categories.find((category) =>
    category.subcategories.some(
      (subcategory) => subcategory.slug === selectedSubcategorySlug,
    ),
  )?.slug;
  const [openCategorySlug, setOpenCategorySlug] = useState(
    selectedParentSlug ?? categories[0]?.slug ?? "",
  );

  useEffect(() => {
    if (!selectedParentSlug) return;
    setOpenCategorySlug(selectedParentSlug);
  }, [selectedParentSlug]);

  return (
    <aside className="border border-white/10 bg-[#07080b] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <button
        className="flex w-full items-center justify-between gap-3 border-white/10 border-b px-3 py-3 text-left font-extrabold text-[12px] text-white transition hover:bg-white/[0.03] hover:text-blue-300"
        onClick={onSelectAll}
        type="button"
      >
        <span>Todas as categorias</span>
        <span className="text-slate-500">
          <ChevronDown className="size-3.5 -rotate-90" />
        </span>
      </button>
      <div className="grid">
        {categories.map((category) => (
          <div
            className="border-white/10 border-b last:border-b-0"
            key={category.slug}
          >
            <button
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left font-semibold text-[12px] text-slate-200 transition hover:bg-white/[0.03] hover:text-white"
              onClick={() =>
                setOpenCategorySlug((currentSlug) =>
                  currentSlug === category.slug ? "" : category.slug,
                )
              }
              type="button"
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <ChevronDown
                className={`size-3 shrink-0 transition ${openCategorySlug === category.slug ? "rotate-180 text-blue-400" : "text-slate-600"}`}
              />
            </button>
            {openCategorySlug === category.slug ? (
              <div className="grid pb-2">
                {category.subcategories.length ? (
                  category.subcategories.map((subcategory) => {
                    const isActive =
                      subcategory.slug === selectedSubcategorySlug;
                    const count = productCounts.get(subcategory.slug) ?? 0;

                    return (
                      <button
                        className={`relative flex items-center justify-between gap-3 border-l-2 py-1.5 pr-3 pl-4 text-left font-medium text-[11px] transition ${
                          isActive
                            ? "border-blue-500 bg-blue-500/[0.06] text-white"
                            : "border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-white"
                        }`}
                        key={subcategory.slug}
                        onClick={() => onSelectSubcategory(subcategory.slug)}
                        type="button"
                      >
                        <span className="min-w-0 truncate">
                          {subcategory.name}
                        </span>
                        <span className="shrink-0 text-slate-600">
                          ({count})
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className="px-4 py-2 text-slate-600 text-[11px]">
                    Sem subcategorias
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  );
}

function StoreSidebarBenefits() {
  const benefits = [
    {
      description: "Condições informadas na oferta",
      icon: Truck,
      title: "Entrega",
    },
    {
      description: "Avaliações e retornos de clientes",
      icon: MessageCircle,
      title: "Feedbacks",
    },
    {
      description: "Regras exibidas em cada produto",
      icon: RefreshCw,
      title: "Troca e devolução",
    },
    {
      description: "Formas disponíveis no atendimento",
      icon: CreditCard,
      title: "Pagamento",
    },
    {
      description: "Produtos selecionados pela loja",
      icon: Tag,
      title: "Ofertas selecionadas",
    },
  ];

  return (
    <article className="border border-white/10 bg-[#07080b] px-4 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;

        return (
          <div
            className="flex items-center gap-3 border-white/10 border-b py-3 last:border-b-0"
            key={benefit.title}
          >
            <Icon className="size-5 shrink-0 text-blue-400/80" />
            <div className="min-w-0">
              <p className="font-black text-[11px] text-white leading-none">
                {benefit.title}
              </p>
              <p className="mt-1 text-[10px] text-slate-500 leading-none">
                {benefit.description}
              </p>
            </div>
          </div>
        );
      })}
    </article>
  );
}

function StorefrontFooter() {
  const categoryLinks = [
    "Tecnologia",
    "Casa e Utilidades",
    "Beleza e Bem-estar",
    "Moda e Acessórios",
    "Produtos Digitais",
  ];
  const customerLinks = [
    "Minha conta",
    "Acompanhar atendimento",
    "Suporte pós-venda",
    "Política de troca",
    "Perguntas frequentes",
  ];
  const paymentLabels = ["PIX", "VISA", "MASTER", "AMEX"];

  return (
    <footer className="mt-10 border-white/10 border-t bg-[#050507] text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1fr] lg:px-6">
        <div>
          <Link className="inline-flex items-center gap-2" href="/">
            <span className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-fuchsia-500 font-black text-white text-sm">
              N
            </span>
            <span className="font-black text-white text-xs uppercase tracking-[0.18em]">
              Kynovra Store
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-slate-500 text-xs leading-relaxed">
            Marketplace premium com ofertas reais, produtos ativos e atendimento
            conectado à operação Kynovra Sales.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              aria-label="Instagram"
              className="flex size-9 items-center justify-center border border-white/10 text-slate-500 transition hover:border-blue-400/50 hover:text-blue-300"
              href="https://www.instagram.com/"
              rel="noreferrer"
              target="_blank"
            >
              <Globe className="size-4" />
            </a>
            <a
              aria-label="Facebook"
              className="flex size-9 items-center justify-center border border-white/10 text-slate-500 transition hover:border-blue-400/50 hover:text-blue-300"
              href="https://www.facebook.com/"
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle className="size-4" />
            </a>
            <a
              aria-label="YouTube"
              className="flex size-9 items-center justify-center border border-white/10 text-slate-500 transition hover:border-blue-400/50 hover:text-blue-300"
              href="https://www.youtube.com/"
              rel="noreferrer"
              target="_blank"
            >
              <Share2 className="size-4" />
            </a>
          </div>
        </div>

        <FooterLinkGroup title="Categorias" links={categoryLinks} />
        <FooterLinkGroup title="Atendimento" links={customerLinks} />

        <div>
          <h2 className="font-black text-[12px] text-white uppercase tracking-[0.16em]">
            Pagamento seguro
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {paymentLabels.map((label) => (
              <span
                className="border border-white/10 bg-white/[0.03] px-3 py-2 text-center font-black text-[10px] text-slate-300 tracking-[0.12em]"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-5 border border-white/10 bg-white/[0.03] p-3">
            <p className="font-bold text-[11px] text-white">Receba novidades</p>
            <p className="mt-1 text-slate-500 text-[11px] leading-relaxed">
              Ofertas e campanhas selecionadas direto na vitrine.
            </p>
          </div>
        </div>
      </div>

      <div className="border-white/10 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-[11px] sm:flex-row lg:px-6">
          <PoweredBy />
          <p className="text-slate-600">
            © {new Date().getFullYear()} Kynovra Digital. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({ links, title }: { links: string[]; title: string }) {
  return (
    <div>
      <h2 className="font-black text-[12px] text-white uppercase tracking-[0.16em]">
        {title}
      </h2>
      <ul className="mt-4 grid gap-2 text-xs">
        {links.map((link) => (
          <li key={link}>
            <a
              className="text-slate-500 transition hover:text-blue-300"
              href="#topo"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoreCategoryTopbar({
  categories,
  onSelectSubcategory,
  selectedSubcategorySlug,
}: {
  categories: PublicStorefrontCategory[];
  onSelectSubcategory: (slug: string | null) => void;
  selectedSubcategorySlug: string | null;
}) {
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  return (
    <nav
      aria-label="Categorias principais"
      className="relative z-[80] overflow-visible border-fuchsia-500/35 border-t bg-[#111113]/96 shadow-[inset_0_-1px_0_rgba(236,72,153,0.45)]"
    >
      <div className="no-scrollbar relative z-[81] flex w-full items-center gap-1 overflow-x-auto px-3 md:justify-center md:overflow-visible md:px-5">
        <button
          className="flex h-9 shrink-0 items-center gap-1.5 border-red-500 border-b-2 px-3 font-black text-[11px] text-red-500 uppercase tracking-[0.08em]"
          onClick={() => onSelectSubcategory(null)}
          type="button"
        >
          <HomeIcon />
          Início
        </button>
        {storefrontPrimaryCategories.map((category) => {
          const subcategories =
            categoriesBySlug.get(category.slug)?.subcategories ?? [];

          return (
            <div
              className="group relative flex h-9 shrink-0 items-center"
              key={category.slug}
            >
              <a
                className="flex h-9 items-center gap-1.5 border-transparent border-b-2 px-3 font-black text-[11px] text-slate-300 uppercase tracking-[0.08em] transition hover:border-fuchsia-500/70 hover:text-white focus-visible:border-fuchsia-500/70 focus-visible:text-white focus-visible:outline-none"
                href="#ofertas"
              >
                {category.name}
                <ChevronDown className="size-3 transition group-hover:rotate-180 group-focus-within:rotate-180" />
              </a>
              <div className="invisible absolute top-full left-0 z-[90] min-w-56 translate-y-2 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="mt-1 rounded-2xl border border-fuchsia-400/20 bg-[#09090d]/98 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45),0_0_28px_rgba(168,85,247,0.18)] backdrop-blur-xl">
                  {subcategories.length ? (
                    <div className="grid gap-1">
                      {subcategories.map((subcategory) => (
                        <button
                          className={`rounded-xl px-3 py-2 text-left font-semibold text-xs transition focus-visible:outline-none ${
                            selectedSubcategorySlug === subcategory.slug
                              ? "bg-fuchsia-500/15 text-white"
                              : "text-slate-300 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white"
                          }`}
                          key={subcategory.slug}
                          onClick={() => onSelectSubcategory(subcategory.slug)}
                          type="button"
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="block px-3 py-2 text-slate-500 text-xs">
                      Nenhuma categoria cadastrada.
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-3.5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M10.7 2.3a1 1 0 0 0-1.4 0l-7 6.6A1 1 0 0 0 3 10.6h1v5.9A1.5 1.5 0 0 0 5.5 18H8v-5h4v5h2.5a1.5 1.5 0 0 0 1.5-1.5v-5.9h1a1 1 0 0 0 .7-1.7l-7-6.6Z" />
    </svg>
  );
}

function ProductCard({ product }: { product: PublicStorefrontProduct }) {
  const price =
    product.show_price_publicly && typeof product.price === "number"
      ? product.price.toLocaleString("pt-BR", {
          currency: "BRL",
          style: "currency",
        })
      : "No atendimento";
  const oldPrice =
    product.show_price_publicly && typeof product.price === "number"
      ? (product.price * 1.72).toLocaleString("pt-BR", {
          currency: "BRL",
          style: "currency",
        })
      : null;
  const shortTitle = product.name;

  return (
    <article className="group bg-[#080808] pb-3">
      <Link href={`/p/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#f4f0ea]">
          {product.image_url ? (
            <Image
              alt={product.name}
              className="object-cover transition duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 768px) 50vw, 220px"
              src={product.image_url}
            />
          ) : null}
        </div>
        <div className="px-1 pt-2">
          <h3 className="line-clamp-1 font-semibold text-[13px] leading-tight text-white group-hover:text-red-200">
            <span className="mr-1 rounded-[2px] bg-[#ffe100] px-1 py-0.5 font-black text-[9px] text-black uppercase">
              Choice
            </span>
            {shortTitle}
          </h3>
          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="font-black text-[22px] leading-none text-white">
              {price}
            </span>
            {oldPrice ? (
              <span className="text-slate-500 text-xs line-through">
                {oldPrice}
              </span>
            ) : null}
            {oldPrice ? (
              <span className="font-bold text-red-500 text-xs">-42%</span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
            <span className="flex items-center gap-0.5 text-white">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  className="size-2.5 fill-current"
                  key={`star-${product.id}-${index}`}
                />
              ))}
            </span>
            <span>4.8</span>
            <span className="text-slate-500">|</span>
            <span>3.000+ vendidos</span>
          </div>
          <p className="mt-1 line-clamp-1 text-[#c37d55] text-xs">
            Top selling na loja Kynovra
          </p>
          <p className="mt-1 font-semibold text-slate-300 text-xs">
            Bundle deals &gt;
          </p>
        </div>
      </Link>
    </article>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 text-center">
      <p className="font-black text-red-500 text-xs uppercase tracking-[0.24em]">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-black text-lg uppercase tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function StorefrontState({ text }: { text: string }) {
  return (
    <div className="border border-white/10 bg-[#0b0b0b] p-8 text-center text-slate-300 text-sm">
      {text}
    </div>
  );
}
