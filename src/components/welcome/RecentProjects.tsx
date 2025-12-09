'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Folder, Clock, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPath, getRelativeTime } from '@/lib/utils';
import { useProject } from '@/hooks/useProject';
import { Separator } from '@/components/ui/separator';

/**
 * Recent projects list component
 * Shows last opened projects with quick access
 */
export function RecentProjects() {
  const { recentProjects, openProjectByPath, removeFromRecent, isLoading } = useProject();

  if (recentProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-4">
          <Folder className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">No Recent Projects</h3>
        <p className="text-xs text-muted-foreground">
          Projects you open will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Recent Projects</h2>
        <span className="text-xs text-muted-foreground">
          ({recentProjects.length})
        </span>
      </div>

      <Separator className="mb-4" />

      {/* Projects list */}
      <div className="space-y-1">
        {recentProjects.slice(0, 5).map((project, index) => (
          <motion.div
            key={project.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => openProjectByPath(project.path)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'bg-transparent hover:bg-accent',
                'transition-colors duration-150',
                'group text-left',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Folder icon */}
              <div className="flex-shrink-0 p-2 rounded-md bg-accent group-hover:bg-secondary transition-colors">
                <Folder className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Project info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate truncate-path">
                  {formatPath(project.path, 50)}
                </p>
              </div>

              {/* Time and actions */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {getRelativeTime(project.lastOpened)}
                </span>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromRecent(project.path);
                  }}
                  className={cn(
                    'p-1 rounded opacity-0 group-hover:opacity-100',
                    'hover:bg-destructive/20 hover:text-destructive',
                    'transition-all duration-150'
                  )}
                  aria-label="Remove from recent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Show more link */}
      {recentProjects.length > 5 && (
        <button
          className={cn(
            'w-full mt-2 py-2 text-xs text-muted-foreground',
            'hover:text-foreground transition-colors'
          )}
        >
          Show {recentProjects.length - 5} more projects...
        </button>
      )}
    </div>
  );
}




