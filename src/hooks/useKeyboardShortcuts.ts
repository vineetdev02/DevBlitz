'use client';

import { useEffect, useCallback } from 'react';
import { getPlatform } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const platform = getPlatform();
    const isMac = platform === 'mac';

    for (const shortcut of shortcuts) {
      const modifierMatch =
        (shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey) &&
        (shortcut.meta === undefined || shortcut.meta === event.metaKey) &&
        (shortcut.shift === undefined || shortcut.shift === event.shiftKey) &&
        (shortcut.alt === undefined || shortcut.alt === event.altKey);

      // Handle platform-specific modifier (Cmd on Mac, Ctrl on others)
      const platformModifier = isMac ? event.metaKey : event.ctrlKey;
      const needsModifier = shortcut.ctrl || shortcut.meta;
      
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && modifierMatch && (!needsModifier || platformModifier)) {
        event.preventDefault();
        shortcut.handler();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for global app shortcuts
 */
export function useGlobalShortcuts(handlers: {
  onOpenFolder?: () => void;
  onToggleSidebar?: () => void;
  onNewFile?: () => void;
}) {
  const { toggleSidebar } = useAppStore();

  const shortcuts: ShortcutHandler[] = [];

  if (handlers.onOpenFolder) {
    shortcuts.push({
      key: 'o',
      ctrl: true,
      handler: handlers.onOpenFolder,
    });
  }

  if (handlers.onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      handler: handlers.onToggleSidebar || toggleSidebar,
    });
  }

  if (handlers.onNewFile) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      handler: handlers.onNewFile,
    });
  }

  useKeyboardShortcuts(shortcuts);
}




