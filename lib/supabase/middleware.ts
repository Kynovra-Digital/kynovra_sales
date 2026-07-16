import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./database.types";

const adminRoles = [
  "owner",
  "founder",
  "superadmin",
  "management",
  "admin",
  "supervisor",
];

const adminPrefixes = [
  "/audit",
  "/campaigns",
  "/dashboard",
  "/hardness",
  "/inventory",
  "/knowledge-base",
  "/leads",
  "/post-sales-support",
  "/products",
  "/quality",
  "/sales",
  "/settings",
  "/store",
  "/team",
  "/clients",
];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = adminPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isLoginRoute = pathname === "/login";
  const isWelcomeRoute = pathname === "/welcome";
  const needsSession = isAdminRoute || isLoginRoute || isWelcomeRoute;

  if (!needsSession) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    const hasOrganization = Boolean(profile?.organization_id);
    const hasAdminRole = adminRoles.includes(profile?.role ?? "");

    if (isAdminRoute && !hasOrganization) {
      const welcomeUrl = request.nextUrl.clone();
      welcomeUrl.pathname = "/welcome";
      welcomeUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(welcomeUrl);
    }

    if (isAdminRoute && !hasAdminRole) {
      const storeUrl = request.nextUrl.clone();
      storeUrl.pathname = "/";
      storeUrl.searchParams.set("access", "denied");
      return NextResponse.redirect(storeUrl);
    }

    if (isWelcomeRoute && hasOrganization) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  if (user && isLoginRoute) {
    const next = request.nextUrl.searchParams.get("next");
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname =
      next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
