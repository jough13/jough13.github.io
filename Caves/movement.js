// ==========================================
// MOVEMENT & MAP TRANSITIONS
// ==========================================

async function attemptMovePlayer(newX, newY) {
    // 1. Unlock input if we are just waiting (Safety fallback)
    if (newX === gameState.player.x && newY === gameState.player.y) {
        isProcessingMove = false;
        return;
    }

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
            logMessage("The gap is too tight to squeeze through.");
            return; // Stop the move immediately
        }
    }

    let newTile;

    // --- CHECK FOR LIVE ENEMIES FIRST (Combat Priority) ---
    if (gameState.mapMode === 'overworld') {
        const enemyKey = `overworld:${newX},${-newY}`;
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
    if (gameState.mapMode === 'overworld') {
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

                logMessage(`The Obelisk hums violently! (${gameState.player.obeliskProgress.length}/4 activated)`);
                ParticleSystem.createExplosion(newX, newY, '#3b82f6', 15); // Blue explosion
                AudioSystem.playMagic();

                // REWARD: Give the fragment for this specific direction
                const fragmentName = `Tablet of the ${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
                gameState.player.inventory.push(
                    // Lookup item from ITEM_DATA using the name map logic or hardcode keys
                    {
                        name: fragmentName,
                        type: 'junk',
                        quantity: 1,
                        tile: '🧩'
                    }
                );
                logMessage(`A stone fragment falls from the obelisk: ${fragmentName}`);

                // Save progress
                playerRef.update({
                    obeliskProgress: gameState.player.obeliskProgress,
                    inventory: gameState.player.inventory
                });
            } else {
                logMessage("This obelisk is already active.");
            }
        }
        // Wrong order? Reset!
        else if (!gameState.player.obeliskProgress.includes(dir)) {
            logMessage("The Obelisk shrieks! A shockwave knocks you back!");
            logMessage("{red:PUZZLE FAILED. Sequence Reset.}");

            gameState.player.health -= 5;
            gameState.player.obeliskProgress = []; // Reset

            triggerStatFlash(statDisplays.health, false);
            playerRef.update({
                health: gameState.player.health,
                obeliskProgress: []
            });

            // Punishment damage visual
            ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ef4444', 10);
        }
        return;
    }

    if (tileData && tileData.type === 'spirit_npc') {
        const requiredItem = tileData.requiresItem;
        const hasItem = gameState.player.inventory.some(i => i.name === requiredItem);

        if (!hasItem) {
            logMessage(tileData.invisibleMessage || "You shiver.");
            gameState.player.x = newX;
            gameState.player.y = newY;
            gameState.mapDirty = true;
            AudioSystem.playStep();
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
            logMessage("You insert the Ancient Key. The massive doors grind open...");
            // Teleport to a special Vault Dungeon ID
            gameState.mapMode = 'dungeon';
            gameState.currentCaveId = 'vault_kings_treasure';
            gameState.currentCaveTheme = 'GOLDEN'; // Make sure this theme exists in data-maps

            // Generate the Vault
            chunkManager.generateCave(gameState.currentCaveId);

            // Move player
            gameState.player.x = 10; // Arbitrary safe spot in your gen logic
            gameState.player.y = 10;

            updateRegionDisplay();
            render();
            syncPlayerState();
        } else {
            logMessage("The door is sealed tight. There is a keyhole shaped like four joined stone fragments.");
        }
        return;
    }

    // 3. Obsolete Tile Cleanup
    const obsoleteTiles = [];
    if (obsoleteTiles.includes(newTile)) {
        logMessage("You clear away remnants of an older age.");
        chunkManager.setWorldTile(newX, newY, '.');
    }

    // 4. Overlay Collision Check
    if (gameState.mapMode === 'overworld') {
        const enemyKey = `overworld:${newX},${-newY}`;
        const overlayEnemy = gameState.sharedEnemies[enemyKey];

        if (overlayEnemy) {
            // Check if this is a valid enemy
            if (ENEMY_DATA[overlayEnemy.tile]) {
                // Valid enemy: Override tile to trigger combat
                newTile = overlayEnemy.tile;
                // Update tileData in case the enemy tile has interaction data (rare, but safe)
                tileData = TILE_DATA[newTile];
            } else {
                // Invalid "Ghost" enemy logic
                logMessage("Dissipating a phantom signal...");

                // 1. Delete from DB and Local State
                rtdb.ref(`worldEnemies/${enemyKey}`).remove();
                delete gameState.sharedEnemies[enemyKey];

                // 2. Reset the destination tile to the actual terrain
                // This allows the player to walk onto the tile immediately
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
            logMessage("You emerge from the shadows.");
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
                    logMessage(`Your ${equippedWeapon.name} surges with power!`);
                    const spellId = equippedWeapon.onHit;
                    const spellData = SPELL_DATA[spellId];
                    const procDmg = spellData.baseDamage + (gameState.player.wits * 0.5);
                    applySpellDamage(newX, newY, procDmg, spellId);
                }

                AudioSystem.playAttack();

                // Log & Effects
                if (isCrit) {
                    logMessage(`CRITICAL HIT! You strike the ${enemy.name} for ${playerDamage} damage!`);
                    ParticleSystem.createExplosion(newX, newY, '#facc15');
                    ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                } else {
                    logMessage(`You attack the ${enemy.name} for {red:${playerDamage}} damage!`);
                    ParticleSystem.createExplosion(newX, newY, '#ef4444');
                    ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');
                }

                // Weapon Poison Effect
                const weapon = gameState.player.equipment.weapon;
                if (weapon && weapon.inflicts === 'poison' && enemy.poisonTurns <= 0 && Math.random() < (weapon.inflictChance || 0.25)) {
                    logMessage(`Your weapon poisons the ${enemy.name}!`);
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

        } else if (gameState.mapMode === 'overworld') {
            // --- SHARED COMBAT ---
            let playerDamage = Math.max(1, rawDamage - (enemyData.defense || 0));

            if (gameState.player.level < 4 && enemyData.maxHealth <= 10) {
                const graceFloor = Math.ceil(gameState.player.strength / 2);
                playerDamage = Math.max(playerDamage, graceFloor);
            }

            AudioSystem.playAttack();

            // Look up the live entity to get the correct name (e.g. "Spectral Giant Rat")
            // instead of the base template name ("Giant Rat").
            const enemyId = `overworld:${newX},${-newY}`;
            const liveEnemy = gameState.sharedEnemies[enemyId];
            const targetName = liveEnemy ? liveEnemy.name : enemyData.name;

            if (isCrit) {
                logMessage(`CRITICAL HIT! You strike the ${targetName} for ${playerDamage} damage!`);
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                }
            } else {
                logMessage(`You attack the ${targetName} for ${playerDamage} damage!`);
            }

            isProcessingMove = true;
            await handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage);
            
            isProcessingMove = false;
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

    // --- ARCHAEOLOGY LOGIC ---
    if (newTile === '∴') {
        const hasShovel = gameState.player.inventory.some(i => i.name === 'Shovel');

        if (hasShovel) {
            logMessage("You dig into the loose soil...");

            // 1. Stamina Cost
            gameState.player.stamina = Math.max(0, gameState.player.stamina - 2);
            triggerStatFlash(statDisplays.stamina, false);

            // 2. Loot Table
            const roll = Math.random();
            let foundItem = null;

            if (roll < 0.15) {
                // 15% Chance: Trap/Enemy!
                logMessage("You disturbed a grave! A Skeleton crawls out!");
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
                // 35% Chance: Artifact
                const artifacts = ['🏺a', '🗿h', '🦴d', 'ancient_coin', 'gold_dust'];
                const key = artifacts[Math.floor(Math.random() * artifacts.length)];
                const template = ITEM_DATA[key];

                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: template.name,
                        type: template.type,
                        quantity: 1,
                        tile: template.tile || key
                    });
                    logMessage(`You unearthed a ${template.name}!`);
                    grantXp(25); // Discovery XP
                } else {
                    logMessage(`You unearthed a ${template.name}, but your inventory is full! It drops to the ground.`);
                    // Drop the artifact on the ground
                    const dropTile = template.tile || key;
                    if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, dropTile);
                    else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = dropTile;
                    else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = dropTile;
                    
                    // We don't need to delete from lootedTiles here because dig spots are consumed/turned into floor
                    gameState.mapDirty = true;
                    render();
                }
            } else {
                // 50% Chance: Just dirt/worms
                logMessage("Just dirt and rocks.");
            }

            // Clear the tile
            chunkManager.setWorldTile(newX, newY, '.');
            playerRef.update({
                inventory: getSanitizedInventory()
            });
            renderInventory();
            render();
            return; // Digging takes a turn
        } else {
            logMessage("The soil is loose here. If only you had a Shovel...");
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

        // In script.js, inside the 'if (newTile === '🎓')' block:

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

                    // Add Restored Crown (New Item)
                    inv.push({
                        name: "Crown of the First King",
                        type: "armor",
                        tile: "👑",
                        quantity: 1,
                        defense: 2, // Now offers some protection
                        slot: "armor",
                        statBonuses: {
                            charisma: 10,
                            luck: 5,
                            maxMana: 20
                        }, // GODLY STATS
                        description: "Restored to its former glory. You act with the authority of the Old World."
                    });

                    logMessage("The Historian restores the crown. It shines like the sun!");
                    triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');

                    // Save & Close
                    playerRef.update({
                        inventory: getSanitizedInventory()
                    });
                    renderInventory();
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
                if (inv.length < MAX_INVENTORY_SLOTS) {
                    inv.splice(hasShardIndex, 1);
                    player.relicQuestStage = 4;
                    grantXp(500);
                    const reward = ITEM_DATA['⚡']; // Stormbringer
                    inv.push({ ...reward,
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
                            logMessage("The Historian shares ancient secrets with you.");
                            loreModal.classList.add('hidden');
                            playerRef.update({
                                inventory: getSanitizedInventory()
                            });
                            renderInventory();
                        }
                    };
                }

                if (btnStat) {
                    btnStat.onclick = () => {
                        const currentShardIdx = gameState.player.inventory.findIndex(i => i.name === 'Memory Shard');
                        if (currentShardIdx > -1 && gameState.player.inventory[currentShardIdx].quantity >= 3) {
                            gameState.player.inventory[currentShardIdx].quantity -= 3;
                            if (gameState.player.inventory[currentShardIdx].quantity <= 0) gameState.player.inventory.splice(currentShardIdx, 1);

                            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                                // Random Stat Tome
                                const stats = ['strength', 'wits', 'constitution', 'dexterity', 'luck'];
                                const rndStat = stats[Math.floor(Math.random() * stats.length)];
                                // Create a dynamic tome based on the random stat
                                const tomeItem = {
                                    name: `Tome of ${rndStat.charAt(0).toUpperCase() + rndStat.slice(1)}`,
                                    type: 'tome',
                                    quantity: 1,
                                    tile: '📖', // Using generic book icon
                                    stat: rndStat
                                };
                                gameState.player.inventory.push(tomeItem);
                                logMessage(`Received ${tomeItem.name}!`);
                            } else {
                                logMessage("Inventory full! Shards returned.");
                                gameState.player.inventory[currentShardIdx].quantity += 3; // Refund
                            }

                            loreModal.classList.add('hidden');
                            playerRef.update({
                                inventory: getSanitizedInventory()
                            });
                            renderInventory();
                        } else {
                            logMessage("Not enough shards.");
                        }
                    };
                }
            }, 0);
        }

        // Save progress
        playerRef.update({
            relicQuestStage: player.relicQuestStage,
            inventory: getSanitizedInventory()
        });
        renderInventory();
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

        logMessage(`The ghost whispers: "${msg}"`);
        logMessage("It fades away, leaving a Memory Shard.");

        // Give Item
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            gameState.player.inventory.push({
                name: 'Memory Shard',
                type: 'junk',
                quantity: 1,
                tile: '👻'
            });
        } else {
            logMessage("Your inventory is full, the shard falls to the ground.");
            // Logic to leave it on ground is handled by not clearing tile if full? 
            // Actually, let's just clear it and say it's lost to keep it simple, or drop it.
        }

        chunkManager.setWorldTile(newX, newY, '.'); // Remove ghost
        playerRef.update({
            inventory: getSanitizedInventory()
        });
        renderInventory();
        return;
    }

    if (newTile === '?') {
        const tileId = `${newX},${-newY}`;

        // Check if already solved
        if (gameState.lootedTiles.has(tileId)) {
            logMessage("The statue stands silent. Its riddle is solved.");
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
                logMessage(riddle.message);
                gameState.player[riddle.reward]++; // Give Stat
                triggerStatAnimation(statDisplays[riddle.reward], 'stat-pulse-green');

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
                logMessage("The statue remains silent. That is not the answer.");
                gameState.player.health -= 2; // Punishment
                triggerStatFlash(statDisplays.health, false);
                loreModal.classList.add('hidden');
                renderStats();
            }
        };
        return;
    }

    if (newTile === '¥') {
        activeShopInventory = TRADER_INVENTORY;
        logMessage("You meet a Wandering Trader. 'Rare goods, for a price...'");
        renderShop();
        shopModal.classList.remove('hidden');
        return;
    }

    // --- DUNGEON WALL CHECK ---
    if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme];
        const secretWallTile = theme ? theme.secretWall : null;
        const phaseWallTile = theme ? theme.phaseWall : null;

        if (secretWallTile && newTile === secretWallTile) {
            logMessage("The wall sounds hollow... You break through!");
            chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            grantXp(15);
            render();
            return;
        }
        if (phaseWallTile && newTile === phaseWallTile) {
            logMessage("You step into the wall... and pass right through it like smoke.");
        } else if (theme && (newTile === theme.wall || newTile === ' ')) {
            logMessage("The wall is solid.");
            return;
        }
    }

    // --- CASTLE WALL CHECK ---
    if (gameState.mapMode === 'castle' && (newTile === '▓' || newTile === '▒' || newTile === ' ')) {
        logMessage("You bump into the castle wall.");
        return;
    }

    if (tileData && tileData.type === 'shrine') {
        const tileId = `${newX},${-newY}`;
        const player = gameState.player;
        let shrineUsed = false;

        if (gameState.lootedTiles.has(tileId)) {
            logMessage("The shrine's power is spent.");
            return;
        }

        loreTitle.textContent = "An Ancient Shrine";
        loreContent.innerHTML = `
            <p>The shrine hums with a faint energy. You feel you can ask for one boon.</p>
            <button id="shrineStr" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Strength (+5 Str for 500 turns)</button>
            <button id="shrineWits" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Wits (+5 Wits for 500 turns)</button>
        `;
        loreModal.classList.remove('hidden');

        document.getElementById('shrineStr').addEventListener('click', () => {
            logMessage("You pray for Strength. You feel a surge of power that will last for days!");
            player.strengthBonus = 5;
            player.strengthBonusTurns = 500;

            playerRef.update({
                strengthBonus: 5,
                strengthBonusTurns: 500
            });
            renderEquipment();
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
            logMessage("You pray for Wits. Your mind expands with ancient knowledge!");
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
            playerRef.update({
                coins: gameState.player.coins
            });
            renderStats();
            const roll = Math.random();
            if (roll < 0.3) {
                logMessage("...and receive a Healing Potion!");
                gameState.player.inventory.push({
                    name: 'Healing Potion',
                    type: 'consumable',
                    quantity: 1,
                    tile: '♥',
                    effect: ITEM_DATA['♥'].effect
                });
            } else if (roll < 0.6) {
                logMessage("...and feel refreshed! (Full Heal)");
                gameState.player.health = gameState.player.maxHealth;
                gameState.player.mana = gameState.player.maxMana;
                playerRef.update({
                    health: gameState.player.health,
                    mana: gameState.player.mana
                });
            } else {
                logMessage("...splash. Nothing happens.");
            }
            renderInventory();
        } else {
            logMessage("You need 50 gold to make a wish.");
        }
        return;
    }

    if (newTile === 'Ω') {
        logMessage("A tear in reality. It is unstable.");
        logMessage("You need a Void Key to stabilize the passage.");
    }

    if (newTile === '🌵') {
        logMessage("Ouch! The thorns prick you, but you grab a fruit.");
        gameState.player.health -= 1;
        gameState.screenShake = 10; // Shake intensity
        triggerStatFlash(statDisplays.health, false);

        if (handlePlayerDeath()) return;

        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            gameState.player.inventory.push({
                name: 'Cactus Fruit',
                type: 'consumable',
                quantity: 1,
                tile: '🍐',
                effect: ITEM_DATA['🍐'].effect
            });
            chunkManager.setWorldTile(newX, newY, 'D');
            renderInventory();
        } else {
            logMessage("Inventory full! You drop the fruit.");
        }
        return;
    } else if (tileData && tileData.type === 'loot_chest') {

        // --- MIMIC CHECK ---
        if (Math.random() < 0.10) {
            logMessage("The chest lurches open... It has teeth! IT'S A MIMIC!");

            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(newX, newY, 'M');
            } else if (gameState.mapMode === 'dungeon') {
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = 'M';
            } else {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = 'M';
            }

            gameState.player.health -= 3;
            gameState.screenShake = 10;
            triggerStatFlash(statDisplays.health, false);
            logMessage("The Mimic bites you for 3 damage!");
            render();
            return;
        }

        logMessage("You pry open the chest...");
        const goldAmount = 50 + Math.floor(Math.random() * 50);
        gameState.player.coins += goldAmount;
        logMessage(`You found ${goldAmount} Gold!`);

        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            gameState.player.inventory.push({
                name: 'Elixir of Life',
                type: 'consumable',
                quantity: 1,
                tile: '🍷',
                effect: ITEM_DATA['🍷'].effect
            });
            logMessage("You found an Elixir of Life!");
        }
        chunkManager.setWorldTile(newX, newY, '.');
        playerRef.update({
            coins: gameState.player.coins,
            inventory: gameState.player.inventory
        });
        renderInventory();
        return;
    } else if (newTile === '<') {
        const player = gameState.player;
        
        if (gameState.lootedTiles.has(tileId)) {
            logMessage("You step over a disarmed trap.");
        } else {
            const avoidChance = Math.min(0.75, player.dexterity * 0.01);
            if (Math.random() < avoidChance) {
                logMessage("You spot a spike trap and deftly avoid it, disarming it!");
                gameState.lootedTiles.add(tileId);
                playerRef.update({
                    lootedTiles: Object.fromEntries(gameState.lootedTiles)
                });
                return;
            } else {
                logMessage("You step right on a spike trap! Ouch!");
                const trapDamage = 3;
                player.health -= trapDamage;
                gameState.screenShake = 10;
                triggerStatFlash(statDisplays.health, false);
                gameState.lootedTiles.add(tileId);

                if (handlePlayerDeath()) return;
            }
        }
    }

    let moveCost = TERRAIN_COST[newTile] ?? 0;

    if ((newTile === '~' || newTile === '≈') && gameState.player.waterBreathingTurns > 0) {
        moveCost = 0; // Swim effortlessly
    }

    if (newTile === 'F' && gameState.player.talents && gameState.player.talents.includes('pathfinder')) {
        moveCost = 0;
        if (Math.random() < 0.05) logMessage("You move swiftly through the trees.");
    }

    if (['⛰', '🏰', 'V', '♛', '🕳️'].includes(newTile)) {
        moveCost = 0;
    }

    if (gameState.weather === 'storm' || gameState.weather === 'snow') {
        moveCost += 1;
    }

    let isDisembarking = false;
    let isShipDisembarking = false;

    if (gameState.player.isBoating) {
        if (newTile === '~') {
            logMessage("{red:The canoe cannot survive the deep ocean waves! Turn back!}");
            return; // Block canoe from deep water!
        } else if (newTile === '≈') {
            moveCost = 1;
        } else if (moveCost !== Infinity) {
            isDisembarking = true;
        } else {
            logMessage("You can't beach the canoe here.");
            return;
        }
    } else if (gameState.player.isSailing) {
        if (newTile === '~' || newTile === '≈') {
            moveCost = 0; // Ships move effortlessly on water
        } else if (moveCost !== Infinity) {
            isShipDisembarking = true;
        } else {
            logMessage("You can't dock the ship here.");
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
                    logMessage("You push against the rock... and it gives way! You've found a hidden passage! +50 XP");
                    grantXp(50);
                    chunkManager.setWorldTile(newX, newY, '⛰');
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
                    return;
                }
            }
            logMessage("That way is blocked.");
            return;
        }
    }

    if (isDisembarking) {
        gameState.player.isBoating = false;
        logMessage("You beach the canoe and step onto the shore.");
        
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(prevX, prevY, 'c');
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][prevY][prevX] = 'c';
        else chunkManager.castleMaps[gameState.currentCastleId][prevY][prevX] = 'c';
        
        playerRef.update({ isBoating: false });
    }
    // --- SHIP DISEMBARKING ---
    if (isShipDisembarking) {
        gameState.player.isSailing = false;
        logMessage("You drop anchor and step ashore.");
        
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(prevX, prevY, '⛵');
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][prevY][prevX] = '⛵';
        else chunkManager.castleMaps[gameState.currentCastleId][prevY][prevX] = '⛵';
        
        playerRef.update({ isSailing: false });
    }

    // --- DOOR LOGIC ---
    if (newTile === '+') {
        logMessage("You open the door.");
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '/'); // '/' is Open Door
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '/';
        render();
        return; // Spend turn opening
    }
    if (newTile === '/') {
        // Just walk through
    }

    // --- STAIRS LOGIC (Z-AXIS) ---
    if (newTile === '<') {
        if (gameState.mapMode !== 'dungeon') return;
        
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
        return;
    }

    // --- STASH LOGIC ---
    if (newTile === '☒') {
        logMessage("You open your Stash Box.");
        openStashModal();
        return;
    }

    // Check special tiles
    if (tileData) {
        console.log("Entering TileData Block. Type:", tileData.type);

        const tileId = `${newX},${-newY}`;

        if (tileData.type === 'journal') {
            // New centralized handler
            grantLoreDiscovery(tileId); // tileId is used as unique key for map locations

            // For the Codex, we also want to mark the ITEM ID as found, not just the map coordinate.
            // This requires a slight shift: tracking "Lore Item IDs" separate from "Map Coordinates".
            // For simplicity, we can assume 'grantLoreDiscovery' handles both if we pass the right ID.
            // Let's rely on ITEM_DATA keys being unique enough for now.

            // To make the set system work, we need to track the ITEM TEMPLATE ID (e.g. "📜1")
            // alongside the specific map tile coordinates.
            if (!gameState.foundCodexEntries) gameState.foundCodexEntries = new Set();
            gameState.foundCodexEntries.add(newTile); // Add "📜1"
            playerRef.update({
                foundCodexEntries: Array.from(gameState.foundCodexEntries)
            });

            loreTitle.textContent = tileData.title;
            loreContent.textContent = tileData.content;
            loreModal.classList.remove('hidden');
            return;
        }

        if (tileData.type === 'ambush_camp') {
            logMessage("{red:AMBUSH!} " + tileData.flavor);
            gameState.screenShake = 15;
            AudioSystem.playHit();

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
                    
                    const scaledStats = getScaledEnemy(enemyData, ex, ey);
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
            logMessage("You smash the barrel open!");
            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '.';
            else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';

            // 30% chance to drop oil (fuel)
            if (Math.random() < 0.3) {
                logMessage("You salvage some oil.");
                player.candlelightTurns += 20;
            }
            render();
            return;
        }

        if (tileData.type === 'obstacle') {
            const playerInventory = gameState.player.inventory;
            const toolName = tileData.tool;
            const hasTool = playerInventory.some(i => i.name === toolName);

            if (hasTool) {
                logMessage(`You use your ${toolName} to clear the ${tileData.name}.`);
                if (tileData.name === 'Thicket' || tileData.name === 'Dead Tree') {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const existingWood = playerInventory.find(i => i.name === 'Wood Log');
                        if (existingWood) existingWood.quantity++;
                        else playerInventory.push({
                            name: 'Wood Log',
                            type: 'junk',
                            quantity: 1,
                            tile: '🪵'
                        });
                        logMessage("You gathered a Wood Log!");
                        inventoryWasUpdated = true;
                    } else {
                        logMessage("Inventory full! The wood is lost.");
                    }
                } else if (toolName === 'Pickaxe') {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const existingStone = playerInventory.find(i => i.name === 'Stone');
                        if (existingStone) existingStone.quantity++;
                        else playerInventory.push({
                            name: 'Stone',
                            type: 'junk',
                            quantity: 1,
                            tile: '🪨'
                        });
                        logMessage("You gathered Stone!");
                        inventoryWasUpdated = true;
                    }
                }
                if (toolName === 'Pickaxe') triggerStatFlash(statDisplays.strength, true);
                if (toolName === 'Machete') triggerStatFlash(statDisplays.dexterity, true);

                playerRef.update({
                    inventory: getSanitizedInventory()
                });
                renderInventory();

                if (newTile === '🏚') {
                    const roll = Math.random();
                    let drop = null;
                    if (roll < 0.20) drop = '•';
                    else if (roll < 0.25) drop = '▲';
                    else if (roll < 0.26) drop = '💎';

                    if (drop) {
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, drop);
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = drop;
                        logMessage("Something was hidden inside the wall!");
                        render();
                        return;
                    }
                }

                let floorTile = '.';
                if (gameState.mapMode === 'dungeon') {
                    const theme = CAVE_THEMES[gameState.currentCaveTheme];
                    floorTile = theme.floor;
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
                logMessage(`${tileData.flavor} (Requires ${toolName})`);
                return;
            }
        }

        if (tileData.type === 'campsite') {
            logMessage("You rest at the abandoned camp...");
            gameState.player.health = gameState.player.maxHealth;
            gameState.player.stamina = gameState.player.maxStamina;
            gameState.player.mana = gameState.player.maxMana;
            gameState.player.psyche = gameState.player.maxPsyche;
            
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            
            // EXPLORATION REWARD: Campsites now give the Well Rested Buff!
            if (gameState.player.strengthBonusTurns < 10) {
                gameState.player.strengthBonus = 2;
                gameState.player.strengthBonusTurns = 50;
                logMessage("{gold:The fire warms your bones. You feel Well Rested! (+2 Str for 50 turns)}");
                triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
                renderEquipment();
            } else {
                logMessage("The fire warms your bones. You feel fully restored.");
            }

            playerRef.update({
                health: gameState.player.health,
                stamina: gameState.player.stamina,
                mana: gameState.player.mana,
                psyche: gameState.player.psyche,
                strengthBonus: gameState.player.strengthBonus,
                strengthBonusTurns: gameState.player.strengthBonusTurns
            });
        }

        if (tileData.type === 'ruin') {
            if (gameState.lootedTiles.has(tileId)) {
                logMessage("These ruins have already been searched.");
                return;
            }
            logMessage("You search the ancient shelves...");
            const allChronicles = ['📜1', '📜2', '📜3', '📜4', '📜5'];
            const playerItemTiles = gameState.player.inventory.map(i => i.tile);
            const missingChronicles = allChronicles.filter(c => !playerItemTiles.includes(c));

            if (missingChronicles.length > 0) {
                const nextChronicleKey = missingChronicles[0];
                const itemTemplate = ITEM_DATA[nextChronicleKey];

                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: itemTemplate.name,
                        type: itemTemplate.type,
                        quantity: 1,
                        tile: nextChronicleKey,
                        title: itemTemplate.title,
                        content: itemTemplate.content
                    });
                    logMessage(`You found ${itemTemplate.name}!`);
                    grantXp(50);

                    if (missingChronicles.length === 1) {
                        logMessage("You have collected all the Lost Chronicles!");
                        logMessage("You feel a surge of intellect.");
                        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                            const reward = ITEM_DATA['👓'];
                            gameState.player.inventory.push({
                                name: reward.name,
                                type: reward.type,
                                quantity: 1,
                                tile: '👓',
                                defense: reward.defense,
                                slot: reward.slot,
                                statBonuses: reward.statBonuses
                            });
                            logMessage("You found the Scholar's Spectacles!");
                        } else {
                            logMessage("Your pack is full! The Spectacles drop to the floor.");
                            // Drop the spectacles ('👓') on the ruin tile (newX, newY)
                            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '👓');
                            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '👓';
                            else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '👓';
                            
                            // Un-mark the tile as looted so they can pick them up
                            let tileId = (gameState.mapMode === 'overworld') ? `${newX},${-newY}` : `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;
                            gameState.lootedTiles.delete(tileId);
                            
                            gameState.mapDirty = true;
                            render();
                        }
                    }
                } else {
                    logMessage("You found a Chronicle, but your inventory is full!");
                    return;
                }
            } else {
                logMessage("You found an Arcane Scroll.");
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: 'Scroll: Clarity',
                        type: 'spellbook',
                        quantity: 1,
                        tile: '📜',
                        spellId: 'clarity'
                    });
                } else {
                    logMessage("But your inventory is full.");
                    return;
                }
            }
            gameState.lootedTiles.add(tileId);
            playerRef.update({
                lootedTiles: Object.fromEntries(gameState.lootedTiles),
                inventory: gameState.player.inventory
            });
            renderInventory();
            return;
        }

        if (tileData.type === 'lore_statue') {
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const msg = tileData.message[Math.floor(random() * tileData.message.length)];
            loreTitle.textContent = "Weathered Statue";
            loreContent.textContent = msg;
            loreModal.classList.remove('hidden');
            if (!gameState.foundLore.has(tileId)) {
                grantXp(10);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            return;
        }

        if (tileData.type === 'loot_container') {
            logMessage(tileData.flavor);
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

            for (let i = 0; i < lootCount; i++) {
                const itemKey = lootTable[Math.floor(random() * lootTable.length)];
                if (itemKey === '$') {
                    const amount = 5 + Math.floor(random() * 15);
                    gameState.player.coins += amount;

                    AudioSystem.playCoin();

                    logMessage(`You found ${amount} gold coins.`);
                    continue;
                }
                const itemTemplate = ITEM_DATA[itemKey];
                if (itemTemplate) {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        gameState.player.inventory.push({
                            name: itemTemplate.name,
                            type: itemTemplate.type,
                            quantity: 1,
                            tile: itemKey,
                            damage: itemTemplate.damage || null,
                            defense: itemTemplate.defense || null,
                            slot: itemTemplate.slot || null,
                            statBonuses: itemTemplate.statBonuses || null
                        });
                        logMessage(`You found: ${itemTemplate.name}`);
                    } else {
                        logMessage(`You found a ${itemTemplate.name}, but your pack is full.`);
                    }
                }
            }

            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme];
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            }
            playerRef.update({
                coins: gameState.player.coins,
                inventory: gameState.player.inventory
            });
            renderInventory();
            renderStats();
            return;
        }

        if (newTile === 'B') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've discovered a Bounty Board! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            openBountyBoard();
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
                const regionName = getRegionName(regionX, regionY);

                player.unlockedWaypoints.push({
                    x: newX,
                    y: newY,
                    name: regionName
                });

                logMessage("Waystone Attuned! You can now fast travel here.");
                grantXp(25);
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue'); // Visual flair

                // Save immediately
                playerRef.update({
                    unlockedWaypoints: player.unlockedWaypoints
                });
            }

            // 3. Generate Lore (Keep existing flavor)
            if (!gameState.foundLore.has(tileId)) {
                // grantXp(10); // Removed small XP, moved to Attunement above
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            const elev = elevationNoise.noise(newX / 70, newY / 70);
            const moist = moistureNoise.noise(newX / 50, newY / 50);
            let loreArray = LORE_PLAINS;
            let biomeName = "Plains";
            if (elev < 0.4 && moist > 0.7) {
                loreArray = LORE_SWAMP;
                biomeName = "Swamp";
            } else if (elev > 0.8) {
                loreArray = LORE_MOUNTAIN;
                biomeName = "Mountain";
            } else if (moist > 0.55) {
                loreArray = LORE_FOREST;
                biomeName = "Forest";
            }

            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const messageIndex = Math.floor(random() * loreArray.length);
            const message = loreArray[messageIndex];

            // 4. Show Modal with Travel Button
            loreTitle.textContent = `Waystone: ${biomeName}`;
            loreContent.innerHTML = `
            <p class="italic text-gray-600 mb-4">"...${message}..."</p>
            <p>The stone hums with power. It is attuned to the leylines.</p>
            <button id="openFastTravel" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full">✨ Fast Travel (10 Mana)</button>
        `;
            loreModal.classList.remove('hidden');

            // Bind the button
            setTimeout(() => { // Timeout ensures element is in DOM
                const btn = document.getElementById('openFastTravel');
                if (btn) btn.onclick = openFastTravelModal;
            }, 0);

            return;
        }

        if (tileData.type === 'obelisk') {
            if (!gameState.foundLore.has(tileId)) {
                const existingStack = gameState.player.inventory.find(item => item.name === 'Obsidian Shard');
                if (existingStack) {
                    existingStack.quantity++;
                    logMessage("The Obelisk hums, and another shard forms in your pack.");
                    playerRef.update({
                        inventory: gameState.player.inventory
                    });
                    renderInventory();
                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: 'Obsidian Shard',
                        type: 'junk',
                        quantity: 1,
                        tile: '▲'
                    });
                    logMessage("The Obelisk hums, and a shard of black glass falls into your hand.");
                    playerRef.update({
                        inventory: gameState.player.inventory
                    });
                    renderInventory();
                } else {
                    logMessage("The Obelisk offers a shard, but your inventory is full!");
                }

                if (gameState.player.mana < gameState.player.maxMana || gameState.player.psyche < gameState.player.maxPsyche) {
                    gameState.player.mana = gameState.player.maxMana;
                    gameState.player.psyche = gameState.player.maxPsyche;
                    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                    triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                    logMessage("The ancient stone restores your magical energy.");
                    playerRef.update({
                        mana: gameState.player.mana,
                        psyche: gameState.player.psyche
                    });
                    renderStats();
                }

                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const visionIndex = Math.floor(random() * VISIONS_OF_THE_PAST.length);
                const vision = VISIONS_OF_THE_PAST[visionIndex];

                loreTitle.textContent = "Ancient Obelisk";
                loreContent.textContent = `The black stone is cold to the touch. Suddenly, the world fades away...\n\n${vision}`;
                loreModal.classList.remove('hidden');

                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            return;
        }

        if (tileData.type === 'random_journal') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You found a scattered page! +10 XP");
                grantXp(10);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const messageIndex = Math.floor(random() * RANDOM_JOURNAL_PAGES.length);
            const message = RANDOM_JOURNAL_PAGES[messageIndex];
            loreTitle.textContent = "A Scattered Page";
            loreContent.textContent = `You pick up a damp, crumpled page...\n\n"...${message}..."`;
            loreModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'N') {
            const npcQuestId = "goblinHeirloom";
            const questData = QUEST_DATA[npcQuestId];
            const playerQuest = gameState.player.quests[npcQuestId];
            const player = gameState.player;
            const genericVillagerId = "met_villager";
            if (!gameState.foundLore.has(genericVillagerId)) {
                logMessage("You meet a villager. +5 XP");
                grantXp(5);
                gameState.foundLore.add(genericVillagerId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            if (!playerQuest) {
                loreTitle.textContent = "Distraught Villager";
                loreContent.innerHTML = `<p>An old villager wrings their hands.\n\n"Oh, thank goodness! A goblin stole my family heirloom... It's all I have left. If you find it, please bring it back!"</p><button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll keep an eye out."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                    acceptQuest(npcQuestId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            } else if (playerQuest.status === 'active') {
                const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
                if (hasItem) {
                    loreTitle.textContent = "Joyful Villager";
                    loreContent.innerHTML = `<p>The villager's eyes go wide.\n\n"You found it! My heirloom! Thank you, thank you! I don't have much, but please, take this for your trouble."</p><button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                        turnInQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                } else {
                    loreTitle.textContent = "Anxious Villager";
                    loreContent.innerHTML = `<p>The villager looks up hopefully.\n\n"Any luck finding my heirloom? Those goblins are such pests..."</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                }
            } else if (playerQuest.status === 'completed') {
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const rumor = VILLAGER_RUMORS[Math.floor(random() * VILLAGER_RUMORS.length)];
                loreTitle.textContent = "Grateful Villager";
                loreContent.innerHTML = `<p>The villager smiles warmly.\n\n"Thank you again for your help, adventurer. By the way..."</p><p class="italic text-sm mt-2">"${rumor}"</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Good to know."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('closeNpcLore').addEventListener('click', () => {
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            }
            return;
        }

        if (newTile === '🎖️') {
            const questId = "banditChief";
            const playerQuest = gameState.player.quests[questId];

            if (!playerQuest) {
                loreTitle.textContent = "Captain of the Guard";
                loreContent.innerHTML = `<p>The Captain looks grim.\n\n"The Bandit Chief has grown too bold. He's holed up in a fortress nearby. I need someone expendable—err, brave—to take him out."</p><button id="acceptGuard" class="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">"Consider it done."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptGuard').addEventListener('click', () => {
                    acceptQuest(questId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
                return;
            } else if (playerQuest.status === 'active') {
                if (playerQuest.kills >= 1) {
                    loreTitle.textContent = "Impressed Captain";
                    loreContent.innerHTML = `<p>"They say the Chief is dead? Ha! I knew you had it in you. Take this blade, you've earned it."</p><button id="turnInGuard" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Thanks. (Complete)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInGuard').addEventListener('click', () => {
                        turnInQuest(questId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                    return;
                } else {
                    logMessage("The Captain nods. 'Bring me the Chief's head.'");
                }
            } else {
                // Default Flavor Text if quest is done
                const msgs = ["The roads are safer thanks to you.", "Stay sharp out there.", "Move along, citizen."];
                logMessage(`Guard: "${msgs[Math.floor(Math.random() * msgs.length)]}"`);
            }
            return;
        }

        if (newTile === 'O') {
            const tileId = (gameState.mapMode === 'overworld') ?
                `${newX},${-newY}` :
                `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;

            if (!gameState.foundLore.has(tileId)) {
                logMessage("You listen to the Sage's ramblings. +10 XP");
                grantXp(10);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const messageIndex = Math.floor(random() * LORE_STONE_MESSAGES.length);
            const message = LORE_STONE_MESSAGES[messageIndex];
            loreTitle.textContent = "Sage";
            loreContent.textContent = `The old Sage is staring at a tapestry, muttering to themself.\n\n"...yes, yes... ${message}..."`;
            loreModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'T') {
            // --- Define tileId ---
            const tileId = (gameState.mapMode === 'overworld') ?
                `${newX},${-newY}` :
                `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;


            if (!gameState.foundLore.has(tileId)) {
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            openSkillTrainerModal();
            return;
        }

        if (newTile === 'K') {
            const npcQuestId = "goblinTrophies";
            const questData = QUEST_DATA[npcQuestId];
            const playerQuest = gameState.player.quests[npcQuestId];
            const player = gameState.player;
            const genericProspectorId = "met_prospector";
            if (!gameState.foundLore.has(genericProspectorId)) {
                logMessage("You meet a Lost Prospector. +5 XP");
                grantXp(5);
                gameState.foundLore.add(genericProspectorId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            if (!playerQuest) {
                loreTitle.textContent = "Frustrated Prospector";
                loreContent.innerHTML = `<p>A grizzled prospector, muttering to themself, jumps as you approach.\n\n"Goblins! I hate 'em! Always stealing my supplies, leaving these... these *totems* everywhere. Say, if you're clearing 'em out, bring me 10 of those Goblin Totems. I'll make it worth your while!"</p><button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll see what I can do."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                    acceptQuest(npcQuestId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            } else if (playerQuest.status === 'active') {
                const itemInInv = player.inventory.find(item => item.name === questData.itemNeeded);
                const hasItems = itemInInv && itemInInv.quantity >= questData.needed;
                if (hasItems) {
                    loreTitle.textContent = "Surprised Prospector";
                    loreContent.innerHTML = `<p>The prospector's eyes go wide as you show him the totems.\n\n"Ha! You actually did it! That'll teach 'em. Here, as promised. This is for your trouble."</p><button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                        turnInQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                } else {
                    const needed = questData.needed - (itemInInv ? itemInInv.quantity : 0);
                    loreTitle.textContent = "Impatient Prospector";
                    loreContent.innerHTML = `<p>The prospector looks up.\n\n"Back already? You still need to find ${needed} more ${questData.itemNeeded}s. Get a move on!"</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                }
            } else if (playerQuest.status === 'completed') {
                loreTitle.textContent = "Grateful Prospector";
                loreContent.innerHTML = `<p>The prospector nods at you.\n\n"Thanks again for your help, adventurer. The caves are a little quieter... for now."</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"You're welcome."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('closeNpcLore').addEventListener('click', () => {
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            }
            return;
        }

        if (newTile === '§') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("The General Store is closed. A sign reads: 'Open 6 AM - 8 PM'.");
                return;
            }

            // Discovery XP Logic
            const tileId = `${newX},${-newY}`; // Used for lore discovery
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've discovered a General Store! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            // --- NEW SHOP PERSISTENCE LOGIC ---

            // 1. Generate Unique Shop ID
            // We use the Map ID + Coordinates to ensure every specific shop node is unique
            let contextId = "overworld";
            if (gameState.mapMode === 'castle') contextId = gameState.currentCastleId;
            // (Dungeon shops don't exist yet, but this handles them if added)
            if (gameState.mapMode === 'dungeon') contextId = gameState.currentCaveId;

            const shopId = `shop_${contextId}_${newX}_${newY}`;

            // 2. Initialize Container if missing
            if (!gameState.shopStates) gameState.shopStates = {};

            // 3. Check if this specific shop has been visited this session
            if (!gameState.shopStates[shopId]) {
                // First visit! Clone the appropriate template.
                let template = SHOP_INVENTORY; // Default
                if (gameState.mapMode === 'castle') template = CASTLE_SHOP_INVENTORY;

                // Deep copy to break reference to the global constant
                gameState.shopStates[shopId] = JSON.parse(JSON.stringify(template));
            }

            // 4. Point active inventory to the persistent session state
            activeShopInventory = gameState.shopStates[shopId];

            if (gameState.mapMode === 'castle') {
                logMessage("You enter the castle emporium.");
            } else {
                logMessage("You enter the General Store.");
            }

            renderShop();
            shopModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'H') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("The Healer's cottage is dark. They must be sleeping.");
                return;
            }

            const questId = "healerSupply";
            const questData = QUEST_DATA[questId];
            const playerQuest = gameState.player.quests[questId];

            if (!playerQuest) {
                loreTitle.textContent = "Worried Healer";
                loreContent.innerHTML = `<p>"The swamp fever is spreading, and I am out of herbs. If you can brave the swamps and bring me 5 Medicinal Herbs, I can make a cure."</p><button id="acceptHealer" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll find them."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptHealer').addEventListener('click', () => {
                    acceptQuest(questId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
                return;
            } else if (playerQuest.status === 'active') {
                const itemIndex = gameState.player.inventory.findIndex(i => i.name === 'Medicinal Herb');
                const qty = itemIndex > -1 ? gameState.player.inventory[itemIndex].quantity : 0;

                if (qty >= 5) {
                    loreTitle.textContent = "Relieved Healer";
                    loreContent.innerHTML = `<p>"You found them! These are perfect. Here, take these potions for your trouble."</p><button id="turnInHealer" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Glad to help. (Complete)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInHealer').addEventListener('click', () => {
                        turnInQuest(questId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                    return;
                }
            }

            const HEAL_COST = 10;
            const player = gameState.player;
            if (player.health < player.maxHealth) {
                if (player.coins >= HEAL_COST) {
                    player.coins -= HEAL_COST;
                    player.health = player.maxHealth;
                    logMessage(`The Healer restores your health for ${HEAL_COST} gold.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                    playerRef.update({
                        health: player.health,
                        coins: player.coins
                    });
                } else {
                    logMessage(`"You need ${HEAL_COST} gold for my services," the Healer says.`);
                }
            } else {
                logMessage(`"You are already at full health!" the Healer says.`);
            }
            return;
        }

        switch (tileData.type) {
            case 'workbench':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You found a workbench! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                openCraftingModal('workbench');
                return;
            case 'village_entrance':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a safe haven village! +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
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
                logMessage("You enter the peaceful village.");
                updateRegionDisplay();

                gameState.mapDirty = true;

                render();
                syncPlayerState();
                return;
            case 'cooking_fire':
                logMessage("You sit by the fire. The warmth is inviting.");
                openCraftingModal('cooking');
                return;
            case 'landmark_cave':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You stare into the abyss... and it stares back. +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
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
                logMessage("You descend into The Maw.");
                updateRegionDisplay();

                gameState.mapDirty = true;

                render();
                syncPlayerState();
                return;
            case 'canoe':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You found a canoe! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.player.isBoating = true;
                logMessage("You get in the canoe.");
                chunkManager.setWorldTile(newX, newY, '.');
                playerRef.update({ isBoating: true });
                break; // <-- Make sure Canoe breaks here!
                
            // --- SHIP EMBARKING ---
            case 'sailing_ship':
                gameState.player.isSailing = true;
                logMessage("{blue:You board the ship. The ocean is yours to conquer.}");
                chunkManager.setWorldTile(newX, newY, '.'); // Remove from map
                playerRef.update({ isSailing: true });
                return; // Stop processing, we embarked
            case 'dungeon_entrance':
                // --- Ensure Set exists ---
                if (!gameState.foundLore) gameState.foundLore = new Set();

                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a cave entrance! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
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
                updateRegionDisplay();

                gameState.mapDirty = true;

                render();
                syncPlayerState();
                return;
            case 'dungeon_exit':
                exitToOverworld("You emerge back into the sunlight.");
                return;
            case 'landmark_castle':
                if (!gameState.foundLore) gameState.foundLore = new Set();
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered the FORGOTTEN FORTRESS! +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                chunkManager.generateCastle(gameState.currentCastleId, 'GRAND_FORTRESS');
                
                const landmarkSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = landmarkSpawn.x;
                gameState.player.y = landmarkSpawn.y;
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] ||[]));
                
                // --- LOAD CASTLE ENEMIES (Like the Necromancer Lord) ---
                const baseLandmarkEnemies = chunkManager.castleEnemies[gameState.currentCastleId] ||[];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseLandmarkEnemies));
                
                logMessage("You enter the imposing fortress...");
                updateRegionDisplay();
                render();
                syncPlayerState();
                return;
            case 'castle_entrance':
                if (!gameState.foundLore) gameState.foundLore = new Set();

                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a castle entrance! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
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
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] ||[]));
                
                // --- LOAD CASTLE ENEMIES ---
                const baseCastleEnemies = chunkManager.castleEnemies[gameState.currentCastleId] ||[];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseCastleEnemies));
                logMessage("You enter the castle grounds.");
                updateRegionDisplay();

                gameState.mapDirty = true;

                render();
                syncPlayerState();
                return;
            case 'castle_exit':
                exitToOverworld("You leave the castle.");
                return;
            case 'dark_castle_entrance':
                if (!gameState.foundLore) gameState.foundLore = new Set();
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a ruined fortress. Evil stirs within... +25 XP");
                    grantXp(25);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                
                chunkManager.generateCastle(gameState.currentCastleId);
                const darkSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = darkSpawn.x;
                gameState.player.y = darkSpawn.y;
                
                // NO GUARDS OR MERCHANTS
                gameState.friendlyNpcs =[];
                // LOAD MONSTERS
                const baseDarkEnemies = chunkManager.castleEnemies[gameState.currentCastleId] ||[];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseDarkEnemies));
                
                logMessage("You enter the dark fortress. Weapons drawn.");
                updateRegionDisplay();
                gameState.mapDirty = true;
                render();
                syncPlayerState();
                return;
            case 'lore':
                if (!gameState.foundLore) gameState.foundLore = new Set();
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've found an old signpost! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                if (Array.isArray(tileData.message)) {
                    const currentTurn = Math.floor((gameState.time.day * 1440 + gameState.time.hour * 60 + gameState.time.minute) / TURN_DURATION_MINUTES);
                    const messageIndex = currentTurn % tileData.message.length;
                    logMessage(tileData.message[messageIndex]);
                } else logMessage(tileData.message);
        }
    }

    // 4. Handle item pickups

    const itemData = ITEM_DATA[newTile];

    // --- MAGIC ITEM GENERATION (Sparkles) ---
    if (newTile === '✨') {
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            const dist = Math.sqrt(newX * newX + newY * newY);
            let tier = 1;
            if (dist > 500) tier = 4;
            else if (dist > 250) tier = 3;
            else if (dist > 100) tier = 2;

            const newItem = generateMagicItem(tier);
            gameState.player.inventory.push(newItem);
            logMessage(`You picked up a ${newItem.name}!`);

            inventoryWasUpdated = true;
            gameState.lootedTiles.add(tileId);

            // Clear the tile visually
            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            } else if (gameState.mapMode === 'castle') {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
            }
        } else {
            logMessage("You see a sparkling item, but your inventory is full!");
        }
    }
    // --- STANDARD ITEM PICKUP ---
    else if (itemData) {
        let isTileLooted = gameState.lootedTiles.has(tileId);
        
        function clearLootTile() {
            gameState.lootedTiles.add(tileId);
            if (gameState.mapMode === 'overworld') {
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
            const fragment = LORE_FRAGMENTS[Math.floor(random() * LORE_FRAGMENTS.length)];
            loreTitle.textContent = "Forgotten Letter";
            loreContent.textContent = `You smooth out the paper. The handwriting is faded.\n\n"${fragment}"`;
            loreModal.classList.remove('hidden');
            clearLootTile();
            inventoryWasUpdated = true;
        }
        else if (isTileLooted) {
            logMessage(`You see where a ${itemData.name} once was...`);
        } 
        else {
            // --- INSTANT ITEMS (Gold) ---
            if (itemData.type === 'instant') {
                itemData.effect(gameState, tileId);
                clearLootTile();
                inventoryWasUpdated = true; 
                renderStats(); 
                // FORCE SAVE: Prevents gold from resetting if you reload immediately
                if (typeof flushPendingSave === 'function') flushPendingSave();
            } 
            // HANDLE ALL PICKUPABLE ITEMS
            else {
                const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                // Allow equipment to stack now too
                const isStackable = ['junk', 'consumable', 'trade', 'ingredient', 'quest', 'lore', 'tool', 'armor', 'weapon'].includes(itemData.type);

                if (existingItem && isStackable) {
                    existingItem.quantity++;
                    logMessage(`You picked up a ${itemData.name}.`);
                    
                    inventoryWasUpdated = true;
                    clearLootTile();
                    
                    // FORCE SAVE IMMEDIATELY to secure the loot
                    flushPendingSave({
                        inventory: getSanitizedInventory(),
                        lootedTiles: Object.fromEntries(gameState.lootedTiles)
                    });

                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    
                    // Create safe object for DB (Copied from existing logic)
                    const itemForDb = {
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
                        stat: itemData.stat || null
                    };
                    gameState.player.inventory.push(itemForDb);
                    
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile();

                    // FORCE SAVE IMMEDIATELY to secure the loot
                    flushPendingSave({
                        inventory: getSanitizedInventory(),
                        lootedTiles: Object.fromEntries(gameState.lootedTiles)
                    });

                } else {
                    logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                }
            }
        }
    }

    const staminaDeficit = moveCost - gameState.player.stamina;
    if (moveCost > gameState.player.stamina && gameState.player.health <= staminaDeficit) {
        logMessage("You're too tired, and pushing on would be fatal!");
        return;
    }

    const prevX = gameState.player.x;
    const prevY = gameState.player.y;

    gameState.player.x = newX;
    gameState.player.y = newY;

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

    AudioSystem.playStep();

    // --- VISUAL FOOTSTEPS & SPLASHES ---
    if (typeof ParticleSystem !== 'undefined') {
        // If stepping in water, make a blue splash. Otherwise, make a gray dust puff!
        const isWater = (newTile === '~' || newTile === '≈');
        const particleColor = isWater ? '#60a5fa' : '#a8a29e'; 
        
        // Spawn the particle at the PREVIOUS tile so it looks like you kicked it up
        ParticleSystem.spawn(prevX, prevY, particleColor, 'dust', '', isWater ? 5 : 3);
    }

    if (gameState.player.companion) {
        gameState.player.companion.x = prevX;
        gameState.player.companion.y = prevY;
    }

    if (gameState.player.stamina >= moveCost) {
        gameState.player.stamina -= moveCost;
    } else {
        gameState.player.stamina = 0;
        gameState.player.health -= staminaDeficit;
        gameState.screenShake = 10; // Shake intensity
        triggerStatFlash(statDisplays.health, false);
        logMessage(`You push yourself to the limit, costing ${staminaDeficit} health!`);
    }

    if (moveCost > 0) {
        triggerStatFlash(statDisplays.stamina, false);
        logMessage(`Traversing the terrain costs ${moveCost} stamina.`);
    }

    if (newTile === '≈') {
        const resistChance = Math.max(0, (10 - gameState.player.endurance)) * 0.01;
        if (Math.random() < resistChance && gameState.player.poisonTurns <= 0) {
            logMessage("You feel sick from the swamp's foul water. You are Poisoned!");
            gameState.player.poisonTurns = 5;
        }
    }

    if (gameState.mapMode === 'overworld') {
        const playerInventory = gameState.player.inventory;
        const hasPickaxe = playerInventory.some(item => item.name === 'Pickaxe');

        if (hasPickaxe) {
            if (newTile === '^') {
                logMessage("You use your Pickaxe to chip at the rock...");
                if (Math.random() < 0.25) {
                    const existingStack = playerInventory.find(item => item.name === 'Iron Ore');
                    if (existingStack) {
                        existingStack.quantity++;
                        logMessage("...and find some Iron Ore!");
                        inventoryWasUpdated = true;
                    } else if (playerInventory.length < MAX_INVENTORY_SLOTS) {
                        playerInventory.push({
                            name: 'Iron Ore',
                            type: 'junk',
                            quantity: 1,
                            tile: '•'
                        });
                        logMessage("...and find some Iron Ore!");
                        inventoryWasUpdated = true;
                    } else {
                        logMessage("...you find ore, but your inventory is full!");
                    }
                } else {
                    logMessage("...but find nothing of value.");
                }
            } else if (gameState.activeTreasure && newX === gameState.activeTreasure.x && newY === gameState.activeTreasure.y) {
                logMessage("You dig where the map marked... clunk!");
                logMessage("You found a Buried Chest!");
                chunkManager.setWorldTile(newX, newY, '📦');
                gameState.activeTreasure = null;
                const mapIndex = playerInventory.findIndex(i => i.type === 'treasure_map');
                if (mapIndex > -1) {
                    playerInventory[mapIndex].quantity--;
                    if (playerInventory[mapIndex].quantity <= 0) playerInventory.splice(mapIndex, 1);
                    logMessage("The map crumbles to dust, its purpose fulfilled.");
                }
                inventoryWasUpdated = true;
            }
        }
    }

    passivePerceptionCheck();
    triggerAtmosphericFlavor(newTile);
    render();

    updateRegionDisplay();
    syncPlayerState();

    const newExploration = updateExploration();

    let updates = {
        x: gameState.player.x,
        y: gameState.player.y,
        health: gameState.player.health,
        stamina: gameState.player.stamina,
        coins: gameState.player.coins,
        activeTreasure: gameState.activeTreasure || null,

        weather: gameState.weather || 'clear',

        weatherState: gameState.player.weatherState || 'calm', // Default to 'calm'
        weatherIntensity: gameState.player.weatherIntensity || 0, // Default to 0
        weatherDuration: gameState.player.weatherDuration || 0 // Default to 0
    };

    // If we found a new chunk, add it to the save list
    if (newExploration) {
        updates.exploredChunks = Array.from(gameState.exploredChunks);
    }

    if (inventoryWasUpdated) {
        updates.inventory = getSanitizedInventory();
        updates.lootedTiles = Object.fromEntries(gameState.lootedTiles);
        renderInventory();
    }

    if (gameState.mapMode === 'overworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);

        // Load 3x3 chunk area around player
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                chunkManager.listenToChunkState(currentChunkX + x, currentChunkY + y);
            }
        }

        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

        if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.syncChunks(gameState.player.x, gameState.player.y);
    }

    if (gameState.player.health <= 0) {
        // Call the unified death handler (drops corpse, clears inventory, shows UI)
        if (handlePlayerDeath()) {
            syncPlayerState(); // Update multiplayer server so others see you vanish
            return; // STOP! Do not run endPlayerTurn or it will overwrite the death state!
        }
    }

    // Pass the updates object in so Firebase actually saves your loot/exploration!
    endPlayerTurn(updates); 
}

function exitToOverworld(exitMessage) {
    if (gameState.overworldExit) {
        gameState.player.x = gameState.overworldExit.x;
        gameState.player.y = gameState.overworldExit.y;
    } else {
        // --- TELEPORT SAFETY FALLBACK ---
        // If we don't know where we came from, send player to spawn (0,0)
        // This prevents getting stuck in walls or oceans at dungeon coordinates (e.g. 15,15)
        logMessage("You lost your bearings in the dark...");
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
    updateRegionDisplay();
    render();
    syncPlayerState();

    const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
    const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
    chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
}
