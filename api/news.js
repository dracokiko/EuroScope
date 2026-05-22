import { fetchFeed } from '../lib/news/fetchFeed';
import { scoreArticle } from '../lib/news/scoreArticle';
import { normalizeArticles } from '../lib/news/normalizeArticles';
import { COUNTRY_CONFIG } from '../lib/news/countryConfig';

export default async function handler(req, res) {

  const { country = 'DE' } = req.query;

  const config =
    COUNTRY_CONFIG[country] || {
      name: 'Europe',
      aliases: ['Europe']
    };

  try {

    const rawItems =
      await fetchFeed(config.name, country);

    const normalized =
      normalizeArticles(rawItems);

    const processed = normalized
      .map(item => {

        let domain = 'Unknown';

        try {
          domain =
            new URL(item.link)
              .hostname
              .replace('www.', '');
        } catch {}

        return {
          title: item.title,
          url: item.link,
          pubDate: item.pubDate,
          source: domain,
          contentSnippet: item.contentSnippet,
          score: scoreArticle(item, config)
        };
      })
      .filter(a => a.score >= 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.status(200).json({
      country: config.name,
      articles: processed
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: 'Pipeline failed'
    });
  }
}