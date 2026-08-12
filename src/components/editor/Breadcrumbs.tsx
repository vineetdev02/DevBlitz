'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, FileCode, Folder, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveFile } from '@/stores/editorStore';
import { useCurrentProject } from '@/stores/projectStore';
import { extractSymbols } from '@/lib/symbols';

/**
 * Path + symbol trail above the editor. The last segment is a dropdown of the
 * file's symbols, so it doubles as an outline.
 */
export function Breadcrumbs() {
  const activeFile = useActiveFile();
  const currentProject = useCurrentProject();
  const [isSymbolListOpen, setIsSymbolListOpen] = useState(false);

  const symbols = useMemo(
    () => (activeFile ? extractSymbols(activeFile.content, activeFile.language) : []),
    [activeFile]
  );

  /** The symbol containing the cursor, if any. */
  const currentSymbol = useMemo(() => {
    if (!activeFile || symbols.length === 0) return null;
    const line = activeFile.cursor.line;

    let found = null;
    for (const symbol of symbols) {
      if (symbol.line <= line) found = symbol;
      else break;
    }
    return found;
  }, [activeFile, symbols]);

  if (!activeFile) return null;

  const segments = activeFile.isUntitled
    ? [activeFile.name]
    : buildSegments(activeFile.path, currentProject?.path);

  return (
    <div className="relative flex h-[26px] flex-shrink-0 items-center gap-1 border-b border-white/[0.06] bg-black px-3 text-[12px] text-neutral-500">
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;

        return (
          <React.Fragment key={`${segment}-${index}`}>
            {index > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0 text-neutral-700" />}
            <span
              className={cn(
                'flex items-center gap-1.5 truncate rounded px-1 py-0.5',
                isLast ? 'text-neutral-300' : 'text-neutral-500'
              )}
            >
              {isLast ? (
                <FileCode className="h-3.5 w-3.5 flex-shrink-0 text-neutral-500" />
              ) : (
                <Folder className="h-3.5 w-3.5 flex-shrink-0 text-neutral-600" />
              )}
              {segment}
            </span>
          </React.Fragment>
        );
      })}

      {symbols.length > 0 && (
        <>
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-neutral-700" />
          <button
            onClick={() => setIsSymbolListOpen((open) => !open)}
            className={cn(
              'flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors',
              'hover:bg-white/[0.06] hover:text-neutral-200',
              isSymbolListOpen && 'bg-white/[0.06] text-neutral-200'
            )}
          >
            <Hash className="h-3.5 w-3.5 text-neutral-600" />
            {currentSymbol?.name ?? 'Symbols'}
          </button>
        </>
      )}

      {isSymbolListOpen && (
        <>
          {/* Click-away layer */}
          <div className="fixed inset-0 z-30" onClick={() => setIsSymbolListOpen(false)} />

          <div
            className={cn(
              'absolute left-3 top-[26px] z-40 max-h-72 w-72 overflow-y-auto rounded-md py-1',
              'border border-white/10 bg-[#0d0d0d]/97 shadow-2xl shadow-black/70 backdrop-blur-xl'
            )}
          >
            {symbols.map((symbol) => (
              <button
                key={`${symbol.line}-${symbol.name}`}
                onClick={() => {
                  setIsSymbolListOpen(false);
                  window.dispatchEvent(
                    new CustomEvent('devblitz:goto-line', { detail: { line: symbol.line, column: 1 } })
                  );
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1 text-left text-[12px] transition-colors',
                  'hover:bg-white/[0.07]',
                  symbol === currentSymbol ? 'text-blue-300' : 'text-neutral-300'
                )}
                style={{ paddingLeft: 12 + symbol.depth * 10 }}
              >
                <span className="truncate">{symbol.name}</span>
                <span className="ml-auto flex-shrink-0 text-[10px] text-neutral-600">{symbol.line}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Project-relative path segments, capped so long paths stay readable. */
function buildSegments(filePath: string, projectPath?: string): string[] {
  const relative =
    projectPath && filePath.startsWith(projectPath)
      ? filePath.slice(projectPath.length).replace(/^[/\\]/, '')
      : filePath;

  const parts = relative.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 4) return parts;

  return ['…', ...parts.slice(-3)];
}
