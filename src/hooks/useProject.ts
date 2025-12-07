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
    try {
      const projects = await getRecentProjects();
      setRecentProjects(projects);
    } catch (err) {
      console.error('Failed to load recent projects:', err);
      setRecentProjects([]);
    }
  }, [setRecentProjects]);

  /**
   * Open folder picker and select a project
   */
  const openProject = useCallback(async () => {
    console.log('[DevBlitz] Opening folder picker...');
    
    setLoading(true);
    setError(null);

    try {
      console.log('[DevBlitz] Calling selectFolder command...');
      const selectedPath = await selectFolder();
      console.log('[DevBlitz] Selected path:', selectedPath);
      
      if (!selectedPath) {
        console.log('[DevBlitz] No folder selected (user cancelled)');
        setLoading(false);
        return null;
      }

      // Validate the selected path
      console.log('[DevBlitz] Validating path...');
      const isValid = await validateProjectPath(selectedPath);
      console.log('[DevBlitz] Path valid:', isValid);
      
      if (!isValid) {
        setError('Selected folder is not accessible');
        setLoading(false);
        return null;
      }

      // Add to recent projects
      console.log('[DevBlitz] Adding to recent projects...');
      await addRecentProject(selectedPath);

      // Extract project name from path
      const name = selectedPath.split('/').pop() || selectedPath.split('\\').pop() || 'Project';
      console.log('[DevBlitz] Project name:', name);

      const project = {
        name,
        path: selectedPath,
        isOpen: true,
      };

      setCurrentProject(project);
      setLoading(false);

      // Refresh recent projects list
      await loadRecentProjects();

      console.log('[DevBlitz] Project opened successfully!');
      return project;
    } catch (err) {
      console.error('[DevBlitz] Error opening project:', err);
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
    try {
      await removeRecentProject(path);
      await loadRecentProjects();
    } catch (err) {
      console.error('Failed to remove recent project:', err);
    }
  }, [loadRecentProjects]);

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
