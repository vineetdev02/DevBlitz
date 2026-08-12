/**
 * Fuzzy subsequence matching for Quick Open and the Command Palette.
 *
 * Scores the way developers expect: consecutive characters, matches right after
 * a separator, and matches in the file name beat scattered hits deep in a path.
 */

export interface FuzzyMatch {
  score: number;
  /** Indices in the target string that matched, for highlighting. */
  indices: number[];
}

const SEPARATORS = new Set(['/', '\\', '_', '-', '.', ' ', ':']);

/**
 * Match `query` against `target` as a subsequence.
 * Returns null when the query does not match at all.
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, indices: [] };
  if (!target) return null;

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Cheap rejection before doing any scoring work.
  let probe = 0;
  for (let i = 0; i < targetLower.length && probe < queryLower.length; i += 1) {
    if (targetLower[i] === queryLower[probe]) probe += 1;
  }
  if (probe < queryLower.length) return null;

  const indices: number[] = [];
  let score = 0;
  let targetIndex = 0;
  let lastMatchIndex = -1;
  let consecutive = 0;

  for (let q = 0; q < queryLower.length; q += 1) {
    const char = queryLower[q];

    // Prefer the earliest match, but reward a run of consecutive characters by
    // looking ahead one position first.
    while (targetIndex < targetLower.length && targetLower[targetIndex] !== char) {
      targetIndex += 1;
      consecutive = 0;
    }

    if (targetIndex >= targetLower.length) return null;

    indices.push(targetIndex);

    // Base points for any match
    score += 1;

    // Consecutive run bonus, growing with the length of the run
    if (lastMatchIndex === targetIndex - 1) {
      consecutive += 1;
      score += 5 * consecutive;
    } else {
      consecutive = 0;
    }

    // Start-of-word bonus
    const prev = target[targetIndex - 1];
    const current = target[targetIndex];
    if (targetIndex === 0) {
      score += 10;
    } else if (prev !== undefined && SEPARATORS.has(prev)) {
      score += 8;
    } else if (
      prev !== undefined &&
      prev === prev.toLowerCase() &&
      current !== undefined &&
      current === current.toUpperCase()
    ) {
      // camelCase boundary
      score += 6;
    }

    // Exact-case match bonus
    if (target[targetIndex] === query[q]) score += 1;

    lastMatchIndex = targetIndex;
    targetIndex += 1;
  }

  // Penalise long targets slightly so short, precise names win ties.
  score -= Math.min(target.length / 10, 8);

  // Big bonus when the match lands entirely inside the final path segment.
  const lastSeparator = Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\'));
  if (lastSeparator !== -1 && (indices[0] ?? 0) > lastSeparator) {
    score += 15;
  }

  // Prefix match is the strongest possible signal.
  if (targetLower.startsWith(queryLower)) score += 20;

  return { score, indices };
}

export interface RankedItem<T> {
  item: T;
  score: number;
  indices: number[];
}

/**
 * Rank a list by fuzzy relevance, best first.
 * Items that do not match are dropped.
 */
export function fuzzyRank<T>(
  query: string,
  items: T[],
  getText: (item: T) => string,
  limit = 100
): RankedItem<T>[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return items.slice(0, limit).map((item) => ({ item, score: 0, indices: [] }));
  }

  const ranked: RankedItem<T>[] = [];

  for (const item of items) {
    const match = fuzzyMatch(trimmed, getText(item));
    if (match) {
      ranked.push({ item, score: match.score, indices: match.indices });
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}

/**
 * Split a string into matched / unmatched segments for rendering highlights.
 */
export function segmentMatches(
  text: string,
  indices: number[]
): { text: string; matched: boolean }[] {
  if (indices.length === 0) return [{ text, matched: false }];

  const set = new Set(indices);
  const segments: { text: string; matched: boolean }[] = [];
  let current = '';
  let currentMatched = set.has(0);

  for (let i = 0; i < text.length; i += 1) {
    const matched = set.has(i);
    if (matched !== currentMatched) {
      if (current) segments.push({ text: current, matched: currentMatched });
      current = '';
      currentMatched = matched;
    }
    current += text[i];
  }

  if (current) segments.push({ text: current, matched: currentMatched });
  return segments;
}
