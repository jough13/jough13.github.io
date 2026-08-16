// --- START OF FILE state.js ---

// ============================================================================
// GLOBAL CONFIGURATION CONSTANTS
// ============================================================================

window.MAX_INVENTORY_SLOTS = 9;
const ABSOLUTE_MAX_INVENTORY_SLOTS = 50; // 🚨 DB GUARD: Prevents Firebase 1MB Doc blowout

// Pre-allocate and Freeze array to prevent GC churn and mutation checks
const _EQUIPMENT_SLOTS = Object.freeze(['weapon', 'armor', 'offhand', 'accessory', 'ammo']);

// Data-Driven Capacity Check
// Automatically scales if the player equips items with a `carryCapacity` stat bonus!
window.getInventoryCap = function(player) {
    // 🚨 GHOST GUARD: Prevent TypeError if called during engine boot before player exists
    if (!player) return window.MAX_INVENTORY_SLOTS;

    let cap = window.MAX_INVENTORY_SLOTS;
    
    // Hardcoded pre-allocated slot array.
    // Bypasses the slow `for...in` loop and prevents iterating over corrupted prototype properties.
    if (player.equipment) {
        for (let i = 0; i < _EQUIPMENT_SLOTS.length; i++) {
            const item = player.equipment[_EQUIPMENT_SLOTS[i]];
            // Math.floor guarantees we don't get decimal slots, and Number() prevents string concatenation
            if (item && item.statBonuses && item.statBonuses.carryCapacity) {
                cap += Math.floor(Number(item.statBonuses.carryCapacity)) || 0;
            }
        }
    }
    
    // Mount Saddlebag Hook
    if (player.isMounted && player.companion && player.companion.carryCapacity) {
        cap += Math.floor(Number(player.companion.carryCapacity)) || 0;
    }
    
    // Passive Talent Hook
    if (player.talents && player.talents.includes('pack_mule')) {
        cap += 3;
    }

    // Expandability: Arbitrary bonus capacity (Quest rewards, server buffs, etc.)
    if (player.bonusCapacity) {
        cap += Math.floor(Number(player.bonusCapacity)) || 0;
    }
    
    // 🚨 EXPANDABILITY WIN: Fire global hook so expansions can alter capacity cleanly!
    if (typeof window.ExpansionManager !== 'undefined') {
        const hookRes = window.ExpansionManager.triggerHook('onCalculateInventoryCap', { player: player, currentCap: cap });
        if (hookRes && hookRes.currentCap !== undefined) cap = hookRes.currentCap;
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

// O(1) Cache for Stat Bar UI pulses
// 🚨 PERFORMANCE WIN: Pre-mapped UI animation classes!
window._statColorCache = {
    health: 'stat-pulse-green',
    hunger: 'stat-pulse-green',
    mana: 'stat-pulse-blue',
    thirst: 'stat-pulse-blue',
    stamina: 'stat-pulse-yellow',
    psyche: 'stat-pulse-purple',
    strength: 'stat-pulse-red',
    wits: 'stat-pulse-blue',
    constitution: 'stat-pulse-green',
    dexterity: 'stat-pulse-green',
    luck: 'stat-pulse-yellow',
    charisma: 'stat-pulse-yellow',
    perception: 'stat-pulse-gold',
    willpower: 'stat-pulse-purple',
    endurance: 'stat-pulse-yellow',
    intuition: 'stat-pulse-green'
};

// ============================================================================
// MASTER GAME STATE (THE "SINGLE SOURCE OF TRUTH")
// ============================================================================

// 🚨 V8 MEMORY OPTIMIZATION: Strict Object Shape
// Every possible variable the player or world could ever have across ALL expansions is pre-defined here.
// This locks the "Hidden Class" in the browser's JavaScript engine, making state lookups incredibly fast
// and preventing lag spikes when a new expansion activates a feature for the first time.
const gameState = {
    // --- System & Engine State ---
    saveVersion: "0.3.0", 
    initialEnemiesLoaded: false,
    mapDirty: true,
    
    // The Double-Death Lock!
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
        
        alignment: 0,         
        deity: null,          
        
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
        isFishing: false,     
        isCrafting: false,    
        mountName: null,      
        isCrouching: false,
        suspicion: 0,
        
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
        lastHitDamage: 0,
        
        // --- BUFF/DEBUFF DURATIONS (Strict Shape Allocation) ---
        strengthBonus: 0, strengthBonusTurns: 0,
        witsBonus: 0, witsBonusTurns: 0,
        defenseBonus: 0, defenseBonusTurns: 0,
        dexterityBonus: 0, dexterityBonusTurns: 0,
        constitutionBonus: 0, constitutionBonusTurns: 0,
        luckBonus: 0, luckBonusTurns: 0,
        charismaBonus: 0, charismaBonusTurns: 0,
        willpowerBonus: 0, willpowerBonusTurns: 0,
        perceptionBonus: 0, perceptionBonusTurns: 0,
        enduranceBonus: 0, enduranceBonusTurns: 0,
        intuitionBonus: 0, intuitionBonusTurns: 0,
        
        shieldValue: 0, shieldTurns: 0,
        thornsValue: 0, thornsTurns: 0,
        frostbiteTurns: 0, poisonTurns: 0, burnTurns: 0,         
        rootTurns: 0, madnessTurns: 0, stunTurns: 0,         
        candlelightTurns: 0, stealthTurns: 0,
        fireResistTurns: 0, waterBreathingTurns: 0,
        
        weatherState: 'calm',
        weatherIntensity: 0,
        weatherDuration: 0,
        statusImmunities: [], 
        activeBuffs: {},      

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
        
        // Expansion Specific Variables
        craftingLevel: 1, 
        craftingXp: 0, 
        craftingXpToNext: 50,
        fishingLevel: 1,
        fishingXp: 0,
        fishingRecords: {},    
        farmingLevel: 1,       
        farmingXp: 0,
        farmingXpToNext: 50,
        gardenPlots: [null, null, null],       
        guildTag: null,
        pvpEnabled: false,
        bounty: 0,
        builtHouses: [],
        rescuedNpcs: [],
        lastBotanistDay: 0,
        generation: 0,
        customSpells: {},
        spireBackupInv: null,
        spireBackupEquip: null,
        activeHunt: null,

        // System Locks
        _isDying: false,
        _fatalMutators: null,
        _raidEntryTurn: null,

        unlockedWaypoints: [], 
        discoveredPOIs: [],    
        customPins: [],        
        companion: null,       
        tutorialProgress: 0,   
        
        // Comprehensive Lifetime Metrics for Anti-Cheat & Achievements
        achievements: [],
        playtime: 0,          
        metrics: {
            highestLevel: 1,      
            deepestFloor: 1,      
            totalKills: 0,
            bossKills: {},        
            bossesDefeated: 0,
            totalDeaths: 0,
            stepsTaken: 0,
            itemsCrafted: 0,
            itemsEnchanted: 0,
            materialsStashed: 0,
            potionsBrewed: 0,
            potionsDrank: 0,      
            itemsIdentified: 0,   
            goldEarned: 0,
            goldSpent: 0,         
            fishCaught: 0,
            dungeonsCleared: 0,
            secretsFound: 0,
            spellsCast: 0,
            spellsWoven: 0,
            timesRested: 0,       
            cropsHarvested: 0,    
            treesChopped: 0,      
            oresMined: 0,         
            leylinesUsed: 0,
            damageTaken: 0,
            environmentalDamageTaken: 0, 
            fallDamageTaken: 0,          
            damageDealt: 0,
            criticalHits: 0,
            healthHealed: 0,      
            manaConsumed: 0,      
            staminaConsumed: 0,   
            questsCompleted: 0,
            treasuresDug: 0,
            shrinesPrayed: 0,
            echoesLeft: 0,
            mimicsDefeated: 0,
            voidRiftsSealed: 0,
            artifactsUnearthed: 0,
            timesMutated: 0,
            timesAscended: 0
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
    
    activeInvestigation: null, 
    
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

// Centralized Vital Clamping
// Exposed so other scripts (like unequipping cursed items) can cleanly normalize pools!
window.clampAllVitals = function() {
    const p = gameState.player;
    if (!p) return;
    
    // 🚨 BUG FIX WIN: Clamp Health to 0 minimum instead of 1.
    // If a player was dead (HP 0), this function would accidentally resurrect them as a 1 HP zombie!
    p.health = Math.max(0, Math.min(p.maxHealth || 10, p.health));
    p.mana = Math.max(0, Math.min(p.maxMana || 10, p.mana));
    p.stamina = Math.max(0, Math.min(p.maxStamina || 10, p.stamina));
    p.psyche = Math.max(0, Math.min(p.maxPsyche || 10, p.psyche));
    
    // Added absolute ceilings for survival stats so they don't over-fill UI bars!
    p.hunger = Math.max(0, Math.min(p.maxHunger || 100, p.hunger));
    p.thirst = Math.max(0, Math.min(p.maxThirst || 100, p.thirst));
};

window.modifyVital = function(vital, rawAmount) {
    const p = gameState.player;
    
    // Prevent TypeError if called before engine is fully loaded
    if (!p) return 0;
    
    // The NaN Firewall & Floating Point Fix
    let amount = Math.round(Number(rawAmount));
    if (!Number.isFinite(amount)) { 
        console.warn(`[AKASHIC ENGINE] Blocked invalid vital modification on ${vital}: ${rawAmount}`);
        return 0; 
    }
    
    if (amount === 0) return 0;

    // The Absolute Death Shield
    // If the player is already dead or mid-death sequence, completely ignore all further incoming damage!
    // This prevents batched AoE attacks or direct script calls from triggering the death sequence multiple times.
    if (vital === 'health' && amount < 0 && (p.health <= 0 || gameState.isDead || p._isDying || gameState._isExecutingDeath)) {
        return 0;
    }
    
    // Centralized God Mode
    // Universally intercepts ALL negative vital changes.
    if (amount < 0 && gameState.godMode) {
        return 0;
    }

    // Universal Shield Absorption
    // Environmental damage (Lava, Poison, Fall Damage, Traps) previously bypassed the Arcane Shield.
    // Now, any negative health change automatically tests against the shield first!
    if (vital === 'health' && amount < 0 && p.shieldValue > 0) {
        
        // Shields shouldn't absorb drowning damage or suffocation!
        let isSuffocating = false;
        if (typeof chunkManager !== 'undefined') {
            const tileAt = chunkManager.getTile(p.x, p.y);
            // If they are taking damage while standing in deep water without gills/boat, it's suffocation
            if (tileAt === '~' && !p.isBoating && !p.isSailing && p.waterBreathingTurns <= 0) {
                isSuffocating = true;
            }
        }

        if (!isSuffocating) {
            const dmgAbsorbed = Math.min(p.shieldValue, Math.abs(amount));
            p.shieldValue -= dmgAbsorbed;
            amount += dmgAbsorbed; // Reduce the negative health hit by the absorbed amount
            
            if (typeof logMessage !== 'undefined' && dmgAbsorbed > 0) {
                // Only log it here if we aren't in combat, otherwise combat.js handles the logging natively
                if (typeof isProcessingMove === 'undefined' || !isProcessingMove) {
                    logMessage(`{cyan:Arcane Shield absorbs ${dmgAbsorbed} damage!}`);
                }
            }

            // Shield Shatter Audio & Visuals
            if (p.shieldValue <= 0) {
                p.shieldValue = 0;
                p.shieldTurns = 0;
                if (typeof logMessage !== 'undefined') logMessage("{cyan:Your Arcane Shield has shattered!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playDisenchant(); 
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#3b82f6', 15);
                gameState.screenShake = Math.max(gameState.screenShake || 0, 5);
            }
            
            // If the shield absorbed the entire hit, abort the rest of the function!
            if (amount === 0) return 0; 
        }
    }
    
    // True I-Frames & AoE Hit Overlap Fix
    // If multiple attacks hit the player in the exact same 100ms window (e.g. an explosion + an arrow),
    // we take the LARGEST of the hits, and explicitly refund the smaller hit so they don't stack unfairly!
    if (vital === 'health' && amount < 0) {
        const now = Date.now();
        if (now - (p.lastHitTime || 0) < 100) {
            if (Math.abs(amount) <= (p.lastHitDamage || 0)) {
                return 0; // Reject the new, smaller hit completely
            } else {
                // The new hit is BIGGER than the one we took 10ms ago! 
                // Refund the previous small hit before taking the new big one to prevent double-dipping.
                p.health += (p.lastHitDamage || 0);
            }
        }
        p.lastHitTime = now;
        p.lastHitDamage = Math.abs(amount);
        
        // Track total lifetime damage taken
        if (p.metrics) p.metrics.damageTaken += Math.abs(amount);
        
        // Track environmental damage separately if it wasn't triggered by an enemy
        if (p.metrics && (typeof isProcessingMove === 'undefined' || !isProcessingMove)) {
            p.metrics.environmentalDamageTaken += Math.abs(amount);
        }
    }
    
    // O(1) Pre-cached max vital lookup bypasses string manipulation
    const maxKey = window._statCapCache[vital] || ('max' + vital.charAt(0).toUpperCase() + vital.slice(1));
    
    // 🚨 FUTURE-PROOFING WIN: If an expansion modifies a stat that doesn't have a max cap (like heat/sanity),
    // we fall back to Infinity so we don't accidentally clamp it at 100!
    const maxVal = p[maxKey] !== undefined ? (Math.round(Number(p[maxKey])) || 0) : Infinity; 
    
    const oldVal = Math.round(Number(p[vital])) || 0; // Strict coercion
    let newVal = oldVal + amount;
    newVal = Math.max(0, Math.min(maxVal, newVal)); // Clamp securely
    
    p[vital] = newVal;
    const actualChange = newVal - oldVal;

    // --- TRACK LIFETIME METRICS ---
    if (p.metrics) {
        if (vital === 'health' && actualChange > 0) p.metrics.healthHealed = (p.metrics.healthHealed || 0) + actualChange;
        if (vital === 'mana' && actualChange < 0) p.metrics.manaConsumed = (p.metrics.manaConsumed || 0) + Math.abs(actualChange);
        if (vital === 'stamina' && actualChange < 0) p.metrics.staminaConsumed = (p.metrics.staminaConsumed || 0) + Math.abs(actualChange);
    }

    // ==========================================
    // VITAL EVENTS
    // ==========================================

    if (actualChange < 0) {
        // Prevent division by zero mathematically if maxVal is somehow 0
        const pctLost = maxVal > 0 ? Math.abs(actualChange) / maxVal : 0;
        
        if (vital === 'health') {
            
            // --- LORE WIN: Mortal Blow ---
            // If the player takes 70% or more of their maximum health in a single, devastating hit!
            if (pctLost >= 0.70) {
                if (typeof logMessage !== 'undefined') logMessage("{red:MORTAL BLOW! The sheer force of the impact shatters the earth around you!}");
                gameState.screenShake = Math.max(gameState.screenShake || 0, 35);
                gameState.screenFlash = { color: '#dc2626', alpha: 0.8, decay: 0.05 };
                if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playWarning === 'function') AudioSystem.playWarning();
                
                // JUICE WIN: Gore Burst
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#991b1b', 30);
            }
            // Huge single physical hit (40% or more of max HP in one blow)
            else if (pctLost >= 0.40) {
                if (typeof logMessage !== 'undefined') logMessage("{orange:You suffer a devastating blow!}");
                gameState.screenShake = Math.max(gameState.screenShake || 0, 15);
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
                    if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playError === 'function') AudioSystem.playError();
                    if (typeof render === 'function') render();
                }
            }
        } 
        else if (vital === 'psyche') {
            // Huge mental hit (Madness/Void Terrors)
            if (pctLost >= 0.30) {
                if (typeof logMessage !== 'undefined') logMessage("{purple:Your mind reels from a horrifying revelation!}");
                gameState.screenShake = Math.max(gameState.screenShake || 0, 10);
            }
            // Complete Mental Collapse
            if (newVal === 0 && oldVal > 0) {
                if (typeof logMessage !== 'undefined') logMessage("{purple:Your mind snaps! You are completely overwhelmed.}");
                gameState.screenFlash = { color: '#a855f7', alpha: 0.5, decay: 0.05 };
            }
        }
        else if (vital === 'stamina') {
            // Complete Exhaustion
            if (newVal === 0 && oldVal > 0) {
                if (typeof logMessage !== 'undefined') logMessage("{yellow:You are completely exhausted!}");
                gameState.screenFlash = { color: '#facc15', alpha: 0.3, decay: 0.05 };
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

    // Handle UI Flashes automatically (High-speed O(1) routing)
    if (actualChange !== 0 && typeof statDisplays !== 'undefined' && statDisplays[vital]) {
        if (actualChange > 0) {
            const pulseClass = window._statColorCache[vital];
            if (pulseClass && typeof triggerStatAnimation === 'function') {
                triggerStatAnimation(statDisplays[vital], pulseClass);
            }
        } else {
            if (typeof triggerStatFlash === 'function') triggerStatFlash(statDisplays[vital], false);
        }
    }

    // 🚨 EXPANDABILITY WIN: Fire global lifecycle hook
    // Any expansion can now listen for when the player's health drops or mana regens!
    if (typeof window.ExpansionManager !== 'undefined') {
        window.ExpansionManager.triggerHook('onVitalChanged', { vital, amount, actualChange, player: p });
    }

    // The Death Lock Check
    // Triggers exactly once to execute the death sequence gracefully.
    // Includes a debouncer flag (_isDying) to prevent double-firing if two systems hit 
    // the player synchronously before the handlePlayerDeath timeout resolves.
    
    // Check if the backup process is actively overwriting the state right now to prevent corruption
    const isRestoring = typeof isBackupOperationRunning !== 'undefined' && isBackupOperationRunning;

    if (!isRestoring && vital === 'health' && p.health <= 0 && !gameState.isDead && !p._isDying) {
        p._isDying = true;
        gameState.screenFlash = { color: '#991b1b', alpha: 1.0, decay: 0.01 };
        
        // Inject custom death quotes dynamically into the combat.js loop if active!
        if (gameState.realmMutators && gameState.realmMutators.length > 0) {
            p._fatalMutators = [...gameState.realmMutators];
        }
        
        if (typeof handlePlayerDeath === 'function') {
            // 🚨 BUG FIX & ROBUSTNESS WIN: Try/Finally inside the timeout
            // Guarantees the death locks are released even if a plugin injected a broken item into the death loot loop!
            setTimeout(() => {
                try {
                    handlePlayerDeath();
                } finally {
                    p._isDying = false; 
                    p._fatalMutators = null; 
                }
            }, 0); 
        }
    }

    return actualChange; 
};

// --- END OF FILE state.js ---
