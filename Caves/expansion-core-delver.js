// --- START OF FILE expansion-core-delver.js ---

window.ExpansionManager.register({
    id: "core_delver",
    name: "The Core Delver (Underworld Sandbox)",
    version: "1.4", // Upgraded version!
    
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
            },
            // --- EXPANSION WIN: The Miner's Helm ---
            '🪖m': {
                name: "Miner's Helm", type: 'armor', tile: '🪖', defense: 3, slot: 'armor',
                statBonuses: { perception: 3, constitution: 2 },
                description: "{blue:+3 Def}, {gold:+3 Per}, {green:+2 Con}. Features a built-in arcane lantern. {yellow:Grants permanent light when equipped.}",
                _rarity: 'epic'
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

        // --- 3. NEW TILES & INTERACTABLES ---
        tiles: {
            '🛤️': {
                type: 'decoration', name: 'Minecart Track',
                flavor: "Iron tracks bolted to wooden ties."
            },
            // 🚨 BUG FIX WIN: Natively registered the Minecart as an anomaly!
            '🛒': {
                type: 'anomaly', name: 'Minecart',
                flavor: "A rusted iron cart. Hop in?",
                onInteract: (state, x, y) => {
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

                    // Batch enemy trample updates!
                    const batchedPayload = {};
                    let traveled = 0;
                    
                    while(traveled < 60) { // Max 60 tiles per push
                        let nX = curX + vX;
                        let nY = curY + vY;
                        let t = getT(nX, nY);
                        
                        // --- GAMEPLAY WIN: THE TRAMPLE MECHANIC! ---
                        // If we hit an enemy while rolling, we crush them and keep going!
                        if (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[t]) {
                            let enemySurvived = false;
                            let enemyName = "Monster";

                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                                const enemyId = `overworld:${nX},${-nY}`;
                                const liveEnemy = state.sharedEnemies[enemyId];
                                
                                if (liveEnemy) {
                                    enemyName = liveEnemy.name;
                                    logMessage(`{red:CRUNCH! You ran over the ${enemyName}!}`);
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
                                        enemySurvived = true;
                                        batchedPayload[EnemyNetworkManager.getPath(nX, nY, enemyId)] = JSON.parse(JSON.stringify(liveEnemy));
                                    }
                                }
                            } else {
                                // Instanced Dungeon Trample Fallback
                                const enemy = state.instancedEnemies.find(e => e && e.x === nX && e.y === nY && e.health > 0);
                                if (enemy) {
                                    enemyName = enemy.name;
                                    logMessage(`{red:CRUNCH! You ran over the ${enemyName}!}`);
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(nX, nY, '#ef4444', 20);
                                    state.screenShake = 10;
                                    enemy.health -= 100;

                                    if (enemy.health <= 0) {
                                        if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, nX, nY);
                                    } else {
                                        enemySurvived = true;
                                    }
                                }
                            }
                            
                            // Boss Trample Crash!
                            // If the enemy survived 100 damage (e.g. a Raid Boss), the minecart physically crashes and stops!
                            if (enemySurvived) {
                                logMessage(`{orange:The minecart crashes violently into the massive ${enemyName} and comes to a dead stop!}`);
                                break; 
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

                    // 🚨 BUG FIX WIN: Safe Cart Erasure
                    // Simply passing `null` tells Firebase and the chunk manager to delete the `🛒` anomaly, 
                    // seamlessly revealing whatever track or floor was natively under it!
                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                        chunkManager.setWorldTile(x, y, null); 
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

                        // Safe Outward Spiral Drop
                        let placed = false;
                        let validFloor = '.';
                        if (state.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[state.currentCaveTheme]) {
                            validFloor = CAVE_THEMES[state.currentCaveTheme].floor;
                        }

                        if (typeof chunkManager !== 'undefined') {
                            for (let r = 0; r <= 2 && !placed; r++) {
                                for (let dy = -r; dy <= r && !placed; dy++) {
                                    for (let dx = -r; dx <= r && !placed; dx++) {
                                        const tx = curX + dx;
                                        const ty = curY + dy;
                                        let tileAt;
                                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') tileAt = chunkManager.getTile(tx, ty);
                                        else if (state.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[state.currentCaveId]?.[ty]?.[tx];
                                        else if (state.mapMode === 'castle') tileAt = chunkManager.castleMaps[state.currentCastleId]?.[ty]?.[tx];

                                        if (tileAt === validFloor || tileAt === '.') {
                                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(tx, ty, '🛒', 24);
                                            else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][ty][tx] = '🛒';
                                            else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][ty][tx] = '🛒';
                                            placed = true;
                                        }
                                    }
                                }
                            }
                            if (!placed) { // Absolute fallback
                                if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(curX, curY, '🛒', 24);
                                else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][curY][curX] = '🛒';
                                else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][curY][curX] = '🛒';
                            }
                        }
                    }

                    logMessage("{gray:The minecart grinds to a halt. You pocket it.}");
                    state.mapDirty = true;
                    if (typeof renderInventory === 'function') renderInventory();

                    // Ensure the inventory changes are synced back to the main game loop!
                    return { 
                        x: curX, 
                        y: curY,
                        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory
                    };
                }
            }
        },

        // --- 4. SHOPS ---
        shops: {
            trader: [
                { name: 'Minecart Track', price: 50, stock: 20 },
                { name: 'Minecart', price: 200, stock: 2 }
            ],
            black_market: [
                { name: "Miner's Helm", price: 2500, stock: 1 }
            ]
        },

        // --- 5. RECIPES ---
        craftingRecipes: {
            "Minecart Track": { materials: { "Iron Ore": 2 }, xp: 20, level: 3, yield: 5 },
            "Minecart": { materials: { "Iron Ore": 5, "Wood Log": 2 }, xp: 50, level: 3 },
            "Dwarven TNT": { materials: { "Stone": 2, "Elemental Core": 1 }, xp: 60, level: 4, yield: 2 }
        }
    },

    // --- 6. ENGINE HOOKS ---
    init: function() {

        // ==========================================
        // 1. UNDERWORLD MINING (SANDBOX TERRAIN)
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
                                
                                // Dynamic particle color based on the wall's biome color!
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

                                // --- DETERMINE LORE & LOOT ---
                                const roll = Math.random();
                                let loot = null;
                                let isAmbush = false;
                                
                                if (roll < 0.02) isAmbush = true; // 2% Gore-Maw Ambush!
                                else if (roll < 0.05) loot = '💎c'; // 3% Chance to leave a glowing crystal cluster!
                                else if (roll < 0.10) loot = '•'; // Iron
                                else if (roll < 0.15) loot = '▲'; // Obsidian
                                else if (roll < 0.18) loot = '💎'; // Diamond
                                else if (roll < 0.20) loot = '☄️'; // Star Metal
                                else if (roll < 0.22) loot = '📜ud'; // Miner's Scrawl (Lore!)
                                else if (roll < 0.60) loot = '🪨'; // Stone
                                
                                if (isAmbush) {
                                    // Drop the wall so the monster can walk towards you!
                                    chunkManager.setWorldTile(newX, newY, '.');
                                    
                                    logMessage("{red:You breached a nest! A Gore-Maw Crawler attacks!}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                    
                                    const eTemplate = window.ENEMY_DATA['🐛d'];
                                    const eId = `overworld:${newX},${-newY}`;
                                    const scaled = typeof getScaledEnemy === 'function' ? getScaledEnemy(eTemplate, newX, newY) : eTemplate;
                                    
                                    gameState.sharedEnemies[eId] = { ...scaled, tile: '🐛d', x: newX, y: newY, spawnTime: Date.now() };
                                    
                                    // Instantly register it to the AI grid so it attacks immediately!
                                    if (typeof updateSpatialMap === 'function') updateSpatialMap(eId, null, null, newX, newY);
                                    
                                    if (typeof EnemyNetworkManager !== 'undefined' && typeof rtdb !== 'undefined') {
                                        rtdb.ref(EnemyNetworkManager.getPath(newX, newY, eId)).set(gameState.sharedEnemies[eId]);
                                    }
                                } else if (loot === '💎c') {
                                    // 🌟 GAMEPLAY WIN: Persistent Light Sources!
                                    // Replaces the wall permanently with a glowing crystal cluster instead of a floor tile
                                    chunkManager.setWorldTile(newX, newY, '💎c'); 
                                    logMessage("{cyan:You unearth a beautiful, glowing cluster of crystals!}");
                                } else if (loot) {
                                    chunkManager.setWorldTile(newX, newY, loot, 24); // Drops on floor for 24h
                                    logMessage("{yellow:You unearthed something in the rock!}");
                                } else {
                                    // Just carve a tunnel
                                    chunkManager.setWorldTile(newX, newY, '.'); 
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
                
                // If not mining, proceed with normal movement safely
                return origAttemptMove.call(this, newX, newY);
            };
        }

        // ==========================================
        // 2. THE SUFFOCATING DARKNESS
        // ==========================================

        // Monkey-patch the turn-ender to apply damage if the player doesn't carry a light source!
        
        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            
            window.endPlayerTurn = function(updates = {}) {
                if (gameState.mapMode === 'underworld') {
                    
                    // 🚨 PERFORMANCE & ROBUSTNESS WIN: Safe array scan
                    // Evaluates if the player holds a torch, OR explicitly has the Miner's Helm equipped!
                    let hasLight = gameState.player.candlelightTurns > 0;
                    
                    if (!hasLight) {
                        for (let i = 0; i < gameState.player.inventory.length; i++) {
                            const item = gameState.player.inventory[i];
                            if (!item) continue;
                            
                            // Torches light up just by holding them
                            if (!item.isEquipped && (item.name === 'Torch' || item.name === 'Ever-Burning Candle')) {
                                hasLight = true;
                                break;
                            }
                            // Helmets MUST be equipped
                            if (item.isEquipped && item.name === "Miner's Helm") {
                                hasLight = true;
                                break;
                            }
                        }
                    }
                    
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
                
                // Explicitly pass the updates object via .call()!
                if (origEndPlayerTurn) origEndPlayerTurn.call(this, updates);
            };
        }
        
        // ==========================================
        // 3. MINIMAP INTEGRATION
        // ==========================================

        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🛤️'] = [100, 116, 139, 255]; // Grey tracks
            window.TILE_COLOR_MAP['🛒'] = [100, 116, 139, 255]; // Grey cart
            window.TILE_COLOR_MAP['🐛d'] = [220, 38, 38, 255]; // Red Worm
        }
    }
});

// --- END OF FILE expansion-core-delver.js ---
