// --- START OF FILE colonies.js ---

// ==========================================
// --- WAYFINDER COLONY SIMULATION ENGINE ---
// ==========================================

const COLONY_PHASES = ['OUTPOST', 'SETTLEMENT', 'METROPOLIS', 'CAPITAL'];

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
    "DEEP_CORE_RIG": { 
        name: "Deep Core Rig", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 80, "TECH_PARTS": 25 }, 
        upkeep: 150, time: 30, effects: { mineralProd: 15 }, 
        desc: "Heavy industrial mining. Generates 15 Minerals per stardate." 
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
        desc: "Trains 1 MERCENARY_PLATOON per Stardate. Consumes 5 Food and 5 Alloys."
    },
    "SYNTHETIC_WEAVERS": {
        name: "Synthetic Weavers", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 80, "TECH_PARTS": 40 },
        upkeep: 200, time: 30, effects: { luxuryProd: 2, consume: { "WATER": 3, "MINERALS": 5 } },
        desc: "Generates 2 Luxury Goods per stardate. Consumes 3 Water and 5 Minerals."
    },
    "STIM_LAB": {
        name: "Underground Stim Lab", tier: 2, unique: false,
        cost: { "REFINED_ALLOY": 40, "TECH_PARTS": 15 },
        upkeep: 100, time: 20, effects: { stimProd: 2, moralePenalty: 1, consume: { "MEDICAL_SUPPLIES": 1, "MINERALS": 2 } },
        desc: "Illegally synthesizes 2 PROHIBITED_STIMS. Consumes Meds and Minerals. -1 Morale."
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
        desc: "A self-contained utopia. +5000 Max Population and +2 Morale."
    },
    "XENOBOTANY_DOME": {
        name: "Xenobotany Dome", tier: 3, unique: false,
        cost: { "REFINED_ALLOY": 150, "WATER": 100, "TECH_PARTS": 50 },
        upkeep: 500, time: 40, effects: { foodProd: 10, medProd: 5 },
        desc: "Cultivates rare flora. Generates 10 Food and 5 Medical Supplies per Stardate."
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
        desc: "Automatically sells 10% of all excess colony resources to the galactic market for pure credits every Stardate."
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
Object.freeze(COLONY_BUILDINGS); // Optimizes memory usage in the V8 engine

let currentColonyTab = 'OVERVIEW';

// --- 2. FOUNDING A COLONY ---
function establishColony(locationIndex) {
    if ((playerCargo["COLONY_CHARTER"] || 0) < 1) {
        logMessage("<span style='color:var(--danger)'>You need a Concord Colony Charter to legally claim a world.</span>");
        return;
    }

    const planet = currentSystemData.planets[locationIndex];
    playerCargo["COLONY_CHARTER"]--;
    if (playerCargo["COLONY_CHARTER"] <= 0) delete playerCargo["COLONY_CHARTER"];
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    const colId = `${playerX}_${playerY}_p${locationIndex}`;
    
    let humBase = 60 + Math.floor(Math.random() * 20); 
    let kthBase = 5 + Math.floor(Math.random() * 15);  
    let synBase = 5 + Math.floor(Math.random() * 10);  
    let voidBase = 100 - (humBase + kthBase + synBase); 

    playerColonies[colId] = {
        id: colId,
        name: `${planet.biome.name} Prime`,
        x: playerX,
        y: playerY,
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
        biome: planet.biome.id,
        lastTick: currentGameDate,
        alerts: [] // Stores local colony events and raid notifications
    };

    updateWorldState(playerX, playerY, { hasColony: true, colonyId: colId }, colId);

    logMessage(`<span style='color:var(--success); font-weight:bold;'>[ COLONY ESTABLISHED ] Transports have landed. The frontier awaits.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("COLONY FOUNDED", "success");
    
    closeGenericModal();
    openColonyManagement(colId);
}

// --- 3. COLONY DASHBOARD UI ---
function setColonyTab(colonyId, tab) {
    currentColonyTab = tab;
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    openColonyManagement(colonyId);
}

function openColonyManagement(colonyId) {
    if (!colonyId) {
        const localColonies = Object.values(playerColonies).filter(c => c.x === playerX && c.y === playerY);
        if (localColonies.length === 0) return;
        colonyId = localColonies[0].id; 
    }

    const colony = playerColonies[colonyId];
    if (!colony) return;

    openGenericModal(`GOVERNOR'S DESK: ${colony.name.toUpperCase()}`);
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Aggregate Stats for UI reading
    let projectedUpkeep = 0;
    let maxPop = 0;
    let maxStorage = 1000;

    for (const [bId, count] of Object.entries(colony.buildings)) {
        const bData = COLONY_BUILDINGS[bId];
        if (bData) {
            projectedUpkeep += (bData.upkeep || 0) * count;
            if (bData.effects.popCap) maxPop += bData.effects.popCap * count;
            if (bData.effects.storageCap) maxStorage += bData.effects.storageCap * count;
        }
    }
    
    let currentStorage = Object.values(colony.storage).reduce((a,b) => a + b, 0);
    const isStarving = (colony.storage['FOOD_SUPPLIES'] || 0) <= 0;
    const phaseIndex = COLONY_PHASES.indexOf(colony.phase);
    const inDebt = colony.treasury < 0;
    const efficiency = inDebt ? 50 : 100; // Display efficiency drop in debt

    // Policy Color Formatting
    let policyColor = "var(--text-color)";
    if (colony.policy === 'WEALTH') policyColor = "var(--gold-text)";
    if (colony.policy === 'INDUSTRY') policyColor = "var(--warning)";
    if (colony.policy === 'MILITIA') policyColor = "var(--danger)";
    if (colony.policy === 'RESEARCH') policyColor = "var(--accent-color)";
    if (colony.policy === 'UTOPIAN') policyColor = "#FF88FF";
    if (colony.policy === 'EXPANSIONIST') policyColor = "#44FF44";
    if (colony.policy === 'SURVIVALIST') policyColor = "#AAAAAA";
    if (colony.policy === 'AUTHORITARIAN') policyColor = "#888888";

    // --- LEFT PANE (Vitals) ---
    listEl.innerHTML = `
        <div style="padding:15px;">
            <div style="text-align:center; margin-bottom: 20px;">
                <div style="font-size:50px; filter: drop-shadow(0 0 15px ${isStarving ? 'var(--danger)' : 'var(--success)'}); margin-bottom:10px;">
                    ${isStarving ? '🏚️' : (phaseIndex === 3 ? '👑' : (phaseIndex === 2 ? '🏙️' : (phaseIndex === 1 ? '🏭' : '⛺')))}
                </div>
                <div style="color:${isStarving ? 'var(--danger)' : 'var(--success)'}; font-weight:bold; letter-spacing:2px; font-size:12px;">STATUS: ${isStarving ? 'FAMINE' : colony.phase}</div>
                <div style="color:${inDebt ? 'var(--danger)' : 'var(--item-desc-color)'}; font-size:10px; margin-top:4px;">Operational Efficiency: ${efficiency}%</div>
            </div>

            <div class="trade-math-area" style="background: rgba(0,0,0,0.3); border: 1px solid #333; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
                <div class="trade-stat-row"><span>Population:</span> <span style="color:var(--text-color); font-weight:bold;">${formatNumber(colony.population)} / ${formatNumber(maxPop)}</span></div>
                <div class="trade-stat-row"><span>Growth Rate:</span> <span style="color:${colony.morale > 50 ? 'var(--success)' : 'var(--warning)'}; font-size:10px;">${Math.floor(colony.growthProgress)}% to next influx</span></div>
                <div class="trade-stat-row" style="margin-top:10px;"><span>Morale:</span> <span style="color:${colony.morale >= 50 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${colony.morale}%</span></div>
                <div class="trade-stat-row"><span>Defense Rating:</span> <span style="color:var(--accent-color); font-weight:bold;">${colony.defense || 0}</span></div>
                <div class="trade-stat-row" style="margin-top:10px; border-top:1px dashed #444; padding-top:5px;"><span>Daily Upkeep:</span> <span style="color:var(--danger); font-weight:bold;">-${formatNumber(projectedUpkeep)}c</span></div>
            </div>
            
            <button class="action-button full-width-btn" style="margin-bottom:5px; border-color:${currentColonyTab === 'OVERVIEW' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${colonyId}', 'OVERVIEW')">OVERVIEW & LOGS</button>
            <button class="action-button full-width-btn" style="margin-bottom:5px; border-color:${currentColonyTab === 'LOGISTICS' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${colonyId}', 'LOGISTICS')">LOGISTICS</button>
            <button class="action-button full-width-btn" style="border-color:${currentColonyTab === 'CONSTRUCTION' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${colonyId}', 'CONSTRUCTION')">ENGINEERING</button>
        </div>
    `;

    // --- RIGHT PANE (Dynamic Content) ---
    detailEl.innerHTML = `<div style="padding: 20px;" id="colonyTabContent"></div>`;
    const tabContent = document.getElementById('colonyTabContent');

    if (currentColonyTab === 'OVERVIEW') {
        let upgradeHtml = "";
        
        if (phaseIndex === 0) { 
            const canUpgrade = colony.population >= 1000 && (colony.storage['REFINED_ALLOY'] || 0) >= 100 && (colony.storage['TECH_PARTS'] || 0) >= 25;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed var(--accent-color); padding:15px; border-radius:4px; margin-top:20px;">
                    <h4 style="color:var(--accent-color); margin:0 0 10px 0;">UPGRADE TO SETTLEMENT (TIER 2)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 1,000 Population, 100 Refined Alloys, 25 Tech Parts.</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? 'var(--success)' : 'var(--danger)'}; color:${canUpgrade ? 'var(--success)' : '#666'};" onclick="upgradeColonyPhase('${colonyId}')" ${!canUpgrade ? 'disabled' : ''}>AUTHORIZE EXPANSION</button>
                </div>
            `;
        } else if (phaseIndex === 1) { 
            const canUpgrade = colony.population >= 5000 && (colony.storage['REFINED_ALLOY'] || 0) >= 500 && (colony.storage['TECH_PARTS'] || 0) >= 150 && (colony.storage['AI_CORE'] || 0) >= 2;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed var(--gold-text); padding:15px; border-radius:4px; margin-top:20px;">
                    <h4 style="color:var(--gold-text); margin:0 0 10px 0;">FOUND A METROPOLIS (TIER 3)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 5,000 Population, 500 Refined Alloys, 150 Tech Parts, 2 AI Cores.</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? 'var(--gold-text)' : 'var(--danger)'}; color:${canUpgrade ? 'var(--gold-text)' : '#666'};" onclick="upgradeColonyPhase('${colonyId}')" ${!canUpgrade ? 'disabled' : ''}>AUTHORIZE EXPANSION</button>
                </div>
            `;
        } else if (phaseIndex === 2) { 
            const hasElevator = (colony.buildings['SPACE_ELEVATOR'] || 0) > 0;
            const canUpgrade = hasElevator && colony.population >= 30000 && (colony.storage['REFINED_ALLOY'] || 0) >= 2000 && (colony.storage['TECH_PARTS'] || 0) >= 500 && (colony.storage['AI_CORE'] || 0) >= 5;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed #FF88FF; padding:15px; border-radius:4px; margin-top:20px;">
                    <h4 style="color:#FF88FF; margin:0 0 10px 0;">DECLARE SECTOR CAPITAL (TIER 4)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 30,000 Pop, Space Elevator Built, 2000 Alloys, 500 Tech Parts, 5 AI Cores.</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? '#FF88FF' : 'var(--danger)'}; color:${canUpgrade ? '#FF88FF' : '#666'};" onclick="upgradeColonyPhase('${colonyId}')" ${!canUpgrade ? 'disabled' : ''}>DECLARE CAPITAL</button>
                </div>
            `;
        }

        const humPop = Math.floor(colony.population * ((colony.demographics["Human"] || 70) / 100));
        const kthPop = Math.floor(colony.population * ((colony.demographics["K'tharr"] || 10) / 100));
        const synPop = Math.floor(colony.population * ((colony.demographics["Synthetic"] || 10) / 100));
        const vdBornPop = colony.population - humPop - kthPop - synPop; 

        // RENDER EVENT LOG
        let alertsHtml = `<div style="color:var(--item-desc-color); font-size:11px; font-style:italic;">No recent events.</div>`;
        if (colony.alerts && colony.alerts.length > 0) {
            alertsHtml = colony.alerts.map(a => `<div style="margin-bottom:4px;">> ${a}</div>`).join('');
        }

        tabContent.innerHTML = `
            <div style="display:flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; background:rgba(0,0,0,0.5); border:1px solid ${colony.treasury < 0 ? 'var(--danger)' : 'var(--gold-text)'}; padding:15px; border-radius:4px;">
                    <div style="font-size:10px; color:var(--gold-text); letter-spacing:1px; margin-bottom:5px;">TAX VAULT ${colony.treasury < 0 ? '<span style="color:var(--danger)">(IN DEBT)</span>' : ''}</div>
                    <div style="font-size:24px; color:${colony.treasury < 0 ? 'var(--danger)' : 'var(--gold-text)'}; font-weight:bold;">${formatNumber(colony.treasury)}c</div>
                    <button class="action-button small-btn" style="margin-top:10px; border-color:var(--gold-text); color:var(--gold-text); width:100%;" onclick="collectColonyTaxes('${colonyId}')" ${colony.treasury <= 0 ? 'disabled' : ''}>WITHDRAW FUNDS</button>
                </div>
                <div style="flex: 1; background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px;">
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:5px;">ACTIVE POLICY</div>
                    <div style="font-size:16px; font-weight:bold; color:${policyColor};">${colony.policy}</div>
                    <button class="action-button small-btn" style="margin-top:16px; width:100%;" onclick="cycleColonyPolicy('${colonyId}')">CYCLE DIRECTIVE</button>
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px; margin-bottom:20px;">
                <h4 style="color:var(--item-name-color); margin:0 0 10px 0; border-bottom:1px dashed #444; padding-bottom:5px;">GOVERNOR'S LOG</h4>
                <div style="font-size:12px; color:var(--text-color); max-height:100px; overflow-y:auto; line-height:1.5;">
                    ${alertsHtml}
                </div>
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid #333; padding:15px; border-radius:4px; margin-bottom:20px;">
                <h4 style="color:var(--item-name-color); margin:0 0 10px 0; border-bottom:1px dashed #444; padding-bottom:5px;">CENSUS & DEMOGRAPHICS</h4>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="color:var(--text-color);">Human:</span> <span style="color:var(--success);">${formatNumber(humPop)} (${colony.demographics["Human"]}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="color:var(--text-color);">K'tharr:</span> <span style="color:var(--danger);">${formatNumber(kthPop)} (${colony.demographics["K'tharr"]}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                    <span style="color:var(--text-color);">Synthetic/Android:</span> <span style="color:var(--accent-color);">${formatNumber(synPop)} (${colony.demographics["Synthetic"]}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <span style="color:var(--text-color);">Void-Born / Other:</span> <span style="color:#FF88FF;">${formatNumber(vdBornPop)} (${colony.demographics["Void-Born"]}%)</span>
                </div>
            </div>

            ${upgradeHtml}
        `;
    } 
    else if (currentColonyTab === 'LOGISTICS') {
        let storageHtml = `<table style="width:100%; text-align:left; font-size:12px; border-collapse: collapse;">`;
        const allItems = new Set([...Object.keys(playerCargo), ...Object.keys(colony.storage)]);
        
        if (playerShip.forces.marines >= 10 || colony.storage['MERCENARY_PLATOON']) allItems.add('MERCENARY_PLATOON');
        if (playerShip.forces.heavyMechs >= 1 || colony.storage['ASSAULT_MECH']) allItems.add('ASSAULT_MECH');

        allItems.forEach(item => {
            let shipQty = playerCargo[item] || 0;
            if (item === 'MERCENARY_PLATOON') shipQty = Math.floor((playerShip.forces.marines || 0) / 10);
            if (item === 'ASSAULT_MECH') shipQty = playerShip.forces.heavyMechs || 0;
            const colQty = colony.storage[item] || 0;
            if (shipQty === 0 && colQty === 0) return; 
            
            const itemName = typeof COMMODITIES !== 'undefined' && COMMODITIES[item] ? COMMODITIES[item].name : item;
            storageHtml += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 0; color:var(--item-name-color);">${itemName}</td>
                    <td style="color:var(--accent-color); text-align:right;">Ship: ${shipQty}</td>
                    <td style="padding: 0 10px; text-align:center;">
                        <button class="icon-btn" style="padding:2px 6px; font-size:10px;" onclick="transferItem('${colonyId}', '${item}', 'TO_COLONY')" ${shipQty > 0 ? '' : 'disabled'}>&gt;</button>
                        <button class="icon-btn" style="padding:2px 6px; font-size:10px;" onclick="transferItem('${colonyId}', '${item}', 'TO_SHIP')" ${colQty > 0 ? '' : 'disabled'}>&lt;</button>
                    </td>
                    <td style="color:var(--gold-text);">Colony: ${colQty}</td>
                </tr>
            `;
        });
        storageHtml += `</table>`;

        const hasExchange = colony.buildings['INTERSTELLAR_EXCHANGE'] ? `<div style="color:var(--gold-text); font-size:11px; margin-top:10px;">★ Interstellar Exchange Active: Automatically liquidates 10% of excess storage for Credits.</div>` : '';
        const capColor = currentStorage >= maxStorage ? 'var(--danger)' : 'var(--text-color)';

        tabContent.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:15px;">
                <h3 style="color:var(--accent-color); margin:0;">WAREHOUSE & LOGISTICS</h3>
                <div style="font-size:11px; color:${capColor};">Capacity: <span style="font-weight:bold;">${formatNumber(currentStorage)} / ${formatNumber(maxStorage)}</span></div>
            </div>
            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px; max-height:400px; overflow-y:auto;">
                ${storageHtml === '<table style="width:100%; text-align:left; font-size:12px; border-collapse: collapse;"></table>' ? '<span style="color:#666">No items to transfer.</span>' : storageHtml}
            </div>
            <div style="font-size:10px; color:#888; margin-top:10px;">
                * Note: Watch your supply chains! Armories consume Alloys. Weavers consume Minerals and Water. Pits consume Food!<br>
                * <span style="color:var(--danger)">If storage is full, all industrial production will halt. Build Silos!</span>
            </div>
            ${hasExchange}
        `;
    }
    else if (currentColonyTab === 'CONSTRUCTION') {
        let buildHtml = "";
        
        if (colony.activeConstruction) {
            const proj = COLONY_BUILDINGS[colony.activeConstruction.id];
            const pct = Math.floor((colony.activeConstruction.progress / colony.activeConstruction.total) * 100);
            buildHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px solid var(--success); padding:15px; border-radius:4px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:10px; color:var(--success); letter-spacing:1px; margin-bottom:5px;">ACTIVE PROJECT</div>
                    </div>
                    <div style="font-size:16px; font-weight:bold; color:var(--text-color);">${proj.name}</div>
                    <div style="width:100%; background:#222; height:10px; border-radius:5px; margin-top:10px; overflow:hidden;">
                        <div style="width:${pct}%; background:var(--success); height:100%;"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <div style="font-size:10px; color:#888;">Est. Completion: ${colony.activeConstruction.total - colony.activeConstruction.progress} Stardates</div>
                        <button class="action-button small-btn" style="border-color:var(--danger); color:var(--danger); padding:4px 8px; font-size:10px;" onclick="cancelConstruction('${colonyId}')">ABORT & REFUND</button>
                    </div>
                </div>
            `;
        } else {
            buildHtml = `<div style="color:var(--item-desc-color); font-size:12px; margin-bottom:20px;">No active projects. Select a blueprint below to begin construction. Resources will be drawn directly from Colony Storage.</div>`;
        }

        buildHtml += `<h4 style="color:var(--accent-color); margin:0 0 10px 0; letter-spacing:1px; font-size:11px;">AVAILABLE BLUEPRINTS</h4>`;
        
        for (const [bId, bData] of Object.entries(COLONY_BUILDINGS)) {
            if (bData.tier > (phaseIndex + 1)) continue; 

            const installed = colony.buildings[bId] || 0;
            const isMaxed = bData.unique && installed >= 1;
            
            let costHtml = [];
            let canAfford = true;
            for (const [cId, qty] of Object.entries(bData.cost)) {
                const hasQty = colony.storage[cId] || 0;
                const cColor = hasQty >= qty ? 'var(--success)' : 'var(--danger)';
                if (hasQty < qty) canAfford = false;
                
                const cName = typeof COMMODITIES !== 'undefined' && COMMODITIES[cId] ? COMMODITIES[cId].name : cId;
                costHtml.push(`<span style="color:${cColor}">${qty} ${cName}</span>`);
            }

            const canDemolish = installed > 0;

            buildHtml += `
                <div style="background:rgba(255,255,255,0.02); border:1px solid ${isMaxed ? '#222' : '#333'}; padding:10px; margin-bottom:10px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; opacity:${isMaxed ? '0.6' : '1.0'}">
                    <div>
                        <div style="color:var(--text-color); font-weight:bold; font-size:13px;">${bData.name} <span style="color:var(--accent-color); font-size:11px;">(Built: ${installed})</span></div>
                        <div style="color:var(--item-desc-color); font-size:10px; margin:4px 0;">${bData.desc}</div>
                        <div style="font-size:9px;">Cost: ${costHtml.join(', ')} | Upkeep: <span style="color:var(--danger)">-${bData.upkeep}c/tick</span></div>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="action-button small-btn" style="padding:6px 12px; font-size:10px; border-color:var(--danger); color:var(--danger);" 
                            onclick="demolishBuilding('${colonyId}', '${bId}')" 
                            ${!canDemolish ? 'disabled' : ''}>
                            SCRAP
                        </button>
                        <button class="action-button small-btn" style="padding:6px 12px; font-size:10px;" 
                            onclick="startConstruction('${colonyId}', '${bId}')" 
                            ${(!canAfford || colony.activeConstruction || isMaxed) ? 'disabled' : ''}>
                            ${isMaxed ? 'MAXED' : 'BUILD'}
                        </button>
                    </div>
                </div>
            `;
        }
        tabContent.innerHTML = buildHtml;
    }

    actionsEl.innerHTML = `
        <button class="action-button" onclick="closeGenericModal(); handleInteraction();">RETURN TO ORBIT</button>
    `;
}

// --- 4. NEW COLONY ACTIONS ---

function upgradeColonyPhase(colonyId) {
    const colony = playerColonies[colonyId];
    if (!colony) return;

    const phaseIndex = COLONY_PHASES.indexOf(colony.phase);
    
    if (phaseIndex === 0) {
        colony.storage['REFINED_ALLOY'] -= 100;
        colony.storage['TECH_PARTS'] -= 25;
        colony.phase = 'SETTLEMENT';
        logMessage(`<span style='color:var(--success); font-weight:bold;'>[ MILESTONE REACHED ] ${colony.name} has been officially recognized as a Tier 2 Settlement! New blueprints unlocked.</span>`);
    } else if (phaseIndex === 1) { 
        colony.storage['REFINED_ALLOY'] -= 500;
        colony.storage['TECH_PARTS'] -= 150;
        colony.storage['AI_CORE'] -= 2;
        colony.phase = 'METROPOLIS';
        logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ MILESTONE REACHED ] ${colony.name} has blossomed into a sprawling Metropolis! True power is yours.</span>`);
    } else if (phaseIndex === 2) { 
        colony.storage['REFINED_ALLOY'] -= 2000;
        colony.storage['TECH_PARTS'] -= 500;
        colony.storage['AI_CORE'] -= 5;
        colony.phase = 'CAPITAL';
        logMessage(`<span style='color:#FF88FF; font-weight:bold; font-size:14px;'>[ CAPITAL ESTABLISHED ] ${colony.name} is now a beacon of the galaxy. Megastructures unlocked!</span>`);
    }

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    openColonyManagement(colonyId); 
}

function startConstruction(colonyId, buildingId) {
    const colony = playerColonies[colonyId];
    if (!colony || colony.activeConstruction) return;

    const bData = COLONY_BUILDINGS[buildingId];
    
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
    logMessage(`<span style='color:var(--success)'>[ ENGINEERING ] Ground broken on new ${bData.name} at ${colony.name}.</span>`);
    
    openColonyManagement(colonyId); 
}

function cancelConstruction(colonyId) {
    const colony = playerColonies[colonyId];
    if (!colony || !colony.activeConstruction) return;
    
    const bData = COLONY_BUILDINGS[colony.activeConstruction.id];
    
    let maxStorage = 1000 + ((colony.buildings['STORAGE_SILOS'] || 0) * 2500);
    let currentStorage = Object.values(colony.storage).reduce((a,b) => a + b, 0);
    let refundVolume = Object.values(bData.cost).reduce((a,b) => a + b, 0);
    
    if (currentStorage + refundVolume > maxStorage) {
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
    
    openColonyManagement(colonyId);
}

function demolishBuilding(colonyId, buildingId) {
    const colony = playerColonies[colonyId];
    if (!colony || !colony.buildings[buildingId] || colony.buildings[buildingId] <= 0) return;

    const bData = COLONY_BUILDINGS[buildingId];
    
    let maxStorage = 1000 + ((colony.buildings['STORAGE_SILOS'] || 0) * 2500);
    let currentStorage = Object.values(colony.storage).reduce((a,b) => a + b, 0);
    let refundVolume = Object.values(bData.cost).reduce((a,b) => a + b, 0);
    
    if (currentStorage + refundVolume > maxStorage) {
        if (typeof showToast === 'function') showToast("STORAGE TOO FULL FOR SCRAP", "error");
        logMessage("<span style='color:var(--danger)'>Cannot demolish: Colony storage lacks capacity for salvaged materials.</span>");
        return;
    }
    
    colony.buildings[buildingId] -= 1;
    if (colony.buildings[buildingId] <= 0) delete colony.buildings[buildingId];

    for (const [cId, qty] of Object.entries(bData.cost)) {
        colony.storage[cId] = (colony.storage[cId] || 0) + qty;
    }

    if (typeof soundManager !== 'undefined') soundManager.playWarning(); 
    if (typeof showToast === 'function') showToast("BUILDING SCRAPPED. MATERIALS REFUNDED.", "success");
    logMessage(`<span style='color:var(--warning)'>[ ENGINEERING ] A ${bData.name} was successfully demolished at ${colony.name}. Materials returned to local storage.</span>`);
    
    openColonyManagement(colonyId); 
}

function transferItem(colonyId, itemId, direction) {
    const colony = playerColonies[colonyId];
    if (!colony) return;

    let playerHas = playerCargo[itemId] || 0;
    if (itemId === 'MERCENARY_PLATOON') playerHas = Math.floor((playerShip.forces.marines || 0) / 10);
    else if (itemId === 'ASSAULT_MECH') playerHas = playerShip.forces.heavyMechs || 0;

    if (direction === 'TO_COLONY') {
        if (playerHas > 0) {
            const maxStorage = 1000 + ((colony.buildings['STORAGE_SILOS'] || 0) * 2500);
            let currentStorage = Object.values(colony.storage).reduce((a,b) => a + b, 0);
            if (currentStorage + 1 > maxStorage) {
                if (typeof showToast === 'function') showToast("COLONY STORAGE FULL", "error");
                return;
            }
            
            if (itemId === 'MERCENARY_PLATOON') playerShip.forces.marines -= 10;
            else if (itemId === 'ASSAULT_MECH') playerShip.forces.heavyMechs -= 1;
            else {
                playerCargo[itemId]--;
                if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
            }
            
            colony.storage[itemId] = (colony.storage[itemId] || 0) + 1;
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        }
    } else if (direction === 'TO_SHIP') {
        if ((colony.storage[itemId] || 0) > 0) {
            
            if (itemId === 'MERCENARY_PLATOON') {
                if ((playerShip.forces.marines || 0) + 10 > (playerShip.forces.maxTroops || 20)) {
                    if (typeof showToast === 'function') showToast("BARRACKS FULL", "error"); return;
                }
                playerShip.forces.marines += 10;
            } else if (itemId === 'ASSAULT_MECH') {
                if ((playerShip.forces.heavyMechs || 0) + 1 > (playerShip.forces.maxTroops || 20)) {
                    if (typeof showToast === 'function') showToast("VEHICLE BAY FULL", "error"); return;
                }
                playerShip.forces.heavyMechs += 1;
            } else {
                const itemData = typeof COMMODITIES !== 'undefined' ? COMMODITIES[itemId] : null;
                const weight = itemData && itemData.weight !== undefined ? itemData.weight : 1;
                if (typeof currentCargoLoad !== 'undefined' && typeof PLAYER_CARGO_CAPACITY !== 'undefined') {
                    if (currentCargoLoad + weight > PLAYER_CARGO_CAPACITY) {
                        if (typeof showToast === 'function') showToast("CARGO HOLD FULL", "error"); return;
                    }
                }
                playerCargo[itemId] = (playerCargo[itemId] || 0) + 1;
            }

            colony.storage[itemId]--;
            if (colony.storage[itemId] <= 0) delete colony.storage[itemId];
            if (typeof soundManager !== 'undefined') soundManager.playGain();
        }
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    openColonyManagement(colonyId); 
}

function collectColonyTaxes(colonyId) {
    const colony = playerColonies[colonyId];
    if (!colony || colony.treasury <= 0) return;
    const amount = colony.treasury;
    playerCredits += amount;
    colony.treasury = 0;
    logMessage(`<span style='color:var(--success)'>[ COLONY ] Transferred ${formatNumber(amount)}c from ${colony.name}'s tax vault.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof renderUIStats === 'function') renderUIStats();
    openColonyManagement(colonyId); 
}

function cycleColonyPolicy(colonyId) {
    const colony = playerColonies[colonyId];
    if (!colony) return;
    const policies = ['BALANCED', 'INDUSTRY', 'WEALTH', 'MILITIA', 'RESEARCH', 'UTOPIAN', 'EXPANSIONIST', 'SURVIVALIST', 'AUTHORITARIAN'];
    colony.policy = policies[(policies.indexOf(colony.policy) + 1) % policies.length];
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    openColonyManagement(colonyId); 
}

// --- Helper function for random colony events ---
function triggerColonyEvent(colony) {
    const events = [];
    const inDebt = colony.treasury < 0;
    const isStarving = (colony.storage['FOOD_SUPPLIES'] || 0) <= 0;

    if (colony.defense < 50 && Math.random() < 0.1) {
        events.push(() => {
            const stolen = Math.floor(Math.random() * 500) + 100;
            colony.treasury -= stolen;
            colony.alerts.unshift(`<span style="color:var(--danger)">[ RAID ] Pirates overwhelmed defenses and looted ${stolen}c.</span>`);
        });
    }
    if (colony.morale < 30 && Math.random() < 0.1) {
        events.push(() => {
            colony.alerts.unshift(`<span style="color:var(--danger)">[ STRIKE ] Unhappy workers halted production for the day.</span>`);
            // Effectively skips production this tick
        });
    }
    if (colony.morale >= 80 && Math.random() < 0.1) {
        events.push(() => {
            const boost = Math.floor(Math.random() * 300) + 100;
            colony.treasury += boost;
            colony.alerts.unshift(`<span style="color:var(--success)">[ FESTIVAL ] High morale led to a local festival! +${boost}c</span>`);
        });
    }

    if (events.length > 0) {
        events[Math.floor(Math.random() * events.length)]();
        if (colony.alerts.length > 5) colony.alerts.pop();
    }
}

// --- 5. THE DATA-DRIVEN SIMULATION MASTER TICK ---
GameBus.on('TICK_PROCESSED', (tick) => {
    if (tick.interrupt) return;

    if (typeof playerColonies !== 'undefined') {
        Object.values(playerColonies).forEach(colony => {
            if (colony.established) {
                if (typeof colony.lastTick === 'undefined') colony.lastTick = currentGameDate;

                if (currentGameDate - colony.lastTick >= 1.0) {
                    colony.lastTick = currentGameDate;
                    const policy = colony.policy || 'BALANCED';

                    // 1. DATA-DRIVEN STAT AGGREGATOR
                    let stats = {
                        upkeep: 0, popCap: 0, storageCap: 1000, defense: 0,
                        waterProd: 0, foodProd: 0, alloyProd: 0, techProd: 0, mineralProd: 0,
                        weaponProd: 0, mechProd: 0, troopProd: 0, luxuryProd: 0, stimProd: 0, medProd: 0, voidProd: 0,
                        
                        // 👇 BUG FIX: Added moraleBonus to prevent NaN math errors
                        moraleRegen: 0, moraleBonus: 0, moralePenalty: 0,
                        
                        taxMult: 1.0, taxFlat: 0, illegalTaxes: 0,
                        passiveCredits: 0, passiveXP: 0,
                        crimeReduction: 0, popGrowthMult: 1.0, foodEfficiency: 1.0, omniProd: 1.0,
                        miningBoost: 1.0, resourceMult: 1.0, autoTrade: false,
                        consume: { "WATER": 0, "FOOD_SUPPLIES": 0, "REFINED_ALLOY": 0, "MINERALS": 0, "TECH_PARTS": 0, "MEDICAL_SUPPLIES": 0 }
                    };

                    // Aggregate all building effects!
                    for (const [bId, count] of Object.entries(colony.buildings)) {
                        const bData = COLONY_BUILDINGS[bId];
                        if (bData && count > 0) {
                            stats.upkeep += (bData.upkeep || 0) * count;
                            
                            for (const [effect, val] of Object.entries(bData.effects)) {
                                    // Multipliers stack by addition or multiplication depending on logic
                                    
                                    // 👇 BUG FIX: Additive tax scaling so 0.5 increases taxes by 50% instead of cutting them in half
                                    if (effect === 'taxMult') stats.taxMult += (val * count);
                                    
                                    else if (effect === 'popGrowthMult') stats.popGrowthMult *= Math.pow(val, count);
                                    else if (effect === 'foodEfficiency') stats.foodEfficiency *= Math.pow(val, count);
                                    else if (effect === 'omniProd') stats.omniProd *= Math.pow(val, count);
                                    else if (effect === 'miningBoost') stats.miningBoost *= Math.pow(val, count);
                                    else if (effect === 'resourceMult') stats.resourceMult *= Math.pow(val, count);
                                    else if (effect === 'autoTrade') stats.autoTrade = val; // Boolean
                                    // Complicated consumption objects
                                    else if (effect === 'consume') {
                                        for (const [cId, cVal] of Object.entries(val)) {
                                            stats.consume[cId] = (stats.consume[cId] || 0) + (cVal * count);
                                        }
                                    }
                                    // Standard additive stats
                                    else {
                                        stats[effect] += (val * count);
                                    }
                                }
                            }
                        }
                    }

                    // --- 2. BIOME MODIFIERS ---
                    let biomeDef = typeof PLANET_BIOMES !== 'undefined' ? PLANET_BIOMES[colony.biome] : null;
                    if (!biomeDef && typeof PLANET_BIOMES !== 'undefined') {
                        // Legacy save fallback
                        const legacyKey = Object.keys(PLANET_BIOMES).find(k => PLANET_BIOMES[k].name === colony.biome);
                        if (legacyKey) biomeDef = PLANET_BIOMES[legacyKey];
                    }

                    if (biomeDef) {
                        if (biomeDef.id === 'VOLCANIC') { stats.alloyProd = Math.floor(stats.alloyProd * 1.5); }
                        else if (biomeDef.id === 'GLACIAL' || biomeDef.id === 'OCEANIC') { stats.waterProd = Math.floor(stats.waterProd * 1.5); }
                        else if (biomeDef.id === 'DESERT') { stats.waterProd = Math.floor(stats.waterProd * 0.5); }
                        else if (biomeDef.id === 'MACHINE_WORLD') { stats.techProd = Math.floor(stats.techProd * 1.5); }
                    }

                    // --- 3. APPLY DEBT EFFICIENCY ---
                    colony.treasury -= stats.upkeep; 
                    const inDebt = colony.treasury < 0;
                    // If in debt, buildings only work at 50% capacity (rounded down)
                    const eff = inDebt ? 0.5 : 1.0;

                    // --- 4. APPLY POLICY MODIFIERS ---
                    if (policy === 'AUTHORITARIAN') { stats.defense += 100; stats.taxMult *= 1.4; stats.moralePenalty += 20; stats.popGrowthMult *= 0.5; }
                    if (policy === 'SURVIVALIST') { stats.defense += 10; stats.foodEfficiency *= 0.8; stats.popGrowthMult *= 0.5; }
                    if (policy === 'EXPANSIONIST') { stats.defense -= 20; stats.foodEfficiency *= 1.5; stats.popGrowthMult *= 2.0; }
                    if (policy === 'INDUSTRY') { stats.mineralProd *= 2; }
                    if (policy === 'WEALTH') { stats.taxMult *= 2; stats.moralePenalty += 5; }
                    if (policy === 'UTOPIAN') { stats.moraleRegen += 10; stats.taxMult = 0; }
                    if (policy === 'RESEARCH') { stats.passiveXP *= 2; stats.taxMult *= 0.5; }

                    // Apply standard formulas
                    colony.defense = Math.max(0, stats.defense);
                    if (colony.alerts === undefined) colony.alerts = [];

                    // --- 5. PRODUCE RESOURCES (Checking Inputs!) ---
                    let currentStorage = Object.values(colony.storage).reduce((a,b) => a + b, 0);
                    const isStorageFull = currentStorage >= stats.storageCap;

                    // A. Raw Materials (No inputs required)
                    if (!isStorageFull) {
                        let wProd = Math.floor(stats.waterProd * eff * stats.omniProd);
                        if (currentStorage + wProd > stats.storageCap) wProd = Math.max(0, stats.storageCap - currentStorage);
                        colony.storage['WATER'] = (colony.storage['WATER'] || 0) + wProd;
                        currentStorage += wProd;

                        // Planetary Mining
                        if (biomeDef && biomeDef.resources && biomeDef.resources.length > 0) {
                            const res = biomeDef.resources[Math.floor(Math.random() * biomeDef.resources.length)];
                            let amount = Math.floor(Math.random() * 2) + 1;
                            amount += Math.floor(colony.population / 500); 
                            amount = Math.floor(amount * stats.miningBoost * stats.resourceMult * eff * stats.omniProd);
                            if (currentStorage + amount > stats.storageCap) amount = Math.max(0, stats.storageCap - currentStorage);
                            colony.storage[res] = (colony.storage[res] || 0) + amount;
                            currentStorage += amount;
                        }
                        
                        let mProd = Math.floor(stats.mineralProd * eff * stats.omniProd);
                        if (currentStorage + mProd > stats.storageCap) mProd = Math.max(0, stats.storageCap - currentStorage);
                        colony.storage['MINERALS'] = (colony.storage['MINERALS'] || 0) + mProd;
                        currentStorage += mProd;
                    }

                    // B. Refined Materials (Requires Inputs)
                    if (!isStorageFull) {
                        // Food (Consumes Water)
                        let fProd = Math.floor(stats.foodProd * eff * stats.omniProd);
                        let waterNeed = Math.floor(stats.consume['WATER'] * eff);
                        if ((colony.storage['WATER'] || 0) >= waterNeed) {
                            colony.storage['WATER'] -= waterNeed;
                        } else {
                            fProd = Math.floor(fProd / 2); // Half production if missing water
                            colony.storage['WATER'] = 0;
                        }
                        if (currentStorage + fProd > stats.storageCap) fProd = Math.max(0, stats.storageCap - currentStorage);
                        colony.storage['FOOD_SUPPLIES'] = (colony.storage['FOOD_SUPPLIES'] || 0) + fProd;
                        currentStorage += fProd;

                        // Alloys (Consumes Minerals)
                        let aProd = Math.floor(stats.alloyProd * eff * stats.omniProd);
                        let minNeed = Math.floor(stats.consume['MINERALS'] * eff);
                        if ((colony.storage['MINERALS'] || 0) >= minNeed) {
                            colony.storage['MINERALS'] -= minNeed;
                        } else {
                            aProd = Math.floor(aProd / 2);
                            colony.storage['MINERALS'] = 0;
                        }
                        if (currentStorage + aProd > stats.storageCap) aProd = Math.max(0, stats.storageCap - currentStorage);
                        colony.storage['REFINED_ALLOY'] = (colony.storage['REFINED_ALLOY'] || 0) + aProd;
                        currentStorage += aProd;

                        // Tech Parts (Consumes Alloys)
                        let tProd = Math.floor(stats.techProd * eff * stats.omniProd);
                        let alNeed = Math.floor(stats.consume['REFINED_ALLOY'] * eff);
                        if ((colony.storage['REFINED_ALLOY'] || 0) >= alNeed) {
                            colony.storage['REFINED_ALLOY'] -= alNeed;
                        } else {
                            tProd = Math.floor(tProd / 2);
                            colony.storage['REFINED_ALLOY'] = 0;
                        }
                        if (currentStorage + tProd > stats.storageCap) tProd = Math.max(0, stats.storageCap - currentStorage);
                        colony.storage['TECH_PARTS'] = (colony.storage['TECH_PARTS'] || 0) + tProd;
                        currentStorage += tProd;
                    }

                    // C. Advanced Logistics (Consumes specific multi-inputs)
                    if (!isStorageFull && eff > 0) {
                        // 👇 BUG FIX: Removed double-dipping manual deductions (Step 5B already handles it)
                        
                        let wProd = Math.floor(stats.weaponProd * eff * stats.omniProd);
                        if (wProd > 0) colony.storage['WEAPONS'] = (colony.storage['WEAPONS'] || 0) + wProd;
                        
                        let trProd = Math.floor(stats.troopProd * eff * stats.omniProd);
                        if (trProd > 0) colony.storage['MERCENARY_PLATOON'] = (colony.storage['MERCENARY_PLATOON'] || 0) + trProd;
                        
                        let meProd = Math.floor(stats.mechProd * eff * stats.omniProd);
                        if (meProd > 0) colony.storage['ASSAULT_MECH'] = (colony.storage['ASSAULT_MECH'] || 0) + meProd;
                        
                        let stProd = Math.floor(stats.stimProd * eff * stats.omniProd);
                        if (stProd > 0) colony.storage['PROHIBITED_STIMS'] = (colony.storage['PROHIBITED_STIMS'] || 0) + stProd;
                        
                        let vProd = Math.floor(stats.voidProd * eff * stats.omniProd);
                        if (vProd > 0) colony.storage['VOID_CRYSTALS'] = (colony.storage['VOID_CRYSTALS'] || 0) + vProd;
                        
                        let mdProd = Math.floor(stats.medProd * eff * stats.omniProd);
                        if (mdProd > 0) colony.storage['MEDICAL_SUPPLIES'] = (colony.storage['MEDICAL_SUPPLIES'] || 0) + mdProd;
                        
                        // 👇 BUG FIX: Added Luxury Goods generation
                        let luxProd = Math.floor(stats.luxuryProd * eff * stats.omniProd);
                        if (luxProd > 0) colony.storage['LUXURY_GOODS'] = (colony.storage['LUXURY_GOODS'] || 0) + luxProd;
                    }

                    // --- 6. DEMOGRAPHICS & CONSUMPTION ---
                    let foodConsumption = Math.ceil((colony.population / 100) * stats.foodEfficiency); 
                    
                    if ((colony.storage['FOOD_SUPPLIES'] || 0) >= foodConsumption) {
                        colony.storage['FOOD_SUPPLIES'] -= foodConsumption;
                        
                        // Growth Tick
                        if (colony.morale >= 50 && colony.population < stats.popCap) {
                            let growthTick = 1 * stats.popGrowthMult; 
                            if (colony.storage['FOOD_SUPPLIES'] > foodConsumption * 10) growthTick += 1;
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
                        // Starvation
                        colony.storage['FOOD_SUPPLIES'] = 0;
                        stats.moralePenalty += 15;
                        colony.growthProgress = 0; 
                        colony.population -= Math.ceil(colony.population * 0.10); 
                        if (colony.population < 0) colony.population = 0;
                    }

                    // --- 7. MORALE UPDATE ---
                    if (policy === 'AUTHORITARIAN') {
                        colony.morale = 40; 
                    } else {
                        if (inDebt) stats.moralePenalty += 2; 
                        
                        // 👇 BUG FIX: Added stats.moraleBonus and hard-clamped to a minimum of 0
                        colony.morale = Math.max(0, Math.min(100, colony.morale + stats.moraleBonus + stats.moraleRegen - stats.moralePenalty));
                    }

                    // --- 8. ECONOMY & TAXES ---
                    let moraleMult = colony.morale / 100;
                    if (policy === 'AUTHORITARIAN') moraleMult = 1.0; 
                    
                    let taxIncome = Math.floor(colony.population * 0.5 * stats.taxMult * moraleMult);
                    colony.treasury += taxIncome;
                    colony.treasury += Math.floor(stats.passiveCredits * eff);
                    
                    // Syndicate Laundering (Crime reduces defense/morale, but pays out)
                    let crimeLaundering = Math.floor(stats.illegalTaxes * eff);
                    if (stats.crimeReduction > 0) crimeLaundering = Math.floor(crimeLaundering * 0.5);
                    colony.treasury += crimeLaundering;

                    // Global Research Lab Bonus
                    if (stats.passiveXP > 0) {
                        let xpYield = Math.floor(stats.passiveXP * eff);
                        if (typeof playerXP !== 'undefined') {
                            playerXP += xpYield;
                            if (typeof checkLevelUp === 'function') checkLevelUp();
                        }
                    }

                    // INTERSTELLAR EXCHANGE (Auto-Liquidation)
                    if (stats.autoTrade) {
                        let autoCredits = 0;
                        for (const itemKey in colony.storage) {
                            if (colony.storage[itemKey] > 50) {
                                const excess = colony.storage[itemKey] - 50;
                                const amountToSell = Math.ceil(excess * 0.10); 
                                const basePrice = (typeof COMMODITIES !== 'undefined' && COMMODITIES[itemKey]) ? COMMODITIES[itemKey].basePrice : 10;
                                colony.storage[itemKey] -= amountToSell;
                                autoCredits += (amountToSell * basePrice);
                            }
                        }
                        if (autoCredits > 0) colony.treasury += autoCredits;
                    }

                    // --- 9. CONSTRUCTION PROGRESS ---
                    if (colony.activeConstruction) {
                        colony.activeConstruction.progress += 1;
                        if (colony.activeConstruction.progress >= colony.activeConstruction.total) {
                            const bId = colony.activeConstruction.id;
                            colony.buildings[bId] = (colony.buildings[bId] || 0) + 1;
                            colony.activeConstruction = null;
                            if (typeof soundManager !== 'undefined') soundManager.playGain();
                            colony.alerts.unshift(`<span style='color:var(--success)'>[ ENGINEER ] Construction complete: ${COLONY_BUILDINGS[bId].name}</span>`);
                        }
                    }

                    // --- 10. RANDOM COLONY EVENTS ---
                    triggerColonyEvent(colony);
                }
            }
        });
    }
});

// --- END OF FILE colonies.js ---
