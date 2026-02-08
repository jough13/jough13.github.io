/**
 * Scales an enemy based on distance from the center of the world.
 * Adds prefixes (Weak, Feral, Ancient) and buffs stats.
 */

function getScaledEnemy(enemyTemplate, x, y) {
    // 1. Calculate Distance & Zone
    const dist = Math.sqrt(x * x + y * y);
    const zoneLevel = Math.floor(dist / 150);

    // 2. Clone the template
    let enemy = { ...enemyTemplate };

    // 3. Apply Base Scaling (10% stats per zone level)
    const multiplier = 1 + (zoneLevel * 0.10);

    enemy.maxHealth = Math.floor(enemy.maxHealth * multiplier);
    enemy.attack = Math.floor(enemy.attack * multiplier) + Math.floor(zoneLevel / 3);
    enemy.xp = Math.floor(enemy.xp * multiplier);

    // --- SAFE ZONE NERF ---
    // If within 100 tiles of spawn, weaken enemies significantly
    if (dist < 100) {
        // Reduce Attack by 1 (Min 1). This turns 2 dmg rats into 1 dmg rats.
        enemy.attack = Math.max(1, enemy.attack - 1); 
        // Reduce HP by 20% so they die faster
        enemy.maxHealth = Math.ceil(enemy.maxHealth * 0.8); 
    }
    // -------------------------------------

    // 4. Apply Zone Name (Cosmetic)
    if (zoneLevel === 0) {
        // No prefix for zone 0
    } else if (zoneLevel >= 2 && zoneLevel < 5) {
        enemy.name = `Feral ${enemy.name}`;
    } else if (zoneLevel >= 5 && zoneLevel < 10) {
        enemy.name = `Elder ${enemy.name}`;
    } else if (zoneLevel >= 10) {
        enemy.name = `Ancient ${enemy.name}`;
    }

    // --- 5. Elite Affix Roll ---
    const eliteChance = 0.05 + (zoneLevel * 0.01);

    // --- DISABLE ELITES NEAR SPAWN ---
    // Elites can only spawn if distance > 150. 
    // No more "Savage Rats" killing you at level 1.
    if (dist > 150 && !enemy.isBoss && Math.random() < eliteChance) {
        const prefixKeys = Object.keys(ENEMY_PREFIXES);
        const prefixKey = prefixKeys[Math.floor(Math.random() * prefixKeys.length)];
        const affix = ENEMY_PREFIXES[prefixKey];

        enemy.name = `${prefixKey} ${enemy.name}`;
        enemy.isElite = true;
        enemy.color = affix.color;

        if (affix.statModifiers) {
            if (affix.statModifiers.attack) enemy.attack += affix.statModifiers.attack;
            if (affix.statModifiers.defense) enemy.defense = (enemy.defense || 0) + affix.statModifiers.defense;
            if (affix.statModifiers.maxHealth) enemy.maxHealth += affix.statModifiers.maxHealth;
        }

        if (affix.special === 'poison') {
            enemy.inflicts = 'poison';
            enemy.inflictChance = 0.5;
        } else if (affix.special === 'frostbite') {
            enemy.inflicts = 'frostbite';
            enemy.inflictChance = 0.5;
        }

        enemy.xp = Math.floor(enemy.xp * affix.xpMult);
    }

    // Reset current health to new max
    enemy.health = enemy.maxHealth;

    return enemy;
}
async function wakeUpNearbyEnemies() {

    if (gameState.mapMode !== 'overworld') return;

    // Determine player location
    const player = gameState.player;
    if (!player) return;

    const WAKE_RADIUS = 14; // Increased slightly to ensure they spawn before you see them

    // Use a batch update for map tiles to prevent excessive rendering/saving
    let mapUpdates = {}; 
    let spawnUpdates = {};
    let enemiesSpawnedCount = 0;
    let visualUpdateNeeded = false;

    for (let y = player.y - WAKE_RADIUS; y <= player.y + WAKE_RADIUS; y++) {
        for (let x = player.x - WAKE_RADIUS; x <= player.x + WAKE_RADIUS; x++) {
            
            // 1. Check the static map tile
            const tile = chunkManager.getTile(x, y);
            
            // Optimization: Only check logic if it looks like an enemy tile
            // This prevents looking up ENEMY_DATA for every single grass tile
            if (tile === '.' || tile === 'F' || tile === 'd' || tile === 'D' || tile === '^' || tile === '~' || tile === '≈') continue;

            const enemyData = ENEMY_DATA[tile];

            // 2. If it's a valid enemy tile, we "Wake" it
            if (enemyData) {
                const enemyId = `overworld:${x},${-y}`;

                // Only spawn if it doesn't already exist in the live world
                if (!gameState.sharedEnemies[enemyId] && !pendingSpawnData[enemyId]) {
                    
                    // A. Create the Live Entity
                    const scaledStats = getScaledEnemy(enemyData, x, y);
                    const newEnemy = {
                        ...scaledStats,
                        tile: tile, // Keep visual ref
                        x: x,
                        y: y,
                        spawnTime: Date.now()
                    };

                    // B. Queue for Firebase (The Source of Truth)
                    spawnUpdates[`worldEnemies/${enemyId}`] = newEnemy;
                    
                    // C. Add to local pending (Immediate Visual Feedback)
                    // Add directly to sharedEnemies immediately so there is 0 frames of invisibility
                    pendingSpawnData[enemyId] = newEnemy;
                    gameState.sharedEnemies[enemyId] = newEnemy; 
                    
                    // D. Update Spatial Map immediately so AI knows it exists
                    updateSpatialMap(enemyId, null, null, x, y);

                    // E. CONSUME THE MAP TILE
                    chunkManager.setWorldTile(x, y, '.'); 
                    
                    enemiesSpawnedCount++;
                    visualUpdateNeeded = true;
                }
            }
        }
    }

    // 3. Send Batch to Firebase (Atomic Operation)
    if (enemiesSpawnedCount > 0) {
        rtdb.ref().update(spawnUpdates).catch(err => {
            console.error("Mass Spawn Error:", err);
        });
    }

    // 4. Force Render if we changed anything
    if (visualUpdateNeeded) {
        gameState.mapDirty = true; // Forces terrain cache to redraw (removing static 'r')
        render(); // Draws the new dynamic 'r' on top immediately
    }
}

/**
 * Asynchronously runs the AI turns for shared maps.
 * Uses a Firebase RTDB Transaction to ensure only ONE client
 * runs the AI per interval. Includes logic to break stale locks.
 */
async function runSharedAiTurns() {
    
    if (gameState.mapMode !== 'overworld') return; 

    const now = Date.now();
    const AI_INTERVAL = 150; // Match action cooldown
    const STALE_TIMEOUT = 5000; // 5 seconds - if heartbeat is older than this, steal it

    const heartbeatRef = rtdb.ref('worldState/aiHeartbeat');

    try {
        const result = await heartbeatRef.transaction((lastHeartbeat) => {
            // 1. If no heartbeat exists, claim it
            if (!lastHeartbeat) return now;

            // 2. If the lock is "stale" (old host crashed/lagged out), claim it
            if (now - lastHeartbeat > STALE_TIMEOUT) return now;

            // 3. Standard interval check
            if (now - lastHeartbeat >= AI_INTERVAL) return now;

            // 4. Otherwise, abort (someone else ran it recently)
            return;
        });

        // If we won the race (committed = true), run the logic
        if (result.committed) {
            const nearestEnemyDir = await processOverworldEnemyTurns();

            // Client-side intuition feedback
            if (nearestEnemyDir) {
                const player = gameState.player;
                // Chance to hear/sense enemies based on stats
                const intuitChance = Math.min(player.intuition * 0.005, 0.5);
                if (Math.random() < intuitChance) {
                    const dirString = getDirectionString(nearestEnemyDir);
                    logMessage(`You sense a hostile presence to the ${dirString}!`);
                }
            }
        }
    } catch (err) {
        console.error("AI Heartbeat Transaction failed:", err);
    }
}

async function processOverworldEnemyTurns() {

    if (gameState.mapMode !== 'overworld') return;

    const playerX = gameState.player.x;
    const playerY = gameState.player.y;
    const searchRadius = 25;
    const searchDistSq = searchRadius * searchRadius;
    const HEARING_DISTANCE_SQ = 15 * 15;

    let nearestEnemyDir = null;
    let minDist = Infinity; 
    let multiPathUpdate = {};
    let movesQueued = false;
    const processedIdsThisFrame = new Set();

    // 1. Gather candidates from local buckets
    const activeEnemyIds = [];
    const pChunkX = Math.floor(playerX / SPATIAL_CHUNK_SIZE);
    const pChunkY = Math.floor(playerY / SPATIAL_CHUNK_SIZE);

    for (let y = pChunkY - 1; y <= pChunkY + 1; y++) {
        for (let x = pChunkX - 1; x <= pChunkX + 1; x++) {
            const key = `${x},${y}`;
            if (gameState.enemySpatialMap.has(key)) {
                gameState.enemySpatialMap.get(key).forEach(id => activeEnemyIds.push(id));
            }
        }
    }

    // Helper: Valid path check for overworld
    const isValidMove = (tx, ty, enemyType) => {
        const t = chunkManager.getTile(tx, ty);
        if (t === '~') return false; // Water blocks most
        if (['.', 'F', 'd', 'D', '≈'].includes(t)) return true;
        if (t === '^') {
            const climbers = ['Y', '🐲', 'Ø', 'g', 'o', '🦇', '🦅'];
            return climbers.includes(enemyType);
        }
        return false;
    };

    for (const enemyId of activeEnemyIds) {
        if (processedIdsThisFrame.has(enemyId)) continue;

        const enemy = gameState.sharedEnemies[enemyId];
                // --- SAFETY CHECK ---
        // If enemy is missing or coords are invalid, skip it (don't crash the loop)
        if (!enemy || typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            continue;
        }

        const distSq = Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2);
        if (distSq > searchDistSq) continue;

        // --- AI LOGIC ---
        let chaseChance = 0.20;
        if (distSq < 400) chaseChance = 0.85; // Close range
        if (distSq < 100) chaseChance = 1.00; // Aggressive

        if (Math.random() < 0.80) { // 80% chance to act per turn
            let dirX = 0, dirY = 0;
            let isChasing = false;

            if (Math.random() < chaseChance) {
                dirX = Math.sign(playerX - enemy.x);
                dirY = Math.sign(playerY - enemy.y);
                isChasing = true;
            } else {
                dirX = Math.floor(Math.random() * 3) - 1;
                dirY = Math.floor(Math.random() * 3) - 1;
            }

            if (dirX === 0 && dirY === 0) continue;

            let finalX = enemy.x + dirX;
            let finalY = enemy.y + dirY;
            let canMove = false;

            // Simple collision check with world terrain
            if (isValidMove(finalX, finalY, enemy.tile)) {
                canMove = true;
            } 
            // Pathfinding "slide" (if diagonal blocked, try cardinal)
            else if (isChasing) {
                if (dirX !== 0 && isValidMove(enemy.x + dirX, enemy.y, enemy.tile)) {
                    finalX = enemy.x + dirX; finalY = enemy.y; canMove = true;
                } else if (dirY !== 0 && isValidMove(enemy.x, enemy.y + dirY, enemy.tile)) {
                    finalX = enemy.x; finalY = enemy.y + dirY; canMove = true;
                }
            }

            if (canMove) {
                // Combat Check
                if (finalX === playerX && finalY === playerY) {
                    const dmg = Math.max(1, enemy.attack - (gameState.player.defenseBonus || 0));
                    gameState.player.health -= dmg;
                    gameState.screenShake = 10;

                    const wrapper = document.getElementById('gameCanvasWrapper');
                    wrapper.classList.remove('damage-flash'); // Reset animation
                    void wrapper.offsetWidth; // Trigger reflow
                    wrapper.classList.add('damage-flash');

                    logMessage(`A ${enemy.name} attacks you for ${dmg} damage!`);
                    triggerStatFlash(statDisplays.health, false);
                    if (gameState.player.health <= 0) handlePlayerDeath();
                    processedIdsThisFrame.add(enemyId);
                    continue; 
                }

                // --- EXPANSION: PERCEPTION HINT ---
                // If an enemy moves closer and is within "hearing" range but outside "vision"
                const oldDist = Math.sqrt(Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2));
                const newDist = Math.sqrt(Math.pow(playerX - finalX, 2) + Math.pow(playerY - finalY, 2));
                
                // If it got closer, is chasing, and is roughly 10-15 tiles away (just offscreen)
                if (newDist < oldDist && isChasing && newDist > 10 && newDist < 16) {
                    // 10% chance to hear it so chat isn't spammed
                    if (Math.random() < 0.10) {
                        // Invert direction: if enemy is to the North (0, -1), the sound comes FROM the North.
                        // We use the enemy's movement dir (dirX, dirY). If enemy moves South (0, 1) to chase you,
                        // they are currently North of you.
                        // Actually, getDirectionString takes a vector. Let's calculate the vector relative to player.
                        const soundDir = { x: Math.sign(enemy.x - playerX), y: Math.sign(enemy.y - playerY) };
                        const dirStr = getDirectionString(soundDir); 
                        logMessage(`{gray:You hear twigs snapping to the ${dirStr}...}`);
                    }
                }

                // --- EXECUTE MOVE & SYNC BUCKETS ---
                const newId = `overworld:${finalX},${-finalY}`;
                
                // If another enemy just moved into this exact coordinate this turn, skip
                if (gameState.sharedEnemies[newId] || multiPathUpdate[`worldEnemies/${newId}`]) continue;

                const updatedEnemy = { ...enemy, x: finalX, y: finalY };
                if (updatedEnemy._processedThisTurn) delete updatedEnemy._processedThisTurn;

                // 1. Prepare Firebase Batch
                multiPathUpdate[`worldEnemies/${newId}`] = updatedEnemy;
                multiPathUpdate[`worldEnemies/${enemyId}`] = null;

                // 2. Update Local "sharedEnemies" (Snappy Visuals)
                delete gameState.sharedEnemies[enemyId];
                gameState.sharedEnemies[newId] = updatedEnemy;

                // 3. CRITICAL: Update Spatial Map Buckets immediately
                // This prevents the enemy from "vanishing" from the AI loop
                updateSpatialMap(enemyId, enemy.x, enemy.y, null, null); // Remove old
                updateSpatialMap(newId, null, null, finalX, finalY);     // Add new

                processedIdsThisFrame.add(newId);
                movesQueued = true;

                // Intuition logic
                if (distSq < minDist && distSq < HEARING_DISTANCE_SQ) {
                    minDist = distSq;
                    nearestEnemyDir = { x: Math.sign(finalX - playerX), y: Math.sign(finalY - playerY) };
                }
            }
        }
    }

    if (movesQueued) {
        rtdb.ref().update(multiPathUpdate).catch(err => console.error("AI Sync Error:", err));
    }

    return nearestEnemyDir;
}

function processEnemyTurns() {
    // This function only runs for dungeon/castle enemies
    if (gameState.mapMode !== 'dungeon' && gameState.mapMode !== 'castle') {
        return null;
    }

    // Get the correct map and theme
    let map;
    let theme;
    if (gameState.mapMode === 'dungeon') {
        map = chunkManager.caveMaps[gameState.currentCaveId];
        theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
    } else {
        map = chunkManager.castleMaps[gameState.currentCastleId];
        theme = { floor: '.' };
    }

    if (!map) return null;

    let nearestEnemyDir = null;
    let minDist = Infinity;
    const HEARING_DISTANCE_SQ = 15 * 15;
    const player = gameState.player;

    // Helper: Check if a tile is free
    const isWalkable = (tx, ty) => {
        return map[ty] && map[ty][tx] === theme.floor;
    };

    // Loop through a copy so we can modify the original list safely
    const enemiesToMove = [...gameState.instancedEnemies];

    enemiesToMove.forEach(enemy => {

        // --- 1. STATUS EFFECTS (Turn Skips) ---
        if (enemy.rootTurns > 0) {
            enemy.rootTurns--;
            logMessage(`The ${enemy.name} struggles against roots!`);
            if (enemy.rootTurns === 0) logMessage(`The ${enemy.name} breaks free.`);
            return;
        }
        if (enemy.stunTurns > 0) {
            enemy.stunTurns--;
            logMessage(`The ${enemy.name} is stunned!`);
            return;
        }

        // --- 2. MADNESS LOGIC (Forced Fleeing) ---
        if (enemy.madnessTurns > 0) {
            enemy.madnessTurns--;
            // Move AWAY from player
            const fleeDirX = -Math.sign(player.x - enemy.x);
            const fleeDirY = -Math.sign(player.y - enemy.y);
            const newX = enemy.x + fleeDirX;
            const newY = enemy.y + fleeDirY;

            if (isWalkable(newX, newY)) {
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX;
                enemy.y = newY;
                logMessage(`The ${enemy.name} flees in terror!`);
            } else {
                logMessage(`The ${enemy.name} cowers in the corner!`);
            }

            if (enemy.madnessTurns === 0) logMessage(`The ${enemy.name} regains its senses.`);
            return; // Turn Over
        }

        // --- 3. DAMAGE STATUS EFFECTS ---
        if (enemy.frostbiteTurns > 0) {
            enemy.frostbiteTurns--;
            if (enemy.frostbiteTurns === 0) logMessage(`The ${enemy.name} is no longer frostbitten.`);
            if (Math.random() < 0.25) {
                logMessage(`The ${enemy.name} is frozen solid and skips its turn!`);
                return;
            }
        }

        if (enemy.poisonTurns > 0) {
            enemy.poisonTurns--;
            enemy.health -= 1;
            logMessage(`The ${enemy.name} takes poison damage.`);
            if (enemy.health <= 0) {
                logMessage(`The ${enemy.name} succumbs to poison!`);
                registerKill(enemy);
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                    chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                }
                map[enemy.y][enemy.x] = generateEnemyLoot(player, enemy);
                return;
            }
            if (enemy.poisonTurns === 0) logMessage(`The ${enemy.name} is no longer poisoned.`);
        }

        // --- 4. CALCULATE DISTANCE ---
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // --- 5. DORMANT CHECK ---
        // If enemy is > 25 tiles away, they don't move/act.
        if (dist > 25) return;

        // --- 6. BOSS & ELITE BEHAVIORS ---
        if (enemy.isBoss) {
            // Boss Immunity
            if ((enemy.poisonTurns > 0 || enemy.rootTurns > 0) && Math.random() < 0.5) {
                enemy.poisonTurns = 0; enemy.rootTurns = 0;
                logMessage(`The ${enemy.name} shrugs off your magic!`);
            }

            // --- BOSS ENRAGE PHASES ---
            if (enemy.health < enemy.maxHealth * 0.5 && !enemy.hasEnraged) {
                enemy.hasEnraged = true; // Ensure it only happens once

                // 1. NECROMANCER LORD: Army of the Dead
                if (enemy.name.includes("Necromancer")) {
                    logMessage(`The ${enemy.name} screams! "ARISE, MY SERVANTS!"`);
                    gameState.screenShake = 20;

                    // Spawn 3 Skeletons around him
                    const offsets = [[-1, -1], [1, -1], [0, 1], [-1, 1], [1, 1]];
                    let spawned = 0;
                    for (let ofs of offsets) {
                        if (spawned >= 3) break;
                        const sx = enemy.x + ofs[0];
                        const sy = enemy.y + ofs[1];
                        if (isWalkable(sx, sy)) {
                            map[sy][sx] = 's';
                            const t = ENEMY_DATA['s'];
                            // Create scaled minion
                            gameState.instancedEnemies.push({
                                id: `${gameState.currentCaveId}:minion_${Date.now()}_${spawned}`,
                                x: sx, y: sy, tile: 's', name: "Enraged Skeleton",
                                health: t.maxHealth, maxHealth: t.maxHealth,
                                attack: t.attack + 1, defense: t.defense, xp: 5
                            });
                            ParticleSystem.createExplosion(sx, sy, '#a855f7'); // Purple smoke
                            spawned++;
                        }
                    }
                }

                // 2. VOID DEMON: Reality Shift
                else if (enemy.name.includes("Demon") || enemy.tile === 'D') {
                    logMessage(`The ${enemy.name} roars and shatters reality!`);
                    gameState.screenShake = 30;

                    // Teleport PLAYER to a random spot in the room
                    let teleported = false;
                    for (let i = 0; i < 10; i++) {
                        const tx = player.x + (Math.floor(Math.random() * 10) - 5);
                        const ty = player.y + (Math.floor(Math.random() * 10) - 5);
                        if (isWalkable(tx, ty)) {
                            player.x = tx;
                            player.y = ty;
                            teleported = true;
                            break;
                        }
                    }

                    if (teleported) {
                        logMessage("You are thrown through the void!");
                        ParticleSystem.createExplosion(player.x, player.y, '#a855f7');
                        gameState.isAiming = false;
                    }

                    // Buff the Demon
                    enemy.attack += 2;
                    logMessage(`The ${enemy.name} grows stronger!`);
                }

                return; // Enrage consumes the turn
            }

            // Boss Summon (20% chance if close)
            if (dist < 10 && Math.random() < 0.20) {
                const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (let ofs of offsets) {
                    const sx = enemy.x + ofs[0];
                    const sy = enemy.y + ofs[1];
                    if (isWalkable(sx, sy)) {
                        map[sy][sx] = 's';
                        const t = ENEMY_DATA['s'];
                        gameState.instancedEnemies.push({
                            id: `${gameState.currentCaveId}:minion_${Date.now()}`,
                            x: sx, y: sy, tile: 's', name: "Summoned Skeleton",
                            health: t.maxHealth, maxHealth: t.maxHealth, attack: t.attack, defense: t.defense, xp: 0
                        });
                        logMessage(`The ${enemy.name} summons a Skeleton!`);
                        return; // Turn used
                    }
                }
            }
            // Boss Panic Teleport
            if (enemy.health < enemy.maxHealth * 0.25 && Math.random() < 0.25) {
                const tx = Math.max(1, Math.min(map[0].length - 2, enemy.x + (Math.floor(Math.random() * 10) - 5)));
                const ty = Math.max(1, Math.min(map.length - 2, enemy.y + (Math.floor(Math.random() * 10) - 5)));
                if (isWalkable(tx, ty)) {
                    map[enemy.y][enemy.x] = theme.floor;
                    map[ty][tx] = enemy.tile;
                    enemy.x = tx; enemy.y = ty;
                    logMessage(`The ${enemy.name} vanishes in mist!`);
                    return;
                }
            }
        }

        // Void Stalker Teleport
        if (enemy.teleporter) {
            if (dist > 1.5 && Math.random() < 0.20) {
                const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const pick = offsets[Math.floor(Math.random() * offsets.length)];
                const tx = player.x + pick[0];
                const ty = player.y + pick[1];
                if (isWalkable(tx, ty)) {
                    const occupied = gameState.instancedEnemies.some(e => e.x === tx && e.y === ty);
                    if (!occupied) {
                        map[enemy.y][enemy.x] = theme.floor;
                        map[ty][tx] = enemy.tile;
                        enemy.x = tx; enemy.y = ty;
                        logMessage(`The ${enemy.name} blinks through the void!`);
                        return;
                    }
                }
            }
        }

        // --- 6.5 TELEGRAPH MECHANIC (Bosses & Casters) ---

        // A. EXECUTE PENDING ATTACKS (The Boom)
        if (enemy.pendingAttacks && enemy.pendingAttacks.length > 0) {
            let hitPlayer = false;

            enemy.pendingAttacks.forEach(tile => {
                // Visual explosion
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(tile.x, tile.y, '#ef4444', 8);
                }

                // Check collision with player
                if (tile.x === player.x && tile.y === player.y) {
                    const dmg = Math.floor(enemy.attack * 1.5); // 150% Damage (Rounded down)
                    player.health -= dmg;
                    gameState.screenShake = 15;
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`You are caught in the ${enemy.name}'s blast! (-${dmg} HP)`);
                    hitPlayer = true;
                }
            });

            if (!hitPlayer) {
                logMessage(`The ${enemy.name}'s attack strikes the ground!`);
            }

            // Clear attacks and consume turn
            enemy.pendingAttacks = null;

            // --- DEATH CHECK ---
            if (handlePlayerDeath()) return;

            return; // Turn ends after firing
        }

        // B. PREPARE NEW ATTACK (The Warning)
        // 20% chance for Bosses/Mages to start a telegraph if player is in range
        const canTelegraph = enemy.isBoss || enemy.tile === 'm' || enemy.tile === 'D' || enemy.tile === '🐲';

        if (canTelegraph && dist < 6 && Math.random() < 0.20) {
            enemy.pendingAttacks = [];

            // Pattern 1: The "Cross" (Mages/Demons)
            if (enemy.tile === 'm' || enemy.tile === 'D') {
                logMessage(`The ${enemy.name} gathers dark energy...`);
                // Target player's current spot + adjacent
                enemy.pendingAttacks.push({ x: player.x, y: player.y });
                enemy.pendingAttacks.push({ x: player.x + 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x - 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x, y: player.y + 1 });
                enemy.pendingAttacks.push({ x: player.x, y: player.y - 1 });
            }
            // Pattern 2: The "Breath" (Dragons/Bosses)
            else {
                logMessage(`The ${enemy.name} takes a deep breath!`);
                // 3x3 area centered on player
                for (let ty = -1; ty <= 1; ty++) {
                    for (let tx = -1; tx <= 1; tx++) {
                        enemy.pendingAttacks.push({ x: player.x + tx, y: player.y + ty });
                    }
                }
            }

            return; // Turn ends (Charging up)
        }

        // --- 7. COMBAT LOGIC ---

        // Melee Attack (Range 1)
        if (distSq <= 2) {
            const armorDefense = player.equipment.armor ? player.equipment.armor.defense : 0;
            const baseDefense = Math.floor(player.dexterity / 3);
            const buffDefense = player.defenseBonus || 0;
            const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
            
            // Round down Constitution bonus so Total Defense is an integer
            const conBonus = Math.floor(player.constitution * 0.1);
            const totalDefense = baseDefense + armorDefense + buffDefense + conBonus + talentDefense;

            let dodgeChance = Math.min(player.luck * 0.002, 0.25);
            if (player.talents && player.talents.includes('evasion')) {
                dodgeChance += 0.10;
            }

            if (Math.random() < dodgeChance) {
                logMessage(`The ${enemy.name} attacks, but you dodge!`);
                ParticleSystem.createFloatingText(player.x, player.y, "Dodge!", "#3b82f6");
            } else {
                // Ensure damage is an integer (Math.floor)
                let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));
                
                // Shield Absorb
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`Shield absorbs ${absorb} damage!`);
                    if (player.shieldValue === 0) logMessage("Your Arcane Shield shatters!");
                }
                if (dmg > 0) {
                    player.health -= dmg;
                    gameState.screenShake = 10; // Shake intensity
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} hits you for {red:${dmg}} damage!`);
                    ParticleSystem.createFloatingText(player.x, player.y, `-${dmg}`, '#ef4444');

                    // --- DEATH CHECK ---
                    if (handlePlayerDeath()) return;
                }
                // Thorns Reflect
                if (player.thornsValue > 0) {
                    enemy.health -= player.thornsValue;
                    logMessage(`The ${enemy.name} takes ${player.thornsValue} thorn damage!`);
                    if (enemy.health <= 0) {
                        registerKill(enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                        if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                        }
                        map[enemy.y][enemy.x] = generateEnemyLoot(player, enemy);
                    }
                }
            }
            return; // Turn Over
        }

        // Caster Attack (Range Check)
        const castRangeSq = Math.pow(enemy.castRange || 6, 2);
        if (enemy.caster && distSq <= castRangeSq && Math.random() < 0.20) {
            // Ensure spell damage is integer
            const spellDmg = Math.max(1, Math.floor(enemy.spellDamage || 1));
            
            let spellName = "spell";
            if (enemy.tile === 'm') spellName = "Arcane Bolt";
            if (enemy.tile === 'Z') spellName = "Frost Shard";
            if (enemy.tile === '@') spellName = "Poison Spit";

            if (Math.random() < Math.min(player.luck * 0.002, 0.25)) {
                logMessage(`The ${enemy.name} fires a ${spellName}, but you dodge!`);
            } else {
                let dmg = spellDmg;
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`Shield absorbs ${absorb} magic damage!`);
                }
                if (dmg > 0) {
                    player.health -= dmg;
                    gameState.screenShake = 10; // Shake intensity
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} casts ${spellName} for {red:${dmg}} damage!`);

                    if (enemy.inflicts === 'frostbite') player.frostbiteTurns = 5;
                    if (enemy.inflicts === 'poison') player.poisonTurns = 5;

                    // --- DEATH CHECK ---
                    if (handlePlayerDeath()) return;
                }
            }
            return;
        }

        // --- 8. NEW DYNAMIC MOVEMENT LOGIC (AI) ---

        let desiredX = 0;
        let desiredY = 0;
        let moveType = 'wander';

        // A. KITING LOGIC (For Casters/Ranged)
        if (enemy.caster) {
            if (dist < 3) {
                moveType = 'flee'; // Too close! Run!
            } else if (dist < 6) {
                moveType = 'idle'; // Good range. Stand ground and cast.
            } else {
                moveType = 'chase'; // Too far. Get closer.
            }
        }
        // B. STANDARD MELEE LOGIC
        else {
            // Calculate Chase Probability based on distance
            let chaseChance = 0.20; // 20% Base chance (Wandering/Idle)
            if (dist < 15) chaseChance = 0.50; // 50% if somewhat close
            if (dist < 8) chaseChance = 0.95; // 95% Aggressive chase if very close

            if (Math.random() < chaseChance) {
                moveType = 'chase';
            }
        }

        // C. FEAR LOGIC (Overrides everything)
        // Fleeing Override (Low Health + Not Fearless)
        const isFearless = ['s', 'Z', 'D', 'v', 'a', 'm'].includes(enemy.tile) || enemy.isBoss;
        if (!isFearless && (enemy.health < enemy.maxHealth * 0.25)) {
            moveType = 'flee';
        }

        // --- EXECUTE MOVE TYPE ---
        if (moveType === 'idle') {
            // Do nothing, just wait for combat turn
            return;
        } else if (moveType === 'flee') {
            desiredX = -Math.sign(dx);
            desiredY = -Math.sign(dy);
            // If directly inline, pick a diagonal escape to avoid getting stuck in corners
            if (desiredX === 0) desiredX = Math.random() < 0.5 ? 1 : -1;
            if (desiredY === 0) desiredY = Math.random() < 0.5 ? 1 : -1;
        } else if (moveType === 'chase') {
            desiredX = Math.sign(dx);
            desiredY = Math.sign(dy);
        } else {
            // Wander: Random direction
            desiredX = Math.floor(Math.random() * 3) - 1;
            desiredY = Math.floor(Math.random() * 3) - 1;
        }

        // Smart Pathing: Try Primary -> Secondary -> Slide
        let moveX = 0, moveY = 0;
        let madeMove = false;

        // Try ideal Diagonal first
        if (isWalkable(enemy.x + desiredX, enemy.y + desiredY)) {
            moveX = desiredX; moveY = desiredY; madeMove = true;
        }
        // If diagonal blocked, slide along axis
        else {
            if (Math.abs(dx) > Math.abs(dy)) {
                // X Priority
                if (desiredX !== 0 && isWalkable(enemy.x + desiredX, enemy.y)) {
                    moveX = desiredX; moveY = 0; madeMove = true;
                } else if (desiredY !== 0 && isWalkable(enemy.x, enemy.y + desiredY)) {
                    moveX = 0; moveY = desiredY; madeMove = true;
                }
            } else {
                // Y Priority
                if (desiredY !== 0 && isWalkable(enemy.x, enemy.y + desiredY)) {
                    moveX = 0; moveY = desiredY; madeMove = true;
                } else if (desiredX !== 0 && isWalkable(enemy.x + desiredX, enemy.y)) {
                    moveX = desiredX; moveY = 0; madeMove = true;
                }
            }
        }

        if (madeMove) {
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;

            // Check for collision with other enemies
            const occupied = gameState.instancedEnemies.some(e => e.x === newX && e.y === newY);
            if (!occupied) {
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX;
                enemy.y = newY;

                // Update intuition hint
                const newDistSq = Math.pow(newX - player.x, 2) + Math.pow(newY - player.y, 2);
                if (newDistSq < minDist && newDistSq < HEARING_DISTANCE_SQ) {
                    minDist = newDistSq;
                    nearestEnemyDir = { x: Math.sign(newX - player.x), y: Math.sign(newY - player.y) };
                }

                if (moveType === 'flee') {
                    // Reduce log spam: only log flee occasionally
                    if (Math.random() < 0.2) logMessage(`The ${enemy.name} retreats!`);
                }
            }
        }
    });

    return nearestEnemyDir;
}

function processFriendlyTurns() {
    if (gameState.mapMode !== 'castle') return;

    const map = chunkManager.castleMaps[gameState.currentCastleId];
    if (!map) return;

    const player = gameState.player;

    gameState.friendlyNpcs.forEach(npc => {
        // 50% chance to move
        if (Math.random() < 0.5) {
            const dirX = Math.floor(Math.random() * 3) - 1;
            const dirY = Math.floor(Math.random() * 3) - 1;

            if (dirX === 0 && dirY === 0) return;

            const newX = npc.x + dirX;
            const newY = npc.y + dirY;

            // Check bounds and collision
            // Must be a floor '.', and not occupied by player or another NPC
            if (map[newY] && map[newY][newX] === '.') {
                const occupiedByPlayer = (newX === player.x && newY === player.y);
                const occupiedByNpc = gameState.friendlyNpcs.some(n => n.x === newX && n.y === newY);

                if (!occupiedByPlayer && !occupiedByNpc) {
                    npc.x = newX;
                    npc.y = newY;
                }
            }
        }
    });
}

async function runCompanionTurn() {
    const companion = gameState.player.companion;
    if (!companion) return;

    // Check adjacent tiles for enemies
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let attacked = false;

    for (const [dx, dy] of dirs) {
        if (attacked) break;
        const tx = companion.x + dx;
        const ty = companion.y + dy;

        // --- INSTANCED COMBAT (Dungeons/Castles) ---
        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            const enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
            if (enemy) {
                const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                enemy.health -= dmg;
                logMessage(`Your ${companion.name} attacks ${enemy.name} for ${dmg} damage!`);
                attacked = true;

                if (enemy.health <= 0) {
                    logMessage(`Your companion killed the ${enemy.name}!`);
                    grantXp(Math.floor(enemy.xp / 2)); // Half XP for pet kills
                    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                }
            }
        }
        // --- OVERWORLD COMBAT (Shared) ---
        else if (gameState.mapMode === 'overworld') {
            const tile = chunkManager.getTile(tx, ty);
            const enemyData = ENEMY_DATA[tile];

            // Ensure enemyData has stats (maxHealth) to prevent attacking non-combat tiles
            if (enemyData && enemyData.maxHealth) {
                attacked = true;
                const enemyId = `overworld:${tx},${-ty}`;
                const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);

                // --- Custom Transaction for Companion ---
                // We do NOT use handleOverworldCombat here to avoid player taking damage
                try {
                    await enemyRef.transaction(currentData => {
                        let enemy = currentData;

                        // If enemy doesn't exist in DB yet (fresh spawn), we create it momentarily to hit it
                        if (enemy === null) {
                            // Safety check inside transaction
                            if (!enemyData) return null;

                            const scaledStats = getScaledEnemy(enemyData, tx, ty);
                            enemy = { ...scaledStats, tile: tile };
                        }

                        // Apply Companion Damage
                        const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                        enemy.health -= dmg;

                        // If dead, return null to delete
                        if (enemy.health <= 0) return null;

                        return enemy;
                    }, (error, committed, snapshot) => {
                        if (committed) {
                            if (!snapshot.exists()) {
                                // Enemy died
                                logMessage(`Your ${companion.name} vanquished the ${enemyData.name}!`);
                                grantXp(Math.floor(enemyData.xp / 2));
                                // Visual cleanup handled by listener, but we can update local chunk tile
                                chunkManager.setWorldTile(tx, ty, '.');
                                if (gameState.sharedEnemies[enemyId]) {
                                    delete gameState.sharedEnemies[enemyId];
                                }
                                render(); // Force update
                            } else {
                                // Enemy survived
                                logMessage(`Your ${companion.name} hits the ${enemyData.name}!`);
                            }
                        }
                    });
                } catch (err) {
                    console.error("Companion combat error:", err);
                }
            }
        }
    }
}


/**
 * Handles combat for overworld enemies, syncing health via RTDB.
 * Accepts a pre-calculated playerDamage value.
 */

async function handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage) { 
    const player = gameState.player;
    const enemyId = `overworld:${newX},${-newY}`; 
    const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);

    // 1. LOCAL PRE-CHECK
    if (!gameState.sharedEnemies[enemyId]) {
        logMessage("That enemy is already gone.");
        if (gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(newX, newY, '.');
            gameState.mapDirty = true;
            render();
        }
        isProcessingMove = false;
        return;
    }

    // 2. Capture Stats
    const liveEnemy = gameState.sharedEnemies[enemyId];
    const enemyInfo = liveEnemy || getScaledEnemy(enemyData, newX, newY);

    try {
        // 3. THE TRANSACTION
        const transactionResult = await enemyRef.transaction(currentData => {
            if (currentData === null) return; // Abort if already dead
            const enemy = currentData;
            enemy.health -= playerDamage;
            return enemy.health <= 0 ? null : enemy;
        });

        // 4. HANDLE RESULT
        if (transactionResult.committed) {
            const finalEnemyState = transactionResult.snapshot.val();

            // Visuals
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(newX, newY, '#ef4444');
                ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');
            }

            // --- KILL CONDITION ---
            if (finalEnemyState === null) {
                logMessage(`The ${enemyInfo.name} was vanquished!`);
                
                // --- SAFELY GRANT REWARDS ---
                // We wrap this in try/catch so a logic error (like a bad quest ID) 
                // doesn't trigger the "Network Error" message.
                try {
                    grantXp(enemyInfo.xp);
                    updateQuestProgress(newTile); 
                } catch (rewardErr) {
                    console.error("Reward Logic Error:", rewardErr);
                    // We don't alert the user, we just log it, so they don't think combat failed.
                }

                // B. Cleanup Map Logic
                const tileId = `${newX},${-newY}`;
                if (gameState.lootedTiles.has(tileId)) {
                    gameState.lootedTiles.delete(tileId);
                }

                // C. Local Cleanup
                if (gameState.sharedEnemies[enemyId]) {
                    delete gameState.sharedEnemies[enemyId];
                }

                // D. Loot Drop (Safety Wrapper)
                try {
                    const lootData = { ...enemyData, isElite: enemyInfo.isElite };
                    const droppedLoot = generateEnemyLoot(player, lootData);
                    const currentTerrain = chunkManager.getTile(newX, newY);
                    const passableTerrain = ['.', 'd', 'D', 'F', '≈']; 
                    
                    if (passableTerrain.includes(currentTerrain) || currentTerrain === newTile) {
                        chunkManager.setWorldTile(newX, newY, droppedLoot);
                        gameState.mapDirty = true;
                    }
                } catch (lootErr) {
                    console.error("Loot drop error:", lootErr);
                }
            } 
        } 
        else {
            logMessage("You swing at empty air... the enemy is already dead.");
            chunkManager.setWorldTile(newX, newY, '.');
            if (gameState.sharedEnemies[enemyId]) delete gameState.sharedEnemies[enemyId];
            render();
        }

    } catch (error) {
        console.error("Combat Error:", error);
        // Display the ACTUAL error message to the player for debugging
        logMessage(`Error: ${error.message || "Network Sync Failed"}`);
    } finally {
        // 5. FINAL SAVE
        endPlayerTurn(); 
        render();
        isProcessingMove = false;
    }
}


function registerKill(enemy) {
    // 1. Identify the Tile/Type
    const tile = enemy.tile || Object.keys(ENEMY_DATA).find(k => ENEMY_DATA[k].name === enemy.name);
    
    // 2. Determine XP Value (Safety Fallback)
    let amount = 0;
    
    // Priority A: The specific enemy's stored XP (includes scaling/elite bonuses)
    if (enemy.xp !== undefined && enemy.xp !== null) {
        amount = Number(enemy.xp);
    } 
    // Priority B: Fallback to the base template data
    else if (tile && ENEMY_DATA[tile]) {
        amount = ENEMY_DATA[tile].xp || 0;
        console.warn(`⚠️ Enemy instance missing XP. Fell back to template for ${enemy.name}.`);
    }

    // 3. Grant the XP
    if (amount > 0) {
        grantXp(amount);
    } else {
        console.error(`❌ Zero XP awarded for ${enemy.name}. Data missing.`);
    }

    // 4. Update Kill Count (Stats)
    // Use the base name (remove "Feral", "Savage" prefixes) for clean tracking
    let baseName = enemy.name;
    if (tile && ENEMY_DATA[tile]) {
        baseName = ENEMY_DATA[tile].name;
    }

    if (!gameState.player.killCounts) gameState.player.killCounts = {};
    gameState.player.killCounts[baseName] = (gameState.player.killCounts[baseName] || 0) + 1;

    // --- TALENT: BLOODLUST (Warrior) ---
    if (gameState.player.talents && gameState.player.talents.includes('bloodlust')) {
        const heal = 2;
        if (gameState.player.health < gameState.player.maxHealth) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + heal);
            logMessage("Bloodlust heals you for 2 HP!");
            triggerStatFlash(statDisplays.health, true);
        }
    }

    // --- TALENT: SOUL SIPHON (Necromancer) ---
    if (gameState.player.talents && gameState.player.talents.includes('soul_siphon')) {
        const restore = 2;
        if (gameState.player.mana < gameState.player.maxMana) {
            gameState.player.mana = Math.min(gameState.player.maxMana, gameState.player.mana + restore);
            logMessage("You siphon 2 Mana from the soul.");
            triggerStatFlash(statDisplays.mana, true);
        }
    }

    // 5. Handle Quests
    updateQuestProgress(tile);
}

function calculateHitChance(player, enemy) {
    // Base 88% accuracy
    let chance = 0.88;

    // Add 2% per point of Perception or Dexterity
    chance += (player.perception * 0.02);

    // Level Grace: +5% hit chance for every level under 5
    if (player.level < 5) {
        chance += (5 - player.level) * 0.05;
    }

    // Cap it at 98% (rarely miss) and floor at 50%
    return Math.max(0.5, Math.min(0.98, chance));
}


function getPlayerDamageModifier(baseDamage) {
    const player = gameState.player;
    let finalDamage = baseDamage;

    // --- BERSERKER: BLOOD RAGE ---
    // If Health is below 50%, deal double damage
    if (player.talents && player.talents.includes('blood_rage')) {
        if ((player.health / player.maxHealth) < 0.5) {
            finalDamage = Math.floor(finalDamage * 2);
            // 20% chance to show a message to avoid spam
            if (Math.random() < 0.2) logMessage("Blood Rage fuels your strike!");
        }
    }

    // --- ASSASSIN: SHADOW STRIKE ---
    // If Stealth is active, deal 4x damage
    if (player.talents && player.talents.includes('shadow_strike')) {
        if (player.stealthTurns > 0) {
            finalDamage = Math.floor(finalDamage * 4);
            logMessage("Shadow Strike! (4x Damage)");

            // Breaking stealth is handled in the attack logic, 
            // but the damage boost happens here.
        }
    }

    return finalDamage;
}


function handlePlayerDeath() {
    if (gameState.player.health > 0) return false; // Not dead

    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }

    const player = gameState.player;

    // 1. Visuals & Logs
    player.health = 0; // Ensure health is clamped to 0
    logMessage("{red:You have perished!}");
    triggerStatFlash(statDisplays.health, false);

    // 2. Remove Equipment Stats (So we don't carry buffs over)
    if (player.equipment.weapon) applyStatBonuses(player.equipment.weapon, -1);
    if (player.equipment.armor) applyStatBonuses(player.equipment.armor, -1);

    // 3. UI UPDATES (Moved UP so they happen before any potential save errors)
    const goldLost = Math.floor(player.coins / 2);
    document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
    document.getElementById('finalCoinsDisplay').textContent = `Gold lost: ${goldLost}`;
    gameOverModal.classList.remove('hidden'); // Show the modal immediately

    // 4. CORPSE SCATTER LOGIC
    const deathX = player.x;
    const deathY = player.y;
    const pendingUpdates = {};

    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        let placed = false;
        
        // Try to place item in a 3x3 grid around death spot
        for (let r = 0; r <= 2 && !placed; r++) {
            for (let dy = -r; dy <= r && !placed; dy++) {
                for (let dx = -r; dx <= r && !placed; dx++) {
                    const tx = deathX + dx;
                    const ty = deathY + dy;
                    let tile;

                    // Check terrain validity
                    if (gameState.mapMode === 'overworld') tile = chunkManager.getTile(tx, ty);
                    else if (gameState.mapMode === 'dungeon') tile = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx];
                    else tile = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx];

                    if (tile === '.') {
                        // Use item.tile, fallback to templateId, fallback to generic bag '🎒'
                        const dropIcon = item.tile || item.templateId || '🎒';

                        if (gameState.mapMode === 'overworld') {
                            const cX = Math.floor(tx / chunkManager.CHUNK_SIZE);
                            const cY = Math.floor(ty / chunkManager.CHUNK_SIZE);
                            const cId = `${cX},${cY}`;
                            const lX = (tx % chunkManager.CHUNK_SIZE + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
                            const lY = (ty % chunkManager.CHUNK_SIZE + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
                            const lKey = `${lX},${lY}`;
                            
                            if (!pendingUpdates[cId]) pendingUpdates[cId] = {};
                            pendingUpdates[cId][lKey] = dropIcon; // Apply fallback here
                        } else if (gameState.mapMode === 'dungeon') {
                            chunkManager.caveMaps[gameState.currentCaveId][ty][tx] = dropIcon;
                        } else {
                            chunkManager.castleMaps[gameState.currentCastleId][ty][tx] = dropIcon;
                        }
                        placed = true;
                    }
                }
            }
        }
    }

    // 5. Apply map updates (Wrapped in Sanitize to prevent crashes)
    if (gameState.mapMode === 'overworld') {
        for (const [cId, updates] of Object.entries(pendingUpdates)) {
            // Sanitize the updates object to remove 'undefined' values before sending
            const safeUpdates = sanitizeForFirebase(updates); 
            db.collection('worldState').doc(cId).set(safeUpdates, { merge: true })
                .catch(err => console.error("Failed to drop corpse loot:", err));
        }
    }

    // 6. CALCULATE PENALTIES & SAVE
    player.coins -= goldLost;
    
    // Clear inventory immediately so it can't be accessed while dead
    player.inventory = []; 
    player.equipment = { weapon: { name: 'Fists', damage: 0 }, armor: { name: 'Simple Tunic', defense: 0 } };

    // 7. Save "Dead" State
    playerRef.set(sanitizeForFirebase(player)).catch(console.error);

    return true;
}
