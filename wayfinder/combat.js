let playerTargeting = 'HULL'; // Can be 'HULL', 'WEAPONS', or 'ENGINES'

function startCombat(specificEnemyEntity = null) {
    let pirateShip;
    let aiType = "AGGRESSIVE"; // Default behavior

    // 1. Determine Enemy Ship & AI Profile
    if (specificEnemyEntity && specificEnemyEntity.shipClassKey && typeof PIRATE_SHIP_CLASSES !== 'undefined' && PIRATE_SHIP_CLASSES[specificEnemyEntity.shipClassKey]) {
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
        // FALLBACK: If specific entity lacks a valid class, generate a random standard pirate!
        const pirateShipOutcomes = Object.values(PIRATE_SHIP_CLASSES).filter(s => !s.id.includes('KTHARR') && !s.id.includes('CONCORD'));
        pirateShip = getWeightedRandomOutcome(pirateShipOutcomes);
    }

    // --- ECLIPSE CARTEL TRUCE PERK ---
    // If the player has 50+ Rep with Eclipse, generic pirates won't attack!
    if (typeof playerFactionStanding !== 'undefined' && (playerFactionStanding['ECLIPSE'] || 0) >= 50) {
        if (!pirateShip.id.includes('KTHARR') && !pirateShip.id.includes('CONCORD')) {
            logMessage("<span style='color:var(--success); font-weight:bold;'>[ TRUCE ] The Cartel recognizes your transponder. They hold their fire and let you pass.</span>");
            if (typeof removeEnemyAt === 'function') removeEnemyAt(playerX, playerY);
            if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
            return; // CRITICAL: Actually cancel the combat initialization!
        }
    }

     playerAbilityCooldown = 0;
     playerIsChargingAttack = false;
     playerIsEvading = false;

     // 2. Scaling Logic & PROCEDURAL ENEMY ENGINE
     const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));
     let difficultyMultiplier = 1 + (distanceFromCenter / 400);

     if (specificEnemyEntity && specificEnemyEntity.combatBonusAdvantage) {
         difficultyMultiplier = Math.max(0.2, difficultyMultiplier - (specificEnemyEntity.combatBonusAdvantage * 0.05));
     }

     // --- Deep clone the ship so we can mutate it safely ---
     let enemyShipClone = JSON.parse(JSON.stringify(pirateShip));

     // 20% chance to spawn an Elite/Mutated variant (unless it's already a legendary boss)
     let isElite = specificEnemyEntity ? specificEnemyEntity.isLegendary : false;
     
     if (Math.random() < 0.20 && !isElite) {
         const enemyPrefixes = [
             { name: "Armored", hullMult: 1.5, shieldMult: 1.0, diffMod: 0.1 },
             { name: "Overcharged", hullMult: 1.0, shieldMult: 1.5, diffMod: 0.1 },
             { name: "Elite", hullMult: 1.3, shieldMult: 1.3, diffMod: 0.2 },
             { name: "Deranged", hullMult: 0.6, shieldMult: 0.4, diffMod: 0.4 } // Glass cannon, hits way harder!
         ];
         let prefix = enemyPrefixes[Math.floor(Math.random() * enemyPrefixes.length)];
         
         // Apply the mutations
         enemyShipClone.name = `${prefix.name} ${enemyShipClone.name}`;
         enemyShipClone.baseHull = Math.floor(enemyShipClone.baseHull * prefix.hullMult);
         enemyShipClone.baseShields = Math.floor(enemyShipClone.baseShields * prefix.shieldMult);
         difficultyMultiplier += prefix.diffMod;
     }

     const baseHull = enemyShipClone.baseHull + Math.floor(Math.random() * 10) - 5;
     const baseShields = enemyShipClone.baseShields + Math.floor(Math.random() * 10) - 5;

     const scaledHull = Math.floor(baseHull * difficultyMultiplier);
     const scaledShields = Math.floor(baseShields * difficultyMultiplier);

     // 3. Initialize Combat Context with Subsystems
     currentCombatContext = {
         ship: enemyShipClone, // <-- CRITICAL: Use the mutated clone here!
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
         
         // --- SKIRMISH DATA ---
         isSkirmishTarget: specificEnemyEntity ? specificEnemyEntity.isSkirmishTarget : false,
         supportedFaction: specificEnemyEntity ? specificEnemyEntity.supportedFaction : null,
         
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
    let baseCredits = 100 + Math.floor(Math.random() * 200);
    let baseXP = 50 + Math.floor(Math.random() * 50);

    // --- 🪖 NEW: BOARDING MULTIPLIER ---
    let boardingMsg = "";
    if (currentCombatContext.wasBoarded) {
        baseCredits *= 3; // Triple base credits!
        baseXP *= 2;      // Double base XP!
        boardingMsg = `\n<span style="color:var(--gold-text); font-weight:bold;">[ INTACT SALVAGE ]</span> Marine detachment secured the enemy cargo hold intact! Massive salvage bonus applied.`;
    }

    // --- 🚨 NEW: SKIRMISH BONUS REWARDS ---
    let skirmishMsg = "";
    if (currentCombatContext.isSkirmishTarget) {
        // Massive hazard pay payout!
        const bonusCredits = 2500 + Math.floor(Math.random() * 2000);
        baseCredits += bonusCredits;
        baseXP += 150;
        
        // Did they fight for a specific side?
        if (currentCombatContext.supportedFaction) {
            if (typeof playerFactionStanding === 'undefined') window.playerFactionStanding = {};
            playerFactionStanding[currentCombatContext.supportedFaction] = (playerFactionStanding[currentCombatContext.supportedFaction] || 0) + 15;
            
            const formattedBounty = typeof formatNumber === 'function' ? formatNumber(bonusCredits) : bonusCredits;
            skirmishMsg = `\n<span style="color:var(--success); font-weight:bold;">[ WARZONE CONTRACT FULFILLED ]</span> The ${currentCombatContext.supportedFaction} commander wired you ${formattedBounty}c for the assist! (+15 Rep)`;
        } else {
            // They went rogue and just attacked whoever!
            const formattedBounty = typeof formatNumber === 'function' ? formatNumber(bonusCredits) : bonusCredits;
            skirmishMsg = `\n<span style="color:var(--success); font-weight:bold;">[ WARZONE BOUNTY ]</span> You claimed a massive ${formattedBounty}c hazard pay bonus from the wreckage!`;
        }
    }

    const credits = Math.floor(baseCredits * mult);
    const xp = Math.floor(baseXP * mult);

    // 2. Apply Rewards & Notoriety
    playerCredits += credits;
    playerXP += xp;
    if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(5);

    // 3. Trigger Visual & Audio FX
    if (typeof spawnParticles === 'function') spawnParticles(playerX, playerY, 'explosion');
    if (typeof soundManager !== 'undefined') soundManager.playExplosion();
    if (typeof spawnParticles === 'function') setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 400);

    // 4. Build the Combat Log Message
    let msg = `Victory! Enemy destroyed.\nSalvaged: ${credits}c\nExperience: +${xp}`;
    if (boardingMsg) msg += boardingMsg; // Attach the boarding bonus text!
    if (skirmishMsg) msg += skirmishMsg; // Attach the shiny skirmish bonus text!

    // --- 5. TRACTOR BEAM LOOT RECOVERY ---
    // The player only gets physical cargo if they have the equipment to tractor it in!
    const hasTractorBeam = typeof playerPerks !== 'undefined' && 
        ((playerPerks.has && playerPerks.has('LONG_RANGE_SENSORS')) || 
         (playerPerks.includes && playerPerks.includes('LONG_RANGE_SENSORS'))) || 
        (playerShip && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE');

    if (hasTractorBeam) {
        // 60% chance for cargo loot if they have the gear!
        if (Math.random() < 0.6) {
            const lootTable = [
                { id: 'TECH_PARTS', qty: [2, 5] },
                { id: 'FUEL_CELLS', qty: [3, 8] },
                { id: 'RARE_METALS', qty: [1, 2] }
            ];
            
            const loot = lootTable[Math.floor(Math.random() * lootTable.length)];
            const qty = loot.qty[0] + Math.floor(Math.random() * (loot.qty[1] - loot.qty[0] + 1));
            const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
            
            if (spaceLeft > 0) {
                const actualQty = Math.min(qty, spaceLeft);
                playerCargo[loot.id] = (playerCargo[loot.id] || 0) + actualQty;
                updateCurrentCargoLoad();
                msg += `\n<span style="color:var(--accent-color);">[ TRACTOR BEAM ]</span> Recovered: ${actualQty}x ${COMMODITIES[loot.id].name}`;
                if (actualQty < qty) msg += " (Hold full, left remainder)";
            } else {
                msg += `\n<span style="color:var(--warning);">[ TRACTOR BEAM ]</span> Loot detected (${COMMODITIES[loot.id].name}) but cargo is full!`;
            }
        }
    } else {
        // If they don't have a tractor beam, the loot drifts away!
        if (Math.random() < 0.4) {
            msg += `\n<span style="color:var(--item-desc-color);">Sensors detect valuable debris drifting away. (Requires Telemetry Array or NexStar Scanner to recover)</span>`;
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
    
    const leveledUp = checkLevelUp(); // Capture the boolean!

    // 8. Exit Combat State
    currentCombatContext = null;
    
    // ONLY return to the map if the level up screen didn't hijack the view!
    if (!leveledUp) {
        changeGameState(GAME_STATES.GALACTIC_MAP);
        handleInteraction();
    }

    // Stumble Protection
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

        let damageDealt = PLAYER_ATTACK_DAMAGE;

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

        if (currentCombatContext.playerGuaranteedHit) {
            hitChance = 2.0; 
            currentCombatContext.playerGuaranteedHit = false; 
        }
        
        if (currentCombatContext.nextMove && currentCombatContext.nextMove.type === 'EVADE') {
            hitChance -= 0.25;
            combatLog += "(Enemy Evading) ";
        }
        
        // 🎯 SUBSYSTEM PENALTY
        if (playerTargeting !== 'HULL') {
            hitChance -= 0.15; // Harder to hit a specific part
            combatLog += `[Aiming at ${playerTargeting}] `;
        }

        if (Math.random() < hitChance) {
            if (typeof soundManager !== 'undefined') soundManager.playLaser();
            
            const critRoll = weaponStats.critChance || 0.05; 
            if (Math.random() < critRoll) {
                damageDealt *= 2;
                combatLog += "<span style='color:var(--gold-text); font-weight:bold;'>[ CRITICAL HIT ]</span> ";
                if (typeof triggerDamageEffect === 'function') triggerDamageEffect(); 
            }
            
            // 🎯 SUBSYSTEM DAMAGE ROUTING
            if (playerTargeting === 'WEAPONS' && currentCombatContext.pirateShields <= 0) {
                currentCombatContext.subsystems.weapons.hp -= damageDealt;
                combatLog += `Enemy Weapons took ${Math.floor(damageDealt)} damage!`;
                if (currentCombatContext.subsystems.weapons.hp <= 0 && currentCombatContext.subsystems.weapons.status === 'ONLINE') {
                    currentCombatContext.subsystems.weapons.status = 'OFFLINE';
                    combatLog += " <span style='color:var(--success); font-weight:bold;'>ENEMY WEAPONS OFFLINE! Damage halved.</span>";
                }
            } else if (playerTargeting === 'ENGINES' && currentCombatContext.pirateShields <= 0) {
                currentCombatContext.subsystems.engines.hp -= damageDealt;
                combatLog += `Enemy Engines took ${Math.floor(damageDealt)} damage!`;
                if (currentCombatContext.subsystems.engines.hp <= 0 && currentCombatContext.subsystems.engines.status === 'ONLINE') {
                    currentCombatContext.subsystems.engines.status = 'OFFLINE';
                    combatLog += " <span style='color:var(--success); font-weight:bold;'>ENEMY ENGINES OFFLINE! Evasion disabled.</span>";
                }
            } else {
                // Shield vs Hull Logic (Standard)
                if (currentCombatContext.pirateShields > 0) {
                    if (playerTargeting !== 'HULL') combatLog += "(Shields absorbed subsystem impact!) ";
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
            }
            if (typeof triggerHaptic === "function") triggerHaptic(50);
        } else {
            combatLog += "Attack missed!";
        }
        
        } else if (action === 'board') {
        // --- 🪖 TACTICAL BOARDING ACTION ---
        // 50% chance to take casualties (lose up to 10 marines)
        let casualties = 0;
        if (Math.random() < 0.5) {
            casualties = Math.min(10, playerShip.forces.marines);
            playerShip.forces.marines -= casualties;
        }
        
        combatLog += `<span style='color:var(--danger); font-weight:bold;'>[ BOARDING PARTY DEPLOYED ]</span> Your marines breach the enemy hull! Heavy close-quarters fighting ensues. Sector secured. ${casualties > 0 ? `(-${casualties} Marines Lost)` : '(No Casualties)'}`;
        
        if (typeof soundManager !== 'undefined') soundManager.playExplosion();
        if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
        
        // Instantly destroy the enemy ship and flag the loot multiplier!
        currentCombatContext.pirateHull = 0;
        currentCombatContext.wasBoarded = true; 
        
        // Skip the enemy turn
        enemyCanAct = false;
    
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
                currentCombatContext.playerGuaranteedHit = true; 
            }
            
            if (resultLog) combatLog += resultLog + " ";
        } else {
            combatLog += "[Legacy Ability Error: Missing Execute Function] ";
        }

    } else if (action === 'hail') {
        // --- DIPLOMACY & BRIBERY LOGIC ---
        let faction = "PIRATE";
        const shipId = currentCombatContext.ship && currentCombatContext.ship.id ? currentCombatContext.ship.id : "PIRATE";
        if (shipId.includes("KTHARR")) faction = "KTHARR";
        else if (shipId.includes("CONCORD")) faction = "CONCORD";
        
        const standing = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding) ? (playerFactionStanding[faction] || 0) : 0;
        
        combatLog += "Open channel: ";
        
        // 1. High Reputation (Free Pass)
        if (standing > 20 && faction !== "PIRATE") {
            combatLog += "\"Visual ID confirmed. Apologies, Commander.\" <span style='color:#00FF00'>Hostiles disengaging.</span>";
            logMessage(combatLog);
            currentCombatContext = null;
            changeGameState(GAME_STATES.GALACTIC_MAP);
            handleInteraction();
            return;
        } 
        
        // 2. The Bribe Mechanic!
        // If your rep isn't high enough, but you have cash, try to buy them off!
        const bribeCost = (currentCombatContext.difficultyMultiplier || 1) * 500;
        
        if (playerCredits >= bribeCost) {
            // 75% chance the bribe works!
            if (Math.random() < 0.75) {
                playerCredits -= bribeCost;
                combatLog += `"Credits received. We never saw you." <span style='color:var(--gold-text)'>(-${formatNumber(bribeCost)}c) Hostiles disengaging.</span>`;
                logMessage(combatLog);
                
                if (typeof soundManager !== 'undefined') soundManager.playBuy();
                if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                
                currentCombatContext = null;
                changeGameState(GAME_STATES.GALACTIC_MAP);
                handleInteraction();
                return;
            } else {
                // They took the money AND kept fighting!
                playerCredits -= bribeCost;
                combatLog += `"Thanks for the tip. Now die!" <span style='color:var(--danger)'>(-${formatNumber(bribeCost)}c) Bribe failed!</span> `;
                currentCombatContext.difficultyMultiplier += 0.2; // Enemy Enraged
            }
        } 
        
        // 3. Flat Failure
        else {
            combatLog += "\"Only credits talk here!\" (Diplomacy Failed) ";
            currentCombatContext.difficultyMultiplier += 0.2; // Enemy Enraged
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
        
        // 🚨 TACTICAL FIX: Dynamic Escape Math!
        let baseChance = typeof RUN_ESCAPE_CHANCE !== 'undefined' ? RUN_ESCAPE_CHANCE : 0.5;
        
        // Check the terrain! Asteroids and Nebulas give massive escape bonuses.
        const tile = chunkManager.getTile(playerX, playerY);
        const char = getTileChar(tile);
        
        if (char === ASTEROID_CHAR_VAL) {
            baseChance += 0.25; // +25% chance to escape in an asteroid field!
            combatLog += "<span style='color:var(--warning);'>[ TERRAIN ADVANTAGE ] You weave through the dense asteroid field to break their target lock!</span><br>";
        } else if (char === NEBULA_CHAR_VAL) {
            baseChance += 0.35; // +35% chance to escape in a gas cloud!
            combatLog += "<span style='color:#9933FF;'>[ TERRAIN ADVANTAGE ] The dense nebula gas scrambles their sensors!</span><br>";
        }
        
        // Check ship evasion stat
        baseChance += (typeof PLAYER_EVASION !== 'undefined' ? PLAYER_EVASION : 0);

        // Cap escape chance at 95% (always a tiny risk!)
        const finalChance = Math.min(0.95, baseChance);

        playerFuel -= cost;
        
        if (Math.random() < finalChance) {
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

    // --- 1.25 COMBAT DRONE SWARM ATTACK ---
    // If you deployed drones, and the enemy is still alive, let them swarm!
    if (currentCombatContext.playerDrones && currentCombatContext.playerDrones > 0 && currentCombatContext.pirateHull > 0 && action !== 'run' && action !== 'hail') {
        const droneDmg = currentCombatContext.playerDrones * 10; // 10 free damage per drone!
        
        if (currentCombatContext.pirateShields > 0) {
            currentCombatContext.pirateShields -= droneDmg;
            if (currentCombatContext.pirateShields < 0) {
                currentCombatContext.pirateHull += currentCombatContext.pirateShields;
                currentCombatContext.pirateShields = 0;
            }
        } else {
            currentCombatContext.pirateHull -= droneDmg;
        }
        combatLog += ` <span style="color:var(--success)">[ SWARM ] Drones deal ${droneDmg} damage!</span>`;
        if (typeof soundManager !== 'undefined') setTimeout(() => soundManager.playLaser(), 150);
    }

    // --- 1.5 ACTIVE ESCORT COVERING FIRE ---
    // If you have an escort, let them lay down covering fire!
    if (window.concordEscortJumps && window.concordEscortJumps > 0 && currentCombatContext.pirateHull > 0 && action !== 'run' && action !== 'hail') {
        const escortDmg = 12 + Math.floor(Math.random() * 15); // Deals 12-26 damage automatically!
        
        if (currentCombatContext.pirateShields > 0) {
            currentCombatContext.pirateShields -= escortDmg;
            combatLog += ` <span style="color:var(--accent-color)">[ AEGIS WING ] Gunship blasts shields for ${escortDmg}!</span>`;
            if (currentCombatContext.pirateShields < 0) {
                currentCombatContext.pirateHull += currentCombatContext.pirateShields;
                currentCombatContext.pirateShields = 0;
            }
        } else {
            currentCombatContext.pirateHull -= escortDmg;
            combatLog += ` <span style="color:var(--accent-color)">[ AEGIS WING ] Gunship rakes hull for ${escortDmg}!</span>`;
        }
        // Extra sound effect for the wingman!
        if (typeof soundManager !== 'undefined') setTimeout(() => soundManager.playLaser(), 300);
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

            // WEAPON SUBSYSTEM DEBUFF
            if (currentCombatContext.subsystems.weapons.status === 'OFFLINE') {
                pD = Math.floor(pD * 0.5); // Damage cut in half!
            }

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

             // 🎯 ENGINE SUBSYSTEM DEBUFF
            if (currentCombatContext.subsystems.engines.status === 'OFFLINE' && currentCombatContext.nextMove.type === 'EVADE') {
                currentCombatContext.nextMove.type = 'ATTACK'; // Force them to stop evading
                enemyLog += "(Engines dead. Evasion failed!) ";
            }

            if (typeof activeSynergy !== 'undefined' && activeSynergy && activeSynergy.id === 'ECLIPSE') hitChance -= 0.15;

            let isHit = Math.random() < hitChance;

            // 75% Evade Dodge Mechanic
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

                // 🚨 NEW: DRONE INTERCEPTION SACRIFICE
                if (currentCombatContext.playerDrones && currentCombatContext.playerDrones > 0) {
                    currentCombatContext.playerDrones--;
                    enemyLog += `<span style="color:var(--warning)">[ INTERCEPTED ] Your Combat Drone threw itself into the line of fire and was destroyed! (0 Damage taken)</span> `;
                } else {
                    // Standard Player Damage Logic
                    if (!playerIsEvading) enemyLog += "Hit! ";

                    if (playerShields > 0) {
                        playerShields -= pD;
                        enemyLog += `Shields took ${Math.floor(pD)}.`;
                        if (playerShields < 0) {
                            const spill = Math.abs(playerShields);
                            playerHull -= spill;
                            playerShields = 0;
                            enemyLog += ` Breach! Hull took ${Math.floor(spill)}.`;
                            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: Math.floor(spill), reason: "Combat Fire" });
                        }
                    } else {
                        playerHull -= pD;
                        enemyLog += `Hull took ${Math.floor(pD)} damage!`;
                        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: Math.floor(pD), reason: "Combat Fire" });
                    }
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
    
    // Ensure targeting variable exists globally
    if (typeof window.playerTargeting === 'undefined') window.playerTargeting = 'HULL';
    window.setTargeting = function(mode) { 
        window.playerTargeting = mode; 
        renderCombatView(); 
    };
    
    // --- THEME CHECK ---
    const isLightMode = document.body.classList.contains('light-mode');

    // Create the UI badge if they have an escort
    const hasEscort = window.concordEscortJumps && window.concordEscortJumps > 0;
    const escortBadgeHtml = hasEscort ? `
        <div style="background: rgba(0, 170, 255, 0.1); border: 1px solid var(--accent-color); padding: 4px 8px; border-radius: 4px; font-size: 10px; color: var(--accent-color); font-weight: bold; margin-bottom: 10px; letter-spacing: 1px;">
            🛡️ AEGIS ESCORT ACTIVE
        </div>
    ` : '';
    
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

    // 🚨 DYNAMIC SKIRMISH BACKGROUND
    let wrapperStyle = "width: 100%; display: flex; flex-direction: column; gap: 20px; padding: 10px 20px; box-sizing: border-box;";
    if (currentCombatContext.isSkirmishTarget) {
        wrapperStyle += ` background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('assets/skirmish.jpeg'); background-size: cover; background-position: center; border-radius: 8px; border: 1px solid #444;`;
    }

    // 🚨 ENEMY SUBSYSTEM STATUS DISPLAY
    const wepStatus = currentCombatContext.subsystems.weapons.status;
    const engStatus = currentCombatContext.subsystems.engines.status;
    const wepColor = wepStatus === 'ONLINE' ? 'var(--success)' : 'var(--danger)';
    const engColor = engStatus === 'ONLINE' ? 'var(--success)' : 'var(--danger)';

    const subsystemsHtml = `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 10px; border-top: 1px dashed #444; padding-top: 8px;">
            <span style="color:var(--item-desc-color);">WEAPONS: <span style="color:${wepColor}; font-weight:bold;">${wepStatus}</span></span>
            <span style="color:var(--item-desc-color);">ENGINES: <span style="color:${engColor}; font-weight:bold;">${engStatus}</span></span>
        </div>
    `;

    // TACTICAL BOARDING BUTTON
    const boardingBtnHtml = (playerShip.forces.marines > 0 && currentCombatContext.pirateShields <= 0) ? `
        <button class="action-button danger-btn" style="grid-column: 1 / -1; padding: 18px; font-size: 16px; letter-spacing: 2px; box-shadow: 0 0 15px rgba(255,0,0,0.4);" onclick="handleCombatAction('board')">
            🪖 INITIATE BOARDING ACTION (Risk Marines for 3x Salvage)
        </button>
    ` : '';

    // --- BUILD HTML ---
    let html = `
    <div style="${wrapperStyle}">
        
        <div style="text-align: center;">
            <h2 style="margin: 0; color: var(--danger); animation: blink 1s infinite; font-size: 28px; font-family: var(--title-font); letter-spacing: 3px;">! HOSTILE ENGAGEMENT !</h2>
        </div>
        
        <div style="display: flex; justify-content: center; align-items: stretch; gap: 20px; flex-wrap: wrap;">
            
            <!-- PLAYER PANEL -->
            <div style="flex: 1; min-width: 220px; max-width: 300px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; text-align: center; display: flex; flex-direction: column; align-items: center;">
                
                <div style="width: 120px; height: 120px; background: rgba(0, 224, 224, 0.05); border: 1px dashed var(--accent-color); border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                    ${shipClass.image 
                        ? `<img src="${shipClass.image}" style="max-width: 90%; max-height: 90%; object-fit: contain; transform: scaleX(-1); filter: drop-shadow(0 0 10px rgba(0,224,224,0.3));">` 
                        : `<span style="font-size: 40px; opacity: 0.6; filter: hue-rotate(180deg);">🚀</span>`
                    }
                </div>

                <h3 style="margin: 0 0 5px 0; color: var(--item-name-color); font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <img src="${playerPfp}" alt="Player" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--accent-color);">
                    ${playerName}
                </h3>
                <div style="font-size: 11px; color: var(--item-desc-color); margin-bottom: 15px; text-transform: uppercase;">${shipClass.name}</div>
                
                ${escortBadgeHtml}

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

            <!-- ENEMY INTENT PANEL -->
            <div style="width: 150px; background: ${intentBg}; border: 1px solid var(--danger); border-radius: 8px; padding: 15px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: inset 0 0 15px rgba(255,0,0,0.1);">
                <div style="font-size: 11px; color: var(--danger); letter-spacing: 2px; margin-bottom: 15px; font-weight: bold; font-family: var(--title-font);">ENEMY INTENT</div>
                
                <div style="font-size: 36px; margin-bottom: 15px; color: var(--text-color); filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.4));">${intent.icon}</div>
                
                <div style="font-weight: bold; color: var(--text-color); font-size: 14px; letter-spacing: 1px;">${intent.label.toUpperCase()}</div>
            </div>

            <!-- ENEMY PANEL -->
            <div style="flex: 1; min-width: 220px; max-width: 300px; background: var(--bg-color); border: 1px solid var(--danger); border-radius: 8px; padding: 15px; text-align: center; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 0 10px rgba(255,0,0,0.1);">
                
                <div style="width: 120px; height: 120px; background: rgba(255, 0, 0, 0.05); border: 1px dashed var(--danger); border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                    ${currentCombatContext.ship.image 
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

                    <!-- Inject Subsystem Diagnostics Here -->
                    ${subsystemsHtml}
                </div>
            </div>

        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; max-width: 800px; margin: 0 auto; width: 100%;">
            
            <!-- 🚨 TACTICAL TARGETING COMPUTER UI -->
            <div style="grid-column: 1 / -1; display: flex; justify-content: center; gap: 10px; width: 100%; margin-bottom: 5px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; border: 1px solid var(--border-color); align-items: center; flex-wrap: wrap;">
                <div style="color: var(--item-desc-color); font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-right: 10px;">TARGETING COMPUTER:</div>
                
                <button onclick="setTargeting('HULL')" style="flex: 1; min-width: 120px; padding: 10px; font-family: var(--title-font); font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; border-radius: 4px;
                    background: ${window.playerTargeting === 'HULL' ? 'var(--danger)' : '#222'}; 
                    color: ${window.playerTargeting === 'HULL' ? '#000' : 'var(--text-color)'}; 
                    border: 1px solid var(--danger); box-shadow: ${window.playerTargeting === 'HULL' ? '0 0 10px rgba(255,0,0,0.4)' : 'none'};">
                    HULL (Standard)
                </button>
                
                <button onclick="setTargeting('WEAPONS')" style="flex: 1; min-width: 120px; padding: 10px; font-family: var(--title-font); font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; border-radius: 4px;
                    background: ${window.playerTargeting === 'WEAPONS' ? 'var(--warning)' : '#222'}; 
                    color: ${window.playerTargeting === 'WEAPONS' ? '#000' : 'var(--text-color)'}; 
                    border: 1px solid var(--warning); box-shadow: ${window.playerTargeting === 'WEAPONS' ? '0 0 10px rgba(255,170,0,0.4)' : 'none'};">
                    WEAPONS (-15% Hit)
                </button>
                
                <button onclick="setTargeting('ENGINES')" style="flex: 1; min-width: 120px; padding: 10px; font-family: var(--title-font); font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; border-radius: 4px;
                    background: ${window.playerTargeting === 'ENGINES' ? 'var(--accent-color)' : '#222'}; 
                    color: ${window.playerTargeting === 'ENGINES' ? '#000' : 'var(--text-color)'}; 
                    border: 1px solid var(--accent-color); box-shadow: ${window.playerTargeting === 'ENGINES' ? '0 0 10px rgba(0,224,224,0.4)' : 'none'};">
                    ENGINES (-15% Hit)
                </button>
            </div>

            <!-- BOARDING BUTTON INJECTED -->
            ${boardingBtnHtml}

            <!-- STANDARD ACTIONS -->
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

        // STEALTH MECHANIC 1: NEBULA SLIPPING
        const playerTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        if (playerTile && getTileChar(playerTile) === '~') {
            if (Math.random() < 0.80) {
                continue; // They lose their turn trying to find you
            }
        }

        // 🚨 STEALTH MECHANIC 2: SILENT RUNNING
        if (typeof isSilentRunning !== 'undefined' && isSilentRunning && dist > 3) {
            continue; // They lose their turn
        }

        if (dist > 100) { 
            // If the pirate is more than 100 tiles away, they've lost our trail.
            activeEnemies.splice(i, 1); // Delete from memory
            continue; // Skip to the next enemy in the loop
        }

        // 0. RANDOM "HESITATION" MECHANIC (Allows Outrunning)
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

            const targetTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(targetX, targetY) : null;
            const tileChar = targetTile ? getTileChar(targetTile) : '.';

            // Is this the player?
            const isPlayer = (targetX === playerX && targetY === playerY);
            
            // Is it a valid space to fly through?
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
        if (enemy.x === playerX && enemy.y === playerY) {
            activeEnemies.splice(i, 1);
            
            // Route to Extortion or Combat
            if (enemy.isLegendary || enemy.isProbe || (enemy.shipClassKey && (enemy.shipClassKey.includes('CONCORD') || enemy.shipClassKey.includes('KTHARR')))) {
                logMessage(`<span style='color:#FF5555'>ALERT: Hostile vessel engaging!</span>`);
                if (typeof startCombat === 'function') startCombat(enemy);
            } else {
                if (typeof initiatePirateExtortion === 'function') initiatePirateExtortion(enemy);
                else startCombat(enemy);
            }
            break; // Prevent overlapping encounters on the same tick
        }
    }
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
    
    // Route logic through the new forces object
    const totalMarines = playerShip.forces.marines;
    const deployedMechs = playerShip.forces.heavyMechs;
    
    if (totalMarines <= 0) { 
        if (typeof showToast === 'function') showToast("NO TROOPS TO DEPLOY", "error"); 
        logMessage("<span style='color:var(--danger)'>Assault failed. You need Marines to initiate a raid!</span>");
        return; 
    }

    // 10 HP per individual marine
    const totalMarineHp = totalMarines * 10;

    raidContext = {
        locationObj: location,
        playerHp: totalMarineHp, 
        playerMaxHp: totalMarineHp,
        enemyHp: 150, 
        enemyMaxHp: 150,
        enemyName: "Cartel Garrison",
        mechsDeployed: deployedMechs,
        log: ["DROP RAMPS DEPLOYED. Mercenaries touching down just outside the perimeter. Heavy turret fire incoming!"]
    };

    openGenericModal("PLANETARY ASSAULT");
    renderRaidUI();
}

function renderRaidUI() {
    if (!raidContext) return;

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Render Combat Log (Left Pane) - Now Theme Adaptive!
    listEl.style.padding = "0"; 
    listEl.innerHTML = `
        <div style="background: var(--panel-bg); height: 100%; display: flex; flex-direction: column; overflow: hidden;">
            <div style="background: var(--danger); color: #FFF; font-family: var(--title-font); font-size: 12px; font-weight: 900; text-align: center; padding: 10px; letter-spacing: 2px;">
                TACTICAL FEED
            </div>
            <div id="raidLogContainer" style="padding: 15px; font-family: var(--main-font); font-size: 13px; color: var(--text-color); display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1;">
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
    if (action === 'assault') {
        playerDmg = Math.floor(Math.random() * 20) + 15; 
        enemyDmg = Math.floor(Math.random() * 15) + 10;  
        actionLog = `<span style="color:var(--danger)">Marines charge the main gates!</span> Dealt ${playerDmg} damage.`;
        if (typeof soundManager !== 'undefined') soundManager.playLaser();
    } 
    else if (action === 'flank') {
        playerDmg = Math.floor(Math.random() * 10) + 8; 
        enemyDmg = Math.floor(Math.random() * 5);       
        actionLog = `<span style="color:var(--accent-color)">Sniper teams take the high ground.</span> Hit guards for ${playerDmg} damage.`;
        if (typeof soundManager !== 'undefined') soundManager.playLaser();
    } 
    else if (action === 'strike') {
        playerFuel -= 25;
        playerDmg = Math.floor(Math.random() * 30) + 30; 
        enemyDmg = 0; 
        actionLog = `<span style="color:var(--warning)">ORBITAL STRIKE!</span> Your ship rains fire from above! ${playerDmg} structural damage!`;
        if (typeof soundManager !== 'undefined') soundManager.playExplosion();
        if (typeof triggerDamageEffect === 'function') triggerDamageEffect(); 
        if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED'); 
    } 
    else if (action === 'flee') {
        closeGenericModal();
        logMessage("<span style='color:var(--danger)'>Marines evacuated under heavy fire!</span>");
        
        // Sync surviving marines back to the ship (Divide remaining HP by 10 and round up)
        playerShip.forces.marines = Math.ceil(ctx.playerHp / 10);
        raidContext = null;
        return;
    }

    // --- APPLY MECH MULTIPLIER ---
    if (ctx.mechsDeployed > 0) {
        playerDmg = Math.floor(playerDmg * 1.5); 
        actionLog += ` <span style="color:var(--warning)">(Mech Fire Support: +50% Dmg)</span>`;
    }

    // Apply Damage to Enemy
    ctx.enemyHp -= playerDmg;
    if (ctx.enemyHp < 0) ctx.enemyHp = 0;

    // Enemy Turn 
    if (ctx.enemyHp > 0) {
        if (enemyDmg > 0) {
            actionLog += ` The garrison returns fire! <span style="color:var(--danger)">Took ${enemyDmg} damage!</span>`;
            ctx.playerHp -= enemyDmg; 
        } else {
            actionLog += ` The garrison is suppressed and misses their shots!`;
        }
    } else {
        actionLog += ` <span style="color:var(--success); font-weight:bold;">Defenses broken! Vault exposed!</span>`;
    }

    ctx.log.push(actionLog);
    if (ctx.log.length > 7) ctx.log.shift();

    if (ctx.playerHp <= 0) {
        closeGenericModal();
        
        // Wipe out the marines in the forces object
        playerShip.forces.marines = 0; 
        
        logMessage("<span style='color:var(--danger); font-weight:bold;'>ASSAULT FAILED.</span> Entire landing party was wiped out by the cartel garrison.");
        if (typeof showToast === 'function') showToast("MARINES WIPED OUT", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        
        raidContext = null;
        return;
    } 
    else if (ctx.enemyHp <= 0) {
        // Save surviving marines
        playerShip.forces.marines = Math.ceil(ctx.playerHp / 10);
        
        const detailEl = document.getElementById('genericDetailContent');
        const actionsEl = document.getElementById('genericModalActions');

        detailEl.innerHTML = `
            <div style="text-align:center; padding: 30px 20px;">
                <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px var(--success));">🏳️</div>
                <h3 style="color:var(--success); margin-bottom:10px;">OUTPOST SECURED</h3>
                <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                    The cartel garrison has been wiped out. You now control the central command terminal. 
                    <br><br>What are your orders, Commander?
                </p>
            </div>
        `;

        actionsEl.innerHTML = `
            <button class="action-button danger-btn" onclick="finalizeRaid('RAZE')">RAZE & PILLAGE (Loot & Destroy)</button>
            <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 15px rgba(153,51,255,0.3);" onclick="finalizeRaid('CLAIM')">CLAIM OUTPOST (Establish Shadow Port)</button>
        `;
        return; 
    }

    renderRaidUI();
}

function finalizeRaid(choice) {
    const ctx = raidContext;
    if (!ctx) return;

    if (choice === 'RAZE') {
        const credits = (800 + Math.floor(Math.random() * 1000)) * (typeof hasCrewPerk === 'function' && hasCrewPerk('SCAVENGER_PROTOCOL') ? 2 : 1);
        const xp = 250;
        
        playerCredits += credits;
        playerXP += xp;
        
        // Permanently destroy the pirate base on the map!
        ctx.locationObj.cleared = true; 
        updateWorldState(playerX, playerY, { cleared: true });
        
        // Steal Cartel Contraband & Vault Tech
        if (typeof playerCargo !== 'undefined') {
            playerCargo['PROHIBITED_STIMS'] = (playerCargo['PROHIBITED_STIMS'] || 0) + Math.floor(Math.random() * 3) + 2;
            playerCargo['STOLEN_CONCORD_MEDALS'] = (playerCargo['STOLEN_CONCORD_MEDALS'] || 0) + Math.floor(Math.random() * 5) + 1;
            
            const rareLoot = typeof generateProceduralModule === 'function' ? generateProceduralModule("MILITARY_SHIELD_MOD") : null;
            if (rareLoot) {
                playerCargo[rareLoot.id] = rareLoot;
                logMessage(`<span style="color:#FF33FF; font-weight:bold;">[ VAULT BREACHED ]</span> You recovered a prototype module: <span style="color:var(--gold-text)">${rareLoot.name}</span>!`);
            }
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
        
        logMessage(`<span style="color:var(--success); font-weight:bold;">OUTPOST SECURED!</span> You cracked the cartel vault.<br>Looted <span style="color:var(--gold-text)">${typeof formatNumber === 'function' ? formatNumber(credits) : credits}c</span> and seized local contraband! (+${xp} XP)`);
        if (typeof showToast === 'function') showToast("BASE DESTROYED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playGain();
    } 
    else if (choice === 'CLAIM') {
        // Turn the tile into a player-owned Black Market!
        const stationName = prompt("Enter a name for your new Shadow Port:", "The Den");
        const finalName = stationName ? stationName : "Cartel Hideout";

        updateWorldState(playerX, playerY, {
            char: 'H', 
            type: 'location', 
            name: finalName, 
            faction: 'ECLIPSE', // Stays Cartel aligned, but you own it!
            isMajorHub: false, 
            isPlayerOwned: true, 
            isTinyOutpost: true, // Uses our outpost logic
            outpostTier: 2, // Starts as a Hub!
            isBlackMarket: true, // Access to the Shadow Broker
            treasury: 0, 
            scanFlavor: "A seized pirate fortress turned player-owned shadow port."
        });

        // Massive Notoriety hit for claiming a pirate base!
        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(15);

        logMessage(`<span style="color:#9933FF; font-weight:bold;">[ OUTPOST CLAIMED ]</span> The facility is yours. The Shadow Network now recognizes you as the local Baron. Concord Notoriety significantly increased!`);
        if (typeof showToast === 'function') showToast("SHADOW PORT ESTABLISHED", "warning");
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    }

    closeGenericModal();
    raidContext = null;

    let leveledUp = false;
    if (typeof checkLevelUp === 'function') leveledUp = checkLevelUp();
    
    if (typeof renderUIStats === 'function') renderUIStats();
    
    if (!leveledUp) {
        if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
        if (typeof render === 'function') render();
    }
    autoSaveGame();
}

// ==========================================
// --- VOID VULTURES: EXTORTION & TRUCE ---
// ==========================================

let pendingExtortionEnemy = null;

function initiatePirateExtortion(enemy) {
    // 1. Check for Eclipse Truce (High Reputation)
    if (typeof playerFactionStanding !== 'undefined' && (playerFactionStanding['ECLIPSE'] || 0) >= 50) {
         logMessage("<span style='color:#9933FF; font-weight:bold;'>[ CARTEL TRUCE ]</span> The raiders scan your transponder and disengage. <span style='color:var(--text-color)'>'Fly safe, boss.'</span>");
         if (typeof showToast === 'function') showToast("TRUCE: COMBAT BYPASSED", "success");
         currentCombatContext = null;
         changeGameState(GAME_STATES.GALACTIC_MAP);
         return; 
    }

    pendingExtortionEnemy = enemy;
    
    // They demand 15% of your total credits, or at least 100c
    const demand = Math.max(100, Math.floor(playerCredits * 0.15));
    
    openGenericModal("PIRATE INTERCEPT");
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    document.getElementById('genericModalList').innerHTML = ''; // Hide list

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px var(--danger));">☠️</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">VOID VULTURES</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Cut your engines and drop your shields! This is a toll sector. Pay the tithe, and you get to keep breathing. Try to run, and we'll turn your ship into slag."
            </p>
            <div style="margin-top: 20px; background: rgba(255, 0, 0, 0.1); border: 1px solid var(--danger); padding: 15px; border-radius: 4px;">
                <div style="color: var(--danger); font-size: 11px; margin-bottom: 5px; font-weight: bold; letter-spacing: 1px;">CREDIT DEMAND</div>
                <div style="font-size: 24px; color: var(--gold-text); font-weight: bold;">${formatNumber(demand)}c</div>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= demand;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--warning); color:var(--warning); box-shadow: 0 0 15px rgba(255,170,0,0.2);" ${!canAfford ? 'disabled' : ''} onclick="payPirateToll(${demand})">
            ${canAfford ? `PAY TOLL (${formatNumber(demand)}c)` : 'INSUFFICIENT FUNDS'}
        </button>
        <button class="action-button danger-btn" onclick="refusePirateToll()">REFUSE AND FIGHT</button>
    `;
}

function payPirateToll(amount) {
    if (playerCredits >= amount) {
        playerCredits -= amount;
        logMessage(`<span style="color:var(--warning)">[ EXTORTION ] You transferred ${formatNumber(amount)}c. The pirates power down their weapons and let you pass.</span>`);
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        
        pendingExtortionEnemy = null;
        closeGenericModal();
        changeGameState(GAME_STATES.GALACTIC_MAP);
        renderUIStats();
        autoSaveGame();
    }
}

function refusePirateToll() {
    closeGenericModal();
    logMessage("<span style='color:var(--danger); font-weight:bold;'>[ COMBAT ] 'Big mistake, spacer!' Weapons hot!</span>");
    startCombat(pendingExtortionEnemy);
    pendingExtortionEnemy = null;
}

function deployCombatDrone() {
    if (currentGameState !== GAME_STATES.COMBAT || !currentCombatContext) {
        if (typeof showToast === 'function') showToast("MUST BE IN COMBAT", "error");
        return false; // Don't consume the item!
    }

    // Add the drone to the combat context
    currentCombatContext.playerDrones = (currentCombatContext.playerDrones || 0) + 1;
    
    logMessage(`<span style="color:var(--success); font-weight:bold;">[ DRONE DEPLOYED ] Combat Swarm Drone launched! It engages the enemy!</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    if (typeof renderCombatView === 'function') renderCombatView();
    
    return true; // Consume the item!
}

// ==========================================
// --- EXPANSIVE WARZONE ENGINE ---
// ==========================================

function openSkirmishUI(skirmish, index) {
    // 1. Setup the Generic Modal (Setting the Fleet Battle Header)
    if (typeof openGenericModal === 'function') {
        openGenericModal("ACTIVE WARZONE", 'assets/skirmish.jpeg');
    }
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // --- State Machine Initialization ---
    const sk = activeSkirmishes[index];
    if (!sk) return;

    if (!sk.phase) {
        sk.phase = 'INITIAL';
        sk.turnsIn = 0; // Track how long we've been here
        sk.chaosLevel = 1; // Increases risk and reward over time
        sk.advantage = 0; // Positive for player, negative for enemies
        sk.investedRisk = 0; // Tracks potential damage built up from risky play
        sk.salvagePoints = 0; // Non-credits loot potential
        sk.supportedSide = null; // Who the player is actively helping
    }

    const facBColor = sk.factionB === 'ECLIPSE' ? '#9933FF' : 'var(--danger)';
    const facBName = sk.factionB === 'ECLIPSE' ? 'Cartel Smugglers' : "K'tharr Warband";

    // Dynamic Variables for rendering
    let leftHtml = "";
    let bodyImage = "";
    let mainTitle = `FLEET ENGAGEMENT`;
    let mainDesc = "";
    let actionBtnHtml = "";
    let dangerLevelMsg = "";

    // BUILD PORTRAIT / LEFT PANEL BASED ON PHASE/SIDE
    // Phase 1 (INITIAL) = Dynamic Sensors. Phase 2 (COMBAT/ENEMY) = Faction Portraits.

    if (sk.phase === 'INITIAL') {
        // Initial Phase: Show current faction strengths and Chaos Meter
        leftHtml = `
            <div style="padding:15px; border-bottom:1px solid var(--border-color, #ccc);">
                <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">TACTICAL SENSORS</div>
                <h4 style="color:var(--concord-color, #00AAFF); margin:0; text-transform:uppercase;">CONCORD PATROL</h4>
                <div style="font-size:12px; color:var(--text-color); margin-top:5px;">
                    • Cruisers: ${Math.floor(Math.random() * 2) + 1}<br>
                    • Status: Requesting Backup
                </div>
            </div>
            <div style="padding:15px;">
                <h4 style="color:${facBColor}; margin:0; text-transform:uppercase;">${facBName}</h4>
                <div style="font-size:12px; color:var(--text-color); margin-top:5px;">
                    • Gunships: ${Math.floor(Math.random() * 3) + 1}<br>
                    • Attack Profile: Flanking
                </div>
            </div>
        `;
    } else if (sk.supportedSide === 'CONCORD') {
        // INJECT Concord Admiral portrait
        leftHtml = `
            <div style="text-align:center; padding-top:20px;">
                <img src="assets/concord_admiral.jpeg" style="width: 100%; height: auto; border-bottom: 3px solid var(--accent-color, #00AAFF); max-width: 150px;" alt="Concord Admiral">
                <div style="font-size:10px; color:#888; letter-spacing:2px; margin-top:10px;">COMMAND LINK</div>
                <h4 style="color:var(--concord-color, #00AAFF); margin:5px 0; text-transform:uppercase;">ADMIRAL</h4>
                <div style="font-size:12px; color:var(--text-color); margin-top:5px; background:rgba(0,0,0,0.3); padding:5px;">
                    Advantage: <span style="color:var(--success); font-weight:bold;">${sk.advantage}</span><br>
                    Hull: Defensive Line
                </div>
            </div>
        `;
    } else if (sk.supportedSide === sk.factionB) {
        if (sk.factionB === 'ECLIPSE') {
            // INJECT Eclipse High Operative portrait
            leftHtml = `
                <div style="text-align:center; padding-top:20px;">
                    <img src="assets/eclipse_high_operative.png" style="width: 100%; height: auto; border-bottom: 3px solid #9933FF; max-width: 150px;" alt="Eclipse High Operative">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-top:10px;">TACTICAL LINK</div>
                    <h4 style="color:#9933FF; margin:5px 0; text-transform:uppercase;">HIGH OPERATIVE</h4>
                </div>
            `;
        } else {
            // INJECT K'Tharr Warlord portrait (Asset updated!)
            leftHtml = `
                <div style="text-align:center; padding-top:20px;">
                    <img src="assets/ktharr_warlord.png" style="width: 100%; height: auto; border-bottom: 3px solid var(--danger, #FF5555); max-width: 150px;" alt="K'Tharr Warlord">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-top:10px;">BATTLE LINK</div>
                    <h4 style="color:var(--danger, #FF5555); margin:5px 0; text-transform:uppercase;">WARLORD</h4>
                </div>
            `;
        }
    } else {
        // Scavenge State
        leftHtml = `
            <div style="padding:15px; border-bottom:1px solid var(--border-color, #ccc);">
                <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">ENVIRONMENT SENSORS</div>
                <h4 style="color:var(--gold-text); margin:0; text-transform:uppercase;">WRECKAGE ZONE</h4>
                <div style="font-size:12px; color:var(--text-color); margin-top:5px;">
                    • Debris Density: ${sk.salvagePoints > 10 ? `<span style="color:var(--gold-text)">CRITICAL</span>` : `Significant`}<br>
                    • Chaos Level: ${sk.chaosLevel}
                </div>
            </div>
            <div style="padding:15px;">
                <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">RISK ANALYSIS</div>
                <h4 style="color:var(--danger, #FF5555); margin:0; text-transform:uppercase;">STRAY FIRE</h4>
                <div style="font-size:12px; color:var(--text-color); margin-top:5px;">
                    • Probability: ${sk.investedRisk * 10}%<br>
                    • Shield Status: Interference
                </div>
            </div>
        `;
    }

    // --- PHASE/STATE ROUTING ---

    if (sk.phase === 'INITIAL') {
        mainTitle = "WARP INTERRUPTION";
        mainDesc = `You drop out of warp directly into a brutal firefight! Plasma fire and missiles tear through the void between a Concord patrol wing and a ${facBName}. Your tactical computer demands immediate orders. What is our approach, Captain?`;
        
        if (typeof playerNotoriety !== 'undefined' && playerNotoriety === 0 && (typeof playerFactionStanding !== 'undefined' && playerFactionStanding['CONCORD'] >= -20)) {
            actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="handleSkirmishAction(${index}, 'APPROACH_CONCORD')">ASSIST CONCORD FORCES</button>`;
        } else {
            actionBtnHtml += `<button class="action-button full-width-btn danger-btn" disabled>ASSIST CONCORD (WANTED BY AUTHORITIES)</button>`;
        }
        actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:${facBColor}; color:${facBColor}; margin-top:10px;" onclick="handleSkirmishAction(${index}, 'APPROACH_ENEMY')">ASSIST ${skirmish.factionB} FORCES</button>`;
        actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--gold-text); color:var(--gold-text); margin-top:10px;" onclick="handleSkirmishAction(${index}, 'APPROACH_SCAVENGE')">SCAVENGE THE DEBRIS</button>`;
        actionBtnHtml += `<button class="action-button full-width-btn" style="margin-top:10px;" onclick="closeAndCleanSkirmish(${index})">EVASIVE MANEUVERS (Flee)</button>`;

    } else if (sk.phase === 'COMBAT_TACTICS') {
        // --- EXPANSIVE Turn N COMBAT PHASE ---
        mainTitle = "TACTICAL ENGAGEMENT";
        sk.turnsIn++;
        
        // Image Scene: Update based on enemy
        const sceneImage = sk.factionB === 'ECLIPSE' ? 'assets/skirmish_1.jpeg' : 'assets/skirmish_3.png';
        bodyImage = `<img src="${sceneImage}" style="width: 100%; height: auto; border: 1px solid rgba(128,128,128,0.3); margin-bottom:15px; border-radius:4px;" alt="Tactical Scene">`;
        
        if (sk.supportedSide === 'CONCORD') {
            mainDesc = `Admiral on comms: <i>"Captain, we've stabilized the core formation. They've shifted their gunships to flank us. We need you to coordinate a combined tactical strike on their lead cruiser while we focus their support craft!"</i><br><br>Chaos Level is increasing. Advantage: ${sk.advantage}`;
            
            // Turn N Actions (Support Concord)
            actionBtnHtml += `<button class="action-button full-width-btn" onclick="handleSkirmishAction(${index}, 'CONCORD_TACTICAL_STRIKE')">COORDINATE TACTICAL STRIKE (Credits +, Rep +, Chaos ++)</button>`;
            if (sk.advantage > 0 && Math.random() < 0.6) {
                // Occasional high reward option
                actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--danger); color:var(--danger); margin-top:10px;" onclick="handleSkirmishAction(${index}, 'CONCORD_HACK_TARGETING')">HACK TARGETING ARRAY (MASSIVE Advantage, Risk Hull)</button>`;
            }
            if (sk.turnsIn >= 2) {
                actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--success); color:var(--success); margin-top:10px;" onclick="handleSkirmishAction(${index}, 'CONCORD_TRIGGER_BATTLE')">FINAL ASSAULT (Trigger Pew-Pew with advantage)</button>`;
            }
            actionBtnHtml += `<button class="action-button full-width-btn" style="margin-top:10px;" onclick="handleSkirmishAction(${index}, 'TACTICS_RETREAT')">RETREAT AND DISENGAGE</button>`;

        } else if (sk.supportedSide === sk.factionB) {
            mainDesc = `Commander on comms: <i>"Aegis curs are retreating! They're trying to drop their debris to jam our sensors! Hack their navigation matrix so they can't call reinforcements, or assist us in cutting them down!"</i><br><br>The Void Crystals on that wreck are exposed. Chaos Level: ${sk.chaosLevel}`;
            
            // Turn N Actions (Support Enemy)
            if (sk.factionB === 'ECLIPSE') {
                actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:#9933FF; color:#9933FF;" onclick="handleSkirmishAction(${index}, 'ECLIPSE_HACK_NAV')">HACK NAVIGATION MATRIX (MASSIVE Credits +, Notoriety +, Chaos ++)</button>`;
            } else {
                actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--danger); color:var(--danger);" onclick="handleSkirmishAction(${index}, 'KTHARR_RAMMING_VECTOR')">COORDINATE RAMMING VECTOR (Chaos +++, Advantage ++, Risk Hull)</button>`;
            }
            actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--warning); color:var(--warning); margin-top:10px;" onclick="handleSkirmishAction(${index}, 'ENEMY_FULL_ASSAULT')">TRIGGER FULL ASSAULT (Trigger Pew-Pew)</button>`;
            actionBtnHtml += `<button class="action-button full-width-btn" style="margin-top:10px;" onclick="handleSkirmishAction(${index}, 'TACTICS_RETREAT')">BREAK FORMATION & DISENGAGE</button>`;
        }
        
    } else if (sk.phase === 'SCAVENGE_TACTICS') {
        // --- Turn N SCAVENGING PHASE ---
        mainTitle = "DEBRIS FIELD SALVAGE";
        sk.turnsIn++;
        
        // Dynamic Scene: Wreckage
        bodyImage = `<img src="assets/skirmish_2.png" style="width: 100%; height: auto; border: 1px solid rgba(128,128,128,0.3); margin-bottom:15px; border-radius:4px;" alt="Scavenge Scene">`;

        mainDesc = `You cut your engines and drift into the wreckage. The surrounding combat is incredibly intense. Our sensors detect a rare VOID CRYSTAL cache on that spinning cruiser, but its reactor stability is dropping fast. Invested Risk: ${sk.investedRisk}`;
        
        // Turn N Actions (Scavenger)
        if (typeof playerPerks !== 'undefined' && playerPerks.has('VOID_DIVER')) {
            // VOID DIVER PERK OPTION
            actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--success); color:var(--success);" onclick="handleSkirmishAction(${index}, 'SCAVENGE_VOID_CACH')">SQUEEZE PAST (No Risk, Guaranteed VOID CRYSTALS!)</button>`;
        } else if (sk.chaosLevel > 2 && sk.investedRisk > 5) {
            // CRITICAL OPTION (Risky play builds up to this)
            actionBtnHtml += `<button class="action-button full-width-btn danger-btn" onclick="handleSkirmishAction(${index}, 'SCAVENGE_PULL_CRITICAL')">PRY OPEN MAIN VAULT (HUGE Tech Loot, Critical Hull Risk)</button>`;
        }
        
        actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--gold-text); color:var(--gold-text); margin-top:10px;" onclick="handleSkirmishAction(${index}, 'SCAVENGE_TRACTOR_LOOSE')">TRACTOR LOOSE SCRAP (Safe, Credits +, Chaos ++)</button>`;
        actionBtnHtml += `<button class="action-button full-width-btn" style="border-color:var(--warning); color:var(--warning); margin-top:10px;" onclick="handleSkirmishAction(${index}, 'SCAVENGE_SCAN_DATA')">SCAN FOR DATA CACHES (Encrypted Data, Notoriety +, Chaos ++)</button>`;
        actionBtnHtml += `<button class="action-button full-width-btn" style="margin-top:10px;" onclick="handleSkirmishAction(${index}, 'SCAVENGE_RETREAT')">DISENGAGE AND FLEE WITH SALVAGE</button>`;
    }

    // --- RENDER PANELS ---

    // Left Panel (Portrait or tactical data)
    listEl.innerHTML = leftHtml;

    // Right Body (Images and Text)
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:50px; margin-bottom:15px; ${sk.phase === 'INITIAL' ? 'animation: shake-effect 0.5s infinite;' : ''}">💥</div>
            <h3 style="color:var(--warning); margin-bottom:20px;">${mainTitle}</h3>
            
            ${bodyImage}

            <p style="color:var(--text-color); font-size:14px; line-height:1.6; text-align:left; background:rgba(128,128,128,0.15); padding:15px; border-left: 3px solid var(--warning); border-radius: 4px;">
                ${mainDesc}
            </p>
        </div>
    `;

    // Actions
    actionsEl.innerHTML = actionBtnHtml;
}

// ==========================================
// --- ITERATIVE RESOLUTION ENGINE ---
// ==========================================

function handleSkirmishAction(index, action) {
    let sk = activeSkirmishes[index];
    if (!sk) return;

    let logMsg = "";
    
    // Safety check for faction standing
    if (typeof playerFactionStanding === 'undefined') window.playerFactionStanding = {};

    // ESCALATE CHAOS FOR EVERY TURN PASSING (Chaos increases payout mult)
    if (sk.phase !== 'INITIAL') sk.chaosLevel++;
    
    // --- 1. INITIAL PHASE APPROACH CHOICES ---
    if (action === 'APPROACH_CONCORD') {
        logMessage(`<span style="color:var(--accent-color); font-weight:bold;">[ WARZONE ]</span> Comms established with Admiral. State intent.`);
        sk.supportedSide = 'CONCORD';
        sk.phase = 'COMBAT_TACTICS';
        openSkirmishUI(sk, index);
        return;
    }
    if (action === 'APPROACH_ENEMY') {
        logMessage(`<span style="color:${sk.factionB === 'ECLIPSE' ? '#9933FF' : 'var(--danger)'}; font-weight:bold;">[ WARZONE ]</span> Weapons locked. Transmitting coordinates to the ${sk.factionB} forces.`);
        sk.supportedSide = sk.factionB;
        sk.phase = 'COMBAT_TACTICS';
        openSkirmishUI(sk, index);
        return;
    }
    if (action === 'APPROACH_SCAVENGE') {
        logMessage(`<span style="color:var(--gold-text); font-weight:bold;">[ WARZONE ]</span> Silent running enabled. Drifting into the wreckage field.`);
        sk.phase = 'SCAVENGE_TACTICS';
        openSkirmishUI(sk, index);
        return;
    }

    // --- 2. COMBATANT LOOP RESOLUTIONS ---

    // A. Concord Paths
    if (action === 'CONCORD_TACTICAL_STRIKE') {
        const reward = (1500 + Math.floor(Math.random() * 500)) * (1 + (sk.chaosLevel / 10)); // chaotic mult
        playerCredits += reward;
        playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 5;
        sk.advantage += 2; // build up advantage
        sk.chaosLevel++; // expedited chaos
        logMsg = `<span style="color:var(--accent-color); font-weight:bold;">[ WARZONE ]</span> Crucial flank intercepted! Concord Command wired ${formatNumber(reward)}c. (+5 Rep)`;
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        openSkirmishUI(sk, index);
    }
    else if (action === 'CONCORD_HACK_TARGETING') {
        // High Risk/Reward hack option
        if (Math.random() < 0.8) { // 80% success
            sk.advantage += 10; // MASSIVE Advantage
            sk.chaosLevel += 3;
            logMsg = `<span style="color:var(--success); font-weight:bold;">[ WARZONE ]</span> Cyber-warfare successful! Targeted arrays breached. (+10 Advantage)`;
        } else { // 20% failure
            sk.advantage -= 5;
            const dmg = 35 + Math.floor(Math.random() * 20);
            playerHull -= dmg;
            logMsg = `<span style="color:var(--danger); font-weight:bold;">[ WARZONE ]</span> Hack failed! We drew direct Concord counter-battery fire! Took ${dmg} hull damage!`;
            if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
            if (playerHull <= 0) {
                closeGenericModal();
                if (typeof triggerGameOver === 'function') triggerGameOver("Obliterated by an Aegis Cruiser counter-battery");
                return;
            }
        }
        openSkirmishUI(sk, index);
    }
    else if (action === 'CONCORD_TRIGGER_BATTLE') {
        // Risk translates to notoriety when directly aiding law enforcement via warfare
        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(sk.investedRisk * 2); 
        launchSkirmishCombat(index, sk.factionB, `<span style="color:var(--success); font-weight:bold;">[ WARZONE ]</span> Final Assault initiated! Engaging opposing forces with massive tactical advantage! (+${sk.advantage} Advantage)`, sk.advantage);
        return; 
    }

    // B. Enemy/Eclipse/K'Tharr Paths
    else if (action === 'ECLIPSE_HACK_NAV') {
        const reward = (2000 + Math.floor(Math.random() * 1000)) * (1 + (sk.chaosLevel / 10)); // chaotic mult
        playerCredits += reward;
        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(10); // Small notoriety per hack
        sk.chaosLevel += 2; // expedited chaos
        sk.salvagePoints += 10; // hacking builds salvage loot potential!
        logMsg = `<span style="color:#9933FF; font-weight:bold;">[ WARZONE ]</span> Commsmatrix breached! High Operative sent you ${formatNumber(reward)}c for the isolation assist! (+10 Notoriety)`;
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        openSkirmishUI(sk, index);
    }
    else if (action === 'KTHARR_RAMMING_VECTOR') {
        sk.advantage += 8; // Massive Advantage!
        sk.chaosLevel += 5; // expedite chaos
        const dmg = 15 + Math.floor(Math.random() * 10);
        playerHull -= dmg; // ALWAYS take damage coordinating a ram!
        logMsg = `<span style="color:var(--danger); font-weight:bold;">[ WARZONE ]</span> Coordinated ramming complete! Hull integrity compromised! (+8 Advantage, -${dmg} Hull)`;
        if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
        if (playerHull <= 0) {
            closeGenericModal();
            if (typeof triggerGameOver === 'function') triggerGameOver("Killed coordinating a K'tharr Ramming Vector");
            return;
        }
        openSkirmishUI(sk, index);
    }
    else if (action === 'ENEMY_FULL_ASSAULT') {
        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(15 + sk.investedRisk * 3); // Massive criminal notoriety
        launchSkirmishCombat(index, "CONCORD", `<span style="color:var(--danger); font-weight:bold;">[ WARZONE ]</span> You fired a full broadside into the Concord Admiral! Launching standard space combat! (+15 Advantage)`, sk.advantage);
        return; 
    }

    // --- 3. SCAVENGER LOOP RESOLUTIONS ---

    else if (action === 'SCAVENGE_PULL_CRITICAL') {
        // Failure chance is based on accumulated risk
        const successChance = 0.60 - (sk.investedRisk / 100);
        if (Math.random() < successChance) { 
            const reward = (3500 + Math.floor(Math.random() * 2000)) * (1 + (sk.chaosLevel / 10)); // chaotic mult
            playerCredits += reward;
            playerCargo['VOID_CRYSTALS'] = (playerCargo['VOID_CRYSTALS'] || 0) + 1;
            sk.salvagePoints += 20; // Massive salvage buildup!
            logMsg = `<span style="color:var(--success); font-weight:bold;">[ SCAVENGE ]</span> Vault bypassed successfully! Salvaged a VOID CRYSTAL and picked up heavy salvage!`;
            if (typeof soundManager !== 'undefined') soundManager.playGain();
        } else {
            // Built-up risk converts to immediate critical damage!
            const finalDmg = (35 + sk.investedRisk) * 2; 
            playerHull -= finalDmg;
            logMsg = `<span style="color:var(--danger); font-weight:bold;">[ SCAVENGE ]</span> Eruption! Built-up stray fire built up risk and reactor ignited simultaneously! Took ${finalDmg} hull damage!`;
            if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
            if (playerHull <= 0) {
                closeGenericModal();
                if (typeof triggerGameOver === 'function') triggerGameOver("Obliterated in a Warzone Scavenging Critical Failure");
                return;
            }
        }
        openSkirmishUI(sk, index);
    }
    else if (action === 'SCAVENGE_VOID_CACH') {
        // VOID DIVER PERK OPTION
        playerCargo['VOID_CRYSTALS'] = (playerCargo['VOID_CRYSTALS'] || 0) + 3; // Huge loot!
        logMsg = `<span style="color:var(--success); font-weight:bold;">[ SCAVENGE ]</span> Perceptions shifted. Squeezed past space and reactor core simultaneously. Sliced out 3x VOID CRYSTALS! Disengaging.`;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        closeAndCleanSkirmish(index, logMsg); // Perk path allows clean exit
    }
    else if (action === 'SCAVENGE_TRACTOR_LOOSE') {
        const scrap = (2 + Math.floor(Math.random() * 5)) * sk.chaosLevel; // chaos mult!
        playerCargo['TECH_PARTS'] = (playerCargo['TECH_PARTS'] || 0) + Math.floor(scrap);
        sk.salvagePoints += 5; // building salvage
        sk.investedRisk += 2; // building risk
        logMsg = `<span style="color:var(--gold-text); font-weight:bold;">[ SCAVENGE ]</span> Tractored ${Math.floor(scrap)}x Tech Parts. (+5 Salvage, +2 Risk)`;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        openSkirmishUI(sk, index);
    }
    else if (action === 'SCAVENGE_SCAN_DATA') {
        const data = (1 + Math.floor(Math.random() * 2)) * sk.chaosLevel; // chaos mult!
        playerCargo['ENCRYPTED_DATA'] = (playerCargo['ENCRYPTED_DATA'] || 0) + Math.floor(data);
        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(5); // Notoriety per data scan
        sk.salvagePoints += 8; // building salvage
        sk.investedRisk += 4; // building risk
        logMsg = `<span style="color:var(--success); font-weight:bold;">[ SCAVENGE ]</span> Download successful! Salvaged ${Math.floor(data)}x Encrypted Data Caches. (+8 Salvage, +4 Risk, +5 Notoriety)`;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        openSkirmishUI(sk, index);
    }

    // --- 4. DISENGAGE RESOLUTIONS (Loot Finalization) ---

    else if (action === 'TACTICS_RETREAT') {
        // Built up Rep payout
        playerFactionStanding[sk.supportedSide] = (playerFactionStanding[sk.supportedSide] || 0) + (sk.turnsIn * 2); 
        logMsg = `<span style="color:var(--warning); font-weight:bold;">[ WARZONE ]</span> Breaking formation! Battle concludes behind us. (+${sk.turnsIn * 2} Rep with supported side)`;
        closeAndCleanSkirmish(index, logMsg);
    }
    else if (action === 'SCAVENGE_RETREAT') {
        // SCAVENGE LOOT FINALIZATION (salvage points converts to Tech Parts and Credits)
        const bonusCredits = (1500 * sk.salvagePoints) * (1 + (sk.chaosLevel / 10)); // chaos mult!
        playerCredits += Math.floor(bonusCredits);
        const finalTechParts = Math.floor(sk.salvagePoints * 1.5);
        playerCargo['TECH_PARTS'] = (playerCargo['TECH_PARTS'] || 0) + finalTechParts;
        
        logMsg = `<span style="color:var(--gold-text); font-weight:bold;">[ SCAVENGE ]</span> Evasive maneuvers successful! Slipped away with ${finalTechParts}x Tech Parts and collected ${formatNumber(Math.floor(bonusCredits))}c salvage payout!`;
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        closeAndCleanSkirmish(index, logMsg);
    }
}

// ==========================================
// --- WARZONE HELPER FUNCTIONS ---
// ==========================================

// Helper to transition smoothly from the text event into direct space combat
function launchSkirmishCombat(index, targetFaction, logMsg, bonusAdvantage = 0) {
    const sk = activeSkirmishes[index];
    if (!sk) return; 

    // Safety check for faction standing
    if (typeof playerFactionStanding === 'undefined') window.playerFactionStanding = {};

    let specificEnemyId = null;
    if (typeof PIRATE_SHIP_CLASSES !== 'undefined') {
        const shipOptions = Object.values(PIRATE_SHIP_CLASSES).filter(s => s.id && s.id.includes(targetFaction));
        if (shipOptions.length > 0) {
            specificEnemyId = shipOptions[Math.floor(Math.random() * shipOptions.length)].id;
        }
    }

    // Package data for the combat engine
    const specificEnemy = {
        x: sk.x, y: sk.y,
        shipClassKey: specificEnemyId || "PIRATE_INTERCEPTOR", // Default fallback
        customCombatBackground: 'assets/skirmish.jpeg', // 🚨 INJECT Warzone Background! 🚨
        isSkirmishTarget: true, // Flag for victory screen bonus check
        supportedFaction: sk.supportedSide,
        combatBonusAdvantage: bonusAdvantage // pass the built-up advantage!
    };

    activeSkirmishes.splice(index, 1);
    
    // CLOSE MODAL AND TRIGGER PEW-PEW
    if (typeof closeGenericModal === 'function') closeGenericModal();
    if (logMsg) logMessage(logMsg);
    if (typeof startCombat === 'function') startCombat(specificEnemy);
}

// Helper to clean up the map and UI when a skirmish ends without combat (loot resolution or escape)
function closeAndCleanSkirmish(index, logMsg) {
    activeSkirmishes.splice(index, 1);
    
    // CLOSE MODAL AND UPDATE GALACTIC MAP
    if (typeof closeGenericModal === 'function') closeGenericModal();
    if (logMsg) logMessage(logMsg);
    
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
    if (typeof render === 'function') render();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}
