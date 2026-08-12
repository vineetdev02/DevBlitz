'use client';

import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  GitCommitHorizontal,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentProject } from '@/stores/projectStore';
import { useGitStore } from '@/stores/gitStore';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { GitFileStatus } from '@/lib/tauri-commands';

interface StatusStyle {
  letter: string;
  className: string;
  label: string;
}

const DEFAULT_STATUS_STYLE: StatusStyle = {
  letter: 'M',
  className: 'text-amber-400',
  label: 'Modified',
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  modified: { letter: 'M', className: 'text-amber-400', label: 'Modified' },
  added: { letter: 'A', className: 'text-emerald-400', label: 'Added' },
  untracked: { letter: 'U', className: 'text-emerald-400', label: 'Untracked' },
  deleted: { letter: 'D', className: 'text-red-400', label: 'Deleted' },
  renamed: { letter: 'R', className: 'text-blue-400', label: 'Renamed' },
  copied: { letter: 'C', className: 'text-blue-400', label: 'Copied' },
  typechange: { letter: 'T', className: 'text-amber-400', label: 'Type changed' },
  conflicted: { letter: '!', className: 'text-red-400', label: 'Conflicted' },
};

export function GitPanel() {
  const currentProject = useCurrentProject();
  const {
    info,
    staged,
    unstaged,
    commits,
    commitMessage,
    isCommitting,
    error,
    refresh,
    stage,
    unstage,
    discard,
    commit,
    setCommitMessage,
  } = useGitStore();

  const [discardTarget, setDiscardTarget] = useState<GitFileStatus | null>(null);
  const [showCommits, setShowCommits] = useState(true);

  const basePath = currentProject?.path;

  useEffect(() => {
    if (basePath) refresh(basePath);
  }, [basePath, refresh]);

  if (error) {
    return (
      <EmptyState
        title="Git is unavailable"
        detail={error}
      />
    );
  }

  if (!info) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!info.isRepo) {
    return (
      <EmptyState
        title="Not a git repository"
        detail="Run git init in the terminal to start tracking this folder."
      />
    );
  }

  const hasChanges = staged.length + unstaged.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Commit box */}
      <div className="border-b border-white/[0.06] p-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl+Enter commits, exactly like VS Code.
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && basePath) {
              e.preventDefault();
              void commit(basePath);
            }
          }}
          placeholder={`Message (Ctrl+Enter to commit on '${info.branch}')`}
          rows={2}
          spellCheck={false}
          className={cn(
            'w-full resize-none rounded border border-white/10 bg-black/60 px-2 py-1.5',
            'text-[12px] text-neutral-200 outline-none placeholder:text-neutral-600',
            'focus:border-blue-500/70'
          )}
        />

        <button
          onClick={() => basePath && void commit(basePath)}
          disabled={isCommitting || staged.length === 0 || !commitMessage.trim()}
          className={cn(
            'mt-1.5 flex w-full items-center justify-center gap-2 rounded px-2 py-1.5',
            'bg-blue-600 text-[12px] font-medium text-white transition-colors',
            'hover:bg-blue-500 disabled:cursor-default disabled:bg-white/[0.06] disabled:text-neutral-600'
          )}
        >
          {isCommitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Commit{staged.length > 0 ? ` ${staged.length}` : ''}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasChanges && (
          <p className="px-3 py-6 text-center text-[12px] text-neutral-600">
            No changes. Working tree is clean.
          </p>
        )}

        {staged.length > 0 && (
          <Section
            title="Staged Changes"
            count={staged.length}
            action={{
              icon: Minus,
              label: 'Unstage all',
              run: () => basePath && void unstage(basePath),
            }}
          >
            {staged.map((entry) => (
              <ChangeRow
                key={`staged-${entry.path}`}
                entry={entry}
                actions={[
                  {
                    icon: Minus,
                    label: 'Unstage',
                    run: () => basePath && void unstage(basePath, entry.path),
                  },
                ]}
              />
            ))}
          </Section>
        )}

        {unstaged.length > 0 && (
          <Section
            title="Changes"
            count={unstaged.length}
            action={{
              icon: Plus,
              label: 'Stage all',
              run: () => basePath && void stage(basePath),
            }}
          >
            {unstaged.map((entry) => (
              <ChangeRow
                key={`unstaged-${entry.path}`}
                entry={entry}
                actions={[
                  {
                    icon: RotateCcw,
                    label: 'Discard changes',
                    run: () => setDiscardTarget(entry),
                    hidden: entry.status === 'untracked',
                  },
                  {
                    icon: Plus,
                    label: 'Stage',
                    run: () => basePath && void stage(basePath, entry.path),
                  },
                ]}
              />
            ))}
          </Section>
        )}

        {/* Recent history */}
        {commits.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setShowCommits((open) => !open)}
              className="flex h-[22px] w-full items-center px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 hover:bg-white/[0.06]"
            >
              {showCommits ? (
                <ChevronDown className="mr-1 h-3 w-3" />
              ) : (
                <ChevronRight className="mr-1 h-3 w-3" />
              )}
              Recent Commits
            </button>

            {showCommits &&
              commits.map((entry) => (
                <div
                  key={entry.hash}
                  className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.04]"
                  title={`${entry.author} · ${entry.relativeDate}`}
                >
                  <GitCommitHorizontal className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-neutral-300">{entry.subject}</p>
                    <p className="truncate text-[10px] text-neutral-600">
                      {entry.hash} · {entry.author} · {entry.relativeDate}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(discardTarget)}
        title={`Discard changes in '${discardTarget?.name}'?`}
        description="Your edits to this file will be lost. This cannot be undone."
        confirmLabel="Discard Changes"
        destructive
        onConfirm={() => {
          if (basePath && discardTarget) void discard(basePath, discardTarget.path);
        }}
        onCancel={() => setDiscardTarget(null)}
      />
    </div>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: { icon: React.ComponentType<{ className?: string }>; label: string; run: () => void };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div className="group flex h-[22px] items-center px-2 hover:bg-white/[0.06]">
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex flex-1 items-center text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
        >
          {open ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
          {title}
        </button>

        {action && (
          <button
            onClick={action.run}
            title={action.label}
            className="mr-1 hidden h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-white group-hover:flex"
          >
            <action.icon className="h-3.5 w-3.5" />
          </button>
        )}

        <span className="rounded-full bg-white/[0.08] px-1.5 text-[10px] tabular-nums text-neutral-400">
          {count}
        </span>
      </div>

      {open && children}
    </div>
  );
}

function ChangeRow({
  entry,
  actions,
}: {
  entry: GitFileStatus;
  actions: { icon: React.ComponentType<{ className?: string }>; label: string; run: () => void; hidden?: boolean }[];
}) {
  const openFileFromDisk = useEditorStore((state) => state.openFileFromDisk);
  const style = STATUS_STYLES[entry.status] ?? DEFAULT_STATUS_STYLE;
  const directory = entry.path.split('/').slice(0, -1).join('/');
  const extension = entry.name.includes('.') ? entry.name.split('.').pop() ?? null : null;

  return (
    <div
      className="group flex h-[22px] cursor-pointer items-center gap-1 pl-6 pr-2 hover:bg-white/[0.06]"
      onClick={() => {
        if (entry.status === 'deleted') return;
        void openFileFromDisk(entry.absolutePath, entry.name, getLanguageFromExtension(extension));
      }}
      title={`${style.label} — ${entry.path}`}
    >
      <span
        className={cn(
          'truncate text-[13px] text-neutral-300',
          entry.status === 'deleted' && 'text-neutral-500 line-through'
        )}
      >
        {entry.name}
      </span>

      {directory && (
        <span className="min-w-0 flex-1 truncate text-[11px] text-neutral-600">{directory}</span>
      )}

      <div className="ml-auto flex items-center gap-0.5">
        {actions
          .filter((action) => !action.hidden)
          .map((action) => (
            <button
              key={action.label}
              onClick={(e) => {
                e.stopPropagation();
                action.run();
              }}
              title={action.label}
              className="hidden h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-white group-hover:flex"
            >
              <action.icon className="h-3.5 w-3.5" />
            </button>
          ))}

        <span className={cn('w-4 text-center text-[11px] font-semibold', style.className)}>
          {style.letter}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <GitBranch className="h-6 w-6 text-neutral-700" />
      <p className="text-[13px] text-neutral-400">{title}</p>
      <p className="text-[11px] leading-relaxed text-neutral-600">{detail}</p>
    </div>
  );
}
