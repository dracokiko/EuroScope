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

const DELAY_BETWEEN_REQUESTS_MS = 200;

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
  let error = null;

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
      if (Array.isArray(liveData?.unix_seconds) && liveData.unix_seconds.length > 0) {
        const lastUnix = liveData.unix_seconds[liveData.unix_seconds.length - 1];
        timestamp = new Date(lastUnix * 1000).toISOString();
      }
    } else {
        throw new Error(`Live API failed with status ${liveRes.status}`);
    }
  } catch (err) {
    console.warn(`[cron] live ${code} falhou: ${err.message}`);
    error = err.message;
  }

  await sleep(100);

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
            totalMW += latestGW * 1000;
          }
        });
        if (totalMW > 0) total_installed_mw = Math.round(totalMW);
      }
    } else {
        throw new Error(`Installed API failed with status ${installedRes.status}`);
    }
  } catch (err) {
    console.warn(`[cron] installed ${code} falhou: ${err.message}`);
    error = (error ? error + "; " : "") + err.message;
  }

  const hasCompletedWithoutError = live_production_mw !== null && total_installed_mw !== null && error === null;

  return { live_production_mw, total_installed_mw, timestamp, error, success: hasCompletedWithoutError };
}

export default async function handler(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const startedAt = Date.now();
        const results = {};
        const log = [];
        let overallStatus = 'ok';
        const errorMessages = [];

        for (let i = 0; i < SUPPORTED_COUNTRIES.length; i++) {
            const code = SUPPORTED_COUNTRIES[i];
            const frontendKey = code.toUpperCase();
            try {
            const data = await fetchCountry(code);
            if (data.success) {
                results[frontendKey] = { live_production_mw: data.live_production_mw, total_installed_mw: data.total_installed_mw, timestamp: data.timestamp };
                log.push({
                    code: frontendKey,
                    capacity_gw: data.total_installed_mw ? (data.total_installed_mw / 1000).toFixed(1) : null,
                    has_live: !!data.live_production_mw
                });
            } else {
                overallStatus = 'error';
                const partialMessage = `Country ${frontendKey}: Incomplete data.`;
                errorMessages.push(data.error ? `${partialMessage} Reason: ${data.error}`: partialMessage);
                log.push({ code: frontendKey, error: data.error || 'Incomplete data' });
            }
            } catch (err) {
            overallStatus = 'error';
            errorMessages.push(`Country ${frontendKey}: Fatal error. ${err.message}`);
            log.push({ code: frontendKey, error: err.message });
            }

            if (i < SUPPORTED_COUNTRIES.length - 1) {
            await sleep(DELAY_BETWEEN_REQUESTS_MS);
            }
        }

        if (results.GB) results.UK = results.GB;
        if (results.GR) results.EL = results.GR;

        const payload = {
            generated_at: new Date().toISOString(),
            duration_seconds: ((Date.now() - startedAt) / 1000).toFixed(1),
            countries: results
        };

        let mainBlobError = null;
        let mainBlobUrl = null;
        try {
            const blob = await put('energy-cache.json', JSON.stringify(payload), {
            access: 'private',
            contentType: 'application/json',
            addRandomSuffix: false,
            cacheControlMaxAge: 60 * 60 * 6
            });
            mainBlobUrl = blob.url;
        } catch (err) {
            console.error('[cron] falha ao guardar no blob:', err);
            mainBlobError = err;
            overallStatus = 'error';
            errorMessages.push(`Failed to write main data blob: ${err.message}`);
        }

        const statusPayload = {
            status: overallStatus,
            lastRunAt: new Date().toISOString(),
            message: errorMessages.length > 0 ? errorMessages.join('; ') : 'Job completed successfully.'
        };

        try {
            await put('status.json', JSON.stringify(statusPayload), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
            cacheControlMaxAge: 60 * 5
            });
        } catch(err) {
            console.error('[cron] falha ao guardar status.json no blob:', err);
        }

        if (mainBlobError) {
            return res.status(500).json({ error: 'Blob write failed', details: mainBlobError.message });
        }

        return res.status(200).json({
            success: overallStatus === 'ok',
            blob_url: mainBlobUrl,
            total_countries: Object.keys(results).length,
            duration_seconds: payload.duration_seconds,
            log
        });
    } catch (err) {
        console.error('[cron] fatal error:', err);
        const statusPayload = {
            status: "error",
            lastRunAt: new Date().toISOString(),
            message: `Cron job failed with an unexpected error: ${err.message}`
        };
        try {
             await put('status.json', JSON.stringify(statusPayload), {
              access: 'public',
              contentType: 'application/json',
              addRandomSuffix: false,
              cacheControlMaxAge: 60 * 5
            });
        } catch(putErr) {
            console.error('[cron] falha ao guardar status.json de erro fatal no blob:', putErr);
        }
        return res.status(500).json({ error: 'Fatal error', details: err.message });
    }
}
