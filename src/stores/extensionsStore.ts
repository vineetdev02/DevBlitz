'use client';

import { create } from 'zustand';

export interface Extension {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  icon?: string;
  installed: boolean;
  enabled: boolean;
  category?: string;
  rating?: number;
  downloadCount?: number;
}

interface ExtensionsState {
  extensions: Extension[];
  installedExtensions: Extension[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  searchExtensions: (query: string) => Promise<void>;
  installExtension: (extensionId: string) => Promise<void>;
  uninstallExtension: (extensionId: string) => Promise<void>;
  enableExtension: (extensionId: string) => Promise<void>;
  disableExtension: (extensionId: string) => Promise<void>;
  loadInstalledExtensions: () => Promise<void>;
}

// Mock extensions data (in production, this would come from an API)
const mockExtensions: Extension[] = [
  {
    id: 'prettier',
    name: 'Prettier - Code formatter',
    publisher: 'Prettier',
    version: '10.0.0',
    description: 'Code formatter using Prettier',
    category: 'Formatters',
    rating: 4.8,
    downloadCount: 5000000,
    installed: false,
    enabled: false,
  },
  {
    id: 'eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    version: '3.0.0',
    description: 'Integrates ESLint into VS Code',
    category: 'Linters',
    rating: 4.7,
    downloadCount: 8000000,
    installed: false,
    enabled: false,
  },
  {
    id: 'gitlens',
    name: 'GitLens — Git supercharged',
    publisher: 'GitKraken',
    version: '15.0.0',
    description: 'Supercharge Git within VS Code',
    category: 'SCM',
    rating: 4.9,
    downloadCount: 20000000,
    installed: false,
    enabled: false,
  },
  {
    id: 'python',
    name: 'Python',
    publisher: 'Microsoft',
    version: '2024.0.0',
    description: 'IntelliSense, linting, debugging, code formatting, refactoring',
    category: 'Programming Languages',
    rating: 4.8,
    downloadCount: 50000000,
    installed: false,
    enabled: false,
  },
  {
    id: 'rust-analyzer',
    name: 'rust-analyzer',
    publisher: 'rust-lang',
    version: '0.4.0',
    description: 'Rust language support',
    category: 'Programming Languages',
    rating: 4.9,
    downloadCount: 1000000,
    installed: false,
    enabled: false,
  },
  {
    id: 'vscode-icons',
    name: 'vscode-icons',
    publisher: 'VSCode Icons Team',
    version: '12.0.0',
    description: 'Icons for Visual Studio Code',
    category: 'Other',
    rating: 4.7,
    downloadCount: 15000000,
    installed: false,
    enabled: false,
  },
];

export const useExtensionsStore = create<ExtensionsState>((set, get) => ({
  extensions: [],
  installedExtensions: [],
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

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
    
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const extension = extensions.find(e => e.id === extensionId) || 
                     mockExtensions.find(e => e.id === extensionId);
    
    if (extension) {
      const updatedExtension = { ...extension, installed: true, enabled: true };
      set({
        extensions: extensions.map(e => e.id === extensionId ? updatedExtension : e),
        installedExtensions: [...installedExtensions, updatedExtension],
      });
    }
  },

  uninstallExtension: async (extensionId) => {
    const { installedExtensions, extensions } = get();
    
    // Simulate uninstallation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    set({
      installedExtensions: installedExtensions.filter(e => e.id !== extensionId),
      extensions: extensions.map(e => 
        e.id === extensionId ? { ...e, installed: false, enabled: false } : e
      ),
    });
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
    set({ installedExtensions: [] });
  },
}));

