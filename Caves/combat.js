// --- START OF FILE combat.js ---

// --- ENEMY NETWORK MANAGER (SPATIAL HASHING) ---
const EnemyNetworkManager = {
    listeners: {},
    
    // Helper to get chunk ID from world coordinates
    getChunkId: (x, y) => `${Math.floor(x / 16)},${Math.floor(y / 16)}`,
    
    // Helper to get exact Firebase path for an enemy (ISOLATED BY REALM & LAYER)
    getPath: (x, y, enemyId) => {
        let realmPrefix = '';
        if (gameState.currentRealm !== 0 && gameState.currentRealm) {
            realmPrefix = `realm_${gameState.currentRealm}/`;
        }
        if (gameState.mapMode === 'underworld') {
            realmPrefix += 'underworld/';
        }
        
        return `worldEnemies/${realmPrefix}${Math.floor(x / 16)},${Math.floor(y / 16)}/${enemyId}`;
    },
    
    syncChunks: function(playerX, playerY) {
        if (gameState.mapMode !== 'overworld' && gameState.mapMode !== 'underworld') return;
        
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
        // --- MULTIVERSE & LAYER PATH ISOLATION ---
        let realmPrefix = '';
        if (gameState.currentRealm !== 0 && gameState.currentRealm) {
            realmPrefix = `realm_${gameState.currentRealm}/`;
        }
        if (gameState.mapMode === 'underworld') {
            realmPrefix += 'underworld/';
        }
        
        const ref = rtdb.ref(`worldEnemies/${realmPrefix}${chunkId}`);
        
        const onAdded = ref.on('child_added', (snapshot) => {
            const key = snapshot.key;
            const val = snapshot.val();
            if (val && val.health > 0) {
                gameState.sharedEnemies[key] = val;
                if (typeof updateSpatialMap === 'function') updateSpatialMap(key, null, null, val.x, val.y);
                if (typeof pendingSpawnData !== 'undefined' && pendingSpawnData[key]) delete pendingSpawnData[key];
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
                if (typeof updateSpatialMap === 'function') updateSpatialMap(key, oldX, oldY, val.x, val.y);
                gameState.mapDirty = true;
            }
        });
        
        const onRemoved = ref.on('child_removed', (snapshot) => {
            const key = snapshot.key;
            if (gameState.sharedEnemies[key]) {
                const enemy = gameState.sharedEnemies[key];
                if (typeof updateSpatialMap === 'function') updateSpatialMap(key, enemy.x, enemy.y, null, null);
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
                if (typeof updateSpatialMap === 'function') updateSpatialMap(eId, enemy.x, enemy.y, null, null);
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

    // --- MULTIVERSE REALM MULTIPLIER ---
    let realmMultiplier = 1.0;
    if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.realmMutators) {
        // Stack the buffs of all active mutators
        gameState.realmMutators.forEach(m => {
            if (window.REALM_MUTATORS && window.REALM_MUTATORS[m]) {
                realmMultiplier *= window.REALM_MUTATORS[m].enemyBuff;
            }
        });
    }

    // Add a +/- 10% variance to health so packs of enemies don't all have identical HP!
    const variance = 0.9 + (Math.random() * 0.2); 
    
    // Apply Multipliers
    enemy.maxHealth = Math.max(1, Math.floor(enemy.maxHealth * multiplier * realmMultiplier * variance));
    enemy.attack = Math.floor(enemy.attack * multiplier * realmMultiplier) + Math.floor(zoneLevel / 3);
    
    // Double XP inherently in alternate dimensions on top of the scaling!
    if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0) {
        enemy.xp = Math.floor(enemy.xp * multiplier * realmMultiplier * 2);
    } else {
        enemy.xp = Math.floor(enemy.xp * multiplier);
    }

    // --- SAFE ZONE NERF ---
    // Expanded safe zone from 100 to 500 tiles!
    // Exclude the underworld from the safe zone nerf since it's meant to be harder
    if (dist < 500 && gameState.mapMode !== 'underworld') {
        // Reduce Attack by 2 (Min 1). 
        enemy.attack = Math.max(1, enemy.attack - 2); 
        // Reduce HP by 40% so they die much faster
        enemy.maxHealth = Math.ceil(enemy.maxHealth * 0.6); 
    }
    
    // --- NEWBIE GRACE PERIOD ---
    // If the player is level 3 or under, forcibly cap enemy stats within the first 1000 tiles.
    if (gameState && gameState.player && gameState.player.level <= 3 && dist < 1000 && gameState.mapMode !== 'underworld') {
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
    if ((dist > 150 || gameState.mapMode === 'underworld') && !enemy.isBoss && Math.random() < eliteChance && typeof ENEMY_PREFIXES !== 'undefined') {
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
        } else if (affix.special === 'burn') {
            enemy.inflicts = 'burn';
            enemy.inflictChance = 0.5;
        } else if (affix.special === 'madness') {
            enemy.inflicts = 'madness';
            enemy.inflictChance = 0.5;
        }

        enemy.xp = Math.floor(enemy.xp * affix.xpMult);
    }

    // --- BLOOD MOON GLOBAL EVENT ---
    if (typeof gameState !== 'undefined' && gameState.isBloodMoon && dist > 150 && gameState.mapMode !== 'underworld') {
        enemy.maxHealth = Math.floor(enemy.maxHealth * 1.5);
        enemy.attack += 2;
        enemy.xp *= 2; // Double XP!
        
        // Give them a scary prefix if they don't have one
        if (!enemy.isElite) {
            enemy.name = `Blood-Crazed ${enemy.name}`;
            enemy.color = '#ef4444'; // Force red color
        }
    }

    // Reset current health to new max
    enemy.health = enemy.maxHealth;

    return enemy;
}

async function wakeUpNearbyEnemies() {
    if (gameState.mapMode !== 'overworld' && gameState.mapMode !== 'underworld') return;

    // Determine player location
    const player = gameState.player;
    if (!player) return;

    const WAKE_RADIUS = 14; // Increased slightly to ensure they spawn before you see them

    // Use a batch update for map tiles to prevent excessive rendering/saving
    let spawnUpdates = {};
    let enemiesSpawnedCount = 0;
    let visualUpdateNeeded = false;

    for (let y = player.y - WAKE_RADIUS; y <= player.y + WAKE_RADIUS; y++) {
        for (let x = player.x - WAKE_RADIUS; x <= player.x + WAKE_RADIUS; x++) {
            
            // 1. Check the static map tile
            const tile = chunkManager.getTile(x, y);
            
            // Optimization: Only check logic if it looks like an enemy tile
            if (tile === '.' || tile === 'F' || tile === 'd' || tile === 'D' || tile === '^' || tile === '~' || tile === '≈' || tile === '🍄' || tile === '💎c' || tile === '🌋') continue;

            const enemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[tile] : null;

            // 2. If it's a valid enemy tile, we "Wake" it
            if (enemyData) {
                const enemyId = `overworld:${x},${-y}`;

                // Only spawn if it doesn't already exist in the live world
                if (!gameState.sharedEnemies[enemyId] && (!window.pendingSpawnData || !window.pendingSpawnData[enemyId])) {
                    
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
                    if (typeof pendingSpawnData !== 'undefined') pendingSpawnData[enemyId] = newEnemy;
                    gameState.sharedEnemies[enemyId] = newEnemy; 
                    
                    // D. Update Spatial Map immediately so AI knows it exists
                    if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, null, null, x, y);

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
        if (typeof rtdb !== 'undefined') {
            rtdb.ref().update(spawnUpdates).catch(err => {
                console.error("Mass Spawn Error:", err);
            });
        }
    }

    // 4. Force Render if we changed anything
    if (visualUpdateNeeded) {
        gameState.mapDirty = true; 
        if (typeof render === 'function') render(); 
    }
}

/**
 * Asynchronously runs the AI turns for shared maps.
 * Uses a Firebase RTDB Transaction to ensure only ONE client
 * runs the AI per interval. Includes logic to break stale locks.
 */

async function runSharedAiTurns() {
    if (gameState.mapMode !== 'overworld' && gameState.mapMode !== 'underworld') return; 

    const now = Date.now();
    const AI_INTERVAL = 600; // Increased to 600ms for smoother server load
    const STALE_TIMEOUT = 5000; 

    // --- CLIENT-SIDE GATEKEEPER ---
    // If we already attempted an AI tick locally within the interval, don't even talk to Firebase!
    if (now - (window.lastLocalAIAttempt || 0) < AI_INTERVAL) return;
    window.lastLocalAIAttempt = now;

    // Use correct path based on layer
    let realmPrefix = '';
    if (gameState.currentRealm !== 0 && gameState.currentRealm) {
        realmPrefix = `realm_${gameState.currentRealm}/`;
    }
    if (gameState.mapMode === 'underworld') {
        realmPrefix += 'underworld/';
    }
    
    if (typeof rtdb === 'undefined') return;
    const heartbeatRef = rtdb.ref(`worldState/${realmPrefix}aiHeartbeat`);

    try {
        const result = await heartbeatRef.transaction((lastHeartbeat) => {
            if (!lastHeartbeat) return now;
            if (now - lastHeartbeat > STALE_TIMEOUT) return now;
            if (now - lastHeartbeat >= AI_INTERVAL) return now;
            return; // Abort transaction
        });

        if (result.committed) {
            const nearestEnemyDir = await processOverworldEnemyTurns();

            // Client-side intuition feedback
            if (nearestEnemyDir) {
                const player = gameState.player;
                const intuitChance = Math.min(player.intuition * 0.005, 0.5);
                if (Math.random() < intuitChance) {
                    const dirString = typeof getDirectionString === 'function' ? getDirectionString(nearestEnemyDir) : "nearby";
                    logMessage(`{gray:You sense a hostile presence to the ${dirString}!}`);
                }
            }
        }
    } catch (err) {
        console.error("AI Heartbeat Transaction failed:", err);
    }
}

async function processOverworldEnemyTurns() {
    if (gameState.mapMode !== 'overworld' && gameState.mapMode !== 'underworld') return;

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
    const SPATIAL_CHUNK_SIZE = 16; 

    // 1. Gather candidates from local buckets
    const activeEnemyIds = [];
    const pChunkX = Math.floor(playerX / SPATIAL_CHUNK_SIZE);
    const pChunkY = Math.floor(playerY / SPATIAL_CHUNK_SIZE);

    for (let y = pChunkY - 1; y <= pChunkY + 1; y++) {
        for (let x = pChunkX - 1; x <= pChunkX + 1; x++) {
            const key = `${x},${y}`;
            if (gameState.enemySpatialMap && gameState.enemySpatialMap.has(key)) {
                gameState.enemySpatialMap.get(key).forEach(id => activeEnemyIds.push(id));
            }
        }
    }

    // Helper: Valid path check for overworld & underworld
    const isValidMove = (tx, ty, enemyType) => {
        const t = chunkManager.getTile(tx, ty);
        if (t === '~' || t === '🌋') return false; // Water and Magma block movement
        if (['.', 'F', 'd', 'D', '≈', '🍄', '💎c', '🪜', '•', '▲', '💎'].includes(t)) return true;
        if (t === '^' || t === '▓') {
            const climbers =['Y', '🐲', 'Ø', 'g', 'o', '🦇', '🦅'];
            return climbers.includes(enemyType);
        }
        return false;
    };

    for (const enemyId of activeEnemyIds) {
        // --- Stop processing enemies if the player is already dead! ---
        if (gameState.player.health <= 0) break;

        if (processedIdsThisFrame.has(enemyId)) continue;

        const enemy = gameState.sharedEnemies[enemyId];
        
        // --- SAFETY CHECK ---
        if (!enemy || typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            continue;
        }

        const distSq = Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2);
        
        // --- VILLAGE GUARD SNIPER SYSTEM (Anti-Trolling/Anti-Ghost) ---
        // Expanded guard range to 100 tiles (10000 sq) and shoot anything > 15 XP
        // (Guards don't exist in the underworld, so skip this check there)
        if (gameState.mapMode === 'overworld') {
            const distToSpawnSq = (enemy.x * enemy.x) + (enemy.y * enemy.y);
            if (distToSpawnSq < 10000 && enemy.xp > 15) { 
                if (distSq < 400) {
                    logMessage(`{blue:🏹 A village guard snipes the trespassing ${enemy.name} from the walls!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(enemy.x, enemy.y, '#ef4444', 8);
                }
                
                // Queue removal from Firebase
                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;
                
                delete gameState.sharedEnemies[enemyId];
                if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, enemy.x, enemy.y, null, null);
                processedIdsThisFrame.add(enemyId);
                movesQueued = true;
                continue; 
            }
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
        if (enemy.burnTurns > 0) {
            enemy.burnTurns--;
            enemy.health -= 2; // Fire burns hotter than poison!
            logMessage(`{orange:The ${enemy.name} takes burn damage.}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, "-2", "#f97316");
            
            if (enemy.health <= 0) {
                logMessage(`{red:The ${enemy.name} burns to ash!}`);
                
                registerKill(enemy);
                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;
                delete gameState.sharedEnemies[enemyId];
                if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, enemy.x, enemy.y, null, null);
                processedIdsThisFrame.add(enemyId);
                movesQueued = true;
                
                const baseEnemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[enemy.tile] : null;
                if (baseEnemyData) {
                    const lootData = { ...baseEnemyData, isElite: enemy.isElite };
                    const droppedLoot = typeof generateEnemyLoot === 'function' ? generateEnemyLoot(gameState.player, lootData) : '.';
                    const currentTerrain = chunkManager.getTile(enemy.x, enemy.y);
                    if (currentTerrain !== '~' && currentTerrain !== '🌋') {
                        chunkManager.setWorldTile(enemy.x, enemy.y, droppedLoot || '.', 2); 
                        gameState.mapDirty = true;
                    }
                }
                continue;
            }
        }
        if (enemy.poisonTurns > 0) {
            enemy.poisonTurns--;
            enemy.health -= 1;
            logMessage(`{gray:The ${enemy.name} takes poison damage.}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, "-1", "#22c55e");
            
            if (enemy.health <= 0) {
                logMessage(`{green:The ${enemy.name} succumbs to poison!}`);
                
                registerKill(enemy);
                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;
                delete gameState.sharedEnemies[enemyId];
                if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, enemy.x, enemy.y, null, null);
                processedIdsThisFrame.add(enemyId);
                movesQueued = true;
                
                const baseEnemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[enemy.tile] : null;
                if (baseEnemyData) {
                    const lootData = { ...baseEnemyData, isElite: enemy.isElite };
                    const droppedLoot = typeof generateEnemyLoot === 'function' ? generateEnemyLoot(gameState.player, lootData) : '.';
                    const currentTerrain = chunkManager.getTile(enemy.x, enemy.y);
                    if (currentTerrain !== '~' && currentTerrain !== '🌋') {
                        chunkManager.setWorldTile(enemy.x, enemy.y, droppedLoot || '.', 2); 
                        gameState.mapDirty = true;
                    }
                }
                continue;
            }
            if (enemy.poisonTurns === 0) logMessage(`{gray:The ${enemy.name} is no longer poisoned.}`);
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
                logMessage(`{orange:The ${enemy.name} gathers dark energy...}`);
                enemy.pendingAttacks.push({ x: playerX, y: playerY });
                enemy.pendingAttacks.push({ x: playerX + 1, y: playerY });
                enemy.pendingAttacks.push({ x: playerX - 1, y: playerY });
                enemy.pendingAttacks.push({ x: playerX, y: playerY + 1 });
                enemy.pendingAttacks.push({ x: playerX, y: playerY - 1 });
            } else {
                logMessage(`{orange:The ${enemy.name} takes a deep breath!}`);
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
                    window.modifyVital('health', -dmg);
                    gameState.screenShake = 15;
                    
                    // JUICE: Full screen red flash for heavy telegraph damage
                    gameState.screenFlash = { color: '#ef4444', alpha: 0.4, decay: 0.05 };
                    
                    logMessage(`{red:You are caught in the ${enemy.name}'s blast! (-${dmg} HP)}`);
                    hitPlayer = true;
                }
            });

            if (!hitPlayer) logMessage(`{gray:The ${enemy.name}'s attack strikes the ground!}`);

            enemy.pendingAttacks = null;
            multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId) + '/pendingAttacks'] = null; // Sync clear to Firebase
            movesQueued = true;
            processedIdsThisFrame.add(enemyId);
            
            if (gameState.player.health <= 0) break; // Death handled by modifyVital
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
            if (enemy.tile === 'f') spellName = "Fireball";

            let dodgeChance = Math.min(gameState.player.luck * 0.002, 0.25);
            if (gameState.player.talents && gameState.player.talents.includes('evasion')) dodgeChance += 0.10;

            if (Math.random() < dodgeChance) {
                logMessage(`{blue:The ${enemy.name} fires a ${spellName}, but you dodge!}`);
            } else {
                let dmg = spellDmg;
                if (gameState.player.shieldValue > 0) {
                    const absorb = Math.min(gameState.player.shieldValue, dmg);
                    gameState.player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`{cyan:Shield absorbs ${absorb} magic damage!}`);
                }
                if (dmg > 0) {
                    window.modifyVital('health', -dmg);
                    gameState.screenShake = 10; 
                    gameState.screenFlash = { color: '#be123c', alpha: 0.3, decay: 0.1 };
                    
                    const wrapper = document.getElementById('gameCanvasWrapper');
                    if (wrapper) {
                        wrapper.classList.remove('damage-flash'); 
                        void wrapper.offsetWidth; 
                        wrapper.classList.add('damage-flash');
                    }

                    logMessage(`{red:The ${enemy.name} casts ${spellName} for ${dmg} damage!}`);

                    if (enemy.inflicts === 'frostbite') gameState.player.frostbiteTurns = 5;
                    if (enemy.inflicts === 'poison') gameState.player.poisonTurns = 5;
                    if (enemy.inflicts === 'burn') gameState.player.burnTurns = 5;

                    if (gameState.player.health <= 0) break;
                }
            }
            
            // Still sync if they had status effects tick down but chose to cast instead of moving
            if (statusChanged) multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = JSON.parse(JSON.stringify(enemy));
            
            processedIdsThisFrame.add(enemyId);
            movesQueued = true;
            continue; // Skip movement if they casted a spell
        }

        // --- OVERWORLD ENEMY ARCHERY ---
        const shootRangeSq = Math.pow(enemy.range || 5, 2);
        if (enemy.isRanged && distSq <= shootRangeSq && Math.random() < 0.35) {
            if (gameState.godMode) continue;

            let dodgeChance = Math.min(gameState.player.luck * 0.002, 0.25);
            if (gameState.player.talents && gameState.player.talents.includes('evasion')) dodgeChance += 0.10;

            if (typeof ParticleSystem !== 'undefined') {
                // Shoot a gray arrow particle at the player
                ParticleSystem.spawn(playerX, playerY, '#d4d4d8', 'dust', '', 4);
            }

            if (Math.random() < dodgeChance) {
                logMessage(`{blue:The ${enemy.name} shoots an arrow, but you dodge!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(playerX, playerY, "Dodge!", "#3b82f6");
            } else {
                // Use physical defense calculation (including shields!)
                const armorDefense = gameState.player.equipment.armor ? (gameState.player.equipment.armor.defense || 0) : 0;
                const offhandDefense = gameState.player.equipment.offhand ? (gameState.player.equipment.offhand.defense || 0) : 0;
                const accDefense = gameState.player.equipment.accessory ? (gameState.player.equipment.accessory.defense || 0) : 0;
                const baseDefense = Math.floor(gameState.player.dexterity / 3);
                const buffDefense = gameState.player.defenseBonus || 0;
                const talentDefense = (gameState.player.talents && gameState.player.talents.includes('iron_skin')) ? 1 : 0;
                const conBonus = Math.floor(gameState.player.constitution * 0.1);
                
                const totalDefense = baseDefense + armorDefense + offhandDefense + accDefense + buffDefense + conBonus + talentDefense;

                let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));
                
                if (gameState.player.shieldValue > 0) {
                    const absorb = Math.min(gameState.player.shieldValue, dmg);
                    gameState.player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`{cyan:Shield absorbs ${absorb} ranged damage!}`);
                }
                
                if (dmg > 0) {
                    window.modifyVital('health', -dmg);
                    gameState.screenShake = 10;
                    gameState.screenFlash = { color: '#ef4444', alpha: 0.2, decay: 0.05 };
                    
                    const wrapper = document.getElementById('gameCanvasWrapper');
                    if (wrapper) {
                        wrapper.classList.remove('damage-flash'); 
                        void wrapper.offsetWidth; 
                        wrapper.classList.add('damage-flash');
                    }
                    
                    logMessage(`{red:The ${enemy.name} shoots you for ${dmg} damage!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(playerX, playerY, `-${dmg}`, '#ef4444');
                    
                    if (gameState.player.health <= 0) break;
                }
            }
            
            processedIdsThisFrame.add(enemyId);
            movesQueued = true;
            continue; // Skip movement if they shot an arrow
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
                        logMessage(`{blue:The ${enemy.name} attacks, but you dodge!}`);
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(playerX, playerY, "Dodge!", "#3b82f6");
                    } else {
                        // Apply unified damage calc
                        let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));

                        // Shield Absorb
                        if (gameState.player.shieldValue > 0) {
                            const absorb = Math.min(gameState.player.shieldValue, dmg);
                            gameState.player.shieldValue -= absorb;
                            dmg -= absorb;
                            logMessage(`{cyan:Shield absorbs ${absorb} damage!}`);
                            if (gameState.player.shieldValue === 0) logMessage("{cyan:Your Arcane Shield shatters!}");
                        }

                        if (dmg > 0) {
                            window.modifyVital('health', -dmg);
                            gameState.screenShake = 10;

                            const wrapper = document.getElementById('gameCanvasWrapper');
                            if (wrapper) {
                                wrapper.classList.remove('damage-flash'); 
                                void wrapper.offsetWidth; // Trigger reflow
                                wrapper.classList.add('damage-flash');
                            }

                            logMessage(`{red:A ${enemy.name} attacks you for ${dmg} damage!}`);
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(playerX, playerY, `-${dmg}`, '#ef4444');
                            
                            // Apply physical on-hit status effects (like Scorpion Poison)
                            if (enemy.inflicts && Math.random() < (enemy.inflictChance || 0.25)) {
                                if (enemy.inflicts === 'poison') gameState.player.poisonTurns = 5;
                                if (enemy.inflicts === 'frostbite') gameState.player.frostbiteTurns = 5;
                                if (enemy.inflicts === 'burn') gameState.player.burnTurns = 5;
                            }

                            if (gameState.player.health <= 0) break;
                        }

                        // --- OVERWORLD THORNS ---
                        if (gameState.player.thornsValue > 0) {
                            enemy.health -= gameState.player.thornsValue;
                            logMessage(`{green:The ${enemy.name} takes ${gameState.player.thornsValue} thorn damage!}`);
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, `-${gameState.player.thornsValue}`, '#22c55e');
                            
                            if (enemy.health <= 0) {
                                logMessage(`{green:The ${enemy.name} dies upon your thorns!}`);
                                
                                // 1. Grant XP & Register Kill
                                registerKill(enemy);

                                // 2. Queue removal from Firebase RTDB
                                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;
                                
                                // 3. Clean up local state
                                delete gameState.sharedEnemies[enemyId];
                                if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, enemy.x, enemy.y, null, null);
                                
                                // 4. Mark as processed & trigger the Firebase batch update
                                processedIdsThisFrame.add(enemyId);
                                movesQueued = true;

                                // 5. Drop Loot on the Overworld Map
                                const baseEnemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[enemy.tile] : null;
                                if (baseEnemyData) {
                                    const lootData = { ...baseEnemyData, isElite: enemy.isElite };
                                    const droppedLoot = typeof generateEnemyLoot === 'function' ? generateEnemyLoot(gameState.player, lootData) : '.';
                                    const currentTerrain = chunkManager.getTile(enemy.x, enemy.y);
                                    
                                    // Don't drop loot into deep ocean water
                                    if (currentTerrain !== '~' && currentTerrain !== '🌋') {
                                        // 2 hour TTL (Time To Live) so the map doesn't get cluttered forever
                                        chunkManager.setWorldTile(enemy.x, enemy.y, droppedLoot || '.', 2); 
                                        gameState.mapDirty = true;
                                    }
                                }
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
                        const dirStr = typeof getDirectionString === 'function' ? getDirectionString(soundDir) : "nearby"; 
                        logMessage(`{gray:You hear twigs snapping to the ${dirStr}...}`);
                    }
                }

                // --- EXECUTE MOVE & SYNC BUCKETS ---
                const newId = `overworld:${finalX},${-finalY}`;
                
                // Use the correct Network Manager path generator!
                const newEnemyPath = EnemyNetworkManager.getPath(finalX, finalY, newId);
                
                if (gameState.sharedEnemies[newId] || multiPathUpdate[newEnemyPath]) continue;

                const updatedEnemy = { ...enemy, x: finalX, y: finalY };
                if (updatedEnemy._processedThisTurn) delete updatedEnemy._processedThisTurn;

                // Sanitize the object and use the correct chunk path!
                multiPathUpdate[newEnemyPath] = JSON.parse(JSON.stringify(updatedEnemy));
                multiPathUpdate[EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)] = null;

                delete gameState.sharedEnemies[enemyId];
                gameState.sharedEnemies[newId] = updatedEnemy;

                if (typeof updateSpatialMap === 'function') {
                    updateSpatialMap(enemyId, enemy.x, enemy.y, null, null); 
                    updateSpatialMap(newId, null, null, finalX, finalY);     
                }

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
        if (typeof rtdb !== 'undefined') rtdb.ref().update(multiPathUpdate).catch(err => console.error("AI Sync Error:", err));
    }

    return nearestEnemyDir;
}

function processEnemyTurns() {
    if (gameState.mapMode !== 'dungeon' && gameState.mapMode !== 'castle') return null;

    let map, theme;
    if (gameState.mapMode === 'dungeon') {
        map = chunkManager.caveMaps[gameState.currentCaveId];
        theme = typeof CAVE_THEMES !== 'undefined' ? (CAVE_THEMES[gameState.currentCaveTheme] || {floor: '.'}) : {floor: '.'};
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
        // --- Stop processing enemies if the player is already dead! ---
        if (gameState.player.health <= 0) return;

        if (enemy.rootTurns > 0) {
            enemy.rootTurns--;
            logMessage(`{gray:The ${enemy.name} struggles against roots!}`);
            if (enemy.rootTurns === 0) logMessage(`{gray:The ${enemy.name} breaks free.}`);
            return;
        }
        if (enemy.stunTurns > 0) {
            enemy.stunTurns--;
            logMessage(`{yellow:The ${enemy.name} is stunned!}`);
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
                logMessage(`{purple:The ${enemy.name} flees in terror!}`);
            } else {
                logMessage(`{purple:The ${enemy.name} cowers in the corner!}`);
            }
            if (enemy.madnessTurns === 0) logMessage(`{gray:The ${enemy.name} regains its senses.}`);
            return; 
        }

        if (enemy.frostbiteTurns > 0) {
            enemy.frostbiteTurns--;
            if (enemy.frostbiteTurns === 0) logMessage(`{cyan:The ${enemy.name} is no longer frostbitten.}`);
            if (Math.random() < 0.25) {
                logMessage(`{cyan:The ${enemy.name} is frozen solid and skips its turn!}`);
                return;
            }
        }

        // Add burn tick to dungeons
        if (enemy.burnTurns > 0) {
            enemy.burnTurns--;
            enemy.health -= 2; // Fire burns hotter than poison!
            logMessage(`{orange:The ${enemy.name} takes burn damage.}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, "-2", "#f97316");
            
            if (enemy.health <= 0) {
                logMessage(`{red:The ${enemy.name} burns to ash!}`);
                if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, enemy.x, enemy.y);
                return;
            }
        }

        if (enemy.poisonTurns > 0) {
            enemy.poisonTurns--;
            enemy.health -= 1;
            logMessage(`{green:The ${enemy.name} takes poison damage.}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, "-1", "#22c55e");
            
            if (enemy.health <= 0) {
                logMessage(`{green:The ${enemy.name} succumbs to poison!}`);
                if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, enemy.x, enemy.y);
                return;
            }
            if (enemy.poisonTurns === 0) logMessage(`{gray:The ${enemy.name} is no longer poisoned.}`);
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist > 25) return;

        if (enemy.isBoss) {
            if ((enemy.poisonTurns > 0 || enemy.rootTurns > 0) && Math.random() < 0.5) {
                enemy.poisonTurns = 0; enemy.rootTurns = 0;
                logMessage(`{red:The ${enemy.name} shrugs off your magic!}`);
            }

            if (enemy.health < enemy.maxHealth * 0.5 && !enemy.hasEnraged) {
                enemy.hasEnraged = true; 
                
                // JUICE WIN: Play the terrifying spawn sound when a boss enrages!
                if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playBossSpawn === 'function') {
                    AudioSystem.playBossSpawn();
                }

                if (enemy.name.includes("Necromancer")) {
                    logMessage(`{red:The ${enemy.name} screams! "ARISE, MY SERVANTS!"}`);
                    gameState.screenShake = 20;
                    gameState.screenFlash = { color: '#000000', alpha: 0.5, decay: 0.05 };

                    const offsets = [[-1, -1], [1, -1], [0, 1], [-1, 1],[1, 1]];
                    let spawned = 0;
                    for (let ofs of offsets) {
                        if (spawned >= 3) break;
                        const sx = enemy.x + ofs[0];
                        const sy = enemy.y + ofs[1];
                        if (isWalkable(sx, sy)) {
                            map[sy][sx] = 's';
                            const t = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA['s'] : {maxHealth:10, attack:3, defense:1};
                            gameState.instancedEnemies.push({
                                id: `${gameState.currentCaveId}:minion_${Date.now()}_${spawned}`,
                                x: sx, y: sy, tile: 's', name: "Enraged Skeleton",
                                health: t.maxHealth, maxHealth: t.maxHealth,
                                attack: t.attack + 1, defense: t.defense, xp: 5
                            });
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(sx, sy, '#a855f7'); 
                            spawned++;
                        }
                    }
                }
                else if (enemy.name.includes("Demon") || enemy.tile === '😈d') {
                    logMessage(`{purple:The ${enemy.name} roars and shatters reality!}`);
                    gameState.screenShake = 30;
                    gameState.screenFlash = { color: '#a855f7', alpha: 0.6, decay: 0.05 };

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
                        logMessage("{purple:You are thrown through the void!}");
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#a855f7');
                        gameState.isAiming = false;
                    }

                    enemy.attack += 2;
                    logMessage(`{red:The ${enemy.name} grows stronger!}`);
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
                        const t = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA['s'] : {maxHealth:10, attack:3, defense:1};
                        gameState.instancedEnemies.push({
                            id: `${gameState.currentCaveId}:minion_${Date.now()}`,
                            x: sx, y: sy, tile: 's', name: "Summoned Skeleton",
                            health: t.maxHealth, maxHealth: t.maxHealth, attack: t.attack, defense: t.defense, xp: 0
                        });
                        logMessage(`{gray:The ${enemy.name} summons a Skeleton!}`);
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
                    logMessage(`{gray:The ${enemy.name} vanishes in mist!}`);
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
                        logMessage(`{purple:The ${enemy.name} blinks through the void!}`);
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
                    window.modifyVital('health', -dmg);

                    gameState.screenShake = 15;
                    gameState.screenFlash = { color: '#ef4444', alpha: 0.4, decay: 0.05 };

                    logMessage(`{red:You are caught in the ${enemy.name}'s blast! (-${dmg} HP)}`);
                    hitPlayer = true;
                }
            });

            if (!hitPlayer) logMessage(`{gray:The ${enemy.name}'s attack strikes the ground!}`);

            enemy.pendingAttacks = null;
            if (player.health <= 0) return; // Death handled by modifyVital
            return; 
        }

        const canTelegraph = enemy.isBoss || enemy.tile === 'm' || enemy.tile === '😈d' || enemy.tile === '🐲';

        if (canTelegraph && dist < 6 && Math.random() < 0.20) {
            enemy.pendingAttacks =[];

            if (enemy.tile === 'm' || enemy.tile === '😈d') {
                logMessage(`{orange:The ${enemy.name} gathers dark energy...}`);
                enemy.pendingAttacks.push({ x: player.x, y: player.y });
                enemy.pendingAttacks.push({ x: player.x + 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x - 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x, y: player.y + 1 });
                enemy.pendingAttacks.push({ x: player.x, y: player.y - 1 });
            } else {
                logMessage(`{orange:The ${enemy.name} takes a deep breath!}`);
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
                logMessage(`{blue:The ${enemy.name} attacks, but you dodge!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, "Dodge!", "#3b82f6");
            } else {
                let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));
                
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`{cyan:Shield absorbs ${absorb} damage!}`);
                    if (player.shieldValue === 0) logMessage("{cyan:Your Arcane Shield shatters!}");
                }
                if (dmg > 0) {
                    window.modifyVital('health', -dmg);
                    gameState.screenShake = 10; 
                    logMessage(`{red:The ${enemy.name} hits you for ${dmg} damage!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `-${dmg}`, '#ef4444');

                    // Apply physical on-hit status effects
                    if (enemy.inflicts && Math.random() < (enemy.inflictChance || 0.25)) {
                        if (enemy.inflicts === 'poison') gameState.player.poisonTurns = 5;
                        if (enemy.inflicts === 'frostbite') gameState.player.frostbiteTurns = 5;
                        if (enemy.inflicts === 'burn') gameState.player.burnTurns = 5;
                    }

                    if (player.health <= 0) return;
                }
                
                if (player.thornsValue > 0) {
                    enemy.health -= player.thornsValue;
                    logMessage(`{green:The ${enemy.name} takes ${player.thornsValue} thorn damage!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(enemy.x, enemy.y, `-${player.thornsValue}`, '#22c55e');

                    if (enemy.health <= 0) {
                        logMessage(`{green:The ${enemy.name} dies upon your thorns!}`);
                        if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, enemy.x, enemy.y);
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
            if (enemy.tile === 'f') spellName = "Fireball";

            if (Math.random() < Math.min(player.luck * 0.002, 0.25)) {
                logMessage(`{blue:The ${enemy.name} fires a ${spellName}, but you dodge!}`);
            } else {
                let dmg = spellDmg;
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`{cyan:Shield absorbs ${absorb} magic damage!}`);
                }
                if (dmg > 0) {
                    window.modifyVital('health', -dmg);
                    gameState.screenShake = 10; 
                    gameState.screenFlash = { color: '#be123c', alpha: 0.3, decay: 0.1 };

                    logMessage(`{red:The ${enemy.name} casts ${spellName} for ${dmg} damage!}`);

                    if (enemy.inflicts === 'frostbite') player.frostbiteTurns = 5;
                    if (enemy.inflicts === 'poison') player.poisonTurns = 5;
                    if (enemy.inflicts === 'burn') player.burnTurns = 5;

                    if (player.health <= 0) return;
                }
            }
            return;
        }

        // --- DUNGEON ENEMY ARCHERY ---
        const shootRangeSq = Math.pow(enemy.range || 5, 2);
        if (enemy.isRanged && distSq <= shootRangeSq && Math.random() < 0.35) {
            if (gameState.godMode) return;

            let dodgeChance = Math.min(player.luck * 0.002, 0.25);
            if (player.talents && player.talents.includes('evasion')) dodgeChance += 0.10;

            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.spawn(player.x, player.y, '#d4d4d8', 'dust', '', 4);
            }

            if (Math.random() < dodgeChance) {
                logMessage(`{blue:The ${enemy.name} shoots an arrow, but you dodge!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, "Dodge!", "#3b82f6");
            } else {
                const armorDefense = player.equipment.armor ? (player.equipment.armor.defense || 0) : 0;
                const offhandDefense = player.equipment.offhand ? (player.equipment.offhand.defense || 0) : 0;
                const accDefense = player.equipment.accessory ? (player.equipment.accessory.defense || 0) : 0;
                const baseDefense = Math.floor(player.dexterity / 3);
                const buffDefense = player.defenseBonus || 0;
                const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
                const conBonus = Math.floor(player.constitution * 0.1);
                
                const totalDefense = baseDefense + armorDefense + offhandDefense + accDefense + buffDefense + conBonus + talentDefense;

                let dmg = Math.max(1, Math.floor(enemy.attack - totalDefense));
                
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`{cyan:Shield absorbs ${absorb} ranged damage!}`);
                }
                
                if (dmg > 0) {
                    window.modifyVital('health', -dmg);
                    gameState.screenShake = 10;
                    gameState.screenFlash = { color: '#ef4444', alpha: 0.2, decay: 0.05 };

                    const wrapper = document.getElementById('gameCanvasWrapper');
                    if (wrapper) {
                        wrapper.classList.remove('damage-flash'); 
                        void wrapper.offsetWidth; 
                        wrapper.classList.add('damage-flash');
                    }

                    logMessage(`{red:The ${enemy.name} shoots you for ${dmg} damage!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `-${dmg}`, '#ef4444');
                    
                    if (player.health <= 0) return;
                }
            }
            return; // End this enemy's turn
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
                    if (Math.random() < 0.2) logMessage(`{gray:The ${enemy.name} retreats!}`);
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
    
    // Mounts are occupied carrying you, they don't auto-attack!
    if (gameState.player.isMounted) return;

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
                    logMessage(`{green:Your ${companion.name} tears the ${enemy.name} apart!}`);
                    if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, tx, ty);
                }
            }
        }
        else if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            const tile = chunkManager.getTile(tx, ty);
            const enemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[tile] : null;

            if (enemyData && enemyData.maxHealth) {
                attacked = true;
                const enemyId = `overworld:${tx},${-ty}`;
                if (typeof rtdb === 'undefined') return;
                const enemyRef = rtdb.ref(EnemyNetworkManager.getPath(tx, ty, enemyId));

                const visualDmg = Math.max(1, companion.attack - (enemyData.defense || 0));

                try {
                    const txResult = await window.withTimeout(enemyRef.transaction(currentData => {
                        // 🚨 THE FIX: Return null instead of undefined
                        if (currentData === null) return null;
                        
                        let enemy = JSON.parse(JSON.stringify(currentData));
                        enemy.health = Number(enemy.health);
                        if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;

                        const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                        enemy.health -= dmg;

                        if (enemy.health <= 0) return null;
                        return enemy;
                    }), 3000);

                    if (txResult && txResult.committed) {
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createExplosion(tx, ty, '#86efac', 5); 
                            ParticleSystem.createFloatingText(tx, ty, `-${visualDmg}`, '#fff');
                        }

                        if (!txResult.snapshot.exists()) {
                            logMessage(`{green:Your ${companion.name} tears the ${enemyData.name} apart!}`);
                            if (typeof grantXp === 'function') grantXp(Math.floor(enemyData.xp / 2));
                            
                            const droppedLoot = typeof generateEnemyLoot === 'function' ? generateEnemyLoot(gameState.player, enemyData) : '.'; 
                            chunkManager.setWorldTile(tx, ty, droppedLoot);
                            
                            if (gameState.sharedEnemies[enemyId]) {
                                delete gameState.sharedEnemies[enemyId];
                            }
                            if (typeof render === 'function') render(); 
                        } else {
                            logMessage(`Your ${companion.name} hits the ${enemyData.name}!`);
                        }
                    }
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
    if (typeof rtdb === 'undefined') return;
    const enemyRef = rtdb.ref(EnemyNetworkManager.getPath(newX, newY, enemyId));

    if (!gameState.sharedEnemies[enemyId]) {
        logMessage("{gray:Dissipating a temporal echo... the enemy is gone.}");
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            chunkManager.setWorldTile(newX, newY, '.');
            gameState.mapDirty = true;
            if (typeof render === 'function') render();
        }
        return;
    }

    const liveEnemy = gameState.sharedEnemies[enemyId];
    const enemyInfo = liveEnemy || (typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, newX, newY) : enemyData);
    
    // Ensure damage is a valid number to prevent NaN database corruption
    const safeDamage = (typeof playerDamage === 'number' && !isNaN(playerDamage)) ? playerDamage : 1;

    try {
        const doTransaction = () => enemyRef.transaction(currentData => {
            // 🚨 THE FIX: Return null instead of undefined. 
            // This forces Firebase to ping the server to see if the enemy actually exists!
            if (currentData === null) return null; 
            
            // DEEP CLONE to absolutely prevent Firebase maxretry mutation bugs
            let enemy = JSON.parse(JSON.stringify(currentData));
            
            enemy.health = Number(enemy.health);
            if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;
            
            enemy.health -= safeDamage;
            
            if (enemy.health <= 0) return null; 
            
            return enemy; 
        });

        let transactionResult;
        if (typeof window.withTimeout === 'function') {
            transactionResult = await window.withTimeout(doTransaction(), 3000);
        } else {
            console.warn("withTimeout missing. Running raw transaction.");
            transactionResult = await doTransaction();
        }

        if (transactionResult && transactionResult.committed) {
            const finalEnemyState = transactionResult.snapshot.val();

            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(newX, newY, '#ef4444');
                ParticleSystem.createFloatingText(newX, newY, `-${safeDamage}`, '#fff');
            }

            if (finalEnemyState === null) {
                logMessage(`The ${enemyInfo.name} was vanquished!`);
                
                // Bigger explosion on death!
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#ef4444', 15);
                
                try {
                    if (typeof grantXp === 'function') grantXp(enemyInfo.xp);
                    if (typeof updateQuestProgress === 'function') updateQuestProgress(newTile); 
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
                    const droppedLoot = typeof generateEnemyLoot === 'function' ? generateEnemyLoot(player, lootData) : '$';
                    const currentTerrain = chunkManager.getTile(newX, newY);
                    const isProtectedTile = ['📦', '⚰️', '🏺', '🚪', '✨', '∴', 'c', '⛵'].includes(currentTerrain);
                    const isItemTile = typeof ITEM_DATA !== 'undefined' && ITEM_DATA[currentTerrain];

                    if (isProtectedTile || isItemTile) {
                        logMessage("{gray:The enemy's loot was lost in the underbrush.}");
                    } else if (currentTerrain !== '~' && currentTerrain !== '🌋') {
                        chunkManager.setWorldTile(newX, newY, droppedLoot || '.', 2); 
                        gameState.mapDirty = true;
                    }

                } catch (lootErr) {
                    console.error("Loot drop error:", lootErr);
                }
            } 
        } 
        else {
            logMessage("{gray:You swing at empty air... the enemy is already dead.}");
            chunkManager.setWorldTile(newX, newY, '.');
            if (gameState.sharedEnemies[enemyId]) delete gameState.sharedEnemies[enemyId];
        }

    } catch (error) {
        console.error("Combat Error:", error);
        logMessage(`{gray:Error: ${error.message || "Network Sync Failed"}}`);
    }
}

function registerKill(enemy) {
    const tile = enemy.tile || Object.keys(ENEMY_DATA).find(k => ENEMY_DATA[k].name === enemy.name);
    
    let amount = 0;
    if (enemy.xp !== undefined && enemy.xp !== null) amount = Number(enemy.xp);
    else if (tile && typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tile]) amount = ENEMY_DATA[tile].xp || 0;

    if (amount > 0 && typeof grantXp === 'function') grantXp(amount);

    let baseName = enemy.name;
    if (tile && typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tile]) baseName = ENEMY_DATA[tile].name;

    if (!gameState.player.killCounts) gameState.player.killCounts = {};
    gameState.player.killCounts[baseName] = (gameState.player.killCounts[baseName] || 0) + 1;

    // --- METRICS WIN: Track Total Kills ---
    if (!gameState.player.metrics) gameState.player.metrics = {};
    gameState.player.metrics.totalKills = (gameState.player.metrics.totalKills || 0) + 1;
    if (enemy.isBoss) gameState.player.metrics.bossesDefeated = (gameState.player.metrics.bossesDefeated || 0) + 1;

    if (gameState.player.talents && gameState.player.talents.includes('bloodlust')) {
        const heal = 2;
        if (gameState.player.health < gameState.player.maxHealth) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + heal);
            logMessage("{green:Bloodlust heals you for 2 HP!}");
            if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(statDisplays.health, true);
        }
    }

    if (gameState.player.talents && gameState.player.talents.includes('soul_siphon')) {
        const restore = 2;
        if (gameState.player.mana < gameState.player.maxMana) {
            gameState.player.mana = Math.min(gameState.player.maxMana, gameState.player.mana + restore);
            logMessage("{blue:You siphon 2 Mana from the soul.}");
            if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(statDisplays.mana, true);
        }
    }

    if (typeof updateQuestProgress === 'function') updateQuestProgress(tile);
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
            if (Math.random() < 0.2) logMessage("{red:Blood Rage fuels your strike!}");
        }
    }

    if (player.talents && player.talents.includes('shadow_strike')) {
        if (player.stealthTurns > 0) {
            finalDamage = Math.floor(finalDamage * 4);
            logMessage("{purple:Shadow Strike! (4x Damage)}");
        }
    }

    return finalDamage;
}

function handlePlayerDeath() {
    if (window.inputQueue) window.inputQueue.length = 0; // Clear input queue to prevent ghost walking!
    if (gameState.godMode) return false; 
    if (gameState.player.health > 0) return false; 

    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }

    const player = gameState.player;

    player.health = 0; 
    
    // --- METRICS WIN: Track Total Deaths ---
    if (!player.metrics) player.metrics = {};
    player.metrics.totalDeaths = (player.metrics.totalDeaths || 0) + 1;
    
    // JUICE WIN: Death is now a terrifying audiovisual event
    gameState.screenFlash = { color: '#991b1b', alpha: 1.0, decay: 0.01 }; // Fade to blood red
    if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playDeath === 'function') {
        AudioSystem.playDeath();
    }
    
    // LORE WIN: Random Atmospheric Death Quotes
    const deathQuotes = [
        "The world fades to black...",
        "You feel your soul slipping away...",
        "The shadows consume you.",
        "Your vision swims, then goes dark.",
        "Silence takes you."
    ];
    logMessage(`{red:${deathQuotes[Math.floor(Math.random() * deathQuotes.length)]}}`);
    
    if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(statDisplays.health, false);

    // Safely unequip ALL gear to strip their stat bonuses before resetting
    if (player.equipment.weapon && typeof applyStatBonuses === 'function') applyStatBonuses(player.equipment.weapon, -1);
    if (player.equipment.armor && typeof applyStatBonuses === 'function') applyStatBonuses(player.equipment.armor, -1);
    if (player.equipment.offhand && typeof applyStatBonuses === 'function') applyStatBonuses(player.equipment.offhand, -1);
    if (player.equipment.accessory && typeof applyStatBonuses === 'function') applyStatBonuses(player.equipment.accessory, -1);

    const goldLost = Math.floor(player.coins / 2);
    const lvlDisplay = document.getElementById('finalLevelDisplay');
    const coinDisplay = document.getElementById('finalCoinsDisplay');
    const overModal = document.getElementById('gameOverModal');
    
    if (lvlDisplay) lvlDisplay.textContent = `Level: ${player.level}`;
    if (coinDisplay) coinDisplay.textContent = `Gold lost: ${goldLost}`;
    if (overModal) overModal.classList.remove('hidden');

    const deathX = player.x;
    const deathY = player.y;
    const pendingUpdates = {};

    let validFloor = '.';
    if (gameState.mapMode === 'dungeon') {
        const theme = typeof CAVE_THEMES !== 'undefined' ? CAVE_THEMES[gameState.currentCaveTheme] : null;
        if (theme) validFloor = theme.floor;
    }

    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        let placed = false;
        
        // --- Shatter magic items on death to prevent them reverting to base items ---
        const template = (typeof ITEM_DATA !== 'undefined') ? (ITEM_DATA[item.tile] || ITEM_DATA[item.templateId]) : null;
        const isModified = item.statBonuses || (template && item.name !== template.name);
        
        let dropIcon = item.tile || item.templateId || '🎒';
        
        if (isModified) {
            dropIcon = '&'; // Shatters into Arcane Dust because the floor cannot hold magic JSON data
        }
        
        for (let r = 0; r <= 2 && !placed; r++) {
            for (let dy = -r; dy <= r && !placed; dy++) {
                for (let dx = -r; dx <= r && !placed; dx++) {
                    const tx = deathX + dx;
                    const ty = deathY + dy;
                    let tile;

                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') tile = chunkManager.getTile(tx, ty);
                    else if (gameState.mapMode === 'dungeon') tile = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx];
                    else tile = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx];

                    // Check both generic plains floor and specific dungeon floor
                    if (tile === validFloor || tile === '.') {
                        
                        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
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

    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        for (const [cId, updates] of Object.entries(pendingUpdates)) {
            const safeUpdates = typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(updates) : updates;
            
            // Allow for Multiverse and Underworld paths!
            let realmPrefix = '';
            if (gameState.currentRealm !== 0 && gameState.currentRealm) {
                realmPrefix = `realm_${gameState.currentRealm}/`;
            }
            if (gameState.mapMode === 'underworld') {
                realmPrefix += 'underworld/';
            }
            
            if (typeof rtdb !== 'undefined') {
                rtdb.ref(`worldState/${realmPrefix}${cId}`).update(safeUpdates)
                    .catch(err => console.error("Failed to drop corpse loot:", err));
            }
        }
    }

    player.coins -= goldLost;
    
    player.inventory = []; 
    player.equipment = { weapon: { name: 'Fists', damage: 0, tags: ['blunt'] }, armor: { name: 'Simple Tunic', defense: 0 } };
    
    // Reset Arena progress so they aren't permanently locked out of the Colosseum if they return
    player.arenaWave = 0; 

    // Force the database to pull them out of any alternate dimensions or dungeons immediately
    // so if they close the browser on the Game Over screen, they don't load into a wall later!
    const deathUpdates = {
        ... (typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(player) : player),
        currentRealm: 0,
        realmMutators: [],
        mapMode: 'overworld',
        mapId: null
    };

    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.set(deathUpdates, { merge: true }).catch(console.error);
    }

    return true;
}

function handleInstancedEnemyDeath(enemy, x, y) {
    registerKill(enemy);

    const droppedLoot = typeof generateEnemyLoot === 'function' ? generateEnemyLoot(gameState.player, enemy) : '$';
    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

    let mapId = null;
    let mapArray = null;
    let validFloor = '.';

    if (gameState.mapMode === 'dungeon') {
        mapId = gameState.currentCaveId;
        mapArray = chunkManager.caveMaps[mapId];
        if (typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[gameState.currentCaveTheme]) {
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
        const currentTile = mapArray[y][x];
        
        // --- SAFE ARCHITECTURE CHECK ---
        // Do not drop loot if it would overwrite a critical dungeon structure!
        // We now safely check against ITEM_DATA to protect chests/artifacts as well!
        const criticalTiles = ['<', '>', '+', '/', '🚪', '⛰', '⛲'];
        const isItemTile = typeof ITEM_DATA !== 'undefined' && ITEM_DATA[currentTile];
        
        if (criticalTiles.includes(currentTile) || isItemTile) {
            logMessage("{gray:The enemy's loot was lost in the rubble.}");
        } else {
            // It's safe to drop the loot here!
            mapArray[y][x] = droppedLoot || validFloor;
            // Clear the cache so the player can pick up the new drop!
            gameState.lootedTiles.delete(`${mapId}:${x},${-y}`); 
        }
    }
    gameState.mapDirty = true;
}

async function executeThrowTNT(dirX, dirY) {
    const player = gameState.player;
    
    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // 1. Consume the TNT from Inventory
        const invIndex = player.inventory.findIndex(i => i.name === 'Dwarven TNT');
        if (invIndex > -1) {
            player.inventory[invIndex].quantity--;
            if (player.inventory[invIndex].quantity <= 0) player.inventory.splice(invIndex, 1);
            if (typeof playerRef !== 'undefined') playerRef.update({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
        } else {
            return; // Safety catch
        }

        // 2. Calculate Landing Zone (Throw it 3 tiles away)
        const targetX = player.x + (dirX * 3);
        const targetY = player.y + (dirY * 3);

        logMessage("{orange:You lob the TNT! KABOOM!}");
        gameState.screenShake = 30; // Massive shake!
        
        // JUICE WIN: Massive orange flash on explosion
        gameState.screenFlash = { color: '#f97316', alpha: 0.6, decay: 0.1 };
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.4, 200);

        const explosionPromises = [];

        // 3. Detonate in a 3x3 Area
        for (let y = targetY - 1; y <= targetY + 1; y++) {
            for (let x = targetX - 1; x <= targetX + 1; x++) {
                
                // A. Deal 30 Damage to any enemies caught in the blast
                if (typeof applySpellDamage === 'function') {
                    explosionPromises.push(
                        applySpellDamage(x, y, 30, 'fireball').then(hit => {
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#f97316', 5);
                        })
                    );
                }

                // B. Blow up Cracked Walls (🏚) to reveal rare gems and mithril!
                let tileAt;
                if (gameState.mapMode === 'overworld') tileAt = chunkManager.getTile(x, y);
                else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[y]?.[x];
                else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[y]?.[x];

                if (tileAt === '🏚' || tileAt === '🏚️') {
                    // 20% Mithril, 40% Diamond, 40% Massive Gold Cache
                    const roll = Math.random();
                    let loot = '$';
                    if (roll < 0.20) loot = '💠';
                    else if (roll < 0.60) loot = '💎';

                    if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, loot);
                    else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][y][x] = loot;
                    else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][y][x] = loot; 
                    
                    logMessage("{yellow:The explosion shatters a cracked wall, revealing hidden treasure!}");
                }
            }
        }
        
        await Promise.all(explosionPromises);
        
        // Finalize Turn
        gameState.isAiming = false;
        if (typeof endPlayerTurn === 'function') endPlayerTurn();
        if (typeof render === 'function') render();
        if (typeof renderInventory === 'function') renderInventory();

    } finally {
        isProcessingMove = false;
    }
}

// --- END OF FILE combat.js ---
