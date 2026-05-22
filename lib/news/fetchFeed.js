import Parser from 'rss-parser';
const parser = new Parser();
const CACHE = new Map(); // Cache simples na memória do servidor

export async function fetchFeed(name, countryCode) {
  const cacheKey = countryCode;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

  const query = `"${name}" (economy OR politics OR industry OR energy)`;
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  
  const feed = await parser.parseURL(rssUrl);
  CACHE.set(cacheKey, feed.items);
  
  // Limpar cache após 30 mins
  setTimeout(() => CACHE.delete(cacheKey), 1800000);
  
  return feed.items;
}