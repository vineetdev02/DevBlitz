'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, FolderOpen, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useFileOperations } from '@/hooks/useFileOperations';
import { useCurrentProject, useProjectStore } from '@/stores/projectStore';
import { useExplorerStore } from '@/stores/explorerStore';
import { useGitStore } from '@/stores/gitStore';
import { FileNode } from './FileNode';
import { CreateRow } from './EditRows';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

  const { pendingCreate, confirmingDeletePath, startRename, requestDelete, cancelDelete } =
    useExplorerStore();
  const { remove } = useFileOperations();

  // Map absolute path -> git status, so nodes can colour themselves.
  const staged = useGitStore((state) => state.staged);
  const unstaged = useGitStore((state) => state.unstaged);
  const gitStatusByPath = useMemo(() => {
    const map = new Map<string, string>();
    // Working tree state wins over the index for display purposes.
    for (const entry of staged) map.set(entry.absolutePath, entry.status);
    for (const entry of unstaged) map.set(entry.absolutePath, entry.status);
    return map;
  }, [staged, unstaged]);

  useEffect(() => {
    if (currentProject?.path) loadProjectFiles();
  }, [currentProject?.path, loadProjectFiles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedPath || fileTree.length === 0) return;

      const flatTree = flattenTree(fileTree, expandedPaths);
      const currentIndex = flatTree.findIndex((node) => node.path === selectedPath);
      if (currentIndex === -1) return;

      const node = flatTree[currentIndex];

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = flatTree[currentIndex + 1];
          if (next) selectItem(next.path);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const previous = flatTree[currentIndex - 1];
          if (previous) selectItem(previous.path);
          break;
        }
        case 'ArrowRight':
          e.preventDefault();
          if (node?.isDirectory && !expandedPaths.has(node.path)) toggleDirectory(node);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (node?.isDirectory && expandedPaths.has(node.path)) toggleDirectory(node);
          break;
        case 'Enter':
          e.preventDefault();
          if (node?.isDirectory) toggleDirectory(node);
          break;
        case 'F2':
          e.preventDefault();
          startRename(selectedPath);
          break;
        case 'Delete':
          e.preventDefault();
          requestDelete(selectedPath);
          break;
      }
    },
    [selectedPath, fileTree, expandedPaths, selectItem, toggleDirectory, startRename, requestDelete]
  );

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
        <FolderOpen className="h-6 w-6 text-neutral-700" />
        <p className="text-[13px] text-neutral-500">No folder open</p>
      </div>
    );
  }

  if (isLoadingTree) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <RefreshCw className="h-4 w-4 animate-spin text-neutral-500" />
        <p className="text-xs text-neutral-600">Loading…</p>
      </div>
    );
  }

  const deleteTargetName = confirmingDeletePath?.split(/[/\\]/).pop() ?? '';

  return (
    <>
      <div className="select-none pb-4 text-neutral-300 outline-none" tabIndex={0} onKeyDown={handleKeyDown} role="tree">
        {/* Project header */}
        <div
          onClick={() => setIsProjectExpanded((open) => !open)}
          className={cn(
            'flex h-[22px] cursor-pointer items-center px-2',
            'text-[11px] font-semibold uppercase tracking-wide text-neutral-400',
            'hover:bg-white/[0.06]'
          )}
        >
          {isProjectExpanded ? (
            <ChevronDown className="mr-1 h-3 w-3" />
          ) : (
            <ChevronRight className="mr-1 h-3 w-3" />
          )}
          <span className="truncate">{currentProject.name}</span>
        </div>

        <AnimatePresence initial={false}>
          {isProjectExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.1 }}
            >
              {/* New entry at the project root */}
              {pendingCreate && pendingCreate.parentPath === null && (
                <CreateRow parentPath={null} kind={pendingCreate.kind} indent={28} />
              )}

              {fileTree.length === 0 && !pendingCreate ? (
                <p className="px-4 py-6 text-center text-[13px] text-neutral-600">Empty folder</p>
              ) : (
                fileTree.map((node) => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    expandedPaths={expandedPaths}
                    selectedPath={selectedPath}
                    gitStatusByPath={gitStatusByPath}
                    onToggle={toggleDirectory}
                    onSelect={selectItem}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={Boolean(confirmingDeletePath)}
        title={`Delete '${deleteTargetName}'?`}
        description="This permanently removes it from disk. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirmingDeletePath && void remove(confirmingDeletePath)}
        onCancel={cancelDelete}
      />
    </>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  gitStatusByPath: Map<string, string>;
  onToggle: (node: FileTreeNode) => void;
  onSelect: (path: string) => void;
}

function TreeNode({
  node,
  expandedPaths,
  selectedPath,
  gitStatusByPath,
  onToggle,
  onSelect,
}: TreeNodeProps) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  const pendingCreate = useExplorerStore((state) => state.pendingCreate);
  const isCreatingHere = pendingCreate?.parentPath === node.path;

  return (
    <>
      <FileNode
        node={node}
        isExpanded={isExpanded}
        isSelected={isSelected}
        gitStatus={gitStatusByPath.get(node.path)}
        onToggle={() => onToggle(node)}
        onSelect={() => onSelect(node.path)}
      />

      {isCreatingHere && pendingCreate && (
        <CreateRow
          parentPath={node.path}
          kind={pendingCreate.kind}
          indent={8 + (node.depth + 1) * 12 + 20}
        />
      )}

      {node.isDirectory && isExpanded && node.children && (
        <>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              expandedPaths={expandedPaths}
              selectedPath={selectedPath}
              gitStatusByPath={gitStatusByPath}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </>
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
