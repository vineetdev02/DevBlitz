'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTerminalStore } from '@/stores/terminalStore';
import { notify } from '@/stores/notificationStore';
import { useProject } from '@/hooks/useProject';
import { revealInFileManager } from '@/lib/tauri-commands';

export interface EditorCommand {
  id: string;
  title: string;
  category: string;
  keybinding?: string;
  /** Hidden from the palette when this returns false. */
  isAvailable?: () => boolean;
  run: () => void | Promise<void>;
}

/**
 * The single source of truth for every action the IDE can perform.
 * The command palette, the menus and the keyboard handler all read from here,
 * so a command only ever has to be written once.
 */
export function useCommands(): EditorCommand[] {
  const { openProject, closeProject } = useProject();

  return useMemo(() => {
    const app = () => useAppStore.getState();
    const editor = () => useEditorStore.getState();
    const project = () => useProjectStore.getState();
    const settings = () => useSettingsStore.getState();
    const terminal = () => useTerminalStore.getState();

    const hasEditor = () => editor().activeFilePath !== null;
    const hasProject = () => Boolean(project().currentProject?.path);

    const commands: EditorCommand[] = [
      // --- File ----------------------------------------------------------
      {
        id: 'file.openFolder',
        title: 'Open Folder',
        category: 'File',
        keybinding: 'Ctrl+O',
        run: () => void openProject(),
      },
      {
        id: 'file.new',
        title: 'New Untitled File',
        category: 'File',
        keybinding: 'Ctrl+N',
        run: () => editor().createNewFile(),
      },
      {
        id: 'file.save',
        title: 'Save',
        category: 'File',
        keybinding: 'Ctrl+S',
        isAvailable: hasEditor,
        run: () => void editor().saveActiveFile(),
      },
      {
        id: 'file.saveAll',
        title: 'Save All',
        category: 'File',
        keybinding: 'Ctrl+K S',
        isAvailable: hasEditor,
        run: () => void editor().saveAllFiles(),
      },
      {
        id: 'file.revert',
        title: 'Revert File',
        category: 'File',
        isAvailable: hasEditor,
        run: () => {
          const path = editor().activeFilePath;
          if (path) editor().revertFile(path);
        },
      },
      {
        id: 'file.closeEditor',
        title: 'Close Editor',
        category: 'File',
        keybinding: 'Ctrl+W',
        isAvailable: hasEditor,
        run: () => {
          const path = editor().activeFilePath;
          if (path) editor().closeFile(path);
        },
      },
      {
        id: 'file.closeAll',
        title: 'Close All Editors',
        category: 'File',
        isAvailable: hasEditor,
        run: () => editor().closeAllFiles(),
      },
      {
        id: 'file.closeSaved',
        title: 'Close Saved Editors',
        category: 'File',
        isAvailable: hasEditor,
        run: () => editor().closeSavedFiles(),
      },
      {
        id: 'file.revealInFileManager',
        title: 'Reveal Active File in File Manager',
        category: 'File',
        isAvailable: hasEditor,
        run: async () => {
          const path = editor().activeFilePath;
          if (!path || path.startsWith('untitled:')) return;
          try {
            await revealInFileManager(path);
          } catch (err) {
            notify({
              kind: 'error',
              title: 'Could not open file manager',
              detail: err instanceof Error ? err.message : String(err),
            });
          }
        },
      },
      {
        id: 'file.closeFolder',
        title: 'Close Folder',
        category: 'File',
        isAvailable: hasProject,
        run: () => {
          editor().closeAllFiles();
          closeProject();
        },
      },

      // --- Go -------------------------------------------------------------
      {
        id: 'go.toFile',
        title: 'Go to File...',
        category: 'Go',
        keybinding: 'Ctrl+P',
        isAvailable: hasProject,
        run: () => app().setQuickOpenOpen(true),
      },
      {
        id: 'go.toSymbol',
        title: 'Go to Symbol in Editor...',
        category: 'Go',
        keybinding: 'Ctrl+Shift+O',
        isAvailable: hasEditor,
        run: () => {
          app().setQuickOpenOpen(true);
          // The palette reads this prefix on open.
          window.dispatchEvent(new CustomEvent('devblitz:quickopen-prefix', { detail: '@' }));
        },
      },
      {
        id: 'go.toLine',
        title: 'Go to Line/Column...',
        category: 'Go',
        keybinding: 'Ctrl+G',
        isAvailable: hasEditor,
        run: () => {
          app().setQuickOpenOpen(true);
          window.dispatchEvent(new CustomEvent('devblitz:quickopen-prefix', { detail: ':' }));
        },
      },

      // --- View -----------------------------------------------------------
      {
        id: 'view.commandPalette',
        title: 'Command Palette...',
        category: 'View',
        keybinding: 'Ctrl+Shift+P',
        run: () => app().setCommandPaletteOpen(true),
      },
      {
        id: 'view.explorer',
        title: 'Show Explorer',
        category: 'View',
        keybinding: 'Ctrl+Shift+E',
        run: () => app().setActivePanel('explorer'),
      },
      {
        id: 'view.search',
        title: 'Show Search',
        category: 'View',
        keybinding: 'Ctrl+Shift+F',
        run: () => app().setActivePanel('search'),
      },
      {
        id: 'view.git',
        title: 'Show Source Control',
        category: 'View',
        keybinding: 'Ctrl+Shift+G',
        run: () => app().setActivePanel('git'),
      },
      {
        id: 'view.extensions',
        title: 'Show Extensions',
        category: 'View',
        keybinding: 'Ctrl+Shift+X',
        run: () => app().setActivePanel('extensions'),
      },
      {
        id: 'view.toggleSidebar',
        title: 'Toggle Primary Side Bar',
        category: 'View',
        keybinding: 'Ctrl+B',
        run: () => app().toggleSidebar(),
      },
      {
        id: 'view.toggleTerminal',
        title: 'Toggle Terminal',
        category: 'View',
        keybinding: 'Ctrl+`',
        run: () => {
          const store = terminal();
          if (!store.isTerminalOpen && store.terminals.length === 0) {
            store.createTerminal(project().currentProject?.path || '/');
          }
          store.toggleTerminal();
        },
      },
      {
        id: 'view.newTerminal',
        title: 'Create New Terminal',
        category: 'Terminal',
        keybinding: 'Ctrl+Shift+`',
        run: () => {
          const store = terminal();
          store.createTerminal(project().currentProject?.path || '/');
          if (!store.isTerminalOpen) store.toggleTerminal();
        },
      },
      {
        id: 'view.toggleZenMode',
        title: 'Toggle Zen Mode',
        category: 'View',
        keybinding: 'Ctrl+K Z',
        run: () => app().toggleZenMode(),
      },
      {
        id: 'view.toggleBreadcrumbs',
        title: 'Toggle Breadcrumbs',
        category: 'View',
        run: () => app().toggleBreadcrumbs(),
      },
      {
        id: 'view.toggleMinimap',
        title: 'Toggle Minimap',
        category: 'View',
        run: () => settings().setMinimap(!settings().minimap),
      },
      {
        id: 'view.toggleWordWrap',
        title: 'Toggle Word Wrap',
        category: 'View',
        keybinding: 'Alt+Z',
        run: () => settings().setWordWrap(!settings().wordWrap),
      },
      {
        id: 'view.toggleLineNumbers',
        title: 'Toggle Line Numbers',
        category: 'View',
        run: () => settings().setLineNumbers(!settings().lineNumbers),
      },

      // --- Editor font -----------------------------------------------------
      {
        id: 'editor.zoomIn',
        title: 'Increase Font Size',
        category: 'Editor',
        keybinding: 'Ctrl+=',
        run: () => settings().setFontSize(Math.min(32, settings().fontSize + 1)),
      },
      {
        id: 'editor.zoomOut',
        title: 'Decrease Font Size',
        category: 'Editor',
        keybinding: 'Ctrl+-',
        run: () => settings().setFontSize(Math.max(8, settings().fontSize - 1)),
      },
      {
        id: 'editor.resetZoom',
        title: 'Reset Font Size',
        category: 'Editor',
        keybinding: 'Ctrl+0',
        run: () => settings().setFontSize(13),
      },
      {
        id: 'editor.indentTwo',
        title: 'Set Indentation to 2 Spaces',
        category: 'Editor',
        run: () => settings().setTabSize(2),
      },
      {
        id: 'editor.indentFour',
        title: 'Set Indentation to 4 Spaces',
        category: 'Editor',
        run: () => settings().setTabSize(4),
      },

      // --- Preferences ------------------------------------------------------
      {
        id: 'preferences.settings',
        title: 'Open Settings',
        category: 'Preferences',
        keybinding: 'Ctrl+,',
        run: () => app().setSettingsOpen(true),
      },
      {
        id: 'preferences.keyboardShortcuts',
        title: 'Open Keyboard Shortcuts',
        category: 'Preferences',
        keybinding: 'Ctrl+K Ctrl+S',
        run: () => app().setKeyboardShortcutsOpen(true),
      },
    ];

    return commands;
  }, [openProject, closeProject]);
}
