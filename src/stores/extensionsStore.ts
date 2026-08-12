'use client';

import { create } from 'zustand';

export interface Extension {
  id: string;
  identifier?: string; // e.g., "steoates.autoim"
  name: string;
  publisher: string;
  version: string;
  description: string;
  fullDescription?: string; // Longer description
  icon?: string;
  installed: boolean;
  enabled: boolean;
  category?: string;
  categories?: string[]; // Multiple categories
  rating?: number;
  downloadCount?: number;
  publishedDate?: string;
  lastUpdated?: string;
  lastReleased?: string;
  size?: string; // e.g., "1.44MB"
  homepage?: string;
  repository?: string;
  bugs?: string;
  configuration?: ExtensionConfiguration[];
  changelog?: string;
  readme?: string;
}

export interface ExtensionConfiguration {
  key: string;
  title: string;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'object';
  default?: any;
}

interface ExtensionsState {
  extensions: Extension[];
  installedExtensions: Extension[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  selectedExtensionId: string | null; // For detail view
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedExtensionId: (id: string | null) => void;
  searchExtensions: (query: string) => Promise<void>;
  installExtension: (extensionId: string) => Promise<void>;
  uninstallExtension: (extensionId: string) => Promise<void>;
  enableExtension: (extensionId: string) => Promise<void>;
  disableExtension: (extensionId: string) => Promise<void>;
  loadInstalledExtensions: () => Promise<void>;
  getExtensionById: (id: string) => Extension | undefined;
}

// Mock extensions data (in production, this would come from an API)
const mockExtensions: Extension[] = [
  {
    id: 'prettier',
    identifier: 'esbenp.prettier-vscode',
    name: 'Prettier - Code formatter',
    publisher: 'Prettier',
    version: '10.0.0',
    description: 'Code formatter using Prettier',
    fullDescription: 'Prettier is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.',
    category: 'Formatters',
    categories: ['Formatters', 'Other'],
    rating: 4.8,
    downloadCount: 5000000,
    publishedDate: '2017-01-11',
    lastUpdated: '2024-11-15',
    lastReleased: '2024-11-15',
    size: '2.5MB',
    installed: false,
    enabled: false,
    configuration: [
      {
        key: 'prettier.enable',
        title: 'Enable Prettier',
        description: 'Enable/disable Prettier',
        type: 'boolean',
        default: true,
      },
      {
        key: 'prettier.singleQuote',
        title: 'Single Quote',
        description: 'Use single quotes instead of double quotes',
        type: 'boolean',
        default: false,
      },
    ],
  },
  {
    id: 'eslint',
    identifier: 'dbaeumer.vscode-eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    version: '3.0.0',
    description: 'Integrates ESLint into VS Code',
    fullDescription: 'This extension integrates ESLint into VS Code. If you are new to ESLint check the documentation. The extension uses the ESLint library installed in the opened workspace folder. If the folder doesn\'t provide one the extension looks for a global install version.',
    category: 'Linters',
    categories: ['Linters'],
    rating: 4.7,
    downloadCount: 8000000,
    publishedDate: '2015-11-10',
    lastUpdated: '2024-12-01',
    lastReleased: '2024-12-01',
    size: '1.8MB',
    installed: false,
    enabled: false,
  },
  {
    id: 'gitlens',
    identifier: 'eamodio.gitlens',
    name: 'GitLens — Git supercharged',
    publisher: 'GitKraken',
    version: '15.0.0',
    description: 'Supercharge Git within VS Code',
    fullDescription: 'GitLens supercharges Git capabilities built into VS Code. It helps you to visualize code authorship at a glance via Git blame annotations and CodeLens, seamlessly navigate and explore Git repositories, gain valuable insights via powerful comparison commands, and so much more.',
    category: 'SCM',
    categories: ['SCM'],
    rating: 4.9,
    downloadCount: 20000000,
    publishedDate: '2016-12-12',
    lastUpdated: '2024-12-08',
    lastReleased: '2024-12-08',
    size: '5.2MB',
    installed: false,
    enabled: false,
  },
  {
    id: 'python',
    identifier: 'ms-python.python',
    name: 'Python',
    publisher: 'Microsoft',
    version: '2024.0.0',
    description: 'IntelliSense, linting, debugging, code formatting, refactoring',
    fullDescription: 'The Python extension for Visual Studio Code provides rich support for the Python language (for all actively supported versions of the language: >=3.7), including features such as IntelliSense, linting, debugging, code navigation, code formatting, refactoring, variable explorer, test explorer, and more!',
    category: 'Programming Languages',
    categories: ['Programming Languages', 'Debuggers'],
    rating: 4.8,
    downloadCount: 50000000,
    publishedDate: '2015-11-30',
    lastUpdated: '2024-12-09',
    lastReleased: '2024-12-09',
    size: '15.3MB',
    installed: false,
    enabled: false,
  },
  {
    id: 'rust-analyzer',
    identifier: 'rust-lang.rust-analyzer',
    name: 'rust-analyzer',
    publisher: 'rust-lang',
    version: '0.4.0',
    description: 'Rust language support',
    fullDescription: 'rust-analyzer is an implementation of Language Server Protocol for the Rust programming language. It provides features like completion and goto definition for many file formats, via language servers.',
    category: 'Programming Languages',
    categories: ['Programming Languages'],
    rating: 4.9,
    downloadCount: 1000000,
    publishedDate: '2019-09-23',
    lastUpdated: '2024-12-07',
    lastReleased: '2024-12-07',
    size: '45.6MB',
    installed: false,
    enabled: false,
  },
  {
    id: 'vscode-icons',
    identifier: 'vscode-icons-team.vscode-icons',
    name: 'vscode-icons',
    publisher: 'VSCode Icons Team',
    version: '12.0.0',
    description: 'Icons for Visual Studio Code',
    fullDescription: 'Bring icons to your Visual Studio Code. Minimalist icons, designed specifically for VS Code. The extension provides icons for files, folders, and projects in VS Code.',
    category: 'Other',
    categories: ['Other', 'Themes'],
    rating: 4.7,
    downloadCount: 15000000,
    publishedDate: '2016-04-04',
    lastUpdated: '2024-11-20',
    lastReleased: '2024-11-20',
    size: '3.1MB',
    installed: false,
    enabled: false,
  },
  {
    id: 'auto-import',
    identifier: 'steoates.autoim',
    name: 'Auto Import',
    publisher: 'steoates',
    version: '1.5.3',
    description: 'Automatically finds, parses and provides code actions and code completion for all available imports.',
    fullDescription: 'Automatically finds, parses and provides code actions and code completion for all available imports. Works with Typescript and TSX. Multi-root workspace Ready!',
    category: 'Other',
    categories: ['Other'],
    rating: 5.0,
    downloadCount: 44000,
    publishedDate: '2020-04-13',
    lastUpdated: '2025-11-15',
    lastReleased: '2020-04-13',
    size: '1.44MB',
    installed: false,
    enabled: false,
    configuration: [
      {
        key: 'filesToScan',
        title: 'Files to Scan',
        description: 'Glob for which files in your workspace to scan, defaults to \'**/*.{ts, tsx}\'',
        type: 'string',
        default: '**/*.{ts, tsx}',
      },
      {
        key: 'showNotifications',
        title: 'Show Notifications',
        description: 'Controls if the annoying notifications should be shown, defaults to false',
        type: 'boolean',
        default: false,
      },
      {
        key: 'doubleQuotes',
        title: 'Double Quotes',
        description: 'Use double quotes rather than single',
        type: 'boolean',
        default: false,
      },
      {
        key: 'spaceBetweenBraces',
        title: 'Space Between Braces',
        description: 'Difference between import {test}',
        type: 'boolean',
        default: false,
      },
    ],
  },
];

export const useExtensionsStore = create<ExtensionsState>((set, get) => ({
  extensions: [],
  installedExtensions: [],
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,
  selectedExtensionId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedExtensionId: (id) => set({ selectedExtensionId: id }),

  getExtensionById: (id) => {
    const { extensions, installedExtensions } = get();
    return extensions.find(e => e.id === id) || 
           installedExtensions.find(e => e.id === id) ||
           mockExtensions.find(e => e.id === id);
  },

  searchExtensions: async (query) => {
    set({ isLoading: true });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const lowerQuery = query.toLowerCase();
    const filtered = mockExtensions.filter(
      ext =>
        ext.name.toLowerCase().includes(lowerQuery) ||
        ext.description.toLowerCase().includes(lowerQuery) ||
        ext.publisher.toLowerCase().includes(lowerQuery)
    );
    
    set({ extensions: filtered, isLoading: false });
  },

  installExtension: async (extensionId) => {
    const { extensions, installedExtensions } = get();
    
    // Check if already installed
    if (installedExtensions.some(e => e.id === extensionId)) {
      return;
    }
    
    // Simulate installation with security validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const extension = extensions.find(e => e.id === extensionId) || 
                     mockExtensions.find(e => e.id === extensionId);
    
    if (extension) {
      // Validate extension before installation
      if (!extension.identifier || !extension.publisher) {
        throw new Error('Invalid extension: missing required fields');
      }
      
      const updatedExtension = { ...extension, installed: true, enabled: true };
      const newInstalled = [...installedExtensions, updatedExtension];
      
      set({
        extensions: extensions.map(e => e.id === extensionId ? updatedExtension : e),
        installedExtensions: newInstalled,
      });
      
      // In production, here you would:
      // 1. Download and validate the .vsix file
      // 2. Verify publisher signature
      // 3. Extract and install extension files
      // 4. Register extension in the IDE's extension system
    }
  },

  uninstallExtension: async (extensionId) => {
    const { installedExtensions, extensions, selectedExtensionId } = get();
    
    // Simulate uninstallation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Close detail view if this extension is open
    const newSelectedId = selectedExtensionId === extensionId ? null : selectedExtensionId;
    
    set({
      installedExtensions: installedExtensions.filter(e => e.id !== extensionId),
      extensions: extensions.map(e => 
        e.id === extensionId ? { ...e, installed: false, enabled: false } : e
      ),
      selectedExtensionId: newSelectedId,
    });
    
    // In production, here you would:
    // 1. Unload extension from memory
    // 2. Remove extension files from filesystem
    // 3. Clean up extension registration
    // 4. Reload window if needed
  },

  enableExtension: async (extensionId) => {
    const { installedExtensions, extensions } = get();
    
    set({
      installedExtensions: installedExtensions.map(e =>
        e.id === extensionId ? { ...e, enabled: true } : e
      ),
      extensions: extensions.map(e =>
        e.id === extensionId ? { ...e, enabled: true } : e
      ),
    });
  },

  disableExtension: async (extensionId) => {
    const { installedExtensions, extensions } = get();
    
    set({
      installedExtensions: installedExtensions.map(e =>
        e.id === extensionId ? { ...e, enabled: false } : e
      ),
      extensions: extensions.map(e =>
        e.id === extensionId ? { ...e, enabled: false } : e
      ),
    });
  },

  loadInstalledExtensions: async () => {
    // In production, load from storage/API
    // For now, load from localStorage or return empty array
    try {
      const stored = localStorage.getItem('devblitz-installed-extensions');
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ installedExtensions: parsed });
      } else {
        set({ installedExtensions: [] });
      }
    } catch (error) {
      console.error('Failed to load installed extensions:', error);
      set({ installedExtensions: [] });
    }
  },
}));

// Persist installed extensions to localStorage.
// Plain subscribe fires on every change, so compare against the previous value
// ourselves rather than pulling in the subscribeWithSelector middleware.
let lastPersistedExtensions = useExtensionsStore.getState().installedExtensions;

useExtensionsStore.subscribe(
  (state) => {
    const { installedExtensions } = state;
    if (installedExtensions === lastPersistedExtensions) return;
    lastPersistedExtensions = installedExtensions;

    try {
      localStorage.setItem('devblitz-installed-extensions', JSON.stringify(installedExtensions));
    } catch (error) {
      console.error('Failed to save installed extensions:', error);
    }
  }
);



