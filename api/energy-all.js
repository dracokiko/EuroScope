// /api/energy-all.js
import { get } from '@vercel/blob';

let memoryCache = null;
let memoryCacheTime = 0;
const MEMORY_TTL_MS = 5 * 60 * 1000; 

export default async function handler(req, res) {
  // 1. Cache em memória
  if (memoryCache && (Date.now() - memoryCacheTime) < MEMORY_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', 'memory-hit');
    return res.status(200).json(memoryCache);
  }

  try {
    // 2. Buscar diretamente com o SDK (autenticado automaticamente)
    const blob = await get('energy-cache.json');
    
    if (!blob) {
      return res.status(503).json({
        error: 'Cache not found. Run /api/cron/refresh-energy first.',
        generated_at: null,
        countries: {}
      });
    }

    const data = await blob.json();

    memoryCache = data;
    memoryCacheTime = Date.now();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', 'blob-hit');
    return res.status(200).json(data);

  } catch (err) {
    console.error('[energy-all] erro:', err);
    return res.status(500).json({ error: err.message });
  }
}