/**
 * Lightweight symbol extraction for "Go to Symbol" (Ctrl+Shift+O).
 *
 * This is deliberately regex-based rather than a real parser: it needs to be
 * instant on every keystroke and only has to be good enough to navigate a file.
 */

export type SymbolKind = 'function' | 'class' | 'interface' | 'type' | 'variable' | 'method' | 'heading' | 'rule' | 'key';

export interface DocumentSymbol {
  name: string;
  kind: SymbolKind;
  /** 1-based line number. */
  line: number;
  /** Indentation depth, used to nest results visually. */
  depth: number;
}

interface Rule {
  pattern: RegExp;
  kind: SymbolKind;
  /** Which capture group holds the symbol name. */
  group?: number;
}

const JS_RULES: Rule[] = [
  { pattern: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/, kind: 'function' },
  { pattern: /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/, kind: 'class' },
  { pattern: /^\s*(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/, kind: 'interface' },
  { pattern: /^\s*(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*[=<]/, kind: 'type' },
  { pattern: /^\s*(?:export\s+)?enum\s+([A-Za-z0-9_$]+)/, kind: 'type' },
  // const Foo = () => / const Foo = function / const Foo = memo(
  {
    pattern: /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)\s*(?::[^=]+)?=>|function\b|memo\(|forwardRef\()/,
    kind: 'function',
  },
  { pattern: /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/, kind: 'variable' },
  // Class members: `methodName(args) {` but not control keywords
  { pattern: /^\s{2,}(?:public\s+|private\s+|protected\s+|static\s+|async\s+|get\s+|set\s+)*([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/, kind: 'method' },
];

const RULES_BY_LANGUAGE: Record<string, Rule[]> = {
  javascript: JS_RULES,
  typescript: JS_RULES,
  jsx: JS_RULES,
  tsx: JS_RULES,

  python: [
    { pattern: /^\s*class\s+([A-Za-z0-9_]+)/, kind: 'class' },
    { pattern: /^\s*(?:async\s+)?def\s+([A-Za-z0-9_]+)/, kind: 'function' },
  ],

  rust: [
    { pattern: /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/, kind: 'function' },
    { pattern: /^\s*(?:pub(?:\([^)]*\))?\s+)?struct\s+([A-Za-z0-9_]+)/, kind: 'class' },
    { pattern: /^\s*(?:pub(?:\([^)]*\))?\s+)?enum\s+([A-Za-z0-9_]+)/, kind: 'type' },
    { pattern: /^\s*(?:pub(?:\([^)]*\))?\s+)?trait\s+([A-Za-z0-9_]+)/, kind: 'interface' },
    { pattern: /^\s*impl(?:<[^>]*>)?\s+(?:[A-Za-z0-9_:<>, ]+\s+for\s+)?([A-Za-z0-9_]+)/, kind: 'class' },
    { pattern: /^\s*(?:pub\s+)?(?:const|static)\s+([A-Za-z0-9_]+)/, kind: 'variable' },
    { pattern: /^\s*mod\s+([A-Za-z0-9_]+)/, kind: 'type' },
  ],

  go: [
    { pattern: /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z0-9_]+)/, kind: 'function' },
    { pattern: /^\s*type\s+([A-Za-z0-9_]+)\s+struct/, kind: 'class' },
    { pattern: /^\s*type\s+([A-Za-z0-9_]+)\s+interface/, kind: 'interface' },
    { pattern: /^\s*type\s+([A-Za-z0-9_]+)/, kind: 'type' },
  ],

  java: [
    { pattern: /^\s*(?:public|private|protected)?\s*(?:abstract\s+|final\s+)?class\s+([A-Za-z0-9_]+)/, kind: 'class' },
    { pattern: /^\s*(?:public|private|protected)?\s*interface\s+([A-Za-z0-9_]+)/, kind: 'interface' },
    { pattern: /^\s*(?:public|private|protected)\s+(?:static\s+)?[A-Za-z0-9_<>[\], ]+\s+([A-Za-z0-9_]+)\s*\(/, kind: 'method' },
  ],

  csharp: [
    { pattern: /^\s*(?:public|private|protected|internal)?\s*(?:abstract\s+|sealed\s+|static\s+|partial\s+)*class\s+([A-Za-z0-9_]+)/, kind: 'class' },
    { pattern: /^\s*(?:public|private|protected|internal)?\s*interface\s+([A-Za-z0-9_]+)/, kind: 'interface' },
    { pattern: /^\s*(?:public|private|protected|internal)\s+(?:static\s+|async\s+|override\s+|virtual\s+)*[A-Za-z0-9_<>[\], ]+\s+([A-Za-z0-9_]+)\s*\(/, kind: 'method' },
  ],

  ruby: [
    { pattern: /^\s*class\s+([A-Za-z0-9_:]+)/, kind: 'class' },
    { pattern: /^\s*module\s+([A-Za-z0-9_:]+)/, kind: 'type' },
    { pattern: /^\s*def\s+([A-Za-z0-9_?!.]+)/, kind: 'function' },
  ],

  php: [
    { pattern: /^\s*(?:abstract\s+|final\s+)?class\s+([A-Za-z0-9_]+)/, kind: 'class' },
    { pattern: /^\s*interface\s+([A-Za-z0-9_]+)/, kind: 'interface' },
    { pattern: /^\s*(?:public\s+|private\s+|protected\s+|static\s+)*function\s+([A-Za-z0-9_]+)/, kind: 'function' },
  ],

  shell: [{ pattern: /^\s*(?:function\s+)?([A-Za-z0-9_-]+)\s*\(\)\s*\{/, kind: 'function' }],

  css: [{ pattern: /^\s*([.#@][A-Za-z0-9_-][^{;]*?)\s*\{/, kind: 'rule' }],
  scss: [{ pattern: /^\s*([.#@&][A-Za-z0-9_-][^{;]*?)\s*\{/, kind: 'rule' }],

  markdown: [{ pattern: /^(#{1,6})\s+(.+)$/, kind: 'heading', group: 2 }],

  json: [{ pattern: /^\s*"([^"]+)"\s*:\s*[{[]/, kind: 'key' }],
  yaml: [{ pattern: /^([A-Za-z0-9_-]+):/, kind: 'key' }],
  toml: [{ pattern: /^\s*\[([^\]]+)\]/, kind: 'key' }],
};

/** Words that look like declarations but never are. */
const NOT_SYMBOLS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'do', 'else', 'try',
  'constructor', 'function', 'super', 'this',
]);

/** Extract navigable symbols from a document. */
export function extractSymbols(content: string, language: string): DocumentSymbol[] {
  const rules = RULES_BY_LANGUAGE[(language ?? '').toLowerCase()];
  if (!rules || !content) return [];

  const symbols: DocumentSymbol[] = [];
  const lines = content.split('\n');
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    // Skip obvious comment lines so commented-out code doesn't pollute results.
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#!')) return;

    for (const rule of rules) {
      const match = rule.pattern.exec(line);
      if (!match) continue;

      const name = match[rule.group ?? 1]?.trim();
      if (!name || NOT_SYMBOLS.has(name)) continue;

      // One symbol per line - the first matching rule wins.
      const key = `${index}:${name}`;
      if (seen.has(key)) break;
      seen.add(key);

      const indent = /^\s*/.exec(line)?.[0].length ?? 0;
      const depth =
        rule.kind === 'heading' ? (match[1]?.length ?? 1) - 1 : Math.floor(indent / 2);

      symbols.push({ name, kind: rule.kind, line: index + 1, depth });
      break;
    }
  });

  return symbols;
}
