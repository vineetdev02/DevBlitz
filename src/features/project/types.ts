/**
 * Project feature types
 * Additional types specific to project management
 */

export interface ProjectConfig {
  name: string;
  path: string;
  settings: ProjectFeatureSettings;
}

export interface ProjectFeatureSettings {
  showHiddenFiles: boolean;
  excludePatterns: string[];
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface ProjectStatistics {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  fileTypes: Record<string, number>;
}




