import { create } from "zustand";

type UiState = {
  isSidebarCollapsed: boolean;
  isHelpOpen: boolean;
  isMobileSidebarOpen: boolean;
  isProfileOpen: boolean;
  setSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
  setHelpOpen: (isHelpOpen: boolean) => void;
  setMobileSidebarOpen: (isMobileSidebarOpen: boolean) => void;
  setProfileOpen: (isProfileOpen: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarCollapsed: false,
  isHelpOpen: false,
  isMobileSidebarOpen: false,
  isProfileOpen: false,
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  setHelpOpen: (isHelpOpen) => set({ isHelpOpen }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  setProfileOpen: (isProfileOpen) => set({ isProfileOpen }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
