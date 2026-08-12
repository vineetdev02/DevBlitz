'use client';

import React from 'react';
import {
  Clipboard,
  Copy,
  ExternalLink,
  FilePlus,
  FolderPlus,
  Pencil,
  RefreshCw,
  Trash2,
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
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useExplorerStore } from '@/stores/explorerStore';
import { useProjectStore } from '@/stores/projectStore';
import type { FileTreeNode } from '@/types';

interface FileContextMenuProps {
  node: FileTreeNode;
  children: React.ReactNode;
  onOpen?: () => void;
}

/** Right-click menu for file tree items. Every entry is wired to a real action. */
export function FileContextMenu({ node, children, onOpen }: FileContextMenuProps) {
  const { reveal, refreshDirectory, copyRelativePath, copyAbsolutePath } = useFileOperations();
  const { startCreate, startRename, requestDelete } = useExplorerStore();
  const { expandedPaths, toggleExpanded } = useProjectStore();

  // New entries go inside a folder, or beside a file.
  const targetDirectory = node.isDirectory ? node.path : parentOf(node.path);

  const handleCreate = (kind: 'file' | 'folder') => {
    if (node.isDirectory && !expandedPaths.has(node.path)) toggleExpanded(node.path);
    startCreate(targetDirectory, kind);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-60">
        {!node.isDirectory && onOpen && (
          <>
            <ContextMenuItem onClick={onOpen}>
              Open
              <ContextMenuShortcut>Enter</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuItem onClick={() => handleCreate('file')}>
          <FilePlus className="mr-2 h-4 w-4" />
          New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleCreate('folder')}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </ContextMenuItem>

        {node.isDirectory && (
          <ContextMenuItem onClick={() => refreshDirectory(node.path)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => copyAbsolutePath(node.path)}>
              <Clipboard className="mr-2 h-4 w-4" />
              Copy Path
            </ContextMenuItem>
            <ContextMenuItem onClick={() => copyRelativePath(node.path)}>
              <Clipboard className="mr-2 h-4 w-4" />
              Copy Relative Path
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem onClick={() => reveal(node.path)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Reveal in File Manager
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => startRename(node.path)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => requestDelete(node.path)}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function parentOf(path: string): string {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return index <= 0 ? path : path.slice(0, index);
}

export { ContextMenuTrigger };
