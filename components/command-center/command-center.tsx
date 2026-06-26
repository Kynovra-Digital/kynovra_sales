"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";
import {
  adminCommandItems,
  quickActions,
} from "@/lib/navigation/admin-navigation";
import { canAccessPermission } from "@/lib/permissions/admin-permissions";
import { useCommandStore } from "@/stores/command-store";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useUiStore } from "@/stores/ui-store";

export function CommandCenter() {
  const router = useRouter();
  const isOpen = useCommandStore((state) => state.isOpen);
  const setOpen = useCommandStore((state) => state.setOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setHelpOpen = useUiStore((state) => state.setHelpOpen);
  const setNotificationsOpen = useNotificationStore((state) => state.setOpen);
  const toggleFocus = useFocusModeStore((state) => state.toggle);
  const { permissions } = useAuth();
  const visibleCommandItems = adminCommandItems.filter((item) =>
    canAccessPermission(permissions, item.permission),
  );
  const visibleQuickActions = quickActions.filter((item) =>
    "href" in item ? canAccessPermission(permissions, item.permission) : true,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      }

      if (mod && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setNotificationsOpen(true);
      }

      if (mod && event.key === "/") {
        event.preventDefault();
        setHelpOpen(true);
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFocus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setHelpOpen, setNotificationsOpen, setOpen, toggleFocus, toggleSidebar]);

  function navigateTo(href: string) {
    router.push(href);
    setOpen(false);
  }

  return (
    <CommandDialog
      description="Busque modulos, acoes e atalhos do painel."
      onOpenChange={setOpen}
      open={isOpen}
      title="Command Center"
    >
      <div className="px-3 pt-3">
        <label
          className="text-muted-foreground text-xs font-medium"
          htmlFor="command-center-search"
        >
          Buscar no Command Center
        </label>
      </div>
      <CommandInput
        id="command-center-search"
        placeholder="Buscar no Kynovra Sales..."
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Modulos">
          {visibleCommandItems.map((item) => {
            const Icon = item.icon;

            return (
              <CommandItem
                key={item.href}
                onSelect={() => navigateTo(item.href)}
              >
                <Icon />
                <span>{item.label}</span>
                <CommandShortcut>{item.group}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading="Acoes rapidas">
          {visibleQuickActions.map((item) => {
            const Icon = item.icon;

            return (
              <CommandItem
                key={item.label}
                onSelect={() => {
                  if ("action" in item && item.action === "notifications") {
                    setNotificationsOpen(true);
                    setOpen(false);
                    return;
                  }

                  if ("href" in item) {
                    navigateTo(item.href);
                  }
                }}
              >
                <Icon />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
