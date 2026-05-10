function openTalentModal() {
    inputQueue = [];
    renderTalentTree();
    talentModal.classList.remove('hidden');
}

function renderTalentTree() {
    talentListDiv.innerHTML = '';
    const player = gameState.player;
    const playerTalents = player.talents || [];

    talentPointsDisplay.textContent = `Mastery Points: ${player.talentPoints || 0}`;

    for (const key in TALENT_DATA) {
        const talent = TALENT_DATA[key];
        const isLearned = playerTalents.includes(key);
        const canAfford = (player.talentPoints > 0);

        const div = document.createElement('div');
        div.className = `panel p-3 rounded border ${isLearned ? 'border-green-500 bg-green-900 bg-opacity-20' : 'border-gray-600'}`;

        let btnHtml = '';
        if (isLearned) {
            btnHtml = `<span class="text-green-500 font-bold text-sm">Learned</span>`;
        } else if (canAfford) {
            btnHtml = `<button onclick="learnTalent('${key}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm">Learn</button>`;
        } else {
            btnHtml = `<span class="text-gray-500 text-sm">Locked</span>`;
        }

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">${talent.icon}</div>
                    <div>
                        <div class="font-bold">${talent.name} <span class="text-xs text-gray-400 uppercase">[${talent.class}]</span></div>
                        <div class="text-xs text-gray-300">${talent.description}</div>
                    </div>
                </div>
                <div>${btnHtml}</div>
            </div>
        `;
        talentListDiv.appendChild(div);
    }
}


// Global scope for HTML onclick
window.learnTalent = function (talentId) {
    const player = gameState.player;
    if (!player.talentPoints || player.talentPoints <= 0) return;
    if (player.talents && player.talents.includes(talentId)) return;

    if (!player.talents) player.talents = [];
    player.talents.push(talentId);
    player.talentPoints--;

    logMessage(`You mastered the ${TALENT_DATA[talentId].name} talent!`);
    triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');

    playerRef.update({
        talents: player.talents,
        talentPoints: player.talentPoints
    });

    renderTalentTree();
};

function openEvolutionModal() {
    // 1. Get player's base class (e.g., 'warrior')
    // We stored this in 'player.background' in your save system
    const baseClass = gameState.player.background;
    const options = EVOLUTION_DATA[baseClass];

    if (!options) return; // Should not happen if data is correct

    evolutionOptionsDiv.innerHTML = '';

    options.forEach(evo => {
        const div = document.createElement('div');
        div.className = "panel p-4 rounded-xl border-2 hover:border-yellow-500 cursor-pointer transition-all";
        div.onclick = () => selectEvolution(evo);
        div.innerHTML = `
            <div class="text-4xl mb-2">${evo.icon}</div>
            <h3 class="text-xl font-bold text-highlight">${evo.name}</h3>
            <p class="text-sm text-gray-500 mb-2">${evo.description}</p>
            <div class="text-xs font-bold text-green-500">
                ${Object.entries(evo.stats).map(([k, v]) => `+${v} ${k}`).join(', ')}
            </div>
        `;
        evolutionOptionsDiv.appendChild(div);
    });

    evolutionModal.classList.remove('hidden');
}

function selectEvolution(evoData) {
    const player = gameState.player;

    // 1. Apply Stats
    for (const stat in evoData.stats) {
        if (player.hasOwnProperty(stat)) {
            player[stat] += evoData.stats[stat];
        }
    }

    // 2. Apply Special Properties
    player.character = evoData.icon; // Change sprite
    player.classEvolved = true;
    player.className = evoData.name; // Store the new class name

    // 3. Add Talent
    if (!player.talents) player.talents = [];
    player.talents.push(evoData.talent);

    // 4. Update max health/mana if constitution/wits changed
    if (evoData.stats.constitution) player.maxHealth += (evoData.stats.constitution * 5);
    if (evoData.stats.wits) player.maxMana += (evoData.stats.wits * 5);
    if (evoData.stats.maxMana) player.maxMana += evoData.stats.maxMana; // Direct mana buff

    // 5. Full Heal on Evolve
    player.health = player.maxHealth;
    player.mana = player.maxMana;

    // 6. Save & Close
    logMessage(`You have evolved into a ${evoData.name}!`);
    playerRef.update({
        ...player, // Saves stats, character icon, talents
        classEvolved: true
    });

    evolutionModal.classList.add('hidden');
    renderStats();
    render(); // Update sprite on screen
}

function openBountyBoard() {
    inputQueue = [];
    renderBountyBoard();
    questModal.classList.remove('hidden');
}

// Renders the content of the bounty board
function renderBountyBoard() {
    questList.innerHTML = '';
    const playerQuests = gameState.player.quests;

    // Loop through all defined quests
    for (const questId in QUEST_DATA) {
        const quest = QUEST_DATA[questId];

        if (quest.type === 'fetch' || quest.type === 'collect') continue;

        const playerQuest = playerQuests[questId];
        let questHtml = '';

        if (!playerQuest) {
            // --- Scenario 1: Quest is Available ---
            questHtml = `
                <div class="quest-item">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-description">${quest.description} (Reward: ${quest.reward.xp} XP, ${quest.reward.coins} Gold)</div>
                    <div class="quest-actions">
                        <button data-quest-id="${questId}" data-action="accept">Accept</button>
                    </div>
                </div>`;
        } else if (playerQuest.status === 'active') {
            // --- Scenario 2: Quest is In-Progress ---
            const progress = `(${playerQuest.kills} / ${quest.needed})`;
            let actionButton = '';

            if (playerQuest.kills >= quest.needed) {
                // --- 2a: Ready to Turn In ---
                actionButton = `<button data-quest-id="${questId}" data-action="turnin">Turn In</button>`;
            } else {
                // --- 2b: Still in progress ---
                actionButton = `<button disabled>In Progress</button>`;
            }

            questHtml = `
                <div class="quest-item">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-progress">Progress: ${progress}</div>
                    <div class="quest-actions">${actionButton}</div>
                </div>`;
        } else if (playerQuest.status === 'completed') {
            // --- Scenario 3: Quest is Done ---
            questHtml = `
                <div class="quest-item">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-description">You have already completed this bounty.</div>
                    <div class="quest-actions"><button disabled>Completed</button></div>
                </div>`;
        }
        questList.innerHTML += questHtml;
    }
}

function acceptQuest(questId) {
    const quest = QUEST_DATA[questId];
    if (!quest) return;

    logMessage(`New Quest Accepted: ${quest.title}`);
    gameState.player.quests[questId] = {
        status: 'active',
        kills: 0
    };

    renderBountyBoard(); // Re-render the modal
}

function turnInQuest(questId) {
    const quest = QUEST_DATA[questId];
    const playerQuest = gameState.player.quests[questId];

    // --- MODIFY THIS BLOCK ---
    if (!quest || !playerQuest) { // <-- Simplified check
        logMessage("Quest is not active.");
        return;
    }

    let hasRequirements = true; // Assume true
    let itemIndex = -1; // To store the item's location

    if (quest.type === 'fetch') {
        // --- Check for item ---
        itemIndex = gameState.player.inventory.findIndex(item => item.name === quest.itemNeeded && !item.isEquipped);
        if (itemIndex === -1) {
            logMessage(`You don't have the ${quest.itemNeeded}!`);
            hasRequirements = false;
        }

    } else if (quest.type === 'collect') {
        // --- Check for a stack of items ---
        itemIndex = gameState.player.inventory.findIndex(item => item.name === quest.itemNeeded);

        if (itemIndex === -1 || gameState.player.inventory[itemIndex].quantity < quest.needed) {
            logMessage(`You don't have enough ${quest.itemNeeded}s! You need ${quest.needed}.`);
            hasRequirements = false;
        }

    } else {
        // --- Check for kills ---
        if (playerQuest.kills < quest.needed) {
            logMessage("Quest is not ready to turn in.");
            hasRequirements = false;
        }
    }

    if (!hasRequirements) {
        return; // Stop if they don't have the item or kills
    }

    // --- Give Rewards ---
    logMessage(`Quest Complete! You gained ${quest.reward.xp} XP and ${quest.reward.coins} Gold!`);
    grantXp(quest.reward.xp);
    gameState.player.coins += quest.reward.coins;

    if (quest.reward.item) {
        const rewardItem = Object.values(ITEM_DATA).find(i => i.name === quest.reward.item);
        if (rewardItem) {
            // Check keys to find the tile char
            const rewardKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === quest.reward.item);
            const qty = quest.reward.itemQty || 1;

            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                gameState.player.inventory.push({
                    templateId: rewardKey,
                    name: rewardItem.name,
                    type: rewardItem.type,
                    quantity: qty,
                    tile: rewardKey || '?',
                    damage: rewardItem.damage || null,
                    defense: rewardItem.defense || null,
                    slot: rewardItem.slot || null,
                    statBonuses: rewardItem.statBonuses || null,
                    effect: rewardItem.effect // Bind effect function
                });
                logMessage(`You received: ${rewardItem.name} (x${qty})`);
            } else {
                logMessage(`Your inventory is full! The ${rewardItem.name} falls to the ground.`);
                
                const dropTile = rewardKey || '🎒'; // Fallback to a bag icon if missing
                
                // Place the item on the map under the player
                if (gameState.mapMode === 'overworld') {
                    chunkManager.setWorldTile(gameState.player.x, gameState.player.y, dropTile);
                } else if (gameState.mapMode === 'dungeon') {
                    chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] = dropTile;
                } else if (gameState.mapMode === 'castle') {
                    chunkManager.castleMaps[gameState.currentCastleId][gameState.player.y][gameState.player.x] = dropTile;
                }
                
                // Clear the "looted" memory for this exact coordinate so it can be picked up!
                let tileId = (gameState.mapMode === 'overworld') 
                    ? `${gameState.player.x},${-gameState.player.y}`
                    : `${gameState.currentCaveId || gameState.currentCastleId}:${gameState.player.x},${-gameState.player.y}`;
                gameState.lootedTiles.delete(tileId);
                
                gameState.mapDirty = true;
                render(); // Force redraw so they see the item instantly
            }
        }
    }

    // --- Mark as Completed ---
    playerQuest.status = 'completed';

    if (quest.type === 'fetch' && itemIndex > -1) {
    
        gameState.player.inventory.splice(itemIndex, 1);

    } else if (quest.type === 'collect' && itemIndex > -1) {
        // --- Remove the required quantity from the stack ---
        const itemStack = gameState.player.inventory[itemIndex];
        itemStack.quantity -= quest.needed;

        // If the stack is now empty, remove the item
        if (itemStack.quantity <= 0) {
            gameState.player.inventory.splice(itemIndex, 1);
        }
    }

    // --- Update database (must include inventory!) ---

    playerRef.update({
        quests: gameState.player.quests,
        coins: gameState.player.coins,
        inventory: getSanitizedInventory()
    });

    renderBountyBoard(); // Re-render the modal
    renderStats(); // Update coins display
    renderInventory();
}


// --- COLLECTIONS (BESTIARY & LIBRARY) ---

function openCollections() {
    inputQueue = [];
    renderBestiary();
    renderLibrary();
    collectionsModal.classList.remove('hidden');
}

function renderBestiary() {
    bestiaryView.innerHTML = '';
    const kills = gameState.player.killCounts || {};
    const sortedEnemies = Object.keys(ENEMY_DATA).sort((a, b) => ENEMY_DATA[a].name.localeCompare(ENEMY_DATA[b].name));

    sortedEnemies.forEach(key => {
        const data = ENEMY_DATA[key];
        const count = kills[data.name] || 0;

        // Unlock Levels
        const unlockedName = count > 0;
        const unlockedStats = count >= 5;
        const unlockedLore = count >= 10;

        if (!unlockedName) {
            // Show ??? entry
            const div = document.createElement('div');
            div.className = 'bestiary-entry opacity-50';
            div.innerHTML = `<div class="bestiary-icon">?</div><div>Unknown Creature</div>`;
            bestiaryView.appendChild(div);
            return;
        }

        let statsHtml = `<span class="text-xs">Kills: ${count}</span>`;
        if (unlockedStats) {
            statsHtml += `<br><span class="text-green-600">HP: ${data.maxHealth}</span> | <span class="text-red-500">Atk: ${data.attack}</span> | <span class="text-blue-500">Def: ${data.defense}</span>`;
        } else {
            statsHtml += `<br><span class="text-xs italic text-gray-400">Kill 5 to reveal stats</span>`;
        }

        let loreHtml = '';
        if (unlockedLore && data.flavor) {
            loreHtml = `<div class="text-xs mt-1 italic text-gray-600">"${data.flavor}"</div>`;
        } else if (!unlockedLore) {
            loreHtml = `<div class="text-xs mt-1 text-gray-300">Kill 10 to reveal lore</div>`;
        }

        const div = document.createElement('div');
        div.className = 'bestiary-entry';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bestiary-icon">${key}</div>
                <div class="bestiary-info">
                    <h4>${data.name}</h4>
                    ${statsHtml}
                    ${loreHtml}
                </div>
            </div>
        `;
        bestiaryView.appendChild(div);
    });
}



function renderLibrary() {
    libraryView.innerHTML = '';
    const player = gameState.player;
    // Ensure the set exists from previous step
    const foundEntries = new Set(player.foundCodexEntries || []);

    // 1. Loop through defined Sets
    for (const setKey in LORE_SETS) {
        const set = LORE_SETS[setKey];
        const isComplete = player.completedLoreSets && player.completedLoreSets.includes(setKey);
        
        // Count progress
        const foundCount = set.items.filter(id => foundEntries.has(id)).length;
        const totalCount = set.items.length;

        // Render Set Container
        const setDiv = document.createElement('div');
        setDiv.className = `panel p-3 mb-2 rounded border-2 ${isComplete ? 'border-yellow-500 bg-yellow-900 bg-opacity-10' : 'border-gray-600'}`;
        
        let headerHtml = `
            <div class="flex justify-between items-center cursor-pointer" onclick="toggleSetDetails('${setKey}')">
                <h3 class="font-bold ${isComplete ? 'text-yellow-500' : ''}">${set.name}</h3>
                <span class="text-xs">${foundCount}/${totalCount}</span>
            </div>
            <div class="text-xs text-gray-400 italic">${set.description}</div>
            <div class="text-xs text-green-400 mt-1">${isComplete ? 'Bonus Active: ' + set.bonus : ''}</div>
        `;

        // Render Entries inside the set (Hidden by default or separate logic)
        let entriesHtml = '<div class="mt-2 space-y-1 pl-2 border-l-2 border-gray-700 hidden" id="set-content-' + setKey + '">';
        
        set.items.forEach(itemId => {
            const itemData = ITEM_DATA[itemId];
            const hasFound = foundEntries.has(itemId);
            
            if (hasFound) {
                entriesHtml += `
                    <div class="text-sm p-1 hover:bg-gray-700 cursor-pointer rounded" 
                         onclick="openSpecificLore('${itemId}')">
                        📄 ${itemData.title || itemData.name}
                    </div>`;
            } else {
                entriesHtml += `
                    <div class="text-sm p-1 text-gray-600">
                        🔒 Undiscovered Entry
                    </div>`;
            }
        });
        entriesHtml += '</div>';

        setDiv.innerHTML = headerHtml + entriesHtml;
        libraryView.appendChild(setDiv);
    }
}

// Global helpers for HTML onclicks
window.toggleSetDetails = function(setKey) {
    const el = document.getElementById('set-content-' + setKey);
    if (el) el.classList.toggle('hidden');
};

window.openSpecificLore = function(itemId) {
    const data = ITEM_DATA[itemId];
    loreTitle.textContent = data.title;
    loreContent.textContent = data.content;
    loreModal.classList.remove('hidden');
};

/**
 * Opens the Skill Trainer modal.
 */
function openSkillTrainerModal() {
    renderSkillTrainerModal(); // Populate the list
    skillTrainerModal.classList.remove('hidden');
}

/**
 * Renders the skill trainer modal.
 * Lists all skills from SKILL_DATA and shows their learn/level-up status.
 */

function renderSkillTrainerModal() {
    skillTrainerList.innerHTML = ''; // Clear the old list
    const player = gameState.player;
    skillTrainerStatPoints.textContent = `Your Stat Points: ${player.statPoints}`;
    const canAfford = player.statPoints > 0;

    for (const skillId in SKILL_DATA) {
        const skillData = SKILL_DATA[skillId];
        const currentLevel = player.skillbook[skillId] || 0; // 0 if not learned

        let buttonHtml = '';
        let levelText = '';

        if (currentLevel === 0) {
            // Player does not know this skill
            levelText = '<span class="skill-trainer-level text-red-500">Not Learned</span>';
            if (player.level >= skillData.requiredLevel) {
                // Player meets level requirement, show "Learn" button
                buttonHtml = `<button data-skill-id="${skillId}" ${canAfford ? '' : 'disabled'}>Learn (1 SP)</button>`;
            } else {
                // Player does not meet level requirement
                buttonHtml = `<button disabled>Requires Lvl ${skillData.requiredLevel}</button>`;
            }
        } else {
            // Player knows this skill
            levelText = `<span class="skill-trainer-level">Level: ${currentLevel}</span>`;
            // TODO: Add a max level check here later if we want one
            buttonHtml = `<button data-skill-id="${skillId}" ${canAfford ? '' : 'disabled'}>Level Up (1 SP)</button>`;
        }

        // Build the full list item
        const li = document.createElement('li');
        li.className = 'skill-trainer-item';
        li.innerHTML = `
            <div>
                <span class="skill-trainer-name">${skillData.name}</span>
                <span class="skill-trainer-desc">${skillData.description}</span>
            </div>
            <div class="text-right">
                ${levelText}
                <div class="skill-trainer-actions mt-1">
                    ${buttonHtml}
                </div>
            </div>
        `;
        skillTrainerList.appendChild(li);
    }
}

/**
 * Handles the logic of spending a stat point to learn or level up a skill.
 * @param {string} skillId - The ID of the skill to learn (e.g., "brace").
 */

function handleLearnSkill(skillId) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId];

    // --- Final Security Checks ---
    if (player.statPoints <= 0) {
        logMessage("You don't have any Stat Points to spend.");
        return;
    }
    if (!skillData) {
        logMessage("That skill doesn't exist.");
        return;
    }

    const currentLevel = player.skillbook[skillId] || 0;
    if (currentLevel === 0 && player.level < skillData.requiredLevel) {
        logMessage("You are not high enough level to learn that.");
        return;
    }
    // --- End Checks ---

    // Spend the point
    player.statPoints--;

    if (currentLevel === 0) {
        // --- Learn the skill ---
        player.skillbook[skillId] = 1;
        logMessage(`You have learned ${skillData.name} (Level 1)!`);
    } else {
        // --- Level up the skill ---
        player.skillbook[skillId]++;
        logMessage(`${skillData.name} is now Level ${player.skillbook[skillId]}!`);
    }

    // Update database
    playerRef.update({
        statPoints: player.statPoints,
        skillbook: player.skillbook
    });

    // Update UI
    renderStats(); // Update the main UI stat point display
    renderSkillTrainerModal(); // Re-render the modal to show new state
}

// --- SPELLBOOK & SKILLBOOK UI ---


/**
 * Opens the spellbook modal.
 * Dynamically renders the list of spells the player knows
 * based on their spellbook and the SPELL_DATA.
 */

function openSpellbook() {
    inputQueue = [];
    spellList.innerHTML = ''; // Clear the list
    const player = gameState.player;
    const playerSpells = player.spellbook || {};

    // Check if the spellbook is empty
    if (Object.keys(playerSpells).length === 0) {
        spellList.innerHTML = '<li class="spell-item-details italic p-4">Your spellbook is empty.</li>';
        spellModal.classList.remove('hidden');
        return;
    }

    // Loop through every spell the player knows
    for (const spellId in playerSpells) {
        const spellLevel = playerSpells[spellId];
        const spellData = SPELL_DATA[spellId]; // Get data from our new constant

        if (!spellData) {
            console.warn(`Player has unknown spell in spellbook: ${spellId}`);
            continue;
        }

        let canCast = false;
        let costString = `${spellData.cost} ${spellData.costType}`;
        let costColorClass = ""; // CSS class for cost, e.g., text-red-500

        // Check if the player has enough resources to cast
        if (spellData.costType === 'mana') {
            canCast = player.mana >= spellData.cost;
            if (!canCast) costColorClass = "text-red-500";
        } else if (spellData.costType === 'psyche') {
            canCast = player.psyche >= spellData.cost;
            if (!canCast) costColorClass = "text-red-500";
        }

        // Build the new list item element
        const li = document.createElement('li');
        li.className = 'spell-item';
        li.dataset.spell = spellId; // Use the spell's ID (e.g., "lesserHeal")

        // Make the item look disabled if it can't be cast
        if (!canCast) {
            li.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Set the dynamic HTML for the spell
        li.innerHTML = `
            <div>
                <span class="spell-item-name">${spellData.name} (Lvl ${spellLevel})</span>
                <span class="spell-item-details">${spellData.description}</span>
            </div>
            <div class="flex flex-col items-end">
                <span class="font-bold ${costColorClass}">${costString}</span>
                <button class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded mt-1" 
                    onclick="assignToHotbar('${spellId}'); event.stopPropagation();">
                    Assign
                </button>
            </div>
        `;

        spellList.appendChild(li);
    }

    spellModal.classList.remove('hidden'); // Show the modal
}

/**
 * Opens the skillbook modal.
 * Dynamically renders the list of skills the player knows
 * based on their skillbook and the SKILL_DATA.
 */

function openSkillbook() {
    inputQueue = [];
    skillList.innerHTML = ''; // Clear the list
    const player = gameState.player;
    const playerSkills = player.skillbook || {};

    // Check if the skillbook is empty
    if (Object.keys(playerSkills).length === 0) {
        skillList.innerHTML = '<li class="spell-item-details italic p-4">You have not learned any skills.</li>';
        skillModal.classList.remove('hidden');
        return;
    }

    // Loop through every skill the player knows
    for (const skillId in playerSkills) {
        const skillLevel = playerSkills[skillId];
        const skillData = SKILL_DATA[skillId]; // Get data from our new constant

        if (!skillData) {
            console.warn(`Player has unknown skill in skillbook: ${skillId}`);
            continue;
        }

        let canUse = false;
        let costString = `${skillData.cost} ${skillData.costType}`;
        let costColorClass = ""; // CSS class for cost, e.g., text-red-500

        // Check if the player has enough resources to use
        if (skillData.costType === 'stamina') {
            canUse = player.stamina >= skillData.cost;
            if (!canUse) costColorClass = "text-red-500";
        }
        // (We can add other cost types here later, like 'health')

        // Build the new list item element
        const li = document.createElement('li');
        li.className = 'skill-item'; // Use 'skill-item'
        li.dataset.skill = skillId; // Use the skill's ID (e.g., "brace")

        // Make the item look disabled if it can't be used
        if (!canUse) {
            li.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Set the dynamic HTML for the skill
        li.innerHTML = `
            <div>
                <span class="skill-item-name">${skillData.name} (Lvl ${skillLevel})</span>
                <span class="spell-item-details">${skillData.description}</span>
            </div>
            <div class="flex flex-col items-end">
                <span class="font-bold ${costColorClass}">${costString}</span>
                <button class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded mt-1" 
                    onclick="assignToHotbar('${skillId}'); event.stopPropagation();">
                    Assign
                </button>
            </div>
        `;

        skillList.appendChild(li);
    }

    skillModal.classList.remove('hidden'); // Show the modal
}
