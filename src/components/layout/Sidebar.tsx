'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { Files, Search, GitBranch, Settings, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useSidebarWidth, useSidebarVisible } from '@/stores/appStore';
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '@/lib/constants';
import { FileTree } from '@/components/explorer/FileTree';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SidebarTab = 'explorer' | 'search' | 'git' | 'settings';

interface SidebarProps {
  className?: string;
}

/**
 * Main sidebar component with file explorer and other panels
 */
export function Sidebar({ className }: SidebarProps) {
  const sidebarWidth = useSidebarWidth();
  const isSidebarVisible = useSidebarVisible();
  const { setSidebarWidth, setSidebarResizing, toggleSidebar } = useAppStore();
  
  const [activeTab, setActiveTab] = React.useState<SidebarTab>('explorer');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Handle resize
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    setSidebarResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [setSidebarResizing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      const newWidth = Math.max(
        SIDEBAR_MIN_WIDTH,
        Math.min(SIDEBAR_MAX_WIDTH, e.clientX)
      );
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        setSidebarResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setSidebarWidth, setSidebarResizing]);

  if (!isSidebarVisible) {
    return null;
  }

  const tabs: { id: SidebarTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        ref={sidebarRef}
        className={cn(
          'relative flex h-full bg-background border-r border-border',
          className
        )}
        style={{ width: sidebarWidth }}
      >
        {/* Activity bar */}
        <div className="flex flex-col items-center w-12 py-2 border-r border-border bg-card/50">
          {tabs.map((tab) => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-md mb-1',
                    'transition-colors duration-150',
                    activeTab === tab.id
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  aria-label={tab.label}
                >
                  <tab.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {tab.label}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Collapse button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md',
                  'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  'transition-colors duration-150'
                )}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Collapse Sidebar (⌘B)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Panel content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center h-9 px-4 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          {/* Panel body */}
          <ScrollArea className="flex-1">
            {activeTab === 'explorer' && <FileTree />}
            {activeTab === 'search' && (
              <div className="p-4 text-sm text-muted-foreground">
                Search coming soon...
              </div>
            )}
            {activeTab === 'git' && (
              <div className="p-4 text-sm text-muted-foreground">
                Git integration coming soon...
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="p-4 text-sm text-muted-foreground">
                Settings coming soon...
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Resize handle */}
        <div
          className={cn(
            'absolute right-0 top-0 w-1 h-full cursor-col-resize',
            'hover:bg-ring/50 transition-colors duration-150',
            'active:bg-ring'
          )}
          onMouseDown={startResize}
        />
      </aside>
    </TooltipProvider>
  );
}

