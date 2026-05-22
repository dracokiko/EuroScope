// ============================================================
// newsService.js — client-side fetch via Open CORS Proxy
// ============================================================

import { cntrToGdelt, buildGdeltQuery } from './newsTaxonomy';

/**
 * @typedef {Object} NewsArticle
 * @property {string} title
 * @property {string} url
 * @property {string} domain
 * @property {string|null} source
 * @property {string} seendate
 * @property {string|null} image
 * @property {string|null} language
 */

const CACHE = new Map(); 
const TTL_MS = 10 * 60 * 1000; // 10 minutos de cache

/**
 * Fetch news for a country bypassing Cloud Workstation IP blocks.
 *
 * @param {string} countryCode  e.g. "PT", "UK", "EL"
 * @param {{ max?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<{ country: string, articles: NewsArticle[] }>}
 */
export async function fetchNewsForCountry(countryCode, opts = {}) {
  const { max = 10, signal } = opts;
  const cacheKey = `${countryCode}:${max}`;

  // 1. Cache hit
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    console.log(`[News Cache] Hit para o país: ${countryCode}`);
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

  // URL original da API do GDELT
  const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
  
  // SOLUÇÃO CRÍTICA: Passamos o pedido através do corsproxy.io para limpar o 429 e o CORS
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(gdeltUrl)}`;

  try {
    console.log(`[News API] A chamar GDELT via Proxy para ${countryCode}`);
    const res = await fetch(proxyUrl, { signal });

    if (!res.ok) {
      throw new Error(`Erro HTTP! Status: ${res.status}`);
    }

    const rawData = await res.json();
    const rawArticles = rawData.articles || [];

    // 2. Normalizar os artigos
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

    // 3. Salvar na cache interna
    CACHE.set(cacheKey, { ts: Date.now(), data: finalResult });
    return finalResult;

  } catch (error) {
    console.error(`[News API] Erro ao contornar restrições para ${countryCode}:`, error);
    // Retorno seguro para não quebrar a UI da Sidebar
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