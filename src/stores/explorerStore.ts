'use client';

import { create } from 'zustand';

export interface PendingCreate {
  /** Directory the new entry goes into. Null means the project root. */
  parentPath: string | null;
  kind: 'file' | 'folder';
}

interface ExplorerState {
  /** Set while an inline "new file/folder" input is showing. */
  pendingCreate: PendingCreate | null;
  /** Path of the node currently being renamed inline. */
  renamingPath: string | null;
  /** Path awaiting delete confirmation. */
  confirmingDeletePath: string | null;

  startCreate: (parentPath: string | null, kind: 'file' | 'folder') => void;
  cancelCreate: () => void;
  startRename: (path: string) => void;
  cancelRename: () => void;
  requestDelete: (path: string) => void;
  cancelDelete: () => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  pendingCreate: null,
  renamingPath: null,
  confirmingDeletePath: null,

  // Only one inline editor can be open at a time.
  startCreate: (parentPath, kind) =>
    set({ pendingCreate: { parentPath, kind }, renamingPath: null }),
  cancelCreate: () => set({ pendingCreate: null }),

  startRename: (path) => set({ renamingPath: path, pendingCreate: null }),
  cancelRename: () => set({ renamingPath: null }),

  requestDelete: (path) => set({ confirmingDeletePath: path }),
  cancelDelete: () => set({ confirmingDeletePath: null }),
}));
