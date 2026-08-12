'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface InlineInputProps {
  initialValue?: string;
  placeholder?: string;
  /** Select only the name, leaving the extension out of the selection. */
  selectBasename?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

/** The small in-tree text field used for creating and renaming entries. */
export function InlineInput({
  initialValue = '',
  placeholder,
  selectBasename,
  onSubmit,
  onCancel,
}: InlineInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();

    // Pre-select just the base name so typing replaces it but keeps `.tsx`.
    const dot = initialValue.lastIndexOf('.');
    if (selectBasename && dot > 0) input.setSelectionRange(0, dot);
    else input.select();
  }, [initialValue, selectBasename]);

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;

    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      // Clicking elsewhere commits, matching VS Code.
      onBlur={submit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          submitted.current = true;
          onCancel();
        }
      }}
      className={cn(
        'h-[19px] w-full min-w-0 rounded-sm border border-blue-500/70 bg-black px-1',
        'text-[13px] text-neutral-100 outline-none',
        'shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
      )}
    />
  );
}
