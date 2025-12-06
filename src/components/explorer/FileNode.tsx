'use client';

import React, { memo } from 'react';
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
import { FILE_TREE_INDENT } from '@/lib/constants';
import { FileContextMenu } from './ContextMenu';
import type { FileTreeNode } from '@/types';

interface FileNodeProps {
  node: FileTreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

/**
 * Single file/folder node in the file tree
 * Memoized for performance with large trees
 */
export const FileNode = memo(function FileNode({
  node,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}: FileNodeProps) {
  const Icon = getFileIcon(node);
  const indent = node.depth * FILE_TREE_INDENT;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    
    if (node.isDirectory) {
      onToggle();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Open file in editor
    console.log('Open file:', node.path);
  };

  return (
    <FileContextMenu node={node}>
      <div
        role="treeitem"
        aria-expanded={node.isDirectory ? isExpanded : undefined}
        aria-selected={isSelected}
        className={cn(
          'file-tree-item group',
          isSelected && 'selected bg-accent',
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
        onDoubleClick={!node.isDirectory ? handleDoubleClick : undefined}
      >
        {/* Expand/collapse arrow for directories */}
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {node.isDirectory && (
            node.isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : (
              <ChevronRight
                className={cn(
                  'w-3 h-3 text-muted-foreground transition-transform duration-150',
                  isExpanded && 'rotate-90'
                )}
              />
            )
          )}
        </span>

        {/* File/folder icon */}
        <span className="flex-shrink-0">
          <Icon
            className={cn(
              'w-4 h-4',
              node.isDirectory
                ? 'text-yellow-500'
                : 'text-muted-foreground'
            )}
          />
        </span>

        {/* File name */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            node.isHidden && 'opacity-60'
          )}
        >
          {node.name}
        </span>

        {/* Children count for directories */}
        {node.isDirectory && node.childrenCount !== null && node.childrenCount > 0 && (
          <span className="text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.childrenCount}
          </span>
        )}
      </div>
    </FileContextMenu>
  );
});

/**
 * Get appropriate icon for file type
 */
function getFileIcon(node: FileTreeNode): React.ComponentType<{ className?: string }> {
  if (node.isDirectory) {
    // Check for special folders
    const folderName = node.name.toLowerCase();
    
    if (folderName === 'node_modules') return Package;
    if (folderName === '.git') return GitBranch;
    
    return node.isExpanded ? FolderOpen : Folder;
  }

  // Get extension
  const ext = node.extension?.toLowerCase();

  if (!ext) {
    // Special files without extension
    const fileName = node.name.toLowerCase();
    if (fileName === 'dockerfile' || fileName === 'containerfile') return FileCode;
    if (fileName === 'makefile') return Settings;
    if (fileName.includes('license')) return FileText;
    if (fileName.includes('readme')) return FileText;
    return File;
  }

  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'rs', 'py', 'rb', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt', 'scala'].includes(ext)) {
    return FileCode;
  }

  // Config files
  if (['json', 'yaml', 'yml', 'toml', 'xml', 'ini', 'cfg', 'conf'].includes(ext)) {
    return FileJson;
  }

  // Markup/docs
  if (['md', 'markdown', 'txt', 'rst', 'html', 'htm'].includes(ext)) {
    return FileText;
  }

  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext)) {
    return Image;
  }

  // Database
  if (['sql', 'db', 'sqlite', 'sqlite3'].includes(ext)) {
    return Database;
  }

  // Shell
  if (['sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'].includes(ext)) {
    return Terminal;
  }

  // Font/style
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return FileType;
  }

  // Settings
  if (['env', 'lock', 'gitignore', 'gitattributes', 'editorconfig', 'prettierrc', 'eslintrc'].includes(ext)) {
    return Settings;
  }

  return File;
}

