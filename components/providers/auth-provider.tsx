"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthContext } from "@/lib/supabase/queries/auth";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { AuthProviderValue } from "@/types/auth-provider";

const emptyAuth: AuthProviderValue = {
  isLoading: true,
  organization: null,
  permissions: [],
  profile: null,
  session: null,
  signOut: async () => undefined,
  user: null,
};

const AuthContext = createContext<AuthProviderValue>(emptyAuth);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryFn: getAuthContext,
    queryKey: queryKeys.auth.profile,
  });

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthProviderValue>(() => {
    const auth = data ?? emptyAuth;

    return {
      isLoading,
      organization: auth.organization,
      permissions: auth.permissions,
      profile: auth.profile,
      session: auth.session,
      signOut: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile,
        });
      },
      user: auth.user,
    };
  }, [data, isLoading, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
