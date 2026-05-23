// /api/energy.js

export default async function handler(req, res) {
    const { country = 'PT' } = req.query;
  
    try {
      // 1. O país TEM de estar em minúsculas para esta API funcionar
      const lowerCountry = country.toLowerCase();
  
      // 2. Fazemos o pedido com um "Disfarce" (User-Agent) para não sermos bloqueados pela firewall alemã
      const response = await fetch(`https://api.energy-charts.info/public_power?country=${lowerCountry}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      // 3. Se falhar, a nova mensagem VAI DIZER O CÓDIGO DO ERRO
      if (!response.ok) {
        throw new Error(`A API alemã rejeitou o pedido (Erro HTTP ${response.status})`);
      }
  
      const data = await response.json();
      const liveProduction = {};
  
      data.forEach(source => {
        const type = source.name;
        const values = source.data;
        
        // Vamos buscar o último valor registado hoje
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
      // AQUI ESTÁ A NOVA MENSAGEM. Se vires a antiga, o deploy não atualizou!
      return res.status(500).json({ error: 'Erro de Servidor: ' + err.message });
    }
  }