// api/news.js
export default async function handler(req, res) {
  const { country = 'GM', max = 10 } = req.query;

  // 1. Definição da query
  const themes = ['ECON_ECONOMY', 'GOV_INTERGOVERNMENTAL', 'MILITARY', 'TRADE'];
  const queryStr = `(sourcecountry:${country} (${themes.map(t => `theme:${t}`).join(' OR ')}))`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(queryStr)}&mode=artlist&maxrecords=${max}&format=json&timespan=24h&sort=DateDesc`;

  try {
    // 2. Race Condition: Pedimos ao GDELT com timeout curto (5s)
    // Se falhar, devolvemos um array vazio mas mantemos o sistema vivo
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json(data);
    }
  } catch (e) {
    console.error("GDELT falhou, mas a app não vai cair.");
  }

  // 3. Fallback: Se o GDELT falhar, devolvemos um mock elegante em vez de 504
  res.setHeader('Cache-Control', 's-maxage=60');
  res.status(200).json({
    articles: [{
      title: "News feed currently syncing...",
      url: "#",
      domain: "GDELT Service",
      seendate: new Date().toISOString()
    }]
  });
}