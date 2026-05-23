import { fetchFeed } from '../lib/news/fetchFeed.js';
import { COUNTRY_CONFIG } from '../lib/news/countryConfig.js';

export default async function handler(req, res) {
  const { country = 'DE' } = req.query;
  const config = COUNTRY_CONFIG[country] || { name: 'Germany', aliases: ['Germany'] };

  try {
    // Vamos buscar os dados crus
    const rawItems = await fetchFeed(config.name, country);
    
    // Devolvemos 10 artigos tal como vêm do Google, sem filtros
    const articles = (rawItems || []).slice(0, 10).map(item => ({
      title: item.title,
      url: item.link,
      source: "RAW FEED",
      score: 100 // Pontuação falsa só para o site mostrar
    }));

    return res.status(200).json({ 
      country: config.name, 
      count: articles.length,
      articles: articles 
    });

  } catch (err) {
    return res.status(500).json({ error: "FALHA NO FETCH: " + err.message });
  }
}