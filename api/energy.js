// /api/energy.js

export default async function handler(req, res) {
    // Recebe o país do teu frontend (ex: 'DE', 'PT', 'FR')
    const { country = 'DE' } = req.query;
  
    try {
      // A porta das traseiras: API aberta do Fraunhofer Institute
      const response = await fetch(`https://api.energy-charts.info/public_power?country=${country}`);
      
      if (!response.ok) {
        throw new Error('Falha ao comunicar com os sensores europeus.');
      }
  
      const data = await response.json();
  
      // O Fraunhofer devolve um array com várias fontes (Nuclear, Hydro, Solar, etc.)
      // Vamos extrair o último valor registado (o momento atual) de cada fonte.
      const liveProduction = {};
  
      data.forEach(source => {
        // O nome da fonte (ex: "Nuclear", "Hydro Run-of-River", "Solar")
        const type = source.name;
        
        // O array de valores (em MW). Vamos buscar o último (mais recente)
        const values = source.data;
        const currentMW = values[values.length - 1]; 
  
        // Guardamos apenas se for um valor válido
        if (currentMW !== null && currentMW !== undefined) {
          liveProduction[type] = currentMW;
        }
      });
  
      // Devolvemos para o teu mapa um objeto limpo com o que está a ser produzido AGORA
      return res.status(200).json({
        country: country,
        timestamp: new Date().toISOString(),
        live_production_mw: liveProduction
      });
  
    } catch (err) {
      return res.status(500).json({ error: 'Erro de ligação: ' + err.message });
    }
  }