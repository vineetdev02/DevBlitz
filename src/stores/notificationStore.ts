'use client';

import { create } from 'zustand';

export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail?: string;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  timeout: number;
  createdAt: number;
  actions?: { label: string; run: () => void }[];
}

interface NotificationState {
  notifications: Notification[];
  notify: (input: {
    kind?: NotificationKind;
    title: string;
    detail?: string;
    timeout?: number;
    actions?: { label: string; run: () => void }[];
  }) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const DEFAULT_TIMEOUTS: Record<NotificationKind, number> = {
  info: 3500,
  success: 2500,
  warning: 6000,
  // Errors stay until the user dismisses them - they usually need action.
  error: 0,
};

let counter = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  notify: ({ kind = 'info', title, detail, timeout, actions }) => {
    counter += 1;
    const id = `notification-${counter}`;
    const resolvedTimeout = timeout ?? DEFAULT_TIMEOUTS[kind];

    const notification: Notification = {
      id,
      kind,
      title,
      detail,
      timeout: resolvedTimeout,
      createdAt: Date.now(),
      actions,
    };

    // Keep at most 5 toasts on screen; drop the oldest.
    set((state) => ({
      notifications: [...state.notifications, notification].slice(-5),
    }));

    if (resolvedTimeout > 0) {
      setTimeout(() => get().dismiss(id), resolvedTimeout);
    }

    return id;
  },

  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  dismissAll: () => set({ notifications: [] }),
}));

/** Imperative helper so non-React code (stores, commands) can raise toasts. */
export const notify = (input: Parameters<NotificationState['notify']>[0]) =>
  useNotificationStore.getState().notify(input);

export const useNotifications = () => useNotificationStore((state) => state.notifications);
