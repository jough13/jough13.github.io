// --- START OF FILE expansion-artisan.js ---

window.ExpansionManager.register({
    id: "artisan_guild",
    name: "The Artisan's Guild (Jewelcrafting)",
    version: "1.5", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            // Raw Materials (High Trade Value)
            '💎r': { name: 'Raw Ruby', type: 'trade', description: "A cloudy red gemstone. Needs cutting.", value: 100, _rarity: 'uncommon' },
            '💎s': { name: 'Raw Sapphire', type: 'trade', description: "A cloudy blue gemstone. Needs cutting.", value: 100, _rarity: 'uncommon' },
            '💎d': { name: 'Raw Diamond', type: 'trade', description: "A cloudy white gemstone. Needs cutting.", value: 200, _rarity: 'rare' },
            '💎e': { name: 'Raw Emerald', type: 'trade', description: "A cloudy green gemstone. Needs cutting.", value: 120, _rarity: 'rare' },
            '💎a': { name: 'Raw Amethyst', type: 'trade', description: "A cloudy purple gemstone. Needs cutting.", value: 120, _rarity: 'rare' },
            // NEW GEMS
            '💎t': { name: 'Raw Topaz', type: 'trade', description: "A cloudy yellow gemstone. Needs cutting.", value: 110, _rarity: 'uncommon' },
            '💎o': { name: 'Raw Onyx', type: 'trade', description: "A cloudy black gemstone. Needs cutting.", value: 110, _rarity: 'uncommon' },
            
            // 🌟 EXPANSION WIN: The Uncracked Geode!
            '🪨g': {
                name: 'Uncracked Geode', type: 'consumable', tile: '🪨', _rarity: 'uncommon',
                description: "A dull, heavy rock that rattles when shaken. Use it to smash it open!",
                effect: (state) => {
                    logMessage("{gray:You smash the geode against the ground...}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    state.screenShake = 5;

                    const roll = Math.random();
                    let gemName = 'Raw Ruby';
                    let gemId = '💎r';
                    
                    if (roll > 0.3) { gemName = 'Raw Sapphire'; gemId = '💎s'; }
                    if (roll > 0.5) { gemName = 'Raw Topaz'; gemId = '💎t'; }
                    if (roll > 0.7) { gemName = 'Raw Emerald'; gemId = '💎e'; }
                    if (roll > 0.85) { gemName = 'Raw Amethyst'; gemId = '💎a'; }
                    if (roll > 0.92) { gemName = 'Raw Onyx'; gemId = '💎o'; }
                    if (roll > 0.97) { gemName = 'Raw Diamond'; gemId = '💎d'; }

                    const yieldAmt = Math.floor(Math.random() * 2) + 1; // Yields 1 or 2 gems
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                    const existingStack = state.player.inventory.find(i => i && i.name === gemName && !i.isEquipped);

                    // 🚨 ROBUSTNESS & EXPLOIT FIX: Safe Outward Spiral Drop with EXACT ID
                    const safelyDropItem = (dropTile) => {
                        let placed = false;
                        let validFloor = '.';
                        if (state.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[state.currentCaveTheme]) {
                            validFloor = CAVE_THEMES[state.currentCaveTheme].floor;
                        }

                        if (typeof chunkManager !== 'undefined') {
                            for (let r = 0; r <= 2 && !placed; r++) {
                                for (let dy = -r; dy <= r && !placed; dy++) {
                                    for (let dx = -r; dx <= r && !placed; dx++) {
                                        const tx = state.player.x + dx;
                                        const ty = state.player.y + dy;
                                        let tileAt;
                                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') tileAt = chunkManager.getTile(tx, ty);
                                        else if (state.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[state.currentCaveId]?.[ty]?.[tx];
                                        else if (state.mapMode === 'castle') tileAt = chunkManager.castleMaps[state.currentCastleId]?.[ty]?.[tx];

                                        if (tileAt === validFloor || tileAt === '.') {
                                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(tx, ty, dropTile, 24); 
                                            else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][ty][tx] = dropTile;
                                            else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][ty][tx] = dropTile;
                                            placed = true;
                                        }
                                    }
                                }
                            }
                            if (!placed) { // Absolute fallback
                                if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(state.player.x, state.player.y, dropTile, 24);
                                else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][state.player.y][state.player.x] = dropTile;
                                else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][state.player.y][state.player.x] = dropTile;
                            }
                            state.mapDirty = true;
                        }
                    };

                    if (existingStack) {
                        existingStack.quantity += yieldAmt;
                        logMessage(`{purple:The geode shatters, revealing ${yieldAmt}x ${gemName}!}`);
                    } else if (state.player.inventory.length < invCap) {
                        // 🚨 BUG FIX: Use deep cloning for the new stack!
                        const template = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA[gemId] : { name: gemName, type: 'trade', tile: '💎' };
                        const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                        
                        newItem.templateId = gemId;
                        newItem.quantity = yieldAmt;
                        newItem.isEquipped = false;
                        
                        state.player.inventory.push(newItem);
                        logMessage(`{purple:The geode shatters, revealing ${yieldAmt}x ${gemName}!}`);
                    } else {
                        // Exploit closed: Passes specific gemId instead of a generic '💎' which spawned flawless diamonds!
                        logMessage(`{red:The geode shatters revealing ${yieldAmt}x ${gemName}, but your pack is full! They drop to the floor.}`);
                        safelyDropItem(gemId);
                    }

                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#22d3ee', 15);
                    
                    return true; // Consume geode
                }
            },

            // The Tool
            '🛠️j': {
                name: "Jeweler's Kit", type: 'tool', tile: '🛠️',
                description: "Bind to Hotbar or Click to use. Converts Raw Gems in your inventory into Socketable Gems.",
                effect: (state) => {
                    const inv = state.player.inventory;
                    let cutSomething = false;
                    const gems = { 
                        'Raw Ruby': 'Cut Ruby', 
                        'Raw Sapphire': 'Cut Sapphire', 
                        'Raw Diamond': 'Cut Diamond',
                        'Raw Emerald': 'Cut Emerald',
                        'Raw Amethyst': 'Cut Amethyst',
                        'Raw Topaz': 'Cut Topaz',
                        'Raw Onyx': 'Cut Onyx'
                    };
                    
                    // Look for a raw gem to cut
                    for (let i = 0; i < inv.length; i++) {
                        if (inv[i] && gems[inv[i].name] && !inv[i].isEquipped) {
                            const cutName = gems[inv[i].name];
                            
                            // Safe Capacity Check
                            // Checks if splitting the raw gem stack will overflow the inventory BEFORE executing!
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const hasStack = inv.find(item => item && item.name === cutName && !item.isEquipped);
                            
                            if (!hasStack && inv[i].quantity > 1 && inv.length >= invCap) {
                                logMessage("{red:Your inventory is too full to hold the cut gem! Make space.}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                return false;
                            }

                            // 🌟 JUICE & SYNERGY WIN: The Perfect Cut!
                            // Scales with luck, and gives a massive +15% bonus if they are the Artisan class!
                            let yieldAmt = 1;
                            let isFlawless = false;
                            
                            let flawlessChance = 0.05 + (state.player.luck * 0.01);
                            if (state.player.className === 'Artisan') flawlessChance += 0.15;
                            
                            if (Math.random() < flawlessChance) {
                                yieldAmt = 2;
                                isFlawless = true;
                            }

                            if (isFlawless) {
                                logMessage(`{gold:Flawless execution! You cut the ${inv[i].name} with incredible precision!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 25);
                                state.screenShake = 5;
                            } else {
                                logMessage(`{cyan:You carefully cut and polish the ${inv[i].name}...}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playCraftSuccess();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#22d3ee', 10);
                            }
                            
                            // 🚀 PERFORMANCE WIN: High-Speed Cache for Template Keys
                            if (!window._artisanKeyCache) window._artisanKeyCache = {};
                            let templateKey = window._artisanKeyCache[cutName];
                            if (!templateKey) {
                                templateKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === cutName);
                                window._artisanKeyCache[cutName] = templateKey;
                            }
                            
                            const template = window.ITEM_DATA[templateKey];
                            
                            // Consume 1 Raw Gem
                            inv[i].quantity--;
                            if (inv[i].quantity <= 0) inv.splice(i, 1);
                            
                            // Add Cut Gem(s)
                            if (hasStack) {
                                hasStack.quantity += yieldAmt;
                            } else {
                                // Deep cloning isolated template
                                const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                                newItem.templateId = templateKey;
                                newItem.quantity = yieldAmt;
                                newItem.isEquipped = false;
                                newItem.effect = template.effect; // Re-bind effect function manually since stringify stripped it
                                inv.push(newItem);
                            }
                            
                            logMessage(`{purple:Successfully crafted: ${cutName} (x${yieldAmt})!}`);
                            cutSomething = true;
                            
                            // Force UI Sync and DB Debounce
                            if (typeof renderInventory === 'function') renderInventory();
                            if (typeof triggerDebouncedSave === 'function') {
                                triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv });
                            }
                            
                            break; // Only cut one at a time per click to prevent accidental mass consumption
                        }
                    }
                    
                    if (!cutSomething) {
                        logMessage("{gray:You have no Raw Gems in your bag to cut.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    }
                    return false; // Return false so the Jeweler's Kit isn't consumed!
                }
            },

            // The Socketable Gems (Consumables)
            '♦️r': {
                name: 'Cut Ruby', type: 'consumable', tile: '♦️',
                description: "{red:+3 Strength} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'strength', 3, 'of the Inferno', '#ef4444', 'red', 'Cut Ruby')
            },
            '♦️s': {
                name: 'Cut Sapphire', type: 'consumable', tile: '♦️',
                description: "{blue:+3 Wits} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'wits', 3, 'of the Glacier', '#3b82f6', 'blue', 'Cut Sapphire')
            },
            '♦️d': {
                name: 'Cut Diamond', type: 'consumable', tile: '♦️',
                description: "{blue:+3 Defense} to equipped Armor. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'armor', 'defense', 3, 'of the Aegis', '#f8fafc', 'gray', 'Cut Diamond')
            },
            '♦️e': {
                name: 'Cut Emerald', type: 'consumable', tile: '♦️',
                description: "{green:+3 Dexterity} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'dexterity', 3, 'of the Viper', '#22c55e', 'green', 'Cut Emerald')
            },
            '♦️a': {
                name: 'Cut Amethyst', type: 'consumable', tile: '♦️',
                description: "{purple:+15 Max Mana} to equipped Armor. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'armor', 'maxMana', 15, 'of the Void', '#a855f7', 'purple', 'Cut Amethyst')
            },
            '♦️t': {
                name: 'Cut Topaz', type: 'consumable', tile: '♦️',
                description: "{gold:+3 Luck} to equipped Accessory. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'accessory', 'luck', 3, 'of Fortune', '#facc15', 'gold', 'Cut Topaz')
            },
            '♦️o': {
                name: 'Cut Onyx', type: 'consumable', tile: '♦️',
                description: "{gray:+3 Endurance} to equipped Armor. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'armor', 'endurance', 3, 'of the Titan', '#374151', 'gray', 'Cut Onyx')
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '🦀c': {
                name: 'Crystal Crawler', tags: ['beast', 'stone'], mountable: false,
                maxHealth: 35, attack: 4, defense: 5, xp: 60,
                color: '#22d3ee', loot: '🪨g', 
                flavor: "A terrestrial crab with a shell made of hardened gemstone."
            }
        },

        // --- 3. NEW MAP TILES ---
        tiles: {
            '💎n': {
                type: 'anomaly',
                name: 'Gemstone Vein',
                flavor: "A glittering vein of precious gems exposed in the rock.",
                onInteract: (state, x, y) => {
                    const tileId = `${x},${-y}`;
                    if (state.lootedTiles.has(tileId)) {
                        logMessage("{gray:The vein has been mined bare.}");
                        return null;
                    }
                    
                    // Check if player has a pickaxe
                    const hasPickaxe = state.player.inventory.some(i => i && (i.name === 'Pickaxe' || i.name === 'Diamond Tipped Pickaxe') && !i.isEquipped);
                    if (!hasPickaxe) {
                        logMessage("{red:You need a Pickaxe to mine these gems!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return null;
                    }

                    // Effects
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#22d3ee', 15);
                    state.player.stamina = Math.max(0, state.player.stamina - 3);
                    state.screenShake = 5;
                    
                    // --- GAMEPLAY WIN: Ambush Chance! ---
                    if (Math.random() < 0.15) {
                        logMessage("{red:The gemstone cracks open... and legs sprout out! It's a Crystal Crawler!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                        
                        const enemyTemplate = window.ENEMY_DATA['🦀c'];
                        const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyTemplate, x, y) : enemyTemplate;
                        
                        // Safe Entity Instantiator Fallback
                        const createEntity = typeof chunkManager._createInstancedEnemy === 'function' 
                            ? chunkManager._createInstancedEnemy.bind(chunkManager) 
                            : (id, x, y, tile, scaled, template) => ({ id, x, y, tile, name: scaled.name, health: scaled.maxHealth, maxHealth: scaled.maxHealth, attack: scaled.attack, defense: scaled.defense || 0, xp: scaled.xp, loot: template.loot });

                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                            const enemyId = `overworld:${x},${-y}`;
                            state.sharedEnemies[enemyId] = { ...scaledStats, tile: '🦀c', x: x, y: y, spawnTime: Date.now() };
                            if (typeof EnemyNetworkManager !== 'undefined') {
                                rtdb.ref(EnemyNetworkManager.getPath(x, y, enemyId)).set(state.sharedEnemies[enemyId]);
                            }
                        } else {
                            // Instanced dungeon fallback
                            const eId = `${state.currentCaveId}:ambush_${Date.now()}`;
                            state.instancedEnemies.push(createEntity(eId, x, y, '🦀c', scaledStats, enemyTemplate));
                        }
                    } else {
                        // Standard Loot Roll
                        const roll = Math.random();
                        let gem = 'Raw Ruby';
                        let gemId = '💎r';
                        if (roll > 0.3) { gem = 'Raw Sapphire'; gemId = '💎s'; }
                        if (roll > 0.5) { gem = 'Raw Topaz'; gemId = '💎t'; }
                        if (roll > 0.7) { gem = 'Raw Emerald'; gemId = '💎e'; }
                        if (roll > 0.85) { gem = 'Raw Amethyst'; gemId = '💎a'; }
                        if (roll > 0.92) { gem = 'Raw Onyx'; gemId = '💎o'; }
                        if (roll > 0.97) { gem = 'Raw Diamond'; gemId = '💎d'; }

                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                        if (state.player.inventory.length < invCap) {
                            state.player.inventory.push({
                                templateId: gemId, name: gem, type: 'trade', quantity: 1, tile: '💎', isEquipped: false
                            });
                            logMessage(`{purple:You mined a ${gem}!}`);
                        } else {
                            logMessage(`{red:You mined a ${gem}, but your pack is full!}`);
                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(x, y, gemId, 24);
                        }
                    }

                    state.lootedTiles.add(tileId);
                    
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Dimensional Terrain Replacement!
                    // Prevents permanently blocking a dungeon hallway with an unpassable mountain peak (`^`)!
                    let replaceTile = '.';
                    if (state.mapMode === 'dungeon') {
                        const theme = window.CAVE_THEMES[state.currentCaveTheme];
                        replaceTile = theme ? theme.floor : '.';
                        chunkManager.caveMaps[state.currentCaveId][y][x] = replaceTile;
                    } else if (state.mapMode === 'castle') {
                        chunkManager.castleMaps[state.currentCastleId][y][x] = '.';
                    } else {
                        chunkManager.setWorldTile(x, y, '^'); // Normal overworld/underworld replacement
                    }

                    state.mapDirty = true;
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof render === 'function') render();
                    
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) };
                }
            },
            '🛒b': {
                type: 'landmark',
                name: 'Overturned Cart',
                flavor: "A jeweler's cart lies smashed on the road.",
                eventId: 'CRASHED_JEWELER_CART'
            }
        },

        // 🌟 LORE & GAMEPLAY WIN: Native Event Registration!
        events: {
            'CRASHED_JEWELER_CART': {
                title: "Overturned Cart",
                oncePerTile: true,
                lootedMessage: "Just splintered wood and broken glass.",
                nodes: {
                    'start': {
                        text: "A merchant's cart lies overturned in the dirt. The horse is missing, but a small iron lockbox remains intact amongst the debris.",
                        choices: [
                            {
                                text: "Pry open the lockbox.",
                                action: (state, ctx) => {
                                    logMessage("{gray:You force the lockbox open...}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 1000);
                                    
                                    // 30% chance it's an ambush!
                                    if (Math.random() < 0.3) {
                                        logMessage("{red:It's a trap! Bandits emerge from the brush!}");
                                        state.screenShake = 15;
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                        
                                        const eData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['b'] : { name: 'Bandit', maxHealth: 10, attack: 2, xp: 20 };
                                        const offsets = [[-1, 0], [1, 0], [0, -1]];
                                        
                                        offsets.forEach(off => {
                                            const ex = ctx.x + off[0];
                                            const ey = ctx.y + off[1];
                                            
                                            if (['.', 'F', 'd', 'D'].includes(chunkManager.getTile(ex, ey))) {
                                                const enemyId = `overworld:${ex},${-ey}`;
                                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, ex, ey) : eData;
                                                
                                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'b', x: ex, y: ey, spawnTime: Date.now() };
                                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                                            }
                                        });
                                    } else {
                                        logMessage("{gold:You found a Jeweler's Kit and a handful of Uncracked Geodes!}");
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                        
                                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                        const toolExists = state.player.inventory.some(i => i && i.name === "Jeweler's Kit");
                                        
                                        // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Outward Spiral Drop
                                        const dropSafely = (itemTile) => {
                                            let placed = false;
                                            if (typeof chunkManager !== 'undefined') {
                                                for (let r = 0; r <= 2 && !placed; r++) {
                                                    for (let dy = -r; dy <= r && !placed; dy++) {
                                                        for (let dx = -r; dx <= r && !placed; dx++) {
                                                            const tx = ctx.x + dx;
                                                            const ty = ctx.y + dy;
                                                            const tileAt = chunkManager.getTile(tx, ty);
                                                            if (['.', 'F', 'd', 'D'].includes(tileAt)) {
                                                                chunkManager.setWorldTile(tx, ty, itemTile, 24);
                                                                placed = true;
                                                            }
                                                        }
                                                    }
                                                }
                                                if (!placed) chunkManager.setWorldTile(ctx.x, ctx.y, itemTile, 24);
                                            }
                                        };
                                        
                                        if (!toolExists) {
                                            if (state.player.inventory.length < invCap) {
                                                const jTemplate = window.ITEM_DATA['🛠️j'];
                                                const kit = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(jTemplate) : JSON.parse(JSON.stringify(jTemplate));
                                                kit.templateId = '🛠️j'; kit.quantity = 1; kit.isEquipped = false;
                                                kit.effect = jTemplate.effect; // Rebind!
                                                state.player.inventory.push(kit);
                                            } else {
                                                logMessage("{red:You found a Jeweler's Kit, but your inventory was full! It drops to the floor.}");
                                                dropSafely('🛠️j');
                                            }
                                        }
                                        
                                        // Give 2-4 Geodes safely
                                        const geodeYield = Math.floor(Math.random() * 3) + 2;
                                        const existingGeodes = state.player.inventory.find(i => i && i.name === 'Uncracked Geode' && !i.isEquipped);
                                        if (existingGeodes) {
                                            existingGeodes.quantity += geodeYield;
                                        } else if (state.player.inventory.length < invCap) {
                                            const gTemplate = window.ITEM_DATA['🪨g'];
                                            const geode = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(gTemplate) : JSON.parse(JSON.stringify(gTemplate));
                                            geode.templateId = '🪨g'; geode.quantity = geodeYield; geode.isEquipped = false;
                                            geode.effect = gTemplate.effect; // Rebind!
                                            state.player.inventory.push(geode);
                                        } else {
                                            logMessage(`{red:You found ${geodeYield} Geodes, but your inventory was full! They drop to the floor.}`);
                                            dropSafely('🪨g');
                                        }
                                    }
                                    
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '🏚'); // Replace with rubble visually
                                    state.mapDirty = true;
                                    
                                    // 🚨 Ensure state is saved!
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) });
                                }
                            },
                            { text: "Walk away." }
                        ]
                    }
                }
            }
        },

        // --- 4. SHOP INJECTION ---
        shops: {
            general: [
                { name: "Jeweler's Kit", price: 800, stock: 1 }
            ]
        }
    },

    // --- 5. ENGINE HOOKS ---
    init: function() {
        
        // Universal Helper Function attached to the window for Gem Socketing
        // Added dynamic particle colors and preserved Lore Descriptions!
        window.applySocket = function(state, slot, stat, amount, suffix, pColorHex = '#facc15', pColorName = 'gold', gemName = 'Gem') {
            const targetItem = state.player.equipment[slot];
            
            // Failsafes
            if (!targetItem || targetItem.name === 'Fists' || targetItem.name === 'Simple Tunic' || targetItem.name === 'Tattered Rags') {
                logMessage(`{red:You must equip a valid ${slot} to socket this gem!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false; // Don't consume gem
            }

            if (targetItem.tags && targetItem.tags.includes('socketed')) {
                logMessage(`{red:The ${targetItem.name} is already socketed with a gem!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false; // Don't consume gem
            }

            logMessage(`{gold:You carefully set the gem into the ${targetItem.name}...}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playEnchant();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, pColorHex, 30);
            state.screenShake = 10;

            // 1. Unequip temporarily to safely remove old stat bonuses from the player
            if (typeof applyStatBonuses === 'function') applyStatBonuses(targetItem, -1);

            // 2. Modify the Item
            if (!targetItem.tags) targetItem.tags = [];
            targetItem.tags.push('socketed');
            targetItem.name = `${targetItem.name} ${suffix}`;
            
            // Deep clone statBonuses to sever the prototype link!
            // Prevents global ITEM_DATA corruption where every subsequent weapon dropped inherits the socket!
            if (!targetItem.statBonuses) {
                targetItem.statBonuses = {};
            } else {
                targetItem.statBonuses = typeof window.fastClone === 'function' ? window.fastClone(targetItem.statBonuses) : JSON.parse(JSON.stringify(targetItem.statBonuses));
            }
            
            // Strict Number Coercion
            // Prevents a string-concat bug where 5 damage + 3 socket becomes "53" damage, breaking combat!
            if (stat === 'defense') {
                targetItem.defense = (Number(targetItem.defense) || 0) + Number(amount);
            } else if (stat === 'damage') {
                targetItem.damage = (Number(targetItem.damage) || 0) + Number(amount);
            } else {
                targetItem.statBonuses[stat] = (Number(targetItem.statBonuses[stat]) || 0) + Number(amount);
            }
            
            // Visually append the socketed gem to the weapon's description so the player remembers!
            targetItem.description = (targetItem.description || "") + `\n\n{${pColorName}:[Socketed: ${gemName}]}`;

            // 3. Re-equip to apply the new, improved stats back to the player
            if (typeof applyStatBonuses === 'function') applyStatBonuses(targetItem, 1);
            
            logMessage(`{green:Success! You forged the ${targetItem.name}!}`);
            if (typeof renderEquipment === 'function') renderEquipment();
            if (typeof renderStats === 'function') renderStats();

            // Return true so the core engine consumes the Cut Gem from the inventory
            return true; 
        };

        // Dynamically Inject Gem Veins and Overturned Carts into Procedural World Generation!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                // MULTIVERSE CHECK: Ensure veins only spawn natively in the Prime Realm
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                // Deterministic PRNG
                const random = typeof Alea !== 'undefined' ? Alea(typeof stringToSeed !== 'undefined' ? stringToSeed(`artisan_spawn_${chunkId}`) : 1) : Math.random;
                
                // 30% chance to spawn a gemstone vein per chunk
                if (random() < 0.30) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    
                    // Only spawn on mountain peaks
                    if (chunkData[ry][rx] === '^') {
                        chunkData[ry][rx] = '💎n'; 
                    }
                }
                
                // 5% chance to spawn the Overturned Jeweler Cart on the Plains
                if (random() > 0.95) {
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    
                    if (chunkData[ry][rx] === '.') {
                        chunkData[ry][rx] = '🛒b'; 
                    }
                }
            };
        }

        // Add the new landmarks to the Minimap Engine
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['💎n'] = [34, 211, 238, 255]; // Bright Cyan
            window.TILE_COLOR_MAP['🛒b'] = [120, 53, 15, 255]; // Dark Wood Brown
        }
    }
});

// --- END OF FILE expansion-artisan.js ---
