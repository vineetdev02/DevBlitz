'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileCode2, MousePointer2 } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useCurrentProject } from '@/stores/projectStore';
import { useProject, useGlobalShortcuts } from '@/hooks';
import { useAppStore } from '@/stores/appStore';

/**
 * Main IDE page
 * Shows the editor interface when a project is open
 */
export default function IDEPage() {
  const router = useRouter();
  const currentProject = useCurrentProject();
  const { openProject, closeProject } = useProject();
  const { toggleSidebar } = useAppStore();

  // Register global keyboard shortcuts
  useGlobalShortcuts({
    onOpenFolder: openProject,
    onToggleSidebar: toggleSidebar,
  });

  // Redirect to home if no project is open
  useEffect(() => {
    if (!currentProject?.isOpen) {
      router.push('/');
    }
  }, [currentProject, router]);

  // Don't render if no project
  if (!currentProject) {
    return null;
  }

  return (
    <AppLayout>
      {/* Editor placeholder */}
      <div className="flex-1 flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-6">
            <FileCode2 className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold mb-2">
            No File Selected
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            Select a file from the explorer to start editing
          </p>

          {/* Hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <MousePointer2 className="w-3.5 h-3.5" />
            <span>Click on a file in the sidebar</span>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

