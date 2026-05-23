// /api/energy.js

export default async function handler(req, res) {
    const { country = 'PT' } = req.query;
  
    try {
      const lowerCountry = country.toLowerCase();
  
      // 1. O TRUQUE DA CINDERELA: Pedir sempre os dados de Ontem + Hoje
      const today = new Date();
      const endDate = today.toISOString().split('T')[0]; // Data de Hoje
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = yesterday.toISOString().split('T')[0]; // Data de Ontem
  
      // 2. Injetar as datas no URL
      const response = await fetch(`https://api.energy-charts.info/public_power?country=${lowerCountry}&start=${startDate}&end=${endDate}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      // 3. Blindagem contra Países sem Dados (Erro 404/400)
      if (response.status === 404 || response.status === 400) {
        return res.status(200).json({ country, timestamp: new Date().toISOString(), live_production_mw: null });
      }
  
      if (!response.ok) {
        throw new Error(`A API rejeitou o pedido (Erro HTTP ${response.status})`);
      }
  
      const data = await response.json();
      const liveProduction = {};
  
      if (data && data.production_types) {
        data.production_types.forEach(source => {
          const type = source.name;
          const values = source.data;
          
          let currentMW = 0;
          // Percorre de trás para a frente (do momento mais recente para o passado)
          for (let i = values.length - 1; i >= 0; i--) {
            if (values[i] !== null && values[i] !== undefined) {
              currentMW = values[i];
              break;
            }
          }
  
          if (currentMW > 0) {
            liveProduction[type] = currentMW;
          }
        });
      }
  
      return res.status(200).json({
        country: country,
        timestamp: new Date().toISOString(),
        live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null
      });
  
    } catch (err) {
      return res.status(500).json({ error: 'Erro de Servidor: ' + err.message });
    }
  }