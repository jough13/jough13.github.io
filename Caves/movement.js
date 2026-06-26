// --- START OF FILE movement.js ---

// ==========================================
// MOVEMENT & MAP TRANSITIONS
// ==========================================

window.toggleMount = function() {
    const p = gameState.player;
    
    // Dismount
    if (p.isMounted) {
        p.isMounted = false;
        logMessage(`You dismount your ${p.companion.name}.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
        gameState.mapDirty = true;
        if (typeof render === 'function') render();
        return;
    }

    // Mount Checks
    if (!p.companion) {
        logMessage("{gray:You don't have a companion to ride.}");
        return;
    }
    if (!p.companion.isRideable) {
        logMessage("{gray:Your companion is too small to ride.}");
        return;
    }
    if (p.isBoating || p.isSailing) {
        logMessage("{gray:You can't mount up while on a boat.}");
        return;
    }

    p.isMounted = true;
    logMessage(`{green:You mount your ${p.companion.name}!}`);
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); 
    gameState.mapDirty = true;
    if (typeof render === 'function') render();
};

/**
 * Helper function to execute critical chunk loading, enemy syncing, and saving
 * when a player teleports, enters a dungeon, or shifts between world layers.
 */

function finalizeMapTransition() {
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);

        // Load 3x3 chunk area around player
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                chunkManager.listenToChunkState(currentChunkX + x, currentChunkY + y);
            }
        }

        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

        if (typeof EnemyNetworkManager !== 'undefined') {
            EnemyNetworkManager.syncChunks(gameState.player.x, gameState.player.y);
        }
        
        // Wake up nearby static enemies that might be in the new chunk
        if (typeof wakeUpNearbyEnemies === 'function') wakeUpNearbyEnemies();
    }

    const newExploration = updateExploration();

    let updates = {
        x: gameState.player.x,
        y: gameState.player.y,
        mapMode: gameState.mapMode,
        mapId: gameState.currentCaveId || gameState.currentCastleId || null,
        currentRealm: gameState.currentRealm || 0
    };

    if (newExploration) {
        updates.exploredChunks = Array.from(gameState.exploredChunks);
    }

    // Pass updates to endPlayerTurn so it triggers a debounced save to Firebase
    endPlayerTurn(updates);
}

/**
 * Claims a world tile (like an item or chest) using a Firebase Transaction.
 * Prevents duplication exploits when multiple players try to grab the same object.
 */
async function claimWorldTile(x, y, expectedTile) {
    // Instanced maps (Dungeons/Castles) are single-player, so no transaction is needed.
    if (gameState.mapMode !== 'overworld' && gameState.mapMode !== 'underworld') {
        return true; 
    }
    
    const chunkX = Math.floor(x / chunkManager.CHUNK_SIZE);
    const chunkY = Math.floor(y / chunkManager.CHUNK_SIZE);
    const chunkId = `${chunkX},${chunkY}`;
    const localX = ((x % chunkManager.CHUNK_SIZE) + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
    const localY = ((y % chunkManager.CHUNK_SIZE) + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
    const tileKey = `${localX},${localY}`;
    
    let realmPrefix = '';
    if (gameState.currentRealm !== 0 && gameState.currentRealm) {
        realmPrefix = `realm_${gameState.currentRealm}/`;
    }
    if (gameState.mapMode === 'underworld') {
        realmPrefix += 'underworld/';
    }
    
    const tileRef = rtdb.ref(`worldState/${realmPrefix}${chunkId}/${tileKey}`);
    
    try {
        const txResult = await tileRef.transaction(currentData => {
            // If it's a TTL (time-to-live) object, check the 't' property. Otherwise check the string.
            const currentVal = (typeof currentData === 'object' && currentData !== null) ? currentData.t : currentData;
            
            // If the item isn't there anymore, abort the transaction!
            if (currentVal !== expectedTile) return undefined; 
            
            // Otherwise, claim it by deleting it from the world state
            return null; 
        });
        
        return txResult.committed;
    } catch (e) {
        console.error("Failed to claim tile:", e);
        return false;
    }
}

async function attemptMovePlayer(newX, newY) {
    // 1. Unlock input if we are just waiting (Safety fallback)
    if (newX === gameState.player.x && newY === gameState.player.y) {
        isProcessingMove = false;
        return;
    }

    // 🚨 GLOBAL ENGINE LOCK
    if (isProcessingMove) return;
    isProcessingMove = true;

    try {
        // Capture previous coordinates immediately at the top of the function to prevent ReferenceErrors
        const prevX = gameState.player.x;
        const prevY = gameState.player.y;

    // --- DIAGONAL CLIPPING CHECK ---
    const dx = newX - gameState.player.x;
    const dy = newY - gameState.player.y;

    // If moving diagonally (change in X and Y is 1)
    if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {

        // Helper to get a tile regardless of map mode
        const getTileAt = (tx, ty) => {
            if (gameState.mapMode === 'overworld') return chunkManager.getTile(tx, ty);
            if (gameState.mapMode === 'dungeon') return chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx] || ' ';
            if (gameState.mapMode === 'castle') return chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx] || ' ';
            return ' ';
        };

        // Get the two "cardinal" neighbors we are passing between
        const t1 = getTileAt(gameState.player.x + dx, gameState.player.y); // Horizontal neighbor
        const t2 = getTileAt(gameState.player.x, gameState.player.y + dy); // Vertical neighbor

        // Define what counts as a "Hard Block" for squeezing
        const isHardBlock = (t) => {
            // 1. Check defined obstacles (Trees, Webs, Barrels)
            if (TILE_DATA[t] && TILE_DATA[t].type === 'obstacle') return true;

            // 2. Check Walls and Mountains
            // ▓/▒ = Dungeon/Castle Walls, 🧱 = Village Walls, ^ = Mountains
            if (['▓', '▒', '🧱', '^'].includes(t)) return true;

            // 3. Check Water (unless boating or has gills)
            if ((t === '~' || t === '≈') && !gameState.player.isBoating && gameState.player.waterBreathingTurns <= 0) return true;

            return false;
        };

        // If BOTH neighbors are blocked, you can't squeeze through the crack
        if (isHardBlock(t1) && isHardBlock(t2)) {
            logMessage("{gray:The gap is too tight to squeeze through.}");
            return; // Stop the move immediately
        }
    }

    let newTile;

    // --- SKY REALM FALL HAZARD ---
    if (gameState.mapMode === 'skyrealm') {
        const checkTile = chunkManager.getTile(newX, newY);
        if (checkTile === ' ') {
            logMessage("{red:You step off the edge and plummet to the earth!}");
            
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(1.0, 0.2, 300); // Wind rush
            
            gameState.screenShake = 30;
            window.modifyVital('health', -25);
            
            // Return to Overworld
            gameState.mapMode = 'overworld';
            gameState.mapDirty = true;
            render();
            
            if (gameState.player.health <= 0) return; // Stop the move, you fell!
            return;
        }
    }

    // --- CHECK FOR LIVE ENEMIES FIRST (Combat Priority) ---
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        const enemyKey = `overworld:${newX},${-newY}`; // Works for both layers
        const overlayEnemy = gameState.sharedEnemies[enemyKey];

        if (overlayEnemy) {
            // If there is a live enemy here, force the tile to be the enemy type so combat triggers.
            newTile = overlayEnemy.tile;
        } else {
            newTile = chunkManager.getTile(newX, newY);
        }
    } else if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        newTile = (map && map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';
    } else {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        newTile = (map && map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';
    }

    // --- SPAWN LOCK CHECK ---
    const spawnLockId = `${newX},${newY}`;
    const enemyKey = `overworld:${newX},${-newY}`;

    if (processingSpawnTiles.has(spawnLockId) && !gameState.sharedEnemies[enemyKey]) {
        console.log("Blocked move: Enemy spawning...");
        isProcessingMove = false;
        return;
    }

    let inventoryWasUpdated = false;
    let tileData = TILE_DATA[newTile];

    let tileId;
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        tileId = `${newX},${-newY}`;
    } else {
        const mapId = gameState.currentCaveId || gameState.currentCastleId;
        tileId = `${mapId}:${newX},${-newY}`;
    }

    // --- OBELISK PUZZLE LOGIC ---
    if (tileData && tileData.type === 'obelisk_puzzle') {
        const dir = tileData.direction;
        const requiredOrder = ['north', 'east', 'west', 'south'];
        const currentStep = gameState.player.obeliskProgress.length;

        logMessage(tileData.flavor);

        // Check if we are activating the CORRECT next step
        if (dir === requiredOrder[currentStep]) {
            if (!gameState.player.obeliskProgress.includes(dir)) {
                gameState.player.obeliskProgress.push(dir);

                logMessage(`{cyan:The Obelisk hums violently! (${gameState.player.obeliskProgress.length}/4 activated)}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#3b82f6', 15); // Blue explosion
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                // Dynamically generate the correct specific templateId so the lore attaches properly
                const templateId = `🧩${dir.charAt(0).toLowerCase()}`;
                const fragmentName = `Tablet of the ${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
                const fragmentItem = { templateId: templateId, name: fragmentName, type: 'junk', quantity: 1, tile: '🧩' };

                if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push(fragmentItem);
                    logMessage(`{purple:A stone fragment falls from the obelisk: ${fragmentName}}`);
                } else {
                    logMessage(`{red:A stone fragment falls from the obelisk, but your inventory is full!}`);
                    chunkManager.setWorldTile(newX, newY, '🧩', 2); // Drops on ground for 2 hours
                    gameState.mapDirty = true;
                }

                // Save progress
                playerRef.update({
                    obeliskProgress: gameState.player.obeliskProgress,
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                });
            } else {
                logMessage("This obelisk is already active.");
            }
        }
        // Wrong order? Reset!
        else if (!gameState.player.obeliskProgress.includes(dir)) {
            logMessage("{red:The Obelisk shrieks! A shockwave knocks you back!}");
            logMessage("{red:PUZZLE FAILED. Sequence Reset.}");

            gameState.player.obeliskProgress = []; // Reset
            
            // Punishment damage visual
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ef4444', 10);
            
            window.modifyVital('health', -5);

            playerRef.update({
                health: gameState.player.health,
                obeliskProgress: []
            });

            if (gameState.player.health <= 0) return;
        }
        return;
    }

    if (tileData && tileData.type === 'spirit_npc') {
        const requiredItem = tileData.requiresItem;
        const hasItem = gameState.player.inventory.some(i => i.name === requiredItem);

        if (!hasItem) {
            logMessage(`{gray:${tileData.invisibleMessage || "You walk through a patch of unnaturally cold air."}}`);
            gameState.player.x = newX;
            gameState.player.y = newY;
            gameState.mapDirty = true;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.1, 400); // Ethereal whisper
            endPlayerTurn();
            render();
            return;
        }

        const seed = stringToSeed(tileId + gameState.playerTurnCount);
        const random = Alea(seed);
        const msg = tileData.dialogue[Math.floor(random() * tileData.dialogue.length)];

        loreTitle.textContent = tileData.name;
        loreContent.textContent = `The ghostly figure shimmers into view through your lens.\n\n"${msg}"`;
        loreModal.classList.remove('hidden');

        if (!gameState.foundLore.has(tileId)) {
            grantXp(50);
            gameState.foundLore.add(tileId);
            playerRef.update({
                foundLore: Array.from(gameState.foundLore)
            });
        }
        return;
    }

    // --- SEALED DOOR LOGIC ---
    if (tileData && tileData.type === 'sealed_door') {
        const hasKey = gameState.player.inventory.some(i => i.name === 'Ancient Key');

        if (hasKey) {
            logMessage("{yellow:You insert the Ancient Key. The massive doors grind open...}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            // Teleport to a special Vault Dungeon ID
            gameState.mapMode = 'dungeon';
            gameState.currentCaveId = 'vault_kings_treasure';
            gameState.currentCaveTheme = 'GOLDEN'; 

            // Generate the Vault
            chunkManager.generateCave(gameState.currentCaveId);

            // Move player
            gameState.player.x = 10; // Arbitrary safe spot in gen logic
            gameState.player.y = 10;

            updateRegionDisplay();
            render();
            syncPlayerState();
            finalizeMapTransition(); // NETWORK SYNC
            return;
        } else {
            logMessage("The door is sealed tight. There is a keyhole shaped like four joined stone fragments.");
        }
        return;
    }

    // 3. Overlay Collision Check
    if (gameState.mapMode === 'overworld') {
        const enemyKey = `overworld:${newX},${-newY}`;
        const overlayEnemy = gameState.sharedEnemies[enemyKey];

        if (overlayEnemy) {
            // Check if this is a valid enemy
            if (ENEMY_DATA[overlayEnemy.tile]) {
                // Valid enemy: Override tile to trigger combat
                newTile = overlayEnemy.tile;
                // Update tileData in case the enemy tile has interaction data
                tileData = TILE_DATA[newTile];
            } else {
                // Invalid "Ghost" enemy logic
                logMessage("{gray:Dissipating a phantom signal...}");

                // 1. Delete from DB and Local State
                rtdb.ref(`worldEnemies/${enemyKey}`).remove();
                delete gameState.sharedEnemies[enemyKey];

                // 2. Reset the destination tile to the actual terrain
                newTile = chunkManager.getTile(newX, newY);
                tileData = TILE_DATA[newTile];

                // 3. Force a visual update to remove the sprite
                render();
            }
        }
    }

    // --- COMBAT CHECK ---
    const enemyData = ENEMY_DATA[newTile];
    if (enemyData) {

        // handleInput already updated the timer!

        const hitChance = calculateHitChance(gameState.player, enemyData);

        if (Math.random() > hitChance) {
            logMessage(`You swing at the ${enemyData.name} but miss!`);

            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createFloatingText(newX, newY, "MISS", "#9ca3af");
            }
            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('light');

            // We still end the turn so the enemy can move/attack
            endPlayerTurn();
            return;
        }

        // 1. Calculate Player's Raw Attack Power
        const weaponDamage = gameState.player.equipment.weapon ? gameState.player.equipment.weapon.damage : 0;
        const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);

        let rawDamage = playerStrength + weaponDamage;

        // --- APPLY TALENT MODIFIERS ---
        rawDamage = getPlayerDamageModifier(rawDamage);

        // --- BREAK STEALTH ---
        if (gameState.player.stealthTurns > 0) {
            gameState.player.stealthTurns = 0;
            logMessage("{gray:You emerge from the shadows.}");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#374151', 10);
            playerRef.update({
                stealthTurns: 0
            });
        }

        // 2. Critical Hit Check
        const critChance = 0.05 + (gameState.player.luck * 0.005);
        let isCrit = false;

        if (Math.random() < critChance) {
            const mult = (gameState.player.talents && gameState.player.talents.includes('backstab')) ? 3.0 : 1.5;
            rawDamage = Math.floor(rawDamage * mult);
            isCrit = true;
        }

        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            // --- INSTANCED COMBAT (Inside attemptMovePlayer) ---
            let enemy = gameState.instancedEnemies.find(e => e.x === newX && e.y === newY);
            let enemyId = enemy ? enemy.id : null;

            if (enemy) {
                const boostedDamage = getPlayerDamageModifier(rawDamage);
                let playerDamage = Math.max(1, boostedDamage - (enemy.defense || 0));

                // Low-level grace logic
                if (gameState.player.level < 4 && enemyData.maxHealth <= 10) {
                    const graceFloor = Math.ceil(gameState.player.strength / 2);
                    playerDamage = Math.max(playerDamage, graceFloor);
                }

                enemy.health -= playerDamage;

                // --- WEAPON PROC SYSTEM ---
                const equippedWeapon = gameState.player.equipment.weapon;
                if (equippedWeapon && equippedWeapon.onHit && Math.random() < equippedWeapon.procChance) {
                    logMessage(`{blue:Your ${equippedWeapon.name} surges with power!}`);
                    const spellId = equippedWeapon.onHit;
                    const spellData = SPELL_DATA[spellId];
                    const procDmg = spellData.baseDamage + (gameState.player.wits * 0.5);
                    applySpellDamage(newX, newY, procDmg, spellId);
                }

                // JUICE WIN: Dynamic Audio Feedback
                if (isCrit && typeof AudioSystem !== 'undefined' && typeof AudioSystem.playCrit === 'function') {
                    AudioSystem.playCrit();
                } else if (typeof AudioSystem !== 'undefined') {
                    AudioSystem.playAttack();
                }

                // Log & Effects
                if (isCrit) {
                    logMessage(`{gold:CRITICAL HIT! You strike the ${enemy.name} for ${playerDamage} damage!}`);
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(newX, newY, '#facc15');
                        ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                    }
                } else {
                    logMessage(`You attack the ${enemy.name} for {red:${playerDamage}} damage!`);
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(newX, newY, '#ef4444');
                        ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');
                    }
                }

                // Weapon Poison Effect
                const weapon = gameState.player.equipment.weapon;
                if (weapon && weapon.inflicts === 'poison' && enemy.poisonTurns <= 0 && Math.random() < (weapon.inflictChance || 0.25)) {
                    logMessage(`{green:Your weapon poisons the ${enemy.name}!}`);
                    enemy.poisonTurns = 3;
                }

                // Enemy Death Logic
                if (enemy.health <= 0) {
                    logMessage(`You defeated the ${enemy.name}!`);
                    handleInstancedEnemyDeath(enemy, newX, newY);
                }

                // FINALIZE TURN - No counter-attack here! 
                // The enemy will now attack during the processEnemyTurns() AI loop.
                endPlayerTurn();
                render();
                return;

            } else {
                logMessage(`You see the corpse of a ${enemyData.name}.`);
            }

        } else if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            // --- SHARED COMBAT ---
            let playerDamage = Math.max(1, rawDamage - (enemyData.defense || 0));

            if (gameState.player.level < 4 && enemyData.maxHealth <= 10) {
                const graceFloor = Math.ceil(gameState.player.strength / 2);
                playerDamage = Math.max(playerDamage, graceFloor);
            }

            // Look up the live entity to get the correct name (e.g. "Spectral Giant Rat")
            const enemyId = `overworld:${newX},${-newY}`;
            const liveEnemy = gameState.sharedEnemies[enemyKey];
            const targetName = liveEnemy ? liveEnemy.name : enemyData.name;

            // JUICE WIN: Dynamic Audio Feedback
            if (isCrit && typeof AudioSystem !== 'undefined' && typeof AudioSystem.playCrit === 'function') {
                AudioSystem.playCrit();
            } else if (typeof AudioSystem !== 'undefined') {
                AudioSystem.playAttack();
            }

            if (isCrit) {
                logMessage(`{gold:CRITICAL HIT! You strike the ${targetName} for ${playerDamage} damage!}`);
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                }
            } else {
                logMessage(`You attack the ${targetName} for {red:${playerDamage}} damage!`);
            }

            try {
                // We await the network transaction.
                await handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage);
            } catch (err) {
                console.error("Combat transaction failed or timed out:", err);
            }
            
            endPlayerTurn();
            render();
            return;
        }
    }

    // --- DATA-DRIVEN INTERACTION CHECK ---
    if (tileData && typeof tileData.onInteract === 'function') {
        const updatesToSave = tileData.onInteract(gameState, newX, newY);
        
        if (updatesToSave) {
            updatesToSave.lootedTiles = Object.fromEntries(gameState.lootedTiles);
            playerRef.update(updatesToSave);
            renderStats();
        }
        
        endPlayerTurn(); 
        return; 
    }

    // --- ACTIVE TREASURE MAP LOGIC ---
    if (gameState.activeTreasure && newX === gameState.activeTreasure.x && newY === gameState.activeTreasure.y) {
        const hasShovel = gameState.player.inventory.some(i => i.name === 'Shovel');
        
        if (hasShovel) {
            logMessage("{gold:You hit something solid! You unearthed the hidden treasure!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#facc15', 25);

            // 1. Give massive gold
            const goldFound = 500 + Math.floor(Math.random() * 500);
            gameState.player.coins += goldFound;
            
            // Integrate with our new Anti-Cheat tracker!
            if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(goldFound);
            logMessage(`{yellow:You found ${goldFound} Gold!}`);

            // 2. Give high-tier artifacts/gems
            const treasureLoot = ['💎b', '💎r', '👑', '💍', '🏺a', '✨', '✨'];
            const numItems = 2 + Math.floor(Math.random() * 2); // 2 to 3 premium items
            
            for (let i = 0; i < numItems; i++) {
                const itemKey = treasureLoot[Math.floor(Math.random() * treasureLoot.length)];
                const template = ITEM_DATA[itemKey];
                
                if (template && gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push({
                        templateId: itemKey,
                        name: template.name,
                        type: template.type,
                        quantity: 1,
                        tile: template.tile || itemKey,
                        damage: template.damage || null,
                        defense: template.defense || null,
                        slot: template.slot || null,
                        statBonuses: template.statBonuses || null
                    });
                    logMessage(`{purple:You unearthed a ${template.name}!}`);
                } else {
                    logMessage(`{red:You unearthed a ${template.name}, but your pack is full!}`);
                    // Drop the excess loot on the ground
                    const dropTile = template ? (template.tile || itemKey) : '🎒';
                    if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, dropTile, 24); // 24hr TTL
                    gameState.mapDirty = true;
                }
            }

            // 3. Clear the treasure mark & apply stamina cost
            gameState.activeTreasure = null;
            window.modifyVital('stamina', -2);
            
            // 4. Save and Update
            if (typeof playerRef !== 'undefined') {
                playerRef.update({ 
                    activeTreasure: null,
                    coins: gameState.player.coins,
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                });
            }
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderStats === 'function') renderStats();
            
            gameState.mapDirty = true;
            render();
            endPlayerTurn();
            return;
        } else {
            logMessage("{gray:X marks the spot... but you need a Shovel to dig here.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; // Block movement so they don't accidentally walk past it
        }
    }

    // --- ARCHAEOLOGY LOGIC ---
    if (newTile === '∴') {
        const hasShovel = gameState.player.inventory.some(i => i.name === 'Shovel');

        if (hasShovel) {
            logMessage("You dig into the loose soil...");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Thud/dig sound
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#78350f', 15); // Dirt flying

            // 1. Stamina Cost
            window.modifyVital('stamina', -2);

            // 2. Loot Table
            const roll = Math.random();
            let foundItem = null;

            if (roll < 0.15) {
                // 15% Chance: Trap/Enemy!
                logMessage("{red:You disturbed a grave! A Skeleton crawls out!}");
                chunkManager.setWorldTile(newX, newY, 's'); // Spawn Skeleton

                // Create enemy in memory immediately so it can fight
                const enemyData = ENEMY_DATA['s'];
                const enemyId = `overworld:${newX},${-newY}`;
                const scaledStats = getScaledEnemy(enemyData, newX, newY);
                gameState.sharedEnemies[enemyId] = { ...scaledStats,
                    tile: 's',
                    x: newX,
                    y: newY
                };

                render();
                return; // Stop movement, fight starts next turn
            } else if (roll < 0.50) {
                // 35% Chance: Artifact (Expanded Loot)
                const artifacts = ['🏺a', '🗿h', '🦴d', 'ancient_coin', 'gold_dust', '💍', '💎b'];
                const key = artifacts[Math.floor(Math.random() * artifacts.length)];
                const template = ITEM_DATA[key];

                if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push({
                        templateId: key,
                        name: template.name,
                        type: template.type,
                        quantity: 1,
                        tile: template.tile || key
                    });
                    logMessage(`{purple:You unearthed a ${template.name}!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    grantXp(25); // Discovery XP
                } else {
                    logMessage(`{red:You unearthed a ${template.name}, but your inventory is full! It drops to the ground.}`);
                    // Drop the artifact on the ground
                    const dropTile = template.tile || key;
                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(newX, newY, dropTile);
                    else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = dropTile;
                    else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = dropTile;
                    
                    // We don't need to delete from lootedTiles here because dig spots are consumed/turned into floor
                    gameState.mapDirty = true;
                    render();
                }
            } else {
                // 50% Chance: Just dirt/worms
                logMessage("{gray:Just dirt and rocks.}");
            }

            // Clear the tile
            chunkManager.setWorldTile(newX, newY, '.');
            playerRef.update({
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
            });
            if (typeof renderInventory === 'function') renderInventory();
            render();
            return; // Digging takes a turn
        } else {
            logMessage("{gray:The soil is loose here. If only you had a Shovel...}");
        }
    }

    // --- INTERACTION LOGIC ---

    if (gameState.mapMode === 'castle' && gameState.friendlyNpcs) {
        const npc = gameState.friendlyNpcs.find(n => n.x === newX && n.y === newY);
        if (npc) {
            const seed = stringToSeed(gameState.playerTurnCount + npc.id);
            const random = Alea(seed);
            const dialogue = npc.dialogue[Math.floor(random() * npc.dialogue.length)];

            loreTitle.textContent = npc.name || "Villager";
            loreContent.textContent = `The ${npc.role} stops to address you.\n\n"${dialogue}"`;
            loreModal.classList.remove('hidden');
            return;
        }
    }

    if (newTile === '🎓') {

        const player = gameState.player;
        const inv = player.inventory;

        // Initialize Quest Stage if missing
        player.relicQuestStage = player.relicQuestStage || 0;

        loreTitle.textContent = "Royal Historian";
        let dialogueHtml = "";

        // --- 0. SECRET: RESTORE CROWN ---
        const crownIndex = inv.findIndex(i => i.name === 'Shattered Crown');
        if (crownIndex > -1) {
            loreTitle.textContent = "The Historian Gasps";
            loreContent.innerHTML = `
                <p>The Historian drops his quill when he sees the crown in your bag.</p>
                <p>"By the ancestors... that is the diadem of Alaric himself! It is shattered, but I can repair it using my tools."</p>
                <button id="restoreCrownBtn" class="mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded w-full">Restore the Crown</button>
            `;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                document.getElementById('restoreCrownBtn').onclick = () => {
                    // Remove Old Crown
                    inv.splice(crownIndex, 1);

                    // Add Restored Crown using the correct templateId
                    inv.push({
                        templateId: "👑_restored", // <--- Bound to correct template definition
                        name: "Crown of the First King",
                        type: "armor",
                        tile: "👑",
                        quantity: 1,
                        defense: 2,
                        slot: "armor",
                        statBonuses: {
                            charisma: 10,
                            luck: 5,
                            maxMana: 20
                        },
                        description: "Restored to its former glory. You act with the authority of the Old World."
                    });

                    logMessage("{gold:The Historian restores the crown. It shines like the sun!}");
                    triggerStatAnimation(document.getElementById('levelDisplay'), 'stat-pulse-purple');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();

                    playerRef.update({
                        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv
                    });
                    if (typeof renderInventory === 'function') renderInventory();
                    loreModal.classList.add('hidden');
                };
            }, 0);
            return; // Stop processing other historian dialogue
        }

        // --- 1. MAIN QUEST LOGIC ---
        if (player.relicQuestStage === 0) {
            dialogueHtml = `<p>"Ah, a traveler! I am researching the fall of the Old King. Legend says his power was sealed in three gems."</p><p>"Bring me the <b>Sun Shard</b> from the deserts to the south. I will reward you."</p>`;
            player.relicQuestStage = 1;
        } else if (player.relicQuestStage === 1) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Sun Shard');
            if (hasShardIndex > -1) {
                inv.splice(hasShardIndex, 1);
                player.relicQuestStage = 2;
                grantXp(200);
                dialogueHtml = `<p>"Magnificent! It is warm to the touch. Next, seek the <b>Moon Tear</b>. It is said to be lost in the deep swamps."</p>`;
            } else {
                dialogueHtml = `<p>"The <b>Sun Shard</b> is hidden in the scorching sands of the Desert. Please hurry."</p>`;
            }
        } else if (player.relicQuestStage === 2) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Moon Tear');
            if (hasShardIndex > -1) {
                inv.splice(hasShardIndex, 1);
                player.relicQuestStage = 3;
                grantXp(300);
                dialogueHtml = `<p>"Incredible. One remains. The <b>Void Crystal</b>. It lies in the highest peaks of the Mountains, guarded by ancient beasts."</p>`;
            } else {
                dialogueHtml = `<p>"The <b>Moon Tear</b> is in the Swamp. Beware the poison."</p>`;
            }
        } else if (player.relicQuestStage === 3) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Void Crystal');
            if (hasShardIndex > -1) {
                // Check space before taking
                if (inv.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    inv.splice(hasShardIndex, 1);
                    player.relicQuestStage = 4;
                    grantXp(500);
                    const reward = ITEM_DATA['⚡']; // Stormbringer
                    inv.push({ ...reward,
                        templateId: '⚡',
                        quantity: 1
                    });
                    dialogueHtml = `<p>"You have done it! The trinity is restored. As promised, take this... The King's own blade, <b>Stormbringer</b>."</p>`;
                } else {
                    dialogueHtml = `<p>"I have your reward, but your pack is full! Make space and return to me."</p>`;
                }
            } else {
                dialogueHtml = `<p>"The <b>Void Crystal</b> is in the Mountains. It is the most dangerous journey."</p>`;
            }
        } else {
            dialogueHtml = `<p>"The history books will remember your name, hero."</p>`;
        }

        // --- 2. MEMORY SHARD TRADE LOGIC ---
        const shardIndex = inv.findIndex(i => i.name === 'Memory Shard');
        let tradeHtml = "";

        if (shardIndex > -1) {
            const shardCount = inv[shardIndex].quantity;
            tradeHtml = `
                <hr class="my-4 border-gray-500">
                <p class="text-sm italic">"I see you have found <b>${shardCount} Memory Shards</b>. I can trade for them."</p>
                <button id="tradeShardXP" class="mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded w-full">Trade 1 Shard for 100 XP</button>
                <button id="tradeShardStat" class="mt-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded w-full">Trade 3 Shards for Stat Tome</button>
            `;
        }

        // --- 3. RENDER UI ---
        loreContent.innerHTML = dialogueHtml + tradeHtml;
        loreModal.classList.remove('hidden');

        // --- 4. BIND BUTTONS (If they exist) ---
        if (shardIndex > -1) {
            setTimeout(() => { // Timeout ensures DOM is updated before we grab elements
                const btnXP = document.getElementById('tradeShardXP');
                const btnStat = document.getElementById('tradeShardStat');

                if (btnXP) {
                    btnXP.onclick = () => {
                        // Re-check inventory to be safe
                        const currentShardIdx = gameState.player.inventory.findIndex(i => i.name === 'Memory Shard');
                        if (currentShardIdx > -1) {
                            gameState.player.inventory[currentShardIdx].quantity--;
                            if (gameState.player.inventory[currentShardIdx].quantity <= 0) gameState.player.inventory.splice(currentShardIdx, 1);

                            grantXp(100);
                            logMessage("{purple:The Historian shares ancient secrets with you.}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                            loreModal.classList.add('hidden');
                            playerRef.update({
                                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv
                            });
                            if (typeof renderInventory === 'function') renderInventory();
                        }
                    };
                }

                if (btnStat) {
                    btnStat.onclick = () => {
                        const currentShardIdx = gameState.player.inventory.findIndex(i => i.name === 'Memory Shard');
                        if (currentShardIdx > -1 && gameState.player.inventory[currentShardIdx].quantity >= 3) {
                            gameState.player.inventory[currentShardIdx].quantity -= 3;
                            if (gameState.player.inventory[currentShardIdx].quantity <= 0) gameState.player.inventory.splice(currentShardIdx, 1);

                            if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                                // Random Stat Tome
                                const stats = ['strength', 'wits', 'constitution', 'dexterity', 'luck'];
                                const rndStat = stats[Math.floor(Math.random() * stats.length)];
                                // Create a dynamic tome based on the random stat
                                const tomeItem = {
                                    templateId: '💪',
                                    name: `Tome of ${rndStat.charAt(0).toUpperCase() + rndStat.slice(1)}`,
                                    type: 'tome',
                                    quantity: 1,
                                    tile: '📖', // Using generic book icon
                                    stat: rndStat
                                };
                                gameState.player.inventory.push(tomeItem);
                                logMessage(`{gold:Received ${tomeItem.name}!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                            } else {
                                logMessage("{red:Inventory full! Shards returned.}");
                                gameState.player.inventory[currentShardIdx].quantity += 3; // Refund
                            }

                            loreModal.classList.add('hidden');
                            playerRef.update({
                                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv
                            });
                            if (typeof renderInventory === 'function') renderInventory();
                        } else {
                            logMessage("{gray:Not enough shards.}");
                        }
                    };
                }
            }, 0);
        }

        // Save progress
        playerRef.update({
            relicQuestStage: player.relicQuestStage,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv
        });
        if (typeof renderInventory === 'function') renderInventory();
        return;
    }

    if (newTile === '👻') {
        const echoes = [
            "I saw the King... his eyes were black as the void.",
            "We sealed the doors, but the shadows came through the walls.",
            "The mages promised power. They only brought ruin.",
            "My sword passed right through them. We never stood a chance.",
            "Run... while you still can."
        ];
        const msg = echoes[Math.floor(Math.random() * echoes.length)];

        logMessage(`{gray:The ghost whispers: "${msg}"}`);
        logMessage("{purple:It fades away, leaving a Memory Shard.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.1, 400); // Ethereal whisper

        // Give Item
        if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            gameState.player.inventory.push({
                templateId: '👻s',
                name: 'Memory Shard',
                type: 'junk',
                quantity: 1,
                tile: '👻'
            });
            inventoryWasUpdated = true; // Auto-save flag
        } else {
            logMessage("{red:Your inventory is full, the shard falls to the ground.}");
        }

        chunkManager.setWorldTile(newX, newY, '.'); // Remove ghost
        playerRef.update({
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
        });
        if (typeof renderInventory === 'function') renderInventory();
        return;
    }

    if (newTile === '?') {
        const tileId = `${newX},${-newY}`;

        // Check if already solved
        if (gameState.lootedTiles.has(tileId)) {
            logMessage("{gray:The statue stands silent. Its riddle is solved.}");
            return;
        }

        // Pick a riddle based on location hash
        const seed = stringToSeed(tileId);
        const riddleIndex = Math.abs(seed) % RIDDLE_DATA.length;
        const riddle = RIDDLE_DATA[riddleIndex];

        // Setup UI
        loreTitle.textContent = "The Whispering Statue";
        loreContent.textContent = `A voice echoes in your mind:\n\n"${riddle.question}"`;

        const riddleContainer = document.getElementById('riddleContainer');
        const riddleInput = document.getElementById('riddleInput');
        const submitBtn = document.getElementById('submitRiddle');

        riddleContainer.classList.remove('hidden');
        riddleInput.value = ''; // Clear old input
        loreModal.classList.remove('hidden');

        // Handle Submit (One-time event listener wrapper)
        submitBtn.onclick = () => {
            const answer = riddleInput.value.toLowerCase().trim();
            if (riddle.answers.includes(answer)) {
                // Correct!
                logMessage(`{green:${riddle.message}}`);
                gameState.player[riddle.reward]++; // Give Stat
                triggerStatAnimation(statDisplays[riddle.reward], 'stat-pulse-green');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                // Mark solved
                gameState.lootedTiles.add(tileId);
                playerRef.update({
                    lootedTiles: Object.fromEntries(gameState.lootedTiles),
                    [riddle.reward]: gameState.player[riddle.reward]
                });

                loreModal.classList.add('hidden');
                renderStats();
            } else {
                // Wrong
                logMessage("{red:The statue remains silent. That is not the answer.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                loreModal.classList.add('hidden');
                
                window.modifyVital('health', -2); // Punishment
                renderStats();
                
                if (gameState.player.health <= 0) {
                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    return; 
                }
            }
        };
        return;
    }

    if (newTile === '¥') {
        // Create a persistent shop ID based on coordinates so his stock doesn't magically refresh
        const shopId = `trader_${newX}_${newY}`;
        
        if (!gameState.shopStates) gameState.shopStates = {};
        if (!gameState.shopStates[shopId]) {
            gameState.shopStates[shopId] = JSON.parse(JSON.stringify(TRADER_INVENTORY));
        }
        
        activeShopInventory = gameState.shopStates[shopId];
        
        logMessage("You meet a Wandering Trader. 'Rare goods, for a price...'");
        if (typeof renderShop === 'function') renderShop();
        shopModal.classList.remove('hidden');
        return;
    }

    // --- DUNGEON WALL CHECK ---
    if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme];
        const secretWallTile = theme ? theme.secretWall : null;
        const phaseWallTile = theme ? theme.phaseWall : null;

        if (secretWallTile && newTile === secretWallTile) {
            logMessage("{cyan:The wall sounds hollow... You break through!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#9ca3af', 10);
            
            chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            grantXp(15);
            render();
            return;
        }
        if (phaseWallTile && newTile === phaseWallTile) {
            logMessage("{purple:You step into the wall... and pass right through it like smoke.}");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#a855f7', 15);
        } else if (theme && (newTile === theme.wall || newTile === ' ')) {
            logMessage("{gray:The wall is solid.}");
            return;
        }
    }

    // --- CASTLE WALL CHECK ---
    if (gameState.mapMode === 'castle' && (newTile === '▓' || newTile === '▒' || newTile === ' ')) {
        logMessage("{gray:You bump into the castle wall.}");
        return;
    }

    if (tileData && tileData.type === 'shrine') {
        const tileId = `${newX},${-newY}`;
        const player = gameState.player;
        let shrineUsed = false;

        if (gameState.lootedTiles.has(tileId)) {
            logMessage("{gray:The shrine's power is spent.}");
            return;
        }

        loreTitle.textContent = "An Ancient Shrine";
        loreContent.innerHTML = `
            <p>The shrine hums with a faint energy. You feel you can ask for one boon.</p>
            <button id="shrineStr" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full shadow-md">Pray for Strength (+5 Str for 500 turns)</button>
            <button id="shrineWits" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full shadow-md">Pray for Wits (+5 Wits for 500 turns)</button>
        `;
        loreModal.classList.remove('hidden');

        document.getElementById('shrineStr').addEventListener('click', () => {
            logMessage("{green:You pray for Strength. You feel a surge of power that will last for days!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
            
            player.strengthBonus = 5;
            player.strengthBonusTurns = 500;

            playerRef.update({
                strengthBonus: 5,
                strengthBonusTurns: 500
            });
            if (typeof renderEquipment === 'function') renderEquipment();
            shrineUsed = true;

            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({
                lootedTiles: Object.fromEntries(gameState.lootedTiles)
            });
            loreModal.classList.add('hidden');
        }, {
            once: true
        });

        document.getElementById('shrineWits').addEventListener('click', () => {
            logMessage("{blue:You pray for Wits. Your mind expands with ancient knowledge!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
            
            player.witsBonus = 5;
            player.witsBonusTurns = 500;

            playerRef.update({
                witsBonus: 5,
                witsBonusTurns: 500
            });
            renderStats();

            shrineUsed = true;
            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({
                lootedTiles: Object.fromEntries(gameState.lootedTiles)
            });
            loreModal.classList.add('hidden');
        }, {
            once: true
        });

        return;
    }

    if (newTile === '⛲') {
        if (gameState.player.coins >= 50) {
            logMessage("You toss 50 gold into the well...");
            gameState.player.coins -= 50;
            
            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
            setTimeout(() => { if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 500); }, 300); // Splash

            playerRef.update({
                coins: gameState.player.coins
            });
            renderStats();
            
            const roll = Math.random();
            if (roll < 0.05) {
                // JUICE & LORE WIN: The 5% Miracle Chance
                if (Math.random() > 0.5) {
                    gameState.player.bonusMaxHealth = (gameState.player.bonusMaxHealth || 0) + 1;
                    gameState.player.maxHealth += 1;
                    logMessage("{green:Permanent Effect: +1 Max HP!}");
                    window.modifyVital('health', gameState.player.maxHealth); // Fills to max
                } else {
                    gameState.player.bonusMaxMana = (gameState.player.bonusMaxMana || 0) + 1;
                    gameState.player.maxMana += 1;
                    logMessage("{blue:Permanent Effect: +1 Max Mana!}");
                    window.modifyVital('mana', gameState.player.maxMana);
                }
            } else if (roll < 0.35) {
                logMessage("{green:...and receive a Healing Potion!}");
                
                // Inventory capacity check for the potion
                if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push({
                        templateId: '♥',
                        name: 'Healing Potion',
                        type: 'consumable',
                        quantity: 1,
                        tile: '♥',
                        effect: ITEM_DATA['♥'].effect
                    });
                    inventoryWasUpdated = true; 
                } else {
                    logMessage("{red:But your inventory is full! The potion drops to the ground.}");
                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(gameState.player.x, gameState.player.y, '♥');
                    else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] = '♥';
                    else chunkManager.castleMaps[gameState.currentCastleId][gameState.player.y][gameState.player.x] = '♥';
                    gameState.mapDirty = true;
                }
            } else if (roll < 0.7) {
                logMessage("{cyan:...and feel refreshed! (Full Heal)}");
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#22c55e', 15);
                window.modifyVital('health', gameState.player.maxHealth);
                window.modifyVital('mana', gameState.player.maxMana);
                playerRef.update({
                    health: gameState.player.health,
                    mana: gameState.player.mana
                });
            } else {
                logMessage("{gray:...splash. Nothing happens.}");
            }
            if (typeof renderInventory === 'function') renderInventory();
        } else {
            logMessage("{red:You need 50 gold to make a wish.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
        return;
    }

    // --- VOID RIFT AUTO-TELEPORT ---
    if (newTile === 'Ω') {
        const keyIndex = gameState.player.inventory.findIndex(i => i.name === 'Void Key');
        
        if (keyIndex > -1) {
            logMessage("{purple:The Void Key resonates! Reality tears open and pulls you inside!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#a855f7', 30);
            
            // Consume the key
            gameState.player.inventory[keyIndex].quantity--;
            if (gameState.player.inventory[keyIndex].quantity <= 0) {
                gameState.player.inventory.splice(keyIndex, 1);
            }
            inventoryWasUpdated = true;

            // --- TELEPORT TO VOID ---
            gameState.mapMode = 'dungeon';
            gameState.currentCaveId = `void_${newX}_${newY}`;
            gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };

            // Generate the Void
            const voidMap = chunkManager.generateCave(gameState.currentCaveId);
            gameState.currentCaveTheme = 'VOID';

            // Find entrance ('>')
            for (let y = 0; y < voidMap.length; y++) {
                const x = voidMap[y].indexOf('>');
                if (x !== -1) { gameState.player.x = x; gameState.player.y = y; break; }
            }

            // Setup enemies
            const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
            gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));

            updateRegionDisplay();
            gameState.mapDirty = true;
            render();
            syncPlayerState();
            finalizeMapTransition(); // NETWORK SYNC
            return; // Stop processing the move (player is teleported)
        } else {
            // Player does NOT have the key. Bounce them back like a wall!
            logMessage("{gray:A tear in reality. It is unstable.}");
            logMessage("{red:You need a Void Key to stabilize the passage.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; 
        }
    }

    if (newTile === '🌵') {
        logMessage("{orange:Ouch! The thorns prick you, but you grab a fruit.}");
        gameState.screenShake = 10; // Shake intensity
        if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('pierce');
        window.modifyVital('health', -1);
        
        if (gameState.player.health <= 0) return;

        if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            gameState.player.inventory.push({
                templateId: '🍐',
                name: 'Cactus Fruit',
                type: 'consumable',
                quantity: 1,
                tile: '🍐',
                effect: ITEM_DATA['🍐'].effect
            });
            inventoryWasUpdated = true; // Auto-save flag
            chunkManager.setWorldTile(newX, newY, 'D');
            if (typeof renderInventory === 'function') renderInventory();
        } else {
            logMessage("{red:Inventory full! You drop the fruit.}");
        }
        return;
    
    } else if (tileData && tileData.type === 'loot_chest') {
        
        // --- ANTI-DUPLICATION TRANSACTION ---
        const claimed = await claimWorldTile(newX, newY, newTile);

        if (!claimed) {
            logMessage("{gray:The chest has already been looted.}");
            chunkManager.setWorldTile(newX, newY, '.');
            render();
            return;
        }

        // --- MIMIC CHECK ---
        if (Math.random() < 0.10) {
            logMessage("{red:The chest lurches open... It has teeth! IT'S A MIMIC!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy'); // Bite sound

            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(newX, newY, 'M');
            } else if (gameState.mapMode === 'dungeon') {
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = 'M';
            } else {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = 'M';
            }

            gameState.screenShake = 15;
            logMessage("The Mimic bites you for 3 damage!");
            window.modifyVital('health', -3);
            
            if (gameState.player.health <= 0) return; 
            
            render();
            return;
        }

        logMessage("You pry open the chest...");
        const goldAmount = 50 + Math.floor(Math.random() * 50);
        gameState.player.coins += goldAmount;
        logMessage(`{gold:You found ${goldAmount} Gold!}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

        if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            gameState.player.inventory.push({
                templateId: '🍷',
                name: 'Elixir of Life',
                type: 'consumable',
                quantity: 1,
                tile: '🍷',
                effect: ITEM_DATA['🍷'].effect
            });
            inventoryWasUpdated = true; // Auto-save flag
            logMessage("{purple:You found an Elixir of Life!}");
        }
        chunkManager.setWorldTile(newX, newY, '.');
        playerRef.update({
            coins: gameState.player.coins,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
        });
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderStats === 'function') renderStats();
        return;

    } else if (newTile === '✴') {
        const player = gameState.player;
        const tileId = `${newX},${-newY}`;
        
        if (gameState.lootedTiles.has(tileId)) {
            logMessage("{gray:You step over a disarmed trap.}");
        } else {
            const avoidChance = Math.min(0.75, player.dexterity * 0.01);
            if (Math.random() < avoidChance) {
                logMessage("{green:You spot a spike trap and deftly avoid it, disarming it!}");
                gameState.lootedTiles.add(tileId);
                playerRef.update({
                    lootedTiles: Object.fromEntries(gameState.lootedTiles)
                });
                return;
            } else {
                logMessage("{red:You step right on a spike trap! Ouch!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('pierce');
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(newX, newY, "TRAP!", "#ef4444");

                const trapDamage = 3;
                gameState.screenShake = 10;
                gameState.lootedTiles.add(tileId);
                window.modifyVital('health', -trapDamage);

                if (player.health <= 0) return;
            }
        }
    }

    // Calculate the base stamina cost of the tile we are stepping onto
    let moveCost = (typeof TERRAIN_COST !== 'undefined' && TERRAIN_COST[newTile] !== undefined) ? TERRAIN_COST[newTile] : 1;

    // --- MOUNT EXPANSION: STAMINA & SIEGE PERKS ---
    if (gameState.player.isMounted && gameState.player.companion) {
        moveCost = 0; // Mounts take the stamina hit (free for player)
        
        const mountTile = gameState.player.companion.tile;
        
        // Siege Mounts SMASH obstacles!
        if (['Ø', '🦖', '🧌', '🐲'].includes(mountTile)) {
            if (newTile === '🏚' || newTile === '🏚️' || newTile === '🌳' || newTile === '🕸') {
                logMessage(`{orange:Your ${gameState.player.companion.name} SMASHES through the obstacle!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#d4d4d8', 15);
                
                // Clear the obstacle permanently
                if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
                else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '.';
                else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
                
                newTile = '.'; 
                tileData = TILE_DATA['.']; // Refresh interaction data
                gameState.mapDirty = true;
            }
        }
    }

    if ((newTile === '~' || newTile === '≈') && gameState.player.waterBreathingTurns > 0) {
        moveCost = 0; // Swim effortlessly
    }

    if (newTile === 'F' && gameState.player.talents && gameState.player.talents.includes('pathfinder')) {
        moveCost = 0;
        if (Math.random() < 0.05) logMessage("{green:You move swiftly through the trees.}");
    }

    if (['⛰', '🏰', 'V', '♛', '🛕', '🌋', '🕳️'].includes(newTile)) {
        moveCost = 0;
    }

    if (gameState.weather === 'storm' || gameState.weather === 'snow') {
        moveCost += 1;
    }

    let isDisembarking = false;
    let isShipDisembarking = false;

    // --- SAFE DISEMBARKING CHECK ---
    const walkableLandTiles = ['.', 'F', 'd', 'D', 'V', '🏰', '⛰', '🕍'];

    if (gameState.player.isBoating) {
        if (newTile === '~') {
            logMessage("{red:The canoe cannot survive the deep ocean waves! Turn back!}");
            return; 
        } else if (newTile === '≈') {
            moveCost = 1;
        } else if (walkableLandTiles.includes(newTile)) { // NEW: Strict land check
            isDisembarking = true;
        } else {
            logMessage("{gray:You can't beach the canoe here.}");
            return;
        }
    } else if (gameState.player.isSailing) {
        if (newTile === '~' || newTile === '≈') {
            moveCost = 0; 
        } else if (walkableLandTiles.includes(newTile)) { // NEW: Strict land check
            isShipDisembarking = true;
        } else {
            logMessage("{gray:You can't dock the ship here.}");
            return;
        }
    } else {
        if (gameState.mapMode === 'overworld') {
            const playerInventory = gameState.player.inventory;
            if (newTile === 'F' && playerInventory.some(item => item.name === 'Machete')) {
                moveCost = 0;
            }
            if (newTile === '^' && playerInventory.some(item => item.name === 'Climbing Tools')) {
                moveCost = Math.max(1, moveCost - 1);
            }
        }

        if (moveCost === Infinity) {
            if (newTile === '^' && gameState.mapMode === 'overworld') {
                const tileId = `${newX},${-newY}`;
                const seed = stringToSeed(WORLD_SEED + ':' + tileId);
                const random = Alea(seed);
                
                if (random() < 0.05) {
                    // --- Protect the XP ---
                    if (!gameState.foundLore) gameState.foundLore = new Set();
                    
                    if (!gameState.foundLore.has(`cave_discovery_${tileId}`)) {
                        logMessage("{gold:You push against the rock... and it gives way! You've found a hidden passage! (+50 XP)}");
                        grantXp(50);
                        
                        // Mark this specific cave as "found" so they never get XP for it again
                        gameState.foundLore.add(`cave_discovery_${tileId}`);
                        if (typeof playerRef !== 'undefined' && playerRef) {
                            playerRef.update({
                                foundLore: Array.from(gameState.foundLore)
                            });
                        }
                    } else {
                        logMessage("{gray:You clear away the rubble, reopening the hidden passage.}");
                    }

                    // --- GENERATE CAVE ---
                    // Note: We use a 24-hour TTL (Time To Live) so the cave entrance persists on the map
                    // for a while so they don't have to keep "bumping" it to see it.
                    chunkManager.setWorldTile(newX, newY, '⛰', 24);
                    
                    gameState.mapMode = 'dungeon';
                    gameState.currentCaveId = `cave_${newX}_${newY}`;
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };
                    
                    const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                    gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                    
                    for (let y = 0; y < caveMap.length; y++) {
                        const x = caveMap[y].indexOf('>');
                        if (x !== -1) {
                            gameState.player.x = x;
                            gameState.player.y = y;
                            break;
                        }
                    }
                    
                    const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                    gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
                    
                    logMessage("You enter the " + (CAVE_THEMES[gameState.currentCaveTheme]?.name || 'cave') + "...");
                    updateRegionDisplay();
                    gameState.mapDirty = true;
                    render();
                    syncPlayerState();
                    finalizeMapTransition(); // NETWORK SYNC
                    return;
                }
            }
            logMessage("{gray:That way is blocked.}");
            return;
        }
    }

    if (isDisembarking) {
        gameState.player.isBoating = false;
        logMessage("{gray:You beach the canoe and step onto the shore.}");
        
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(prevX, prevY, 'c');
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][prevY][prevX] = 'c';
        else chunkManager.castleMaps[gameState.currentCastleId][prevY][prevX] = 'c';
        
        playerRef.update({ isBoating: false });
    }
    // --- SHIP DISEMBARKING ---
    if (isShipDisembarking) {
        gameState.player.isSailing = false;
        logMessage("{gray:You drop anchor and step ashore.}");
        
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(prevX, prevY, '⛵');
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][prevY][prevX] = '⛵';
        else chunkManager.castleMaps[gameState.currentCastleId][prevY][prevX] = '⛵';
        
        playerRef.update({ isSailing: false });
    }

    // --- DOOR LOGIC ---
    if (newTile === '+') {
        logMessage("{gray:You open the door.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '/'); // '/' is Open Door
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '/';
        render();
        return; // Spend turn opening
    }
    if (newTile === '/') {
        // Just walk through
    }

    // --- STAIRS LOGIC (Z-AXIS) ---
    if (newTile === '<' && gameState.mapMode === 'dungeon') {
        
        // 1. Parse current floor
        const parts = gameState.currentCaveId.split('_');
        const cX = parts[1] || 0;
        const cY = parts[2] || 0;
        const currentZ = parts.length > 3 ? parseInt(parts[3]) : 1;
        
        const nextZ = currentZ + 1;
        const nextCaveId = `cave_${cX}_${cY}_${nextZ}`;
        
        logMessage(`{purple:You descend deeper into the darkness... (Floor ${nextZ})}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#a855f7', 20);

        // 2. Generate and Load the next floor
        gameState.currentCaveId = nextCaveId;
        const caveMap = chunkManager.generateCave(gameState.currentCaveId);
        gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
        
        // 3. Find the entrance (>) to spawn the player on
        for (let y = 0; y < caveMap.length; y++) {
            const x = caveMap[y].indexOf('>');
            if (x !== -1) {
                gameState.player.x = x;
                gameState.player.y = y;
                break;
            }
        }
        
        // 4. Load enemies for the new floor
        const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
        gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
        
        gameState.mapDirty = true;
        updateRegionDisplay();
        render();
        syncPlayerState();
        finalizeMapTransition(); // NETWORK SYNC
        return;
    }

    // --- STASH LOGIC ---
    if (newTile === '☒') {
        logMessage("{gray:You open your Stash Box.}");
        if (typeof openStashModal === 'function') openStashModal();
        return;
    }

    // Check special tiles
    if (tileData) {
        const tileId = `${newX},${-newY}`;

        if (tileData.type === 'journal') {
            // Pass BOTH the Map ID and the Item Tile (e.g., '📜1')
            if (typeof grantLoreDiscovery === 'function') grantLoreDiscovery(tileId, newTile); 

            loreTitle.textContent = tileData.title;
            loreContent.textContent = tileData.content;
            loreModal.classList.remove('hidden');
            return;
        }

        if (tileData.type === 'ambush_camp') {
            logMessage("{red:AMBUSH!} " + tileData.flavor);
            gameState.screenShake = 15;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();

            // Spawn 3 Bandits and 1 Chief in a ring around the player
            const spawnSpots = [[-1, -1],[1, -1], [-1, 1], [1, 1]];
            const enemiesToSpawn =['b', 'b', 'b', 'C']; // 3 grunts, 1 chief

            for (let i = 0; i < 4; i++) {
                const ex = newX + spawnSpots[i][0];
                const ey = newY + spawnSpots[i][1];
                
                // Only spawn if tile is walkable
                const t = chunkManager.getTile(ex, ey);
                if (['.', 'F', 'd', 'D'].includes(t)) {
                    const eType = enemiesToSpawn[i];
                    const enemyData = ENEMY_DATA[eType];
                    const enemyId = `overworld:${ex},${-ey}`;
                    
                    const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, ex, ey) : enemyData;
                    const newEnemy = { ...scaledStats, tile: eType, x: ex, y: ey, spawnTime: Date.now() };
                    
                    if (typeof EnemyNetworkManager !== 'undefined') {
                        rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(newEnemy);
                    }
                }
            }

            // Replace the camp tile with a Loot Chest!
            chunkManager.setWorldTile(newX, newY, '📦');
            gameState.mapDirty = true;
            render();
            return; // End the move immediately so they have to deal with the ambush
        }

        if (tileData.type === 'barrel') {
            logMessage("{orange:You smash the barrel open!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 800); // Smash sound
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(newX, newY, '#d4d4d8', 8); // Splinters

            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '.';
            else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';

            // 30% chance to drop oil (fuel)
            if (Math.random() < 0.3) {
                logMessage("{yellow:You salvage some oil. (+20 Candlelight)}");
                gameState.player.candlelightTurns += 20;
            }
            render();
            return;
        }

        if (tileData.type === 'obstacle') {
            const playerInventory = gameState.player.inventory;
            const toolName = tileData.tool;
            const hasTool = playerInventory.some(i => i.name === toolName);

            if (hasTool) {
                logMessage(`{green:You use your ${toolName} to clear the ${tileData.name}.}`);
                
                if (typeof AudioSystem !== 'undefined') {
                    if (toolName === 'Pickaxe') AudioSystem.playHit();
                    if (toolName === 'Machete') AudioSystem.playAttack('sweep');
                }

                if (tileData.name === 'Thicket' || tileData.name === 'Dead Tree') {
                    const existingWood = playerInventory.find(i => i.name === 'Wood Log');
                    if (existingWood) {
                        existingWood.quantity++;
                        logMessage("You gathered a Wood Log!");
                        inventoryWasUpdated = true;
                    } else if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                        playerInventory.push({
                            templateId: '🪵',
                            name: 'Wood Log',
                            type: 'junk',
                            quantity: 1,
                            tile: '🪵'
                        });
                        logMessage("You gathered a Wood Log!");
                        inventoryWasUpdated = true;
                    } else {
                        logMessage("{red:Inventory full! The wood is lost.}");
                    }
                } else if (toolName === 'Pickaxe') {
                    const existingStone = playerInventory.find(i => i.name === 'Stone');
                    if (existingStone) {
                        existingStone.quantity++;
                        logMessage("You gathered Stone!");
                        inventoryWasUpdated = true;
                    } else if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                        playerInventory.push({
                            templateId: '🪨',
                            name: 'Stone',
                            type: 'junk',
                            quantity: 1,
                            tile: '🪨'
                        });
                        logMessage("You gathered Stone!");
                        inventoryWasUpdated = true;
                    }
                }
                
                if (typeof triggerStatFlash === 'function') {
                    if (toolName === 'Pickaxe') triggerStatFlash(statDisplays.strength, true);
                    if (toolName === 'Machete') triggerStatFlash(statDisplays.dexterity, true);
                }

                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                    });
                }
                if (typeof renderInventory === 'function') renderInventory();

                if (newTile === '🏚' || newTile === '🏚️') {
                    const roll = Math.random();
                    let drop = null;
                    if (roll < 0.20) drop = '•';
                    else if (roll < 0.25) drop = '▲';
                    else if (roll < 0.26) drop = '💎';

                    if (drop) {
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, drop);
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = drop;
                        logMessage("{yellow:Something was hidden inside the wall!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                        render();
                        return;
                    }
                }

                let floorTile = '.';
                if (gameState.mapMode === 'dungeon') {
                    const theme = CAVE_THEMES[gameState.currentCaveTheme];
                    floorTile = theme ? theme.floor : '.';
                } else if (gameState.mapMode === 'overworld') {
                    if (newTile === '🌳') floorTile = 'F';
                    else if (newTile === '🏚') floorTile = '^';
                }

                if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, floorTile);
                else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = floorTile;
                else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';

                render();
                return;
            } else {
                logMessage(`{gray:${tileData.flavor} (Requires ${toolName})}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }
        }

        if (tileData.type === 'campsite_entrance') {
            gameState.mapMode = 'castle'; // Treat it as a safe castle internally
            gameState.currentCastleId = 'player_camp';
            
            // Save where we are in the overworld so we can exit back to it
            gameState.overworldExit = {
                x: gameState.player.x,
                y: gameState.player.y
            };
            
            // Generate the dynamic map based on your upgrades
            chunkManager.generateCampsite();
            
            // Place player on the entrance tile inside the camp
            gameState.player.x = 5; 
            gameState.player.y = 7; 
            
            gameState.instancedEnemies = [];
            gameState.friendlyNpcs = [];
            
            logMessage("{green:You enter your personal campsite.}");
            
            // EXPLORATION REWARD: Keep the Well Rested buff logic!
            if (gameState.player.strengthBonusTurns < 10) {
                gameState.player.strengthBonus = 2;
                gameState.player.strengthBonusTurns = 50;
                logMessage("{gold:The safety of the camp inspires you! (+2 Str for 50 turns)}");
                if (typeof triggerStatAnimation === 'function') triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
                if (typeof renderEquipment === 'function') renderEquipment();
                
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        strengthBonus: gameState.player.strengthBonus,
                        strengthBonusTurns: gameState.player.strengthBonusTurns
                    });
                }
            }

            if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
            gameState.mapDirty = true;
            render();
            if (typeof syncPlayerState === 'function') syncPlayerState();
            finalizeMapTransition(); // NETWORK SYNC
            return;
        }

        if (tileData.type === 'ruin') {
            if (gameState.lootedTiles.has(tileId)) {
                logMessage("{gray:These ruins have already been searched.}");
                return;
            }
            logMessage("You search the ancient shelves...");
            const allChronicles = ['📜1', '📜2', '📜3', '📜4', '📜5'];
            const playerItemTiles = gameState.player.inventory.map(i => i.tile);
            const missingChronicles = allChronicles.filter(c => !playerItemTiles.includes(c));

            if (missingChronicles.length > 0) {
                const nextChronicleKey = missingChronicles[0];
                const itemTemplate = ITEM_DATA[nextChronicleKey];

                if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push({
                        templateId: nextChronicleKey,
                        name: itemTemplate.name,
                        type: itemTemplate.type,
                        quantity: 1,
                        tile: nextChronicleKey,
                        title: itemTemplate.title,
                        content: itemTemplate.content
                    });
                    logMessage(`{purple:You found ${itemTemplate.name}!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    if (typeof grantXp === 'function') grantXp(50);

                    if (missingChronicles.length === 1) {
                        logMessage("{gold:You have collected all the Lost Chronicles!}");
                        logMessage("{blue:You feel a surge of intellect.}");
                        if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                            const reward = ITEM_DATA['👓'];
                            gameState.player.inventory.push({
                                templateId: '👓',
                                name: reward.name,
                                type: reward.type,
                                quantity: 1,
                                tile: '👓',
                                defense: reward.defense,
                                slot: reward.slot,
                                statBonuses: reward.statBonuses
                            });
                            logMessage("{purple:You found the Scholar's Spectacles!}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                        } else {
                            logMessage("{red:Your pack is full! The Spectacles drop to the floor.}");
                            // Drop the spectacles ('👓') on the ruin tile (newX, newY)
                            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(newX, newY, '👓');
                            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '👓';
                            else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '👓';
                            
                            // Un-mark the tile as looted so they can pick them up
                            let unlootTileId = (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') ? `${newX},${-newY}` : `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;
                            gameState.lootedTiles.delete(unlootTileId);
                            
                            gameState.mapDirty = true;
                            render();
                        }
                    }
                } else {
                    logMessage("{red:You found a Chronicle, but your inventory is full!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
            } else {
                logMessage("{purple:You found an Arcane Scroll.}");
                if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push({
                        templateId: '📜',
                        name: 'Scroll: Clarity',
                        type: 'spellbook',
                        quantity: 1,
                        tile: '📜',
                        spellId: 'clarity'
                    });
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                } else {
                    logMessage("{red:But your inventory is full.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
            }
            gameState.lootedTiles.add(tileId);
            if (typeof playerRef !== 'undefined' && playerRef) {
                playerRef.update({
                    lootedTiles: Object.fromEntries(gameState.lootedTiles),
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                });
            }
            if (typeof renderInventory === 'function') renderInventory();
            return;
        }

        if (tileData.type === 'lore_statue') {
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const msg = tileData.message[Math.floor(random() * tileData.message.length)];
            loreTitle.textContent = "Weathered Statue";
            loreContent.textContent = msg;
            loreModal.classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            if (!gameState.foundLore.has(tileId)) {
                if (typeof grantXp === 'function') grantXp(10);
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }
            return;
        }

        if (tileData.type === 'loot_container') {
            logMessage(`{gray:${tileData.flavor}}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 500); // Rummage sound
            let lootTable = tileData.lootTable; // Default table

            // --- Dynamic Loot Table for Generic Chests ---
            if (!lootTable || tileData.name === 'Dusty Urn' || newTile === '📦') {
                const dist = Math.sqrt(newX * newX + newY * newY);
                if (dist > 250) {
                    // High Tier + New Trade Goods (Shells, Pearls, Idols)
                    lootTable = ['$', '$', 'S', '🔮', '♥', '⚔️l', '⛓️', '💎', '🧪e', '🐚', '💎b', '🗿'];
                } else {
                    // Low Tier + Common Trade Goods (Shells, Spools)
                    lootTable = ['$', '$', '(', '†', '♥', '!', '[', '🛡️w', '🐚', '🧵'];
                }
            }
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const lootCount = 1 + Math.floor(random() * 2);

            let coinsFound = 0;

            for (let i = 0; i < lootCount; i++) {
                const itemKey = lootTable[Math.floor(random() * lootTable.length)];
                if (itemKey === '$') {
                    const amount = 5 + Math.floor(random() * 15);
                    coinsFound += amount;
                    continue;
                }
                const itemTemplate = ITEM_DATA[itemKey];
                if (itemTemplate) {
                    if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                        gameState.player.inventory.push({
                            templateId: itemKey,
                            name: itemTemplate.name,
                            type: itemTemplate.type,
                            quantity: 1,
                            tile: itemKey,
                            damage: itemTemplate.damage || null,
                            defense: itemTemplate.defense || null,
                            slot: itemTemplate.slot || null,
                            statBonuses: itemTemplate.statBonuses || null
                        });
                        logMessage(`You found: {purple:${itemTemplate.name}}`);
                    } else {
                        logMessage(`{red:You found a ${itemTemplate.name}, but your pack is full.}`);
                    }
                }
            }
            
            if (coinsFound > 0) {
                gameState.player.coins += coinsFound;
                if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                logMessage(`You found {gold:${coinsFound} gold coins.}`);
            }

            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme];
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme ? theme.floor : '.';
            }
            
            if (typeof playerRef !== 'undefined' && playerRef) {
                playerRef.update({
                    coins: gameState.player.coins,
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                });
            }
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderStats === 'function') renderStats();
            return;
        }

        if (newTile === 'B') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("{gold:You've discovered a Bounty Board! +15 XP}");
                if (typeof grantXp === 'function') grantXp(15);
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }
            if (typeof openBountyBoard === 'function') openBountyBoard();
            return;
        }

        if (newTile === '#') {
            const tileId = `${newX},${-newY}`;
            const player = gameState.player;

            // 1. Initialize array if missing
            if (!player.unlockedWaypoints) player.unlockedWaypoints = [];

            // 2. Check if already unlocked
            const existingWP = player.unlockedWaypoints.find(wp => wp.x === newX && wp.y === newY);

            if (!existingWP) {
                // New discovery!
                const regionX = Math.floor(newX / REGION_SIZE);
                const regionY = Math.floor(newY / REGION_SIZE);
                const regionName = typeof getRegionName === 'function' ? getRegionName(regionX, regionY) : "Wilderness";

                player.unlockedWaypoints.push({
                    x: newX,
                    y: newY,
                    name: regionName
                });

                logMessage("{cyan:Waystone Attuned! You can now fast travel here.}");
                if (typeof grantXp === 'function') grantXp(25);
                if (typeof triggerStatAnimation === 'function') triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue'); // Visual flair
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();

                // Save immediately
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        unlockedWaypoints: player.unlockedWaypoints
                    });
                }
            }

            // 3. Generate Lore (Keep existing flavor)
            if (!gameState.foundLore.has(tileId)) {
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }

            const elev = elevationNoise.noise(newX / 70, newY / 70);
            const moist = moistureNoise.noise(newX / 50, newY / 50);
            let loreArray = typeof LORE_PLAINS !== 'undefined' ? LORE_PLAINS : ["The stone hums with power."];
            let biomeName = "Plains";
            
            if (elev < 0.4 && moist > 0.7) {
                if (typeof LORE_SWAMP !== 'undefined') loreArray = LORE_SWAMP;
                biomeName = "Swamp";
            } else if (elev > 0.8) {
                if (typeof LORE_MOUNTAIN !== 'undefined') loreArray = LORE_MOUNTAIN;
                biomeName = "Mountain";
            } else if (moist > 0.55) {
                if (typeof LORE_FOREST !== 'undefined') loreArray = LORE_FOREST;
                biomeName = "Forest";
            } else if (elev > 0.6 && moist < 0.3) {
                if (typeof LORE_DEADLANDS !== 'undefined') loreArray = LORE_DEADLANDS;
                biomeName = "Deadlands";
            } else if (moist < 0.15) {
                if (typeof LORE_DESERT !== 'undefined') loreArray = LORE_DESERT;
                biomeName = "Desert";
            }

            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const messageIndex = Math.floor(random() * loreArray.length);
            const message = loreArray[messageIndex];

            // 4. Show Modal with Travel Button
            loreTitle.textContent = `Waystone: ${biomeName}`;
            loreContent.innerHTML = `
                <p class="italic text-gray-400 mb-4 border-l-2 border-gray-600 pl-3 leading-relaxed">"...${message}..."</p>
                <p class="text-sm">The stone hums with power. It is attuned to the leylines.</p>
                <button id="openFastTravel" style="transform: translate3d(0,0,0);" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">✨ Fast Travel (10 Mana)</button>
            `;
            loreModal.classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playHover();

            // Bind the button
            setTimeout(() => { // Timeout ensures element is in DOM
                const btn = document.getElementById('openFastTravel');
                if (btn && typeof openFastTravelModal === 'function') btn.onclick = openFastTravelModal;
            }, 0);

            return;
        }

        if (tileData.type === 'obelisk') {
            if (!gameState.foundLore.has(tileId)) {
                const existingStack = gameState.player.inventory.find(item => item.name === 'Obsidian Shard');
                if (existingStack) {
                    existingStack.quantity++;
                    logMessage("{purple:The Obelisk hums, and another shard forms in your pack.}");
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                        });
                    }
                    if (typeof renderInventory === 'function') renderInventory();
                } else if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    gameState.player.inventory.push({
                        templateId: '▲',
                        name: 'Obsidian Shard',
                        type: 'junk',
                        quantity: 1,
                        tile: '▲'
                    });
                    logMessage("{purple:The Obelisk hums, and a shard of black glass falls into your hand.}");
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory
                        });
                    }
                    if (typeof renderInventory === 'function') renderInventory();
                } else {
                    logMessage("{red:The Obelisk offers a shard, but your inventory is full!}");
                }

                if (gameState.player.mana < gameState.player.maxMana || gameState.player.psyche < gameState.player.maxPsyche) {
                    window.modifyVital('mana', gameState.player.maxMana);
                    window.modifyVital('psyche', gameState.player.maxPsyche);
                    logMessage("{cyan:The ancient stone restores your magical energy.}");
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            mana: gameState.player.mana,
                            psyche: gameState.player.psyche
                        });
                    }
                    if (typeof renderStats === 'function') renderStats();
                }

                if (typeof VISIONS_OF_THE_PAST !== 'undefined') {
                    const seed = stringToSeed(tileId);
                    const random = Alea(seed);
                    const visionIndex = Math.floor(random() * VISIONS_OF_THE_PAST.length);
                    const vision = VISIONS_OF_THE_PAST[visionIndex];
    
                    loreTitle.textContent = "Ancient Obelisk";
                    // Format the vision to use the internal color tags
                    let formattedVision = vision;
                    if (typeof escapeHtml === 'function') {
                        formattedVision = escapeHtml(vision)
                            .replace(/{purple:(.*?)}/g, '<span class="text-purple-400 font-bold">$1</span>')
                            .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>');
                    }
                    loreContent.innerHTML = `<p class="italic text-gray-300">The black stone is cold to the touch. Suddenly, the world fades away...</p><hr class="border-gray-700 my-4"><p class="font-serif leading-relaxed text-blue-100">${formattedVision}</p>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                }

                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }
            return;
        }

        if (tileData.type === 'random_journal') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("{gold:You found a scattered page! +10 XP}");
                if (typeof grantXp === 'function') grantXp(10);
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }
            if (typeof RANDOM_JOURNAL_PAGES !== 'undefined') {
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const messageIndex = Math.floor(random() * RANDOM_JOURNAL_PAGES.length);
                const message = RANDOM_JOURNAL_PAGES[messageIndex];
                
                let formattedMsg = message;
                if (typeof escapeHtml === 'function') {
                    formattedMsg = escapeHtml(message)
                        .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>')
                        .replace(/{green:(.*?)}/g, '<span class="text-green-500 font-bold">$1</span>')
                        .replace(/{blue:(.*?)}/g, '<span class="text-blue-400 font-bold">$1</span>')
                        .replace(/{gold:(.*?)}/g, '<span class="text-yellow-500 font-bold">$1</span>')
                        .replace(/{purple:(.*?)}/g, '<span class="text-purple-400 font-bold">$1</span>')
                        .replace(/{gray:(.*?)}/g, '<span class="text-gray-500">$1</span>');
                }
                
                loreTitle.textContent = "A Scattered Page";
                loreContent.innerHTML = `<p class="italic text-gray-400 mb-3">You pick up a damp, crumpled page...</p><p class="font-serif leading-relaxed">"...${formattedMsg}..."</p>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playHover();
            }
            return;
        }

        // --- NPC FALLBACKS ---
        if (newTile === 'N') {
            const npcQuestId = "goblinHeirloom";
            const questData = typeof QUEST_DATA !== 'undefined' ? QUEST_DATA[npcQuestId] : null;
            const playerQuest = gameState.player.quests[npcQuestId];
            const player = gameState.player;
            const genericVillagerId = "met_villager";
            
            if (!gameState.foundLore.has(genericVillagerId)) {
                logMessage("{gold:You meet a villager. +5 XP}");
                if (typeof grantXp === 'function') grantXp(5);
                gameState.foundLore.add(genericVillagerId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }

            if (!questData) return; // Failsafe if data is missing

            if (!playerQuest) {
                loreTitle.textContent = "Distraught Villager";
                loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">An old villager wrings their hands.</p><p class="font-serif leading-relaxed">"Oh, thank goodness! A goblin stole my family heirloom... It's all I have left. If you find it, please bring it back!"</p><button id="acceptNpcQuest" style="transform: translate3d(0,0,0);" class="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"I'll keep an eye out."</button>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                
                setTimeout(() => {
                    document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                        if (typeof acceptQuest === 'function') acceptQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, { once: true });
                }, 0);
            } else if (playerQuest.status === 'active') {
                const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
                if (hasItem) {
                    loreTitle.textContent = "Joyful Villager";
                    loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The villager's eyes go wide.</p><p class="font-serif leading-relaxed">"You found it! My heirloom! Thank you, thank you! I don't have much, but please, take this for your trouble."</p><button id="turnInNpcQuest" style="transform: translate3d(0,0,0);" class="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 animate-pulse">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    
                    setTimeout(() => {
                        document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                            if (typeof turnInQuest === 'function') turnInQuest(npcQuestId);
                            loreModal.classList.add('hidden');
                        }, { once: true });
                    }, 0);
                } else {
                    loreTitle.textContent = "Anxious Villager";
                    loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The villager looks up hopefully.</p><p class="font-serif leading-relaxed">"Any luck finding my heirloom? Those goblins are such pests..."</p><button id="closeNpcLore" style="transform: translate3d(0,0,0);" class="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    
                    setTimeout(() => {
                        document.getElementById('closeNpcLore').addEventListener('click', () => {
                            loreModal.classList.add('hidden');
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        }, { once: true });
                    }, 0);
                }
            } else if (playerQuest.status === 'completed') {
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                let rumor = "Stay safe out there.";
                if (typeof VILLAGER_RUMORS !== 'undefined' && VILLAGER_RUMORS.length > 0) {
                    rumor = VILLAGER_RUMORS[Math.floor(random() * VILLAGER_RUMORS.length)];
                }
                
                // Format the rumor to use internal color tags
                if (typeof escapeHtml === 'function') {
                    rumor = escapeHtml(rumor)
                        .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>')
                        .replace(/{green:(.*?)}/g, '<span class="text-green-500 font-bold">$1</span>')
                        .replace(/{blue:(.*?)}/g, '<span class="text-blue-400 font-bold">$1</span>')
                        .replace(/{gold:(.*?)}/g, '<span class="text-yellow-500 font-bold">$1</span>')
                        .replace(/{purple:(.*?)}/g, '<span class="text-purple-400 font-bold">$1</span>')
                        .replace(/{orange:(.*?)}/g, '<span class="text-orange-400 font-bold">$1</span>')
                        .replace(/{cyan:(.*?)}/g, '<span class="text-cyan-400 font-bold">$1</span>')
                        .replace(/{gray:(.*?)}/g, '<span class="text-gray-400">$1</span>');
                }

                loreTitle.textContent = "Grateful Villager";
                loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The villager smiles warmly.</p><p class="font-serif leading-relaxed">"Thank you again for your help, adventurer. By the way..."</p><p class="mt-4 border-l-2 border-blue-500 pl-3 py-1 bg-black bg-opacity-20 text-blue-100 rounded-r">"${rumor}"</p><button id="closeNpcLore" style="transform: translate3d(0,0,0);" class="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"Good to know."</button>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                
                setTimeout(() => {
                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    }, { once: true });
                }, 0);
            }
            return;
        }

        if (newTile === '🎖️') {
            const questId = "banditChief";
            const playerQuest = gameState.player.quests[questId];

            if (!playerQuest) {
                loreTitle.textContent = "Captain of the Guard";
                loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The Captain looks grim.</p><p class="font-serif leading-relaxed">"The Bandit Chief has grown too bold. He's holed up in a fortress nearby. I need someone expendable—err, brave—to take him out."</p><button id="acceptGuard" style="transform: translate3d(0,0,0);" class="mt-4 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"Consider it done."</button>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                
                setTimeout(() => {
                    document.getElementById('acceptGuard').addEventListener('click', () => {
                        if (typeof acceptQuest === 'function') acceptQuest(questId);
                        loreModal.classList.add('hidden');
                    }, { once: true });
                }, 0);
                return;
            } else if (playerQuest.status === 'active') {
                if (playerQuest.kills >= 1) {
                    loreTitle.textContent = "Impressed Captain";
                    loreContent.innerHTML = `<p class="font-serif leading-relaxed">"They say the Chief is dead? Ha! I knew you had it in you. Take this blade, you've earned it."</p><button id="turnInGuard" style="transform: translate3d(0,0,0);" class="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 animate-pulse">"Thanks. (Complete)"</button>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    
                    setTimeout(() => {
                        document.getElementById('turnInGuard').addEventListener('click', () => {
                            if (typeof turnInQuest === 'function') turnInQuest(questId);
                            loreModal.classList.add('hidden');
                        }, { once: true });
                    }, 0);
                    return;
                } else {
                    logMessage("{gray:The Captain nods. 'Bring me the Chief's head.'}");
                }
            } else {
                const msgs = ["The roads are safer thanks to you.", "Stay sharp out there.", "Move along, citizen."];
                logMessage(`{gray:Guard: "${msgs[Math.floor(Math.random() * msgs.length)]}"}`);
            }
            return;
        }

        if (newTile === 'O') {
            const tileId = (gameState.mapMode === 'overworld') ?
                `${newX},${-newY}` :
                `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;

            if (!gameState.foundLore.has(tileId)) {
                logMessage("{gold:You listen to the Sage's ramblings. +10 XP}");
                if (typeof grantXp === 'function') grantXp(10);
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }

            let message = "The Void watches.";
            if (typeof LORE_STONE_MESSAGES !== 'undefined' && LORE_STONE_MESSAGES.length > 0) {
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const messageIndex = Math.floor(random() * LORE_STONE_MESSAGES.length);
                message = LORE_STONE_MESSAGES[messageIndex];
            }
            
            loreTitle.textContent = "Sage";
            loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The old Sage is staring at a tapestry, muttering to themself.</p><p class="font-serif leading-relaxed text-blue-200">"...yes, yes... ${message}..."</p>`;
            loreModal.classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            return;
        }

        if (newTile === 'T') {
            const tileId = (gameState.mapMode === 'overworld') ?
                `${newX},${-newY}` :
                `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;

            if (!gameState.foundLore.has(tileId)) {
                if (typeof grantXp === 'function') grantXp(15);
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }
            if (typeof openSkillTrainerModal === 'function') openSkillTrainerModal();
            return;
        }

        if (newTile === 'K') {
            const npcQuestId = "goblinTrophies";
            const questData = typeof QUEST_DATA !== 'undefined' ? QUEST_DATA[npcQuestId] : null;
            const playerQuest = gameState.player.quests[npcQuestId];
            const player = gameState.player;
            const genericProspectorId = "met_prospector";
            
            if (!gameState.foundLore.has(genericProspectorId)) {
                logMessage("{gold:You meet a Lost Prospector. +5 XP}");
                if (typeof grantXp === 'function') grantXp(5);
                gameState.foundLore.add(genericProspectorId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }
            
            if (!questData) return;

            if (!playerQuest) {
                loreTitle.textContent = "Frustrated Prospector";
                loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">A grizzled prospector, muttering to themself, jumps as you approach.</p><p class="font-serif leading-relaxed">"Goblins! I hate 'em! Always stealing my supplies, leaving these... these *totems* everywhere. Say, if you're clearing 'em out, bring me 10 of those Goblin Totems. I'll make it worth your while!"</p><button id="acceptNpcQuest" style="transform: translate3d(0,0,0);" class="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"I'll see what I can do."</button>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                
                setTimeout(() => {
                    document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                        if (typeof acceptQuest === 'function') acceptQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, { once: true });
                }, 0);
            } else if (playerQuest.status === 'active') {
                const itemInInv = player.inventory.find(item => item.name === questData.itemNeeded);
                const hasItems = itemInInv && itemInInv.quantity >= questData.needed;
                if (hasItems) {
                    loreTitle.textContent = "Surprised Prospector";
                    loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The prospector's eyes go wide as you show him the totems.</p><p class="font-serif leading-relaxed">"Ha! You actually did it! That'll teach 'em. Here, as promised. This is for your trouble."</p><button id="turnInNpcQuest" style="transform: translate3d(0,0,0);" class="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 animate-pulse">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    
                    setTimeout(() => {
                        document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                            if (typeof turnInQuest === 'function') turnInQuest(npcQuestId);
                            loreModal.classList.add('hidden');
                        }, { once: true });
                    }, 0);
                } else {
                    const needed = questData.needed - (itemInInv ? itemInInv.quantity : 0);
                    loreTitle.textContent = "Impatient Prospector";
                    loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The prospector looks up.</p><p class="font-serif leading-relaxed">"Back already? You still need to find ${needed} more ${questData.itemNeeded}s. Get a move on!"</p><button id="closeNpcLore" style="transform: translate3d(0,0,0);" class="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    
                    setTimeout(() => {
                        document.getElementById('closeNpcLore').addEventListener('click', () => {
                            loreModal.classList.add('hidden');
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        }, { once: true });
                    }, 0);
                }
            } else if (playerQuest.status === 'completed') {
                loreTitle.textContent = "Grateful Prospector";
                loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">The prospector nods at you.</p><p class="font-serif leading-relaxed">"Thanks again for your help, adventurer. The caves are a little quieter... for now."</p><button id="closeNpcLore" style="transform: translate3d(0,0,0);" class="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"You're welcome."</button>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                
                setTimeout(() => {
                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    }, { once: true });
                }, 0);
            }
            return;
        }

        if (newTile === '§') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("{gray:The General Store is closed. A sign reads: 'Open 6 AM - 8 PM'.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            // Discovery XP Logic
            const tileId = `${newX},${-newY}`; 
            if (!gameState.foundLore.has(tileId)) {
                logMessage("{gold:You've discovered a General Store! +15 XP}");
                if (typeof grantXp === 'function') grantXp(15);
                gameState.foundLore.add(tileId);
                if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
            }

            // --- NEW SHOP PERSISTENCE LOGIC ---
            let contextId = "overworld";
            if (gameState.mapMode === 'castle') contextId = gameState.currentCastleId;
            if (gameState.mapMode === 'dungeon') contextId = gameState.currentCaveId;

            const shopId = `shop_${contextId}_${newX}_${newY}`;

            // Initialize Container if missing
            if (!gameState.shopStates) gameState.shopStates = {};

            // Check if this specific shop has been visited this session
            if (!gameState.shopStates[shopId]) {
                let template = typeof SHOP_INVENTORY !== 'undefined' ? SHOP_INVENTORY : []; 
                if (gameState.mapMode === 'castle' && typeof CASTLE_SHOP_INVENTORY !== 'undefined') template = CASTLE_SHOP_INVENTORY;

                // Deep copy to break reference to the global constant
                gameState.shopStates[shopId] = JSON.parse(JSON.stringify(template));
            }

            // Point active inventory to the persistent session state
            activeShopInventory = gameState.shopStates[shopId];

            if (gameState.mapMode === 'castle') {
                logMessage("You enter the castle emporium.");
            } else {
                logMessage("You enter the General Store.");
            }

            if (typeof renderShop === 'function') renderShop();
            const sModal = document.getElementById('shopModal');
            if (sModal) sModal.classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            return;
        }

        if (newTile === 'H') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("{gray:The Healer's cottage is dark. They must be sleeping.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            const questId = "healerSupply";
            const questData = typeof QUEST_DATA !== 'undefined' ? QUEST_DATA[questId] : null;
            const playerQuest = gameState.player.quests[questId];

            if (!questData) return; // Failsafe

            if (!playerQuest) {
                loreTitle.textContent = "Worried Healer";
                loreContent.innerHTML = `<p class="font-serif leading-relaxed">"The swamp fever is spreading, and I am out of herbs. If you can brave the swamps and bring me 5 Medicinal Herbs, I can make a cure."</p><button id="acceptHealer" style="transform: translate3d(0,0,0);" class="mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95">"I'll find them."</button>`;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                
                setTimeout(() => {
                    document.getElementById('acceptHealer').addEventListener('click', () => {
                        if (typeof acceptQuest === 'function') acceptQuest(questId);
                        loreModal.classList.add('hidden');
                    }, { once: true });
                }, 0);
                return;
            } else if (playerQuest.status === 'active') {
                const itemIndex = gameState.player.inventory.findIndex(i => i.name === 'Medicinal Herb');
                const qty = itemIndex > -1 ? gameState.player.inventory[itemIndex].quantity : 0;

                if (qty >= 5) {
                    loreTitle.textContent = "Relieved Healer";
                    loreContent.innerHTML = `<p class="font-serif leading-relaxed">"You found them! These are perfect. Here, take these potions for your trouble."</p><button id="turnInHealer" style="transform: translate3d(0,0,0);" class="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 animate-pulse">"Glad to help. (Complete)"</button>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    
                    setTimeout(() => {
                        document.getElementById('turnInHealer').addEventListener('click', () => {
                            if (typeof turnInQuest === 'function') turnInQuest(questId);
                            loreModal.classList.add('hidden');
                        }, { once: true });
                    }, 0);
                    return;
                }
            }

            const HEAL_COST = 10;
            const player = gameState.player;
            if (player.health < player.maxHealth || player.poisonTurns > 0 || player.frostbiteTurns > 0 || player.madnessTurns > 0) {
                if (player.coins >= HEAL_COST) {
                    player.coins -= HEAL_COST;
                    window.modifyVital('health', player.maxHealth);
                    
                    // Purge status effects!
                    player.poisonTurns = 0;
                    player.frostbiteTurns = 0;
                    player.madnessTurns = 0;
                    player.burnTurns = 0;
                    player.rootTurns = 0;

                    logMessage(`{green:The Healer restores your health and purges afflictions for ${HEAL_COST} gold.}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#22c55e', 20);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal();
                    
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            health: player.health,
                            coins: player.coins,
                            poisonTurns: 0,
                            frostbiteTurns: 0,
                            madnessTurns: 0,
                            burnTurns: 0,
                            rootTurns: 0
                        });
                    }
                } else {
                    logMessage(`{gray:"You need ${HEAL_COST} gold for my services," the Healer says.}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                }
            } else {
                logMessage(`{gray:"You are already perfectly healthy!" the Healer says.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            }
            if (typeof renderStats === 'function') renderStats();
            return;
        }

        switch (tileData.type) {
            case 'underworld_entrance':
                logMessage("{purple:You leap into the abyss...}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                
                // Clear surface map memory to prevent ghostly overlaps
                chunkManager.loadedChunks = {};
                chunkManager.worldState = {};
                Object.values(worldStateListeners).forEach(unsub => unsub());
                worldStateListeners = {};
                if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();

                gameState.mapMode = 'underworld';
                
                // FORCE the drop zone to be a safe floor, and stamp a rope to climb back up!
                chunkManager.setWorldTile(newX, newY, '.'); 
                chunkManager.setWorldTile(newX, newY - 1, '🪜'); 

                gameState.player.x = newX;
                gameState.player.y = newY;
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;

            case 'underworld_exit':
                logMessage("{cyan:You grab the rope and climb back to the surface.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                
                // Clear underworld map memory
                chunkManager.loadedChunks = {};
                chunkManager.worldState = {};
                Object.values(worldStateListeners).forEach(unsub => unsub());
                worldStateListeners = {};
                if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();

                gameState.mapMode = 'overworld';
                
                gameState.player.x = newX;
                gameState.player.y = newY;
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            }

        switch (tileData.type) {
            case 'workbench':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You found a workbench! +10 XP}");
                    if (typeof grantXp === 'function') grantXp(10);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                }
                if (typeof openCraftingModal === 'function') openCraftingModal('workbench');
                return;
            case 'village_entrance':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You've discovered a safe haven village! +100 XP}");
                    if (typeof grantXp === 'function') grantXp(100);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getVillageId(newX, newY);
                gameState.overworldExit = {
                    x: gameState.player.x,
                    y: gameState.player.y
                };
                chunkManager.generateCastle(gameState.currentCastleId, 'SAFE_HAVEN');
                const villageSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = villageSpawn.x;
                gameState.player.y = villageSpawn.y;
                gameState.instancedEnemies = [];
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
                logMessage("{green:You enter the peaceful village.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            case 'cooking_fire':
                logMessage("You sit by the fire. The warmth is inviting.");
                if (typeof openCraftingModal === 'function') openCraftingModal('cooking');
                return;
            case 'landmark_cave':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You stare into the abyss... and it stares back. +100 XP}");
                    if (typeof grantXp === 'function') grantXp(100);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                }
                gameState.mapMode = 'dungeon';
                gameState.currentCaveId = 'cave_landmark';
                gameState.overworldExit = {
                    x: gameState.player.x,
                    y: gameState.player.y
                };
                const epicMap = chunkManager.generateCave(gameState.currentCaveId);
                gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                for (let y = 0; y < epicMap.length; y++) {
                    const x = epicMap[y].indexOf('>');
                    if (x !== -1) {
                        gameState.player.x = x;
                        gameState.player.y = y;
                        break;
                    }
                }
                const epicEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(epicEnemies));
                logMessage("{purple:You descend into The Maw.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            case 'canoe':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You found a canoe! +10 XP}");
                    if (typeof grantXp === 'function') grantXp(10);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                    }
                }
                gameState.player.isBoating = true;
                logMessage("{blue:You get in the canoe.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 500); // Splash

                chunkManager.setWorldTile(newX, newY, getBaseTerrain(newX, newY)); 
                if (typeof playerRef !== 'undefined' && playerRef) playerRef.update({ isBoating: true });
                break;
                
            // --- SHIP EMBARKING ---
            case 'sailing_ship':
                gameState.player.isSailing = true;
                logMessage("{blue:You board the ship. The ocean is yours to conquer.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.3, 0.1, 400); // Heavy splash
                
                chunkManager.setWorldTile(newX, newY, getBaseTerrain(newX, newY)); 
                if (typeof playerRef !== 'undefined' && playerRef) playerRef.update({ isSailing: true });
                break;
            case 'dungeon_entrance':
                // --- Ensure Set exists ---
                if (!gameState.foundLore) gameState.foundLore = new Set();

                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You've discovered a cave entrance! +10 XP}");
                    if (typeof grantXp === 'function') grantXp(10);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                }
                gameState.mapMode = 'dungeon';
                gameState.currentCaveId = tileData.getCaveId(newX, newY);
                gameState.overworldExit = {
                    x: gameState.player.x,
                    y: gameState.player.y
                };
                const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                for (let y = 0; y < caveMap.length; y++) {
                    const x = caveMap[y].indexOf('>');
                    if (x !== -1) {
                        gameState.player.x = x;
                        gameState.player.y = y;
                        break;
                    }
                }
                const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
                
                logMessage("You enter the " + (CAVE_THEMES[gameState.currentCaveTheme]?.name || 'cave') + "...");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            case 'dungeon_exit':
                if (typeof exitToOverworld === 'function') exitToOverworld("You emerge back into the sunlight.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                return;
            case 'landmark_castle':
                if (!gameState.foundLore) gameState.foundLore = new Set();
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You've discovered the FORGOTTEN FORTRESS! +100 XP}");
                    if (typeof grantXp === 'function') grantXp(100);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                    }
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                chunkManager.generateCastle(gameState.currentCastleId, 'GRAND_FORTRESS');
                
                const landmarkSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = landmarkSpawn.x;
                gameState.player.y = landmarkSpawn.y;
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
                
                // --- LOAD CASTLE ENEMIES (Like the Necromancer Lord) ---
                const baseLandmarkEnemies = chunkManager.castleEnemies[gameState.currentCastleId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseLandmarkEnemies));
                
                logMessage("{red:You enter the imposing fortress...}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); // Ominous entrance
                
                updateRegionDisplay();
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            case 'castle_entrance':
                if (!gameState.foundLore) gameState.foundLore = new Set();

                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You've discovered a castle entrance! +10 XP}");
                    if (typeof grantXp === 'function') grantXp(10);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = {
                    x: gameState.player.x,
                    y: gameState.player.y
                };
                chunkManager.generateCastle(gameState.currentCastleId);
                const spawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = spawn.x;
                gameState.player.y = spawn.y;
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
                
                // --- LOAD CASTLE ENEMIES ---
                const baseCastleEnemies = chunkManager.castleEnemies[gameState.currentCastleId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseCastleEnemies));
                
                logMessage("You enter the castle grounds.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            case 'castle_exit':
                if (typeof exitToOverworld === 'function') exitToOverworld("You leave the castle.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                return;
            case 'dark_castle_entrance':
                if (!gameState.foundLore) gameState.foundLore = new Set();
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You've discovered a ruined fortress. Evil stirs within... +25 XP}");
                    if (typeof grantXp === 'function') grantXp(25);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                    }
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                
                chunkManager.generateCastle(gameState.currentCastleId);
                const darkSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = darkSpawn.x;
                gameState.player.y = darkSpawn.y;
                
                // NO GUARDS OR MERCHANTS
                gameState.friendlyNpcs = [];
                // LOAD MONSTERS
                const baseDarkEnemies = chunkManager.castleEnemies[gameState.currentCastleId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseDarkEnemies));
                
                logMessage("{red:You enter the dark fortress. Weapons drawn.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning(); // Spooky entrance
                
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                finalizeMapTransition(); // NETWORK SYNC
                return;
            case 'castle_landmark':
                // Handled above in 'landmark_castle' key but kept as safety fallback
                return;
            case 'lore':
                if (!gameState.foundLore) gameState.foundLore = new Set();
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("{gold:You've found an old signpost! +10 XP}");
                    if (typeof grantXp === 'function') grantXp(10);
                    gameState.foundLore.add(tileId);
                    if (typeof playerRef !== 'undefined' && playerRef) {
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                }
                if (Array.isArray(tileData.message)) {
                    const currentTurn = Math.floor((gameState.time.day * 1440 + gameState.time.hour * 60 + gameState.time.minute) / TURN_DURATION_MINUTES);
                    const messageIndex = currentTurn % tileData.message.length;
                    logMessage(`{gray:${tileData.message[messageIndex]}}`);
                } else {
                    logMessage(`{gray:${tileData.message}}`);
                }
        }
    }

    // 4. Handle item pickups

    const itemData = ITEM_DATA[newTile];

    // --- MAGIC ITEM GENERATION (Sparkles) ---
    if (newTile === '✨') {
        if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            const dist = Math.sqrt(newX * newX + newY * newY);
            let tier = 1;
            if (dist > 1500) tier = 5;
            else if (dist > 500) tier = 4;
            else if (dist > 250) tier = 3;
            else if (dist > 100) tier = 2;

            const newItem = typeof generateMagicItem === 'function' ? generateMagicItem(tier) : { name: 'Magic Item', type: 'junk', tile: '✨', quantity: 1 };
            gameState.player.inventory.push(newItem);
            
            // LORE/JUICE WIN: Color code the log message based on rarity
            let color = "gray";
            if (newItem._rarity === 'uncommon') color = "green";
            if (newItem._rarity === 'rare') color = "purple";
            if (newItem._rarity === 'epic' || newItem._rarity === 'legendary') color = "gold";
            
            logMessage(`You picked up a {${color}:${newItem.name}}!`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();

            inventoryWasUpdated = true;
            gameState.lootedTiles.add(tileId);

            // Clear the tile visually
            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            } else if (gameState.mapMode === 'castle') {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
            }
        } else {
            logMessage("{red:You see a sparkling item, but your inventory is full!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
    }
    // --- STANDARD ITEM PICKUP ---
    else if (itemData) {
        let isTileLooted = gameState.lootedTiles.has(tileId);
        
        function clearLootTile() {
            gameState.lootedTiles.add(tileId);
            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                chunkManager.setWorldTile(newX, newY, '.');
            } else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            } else if (gameState.mapMode === 'castle') {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
            }
            gameState.mapDirty = true; // Force redraw
        }

        if (itemData.type === 'random_lore') {
            const seed = stringToSeed(`${newX},${newY}`);
            const random = Alea(seed);
            const fragment = typeof LORE_FRAGMENTS !== 'undefined' ? LORE_FRAGMENTS[Math.floor(random() * LORE_FRAGMENTS.length)] : "A piece of paper.";
            loreTitle.textContent = "Forgotten Letter";
            loreContent.innerHTML = `<p class="italic text-gray-400 mb-2">You smooth out the paper. The handwriting is faded.</p><p class="font-serif leading-relaxed">"${fragment}"</p>`;
            loreModal.classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            clearLootTile();
            inventoryWasUpdated = true;
        }
        else if (isTileLooted) {
            logMessage(`{gray:You see where a ${itemData.name} once was...}`);
        } 
        else {
            // --- ANTI-DUPLICATION TRANSACTION ---
            const claimed = await claimWorldTile(newX, newY, newTile);

            if (!claimed) {
                logMessage("{gray:Someone else grabbed that item before you!}");
                chunkManager.setWorldTile(newX, newY, '.');
                render();
                return;
            }

            // --- INSTANT ITEMS (Gold) ---
            if (itemData.type === 'instant') {
                itemData.effect(gameState, tileId);
                clearLootTile();
                inventoryWasUpdated = true; 
                if (typeof renderStats === 'function') renderStats(); 
                if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
            }
            // HANDLE ALL PICKUPABLE ITEMS
            else {
                const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                // Allow equipment to stack now too
                const isStackable = ['junk', 'consumable', 'trade', 'ingredient', 'quest', 'lore', 'tool', 'armor', 'weapon', 'ammo'].includes(itemData.type);

                if (existingItem && isStackable) {
                    existingItem.quantity++;
                    logMessage(`You picked up a ${itemData.name}.`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Generic pickup
                    
                    inventoryWasUpdated = true;
                    clearLootTile();

                } else if (gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    
                    // Create safe object for DB (Copied from existing logic)
                    const itemForDb = {
                        templateId: newTile,
                        name: itemData.name,
                        type: itemData.type,
                        quantity: 1,
                        tile: newTile,
                        damage: itemData.damage || null,
                        defense: itemData.defense || null,
                        slot: itemData.slot || null,
                        statBonuses: itemData.statBonuses || null,
                        effect: itemData.effect || null,
                        spellId: itemData.spellId || null,
                        skillId: itemData.skillId || null,
                        stat: itemData.stat || null,
                        _rarity: itemData._rarity || null // Preserve rarity tag for borders
                    };
                    gameState.player.inventory.push(itemForDb);
                    
                    logMessage(`You picked up a ${itemData.name}.`);
                    
                    // Distinct sounds for rare items
                    if (itemForDb._rarity === 'legendary' || itemForDb._rarity === 'epic' || itemForDb._rarity === 'rare') {
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    } else {
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); 
                    }

                    inventoryWasUpdated = true;
                    clearLootTile();

                } else {
                    logMessage(`{red:You see a ${itemData.name}, but your inventory is full!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                }
            }
        }
    }

    const staminaDeficit = moveCost - gameState.player.stamina;
    if (moveCost > gameState.player.stamina && gameState.player.health <= staminaDeficit) {
        logMessage("{red:You're too tired, and pushing on would be fatal!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    if (gameState.mapMode === 'overworld') {
        const lastDist = Math.sqrt(prevX * prevX + prevY * prevY);
        const currentDist = Math.sqrt(newX * newX + newY * newY);
        
        if (lastDist < 500 && currentDist >= 500) {
            logMessage("{red:Here, the wilderness becomes untamed and deadly.}");
        } else if (lastDist >= 500 && currentDist < 500) {
            logMessage("{green:This looks familiar. You feel a bit safer.}");
        }
    }

    gameState.mapDirty = true;

    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(newX);

    // --- VISUAL FOOTSTEPS & SPLASHES ---
    if (typeof ParticleSystem !== 'undefined' && ParticleSystem.createFootstep) {
        // 1. Find the exact tile you are PUSHING OFF OF to get the correct particle color
        let prevTileChar = '.';
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            prevTileChar = chunkManager.getTile(prevX, prevY);
        } else if (gameState.mapMode === 'dungeon') {
            prevTileChar = chunkManager.caveMaps[gameState.currentCaveId]?.[prevY]?.[prevX] || '.';
        } else if (gameState.mapMode === 'castle') {
            prevTileChar = chunkManager.castleMaps[gameState.currentCastleId]?.[prevY]?.[prevX] || '.';
        }

        const isWater = (prevTileChar === '~' || prevTileChar === '≈');
        
        // 2. Context-Aware Terrain Colors!
        let particleColor = '#a8a29e'; // Default Gray Dust (Stone/Cobblestone)
        if (isWater) particleColor = '#60a5fa'; // Blue Water Splash
        else if (prevTileChar === '🌋' || prevTileChar === '🔥') particleColor = '#f97316'; // Lava/Fire Sparks
        else if (prevTileChar === '🧊' || gameState.weather === 'snow') particleColor = '#f3f4f6'; // White Snow
        else if (prevTileChar === 'F' || prevTileChar === '.') particleColor = '#4ade80'; // Kick up green grass bits!
        else if (prevTileChar === 'D') particleColor = '#facc15'; // Yellow desert sand
        else if (prevTileChar === 'd') particleColor = '#52525b'; // Dark grey ash for deadlands
        
        // 3. Spawn the particles, passing the dx/dy so they kick BACKWARDS
        ParticleSystem.createFootstep(prevX, prevY, particleColor, dx, dy, isWater ? 6 : 4);
    }

    if (gameState.player.companion) {
        gameState.player.companion.x = prevX;
        gameState.player.companion.y = prevY;
    }

    gameState.player.x = newX;
    gameState.player.y = newY;

    if (gameState.player.stamina >= moveCost) {
        if (moveCost > 0) {
            window.modifyVital('stamina', -moveCost);
            if (moveCost > 1) logMessage(`{gray:Traversing the difficult terrain costs ${moveCost} stamina.}`);
        }
    } else {
        window.modifyVital('stamina', -gameState.player.stamina); // zero out
        gameState.screenShake = 10; // Shake intensity
        logMessage(`{red:You push yourself to the limit, costing ${staminaDeficit} health!}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        window.modifyVital('health', -staminaDeficit);
    }

    if (newTile === '≈') {
        const resistChance = Math.max(0, (10 - gameState.player.endurance)) * 0.01;
        if (Math.random() < resistChance && gameState.player.poisonTurns <= 0) {
            logMessage("{green:You feel sick from the swamp's foul water. You are Poisoned!}");
            gameState.player.poisonTurns = 5;
            triggerStatFlash(statDisplays.health, false);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
    }

    if (gameState.mapMode === 'overworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
        const prevChunkX = Math.floor(prevX / chunkManager.CHUNK_SIZE);
        const prevChunkY = Math.floor(prevY / chunkManager.CHUNK_SIZE);

        // PERFORMANCE WIN: Only trigger heavy network syncs IF we crossed a chunk boundary!
        if (currentChunkX !== prevChunkX || currentChunkY !== prevChunkY) {
            // Load 3x3 chunk area around player
            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {
                    chunkManager.listenToChunkState(currentChunkX + x, currentChunkY + y);
                }
            }

            chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

            if (typeof EnemyNetworkManager !== 'undefined') {
                EnemyNetworkManager.syncChunks(gameState.player.x, gameState.player.y);
            }
        }
    }

    if (typeof passivePerceptionCheck === 'function') passivePerceptionCheck();
    if (typeof triggerAtmosphericFlavor === 'function') triggerAtmosphericFlavor(newTile);

    // --- WHISPERING RUINS ---
    // If walking near death or ancient magic, trigger a spooky event
    if (['🏛️', '🕍', '⚰️', '🕳️', 'Ω'].includes(newTile) || gameState.mapMode === 'underworld') {
        if (Math.random() < 0.08) { // 8% chance per step near these tiles
            const whispers = ["Turn back...", "We starved...", "He is watching...", "So cold...", "Why did you come here?"];
            const msg = whispers[Math.floor(Math.random() * whispers.length)];
            
            // 1. Spooky floating text right on the player
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y - 1, msg, "#a855f7");
            }
            // 2. Play a reversed, high-pitched spooky tone
            if (typeof AudioSystem !== 'undefined') {
                AudioSystem.playTone(800, 'sine', 0.8, 0.05, false, 400); // Pitch slides DOWN
            }
            logMessage(`{gray:A voice whispers on the wind: "${msg}"}`);
        }
    }
    
    // Engine Render happens automatically via game loop in script.js now,
    // but we leave this direct render call as a fallback in case frame skipping occurred.
    if (typeof render === 'function') render();

    if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
    if (typeof syncPlayerState === 'function') syncPlayerState();

    const newExploration = typeof updateExploration === 'function' ? updateExploration() : false;

    let updates = {
        x: gameState.player.x,
        y: gameState.player.y,
        health: gameState.player.health,
        stamina: gameState.player.stamina,
        coins: gameState.player.coins,
        activeTreasure: gameState.activeTreasure || null,

        weather: gameState.weather || 'clear',

        weatherState: gameState.player.weatherState || 'calm', 
        weatherIntensity: gameState.player.weatherIntensity || 0, 
        weatherDuration: gameState.player.weatherDuration || 0 
    };

    // If we found a new chunk, add it to the save list
    if (newExploration) {
        updates.exploredChunks = Array.from(gameState.exploredChunks);
    }

    if (inventoryWasUpdated) {
        updates.inventory = typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory;
        updates.lootedTiles = Object.fromEntries(gameState.lootedTiles);
        if (typeof renderInventory === 'function') renderInventory();
    }

    // Secondary chunk loading pass to ensure instanced layers (Underworld) load correctly
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);

        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                chunkManager.listenToChunkState(currentChunkX + x, currentChunkY + y);
            }
        }

        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

        if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.syncChunks(gameState.player.x, gameState.player.y);
    }

if (gameState.player.health <= 0) {
            if (typeof syncPlayerState === 'function') syncPlayerState(); 
            return; // STOP! Do not run endPlayerTurn or it will overwrite the death state!
        }

        // Pass the updates object in so Firebase actually saves your loot/exploration!
        if (typeof endPlayerTurn === 'function') endPlayerTurn(updates); 

    } catch (error) {
        console.error("🚨 Critical movement error caught! Unlocking engine to prevent deadlock:", error);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } finally {
        // GLOBAL ENGINE UNLOCK
        // Guaranteed to run whether the move succeeds, returns early, or throws a fatal error!
        isProcessingMove = false;
    }
}

function exitToOverworld(exitMessage) {
    if (gameState.overworldExit) {
        gameState.player.x = gameState.overworldExit.x;
        gameState.player.y = gameState.overworldExit.y;
    } else {
        // --- TELEPORT SAFETY FALLBACK ---
        // If we don't know where we came from, send player to spawn (0,0)
        // This prevents getting stuck in walls or oceans at dungeon coordinates (e.g. 15,15)
        logMessage("{gray:You lost your bearings in the dark...}");
        logMessage("...and found your way back to the Village.");
        gameState.player.x = 0;
        gameState.player.y = 0;
    }

    gameState.mapMode = 'overworld';
    gameState.mapDirty = true; 

    gameState.currentCaveId = null;
    gameState.currentCastleId = null;
    gameState.overworldExit = null;

    gameState.instancedEnemies = [];

    logMessage(exitMessage);
    if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
    if (typeof render === 'function') render();
    if (typeof syncPlayerState === 'function') syncPlayerState();

    // Trigger the chunk loading, enemy syncing, and Firebase saving
    finalizeMapTransition();
}

// --- END OF FILE movement.js ---
