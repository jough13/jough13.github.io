/**
 * Handles all skill logic based on SKILL_DATA
 * and the player's skillbook.
 * @param {string} skillId - The ID of the skill to use (e.g., "brace").
 */

function useSkill(skillId) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId]; 

    if (!skillData) {
        logMessage("Unknown skill. (No skill data found)");
        return;
    }

    if (player.cooldowns && player.cooldowns[skillId] > 0) {
        logMessage(`That skill is not ready yet (${player.cooldowns[skillId]} turns).`);
        return;
    }

    const skillLevel = player.skillbook[skillId] || 0; 

    // Ranged attack is an innate skill granted by equipping a bow, no level needed
    if (skillLevel === 0 && skillId !== 'ranged_attack') {
        logMessage("You don't know that skill.");
        return;
    }

    // --- 1. Check Player Level Requirement ---
    if (player.level < skillData.requiredLevel) {
        logMessage(`You must be Level ${skillData.requiredLevel} to use this skill.`);
        return;
    }

    // --- 2. Check Resource Cost ---
    const cost = skillData.cost;
    const costType = skillData.costType; 

    if (player[costType] < cost) {
        logMessage(`You don't have enough ${costType} to use that.`);
        return; 
    }

    // --- 3. Handle Targeting ---
    if (skillData.target === 'aimed') {
        // --- Aimed Skills (e.g., Lunge) ---
        // Cost is checked, but *not* deducted. execute functions will deduct it.
        gameState.isAiming = true;
        gameState.abilityToAim = skillId; 
        skillModal.classList.add('hidden');
        logMessage(`${skillData.name}: Press an arrow key or WASD to use. (Esc) to cancel.`);
        return; 

    } else if (skillData.target === 'self') {
        // --- Self-Cast Skills (e.g., Brace) ---
        player[costType] -= cost; 
        let skillUsedSuccessfully = false;

        // --- 4. Execute Skill Effect ---
        switch (skillId) {
            case 'brace':
                if (player.defenseBonusTurns > 0) {
                    logMessage("You are already bracing!");
                    break;
                }
                const defenseBonus = Math.floor(skillData.baseDefense + (player.constitution * 0.5 * skillLevel));
                player.defenseBonus = defenseBonus;
                player.defenseBonusTurns = skillData.duration;

                logMessage(`You brace for impact, gaining +${defenseBonus} Defense!`);

                playerRef.update({
                    defenseBonus: player.defenseBonus,
                    defenseBonusTurns: player.defenseBonusTurns
                });
                skillUsedSuccessfully = true;
                break;

            case 'channel':
                const manaGain = 5 + (player.wits * 2);
                player.mana = Math.min(player.maxMana, player.mana + manaGain);
                logMessage(`You channel energy... +${manaGain} Mana.`);
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                skillUsedSuccessfully = true;
                break;

            case 'deflect':
                player.thornsValue = 100; // Reflect huge damage
                player.thornsTurns = 1;   // Only for the very next turn/hit
                logMessage("You raise your blade, ready to deflect the next blow.");
                skillUsedSuccessfully = true;
                break;

            case 'vanish':
                player.stealthTurns = skillData.duration;
                logMessage("You throw a smoke bomb and vanish from sight!");
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#9ca3af', 15);
                playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;

            case 'stealth':
                player.stealthTurns = skillData.duration;
                logMessage("You fade into the shadows... (Invisible)");
                playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;
                
            case 'adrenaline':
                const stamGain = 10;
                player.stamina = Math.min(player.maxStamina, player.stamina + stamGain);
                logMessage("You push past the pain! (+10 Stamina)");
                triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
                skillUsedSuccessfully = true;
                break;

            // WHIRLWIND ---
            case 'whirlwind':
                logMessage("You spin in a deadly vortex!");
                let hitCount = 0;
                const baseDmg = (player.strength + player.dexterity) * skillLevel;

                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue; 
                        const tx = player.x + x;
                        const ty = player.y + y;

                        if (gameState.mapMode === 'overworld') {
                            const enemyId = `overworld:${tx},${-ty}`;
                            const liveEnemy = gameState.sharedEnemies[enemyId];
                            const tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(tx, ty);
                            
                            const enemyData = ENEMY_DATA[tile];
                            if (enemyData) {
                                const finalDmg = Math.max(1, baseDmg - (enemyData.defense || 0));
                                handleOverworldCombat(tx, ty, enemyData, tile, finalDmg);
                                hitCount++;
                            }
                        } else {
                            let enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
                            if (enemy) {
                                const finalDmg = Math.max(1, baseDmg - (enemy.defense || 0));
                                enemy.health -= finalDmg;
                                logMessage(`Whirlwind hits ${enemy.name} for ${finalDmg}!`);
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, '#fff', 3);
                                hitCount++;

                                if (enemy.health <= 0) {
                                    logMessage(`${enemy.name} is slain!`);
                                    registerKill(enemy);
                                    
                                    const droppedLoot = generateEnemyLoot(gameState.player, enemy);
                                    let map = gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                                    map[ty][tx] = droppedLoot || '.';
                                    
                                    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                                    if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                                        chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                                    }
                                }
                            }
                        }

                    }
                }

                if (hitCount === 0) logMessage("You whirl through empty air.");
                skillUsedSuccessfully = true;
                break;
        }

        // --- 5. Finalize Self-Cast Turn ---
        if (skillUsedSuccessfully) {
            playerRef.update({ [costType]: player[costType] }); 
            triggerStatFlash(statDisplays.stamina, false); 
            skillModal.classList.add('hidden');
            triggerAbilityCooldown(skillId);
            endPlayerTurn();
            renderEquipment(); 
        } else {
            // Refund stamina if skill failed 
            player[costType] += cost;
        }
    }
}

async function executeMeleeSkill(skillId, dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId];
    const skillLevel = player.skillbook[skillId] || 1;

    let hit = false;

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // Calculate Damage
        const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
        const playerStrength = player.strength + (player.strengthBonus || 0);

        let rawPower = playerStrength + weaponDamage;

        // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
        rawPower = getPlayerDamageModifier(rawPower);

        const baseDmg = rawPower * skillData.baseDamageMultiplier;
        const finalDmg = Math.max(1, Math.floor(baseDmg + (player.strength * 0.5 * skillLevel)));

        // Target Logic
        const targetX = player.x + dirX;
        const targetY = player.y + dirY;

        let enemiesToHit = [{ x: targetX, y: targetY }];

        // If Cleave, add side targets
        if (skillId === 'cleave') {
            if (dirX !== 0) { 
                enemiesToHit.push({ x: targetX, y: targetY - 1 });
                enemiesToHit.push({ x: targetX, y: targetY + 1 });
            } else { 
                enemiesToHit.push({ x: targetX - 1, y: targetY });
                enemiesToHit.push({ x: targetX + 1, y: targetY });
            }
        }

        for (const coords of enemiesToHit) {
            let tile;
            let map;
            if (gameState.mapMode === 'dungeon') {
                map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[coords.y]) ? map[coords.y][coords.x] : ' ';
            } else if (gameState.mapMode === 'castle') {
                map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[coords.y]) ? map[coords.y][coords.x] : ' ';
            } else {
                // --- Check for LIVE moving enemies first! ---
                const enemyId = `overworld:${coords.x},${-coords.y}`;
                const liveEnemy = gameState.sharedEnemies[enemyId];
                tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(coords.x, coords.y);
            }

            const enemyData = ENEMY_DATA[tile];
            if (enemyData) {

                if (player.stealthTurns > 0) {
                    player.stealthTurns = 0;
                    logMessage("You emerge from the shadows!");
                    playerRef.update({ stealthTurns: 0 });
                }

                hit = true;

                // Apply Damage
                if (gameState.mapMode === 'overworld') {
                    await handleOverworldCombat(coords.x, coords.y, enemyData, tile, finalDmg);
                } else {
                    let enemy = gameState.instancedEnemies.find(e => e.x === coords.x && e.y === coords.y);
                    if (enemy) {
                        enemy.health -= finalDmg;
                        logMessage(`You hit ${enemy.name} for ${finalDmg}!`);
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(coords.x, coords.y, '#fff', 3);

                        // APPLY STUN (Shield Bash OR Crush)
                        if (skillId === 'shieldBash' || skillId === 'crush') {
                            enemy.stunTurns = 3;
                            logMessage(`${enemy.name} is stunned!`);
                        }

                        if (enemy.health <= 0) {
                            logMessage(`You defeated ${enemy.name}!`);
                            handleInstancedEnemyDeath(enemy, coords.x, coords.y);
                        }
                    }
                }
            }
        }

        if (!hit) {
            logMessage("You swing at empty air.");
        } else {
            // Only deduct stamina if a target was actually engaged
            player[skillData.costType] -= skillData.cost;
            AudioSystem.playAttack();
        }

        triggerAbilityCooldown(skillId);
        endPlayerTurn();
        render();

    } finally {
        // --- 🚨 UNLOCK THE ENGINE ---
        isProcessingMove = false;
    }
}

/**
 * Prepares and executes a ranged attack using an equipped bow
 */

async function executeRangedAttack(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA['ranged_attack'];
    
    // --- AMMO CHECK ---
    const ammo = player.equipment.ammo;
    if (!ammo || ammo.quantity <= 0) {
        logMessage("{red:You need to equip arrows to shoot!}");
        gameState.isAiming = false;
        return;
    }

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // --- 1. Deduct Cost ---
        player.stamina -= skillData.cost;
        let hitSomething = false;
        let finalTargetX = player.x;
        let finalTargetY = player.y;

        // --- 2. Calculate Base Damage ---
        const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
        const ammoDamage = ammo.damage || 0;
        
        // Ranged attacks scale off Dexterity + Bow Dmg + Arrow Dmg
        let rawPower = player.dexterity + weaponDamage + ammoDamage;

        if (player.talents && player.talents.includes('eagle_eye')) {
            rawPower = Math.floor(rawPower * 1.5);
        }
        
        if (player.stealthTurns > 0) {
            player.stealthTurns = 0;
            logMessage("You fire from the shadows!");
            playerRef.update({ stealthTurns: 0 });
            
            if (player.talents && player.talents.includes('shadow_strike')) {
                rawPower = Math.floor(rawPower * 4);
                logMessage("Shadow Strike! (4x Damage)");
            }
        }

        const totalDamage = Math.max(1, rawPower);

        // --- CONSUME AMMO ---
        ammo.quantity--;
        if (ammo.quantity <= 0) {
            logMessage("You fired your last arrow!");
            // Find it in inventory and remove it
            const invIndex = player.inventory.findIndex(i => i.isEquipped && i.slot === 'ammo');
            if (invIndex > -1) player.inventory.splice(invIndex, 1);
            player.equipment.ammo = null;
        }

        // --- 3. Projectile Loop (Range 4) ---
        logMessage("You loose an arrow!");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); 
        
        for (let i = 1; i <= 4; i++) {
            const targetX = player.x + (dirX * i);
            const targetY = player.y + (dirY * i);

            let tile;
            let isSolid = false;

            if (gameState.mapMode === 'overworld') {
                const enemyId = `overworld:${targetX},${-targetY}`;
                const liveEnemy = gameState.sharedEnemies[enemyId];
                tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
                if (['^', 'F', '🧱'].includes(tile) && !liveEnemy) isSolid = true;
            } else {
                const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
                const theme = CAVE_THEMES[gameState.currentCaveTheme];
                const wallTile = theme ? theme.wall : '▓';
                if (tile === wallTile || tile === '▒') isSolid = true;
            }
            
            if (isSolid) {
                logMessage("Your arrow strikes a solid object.");
                break;
            }

            const enemyData = ENEMY_DATA[tile];

            if (enemyData) {
                hitSomething = true;
                
                if (gameState.mapMode === 'overworld') {
                    const finalDmg = Math.max(1, totalDamage - (enemyData.defense || 0));
                    await handleOverworldCombat(targetX, targetY, enemyData, tile, finalDmg);
                } else {
                    let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
                    if (enemy) {
                        const finalDmg = Math.max(1, totalDamage - (enemy.defense || 0));
                        enemy.health -= finalDmg;
                        logMessage(`You shoot ${enemy.name} for ${finalDmg} damage!`);
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#fff', 3);

                        if (enemy.health <= 0) {
                            logMessage(`You defeated ${enemy.name}!`);
                            handleInstancedEnemyDeath(enemy, targetX, targetY);
                        }
                    }
                }
                break; 
            }
            
            finalTargetX = targetX;
            finalTargetY = targetY;
        }

        if (!hitSomething) {
            logMessage("Your arrow flies off into the distance.");
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createFloatingText(finalTargetX, finalTargetY, "Miss", "#9ca3af");
            }
            
            // --- NEW: RECOVERABLE AMMO ---
            // 50% chance the arrow survives and sticks in the ground
            if (Math.random() < 0.50) {
                let validFloor = true;
                let dropTile;
                
                if (gameState.mapMode === 'overworld') dropTile = chunkManager.getTile(finalTargetX, finalTargetY);
                else {
                    const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                    dropTile = (map && map[finalTargetY] && map[finalTargetY][finalTargetX]) ? map[finalTargetY][finalTargetX] : ' ';
                }

                // If it hits deep water or lava, it's gone. Otherwise, it sticks in the ground/wall!
                if (['~', '≈', ' '].includes(dropTile)) validFloor = false; 

                if (validFloor) {
                    chunkManager.setWorldTile(finalTargetX, finalTargetY, '➹', 2); // Drops for 2 hours
                    gameState.mapDirty = true;
                    logMessage("{gray:You see your arrow sticking out of the ground nearby.}");
                }
            }
        }

        // --- 4. Finalize Turn ---
        playerRef.update({
            stamina: player.stamina,
            inventory: getSanitizedInventory() // Sync ammo removal
        });
        triggerStatFlash(statDisplays.stamina, false); 
        
        endPlayerTurn(); 
        renderEquipment(); // Refresh UI ammo count
        render(); 

    } finally {
        // --- 🚨 UNLOCK THE ENGINE ---
        isProcessingMove = false;
    }
}

function initSkillbookListeners() {
    closeSkillButton.addEventListener('click', () => {
        skillModal.classList.add('hidden');
    });

    // Calls our new, unified useSkill function
    skillList.addEventListener('click', (e) => {
        const skillItem = e.target.closest('.skill-item');
        if (skillItem && skillItem.dataset.skill) {
            // Pass the skill's ID (e.g., "brace")
            useSkill(skillItem.dataset.skill);
        }
    });
}

async function executeLunge(dirX, dirY) {
    const player = gameState.player;
    const skillId = "lunge"; // This function is only for Lunge
    const skillData = SKILL_DATA[skillId];
    const skillLevel = player.skillbook[skillId] || 1;

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // --- 1. Deduct Cost ---
        // Cost was checked in useSkill, but we deduct it here upon firing.
        player.stamina -= skillData.cost;
        let hit = false;

        // --- 2. Calculate Base Damage ---
        const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
        const playerStrength = player.strength + (player.strengthBonus || 0);

        let rawPower = playerStrength + weaponDamage;

        // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
        rawPower = getPlayerDamageModifier(rawPower);
        const playerBaseDamage = rawPower;

        // Loop 2 and 3 tiles away
        for (let i = 2; i <= 3; i++) {
            const targetX = player.x + (dirX * i);
            const targetY = player.y + (dirY * i);

            let tile;
            if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
            } else if (gameState.mapMode === 'castle') {
                const map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
            } else {
                // --- Check for LIVE moving enemies first! ---
                const enemyId = `overworld:${targetX},${-targetY}`;
                const liveEnemy = gameState.sharedEnemies[enemyId];
                tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
            }

            const enemyData = ENEMY_DATA[tile];

            if (enemyData) {
                // Found a target!
                if (player.stealthTurns > 0) {
                    player.stealthTurns = 0;
                    logMessage("You strike from the shadows!");
                    playerRef.update({ stealthTurns: 0 });
                }

                logMessage(`You lunge and attack the ${enemyData.name}!`);
                hit = true;

                // --- 3. Calculate Final Damage ---
                // Formula: ( (PlayerBaseDmg - EnemyDef) * Multiplier ) + (Strength * Level)
                const baseLungeDamage = (playerBaseDamage - (enemyData.defense || 0)) * skillData.baseDamageMultiplier;
                const scalingDamage = (player.strength * skillLevel);
                const totalLungeDamage = Math.max(1, Math.floor(baseLungeDamage + scalingDamage));
                // --- End Damage Calc ---

                if (gameState.mapMode === 'overworld') {
                    // Handle Overworld Combat
                    await handleOverworldCombat(targetX, targetY, enemyData, tile, totalLungeDamage);

                } else {
                    // Handle Instanced Combat
                    let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
                    if (enemy) {
                        // We apply our new calculated damage!
                        enemy.health -= totalLungeDamage;
                        logMessage(`You hit the ${enemy.name} for ${totalLungeDamage} damage!`);
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#fff', 3);

                        if (enemy.health <= 0) {
                            logMessage(`You defeated the ${enemy.name}!`);
                            handleInstancedEnemyDeath(enemy, targetX, targetY);
                        }
                    }
                }
                break; // Stop looping, we hit our target
            }
        }

        if (!hit) {
            logMessage("You lunge... and hit nothing.");
        } else {
            AudioSystem.playAttack();
        }

        // --- 4. Finalize Turn ---
        playerRef.update({
            stamina: player.stamina
        });
        triggerStatFlash(statDisplays.stamina, false); // Flash stamina for cost
        triggerAbilityCooldown('lunge');
        endPlayerTurn(); // Always end turn, even if you miss
        render(); // Re-render to show enemy health change

    } finally {
        // --- 🚨 UNLOCK THE ENGINE ---
        isProcessingMove = false;
    }
}

function executeQuickstep(dirX, dirY) {
    const player = gameState.player;
    // Move 2 tiles
    const targetX = player.x + (dirX * 2);
    const targetY = player.y + (dirY * 2);

    // Check collision
    let tile = chunkManager.getTile(targetX, targetY);
    // (Simple check, you can expand to dungeon maps if needed)
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        tile = map[targetY][targetX];
    }

    if (['.', 'F', 'd', 'D'].includes(tile)) {
        player.x = targetX;
        player.y = targetY;
        player.stamina -= SKILL_DATA['quickstep'].cost;
        logMessage("You dash forward with blinding speed!");
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#fff', 5);

        triggerAbilityCooldown('quickstep');
        endPlayerTurn();
        render();
    } else {
        logMessage("Path blocked.");
        gameState.isAiming = false; // Reset aiming
    }
}
