'use client';

import React, { memo, useCallback } from 'react';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  Image,
  Settings,
  FileType,
  Database,
  Terminal,
  GitBranch,
  Package,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileContextMenu } from './ContextMenu';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { useCurrentProject } from '@/stores/projectStore';
import { readFileContent } from '@/lib/tauri-commands';
import type { FileTreeNode } from '@/types';

interface FileNodeProps {
  node: FileTreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

export const FileNode = memo(function FileNode({
  node,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}: FileNodeProps) {
  const Icon = getFileIcon(node, isExpanded);
  const iconColor = getIconColor(node);
  const { openFile } = useEditorStore();
  const currentProject = useCurrentProject();

  // VS Code style indent: 8px base + 12px per level
  const indent = 8 + node.depth * 12;

  const handleOpenFile = useCallback(async () => {
    if (node.isDirectory || !currentProject) return;

    try {
      const content = await readFileContent(node.path, currentProject.path);
      openFile({
        path: node.path,
        name: node.name,
        content: content || '',
        language: getLanguageFromExtension(node.extension),
      });
    } catch (err) {
      console.error('Failed to open file:', err);
      openFile({
        path: node.path,
        name: node.name,
        content: `// Error: ${err instanceof Error ? err.message : 'Failed to load'}`,
        language: 'plaintext',
      });
    }
  }, [node, currentProject, openFile]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    
    if (node.isDirectory) {
      onToggle();
    } else {
      handleOpenFile();
    }
  };

  return (
    <FileContextMenu node={node}>
      <div
        role="treeitem"
        aria-expanded={node.isDirectory ? isExpanded : undefined}
        aria-selected={isSelected}
        className={cn(
          'relative flex items-center h-[22px] cursor-pointer',
          'hover:bg-white/5 transition-colors duration-75',
          'text-[13px] select-none',
          isSelected && 'bg-white/10',
        )}
        style={{ paddingLeft: `${indent}px` }}
        onClick={handleClick}
      >
        {/* Indent guide lines */}
        {node.depth > 0 && (
          <>
            {Array.from({ length: node.depth }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-neutral-800"
                style={{ left: `${16 + i * 12}px` }}
              />
            ))}
          </>
        )}

        {/* Chevron for directories */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mr-0.5">
          {node.isDirectory && (
            node.isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />
            ) : (
              <ChevronRight
                className={cn(
                  'w-3 h-3 text-neutral-500 transition-transform duration-100',
                  isExpanded && 'rotate-90'
                )}
              />
            )
          )}
        </span>

        {/* Icon */}
        <Icon className={cn('w-4 h-4 mr-1.5 flex-shrink-0', iconColor)} />

        {/* Name */}
        <span className={cn('truncate', node.isHidden && 'opacity-50')}>
          {node.name}
        </span>
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
    return 'text-yellow-500';
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
