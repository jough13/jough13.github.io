// --- START OF FILE enchanting.js ---

// ==========================================
// RUNECRAFTING & ENCHANTING SYSTEM
// ==========================================

const DUST_YIELDS = { 'uncommon': 1, 'rare': 3, 'epic': 8, 'legendary': 25 };
const UPGRADE_COSTS = { 'normal': 5, 'uncommon': 15, 'rare': 30, 'epic': 75 };

function openEnchantingModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
    renderEnchantingModal();
    document.getElementById('enchantingModal').classList.remove('hidden');
}

function renderEnchantingModal() {
    const disenchantList = document.getElementById('disenchantList');
    const enchantList = document.getElementById('enchantList');
    const dustDisplay = document.getElementById('enchantingDustDisplay');
    if (!disenchantList || !enchantList) return;

    disenchantList.innerHTML = '';
    enchantList.innerHTML = '';

    const player = gameState.player;
    const dustItem = player.inventory.find(i => i.name === 'Arcane Dust');
    const dustAmount = dustItem ? dustItem.quantity : 0;

    dustDisplay.innerHTML = `Arcane Dust: <span class="text-purple-400 drop-shadow-md">${dustAmount}</span>`;

    const disFrag = document.createDocumentFragment();
    const enchFrag = document.createDocumentFragment();

    player.inventory.forEach((item, index) => {
        // Skip equipped items to prevent catastrophic errors
        if (item.isEquipped) return;

        // Is it a weapon or armor?
        const isGear = item.type === 'weapon' || item.type === 'armor';

        // --- DISENCHANT LIST ---
        // Only show magical items that have a rarity tag
        if (isGear && item._rarity) {
            const yieldAmt = DUST_YIELDS[item._rarity] || 1;
            const li = document.createElement('li');
            li.className = 'shop-item bg-gray-900 bg-opacity-40 border border-gray-700 rounded-lg p-3 hover:border-red-500 transition-all duration-150';
            li.innerHTML = `
                <div>
                    <span class="font-bold text-lg text-purple-400">${item.tile || '🎒'} ${item.name}</span>
                    <span class="block text-xs text-gray-400 mt-1 uppercase tracking-widest">Yields: <span class="text-purple-300 font-bold">${yieldAmt} Dust</span></span>
                </div>
                <button data-disenchant="${index}" class="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded shadow-sm font-bold text-xs transition-transform active:scale-95 border-b-2 border-red-900 active:border-b-0 active:mt-0.5">Destroy</button>
            `;
            disFrag.appendChild(li);
        }

        // --- ENCHANT LIST ---
        // Only show gear that hasn't reached Legendary yet
        if (isGear && item._rarity !== 'legendary') {
            const currentRarity = item._rarity || 'normal';
            const cost = UPGRADE_COSTS[currentRarity];
            const canAfford = dustAmount >= cost;
            
            const btnClass = canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed';
            const nameColor = item._rarity ? 'text-purple-400' : 'text-gray-200';

            const li = document.createElement('li');
            li.className = 'shop-item bg-gray-900 bg-opacity-40 border border-gray-700 rounded-lg p-3 hover:border-green-500 transition-all duration-150';
            li.innerHTML = `
                <div>
                    <span class="font-bold text-lg ${nameColor}">${item.tile || '🎒'} ${item.name}</span>
                    <span class="block text-xs text-gray-400 mt-1 uppercase tracking-widest">Cost: <span class="${canAfford ? 'text-purple-300' : 'text-red-400'} font-bold">${cost} Dust</span></span>
                </div>
                <button data-enchant="${index}" class="${btnClass} text-white px-3 py-1.5 rounded shadow-sm font-bold text-xs transition-transform active:scale-95 border-b-2 border-gray-900 active:border-b-0 active:mt-0.5" ${canAfford ? '' : 'disabled'}>Upgrade</button>
            `;
            enchFrag.appendChild(li);
        }
    });

    if (disFrag.childNodes.length === 0) disenchantList.innerHTML = '<li class="italic text-gray-500 text-sm p-4 text-center">No unequipped magical items to destroy.</li>';
    else disenchantList.appendChild(disFrag);

    if (enchFrag.childNodes.length === 0) enchantList.innerHTML = '<li class="italic text-gray-500 text-sm p-4 text-center">No unequipped weapons or armor to enchant.</li>';
    else enchantList.appendChild(enchFrag);
}

function handleDisenchant(index) {
    const player = gameState.player;
    const item = player.inventory[index];
    if (!item || !item._rarity) return;

    const yieldAmt = DUST_YIELDS[item._rarity] || 1;

    // Remove the item
    player.inventory.splice(index, 1);

    // Give Dust
    const existingDust = player.inventory.find(i => i.name === 'Arcane Dust');
    if (existingDust) {
        existingDust.quantity += yieldAmt;
    } else {
        player.inventory.push({
            templateId: '&', name: 'Arcane Dust', type: 'junk', quantity: yieldAmt, tile: '✨'
        });
    }

    logMessage(`{purple:You shattered the ${item.name} into ${yieldAmt} Arcane Dust.}`);
    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#a855f7', 15);
    gameState.screenShake = 5;

    saveEnchantingState();
}

function handleEnchant(index) {
    const player = gameState.player;
    const item = player.inventory[index];
    if (!item) return;

    const currentRarity = item._rarity || 'normal';
    const cost = UPGRADE_COSTS[currentRarity];

    const dustIdx = player.inventory.findIndex(i => i.name === 'Arcane Dust');
    if (dustIdx === -1 || player.inventory[dustIdx].quantity < cost) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // Deduct Dust
    player.inventory[dustIdx].quantity -= cost;
    if (player.inventory[dustIdx].quantity <= 0) player.inventory.splice(dustIdx, 1);

    // --- UPGRADE LOGIC ---
    if (!item.statBonuses) item.statBonuses = {};

    let newRarity = 'uncommon';
    if (currentRarity === 'uncommon') newRarity = 'rare';
    else if (currentRarity === 'rare') newRarity = 'epic';
    else if (currentRarity === 'epic') newRarity = 'legendary';

    item._rarity = newRarity;

    if (newRarity === 'uncommon') {
        item.name = `Fine ${item.name}`;
        if (item.type === 'weapon') item.damage += 1;
        if (item.type === 'armor') item.defense += 1;
        const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        item.statBonuses[randomStat] = (item.statBonuses[randomStat] || 0) + 1;
    } 
    else if (newRarity === 'rare') {
        const validPrefixes = Object.keys(LOOT_PREFIXES).filter(p => LOOT_PREFIXES[p].type === item.type);
        const prefixName = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
        const prefixData = LOOT_PREFIXES[prefixName];
        
        item.name = item.name.replace('Fine ', ''); // Remove previous tier flavor
        item.name = `${prefixName} ${item.name}`;
        
        for (const stat in prefixData.bonus) {
            if (stat === 'damage') item.damage += prefixData.bonus[stat];
            else if (stat === 'defense') item.defense += prefixData.bonus[stat];
            else item.statBonuses[stat] = (item.statBonuses[stat] || 0) + prefixData.bonus[stat];
        }
    } 
    else if (newRarity === 'epic') {
        const suffixKeys = Object.keys(LOOT_SUFFIXES);
        const suffixName = suffixKeys[Math.floor(Math.random() * suffixKeys.length)];
        const suffixData = LOOT_SUFFIXES[suffixName];
        
        item.name = `${item.name} ${suffixName}`;
        
        for (const stat in suffixData.bonus) {
            if (stat === 'damage') item.damage += suffixData.bonus[stat];
            else if (stat === 'defense') item.defense += suffixData.bonus[stat];
            else item.statBonuses[stat] = (item.statBonuses[stat] || 0) + suffixData.bonus[stat];
        }
    } 
    else if (newRarity === 'legendary') {
        if (item.type === 'weapon') item.damage += 2;
        if (item.type === 'armor') item.defense += 2;
        for (const stat in item.statBonuses) {
            item.statBonuses[stat] += 1; // Bump every single existing stat
        }
    }

    logMessage(`{gold:Success! The item has been enchanted into a ${item.name}!}`);
    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
    gameState.screenShake = 8;

    saveEnchantingState();
}

function saveEnchantingState() {
    renderEnchantingModal();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const enchantModal = document.getElementById('enchantingModal');
    const closeBtn = document.getElementById('closeEnchantingButton');

    if (closeBtn) closeBtn.addEventListener('click', () => {
        enchantModal.classList.add('hidden');
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        if (document.activeElement) document.activeElement.blur(); // Focus fix
    });

    if (enchantModal) {
        enchantModal.addEventListener('click', (e) => {
            const disBtn = e.target.closest('button[data-disenchant]');
            if (disBtn) handleDisenchant(parseInt(disBtn.dataset.disenchant, 10));

            const enchBtn = e.target.closest('button[data-enchant]');
            if (enchBtn && !enchBtn.disabled) handleEnchant(parseInt(enchBtn.dataset.enchant, 10));
        });
    }
});

// --- END OF FILE enchanting.js ---
