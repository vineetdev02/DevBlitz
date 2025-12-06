'use client';

import { useCallback, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import {
  selectFolder,
  getRecentProjects,
  addRecentProject,
  removeRecentProject,
  validateProjectPath,
} from '@/lib/tauri-commands';
import { isTauri } from '@/lib/utils';

/**
 * Hook for project management operations
 */
export function useProject() {
  const {
    currentProject,
    recentProjects,
    isLoading,
    error,
    setCurrentProject,
    setRecentProjects,
    setLoading,
    setError,
    closeProject,
  } = useProjectStore();

  /**
   * Load recent projects from Tauri backend
   */
  const loadRecentProjects = useCallback(async () => {
    if (!isTauri()) {
      // Mock data for development outside Tauri
      setRecentProjects([
        {
          name: 'devblitz',
          path: '/home/user/projects/devblitz',
          lastOpened: new Date().toISOString(),
        },
      ]);
      return;
    }

    try {
      const projects = await getRecentProjects();
      setRecentProjects(projects);
    } catch (err) {
      console.error('Failed to load recent projects:', err);
    }
  }, [setRecentProjects]);

  /**
   * Open folder picker and select a project
   */
  const openProject = useCallback(async () => {
    if (!isTauri()) {
      console.warn('Tauri not available - folder picker disabled');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedPath = await selectFolder();
      
      if (!selectedPath) {
        setLoading(false);
        return null;
      }

      // Validate the selected path
      const isValid = await validateProjectPath(selectedPath);
      
      if (!isValid) {
        setError('Selected folder is not accessible');
        setLoading(false);
        return null;
      }

      // Add to recent projects
      await addRecentProject(selectedPath);

      // Extract project name from path
      const name = selectedPath.split('/').pop() || 'Project';

      const project = {
        name,
        path: selectedPath,
        isOpen: true,
      };

      setCurrentProject(project);
      setLoading(false);

      // Refresh recent projects list
      await loadRecentProjects();

      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open project';
      setError(message);
      setLoading(false);
      return null;
    }
  }, [setCurrentProject, setLoading, setError, loadRecentProjects]);

  /**
   * Open a specific project by path
   */
  const openProjectByPath = useCallback(async (path: string) => {
    if (!isTauri()) {
      const name = path.split('/').pop() || 'Project';
      setCurrentProject({ name, path, isOpen: true });
      return true;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await validateProjectPath(path);
      
      if (!isValid) {
        setError('Project folder is not accessible');
        setLoading(false);
        return false;
      }

      await addRecentProject(path);
      
      const name = path.split('/').pop() || 'Project';
      setCurrentProject({ name, path, isOpen: true });
      setLoading(false);

      await loadRecentProjects();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open project';
      setError(message);
      setLoading(false);
      return false;
    }
  }, [setCurrentProject, setLoading, setError, loadRecentProjects]);

  /**
   * Remove a project from recent projects
   */
  const removeFromRecent = useCallback(async (path: string) => {
    if (!isTauri()) {
      setRecentProjects(recentProjects.filter((p) => p.path !== path));
      return;
    }

    try {
      await removeRecentProject(path);
      await loadRecentProjects();
    } catch (err) {
      console.error('Failed to remove recent project:', err);
    }
  }, [recentProjects, setRecentProjects, loadRecentProjects]);

  // Load recent projects on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  return {
    currentProject,
    recentProjects,
    isLoading,
    error,
    openProject,
    openProjectByPath,
    closeProject,
    removeFromRecent,
    loadRecentProjects,
  };
}

