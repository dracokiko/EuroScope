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
          error: "Limite de pedidos atingido. Tente novamente em breve.",
          live_production_mw: null,
          total_installed_mw: null
        });
      }
  
      // ---- LIVE PRODUCTION (public_power) ----
      let liveProduction = {};
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData?.production_types) {
          liveData.production_types.forEach(source => {
            const values = source.data || [];
            // findLast pode não existir em runtimes antigos; fallback manual
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
      } else {
        console.warn(`[energy] public_power ${lowerCountry} -> ${liveRes.status}`);
      }
  
      // ---- INSTALLED CAPACITY (installed_power) ----
      // A resposta é um OBJETO: { time: [...anos], production_types: [{ name, data: [n_por_ano] }, ...] }
      // NÃO é um array. E source.data é um ARRAY, não um número.
      let officialTotalCapacityMW = 0;
      if (installedRes.ok) {
        const installedData = await installedRes.json();
        if (installedData?.production_types?.length) {
          installedData.production_types.forEach(source => {
            const arr = Array.isArray(source.data) ? source.data : [];
            // último valor não-nulo da série temporal
            let latestValue = null;
            for (let i = arr.length - 1; i >= 0; i--) {
              if (arr[i] !== null && arr[i] !== undefined) {
                latestValue = arr[i];
                break;
              }
            }
            if (typeof latestValue === 'number' && latestValue > 0) {
              officialTotalCapacityMW += latestValue;
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
        live_production_mw: Object.keys(liveProduction).length > 0 ? liveProduction : null,
        total_installed_mw: officialTotalCapacityMW > 0 ? Math.round(officialTotalCapacityMW) : null
      });
  
    } catch (err) {
      console.error('[energy] handler error:', err);
      return res.status(500).json({ error: err.message });
    }
  }