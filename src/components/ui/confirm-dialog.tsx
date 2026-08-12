'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal confirmation used before anything irreversible. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => confirmRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };

    // Capture phase so the editor's own Escape handling doesn't run first.
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[70] bg-black/60"
            onClick={onCancel}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed left-1/2 top-1/3 z-[71] w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2',
              'rounded-xl border border-white/10 bg-[#0d0d0d]/97 p-5',
              'shadow-2xl shadow-black/80 backdrop-blur-2xl'
            )}
          >
            <div className="flex gap-3">
              {destructive && (
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-medium text-neutral-100">{title}</h2>
                {description && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">{description}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="rounded-md border border-white/10 px-3 py-1.5 text-[13px] text-neutral-300 transition-colors hover:bg-white/[0.07]"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d0d0d]',
                  destructive
                    ? 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/50'
                    : 'bg-white text-black hover:bg-neutral-200 focus:ring-white/40'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
