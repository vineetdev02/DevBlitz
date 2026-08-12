'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Braces,
  Box,
  ChevronRight,
  FileCode,
  Hash,
  Search,
  Terminal as TerminalIcon,
  Type,
  Variable,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fuzzyRank, segmentMatches } from '@/lib/fuzzy';
import { extractSymbols, type DocumentSymbol, type SymbolKind } from '@/lib/symbols';
import { listProjectFiles, type IndexedFile } from '@/lib/tauri-commands';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { useCurrentProject } from '@/stores/projectStore';
import { notify } from '@/stores/notificationStore';
import { useCommands, type EditorCommand } from '@/hooks/useCommands';

type Mode = 'files' | 'commands' | 'symbols' | 'line';

const MAX_RESULTS = 60;

interface Row {
  key: string;
  label: string;
  description?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Indices in `label` that matched the query, for highlighting. */
  indices: number[];
  run: () => void;
}

export function CommandPalette() {
  const isCommandPaletteOpen = useAppStore((state) => state.isCommandPaletteOpen);
  const isQuickOpenOpen = useAppStore((state) => state.isQuickOpenOpen);
  const { setCommandPaletteOpen, setQuickOpenOpen } = useAppStore();

  const isOpen = isCommandPaletteOpen || isQuickOpenOpen;

  const currentProject = useCurrentProject();
  const commands = useCommands();
  const { openFileFromDisk, setActiveFile, openFiles, recentPaths, activeFilePath } = useEditorStore();

  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [files, setFiles] = useState<IndexedFile[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeFile = openFiles.find((f) => f.path === activeFilePath) ?? null;

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuickOpenOpen(false);
  }, [setCommandPaletteOpen, setQuickOpenOpen]);

  // Seed the input when the palette opens.
  useEffect(() => {
    if (!isOpen) return;
    setInput(isCommandPaletteOpen ? '>' : '');
    setSelectedIndex(0);
    // Focus after the entrance animation has started.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen, isCommandPaletteOpen]);

  // Commands can request a specific prefix (Go to Symbol / Go to Line).
  useEffect(() => {
    const handler = (event: Event) => {
      const prefix = (event as CustomEvent<string>).detail;
      setInput(prefix);
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    window.addEventListener('devblitz:quickopen-prefix', handler);
    return () => window.removeEventListener('devblitz:quickopen-prefix', handler);
  }, []);

  // Build the file index whenever the palette opens on a project.
  useEffect(() => {
    if (!isOpen || !currentProject?.path) return;

    let cancelled = false;
    setIsIndexing(true);

    listProjectFiles(currentProject.path)
      .then((indexed) => {
        if (!cancelled) setFiles(indexed);
      })
      .catch((err) => {
        if (!cancelled) {
          notify({
            kind: 'error',
            title: 'Could not index project files',
            detail: err instanceof Error ? err.message : String(err),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsIndexing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentProject?.path]);

  const mode: Mode = useMemo(() => {
    if (input.startsWith('>')) return 'commands';
    if (input.startsWith('@')) return 'symbols';
    if (input.startsWith(':')) return 'line';
    return 'files';
  }, [input]);

  const query = useMemo(
    () => (mode === 'files' ? input.trim() : input.slice(1).trim()),
    [input, mode]
  );

  const symbols = useMemo(
    () => (mode === 'symbols' && activeFile ? extractSymbols(activeFile.content, activeFile.language) : []),
    [mode, activeFile]
  );

  const rows: Row[] = useMemo(() => {
    if (mode === 'commands') {
      const available = commands.filter((c) => c.isAvailable?.() ?? true);
      return fuzzyRank(query, available, (c) => `${c.category}: ${c.title}`, MAX_RESULTS).map(
        ({ item, indices }) => ({
          key: item.id,
          label: item.title,
          description: item.category,
          hint: item.keybinding,
          icon: iconForCommand(item),
          // Re-map the indices from "Category: Title" onto the title alone.
          indices: indices
            .map((i) => i - (item.category.length + 2))
            .filter((i) => i >= 0),
          run: () => {
            close();
            void item.run();
          },
        })
      );
    }

    if (mode === 'symbols') {
      return fuzzyRank(query, symbols, (s) => s.name, MAX_RESULTS).map(({ item, indices }) => ({
        key: `${item.line}:${item.name}`,
        label: item.name,
        description: `${item.kind} · line ${item.line}`,
        icon: iconForSymbol(item.kind),
        indices,
        run: () => {
          close();
          window.dispatchEvent(
            new CustomEvent('devblitz:goto-line', { detail: { line: item.line, column: 1 } })
          );
        },
      }));
    }

    if (mode === 'line') {
      const [lineText = '', columnText = ''] = query.split(':');
      const line = Number.parseInt(lineText, 10);
      const column = Number.parseInt(columnText, 10);
      const lineCount = activeFile ? activeFile.content.split('\n').length : 0;

      if (!activeFile) return [];

      const target = Number.isFinite(line) ? Math.min(Math.max(line, 1), lineCount) : null;

      return [
        {
          key: 'goto-line',
          label: target ? `Go to line ${target}${Number.isFinite(column) ? `, column ${column}` : ''}` : `Go to line… (1 – ${lineCount})`,
          description: activeFile.name,
          icon: ArrowRight,
          indices: [],
          run: () => {
            if (!target) return;
            close();
            window.dispatchEvent(
              new CustomEvent('devblitz:goto-line', {
                detail: { line: target, column: Number.isFinite(column) ? column : 1 },
              })
            );
          },
        },
      ];
    }

    // Files. With no query, show recently used tabs first.
    const openPaths = new Set(openFiles.map((f) => f.path));

    if (!query) {
      const recentRows: Row[] = recentPaths
        .map((path) => openFiles.find((f) => f.path === path))
        .filter((file): file is NonNullable<typeof file> => Boolean(file))
        .map((file) => ({
          key: file.path,
          label: file.name,
          description: 'open editor',
          icon: FileCode,
          indices: [],
          run: () => {
            close();
            setActiveFile(file.path);
          },
        }));

      const fileRows: Row[] = files
        .filter((file) => !openPaths.has(file.path))
        .slice(0, MAX_RESULTS - recentRows.length)
        .map((file) => ({
          key: file.path,
          label: file.name,
          description: file.relativePath,
          icon: FileCode,
          indices: [],
          run: () => {
            close();
            void openFileFromDisk(file.path, file.name, getLanguageFromExtension(file.extension));
          },
        }));

      return [...recentRows, ...fileRows];
    }

    return fuzzyRank(query, files, (f) => f.relativePath, MAX_RESULTS).map(({ item, indices }) => {
      // Highlight indices are relative to the full path; shift them to the name.
      const nameStart = item.relativePath.length - item.name.length;
      return {
        key: item.path,
        label: item.name,
        description: item.relativePath,
        icon: FileCode,
        indices: indices.map((i) => i - nameStart).filter((i) => i >= 0),
        run: () => {
          close();
          void openFileFromDisk(item.path, item.name, getLanguageFromExtension(item.extension));
        },
      };
    });
  }, [
    mode,
    query,
    commands,
    symbols,
    files,
    openFiles,
    recentPaths,
    activeFile,
    close,
    openFileFromDisk,
    setActiveFile,
  ]);

  // Keep the selection valid as results change.
  useEffect(() => {
    setSelectedIndex((current) => (current >= rows.length ? 0 : current));
  }, [rows.length]);

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
      e.preventDefault();
      setSelectedIndex((current) => (rows.length === 0 ? 0 : (current + 1) % rows.length));
      return;
    }

    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
      e.preventDefault();
      setSelectedIndex((current) => (rows.length === 0 ? 0 : (current - 1 + rows.length) % rows.length));
      return;
    }

    if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      setSelectedIndex(Math.max(0, rows.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      rows[selectedIndex]?.run();
    }
  };

  const placeholder =
    mode === 'commands'
      ? 'Type a command name'
      : mode === 'symbols'
        ? 'Type a symbol name'
        : mode === 'line'
          ? 'Type a line number, then Enter'
          : 'Search files by name  (type > for commands, @ for symbols, : for line)';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed left-1/2 top-[12vh] z-50 w-[min(640px,92vw)] -translate-x-1/2',
              'overflow-hidden rounded-xl border border-white/10',
              'bg-[#0b0b0b]/95 shadow-2xl shadow-black/80 backdrop-blur-2xl'
            )}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
              <ModeIcon mode={mode} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                className="h-12 flex-1 bg-transparent text-[14px] text-neutral-100 outline-none placeholder:text-neutral-600"
              />
              {isIndexing && mode === 'files' && (
                <span className="text-[11px] text-neutral-600">indexing…</span>
              )}
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1.5">
              {rows.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-neutral-600">
                  {mode === 'symbols' && !activeFile
                    ? 'Open a file to search its symbols'
                    : 'No matching results'}
                </div>
              ) : (
                rows.map((row, index) => (
                  <button
                    key={row.key}
                    onClick={row.run}
                    onMouseMove={() => setSelectedIndex(index)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-[7px] text-left',
                      index === selectedIndex ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                    )}
                  >
                    <row.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        index === selectedIndex ? 'text-neutral-200' : 'text-neutral-500'
                      )}
                    />

                    <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-200">
                      {segmentMatches(row.label, row.indices).map((segment, i) => (
                        <span
                          key={i}
                          className={segment.matched ? 'font-medium text-blue-300' : undefined}
                        >
                          {segment.text}
                        </span>
                      ))}
                    </span>

                    {row.description && (
                      <span className="max-w-[45%] flex-shrink-0 truncate text-[11px] text-neutral-600">
                        {row.description}
                      </span>
                    )}

                    {row.hint && (
                      <kbd className="flex-shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
                        {row.hint}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 border-t border-white/[0.07] px-4 py-2 text-[11px] text-neutral-600">
              <FooterHint keys="↑↓" label="navigate" />
              <FooterHint keys="↵" label="select" />
              <FooterHint keys="esc" label="dismiss" />
              <span className="ml-auto tabular-nums">{rows.length} results</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FooterHint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">
        {keys}
      </kbd>
      {label}
    </span>
  );
}

function ModeIcon({ mode }: { mode: Mode }) {
  const className = 'h-4 w-4 flex-shrink-0 text-neutral-500';
  if (mode === 'commands') return <ChevronRight className={className} />;
  if (mode === 'symbols') return <Hash className={className} />;
  if (mode === 'line') return <ArrowRight className={className} />;
  return <Search className={className} />;
}

function iconForCommand(command: EditorCommand): React.ComponentType<{ className?: string }> {
  if (command.category === 'Terminal') return TerminalIcon;
  if (command.category === 'File') return FileCode;
  if (command.category === 'Go') return ArrowRight;
  return ChevronRight;
}

function iconForSymbol(kind: SymbolKind): React.ComponentType<{ className?: string }> {
  switch (kind) {
    case 'class':
    case 'interface':
      return Box;
    case 'function':
    case 'method':
      return Braces;
    case 'type':
      return Type;
    case 'heading':
      return Hash;
    default:
      return Variable;
  }
}

export type { DocumentSymbol };
