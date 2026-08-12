'use client';

import React from 'react';
import { Files, GitBranch, Package, Search, Settings, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivePanel, useAppStore, useSidebarVisible } from '@/stores/appStore';
import { useGitChangeCount } from '@/stores/gitStore';
import { useDirtyFileCount } from '@/stores/editorStore';
import { useTerminalStore } from '@/stores/terminalStore';
import { useCurrentProject } from '@/stores/projectStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SidebarPanel } from '@/stores/appStore';

/**
 * The 48px rail on the far left. It stays visible when the side bar is
 * collapsed - that is the whole point of splitting it out of Sidebar.
 */
export function ActivityBar() {
  const activePanel = useActivePanel();
  const isSidebarVisible = useSidebarVisible();
  const { revealPanel, setSettingsOpen } = useAppStore();
  const { toggleTerminal, isTerminalOpen, createTerminal, terminals } = useTerminalStore();
  const currentProject = useCurrentProject();

  const gitChanges = useGitChangeCount();
  const dirtyFiles = useDirtyFileCount();

  const items: {
    id: SidebarPanel;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    keys: string;
    badge?: number;
  }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer', keys: 'Ctrl+Shift+E', badge: dirtyFiles },
    { id: 'search', icon: Search, label: 'Search', keys: 'Ctrl+Shift+F' },
    { id: 'git', icon: GitBranch, label: 'Source Control', keys: 'Ctrl+Shift+G', badge: gitChanges },
    { id: 'extensions', icon: Package, label: 'Extensions', keys: 'Ctrl+Shift+X' },
  ];

  const handleToggleTerminal = () => {
    if (!isTerminalOpen && terminals.length === 0) {
      createTerminal(currentProject?.path || '/');
    }
    toggleTerminal();
  };

  return (
    <TooltipProvider delayDuration={400}>
      <nav className="flex w-12 flex-col items-center border-r border-white/[0.06] bg-[#080808] py-1.5">
        {items.map((item) => {
          const isActive = activePanel === item.id && isSidebarVisible;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => revealPanel(item.id)}
                  aria-label={item.label}
                  aria-pressed={isActive}
                  className={cn(
                    'group relative mb-0.5 flex h-11 w-12 items-center justify-center',
                    'transition-colors duration-150',
                    isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-200'
                  )}
                >
                  {/* Active indicator bar, VS Code style */}
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r bg-white transition-all duration-150',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  <item.icon className="h-[20px] w-[20px]" />

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        'absolute bottom-1.5 right-1.5 flex h-[15px] min-w-[15px] items-center justify-center',
                        'rounded-full bg-blue-500 px-1 text-[9px] font-semibold leading-none text-white',
                        'ring-2 ring-[#080808]'
                      )}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {item.label}
                <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px] text-neutral-400">
                  {item.keys}
                </kbd>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleToggleTerminal}
              aria-label="Toggle Terminal"
              className={cn(
                'mb-0.5 flex h-11 w-12 items-center justify-center transition-colors duration-150',
                isTerminalOpen ? 'text-white' : 'text-neutral-500 hover:text-neutral-200'
              )}
            >
              <Terminal className="h-[20px] w-[20px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            Terminal
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px] text-neutral-400">
              Ctrl+`
            </kbd>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="flex h-11 w-12 items-center justify-center text-neutral-500 transition-colors duration-150 hover:text-neutral-200"
            >
              <Settings className="h-[20px] w-[20px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            Settings
            <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px] text-neutral-400">
              Ctrl+,
            </kbd>
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
