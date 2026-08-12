'use client';

import { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { useExplorerStore } from '@/stores/explorerStore';
import { notify } from '@/stores/notificationStore';
import {
  createDirectory,
  createFile,
  deletePath,
  readDirectory,
  renamePath,
  revealInFileManager,
} from '@/lib/tauri-commands';
import type { FileTreeNode } from '@/types';

/** Join a directory and a name using forward slashes. */
function joinPath(dir: string, name: string): string {
  return `${dir.replace(/[/\\]+$/, '')}/${name}`;
}

function parentOf(path: string): string {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return index <= 0 ? path : path.slice(0, index);
}

function extensionOf(name: string): string | null {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? null : name.slice(dot + 1);
}

/** Replace a node's children in the tree, leaving everything else untouched. */
function updateNodeChildren(
  nodes: FileTreeNode[],
  targetPath: string,
  children: FileTreeNode[]
): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) return { ...node, children, isLoading: false };
    if (node.children) {
      return { ...node, children: updateNodeChildren(node.children, targetPath, children) };
    }
    return node;
  });
}

function findNode(nodes: FileTreeNode[], targetPath: string): FileTreeNode | null {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children) {
      const found = findNode(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Create / rename / delete operations for the explorer, including the tree
 * refresh and editor bookkeeping each one implies.
 */
export function useFileOperations() {
  // Narrow selectors only: this hook is used from inside the file tree, so a
  // whole-store subscription would re-render every node on any change.
  const basePath = useProjectStore((state) => state.currentProject?.path);
  const fileTree = useProjectStore((state) => state.fileTree);
  const showHiddenFiles = useProjectStore((state) => state.settings.showHiddenFiles);
  const setFileTree = useProjectStore((state) => state.setFileTree);
  const expandedPaths = useProjectStore((state) => state.expandedPaths);
  const toggleExpanded = useProjectStore((state) => state.toggleExpanded);

  const openFile = useEditorStore((state) => state.openFile);
  const closeFile = useEditorStore((state) => state.closeFile);
  const renameOpenFile = useEditorStore((state) => state.renameOpenFile);

  const cancelCreate = useExplorerStore((state) => state.cancelCreate);
  const cancelRename = useExplorerStore((state) => state.cancelRename);
  const cancelDelete = useExplorerStore((state) => state.cancelDelete);

  /** Reload one directory's children in place. Pass null for the project root. */
  const refreshDirectory = useCallback(
    async (dirPath: string | null) => {
      if (!basePath) return;

      const target = dirPath ?? basePath;
      const isRoot = target === basePath;

      try {
        const items = await readDirectory(target, basePath);
        const visible = showHiddenFiles ? items : items.filter((item) => !item.isHidden);

        const parentNode = isRoot ? null : findNode(fileTree, target);
        const depth = isRoot ? 0 : (parentNode?.depth ?? 0) + 1;

        const children: FileTreeNode[] = visible.map((item) => ({
          ...item,
          depth,
          children: undefined,
          isExpanded: false,
          isLoading: false,
        }));

        setFileTree(isRoot ? children : updateNodeChildren(fileTree, target, children));
      } catch (err) {
        notify({
          kind: 'error',
          title: 'Could not refresh the file tree',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [basePath, fileTree, showHiddenFiles, setFileTree]
  );

  const create = useCallback(
    async (parentPath: string | null, name: string, kind: 'file' | 'folder') => {
      const trimmed = name.trim();
      if (!basePath || !trimmed) {
        cancelCreate();
        return;
      }

      const directory = parentPath ?? basePath;
      const target = joinPath(directory, trimmed);

      try {
        if (kind === 'folder') {
          await createDirectory(target, basePath);
        } else {
          await createFile(target, basePath);
        }

        cancelCreate();

        // Make sure the containing folder is expanded so the result is visible.
        if (parentPath && !expandedPaths.has(parentPath)) toggleExpanded(parentPath);
        await refreshDirectory(parentPath);

        if (kind === 'file') {
          openFile({
            path: target,
            name: trimmed,
            content: '',
            language: getLanguageFromExtension(extensionOf(trimmed)),
          });
        }

        notify({ kind: 'success', title: `Created ${trimmed}` });
      } catch (err) {
        notify({
          kind: 'error',
          title: `Could not create ${trimmed}`,
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [basePath, cancelCreate, expandedPaths, toggleExpanded, refreshDirectory, openFile]
  );

  const rename = useCallback(
    async (path: string, newName: string) => {
      const trimmed = newName.trim();
      const currentName = path.split(/[/\\]/).pop() ?? '';

      if (!basePath || !trimmed || trimmed === currentName) {
        cancelRename();
        return;
      }

      const target = joinPath(parentOf(path), trimmed);

      try {
        await renamePath(path, target, basePath);
        cancelRename();

        // Keep any open tab pointing at the file, plus tabs for files inside a
        // renamed folder.
        for (const file of useEditorStore.getState().openFiles) {
          if (file.path === path) {
            renameOpenFile(path, target, trimmed);
          } else if (file.path.startsWith(`${path}/`)) {
            const moved = target + file.path.slice(path.length);
            renameOpenFile(file.path, moved, file.name);
          }
        }

        await refreshDirectory(parentOf(path) === basePath ? null : parentOf(path));
        notify({ kind: 'success', title: `Renamed to ${trimmed}` });
      } catch (err) {
        notify({
          kind: 'error',
          title: `Could not rename ${currentName}`,
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [basePath, cancelRename, renameOpenFile, refreshDirectory]
  );

  const remove = useCallback(
    async (path: string) => {
      if (!basePath) return;
      const name = path.split(/[/\\]/).pop() ?? path;

      try {
        await deletePath(path, basePath);
        cancelDelete();

        // Close tabs for the deleted file, or anything inside a deleted folder.
        for (const file of useEditorStore.getState().openFiles) {
          if (file.path === path || file.path.startsWith(`${path}/`)) {
            closeFile(file.path);
          }
        }

        const parent = parentOf(path);
        await refreshDirectory(parent === basePath ? null : parent);
        notify({ kind: 'info', title: `Deleted ${name}` });
      } catch (err) {
        notify({
          kind: 'error',
          title: `Could not delete ${name}`,
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [basePath, cancelDelete, closeFile, refreshDirectory]
  );

  const reveal = useCallback(async (path: string) => {
    try {
      await revealInFileManager(path);
    } catch (err) {
      notify({
        kind: 'error',
        title: 'Could not open the file manager',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const copyRelativePath = useCallback(
    async (path: string) => {
      const relative = basePath && path.startsWith(basePath)
        ? path.slice(basePath.length).replace(/^[/\\]/, '')
        : path;

      await navigator.clipboard.writeText(relative);
      notify({ kind: 'info', title: 'Copied relative path', detail: relative, timeout: 2000 });
    },
    [basePath]
  );

  const copyAbsolutePath = useCallback(async (path: string) => {
    await navigator.clipboard.writeText(path);
    notify({ kind: 'info', title: 'Copied path', detail: path, timeout: 2000 });
  }, []);

  return {
    create,
    rename,
    remove,
    reveal,
    refreshDirectory,
    copyRelativePath,
    copyAbsolutePath,
  };
}
