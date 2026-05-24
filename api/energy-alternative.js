// /api/energy-alternative.js
// VERSÃO ALTERNATIVA: assume que a API retorna GW em vez de MW

export default async function handler(req, res) {
    const { country = 'PT' } = req.query;
    const lowerCountry = country.toLowerCase();
  
    try {
      const fetchOptions = {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      };
  
      const [liveRes, installedRes] = await Promise.all([
        fetch(
          `https://api.energy-charts.info/public_power?country=${lowerCountry}`,
          fetchOptions
        ),
        fetch(
          `https://api.energy-charts.info/installed_power?country=${lowerCountry}&time_step=yearly&installation_decommission=false`,
          fetchOptions
        )
      ]);
  
      if (liveRes.status === 429 || installedRes.status === 429) {
        return res.status(200).json({
          error: "Rate limit reached. Try again later.",
          live_production_mw: null,
          total_installed_mw: null
        });
      }
  
      // ---- LIVE PRODUCTION ----
      let liveProduction = {};
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData?.production_types) {
          liveData.production_types.forEach(source => {
            const values = source.data || [];
            let currentMW = null;
            for (let i = values.length - 1; i >= 0; i--) {
              if (values[i] !== null && values[i] !== undefined) {
                currentMW = values[i];
                break;
              }
            }
            if (currentMW > 0) liveProduction[source.name] = currentMW;
          });
        }
      }
  
      // ---- INSTALLED CAPACITY (ASSUMING GW) ----
      let officialTotalCapacityMW = 0;
      if (installedRes.ok) {
        const installedData = await installedRes.json();
        
        if (installedData?.production_types?.length) {
          installedData.production_types.forEach(source => {
            const arr = Array.isArray(source.data) ? source.data : [];
            let latestValue = null;
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i] !== null && arr[i] !== undefined) {
                latestValue = arr[i];
                break;
              }
            }
            if (typeof latestValue === 'number' && latestValue > 0) {
              // HIPÓTESE: valores já vêm em GW, converter para MW
              officialTotalCapacityMW += (latestValue * 1000);
            }
          });
        }
      } else {
        const body = await installedRes.text().catch(() => '');
        console.warn(
          `[energy-alt] installed_power ${lowerCountry} -> ${installedRes.status} ${body.slice(0, 200)}`
        );
      }
  
      return res.status(200).json({
        live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null,
        total_installed_mw: officialTotalCapacityMW > 0 ? Math.round(officialTotalCapacityMW) : null,
        _note: "This version assumes API returns GW and converts to MW"
      });
  
    } catch (err) {
      console.error('[energy-alt] error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  