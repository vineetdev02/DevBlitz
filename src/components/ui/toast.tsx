'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore, type NotificationKind } from '@/stores/notificationStore';

const ICONS: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const ACCENTS: Record<NotificationKind, string> = {
  info: 'text-blue-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
};

/** Bottom-right toast stack, mirroring VS Code's notification area. */
export function Toaster() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismiss = useNotificationStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-8 right-4 z-[60] flex w-[min(380px,90vw)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {notifications.map((notification) => {
          const Icon = ICONS[notification.kind];

          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'pointer-events-auto flex gap-3 rounded-lg p-3',
                'border border-white/10 bg-[#0d0d0d]/97 shadow-2xl shadow-black/70 backdrop-blur-xl'
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', ACCENTS[notification.kind])} />

              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-neutral-200">{notification.title}</p>

                {notification.detail && (
                  <p className="mt-1 break-words text-[11px] leading-relaxed text-neutral-500">
                    {notification.detail}
                  </p>
                )}

                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {notification.actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          action.run();
                          dismiss(notification.id);
                        }}
                        className="rounded border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-neutral-200 transition-colors hover:bg-white/[0.12]"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismiss(notification.id)}
                aria-label="Dismiss"
                className="h-5 w-5 flex-shrink-0 rounded text-neutral-600 transition-colors hover:bg-white/10 hover:text-neutral-200"
              >
                <X className="mx-auto h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
