'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';
import { useCommands } from '@/hooks/useCommands';

/** Commands reachable from a `Ctrl+K` chord. */
const CHORD_COMMANDS: Record<string, string> = {
  s: 'file.saveAll',
  z: 'view.toggleZenMode',
  w: 'file.closeAll',
};

/**
 * Global keyboard handling.
 *
 * Shortcuts resolve to entries in the command registry, so a binding and a
 * palette entry can never drift apart. The editor handles its own text-editing
 * keys first; anything it consumed arrives here with defaultPrevented set.
 */
export function useKeyboardShortcuts() {
  const commands = useCommands();
  const commandsRef = useRef(commands);
  commandsRef.current = commands;

  useEffect(() => {
    /** Waiting for the second key of a Ctrl+K chord. */
    let chordPending = false;
    let chordTimer: ReturnType<typeof setTimeout> | undefined;

    const run = (id: string) => {
      const command = commandsRef.current.find((c) => c.id === id);
      if (command && (command.isAvailable?.() ?? true)) void command.run();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // The editor (or a dialog) already dealt with this key.
      if (e.defaultPrevented) return;

      const app = useAppStore.getState();
      const editor = useEditorStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      const overlayOpen =
        app.isCommandPaletteOpen ||
        app.isQuickOpenOpen ||
        app.isSettingsOpen ||
        app.isKeyboardShortcutsOpen;

      // While an overlay owns the keyboard, only Escape gets through.
      if (overlayOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          app.closeAllOverlays();
        }
        return;
      }

      // --- Ctrl+K chords ---------------------------------------------------
      if (chordPending) {
        clearTimeout(chordTimer);
        chordPending = false;

        const chordCommand = CHORD_COMMANDS[key];
        if (chordCommand) {
          e.preventDefault();
          run(chordCommand);
          return;
        }
      }

      if (mod && key === 'k' && !e.shiftKey) {
        e.preventDefault();
        chordPending = true;
        // Abandon the chord if the second key doesn't arrive quickly.
        chordTimer = setTimeout(() => {
          chordPending = false;
        }, 1500);
        return;
      }

      // The code editor is a textarea, but shortcuts like Ctrl+W still apply
      // there - only genuine text fields (find box, commit message) opt out.
      const target = e.target as HTMLElement | null;
      const isEditorSurface = target?.dataset?.editorSurface === 'true';
      const isTyping =
        !isEditorSurface &&
        (target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable === true);

      // --- Overlays --------------------------------------------------------
      if (mod && e.shiftKey && key === 'p') {
        e.preventDefault();
        app.setCommandPaletteOpen(true);
        return;
      }

      if (mod && !e.shiftKey && key === 'p') {
        e.preventDefault();
        app.setQuickOpenOpen(true);
        return;
      }

      if (mod && e.shiftKey && key === 'o') {
        e.preventDefault();
        run('go.toSymbol');
        return;
      }

      if (mod && !e.shiftKey && key === 'g' && !isTyping) {
        e.preventDefault();
        run('go.toLine');
        return;
      }

      // --- Panels ----------------------------------------------------------
      if (mod && e.shiftKey && ['e', 'f', 'g', 'x'].includes(key)) {
        e.preventDefault();
        run(
          key === 'e'
            ? 'view.explorer'
            : key === 'f'
              ? 'view.search'
              : key === 'g'
                ? 'view.git'
                : 'view.extensions'
        );
        return;
      }

      // --- Terminal --------------------------------------------------------
      if (mod && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        e.stopPropagation();
        run(e.shiftKey ? 'view.newTerminal' : 'view.toggleTerminal');
        return;
      }

      // --- Layout ----------------------------------------------------------
      if (mod && key === 'b' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        run('view.toggleSidebar');
        return;
      }

      if (e.altKey && key === 'z' && !mod) {
        e.preventDefault();
        run('view.toggleWordWrap');
        return;
      }

      // --- Font size -------------------------------------------------------
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        run('editor.zoomIn');
        return;
      }

      if (mod && e.key === '-') {
        e.preventDefault();
        run('editor.zoomOut');
        return;
      }

      if (mod && e.key === '0') {
        e.preventDefault();
        run('editor.resetZoom');
        return;
      }

      // --- File ------------------------------------------------------------
      if (mod && key === ',') {
        e.preventDefault();
        run('preferences.settings');
        return;
      }

      if (mod && key === 'o' && !e.shiftKey) {
        e.preventDefault();
        run('file.openFolder');
        return;
      }

      if (mod && key === 'n' && !isTyping) {
        e.preventDefault();
        run('file.new');
        return;
      }

      if (mod && key === 's' && !e.shiftKey) {
        e.preventDefault();
        run('file.save');
        return;
      }

      if (mod && key === 'w' && !isTyping) {
        e.preventDefault();
        run('file.closeEditor');
        return;
      }

      // --- Tab switching ---------------------------------------------------
      if (mod && e.key === 'Tab') {
        e.preventDefault();
        const { openFiles, activeFilePath, setActiveFile } = editor;
        if (openFiles.length < 2) return;

        const index = openFiles.findIndex((f) => f.path === activeFilePath);
        const next = e.shiftKey
          ? (index - 1 + openFiles.length) % openFiles.length
          : (index + 1) % openFiles.length;

        const target = openFiles[next];
        if (target) setActiveFile(target.path);
        return;
      }

      if (mod && /^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1;
        const file = editor.openFiles[index];
        if (file) {
          e.preventDefault();
          editor.setActiveFile(file.path);
        }
      }
    };

    // Bubble phase, deliberately: the editor's own handlers run first and mark
    // keys they consumed as defaultPrevented, so nothing fires twice.
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(chordTimer);
    };
  }, []);
}
