'use client';

import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { X, FileCode, FileJson, FileText, File, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, useOpenFiles, useActiveFilePath, OpenFile } from '@/stores/editorStore';

export function EditorTabs() {
  const openFiles = useOpenFiles();
  const activeFilePath = useActiveFilePath();
  const { setActiveFile, closeFile, reorderFiles } = useEditorStore();

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="h-[35px] bg-neutral-950 border-b border-neutral-800 overflow-hidden">
      <Reorder.Group
        axis="x"
        values={openFiles}
        onReorder={reorderFiles}
        className="flex h-full"
      >
        {openFiles.map((file) => (
          <TabItem
            key={file.path}
            file={file}
            isActive={file.path === activeFilePath}
            onSelect={() => setActiveFile(file.path)}
            onClose={() => closeFile(file.path)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}

interface TabItemProps {
  file: OpenFile;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function TabItem({ file, isActive, onSelect, onClose }: TabItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = getFileIcon(file.name);
  const iconColor = getIconColor(file.name);

  return (
    <Reorder.Item
      value={file}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        'group relative flex items-center gap-2 h-full px-3 cursor-pointer',
        'transition-colors duration-100 min-w-0 max-w-[180px]',
        'border-r border-neutral-800',
        isActive 
          ? 'bg-black text-neutral-200' 
          : 'bg-neutral-950 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900',
        isDragging && 'opacity-80 z-50'
      )}
      onClick={onSelect}
      whileDrag={{ scale: 1.02 }}
    >
      {/* Active indicator line */}
      {isActive && (
        <motion.div 
          layoutId="activeTab"
          className="absolute top-0 left-0 right-0 h-px bg-white" 
        />
      )}
      
      <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />
      
      <span className="text-[13px] truncate flex-1">{file.name}</span>
      
      {/* Close button - shows dot if modified, X on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={cn(
          'w-5 h-5 flex items-center justify-center rounded flex-shrink-0',
          'hover:bg-neutral-700 transition-colors duration-100'
        )}
      >
        {file.isModified ? (
          <span className="w-2 h-2 rounded-full bg-white group-hover:hidden" />
        ) : null}
        <X className={cn(
          'w-3.5 h-3.5',
          file.isModified ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'
        )} />
      </button>
    </Reorder.Item>
  );
}

function getFileIcon(filename: string): React.ComponentType<{ className?: string }> {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'rb', 'php'].includes(ext || '')) {
    return FileCode;
  }
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext || '')) {
    return FileJson;
  }
  if (['md', 'txt', 'html'].includes(ext || '')) {
    return FileText;
  }
  if (['css', 'scss', 'sass', 'less'].includes(ext || '')) {
    return FileType;
  }
  return File;
}

function getIconColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const colors: Record<string, string> = {
    js: 'text-yellow-400',
    jsx: 'text-cyan-400',
    ts: 'text-blue-400',
    tsx: 'text-blue-400',
    py: 'text-yellow-500',
    rs: 'text-orange-400',
    go: 'text-cyan-400',
    java: 'text-red-400',
    json: 'text-yellow-500',
    css: 'text-blue-400',
    scss: 'text-pink-400',
    html: 'text-orange-400',
    md: 'text-blue-300',
  };
  
  return colors[ext || ''] || 'text-neutral-500';
}
