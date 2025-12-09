'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeScreen } from '@/components/welcome';
import { useProject, useGlobalShortcuts } from '@/hooks';
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

  // Register global keyboard shortcuts
  useGlobalShortcuts({
    onOpenFolder: openProject,
  });

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




