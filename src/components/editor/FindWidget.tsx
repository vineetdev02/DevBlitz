'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  CaseSensitive,
  ChevronRight,
  Regex,
  Replace,
  ReplaceAll,
  WholeWord,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

interface FindWidgetProps {
  query: string;
  replacement: string;
  options: FindOptions;
  matchCount: number;
  /** 1-based index of the current match, 0 when there is none. */
  currentMatch: number;
  showReplace: boolean;
  onQueryChange: (value: string) => void;
  onReplacementChange: (value: string) => void;
  onOptionsChange: (options: FindOptions) => void;
  onToggleReplace: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export function FindWidget({
  query,
  replacement,
  options,
  matchCount,
  currentMatch,
  showReplace,
  onQueryChange,
  onReplacementChange,
  onOptionsChange,
  onToggleReplace,
  onNext,
  onPrevious,
  onReplace,
  onReplaceAll,
  onClose,
}: FindWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrevious();
      else onNext();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const noResults = query.length > 0 && matchCount === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'absolute right-4 top-2 z-30 flex items-start gap-1 rounded-md p-1.5',
        'border border-white/10 bg-[#0d0d0d]/95 shadow-2xl shadow-black/60 backdrop-blur-xl'
      )}
    >
      {/* Expand toggle for the replace row */}
      <button
        onClick={onToggleReplace}
        className="mt-1 flex h-6 w-5 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
        title={showReplace ? 'Hide Replace' : 'Show Replace'}
      >
        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', showReplace && 'rotate-90')} />
      </button>

      <div className="flex flex-col gap-1">
        {/* Find row */}
        <div
          className={cn(
            'flex items-center gap-1 rounded border bg-black/60 pl-2 pr-1',
            noResults ? 'border-red-500/60' : 'border-white/10 focus-within:border-blue-500/70'
          )}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            spellCheck={false}
            className="h-7 w-56 bg-transparent text-[13px] text-neutral-200 outline-none placeholder:text-neutral-600"
          />

          <span className={cn('mr-1 whitespace-nowrap text-[11px] tabular-nums', noResults ? 'text-red-400' : 'text-neutral-500')}>
            {matchCount > 0 ? `${currentMatch} of ${matchCount}` : 'No results'}
          </span>

          <ToggleButton
            active={options.caseSensitive}
            title="Match Case (Alt+C)"
            onClick={() => onOptionsChange({ ...options, caseSensitive: !options.caseSensitive })}
          >
            <CaseSensitive className="h-3.5 w-3.5" />
          </ToggleButton>

          <ToggleButton
            active={options.wholeWord}
            title="Match Whole Word (Alt+W)"
            onClick={() => onOptionsChange({ ...options, wholeWord: !options.wholeWord })}
          >
            <WholeWord className="h-3.5 w-3.5" />
          </ToggleButton>

          <ToggleButton
            active={options.regex}
            title="Use Regular Expression (Alt+R)"
            onClick={() => onOptionsChange({ ...options, regex: !options.regex })}
          >
            <Regex className="h-3.5 w-3.5" />
          </ToggleButton>
        </div>

        {/* Replace row */}
        {showReplace && (
          <div className="flex items-center gap-1 rounded border border-white/10 bg-black/60 pl-2 pr-1 focus-within:border-blue-500/70">
            <input
              value={replacement}
              onChange={(e) => onReplacementChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onReplace();
                }
                if (e.key === 'Escape') onClose();
              }}
              placeholder="Replace"
              spellCheck={false}
              className="h-7 w-56 bg-transparent text-[13px] text-neutral-200 outline-none placeholder:text-neutral-600"
            />

            <IconButton title="Replace (Enter)" onClick={onReplace} disabled={matchCount === 0}>
              <Replace className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton title="Replace All (Ctrl+Alt+Enter)" onClick={onReplaceAll} disabled={matchCount === 0}>
              <ReplaceAll className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-0.5 flex items-center gap-0.5">
        <IconButton title="Previous Match (Shift+Enter)" onClick={onPrevious} disabled={matchCount === 0}>
          <ArrowUp className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton title="Next Match (Enter)" onClick={onNext} disabled={matchCount === 0}>
          <ArrowDown className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton title="Close (Escape)" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </motion.div>
  );
}

function ToggleButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded transition-colors',
        active ? 'bg-blue-500/25 text-blue-300' : 'text-neutral-500 hover:bg-white/10 hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
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
        'flex h-6 w-6 items-center justify-center rounded transition-colors',
        'text-neutral-400 hover:bg-white/10 hover:text-white',
        'disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent'
      )}
    >
      {children}
    </button>
  );
}
