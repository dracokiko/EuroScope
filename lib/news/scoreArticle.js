import { POSITIVE_TERMS, NEGATIVE_TERMS, SOURCE_WEIGHTS } from './constants';

export function scoreArticle(article, config) {
  const text = `${article.title || ''} ${article.contentSnippet || ''}`.toLowerCase();
  let score = 10; // Baseline

  // 1. Word Boundaries (Prioridade 2)
  POSITIVE_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(text)) score += 3;
  });

  NEGATIVE_TERMS.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(text)) score -= 6;
  });

  // 2. Source Credibility (Prioridade 3)
  const url = new URL(article.link);
  const domain = url.hostname.replace('www.', '');
  const sourceWeight = SOURCE_WEIGHTS[domain] || 0;
  score += sourceWeight;

  // 3. Temporal Decay (Prioridade 6 - Freshness)
  const hoursOld = (new Date() - new Date(article.pubDate)) / (1000 * 60 * 60);
  score -= Math.min(hoursOld * 0.5, 5); // Penaliza se tiver mais de 10h

  return score;
}