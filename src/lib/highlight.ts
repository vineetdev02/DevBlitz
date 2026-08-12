/**
 * DevBlitz syntax highlighting engine.
 *
 * A dependency-free tokenizer. The whole document is scanned once into a flat
 * token stream (so block comments and template literals spanning many lines
 * work), then split into per-line token arrays that the editor renders as
 * absolutely-positioned lines behind a transparent textarea.
 *
 * Adding a language means adding one entry to GRAMMARS - the scanner itself is
 * generic.
 */

export type TokenType =
  | 'plain'
  | 'comment'
  | 'string'
  | 'template'
  | 'number'
  | 'keyword'
  | 'control'
  | 'type'
  | 'constant'
  | 'function'
  | 'property'
  | 'variable'
  | 'operator'
  | 'punctuation'
  | 'regexp'
  | 'tag'
  | 'attribute'
  | 'heading'
  | 'link'
  | 'emphasis'
  | 'decorator';

export interface Token {
  type: TokenType;
  value: string;
}

/** Token colors, tuned for a pure-black background. */
export const TOKEN_COLORS: Record<TokenType, string> = {
  plain: '#d4d4d4',
  comment: '#6a9955',
  string: '#ce9178',
  template: '#ce9178',
  number: '#b5cea8',
  keyword: '#569cd6',
  control: '#c586c0',
  type: '#4ec9b0',
  constant: '#4fc1ff',
  function: '#dcdcaa',
  property: '#9cdcfe',
  variable: '#9cdcfe',
  operator: '#d4d4d4',
  punctuation: '#a0a0a0',
  regexp: '#d16969',
  tag: '#569cd6',
  attribute: '#9cdcfe',
  heading: '#569cd6',
  link: '#4fc1ff',
  emphasis: '#d4d4d4',
  decorator: '#dcdcaa',
};

interface Grammar {
  lineComments: string[];
  blockComment?: [string, string];
  /** Quote characters that start a single-line string. */
  quotes: string[];
  /** Quote characters that start a string which may span lines. */
  multilineQuotes: string[];
  keywords: Set<string>;
  control: Set<string>;
  types: Set<string>;
  constants: Set<string>;
  /** Allow `/regex/flags` literals (JS family). */
  regexLiterals: boolean;
  /** Treat `@name` as a decorator (TS/Python/Java). */
  decorators: boolean;
  /** Style `ident:` as a property (JSON, CSS, YAML). */
  colonProperties: boolean;
}

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const EMPTY = new Set<string>();

function grammar(partial: Partial<Grammar>): Grammar {
  return {
    lineComments: ['//'],
    quotes: ['"', "'"],
    multilineQuotes: [],
    keywords: EMPTY,
    control: EMPTY,
    types: EMPTY,
    constants: EMPTY,
    regexLiterals: false,
    decorators: false,
    colonProperties: false,
    ...partial,
  };
}

const JS_CONTROL = 'if else for while do switch case default break continue return try catch finally throw yield await';
const JS_KEYWORDS =
  'var let const function class extends new delete typeof instanceof in of this super import export from as async static get set void with debugger';
const TS_KEYWORDS =
  'interface type enum namespace declare abstract implements public private protected readonly keyof infer is asserts satisfies override module require';
const TS_TYPES =
  'string number boolean any unknown never void object symbol bigint Array Promise Record Partial Readonly Pick Omit Map Set Date RegExp Error JSON Math console window document';

const GRAMMARS: Record<string, Grammar> = {
  javascript: grammar({
    blockComment: ['/*', '*/'],
    quotes: ['"', "'"],
    multilineQuotes: ['`'],
    keywords: words(JS_KEYWORDS),
    control: words(JS_CONTROL),
    types: words(TS_TYPES),
    constants: words('true false null undefined NaN Infinity'),
    regexLiterals: true,
    decorators: true,
  }),
  typescript: grammar({
    blockComment: ['/*', '*/'],
    quotes: ['"', "'"],
    multilineQuotes: ['`'],
    keywords: words(`${JS_KEYWORDS} ${TS_KEYWORDS}`),
    control: words(JS_CONTROL),
    types: words(TS_TYPES),
    constants: words('true false null undefined NaN Infinity'),
    regexLiterals: true,
    decorators: true,
  }),
  python: grammar({
    lineComments: ['#'],
    quotes: ['"', "'"],
    multilineQuotes: ['"""', "'''"],
    keywords: words(
      'def class lambda import from as global nonlocal pass del assert with async await yield self cls'
    ),
    control: words('if elif else for while break continue return try except finally raise match case'),
    types: words('int float str bool list dict set tuple bytes object type Exception range len print'),
    constants: words('True False None NotImplemented Ellipsis'),
    decorators: true,
  }),
  rust: grammar({
    blockComment: ['/*', '*/'],
    quotes: ['"'],
    keywords: words(
      'fn let mut const static struct enum trait impl type use mod pub crate super self as where dyn ref move unsafe extern async await macro_rules'
    ),
    control: words('if else match for while loop break continue return yield'),
    types: words(
      'i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str String Vec Option Result Box Rc Arc HashMap HashSet PathBuf Path'
    ),
    constants: words('true false None Some Ok Err'),
    decorators: false,
  }),
  go: grammar({
    blockComment: ['/*', '*/'],
    quotes: ['"', "'", '`'],
    keywords: words(
      'func var const type struct interface map chan package import go defer range make new len cap append'
    ),
    control: words('if else for switch case default break continue return select fallthrough goto'),
    types: words('string int int8 int16 int32 int64 uint uint8 uint32 uint64 float32 float64 bool byte rune error any'),
    constants: words('true false nil iota'),
  }),
  java: grammar({
    blockComment: ['/*', '*/'],
    keywords: words(
      'class interface enum extends implements package import public private protected static final abstract synchronized volatile transient native new this super instanceof void'
    ),
    control: words('if else for while do switch case default break continue return try catch finally throw throws'),
    types: words('int long short byte char float double boolean String Object List Map Set Integer Double Boolean'),
    constants: words('true false null'),
    decorators: true,
  }),
  c: grammar({
    blockComment: ['/*', '*/'],
    keywords: words(
      'struct union enum typedef static extern const volatile register inline sizeof auto signed unsigned include define ifdef ifndef endif pragma'
    ),
    control: words('if else for while do switch case default break continue return goto'),
    types: words('int char float double void long short size_t bool FILE'),
    constants: words('NULL true false'),
  }),
  csharp: grammar({
    blockComment: ['/*', '*/'],
    keywords: words(
      'class struct interface enum namespace using public private protected internal static readonly const virtual override abstract sealed partial new this base var async await get set record'
    ),
    control: words('if else for foreach while do switch case default break continue return try catch finally throw yield'),
    types: words('int long string bool double float decimal object void var List Dictionary Task IEnumerable'),
    constants: words('true false null'),
    decorators: true,
  }),
  php: grammar({
    lineComments: ['//', '#'],
    blockComment: ['/*', '*/'],
    keywords: words(
      'function class interface trait extends implements public private protected static final abstract namespace use new echo print require include global var const'
    ),
    control: words('if else elseif for foreach while do switch case default break continue return try catch finally throw'),
    types: words('int string bool float array object callable void mixed'),
    constants: words('true false null TRUE FALSE NULL'),
  }),
  ruby: grammar({
    lineComments: ['#'],
    keywords: words('def class module require require_relative include extend attr_accessor attr_reader attr_writer end do lambda proc self new'),
    control: words('if elsif else unless case when while until for break next return yield begin rescue ensure raise then'),
    types: words('String Integer Float Array Hash Symbol Proc Struct'),
    constants: words('true false nil __FILE__'),
  }),
  shell: grammar({
    lineComments: ['#'],
    quotes: ['"', "'"],
    keywords: words('function local export source alias unset declare readonly eval exec set trap'),
    control: words('if then elif else fi for while until do done case esac break continue return in select'),
    types: words('echo cd ls mkdir rm cp mv cat grep sed awk find chmod chown curl wget git npm node python sudo'),
    constants: words('true false'),
  }),
  css: grammar({
    lineComments: [],
    blockComment: ['/*', '*/'],
    keywords: words('important media supports keyframes import charset font-face use tailwind apply layer screen variants'),
    control: EMPTY,
    types: words(
      'inherit initial unset none auto flex grid block inline inline-block absolute relative fixed sticky hidden visible solid dashed dotted center'
    ),
    constants: words('px rem em vh vw fr deg ms'),
    colonProperties: true,
  }),
  json: grammar({
    lineComments: [],
    quotes: ['"'],
    keywords: EMPTY,
    constants: words('true false null'),
    colonProperties: true,
  }),
  yaml: grammar({
    lineComments: ['#'],
    quotes: ['"', "'"],
    keywords: EMPTY,
    constants: words('true false null yes no on off ~'),
    colonProperties: true,
  }),
  toml: grammar({
    lineComments: ['#'],
    quotes: ['"', "'"],
    multilineQuotes: ['"""', "'''"],
    keywords: EMPTY,
    constants: words('true false'),
    colonProperties: true,
  }),
  ini: grammar({
    lineComments: ['#', ';'],
    keywords: EMPTY,
    constants: words('true false yes no'),
    colonProperties: true,
  }),
  sql: grammar({
    lineComments: ['--'],
    blockComment: ['/*', '*/'],
    quotes: ["'", '"'],
    keywords: words(
      'SELECT INSERT UPDATE DELETE FROM WHERE JOIN LEFT RIGHT INNER OUTER ON GROUP ORDER BY HAVING LIMIT OFFSET CREATE TABLE ALTER DROP INDEX VIEW AS INTO VALUES SET PRIMARY KEY FOREIGN REFERENCES DISTINCT UNION ALL'
    ),
    control: words('CASE WHEN THEN ELSE END IF EXISTS'),
    types: words('INT INTEGER VARCHAR TEXT BOOLEAN DATE TIMESTAMP SERIAL FLOAT DECIMAL JSON JSONB UUID'),
    constants: words('NULL TRUE FALSE'),
  }),
  dotenv: grammar({
    lineComments: ['#'],
    keywords: EMPTY,
    colonProperties: true,
  }),
  plaintext: grammar({ lineComments: [], quotes: [], keywords: EMPTY }),
};

/** Fallback for unknown languages: no keywords, no comments, just plain text. */
const PLAINTEXT_GRAMMAR: Grammar = grammar({ lineComments: [], quotes: [], keywords: EMPTY });

/** Languages that share another language's grammar. */
const GRAMMAR_ALIASES: Record<string, string> = {
  jsx: 'javascript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',
  cpp: 'c',
  h: 'c',
  hpp: 'c',
  kotlin: 'java',
  swift: 'java',
  scala: 'java',
  dart: 'java',
  scss: 'css',
  sass: 'css',
  less: 'css',
  powershell: 'shell',
  bash: 'shell',
  zsh: 'shell',
  dockerfile: 'shell',
  makefile: 'shell',
  jsonc: 'json',
  yml: 'yaml',
};

const IDENT_START = /[A-Za-z_$@#]/;
const IDENT_PART = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;
const OPERATOR_CHARS = '+-*/%=<>!&|^~?:';
const PUNCTUATION_CHARS = '{}[]();,.';

function resolveGrammar(language: string): { grammar: Grammar; mode: string } {
  const key = (language || 'plaintext').toLowerCase();
  const resolved = GRAMMAR_ALIASES[key] ?? key;
  return { grammar: GRAMMARS[resolved] ?? PLAINTEXT_GRAMMAR, mode: resolved };
}

/** Languages handled by a dedicated tokenizer rather than the generic scanner. */
function isMarkupLanguage(language: string): 'html' | 'markdown' | null {
  const key = (language || '').toLowerCase();
  if (key === 'html' || key === 'htm' || key === 'xml' || key === 'svg' || key === 'vue' || key === 'svelte') {
    return 'html';
  }
  if (key === 'markdown' || key === 'md') return 'markdown';
  return null;
}

/**
 * Tokenize a whole document into per-line token arrays.
 * The result always has exactly `text.split('\n').length` entries.
 */
export function tokenizeDocument(text: string, language: string): Token[][] {
  const markup = isMarkupLanguage(language);
  const tokens =
    markup === 'html'
      ? scanHtml(text)
      : markup === 'markdown'
        ? scanMarkdown(text)
        : scanGeneric(text, resolveGrammar(language).grammar);

  return splitTokensIntoLines(tokens, text);
}

/** Break a flat token stream on newlines so every line renders independently. */
function splitTokensIntoLines(tokens: Token[], text: string): Token[][] {
  const lines: Token[][] = [[]];

  const appendToLastLine = (token: Token) => {
    const last = lines[lines.length - 1];
    if (last) last.push(token);
  };

  for (const token of tokens) {
    if (!token.value.includes('\n')) {
      if (token.value) appendToLastLine(token);
      continue;
    }

    const parts = token.value.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) appendToLastLine({ type: token.type, value: part });
    });
  }

  // Guard against any drift between the scanner and the raw text.
  const expected = text.split('\n').length;
  while (lines.length < expected) lines.push([]);
  return lines.slice(0, expected);
}

/** The generic scanner used by every non-markup language. */
function scanGeneric(text: string, g: Grammar): Token[] {
  const tokens: Token[] = [];
  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    // Merge runs of the same type to keep the DOM small.
    if (last && last.type === type && !value.includes('\n') && !last.value.includes('\n')) {
      last.value += value;
    } else {
      tokens.push({ type, value });
    }
  };

  let i = 0;
  const len = text.length;
  // Tracks whether a `/` can legally start a regex literal here.
  let regexAllowed = true;

  while (i < len) {
    const char = text[i] ?? '';

    // Whitespace
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      push('plain', char);
      i += 1;
      continue;
    }

    // Block comment
    if (g.blockComment && text.startsWith(g.blockComment[0], i)) {
      const open = g.blockComment[0];
      const close = g.blockComment[1];
      const end = text.indexOf(close, i + open.length);
      const stop = end === -1 ? len : end + close.length;
      push('comment', text.slice(i, stop));
      i = stop;
      regexAllowed = true;
      continue;
    }

    // Line comment
    const lineComment = g.lineComments.find((marker) => text.startsWith(marker, i));
    if (lineComment) {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? len : end;
      push('comment', text.slice(i, stop));
      i = stop;
      regexAllowed = true;
      continue;
    }

    // Multi-line string (""" / ''' / `)
    const multi = g.multilineQuotes.find((q) => text.startsWith(q, i));
    if (multi) {
      const end = findStringEnd(text, i + multi.length, multi);
      push(multi === '`' ? 'template' : 'string', text.slice(i, end));
      i = end;
      regexAllowed = false;
      continue;
    }

    // Single-line string
    if (g.quotes.includes(char)) {
      const end = findStringEnd(text, i + 1, char, true);
      push('string', text.slice(i, end));
      i = end;
      regexAllowed = false;
      continue;
    }

    // Regex literal
    if (char === '/' && g.regexLiterals && regexAllowed) {
      const end = findRegexEnd(text, i);
      if (end > i) {
        push('regexp', text.slice(i, end));
        i = end;
        regexAllowed = false;
        continue;
      }
    }

    // Number (including hex, binary, floats, and CSS #hex colors)
    if (DIGIT.test(char) || (char === '.' && DIGIT.test(text[i + 1] ?? '')) || (char === '#' && g.colonProperties)) {
      const end = readNumber(text, i);
      if (end > i) {
        push('number', text.slice(i, end));
        i = end;
        regexAllowed = false;
        continue;
      }
    }

    // Identifier / keyword
    if (IDENT_START.test(char)) {
      let j = i;
      if (char === '@' || char === '#') j += 1;
      while (j < len && IDENT_PART.test(text[j] ?? '')) j += 1;

      const word = text.slice(i, j);
      const bare = word.replace(/^[@#]/, '');
      const next = nextNonSpace(text, j);

      let type: TokenType = 'plain';

      if (g.decorators && char === '@') {
        type = 'decorator';
      } else if (g.control.has(bare)) {
        type = 'control';
      } else if (g.keywords.has(bare)) {
        type = 'keyword';
      } else if (g.constants.has(bare)) {
        type = 'constant';
      } else if (g.types.has(bare)) {
        type = 'type';
      } else if (next === '(') {
        type = 'function';
      } else if (g.colonProperties && next === ':') {
        type = 'property';
      } else if (/^[A-Z][A-Za-z0-9_]*$/.test(bare)) {
        // PascalCase reads as a type/component; SCREAMING_CASE as a constant.
        type = /^[A-Z0-9_]+$/.test(bare) && bare.length > 1 ? 'constant' : 'type';
      } else if (text[i - 1] === '.') {
        type = 'property';
      } else {
        type = 'variable';
      }

      push(type, word);
      i = j;
      regexAllowed = type === 'keyword' || type === 'control';
      continue;
    }

    // Operators and punctuation
    if (OPERATOR_CHARS.includes(char)) {
      push('operator', char);
      i += 1;
      regexAllowed = true;
      continue;
    }

    if (PUNCTUATION_CHARS.includes(char)) {
      push('punctuation', char);
      i += 1;
      regexAllowed = char !== ')' && char !== ']';
      continue;
    }

    push('plain', char);
    i += 1;
  }

  return tokens;
}

/** Index just past the closing quote, honouring backslash escapes. */
function findStringEnd(text: string, start: number, quote: string, stopAtNewline = false): number {
  let i = start;
  while (i < text.length) {
    const char = text[i];
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (stopAtNewline && char === '\n') return i;
    if (text.startsWith(quote, i)) return i + quote.length;
    i += 1;
  }
  return text.length;
}

/** Index just past a `/regex/flags` literal, or `start` when it isn't one. */
function findRegexEnd(text: string, start: number): number {
  let i = start + 1;
  let inClass = false;

  while (i < text.length) {
    const char = text[i] ?? '';
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (char === '\n') return start;
    if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) {
      i += 1;
      while (i < text.length && /[gimsuyvd]/.test(text[i] ?? '')) i += 1;
      return i;
    }
    i += 1;
  }

  return start;
}

/** Index just past a numeric literal (or CSS hex color) starting at `start`. */
function readNumber(text: string, start: number): number {
  let i = start;

  if (text[i] === '#') {
    i += 1;
    while (i < text.length && /[0-9a-fA-F]/.test(text[i] ?? '')) i += 1;
    return i > start + 1 ? i : start;
  }

  if (text[i] === '0' && /[xXbBoO]/.test(text[i + 1] ?? '')) {
    i += 2;
    while (i < text.length && /[0-9a-fA-F_]/.test(text[i] ?? '')) i += 1;
    return i;
  }

  while (i < text.length && /[0-9_]/.test(text[i] ?? '')) i += 1;
  if (text[i] === '.' && DIGIT.test(text[i + 1] ?? '')) {
    i += 1;
    while (i < text.length && /[0-9_]/.test(text[i] ?? '')) i += 1;
  }
  if (/[eE]/.test(text[i] ?? '') && /[0-9+-]/.test(text[i + 1] ?? '')) {
    i += 2;
    while (i < text.length && DIGIT.test(text[i] ?? '')) i += 1;
  }
  // Trailing unit / suffix: 10px, 3u32, 5n
  while (i < text.length && IDENT_PART.test(text[i] ?? '')) i += 1;

  return i;
}

function nextNonSpace(text: string, from: number): string {
  let i = from;
  while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i += 1;
  return text[i] ?? '';
}

/** Tokenizer for HTML / XML / Vue / Svelte templates. */
function scanHtml(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < text.length) {
    // Comment
    if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i);
      const stop = end === -1 ? text.length : end + 3;
      tokens.push({ type: 'comment', value: text.slice(i, stop) });
      i = stop;
      continue;
    }

    if (text[i] === '<') {
      const end = text.indexOf('>', i);
      const stop = end === -1 ? text.length : end + 1;
      tokens.push(...scanHtmlTag(text.slice(i, stop)));
      i = stop;
      continue;
    }

    // Text content up to the next tag
    const next = text.indexOf('<', i);
    const stop = next === -1 ? text.length : next;
    tokens.push({ type: 'plain', value: text.slice(i, stop) });
    i = stop;
  }

  return tokens;
}

function scanHtmlTag(tag: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  // Opening punctuation: <, </, <!, <?
  const openMatch = /^<[/!?]?/.exec(tag);
  const open = openMatch ? openMatch[0] : '<';
  tokens.push({ type: 'punctuation', value: open });
  i = open.length;

  // Tag name
  const nameMatch = /^[A-Za-z0-9_:.-]+/.exec(tag.slice(i));
  if (nameMatch) {
    tokens.push({ type: 'tag', value: nameMatch[0] });
    i += nameMatch[0].length;
  }

  // Attributes
  while (i < tag.length) {
    const rest = tag.slice(i);

    const space = /^\s+/.exec(rest);
    if (space) {
      tokens.push({ type: 'plain', value: space[0] });
      i += space[0].length;
      continue;
    }

    const closing = /^[/?]?>/.exec(rest);
    if (closing) {
      tokens.push({ type: 'punctuation', value: closing[0] });
      i += closing[0].length;
      continue;
    }

    const attr = /^[@:A-Za-z0-9_.-]+/.exec(rest);
    if (attr) {
      tokens.push({ type: 'attribute', value: attr[0] });
      i += attr[0].length;
      continue;
    }

    if (rest[0] === '=') {
      tokens.push({ type: 'operator', value: '=' });
      i += 1;
      continue;
    }

    const quote = rest[0];
    if (quote === '"' || quote === "'") {
      const end = findStringEnd(tag, i + 1, quote);
      tokens.push({ type: 'string', value: tag.slice(i, end) });
      i = end;
      continue;
    }

    tokens.push({ type: 'plain', value: quote ?? '' });
    i += 1;
  }

  return tokens;
}

/** Line-oriented tokenizer for Markdown. */
function scanMarkdown(text: string): Token[] {
  const tokens: Token[] = [];
  const lines = text.split('\n');
  let inFence = false;

  lines.forEach((line, index) => {
    if (index > 0) tokens.push({ type: 'plain', value: '\n' });

    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      tokens.push({ type: 'string', value: line });
      return;
    }

    if (inFence) {
      tokens.push({ type: 'comment', value: line });
      return;
    }

    if (/^\s{0,3}#{1,6}\s/.test(line)) {
      tokens.push({ type: 'heading', value: line });
      return;
    }

    if (/^\s*>/.test(line)) {
      tokens.push({ type: 'comment', value: line });
      return;
    }

    // Inline: code spans, links, bold/italic, list bullets
    const pattern = /(`[^`]*`)|(\[[^\]]*\]\([^)]*\))|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*]+\*|_[^_]+_)|(^\s*[-*+]\s)|(^\s*\d+\.\s)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > cursor) {
        tokens.push({ type: 'plain', value: line.slice(cursor, match.index) });
      }

      const value = match[0];
      let type: TokenType = 'plain';
      if (match[1]) type = 'string';
      else if (match[2]) type = 'link';
      else if (match[3]) type = 'keyword';
      else if (match[4]) type = 'emphasis';
      else type = 'punctuation';

      tokens.push({ type, value });
      cursor = match.index + value.length;
    }

    if (cursor < line.length) {
      tokens.push({ type: 'plain', value: line.slice(cursor) });
    }
  });

  return tokens;
}

/** Human-readable language label for the status bar. */
export function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    jsx: 'JavaScript JSX',
    tsx: 'TypeScript JSX',
    python: 'Python',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    less: 'Less',
    json: 'JSON',
    yaml: 'YAML',
    toml: 'TOML',
    xml: 'XML',
    markdown: 'Markdown',
    sql: 'SQL',
    shell: 'Shell Script',
    powershell: 'PowerShell',
    ini: 'INI',
    dotenv: 'DotEnv',
    plaintext: 'Plain Text',
  };

  const key = language?.toLowerCase() ?? '';
  const label = labels[key];
  if (label) return label;

  return language ? `${language[0]?.toUpperCase() ?? ''}${language.slice(1)}` : 'Plain Text';
}

/**
 * Comment markers used by the editor's toggle-comment command.
 * `line` is absent for languages with no line-comment syntax (CSS, HTML), so
 * the caller falls back to wrapping the selection in `block`.
 */
export function getCommentTokens(language: string): { line?: string; block?: [string, string] } {
  const markup = isMarkupLanguage(language);
  if (markup) return { block: ['<!--', '-->'] };

  const { grammar: g } = resolveGrammar(language);
  return {
    line: g.lineComments[0],
    block: g.blockComment,
  };
}
