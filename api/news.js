export default async function handler(req, res) {
  const { country = 'DE' } = req.query;
  const countryMap = { 'GM': 'germany', 'FR': 'france', 'PO': 'portugal', 'SP': 'spain', 'UK': 'united kingdom', 'IT': 'italy' };
  const countryName = countryMap[country] || 'europe';

  const rssUrl = `https://news.google.com/rss/search?q=${countryName}+economy+politics&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();
    
    // Expressão regular simples para extrair títulos e links sem depender de APIs externas
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const content = match[1];
      const title = content.match(/<title>(.*?)<\/title>/)?.[1] || "No title";
      const link = content.match(/<link>(.*?)<\/link>/)?.[1] || "#";
      const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      
      items.push({ title, url: link, domain: "Google News", seendate: pubDate });
    }

    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ articles: items });
  } catch (error) {
    return res.status(500).json({ error: "Failed to parse feed" });
  }
}