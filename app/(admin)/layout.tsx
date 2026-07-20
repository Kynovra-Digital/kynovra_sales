import { AdminShell } from "@/components/layout/admin-shell";
import type { AdminLayoutProps } from "@/types/layout";

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}
