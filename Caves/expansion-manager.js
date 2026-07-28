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
            console.warn(`%c[AKASHIC ENGINE] Timeline Collision: Expansion '${exp.id}' is already loaded. Skipping.`, "color: #facc15; font-weight: bold;");
            return;
        }

        // 🚨 ROBUSTNESS WIN: Dependency Checker
        // Prevents hard crashes if an expansion relies on items/systems from an expansion that was removed!
        if (exp.requires && Array.isArray(exp.requires)) {
            for (let i = 0; i < exp.requires.length; i++) {
                const reqId = exp.requires[i];
                if (!this.has(reqId)) {
                    console.error(`%c[AKASHIC ENGINE] Fatal Sequence: '${exp.name}' requires missing expansion '${reqId}'. Boot aborted.`, "color: #ef4444; font-weight: bold; font-family: monospace;");
                    return;
                }
            }
        }

        console.log(`%c[AKASHIC ENGINE] Weaving Timeline: ${exp.name} (v${exp.version || '1.0'})`, "color: #10b981; font-weight: bold; font-family: monospace;");
        
        const data = exp.data || {};

        // --- 2. INJECT DICTIONARIES (O(1) Merge) ---
        // Expanded to natively support Realm Mutators and Loot Affixes!
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
            lootSuffixes: 'LOOT_SUFFIXES'
        };

        for (const [localKey, globalKey] of Object.entries(dictionaries)) {
            if (data[localKey]) {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = {};
                Object.assign(window[globalKey], data[localKey]);
                
                // 🚨 PERFORMANCE FIX: Clear the room cache so the new rooms are actually pulled into the generator!
                if (localKey === 'roomTemplates') window.CACHED_ROOM_TEMPLATES = null; 
            }
        }

        // --- 3. INJECT LORE ARRAYS ---
        // LORE WIN: Allows expansions to effortlessly sprinkle ambient text into the world
        const textArrays = {
            stoneMessages: 'LORE_STONE_MESSAGES',
            journalPages: 'RANDOM_JOURNAL_PAGES',
            loreFragments: 'LORE_FRAGMENTS',
            visions: 'VISIONS_OF_THE_PAST',
            regionHistory: 'REGION_HISTORY',
            villagerRumors: 'VILLAGER_RUMORS'
        };

        for (const [localKey, globalKey] of Object.entries(textArrays)) {
            if (data[localKey] && Array.isArray(data[localKey])) {
                if (typeof window[globalKey] === 'undefined') window[globalKey] = [];
                window[globalKey].push(...data[localKey]);
            }
        }

        // --- 4. INJECT SHOPS (With Smart Deduplication) ---
        if (data.shops) {
            for (const shopKey in data.shops) {
                const targetGlobal = shopKey === 'general' ? 'SHOP_INVENTORY' : `${shopKey.toUpperCase()}_INVENTORY`;
                
                // If the array doesn't exist globally yet, create it!
                if (typeof window[targetGlobal] === 'undefined') {
                    window[targetGlobal] = [];
                }

                // 🚨 BUG FIX WIN: Deduplicate Shop Injections
                // If two expansions add 'Healing Potion', merge their stock safely instead of duplicating UI rows!
                data.shops[shopKey].forEach(newItem => {
                    const existingItem = window[targetGlobal].find(i => i.name === newItem.name);
                    if (existingItem) {
                        // Accumulate stock
                        existingItem.stock = (existingItem.stock || 0) + (newItem.stock || 0);
                    } else {
                        // Safe clone to prevent memory leaks from the expansion object
                        const itemClone = typeof window.fastClone === 'function' ? window.fastClone(newItem) : JSON.parse(JSON.stringify(newItem));
                        window[targetGlobal].push(itemClone);
                    }
                });
            }
        }

        // --- 5. CUSTOM INITIALIZATION HOOK ---
        // Runs arbitrary code (like modifying the Homstead menus, adding Crafting Recipes, or tweaking World Gen)
        if (typeof exp.init === 'function') {
            try {
                exp.init();
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
