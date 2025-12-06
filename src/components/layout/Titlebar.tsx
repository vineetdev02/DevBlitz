'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import { useCurrentProject } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';

/**
 * Custom window titlebar with controls
 * Enables frameless window with custom styling
 */
export function Titlebar() {
  const currentProject = useCurrentProject();
  const { isMaximized, setMaximized } = useAppStore();
  const [isTauriAvailable, setIsTauriAvailable] = useState(false);

  // Check if Tauri is available
  useEffect(() => {
    setIsTauriAvailable(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  // Window control handlers
  const handleMinimize = useCallback(async () => {
    if (!isTauriAvailable) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  }, [isTauriAvailable]);

  const handleMaximize = useCallback(async () => {
    if (!isTauriAvailable) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const window = getCurrentWindow();
    const maximized = await window.isMaximized();
    if (maximized) {
      await window.unmaximize();
      setMaximized(false);
    } else {
      await window.maximize();
      setMaximized(true);
    }
  }, [isTauriAvailable, setMaximized]);

  const handleClose = useCallback(async () => {
    if (!isTauriAvailable) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  }, [isTauriAvailable]);

  // Listen for window state changes
  useEffect(() => {
    if (!isTauriAvailable) return;

    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      
      unlisten = await window.onResized(async () => {
        const maximized = await window.isMaximized();
        setMaximized(maximized);
      });
    };

    setupListener();

    return () => {
      unlisten?.();
    };
  }, [isTauriAvailable, setMaximized]);

  const title = currentProject?.name 
    ? `${currentProject.name} - ${APP_NAME}` 
    : APP_NAME;

  return (
    <header
      className={cn(
        'flex items-center justify-between h-10 bg-background border-b border-border',
        'select-none drag-region'
      )}
    >
      {/* Left section: Logo and title */}
      <div className="flex items-center gap-3 px-4 no-drag">
        {/* DevBlitz Logo */}
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-400 rounded opacity-90" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="relative w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
                fill="currentColor"
                className="text-black"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {APP_NAME}
          </span>
        </div>
      </div>

      {/* Center: Window title */}
      <div className="flex-1 text-center">
        <span className="text-xs text-muted-foreground truncate">
          {currentProject?.name && (
            <span className="text-foreground">{currentProject.name}</span>
          )}
        </span>
      </div>

      {/* Right section: Window controls */}
      <div className="flex items-center no-drag">
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="titlebar-button"
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          className="titlebar-button"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Square className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="titlebar-button close"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

