// --- START OF FILE state.js ---

// ============================================================================
// GLOBAL CONFIGURATION CONSTANTS
// ============================================================================
window.MAX_INVENTORY_SLOTS = 9;
const ABSOLUTE_MAX_INVENTORY_SLOTS = 50; // 🚨 DB GUARD: Prevents Firebase 1MB Doc blowout

// PERFORMANCE WIN: Pre-allocate array outside the loop to prevent GC churn
const _EQUIPMENT_SLOTS = ['weapon', 'armor', 'offhand', 'accessory', 'ammo'];

// EXPANDABILITY WIN: Data-Driven Capacity Check
// Automatically scales if the player equips items with a `carryCapacity` stat bonus!
window.getInventoryCap = function(player) {
    let cap = window.MAX_INVENTORY_SLOTS;
    
    // 🚨 PERFORMANCE & ROBUSTNESS WIN: Hardcoded pre-allocated slot array.
    // Bypasses the slow `for...in` loop and prevents iterating over corrupted prototype properties.
    if (player && player.equipment) {
        for (let i = 0; i < _EQUIPMENT_SLOTS.length; i++) {
            const item = player.equipment[_EQUIPMENT_SLOTS[i]];
            // parseInt guarantees we don't accidentally do string concatenation (e.g. 9 + "1" = 91)
            if (item && item.statBonuses && item.statBonuses.carryCapacity) {
                cap += parseInt(item.statBonuses.carryCapacity, 10) || 0;
            }
        }
    }
    
    // Mount Saddlebag Hook
    if (player && player.isMounted && player.companion && player.companion.carryCapacity) {
        cap += parseInt(player.companion.carryCapacity, 10) || 0;
    }
    
    // Passive Talent Hook
    if (player && player.talents && player.talents.includes('pack_mule')) {
        cap += 3;
    }

    // Expandability: Arbitrary bonus capacity (Quest rewards, server buffs, etc.)
    if (player && player.bonusCapacity) {
        cap += player.bonusCapacity;
    }
    
    // Absolute floor and ceiling safety
    return Math.max(1, Math.min(cap, ABSOLUTE_MAX_INVENTORY_SLOTS)); 
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

// Shared String Caches
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

// 🚨 V8 MEMORY OPTIMIZATION: Strict Object Shape
// Every possible variable the player or world could ever have is pre-defined here.
// This locks the Hidden Class in the browser's JavaScript engine, making state lookups incredibly fast.
const gameState = {
    // --- System & Engine State ---
    saveVersion: "0.2.9",     
    initialEnemiesLoaded: false,
    mapDirty: true,
    
    // 🚨 BUG FIX WIN: The Double-Death Lock!
    isDead: false, 
    
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
        
        alignment: 0,         // LORE WIN: -100 (Pure Evil) to 100 (Pure Good)
        deity: null,          // LORE WIN: Religion/Patron tracking
        
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
        isFishing: false,     // Interaction lock flag
        isCrafting: false,    // Interaction lock flag
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
        bonusCapacity: 0,

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
        activeBuffs: {},      // Expandability dict for arbitrary future buffs

        reputation: {
            merchants_guild: 0,         
            the_crown: 0,         
            shadowed_hand: -10, 
            fae_court: 0,           
            dwarven_clans: 0,       
            cult_of_the_abyss: -5,
            pirates_cove: 0,
            cartographers_guild: 0
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
        
        // Comprehensive Lifetime Metrics for Anti-Cheat & Achievements
        achievements: [],
        playtime: 0,          // Total seconds logged
        metrics: {
            totalKills: 0,
            bossesDefeated: 0,
            totalDeaths: 0,
            stepsTaken: 0,
            itemsCrafted: 0,
            potionsBrewed: 0,
            goldEarned: 0,
            goldSpent: 0,         // New
            fishCaught: 0,
            dungeonsCleared: 0,
            secretsFound: 0,
            spellsCast: 0,
            timesRested: 0,       
            cropsHarvested: 0,    
            leylinesUsed: 0,
            damageTaken: 0,
            environmentalDamageTaken: 0, // New
            fallDamageTaken: 0,          // New
            damageDealt: 0,
            criticalHits: 0,
            questsCompleted: 0,
            treasuresDug: 0,
            shrinesPrayed: 0,
            echoesLeft: 0,
            mimicsDefeated: 0,
            voidRiftsSealed: 0,
            artifactsUnearthed: 0,
            timesMutated: 0
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
    
    activeInvestigation: null, // Tracks story coordinates and event IDs
    
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
    
    // 🚨 SECURITY & STABILITY WIN: The NaN Firewall
    // Guarantees that corrupted spell damage, corrupted items, or missing properties 
    // never inject a NaN into the player's health and permanently break their save file.
    let amount = Number(rawAmount);
    if (!Number.isFinite(amount) || Number.isNaN(amount)) {
        console.warn(`[AKASHIC ENGINE] Blocked invalid vital modification on ${vital}: ${rawAmount}`);
        return 0; 
    }
    
    if (amount === 0) return 0;
    
    // 🚨 BUG FIX WIN: Centralized God Mode
    // Previously, falling off the skyrealm or stepping in lava bypassed combat logic and killed admins.
    // This intercepts ALL negative vital changes globally!
    if (amount < 0 && gameState.godMode && (vital === 'health' || vital === 'stamina' || vital === 'mana' || vital === 'psyche')) {
        return 0;
    }

    // 🚨 MECHANIC WIN: Universal Shield Absorption
    // Environmental damage (Lava, Poison, Fall Damage, Traps) previously bypassed the Arcane Shield.
    // Now, any negative health change automatically tests against the shield first!
    if (vital === 'health' && amount < 0 && p.shieldValue > 0) {
        const dmgAbsorbed = Math.min(p.shieldValue, Math.abs(amount));
        p.shieldValue -= dmgAbsorbed;
        amount += dmgAbsorbed; // Reduce the negative health hit by the absorbed amount
        
        if (typeof logMessage !== 'undefined' && dmgAbsorbed > 0) {
            // Only log it here if we aren't in combat, otherwise combat.js handles the logging natively
            if (!isProcessingMove) logMessage(`{cyan:Arcane Shield absorbs ${dmgAbsorbed} damage!}`);
        }

        if (p.shieldValue <= 0) {
            p.shieldValue = 0;
            p.shieldTurns = 0;
            if (typeof logMessage !== 'undefined') logMessage("{cyan:Your Arcane Shield has shattered!}");
        }
        
        // If the shield absorbed the entire hit, abort the rest of the function!
        if (amount === 0) return 0; 
    }
    
    // 🚨 BUG FIX WIN: The "Shotgun" Death Fix (i-Frames)
    // If the player stands on an oil barrel and it explodes while a monster hits them on the EXACT 
    // same millisecond, they take double-damage and the death script triggers twice.
    // This grants a 100ms invulnerability window specifically for health damage to prevent overlapping AoE deaths!
    if (vital === 'health' && amount < 0) {
        const now = Date.now();
        if (now - (p.lastHitTime || 0) < 100) return 0; // Drop the secondary damage
        p.lastHitTime = now;
        
        // Track total lifetime damage taken
        if (p.metrics) p.metrics.damageTaken += Math.abs(amount);
        
        // Track environmental damage separately if it wasn't triggered by an enemy
        if (p.metrics && !isProcessingMove) {
            p.metrics.environmentalDamageTaken += Math.abs(amount);
        }
    }
    
    // O(1) Pre-cached max vital lookup bypasses string manipulation
    const maxKey = window._statCapCache[vital] || ('max' + vital.charAt(0).toUpperCase() + vital.slice(1));
    const maxVal = Number(p[maxKey]) || 100; // Failsafe fallback
    
    const oldVal = Number(p[vital]) || 0; // Strict coercion
    let newVal = oldVal + amount;
    newVal = Math.max(0, Math.min(maxVal, newVal)); // Clamp securely
    
    p[vital] = newVal;
    const actualChange = newVal - oldVal;

    // ==========================================
    // LORE & JUICE WIN: VITAL EVENTS
    // ==========================================
    if (actualChange < 0) {
        const pctLost = Math.abs(actualChange) / maxVal;
        
        if (vital === 'health') {
            // Huge single physical hit (40% or more of max HP in one blow)
            if (pctLost >= 0.40) {
                if (typeof logMessage !== 'undefined') logMessage("{orange:You suffer a devastating blow!}");
                gameState.screenShake = Math.max(gameState.screenShake, 15);
            }
            
            // Near-death physical boundary crossed (Drop below 25%)
            if (newVal <= (maxVal * 0.25) && oldVal > (maxVal * 0.25) && newVal > 0) {
                if (typeof logMessage !== 'undefined') logMessage("{red:Your vision blurs. You are clinging to life!}");
                gameState.screenFlash = { color: '#991b1b', alpha: 0.5, decay: 0.05 };
            }

            // --- MOUNT EXPANSION: SECURE KNOCK-OFF ---
            // Only heavy hits (>5 dmg) have a chance to knock you off your mount, 
            // preventing a 1dmg poison tick from dropping you into a swamp!
            if (actualChange <= -5 && p.isMounted) {
                if (Math.random() < 0.30) {
                    p.isMounted = false;
                    if (typeof logMessage !== 'undefined') logMessage("{red:The heavy blow knocks you off your mount!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    if (typeof render !== 'undefined') render();
                }
            }
        } 
        else if (vital === 'psyche') {
            // Huge mental hit (Madness/Void Terrors)
            if (pctLost >= 0.30) {
                if (typeof logMessage !== 'undefined') logMessage("{purple:Your mind reels from a horrifying revelation!}");
                gameState.screenShake = Math.max(gameState.screenShake, 10);
            }
        }
        else if (vital === 'hunger' || vital === 'thirst') {
            // Starvation/Dehydration Warning (Drop below 15%)
            if (newVal <= (maxVal * 0.15) && oldVal > (maxVal * 0.15)) {
                if (typeof logMessage !== 'undefined') {
                    const term = vital === 'hunger' ? 'starving' : 'dehydrated';
                    logMessage(`{red:You are severely ${term}. You must find sustenance soon!}`);
                }
            }
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

    // 🚨 BUG FIX WIN: The Death Lock Check
    // Triggers exactly once to execute the death sequence gracefully
    if (vital === 'health' && p.health <= 0 && !gameState.isDead) {
        gameState.screenFlash = { color: '#991b1b', alpha: 1.0, decay: 0.01 };
        
        if (typeof handlePlayerDeath === 'function') {
            // Using a tiny timeout allows the current stack trace (combat loops, array iterations)
            // to safely resolve before we violently alter the mapMode and strip the player's inventory!
            setTimeout(handlePlayerDeath, 0); 
        }
    }

    return actualChange; 
};

// --- END OF FILE state.js ---
