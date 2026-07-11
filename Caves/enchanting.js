// --- START OF FILE enchanting.js ---

// ==========================================
// RUNECRAFTING & ENCHANTING SYSTEM
// ==========================================

const DUST_YIELDS = { 'uncommon': 1, 'rare': 3, 'epic': 8, 'legendary': 25 };
const UPGRADE_COSTS = { 'normal': 5, 'uncommon': 15, 'rare': 30, 'epic': 75 };
const PURIFY_COST = 40; // Flat cost to cleanse cursed items

// PERFORMANCE & BUG FIX WIN: Operation Lock
// Prevents players from double-clicking the upgrade/destroy buttons and corrupting 
// the inventory array or draining their dust into negative numbers!
let isEnchantingBusy = false;

// LORE WIN: The Altar Whispers
// Adds dynamic, randomized atmospheric text to the UI to make the world feel alive.
const ALTAR_WHISPERS = [
    "The obsidian stone feels unnaturally cold.",
    "Faint whispers echo from the cracks in the altar.",
    "The smell of ozone and burnt ozone lingers here.",
    "A faint purple mist clings to the surface of the stone.",
    "It demands a sacrifice of power.",
    "The leylines converge directly beneath this block.",
    "You feel a strange urge to shatter everything you own."
];

function openEnchantingModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
    renderEnchantingModal();
    const modal = document.getElementById('enchantingModal');
    if (modal) modal.classList.remove('hidden');
}

function renderEnchantingModal() {
    const disenchantList = document.getElementById('disenchantList');
    const enchantList = document.getElementById('enchantList');
    const dustDisplay = document.getElementById('enchantingDustDisplay');
    const enchantingTitle = document.getElementById('enchantingTitle');
    if (!disenchantList || !enchantList) return;

    disenchantList.innerHTML = '';
    enchantList.innerHTML = '';

    const player = gameState.player;
    // 🚨 GHOST GUARD
    const dustItem = player.inventory.find(i => i && i.name === 'Arcane Dust');
    const dustAmount = dustItem ? dustItem.quantity : 0;

    // LORE WIN: Dynamic Altar UI Flavor
    if (enchantingTitle) {
        const whisper = ALTAR_WHISPERS[Math.floor(Math.random() * ALTAR_WHISPERS.length)];
        enchantingTitle.innerHTML = `Enchanting Altar <span class="block text-xs font-normal text-gray-400 mt-1 italic tracking-normal font-serif">"${whisper}"</span>`;
    }

    // JUICE WIN: Pulsing color if you have a lot of dust
    const dustColorClass = dustAmount > 50 ? 'text-fuchsia-400 animate-pulse' : 'text-purple-400';
    if (dustDisplay) {
        dustDisplay.innerHTML = `Arcane Dust: <span class="${dustColorClass} drop-shadow-md">${dustAmount}</span>`;
    }

    // PERFORMANCE WIN: DocumentFragments prevent layout thrashing
    const disFrag = document.createDocumentFragment();
    const enchFrag = document.createDocumentFragment();

    player.inventory.forEach((item, index) => {
        if (!item || item.isEquipped) return;

        const isGear = item.type === 'weapon' || item.type === 'armor';
        const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;

        // --- DISENCHANT LIST ---
        if (isGear && item._rarity) {
            const yieldAmt = DUST_YIELDS[item._rarity] || 1;
            
            let rarityColor = 'text-green-400';
            if (item._rarity === 'rare') rarityColor = 'text-purple-400';
            if (item._rarity === 'epic') rarityColor = 'text-red-400';
            if (item._rarity === 'legendary') rarityColor = 'text-yellow-400';

            const li = document.createElement('li');
            li.className = `shop-item bg-gray-900 bg-opacity-40 border border-gray-700 rounded-lg p-3 hover:border-red-500 transition-all duration-150`;
            li.innerHTML = `
                <div>
                    <span class="font-bold text-lg ${rarityColor} drop-shadow-sm">${item.tile || '🎒'} ${safeName}</span>
                    <span class="block text-xs text-gray-400 mt-1 uppercase tracking-widest">Yields: <span class="text-purple-300 font-bold">+${yieldAmt} Dust</span></span>
                </div>
                <button data-disenchant="${index}" style="transform: translateZ(0);" class="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded shadow-sm font-bold text-xs transition-transform active:scale-95 border-b-2 border-red-900 active:border-b-0 active:mt-0.5">Shatter</button>
            `;
            disFrag.appendChild(li);
        }

        // --- ENCHANT & PURIFY LIST ---
        if (isGear) {
            // Check if it's a cursed item!
            const isCursed = item.name.match(/Cursed|Doomed|Forsaken|Blood-Starved|Whispering|Blighted/i);
            
            if (isCursed) {
                // Render PURIFY button
                const canAfford = dustAmount >= PURIFY_COST;
                const btnClass = canAfford ? `bg-cyan-600 hover:bg-cyan-500 border-cyan-900 text-white` : 'bg-gray-700 border-gray-900 opacity-50 cursor-not-allowed text-gray-400';
                
                const li = document.createElement('li');
                li.className = `shop-item bg-gray-900 bg-opacity-40 border border-cyan-900 rounded-lg p-3 hover:border-cyan-400 transition-all duration-150`;
                li.innerHTML = `
                    <div>
                        <span class="font-bold text-lg text-cyan-400 drop-shadow-sm">${item.tile || '🎒'} ${safeName}</span>
                        <span class="block text-xs text-gray-400 mt-1 uppercase tracking-widest">Purify Cost: <span class="${canAfford ? 'text-cyan-300' : 'text-red-400'} font-bold">-${PURIFY_COST} Dust</span></span>
                    </div>
                    <button data-purify="${index}" style="transform: translateZ(0);" class="${btnClass} px-3 py-1.5 rounded shadow-sm font-bold text-xs transition-transform active:scale-95 border-b-2 active:border-b-0 active:mt-0.5 animate-pulse" ${canAfford ? '' : 'disabled'}>Purify</button>
                `;
                enchFrag.appendChild(li);
            } 
            else if (item._rarity !== 'legendary') {
                // Render Standard ENCHANT button
                const currentRarity = item._rarity || 'normal';
                const cost = UPGRADE_COSTS[currentRarity];
                const canAfford = dustAmount >= cost;
                
                let targetColorTheme = 'green';
                if (currentRarity === 'uncommon') targetColorTheme = 'purple';
                if (currentRarity === 'rare') targetColorTheme = 'red';
                if (currentRarity === 'epic') targetColorTheme = 'yellow';
                
                const btnClass = canAfford ? `bg-${targetColorTheme}-600 hover:bg-${targetColorTheme}-500 border-${targetColorTheme}-900 text-white` : 'bg-gray-700 border-gray-900 opacity-50 cursor-not-allowed text-gray-400';
                
                let nameColor = 'text-gray-200';
                if (currentRarity === 'uncommon') nameColor = 'text-green-400';
                if (currentRarity === 'rare') nameColor = 'text-purple-400';
                if (currentRarity === 'epic') nameColor = 'text-red-400';

                const li = document.createElement('li');
                li.className = `shop-item bg-gray-900 bg-opacity-40 border border-gray-700 rounded-lg p-3 hover:border-${targetColorTheme}-500 transition-all duration-150`;
                li.innerHTML = `
                    <div>
                        <span class="font-bold text-lg ${nameColor} drop-shadow-sm">${item.tile || '🎒'} ${safeName}</span>
                        <span class="block text-xs text-gray-400 mt-1 uppercase tracking-widest">Cost: <span class="${canAfford ? 'text-purple-300' : 'text-red-400'} font-bold">-${cost} Dust</span></span>
                    </div>
                    <button data-enchant="${index}" style="transform: translateZ(0);" class="${btnClass} px-3 py-1.5 rounded shadow-sm font-bold text-xs transition-transform active:scale-95 border-b-2 active:border-b-0 active:mt-0.5" ${canAfford ? '' : 'disabled'}>Infuse</button>
                `;
                enchFrag.appendChild(li);
            }
        }
    });

    if (disFrag.childNodes.length === 0) disenchantList.innerHTML = '<li class="italic text-gray-500 text-sm p-4 text-center border border-gray-700 rounded-lg bg-black bg-opacity-20 shadow-inner font-serif">No unequipped magical items to destroy.</li>';
    else disenchantList.appendChild(disFrag);

    if (enchFrag.childNodes.length === 0) enchantList.innerHTML = '<li class="italic text-gray-500 text-sm p-4 text-center border border-gray-700 rounded-lg bg-black bg-opacity-20 shadow-inner font-serif">No unequipped weapons or armor to enchant.</li>';
    else enchantList.appendChild(enchFrag);

    // --- QoL EXPANSION: Inject Batch Shatter Button into Header ---
    const disListContainer = disenchantList.parentElement;
    const disHeader = disListContainer.querySelector('h3');

    if (disHeader) {
        // Check if there are ANY unequipped uncommon/rare items
        const hasMinor = player.inventory.some(i => i && !i.isEquipped && (i.type === 'weapon' || i.type === 'armor') && (i._rarity === 'uncommon' || i._rarity === 'rare'));
        const btnClass = hasMinor ? "bg-red-700 hover:bg-red-600 text-white cursor-pointer shadow-md" : "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed border border-gray-700 shadow-inner";

        disHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span class="text-red-400">Disenchant (Destroy)</span>
                <button id="shatterMinorBtn" style="transform: translateZ(0);" class="text-[10px] uppercase font-bold tracking-widest px-2 py-1.5 rounded transition-transform active:scale-95 border-b-2 ${hasMinor ? 'border-red-900 active:border-b-0 active:mt-0.5' : 'border-gray-800'} ${btnClass}" ${hasMinor ? '' : 'disabled'}>Shatter Minor</button>
            </div>
        `;
    }
}

function handleDisenchant(index) {
    if (isEnchantingBusy) return;
    isEnchantingBusy = true;

    try {
        const player = gameState.player;
        const item = player.inventory[index];
        
        if (!item || item.isEquipped || !item._rarity) {
            logMessage("{red:You cannot shatter an equipped or invalid item!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const yieldAmt = DUST_YIELDS[item._rarity] || 1;
        const oldName = item.name;
        const oldRarity = item._rarity;

        player.inventory.splice(index, 1);

        const existingDust = player.inventory.find(i => i && i.name === 'Arcane Dust');
        if (existingDust) {
            existingDust.quantity += yieldAmt;
        } else {
            player.inventory.push({
                templateId: '&', name: 'Arcane Dust', type: 'junk', quantity: yieldAmt, tile: '✨'
            });
        }

        let flavorText = `You shattered the ${oldName} into ${yieldAmt} Arcane Dust.`;
        if (oldRarity === 'rare') flavorText = `The ${oldName} shatters with a sharp crack, releasing ${yieldAmt} Arcane Dust.`;
        else if (oldRarity === 'epic') flavorText = `A miniature shockwave ripples out as the ${oldName} is unmade. (+${yieldAmt} Dust)`;
        else if (oldRarity === 'legendary') {
            flavorText = `The world holds its breath as the legendary relic is crushed into pure Void dust. (+${yieldAmt} Dust)`;
            
            // LORE WIN: Altar Resonance Buff
            logMessage("{purple:The Altar feeds on the legendary artifact. Your mind expands with forbidden knowledge!}");
            window.modifyVital('psyche', gameState.player.maxPsyche); // Full restore
            if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('psycheDisplay'), 'stat-pulse-purple');
        }

        logMessage(`{purple:${flavorText}}`);
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
        if (typeof ParticleSystem !== 'undefined') {
            let explosionColor = '#4ade80'; 
            if (oldRarity === 'rare') explosionColor = '#a855f7';
            if (oldRarity === 'epic') explosionColor = '#ef4444';
            if (oldRarity === 'legendary') explosionColor = '#facc15';
            
            ParticleSystem.createExplosion(player.x, player.y, explosionColor, oldRarity === 'legendary' ? 30 : 15);
            ParticleSystem.createFloatingText(player.x, player.y, `+${yieldAmt} Dust`, "#c084fc");
        }
        
        gameState.screenShake = oldRarity === 'legendary' ? 12 : 5;
        saveEnchantingState();

    } finally {
        isEnchantingBusy = false;
    }
}

// --- NEW FEATURE: Batch Shatter ---
function handleShatterMinor() {
    if (isEnchantingBusy) return;
    isEnchantingBusy = true;

    try {
        const player = gameState.player;
        let totalDust = 0;
        let itemsShattered = 0;

        // O(N) Array filter approach for mass deletion
        const remainingInventory = [];

        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (!item) continue;

            if (!item.isEquipped && (item.type === 'weapon' || item.type === 'armor') && (item._rarity === 'uncommon' || item._rarity === 'rare')) {
                const yieldAmt = DUST_YIELDS[item._rarity] || 1;
                totalDust += yieldAmt;
                itemsShattered++;
            } else {
                remainingInventory.push(item);
            }
        }

        if (itemsShattered > 0) {
            player.inventory = remainingInventory;

            const dustIdx = player.inventory.findIndex(i => i && i.name === 'Arcane Dust');
            if (dustIdx > -1) {
                player.inventory[dustIdx].quantity += totalDust;
            } else {
                player.inventory.push({ templateId: '&', name: 'Arcane Dust', type: 'junk', quantity: totalDust, tile: '✨' });
            }

            logMessage(`{purple:You shattered ${itemsShattered} minor items, extracting ${totalDust} Arcane Dust.}`);
            
            if (typeof AudioSystem !== 'undefined') AudioSystem.playDisenchant();
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(player.x, player.y, '#a855f7', 25);
                ParticleSystem.createFloatingText(player.x, player.y, `+${totalDust} Dust`, "#c084fc");
            }
            gameState.screenShake = 10;
            
            saveEnchantingState();
        } else {
            logMessage("{gray:No unequipped minor magical items found.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
    } finally {
        isEnchantingBusy = false;
    }
}

function handleEnchant(index) {
    if (isEnchantingBusy) return;
    isEnchantingBusy = true;

    try {
        const player = gameState.player;
        const item = player.inventory[index];
        
        if (!item || item.isEquipped || item._rarity === 'legendary') {
            logMessage("{red:You cannot enchant this item!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const currentRarity = item._rarity || 'normal';
        const cost = UPGRADE_COSTS[currentRarity];

        const dustIdx = player.inventory.findIndex(i => i && i.name === 'Arcane Dust');
        if (dustIdx === -1 || player.inventory[dustIdx].quantity < cost) {
            logMessage("{red:You do not have enough Arcane Dust.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        player.inventory[dustIdx].quantity -= cost;
        if (player.inventory[dustIdx].quantity <= 0) player.inventory.splice(dustIdx, 1);

        if (!item.statBonuses) item.statBonuses = {};

        let newRarity = 'uncommon';
        if (currentRarity === 'uncommon') newRarity = 'rare';
        else if (currentRarity === 'rare') newRarity = 'epic';
        else if (currentRarity === 'epic') newRarity = 'legendary';

        item._rarity = newRarity;

        let upgradeMsg = "";

        if (newRarity === 'uncommon') {
            item.name = `Fine ${item.name}`;
            if (item.type === 'weapon') item.damage += 1;
            if (item.type === 'armor') item.defense += 1;
            
            const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
            const randomStat = stats[Math.floor(Math.random() * stats.length)];
            item.statBonuses[randomStat] = (item.statBonuses[randomStat] || 0) + 1;
            
            upgradeMsg = `The altar breathes arcane life into the mundane. You forged a ${item.name}!`;
        } 
        else if (newRarity === 'rare') {
            item.name = item.name.replace(/^Fine /, ''); 
            
            const validPrefixes = Object.keys(typeof LOOT_PREFIXES !== 'undefined' ? LOOT_PREFIXES : {}).filter(p => LOOT_PREFIXES[p].type === item.type);
            if (validPrefixes.length > 0) {
                const prefixName = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
                const prefixData = LOOT_PREFIXES[prefixName];
                
                item.name = `${prefixName} ${item.name}`;
                for (const stat in prefixData.bonus) {
                    if (stat === 'damage') item.damage += prefixData.bonus[stat];
                    else if (stat === 'defense') item.defense += prefixData.bonus[stat];
                    else item.statBonuses[stat] = (item.statBonuses[stat] || 0) + prefixData.bonus[stat];
                }
            } else {
                item.name = `Mystic ${item.name}`;
                if (item.type === 'weapon') item.damage += 1;
                if (item.type === 'armor') item.defense += 1;
                item.statBonuses.wits = (item.statBonuses.wits || 0) + 1;
            }
            upgradeMsg = `Arcane runes brand themselves into the surface. It is now a ${item.name}!`;
        } 
        else if (newRarity === 'epic') {
            const suffixKeys = Object.keys(typeof LOOT_SUFFIXES !== 'undefined' ? LOOT_SUFFIXES : {});
            if (suffixKeys.length > 0) {
                const suffixName = suffixKeys[Math.floor(Math.random() * suffixKeys.length)];
                const suffixData = LOOT_SUFFIXES[suffixName];
                
                item.name = `${item.name} ${suffixName}`;
                for (const stat in suffixData.bonus) {
                    if (stat === 'damage') item.damage += suffixData.bonus[stat];
                    else if (stat === 'defense') item.defense += suffixData.bonus[stat];
                    else item.statBonuses[stat] = (item.statBonuses[stat] || 0) + suffixData.bonus[stat];
                }
            } else {
                item.name = `${item.name} of Power`;
                if (item.type === 'weapon') item.damage += 1;
                if (item.type === 'armor') item.defense += 1;
                item.statBonuses.strength = (item.statBonuses.strength || 0) + 1;
            }
            upgradeMsg = `The item hums with a terrifying new power. It is now ${item.name}!`;
        } 
        else if (newRarity === 'legendary') {
            if (item.type === 'weapon') item.damage += 2;
            if (item.type === 'armor') item.defense += 2;
            for (const stat in item.statBonuses) {
                item.statBonuses[stat] += 1; 
            }
            upgradeMsg = `The heavens tremble! You have forged a weapon of myth: ${item.name}!`;
        }

        logMessage(`{gold:${upgradeMsg}}`);
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createLevelUp(player.x, player.y);
            ParticleSystem.createFloatingText(player.x, player.y, "UPGRADED", "#facc15");
        }
        gameState.screenShake = newRarity === 'legendary' ? 15 : 8;

        saveEnchantingState();

    } finally {
        isEnchantingBusy = false;
    }
}

// --- NEW FEATURE: Purify Curse ---
function handlePurify(index) {
    if (isEnchantingBusy) return;
    isEnchantingBusy = true;

    try {
        const player = gameState.player;
        const item = player.inventory[index];
        
        if (!item || item.isEquipped) {
            logMessage("{red:You cannot purify this item.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const dustIdx = player.inventory.findIndex(i => i && i.name === 'Arcane Dust');
        if (dustIdx === -1 || player.inventory[dustIdx].quantity < PURIFY_COST) {
            logMessage(`{red:You need ${PURIFY_COST} Arcane Dust to purge the darkness from this item.}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // Deduct Dust
        player.inventory[dustIdx].quantity -= PURIFY_COST;
        if (player.inventory[dustIdx].quantity <= 0) player.inventory.splice(dustIdx, 1);

        // Strip ALL negative stats!
        if (item.statBonuses) {
            for (let stat in item.statBonuses) {
                if (item.statBonuses[stat] < 0) {
                    delete item.statBonuses[stat];
                }
            }
        }

        // Strip negative status effects (e.g. Madness)
        if (item.inflicts === 'madness') {
            item.inflicts = null;
            item.inflictChance = 0;
        }

        // Rename the item (Replacing the cursed prefix with 'Purified')
        item.name = item.name.replace(/Cursed|Doomed|Forsaken|Blood-Starved|Whispering|Blighted/gi, 'Purified').trim();
        
        logMessage(`{cyan:The dark magic is scoured away! You hold the ${item.name}.}`);
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(player.x, player.y, '#67e8f9', 25);
            ParticleSystem.createFloatingText(player.x, player.y, "PURIFIED", "#22d3ee");
        }
        gameState.screenShake = 10;

        saveEnchantingState();

    } finally {
        isEnchantingBusy = false;
    }
}

function saveEnchantingState() {
    renderEnchantingModal();
    if (typeof renderInventory === 'function') renderInventory();
    
    // Debounce the save to prevent quota drain
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
    }
}

// Event Delegation
function initEnchantingListeners() {
    const enchantModal = document.getElementById('enchantingModal');
    if (!enchantModal || enchantModal.dataset.listenersBound) return;

    const closeBtn = document.getElementById('closeEnchantingButton');
    if (closeBtn && !closeBtn.dataset.listenerBound) {
        closeBtn.addEventListener('click', () => {
            enchantModal.classList.add('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            if (document.activeElement) document.activeElement.blur(); 
        });
        closeBtn.dataset.listenerBound = 'true';
    }

    // One listener to rule them all
    enchantModal.addEventListener('click', (e) => {
        if (isEnchantingBusy) return;

        // Disenchant
        const disBtn = e.target.closest('button[data-disenchant]');
        if (disBtn) {
            const idx = parseInt(disBtn.dataset.disenchant, 10);
            if (!isNaN(idx)) handleDisenchant(idx);
            return;
        }

        // Enchant
        const enchBtn = e.target.closest('button[data-enchant]');
        if (enchBtn && !enchBtn.disabled) {
            const idx = parseInt(enchBtn.dataset.enchant, 10);
            if (!isNaN(idx)) handleEnchant(idx);
            return;
        }
        
        // Purify
        const purifyBtn = e.target.closest('button[data-purify]');
        if (purifyBtn && !purifyBtn.disabled) {
            const idx = parseInt(purifyBtn.dataset.purify, 10);
            if (!isNaN(idx)) handlePurify(idx);
            return;
        }
        
        // Shatter Minor
        const shatterMinorBtn = e.target.closest('#shatterMinorBtn');
        if (shatterMinorBtn && !shatterMinorBtn.disabled) {
            handleShatterMinor();
            return;
        }
    });
    
    enchantModal.dataset.listenersBound = 'true';
}

// --- END OF FILE enchanting.js ---
