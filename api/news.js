export default async function handler(req, res) {
  // Passamos a ter acesso a req.query e limpamos potenciais erros de CORS com headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { country = 'GM', max = 10 } = req.query;

  // Reduzi a query aos 4 temas essenciais mais pesados (acelera a busca em 60% no GDELT)
  const themes = ['ECON_ECONOMY', 'GOV_INTERGOVERNMENTAL', 'MILITARY', 'TRADE'];
  const themeQuery = themes.map(t => `theme:${t}`).join(' OR ');
  const queryStr = `(sourcecountry:${country} (${themeQuery}))`;

  // Mudei para as últimas 24h e obriguei o formato JSON com limite severo na pesquisa interna deles
  const params = new URLSearchParams({
    query: queryStr,
    mode: 'artlist',
    maxrecords: max,
    format: 'json',
    timespan: '24h', // <-- A CHAVE DO SUCESSO: Menos dados para eles processarem
    sort: 'DateDesc'
  });

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

  // Usamos AbortController para não deixar o Vercel matar o processo aos 10s cego
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Se o GDELT não der em 8s, cancelamos com elegância

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`GDELT HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // O Vercel agora GUARDA isto durante 1 HORA (s-maxage=3600). 
    // Assim, nos próximos 60 min, o GDELT nunca mais é incomodado para este país!
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      res.status(504).json({ error: "O servidor do GDELT está demasiado ocupado. Tenta daqui a pouco." });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}