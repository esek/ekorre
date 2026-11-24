/**
 * Small fuzzy matching helpers used to match agenda items/posts across
 * meetings. They only need to be good enough for titles written by humans
 * (e.g. "Val av cafémästeriet" vs "Cafémästeriet").
 */

const STOP_WORDS = new Set([
  'val',
  'av',
  'till',
  'och',
  'med',
  'for',
  'de',
  'den',
  'det',
  'en',
  'ett',
]);

/** Lowercase, strip diacritics/punctuation and filler words. */
export function normalizeTitle(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
    .join(' ')
    .trim();
}

const bigrams = (value: string): string[] => {
  const result: string[] = [];
  for (let i = 0; i < value.length - 1; i += 1) {
    result.push(value.slice(i, i + 2));
  }
  return result;
};

/**
 * Similarity between two titles in the range 0..1. Exact normalized matches
 * score 1, substring matches score high and otherwise a blend of token and
 * bigram overlap is used.
 */
export function titleSimilarity(a: string, b: string): number {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);

  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const leftTokens = new Set(left.split(' '));
  const rightTokens = new Set(right.split(' '));
  const sharedTokens = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const tokenScore = (2 * sharedTokens) / (leftTokens.size + rightTokens.size);

  const leftBigrams = bigrams(left);
  const rightBigrams = bigrams(right);
  const rightCounts = new Map<string, number>();
  rightBigrams.forEach((gram) => {
    rightCounts.set(gram, (rightCounts.get(gram) ?? 0) + 1);
  });
  let sharedBigrams = 0;
  leftBigrams.forEach((gram) => {
    const count = rightCounts.get(gram) ?? 0;
    if (count > 0) {
      sharedBigrams += 1;
      rightCounts.set(gram, count - 1);
    }
  });
  const bigramScore = (2 * sharedBigrams) / (leftBigrams.length + rightBigrams.length || 1);

  return Math.max(tokenScore, bigramScore);
}

/**
 * Weighted average of historical durations, weighted by title similarity.
 * Returns `null` when nothing matches well enough.
 */
export function predictSeconds(
  title: string,
  history: { title: string; seconds: number }[],
  minSimilarity = 0.6,
): number | null {
  let weightSum = 0;
  let valueSum = 0;

  history.forEach((entry) => {
    const score = titleSimilarity(title, entry.title);
    if (score < minSimilarity) return;
    weightSum += score;
    valueSum += score * entry.seconds;
  });

  if (weightSum === 0) return null;
  return Math.round(valueSum / weightSum);
}
