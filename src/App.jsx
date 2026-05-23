import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { INFO_ESTRATEGICA_REGIOES, IMAGEM_FALLBACK } from './dados_estrategicos';
import { BRANDS_PAISES } from './brands_paises';
import { POWER_PLANTS } from './powerPlants';
import { PORTS_DATA } from './portsData';
import { INDUSTRY_DATA } from './industryData';
import { fetchNewsForCountry, formatNewsDate } from './newsService';



const URL_BASE = "/data/mundo_base.geojson";
const URL_PAISES = "/data/paises.geojson";
const URL_REGIOES = "/data/regioes.geojson";

// ============================================================
// AUTOMATIC LOGO RESOLUTION
//   1. Logo.dev   2. Google Favicons   3. Styled initial
// ============================================================
function BrandLogo({ domain, name }) {
  const [stage, setStage] = useState(0);
  useEffect(() => { setStage(0); }, [domain]);

  if (!domain || stage === 2) {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return (
      <div style={{
        width: '60px', height: '60px',
        background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '24px', fontWeight: '800', letterSpacing: '-1px'
      }}>
        {initial}
      </div>
    );
  }

  const sources = [
    `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=120&format=png`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  ];

  return (
    <img
      key={stage}
      src={sources[stage]}
      alt={name}
      onError={() => setStage(stage + 1)}
      style={{
        width: '60px', height: '60px', objectFit: 'contain',
        borderRadius: '8px', background: '#fff', padding: '6px'
      }}
    />
  );
}

function MapController({ paisSelecionado }) {
  const map = useMap();

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.padding = "0";
      rootElement.style.margin = "0";
      rootElement.style.maxWidth = "100%";
      rootElement.style.width = "100%";
      rootElement.style.textAlign = "left";
    }

    setTimeout(() => {
      map.invalidateSize();
      const europeBounds = [[25, -35], [75, 55]];
      const minimumZoom = map.getBoundsZoom(europeBounds);
      map.setMinZoom(minimumZoom);
      map.setMaxBounds(europeBounds);
    }, 200);
  }, [map]);

  useEffect(() => {
    if (!paisSelecionado) {
      map.setView([50, 10], 3, { animate: true });
    }
  }, [paisSelecionado, map]);

  return null;
}

// Dicionários de cores e ícones
const ENERGY_CONFIG = {
  "Hydro":         { color: "#3b82f6", icon: "💧" },
  "Nuclear":       { color: "#a855f7", icon: "☢️" },
  "Wind Offshore": { color: "#06b6d4", icon: "🌊" },
  "Wind Onshore":  { color: "#22c55e", icon: "🌬️" },
  "Solar":         { color: "#eab308", icon: "☀️" },
  "Thermal":       { color: "#ef4444", icon: "🔥" }
};

const PORTS_CONFIG = {
  "Mega Hub":    { color: "#f97316", icon: "⚓" },
  "Container":   { color: "#3b82f6", icon: "📦" },
  "Liquid Bulk": { color: "#8b5cf6", icon: "🛢️" },
  "Mixed":       { color: "#14b8a6", icon: "🏗️" }
};

const INDUSTRY_CONFIG = {
  "High-Tech":  { color: "#0ea5e9", icon: "🔬" },
  "Chemicals":  { color: "#8b5cf6", icon: "⚗️" },
  "Pharma":     { color: "#10b981", icon: "💊" },
  "Aerospace":  { color: "#3b82f6", icon: "✈️" },
  "Food Tech":  { color: "#f59e0b", icon: "🌾" }
};

// Conversor de Código de País para Emoji de Bandeira
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "";
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Gerador de Ícones com Emojis (Map Pins)
const criarIconePersonalizado = (icone, cor, tamanho) => {
  return L.divIcon({
    className: 'custom-emoji-marker',
    html: `<div style="
      background: ${cor};
      border: 2px solid #0f172a;
      width: ${tamanho}px;
      height: ${tamanho}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${tamanho * 0.55}px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      color: white;
    ">${icone}</div>`,
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2]
  });
};

export default function App() {
  const [dadosBase, setDadosBase] = useState(null);
  const [dadosPaises, setDadosPaises] = useState(null);
  const [dadosRegioes, setDadosRegioes] = useState(null);

  // Three navigation levels
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  const [regiaoSelecionada, setRegiaoSelecionada] = useState(null);
  const [moduloAtivo, setModuloAtivo] = useState(null);

  // Filtros ativos para Energia (Ports e Industry não usam filtros)
  const [filtrosEnergia, setFiltrosEnergia] = useState([]);

  const alternarFiltroEnergia = (tipo) => {
    setFiltrosEnergia(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  // Sidebar HTML/text
  const [info, setInfo] = useState("Click a country to see official data.");
  const [infoRegiao, setInfoRegiao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Brands modal state
  const [brandsAberto, setBrandsAberto] = useState(false);
  const [nomePaisAtual, setNomePaisAtual] = useState("");

  // News modal state
  const [newsAberto, setNewsAberto] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);

  // 1. Load maps
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [resB, resP, resR] = await Promise.all([fetch(URL_BASE), fetch(URL_PAISES), fetch(URL_REGIOES)]);
        setDadosBase(await resB.json());
        setDadosPaises(await resP.json());
        setDadosRegioes(await resR.json());
        setCarregando(false);
      } catch (err) {
        console.error("Failed to load files:", err);
        setCarregando(false);
      }
    };
    loadAll();
  }, []);

  // 2. Click COUNTRY
  const clicarNoPais = async (e) => {
    const layer = e.target;
    const feature = layer.feature;
    const mapa = layer._map;
    if (!mapa) return;

    const originalCode = feature.properties.CNTR_CODE;
    const name = feature.properties.NAME_LATN || feature.properties.NUTS_NAME || "Country";
    const dictionary = { "UK": "GB", "EL": "GR" };
    const searchCode = dictionary[originalCode] || originalCode;

    setInfo(<div><h2 style={{ color: '#10b981' }}>{name}</h2><p className="animate-pulse">Querying databases...</p></div>);
    setPaisSelecionado(originalCode);
    setNomePaisAtual(name);
    setRegiaoSelecionada(null);

    try {
      const [resCountries, resWB] = await Promise.all([
        fetch(`https://restcountries.com/v3.1/alpha/${searchCode}`),
        fetch(`https://api.worldbank.org/v2/country/${searchCode}/indicator/NY.GDP.PCAP.CD?format=json&date=2023`)
      ]);
      const dataCountries = await resCountries.json();
      const dataWB = await resWB.json();
      if (!dataCountries || dataCountries.status === 404) throw new Error("Country not found");

      const country = dataCountries[0];
      const gdpFormatted = (dataWB[1] && dataWB[1][0]?.value) ? Math.round(dataWB[1][0].value).toLocaleString() + " $" : "N/A";

      setInfo(
        <div style={{ textAlign: 'left', fontSize: '11px' }}>
          <img src={country.flags.png} alt="Flag" style={{ width: '60px', borderRadius: '4px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
          <h2 style={{ color: '#10b981', margin: '0', fontSize: '16px' }}>{name}</h2>
          <p style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '12px', marginTop: '2px' }}>{country.capital?.[0] || 'No capital'} • {country.subregion || 'Europe'}</p>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1' }}>
            <p style={{ margin: 0 }}><strong>👥 Pop:</strong> {country.population.toLocaleString()}</p>
            <p style={{ margin: 0 }}><strong>💰 GDP p/c:</strong> {gdpFormatted}</p>
            <p style={{ margin: 0 }}><strong>🌍 Area:</strong> {country.area.toLocaleString()} km²</p>
          </div>
        </div>
      );
    } catch (err) {
      setInfo(<div><h2 style={{ color: '#10b981' }}>{name}</h2><p>Data unavailable.</p></div>);
    }

    const boundsExceptions = { "FR": [[41.3, -5.1], [51.1, 9.5]] };
    if (boundsExceptions[originalCode]) {
      mapa.fitBounds(boundsExceptions[originalCode], { padding: [30, 30], animate: true, duration: 0.8 });
    } else {
      const bounds = layer.getBounds();
      mapa.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 0.8 });
    }
  };

  // 3. Click REGION
  const clicarNaRegiao = (e) => {
    const layer = e.target;
    const feature = layer.feature;
    const regionName = feature.properties.NUTS_NAME;
    const nutsId = feature.properties.NUTS_ID;

    setRegiaoSelecionada(nutsId);

    const regionData = INFO_ESTRATEGICA_REGIOES[nutsId];
    const imgSrc = regionData ? regionData.img : IMAGEM_FALLBACK;
    const description = regionData ? regionData.desc : "Strategic data pending compilation. Analysis modules (Energy, Industry) being calibrated for this NUTS 2 zone.";

    setInfoRegiao(
      <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <img
          src={imgSrc}
          alt={regionName}
          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <h2 style={{ color: '#0ea5e9', margin: '0 0 10px 0', fontSize: '20px' }}>{regionName}</h2>
        <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>{description}</p>
      </div>
    );
  };

// ===== NEWS — handler that opens the modal and fetches articles =====
const abrirNews = async () => {
  if (!paisSelecionado) return;
  setNewsAberto(true);
  setNewsLoading(true);
  setNewsError(null);

  try {
    const data = await fetchNewsForCountry(paisSelecionado);
    if (data && data.articles && data.articles.length > 0) {
      setNewsArticles(data.articles);
    } else {
      setNewsError("No recent economic or geopolitical news found.");
      setNewsArticles([]);
    }
  } catch (err) {
    console.error("Erro:", err);
    setNewsError("Couldn't load news.");
    setNewsArticles([]);
  } finally {
    setNewsLoading(false);
  }
};

  const regioesFiltradas = useMemo(() => {
    if (!dadosRegioes || !paisSelecionado) return null;
    return { type: "FeatureCollection", features: dadosRegioes.features.filter(f => f.properties.CNTR_CODE === paisSelecionado) };
  }, [dadosRegioes, paisSelecionado]);

  const brandsDoPais = useMemo(() => {
    if (!paisSelecionado) return [];
    return BRANDS_PAISES[paisSelecionado] || [];
  }, [paisSelecionado]);

  // Filtrar e preparar centrais elétricas para renderização
  const centraisRenderizadas = useMemo(() => {
    if (moduloAtivo !== 'energy') return [];
    let filtradas = POWER_PLANTS;
    if (filtrosEnergia.length > 0) {
      filtradas = filtradas.filter(p => filtrosEnergia.includes(p.type));
    }
    if (paisSelecionado) {
      filtradas = filtradas.filter(p => p.countryCode === paisSelecionado);
    }
    return filtradas;
  }, [moduloAtivo, filtrosEnergia, paisSelecionado]);

  const statsEnergia = useMemo(() => {
    if (moduloAtivo !== 'energy' || !paisSelecionado) return null;
    const centraisDoPais = POWER_PLANTS.filter(p => p.countryCode === paisSelecionado);
    if (centraisDoPais.length === 0) return null;
    const totalMW = centraisDoPais.reduce((acc, curr) => acc + curr.capacityMW, 0);
    const totalTWh = centraisDoPais.reduce((acc, curr) => acc + curr.annualProductionTWh, 0);
    return { mw: totalMW.toLocaleString(), twh: totalTWh.toFixed(1) };
  }, [moduloAtivo, paisSelecionado]);

  // PORTOS — sem filtros, apenas restrição por país
  const portosRenderizados = useMemo(() => {
    if (moduloAtivo !== 'ports') return [];
    let filtrados = PORTS_DATA;
    if (paisSelecionado) {
      filtrados = filtrados.filter(p => p.countryCode === paisSelecionado);
    }
    return filtrados;
  }, [moduloAtivo, paisSelecionado]);

  // INDÚSTRIA — sem filtros, apenas restrição por país
  const industriasRenderizadas = useMemo(() => {
    if (moduloAtivo !== 'industry') return [];
    let filtradas = INDUSTRY_DATA;
    if (paisSelecionado) {
      filtradas = filtradas.filter(p => p.countryCode === paisSelecionado);
    }
    return filtradas;
  }, [moduloAtivo, paisSelecionado]);

  const statsIndustria = useMemo(() => {
    if (moduloAtivo !== 'industry' || !paisSelecionado) return null;
    const industriasDoPais = INDUSTRY_DATA.filter(p => p.countryCode === paisSelecionado);
    if (industriasDoPais.length === 0) return null;
    const mediaMarketShare = industriasDoPais.reduce((acc, curr) => acc + curr.globalMarketShare, 0) / industriasDoPais.length;
    return { count: industriasDoPais.length, share: mediaMarketShare.toFixed(0) };
  }, [moduloAtivo, paisSelecionado]);

  const statsPortos = useMemo(() => {
    if (moduloAtivo !== 'ports' || !paisSelecionado) return null;
    const portosDoPais = PORTS_DATA.filter(p => p.countryCode === paisSelecionado);
    if (portosDoPais.length === 0) return null;
    const totalTons = portosDoPais.reduce((acc, curr) => acc + curr.cargoMillionTons, 0);
    const totalTeu = portosDoPais.reduce((acc, curr) => acc + curr.teuMillions, 0);
    return { tons: totalTons.toLocaleString(), teu: totalTeu.toFixed(1) };
  }, [moduloAtivo, paisSelecionado]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#0a0f1e', color: 'white', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>

      {/* SIDEBAR */}
      <div style={{ width: '280px', minWidth: '280px', padding: '24px 16px', borderTopRightRadius: '24px', borderBottomRightRadius: '24px', height: '100vh', margin: 0, boxShadow: '10px 0 30px rgba(0,0,0,0.5)', zIndex: 1000, background: '#0a0f1e', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '32px', paddingLeft: '8px', gap: '12px' }}>
          {paisSelecionado && (
            <button
              onClick={() => regiaoSelecionada ? setRegiaoSelecionada(null) : setPaisSelecionado(null)}
              style={{
                width: '32px', height: '32px', minWidth: '32px',
                background: '#1e293b', color: '#0ea5e9',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                transition: 'all 0.2s', marginTop: '2px'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#334155'; }}
              onMouseLeave={(e) => { e.target.style.background = '#1e293b'; }}
            >
              ←
            </button>
          )}

          <div>
            <h2 style={{ color: '#10b981', margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!paisSelecionado && <span style={{ fontSize: '24px' }}>🇪🇺</span>} EuroScope
            </h2>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>INTEL & STRATEGIC DATA</p>
          </div>
        </div>

        <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>

          {/* LEVEL 1: GLOBAL MENU */}
          {!paisSelecionado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '8px', marginBottom: '8px' }}>Active Systems</h3>
              {[{ id: 'energy', label: 'Energy', icon: '⚡' }, { id: 'defense', label: 'Defense', icon: '🛡️' }, { id: 'industry', label: 'Industry', icon: '🏗️' }, { id: 'ports', label: 'Ports', icon: '⚓' }].map((item) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    onClick={() => {
                      setModuloAtivo(item.id === moduloAtivo ? null : item.id);
                      if (item.id !== 'energy') setFiltrosEnergia([]);
                    }}
                    style={{ padding: '10px 14px', background: moduloAtivo === item.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: moduloAtivo === item.id ? 'rgba(16, 185, 129, 0.3)' : 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    <span style={{ fontSize: '16px', opacity: moduloAtivo === item.id ? 1 : 0.6 }}>{item.icon}</span>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: moduloAtivo === item.id ? '#10b981' : '#cbd5e1' }}>{item.label}</div>
                  </div>

                  {/* SUBFILTROS DE ENERGIA (único módulo com filtros) */}
                  {moduloAtivo === 'energy' && item.id === 'energy' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '14px', marginTop: '4px', animation: 'fadeIn 0.3s ease' }}>
                      {Object.keys(ENERGY_CONFIG).map(tipo => {
                        const isActive = filtrosEnergia.includes(tipo);
                        const conf = ENERGY_CONFIG[tipo];
                        return (
                          <span
                            key={tipo}
                            onClick={() => alternarFiltroEnergia(tipo)}
                            style={{
                              fontSize: '10px', fontWeight: '600', padding: '4px 8px', borderRadius: '20px', cursor: 'pointer',
                              background: isActive ? `${conf.color}30` : 'rgba(255,255,255,0.05)',
                              color: isActive ? conf.color : '#64748b',
                              border: `1px solid ${isActive ? conf.color : 'rgba(255,255,255,0.1)'}`,
                              transition: 'all 0.2s'
                            }}
                          >
                            {conf.icon} {tipo}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

          /* LEVEL 3: REGION SELECTED */
          ) : regiaoSelecionada ? (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {infoRegiao}
            </div>

          /* LEVEL 2: COUNTRY SELECTED */
          ) : (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                {info}
              </div>

              {/* PAINEL DE ESTATÍSTICAS DE ENERGIA DO PAÍS */}
              {moduloAtivo === 'energy' && statsEnergia && (
                <div style={{ marginTop: '12px', padding: '16px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animation: 'fadeIn 0.4s ease' }}>
                  <h3 style={{ fontSize: '11px', color: '#10b981', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>⚡ Energy Overview Detectado</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Capacidade Instalada:</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{statsEnergia.mw} MW</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Produção Anual:</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{statsEnergia.twh} TWh</strong>
                  </div>
                </div>
              )}

              {/* PAINEL DE ESTATÍSTICAS DOS PORTOS */}
              {moduloAtivo === 'ports' && statsPortos && (
                <div style={{ marginTop: '12px', padding: '16px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))', borderRadius: '16px', border: '1px solid rgba(249, 115, 22, 0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animation: 'fadeIn 0.4s ease' }}>
                  <h3 style={{ fontSize: '11px', color: '#f97316', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>⚓ Maritime Intel</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Cargo Tonnage:</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{statsPortos.tons}M Tons</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Container Traffic:</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{statsPortos.teu}M TEU</strong>
                  </div>
                </div>
              )}

              {/* PAINEL DE ESTATÍSTICAS DA INDÚSTRIA */}
              {moduloAtivo === 'industry' && statsIndustria && (
                <div style={{ marginTop: '12px', padding: '16px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))', borderRadius: '16px', border: '1px solid rgba(14, 165, 233, 0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', animation: 'fadeIn 0.4s ease' }}>
                  <h3 style={{ fontSize: '11px', color: '#0ea5e9', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>🏭 Strategic Monopolies</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Tech Monopolies:</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{statsIndustria.count} Units</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Avg Global Market Share:</span>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>~{statsIndustria.share}%</strong>
                  </div>
                </div>
              )}

              {/* BRANDS BUTTON */}
              <button
                onClick={() => setBrandsAberto(true)}
                style={{
                  marginTop: '12px', width: '100%', padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(16, 185, 129, 0.15))',
                  border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '14px',
                  color: '#0ea5e9', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(16, 185, 129, 0.25))';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(16, 185, 129, 0.15))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.1)';
                }}
              >
                <span style={{ fontSize: '16px' }}>🏷️</span>
                <span>BRANDS</span>
              </button>

              {/* NEWS BUTTON */}
              <button
                onClick={abrirNews}
                style={{
                  marginTop: '8px', width: '100%', padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))',
                  border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '14px',
                  color: '#a855f7', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.25))';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '16px' }}>📰</span>
                <span>NEWS</span>
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: '#475569', textAlign: 'center' }}>
          v2.5.0 • Live Intel
        </div>
      </div>

      {/* MAP */}
      <div style={{ flexGrow: 1, height: '100vh', position: 'relative', background: '#b3e5fc', overflow: 'hidden' }}>
        <MapContainer preferCanvas={true} center={[45, 5]} zoom={3} zoomSnap={0.25} zoomControl={false} zoomAnimationThreshold={10} style={{ height: '100%', width: '100%', background: '#b3e5fc' }}>
          <MapController paisSelecionado={paisSelecionado} />

          {/* LAYER 0: UNIFIED WORLD */}
          {dadosBase && (
            <GeoJSON
              data={dadosBase}
              style={{ color: 'transparent', fillColor: '#1e293b', fillOpacity: 1 }}
              interactive={false}
            />
          )}

          {/* Layer 1: Countries */}
          {dadosPaises && (
            <GeoJSON
              key={`paises-${paisSelecionado || 'global'}`}
              data={{
                ...dadosPaises,
                features: dadosPaises.features.filter(f => f.properties.CNTR_CODE !== paisSelecionado)
              }}
              style={{ color: '#002677', weight: 1, fillColor: '#003399', fillOpacity: 0.9 }}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: clicarNoPais,
                  mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9, fillColor: '#FFCC00' }),
                  mouseout: (e) => e.target.setStyle({ fillOpacity: 0.9, fillColor: '#003399' })
                });
              }}
            />
          )}

          {/* Layer 2: NUTS 2 Regions */}
          {paisSelecionado && regioesFiltradas && (
            <GeoJSON
              key={paisSelecionado}
              data={regioesFiltradas}
              smoothFactor={1.5}
              style={{ color: '#fff', weight: 1, fillColor: '#10b981', fillOpacity: 0.5 }}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: clicarNaRegiao,
                  mouseover: (e) => e.target.setStyle({ fillOpacity: 0.8, fillColor: '#0ea5e9' }),
                  mouseout: (e) => e.target.setStyle({ fillOpacity: 0.5, fillColor: '#10b981' })
                });
              }}
            />
          )}

          {/* CAMADA DE CENTRAIS ELÉTRICAS */}
          {centraisRenderizadas.map((plant) => {
            const conf = ENERGY_CONFIG[plant.type];
            const tamanhoCalculado = Math.max(24, Math.min(34, 18 + Math.sqrt(plant.capacityMW) / 4));

            return (
              <Marker
                key={plant.id}
                position={plant.coordinates}
                icon={criarIconePersonalizado(conf.icon, conf.color, tamanhoCalculado)}
              >
                <Tooltip direction="auto" offset={[0, -(tamanhoCalculado / 2)]} opacity={1} className="custom-energy-tooltip">
                  <div style={{ width: '260px', background: '#0f172a', border: `1px solid ${conf.color}`, borderRadius: '12px', overflow: 'hidden', color: 'white', fontFamily: 'sans-serif', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>

                    {plant.image && (
                      <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                        <img src={plant.image} alt={plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, #0f172a 100%)' }}></div>
                      </div>
                    )}

                    <div style={{ padding: '16px', paddingTop: plant.image ? '4px' : '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', whiteSpace: 'normal' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff', paddingRight: '8px', lineHeight: '1.2' }}>{plant.name} {getFlagEmoji(plant.countryCode)}</h4>
                        <span style={{ background: `${conf.color}20`, color: conf.color, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: `1px solid ${conf.color}`, whiteSpace: 'nowrap' }}>
                          {conf.icon} {plant.type}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Capacity:</span>
                          <strong style={{ color: '#fff' }}>{plant.capacityMW.toLocaleString()} MW</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Production:</span>
                          <strong style={{ color: '#fff' }}>{plant.annualProductionTWh} TWh</strong>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.4', whiteSpace: 'normal' }}>
                        {plant.curiosity}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

          {/* CAMADA DE PORTOS */}
          {portosRenderizados.map((port) => {
            const conf = PORTS_CONFIG[port.type];
            const tamanhoCalculado = Math.max(24, Math.min(34, 18 + Math.sqrt(port.cargoMillionTons)));

            return (
              <Marker
                key={port.id}
                position={port.coordinates}
                icon={criarIconePersonalizado(conf.icon, conf.color, tamanhoCalculado)}
              >
                <Tooltip direction="auto" offset={[0, -(tamanhoCalculado / 2)]} opacity={1} className="custom-energy-tooltip">
                  <div style={{ width: '260px', background: '#0f172a', border: `1px solid ${conf.color}`, borderRadius: '12px', overflow: 'hidden', color: 'white', fontFamily: 'sans-serif', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>

                    {port.image && (
                      <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                        <img src={port.image} alt={port.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, #0f172a 100%)' }}></div>
                      </div>
                    )}

                    <div style={{ padding: '16px', paddingTop: port.image ? '4px' : '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', whiteSpace: 'normal' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff', paddingRight: '8px', lineHeight: '1.2' }}>{port.name} {getFlagEmoji(port.countryCode)}</h4>
                        <span style={{ background: `${conf.color}20`, color: conf.color, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: `1px solid ${conf.color}`, whiteSpace: 'nowrap' }}>
                          {conf.icon} {port.type}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Total Cargo:</span>
                          <strong style={{ color: '#fff' }}>{port.cargoMillionTons}M Tons</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Containers:</span>
                          <strong style={{ color: '#fff' }}>{port.teuMillions}M TEU</strong>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.4', whiteSpace: 'normal' }}>
                        {port.curiosity}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

          {/* CAMADA DE INDÚSTRIA */}
          {industriasRenderizadas.map((ind) => {
            const conf = INDUSTRY_CONFIG[ind.type];
            const tamanhoCalculado = Math.max(26, Math.min(36, 15 + (ind.globalMarketShare / 4)));

            return (
              <Marker
                key={ind.id}
                position={ind.coordinates}
                icon={criarIconePersonalizado(conf.icon, conf.color, tamanhoCalculado)}
              >
                <Tooltip direction="auto" offset={[0, -(tamanhoCalculado / 2)]} opacity={1} className="custom-energy-tooltip">
                  <div style={{ width: '260px', background: '#0f172a', border: `1px solid ${conf.color}`, borderRadius: '12px', overflow: 'hidden', color: 'white', fontFamily: 'sans-serif', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>

                    {ind.image && (
                      <div style={{ width: '100%', height: '140px', position: 'relative' }}>
                        <img src={ind.image} alt={ind.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, #0f172a 100%)' }}></div>
                      </div>
                    )}

                    <div style={{ padding: '16px', paddingTop: ind.image ? '4px' : '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', whiteSpace: 'normal' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff', paddingRight: '8px', lineHeight: '1.2' }}>{ind.name} {getFlagEmoji(ind.countryCode)}</h4>
                        <span style={{ background: `${conf.color}20`, color: conf.color, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: `1px solid ${conf.color}`, whiteSpace: 'nowrap' }}>
                          {conf.icon} {ind.type}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Key Product:</span>
                          <strong style={{ color: '#fff', textAlign: 'right', paddingLeft: '8px' }}>{ind.keyProduct}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>Global Market Share:</span>
                          <strong style={{ color: '#10b981' }}>{ind.globalMarketShare}%</strong>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.4', whiteSpace: 'normal' }}>
                        {ind.curiosity}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* BRANDS MODAL */}
      {brandsAberto && (
        <div
          onClick={() => setBrandsAberto(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 15, 30, 0.75)', backdropFilter: 'blur(8px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(160deg, #0f172a, #1e293b)',
              border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '24px',
              padding: '32px', maxWidth: '640px', width: '90%', maxHeight: '80vh',
              overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative'
            }}
          >
            <button
              onClick={() => setBrandsAberto(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '32px', height: '32px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '700', letterSpacing: '1.5px', margin: 0, textTransform: 'uppercase' }}>
                🏷️ Brands
              </p>
              <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0', letterSpacing: '-0.5px' }}>
                Brands of {nomePaisAtual}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                The most well-known companies of the country
              </p>
            </div>

            {brandsDoPais.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {brandsDoPais.map((brand, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px', padding: '16px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s ease', cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(14, 165, 233, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <BrandLogo domain={brand.domain} name={brand.name} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#fff', fontSize: '13px', fontWeight: '700', margin: 0 }}>{brand.name}</p>
                      {brand.sector && (
                        <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0' }}>{brand.sector}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', borderRadius: '14px',
                border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>📦</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  No brands have been compiled yet for this country.
                </p>
                <p style={{ color: '#475569', fontSize: '11px', marginTop: '8px' }}>
                  Add them in <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>BRANDS_PAISES</code> in <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>brands_paises.js</code>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEWS MODAL */}
      {newsAberto && (
        <div
          onClick={() => setNewsAberto(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 8, 18, 0.82)',
            backdropFilter: 'blur(12px) saturate(140%)',
            WebkitBackdropFilter: 'blur(12px) saturate(140%)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'linear-gradient(160deg, #0b1120 0%, #0f172a 60%, #1a1f3a 100%)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '20px',
        padding: '28px 28px 24px 28px',
        maxWidth: '720px',
        width: '92%',
        maxHeight: '86vh',
        overflowY: 'auto',
        boxShadow: '0 25px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(168, 85, 247, 0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
      }}
          >

        {/* Subtle grid pattern overlay for "terminal" feel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
        background: 'radial-gradient(circle at 20% 0%, rgba(168, 85, 247, 0.12), transparent 60%)',
        borderRadius: '20px 20px 0 0',
        pointerEvents: 'none'
      }} />

            <button
        onClick={() => setNewsAberto(false)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          e.currentTarget.style.color = '#fca5a5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#94a3b8';
        }}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          width: '32px', height: '32px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#94a3b8',
          cursor: 'pointer', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s ease',
          zIndex: 2
        }}
            >
              ✕
            </button>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#a855f7', fontWeight: '700', letterSpacing: '1.5px', margin: 0, textTransform: 'uppercase' }}>
                📰 Latest News
              </p>
              <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0', letterSpacing: '-0.5px' }}>
                {nomePaisAtual}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                Economy · Politics · Geopolitics · Today
              </p>
            </div>

            {newsLoading && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Loading news…
              </div>
            )}

            {!newsLoading && newsError && (
              <div style={{
                padding: '24px', textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '14px', color: '#fca5a5', fontSize: '13px'
              }}>
                {newsError}
              </div>
            )}

            {!newsLoading && !newsError && newsArticles.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No recent articles for this country.
              </div>
            )}

            {!newsLoading && !newsError && newsArticles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {newsArticles.map((art, i) => (
                  <a
                    key={i}
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', gap: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {art.image && (
                      <img
                        src={art.image}
                        alt=""
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{
                          width: '88px', height: '64px',
                          objectFit: 'cover', borderRadius: '8px',
                          flexShrink: 0,
                          background: '#1e293b'
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      
                      {/* 1. TÍTULO LIMPO */}
                      <p style={{
                        color: '#fff', fontSize: '13px', fontWeight: 700,
                        margin: 0, lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {art.title.includes(' - ') 
                          ? art.title.substring(0, art.title.lastIndexOf(' - ')) 
                          : art.title}
                      </p>
                      
                      {/* 2. NOME DO JORNAL EXTRAÍDO DIRETAMENTE DO TÍTULO */}
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '11px',
                        color: '#3b82f6',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        📰 {art.title.includes(' - ') 
                              ? art.title.substring(art.title.lastIndexOf(' - ') + 3).trim() 
                              : (art.source || 'Fonte Externa')}
                      </p>

                      {/* 3. DATA E SCORE */}
                      <div style={{
                        color: '#64748b',
                        fontSize: '10px',
                        margin: '6px 0 0 0',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        {process.env.NODE_ENV === 'development' && (
                          <span style={{ color: '#facc15', fontWeight: 700 }}>
                            Score: {art.score.toFixed(1)}
                          </span>
                        )}
                        
                        {process.env.NODE_ENV === 'development' && (
                          <span style={{ opacity: 0.5 }}>·</span>
                        )}

                        <span>{formatNewsDate(art.pubDate)}</span>
                      </div>
                      
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
