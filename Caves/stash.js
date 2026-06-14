// --- START OF FILE stash.js ---

// ==========================================
// STORAGE STASH & BANK SYSTEM
// ==========================================

// Hard cap to prevent players from hoarding thousands of unique items 
// and breaking Firebase document size limits.
const MAX_STASH_SLOTS = 50; 

// PERFORMANCE WIN: O(1) Item Lookup Cache for Withdrawing
// Prevents O(N) string-matching scans against the massive ITEM_DATA dictionary every time an item is moved.
const _stashItemKeyCache = {};
function getStashItemKey(name) {
    if (_stashItemKeyCache[name]) return _stashItemKeyCache[name];
    if (typeof window.ITEM_DATA === 'undefined') return null;
    const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
    if (key) _stashItemKeyCache[name] = key;
    return key;
}

// Helper to determine if an item is allowed to merge quantities
const isStackableItem = (type) => ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(type);

// Helper for deep cloning items safely without JSON serialization overhead
const cloneItemSafely = (item) => {
    return {
        ...item,
        statBonuses: item.statBonuses ? { ...item.statBonuses } : null
    };
};

// QoL WIN: Added 'amount' parameter to support partial stack transfers!
window.handleStashTransfer = function (action, index, amountStr = 'all') {
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
        
        // Determine transfer amount
        const amountToMove = (amountStr === 'all') ? item.quantity : 1;

        // Capacity Check (Only applies if it requires a new slot)
        if (!existingBankItem && player.bank.length >= MAX_STASH_SLOTS) {
            logMessage(`{red:Your stash is full! (Max ${MAX_STASH_SLOTS} slots)}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        if (existingBankItem) {
            existingBankItem.quantity += amountToMove;
        } else {
            const newItem = cloneItemSafely(item);
            newItem.quantity = amountToMove;
            player.bank.push(newItem); 
        }
        
        item.quantity -= amountToMove;
        if (item.quantity <= 0) {
            player.inventory.splice(index, 1);
        }
        
        const qtyString = amountToMove > 1 ? `${amountToMove}x ` : '';
        const nameFormatted = item.statBonuses ? `{purple:${item.name}}` : item.name;
        logMessage(`Deposited ${qtyString}${nameFormatted}.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Clink sound
    }
    else if (action === 'withdraw') {
        const item = player.bank[index];
        const isStackable = isStackableItem(item.type);
        const existingInvItem = isStackable ? player.inventory.find(i => i.name === item.name) : null;

        // Determine transfer amount
        const amountToMove = (amountStr === 'all') ? item.quantity : 1;

        // Inventory Capacity Check
        if (!existingInvItem && player.inventory.length >= window.MAX_INVENTORY_SLOTS) { 
            logMessage("{red:Your inventory is full!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        if (existingInvItem) {
            existingInvItem.quantity += amountToMove;
        } else {
            let withdrawnItem = cloneItemSafely(item);
            withdrawnItem.quantity = amountToMove;

            // PERFORMANCE & ROBUSTNESS: O(1) Cached Rebind Effect Logic
            let templateKey = withdrawnItem.templateId;
            if (!templateKey) {
                templateKey = getStashItemKey(withdrawnItem.name);
                if (templateKey) withdrawnItem.templateId = templateKey; 
            }
            
            if (templateKey && window.ITEM_DATA && window.ITEM_DATA[templateKey]) {
                const t = window.ITEM_DATA[templateKey];
                withdrawnItem.effect = t.effect;
                withdrawnItem.onHit = t.onHit;
                withdrawnItem.procChance = t.procChance;
                withdrawnItem.inflicts = t.inflicts;
                withdrawnItem.inflictChance = t.inflictChance;
            }
            
            player.inventory.push(withdrawnItem); 
        }
        
        item.quantity -= amountToMove;
        if (item.quantity <= 0) {
            player.bank.splice(index, 1);
        }
        
        const qtyString = amountToMove > 1 ? `${amountToMove}x ` : '';
        const nameFormatted = item.statBonuses ? `{purple:${item.name}}` : item.name;
        logMessage(`Withdrew ${qtyString}${nameFormatted}.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Clink sound
    }

    // Save and Render.
    playerRef.update({ 
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory, 
        bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank 
    });
    renderStash();
    renderInventory();
};

window.depositAllMaterials = function() {
    const player = gameState.player;
    if (!player.bank) player.bank = [];
    
    let itemsMoved = 0;

    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        
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
        
        // JUICE WIN: Satisfying visual confirmation behind the modal
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(player.x, player.y, "STASHED", "#4ade80");
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); 
        
        // Auto-sort the stash cleanly after a mass dump
        window.sortStash(false); // pass false to skip playing the step sound again
        
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

// QoL WIN: Stash Sorting Algorithm
window.sortStash = function(playSound = true) {
    const player = gameState.player;
    if (!player.bank || player.bank.length === 0) return;

    // 1. Consolidate stacks in case there are duplicates
    const consolidated = [];
    player.bank.forEach(item => {
        const isStackable = isStackableItem(item.type);
        const existing = consolidated.find(i => i.name === item.name && isStackable);
        
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            consolidated.push({...item}); 
        }
    });

    // 2. Sort by Type, then Name
    const typeWeights = { 
        'weapon': 1, 'armor': 2, 'accessory': 3, 'ammo': 4, 
        'consumable': 5, 'tool': 6, 'spellbook': 7, 'quest': 8, 'trade': 9, 'junk': 10 
    };

    consolidated.sort((a, b) => {
        const wA = typeWeights[a.type] || 20;
        const wB = typeWeights[b.type] || 20;
        
        if (wA !== wB) return wA - wB; 
        return a.name.localeCompare(b.name); 
    });

    player.bank = consolidated;

    if (playSound && typeof AudioSystem !== 'undefined') {
        AudioSystem.playStep();
    }

    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update({ bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank });
    }
    renderStash();
};

function renderStash() {
    stashPlayerList.innerHTML = '';
    stashBankList.innerHTML = '';

    const player = gameState.player;
    const bank = player.bank || [];

    const playerFragment = document.createDocumentFragment();
    const bankFragment = document.createDocumentFragment();

    // QoL WIN: Enhanced Tooltips parsing base item descriptions!
    const generateTooltip = (item) => {
        let tooltip = item.name;
        
        // Grab base lore if available
        let tKey = item.templateId || getStashItemKey(item.name);
        const template = window.ITEM_DATA && tKey ? window.ITEM_DATA[tKey] : null;
        if (template && template.description) {
            // Strip out internal {color:} tags for the clean native tooltip
            const cleanDesc = template.description.replace(/\{[a-z]+:(.*?)\}/g, '$1');
            tooltip += `\n\n${cleanDesc}`;
        }

        if (item.statBonuses) {
            const bonuses = Object.entries(item.statBonuses).map(([k,v]) => `+${v} ${k.substring(0,3).toUpperCase()}`).join(', ');
            tooltip += `\n\nBonuses: [${bonuses}]`;
        }
        return tooltip;
    };

    // Render Player Inventory (Deposit)
    if (player.inventory.length === 0) {
        stashPlayerList.innerHTML = '<li class="italic text-sm text-gray-500 p-2 border border-gray-700 rounded-lg">Your bag is empty.</li>';
    } else {
        player.inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item hover:border-green-500 transition-colors duration-150';
            li.title = generateTooltip(item); 
            
            // JUICE: Highlight Magic Items
            const nameColor = item.statBonuses ? 'text-purple-400 font-bold' : 'text-gray-200';

            let extraInfo = item.statBonuses ? ` <span class="text-xs text-purple-400">✨</span>` : '';
            if (item.isEquipped) {
                extraInfo += ` <span class="text-[9px] text-yellow-500 font-bold bg-black bg-opacity-40 px-1 rounded ml-1 uppercase tracking-widest border border-yellow-800">[EQP]</span>`;
            }

            // QoL: Split Stack Buttons
            let buttonsHtml = '';
            if (item.isEquipped) {
                buttonsHtml = `<button class="text-xs bg-gray-800 text-gray-500 px-3 py-1 rounded shadow-sm opacity-50 cursor-not-allowed border border-gray-700" disabled>Equipped</button>`;
            } else if (item.quantity > 1) {
                buttonsHtml = `
                    <button class="text-[10px] bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold" style="transform: translate3d(0,0,0);" onclick="handleStashTransfer('deposit', ${index}, 1)">Dep 1</button>
                    <button class="text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold ml-1" style="transform: translate3d(0,0,0);" onclick="handleStashTransfer('deposit', ${index}, 'all')">All</button>
                `;
            } else {
                buttonsHtml = `<button class="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded shadow-sm transition-all active:scale-95" style="transform: translate3d(0,0,0);" onclick="handleStashTransfer('deposit', ${index}, 'all')">Deposit</button>`;
            }

            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-lg">${item.tile || '🎒'}</span>
                    <span class="${nameColor}">${item.name} <span class="text-xs text-gray-400 ml-1">x${item.quantity}</span>${extraInfo}</span>
                </div>
                <div class="flex items-center">
                    ${buttonsHtml}
                </div>
            `;
            playerFragment.appendChild(li);
        });
    }

    // Render Bank (Withdraw)
    if (bank.length === 0) {
        stashBankList.innerHTML = '<li class="italic text-sm text-gray-500 p-2 border border-gray-700 rounded-lg">Stash is empty.</li>';
    } else {
        bank.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item hover:border-blue-500 transition-colors duration-150';
            li.title = generateTooltip(item); 
            
            // JUICE: Highlight Magic Items
            const nameColor = item.statBonuses ? 'text-purple-400 font-bold' : 'text-gray-200';
            let extraInfo = item.statBonuses ? ` <span class="text-xs text-purple-400">✨</span>` : '';

            // QoL: Split Stack Buttons
            let buttonsHtml = '';
            if (item.quantity > 1) {
                buttonsHtml = `
                    <button class="text-[10px] bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold" style="transform: translate3d(0,0,0);" onclick="handleStashTransfer('withdraw', ${index}, 1)">Take 1</button>
                    <button class="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold ml-1" style="transform: translate3d(0,0,0);" onclick="handleStashTransfer('withdraw', ${index}, 'all')">All</button>
                `;
            } else {
                buttonsHtml = `<button class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow-sm transition-all active:scale-95" style="transform: translate3d(0,0,0);" onclick="handleStashTransfer('withdraw', ${index}, 'all')">Withdraw</button>`;
            }

            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-lg">${item.tile || '📦'}</span>
                    <span class="${nameColor}">${item.name} <span class="text-xs text-gray-400 ml-1">x${item.quantity}</span>${extraInfo}</span>
                </div>
                <div class="flex items-center">
                    ${buttonsHtml}
                </div>
            `;
            bankFragment.appendChild(li);
        });
    }

    stashPlayerList.appendChild(playerFragment);
    stashBankList.appendChild(bankFragment);

    // --- DYNAMIC CAPACITY UI ---
    const bankHeader = stashBankList.parentElement.querySelector('h3');
    if (bankHeader) {
        const capacityPct = bank.length / MAX_STASH_SLOTS;
        let capColor = "text-green-400";
        if (capacityPct > 0.95) capColor = "text-red-500 animate-pulse";
        else if (capacityPct > 0.8) capColor = "text-yellow-500";

        // Inject Auto-Sort alongside capacity
        bankHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span>Stash Vault <span class="text-[10px] font-normal ${capColor} ml-1 bg-black bg-opacity-30 px-1 rounded border border-gray-700">(${bank.length}/${MAX_STASH_SLOTS})</span></span>
                <button onclick="sortStash()" class="text-[10px] uppercase font-bold tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow transition-all active:scale-95" style="transform: translate3d(0,0,0);">Sort</button>
            </div>
        `;
    }

    // Inject Mass Deposit Button into Player Inventory Header
    const invHeader = stashPlayerList.parentElement.querySelector('h3');
    if (invHeader && !invHeader.querySelector('#massDepositBtn')) {
        invHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span>Your Bag</span>
                <button id="massDepositBtn" onclick="depositAllMaterials()" class="text-[10px] uppercase font-bold tracking-widest bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded shadow transition-all active:scale-95" style="transform: translate3d(0,0,0);">
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

// --- END OF FILE stash.js ---
