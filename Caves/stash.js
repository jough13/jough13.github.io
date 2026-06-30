// --- START OF FILE stash.js ---

// ==========================================
// STORAGE STASH & BANK SYSTEM
// ==========================================

// Hard cap to prevent players from hoarding thousands of unique items 
// and breaking Firebase document size limits.
window.MAX_STASH_SLOTS = 50; 

// PERFORMANCE WIN: O(1) Item Lookup Cache for Withdrawing
// Attaching directly to 'window' makes it 100% immune to hot-reload SyntaxErrors!
window._stashItemKeyCache = window._stashItemKeyCache || {};

function getStashItemKey(name) {
    if (window._stashItemKeyCache[name]) return window._stashItemKeyCache[name];
    if (typeof window.ITEM_DATA === 'undefined') return null;
    const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
    if (key) window._stashItemKeyCache[name] = key;
    return key;
}

// Helper to determine if an item is allowed to merge quantities
window.isStackableItem = (type) => ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(type);

// PERFORMANCE & BUG FIX WIN: High-speed, robust deep cloning for stash transfers
// Prevents accidentally copying an item Reference which would cause deleting it from 
// the stash to also delete it from the player's inventory!
window.cloneItemSafely = (item) => {
    if (typeof fastClone === 'function') {
        return fastClone(item);
    }
    // Absolute safe fallback if fastClone isn't available
    return JSON.parse(JSON.stringify(item));
};

// JUICE WIN: Dynamic Audio based on the item type being transferred
function playStashAudio(itemType) {
    if (typeof AudioSystem === 'undefined') return;
    
    if (['weapon', 'armor', 'tool'].includes(itemType)) {
        AudioSystem.playHit(); // Heavy metallic clank
    } else if (['consumable', 'ammo', 'ingredient', 'scroll', 'spellbook'].includes(itemType)) {
        AudioSystem.playNoise(0.1, 0.1, 800); // Rustling/paper sound
    } else if (['trade'].includes(itemType)) {
        AudioSystem.playCoin(); // Wealth jingle
    } else {
        AudioSystem.playStep(); // Standard thud
    }
}

// Added 'amount' parameter to support partial stack transfers!
window.handleStashTransfer = function (action, index, amountStr = 'all') {
    const player = gameState.player;
    if (!player.bank) player.bank = [];

    if (action === 'deposit') {
        const item = player.inventory[index];

        if (!item || item.isEquipped) {
            logMessage("{red:You must unequip that item before stashing it.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const isStackable = window.isStackableItem(item.type);
        const existingBankItem = isStackable ? player.bank.find(i => i.name === item.name) : null;
        
        // Determine transfer amount
        const amountToMove = (amountStr === 'all') ? item.quantity : 1;

        // Capacity Check (Only applies if it requires a new slot)
        if (!existingBankItem && player.bank.length >= window.MAX_STASH_SLOTS) {
            // LORE WIN: Thematic overload warning
            logMessage(`{red:The fabric of the vault groans under the weight of your possessions! (Max ${window.MAX_STASH_SLOTS} slots)}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        if (existingBankItem) {
            existingBankItem.quantity += amountToMove;
        } else {
            const newItem = window.cloneItemSafely(item);
            newItem.quantity = amountToMove;
            player.bank.push(newItem); 
        }
        
        item.quantity -= amountToMove;
        if (item.quantity <= 0) {
            player.inventory.splice(index, 1);
        }
        
        const qtyString = amountToMove > 1 ? `${amountToMove}x ` : '';
        const nameFormatted = item.statBonuses ? `{purple:${item.name}}` : item.name;
        logMessage(`You push ${qtyString}${nameFormatted} into the void.`);
        
        playStashAudio(item.type);
        
        // JUICE WIN: Purple particle effect representing the Void Vault receiving the item
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, item.tile || '📦', '#c084fc');

    }
    else if (action === 'withdraw') {
        const item = player.bank[index];
        if (!item) return;

        const isStackable = window.isStackableItem(item.type);
        const existingInvItem = isStackable ? player.inventory.find(i => i.name === item.name && !i.isEquipped) : null;

        // Determine transfer amount
        const amountToMove = (amountStr === 'all') ? item.quantity : 1;

        // Inventory Capacity Check
        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
        if (!existingInvItem && player.inventory.length >= invCap) { 
            logMessage("{red:Your inventory is full!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        if (existingInvItem) {
            existingInvItem.quantity += amountToMove;
        } else {
            let withdrawnItem = window.cloneItemSafely(item);
            withdrawnItem.quantity = amountToMove;

            // PERFORMANCE & ROBUSTNESS: O(1) Cached Rebind Effect Logic
            let templateKey = withdrawnItem.templateId;
            if (!templateKey) {
                templateKey = getStashItemKey(withdrawnItem.name);
                if (templateKey) withdrawnItem.templateId = templateKey; 
            }
            
            // Rehydrate properties that can't be saved in the database
            if (templateKey && typeof window.ITEM_DATA !== 'undefined' && window.ITEM_DATA[templateKey]) {
                const t = window.ITEM_DATA[templateKey];
                withdrawnItem.effect = t.effect;
                withdrawnItem.onHit = t.onHit;
                withdrawnItem.procChance = t.procChance;
                withdrawnItem.inflicts = t.inflicts;
                withdrawnItem.inflictChance = t.inflictChance;
                // BUG FIX: Hydrate tags so weapons function correctly!
                if (t.tags) withdrawnItem.tags = [...t.tags]; 
            }
            
            player.inventory.push(withdrawnItem); 
        }
        
        item.quantity -= amountToMove;
        if (item.quantity <= 0) {
            player.bank.splice(index, 1);
        }
        
        const qtyString = amountToMove > 1 ? `${amountToMove}x ` : '';
        const nameFormatted = item.statBonuses ? `{purple:${item.name}}` : item.name;
        logMessage(`You pull ${qtyString}${nameFormatted} from the vault.`);
        
        playStashAudio(item.type);
        
        // JUICE WIN: Blue particle effect representing the player's Bag receiving the item
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, item.tile || '🎒', '#60a5fa');
    }

    // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer instead of instantaneous save!
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ 
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory, 
            bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank 
        });
    }

    renderStash();
    if (typeof renderInventory === 'function') renderInventory();
};

window.depositAllMaterials = function() {
    const player = gameState.player;
    if (!player.bank) player.bank = [];
    
    let itemsMoved = 0;

    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        
        // BUG FIX: Prevent depositing equipped ammo/consumables!
        if (item.isEquipped) continue;
        if (!['junk', 'ingredient', 'trade'].includes(item.type)) continue;

        const existingBankItem = player.bank.find(bankItem => bankItem.name === item.name);

        if (!existingBankItem && player.bank.length >= window.MAX_STASH_SLOTS) {
            logMessage("{red:The vault became full during the mass deposit.}");
            break; 
        }

        if (existingBankItem) {
            existingBankItem.quantity += item.quantity;
        } else {
            player.bank.push(window.cloneItemSafely(item));
        }

        player.inventory.splice(i, 1);
        itemsMoved++;
    }

    if (itemsMoved > 0) {
        logMessage(`{green:Mass deposited ${itemsMoved} material stacks.}`);
        
        // JUICE WIN: Satisfying visual confirmation behind the modal
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(player.x, player.y, "STASHED", "#4ade80");
            ParticleSystem.createExplosion(player.x, player.y, '#9ca3af', 10);
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); 
        
        // Auto-sort the stash cleanly after a mass dump
        window.sortStash(false); // pass false to skip playing the step sound again
        
        // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({ 
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory, 
                bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank 
            });
        }

        renderStash();
        if (typeof renderInventory === 'function') renderInventory();
    } else {
        logMessage("{gray:No materials found to deposit.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    }
};

// ==========================================
// QoL EXPANSION: QUICK STACK
// ==========================================
window.quickStackToStash = function() {
    const player = gameState.player;
    if (!player.bank) player.bank = [];
    
    let itemsMoved = 0;

    // Loop backwards for safe splicing
    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        
        // BUG FIX: Prevent quick-stacking equipped items (like arrows!)
        if (item.isEquipped) continue;
        if (!window.isStackableItem(item.type)) continue;

        // Check if this item already exists in the stash
        const existingBankItem = player.bank.find(bankItem => bankItem.name === item.name);

        // If it exists in the stash, merge the stacks!
        if (existingBankItem) {
            existingBankItem.quantity += item.quantity;
            player.inventory.splice(i, 1);
            itemsMoved++;
        }
    }

    if (itemsMoved > 0) {
        logMessage(`{green:Quick-stacked ${itemsMoved} item stacks into your vault.}`);
        
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(player.x, player.y, "QUICK STACK", "#4ade80");
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); 
        
        window.sortStash(false);
        
        // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({ 
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory, 
                bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank 
            });
        }

        renderStash();
        if (typeof renderInventory === 'function') renderInventory();
    } else {
        logMessage("{gray:No matching stackable items found to quick-stack.}");
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
        const isStackable = window.isStackableItem(item.type);
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

    // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ bank: typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank });
    }

    renderStash();
};

function renderStash() {
    const stashPlayerList = document.getElementById('stashPlayerList');
    const stashBankList = document.getElementById('stashBankList');
    if (!stashPlayerList || !stashBankList) return;

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
        const template = typeof window.ITEM_DATA !== 'undefined' && tKey ? window.ITEM_DATA[tKey] : null;
        if (template && template.description) {
            // ROBUSTNESS: Strip out internal {color:} tags for a completely clean native tooltip
            const cleanDesc = typeof stripColorTags === 'function' ? stripColorTags(template.description) : template.description.replace(/\{[a-zA-Z]+:(.*?)\}/g, '$1');
            tooltip += `\n\n${cleanDesc}`;
        }

        // --- EXPANSION: Show Base Weapon/Armor Stats in Tooltip ---
        if (item.type === 'weapon' && item.damage !== undefined) {
            tooltip += `\nDamage: +${item.damage}`;
        }
        if (item.type === 'armor' && item.defense !== undefined) {
            tooltip += `\nDefense: +${item.defense}`;
        }

        if (item.statBonuses) {
            const bonuses = Object.entries(item.statBonuses).map(([k,v]) => `+${v} ${k.substring(0,3).toUpperCase()}`).join(', ');
            tooltip += `\nBonuses: [${bonuses}]`;
        }
        return tooltip;
    };

    // UI/UX WIN: Generate visually pleasing category tags for the list
    const generateTypeTag = (item) => {
        const type = item.type;
        if (!type) return '';
        
        // Magical items get a special tag override!
        if (item.statBonuses && Object.keys(item.statBonuses).length > 0) {
            return `<span class="text-[8px] uppercase tracking-widest text-fuchsia-300 bg-fuchsia-900 border-fuchsia-800 bg-opacity-30 px-1.5 py-0.5 rounded border ml-2 shadow-inner inline-block relative -top-0.5">MAGIC</span>`;
        }
        
        const tagMap = {
            'weapon': { color: 'text-red-400', bg: 'bg-red-900 border-red-800' },
            'armor': { color: 'text-blue-400', bg: 'bg-blue-900 border-blue-800' },
            'consumable': { color: 'text-green-400', bg: 'bg-green-900 border-green-800' },
            'trade': { color: 'text-yellow-400', bg: 'bg-yellow-900 border-yellow-800' },
            'ammo': { color: 'text-orange-400', bg: 'bg-orange-900 border-orange-800' },
            'junk': { color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' },
            'quest': { color: 'text-purple-400', bg: 'bg-purple-900 border-purple-800' }
        };
        const style = tagMap[type] || { color: 'text-gray-300', bg: 'bg-gray-800 border-gray-600' };
        return `<span class="text-[8px] uppercase tracking-widest ${style.color} ${style.bg} bg-opacity-30 px-1.5 py-0.5 rounded border ml-2 shadow-inner inline-block relative -top-0.5">${type}</span>`;
    };

    // Render Player Inventory (Deposit)
    if (player.inventory.length === 0) {
        // LORE WIN: Thematic empty states!
        stashPlayerList.innerHTML = '<li class="italic text-sm text-gray-500 p-3 border border-gray-700 rounded-lg bg-black bg-opacity-20 text-center shadow-inner font-serif">Your pockets hold only dust.</li>';
    } else {
        player.inventory.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item hover:border-green-500 transition-colors duration-150';
            li.title = generateTooltip(item); 
            
            // JUICE: Highlight Magic Items
            let nameColor = item.statBonuses ? 'text-fuchsia-400 font-bold' : 'text-gray-200';
            
            // Rarity overriding color
            if (item._rarity === 'rare') nameColor = 'text-purple-400 font-bold';
            if (item._rarity === 'epic') nameColor = 'text-red-400 font-bold';
            if (item._rarity === 'legendary') nameColor = 'text-yellow-400 font-bold';

            let extraInfo = item.statBonuses ? ` <span class="text-xs text-purple-400 drop-shadow-md">✨</span>` : '';
            extraInfo += generateTypeTag(item);
            
            if (item.isEquipped) {
                extraInfo += ` <span class="text-[9px] text-yellow-500 font-bold bg-black bg-opacity-40 px-1 rounded ml-1 uppercase tracking-widest border border-yellow-800 shadow-inner relative -top-0.5">[EQP]</span>`;
            }

            // PERFORMANCE WIN: Event Delegation Data Attributes
            let buttonsHtml = '';
            if (item.isEquipped) {
                buttonsHtml = `<button class="text-xs bg-gray-800 text-gray-500 px-3 py-1 rounded shadow-sm opacity-50 cursor-not-allowed border border-gray-700" disabled>Equipped</button>`;
            } else if (item.quantity > 1) {
                buttonsHtml = `
                    <button data-action="deposit" data-index="${index}" data-amount="1" class="text-[10px] bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold" style="transform: translateZ(0);">Dep 1</button>
                    <button data-action="deposit" data-index="${index}" data-amount="all" class="text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold ml-1" style="transform: translateZ(0);">All</button>
                `;
            } else {
                buttonsHtml = `<button data-action="deposit" data-index="${index}" data-amount="all" class="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded shadow-sm transition-all active:scale-95" style="transform: translateZ(0);">Deposit</button>`;
            }

            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-lg drop-shadow-md">${item.tile || '🎒'}</span>
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
        // LORE WIN: Thematic empty states!
        stashBankList.innerHTML = '<li class="italic text-sm text-gray-500 p-3 border border-gray-700 rounded-lg bg-black bg-opacity-20 text-center shadow-inner font-serif">The dimensional vault echoes with emptiness.</li>';
    } else {
        bank.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item hover:border-blue-500 transition-colors duration-150';
            li.title = generateTooltip(item); 
            
            // JUICE: Highlight Magic Items
            let nameColor = item.statBonuses ? 'text-fuchsia-400 font-bold' : 'text-gray-200';
            
            if (item._rarity === 'rare') nameColor = 'text-purple-400 font-bold';
            if (item._rarity === 'epic') nameColor = 'text-red-400 font-bold';
            if (item._rarity === 'legendary') nameColor = 'text-yellow-400 font-bold';
            
            let extraInfo = item.statBonuses ? ` <span class="text-xs text-purple-400 drop-shadow-md">✨</span>` : '';
            extraInfo += generateTypeTag(item);

            // PERFORMANCE WIN: Event Delegation Data Attributes
            let buttonsHtml = '';
            if (item.quantity > 1) {
                buttonsHtml = `
                    <button data-action="withdraw" data-index="${index}" data-amount="1" class="text-[10px] bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold" style="transform: translateZ(0);">Take 1</button>
                    <button data-action="withdraw" data-index="${index}" data-amount="all" class="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow-sm transition-all active:scale-95 uppercase font-bold ml-1" style="transform: translateZ(0);">All</button>
                `;
            } else {
                buttonsHtml = `<button data-action="withdraw" data-index="${index}" data-amount="all" class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow-sm transition-all active:scale-95" style="transform: translateZ(0);">Withdraw</button>`;
            }

            li.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-lg drop-shadow-md">${item.tile || '📦'}</span>
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
        const capacityPct = bank.length / window.MAX_STASH_SLOTS;
        let capColor = "text-green-400";
        if (capacityPct > 0.95) capColor = "text-red-500 animate-pulse";
        else if (capacityPct > 0.8) capColor = "text-yellow-500";

        // Inject Auto-Sort alongside capacity (using Event Delegation)
        bankHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span class="drop-shadow-sm">Dimensional Vault <span class="text-[10px] font-normal ${capColor} ml-1 bg-black bg-opacity-30 px-1 rounded border border-gray-700 shadow-inner">(${bank.length}/${window.MAX_STASH_SLOTS})</span></span>
                <button data-action="sortStash" class="text-[10px] uppercase font-bold tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow transition-all active:scale-95 border-b-2 border-blue-800 active:border-b-0 active:mt-0.5" style="transform: translateZ(0);">Sort</button>
            </div>
        `;
    }

    // Inject Mass Deposit & Quick Stack Buttons into Player Inventory Header
    const invHeader = stashPlayerList.parentElement.querySelector('h3');
    if (invHeader) {
        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
        invHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span class="drop-shadow-sm">Your Bag <span class="text-[10px] text-gray-400 font-normal ml-1 bg-black bg-opacity-30 px-1 rounded border border-gray-700 shadow-inner">(${player.inventory.length}/${invCap})</span></span>
                <div class="flex gap-2">
                    <button data-action="quickStack" class="text-[10px] uppercase font-bold tracking-widest bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded shadow transition-all active:scale-95 border-b-2 border-purple-800 active:border-b-0 active:mt-0.5" style="transform: translateZ(0);">
                        Quick Stack
                    </button>
                    <button data-action="massDeposit" class="text-[10px] uppercase font-bold tracking-widest bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded shadow transition-all active:scale-95 border-b-2 border-gray-800 active:border-b-0 active:mt-0.5" style="transform: translateZ(0);">
                        Deposit Mats
                    </button>
                </div>
            </div>
        `;
    }
}

function openStashModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    renderStash();
    
    // LORE WIN: Flavor text explaining how stashes work globally
    const title = document.querySelector('#stashModal h2');
    if (title) {
        title.innerHTML = `Dimensional Vault <span class='text-sm text-purple-400 block font-normal mt-1 italic font-serif drop-shadow-none'>Space and time fold inside this heavy iron box. Your items are safe across all realms.</span>`;
    }
    
    const stashModal = document.getElementById('stashModal');
    if (stashModal) stashModal.classList.remove('hidden');
}

// ==========================================
// SECURITY & PERFORMANCE WIN: Event Delegation
// ==========================================
// Attaches exactly ONE event listener to the entire modal to handle all Stash clicks.
function initStashListeners() {
    const stashModalEl = document.getElementById('stashModal');
    if (!stashModalEl || stashModalEl.dataset.listenersBound) return;
    
    stashModalEl.addEventListener('click', (e) => {
        // Did we click a button with a data-action?
        const btn = e.target.closest('button[data-action]');
        if (!btn || btn.disabled) return;

        const action = btn.dataset.action;

        // --- Header Actions ---
        if (action === 'sortStash') {
            if (typeof window.sortStash === 'function') window.sortStash();
        } 
        else if (action === 'quickStack') {
            if (typeof window.quickStackToStash === 'function') window.quickStackToStash();
        } 
        else if (action === 'massDeposit') {
            if (typeof window.depositAllMaterials === 'function') window.depositAllMaterials();
        } 
        // --- List Transfer Actions ---
        else if (action === 'deposit' || action === 'withdraw') {
            const index = parseInt(btn.dataset.index, 10);
            const amount = btn.dataset.amount;
            if (!isNaN(index) && typeof window.handleStashTransfer === 'function') {
                window.handleStashTransfer(action, index, amount);
            }
        }
    });

    // Handle closing the modal
    const closeBtn = document.getElementById('closeStashButton');
    if (closeBtn && !closeBtn.dataset.listenerBound) {
        closeBtn.addEventListener('click', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            stashModalEl.classList.add('hidden');
        });
        closeBtn.dataset.listenerBound = 'true';
    }

    stashModalEl.dataset.listenersBound = 'true';
}

// --- END OF FILE stash.js ---
