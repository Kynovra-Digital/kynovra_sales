"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { adminNavigationGroups } from "@/lib/navigation/admin-navigation";
import { canAccessPermission } from "@/lib/permissions/admin-permissions";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import type { AdminSidebarProps } from "@/types/layout";

export function AdminSidebar({
  mobile = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const collapsed = mobile ? false : isCollapsed;
  const visibleNavigationGroups = adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessPermission(permissions, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "admin-sidebar relative flex min-w-0 flex-col backdrop-blur-2xl transition-all duration-300",
        !mobile && "hidden lg:flex",
        mobile && "w-full border-r-0",
      )}
    >
      <div className="pointer-events-none absolute inset-0 command-grid opacity-[0.03]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_2%,rgb(37_99_235_/_0.15),transparent_18rem),radial-gradient(circle_at_80%_0%,rgb(124_58_237_/_0.08),transparent_14rem)]" />

      <div className="relative flex h-[var(--topbar-height)] shrink-0 items-center px-4">
        <Link
          className={cn(
            "flex max-w-full min-w-0 items-center gap-3 overflow-hidden transition-all duration-300",
            collapsed && "justify-center",
          )}
          href="/dashboard"
          onClick={onNavigate}
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 font-semibold text-blue-100 shadow-[0_0_20px_rgb(37_99_235_/_0.2)]">
            <span className="-ml-0.5 block h-4 w-4 rotate-45 border-blue-400 border-b-2 border-l-2" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden"
              >
                <span className="block truncate font-bold text-[13px] tracking-[0.22em] text-white">
                  KYNOVRA
                </span>
                <span className="block truncate font-medium text-blue-400/80 text-[10px] tracking-[0.45em]">
                  SALES
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <Separator className="relative bg-white/5 mx-4 w-auto" />

      <nav className="no-scrollbar relative flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-3 py-6">
        {visibleNavigationGroups.map((group) => (
          <div className="flex min-w-0 flex-col gap-1.5" key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 truncate px-3 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-1"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const link = (
                <Link
                  aria-label={item.label}
                  className={cn(
                    "group relative flex h-10 w-full max-w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3 text-muted-foreground/80 text-sm transition-all duration-300 hover:bg-white/[0.04] hover:text-white",
                    isActive &&
                      "bg-primary/10 text-white shadow-[0_0_20px_rgb(37_99_235_/_0.12)] ring-1 ring-primary/25",
                    collapsed && "justify-center px-0",
                  )}
                  href={item.href}
                  onClick={onNavigate}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 h-5 w-1 rounded-r-full bg-primary shadow-[0_0_10px_rgb(37_99_235_/_0.8)]"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-[18px] shrink-0 transition-colors duration-300",
                      isActive ? "text-primary" : "group-hover:text-primary/70",
                    )}
                  />
                  {!collapsed && (
                    <span className="min-w-0 truncate font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              );

              if (!collapsed) {
                return (
                  <div className="max-w-full min-w-0" key={item.href}>
                    {link}
                  </div>
                );
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-popover/95 backdrop-blur-md border-white/10"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 border-white/5 border-t p-4 flex flex-col gap-3">
        {!mobile && (
          <Button
            className={cn(
              "h-10 w-full max-w-full min-w-0 justify-start gap-3 overflow-hidden rounded-xl border-white/5 bg-white/[0.02] px-3 hover:bg-white/[0.06] hover:text-white transition-all duration-300",
              collapsed && "justify-center px-0",
            )}
            onClick={toggleSidebar}
            size="sm"
            variant="outline"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" />
            ) : (
              <PanelLeftClose className="size-[18px]" />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate font-medium"
                >
                  Recolher
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        )}
      </div>
    </aside>
  );
}
