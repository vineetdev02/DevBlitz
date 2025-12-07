'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Keyboard, Info, Monitor, 
  Search, RotateCcw, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore, KeyBinding } from '@/stores/settingsStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { activeSettingsTab, setActiveSettingsTab } = useSettingsStore();

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'editor' as const, label: 'Editor', icon: Monitor },
    { id: 'keybindings' as const, label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-[900px] h-[600px] bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar */}
            <div className="w-[200px] bg-neutral-900 border-r border-neutral-800 p-2">
              <div className="flex items-center justify-between px-2 py-3 mb-2">
                <span className="text-sm font-medium text-neutral-200">Settings</span>
              </div>
              
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                    'transition-colors duration-100',
                    activeSettingsTab === tab.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <h2 className="text-sm font-medium text-neutral-200">
                  {tabs.find((t) => t.id === activeSettingsTab)?.label}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-auto p-4">
                {activeSettingsTab === 'general' && <GeneralSettings />}
                {activeSettingsTab === 'editor' && <EditorSettings />}
                {activeSettingsTab === 'keybindings' && <KeybindingsSettings />}
                {activeSettingsTab === 'about' && <AboutSettings />}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GeneralSettings() {
  const { theme, setTheme } = useSettingsStore();

  return (
    <div className="space-y-6">
      <SettingSection title="Appearance">
        <SettingRow label="Theme" description="Select the color theme for the editor">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-neutral-500"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </SettingRow>
      </SettingSection>
    </div>
  );
}

function EditorSettings() {
  const { 
    fontSize, setFontSize,
    tabSize, setTabSize,
    wordWrap, setWordWrap,
    lineNumbers, setLineNumbers,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <SettingSection title="Font">
        <SettingRow label="Font Size" description="Controls the font size in pixels">
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            min={10}
            max={24}
            className="w-20 bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-neutral-500"
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Formatting">
        <SettingRow label="Tab Size" description="The number of spaces a tab is equal to">
          <select
            value={tabSize}
            onChange={(e) => setTabSize(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1.5 text-sm text-neutral-200 outline-none focus:border-neutral-500"
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </SettingRow>

        <SettingRow label="Word Wrap" description="Controls how lines should wrap">
          <Toggle checked={wordWrap} onChange={setWordWrap} />
        </SettingRow>

        <SettingRow label="Line Numbers" description="Controls the display of line numbers">
          <Toggle checked={lineNumbers} onChange={setLineNumbers} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}

function KeybindingsSettings() {
  const { keybindings, updateKeybinding, resetKeybindings } = useSettingsStore();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  const filteredKeybindings = keybindings.filter((kb) =>
    kb.command.toLowerCase().includes(search.toLowerCase()) ||
    kb.keybinding.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent, kb: KeyBinding) => {
    e.preventDefault();
    
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    
    const key = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      keys.push(key.length === 1 ? key.toUpperCase() : key);
    }
    
    if (keys.length > 0) {
      const newKeybinding = keys.join('+');
      setNewKey(newKeybinding);
    }
  };

  const saveKeybinding = (id: string) => {
    if (newKey) {
      updateKeybinding(id, newKey);
    }
    setEditingId(null);
    setNewKey('');
  };

  return (
    <div className="space-y-4">
      {/* Search and reset */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keybindings..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-neutral-200 outline-none focus:border-neutral-500"
          />
        </div>
        <button
          onClick={resetKeybindings}
          className="flex items-center gap-1 px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr,150px,150px] gap-4 px-3 py-2 text-xs font-medium text-neutral-500 uppercase border-b border-neutral-800">
        <span>Command</span>
        <span>Keybinding</span>
        <span>When</span>
      </div>

      {/* Keybindings list */}
      <div className="space-y-1 max-h-[380px] overflow-auto">
        {filteredKeybindings.map((kb) => (
          <div
            key={kb.id}
            className={cn(
              'grid grid-cols-[1fr,150px,150px] gap-4 px-3 py-2 rounded',
              'hover:bg-neutral-900 transition-colors',
              editingId === kb.id && 'bg-neutral-900'
            )}
          >
            <span className="text-sm text-neutral-300">{kb.command}</span>
            
            {editingId === kb.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newKey || kb.keybinding}
                  onKeyDown={(e) => handleKeyDown(e, kb)}
                  placeholder="Press keys..."
                  className="w-full px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-xs text-neutral-200 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveKeybinding(kb.id)}
                  className="p-1 text-green-500 hover:bg-neutral-800 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setEditingId(null); setNewKey(''); }}
                  className="p-1 text-red-500 hover:bg-neutral-800 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingId(kb.id)}
                className="text-left"
              >
                <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300">
                  {kb.keybinding}
                </kbd>
              </button>
            )}
            
            <span className="text-xs text-neutral-500">{kb.when || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutSettings() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
          <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" fill="white" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-1">DevBlitz</h2>
      <p className="text-neutral-500 text-sm mb-4">Version 0.1.0</p>
      <p className="text-neutral-400 text-sm max-w-xs">
        AI-Powered Code IDE built with Tauri, Next.js, and React.
      </p>
    </div>
  );
}

// Helper components
function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-neutral-500 uppercase">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-200">{label}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-10 h-5 rounded-full transition-colors duration-200',
        checked ? 'bg-blue-600' : 'bg-neutral-700'
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded-full bg-white transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

