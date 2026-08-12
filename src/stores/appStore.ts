'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SIDEBAR_DEFAULT_WIDTH } from '@/lib/constants';

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'extensions';

interface AppState {
  // Sidebar
  sidebarWidth: number;
  isSidebarVisible: boolean;
  isSidebarResizing: boolean;
  activePanel: SidebarPanel;

  // Window state
  isWindowFocused: boolean;
  isMaximized: boolean;

  // Overlays
  isCommandPaletteOpen: boolean;
  isQuickOpenOpen: boolean;
  isSettingsOpen: boolean;
  isKeyboardShortcutsOpen: boolean;

  // Layout
  isZenMode: boolean;
  isBreadcrumbsVisible: boolean;

  // Theme
  theme: 'dark' | 'light' | 'system';

  // Actions
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarResizing: (resizing: boolean) => void;
  setActivePanel: (panel: SidebarPanel) => void;
  /** Focus a panel, opening the sidebar; clicking the active one collapses it. */
  revealPanel: (panel: SidebarPanel) => void;
  setWindowFocused: (focused: boolean) => void;
  setMaximized: (maximized: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickOpenOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  toggleZenMode: () => void;
  toggleBreadcrumbs: () => void;
  closeAllOverlays: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      isSidebarVisible: true,
      isSidebarResizing: false,
      activePanel: 'explorer',

      isWindowFocused: true,
      isMaximized: false,

      isCommandPaletteOpen: false,
      isQuickOpenOpen: false,
      isSettingsOpen: false,
      isKeyboardShortcutsOpen: false,

      isZenMode: false,
      isBreadcrumbsVisible: true,

      theme: 'dark',

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),

      setSidebarVisible: (visible) => set({ isSidebarVisible: visible }),

      setSidebarResizing: (resizing) => set({ isSidebarResizing: resizing }),

      setActivePanel: (panel) => set({ activePanel: panel, isSidebarVisible: true }),

      revealPanel: (panel) => {
        const { activePanel, isSidebarVisible } = get();
        if (activePanel === panel && isSidebarVisible) {
          set({ isSidebarVisible: false });
        } else {
          set({ activePanel: panel, isSidebarVisible: true });
        }
      },

      setWindowFocused: (focused) => set({ isWindowFocused: focused }),

      setMaximized: (maximized) => set({ isMaximized: maximized }),

      // Opening one overlay always closes the other - they share the same space.
      setCommandPaletteOpen: (open) =>
        set({ isCommandPaletteOpen: open, isQuickOpenOpen: open ? false : get().isQuickOpenOpen }),

      setQuickOpenOpen: (open) =>
        set({ isQuickOpenOpen: open, isCommandPaletteOpen: open ? false : get().isCommandPaletteOpen }),

      setSettingsOpen: (open) => set({ isSettingsOpen: open }),

      setKeyboardShortcutsOpen: (open) => set({ isKeyboardShortcutsOpen: open }),

      toggleZenMode: () =>
        set((state) => ({
          isZenMode: !state.isZenMode,
          // Zen mode hides the sidebar and restores it on the way out.
          isSidebarVisible: state.isZenMode,
        })),

      toggleBreadcrumbs: () => set((state) => ({ isBreadcrumbsVisible: !state.isBreadcrumbsVisible })),

      closeAllOverlays: () =>
        set({
          isCommandPaletteOpen: false,
          isQuickOpenOpen: false,
          isSettingsOpen: false,
          isKeyboardShortcutsOpen: false,
        }),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'devblitz-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        isSidebarVisible: state.isSidebarVisible,
        activePanel: state.activePanel,
        isBreadcrumbsVisible: state.isBreadcrumbsVisible,
        theme: state.theme,
      }),
    }
  )
);

// Selectors
export const useSidebarWidth = () => useAppStore((state) => state.sidebarWidth);
export const useSidebarVisible = () => useAppStore((state) => state.isSidebarVisible);
export const useSidebarResizing = () => useAppStore((state) => state.isSidebarResizing);
export const useActivePanel = () => useAppStore((state) => state.activePanel);
export const useWindowFocused = () => useAppStore((state) => state.isWindowFocused);
export const useIsMaximized = () => useAppStore((state) => state.isMaximized);
export const useZenMode = () => useAppStore((state) => state.isZenMode);
export const useTheme = () => useAppStore((state) => state.theme);
