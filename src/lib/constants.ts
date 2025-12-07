/**
 * DevBlitz Constants
 * Centralized configuration and constants
 */

// Application info
export const APP_NAME = 'DevBlitz';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'AI-Powered Code IDE';

// UI dimensions
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 500;
export const SIDEBAR_DEFAULT_WIDTH = 250;
export const TITLEBAR_HEIGHT = 40;
export const STATUSBAR_HEIGHT = 24;

// File tree
export const MAX_VISIBLE_ITEMS = 1000;
export const FILE_TREE_INDENT = 16;

// Performance
export const DEBOUNCE_DELAY = 150;
export const THROTTLE_DELAY = 100;

// File icons mapping (extension -> icon name)
export const FILE_ICONS: Record<string, string> = {
  // Languages
  js: 'javascript',
  jsx: 'react',
  ts: 'typescript',
  tsx: 'react',
  rs: 'rust',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  
  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'sass',
  sass: 'sass',
  less: 'less',
  vue: 'vue',
  svelte: 'svelte',
  
  // Config
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'settings',
  xml: 'xml',
  
  // Docs
  md: 'markdown',
  markdown: 'markdown',
  txt: 'text',
  pdf: 'pdf',
  
  // Git
  gitignore: 'git',
  gitattributes: 'git',
  
  // Images
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  svg: 'svg',
  ico: 'image',
  webp: 'image',
  
  // Others
  lock: 'lock',
  env: 'env',
  sh: 'terminal',
  bash: 'terminal',
  zsh: 'terminal',
  dockerfile: 'docker',
  sql: 'database',
};

// Folder icons mapping
export const FOLDER_ICONS: Record<string, string> = {
  src: 'folder-src',
  lib: 'folder-lib',
  components: 'folder-components',
  hooks: 'folder-hooks',
  utils: 'folder-utils',
  api: 'folder-api',
  public: 'folder-public',
  assets: 'folder-assets',
  images: 'folder-images',
  styles: 'folder-styles',
  css: 'folder-styles',
  tests: 'folder-test',
  test: 'folder-test',
  '__tests__': 'folder-test',
  node_modules: 'folder-node',
  '.git': 'folder-git',
  dist: 'folder-dist',
  build: 'folder-dist',
  out: 'folder-dist',
  config: 'folder-config',
  docs: 'folder-docs',
};

// Keyboard shortcuts
export const SHORTCUTS = {
  openFolder: { key: 'o', modifier: true },
  newFile: { key: 'n', modifier: true },
  saveFile: { key: 's', modifier: true },
  closeTab: { key: 'w', modifier: true },
  toggleSidebar: { key: 'b', modifier: true },
  commandPalette: { key: 'p', modifier: true, shift: true },
  search: { key: 'f', modifier: true },
  settings: { key: ',', modifier: true },
};

// Animation durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 200,
  slow: 300,
};

// Storage keys
export const STORAGE_KEYS = {
  recentProjects: 'devblitz:recent-projects',
  sidebarWidth: 'devblitz:sidebar-width',
  openTabs: 'devblitz:open-tabs',
  settings: 'devblitz:settings',
};


