// /api/cron/refresh-energy.js
//
// Corre 1x por dia (configurado em vercel.json).
// Vai à API energy-charts.info, busca dados de todos os países suportados,
// e guarda o resultado num blob estático que o frontend lê de uma só vez.
//
// Isto resolve:
//   1. Rate limiting da energy-charts.info (a API só é chamada do servidor, 1x/dia)
//   2. Race conditions no frontend (não há fetches por clique)
//   3. Latência (clique = leitura de memória)

import { put } from '@vercel/blob';

const SUPPORTED_COUNTRIES = [
  'at', 'be', 'bg', 'ch', 'cy', 'cz', 'de', 'dk', 'ee', 'es',
  'fi', 'fr', 'gb', 'gr', 'hr', 'hu', 'ie', 'it', 'lt', 'lu',
  'lv', 'nl', 'no', 'pl', 'pt', 'ro', 'se', 'si', 'sk'
];

// energy-charts.info estoura facilmente em paralelo, vamos sequencial com pausa
const DELAY_BETWEEN_REQUESTS_MS = 1500;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchCountry(code) {
  const fetchOptions = {
    headers: { 'Accept': 'application/json', 'User-Agent': 'EuroScope/1.0' },
    signal: AbortSignal.timeout(15000)
  };

  let live_production_mw = null;
  let total_installed_mw = null;
  let timestamp = null;

  // --- LIVE ---
  try {
    const liveRes = await fetch(
      `https://api.energy-charts.info/public_power?country=${code}`,
      fetchOptions
    );
    if (liveRes.ok) {
      const liveData = await liveRes.json();
      if (liveData?.production_types) {
        const live = {};
        liveData.production_types.forEach(source => {
          const values = source.data || [];
          let currentMW = null;
          for (let i = values.length - 1; i >= 0; i--) {
            if (values[i] !== null && values[i] !== undefined) {
              currentMW = values[i];
              break;
            }
          }
          if (currentMW > 0) live[source.name] = currentMW;
        });
        if (Object.keys(live).length > 0) live_production_mw = live;
      }
      // Timestamp do snapshot da API (em segundos UNIX)
      if (Array.isArray(liveData?.unix_seconds) && liveData.unix_seconds.length > 0) {
        const lastUnix = liveData.unix_seconds[liveData.unix_seconds.length - 1];
        timestamp = new Date(lastUnix * 1000).toISOString();
      }
    }
  } catch (err) {
    console.warn(`[cron] live ${code} falhou: ${err.message}`);
  }

  // Pequena pausa entre os dois endpoints do mesmo país
  await sleep(300);

  // --- INSTALLED ---
  try {
    const installedRes = await fetch(
      `https://api.energy-charts.info/installed_power?country=${code}&time_step=yearly&installation_decommission=false`,
      fetchOptions
    );
    if (installedRes.ok) {
      const installedData = await installedRes.json();
      if (installedData?.production_types?.length) {
        let totalMW = 0;
        installedData.production_types.forEach(source => {
          const arr = Array.isArray(source.data) ? source.data : [];
          let latestGW = null;
          for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i] !== null && arr[i] !== undefined) {
              latestGW = arr[i];
              break;
            }
          }
          if (typeof latestGW === 'number' && latestGW > 0) {
            totalMW += latestGW * 1000; // API devolve GW, converter para MW
          }
        });
        if (totalMW > 0) total_installed_mw = Math.round(totalMW);
      }
    }
  } catch (err) {
    console.warn(`[cron] installed ${code} falhou: ${err.message}`);
  }

  return { live_production_mw, total_installed_mw, timestamp };
}

export default async function handler(req, res) {
  // Vercel Cron envia um header de autorização especial
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startedAt = Date.now();
  const results = {};
  const log = [];

  for (let i = 0; i < SUPPORTED_COUNTRIES.length; i++) {
    const code = SUPPORTED_COUNTRIES[i];
    try {
      const data = await fetchCountry(code);
      // Guardar com a key em UPPERCASE (o frontend usa códigos NUTS em maiúsculas: PT, DE, GB)
      const frontendKey = code.toUpperCase();
      results[frontendKey] = data;
      log.push({
        code: frontendKey,
        capacity_gw: data.total_installed_mw ? (data.total_installed_mw / 1000).toFixed(1) : null,
        has_live: !!data.live_production_mw
      });
      console.log(`[cron] ${frontendKey}: capacity=${log[log.length-1].capacity_gw}GW live=${log[log.length-1].has_live}`);
    } catch (err) {
      console.error(`[cron] ${code} erro fatal: ${err.message}`);
      log.push({ code: code.toUpperCase(), error: err.message });
    }

    // Pausa entre países (excepto no último)
    if (i < SUPPORTED_COUNTRIES.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  // Aliases de códigos: o teu mapa usa "UK" (GB) e "EL" (GR) em alguns lugares
  if (results.GB) results.UK = results.GB;
  if (results.GR) results.EL = results.GR;

  const payload = {
    generated_at: new Date().toISOString(),
    duration_seconds: ((Date.now() - startedAt) / 1000).toFixed(1),
    countries: results
  };

  // Guardar no Vercel Blob (público, com cache CDN)
  try {
    const blob = await put('energy-cache.json', JSON.stringify(payload), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,        // queremos sempre o mesmo URL
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 6 // CDN cache 6h (revalidamos a cada cron)
    });

    return res.status(200).json({
      success: true,
      blob_url: blob.url,
      total_countries: Object.keys(results).length,
      duration_seconds: payload.duration_seconds,
      log
    });
  } catch (err) {
    console.error('[cron] falha ao guardar no blob:', err);
    return res.status(500).json({ error: 'Blob write failed', details: err.message });
  }
}
