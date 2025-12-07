'use client';

import { useCallback, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { readDirectory } from '@/lib/tauri-commands';
import type { FileItem, FileTreeNode } from '@/types';

/**
 * Convert FileItem array to FileTreeNode array
 */
function toTreeNodes(items: FileItem[], depth: number): FileTreeNode[] {
  return items.map((item) => ({
    ...item,
    depth,
    children: undefined,
    isExpanded: false,
    isLoading: false,
  }));
}

/**
 * Recursively update a node in the tree
 */
function updateTreeNode(
  nodes: FileTreeNode[],
  targetPath: string,
  updater: (node: FileTreeNode) => FileTreeNode
): FileTreeNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeNode(node.children, targetPath, updater),
      };
    }
    return node;
  });
}

/**
 * Hook for file system operations
 */
export function useFileSystem() {
  const {
    currentProject,
    fileTree,
    expandedPaths,
    selectedPath,
    settings,
    setFileTree,
    toggleExpanded,
    setSelectedPath,
    setLoadingTree,
    setError,
  } = useProjectStore();

  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  /**
   * Load the root directory of the current project
   */
  const loadProjectFiles = useCallback(async () => {
    if (!currentProject?.path) {
      setFileTree([]);
      return;
    }

    setLoadingTree(true);

    try {
      const items = await readDirectory(currentProject.path, currentProject.path);

      // Filter hidden files if setting is disabled
      let filteredItems = items;
      if (!settings.showHiddenFiles) {
        filteredItems = items.filter((item) => !item.isHidden);
      }

      const tree = toTreeNodes(filteredItems, 0);
      setFileTree(tree);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load files';
      console.error('Failed to load project files:', err);
      setError(message);
      setFileTree([]);
    } finally {
      setLoadingTree(false);
    }
  }, [currentProject?.path, settings.showHiddenFiles, setFileTree, setLoadingTree, setError]);

  /**
   * Load children of a directory
   */
  const loadDirectoryChildren = useCallback(async (dirPath: string, depth: number): Promise<FileTreeNode[]> => {
    if (!currentProject?.path) return [];

    try {
      const items = await readDirectory(dirPath, currentProject.path);

      // Filter hidden files
      let filteredItems = items;
      if (!settings.showHiddenFiles) {
        filteredItems = items.filter((item) => !item.isHidden);
      }

      return toTreeNodes(filteredItems, depth);
    } catch (err) {
      console.error('Failed to load directory:', err);
      return [];
    }
  }, [currentProject?.path, settings.showHiddenFiles]);

  /**
   * Toggle directory expansion and load children if needed
   */
  const toggleDirectory = useCallback(async (node: FileTreeNode) => {
    if (!node.isDirectory) return;

    const isCurrentlyExpanded = expandedPaths.has(node.path);

    if (isCurrentlyExpanded) {
      // Collapse
      toggleExpanded(node.path);
    } else {
      // Expand and load children
      setLoadingPaths((prev) => new Set(prev).add(node.path));

      // Mark as loading in tree
      setFileTree(
        updateTreeNode(fileTree, node.path, (n) => ({ ...n, isLoading: true }))
      );

      const children = await loadDirectoryChildren(node.path, node.depth + 1);

      // Update the tree with children recursively
      setFileTree(
        updateTreeNode(fileTree, node.path, (n) => ({
          ...n,
          children,
          isLoading: false,
        }))
      );

      toggleExpanded(node.path);
      setLoadingPaths((prev) => {
        const next = new Set(prev);
        next.delete(node.path);
        return next;
      });
    }
  }, [expandedPaths, fileTree, toggleExpanded, setFileTree, loadDirectoryChildren]);

  /**
   * Select a file or directory
   */
  const selectItem = useCallback((path: string) => {
    setSelectedPath(path);
  }, [setSelectedPath]);

  /**
   * Check if a path is currently loading
   */
  const isPathLoading = useCallback((path: string) => {
    return loadingPaths.has(path);
  }, [loadingPaths]);

  return {
    fileTree,
    expandedPaths,
    selectedPath,
    loadProjectFiles,
    loadDirectoryChildren,
    toggleDirectory,
    selectItem,
    isPathLoading,
  };
}
