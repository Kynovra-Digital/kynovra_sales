import { describe, expect, it } from "vitest";
import {
  actionPermissions,
  canAccessPermission,
  getPermissionLabel,
  permissionCatalog,
  visibleTabPermissions,
} from "@/lib/permissions/admin-permissions";

describe("permissionCatalog", () => {
  it("e a uniao de tabs visiveis e actions", () => {
    expect(permissionCatalog).toHaveLength(
      visibleTabPermissions.length + actionPermissions.length,
    );
  });

  it("chaves sao unicas", () => {
    const keys = permissionCatalog.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("toda permissao tem label, description e key", () => {
    for (const permission of permissionCatalog) {
      expect(typeof permission.label).toBe("string");
      expect(typeof permission.description).toBe("string");
      expect(typeof permission.key).toBe("string");
      expect(permission.label.length).toBeGreaterThan(0);
    }
  });
});

describe("getPermissionLabel", () => {
  it("retorna label para chave conocida", () => {
    expect(getPermissionLabel("dashboard.view")).toBe("Dashboard");
    expect(getPermissionLabel("team.manage")).toBe("Gerenciar equipe");
    expect(getPermissionLabel("sales.ticket.accept")).toBe(
      "Aceitar atendimento de venda",
    );
  });

  it("retorna a propria chave para desconhecida", () => {
    expect(getPermissionLabel("inexistente.x")).toBe("inexistente.x");
  });
});

describe("canAccessPermission", () => {
  it("retorna true quando permissao e undefined", () => {
    expect(canAccessPermission(["dashboard.view"], undefined)).toBe(true);
  });

  it("retorna true quando usuario tem wildcard", () => {
    expect(canAccessPermission(["*"], "qualquer.coisa")).toBe(true);
  });

  it("retorna true quando usuario tem a permissao", () => {
    expect(
      canAccessPermission(["dashboard.view", "sales.view"], "sales.view"),
    ).toBe(true);
  });

  it("retorna false quando usuario nao tem a permissao", () => {
    expect(canAccessPermission(["dashboard.view"], "sales.view")).toBe(false);
  });

  it("retorna false para lista vazia", () => {
    expect(canAccessPermission([], "dashboard.view")).toBe(false);
  });
});
