'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  FileCode,
  Loader2,
  Regex,
  ReplaceAll,
  Search,
  WholeWord,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/stores/projectStore';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { notify } from '@/stores/notificationStore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  replaceInFile,
  searchInFiles,
  type SearchResult,
  type SearchSummary,
} from '@/lib/tauri-commands';

/** Debounce so we don't launch a project walk on every keystroke. */
const SEARCH_DEBOUNCE_MS = 300;

export function SearchPanel() {
  const currentProject = useCurrentProject();
  const openFileFromDisk = useEditorStore((state) => state.openFileFromDisk);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [includePattern, setIncludePattern] = useState('');

  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [isReplacing, setIsReplacing] = useState(false);
  const [confirmReplaceAll, setConfirmReplaceAll] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async () => {
    const basePath = currentProject?.path;
    const trimmed = query.trim();

    if (!basePath || !trimmed) {
      setSummary(null);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchInFiles(basePath, trimmed, {
        caseSensitive,
        wholeWord,
        includePattern: includePattern.trim() || undefined,
      });
      setSummary(result);
      setCollapsedFiles(new Set());
    } catch (err) {
      notify({
        kind: 'error',
        title: 'Search failed',
        detail: err instanceof Error ? err.message : String(err),
      });
      setSummary(null);
    } finally {
      setIsSearching(false);
    }
  }, [currentProject?.path, query, caseSensitive, wholeWord, includePattern]);

  // Re-run as the query or options change.
  useEffect(() => {
    const timer = setTimeout(() => void runSearch(), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [runSearch]);

  const replaceAll = useCallback(async () => {
    const basePath = currentProject?.path;
    if (!basePath || !summary || !query.trim()) return;

    setIsReplacing(true);
    let replaced = 0;

    try {
      for (const result of summary.results) {
        replaced += await replaceInFile(result.path, basePath, query, replacement, caseSensitive);
      }

      notify({
        kind: 'success',
        title: `Replaced ${replaced} occurrence${replaced === 1 ? '' : 's'}`,
        detail: `across ${summary.results.length} file${summary.results.length === 1 ? '' : 's'}`,
      });

      await runSearch();
    } catch (err) {
      notify({
        kind: 'error',
        title: 'Replace failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsReplacing(false);
    }
  }, [currentProject?.path, summary, query, replacement, caseSensitive, runSearch]);

  const toggleFile = (path: string) => {
    setCollapsedFiles((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const resultLabel = useMemo(() => {
    if (!summary) return null;
    if (summary.totalMatches === 0) return 'No results found';

    const files = `${summary.fileCount} file${summary.fileCount === 1 ? '' : 's'}`;
    const matches = `${summary.totalMatches}${summary.truncated ? '+' : ''} result${summary.totalMatches === 1 ? '' : 's'}`;
    return `${matches} in ${files}`;
  }, [summary]);

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <Search className="h-6 w-6 text-neutral-700" />
        <p className="text-[13px] text-neutral-500">Open a folder to search it</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Query controls */}
      <div className="flex gap-1 p-2">
        <button
          onClick={() => setShowReplace((open) => !open)}
          title={showReplace ? 'Hide Replace' : 'Show Replace'}
          className="mt-1 flex h-6 w-4 items-center justify-center self-start rounded text-neutral-500 hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', showReplace && 'rotate-90')} />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1 rounded border border-white/10 bg-black/60 pl-2 pr-1 focus-within:border-blue-500/70">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch();
              }}
              placeholder="Search"
              spellCheck={false}
              className="h-7 min-w-0 flex-1 bg-transparent text-[12px] text-neutral-200 outline-none placeholder:text-neutral-600"
            />

            <OptionToggle
              active={caseSensitive}
              title="Match Case"
              onClick={() => setCaseSensitive((value) => !value)}
            >
              <CaseSensitive className="h-3.5 w-3.5" />
            </OptionToggle>
            <OptionToggle
              active={wholeWord}
              title="Match Whole Word"
              onClick={() => setWholeWord((value) => !value)}
            >
              <WholeWord className="h-3.5 w-3.5" />
            </OptionToggle>
            <OptionToggle active={false} title="Regular expressions are not supported in project search yet" disabled>
              <Regex className="h-3.5 w-3.5" />
            </OptionToggle>
          </div>

          {showReplace && (
            <div className="flex items-center gap-1 rounded border border-white/10 bg-black/60 pl-2 pr-1 focus-within:border-blue-500/70">
              <input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Replace"
                spellCheck={false}
                className="h-7 min-w-0 flex-1 bg-transparent text-[12px] text-neutral-200 outline-none placeholder:text-neutral-600"
              />
              <button
                onClick={() => setConfirmReplaceAll(true)}
                disabled={!summary || summary.totalMatches === 0 || isReplacing}
                title="Replace All"
                className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                {isReplacing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ReplaceAll className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}

          <input
            value={includePattern}
            onChange={(e) => setIncludePattern(e.target.value)}
            placeholder="files to include, e.g. ts, tsx, src/lib"
            spellCheck={false}
            className={cn(
              'h-7 w-full rounded border border-white/10 bg-black/60 px-2',
              'text-[11px] text-neutral-300 outline-none placeholder:text-neutral-700',
              'focus:border-blue-500/70'
            )}
          />
        </div>
      </div>

      {/* Result count */}
      <div className="flex h-6 items-center gap-2 px-3 text-[11px] text-neutral-500">
        {isSearching ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Searching…
          </>
        ) : (
          resultLabel
        )}
        {summary?.truncated && (
          <span className="ml-auto text-amber-500/80">results limited</span>
        )}
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {summary?.results.map((result) => (
          <FileResult
            key={result.path}
            result={result}
            query={query}
            collapsed={collapsedFiles.has(result.path)}
            onToggle={() => toggleFile(result.path)}
            onOpen={(line, column) => {
              const extension = result.name.includes('.') ? result.name.split('.').pop() ?? null : null;
              void openFileFromDisk(result.path, result.name, getLanguageFromExtension(extension)).then(
                () => {
                  // Wait for the tab to mount before jumping to the match.
                  requestAnimationFrame(() =>
                    window.dispatchEvent(
                      new CustomEvent('devblitz:goto-line', { detail: { line, column: column + 1 } })
                    )
                  );
                }
              );
            }}
          />
        ))}
      </div>

      <ConfirmDialog
        open={confirmReplaceAll}
        title={`Replace ${summary?.totalMatches ?? 0} occurrence(s)?`}
        description={`'${query}' will be replaced with '${replacement}' across ${summary?.fileCount ?? 0} file(s) on disk. This cannot be undone.`}
        confirmLabel="Replace All"
        destructive
        onConfirm={() => void replaceAll()}
        onCancel={() => setConfirmReplaceAll(false)}
      />
    </div>
  );
}

function FileResult({
  result,
  query,
  collapsed,
  onToggle,
  onOpen,
}: {
  result: SearchResult;
  query: string;
  collapsed: boolean;
  onToggle: () => void;
  onOpen: (line: number, column: number) => void;
}) {
  const directory = result.relativePath.split('/').slice(0, -1).join('/');

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex h-[22px] w-full items-center gap-1 px-2 text-left hover:bg-white/[0.06]"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-neutral-500" />
        ) : (
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-neutral-500" />
        )}
        <FileCode className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
        <span className="truncate text-[13px] text-neutral-200">{result.name}</span>
        {directory && (
          <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-600">{directory}</span>
        )}
        <span className="ml-auto flex-shrink-0 rounded-full bg-white/[0.08] px-1.5 text-[10px] tabular-nums text-neutral-400">
          {result.matches.length}
        </span>
      </button>

      {!collapsed &&
        result.matches.map((match, index) => (
          <button
            key={`${match.line}-${match.column}-${index}`}
            onClick={() => onOpen(match.line, match.column)}
            title={`Line ${match.line}`}
            className="flex h-[22px] w-full items-center gap-2 pl-7 pr-2 text-left hover:bg-white/[0.06]"
          >
            <span className="w-8 flex-shrink-0 text-right text-[10px] tabular-nums text-neutral-600">
              {match.line}
            </span>
            <span className="truncate font-mono text-[12px] text-neutral-400">
              <MatchText text={match.text} column={match.column} length={query.length} />
            </span>
          </button>
        ))}
    </div>
  );
}

/** Render one result line with the matched span highlighted. */
function MatchText({ text, column, length }: { text: string; column: number; length: number }) {
  // Long lines are trimmed from the left so the match stays visible.
  const offset = column > 40 ? column - 20 : 0;
  const visible = offset > 0 ? `…${text.slice(offset)}` : text;
  const start = offset > 0 ? column - offset + 1 : column;

  return (
    <>
      {visible.slice(0, start)}
      <span className="rounded-sm bg-[#623315] text-neutral-100">
        {visible.slice(start, start + length)}
      </span>
      {visible.slice(start + length)}
    </>
  );
}

function OptionToggle({
  active,
  title,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded transition-colors',
        active ? 'bg-blue-500/25 text-blue-300' : 'text-neutral-500 hover:bg-white/10 hover:text-white',
        disabled && 'cursor-default opacity-30 hover:bg-transparent'
      )}
    >
      {children}
    </button>
  );
}
