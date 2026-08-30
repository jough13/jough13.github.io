// --- START OF FILE expansion-core-delver.js ---

window.ExpansionManager.register({
    id: "core_delver",
    name: "The Core Delver (Underworld Sandbox)",
    version: "1.6", // Upgraded version!
    
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
            '🪖m': {
                name: "Miner's Helm", type: 'armor', tile: '🪖', defense: 3, slot: 'armor',
                statBonuses: { perception: 3, constitution: 2 },
                description: "{blue:+3 Def}, {gold:+3 Per}, {green:+2 Con}. Features a built-in arcane lantern. {yellow:Grants permanent light when equipped.}",
                _rarity: 'epic'
            },
            // --- EXPANSION WIN: Dimensional Drill ---
            '🔩': {
                name: 'Dimensional Drill', type: 'consumable', tile: '🔩', _rarity: 'legendary',
                description: "A terrifyingly loud, steam-powered drill. Use to obliterate impassable Mountains (^) or Dungeon Walls (▓) permanently.",
                effect: (state) => {
                    logMessage("{red:Select a direction to Drill... (WASD/Arrows)}");
                    state.isAiming = true;
                    // Hacks into the alchemy throwing engine since it cleanly provides an aim vector!
                    state.abilityToAim = 'throwPotion_Dimensional Drill'; 
                    return false; 
                }
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
                    
                    const validFloors = ['.', 'F', 'd', 'D', '▤', '=', '🧊'];
                    if (state.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[state.currentCaveTheme]) {
                        validFloors.push(CAVE_THEMES[state.currentCaveTheme].floor);
                    }
                    
                    while(traveled < 60) { // Max 60 tiles per push
                        let nX = curX + vX;
                        let nY = curY + vY;
                        let t = getT(nX, nY);
                        
                        // --- GAMEPLAY WIN: THE TRAMPLE MECHANIC! ---
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
                                        
                                        chunkManager.setWorldTile(nX, nY, droppedLoot || '.', 2);
                                        
                                        batchedPayload[EnemyNetworkManager.getPath(nX, nY, enemyId)] = null; // Delete
                                        delete state.sharedEnemies[enemyId];
                                    } else {
                                        enemySurvived = true;
                                        batchedPayload[EnemyNetworkManager.getPath(nX, nY, enemyId)] = JSON.parse(JSON.stringify(liveEnemy));
                                    }
                                }
                            } else {
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
                            
                            // 🚨 BUG FIX: Boss Trample Crash!
                            // If the enemy survives, we must break the loop instantly BEFORE mutating the player's 
                            // position, ensuring they don't visually phase right through the enemy's body!
                            if (enemySurvived) {
                                logMessage(`{orange:The minecart crashes violently into the massive ${enemyName} and comes to a dead stop!}`);
                                break; 
                            }

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
                                if (validFloors.includes(t)) {
                                    curX = nX; curY = nY;
                                } else {
                                    break; 
                                }
                            }
                        }
                        
                        // Spark and Smoke trail!
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.spawn(curX, curY, '#9ca3af', 'smoke', '', 2);
                            if (Math.random() < 0.4) ParticleSystem.spawn(curX, curY, '#facc15', 'sparkle', '', 2);
                        }
                        
                        traveled++;
                    }
                    
                    if (Object.keys(batchedPayload).length > 0 && typeof rtdb !== 'undefined') {
                        rtdb.ref().update(batchedPayload).catch(e => console.error("Trample Sync Error:", e));
                    }

                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                        chunkManager.setWorldTile(x, y, null); 
                    }

                    state.player.x = curX;
                    state.player.y = curY;
                    
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                    const existing = state.player.inventory.find(i => i && i.name === 'Minecart' && !i.isEquipped);
                    
                    if (existing) {
                        existing.quantity++;
                    } else if (state.player.inventory.length < invCap) {
                        state.player.inventory.push({ templateId: '🛒', name: 'Minecart', type: 'constructible', quantity: 1, tile: '🛒', isEquipped: false });
                    } else {
                        logMessage("{red:Your pack is full! The Minecart drops to the ground.}");
                        
                        // 🚨 BUG FIX: Secure drop
                        if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                            window.EventManager.safeDropItem(state, curX, curY, '🛒');
                        } else {
                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(curX, curY, '🛒', 24);
                            else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][curY][curX] = '🛒';
                            else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][curY][curX] = '🛒';
                        }
                    }

                    logMessage("{gray:The minecart grinds to a halt. You pocket it.}");
                    state.mapDirty = true;
                    if (typeof renderInventory === 'function') renderInventory();

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
                { name: "Miner's Helm", price: 2500, stock: 1 },
                { name: "Dimensional Drill", price: 4000, stock: 1 }
            ]
        },

        // --- 5. RECIPES ---
        craftingRecipes: {
            "Minecart Track": { materials: { "Iron Ore": 2 }, xp: 20, level: 3, yield: 5 },
            "Minecart": { materials: { "Iron Ore": 5, "Wood Log": 2 }, xp: 50, level: 3 },
            "Dwarven TNT": { materials: { "Stone": 2, "Elemental Core": 1 }, xp: 60, level: 4, yield: 2 }
        },

        alchemyRecipes: {
            "Dimensional Drill": { materials: {}, xp: 0, level: 1, yield: 1, hidden: true }
        }
    },

    // --- 6. ENGINE HOOKS ---
    init: function() {

        // ==========================================
        // 1. UNDERWORLD MINING (SANDBOX TERRAIN)
        // ==========================================
        
        const applySafePatch = (target, method, factory) => {
            if (typeof window.ExpansionManager.patchFunction === 'function') {
                window.ExpansionManager.patchFunction(target, method, factory);
            } else {
                const orig = target[method];
                target[method] = factory(orig ? orig.bind(target) : null);
            }
        };

        if (typeof window.attemptMovePlayer === 'function') {
            applySafePatch(window, 'attemptMovePlayer', (origAttemptMove) => {
                return async function(newX, newY) {
                    if (gameState.mapMode === 'underworld') {
                        const tile = chunkManager.getTile(newX, newY);
                        
                        if (tile === '▓') {
                            const hasPickaxe = gameState.player.inventory.some(i => i && !i.isEquipped && (i.name === 'Pickaxe' || i.name === 'Diamond Tipped Pickaxe'));
                            
                            if (hasPickaxe) {
                                if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;

                                try {
                                    isProcessingMove = true;
                                    
                                    if (gameState.player.stamina < 2 && !gameState.godMode) {
                                        logMessage("{red:You are too exhausted to mine through solid rock.}");
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                        return;
                                    }
                                    
                                    if (!gameState.godMode) {
                                        if (typeof window.modifyVital === 'function') window.modifyVital('stamina', -2);
                                        else gameState.player.stamina = Math.max(0, gameState.player.stamina - 2);
                                    }
                                    
                                    // Dynamic particle color based on the wall's biome color!
                                    let explosionColor = '#4b5563'; 
                                    const realmOffset = (gameState.currentRealm || 0) * 100;
                                    const elev = typeof elevationNoise !== 'undefined' ? elevationNoise.noise(newX / 70, newY / 70, realmOffset) : 0.5;
                                    const moist = typeof moistureNoise !== 'undefined' ? moistureNoise.noise(newX / 50, newY / 50, realmOffset) : 0.5;
                                    
                                    if (elev < 0.15) explosionColor = '#991b1b'; 
                                    else if (elev > 0.85) explosionColor = '#1f2937'; 
                                    else if (moist > 0.75) explosionColor = '#7e22ce'; 
                                    else if (moist < 0.25 && Math.abs(elev - 0.5) > 0.3) explosionColor = '#06b6d4'; 

                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, explosionColor, 15);
                                    gameState.screenShake = 5;

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
                                        chunkManager.setWorldTile(newX, newY, '.');
                                        
                                        logMessage("{red:You breached a nest! A Gore-Maw Crawler attacks!}");
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                        
                                        const eTemplate = window.ENEMY_DATA['🐛d'];
                                        const eId = `overworld:${newX},${-newY}`;
                                        const scaled = typeof getScaledEnemy === 'function' ? getScaledEnemy(eTemplate, newX, newY) : eTemplate;
                                        
                                        gameState.sharedEnemies[eId] = { ...scaled, tile: '🐛d', x: newX, y: newY, spawnTime: Date.now() };
                                        
                                        if (typeof updateSpatialMap === 'function') updateSpatialMap(eId, null, null, newX, newY);
                                        if (typeof EnemyNetworkManager !== 'undefined' && typeof rtdb !== 'undefined') {
                                            rtdb.ref(EnemyNetworkManager.getPath(newX, newY, eId)).set(gameState.sharedEnemies[eId]);
                                        }
                                    } else if (loot === '💎c') {
                                        chunkManager.setWorldTile(newX, newY, '💎c'); 
                                        logMessage("{cyan:You unearth a beautiful, glowing cluster of crystals!}");
                                    } else if (loot) {
                                        chunkManager.setWorldTile(newX, newY, loot, 24); 
                                        logMessage("{yellow:You unearthed something in the rock!}");
                                    } else {
                                        chunkManager.setWorldTile(newX, newY, '.'); 
                                        logMessage("You carve a path through the solid stone.");
                                    }
                                    
                                    gameState.mapDirty = true;
                                    if (typeof render === 'function') render();
                                    if (typeof endPlayerTurn === 'function') endPlayerTurn();
                                    
                                } finally {
                                    isProcessingMove = false;
                                }
                                return;
                            }
                        }
                    }
                    if (origAttemptMove) return origAttemptMove.call(this, newX, newY);
                };
            });
        }

        // ==========================================
        // 2. THE SUFFOCATING DARKNESS & LIGHT RENDER HOOK
        // ==========================================

        applySafePatch(window, 'endPlayerTurn', (origEndPlayerTurn) => {
            return function(updates = {}) {
                if (gameState.mapMode === 'underworld') {
                    
                    let hasLight = gameState.player.candlelightTurns > 0;
                    
                    if (!hasLight) {
                        for (let i = 0; i < gameState.player.inventory.length; i++) {
                            const item = gameState.player.inventory[i];
                            if (!item) continue;
                            
                            if (!item.isEquipped && (item.name === 'Torch' || item.name === 'Ever-Burning Candle' || item.name === 'Luminous Spore')) {
                                hasLight = true;
                                break;
                            }
                            if (item.isEquipped && (item.name === "Miner's Helm" || item.name === "Sun-Forged Blade" || item.name === "Star-Forged Blade")) {
                                hasLight = true;
                                break;
                            }
                        }
                    }
                    
                    if (!hasLight && !gameState.godMode) {
                        if (Math.random() < 0.25) {
                            logMessage("{purple:The suffocating darkness presses against your mind... (-1 Psyche, -1 HP)}");
                            
                            if (typeof window.modifyVital === 'function') {
                                window.modifyVital('psyche', -1);
                                window.modifyVital('health', -1);
                            } else {
                                gameState.player.psyche = Math.max(0, gameState.player.psyche - 1);
                                gameState.player.health = Math.max(0, gameState.player.health - 1);
                            }
                            
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "DARKNESS", "#a855f7");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.1, 300); 
                            
                            gameState.screenShake = 3;
                            updates.psyche = gameState.player.psyche;
                            updates.health = gameState.player.health;
                        }
                    }
                }
                if (origEndPlayerTurn) origEndPlayerTurn.call(this, updates);
            };
        });

        // 🌟 GAMEPLAY & UI WIN: Inject the Miner's Helm into the light rendering logic dynamically
        if (typeof window.ExpansionManager !== 'undefined') {
            if (!window.ExpansionManager.activeHooks['onRenderOverlay']) window.ExpansionManager.activeHooks['onRenderOverlay'] = [];
            
            window.ExpansionManager.activeHooks['onRenderOverlay'].push({
                id: 'miners_helm_light',
                func: (context) => {
                    const eqArmor = gameState.player.equipment?.armor;
                    if (eqArmor && eqArmor.name === "Miner's Helm") {
                        // The engine natively calculates its own darkness. We fake a candlelight cast if wearing the helm!
                        if (gameState.player.candlelightTurns <= 0 && (gameState.mapMode === 'dungeon' || gameState.mapMode === 'underworld')) {
                            // Since this hook fires during the render loop (60fps), we DO NOT save this to the DB!
                            // We just mutate it dynamically for this specific frame, so the darkness gradient math sees it
                            // Note: We don't actually change `candlelightTurns` so it doesn't print "Light expires"
                            gameState.player._fakeLight = true; 
                        }
                    }
                }
            });
        }

        // ==========================================
        // 3. DIMENSIONAL DRILL LOGIC (THROW INTERCEPTOR)
        // ==========================================

        if (typeof window.executeThrowPotion !== 'undefined') {
            applySafePatch(window, 'executeThrowPotion', (origExecuteThrow) => {
                return async function(abilityId, dirX, dirY) {
                    if (abilityId === 'throwPotion_Dimensional Drill') {
                        const player = gameState.player;
                        
                        if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
                        isProcessingMove = true;
                        
                        try {
                            const invIndex = player.inventory.findIndex(i => i && i.name === 'Dimensional Drill' && !i.isEquipped);
                            if (invIndex > -1) {
                                player.inventory[invIndex].quantity--;
                                if (player.inventory[invIndex].quantity <= 0) player.inventory.splice(invIndex, 1);
                                if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
                            } else {
                                logMessage("{red:You do not have a Dimensional Drill.}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                return;
                            }

                            const tx = player.x + dirX;
                            const ty = player.y + dirY;

                            logMessage("{red:VRRRRRRRRRRRR! The drill roars to life!}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(2.0, 0.4, 200); 
                            gameState.screenShake = 40;

                            await new Promise(resolve => setTimeout(resolve, 500));

                            let tileAt = '.';
                            let validFloor = '.';
                            
                            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                                tileAt = chunkManager.getTile(tx, ty);
                            } else if (gameState.mapMode === 'dungeon') {
                                tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx] || '▓';
                                const theme = window.CAVE_THEMES[gameState.currentCaveTheme];
                                if (theme) validFloor = theme.floor;
                            } else {
                                tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx] || '▓';
                            }

                            // Only drill solid, impassable obstacles!
                            if (['^', '▓', '▒', '🧱'].includes(tileAt)) {
                                logMessage("{gold:The machine obliterates the solid rock, creating a permanent pathway!}");
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, '#facc15', 30);
                                
                                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(tx, ty, '.');
                                else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][ty][tx] = validFloor;
                                else chunkManager.castleMaps[gameState.currentCastleId][ty][tx] = '.';
                                
                            } else {
                                logMessage("{gray:The drill violently grinds the dirt into dust, finding no resistance.}");
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, '#d4d4d8', 20);
                            }

                            gameState.isAiming = false;
                            gameState.mapDirty = true;
                            if (typeof render === 'function') render();
                            if (typeof endPlayerTurn === 'function') endPlayerTurn();

                        } finally {
                            isProcessingMove = false;
                        }
                        return; // Prevent original throw potion logic from executing
                    }
                    
                    if (origExecuteThrow) return origExecuteThrow.apply(this, arguments);
                };
            });
        }

        // ==========================================
        // 4. MINIMAP INTEGRATION
        // ==========================================

        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🛤️'] = [100, 116, 139, 255]; // Grey tracks
            window.TILE_COLOR_MAP['🛒'] = [100, 116, 139, 255]; // Grey cart
            window.TILE_COLOR_MAP['🐛d'] = [220, 38, 38, 255]; // Red Worm
            window.TILE_COLOR_MAP['🔩'] = [245, 158, 11, 255]; // Golden drill
        }
    }
});

// --- END OF FILE expansion-core-delver.js ---
