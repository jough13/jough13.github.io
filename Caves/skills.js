// --- START OF FILE skills.js ---

/**
 * Handles all skill logic based on SKILL_DATA
 * and the player's skillbook.
 * @param {string} skillId - The ID of the skill to use (e.g., "brace").
 */

function useSkill(skillId) {
    const player = gameState.player;
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[skillId] : null; 

    if (!skillData) {
        logMessage("{red:Unknown skill. (No skill data found)}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    if (player.cooldowns && player.cooldowns[skillId] > 0) {
        logMessage(`{gray:That skill is not ready yet (${player.cooldowns[skillId]} turns).}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const skillLevel = player.skillbook[skillId] || 0; 

    // Ranged attack is an innate skill granted by equipping a bow, no level needed
    if (skillLevel === 0 && skillId !== 'ranged_attack') {
        logMessage("{gray:You don't know that skill.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 1. Check Player Level Requirement ---
    if (player.level < skillData.requiredLevel) {
        logMessage(`{red:You must be Level ${skillData.requiredLevel} to use this skill.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 2. Check Resource Cost ---
    const cost = skillData.cost;
    const costType = skillData.costType; 

    if (player[costType] < cost) {
        logMessage(`{red:You don't have enough ${costType} to use that.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return; 
    }

    // --- ROBUSTNESS WIN: Hotbar Weapon Verification via Tags ---
    const wpn = player.equipment.weapon || {};
    const wpnTags = wpn.tags || [];
    
    if (skillId === 'deflect' && !wpnTags.includes('blade')) {
        logMessage("{red:You must equip a bladed weapon to use Deflect.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    if (skillId === 'channel' && !wpnTags.includes('staff')) {
        logMessage("{red:You must equip a Staff to use Channel.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 3. Handle Targeting ---
    if (skillData.target === 'aimed') {
        // --- Aimed Skills (e.g., Lunge) ---
        // Cost is checked, but *not* deducted. execute functions will deduct it.
        gameState.isAiming = true;
        gameState.abilityToAim = skillId; 
        
        const skillModal = document.getElementById('skillModal');
        if (skillModal) skillModal.classList.add('hidden');
        
        logMessage(`{yellow:${skillData.name}: Press an arrow key or WASD to use. (Esc) to cancel.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playHover();
        return; 

    } else if (skillData.target === 'self') {
        // --- Self-Cast Skills (e.g., Brace) ---
        player[costType] -= cost; 
        let skillUsedSuccessfully = false;

        // --- 4. Execute Skill Effect ---
        switch (skillId) {
            case 'brace': {
                if (player.defenseBonusTurns > 0) {
                    logMessage("{gray:You are already bracing!}");
                    break;
                }
                const defenseBonus = Math.floor(skillData.baseDefense + (player.constitution * 0.5 * skillLevel));
                player.defenseBonus = defenseBonus;
                player.defenseBonusTurns = skillData.duration;

                logMessage(`{gray:You brace for impact, gaining +${defenseBonus} Defense!}`);

                if (typeof playerRef !== 'undefined') {
                    playerRef.update({
                        defenseBonus: player.defenseBonus,
                        defenseBonusTurns: player.defenseBonusTurns
                    });
                }
                skillUsedSuccessfully = true;
                break;
            }
            case 'channel': {
                let manaGain = 5 + (player.wits * 2);
                
                // --- EXPANSION WIN: Archmage Synergy ---
                if (player.talents && player.talents.includes('mana_flow')) {
                    manaGain += 5;
                    logMessage("{purple:Your Mana Flow talent deepens the channel!}");
                }
                
                player.mana = Math.min(player.maxMana, player.mana + manaGain);
                logMessage(`{blue:You channel energy... +${manaGain} Mana.}`);
                
                if (typeof statDisplays !== 'undefined') triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `+${manaGain}`, '#3b82f6');
                
                skillUsedSuccessfully = true;
                break;
            }
            case 'deflect': {
                player.thornsValue = 100; // Reflect huge damage
                player.thornsTurns = 1;   // Only for the very next turn/hit
                logMessage("{gray:You raise your blade, ready to deflect the next blow.}");
                
                if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('light');
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(player.x, player.y, "STANCE", "#9ca3af");
                    // JUICE WIN: Glowing blue aura indicates the stance is active
                    for(let i = 0; i < 8; i++) {
                        const angle = (Math.PI / 4) * i;
                        ParticleSystem.spawn(player.x + Math.cos(angle) * 1.2, player.y + Math.sin(angle) * 1.2, '#93c5fd', 'dust', '', 4);
                    }
                }
                
                skillUsedSuccessfully = true;
                break;
            }
            case 'vanish': {
                player.stealthTurns = skillData.duration;
                logMessage("{gray:You throw a smoke bomb and vanish from sight!}");
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#9ca3af', 20);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.3, 0.1, 800);
                if (typeof playerRef !== 'undefined') playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;
            }
            case 'stealth': {
                player.stealthTurns = skillData.duration;
                logMessage("{gray:You fade into the shadows... (Invisible)}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 400);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#374151', 10);
                if (typeof playerRef !== 'undefined') playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;
            }
            case 'adrenaline': {
                const stamGain = 10;
                player.stamina = Math.min(player.maxStamina, player.stamina + stamGain);
                logMessage(`{green:You push past the pain! (+10 Stamina)}`);
                if (typeof statDisplays !== 'undefined') triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal(); 
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `+10`, '#facc15');
                skillUsedSuccessfully = true;
                break;
            }
            case 'whirlwind': {
                let baseDmg = (player.strength + player.dexterity) * skillLevel;
                
                // --- LORE & EXPANSION WIN: Two-Handed Whirlwind Synergy ---
                if (player.equipment.weapon && player.equipment.weapon.isTwoHanded) {
                    baseDmg = Math.floor(baseDmg * 1.5);
                    logMessage("{orange:Your massive two-handed weapon creates a devastating sweep!}");
                } else {
                    logMessage("{red:You spin in a deadly vortex!}");
                }
                
                if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy');
                gameState.screenShake = 15; // JUICE: Heavy screen shake
                
                // JUICE: Radial particle burst
                if (typeof ParticleSystem !== 'undefined') {
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI / 4) * i;
                        const pColor = (player.equipment.weapon && player.equipment.weapon.isTwoHanded) ? '#f97316' : '#d4d4d8';
                        ParticleSystem.spawn(player.x + Math.cos(angle)*1.5, player.y + Math.sin(angle)*1.5, pColor, 'dust', '', 5);
                    }
                }

                // Create an array to hold all the async combat promises
                const whirlwindPromises = [];

                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue; 
                        const tx = player.x + x;
                        const ty = player.y + y;

                        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                            const enemyId = `overworld:${tx},${-ty}`;
                            const liveEnemy = gameState.sharedEnemies[enemyId];
                            const tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(tx, ty);
                            
                            const enemyData = ENEMY_DATA[tile];
                            if (enemyData) {
                                const finalDmg = Math.max(1, baseDmg - (enemyData.defense || 0));
                                whirlwindPromises.push(handleOverworldCombat(tx, ty, enemyData, tile, finalDmg));
                            }
                        } else {
                            let enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
                            if (enemy) {
                                enemy.health = Number(enemy.health);
                                if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;

                                const finalDmg = Math.max(1, baseDmg - (enemy.defense || 0));
                                enemy.health -= finalDmg;
                                logMessage(`Whirlwind hits ${enemy.name} for {red:${finalDmg}}!`);
                                
                                if (typeof ParticleSystem !== 'undefined') {
                                    ParticleSystem.createExplosion(tx, ty, '#ef4444', 3); // Blood spray
                                    ParticleSystem.createFloatingText(tx, ty, `-${finalDmg}`, '#ef4444');
                                }

                                if (enemy.health <= 0) {
                                    logMessage(`You defeated ${enemy.name}!`);
                                    if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, tx, ty);
                                }
                            }
                        }
                    }
                }

                if (whirlwindPromises.length > 0) {
                    Promise.all(whirlwindPromises).catch(e => console.error("Whirlwind Sync Error:", e));
                } else if (gameState.mapMode === 'overworld') {
                    logMessage("{gray:You whirl through empty air.}");
                }

                skillUsedSuccessfully = true;
                break;
            }
        }

        // --- 5. Finalize Self-Cast Turn ---
        if (skillUsedSuccessfully) {
            if (typeof playerRef !== 'undefined') playerRef.update({ [costType]: player[costType] }); 
            if (typeof statDisplays !== 'undefined') triggerStatFlash(statDisplays.stamina, false); 
            
            const skillModal = document.getElementById('skillModal');
            if (skillModal) skillModal.classList.add('hidden');
            
            triggerAbilityCooldown(skillId);
            if (typeof endPlayerTurn === 'function') endPlayerTurn();
            if (typeof renderEquipment === 'function') renderEquipment(); 
        } else {
            // Refund stamina if skill failed 
            player[costType] += cost;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
    }
}

async function executeMeleeSkill(skillId, dirX, dirY) {
    const player = gameState.player;
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[skillId] : null;
    const skillLevel = player.skillbook[skillId] || 1;

    let hit = false;
    if (!skillData) return;
    
    // --- ROBUSTNESS WIN: Sub-skill requirements ---
    if (skillId === 'shieldBash') {
        const offhand = player.equipment.offhand || {};
        const offhandTags = offhand.tags || [];
        
        if (!offhandTags.includes('shield')) {
            logMessage("{red:You must have a Shield equipped in your off-hand to use Shield Bash!}");
            gameState.isAiming = false;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }
    }

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // 🚨 SECURITY FIX: Re-verify resource cost!
        if (player[skillData.costType] < skillData.cost) {
            logMessage(`{red:You lack the ${skillData.costType} to execute this skill!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // Calculate Damage
        const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
        const playerStrength = player.strength + (player.strengthBonus || 0);

        let rawPower = playerStrength + weaponDamage;

        // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
        if (typeof getPlayerDamageModifier === 'function') {
            rawPower = getPlayerDamageModifier(rawPower);
        }

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
            // Cleave visual
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.spawn(targetX, targetY, '#e5e7eb', 'dust', '', 4);
                ParticleSystem.spawn(enemiesToHit[1].x, enemiesToHit[1].y, '#e5e7eb', 'dust', '', 3);
                ParticleSystem.spawn(enemiesToHit[2].x, enemiesToHit[2].y, '#e5e7eb', 'dust', '', 3);
            }
        }

        const combatPromises = [];

        for (const coords of enemiesToHit) {
            let tile;
            let map;
            
            if (typeof chunkManager === 'undefined') break; // Safety fallback

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

            const enemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[tile] : null;
            if (enemyData) {

                if (player.stealthTurns > 0) {
                    player.stealthTurns = 0;
                    logMessage("You emerge from the shadows!");
                    if (typeof playerRef !== 'undefined') playerRef.update({ stealthTurns: 0 });
                }

                hit = true;

                // Apply Damage
                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                    const mitigatedDmg = Math.max(1, finalDmg - (enemyData.defense || 0));
                    if (typeof handleOverworldCombat === 'function') {
                        combatPromises.push(handleOverworldCombat(coords.x, coords.y, enemyData, tile, mitigatedDmg));
                    }
                } else {
                    let enemy = gameState.instancedEnemies.find(e => e.x === coords.x && e.y === coords.y);
                    if (enemy) {
                        enemy.health = Number(enemy.health);
                        if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;

                        // ▼ Subtract Defense ▼
                        const mitigatedDmg = Math.max(1, finalDmg - (enemy.defense || 0));
                        enemy.health -= mitigatedDmg;
                        logMessage(`You hit ${enemy.name} for {red:${mitigatedDmg}} damage!`);
                        
                        if (typeof ParticleSystem !== 'undefined') {
                            // JUICE WIN: Unique particle color based on the skill
                            let pColor = '#ef4444'; // Default Blood Red
                            if (skillId === 'kick') pColor = '#facc15'; // Yellow stun sparks
                            if (skillId === 'shieldBash') pColor = '#d4d4d8'; // Grey shield splinters
                            
                            ParticleSystem.createExplosion(coords.x, coords.y, pColor, 6);
                            ParticleSystem.createFloatingText(coords.x, coords.y, `-${mitigatedDmg}`, '#ef4444');
                        }

                        // --- EXPANSION WIN: APPLY STUN & JUICE (Shield Bash, Crush, OR Kick) ---
                        if (skillId === 'shieldBash' || skillId === 'crush' || skillId === 'kick') {
                            // Heavy Hit Feel
                            gameState.screenShake = (skillId === 'kick') ? 8 : 15; 
                            
                            if (!enemy.isBoss) {
                                // Kick stuns for 2 turns, heavy bashes stun for 3
                                enemy.stunTurns = (skillId === 'kick') ? 2 : 3;
                                logMessage(`{yellow:${enemy.name} is stunned!}`);
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(coords.x, coords.y, "STUNNED", "#facc15");
                            } else {
                                logMessage(`{gray:The boss shrugs off your stun attempt!}`);
                            }
                        }

                        if (enemy.health <= 0) {
                            logMessage(`You defeated ${enemy.name}!`);
                            if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, coords.x, coords.y);
                        }
                    }
                }
            }
        }

        // Await all overworld combats concurrently
        if (combatPromises.length > 0) {
            await Promise.all(combatPromises);
        }

        if (!hit) {
            logMessage("{gray:You swing at empty air.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('light');
        } else {
            // Only deduct stamina if a target was actually engaged
            player[skillData.costType] -= skillData.cost;
            if (typeof AudioSystem !== 'undefined') {
                if (skillId === 'crush' || skillId === 'shieldBash') AudioSystem.playAttack('heavy');
                else if (skillId === 'cleave') AudioSystem.playAttack('sweep');
                else AudioSystem.playAttack('normal');
            }
        }

        triggerAbilityCooldown(skillId);
        if (typeof endPlayerTurn === 'function') endPlayerTurn();
        if (typeof render === 'function') render();

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
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA['ranged_attack'] : null;
    if (!skillData) return;
    
    // --- AMMO CHECK ---
    const ammo = player.equipment.ammo;
    if (!ammo || ammo.quantity <= 0) {
        logMessage("{red:You need to equip arrows to shoot!}");
        gameState.isAiming = false;
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- WEAPON CHECK VIA TAGS ---
    const weapon = player.equipment.weapon || {};
    const wpnTags = weapon.tags || [];
    
    if (!wpnTags.includes('bow') && !wpnTags.includes('crossbow')) {
        logMessage("{red:You must have a bow or crossbow equipped to shoot!}");
        gameState.isAiming = false;
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // 🚨 SECURITY FIX: Re-verify resource cost!
        if (player.stamina < skillData.cost) {
            logMessage(`{red:You lack the stamina to draw the string!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // --- 1. Deduct Cost ---
        player.stamina -= skillData.cost;
        let hitSomething = false;
        let finalTargetX = player.x;
        let finalTargetY = player.y;

        // --- 2. Calculate Base Damage & Elements ---
        const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
        const ammoDamage = ammo.damage || 0;
        
        const isFire = ammo.name.includes('Fire');
        const isPoison = ammo.name.includes('Poison');
        const isHeavyCrossbow = wpnTags.includes('armor_piercing');

        let arrowColor = '#d4d4d8'; // Default grey
        if (isFire) arrowColor = '#f97316';   // Orange
        if (isPoison) arrowColor = '#22c55e'; // Green
        
        // Ranged attacks scale off Dexterity + Bow Dmg + Arrow Dmg
        let rawPower = player.dexterity + weaponDamage + ammoDamage;

        // JUICE: Crossbows hit harder but cause recoil
        if (isHeavyCrossbow) {
            rawPower += 2;
            gameState.screenShake = 8;
        }

        if (player.talents && player.talents.includes('eagle_eye')) {
            rawPower = Math.floor(rawPower * 1.5);
        }
        
        if (player.stealthTurns > 0) {
            player.stealthTurns = 0;
            logMessage("{gray:You fire from the shadows!}");
            if (typeof playerRef !== 'undefined') playerRef.update({ stealthTurns: 0 });
            
            if (player.talents && player.talents.includes('shadow_strike')) {
                rawPower = Math.floor(rawPower * 4);
                logMessage("{purple:Shadow Strike! (4x Damage)}");
            }
        }

        let totalDamage = Math.max(1, rawPower);

        // --- CONSUME AMMO ---
        ammo.quantity--;
        if (ammo.quantity <= 0) {
            logMessage("{red:You fired your last arrow!}");
            // Find it in inventory and remove it
            const invIndex = player.inventory.findIndex(i => i.isEquipped && i.slot === 'ammo');
            if (invIndex > -1) player.inventory.splice(invIndex, 1);
            
            // Explicitly nullify the equipment slot so the UI and combat engine know it's gone
            player.equipment.ammo = null;
        }

        // --- 3. Projectile Loop (Dynamic Range) ---
        if (isHeavyCrossbow) logMessage("THWACK! You fire a heavy bolt!");
        else logMessage("You loose an arrow!");
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playBow(); 
        
        // Pull range from the equipped weapon, fallback to 4
        const maxRange = player.equipment.weapon.range || 4;

        for (let i = 1; i <= maxRange; i++) {
            const targetX = player.x + (dirX * i);
            const targetY = player.y + (dirY * i);

            // --- ANIMATED ARROW TRAIL ---
            if (typeof ParticleSystem !== 'undefined') {
                setTimeout(() => {
                    ParticleSystem.spawn(targetX, targetY, arrowColor, 'dust', '', 3);
                }, i * 40); 
            }

            let tile;
            let isSolid = false;

            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                const enemyId = `overworld:${targetX},${-targetY}`;
                const liveEnemy = gameState.sharedEnemies[enemyId];
                tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
                // Added closed doors '+' and stash boxes '☒' to arrow blockers
                if (['^', 'F', '🧱', '+', '☒'].includes(tile) && !liveEnemy) isSolid = true;
            } else {
                const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
                const theme = typeof CAVE_THEMES !== 'undefined' ? CAVE_THEMES[gameState.currentCaveTheme] : null;
                const wallTile = theme ? theme.wall : '▓';
                if (tile === wallTile || tile === '▒' || tile === '+') isSolid = true;
            }
            
            // --- ENVIRONMENTAL INTERACTIONS (FIRE ARROWS) ---
            if (isFire && tile === '🛢') {
                logMessage("{orange:BOOM! Your Fire Arrow ignited an Oil Barrel!}");
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#f97316', 15);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.4, 0.2, 200);
                
                if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(targetX, targetY, '.');
                else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = '.';
                else chunkManager.castleMaps[gameState.currentCastleId][targetY][targetX] = '.';
                
                // Splash damage!
                for (let ey = -1; ey <= 1; ey++) {
                    for (let ex = -1; ex <= 1; ex++) {
                        // Make sure applySpellDamage exists
                        if (typeof applySpellDamage === 'function') {
                            applySpellDamage(targetX + ex, targetY + ey, 15, 'fireball');
                        }
                    }
                }
                hitSomething = true;
                break;
            } else if (isFire && tile === '≈' && Math.random() < 0.15) {
                // SWAMP GAS EXPLOSION
                logMessage("{orange:The arrow ignites a pocket of swamp gas!}");
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#facc15', 10);
                if (typeof applySpellDamage === 'function') applySpellDamage(targetX, targetY, 10, 'fireball'); // AoE damage
                hitSomething = true;
                break;
            }
            
            if (isFire && gameState.mapMode === 'dungeon' && tile === '🕸') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                const theme = CAVE_THEMES[gameState.currentCaveTheme];
                if (map && map[targetY]) {
                    map[targetY][targetX] = theme.floor;
                    logMessage("{orange:Your Fire Arrow burns away the spider web!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#f97316', 3);
                    hitSomething = true;
                    break;
                }
            }

            if (isSolid) {
                logMessage("{gray:Your arrow strikes a solid object.}");
                break;
            }

            const enemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[tile] : null;

            if (enemyData) {
                hitSomething = true;
                
                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                    const finalDmg = Math.max(1, totalDamage - (enemyData.defense || 0));
                    if (typeof handleOverworldCombat === 'function') {
                        await handleOverworldCombat(targetX, targetY, enemyData, tile, finalDmg);
                    }
                } else {
                    let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
                    if (enemy) {
                        // SAFEGUARD
                        enemy.health = Number(enemy.health);
                        if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;

                        const finalDmg = Math.max(1, totalDamage - (enemy.defense || 0));
                        enemy.health -= finalDmg;
                        logMessage(`You shoot ${enemy.name} for {red:${finalDmg}} damage!`);
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createExplosion(targetX, targetY, arrowColor, 3);
                            ParticleSystem.createFloatingText(targetX, targetY, `-${finalDmg}`, '#ef4444');
                        }
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();

                        // --- ELEMENTAL STATUS EFFECTS ---
                        if (isFire) {
                            logMessage(`{orange:The ${enemy.name} is scorched by the flames!}`);
                        }
                        if (isPoison && enemy.poisonTurns <= 0) {
                            enemy.poisonTurns = 3;
                            logMessage(`{green:The ${enemy.name} is poisoned!}`);
                        }

                        if (enemy.health <= 0) {
                            logMessage(`You defeated ${enemy.name}!`);
                            if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, targetX, targetY);
                        }
                    }
                }

                // --- EXPANSION WIN: Crossbow Piercing ---
                // If it's a heavy crossbow, the bolt punches through to the next tile but loses 50% damage!
                if (isHeavyCrossbow && totalDamage > 1) {
                    logMessage(`{orange:The heavy bolt pierces right through!}`);
                    totalDamage = Math.floor(totalDamage * 0.5); 
                    // We DO NOT break here, allowing the loop to continue to the next tile!
                } else {
                    break; // Standard arrows stop after hitting one target
                }
            }
            
            finalTargetX = targetX;
            finalTargetY = targetY;
        }

        if (!hitSomething) {
            logMessage("{gray:Your arrow flies off into the distance.}");
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createFloatingText(finalTargetX, finalTargetY, "Miss", "#9ca3af");
            }
            
            // --- RECOVERABLE AMMO ---
            // 50% chance the arrow survives... ONLY IF IT'S A WOODEN ARROW! (Fire burns, poison dissipates)
            if (ammo.name === 'Wooden Arrow' && Math.random() < 0.50) {
                let validFloor = true;
                let dropTile;
                
                if (gameState.mapMode === 'overworld') dropTile = chunkManager.getTile(finalTargetX, finalTargetY);
                else {
                    const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                    dropTile = (map && map[finalTargetY] && map[finalTargetY][finalTargetX]) ? map[finalTargetY][finalTargetX] : ' ';
                }

                // If it hits deep water or lava, it's gone. Otherwise, it sticks in the ground/wall!
                if (['~', '≈', ' '].includes(dropTile)) validFloor = false; 

                // --- Prevent arrows from overwriting items OR ENEMIES already on the ground! ---
                if ((typeof ITEM_DATA !== 'undefined' && ITEM_DATA[dropTile]) || 
                    (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[dropTile]) || 
                    ['📦', '⚰️', '🏺', '🚪', '🔼'].includes(dropTile)) {
                    validFloor = false; 
                }

                if (validFloor) {
                    if (typeof chunkManager !== 'undefined' && typeof chunkManager.setWorldTile === 'function') {
                        chunkManager.setWorldTile(finalTargetX, finalTargetY, '➹', 2); // Drops for 2 hours
                    }
                    gameState.mapDirty = true;
                    logMessage("{gray:You see your arrow sticking out of the ground nearby.}");
                }
            }
        }

        // --- 4. Finalize Turn ---
        if (typeof playerRef !== 'undefined') {
            playerRef.update({
                stamina: player.stamina,
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory // Sync ammo removal
            });
        }
        if (typeof statDisplays !== 'undefined') triggerStatFlash(statDisplays.stamina, false); 
        
        if (typeof endPlayerTurn === 'function') endPlayerTurn(); 
        if (typeof renderEquipment === 'function') renderEquipment(); // Refresh UI ammo count
        if (typeof render === 'function') render(); 

    } finally {
        // --- 🚨 UNLOCK THE ENGINE ---
        isProcessingMove = false;
    }
}

async function executeLunge(dirX, dirY) {
    const player = gameState.player;
    const skillId = "lunge"; 
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[skillId] : null;
    const skillLevel = player.skillbook[skillId] || 1;

    let hit = false;
    if (!skillData) return;

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // 🚨 SECURITY FIX: Re-verify resource cost!
        if (player.stamina < skillData.cost) {
            logMessage(`{red:You lack the stamina to lunge!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // --- 1. Deduct Cost ---
        player.stamina -= skillData.cost;

        // --- 2. Calculate Base Damage ---
        const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
        const playerStrength = player.strength + (player.strengthBonus || 0);

        let rawPower = playerStrength + weaponDamage;

        // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
        if (typeof getPlayerDamageModifier === 'function') {
            rawPower = getPlayerDamageModifier(rawPower);
        }
        const playerBaseDamage = rawPower;

        // PERFORMANCE WIN: Fast-path target loop breaks instantly on walls!
        for (let i = 2; i <= 3; i++) {
            const targetX = player.x + (dirX * i);
            const targetY = player.y + (dirY * i);

            // JUICE: Dust Trail
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.spawn(player.x + (dirX * (i-1)), player.y + (dirY * (i-1)), '#d4d4d8', 'dust', '', 4);
            }

            let tile;
            let isSolid = false;
            
            if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
                const theme = typeof CAVE_THEMES !== 'undefined' ? CAVE_THEMES[gameState.currentCaveTheme] : null;
                const wallTile = theme ? theme.wall : '▓';
                if (tile === wallTile || tile === '▒' || tile === '+') isSolid = true;
            } else if (gameState.mapMode === 'castle') {
                const map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
                if (tile === '▓' || tile === '▒' || tile === '+') isSolid = true;
            } else {
                const enemyId = `overworld:${targetX},${-targetY}`;
                const liveEnemy = gameState.sharedEnemies[enemyId];
                tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
                if (['^', 'F', '🧱', '+', '☒'].includes(tile) && !liveEnemy) isSolid = true;
            }

            if (isSolid) {
                logMessage("{gray:Your lunge is blocked by a solid object.}");
                break;
            }

            const enemyData = typeof ENEMY_DATA !== 'undefined' ? ENEMY_DATA[tile] : null;

            if (enemyData) {
                if (player.stealthTurns > 0) {
                    player.stealthTurns = 0;
                    logMessage("{gray:You strike from the shadows!}");
                    if (typeof playerRef !== 'undefined') playerRef.update({ stealthTurns: 0 });
                }

                logMessage(`You lunge and attack the ${enemyData.name}!`);
                hit = true;

                // --- 3. Calculate Final Damage ---
                const baseLungeDamage = playerBaseDamage * skillData.baseDamageMultiplier;
                const finalDmg = Math.max(1, Math.floor(baseLungeDamage + (player.strength * skillLevel)));
                const totalLungeDamage = Math.max(1, finalDmg - (enemyData.defense || 0));

                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                    if (typeof handleOverworldCombat === 'function') {
                        await handleOverworldCombat(targetX, targetY, enemyData, tile, totalLungeDamage);
                    }
                } else {
                    let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
                    if (enemy) {
                        enemy.health = Number(enemy.health);
                        if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;

                        enemy.health -= totalLungeDamage;
                        logMessage(`You hit the ${enemy.name} for {red:${totalLungeDamage}} damage!`);
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createExplosion(targetX, targetY, '#ef4444', 4); 
                            ParticleSystem.createFloatingText(targetX, targetY, `-${totalLungeDamage}`, '#ef4444');
                        }
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('pierce');

                        if (enemy.health <= 0) {
                            logMessage(`You defeated the ${enemy.name}!`);
                            if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, targetX, targetY);
                        }
                    }
                }
                break; 
            }
        }

        if (!hit) {
            logMessage("{gray:You lunge... and hit nothing.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('light');
        } else {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('normal');
        }

        // --- 4. Finalize Turn ---
        if (typeof playerRef !== 'undefined') {
            playerRef.update({ stamina: player.stamina });
        }
        if (typeof statDisplays !== 'undefined') triggerStatFlash(statDisplays.stamina, false); 
        
        triggerAbilityCooldown('lunge');
        if (typeof endPlayerTurn === 'function') endPlayerTurn(); 
        if (typeof render === 'function') render(); 

    } finally {
        isProcessingMove = false;
    }
}

function executeQuickstep(dirX, dirY) {
    const player = gameState.player;
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA['quickstep'] : null;
    if (!skillData) return;

    // 🚨 SECURITY FIX: Re-verify resource cost!
    if (player.stamina < skillData.cost) {
        logMessage(`{red:You are too exhausted to quickstep!}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // Move 2 tiles
    const targetX = player.x + (dirX * 2);
    const targetY = player.y + (dirY * 2);

    // Check collision
    let tile = chunkManager.getTile(targetX, targetY);
    
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        tile = map[targetY][targetX];
    } else if (gameState.mapMode === 'castle') {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        tile = map[targetY][targetX];
    }

    // MECHANIC & JUICE WIN: Dagger Flurry
    // If you quickstep directly INTO an enemy, you unleash a flurry of slashes and bounce back!
    if (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tile]) {
        logMessage("{purple:You dash forward, unleashing a flurry of strikes, and bounce back!}");
        gameState.screenShake = 5;
        
        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.playAttack('light');
            setTimeout(() => AudioSystem.playAttack('pierce'), 100);
            setTimeout(() => AudioSystem.playAttack('light'), 200);
        }

        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(targetX, targetY, '#d4d4d8', 8); // Flurry slashes
            ParticleSystem.createExplosion(targetX, targetY, '#ef4444', 4); // Blood
        }

        // Apply a solid chunk of damage immediately using the magic loop
        // We use applySpellDamage here to ensure the transaction and XP are handled safely!
        const flurryDamage = Math.floor(player.dexterity * 1.5) + (player.equipment.weapon?.damage || 0);
        
        // Wrap this inside a small timeout to let the dash finish visually before the damage registers
        setTimeout(async () => {
            await applySpellDamage(targetX, targetY, flurryDamage, 'quickstep');
            
            // Add poison if we have a poisoned dagger
            if (player.equipment.weapon?.inflicts === 'poison') {
                if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                    const e = gameState.instancedEnemies.find(en => en.x === targetX && en.y === targetY);
                    if (e) e.poisonTurns = 3;
                }
            }
        }, 50);

        player.stamina -= skillData.cost;
        triggerAbilityCooldown('quickstep');
        if (typeof endPlayerTurn === 'function') endPlayerTurn();
        if (typeof render === 'function') render();
        return;
    }

    // NORMAL QUICKSTEP
    if (['.', 'F', 'd', 'D'].includes(tile) || (gameState.mapMode === 'dungeon' && tile !== '▓' && tile !== '▒')) {
        player.x = targetX;
        player.y = targetY;
        player.stamina -= skillData.cost;
        logMessage("{cyan:You dash forward with blinding speed!}");
        
        // JUICE: Smoke Trail
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.spawn(player.x - dirX, player.y - dirY, '#f8fafc', 'smoke', '', 4);
            ParticleSystem.createExplosion(player.x, player.y, '#fff', 5);
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('light');

        triggerAbilityCooldown('quickstep');
        if (typeof endPlayerTurn === 'function') endPlayerTurn();
        if (typeof render === 'function') render();
    } else {
        logMessage("{gray:Path blocked.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        gameState.isAiming = false; // Reset aiming
    }
}

function executePacify(dirX, dirY) {
    const player = gameState.player;
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA["pacify"] : null;
    if (!skillData) return;

    // 🚨 SECURITY FIX: Re-verify resource cost!
    if (player.psyche < skillData.cost) {
        logMessage(`{red:Your mind is too clouded to cast this. (Not enough Psyche)}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 1. Deduct Cost ---
    player.psyche -= skillData.cost;
    let hit = false;

    // Loop 1 to 3 tiles away
    for (let i = 1; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        // This skill only works in instanced maps
        if (gameState.mapMode === 'overworld') {
            logMessage("{red:This skill only works in dungeons and castles.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            hit = true; // Prevents the "miss" message
            break;
        }

        let map;
        let theme;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            theme = typeof CAVE_THEMES !== 'undefined' ? CAVE_THEMES[gameState.currentCaveTheme] || { floor: '.' } : { floor: '.' };
        } else {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            theme = { floor: '.' };
        }

        const tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        const enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        
        // PERFORMANCE WIN: Fast-path target loop breaks instantly on walls!
        if (tile === '▓' || tile === '▒' || tile === '🧱') break;

        if (enemy) {
            if (enemy.isBoss) {
                logMessage(`{red:The ${enemy.name} is immune to your charms!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
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
                // LORE WIN: Instead of deleting them, we transform them into passive entities
                logMessage(`{green:You soothe the ${enemy.name}'s rage! It becomes dazed.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(targetX, targetY, "DAZED", "#4ade80");
                
                // Reward the player for dealing with the encounter non-lethally!
                if (typeof grantXp === 'function') grantXp(Math.floor(enemy.xp * 0.8));

                // Change their AI status to idle permanently
                enemy.name = `Dazed ${enemy.name}`;
                enemy.attack = 0;
                enemy.caster = false;
                enemy.color = '#9ca3af'; // Grey out

            } else {
                // --- FAILURE ---
                logMessage(`{red:Your attempt to pacify the ${enemy.name} fails!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            }
            break; // Stop looping, we found our target
        }
    }

    if (!hit) {
        logMessage("{gray:You attempt to calm... nothing.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    }

    // --- 4. Finalize Turn ---
    if (typeof playerRef !== 'undefined') playerRef.update({ psyche: player.psyche });
    if (typeof statDisplays !== 'undefined') triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    
    triggerAbilityCooldown('pacify');
    if (typeof endPlayerTurn === 'function') endPlayerTurn();
    if (typeof render === 'function') render();
}

function executeTame(dirX, dirY) {
    const player = gameState.player;
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA["tame"] : null;
    if (!skillData) return;

    // 🚨 SECURITY FIX: Re-verify resource cost!
    if (player.psyche < skillData.cost) {
        logMessage(`{red:Your mind is too clouded to tame this beast. (Not enough Psyche)}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // 1. Deduct Cost
    player.psyche -= skillData.cost;
    let hit = false;

    // Range: 1-2 tiles
    for (let i = 1; i <= 2; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        // Check for instanced enemies (Dungeon/Castle)
        if (gameState.mapMode === 'overworld') {
            logMessage("{red:The beast is too wild here. Drive it into a cave first.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            hit = true;
            break;
        }

        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

        if (enemy) {
            hit = true;

            // --- EXPANSION WIN: Expanded list of Tameable Beasts ---
            const beastTiles = ['w', '@', '🦂', '🐺', '🐗', '🐸', '🦇', '🦌'];
            
            if (!beastTiles.includes(enemy.tile)) {
                logMessage("{red:You can only tame beasts!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                break;
            }

            // Check HP Threshold (30%)
            const hpPercent = enemy.health / enemy.maxHealth;
            if (hpPercent > 0.30) {
                logMessage(`{red:The ${enemy.name} is too healthy to tame! Weaken it first.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                break;
            }

            // Success Roll
            const tameChance = 0.3 + (player.charisma * 0.05); // Base 30% + 5% per Charisma
            if (Math.random() < tameChance) {
                logMessage(`{green:You calm the ${enemy.name}... It accepts you as its master!}`);
                
                // --- MOUNT EXPANSION ---
                const rideableBeasts = ['w', '🐺', '🐻', 'Ø', '🦖', '🐗', '@', '🕷️', '🧌', '🐲'];
                const isRideable = rideableBeasts.includes(enemy.tile);
                if (isRideable) {
                    setTimeout(() => logMessage(`{cyan:This beast is large enough to ride! Press [Z] to Mount.}`), 500);
                }

                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(targetX, targetY, "TAMED!", "#4ade80");

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
                
                // Clear the map tile so it doesn't leave a ghost sprite
                let map = gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                let validFloor = '.';
                if (gameState.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[gameState.currentCaveTheme]) {
                    validFloor = CAVE_THEMES[gameState.currentCaveTheme].floor;
                }
                map[targetY][targetX] = validFloor;
                
                if (typeof playerRef !== 'undefined') playerRef.update({ companion: player.companion });

            } else {
                logMessage(`{red:The ${enemy.name} resists your call and snaps at you!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            }
            break;
        }
    }

    if (!hit) {
        logMessage("{gray:You try to tame the empty air.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    }

    if (typeof playerRef !== 'undefined') playerRef.update({ psyche: player.psyche });
    triggerAbilityCooldown('tame');
    if (typeof endPlayerTurn === 'function') endPlayerTurn();
    if (typeof render === 'function') render();
}

/**
 * Executes the Inflict Madness skill on a target
 * after the player chooses a direction.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

function executeInflictMadness(dirX, dirY) {
    const player = gameState.player;
    const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA["inflictMadness"] : null;
    if (!skillData) return;

    // 🚨 SECURITY FIX: Re-verify resource cost!
    if (player.psyche < skillData.cost) {
        logMessage(`{red:Your mind is too clouded to assault another's. (Not enough Psyche)}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 1. Deduct Cost ---
    player.psyche -= skillData.cost;
    let hit = false;

    // Loop 1 to 3 tiles away
    for (let i = 1; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        if (gameState.mapMode === 'overworld') {
            logMessage("{red:This skill only works in dungeons and castles.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            hit = true;
            break;
        }

        let map;
        let theme;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            theme = typeof CAVE_THEMES !== 'undefined' ? CAVE_THEMES[gameState.currentCaveTheme] || { floor: '.' } : { floor: '.' };
        } else {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            theme = { floor: '.' };
        }

        const tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        const enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        
        // PERFORMANCE WIN: Fast-path target loop breaks instantly on walls!
        if (tile === '▓' || tile === '▒' || tile === '🧱') break;

        if (enemy) {

            if (enemy.isBoss) {
                logMessage(`{red:The ${enemy.name}'s mind is too strong to break!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                hit = true;
                break;
            }

            // Found a target!
            hit = true;

            // --- 3. Calculate Success Chance ---
            const successChance = Math.min(0.75, player.charisma * 0.05); // Scales with Charisma

            if (Math.random() < successChance) {
                // --- SUCCESS ---
                logMessage(`{purple:You assault the ${enemy.name}'s mind! It goes mad!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(targetX, targetY, "MADNESS", "#a855f7");
                enemy.madnessTurns = 5; // Set status for 5 turns

            } else {
                // --- FAILURE ---
                logMessage(`{gray:The ${enemy.name} resists your mental assault!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            }
            break; // Stop looping, we found our target
        }
    }

    if (!hit) {
        logMessage("{gray:You assault the minds of... nothing.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    }

    // --- 4. Finalize Turn ---
    if (typeof playerRef !== 'undefined') {
        playerRef.update({ psyche: player.psyche });
    }
    if (typeof statDisplays !== 'undefined') triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    
    triggerAbilityCooldown('inflictMadness');
    if (typeof endPlayerTurn === 'function') endPlayerTurn();
    if (typeof render === 'function') render();
}

/**
 * Sets the cooldown for a skill or spell and updates the DB/UI.
 */
function triggerAbilityCooldown(abilityId) {
    const data = (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) || (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]);

    if (data && data.cooldown) {
        // Initialize object if it doesn't exist
        if (!gameState.player.cooldowns) gameState.player.cooldowns = {};

        let cd = data.cooldown;

        // --- Class specific Cooldown Reduction! ---
        if (gameState.player.talents) {
            // Rogues with Evasion recover movement skills faster
            if (data.type === 'movement' && gameState.player.talents.includes('evasion')) {
                cd = Math.max(1, cd - 1);
            }
            // Archmages recover spells faster
            if (data.costType === 'mana' && gameState.player.talents.includes('mana_flow')) {
                cd = Math.max(1, cd - 1);
            }
        }

        // Set the turns
        gameState.player.cooldowns[abilityId] = cd;

        // Update Database
        if (typeof playerRef !== 'undefined') {
            playerRef.update({ cooldowns: gameState.player.cooldowns });
        }

        if (typeof renderHotbar === 'function') renderHotbar();
    }
}

// --- SECURITY & PERFORMANCE: Event Delegation ---
// Attaches exactly ONE listener to the skillbook list, bypassing inline DOM bindings.
window.initSkillbookListeners = function() {
    const skillListEl = document.getElementById('skillList');
    if (skillListEl && !skillListEl.dataset.listenersBound) {
        skillListEl.addEventListener('click', (e) => {
            const skillItem = e.target.closest('.skill-item');
            if (skillItem && skillItem.dataset.skill) {
                useSkill(skillItem.dataset.skill);
            }
        });
        skillListEl.dataset.listenersBound = 'true';
    }

    const closeSkillBtn = document.getElementById('closeSkillButton');
    if (closeSkillBtn && !closeSkillBtn.dataset.listenerBound) {
        closeSkillBtn.addEventListener('click', () => {
            const skillModal = document.getElementById('skillModal');
            if (skillModal) skillModal.classList.add('hidden');
            if (document.activeElement) document.activeElement.blur(); 
        });
        closeSkillBtn.dataset.listenerBound = 'true';
    }
};

// --- END OF FILE skills.js ---
