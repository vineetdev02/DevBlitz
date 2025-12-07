'use client';

import { create } from 'zustand';

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isModified: boolean;
  isLoading: boolean;
}

interface EditorState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  untitledCounter: number;
  
  openFile: (file: Omit<OpenFile, 'isModified' | 'isLoading'>) => void;
  createNewFile: () => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  setFileLoading: (path: string, loading: boolean) => void;
  reorderFiles: (files: OpenFile[]) => void;
  closeAllFiles: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFilePath: null,
  untitledCounter: 1,

  openFile: (file) => {
    const { openFiles } = get();
    const existingIndex = openFiles.findIndex((f) => f.path === file.path);

    if (existingIndex >= 0) {
      const updatedFiles = [...openFiles];
      updatedFiles[existingIndex] = {
        ...updatedFiles[existingIndex],
        content: file.content,
        language: file.language,
        isLoading: false,
      };
      set({ openFiles: updatedFiles, activeFilePath: file.path });
    } else {
      set({
        openFiles: [...openFiles, { ...file, isModified: false, isLoading: false }],
        activeFilePath: file.path,
      });
    }
  },

  createNewFile: () => {
    const { untitledCounter, openFiles } = get();
    const newPath = `untitled:${untitledCounter}`;
    const newFile: OpenFile = {
      path: newPath,
      name: `Untitled-${untitledCounter}`,
      content: '',
      language: 'plaintext',
      isModified: false,
      isLoading: false,
    };
    
    set({
      openFiles: [...openFiles, newFile],
      activeFilePath: newPath,
      untitledCounter: untitledCounter + 1,
    });
  },

  closeFile: (path) => {
    const { openFiles, activeFilePath } = get();
    const newOpenFiles = openFiles.filter((f) => f.path !== path);
    
    let newActivePath = activeFilePath;
    if (activeFilePath === path) {
      const closedIndex = openFiles.findIndex((f) => f.path === path);
      if (newOpenFiles.length > 0) {
        newActivePath = newOpenFiles[Math.min(closedIndex, newOpenFiles.length - 1)]?.path || null;
      } else {
        newActivePath = null;
      }
    }

    set({ openFiles: newOpenFiles, activeFilePath: newActivePath });
  },

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === path ? { ...f, content, isModified: true } : f
      ),
    });
  },

  setFileLoading: (path, loading) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === path ? { ...f, isLoading: loading } : f
      ),
    });
  },

  reorderFiles: (files) => set({ openFiles: files }),

  closeAllFiles: () => set({ openFiles: [], activeFilePath: null }),
}));

export const useOpenFiles = () => useEditorStore((state) => state.openFiles);
export const useActiveFilePath = () => useEditorStore((state) => state.activeFilePath);
export const useActiveFile = () => {
  const openFiles = useEditorStore((state) => state.openFiles);
  const activeFilePath = useEditorStore((state) => state.activeFilePath);
  return openFiles.find((f) => f.path === activeFilePath) || null;
};

export function getLanguageFromExtension(ext: string | null): string {
  if (!ext) return 'plaintext';
  
  const languageMap: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', rs: 'rust', go: 'go', java: 'java',
    c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', php: 'php',
    swift: 'swift', kt: 'kotlin', html: 'html', htm: 'html',
    css: 'css', scss: 'scss', sass: 'sass', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yaml', xml: 'xml',
    md: 'markdown', sql: 'sql', sh: 'shell', bash: 'shell', zsh: 'shell',
    ps1: 'powershell', toml: 'toml', ini: 'ini', env: 'dotenv',
  };

  return languageMap[ext.toLowerCase()] || 'plaintext';
}
