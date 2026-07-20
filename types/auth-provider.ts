import type { AuthContextData } from "@/lib/supabase/queries/auth";

export type AuthProviderValue = AuthContextData & {
  isLoading: boolean;
  signOut: () => Promise<void>;
};
