// /api/energy.js

export default async function handler(req, res) {
    const { country = 'PT' } = req.query;
    const lowerCountry = country.toLowerCase();
  
    try {
      const fetchOptions = {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      };
  
      // NOTA: o endpoint /installed_power EXIGE time_step (yearly|monthly).
      // Sem este parâmetro a API devolve 400 e a capacidade nacional fica null.
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
  
      // 429 — rate limit
      if (liveRes.status === 429 || installedRes.status === 429) {
        return res.status(200).json({
          error: "Rate limit reached. Please try again shortly.",
          live_production_mw: null,
          total_installed_mw: null
        });
      }
  
      // ---- LIVE PRODUCTION (public_power) ----
      let liveProduction = {};
      let exactTimestamp = null; // <--- A VARIÁVEL QUE FALTAVA

      if (liveRes.ok) {
        const liveData = await liveRes.json();
        
        if (liveData?.production_types && liveData.unix_seconds) {
          // 1. Procurar o índice cronológico mais recente com dados válidos
          let latestValidIndex = -1;
          const sampleArray = liveData.production_types[0]?.data || [];
          
          for (let i = sampleArray.length - 1; i >= 0; i--) {
            const hasData = liveData.production_types.some(s => s.data[i] !== null && s.data[i] !== undefined);
            if (hasData) {
              latestValidIndex = i;
              break;
            }
          }

          // 2. Extrair a hora exata
          if (latestValidIndex !== -1 && liveData.unix_seconds[latestValidIndex]) {
            exactTimestamp = new Date(liveData.unix_seconds[latestValidIndex] * 1000).toISOString();
          }

          // 3. Extrair os MWs de todas as fontes PARA ESSA HORA EXATA
          liveData.production_types.forEach(source => {
            if (latestValidIndex !== -1) {
               const currentMW = source.data[latestValidIndex];
               if (currentMW > 0) liveProduction[source.name] = currentMW;
            }
          });
        }
      } else {
        console.warn(`[energy] public_power ${lowerCountry} -> ${liveRes.status}`);
      }
  
      // ---- INSTALLED CAPACITY (installed_power) ----
      // IMPORTANTE: A API retorna valores em GW, não MW!
      // Precisamos converter para MW multiplicando por 1000
      let officialTotalCapacityMW = 0;
      if (installedRes.ok) {
        const installedData = await installedRes.json();
        
        if (installedData?.production_types?.length) {
          installedData.production_types.forEach(source => {
            const arr = Array.isArray(source.data) ? source.data : [];
            // último valor não-nulo da série temporal
            let latestValueGW = null;
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i] !== null && arr[i] !== undefined) {
                latestValueGW = arr[i];
                break;
              }
            }
            if (typeof latestValueGW === 'number' && latestValueGW > 0) {
              // Converter de GW para MW
              const latestValueMW = latestValueGW * 1000;
              officialTotalCapacityMW += latestValueMW;
            }
          });
        }
      } else {
        // tipicamente 400 se time_step faltar, ou 404 se o país não existir nesta API
        const body = await installedRes.text().catch(() => '');
        console.warn(
          `[energy] installed_power ${lowerCountry} -> ${installedRes.status} ${body.slice(0, 200)}`
        );
      }
  
      return res.status(200).json({
        timestamp: exactTimestamp,
        live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null,
        total_installed_mw: officialTotalCapacityMW > 0 ? Math.round(officialTotalCapacityMW) : null
      });
  
    } catch (err) {
      console.error('[energy] handler error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
  