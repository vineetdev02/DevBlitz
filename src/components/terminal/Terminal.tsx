'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Terminal as TerminalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTerminalStore, useTerminals, useActiveTerminal } from '@/stores/terminalStore';
import { useCurrentProject } from '@/stores/projectStore';
import { executeCommand, getUsername, getHostname } from '@/lib/tauri-commands';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  prompt?: string;
}

export function TerminalPanel() {
  const { isTerminalOpen, terminalHeight, setTerminalHeight, createTerminal } = useTerminalStore();
  const terminals = useTerminals();
  const activeTerminal = useActiveTerminal();
  const currentProject = useCurrentProject();
  const isResizing = useRef(false);

  useEffect(() => {
    if (isTerminalOpen && terminals.length === 0) {
      const cwd = currentProject?.path || '/';
      createTerminal(cwd);
    }
  }, [isTerminalOpen, terminals.length, currentProject?.path, createTerminal]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newHeight = window.innerHeight - e.clientY - 24;
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setTerminalHeight]);

  if (!isTerminalOpen) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: terminalHeight, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col bg-black border-t border-neutral-800"
    >
      <div
        onMouseDown={startResize}
        className="h-1 bg-neutral-800 cursor-row-resize hover:bg-blue-500 transition-colors"
      />
      <TerminalHeader />
      <div className="flex-1 overflow-hidden">
        {activeTerminal ? (
          <TerminalInstance key={activeTerminal.id} cwd={activeTerminal.cwd} />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
            No terminal open
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TerminalHeader() {
  const terminals = useTerminals();
  const { activeTerminalId, setActiveTerminal, closeTerminal, createTerminal, toggleTerminal } = useTerminalStore();
  const currentProject = useCurrentProject();

  return (
    <div className="flex items-center h-[35px] bg-neutral-950 border-b border-neutral-800 px-2">
      <div className="flex items-center gap-1 mr-2 text-xs font-medium">
        <span className="px-2 text-neutral-400 uppercase tracking-wide">Terminal</span>
      </div>

      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
        {terminals.map((term, index) => (
          <div
            key={term.id}
            onClick={() => setActiveTerminal(term.id)}
            className={cn(
              'group flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer',
              'transition-colors duration-100',
              term.id === activeTerminalId
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-500 hover:text-white hover:bg-neutral-800/50'
            )}
          >
            <TerminalIcon className="w-3 h-3" />
            <span>bash {index + 1}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTerminal(term.id);
              }}
              className="p-0.5 hover:bg-neutral-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => currentProject?.path && createTerminal(currentProject.path)}
          className="p-1.5 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          title="New Terminal (Ctrl+Shift+`)"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={toggleTerminal}
          className="p-1.5 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface TerminalInstanceProps {
  cwd: string;
}

function TerminalInstance({ cwd }: TerminalInstanceProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState(cwd);
  const [isExecuting, setIsExecuting] = useState(false);
  const [username, setUsername] = useState('user');
  const [hostname, setHostname] = useState('devblitz');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get user info on mount
  useEffect(() => {
    getUsername().then(setUsername).catch(() => {});
    getHostname().then(setHostname).catch(() => {});
  }, []);

  const prompt = `${username}@${hostname}:${currentDir.replace(/^\/home\/[^/]+/, '~')}$ `;

  const focusInput = () => inputRef.current?.focus();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus on mount
  useEffect(() => {
    focusInput();
  }, []);

  const runCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setLines((prev) => [...prev, { type: 'input', content: cmd, prompt }]);

    const trimmedCmd = cmd.trim();

    // Built-in: clear
    if (trimmedCmd === 'clear') {
      setLines([]);
      return;
    }

    // Built-in: cd
    if (trimmedCmd.startsWith('cd ') || trimmedCmd === 'cd') {
      const arg = trimmedCmd.slice(3).trim() || process.env.HOME || '/';
      let newDir: string;
      
      if (arg.startsWith('/')) {
        newDir = arg;
      } else if (arg === '~') {
        newDir = process.env.HOME || '/home/' + username;
      } else if (arg === '..') {
        newDir = currentDir.split('/').slice(0, -1).join('/') || '/';
      } else {
        newDir = `${currentDir}/${arg}`.replace(/\/+/g, '/');
      }
      
      // Verify directory exists
      try {
        const result = await executeCommand(`cd "${newDir}" && pwd`, currentDir);
        if (result.exitCode === 0) {
          setCurrentDir(result.stdout.trim());
        } else {
          setLines((prev) => [...prev, { type: 'error', content: `cd: ${arg}: No such file or directory` }]);
        }
      } catch {
        setLines((prev) => [...prev, { type: 'error', content: `cd: ${arg}: No such file or directory` }]);
      }
      return;
    }

    // Execute command
    setIsExecuting(true);
    try {
      const result = await executeCommand(trimmedCmd, currentDir);
      
      if (result.stdout) {
        setLines((prev) => [...prev, { type: 'output', content: result.stdout }]);
      }
      if (result.stderr) {
        setLines((prev) => [...prev, { type: 'error', content: result.stderr }]);
      }
    } catch (error) {
      setLines((prev) => [...prev, { 
        type: 'error', 
        content: `Error: ${error instanceof Error ? error.message : 'Command failed'}` 
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      if (isExecuting) {
        setIsExecuting(false);
        setLines((prev) => [...prev, { type: 'error', content: '^C' }]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="h-full overflow-auto p-3 font-mono text-[13px] leading-[1.4] cursor-text bg-black"
    >
      {lines.map((line, index) => (
        <div key={index} className="whitespace-pre-wrap break-all">
          {line.type === 'input' ? (
            <div>
              <span className="text-green-400">{line.prompt}</span>
              <span className="text-white">{line.content}</span>
            </div>
          ) : line.type === 'error' ? (
            <span className="text-red-400">{line.content}</span>
          ) : (
            <span className="text-neutral-300">{line.content}</span>
          )}
        </div>
      ))}

      <div className="flex">
        <span className="text-green-400 whitespace-pre">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          className="flex-1 bg-transparent outline-none text-white caret-white disabled:opacity-50"
          autoFocus
          spellCheck={false}
        />
        {isExecuting && <span className="text-yellow-400 animate-pulse">...</span>}
      </div>
    </div>
  );
}
