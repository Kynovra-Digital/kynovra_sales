import { describe, expect, it } from "vitest";
import {
  adminCommandItems,
  adminNavigationGroups,
  quickActions,
} from "@/lib/navigation/admin-navigation";

describe("adminNavigationGroups", () => {
  it("tem 3 grupos: Operacao, Comercial, Gestao", () => {
    expect(adminNavigationGroups).toHaveLength(3);
    const labels = adminNavigationGroups.map((g) => g.label);
    expect(labels).toEqual(["Operação", "Comercial", "Gestão"]);
  });

  it("todo item tem label, href, icon e permission", () => {
    for (const group of adminNavigationGroups) {
      for (const item of group.items) {
        expect(typeof item.label).toBe("string");
        expect(typeof item.href).toBe("string");
        expect(item.href.startsWith("/")).toBe(true);
        expect(typeof item.permission).toBe("string");
        expect(
          typeof item.icon === "object" || typeof item.icon === "function",
        ).toBe(true);
      }
    }
  });

  it("hrefs sao unicos", () => {
    const hrefs = adminNavigationGroups.flatMap((g) =>
      g.items.map((i) => i.href),
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("inclui rota canonica /post-sales-support para suporte", () => {
    const hrefs = adminNavigationGroups.flatMap((g) =>
      g.items.map((i) => i.href),
    );
    expect(hrefs).toContain("/post-sales-support");
  });
});

describe("adminCommandItems", () => {
  it("e o flatten de grupos com group label adicionado", () => {
    expect(Array.isArray(adminCommandItems)).toBe(true);
    expect(adminCommandItems.length).toBeGreaterThan(0);
    for (const item of adminCommandItems) {
      expect(typeof item.group).toBe("string");
      expect(typeof item.label).toBe("string");
    }
  });

  it("total de items bate com soma dos grupos", () => {
    const total = adminNavigationGroups.reduce(
      (acc, g) => acc + g.items.length,
      0,
    );
    expect(adminCommandItems).toHaveLength(total);
  });
});

describe("quickActions", () => {
  it("inclui acao de notificacoes sem href", () => {
    const notificationAction = quickActions.find(
      (q) => q.action === "notifications",
    );
    expect(notificationAction).toBeDefined();
    expect(notificationAction?.href).toBeUndefined();
  });

  it("acoes com href tem icon e permission", () => {
    for (const action of quickActions) {
      if (action.href) {
        expect(typeof action.permission).toBe("string");
      }
      expect(
        typeof action.icon === "object" || typeof action.icon === "function",
      ).toBe(true);
    }
  });
});
