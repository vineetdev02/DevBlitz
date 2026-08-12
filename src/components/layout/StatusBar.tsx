'use client';

import React, { useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  GitBranch,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/stores/projectStore';
import { useActiveFile, useDirtyFileCount } from '@/stores/editorStore';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGitStore } from '@/stores/gitStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { detectIndentation, detectLineEnding } from '@/lib/editor-utils';
import { getLanguageLabel } from '@/lib/highlight';

/** How often to poll git for branch and change counts. */
const GIT_POLL_MS = 5000;

export function StatusBar({ className }: { className?: string }) {
  const currentProject = useCurrentProject();
  const activeFile = useActiveFile();
  const dirtyCount = useDirtyFileCount();
  const { setActivePanel, setCommandPaletteOpen } = useAppStore();
  const { tabSize, setTabSize } = useSettingsStore();
  const notifications = useNotificationStore((state) => state.notifications);

  const { info, staged, unstaged, isRefreshing, refresh } = useGitStore();

  // Keep git status fresh while a project is open.
  useEffect(() => {
    const basePath = currentProject?.path;
    if (!basePath) return;

    refresh(basePath);
    const timer = setInterval(() => refresh(basePath), GIT_POLL_MS);
    return () => clearInterval(timer);
  }, [currentProject?.path, refresh]);

  const indentation = useMemo(
    () => (activeFile ? detectIndentation(activeFile.content) : null),
    [activeFile]
  );

  const lineEnding = useMemo(
    () => (activeFile ? detectLineEnding(activeFile.content) : 'LF'),
    [activeFile]
  );

  const cursor = activeFile?.cursor;
  const changeCount = staged.length + unstaged.length;

  return (
    <footer
      className={cn(
        'flex h-[24px] flex-shrink-0 select-none items-center justify-between',
        'border-t border-white/[0.06] bg-[#080808] px-2 text-[11px] text-neutral-400',
        className
      )}
    >
      {/* Left: repository state */}
      <div className="flex items-center gap-0.5">
        {info?.isRepo ? (
          <>
            <StatusItem
              onClick={() => setActivePanel('git')}
              title={`${changeCount} change${changeCount === 1 ? '' : 's'} — click to open Source Control`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>{info.branch}</span>
              {changeCount > 0 && <span className="text-neutral-500">{changeCount}*</span>}
            </StatusItem>

            <StatusItem
              onClick={() => currentProject?.path && refresh(currentProject.path)}
              title={
                info.hasUpstream
                  ? `${info.behind} incoming, ${info.ahead} outgoing`
                  : 'No upstream branch configured'
              }
            >
              {isRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {info.hasUpstream && (
                <span className="tabular-nums">
                  {info.behind}↓ {info.ahead}↑
                </span>
              )}
            </StatusItem>
          </>
        ) : currentProject ? (
          <StatusItem title="This folder is not a git repository">
            <GitBranch className="h-3.5 w-3.5 opacity-50" />
            <span className="opacity-60">no repo</span>
          </StatusItem>
        ) : null}

        <StatusItem
          onClick={() => setActivePanel('search')}
          title="Problems (nothing is reported yet)"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span className="tabular-nums">0</span>
          <AlertCircle className="ml-1 h-3.5 w-3.5" />
          <span className="tabular-nums">0</span>
        </StatusItem>
      </div>

      {/* Right: editor state */}
      <div className="flex items-center gap-0.5">
        {dirtyCount > 0 && (
          <StatusItem title={`${dirtyCount} unsaved file${dirtyCount === 1 ? '' : 's'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>{dirtyCount} unsaved</span>
          </StatusItem>
        )}

        {activeFile?.isSaving && (
          <StatusItem>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Saving…</span>
          </StatusItem>
        )}

        {cursor && (
          <StatusItem
            onClick={() => {
              setCommandPaletteOpen(false);
              useAppStore.getState().setQuickOpenOpen(true);
              window.dispatchEvent(new CustomEvent('devblitz:quickopen-prefix', { detail: ':' }));
            }}
            title="Go to Line/Column"
          >
            <span className="tabular-nums">
              Ln {cursor.line}, Col {cursor.column}
            </span>
            {cursor.selectionLength > 0 && (
              <span className="text-neutral-500">
                ({cursor.selectionLength} selected
                {cursor.selectedLines > 1 ? ` on ${cursor.selectedLines} lines` : ''})
              </span>
            )}
          </StatusItem>
        )}

        {indentation && (
          <StatusItem
            onClick={() => setTabSize(tabSize === 2 ? 4 : 2)}
            title="Click to switch between 2 and 4 spaces"
          >
            {indentation.type === 'tabs' ? 'Tab Size' : 'Spaces'}: {tabSize}
          </StatusItem>
        )}

        {activeFile && (
          <>
            <StatusItem title="Encoding">UTF-8</StatusItem>
            <StatusItem title="Line ending">{lineEnding}</StatusItem>
            <StatusItem title="Language mode">{getLanguageLabel(activeFile.language)}</StatusItem>
          </>
        )}

        <StatusItem title={`${notifications.length} notification${notifications.length === 1 ? '' : 's'}`}>
          {notifications.length > 0 ? (
            <span className="relative">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
            </span>
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </StatusItem>
      </div>
    </footer>
  );
}

function StatusItem({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={!onClick}
      className={cn(
        'flex h-[24px] items-center gap-1.5 rounded px-2 transition-colors',
        onClick ? 'hover:bg-white/10 hover:text-white' : 'cursor-default'
      )}
    >
      {children}
    </button>
  );
}
