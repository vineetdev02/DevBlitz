'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SIDEBAR_DEFAULT_WIDTH } from '@/lib/constants';

interface AppState {
  // UI state
  sidebarWidth: number;
  isSidebarVisible: boolean;
  isSidebarResizing: boolean;
  
  // Window state
  isWindowFocused: boolean;
  isMaximized: boolean;
  
  // Keyboard shortcuts
  isCommandPaletteOpen: boolean;
  
  // Theme
  theme: 'dark' | 'light' | 'system';
  
  // Actions
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarResizing: (resizing: boolean) => void;
  setWindowFocused: (focused: boolean) => void;
  setMaximized: (maximized: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      isSidebarVisible: true,
      isSidebarResizing: false,
      isWindowFocused: true,
      isMaximized: false,
      isCommandPaletteOpen: false,
      theme: 'dark',

      // Actions
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      
      toggleSidebar: () => set((state) => ({ 
        isSidebarVisible: !state.isSidebarVisible 
      })),
      
      setSidebarVisible: (visible) => set({ isSidebarVisible: visible }),
      
      setSidebarResizing: (resizing) => set({ isSidebarResizing: resizing }),
      
      setWindowFocused: (focused) => set({ isWindowFocused: focused }),
      
      setMaximized: (maximized) => set({ isMaximized: maximized }),
      
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
      
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'devblitz-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        isSidebarVisible: state.isSidebarVisible,
        theme: state.theme,
      }),
    }
  )
);

// Selectors
export const useSidebarWidth = () => useAppStore((state) => state.sidebarWidth);
export const useSidebarVisible = () => useAppStore((state) => state.isSidebarVisible);
export const useSidebarResizing = () => useAppStore((state) => state.isSidebarResizing);
export const useWindowFocused = () => useAppStore((state) => state.isWindowFocused);
export const useIsMaximized = () => useAppStore((state) => state.isMaximized);
export const useTheme = () => useAppStore((state) => state.theme);

