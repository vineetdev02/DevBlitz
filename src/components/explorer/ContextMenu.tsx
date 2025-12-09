'use client';

import React from 'react';
import {
  Copy,
  Clipboard,
  Trash2,
  Pencil,
  FolderPlus,
  FilePlus,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { getModifierKey } from '@/lib/utils';
import type { FileTreeNode } from '@/types';

interface FileContextMenuProps {
  node: FileTreeNode;
  children: React.ReactNode;
}

/**
 * Context menu for file tree items
 * Provides file operations like copy, rename, delete
 */
export function FileContextMenu({ node, children }: FileContextMenuProps) {
  const modKey = getModifierKey();

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path);
  };

  const handleCopyRelativePath = () => {
    // TODO: Calculate relative path from project root
    const relativePath = node.name;
    navigator.clipboard.writeText(relativePath);
  };

  const handleRevealInFinder = async () => {
    // TODO: Implement with Tauri shell
    console.log('Reveal in finder:', node.path);
  };

  const handleRename = () => {
    // TODO: Implement rename functionality
    console.log('Rename:', node.path);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete:', node.path);
  };

  const handleNewFile = () => {
    // TODO: Implement new file in directory
    console.log('New file in:', node.path);
  };

  const handleNewFolder = () => {
    // TODO: Implement new folder in directory
    console.log('New folder in:', node.path);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-56">
        {/* File operations */}
        {!node.isDirectory && (
          <>
            <ContextMenuItem onClick={() => console.log('Open:', node.path)}>
              <Eye className="w-4 h-4 mr-2" />
              Open
              <ContextMenuShortcut>Enter</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Directory operations */}
        {node.isDirectory && (
          <>
            <ContextMenuItem onClick={handleNewFile}>
              <FilePlus className="w-4 h-4 mr-2" />
              New File
              <ContextMenuShortcut>{modKey}+N</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleNewFolder}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Copy operations */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={handleCopyPath}>
              <Clipboard className="w-4 h-4 mr-2" />
              Copy Path
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopyRelativePath}>
              <Clipboard className="w-4 h-4 mr-2" />
              Copy Relative Path
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Reveal in system */}
        <ContextMenuItem onClick={handleRevealInFinder}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Reveal in File Manager
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Edit operations */}
        <ContextMenuItem onClick={handleRename}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Re-export trigger for convenience
import { ContextMenuTrigger } from '@/components/ui/context-menu';
export { ContextMenuTrigger };




