"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PublicUser } from "@/types/auth";

export type { PublicUser } from "@/types/auth";

export function usePublicAuth() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name:
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            null,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
        });
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name:
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            null,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signInWithGoogle = async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo || window.location.pathname)}`,
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return {
    user,
    isLoading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
