
 const LOCATIONS_DATA = {
     "Starbase Alpha": {
        coords: {
            y: MAP_HEIGHT - 5,
            x: MAP_WIDTH - 7
        },
        type: STARBASE_CHAR_VAL,
        isMajorHub: true,
        faction: "CONCORD",
        sells: [{
            id: "FUEL_CELLS",
            priceMod: 0.9,
            stock: 100
        }, {
            id: "MINING_DRONE",
            priceMod: 1.0,
            stock: 10
        }, {
            id: "TECH_PARTS",
            priceMod: 1.1,
            stock: 30
        }, {
            id: "MEDICAL_SUPPLIES",
            priceMod: 1.0,
            stock: 25
        }, {
            id: "NAVIGATION_CHARTS",
            priceMod: 1.0,
            stock: 50
        },
        // --- NEW ITEMS ADDED HERE ---
        {
            id: "CYBERNETIC_IMPLANTS",
            priceMod: 1.2,
            stock: 15
        }, 
        {
            id: "DROID_SERVOS",
            priceMod: 1.0,
            stock: 40
        }],
        buys: [{
                id: "MINERALS",
                priceMod: 1.2,
                stock: 50
            }, {
                id: "FOOD_SUPPLIES",
                priceMod: 1.1,
                stock: 50
            },
            {
                id: "RARE_METALS",
                priceMod: 1.3,
                stock: 15
            }, {
                id: "ARTIFACT_SHARDS",
                priceMod: 1.5,
                stock: 5
            },
            {
                id: "XENO_ANTIQUES",
                priceMod: 1.8,
                stock: 2
            }, {
                id: "PRECURSOR_DATACUBE",
                priceMod: 2.5,
                stock: 1
            },
            {
                id: "VOID_CRYSTALS",
                priceMod: 1.6,
                stock: 3
            }, {
                id: "GENETIC_SAMPLES",
                priceMod: 1.4,
                stock: 10
            },
            {
                id: "FORBIDDEN_TEXTS",
                priceMod: 0.7,
                stock: 3
            }, {
                id: "PHASE_SHIFTED_ALLOY",
                priceMod: 3.0,
                stock: 1
            },
            {
                id: "WAYFINDER_CORE",
                priceMod: 5.0,
                stock: 1
            }, {
                id: "SENTIENT_MYCELIUM",
                priceMod: 1.2,
                stock: 4
            },
            {
                id: "PRECURSOR_STAR_MAP_FRAGMENT",
                priceMod: 4.0,
                stock: 1
            }, {
                id: "KTHARR_ANCESTRAL_BLADE",
                priceMod: 0.5,
                stock: 1
            },
            {
                id: "GOLD",
                priceMod: 1.1,
                stock: 30
            }, {
                id: "PLATINUM_ORE",
                priceMod: 1.2,
                stock: 20
            }, {
                id: "HYDROGEN_3",
                priceMod: 2.0,
                stock: 5
            },
            // --- NEW LUXURY ITEM DEMAND ---
            {
                id: "ANCIENT_WINE",
                priceMod: 1.5, // High demand!
                stock: 5
            }
        ],
        scanFlavor: "Starbase Alpha: Major Concord trade hub..." 
    },
     "Planet Omega": {
         coords: {
             y: 7,
             x: 7
         },
         type: PLANET_CHAR_VAL,
         faction: "CONCORD",
         sells: [{
             id: "MINERALS",
             priceMod: 0.8,
             stock: 200
         }, {
             id: "FOOD_SUPPLIES",
             priceMod: 0.9,
             stock: 100
         }],
         buys: [{
             id: "TECH_PARTS",
             priceMod: 1.3,
             stock: 10
         }, {
             id: "RARE_METALS",
             priceMod: 1.1,
             stock: 20
         }],
         scanFlavor: "Planet Omega: Rich Dilithium deposits. Significant Precursor ruins dot the landscape, some appearing as immense, silent geometric structures half-buried in the crimson sands; some whisper of a dormant 'World Engine' beneath the surface. Concord research outposts monitor unusual energy fluctuations, wary of what they call 'Silencer Echoes' – faint, high-frequency transmissions that seem to emanate from the deepest ruins."
     },
     "Planet Xerxes": {
         coords: {
             y: 3,
             x: MAP_WIDTH - 5
         },
         type: PLANET_CHAR_VAL,
         faction: "INDEPENDENT",
         sells: [],
         buys: [],
         scanFlavor: "Planet Xerxes: Extreme environment, corrosive atmosphere, and crushing gravity. High Xenon Gas and heavy metal concentrations make it valuable, but deadly. Rumored pirate haven and site of ancient K'tharr battles; some say the 'bad spirits' here are echoes of failed K'tharr rituals or a malfunctioning Precursor 'guardian' system that affects psionic minds, causing vivid hallucinations of metallic spiders."
     }
 };
