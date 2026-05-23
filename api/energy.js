// /api/energy.js

export default async function handler(req, res) {
    const { country = 'PT' } = req.query;
  
    try {
      const lowerCountry = country.toLowerCase();
  
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = yesterday.toISOString().split('T')[0];
  
      // Fazemos DOIS pedidos em simultâneo: O "Ao Vivo" e a "Capacidade Instalada Oficial"
      const [liveRes, installedRes] = await Promise.all([
        fetch(`https://api.energy-charts.info/public_power?country=${lowerCountry}&start=${startDate}&end=${endDate}`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        }),
        fetch(`https://api.energy-charts.info/installed_power?country=${lowerCountry}`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        })
      ]);
  
      // Lida com o erro 404 (País não suportado)
      if (liveRes.status === 404 || installedRes.status === 404) {
        return res.status(200).json({ country, timestamp: new Date().toISOString(), live_production_mw: null, total_installed_mw: null });
      }
  
      if (!liveRes.ok || !installedRes.ok) {
        throw new Error(`A API rejeitou os pedidos (Erro HTTP)`);
      }
  
      const liveData = await liveRes.json();
      const installedData = await installedRes.json();
      
      // --- 1. PROCESSAR DADOS AO VIVO ---
      const liveProduction = {};
      if (liveData && liveData.production_types) {
        liveData.production_types.forEach(source => {
          const type = source.name;
          const values = source.data;
          let currentMW = 0;
          for (let i = values.length - 1; i >= 0; i--) {
            if (values[i] !== null && values[i] !== undefined) {
              currentMW = values[i];
              break;
            }
          }
          if (currentMW > 0) liveProduction[type] = currentMW;
        });
      }
  
// --- 2. PROCESSAR CAPACIDADE OFICIAL INSTALADA ---
let officialTotalCapacityMW = 0;
    
// A API envia dicionários complexos com arrays de vários anos. 
// Vamos varrer cada fonte de energia, isolar o array temporal, e extrair o ano mais recente.
if (installedData && installedData.production_types) {
  installedData.production_types.forEach(source => {
    const values = source.data;
    if (values && values.length > 0) {
      // Procura de trás para a frente o valor do último ano registado
      let latestMW = 0;
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] !== null && values[i] !== undefined) {
          latestMW = values[i];
          break;
        }
      }
      officialTotalCapacityMW += latestMW;
    }
  });
}

// Retorna os dados combinados perfeitos
return res.status(200).json({
  country: country,
  timestamp: new Date().toISOString(),
  live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null,
  total_installed_mw: officialTotalCapacityMW > 0 ? Math.round(officialTotalCapacityMW) : null
});

} catch (err) {
return res.status(500).json({ error: 'Erro de Servidor: ' + err.message });
}
}