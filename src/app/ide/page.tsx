'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Breadcrumbs, CodeEditor, EditorTabs } from '@/components/editor';
import { TerminalPanel } from '@/components/terminal';
import { SettingsPanel } from '@/components/settings';
import { useCurrentProject } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function IDEPage() {
  const router = useRouter();
  const currentProject = useCurrentProject();

  const isSettingsOpen = useAppStore((state) => state.isSettingsOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const isBreadcrumbsVisible = useAppStore((state) => state.isBreadcrumbsVisible);

  // Every shortcut in the app is registered here.
  useKeyboardShortcuts();

  // Nothing to edit without a project - send the user back to the welcome screen.
  useEffect(() => {
    if (!currentProject?.isOpen) router.push('/');
  }, [currentProject, router]);

  if (!currentProject) return null;

  return (
    <AppLayout>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <EditorTabs />
          {isBreadcrumbsVisible && <Breadcrumbs />}
          <div className="min-h-0 flex-1">
            <CodeEditor />
          </div>
        </div>

        <TerminalPanel />
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppLayout>
  );
}
