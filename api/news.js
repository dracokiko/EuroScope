export default async function handler(req, res) {
  const { country = 'DE' } = req.query;

  // Mapa de nomes oficiais (mantemos, mas apenas para a Query)
  const countryNames = {
    'PT': 'Portugal', 'ES': 'Spain', 'FR': 'France', 'DE': 'Germany', 
    'UK': 'United Kingdom', 'IT': 'Italy', 'NL': 'Netherlands', 'BE': 'Belgium',
    'SE': 'Sweden', 'DK': 'Denmark', 'FI': 'Finland', 'NO': 'Norway', 
    'CH': 'Switzerland', 'AT': 'Austria', 'IE': 'Ireland', 'PL': 'Poland',
    'EL': 'Greece', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania',
    'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia', 'SK': 'Slovakia',
    'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania', 'LU': 'Luxembourg',
    'CY': 'Cyprus', 'MT': 'Malta', 'IS': 'Iceland', 'UA': 'Ukraine', 
    'TR': 'Turkey', 'RS': 'Serbia', 'BA': 'Bosnia and Herzegovina', 'ME': 'Montenegro',
    'MK': 'North Macedonia', 'AL': 'Albania', 'MD': 'Moldova', 'GE': 'Georgia',
    'AM': 'Armenia', 'AZ': 'Azerbaijan', 'BY': 'Belarus', 'LI': 'Liechtenstein',
    'MC': 'Monaco', 'SM': 'San Marino', 'AD': 'Andorra', 'VA': 'Vatican City', 'XK': 'Kosovo'
  };

  const name = countryNames[country] || 'Europe';

  // QUERY SEMÂNTICA: Forçamos a entidade país E o contexto obrigatório
  const searchQuery = `"${name}" AND (economy OR politics OR government OR industry OR energy)`;
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();
    
    // Extração robusta
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
    let match;

    // Termos para penalização (o que NÃO queremos em dashboards de inteligência)
    const junkTerms = ['football', 'tourism', 'holiday', 'sport', 'recipe', 'travel'];

    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const title = match[1].replace('<![CDATA[', '').replace(']]>', '');
      const link = match[2];
      const lowerTitle = title.toLowerCase();

      // FILTRO DE RELEVÂNCIA
      const isRelevant = !junkTerms.some(term => lowerTitle.includes(term));
      
      if (isRelevant) {
        items.push({ title, url: link, domain: "Google News" });
      }
    }

    if (items.length === 0) return res.status(404).json({ error: "No relevant intelligence data found." });

    res.setHeader('Cache-Control', 's-maxage=1800');
    return res.status(200).json({ articles: items });
  } catch (error) {
    return res.status(500).json({ error: "Provider failure" });
  }
}