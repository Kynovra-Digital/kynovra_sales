import { describe, expect, it } from "vitest";
import {
  buildProductAttendanceLink,
  buildSalesRoomLink,
  buildStorefrontLink,
  buildSupportLink,
  buildSupportRoomLink,
} from "@/lib/url/public-links";

describe("buildProductAttendanceLink", () => {
  it("monta rota canonica /a/[slug]", () => {
    expect(
      buildProductAttendanceLink("https://exemplo.com", "mini-projetor"),
    ).toBe("https://exemplo.com/a/mini-projetor");
  });

  it("remove barra final do origin", () => {
    expect(
      buildProductAttendanceLink("https://exemplo.com/", "mini-projetor"),
    ).toBe("https://exemplo.com/a/mini-projetor");
  });

  it("usar localhost quando origin vazio", () => {
    expect(buildProductAttendanceLink("", "mini-projetor")).toBe(
      "http://localhost:3000/a/mini-projetor",
    );
  });
});

describe("buildSalesRoomLink", () => {
  it("monta /room/[publicToken]", () => {
    expect(buildSalesRoomLink("https://exemplo.com", "TOKEN123")).toBe(
      "https://exemplo.com/room/TOKEN123",
    );
  });
});

describe("buildSupportLink", () => {
  it("monta /suporte canonico", () => {
    expect(buildSupportLink("https://exemplo.com")).toBe(
      "https://exemplo.com/suporte",
    );
  });
});

describe("buildSupportRoomLink", () => {
  it("monta /suporte/sala/[publicToken]", () => {
    expect(buildSupportRoomLink("https://exemplo.com", "TOKEN456")).toBe(
      "https://exemplo.com/suporte/sala/TOKEN456",
    );
  });
});

describe("buildStorefrontLink", () => {
  it("retorna origin limpo", () => {
    expect(buildStorefrontLink("https://exemplo.com/")).toBe(
      "https://exemplo.com",
    );
  });

  it("retorna localhost quando origin vazio", () => {
    expect(buildStorefrontLink("")).toBe("http://localhost:3000");
  });
});
