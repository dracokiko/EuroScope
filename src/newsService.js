import { cntrToGdelt } from './newsTaxonomy';

const CACHE = new Map(); 
const TTL_MS = 10 * 60 * 1000;

export async function fetchNewsForCountry(countryCode, opts = {}) {
  const { max = 10 } = opts;
  const cacheKey = `${countryCode}:${max}`;

  if (CACHE.has(cacheKey) && Date.now() - CACHE.get(cacheKey).ts < TTL_MS) {
    return CACHE.get(cacheKey).data;
  }

  const fipsCode = cntrToGdelt(countryCode);

  try {
    // Agora bate na TUA API do Vercel, sem bloqueios de CORS!
    const res = await fetch(`/api/news?country=${fipsCode}&max=${max}`);
    
    if (!res.ok) throw new Error(`Erro na API Vercel: ${res.status}`);

    const rawData = await res.json();
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

    const finalResult = { country: countryCode, articles: normalizedArticles };
    CACHE.set(cacheKey, { ts: Date.now(), data: finalResult });
    
    return finalResult;

  } catch (error) {
    console.error(`[News API] Erro ao carregar notícias para ${countryCode}:`, error);
    return { country: countryCode, articles: [] };
  }
}

export function formatNewsDate(seendate) {
  if (!seendate) return "";
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return seendate;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}