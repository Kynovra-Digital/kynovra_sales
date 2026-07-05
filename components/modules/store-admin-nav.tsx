import { FolderTree, Megaphone, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const storeAdminTabs = [
  {
    href: "/store/campaigns",
    icon: Megaphone,
    label: "Campanhas",
  },
  {
    href: "/store/categories",
    icon: FolderTree,
    label: "Categorias",
  },
  {
    href: "/store/qualification",
    icon: Star,
    label: "Qualificação",
  },
];

export function StoreAdminNav({
  active,
}: {
  active: "campaigns" | "categories" | "qualification";
}) {
  return (
    <nav
      aria-label="Seções da loja"
      className="flex min-w-0 flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1.5"
    >
      {storeAdminTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href.endsWith(active);

        return (
          <Link
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-muted-foreground text-sm transition hover:bg-white/[0.05] hover:text-white",
              isActive &&
                "bg-primary/15 text-white shadow-[0_0_20px_rgb(37_99_235_/_0.12)] ring-1 ring-primary/25",
            )}
            href={tab.href}
            key={tab.href}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
