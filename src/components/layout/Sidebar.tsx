'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  ChevronsDownUp,
  FilePlus,
  FolderPlus,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivePanel, useAppStore, useSidebarWidth } from '@/stores/appStore';
import { useCurrentProject, useProjectStore } from '@/stores/projectStore';
import { useExplorerStore } from '@/stores/explorerStore';
import { useGitStore } from '@/stores/gitStore';
import { useFileOperations } from '@/hooks/useFileOperations';
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from '@/lib/constants';
import { FileTree } from '@/components/explorer/FileTree';
import { SearchPanel } from '@/components/search/SearchPanel';
import { ExtensionsPanel } from '@/components/extensions';
import { GitPanel } from '@/components/git/GitPanel';
import { ScrollArea } from '@/components/ui/scroll-area';

const PANEL_TITLES = {
  explorer: 'Explorer',
  search: 'Search',
  git: 'Source Control',
  extensions: 'Extensions',
} as const;

/**
 * The side bar content area. The icon rail lives in ActivityBar so it survives
 * the side bar being collapsed.
 */
export function Sidebar({ className }: { className?: string }) {
  const sidebarWidth = useSidebarWidth();
  const activePanel = useActivePanel();
  const { setSidebarWidth, setSidebarResizing } = useAppStore();

  const currentProject = useCurrentProject();
  const { isLoadingTree, collapseAll } = useProjectStore();
  const { startCreate } = useExplorerStore();
  const { refreshDirectory } = useFileOperations();

  const gitRefresh = useGitStore((state) => state.refresh);
  const isGitRefreshing = useGitStore((state) => state.isRefreshing);

  const isResizing = useRef(false);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      setSidebarResizing(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setSidebarResizing]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // The 48px activity bar sits to the left of the panel.
      const width = e.clientX - 48;
      setSidebarWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width)));
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      setSidebarResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setSidebarWidth, setSidebarResizing]);

  return (
    <aside
      className={cn('relative flex h-full flex-col border-r border-white/[0.06] bg-[#0a0a0a]', className)}
      style={{ width: sidebarWidth }}
    >
      {/* Panel header with contextual actions */}
      <div className="group flex h-9 flex-shrink-0 items-center justify-between border-b border-white/[0.06] pl-4 pr-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          {PANEL_TITLES[activePanel]}
        </span>

        <div className="flex items-center gap-0.5">
          {activePanel === 'explorer' && currentProject && (
            <>
              <HeaderButton label="New File" onClick={() => startCreate(null, 'file')}>
                <FilePlus className="h-4 w-4" />
              </HeaderButton>
              <HeaderButton label="New Folder" onClick={() => startCreate(null, 'folder')}>
                <FolderPlus className="h-4 w-4" />
              </HeaderButton>
              <HeaderButton label="Refresh Explorer" onClick={() => void refreshDirectory(null)}>
                {isLoadingTree ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </HeaderButton>
              <HeaderButton label="Collapse Folders" onClick={collapseAll}>
                <ChevronsDownUp className="h-4 w-4" />
              </HeaderButton>
            </>
          )}

          {activePanel === 'git' && currentProject && (
            <HeaderButton
              label="Refresh"
              onClick={() => void gitRefresh(currentProject.path)}
            >
              {isGitRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </HeaderButton>
          )}
        </div>
      </div>

      {/* Panel body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activePanel === 'explorer' && (
          <ScrollArea className="h-full">
            <FileTree />
          </ScrollArea>
        )}
        {activePanel === 'search' && <SearchPanel />}
        {activePanel === 'git' && <GitPanel />}
        {activePanel === 'extensions' && <ExtensionsPanel />}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="absolute -right-0.5 top-0 z-20 h-full w-1.5 cursor-col-resize transition-colors hover:bg-blue-500/60"
      />
    </aside>
  );
}

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
