import { describe, expect, it } from "vitest";
import {
  getStorefrontPrimaryCategoryName,
  type StorefrontPrimaryCategorySlug,
  storefrontPrimaryCategories,
} from "@/lib/store/categories";

describe("storefrontPrimaryCategories", () => {
  it("tem 5 categorias com name e slug", () => {
    expect(storefrontPrimaryCategories).toHaveLength(5);
    for (const category of storefrontPrimaryCategories) {
      expect(typeof category.name).toBe("string");
      expect(typeof category.slug).toBe("string");
      expect(category.name.length).toBeGreaterThan(0);
      expect(category.slug.length).toBeGreaterThan(0);
    }
  });

  it("slugs sao unicos", () => {
    const slugs = storefrontPrimaryCategories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getStorefrontPrimaryCategoryName", () => {
  it("retorna nome correto para slug valido", () => {
    expect(getStorefrontPrimaryCategoryName("tecnologia")).toBe("Tecnologia");
    expect(getStorefrontPrimaryCategoryName("casa-e-utilidades")).toBe(
      "Casa e Utilidades",
    );
  });

  it("retorna fallback para slug desconhecido", () => {
    expect(getStorefrontPrimaryCategoryName("slug-inexistente")).toBe(
      "Produtos Digitais",
    );
  });

  it("aceita string como slug", () => {
    const slug: StorefrontPrimaryCategorySlug = "tecnologia";
    expect(getStorefrontPrimaryCategoryName(slug)).toBe("Tecnologia");
  });
});
