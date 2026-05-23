import { fetchFeed } from '../lib/news/fetchFeed.js';
import { scoreArticle } from '../lib/news/scoreArticle.js';
import { normalizeArticles } from '../lib/news/normalizeArticles.js';
import { COUNTRY_CONFIG } from '../lib/news/countryConfig.js';

export default async function handler(req, res) {
  const { country = 'DE' } = req.query;

  // Agora, venha 'DE' ou venha 'GM', a API vai saber lidar
  const config = COUNTRY_CONFIG[country];

  if (!config) {
    return res.status(404).json({ error: "País não suportado ou código inválido: " + country });
  }

  try {
    const rawItems = await fetchFeed(config.name, country);
    const normalized = normalizeArticles(rawItems);

    const processed = normalized
      .map(item => {
        let domain = 'Unknown';
        try {
          if (item.link) domain = new URL(item.link).hostname.replace('www.', '');
        } catch {}

        return {
          title: item.title || 'Untitled',
          url: item.link || '#',
          pubDate: item.pubDate || new Date().toISOString(),
          source: domain,
          contentSnippet: item.contentSnippet || '',
          score: scoreArticle(item, config)
        };
      })
      .filter(a => a.score >= 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.status(200).json({ country: config.name, articles: processed });
  } catch (err) {
    return res.status(500).json({ error: 'Pipeline failed: ' + err.message });
  }
}