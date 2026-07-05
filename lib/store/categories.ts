export const storefrontPrimaryCategories = [
  { name: "Tecnologia", slug: "tecnologia" },
  { name: "Casa e Utilidades", slug: "casa-e-utilidades" },
  { name: "Beleza e Bem-estar", slug: "beleza-e-bem-estar" },
  { name: "Moda e Acessórios", slug: "familia-e-pets" },
  { name: "Produtos Digitais", slug: "negocios-digitais" },
] as const;

export type StorefrontPrimaryCategorySlug =
  (typeof storefrontPrimaryCategories)[number]["slug"];

export function getStorefrontPrimaryCategoryName(
  slug: StorefrontPrimaryCategorySlug | string,
) {
  return (
    storefrontPrimaryCategories.find((category) => category.slug === slug)
      ?.name ?? "Produtos Digitais"
  );
}
