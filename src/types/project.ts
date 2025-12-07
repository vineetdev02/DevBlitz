/**
 * Project types for DevBlitz
 */

/**
 * Represents a recent project entry
 */
export interface RecentProject {
  name: string;
  path: string;
  lastOpened: string;
}

/**
 * Current project state
 */
export interface Project {
  name: string;
  path: string;
  isOpen: boolean;
}

/**
 * Project statistics
 */
export interface ProjectStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
}

/**
 * Project settings
 */
export interface ProjectSettings {
  showHiddenFiles: boolean;
  excludePatterns: string[];
}

/**
 * Default project settings
 */
export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  showHiddenFiles: false,
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'target',
    '__pycache__',
    '.cache',
  ],
};


