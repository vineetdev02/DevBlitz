'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Command, FileCode2, FolderOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOKEN_COLORS, tokenizeDocument, getCommentTokens, type Token } from '@/lib/highlight';
import {
  BRACKET_PAIRS,
  CLOSE_BRACKETS,
  OPEN_BRACKETS,
  QUOTE_CHARS,
  copyLinesEdit,
  deleteLinesEdit,
  findMatches,
  findMatchingBracket,
  indentEdit,
  insertLineEdit,
  moveLinesEdit,
  newlineEdit,
  offsetToPosition,
  outdentEdit,
  positionToOffset,
  smartHomeOffset,
  toggleCommentEdit,
  type FindMatch,
  type Selection,
  type TextEdit,
} from '@/lib/editor-utils';
import { useActiveFile, useEditorStore } from '@/stores/editorStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { Minimap } from './Minimap';
import { FindWidget, type FindOptions } from './FindWidget';

/** Space above the first line and below the last, in pixels. */
const TOP_PAD = 8;
const BOTTOM_PAD = 120;
/** Documents larger than this are shown unhighlighted to stay responsive. */
const MAX_HIGHLIGHT_LENGTH = 400_000;

type DecorationKind = 'match' | 'currentMatch' | 'bracket';

interface Decoration {
  start: number;
  end: number;
  kind: DecorationKind;
}

export function CodeEditor() {
  const activeFile = useActiveFile();
  const { updateFileContent, setCursor, setScrollTop, saveActiveFile } = useEditorStore();
  const { fontSize, tabSize, wordWrap, minimap, lineNumbers } = useSettingsStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setLocalScrollTop] = useState(0);
  const [viewport, setViewport] = useState({ height: 0, contentHeight: 0 });

  // Find & replace state
  const [findOpen, setFindOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [findOptions, setFindOptions] = useState<FindOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });
  const [matchIndex, setMatchIndex] = useState(0);
  const [bracketMatch, setBracketMatch] = useState<{ open: number; close: number } | null>(null);

  const content = activeFile?.content ?? '';
  const language = activeFile?.language ?? 'plaintext';
  const path = activeFile?.path ?? '';

  const lineHeight = Math.round(fontSize * 1.55);
  const charWidth = fontSize * 0.6;

  const lines = useMemo(
    () =>
      content.length > MAX_HIGHLIGHT_LENGTH
        ? content.split('\n').map((line): Token[] => (line ? [{ type: 'plain', value: line }] : []))
        : tokenizeDocument(content, language),
    [content, language]
  );

  const gutterWidth = lineNumbers
    ? Math.max(String(lines.length).length, 2) * charWidth + 30
    : 12;

  const matches = useMemo(
    () => (findOpen && query ? findMatches(content, query, findOptions) : []),
    [findOpen, query, content, findOptions]
  );

  // Keep the active match in range when the query or document changes.
  useEffect(() => {
    setMatchIndex((current) => (matches.length === 0 ? 0 : Math.min(current, matches.length - 1)));
  }, [matches.length]);

  /** Decorations grouped by 1-based line number. */
  const decorationsByLine = useMemo(() => {
    const map = new Map<number, Decoration[]>();

    const add = (start: number, end: number, kind: DecorationKind) => {
      const position = offsetToPosition(content, start);
      const existing = map.get(position.line) ?? [];
      existing.push({ start, end, kind });
      map.set(position.line, existing);
    };

    matches.forEach((match, index) => {
      add(match.start, match.end, index === matchIndex ? 'currentMatch' : 'match');
    });

    if (bracketMatch) {
      add(bracketMatch.open, bracketMatch.open + 1, 'bracket');
      add(bracketMatch.close, bracketMatch.close + 1, 'bracket');
    }

    return map;
  }, [matches, matchIndex, bracketMatch, content]);

  /** Offsets at which each line starts - needed to place decorations. */
  const lineStartOffsets = useMemo(() => {
    const starts: number[] = [0];
    for (let i = 0; i < content.length; i += 1) {
      if (content[i] === '\n') starts.push(i + 1);
    }
    return starts;
  }, [content]);

  const cursorLine = activeFile?.cursor.line ?? 1;

  /** Push the current textarea selection into the store and update brackets. */
  const syncCursor = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !path) return;

    const { selectionStart, selectionEnd } = textarea;
    const position = offsetToPosition(textarea.value, selectionStart);
    const selected = textarea.value.slice(selectionStart, selectionEnd);

    setCursor(path, {
      line: position.line,
      column: position.column,
      selectionLength: selectionEnd - selectionStart,
      selectedLines: selected.length === 0 ? 0 : selected.split('\n').length,
    });

    setBracketMatch(findMatchingBracket(textarea.value, selectionStart));
  }, [path, setCursor]);

  /**
   * Apply an edit through the browser's own editing pipeline so that native
   * undo/redo (Ctrl+Z) keeps working - a plain value assignment would wipe the
   * undo stack.
   */
  const applyEdit = useCallback(
    (edit: TextEdit) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(edit.start, edit.end);

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, edit.text);
      } catch {
        inserted = false;
      }

      if (!inserted) {
        // Fallback for engines that reject execCommand.
        textarea.setRangeText(edit.text, edit.start, edit.end, 'end');
      }

      textarea.setSelectionRange(edit.selection.start, edit.selection.end);
      updateFileContent(path, textarea.value);
      syncCursor();
    },
    [path, updateFileContent, syncCursor]
  );

  const selectionOf = (textarea: HTMLTextAreaElement): Selection => ({
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
  });

  /** Scroll a document offset into view and select it. */
  const revealMatch = useCallback(
    (match: FindMatch) => {
      const textarea = textareaRef.current;
      const scroller = scrollerRef.current;
      if (!textarea || !scroller) return;

      textarea.focus();
      textarea.setSelectionRange(match.start, match.end);

      const targetTop = (match.line - 1) * lineHeight + TOP_PAD;
      const viewTop = scroller.scrollTop;
      const viewBottom = viewTop + scroller.clientHeight;

      if (targetTop < viewTop + lineHeight * 2 || targetTop > viewBottom - lineHeight * 3) {
        scroller.scrollTop = Math.max(0, targetTop - scroller.clientHeight / 2);
      }

      syncCursor();
    },
    [lineHeight, syncCursor]
  );

  const goToMatch = useCallback(
    (direction: 1 | -1) => {
      if (matches.length === 0) return;
      const next = (matchIndex + direction + matches.length) % matches.length;
      const match = matches[next];
      if (!match) return;

      setMatchIndex(next);
      revealMatch(match);
    },
    [matches, matchIndex, revealMatch]
  );

  const replaceCurrent = useCallback(() => {
    const match = matches[Math.min(matchIndex, matches.length - 1)];
    if (!match) return;

    applyEdit({
      start: match.start,
      end: match.end,
      text: replacement,
      selection: {
        start: match.start + replacement.length,
        end: match.start + replacement.length,
      },
    });
  }, [matches, matchIndex, replacement, applyEdit]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0) return;

    // Rebuild the document in one edit so undo reverts the whole operation.
    let next = '';
    let cursor = 0;
    for (const match of matches) {
      next += content.slice(cursor, match.start) + replacement;
      cursor = match.end;
    }
    next += content.slice(cursor);

    applyEdit({
      start: 0,
      end: content.length,
      text: next,
      selection: { start: 0, end: 0 },
    });
  }, [matches, content, replacement, applyEdit]);

  const openFind = useCallback(
    (withReplace: boolean) => {
      const textarea = textareaRef.current;
      const selected = textarea
        ? textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
        : '';

      // Seed the query from the selection, the way every editor does.
      if (selected && !selected.includes('\n')) setQuery(selected);

      setShowReplace(withReplace);
      setFindOpen(true);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const selection = selectionOf(textarea);
      const value = textarea.value;
      const mod = e.ctrlKey || e.metaKey;

      // --- Editor commands -------------------------------------------------
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActiveFile();
        return;
      }

      if (mod && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        openFind(false);
        return;
      }

      if (mod && e.key.toLowerCase() === 'h' && !e.shiftKey) {
        e.preventDefault();
        openFind(true);
        return;
      }

      if (e.key === 'Escape' && findOpen) {
        e.preventDefault();
        setFindOpen(false);
        return;
      }

      if (e.key === 'F3' || (mod && e.key.toLowerCase() === 'g' && !e.shiftKey && findOpen)) {
        e.preventDefault();
        goToMatch(e.shiftKey ? -1 : 1);
        return;
      }

      // Toggle line comment
      if (mod && e.key === '/') {
        e.preventDefault();
        const edit = toggleCommentEdit(value, selection, getCommentTokens(language));
        if (edit) applyEdit(edit);
        return;
      }

      // Indent / outdent
      if (e.key === 'Tab') {
        e.preventDefault();
        applyEdit(
          e.shiftKey
            ? outdentEdit(value, selection, tabSize)
            : indentEdit(value, selection, tabSize)
        );
        return;
      }

      if (mod && (e.key === ']' || e.key === '[')) {
        e.preventDefault();
        applyEdit(
          e.key === ']'
            ? indentEdit(value, { start: selection.start, end: Math.max(selection.end, selection.start + 1) }, tabSize)
            : outdentEdit(value, selection, tabSize)
        );
        return;
      }

      // Move / copy / delete lines
      if (e.altKey && !e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const edit = e.shiftKey
          ? copyLinesEdit(value, selection, direction)
          : moveLinesEdit(value, selection, direction);
        if (edit) applyEdit(edit);
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        applyEdit(deleteLinesEdit(value, selection));
        return;
      }

      // Insert line above / below without splitting the current one
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        applyEdit(insertLineEdit(value, selection, e.shiftKey ? -1 : 1, tabSize));
        return;
      }

      // Smart home
      if (e.key === 'Home' && !mod) {
        e.preventDefault();
        const target = smartHomeOffset(value, selection.start);
        textarea.setSelectionRange(e.shiftKey ? selection.end : target, target);
        syncCursor();
        return;
      }

      // --- Typing aids -----------------------------------------------------
      if (e.key === 'Enter' && !e.shiftKey && !mod) {
        e.preventDefault();
        applyEdit(newlineEdit(value, selection, tabSize));
        return;
      }

      // Auto-close brackets and quotes
      if (OPEN_BRACKETS.includes(e.key) || QUOTE_CHARS.includes(e.key)) {
        const closing = BRACKET_PAIRS[e.key] ?? e.key;
        const nextChar = value[selection.end] ?? '';
        const hasSelection = selection.end > selection.start;

        // Wrap a selection in the pair rather than replacing it.
        if (hasSelection) {
          e.preventDefault();
          const selected = value.slice(selection.start, selection.end);
          applyEdit({
            start: selection.start,
            end: selection.end,
            text: `${e.key}${selected}${closing}`,
            selection: { start: selection.start + 1, end: selection.end + 1 },
          });
          return;
        }

        // Don't auto-close a quote in the middle of a word (e.g. `don't`).
        const isQuote = QUOTE_CHARS.includes(e.key);
        const prevChar = value[selection.start - 1] ?? '';
        const insideWord = /[A-Za-z0-9_]/.test(nextChar) || (isQuote && /[A-Za-z0-9_]/.test(prevChar));

        if (!insideWord) {
          e.preventDefault();
          applyEdit({
            start: selection.start,
            end: selection.end,
            text: `${e.key}${closing}`,
            selection: { start: selection.start + 1, end: selection.start + 1 },
          });
          return;
        }
      }

      // Type over an auto-inserted closing character
      if ((CLOSE_BRACKETS.includes(e.key) || QUOTE_CHARS.includes(e.key)) && selection.start === selection.end) {
        if (value[selection.start] === e.key) {
          e.preventDefault();
          textarea.setSelectionRange(selection.start + 1, selection.start + 1);
          syncCursor();
          return;
        }
      }

      // Backspace removes both halves of an empty pair, or a whole indent step
      if (e.key === 'Backspace' && selection.start === selection.end && selection.start > 0) {
        const before = value[selection.start - 1] ?? '';
        const after = value[selection.start] ?? '';
        const closing = BRACKET_PAIRS[before];

        if ((closing && closing === after) || (before !== '' && QUOTE_CHARS.includes(before) && before === after)) {
          e.preventDefault();
          applyEdit({
            start: selection.start - 1,
            end: selection.start + 1,
            text: '',
            selection: { start: selection.start - 1, end: selection.start - 1 },
          });
          return;
        }

        const lineStart = value.lastIndexOf('\n', selection.start - 1) + 1;
        const beforeCursor = value.slice(lineStart, selection.start);
        if (beforeCursor.length > 0 && /^ +$/.test(beforeCursor)) {
          const remove = beforeCursor.length % tabSize || tabSize;
          e.preventDefault();
          applyEdit({
            start: selection.start - remove,
            end: selection.start,
            text: '',
            selection: { start: selection.start - remove, end: selection.start - remove },
          });
          return;
        }
      }
    },
    [
      applyEdit,
      findOpen,
      goToMatch,
      language,
      openFind,
      saveActiveFile,
      syncCursor,
      tabSize,
    ]
  );

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    setLocalScrollTop(scroller.scrollTop);
    setViewport({ height: scroller.clientHeight, contentHeight: scroller.scrollHeight });
  }, []);

  // Restore scroll position when switching tabs.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !activeFile) return;

    scroller.scrollTop = activeFile.scrollTop;
    setLocalScrollTop(activeFile.scrollTop);
    setViewport({ height: scroller.clientHeight, contentHeight: scroller.scrollHeight });
    // Only when the tab itself changes - not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  // Remember the scroll position of the tab being left behind.
  useEffect(() => {
    if (!path) return;
    const persist = () => setScrollTop(path, scrollerRef.current?.scrollTop ?? 0);
    return persist;
  }, [path, setScrollTop]);

  // Go to Line / Go to Symbol, dispatched by the command palette.
  useEffect(() => {
    const handler = (event: Event) => {
      const { line, column } = (event as CustomEvent<{ line: number; column: number }>).detail;
      const textarea = textareaRef.current;
      const scroller = scrollerRef.current;
      if (!textarea || !scroller) return;

      const offset = positionToOffset(textarea.value, line, column);
      textarea.focus();
      textarea.setSelectionRange(offset, offset);

      // Put the target line a third of the way down the viewport.
      const targetTop = (line - 1) * lineHeight + TOP_PAD;
      scroller.scrollTop = Math.max(0, targetTop - scroller.clientHeight / 3);
      syncCursor();
    };

    window.addEventListener('devblitz:goto-line', handler);
    return () => window.removeEventListener('devblitz:goto-line', handler);
  }, [lineHeight, syncCursor]);

  // Track the viewport so the minimap knows how big the thumb should be.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () =>
      setViewport({ height: scroller.clientHeight, contentHeight: scroller.scrollHeight });

    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [content, wordWrap, fontSize]);

  if (!activeFile) {
    return <EditorWelcome />;
  }

  return (
    <div className="relative flex h-full min-h-0 bg-black">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className={cn(
          'relative flex-1 overflow-auto',
          wordWrap ? 'overflow-x-hidden' : 'overflow-x-auto'
        )}
      >
        <div
          className={cn('relative', wordWrap ? 'w-full' : 'w-max min-w-full')}
          style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}
        >
          {/* Rendered, highlighted text. The textarea sits transparently on top. */}
          <div
            aria-hidden
            className="font-mono"
            // tabSize must match the textarea exactly or tab-indented files drift
            style={{ fontSize, lineHeight: `${lineHeight}px`, tabSize }}
          >
            {lines.map((tokens, index) => {
              const lineNumber = index + 1;
              const isActive = lineNumber === cursorLine;

              return (
                <div
                  key={lineNumber}
                  className={cn('flex', isActive && 'bg-white/[0.045]')}
                  style={{ minHeight: lineHeight }}
                >
                  {lineNumbers && (
                    <div
                      className={cn(
                        'sticky left-0 z-10 flex-shrink-0 select-none pr-4 text-right tabular-nums',
                        isActive ? 'bg-[#0b0b0b] text-neutral-300' : 'bg-black text-neutral-600'
                      )}
                      style={{ width: gutterWidth }}
                    >
                      {lineNumber}
                    </div>
                  )}

                  <div
                    className={cn(
                      'flex-1',
                      wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                    )}
                  >
                    <LineContent
                      tokens={tokens}
                      lineStart={lineStartOffsets[index] ?? 0}
                      decorations={decorationsByLine.get(lineNumber)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* The real editing surface: transparent text over the rendered layer. */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => updateFileContent(path, e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={syncCursor}
            onClick={syncCursor}
            onSelect={syncCursor}
            onFocus={syncCursor}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            // Marks this as the editing surface so global shortcuts still apply.
            data-editor-surface="true"
            wrap={wordWrap ? 'soft' : 'off'}
            className={cn(
              'absolute resize-none border-0 bg-transparent p-0 font-mono outline-none',
              'text-transparent caret-white selection:bg-[#264f78]/70',
              'overflow-hidden'
            )}
            style={{
              top: TOP_PAD,
              bottom: BOTTOM_PAD,
              left: gutterWidth,
              right: 0,
              fontSize,
              lineHeight: `${lineHeight}px`,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              // Mirrors the rendered layer's `break-words` (overflow-wrap),
              // not word-break - the two wrap at different points.
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              wordBreak: 'normal',
              tabSize,
            }}
          />
        </div>
      </div>

      {minimap && lines.length > 0 && (
        <Minimap
          lines={lines}
          scrollTop={scrollTop}
          viewportHeight={viewport.height}
          contentHeight={viewport.contentHeight}
          onScrollTo={(value) => {
            if (scrollerRef.current) scrollerRef.current.scrollTop = value;
          }}
        />
      )}

      {findOpen && (
        <FindWidget
          query={query}
          replacement={replacement}
          options={findOptions}
          matchCount={matches.length}
          currentMatch={matches.length === 0 ? 0 : matchIndex + 1}
          showReplace={showReplace}
          onQueryChange={setQuery}
          onReplacementChange={setReplacement}
          onOptionsChange={setFindOptions}
          onToggleReplace={() => setShowReplace((value) => !value)}
          onNext={() => goToMatch(1)}
          onPrevious={() => goToMatch(-1)}
          onReplace={replaceCurrent}
          onReplaceAll={replaceAll}
          onClose={() => {
            setFindOpen(false);
            textareaRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

/**
 * Render one line's tokens, splitting them where search matches or bracket
 * highlights need their own background.
 */
const LineContent = React.memo(function LineContent({
  tokens,
  lineStart,
  decorations,
}: {
  tokens: Token[];
  lineStart: number;
  decorations?: Decoration[];
}) {
  if (tokens.length === 0) {
    // Keep empty lines selectable and the right height.
    return <span>{'​'}</span>;
  }

  if (!decorations || decorations.length === 0) {
    return (
      <>
        {tokens.map((token, index) => (
          <span key={index} style={{ color: TOKEN_COLORS[token.type] }}>
            {token.value}
          </span>
        ))}
      </>
    );
  }

  const pieces: React.ReactNode[] = [];
  let offset = lineStart;

  tokens.forEach((token, tokenIndex) => {
    const tokenStart = offset;
    const tokenEnd = offset + token.value.length;
    offset = tokenEnd;

    // Boundaries inside this token where decoration state changes.
    const cuts = new Set<number>([tokenStart, tokenEnd]);
    for (const decoration of decorations) {
      if (decoration.start > tokenStart && decoration.start < tokenEnd) cuts.add(decoration.start);
      if (decoration.end > tokenStart && decoration.end < tokenEnd) cuts.add(decoration.end);
    }

    const sorted = Array.from(cuts).sort((a, b) => a - b);

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const start = sorted[i];
      const end = sorted[i + 1];
      if (start === undefined || end === undefined) continue;

      const value = token.value.slice(start - tokenStart, end - tokenStart);
      if (!value) continue;

      const decoration = decorations.find((d) => d.start <= start && d.end >= end);

      pieces.push(
        <span
          key={`${tokenIndex}-${start}`}
          className={cn(
            decoration?.kind === 'currentMatch' && 'rounded-sm bg-[#f0a35e]/70 text-black',
            decoration?.kind === 'match' && 'rounded-sm bg-[#623315]',
            decoration?.kind === 'bracket' && 'rounded-sm bg-white/15 outline outline-1 outline-white/30'
          )}
          style={{ color: decoration?.kind === 'currentMatch' ? undefined : TOKEN_COLORS[token.type] }}
        >
          {value}
        </span>
      );
    }
  });

  return <>{pieces}</>;
});

function EditorWelcome() {
  const { setCommandPaletteOpen, setQuickOpenOpen } = useAppStore();

  const shortcuts = [
    { icon: FolderOpen, label: 'Open Folder', keys: 'Ctrl+O' },
    { icon: Search, label: 'Go to File', keys: 'Ctrl+P', action: () => setQuickOpenOpen(true) },
    { icon: Command, label: 'Command Palette', keys: 'Ctrl+Shift+P', action: () => setCommandPaletteOpen(true) },
  ];

  return (
    <div className="flex h-full flex-1 items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm px-8 text-center"
      >
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent">
          <FileCode2 className="h-8 w-8 text-neutral-500" />
        </div>

        <h2 className="mb-1 text-lg font-medium text-neutral-200">No file open</h2>
        <p className="mb-8 text-sm text-neutral-500">
          Pick a file from the explorer, or jump straight to one.
        </p>

        <div className="space-y-1">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.label}
              onClick={shortcut.action}
              disabled={!shortcut.action}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px]',
                'text-neutral-400 transition-colors',
                shortcut.action ? 'hover:bg-white/5 hover:text-neutral-200' : 'cursor-default'
              )}
            >
              <shortcut.icon className="h-4 w-4 text-neutral-600" />
              <span className="flex-1">{shortcut.label}</span>
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
                {shortcut.keys}
              </kbd>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
