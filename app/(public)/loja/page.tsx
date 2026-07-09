"use client";

import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  BellDot,
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
import { listNotifications } from "@/lib/supabase/queries/notifications";
import { queryKeys } from "@/lib/supabase/query-keys";

const STORE_ALL_CATEGORIES_FILTER = "__all_categories__";

export default function StorefrontPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<
    string | null
  >(null);
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
  const selectedPrimaryCategory = useMemo(
    () =>
      categories.find(
        (category) => category.slug === selectedSubcategorySlug,
      ) ?? null,
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
  const filteredProductsByPrimaryCategory = useMemo(() => {
    if (!selectedPrimaryCategory) return [];

    return dedupeProductsBySlug(
      visibleCampaigns
        .flatMap((campaign) => campaign.products)
        .filter((product) =>
          isProductInPrimaryCategory(product, selectedPrimaryCategory),
        ),
    );
  }, [selectedPrimaryCategory, visibleCampaigns]);
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
  const spotlightProducts = useMemo(
    () => buildSpotlightProducts(visibleProducts),
    [visibleProducts],
  );
  const topSellerSlugs = useMemo(
    () => buildTopSellerSlugs(visibleProducts),
    [visibleProducts],
  );
  const { data: notifications = [] } = useQuery({
    enabled: Boolean(currentUser),
    queryFn: listNotifications,
    queryKey: queryKeys.notifications.list,
  });
  const unreadCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length;
  const hasSearch = normalizedSearch.length > 0;

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: sessionData }) => {
      setCurrentUser(sessionData.session?.user ?? null);
      if (!sessionData.session?.user) {
        initGoogleOneTap(supabase);
      }
    });

    const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    function initGoogleOneTap(supabase: ReturnType<typeof createClient>) {
      if (document.getElementById("gsi-script")) return;

      const script = document.createElement("script");
      script.id = "gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        const gsi = (window as Window & { google?: { accounts: { id: { initialize: (cfg: object) => void; prompt: () => void } } } }).google;
        if (!gsi) return;
        gsi.accounts.id.initialize({
          client_id: "977887434311-smu4qh5kgp0hlbeje0e2f61j8dadh6fo.apps.googleusercontent.com",
          callback: async (res: { credential: string }) => {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: res.credential,
            });
            if (error) {
              console.error("One Tap login error:", error);
              toast.error("Erro ao fazer login: " + error.message);
            }
          },
        });
        gsi.accounts.id.prompt();
      };
    }

    return () => {
      authData.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
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
              href={currentUser ? "/suporte" : "/login?next=%2Fsuporte"}
            >
              <Headphones className="size-4" />
            </Link>
            {currentUser ? (
              <button
                aria-label="Notificações"
                className="hidden size-9 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white sm:flex"
                type="button"
              >
                {unreadCount > 0 ? (
                  <BellDot className="size-5" />
                ) : (
                  <Bell className="size-5" />
                )}
              </button>
            ) : null}
            {currentUser ? (
              <StorefrontUserMenu
                onSignedOut={() => undefined}
                user={currentUser}
              />
            ) : (
              <Link
                className="rounded-md border border-white/25 px-3 py-1.5 font-bold text-[11px] text-white transition hover:border-fuchsia-400 hover:bg-white/10"
                href="/login?next=%2Floja"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
        <StoreCategoryTopbar
          categories={categories}
          onSelectSubcategory={setSelectedSubcategorySlug}
          selectedSubcategorySlug={selectedSubcategorySlug}
        />
      </header>

      {selectedSubcategory ||
      selectedPrimaryCategory ||
      isAllCategoriesSelected ? null : (
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

        {selectedSubcategory ||
        selectedPrimaryCategory ||
        isAllCategoriesSelected ? (
          <SubcategoryShowcase
            categories={categories}
            onClear={() => setSelectedSubcategorySlug(null)}
            onSelectCategory={setSelectedSubcategorySlug}
            onSelectAll={() =>
              setSelectedSubcategorySlug(STORE_ALL_CATEGORIES_FILTER)
            }
            onSelectSubcategory={setSelectedSubcategorySlug}
            products={
              isAllCategoriesSelected
                ? visibleProducts
                : selectedPrimaryCategory
                  ? filteredProductsByPrimaryCategory
                  : filteredProductsBySubcategory
            }
            productCounts={subcategoryProductCounts}
            title={
              isAllCategoriesSelected
                ? "Todas as categorias"
                : selectedPrimaryCategory
                  ? selectedPrimaryCategory.name
                  : (selectedSubcategory?.name ?? "")
            }
            description={
              isAllCategoriesSelected
                ? "Todos os produtos ativos disponíveis na loja."
                : selectedPrimaryCategory
                  ? "Produtos filtrados por todas as subcategorias desta categoria."
                  : "Produtos filtrados pela subcategoria selecionada na loja."
            }
            parentName={selectedSubcategory?.parentName ?? null}
            selectedSubcategorySlug={selectedSubcategory?.slug ?? null}
            topSellerSlugs={topSellerSlugs}
          />
        ) : null}

        {!selectedSubcategory &&
        !selectedPrimaryCategory &&
        !isAllCategoriesSelected &&
        spotlightProducts.length ? (
          <section className="py-7" id="ofertas">
            <SectionTitle eyebrow="Best offers" title="Produtos em destaque" />
            <ProductGrid
              products={spotlightProducts}
              topSellerSlugs={topSellerSlugs}
            />
          </section>
        ) : null}

        {!selectedSubcategory &&
          !selectedPrimaryCategory &&
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

function isProductInPrimaryCategory(
  product: PublicStorefrontProduct,
  category: PublicStorefrontCategory,
) {
  const subcategorySlugs = category.subcategories.map(
    (subcategory) => subcategory.slug,
  );
  const normalizedCategoryValues = [category.slug, category.name].map((value) =>
    normalizeSearch(value),
  );
  const normalizedProductValues = [product.subcategory, product.category].map(
    (value) => normalizeSearch(value ?? ""),
  );

  return (
    subcategorySlugs.some((subcategorySlug) =>
      isProductInSubcategory(product, subcategorySlug),
    ) ||
    normalizedProductValues.some((productValue) =>
      normalizedCategoryValues.some(
        (categoryValue) =>
          productValue === categoryValue ||
          productValue.includes(categoryValue),
      ),
    )
  );
}

function dedupeProductsBySlug(products: PublicStorefrontProduct[]) {
  const productsBySlug = new Map<string, PublicStorefrontProduct>();

  for (const product of products) {
    productsBySlug.set(product.slug, product);
  }

  return Array.from(productsBySlug.values());
}

function buildSpotlightProducts(products: PublicStorefrontProduct[]) {
  const featuredProducts = products.filter((product) => product.is_featured);
  const bestSellersBySubcategory = new Map<string, PublicStorefrontProduct>();

  for (const product of products) {
    const subcategory = normalizeSearch(product.subcategory ?? "");
    if (!subcategory) continue;

    const current = bestSellersBySubcategory.get(subcategory);
    if ((product.sales_count ?? 0) > (current?.sales_count ?? 0)) {
      bestSellersBySubcategory.set(subcategory, product);
    }
  }

  return dedupeProductsBySlug([
    ...featuredProducts,
    ...Array.from(bestSellersBySubcategory.values()),
  ])
    .sort(
      (first, second) =>
        Number(second.is_featured) - Number(first.is_featured) ||
        (second.sales_count ?? 0) - (first.sales_count ?? 0),
    )
    .slice(0, 10);
}

function buildTopSellerSlugs(products: PublicStorefrontProduct[]): Set<string> {
  const bestSellersBySubcategory = new Map<string, PublicStorefrontProduct>();

  for (const product of products) {
    const subcategory = normalizeSearch(product.subcategory ?? "");
    if (!subcategory) continue;

    const current = bestSellersBySubcategory.get(subcategory);
    if ((product.sales_count ?? 0) > (current?.sales_count ?? 0)) {
      bestSellersBySubcategory.set(subcategory, product);
    }
  }

  return new Set(
    Array.from(bestSellersBySubcategory.values()).map(
      (product) => product.slug,
    ),
  );
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

function ProductGrid({
  products,
  topSellerSlugs,
}: {
  products: PublicStorefrontProduct[];
  topSellerSlugs?: Set<string>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          topSellerSlugs={topSellerSlugs}
        />
      ))}
    </div>
  );
}

function SubcategoryShowcase({
  categories,
  description,
  onClear,
  onSelectCategory,
  onSelectAll,
  onSelectSubcategory,
  parentName,
  products,
  productCounts,
  selectedSubcategorySlug,
  title,
  topSellerSlugs,
}: {
  categories: PublicStorefrontCategory[];
  description: string;
  onClear: () => void;
  onSelectCategory: (slug: string) => void;
  onSelectAll: () => void;
  onSelectSubcategory: (slug: string) => void;
  parentName: string | null;
  products: PublicStorefrontProduct[];
  productCounts: Map<string, number>;
  selectedSubcategorySlug: string | null;
  title: string;
  topSellerSlugs: Set<string>;
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
            onSelectCategory={onSelectCategory}
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
              <ProductGrid
                products={products}
                topSellerSlugs={topSellerSlugs}
              />
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
  onSelectCategory,
  onSelectSubcategory,
  productCounts,
  selectedSubcategorySlug,
}: {
  categories: PublicStorefrontCategory[];
  onSelectAll: () => void;
  onSelectCategory: (slug: string) => void;
  onSelectSubcategory: (slug: string) => void;
  productCounts: Map<string, number>;
  selectedSubcategorySlug: string | null;
}) {
  const selectedParentSlug = categories.find(
    (category) =>
      category.slug === selectedSubcategorySlug ||
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
              onClick={() => {
                onSelectCategory(category.slug);
                setOpenCategorySlug((currentSlug) =>
                  currentSlug === category.slug ? "" : category.slug,
                );
              }}
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
  const [openCategorySlug, setOpenCategorySlug] = useState<string | null>(null);
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
          const isCategorySelected =
            selectedSubcategorySlug === category.slug ||
            subcategories.some(
              (subcategory) => subcategory.slug === selectedSubcategorySlug,
            );

          return (
            <fieldset
              className="relative flex h-9 shrink-0 items-center border-0 p-0"
              key={category.slug}
              onMouseEnter={() => setOpenCategorySlug(category.slug)}
              onMouseLeave={() => setOpenCategorySlug(null)}
            >
              <legend className="sr-only">{category.name}</legend>
              <button
                className={`flex h-9 items-center gap-1.5 border-b-2 px-3 font-black text-[11px] uppercase tracking-[0.08em] transition focus-visible:border-fuchsia-500/70 focus-visible:text-white focus-visible:outline-none ${
                  isCategorySelected
                    ? "border-fuchsia-500/70 text-white"
                    : "border-transparent text-slate-300 hover:border-fuchsia-500/70 hover:text-white"
                }`}
                onClick={() => {
                  onSelectSubcategory(category.slug);
                  setOpenCategorySlug(null);
                }}
                onFocus={() => setOpenCategorySlug(category.slug)}
                type="button"
              >
                {category.name}
                <ChevronDown
                  className={`size-3 transition ${openCategorySlug === category.slug ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`absolute top-full left-0 z-[90] min-w-56 transition duration-150 ${
                  openCategorySlug === category.slug
                    ? "visible translate-y-0 opacity-100"
                    : "invisible translate-y-2 opacity-0"
                }`}
              >
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
                          onClick={() => {
                            onSelectSubcategory(subcategory.slug);
                            setOpenCategorySlug(null);
                          }}
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
            </fieldset>
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

function ProductCard({
  product,
  topSellerSlugs,
}: {
  product: PublicStorefrontProduct;
  topSellerSlugs?: Set<string>;
}) {
  const priceInfo = getStorefrontPriceInfo(product);
  const shortTitle = product.name;
  const isTopSeller = topSellerSlugs?.has(product.slug) ?? false;
  const isFeatured = Boolean(product.is_featured);
  const isGoldSpotlight = isTopSeller && isFeatured;
  const tagline = isTopSeller
    ? "Top selling"
    : isFeatured
      ? "Produto em destaque"
      : null;

  return (
    <article
      className={`group bg-[#080808] pb-3 ${
        isGoldSpotlight
          ? "border-2 border-amber-400 shadow-[0_0_18px_-4px_rgba(251,191,36,0.55)]"
          : ""
      }`}
    >
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
          {tagline ? (
            <span
              className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isGoldSpotlight
                  ? "bg-amber-400 text-black"
                  : isTopSeller
                    ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white"
              }`}
            >
              {tagline}
            </span>
          ) : null}
        </div>
        <div className="px-1 pt-2">
          <h3 className="line-clamp-1 font-semibold text-[13px] leading-tight text-white group-hover:text-red-200">
            {shortTitle}
          </h3>
          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="font-black text-[22px] leading-none text-white">
              {priceInfo.current}
            </span>
            {priceInfo.original ? (
              <span className="text-slate-500 text-xs line-through">
                {priceInfo.original}
              </span>
            ) : null}
            {priceInfo.percentOff ? (
              <span className="font-bold text-red-500 text-xs">
                -{priceInfo.percentOff}%
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
            <span className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  className="size-2.5 fill-current"
                  key={`star-${product.id}-${index}`}
                />
              ))}
            </span>
            <span>{isFeatured ? "Destaque" : "Avaliado"}</span>
            <span className="text-slate-500">|</span>
            <span>{product.sales_count ?? 0} vendidos</span>
          </div>
          {tagline ? (
            <p
              className={`mt-1 line-clamp-1 text-xs ${
                isGoldSpotlight
                  ? "font-bold text-amber-400"
                  : isTopSeller
                    ? "text-red-400"
                    : "text-[#c37d55]"
              }`}
            >
              {tagline}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function getStorefrontPriceInfo(product: PublicStorefrontProduct) {
  if (!product.show_price_publicly || typeof product.price !== "number") {
    return { current: "No atendimento", original: null, percentOff: null };
  }

  const discount = calculateStorefrontDiscount(product);
  const currentPrice = product.price - discount;

  return {
    current: formatStorefrontCurrency(currentPrice),
    original: discount > 0 ? formatStorefrontCurrency(product.price) : null,
    percentOff:
      discount > 0 ? Math.round((discount / product.price) * 100) : null,
  };
}

function calculateStorefrontDiscount(product: PublicStorefrontProduct) {
  if (typeof product.price !== "number" || !product.discount_value) return 0;

  if (product.discount_type === "final_price") {
    return (
      product.price -
      Math.min(Math.max(product.discount_value, 0), product.price)
    );
  }

  return 0;
}

function formatStorefrontCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    currency: "BRL",
    style: "currency",
  });
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
