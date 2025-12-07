/**
 * Explorer feature types
 * Additional types specific to file explorer functionality
 */

export interface ExplorerState {
  viewMode: 'tree' | 'list';
  sortBy: 'name' | 'type' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  filterText: string;
}

export interface FileAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  handler: (path: string) => void;
  isAvailable?: (isDirectory: boolean) => boolean;
}

export interface DragDropState {
  isDragging: boolean;
  draggedPath: string | null;
  dropTargetPath: string | null;
}


