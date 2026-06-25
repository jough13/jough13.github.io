// --- START OF FILE magic.js ---

/**
 * Handles all spellcasting logic based on SPELL_DATA
 * and the player's spellbook.
 * @param {string} spellId - The ID of the spell to cast (e.g., "lesserHeal").
 */

function castSpell(spellId) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];

    if (!spellData) {
        logMessage("{red:Unknown spell. (No spell data found)}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    if (player.cooldowns && player.cooldowns[spellId] > 0) {
        logMessage(`{blue:The arcane energies are still gathering! (${player.cooldowns[spellId]} turns left)}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const spellLevel = player.spellbook[spellId] || 0;

    if (spellLevel === 0) {
        logMessage("{gray:You don't know that spell.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
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
        
        // JUICE & PERFORMANCE: Cached DOM lookup for flashing
        const displayEl = typeof statDisplays !== 'undefined' ? statDisplays[costType] : document.getElementById(`${costType}Display`);
        if (displayEl && typeof triggerStatFlash === 'function') triggerStatFlash(displayEl, false);
        return;
    }

    // --- 2. Handle Targeting ---
    if (spellData.target === 'aimed') {
        gameState.isAiming = true;
        gameState.abilityToAim = spellId;
        
        const spellModal = document.getElementById('spellModal');
        if (spellModal) spellModal.classList.add('hidden');
        
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

            case 'stoneSkin': {
                const skinBonus = 3 + Math.floor(player.constitution * 0.2);
                player.defenseBonus = (player.defenseBonus || 0) + skinBonus;
                player.defenseBonusTurns = spellData.duration;

                logMessage(`{gray:Your skin turns to granite! (+${skinBonus} Defense)}`);
                if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(statDisplays.health, 'stat-pulse-gray'); 

                updates.defenseBonus = player.defenseBonus;
                updates.defenseBonusTurns = player.defenseBonusTurns;
                spellCastSuccessfully = true;
                break;
            }

            case 'thornSkin': {
                const reflectAmount = spellData.baseReflect + (player.intuition * spellLevel);
                player.thornsValue = reflectAmount;
                player.thornsTurns = spellData.duration;
                logMessage(`{green:Your skin hardens into iron-like thorns! (Reflect ${reflectAmount} dmg)}`);

                updates.thornsValue = reflectAmount;
                updates.thornsTurns = spellData.duration;
                spellCastSuccessfully = true;
                break;
            }

            case 'candlelight': {
                if (player.candlelightTurns > 0) {
                    logMessage("{yellow:You renew the magical light.}");
                } else {
                    logMessage("{yellow:A warm, floating orb of light appears above you.}");
                }

                player.candlelightTurns = spellData.duration;

                if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(statDisplays.mana, 'stat-pulse-yellow');
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(player.x, player.y, "💡", "#facc15");
                }

                updates.candlelightTurns = player.candlelightTurns;
                spellCastSuccessfully = true;
                break;
            }

            case 'divineLight': {
                // LORE WIN: Dynamic cure messaging with atmospheric text
                let ailmentsCured = false;
                if (player.madnessTurns > 0) { logMessage("{gold:The maddening whispers are banished from your mind.}"); ailmentsCured = true; }
                if (player.poisonTurns > 0) { logMessage("{gold:The foul toxins are purged from your blood.}"); ailmentsCured = true; }
                if (player.frostbiteTurns > 0) { logMessage("{gold:The supernatural chill leaves your bones.}"); ailmentsCured = true; }
                if (player.burnTurns > 0) { logMessage("{gold:The searing flames are extinguished.}"); ailmentsCured = true; }
                
                window.modifyVital('health', player.maxHealth);
                player.poisonTurns = 0;
                player.frostbiteTurns = 0;
                player.madnessTurns = 0; 
                player.rootTurns = 0;
                player.burnTurns = 0;

                logMessage("{gold:A holy light bathes you. You are fully restored!}");
                
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(player.x, player.y, '#facc15', 30); // Massive golden explosion
                    ParticleSystem.createLevelUp(player.x, player.y); 
                }

                // CONTENT WIN: Holy Nova
                // Instantly scorch nearby undead and demons when casting Divine Light!
                const novaRadius = 2;
                const holyDamage = 20 + (player.wits * spellLevel);
                let hitUnholy = false;
                
                for (let y = player.y - novaRadius; y <= player.y + novaRadius; y++) {
                    for (let x = player.x - novaRadius; x <= player.x + novaRadius; x++) {
                        if (x === player.x && y === player.y) continue;
                        
                        let tileAt;
                        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') tileAt = chunkManager.getTile(x, y);
                        else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[y]?.[x];
                        else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[y]?.[x];

                        const eData = ENEMY_DATA[tileAt];
                        const tags = eData ? (eData.tags || []) : [];
                        if (eData && (tags.includes("undead") || tags.includes("demon"))) {
                            // Fire and forget spell damage applying to surrounding enemies
                            applySpellDamage(x, y, holyDamage, 'divineLight');
                            hitUnholy = true;
                        }
                    }
                }
                
                if (hitUnholy) logMessage("{gold:The blinding light sears the nearby darkness!}");

                updates.health = player.health;
                updates.poisonTurns = 0;
                updates.frostbiteTurns = 0;
                updates.madnessTurns = 0;
                updates.rootTurns = 0;
                updates.burnTurns = 0;
                spellCastSuccessfully = true;
                break;
            }

            case 'lesserHeal': {
                const effectiveWits = player.wits + (player.witsBonus || 0);
                const healAmount = spellData.baseHeal + (effectiveWits * spellLevel);
                const healedFor = window.modifyVital('health', healAmount);

                if (healedFor > 0) {
                    logMessage(`You cast Lesser Heal and recover {green:${healedFor} health}.`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `+${healedFor}`, '#22c55e'); 

                } else {
                    logMessage("{gray:You cast Lesser Heal, but you're already at full health.}");
                }
                updates.health = player.health;
                spellCastSuccessfully = true;
                break;
            }

            case 'arcaneShield': {
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
                if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(statDisplays.health, 'stat-pulse-blue');

                updates.shieldValue = player.shieldValue;
                updates.shieldTurns = player.shieldTurns;
                spellCastSuccessfully = true;
                break;
            }

            case 'clarity': {
                if (gameState.mapMode !== 'dungeon') {
                    // LORE WIN: The Void Gazes Back
                    // If they cast mind-expanding magic in a corrupted realm, they suffer!
                    if (gameState.currentRealm !== 0) {
                        logMessage("{purple:You cast your senses into the Void... Something vast and cold looks back.}");
                        logMessage("{red:You are afflicted with Madness!}");
                        player.madnessTurns = (player.madnessTurns || 0) + 2;
                        updates.madnessTurns = player.madnessTurns;
                        
                        gameState.screenShake = 15;
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#a855f7', 20);
                        spellCastSuccessfully = true;
                        break;
                    } else {
                        logMessage("{gray:You can only feel for secret walls in enclosed caves.}");
                        spellCastSuccessfully = true;
                        break;
                    }
                }

                const map = chunkManager.caveMaps[gameState.currentCaveId];
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                const secretWallTile = theme.secretWall;
                let foundWall = false;

                // Also check if we are casting it in the Void Dungeon
                if (gameState.currentCaveTheme === 'VOID') {
                    logMessage("{purple:Your mind brushes against the walls of this place... it feels alive.}");
                    player.madnessTurns = (player.madnessTurns || 0) + 1;
                    updates.madnessTurns = player.madnessTurns;
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                }

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
                    logMessage("{gray:You focus, but the stone around you holds no secrets.}");
                }
                if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                spellCastSuccessfully = true;
                break;
            }

            case 'darkPact': {
                const manaRestored = spellData.baseRestore + (player.willpower * spellLevel);
                const actualRestore = window.modifyVital('mana', manaRestored);

                if (actualRestore > 0) {
                    logMessage(`You sacrifice {red:${cost} health} to restore {blue:${actualRestore} mana}.`);
                    
                    if (typeof triggerStatAnimation !== 'undefined') {
                        triggerStatAnimation(statDisplays.health, 'stat-pulse-red'); 
                    }
                    
                    // JUICE WIN: Visceral feedback for dark magic
                    gameState.screenShake = 12;
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(player.x, player.y, '#be123c', 15);
                        ParticleSystem.createFloatingText(player.x, player.y, `-${cost}`, '#ef4444');
                    }
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit(); // Add a crunch!
                } else {
                    logMessage("{gray:You cast Dark Pact, but your mana is already full.}");
                }
                updates.health = player.health; 
                updates.mana = player.mana;   
                spellCastSuccessfully = true;
                break;
            }
        }

        // --- 4. Finalize Self-Cast Turn ---
        if (spellCastSuccessfully) {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

            updates[costType] = player[costType]; 
            if (typeof playerRef !== 'undefined') playerRef.update(updates); 
            
            const spellModal = document.getElementById('spellModal');
            if (spellModal) spellModal.classList.add('hidden');

            triggerAbilityCooldown(spellId);

            endPlayerTurn();
            if (typeof renderStats === 'function') renderStats();
        } else {
            // Refund the cost if the spell failed (e.g., shield already active)
            player[costType] += cost;
            // Also flash the bar red to show it failed
            const displayEl = typeof statDisplays !== 'undefined' ? statDisplays[costType] : document.getElementById(`${costType}Display`);
            if (displayEl && typeof triggerStatFlash === 'function') triggerStatFlash(displayEl, false); 
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
    const spellData = SPELL_DATA[spellId] || { healPercent: 0, inflicts: null };
    const weather = gameState.weather; 
    let finalDamage = damage;

    // --- TALENT ARCANE POTENCY ---
    if (player.talents && player.talents.includes('arcane_potency')) {
        finalDamage += 2;
    }

    // Determine the tile and enemy data
    let tile;
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        const enemyId = `overworld:${targetX},${-targetY}`;
        const liveEnemy = gameState.sharedEnemies[enemyId];
        tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
    } else {
        const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
        tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
    }
    
    const enemyData = ENEMY_DATA[tile];
    const tags = enemyData ? (enemyData.tags || []) : [];
    const isTargetInWater = (tile === '~' || tile === '≈');

    // --- ELEMENTAL SYNERGY (ENVIRONMENT & ENEMY TYPES) ---
    if (spellId === 'thunderbolt' || spellId === 'chainLightning') {
        if (isTargetInWater || weather === 'rain' || weather === 'storm') {
            finalDamage = Math.floor(finalDamage * 2.0); // 2x Damage!
            logMessage(`{yellow:The electricity conducts through the water/rain! (Critical Damage)}`);
            // JUICE: Electrocute the water visually
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#facc15', 5);
        }
        if (tags.includes('metal')) {
            finalDamage = Math.floor(finalDamage * 1.5);
            logMessage(`{yellow:The metallic enemy short-circuits! (Critical Damage)}`);
        }
    } 
    else if (spellId === 'fireball' || spellId === 'meteor') {
        if (weather === 'rain' || weather === 'storm') {
            finalDamage = Math.floor(finalDamage * 0.5); // Fire fizzles in rain
        } 
        else if (tile === '≈') {
            // Swamp Gas Explosion Synergy!
            if (Math.random() < 0.15) {
                logMessage(`{orange:The fire ignites a pocket of swamp gas! BOOM!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#facc15', 10);
                finalDamage = Math.floor(finalDamage * 1.5);
            }
        }
        
        // Steam Synergy
        if (isTargetInWater) {
             if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#f3f4f6', 6); 
             if (Math.random() < 0.3) logMessage("{gray:The water boils and hisses, releasing a cloud of steam.}");
        }
    } 
    else if (spellId === 'frostBolt') {
        if (weather === 'snow') finalDamage = Math.floor(finalDamage * 1.5);
        
        if (tags.includes('fire')) {
            finalDamage = Math.floor(finalDamage * 1.5);
            logMessage(`{cyan:The fiery entity recoils from the biting cold! (Critical Damage)}`);
        }
        
        // ICE BRIDGE SYNERGY
        if (isTargetInWater && gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(targetX, targetY, '❄️', 1); // Melts in 1 hour
            logMessage(`{cyan:The water freezes into a solid path!}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#e0f2fe', 8);
        }
        
        // CONTENT WIN: Thermal Shock Synergy
        if (tile === '🌋') {
            logMessage(`{cyan:The intense cold solidifies the magma into Obsidian!}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#1f2937', 15);
            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                chunkManager.setWorldTile(targetX, targetY, '▲', 2); // Drop an obsidian shard that lasts for 2 hours
                gameState.mapDirty = true;
            }
        }
        if (tile === '🔥') {
            logMessage(`{cyan:The frost extinguishes the flames.}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, '#d4d4d8', 8);
            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                chunkManager.setWorldTile(targetX, targetY, '.');
                gameState.mapDirty = true;
            } else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = theme.floor;
            }
        }
    }
    else if (spellId === 'divineLight') {
        // Flavor for hitting unholy enemies with Holy Nova
        if (enemyData) logMessage(`{gold:The holy light sears the ${enemyData.name}!}`);
    }

    if (!enemyData) return false; // No enemy here

    let damageDealt = 0; 
    let colorClass = '#3b82f6'; // Default Arcane
    if (spellId === 'fireball' || spellId === 'meteor') colorClass = '#f97316'; 
    if (spellId === 'poisonBolt') colorClass = '#4ade80'; 
    if (spellId === 'frostBolt') colorClass = '#7dd3fc';
    if (spellId === 'divineLight') colorClass = '#facc15';
    if (spellId === 'siphonLife' || spellId === 'psychicBlast') colorClass = '#c084fc';

    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
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

                    if (enemy.health <= 0) return null; 
                    return JSON.parse(JSON.stringify(enemy)); 
                }),
                3000 // Timeout in milliseconds
            );

            // --- Only grant XP & Show Visuals if OUR transaction succeeded ---
            if (transactionResult && transactionResult.committed) {
                
                // --- VISUAL EFFECTS (Moved outside transaction to prevent spam) ---
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(targetX, targetY, colorClass);
                    ParticleSystem.createFloatingText(targetX, targetY, `-${damageDealt}`, colorClass);
                }

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
            
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(targetX, targetY, colorClass, 4);
                ParticleSystem.createFloatingText(targetX, targetY, `-${damageDealt}`, colorClass);
            }

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
            const actualHeal = window.modifyVital('health', healedAmount);
            if (actualHeal > 0) {
                logMessage(`You drain {green:${actualHeal} health} from the ${enemyData.name}.`);
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
                logMessage(`{green:The ${enemy.name} is poisoned!}`);
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

        // Re-verify the player still has the resources to cast this!
        // This prevents the exploit where a player aims, drops their mana gear, and fires into negative mana.
        if (player[spellData.costType] < cost) {
            logMessage(`{red:You no longer have the ${spellData.costType} required to cast this!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            
            // Flash the specific UI bar so they know why it failed
            const displayEl = typeof statDisplays !== 'undefined' ? statDisplays[spellData.costType] : document.getElementById(`${spellData.costType}Display`);
            if (displayEl && typeof triggerStatFlash === 'function') triggerStatFlash(displayEl, false);
            
            return; // Abort execution
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
                // LORE WIN: Adaptive Flora
                let currentTile = '.';
                if (typeof chunkManager !== 'undefined') currentTile = chunkManager.getTile(player.x, player.y);
                
                let vineMsg = "Vines burst from the ground!";
                let vineColor = '#4ade80'; // Green
                
                if (currentTile === 'D') { vineMsg = "Thorny roots erupt from the sand!"; vineColor = '#ca8a04'; }
                else if (currentTile === '❄️' || currentTile === '🧊') { vineMsg = "Frozen roots shatter the ice!"; vineColor = '#7dd3fc'; }
                else if (currentTile === 'd') { vineMsg = "Ashen, dead vines snare the target!"; vineColor = '#57534e'; }
                
                logMessage(`{green:${vineMsg}}`);
                const entangleDmg = spellData.baseDamage + (player.intuition * spellLevel); 

                for (let i = 1; i <= 3; i++) {
                    const tx = player.x + (dirX * i);
                    const ty = player.y + (dirY * i);
                    
                    // Visual path
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.spawn(tx, ty, vineColor, 'dust', '', 3);

                    if (await applySpellDamage(tx, ty, entangleDmg, spellId)) {
                        hitSomething = true;
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createFloatingText(tx, ty, "ROOTED", vineColor);
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
                let trailColor = '#d4d4d8';
                
                if (spellId === 'magicBolt') { logMsg = "You hurl a bolt of energy!"; trailColor = '#60a5fa'; }
                else if (spellId === 'siphonLife') { logMsg = "You cast Siphon Life!"; trailColor = '#c084fc'; }
                else if (spellId === 'psychicBlast') { logMsg = "You unleash a blast of mental energy!"; trailColor = '#c084fc'; }
                else if (spellId === 'frostBolt') { logMsg = "You launch a shard of ice!"; trailColor = '#7dd3fc'; }
                else if (spellId === 'poisonBolt') { logMsg = "You hurl a bolt of acid!"; trailColor = '#4ade80'; }
                
                logMessage(logMsg);

                // PERFORMANCE WIN: Fast-path target loop breaks instantly on walls!
                for (let i = 1; i <= 5; i++) {
                    const targetX = player.x + (dirX * i);
                    const targetY = player.y + (dirY * i);

                    // --- Animated Trail ---
                    if (typeof ParticleSystem !== 'undefined') {
                        setTimeout(() => {
                            ParticleSystem.spawn(targetX, targetY, trailColor, 'dust', '', 3);
                        }, i * 40); 
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
                        logMessage("{gray:Your spell strikes a solid object.}");
                        break;
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
                gameState.screenShake = 15; // JUICE
                
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
                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                        const enemyId = `overworld:${mx},${-my}`;
                        const liveEnemy = gameState.sharedEnemies[enemyId];
                        tileAt = liveEnemy ? liveEnemy.tile : chunkManager.getTile(mx, my);
                    } else if (gameState.mapMode === 'dungeon') {
                        tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[my]?.[mx];
                    } else {
                        tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[my]?.[mx];
                    }

                    // CONTENT WIN: Meteor Mining!
                    if (tileAt === '^') {
                        // If it hits an empty mountain, 5% chance to extract Star-Metal!
                        if (Math.random() < 0.05) {
                            logMessage("{gold:The meteor shatters the mountain, revealing a glowing core!}");
                            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(mx, my, '☄️');
                        }
                        break; // Stop at the mountain
                    }
                    // CONTENT WIN: Deforestation
                    if (tileAt === '🌳') {
                        logMessage("{orange:The thicket goes up in flames!}");
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(mx, my, '🔥', 0.5); // Burns for 30 minutes
                        break;
                    }

                    // Stop early if we hit a solid object, wall, or an enemy!
                    if (ENEMY_DATA[tileAt] || ['▓', '▒', '🧱'].includes(tileAt)) {
                        break;
                    }
                }

                logMessage("{orange:A meteor crashes down from the heavens!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.8, 0.5, 100);
                gameState.screenShake = 25; // Massive shake
                
                // Epicenter visual
                if (typeof ParticleSystem !== 'undefined') {
                    for(let i=0; i<30; i++) {
                        ParticleSystem.spawn(mx, my, '#f97316', 'dust', '', Math.random()*6+4);
                    }
                }

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
                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
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
                        logMessage("{purple:You chant the words of unlife... The bones assemble and rise to serve you!}");

                        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(targetX, targetY, '.');
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = '.';
                        else chunkManager.castleMaps[gameState.currentCastleId][targetY][targetX] = '.';

                        // LORE WIN: Dynamic Minion Naming based on origin
                        let minionName = "Risen Skeleton";
                        if (tileType === '⚰️') minionName = "Awakened Warrior";
                        else if (gameState.mapMode === 'underworld') minionName = "Abyssal Thrall";
                        else if (gameState.currentRealm !== 0) minionName = "Void-Tethered Husk";
                        else if (chunkManager.getTile(targetX, targetY) === 'D') minionName = "Desiccated Mummy";

                        gameState.player.companion = {
                            name: minionName,
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
                        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
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

                // JUICE WIN: Cascading Chain Lightning Animation
                // Wraps the execution in a timeout so the lightning visibly travels instead of hitting all at once
                const lightningPromises = []; 
                for (let i = 0; i < jumpsToMake; i++) {
                    const jumpTgt = potentialJumpTargets[i];
                    const jumpDmg = Math.max(1, Math.floor(lightningDmg * 0.75));
                    
                    lightningPromises.push(
                        new Promise(resolve => {
                            setTimeout(async () => {
                                const hit = await applySpellDamage(jumpTgt.x, jumpTgt.y, jumpDmg, spellId);
                                if (hit && typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(jumpTgt.x, jumpTgt.y, '#93c5fd');
                                resolve();
                            }, i * 150); // 150ms delay per jump
                        })
                    );
                }
                await Promise.all(lightningPromises); 
                break;
            }
        }

        // Visual feedback if a projectile spell hits nothing!
        if (!hitSomething && (spellId === 'magicBolt' || spellId === 'siphonLife' || spellId === 'poisonBolt' || spellId === 'frostBolt' || spellId === 'entangle')) {
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
            if (spellData.costType === 'mana' && typeof statDisplays !== 'undefined') {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            } else if (spellData.costType === 'psyche' && typeof statDisplays !== 'undefined') {
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

// --- SECURITY & PERFORMANCE WIN: Event Delegation ---
// Attaches exactly ONE listener to the spellbook list, bypassing inline DOM bindings.
const spellListEl = document.getElementById('spellList');
if (spellListEl && !spellListEl.dataset.listenersBound) {
    spellListEl.addEventListener('click', (e) => {
        const spellItem = e.target.closest('.spell-item');
        if (spellItem && spellItem.dataset.spell) {
            castSpell(spellItem.dataset.spell);
        }
    });
    spellListEl.dataset.listenersBound = 'true';
}

const closeSpellBtn = document.getElementById('closeSpellButton');
if (closeSpellBtn && !closeSpellBtn.dataset.listenerBound) {
    closeSpellBtn.addEventListener('click', () => {
        const spellModal = document.getElementById('spellModal');
        if (spellModal) spellModal.classList.add('hidden');
        if (document.activeElement) document.activeElement.blur(); 
    });
    closeSpellBtn.dataset.listenerBound = 'true';
}

// --- END OF FILE magic.js ---
