function triggerCombatHitAnimation() {
    gameScreen.classList.add('shake');
    setTimeout(() => {
        gameScreen.classList.remove('shake');
    }, 250);
}

function triggerPlayerDamageAnimation() {
    document.body.classList.add('flash-red');
    gameScreen.classList.add('shake');
    setTimeout(() => {
        document.body.classList.remove('flash-red');
        gameScreen.classList.remove('shake');
    }, 250);
}

function resolveCombat(enemyKey) {
    const enemyData = ENEMY_TYPES[enemyKey];
    if (!enemyData) {
        addLogMessage("An unknown foe fades into the shadows...", "combat-message");
        return;
    }
    let enemy = { ...enemyData }; 
    
    // PHASE 4: Endless Abyss Enemy Scaling
    if (gameState.currentZoneIndex === 8) {
        let scale = 1 + (gameState.playerZoneX / 200); 
        enemy.hp = Math.floor(enemy.hp * scale);
        enemy.attack = Math.floor(enemy.attack * scale);
        enemy.defense = Math.floor(enemy.defense * scale);
        enemy.xp = Math.floor(enemy.xp * scale);
        enemy.name = "Abyssal " + enemy.name;
    }

    addLogMessage(`You encounter a ${enemy.name}! ${enemy.description}`, "combat-message");
    gameState.inCombat = true;
    pauseGameForDecision(true);

    presentCombatOptions(enemy);
}

function presentCombatOptions(enemy) {
    if (gameState.auto.combat) {
        decisionArea.style.display = 'block'; 
        decisionPromptText.textContent = `HP: ${Math.max(0, gameState.currentHp)}/${gameState.maxHp} | ${enemy.name} HP: ${enemy.hp} | [AUTO-COMBAT]`;
        decisionButtonsContainer.innerHTML = ''; // Hide buttons
        
        setTimeout(() => {
            if (!gameState.inCombat) return; // Failsafe
            
            // 1. Heal if below 40%
            if (gameState.currentHp <= gameState.maxHp * 0.4 && gameState.inventory['healing_dust'] > 0) {
                CONSUMABLES['healing_dust'].effect();
                gameState.inventory['healing_dust']--;
                renderAll(); 
                setTimeout(() => executeEnemyTurn(enemy), 500);
            } 
            // 2. Cast Dust Nova if below 60% and have dust
            else if (gameState.currentHp <= gameState.maxHp * 0.6 && gameState.resources.glimmeringDust >= 25) {
                gameState.resources.glimmeringDust -= 25;
                gameState.currentHp = Math.min(gameState.maxHp, gameState.currentHp + 15);
                addLogMessage("Auto-Cast: Dust Nova! (+15 HP)", "synergy");
                playSound('artifact'); 
                triggerCombatHitAnimation();
                enemy.hp -= 15; 
                checkEnemyDeath(enemy);
            }
            // 3. Otherwise Attack
            else { 
                executePlayerTurn(enemy); 
            }
        }, 600); // Wait 0.6s between turns so the player can watch the fight
        return;
    }

    decisionPromptText.textContent = `HP: ${Math.max(0, gameState.currentHp)}/${gameState.maxHp} | ${enemy.name} HP: ${enemy.hp}`;
    decisionButtonsContainer.innerHTML = '';

    const attackButton = document.createElement('button');
    attackButton.textContent = 'Attack';
    attackButton.onclick = () => {
        executePlayerTurn(enemy);
    };
    decisionButtonsContainer.appendChild(attackButton);

    const itemsButton = document.createElement('button');
    itemsButton.textContent = 'Items';
    itemsButton.onclick = () => {
        presentItemSelection(enemy);
    };
    
    const hasItems = Object.values(gameState.inventory).some(count => count > 0);
    if (!hasItems) {
        itemsButton.disabled = true;
        itemsButton.title = "You have no items to use.";
    }
    decisionButtonsContainer.appendChild(itemsButton);
    
    // PHASE 4: Added Magic System
    const magicButton = document.createElement('button');
    magicButton.textContent = 'Magic';
    magicButton.onclick = () => {
        presentMagicSelection(enemy);
    };
    decisionButtonsContainer.appendChild(magicButton);

    const fleeButton = document.createElement('button');
    fleeButton.textContent = 'Flee';
    fleeButton.onclick = () => {
        addLogMessage(`You disengage, losing ${COMBAT_ESCAPE_DUST_LOSS} Glimmering Dust in your haste.`, "combat-message");
        playSound('combatMiss');
        gameState.resources.glimmeringDust = Math.max(0, gameState.resources.glimmeringDust - COMBAT_ESCAPE_DUST_LOSS);
        endCombat();
    };
    decisionButtonsContainer.appendChild(fleeButton);

    decisionArea.style.display = 'block';
    updateUIAccentColors();
}

function presentItemSelection(enemy) {
    decisionPromptText.textContent = 'Choose an item to use.';
    decisionButtonsContainer.innerHTML = '';

    for (const itemId in gameState.inventory) {
        const count = gameState.inventory[itemId];
        if (count > 0 && CONSUMABLES[itemId]) {
            const item = CONSUMABLES[itemId];
            const itemButton = document.createElement('button');
            itemButton.innerHTML = `${item.name} (x${count})<br><small>${item.description}</small>`;
            itemButton.onclick = () => {
                item.effect();
                gameState.inventory[itemId]--; 
                renderAll(); 
                setTimeout(() => executeEnemyTurn(enemy), 500);
            };
            decisionButtonsContainer.appendChild(itemButton);
        }
    }

    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.onclick = () => {
        presentCombatOptions(enemy); 
    };
    decisionButtonsContainer.appendChild(backButton);
}

// PHASE 4: Present Magic Options
function presentMagicSelection(enemy) {
    decisionPromptText.textContent = 'Channel your gathered energies.';
    decisionButtonsContainer.innerHTML = '';

    const voidBlastBtn = document.createElement('button');
    voidBlastBtn.innerHTML = `Void Blast (1 VE)<br><small>Deals 30 Damage.</small>`;
    voidBlastBtn.disabled = gameState.resources.voidEssence < 1;
    voidBlastBtn.onclick = () => {
        gameState.resources.voidEssence--;
        addLogMessage("You channel raw Void Essence into a devastating blast!", "synergy");
        playSound('combatHit');
        triggerCombatHitAnimation();
        enemy.hp -= 30;
        checkEnemyDeath(enemy);
    };
    decisionButtonsContainer.appendChild(voidBlastBtn);

    const dustNovaBtn = document.createElement('button');
    dustNovaBtn.innerHTML = `Dust Nova (25 Dust)<br><small>Deals 15 Dmg, Heals 15 HP.</small>`;
    dustNovaBtn.disabled = gameState.resources.glimmeringDust < 25;
    dustNovaBtn.onclick = () => {
        gameState.resources.glimmeringDust -= 25;
        gameState.currentHp = Math.min(gameState.maxHp, gameState.currentHp + 15);
        addLogMessage("A shockwave of shimmering dust sears the enemy and knits your wounds! (+15 HP)", "synergy");
        playSound('artifact');
        triggerCombatHitAnimation();
        enemy.hp -= 15;
        checkEnemyDeath(enemy);
    };
    decisionButtonsContainer.appendChild(dustNovaBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.onclick = () => presentCombatOptions(enemy);
    decisionButtonsContainer.appendChild(backBtn);
}

function checkEnemyDeath(enemy) {
    if (enemy.hp <= 0) {
        addLogMessage(`You have vanquished the ${enemy.name}!`, "combat-victory");
        playSound('combatVictory');
        awardXP(enemy.xp);
        
        // PHASE 4: Rune of Growth
        if (gameState.activeRunes.includes('Γ')) {
             gameState.stats.might++; // Hacky way to give max HP without custom flags, but functional
             gameState.maxHp = calculateMaxHp();
             gameState.currentHp += 1;
             addLogMessage("The Rune of Growth absorbs the victory, granting you +1 Max HP!", "synergy");
        }

        const lootAmount = enemy.loot();
        if (lootAmount > 0) {
            gameState.resources.glimmeringDust += lootAmount;
            addLogMessage(`It drops ${lootAmount} Glimmering Dust.`, "combat-message");
        }
        endCombat();
    } else {
        setTimeout(() => executeEnemyTurn(enemy), 800); 
    }
}


function executePlayerTurn(enemy) {
    decisionArea.style.display = 'none'; 

    const effectiveStats = getEffectiveStats();
    let playerAttackPower = effectiveStats.might + seededRandomInt(0, Math.floor(gameState.level / 2));
    let bonusDamage = 0;
    
    if (gameState.activeRunes.includes('Ω')) {
        bonusDamage = 2; 
    }

    const damageToEnemy = Math.max(1, playerAttackPower - Math.floor(enemy.defense / 2)) + bonusDamage;
    
    // PHASE 4: Check Swiftness Rune
    let numAttacks = 1;
    if (gameState.activeRunes.includes('Σ') && seededRandom() < 0.20) {
        numAttacks = 2;
        addLogMessage("The Rune of Swiftness flashes! You strike with blinding speed!", "synergy");
    }

    for(let i=0; i<numAttacks; i++) {
        enemy.hp -= damageToEnemy;
        addLogMessage(`You strike for ${damageToEnemy} damage! ${enemy.name} HP: ${Math.max(0, enemy.hp)}`, "combat-message");
        playSound('combatHit');
        triggerCombatHitAnimation(); 
        
        // PHASE 4: Check Vampirism Rune
        if (gameState.activeRunes.includes('V')) {
            gameState.currentHp = Math.min(gameState.maxHp, gameState.currentHp + 1);
        }
    }

    checkEnemyDeath(enemy);
}

function executeEnemyTurn(enemy) {
    decisionArea.style.display = 'none';

    if (gameState.playerStatusEffects && gameState.playerStatusEffects.Corruption && gameState.playerStatusEffects.Corruption.turnsRemaining > 0) {
        const corruptionDamage = gameState.playerStatusEffects.Corruption.damage;
        gameState.currentHp -= corruptionDamage;
        addLogMessage(`You suffer ${corruptionDamage} damage from Void Corruption!`, "combat-defeat");
        triggerPlayerDamageAnimation(); 
        gameState.playerStatusEffects.Corruption.turnsRemaining--;

        if (gameState.playerStatusEffects.Corruption.turnsRemaining <= 0) {
            addLogMessage("The feeling of corruption fades.", "synergy");
            delete gameState.playerStatusEffects.Corruption;
        }
    }

    // Pre-death check logic so we can apply companion save properly
    if (gameState.currentHp <= 0) {
         checkPlayerDeath(enemy);
         return;
    }

    const effectiveStats = getEffectiveStats();
    
    const dodgeChance = effectiveStats.wits * 0.015; 
    if (seededRandom() < dodgeChance) {
        addLogMessage(`Your quick wits allow you to anticipate the attack and dodge it entirely!`, "synergy");
        playSound('combatMiss');
        
        if (enemy.isCharging) {
             addLogMessage(`You narrowly evade the massive Corruption Cannon blast!`, "synergy");
             enemy.isCharging = false; 
        }
        
        setTimeout(() => presentCombatOptions(enemy), 800);
        return; 
    }

    if (enemy.isCharging) {
        addLogMessage(`${enemy.name} unleashes its Corruption Cannon!`, "combat-message");
        playSound('combatHit');
        triggerPlayerDamageAnimation(); 
        
        const specialDamage = 20; 
        gameState.currentHp -= specialDamage;
        addLogMessage(`The blast hits you for ${specialDamage} damage and leaves you feeling corrupted!`, "combat-defeat");

        gameState.playerStatusEffects.Corruption = {
            damage: 3, 
            turnsRemaining: 3
        };

        enemy.isCharging = false; 

    } else if (enemy.name === "Void-Scarred Sentinel" && seededRandom() < 0.40) { 
        enemy.isCharging = true;
        addLogMessage(`${enemy.name}'s void fissures glow intensely as it charges its cannon! It will fire next turn!`, "combat-message");

    } else {
        let damageReduction = gameState.activeRunes.includes('Δ') ? 1 : 0;
        const enemyAttackPower = enemy.attack + seededRandomInt(-1, 1);
        const playerDefenseSoak = Math.floor(effectiveStats.might / 3);
        const damageToPlayer = Math.max(0, enemyAttackPower - playerDefenseSoak - damageReduction);
        
        gameState.currentHp -= damageToPlayer;

        if (damageToPlayer > 0) {
            addLogMessage(`${enemy.name} attacks for ${damageToPlayer} damage! Your HP: ${Math.max(0, gameState.currentHp)}`, "combat-message");
            triggerPlayerDamageAnimation(); 
        } else {
            addLogMessage(`${enemy.name} attacks, but you deftly block it!`, "combat-message");
            playSound('combatMiss');
        }
    }

    checkPlayerDeath(enemy);
}

function checkPlayerDeath(enemy) {
    if (gameState.currentHp <= 0) {
        if (gameState.companion && !gameState.narrativeFlags.companionSavedLife) {
            gameState.currentHp = 1;
            gameState.narrativeFlags.companionSavedLife = true;
            addLogMessage(`${gameState.companion.name} leaps in front of the fatal blow, saving your life!`, "companion");
            playSound('companionFind'); 
            setTimeout(() => presentCombatOptions(enemy), 800);
        } else {
            addLogMessage(`You have been defeated by the ${enemy.name}... Darkness takes you.`, "combat-defeat");
            playSound('combatDefeat');
            handleGameEnd("Your journey has ended in defeat...");
        }
    } else {
        setTimeout(() => presentCombatOptions(enemy), 800);
    }
    renderAll();
}

function endCombat() {
    decisionArea.style.display = 'none';
    gameState.inCombat = false;
    gameState.playerStatusEffects = {};
    pauseGameForDecision(false);
    renderAll();
}
