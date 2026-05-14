import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { INFO_ESTRATEGICA_REGIOES, IMAGEM_FALLBACK } from './dados_estrategicos';
const URL_PAISES = "/data/paises.geojson";
const URL_REGIOES = "/data/regioes.geojson";

function MapController({ paisSelecionado }) {
  const map = useMap();

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

   // 2. MATAR O CSS PADRÃO DO VITE/REACT (A solução para a margem esquerda!)
   const rootElement = document.getElementById('root');
   if (rootElement) {
     rootElement.style.padding = "0";
     rootElement.style.margin = "0";
     rootElement.style.maxWidth = "100%";
     rootElement.style.width = "100%";
     rootElement.style.textAlign = "left"; // Garante que tudo encosta à esquerda
   }

    setTimeout(() => {
      map.invalidateSize();
      const limitesEuropa = [[25, -35], [75, 45]]; 
      const zoomMinimo = map.getBoundsZoom(limitesEuropa); 
      map.setMinZoom(zoomMinimo);
      map.setMaxBounds(limitesEuropa);
    }, 200);
  }, [map]);

  useEffect(() => {
    if (!paisSelecionado) {
      map.setView([48, 5], 3, { animate: true });
    }
  }, [paisSelecionado, map]);

  return null;
}


export default function App() {
  const [dadosPaises, setDadosPaises] = useState(null);
  const [dadosRegioes, setDadosRegioes] = useState(null);
  
  // Três níveis de navegação
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  const [regiaoSelecionada, setRegiaoSelecionada] = useState(null);
  const [moduloAtivo, setModuloAtivo] = useState(null);
  
  // Textos e HTML da Sidebar
  const [info, setInfo] = useState("Clica num país para ver os dados oficiais.");
  const [infoRegiao, setInfoRegiao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // 1. Carregar Mapas
  useEffect(() => {
    const carregarMapas = async () => {
      try {
        const [resP, resR] = await Promise.all([ fetch(URL_PAISES), fetch(URL_REGIOES) ]);
        setDadosPaises(await resP.json());
        setDadosRegioes(await resR.json());
        setCarregando(false);
      } catch (err) {
        console.error("Erro ao carregar ficheiros:", err);
        setCarregando(false);
      }
    };
    carregarMapas();
  }, []);

  // 2. Clique no PAÍS
  const clicarNoPais = async (e) => {
    const layer = e.target;
    const feature = layer.feature;
    const mapa = layer._map; 
    if (!mapa) return;

    const codigoOriginal = feature.properties.CNTR_CODE; 
    const nome = feature.properties.NAME_LATN || feature.properties.NUTS_NAME || "País";
    const dicionario = { "UK": "GB", "EL": "GR" };
    const codigoBusca = dicionario[codigoOriginal] || codigoOriginal;

    setInfo(<div><h2 style={{ color: '#10b981' }}>{nome}</h2><p className="animate-pulse">A consultar bases de dados...</p></div>);
    setPaisSelecionado(codigoOriginal);
    setRegiaoSelecionada(null); // Limpa qualquer região anterior

    try {
      const [resCountries, resWB] = await Promise.all([
        fetch(`https://restcountries.com/v3.1/alpha/${codigoBusca}`),
        fetch(`https://api.worldbank.org/v2/country/${codigoBusca}/indicator/NY.GDP.PCAP.CD?format=json&date=2023`)
      ]);
      const dataCountries = await resCountries.json();
      const dataWB = await resWB.json();
      if (!dataCountries || dataCountries.status === 404) throw new Error("País não encontrado");

      const pais = dataCountries[0];
      const pibFormatado = (dataWB[1] && dataWB[1][0]?.value) ? Math.round(dataWB[1][0].value).toLocaleString() + " $" : "N/D";

      // --- LÓGICA DE EXTRAÇÃO DOS NOMES ---
      let nomeIngles = pais.name?.common || nomeFallback;
      let nomeNativo = nomeIngles;

      if (pais.name?.nativeName) {
        // Pega no primeiro idioma oficial da lista devolvida pela API
        const idiomas = Object.values(pais.name.nativeName);
        if (idiomas.length > 0) {
          nomeNativo = idiomas[0].common; 
        }
      }
      // ------------------------------------

      setInfo(
        <div style={{ textAlign: 'left', fontSize: '11px' }}>
          <img src={pais.flags.png} alt="Bandeira" style={{ width: '60px', borderRadius: '4px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
          <h2 style={{ color: '#10b981', margin: '0', fontSize: '16px' }}>{nome}</h2>
          <p style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '12px', marginTop: '2px' }}>{pais.capital?.[0] || 'Sem Capital'} • {pais.subregion || 'Europa'}</p>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1' }}>
            <p style={{ margin: 0 }}><strong>👥 Pop:</strong> {pais.population.toLocaleString()}</p>
            <p style={{ margin: 0 }}><strong>💰 PIB p/C:</strong> {pibFormatado}</p>
            <p style={{ margin: 0 }}><strong>🌍 Área:</strong> {pais.area.toLocaleString()} km²</p>
          </div>
          <p style={{ fontSize: '10px', color: '#0ea5e9', marginTop: '16px', fontWeight: 'bold' }}>👇 Clica numa região para detalhes.</p>
        </div>
      );
    } catch (err) {
      setInfo(<div><h2 style={{ color: '#10b981' }}>{nome}</h2><p>Dados indisponíveis.</p></div>);
    }

    // CAIXAS DE ZOOM TÁTICO
    const boundsExcecoes = {
      "FR": [[41.3, -5.1], [51.1, 9.5]]
    };

    if (boundsExcecoes[codigoOriginal]) {
      mapa.fitBounds(boundsExcecoes[codigoOriginal], { padding: [30, 30] });
    } else {
      const bounds = layer.getBounds();
      mapa.fitBounds(bounds, { padding: [30, 30] });
    }
  };

// 3. Clique na REGIÃO (A Mágica da Foto - Apenas Hardcode e Fallback)
const clicarNaRegiao = (e) => {
  const layer = e.target;
  const feature = layer.feature;
  const nomeRegiao = feature.properties.NUTS_NAME;
  const nutsId = feature.properties.NUTS_ID;

  setRegiaoSelecionada(nutsId);

  // Zoom tático para a região
  layer._map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 5, animate: true });

  // 1. Procura no teu Dicionário
  const dadosRegiao = INFO_ESTRATEGICA_REGIOES[nutsId];

  // 2. Se a região não estiver lá, usa a imagem/texto genérico (Fallback). NADA DE WIKIPEDIA!
  const imgSrc = dadosRegiao ? dadosRegiao.img : IMAGEM_FALLBACK;
  const descricao = dadosRegiao ? dadosRegiao.desc : "Aguardando compilação de dados estratégicos. Módulos de análise (Energia, Indústria) em fase de calibração para esta zona NUTS 2.";

  // 3. Renderiza a Sidebar
  setInfoRegiao(
    <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
      <img 
        src={imgSrc} 
        alt={nomeRegiao} 
        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)' }} 
      />
      <h2 style={{ color: '#0ea5e9', margin: '0 0 10px 0', fontSize: '20px' }}>{nomeRegiao}</h2>
      <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>{descricao}</p>
      <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
         <span style={{ fontSize: '10px', color: '#0ea5e9', textTransform: 'uppercase', fontWeight: 'bold' }}>ID TÁTICO: {nutsId}</span>
      </div>
    </div>
  );
};

  const regioesFiltradas = useMemo(() => {
    if (!dadosRegioes || !paisSelecionado) return null;
    return { type: "FeatureCollection", features: dadosRegioes.features.filter(f => f.properties.CNTR_CODE === paisSelecionado) };
  }, [dadosRegioes, paisSelecionado]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#0a0f1e', color: 'white', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '280px', minWidth: '280px', padding: '24px 16px', borderTopRightRadius: '24px', borderBottomRightRadius: '24px', height: '100vh', margin: 0, boxShadow: '10px 0 30px rgba(0,0,0,0.5)', zIndex: 1000, background: '#0a0f1e', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
  
        {/* HEADER DA APP COM BOTÃO DE VOLTAR */}
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
  
        <div style={{ flex: 1, overflowY: 'auto' }}>
          
          {/* NÍVEL 1: MENU GLOBAL */}
          {!paisSelecionado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '8px', marginBottom: '8px' }}>Sistemas Ativos</h3>
              {[{ id: 'energy', label: 'Energy', icon: '⚡' }, { id: 'defense', label: 'Defense', icon: '🛡️' }, { id: 'industry', label: 'Industry', icon: '🏗️' }, { id: 'ports', label: 'Ports', icon: '⚓' }].map((item) => (
                <div key={item.id} onClick={() => setModuloAtivo(item.id === moduloAtivo ? null : item.id)} style={{ padding: '10px 14px', background: moduloAtivo === item.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: moduloAtivo === item.id ? 'rgba(16, 185, 129, 0.3)' : 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '16px', opacity: moduloAtivo === item.id ? 1 : 0.6 }}>{item.icon}</span>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: moduloAtivo === item.id ? '#10b981' : '#cbd5e1' }}>{item.label}</div>
                </div>
              ))}
            </div>
          
          /* NÍVEL 3: REGIÃO SELECIONADA */
          ) : regiaoSelecionada ? (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {infoRegiao}
            </div>
          
          /* NÍVEL 2: PAÍS SELECIONADO */
          ) : (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                {info}
              </div>
            </div>
          )}
        </div>
  
        <div style={{ marginTop: 'auto', padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: '#475569', textAlign: 'center' }}>
          v2.5.0 • Live Intel
        </div>
      </div>
  
      {/* MAPA */}
      <div style={{ flexGrow: 1, height: '100vh', position: 'relative', background: '#b3e5fc', overflow: 'hidden' }}>
        <MapContainer preferCanvas={true} center={[45, 5]} zoom={3} zoomSnap={0.25} zoomControl={false} style={{ height: '100%', width: '100%', background: '#b3e5fc' }}>
          <MapController paisSelecionado={paisSelecionado} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
  
          {/* Camada 1: Países (Sempre ativa, exceto o país selecionado) */}
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
  
          {/* Camada 2: Regiões NUTS 2 */}
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
        </MapContainer>
      </div>
    </div>
  );
}