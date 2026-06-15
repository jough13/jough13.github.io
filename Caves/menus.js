// --- START OF FILE menus.js ---

function openTalentModal() {
    if (window.inputQueue) window.inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    renderTalentTree();
    talentModal.classList.remove('hidden');
}

function renderTalentTree() {
    talentListDiv.innerHTML = '';
    const player = gameState.player;
    const playerTalents = player.talents || [];

    talentPointsDisplay.textContent = `Mastery Points: ${player.talentPoints || 0}`;

    // PERFORMANCE: Use DocumentFragment
    const fragment = document.createDocumentFragment();

    for (const key in TALENT_DATA) {
        const talent = TALENT_DATA[key];
        
        // Hide evolution-specific talents from the main list unless the player already owns them
        if (talent.class !== 'general' && talent.class !== 'warrior' && talent.class !== 'mage' && talent.class !== 'rogue' && talent.class !== 'necromancer') {
            if (!playerTalents.includes(key)) continue;
        }

        const isLearned = playerTalents.includes(key);
        const canAfford = (player.talentPoints > 0);

        const div = document.createElement('div');
        div.className = `panel p-3 rounded-lg border-2 transition-colors duration-200 ${isLearned ? 'border-green-500 bg-green-900 bg-opacity-20' : 'border-gray-600 hover:border-gray-500'}`;

        let btnHtml = '';
        if (isLearned) {
            btnHtml = `<span class="text-green-500 font-bold text-sm tracking-wide uppercase">Learned</span>`;
        } else if (canAfford) {
            // PERFORMANCE & JUICE WIN: Hardware accelerated buttons!
            btnHtml = `<button onclick="learnTalent('${key}')" style="transform: translate3d(0,0,0);" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold shadow-md transition-transform active:scale-95">Learn</button>`;
        } else {
            btnHtml = `<span class="text-gray-500 text-sm tracking-wide uppercase font-bold">Locked</span>`;
        }

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="text-3xl" style="filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));">${talent.icon}</div>
                    <div>
                        <div class="font-bold text-lg">${talent.name} <span class="text-[10px] text-gray-400 uppercase tracking-widest ml-2 bg-black bg-opacity-30 px-1 rounded">${talent.class}</span></div>
                        <div class="text-xs text-gray-300 mt-1">${talent.description}</div>
                    </div>
                </div>
                <div>${btnHtml}</div>
            </div>
        `;
        fragment.appendChild(div);
    }
    talentListDiv.appendChild(fragment);
}


// Global scope for HTML onclick
window.learnTalent = function (talentId) {
    const player = gameState.player;
    if (!player.talentPoints || player.talentPoints <= 0) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    if (player.talents && player.talents.includes(talentId)) return;

    if (!player.talents) player.talents = [];
    player.talents.push(talentId);
    player.talentPoints--;

    logMessage(`{purple:You mastered the ${TALENT_DATA[talentId].name} talent!}`);
    triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
    
    // JUICE WIN: Powerful tactile feedback when learning a mastery skill!
    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#a855f7', 20);
        ParticleSystem.createFloatingText(player.x, player.y, "TALENT LEARNED", "#a855f7");
    }

    if (typeof playerRef !== 'undefined') {
        playerRef.update({
            talents: player.talents,
            talentPoints: player.talentPoints
        });
    }

    renderTalentTree();
};

function openEvolutionModal() {
    if (window.inputQueue) window.inputQueue.length = 0;
    
    // 1. Get player's base class (e.g., 'warrior')
    const baseClass = gameState.player.background;
    const options = EVOLUTION_DATA[baseClass];

    if (!options) return; // Should not happen if data is correct

    evolutionOptionsDiv.innerHTML = '';
    const fragment = document.createDocumentFragment();

    options.forEach(evo => {
        // UX WIN: Pull the exact mechanics of the new talent so the player knows what it does!
        const linkedTalent = TALENT_DATA[evo.talent];
        const mechanicDesc = linkedTalent ? linkedTalent.description : evo.description;

        const div = document.createElement('div');
        div.className = "panel p-5 rounded-xl border-2 border-gray-600 hover:border-yellow-500 cursor-pointer transition-all transform hover:-translate-y-1 shadow-lg";
        div.style.transform = "translate3d(0,0,0)";
        div.onclick = () => selectEvolution(evo);
        div.innerHTML = `
            <div class="text-5xl mb-3" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.5));">${evo.icon}</div>
            <h3 class="text-2xl font-bold text-yellow-500 mb-1" style="font-family: 'Uncial Antiqua', cursive;">${evo.name}</h3>
            <p class="text-xs text-gray-400 mb-2 h-8 italic">${evo.description}</p>
            <div class="text-sm text-blue-300 mb-4 h-10 font-bold border-l-2 border-blue-500 pl-2 py-1 bg-black bg-opacity-30">
                ${mechanicDesc}
            </div>
            <div class="text-xs font-bold text-green-400 bg-black bg-opacity-30 p-2 rounded border border-gray-700">
                ${Object.entries(evo.stats).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.substring(0,3).toUpperCase()}`).join(', ')}
            </div>
        `;
        fragment.appendChild(div);
    });

    evolutionOptionsDiv.appendChild(fragment);
    evolutionModal.classList.remove('hidden');
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
}

function selectEvolution(evoData) {
    // QoL WIN: Safety prompt to prevent accidental permanent choices
    if (!confirm(`Are you sure you want to evolve into a ${evoData.name}? This choice is permanent and cannot be undone.`)) {
        return;
    }

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
    if (typeof recalculateDerivedStats === 'function') {
        recalculateDerivedStats();
    } else {
        if (evoData.stats.constitution) player.maxHealth += (evoData.stats.constitution * 5);
        if (evoData.stats.wits) player.maxMana += (evoData.stats.wits * 5);
        if (evoData.stats.maxMana) player.maxMana += evoData.stats.maxMana; 
    }

    // 5. Full Heal on Evolve
    player.health = player.maxHealth;
    player.mana = player.maxMana;

    // 6. Save & Close
    logMessage(`{yellow:You have evolved into a ${evoData.name}!}`);
    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
    
    if (typeof playerRef !== 'undefined') {
        playerRef.update({
            ...player, 
            classEvolved: true
        });
    }

    evolutionModal.classList.add('hidden');
    renderStats();
    if (typeof render === 'function') render(); 
}

function openBountyBoard() {
    if (window.inputQueue) window.inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    renderBountyBoard();
    questModal.classList.remove('hidden');
}

// Renders the content of the bounty board
function renderBountyBoard() {
    questList.innerHTML = '';
    const playerQuests = gameState.player.quests || {};
    const fragment = document.createDocumentFragment();

    // QoL WIN: Smart Quest Sorting
    const sortedQuests = Object.keys(QUEST_DATA).map(questId => {
        const quest = QUEST_DATA[questId];
        const playerQuest = playerQuests[questId];
        let sortOrder = 3; // Available (Default)
        
        if (playerQuest) {
            if (playerQuest.status === 'completed') sortOrder = 4; // Bottom
            else if (playerQuest.status === 'active') {
                if (playerQuest.kills >= quest.needed) sortOrder = 1; // Top (Ready to turn in)
                else sortOrder = 2; // In Progress
            }
        }
        return { questId, quest, playerQuest, sortOrder };
    }).filter(q => q.quest.type !== 'fetch' && q.quest.type !== 'collect')
      .sort((a, b) => a.sortOrder - b.sortOrder); // Execute sort

    sortedQuests.forEach(data => {
        const { questId, quest, playerQuest } = data;
        const div = document.createElement('div');
        div.className = 'quest-item p-4 mb-3 border-2 border-gray-700 rounded-lg bg-gray-800 bg-opacity-50 transition-colors';

        if (!playerQuest) {
            // --- Scenario 1: Quest is Available ---
            let itemRewardStr = quest.reward.item ? `<span class="text-purple-400"> | + ${quest.reward.item}</span>` : '';
            
            div.innerHTML = `
                <div class="flex-grow pr-4">
                    <div class="text-lg font-bold text-yellow-500 mb-1">${quest.title}</div>
                    <div class="text-xs text-gray-300 mb-2">${quest.description}</div>
                    <div class="text-[10px] font-bold text-green-400 uppercase tracking-widest">Reward: ${quest.reward.xp} XP | ${quest.reward.coins} Gold ${itemRewardStr}</div>
                </div>
                <div class="flex-none">
                    <button data-quest-id="${questId}" data-action="accept" style="transform: translate3d(0,0,0);" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold shadow transition-transform active:scale-95">Accept</button>
                </div>`;
        } else if (playerQuest.status === 'active') {
            // --- Scenario 2: Quest is In-Progress ---
            const progress = `(${playerQuest.kills || 0} / ${quest.needed})`;
            let actionButton = '';

            if (playerQuest.kills >= quest.needed) {
                // --- 2a: Ready to Turn In ---
                div.classList.add('border-green-500', 'bg-green-900', 'bg-opacity-20');
                actionButton = `<button data-quest-id="${questId}" data-action="turnin" style="transform: translate3d(0,0,0);" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold shadow transition-transform active:scale-95 animate-pulse">Turn In</button>`;
            } else {
                // --- 2b: Still in progress ---
                actionButton = `<button disabled class="bg-gray-700 text-gray-400 px-4 py-2 rounded text-sm font-bold opacity-50 cursor-not-allowed">In Progress</button>`;
            }

            div.innerHTML = `
                <div class="flex-grow pr-4">
                    <div class="text-lg font-bold text-yellow-500 mb-1">${quest.title}</div>
                    <div class="text-sm font-bold text-gray-300">Progress: <span class="${playerQuest.kills >= quest.needed ? 'text-green-400' : 'text-blue-400'}">${progress}</span></div>
                </div>
                <div class="flex-none">${actionButton}</div>`;
        } else if (playerQuest.status === 'completed') {
            // --- Scenario 3: Quest is Done ---
            div.classList.add('opacity-50');
            div.innerHTML = `
                <div class="flex-grow pr-4">
                    <div class="text-lg font-bold text-gray-500 mb-1 line-through">${quest.title}</div>
                    <div class="text-xs text-gray-500">Bounty collected.</div>
                </div>
                <div class="flex-none">
                    <button disabled class="bg-gray-800 text-gray-600 px-4 py-2 rounded text-sm font-bold border border-gray-700 cursor-not-allowed">Completed</button>
                </div>`;
        }
        fragment.appendChild(div);
    });
    
    questList.appendChild(fragment);
}

function acceptQuest(questId) {
    const quest = QUEST_DATA[questId];
    if (!quest) return;

    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    logMessage(`{yellow:New Quest Accepted: ${quest.title}}`);
    
    if (!gameState.player.quests) gameState.player.quests = {};
    
    gameState.player.quests[questId] = {
        status: 'active',
        kills: 0
    };
    
    if (typeof playerRef !== 'undefined') {
        playerRef.update({ quests: gameState.player.quests });
    }

    renderBountyBoard(); 
}

function turnInQuest(questId) {
    const quest = QUEST_DATA[questId];
    const playerQuest = gameState.player.quests[questId];
    const player = gameState.player;

    if (!quest || !playerQuest || playerQuest.status !== 'active') { 
        logMessage("{gray:Quest is not active.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    let hasRequirements = true; 
    let itemIndex = -1; 

    if (quest.type === 'fetch') {
        itemIndex = player.inventory.findIndex(item => item.name === quest.itemNeeded && !item.isEquipped);
        if (itemIndex === -1) {
            logMessage(`{red:You don't have the ${quest.itemNeeded}!}`);
            hasRequirements = false;
        }
    } else if (quest.type === 'collect') {
        itemIndex = player.inventory.findIndex(item => item.name === quest.itemNeeded);
        if (itemIndex === -1 || player.inventory[itemIndex].quantity < quest.needed) {
            logMessage(`{red:You don't have enough ${quest.itemNeeded}s! You need ${quest.needed}.}`);
            hasRequirements = false;
        }
    } else {
        // Checking kills
        if ((playerQuest.kills || 0) < quest.needed) {
            logMessage("{gray:Quest is not ready to turn in.}");
            hasRequirements = false;
        }
    }

    if (!hasRequirements) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return; 
    }

    // --- Give Rewards ---
    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
    logMessage(`{green:Quest Complete! You gained ${quest.reward.xp} XP and ${quest.reward.coins} Gold!}`);
    
    if (typeof grantXp === 'function') grantXp(quest.reward.xp);
    player.coins += quest.reward.coins;

    // EXPANDABILITY WIN: Track completed bounties in lifetime metrics!
    if (!player.metrics) player.metrics = {};
    player.metrics.questsCompleted = (player.metrics.questsCompleted || 0) + 1;

    // JUICE WIN: Floating Particles for Reward
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createFloatingText(player.x, player.y, `+${quest.reward.coins}g`, "#facc15");
    }

    if (quest.reward.item) {
        const rewardItemTemplate = Object.values(ITEM_DATA).find(i => i.name === quest.reward.item);
        if (rewardItemTemplate) {
            const rewardKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === quest.reward.item);
            const qty = quest.reward.itemQty || 1;

            if (player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                player.inventory.push({
                    templateId: rewardKey,
                    name: rewardItemTemplate.name,
                    type: rewardItemTemplate.type,
                    quantity: qty,
                    tile: rewardKey || '?',
                    damage: rewardItemTemplate.damage || null,
                    defense: rewardItemTemplate.defense || null,
                    slot: rewardItemTemplate.slot || null,
                    statBonuses: rewardItemTemplate.statBonuses || null,
                    effect: rewardItemTemplate.effect 
                });
                logMessage(`{purple:You received: ${rewardItemTemplate.name} (x${qty})}`);
            } else {
                logMessage(`{red:Your inventory is full! The ${rewardItemTemplate.name} falls to the ground.}`);
                const dropTile = rewardKey || '🎒'; 
                
                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                    chunkManager.setWorldTile(player.x, player.y, dropTile);
                } else if (gameState.mapMode === 'dungeon') {
                    chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = dropTile;
                } else if (gameState.mapMode === 'castle') {
                    chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = dropTile;
                }
                
                // Clear the looted memory for this coordinate so it can be picked up
                let tileId = (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') 
                    ? `${player.x},${-player.y}`
                    : `${gameState.currentCaveId || gameState.currentCastleId}:${player.x},${-player.y}`;
                gameState.lootedTiles.delete(tileId);
                
                gameState.mapDirty = true;
                if (typeof render === 'function') render(); 
            }
        }
    }

    // --- Mark as Completed & Cleanup Items ---
    playerQuest.status = 'completed';

    if (quest.type === 'fetch' && itemIndex > -1) {
        player.inventory.splice(itemIndex, 1);
    } else if (quest.type === 'collect' && itemIndex > -1) {
        // ROBUSTNESS: Ensure we only subtract exactly what's needed, preserving the rest of the stack
        const itemStack = player.inventory[itemIndex];
        itemStack.quantity -= quest.needed;
        if (itemStack.quantity <= 0) {
            player.inventory.splice(itemIndex, 1);
        }
    }

    if (typeof playerRef !== 'undefined') {
        playerRef.update({
            quests: player.quests,
            coins: player.coins,
            metrics: player.metrics,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
        });
    }

    renderBountyBoard(); 
    if (typeof renderStats === 'function') renderStats(); 
    if (typeof renderInventory === 'function') renderInventory();
}


// --- COLLECTIONS (BESTIARY & LIBRARY) ---

function openCollections() {
    if (window.inputQueue) window.inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    renderBestiary();
    renderLibrary();
    collectionsModal.classList.remove('hidden');
}

function renderBestiary() {
    bestiaryView.innerHTML = '';
    const kills = gameState.player.killCounts || {};
    
    // Safely sort only items that exist in ENEMY_DATA
    const sortedEnemies = Object.keys(ENEMY_DATA)
        .filter(k => ENEMY_DATA[k] && ENEMY_DATA[k].name)
        .sort((a, b) => ENEMY_DATA[a].name.localeCompare(ENEMY_DATA[b].name));

    const fragment = document.createDocumentFragment();

    sortedEnemies.forEach(key => {
        const data = ENEMY_DATA[key];
        const count = kills[data.name] || 0;

        // Unlock Levels
        const unlockedName = count > 0;
        const unlockedStats = count >= 5;
        const unlockedLore = count >= 10;

        const div = document.createElement('div');

        if (!unlockedName) {
            div.className = 'bestiary-entry opacity-40 p-3 mb-2 border border-gray-700 rounded bg-black bg-opacity-20 flex items-center gap-4';
            div.innerHTML = `<div class="text-3xl w-12 text-center text-gray-600">?</div><div class="font-bold text-gray-500">Unknown Creature</div>`;
            fragment.appendChild(div);
            return;
        }

        // JUICE WIN: Integrated Progress Bars for unlocking Bestiary tiers!
        let statsHtml = `<div class="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Kills: ${count}</div>`;
        
        if (unlockedStats) {
            statsHtml += `<span class="text-green-500 font-bold text-xs mt-1 inline-block drop-shadow-sm">HP: ${data.maxHealth}</span> <span class="text-gray-600 mx-1">|</span> <span class="text-red-500 font-bold text-xs drop-shadow-sm">Atk: ${data.attack}</span> <span class="text-gray-600 mx-1">|</span> <span class="text-blue-400 font-bold text-xs drop-shadow-sm">Def: ${data.defense || 0}</span>`;
        } else {
            const pctStats = Math.min(100, (count / 5) * 100);
            statsHtml += `
                <div class="w-full bg-gray-900 rounded h-1 mb-1 mt-1 border border-gray-700 shadow-inner">
                    <div class="bg-green-500 h-full rounded transition-all duration-500" style="width: ${pctStats}%"></div>
                </div>
                <span class="text-[9px] italic text-gray-500 font-bold tracking-wide">Defeat 5 to reveal stats</span>`;
        }

        let loreHtml = '';
        if (unlockedLore && data.flavor) {
            loreHtml = `<div class="text-xs mt-3 italic text-gray-400 border-l-2 border-gray-600 pl-3 leading-relaxed">"${data.flavor}"</div>`;
        } else if (!unlockedLore) {
            const pctLore = Math.min(100, (count / 10) * 100);
            loreHtml = `
                <div class="w-full bg-gray-900 rounded h-1 mb-1 mt-3 border border-gray-700 shadow-inner">
                    <div class="bg-purple-500 h-full rounded transition-all duration-500" style="width: ${pctLore}%"></div>
                </div>
                <div class="text-[9px] italic text-gray-600 font-bold tracking-wide">Defeat 10 to reveal lore</div>`;
        }

        div.className = 'bestiary-entry p-3 mb-3 border-2 border-gray-700 rounded-lg bg-gray-800 bg-opacity-40 transition-colors hover:border-gray-500 relative overflow-hidden';
        div.innerHTML = `
            <div class="flex items-start gap-4 z-10 relative">
                <div class="text-4xl w-12 text-center" style="text-shadow: 2px 4px 4px rgba(0,0,0,0.6);">${key}</div>
                <div class="flex-grow">
                    <h4 class="font-bold text-lg text-yellow-500 leading-none mb-1 drop-shadow-sm">${data.name}</h4>
                    ${statsHtml}
                    ${loreHtml}
                </div>
            </div>
            ${data.isBoss ? '<div class="absolute top-0 right-0 bg-red-900 bg-opacity-50 text-red-300 text-[9px] px-2 py-1 font-bold uppercase tracking-widest rounded-bl-lg border-b border-l border-red-700">Boss</div>' : ''}
        `;
        fragment.appendChild(div);
    });
    
    bestiaryView.appendChild(fragment);
}

function renderLibrary() {
    libraryView.innerHTML = '';
    const player = gameState.player;
    const foundEntries = new Set(player.foundCodexEntries || []);
    const fragment = document.createDocumentFragment();

    for (const setKey in LORE_SETS) {
        const set = LORE_SETS[setKey];
        const isComplete = player.completedLoreSets && player.completedLoreSets.includes(setKey);
        
        const foundCount = set.items.filter(id => foundEntries.has(id)).length;
        const totalCount = set.items.length;

        const setDiv = document.createElement('div');
        setDiv.className = `panel p-4 mb-3 rounded-lg border-2 transition-colors duration-200 ${isComplete ? 'border-yellow-500 bg-yellow-900 bg-opacity-10' : 'border-gray-600 hover:border-gray-500'}`;
        
        // Progress Bar
        const pct = (foundCount / totalCount) * 100;
        const barColor = isComplete ? 'bg-yellow-400' : 'bg-blue-500';

        let headerHtml = `
            <div class="flex justify-between items-center cursor-pointer mb-1" onclick="toggleSetDetails('${setKey}')">
                <h3 class="font-bold text-lg m-0 p-0 border-none ${isComplete ? 'text-yellow-500' : 'text-gray-200'}">${set.name}</h3>
                <span class="text-xs font-bold bg-black bg-opacity-30 px-2 py-1 rounded shadow-inner">${foundCount} / ${totalCount}</span>
            </div>
            <div class="w-full bg-gray-900 rounded h-1 mb-2 border border-gray-700 shadow-inner">
                <div class="${barColor} h-full rounded transition-all duration-500 shadow-sm" style="width: ${pct}%"></div>
            </div>
            <div class="text-xs text-gray-400 italic mb-2">${set.description}</div>
            ${isComplete ? `<div class="text-[10px] uppercase tracking-widest font-bold text-green-400 mt-2 bg-green-900 bg-opacity-20 p-2 rounded border border-green-800 shadow-sm">Bonus Active: ${set.bonus}</div>` : ''}
        `;

        let entriesHtml = '<div class="mt-3 space-y-1 pl-3 border-l-2 border-gray-600 hidden transition-all" id="set-content-' + setKey + '">';
        
        set.items.forEach(itemId => {
            const itemData = ITEM_DATA[itemId] || { name: 'Unknown Fragment', title: 'Unknown' };
            const hasFound = foundEntries.has(itemId);
            
            if (hasFound) {
                entriesHtml += `
                    <div class="text-sm p-2 hover:bg-gray-700 cursor-pointer rounded transition-colors text-blue-300 font-bold" 
                         onclick="openSpecificLore('${itemId}')">
                        📄 ${itemData.title || itemData.name}
                    </div>`;
            } else {
                entriesHtml += `
                    <div class="text-sm p-2 text-gray-600 italic">
                        🔒 Undiscovered Entry
                    </div>`;
            }
        });
        entriesHtml += '</div>';

        setDiv.innerHTML = headerHtml + entriesHtml;
        fragment.appendChild(setDiv);
    }
    
    libraryView.appendChild(fragment);
}

// Global helpers for HTML onclicks
window.toggleSetDetails = function(setKey) {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    const el = document.getElementById('set-content-' + setKey);
    if (el) el.classList.toggle('hidden');
};

window.openSpecificLore = function(itemId) {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    const data = ITEM_DATA[itemId];
    if (!data) return;
    
    loreTitle.textContent = data.title || data.name;
    loreContent.textContent = data.content || data.description;
    loreModal.classList.remove('hidden');
};

/**
 * Opens the Skill Trainer modal.
 */
function openSkillTrainerModal() {
    if (window.inputQueue) window.inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    renderSkillTrainerModal(); 
    skillTrainerModal.classList.remove('hidden');
}

/**
 * Renders the skill trainer modal using DocumentFragment
 */
function renderSkillTrainerModal() {
    skillTrainerList.innerHTML = ''; 
    const player = gameState.player;
    skillTrainerStatPoints.textContent = `Your Stat Points: ${player.statPoints || 0}`;
    const canAfford = (player.statPoints || 0) > 0;
    const MAX_LEVEL = 10;
    
    const fragment = document.createDocumentFragment();

    for (const skillId in SKILL_DATA) {
        const skillData = SKILL_DATA[skillId];
        const currentLevel = player.skillbook[skillId] || 0; 

        let buttonHtml = '';
        let levelText = '';

        if (currentLevel >= MAX_LEVEL) {
            levelText = `<span class="text-[10px] uppercase font-bold tracking-widest text-yellow-500 bg-yellow-900 bg-opacity-30 px-2 py-1 rounded border border-yellow-700">MAXED</span>`;
            buttonHtml = `<button class="bg-gray-800 text-gray-500 px-3 py-2 rounded text-xs font-bold border border-gray-700 cursor-not-allowed" disabled>Max Level</button>`;
        }
        else if (currentLevel === 0) {
            levelText = '<span class="text-[10px] uppercase font-bold tracking-widest text-red-500">Not Learned</span>';
            if (player.level >= skillData.requiredLevel) {
                buttonHtml = `<button style="transform: translate3d(0,0,0);" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50" data-skill-id="${skillId}" ${canAfford ? '' : 'disabled'}>Learn (1 SP)</button>`;
            } else {
                buttonHtml = `<button class="bg-gray-700 text-gray-400 px-3 py-2 rounded text-xs font-bold opacity-50 cursor-not-allowed" disabled>Requires Lvl ${skillData.requiredLevel}</button>`;
            }
        } else {
            levelText = `<span class="text-[10px] uppercase font-bold tracking-widest text-blue-400">Level: ${currentLevel} / ${MAX_LEVEL}</span>`;
            buttonHtml = `<button style="transform: translate3d(0,0,0);" class="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-xs font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50" data-skill-id="${skillId}" ${canAfford ? '' : 'disabled'}>Upgrade (1 SP)</button>`;
        }

        const li = document.createElement('li');
        li.className = `panel p-3 mb-2 rounded-lg border-2 ${currentLevel >= MAX_LEVEL ? 'border-yellow-600 bg-yellow-900 bg-opacity-10' : 'border-gray-600 hover:border-gray-500'} transition-colors flex justify-between items-center`;
        li.innerHTML = `
            <div class="flex-grow pr-4">
                <div class="font-bold text-lg text-yellow-500 mb-1 drop-shadow-sm">${skillData.name}</div>
                <div class="text-xs text-gray-300 leading-tight">${skillData.description}</div>
            </div>
            <div class="flex-none flex flex-col items-end gap-2">
                ${levelText}
                ${buttonHtml}
            </div>
        `;
        fragment.appendChild(li);
    }
    
    skillTrainerList.appendChild(fragment);
}

/**
 * Handles the logic of spending a stat point to learn or level up a skill.
 * @param {string} skillId - The ID of the skill to learn.
 */
function handleLearnSkill(skillId) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId];

    if ((player.statPoints || 0) <= 0) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    if (!skillData) return;

    const currentLevel = player.skillbook[skillId] || 0;
    if (currentLevel === 0 && player.level < skillData.requiredLevel) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    if (currentLevel >= 10) { // Max level check
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    player.statPoints--;

    if (currentLevel === 0) {
        player.skillbook[skillId] = 1;
        logMessage(`{green:You have learned ${skillData.name} (Level 1)!}`);
    } else {
        player.skillbook[skillId]++;
        logMessage(`{blue:${skillData.name} is now Level ${player.skillbook[skillId]}!}`);
    }

    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 15);
        ParticleSystem.createFloatingText(player.x, player.y, "SKILL UP!", "#60a5fa");
    }

    if (typeof playerRef !== 'undefined') {
        playerRef.update({
            statPoints: player.statPoints,
            skillbook: player.skillbook
        });
    }

    if (typeof renderStats === 'function') renderStats(); 
    renderSkillTrainerModal(); 
}

// --- SPELLBOOK & SKILLBOOK UI ---

function openSpellbook() {
    if (window.inputQueue) window.inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    spellList.innerHTML = ''; 
    const player = gameState.player;
    const playerSpells = player.spellbook || {};
    const fragment = document.createDocumentFragment();

    if (Object.keys(playerSpells).length === 0) {
        spellList.innerHTML = '<li class="italic text-gray-500 p-4 text-center">Your spellbook is empty.</li>';
        spellModal.classList.remove('hidden');
        return;
    }

    // QoL WIN: Smart Sorting for Spells (Affordable -> Too Expensive -> Maxed)
    const MAX_LEVEL = 10;
    const sortedSpells = Object.keys(playerSpells).map(spellId => {
        const spellLevel = playerSpells[spellId];
        const spellData = SPELL_DATA[spellId];
        if (!spellData) return null;

        let displayCost = spellData.cost;
        if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
            displayCost = Math.floor(displayCost * 0.8);
        }

        let canCast = false;
        if (spellData.costType === 'mana') canCast = player.mana >= displayCost;
        else if (spellData.costType === 'psyche') canCast = player.psyche >= spellData.cost;
        else if (spellData.costType === 'health') canCast = player.health > spellData.cost;

        let sortWeight = canCast ? 1 : 2;
        if (spellLevel >= MAX_LEVEL) sortWeight += 5; // Push maxed to bottom or just organize by castability

        return { spellId, spellLevel, spellData, canCast, displayCost, sortWeight };
    }).filter(s => s !== null).sort((a, b) => a.sortWeight - b.sortWeight);

    sortedSpells.forEach(s => {
        const { spellId, spellLevel, spellData, canCast, displayCost } = s;

        let costString = `${displayCost} ${spellData.costType}`;
        let costColorClass = canCast ? (spellData.costType === 'mana' ? "text-blue-400" : (spellData.costType === 'psyche' ? "text-purple-400" : "text-green-500")) : "text-red-500";

        const maxedBadge = spellLevel >= MAX_LEVEL 
            ? `<span class="text-[9px] bg-yellow-900 text-yellow-500 border border-yellow-700 px-1 rounded ml-2">MAXED</span>` 
            : '';

        const li = document.createElement('li');
        li.className = `spell-item p-3 mb-2 rounded-lg border-2 transition-all cursor-pointer ${canCast ? 'border-gray-600 hover:border-blue-500 hover:-translate-y-1 shadow hover:shadow-lg' : 'border-gray-800 opacity-50'}`;
        li.dataset.spell = spellId; 

        li.innerHTML = `
            <div class="flex-grow pr-4">
                <div class="font-bold text-lg mb-1 flex items-center gap-2 drop-shadow-sm">
                    ${spellData.name} 
                    <span class="text-[10px] bg-black bg-opacity-30 px-2 py-0.5 rounded text-gray-300">Lvl ${spellLevel}</span>
                    ${maxedBadge}
                </div>
                <div class="text-xs text-gray-400 leading-tight">${spellData.description}</div>
            </div>
            <div class="flex-none flex flex-col items-end gap-2">
                <span class="text-xs font-bold uppercase tracking-widest ${costColorClass}">${costString}</span>
                <button style="transform: translate3d(0,0,0);" class="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded shadow-md uppercase font-bold transition-transform active:scale-95" 
                    onclick="assignToHotbar('${spellId}'); event.stopPropagation();">
                    Assign
                </button>
            </div>
        `;

        fragment.appendChild(li);
    });

    spellList.appendChild(fragment);
    spellModal.classList.remove('hidden'); 
}

function openSkillbook() {
    if (window.inputQueue) window.inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    skillList.innerHTML = ''; 
    const player = gameState.player;
    const playerSkills = player.skillbook || {};
    const fragment = document.createDocumentFragment();

    if (Object.keys(playerSkills).length === 0) {
        skillList.innerHTML = '<li class="italic text-gray-500 p-4 text-center">You have not learned any skills.</li>';
        skillModal.classList.remove('hidden');
        return;
    }

    // QoL WIN: Smart Sorting for Skills
    const MAX_LEVEL = 10;
    const sortedSkills = Object.keys(playerSkills).map(skillId => {
        const skillLevel = playerSkills[skillId];
        const skillData = SKILL_DATA[skillId];
        if (!skillData) return null;

        let canUse = false;
        if (skillData.costType === 'stamina') canUse = player.stamina >= skillData.cost;
        else if (skillData.costType === 'psyche') canUse = player.psyche >= skillData.cost;
        else if (skillData.costType === 'health') canUse = player.health > skillData.cost;

        let sortWeight = canUse ? 1 : 2;
        return { skillId, skillLevel, skillData, canUse, sortWeight };
    }).filter(s => s !== null).sort((a, b) => a.sortWeight - b.sortWeight);


    sortedSkills.forEach(s => {
        const { skillId, skillLevel, skillData, canUse } = s;

        let costString = `${skillData.cost} ${skillData.costType}`;
        let costColorClass = canUse ? (skillData.costType === 'stamina' ? "text-yellow-500" : (skillData.costType === 'psyche' ? "text-purple-400" : "text-green-500")) : "text-red-500";

        const maxedBadge = skillLevel >= MAX_LEVEL 
            ? `<span class="text-[9px] bg-yellow-900 text-yellow-500 border border-yellow-700 px-1 rounded ml-2">MAXED</span>` 
            : '';

        const li = document.createElement('li');
        li.className = `skill-item p-3 mb-2 rounded-lg border-2 transition-all cursor-pointer ${canUse ? 'border-gray-600 hover:border-yellow-500 hover:-translate-y-1 shadow hover:shadow-lg' : 'border-gray-800 opacity-50'}`;
        li.dataset.skill = skillId; 

        li.innerHTML = `
            <div class="flex-grow pr-4">
                <div class="font-bold text-lg mb-1 flex items-center gap-2 drop-shadow-sm">
                    ${skillData.name} 
                    <span class="text-[10px] bg-black bg-opacity-30 px-2 py-0.5 rounded text-gray-300">Lvl ${skillLevel}</span>
                    ${maxedBadge}
                </div>
                <div class="text-xs text-gray-400 leading-tight">${skillData.description}</div>
            </div>
            <div class="flex-none flex flex-col items-end gap-2">
                <span class="text-xs font-bold uppercase tracking-widest ${costColorClass}">${costString}</span>
                <button style="transform: translate3d(0,0,0);" class="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded shadow-md uppercase font-bold transition-transform active:scale-95" 
                    onclick="assignToHotbar('${skillId}'); event.stopPropagation();">
                    Assign
                </button>
            </div>
        `;

        fragment.appendChild(li);
    });

    skillList.appendChild(fragment);
    skillModal.classList.remove('hidden'); 
}

// --- END OF FILE menus.js ---
