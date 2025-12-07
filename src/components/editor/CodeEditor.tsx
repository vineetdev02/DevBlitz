'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCode2, FolderOpen } from 'lucide-react';
import { useActiveFile, useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/utils';

export function CodeEditor() {
  const activeFile = useActiveFile();
  const { updateFileContent } = useEditorStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and line numbers
  useEffect(() => {
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;
    
    if (!textarea || !lineNumbers) return;

    const handleScroll = () => {
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, []);

  if (!activeFile) {
    return <EditorWelcome />;
  }

  const lines = activeFile.content.split('\n');
  const lineCount = lines.length;
  const lineNumberWidth = Math.max(String(lineCount).length * 9 + 24, 45);

  return (
    <div className="flex h-full bg-black font-mono text-[13px] leading-[20px] overflow-hidden">
      {/* Line numbers - NOT selectable */}
      <div 
        ref={lineNumbersRef}
        className="flex-shrink-0 bg-black border-r border-neutral-800 overflow-hidden pointer-events-none"
        style={{ width: `${lineNumberWidth}px` }}
      >
        <div className="py-3 select-none">
          {lines.map((_, index) => (
            <div 
              key={index} 
              className="px-3 text-right text-neutral-600 h-[20px]"
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Code area - selectable */}
      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={activeFile.content}
          onChange={(e) => updateFileContent(activeFile.path, e.target.value)}
          className={cn(
            'w-full min-h-full p-3 bg-black resize-none outline-none',
            'text-neutral-200 caret-white selection:bg-blue-500/30',
            'placeholder:text-neutral-700'
          )}
          spellCheck={false}
          placeholder="// Start typing..."
          style={{
            minHeight: `${Math.max(lineCount * 20 + 24, 300)}px`,
            lineHeight: '20px',
          }}
        />
      </div>
    </div>
  );
}

function EditorWelcome() {
  return (
    <div className="flex-1 flex items-center justify-center h-full bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
          <FileCode2 className="w-10 h-10 text-neutral-500" />
        </div>
        <h2 className="text-xl font-medium text-neutral-300 mb-2">No File Open</h2>
        <p className="text-neutral-500 text-sm mb-8 max-w-xs mx-auto">
          Select a file from the explorer to start editing
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Ctrl+O</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
