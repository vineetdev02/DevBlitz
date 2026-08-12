'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Titlebar } from './Titlebar';
import { Sidebar } from './Sidebar';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { Toaster } from '@/components/ui/toast';
import { CommandPalette } from '@/components/command/CommandPalette';
import { useSidebarVisible, useZenMode } from '@/stores/appStore';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * The IDE shell: title bar, activity rail, side bar, editor area, status bar.
 * Zen mode strips everything but the editor.
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  const isSidebarVisible = useSidebarVisible();
  const isZenMode = useZenMode();

  return (
    <div className={cn('flex h-screen flex-col overflow-hidden bg-black', className)}>
      {!isZenMode && <Titlebar />}

      <div className="flex min-h-0 flex-1">
        {!isZenMode && <ActivityBar />}
        {!isZenMode && isSidebarVisible && <Sidebar />}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>

      {!isZenMode && <StatusBar />}

      {/* Overlays live above every panel */}
      <CommandPalette />
      <Toaster />
    </div>
  );
}
