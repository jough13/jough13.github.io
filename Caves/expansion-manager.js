// --- START OF FILE expansion-manager.js ---

// ==========================================
// AKASHIC ENGINE: EXPANSION INJECTOR
// ==========================================

window.ExpansionManager = {
    // 🚨 ARCHITECTURE WIN: Track full metadata, not just strings!
    expansions: new Map(),
    
    // API Helper: Allows expansions to alter behavior if they know another specific expansion is running!
    has: function(expansionId) {
        return this.expansions.has(expansionId);
    },

    register: function(exp) {
        // --- 1. VALIDATION & DEPENDENCIES ---
        if (!exp || !exp.id) {
            console.error("%c[AKASHIC ENGINE] Failed to inject anomaly: Expansion missing ID.", "color: #ef4444; font-weight: bold;");
            return;
        }

        if (this.has(exp.id)) {
            console.warn(`%c[AKASHIC ENGINE] Timeline Collision: Expansion '${exp.id}' is already woven into reality. Skipping.`, "color: #facc15; font-weight: bold;");
            return;
        }

        // 🚨 ROBUSTNESS WIN: Dependency Checker
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

        // --- 2. INJECT DICTIONARIES (O(1) Merge) ---
        // 🌟 EXPANDABILITY WIN: Natively supports crafting, cooking, and alchemy recipes!
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

        // --- 3. INJECT GLOBAL ARRAYS ---
        // LORE WIN: Allows expansions to effortlessly sprinkle ambient text into the world
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
                // Guarantees the target is actually an Array before we start pushing to it!
                if (typeof window[globalKey] === 'undefined' || !Array.isArray(window[globalKey])) {
                    window[globalKey] = [];
                }
                
                const targetArray = window[globalKey];
                const newItems = data[localKey];
                
                // 🚨 ROBUSTNESS & BUG FIX WIN: Safe Iterative Push
                // Replaced the ES6 spread operator `targetArray.push(...newItems)` with a strict loop.
                // If an expansion pushes an array with 100,000+ lore entries, the spread operator will
                // instantly crash the V8 Engine with a "Maximum call stack size exceeded" error!
                for (let i = 0; i < newItems.length; i++) {
                    targetArray.push(newItems[i]);
                }
            }
        }

        // --- 4. INJECT SHOPS (With Smart Deduplication) ---
        if (data.shops) {
            for (const shopKey in data.shops) {
                const targetGlobal = shopKey === 'general' ? 'SHOP_INVENTORY' : `${shopKey.toUpperCase()}_INVENTORY`;
                
                // If the array doesn't exist globally yet, create it!
                if (typeof window[targetGlobal] === 'undefined' || !Array.isArray(window[targetGlobal])) {
                    window[targetGlobal] = [];
                }

                // 🚨 BUG FIX WIN: Deduplicate Shop Injections
                // If two expansions add 'Healing Potion', merge their stock safely instead of duplicating UI rows!
                data.shops[shopKey].forEach(newItem => {
                    const existingItem = window[targetGlobal].find(i => i.name === newItem.name);
                    if (existingItem) {
                        // Accumulate stock gracefully
                        existingItem.stock = (existingItem.stock || 0) + (newItem.stock || 0);
                    } else {
                        // Safe clone to prevent memory leaks from the expansion object bleeding into live shops
                        const itemClone = typeof window.fastClone === 'function' ? window.fastClone(newItem) : JSON.parse(JSON.stringify(newItem));
                        window[targetGlobal].push(itemClone);
                    }
                });
            }
        }

        // --- 5. CUSTOM INITIALIZATION HOOK ---
        // Runs arbitrary code (like modifying the Homestead menus or tweaking World Gen natively)
        if (typeof exp.init === 'function') {
            try {
                // ⏱️ PERFORMANCE PROFILER: Track exact millisecond execution time
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
