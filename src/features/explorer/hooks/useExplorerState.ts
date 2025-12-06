'use client';

import { useState, useCallback } from 'react';
import type { ExplorerState } from '../types';

const DEFAULT_STATE: ExplorerState = {
  viewMode: 'tree',
  sortBy: 'name',
  sortOrder: 'asc',
  filterText: '',
};

/**
 * Hook for managing explorer view state
 */
export function useExplorerState() {
  const [state, setState] = useState<ExplorerState>(DEFAULT_STATE);

  const setViewMode = useCallback((mode: ExplorerState['viewMode']) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const setSortBy = useCallback((sortBy: ExplorerState['sortBy']) => {
    setState((prev) => ({ ...prev, sortBy }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const setFilterText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, filterText: text }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    ...state,
    setViewMode,
    setSortBy,
    toggleSortOrder,
    setFilterText,
    reset,
  };
}

