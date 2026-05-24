// /api/energy-debug.js
// VERSÃO DE DEBUG — retorna a resposta crua da API para inspeção

export default async function handler(req, res) {
    const { country = 'ES' } = req.query;
    const lowerCountry = country.toLowerCase();
  
    try {
      const url = `https://api.energy-charts.info/installed_power?country=${lowerCountry}&time_step=yearly&installation_decommission=false`;
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
  
      const status = response.status;
      const headers = Object.fromEntries(response.headers.entries());
      
      let body;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }
  
      return res.status(200).json({
        debug: true,
        country: lowerCountry,
        url,
        status,
        headers,
        bodyType: typeof body,
        bodyKeys: typeof body === 'object' ? Object.keys(body) : null,
        productionTypesCount: body?.production_types?.length || 0,
        timeArrayLength: body?.time?.length || 0,
        lastThreeYears: body?.time?.slice(-3) || null,
        firstProductionType: body?.production_types?.[0] || null,
        body: body
      });
  
    } catch (err) {
      return res.status(500).json({ 
        error: err.message,
        stack: err.stack
      });
    }
  }
  