function startCombat(specificEnemyEntity = null) {
     let pirateShip;
     let aiType = "AGGRESSIVE"; // Default behavior

     // 1. Determine Enemy Ship & AI Profile
     if (specificEnemyEntity && specificEnemyEntity.shipClassKey) {
         pirateShip = PIRATE_SHIP_CLASSES[specificEnemyEntity.shipClassKey];
         
         // Simple AI mapping based on ship name keywords
         if (specificEnemyEntity.shipClassKey.includes("INTERCEPTOR") || specificEnemyEntity.shipClassKey.includes("SCOUT")) {
             aiType = "TACTICAL";
         } else if (specificEnemyEntity.shipClassKey.includes("GUNSHIP") || specificEnemyEntity.shipClassKey.includes("DREADNOUGHT")) {
             aiType = "AGGRESSIVE";
         } else {
             aiType = "BALANCED";
         }
     } else {
         // Fallback generation
         const pirateShipOutcomes = Object.values(PIRATE_SHIP_CLASSES).filter(s => !s.id.includes('KTHARR') && !s.id.includes('CONCORD'));
         pirateShip = getWeightedRandomOutcome(pirateShipOutcomes);
     }

     // --- ECLIPSE CARTEL TRUCE PERK ---
     // If the player has 50+ Rep with Eclipse, generic pirates won't attack!
     if (typeof playerFactionStanding !== 'undefined' && (playerFactionStanding['ECLIPSE'] || 0) >= 50) {
         // Check if it's a generic pirate (not Concord, not K'tharr)
         if (!pirateShip.id.includes('KTHARR') && !pirateShip.id.includes('CONCORD')) {
             logMessage("<span style='color:#9933FF; font-weight:bold;'>[ CARTEL TRUCE ]</span> The raiders scan your transponder and disengage. <span style='color:var(--text-color)'>'Fly safe, boss.'</span>");
             if (typeof showToast === 'function') showToast("CARTEL TRUCE: COMBAT BYPASSED", "success");
             
             // Abort combat instantly
             currentCombatContext = null;
             if (typeof removeEnemyAt === 'function') removeEnemyAt(playerX, playerY);
             changeGameState(GAME_STATES.GALACTIC_MAP);
             return; 
         }
     }

     playerAbilityCooldown = 0;
     playerIsChargingAttack = false;
     playerIsEvading = false;

     // 2. Scaling Logic
     const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));
     const difficultyMultiplier = 1 + (distanceFromCenter / 400);

     const baseHull = pirateShip.baseHull + Math.floor(Math.random() * 10) - 5;
     const baseShields = pirateShip.baseShields + Math.floor(Math.random() * 10) - 5;

     const scaledHull = Math.floor(baseHull * difficultyMultiplier);
     const scaledShields = Math.floor(baseShields * difficultyMultiplier);

     // 3. Initialize Combat Context with Subsystems
     currentCombatContext = {
         ship: pirateShip,
         // Core Stats
         pirateShields: Math.max(10, scaledShields),
         pirateMaxShields: Math.max(10, scaledShields),
         pirateHull: Math.max(20, scaledHull),
         pirateMaxHull: Math.max(20, scaledHull),
         
         // Meta Data
         difficultyMultiplier: specificEnemyEntity && specificEnemyEntity.difficultyMultiplier ? specificEnemyEntity.difficultyMultiplier : difficultyMultiplier,
         aiProfile: aiType,
         turnCount: 0,
         
         // --- LEGENDARY BOSS DATA ---
         isLegendary: specificEnemyEntity ? specificEnemyEntity.isLegendary : false,
         exclusiveDrop: specificEnemyEntity ? specificEnemyEntity.exclusiveDrop : null,
         bountyReward: specificEnemyEntity ? specificEnemyEntity.reward : 0,
         bossId: specificEnemyEntity ? specificEnemyEntity.bossId : null,
         
         subsystems: {
             engines: { name: "Ion Drives", hp: 30, status: 'ONLINE' },
             weapons: { name: "Beam Emitters", hp: 30, status: 'ONLINE' },
             sensors: { name: "Targeting Array", hp: 20, status: 'ONLINE' }
         },
         nextMove: null 
     };

     // 4. Generate First Move
     generateEnemyIntent();

     const taunts = ["Your cargo or your life, spacer!", "Heh, fresh meat for the void!", "This sector is ours! Pay the toll!"];
     const pirateTaunt = taunts[Math.floor(Math.random() * taunts.length)];

     changeGameState(GAME_STATES.COMBAT);

     let encounterMsg = `"${pirateTaunt}"\nHostile ${aiType} vessel encountered!`;
     if (difficultyMultiplier > 1.5) encounterMsg += "\n<span style='color:#FF5555'>Warning: Deep Space Threat Detected!</span>";

     logMessage(encounterMsg);
 }

 // --- AI LOGIC ---
function generateEnemyIntent() {
    const ctx = currentCombatContext;
    const roll = Math.random();
    
    // Default Move
    let intent = { type: 'ATTACK', label: 'Charging Weapons', icon: '⚔️' };

    if (ctx.aiProfile === 'AGGRESSIVE') {
        if (roll < 0.25) intent = { type: 'HEAVY_CHARGE', label: 'Powering Heavy Laser', icon: '⚠️' }; // Big hit next turn
        else if (roll < 0.4) intent = { type: 'BUFF_DAMAGE', label: 'Overclocking Weapons', icon: '⚡' };
        else intent = { type: 'ATTACK', label: 'Locking Weapons', icon: '⚔️' };
    } 
    else if (ctx.aiProfile === 'TACTICAL') {
        if (ctx.pirateShields < ctx.pirateMaxShields * 0.3 && roll < 0.5) {
            intent = { type: 'RECHARGE', label: 'Rerouting to Shields', icon: '🛡️' };
        } else if (roll < 0.3) {
            intent = { type: 'EVADE', label: 'Evasive Pattern', icon: '💨' };
        } else {
            intent = { type: 'ATTACK', label: 'Targeting Systems', icon: '⚔️' };
        }
    }
    else { // BALANCED
        if (roll < 0.2) intent = { type: 'DEFEND', label: 'Bracing for Impact', icon: '🧱' };
        else intent = { type: 'ATTACK', label: 'Engaging Hostile', icon: '⚔️' };
    }

    ctx.nextMove = intent;
}

function handleVictory() {
    // 1. Calculate Base Rewards based on difficulty scaling
    const mult = currentCombatContext.difficultyMultiplier || 1.0;
    const baseCredits = 100 + Math.floor(Math.random() * 200);
    const baseXP = 50 + Math.floor(Math.random() * 50);

    const credits = Math.floor(baseCredits * mult);
    const xp = Math.floor(baseXP * mult);

    // 2. Apply Rewards & Notoriety
    playerCredits += credits;
    playerXP += xp;
    updatePlayerNotoriety(5);

    // 3. Trigger Visual & Audio FX
    spawnParticles(playerX, playerY, 'explosion');
    soundManager.playExplosion();
    setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 400);

    // 4. Build the Combat Log Message
    let msg = `Victory! Enemy destroyed.\nSalvaged: ${credits}c\nExperience: +${xp}`;

    // --- 5. LOOT DROP CHANCE ---
    if (Math.random() < 0.4) {
        // 40% chance for cargo loot
        const lootTable = [
            { id: 'TECH_PARTS', qty: [2, 5] },
            { id: 'FUEL_CELLS', qty: [3, 8] },
            { id: 'RARE_METALS', qty: [1, 2] }
        ];
        
        // Pick a random item from the table
        const loot = lootTable[Math.floor(Math.random() * lootTable.length)];
        
        // Calculate quantity based on the [min, max] range
        const qty = loot.qty[0] + Math.floor(Math.random() * (loot.qty[1] - loot.qty[0] + 1));

        const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        if (spaceLeft > 0) {
            const actualQty = Math.min(qty, spaceLeft);
            playerCargo[loot.id] = (playerCargo[loot.id] || 0) + actualQty;
            updateCurrentCargoLoad();
            msg += `\nLooted: ${actualQty}x ${COMMODITIES[loot.id].name}`;
            if (actualQty < qty) msg += " (Hold full, left remainder)";
        } else {
            msg += `\nLoot found (${COMMODITIES[loot.id].name}) but cargo is full!`;
        }
    }

    // --- 6. BOUNTY MISSION TRACKING ---
    if (playerActiveMission && playerActiveMission.type === "BOUNTY" && !playerActiveMission.isComplete) {
        // Look up the specific progress tracker for this objective (eliminate_0)
        const progress = playerActiveMission.progress.eliminate_0;

        if (progress && !progress.complete) {
            progress.current++;
            msg += `\n<span style='color:var(--success); font-weight:bold;'>Bounty Progress: ${progress.current}/${progress.required}</span>`;

            // Check if this kill finished the contract
            if (progress.current >= progress.required) {
                progress.complete = true;
                checkMissionObjectiveCompletion(); // This handles the "Return to station" logic
            }

            // Refresh the HUD Mission Tracker box immediately
            renderMissionTracker();
        }
    }

    // 7. Finalize and Clean Up
    logMessage(msg);
    showToast("TARGET DESTROYED", "success");
    checkLevelUp();

    // 8. Exit Combat State
    currentCombatContext = null;
    changeGameState(GAME_STATES.GALACTIC_MAP);

    // 9. Trigger standard tile interaction (e.g. entering the empty space)
    handleInteraction();

    // Stumble Protection: Prevent accidental movement for 500ms after transition
    lastInputTime = Date.now() + 500;
}

function handleCombatAction(action) {
    if (!currentCombatContext) return;
    let combatLog = "";
    let enemyCanAct = true; 

    if (action !== 'fight' && action !== 'charge') {
        playerIsChargingAttack = false; 
    }

    // --- 1. PLAYER TURN ---
    if (action === 'fight') {
        const weaponId = playerShip.components.weapon;
        const weaponStats = COMPONENTS_DATABASE[weaponId].stats;
        
        // --- AMMO CHECK ---
        if (weaponStats.maxAmmo) {
            // Ensure ammo entry exists
            if (playerShip.ammo[weaponId] === undefined) {
                playerShip.ammo[weaponId] = weaponStats.maxAmmo;
            }

            if (playerShip.ammo[weaponId] <= 0) {
                logMessage("⚠️ WEAPON ERROR: AMMUNITION DEPLETED!", "color:#FF5555");
                if (typeof soundManager !== 'undefined') soundManager.playError();
                return; // Stop the attack
            }
            
            // Deduct Ammo
            playerShip.ammo[weaponId]--;
            combatLog += `[Ammo: ${playerShip.ammo[weaponId]}/${weaponStats.maxAmmo}] `;
        }

        let damageDealt = weaponStats.damage;

        // Perk: Weapon Overclock OR Crew Bonus
        if (playerPerks.has('WEAPON_OVERCLOCK') || (typeof hasCrewPerk === 'function' && hasCrewPerk('COMBAT_DAMAGE'))) {
            damageDealt = Math.floor(damageDealt * 1.15); 
        }

        // --- FACTION PERK: ECLIPSE MERCENARY ---
        if (window.hasEclipseMerc) {
            damageDealt = Math.floor(damageDealt * 1.20); // 20% bonus damage!
            combatLog += "<span style='color:#9933FF;'>(Operative Focus Fire)</span> ";
        }

        // --- DEEP TACTIC: CHARGE LOGIC ---
        if (playerIsChargingAttack) {
            damageDealt = Math.floor(damageDealt * 2.5); // Upgraded to massive 2.5x multiplier!
            playerIsChargingAttack = false; 
            combatLog += "<span style='color:var(--gold-text); font-weight:bold;'>[ CHARGED SHOT ]</span> ";
        }

        // TACTICAL CHECK: Adjust based on Enemy Intent
        if (currentCombatContext.nextMove && currentCombatContext.nextMove.type === 'DEFEND') {
            damageDealt = Math.floor(damageDealt * 0.5);
            combatLog += "(Enemy Braced) ";
        }

        // Hit Chance Calculation
        let hitChance = weaponStats.hitChance;
        
        if (currentCombatContext.nextMove && currentCombatContext.nextMove.type === 'EVADE') {
            hitChance -= 0.25;
            combatLog += "(Enemy Evading) ";
        }

        if (Math.random() < hitChance) {
            if (typeof soundManager !== 'undefined') soundManager.playLaser();
            
            // Shield vs Hull Logic
            if (currentCombatContext.pirateShields > 0) {
                let shieldDmg = damageDealt + (weaponStats.vsShieldBonus || 0);
                
                currentCombatContext.pirateShields -= shieldDmg;
                combatLog += `Shields hit for ${Math.floor(shieldDmg)}!`;

                if (currentCombatContext.pirateShields < 0) {
                    const spillover = Math.abs(currentCombatContext.pirateShields);
                    const hullDmg = Math.floor(spillover * (typeof HULL_DAMAGE_BONUS_MULTIPLIER !== 'undefined' ? HULL_DAMAGE_BONUS_MULTIPLIER : 1.0));
                    
                    currentCombatContext.pirateHull -= hullDmg;
                    currentCombatContext.pirateShields = 0;
                    combatLog += ` Shields down! Hull takes ${hullDmg} damage!`;
                }
            } else {
                let hullDmg = Math.floor(damageDealt * (typeof HULL_DAMAGE_BONUS_MULTIPLIER !== 'undefined' ? HULL_DAMAGE_BONUS_MULTIPLIER : 1.0));
                currentCombatContext.pirateHull -= hullDmg;
                combatLog += `Direct hull hit for ${hullDmg}!`;
            }

            if (typeof triggerHaptic === "function") triggerHaptic(50);
        } else {
            combatLog += "Attack missed!";
        }

    } else if (action === 'ability') {
        if (playerAbilityCooldown > 0) {
            logMessage("Ability is on cooldown!");
            return;
        }

        const ability = SHIP_CLASSES[playerShip.shipClass].ability;
        playerAbilityCooldown = ability.cooldown; 
        
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        combatLog += `<span style='color:#FFD700'>ABILITY: ${ability.name}!</span> `;
        
        // --- DATA-DRIVEN EXECUTION ---
        if (typeof ability.execute === 'function') {
            const playerStats = { 
                hull: playerHull, 
                maxHull: (typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100), 
                shields: playerShields, 
                maxShields: (typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50),
                isEvading: playerIsEvading,
                guaranteedHit: false, 
                triggerEscape: false  
            };
            
            const resultLog = ability.execute(currentCombatContext, playerStats);
            
            playerHull = playerStats.hull;
            playerShields = playerStats.shields;
            playerIsEvading = playerStats.isEvading;
            
            if (playerStats.triggerEscape) {
                if(typeof removeEnemyAt === 'function') removeEnemyAt(playerX, playerY);
                logMessage(combatLog + resultLog);
                currentCombatContext = null;
                changeGameState(GAME_STATES.GALACTIC_MAP);
                handleInteraction();
                return; 
            }

            if (playerStats.guaranteedHit) {
                COMPONENTS_DATABASE[playerShip.components.weapon].stats.hitChance = 2.0; 
                setTimeout(() => { if(typeof applyPlayerShipStats === 'function') applyPlayerShipStats(); }, 500); 
            }
            
            if (resultLog) combatLog += resultLog + " ";
        } else {
            combatLog += "[Legacy Ability Error: Missing Execute Function] ";
        }

    } else if (action === 'hail') {
        // --- DIPLOMACY LOGIC ---
        let faction = "PIRATE";
        const shipId = currentCombatContext.ship && currentCombatContext.ship.id ? currentCombatContext.ship.id : "PIRATE";
        if (shipId.includes("KTHARR")) faction = "KTHARR";
        else if (shipId.includes("CONCORD")) faction = "CONCORD";
        
        const standing = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding) ? (playerFactionStanding[faction] || 0) : 0;
        
        combatLog += "Open channel: ";
        if (faction === "PIRATE") {
            combatLog += "\"Only credits talk here!\" (Diplomacy Failed)";
        } else if (standing > 20) {
            combatLog += "\"Visual ID confirmed. Apologies, Commander.\" <span style='color:#00FF00'>Hostiles disengaging.</span>";
            logMessage(combatLog);
            currentCombatContext = null;
            changeGameState(GAME_STATES.GALACTIC_MAP);
            handleInteraction();
            return;
        } else {
            combatLog += "\"You have no authority here.\" ";
            currentCombatContext.difficultyMultiplier += 0.2;
            combatLog += "(Enemy Enraged)";
        }
        enemyCanAct = true;

    } else if (action === 'charge') {
        playerIsChargingAttack = true;
        combatLog += "<span style='color:var(--warning)'>[ CHARGING ] Weapons drawing auxiliary power. Next shot will be devastating!</span>";
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        
    } else if (action === 'evade') {
        // --- DEEP TACTIC: EVASION LOGIC ---
        const cost = typeof EVASION_FUEL_COST !== 'undefined' ? EVASION_FUEL_COST : 15;
        if (playerFuel >= cost) {
            playerFuel -= cost;
            playerIsEvading = true;
            combatLog += `<span style='color:var(--accent-color)'>[ EVASION ] Thrusters burning hard! Evasive maneuvers engaged.</span>`;
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        } else {
            combatLog += `Not enough fuel to evade!`;
        }
        
    } else if (action === 'run') {
        const cost = typeof RUN_FUEL_COST !== 'undefined' ? RUN_FUEL_COST : 30;
        const chance = typeof RUN_ESCAPE_CHANCE !== 'undefined' ? RUN_ESCAPE_CHANCE : 0.5;
        playerFuel -= cost;
        if (Math.random() < chance) {
            combatLog += `Escaped! Used ${cost} fuel.`;
            logMessage(combatLog);
            if(typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(-1);
            
            currentCombatContext = null;
            changeGameState(GAME_STATES.GALACTIC_MAP);
            handleInteraction();
            return;
        } else {
            combatLog += `<span style='color:var(--danger)'>[ ESCAPE FAILED ] The enemy matched your vector!</span>`;
        }
    }
    if (window.concordEscortJumps && window.concordEscortJumps > 0 && currentCombatContext && currentCombatContext.pirateHull > 0) {
        const escortDmg = 15 + Math.floor(Math.random() * 15); // Powerful auto-damage
        combatLog += `<br><span style='color:var(--accent-color); font-weight:bold;'>[ AEGIS WING ]</span> Escort fires heavy cannons for ${escortDmg} damage!`;
        
        if (currentCombatContext.pirateShields > 0) {
            currentCombatContext.pirateShields -= escortDmg;
            if (currentCombatContext.pirateShields < 0) {
                currentCombatContext.pirateHull += currentCombatContext.pirateShields; // spillover
                currentCombatContext.pirateShields = 0;
            }
        } else {
            currentCombatContext.pirateHull -= escortDmg;
        }
    }

    // --- 2. VICTORY CHECK ---
    if (currentCombatContext.pirateHull <= 0) {
        logMessage(combatLog); 
        
        const defeatedShip = currentCombatContext.ship || currentCombatContext;
        
        // --- LEGENDARY BOSS LOOT ---
        if (currentCombatContext.isLegendary) {
            const weaponId = currentCombatContext.exclusiveDrop;
            const weapon = COMPONENTS_DATABASE[weaponId];
            
            playerCredits += currentCombatContext.bountyReward;
            
            // Hardwire the weapon directly into the player's ship!
            const oldWeaponId = playerShip.components.weapon;
            playerShip.components.weapon = weaponId;
            if (weapon.stats && weapon.stats.maxAmmo) playerShip.ammo[weaponId] = weapon.stats.maxAmmo;
            delete playerShip.ammo[oldWeaponId]; // Clear old ammo
            
            if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
            
            logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ LEGENDARY BOUNTY CLAIMED ]</span> Collected ${formatNumber(currentCombatContext.bountyReward)}c!`);
            logMessage(`<span style='color:#FF33FF; font-weight:bold;'>[ EXOTIC WEAPON RECOVERED ]</span> The ${weapon.name} has been stripped from the wreckage and hardwired into your ship! <span style="color:var(--warning)">(Warning: Unequipping later will destroy this prototype)</span>`);
            if (typeof showToast === 'function') showToast("EXOTIC WEAPON INSTALLED", "success");
            
            if (!window.defeatedLegendaries) window.defeatedLegendaries = [];
            window.defeatedLegendaries.push(currentCombatContext.bossId);
        }

        if (typeof processBountyVictory === 'function') processBountyVictory(defeatedShip);
        if (typeof handleVictory === 'function') handleVictory(); 
        return;
    }

    // --- 3. ENEMY TURN (Tactical Resolution) ---
    let enemyLog = "";
    if (enemyCanAct) {
        const intent = currentCombatContext.nextMove || { type: 'ATTACK' };
        const mult = currentCombatContext.difficultyMultiplier || 1.0;

        // A. Resolve Special States
        if (intent.type === 'STUNNED') {
            enemyLog += "Target is stunned and cannot fire.";
        }
        else if (intent.type === 'HEAVY_CHARGE') {
            enemyLog += "⚠️ WARNING: Enemy weapon charging massive blast!";
            currentCombatContext.charged = true; 
        }
        else if (intent.type === 'RECHARGE') {
            const heal = Math.floor(10 * mult);
            currentCombatContext.pirateShields = Math.min(currentCombatContext.pirateMaxShields || 50, (currentCombatContext.pirateShields || 0) + heal);
            enemyLog += `Enemy regenerated ${heal} shields.`;
        }
        else {
            // B. Resolve Attacks
            const minDmg = typeof PIRATE_ATTACK_DAMAGE_MIN !== 'undefined' ? PIRATE_ATTACK_DAMAGE_MIN : 8;
            const maxDmg = typeof PIRATE_ATTACK_DAMAGE_MAX !== 'undefined' ? PIRATE_ATTACK_DAMAGE_MAX : 15;
            let baseDmg = minDmg + Math.random() * (maxDmg - minDmg);
            let pD = Math.floor(baseDmg * mult);

            if (currentCombatContext.charged) {
                pD *= 2.5; 
                currentCombatContext.charged = false;
                enemyLog += "⚠️ HEAVY BEAM FIRED! ";
            } else if (intent.type === 'BUFF_DAMAGE') {
                pD *= 1.5;
                enemyLog += "Overclocked hit! ";
            }

            // --- RESOLVE EVASION ---
            let hitChance = typeof PIRATE_HIT_CHANCE !== 'undefined' ? PIRATE_HIT_CHANCE : 0.85;
            hitChance -= (typeof PLAYER_EVASION !== 'undefined' ? PLAYER_EVASION : 0);
            if (typeof activeSynergy !== 'undefined' && activeSynergy && activeSynergy.id === 'ECLIPSE') hitChance -= 0.15;

            let isHit = Math.random() < hitChance;

            // NEW 75% Evade Dodge Mechanic
            if (playerIsEvading) {
                if (Math.random() < 0.75) {
                    isHit = false;
                    enemyLog += "<span style='color:var(--success)'>[ DODGED ] The enemy's targeting sensors lost your signature!</span> ";
                } else {
                    enemyLog += "<span style='color:var(--danger)'>[ HIT ] Evasive maneuvers failed.</span> ";
                }
            }

            if (isHit) {
                if (typeof soundManager !== 'undefined') soundManager.playExplosion();
                if (typeof triggerHaptic === "function") triggerHaptic([100, 50]);

                if (!playerIsEvading) enemyLog += "Hit! ";

                if (playerShields > 0) {
                    playerShields -= pD;
                    enemyLog += `Shields took ${Math.floor(pD)}.`;
                    if (playerShields < 0) {
                        const spill = Math.abs(playerShields);
                        playerHull -= spill;
                        playerShields = 0;
                        enemyLog += ` Breach! Hull took ${Math.floor(spill)}.`;
                        
                        // GameBus Integration for screen shake/flashes!
                        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: Math.floor(spill), reason: "Combat Fire" });
                        else if (typeof triggerDamageEffect === "function") triggerDamageEffect();
                    }
                } else {
                    playerHull -= pD;
                    enemyLog += `Hull took ${Math.floor(pD)} damage!`;
                    
                    if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: Math.floor(pD), reason: "Combat Fire" });
                    else if (typeof triggerDamageEffect === "function") triggerDamageEffect();
                }
            } else {
                if (!playerIsEvading) enemyLog += "Enemy fire missed!";
            }
        }
    }

    // Combine logs into the formatted block
    if (enemyCanAct && enemyLog !== "") {
        let combinedLog = `<div style="margin-bottom: 5px; border-left: 2px solid #444; padding-left: 8px;">`;
        combinedLog += `<div style="color:var(--accent-color);">> ${combatLog}</div>`;
        combinedLog += `<div style="color:var(--danger);">> ${enemyLog}</div>`;
        combinedLog += `</div>`;
        logMessage(combinedLog);
    } else {
        logMessage(`<div style="color:var(--accent-color);">> ${combatLog}</div>`);
    }

    playerIsEvading = false;

    // --- 4. DEFEAT CHECK ---
    if (playerHull <= 0) {
        if (typeof triggerGameOver === 'function') triggerGameOver("Destruction in Combat");
        return;
    }

    // --- 5. PREPARE NEXT TURN ---
    if (typeof generateEnemyIntent === 'function') generateEnemyIntent();
    playerAbilityCooldown = Math.max(0, playerAbilityCooldown - 1);

    if (typeof render === 'function') render();
}

function renderCombatView() {
    if (!currentCombatContext) return;

    const combatView = document.getElementById('combatView');
    const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    const shipClass = SHIP_CLASSES[playerShip.shipClass];
    const ability = shipClass.ability;
    
    // --- THEME CHECK ---
    const isLightMode = document.body.classList.contains('light-mode');
    
    // Ability State
    const abilityReady = playerAbilityCooldown <= 0;
    const readyColor = isLightMode ? '#CC8800' : '#FFD700'; 
    const abilityStyle = abilityReady 
       ? `border-color: ${readyColor}; color: ${readyColor}; font-weight: bold; background: rgba(255, 200, 0, 0.1); box-shadow: 0 0 10px rgba(255, 200, 0, 0.2);` 
       : `opacity: 0.5; border-color: var(--border-color); color: var(--text-color);`;

    const canEvade = playerFuel >= EVASION_FUEL_COST;
    const canEscape = playerFuel >= RUN_FUEL_COST;
       
    // Enemy Intent Data
    const intent = currentCombatContext.nextMove || { icon: '?', label: 'Unknown' };
    const intentBg = isLightMode ? 'rgba(255, 0, 0, 0.05)' : 'rgba(50, 0, 0, 0.4)';
    
    const playerShieldPercent = Math.max(0, (playerShields / MAX_SHIELDS) * 100);
    const playerHullPercent = Math.max(0, (playerHull / MAX_PLAYER_HULL) * 100);
    const pirateShieldPercent = Math.max(0, (currentCombatContext.pirateShields / currentCombatContext.pirateMaxShields) * 100);
    const pirateHullPercent = Math.max(0, (currentCombatContext.pirateHull / currentCombatContext.pirateMaxHull) * 100);

    // --- BUILD HTML WITH STRICT COLUMN WRAPPER ---
    let html = `
    <div style="width: 100%; display: flex; flex-direction: column; gap: 20px; padding: 10px 20px; box-sizing: border-box;">
        
        <div style="text-align: center;">
            <h2 style="margin: 0; color: var(--danger); animation: blink 1s infinite; font-size: 28px; font-family: var(--title-font); letter-spacing: 3px;">! HOSTILE ENGAGEMENT !</h2>
        </div>
        
        <div style="display: flex; justify-content: center; align-items: stretch; gap: 20px; flex-wrap: wrap;">
            
            <div style="flex: 1; min-width: 220px; max-width: 300px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; text-align: center; display: flex; flex-direction: column; align-items: center;">
                
                <div style="width: 120px; height: 120px; background: rgba(0, 224, 224, 0.05); border: 1px dashed var(--accent-color); border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                    ${shipClass.image 
                        // FIX: Added scaleX(-1) to mirror the player ship, and fixed the drop-shadow CSS!
                        ? `<img src="${shipClass.image}" style="max-width: 90%; max-height: 90%; object-fit: contain; transform: scaleX(-1); filter: drop-shadow(0 0 10px rgba(0,224,224,0.3));">` 
                        : `<span style="font-size: 40px; opacity: 0.6; filter: hue-rotate(180deg);">🚀</span>`
                    }
                </div>

                <h3 style="margin: 0 0 5px 0; color: var(--item-name-color); font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <img src="${playerPfp}" alt="Player" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--accent-color);">
                    ${playerName}
                </h3>
                <div style="font-size: 11px; color: var(--item-desc-color); margin-bottom: 15px; text-transform: uppercase;">${shipClass.name}</div>
                
                <div style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; color: var(--text-color);"><span>Shields</span><span>${Math.floor(playerShields)}</span></div>
                    <div style="height: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); margin-bottom: 10px; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: #00E0E0; width: ${playerShieldPercent}%; transition: width 0.3s;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; color: var(--text-color);"><span>Hull</span><span>${Math.floor(playerHull)}</span></div>
                    <div style="height: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: #FF5555; width: ${playerHullPercent}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>

            <div style="width: 150px; background: ${intentBg}; border: 1px solid var(--danger); border-radius: 8px; padding: 15px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: inset 0 0 15px rgba(255,0,0,0.1);">
                <div style="font-size: 11px; color: var(--danger); letter-spacing: 2px; margin-bottom: 15px; font-weight: bold; font-family: var(--title-font);">ENEMY INTENT</div>
                <div style="font-size: 36px; margin-bottom: 15px;">${intent.icon}</div>
                <div style="font-weight: bold; color: var(--text-color); font-size: 14px; letter-spacing: 1px;">${intent.label.toUpperCase()}</div>
            </div>

            <div style="flex: 1; min-width: 220px; max-width: 300px; background: var(--bg-color); border: 1px solid var(--danger); border-radius: 8px; padding: 15px; text-align: center; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 0 10px rgba(255,0,0,0.1);">
                
                <div style="width: 120px; height: 120px; background: rgba(255, 0, 0, 0.05); border: 1px dashed var(--danger); border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                    ${currentCombatContext.ship.image 
                        // FIX: Removed scaleX so the enemy faces left naturally. Added the pirate_ship.png fallback!
                        ? `<img src="${currentCombatContext.ship.image}" style="max-width: 90%; max-height: 90%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(255,0,0,0.3));">` 
                        : `<img src="assets/pirate_ship.png" style="max-width: 90%; max-height: 90%; object-fit: contain; filter: drop-shadow(0 0 10px rgba(255,0,0,0.3));">`
                    }
                </div>

                <h3 style="margin: 0 0 5px 0; color: var(--danger); font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <img src="assets/pirate.png" alt="Enemy" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--danger); filter: grayscale(100%) sepia(100%) hue-rotate(300deg) saturate(300%);">
                    HOSTILE TARGET
                </h3>
                <div style="font-size: 11px; color: var(--danger); opacity: 0.8; margin-bottom: 15px; text-transform: uppercase;">${currentCombatContext.ship.name}</div>
                
                <div style="width: 100%;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; color: var(--text-color);"><span>Shields</span><span>${Math.floor(currentCombatContext.pirateShields)}</span></div>
                    <div style="height: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); margin-bottom: 10px; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: #00E0E0; width: ${pirateShieldPercent}%; transition: width 0.3s;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; color: var(--text-color);"><span>Hull</span><span>${Math.floor(currentCombatContext.pirateHull)}</span></div>
                    <div style="height: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: #FFAA00; width: ${pirateHullPercent}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>

        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; max-width: 800px; margin: 0 auto; width: 100%;">
            <button class="action-button" onclick="handleCombatAction('fight')" style="padding: 16px; border-color: var(--danger); color: var(--danger); font-weight: bold;">
                FIRE (${weapon.name})
            </button>
            <button class="action-button" onclick="handleCombatAction('charge')" style="padding: 16px; color: var(--item-name-color);">
                CHARGE WEAPON
            </button>
            
            <button class="action-button" style="grid-column: 1 / -1; padding: 18px; font-size: 16px; letter-spacing: 2px; ${abilityStyle}" onclick="handleCombatAction('ability')" ${!abilityReady ? 'disabled' : ''}>
                ★ ${ability.name.toUpperCase()} ★
            </button>
            
            <button class="action-button" onclick="handleCombatAction('evade')" ${!canEvade ? 'disabled' : ''}>
                EVADE (${EVASION_FUEL_COST} Fuel)
            </button>
            <button class="action-button" onclick="handleCombatAction('run')" ${!canEscape ? 'disabled' : ''}>
                ESCAPE (${RUN_FUEL_COST} Fuel)
            </button>
            
            <button class="action-button" style="grid-column: 1 / -1; padding: 14px; border-color: #AADD99; color: #AADD99;" onclick="handleCombatAction('hail')">
                OPEN COMMS (HAIL)
            </button>
        </div>
    </div>
    `;

    combatView.innerHTML = html;
    renderUIStats();
}

 function spawnPirateNearPlayer() {
    // 1. Determine Spawn Location (randomly 5-10 tiles away)
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.floor(Math.random() * 5);
    const eX = Math.floor(playerX + Math.cos(angle) * dist);
    const eY = Math.floor(playerY + Math.sin(angle) * dist);

    const faction = getFactionAt(eX, eY);
    let potentialShips = [];
    let enemyType = 'PIRATE'; // Default display type
    let warningMsg = "";

    // -- FACTION LOGIC --
    if (faction === "KTHARR" && playerFactionStanding["KTHARR"] < -20) {
        enemyType = "KTHARR_PATROL";
        potentialShips = Object.keys(PIRATE_SHIP_CLASSES).filter(k => k.startsWith('KTHARR'));
        warningMsg = "ALERT: K'tharr Hegemony Patrol intercepting! (Hostile Standing)";
    } else if (faction === "CONCORD" && playerFactionStanding["CONCORD"] < -50) {
        enemyType = "CONCORD_SECURITY";
        potentialShips = Object.keys(PIRATE_SHIP_CLASSES).filter(k => k.startsWith('CONCORD'));
        warningMsg = "ALERT: Concord Security attempting arrest!";
    }

    // -- FALLBACK / PIRATE LOGIC --
    // If no specific faction spawned (or you are friendly with them), spawn a standard Pirate!
    if (potentialShips.length === 0) {
        enemyType = "PIRATE";
        potentialShips = ["RAIDER", "STRIKER", "BRUISER"];
        warningMsg = "WARNING: Pirate vessel detected on sensors!";
    }

    // 3. Select Specific Ship Class
    const shipKey = potentialShips[Math.floor(Math.random() * potentialShips.length)];

    activeEnemies.push({
        x: eX,
        y: eY,
        id: Date.now(),
        type: enemyType,
        shipClassKey: shipKey 
    });
    
    logMessage(`<span style='color:#FF5555'>${warningMsg}</span>`);
}

function updateEnemies() {
    // Loop backwards so we can remove enemies safely if combat starts
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
        const enemy = activeEnemies[i];

        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;

        // Calculate the absolute distance between the player and the enemy
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 100) { 
            // If the pirate is more than 100 tiles away, they've lost our trail.
            activeEnemies.splice(i, 1); // Delete from memory
            continue; // Skip to the next enemy in the loop
        }

        // 0. RANDOM "HESITATION" MECHANIC (Allows Outrunning)
        // 30% chance the pirate's engines stall or they stop to scan, 
        // effectively making them slower than the player (0.7 speed vs 1.0 speed).
        // This allows you to open the distance if you just keep running.
        if (Math.random() < 0.30) {
            continue; // Skip this enemy's turn
        }

        // 1. Determine Move Preference (Try the longer distance first)
        const moves = [];
        
        if (Math.abs(dx) >= Math.abs(dy)) {
            // Prefer moving Horizontally first, then Vertically
            if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
            if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
        } else {
            // Prefer moving Vertically first, then Horizontally
            if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
            if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
        }

        // 2. Try the moves in order
        let moved = false;
        for (const move of moves) {
            const targetX = enemy.x + move.x;
            const targetY = enemy.y + move.y;

            const targetTile = chunkManager.getTile(targetX, targetY);
            const tileChar = getTileChar(targetTile);

            // Is this the player?
            const isPlayer = (targetX === playerX && targetY === playerY);
            
            // Is it a valid space to fly through?
            // (Enemies can fly through Empty Space or Nebulas)

            const isNavigable = (tileChar !== PLANET_CHAR_VAL && 
                     tileChar !== STARBASE_CHAR_VAL && 
                     tileChar !== OUTPOST_CHAR_VAL);

            // 3. EXECUTE MOVE
            if (isPlayer || isNavigable) {
                enemy.x = targetX;
                enemy.y = targetY;
                moved = true;
                break; // We found a valid move, stop checking alternatives
            }
        }

        // 4. CHECK COMBAT TRIGGER
        // If the enemy successfully moved onto the player's tile, trigger combat!
        if (enemy.x === playerX && enemy.y === playerY) {
            logMessage(`<span style='color:#FF5555'>ALERT: Pirate vessel engaging!</span>`);
            activeEnemies.splice(i, 1);
            startCombat();
            break; // Prevent overlapping encounters on the same tick
        }
    }
}

function commitPiracy(npcIndex) {
    const targetNPC = activeNPCs[npcIndex];
    
    // Remove them from the peaceful traffic array
    activeNPCs.splice(npcIndex, 1);
    
    // Convert them into a hostile enemy using their specific combat profile!
    const enemyProfile = PIRATE_SHIP_CLASSES[targetNPC.combatProfile];
    
    const hostileEntity = {
        x: playerX,
        y: playerY,
        id: Date.now(),
        name: targetNPC.name, 
        shipClassKey: targetNPC.combatProfile, // <--- CRITICAL FIX: Tells the combat engine what ship they have
        hull: enemyProfile.baseHull,
        shields: enemyProfile.baseShields
    };
    
    // Add them directly to your combat engine
    activeEnemies.push(hostileEntity);

    closeGenericModal();
    logMessage(`<span style="color:var(--danger)">WARNING: You have initiated hostilities against a ${targetNPC.name}!</span>`);
    
    // Penalize Concord Rep for Piracy!
    playerFactionStanding["CONCORD"] = (playerFactionStanding["CONCORD"] || 0) - 5;
    if (typeof showToast === 'function') showToast("CONCORD REP -5", "error");

    // Start your combat loop properly!
    startCombat(hostileEntity); 
}



// --- BOARDING COMBAT MINIGAME ---

function startBoardingCombat() {
    closeDerelictView(); // Close the derelict menu
    
    // Set up the firefight stats
    boardingContext = {
        playerHp: 50,
        playerMaxHp: 50,
        enemyHp: 40,
        enemyMaxHp: 40,
        enemyName: "Scavenger Thugs",
        log: ["BLASTER FIRE ERUPTS! You are ambushed in the airlock!"]
    };
    
    openGenericModal("SHIPBOARD FIREFIGHT");
    renderBoardingUI();
}

function renderBoardingUI() {
    if (!boardingContext) return;

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Render Combat Log
    listEl.innerHTML = `<div style="padding: 10px; font-family: var(--main-font); font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
        ${boardingContext.log.map(msg => `<div>> ${msg}</div>`).join('')}
    </div>`;
    listEl.scrollTop = listEl.scrollHeight;

    // 2. Render Health Bars
    const playerPct = Math.max(0, (boardingContext.playerHp / boardingContext.playerMaxHp) * 100);
    const enemyPct = Math.max(0, (boardingContext.enemyHp / boardingContext.enemyMaxHp) * 100);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px 10px;">
            <div style="font-size: 40px; margin-bottom: 20px;">🔫</div>
            
            <h4 style="color:var(--accent-color); margin-bottom: 5px;">CAPTAIN ${playerName.toUpperCase()}</h4>
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;"><span>Health</span><span>${boardingContext.playerHp}</span></div>
            <div style="width:100%; height:12px; background:rgba(0,0,0,0.5); border:1px solid var(--border-color); border-radius:4px; margin-bottom:20px;">
                <div style="width:${playerPct}%; height:100%; background:var(--success); transition:width 0.3s;"></div>
            </div>

            <h4 style="color:var(--danger); margin-bottom: 5px;">${boardingContext.enemyName.toUpperCase()}</h4>
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;"><span>Health</span><span>${boardingContext.enemyHp}</span></div>
            <div style="width:100%; height:12px; background:rgba(0,0,0,0.5); border:1px solid var(--danger); border-radius:4px;">
                <div style="width:${enemyPct}%; height:100%; background:var(--danger); transition:width 0.3s;"></div>
            </div>
        </div>
    `;

    // 3. Render Action Buttons
    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--danger); color:var(--danger);" onclick="executeBoardingAction('shoot')">FIRE BLASTER</button>
        <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="executeBoardingAction('cover')">TAKE COVER</button>
        <button class="action-button" style="border-color:#888; color:#888;" onclick="executeBoardingAction('flee')">RETREAT TO SHIP</button>
    `;
}

function executeBoardingAction(action) {
    if (!boardingContext) return;
    const ctx = boardingContext;

    let playerDmg = 0;
    let enemyDmg = Math.floor(Math.random() * 8) + 4; // Enemy hits for 4-11
    let actionLog = "";

    if (action === 'shoot') {
        playerDmg = Math.floor(Math.random() * 12) + 8; // Player hits for 8-19
        actionLog = `<span style="color:var(--gold-text)">You fire your blaster!</span> Hits for ${playerDmg} damage.`;
    } else if (action === 'cover') {
        enemyDmg = Math.floor(enemyDmg * 0.3); // Reduce incoming damage by 70%
        actionLog = `<span style="color:var(--accent-color)">You duck behind a bulkhead!</span> Enemy fire is heavily suppressed.`;
    } else if (action === 'flee') {
        // Run away, taking a parting shot
        closeGenericModal();
        boardingContext = null;
        logMessage("You fled the derelict under heavy fire. Ship hull took 10 damage!");
        
        // THE MAGIC HANDOFF
        GameBus.emit('HULL_DAMAGED', { amount: 10, reason: "Shot while fleeing an airlock" });
        return;
    }

    // Apply Damage
    ctx.enemyHp -= playerDmg;
    if (ctx.enemyHp < 0) ctx.enemyHp = 0;

    // Enemy Turn
    if (ctx.enemyHp > 0) {
        actionLog += ` Enemy returns fire for <span style="color:var(--danger)">${enemyDmg} damage!</span>`;
        ctx.playerHp -= enemyDmg;
    } else {
        actionLog += ` <span style="color:var(--success); font-weight:bold;">Enemy neutralized!</span>`;
    }

    ctx.log.push(actionLog);

    // Keep log scrolling cleanly
    if (ctx.log.length > 7) ctx.log.shift();

    // Check Win/Loss conditions
    if (ctx.playerHp <= 0) {
        closeGenericModal();
        triggerGameOver("Killed in a close-quarters firefight");
        return;
    } else if (ctx.enemyHp <= 0) {
        // VICTORY!
        let credits = 300 + Math.floor(Math.random() * 500);
        let xp = 75;
        
        playerCredits += credits;
        playerXP += xp;
        
        closeGenericModal();
        boardingContext = null;

        showToast("FIREFIGHT WON", "success");
        checkLevelUp();
        renderUIStats();
        return;
    }

    // If still fighting, re-render the UI with new HP and logs
    if (typeof soundManager !== 'undefined') soundManager.playLaser();
    renderBoardingUI();
}

// Simple helper to remove an enemy after combat
function removeEnemyAt(x, y) {
    activeEnemies = activeEnemies.filter(e => e.x !== x || e.y !== y);
}

// ==========================================
// --- PLANETARY OUTPOST RAIDS (GROUND) ---
// ==========================================

let raidContext = null;

function startOutpostRaid(location) {
    if (typeof closeGenericModal === 'function') closeGenericModal(); 
    
    // 🔮 FUTURE EXPANSION: TROOP DEPLOYMENT (v1.1)
    // LLM NOTE: In the future, instead of using the ship's Hull, require the player to select how many 
    // Marines and Mechs to deploy. 
    // Example logic:
    // const deployedMarines = Math.min(GameState.ship.forces.marines, GameState.ship.forces.dropDropships * 20 || 10);
    // if (deployedMarines === 0) { showToast("NO TROOPS TO DEPLOY", "error"); return; }
    // playerHp = deployedMarines * 10; (Each marine has 10 HP)
    // If playerHp takes damage, divide damage by 10 and permanently delete that many marines from GameState.

    // Currently (v1.0): You use your actual ship's health pool!
    raidContext = {
        locationObj: location,
        playerHp: typeof playerHull !== 'undefined' ? playerHull : 100, 
        playerMaxHp: typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100,
        enemyHp: 150, // Bases are tough!
        enemyMaxHp: 150,
        enemyName: "Cartel Garrison",
        log: ["DROP RAMPS DEPLOYED. You touch down just outside the perimeter. Heavy turret fire incoming!"]
    };
    
    openGenericModal(`GROUND ASSAULT: ${location.name.toUpperCase()}`);
    renderRaidUI();
}

function renderRaidUI() {
    if (!raidContext) return;

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Render Combat Log (Left Pane) - Forced Dark Tactical Terminal!
    listEl.style.padding = "0"; 
    listEl.innerHTML = `
        <div style="background: #050510; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
            <div style="background: var(--danger); color: #000; font-family: var(--title-font); font-size: 12px; font-weight: 900; text-align: center; padding: 10px; letter-spacing: 2px;">
                TACTICAL FEED
            </div>
            <div id="raidLogContainer" style="padding: 15px; font-family: var(--main-font); font-size: 12px; color: var(--accent-color); display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1;">
                ${raidContext.log.map(msg => `<div>> ${msg}</div>`).join('')}
            </div>
        </div>
    `;
    
    // Auto-scroll the log to the bottom
    setTimeout(() => {
        const logBox = document.getElementById('raidLogContainer');
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
    }, 10);

    // 2. Render Health Bars & ARTWORK (Right Pane)
    const playerPct = Math.max(0, (raidContext.playerHp / raidContext.playerMaxHp) * 100);
    const enemyPct = Math.max(0, (raidContext.enemyHp / raidContext.enemyMaxHp) * 100);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 10px;">
            
            <!-- 🚨 INTEGRATED RAID ARTWORK -->
            <img src="assets/planetary_raid.png" 
                 onerror="this.style.display='none'" 
                 alt="Ground Assault" 
                 style="width: 100%; max-height: 150px; object-fit: cover; object-position: center; border: 2px solid var(--danger); border-radius: 4px; box-shadow: 0 0 20px rgba(255, 0, 0, 0.2); margin-bottom: 15px; image-rendering: pixelated; background: #000;">
            
            <h4 style="color:var(--accent-color); margin: 0 0 5px 0; font-size: 13px;">LANDING PARTY (${playerName.toUpperCase()})</h4>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;"><span>Armor Integrity</span><span>${Math.floor(raidContext.playerHp)}</span></div>
            <div style="width:100%; height:10px; background:rgba(0,0,0,0.5); border:1px solid var(--border-color); border-radius:4px; margin-bottom:15px;">
                <div style="width:${playerPct}%; height:100%; background:var(--success); transition:width 0.3s;"></div>
            </div>

            <h4 style="color:var(--danger); margin: 0 0 5px 0; font-size: 13px;">${raidContext.enemyName.toUpperCase()}</h4>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;"><span>Fortification</span><span>${Math.floor(raidContext.enemyHp)}</span></div>
            <div style="width:100%; height:10px; background:rgba(0,0,0,0.5); border:1px solid var(--danger); border-radius:4px; margin-bottom: 15px;">
                <div style="width:${enemyPct}%; height:100%; background:var(--danger); transition:width 0.3s;"></div>
            </div>
            
            <p style="color:var(--item-desc-color); font-size:11px; margin: 5px 0; font-style:italic; line-height: 1.4;">
                "The cartel has locked down the central vault. Break their defenses to get inside."
            </p>
        </div>
    `;

    // 3. Render Tactical Actions (Buttons compressed to fit!)
    const currentFuel = typeof playerFuel !== 'undefined' ? playerFuel : 0;
    const canBombard = currentFuel >= 25;

    actionsEl.innerHTML = `
        <div style="display: flex; gap: 10px; width: 100%;">
            <button class="action-button danger-btn" style="flex: 1; margin: 0; padding: 10px 5px; font-size: 11px;" onclick="executeRaidAction('assault')">
                ASSAULT<br><span style="font-size:9px; opacity:0.8; font-family: var(--main-font);">(High Dmg/Risk)</span>
            </button>
            <button class="action-button" style="flex: 1; margin: 0; padding: 10px 5px; font-size: 11px; border-color:var(--accent-color); color:var(--accent-color);" onclick="executeRaidAction('flank')">
                FLANK<br><span style="font-size:9px; opacity:0.8; font-family: var(--main-font);">(Low Dmg/Risk)</span>
            </button>
        </div>
        
        <button class="action-button" style="border-color:var(--warning); color:var(--warning); box-shadow: ${canBombard ? '0 0 10px rgba(255, 170, 0, 0.3)' : 'none'}; margin-bottom: 0;" 
            ${!canBombard ? 'disabled' : ''} onclick="executeRaidAction('strike')">
            ${canBombard ? 'ORBITAL BOMBARDMENT (-25 Fuel)' : 'ORBITAL STRIKE (Needs 25 Fuel)'}
        </button>
        
        <button class="action-button" style="border-color:#888; color:#888; margin-bottom: 0;" onclick="executeRaidAction('flee')">
            ABORT RAID & EVACUATE
        </button>
    `;
}

function executeRaidAction(action) {
    if (!raidContext) return;
    const ctx = raidContext;

    let playerDmg = 0;
    let enemyDmg = 0; 
    let actionLog = "";

    // --- TACTICAL CHOICES ---
    // 🔮 FUTURE EXPANSION (v1.1):
    // If GameState.ship.forces.heavyMechs > 0, multiply playerDmg by 1.5.
    // If player takes enemyDmg, permanently subtract (enemyDmg / 10) from GameState.ship.forces.marines.
    
    if (action === 'assault') {
        playerDmg = Math.floor(Math.random() * 20) + 15; // 15-35 dmg to enemy
        enemyDmg = Math.floor(Math.random() * 15) + 10;  // 10-25 dmg to player
        actionLog = `<span style="color:var(--danger)">You charge the main gates!</span> Dealt ${playerDmg} damage.`;
        if (typeof soundManager !== 'undefined') soundManager.playLaser();
    } 
    else if (action === 'flank') {
        playerDmg = Math.floor(Math.random() * 10) + 8; // 8-18 dmg to enemy
        enemyDmg = Math.floor(Math.random() * 5);       // 0-5 dmg to player
        actionLog = `<span style="color:var(--accent-color)">You take the high ground.</span> Sniped guards for ${playerDmg} damage.`;
        if (typeof soundManager !== 'undefined') soundManager.playLaser();
    } 
    else if (action === 'strike') {
        playerFuel -= 25;
        playerDmg = Math.floor(Math.random() * 30) + 30; // 30-60 massive dmg to enemy!
        enemyDmg = 0; // Completely safe for the player!
        actionLog = `<span style="color:var(--warning)">ORBITAL STRIKE!</span> Your ship rains fire from above! ${playerDmg} structural damage!`;
        if (typeof soundManager !== 'undefined') soundManager.playExplosion();
        if (typeof triggerDamageEffect === 'function') triggerDamageEffect(); // Shake screen!
        if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED'); // Update Fuel Bar!
    } 
    else if (action === 'flee') {
        closeGenericModal();
        raidContext = null;
        logMessage("<span style='color:var(--danger)'>You evacuate under heavy fire! Ship took 20 damage during takeoff!</span>");
        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 20, reason: "Shot while fleeing a raid" });
        return;
    }

    // Apply Damage to Enemy
    ctx.enemyHp -= playerDmg;
    if (ctx.enemyHp < 0) ctx.enemyHp = 0;

    // Enemy Turn (Only if they survive)
    if (ctx.enemyHp > 0) {
        if (enemyDmg > 0) {
            actionLog += ` The garrison returns fire! <span style="color:var(--danger)">Took ${enemyDmg} damage!</span>`;
            
            // This ensures your HUD flashes red and your global hull goes down properly.
            if (typeof GameBus !== 'undefined') {
                GameBus.emit('HULL_DAMAGED', { amount: enemyDmg, reason: "Ground Assault Firefight" });
            } else {
                playerHull -= enemyDmg; // Fallback
            }
            
        } else {
            actionLog += ` The garrison is suppressed and misses their shots!`;
        }
        
        // Sync the visual UI bar with your actual ship health!
        ctx.playerHp = typeof playerHull !== 'undefined' ? playerHull : 0; 
    } else {
        actionLog += ` <span style="color:var(--success); font-weight:bold;">Defenses broken! Vault exposed!</span>`;
    }

    ctx.log.push(actionLog);
    if (ctx.log.length > 7) ctx.log.shift();

    // Check Win/Loss conditions
    if (ctx.playerHp <= 0) {
        closeGenericModal();
        // The GameBus 'HULL_DAMAGED' event above will automatically trigger Game Over!
        return;
    } 
    else if (ctx.enemyHp <= 0) {
        // --- VICTORY RESOLUTION ---
        const credits = (800 + Math.floor(Math.random() * 1000)) * (typeof hasCrewPerk === 'function' && hasCrewPerk('SCAVENGER_PROTOCOL') ? 2 : 1);
        const xp = 250;
        
        playerCredits += credits;
        playerXP += xp;
        
        // Permanently destroy the pirate base on the map!
        ctx.locationObj.cleared = true; 
        updateWorldState(playerX, playerY, { cleared: true });
        
        // Steal Cartel Contraband
        if (typeof playerCargo !== 'undefined') {
            playerCargo['PROHIBITED_STIMS'] = (playerCargo['PROHIBITED_STIMS'] || 0) + Math.floor(Math.random() * 3) + 2;
            playerCargo['STOLEN_CONCORD_MEDALS'] = (playerCargo['STOLEN_CONCORD_MEDALS'] || 0) + Math.floor(Math.random() * 5) + 1;
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
        
        closeGenericModal();
        raidContext = null;

        logMessage(`<span style="color:var(--success); font-weight:bold;">OUTPOST SECURED!</span> You cracked the cartel vault.<br>Looted <span style="color:var(--gold-text)">${typeof formatNumber === 'function' ? formatNumber(credits) : credits}c</span> and seized local contraband! (+${xp} XP)`);
        if (typeof showToast === 'function') showToast("BASE DESTROYED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        
        if (typeof checkLevelUp === 'function') checkLevelUp();
        if (typeof renderUIStats === 'function') renderUIStats();
        
        // Force the map to redraw so the player can see the base is dead
        if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
        if (typeof render === 'function') render();
        return;
    }

    // Re-render UI for the next turn
    renderRaidUI();
}
