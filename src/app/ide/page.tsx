'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { EditorTabs, CodeEditor } from '@/components/editor';
import { TerminalPanel } from '@/components/terminal';
import { SettingsPanel } from '@/components/settings';
import { useCurrentProject } from '@/stores/projectStore';
import { useProject } from '@/hooks';
import { useAppStore } from '@/stores/appStore';
import { useTerminalStore } from '@/stores/terminalStore';
import { useEditorStore } from '@/stores/editorStore';

export default function IDEPage() {
  const router = useRouter();
  const currentProject = useCurrentProject();
  const { openProject } = useProject();
  const { toggleSidebar } = useAppStore();
  const { toggleTerminal, isTerminalOpen, createTerminal, terminals } = useTerminalStore();
  const { createNewFile } = useEditorStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle terminal toggle
  const handleToggleTerminal = useCallback(() => {
    if (!isTerminalOpen && terminals.length === 0 && currentProject?.path) {
      createTerminal(currentProject.path);
    }
    toggleTerminal();
  }, [isTerminalOpen, terminals.length, currentProject?.path, createTerminal, toggleTerminal]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for specific ones)
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Ctrl+` or Ctrl+Backquote - Toggle terminal
      if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
        e.preventDefault();
        e.stopPropagation();
        handleToggleTerminal();
        return;
      }
      
      // Skip other shortcuts if in input field
      if (isInputField) return;
      
      // Ctrl+N - Create new file
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewFile();
        return;
      }
      
      // Ctrl+B - Toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      
      // Ctrl+O - Open folder
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        openProject();
        return;
      }

      // Ctrl+, - Open settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }

      // Escape - Close settings/modals
      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        }
        return;
      }
    };

    // Use capture phase to ensure we catch the event first
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleToggleTerminal, toggleSidebar, openProject, isSettingsOpen, createNewFile]);

  // Redirect to home if no project is open
  useEffect(() => {
    if (!currentProject?.isOpen) {
      router.push('/');
    }
  }, [currentProject, router]);

  if (!currentProject) {
    return null;
  }

  return (
    <>
      <AppLayout onOpenSettings={() => setIsSettingsOpen(true)}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <EditorTabs />
            <div className="flex-1 overflow-hidden">
              <CodeEditor />
            </div>
          </div>
          <TerminalPanel />
        </div>
      </AppLayout>

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}
