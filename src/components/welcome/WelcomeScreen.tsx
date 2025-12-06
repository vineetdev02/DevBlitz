'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, FilePlus, GitBranch, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getModifierKey } from '@/lib/utils';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { RecentProjects } from './RecentProjects';

interface WelcomeScreenProps {
  onOpenFolder: () => void;
  isLoading?: boolean;
}

/**
 * Welcome screen shown when no project is open
 * Features hero section, quick actions, and recent projects
 */
export function WelcomeScreen({ onOpenFolder, isLoading }: WelcomeScreenProps) {
  const modKey = getModifierKey();

  const actions = [
    {
      id: 'open',
      icon: FolderOpen,
      title: 'Open Folder',
      description: 'Browse for a project folder',
      shortcut: `${modKey}+O`,
      onClick: onOpenFolder,
      disabled: isLoading,
    },
    {
      id: 'new',
      icon: FilePlus,
      title: 'New File',
      description: 'Create a new file',
      shortcut: `${modKey}+N`,
      onClick: () => {},
      disabled: true,
      comingSoon: true,
    },
    {
      id: 'clone',
      icon: GitBranch,
      title: 'Clone Repository',
      description: 'Clone from Git URL',
      onClick: () => {},
      disabled: true,
      comingSoon: true,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-card/20 pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center max-w-4xl w-full"
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative inline-flex items-center justify-center mb-6"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 blur-2xl bg-white/20 rounded-full scale-150" />
              
              {/* Logo icon */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-2xl">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-12 h-12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"
                    fill="black"
                    stroke="black"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold tracking-tight mb-3 gradient-text"
          >
            {APP_NAME}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg text-muted-foreground flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {APP_DESCRIPTION}
          </motion.p>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-12"
        >
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'action-card group text-left',
                action.disabled && 'disabled'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg bg-accent',
                  !action.disabled && 'group-hover:bg-primary group-hover:text-primary-foreground',
                  'transition-colors duration-200'
                )}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    {action.comingSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {action.description}
                  </p>
                  {action.shortcut && (
                    <div className="mt-2">
                      <kbd className="kbd">{action.shortcut}</kbd>
                    </div>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {isLoading && action.id === 'open' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <RecentProjects />
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-xs text-muted-foreground/50"
        >
          Press {modKey}+O to open a folder
        </motion.p>
      </motion.div>
    </div>
  );
}

