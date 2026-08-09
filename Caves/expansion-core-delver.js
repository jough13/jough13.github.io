// --- START OF FILE expansion-core-delver.js ---

window.ExpansionManager.register({
    id: "core_delver",
    name: "The Core Delver (Underworld Sandbox)",
    version: "1.2", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🛤️': { 
                name: 'Minecart Track', type: 'constructible', tile: '🛤️', 
                description: "Place on the ground to guide minecarts around corners." 
            },
            '🛒': { 
                name: 'Minecart', type: 'constructible', tile: '🛒', 
                description: "Place on tracks and hop in to travel rapidly. Runs over enemies!" 
            },
            '🦴u': {
                name: 'Fossilized Titan Bone', type: 'trade', tile: '🦴',
                description: "A bone so massive and dense it feels like solid iron. Uncovered in the deep crust.", value: 200, _rarity: 'rare'
            },
            '📜ud': {
                name: 'Miner\'s Last Scrawl', type: 'journal', title: 'A Crumbled Note', tile: '📜',
                content: "We dug past the granite. Past the obsidian. The rocks here are warm, and they... pulse. Like a heartbeat. The lanterns keep going out. I hear chewing in the dark. Do not send a rescue party."
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '🐛d': {
                name: 'Gore-Maw Crawler', tags: ['beast', 'bug', 'monster'], mountable: false,
                maxHealth: 45, attack: 8, defense: 3, xp: 90,
                color: '#dc2626', loot: '🦴u',
                flavor: "A blind, writhing subterranean horror with a mouth full of spinning, razor-sharp rock teeth."
            }
        },

        // --- 3. NEW TILES ---
        tiles: {
            '🛤️': {
                type: 'decoration', name: 'Minecart Track',
                flavor: "Iron tracks bolted to wooden ties."
            }
        },

        // --- 4. SHOPS ---
        shops: {
            trader: [
                { name: 'Minecart Track', price: 50, stock: 20 },
                { name: 'Minecart', price: 200, stock: 2 }
            ]
        },

        // --- 5. RECIPES ---
        // 🌟 EXPANDABILITY WIN: Defined natively inside the expansion data payload!
        craftingRecipes: {
            "Minecart Track": { materials: { "Iron Ore": 2 }, xp: 20, level: 3, yield: 5 },
            "Minecart": { materials: { "Iron Ore": 5, "Wood Log": 2 }, xp: 50, level: 3 },
            // Give a recipe to the existing Dwarven TNT so players can blast tunnels!
            "Dwarven TNT": { materials: { "Stone": 2, "Elemental Core": 1 }, xp: 60, level: 4, yield: 2 }
        }
    },

    // --- 6. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. MINE-CART RIDING OVERHAUL (WITH TRAMPLE!)
        // ==========================================
        // Upgrade the original TILE_DATA['🛒'] to support smart track-following and enemy trampling!
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
                    if (state.mapMode === 'dungeon') return chunkManager.caveMaps[state.currentCaveId]?.[ty]?.[tx] || '▓';
                    return chunkManager.castleMaps[state.currentCastleId]?.[ty]?.[tx] || '▓';
                };

                // 🚨 PERFORMANCE WIN: Batch enemy trample updates!
                const batchedPayload = {};
                let traveled = 0;
                
                while(traveled < 60) { // Max 60 tiles per push
                    let nX = curX + vX;
                    let nY = curY + vY;
                    let t = getT(nX, nY);
                    
                    // --- GAMEPLAY WIN: THE TRAMPLE MECHANIC! ---
                    // If we hit an enemy while rolling, we crush them and keep going!
                    if (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[t]) {
                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                            const enemyId = `overworld:${nX},${-nY}`;
                            const liveEnemy = state.sharedEnemies[enemyId];
                            
                            if (liveEnemy) {
                                logMessage(`{red:CRUNCH! You ran over the ${liveEnemy.name}!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(nX, nY, '#ef4444', 20);
                                state.screenShake = 10;
                                
                                liveEnemy.health -= 100; // Massive trample damage!
                                
                                if (liveEnemy.health <= 0) {
                                    if (typeof registerKill === 'function') registerKill(liveEnemy);
                                    
                                    const baseEnemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[t] : null;
                                    const lootData = baseEnemyData ? { ...baseEnemyData, isElite: liveEnemy.isElite } : null;
                                    const droppedLoot = lootData && typeof generateEnemyLoot === 'function' ? generateEnemyLoot(state.player, lootData) : '$';
                                    
                                    chunkManager.setWorldTile(nX, nY, droppedLoot || '.');
                                    
                                    batchedPayload[EnemyNetworkManager.getPath(nX, nY, enemyId)] = null; // Delete
                                    delete state.sharedEnemies[enemyId];
                                } else {
                                    batchedPayload[EnemyNetworkManager.getPath(nX, nY, enemyId)] = JSON.parse(JSON.stringify(liveEnemy));
                                }
                            }
                        } else {
                            // Instanced Dungeon Trample Fallback
                            const enemy = state.instancedEnemies.find(e => e && e.x === nX && e.y === nY && e.health > 0);
                            if (enemy) {
                                logMessage(`{red:CRUNCH! You ran over the ${enemy.name}!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(nX, nY, '#ef4444', 20);
                                state.screenShake = 10;
                                enemy.health -= 100;
                                if (enemy.health <= 0) {
                                    if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, nX, nY);
                                }
                            }
                        }
                        
                        // We successfully crushed the obstacle, keep rolling forward!
                        curX = nX; curY = nY;
                        traveled++;
                        continue;
                    }
                    
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
                            // 🚨 BUG FIX: Wall Clipping
                            // Only update curX and curY if the tile is explicitly walkable.
                            // If it's not, we break the loop so the player lands on the last safe tile!
                            if (['.', 'F', 'd', 'D'].includes(t)) {
                                curX = nX; curY = nY;
                            } else {
                                break; 
                            }
                        }
                    }
                    
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(curX, curY, '#facc15', 1);
                    traveled++;
                }
                
                // Push the batched trample damage to the server!
                if (Object.keys(batchedPayload).length > 0 && typeof rtdb !== 'undefined') {
                    rtdb.ref().update(batchedPayload).catch(e => console.error("Trample Sync Error:", e));
                }

                // Pick up the minecart and put it in the player's inventory to prevent clutter!
                if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                    // Check if it was sitting on a track at the starting point. If so, leave the track behind!
                    const wasOnTrack = (getT(x, y) === '🛒') ? false : true; 
                    chunkManager.setWorldTile(x, y, wasOnTrack ? '🛤️' : '.'); 
                }

                state.player.x = curX;
                state.player.y = curY;
                
                // Return to inventory
                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                const existing = state.player.inventory.find(i => i && i.name === 'Minecart' && !i.isEquipped);
                
                if (existing) {
                    existing.quantity++;
                } else if (state.player.inventory.length < invCap) {
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
        // 2. UNDERWORLD MINING (SANDBOX TERRAIN)
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
                            // Engage the global engine lock!
                            if (isProcessingMove) return;

                            try {
                                isProcessingMove = true;
                                if (gameState.player.stamina < 2) {
                                    logMessage("{red:You are too exhausted to mine through solid rock.}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                    return;
                                }
                                
                                gameState.player.stamina -= 2;
                                if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('staminaDisplay'), false);
                                
                                // 🎨 JUICE WIN: Dynamic particle color based on the wall's biome color!
                                let explosionColor = '#4b5563'; // Dark Gray (Default Rock)
                                const realmOffset = (gameState.currentRealm || 0) * 100;
                                const elev = typeof elevationNoise !== 'undefined' ? elevationNoise.noise(newX / 70, newY / 70, realmOffset) : 0.5;
                                const moist = typeof moistureNoise !== 'undefined' ? moistureNoise.noise(newX / 50, newY / 50, realmOffset) : 0.5;
                                
                                if (elev < 0.15) explosionColor = '#991b1b'; // Magma Red
                                else if (elev > 0.85) explosionColor = '#1f2937'; // Obsidian Black
                                else if (moist > 0.75) explosionColor = '#7e22ce'; // Fungal Purple
                                else if (moist < 0.25 && Math.abs(elev - 0.5) > 0.3) explosionColor = '#06b6d4'; // Crystal Cyan

                                // Visual & Audio Feedback
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, explosionColor, 15);
                                gameState.screenShake = 5;

                                // Carve the tunnel!
                                chunkManager.setWorldTile(newX, newY, '.'); 
                                
                                // --- DETERMINE LORE & LOOT ---
                                const roll = Math.random();
                                let loot = null;
                                let isAmbush = false;
                                
                                if (roll < 0.02) isAmbush = true; // 2% Gore-Maw Ambush!
                                else if (roll < 0.10) loot = '•'; // Iron
                                else if (roll < 0.15) loot = '▲'; // Obsidian
                                else if (roll < 0.18) loot = '💎'; // Diamond
                                else if (roll < 0.20) loot = '☄️'; // Star Metal
                                else if (roll < 0.22) loot = '📜ud'; // Miner's Scrawl (Lore!)
                                else if (roll < 0.60) loot = '🪨'; // Stone
                                
                                if (isAmbush) {
                                    chunkManager.setWorldTile(newX, newY, '🐛d');
                                    logMessage("{red:You breached a nest! A Gore-Maw Crawler attacks!}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                    
                                    const eTemplate = window.ENEMY_DATA['🐛d'];
                                    const eId = `overworld:${newX},${-newY}`;
                                    const scaled = typeof getScaledEnemy === 'function' ? getScaledEnemy(eTemplate, newX, newY) : eTemplate;
                                    
                                    gameState.sharedEnemies[eId] = { ...scaled, tile: '🐛d', x: newX, y: newY, spawnTime: Date.now() };
                                    
                                    // 🚨 BUG FIX: Instantly register it to the AI grid so it attacks immediately!
                                    if (typeof updateSpatialMap === 'function') updateSpatialMap(eId, null, null, newX, newY);
                                    
                                    if (typeof EnemyNetworkManager !== 'undefined' && typeof rtdb !== 'undefined') {
                                        rtdb.ref(EnemyNetworkManager.getPath(newX, newY, eId)).set(gameState.sharedEnemies[eId]);
                                    }
                                } else if (loot) {
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
        // 3. THE SUFFOCATING DARKNESS
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
                        // 25% chance per turn in the dark to take Psyche and Health damage
                        if (Math.random() < 0.25) {
                            logMessage("{purple:The suffocating darkness presses against your mind... (-1 Psyche, -1 HP)}");
                            window.modifyVital('psyche', -1);
                            window.modifyVital('health', -1);
                            
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "DARKNESS", "#a855f7");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.1, 300); // Low hum
                            
                            gameState.screenShake = 3;
                            updates.psyche = gameState.player.psyche;
                            updates.health = gameState.player.health;
                        }
                    }
                }
                
                // 🚨 BUG FIX: Explicitly pass the updates object via .call()!
                if (origEndPlayerTurn) origEndPlayerTurn.call(this, updates);
            };
        }
        
        // ==========================================
        // 4. MINIMAP INTEGRATION
        // ==========================================
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🛤️'] = [100, 116, 139, 255]; // Grey tracks
            window.TILE_COLOR_MAP['🛒'] = [100, 116, 139, 255]; // Grey cart
            window.TILE_COLOR_MAP['🐛d'] = [220, 38, 38, 255]; // Red Worm
        }
    }
});

// --- END OF FILE expansion-core-delver.js ---
