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
  onOpenSettings?: () => void;
}

export function AppLayout({ children, className, onOpenSettings }: AppLayoutProps) {
  const isSidebarVisible = useSidebarVisible();

  return (
    <div className={cn('flex flex-col h-screen bg-background', className)}>
      <Titlebar />

      <div className="flex flex-1 overflow-hidden">
        {isSidebarVisible && <Sidebar onOpenSettings={onOpenSettings} />}

        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
