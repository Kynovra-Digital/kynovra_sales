import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("mescla classes simples", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("resolve conflitos tailwind mantendo a ultima classe", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("mescla arrays e objetos condicionais", () => {
    expect(cn(["px-2", { "py-1": true, "py-4": false }], "gap-2")).toBe(
      "px-2 py-1 gap-2",
    );
  });
});
