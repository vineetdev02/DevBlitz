'use client';

import { useCallback, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { readDirectory } from '@/lib/tauri-commands';
import { isTauri } from '@/lib/utils';
import type { FileItem, FileTreeNode } from '@/types';

/**
 * Mock file tree for development outside Tauri
 */
const MOCK_FILES: FileItem[] = [
  { name: 'src', path: '/mock/src', isDirectory: true, isHidden: false, extension: null, size: null, childrenCount: 5 },
  { name: 'public', path: '/mock/public', isDirectory: true, isHidden: false, extension: null, size: null, childrenCount: 2 },
  { name: 'package.json', path: '/mock/package.json', isDirectory: false, isHidden: false, extension: 'json', size: 1024, childrenCount: null },
  { name: 'README.md', path: '/mock/README.md', isDirectory: false, isHidden: false, extension: 'md', size: 2048, childrenCount: null },
  { name: '.gitignore', path: '/mock/.gitignore', isDirectory: true, isHidden: true, extension: null, size: 256, childrenCount: null },
];

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
      let items: FileItem[];

      if (!isTauri()) {
        // Use mock data outside Tauri
        items = MOCK_FILES;
      } else {
        items = await readDirectory(currentProject.path, currentProject.path);
      }

      // Filter hidden files if setting is disabled
      if (!settings.showHiddenFiles) {
        items = items.filter((item) => !item.isHidden);
      }

      const tree = toTreeNodes(items, 0);
      setFileTree(tree);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load files';
      setError(message);
      setFileTree([]);
    }
  }, [currentProject?.path, settings.showHiddenFiles, setFileTree, setLoadingTree, setError]);

  /**
   * Load children of a directory
   */
  const loadDirectoryChildren = useCallback(async (dirPath: string, depth: number): Promise<FileTreeNode[]> => {
    if (!currentProject?.path) return [];

    try {
      let items: FileItem[];

      if (!isTauri()) {
        // Mock nested files
        items = [
          { name: 'index.ts', path: `${dirPath}/index.ts`, isDirectory: false, isHidden: false, extension: 'ts', size: 512, childrenCount: null },
          { name: 'utils', path: `${dirPath}/utils`, isDirectory: true, isHidden: false, extension: null, size: null, childrenCount: 3 },
        ];
      } else {
        items = await readDirectory(dirPath, currentProject.path);
      }

      // Filter hidden files
      if (!settings.showHiddenFiles) {
        items = items.filter((item) => !item.isHidden);
      }

      return toTreeNodes(items, depth);
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
      // Expand and load children if not already loaded
      setLoadingPaths((prev) => new Set(prev).add(node.path));

      const children = await loadDirectoryChildren(node.path, node.depth + 1);

      // Update the tree with children
      setFileTree(
        fileTree.map((item) => {
          if (item.path === node.path) {
            return { ...item, children, isLoading: false };
          }
          return item;
        })
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

