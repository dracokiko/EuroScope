// /api/energy-all.js
import { list } from '@vercel/blob';

let memoryCache = null;
let memoryCacheTime = 0;
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 min

export default async function handler(req, res) {
  // Cache em memória (serverless function quente)
  if (memoryCache && (Date.now() - memoryCacheTime) < MEMORY_TTL_MS) {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', 'memory-hit');
    return res.status(200).json(memoryCache);
  }

  try {
    // List devolve URLs pré-assinados, funcionam mesmo com store privado
    const { blobs } = await list({ prefix: 'energy-cache.json', limit: 1 });
    
    if (blobs.length === 0) {
      return res.status(503).json({
        error: 'Cache not ready. Run /api/cron/refresh-energy first.',
        generated_at: null,
        countries: {}
      });
    }

    const blobUrl = blobs[0].url;
    const blobRes = await fetch(blobUrl);
    
    if (!blobRes.ok) {
      throw new Error(`Blob fetch failed: ${blobRes.status}`);
    }
    
    const data = await blobRes.json();

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