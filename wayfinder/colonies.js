// --- START OF FILE colonies.js ---

// ==========================================
// --- WAYFINDER COLONY SIMULATION ENGINE ---
// ==========================================

const COLONY_PHASES = ['OUTPOST', 'SETTLEMENT', 'METROPOLIS', 'CAPITAL'];

const COLONY_POLICY_META = {
    BALANCED:      { color: "var(--text-color)",   desc: "Standard civic administration. No penalties or extreme shifts." },
    INDUSTRY:      { color: "var(--warning)",      desc: "2x Mineral extraction output across all mining facilities." },
    WEALTH:        { color: "var(--gold-text)",    desc: "2x Tax revenue multiplier, but heavy levies cause -5 Morale/SD." },
    MILITIA:       { color: "var(--danger)",       desc: "+40 Planetary Defense Rating; -15% Tax revenue." },
    RESEARCH:      { color: "var(--accent-color)", desc: "2x Passive XP output from relays & labs; -50% Tax revenue." },
    UTOPIAN:       { color: "#FF88FF",             desc: "+10 Morale recovery/SD; 0% Tax collection." },
    EXPANSIONIST:  { color: "#44FF44",             desc: "2x Population growth rate; +50% Food demand and -20 Defense." },
    SURVIVALIST:   { color: "#AAAAAA",             desc: "-20% Food consumption & +10 Defense; -50% Population growth." },
    AUTHORITARIAN: { color: "#888888",             desc: "+100 Defense & +40% Taxes; Morale locked at 40% & -50% growth." }
};
Object.freeze(COLONY_POLICY_META);

// --- 1. COLONY DATA STRUCTURES ---
// The engine is data-driven. Add any effects here, and the Tick Engine handles the math automatically.
const COLONY_BUILDINGS = {
    // --- TIER 1: OUTPOST ---
    "HAB_BLOCK": {
        name: "Habitation Block", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 15, "TECH_PARTS": 2 },
        upkeep: 10, time: 8, effects: { popCap: 500 },
        desc: "Standard housing. +500 Max Population."
    },
    "SHANTY_TOWN": {
        name: "Shanty Town", tier: 1, unique: false,
        cost: { "MINERALS": 10 },
        upkeep: 2, time: 5, effects: { popCap: 200, moralePenalty: 1 },
        desc: "Cheap, unregulated housing. +200 Max Population, but poor conditions cause -1 Morale."
    },
    "RAIN_CATCHERS": {
        name: "Rain Catchers", tier: 1, unique: false,
        cost: { "MINERALS": 10 },
        upkeep: 2, time: 4, effects: { waterProd: 2 },
        desc: "Extremely basic water collection. Generates 2 Water per Stardate."
    },
    "WIND_TRAPS": {
        name: "Moisture Wind Traps", tier: 1, unique: false,
        cost: { "MINERALS": 20, "TECH_PARTS": 2 },
        upkeep: 5, time: 5, effects: { waterProd: 5 },
        desc: "Low-tech moisture farming. Generates 5 Water per Stardate."
    },
    "SOLAR_STILLS": {
        name: "Solar Stills", tier: 1, unique: false,
        cost: { "MINERALS": 30 },
        upkeep: 5, time: 8, effects: { waterProd: 3, passiveCredits: 10 },
        desc: "Slowly evaporates moisture and sells excess energy. Generates 3 Water and 10c per Stardate."
    },
    "WATER_EXTRACTOR": {
        name: "Atmospheric Condenser", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 15, "TECH_PARTS": 5 },
        upkeep: 20, time: 10, effects: { waterProd: 10 },
        desc: "Advanced condensation. Generates 10 Water per Stardate."
    },
    "MYCELIUM_CAVES": {
        name: "Mycelium Caves", tier: 1, unique: false,
        cost: { "MINERALS": 15, "WATER": 5 },
        upkeep: 5, time: 6, effects: { foodProd: 2 },
        desc: "Super-cheap subterranean fungus farming. Generates 2 Food per Stardate."
    },
    "HYDRO_FARM": {
        name: "Hydroponics Farm", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 20, "TECH_PARTS": 5 },
        upkeep: 25, time: 15, effects: { foodProd: 5, consume: { "WATER": 2 } },
        desc: "Generates 5 Food. Consumes 2 Water per Stardate."
    },
    "ALGAE_VATS": {
        name: "Nutrient Algae Vats", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 10, "MINERALS": 10 },
        upkeep: 10, time: 12, effects: { foodProd: 3, moralePenalty: 1 },
        desc: "Generates 3 Food without needing Water. The awful taste reduces Morale by 1."
    },
    "SMELTING_FACILITY": {
        name: "Alloy Smelting Plant", tier: 1, unique: false,
        cost: { "MINERALS": 50, "TECH_PARTS": 10, "REFINED_ALLOY": 10 },
        upkeep: 40, time: 20, effects: { alloyProd: 3 },
        desc: "Refines raw ore, generating 3 Refined Alloys per Stardate."
    },
    "SCRAP_YARD": {
        name: "Scrap Yard", tier: 1, unique: false,
        cost: { "MINERALS": 30 },
        upkeep: 15, time: 10, effects: { alloyProd: 1 },
        desc: "Slowly recycles junk into usable materials. Generates 1 Refined Alloy per Stardate."
    },
    "ORE_CRUSHER": {
        name: "Ore Crusher", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 15 },
        upkeep: 25, time: 12, effects: { mineralProd: 5 },
        desc: "A noisy, brutal machine. Guaranteed to output 5 Minerals per Stardate."
    },
    "SCAVENGER_GUILD": {
        name: "Scavenger Guild", tier: 1, unique: true,
        cost: { "REFINED_ALLOY": 20, "FOOD_SUPPLIES": 10 },
        upkeep: 20, time: 14, effects: { mineralProd: 2, techProd: 1 },
        desc: "Locals comb the wastes. Passively generates 2 Minerals and 1 Tech Part."
    },
    "PROSPECTOR_CAMP": {
        name: "Prospector Camp", tier: 1, unique: true,
        cost: { "MINERALS": 25, "TECH_PARTS": 5 },
        upkeep: 30, time: 10, effects: { mineralProd: 5, passiveXP: 2 },
        desc: "Maps out local veins. Generates 5 Minerals and +2 XP per Stardate."
    },
    "CLINIC_TENT": {
        name: "Clinic Tent", tier: 1, unique: false,
        cost: { "MINERALS": 10, "REFINED_ALLOY": 5 },
        upkeep: 15, time: 5, effects: { medProd: 1, moraleBonus: 1 },
        desc: "Basic triage and first aid. Generates 1 Medical Supply and +1 Morale per Stardate."
    },
    "WATCHTOWER": {
        name: "Watchtower", tier: 1, unique: false,
        cost: { "MINERALS": 20, "REFINED_ALLOY": 5 },
        upkeep: 5, time: 5, effects: { defense: 5, moraleBonus: 1 },
        desc: "Provides early warning of pirate raids. +5 Defense and +1 Morale."
    },
    "MILITIA_TENT": {
        name: "Militia Tent", tier: 1, unique: false,
        cost: { "MINERALS": 20, "WEAPONS": 5 },
        upkeep: 25, time: 8, effects: { defense: 15 },
        desc: "Arms the locals. +15 Defense to deter early raids."
    },
    "AUTOMATED_TURRET": {
        name: "Automated Turret", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 15, "TECH_PARTS": 5 },
        upkeep: 15, time: 6, effects: { defense: 10 },
        desc: "A basic auto-tracking weapon. +10 Defense without needing Weapons to build."
    },
    "DUST_WALLS": {
        name: "Dust Walls", tier: 1, unique: true,
        cost: { "MINERALS": 40 },
        upkeep: 10, time: 12, effects: { defense: 10, moraleBonus: 1 },
        desc: "A basic physical perimeter. +10 Defense and +1 Morale from feeling secure."
    },
    "LOCAL_BAZAAR": {
        name: "Local Bazaar", tier: 1, unique: true,
        cost: { "MINERALS": 20, "REFINED_ALLOY": 10 },
        upkeep: 5, time: 15, effects: { taxMult: 0.1, passiveCredits: 50 },
        desc: "A gritty trading post. Generates 50c per Stardate and boosts tax yield by 10%."
    },
    "FRONTIER_TAVERN": {
        name: "Frontier Tavern", tier: 1, unique: false,
        cost: { "MINERALS": 20, "FOOD_SUPPLIES": 5 },
        upkeep: 10, time: 10, effects: { moraleBonus: 2, passiveCredits: 20 },
        desc: "A local watering hole. Grants +2 Morale and 20c per Stardate."
    },
    "OUTPOST_CANTINA": {
        name: "Outpost Cantina", tier: 1, unique: false,
        cost: { "MINERALS": 20, "FOOD_SUPPLIES": 10 },
        upkeep: 15, time: 10, effects: { moraleBonus: 3 },
        desc: "A place to drink and forget the frontier. Grants +3 Morale."
    },
    "HOLO_CASTER": {
        name: "Holo-Caster Array", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 10, "TECH_PARTS": 15 },
        upkeep: 20, time: 10, effects: { moraleBonus: 2 },
        desc: "Broadcasts off-world media to the colonists. +2 Morale per Stardate."
    },
    "COMM_RELAY": {
        name: "Comm-Relay Array", tier: 1, unique: true,
        cost: { "REFINED_ALLOY": 25, "TECH_PARTS": 10 },
        upkeep: 30, time: 12, effects: { moraleBonus: 1, passiveXP: 5 },
        desc: "Connects the colony to the galactic net. +1 Morale and +5 XP per Stardate."
    },
    "LISTENING_POST": {
        name: "Listening Post", tier: 1, unique: true,
        cost: { "REFINED_ALLOY": 10, "TECH_PARTS": 15 },
        upkeep: 40, time: 8, effects: { passiveXP: 10 },
        desc: "Eavesdrops on encrypted Concord transmissions. +10 XP per Stardate."
    },
    "STORAGE_SILOS": {
        name: "Reinforced Silos", tier: 1, unique: false,
        cost: { "REFINED_ALLOY": 30 },
        upkeep: 5, time: 10, effects: { storageCap: 2500 },
        desc: "Increases maximum colony storage capacity by 2,500 units."
    },

    // --- TIER 2: SETTLEMENT ---
    "ORBITAL_WAREHOUSE": {
        name: "Orbital Bulk Depot", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 65, "TECH_PARTS": 20 },
        upkeep: 60, time: 20, effects: { storageCap: 5000, taxMult: 0.10 },
        desc: "Zero-G freight depot. Adds +5,000 Storage Capacity and +10% Tax Yield."
    },
    "DEEP_CORE_RIG": {
        name: "Deep Core Rig", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 80, "TECH_PARTS": 25 },
        upkeep: 150, time: 30, effects: { mineralProd: 15 },
        desc: "Heavy industrial mining. Generates 15 Minerals per Stardate."
    },
    "DRONE_HUB": {
        name: "Automated Drone Hub", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 80, "TECH_PARTS": 40 },
        upkeep: 200, time: 30, effects: { mineralProd: 5, alloyProd: 2 },
        desc: "Self-sustaining miners. Generates 5 Minerals and 2 Alloys per Stardate."
    },
    "ATMOS_PROCESSOR": {
        name: "Atmos-Processor", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 60, "TECH_PARTS": 20, "VOID_CRYSTALS": 1 },
        upkeep: 100, time: 35, effects: { moraleBonus: 3 },
        desc: "Purifies air, passively regenerating 3 Morale per Stardate."
    },
    "HYDROPONIC_ORCHARDS": {
        name: "Hydroponic Orchards", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 60, "TECH_PARTS": 15, "WATER": 20 },
        upkeep: 80, time: 25, effects: { foodProd: 12, consume: { "WATER": 4 } },
        desc: "Massive indoor fruit cultivation. Generates 12 Food. Consumes 4 Water."
    },
    "PROTEIN_VATS": {
        name: "Synthetic Protein Vats", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 50, "TECH_PARTS": 30, "WATER": 50 },
        upkeep: 120, time: 25, effects: { foodProd: 15, consume: { "WATER": 5 } },
        desc: "Mass-produces 15 Food. Consumes 5 Water per Stardate."
    },
    "DEFENSE_BATTERY": {
        name: "Surface Defense Battery", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 40, "WEAPONS": 15 },
        upkeep: 100, time: 20, effects: { defense: 50 },
        desc: "Adds 50 Defense Rating to deter raids."
    },
    "LAW_ENFORCEMENT_HQ": {
        name: "Law Enforcement HQ", tier: 2, unique: true,
        cost: { "REFINED_ALLOY": 50, "WEAPONS": 20, "TECH_PARTS": 10 },
        upkeep: 150, time: 22, effects: { defense: 30, moraleBonus: 2, crimeReduction: 15 },
        desc: "Establishes order. +30 Defense, +2 Morale, suppresses Black Market penalties."
    },
    "AUTOMATED_FACTORY": {
        name: "Automated Factory", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 100, "TECH_PARTS": 30, "AI_CORE": 1 },
        upkeep: 200, time: 40, effects: { techProd: 2, consume: { "REFINED_ALLOY": 2 } },
        desc: "Generates 2 Tech Parts. Consumes 2 Refined Alloys per Stardate."
    },
    "MUNITIONS_PLANT": {
        name: "Munitions Plant", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 80, "TECH_PARTS": 20 },
        upkeep: 200, time: 30, effects: { weaponProd: 1, consume: { "REFINED_ALLOY": 5, "MINERALS": 5 } },
        desc: "Actively manufactures 1 unit of Weapons. Consumes 5 Alloys and 5 Minerals."
    },
    "RECYCLING_PLANT": {
        name: "Industrial Recycling Plant", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 40, "TECH_PARTS": 10 },
        upkeep: 100, time: 25, effects: { alloyProd: 2, techProd: 1, moralePenalty: 1 },
        desc: "Turns waste into 2 Alloys and 1 Tech Part per Stardate, but the smog reduces Morale by 1."
    },
    "ADVANCED_ARMORY": {
        name: "Advanced Armory", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 120, "TECH_PARTS": 50, "WEAPONS": 50 },
        upkeep: 250, time: 30, effects: { troopProd: 1, consume: { "FOOD_SUPPLIES": 5, "REFINED_ALLOY": 5 } },
        desc: "Trains 1 Mercenary Platoon per Stardate. Consumes 5 Food and 5 Alloys."
    },
    "SYNTHETIC_WEAVERS": {
        name: "Synthetic Weavers", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 80, "TECH_PARTS": 40 },
        upkeep: 200, time: 30, effects: { luxuryProd: 2, consume: { "WATER": 3, "MINERALS": 5 } },
        desc: "Generates 2 Luxury Goods per Stardate. Consumes 3 Water and 5 Minerals."
    },
    "STIM_LAB": {
        name: "Underground Stim Lab", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 40, "TECH_PARTS": 15 },
        upkeep: 100, time: 20, effects: { stimProd: 2, moralePenalty: 1, consume: { "MEDICAL_SUPPLIES": 1, "MINERALS": 2 } },
        desc: "Illegally synthesizes 2 Combat Stims. Consumes Meds and Minerals. -1 Morale."
    },
    "MEDICAL_CLINIC": {
        name: "Frontier Clinic", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 30, "MEDICAL_SUPPLIES": 20, "TECH_PARTS": 10 },
        upkeep: 80, time: 15, effects: { medProd: 2, moraleBonus: 1 },
        desc: "Synthesizes 2 Medical Supplies per Stardate and boosts morale."
    },
    "CIVILIAN_SPACEPORT": {
        name: "Civilian Spaceport", tier: 2, unique: true,
        cost: { "REFINED_ALLOY": 120, "TECH_PARTS": 40 },
        upkeep: 250, time: 30, effects: { taxMult: 0.25, popGrowthMult: 1.5 },
        desc: "Establishes commercial flight paths. +25% Tax Yields and boosts pop growth rate."
    },
    "COMMERCE_HUB": {
        name: "Galactic Commerce Hub", tier: 2, unique: true,
        cost: { "REFINED_ALLOY": 60, "TECH_PARTS": 25, "LUXURY_GOODS": 10 },
        upkeep: 400, time: 30, effects: { taxMult: 0.5 },
        desc: "Attracts off-world traders. Increases overall tax revenue by 50%."
    },

    // --- TIER 3: METROPOLIS ---
    "ARCOLOGY_SPIRE": {
        name: "Arcology Spire", tier: 3, unique: false,
        cost: { "REFINED_ALLOY": 200, "TECH_PARTS": 100, "VOID_CRYSTALS": 3 },
        upkeep: 1500, time: 60, effects: { popCap: 5000, moraleBonus: 2 },
        desc: "A self-contained utopia. +5,000 Max Population and +2 Morale."
    },
    "XENOBOTANY_DOME": {
        name: "Xenobotany Dome", tier: 3, unique: false,
        cost: { "REFINED_ALLOY": 150, "WATER": 100, "TECH_PARTS": 50 },
        upkeep: 500, time: 40, effects: { foodProd: 10, medProd: 5 },
        desc: "Cultivates rare flora. Generates 10 Food and 5 Medical Supplies per Stardate."
    },
    "MECH_FOUNDRY": {
        name: "Goliath Mech Foundry", tier: 3, unique: false,
        cost: { "REFINED_ALLOY": 220, "TECH_PARTS": 90, "AI_CORE": 1 },
        upkeep: 850, time: 55, effects: { mechProd: 1, defense: 45, consume: { "REFINED_ALLOY": 10, "TECH_PARTS": 6 } },
        desc: "Assembles 1 Goliath Assault Mech per Stardate (+45 Defense). Consumes 10 Alloys and 6 Tech Parts."
    },
    "VOID_CONDUIT_EXTRACTOR": {
        name: "Void-Resonance Tap", tier: 3, unique: true,
        cost: { "REFINED_ALLOY": 260, "TECH_PARTS": 120, "VOID_CRYSTALS": 4 },
        upkeep: 1200, time: 65, effects: { voidProd: 1, passiveXP: 15, moralePenalty: 2 },
        desc: "Condenses subspace anomalies into 1 Void Crystal & +15 XP per Stardate. Eerie harmonics cause -2 Morale."
    },
    "SPACE_ELEVATOR": {
        name: "Orbital Space Elevator", tier: 3, unique: true,
        cost: { "REFINED_ALLOY": 500, "TECH_PARTS": 200, "AI_CORE": 2 },
        upkeep: 2500, time: 90, effects: { taxMult: 1.0 },
        desc: "A tether to the heavens. +100% tax revenue and is required to become a Capital."
    },
    "PLANETARY_ION_CANNON": {
        name: "Planetary Ion Cannon", tier: 3, unique: true,
        cost: { "REFINED_ALLOY": 300, "TECH_PARTS": 100, "WEAPONS": 50, "AI_CORE": 2 },
        upkeep: 4000, time: 65, effects: { defense: 500 },
        desc: "An apocalyptic surface-to-orbit weapon. Grants +500 Defense."
    },
    "ORBITAL_SHIPYARD": {
        name: "Orbital Shipyard", tier: 3, unique: true,
        cost: { "REFINED_ALLOY": 400, "TECH_PARTS": 200, "AI_CORE": 3 },
        upkeep: 1500, time: 100, effects: { passiveCredits: 5000 },
        desc: "Constructs and sells civilian freighters automatically. Generates 5,000c per Stardate."
    },
    "AI_RESEARCH_LAB": {
        name: "A.I. Research Hub", tier: 3, unique: true,
        cost: { "REFINED_ALLOY": 150, "TECH_PARTS": 100, "AI_CORE": 1 },
        upkeep: 1500, time: 50, effects: { passiveXP: 100, techProd: 5 },
        desc: "A sprawling silicon mind. Generates an incredible 100 XP and 5 Tech Parts per Stardate."
    },
    "SYNDICATE_HEADQUARTERS": {
        name: "Syndicate Headquarters", tier: 3, unique: true,
        cost: { "REFINED_ALLOY": 100, "WEAPONS": 100, "LUXURY_GOODS": 50 },
        upkeep: 0, time: 40, effects: { illegalTaxes: 2500, defense: -100, moralePenalty: 5 },
        desc: "The absolute apex of organized crime. Launders 2,500c per tick. Decimates Defense (-100) and Morale (-5)."
    },

    // --- TIER 4: CAPITAL (MEGASTRUCTURES) ---
    "INTERSTELLAR_EXCHANGE": {
        name: "Interstellar Exchange", tier: 4, unique: true,
        cost: { "REFINED_ALLOY": 1000, "TECH_PARTS": 500, "LUXURY_GOODS": 100, "AI_CORE": 5 },
        upkeep: 5000, time: 150, effects: { autoTrade: true },
        desc: "Automatically sells 10% of excess colony resources to the galactic market for pure credits every Stardate (preserves Food & Water reserves)."
    },
    "ASTRAL_MONUMENT": {
        name: "Astral Monument", tier: 4, unique: true,
        cost: { "REFINED_ALLOY": 2000, "LUXURY_GOODS": 1000, "ANCIENT_RELICS": 10, "VOID_CRYSTALS": 10 },
        upkeep: 2500, time: 180, effects: { moraleBonus: 20, passiveCredits: 10000 },
        desc: "A staggering, awe-inspiring megastructure. Generates +20 Morale and 10,000c per Stardate from galactic tourism."
    },
    "AI_OVERLORD_CORE": {
        name: "A.I. Overlord Core", tier: 4, unique: true,
        cost: { "REFINED_ALLOY": 2000, "TECH_PARTS": 1000, "AI_CORE": 20, "VOID_CRYSTALS": 5 },
        upkeep: 12000, time: 250, effects: { omniProd: 2.0, moralePenalty: 10 },
        desc: "Cedes control to a hyper-intelligent AI. Doubles all factory outputs, but heavily penalizes morale."
    }
};
Object.freeze(COLONY_BUILDINGS);

let currentColonyTab = 'OVERVIEW';
let currentBlueprintFilter = 'ALL';

// ==========================================
// --- INTERNAL COLONY HELPERS ---
// ==========================================

function _colEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _colEscapeJsArg(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function _colFormat(num) {
    if (typeof formatNumber === 'function') return formatNumber(num);
    return String(Math.trunc(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function _hydrateColony(colony) {
    if (!colony) return null;
    if (!colony.storage || typeof colony.storage !== 'object') colony.storage = {};
    if (!colony.buildings || typeof colony.buildings !== 'object') colony.buildings = { "HAB_BLOCK": 1 };
    if (!Array.isArray(colony.alerts)) colony.alerts = [];
    if (!colony.demographics || typeof colony.demographics !== 'object') {
        colony.demographics = { "Human": 70, "K'tharr": 10, "Synthetic": 10, "Void-Born": 10 };
    }
    if (!colony.phase || COLONY_PHASES.indexOf(colony.phase) === -1) colony.phase = 'OUTPOST';
    if (!colony.policy || !COLONY_POLICY_META[colony.policy]) colony.policy = 'BALANCED';
    if (typeof colony.population !== 'number' || isNaN(colony.population)) colony.population = 50;
    if (typeof colony.morale !== 'number' || isNaN(colony.morale)) colony.morale = 100;
    if (typeof colony.treasury !== 'number' || isNaN(colony.treasury)) colony.treasury = 0;
    if (typeof colony.growthProgress !== 'number' || isNaN(colony.growthProgress)) colony.growthProgress = 0;
    return colony;
}

function _pushColonyAlert(colony, htmlMsg) {
    if (!colony) return;
    if (!Array.isArray(colony.alerts)) colony.alerts = [];
    const sd = (typeof currentGameDate !== 'undefined' && !isNaN(currentGameDate)) ? Number(currentGameDate).toFixed(1) : "0.0";
    colony.alerts.unshift(`<span style="color:#666;">[SD ${sd}]</span> ${htmlMsg}`);
    while (colony.alerts.length > 8) colony.alerts.pop();
}

function _resolveColonyBiome(colony) {
    if (!colony || typeof PLANET_BIOMES === 'undefined') return null;
    if (PLANET_BIOMES[colony.biome]) return PLANET_BIOMES[colony.biome];
    const legacyKey = Object.keys(PLANET_BIOMES).find(k => PLANET_BIOMES[k].name === colony.biome);
    return legacyKey ? PLANET_BIOMES[legacyKey] : null;
}

// Unified data-driven stat aggregator shared by BOTH the UI and Stardate Tick Engine
function _computeColonyStats(colony) {
    _hydrateColony(colony);
    const policy = colony.policy || 'BALANCED';

    const stats = {
        upkeep: 0, popCap: 0, storageCap: 1000, defense: 0,
        waterProd: 0, foodProd: 0, alloyProd: 0, techProd: 0, mineralProd: 0,
        weaponProd: 0, mechProd: 0, troopProd: 0, luxuryProd: 0, stimProd: 0, medProd: 0, voidProd: 0,
        moraleRegen: 0, moraleBonus: 0, moralePenalty: 0,
        taxMult: 1.0, taxFlat: 0, illegalTaxes: 0,
        passiveCredits: 0, passiveXP: 0,
        crimeReduction: 0, popGrowthMult: 1.0, foodEfficiency: 1.0, omniProd: 1.0,
        miningBoost: 1.0, resourceMult: 1.0, autoTrade: false,
        consume: {}
    };

    for (const [bId, count] of Object.entries(colony.buildings)) {
        const bData = COLONY_BUILDINGS[bId];
        if (bData && count > 0) {
            stats.upkeep += (bData.upkeep || 0) * count;

            if (bData.effects) {
                for (const [effect, val] of Object.entries(bData.effects)) {
                    if (effect === 'taxMult') stats.taxMult += (val * count);
                    else if (effect === 'popGrowthMult') stats.popGrowthMult *= Math.pow(val, count);
                    else if (effect === 'foodEfficiency') stats.foodEfficiency *= Math.pow(val, count);
                    else if (effect === 'omniProd') stats.omniProd *= Math.pow(val, count);
                    else if (effect === 'miningBoost') stats.miningBoost *= Math.pow(val, count);
                    else if (effect === 'resourceMult') stats.resourceMult *= Math.pow(val, count);
                    else if (effect === 'autoTrade') stats.autoTrade = val;
                    else if (effect === 'consume') {
                        let prodType = 'general';
                        if (bData.effects.foodProd) prodType = 'food';
                        else if (bData.effects.techProd) prodType = 'tech';
                        else if (bData.effects.weaponProd) prodType = 'weapons';
                        else if (bData.effects.troopProd) prodType = 'troops';
                        else if (bData.effects.mechProd) prodType = 'mechs';
                        else if (bData.effects.stimProd) prodType = 'stims';
                        else if (bData.effects.luxuryProd) prodType = 'luxury';

                        if (!stats.consume[prodType]) stats.consume[prodType] = {};
                        for (const [cId, cVal] of Object.entries(val)) {
                            stats.consume[prodType][cId] = (stats.consume[prodType][cId] || 0) + (cVal * count);
                        }
                    } else {
                        stats[effect] = (stats[effect] || 0) + (val * count);
                    }
                }
            }
        }
    }

    const biomeDef = _resolveColonyBiome(colony);
    if (biomeDef) {
        if (biomeDef.id === 'VOLCANIC') { stats.alloyProd = Math.floor(stats.alloyProd * 1.5); }
        else if (biomeDef.id === 'GLACIAL' || biomeDef.id === 'OCEANIC') { stats.waterProd = Math.floor(stats.waterProd * 1.5); }
        else if (biomeDef.id === 'DESERT') { stats.waterProd = Math.floor(stats.waterProd * 0.5); }
        else if (biomeDef.id === 'MACHINE_WORLD') { stats.techProd = Math.floor(stats.techProd * 1.5); }
        else if (biomeDef.id === 'KARST_CAVERN') { stats.mineralProd = Math.floor(stats.mineralProd * 1.25); stats.waterProd = Math.floor(stats.waterProd * 1.25); }
        else if (biomeDef.id === 'TIDAL_LOCKED') { stats.waterProd = Math.floor(stats.waterProd * 1.25); stats.upkeep = Math.floor(stats.upkeep * 0.75); }
        else if (biomeDef.id === 'TERRAN') { stats.moraleBonus += 5; stats.popGrowthMult *= 1.25; }
        else if (biomeDef.id === 'BIOLUMINESCENT') { stats.moraleBonus += 10; stats.foodProd = Math.floor(stats.foodProd * 1.25); }
        else if (biomeDef.id === 'MYCELIAL') { stats.medProd = Math.floor(stats.medProd * 1.5); }
    }

    if (policy === 'MILITIA') { stats.defense += 40; stats.taxMult *= 0.85; }
    if (policy === 'AUTHORITARIAN') { stats.defense += 100; stats.taxMult *= 1.4; stats.moralePenalty += 20; stats.popGrowthMult *= 0.5; }
    if (policy === 'SURVIVALIST') { stats.defense += 10; stats.foodEfficiency *= 0.8; stats.popGrowthMult *= 0.5; }
    if (policy === 'EXPANSIONIST') { stats.defense -= 20; stats.foodEfficiency *= 1.5; stats.popGrowthMult *= 2.0; }
    if (policy === 'INDUSTRY') { stats.mineralProd *= 2; }
    if (policy === 'WEALTH') { stats.taxMult *= 2; stats.moralePenalty += 5; }
    if (policy === 'UTOPIAN') { stats.moraleRegen += 10; stats.taxMult = 0; }
    if (policy === 'RESEARCH') { stats.passiveXP *= 2; stats.taxMult *= 0.5; }

    stats.defense = Math.max(0, stats.defense);

    const eff = colony.treasury < 0 ? 0.5 : 1.0;
    const moraleMult = policy === 'AUTHORITARIAN' ? 1.0 : (colony.morale / 100);
    const estTax = Math.floor(colony.population * 0.5 * stats.taxMult * moraleMult);
    const estCrime = Math.floor((stats.crimeReduction > 0 ? stats.illegalTaxes * 0.5 : stats.illegalTaxes) * eff);
    const estNetCredits = estTax + Math.floor(stats.passiveCredits * eff) + estCrime - stats.upkeep;

    const estFoodNeed = Math.ceil((colony.population / 100) * stats.foodEfficiency);
    const estFoodProd = Math.floor(stats.foodProd * eff * stats.omniProd);
    const estWaterNeed = Math.floor(((stats.consume.food?.WATER || 0) + (stats.consume.luxury?.WATER || 0)) * eff);
    const estWaterProd = Math.floor(stats.waterProd * eff * stats.omniProd);

    return {
        stats,
        biomeDef,
        eff,
        estNetCredits,
        estFoodNeed,
        estFoodProd,
        estWaterNeed,
        estWaterProd
    };
}

function closeColonyDashboard() {
    if (typeof closeGenericModal === 'function') closeGenericModal();
    if (typeof currentGameState !== 'undefined' && typeof GAME_STATES !== 'undefined' && currentGameState === GAME_STATES.PLANET_VIEW) {
        if (typeof renderPlanetView === 'function') renderPlanetView();
    } else if (typeof handleInteraction === 'function') {
        handleInteraction();
    }
}

// --- 2. FOUNDING A COLONY ---
function establishColony(locationIndex) {
    if (typeof locationIndex !== 'number') locationIndex = typeof selectedPlanetIndex !== 'undefined' ? selectedPlanetIndex : 0;

    if ((playerCargo["COLONY_CHARTER"] || 0) < 1) {
        logMessage("<span style='color:var(--danger)'>You need a Concord Colony Charter to legally claim a world.</span>");
        return;
    }

    if (typeof currentSystemData === 'undefined' || !currentSystemData || !Array.isArray(currentSystemData.planets) || !currentSystemData.planets[locationIndex]) {
        logMessage("<span style='color:var(--danger)'>Unable to lock planetary landing beacon for colonization.</span>");
        return;
    }

    const planet = currentSystemData.planets[locationIndex];
    const sysX = currentSystemData.x !== undefined ? currentSystemData.x : playerX;
    const sysY = currentSystemData.y !== undefined ? currentSystemData.y : playerY;

    playerCargo["COLONY_CHARTER"]--;
    if (playerCargo["COLONY_CHARTER"] <= 0) delete playerCargo["COLONY_CHARTER"];
    if (typeof playerHasColonyCharter !== 'undefined') {
        playerHasColonyCharter = (playerCargo["COLONY_CHARTER"] || 0) > 0;
    }
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    const colId = `${sysX}_${sysY}_p${locationIndex}`;
    const defaultName = `${planet.biome.name} Prime`;
    const rawName = prompt("Designate your new frontier colony (max 28 chars):", defaultName);
    const cleanName = (rawName && typeof rawName === 'string')
        ? (rawName.replace(/[<>"'`&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 28) || defaultName)
        : defaultName;

    const humBase = 60 + Math.floor(Math.random() * 20);
    const kthBase = 5 + Math.floor(Math.random() * 15);
    const synBase = 5 + Math.floor(Math.random() * 10);
    const voidBase = Math.max(0, 100 - (humBase + kthBase + synBase));

    playerColonies[colId] = {
        id: colId,
        name: cleanName,
        x: sysX,
        y: sysY,
        planetIndex: locationIndex,
        established: true,
        phase: 'OUTPOST',
        policy: 'BALANCED',
        population: 50,
        demographics: {
            "Human": humBase,
            "K'tharr": kthBase,
            "Synthetic": synBase,
            "Void-Born": voidBase
        },
        growthProgress: 0,
        morale: 100,
        defense: 0,
        treasury: 0,
        storage: { "FOOD_SUPPLIES": 25, "WATER": 20, "REFINED_ALLOY": 30 },
        buildings: { "HAB_BLOCK": 1 },
        activeConstruction: null,
        biome: planet.biome.id || planet.biomeKey || 'BARREN_ROCK',
        lastTick: currentGameDate,
        alerts: []
    };

    _pushColonyAlert(playerColonies[colId], `<span style="color:var(--success)">[ CHARTER ] Pioneer landfall confirmed on ${_colEscapeHtml(planet.biome.name)}.</span>`);

    if (typeof updateWorldState === 'function') {
        updateWorldState(sysX, sysY, { hasColony: true, colonyId: colId }, colId);
    }

    logMessage(`<span style='color:var(--success); font-weight:bold;'>[ COLONY ESTABLISHED ]</span> Transports have landed at <b>${_colEscapeHtml(cleanName)}</b>. The frontier awaits.`);
    if (typeof addMilestone === 'function') {
        addMilestone(`Founded frontier colony '${cleanName}' on a ${planet.biome.name}.`);
    }
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("COLONY FOUNDED", "success");
    if (typeof autoSaveGame === 'function') autoSaveGame();

    closeGenericModal();
    openColonyManagement(colId);
}

function renameColony(colonyId) {
    const colony = playerColonies && playerColonies[colonyId];
    if (!colony) return;
    const raw = prompt("Rename colonial settlement (max 28 chars):", colony.name || "Colony");
    if (raw === null) return;
    const cleaned = raw.replace(/[<>"'`&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 28);
    if (!cleaned) return;
    colony.name = cleaned;
    if (typeof soundManager !== 'undefined') soundManager.playUIClick();
    if (typeof showToast === 'function') showToast("COLONY RENAMED", "success");
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openColonyManagement(colonyId);
}

// --- 3. COLONY DASHBOARD UI ---
function setColonyTab(colonyId, tab) {
    currentColonyTab = tab;
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    openColonyManagement(colonyId);
}

function setColonyBlueprintFilter(colonyId, filterKey) {
    currentBlueprintFilter = filterKey || 'ALL';
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    openColonyManagement(colonyId);
}

function openColonyManagement(colonyId) {
    if (typeof colonyId !== 'string') colonyId = null;

    if (!colonyId && typeof playerColonies !== 'undefined') {
        const localColonies = Object.values(playerColonies).filter(c => c && c.x === playerX && c.y === playerY);
        if (localColonies.length === 0) return;
        colonyId = localColonies[0].id;
    }

    const colony = playerColonies ? _hydrateColony(playerColonies[colonyId]) : null;
    if (!colony) return;

    openGenericModal(`GOVERNOR'S DESK: ${colony.name.toUpperCase()}`);

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    const safeColId = _colEscapeJsArg(colonyId);
    const { stats, biomeDef, estNetCredits, estFoodNeed, estFoodProd, estWaterNeed, estWaterProd } = _computeColonyStats(colony);
    colony.defense = stats.defense;

    const maxPop = stats.popCap;
    const maxStorage = stats.storageCap;
    const currentStorage = Object.values(colony.storage).reduce((a, b) => a + (Number(b) || 0), 0);
    const isStarving = (colony.storage['FOOD_SUPPLIES'] || 0) <= 0;
    const phaseIndex = COLONY_PHASES.indexOf(colony.phase);
    const inDebt = colony.treasury < 0;
    const efficiency = inDebt ? 50 : 100;

    const polMeta = COLONY_POLICY_META[colony.policy] || COLONY_POLICY_META.BALANCED;
    const foodNet = estFoodProd - estFoodNeed;
    const waterNet = estWaterProd - estWaterNeed;

    // --- LEFT PANE (Vitals) ---
    listEl.innerHTML = `
        <div style="padding:15px;">
            <div style="text-align:center; margin-bottom: 14px;">
                <div style="font-size:46px; filter: drop-shadow(0 0 15px ${isStarving ? 'var(--danger)' : 'var(--success)'}); margin-bottom:6px;">
                    ${isStarving ? '🏚️' : (phaseIndex === 3 ? '👑' : (phaseIndex === 2 ? '🏙️' : (phaseIndex === 1 ? '🏭' : '⛺')))}
                </div>
                <div style="font-size:13px; font-weight:bold; color:var(--item-name-color); cursor:pointer;" onclick="renameColony('${safeColId}')" title="Click to rename settlement">
                    ${_colEscapeHtml(colony.name)} <span style="font-size:11px; opacity:0.65;">✏️</span>
                </div>
                <div style="color:${isStarving ? 'var(--danger)' : 'var(--success)'}; font-weight:bold; letter-spacing:2px; font-size:11px; margin-top:4px;">STATUS: ${isStarving ? 'FAMINE' : colony.phase}</div>
                <div style="color:${inDebt ? 'var(--danger)' : 'var(--item-desc-color)'}; font-size:10px; margin-top:3px;">Efficiency: ${efficiency}%${biomeDef ? ` · ${_colEscapeHtml(biomeDef.name)}` : ''}</div>
            </div>

            <div class="trade-math-area" style="background: rgba(0,0,0,0.3); border: 1px solid #333; padding: 10px; border-radius: 4px; margin-bottom: 14px;">
                <div class="trade-stat-row"><span>Population:</span> <span style="color:var(--text-color); font-weight:bold;">${_colFormat(colony.population)} / ${_colFormat(maxPop)}</span></div>
                <div class="trade-stat-row"><span>Growth Progress:</span> <span style="color:${colony.morale >= 50 ? 'var(--success)' : 'var(--warning)'}; font-size:10px;">${Math.floor(colony.growthProgress)}% to influx</span></div>
                <div class="trade-stat-row" style="margin-top:6px;"><span>Morale:</span> <span style="color:${colony.morale >= 50 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${colony.morale}%</span></div>
                <div class="trade-stat-row"><span>Defense Rating:</span> <span style="color:var(--accent-color); font-weight:bold;">${colony.defense}</span></div>
                <div class="trade-stat-row" style="margin-top:6px; border-top:1px dashed #444; padding-top:5px;">
                    <span>Food / Water Net:</span>
                    <span style="font-size:11px; font-weight:bold;">
                        <span style="color:${foodNet >= 0 ? 'var(--success)' : 'var(--danger)'};">${foodNet >= 0 ? '+' : ''}${foodNet}F</span> /
                        <span style="color:${waterNet >= 0 ? 'var(--accent-color)' : 'var(--warning)'};">${waterNet >= 0 ? '+' : ''}${waterNet}W</span>
                    </span>
                </div>
                <div class="trade-stat-row">
                    <span>Net Credits / SD:</span>
                    <span style="color:${estNetCredits >= 0 ? 'var(--gold-text)' : 'var(--danger)'}; font-weight:bold;">${estNetCredits >= 0 ? '+' : ''}${_colFormat(estNetCredits)}c</span>
                </div>
                <div class="trade-stat-row"><span>Daily Upkeep:</span> <span style="color:var(--danger); font-size:11px;">-${_colFormat(stats.upkeep)}c</span></div>
            </div>
            
            <button class="action-button full-width-btn" style="margin-bottom:5px; border-color:${currentColonyTab === 'OVERVIEW' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${safeColId}', 'OVERVIEW')">OVERVIEW &amp; LOGS</button>
            <button class="action-button full-width-btn" style="margin-bottom:5px; border-color:${currentColonyTab === 'LOGISTICS' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${safeColId}', 'LOGISTICS')">LOGISTICS</button>
            <button class="action-button full-width-btn" style="border-color:${currentColonyTab === 'CONSTRUCTION' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${safeColId}', 'CONSTRUCTION')">ENGINEERING</button>
        </div>
    `;

    // --- RIGHT PANE (Dynamic Content) ---
    detailEl.innerHTML = `<div style="padding: 16px;" id="colonyTabContent"></div>`;
    const tabContent = document.getElementById('colonyTabContent');

    if (currentColonyTab === 'OVERVIEW') {
        let upgradeHtml = "";

        if (phaseIndex === 0) {
            const canUpgrade = colony.population >= 1000 && (colony.storage['REFINED_ALLOY'] || 0) >= 100 && (colony.storage['TECH_PARTS'] || 0) >= 25;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed var(--accent-color); padding:14px; border-radius:4px; margin-top:16px;">
                    <h4 style="color:var(--accent-color); margin:0 0 8px 0;">UPGRADE TO SETTLEMENT (TIER 2)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 1,000 Pop (${_colFormat(colony.population)}), 100 Alloys (${colony.storage['REFINED_ALLOY'] || 0}), 25 Tech Parts (${colony.storage['TECH_PARTS'] || 0}).</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? 'var(--success)' : 'var(--danger)'}; color:${canUpgrade ? 'var(--success)' : '#666'};" onclick="upgradeColonyPhase('${safeColId}')" ${!canUpgrade ? 'disabled' : ''}>AUTHORIZE EXPANSION</button>
                </div>
            `;
        } else if (phaseIndex === 1) {
            const canUpgrade = colony.population >= 5000 && (colony.storage['REFINED_ALLOY'] || 0) >= 500 && (colony.storage['TECH_PARTS'] || 0) >= 150 && (colony.storage['AI_CORE'] || 0) >= 2;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed var(--gold-text); padding:14px; border-radius:4px; margin-top:16px;">
                    <h4 style="color:var(--gold-text); margin:0 0 8px 0;">FOUND A METROPOLIS (TIER 3)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 5,000 Pop (${_colFormat(colony.population)}), 500 Alloys (${colony.storage['REFINED_ALLOY'] || 0}), 150 Tech (${colony.storage['TECH_PARTS'] || 0}), 2 AI Cores (${colony.storage['AI_CORE'] || 0}).</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? 'var(--gold-text)' : 'var(--danger)'}; color:${canUpgrade ? 'var(--gold-text)' : '#666'};" onclick="upgradeColonyPhase('${safeColId}')" ${!canUpgrade ? 'disabled' : ''}>AUTHORIZE EXPANSION</button>
                </div>
            `;
        } else if (phaseIndex === 2) {
            const hasElevator = (colony.buildings['SPACE_ELEVATOR'] || 0) > 0;
            const canUpgrade = hasElevator && colony.population >= 30000 && (colony.storage['REFINED_ALLOY'] || 0) >= 2000 && (colony.storage['TECH_PARTS'] || 0) >= 500 && (colony.storage['AI_CORE'] || 0) >= 5;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed #FF88FF; padding:14px; border-radius:4px; margin-top:16px;">
                    <h4 style="color:#FF88FF; margin:0 0 8px 0;">DECLARE SECTOR CAPITAL (TIER 4)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 30,000 Pop (${_colFormat(colony.population)}), Space Elevator (${hasElevator ? '✓' : '✗'}), 2,000 Alloys (${colony.storage['REFINED_ALLOY'] || 0}), 500 Tech (${colony.storage['TECH_PARTS'] || 0}), 5 AI Cores (${colony.storage['AI_CORE'] || 0}).</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? '#FF88FF' : 'var(--danger)'}; color:${canUpgrade ? '#FF88FF' : '#666'};" onclick="upgradeColonyPhase('${safeColId}')" ${!canUpgrade ? 'disabled' : ''}>DECLARE CAPITAL</button>
                </div>
            `;
        }

        const humPop = Math.floor(colony.population * ((colony.demographics["Human"] || 70) / 100));
        const kthPop = Math.floor(colony.population * ((colony.demographics["K'tharr"] || 10) / 100));
        const synPop = Math.floor(colony.population * ((colony.demographics["Synthetic"] || 10) / 100));
        const vdBornPop = Math.max(0, colony.population - humPop - kthPop - synPop);

        let alertsHtml = `<div style="color:var(--item-desc-color); font-size:11px; font-style:italic;">No recent events.</div>`;
        if (colony.alerts && colony.alerts.length > 0) {
            alertsHtml = colony.alerts.map(a => `<div style="margin-bottom:4px;">&gt; ${a}</div>`).join('');
        }

        const bailoutAmount = inDebt ? Math.max(1000, Math.abs(colony.treasury)) : 1000;
        const canSubsidize = typeof playerCredits !== 'undefined' && playerCredits >= bailoutAmount;

        tabContent.innerHTML = `
            <div style="display:flex; gap: 14px; margin-bottom: 16px; flex-wrap:wrap;">
                <div style="flex: 1; min-width:190px; background:rgba(0,0,0,0.5); border:1px solid ${inDebt ? 'var(--danger)' : 'var(--gold-text)'}; padding:14px; border-radius:4px;">
                    <div style="font-size:10px; color:var(--gold-text); letter-spacing:1px; margin-bottom:5px;">TAX VAULT ${inDebt ? '<span style="color:var(--danger)">(IN DEBT)</span>' : ''}</div>
                    <div style="font-size:22px; color:${inDebt ? 'var(--danger)' : 'var(--gold-text)'}; font-weight:bold;">${_colFormat(colony.treasury)}c</div>
                    <button class="action-button small-btn" style="margin-top:8px; border-color:var(--gold-text); color:var(--gold-text); width:100%;" onclick="collectColonyTaxes('${safeColId}')" ${colony.treasury <= 0 ? 'disabled' : ''}>WITHDRAW FUNDS</button>
                    <button class="action-button small-btn" style="margin-top:6px; border-color:${inDebt ? 'var(--danger)' : 'var(--accent-color)'}; color:${inDebt ? 'var(--danger)' : 'var(--accent-color)'}; width:100%;" onclick="subsidizeColonyTreasury('${safeColId}', ${bailoutAmount})" ${!canSubsidize ? 'disabled' : ''}>
                        ${inDebt ? `BAIL OUT DEBT (${_colFormat(bailoutAmount)}c)` : 'INJECT SUBSIDY (1,000c)'}
                    </button>
                </div>
                <div style="flex: 1; min-width:190px; background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:14px; border-radius:4px; display:flex; flex-direction:column;">
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:5px;">ACTIVE POLICY</div>
                    <div style="font-size:16px; font-weight:bold; color:${polMeta.color};">${colony.policy}</div>
                    <div style="font-size:11px; color:var(--item-desc-color); margin-top:6px; line-height:1.4; flex:1;">${_colEscapeHtml(polMeta.desc)}</div>
                    <button class="action-button small-btn" style="margin-top:10px; width:100%;" onclick="cycleColonyPolicy('${safeColId}')">CYCLE DIRECTIVE</button>
                </div>
            </div>

            ${biomeDef && biomeDef.colonyBonusDesc ? `
                <div style="background:rgba(0,224,224,0.06); border-left:3px solid var(--accent-color); padding:8px 12px; margin-bottom:14px; font-size:11px; color:var(--text-color); border-radius:0 4px 4px 0;">
                    <b>Planetary Trait (${_colEscapeHtml(biomeDef.name)}):</b> ${_colEscapeHtml(biomeDef.colonyBonusDesc)}
                </div>
            ` : ''}

            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:14px; border-radius:4px; margin-bottom:14px;">
                <h4 style="color:var(--item-name-color); margin:0 0 8px 0; border-bottom:1px dashed #444; padding-bottom:5px;">GOVERNOR'S LOG</h4>
                <div style="font-size:12px; color:var(--text-color); max-height:110px; overflow-y:auto; line-height:1.5;">
                    ${alertsHtml}
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid #333; padding:14px; border-radius:4px; margin-bottom:14px;">
                <h4 style="color:var(--item-name-color); margin:0 0 8px 0; border-bottom:1px dashed #444; padding-bottom:5px;">CENSUS &amp; DEMOGRAPHICS</h4>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="color:var(--text-color);">Human:</span> <span style="color:var(--success);">${_colFormat(humPop)} (${colony.demographics["Human"]}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="color:var(--text-color);">K'tharr:</span> <span style="color:var(--danger);">${_colFormat(kthPop)} (${colony.demographics["K'tharr"]}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="color:var(--text-color);">Synthetic/Android:</span> <span style="color:var(--accent-color);">${_colFormat(synPop)} (${colony.demographics["Synthetic"]}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <span style="color:var(--text-color);">Void-Born / Other:</span> <span style="color:#FF88FF;">${_colFormat(vdBornPop)} (${colony.demographics["Void-Born"]}%)</span>
                </div>
            </div>

            ${upgradeHtml}
        `;
    } else if (currentColonyTab === 'LOGISTICS') {
        let storageRows = '';
        const allItems = new Set([...Object.keys(playerCargo || {}), ...Object.keys(colony.storage || {})]);

        if ((playerShip && playerShip.forces && playerShip.forces.marines >= 10) || colony.storage['MERCENARY_PLATOON']) allItems.add('MERCENARY_PLATOON');
        if ((playerShip && playerShip.forces && playerShip.forces.heavyMechs >= 1) || colony.storage['ASSAULT_MECH']) allItems.add('ASSAULT_MECH');

        Array.from(allItems).sort().forEach(item => {
            if (item === 'HOT_CARGO' || item === 'COLONY_CHARTER') return;
            let shipQty = (playerCargo && playerCargo[item]) ? playerCargo[item] : 0;
            if (item === 'MERCENARY_PLATOON') shipQty = Math.floor(((playerShip && playerShip.forces && playerShip.forces.marines) || 0) / 10);
            if (item === 'ASSAULT_MECH') shipQty = (playerShip && playerShip.forces && playerShip.forces.heavyMechs) || 0;

            const colQty = colony.storage[item] || 0;
            if (shipQty === 0 && colQty === 0) return;

            const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[item]) ? COMMODITIES[item].name : item;
            const safeItemArg = _colEscapeJsArg(item);

            storageRows += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                    <td style="padding: 8px 0; color:var(--item-name-color);">${_colEscapeHtml(itemName)}</td>
                    <td style="color:var(--accent-color); text-align:right; white-space:nowrap;">${shipQty}</td>
                    <td style="padding: 0 6px; text-align:center; white-space:nowrap;">
                        <button class="icon-btn" style="padding:2px 4px; font-size:9px;" title="Load All to Colony" onclick="transferItem('${safeColId}', '${safeItemArg}', 'TO_COLONY', 'ALL')" ${shipQty > 0 ? '' : 'disabled'}>&raquo;</button>
                        <button class="icon-btn" style="padding:2px 5px; font-size:9px;" title="Load 10 to Colony" onclick="transferItem('${safeColId}', '${safeItemArg}', 'TO_COLONY', 10)" ${shipQty >= 2 ? '' : 'disabled'}>+10</button>
                        <button class="icon-btn" style="padding:2px 5px; font-size:10px;" title="Load 1 to Colony" onclick="transferItem('${safeColId}', '${safeItemArg}', 'TO_COLONY', 1)" ${shipQty > 0 ? '' : 'disabled'}>&gt;</button>
                        <button class="icon-btn" style="padding:2px 5px; font-size:10px;" title="Take 1 to Ship" onclick="transferItem('${safeColId}', '${safeItemArg}', 'TO_SHIP', 1)" ${colQty > 0 ? '' : 'disabled'}>&lt;</button>
                        <button class="icon-btn" style="padding:2px 5px; font-size:9px;" title="Take 10 to Ship" onclick="transferItem('${safeColId}', '${safeItemArg}', 'TO_SHIP', 10)" ${colQty >= 2 ? '' : 'disabled'}>10</button>
                        <button class="icon-btn" style="padding:2px 4px; font-size:9px;" title="Take All to Ship" onclick="transferItem('${safeColId}', '${safeItemArg}', 'TO_SHIP', 'ALL')" ${colQty > 0 ? '' : 'disabled'}>&laquo;</button>
                    </td>
                    <td style="color:var(--gold-text); white-space:nowrap;">${colQty}</td>
                </tr>
            `;
        });

        const storageHtml = storageRows
            ? `<table style="width:100%; text-align:left; font-size:12px; border-collapse: collapse;">
                   <thead>
                       <tr style="border-bottom:1px solid #333; font-size:9px; color:#888; letter-spacing:1px;">
                           <th style="padding-bottom:6px;">ITEM</th>
                           <th style="text-align:right; padding-bottom:6px;">SHIP</th>
                           <th style="text-align:center; padding-bottom:6px;">TRANSFER</th>
                           <th style="padding-bottom:6px;">COLONY</th>
                       </tr>
                   </thead>
                   <tbody>${storageRows}</tbody>
               </table>`
            : `<span style="color:#666">No items to transfer.</span>`;

        const hasExchange = colony.buildings['INTERSTELLAR_EXCHANGE']
            ? `<div style="color:var(--gold-text); font-size:11px; margin-top:10px;">★ Interstellar Exchange Active: Automatically liquidates 10% of excess storage for Credits (preserving Food &amp; Water reserves).</div>`
            : '';
        const capColor = currentStorage >= maxStorage ? 'var(--danger)' : 'var(--text-color)';

        tabContent.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
                <h3 style="color:var(--accent-color); margin:0;">WAREHOUSE &amp; LOGISTICS</h3>
                <div style="font-size:11px; color:${capColor};">Capacity: <span style="font-weight:bold;">${_colFormat(currentStorage)} / ${_colFormat(maxStorage)}</span></div>
            </div>
            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:12px; border-radius:4px; max-height:380px; overflow-y:auto;">
                ${storageHtml}
            </div>
            <div style="font-size:10px; color:#888; margin-top:10px;">
                * Watch your supply chains: Farms consume Water, Factories &amp; Armories consume Alloys, Mech Foundries consume Alloys &amp; Tech.<br>
                * <span style="color:var(--danger)">If storage hits 100%, industrial production halts. Build Silos or Orbital Bulk Depots!</span>
            </div>
            ${hasExchange}
        `;
    } else if (currentColonyTab === 'CONSTRUCTION') {
        let buildHtml = "";

        if (colony.activeConstruction && COLONY_BUILDINGS[colony.activeConstruction.id]) {
            const proj = COLONY_BUILDINGS[colony.activeConstruction.id];
            const pct = Math.min(100, Math.floor((colony.activeConstruction.progress / Math.max(1, colony.activeConstruction.total)) * 100));
            const remaining = Math.max(0, colony.activeConstruction.total - colony.activeConstruction.progress);
            buildHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px solid var(--success); padding:14px; border-radius:4px; margin-bottom:16px;">
                    <div style="font-size:10px; color:var(--success); letter-spacing:1px; margin-bottom:4px;">ACTIVE PROJECT</div>
                    <div style="font-size:16px; font-weight:bold; color:var(--text-color);">${_colEscapeHtml(proj.name)}</div>
                    <div style="width:100%; background:#222; height:10px; border-radius:5px; margin-top:10px; overflow:hidden;">
                        <div style="width:${pct}%; background:var(--success); height:100%; transition:width 0.3s;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <div style="font-size:10px; color:#888;">Est. Completion: ${remaining} Stardate(s) (${pct}%)</div>
                        <button class="action-button small-btn" style="border-color:var(--danger); color:var(--danger); padding:4px 8px; font-size:10px; margin:0;" onclick="cancelConstruction('${safeColId}')">ABORT &amp; REFUND</button>
                    </div>
                </div>
            `;
        } else {
            buildHtml = `<div style="color:var(--item-desc-color); font-size:12px; margin-bottom:14px;">No active projects. Select a blueprint below to begin construction. Resources are drawn from Colony Storage.</div>`;
        }

        const filterPills = ['ALL', 'AFFORD', 'T1', 'T2', 'T3', 'T4'].filter(f => {
            if (f === 'T2' && phaseIndex < 1) return false;
            if (f === 'T3' && phaseIndex < 2) return false;
            if (f === 'T4' && phaseIndex < 3) return false;
            return true;
        }).map(f => {
            const sel = currentBlueprintFilter === f;
            const label = f === 'AFFORD' ? 'CAN BUILD' : f;
            return `<button type="button" onclick="setColonyBlueprintFilter('${safeColId}', '${f}')" style="flex:1; padding:4px 4px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; font-weight:bold; background:${sel ? 'rgba(0,224,224,0.16)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${sel ? 'var(--accent-color)' : '#444'}; color:${sel ? 'var(--accent-color)' : '#888'};">${label}</button>`;
        }).join('');

        buildHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h4 style="color:var(--accent-color); margin:0; letter-spacing:1px; font-size:11px;">AVAILABLE BLUEPRINTS (TIER 1–${phaseIndex + 1})</h4>
            </div>
            <div style="display:flex; gap:5px; margin-bottom:12px;">${filterPills}</div>
        `;

        let renderedBlueprints = 0;
        for (const [bId, bData] of Object.entries(COLONY_BUILDINGS)) {
            if (bData.tier > (phaseIndex + 1)) continue;
            if (currentBlueprintFilter === 'T1' && bData.tier !== 1) continue;
            if (currentBlueprintFilter === 'T2' && bData.tier !== 2) continue;
            if (currentBlueprintFilter === 'T3' && bData.tier !== 3) continue;
            if (currentBlueprintFilter === 'T4' && bData.tier !== 4) continue;

            const installed = colony.buildings[bId] || 0;
            const isMaxed = bData.unique && installed >= 1;

            const costHtml = [];
            let canAfford = true;
            for (const [cId, qty] of Object.entries(bData.cost)) {
                const hasQty = colony.storage[cId] || 0;
                const cColor = hasQty >= qty ? 'var(--success)' : 'var(--danger)';
                if (hasQty < qty) canAfford = false;

                const cName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[cId]) ? COMMODITIES[cId].name : cId;
                costHtml.push(`<span style="color:${cColor}">${qty} ${_colEscapeHtml(cName)}</span>`);
            }

            if (currentBlueprintFilter === 'AFFORD' && (!canAfford || isMaxed)) continue;
            renderedBlueprints++;

            const canDemolish = installed > 0;

            buildHtml += `
                <div style="background:rgba(255,255,255,0.02); border:1px solid ${isMaxed ? '#222' : '#333'}; padding:10px; margin-bottom:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; gap:10px; opacity:${isMaxed ? '0.6' : '1.0'}">
                    <div>
                        <div style="color:var(--text-color); font-weight:bold; font-size:13px;">[T${bData.tier}] ${_colEscapeHtml(bData.name)} <span style="color:var(--accent-color); font-size:11px;">(Built: ${installed})</span></div>
                        <div style="color:var(--item-desc-color); font-size:10px; margin:4px 0;">${_colEscapeHtml(bData.desc)}</div>
                        <div style="font-size:9px;">Cost: ${costHtml.join(', ')} | Time: ${bData.time} SD | Upkeep: <span style="color:var(--danger)">-${bData.upkeep}c</span></div>
                    </div>
                    <div style="display:flex; gap:5px; flex-shrink:0;">
                        <button class="action-button small-btn" style="padding:6px 10px; font-size:10px; margin:0; border-color:var(--danger); color:var(--danger);" 
                            onclick="demolishBuilding('${safeColId}', '${bId}')" 
                            ${!canDemolish ? 'disabled' : ''}>
                            SCRAP
                        </button>
                        <button class="action-button small-btn" style="padding:6px 10px; font-size:10px; margin:0;" 
                            onclick="startConstruction('${safeColId}', '${bId}')" 
                            ${(!canAfford || colony.activeConstruction || isMaxed) ? 'disabled' : ''}>
                            ${isMaxed ? 'MAXED' : 'BUILD'}
                        </button>
                    </div>
                </div>
            `;
        }

        if (renderedBlueprints === 0) {
            buildHtml += `<div style="padding:16px; text-align:center; color:#666; font-size:12px; font-style:italic;">No blueprints match the "${currentBlueprintFilter}" filter.</div>`;
        }

        tabContent.innerHTML = buildHtml;
    }

    actionsEl.innerHTML = `
        <button class="action-button" onclick="closeColonyDashboard()">CLOSE GOVERNOR'S DESK</button>
    `;
}

// --- 4. COLONY MANAGEMENT ACTIONS ---

function subsidizeColonyTreasury(colonyId, amount = 1000) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony) return;
    const transferAmt = Math.max(100, Math.floor(Number(amount) || 1000));
    if (typeof playerCredits === 'undefined' || playerCredits < transferAmt) {
        if (typeof showToast === 'function') showToast(`NEED ${_colFormat(transferAmt)}c`, "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    playerCredits -= transferAmt;
    colony.treasury += transferAmt;
    _pushColonyAlert(colony, `<span style="color:var(--accent-color)">[ SUBSIDY ] Governor injected +${_colFormat(transferAmt)}c into the colonial vault.</span>`);

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(`TRANSFERRED ${_colFormat(transferAmt)}c TO COLONY`, "success");
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openColonyManagement(colonyId);
}

function upgradeColonyPhase(colonyId) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony) return;

    const phaseIndex = COLONY_PHASES.indexOf(colony.phase);

    if (phaseIndex === 0) {
        if (colony.population < 1000 || (colony.storage['REFINED_ALLOY'] || 0) < 100 || (colony.storage['TECH_PARTS'] || 0) < 25) return;
        colony.storage['REFINED_ALLOY'] -= 100;
        colony.storage['TECH_PARTS'] -= 25;
        colony.phase = 'SETTLEMENT';
        _pushColonyAlert(colony, `<span style='color:var(--success)'>[ EXPANSION ] Upgraded to Tier 2 Settlement!</span>`);
        logMessage(`<span style='color:var(--success); font-weight:bold;'>[ MILESTONE REACHED ] ${_colEscapeHtml(colony.name)} has been officially recognized as a Tier 2 Settlement! New blueprints unlocked.</span>`);
    } else if (phaseIndex === 1) {
        if (colony.population < 5000 || (colony.storage['REFINED_ALLOY'] || 0) < 500 || (colony.storage['TECH_PARTS'] || 0) < 150 || (colony.storage['AI_CORE'] || 0) < 2) return;
        colony.storage['REFINED_ALLOY'] -= 500;
        colony.storage['TECH_PARTS'] -= 150;
        colony.storage['AI_CORE'] -= 2;
        colony.phase = 'METROPOLIS';
        _pushColonyAlert(colony, `<span style='color:var(--gold-text)'>[ EXPANSION ] Upgraded to Tier 3 Metropolis!</span>`);
        logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ MILESTONE REACHED ] ${_colEscapeHtml(colony.name)} has blossomed into a sprawling Metropolis! True power is yours.</span>`);
    } else if (phaseIndex === 2) {
        const hasElevator = (colony.buildings['SPACE_ELEVATOR'] || 0) > 0;
        if (!hasElevator || colony.population < 30000 || (colony.storage['REFINED_ALLOY'] || 0) < 2000 || (colony.storage['TECH_PARTS'] || 0) < 500 || (colony.storage['AI_CORE'] || 0) < 5) return;
        colony.storage['REFINED_ALLOY'] -= 2000;
        colony.storage['TECH_PARTS'] -= 500;
        colony.storage['AI_CORE'] -= 5;
        colony.phase = 'CAPITAL';
        _pushColonyAlert(colony, `<span style='color:#FF88FF'>[ CAPITAL ] Declared a Tier 4 Sector Capital!</span>`);
        logMessage(`<span style='color:#FF88FF; font-weight:bold; font-size:14px;'>[ CAPITAL ESTABLISHED ] ${_colEscapeHtml(colony.name)} is now a beacon of the galaxy. Megastructures unlocked!</span>`);
    } else {
        return;
    }

    // Clean up zeroed keys
    for (const k in colony.storage) {
        if (colony.storage[k] <= 0) delete colony.storage[k];
    }

    if (typeof addMilestone === 'function') {
        addMilestone(`Upgraded colony '${colony.name}' to ${colony.phase}.`);
    }
    if (typeof soundManager !== 'undefined') soundManager.playGain();
    if (typeof showToast === 'function') showToast(`COLONY UPGRADED: ${colony.phase}`, "success");
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openColonyManagement(colonyId);
}

function startConstruction(colonyId, buildingId) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony || colony.activeConstruction) return;

    const bData = COLONY_BUILDINGS[buildingId];
    if (!bData) return;

    if (bData.unique && (colony.buildings[buildingId] || 0) >= 1) return;

    for (const [cId, qty] of Object.entries(bData.cost)) {
        if ((colony.storage[cId] || 0) < qty) {
            if (typeof showToast === 'function') showToast("Insufficient local resources!", "error");
            return;
        }
    }

    for (const [cId, qty] of Object.entries(bData.cost)) {
        colony.storage[cId] -= qty;
        if (colony.storage[cId] <= 0) delete colony.storage[cId];
    }

    colony.activeConstruction = {
        id: buildingId,
        progress: 0,
        total: bData.time
    };

    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    logMessage(`<span style='color:var(--success)'>[ ENGINEERING ] Ground broken on new ${_colEscapeHtml(bData.name)} at ${_colEscapeHtml(colony.name)}.</span>`);
    if (typeof autoSaveGame === 'function') autoSaveGame();

    openColonyManagement(colonyId);
}

function cancelConstruction(colonyId) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony || !colony.activeConstruction) return;

    const bData = COLONY_BUILDINGS[colony.activeConstruction.id];
    if (!bData) {
        colony.activeConstruction = null;
        openColonyManagement(colonyId);
        return;
    }

    const { stats } = _computeColonyStats(colony);
    const currentStorage = Object.values(colony.storage).reduce((a, b) => a + (Number(b) || 0), 0);
    const refundVolume = Object.values(bData.cost).reduce((a, b) => a + (Number(b) || 0), 0);

    if (currentStorage + refundVolume > stats.storageCap) {
        if (typeof showToast === 'function') showToast("STORAGE TOO FULL FOR REFUND", "error");
        logMessage("<span style='color:var(--danger)'>Cannot cancel construction: Colony storage lacks capacity for refunded materials.</span>");
        return;
    }

    for (const [cId, qty] of Object.entries(bData.cost)) {
        colony.storage[cId] = (colony.storage[cId] || 0) + qty;
    }

    colony.activeConstruction = null;

    if (typeof soundManager !== 'undefined') soundManager.playWarning();
    if (typeof showToast === 'function') showToast("CONSTRUCTION ABORTED. REFUND ISSUED.", "warning");
    if (typeof autoSaveGame === 'function') autoSaveGame();

    openColonyManagement(colonyId);
}

function demolishBuilding(colonyId, buildingId) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony || !colony.buildings[buildingId] || colony.buildings[buildingId] <= 0) return;

    const bData = COLONY_BUILDINGS[buildingId];
    if (!bData) return;

    const { stats } = _computeColonyStats(colony);

    // Prevent scrapping housing if it would drop capacity below current population
    if (bData.effects && bData.effects.popCap) {
        const newMaxPop = stats.popCap - bData.effects.popCap;
        if (colony.population > newMaxPop) {
            if (typeof showToast === 'function') showToast("CANNOT EVICT COLONISTS", "error");
            logMessage(`<span style='color:var(--danger)'>Cannot demolish ${_colEscapeHtml(bData.name)}: New capacity (${_colFormat(newMaxPop)}) is lower than current population (${_colFormat(Math.floor(colony.population))}).</span>`);
            return;
        }
    }

    // Account for lost storage capacity if scrapping Storage Silos or an Orbital Bulk Depot
    const storageLost = (bData.effects && bData.effects.storageCap) ? bData.effects.storageCap : 0;
    const newMaxStorage = stats.storageCap - storageLost;
    const currentStorage = Object.values(colony.storage).reduce((a, b) => a + (Number(b) || 0), 0);
    const refundVolume = Object.values(bData.cost).reduce((a, b) => a + (Number(b) || 0), 0);

    if (currentStorage + refundVolume > newMaxStorage) {
        if (typeof showToast === 'function') showToast("STORAGE TOO FULL FOR SCRAP", "error");
        logMessage("<span style='color:var(--danger)'>Cannot demolish: Remaining colony storage lacks capacity for stored goods and salvaged materials.</span>");
        return;
    }

    colony.buildings[buildingId] -= 1;
    if (colony.buildings[buildingId] <= 0) delete colony.buildings[buildingId];

    for (const [cId, qty] of Object.entries(bData.cost)) {
        colony.storage[cId] = (colony.storage[cId] || 0) + qty;
    }

    if (typeof soundManager !== 'undefined') soundManager.playWarning();
    if (typeof showToast === 'function') showToast("BUILDING SCRAPPED. MATERIALS REFUNDED.", "success");
    logMessage(`<span style='color:var(--warning)'>[ ENGINEERING ] A ${_colEscapeHtml(bData.name)} was demolished at ${_colEscapeHtml(colony.name)}. Materials returned to local storage.</span>`);
    if (typeof autoSaveGame === 'function') autoSaveGame();

    openColonyManagement(colonyId);
}

function transferItem(colonyId, itemId, direction, amount = 1) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony) return;
    if (itemId === 'HOT_CARGO' || itemId === 'COLONY_CHARTER') return;

    let playerHas = (playerCargo && playerCargo[itemId]) ? playerCargo[itemId] : 0;
    if (itemId === 'MERCENARY_PLATOON') playerHas = Math.floor(((playerShip && playerShip.forces && playerShip.forces.marines) || 0) / 10);
    else if (itemId === 'ASSAULT_MECH') playerHas = (playerShip && playerShip.forces && playerShip.forces.heavyMechs) || 0;

    if (direction === 'TO_COLONY') {
        if (playerHas <= 0) return;

        const { stats } = _computeColonyStats(colony);
        const currentStorage = Object.values(colony.storage).reduce((a, b) => a + (Number(b) || 0), 0);
        const colSpace = Math.max(0, stats.storageCap - currentStorage);
        const requested = amount === 'ALL' ? playerHas : Math.max(1, Number(amount) || 1);
        const toMove = Math.min(requested, playerHas, colSpace);

        if (toMove <= 0) {
            if (typeof showToast === 'function') showToast("COLONY STORAGE FULL", "error");
            return;
        }

        if (itemId === 'MERCENARY_PLATOON') playerShip.forces.marines -= (toMove * 10);
        else if (itemId === 'ASSAULT_MECH') playerShip.forces.heavyMechs -= toMove;
        else {
            playerCargo[itemId] -= toMove;
            if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
        }

        colony.storage[itemId] = (colony.storage[itemId] || 0) + toMove;
        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
    } else if (direction === 'TO_SHIP') {
        const colHas = colony.storage[itemId] || 0;
        if (colHas <= 0) return;

        if (itemId === 'MERCENARY_PLATOON' || itemId === 'ASSAULT_MECH') {
            if (!playerShip.forces) playerShip.forces = { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: 20 };
        }

        const requested = amount === 'ALL' ? colHas : Math.max(1, Number(amount) || 1);
        let maxFit = colHas;

        if (itemId === 'MERCENARY_PLATOON') {
            maxFit = Math.max(0, Math.floor(((playerShip.forces.maxTroops || 20) - (playerShip.forces.marines || 0)) / 10));
        } else if (itemId === 'ASSAULT_MECH') {
            maxFit = Math.max(0, (playerShip.forces.maxTroops || 20) - (playerShip.forces.heavyMechs || 0));
        } else {
            const itemData = typeof COMMODITIES !== 'undefined' ? COMMODITIES[itemId] : null;
            const weight = (itemData && itemData.weight !== undefined) ? itemData.weight : 1;
            if (weight > 0 && typeof currentCargoLoad !== 'undefined' && typeof PLAYER_CARGO_CAPACITY !== 'undefined') {
                maxFit = Math.max(0, Math.floor((PLAYER_CARGO_CAPACITY - currentCargoLoad) / weight));
            }
        }

        const toMove = Math.min(requested, colHas, maxFit);
        if (toMove <= 0) {
            if (typeof showToast === 'function') {
                const msg = itemId === 'MERCENARY_PLATOON' ? "BARRACKS FULL" : (itemId === 'ASSAULT_MECH' ? "VEHICLE BAY FULL" : "CARGO HOLD FULL");
                showToast(msg, "error");
            }
            return;
        }

        if (itemId === 'MERCENARY_PLATOON') playerShip.forces.marines += (toMove * 10);
        else if (itemId === 'ASSAULT_MECH') playerShip.forces.heavyMechs += toMove;
        else playerCargo[itemId] = (playerCargo[itemId] || 0) + toMove;

        colony.storage[itemId] -= toMove;
        if (colony.storage[itemId] <= 0) delete colony.storage[itemId];
        if (typeof soundManager !== 'undefined') soundManager.playGain();
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof updateModalInfoBar === 'function') updateModalInfoBar('genericInfoBar');
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openColonyManagement(colonyId);
}

function collectColonyTaxes(colonyId) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony || colony.treasury <= 0) return;
    const amount = colony.treasury;
    playerCredits += amount;
    colony.treasury = 0;
    logMessage(`<span style='color:var(--success)'>[ COLONY ] Transferred ${_colFormat(amount)}c from ${_colEscapeHtml(colony.name)}'s tax vault.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof updateModalInfoBar === 'function') updateModalInfoBar('genericInfoBar');
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openColonyManagement(colonyId);
}

function cycleColonyPolicy(colonyId) {
    const colony = playerColonies && _hydrateColony(playerColonies[colonyId]);
    if (!colony) return;
    const policies = Object.keys(COLONY_POLICY_META);
    colony.policy = policies[(policies.indexOf(colony.policy) + 1) % policies.length];
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openColonyManagement(colonyId);
}

// --- RANDOM COLONY EVENTS ---
function triggerColonyEvent(colony, stats = null, biomeDef = null) {
    const events = [];

    if (colony.defense < 50 && Math.random() < 0.08) {
        events.push(() => {
            const stolen = Math.floor(Math.random() * 450) + 100;
            colony.treasury -= stolen;
            _pushColonyAlert(colony, `<span style="color:var(--danger)">[ RAID ] Pirates overwhelmed weak defenses and looted ${_colFormat(stolen)}c.</span>`);
        });
    } else if (colony.defense >= 50 && Math.random() < 0.05) {
        events.push(() => {
            const salvage = Math.floor(Math.random() * 250) + 150;
            colony.treasury += salvage;
            _pushColonyAlert(colony, `<span style="color:var(--accent-color)">[ DEFENSE ] Surface batteries drove off a raider wing! Salvaged +${_colFormat(salvage)}c.</span>`);
        });
    }

    if (colony.morale < 30 && Math.random() < 0.10) {
        events.push(() => {
            _pushColonyAlert(colony, `<span style="color:var(--danger)">[ STRIKE ] Unhappy workers halted production for the cycle.</span>`);
            colony.strikeActive = true;
        });
    }

    if (colony.morale >= 80 && Math.random() < 0.08) {
        events.push(() => {
            const boost = Math.floor(Math.random() * 300) + 120;
            colony.treasury += boost;
            _pushColonyAlert(colony, `<span style="color:var(--success)">[ FESTIVAL ] High morale sparked a frontier market festival! +${_colFormat(boost)}c.</span>`);
        });
    }

    if (colony.population >= 200 && Math.random() < 0.05) {
        events.push(() => {
            const tariff = Math.floor(Math.random() * 350) + 150;
            colony.treasury += tariff;
            _pushColonyAlert(colony, `<span style="color:var(--gold-text)">[ TRAFFIC ] Independent freighter paid ${_colFormat(tariff)}c in orbital docking tariffs.</span>`);
        });
    }

    if (biomeDef && ['TOMB_WORLD', 'ARCHIVE_WORLD', 'CRYSTAL'].includes(biomeDef.id) && Math.random() < 0.05) {
        const cap = stats ? stats.storageCap : 1000;
        const used = Object.values(colony.storage).reduce((a, b) => a + (Number(b) || 0), 0);
        if (used + 1 <= cap) {
            events.push(() => {
                const relic = biomeDef.id === 'CRYSTAL' ? 'VOID_CRYSTALS' : 'ARTIFACT_SHARDS';
                colony.storage[relic] = (colony.storage[relic] || 0) + 1;
                const name = (typeof COMMODITIES !== 'undefined' && COMMODITIES[relic]) ? COMMODITIES[relic].name : relic;
                _pushColonyAlert(colony, `<span style="color:#DDA0DD">[ EXCAVATION ] Frontier miners unearthed 1x ${_colEscapeHtml(name)}!</span>`);
            });
        }
    }

    if (events.length > 0) {
        events[Math.floor(Math.random() * events.length)]();
    }
}

// --- 5. THE DATA-DRIVEN SIMULATION MASTER TICK ---
if (typeof GameBus !== 'undefined' && !window._coloniesTickRegistered) {
    window._coloniesTickRegistered = true;

    GameBus.on('TICK_PROCESSED', (tick) => {
        if (!tick || tick.interrupt) return;

        if (typeof playerColonies !== 'undefined' && playerColonies) {
            Object.values(playerColonies).forEach(rawColony => {
                const colony = _hydrateColony(rawColony);
                if (!colony || !colony.established) return;

                if (typeof colony.lastTick === 'undefined' || currentGameDate < colony.lastTick) {
                    colony.lastTick = currentGameDate;
                }

                if (currentGameDate - colony.lastTick >= 1.0) {
                    colony.lastTick = currentGameDate;
                    const policy = colony.policy || 'BALANCED';

                    // 1. AGGREGATE BUILDING, BIOME & POLICY STATS
                    const { stats, biomeDef } = _computeColonyStats(colony);

                    // 2. APPLY UPKEEP & DEBT EFFICIENCY
                    colony.treasury -= stats.upkeep;
                    const inDebt = colony.treasury < 0;
                    let eff = inDebt ? 0.5 : 1.0;

                    if (colony.strikeActive) {
                        eff = 0;
                        colony.strikeActive = false;
                    }

                    colony.defense = stats.defense;

                    // Helper to safely store produced items without writing 0-quantity keys
                    let currentStorage = Object.values(colony.storage).reduce((a, b) => a + (Number(b) || 0), 0);
                    const addColonyStock = (key, amt) => {
                        if (amt <= 0 || currentStorage >= stats.storageCap) return 0;
                        const actual = Math.min(amt, stats.storageCap - currentStorage);
                        if (actual > 0) {
                            colony.storage[key] = (colony.storage[key] || 0) + actual;
                            currentStorage += actual;
                        }
                        return actual;
                    };

                    const isStorageFull = currentStorage >= stats.storageCap;

                    // 3. PRODUCE RESOURCES
                    // A. Raw Materials (No inputs required)
                    if (!isStorageFull && eff > 0) {
                        addColonyStock('WATER', Math.floor(stats.waterProd * eff * stats.omniProd));

                        if (biomeDef && biomeDef.resources && biomeDef.resources.length > 0) {
                            const res = biomeDef.resources[Math.floor(Math.random() * biomeDef.resources.length)];
                            let amount = Math.floor(Math.random() * 2) + 1 + Math.floor(colony.population / 500);
                            amount = Math.floor(amount * stats.miningBoost * stats.resourceMult * eff * stats.omniProd);
                            addColonyStock(res, amount);
                        }

                        addColonyStock('MINERALS', Math.floor(stats.mineralProd * eff * stats.omniProd));
                    }

                    // B. Refined Materials (Requires Inputs)
                    if (!isStorageFull && eff > 0) {
                        let fProd = Math.floor(stats.foodProd * eff * stats.omniProd);
                        const waterNeed = Math.floor((stats.consume.food?.WATER || 0) * eff);
                        if (waterNeed > 0) {
                            if ((colony.storage['WATER'] || 0) >= waterNeed) {
                                colony.storage['WATER'] -= waterNeed;
                                if (colony.storage['WATER'] <= 0) delete colony.storage['WATER'];
                            } else {
                                fProd = Math.floor(fProd / 2);
                                delete colony.storage['WATER'];
                            }
                        }
                        addColonyStock('FOOD_SUPPLIES', fProd);

                        addColonyStock('REFINED_ALLOY', Math.floor(stats.alloyProd * eff * stats.omniProd));

                        let tProd = Math.floor(stats.techProd * eff * stats.omniProd);
                        const alloyNeedTech = Math.floor((stats.consume.tech?.REFINED_ALLOY || 0) * eff);
                        if (alloyNeedTech > 0) {
                            if ((colony.storage['REFINED_ALLOY'] || 0) >= alloyNeedTech) {
                                colony.storage['REFINED_ALLOY'] -= alloyNeedTech;
                                if (colony.storage['REFINED_ALLOY'] <= 0) delete colony.storage['REFINED_ALLOY'];
                            } else {
                                const factoryTech = colony.buildings['AUTOMATED_FACTORY']
                                    ? Math.floor((COLONY_BUILDINGS['AUTOMATED_FACTORY'].effects.techProd * colony.buildings['AUTOMATED_FACTORY']) * eff * stats.omniProd)
                                    : 0;
                                tProd = Math.max(0, tProd - factoryTech);
                            }
                        }
                        addColonyStock('TECH_PARTS', tProd);
                    }

                    // C. Advanced Logistics (Consumes specific multi-inputs)
                    if (!isStorageFull && eff > 0) {
                        const wProd = Math.floor(stats.weaponProd * eff * stats.omniProd);
                        const wAlloy = Math.floor((stats.consume.weapons?.REFINED_ALLOY || 0) * eff);
                        const wMin = Math.floor((stats.consume.weapons?.MINERALS || 0) * eff);
                        if (wProd > 0 && (colony.storage['REFINED_ALLOY'] || 0) >= wAlloy && (colony.storage['MINERALS'] || 0) >= wMin) {
                            if (wAlloy > 0) colony.storage['REFINED_ALLOY'] -= wAlloy;
                            if (wMin > 0) colony.storage['MINERALS'] -= wMin;
                            addColonyStock('WEAPONS', wProd);
                        }

                        const trProd = Math.floor(stats.troopProd * eff * stats.omniProd);
                        const trFood = Math.floor((stats.consume.troops?.FOOD_SUPPLIES || 0) * eff);
                        const trAlloy = Math.floor((stats.consume.troops?.REFINED_ALLOY || 0) * eff);
                        if (trProd > 0 && (colony.storage['REFINED_ALLOY'] || 0) >= trAlloy && (colony.storage['FOOD_SUPPLIES'] || 0) >= trFood) {
                            if (trAlloy > 0) colony.storage['REFINED_ALLOY'] -= trAlloy;
                            if (trFood > 0) colony.storage['FOOD_SUPPLIES'] -= trFood;
                            addColonyStock('MERCENARY_PLATOON', trProd);
                        }

                        const meProd = Math.floor(stats.mechProd * eff * stats.omniProd);
                        const meAlloy = Math.floor((stats.consume.mechs?.REFINED_ALLOY || 0) * eff);
                        const meTech = Math.floor((stats.consume.mechs?.TECH_PARTS || 0) * eff);
                        if (meProd > 0 && (colony.storage['REFINED_ALLOY'] || 0) >= meAlloy && (colony.storage['TECH_PARTS'] || 0) >= meTech) {
                            if (meAlloy > 0) colony.storage['REFINED_ALLOY'] -= meAlloy;
                            if (meTech > 0) colony.storage['TECH_PARTS'] -= meTech;
                            addColonyStock('ASSAULT_MECH', meProd);
                        }

                        const stProd = Math.floor(stats.stimProd * eff * stats.omniProd);
                        const stMed = Math.floor((stats.consume.stims?.MEDICAL_SUPPLIES || 0) * eff);
                        const stMin = Math.floor((stats.consume.stims?.MINERALS || 0) * eff);
                        if (stProd > 0 && (colony.storage['MEDICAL_SUPPLIES'] || 0) >= stMed && (colony.storage['MINERALS'] || 0) >= stMin) {
                            if (stMed > 0) colony.storage['MEDICAL_SUPPLIES'] -= stMed;
                            if (stMin > 0) colony.storage['MINERALS'] -= stMin;
                            addColonyStock('PROHIBITED_STIMS', stProd);
                        }

                        addColonyStock('VOID_CRYSTALS', Math.floor(stats.voidProd * eff * stats.omniProd));
                        addColonyStock('MEDICAL_SUPPLIES', Math.floor(stats.medProd * eff * stats.omniProd));

                        const luxProd = Math.floor(stats.luxuryProd * eff * stats.omniProd);
                        const luxWat = Math.floor((stats.consume.luxury?.WATER || 0) * eff);
                        const luxMin = Math.floor((stats.consume.luxury?.MINERALS || 0) * eff);
                        if (luxProd > 0 && (colony.storage['WATER'] || 0) >= luxWat && (colony.storage['MINERALS'] || 0) >= luxMin) {
                            if (luxWat > 0) colony.storage['WATER'] -= luxWat;
                            if (luxMin > 0) colony.storage['MINERALS'] -= luxMin;
                            addColonyStock('LUXURY_GOODS', luxProd);
                        }
                    }

                    // 4. DEMOGRAPHICS & FOOD CONSUMPTION
                    const foodConsumption = Math.ceil((colony.population / 100) * stats.foodEfficiency);

                    if ((colony.storage['FOOD_SUPPLIES'] || 0) >= foodConsumption) {
                        colony.storage['FOOD_SUPPLIES'] = (colony.storage['FOOD_SUPPLIES'] || 0) - foodConsumption;
                        if (colony.storage['FOOD_SUPPLIES'] <= 0) delete colony.storage['FOOD_SUPPLIES'];

                        if (colony.morale >= 50 && colony.population < stats.popCap) {
                            let growthTick = 1 * stats.popGrowthMult;
                            if ((colony.storage['FOOD_SUPPLIES'] || 0) > foodConsumption * 10) growthTick += 1;
                            if (colony.morale > 90) growthTick += 2;

                            colony.growthProgress += growthTick;

                            if (colony.growthProgress >= 100) {
                                colony.growthProgress = 0;
                                const phaseIndex = COLONY_PHASES.indexOf(colony.phase);
                                const newCitizens = Math.floor((Math.random() * 50 * (phaseIndex + 1)) + 10);
                                colony.population = Math.min(stats.popCap, colony.population + newCitizens);
                            }
                        }
                    } else {
                        delete colony.storage['FOOD_SUPPLIES'];
                        stats.moralePenalty += 15;
                        colony.growthProgress = 0;
                        colony.population = Math.max(0, colony.population - Math.ceil(colony.population * 0.10));
                    }

                    // 5. MORALE UPDATE
                    if (policy === 'AUTHORITARIAN') {
                        colony.morale = 40;
                    } else {
                        if (inDebt) stats.moralePenalty += 2;
                        colony.morale = Math.max(0, Math.min(100, colony.morale + stats.moraleBonus + stats.moraleRegen - stats.moralePenalty));
                    }

                    // 6. ECONOMY & TAXES
                    const moraleMult = policy === 'AUTHORITARIAN' ? 1.0 : (colony.morale / 100);
                    const taxIncome = Math.floor(colony.population * 0.5 * stats.taxMult * moraleMult);
                    colony.treasury += taxIncome + Math.floor(stats.passiveCredits * eff);

                    let crimeLaundering = Math.floor(stats.illegalTaxes * eff);
                    if (stats.crimeReduction > 0) crimeLaundering = Math.floor(crimeLaundering * 0.5);
                    colony.treasury += crimeLaundering;

                    // Global Research Lab Bonus
                    if (stats.passiveXP > 0) {
                        const xpYield = Math.floor(stats.passiveXP * eff);
                        if (xpYield > 0 && typeof playerXP !== 'undefined') {
                            playerXP += xpYield;
                            if (typeof checkLevelUp === 'function') checkLevelUp();
                        }
                    }

                    // INTERSTELLAR EXCHANGE (Auto-Liquidation with safe Food & Water reserves)
                    if (stats.autoTrade) {
                        let autoCredits = 0;
                        const waterReserve = Math.max(50, ((stats.consume.food?.WATER || 0) + (stats.consume.luxury?.WATER || 0)) * 5);
                        const foodReserve = Math.max(50, foodConsumption * 5);

                        for (const itemKey in colony.storage) {
                            const floor = itemKey === 'FOOD_SUPPLIES' ? foodReserve : (itemKey === 'WATER' ? waterReserve : 50);
                            if (colony.storage[itemKey] > floor) {
                                const excess = colony.storage[itemKey] - floor;
                                const amountToSell = Math.ceil(excess * 0.10);
                                const basePrice = (typeof COMMODITIES !== 'undefined' && COMMODITIES[itemKey]) ? COMMODITIES[itemKey].basePrice : 10;
                                colony.storage[itemKey] -= amountToSell;
                                autoCredits += (amountToSell * basePrice);
                            }
                        }
                        if (autoCredits > 0) colony.treasury += autoCredits;
                    }

                    // Clean up any 0-quantity storage keys
                    for (const k in colony.storage) {
                        if (colony.storage[k] <= 0) delete colony.storage[k];
                    }

                    // 7. CONSTRUCTION PROGRESS
                    if (colony.activeConstruction) {
                        colony.activeConstruction.progress += 1;
                        if (colony.activeConstruction.progress >= colony.activeConstruction.total) {
                            const bId = colony.activeConstruction.id;
                            colony.buildings[bId] = (colony.buildings[bId] || 0) + 1;
                            colony.activeConstruction = null;
                            if (typeof soundManager !== 'undefined') soundManager.playGain();
                            const bName = COLONY_BUILDINGS[bId] ? COLONY_BUILDINGS[bId].name : bId;
                            _pushColonyAlert(colony, `<span style='color:var(--success)'>[ ENGINEER ] Construction complete: ${_colEscapeHtml(bName)}</span>`);
                        }
                    }

                    // 8. RANDOM COLONY EVENTS
                    triggerColonyEvent(colony, stats, biomeDef);
                }
            });
        }
    });
}

// ==========================================
// --- PUBLIC COLONY UTILITY API ---
// ==========================================

window.ColonyUtils = {
    getColonyStats: _computeColonyStats,
    getPolicyMeta(policyKey) {
        return COLONY_POLICY_META[policyKey] || COLONY_POLICY_META.BALANCED;
    },
    getAllColonies() {
        if (typeof playerColonies === 'undefined' || !playerColonies) return [];
        return Object.values(playerColonies).filter(c => c && c.established);
    },
    getColonyAt(x, y) {
        return this.getAllColonies().filter(c => c.x === x && c.y === y);
    }
};

// --- END OF FILE colonies.js ---
