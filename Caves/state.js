// --- START OF FILE state.js ---

// ============================================================================
// GLOBAL CONFIGURATION CONSTANTS
// ============================================================================
window.MAX_INVENTORY_SLOTS = 9;

// ============================================================================
// GLOBAL VARIABLES & SYSTEM REFERENCES
// ============================================================================

// --- Networking & Authentication ---
let player_id;
let playerRef;
let onlinePlayerRef;
let otherPlayers = {};

// --- Firebase Listeners (For Cleanup) ---
let unsubscribePlayerListener;
let worldStateListeners = {};
let sharedEnemiesListener = null;
let chatListener = null;
let connectedListener = null;

// --- Engine Optimizations & Locks ---
let isProcessingMove = false; 
let lastPlayerChunkId = null; // Tracks the last chunk the player was in for auto-saving
let lastAiExecution = 0;
let saveTimeout = null;       // Tracks the pending save timer
let areGlobalListenersInitialized = false;

// PERFORMANCE WIN: Officially declared timers to prevent polluting the Window object
let chatRenderTimer = null;   // Batches DOM insertions for global chat
let lastLocalAIAttempt = 0;   // Prevents the client from hammering the AI Firebase transaction
let lastSortAudio = 0;        // Throttles the auto-sort clicking sound

// --- Caches & Data Buffers ---
let cachedThemeColors = {};
const processingSpawnTiles = new Set();
let pendingSpawns = new Set();     // Track enemies currently being spawned so they don't flicker
let pendingSpawnData = {};         // Buffer for network sync
let activeShopInventory = [];      // Currently viewed merchant inventory
const wokenEnemyTiles = new Set(); // Global set to track processed tiles this session


// ============================================================================
// MASTER GAME STATE (THE "SINGLE SOURCE OF TRUTH")
// ============================================================================
// PERFORMANCE WIN: Explicitly defining ALL properties here ensures the V8 Javascript Engine
// creates a single, highly-optimized "hidden class" memory shape for the game state.
// This prevents severe micro-stutters and memory fragmentation that occur when 
// properties are dynamically added or deleted on the fly!

const gameState = {
    // --- System & Engine State ---
    saveVersion: "0.2.6",     // Useful for future DB migration scripts
    initialEnemiesLoaded: false,
    mapDirty: true,           // Flag to force canvas redraws
    
    // JUICE WIN: Directional Screen Shake State
    screenShake: 0,           // Legacy scalar (kept for backwards compatibility)
    cameraShake: {
        intensity: 0,
        dx: 0,                // Directional X knockback
        dy: 0,                // Directional Y knockback
        decay: 0.85           // How fast the shake settles
    },

    inventoryMode: false,
    isDroppingItem: false,
    isAiming: false,
    isAimingRanged: false,    
    abilityToAim: null,
    currentCraftingMode: 'workbench',
    godMode: false,           // Toggled via /god command
    lastStartX: null,         // Viewport caching (renderer.js)
    lastStartY: null,         // Viewport caching (renderer.js)
    visibleAnimatedTiles: [], // Highly optimized rendering array

    // PERFORMANCE WIN: UI Render Batching Flags
    // Allows the engine to batch DOM updates at the end of the frame instead of shotgunning them
    renderFlags: {
        stats: false,
        inventory: false,
        equipment: false,
        hotbar: false,
        minimap: false
    },

    // --- Player State ---
    player: {
        // Identity & Core Profile
        name: "",
        character: '@',
        color: 'blue',
        race: null,
        gender: null,
        background: null,     // Starting class
        className: null,      // Evolved class name
        classEvolved: false,
        
        // FLAVOR WIN: Titles System
        titles: [],           // Earned titles (e.g., "The Kingslayer", "Master Angler")
        activeTitle: null,    // Currently displayed title
        
        // Positioning & Movement
        x: 0,
        y: 0,
        visualX: 0,           // Camera smoothing X
        visualY: 0,           // Camera smoothing Y
        facing: 'right',      // Player facing direction for rendering
        respawnPoint: { x: 0, y: 0 }, // Custom bed/waystone respawns
        
        // EXPANSION HOOKS: Mounts & Vehicles
        isBoating: false,     // Canoe state
        isSailing: false,     // Deep sea ship state
        isMounted: false,     // Land mount state (Future expansion)
        mountName: null,      // Flavor text for current mount
        
        // Multiplayer UI
        chatBubble: null,     // Floating text above head
        chatTimer: 0,
        partyId: null,        // For upcoming party system
        tradeRequests: [],    // Pending player trades
        
        // Progression & Currency
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        statPoints: 0,
        talentPoints: 0,
        coins: 0,

        // Core Vitals
        health: 10,
        maxHealth: 10,
        mana: 10,
        maxMana: 10,
        stamina: 10,
        maxStamina: 10,
        psyche: 10,
        maxPsyche: 10,

        bonusMaxHealth: 0,
        bonusMaxMana: 0,
        bonusMaxStamina: 0,
        bonusMaxPsyche: 0,

        // Survival Mechanics
        hunger: 50, 
        maxHunger: 100,
        thirst: 50,
        maxThirst: 100,

        // Base Attributes
        strength: 1,
        wits: 1,
        luck: 1,
        constitution: 1,
        dexterity: 1,
        charisma: 1,
        willpower: 1,
        perception: 1,
        endurance: 1,
        intuition: 1,

        // Modifiers & Status Effects
        lastCombatTime: 0,    // Out-of-combat regeneration timer
        strengthBonus: 0,
        strengthBonusTurns: 0,
        witsBonus: 0,
        witsBonusTurns: 0,
        defenseBonus: 0,
        defenseBonusTurns: 0,
        shieldValue: 0,
        shieldTurns: 0,
        thornsValue: 0,
        thornsTurns: 0,
        frostbiteTurns: 0,
        poisonTurns: 0,
        burnTurns: 0,         // Fire DoT tracking
        rootTurns: 0,
        madnessTurns: 0,      // Caused by Eldritch/Void enemies
        stunTurns: 0,         // Prevents movement
        candlelightTurns: 0,
        stealthTurns: 0,
        
        // Environment Protection
        fireResistTurns: 0,
        waterBreathingTurns: 0,
        weatherState: 'calm',
        weatherIntensity: 0,
        weatherDuration: 0,

        // Storage & Items
        inventory: [],
        bank: [],             // Stash items
        equipment: {
            weapon: null,
            armor: null,
            offhand: null,
            accessory: null,
            ammo: null
        },
        hotbar: [null, null, null, null, null],

        // Skills & Magic
        spellbook: {},
        skillbook: {},
        talents: [],
        cooldowns: {},

        // Systems Tracking
        campsiteUpgrades: [], 
        quests: {},
        relicQuestStage: 0,    // Tracks the Historian's main quest line
        shadowQuestStage: 0,   // Tracks the Inquisitor's quest line
        arenaWave: 0,          // Tracks Colosseum survival wave
        killCounts: {},
        completedLoreSets: [], // Tracks finished codex pages
        obeliskProgress: [],   // Tracks Ancient Key puzzle
        cartographerProgress: 0, // Maps submitted for reward
        
        // Professions & Gathering
        craftingLevel: 1, 
        craftingXp: 0, 
        craftingXpToNext: 50,
        fishingLevel: 1,
        fishingXp: 0,
        fishingRecords: {},    // Best catches weight
        farmingLevel: 1,       // EXPANSION HOOK: Agriculture
        farmingXp: 0,
        farmingXpToNext: 50,

        // Map & Exploration Data
        unlockedWaypoints: [], // Fast travel nodes { x, y, name }
        discoveredPOIs: [],    // Landmarks for the minimap
        customPins: [],        // Player placed map pins {x, y}
        companion: null,       // Tamed beasts / Mercenaries
        tutorialProgress: 0,   // Onboarding system tracking
        
        // EXPANDABILITY WIN: Expanded Lifetime Metrics
        metrics: {
            totalKills: 0,
            bossesDefeated: 0,
            totalDeaths: 0,
            stepsTaken: 0,
            itemsCrafted: 0,
            potionsBrewed: 0,
            goldEarned: 0,
            fishCaught: 0,
            dungeonsCleared: 0,
            secretsFound: 0,
            spellsCast: 0,
            timesRested: 0,       // New
            cropsHarvested: 0,    // New (Agriculture Expansion)
            leylinesUsed: 0       // New
        }
    },

    // --- World & Map State ---
    mapMode: null,            // 'overworld', 'dungeon', 'castle', 'skyrealm', 'underworld'
    currentRealm: 0,          // 0 is the "Prime" Overworld. Anything else is a Shattered Realm.
    realmMutators: [],        // Special rules for the current realm (e.g., 'lava_oceans')
    currentCaveId: null,
    currentCaveTheme: null,
    currentCastleId: null,
    overworldExit: null,      // Coordinates to return to {x, y}
    activeTreasure: null,     // Current treasure map target {x, y}
    
    // Exploration Tracking
    lootedTiles: new Map(),
    discoveredRegions: new Set(),
    exploredChunks: new Set(),
    foundLore: new Set(),
    foundCodexEntries: new Set(),
    shopStates: {},           

    // --- MAP DATA BATCH BUFFER ---
    pendingMapSaves: {
        chunks: new Set(),
        lore: new Set(),
        looted: {}
    },
    needsLegacyMapCleanup: false, // Flags old saves for migration

    flags: {
        hasSeenForestWarning: false,
        canoeEmbarkCount: 0,
        hasSailedDeepOcean: false
    },

    // Weather, Time & Global Events
    weather: 'clear',
    currentForecast: 'clear', // Background forecast for weather transitions
    isBloodMoon: false,       // Global server event flag
    playerTurnCount: 0,
    time: {
        day: 1,
        hour: 6,
        minute: 0,
        year: 642,
        season: "Spring",     // MECHANIC PREP: Dynamic seasons
        era: "of the Fourth Age"
    },

    // --- Entity State ---
    instancedEnemies: [],     // Local dungeon/castle enemies
    friendlyNpcs: [],         // Castle guards/villagers
    sharedEnemies: {},        // Multiplayer overworld enemies
    enemySpatialMap: new Map()// For optimized AI pathing
};

// --- END OF FILE state.js ---
