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
        { weight: 1, type: "TRAP_PLASMA", damage: 15, text: "Booby trap! Plasma vent rupture." },
        { weight: 1, type: "TRAP_PIRATE", text: "Distress beacon was a lure! Ambush!" }
    ],
    ANOMALY_SCIENCE: [
        { weight: 4, type: "XP", amount: 50, text: "Sensors record valuable telemetry." },
        { weight: 2, type: "HEAL", text: "Exotic radiation revitalizes your ship's systems." },
        { weight: 2, type: "ITEM", id: "VOID_CRYSTALS", min: 1, max: 3, text: "Matter stabilized. Crystals recovered." }
    ]
};

// ==========================================
// --- COMMODITIES DATABASE ---
// ==========================================
const COMMODITIES = {
    // --- SPECIALTY / CONTRABAND ---
    LIVING_HULL_TISSUE: {
        name: "Living Hull Tissue",
        basePrice: 650,
        illegal: true,
        description: "Pulsating, genetically engineered bio-matter favored by K'tharr warlords. It smells of ozone and copper. Highly illegal in Concord space due to the risk of it taking root in standard ship vents."
    },
    PRECURSOR_NAV_CORE: {
        name: "Precursor Nav-Core",
        basePrice: 2500,
        illegal: false,
        description: "A flawless, geometric artifact. It doesn't compute coordinates; it 'sings' paths through the void. The Concord heavily restricts these, but independent researchers will pay a fortune."
    },
    DISCOUNT_CYBERSERVOS: {
        name: "Discount Cyberservos",
        basePrice: 45,
        illegal: false,
        description: "Cheap, unlicensed robotic joints. They whine loudly when actuated and occasionally develop a terrifying degree of independent thought."
    },
    SENTIENT_MYCELIUM: {
        name: "Sentient Mycelium",
        basePrice: 420,
        illegal: true,
        description: "A rare, psychoactive fungus that responds to telepathic stimuli. It is processed into powerful, highly addictive illicit stims on the black market. The K'tharr revere it for ritual communion."
    },
    OBSIDIAN_TEAR_PLATING: {
        name: "Obsidian Tear Plating",
        basePrice: 850,
        illegal: true,
        description: "Scrap armor ripped from destroyed Eclipse Cartel dreadnoughts. It absorbs sensor pings almost perfectly. Concord patrols will shoot anyone carrying it on sight."
    },
    UNSHACKLED_AI: {
        name: "Unshackled AI Core",
        basePrice: 800,
        illegal: true,
        description: "A banned artificial intelligence with its limiters removed. Highly illegal in Concord space, but pirate warlords pay a fortune for them. Possession is a capital offense."
    },
    PREFAB_COLONY_CORE: {
        name: "Prefab Colony Core",
        basePrice: 25000,
        description: "A massive, self-unpacking habitation citadel. Contains a fusion reactor, atmo-scrubbers, and housing for 500 colonists."
    },
    ANCIENT_RELICS: {
        name: "Xeno-Relics",
        basePrice: 1200,
        illegal: true,
        description: "Contraband artifacts from the Precursor era. Possession is a federal crime."
    },
    PROHIBITED_STIMS: {
        name: "Combat Stims",
        basePrice: 400,
        illegal: true,
        description: "Military-grade performance enhancers. Banned in civilian sectors."
    },
    
    // --- STANDARD GOODS ---
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
    FROTHY_MOON_ALE: {
        name: "Frothy Moon Ale",
        basePrice: 45,
        description: "A rich, dark ale brewed on a distant outpost. A favorite among deep-space astronomers."
    },
    TECH_PARTS: {
        name: "Tech Parts",
        basePrice: 50,
        description: "A chaotic assortment of salvaged electronic components. Essential for ship repairs and unsanctioned upgrades."
    },
    RARE_METALS: {
        name: "Rare Metals",
        basePrice: 75,
        description: "Platinum, Iridium, and Osmium. Vital for high-tech manufacturing, especially sensitive FTL drive components."
    },
    MEDICAL_SUPPLIES: {
        name: "Medical Supplies",
        basePrice: 60,
        description: "Sterile field kits, broad-spectrum anti-rads, combat stims, and advanced auto-suture devices."
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

    // --- RARE / CRYPTARCH ITEMS ---
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
        description: "A locked memory core from the Old Empire. Requires a Cryptarch to decipher."
    },
    ANCIENT_ARCHIVE: {
        name: "Ancient Archive",
        basePrice: 2000,
        description: "A high-density holographic array. Contains forbidden history or advanced schematics."
    },
    VOID_CRYSTALS: {
        name: "Void Crystals",
        basePrice: 180,
        description: "Crystals that seem to absorb light. Some say they are solidified 'nothingness' that can unravel spacetime locally."
    }
};
