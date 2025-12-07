'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, RecentProject, ProjectSettings, FileTreeNode } from '@/types';
import { DEFAULT_PROJECT_SETTINGS } from '@/types';

interface ProjectState {
  // Current project
  currentProject: Project | null;
  
  // File tree
  fileTree: FileTreeNode[];
  expandedPaths: Set<string>;
  selectedPath: string | null;
  
  // Recent projects (cached from Tauri)
  recentProjects: RecentProject[];
  
  // Settings
  settings: ProjectSettings;
  
  // Loading states
  isLoading: boolean;
  isLoadingTree: boolean;
  error: string | null;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  setSelectedPath: (path: string | null) => void;
  setRecentProjects: (projects: RecentProject[]) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  setLoading: (loading: boolean) => void;
  setLoadingTree: (loading: boolean) => void;
  setError: (error: string | null) => void;
  closeProject: () => void;
  reset: () => void;
}

const initialState = {
  currentProject: null,
  fileTree: [],
  expandedPaths: new Set<string>(),
  selectedPath: null,
  recentProjects: [],
  settings: DEFAULT_PROJECT_SETTINGS,
  isLoading: false,
  isLoadingTree: false,
  error: null,
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentProject: (project) => {
        set({ currentProject: project, error: null });
      },

      setFileTree: (tree) => {
        set({ fileTree: tree, isLoadingTree: false });
      },

      toggleExpanded: (path) => {
        const expandedPaths = new Set(get().expandedPaths);
        if (expandedPaths.has(path)) {
          expandedPaths.delete(path);
        } else {
          expandedPaths.add(path);
        }
        set({ expandedPaths });
      },

      setExpanded: (path, expanded) => {
        const expandedPaths = new Set(get().expandedPaths);
        if (expanded) {
          expandedPaths.add(path);
        } else {
          expandedPaths.delete(path);
        }
        set({ expandedPaths });
      },

      setSelectedPath: (path) => {
        set({ selectedPath: path });
      },

      setRecentProjects: (projects) => {
        set({ recentProjects: projects });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setLoadingTree: (loading) => {
        set({ isLoadingTree: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false, isLoadingTree: false });
      },

      closeProject: () => {
        set({
          currentProject: null,
          fileTree: [],
          expandedPaths: new Set<string>(),
          selectedPath: null,
          error: null,
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'devblitz-project',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist expandedPaths as Set - convert to array for storage
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useCurrentProject = () => useProjectStore((state) => state.currentProject);
export const useFileTree = () => useProjectStore((state) => state.fileTree);
export const useExpandedPaths = () => useProjectStore((state) => state.expandedPaths);
export const useSelectedPath = () => useProjectStore((state) => state.selectedPath);
export const useRecentProjects = () => useProjectStore((state) => state.recentProjects);
export const useProjectSettings = () => useProjectStore((state) => state.settings);
export const useProjectLoading = () => useProjectStore((state) => state.isLoading);
export const useProjectError = () => useProjectStore((state) => state.error);


