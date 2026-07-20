import { describe, expect, it } from "vitest";
import {
  AI_HARNESS_PERMISSIONS,
  isCriticalAIHarnessTool,
  permissionForAIHarnessTool,
} from "@/lib/ai/harness/permissions";
import {
  AI_HARNESS_TOOLS,
  getAIHarnessTool,
  getAIHarnessToolsByCategory,
} from "@/lib/ai/harness/tool-registry";

describe("AI_HARNESS_TOOLS", () => {
  it("tem ao menos 1 ferramenta por categoria listada no AGENTS.md", () => {
    const categories = new Set(AI_HARNESS_TOOLS.map((t) => t.category));
    expect(categories.has("sales")).toBe(true);
    expect(categories.has("support")).toBe(true);
    expect(categories.has("chat")).toBe(true);
    expect(categories.has("product")).toBe(true);
    expect(categories.has("ops")).toBe(true);
    expect(categories.has("ai")).toBe(true);
  });

  it("todas ferramentas tem tool, label, description, category e requiresLLM", () => {
    for (const tool of AI_HARNESS_TOOLS) {
      expect(typeof tool.tool).toBe("string");
      expect(tool.tool.length).toBeGreaterThan(0);
      expect(typeof tool.label).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.requiresLLM).toBe("boolean");
      expect(typeof tool.category).toBe("string");
    }
  });

  it("nomes de ferramenta sao unicos", () => {
    const names = AI_HARNESS_TOOLS.map((t) => t.tool);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("getAIHarnessTool", () => {
  it("retorna a ferramenta pelo nome", () => {
    const tool = getAIHarnessTool("sales.suggest_reply");
    expect(tool).toBeDefined();
    expect(tool?.category).toBe("sales");
  });

  it("retorna undefined para ferramenta inexistente", () => {
    expect(getAIHarnessTool("inexistente.tool")).toBeUndefined();
  });
});

describe("getAIHarnessToolsByCategory", () => {
  it("filtra sales", () => {
    const sales = getAIHarnessToolsByCategory("sales");
    expect(sales.length).toBeGreaterThan(0);
    for (const tool of sales) {
      expect(tool.category).toBe("sales");
    }
  });

  it("filtra support", () => {
    const support = getAIHarnessToolsByCategory("support");
    expect(support.length).toBeGreaterThan(0);
    for (const tool of support) {
      expect(tool.category).toBe("support");
    }
  });

  it("retorna array vazio para categoria inexistente", () => {
    expect(getAIHarnessToolsByCategory("inexistente" as never)).toEqual([]);
  });
});

describe("permissionForAIHarnessTool", () => {
  it("retorna permissao ai para tool inexistente", () => {
    expect(permissionForAIHarnessTool("foo.bar")).toBe(
      AI_HARNESS_PERMISSIONS.ai,
    );
  });

  it("retorna permissao badResponse para ai.register_bad_response", () => {
    expect(permissionForAIHarnessTool("ai.register_bad_response")).toBe(
      AI_HARNESS_PERMISSIONS.badResponse,
    );
  });

  it("retorna permissao por categoria para tools de vendas", () => {
    expect(permissionForAIHarnessTool("sales.suggest_reply")).toBe(
      AI_HARNESS_PERMISSIONS.sales,
    );
  });

  it("retorna permissao por categoria para tools de suporte", () => {
    expect(permissionForAIHarnessTool("support.suggest_reply")).toBe(
      AI_HARNESS_PERMISSIONS.support,
    );
  });

  it("retorna permissao por categoria para tools de chat", () => {
    expect(permissionForAIHarnessTool("chat.rewrite_message")).toBe(
      AI_HARNESS_PERMISSIONS.chat,
    );
  });

  it("retorna permissao por categoria para tools de produto", () => {
    expect(permissionForAIHarnessTool("product.get_context")).toBe(
      AI_HARNESS_PERMISSIONS.product,
    );
  });

  it("retorna permissao por categoria para tools de operacao", () => {
    expect(permissionForAIHarnessTool("ops.generate_internal_note")).toBe(
      AI_HARNESS_PERMISSIONS.ops,
    );
  });
});

describe("isCriticalAIHarnessTool", () => {
  it("marca ferramentas criticas listadas no AGENTS.md", () => {
    expect(isCriticalAIHarnessTool("sales.generate_checkout_message")).toBe(
      true,
    );
    expect(isCriticalAIHarnessTool("support.generate_closing_message")).toBe(
      true,
    );
    expect(isCriticalAIHarnessTool("ops.prepare_human_handoff")).toBe(true);
    expect(isCriticalAIHarnessTool("ops.prepare_transfer_context")).toBe(true);
  });

  it("nao marca ferramentas comuns", () => {
    expect(isCriticalAIHarnessTool("sales.suggest_reply")).toBe(false);
    expect(isCriticalAIHarnessTool("chat.rewrite_message")).toBe(false);
    expect(isCriticalAIHarnessTool("")).toBe(false);
    expect(isCriticalAIHarnessTool("inexistente")).toBe(false);
  });
});
