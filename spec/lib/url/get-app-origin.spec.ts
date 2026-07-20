import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getClientAppOrigin } from "@/lib/url/get-app-origin";

const originalWindow = global.window;
const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

describe("getClientAppOrigin", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      // @ts-expect-line restaurar estado sem window
      delete global.window;
    }
  });

  it("usa NEXT_PUBLIC_APP_URL quando definida", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://producao.com/";
    expect(getClientAppOrigin()).toBe("https://producao.com");
  });

  it("usa window.location.origin no client quando env ausente", () => {
    // @ts-expect-line mock window
    global.window = { location: { origin: "https://client.example" } };
    expect(getClientAppOrigin()).toBe("https://client.example");
  });

  it("retorna string vazia no server sem env", () => {
    // @ts-expect-line simula ambiente server
    delete global.window;
    expect(getClientAppOrigin()).toBe("");
  });

  it("remove barra final do NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.com/";
    expect(getClientAppOrigin()).toBe("https://app.com");
  });
});
