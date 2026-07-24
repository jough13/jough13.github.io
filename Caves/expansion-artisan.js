// --- START OF FILE expansion-artisan.js ---

window.ExpansionManager.register({
    id: "artisan_guild",
    name: "The Artisan's Guild (Jewelcrafting)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            // Raw Materials (High Trade Value)
            '💎r': { name: 'Raw Ruby', type: 'trade', description: "A cloudy red gemstone. Needs cutting.", value: 100 },
            '💎s': { name: 'Raw Sapphire', type: 'trade', description: "A cloudy blue gemstone. Needs cutting.", value: 100 },
            '💎d': { name: 'Raw Diamond', type: 'trade', description: "A cloudy white gemstone. Needs cutting.", value: 200 },
            
            // The Tool
            '🛠️j': {
                name: "Jeweler's Kit", type: 'tool', tile: '🛠️',
                description: "Bind to Hotbar or Click to use. Converts Raw Gems in your inventory into Socketable Gems.",
                effect: (state) => {
                    const inv = state.player.inventory;
                    let cutSomething = false;
                    const gems = { 'Raw Ruby': 'Cut Ruby', 'Raw Sapphire': 'Cut Sapphire', 'Raw Diamond': 'Cut Diamond' };
                    
                    // Look for a raw gem to cut
                    for (let i = 0; i < inv.length; i++) {
                        if (inv[i] && gems[inv[i].name] && !inv[i].isEquipped) {
                            logMessage(`{cyan:You carefully cut and polish the ${inv[i].name}...}`);
                            const cutName = gems[inv[i].name];
                            
                            // Look up the template for the cut gem
                            const templateKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === cutName);
                            const template = window.ITEM_DATA[templateKey];
                            
                            // Consume 1 Raw Gem
                            inv[i].quantity--;
                            if (inv[i].quantity <= 0) inv.splice(i, 1);
                            
                            // Add 1 Cut Gem
                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                            newItem.templateId = templateKey;
                            newItem.quantity = 1;
                            newItem.isEquipped = false;
                            newItem.effect = template.effect; // Re-bind effect
                            
                            inv.push(newItem);
                            
                            logMessage(`{gold:Successfully crafted a ${cutName}!}`);
                            cutSomething = true;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playCraftSuccess();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 10);
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

            // The Socketable Gems
            '♦️r': {
                name: 'Cut Ruby', type: 'consumable', tile: '♦️',
                description: "{red:+3 Strength} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'strength', 3, 'of the Inferno')
            },
            '♦️s': {
                name: 'Cut Sapphire', type: 'consumable', tile: '♦️',
                description: "{blue:+3 Wits} to equipped Weapon. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'weapon', 'wits', 3, 'of the Glacier')
            },
            '♦️d': {
                name: 'Cut Diamond', type: 'consumable', tile: '♦️',
                description: "{blue:+3 Defense} to equipped Armor. \nCan only socket an item once.",
                effect: (state) => window.applySocket(state, 'armor', 'defense', 3, 'of the Aegis')
            }
        },

        // --- 2. NEW MAP TILES ---
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
                    
                    // Loot Roll
                    const roll = Math.random();
                    let gem = 'Raw Ruby';
                    let gemId = '💎r';
                    if (roll > 0.5) { gem = 'Raw Sapphire'; gemId = '💎s'; }
                    if (roll > 0.85) { gem = 'Raw Diamond'; gemId = '💎d'; }

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

                    state.lootedTiles.add(tileId);
                    
                    // Replace vein with a normal mountain tile visually
                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(x, y, '^');
                    state.mapDirty = true;
                    if (typeof renderInventory === 'function') renderInventory();
                    
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) };
                }
            }
        },

        // --- 3. SHOP INJECTION ---
        shops: {
            general: [
                { name: "Jeweler's Kit", price: 800, stock: 1 }
            ]
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // Universal Helper Function attached to the window for Gem Socketing
        window.applySocket = function(state, slot, stat, amount, suffix) {
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
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 30);
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
    }
});

// --- END OF FILE expansion-artisan.js ---
