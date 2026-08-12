'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Reorder, motion } from 'framer-motion';
import {
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  MoreHorizontal,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, useOpenFiles, useActiveFilePath, type OpenFile } from '@/stores/editorStore';
import { useCurrentProject } from '@/stores/projectStore';

export function EditorTabs() {
  const openFiles = useOpenFiles();
  const activeFilePath = useActiveFilePath();
  const currentProject = useCurrentProject();
  const {
    setActiveFile,
    closeFile,
    closeOtherFiles,
    closeSavedFiles,
    closeAllFiles,
    reorderFiles,
    saveAllFiles,
  } = useEditorStore();

  const [menu, setMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const dirtyCount = openFiles.filter((f) => f.isModified).length;

  // Keep the active tab visible when it changes from outside (Quick Open, etc).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeFilePath) return;

    const active = scroller.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [activeFilePath]);

  // Close the tab menu on any outside interaction.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);

    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  if (openFiles.length === 0) return null;

  return (
    <div className="relative flex h-[35px] flex-shrink-0 items-stretch border-b border-white/[0.06] bg-[#080808]">
      <div
        ref={scrollerRef}
        className="scrollbar-none flex flex-1 overflow-x-auto overflow-y-hidden"
      >
        <Reorder.Group axis="x" values={openFiles} onReorder={reorderFiles} className="flex">
          {openFiles.map((file) => (
            <TabItem
              key={file.path}
              file={file}
              isActive={file.path === activeFilePath}
              projectPath={currentProject?.path}
              onSelect={() => setActiveFile(file.path)}
              onClose={() => closeFile(file.path)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ x: e.clientX, y: e.clientY, path: file.path });
              }}
            />
          ))}
        </Reorder.Group>
      </div>

      {/* Editor group actions */}
      <div className="flex flex-shrink-0 items-center gap-0.5 border-l border-white/[0.06] px-1.5">
        {dirtyCount > 0 && (
          <button
            onClick={() => void saveAllFiles()}
            title={`Save All (${dirtyCount} unsaved)`}
            className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Save className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.right - 180, y: rect.bottom + 2, path: activeFilePath ?? '' });
          }}
          title="More Actions"
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {menu && (
        <div
          className={cn(
            'fixed z-50 w-48 rounded-md border border-white/10 py-1',
            'bg-[#0d0d0d]/97 shadow-2xl shadow-black/70 backdrop-blur-xl'
          )}
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            label="Close"
            shortcut="Ctrl+W"
            onClick={() => {
              if (menu.path) closeFile(menu.path);
              setMenu(null);
            }}
          />
          <MenuItem
            label="Close Others"
            onClick={() => {
              if (menu.path) closeOtherFiles(menu.path);
              setMenu(null);
            }}
          />
          <MenuItem
            label="Close Saved"
            onClick={() => {
              closeSavedFiles();
              setMenu(null);
            }}
          />
          <MenuItem
            label="Close All"
            onClick={() => {
              closeAllFiles();
              setMenu(null);
            }}
          />
          <div className="my-1 h-px bg-white/[0.08]" />
          <MenuItem
            label="Save All"
            shortcut="Ctrl+K S"
            onClick={() => {
              void saveAllFiles();
              setMenu(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  shortcut,
  onClick,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-neutral-300 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[11px] text-neutral-600">{shortcut}</span>}
    </button>
  );
}

interface TabItemProps {
  file: OpenFile;
  isActive: boolean;
  projectPath?: string;
  onSelect: () => void;
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function TabItem({ file, isActive, projectPath, onSelect, onClose, onContextMenu }: TabItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = getFileIcon(file.name);
  const iconColor = getIconColor(file.name);

  const relativePath =
    projectPath && file.path.startsWith(projectPath)
      ? file.path.slice(projectPath.length).replace(/^[/\\]/, '')
      : file.path;

  return (
    <Reorder.Item
      value={file}
      data-active={isActive}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onAuxClick={(e: React.MouseEvent) => {
        // Middle-click closes, the way every browser and editor does.
        if (e.button === 1) {
          e.preventDefault();
          onClose();
        }
      }}
      title={relativePath}
      whileDrag={{ scale: 1.02 }}
      className={cn(
        'group relative flex h-[35px] min-w-0 max-w-[200px] cursor-pointer items-center gap-2 px-3',
        'border-r border-white/[0.06] transition-colors duration-100',
        isActive
          ? 'bg-black text-neutral-100'
          : 'bg-[#080808] text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300',
        isDragging && 'z-50 opacity-80'
      )}
    >
      {isActive && (
        <motion.div layoutId="activeTabIndicator" className="absolute inset-x-0 top-0 h-[2px] bg-blue-500" />
      )}

      <Icon className={cn('h-4 w-4 flex-shrink-0', iconColor)} />

      <span className={cn('flex-1 truncate text-[13px]', file.isModified && 'italic')}>
        {file.name}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Close"
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-white/15"
      >
        {file.isModified ? (
          <>
            <span className="h-2 w-2 rounded-full bg-neutral-200 group-hover:hidden" />
            <X className="hidden h-3.5 w-3.5 group-hover:block" />
          </>
        ) : (
          <X className={cn('h-3.5 w-3.5 opacity-0 transition-opacity', isActive && 'opacity-60', 'group-hover:opacity-100')} />
        )}
      </button>
    </Reorder.Item>
  );
}

function getFileIcon(filename: string): React.ComponentType<{ className?: string }> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'rb', 'php'].includes(ext)) return FileCode;
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return FileJson;
  if (['md', 'txt', 'html'].includes(ext)) return FileText;
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return FileType;
  return File;
}

function getIconColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  const colors: Record<string, string> = {
    js: 'text-yellow-400',
    jsx: 'text-cyan-400',
    ts: 'text-blue-400',
    tsx: 'text-blue-400',
    py: 'text-yellow-500',
    rs: 'text-orange-400',
    go: 'text-cyan-400',
    java: 'text-red-400',
    json: 'text-yellow-500',
    css: 'text-blue-400',
    scss: 'text-pink-400',
    html: 'text-orange-400',
    md: 'text-blue-300',
  };

  return colors[ext] || 'text-neutral-500';
}
