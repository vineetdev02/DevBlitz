'use client';

import { create } from 'zustand';
import { readFileContent, writeFile } from '@/lib/tauri-commands';
import { useProjectStore } from '@/stores/projectStore';
import { notify } from '@/stores/notificationStore';

export interface CursorPosition {
  /** 1-based line number. */
  line: number;
  /** 1-based column. */
  column: number;
  /** Number of characters currently selected. */
  selectionLength: number;
  /** Number of lines spanned by the selection (0 when nothing is selected). */
  selectedLines: number;
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  /** Content as it exists on disk - used to decide whether the tab is dirty. */
  savedContent: string;
  language: string;
  isModified: boolean;
  isLoading: boolean;
  isSaving: boolean;
  /** Untitled buffers have no file on disk yet. */
  isUntitled: boolean;
  /** Scroll offset, restored when switching back to the tab. */
  scrollTop: number;
  cursor: CursorPosition;
}

const EMPTY_CURSOR: CursorPosition = {
  line: 1,
  column: 1,
  selectionLength: 0,
  selectedLines: 0,
};

interface EditorState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  untitledCounter: number;
  /** Most recently used tab order, for Ctrl+Tab style switching. */
  recentPaths: string[];

  openFile: (file: {
    path: string;
    name: string;
    content: string;
    language: string;
  }) => void;
  openFileFromDisk: (path: string, name: string, language: string) => Promise<void>;
  createNewFile: () => void;
  closeFile: (path: string) => void;
  closeOtherFiles: (path: string) => void;
  closeSavedFiles: () => void;
  closeAllFiles: () => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  setCursor: (path: string, cursor: CursorPosition) => void;
  setScrollTop: (path: string, scrollTop: number) => void;
  setFileLoading: (path: string, loading: boolean) => void;
  reorderFiles: (files: OpenFile[]) => void;
  saveFile: (path: string) => Promise<boolean>;
  saveActiveFile: () => Promise<boolean>;
  saveAllFiles: () => Promise<void>;
  revertFile: (path: string) => void;
  /** Update paths after a rename in the explorer so tabs stay valid. */
  renameOpenFile: (oldPath: string, newPath: string, newName: string) => void;
}

function makeFile(partial: Partial<OpenFile> & Pick<OpenFile, 'path' | 'name' | 'content' | 'language'>): OpenFile {
  return {
    savedContent: partial.content,
    isModified: false,
    isLoading: false,
    isSaving: false,
    isUntitled: false,
    scrollTop: 0,
    cursor: { ...EMPTY_CURSOR },
    ...partial,
  };
}

/** Track most-recently-used order without letting the list grow unbounded. */
function touchRecent(recent: string[], path: string): string[] {
  return [path, ...recent.filter((p) => p !== path)].slice(0, 30);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFilePath: null,
  untitledCounter: 1,
  recentPaths: [],

  openFile: (file) => {
    const { openFiles, recentPaths } = get();
    const existingIndex = openFiles.findIndex((f) => f.path === file.path);

    const existing = existingIndex >= 0 ? openFiles[existingIndex] : undefined;

    if (existing) {
      const updated = [...openFiles];

      // Never clobber unsaved edits when a file is re-opened from the explorer.
      updated[existingIndex] = existing.isModified
        ? { ...existing, isLoading: false }
        : {
            ...existing,
            content: file.content,
            savedContent: file.content,
            language: file.language,
            isModified: false,
            isLoading: false,
          };

      set({
        openFiles: updated,
        activeFilePath: file.path,
        recentPaths: touchRecent(recentPaths, file.path),
      });
      return;
    }

    set({
      openFiles: [...openFiles, makeFile(file)],
      activeFilePath: file.path,
      recentPaths: touchRecent(recentPaths, file.path),
    });
  },

  openFileFromDisk: async (path, name, language) => {
    const { openFiles, openFile, setActiveFile } = get();

    // Already open and untouched on disk - just focus the tab.
    const existing = openFiles.find((f) => f.path === path);
    if (existing?.isModified) {
      setActiveFile(path);
      return;
    }

    const basePath = useProjectStore.getState().currentProject?.path;
    if (!basePath) return;

    try {
      const content = await readFileContent(path, basePath);
      openFile({ path, name, content: content ?? '', language });
    } catch (err) {
      notify({
        kind: 'error',
        title: `Could not open ${name}`,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  },

  createNewFile: () => {
    const { untitledCounter, openFiles, recentPaths } = get();
    const path = `untitled:${untitledCounter}`;

    set({
      openFiles: [
        ...openFiles,
        makeFile({
          path,
          name: `Untitled-${untitledCounter}`,
          content: '',
          language: 'plaintext',
          isUntitled: true,
        }),
      ],
      activeFilePath: path,
      untitledCounter: untitledCounter + 1,
      recentPaths: touchRecent(recentPaths, path),
    });
  },

  closeFile: (path) => {
    const { openFiles, activeFilePath, recentPaths } = get();
    const remaining = openFiles.filter((f) => f.path !== path);
    const nextRecent = recentPaths.filter((p) => p !== path);

    let nextActive = activeFilePath;
    if (activeFilePath === path) {
      // Fall back to the most recently used tab, like VS Code does.
      nextActive = nextRecent.find((p) => remaining.some((f) => f.path === p)) ?? remaining[remaining.length - 1]?.path ?? null;
    }

    set({ openFiles: remaining, activeFilePath: nextActive, recentPaths: nextRecent });
  },

  closeOtherFiles: (path) => {
    const { openFiles } = get();
    const kept = openFiles.filter((f) => f.path === path);
    set({ openFiles: kept, activeFilePath: kept[0]?.path ?? null, recentPaths: kept.map((f) => f.path) });
  },

  closeSavedFiles: () => {
    const { openFiles, activeFilePath, recentPaths } = get();
    const kept = openFiles.filter((f) => f.isModified);
    const nextActive = kept.some((f) => f.path === activeFilePath)
      ? activeFilePath
      : kept[kept.length - 1]?.path ?? null;

    set({
      openFiles: kept,
      activeFilePath: nextActive,
      recentPaths: recentPaths.filter((p) => kept.some((f) => f.path === p)),
    });
  },

  closeAllFiles: () => set({ openFiles: [], activeFilePath: null, recentPaths: [] }),

  setActiveFile: (path) =>
    set((state) => ({
      activeFilePath: path,
      recentPaths: touchRecent(state.recentPaths, path),
    })),

  updateFileContent: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? { ...f, content, isModified: content !== f.savedContent }
          : f
      ),
    })),

  setCursor: (path, cursor) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, cursor } : f)),
    })),

  setScrollTop: (path, scrollTop) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, scrollTop } : f)),
    })),

  setFileLoading: (path, loading) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, isLoading: loading } : f)),
    })),

  reorderFiles: (files) => set({ openFiles: files }),

  saveFile: async (path) => {
    const file = get().openFiles.find((f) => f.path === path);
    if (!file) return false;

    if (file.isUntitled) {
      notify({
        kind: 'warning',
        title: 'Untitled files cannot be saved yet',
        detail: 'Create the file from the explorer, then paste your work into it.',
      });
      return false;
    }

    if (!file.isModified) return true;

    const basePath = useProjectStore.getState().currentProject?.path;
    if (!basePath) {
      notify({ kind: 'error', title: 'No project open', detail: 'Open a folder before saving.' });
      return false;
    }

    set((state) => ({
      openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, isSaving: true } : f)),
    }));

    try {
      // Read the content again at write time - the user may have kept typing.
      const latest = get().openFiles.find((f) => f.path === path)?.content ?? file.content;
      await writeFile(path, basePath, latest);

      set((state) => ({
        openFiles: state.openFiles.map((f) =>
          f.path === path
            ? {
                ...f,
                isSaving: false,
                savedContent: latest,
                isModified: f.content !== latest,
              }
            : f
        ),
      }));

      return true;
    } catch (err) {
      set((state) => ({
        openFiles: state.openFiles.map((f) => (f.path === path ? { ...f, isSaving: false } : f)),
      }));

      notify({
        kind: 'error',
        title: `Failed to save ${file.name}`,
        detail: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  },

  saveActiveFile: async () => {
    const { activeFilePath, saveFile } = get();
    if (!activeFilePath) return false;
    return saveFile(activeFilePath);
  },

  saveAllFiles: async () => {
    const { openFiles, saveFile } = get();
    const dirty = openFiles.filter((f) => f.isModified && !f.isUntitled);
    if (dirty.length === 0) return;

    const results = await Promise.all(dirty.map((f) => saveFile(f.path)));
    const saved = results.filter(Boolean).length;

    if (saved > 0) {
      notify({
        kind: 'success',
        title: `Saved ${saved} file${saved === 1 ? '' : 's'}`,
      });
    }
  },

  revertFile: (path) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path ? { ...f, content: f.savedContent, isModified: false } : f
      ),
    })),

  renameOpenFile: (oldPath, newPath, newName) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === oldPath ? { ...f, path: newPath, name: newName } : f
      ),
      activeFilePath: state.activeFilePath === oldPath ? newPath : state.activeFilePath,
      recentPaths: state.recentPaths.map((p) => (p === oldPath ? newPath : p)),
    })),
}));

export const useOpenFiles = () => useEditorStore((state) => state.openFiles);
export const useActiveFilePath = () => useEditorStore((state) => state.activeFilePath);
export const useActiveFile = () => {
  const openFiles = useEditorStore((state) => state.openFiles);
  const activeFilePath = useEditorStore((state) => state.activeFilePath);
  return openFiles.find((f) => f.path === activeFilePath) || null;
};
export const useDirtyFileCount = () =>
  useEditorStore((state) => state.openFiles.filter((f) => f.isModified).length);

export function getLanguageFromExtension(ext: string | null): string {
  if (!ext) return 'plaintext';

  const languageMap: Record<string, string> = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
    ts: 'typescript', tsx: 'tsx', py: 'python', rb: 'ruby', rs: 'rust',
    go: 'go', java: 'java', c: 'c', cpp: 'cpp', cc: 'cpp', h: 'c', hpp: 'cpp',
    cs: 'csharp', php: 'php', swift: 'swift', kt: 'kotlin', scala: 'scala',
    dart: 'dart', lua: 'lua', vue: 'html', svelte: 'html',
    html: 'html', htm: 'html', css: 'css', scss: 'scss', sass: 'sass', less: 'less',
    json: 'json', jsonc: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml', svg: 'xml',
    md: 'markdown', markdown: 'markdown', sql: 'sql',
    sh: 'shell', bash: 'shell', zsh: 'shell', fish: 'shell',
    ps1: 'powershell', toml: 'toml', ini: 'ini', cfg: 'ini', conf: 'ini',
    env: 'dotenv', lock: 'json', txt: 'plaintext',
  };

  return languageMap[ext.toLowerCase()] || 'plaintext';
}

/** Language for files identified by name rather than extension. */
export function getLanguageFromFileName(name: string): string | null {
  const byName: Record<string, string> = {
    dockerfile: 'shell',
    containerfile: 'shell',
    makefile: 'shell',
    gemfile: 'ruby',
    rakefile: 'ruby',
    '.gitignore': 'ini',
    '.gitattributes': 'ini',
    '.env': 'dotenv',
    '.editorconfig': 'ini',
    'cargo.lock': 'toml',
  };

  return byName[name.toLowerCase()] ?? null;
}
