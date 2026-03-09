const PERKS_DATABASE = {
    // --- INDUSTRIAL ---
    DEEP_CORE_MINING: {
        id: "DEEP_CORE_MINING",
        name: "Deep Core Mining",
        description: "Asteroid mining yields +3 additional resources per attempt.",
        icon: "⛏️",
        category: "Industrial"
    },
    EFFICIENT_THRUSTERS: {
        id: "EFFICIENT_THRUSTERS",
        name: "Fusion Injectors",
        description: "Movement fuel cost reduced by 20%.",
        icon: "🚀",
        category: "Industrial"
    },
    
    // --- COMBAT ---
    WEAPON_OVERCLOCK: {
        id: "WEAPON_OVERCLOCK",
        name: "Weapon Overclock",
        description: "All ship weapons deal +15% damage.",
        icon: "⚔️",
        category: "Combat"
    },
    SHIELD_HARMONICS: {
        id: "SHIELD_HARMONICS",
        name: "Shield Harmonics",
        description: "Shields regenerate +50% faster outside of combat.",
        icon: "🛡️",
        category: "Combat"
    },
    
    // --- TRADE & SOCIAL ---
    SILVER_TONGUE: {
        id: "SILVER_TONGUE",
        name: "Silver Tongue",
        description: "Buy items for 10% less and sell for 10% more.",
        icon: "💰",
        category: "Trade"
    },
    SCAVENGER_PROTOCOL: {
        id: "SCAVENGER_PROTOCOL",
        name: "Scavenger Protocol",
        description: "Derelicts and Anomalies yield double credits/loot.",
        icon: "📦",
        category: "Trade"
    },
    SMOOTH_TALKER: {
        id: "SMOOTH_TALKER",
        name: "Smooth Talker",
        description: "You know exactly what to say to Concord Customs. If caught with contraband, your credit fine is reduced by 50%.",
        icon: "🗣️",
        category: "Social"
    },

    // --- EXPLORATION & SCIENCE ---
    XENO_BIOLOGIST: {
        id: "XENO_BIOLOGIST",
        name: "Xeno-Biologist",
        description: "Planetary scans and surveys award double XP.",
        icon: "🧬",
        category: "Science"
    },
    LONG_RANGE_SENSORS: {
        id: "LONG_RANGE_SENSORS",
        name: "Telemetry Array",
        description: "Mining/Scooping rarely consumes a turn (time passes slower).",
        icon: "📡",
        category: "Science"
    },
    CYBER_SLICER: {
        id: "CYBER_SLICER",
        name: "Cyber Slicer",
        description: "Instantly decrypt Encrypted Engrams in the field without needing a Cipher.",
        icon: "💻",
        category: "Exploration"
    },
    VOID_DIVER: {
        id: "VOID_DIVER",
        name: "Void Diver",
        description: "Your sensors are heavily modified for deep space. Pressing 'V' to Deep Scan a star has a 25% chance of revealing an Encrypted Engram (up from 10%).",
        icon: "🌌",
        category: "Exploration"
    },

    // --- SURVIVAL ---
    HEALTH_PHYSICIST: {
        id: "HEALTH_PHYSICIST",
        name: "Health Physicist",
        description: "Your background in radiological affairs allows you to perfectly calibrate your ship's shielding. You take zero hull damage when scooping plasma from highly radioactive O and B-class stars.",
        icon: "☢️",
        category: "Survival"
    },
    SCRAP_WELDER: {
        id: "SCRAP_WELDER",
        name: "Scrap Welder",
        description: "You've learned to efficiently patch your hull using raw ore. Successfully mining an asteroid instantly restores 5 Hull Integrity.",
        icon: "🔧",
        category: "Survival"
    }
};
