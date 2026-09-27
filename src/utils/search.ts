import { CATALOG } from '@/data/catalog';
import type { Product } from '@/types';

export interface SearchResult {
  readonly product: Product;
  readonly score: number;
}

/**
 * Relative importance of each field. A name hit should always outrank a
 * description hit for the same term.
 */
const FIELD_WEIGHTS = {
  name: 3,
  keywords: 2.5,
  zone: 2,
  specs: 1,
  description: 0.5,
} as const;

/** Match quality within a single field. */
const QUALITY = {
  wordPrefix: 1,
  substring: 0.7,
  subsequence: 0.4,
} as const;

/**
 * A subsequence match is only meaningful when it's dense — scattered across a long
 * field, almost any short term "matches" ("sof" is a subsequence of most spec
 * blobs). Cap how far the match may spread relative to the term's length.
 */
const MAX_SUBSEQUENCE_SPREAD = 2.5;
const MIN_SUBSEQUENCE_LENGTH = 4;

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenise = (value: string): string[] => (value ? normalise(value).split(' ') : []);

/**
 * Tightest in-order (but not necessarily contiguous) occurrence of `term` within a
 * single word, as the character span it covers — or `null` if there is none. Scans
 * from each possible start so a later, denser occurrence isn't masked by an earlier
 * sprawling one. Matches never cross a word boundary: an abbreviation lives inside
 * one word, and spanning words matches almost anything ("oled" in "cooler cold").
 */
function subsequenceSpread(word: string, term: string): number | null {
  let tightest: number | null = null;

  for (let start = 0; start < word.length; start += 1) {
    if (word[start] !== term[0]) continue;
    let cursor = 0;
    for (let index = start; index < word.length; index += 1) {
      if (word[index] !== term[cursor]) continue;
      cursor += 1;
      if (cursor === term.length) {
        const spread = index - start + 1;
        if (tightest === null || spread < tightest) tightest = spread;
        break;
      }
    }
  }

  return tightest;
}

/** Best match quality for one term against one already-normalised field. */
function scoreTerm(field: string, term: string, allowSubsequence: boolean): number {
  if (!field || !term) return 0;

  const index = field.indexOf(term);
  if (index === 0 || (index > 0 && field[index - 1] === ' ')) return QUALITY.wordPrefix;
  if (index > 0) return QUALITY.substring;

  // Abbreviated queries ("frstln", "hdphns") — names only, where it's plausible.
  if (!allowSubsequence || term.length < MIN_SUBSEQUENCE_LENGTH) return 0;
  for (const word of field.split(' ')) {
    if (word.length < term.length) continue;
    const spread = subsequenceSpread(word, term);
    if (spread !== null && spread <= term.length * MAX_SUBSEQUENCE_SPREAD) {
      return QUALITY.subsequence;
    }
  }
  return 0;
}

interface WeightedField {
  readonly text: string;
  readonly weight: number;
  /** Long, prose-y fields are substring-only; loose matching there is all noise. */
  readonly allowSubsequence: boolean;
}

function fieldsOf(product: Product): WeightedField[] {
  return [
    { text: normalise(product.name), weight: FIELD_WEIGHTS.name, allowSubsequence: true },
    {
      text: normalise(product.keywords.join(' ')),
      weight: FIELD_WEIGHTS.keywords,
      allowSubsequence: true,
    },
    { text: normalise(product.zone), weight: FIELD_WEIGHTS.zone, allowSubsequence: false },
    {
      text: normalise(product.specs.map((spec) => `${spec.label} ${spec.value}`).join(' ')),
      weight: FIELD_WEIGHTS.specs,
      allowSubsequence: false,
    },
    {
      text: normalise(product.description),
      weight: FIELD_WEIGHTS.description,
      allowSubsequence: false,
    },
  ];
}

// The catalog is static, so the normalised text is computed once.
const FIELD_CACHE = new Map<number, WeightedField[]>(
  CATALOG.map((product) => [product.id, fieldsOf(product)]),
);

/**
 * Rank the catalog against a free-text query. Every query term must hit at least
 * one field, so "oled tv" narrows rather than widens. Returns at most `limit`
 * results, best first, with ties broken by catalog order for stable rendering.
 */
export function searchCatalog(query: string, limit = 6): SearchResult[] {
  const terms = tokenise(query);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const product of CATALOG) {
    const fields = FIELD_CACHE.get(product.id);
    if (!fields) continue;

    let score = 0;
    let matchedEveryTerm = true;

    for (const term of terms) {
      let best = 0;
      for (const field of fields) {
        best = Math.max(
          best,
          scoreTerm(field.text, term, field.allowSubsequence) * field.weight,
        );
      }
      if (best === 0) {
        matchedEveryTerm = false;
        break;
      }
      score += best;
    }

    if (matchedEveryTerm && score > 0) results.push({ product, score });
  }

  return results
    .sort((a, b) => b.score - a.score || a.product.id - b.product.id)
    .slice(0, limit);
}
