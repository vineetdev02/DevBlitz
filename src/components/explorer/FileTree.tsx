'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useCurrentProject, useProjectStore } from '@/stores/projectStore';
import { FileNode } from './FileNode';
import type { FileTreeNode } from '@/types';

/**
 * File tree explorer component
 * Renders recursive file/folder structure
 */
export function FileTree() {
  const currentProject = useCurrentProject();
  const { isLoadingTree } = useProjectStore();
  const {
    fileTree,
    expandedPaths,
    selectedPath,
    loadProjectFiles,
    toggleDirectory,
    selectItem,
  } = useFileSystem();

  // Load files when project changes
  useEffect(() => {
    if (currentProject?.path) {
      loadProjectFiles();
    }
  }, [currentProject?.path, loadProjectFiles]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedPath || fileTree.length === 0) return;

    // Find current index
    const flatTree = flattenTree(fileTree, expandedPaths);
    const currentIndex = flatTree.findIndex((node) => node.path === selectedPath);
    
    if (currentIndex === -1) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < flatTree.length - 1) {
          const nextNode = flatTree[currentIndex + 1];
          if (nextNode) selectItem(nextNode.path);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevNode = flatTree[currentIndex - 1];
          if (prevNode) selectItem(prevNode.path);
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        const currentNode = flatTree[currentIndex];
        if (currentNode?.isDirectory && !expandedPaths.has(currentNode.path)) {
          toggleDirectory(currentNode);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        const current = flatTree[currentIndex];
        if (current?.isDirectory && expandedPaths.has(current.path)) {
          toggleDirectory(current);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        const selected = flatTree[currentIndex];
        if (selected?.isDirectory) {
          toggleDirectory(selected);
        }
        break;
    }
  }, [selectedPath, fileTree, expandedPaths, selectItem, toggleDirectory]);

  // No project open
  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No folder opened
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Open a folder to start
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoadingTree) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Empty project
  if (fileTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Empty folder
        </p>
      </div>
    );
  }

  return (
    <div
      className="py-2 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="tree"
      aria-label="File Explorer"
    >
      {/* Project header */}
      <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-foreground uppercase tracking-wider">
        <ChevronDown className="w-4 h-4" />
        <span className="truncate">{currentProject.name}</span>
      </div>

      {/* File tree */}
      <div className="mt-1">
        <AnimatePresence initial={false}>
          {fileTree.map((node) => (
            <FileTreeNodeRecursive
              key={node.path}
              node={node}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              onToggle={toggleDirectory}
              onSelect={selectItem}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Recursive file tree node renderer
 */
interface FileTreeNodeRecursiveProps {
  node: FileTreeNode;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  onToggle: (node: FileTreeNode) => void;
  onSelect: (path: string) => void;
}

function FileTreeNodeRecursive({
  node,
  expandedPaths,
  selectedPath,
  onToggle,
  onSelect,
}: FileTreeNodeRecursiveProps) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
    >
      <FileNode
        node={node}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onToggle={() => onToggle(node)}
        onSelect={() => onSelect(node.path)}
      />

      {/* Render children if expanded */}
      {node.isDirectory && isExpanded && node.children && (
        <AnimatePresence initial={false}>
          {node.children.map((child) => (
            <FileTreeNodeRecursive
              key={child.path}
              node={child}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

/**
 * Flatten tree for keyboard navigation
 */
function flattenTree(
  nodes: FileTreeNode[],
  expandedPaths: Set<string>
): FileTreeNode[] {
  const result: FileTreeNode[] = [];
  
  function traverse(node: FileTreeNode) {
    result.push(node);
    if (node.isDirectory && expandedPaths.has(node.path) && node.children) {
      node.children.forEach(traverse);
    }
  }
  
  nodes.forEach(traverse);
  return result;
}

