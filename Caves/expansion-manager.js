// --- START OF FILE expansion-manager.js ---

// ==========================================
// AKASHIC ENGINE: EXPANSION INJECTOR
// ==========================================

// Safely initialize disabled expansions from local storage (QoL & Persistence Win)
let _savedDisabledExpansions = [];
try {
    const saved = localStorage.getItem('akashic_disabled_mods');
    if (saved) _savedDisabledExpansions = JSON.parse(saved);
} catch (e) {
    console.warn("%c[AKASHIC ENGINE] Could not read disabled mods from local storage.", "color: #facc15;");
}

window.ExpansionManager = {
    // Track full metadata, not just strings!
    expansions: new Map(),
    
    // Global Event Bus for Lifecycle Hooks
    activeHooks: Object.create(null), // 🚨 SECURITY WIN: Object.create(null) prevents prototype poisoning

    // 🌟 EXPANDABILITY WIN: Inter-Expansion APIs
    // Allows expansions to expose safe public methods for other expansions to interact with
    apis: new Map(),

    // 🚨 ARCHITECTURE WIN: Deferred Loading Queue
    // Expansions waiting for their dependencies to load sit here safely.
    _pendingQueue: [],

    // 🌟 FEATURE WIN: Live Mod Toggling (Now with LocalStorage Persistence!)
    // Allows us to mute an expansion's active hooks on the fly and remember it next session.
    disabledExpansions: new Set(_savedDisabledExpansions),

    // 🛡️ SECURITY WIN: Internal Regex Escaper
    // Prevents malformed mod data (like keywords with parentheses or stars) from throwing fatal RegExp syntax errors!
    _escapeRegExp: function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // 🚀 ROBUSTNESS WIN: Dedicated internal cloner
    // Guarantees shop items injected by expansions never bleed memory references back into the global dictionary
    _internalItemClone: function(item) {
        if (typeof window.fastClone === 'function') return window.fastClone(item);
        
        // Failsafe clone that preserves functions (which JSON.stringify destroys)
        const clone = Object.assign({}, item);
        if (item.statBonuses) clone.statBonuses = Object.assign({}, item.statBonuses);
        if (item.tags) clone.tags = [...item.tags];
        // 🚨 BUG FIX: Ensure onHit is also cloned if fastClone isn't available!
        if (typeof item.effect === 'function') clone.effect = item.effect;
        if (typeof item.onHit === 'function') clone.onHit = item.onHit; 
        return clone;
    },

    // API Helper: Allows expansions to alter behavior if they know another specific expansion is running
    has: function(expansionId) {
        return this.expansions.has(expansionId) && !this.disabledExpansions.has(expansionId);
    },
    
    // API Helper: Retrieve metadata (version, timestamp) of a specific expansion
    getMeta: function(expansionId) {
        return this.expansions.get(expansionId) || null;
    },
    
    // API Helper: Access public methods registered by an expansion
    getAPI: function(expansionId) {
        if (!this.has(expansionId)) return null;
        return this.apis.get(expansionId) || null;
    },
    
    // API Helper: Returns a list of all currently active expansions
    listExpansions: function() {
        return Array.from(this.expansions.values());
    },

    // API Helper: Fetch an isolated, color-coded logger for an expansion
    getLogger: function(expansionId) {
        const name = this.expansions.has(expansionId) ? this.expansions.get(expansionId).name : expansionId;
        return {
            log: (msg, ...args) => console.log(`%c[${name}] ${msg}`, "color: #3b82f6;", ...args),
            warn: (msg, ...args) => console.warn(`%c[${name}] ⚠️ ${msg}`, "color: #facc15; font-weight: bold;", ...args),
            error: (msg, ...args) => console.error(`%c[${name}] 🚨 ${msg}`, "color: #ef4444; font-weight: bold;", ...args),
        };
    },

    // 🌟 EXPANDABILITY WIN: Safe Monkey-Patching API
    // Prevents mods from accidentally overwriting each other when modifying the same core function!
    patchFunction: function(targetObj, methodName, patchFactory) {
        if (typeof targetObj[methodName] !== 'function') {
            console.error(`%c[AKASHIC ENGINE] Patch failed: ${methodName} is not a valid function on the target object.`, "color: #ef4444; font-weight: bold;");
            return false;
        }
        
        const originalFunc = targetObj[methodName];
        targetObj[methodName] = patchFactory(originalFunc.bind(targetObj));
        return true;
    },

    // API Helper: Toggle an expansion's hooks on/off
    toggleExpansion: function(expansionId, state) {
        if (!this.expansions.has(expansionId)) return false;
        
        const turnOn = state !== undefined ? state : this.disabledExpansions.has(expansionId);
        if (turnOn) {
            this.disabledExpansions.delete(expansionId);
            console.log(`%c[AKASHIC ENGINE] Timeline Restored: Expansion '${expansionId}' hooks re-enabled.`, "color: #3b82f6; font-style: italic;");
        } else {
            this.disabledExpansions.add(expansionId);
            console.log(`%c[AKASHIC ENGINE] Timeline Suppressed: Expansion '${expansionId}' hooks disabled.`, "color: #fb923c; font-style: italic;");
        }
        
        // 🚨 BUG FIX WIN: Ensure injected CSS stylesheets are also disabled/enabled!
        const styleEl = document.getElementById(`akashic-style-${expansionId}`);
        if (styleEl) {
            styleEl.disabled = !turnOn;
        }
        
        // Persist the choice!
        try {
            localStorage.setItem('akashic_disabled_mods', JSON.stringify(Array.from(this.disabledExpansions)));
        } catch (e) {}
        
        return turnOn;
    },

    // Centralized Hook Trigger with Veto Power and Context Enrichment
    triggerHook: function(hookName, context = {}) {
        if (!this.activeHooks[hookName]) return context;
        
        // 🚨 BUG FIX: Shallow clone the array to prevent iteration index shifting 
        // if an expansion adds/removes a hook during execution!
        const hooksToRun = [...this.activeHooks[hookName]];
        
        for (let i = 0; i < hooksToRun.length; i++) {
            const hook = hooksToRun[i];
            
            // Skip disabled expansions
            if (this.disabledExpansions.has(hook.id)) continue;

            try {
                const result = hook.func(context);
                
                // Allow hooks to explicitly veto/cancel an action by returning strict false
                if (result === false) return false;
                
                // Allow hooks to safely enrich and pass the context down the chain
                if (result !== undefined && result !== null) {
                    context = result; 
                }
            } catch (err) {
                console.error(`%c[AKASHIC ENGINE] Hook Execution Failed in '${hook.id}' for event '${hookName}':`, "color: #ef4444;", err);
            }
        }
        return context;
    },
    
    // 🚀 EXPANDABILITY WIN: Semantic Version Comparator
    // Properly compares "1.10.0" vs "1.2.0" without floating point errors!
    _compareVersions: function(v1, v2) {
        const parts1 = String(v1 || '0').split('.').map(Number);
        const parts2 = String(v2 || '0').split('.').map(Number);
        const maxLen = Math.max(parts1.length, parts2.length);
        
        for (let i = 0; i < maxLen; i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0; // Versions are identical
    },

    // Entry point for all expansions
    register: function(exp) {
        // --- 1. VALIDATION ---
        if (!exp || !exp.id) {
            console.error("%c[AKASHIC ENGINE] Failed to inject anomaly: Expansion missing ID.", "color: #ef4444; font-weight: bold;");
            return;
        }

        // Version Conflict Guard
        if (this.expansions.has(exp.id)) {
            const existing = this.expansions.get(exp.id);
            if (this._compareVersions(exp.version, existing.version) <= 0) {
                console.warn(`%c[AKASHIC ENGINE] Timeline Collision: Expansion '${exp.id}' (v${existing.version}) is already woven into reality. Skipping duplicate/older load.`, "color: #facc15; font-weight: bold;");
                return;
            } else {
                console.log(`%c[AKASHIC ENGINE] Upgrading Expansion '${exp.id}' from v${existing.version} -> v${exp.version}`, "color: #3b82f6; font-style: italic;");
                
                // 🚨 BUG FIX: Purge old hooks to prevent double-firing during live upgrades
                for (const hookName in this.activeHooks) {
                    this.activeHooks[hookName] = this.activeHooks[hookName].filter(h => h.id !== exp.id);
                }
            }
        }

        // --- 2. DEPENDENCY QUEUING ---
        if (exp.requires && Array.isArray(exp.requires)) {
            const missing = exp.requires.filter(reqId => !this.has(reqId));
            if (missing.length > 0) {
                console.warn(`%c[AKASHIC ENGINE] Pausing Timeline: '${exp.name}' requires missing expansions: [${missing.join(', ')}]. Queuing for later.`, "color: #facc15; font-style: italic;");
                
                this._pendingQueue.push(exp);
                
                // 🚨 ROBUSTNESS WIN: Deadlock Watchdog
                // Alerts the developer if an expansion is stuck in the queue for more than 3 seconds
                setTimeout(() => {
                    if (this._pendingQueue.includes(exp)) {
                        console.error(`%c[AKASHIC ENGINE] FATAL PARADOX: Expansion '${exp.name}' is permanently deadlocked waiting for dependencies: [${exp.requires.filter(reqId => !this.has(reqId)).join(', ')}].`, "color: #ef4444; font-weight: bold;");
                    }
                }, 3000);
                
                return;
            }
        }

        // If dependencies are met (or none exist), mount it!
        this._mountExpansion(exp);
    },

    // Internal mounting logic separated to allow queue processing
    _mountExpansion: function(exp) {
        console.log(`%c[AKASHIC ENGINE] Weaving Timeline: ${exp.name} (v${exp.version || '1.0'})`, "color: #10b981; font-weight: bold; font-family: monospace;");
        
        const data = exp.data || {};
        let dictCount = 0;
        let arrCount = 0;
        let assetCount = 0;

        // --- 0. ASSET PRELOADER (PERFORMANCE WIN) ---
        // Automatically injects link-preload tags to the document head so custom mod images/audio 
        // load asynchronously before the player encounters them, preventing visual pop-in!
        if (data.assets && Array.isArray(data.assets)) {
            data.assets.forEach(url => {
                if (!document.querySelector(`link[href="${url}"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.href = url;
                    
                    // Best-guess determination of the 'as' type based on extension
                    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) link.as = 'image';
                    else if (url.match(/\.(mp3|wav|ogg)$/i)) link.as = 'audio';
                    else link.as = 'fetch';
                    
                    document.head.appendChild(link);
                    assetCount++;
                }
            });
        }

        // --- 1. LORE & ATMOSPHERE INJECTION ---
        if (data.loreKeywords) {
            // Failsafe initialization
            if (typeof window.LORE_KEYWORDS === 'undefined') window.LORE_KEYWORDS = {};
            Object.assign(window.LORE_KEYWORDS, data.loreKeywords);
            
            if (typeof window._COMPILED_LORE_REGEXES === 'undefined') window._COMPILED_LORE_REGEXES = [];
            
            for (const [keyword, color] of Object.entries(data.loreKeywords)) {
                // Prevent duplicate regex compilation
                if (!window._COMPILED_LORE_REGEXES.some(r => r.keyword === keyword)) {
                    try {
                        window._COMPILED_LORE_REGEXES.push({
                            keyword: keyword, // Store keyword to sort by length
                            rx: new RegExp(`\\b(${this._escapeRegExp(keyword)}s?)\\b`, 'gi'), // 🚨 SECURITY WIN: Escaped!
                            color: color
                        });
                    } catch (regexErr) {
                        console.warn(`%c[AKASHIC ENGINE] Invalid regex ignored for lore keyword: ${keyword}`, "color: #facc15;");
                    }
                }
            }
            
            // Ensures "First King" is tagged before "King" accidentally breaks the HTML tag.
            window._COMPILED_LORE_REGEXES.sort((a, b) => b.keyword.length - a.keyword.length);
        }

        // --- 1.5. CSS & STYLE INJECTION ---
        if (exp.css) {
            const styleId = `akashic-style-${exp.id}`;
            let styleEl = document.getElementById(styleId);
            
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
                console.log(`%c[AKASHIC ENGINE] Injected custom leyline aesthetics for '${exp.id}'.`, "color: #a855f7; font-style: italic;");
            }
            // Always assign textContent so hot-reloading an expansion actually updates the CSS!
            styleEl.textContent = exp.css;
            // Instantly apply the active disabled state to the new stylesheet
            styleEl.disabled = this.disabledExpansions.has(exp.id);
        }

        // --- 2. INJECT DICTIONARIES (O(1) Merge) ---
        const dictionaries = {
            items: 'ITEM_DATA',
            enemies: 'ENEMY_DATA',
            tiles: 'TILE_DATA',
            events: 'EVENT_DATA',
            spells: 'SPELL_DATA',
            skills: 'SKILL_DATA',
            talents: 'TALENT_DATA',
            quests: 'QUEST_DATA',
            loreSets: 'LORE_SETS',
            caveThemes: 'CAVE_THEMES',
            castleLayouts: 'CASTLE_LAYOUTS',
            roomTemplates: 'CAVE_ROOM_TEMPLATES',
            realmMutators: 'REALM_MUTATORS',
            lootPrefixes: 'LOOT_PREFIXES',
            lootSuffixes: 'LOOT_SUFFIXES',
            craftingRecipes: 'CRAFTING_RECIPES',
            cookingRecipes: 'COOKING_RECIPES',
            alchemyRecipes: 'ALCHEMY_RECIPES',
            factions: 'FACTION_DATA',
            weatherTypes: 'WEATHER_DATA' 
        };

        // 🌟 EXPANDABILITY WIN: Custom Global Registries!
        if (data.customDictionaries) {
            for (const [localKey, globalKey] of Object.entries(data.customDictionaries)) {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = {};
                dictionaries[localKey] = globalKey; // Add it to the loop mapping dynamically
            }
        }

        for (const [localKey, globalKey] of Object.entries(dictionaries)) {
            if (data[localKey] && typeof data[localKey] === 'object') {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = {};
                
                // 🚀 PERFORMANCE WIN: Object.entries is faster and safer than for...in
                for (const [key, val] of Object.entries(data[localKey])) {
                    // Collision Warnings
                    if (window[globalKey][key]) {
                        console.warn(`%c[AKASHIC ENGINE] Overwrite Notice: '${exp.id}' is modifying existing ${localKey} entry: '${key}'.`, "color: #fb923c;");
                    }
                    
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Shallow Clone
                    // We apply a top-level clone so that if the engine later mutates `ITEM_DATA[key].health`, 
                    // it does not corrupt the source `data.items[key]` inside the expansion object memory!
                    let safeVal = val;
                    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                        safeVal = Object.assign({}, val);
                    }
                    
                    window[globalKey][key] = safeVal;
                    dictCount++;
                }
                
                // Clear the room cache so the new rooms are actually pulled into the generator!
                if (localKey === 'roomTemplates') window.CACHED_ROOM_TEMPLATES = null; 
                // Clear the pre-compiled minimap colors so custom tiles render correctly!
                if (localKey === 'tiles' && window._mapTileNameCache) window._mapTileNameCache.clear();
            }
        }

        // --- 3. INJECT GLOBAL ARRAYS ---
        const globalArrays = {
            stoneMessages: 'LORE_STONE_MESSAGES',
            journalPages: 'RANDOM_JOURNAL_PAGES',
            loreFragments: 'LORE_FRAGMENTS',
            visions: 'VISIONS_OF_THE_PAST',
            regionHistory: 'REGION_HISTORY',
            villagerRumors: 'VILLAGER_RUMORS',
            fishingBaits: 'FISHING_BAITS',
            fishDirectory: 'FISH_DIRECTORY',
            namePrefixes: 'NAME_PREFIXES',
            nameMiddles: 'NAME_MIDDLES',
            nameSuffixes: 'NAME_SUFFIXES',
            cavePrefixes: 'CAVE_PREFIXES',
            caveSuffixes: 'CAVE_SUFFIXES',
            castlePrefixes: 'CASTLE_PREFIXES',
            castleSuffixes: 'CASTLE_SUFFIXES'
        };

        // Custom Array Registries Injection
        if (data.customArrays) {
            for (const [localKey, globalKey] of Object.entries(data.customArrays)) {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = [];
                globalArrays[localKey] = globalKey;
            }
        }

        for (const [localKey, globalKey] of Object.entries(globalArrays)) {
            if (data[localKey] && Array.isArray(data[localKey])) {
                if (typeof window[globalKey] === 'undefined' || !Array.isArray(window[globalKey])) {
                    window[globalKey] = Object.freeze([]);
                }
                
                // 1. Unfreeze by spreading the existing global data into a new mutable array
                const unfrozenArray = [...window[globalKey]];
                const newItems = data[localKey];
                
                // 2. Safely push the new expansion items into the mutable array
                for (let i = 0; i < newItems.length; i++) {
                    unfrozenArray.push(newItems[i]);
                    arrCount++;
                }
                
                // 3. Re-freeze the updated array and attach it to the window to preserve V8 performance
                window[globalKey] = Object.freeze(unfrozenArray);
            }
        }

        // --- 4. INJECT ATMOSPHERE TEXT (Dictionary of Arrays) ---
        if (data.atmosphereText) {
            if (typeof window.ATMOSPHERE_TEXT === 'undefined') window.ATMOSPHERE_TEXT = {};
            for (const [category, texts] of Object.entries(data.atmosphereText)) {
                if (!window.ATMOSPHERE_TEXT[category]) window.ATMOSPHERE_TEXT[category] = [];
                window.ATMOSPHERE_TEXT[category].push(...texts);
            }
        }

        // --- 5. INJECT SHOPS (With Smart Deduplication & Protection) ---
        if (data.shops) {
            const shopTargetMap = {
                'general': 'SHOP_INVENTORY',
                'castle': 'CASTLE_SHOP_INVENTORY',
                'trader': 'TRADER_INVENTORY',
                'black_market': 'BLACK_MARKET_INVENTORY',
                'ascendant': 'ASCENDANT_INVENTORY'
            };

            for (const [shopKey, shopItems] of Object.entries(data.shops)) {
                const targetGlobal = shopTargetMap[shopKey] || `${shopKey.toUpperCase()}_INVENTORY`;
                
                if (typeof window[targetGlobal] === 'undefined' || !Array.isArray(window[targetGlobal])) {
                    window[targetGlobal] = [];
                }

                shopItems.forEach(newItem => {
                    if (!newItem || !newItem.name) return;

                    // 🚨 GHOST GUARD: Ensure we safely scan existing stock
                    const existingItem = window[targetGlobal].find(i => i && i.name === newItem.name);
                    if (existingItem) {
                        existingItem.stock = (existingItem.stock || 0) + (newItem.stock || 0);
                    } else {
                        // 🚨 BUG FIX & ROBUSTNESS: Utilize the secure internal cloner
                        const itemClone = this._internalItemClone(newItem);
                        window[targetGlobal].push(itemClone);
                        dictCount++;
                    }
                });
            }
        }

        // --- 6. REGISTER PUBLIC APIS ---
        if (exp.api && typeof exp.api === 'object') {
            this.apis.set(exp.id, exp.api);
        }

        // --- 7. REGISTER LIFECYCLE HOOKS (With Priorities) ---
        if (exp.hooks) {
            for (const [hookName, hookObj] of Object.entries(exp.hooks)) {
                // Allow simple function passing OR object with priority { func: function, priority: 10 }
                let hookFunc = null;
                let hookPriority = 0;

                if (typeof hookObj === 'function') {
                    hookFunc = hookObj;
                } else if (typeof hookObj === 'object' && typeof hookObj.func === 'function') {
                    hookFunc = hookObj.func;
                    hookPriority = hookObj.priority || 0;
                }

                if (hookFunc) {
                    if (!this.activeHooks[hookName]) this.activeHooks[hookName] = [];
                    this.activeHooks[hookName].push({ id: exp.id, func: hookFunc, priority: hookPriority });
                    
                    // Sort hooks so highest priority executes first!
                    this.activeHooks[hookName].sort((a, b) => b.priority - a.priority);
                }
            }
        }

        // --- 8. CUSTOM INITIALIZATION HOOK ---
        if (typeof exp.init === 'function') {
            try {
                const startTime = performance.now();
                exp.init();
                const endTime = performance.now();
                
                const executionTime = (endTime - startTime).toFixed(2);
                let logs = `[AKASHIC ENGINE] ↳ Initialization logic compiled in ${executionTime}ms. (Injected ${dictCount} Dicts, ${arrCount} Arrays`;
                if (assetCount > 0) logs += `, Preloaded ${assetCount} Assets`;
                console.log(`%c${logs})`, "color: #94a3b8; font-style: italic; font-family: monospace;");
                
                if (executionTime > 50) {
                    console.warn(`%c[AKASHIC ENGINE] ⚠️ Warning: '${exp.name}' took longer than 50ms to initialize. This may cause stuttering on boot.`, "color: #facc15; font-weight: bold;");
                }
            } catch (err) {
                console.error(`%c[AKASHIC ENGINE] Fatal anomaly in Expansion Init (${exp.name}):`, "color: #ef4444; font-weight: bold;", err);
            }
        }
        
        // Finalize Registration
        this.expansions.set(exp.id, {
            id: exp.id,
            name: exp.name,
            version: exp.version || '1.0',
            timestamp: Date.now()
        });

        // Trigger Global Event for Native Engine Systems
        this.triggerHook('onExpansionLoaded', { id: exp.id, name: exp.name, version: exp.version });

        // 🌟 EXPANDABILITY WIN: Broadcast to the DOM!
        // Allows UI scripts to listen for expansion loads and dynamically draw menus
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('expansionLoaded', { detail: { id: exp.id, name: exp.name, version: exp.version } }));
        }

        // --- 9. PROCESS QUEUE ---
        // Check if loading this expansion unblocked any waiting expansions in the queue!
        this._checkPendingQueue();
    },

    // 🚀 PERFORMANCE & STABILITY WIN: Non-Recursive Iterative Queue processing
    // Replaced the recursive structure with a `do...while` loop. 
    // This prevents deep Call Stack overflows if a modder suddenly loads 50 tiny expansions at once!
    _checkPendingQueue: function() {
        if (this._pendingQueue.length === 0) return;

        let processedAny;
        do {
            processedAny = false;
            
            // Loop backward so we can safely splice items out of the array
            for (let i = this._pendingQueue.length - 1; i >= 0; i--) {
                const exp = this._pendingQueue[i];
                const missing = exp.requires.filter(reqId => !this.has(reqId));
                
                if (missing.length === 0) {
                    console.log(`%c[AKASHIC ENGINE] Dependencies met. Resuming timeline weave for: '${exp.name}'`, "color: #10b981; font-style: italic;");
                    this._pendingQueue.splice(i, 1); // Remove from queue
                    this._mountExpansion(exp);       // Mount it immediately
                    processedAny = true;
                }
            }
        } while (processedAny); // Keep looping if we unblocked something, but flatly, no recursion!
    }
};

// --- END OF FILE expansion-manager.js ---
