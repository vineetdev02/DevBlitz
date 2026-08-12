'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { TOKEN_COLORS, type Token } from '@/lib/highlight';

const MINIMAP_WIDTH = 78;
const CHAR_WIDTH = 1;
const MAX_LINE_HEIGHT = 3;
const MAX_CHARS = MINIMAP_WIDTH / CHAR_WIDTH;

interface MinimapProps {
  lines: Token[][];
  /** Scroll offset of the editor viewport, in pixels. */
  scrollTop: number;
  /** Height of the visible editor area, in pixels. */
  viewportHeight: number;
  /** Full scrollable height of the document, in pixels. */
  contentHeight: number;
  onScrollTo: (scrollTop: number) => void;
}

/**
 * Canvas minimap. The whole document is always scaled to fit the available
 * height, so the thumb position maps linearly to the editor's scroll offset.
 */
export function Minimap({ lines, scrollTop, viewportHeight, contentHeight, onScrollTo }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const lineHeight = Math.min(
    MAX_LINE_HEIGHT,
    Math.max(0.5, viewportHeight / Math.max(lines.length, 1))
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = MINIMAP_WIDTH;
    const height = container.clientHeight;
    if (height === 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const visibleLines = Math.ceil(height / lineHeight);

    for (let index = 0; index < Math.min(lines.length, visibleLines); index += 1) {
      const y = index * lineHeight;
      let x = 2;

      for (const token of lines[index] ?? []) {
        const length = token.value.length;

        // Whitespace only advances the cursor - nothing to paint.
        if (token.value.trim().length === 0) {
          x += length * CHAR_WIDTH;
          if (x > MAX_CHARS) break;
          continue;
        }

        ctx.fillStyle = TOKEN_COLORS[token.type] ?? TOKEN_COLORS.plain;
        // Slightly transparent so the minimap reads as a texture, not a wall.
        ctx.globalAlpha = 0.65;
        ctx.fillRect(x, y, Math.min(length * CHAR_WIDTH, MAX_CHARS - x), Math.max(lineHeight - 0.6, 1));

        x += length * CHAR_WIDTH;
        if (x > MAX_CHARS) break;
      }
    }

    ctx.globalAlpha = 1;
  }, [lines, lineHeight]);

  const scrollFromClientY = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const documentHeight = lines.length * lineHeight;
      const ratio = (clientY - rect.top) / Math.max(documentHeight, 1);
      const maxScroll = Math.max(0, contentHeight - viewportHeight);

      // Centre the viewport on the clicked position.
      const target = ratio * contentHeight - viewportHeight / 2;
      onScrollTo(Math.max(0, Math.min(maxScroll, target)));
    },
    [lines.length, lineHeight, contentHeight, viewportHeight, onScrollTo]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      scrollFromClientY(e.clientY);
    };
    const handleUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [scrollFromClientY]);

  const documentHeight = lines.length * lineHeight;
  const thumbHeight = contentHeight > 0 ? Math.max(12, (viewportHeight / contentHeight) * documentHeight) : 0;
  const thumbTop = contentHeight > 0 ? (scrollTop / contentHeight) * documentHeight : 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-shrink-0 cursor-pointer overflow-hidden border-l border-white/[0.06] bg-black/40"
      style={{ width: MINIMAP_WIDTH }}
      onMouseDown={(e) => {
        isDragging.current = true;
        scrollFromClientY(e.clientY);
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-none block" />

      {/* Viewport indicator */}
      <div
        className="pointer-events-none absolute left-0 right-0 border-y border-white/10 bg-white/[0.07]"
        style={{ top: thumbTop, height: thumbHeight }}
      />
    </div>
  );
}
