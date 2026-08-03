// --- START OF FILE expansion-manager.js ---

// ==========================================
// AKASHIC ENGINE: EXPANSION INJECTOR
// ==========================================

window.ExpansionManager = {
    // 🚨 ARCHITECTURE WIN: Track full metadata, not just strings!
    expansions: new Map(),
    
    // 🌟 EXPANDABILITY WIN: Global Event Bus for Lifecycle Hooks
    // Allows expansions to passively listen to core game events without monkey-patching!
    activeHooks: {},

    // API Helper: Allows expansions to alter behavior if they know another specific expansion is running
    has: function(expansionId) {
        return this.expansions.has(expansionId);
    },

    // 🌟 EXPANDABILITY WIN: Centralized Hook Trigger
    // The core engine can call ExpansionManager.triggerHook('onPlayerDeath', gameState) 
    // and all listening expansions will fire automatically.
    triggerHook: function(hookName, context = {}) {
        if (!this.activeHooks[hookName]) return context;
        
        for (let i = 0; i < this.activeHooks[hookName].length; i++) {
            const hook = this.activeHooks[hookName][i];
            try {
                hook.func(context);
            } catch (err) {
                console.error(`%c[AKASHIC ENGINE] Hook Execution Failed in '${hook.id}' for event '${hookName}':`, "color: #ef4444;", err);
            }
        }
        return context;
    },

    register: function(exp) {
        // --- 1. VALIDATION & DEPENDENCIES ---
        if (!exp || !exp.id) {
            console.error("%c[AKASHIC ENGINE] Failed to inject anomaly: Expansion missing ID.", "color: #ef4444; font-weight: bold;");
            return;
        }

        // 🚨 ROBUSTNESS WIN: Version Conflict Guard
        if (this.has(exp.id)) {
            const existing = this.expansions.get(exp.id);
            if (parseFloat(exp.version || 0) <= parseFloat(existing.version || 0)) {
                console.warn(`%c[AKASHIC ENGINE] Timeline Collision: Expansion '${exp.id}' (v${existing.version}) is already woven into reality. Skipping duplicate/older load.`, "color: #facc15; font-weight: bold;");
                return;
            } else {
                console.log(`%c[AKASHIC ENGINE] Upgrading Expansion '${exp.id}' from v${existing.version} -> v${exp.version}`, "color: #3b82f6; font-style: italic;");
            }
        }

        // Dependency Checker
        // Prevents hard crashes if an expansion relies on items/systems from an expansion that was removed!
        if (exp.requires && Array.isArray(exp.requires)) {
            for (let i = 0; i < exp.requires.length; i++) {
                const reqId = exp.requires[i];
                if (!this.has(reqId)) {
                    console.error(`%c[AKASHIC ENGINE] Fatal Sequence: '${exp.name}' requires missing expansion '${reqId}'. Boot aborted.\n(Hint: Ensure '${reqId}' is loaded above '${exp.id}' in your HTML file!)`, "color: #ef4444; font-weight: bold; font-family: monospace;");
                    return;
                }
            }
        }

        console.log(`%c[AKASHIC ENGINE] Weaving Timeline: ${exp.name} (v${exp.version || '1.0'})`, "color: #10b981; font-weight: bold; font-family: monospace;");
        
        const data = exp.data || {};

        // --- 2. LORE & ATMOSPHERE INJECTION ---
        // 🌟 LORE WIN: Dynamically append new color-coded keywords to the game's auto-tagging system!
        if (data.loreKeywords && typeof window.LORE_KEYWORDS !== 'undefined') {
            Object.assign(window.LORE_KEYWORDS, data.loreKeywords);
            
            // Safely push to the compiled regex cache so it works instantly without a reload
            if (typeof window._COMPILED_LORE_REGEXES !== 'undefined' && Array.isArray(window._COMPILED_LORE_REGEXES)) {
                for (const [keyword, color] of Object.entries(data.loreKeywords)) {
                    window._COMPILED_LORE_REGEXES.push({
                        rx: new RegExp(`\\b(${keyword}s?)\\b`, 'gi'),
                        color: color
                    });
                }
            }
        }

        // --- 3. INJECT DICTIONARIES (O(1) Merge) ---
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
            if (data[localKey]) {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = {};
                Object.assign(window[globalKey], data[localKey]);
                
                // 🚨 PERFORMANCE FIX: Clear the room cache so the new rooms are actually pulled into the generator!
                if (localKey === 'roomTemplates') window.CACHED_ROOM_TEMPLATES = null; 
            }
        }

        // --- 4. INJECT GLOBAL ARRAYS ---
        const globalArrays = {
            stoneMessages: 'LORE_STONE_MESSAGES',
            journalPages: 'RANDOM_JOURNAL_PAGES',
            loreFragments: 'LORE_FRAGMENTS',
            visions: 'VISIONS_OF_THE_PAST',
            regionHistory: 'REGION_HISTORY',
            villagerRumors: 'VILLAGER_RUMORS',
            fishingBaits: 'FISHING_BAITS',
            fishDirectory: 'FISH_DIRECTORY'
        };

        for (const [localKey, globalKey] of Object.entries(globalArrays)) {
            if (data[localKey] && Array.isArray(data[localKey])) {
                // 🚨 STABILITY WIN: Strict Type Enforcement
                if (typeof window[globalKey] === 'undefined' || !Array.isArray(window[globalKey])) {
                    window[globalKey] = [];
                }
                
                const targetArray = window[globalKey];
                const newItems = data[localKey];
                
                // Safe Iterative Push avoids "Maximum call stack size exceeded" on huge arrays
                for (let i = 0; i < newItems.length; i++) {
                    targetArray.push(newItems[i]);
                }
            }
        }

        // --- 5. INJECT SHOPS (With Smart Deduplication) ---
        if (data.shops) {
            for (const shopKey in data.shops) {
                const targetGlobal = shopKey === 'general' ? 'SHOP_INVENTORY' : `${shopKey.toUpperCase()}_INVENTORY`;
                
                if (typeof window[targetGlobal] === 'undefined' || !Array.isArray(window[targetGlobal])) {
                    window[targetGlobal] = [];
                }

                data.shops[shopKey].forEach(newItem => {
                    const existingItem = window[targetGlobal].find(i => i.name === newItem.name);
                    if (existingItem) {
                        // Accumulate stock gracefully instead of rendering duplicates
                        existingItem.stock = (existingItem.stock || 0) + (newItem.stock || 0);
                    } else {
                        // Safe clone to prevent memory leaks from the expansion object bleeding into live shops
                        const itemClone = typeof window.fastClone === 'function' ? window.fastClone(newItem) : JSON.parse(JSON.stringify(newItem));
                        window[targetGlobal].push(itemClone);
                    }
                });
            }
        }

        // --- 6. REGISTER LIFECYCLE HOOKS ---
        if (exp.hooks) {
            for (const [hookName, hookFunc] of Object.entries(exp.hooks)) {
                if (typeof hookFunc === 'function') {
                    if (!this.activeHooks[hookName]) this.activeHooks[hookName] = [];
                    this.activeHooks[hookName].push({ id: exp.id, func: hookFunc });
                }
            }
        }

        // --- 7. CUSTOM INITIALIZATION HOOK ---
        if (typeof exp.init === 'function') {
            try {
                // ⏱️ PERFORMANCE PROFILER
                const startTime = performance.now();
                exp.init();
                const endTime = performance.now();
                
                const executionTime = (endTime - startTime).toFixed(2);
                console.log(`%c[AKASHIC ENGINE] ↳ Initialization logic compiled in ${executionTime}ms.`, "color: #94a3b8; font-style: italic; font-family: monospace;");
                
                if (executionTime > 50) {
                    console.warn(`%c[AKASHIC ENGINE] ⚠️ Warning: '${exp.name}' took longer than 50ms to initialize. This may cause stuttering on boot.`, "color: #facc15; font-weight: bold;");
                }
            } catch (err) {
                console.error(`%c[AKASHIC ENGINE] Fatal anomaly in Expansion Init (${exp.name}):`, "color: #ef4444; font-weight: bold;", err);
            }
        }
        
        // Finalize Registration
        this.expansions.set(exp.id, {
            name: exp.name,
            version: exp.version || '1.0',
            timestamp: Date.now()
        });
    }
};

// --- END OF FILE expansion-manager.js ---
