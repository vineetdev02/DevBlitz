'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentProject, useFileTree } from '@/stores/projectStore';
import type { ProjectStatistics } from '../types';

/**
 * Hook for calculating project statistics
 */
export function useProjectStats() {
  const currentProject = useCurrentProject();
  const fileTree = useFileTree();
  const [stats, setStats] = useState<ProjectStatistics>({
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    fileTypes: {},
  });

  const calculateStats = useCallback(() => {
    if (!currentProject || fileTree.length === 0) {
      setStats({
        totalFiles: 0,
        totalDirectories: 0,
        totalSize: 0,
        fileTypes: {},
      });
      return;
    }

    let totalFiles = 0;
    let totalDirectories = 0;
    let totalSize = 0;
    const fileTypes: Record<string, number> = {};

    // Traverse file tree
    function traverse(nodes: typeof fileTree) {
      for (const node of nodes) {
        if (node.isDirectory) {
          totalDirectories++;
          if (node.children) {
            traverse(node.children);
          }
        } else {
          totalFiles++;
          totalSize += node.size || 0;
          
          const ext = node.extension || 'unknown';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      }
    }

    traverse(fileTree);

    setStats({
      totalFiles,
      totalDirectories,
      totalSize,
      fileTypes,
    });
  }, [currentProject, fileTree]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return {
    stats,
    refresh: calculateStats,
  };
}

