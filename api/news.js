export default async function handler(req, res) {
  const { country = 'DE' } = req.query;

  // Dicionário completo com todos os países do teu EuroScope
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

  const name = countryNames[country] || 'European Union';
  
  // URL formatada para pesquisa precisa
  const rssUrl = `https://news.google.com/rss/search?q=intitle:${encodeURIComponent(name)}+economy+OR+politics&hl=en-US&gl=${country}&ceid=US:en`;
  try {
    const response = await fetch(rssUrl);
    const xml = await response.text();
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      items.push({
        title: match[1].replace('<![CDATA[', '').replace(']]>', ''),
        url: match[2],
        domain: "Google News"
      });
    }
    
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json({ articles: items });
  } catch (error) {
    return res.status(500).json({ error: "Failed" });
  }
}