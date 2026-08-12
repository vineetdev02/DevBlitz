'use client';

import React, { memo, useCallback } from 'react';
import {
  ChevronRight,
  Database,
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  Folder,
  FolderOpen,
  GitBranch,
  Image,
  Loader2,
  Package,
  Settings,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileContextMenu } from './ContextMenu';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { useExplorerStore } from '@/stores/explorerStore';
import { RenameRow } from './EditRows';
import type { FileTreeNode } from '@/types';

/** Colors matching git's own vocabulary for changed files. */
const GIT_STATUS_STYLES: Record<string, string> = {
  modified: 'text-amber-400',
  added: 'text-emerald-400',
  untracked: 'text-emerald-400',
  deleted: 'text-red-400',
  renamed: 'text-blue-400',
  conflicted: 'text-red-400',
};

const GIT_STATUS_LETTERS: Record<string, string> = {
  modified: 'M',
  added: 'A',
  untracked: 'U',
  deleted: 'D',
  renamed: 'R',
  conflicted: '!',
};

interface FileNodeProps {
  node: FileTreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  gitStatus?: string;
  onToggle: () => void;
  onSelect: () => void;
}

export const FileNode = memo(function FileNode({
  node,
  isExpanded,
  isSelected,
  gitStatus,
  onToggle,
  onSelect,
}: FileNodeProps) {
  const Icon = getFileIcon(node, isExpanded);
  const iconColor = getIconColor(node);

  const openFileFromDisk = useEditorStore((state) => state.openFileFromDisk);
  const isDirty = useEditorStore((state) =>
    state.openFiles.some((f) => f.path === node.path && f.isModified)
  );
  const isOpenInEditor = useEditorStore((state) =>
    state.openFiles.some((f) => f.path === node.path)
  );

  const renamingPath = useExplorerStore((state) => state.renamingPath);
  const isRenaming = renamingPath === node.path;

  // VS Code style indent: 8px base + 12px per level
  const indent = 8 + node.depth * 12;

  const handleOpenFile = useCallback(() => {
    if (node.isDirectory) return;
    void openFileFromDisk(node.path, node.name, getLanguageFromExtension(node.extension));
  }, [node, openFileFromDisk]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    if (node.isDirectory) onToggle();
    else handleOpenFile();
  };

  // Rendered by a dedicated component so ordinary nodes never subscribe to the
  // file-operation hooks.
  if (isRenaming) return <RenameRow node={node} indent={indent + 20} />;

  const statusColor = gitStatus ? GIT_STATUS_STYLES[gitStatus] : undefined;

  return (
    <FileContextMenu node={node} onOpen={handleOpenFile}>
      <div
        role="treeitem"
        aria-expanded={node.isDirectory ? isExpanded : undefined}
        aria-selected={isSelected}
        className={cn(
          'group relative flex h-[22px] cursor-pointer items-center pr-2',
          'text-[13px] transition-colors duration-75 hover:bg-white/[0.06]',
          isSelected && 'bg-white/[0.09]',
          isOpenInEditor && !isSelected && 'text-neutral-200'
        )}
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleClick}
      >
        {/* Indent guides */}
        {node.depth > 0 &&
          Array.from({ length: node.depth }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 top-0 w-px bg-white/[0.06]"
              style={{ left: `${16 + i * 12}px` }}
            />
          ))}

        <span className="mr-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center">
          {node.isDirectory &&
            (node.isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
            ) : (
              <ChevronRight
                className={cn(
                  'h-3 w-3 text-neutral-500 transition-transform duration-100',
                  isExpanded && 'rotate-90'
                )}
              />
            ))}
        </span>

        <Icon className={cn('mr-1.5 h-4 w-4 flex-shrink-0', statusColor ?? iconColor)} />

        <span
          className={cn(
            'truncate',
            node.isHidden && 'opacity-50',
            statusColor,
            gitStatus === 'deleted' && 'line-through'
          )}
        >
          {node.name}
        </span>

        {/* Unsaved indicator */}
        {isDirty && <span className="ml-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white" />}

        {/* Git status letter */}
        {gitStatus && (
          <span className={cn('ml-auto flex-shrink-0 pl-2 text-[11px] font-semibold', statusColor)}>
            {GIT_STATUS_LETTERS[gitStatus] ?? 'M'}
          </span>
        )}
      </div>
    </FileContextMenu>
  );
});

function getFileIcon(node: FileTreeNode, isExpanded: boolean): React.ComponentType<{ className?: string }> {
  if (node.isDirectory) {
    const name = node.name.toLowerCase();
    if (name === 'node_modules') return Package;
    if (name === '.git') return GitBranch;
    return isExpanded ? FolderOpen : Folder;
  }

  const ext = node.extension?.toLowerCase();
  if (!ext) return File;

  if (['js', 'jsx', 'ts', 'tsx', 'rs', 'py', 'rb', 'go', 'java', 'c', 'cpp', 'php'].includes(ext)) return FileCode;
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return FileJson;
  if (['md', 'txt', 'html', 'htm'].includes(ext)) return FileText;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return Image;
  if (['sql', 'db'].includes(ext)) return Database;
  if (['sh', 'bash', 'zsh'].includes(ext)) return Terminal;
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return FileType;
  if (['env', 'gitignore'].includes(ext)) return Settings;

  return File;
}

function getIconColor(node: FileTreeNode): string {
  if (node.isDirectory) {
    const name = node.name.toLowerCase();
    if (name === 'node_modules') return 'text-green-500/70';
    if (name === '.git') return 'text-orange-400';
    return 'text-neutral-400';
  }

  const ext = node.extension?.toLowerCase();
  if (!ext) return 'text-neutral-400';

  const colors: Record<string, string> = {
    js: 'text-yellow-400',
    jsx: 'text-cyan-400',
    ts: 'text-blue-400',
    tsx: 'text-blue-400',
    py: 'text-yellow-500',
    rs: 'text-orange-400',
    go: 'text-cyan-400',
    java: 'text-red-400',
    html: 'text-orange-400',
    css: 'text-blue-400',
    scss: 'text-pink-400',
    json: 'text-yellow-500',
    md: 'text-blue-300',
    svg: 'text-orange-400',
  };

  return colors[ext] || 'text-neutral-400';
}
