// --- START OF FILE state.js ---

// ============================================================================
// GLOBAL CONFIGURATION CONSTANTS
// ============================================================================
window.MAX_INVENTORY_SLOTS = 9;

// EXPANDABILITY WIN: Data-Driven Capacity Check
// Automatically scales if the player equips items with a `carryCapacity` stat bonus!
window.getInventoryCap = function(player) {
    let cap = window.MAX_INVENTORY_SLOTS;
    
    if (player && player.equipment) {
        for (const slot in player.equipment) {
            const item = player.equipment[slot];
            if (item && item.statBonuses && item.statBonuses.carryCapacity) {
                cap += item.statBonuses.carryCapacity;
            }
        }
    }
    
    // Mount Saddlebag Hook
    if (player && player.isMounted && player.companion && player.companion.carryCapacity) {
        cap += player.companion.carryCapacity;
    }
    
    return Math.max(1, cap); // Absolute floor safety
};

// ============================================================================
// GLOBAL VARIABLES & SYSTEM REFERENCES
// ============================================================================

let player_id;
let playerRef;
let onlinePlayerRef;
let otherPlayers = {};

let unsubscribePlayerListener;
let worldStateListeners = {};
let sharedEnemiesListener = null;
let chatListener = null;
let connectedListener = null;

let isProcessingMove = false; 
let lastPlayerChunkId = null; 
let lastAiExecution = 0;
let saveTimeout = null;       
let areGlobalListenersInitialized = false;

let chatRenderTimer = null;   
let lastLocalAIAttempt = 0;   
let lastSortAudio = 0;        

let cachedThemeColors = {};

let pendingSpawns = new Set();     
let pendingSpawnData = {};         
let activeShopInventory = [];      
const wokenEnemyTiles = new Set(); 

// PERFORMANCE WIN: Shared String Caches
window._statCapCache = {
    health: 'maxHealth',
    mana: 'maxMana',
    stamina: 'maxStamina',
    psyche: 'maxPsyche',
    hunger: 'maxHunger',
    thirst: 'maxThirst'
};

// ============================================================================
// MASTER GAME STATE (THE "SINGLE SOURCE OF TRUTH")
// ============================================================================

const gameState = {
    // --- System & Engine State ---
    saveVersion: "0.2.9",     
    initialEnemiesLoaded: false,
    mapDirty: true,           
    
    screenShake: 0,           
    cameraShake: {
        intensity: 0,
        dx: 0,                
        dy: 0,                
        decay: 0.85           
    },
    screenFlash: {
        color: null,          
        alpha: 0,             
        decay: 0.1            
    },
    activeFilter: null,       

    inventoryMode: false,
    isDroppingItem: false,
    isAiming: false,
    isAimingRanged: false,    
    abilityToAim: null,
    currentCraftingMode: 'workbench',
    godMode: false,           
    lastStartX: null,         
    lastStartY: null,         
    visibleAnimatedTiles: [], 

    renderFlags: {
        stats: false,
        inventory: false,
        equipment: false,
        hotbar: false,
        minimap: false
    },

    // --- Player State ---
    player: {
        name: "",
        character: '@',
        color: 'blue',
        race: null,
        gender: null,
        background: null,     
        className: null,      
        classEvolved: false,
        
        titles: [],           
        activeTitle: null,    
        
        x: 0,
        y: 0,
        visualX: 0,           
        visualY: 0,           
        facing: 'right',      
        respawnPoint: { x: 0, y: 0 }, 
        
        isBoating: false,     
        isSailing: false,     
        isMounted: false,     
        mountName: null,      
        
        chatBubble: null,     
        chatTimer: 0,
        partyId: null,        
        tradeRequests: [],    
        
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        statPoints: 0,
        talentPoints: 0,
        coins: 0,

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

        hunger: 50, 
        maxHunger: 100,
        thirst: 50,
        maxThirst: 100,

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

        lastCombatTime: 0,    
        lastHitTime: 0,       
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
        burnTurns: 0,         
        rootTurns: 0,
        madnessTurns: 0,      
        stunTurns: 0,         
        candlelightTurns: 0,
        stealthTurns: 0,
        
        fireResistTurns: 0,
        waterBreathingTurns: 0,
        weatherState: 'calm',
        weatherIntensity: 0,
        weatherDuration: 0,
        statusImmunities: [], 

        reputation: {
            guild: 0,         
            crown: 0,         
            shadowed_hand: -10, 
            fae: 0,           
            dwarves: 0,       
            cult_of_the_abyss: -5 
        },

        inventory: [],
        bank: [],             
        equipment: {
            weapon: null,
            armor: null,
            offhand: null,
            accessory: null,
            ammo: null
        },
        hotbar: [null, null, null, null, null],

        spellbook: {},
        skillbook: {},
        talents: [],
        cooldowns: {},

        campsiteUpgrades: [], 
        quests: {},
        relicQuestStage: 0,    
        shadowQuestStage: 0,   
        arenaWave: 0,          
        killCounts: {},
        completedLoreSets: [], 
        obeliskProgress: [],   
        cartographerProgress: 0, 
        
        craftingLevel: 1, 
        craftingXp: 0, 
        craftingXpToNext: 50,
        fishingLevel: 1,
        fishingXp: 0,
        fishingRecords: {},    
        
        farmingLevel: 1,       
        farmingXp: 0,
        farmingXpToNext: 50,
        gardenPlots: [],       

        unlockedWaypoints: [], 
        discoveredPOIs: [],    
        customPins: [],        
        companion: null,       
        tutorialProgress: 0,   
        
        // V8 Memory Pre-Allocation 
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
            timesRested: 0,       
            cropsHarvested: 0,    
            leylinesUsed: 0,
            damageTaken: 0,
            damageDealt: 0,
            criticalHits: 0
        }
    },

    // --- World & Map State ---
    mapMode: null,            
    currentRealm: 0,          
    realmMutators: [],        
    currentCaveId: null,
    currentCaveTheme: null,
    currentCastleId: null,
    overworldExit: null,      
    activeTreasure: null,     
    
    lootedTiles: new Map(),
    discoveredRegions: new Set(),
    exploredChunks: new Set(),
    foundLore: new Set(),
    foundCodexEntries: new Set(),
    shopStates: {},           

    pendingMapSaves: {
        chunks: new Set(),
        lore: new Set(),
        looted: {}
    },
    needsLegacyMapCleanup: false, 

    flags: {
        hasSeenForestWarning: false,
        canoeEmbarkCount: 0,
        hasSailedDeepOcean: false
    },

    weather: 'clear',
    currentForecast: 'clear', 
    
    isBloodMoon: false,       
    isEclipse: false,         
    isLeylineSurge: false,    
    
    playerTurnCount: 0,
    time: {
        day: 1,
        hour: 6,
        minute: 0,
        year: 642,
        season: "Spring",     
        era: "of the Fourth Age"
    },

    instancedEnemies: [],     
    friendlyNpcs: [],         
    sharedEnemies: {},        
    enemySpatialMap: new Map()
};

// ============================================================================
// CENTRALIZED STATE DISPATCHER (Vitals Management)
// ============================================================================

window.modifyVital = function(vital, rawAmount) {
    const p = gameState.player;
    
    const amount = Number(rawAmount) || 0;
    if (amount === 0) return 0;
    
    // i-Frame Logic
    if (vital === 'health' && amount < 0) {
        const now = Date.now();
        if (now - (p.lastHitTime || 0) < 100) return 0; 
        p.lastHitTime = now;
        
        // Track damage taken metric
        if (p.metrics) p.metrics.damageTaken += Math.abs(amount);
    }
    
    const maxKey = window._statCapCache[vital] || ('max' + vital.charAt(0).toUpperCase() + vital.slice(1));
    const maxVal = p[maxKey] || 100; 
    
    const oldVal = p[vital];
    let newVal = oldVal + amount;
    newVal = Math.max(0, Math.min(maxVal, newVal));
    
    p[vital] = newVal;
    const actualChange = newVal - oldVal;

    // --- LORE & JUICE WIN: Devastating Blows & Near-Death ---
    if (vital === 'health' && actualChange < 0) {
        const pctLost = Math.abs(actualChange) / maxVal;
        
        // Huge single hit
        if (pctLost >= 0.40) {
            if (typeof logMessage !== 'undefined') logMessage("{orange:You suffer a devastating blow!}");
            gameState.screenShake = Math.max(gameState.screenShake, 15);
        }
        
        // Near-death boundary crossed
        if (newVal <= (maxVal * 0.25) && oldVal > (maxVal * 0.25) && newVal > 0) {
            if (typeof logMessage !== 'undefined') logMessage("{red:Your vision blurs. You are clinging to life!}");
            gameState.screenFlash = { color: '#991b1b', alpha: 0.5, decay: 0.05 };
        }
    }

    // --- MOUNT EXPANSION: KNOCK-OFF ---
    if (actualChange < -5 && vital === 'health' && p.isMounted) {
        if (Math.random() < 0.30) {
            p.isMounted = false;
            if (typeof logMessage !== 'undefined') logMessage("{red:The heavy blow knocks you off your mount!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof render !== 'undefined') render();
        }
    }

    // Handle UI Flashes automatically
    if (actualChange !== 0 && typeof statDisplays !== 'undefined' && statDisplays[vital]) {
        if (actualChange > 0) {
            if (vital === 'health' || vital === 'hunger') triggerStatAnimation(statDisplays[vital], 'stat-pulse-green');
            else if (vital === 'mana') triggerStatAnimation(statDisplays[vital], 'stat-pulse-blue');
            else if (vital === 'stamina') triggerStatAnimation(statDisplays[vital], 'stat-pulse-yellow');
            else if (vital === 'psyche') triggerStatAnimation(statDisplays[vital], 'stat-pulse-purple');
            else if (vital === 'thirst') triggerStatAnimation(statDisplays[vital], 'stat-pulse-blue');
        } else {
            if (typeof triggerStatFlash === 'function') triggerStatFlash(statDisplays[vital], false);
        }
    }

    // Check for Death
    if (vital === 'health' && p.health <= 0) {
        gameState.screenFlash = { color: '#991b1b', alpha: 1.0, decay: 0.01 };
        
        if (typeof handlePlayerDeath === 'function') {
            setTimeout(handlePlayerDeath, 0); 
        }
    }

    return actualChange; 
};

// --- END OF FILE state.js ---
