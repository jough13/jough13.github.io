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

// --- Caches & Data Buffers ---
let cachedThemeColors = {};
const processingSpawnTiles = new Set();
let pendingSpawns = new Set(); // Track enemies currently being spawned so they don't flicker
let pendingSpawnData = {};
let activeShopInventory = [];
const wokenEnemyTiles = new Set(); // Global set to track processed tiles this session


// ============================================================================
// MASTER GAME STATE
// ============================================================================
// PERFORMANCE WIN: Explicitly defining ALL properties here ensures the V8 Javascript Engine
// creates a single, highly-optimized memory shape for the game state, preventing 
// micro-stutters that occur when properties are dynamically added later!

const gameState = {
    // --- System & Engine State ---
    initialEnemiesLoaded: false,
    mapDirty: true,           // Flag to force canvas redraws
    screenShake: 0,           // Visual effect intensity
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
        
        // Positioning & Movement
        x: 0,
        y: 0,
        visualX: 0,           // Camera smoothing X
        visualY: 0,           // Camera smoothing Y
        facing: 'right',      // Player facing direction for rendering
        respawnPoint: { x: 0, y: 0 }, // PREP: Custom bed/waystone respawns
        isBoating: false,     // Canoe state
        isSailing: false,     // Deep sea ship state
        
        // Multiplayer UI
        chatBubble: null,     // Floating text above head
        chatTimer: 0,
        partyId: null,        // PREP: For upcoming party system
        tradeRequests: [],    // PREP: Pending player trades
        
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
        lastCombatTime: 0,    // PREP: Out-of-combat regeneration
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
        quests: {},
        relicQuestStage: 0,    // Tracks the Historian's main quest line
        killCounts: {},
        completedLoreSets: [], // Tracks finished codex pages
        obeliskProgress: [],   // Tracks Ancient Key puzzle
        cartographerProgress: 0, // Maps submitted for reward
        
        // Professions
        craftingLevel: 1, 
        craftingXp: 0, 
        craftingXpToNext: 50,
        fishingLevel: 1,
        fishingXp: 0,
        fishingRecords: {},    // Best catches weight

        // Map & Exploration Data
        unlockedWaypoints: [], // Fast travel nodes { x, y, name }
        discoveredPOIs: [],    // Landmarks for the minimap
        customPins: [],        // Player placed map pins {x, y}
        companion: null,       // Tamed beasts / Mercenaries
        tutorialProgress: 0    // PREP: Onboarding system
    },

    // --- World & Map State ---
    mapMode: null,            // 'overworld', 'dungeon', 'castle'
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
    shopStates: {},           // Persistent merchant inventories

    flags: {
        hasSeenForestWarning: false,
        canoeEmbarkCount: 0
    },

    // Weather & Time
    weather: 'clear',
    currentForecast: 'clear', // Background forecast for weather transitions
    playerTurnCount: 0,
    time: {
        day: 1,
        hour: 6,
        minute: 0,
        year: 642,
        era: "of the Fourth Age"
    },

    // --- Entity State ---
    instancedEnemies: [],     // Local dungeon/castle enemies
    friendlyNpcs: [],         // Castle guards/villagers
    sharedEnemies: {},        // Multiplayer overworld enemies
    enemySpatialMap: new Map()// For optimized AI pathing
};
