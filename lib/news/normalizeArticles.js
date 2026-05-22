// /lib/news/normalizeArticles.js

export function normalizeArticles(items) {

    const seen = new Set();
  
    return items.filter(article => {
  
      const normalizedTitle =
        article.title
          ?.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim();
  
      if (!normalizedTitle) return false;
  
      if (seen.has(normalizedTitle)) {
        return false;
      }
  
      seen.add(normalizedTitle);
  
      return true;
    });
  }