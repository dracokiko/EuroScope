// /api/energy.js

export default async function handler(req, res) {
  const { country = 'PT' } = req.query;
  const lowerCountry = country.toLowerCase();

  try {
    const fetchOptions = {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    };

    // Forçamos a janela de tempo de Ontem a Hoje para garantir que há sempre matrizes
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split('T')[0];

    const [liveRes, installedRes] = await Promise.all([
      fetch(`https://api.energy-charts.info/public_power?country=${lowerCountry}&start=${startDate}&end=${endDate}`, fetchOptions),
      fetch(`https://api.energy-charts.info/installed_power?country=${lowerCountry}`, fetchOptions)
    ]);

    if (liveRes.status === 429 || installedRes.status === 429) {
      return res.status(200).json({ error: "Rate limit reached. Please try again shortly." });
    }
    if (liveRes.status === 404 || installedRes.status === 404) {
      return res.status(200).json({ live_production_mw: null, total_installed_mw: null, exact_time: null });
    }

    const liveData = await liveRes.json();
    const installedData = await installedRes.json();
    
    const liveProduction = {};
    let exactTimestamp = null;

    if (liveData?.production_types && liveData.unix_seconds) {
      // 1. Procurar o momento cronológico mais recente em que os sensores enviaram dados
      let latestValidIndex = -1;
      const sampleArray = liveData.production_types[0]?.data || [];
      
      for (let i = sampleArray.length - 1; i >= 0; i--) {
        const hasData = liveData.production_types.some(s => s.data[i] !== null && s.data[i] !== undefined);
        if (hasData) {
          latestValidIndex = i;
          break;
        }
      }

      // 2. Extrair a hora exata desse exato momento (UNIX -> ISO)
      if (latestValidIndex !== -1 && liveData.unix_seconds[latestValidIndex]) {
        exactTimestamp = new Date(liveData.unix_seconds[latestValidIndex] * 1000).toISOString();
      }

      // 3. Extrair os MWs de todas as centrais PARA ESSA HORA EXATA (Garante 100% de precisão cruzada)
      liveData.production_types.forEach(source => {
        if (latestValidIndex !== -1) {
           const currentMW = source.data[latestValidIndex];
           if (currentMW > 0) liveProduction[source.name] = currentMW;
        }
      });
    }

    let officialTotalCapacityMW = 0;
    if (Array.isArray(installedData) && installedData.length > 0) {
       const latest = installedData[installedData.length - 1];
       if (latest?.production_types) {
          latest.production_types.forEach(source => {
            if (typeof source.data === 'number') officialTotalCapacityMW += source.data;
          });
       }
    }

    return res.status(200).json({
      timestamp: exactTimestamp, // A hora cirúrgica do sensor!
      live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null,
      total_installed_mw: officialTotalCapacityMW > 0 ? Math.round(officialTotalCapacityMW) : null
    });

  } catch (err) {
    return res.status(500).json({ error: `Server Error: ${err.message}` });
  }
}