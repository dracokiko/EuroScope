import { fetchFeed } from '../lib/news/fetchFeed.js';
import { scoreArticle } from '../lib/news/scoreArticle.js';
import { normalizeArticles } from '../lib/news/normalizeArticles.js';
// O erro 500 acontece aqui se isto faltar:
import { COUNTRY_CONFIG } from '../lib/news/countryConfig.js'; 

export default async function handler(req, res) {
  const { country = 'DE' } = req.query;

  // Garantia absoluta de que config nunca é null
  const config = COUNTRY_CONFIG[country] || {
    name: 'Europe',
    aliases: ['Europe', 'EU', 'European']
  };

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
          // Passamos o item inteiro para o scoreArticle
          score: scoreArticle(item, config)
        };
      })
      .filter(a => a.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.status(200).json({ country: config.name, articles: processed });
  } catch (err) {
    console.error("ERRO DETALHADO:", err);
    return res.status(500).json({ error: 'Pipeline failed: ' + err.message });
  }
}