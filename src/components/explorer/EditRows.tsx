'use client';

import React from 'react';
import { InlineInput } from './InlineInput';
import { useExplorerStore } from '@/stores/explorerStore';
import { useFileOperations } from '@/hooks/useFileOperations';
import type { FileTreeNode } from '@/types';

/**
 * The inline create/rename rows live here rather than inside FileNode so that
 * only the single row being edited subscribes to the file-operation hooks -
 * every other node in a large tree stays inert.
 */

export function CreateRow({
  parentPath,
  kind,
  indent,
}: {
  parentPath: string | null;
  kind: 'file' | 'folder';
  indent: number;
}) {
  const cancelCreate = useExplorerStore((state) => state.cancelCreate);
  const { create } = useFileOperations();

  return (
    <div className="flex h-[22px] items-center pr-2" style={{ paddingLeft: `${indent}px` }}>
      <InlineInput
        placeholder={kind === 'file' ? 'File name' : 'Folder name'}
        onSubmit={(value) => void create(parentPath, value, kind)}
        onCancel={cancelCreate}
      />
    </div>
  );
}

export function RenameRow({ node, indent }: { node: FileTreeNode; indent: number }) {
  const cancelRename = useExplorerStore((state) => state.cancelRename);
  const { rename } = useFileOperations();

  return (
    <div className="flex h-[22px] items-center pr-2" style={{ paddingLeft: `${indent}px` }}>
      <InlineInput
        initialValue={node.name}
        selectBasename={!node.isDirectory}
        onSubmit={(value) => void rename(node.path, value)}
        onCancel={cancelRename}
      />
    </div>
  );
}
