import { fetchFeed } from '../lib/news/fetchFeed';
import { scoreArticle } from '../lib/news/scoreArticle';

const COUNTRY_MAP = { 'PT': 'Portugal', 'DE': 'Germany', 'FR': 'France' /* ... resto dos teus */ };

export default async function handler(req, res) {
  const { country = 'DE' } = req.query;
  const name = COUNTRY_MAP[country] || 'Europe';

  try {
    const rawItems = await fetchFeed(name, country);
    
    const processed = rawItems
      .map(item => ({
        title: item.title,
        url: item.link,
        pubDate: item.pubDate,
        creator: item.creator || item.source || 'Unknown',
        contentSnippet: item.contentSnippet,
        score: scoreArticle(item)
      }))
      .filter(a => a.score >= 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.status(200).json({ country: name, articles: processed });
  } catch (err) {
    return res.status(500).json({ error: 'Pipeline failed' });
  }
}