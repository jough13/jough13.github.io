// --- START OF FILE expansion-core-delver.js ---

window.ExpansionManager.register({
    id: "core_delver",
    name: "The Core Delver (Underworld Sandbox)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🛤️': { 
                name: 'Minecart Track', type: 'constructible', tile: '🛤️', 
                description: "Place on the ground to guide minecarts around corners." 
            },
            '🛒': { 
                name: 'Minecart', type: 'constructible', tile: '🛒', 
                description: "Place on tracks and hop in to travel rapidly." 
            }
        },

        // --- 2. NEW TILES ---
        tiles: {
            '🛤️': {
                type: 'decoration', name: 'Minecart Track',
                flavor: "Iron tracks bolted to wooden ties."
            }
        },

        // --- 3. SHOPS ---
        shops: {
            trader: [
                { name: 'Minecart Track', price: 50, stock: 20 },
                { name: 'Minecart', price: 200, stock: 2 }
            ]
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. ADD CRAFTING RECIPES
        // ==========================================
        if (typeof window.CRAFTING_RECIPES !== 'undefined') {
            // 2 Iron Ore = 5 Tracks!
            window.CRAFTING_RECIPES["Minecart Track"] = { materials: { "Iron Ore": 2 }, xp: 20, level: 3, yield: 5 };
            window.CRAFTING_RECIPES["Minecart"] = { materials: { "Iron Ore": 5, "Wood Log": 2 }, xp: 50, level: 3 };
            
            // Give a recipe to the existing Dwarven TNT so players can blast tunnels!
            window.CRAFTING_RECIPES["Dwarven TNT"] = { materials: { "Stone": 2, "Elemental Core": 1 }, xp: 60, level: 4, yield: 2 };
        }

        // ==========================================
        // 2. MINE-CART RIDING OVERHAUL
        // ==========================================
        // Upgrade the original TILE_DATA['🛒'] to support smart track-following!
        if (typeof window.TILE_DATA !== 'undefined' && window.TILE_DATA['🛒']) {
            window.TILE_DATA['🛒'].onInteract = (state, x, y) => {
                const dx = x - state.player.x;
                const dy = y - state.player.y;
                
                logMessage("{yellow:You hop into the minecart! WHOOSH!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.2, 500);
                state.screenShake = 15;

                let curX = x;
                let curY = y;
                let vX = dx;
                let vY = dy;
                
                // Helper to get tiles universally
                const getT = (tx, ty) => {
                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') return chunkManager.getTile(tx, ty);
                    if (state.mapMode === 'dungeon') return chunkManager.caveMaps[state.currentCaveId][ty][tx];
                    return chunkManager.castleMaps[state.currentCastleId][ty][tx];
                };

                let traveled = 0;
                while(traveled < 60) { // Max 60 tiles per push
                    let nX = curX + vX;
                    let nY = curY + vY;
                    let t = getT(nX, nY);
                    
                    // 1. If straight ahead is a track, keep going!
                    if (t === '🛤️') {
                        curX = nX; curY = nY;
                    } else {
                        // 2. Check for corners (Left or Right relative to current velocity)
                        let a1X = vY, a1Y = vX;   
                        let a2X = -vY, a2Y = -vX; 
                        
                        if (getT(curX + a1X, curY + a1Y) === '🛤️') {
                            vX = a1X; vY = a1Y;
                            curX += vX; curY += vY;
                        } else if (getT(curX + a2X, curY + a2Y) === '🛤️') {
                            vX = a2X; vY = a2Y;
                            curX += vX; curY += vY;
                        } else {
                            // 3. No tracks found. Try to slide on open floor, otherwise crash/stop!
                            if (['.', 'F', 'd', 'D'].includes(t) && !(typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[t])) {
                                curX = nX; curY = nY;
                            } else {
                                break; // Hit a wall!
                            }
                        }
                    }
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(curX, curY, '#facc15', 1);
                    traveled++;
                }

                // Pick up the minecart and put it in the player's inventory to prevent clutter!
                if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                    // Check if it was sitting on a track. If so, leave the track behind!
                    const wasOnTrack = (getT(x, y) === '🛒') ? false : true; 
                    chunkManager.setWorldTile(x, y, wasOnTrack ? '🛤️' : '.'); 
                }

                state.player.x = curX;
                state.player.y = curY;
                
                // Return to inventory
                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                const existing = state.player.inventory.find(i => i && i.name === 'Minecart' && !i.isEquipped);
                if (existing) existing.quantity++;
                else if (state.player.inventory.length < invCap) {
                    state.player.inventory.push({ templateId: '🛒', name: 'Minecart', type: 'constructible', quantity: 1, tile: '🛒', isEquipped: false });
                } else {
                    logMessage("{red:Your pack is full! The Minecart drops to the ground.}");
                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(curX, curY, '🛒', 24);
                }

                logMessage("{gray:The minecart grinds to a halt. You pocket it.}");
                state.mapDirty = true;
                if (typeof renderInventory === 'function') renderInventory();

                return { x: curX, y: curY };
            };
        }

        // ==========================================
        // 3. UNDERWORLD MINING (SANDBOX TERRAIN)
        // ==========================================
        // We monkey-patch the attemptMovePlayer function to intercept bumping into walls!
        
        if (typeof window.attemptMovePlayer === 'function') {
            const origAttemptMove = window.attemptMovePlayer;
            
            window.attemptMovePlayer = async function(newX, newY) {
                // If in the Underworld, check if they are trying to walk into a solid rock wall
                if (gameState.mapMode === 'underworld') {
                    const tile = chunkManager.getTile(newX, newY);
                    
                    if (tile === '▓') {
                        const hasPickaxe = gameState.player.inventory.some(i => i && !i.isEquipped && (i.name === 'Pickaxe' || i.name === 'Diamond Tipped Pickaxe'));
                        
                        if (hasPickaxe) {
                            // 🚨 THE EXPLOIT FIX: Engage the global engine lock!
                            if (isProcessingMove) return;
                            isProcessingMove = true;

                            try {
                                if (gameState.player.stamina < 2) {
                                    logMessage("{red:You are too exhausted to mine through solid rock.}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                    return;
                                }
                                
                                gameState.player.stamina -= 2;
                                if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('staminaDisplay'), false);
                                
                                // Visual & Audio Feedback
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#4b5563', 15);
                                gameState.screenShake = 5;

                                // Carve the tunnel!
                                chunkManager.setWorldTile(newX, newY, '.'); 
                                
                                // Determine Loot
                                const roll = Math.random();
                                let loot = null;
                                if (roll < 0.10) loot = '•'; // Iron
                                else if (roll < 0.15) loot = '▲'; // Obsidian
                                else if (roll < 0.18) loot = '💎'; // Diamond
                                else if (roll < 0.20) loot = '☄️'; // Star Metal (Very deep!)
                                else if (roll < 0.60) loot = '🪨'; // Stone
                                
                                if (loot) {
                                    chunkManager.setWorldTile(newX, newY, loot, 24); // Drops on floor for 24h
                                    logMessage("{yellow:You unearthed something in the rock!}");
                                } else {
                                    logMessage("You carve a path through the solid stone.");
                                }
                                
                                // Update map and save
                                gameState.mapDirty = true;
                                if (typeof render === 'function') render();
                                if (typeof endPlayerTurn === 'function') endPlayerTurn();
                                
                            } finally {
                                isProcessingMove = false;
                            }
                            return; // Return early so we don't accidentally walk INTO the wall before it clears!
                        }
                    }
                }
                
                // If not mining, proceed with normal movement
                return origAttemptMove.call(this, newX, newY);
            };
        }

        // ==========================================
        // 4. THE SUFFOCATING DARKNESS
        // ==========================================
        // Monkey-patch the turn-ender to apply damage if the player doesn't carry a light source!
        
        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            
            window.endPlayerTurn = function(updates = {}) {
                if (gameState.mapMode === 'underworld') {
                    // Check if player has an active light buff OR a light item in their bag
                    const hasLight = gameState.player.candlelightTurns > 0 || 
                                     gameState.player.inventory.some(i => i && !i.isEquipped && (i.name === 'Torch' || i.name === 'Ever-Burning Candle'));
                    
                    if (!hasLight) {
                        // 25% chance per turn in the dark to take Psyche damage
                        if (Math.random() < 0.25) {
                            logMessage("{purple:The suffocating darkness presses against your mind... (-1 Psyche)}");
                            window.modifyVital('psyche', -1);
                            
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "DARKNESS", "#a855f7");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.1, 300); // Low hum
                            
                            gameState.screenShake = 3;
                            updates.psyche = gameState.player.psyche;
                        }
                    }
                }
                
                // Pass back to original engine
                if (origEndPlayerTurn) origEndPlayerTurn(updates);
            };
        }
    }
});

// --- END OF FILE expansion-core-delver.js ---
