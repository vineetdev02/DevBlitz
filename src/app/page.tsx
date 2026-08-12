'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeScreen } from '@/components/welcome';
import { useProject } from '@/hooks';
import { useCurrentProject } from '@/stores/projectStore';

/**
 * Main landing page
 * Shows welcome screen if no project is open
 * Redirects to IDE if a project is already open
 */
export default function HomePage() {
  const router = useRouter();
  const currentProject = useCurrentProject();
  const { openProject, isLoading } = useProject();

  // The welcome screen only needs one shortcut; the IDE registers the rest.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        void openProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openProject]);

  // Redirect to IDE if project is open
  useEffect(() => {
    if (currentProject?.isOpen) {
      router.push('/ide/');
    }
  }, [currentProject, router]);

  // Handle opening a folder
  const handleOpenFolder = async () => {
    const project = await openProject();
    if (project) {
      router.push('/ide/');
    }
  };

  return (
    <WelcomeScreen
      onOpenFolder={handleOpenFolder}
      isLoading={isLoading}
    />
  );
}




