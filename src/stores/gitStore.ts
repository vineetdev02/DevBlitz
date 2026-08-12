'use client';

import { create } from 'zustand';
import {
  gitCommit,
  gitDiscard,
  gitInfo,
  gitLog,
  gitStage,
  gitStatus,
  gitUnstage,
  type GitCommit,
  type GitFileStatus,
  type GitInfo,
} from '@/lib/tauri-commands';
import { notify } from '@/stores/notificationStore';

interface GitState {
  info: GitInfo | null;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  commits: GitCommit[];
  commitMessage: string;
  isRefreshing: boolean;
  isCommitting: boolean;
  /** Set when git itself is missing or the folder is not a repo. */
  error: string | null;

  refresh: (basePath: string) => Promise<void>;
  stage: (basePath: string, path?: string) => Promise<void>;
  unstage: (basePath: string, path?: string) => Promise<void>;
  discard: (basePath: string, path: string) => Promise<void>;
  commit: (basePath: string) => Promise<void>;
  setCommitMessage: (message: string) => void;
  reset: () => void;
}

export const useGitStore = create<GitState>((set, get) => ({
  info: null,
  staged: [],
  unstaged: [],
  commits: [],
  commitMessage: '',
  isRefreshing: false,
  isCommitting: false,
  error: null,

  refresh: async (basePath) => {
    if (!basePath) return;
    set({ isRefreshing: true });

    try {
      const info = await gitInfo(basePath);

      if (!info.isRepo) {
        set({
          info,
          staged: [],
          unstaged: [],
          commits: [],
          error: null,
          isRefreshing: false,
        });
        return;
      }

      // A repo with no commits yet has no log - that must not fail the refresh.
      const [status, commits] = await Promise.all([
        gitStatus(basePath),
        gitLog(basePath, 15).catch(() => [] as GitCommit[]),
      ]);

      set({
        info,
        staged: status.staged,
        unstaged: status.unstaged,
        commits,
        error: null,
        isRefreshing: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isRefreshing: false,
      });
    }
  },

  stage: async (basePath, path) => {
    try {
      await gitStage(basePath, path);
      await get().refresh(basePath);
    } catch (err) {
      notify({ kind: 'error', title: 'Stage failed', detail: String(err) });
    }
  },

  unstage: async (basePath, path) => {
    try {
      await gitUnstage(basePath, path);
      await get().refresh(basePath);
    } catch (err) {
      notify({ kind: 'error', title: 'Unstage failed', detail: String(err) });
    }
  },

  discard: async (basePath, path) => {
    try {
      await gitDiscard(basePath, path);
      await get().refresh(basePath);
      notify({ kind: 'info', title: `Discarded changes in ${path}` });
    } catch (err) {
      notify({ kind: 'error', title: 'Discard failed', detail: String(err) });
    }
  },

  commit: async (basePath) => {
    const { commitMessage, staged } = get();

    if (!commitMessage.trim()) {
      notify({ kind: 'warning', title: 'Enter a commit message first' });
      return;
    }

    if (staged.length === 0) {
      notify({ kind: 'warning', title: 'Nothing staged to commit' });
      return;
    }

    set({ isCommitting: true });

    try {
      await gitCommit(basePath, commitMessage);
      set({ commitMessage: '', isCommitting: false });
      await get().refresh(basePath);
      notify({ kind: 'success', title: 'Commit created' });
    } catch (err) {
      set({ isCommitting: false });
      notify({
        kind: 'error',
        title: 'Commit failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  },

  setCommitMessage: (message) => set({ commitMessage: message }),

  reset: () =>
    set({
      info: null,
      staged: [],
      unstaged: [],
      commits: [],
      commitMessage: '',
      error: null,
    }),
}));

export const useGitInfo = () => useGitStore((state) => state.info);
export const useGitChangeCount = () =>
  useGitStore((state) => state.staged.length + state.unstaged.length);
