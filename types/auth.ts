import type { ReactNode } from "react";

export type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

export type AppProvidersProps = {
  children: ReactNode;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
};
