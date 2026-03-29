// ==========================================
// --- WAYFINDER COLONY SIMULATION ENGINE ---
// ==========================================

const COLONY_PHASES = ['OUTPOST', 'SETTLEMENT', 'METROPOLIS', 'CAPITAL'];

// --- 1. COLONY DATA STRUCTURES ---
const COLONY_BUILDINGS = {
    // --- TIER 1: OUTPOST ---
    "HAB_BLOCK": { 
        name: "Habitation Block", tier: 1,
        cost: { "REFINED_ALLOYS": 15, "TECH_PARTS": 2 }, 
        time: 8, effects: { popCap: 500 }, 
        desc: "Standard housing. +500 Max Population." 
    },
    "WIND_TRAPS": {
        name: "Moisture Wind Traps", tier: 1,
        cost: { "MINERALS": 20, "TECH_PARTS": 2 },
        time: 5, effects: { waterProd: 5 },
        desc: "Low-tech moisture farming. Generates 5 Water per Stardate."
    },
    "WATER_EXTRACTOR": {
        name: "Atmospheric Condenser", tier: 1,
        cost: { "REFINED_ALLOYS": 15, "TECH_PARTS": 5 },
        time: 10, effects: { waterProd: 10 },
        desc: "Advanced condensation. Generates 10 Water per Stardate."
    },
    "MYCELIUM_CAVES": {
        name: "Mycelium Caves", tier: 1,
        cost: { "MINERALS": 15, "WATER": 5 },
        time: 6, effects: { foodProd: 2 },
        desc: "Super-cheap subterranean fungus farming. Generates 2 Food per Stardate."
    },
    "HYDRO_FARM": { 
        name: "Hydroponics Farm", tier: 1,
        cost: { "REFINED_ALLOYS": 20, "TECH_PARTS": 5 }, 
        time: 15, effects: { foodProd: 5, waterConsume: 2 }, 
        desc: "Generates 5 Food. Consumes 2 Water per Stardate." 
    },
    "ALGAE_VATS": { 
        name: "Nutrient Algae Vats", tier: 1,
        cost: { "REFINED_ALLOYS": 10, "MINERALS": 10 }, 
        time: 12, effects: { foodProd: 3, moralePenalty: -1 }, 
        desc: "Generates 3 Food without needing Water. The awful taste reduces Morale by 1." 
    },
    "SMELTING_FACILITY": {
        name: "Alloy Smelting Plant", tier: 1,
        cost: { "MINERALS": 50, "TECH_PARTS": 10, "REFINED_ALLOYS": 10 },
        time: 20, effects: { alloyProd: 3 },
        desc: "Refines raw ore, generating 3 Refined Alloys per Stardate."
    },
    "SCRAP_YARD": {
        name: "Scrap Yard", tier: 1,
        cost: { "MINERALS": 30 },
        time: 10, effects: { alloyProd: 1 },
        desc: "Slowly recycles junk into usable materials. Generates 1 Refined Alloy per Stardate."
    },
    "ORE_CRUSHER": {
        name: "Ore Crusher", tier: 1,
        cost: { "REFINED_ALLOYS": 15 },
        time: 12, effects: { mineralProd: 5 },
        desc: "A noisy, brutal machine. Guaranteed to output 5 Minerals per Stardate regardless of planetary yield."
    },
    "SCAVENGER_GUILD": {
        name: "Scavenger Guild", tier: 1,
        cost: { "REFINED_ALLOYS": 20, "FOOD_SUPPLIES": 10 },
        time: 14, effects: { randomLoot: true },
        desc: "Locals comb the wastes. Passively generates random Minerals or Tech Parts."
    },
    "PROSPECTOR_CAMP": {
        name: "Prospector Camp", tier: 1,
        cost: { "MINERALS": 25, "TECH_PARTS": 5 },
        time: 10, effects: { miningBoost: 1.2, passiveXP: 2 },
        desc: "Maps out local veins. +20% raw mining yields and +2 XP per Stardate."
    },
    "CLINIC_TENT": {
        name: "Clinic Tent", tier: 1,
        cost: { "MINERALS": 10, "REFINED_ALLOYS": 5 },
        time: 5, effects: { medProd: 1, moraleBonus: 1 },
        desc: "Basic triage and first aid. Generates 1 Medical Supply and +1 Morale per Stardate."
    },
    "MILITIA_TENT": {
        name: "Militia Tent", tier: 1,
        cost: { "MINERALS": 20, "WEAPONS": 5 },
        time: 8, effects: { defense: 15 },
        desc: "Arms the locals. +15 Defense to deter early raids."
    },
    "DUST_WALLS": {
        name: "Dust Walls", tier: 1,
        cost: { "MINERALS": 40 },
        time: 12, effects: { defense: 10, moraleBonus: 1 },
        desc: "A basic physical perimeter. +10 Defense and +1 Morale from feeling secure."
    },
    "LOCAL_BAZAAR": {
        name: "Local Bazaar", tier: 1,
        cost: { "MINERALS": 20, "REFINED_ALLOYS": 10 },
        time: 15, effects: { taxEfficiency: 1.1, passiveCredits: 50 },
        desc: "A gritty trading post. Generates 50c per Stardate and boosts tax yield by 10%."
    },
    "OUTPOST_CANTINA": {
        name: "Outpost Cantina", tier: 1,
        cost: { "MINERALS": 20, "FOOD_SUPPLIES": 10 },
        time: 10, effects: { moraleBonus: 3 },
        desc: "A place to drink and forget the frontier. Grants +3 Morale."
    },
    "COMM_RELAY": {
        name: "Comm-Relay Array", tier: 1,
        cost: { "REFINED_ALLOYS": 25, "TECH_PARTS": 10 },
        time: 12, effects: { moraleBonus: 1, passiveXP: 5 },
        desc: "Connects the colony to the galactic net. +1 Morale and +5 XP per Stardate."
    },
    "LISTENING_POST": {
        name: "Listening Post", tier: 1,
        cost: { "REFINED_ALLOYS": 10, "TECH_PARTS": 15 },
        time: 8, effects: { passiveXP: 10 },
        desc: "Eavesdrops on encrypted Concord transmissions. +10 XP per Stardate."
    },
    "STORAGE_SILOS": {
        name: "Reinforced Silos", tier: 1,
        cost: { "REFINED_ALLOYS": 30 },
        time: 10, effects: { safeStorage: true },
        desc: "Prevents resources from spoiling and secures the logistics chain."
    },

    // --- TIER 2: SETTLEMENT ---
    "DEEP_CORE_RIG": { 
        name: "Deep Core Rig", tier: 2,
        cost: { "REFINED_ALLOYS": 80, "TECH_PARTS": 25 }, 
        time: 30, effects: { resourceMult: 2 }, 
        desc: "Doubles the base planetary mining yields." 
    },
    "ATMOS_PROCESSOR": { 
        name: "Atmos-Processor", tier: 2,
        cost: { "REFINED_ALLOYS": 60, "TECH_PARTS": 20, "VOID_CRYSTALS": 1 }, 
        time: 35, effects: { moraleBonus: 3 }, 
        desc: "Purifies air, passively regenerating 3 Morale per Stardate." 
    },
    "HYDROPONIC_ORCHARDS": {
        name: "Hydroponic Orchards", tier: 2,
        cost: { "REFINED_ALLOYS": 60, "TECH_PARTS": 15, "WATER": 20 },
        time: 25, effects: { foodProd: 12, waterConsume: 4 },
        desc: "Massive indoor fruit cultivation. Generates 12 Food. Consumes 4 Water per Stardate."
    },
    "PROTEIN_VATS": {
        name: "Synthetic Protein Vats", tier: 2,
        cost: { "REFINED_ALLOYS": 50, "TECH_PARTS": 30, "WATER": 50 },
        time: 25, effects: { foodProd: 15, waterConsume: 5 },
        desc: "Mass-produces 15 Food. Consumes 5 Water per Stardate."
    },
    "DEFENSE_BATTERY": { 
        name: "Surface Defense Battery", tier: 2,
        cost: { "REFINED_ALLOYS": 40, "WEAPONS": 15 }, 
        time: 20, effects: { defense: 50 }, 
        desc: "Adds 50 Defense Rating to deter raids." 
    },
    "LAW_ENFORCEMENT_HQ": {
        name: "Law Enforcement HQ", tier: 2,
        cost: { "REFINED_ALLOYS": 50, "WEAPONS": 20, "TECH_PARTS": 10 },
        time: 22, effects: { defense: 30, moraleBonus: 2, crimeReduction: 15 },
        desc: "Establishes order. +30 Defense, +2 Morale, offsets Black Market penalties."
    },
    "AUTOMATED_FACTORY": {
        name: "Automated Factory", tier: 2,
        cost: { "REFINED_ALLOYS": 100, "TECH_PARTS": 30, "AI_CORE": 1 },
        time: 40, effects: { techProd: 2, alloyConsume: 2 },
        desc: "Generates 2 Tech Parts. Consumes 2 Refined Alloys per Stardate."
    },
    "TECH_REFINERY": {
        name: "Tech Component Refinery", tier: 2,
        cost: { "REFINED_ALLOYS": 70, "TECH_PARTS": 20 },
        time: 35, effects: { techProd: 2, mineralConsume: 5 },
        desc: "An alternative to Auto-Factories. Generates 2 Tech Parts by consuming 5 Minerals."
    },
    "ADVANCED_ARMORY": {
        name: "Advanced Armory", tier: 2,
        cost: { "REFINED_ALLOYS": 120, "TECH_PARTS": 50, "WEAPONS": 50 },
        time: 30, effects: { troopProd: 1, foodConsume: 5, alloyConsume: 5 },
        desc: "Trains 1 MERCENARY_PLATOON per Stardate. Consumes 5 Food and 5 Alloys."
    },
    "SYNTHETIC_WEAVERS": {
        name: "Synthetic Weavers", tier: 2,
        cost: { "REFINED_ALLOYS": 80, "TECH_PARTS": 40 },
        time: 30, effects: { luxuryProd: 2, waterConsume: 3, mineralConsume: 5 },
        desc: "Generates 2 Luxury Goods per stardate. Consumes 3 Water and 5 Minerals."
    },
    "STIM_LAB": {
        name: "Underground Stim Lab", tier: 2,
        cost: { "REFINED_ALLOYS": 40, "TECH_PARTS": 15 },
        time: 20, effects: { stimProd: 2, medConsume: 1, mineralConsume: 2, moralePenalty: -1 },
        desc: "Illegally synthesizes 2 PROHIBITED_STIMS per Stardate. Consumes Meds and Minerals. -1 Morale."
    },
    "MEDICAL_CLINIC": {
        name: "Frontier Clinic", tier: 2,
        cost: { "REFINED_ALLOYS": 30, "MEDICAL_SUPPLIES": 20, "TECH_PARTS": 10 },
        time: 15, effects: { medProd: 2, moraleBonus: 1 },
        desc: "Synthesizes 2 Medical Supplies per Stardate and boosts morale."
    },
    "BOUNTY_OFFICE": {
        name: "Bounty Hunter Lodge", tier: 2,
        cost: { "REFINED_ALLOYS": 50, "WEAPONS": 20, "TECH_PARTS": 15 },
        time: 20, effects: { defense: 20, passiveCredits: 200 },
        desc: "Attracts local mercenaries. +20 Defense and +200c per Stardate from bounty payouts."
    },
    "SMUGGLERS_DEN": {
        name: "Smuggler's Den", tier: 2,
        cost: { "REFINED_ALLOYS": 40, "WEAPONS": 15 },
        time: 20, effects: { illegalTaxes: 500, defense: -20, moralePenalty: -1 },
        desc: "A hive of villainy. Launders 500c per Stardate, but invites crime (-20 Def, -1 Morale)."
    },
    "CUSTOMS_OFFICE": {
        name: "Customs & Security Node", tier: 2,
        cost: { "REFINED_ALLOYS": 40, "WEAPONS": 10, "TECH_PARTS": 15 },
        time: 20, effects: { taxEfficiency: 1.2, crimeReduction: 10 },
        desc: "Increases tax yields by 20% and reduces the penalties of black market nodes."
    },
    "ORBITAL_BEACON": {
        name: "Orbital Trade Beacon", tier: 2,
        cost: { "REFINED_ALLOYS": 60, "TECH_PARTS": 40 },
        time: 25, effects: { taxEfficiency: 1.3 },
        desc: "Guides massive transport ships safely into orbit. Flat 30% boost to tax yields."
    },
    "COMMERCE_HUB": {
        name: "Galactic Commerce Hub", tier: 2,
        cost: { "REFINED_ALLOYS": 60, "TECH_PARTS": 25, "LUXURY_GOODS": 10 },
        time: 30, effects: { taxMult: 1.5 },
        desc: "Attracts off-world traders. Increases overall tax revenue by 50%."
    },
    "ENTERTAINMENT_NEXUS": {
        name: "Holo-Theater Nexus", tier: 2,
        cost: { "REFINED_ALLOYS": 50, "TECH_PARTS": 30, "LUXURY_GOODS": 20 },
        time: 25, effects: { moraleBonus: 5 },
        desc: "Provides massive entertainment value, regenerating 5 Morale per Stardate."
    },

    // --- TIER 3: METROPOLIS ---
    "ARCOLOGY_SPIRE": {
        name: "Arcology Spire", tier: 3,
        cost: { "REFINED_ALLOYS": 200, "TECH_PARTS": 100, "VOID_CRYSTALS": 3 },
        time: 60, effects: { popCap: 5000, moraleBonus: 2 },
        desc: "A self-contained utopia. +5000 Max Population and +2 Morale."
    },
    "XENOBOTANY_DOME": {
        name: "Xenobotany Dome", tier: 3,
        cost: { "REFINED_ALLOYS": 150, "WATER": 100, "TECH_PARTS": 50 },
        time: 40, effects: { foodProd: 10, medProd: 5 },
        desc: "Cultivates rare flora. Generates 10 Food and 5 Medical Supplies per Stardate."
    },
    "GENE_CLINIC": {
        name: "Gene-Tailoring Clinic", tier: 3,
        cost: { "REFINED_ALLOYS": 200, "TECH_PARTS": 150, "MEDICAL_SUPPLIES": 100, "AI_CORE": 1 },
        time: 50, effects: { medProd: 10, moraleBonus: 5, foodEfficiency: 0.8 },
        desc: "Edits citizen DNA. +10 Medical Supplies, +5 Morale, and permanently reduces colony food consumption by 20%."
    },
    "SPACE_ELEVATOR": {
        name: "Orbital Space Elevator", tier: 3,
        cost: { "REFINED_ALLOYS": 500, "TECH_PARTS": 200, "AI_CORE": 2 },
        time: 90, effects: { taxMult: 2.0 },
        desc: "A tether to the heavens. Doubles tax revenue and is required to become a Capital."
    },
    "ORBITAL_SHIELD": {
        name: "Planetary Aegis Shield", tier: 3,
        cost: { "REFINED_ALLOYS": 250, "TECH_PARTS": 150, "VOID_CRYSTALS": 10 },
        time: 75, effects: { defense: 300, moraleBonus: 5 },
        desc: "An impenetrable energy grid. Massive defense boost. Citizens feel truly safe."
    },
    "PLANETARY_ION_CANNON": {
        name: "Planetary Ion Cannon", tier: 3,
        cost: { "REFINED_ALLOYS": 300, "TECH_PARTS": 100, "WEAPONS": 50, "AI_CORE": 2 },
        time: 65, effects: { defense: 500 },
        desc: "An apocalyptic surface-to-orbit weapon. Grants +500 Defense."
    },
    "HEAVY_VEHICLE_BAY": {
        name: "Heavy Vehicle Bay", tier: 3,
        cost: { "REFINED_ALLOYS": 400, "TECH_PARTS": 150, "AI_CORE": 5 },
        time: 50, effects: { mechProd: 1, alloyConsume: 15, techConsume: 5 },
        desc: "Manufactures 1 ASSAULT_MECH per Stardate. Consumes 15 Alloys and 5 Tech Parts."
    },
    "ORBITAL_SHIPYARD": {
        name: "Orbital Shipyard", tier: 3,
        cost: { "REFINED_ALLOYS": 400, "TECH_PARTS": 200, "AI_CORE": 3 },
        time: 100, effects: { passiveCredits: 5000 },
        desc: "Constructs and sells civilian freighters automatically. Generates 5,000c per Stardate."
    },
    "RESEARCH_LABORATORY": {
        name: "Xeno-Research Lab", tier: 3,
        cost: { "REFINED_ALLOYS": 100, "TECH_PARTS": 80, "ANCIENT_RELICS": 2 },
        time: 45, effects: { passiveXP: 50 },
        desc: "Scientists study the planet. Grants you 50 XP globally per Stardate."
    },
    "CLONING_FACILITY": {
        name: "Vat-Cloning Facility", tier: 3,
        cost: { "REFINED_ALLOYS": 150, "MEDICAL_SUPPLIES": 100, "ILLEGAL_ORGANS": 15 },
        time: 50, effects: { popGrowthMult: 4, moralePenalty: -5 },
        desc: "Quadruples population growth speed. The ethical violations massively reduce morale."
    },
    "BLACK_MARKET_NODE": {
        name: "Syndicate Node", tier: 3,
        cost: { "REFINED_ALLOYS": 50, "WEAPONS": 50, "PROHIBITED_STIMS": 20 },
        time: 30, effects: { illegalTaxes: 1000, defense: -50, moralePenalty: -2 },
        desc: "Launders 1000c per Stardate, but invites heavy crime (-50 Defense, -2 Morale)."
    },

    // --- TIER 4: CAPITAL (MEGASTRUCTURES) ---
    "INTERSTELLAR_EXCHANGE": {
        name: "Interstellar Exchange", tier: 4,
        cost: { "REFINED_ALLOYS": 1000, "TECH_PARTS": 500, "LUXURY_GOODS": 100, "AI_CORE": 5 },
        time: 150, effects: { autoTrade: true },
        desc: "Automatically sells 10% of all excess colony resources to the galactic market for pure credits every Stardate."
    },
    "BIOSPHERE_RESERVE": {
        name: "Utopian Biosphere", tier: 4,
        cost: { "REFINED_ALLOYS": 800, "WATER": 500, "TECH_PARTS": 300, "VOID_CRYSTALS": 15 },
        time: 120, effects: { popCap: 50000, moraleBonus: 10 },
        desc: "A massive, planetary-scale terraforming paradise. +50,000 Max Population and +10 Morale."
    },
    "ASTRAL_MONUMENT": {
        name: "Astral Monument", tier: 4,
        cost: { "REFINED_ALLOYS": 2000, "LUXURY_GOODS": 1000, "ANCIENT_RELICS": 10, "VOID_CRYSTALS": 10 },
        time: 180, effects: { moraleBonus: 20, passiveCredits: 10000 },
        desc: "A staggering, awe-inspiring megastructure. Generates +20 Morale and 10,000c per Stardate from galactic tourism."
    },
    "STELLAR_FORGE": {
        name: "Stellar Forge", tier: 4,
        cost: { "REFINED_ALLOYS": 1500, "TECH_PARTS": 800, "AI_CORE": 10, "ANCIENT_RELICS": 5 },
        time: 200, effects: { alloyProd: 20, techProd: 10 },
        desc: "Harnesses the core of the planet for ultimate industry. Generates 20 Alloys and 10 Tech Parts per Stardate. No resource cost."
    },
    "DARK_MATTER_COLLIDER": {
        name: "Dark Matter Collider", tier: 4,
        cost: { "REFINED_ALLOYS": 3000, "TECH_PARTS": 1500, "AI_CORE": 25, "VOID_CRYSTALS": 5 },
        time: 300, effects: { voidProd: 1, passiveXP: 200 },
        desc: "Shatters the fabric of reality. Generates 200 XP and synthesizes 1 VOID_CRYSTAL per Stardate."
    },
    "AI_OVERLORD_CORE": {
        name: "A.I. Overlord Core", tier: 4,
        cost: { "REFINED_ALLOYS": 2000, "TECH_PARTS": 1000, "AI_CORE": 20, "VOID_CRYSTALS": 5 },
        time: 250, effects: { omniProd: 2.0, moralePenalty: -10 },
        desc: "Cedes control to a hyper-intelligent AI. Doubles all factory and farm outputs, but heavily penalizes morale and displaces organics."
    }
};

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
        storage: { "FOOD_SUPPLIES": 25, "WATER": 20, "REFINED_ALLOYS": 30 },
        buildings: { "HAB_BLOCK": 1 }, 
        activeConstruction: null, 
        biome: planet.biome.name,
        lastTick: currentGameDate
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

    const numHabs = colony.buildings['HAB_BLOCK'] || 0;
    const numArcos = colony.buildings['ARCOLOGY_SPIRE'] || 0;
    const numBios = colony.buildings['BIOSPHERE_RESERVE'] || 0;
    const maxPop = (numHabs * 500) + (numArcos * 5000) + (numBios * 50000); 
    
    const isStarving = (colony.storage['FOOD_SUPPLIES'] || 0) <= 0;
    const phaseIndex = COLONY_PHASES.indexOf(colony.phase);

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
            </div>

            <div class="trade-math-area" style="background: rgba(0,0,0,0.3); border: 1px solid #333; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
                <div class="trade-stat-row"><span>Population:</span> <span style="color:var(--text-color); font-weight:bold;">${formatNumber(colony.population)} / ${formatNumber(maxPop)}</span></div>
                <div class="trade-stat-row"><span>Growth Rate:</span> <span style="color:${colony.morale > 50 ? 'var(--success)' : 'var(--warning)'}; font-size:10px;">${Math.floor(colony.growthProgress)}% to next influx</span></div>
                <div class="trade-stat-row" style="margin-top:10px;"><span>Morale:</span> <span style="color:${colony.morale >= 50 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${colony.morale}%</span></div>
                <div class="trade-stat-row"><span>Defense Rating:</span> <span style="color:var(--accent-color); font-weight:bold;">${colony.defense || 0}</span></div>
            </div>
            
            <button class="action-button full-width-btn" style="margin-bottom:5px; border-color:${currentColonyTab === 'OVERVIEW' ? 'var(--accent-color)' : '#333'}" onclick="setColonyTab('${colonyId}', 'OVERVIEW')">OVERVIEW & CENSUS</button>
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
            const canUpgrade = colony.population >= 1000 && (colony.storage['REFINED_ALLOYS'] || 0) >= 100 && (colony.storage['TECH_PARTS'] || 0) >= 25;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed var(--accent-color); padding:15px; border-radius:4px; margin-top:20px;">
                    <h4 style="color:var(--accent-color); margin:0 0 10px 0;">UPGRADE TO SETTLEMENT (TIER 2)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 1,000 Population, 100 Refined Alloys, 25 Tech Parts.</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? 'var(--success)' : 'var(--danger)'}; color:${canUpgrade ? 'var(--success)' : '#666'};" onclick="upgradeColonyPhase('${colonyId}')" ${!canUpgrade ? 'disabled' : ''}>AUTHORIZE EXPANSION</button>
                </div>
            `;
        } else if (phaseIndex === 1) { 
            const canUpgrade = colony.population >= 5000 && (colony.storage['REFINED_ALLOYS'] || 0) >= 500 && (colony.storage['TECH_PARTS'] || 0) >= 150 && (colony.storage['AI_CORE'] || 0) >= 2;
            upgradeHtml = `
                <div style="background:rgba(0,0,0,0.5); border:1px dashed var(--gold-text); padding:15px; border-radius:4px; margin-top:20px;">
                    <h4 style="color:var(--gold-text); margin:0 0 10px 0;">FOUND A METROPOLIS (TIER 3)</h4>
                    <p style="font-size:11px; color:#888; margin-bottom:10px;">Requires: 5,000 Population, 500 Refined Alloys, 150 Tech Parts, 2 AI Cores.</p>
                    <button class="action-button small-btn" style="width:100%; border-color:${canUpgrade ? 'var(--gold-text)' : 'var(--danger)'}; color:${canUpgrade ? 'var(--gold-text)' : '#666'};" onclick="upgradeColonyPhase('${colonyId}')" ${!canUpgrade ? 'disabled' : ''}>AUTHORIZE EXPANSION</button>
                </div>
            `;
        } else if (phaseIndex === 2) { 
            const hasElevator = (colony.buildings['SPACE_ELEVATOR'] || 0) > 0;
            const canUpgrade = hasElevator && colony.population >= 30000 && (colony.storage['REFINED_ALLOYS'] || 0) >= 2000 && (colony.storage['TECH_PARTS'] || 0) >= 500 && (colony.storage['AI_CORE'] || 0) >= 5;
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

        tabContent.innerHTML = `
            <div style="display:flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; background:rgba(0,0,0,0.5); border:1px solid var(--gold-text); padding:15px; border-radius:4px;">
                    <div style="font-size:10px; color:var(--gold-text); letter-spacing:1px; margin-bottom:5px;">TAX VAULT</div>
                    <div style="font-size:24px; color:var(--gold-text); font-weight:bold;">${formatNumber(colony.treasury)}c</div>
                    <button class="action-button small-btn" style="margin-top:10px; border-color:var(--gold-text); color:var(--gold-text); width:100%;" onclick="collectColonyTaxes('${colonyId}')">WITHDRAW FUNDS</button>
                </div>
                <div style="flex: 1; background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px;">
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:5px;">ACTIVE POLICY</div>
                    <div style="font-size:16px; font-weight:bold; color:${policyColor};">${colony.policy}</div>
                    <button class="action-button small-btn" style="margin-top:16px; width:100%;" onclick="cycleColonyPolicy('${colonyId}')">CYCLE DIRECTIVE</button>
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
        
        allItems.forEach(item => {
            const shipQty = playerCargo[item] || 0;
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

        tabContent.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:15px;">
                <h3 style="color:var(--accent-color); margin:0;">WAREHOUSE & LOGISTICS</h3>
            </div>
            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px; max-height:400px; overflow-y:auto;">
                ${storageHtml === '<table style="width:100%; text-align:left; font-size:12px; border-collapse: collapse;"></table>' ? '<span style="color:#666">No items to transfer.</span>' : storageHtml}
            </div>
            <div style="font-size:10px; color:#888; margin-top:10px;">
                * Note: Watch your supply chains! Armories consume Alloys. Weavers consume Minerals and Water.
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
                    <div style="font-size:10px; color:var(--success); letter-spacing:1px; margin-bottom:5px;">ACTIVE PROJECT</div>
                    <div style="font-size:16px; font-weight:bold; color:var(--text-color);">${proj.name}</div>
                    <div style="width:100%; background:#222; height:10px; border-radius:5px; margin-top:10px; overflow:hidden;">
                        <div style="width:${pct}%; background:var(--success); height:100%;"></div>
                    </div>
                    <div style="font-size:10px; color:#888; text-align:right; margin-top:5px;">Est. Completion: ${colony.activeConstruction.total - colony.activeConstruction.progress} Stardates</div>
                </div>
            `;
        } else {
            buildHtml = `<div style="color:var(--item-desc-color); font-size:12px; margin-bottom:20px;">No active projects. Select a blueprint below to begin construction. Resources will be drawn directly from Colony Storage.</div>`;
        }

        buildHtml += `<h4 style="color:var(--accent-color); margin:0 0 10px 0; letter-spacing:1px; font-size:11px;">AVAILABLE BLUEPRINTS</h4>`;
        
        for (const [bId, bData] of Object.entries(COLONY_BUILDINGS)) {
            if (bData.tier > (phaseIndex + 1)) continue; 

            const installed = colony.buildings[bId] || 0;
            
            let costHtml = [];
            let canAfford = true;
            for (const [cId, qty] of Object.entries(bData.cost)) {
                const hasQty = colony.storage[cId] || 0;
                const cColor = hasQty >= qty ? 'var(--success)' : 'var(--danger)';
                if (hasQty < qty) canAfford = false;
                
                const cName = typeof COMMODITIES !== 'undefined' && COMMODITIES[cId] ? COMMODITIES[cId].name : cId;
                costHtml.push(`<span style="color:${cColor}">${qty} ${cName}</span>`);
            }

            buildHtml += `
                <div style="background:rgba(255,255,255,0.02); border:1px solid #333; padding:10px; margin-bottom:10px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="color:var(--text-color); font-weight:bold; font-size:13px;">${bData.name} <span style="color:var(--accent-color); font-size:11px;">(Built: ${installed})</span></div>
                        <div style="color:var(--item-desc-color); font-size:10px; margin:4px 0;">${bData.desc}</div>
                        <div style="font-size:9px;">Cost: ${costHtml.join(', ')}</div>
                    </div>
                    <button class="action-button small-btn" style="padding:6px 12px; font-size:10px;" 
                        onclick="startConstruction('${colonyId}', '${bId}')" 
                        ${!canAfford || colony.activeConstruction ? 'disabled' : ''}>
                        BUILD
                    </button>
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
        colony.storage['REFINED_ALLOYS'] -= 100;
        colony.storage['TECH_PARTS'] -= 25;
        colony.phase = 'SETTLEMENT';
        logMessage(`<span style='color:var(--success); font-weight:bold;'>[ MILESTONE REACHED ] ${colony.name} has been officially recognized as a Tier 2 Settlement! New blueprints unlocked.</span>`);
    } else if (phaseIndex === 1) { 
        colony.storage['REFINED_ALLOYS'] -= 500;
        colony.storage['TECH_PARTS'] -= 150;
        colony.storage['AI_CORE'] -= 2;
        colony.phase = 'METROPOLIS';
        logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ MILESTONE REACHED ] ${colony.name} has blossomed into a sprawling Metropolis! True power is yours.</span>`);
    } else if (phaseIndex === 2) { 
        colony.storage['REFINED_ALLOYS'] -= 2000;
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

function transferItem(colonyId, itemId, direction) {
    const colony = playerColonies[colonyId];
    if (!colony) return;

    if (direction === 'TO_COLONY') {
        if ((playerCargo[itemId] || 0) > 0) {
            playerCargo[itemId]--;
            if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
            colony.storage[itemId] = (colony.storage[itemId] || 0) + 1;
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        }
    } else if (direction === 'TO_SHIP') {
        if ((colony.storage[itemId] || 0) > 0) {
            const itemData = typeof COMMODITIES !== 'undefined' ? COMMODITIES[itemId] : null;
            const weight = itemData && itemData.weight !== undefined ? itemData.weight : 1;
            
            if (typeof currentCargoLoad !== 'undefined' && typeof PLAYER_CARGO_CAPACITY !== 'undefined') {
                if (currentCargoLoad + weight > PLAYER_CARGO_CAPACITY) {
                    if (typeof showToast === 'function') showToast("CARGO HOLD FULL", "error");
                    return;
                }
            }

            colony.storage[itemId]--;
            if (colony.storage[itemId] <= 0) delete colony.storage[itemId];
            playerCargo[itemId] = (playerCargo[itemId] || 0) + 1;
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

// --- 5. THE SIMULATION MASTER TICK ---
GameBus.on('TICK_PROCESSED', (tick) => {
    if (tick.interrupt) return;

    if (typeof playerColonies !== 'undefined') {
        Object.values(playerColonies).forEach(colony => {
            if (colony.established) {
                if (typeof colony.lastTick === 'undefined') colony.lastTick = currentGameDate;

                if (currentGameDate - colony.lastTick >= 1.0) {
                    colony.lastTick = currentGameDate;
                    const policy = colony.policy || 'BALANCED';

                    // 1. DYNAMIC STAT CALCULATION
                    const numHabs = colony.buildings['HAB_BLOCK'] || 0;
                    const numArcos = colony.buildings['ARCOLOGY_SPIRE'] || 0;
                    const numBios = colony.buildings['BIOSPHERE_RESERVE'] || 0;
                    const maxPop = (numHabs * 500) + (numArcos * 5000) + (numBios * 50000); 

                    const numAtmos = colony.buildings['ATMOS_PROCESSOR'] || 0;
                    const numFarms = colony.buildings['HYDRO_FARM'] || 0;
                    const numOrchards = colony.buildings['HYDROPONIC_ORCHARDS'] || 0;
                    const numAlgae = colony.buildings['ALGAE_VATS'] || 0;
                    const numMycelium = colony.buildings['MYCELIUM_CAVES'] || 0;
                    const numVats = colony.buildings['PROTEIN_VATS'] || 0;
                    const numWeavers = colony.buildings['SYNTHETIC_WEAVERS'] || 0;
                    const numXenoDomes = colony.buildings['XENOBOTANY_DOME'] || 0;
                    const numGeneClinics = colony.buildings['GENE_CLINIC'] || 0;
                    
                    const numWindTraps = colony.buildings['WIND_TRAPS'] || 0;
                    const numMilitia = colony.buildings['MILITIA_TENT'] || 0;
                    const numDustWalls = colony.buildings['DUST_WALLS'] || 0;
                    const numDef = colony.buildings['DEFENSE_BATTERY'] || 0;
                    const numLawHQ = colony.buildings['LAW_ENFORCEMENT_HQ'] || 0;
                    const numCannons = colony.buildings['PLANETARY_ION_CANNON'] || 0;
                    
                    const numClinics = colony.buildings['MEDICAL_CLINIC'] || 0;
                    const numClinicTents = colony.buildings['CLINIC_TENT'] || 0;
                    const numCantinas = colony.buildings['OUTPOST_CANTINA'] || 0;
                    const numNexus = colony.buildings['ENTERTAINMENT_NEXUS'] || 0;
                    const numShields = colony.buildings['ORBITAL_SHIELD'] || 0;
                    const numBounties = colony.buildings['BOUNTY_OFFICE'] || 0;
                    
                    const numArmories = colony.buildings['ADVANCED_ARMORY'] || 0;
                    const numVehicleBays = colony.buildings['HEAVY_VEHICLE_BAY'] || 0;

                    const numScrapYards = colony.buildings['SCRAP_YARD'] || 0;
                    const numOreCrushers = colony.buildings['ORE_CRUSHER'] || 0;
                    const numScavengers = colony.buildings['SCAVENGER_GUILD'] || 0;
                    const numProspectors = colony.buildings['PROSPECTOR_CAMP'] || 0;
                    const numBazaars = colony.buildings['LOCAL_BAZAAR'] || 0;
                    const numCommRelays = colony.buildings['COMM_RELAY'] || 0;
                    const numListeningPosts = colony.buildings['LISTENING_POST'] || 0;
                    
                    const numClones = colony.buildings['CLONING_FACILITY'] || 0;
                    const numNodes = colony.buildings['BLACK_MARKET_NODE'] || 0;
                    const numSmugglers = colony.buildings['SMUGGLERS_DEN'] || 0;
                    const numStimLabs = colony.buildings['STIM_LAB'] || 0;
                    
                    const numCustoms = colony.buildings['CUSTOMS_OFFICE'] || 0;
                    const numAIs = colony.buildings['AI_OVERLORD_CORE'] || 0;
                    const numMonuments = colony.buildings['ASTRAL_MONUMENT'] || 0;
                    const numColliders = colony.buildings['DARK_MATTER_COLLIDER'] || 0;
                    
                    const prodMultiplier = (numAIs > 0) ? 2.0 : 1.0;

                    // Update Defense calculation
                    colony.defense = (numMilitia * 15) + (numDustWalls * 10) + (numDef * 50) + (numLawHQ * 30) + (numShields * 300) + (numCannons * 500) + (numBounties * 20);
                    colony.defense -= (numNodes * 50) + (numSmugglers * 20);
                    colony.defense += (numCustoms * 20); 
                    
                    if (policy === 'AUTHORITARIAN') colony.defense += 100;
                    if (policy === 'SURVIVALIST') colony.defense += 10;
                    if (policy === 'EXPANSIONIST') colony.defense -= 20;
                    if (colony.defense < 0) colony.defense = 0;
                    
                    // Update Morale calculation
                    if (policy === 'AUTHORITARIAN') {
                        colony.morale = 40; // Clamped by an iron fist
                    } else {
                        let moraleRegen = (numAtmos * 3) + (numClinicTents * 1) + (numClinics * 1) + (numCantinas * 3) + (numNexus * 5) + (numDustWalls * 1) + (numLawHQ * 2) + (numShields * 5) + (numArcos * 2) + (numBios * 10) + (numCommRelays * 1) + (numGeneClinics * 5) + (numMonuments * 20);
                        if (policy === 'UTOPIAN') moraleRegen += 10;
                        
                        let moralePenalty = 0;
                        if (numClones > 0) moralePenalty += 5; 
                        if (numAlgae > 0) moralePenalty += numAlgae; 
                        if (numStimLabs > 0) moralePenalty += numStimLabs;
                        
                        let crimeBuildings = numNodes + numSmugglers;
                        if (crimeBuildings > 0 && numCustoms === 0 && numLawHQ === 0) moralePenalty += (crimeBuildings * 2); 
                        if (numAIs > 0) moralePenalty += 10; 
                        
                        colony.morale = Math.min(100, colony.morale + moraleRegen - moralePenalty);
                    }

                    // 2. CONSTRUCTION PROGRESS
                    if (colony.activeConstruction) {
                        colony.activeConstruction.progress += 1;
                        if (colony.activeConstruction.progress >= colony.activeConstruction.total) {
                            const bId = colony.activeConstruction.id;
                            colony.buildings[bId] = (colony.buildings[bId] || 0) + 1;
                            logMessage(`<span style='color:var(--success)'>[ ENGINEERING ] ${colony.name} has finished constructing a ${COLONY_BUILDINGS[bId].name}!</span>`);
                            if (typeof soundManager !== 'undefined') soundManager.playGain();
                            colony.activeConstruction = null;
                        }
                    }

                    // 3. SUPPLY CHAINS & WEAPONS MANUFACTURING
                    // Water Extraction
                    if (colony.buildings['WATER_EXTRACTOR']) colony.storage['WATER'] = (colony.storage['WATER'] || 0) + (10 * colony.buildings['WATER_EXTRACTOR'] * prodMultiplier);
                    if (numWindTraps > 0) colony.storage['WATER'] = (colony.storage['WATER'] || 0) + (5 * numWindTraps * prodMultiplier);
                    
                    let foodGenerated = 0;
                    foodGenerated += (numAlgae * 3 * prodMultiplier); // Free, bad food
                    foodGenerated += (numMycelium * 2 * prodMultiplier); // Cheap early food
                    foodGenerated += (numXenoDomes * 10 * prodMultiplier); // Excellent, water-free food
                    
                    // Hydro Farms (CONSUMES WATER)
                    if (numFarms > 0) {
                        const waterNeeded = numFarms * 2;
                        if ((colony.storage['WATER'] || 0) >= waterNeeded) {
                            colony.storage['WATER'] -= waterNeeded;
                            foodGenerated += (numFarms * 5 * prodMultiplier);
                        } else {
                            foodGenerated += Math.floor(numFarms * 2 * prodMultiplier); 
                            colony.storage['WATER'] = 0;
                        }
                    }

                    // Hydroponic Orchards (CONSUMES WATER)
                    if (numOrchards > 0) {
                        const waterNeeded = numOrchards * 4;
                        if ((colony.storage['WATER'] || 0) >= waterNeeded) {
                            colony.storage['WATER'] -= waterNeeded;
                            foodGenerated += (numOrchards * 12 * prodMultiplier);
                        } else {
                            foodGenerated += Math.floor(numOrchards * 4 * prodMultiplier); 
                            colony.storage['WATER'] = 0;
                        }
                    }

                    // Protein Vats (CONSUMES LOTS OF WATER)
                    if (numVats > 0) {
                        const waterNeeded = numVats * 5;
                        if ((colony.storage['WATER'] || 0) >= waterNeeded) {
                            colony.storage['WATER'] -= waterNeeded;
                            foodGenerated += (numVats * 15 * prodMultiplier);
                        } else {
                            foodGenerated += Math.floor(numVats * 5 * prodMultiplier); 
                            colony.storage['WATER'] = 0;
                        }
                    }
                    colony.storage['FOOD_SUPPLIES'] = (colony.storage['FOOD_SUPPLIES'] || 0) + foodGenerated;

                    // Early Game Resource Generation
                    if (numScrapYards > 0) colony.storage['REFINED_ALLOYS'] = (colony.storage['REFINED_ALLOYS'] || 0) + (1 * numScrapYards * prodMultiplier);
                    if (numOreCrushers > 0) colony.storage['MINERALS'] = (colony.storage['MINERALS'] || 0) + (5 * numOreCrushers * prodMultiplier);

                    // Scavengers
                    if (numScavengers > 0) {
                        if (Math.random() < 0.5) colony.storage['MINERALS'] = (colony.storage['MINERALS'] || 0) + (Math.floor(Math.random() * 3) + 1) * numScavengers;
                        if (Math.random() < 0.1) colony.storage['TECH_PARTS'] = (colony.storage['TECH_PARTS'] || 0) + numScavengers;
                    }

                    // Smelting
                    if (colony.buildings['SMELTING_FACILITY']) colony.storage['REFINED_ALLOYS'] = (colony.storage['REFINED_ALLOYS'] || 0) + (3 * colony.buildings['SMELTING_FACILITY'] * prodMultiplier);
                    
                    // Stellar Forge
                    if (colony.buildings['STELLAR_FORGE']) {
                        colony.storage['REFINED_ALLOYS'] = (colony.storage['REFINED_ALLOYS'] || 0) + (20 * colony.buildings['STELLAR_FORGE'] * prodMultiplier);
                        colony.storage['TECH_PARTS'] = (colony.storage['TECH_PARTS'] || 0) + (10 * colony.buildings['STELLAR_FORGE'] * prodMultiplier);
                    }

                    // Dark Matter Collider
                    if (numColliders > 0) {
                        colony.storage['VOID_CRYSTALS'] = (colony.storage['VOID_CRYSTALS'] || 0) + numColliders;
                    }

                    // Auto Factory
                    const numFactories = colony.buildings['AUTOMATED_FACTORY'] || 0;
                    if (numFactories > 0) {
                        const alloyNeeded = numFactories * 2;
                        if ((colony.storage['REFINED_ALLOYS'] || 0) >= alloyNeeded) {
                            colony.storage['REFINED_ALLOYS'] -= alloyNeeded;
                            colony.storage['TECH_PARTS'] = (colony.storage['TECH_PARTS'] || 0) + (numFactories * 2 * prodMultiplier);
                        }
                    }

                    // Tech Refinery
                    const numTechRefs = colony.buildings['TECH_REFINERY'] || 0;
                    if (numTechRefs > 0) {
                        const mineralNeeded = numTechRefs * 5;
                        if ((colony.storage['MINERALS'] || 0) >= mineralNeeded) {
                            colony.storage['MINERALS'] -= mineralNeeded;
                            colony.storage['TECH_PARTS'] = (colony.storage['TECH_PARTS'] || 0) + (numTechRefs * 2 * prodMultiplier);
                        }
                    }

                    // Synthetic Weavers
                    if (numWeavers > 0) {
                        const minNeeded = numWeavers * 5;
                        const watNeeded = numWeavers * 3;
                        if ((colony.storage['MINERALS'] || 0) >= minNeeded && (colony.storage['WATER'] || 0) >= watNeeded) {
                            colony.storage['MINERALS'] -= minNeeded;
                            colony.storage['WATER'] -= watNeeded;
                            colony.storage['LUXURY_GOODS'] = (colony.storage['LUXURY_GOODS'] || 0) + (numWeavers * 2 * prodMultiplier);
                        }
                    }

                    // Stim Labs (Illegal Manufacturing)
                    if (numStimLabs > 0) {
                        const medNeeded = numStimLabs * 1;
                        const minNeeded = numStimLabs * 2;
                        if ((colony.storage['MEDICAL_SUPPLIES'] || 0) >= medNeeded && (colony.storage['MINERALS'] || 0) >= minNeeded) {
                            colony.storage['MEDICAL_SUPPLIES'] -= medNeeded;
                            colony.storage['MINERALS'] -= minNeeded;
                            colony.storage['PROHIBITED_STIMS'] = (colony.storage['PROHIBITED_STIMS'] || 0) + (numStimLabs * 2);
                        }
                    }

                    // MILITARY MANUFACTURING
                    if (numArmories > 0) {
                        const alloyNeeded = numArmories * 5;
                        const foodNeeded = numArmories * 5;
                        if ((colony.storage['REFINED_ALLOYS'] || 0) >= alloyNeeded && (colony.storage['FOOD_SUPPLIES'] || 0) >= foodNeeded) {
                            colony.storage['REFINED_ALLOYS'] -= alloyNeeded;
                            colony.storage['FOOD_SUPPLIES'] -= foodNeeded;
                            colony.storage['MERCENARY_PLATOON'] = (colony.storage['MERCENARY_PLATOON'] || 0) + numArmories;
                        }
                    }

                    if (numVehicleBays > 0) {
                        const alloyNeeded = numVehicleBays * 15;
                        const techNeeded = numVehicleBays * 5;
                        if ((colony.storage['REFINED_ALLOYS'] || 0) >= alloyNeeded && (colony.storage['TECH_PARTS'] || 0) >= techNeeded) {
                            colony.storage['REFINED_ALLOYS'] -= alloyNeeded;
                            colony.storage['TECH_PARTS'] -= techNeeded;
                            colony.storage['ASSAULT_MECH'] = (colony.storage['ASSAULT_MECH'] || 0) + numVehicleBays;
                        }
                    }

                    // Medical Generation
                    if (numClinicTents > 0) colony.storage['MEDICAL_SUPPLIES'] = (colony.storage['MEDICAL_SUPPLIES'] || 0) + (1 * numClinicTents);
                    if (numClinics > 0) colony.storage['MEDICAL_SUPPLIES'] = (colony.storage['MEDICAL_SUPPLIES'] || 0) + (2 * numClinics);
                    if (numXenoDomes > 0) colony.storage['MEDICAL_SUPPLIES'] = (colony.storage['MEDICAL_SUPPLIES'] || 0) + (5 * numXenoDomes);
                    if (numGeneClinics > 0) colony.storage['MEDICAL_SUPPLIES'] = (colony.storage['MEDICAL_SUPPLIES'] || 0) + (10 * numGeneClinics);

                    // 4. DEMOGRAPHICS (The slow sim engine)
                    let foodConsumption = Math.ceil(colony.population / 100); 
                    
                    if (numGeneClinics > 0) foodConsumption = Math.ceil(foodConsumption * 0.8);
                    if (policy === 'EXPANSIONIST') foodConsumption = Math.ceil(foodConsumption * 1.5);
                    if (policy === 'SURVIVALIST') foodConsumption = Math.floor(foodConsumption * 0.8);
                    
                    if ((colony.storage['FOOD_SUPPLIES'] || 0) >= foodConsumption) {
                        colony.storage['FOOD_SUPPLIES'] -= foodConsumption;
                        
                        // SLOW BURN GROWTH
                        if (colony.morale >= 50 && colony.population < maxPop) {
                            let growthTick = 1; 
                            if (colony.storage['FOOD_SUPPLIES'] > foodConsumption * 10) growthTick += 1;
                            if (colony.morale > 90) growthTick += 2;
                            if (numClones > 0) growthTick *= 4; 
                            if (policy === 'UTOPIAN') growthTick += 3;
                            if (policy === 'EXPANSIONIST') growthTick *= 2;
                            if (policy === 'AUTHORITARIAN') growthTick = Math.floor(growthTick / 2); 
                            if (policy === 'SURVIVALIST') growthTick = Math.max(0, growthTick - 2); 

                            colony.growthProgress += growthTick;

                            if (colony.growthProgress >= 100) {
                                colony.growthProgress = 0;
                                const phaseIndex = COLONY_PHASES.indexOf(colony.phase);
                                const newCitizens = Math.floor(Math.random() * 50 * (phaseIndex + 1)) + 10; 
                                colony.population += newCitizens;
                                if (colony.population > maxPop) colony.population = maxPop;
                                
                                // Demographic drift
                                if (policy === 'INDUSTRY' && colony.demographics["Synthetic"] < 40) colony.demographics["Synthetic"] += 1;
                                if (policy === 'WEALTH' && colony.demographics["K'tharr"] < 30) colony.demographics["K'tharr"] += 1;
                                if (numAIs > 0 && colony.demographics["Synthetic"] < 90) colony.demographics["Synthetic"] += 2; 
                            }
                        }
                    } else {
                        colony.storage['FOOD_SUPPLIES'] = 0;
                        colony.morale -= 15;
                        colony.growthProgress = 0; 
                        colony.population -= Math.ceil(colony.population * 0.10); 
                        if (colony.population < 0) colony.population = 0;
                        
                        if (Math.random() < 0.2) logMessage(`<span style='color:var(--danger)'>[ ALERT ] Famine at ${colony.name}! The dead lie in the streets. Deliver food immediately.</span>`);
                    }

                    // 5. ECONOMY & TAXES
                    let taxRate = 0.5; 
                    if (policy === 'WEALTH') taxRate = 1.0; 
                    if (policy === 'RESEARCH') taxRate = 0.25; 
                    if (policy === 'UTOPIAN') taxRate = 0.0; 
                    if (policy === 'AUTHORITARIAN') taxRate = 0.7; 
                    
                    if (colony.buildings['COMMERCE_HUB']) taxRate *= 1.5; 
                    if (colony.buildings['ORBITAL_BEACON']) taxRate *= 1.3;
                    if (colony.buildings['SPACE_ELEVATOR']) taxRate *= 2.0; 
                    if (numBazaars > 0) taxRate *= 1.1;
                    if (numCustoms > 0) taxRate *= 1.2; 
                    
                    let moraleMult = colony.morale / 100;
                    if (policy === 'WEALTH') colony.morale = Math.max(0, colony.morale - 5); 
                    if (policy === 'AUTHORITARIAN') moraleMult = 1.0; 
                    
                    colony.treasury += Math.floor(colony.population * taxRate * moraleMult);
                    
                    // Additional Credit Sources
                    if (numBazaars > 0) colony.treasury += (50 * numBazaars);
                    if (numBounties > 0) colony.treasury += (200 * numBounties);
                    if (numMonuments > 0) colony.treasury += (10000 * numMonuments);

                    // Syndicate Laundering
                    if (numNodes > 0) {
                        let syndicateCredits = 1000 * numNodes;
                        if (numCustoms > 0) syndicateCredits *= 0.5; 
                        colony.treasury += syndicateCredits;
                    }
                    if (numSmugglers > 0) {
                        let smugglerCredits = 500 * numSmugglers;
                        if (numCustoms > 0) smugglerCredits *= 0.5;
                        colony.treasury += smugglerCredits;
                    }

                    // Orbital Shipyard passive income
                    if (colony.buildings['ORBITAL_SHIPYARD']) {
                        colony.treasury += (5000 * colony.buildings['ORBITAL_SHIPYARD']);
                    }

                    // 6. RAW MINING
                    const biomeDef = typeof PLANET_BIOMES !== 'undefined' ? PLANET_BIOMES[colony.biome] : null;
                    if (biomeDef && biomeDef.resources && biomeDef.resources.length > 0) {
                        const res = biomeDef.resources[Math.floor(Math.random() * biomeDef.resources.length)];
                        
                        let amount = Math.floor(Math.random() * 2) + 1;
                        amount += Math.floor(colony.population / 500); 
                        if (numProspectors > 0) amount = Math.floor(amount * 1.2); 
                        if (colony.buildings['DEEP_CORE_RIG']) amount *= 2;
                        if (policy === 'INDUSTRY') amount *= 2; 
                        amount *= prodMultiplier; 
                        
                        colony.storage[res] = (colony.storage[res] || 0) + amount;
                    }

                    // Global Research Lab Bonus
                    if (colony.buildings['RESEARCH_LABORATORY'] || numCommRelays > 0 || numListeningPosts > 0 || numColliders > 0 || numProspectors > 0) {
                        let xpYield = 0;
                        if (colony.buildings['RESEARCH_LABORATORY']) xpYield += (50 * colony.buildings['RESEARCH_LABORATORY']);
                        if (numCommRelays > 0) xpYield += (5 * numCommRelays);
                        if (numListeningPosts > 0) xpYield += (10 * numListeningPosts);
                        if (numProspectors > 0) xpYield += (2 * numProspectors);
                        if (numColliders > 0) xpYield += (200 * numColliders);

                        if (policy === 'RESEARCH') xpYield *= 2; 
                        
                        if (typeof playerXP !== 'undefined') playerXP += xpYield;
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                    }

                    // 7. INTERSTELLAR EXCHANGE (Auto-Liquidation)
                    if (colony.buildings['INTERSTELLAR_EXCHANGE']) {
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
                }
            }
        });
    }
});
