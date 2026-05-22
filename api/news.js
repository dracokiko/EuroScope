export default async function handler(req, res) {
  const { country = 'GM' } = req.query;
  
  // Mapeamento para o RSS do Google News
  const countryMap = { 'GM': 'germany', 'FR': 'france', 'PO': 'portugal', 'SP': 'spain', 'UK': 'united kingdom', 'IT': 'italy' };
  const countryName = countryMap[country] || 'europe';

  // Usamos o RSS2JSON para converter o feed do Google em JSON
  const rssUrl = `https://news.google.com/rss/search?q=${countryName}+economy+politics&hl=en-US&gl=US&ceid=US:en`;
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("RSS2JSON falhou");
    
    const data = await response.json();

    const articles = data.items.map(item => ({
      title: item.title,
      url: item.link,
      domain: item.author || 'Google News',
      seendate: item.pubDate,
      image: item.enclosure?.link || null
    }));

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({ articles });
  } catch (error) {
    return res.status(500).json({ error: "Service unavailable" });
  }
}