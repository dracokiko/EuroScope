export default async function handler(req, res) {
  const { country = 'GM', max = 10 } = req.query;

  const themes = ['ECON_ECONOMY', 'ECON_STOCKMARKET', 'GOV_INTERGOVERNMENTAL', 'MILITARY', 'ELECTION', 'TRADE'];
  const themeQuery = themes.map(t => `theme:${t}`).join(' OR ');
  const queryStr = `(sourcecountry:${country} (${themeQuery}))`;

  const params = new URLSearchParams({
    query: queryStr,
    mode: 'artlist',
    maxrecords: max,
    format: 'json',
    timespan: '3d',
    sort: 'DateDesc'
  });

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GDELT Error: ${response.status}`);
    
    const data = await response.json();
    
    // Diz ao Vercel para guardar isto em cache nos servidores deles durante 10 minutos
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}