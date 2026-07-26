// --- START OF FILE expansion-manager.js ---

// ==========================================
// AKASHIC ENGINE: EXPANSION INJECTOR
// ==========================================

window.ExpansionManager = {
    expansions: [],
    
    register: function(exp) {
        console.log(`%c[AKASHIC ENGINE] Injecting Expansion: ${exp.name} (v${exp.version})`, "color: #10b981; font-weight: bold; font-family: monospace;");
        
        const data = exp.data || {};

        // --- 1. INJECT DICTIONARIES (O(1) Merge) ---
        if (data.items && typeof window.ITEM_DATA !== 'undefined') Object.assign(window.ITEM_DATA, data.items);
        if (data.enemies && typeof window.ENEMY_DATA !== 'undefined') Object.assign(window.ENEMY_DATA, data.enemies);
        if (data.tiles && typeof window.TILE_DATA !== 'undefined') Object.assign(window.TILE_DATA, data.tiles);
        if (data.events && typeof window.EVENT_DATA !== 'undefined') Object.assign(window.EVENT_DATA, data.events);
        if (data.spells && typeof window.SPELL_DATA !== 'undefined') Object.assign(window.SPELL_DATA, data.spells);
        if (data.skills && typeof window.SKILL_DATA !== 'undefined') Object.assign(window.SKILL_DATA, data.skills);
        if (data.talents && typeof window.TALENT_DATA !== 'undefined') Object.assign(window.TALENT_DATA, data.talents);
        if (data.quests && typeof window.QUEST_DATA !== 'undefined') Object.assign(window.QUEST_DATA, data.quests);
        if (data.loreSets && typeof window.LORE_SETS !== 'undefined') Object.assign(window.LORE_SETS, data.loreSets);
        
        // --- 2. INJECT MAPS & GENERATION DATA ---
        if (data.caveThemes && typeof window.CAVE_THEMES !== 'undefined') Object.assign(window.CAVE_THEMES, data.caveThemes);
        if (data.castleLayouts && typeof window.CASTLE_LAYOUTS !== 'undefined') Object.assign(window.CASTLE_LAYOUTS, data.castleLayouts);
        
        if (data.roomTemplates && typeof window.CAVE_ROOM_TEMPLATES !== 'undefined') {
            Object.assign(window.CAVE_ROOM_TEMPLATES, data.roomTemplates);
            // 🚨 PERFORMANCE FIX: Clear the room cache so the new rooms are actually pulled into the generator!
            window.CACHED_ROOM_TEMPLATES = null; 
        }

        // --- 3. INJECT ARRAYS (Shops & Loot Tables) ---
        if (data.shops) {
            for (const shopKey in data.shops) {
                const targetGlobal = shopKey === 'general' ? 'SHOP_INVENTORY' : `${shopKey.toUpperCase()}_INVENTORY`;
                
                // If the array doesn't exist globally yet, create it!
                if (typeof window[targetGlobal] === 'undefined') {
                    window[targetGlobal] = [];
                }
                window[targetGlobal].push(...data.shops[shopKey]);
            }
        }

        // --- 4. CUSTOM INITIALIZATION HOOK ---
        // Runs arbitrary code (like modifying the Homstead menus, adding Crafting Recipes, or tweaking World Gen)
        if (typeof exp.init === 'function') {
            try {
                exp.init();
            } catch (err) {
                console.error(`%c[AKASHIC ENGINE] Expansion Init Error in ${exp.name}:`, "color: #ef4444;", err);
            }
        }
        
        this.expansions.push(exp.id);
    }
};

// --- END OF FILE expansion-manager.js ---
