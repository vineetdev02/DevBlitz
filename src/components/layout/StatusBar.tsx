'use client';

import React from 'react';
import { GitBranch, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/stores/projectStore';

interface StatusBarProps {
  className?: string;
}

/**
 * Status bar at the bottom of the IDE
 * Shows project info, file stats, and notifications
 */
export function StatusBar({ className }: StatusBarProps) {
  const currentProject = useCurrentProject();

  return (
    <footer
      className={cn(
        'flex items-center justify-between h-6 px-3 text-xs',
        'bg-card border-t border-border select-none',
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Git branch (placeholder) */}
        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer">
          <GitBranch className="w-3.5 h-3.5" />
          <span>main</span>
        </div>

        {/* Sync status */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        </div>
      </div>

      {/* Center section */}
      <div className="flex items-center gap-3">
        {currentProject && (
          <span className="text-muted-foreground">
            {currentProject.name}
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Language/file type */}
        <span className="text-muted-foreground hover:text-foreground cursor-pointer">
          TypeScript
        </span>

        {/* Encoding */}
        <span className="text-muted-foreground hover:text-foreground cursor-pointer">
          UTF-8
        </span>

        {/* Line ending */}
        <span className="text-muted-foreground hover:text-foreground cursor-pointer">
          LF
        </span>

        {/* Notifications */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>0</span>
        </div>
      </div>
    </footer>
  );
}


