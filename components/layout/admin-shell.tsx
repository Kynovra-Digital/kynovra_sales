"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CommandCenter } from "@/components/command-center/command-center";
import { HelpCenter } from "@/components/help/help-center";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { ProfileDrawer } from "@/components/profile/profile-drawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { useUiStore } from "@/stores/ui-store";
import type { AdminShellProps } from "@/types/layout";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: AdminShellProps) {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const isMobileSidebarOpen = useUiStore((state) => state.isMobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore(
    (state) => state.setMobileSidebarOpen,
  );
  const focusEnabled = useFocusModeStore((state) => state.enabled);

  return (
    <div
      className="admin-shell bg-[#050a18] text-foreground transition-colors duration-500"
      data-density="comfortable-compact"
      data-focus={focusEnabled ? "true" : "false"}
      data-sidebar={isCollapsed ? "collapsed" : "expanded"}
    >
      <AnimatePresence mode="wait">
        {!focusEnabled && (
          <motion.div
            key="sidebar"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden lg:block h-full"
          >
            <AdminSidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="admin-main relative flex flex-col min-w-0 min-h-0">
        <AnimatePresence>
          {!focusEnabled && (
            <motion.div
              key="topbar"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="z-30"
            >
              <AdminTopbar />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="admin-content relative flex-1 overflow-y-auto overflow-x-hidden premium-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.03),transparent_40%)]">
          <div
            className={cn(
              "page-shell mx-auto w-full transition-all duration-500",
              focusEnabled ? "max-w-none px-6 py-8" : "max-w-[1800px]",
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={focusEnabled ? "focus" : "normal"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex min-h-full min-w-0 flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <CommandCenter />
      <NotificationsDrawer />
      <HelpCenter />
      <ProfileDrawer />

      <Sheet onOpenChange={setMobileSidebarOpen} open={isMobileSidebarOpen}>
        <SheetContent
          className="w-full max-w-80 border-white/5 bg-[#050a18] p-0 shadow-2xl"
          side="left"
        >
          <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
          <div className="h-full bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.1),transparent_50%)]">
            <AdminSidebar
              mobile
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
