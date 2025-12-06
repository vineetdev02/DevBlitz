'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Titlebar } from './Titlebar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { useSidebarVisible } from '@/stores/appStore';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main application layout with titlebar, sidebar, and status bar
 * Used for the IDE view when a project is open
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  const isSidebarVisible = useSidebarVisible();

  return (
    <div className={cn('flex flex-col h-screen bg-background', className)}>
      {/* Titlebar */}
      <Titlebar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isSidebarVisible && <Sidebar />}

        {/* Editor/content area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

