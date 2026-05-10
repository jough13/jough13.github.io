// --- ENEMY NETWORK MANAGER (SPATIAL HASHING) ---
const EnemyNetworkManager = {
    listeners: {},
    
    // Helper to get chunk ID from world coordinates
    getChunkId: (x, y) => `${Math.floor(x / 16)},${Math.floor(y / 16)}`,
    
    // Helper to get exact Firebase path for an enemy
    getPath: (x, y, enemyId) => `worldEnemies/${Math.floor(x / 16)},${Math.floor(y / 16)}/${enemyId}`,
    
    syncChunks: function(playerX, playerY) {
        if (gameState.mapMode !== 'overworld') return;
        
        const pChunkX = Math.floor(playerX / 16);
        const pChunkY = Math.floor(playerY / 16);
        const VIEW_RADIUS = 2; // Listens to a 5x5 chunk grid around player
        const visibleChunks = new Set();
        
        // 1. Attach new listeners
        for(let y = -VIEW_RADIUS; y <= VIEW_RADIUS; y++) {
            for(let x = -VIEW_RADIUS; x <= VIEW_RADIUS; x++) {
                const chunkId = `${pChunkX + x},${pChunkY + y}`;
                visibleChunks.add(chunkId);
                
                if (!this.listeners[chunkId]) {
                    this.listenToChunk(chunkId);
                }
            }
        }
        
        // 2. Detach old listeners that are now out of range
        for(const chunkId in this.listeners) {
            if (!visibleChunks.has(chunkId)) {
                this.unloadChunk(chunkId);
            }
        }
    },
    
    listenToChunk: function(chunkId) {
        const ref = rtdb.ref(`worldEnemies/${chunkId}`);
        
        const onAdded = ref.on('child_added', (snapshot) => {
            const key = snapshot.key;
            const val = snapshot.val();
            if (val && val.health > 0) {
                gameState.sharedEnemies[key] = val;
                updateSpatialMap(key, null, null, val.x, val.y);
                if (pendingSpawnData && pendingSpawnData[key]) delete pendingSpawnData[key];
                gameState.mapDirty = true;
            }
        });
        
        const onChanged = ref.on('child_changed', (snapshot) => {
            const key = snapshot.key;
            const val = snapshot.val();
            if (val) {
                const oldEnemy = gameState.sharedEnemies[key];
                if (oldEnemy && val.health < oldEnemy.health) {
                    const damageDiff = oldEnemy.health - val.health;
                    if (damageDiff > 0 && typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createFloatingText(val.x, val.y, `-${damageDiff}`, '#cbd5e1'); 
                        ParticleSystem.createExplosion(val.x, val.y, '#ef4444', 3);
                    }
                }
                const oldX = oldEnemy ? oldEnemy.x : null;
                const oldY = oldEnemy ? oldEnemy.y : null;
                gameState.sharedEnemies[key] = val;
                updateSpatialMap(key, oldX, oldY, val.x, val.y);
                gameState.mapDirty = true;
            }
        });
        
        const onRemoved = ref.on('child_removed', (snapshot) => {
            const key = snapshot.key;
            if (gameState.sharedEnemies[key]) {
                const enemy = gameState.sharedEnemies[key];
                updateSpatialMap(key, enemy.x, enemy.y, null, null);
                delete gameState.sharedEnemies[key];
                gameState.mapDirty = true;
            }
        });
        
        this.listeners[chunkId] = { ref, onAdded, onChanged, onRemoved };
    },
    
    unloadChunk: function(chunkId) {
        const listener = this.listeners[chunkId];
        if (listener) {
            listener.ref.off('child_added', listener.onAdded);
            listener.ref.off('child_changed', listener.onChanged);
            listener.ref.off('child_removed', listener.onRemoved);
            delete this.listeners[chunkId];
        }
        
        Object.entries(gameState.sharedEnemies).forEach(([eId, enemy]) => {
            const eChunk = this.getChunkId(enemy.x, enemy.y);
            if (eChunk === chunkId) {
                updateSpatialMap(eId, enemy.x, enemy.y, null, null);
                delete gameState.sharedEnemies[eId];
            }
        });
        gameState.mapDirty = true;
    },
    
    clearAll: function() {
        for(const chunkId in this.listeners) {
            this.unloadChunk(chunkId);
        }
    }
};

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

    // Add a +/- 10% variance to health so packs of enemies don't all have identical HP!
    const variance = 0.9 + (Math.random() * 0.2); 
    
    enemy.maxHealth = Math.max(1, Math.floor(enemy.maxHealth * multiplier * variance));
    enemy.attack = Math.floor(enemy.attack * multiplier) + Math.floor(zoneLevel / 3);
    enemy.xp = Math.floor(enemy.xp * multiplier);

    // --- SAFE ZONE NERF ---
    // EASY WIN: Expanded safe zone from 100 to 500 tiles!
    if (dist < 500) {
        // Reduce Attack by 2 (Min 1). 
        enemy.attack = Math.max(1, enemy.attack - 2); 
        // Reduce HP by 40% so they die much faster
        enemy.maxHealth = Math.ceil(enemy.maxHealth * 0.6); 
    }
    
    // --- NEWBIE GRACE PERIOD ---
    // If the player is level 3 or under, forcibly cap enemy stats within the first 1000 tiles.
    if (gameState && gameState.player && gameState.player.level <= 3 && dist < 1000) {
        enemy.attack = Math.min(enemy.attack, 3); // Max 3 damage
        enemy.maxHealth = Math.min(enemy.maxHealth, 15); // Max 15 HP
        enemy.defense = Math.min(enemy.defense || 0, 1); // Max 1 Defense so newbies can actually hurt them!
    }

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
                    // Parse/Stringify removes 'undefined' keys from ENEMY_DATA so Firebase doesn't crash
                    spawnUpdates[EnemyNetworkManager.getPath(x, y, enemyId)] = JSON.parse(JSON.stringify(newEnemy));
                    
                    // C. Add to local pending (Immediate Visual Feedback)
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
        gameState.mapDirty = true; 
        render(); 
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
    const AI_INTERVAL = 300; 
    const STALE_TIMEOUT = 5000; // 5 seconds - if heartbeat is older than this, steal it

    const heartbeatRef = rtdb.ref('worldState/aiHeartbeat');

    try {
        const result = await heartbeatRef.transaction((lastHeartbeat) => {
            if (!lastHeartbeat) return now;
            if (now - lastHeartbeat > STALE_TIMEOUT) return now;
            if (now - lastHeartbeat >= AI_INTERVAL) return now;
            return;
        });

        if (result.committed) {
            const nearestEnemyDir = await processOverworldEnemyTurns();

            // Client-side intuition feedback
            if (nearestEnemyDir) {
                const player = gameState.player;
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
    const activeEnemyIds =[];
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
        if (t === '~') return false; 
        if (['.', 'F', 'd', 'D', '≈'].includes(t)) return true;
        if (t === '^') {
            const climbers =['Y', '🐲', 'Ø', 'g', 'o', '🦇', '🦅'];
            return climbers.includes(enemyType);
        }
        return false;
    };

    for (const enemyId of activeEnemyIds) {
        if (processedIdsThisFrame.has(enemyId)) continue;

        const enemy = gameState.sharedEnemies[enemyId];
        
        // --- SAFETY CHECK ---
        if (!enemy || typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            continue;
        }

        const distSq = Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2);
        
        // --- VILLAGE GUARD SNIPER SYSTEM (Anti-Trolling/Anti-Ghost) ---
        // Expanded guard range to 100 tiles (10000 sq) and shoot anything > 15 XP
        const distToSpawnSq = (enemy.x * enemy.x) + (enemy.y * enemy.y);
        if (distToSpawnSq < 10000 && enemy.xp > 15) { 
            if (distSq < 400) {
                logMessage(`🏹 A village guard snipes the trespassing ${enemy.name} from the walls!`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(enemy.x, enemy.y, '#ef4444', 8);
            }
            
            // Queue removal from Firebase
            multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;
            
            delete gameState.sharedEnemies[enemyId];
            updateSpatialMap(enemyId, enemy.x, enemy.y, null, null);
            processedIdsThisFrame.add(enemyId);
            movesQueued = true;
            continue; 
        }

        if (distSq > searchDistSq) continue;

        // ==========================================
        // OVERWORLD STATUS EFFECTS
        // ==========================================
        let skipTurn = false;
        let statusChanged = false;

        if (enemy.rootTurns > 0) { 
            enemy.rootTurns--; 
            skipTurn = true; 
            statusChanged = true; 
        }
        if (enemy.stunTurns > 0) { 
            enemy.stunTurns--; 
            skipTurn = true; 
            statusChanged = true; 
        }
        if (enemy.frostbiteTurns > 0) { 
            enemy.frostbiteTurns--; 
            statusChanged = true; 
            if (Math.random() < 0.25) skipTurn = true; 
        }
        if (enemy.poisonTurns > 0) {
            enemy.poisonTurns--;
            enemy.health -= 1;
            statusChanged = true;
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, "-1", "#22c55e");
            
            if (enemy.health <= 0) {
                logMessage(`The ${enemy.name} succumbs to poison!`);
                handleInstancedEnemyDeath(enemy, enemy.x, enemy.y);
                return;
            }
        }

        let isMad = false;
        if (enemy.madnessTurns > 0) {
            enemy.madnessTurns--;
            statusChanged = true;
            isMad = true; 
        }

        // ==========================================
        // OVERWORLD TELEGRAPH GENERATION
        // ==========================================
        const canTelegraph = enemy.isBoss || enemy.tile === 'm' || enemy.tile === '😈d' || enemy.tile === '🐲';

        if (!skipTurn && canTelegraph && distSq < 36 && Math.random() < 0.20) {
            enemy.pendingAttacks =[];

            if (enemy.tile === 'm' || enemy.tile === '😈d') {
                logMessage(`The ${enemy.name} gathers dark energy...`);
                enemy.pendingAttacks.push({ x: playerX, y: playerY });
                enemy.pendingAttacks.push({ x: playerX + 1, y: playerY });
                enemy.pendingAttacks.push({ x: playerX - 1, y: playerY });
                enemy.pendingAttacks.push({ x: playerX, y: playerY + 1 });
                enemy.pendingAttacks.push({ x: playerX, y: playerY - 1 });
            } else {
                logMessage(`The ${enemy.name} takes a deep breath!`);
                for (let ty = -1; ty <= 1; ty++) {
                    for (let tx = -1; tx <= 1; tx++) {
                        enemy.pendingAttacks.push({ x: playerX + tx, y: playerY + ty });
                    }
                }
            }
            
            // CRITICAL FIX: Sanitize the object before appending to update list
            multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = JSON.parse(JSON.stringify(enemy));
            processedIdsThisFrame.add(enemyId);
            movesQueued = true;
            continue; 
        }

        // --- OVERWORLD TELEGRAPH EXECUTION ---
        if (enemy.pendingAttacks && enemy.pendingAttacks.length > 0) {
            let hitPlayer = false;

            enemy.pendingAttacks.forEach(tile => {
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tile.x, tile.y, '#ef4444', 8);

                if (tile.x === playerX && tile.y === playerY) {
                    if (gameState.godMode) return;
                    const dmg = Math.floor(enemy.attack * 1.5); 
                    gameState.player.health -= dmg;
                    gameState.screenShake = 15;
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`You are caught in the ${enemy.name}'s blast! (-${dmg} HP)`);
                    hitPlayer = true;
                }
            });

            if (!hitPlayer) logMessage(`The ${enemy.name}'s attack strikes the ground!`);

            enemy.pendingAttacks = null;
            multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId) + '/pendingAttacks'] = null; // Sync clear to Firebase
            movesQueued = true;
            processedIdsThisFrame.add(enemyId);
            
            if (gameState.player.health <= 0) handlePlayerDeath();
            continue; // Skip the rest of this turn
        }

        // If skipped turn due to stun/root, make sure we save the updated status effect timers
        if (skipTurn) {
            multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = JSON.parse(JSON.stringify(enemy));
            processedIdsThisFrame.add(enemyId);
            movesQueued = true;
            continue;
        }

        // --- OVERWORLD DIRECT SPELLCASTING ---
        const castRangeSq = Math.pow(enemy.castRange || 6, 2);
        if (enemy.caster && distSq <= castRangeSq && Math.random() < 0.20) {
            if (gameState.godMode) continue;

            const spellDmg = Math.max(1, Math.floor(enemy.spellDamage || 1));
            let spellName = "spell";
            if (enemy.tile === 'm') spellName = "Arcane Bolt";
            if (enemy.tile === 'Z') spellName = "Frost Shard";
            if (enemy.tile === '@') spellName = "Poison Spit";

            let dodgeChance = Math.min(gameState.player.luck * 0.002, 0.25);
            if (gameState.player.talents && gameState.player.talents.includes('evasion')) dodgeChance += 0.10;

            if (Math.random() < dodgeChance) {
                logMessage(`The ${enemy.name} fires a ${spellName}, but you dodge!`);
            } else {
                let dmg = spellDmg;
                if (gameState.player.shieldValue > 0) {
                    const absorb = Math.min(gameState.player.shieldValue, dmg);
                    gameState.player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`Shield absorbs ${absorb} magic damage!`);
                }
                if (dmg > 0) {
                    gameState.player.health -= dmg;
                    gameState.screenShake = 10; 
                    
                    const wrapper = document.getElementById('gameCanvasWrapper');
                    if (wrapper) {
                        wrapper.classList.remove('damage-flash'); 
                        void wrapper.offsetWidth; 
                        wrapper.classList.add('damage-flash');
                    }

                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} casts ${spellName} for {red:${dmg}} damage!`);

                    if (enemy.inflicts === 'frostbite') gameState.player.frostbiteTurns = 5;
                    if (enemy.inflicts === 'poison') gameState.player.poisonTurns = 5;

                    if (gameState.player.health <= 0) handlePlayerDeath();
                }
            }
            
            // Still sync if they had status effects tick down but chose to cast instead of moving
            if (statusChanged) multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = JSON.parse(JSON.stringify(enemy));
            
            processedIdsThisFrame.add(enemyId);
            movesQueued = true;
            continue; // Skip movement if they casted a spell
        }

        // --- AI LOGIC (MOVEMENT & MELEE) ---
        let chaseChance = 0.20;
        if (distSq < 400) chaseChance = 0.85; // Close range
        if (distSq < 100) chaseChance = 1.00; // Aggressive

        if (Math.random() < 0.80) { // 80% chance to act per turn
            let dirX = 0, dirY = 0;
            let isChasing = false;

            if (isMad) {
                // Flee from player
                dirX = -Math.sign(playerX - enemy.x);
                dirY = -Math.sign(playerY - enemy.y);
                if (dirX === 0) dirX = Math.random() < 0.5 ? 1 : -1;
                if (dirY === 0) dirY = Math.random() < 0.5 ? 1 : -1;
            }
            else if (Math.random() < chaseChance) {
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
                    if (gameState.godMode) continue; 
                    
                    // Calculate Total Defense & Dodge
                    const armorDefense = gameState.player.equipment.armor ? (gameState.player.equipment.armor.defense || 0) : 0;
                    const offhandDefense = gameState.player.equipment.offhand ? (gameState.player.equipment.offhand.defense || 0) : 0;
                    const accDefense = gameState.player.equipment.accessory ? (gameState.player.equipment.accessory.defense || 0) : 0;

                    const baseDefense = Math.floor(gameState.player.dexterity / 3);
                    const buffDefense = gameState.player.defenseBonus || 0;
                    const talentDefense = (gameState.player.talents && gameState.player.talents.includes('iron_skin')) ? 1 : 0;
                    const conBonus = Math.floor(gameState.player.constitution * 0.1);
                    
                    const totalDefense = baseDefense + armorDefense + offhandDefense + accDefense + buffDefense + conBonus + talentDefense;

                    let dodgeChance = Math.min(gameState.player.luck * 0.002, 0.25);
                    if (gameState.player.talents && gameState.player.talents.includes('evasion')) {
                        dodgeChance += 0.10;
                    }

                    if (Math.random() < dodgeChance) {
                        logMessage(`The ${enemy.name} attacks, but you dodge!`);
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(playerX, playerY, "Dodge!", "#3b82f6");
                    } else {
                        // Apply unified damage calc
                        let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));

                        // Shield Absorb
                        if (gameState.player.shieldValue > 0) {
                            const absorb = Math.min(gameState.player.shieldValue, dmg);
                            gameState.player.shieldValue -= absorb;
                            dmg -= absorb;
                            logMessage(`Shield absorbs ${absorb} damage!`);
                            if (gameState.player.shieldValue === 0) logMessage("Your Arcane Shield shatters!");
                        }

                        if (dmg > 0) {
                            gameState.player.health -= dmg;
                            gameState.screenShake = 10;

                            const wrapper = document.getElementById('gameCanvasWrapper');
                            if (wrapper) {
                                wrapper.classList.remove('damage-flash'); 
                                void wrapper.offsetWidth; // Trigger reflow
                                wrapper.classList.add('damage-flash');
                            }

                            logMessage(`A ${enemy.name} attacks you for {red:${dmg}} damage!`);
                            triggerStatFlash(statDisplays.health, false);
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(playerX, playerY, `-${dmg}`, '#ef4444');
                            
                            if (gameState.player.health <= 0) handlePlayerDeath();
                        }

                        // --- OVERWORLD THORNS ---
                        if (gameState.player.thornsValue > 0) {
                            enemy.health -= gameState.player.thornsValue;
                            logMessage(`The ${enemy.name} takes ${gameState.player.thornsValue} thorn damage!`);
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, `-${gameState.player.thornsValue}`, '#22c55e');
                            
                            if (enemy.health <= 0) {
                        logMessage(`The ${enemy.name} dies upon your thorns!`);
                        handleInstancedEnemyDeath(enemy, enemy.x, enemy.y);
                        } else {
                                statusChanged = true; // Health changed, ensure we sync below
                            }
                        }
                    }

                    // Even if it hit/dodged, if status effects changed on it, we must sync
                    if (statusChanged) {
                        multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = JSON.parse(JSON.stringify(enemy));
                        movesQueued = true;
                    }
                    
                    processedIdsThisFrame.add(enemyId);
                    continue; 
                }

                // --- PERCEPTION HINT ---
                const oldDist = Math.sqrt(Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2));
                const newDist = Math.sqrt(Math.pow(playerX - finalX, 2) + Math.pow(playerY - finalY, 2));
                
                if (newDist < oldDist && isChasing && newDist > 10 && newDist < 16) {
                    if (Math.random() < 0.10) {
                        const soundDir = { x: Math.sign(enemy.x - playerX), y: Math.sign(enemy.y - playerY) };
                        const dirStr = getDirectionString(soundDir); 
                        logMessage(`{gray:You hear twigs snapping to the ${dirStr}...}`);
                    }
                }

                // --- EXECUTE MOVE & SYNC BUCKETS ---
                const newId = `overworld:${finalX},${-finalY}`;
                
                if (gameState.sharedEnemies[newId] || multiPathUpdate[`worldEnemies/${newId}`]) continue;

                const updatedEnemy = { ...enemy, x: finalX, y: finalY };
                if (updatedEnemy._processedThisTurn) delete updatedEnemy._processedThisTurn;

                // CRITICAL FIX: Sanitize the object to prevent Firebase maxretry errors
                multiPathUpdate[`worldEnemies/${newId}`] = JSON.parse(JSON.stringify(updatedEnemy));
                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;

                delete gameState.sharedEnemies[enemyId];
                gameState.sharedEnemies[newId] = updatedEnemy;

                updateSpatialMap(enemyId, enemy.x, enemy.y, null, null); 
                updateSpatialMap(newId, null, null, finalX, finalY);     

                processedIdsThisFrame.add(newId);
                movesQueued = true;

                if (distSq < minDist && distSq < HEARING_DISTANCE_SQ) {
                    minDist = distSq;
                    nearestEnemyDir = { x: Math.sign(finalX - playerX), y: Math.sign(finalY - playerY) };
                }
            } else if (statusChanged) {
                // If it couldn't move, but it took poison damage or had a timer tick down, save it!
                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = JSON.parse(JSON.stringify(enemy));
                movesQueued = true;
            }
        }
    }

    if (movesQueued) {
        rtdb.ref().update(multiPathUpdate).catch(err => console.error("AI Sync Error:", err));
    }

    return nearestEnemyDir;
}

function processEnemyTurns() {
    if (gameState.mapMode !== 'dungeon' && gameState.mapMode !== 'castle') return null;

    let map, theme;
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

    const isWalkable = (tx, ty) => map[ty] && map[ty][tx] === theme.floor;

    const enemiesToMove = [...gameState.instancedEnemies];

    enemiesToMove.forEach(enemy => {

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

        if (enemy.madnessTurns > 0) {
            enemy.madnessTurns--;
            const fleeDirX = -Math.sign(player.x - enemy.x);
            const fleeDirY = -Math.sign(player.y - enemy.y);
            const newX = enemy.x + fleeDirX;
            const newY = enemy.y + fleeDirY;

            if (isWalkable(newX, newY)) {
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX; enemy.y = newY;
                logMessage(`The ${enemy.name} flees in terror!`);
            } else {
                logMessage(`The ${enemy.name} cowers in the corner!`);
            }
            if (enemy.madnessTurns === 0) logMessage(`The ${enemy.name} regains its senses.`);
            return; 
        }

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
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, "-1", "#22c55e");
            
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

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 25) return;

        if (enemy.isBoss) {
            if ((enemy.poisonTurns > 0 || enemy.rootTurns > 0) && Math.random() < 0.5) {
                enemy.poisonTurns = 0; enemy.rootTurns = 0;
                logMessage(`The ${enemy.name} shrugs off your magic!`);
            }

            if (enemy.health < enemy.maxHealth * 0.5 && !enemy.hasEnraged) {
                enemy.hasEnraged = true; 

                if (enemy.name.includes("Necromancer")) {
                    logMessage(`The ${enemy.name} screams! "ARISE, MY SERVANTS!"`);
                    gameState.screenShake = 20;

                    const offsets = [[-1, -1], [1, -1], [0, 1], [-1, 1],[1, 1]];
                    let spawned = 0;
                    for (let ofs of offsets) {
                        if (spawned >= 3) break;
                        const sx = enemy.x + ofs[0];
                        const sy = enemy.y + ofs[1];
                        if (isWalkable(sx, sy)) {
                            map[sy][sx] = 's';
                            const t = ENEMY_DATA['s'];
                            gameState.instancedEnemies.push({
                                id: `${gameState.currentCaveId}:minion_${Date.now()}_${spawned}`,
                                x: sx, y: sy, tile: 's', name: "Enraged Skeleton",
                                health: t.maxHealth, maxHealth: t.maxHealth,
                                attack: t.attack + 1, defense: t.defense, xp: 5
                            });
                            ParticleSystem.createExplosion(sx, sy, '#a855f7'); 
                            spawned++;
                        }
                    }
                }
                else if (enemy.name.includes("Demon") || enemy.tile === '😈d') {
                    logMessage(`The ${enemy.name} roars and shatters reality!`);
                    gameState.screenShake = 30;

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

                    enemy.attack += 2;
                    logMessage(`The ${enemy.name} grows stronger!`);
                }
                return; 
            }

            if (dist < 10 && Math.random() < 0.20) {
                const offsets = [[-1, 0],[1, 0], [0, -1], [0, 1]];
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
                        return; 
                    }
                }
            }
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

        if (enemy.pendingAttacks && enemy.pendingAttacks.length > 0) {
            let hitPlayer = false;

            enemy.pendingAttacks.forEach(tile => {
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tile.x, tile.y, '#ef4444', 8);

                if (tile.x === player.x && tile.y === player.y) {
                    if (gameState.godMode) return;
                    const dmg = Math.floor(enemy.attack * 1.5); 
                    player.health -= dmg;
                    gameState.screenShake = 15;
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`You are caught in the ${enemy.name}'s blast! (-${dmg} HP)`);
                    hitPlayer = true;
                }
            });

            if (!hitPlayer) logMessage(`The ${enemy.name}'s attack strikes the ground!`);

            enemy.pendingAttacks = null;
            if (handlePlayerDeath()) return;
            return; 
        }

        const canTelegraph = enemy.isBoss || enemy.tile === 'm' || enemy.tile === '😈d' || enemy.tile === '🐲';

        if (canTelegraph && dist < 6 && Math.random() < 0.20) {
            enemy.pendingAttacks =[];

            if (enemy.tile === 'm' || enemy.tile === '😈d') {
                logMessage(`The ${enemy.name} gathers dark energy...`);
                enemy.pendingAttacks.push({ x: player.x, y: player.y });
                enemy.pendingAttacks.push({ x: player.x + 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x - 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x, y: player.y + 1 });
                enemy.pendingAttacks.push({ x: player.x, y: player.y - 1 });
            } else {
                logMessage(`The ${enemy.name} takes a deep breath!`);
                for (let ty = -1; ty <= 1; ty++) {
                    for (let tx = -1; tx <= 1; tx++) {
                        enemy.pendingAttacks.push({ x: player.x + tx, y: player.y + ty });
                    }
                }
            }
            return; 
        }

        if (distSq <= 2) {
            if (gameState.godMode) return;

            const armorDefense = player.equipment.armor ? (player.equipment.armor.defense || 0) : 0;
            const offhandDefense = player.equipment.offhand ? (player.equipment.offhand.defense || 0) : 0;
            const accDefense = player.equipment.accessory ? (player.equipment.accessory.defense || 0) : 0;

            const baseDefense = Math.floor(player.dexterity / 3);
            const buffDefense = player.defenseBonus || 0;
            const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
            const conBonus = Math.floor(player.constitution * 0.1);
            
            const totalDefense = baseDefense + armorDefense + offhandDefense + accDefense + buffDefense + conBonus + talentDefense;

            let dodgeChance = Math.min(player.luck * 0.002, 0.25);
            if (player.talents && player.talents.includes('evasion')) dodgeChance += 0.10;

            if (Math.random() < dodgeChance) {
                logMessage(`The ${enemy.name} attacks, but you dodge!`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, "Dodge!", "#3b82f6");
            } else {
                let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));
                
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`Shield absorbs ${absorb} damage!`);
                    if (player.shieldValue === 0) logMessage("Your Arcane Shield shatters!");
                }
                if (dmg > 0) {
                    player.health -= dmg;
                    gameState.screenShake = 10; 
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} hits you for {red:${dmg}} damage!`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `-${dmg}`, '#ef4444');

                    if (handlePlayerDeath()) return;
                }
                
                if (player.thornsValue > 0) {
                    enemy.health -= player.thornsValue;
                    logMessage(`The ${enemy.name} takes ${player.thornsValue} thorn damage!`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, `-${player.thornsValue}`, '#22c55e');

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
            return; 
        }

        const castRangeSq = Math.pow(enemy.castRange || 6, 2);
        if (enemy.caster && distSq <= castRangeSq && Math.random() < 0.20) {
            if (gameState.godMode) return;

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
                    gameState.screenShake = 10; 
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} casts ${spellName} for {red:${dmg}} damage!`);

                    if (enemy.inflicts === 'frostbite') player.frostbiteTurns = 5;
                    if (enemy.inflicts === 'poison') player.poisonTurns = 5;

                    if (handlePlayerDeath()) return;
                }
            }
            return;
        }

        let desiredX = 0, desiredY = 0, moveType = 'wander';

        if (enemy.caster) {
            if (dist < 3) moveType = 'flee'; 
            else if (dist < 6) moveType = 'idle'; 
            else moveType = 'chase'; 
        } else {
            let chaseChance = 0.20; 
            if (dist < 15) chaseChance = 0.50; 
            if (dist < 8) chaseChance = 0.95; 

            if (Math.random() < chaseChance) moveType = 'chase';
        }

        const isFearless =['s', 'Z', 'D', 'v', 'a', 'm'].includes(enemy.tile) || enemy.isBoss;
        if (!isFearless && (enemy.health < enemy.maxHealth * 0.25)) moveType = 'flee';

        if (moveType === 'idle') return; 
        else if (moveType === 'flee') {
            desiredX = -Math.sign(dx);
            desiredY = -Math.sign(dy);
            if (desiredX === 0) desiredX = Math.random() < 0.5 ? 1 : -1;
            if (desiredY === 0) desiredY = Math.random() < 0.5 ? 1 : -1;
        } else if (moveType === 'chase') {
            desiredX = Math.sign(dx);
            desiredY = Math.sign(dy);
        } else {
            desiredX = Math.floor(Math.random() * 3) - 1;
            desiredY = Math.floor(Math.random() * 3) - 1;
        }

        let moveX = 0, moveY = 0, madeMove = false;

        if (isWalkable(enemy.x + desiredX, enemy.y + desiredY)) {
            moveX = desiredX; moveY = desiredY; madeMove = true;
        } else {
            if (Math.abs(dx) > Math.abs(dy)) {
                if (desiredX !== 0 && isWalkable(enemy.x + desiredX, enemy.y)) {
                    moveX = desiredX; moveY = 0; madeMove = true;
                } else if (desiredY !== 0 && isWalkable(enemy.x, enemy.y + desiredY)) {
                    moveX = 0; moveY = desiredY; madeMove = true;
                }
            } else {
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

            const occupied = gameState.instancedEnemies.some(e => e.x === newX && e.y === newY);
            if (!occupied) {
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX;
                enemy.y = newY;

                const newDistSq = Math.pow(newX - player.x, 2) + Math.pow(newY - player.y, 2);
                if (newDistSq < minDist && newDistSq < HEARING_DISTANCE_SQ) {
                    minDist = newDistSq;
                    nearestEnemyDir = { x: Math.sign(newX - player.x), y: Math.sign(newY - player.y) };
                }

                if (moveType === 'flee') {
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
        if (Math.random() < 0.5) {
            const dirX = Math.floor(Math.random() * 3) - 1;
            const dirY = Math.floor(Math.random() * 3) - 1;

            if (dirX === 0 && dirY === 0) return;

            const newX = npc.x + dirX;
            const newY = npc.y + dirY;

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

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let attacked = false;

    for (const [dx, dy] of dirs) {
        if (attacked) break;
        const tx = companion.x + dx;
        const ty = companion.y + dy;

        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            const enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
            if (enemy) {
                const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                enemy.health -= dmg;
                logMessage(`Your ${companion.name} attacks ${enemy.name} for ${dmg} damage!`);
                
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(tx, ty, '#86efac', 5); 
                    ParticleSystem.createFloatingText(tx, ty, `-${dmg}`, '#fff');
                }

                attacked = true;

                if (enemy.health <= 0) {
                    logMessage(`Your companion killed the ${enemy.name}!`);
                    handleInstancedEnemyDeath(enemy, tx, ty);
                }
            }
        }
        else if (gameState.mapMode === 'overworld') {
            const tile = chunkManager.getTile(tx, ty);
            const enemyData = ENEMY_DATA[tile];

            if (enemyData && enemyData.maxHealth) {
                attacked = true;
                const enemyId = `overworld:${tx},${-ty}`;
                const enemyRef = rtdb.ref(EnemyNetworkManager.getPath(tx, ty, enemyId));

                const visualDmg = Math.max(1, companion.attack - (enemyData.defense || 0));

                try {
                    await enemyRef.transaction(currentData => {
                        let enemy = currentData;

                        if (enemy === null) {
                            if (!enemyData) return null;
                            
                            // CRITICAL FIX: Safe deep clone to prevent RTDB undefined errors
                            enemy = JSON.parse(JSON.stringify({
                                ...getScaledEnemy(enemyData, tx, ty),
                                tile: tile,
                                x: tx,
                                y: ty
                            }));
                        }

                        const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                        enemy.health -= dmg;

                        if (enemy.health <= 0) return null;
                        return enemy;
                    }, (error, committed, snapshot) => {
                        if (committed) {
                            if (typeof ParticleSystem !== 'undefined') {
                                ParticleSystem.createExplosion(tx, ty, '#86efac', 5); 
                                ParticleSystem.createFloatingText(tx, ty, `-${visualDmg}`, '#fff');
                            }

                            if (!snapshot.exists()) {
                                logMessage(`Your ${companion.name} vanquished the ${enemyData.name}!`);
                                grantXp(Math.floor(enemyData.xp / 2));
                                
                                const droppedLoot = generateEnemyLoot(gameState.player, enemyData); 
                                chunkManager.setWorldTile(tx, ty, droppedLoot || '.');
                                
                                if (gameState.sharedEnemies[enemyId]) {
                                    delete gameState.sharedEnemies[enemyId];
                                }
                                render(); 
                            } else {
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

async function handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage) { 
    const player = gameState.player;
    const enemyId = `overworld:${newX},${-newY}`; 
    const enemyRef = rtdb.ref(EnemyNetworkManager.getPath(newX, newY, enemyId));

    if (!gameState.sharedEnemies[enemyId]) {
        logMessage("That enemy is already gone.");
        if (gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(newX, newY, '.');
            gameState.mapDirty = true;
            render();
        }
        return;
    }

    const liveEnemy = gameState.sharedEnemies[enemyId];
    const enemyInfo = liveEnemy || getScaledEnemy(enemyData, newX, newY);
    
    // Ensure damage is a valid number to prevent NaN database corruption
    const safeDamage = (typeof playerDamage === 'number' && !isNaN(playerDamage)) ? playerDamage : 1;

    try {
        const transactionResult = await enemyRef.transaction(currentData => {
            let enemy = currentData;
            
            // If null, the server cache dropped it. Rebuild a clean object!
            if (enemy === null) {
                enemy = {
                    ...enemyInfo,
                    tile: newTile,
                    x: newX,
                    y: newY
                };
            }
            
            // Force health to be a clean Number to prevent NaN DB corruption
            enemy.health = Number(enemy.health);
            if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;
            
            enemy.health -= safeDamage;
            
            // If dead, return null to delete from Firebase
            if (enemy.health <= 0) return null;
            
            // Vaporize ALL undefined values before sending to Firebase!
            return JSON.parse(JSON.stringify(enemy));
        });

        if (transactionResult.committed) {
            const finalEnemyState = transactionResult.snapshot.val();

            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(newX, newY, '#ef4444');
                ParticleSystem.createFloatingText(newX, newY, `-${safeDamage}`, '#fff');
            }

            if (finalEnemyState === null) {
                logMessage(`The ${enemyInfo.name} was vanquished!`);
                
                try {
                    grantXp(enemyInfo.xp);
                    updateQuestProgress(newTile); 
                } catch (rewardErr) {
                    console.error("Reward Logic Error:", rewardErr);
                }

                const tileId = `${newX},${-newY}`;
                if (gameState.lootedTiles.has(tileId)) {
                    gameState.lootedTiles.delete(tileId);
                }

                if (gameState.sharedEnemies[enemyId]) {
                    delete gameState.sharedEnemies[enemyId];
                }

                try {
                    const lootData = { ...enemyData, isElite: enemyInfo.isElite };
                    const droppedLoot = generateEnemyLoot(player, lootData);
                    const currentTerrain = chunkManager.getTile(newX, newY);

                    
                    const passableTerrain =['.', 'd', 'D', 'F', '≈']; 
                    
                    if (passableTerrain.includes(currentTerrain) || currentTerrain === newTile) {
                        // Enemy loot despawns after 2 hours!
                        chunkManager.setWorldTile(newX, newY, droppedLoot, 2);
                        gameState.mapDirty = true;
                    }
                    if (currentTerrain !== '~') {
                        chunkManager.setWorldTile(newX, newY, droppedLoot, 2);
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
        }

    } catch (error) {
        console.error("Combat Error:", error);
        logMessage(`Error: ${error.message || "Network Sync Failed"}`);
    }
}

function registerKill(enemy) {
    const tile = enemy.tile || Object.keys(ENEMY_DATA).find(k => ENEMY_DATA[k].name === enemy.name);
    
    let amount = 0;
    if (enemy.xp !== undefined && enemy.xp !== null) amount = Number(enemy.xp);
    else if (tile && ENEMY_DATA[tile]) amount = ENEMY_DATA[tile].xp || 0;

    if (amount > 0) grantXp(amount);

    let baseName = enemy.name;
    if (tile && ENEMY_DATA[tile]) baseName = ENEMY_DATA[tile].name;

    if (!gameState.player.killCounts) gameState.player.killCounts = {};
    gameState.player.killCounts[baseName] = (gameState.player.killCounts[baseName] || 0) + 1;

    if (gameState.player.talents && gameState.player.talents.includes('bloodlust')) {
        const heal = 2;
        if (gameState.player.health < gameState.player.maxHealth) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + heal);
            logMessage("Bloodlust heals you for 2 HP!");
            triggerStatFlash(statDisplays.health, true);
        }
    }

    if (gameState.player.talents && gameState.player.talents.includes('soul_siphon')) {
        const restore = 2;
        if (gameState.player.mana < gameState.player.maxMana) {
            gameState.player.mana = Math.min(gameState.player.maxMana, gameState.player.mana + restore);
            logMessage("You siphon 2 Mana from the soul.");
            triggerStatFlash(statDisplays.mana, true);
        }
    }

    updateQuestProgress(tile);
}

function calculateHitChance(player, enemy) {
    let chance = 0.88;
    chance += (player.perception * 0.02);
    if (player.level < 5) chance += (5 - player.level) * 0.05;
    return Math.max(0.5, Math.min(0.98, chance));
}

function getPlayerDamageModifier(baseDamage) {
    const player = gameState.player;
    let finalDamage = baseDamage;

    if (player.equipment.weapon && player.equipment.weapon.statBonuses && player.equipment.weapon.statBonuses.dexterity) {
        const strContribution = player.strength + (player.strengthBonus || 0);
        const dexContribution = player.dexterity;
        finalDamage = (finalDamage - strContribution) + dexContribution;
    }

    if (player.talents && player.talents.includes('blood_rage')) {
        if ((player.health / player.maxHealth) < 0.5) {
            finalDamage = Math.floor(finalDamage * 2);
            if (Math.random() < 0.2) logMessage("Blood Rage fuels your strike!");
        }
    }

    if (player.talents && player.talents.includes('shadow_strike')) {
        if (player.stealthTurns > 0) {
            finalDamage = Math.floor(finalDamage * 4);
            logMessage("Shadow Strike! (4x Damage)");
        }
    }

    return finalDamage;
}

function handlePlayerDeath() {
    if (gameState.godMode) return false; 
    if (gameState.player.health > 0) return false; 

    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }

    const player = gameState.player;

    player.health = 0; 
    logMessage("{red:You have perished!}");
    triggerStatFlash(statDisplays.health, false);

    if (player.equipment.weapon) applyStatBonuses(player.equipment.weapon, -1);
    if (player.equipment.armor) applyStatBonuses(player.equipment.armor, -1);

    const goldLost = Math.floor(player.coins / 2);
    document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
    document.getElementById('finalCoinsDisplay').textContent = `Gold lost: ${goldLost}`;
    gameOverModal.classList.remove('hidden');

    const deathX = player.x;
    const deathY = player.y;
    const pendingUpdates = {};

    let validFloor = '.';
    if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme];
        if (theme) validFloor = theme.floor;
    }

    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        let placed = false;
        
        for (let r = 0; r <= 2 && !placed; r++) {
            for (let dy = -r; dy <= r && !placed; dy++) {
                for (let dx = -r; dx <= r && !placed; dx++) {
                    const tx = deathX + dx;
                    const ty = deathY + dy;
                    let tile;

                    if (gameState.mapMode === 'overworld') tile = chunkManager.getTile(tx, ty);
                    else if (gameState.mapMode === 'dungeon') tile = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx];
                    else tile = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx];

                    // Check both generic plains floor and specific dungeon floor
                    if (tile === validFloor || tile === '.') {
                        const dropIcon = item.tile || item.templateId || '🎒';

                        if (gameState.mapMode === 'overworld') {
                            const cX = Math.floor(tx / chunkManager.CHUNK_SIZE);
                            const cY = Math.floor(ty / chunkManager.CHUNK_SIZE);
                            const cId = `${cX},${cY}`;
                            const lX = (tx % chunkManager.CHUNK_SIZE + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
                            const lY = (ty % chunkManager.CHUNK_SIZE + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
                            const lKey = `${lX},${lY}`;
                            
                            if (!pendingUpdates[cId]) pendingUpdates[cId] = {};
                            
                            // Player Corpse Loot lasts a full 24 hours so they can recover it!
                            const expireTime = Date.now() + (24 * 60 * 60 * 1000);
                            pendingUpdates[cId][lKey] = { t: dropIcon, expires: expireTime }; 
                            
                            chunkManager.worldState[cId] = chunkManager.worldState[cId] || {};
                            chunkManager.worldState[cId][lKey] = dropIcon;
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

    if (gameState.mapMode === 'overworld') {
        for (const [cId, updates] of Object.entries(pendingUpdates)) {
            const safeUpdates = sanitizeForFirebase(updates); 
            db.collection('worldState').doc(cId).set(safeUpdates, { merge: true })
                .catch(err => console.error("Failed to drop corpse loot:", err));
        }
    }

    player.coins -= goldLost;
    
    player.inventory = []; 
    player.equipment = { weapon: { name: 'Fists', damage: 0 }, armor: { name: 'Simple Tunic', defense: 0 } };

    playerRef.set(sanitizeForFirebase(player), { merge: true }).catch(console.error);

    return true;
}

// Add this to the bottom of combat.js!
function handleInstancedEnemyDeath(enemy, x, y) {
    registerKill(enemy);

    const droppedLoot = generateEnemyLoot(gameState.player, enemy);
    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

    let mapId = null;
    let mapArray = null;
    let validFloor = '.';

    if (gameState.mapMode === 'dungeon') {
        mapId = gameState.currentCaveId;
        mapArray = chunkManager.caveMaps[mapId];
        if (CAVE_THEMES[gameState.currentCaveTheme]) {
            validFloor = CAVE_THEMES[gameState.currentCaveTheme].floor;
        }
        if (chunkManager.caveEnemies[mapId]) {
            chunkManager.caveEnemies[mapId] = chunkManager.caveEnemies[mapId].filter(e => e.id !== enemy.id);
        }
    } else if (gameState.mapMode === 'castle') {
        mapId = gameState.currentCastleId;
        mapArray = chunkManager.castleMaps[mapId];
    }

    if (mapArray && mapArray[y]) {
        mapArray[y][x] = droppedLoot || validFloor;
        // THE FIX: Clear the cache so the player can pick up the new drop!
        gameState.lootedTiles.delete(`${mapId}:${x},${-y}`); 
    }
    gameState.mapDirty = true;
}
