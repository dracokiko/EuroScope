// /api/energy-all.js
// CORRIGIDO: usa get() do SDK que lida com autenticação automaticamente

import { head, get } from '@vercel/blob';

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
    console.log('[energy-all] Checking if blob exists');
    
    // Verificar se o blob existe (head = metadata sem baixar o conteúdo)
    const blobInfo = await head('energy-cache.json');
    
    if (!blobInfo) {
      console.warn('[energy-all] Blob not found');
      return res.status(503).json({
        error: 'Cache not ready. Run /api/cron/refresh-energy first.',
        generated_at: null,
        countries: {}
      });
    }

    console.log('[energy-all] Blob exists, downloading content');
    
    // get() retorna um BlobResponse com método .json() autenticado
    const blob = await get('energy-cache.json');
    
    if (!blob) {
      throw new Error('Blob get() returned null');
    }

    console.log('[energy-all] Parsing JSON');
    const data = await blob.json();
    
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
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}