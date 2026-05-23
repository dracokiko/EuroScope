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

    // A MUDANÇA CLÍNICA: Abrimos a "gaveta" correta (production_types)
    if (data && data.production_types) {
      data.production_types.forEach(source => {
        const type = source.name;
        const values = source.data;
        
        // Procura de trás para a frente o último valor que não seja 'null'
        let currentMW = 0;
        for (let i = values.length - 1; i >= 0; i--) {
          if (values[i] !== null && values[i] !== undefined) {
            currentMW = values[i];
            break;
          }
        }

        // Só guardamos se a central estiver ativamente a produzir (> 0)
        if (currentMW > 0) {
          liveProduction[type] = currentMW;
        }
      });
    }

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