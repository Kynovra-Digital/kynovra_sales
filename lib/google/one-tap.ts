import { env } from "@/lib/env";
import type { GoogleOneTapClient, SupabaseLike } from "@/types/lib";

export type { GoogleOneTapClient } from "@/types/lib";

const SCRIPT_ID = "kynovra-gsi-script";

export function getGoogleOneTapClientId() {
  return env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
}

export function isOneTapEligible() {
  if (!getGoogleOneTapClientId()) return false;
  if (typeof window === "undefined") return false;
  if (document.getElementById(SCRIPT_ID)) return false;

  return true;
}

export function initGoogleOneTap(
  supabase: SupabaseLike,
  onError?: (message: string) => void,
) {
  if (!isOneTapEligible()) return;
  const clientId = getGoogleOneTapClientId();

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  script.onload = () => {
    const gsi = (window as Window & { google?: GoogleOneTapClient }).google;
    if (!gsi) return;

    gsi.accounts.id.initialize({
      client_id: clientId,
      callback: async (res: { credential?: string }) => {
        if (!res.credential) return;
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: res.credential,
        });
        if (error) {
          console.error("One Tap login error:", error);
          onError?.(error.message);
        }
      },
    });
    gsi.accounts.id.prompt();
  };
}
