'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { Files, Search, GitBranch, Settings, ChevronLeft, Terminal, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useSidebarWidth, useSidebarVisible } from '@/stores/appStore';
import { useTerminalStore } from '@/stores/terminalStore';
import { useCurrentProject } from '@/stores/projectStore';
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '@/lib/constants';
import { FileTree } from '@/components/explorer/FileTree';
import { SearchPanel } from '@/components/search/SearchPanel';
import { ExtensionsPanel } from '@/components/extensions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SidebarTab = 'explorer' | 'search' | 'git' | 'extensions';

interface SidebarProps {
  className?: string;
  onOpenSettings?: () => void;
}

export function Sidebar({ className, onOpenSettings }: SidebarProps) {
  const sidebarWidth = useSidebarWidth();
  const isSidebarVisible = useSidebarVisible();
  const { setSidebarWidth, setSidebarResizing, toggleSidebar } = useAppStore();
  const { toggleTerminal, isTerminalOpen, createTerminal } = useTerminalStore();
  const currentProject = useCurrentProject();
  
  const [activeTab, setActiveTab] = React.useState<SidebarTab>('explorer');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const handleToggleTerminal = () => {
    if (!isTerminalOpen) {
      // Create terminal if none exists
      const cwd = currentProject?.path || '/';
      createTerminal(cwd);
    }
    toggleTerminal();
  };

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
      const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, e.clientX));
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

  if (!isSidebarVisible) return null;

  const tabs: { id: SidebarTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'extensions', icon: Package, label: 'Extensions' },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        ref={sidebarRef}
        className={cn('relative flex h-full bg-background border-r border-border', className)}
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
                >
                  <tab.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tab.label}</TooltipContent>
            </Tooltip>
          ))}

          <div className="flex-1" />

          {/* Terminal toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleTerminal}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md mb-1',
                  'transition-colors duration-150',
                  isTerminalOpen
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Terminal className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Terminal (Ctrl+`)</TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenSettings}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md mb-1',
                  'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  'transition-colors duration-150'
                )}
              >
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings (Ctrl+,)</TooltipContent>
          </Tooltip>

          {/* Collapse */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-md',
                  'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  'transition-colors duration-150'
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse Sidebar (Ctrl+B)</TooltipContent>
          </Tooltip>
        </div>

        {/* Panel content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center h-9 px-4 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'explorer' && (
              <ScrollArea className="h-full">
                <FileTree />
              </ScrollArea>
            )}
            {activeTab === 'search' && <SearchPanel />}
            {activeTab === 'git' && (
              <div className="flex flex-col items-center justify-center h-48 p-4 text-muted-foreground">
                <GitBranch className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm">Source Control</p>
                <p className="text-xs mt-1 opacity-60">Coming soon...</p>
              </div>
            )}
            {activeTab === 'extensions' && <ExtensionsPanel />}
          </div>
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
