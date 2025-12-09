'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyBinding {
  id: string;
  command: string;
  keybinding: string;
  when?: string;
}

export const DEFAULT_KEYBINDINGS: KeyBinding[] = [
  { id: '1', command: 'Open Folder', keybinding: 'Ctrl+O', when: '' },
  { id: '2', command: 'New File', keybinding: 'Ctrl+N', when: '' },
  { id: '3', command: 'Save File', keybinding: 'Ctrl+S', when: 'editorFocus' },
  { id: '4', command: 'Save All', keybinding: 'Ctrl+Shift+S', when: '' },
  { id: '5', command: 'Close Tab', keybinding: 'Ctrl+W', when: 'editorFocus' },
  { id: '6', command: 'Toggle Sidebar', keybinding: 'Ctrl+B', when: '' },
  { id: '7', command: 'Toggle Terminal', keybinding: 'Ctrl+`', when: '' },
  { id: '8', command: 'Command Palette', keybinding: 'Ctrl+Shift+P', when: '' },
  { id: '9', command: 'Go to File', keybinding: 'Ctrl+P', when: '' },
  { id: '10', command: 'Find in Files', keybinding: 'Ctrl+Shift+F', when: '' },
  { id: '11', command: 'Find', keybinding: 'Ctrl+F', when: 'editorFocus' },
  { id: '12', command: 'Replace', keybinding: 'Ctrl+H', when: 'editorFocus' },
  { id: '13', command: 'Undo', keybinding: 'Ctrl+Z', when: 'editorFocus' },
  { id: '14', command: 'Redo', keybinding: 'Ctrl+Shift+Z', when: 'editorFocus' },
  { id: '15', command: 'Cut', keybinding: 'Ctrl+X', when: 'editorFocus' },
  { id: '16', command: 'Copy', keybinding: 'Ctrl+C', when: 'editorFocus' },
  { id: '17', command: 'Paste', keybinding: 'Ctrl+V', when: 'editorFocus' },
  { id: '18', command: 'Select All', keybinding: 'Ctrl+A', when: 'editorFocus' },
  { id: '19', command: 'Toggle Comment', keybinding: 'Ctrl+/', when: 'editorFocus' },
  { id: '20', command: 'Format Document', keybinding: 'Shift+Alt+F', when: 'editorFocus' },
];

interface SettingsState {
  // Editor settings
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  
  // Theme
  theme: 'dark' | 'light';
  
  // Keybindings
  keybindings: KeyBinding[];
  
  // Panels
  activeSettingsTab: 'general' | 'editor' | 'keybindings' | 'about';
  
  // Actions
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setMinimap: (show: boolean) => void;
  setLineNumbers: (show: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateKeybinding: (id: string, keybinding: string) => void;
  resetKeybindings: () => void;
  setActiveSettingsTab: (tab: 'general' | 'editor' | 'keybindings' | 'about') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 13,
      tabSize: 2,
      wordWrap: false,
      minimap: false,
      lineNumbers: true,
      theme: 'dark',
      keybindings: DEFAULT_KEYBINDINGS,
      activeSettingsTab: 'general',

      setFontSize: (size) => set({ fontSize: size }),
      setTabSize: (size) => set({ tabSize: size }),
      setWordWrap: (wrap) => set({ wordWrap: wrap }),
      setMinimap: (show) => set({ minimap: show }),
      setLineNumbers: (show) => set({ lineNumbers: show }),
      setTheme: (theme) => set({ theme }),
      updateKeybinding: (id, keybinding) => set((state) => ({
        keybindings: state.keybindings.map((kb) =>
          kb.id === id ? { ...kb, keybinding } : kb
        ),
      })),
      resetKeybindings: () => set({ keybindings: DEFAULT_KEYBINDINGS }),
      setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
    }),
    {
      name: 'devblitz-settings',
    }
  )
);



