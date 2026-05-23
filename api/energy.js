// /api/energy.js

export default async function handler(req, res) {
    // Recebe o país do teu frontend (ex: 'PT' ou 'DE')
    const { country = 'DE' } = req.query;
  
    try {
      // 1. TRUQUE: A API do Fraunhofer só aceita códigos minúsculos ('pt', 'de')
      const lowerCountry = country.toLowerCase();
  
      // 2. Faz o pedido à base de dados europeia
      const response = await fetch(`https://api.energy-charts.info/public_power?country=${lowerCountry}`);
      
      if (!response.ok) {
        // Se falhar, agora vai dizer-te o erro exato que o servidor alemão devolveu
        throw new Error(`A API rejeitou o pedido: HTTP ${response.status}`);
      }
  
      const data = await response.json();
      const liveProduction = {};
  
      data.forEach(source => {
        const type = source.name;
        const values = source.data;
        
        // Vamos buscar o último valor registado (o mais recente hoje)
        const currentMW = values[values.length - 1]; 
  
        if (currentMW !== null && currentMW !== undefined) {
          liveProduction[type] = currentMW;
        }
      });
  
      return res.status(200).json({
        country: country,
        timestamp: new Date().toISOString(),
        live_production_mw: liveProduction
      });
  
    } catch (err) {
      return res.status(500).json({ error: 'Erro de ligação: ' + err.message });
    }
  }