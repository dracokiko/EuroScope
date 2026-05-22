export default async function handler(req, res) {
  const { country = 'DE' } = req.query;
  const countryMap = { 'GM': 'germany', 'FR': 'france', 'PO': 'portugal', 'SP': 'spain', 'UK': 'united kingdom', 'IT': 'italy' };
  const countryName = countryMap[country] || 'europe';

  const rssUrl = `https://news.google.com/rss/search?q=${countryName}+economy+politics&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();
    
    const items = [];
    // Regex melhorada para capturar títulos e links de forma mais robusta
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
      items.push({
        title: match[1].replace('<![CDATA[', '').replace(']]>', ''),
        url: match[2],
        domain: "Google News"
      });
    }

    res.status(200).json({ articles: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}