// ============================================================
// /api/news  —  Vercel Serverless Function (Node runtime)
// ============================================================
//
// Proxies GDELT 2.0 Doc API.
//   - Solves CORS (you call your own origin instead of GDELT)
//   - Adds edge-style caching via Cache-Control headers
//   - Normalizes the response shape
//
// Usage from the client:
//   GET /api/news?country=PT
//   GET /api/news?country=DE&max=10
//
// Place this file at:  api/news.js  (Vercel auto-detects)
// ============================================================

import { cntrToGdelt, buildGdeltQuery } from "../src/newsTaxonomy.js";
// ↑ Adjust the import path if your taxonomy file lives elsewhere.
//   In a typical Vite project, /src/newsTaxonomy.js is the spot.

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

export default async function handler(req, res) {
  const { country, max = "10" } = req.query;

  if (!country) {
    return res.status(400).json({ error: "Missing 'country' query parameter" });
  }

  const maxRecords = Math.max(1, Math.min(50, parseInt(max, 10) || 10));
  const fipsCode = cntrToGdelt(country.toUpperCase());

  const query = buildGdeltQuery(fipsCode);

  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "JSON",
    maxrecords: String(maxRecords),
    sort: "DateDesc",
    timespan: "3d"          // last 3 days; tweak (e.g. "24h", "1w") if you want
  });

  const upstreamUrl = `${GDELT_ENDPOINT}?${params.toString()}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        // GDELT occasionally serves a generic body without a UA;
        // sending one keeps requests on the happy path.
        "User-Agent": "EuroScope/1.0 (+vercel)"
      }
    });

    if (!upstream.ok) {
      return res.status(502).json({
        error: "Upstream GDELT request failed",
        status: upstream.status
      });
    }

    // GDELT sometimes returns HTML on edge cases (rate limits / bad query).
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Upstream returned non-JSON",
        snippet: text.slice(0, 120)
      });
    }

    const articles = (data.articles || []).map((a) => ({
      title: a.title,
      url: a.url,
      domain: a.domain,
      source: a.sourcecountry || null,
      seendate: a.seendate,          // ISO-like string, e.g. "20250522T143000Z"
      image: a.socialimage || null,
      language: a.language || null
    }));

    // Edge-cached for 10 minutes; client revalidates after that.
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({
      country,
      fips: fipsCode,
      count: articles.length,
      articles
    });
  } catch (err) {
    console.error("news proxy error:", err);
    res.status(500).json({ error: "Internal proxy error" });
  }
}
