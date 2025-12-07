'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useCurrentProject, useProjectStore } from '@/stores/projectStore';
import { FileNode } from './FileNode';
import type { FileTreeNode } from '@/types';

export function FileTree() {
  const currentProject = useCurrentProject();
  const { isLoadingTree } = useProjectStore();
  const [isProjectExpanded, setIsProjectExpanded] = useState(true);
  const {
    fileTree,
    expandedPaths,
    selectedPath,
    loadProjectFiles,
    toggleDirectory,
    selectItem,
  } = useFileSystem();

  useEffect(() => {
    if (currentProject?.path) {
      loadProjectFiles();
    }
  }, [currentProject?.path, loadProjectFiles]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedPath || fileTree.length === 0) return;

    const flatTree = flattenTree(fileTree, expandedPaths);
    const currentIndex = flatTree.findIndex((node) => node.path === selectedPath);
    if (currentIndex === -1) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < flatTree.length - 1) {
          selectItem(flatTree[currentIndex + 1].path);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          selectItem(flatTree[currentIndex - 1].path);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const node = flatTree[currentIndex];
        if (node?.isDirectory && !expandedPaths.has(node.path)) {
          toggleDirectory(node);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const curr = flatTree[currentIndex];
        if (curr?.isDirectory && expandedPaths.has(curr.path)) {
          toggleDirectory(curr);
        }
        break;
      case 'Enter':
        e.preventDefault();
        const sel = flatTree[currentIndex];
        if (sel?.isDirectory) {
          toggleDirectory(sel);
        }
        break;
    }
  }, [selectedPath, fileTree, expandedPaths, selectItem, toggleDirectory]);

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
        <p className="text-sm">No folder open</p>
      </div>
    );
  }

  if (isLoadingTree) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2">
        <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin" />
        <p className="text-xs text-neutral-600">Loading...</p>
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
        <p className="text-sm">Empty folder</p>
      </div>
    );
  }

  return (
    <div
      className="outline-none select-none text-neutral-300"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="tree"
    >
      {/* Project header */}
      <div
        onClick={() => setIsProjectExpanded(!isProjectExpanded)}
        className={cn(
          'flex items-center h-[22px] px-2 cursor-pointer',
          'text-[11px] font-semibold uppercase tracking-wide text-neutral-400',
          'hover:bg-white/5'
        )}
      >
        {isProjectExpanded ? (
          <ChevronDown className="w-3 h-3 mr-1" />
        ) : (
          <ChevronRight className="w-3 h-3 mr-1" />
        )}
        <span className="truncate">{currentProject.name}</span>
        <span className="ml-auto text-[10px] text-neutral-600">{fileTree.length}</span>
      </div>

      {/* Tree */}
      <AnimatePresence initial={false}>
        {isProjectExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
          >
            {fileTree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                expandedPaths={expandedPaths}
                selectedPath={selectedPath}
                onToggle={toggleDirectory}
                onSelect={selectItem}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  onToggle: (node: FileTreeNode) => void;
  onSelect: (path: string) => void;
}

function TreeNode({ node, expandedPaths, selectedPath, onToggle, onSelect }: TreeNodeProps) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <>
      <FileNode
        node={node}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onToggle={() => onToggle(node)}
        onSelect={() => onSelect(node.path)}
      />

      {node.isDirectory && isExpanded && node.children && (
        <AnimatePresence initial={false}>
          {node.children.map((child) => (
            <motion.div
              key={child.path}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
            >
              <TreeNode
                node={child}
                expandedPaths={expandedPaths}
                selectedPath={selectedPath}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </>
  );
}

function flattenTree(nodes: FileTreeNode[], expandedPaths: Set<string>): FileTreeNode[] {
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
