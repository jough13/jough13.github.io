// --- START OF FILE expansion-manager.js ---

// ==========================================
// AKASHIC ENGINE: EXPANSION INJECTOR
// ==========================================

window.ExpansionManager = {
    // Track full metadata, not just strings!
    expansions: new Map(),
    
    // Global Event Bus for Lifecycle Hooks
    activeHooks: {},

    // 🚨 ARCHITECTURE WIN: Deferred Loading Queue
    // Expansions waiting for their dependencies to load sit here safely.
    _pendingQueue: [],

    // API Helper: Allows expansions to alter behavior if they know another specific expansion is running
    has: function(expansionId) {
        return this.expansions.has(expansionId);
    },
    
    // API Helper: Retrieve metadata (version, timestamp) of a specific expansion
    getMeta: function(expansionId) {
        return this.expansions.get(expansionId) || null;
    },
    
    // API Helper: Returns a list of all currently active expansions
    listExpansions: function() {
        return Array.from(this.expansions.values());
    },

    // Centralized Hook Trigger with Veto Power and Context Enrichment
    triggerHook: function(hookName, context = {}) {
        if (!this.activeHooks[hookName]) return context;
        
        // 🚨 BUG FIX: Shallow clone the array to prevent iteration index shifting 
        // if an expansion adds/removes a hook during execution!
        const hooksToRun = [...this.activeHooks[hookName]];
        
        for (let i = 0; i < hooksToRun.length; i++) {
            const hook = hooksToRun[i];
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
        if (this.has(exp.id)) {
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
                            rx: new RegExp(`\\b(${keyword}s?)\\b`, 'gi'),
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
            alchemyRecipes: 'ALCHEMY_RECIPES'
        };

        for (const [localKey, globalKey] of Object.entries(dictionaries)) {
            if (data[localKey] && typeof data[localKey] === 'object') {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = {};
                
                for (const key in data[localKey]) {
                    if (Object.prototype.hasOwnProperty.call(data[localKey], key)) {
                        // Collision Warnings
                        if (window[globalKey][key]) {
                            console.warn(`%c[AKASHIC ENGINE] Overwrite Notice: '${exp.id}' is modifying existing ${localKey} entry: '${key}'.`, "color: #fb923c;");
                        }
                        window[globalKey][key] = data[localKey][key];
                        dictCount++;
                    }
                }
                
                // Clear the room cache so the new rooms are actually pulled into the generator!
                if (localKey === 'roomTemplates') window.CACHED_ROOM_TEMPLATES = null; 
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

        for (const [localKey, globalKey] of Object.entries(globalArrays)) {
            if (data[localKey] && Array.isArray(data[localKey])) {
                if (typeof window[globalKey] === 'undefined' || !Array.isArray(window[globalKey])) {
                    window[globalKey] = [];
                }
                
                const targetArray = window[globalKey];
                const newItems = data[localKey];
                
                for (let i = 0; i < newItems.length; i++) {
                    targetArray.push(newItems[i]);
                    arrCount++;
                }
            }
        }

        // --- 4. INJECT ATMOSPHERE TEXT (Dictionary of Arrays) ---
        if (data.atmosphereText) {
            if (typeof window.ATMOSPHERE_TEXT === 'undefined') window.ATMOSPHERE_TEXT = {};
            for (const category in data.atmosphereText) {
                if (Object.prototype.hasOwnProperty.call(data.atmosphereText, category)) {
                    if (!window.ATMOSPHERE_TEXT[category]) window.ATMOSPHERE_TEXT[category] = [];
                    window.ATMOSPHERE_TEXT[category].push(...data.atmosphereText[category]);
                }
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

            for (const shopKey in data.shops) {
                if (!Object.prototype.hasOwnProperty.call(data.shops, shopKey)) continue;

                const targetGlobal = shopTargetMap[shopKey] || `${shopKey.toUpperCase()}_INVENTORY`;
                
                if (typeof window[targetGlobal] === 'undefined' || !Array.isArray(window[targetGlobal])) {
                    window[targetGlobal] = [];
                }

                data.shops[shopKey].forEach(newItem => {
                    if (!newItem || !newItem.name) return;

                    // 🚨 GHOST GUARD: Ensure we safely scan existing stock
                    const existingItem = window[targetGlobal].find(i => i && i.name === newItem.name);
                    if (existingItem) {
                        existingItem.stock = (existingItem.stock || 0) + (newItem.stock || 0);
                    } else {
                        // 🚨 BUG FIX & ROBUSTNESS: Use Object.assign instead of JSON stringify
                        // If a modder puts a custom function inside a shop item, stringify deletes it.
                        const itemClone = typeof window.fastClone === 'function' ? window.fastClone(newItem) : Object.assign({}, newItem);
                        window[targetGlobal].push(itemClone);
                        dictCount++;
                    }
                });
            }
        }

        // --- 6. REGISTER LIFECYCLE HOOKS (With Priorities) ---
        if (exp.hooks) {
            for (const hookName in exp.hooks) {
                if (Object.prototype.hasOwnProperty.call(exp.hooks, hookName)) {
                    const hookObj = exp.hooks[hookName];
                    
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
        }

        // --- 7. CUSTOM INITIALIZATION HOOK ---
        if (typeof exp.init === 'function') {
            try {
                const startTime = performance.now();
                exp.init();
                const endTime = performance.now();
                
                const executionTime = (endTime - startTime).toFixed(2);
                console.log(`%c[AKASHIC ENGINE] ↳ Initialization logic compiled in ${executionTime}ms. (Injected ${dictCount} Dicts, ${arrCount} Arrays)`, "color: #94a3b8; font-style: italic; font-family: monospace;");
                
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

        // --- 8. PROCESS QUEUE ---
        // Check if loading this expansion unblocked any waiting expansions in the queue!
        this._checkPendingQueue();
    },

    // Recursively processes the queue to load any deferred expansions whose dependencies are now met
    _checkPendingQueue: function() {
        if (this._pendingQueue.length === 0) return;

        let processedAny = false;

        // Loop backward so we can safely splice items out of the array
        for (let i = this._pendingQueue.length - 1; i >= 0; i--) {
            const exp = this._pendingQueue[i];
            const missing = exp.requires.filter(reqId => !this.has(reqId));
            
            if (missing.length === 0) {
                console.log(`%c[AKASHIC ENGINE] Dependencies met. Resuming timeline weave for: '${exp.name}'`, "color: #10b981; font-style: italic;");
                this._pendingQueue.splice(i, 1); // Remove from queue
                this._mountExpansion(exp);       // Mount it
                processedAny = true;
            }
        }

        // If an expansion was mounted, it might have unblocked ANOTHER expansion, so check again!
        if (processedAny) {
            this._checkPendingQueue();
        }
    }
};

// --- END OF FILE expansion-manager.js ---
