// /api/energy-all.js
// SOLUÇÃO FINAL: usar o stream que o get() já retorna

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
    
    const result = await get('energy-cache.json', {
      access: 'private'
    });
    
    if (!result) {
      console.warn('[energy-all] Blob not found');
      return res.status(503).json({
        error: 'Cache not ready. Run /api/cron/refresh-energy first.',
        generated_at: null,
        countries: {}
      });
    }

    console.log('[energy-all] Reading stream from blob');
    
    // O get() já retorna o conteúdo via .stream
    // Converter o stream para texto
    const chunks = [];
    for await (const chunk of result.stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    const text = buffer.toString('utf-8');
    const data = JSON.parse(text);
    
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
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}