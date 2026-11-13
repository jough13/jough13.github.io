// --- START OF FILE locations.js ---

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
            { id: "NANO_REPAIR_KIT", priceMod: 1.0, stock: 15 },
            { id: "MINING_DRONE", priceMod: 1.0, stock: 10 }, 
            { id: "MINING_DRONE_MK2", priceMod: 1.0, stock: 5 },
            { id: "TECH_PARTS", priceMod: 1.1, stock: 30 }, 
            { id: "MEDICAL_SUPPLIES", priceMod: 1.0, stock: 25 }, 
            { id: "NAVIGATION_CHARTS", priceMod: 1.0, stock: 50 },
            { id: "CYBERNETIC_IMPLANTS", priceMod: 1.2, stock: 15 }, 
            { id: "DROID_SERVOS", priceMod: 1.0, stock: 40 },
            { id: "WATER", priceMod: 1.0, stock: 80 },
            // --- COLONY & STATION BUILDER SUPPLIES ---
            { id: "COLONY_CHARTER", priceMod: 1.0, stock: 3 },
            { id: "STATION_CORE", priceMod: 1.0, stock: 1 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.2, stock: 15 },
            { id: "MINERALS", priceMod: 1.2, stock: 80 }, 
            { id: "FOOD_SUPPLIES", priceMod: 1.1, stock: 60 },
            { id: "RARE_METALS", priceMod: 1.3, stock: 25 }, 
            { id: "REFINED_ALLOY", priceMod: 1.2, stock: 30 },
            { id: "ARTIFACT_SHARDS", priceMod: 1.5, stock: 10 },
            { id: "XENO_ANTIQUES", priceMod: 1.8, stock: 5 }, 
            { id: "PRECURSOR_DATACUBE", priceMod: 2.5, stock: 3 },
            { id: "VOID_CRYSTALS", priceMod: 1.6, stock: 8 }, 
            { id: "GENETIC_SAMPLES", priceMod: 1.4, stock: 15 },
            { id: "FORBIDDEN_TEXTS", priceMod: 0.7, stock: 5 }, 
            { id: "PHASE_SHIFTED_ALLOY", priceMod: 3.0, stock: 3 },
            { id: "WAYFINDER_CORE", priceMod: 5.0, stock: 1 }, 
            { id: "SENTIENT_MYCELIUM", priceMod: 1.2, stock: 8 },
            { id: "PRECURSOR_STAR_MAP_FRAGMENT", priceMod: 4.0, stock: 3 }, 
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 0.5, stock: 3 },
            { id: "GOLD", priceMod: 1.1, stock: 30 }, 
            { id: "PLATINUM_ORE", priceMod: 1.2, stock: 25 }, 
            { id: "HYDROGEN_3", priceMod: 2.0, stock: 15 },
            { id: "ANCIENT_WINE", priceMod: 1.5, stock: 10 }
        ],
        factory: {
            consumes: "MINERALS",
            produces: "TECH_PARTS",
            consumeQty: 5,
            produceQty: 2
        },
        scanFlavor: "Starbase Alpha: Major Concord trade hub. Bustling with merchant traffic and heavily patrolled by Concord security drones." 
    },
    
    "The Rusty Anchor": {
        name: "The Rusty Anchor",
        coords: {
            y: MAP_HEIGHT - 3,
            x: MAP_WIDTH - 15
        },
        type: STARBASE_CHAR_VAL,
        displayChar: "§",
        customColor: "#9C27B0", // Shadow Network purple
        isMajorHub: true, 
        faction: "INDEPENDENT",
        isBlackMarket: true, 
        sells: [
            { id: "DISCOUNT_CYBERSERVOS", priceMod: 0.7, stock: 25 }, 
            { id: "PROHIBITED_STIMS", priceMod: 0.9, stock: 12 },
            { id: "FROTHY_MOON_ALE", priceMod: 1.0, stock: 30 },
            { id: "UNSHACKLED_AI", priceMod: 1.5, stock: 1 } 
        ],
        buys: [
            { id: "MEDICAL_SUPPLIES", priceMod: 2.0, stock: 50 }, 
            { id: "TECH_PARTS", priceMod: 1.5, stock: 30 },
            { id: "STOLEN_CONCORD_MEDALS", priceMod: 2.2, stock: 20 },
            { id: "ILLEGAL_ORGANS", priceMod: 1.8, stock: 10 }
        ],
        factory: {
            consumes: "MEDICAL_SUPPLIES",
            produces: "PROHIBITED_STIMS",
            consumeQty: 3,
            produceQty: 2
        },
        scanFlavor: "A dubious cantina built into a hollowed-out asteroid. Scanners show high concentrations of illegal substances. A garbled transmission repeats on loop: 'We don't take kindly to Concord lapdogs here.'"
    },

    "Aegis Dyson Sphere": {
        name: "Aegis Dyson Sphere",
        coords: { y: 7, x: 7 },
        type: PLANET_CHAR_VAL, 
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "MINERALS", priceMod: 0.8, stock: 500 }, 
            { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: 300 },
            { id: "WATER", priceMod: 0.8, stock: 300 },
            { id: "TECH_PARTS", priceMod: 0.9, stock: 150 },
            { id: "REFINED_ALLOY", priceMod: 0.9, stock: 80 },
            { id: "ATMOSPHERIC_PROCESSORS", priceMod: 0.9, stock: 40 },
            { id: "COMBAT_DRONE_MK1", priceMod: 1.0, stock: 8 },
            { id: "LUXURY_GOODS", priceMod: 1.0, stock: 50 }
        ],
        buys: [
            { id: "RARE_METALS", priceMod: 1.3, stock: 50 }, 
            { id: "VOID_CRYSTALS", priceMod: 1.5, stock: 15 },
            { id: "HYDROGEN_3", priceMod: 1.2, stock: 30 },
            { id: "QUANTUM_FLUID", priceMod: 1.4, stock: 25 },
            { id: "AI_CORE", priceMod: 1.3, stock: 10 }
        ],
        factory: {
            consumes: "RARE_METALS",
            produces: "REFINED_ALLOY",
            consumeQty: 4,
            produceQty: 3
        },
        scanFlavor: "Aegis Dyson Sphere: The glittering crown jewel of the Concord. A breathtaking megastructure encasing a captured G-type star."
    },

    "Alien Obelisk": {
        name: "Obsidian Obelisk",
        coords: { x: -20, y: 35 },
        type: 'location',
        char: 'I', // Used as the key in TILE_INTERACTIONS
        displayChar: 'Ψ',
        customColor: "#9933FF",
        scanFlavor: "An ancient, monolithic spire floating in deep space. Its geometric trenches pulse with residual Precursor energy."
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
            { id: "LIVING_HULL_TISSUE", priceMod: 0.9, stock: 3 },
            { id: "STARDUST_EXOTICA", priceMod: 1.0, stock: 8 },
            { id: "PRECURSOR_CIPHER", priceMod: 1.2, stock: 3 }
        ],
        buys: [
            { id: "PRECURSOR_NAV_CORE", priceMod: 2.5, stock: 5 }, 
            { id: "SENTIENT_MYCELIUM", priceMod: 1.8, stock: 15 },
            { id: "VOID_CRYSTALS", priceMod: 1.7, stock: 20 },
            { id: "ANCIENT_RELICS", priceMod: 2.0, stock: 10 }
        ],
        scanFlavor: "Planet Xerxes: Extreme environment, corrosive atmosphere, and crushing gravity. High Xenon Gas and heavy metal concentrations make it valuable, but deadly. Rumored pirate haven and site of ancient K'tharr ruins."
    },

    // ==========================================
    // --- DEEP SPACE FACTION & LORE HUBS ---
    // ==========================================

    "Karak-Tor": {
        name: "Karak-Tor",
        coords: {
            y: 485, // Deep into K'tharr space
            x: 420
        },
        type: PLANET_CHAR_VAL,
        faction: "KTHARR",
        isMajorHub: true,
        sells: [
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 0.8, stock: 5 }, 
            { id: "KTHARR_SPICES", priceMod: 0.7, stock: 40 },
            { id: "MINERALS", priceMod: 0.9, stock: 150 },
            { id: "WEAPONS", priceMod: 0.8, stock: 60 },
            { id: "LIVING_HULL_TISSUE", priceMod: 1.1, stock: 10 }
        ],
        buys: [
            { id: "FOOD_SUPPLIES", priceMod: 1.8, stock: 200 }, 
            { id: "MEDICAL_SUPPLIES", priceMod: 1.5, stock: 50 },
            { id: "CYBERNETIC_IMPLANTS", priceMod: 1.3, stock: 20 },
            { id: "GENETIC_SAMPLES", priceMod: 1.6, stock: 30 },
            { id: "REFINED_ALLOY", priceMod: 1.4, stock: 50 }
        ],
        factory: {
            consumes: "REFINED_ALLOY",
            produces: "WEAPONS",
            consumeQty: 4,
            produceQty: 3
        },
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
        isMajorHub: true,
        isBlackMarket: true, 
        sells: [
            { id: "FORBIDDEN_TEXTS", priceMod: 1.2, stock: 5 },
            { id: "PHASE_SHIFTED_ALLOY", priceMod: 1.5, stock: 2 },
            { id: "UNSHACKLED_AI", priceMod: 1.2, stock: 3 },
            { id: "PROHIBITED_STIMS", priceMod: 0.8, stock: 20 },
            { id: "STARDUST_EXOTICA", priceMod: 0.9, stock: 10 },
            { id: "OBSIDIAN_TEAR_PLATING", priceMod: 1.0, stock: 6 },
            
            // Station Umbra now legally sells Cartel Troops!
            { id: "MERCENARY_PLATOON", priceMod: 1.0, stock: 10 },
            { id: "ASSAULT_MECH", priceMod: 1.2, stock: 2 }
        ],
        buys: [
            { id: "FUEL_CELLS", priceMod: 1.6, stock: 100 }, 
            { id: "TECH_PARTS", priceMod: 1.3, stock: 50 },
            { id: "GOLD", priceMod: 1.2, stock: 40 },
            { id: "WEAPONS", priceMod: 1.5, stock: 40 },
            { id: "AI_CORE", priceMod: 1.6, stock: 10 }
        ],
        factory: {
            consumes: "TECH_PARTS",
            produces: "OBSIDIAN_TEAR_PLATING",
            consumeQty: 6,
            produceQty: 1
        },
        scanFlavor: "Station Umbra: A heavily cloaked Eclipse Cartel listening post on the galactic rim. You are receiving encrypted hails offering high payouts for stolen goods and access to shadow brokers. Keep your shields up."
    },

    "Cygnus Prime": {
        name: "Cygnus Prime",
        coords: {
            y: -65,
            x: 85
        },
        type: STARBASE_CHAR_VAL,
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "TELEMETRY_PROBE", priceMod: 0.85, stock: 15 },
            { id: "MINING_DRONE", priceMod: 0.85, stock: 25 },
            { id: "QUANTUM_FLUID", priceMod: 0.9, stock: 30 },
            { id: "QUANTUM_LENS", priceMod: 0.95, stock: 8 },
            { id: "PRECURSOR_CIPHER", priceMod: 1.0, stock: 5 },
            { id: "NAVIGATION_CHARTS", priceMod: 0.8, stock: 60 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.6, stock: 40 },
            { id: "PRECURSOR_DATACUBE", priceMod: 3.0, stock: 10 },
            { id: "ARTIFACT_SHARDS", priceMod: 1.8, stock: 25 },
            { id: "GENETIC_SAMPLES", priceMod: 1.7, stock: 30 },
            { id: "VOID_CRYSTALS", priceMod: 1.8, stock: 15 }
        ],
        factory: {
            consumes: "VOID_CRYSTALS",
            produces: "QUANTUM_LENS",
            consumeQty: 2,
            produceQty: 1
        },
        scanFlavor: "University of Cygnus Prime: The premier astrophysical and xeno-archaeological research complex in Concord space. Academic grants fund top-credit bounties for planetary telemetry and intact Precursor Datacubes."
    },

    "Helios Refinery": {
        name: "Helios Refinery",
        coords: {
            y: 110,
            x: -55
        },
        type: OUTPOST_CHAR_VAL,
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "REFINED_ALLOY", priceMod: 0.75, stock: 120 },
            { id: "MINERALS", priceMod: 0.7, stock: 300 },
            { id: "PLATINUM_ORE", priceMod: 0.85, stock: 60 },
            { id: "ATMOSPHERIC_PROCESSORS", priceMod: 0.85, stock: 50 },
            { id: "MINING_DRONE_MK2", priceMod: 0.9, stock: 10 },
            { id: "PREFAB_COLONY_CORE", priceMod: 0.95, stock: 2 }
        ],
        buys: [
            { id: "FOOD_SUPPLIES", priceMod: 1.4, stock: 120 },
            { id: "WATER", priceMod: 1.5, stock: 120 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.4, stock: 60 },
            { id: "HYDROGEN_3", priceMod: 1.5, stock: 40 }
        ],
        factory: {
            consumes: "MINERALS",
            produces: "REFINED_ALLOY",
            consumeQty: 8,
            produceQty: 2
        },
        scanFlavor: "Helios Corporate Refinery: A sprawling Xy-Corp orbital smelting facility. Tagline broadcast on all frequencies: 'Progress Through Profit.' Ideal supply depot for colony builders and industrial haulers."
    },

    "Frothy Moon Outpost": {
        name: "Frothy Moon Outpost",
        coords: {
            y: MAP_HEIGHT - 14,
            x: MAP_WIDTH + 18
        },
        type: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#FFAA00",
        faction: "INDEPENDENT",
        isMajorHub: false,
        sells: [
            { id: "FROTHY_MOON_ALE", priceMod: 0.6, stock: 100 },
            { id: "FOOD_SUPPLIES", priceMod: 0.85, stock: 80 },
            { id: "WATER", priceMod: 0.85, stock: 80 },
            { id: "FUEL_CELLS", priceMod: 0.95, stock: 60 },
            { id: "ANCIENT_WINE", priceMod: 0.9, stock: 10 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.5, stock: 20 },
            { id: "NAVIGATION_CHARTS", priceMod: 1.4, stock: 40 },
            { id: "KTHARR_SPICES", priceMod: 1.5, stock: 25 },
            { id: "LUXURY_GOODS", priceMod: 1.4, stock: 30 }
        ],
        factory: {
            consumes: "WATER",
            produces: "FROTHY_MOON_ALE",
            consumeQty: 4,
            produceQty: 4
        },
        scanFlavor: "Frothy Moon Outpost: A cozy, independent observatory and brewhouse perched on a cratered lunar ridge. Amateur and professional stargazers gather on the observation deck to trade deep-sky charts over dark synth-ale."
    },

    "Port Nomad": {
        name: "Port Nomad",
        coords: {
            y: -210,
            x: 15
        },
        type: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#FFAA00",
        faction: "INDEPENDENT",
        isMajorHub: true,
        sells: [
            { id: "FUEL_CELLS", priceMod: 0.5, stock: 500 },
            { id: "HYDROGEN_3", priceMod: 0.75, stock: 80 },
            { id: "NANO_REPAIR_KIT", priceMod: 0.8, stock: 40 },
            { id: "TECH_PARTS", priceMod: 0.9, stock: 60 },
            { id: "WORMHOLE_STABILIZER", priceMod: 0.95, stock: 1 }
        ],
        buys: [
            { id: "REFINED_ALLOY", priceMod: 1.4, stock: 80 },
            { id: "FOOD_SUPPLIES", priceMod: 1.3, stock: 100 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.3, stock: 60 },
            { id: "QUANTUM_FLUID", priceMod: 1.4, stock: 30 }
        ],
        factory: {
            consumes: "HYDROGEN_3",
            produces: "FUEL_CELLS",
            consumeQty: 2,
            produceQty: 15
        },
        scanFlavor: "Port Nomad: Primary refueling depot and dispatch sanctuary of The Fuel Rats Collective. Massive glowing promethium tanks orbit the station. All captains are welcome regardless of faction standing."
    },

    "The Archivist's Vault": {
        name: "The Archivist's Vault",
        coords: {
            y: 260,
            x: -240
        },
        type: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#00E0E0",
        faction: "INDEPENDENT",
        isMajorHub: true,
        isBlackMarket: true,
        sells: [
            { id: "FORBIDDEN_TEXTS", priceMod: 0.85, stock: 15 },
            { id: "XENO_ANTIQUES", priceMod: 0.9, stock: 10 },
            { id: "ENCRYPTED_ENGRAM", priceMod: 1.0, stock: 8 },
            { id: "PRECURSOR_CIPHER", priceMod: 0.9, stock: 6 },
            { id: "ANCIENT_ARCHIVE", priceMod: 1.1, stock: 3 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.8, stock: 50 },
            { id: "PRECURSOR_DATACUBE", priceMod: 2.8, stock: 10 },
            { id: "PRECURSOR_STAR_MAP_FRAGMENT", priceMod: 3.5, stock: 10 },
            { id: "AI_CORE", priceMod: 1.7, stock: 15 }
        ],
        scanFlavor: "The Archivist's Vault: Hidden deep within a graveyard of shattered pre-Concord hulls. Run by an ancient, reclusive AI broker that trades in forbidden histories, encrypted engrams, and Precursor relics."
    }
};

window.LOCATIONS_DATA = LOCATIONS_DATA;

// ==========================================
// --- SELF-CONTAINED LOCATION PATCHES ---
// ==========================================

(function initLocationFixes() {
    // 1. Ensure missing commodities referenced by colonies, locations, or dev tools exist in COMMODITIES
    function ensureLocationCommodities() {
        if (typeof COMMODITIES === 'undefined') return;

        if (!COMMODITIES.LUXURY_GOODS) {
            COMMODITIES.LUXURY_GOODS = {
                name: "Luxury Goods",
                basePrice: 220,
                icon: "💎",
                description: "Fine silks, holographic art, and off-world delicacies prized by high-tier settlements and core executives."
            };
        }
        if (!COMMODITIES.HAB_MODULE) {
            COMMODITIES.HAB_MODULE = {
                name: "Habitation Module",
                basePrice: 400,
                icon: "🏗️",
                description: "Modular pressurized living quarters used for rapid frontier colony expansion."
            };
        }
        if (!COMMODITIES.ATMOS_PROCESSOR) {
            COMMODITIES.ATMOS_PROCESSOR = {
                name: "Atmos-Processor Core",
                basePrice: 650,
                icon: "🌪️",
                description: "Compact atmospheric scrubber unit designed for frontier terraforming."
            };
        }
        if (!COMMODITIES.SETTLER_MANIFEST) {
            COMMODITIES.SETTLER_MANIFEST = {
                name: "Cryo-Settler Pod",
                basePrice: 300,
                icon: "🛌",
                description: "Pioneers and engineers in cryo-stasis awaiting transport to a new world."
            };
        }
    }

    ensureLocationCommodities();

    window.addEventListener('DOMContentLoaded', () => {
        ensureLocationCommodities();

        // 2. Unlock Lore Entries for Newly Added Locations When Discovered
        if (typeof LORE_DATABASE !== 'undefined') {
            if (!LORE_DATABASE.LOCATION_CYGNUS_PRIME) {
                LORE_DATABASE.LOCATION_CYGNUS_PRIME = {
                    title: "University of Cygnus Prime",
                    category: "Locations",
                    text: LOCATIONS_DATA["Cygnus Prime"].scanFlavor,
                    unlocked: false
                };
            }
            if (!LORE_DATABASE.LOCATION_HELIOS_REFINERY) {
                LORE_DATABASE.LOCATION_HELIOS_REFINERY = {
                    title: "Helios Corporate Refinery",
                    category: "Locations",
                    text: LOCATIONS_DATA["Helios Refinery"].scanFlavor,
                    unlocked: false
                };
            }
            if (!LORE_DATABASE.LOCATION_PORT_NOMAD) {
                LORE_DATABASE.LOCATION_PORT_NOMAD = {
                    title: "Port Nomad",
                    category: "Locations",
                    text: LOCATIONS_DATA["Port Nomad"].scanFlavor,
                    unlocked: false
                };
            }
        }

        // 3. Persist worldStateDeltas on Static Locations in chunkManager
        if (typeof chunkManager !== 'undefined' && typeof chunkManager.generateChunk === 'function' && !window._locDeltaPatched) {
            const origGenChunk = chunkManager.generateChunk.bind(chunkManager);
            chunkManager.generateChunk = function(chunkX, chunkY) {
                const chunkData = origGenChunk(chunkX, chunkY);
                if (typeof worldStateDeltas === 'undefined') return chunkData;

                for (let y = 0; y < this.CHUNK_SIZE; y++) {
                    for (let x = 0; x < this.CHUNK_SIZE; x++) {
                        const worldX = chunkX * this.CHUNK_SIZE + x;
                        const worldY = chunkY * this.CHUNK_SIZE + y;
                        const deltaKey = `${worldX},${worldY}`;
                        if (this.staticLocations.has(deltaKey) && worldStateDeltas[deltaKey]) {
                            if (typeof chunkData[y][x] === 'object' && chunkData[y][x] !== null) {
                                Object.assign(chunkData[y][x], worldStateDeltas[deltaKey]);
                            }
                        }
                    }
                }
                return chunkData;
            };
            chunkManager. initializeStaticLocations();
            chunkManager.loadedChunks = {};
            chunkManager.lastChunkKey = null;
            chunkManager.lastChunkRef = null;
            window._locDeltaPatched = true;
        }

        // 4. Prevent Concord Customs Scans at Non-Concord Hubs & Black Markets
        if (typeof window.performCustomsScan === 'function' && !window._locCustomsPatched) {
            const origCustoms = window.performCustomsScan;
            window.performCustomsScan = function() {
                if (typeof chunkManager !== 'undefined') {
                    const tile = chunkManager.getTile(playerX, playerY);
                    if (tile && tile.type === 'location') {
                        // Black Markets, K'tharr, Eclipse, and Independent hubs do not run Concord customs!
                        if (tile.isBlackMarket || (tile.faction && tile.faction !== 'CONCORD')) {
                            return true;
                        }
                    }
                }
                return origCustoms.apply(this, arguments);
            };
            window._locCustomsPatched = true;
        }

        // 5. Prevent Planet Xerxes Enter-Key Bypass & Inject Mission Turn-In Buttons at Stations
        if (typeof window.openStationView === 'function' && !window._locStationPatched) {
            const origOpenStation = window.openStationView;
            window.openStationView = function() {
                const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;

                // Always route Planet Xerxes to its dedicated Spire/Rogue World interface
                if (location && location.name && location.name.includes("Xerxes")) {
                    if (typeof openXerxesView === 'function') {
                        openXerxesView();
                        return;
                    }
                }

                origOpenStation.apply(this, arguments);

                // Inject Active Mission Turn-In / Delivery Buttons into the Station Concourse & Bottom HUD
                if (!location || typeof playerActiveMission === 'undefined' || !playerActiveMission) return;

                const menuGrid = document.getElementById('dynamicStationMenu');
                const obj = playerActiveMission.objectives && playerActiveMission.objectives[0] ? playerActiveMission.objectives[0] : null;

                // A. Delivery Objective at Destination Station
                if (!playerActiveMission.isComplete && playerActiveMission.type === "DELIVERY" && obj && location.name === obj.destinationName) {
                    if (menuGrid) {
                        const delivBtn = document.createElement('button');
                        delivBtn.className = 'station-action-btn';
                        delivBtn.style.cssText = 'border: 1px solid var(--gold-text); border-left: 4px solid var(--gold-text); background: rgba(255, 215, 0, 0.08); grid-column: span 2;';
                        delivBtn.innerHTML = `
                            <div class="btn-icon">📦</div>
                            <div>
                                <div class="btn-label" style="color:var(--gold-text);">Complete Contract Delivery</div>
                                <span class="btn-sub" style="color:var(--text-color);">Deliver ${obj.count}x ${COMMODITIES[obj.itemID] ? COMMODITIES[obj.itemID].name : obj.itemID}</span>
                            </div>
                        `;
                        delivBtn.onclick = () => {
                            if (typeof handleCompleteDelivery === 'function') handleCompleteDelivery();
                            window.openStationView();
                        };
                        menuGrid.prepend(delivBtn);
                    }
                }

                // B. Acquire Objective at Giver Station
                if (!playerActiveMission.isComplete && playerActiveMission.type === "ACQUIRE" && obj && location.name === playerActiveMission.giver) {
                    if (menuGrid) {
                        const acqBtn = document.createElement('button');
                        acqBtn.className = 'station-action-btn';
                        acqBtn.style.cssText = 'border: 1px solid var(--gold-text); border-left: 4px solid var(--gold-text); background: rgba(255, 215, 0, 0.08); grid-column: span 2;';
                        acqBtn.innerHTML = `
                            <div class="btn-icon">💎</div>
                            <div>
                                <div class="btn-label" style="color:var(--gold-text);">Turn In Contract Resources</div>
                                <span class="btn-sub" style="color:var(--text-color);">Deliver ${obj.count}x ${COMMODITIES[obj.itemID] ? COMMODITIES[obj.itemID].name : obj.itemID}</span>
                            </div>
                        `;
                        acqBtn.onclick = () => {
                            if (typeof handleTurnInAcquire === 'function') handleTurnInAcquire();
                            window.openStationView();
                        };
                        menuGrid.prepend(acqBtn);
                    }
                }

                // C. Completed Contract Reward Claim at Giver Station (or Shadow Broker at Black Markets)
                const isGiverHere = (location.name === playerActiveMission.giver) ||
                                    (playerActiveMission.giver === "Shadow Broker" && location.isBlackMarket);

                if (playerActiveMission.isComplete && isGiverHere) {
                    if (menuGrid) {
                        const rewardBtn = document.createElement('button');
                        rewardBtn.className = 'station-action-btn';
                        rewardBtn.style.cssText = 'border: 1px solid var(--success); border-left: 4px solid var(--success); background: rgba(0, 255, 0, 0.08); grid-column: span 2;';
                        rewardBtn.innerHTML = `
                            <div class="btn-icon">🏆</div>
                            <div>
                                <div class="btn-label" style="color:var(--success);">Claim Contract Reward (${formatNumber(playerActiveMission.rewards.credits)}c)</div>
                                <span class="btn-sub" style="color:var(--text-color);">${playerActiveMission.title}</span>
                            </div>
                        `;
                        rewardBtn.onclick = () => {
                            // Support Shadow Broker smuggling payouts at any Black Market
                            if (playerActiveMission.giver === "Shadow Broker" && location.isBlackMarket) {
                                playerActiveMission.giver = location.name;
                            }
                            if (typeof grantMissionRewards === 'function') grantMissionRewards();
                            if (typeof currentGameState !== 'undefined' && currentGameState !== 'level_up') {
                                window.openStationView();
                            }
                        };
                        menuGrid.prepend(rewardBtn);
                    }
                }
            };
            window._locStationPatched = true;
        }

        // 6. Keep Delivery Destinations Reasonable for Early-Game Players
        if (typeof window.selectRandomDestination === 'function' && !window._locDestPatched) {
            window.selectRandomDestination = function(currentStationName) {
                const allKeys = Object.keys(LOCATIONS_DATA);
                const maxDist = (typeof playerLevel !== 'undefined' && playerLevel < 3) ? 300 : Infinity;

                let candidates = allKeys.filter(key => {
                    if (key === currentStationName || key === "Planet Xerxes") return false;
                    const loc = LOCATIONS_DATA[key];
                    if (!loc || !loc.buys || loc.buys.length === 0) return false;
                    const dist = Math.sqrt(Math.pow(loc.coords.x - playerX, 2) + Math.pow(loc.coords.y - playerY, 2));
                    return dist <= maxDist;
                });

                if (candidates.length === 0) {
                    candidates = allKeys.filter(key => key !== currentStationName && key !== "Planet Xerxes" && LOCATIONS_DATA[key].buys && LOCATIONS_DATA[key].buys.length > 0);
                }
                if (candidates.length === 0) return null;

                const destKey = candidates[Math.floor(Math.random() * candidates.length)];
                const destData = LOCATIONS_DATA[destKey];
                const secX = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destData.coords.x / SECTOR_SIZE) : 0;
                const secY = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destData.coords.y / SECTOR_SIZE) : 0;

                return {
                    name: destKey,
                    key: `${secX},${secY}`,
                    coords: destData.coords
                };
            };
            window._locDestPatched = true;
        }
    });
})();

// --- END OF FILE locations.js ---
