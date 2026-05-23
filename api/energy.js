// /api/energy.js

export default async function handler(req, res) {
    const { country = 'PT' } = req.query;
    const lowerCountry = country.toLowerCase();
  
    try {
      const fetchOptions = {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      };
  
      const [liveRes, installedRes] = await Promise.all([
        fetch(`https://api.energy-charts.info/public_power?country=${lowerCountry}`, fetchOptions),
        fetch(`https://api.energy-charts.info/installed_power?country=${lowerCountry}`, fetchOptions)
      ]);
  
      // Se recebermos 429 (bloqueio temporário) ou 404 (país sem dados)
      if (liveRes.status === 429 || installedRes.status === 429) {
        return res.status(200).json({ error: "Limite de pedidos atingido. Tente novamente em breve." });
      }
      if (liveRes.status === 404 || installedRes.status === 404) {
        return res.status(200).json({ live_production_mw: null, total_installed_mw: null });
      }
  
      const liveData = await liveRes.json();
      const installedData = await installedRes.json();
      
      const liveProduction = {};
      if (liveData?.production_types) {
        liveData.production_types.forEach(source => {
          const values = source.data || [];
          const currentMW = values.findLast(v => v !== null && v !== undefined);
          if (currentMW > 0) liveProduction[source.name] = currentMW;
        });
      }
  
      let officialTotalCapacityMW = 0;
      // Verifica se installedData é um array e se tem conteúdo
      if (Array.isArray(installedData) && installedData.length > 0) {
         const latest = installedData[installedData.length - 1];
         if (latest?.production_types) {
            latest.production_types.forEach(source => {
              if (typeof source.data === 'number') officialTotalCapacityMW += source.data;
            });
         }
      }
  
      return res.status(200).json({
        live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null,
        total_installed_mw: officialTotalCapacityMW > 0 ? Math.round(officialTotalCapacityMW) : null
      });
  
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }