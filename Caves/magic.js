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
        if (player[costType] <= cost) {
            logMessage("{red:You are too weak to sacrifice your life-force.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }
    } else if (player[costType] < cost) {
        logMessage(`{red:You don't have enough ${costType} to cast that.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- 2. Handle Targeting ---
    if (spellData.target === 'aimed') {
        gameState.isAiming = true;
        gameState.abilityToAim = spellId;
        spellModal.classList.add('hidden');
        logMessage(`{blue:${spellData.name}: Press an arrow key or WASD to fire. (Esc) to cancel.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playHover();
        return;

    } else if (spellData.target === 'self') {
        // --- Self-Cast Spells ---
        player[costType] -= cost; 
        let spellCastSuccessfully = false;
        let updates = {}; 

        // --- 3. Execute Spell Effect ---
        switch (spellId) {

            case 'stoneSkin':
                const skinBonus = 3 + Math.floor(player.constitution * 0.2);
                player.defenseBonus = (player.defenseBonus || 0) + skinBonus;
                player.defenseBonusTurns = spellData.duration;

                logMessage(`{gray:Your skin turns to granite! (+${skinBonus} Defense)}`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-gray'); 

                updates.defenseBonus = player.defenseBonus;
                updates.defenseBonusTurns = player.defenseBonusTurns;
                spellCastSuccessfully = true;
                break;

            case 'thornSkin':
                const reflectAmount = spellData.baseReflect + (player.intuition * spellLevel);
                player.thornsValue = reflectAmount;
                player.thornsTurns = spellData.duration;
                logMessage(`{green:Your skin hardens! (Reflect ${reflectAmount} dmg)}`);

                updates.thornsValue = reflectAmount;
                updates.thornsTurns = spellData.duration;
                spellCastSuccessfully = true;
                break;

            case 'candlelight':
                if (player.candlelightTurns > 0) {
                    logMessage("You renew the magical light.");
                } else {
                    logMessage("{yellow:A warm, floating orb of light appears above you.}");
                }

                player.candlelightTurns = spellData.duration;

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
                player.madnessTurns = 0; 
                player.rootTurns = 0;
                player.burnTurns = 0;

                logMessage("{gold:A holy light bathes you. You are fully restored!}");
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(player.x, player.y, '#facc15', 30); // Massive golden explosion
                    ParticleSystem.createLevelUp(player.x, player.y); 
                }

                updates.health = player.health;
                updates.poisonTurns = 0;
                updates.frostbiteTurns = 0;
                updates.madnessTurns = 0;
                updates.rootTurns = 0;
                updates.burnTurns = 0;
                spellCastSuccessfully = true;
                break;

            case 'lesserHeal':
                const effectiveWits = player.wits + (player.witsBonus || 0);
                const healAmount = spellData.baseHeal + (effectiveWits * spellLevel);
                const oldHealth = player.health;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                const healedFor = player.health - oldHealth;

                if (healedFor > 0) {
                    logMessage(`You cast Lesser Heal and recover {green:${healedFor} health}.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `+${healedFor}`, '#22c55e'); 

                } else {
                    logMessage("{gray:You cast Lesser Heal, but you're already at full health.}");
                }
                updates.health = player.health;
                spellCastSuccessfully = true;
                break;

            case 'arcaneShield':
                if (player.shieldTurns > 0) {
                    logMessage("{gray:You already have an active shield!}");
                    spellCastSuccessfully = false;
                    break;
                }

                const effWitsShield = player.wits + (player.witsBonus || 0);
                const shieldAmount = spellData.baseShield + (effWitsShield * spellLevel);
                player.shieldValue = shieldAmount;
                player.shieldTurns = spellData.duration;

                logMessage(`{blue:You conjure an Arcane Shield, absorbing ${shieldAmount} damage!}`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-blue');

                updates.shieldValue = player.shieldValue;
                updates.shieldTurns = player.shieldTurns;
                spellCastSuccessfully = true;
                break;

            case 'clarity':
                if (gameState.mapMode !== 'dungeon') {
                    logMessage("{gray:You can only feel for secret walls in caves.}");
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
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(checkX, checkY, '#a855f7', 10);
                        }
                    }
                }

                if (foundWall) {
                    logMessage("{purple:You focus your mind... and a hidden passage is revealed!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    render();
                } else {
                    logMessage("You focus, but find no hidden passages nearby.");
                }
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                spellCastSuccessfully = true;
                break;

            case 'darkPact':
                const manaRestored = spellData.baseRestore + (player.willpower * spellLevel);
                const oldMana = player.mana;
                player.mana = Math.min(player.maxMana, player.mana + manaRestored);
                const actualRestore = player.mana - oldMana;

                if (actualRestore > 0) {
                    logMessage(`You sacrifice {red:${cost} health} to restore {blue:${actualRestore} mana}.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-red'); 
                    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                } else {
                    logMessage("{gray:You cast Dark Pact, but your mana is already full.}");
                }
                updates.health = player.health; 
                updates.mana = player.mana;   
                spellCastSuccessfully = true;
                break;
        }

        // --- 4. Finalize Self-Cast Turn ---
        if (spellCastSuccessfully) {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

            updates[costType] = player[costType]; 
            if (typeof playerRef !== 'undefined') playerRef.update(updates); 
            spellModal.classList.add('hidden');

            triggerAbilityCooldown(spellId);

            endPlayerTurn();
            if (typeof renderStats === 'function') renderStats();
        } else {
            // Refund the cost if the spell failed (e.g., shield already active)
            player[costType] += cost;
            // Also flash the bar red to show it failed
            if(statDisplays[costType]) triggerStatFlash(statDisplays[costType], false); 
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
    }
}

/**
 * Universal helper function to apply spell damage to a target.
 * Handles both overworld (Firebase) and instanced enemies.
 * Also handles special on-hit effects like Siphon Life.
 */

async function applySpellDamage(targetX, targetY, damage, spellId) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];
    const weather = gameState.weather; 
    let finalDamage = damage;

    // --- TALENT ARCANE POTENCY ---
    if (player.talents && player.talents.includes('arcane_potency')) {
        finalDamage += 2;
    }

    // Determine the tile and enemy data
    let tile;
    if (gameState.mapMode === 'overworld') {
        const enemyId = `overworld:${targetX},${-targetY}`;
        const liveEnemy = gameState.sharedEnemies[enemyId];
        tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
    } else {
        const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
        tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
    }

    // --- ELEMENTAL SYNERGY (ENVIRONMENT) ---
    const isTargetInWater = (tile === '~' || tile === '≈');

    if (spellId === 'thunderbolt' || spellId === 'chainLightning') {
        if (isTargetInWater || weather === 'rain' || weather === 'storm') {
            finalDamage = Math.floor(finalDamage * 2.0); // 2x Damage!
            logMessage(`{yellow:The electricity conducts through the water/rain! (Critical Damage)}`);
        }
    } else if (spellId === 'fireball' || spellId === 'meteor') {
        if (weather === 'rain' || weather === 'storm') {
            finalDamage = Math.floor(finalDamage * 0.5); // Fire fizzles in rain
        } else if (tile === '≈') {
            // Swamp Gas Explosion Synergy!
            if (Math.random() < 0.15) {
                logMessage(`{orange:The fire ignites a pocket of swamp gas! BOOM!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#facc15', 10);
                finalDamage = Math.floor(finalDamage * 1.5);
            }
        }
    } else if (spellId === 'frostBolt') {
        if (weather === 'snow') finalDamage = Math.floor(finalDamage * 1.5);
        // ICE BRIDGE SYNERGY
        if (isTargetInWater && gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(targetX, targetY, '❄️', 1); // Melts in 1 hour
            logMessage(`{cyan:The water freezes into a solid path!}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#e0f2fe', 8);
        }
    }

    const enemyData = ENEMY_DATA[tile];
    if (!enemyData) return false; // No enemy here

    let damageDealt = 0; 

    if (gameState.mapMode === 'overworld') {
        const enemyId = `overworld:${targetX},${-targetY}`;
        const enemyRef = rtdb.ref(EnemyNetworkManager.getPath(targetX, targetY, enemyId));

        const liveEnemy = gameState.sharedEnemies[enemyId];
        const enemyInfo = liveEnemy || getScaledEnemy(enemyData, targetX, targetY);
  
        try {
            // Wrap the spell transaction in a 3-second timeout
            const transactionResult = await window.withTimeout(
                enemyRef.transaction(currentData => {

                    // If the enemy is already dead (null), ABORT the transaction.
                    // Do NOT recreate the enemy!
                    if (currentData === null) {
                        return undefined; 
                    }

                    let enemy = currentData;

                    enemy.health = Number(enemy.health);
                    if (isNaN(enemy.health)) enemy.health = Number(enemy.maxHealth) || 10;

                    damageDealt = Math.max(1, finalDamage);
                    enemy.health -= damageDealt;

                    let color = '#3b82f6'; 
                    if (spellId === 'fireball' || spellId === 'meteor') color = '#f97316'; 
                    if (spellId === 'poisonBolt') color = '#22c55e'; 

                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(targetX, targetY, color);
                        ParticleSystem.createFloatingText(targetX, targetY, `-${damageDealt}`, color);
                    }

                    if (enemy.health <= 0) return null; 
                    return JSON.parse(JSON.stringify(enemy)); 
                }),
                3000 // Timeout in milliseconds
            );

            // --- Only grant XP if OUR transaction succeeded ---
            if (transactionResult && transactionResult.committed) {
                const finalEnemyState = transactionResult.snapshot.val();
                
                if (finalEnemyState === null) {
                    logMessage(`The ${enemyInfo.name} was vanquished!`);
                    registerKill(enemyInfo);

                    const lootData = { ...enemyData, isElite: enemyInfo.isElite };
                    const droppedLoot = generateEnemyLoot(player, lootData);

                    chunkManager.setWorldTile(targetX, targetY, droppedLoot || '.');
                }
            } else {
                // The transaction aborted because the enemy was already dead
                if (gameState.sharedEnemies[enemyId]) {
                    delete gameState.sharedEnemies[enemyId];
                }
            }
        } catch (error) {
            console.error("Spell damage transaction failed: ", error);
        }

    } else {
        // Handle Instanced Combat
        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        if (enemy) {
            damageDealt = Math.max(1, finalDamage);
            enemy.health -= damageDealt;
            logMessage(`You hit the ${enemy.name} for ${damageDealt} magic damage!`);
            
            let color = '#3b82f6'; 
            if (spellId === 'fireball' || spellId === 'meteor') color = '#f97316'; 
            if (spellId === 'poisonBolt') color = '#22c55e'; 
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, color, 4);

            if (enemy.health <= 0) {
                logMessage(`You defeated the ${enemy.name}!`);
                if (typeof handleInstancedEnemyDeath === 'function') handleInstancedEnemyDeath(enemy, targetX, targetY);
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
                logMessage(`You drain {green:${actualHeal} health} from the ${enemyData.name}.`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                if (typeof playerRef !== 'undefined') playerRef.update({ health: player.health });
            }
        }
    }

    else if (damageDealt > 0 && spellData.inflicts && Math.random() < spellData.inflictChance) {
        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

            if (enemy && spellData.inflicts === 'frostbite' && enemy.frostbiteTurns <= 0) {
                logMessage(`{cyan:The ${enemy.name} is afflicted with Frostbite!}`);
                enemy.frostbiteTurns = 5; 
            }

            else if (enemy && spellData.inflicts === 'poison' && enemy.poisonTurns <= 0) {
                logMessage(`{green:The ${enemy.name} is afflicted with Poison!}`);
                enemy.poisonTurns = 3; 
            }

            else if (enemy && spellData.inflicts === 'root' && enemy.rootTurns <= 0) {
                logMessage(`{green:Roots burst from the ground, trapping the ${enemy.name}!}`);
                enemy.rootTurns = 3; 
            }
        }
    }

    return damageDealt > 0; 
}


/**
 * Executes an aimed spell (Magic Bolt, Fireball, Siphon Life)
 * after the player chooses a direction.
 */

async function executeAimedSpell(spellId, dirX, dirY) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];
    const spellLevel = player.spellbook[spellId] || 1;

    // --- 🚨 LOCK THE ENGINE ---
    isProcessingMove = true;

    try {
        // --- 1. Calculate Cost ---
        let cost = spellData.cost;
        if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
            cost = Math.floor(cost * 0.8);
        }

        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

        let hitSomething = false;
        let finalTargetX = player.x;
        let finalTargetY = player.y;

        // --- CALCULATE DAMAGE WITH BONUS ---
        const effectiveWits = player.wits + (player.witsBonus || 0);
        const effectiveWill = player.willpower; 

        // --- 2. Execute Spell Logic ---
        switch (spellId) {

            // --- 1. ENTANGLE (Unique Logic) ---
            case 'entangle': {
                logMessage("{green:Vines burst from the ground!}");
                const entangleDmg = spellData.baseDamage + (player.intuition * spellLevel); 

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
                    finalTargetX = tx;
                    finalTargetY = ty;
                }
                break;
            }

            // --- 2. STANDARD PROJECTILES (Shared Logic) ---
            case 'magicBolt':
            case 'siphonLife':
            case 'psychicBlast':
            case 'frostBolt':
            case 'poisonBolt': {
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

                // FIX: Increased range from 3 to 5 tiles!
                for (let i = 1; i <= 5; i++) {
                    const targetX = player.x + (dirX * i);
                    const targetY = player.y + (dirY * i);

                    // --- Animated Arrow Trail ---
                    if (typeof ParticleSystem !== 'undefined') {
                        // Stagger the particle spawning by 40ms per tile to create a "flying" effect
                        setTimeout(() => {
                            ParticleSystem.spawn(targetX, targetY, '#d4d4d8', 'dust', '', 3);
                        }, i * 40); 
                    }
                    
                    if (await applySpellDamage(targetX, targetY, spellDamage, spellId)) {
                        hitSomething = true;
                        break; 
                    }
                    finalTargetX = targetX;
                    finalTargetY = targetY;
                }
                break;
            }

            // --- 3. OTHER SPELLS ---
            case 'thunderbolt': {
                const thunderDmg = spellData.baseDamage + (player.wits * spellLevel);
                logMessage("{yellow:CRACK! Lightning strikes!}");
                // FIX: Increased Thunderbolt range from 4 to 6!
                for (let i = 1; i <= 6; i++) {
                    const tx = player.x + (dirX * i);
                    const ty = player.y + (dirY * i);
                    if (await applySpellDamage(tx, ty, thunderDmg, spellId)) {
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, '#facc15', 12);
                        hitSomething = true;
                        break;
                    }
                    finalTargetX = tx;
                    finalTargetY = ty;
                }
                break;
            }

            case 'meteor': {
                const meteorDmg = spellData.baseDamage + (player.wits * spellLevel);
                let mx = player.x;
                let my = player.y;

                // Raycast up to 5 tiles to find the first target or obstacle
                for (let i = 1; i <= 5; i++) {
                    mx = player.x + (dirX * i);
                    my = player.y + (dirY * i);
                    
                    let tileAt;
                    if (gameState.mapMode === 'overworld') {
                        const enemyId = `overworld:${mx},${-my}`;
                        const liveEnemy = gameState.sharedEnemies[enemyId];
                        tileAt = liveEnemy ? liveEnemy.tile : chunkManager.getTile(mx, my);
                    } else if (gameState.mapMode === 'dungeon') {
                        tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[my]?.[mx];
                    } else {
                        tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[my]?.[mx];
                    }

                    // Stop early if we hit a solid object, wall, or an enemy!
                    if (ENEMY_DATA[tileAt] || ['^', '▓', '▒', '🧱'].includes(tileAt)) {
                        break;
                    }
                }

                logMessage("{orange:A meteor crashes down from the heavens!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.3, 100);

                const meteorPromises = []; 
                for (let y = my - spellData.radius; y <= my + spellData.radius; y++) {
                    for (let x = mx - spellData.radius; x <= mx + spellData.radius; x++) {
                        meteorPromises.push(
                            applySpellDamage(x, y, meteorDmg, spellId).then(hit => {
                                if (hit) if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#f97316');
                            })
                        );
                    }
                }
                await Promise.all(meteorPromises); 
                hitSomething = true;
                break;
            }

            case 'raiseDead': {
                const targetX = player.x + dirX;
                const targetY = player.y + dirY;

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
                        logMessage("{gray:You already have a companion! Dismiss them first.}");
                    } else {
                        logMessage("{purple:You chant the words of unlife... A Skeleton rises to serve you!}");

                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(targetX, targetY, '.');
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = '.';

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

                        if (typeof playerRef !== 'undefined') playerRef.update({ companion: gameState.player.companion });
                        hitSomething = true;
                        if (typeof render === 'function') render();
                    }
                } else {
                    logMessage("{gray:You need a pile of bones '(' or a grave '⚰️' to raise the dead.}");
                }
                break;
            }

            case 'chainLightning': {
                const lightningDmg = spellData.baseDamage + (player.wits * spellLevel);
                // Increased Chain Lightning cast distance from 3 to 5
                const targetX = player.x + (dirX * 5);
                const targetY = player.y + (dirY * 5);

                logMessage("{yellow:A bolt of lightning arcs from your hands!}");

                const hitPrimary = await applySpellDamage(targetX, targetY, lightningDmg, spellId);

                if (hitPrimary) {
                    hitSomething = true;
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#facc15');
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
                    setTimeout(() => logMessage(`{cyan:The lightning arcs to ${jumpsToMake} nearby enemies!}`), 200);
                }

                const lightningPromises = []; // Hold the promises
                for (let i = 0; i < jumpsToMake; i++) {
                    const jumpTgt = potentialJumpTargets[i];
                    const jumpDmg = Math.max(1, Math.floor(lightningDmg * 0.75));
                    lightningPromises.push(
                        applySpellDamage(jumpTgt.x, jumpTgt.y, jumpDmg, spellId).then(hit => {
                            if (hit && typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(jumpTgt.x, jumpTgt.y, '#93c5fd');
                        })
                    );
                }
                await Promise.all(lightningPromises); // WAIT for all jumps to finish
                break;
            }

            case 'fireball': {
                const fbDamage = spellData.baseDamage + (player.wits * spellLevel);
                const radius = spellData.radius; 
                const targetX = player.x + (dirX * 5);
                const targetY = player.y + (dirY * 5);
                logMessage("{orange:A fireball erupts in the distance!}");

                const fbPromises = []; // Hold the promises
                for (let y = targetY - radius; y <= targetY + radius; y++) {
                    for (let x = targetX - radius; x <= targetX + radius; x++) {
                        let tileAt;
                        if (gameState.mapMode === 'overworld') tileAt = chunkManager.getTile(x, y);
                        else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[y]?.[x];
                        else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[y]?.[x];

                        // CRITICAL FIX: Ensure Fireball triggers Barrel Explosions!
                        if (tileAt === '🛢') {
                            logMessage("{orange:BOOM! An Oil Barrel explodes!}");
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#f97316', 15);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.4, 0.2, 200);
                            
                            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '.');
                            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][y][x] = '.';
                            else chunkManager.castleMaps[gameState.currentCastleId][y][x] = '.';
                            
                            // Do AoE Splash Damage to surrounding tiles
                            for (let ey = -1; ey <= 1; ey++) {
                                for (let ex = -1; ex <= 1; ex++) {
                                    fbPromises.push(applySpellDamage(x + ex, y + ey, 15, 'fireball'));
                                }
                            }
                        }

                        if (gameState.mapMode === 'dungeon' && tileAt === '🕸') {
                            const map = chunkManager.caveMaps[gameState.currentCaveId];
                            const theme = CAVE_THEMES[gameState.currentCaveTheme];
                            if (map && map[y]) {
                                map[y][x] = theme.floor;
                                logMessage("{orange:The web catches fire and burns away!}");
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#f97316', 3);
                            }
                        }

                        fbPromises.push(
                            applySpellDamage(x, y, fbDamage, spellId).then(hit => {
                                if (hit) hitSomething = true;
                            })
                        );
                    }
                }
                await Promise.all(fbPromises); // WAIT for all fire damage to process
                break;
            }
        }

        // Visual feedback if a projectile spell hits nothing!
        if (!hitSomething && (spellId === 'magicBolt' || spellId === 'siphonLife' || spellId === 'poisonBolt' || spellId === 'frostBolt')) {
            logMessage("{gray:Your spell flies harmlessly into the distance.}");
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createFloatingText(finalTargetX, finalTargetY, "Fizzle...", "#9ca3af");
            }
        } else {
            // Only deduct the cost if the spell actually hit a target or fired successfully!
            player[spellData.costType] -= cost;
        }

        // --- 3. Finalize Turn ---
        if (typeof playerRef !== 'undefined') {
            playerRef.update({
                [spellData.costType]: player[spellData.costType] // Update mana or psyche
            });
        }

        // Only pulse the UI bar if resources were actually spent
        if (hitSomething) {
            if (spellData.costType === 'mana') {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            } else if (spellData.costType === 'psyche') {
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
            }
        }

        triggerAbilityCooldown(spellId);

        endPlayerTurn();
        if (typeof render === 'function') render();

    } finally {
        // --- 🚨 UNLOCK THE ENGINE ---
        isProcessingMove = false;
    }
}

/**
 * Sets the cooldown for a skill or spell and updates the DB/UI.
 */

function triggerAbilityCooldown(abilityId) {
    const data = SKILL_DATA[abilityId] || SPELL_DATA[abilityId];

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
