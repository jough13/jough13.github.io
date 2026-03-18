// ==========================================
// --- LOOT TABLES ---
// ==========================================

const LOOT_TABLES = {
    DERELICT_COMMON: [
        { weight: 5, type: "FLAVOR", text: "The vessel is stripped bare. Nothing but dust and ghosts." },
        { weight: 3, type: "ITEM", id: "TECH_PARTS", min: 5, max: 15, text: "You salvage a crate of components." },
        { weight: 2, type: "XP", amount: 30, text: "Ship logs downloaded." },
        { weight: 1, type: "CREDITS", min: 200, max: 800, text: "Found a concealed credit chit." }
    ],
    DERELICT_RARE: [
        { weight: 3, type: "ITEM", id: "ANCIENT_RELICS", min: 1, max: 1, text: "In the captain's safe... a Precursor relic!" },
        { weight: 2, type: "ITEM", id: "PROHIBITED_STIMS", min: 2, max: 5, text: "Smuggler's stash located." },
        { weight: 2, type: "ITEM", id: "PRECURSOR_NAV_CORE", min: 1, max: 1, text: "You extract a humming Precursor Nav-Core from the ship's computer!" },
        { weight: 2, type: "ITEM", id: "OBSIDIAN_TEAR_PLATING", min: 1, max: 3, text: "You salvage some ultra-dense Obsidian Tear Plating from the hull!" },
        { weight: 2, type: "ITEM", id: "ARTIFACT_SHARDS", min: 1, max: 4, text: "You found fragments of strange, humming glass." },
        { weight: 1, type: "ITEM", id: "PRECURSOR_DATACUBE", min: 1, max: 1, text: "Jackpot! An intact Precursor Datacube." },
        { weight: 1, type: "TRAP_PLASMA", damage: 15, text: "Booby trap! Plasma vent rupture." },
        { weight: 1, type: "TRAP_PIRATE", text: "Distress beacon was a lure! Ambush!" }
    ],
    ANOMALY_SCIENCE: [
        { weight: 4, type: "XP", amount: 50, text: "Sensors record valuable telemetry." },
        { weight: 2, type: "HEAL", text: "Exotic radiation revitalizes your ship's systems." },
        { weight: 2, type: "ITEM", id: "VOID_CRYSTALS", min: 1, max: 3, text: "Matter stabilized. Crystals recovered." },
        { weight: 1, type: "ITEM", id: "PHASE_SHIFTED_ALLOY", min: 1, max: 1, text: "An object falls out of hyperspace right in front of you!" }
    ]
};

// ==========================================
// --- COMMODITIES DATABASE ---
// ==========================================
const COMMODITIES = {
    
    // ==========================================
    // --- STANDARD GOODS & RAW MATERIALS ---
    // ==========================================
    FUEL_CELLS: {
        name: "Fuel Cells",
        basePrice: 10,
        description: "Concord-grade hyper-refined hydrogen. The lifeblood of interstellar travel, ensuring stable warp fields."
    },
    MINERALS: {
        name: "Minerals",
        basePrice: 25,
        description: "Bulk-processed common ores – iron, bauxite, silicates. The gritty backbone of galactic construction."
    },
    FOOD_SUPPLIES: {
        name: "Food Supplies",
        basePrice: 15,
        description: "A spectrum of sustenance: from bland nutrient paste to surprisingly palatable hydroponic greens."
    },
    TECH_PARTS: {
        name: "Tech Parts",
        basePrice: 50,
        description: "A chaotic assortment of salvaged electronic components. Essential for ship repairs and unsanctioned upgrades."
    },
    MEDICAL_SUPPLIES: {
        name: "Medical Supplies",
        basePrice: 60,
        description: "Sterile field kits, broad-spectrum anti-rads, combat stims, and advanced auto-suture devices."
    },
    RARE_METALS: {
        name: "Rare Metals",
        basePrice: 75,
        description: "Platinum, Iridium, and Osmium. Vital for high-tech manufacturing, especially sensitive FTL drive components."
    },
    GOLD: {
        name: "Gold Bullion",
        basePrice: 100,
        description: "Refined gold bullion. A stable store of wealth ensuring constant demand across all factions."
    },
    PLATINUM_ORE: {
        name: "Platinum Ore",
        basePrice: 60,
        description: "Raw, unrefined ore rich in platinum group metals. Essential for advanced catalysts and sensor components."
    },
    HYDROGEN_3: {
        name: "Hydrogen-3",
        basePrice: 300,
        description: "Also known as Tritium, a critical component in high-yield fusion reactors and experimental FTL drives."
    },
    QUANTUM_FLUID: {
        name: "Quantum Fluid",
        basePrice: 180,
        description: "Super-cooled conductive gel used in advanced computing and life-support cryo-pods."
    },

    // ==========================================
    // --- INDUSTRIAL & TECH EQUIPMENT ---
    // ==========================================
    MINING_DRONE: {
        name: "Survey Drone",
        basePrice: 150,
        description: "A single-use automated probe equipped with deep-core sensors. Deployed from orbit to analyze planetary composition."
    },
    PLANETARY_DATA: {
        name: "Planetary Data",
        basePrice: 400,
        description: "High-resolution geological and biological scans. Highly detailed and valuable to corporate surveyors and academic institutions."
    },
    NAVIGATION_CHARTS: { 
        name: "Nav-Charts", 
        basePrice: 35, 
        description: "Updated sector maps, safe warp trajectories, and hyperspace telemetry logs." 
    },
    CYBERNETIC_IMPLANTS: {
        name: "Cybernetics",
        basePrice: 125,
        description: "Neural interfaces, replacement limbs, and ocular enhancers. Essential for life on hazardous worlds."
    },
    ATMOSPHERIC_PROCESSORS: {
        name: "Atmo-Processors",
        basePrice: 85,
        description: "Heavy industrial machinery used to scrub CO2 from terraforming colonies. Bulky but vital."
    },
    DROID_SERVOS: {
        name: "Droid Servos",
        basePrice: 45,
        description: "High-torque motors used in everything from combat mechs to loading lifters."
    },
    DISCOUNT_CYBERSERVOS: {
        name: "Discount Cyberservos",
        basePrice: 45,
        illegal: false,
        description: "Cheap, unlicensed robotic joints. They whine loudly when actuated and occasionally develop a terrifying degree of independent thought."
    },
    PREFAB_COLONY_CORE: {
        name: "Prefab Colony Core",
        basePrice: 25000,
        description: "A massive, self-unpacking habitation citadel. Contains a fusion reactor, atmo-scrubbers, and housing for 500 colonists."
    },

    // --- COLONY BUILDER ITEMS ---
    
    COLONY_CHARTER: {
        name: "Official Settlement Charter",
        basePrice: 25000, 
        illegal: false,
        weight: 0, // Key Item - Doesn't take up cargo space!
        description: "A legally binding Concord document granting the bearer the right to claim and govern a single unpopulated celestial body."
    },
    HAB_MODULE: {
        name: "Prefabricated Hab-Module",
        basePrice: 5000,
        illegal: false,
        weight: 20, // Very heavy! Requires a good cargo hold.
        description: "A massive, folded structural unit that deploys into a fully shielded living quarters for 50 colonists."
    },
    ATMOS_PROCESSOR: {
        name: "Atmospheric Processor",
        basePrice: 12000,
        illegal: false,
        weight: 15,
        description: "Heavy terraforming equipment. Necessary for establishing colonies on toxic, irradiated, or barren worlds."
    },
    SETTLER_MANIFEST: {
        name: "Cryo-Sleeping Settlers",
        basePrice: 1000,
        illegal: false,
        weight: 5, // 1 unit = a pod of colonists
        description: "Brave (or desperate) souls in stasis, waiting to be awakened on a new frontier."
    },

    // ==========================================
    // --- CULTURE, LUXURY & FACTION ITEMS ---
    // ==========================================

    FROTHY_MOON_ALE: {
        name: "Frothy Moon Ale",
        basePrice: 45,
        description: "A rich, dark ale brewed on a distant outpost. A favorite among deep-space astronomers."
    },
    ANCIENT_WINE: { 
        name: "Ancient Wine", 
        basePrice: 250, 
        description: "A remarkably well-preserved vintage from pre-warp Earth. Highly prized by eccentric billionaires." 
    },
    GENETIC_SAMPLES: { 
        name: "Genetic Samples", 
        basePrice: 120, 
        description: "Vials of alien DNA used for bio-research. Kept in cryogenic stasis to prevent contamination." 
    },
    KTHARR_SPICES: { 
        name: "K'tharr Spices", 
        basePrice: 85, 
        description: "Incredibly hot, slightly hallucinogenic seasonings favored by saurian warlords." 
    },
    XENO_ANTIQUES: { 
        name: "Xeno-Antiques", 
        basePrice: 500, 
        description: "Rare cultural items from dead civilizations. They belong in a museum, but fetch a good price on the open market." 
    },

    // ==========================================
    // --- ILLEGAL / CONTRABAND (ECLIPSE NETWORK) ---
    // ==========================================

    PROHIBITED_STIMS: {
        name: "Combat Stims",
        basePrice: 400,
        illegal: true,
        description: "Military-grade performance enhancers. Highly addictive and strictly banned in civilian sectors."
    },
    STARDUST_EXOTICA: {
        name: "Stardust Exotica",
        basePrice: 650,
        illegal: true,
        description: "A finely milled powder derived from crushed Void Crystals. Creates powerful euphoric states but slowly crystallizes the user's lungs."
    },
    SENTIENT_MYCELIUM: {
        name: "Sentient Mycelium",
        basePrice: 420,
        illegal: true,
        description: "A rare, psychoactive fungus that responds to telepathic stimuli. It is processed into powerful illicit stims on the black market."
    },
    LIVING_HULL_TISSUE: {
        name: "Living Hull Tissue",
        basePrice: 650,
        illegal: true,
        description: "Pulsating bio-matter favored by K'tharr warlords. Highly illegal in Concord space due to the risk of it taking root in standard ship vents."
    },
    OBSIDIAN_TEAR_PLATING: {
        name: "Obsidian Tear Plating",
        basePrice: 850,
        illegal: true,
        description: "Scrap armor ripped from destroyed Cartel dreadnoughts. It absorbs sensor pings almost perfectly. Concord patrols will shoot carriers on sight."
    },
    UNSHACKLED_AI: {
        name: "Unshackled AI Core",
        basePrice: 800,
        illegal: true,
        description: "A banned artificial intelligence with its limiters removed. Pirate warlords pay a fortune for them. Possession is a capital offense."
    },
    FORBIDDEN_TEXTS: { 
        name: "Forbidden Texts", 
        basePrice: 300, 
        illegal: true, 
        description: "Data outlawed by the Concord Directorate. Usually involves unsanctioned AI research, dark history, or dangerous warp theory." 
    },
    STOLEN_CONCORD_MEDALS: {
        name: "Stolen Concord Medals",
        basePrice: 150,
        illegal: true,
        description: "Military commendations stripped from destroyed patrol ships. Fenced to impersonators and cartel bosses as trophies."
    },
    KTHARR_ANCESTRAL_BLADE: { 
        name: "Ancestral Blade", 
        basePrice: 1200, 
        illegal: true, 
        description: "A ceremonial K'tharr weapon forged from fallen stars. Stealing one is considered a holy act of war by the Hegemony." 
    },

    // ==========================================
    // --- PRECURSOR / CRYPTARCH / QUEST ITEMS ---
    // ==========================================

    ANCIENT_RELICS: {
        name: "Xeno-Relics",
        basePrice: 1200,
        illegal: true,
        description: "Contraband artifacts from the Precursor era. Possession is a federal crime."
    },
    ARTIFACT_SHARDS: { 
        name: "Artifact Shards", 
        basePrice: 200, 
        illegal: true, 
        description: "Broken pieces of Precursor tech. Highly sought after by collectors, cryptarchs, and weapons researchers." 
    },
    PHASE_SHIFTED_ALLOY: { 
        name: "Phase-Shifted Alloy", 
        basePrice: 1800, 
        illegal: true, 
        description: "Material that exists in multiple quantum states simultaneously. Used for highly illegal stealth technology." 
    },
    VOID_CRYSTALS: {
        name: "Void Crystals",
        basePrice: 180,
        description: "Crystals that seem to absorb light. Some say they are solidified 'nothingness' that can unravel spacetime locally."
    },
    WAYFINDER_CORE: { 
        name: "Wayfinder Core", 
        basePrice: 5000, 
        illegal: true, 
        description: "A legendary Precursor compass. It hums with an energy that makes Concord scanners go blind. The ultimate prize." 
    },
    PRECURSOR_NAV_CORE: {
        name: "Precursor Nav-Core",
        basePrice: 2500,
        illegal: false, // Legal loophole for academics
        description: "A flawless, geometric artifact. It doesn't compute coordinates; it 'sings' paths through the void."
    },
    PRECURSOR_STAR_MAP_FRAGMENT: { 
        name: "Star Map Fragment", 
        basePrice: 800, 
        description: "A shattered shard of holographic glass depicting long-dead hyperlanes and forgotten worlds." 
    },
    PRECURSOR_DATACUBE: { 
        name: "Precursor Datacube", 
        basePrice: 1500, 
        illegal: true, 
        description: "Intact memory storage from the Ancients. Cryptarchs drool over the secrets locked inside these." 
    },
    PRECURSOR_CIPHER: {
        name: "Precursor Cipher",
        basePrice: 150,
        description: "A single-use quantum decryption key. Crucial for cracking Encrypted Engrams in the field without needing to pay a Cryptarch."
    },
    ENCRYPTED_ENGRAM: {
        name: "Encrypted Engram",
        basePrice: 550,
        description: "A mysterious, polyhedral data-matrix glowing with a faint purple light. Cryptarchs pay handsomely to decrypt the tech inside."
    },
    ENCRYPTED_DATA: {
        name: "Encrypted Data Cache",
        basePrice: 500,
        description: "A locked memory core from the Old Empire. Requires a Cryptarch or a Cipher to decipher."
    },
    ANCIENT_ARCHIVE: {
        name: "Ancient Archive",
        basePrice: 2000,
        description: "A high-density holographic array. Contains forbidden history, advanced schematics, and lost truths."
    },
    
    // 🔮 FUTURE EXPANSION: GROUND FORCES (v1.1)
    // LLM NOTE: These should be purchasable at CONCORD or ECLIPSE mercenary dens.
    // When bought, they should add to `GameState.ship.forces.marines` rather than taking up standard cargo.

    MERCENARY_PLATOON: {
        name: "Mercenary Platoon",
        basePrice: 5000,
        isTroop: true,
        troopCount: 10, // Buying 1 unit grants 10 marines
        description: "A squad of hardened, disposable freelancers equipped with standard plasma rifles. Ready for immediate deployment."
    },
    ASSAULT_MECH: {
        name: "Goliath Assault Mech",
        basePrice: 15000,
        isTroop: true,
        isVehicle: true,
        description: "A massive, bipedal walking tank. Provides heavy covering fire and drastically reduces marine casualties during ground raids."
    }
};
