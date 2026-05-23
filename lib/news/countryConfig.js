// /lib/news/countryConfig.js

export const COUNTRY_CONFIG = {
  // === EUROPA OCIDENTAL E DO SUL ===
  PT: { name: 'Portugal', aliases: ['Portugal', 'Portuguese', 'Lisbon'] },
  PO: { name: 'Portugal', aliases: ['Portugal', 'Portuguese', 'Lisbon'] }, // Fallback mapa antigo

  ES: { name: 'Spain', aliases: ['Spain', 'Spanish', 'Madrid'] },
  SP: { name: 'Spain', aliases: ['Spain', 'Spanish', 'Madrid'] }, // Fallback mapa antigo

  FR: { name: 'France', aliases: ['France', 'French', 'Paris', 'Macron'] },
  
  UK: { name: 'United Kingdom', aliases: ['UK', 'Britain', 'British', 'London'] },
  GB: { name: 'United Kingdom', aliases: ['UK', 'Britain', 'British', 'London'] }, // ISO correto

  IE: { name: 'Ireland', aliases: ['Ireland', 'Irish', 'Dublin'] },

  IT: { name: 'Italy', aliases: ['Italy', 'Italian', 'Rome', 'Meloni'] },
  
  EL: { name: 'Greece', aliases: ['Greece', 'Greek', 'Athens'] },
  GR: { name: 'Greece', aliases: ['Greece', 'Greek', 'Athens'] }, // ISO correto

  MT: { name: 'Malta', aliases: ['Malta', 'Maltese', 'Valletta'] },
  CY: { name: 'Cyprus', aliases: ['Cyprus', 'Cypriot', 'Nicosia'] },

  // === EUROPA CENTRAL E DA-CH ===
  DE: { name: 'Germany', aliases: ['Germany', 'German', 'Berlin', 'Scholz'] },
  GM: { name: 'Germany', aliases: ['Germany', 'German', 'Berlin', 'Scholz'] }, // Fallback mapa antigo

  AT: { name: 'Austria', aliases: ['Austria', 'Austrian', 'Vienna'] },
  
  CH: { name: 'Switzerland', aliases: ['Switzerland', 'Swiss', 'Bern', 'Zurich', 'Geneva'] },
  SZ: { name: 'Switzerland', aliases: ['Switzerland', 'Swiss', 'Bern', 'Zurich', 'Geneva'] }, // Caso o mapa use código alternativo
  
  NL: { name: 'Netherlands', aliases: ['Netherlands', 'Dutch', 'Amsterdam', 'The Hague'] },
  BE: { name: 'Belgium', aliases: ['Belgium', 'Belgian', 'Brussels'] },
  LU: { name: 'Luxembourg', aliases: ['Luxembourg', 'Luxembourgish'] },

  PL: { name: 'Poland', aliases: ['Poland', 'Polish', 'Warsaw'] },
  CZ: { name: 'Czech Republic', aliases: ['Czech Republic', 'Czechia', 'Czech', 'Prague'] },
  SK: { name: 'Slovakia', aliases: ['Slovakia', 'Slovak', 'Bratislava'] },
  HU: { name: 'Hungary', aliases: ['Hungary', 'Hungarian', 'Budapest', 'Orban'] },

  // === EUROPA DO NORTE E BÁLTICOS ===
  SE: { name: 'Sweden', aliases: ['Sweden', 'Swedish', 'Stockholm'] },
  NO: { name: 'Norway', aliases: ['Norway', 'Norwegian', 'Oslo'] },
  DK: { name: 'Denmark', aliases: ['Denmark', 'Danish', 'Copenhagen'] },
  FI: { name: 'Finland', aliases: ['Finland', 'Finnish', 'Helsinki'] },
  IS: { name: 'Iceland', aliases: ['Iceland', 'Icelandic', 'Reykjavik'] },

  EE: { name: 'Estonia', aliases: ['Estonia', 'Estonian', 'Tallinn'] },
  LV: { name: 'Latvia', aliases: ['Latvia', 'Latvian', 'Riga'] },
  LT: { name: 'Lithuania', aliases: ['Lithuania', 'Lithuanian', 'Vilnius'] },

  // === EUROPA DE LESTE E BALCÃS ===
  UA: { name: 'Ukraine', aliases: ['Ukraine', 'Ukrainian', 'Kyiv', 'Kiev', 'Zelensky'] },
  RO: { name: 'Romania', aliases: ['Romania', 'Romanian', 'Bucharest'] },
  BG: { name: 'Bulgaria', aliases: ['Bulgaria', 'Bulgarian', 'Sofia'] },
  
  HR: { name: 'Croatia', aliases: ['Croatia', 'Croatian', 'Zagreb'] },
  SI: { name: 'Slovenia', aliases: ['Slovenia', 'Slovenian', 'Ljubljana'] },
  RS: { name: 'Serbia', aliases: ['Serbia', 'Serbian', 'Belgrade'] },
  BA: { name: 'Bosnia and Herzegovina', aliases: ['Bosnia', 'Bosnian', 'Herzegovina', 'Sarajevo'] },
  ME: { name: 'Montenegro', aliases: ['Montenegro', 'Montenegrin', 'Podgorica'] },
  MK: { name: 'North Macedonia', aliases: ['North Macedonia', 'Macedonia', 'Macedonian', 'Skopje'] },
  AL: { name: 'Albania', aliases: ['Albania', 'Albanian', 'Tirana'] },
  XK: { name: 'Kosovo', aliases: ['Kosovo', 'Kosovar', 'Pristina'] },

  MD: { name: 'Moldova', aliases: ['Moldova', 'Moldovan', 'Chisinau'] },
  BY: { name: 'Belarus', aliases: ['Belarus', 'Belarusian', 'Minsk'] },
  RU: { name: 'Russia', aliases: ['Russia', 'Russian', 'Moscow', 'Putin'] }, // Opcional, mas útil ter para o mapa
  
  // === TRANSCONTINENTAIS E CÁUCASO (Contexto Geopolítico/Económico da UE) ===
  TR: { name: 'Turkey', aliases: ['Turkey', 'Turkiye', 'Turkish', 'Ankara', 'Istanbul', 'Erdogan'] },
  GE: { name: 'Georgia', aliases: ['Georgia', 'Georgian', 'Tbilisi'] },
  AM: { name: 'Armenia', aliases: ['Armenia', 'Armenian', 'Yerevan'] },
  AZ: { name: 'Azerbaijan', aliases: ['Azerbaijan', 'Azerbaijani', 'Baku'] },

  // === MICROESTADOS EUROPEUS ===
  MC: { name: 'Monaco', aliases: ['Monaco', 'Monegasque', 'Monte Carlo'] },
  LI: { name: 'Liechtenstein', aliases: ['Liechtenstein', 'Vaduz'] },
  SM: { name: 'San Marino', aliases: ['San Marino', 'Sammarinese'] },
  AD: { name: 'Andorra', aliases: ['Andorra', 'Andorran', 'Andorra la Vella'] },
  VA: { name: 'Vatican City', aliases: ['Vatican City', 'Vatican', 'Holy See', 'Pope'] }
};