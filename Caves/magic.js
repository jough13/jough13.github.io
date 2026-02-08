
/**
 * Handles all skill logic based on SKILL_DATA
 * and the player's skillbook.
 * @param {string} skillId - The ID of the skill to use (e.g., "brace").
 */

function useSkill(skillId) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId]; // Get data from our new constant

    if (!skillData) {
        logMessage("Unknown skill. (No skill data found)");
        return;
    }

    if (player.cooldowns && player.cooldowns[skillId] > 0) {
        logMessage(`That skill is not ready yet (${player.cooldowns[skillId]} turns).`);
        return;
    }

    const skillLevel = player.skillbook[skillId] || 0; // Get the player's level for this skill

    if (skillLevel === 0) {
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
    const costType = skillData.costType; // 'stamina'

    if (player[costType] < cost) {
        logMessage(`You don't have enough ${costType} to use that.`);
        return; // Do not close modal, do not end turn
    }

    // --- 3. Handle Targeting ---
    if (skillData.target === 'aimed') {
        // --- Aimed Skills (e.g., Lunge) ---
        // Cost is checked, but *not* deducted. executeLunge will deduct it.
        gameState.isAiming = true;
        gameState.abilityToAim = skillId; // Store the skillId (e.g., "lunge")
        skillModal.classList.add('hidden');
        logMessage(`${skillData.name}: Press an arrow key or WASD to use. (Esc) to cancel.`);
        return; // We don't end the turn until they fire

    } else if (skillData.target === 'self') {
        // --- Self-Cast Skills (e.g., Brace) ---
        // Cast immediately.
        player[costType] -= cost; // Deduct the resource cost
        let skillUsedSuccessfully = false;

        // --- 4. Execute Skill Effect ---
        switch (skillId) {
            case 'brace':
                if (player.defenseBonusTurns > 0) {
                    logMessage("You are already bracing!");
                    break;
                }
                // Formula: defense = base + (Constitution * 0.5 * level)
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

            // STEALTH ---
            case 'stealth':
                player.stealthTurns = skillData.duration;
                logMessage("You fade into the shadows... (Invisible)");
                playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;

            // WHIRLWIND ---
            case 'whirlwind':
                logMessage("You spin in a deadly vortex!");
                let hitCount = 0;
                // Stronger scaling: Str + Dex
                const baseDmg = (player.strength + player.dexterity) * skillLevel;

                // Attack all adjacent tiles (-1 to 1)
                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue; // Skip self
                        const tx = player.x + x;
                        const ty = player.y + y;

                        // --- Handle Overworld vs Instanced ---
                        if (gameState.mapMode === 'overworld') {
                            const tile = chunkManager.getTile(tx, ty);
                            const enemyData = ENEMY_DATA[tile];
                            if (enemyData) {
                                // Calculate damage (simplified for AoE)
                                const finalDmg = Math.max(1, baseDmg - (enemyData.defense || 0));
                                // Call the async handler (fire and forget)
                                handleOverworldCombat(tx, ty, enemyData, tile, finalDmg);
                                hitCount++;
                            }
                        } else {
                            // Existing Instanced Logic
                            let enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
                            if (enemy) {
                                enemy.health -= baseDmg;
                                logMessage(`Whirlwind hits ${enemy.name} for ${baseDmg}!`);
                                hitCount++;

                                if (enemy.health <= 0) {
                                    logMessage(`${enemy.name} is slain!`);
                                    registerKill(enemy);
                                    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

                                    // Update persistent dungeon state
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
            playerRef.update({ [costType]: player[costType] }); // Save the new stamina
            triggerStatFlash(statDisplays.stamina, false); // Flash stamina for cost
            skillModal.classList.add('hidden');
            triggerAbilityCooldown(skillId);
            endPlayerTurn();
            renderEquipment(); // Update UI to show buff
        }
    }
}


/**
 * Handles all spellcasting logic based on SPELL_DATA
 * and the player's spellbook.
 * @param {string} spellId - The ID of the spell to cast (e.g., "lesserHeal").
 */

function castSpell(spellId) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];

    if (!spellData) {
        logMessage("You don't know how to cast that. (No spell data found)");
        return;
    }

    if (player.cooldowns && player.cooldowns[spellId] > 0) {
        logMessage(`That spell is not ready yet (${player.cooldowns[spellId]} turns).`);
        return;
    }

    const spellLevel = player.spellbook[spellId] || 0;

    if (spellLevel === 0) {
        logMessage("You don't know that spell.");
        return;
    }

    // --- 1. Check Resource Cost ---

    let cost = spellData.cost;
    // --- ARCHMAGE: MANA FLOW ---
    if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
        cost = Math.floor(cost * 0.8);
    }

    const costType = spellData.costType;

    // --- COST CHECK ---
    if (costType === 'health') {
        // Special check for health: must have MORE than the cost
        if (player[costType] <= cost) {
            logMessage("You are too weak to sacrifice your life-force.");
            return;
        }
    } else if (player[costType] < cost) {
        logMessage(`You don't have enough ${costType} to cast that.`);
        return;
    }

    // --- 2. Handle Targeting ---
    if (spellData.target === 'aimed') {
        // (This block is unchanged)
        gameState.isAiming = true;
        gameState.abilityToAim = spellId;
        spellModal.classList.add('hidden');
        logMessage(`${spellData.name}: Press an arrow key or WASD to fire. (Esc) to cancel.`);
        return;

    } else if (spellData.target === 'self') {
        // --- Self-Cast Spells ---
        player[costType] -= cost; // Deduct the resource cost
        let spellCastSuccessfully = false;
        let updates = {}; // --- Object to batch database updates ---

        // --- 3. Execute Spell Effect ---
        switch (spellId) {

            case 'stoneSkin':
                // Grants high defense for a short time
                const skinBonus = 3 + Math.floor(player.constitution * 0.2);
                player.defenseBonus = (player.defenseBonus || 0) + skinBonus;
                player.defenseBonusTurns = spellData.duration;

                logMessage(`Your skin turns to granite! (+${skinBonus} Defense)`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-gray'); // Gray for stone!

                updates.defenseBonus = player.defenseBonus;
                updates.defenseBonusTurns = player.defenseBonusTurns;
                spellCastSuccessfully = true;
                break;

            case 'thornSkin':
                const reflectAmount = spellData.baseReflect + (player.intuition * spellLevel);
                player.thornsValue = reflectAmount;
                player.thornsTurns = spellData.duration;
                logMessage(`Your skin hardens! (Reflect ${reflectAmount} dmg)`);

                updates.thornsValue = reflectAmount;
                updates.thornsTurns = spellData.duration;
                spellCastSuccessfully = true;
                break;

            case 'candlelight':
                if (player.candlelightTurns > 0) {
                    logMessage("You renew the magical light.");
                } else {
                    logMessage("A warm, floating orb of light appears above you.");
                }

                player.candlelightTurns = spellData.duration;

                // Visual Flair
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-yellow');
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(player.x, player.y, "💡", "#facc15");
                }

                updates.candlelightTurns = player.candlelightTurns;
                spellCastSuccessfully = true;
                break;

            case 'divineLight':
                player.health = player.maxHealth;
                player.poisonTurns = 0;
                player.frostbiteTurns = 0;
                player.madnessTurns = 0; // New status clean
                player.rootTurns = 0;

                logMessage("A holy light bathes you. You are fully restored!");
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                ParticleSystem.createLevelUp(player.x, player.y); // Use the sparkle effect

                updates.health = player.health;
                updates.poisonTurns = 0;
                updates.frostbiteTurns = 0;
                updates.madnessTurns = 0;
                spellCastSuccessfully = true;
                break;

            case 'lesserHeal':
                const effectiveWits = player.wits + (player.witsBonus || 0);
                const healAmount = spellData.baseHeal + (effectiveWits * spellLevel);
                const oldHealth = player.health;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                const healedFor = player.health - oldHealth;

                if (healedFor > 0) {
                    logMessage(`You cast Lesser Heal and recover ${healedFor} health.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');

                    ParticleSystem.createFloatingText(player.x, player.y, `+${healedFor}`, '#22c55e'); // Green text

                } else {
                    logMessage("You cast Lesser Heal, but you're already at full health.");
                }
                updates.health = player.health;
                spellCastSuccessfully = true;
                break;

            case 'arcaneShield':
                if (player.shieldTurns > 0) {
                    logMessage("You already have an active shield!");
                    spellCastSuccessfully = false;
                    break;
                }

                const effWitsShield = player.wits + (player.witsBonus || 0);
                const shieldAmount = spellData.baseShield + (effWitsShield * spellLevel);
                player.shieldValue = shieldAmount;
                player.shieldTurns = spellData.duration;

                logMessage(`You conjure an Arcane Shield, absorbing ${shieldAmount} damage!`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-blue');

                updates.shieldValue = player.shieldValue;
                updates.shieldTurns = player.shieldTurns;
                spellCastSuccessfully = true;
                break;

            case 'clarity':
                if (gameState.mapMode !== 'dungeon') {
                    logMessage("You can only feel for secret walls in caves.");
                    spellCastSuccessfully = true;
                    break;
                }

                const map = chunkManager.caveMaps[gameState.currentCaveId];
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                const secretWallTile = theme.secretWall;
                let foundWall = false;

                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue;
                        const checkX = player.x + x;
                        const checkY = player.y + y;

                        if (map[checkY] && map[checkY][checkX] === secretWallTile) {
                            map[checkY][checkX] = theme.floor;
                            foundWall = true;
                        }
                    }
                }

                if (foundWall) {
                    logMessage("You focus your mind... and a passage is revealed!");
                    render();
                } else {
                    logMessage("You focus, but find no hidden passages nearby.");
                }
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                spellCastSuccessfully = true;
                break;

            // --- ADD THIS NEW CASE ---
            case 'darkPact':
                const manaRestored = spellData.baseRestore + (player.willpower * spellLevel);
                const oldMana = player.mana;
                player.mana = Math.min(player.maxMana, player.mana + manaRestored);
                const actualRestore = player.mana - oldMana;

                if (actualRestore > 0) {
                    logMessage(`You sacrifice ${cost} health to restore ${actualRestore} mana.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-red'); // Our new animation
                    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                } else {
                    logMessage("You cast Dark Pact, but your mana is already full.");
                }
                updates.health = player.health; // Add health cost to updates
                updates.mana = player.mana;   // Add mana gain to updates
                spellCastSuccessfully = true;
                break;
            // --- END ---
        }

        // --- 4. Finalize Self-Cast Turn ---
        if (spellCastSuccessfully) {

            AudioSystem.playMagic();

            updates[costType] = player[costType]; // Add the resource cost (mana/psyche/health)
            playerRef.update(updates); // Send all updates at once
            spellModal.classList.add('hidden');

            triggerAbilityCooldown(spellId);

            endPlayerTurn();
            renderStats();
        } else {
            // Refund the cost if the spell failed (e.g., shield already active)
            player[costType] += cost;
        }
    }
}


async function executeMeleeSkill(skillId, dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId];
    const skillLevel = player.skillbook[skillId] || 1;

    player[skillData.costType] -= skillData.cost;
    let hit = false;

    // Calculate Damage
    const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
    const playerStrength = player.strength + (player.strengthBonus || 0);

    let rawPower = playerStrength + weaponDamage;

    // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
    rawPower = getPlayerDamageModifier(rawPower);

    const baseDmg = rawPower * skillData.baseDamageMultiplier;

    const finalDmg = Math.max(1, Math.floor(baseDmg + (player.strength * 0.5 * skillLevel)));

    // Target Logic
    // Shield Bash / Cleave hit adjacent (Range 1)
    const targetX = player.x + dirX;
    const targetY = player.y + dirY;

    let enemiesToHit = [{ x: targetX, y: targetY }];

    // If Cleave, add side targets
    if (skillId === 'cleave') {
        // If attacking North(0, -1), sides are (-1, -1) and (1, -1)
        // Simple logic: add perpendicular offsets? No, cleave usually hits a wide arc in front.
        // Let's hit the main target, plus the tiles 90 degrees to it.
        // If attacking (1, 0) [East], hit (1, -1) [NE] and (1, 1) [SE]
        if (dirX !== 0) { // Horizontal attack
            enemiesToHit.push({ x: targetX, y: targetY - 1 });
            enemiesToHit.push({ x: targetX, y: targetY + 1 });
        } else { // Vertical attack
            enemiesToHit.push({ x: targetX - 1, y: targetY });
            enemiesToHit.push({ x: targetX + 1, y: targetY });
        }
    }

    for (const coords of enemiesToHit) {
        // ... (Insert standard tile check logic here: Overworld vs Instanced) ...
        let tile;
        let map;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            tile = (map && map[coords.y]) ? map[coords.y][coords.x] : ' ';
        } else if (gameState.mapMode === 'castle') {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            tile = (map && map[coords.y]) ? map[coords.y][coords.x] : ' ';
        } else {
            tile = chunkManager.getTile(coords.x, coords.y);
        }

        const enemyData = ENEMY_DATA[tile];
        if (enemyData) {

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You emerge from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }

            hit = true;

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You strike from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }

            // Apply Damage
            if (gameState.mapMode === 'overworld') {
                await handleOverworldCombat(coords.x, coords.y, enemyData, tile, finalDmg);
            } else {
                let enemy = gameState.instancedEnemies.find(e => e.x === coords.x && e.y === coords.y);
                if (enemy) {
                    enemy.health -= finalDmg;
                    logMessage(`You hit ${enemy.name} for ${finalDmg}!`);
                    ParticleSystem.createExplosion(coords.x, coords.y, '#fff');

                    // APPLY STUN (Shield Bash OR Crush)
                    if (skillId === 'shieldBash' || skillId === 'crush') {
                        enemy.stunTurns = 3;
                        logMessage(`${enemy.name} is stunned!`);
                    }

                    if (enemy.health <= 0) {
                        logMessage(`You defeated ${enemy.name}!`);

                        registerKill(enemy);

                        const droppedLoot = generateEnemyLoot(player, enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

                        if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);

                        }

                        if (map) map[coords.y][coords.x] = droppedLoot;
                    }
                }
            }
        }
    }

    if (!hit) logMessage("You swing at empty air.");

    triggerAbilityCooldown(skillId);
    endPlayerTurn();
    render();
}


/**
 * Universal helper function to apply spell damage to a target.
 * Handles both overworld (Firebase) and instanced enemies.
 * Also handles special on-hit effects like Siphon Life.
 * @param {number} targetX - The x-coordinate of the target.
 * @param {number} targetY - The y-coordinate of the target.
 * @param {number} damage - The final calculated damage to apply.
 * @param {string} spellId - The ID of the spell being cast (e.g., "siphonLife").
 */
async function applySpellDamage(targetX, targetY, damage, spellId) {

    // --- WEATHER SYNERGY ---
    const weather = gameState.weather; // Get current weather
    let finalDamage = damage;

    // --- TALENT: ARCANE POTENCY ---
    if (gameState.player.talents && gameState.player.talents.includes('arcane_potency')) {
        finalDamage += 2;
    }

    if (gameState.mapMode === 'overworld' && weather !== 'clear') {

        // Rain/Storm Logic
        if (weather === 'rain' || weather === 'storm') {
            if (spellId === 'fireball' || spellId === 'meteor') {
                finalDamage = Math.floor(damage * 0.5); // Fire fizzles in rain
                // Visual cue (only if player is casting)
                if (gameState.player.x !== targetX) ParticleSystem.createFloatingText(targetX, targetY, "Fizzle...", "#aaa");
            } else if (spellId === 'thunderbolt' || spellId === 'magicBolt') {
                finalDamage = Math.floor(damage * 1.5); // Lightning conducts!
            }
        }

        // Snow Logic
        else if (weather === 'snow') {
            if (spellId === 'frostBolt') {
                finalDamage = Math.floor(damage * 1.5); // Ice enhanced
            } else if (spellId === 'fireball') {
                finalDamage = Math.floor(damage * 0.8); // Fire dampened
            }
        }
    }

    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];

    // Determine the tile and enemy data
    let tile;
    if (gameState.mapMode === 'overworld') {
        tile = chunkManager.getTile(targetX, targetY);
    } else {
        const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
        tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
    }
    const enemyData = ENEMY_DATA[tile];
    if (!enemyData) return false; // No enemy here

    let damageDealt = 0; // Track actual damage for lifesteal

    if (gameState.mapMode === 'overworld') {
        const enemyId = `overworld:${targetX},${-targetY}`;
        const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);

        // --- Capture Stats Before Damage ---
        // Just like melee, we check if we have a local visual copy of this enemy.
        // If we do, we use its stats (Name, Elite status, Max HP) for the transaction.
        const liveEnemy = gameState.sharedEnemies[enemyId];
        const enemyInfo = liveEnemy || getScaledEnemy(enemyData, targetX, targetY);
  
        try {
            const transactionResult = await enemyRef.transaction(currentData => {
                let enemy;

                if (currentData === null) {
                    // Use enemyInfo (the visual state) instead of generating random new stats
                    enemy = {
                        name: enemyInfo.name, 
                        health: enemyInfo.maxHealth,
                        maxHealth: enemyInfo.maxHealth,
                        attack: enemyInfo.attack,
                        defense: enemyData.defense, // Base defense is usually fine, or use enemyInfo.defense
                        xp: enemyInfo.xp,
                        loot: enemyData.loot,
                        tile: tile,
                        // Critical: Persist Elite status and color
                        isElite: enemyInfo.isElite || false,
                        color: enemyInfo.color || null
                    };
                } else {
                    enemy = currentData;
                }

                // Calculate actual damage
                damageDealt = Math.max(1, damage);
                enemy.health -= damageDealt;

                let color = '#3b82f6'; // Blue for magic

                if (spellId === 'fireball') color = '#f97316'; // Orange for fire
                if (spellId === 'poisonBolt') color = '#22c55e'; // Green for poison

                // Note: Visuals inside transaction might fire multiple times on retries, 
                // but for this game it's acceptable.
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(targetX, targetY, color);
                    ParticleSystem.createFloatingText(targetX, targetY, `-${damageDealt}`, color);
                }

                if (enemy.health <= 0) return null;
                return enemy;
            });

            const finalEnemyState = transactionResult.snapshot.val();
            
            if (finalEnemyState === null) {
                // Enemy Died
                // Use enemyInfo for the log and XP so it matches what the player saw
                logMessage(`The ${enemyInfo.name} was vanquished!`);
                registerKill(enemyInfo);

                // Pass Elite flag to loot generator
                const lootData = { ...enemyData, isElite: enemyInfo.isElite };
                const droppedLoot = generateEnemyLoot(player, lootData);

                chunkManager.setWorldTile(targetX, targetY, droppedLoot);
            }
        } catch (error) {
            console.error("Spell damage transaction failed: ", error);
        }

    } else {
        // Handle Instanced Combat
        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        if (enemy) {
            damageDealt = Math.max(1, damage);
            enemy.health -= damageDealt;
            logMessage(`You hit the ${enemy.name} for ${damageDealt} magic damage!`);

            if (enemy.health <= 0) {
                logMessage(`You defeated the ${enemy.name}!`);

                registerKill(enemy);

                const droppedLoot = generateEnemyLoot(player, enemy);
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                    chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                }
                if (gameState.mapMode === 'dungeon') {
                    chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = droppedLoot;
                }
            }
        }
    }

    // --- Handle On-Hit Effects ---
    if (damageDealt > 0 && spellId === 'siphonLife') {
        const healedAmount = Math.floor(damageDealt * spellData.healPercent);
        if (healedAmount > 0) {
            const oldHealth = player.health;
            player.health = Math.min(player.maxHealth, player.health + healedAmount);
            const actualHeal = player.health - oldHealth;
            if (actualHeal > 0) {
                logMessage(`You drain ${actualHeal} health from the ${enemyData.name}.`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                playerRef.update({ health: player.health });
            }
        }
    }

    else if (damageDealt > 0 && spellData.inflicts && Math.random() < spellData.inflictChance) {

        // This only applies to instanced enemies for now
        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

            if (enemy && spellData.inflicts === 'frostbite' && enemy.frostbiteTurns <= 0) {
                logMessage(`The ${enemy.name} is afflicted with Frostbite!`);
                enemy.frostbiteTurns = 5; // Lasts 5 turns
            }

            else if (enemy && spellData.inflicts === 'poison' && enemy.poisonTurns <= 0) {
                logMessage(`The ${enemy.name} is afflicted with Poison!`);
                enemy.poisonTurns = 3; // Poison lasts 3 turns
            }

            else if (enemy && spellData.inflicts === 'root' && enemy.rootTurns <= 0) {
                logMessage(`Roots burst from the ground, trapping the ${enemy.name}!`);
                enemy.rootTurns = 3; // Root lasts 3 turns
            }
        }
    }

    return damageDealt > 0; // Return true if we hit something
}


/**
 * Executes an aimed spell (Magic Bolt, Fireball, Siphon Life)
 * after the player chooses a direction.
 * @param {string} spellId - The ID of the spell to execute.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

async function executeAimedSpell(spellId, dirX, dirY) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];
    const spellLevel = player.spellbook[spellId] || 1;

    // --- 1. Deduct Cost ---

    // The cost was already checked in castSpell. Now we deduct it.

    // --- ARCHMAGE: MANA FLOW ---

    let cost = spellData.cost;
    if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
        cost = Math.floor(cost * 0.8);
    }
    player[spellData.costType] -= cost;

    AudioSystem.playMagic();

    let hitSomething = false;

    // --- CALCULATE DAMAGE WITH BONUS ---
    const effectiveWits = player.wits + (player.witsBonus || 0);
    const effectiveWill = player.willpower; // Add willpowerBonus here if you ever add that stat!

    // --- 2. Execute Spell Logic ---
    switch (spellId) {

        // --- 1. ENTANGLE (Unique Logic) ---
        case 'entangle': {
            logMessage("Vines burst from the ground!");
            const entangleDmg = spellData.baseDamage + (player.intuition * spellLevel); 

            // Entangle hits a specific spot or the first thing in line
            for (let i = 1; i <= 3; i++) {
                const tx = player.x + (dirX * i);
                const ty = player.y + (dirY * i);

                if (await applySpellDamage(tx, ty, entangleDmg, spellId)) {
                    hitSomething = true;
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createFloatingText(tx, ty, "ROOTED", "#22c55e");
                    }
                    break;
                }
            }
            break;
        }

        // --- 2. STANDARD PROJECTILES (Shared Logic) ---
        case 'magicBolt':
        case 'siphonLife':
        case 'psychicBlast':
        case 'frostBolt':
        case 'poisonBolt': {
            // Determine which stat scales damage based on the specific spell ID
            const damageStat = (spellId === 'siphonLife' || spellId === 'psychicBlast' || spellId === 'poisonBolt') 
                ? effectiveWill 
                : effectiveWits;

            const spellDamage = spellData.baseDamage + (damageStat * spellLevel);

            let logMsg = "You cast your spell!";
            if (spellId === 'magicBolt') logMsg = "You hurl a bolt of energy!";
            else if (spellId === 'siphonLife') logMsg = "You cast Siphon Life!";
            else if (spellId === 'psychicBlast') logMsg = "You unleash a blast of mental energy!";
            else if (spellId === 'frostBolt') logMsg = "You launch a shard of ice!";
            else if (spellId === 'poisonBolt') logMsg = "You hurl a bolt of acid!";
            
            logMessage(logMsg);

            // Projectile travel logic (Range 1-3)
            for (let i = 1; i <= 3; i++) {
                const targetX = player.x + (dirX * i);
                const targetY = player.y + (dirY * i);
                
                if (await applySpellDamage(targetX, targetY, spellDamage, spellId)) {
                    hitSomething = true;
                    break; // Stop, we hit a target
                }
            }
            break;
        }

        // --- 3. OTHER SPELLS (Keep existing logic) ---
        case 'thunderbolt': {
            const thunderDmg = spellData.baseDamage + (player.wits * spellLevel);
            logMessage("CRACK! Lightning strikes!");
            // Thunderbolt is instant hit, range 4
            for (let i = 1; i <= 4; i++) {
                const tx = player.x + (dirX * i);
                const ty = player.y + (dirY * i);
                if (await applySpellDamage(tx, ty, thunderDmg, spellId)) {
                    ParticleSystem.createExplosion(tx, ty, '#facc15');
                    hitSomething = true;
                    break;
                }
            }
            break;
        }

        case 'meteor': {
            // Huge AoE (radius 2)
            const meteorDmg = spellData.baseDamage + (player.wits * spellLevel);
            const mx = player.x + (dirX * 3);
            const my = player.y + (dirY * 3);
            logMessage("A meteor crashes down!");

            for (let y = my - spellData.radius; y <= my + spellData.radius; y++) {
                for (let x = mx - spellData.radius; x <= mx + spellData.radius; x++) {
                    applySpellDamage(x, y, meteorDmg, spellId).then(hit => {
                        if (hit) ParticleSystem.createExplosion(x, y, '#f97316');
                    });
                }
            }
            hitSomething = true;
            break;
        }

        case 'raiseDead': {
            // (Keep existing raiseDead logic...)
            // 1. Calculate target coordinates
            const targetX = player.x + dirX;
            const targetY = player.y + dirY;

            // 2. Determine what is on that tile
            let tileType;
            if (gameState.mapMode === 'overworld') {
                tileType = chunkManager.getTile(targetX, targetY);
            } else if (gameState.mapMode === 'dungeon') {
                tileType = chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX];
            } else {
                tileType = chunkManager.castleMaps[gameState.currentCastleId][targetY][targetX];
            }

            if (tileType === '(' || tileType === '⚰️') {
                if (gameState.player.companion) {
                    logMessage("You already have a companion! Dismiss them first.");
                } else {
                    logMessage("You chant the words of unlife... A Skeleton rises to serve you!");

                    // Consume the bones/grave
                    if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(targetX, targetY, '.');
                    else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = '.';

                    // Create the companion
                    gameState.player.companion = {
                        name: "Risen Skeleton",
                        tile: "s",
                        type: "undead",
                        hp: 15 + (player.willpower * 5),
                        maxHp: 15 + (player.willpower * 5),
                        attack: 3 + Math.floor(player.wits / 2),
                        defense: 1,
                        x: targetX,
                        y: targetY
                    };

                    playerRef.update({ companion: gameState.player.companion });
                    hitSomething = true;
                    render();
                }
            } else {
                logMessage("You need a pile of bones '(' or a grave '⚰️' to raise the dead.");
            }
            break;
        }

        case 'chainLightning': {
            // (Keep existing chainLightning logic...)
            const lightningDmg = spellData.baseDamage + (player.wits * spellLevel);
            const targetX = player.x + (dirX * 3);
            const targetY = player.y + (dirY * 3);

            logMessage("A bolt of lightning arcs from your hands!");

            const hitPrimary = await applySpellDamage(targetX, targetY, lightningDmg, spellId);

            if (hitPrimary) {
                hitSomething = true;
                ParticleSystem.createExplosion(targetX, targetY, '#facc15');
            }

            const jumpRadius = 3; 
            let potentialJumpTargets = [];

            for (let y = targetY - jumpRadius; y <= targetY + jumpRadius; y++) {
                for (let x = targetX - jumpRadius; x <= targetX + jumpRadius; x++) {
                    if (x === targetX && y === targetY) continue;

                    let hasEnemy = false;
                    if (gameState.mapMode === 'overworld') {
                        const tile = chunkManager.getTile(x, y);
                        if (ENEMY_DATA[tile]) hasEnemy = true;
                    } else {
                        if (gameState.instancedEnemies.some(e => e.x === x && e.y === y)) hasEnemy = true;
                    }

                    if (hasEnemy) potentialJumpTargets.push({ x, y });
                }
            }

            const maxJumps = 2 + Math.floor(spellLevel / 2);
            potentialJumpTargets.sort(() => Math.random() - 0.5);
            const jumpsToMake = Math.min(potentialJumpTargets.length, maxJumps);

            if (jumpsToMake > 0) {
                setTimeout(() => logMessage(`The lightning arcs to ${jumpsToMake} nearby enemies!`), 200);
            }

            for (let i = 0; i < jumpsToMake; i++) {
                const jumpTgt = potentialJumpTargets[i];
                const jumpDmg = Math.max(1, Math.floor(lightningDmg * 0.75));
                applySpellDamage(jumpTgt.x, jumpTgt.y, jumpDmg, spellId).then(hit => {
                    if (hit) ParticleSystem.createExplosion(jumpTgt.x, jumpTgt.y, '#93c5fd');
                });
            }
            break;
        }

        case 'fireball': {
            // (Keep existing fireball logic...)
            const fbDamage = spellData.baseDamage + (player.wits * spellLevel);
            const radius = spellData.radius; 
            const targetX = player.x + (dirX * 3);
            const targetY = player.y + (dirY * 3);
            logMessage("A fireball erupts in the distance!");

            for (let y = targetY - radius; y <= targetY + radius; y++) {
                for (let x = targetX - radius; x <= targetX + radius; x++) {
                    let tileAt;
                    if (gameState.mapMode === 'overworld') tileAt = chunkManager.getTile(x, y);
                    else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[y]?.[x];
                    else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[y]?.[x];

                    if (tileAt === '🛢') {
                        logMessage("BOOM! An Oil Barrel explodes!");
                        ParticleSystem.createExplosion(x, y, '#f97316', 12);
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '.');
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][y][x] = '.';
                        else chunkManager.castleMaps[gameState.currentCastleId][y][x] = '.';
                        applySpellDamage(x, y, 15, 'fireball');
                    }

                    if (gameState.mapMode === 'dungeon' && tileAt === '🕸') {
                        const map = chunkManager.caveMaps[gameState.currentCaveId];
                        const theme = CAVE_THEMES[gameState.currentCaveTheme];
                        if (map && map[y]) {
                            map[y][x] = theme.floor;
                            logMessage("The web catches fire and burns away!");
                        }
                    }

                    applySpellDamage(x, y, fbDamage, spellId).then(hit => {
                        if (hit) hitSomething = true;
                    });
                }
            }
            break;
        }
    }

    if (!hitSomething && (spellId === 'magicBolt' || spellId === 'siphonLife')) {
        logMessage("Your spell flies harmlessly into the distance.");
    }

    // --- 3. Finalize Turn ---
    playerRef.update({
        [spellData.costType]: player[spellData.costType] // Update mana or psyche
    });

    // Trigger the correct stat animation
    if (spellData.costType === 'mana') {
        triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
    } else if (spellData.costType === 'psyche') {
        triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    }

    triggerAbilityCooldown(spellId);

    endPlayerTurn();
    render();
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

async function executeLunge(dirX, dirY) {
    const player = gameState.player;
    const skillId = "lunge"; // This function is only for Lunge
    const skillData = SKILL_DATA[skillId];
    const skillLevel = player.skillbook[skillId] || 1;

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
            tile = chunkManager.getTile(targetX, targetY);
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

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You strike from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }

            // --- 3. Calculate Final Damage ---
            // Formula: ( (PlayerBaseDmg - EnemyDef) * Multiplier ) + (Strength * Level)
            const baseLungeDamage = (playerBaseDamage - (enemyData.defense || 0)) * skillData.baseDamageMultiplier;
            const scalingDamage = (player.strength * skillLevel);
            const totalLungeDamage = Math.max(1, Math.floor(baseLungeDamage + scalingDamage));
            // --- End Damage Calc ---

            if (gameState.mapMode === 'overworld') {
                // Handle Overworld Combat
                // We now pass our calculated skill damage!
                await handleOverworldCombat(targetX, targetY, enemyData, tile, totalLungeDamage);

            } else {
                // Handle Instanced Combat
                let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
                if (enemy) {
                    // We apply our new calculated damage!
                    enemy.health -= totalLungeDamage;
                    logMessage(`You hit the ${enemy.name} for ${totalLungeDamage} damage!`);

                    if (enemy.health <= 0) {
                        logMessage(`You defeated the ${enemy.name}!`);

                        registerKill(enemy);

                        const droppedLoot = generateEnemyLoot(player, enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

                        if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                        }

                        if (gameState.mapMode === 'dungeon') {
                            chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = droppedLoot;
                        }
                    }
                }
            }
            break; // Stop looping, we hit our target
        }
    }

    if (!hit) {
        logMessage("You lunge... and hit nothing.");
    }

    // --- 4. Finalize Turn ---
    playerRef.update({
        stamina: player.stamina
    });
    triggerStatFlash(statDisplays.stamina, false); // Flash stamina for cost
    triggerAbilityCooldown('lunge');
    endPlayerTurn(); // Always end turn, even if you miss
    render(); // Re-render to show enemy health change
}

/**
 * Executes the Pacify skill on a target
 * after the player chooses a direction.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

function executePacify(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA["pacify"];

    // --- 1. Deduct Cost ---
    player.psyche -= skillData.cost;
    let hit = false;

    // Loop 1 to 3 tiles away
    for (let i = 1; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        // This skill only works in instanced maps
        if (gameState.mapMode === 'overworld') {
            logMessage("This skill only works in dungeons and castles.");
            hit = true; // Prevents the "miss" message
            break;
        }

        let map;
        let theme;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        } else {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            theme = { floor: '.' };
        }

        const tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        const enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

        if (enemy) {

            if (enemy.isBoss) {
                logMessage(`The ${enemy.name} is immune to your charms!`);
                hit = true;
                break;
            }

            // Found a target!
            hit = true;

            // --- 3. Calculate Success Chance ---
            // 5% chance per Charisma point, capped at 75%
            const successChance = Math.min(0.75, player.charisma * 0.05);

            if (Math.random() < successChance) {
                // --- SUCCESS ---
                logMessage(`You calm the ${enemy.name}! It becomes passive.`);

                // Remove it from the enemy list
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

                // Set its tile to a floor
                map[targetY][targetX] = theme.floor;

            } else {
                // --- FAILURE ---
                logMessage(`Your attempt to pacify the ${enemy.name} fails!`);
            }
            break; // Stop looping, we found our target
        } else if (tile !== theme.floor) {
            // Hit a wall, stop the loop
            break;
        }
    }

    if (!hit) {
        logMessage("You attempt to calm... nothing.");
    }

    // --- 4. Finalize Turn ---
    playerRef.update({
        psyche: player.psyche
    });
    triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    triggerAbilityCooldown('pacify');
    endPlayerTurn();
    render();
}

function executeTame(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA["tame"];

    // 1. Deduct Cost
    player.psyche -= skillData.cost;
    let hit = false;

    // Range: 1-2 tiles
    for (let i = 1; i <= 2; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        // Check for instanced enemies (Dungeon/Castle)
        // (Simplification: Taming only works in instances for now to avoid complexity with Overworld RTDB deletion)
        if (gameState.mapMode === 'overworld') {
            logMessage("The beast is too wild here. Drive it into a cave first.");
            hit = true;
            break;
        }

        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

        if (enemy) {
            hit = true;

            // Check beast types (Wolf, Spider, Scorpion, Bear/DireWolf)
            const beastTiles = ['w', '@', '🦂', '🐺'];
            if (!beastTiles.includes(enemy.tile)) {
                logMessage("You can only tame beasts!");
                break;
            }

            // Check HP Threshold (30%)
            const hpPercent = enemy.health / enemy.maxHealth;
            if (hpPercent > 0.30) {
                logMessage(`The ${enemy.name} is too healthy to tame! Weaken it first.`);
                break;
            }

            // Success Roll
            const tameChance = 0.3 + (player.charisma * 0.05); // Base 30% + 5% per Charisma
            if (Math.random() < tameChance) {
                logMessage(`You calm the ${enemy.name}... It accepts you as its master!`);

                // Create Companion
                player.companion = {
                    name: `Tamed ${enemy.name}`,
                    tile: enemy.tile,
                    type: "beast",
                    hp: enemy.maxHealth, // Heals up when tamed
                    maxHp: enemy.maxHealth,
                    attack: enemy.attack,
                    defense: enemy.defense || 0,
                    x: player.x, // Temp position
                    y: player.y
                };

                // Remove enemy
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                playerRef.update({ companion: player.companion });

            } else {
                logMessage(`The ${enemy.name} resists your call and snaps at you!`);
            }
            break;
        }
    }

    if (!hit) logMessage("You try to tame the empty air.");

    playerRef.update({ psyche: player.psyche });
    triggerAbilityCooldown('tame');
    endPlayerTurn();
    render();
}

/**
 * Executes the Inflict Madness skill on a target
 * after the player chooses a direction.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

function executeInflictMadness(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA["inflictMadness"];

    // --- 1. Deduct Cost ---
    player.psyche -= skillData.cost;
    let hit = false;

    // Loop 1 to 3 tiles away
    for (let i = 1; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        if (gameState.mapMode === 'overworld') {
            logMessage("This skill only works in dungeons and castles.");
            hit = true;
            break;
        }

        let map;
        let theme;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        } else {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            theme = { floor: '.' };
        }

        const tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        const enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

        if (enemy) {

            if (enemy.isBoss) {
                logMessage(`The ${enemy.name}'s mind is too strong to break!`);
                hit = true;
                break;
            }

            // Found a target!
            hit = true;

            // --- 3. Calculate Success Chance ---
            const successChance = Math.min(0.75, player.charisma * 0.05); // Scales with Charisma

            if (Math.random() < successChance) {
                // --- SUCCESS ---
                logMessage(`You assault the ${enemy.name}'s mind! It goes mad!`);
                enemy.madnessTurns = 5; // Set status for 5 turns

            } else {
                // --- FAILURE ---
                logMessage(`The ${enemy.name} resists your mental assault!`);
            }
            break; // Stop looping, we found our target
        } else if (tile !== theme.floor) {
            // Hit a wall, stop the loop
            break;
        }
    }

    if (!hit) {
        logMessage("You assault the minds of... nothing.");
    }

    // --- 4. Finalize Turn ---
    playerRef.update({
        psyche: player.psyche
    });
    triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    triggerAbilityCooldown('inflictMadness');
    endPlayerTurn();
    render();
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

/**
 * Sets the cooldown for a skill or spell and updates the DB/UI.
 */

function triggerAbilityCooldown(abilityId) {
    const data = SKILL_DATA[abilityId] || SPELL_DATA[abilityId];

    if (data && data.cooldown) {
        // Initialize object if it doesn't exist
        if (!gameState.player.cooldowns) gameState.player.cooldowns = {};

        // Set the turns
        gameState.player.cooldowns[abilityId] = data.cooldown;

        // Update Database
        playerRef.update({ cooldowns: gameState.player.cooldowns });

        // Update UI (Safeguard in case you haven't added the Hotbar UI yet)
        if (typeof renderHotbar === 'function') renderHotbar();
    }
}
