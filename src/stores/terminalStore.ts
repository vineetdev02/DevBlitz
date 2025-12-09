'use client';

import { create } from 'zustand';

export interface TerminalInstance {
  id: string;
  name: string;
  cwd: string;
  output: string[];
  isActive: boolean;
}

interface TerminalState {
  terminals: TerminalInstance[];
  activeTerminalId: string | null;
  isTerminalOpen: boolean;
  terminalHeight: number;
  
  // Actions
  createTerminal: (cwd: string) => string;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  appendOutput: (id: string, output: string) => void;
  clearOutput: (id: string) => void;
  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;
  setTerminalHeight: (height: number) => void;
}

let terminalCounter = 0;

export const useTerminalStore = create<TerminalState>((set, get) => ({
  terminals: [],
  activeTerminalId: null,
  isTerminalOpen: false,
  terminalHeight: 250,

  createTerminal: (cwd) => {
    terminalCounter++;
    const id = `terminal-${terminalCounter}`;
    const newTerminal: TerminalInstance = {
      id,
      name: `bash`,
      cwd,
      output: [],
      isActive: true,
    };

    set((state) => ({
      terminals: [...state.terminals.map(t => ({ ...t, isActive: false })), newTerminal],
      activeTerminalId: id,
      isTerminalOpen: true,
    }));

    return id;
  },

  closeTerminal: (id) => {
    const { terminals, activeTerminalId } = get();
    const newTerminals = terminals.filter((t) => t.id !== id);
    
    let newActiveId = activeTerminalId;
    if (activeTerminalId === id) {
      newActiveId = newTerminals.length > 0 ? newTerminals[newTerminals.length - 1].id : null;
    }

    set({
      terminals: newTerminals,
      activeTerminalId: newActiveId,
      isTerminalOpen: newTerminals.length > 0,
    });
  },

  setActiveTerminal: (id) => {
    set((state) => ({
      terminals: state.terminals.map((t) => ({ ...t, isActive: t.id === id })),
      activeTerminalId: id,
    }));
  },

  appendOutput: (id, output) => {
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, output: [...t.output, output] } : t
      ),
    }));
  },

  clearOutput: (id) => {
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, output: [] } : t
      ),
    }));
  },

  toggleTerminal: () => {
    const { isTerminalOpen, terminals } = get();
    if (!isTerminalOpen && terminals.length === 0) {
      // Will create terminal from component
      set({ isTerminalOpen: true });
    } else {
      set({ isTerminalOpen: !isTerminalOpen });
    }
  },

  setTerminalOpen: (open) => set({ isTerminalOpen: open }),
  
  setTerminalHeight: (height) => set({ terminalHeight: Math.max(100, Math.min(500, height)) }),
}));

export const useTerminals = () => useTerminalStore((state) => state.terminals);
export const useActiveTerminal = () => {
  const terminals = useTerminalStore((state) => state.terminals);
  const activeId = useTerminalStore((state) => state.activeTerminalId);
  return terminals.find((t) => t.id === activeId) || null;
};
export const useIsTerminalOpen = () => useTerminalStore((state) => state.isTerminalOpen);



