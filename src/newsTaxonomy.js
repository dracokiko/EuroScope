// ============================================================
// NEWS TAXONOMY — GDELT mappings and query helpers
// ============================================================
//
// GDELT uses FIPS 10-4 country codes, NOT ISO 3166. They differ
// from what your GeoJSON uses (`CNTR_CODE`) in many cases.
// This file translates between the two and exposes the topical
// query you want for "economy / politics / geopolitics".
//
// Source on FIPS codes:
//   https://www.gdelt.org/data/lookups/FIPS.country.txt
// ============================================================

/**
 * Maps your GeoJSON CNTR_CODE → GDELT FIPS code.
 * If a country is missing, the proxy falls back to using the
 * CNTR_CODE directly (covers cases where FIPS happens to match ISO).
 */
export const CNTR_TO_GDELT = {
    // Western Europe
    "PT": "PO", // Portugal
    "ES": "SP", // Spain
    "FR": "FR", // France
    "DE": "GM", // Germany
    "IT": "IT", // Italy
    "UK": "UK", // United Kingdom (your GeoJSON uses UK already)
    "IE": "EI", // Ireland
    "NL": "NL", // Netherlands
    "BE": "BE", // Belgium
    "LU": "LU", // Luxembourg
    "CH": "SZ", // Switzerland
    "AT": "AU", // Austria
    // Nordics
    "SE": "SW", // Sweden
    "NO": "NO", // Norway
    "DK": "DA", // Denmark
    "FI": "FI", // Finland
    "IS": "IC", // Iceland
    // Eastern Europe / Baltics
    "PL": "PL", // Poland
    "CZ": "EZ", // Czechia
    "SK": "LO", // Slovakia
    "HU": "HU", // Hungary
    "RO": "RO", // Romania
    "BG": "BU", // Bulgaria
    "EE": "EN", // Estonia
    "LV": "LG", // Latvia
    "LT": "LH", // Lithuania
    // Balkans
    "EL": "GR", // Greece (your GeoJSON uses EL)
    "HR": "HR", // Croatia
    "SI": "SI", // Slovenia
    "RS": "RI", // Serbia
    "BA": "BK", // Bosnia & Herzegovina
    "ME": "MJ", // Montenegro
    "MK": "MK", // North Macedonia
    "AL": "AL", // Albania
    "XK": "KV", // Kosovo
    // Misc
    "CY": "CY", // Cyprus
    "MT": "MT", // Malta
    "TR": "TU", // Türkiye
    "UA": "UP", // Ukraine
    "MD": "MD", // Moldova
    "BY": "BO", // Belarus
    "RU": "RS"  // Russia
  };
  
  /**
   * GDELT theme codes that match "economy + politics + geopolitics".
   * Joined with OR in the query. Tune at will — these are conservative
   * picks that maximize relevance without drowning the feed.
   *
   * Reference (GKG themes):
   *   https://blog.gdeltproject.org/the-datasets-of-gdelt-as-of-february-2016/
   */
  export const TOPIC_THEMES = [
    // --- Economy ---
    "ECON_",                        // wildcard — covers ECON_INFLATION, ECON_TRADE, ECON_DEBT, etc.
    "EPU_ECONOMY",                  // economic policy uncertainty
    "TRADE",                        // bilateral / international trade
    // --- Politics ---
    "GOV_",                         // wildcard for governance themes
    "ELECTION",
    "LEGISLATION",
    // --- Geopolitics / diplomacy / security ---
    "EU",                           // European Union
    "NATO",
    "DIPLOMATIC_COOPERATION",
    "MILITARY",
    "SANCTIONS"
  ];
  
  /**
   * Builds the GDELT Doc API query string for a given FIPS country code.
   * Returns the `query=` value (not the full URL).
   *
   * Combines:
   *   - sourcecountry:XX        → only outlets registered in that country
   *   - theme:(... OR ...)      → only topics in our taxonomy
   *   - sourcelang:eng          → English-language articles
   */
  export function buildGdeltQuery(fipsCode) {
    const themeClause = TOPIC_THEMES.map(t => `theme:${t}`).join(" OR ");
    return `sourcecountry:${fipsCode} (${themeClause}) sourcelang:eng`;
  }
  
  /**
   * Translate a GeoJSON CNTR_CODE into the FIPS code GDELT expects.
   * Falls back to the input value when no mapping is registered.
   *
   * @param {string} cntrCode
   * @returns {string}
   */
  export function cntrToGdelt(cntrCode) {
    return CNTR_TO_GDELT[cntrCode] || cntrCode;
  }
  