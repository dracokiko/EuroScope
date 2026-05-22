// ============================================================
// newsService.js — client-side fetch com Fallback Chain
// ============================================================

import { cntrToGdelt, buildGdeltQuery } from './newsTaxonomy';

const CACHE = new Map(); 
const TTL_MS = 10 * 60 * 1000; // 10 minutos de cache

// Função utilitária que tenta vários URLs até um funcionar
async function fetchWithFallbacks(targetUrl, signal) {
  const proxies = [
    targetUrl, // 1º Tenta Direto (Funciona para 99% dos utilizadores reais em casa)
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, // 2º Tenta AllOrigins
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` // 3º Tenta CorsProxy
  ];

  let lastError;

  for (const url of proxies) {
    try {
      console.log(`[News API] A tentar conexão via: ${url.includes('api.gdelt') ? 'Direto' : url.split('/')[2]}`);
      const res = await fetch(url, { signal });
      
      if (res.ok) {
        return await res.json();
      } else {
        console.warn(`[News API] Falhou (${res.status}). A passar para o próximo...`);
        lastError = new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`[News API] Erro de rede (CORS/Timeout). A passar para o próximo...`);
      lastError = err;
    }
  }

  throw lastError; // Se os 3 falharem catastroficamente
}

export async function fetchNewsForCountry(countryCode, opts = {}) {
  const { max = 10, signal } = opts;
  const cacheKey = `${countryCode}:${max}`;

  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.data;
  }

  const fipsCode = cntrToGdelt(countryCode);
  const queryStr = buildGdeltQuery(fipsCode);

  const params = new URLSearchParams({
    query: queryStr,
    mode: 'artlist',
    maxrecords: max.toString(),
    format: 'json',
    timespan: '3d',      
    sort: 'DateDesc'     
  });

  const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;

  try {
    // Chama a nossa nova função à prova de falhas
    const rawData = await fetchWithFallbacks(gdeltUrl, signal);
    const rawArticles = rawData.articles || [];

    const normalizedArticles = rawArticles.map(art => ({
      title: art.title,
      url: art.url,
      domain: art.domain,
      source: art.domain || null,
      seendate: art.seendate,
      image: art.socialimage || null,
      language: art.language || 'eng'
    }));

    const finalResult = {
      country: countryCode,
      articles: normalizedArticles
    };

    CACHE.set(cacheKey, { ts: Date.now(), data: finalResult });
    return finalResult;

  } catch (error) {
    console.error(`[News API] Todos os métodos falharam para ${countryCode}:`, error);
    return { country: countryCode, articles: [] };
  }
}

export function invalidateNewsCache(countryCode) {
  if (countryCode) {
    for (const key of CACHE.keys()) {
      if (key.startsWith(`${countryCode}:`)) CACHE.delete(key);
    }
  } else {
    CACHE.clear();
  }
}

export function formatNewsDate(seendate) {
  if (!seendate) return "";
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return seendate;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
  const now = Date.now();
  const diffMin = Math.floor((now - date.getTime()) / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}