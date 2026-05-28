// ==========================================
// STORAGE STASH & BANK SYSTEM
// ==========================================

// Hard cap to prevent players from hoarding thousands of unique items 
// and breaking Firebase document size limits.
const MAX_STASH_SLOTS = 50; 

// Helper to determine if an item is allowed to merge quantities
const isStackableItem = (type) => ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(type);

// Helper for deep cloning items safely without JSON serialization overhead
const cloneItemSafely = (item) => {
    return {
        ...item,
        statBonuses: item.statBonuses ? { ...item.statBonuses } : null
    };
};

window.handleStashTransfer = function (action, index) {
    const player = gameState.player;
    if (!player.bank) player.bank = [];

    if (action === 'deposit') {
        const item = player.inventory[index];

        if (item.isEquipped) {
            logMessage("{red:You must unequip that item before stashing it.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const isStackable = isStackableItem(item.type);
        const existingBankItem = isStackable ? player.bank.find(i => i.name === item.name) : null;

        // Capacity Check (Only applies if it requires a new slot)
        if (!existingBankItem && player.bank.length >= MAX_STASH_SLOTS) {
            logMessage(`{red:Your stash is full! (Max ${MAX_STASH_SLOTS} slots)}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        if (existingBankItem) {
            existingBankItem.quantity += item.quantity;
        } else {
            player.bank.push(cloneItemSafely(item)); 
        }
        
        player.inventory.splice(index, 1);
        
        const qtyString = item.quantity > 1 ? `${item.quantity}x ` : '';
        logMessage(`Deposited ${qtyString}${item.name}.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Clink sound
    }
    else if (action === 'withdraw') {
        const item = player.bank[index];
        const isStackable = isStackableItem(item.type);
        const existingInvItem = isStackable ? player.inventory.find(i => i.name === item.name) : null;

        // Inventory Capacity Check
        if (!existingInvItem && player.inventory.length >= window.MAX_INVENTORY_SLOTS) { 
            logMessage("{red:Your inventory is full!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        let withdrawnItem = cloneItemSafely(item);

        // PERFORMANCE & ROBUSTNESS: O(1) Rebind Effect Logic using templateId 
        // This ensures weapons keep their onHit procs and consumables keep their effects after being stored!
        let templateKey = withdrawnItem.templateId;
        if (!templateKey) {
            // Fallback for legacy items missing a templateId
            templateKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === withdrawnItem.name);
            if (templateKey) withdrawnItem.templateId = templateKey; // Heal the data
        }
        
        if (templateKey && ITEM_DATA[templateKey]) {
            const t = ITEM_DATA[templateKey];
            withdrawnItem.effect = t.effect;
            withdrawnItem.onHit = t.onHit;
            withdrawnItem.procChance = t.procChance;
            withdrawnItem.inflicts = t.inflicts;
            withdrawnItem.inflictChance = t.inflictChance;
        }

        if (existingInvItem) {
            existingInvItem.quantity += withdrawnItem.quantity;
        } else {
            player.inventory.push(withdrawnItem); 
        }
        
        player.bank.splice(index, 1);
        
        const qtyString = withdrawnItem.quantity > 1 ? `${withdrawnItem.quantity}x ` : '';
        logMessage(`Withdrew ${qtyString}${withdrawnItem.name}.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Clink sound
    }

    // Save and Render. Note: getSanitizedInventory prevents Firebase crashes from functions.
    playerRef.update({ 
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory, 
        bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank 
    });
    renderStash();
    renderInventory();
};

// Gameplay Addition: Quality of Life feature to dump all crafting materials instantly
window.depositAllMaterials = function() {
    const player = gameState.player;
    if (!player.bank) player.bank = [];
    
    let itemsMoved = 0;

    // Iterate backwards so we can safely splice items out of the array
    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        
        // Only target stackable resource types that aren't equipped
        if (item.isEquipped) continue;
        if (!['junk', 'ingredient', 'trade'].includes(item.type)) continue;

        const existingBankItem = player.bank.find(bankItem => bankItem.name === item.name);

        if (!existingBankItem && player.bank.length >= MAX_STASH_SLOTS) {
            logMessage("{red:Stash became full during mass deposit.}");
            break; 
        }

        if (existingBankItem) {
            existingBankItem.quantity += item.quantity;
        } else {
            player.bank.push(cloneItemSafely(item));
        }

        player.inventory.splice(i, 1);
        itemsMoved++;
    }

    if (itemsMoved > 0) {
        logMessage(`{green:Mass deposited ${itemsMoved} material stacks.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); 
        
        playerRef.update({ 
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory, 
            bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank 
        });
        renderStash();
        renderInventory();
    } else {
        logMessage("{gray:No materials found to deposit.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    }
};

function renderStash() {
    stashPlayerList.innerHTML = '';
    stashBankList.innerHTML = '';

    const player = gameState.player;
    const bank = player.bank || [];

    // PERFORMANCE: Use DocumentFragments to prevent layout thrashing
    const playerFragment = document.createDocumentFragment();
    const bankFragment = document.createDocumentFragment();

    // Helper to generate hover tooltips for magic items
    const generateTooltip = (item) => {
        let tooltip = item.name;
        if (item.statBonuses) {
            const bonuses = Object.entries(item.statBonuses).map(([k,v]) => `+${v} ${k.substring(0,3).toUpperCase()}`).join(', ');
            tooltip += `\nBonuses: ${bonuses}`;
        }
        return tooltip;
    };

    // Render Player Inventory (Deposit)
    if (player.inventory.length === 0) {
        stashPlayerList.innerHTML = '<li class="italic text-sm text-gray-500 p-2">Inventory is empty.</li>';
    } else {
        player.inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item hover:border-green-500 transition-colors duration-150';
            li.title = generateTooltip(item); // UX WIN: Added Tooltips
            
            // Format bonuses for tooltip/display
            let extraInfo = '';
            if (item.statBonuses) {
                extraInfo = ` <span class="text-xs text-indigo-400">[*]</span>`;
            }
            if (item.isEquipped) {
                extraInfo += ` <span class="text-xs text-yellow-500 font-bold">[EQP]</span>`;
            }

            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-lg">${item.tile || '🎒'}</span>
                    <span>${item.name} <span class="text-xs text-gray-400">x${item.quantity}</span>${extraInfo}</span>
                </div>
                <button class="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded shadow-sm transition-all active:scale-95 disabled:opacity-50" 
                        ${item.isEquipped ? 'disabled title="Unequip first"' : ''}
                        onclick="handleStashTransfer('deposit', ${index})">
                    Deposit
                </button>
            `;
            playerFragment.appendChild(li);
        });
    }

    // Render Bank (Withdraw)
    if (bank.length === 0) {
        stashBankList.innerHTML = '<li class="italic text-sm text-gray-500 p-2">Stash is empty.</li>';
    } else {
        bank.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item hover:border-blue-500 transition-colors duration-150';
            li.title = generateTooltip(item); // UX WIN: Added Tooltips
            
            let extraInfo = item.statBonuses ? ` <span class="text-xs text-indigo-400">[*]</span>` : '';

            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-lg">${item.tile || '📦'}</span>
                    <span>${item.name} <span class="text-xs text-gray-400">x${item.quantity}</span>${extraInfo}</span>
                </div>
                <button class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow-sm transition-all active:scale-95" 
                        onclick="handleStashTransfer('withdraw', ${index})">
                    Withdraw
                </button>
            `;
            bankFragment.appendChild(li);
        });
    }

    stashPlayerList.appendChild(playerFragment);
    stashBankList.appendChild(bankFragment);

    // Update the Bank Title dynamically to show capacity
    const bankHeader = stashBankList.parentElement.querySelector('h3');
    if (bankHeader) {
        bankHeader.innerHTML = `Stash Vault <span class="text-sm font-normal text-gray-400 ml-2">(${bank.length}/${MAX_STASH_SLOTS})</span>`;
    }

    // Inject Mass Deposit Button into Player Inventory Header
    const invHeader = stashPlayerList.parentElement.querySelector('h3');
    if (invHeader && !invHeader.querySelector('#massDepositBtn')) {
        invHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span>Your Bag</span>
                <button id="massDepositBtn" onclick="depositAllMaterials()" class="text-[10px] uppercase font-bold tracking-widest bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded shadow transition-all active:scale-95">
                    Deposit Mats
                </button>
            </div>
        `;
    }
}

function openStashModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    renderStash();
    stashModal.classList.remove('hidden');
}
