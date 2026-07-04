// --- START OF FILE enchanting.js ---

// ==========================================
// RUNECRAFTING & ENCHANTING SYSTEM
// ==========================================

const DUST_YIELDS = { 'uncommon': 1, 'rare': 3, 'epic': 8, 'legendary': 25 };
const UPGRADE_COSTS = { 'normal': 5, 'uncommon': 15, 'rare': 30, 'epic': 75 };

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
    const dustItem = player.inventory.find(i => i.name === 'Arcane Dust');
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
        // Skip equipped items to prevent catastrophic errors
        if (item.isEquipped) return;

        // Is it a weapon or armor?
        const isGear = item.type === 'weapon' || item.type === 'armor';
        
        // SECURITY WIN: Escape the item name to prevent XSS injection from manipulated save files
        const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;

        // --- DISENCHANT LIST ---
        if (isGear && item._rarity) {
            const yieldAmt = DUST_YIELDS[item._rarity] || 1;
            
            // JUICE WIN: Dynamic text colors matching rarity
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

        // --- ENCHANT LIST ---
        if (isGear && item._rarity !== 'legendary') {
            const currentRarity = item._rarity || 'normal';
            const cost = UPGRADE_COSTS[currentRarity];
            const canAfford = dustAmount >= cost;
            
            // UX WIN: Upgrade Button color matches the tier you are stepping INTO
            let targetColorTheme = 'green';
            if (currentRarity === 'uncommon') targetColorTheme = 'purple';
            if (currentRarity === 'rare') targetColorTheme = 'red';
            if (currentRarity === 'epic') targetColorTheme = 'yellow';
            
            const btnClass = canAfford ? `bg-${targetColorTheme}-600 hover:bg-${targetColorTheme}-500 border-${targetColorTheme}-900 text-white` : 'bg-gray-700 border-gray-900 opacity-50 cursor-not-allowed text-gray-400';
            
            // Text color matches the tier it CURRENTLY is
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
    });

    if (disFrag.childNodes.length === 0) disenchantList.innerHTML = '<li class="italic text-gray-500 text-sm p-4 text-center border border-gray-700 rounded-lg bg-black bg-opacity-20 shadow-inner font-serif">No unequipped magical items to destroy.</li>';
    else disenchantList.appendChild(disFrag);

    if (enchFrag.childNodes.length === 0) enchantList.innerHTML = '<li class="italic text-gray-500 text-sm p-4 text-center border border-gray-700 rounded-lg bg-black bg-opacity-20 shadow-inner font-serif">No unequipped weapons or armor to enchant.</li>';
    else enchantList.appendChild(enchFrag);
}

function handleDisenchant(index) {
    if (isEnchantingBusy) return;
    isEnchantingBusy = true;

    try {
        const player = gameState.player;
        const item = player.inventory[index];
        
        // 🚨 SECURITY FIX: Re-verify the item isn't equipped just in case the UI is out of sync!
        // Prevents permanently breaking player stats if they shatter an equipped weapon.
        if (!item || item.isEquipped || !item._rarity) {
            logMessage("{red:You cannot shatter an equipped or invalid item!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const yieldAmt = DUST_YIELDS[item._rarity] || 1;
        const oldName = item.name;
        const oldRarity = item._rarity;

        // --- ROBUSTNESS WIN: Capacity Check ---
        // Ensure we actually have space for the dust if we don't already have a stack!
        const existingDust = player.inventory.find(i => i.name === 'Arcane Dust');
        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
        if (!existingDust && player.inventory.length >= invCap) {
            logMessage("{red:You must have an empty inventory slot to receive the Arcane Dust!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; // Abort shattering!
        }

        // Remove the item
        player.inventory.splice(index, 1);

        // Give Dust
        if (existingDust) {
            existingDust.quantity += yieldAmt;
        } else {
            player.inventory.push({
                templateId: '&', name: 'Arcane Dust', type: 'junk', quantity: yieldAmt, tile: '✨'
            });
        }

        // LORE WIN: Dynamic Destruction Flavor Text based on rarity!
        let flavorText = `You shattered the ${oldName} into ${yieldAmt} Arcane Dust.`;
        if (oldRarity === 'rare') flavorText = `The ${oldName} shatters with a sharp crack, releasing ${yieldAmt} Arcane Dust.`;
        else if (oldRarity === 'epic') flavorText = `A miniature shockwave ripples out as the ${oldName} is unmade. (+${yieldAmt} Dust)`;
        else if (oldRarity === 'legendary') flavorText = `The world holds its breath as the legendary relic is crushed into pure Void dust. (+${yieldAmt} Dust)`;

        logMessage(`{purple:${flavorText}}`);
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
        if (typeof ParticleSystem !== 'undefined') {
            // JUICE WIN: Particles color-match the item being destroyed!
            let explosionColor = '#4ade80'; // Uncommon Green
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

function handleEnchant(index) {
    if (isEnchantingBusy) return;
    isEnchantingBusy = true;

    try {
        const player = gameState.player;
        const item = player.inventory[index];
        
        // 🚨 SECURITY FIX: Re-verify the item state and type to prevent injection issues
        if (!item || item.isEquipped || item._rarity === 'legendary') {
            logMessage("{red:You cannot enchant this item!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const currentRarity = item._rarity || 'normal';
        const cost = UPGRADE_COSTS[currentRarity];

        const dustIdx = player.inventory.findIndex(i => i.name === 'Arcane Dust');
        if (dustIdx === -1 || player.inventory[dustIdx].quantity < cost) {
            logMessage("{red:You do not have enough Arcane Dust.}");
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

        // LORE WIN: Dynamic Upgrade Messages
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
            // BUG FIX: Safer Regex string replacement ensures we only replace "Fine " if it's at the very beginning of the string!
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
            }
            upgradeMsg = `The item hums with a terrifying new power. It is now ${item.name}!`;
        } 
        else if (newRarity === 'legendary') {
            if (item.type === 'weapon') item.damage += 2;
            if (item.type === 'armor') item.defense += 2;
            for (const stat in item.statBonuses) {
                item.statBonuses[stat] += 1; // Bump every single existing stat
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

function saveEnchantingState() {
    renderEnchantingModal();
    if (typeof renderInventory === 'function') renderInventory();
    
    // 🚨 FIREBASE OPTIMIZATION: Debounce the save to prevent quota drain
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
    }
}

// PERFORMANCE & SECURITY WIN: Event Delegation
// Ensures bindings are applied safely and exactly once, 
// protecting against hot-reload duplication.
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
        // Ignore clicks if the engine is already processing an upgrade
        if (isEnchantingBusy) return;

        const disBtn = e.target.closest('button[data-disenchant]');
        if (disBtn) {
            const idx = parseInt(disBtn.dataset.disenchant, 10);
            if (!isNaN(idx)) handleDisenchant(idx);
            return;
        }

        const enchBtn = e.target.closest('button[data-enchant]');
        if (enchBtn && !enchBtn.disabled) {
            const idx = parseInt(enchBtn.dataset.enchant, 10);
            if (!isNaN(idx)) handleEnchant(idx);
            return;
        }
    });
    
    enchantModal.dataset.listenersBound = 'true';
}

// --- END OF FILE enchanting.js ---
