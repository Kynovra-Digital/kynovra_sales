import { describe, expect, it } from "vitest";
import { shortcutGroups } from "@/lib/shortcuts/shortcut-map";

describe("shortcutGroups", () => {
  it("tem 4 grupos", () => {
    expect(shortcutGroups).toHaveLength(4);
  });

  it("labels sao Global, Atendimento, Suporte, Drawers", () => {
    const labels = shortcutGroups.map((g) => g.label);
    expect(labels).toEqual(["Global", "Atendimento", "Suporte", "Drawers"]);
  });

  it("todo atalho tem keys e action", () => {
    for (const group of shortcutGroups) {
      expect(Array.isArray(group.shortcuts)).toBe(true);
      expect(group.shortcuts.length).toBeGreaterThan(0);
      for (const shortcut of group.shortcuts) {
        expect(typeof shortcut.keys).toBe("string");
        expect(typeof shortcut.action).toBe("string");
        expect(shortcut.keys.length).toBeGreaterThan(0);
      }
    }
  });

  it("inclui atalho Command Center em Global", () => {
    const global = shortcutGroups.find((g) => g.label === "Global");
    expect(global).toBeDefined();
    const hasCommand = global?.shortcuts.some(
      (s) => s.action === "Command Center",
    );
    expect(hasCommand).toBe(true);
  });

  it("inclui Esc para fechar drawer", () => {
    const drawers = shortcutGroups.find((g) => g.label === "Drawers");
    expect(drawers).toBeDefined();
    expect(drawers?.shortcuts.some((s) => s.keys === "Esc")).toBe(true);
  });
});
