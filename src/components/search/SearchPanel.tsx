'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  FileCode,
  Replace,
  CaseSensitive,
  Regex,
  WholeWord,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/stores/projectStore';

interface SearchResult {
  filePath: string;
  fileName: string;
  matches: {
    line: number;
    column: number;
    text: string;
    matchStart: number;
    matchEnd: number;
  }[];
}

/**
 * VS Code-style search panel
 */
export function SearchPanel() {
  const currentProject = useCurrentProject();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  
  // Search options
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Perform search (mock for now)
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || !currentProject) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock results for demonstration
    const mockResults: SearchResult[] = [
      {
        filePath: `${currentProject.path}/src/App.tsx`,
        fileName: 'App.tsx',
        matches: [
          { line: 15, column: 8, text: `  const ${searchQuery} = useState();`, matchStart: 8, matchEnd: 8 + searchQuery.length },
          { line: 42, column: 12, text: `    return <${searchQuery} />`, matchStart: 12, matchEnd: 12 + searchQuery.length },
        ],
      },
      {
        filePath: `${currentProject.path}/src/components/Header.tsx`,
        fileName: 'Header.tsx',
        matches: [
          { line: 7, column: 4, text: `  // ${searchQuery} component`, matchStart: 5, matchEnd: 5 + searchQuery.length },
        ],
      },
    ];

    setResults(mockResults);
    // Auto-expand all results
    setExpandedFiles(new Set(mockResults.map((r) => r.filePath)));
    setIsSearching(false);
  }, [searchQuery, currentProject]);

  // Search on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  // Toggle file expansion
  const toggleFile = (filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Search inputs */}
      <div className="p-3 space-y-2 border-b border-border">
        {/* Search row */}
        <div className="flex items-center gap-2">
          {/* Toggle replace */}
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={cn(
              'w-5 h-5 flex items-center justify-center rounded',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'transition-colors duration-150'
            )}
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform', showReplace && 'rotate-90')} />
          </button>

          {/* Search input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search"
              className={cn(
                'w-full h-8 pl-8 pr-20 rounded-md text-sm',
                'bg-card border border-border',
                'focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring',
                'placeholder:text-muted-foreground/50'
              )}
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            
            {/* Search options */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <OptionButton
                active={caseSensitive}
                onClick={() => setCaseSensitive(!caseSensitive)}
                title="Match Case"
              >
                <CaseSensitive className="w-3.5 h-3.5" />
              </OptionButton>
              <OptionButton
                active={wholeWord}
                onClick={() => setWholeWord(!wholeWord)}
                title="Match Whole Word"
              >
                <WholeWord className="w-3.5 h-3.5" />
              </OptionButton>
              <OptionButton
                active={useRegex}
                onClick={() => setUseRegex(!useRegex)}
                title="Use Regular Expression"
              >
                <Regex className="w-3.5 h-3.5" />
              </OptionButton>
            </div>
          </div>
        </div>

        {/* Replace row */}
        <AnimatePresence>
          {showReplace && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-5" />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Replace"
                  className={cn(
                    'w-full h-8 pl-8 pr-3 rounded-md text-sm',
                    'bg-card border border-border',
                    'focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring',
                    'placeholder:text-muted-foreground/50'
                  )}
                />
                <Replace className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Files to include/exclude */}
        <div className="flex items-center gap-2 text-xs">
          <button
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'transition-colors duration-150'
            )}
          >
            <FolderOpen className="w-3 h-3" />
            <span>files to include</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {/* Status bar */}
        {searchQuery && (
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b border-border">
            <span>
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Searching...
                </span>
              ) : results.length > 0 ? (
                `${totalMatches} results in ${results.length} files`
              ) : (
                'No results found'
              )}
            </span>
            {results.length > 0 && (
              <button
                onClick={clearSearch}
                className="hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Results list */}
        <div className="py-1">
          <AnimatePresence>
            {results.map((result) => (
              <motion.div
                key={result.filePath}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* File header */}
                <button
                  onClick={() => toggleFile(result.filePath)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5',
                    'text-sm text-left hover:bg-accent/50',
                    'transition-colors duration-150'
                  )}
                >
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform',
                      expandedFiles.has(result.filePath) && 'rotate-90'
                    )}
                  />
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">{result.fileName}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                    {result.matches.length}
                  </span>
                </button>

                {/* Matches */}
                <AnimatePresence>
                  {expandedFiles.has(result.filePath) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {result.matches.map((match, index) => (
                        <button
                          key={`${result.filePath}-${match.line}-${index}`}
                          className={cn(
                            'w-full flex items-start gap-2 px-3 py-1 pl-10',
                            'text-xs text-left hover:bg-accent/50',
                            'transition-colors duration-150'
                          )}
                        >
                          <span className="text-muted-foreground w-8 text-right flex-shrink-0">
                            {match.line}
                          </span>
                          <span className="font-mono truncate">
                            {match.text.slice(0, match.matchStart)}
                            <mark className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
                              {match.text.slice(match.matchStart, match.matchEnd)}
                            </mark>
                            {match.text.slice(match.matchEnd)}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {!searchQuery && (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Search className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm">Search in files</p>
            <p className="text-xs mt-1 opacity-60">Type to start searching</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Search option toggle button
 */
function OptionButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-5 h-5 flex items-center justify-center rounded',
        'transition-colors duration-150',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {children}
    </button>
  );
}

