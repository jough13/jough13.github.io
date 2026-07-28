// --- START OF FILE expansion-artisan.js ---

window.ExpansionManager.register({
    id: "artisan_guild",
    name: "The Artisan's Guild (Jewelcrafting)",
    version: "1.1", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            // Raw Materials (High Trade Value)
            '💎r': { name: 'Raw Ruby', type: 'trade', description: "A cloudy red gemstone. Needs cutting.", value: 100, _rarity: 'uncommon' },
            '💎s': { name: 'Raw Sapphire', type: 'trade', description: "A cloudy blue gemstone. Needs cutting.", value: 100, _rarity: 'uncommon' },
            '💎d': { name: 'Raw Diamond', type: 'trade', description: "A cloudy white gemstone. Needs cutting.", value: 200, _rarity: 'rare' },
            // NEW GEMS
            '💎e': { name: 'Raw Emerald', type: 'trade', description: "A cloudy green gemstone. Needs cutting.", value: 120, _rarity: 'rare' },
            '💎a': { name: 'Raw Amethyst', type: 'trade', description: "A cloudy purple gemstone. Needs cutting.", value: 120, _rarity: 'rare' },
            
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
                        'Raw Amethyst': 'Cut Amethyst'
                    };
                    
                    // Look for a raw gem to cut
                    for (let i = 0; i < inv.length; i++) {
                        if (inv[i] && gems[inv[i].name] && !inv[i].isEquipped) {
                            const cutName = gems[inv[i].name];
                            
                            // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Capacity Check
                            // If we have no existing stack, and our current raw gem stack is > 1 
                            // (meaning the raw gem stack won't be deleted to free up a slot), check capacity!
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const hasStack = inv.find(item => item && item.name === cutName && !item.isEquipped);
                            
                            if (!hasStack && inv[i].quantity > 1 && inv.length >= invCap) {
                                logMessage("{red:Your inventory is too full to hold the cut gem! Make space.}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                return false;
                            }

                            logMessage(`{cyan:You carefully cut and polish the ${inv[i].name}...}`);
                            
                            // Look up the template for the cut gem
                            const templateKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === cutName);
                            const template = window.ITEM_DATA[templateKey];
                            
                            // Consume 1 Raw Gem
                            inv[i].quantity--;
                            if (inv[i].quantity <= 0) inv.splice(i, 1);
                            
                            // Add 1 Cut Gem
                            if (hasStack) {
                                hasStack.quantity++;
                            } else {
                                const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                                newItem.templateId = templateKey;
                                newItem.quantity = 1;
                                newItem.isEquipped = false;
                                newItem.effect = template.effect; // Re-bind effect
                                inv.push(newItem);
                            }
                            
                            logMessage(`{gold:Successfully crafted a ${cutName}!}`);
                            cutSomething = true;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playCraftSuccess();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 10);
                            
                            // Force UI Sync
                            if (typeof renderInventory === 'function') renderInventory();
                            if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv });
                            
                            break; // Only cut one at a time per click
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
                effect: (state) => window.applySocket(state, 'weapon', 'strength', 3, 'of the Inferno', '#ef4444')
            },
            '♦️s': {
                name: 'Cut Sapphire', type: 'consumable', tile: '♦️',
                description: "{blue:+3 Wits} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'wits', 3, 'of the Glacier', '#3b82f6')
            },
            '♦️d': {
                name: 'Cut Diamond', type: 'consumable', tile: '♦️',
                description: "{blue:+3 Defense} to equipped Armor. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'armor', 'defense', 3, 'of the Aegis', '#f8fafc')
            },
            '♦️e': {
                name: 'Cut Emerald', type: 'consumable', tile: '♦️',
                description: "{green:+3 Dexterity} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'dexterity', 3, 'of the Viper', '#22c55e')
            },
            '♦️a': {
                name: 'Cut Amethyst', type: 'consumable', tile: '♦️',
                description: "{purple:+15 Max Mana} to equipped Armor. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'armor', 'maxMana', 15, 'of the Void', '#a855f7')
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '🦀c': {
                name: 'Crystal Crawler', tags: ['beast', 'stone'], mountable: false,
                maxHealth: 35, attack: 4, defense: 5, xp: 60,
                color: '#22d3ee', loot: '💎s',
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
                        
                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                            const enemyId = `overworld:${x},${-y}`;
                            state.sharedEnemies[enemyId] = { ...scaledStats, tile: '🦀c', x: x, y: y, spawnTime: Date.now() };
                            if (typeof EnemyNetworkManager !== 'undefined') {
                                rtdb.ref(EnemyNetworkManager.getPath(x, y, enemyId)).set(state.sharedEnemies[enemyId]);
                            }
                        } else {
                            // Instanced dungeon fallback just in case
                            state.instancedEnemies.push({
                                id: `${state.currentCaveId}:ambush_${Date.now()}`,
                                x: x, y: y, tile: '🦀c', name: enemyTemplate.name,
                                health: scaledStats.maxHealth, maxHealth: scaledStats.maxHealth,
                                attack: scaledStats.attack, defense: scaledStats.defense, xp: scaledStats.xp, loot: enemyTemplate.loot
                            });
                        }
                    } else {
                        // Standard Loot Roll
                        const roll = Math.random();
                        let gem = 'Raw Ruby';
                        let gemId = '💎r';
                        if (roll > 0.4) { gem = 'Raw Sapphire'; gemId = '💎s'; }
                        if (roll > 0.7) { gem = 'Raw Emerald'; gemId = '💎e'; }
                        if (roll > 0.85) { gem = 'Raw Amethyst'; gemId = '💎a'; }
                        if (roll > 0.95) { gem = 'Raw Diamond'; gemId = '💎d'; }

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
                    
                    // Replace vein with a normal mountain tile visually
                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(x, y, '^');
                    state.mapDirty = true;
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof render === 'function') render();
                    
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) };
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
        // JUICE WIN: Added dynamic particle colors based on the gem!
        window.applySocket = function(state, slot, stat, amount, suffix, pColor = '#facc15') {
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
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, pColor, 30);
            state.screenShake = 10;

            // 1. Unequip temporarily to safely remove old stat bonuses from the player
            if (typeof applyStatBonuses === 'function') applyStatBonuses(targetItem, -1);

            // 2. Modify the Item
            if (!targetItem.tags) targetItem.tags = [];
            targetItem.tags.push('socketed');
            targetItem.name = `${targetItem.name} ${suffix}`;
            
            if (!targetItem.statBonuses) targetItem.statBonuses = {};
            
            if (stat === 'defense') {
                targetItem.defense = (targetItem.defense || 0) + amount;
            } else if (stat === 'damage') {
                targetItem.damage = (targetItem.damage || 0) + amount;
            } else {
                targetItem.statBonuses[stat] = (targetItem.statBonuses[stat] || 0) + amount;
            }

            // 3. Re-equip to apply the new, improved stats back to the player
            if (typeof applyStatBonuses === 'function') applyStatBonuses(targetItem, 1);
            
            logMessage(`{green:Success! You forged the ${targetItem.name}!}`);
            if (typeof renderEquipment === 'function') renderEquipment();
            if (typeof renderStats === 'function') renderStats();

            // Return true so the core engine consumes the Cut Gem from the inventory
            return true; 
        };

        // Dynamically Inject Gem Veins into Procedural World Generation!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
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
            };
        }

        // Add the Gemstone Vein to the Minimap Engine
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['💎n'] = [34, 211, 238, 255]; // Bright Cyan
        }
    }
});

// --- END OF FILE expansion-artisan.js ---
