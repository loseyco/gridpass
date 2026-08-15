import { Article } from './types/news';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'after', 'before', 'over', 'into', 'now', 'out', 'up', 'down', 'about', 'more', 'day',
  'racer', 'speedway', 'digest', 'frontstretch', 'motorsport', 'traxion', 'speedcafe',
  'jayski', 'silly', 'season', 'site', 'world', 'outlaws', 'nascar', 'indycar', 'scca',
]);

export function cleanTitle(title: string): string {
  return title
    .replace(/\s*\|\s*racer.*$/i, '')
    .replace(/\s*-\s*racer.*$/i, '')
    .replace(/\s*\|\s*motorsport.*$/i, '')
    .replace(/\s*-\s*motorsport.*$/i, '')
    .replace(/\s*-\s*jayski.*$/i, '')
    .replace(/\s*\|\s*speedcafe.*$/i, '')
    .replace(/\s*\|\s*scca.*$/i, '')
    .replace(/\s*-\s*world of outlaws.*$/i, '')
    .trim();
}

export function extractKeywordTokens(title: string): Set<string> {
  const cleaned = cleanTitle(title);
  const words = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const cleanA = cleanTitle(titleA).toLowerCase();
  const cleanB = cleanTitle(titleB).toLowerCase();

  // Exact normalized match
  if (cleanA === cleanB) return 1.0;

  const tokensA = extractKeywordTokens(titleA);
  const tokensB = extractKeywordTokens(titleB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return intersectionCount / unionSize;
}

export function findMatchingStory(
  incomingTitle: string,
  incomingCategory: string,
  incomingDate: string,
  existingArticles: Article[],
  similarityThreshold = 0.5
): Article | null {
  const incomingTime = new Date(incomingDate).getTime();
  const cleanIncoming = cleanTitle(incomingTitle).toLowerCase();

  for (const article of existingArticles) {
    // 0. Exact title match after source stripping
    const cleanExisting = cleanTitle(article.title || '').toLowerCase();
    if (cleanIncoming === cleanExisting) {
      return article;
    }

    // 1. Published within 72 hours of each other
    const existingTime = new Date(article.published_at || article.created_at || '').getTime();
    if (incomingTime && existingTime) {
      const diffHours = Math.abs(incomingTime - existingTime) / (1000 * 60 * 60);
      if (diffHours > 72) continue;
    }

    // 2. Check title similarity
    const similarity = calculateTitleSimilarity(incomingTitle, article.title || '');
    if (similarity >= similarityThreshold) {
      return article;
    }
  }

  return null;
}
