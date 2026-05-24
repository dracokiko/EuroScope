// /api/energy-diagnostics.js
// Testa TODOS os países europeus e mostra quais funcionam/falham

export default async function handler(req, res) {
    // Lista de códigos de países europeus que aparecem no teu mapa
    const europeanCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'CH',
      'IS', 'AL', 'BA', 'XK', 'ME', 'MK', 'RS', 'TR', 'UA', 'BY',
      'MD', 'RU'
    ];
  
    const results = [];
    const batchSize = 5; // Testar 5 de cada vez para não sobrecarregar a API
  
    for (let i = 0; i < europeanCountries.length; i += batchSize) {
      const batch = europeanCountries.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (country) => {
          const lowerCountry = country.toLowerCase();
          
          try {
            // Testar installed_power
            const installedRes = await fetch(
              `https://api.energy-charts.info/installed_power?country=${lowerCountry}&time_step=yearly&installation_decommission=false`,
              { 
                headers: { 
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0'
                }
              }
            );
  
            let installedStatus = installedRes.status;
            let installedData = null;
            let totalCapacityGW = 0;
  
            if (installedRes.ok) {
              installedData = await installedRes.json();
              
              if (installedData?.production_types?.length) {
                installedData.production_types.forEach(source => {
                  const arr = Array.isArray(source.data) ? source.data : [];
                  let latestValue = null;
                  for (let i = arr.length - 1; i >= 0; i--) {
                    if (arr[i] !== null && arr[i] !== undefined) {
                      latestValue = arr[i];
                      break;
                    }
                  }
                  if (typeof latestValue === 'number' && latestValue > 0) {
                    totalCapacityGW += latestValue;
                  }
                });
              }
            }
  
            // Testar public_power
            const liveRes = await fetch(
              `https://api.energy-charts.info/public_power?country=${lowerCountry}`,
              { 
                headers: { 
                  'Accept': 'application/json',
                  'User-Agent': 'Mozilla/5.0'
                }
              }
            );
  
            let liveStatus = liveRes.status;
            let hasLiveData = false;
  
            if (liveRes.ok) {
              const liveData = await liveRes.json();
              hasLiveData = !!(liveData?.production_types?.length);
            }
  
            return {
              country: country,
              installed: {
                status: installedStatus,
                available: installedStatus === 200,
                capacity_gw: totalCapacityGW > 0 ? parseFloat(totalCapacityGW.toFixed(1)) : null,
                sources_count: installedData?.production_types?.length || 0
              },
              live: {
                status: liveStatus,
                available: liveStatus === 200 && hasLiveData
              },
              overall_status: (installedStatus === 200 && totalCapacityGW > 0) ? 'OK' : 
                             (installedStatus === 404) ? 'NOT_SUPPORTED' : 
                             (installedStatus === 429) ? 'RATE_LIMITED' : 'ERROR'
            };
  
          } catch (err) {
            return {
              country: country,
              installed: { status: 'ERROR', available: false, error: err.message },
              live: { status: 'ERROR', available: false },
              overall_status: 'ERROR'
            };
          }
        })
      );
  
      results.push(...batchResults);
      
      // Pequeno delay entre batches para evitar rate limiting
      if (i + batchSize < europeanCountries.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  
    // Agrupar resultados
    const summary = {
      total_countries: results.length,
      working: results.filter(r => r.overall_status === 'OK').length,
      not_supported: results.filter(r => r.overall_status === 'NOT_SUPPORTED').length,
      errors: results.filter(r => r.overall_status === 'ERROR').length,
      rate_limited: results.filter(r => r.overall_status === 'RATE_LIMITED').length
    };
  
    const working = results.filter(r => r.overall_status === 'OK')
      .sort((a, b) => (b.installed.capacity_gw || 0) - (a.installed.capacity_gw || 0));
    
    const notSupported = results.filter(r => r.overall_status === 'NOT_SUPPORTED')
      .map(r => r.country);
    
    const errors = results.filter(r => r.overall_status === 'ERROR');
  
    return res.status(200).json({
      summary,
      working_countries: working,
      not_supported_countries: notSupported,
      errors: errors.length > 0 ? errors : undefined,
      full_results: results
    });
  }