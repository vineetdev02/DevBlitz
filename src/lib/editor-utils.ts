/**
 * Text manipulation helpers shared by the editor's keyboard commands.
 *
 * Everything here is pure: given a document and a selection, return the edit to
 * apply. The component owns the textarea and the undo stack.
 */

export interface Selection {
  start: number;
  end: number;
}

export interface TextEdit {
  /** Range in the original document to replace. */
  start: number;
  end: number;
  text: string;
  /** Selection to restore afterwards, as absolute offsets. */
  selection: Selection;
}

export const OPEN_BRACKETS = '([{';
export const CLOSE_BRACKETS = ')]}';
export const BRACKET_PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
export const QUOTE_CHARS = `'"\``;

/** Offsets at which each line begins. Always has one entry per line. */
export function getLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

/** Convert an absolute offset to a 1-based line/column position. */
export function offsetToPosition(text: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lineStart = 0;

  for (let i = 0; i < clamped; i += 1) {
    if (text[i] === '\n') {
      line += 1;
      lineStart = i + 1;
    }
  }

  return { line, column: clamped - lineStart + 1 };
}

/** Convert a 1-based line/column position to an absolute offset. */
export function positionToOffset(text: string, line: number, column: number): number {
  const starts = getLineStarts(text);
  const index = Math.max(0, Math.min(line - 1, starts.length - 1));
  const lineStart = starts[index] ?? 0;
  const lineEnd = index + 1 < starts.length ? (starts[index + 1] ?? text.length) - 1 : text.length;
  return Math.min(lineStart + Math.max(0, column - 1), lineEnd);
}

/** Index of the line containing `offset`, 0-based. */
export function lineIndexAt(text: string, offset: number): number {
  return offsetToPosition(text, offset).line - 1;
}

/** Start and end offsets of the full lines covered by a selection. */
export function getLineRange(text: string, selection: Selection): { start: number; end: number; firstLine: number; lastLine: number } {
  const starts = getLineStarts(text);
  const firstLine = lineIndexAt(text, selection.start);
  // A selection ending exactly at a line start does not include that line.
  const rawLastLine = lineIndexAt(text, selection.end);
  const lastLine =
    selection.end > selection.start && starts[rawLastLine] === selection.end && rawLastLine > firstLine
      ? rawLastLine - 1
      : rawLastLine;

  const start = starts[firstLine] ?? 0;
  const end = lastLine + 1 < starts.length ? (starts[lastLine + 1] ?? text.length) - 1 : text.length;

  return { start, end, firstLine, lastLine };
}

/** The leading whitespace of the line containing `offset`. */
export function getIndentAt(text: string, offset: number): string {
  const starts = getLineStarts(text);
  const lineStart = starts[lineIndexAt(text, offset)] ?? 0;
  const match = /^[ \t]*/.exec(text.slice(lineStart));
  return match ? match[0] : '';
}

/** Insert an indent step, or indent every selected line. */
export function indentEdit(text: string, selection: Selection, tabSize: number): TextEdit {
  const indent = ' '.repeat(tabSize);

  if (selection.start === selection.end) {
    // Align to the next tab stop rather than always inserting a full step.
    const column = offsetToPosition(text, selection.start).column - 1;
    const spaces = ' '.repeat(tabSize - (column % tabSize) || tabSize);
    return {
      start: selection.start,
      end: selection.end,
      text: spaces,
      selection: { start: selection.start + spaces.length, end: selection.start + spaces.length },
    };
  }

  const range = getLineRange(text, selection);
  const block = text.slice(range.start, range.end);
  const lines = block.split('\n');
  const indented = lines.map((line) => (line.length > 0 ? indent + line : line));
  const added = indented.join('\n').length - block.length;

  return {
    start: range.start,
    end: range.end,
    text: indented.join('\n'),
    selection: {
      start: selection.start + (text[selection.start] === '\n' ? 0 : indent.length),
      end: selection.end + added,
    },
  };
}

/** Remove one indent step from every selected line. */
export function outdentEdit(text: string, selection: Selection, tabSize: number): TextEdit {
  const range = getLineRange(text, selection);
  const block = text.slice(range.start, range.end);

  let removedBeforeStart = 0;
  let removedTotal = 0;

  const lines = block.split('\n').map((line, index) => {
    const match = /^[ \t]+/.exec(line);
    if (!match) return line;

    // Strip up to one tab stop worth of whitespace.
    const whitespace = match[0];
    let remove = 0;
    while (remove < whitespace.length && remove < tabSize) {
      if (whitespace[remove] === '\t') {
        remove += 1;
        break;
      }
      remove += 1;
    }

    if (index === 0) removedBeforeStart = remove;
    removedTotal += remove;
    return line.slice(remove);
  });

  return {
    start: range.start,
    end: range.end,
    text: lines.join('\n'),
    selection: {
      start: Math.max(range.start, selection.start - removedBeforeStart),
      end: Math.max(range.start, selection.end - removedTotal),
    },
  };
}

/**
 * Enter with automatic indentation: keep the current indent, add a step after an
 * opening bracket, and when the cursor sits between a matched pair, put the
 * closing bracket on its own line.
 */
export function newlineEdit(text: string, selection: Selection, tabSize: number): TextEdit {
  const indent = getIndentAt(text, selection.start);
  const before = text.slice(0, selection.start).replace(/[ \t]*$/, '');
  const prevChar = before[before.length - 1] ?? '';
  const nextChar = text[selection.end] ?? '';

  const opensBlock = OPEN_BRACKETS.includes(prevChar) || prevChar === ':';
  const step = ' '.repeat(tabSize);

  if (opensBlock && BRACKET_PAIRS[prevChar] === nextChar) {
    // { | }  ->  {\n  |\n}
    const inserted = `\n${indent}${step}\n${indent}`;
    return {
      start: selection.start,
      end: selection.end,
      text: inserted,
      selection: {
        start: selection.start + 1 + indent.length + step.length,
        end: selection.start + 1 + indent.length + step.length,
      },
    };
  }

  const inserted = `\n${indent}${opensBlock ? step : ''}`;
  const caret = selection.start + inserted.length;

  return {
    start: selection.start,
    end: selection.end,
    text: inserted,
    selection: { start: caret, end: caret },
  };
}

/** Toggle line comments across the selection, VS Code style. */
export function toggleCommentEdit(
  text: string,
  selection: Selection,
  markers: { line?: string; block?: [string, string] }
): TextEdit | null {
  const range = getLineRange(text, selection);
  const block = text.slice(range.start, range.end);
  const lines = block.split('\n');

  if (markers.line) {
    const marker = markers.line;
    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    if (nonEmpty.length === 0) return null;

    const allCommented = nonEmpty.every((l) => l.trim().startsWith(marker));

    const updated = lines.map((line) => {
      if (line.trim().length === 0) return line;

      if (allCommented) {
        // Remove the marker and one following space, preserving indentation.
        return line.replace(new RegExp(`^(\\s*)${escapeRegExp(marker)} ?`), '$1');
      }
      return line.replace(/^(\s*)/, `$1${marker} `);
    });

    const next = updated.join('\n');
    const delta = next.length - block.length;

    return {
      start: range.start,
      end: range.end,
      text: next,
      selection: {
        start: selection.start,
        end: Math.max(selection.start, selection.end + delta),
      },
    };
  }

  if (markers.block) {
    const [open, close] = markers.block;
    const trimmed = block.trim();

    if (trimmed.startsWith(open) && trimmed.endsWith(close)) {
      const next = block.replace(open, '').replace(new RegExp(`${escapeRegExp(close)}(?![\\s\\S]*${escapeRegExp(close)})`), '').trimEnd();
      return {
        start: range.start,
        end: range.end,
        text: next,
        selection: { start: range.start, end: range.start + next.length },
      };
    }

    const next = `${open} ${block} ${close}`;
    return {
      start: range.start,
      end: range.end,
      text: next,
      selection: { start: range.start, end: range.start + next.length },
    };
  }

  return null;
}

/** Move the selected lines up or down by one. */
export function moveLinesEdit(text: string, selection: Selection, direction: -1 | 1): TextEdit | null {
  const starts = getLineStarts(text);
  const range = getLineRange(text, selection);

  const targetLine = direction === -1 ? range.firstLine - 1 : range.lastLine + 1;
  if (targetLine < 0 || targetLine >= starts.length) return null;

  const lines = text.split('\n');
  const block = lines.slice(range.firstLine, range.lastLine + 1);
  const rest = [...lines];
  rest.splice(range.firstLine, block.length);
  rest.splice(direction === -1 ? range.firstLine - 1 : range.firstLine + 1, 0, ...block);

  const next = rest.join('\n');
  const shift =
    direction === -1
      ? -((lines[range.firstLine - 1]?.length ?? 0) + 1)
      : (lines[range.lastLine + 1]?.length ?? 0) + 1;

  return {
    start: 0,
    end: text.length,
    text: next,
    selection: {
      start: Math.max(0, selection.start + shift),
      end: Math.max(0, selection.end + shift),
    },
  };
}

/** Duplicate the selected lines above or below. */
export function copyLinesEdit(text: string, selection: Selection, direction: -1 | 1): TextEdit {
  const range = getLineRange(text, selection);
  const block = text.slice(range.start, range.end);

  if (direction === 1) {
    // Insert the copy below, keeping the cursor on the copy.
    const offset = block.length + 1;
    return {
      start: range.end,
      end: range.end,
      text: `\n${block}`,
      selection: { start: selection.start + offset, end: selection.end + offset },
    };
  }

  return {
    start: range.start,
    end: range.start,
    text: `${block}\n`,
    selection: { start: selection.start, end: selection.end },
  };
}

/** Delete the selected lines entirely. */
export function deleteLinesEdit(text: string, selection: Selection): TextEdit {
  const range = getLineRange(text, selection);
  // Take the trailing newline too, unless this is the last line.
  const end = Math.min(text.length, range.end + 1);
  const start = end > range.end ? range.start : Math.max(0, range.start - 1);

  return {
    start,
    end,
    text: '',
    selection: { start, end: start },
  };
}

/** Insert an empty line above or below the cursor and move to it. */
export function insertLineEdit(text: string, selection: Selection, direction: -1 | 1, tabSize: number): TextEdit {
  const range = getLineRange(text, selection);
  const indent = getIndentAt(text, selection.start);
  void tabSize;

  if (direction === 1) {
    const caret = range.end + 1 + indent.length;
    return {
      start: range.end,
      end: range.end,
      text: `\n${indent}`,
      selection: { start: caret, end: caret },
    };
  }

  const caret = range.start + indent.length;
  return {
    start: range.start,
    end: range.start,
    text: `${indent}\n`,
    selection: { start: caret, end: caret },
  };
}

/**
 * Smart Home: jump to the first non-whitespace character, or to column 1 when
 * already there.
 */
export function smartHomeOffset(text: string, offset: number): number {
  const starts = getLineStarts(text);
  const lineStart = starts[lineIndexAt(text, offset)] ?? 0;
  const match = /^[ \t]*/.exec(text.slice(lineStart));
  const firstNonSpace = lineStart + (match ? match[0].length : 0);

  return offset === firstNonSpace ? lineStart : firstNonSpace;
}

/** Offset of the bracket matching the one adjacent to the cursor, or null. */
export function findMatchingBracket(text: string, offset: number): { open: number; close: number } | null {
  const candidates: { index: number; char: string }[] = [];
  if (offset < text.length) candidates.push({ index: offset, char: text[offset] ?? '' });
  if (offset > 0) candidates.push({ index: offset - 1, char: text[offset - 1] ?? '' });

  for (const { index, char } of candidates) {
    const closing = BRACKET_PAIRS[char];
    if (closing) {
      const match = scanForward(text, index, char, closing);
      if (match !== -1) return { open: index, close: match };
    }

    const openIndex = CLOSE_BRACKETS.indexOf(char);
    if (char && openIndex !== -1) {
      const open = OPEN_BRACKETS[openIndex] ?? '';
      const match = scanBackward(text, index, open, char);
      if (match !== -1) return { open: match, close: index };
    }
  }

  return null;
}

function scanForward(text: string, from: number, open: string, close: string): number {
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === open) depth += 1;
    else if (text[i] === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function scanBackward(text: string, from: number, open: string, close: string): number {
  let depth = 0;
  for (let i = from; i >= 0; i -= 1) {
    if (text[i] === close) depth += 1;
    else if (text[i] === open) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export interface FindMatch {
  start: number;
  end: number;
  line: number;
  /** 0-based column of the match within its line. */
  column: number;
}

/** All occurrences of a query in the document. */
export function findMatches(
  text: string,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean } = {}
): FindMatch[] {
  if (!query) return [];

  const matches: FindMatch[] = [];
  const starts = getLineStarts(text);

  const toPosition = (offset: number) => {
    // Binary search the line table - findMatches runs on every keystroke.
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if ((starts[mid] ?? 0) <= offset) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: offset - (starts[low] ?? 0) };
  };

  if (options.regex) {
    let pattern: RegExp;
    try {
      pattern = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
    } catch {
      return [];
    }

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
        continue;
      }
      const position = toPosition(match.index);
      matches.push({ start: match.index, end: match.index + match[0].length, ...position });
      if (matches.length > 5000) break;
    }
    return matches;
  }

  const haystack = options.caseSensitive ? text : text.toLowerCase();
  const needle = options.caseSensitive ? query : query.toLowerCase();
  const isWord = (c: string | undefined) => c !== undefined && /[A-Za-z0-9_]/.test(c);

  let from = 0;
  while (from <= haystack.length - needle.length) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;

    const before = haystack[index - 1];
    const after = haystack[index + needle.length];
    const wordOk = !options.wholeWord || (!isWord(before) && !isWord(after));

    if (wordOk) {
      const position = toPosition(index);
      matches.push({ start: index, end: index + needle.length, ...position });
      if (matches.length > 5000) break;
    }

    from = index + 1;
  }

  return matches;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Detect the dominant indentation of a document, for the status bar. */
export function detectIndentation(text: string): { type: 'spaces' | 'tabs'; size: number } {
  const lines = text.split('\n').slice(0, 500);
  let tabs = 0;
  const spaceCounts: Record<number, number> = {};

  for (const line of lines) {
    if (line.startsWith('\t')) {
      tabs += 1;
      continue;
    }
    const match = /^ +/.exec(line);
    if (match) {
      const width = match[0].length;
      // Only 2/4/8 are plausible indent widths worth reporting.
      for (const candidate of [2, 4, 8]) {
        if (width % candidate === 0) spaceCounts[candidate] = (spaceCounts[candidate] ?? 0) + 1;
      }
    }
  }

  const bestSpace = Object.entries(spaceCounts).sort((a, b) => {
    // Prefer the largest width that explains roughly as many lines.
    if (b[1] !== a[1]) return b[1] - a[1];
    return Number(b[0]) - Number(a[0]);
  })[0];

  if (tabs > (bestSpace ? bestSpace[1] : 0)) return { type: 'tabs', size: 4 };
  if (bestSpace) return { type: 'spaces', size: Number(bestSpace[0]) };
  return { type: 'spaces', size: 2 };
}

/** Line-ending style of a document. */
export function detectLineEnding(text: string): 'LF' | 'CRLF' {
  return text.includes('\r\n') ? 'CRLF' : 'LF';
}
