import { headers } from "next/headers";

export async function getServerAppOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL deve ser configurada em produção.");
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const forwardedProtocol = headersList.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "https" ? "https" : "http";

  if (!host || !isAllowedLocalHost(host)) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function isAllowedLocalHost(host: string) {
  const hostname = host.split(":")[0];

  return hostname === "localhost" || hostname === "127.0.0.1";
}
