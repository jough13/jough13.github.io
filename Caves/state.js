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

const gameState = {
    // --- System & Engine State ---
    initialEnemiesLoaded: false,
    mapDirty: true,           // Flag to force canvas redraws
    screenShake: 0,           // Visual effect intensity
    inventoryMode: false,
    isDroppingItem: false,
    isAiming: false,
    abilityToAim: null,
    currentCraftingMode: 'workbench',
    godMode: false,           // Toggled via /god command

    // --- Player State ---
    player: {
        // Identity & Positioning
        x: 0,
        y: 0,
        character: '@',
        color: 'blue',
        
        // Progression
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
        candlelightTurns: 0,
        stealthTurns: 0,
        
        // Environment Protection
        fireResistTurns: 0,
        waterBreathingTurns: 0,

        // Storage & Items
        inventory: [],
        bank: [],             // Stash items
        equipment: {
            weapon: null,
            armor: null
        },
        hotbar: [null, null, null, null, null],

        // Skills & Magic
        spellbook: {},
        skillbook: {},
        talents: [],
        cooldowns: {},

        // Systems Tracking
        quests: {},
        killCounts: {},
        completedLoreSets: [], // Tracks finished codex pages
        obeliskProgress: [],   // Tracks Ancient Key puzzle
        unlockedWaypoints: [], // Fast travel nodes { x, y, name }
        companion: null,       // Tamed beasts / Mercenaries
        isBoating: false,      // Canoe state
    },

    // --- World & Map State ---
    mapMode: null,            // 'overworld', 'dungeon', 'castle'
    currentCaveId: null,
    currentCaveTheme: null,
    currentCastleId: null,
    overworldExit: null,      // Coordinates to return to {x, y}
    activeTreasure: null,     // Current treasure map target {x, y}
    
    // Exploration Tracking
    lootedTiles: new Set(),
    discoveredRegions: new Set(),
    exploredChunks: new Set(),
    foundLore: new Set(),
    shopStates: {},           // Persistent merchant inventories

    flags: {
        hasSeenForestWarning: false,
        canoeEmbarkCount: 0
    },

    // Weather & Time
    weather: 'clear',
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
