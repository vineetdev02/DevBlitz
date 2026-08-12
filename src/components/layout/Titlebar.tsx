'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Minus, Search, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import { useCurrentProject } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';
import { useActiveFile } from '@/stores/editorStore';
import { useCommands, type EditorCommand } from '@/hooks/useCommands';

/** Which commands appear under each top-level menu, in order. */
const MENUS: { label: string; commandIds: (string | '---')[] }[] = [
  {
    label: 'File',
    commandIds: [
      'file.new',
      'file.openFolder',
      '---',
      'file.save',
      'file.saveAll',
      'file.revert',
      '---',
      'file.closeEditor',
      'file.closeAll',
      'file.closeFolder',
    ],
  },
  {
    label: 'Edit',
    commandIds: ['go.toLine', 'go.toSymbol', '---', 'editor.zoomIn', 'editor.zoomOut', 'editor.resetZoom'],
  },
  {
    label: 'View',
    commandIds: [
      'view.commandPalette',
      '---',
      'view.explorer',
      'view.search',
      'view.git',
      'view.extensions',
      '---',
      'view.toggleSidebar',
      'view.toggleTerminal',
      'view.toggleZenMode',
      '---',
      'view.toggleWordWrap',
      'view.toggleMinimap',
      'view.toggleBreadcrumbs',
    ],
  },
  {
    label: 'Go',
    commandIds: ['go.toFile', 'go.toSymbol', 'go.toLine'],
  },
  {
    label: 'Terminal',
    commandIds: ['view.newTerminal', 'view.toggleTerminal'],
  },
];

export function Titlebar() {
  const currentProject = useCurrentProject();
  const activeFile = useActiveFile();
  const { isMaximized, setMaximized, setQuickOpenOpen, setSettingsOpen } = useAppStore();
  const commands = useCommands();

  const [isTauriAvailable, setIsTauriAvailable] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTauriAvailable(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  // Close menus on outside click or Escape.
  useEffect(() => {
    if (!openMenu) return;

    const handleClick = (e: MouseEvent) => {
      if (!menuBarRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [openMenu]);

  const handleMinimize = useCallback(async () => {
    if (!isTauriAvailable) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  }, [isTauriAvailable]);

  const handleMaximize = useCallback(async () => {
    if (!isTauriAvailable) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();

    if (await appWindow.isMaximized()) {
      await appWindow.unmaximize();
      setMaximized(false);
    } else {
      await appWindow.maximize();
      setMaximized(true);
    }
  }, [isTauriAvailable, setMaximized]);

  const handleClose = useCallback(async () => {
    if (!isTauriAvailable) return;
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  }, [isTauriAvailable]);

  useEffect(() => {
    if (!isTauriAvailable) return;
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      unlisten = await appWindow.onResized(async () => {
        setMaximized(await appWindow.isMaximized());
      });
    };

    setup();
    return () => unlisten?.();
  }, [isTauriAvailable, setMaximized]);

  const byId = new Map(commands.map((command) => [command.id, command]));

  return (
    <header className="drag-region flex h-10 flex-shrink-0 select-none items-center border-b border-white/[0.06] bg-[#080808]">
      {/* Logo + menu bar */}
      <div ref={menuBarRef} className="no-drag flex items-center">
        <div className="flex items-center gap-2 pl-3 pr-2">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="devblitz-bolt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#8b8b8b" />
              </linearGradient>
            </defs>
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="url(#devblitz-bolt)" />
          </svg>
        </div>

        {MENUS.map((menu) => {
          const items = menu.commandIds
            .map((id) => (id === '---' ? '---' : byId.get(id)))
            .filter((item): item is EditorCommand | '---' => Boolean(item));

          return (
            <div key={menu.label} className="relative">
              <button
                onClick={() => setOpenMenu((current) => (current === menu.label ? null : menu.label))}
                onMouseEnter={() => setOpenMenu((current) => (current ? menu.label : current))}
                className={cn(
                  'h-10 px-2.5 text-[13px] transition-colors',
                  openMenu === menu.label
                    ? 'bg-white/[0.08] text-white'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                {menu.label}
              </button>

              {openMenu === menu.label && (
                <div
                  className={cn(
                    'absolute left-0 top-10 z-50 w-64 rounded-md border border-white/10 py-1',
                    'bg-[#0d0d0d]/97 shadow-2xl shadow-black/70 backdrop-blur-xl'
                  )}
                >
                  {items.map((item, index) =>
                    item === '---' ? (
                      <div key={`sep-${index}`} className="my-1 h-px bg-white/[0.08]" />
                    ) : (
                      <button
                        key={item.id}
                        onClick={() => {
                          setOpenMenu(null);
                          void item.run();
                        }}
                        disabled={item.isAvailable ? !item.isAvailable() : false}
                        className={cn(
                          'flex w-full items-center gap-4 px-3 py-1.5 text-left text-[13px] transition-colors',
                          'text-neutral-300 hover:bg-white/[0.08] hover:text-white',
                          'disabled:cursor-default disabled:text-neutral-700 disabled:hover:bg-transparent'
                        )}
                      >
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.keybinding && (
                          <span className="flex-shrink-0 text-[11px] text-neutral-600">
                            {item.keybinding}
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Centre: quick open trigger, styled like VS Code's command centre */}
      <div className="flex flex-1 justify-center px-4">
        <button
          onClick={() => setQuickOpenOpen(true)}
          disabled={!currentProject}
          className={cn(
            'no-drag flex h-6 w-full max-w-[420px] items-center gap-2 rounded-md px-3',
            'border border-white/[0.08] bg-white/[0.03] text-[12px] text-neutral-500',
            'transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-neutral-300',
            'disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white/[0.03]'
          )}
        >
          <Search className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {activeFile?.name ?? currentProject?.name ?? APP_NAME}
          </span>
          <kbd className="ml-auto flex-shrink-0 rounded border border-white/10 px-1 font-mono text-[10px]">
            Ctrl+P
          </kbd>
        </button>
      </div>

      {/* Window controls */}
      <div className="no-drag flex items-center">
        <button onClick={() => setSettingsOpen(true)} className="hidden" aria-hidden />
        <WindowButton onClick={handleMinimize} label="Minimize">
          <Minus className="h-4 w-4" />
        </WindowButton>
        <WindowButton onClick={handleMaximize} label={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3 w-3" />}
        </WindowButton>
        <WindowButton onClick={handleClose} label="Close" danger>
          <X className="h-4 w-4" />
        </WindowButton>
      </div>
    </header>
  );
}

function WindowButton({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-10 w-11 items-center justify-center text-neutral-400 transition-colors',
        danger ? 'hover:bg-red-600 hover:text-white' : 'hover:bg-white/10 hover:text-white'
      )}
    >
      {children}
    </button>
  );
}
