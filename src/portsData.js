/**
 * @typedef {Object} Port
 * @property {string} id
 * @property {string} name
 * @property {string} countryCode
 * @property {"Mega Hub" | "Container" | "Liquid Bulk" | "Mixed"} type
 * @property {[number, number]} coordinates
 * @property {number} cargoMillionTons - Total annual tonnage (Millions)
 * @property {number} teuMillions - Million TEU containers
 * @property {string} curiosity
 * @property {string} image
 */

export const PORTS_DATA = [
    // MEGA HUBS
    { id: "port-rotterdam", name: "Port of Rotterdam", countryCode: "NL", type: "Mega Hub", coordinates: [51.9493, 4.1456], cargoMillionTons: 438, teuMillions: 14.4, curiosity: "The largest port in Europe, controlling almost all logistics in the North.", image: "https://emag.nauticexpo.com/wp-content/uploads/sites/5/2018/02/Rotterdam-1.jpg" },
    { id: "port-antwerp", name: "Antwerp-Bruges", countryCode: "BE", type: "Mega Hub", coordinates: [51.2728, 4.3516], cargoMillionTons: 289, teuMillions: 13.5, curiosity: "Belgium's main economic driver and a global chemical hub.", image: "https://dvzpv6x5302g1.cloudfront.net/AcuCustom/Sitename/DAM/123/Antwerp.jpg" },
    
    // CONTAINER FOCUSED
    { id: "port-hamburg", name: "Port of Hamburg", countryCode: "DE", type: "Container", coordinates: [53.5358, 9.9483], cargoMillionTons: 119, teuMillions: 8.3, curiosity: "Third busiest port in Europe, known as Germany's 'Gateway to the World'.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgQjPk_XZEmd7cSHXySO3G9RKrBY8yuqfDLg&s" },
    { id: "port-valencia", name: "Port of Valencia", countryCode: "ES", type: "Container", coordinates: [39.4447, -0.3168], cargoMillionTons: 80, teuMillions: 5.1, curiosity: "The largest container port in Spain and the Mediterranean Sea.", image: "https://www.valenciaport.com/wp-content/uploads/Aerea-Puerto-Valencia-y-ciudad-2222-1024x682.jpg" },
    { id: "port-piraeus", name: "Port of Piraeus", countryCode: "EL", type: "Container", coordinates: [37.9463, 23.6366], cargoMillionTons: 50, teuMillions: 5.0, curiosity: "Acquired by COSCO, it is the main commercial gateway from Asia to Europe.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6TdlENsNt15jrBPvd1nzOL6sgQe8eic0zHQ&s" },
    { id: "port-felixstowe", name: "Port of Felixstowe", countryCode: "UK", type: "Container", coordinates: [51.9564, 1.3146], cargoMillionTons: 28, teuMillions: 4.0, curiosity: "Processes almost half of all container traffic in the United Kingdom.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTK7H23QIkyiTk93hH3YALGz3WHr1TgzjPLuw&s" },
  
    // MIXED & STRATEGIC
    { id: "port-sines", name: "Port of Sines", countryCode: "PT", type: "Mixed", coordinates: [37.9536, -8.8789], cargoMillionTons: 48, teuMillions: 1.8, curiosity: "Main Atlantic hub for LNG (Natural Gas) and deep waters in Iberia.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWFOZkhAIyXh85RVTdQilyba4x-hKDNga1XQ&s" },
    { id: "port-algeciras", name: "Port of Algeciras", countryCode: "ES", type: "Mixed", coordinates: [36.1362, -5.4371], cargoMillionTons: 104, teuMillions: 4.7, curiosity: "Strategically located in the Strait of Gibraltar, a vital EU-Africa bridge.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vista_A%C3%A9rea_del_Puerto_de_Algeciras.jpg/330px-Vista_A%C3%A9rea_del_Puerto_de_Algeciras.jpg" },
    { id: "port-lehavre", name: "Port of Le Havre", countryCode: "FR", type: "Mixed", coordinates: [49.4818, 0.1265], cargoMillionTons: 71, teuMillions: 2.8, curiosity: "Paris's gateway to international maritime trade.", image: "https://www.haropaport.com/sites/default/files/styles/img__1920x1080__crop_main__upscale/public/media/images/haropa_port_terminal_de_france_havre.jpg?h=69340cd3&itok=gcYQmEoK" },
    { id: "port-gdansk", name: "Port of Gdańsk", countryCode: "PL", type: "Mixed", coordinates: [54.3986, 18.6757], cargoMillionTons: 68, teuMillions: 2.0, curiosity: "The fastest-growing port in the Baltic, a driver of the Polish economy.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRbpt2DjJ0QcDCSHP11w4TWk9q7DLq2r9DsA&s" },
    { id: "port-constanta", name: "Port of Constanța", countryCode: "RO", type: "Mixed", coordinates: [44.1166, 28.6333], cargoMillionTons: 75, teuMillions: 0.8, curiosity: "Essential for grain exports, crossing the Black Sea and the Danube River.", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8ZqcSmhmyGQ_r2jzR9McQyCprBlllyDmeFw&s" },
  
    // LIQUID BULK / ENERGY
    { id: "port-trieste", name: "Port of Trieste", countryCode: "IT", type: "Liquid Bulk", coordinates: [45.6429, 13.7570], cargoMillionTons: 62, teuMillions: 0.8, curiosity: "The main oil port supplying Central Europe via pipeline.", image: "https://decode39.com/wp-content/uploads/2023/03/porto-di-trieste-1172981081-990x556.jpeg" },
    { id: "port-gothenburg", name: "Port of Gothenburg", countryCode: "SE", type: "Liquid Bulk", coordinates: [57.6969, 11.8715], cargoMillionTons: 38, teuMillions: 0.8, curiosity: "The largest port in Scandinavia, fundamental to the Swedish automotive industry.", image: "https://www.ship-technology.com/wp-content/uploads/sites/8/2018/10/1l-image-Port-of-Gothenburg-Expansion.jpg" }
  ];