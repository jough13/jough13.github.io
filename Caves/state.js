let player_id;
let playerRef;
let onlinePlayerRef;
let otherPlayers = {};
let unsubscribePlayerListener;
let worldStateListeners = {};

let isProcessingMove = false; 

let lastAiExecution = 0;

let cachedThemeColors = {};

const processingSpawnTiles = new Set();

let areGlobalListenersInitialized = false;

// --- OPTIMIZATION GLOBALS ---
let saveTimeout = null; // Tracks the pending save timer

// Track Listeners so we can turn them off
let sharedEnemiesListener = null;
let chatListener = null;
let connectedListener = null;

// Track enemies currently being spawned so they don't flicker
let pendingSpawns = new Set();

let pendingSpawnData = {};

let activeShopInventory = [];

// Global set to track processed tiles this session
const wokenEnemyTiles = new Set();

const gameState = {
    initialEnemiesLoaded: false,
    mapDirty: true,
    screenShake: 0,
    weather: 'clear',
    player: {
        x: 0,
        y: 0,
        character: '@',
        color: 'blue',
        health: 10,
        maxHealth: 10,
        mana: 10,
        maxMana: 10,
        stamina: 10,
        maxStamina: 10,
        psyche: 10,
        maxPsyche: 10,
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
        inventory: [],
        coins: 0,
        healthRegenProgress: 0,
        staminaRegenProgress: 0,
        manaRegenProgress: 0,
        psycheRegenProgress: 0,

        strengthBonus: 0,
        strengthBonusTurns: 0,

        frostbiteTurns: 0,
        poisonTurns: 0,

        weather: 'clear', // clear, rain, storm, snow, fog
        weatherTimer: 0,  // Counts turns until weather changes
    },

    lootedTiles: new Set(),
    discoveredRegions: new Set(),

    activeTreasure: null,

    mapMode: null,

    currentCaveId: null,
    currentCaveTheme: null,
    currentCastleId: null,
    overworldExit: null,
    messages: [],
    flags: {
        hasSeenForestWarning: false,
        canoeEmbarkCount: 0
    },
    inventoryMode: false,

    currentCraftingMode: 'workbench',

    instancedEnemies: [],
    friendlyNpcs: [],
    worldEnemies: {},
    sharedEnemies: {},
    enemySpatialMap: new Map(), // Key: "chunkX,chunkY", Value: Set(enemyId)
    isDroppingItem: false,
    playerTurnCount: 0,
    isAiming: false,
    abilityToAim: null,
    time: {
        day: 1,
        hour: 6,
        minute: 0,
        year: 642,
        era: "of the Fourth Age"
    }
};
