// /api/energy-all.js

import { get } from '@vercel/blob';

let memoryCache = null;
let memoryCacheTime = 0;
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 min

export default async function handler(req, res) {
  console.log('[energy-all] Request received');
  
  // Cache em memória
  if (memoryCache && (Date.now() - memoryCacheTime) < MEMORY_TTL_MS) {
    console.log('[energy-all] Serving from memory cache');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', 'memory-hit');
    return res.status(200).json(memoryCache);
  }

  try {
    console.log('[energy-all] Downloading blob');
    
    const blob = await get('energy-cache.json', {
      access: 'private'
    });
    
    if (!blob) {
      console.warn('[energy-all] Blob not found');
      return res.status(503).json({
        error: 'Cache not ready. Run /api/cron/refresh-energy first.',
        generated_at: null,
        countries: {}
      });
    }

    // DEBUG: ver o que o get() realmente retorna
    console.log('[energy-all] Blob object keys:', Object.keys(blob));
    console.log('[energy-all] Blob type:', typeof blob);
    console.log('[energy-all] Blob constructor:', blob.constructor.name);
    
    // Tentar diferentes formas de ler o conteúdo
    let data;
    
    if (blob.url) {
      // Se tem URL, usar fetch
      console.log('[energy-all] Blob has URL, fetching:', blob.url.substring(0, 50));
      const response = await fetch(blob.url);
      const text = await response.text();
      data = JSON.parse(text);
    } else if (blob.downloadUrl) {
      // Alternativa
      console.log('[energy-all] Using downloadUrl');
      const response = await fetch(blob.downloadUrl);
      const text = await response.text();
      data = JSON.parse(text);
    } else {
      // Último recurso: o blob pode ser os dados diretos
      console.log('[energy-all] Trying direct parse');
      data = JSON.parse(JSON.stringify(blob));
    }
    
    console.log(`[energy-all] Success! Countries: ${Object.keys(data.countries || {}).length}`);

    // Cache
    memoryCache = data;
    memoryCacheTime = Date.now();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', 'blob-hit');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[energy-all] ERROR:', err.message);
    console.error('[energy-all] Stack:', err.stack);
    
    return res.status(500).json({ 
      error: err.message,
      details: err.stack
    });
  }
}