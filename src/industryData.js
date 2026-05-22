/**
 * @typedef {Object} Industry
 * @property {string} id
 * @property {string} name
 * @property {string} countryCode
 * @property {"High-Tech" | "Chemicals" | "Pharma" | "Aerospace" | "Food Tech"} type
 * @property {[number, number]} coordinates
 * @property {number} globalMarketShare - Percentage of global market share (estimate)
 * @property {string} keyProduct - The vital product
 * @property {string} curiosity
 * @property {string} image
 */

export const INDUSTRY_DATA = [
    { 
      id: "ind-asml", name: "ASML Headquarters", countryCode: "NL", type: "High-Tech", coordinates: [51.4050, 5.4011], 
      globalMarketShare: 100, keyProduct: "EUV Lithography Machines", 
      curiosity: "The only company in the world capable of making the machines that print the most advanced microchips (Apple, Nvidia, etc). The tech world relies on this single Dutch city.", 
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlqCYYb7sCeC668s8XJ53GuzZT2EhQbkPpHA&s" 
    },
    { 
      id: "ind-zeiss", name: "Carl Zeiss SMT", countryCode: "DE", type: "High-Tech", coordinates: [48.7823, 10.1069], 
      globalMarketShare: 98, keyProduct: "Ultra-Precision Optics", 
      curiosity: "They make the most perfect mirrors and lenses in the universe for ASML. Without Zeiss in Oberkochen, ASML cannot build its machines.", 
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_AaPxvoPN4EZYXDxmGJCLHISLR-X2IaH28A&s" 
    },
    { 
      id: "ind-basf", name: "BASF Verbund", countryCode: "DE", type: "Chemicals", coordinates: [49.4967, 8.4323], 
      globalMarketShare: 35, keyProduct: "Base Chemicals and Polymers", 
      curiosity: "The largest integrated chemical complex in the world (10 km²). It produces the invisible ingredients for plastics, paints, agriculture, and batteries across the globe.", 
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6N0Zt0iw_OlqOKRkfxQElzMjjMrrkiEuMug&s" 
    },
    { 
      id: "ind-novo", name: "Novo Nordisk", countryCode: "DK", type: "Pharma", coordinates: [55.6704, 11.0884], 
      globalMarketShare: 50, keyProduct: "Insulin & Semaglutide", 
      curiosity: "Produces about half of the world's insulin. The monstrous success of its obesity medications (Ozempic/Wegovy) made it the most valuable company in Europe.", 
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAMVfFodJ5cF72KuEcdPxRttMRb0FOqGmR_g&s" 
    },
    { 
      id: "ind-buhler", name: "Bühler Group", countryCode: "CH", type: "Food Tech", coordinates: [47.4411, 9.1361], 
      globalMarketShare: 65, keyProduct: "Grain Processing", 
      curiosity: "Hidden Swiss champion: 65% of all the world's wheat and 70% of all the chocolate consumed on Earth are processed using machines made by Bühler.", 
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmeTWlBgWB1fhJgCZ4jp7MEV5nfc9942INuw&s" 
    },
    { 
      id: "ind-airbus", name: "Airbus Final Assembly", countryCode: "FR", type: "Aerospace", coordinates: [43.6150, 1.3731], 
      globalMarketShare: 52, keyProduct: "Commercial Aircraft", 
      curiosity: "Alongside Boeing, it forms the only viable duopoly in global commercial aviation. In Toulouse, parts coming from all over Europe are assembled together.", 
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSnoTzHKXZB55wq10jD6pwuXt06JuLoTT5uA&s" 
    },
  // HIGH-TECH & ROBOTICS (The Brain and the Muscle)
  // ==========================================
  { 
    id: "ind-skf", name: "SKF Group", countryCode: "SE", type: "High-Tech", coordinates: [57.7280, 11.9960], 
    globalMarketShare: 20, keyProduct: "High-Precision Bearings", 
    curiosity: "The world literally does not spin without them. They produce essential bearings for everything from skateboards and cars to wind turbines and Mars rovers.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRL92xyRm26OeCNx1TktUffRnLFkB-3Wf2YPg&s" 
  },
  { 
    id: "ind-abb", name: "ABB Robotics", countryCode: "CH", type: "High-Tech", coordinates: [47.4100, 8.5440], 
    globalMarketShare: 25, keyProduct: "Industrial Robotics", 
    curiosity: "Pioneers of commercial robotics. If a modern car or smartphone was assembled on a production line, there is a massive probability it was done by an ABB mechanical arm.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScoiNqlHkvDXZb_oupiHoTNh-q45Rs6pMGPw&s" 
  },
  { 
    id: "ind-dassault", name: "Dassault Systèmes", countryCode: "FR", type: "High-Tech", coordinates: [48.7840, 2.2190], 
    globalMarketShare: 35, keyProduct: "CATIA / 3D Software", 
    curiosity: "Boeing, Ford, and Tesla design their planes and cars using 3D software built by this French company. The physical world is tested virtually here first.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdIxosDkQ9sZi02IHzj6GsOvCM3hSYLzG3hg&s" 
  },
  { 
    id: "ind-ericsson", name: "Ericsson", countryCode: "SE", type: "High-Tech", coordinates: [59.4040, 16.9450], 
    globalMarketShare: 30, keyProduct: "5G Infrastructure", 
    curiosity: "Alongside Nokia (Finland), they form the only Western alternative to Huawei for building the 5G mobile networks that connect the planet.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTynYXopecNkoeeWWoeXBbsQKq3vzHMyb5f4A&s" 
  },

  // ==========================================
  // CHEMICALS & MATERIALS (The Ingredients of the World)
  // ==========================================
  { 
    id: "ind-givaudan", name: "Givaudan", countryCode: "CH", type: "Chemicals", coordinates: [46.2200, 6.0870], 
    globalMarketShare: 25, keyProduct: "Flavors & Fragrances", 
    curiosity: "Almost all luxury perfumes (Dior, Chanel) and the flavors of your favorite snacks (Nestlé, Pepsi) were secretly created in this company's laboratories.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1Yv78bPAwoPiqftXTVCMUBwqp6C2rQEFcQQ&s" 
  },
  { 
    id: "ind-essilor", name: "EssilorLuxottica", countryCode: "IT", type: "Chemicals", coordinates: [45.4642, 9.1900], 
    globalMarketShare: 45, keyProduct: "Ophthalmic Lenses and Frames", 
    curiosity: "Absolute monopoly on vision. They produce almost all prescription lenses in the world and own brands like Ray-Ban, Oakley, as well as lenses for virtual reality screens.", 
    image: "https://media.essilorluxottica.com/cms/caas/v1/media/245014/data/d05f2dc9da667f4a1622e2adea26179a/1920x1080.png" 
  },

  // ==========================================
  // PHARMA & LIFE SCIENCES (The Cure and Longevity)
  // ==========================================
  { 
    id: "ind-roche", name: "Roche Diagnostics", countryCode: "CH", type: "Pharma", coordinates: [47.5580, 7.6000], 
    globalMarketShare: 20, keyProduct: "Diagnostics and Oncology", 
    curiosity: "World leader in cancer treatments and In-Vitro diagnostic tests. Their laboratories set the global standard for personalized medicine.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoCPme8LBRX5jjxneTn2iSZ8Nl6g7gFZUzXw&s" 
  },

  // ==========================================
  // AEROSPACE & DEFENSE (The Dominance of the Sky)
  // ==========================================
  { 
    id: "ind-rollsroyce", name: "Rolls-Royce Aerospace", countryCode: "UK", type: "Aerospace", coordinates: [52.8900, -1.4800], 
    globalMarketShare: 50, keyProduct: "Jet Engines (Widebody)", 
    curiosity: "Not the cars (that belongs to BMW). The real RR dominates the manufacturing of aviation engines for long-haul flights, competing only with the American General Electric.", 
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQt43CRcvT8SLfmYca7kOz7_iQiUJDwdvNCAQ&s" 
  },
  { 
    id: "ind-leonardo", name: "Leonardo Helicopters", countryCode: "IT", type: "Aerospace", coordinates: [45.6560, 8.7900], 
    globalMarketShare: 25, keyProduct: "Defense Aeronautics", 
    curiosity: "One of the secret defense giants of NATO. They manufacture everything from advanced radar systems to the overwhelming majority of commercial and military helicopters in Europe.", 
    image: "https://i.guim.co.uk/img/media/e220ecff03c63612ca5e1536886642db1d9d548f/605_575_6934_4161/master/6934.jpg?width=1200&quality=85&auto=format&fit=max&s=e4cc97c88b8ed106808e94bc6e9848fc" 
  },

  // ==========================================
  // FOOD TECH (Global Food Supply)
  // ==========================================
  { 
    id: "ind-tetrapak", name: "Tetra Pak", countryCode: "SE", type: "Food Tech", coordinates: [55.7130, 13.2010], 
    globalMarketShare: 80, keyProduct: "Aseptic Packaging", 
    curiosity: "They revolutionized the world by allowing milk and juices to last for months outside the refrigerator. They sell over 190 billion packages per year.", 
    image: "https://s7g10.scene7.com/is/image/tetrapak/Packages?wid=600&hei=338&fmt=jpg&resMode=sharp2&qlt=85,0&op_usm=1.75,0.3,2,0" 
  }
];