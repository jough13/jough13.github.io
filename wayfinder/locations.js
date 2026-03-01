// ==========================================
// --- LOCATIONS DATABASE ---
// ==========================================

const LOCATIONS_DATA = {
    "Starbase Alpha": {
        name: "Starbase Alpha",
        coords: {
            y: MAP_HEIGHT - 5,
            x: MAP_WIDTH - 7
        },
        type: STARBASE_CHAR_VAL,
        isMajorHub: true,
        faction: "CONCORD",
        sells: [
            { id: "FUEL_CELLS", priceMod: 0.9, stock: 100 }, 
            { id: "MINING_DRONE", priceMod: 1.0, stock: 10 }, 
            { id: "TECH_PARTS", priceMod: 1.1, stock: 30 }, 
            { id: "MEDICAL_SUPPLIES", priceMod: 1.0, stock: 25 }, 
            { id: "NAVIGATION_CHARTS", priceMod: 1.0, stock: 50 },
            { id: "CYBERNETIC_IMPLANTS", priceMod: 1.2, stock: 15 }, 
            { id: "DROID_SERVOS", priceMod: 1.0, stock: 40 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.2, stock: 5 },
            { id: "MINERALS", priceMod: 1.2, stock: 50 }, 
            { id: "FOOD_SUPPLIES", priceMod: 1.1, stock: 50 },
            { id: "RARE_METALS", priceMod: 1.3, stock: 15 }, 
            { id: "ARTIFACT_SHARDS", priceMod: 1.5, stock: 5 },
            { id: "XENO_ANTIQUES", priceMod: 1.8, stock: 2 }, 
            { id: "PRECURSOR_DATACUBE", priceMod: 2.5, stock: 1 },
            { id: "VOID_CRYSTALS", priceMod: 1.6, stock: 3 }, 
            { id: "GENETIC_SAMPLES", priceMod: 1.4, stock: 10 },
            { id: "FORBIDDEN_TEXTS", priceMod: 0.7, stock: 3 }, 
            { id: "PHASE_SHIFTED_ALLOY", priceMod: 3.0, stock: 1 },
            { id: "WAYFINDER_CORE", priceMod: 5.0, stock: 1 }, 
            { id: "SENTIENT_MYCELIUM", priceMod: 1.2, stock: 4 },
            { id: "PRECURSOR_STAR_MAP_FRAGMENT", priceMod: 4.0, stock: 1 }, 
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 0.5, stock: 1 },
            { id: "GOLD", priceMod: 1.1, stock: 30 }, 
            { id: "PLATINUM_ORE", priceMod: 1.2, stock: 20 }, 
            { id: "HYDROGEN_3", priceMod: 2.0, stock: 5 },
            { id: "ANCIENT_WINE", priceMod: 1.5, stock: 5 }
        ],
        scanFlavor: "Starbase Alpha: Major Concord trade hub. Bustling with merchant traffic and heavily patrolled by Concord security drones." 
    },
    
    "The Rusty Anchor": {
        name: "The Rusty Anchor",
        coords: {
            y: MAP_HEIGHT - 3,
            x: MAP_WIDTH - 15
        },
        type: STARBASE_CHAR_VAL,
        displayChar: "§", // --- Unique map symbol ---
        customColor: "#9C27B0", // --- Shadow Network purple ---
        isMajorHub: true, // --- Flips the switch to force the main UI modal! ---
        faction: "INDEPENDENT",
        isBlackMarket: true, 
        sells: [
            { id: "DISCOUNT_CYBERSERVOS", priceMod: 0.7, stock: 25 }, 
            { id: "UNSHACKLED_AI", priceMod: 1.5, stock: 1 } 
        ],
        buys: [
            { id: "MEDICAL_SUPPLIES", priceMod: 2.0, stock: 50 }, 
            { id: "TECH_PARTS", priceMod: 1.5, stock: 20 }
        ],
        scanFlavor: "A dubious cantina built into a hollowed-out asteroid. Scanners show high concentrations of illegal substances. A garbled transmission repeats on loop: 'We don't take kindly to Concord lapdogs here.'"
    },

    "Aegis Dyson Sphere": {
        name: "Aegis Dyson Sphere",
        coords: {
            y: 7,
            x: 7
        },
        type: PLANET_CHAR_VAL, 
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "MINERALS", priceMod: 0.8, stock: 500 }, 
            { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: 300 },
            { id: "TECH_PARTS", priceMod: 0.9, stock: 150 }
        ],
        buys: [
            { id: "RARE_METALS", priceMod: 1.3, stock: 50 }, 
            { id: "VOID_CRYSTALS", priceMod: 1.5, stock: 15 },
            { id: "HYDROGEN_3", priceMod: 1.2, stock: 30 }
        ],
        scanFlavor: "Aegis Dyson Sphere: The glittering crown jewel of the Concord. A breathtaking megastructure encasing a captured G-type star. Billions of citizens live across its interior habitation rings. Security is absolute, and its monumental energy output powers the entire Concord fleet. Approach with proper clearance."
    },

    "Planet Xerxes": {
        name: "Planet Xerxes",
        coords: {
            y: 3,
            x: MAP_WIDTH - 5
        },
        type: PLANET_CHAR_VAL,
        faction: "INDEPENDENT",
        isBlackMarket: true, 
        sells: [
            { id: "DISCOUNT_CYBERSERVOS", priceMod: 0.8, stock: 15 }, 
            { id: "OBSIDIAN_TEAR_PLATING", priceMod: 1.1, stock: 5 },
            { id: "LIVING_HULL_TISSUE", priceMod: 0.9, stock: 3 }
        ],
        buys: [
            { id: "PRECURSOR_NAV_CORE", priceMod: 2.5, stock: 0 }, 
            { id: "SENTIENT_MYCELIUM", priceMod: 1.8, stock: 10 } 
        ],
        scanFlavor: "Planet Xerxes: Extreme environment, corrosive atmosphere, and crushing gravity. High Xenon Gas and heavy metal concentrations make it valuable, but deadly. Rumored pirate haven and site of ancient K'tharr ruins."
    },

    // --- DEEP SPACE FACTION HUBS ---
    "Karak-Tor": {
        name: "Karak-Tor",
        coords: {
            y: 485, // Deep into K'tharr space
            x: 420
        },
        type: PLANET_CHAR_VAL,
        faction: "KTHARR",
        isMajorHub: false,
        sells: [
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 0.8, stock: 5 }, 
            { id: "MINERALS", priceMod: 0.9, stock: 150 },
            { id: "LIVING_HULL_TISSUE", priceMod: 1.1, stock: 10 }
        ],
        buys: [
            { id: "FOOD_SUPPLIES", priceMod: 1.8, stock: 200 }, 
            { id: "MEDICAL_SUPPLIES", priceMod: 1.5, stock: 50 },
            { id: "CYBERNETIC_IMPLANTS", priceMod: 1.3, stock: 20 }
        ],
        scanFlavor: "Karak-Tor: A brutal, volcanic world claimed by the K'tharr Hegemony. Massive atmospheric forges burn day and night. Scanners detect intense localized energy spikes—likely the infamous Proving Grounds."
    },

    "Station Umbra": {
        name: "Station Umbra",
        coords: {
            y: -150, 
            x: -450 // Deep into the lawless outer rim
        },
        type: STARBASE_CHAR_VAL,
        faction: "ECLIPSE",
        isMajorHub: false,
        isBlackMarket: true, 
        sells: [
            { id: "FORBIDDEN_TEXTS", priceMod: 1.2, stock: 5 },
            { id: "PHASE_SHIFTED_ALLOY", priceMod: 1.5, stock: 2 },
            { id: "UNSHACKLED_AI", priceMod: 1.2, stock: 3 }
        ],
        buys: [
            { id: "FUEL_CELLS", priceMod: 1.6, stock: 100 }, 
            { id: "TECH_PARTS", priceMod: 1.3, stock: 50 },
            { id: "GOLD", priceMod: 1.2, stock: 40 }
        ],
        scanFlavor: "Station Umbra: A heavily cloaked Eclipse Cartel listening post on the galactic rim. You are receiving encrypted hails offering high payouts for stolen goods and access to shadow brokers. Keep your shields up."
    }
};
