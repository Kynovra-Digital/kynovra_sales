"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Focus,
  Menu,
  Search,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { listNotifications } from "@/lib/supabase/queries/notifications";
import { queryKeys } from "@/lib/supabase/query-keys";
import { cn } from "@/lib/utils";
import { useCommandStore } from "@/stores/command-store";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useUiStore } from "@/stores/ui-store";

export function AdminTopbar() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const openCommand = useCommandStore((state) => state.open);
  const setHelpOpen = useUiStore((state) => state.setHelpOpen);
  const setMobileSidebarOpen = useUiStore(
    (state) => state.setMobileSidebarOpen,
  );
  const setProfileOpen = useUiStore((state) => state.setProfileOpen);
  const setNotificationsOpen = useNotificationStore((state) => state.setOpen);
  const toggleFocus = useFocusModeStore((state) => state.toggle);
  const focusEnabled = useFocusModeStore((state) => state.enabled);

  const isOperationalRoute =
    pathname.startsWith("/sales") || pathname.startsWith("/post-sales-support");

  const pathSegments = pathname.split("/").filter(Boolean);
  const currentLabel = pathSegments.at(-1)?.replaceAll("-", " ") ?? "dashboard";

  const { data: notifications = [] } = useQuery({
    enabled: Boolean(user),
    queryFn: listNotifications,
    queryKey: queryKeys.notifications.list,
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length;

  const displayName =
    profile?.full_name || user?.email?.split("@").at(0) || "Usuário";
  const initials = displayName
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="admin-topbar z-20 flex items-center gap-3 border-white/5 border-b bg-[#050a18]/60 px-4 backdrop-blur-3xl lg:px-6">
      <Button
        aria-label="Abrir menu"
        className="lg:hidden hover:bg-white/5 text-muted-foreground"
        onClick={() => setMobileSidebarOpen(true)}
        size="icon"
        variant="ghost"
      >
        <Menu className="size-5" />
      </Button>

      <div className="hidden min-w-0 items-center gap-3 overflow-hidden lg:flex">
        <nav className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground/50 transition-colors hover:text-white cursor-default">
            Kynovra
          </span>
          <span className="text-muted-foreground/30">/</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentLabel}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="truncate text-white capitalize tracking-wide"
            >
              {currentLabel}
            </motion.span>
          </AnimatePresence>
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 md:px-8 max-w-2xl mx-auto">
        <button
          className="group relative flex h-10 w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 text-muted-foreground/60 text-sm transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 hover:text-white/80"
          onClick={openCommand}
          type="button"
        >
          <Search
            aria-hidden="true"
            className="size-4 transition-transform group-hover:scale-110"
          />
          <span className="hidden truncate sm:inline font-medium">
            Pesquisar no Command Center...
          </span>
          <span className="sm:hidden">Buscar...</span>
          <div className="ml-auto hidden items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] md:flex">
            <span className="text-[9px] opacity-60">⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <AnimatePresence>
          {isOperationalRoute && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                aria-label="Alternar modo foco"
                data-active={focusEnabled}
                onClick={toggleFocus}
                className={cn(
                  "hidden h-9 gap-2 border-primary/20 bg-primary/5 text-blue-200 transition-all sm:inline-flex",
                  focusEnabled &&
                    "bg-primary text-white shadow-[0_0_20px_rgb(37_99_235_/_0.4)] border-primary",
                )}
                size="sm"
                variant="outline"
              >
                <Focus className="size-4" />
                <span className="hidden xl:inline">Modo Foco</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden h-8 w-px bg-white/5 mx-1 xl:block" />

        <div className="hidden items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5 xl:flex">
          <div className="relative">
            <span className="block size-2 rounded-full bg-kynovra-digital-green" />
            <span className="absolute inset-0 animate-ping rounded-full bg-kynovra-digital-green opacity-40" />
          </div>
          <div className="leading-tight">
            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-wider">
              Sistema
            </p>
            <p className="font-semibold text-kynovra-digital-green text-xs">
              Operacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            aria-label="Ajuda"
            className="hidden sm:inline-flex text-muted-foreground hover:text-white hover:bg-white/5"
            onClick={() => setHelpOpen(true)}
            size="icon"
            variant="ghost"
          >
            <CircleHelp className="size-5" />
          </Button>

          {user ? (
            <Button
              className="relative text-muted-foreground hover:text-white hover:bg-white/5"
              aria-label="Abrir notificações"
              onClick={() => setNotificationsOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary font-bold text-[9px] text-white ring-2 ring-[#050a18]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          ) : null}
        </div>

        <Separator
          className="hidden h-6 bg-white/5 md:block mx-1"
          orientation="vertical"
        />

        <button
          className="group flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-all hover:bg-white/5 border border-transparent hover:border-white/5"
          onClick={() => setProfileOpen(true)}
          type="button"
        >
          <Avatar className="size-8 border border-white/10 ring-2 ring-primary/20 transition-transform group-hover:scale-105">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-kynovra-tech-purple/20 text-[11px] font-bold">
              {initials || "KS"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start leading-none md:flex">
            <span className="text-[12px] font-semibold text-white truncate max-w-[100px]">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground/70 font-medium">
              Admin
            </span>
          </div>
          <ChevronDown className="hidden size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-y-0.5 md:block" />
        </button>
      </div>
    </header>
  );
}
