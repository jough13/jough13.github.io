// --- START OF FILE trade.js ---

// ==========================================
// TRADE & ECONOMY SYSTEM
// ==========================================

// PERFORMANCE WIN: O(1) Item Lookup Cache for Trading
// Prevents O(N) string-matching scans against the massive ITEM_DATA dictionary every time you buy an item.
// Attaching to window prevents hot-reload SyntaxErrors!
window._tradeItemKeyCache = window._tradeItemKeyCache || {};

function getTradeItemKey(name) {
    if (window._tradeItemKeyCache[name]) return window._tradeItemKeyCache[name];
    if (typeof window.ITEM_DATA === 'undefined') return null;
    const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
    if (key) window._tradeItemKeyCache[name] = key;
    return key;
}

// PERFORMANCE WIN: Cache DOM lookups for the shop UI
const _tradeDOMCache = {
    buyList: null,
    sellList: null,
    playerCoins: null,
    shopTitle: null,
    getBuyList: () => _tradeDOMCache.buyList || (document.getElementById('shopBuyList') && (_tradeDOMCache.buyList = document.getElementById('shopBuyList'))),
    getSellList: () => _tradeDOMCache.sellList || (document.getElementById('shopSellList') && (_tradeDOMCache.sellList = document.getElementById('shopSellList'))),
    getPlayerCoins: () => _tradeDOMCache.playerCoins || (document.getElementById('shopPlayerCoins') && (_tradeDOMCache.playerCoins = document.getElementById('shopPlayerCoins'))),
    getShopTitle: () => _tradeDOMCache.shopTitle || (document.getElementById('shopTitle') && (_tradeDOMCache.shopTitle = document.getElementById('shopTitle')))
};

// --- Centralized Value Dictionary ---
// For items that aren't natively sold in shops but have high intrinsic value to traders.
window.BASE_ITEM_VALUES = window.BASE_ITEM_VALUES || {
    // Relics & Artifacts
    'Shattered Crown': 200, 'Signet Ring': 80, 'Pouch of Gold Dust': 50, 
    'Ancient Coin': 25, 'Alpha Pelt': 60, 'Rainbow Shell': 100, 
    'Golden Pocket Watch': 120, 'Jade Idol': 90, 'Black Pearl': 250,
    'Heart of the Forest': 300, 'Kraken Ink Sac': 150, 'Ancient Vase': 75,
    'Stone Head': 60, 'Fossilized Bone': 40, 'Drowned Skull': 30, 'Rusted Helm': 15,
    'King\'s Sigil': 200, 'Petrified Egg': 150, 'Paradox Anomaly': 500,
    
    // Materials, Boss Drops & Rare Goods
    'Star-Metal Ore': 150, 'Obsidian Shard': 75, 'Void Dust': 40, 
    'Demon Horn': 100, 'Whale Bone': 80, 'Kraken Ink': 100, 'Basilisk Eye': 120,
    'Mithril Ore': 100, 'Dragon Scale': 150, 'Elemental Core': 100, 'Frost Essence': 80,

    // Fish & Sea Creatures
    'Golden Koi': 150, 'Deep Sea Cod': 10, 'Silver Tuna': 50, 
    'Magma Carp': 60, 'Sludge Eel': 15, 'Eyeless Cave Fish': 40, 
    'Swamp Serpent Scale': 200, 'Minnow': 1, 'River Trout': 4, 
    'Leaping Salmon': 15, 'Mudcat': 2, 'Abyssal Angler': 180, 'Swordfish': 60,
    'Abyssal Oyster': 45, 
    'Astral Jelly': 80, 'Void Ray': 150, 'Star-Eater': 500, 

    // High-Tier Tools & Magic
    'Diamond Tipped Pickaxe': 300, 'Cloudseed': 500, 'Void Astrolabe': 750,
    'Prime Tuning Fork': 350, 'Scroll of Homing': 75, 'Tattered Map': 50,
    
    // Crops & Homestead
    'Wood Log': 2, 'Stone': 1, 'Iron Ore': 4
};

/**
 * High-performance helper to calculate the exact sell price of any item.
 * Evaluates Charisma, Lore Bonuses, Regional Demand, and Economy Caps.
 */
function calculateItemValue(item, player) {
    // 1. Try to find the item in the current shop to get its native buy price
    let shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

    // BUG FIX & ROBUSTNESS: 
    // If we are trying to sell a magical/crafted item (e.g. "Masterwork Iron Sword"),
    // it won't perfectly match "Iron Sword" in the shop. We must fall back to its template!
    if (!shopItem && item.templateId && window.ITEM_DATA && window.ITEM_DATA[item.templateId]) {
        const baseName = window.ITEM_DATA[item.templateId].name;
        shopItem = activeShopInventory.find(sItem => sItem.name === baseName);
    }

    // 2. Establish Base Price
    let basePrice = 2; // Absolute lowest default
    
    if (shopItem) {
        basePrice = shopItem.price;
        // Bonus value if the item has magical affixes (Prefix/Suffix)
        if (item.name !== shopItem.name) {
            basePrice = Math.floor(basePrice * 1.5);
            // Further boost for Epic/Legendary gear
            if (item._rarity === 'epic') basePrice = Math.floor(basePrice * 1.5);
            if (item._rarity === 'legendary') basePrice = Math.floor(basePrice * 2.0);
        }
    } else {
        // Look up against our central dictionary
        let lookupName = item.name;
        if (item.templateId && window.ITEM_DATA && window.ITEM_DATA[item.templateId]) {
            lookupName = window.ITEM_DATA[item.templateId].name;
        }
        if (window.BASE_ITEM_VALUES[lookupName]) basePrice = window.BASE_ITEM_VALUES[lookupName];
        else if (window.BASE_ITEM_VALUES[item.name]) basePrice = window.BASE_ITEM_VALUES[item.name];
        
        // Apply magical multipliers to items not explicitly sold in shops (like Monster Drops)
        if (item._rarity === 'uncommon') basePrice = Math.floor(basePrice * 1.5);
        if (item._rarity === 'rare') basePrice = Math.floor(basePrice * 2.0);
        if (item._rarity === 'epic') basePrice = Math.floor(basePrice * 3.0);
        if (item._rarity === 'legendary') basePrice = Math.floor(basePrice * 5.0);
    }

    // 3. Calculate Modifiers
    const regionMult = getRegionalPriceMultiplier(item.type, item.name);
    const sellBonusPercent = player.charisma * 0.005;
    const finalSellBonus = Math.min(sellBonusPercent, 0.25); // Max 25% boost from Charisma

    const SELL_MODIFIER = 0.5; // Base 50% markdown when selling to shops
    let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

    // 4. Economy Caps (Prevent infinite money loops where you buy low and sell high instantly)
    if (shopItem) {
        // Calculate what the player would currently BUY this for right now
        let discountPercent = player.charisma * 0.005;
        if (player.completedLoreSets && player.completedLoreSets.includes('king_fall')) discountPercent += 0.10;
        const finalDiscount = Math.min(discountPercent, 0.50);
        const currentBuyPrice = Math.floor(shopItem.price * (1.0 - finalDiscount));

        // CAP: You can never sell an item for more than 80% of what you can buy it for!
        const absoluteMaxSell = Math.max(1, Math.floor(currentBuyPrice * 0.80));
        calculatedSellPrice = Math.min(calculatedSellPrice, absoluteMaxSell);
    } else {
        // General cap for non-shop items to prevent insane gold drops
        const maxSellPrice = Math.floor(basePrice * 1.5);
        calculatedSellPrice = Math.min(calculatedSellPrice, maxSellPrice);
    }

    return { 
        sellPrice: Math.max(1, calculatedSellPrice), 
        basePrice: basePrice, 
        regionMult: regionMult 
    };
}

function handleBuyItem(itemName, amount = 1) {
    const player = gameState.player;
    const shopItem = activeShopInventory.find(item => item.name === itemName);
    const itemKey = getTradeItemKey(itemName); // PERFORMANCE WIN: Cached lookup!
    const itemTemplate = window.ITEM_DATA ? window.ITEM_DATA[itemKey] : null;

    if (!shopItem || !itemTemplate) {
        logMessage("{red:Error: Item not found in shop.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    
    // --- PRICING LOGIC START --- 
    const basePrice = shopItem.price;
    
    // 1. Charisma
    let discountPercent = player.charisma * 0.005;

    // 2. Codex Bonus
    if (player.completedLoreSets && player.completedLoreSets.includes('king_fall')) {
        discountPercent += 0.10;
    }

    // 3. Final Calculation
    const finalDiscount = Math.min(discountPercent, 0.50);
    const finalBuyPrice = Math.max(1, Math.floor(basePrice * (1.0 - finalDiscount)));

    // --- BATCH CALCULATION ---
    let buyQty = 1;
    if (amount === 'all') {
        const affordableQty = Math.floor(player.coins / finalBuyPrice);
        buyQty = Math.min(shopItem.stock, affordableQty);
        if (buyQty <= 0) buyQty = 1; // Fallback to 1 to let the standard error messages trigger
    } else {
        buyQty = parseInt(amount) || 1;
    }

    // Checks
    const totalCost = finalBuyPrice * buyQty;
    if (player.coins < totalCost) {
        logMessage("{red:You don't have enough gold for that.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    if (shopItem.stock < buyQty) {
        logMessage("{red:The shop does not have enough stock!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const existingStack = player.inventory.find(item => item.name === itemName && !item.isEquipped);
    const isStackable = ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(itemTemplate.type);

    // BUG FIX: Accurate Capacity Checking
    // If the item stacks and we ALREADY have a stack, it won't consume a new inventory slot!
    const slotNeeded = (existingStack && isStackable) ? 0 : 1;
    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
    
    if (player.inventory.length + slotNeeded > invCap) {
        logMessage("{red:Your inventory is full!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // Process the transaction
    player.coins -= totalCost;
    shopItem.stock -= buyQty;
    
    if (buyQty > 1) {
        logMessage(`You bought a stack of ${itemName} (x${buyQty}) for {gold:${totalCost} gold}.`);
    } else {
        logMessage(`You bought a ${itemName} for {gold:${totalCost} gold}.`);
    }
    
    // JUICE: Gold particles in the background
    if (typeof ParticleSystem !== 'undefined') {
        // Larger explosion for bulk buys!
        const pSize = buyQty > 1 ? 15 : 5;
        ParticleSystem.createFloatingText(player.x, player.y, `-${totalCost}g`, "#ef4444");
        ParticleSystem.createExplosion(player.x, player.y, '#facc15', pSize);
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

    if (existingStack && isStackable) {
        existingStack.quantity += buyQty;
    } else {
        // ROBUSTNESS WIN: Safe Cloning to prevent reference mutation!
        // If we don't clone the arrays/objects inside the template, enchanting this item later
        // will permanently enchant the base template for all future shop purchases!
        player.inventory.push({
            templateId: itemKey,
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: buyQty,
            tile: itemTemplate.tile || itemKey || '?',
            damage: itemTemplate.damage || null,
            defense: itemTemplate.defense || null,
            slot: itemTemplate.slot || null,
            statBonuses: itemTemplate.statBonuses ? { ...itemTemplate.statBonuses } : null,
            tags: itemTemplate.tags ? [...itemTemplate.tags] : null,
            effect: itemTemplate.effect || null,
            _rarity: itemTemplate._rarity || null,
            isEquipped: false
        });
    }

    // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer instead of instantaneous save!
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({
            coins: player.coins,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
        });
    }

    renderShop(); 
    if (typeof renderInventory === 'function') renderInventory(); 
    if (typeof renderStats === 'function') renderStats(); 
}

function handleSellItem(itemIndex, amount = 1) {
    const player = gameState.player;
    if (itemIndex < 0 || itemIndex >= player.inventory.length) return;
    
    const itemToSell = player.inventory[itemIndex];
    if (!itemToSell) return; 

    if (itemToSell.isEquipped) {
        logMessage("{red:You cannot sell an item you are wearing!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const { sellPrice, basePrice, regionMult } = calculateItemValue(itemToSell, player);

    // UX WIN: Safety prompt for Magical/Valuable Gear!
    if ((itemToSell.statBonuses && Object.keys(itemToSell.statBonuses).length > 0) || basePrice >= 100) {
        if (!confirm(`Are you sure you want to sell your ${itemToSell.name}? This is a rare or highly valuable item.`)) {
            return; // Abort sale
        }
    }

    if (regionMult >= 2.0) logMessage(`{green:Incredible demand! The merchant practically begs for it!}`);
    else if (regionMult > 1.0) logMessage(`{green:Market demand is high here!}`);
    else if (regionMult <= 0.5) logMessage(`{red:The merchant sneers. Complete market oversaturation.}`);
    else if (regionMult < 1.0) logMessage(`{red:Market flooded. Low demand.}`);

    // Determine quantity to sell
    const qtyToSell = amount === 'all' ? itemToSell.quantity : 1;
    const totalValue = sellPrice * qtyToSell;

    // Process the transaction
    player.coins += totalValue;
    if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(totalValue);
    
    if (qtyToSell > 1) {
        logMessage(`You sold a stack of ${itemToSell.name} (x${qtyToSell}) for {gold:${totalValue} gold}.`);
    } else {
        logMessage(`You sold a ${itemToSell.name} for {gold:${totalValue} gold}.`);
    }
    
    // JUICE: Gold particles in the background
    if (typeof ParticleSystem !== 'undefined') {
        const pSize = qtyToSell > 1 ? 15 : 5;
        ParticleSystem.createFloatingText(player.x, player.y, `+${totalValue}g`, "#facc15");
        ParticleSystem.createExplosion(player.x, player.y, '#facc15', pSize);
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

    // Remove from inventory
    itemToSell.quantity -= qtyToSell;
    if (itemToSell.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer instead of instantaneous save!
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({
            coins: player.coins,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
        });
    }

    renderShop();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderStats === 'function') renderStats();
}

function handleSellAllItems() {
    const player = gameState.player;
    let itemsSold = 0;
    let goldGained = 0;

    // PERFORMANCE WIN: Replace manual `.splice()` looping with a clean `.filter()` block
    // Splice forces array re-indexing on every deletion, causing micro-stutters.
    
    const remainingInventory = [];

    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];

        // 1. Keep equipped items
        if (item.isEquipped) {
            remainingInventory.push(item);
            continue;
        }

        // 2. Filter: Only sell 'junk' (Loot/Fish) and 'trade' goods
        if (item.type === 'junk' || item.type === 'trade') {
            // BUG FIX: Strict exclusion for Anomaly and story items!
            if (item.name === 'Paradox Anomaly' || item.tags?.includes('anomaly')) {
                remainingInventory.push(item);
                continue;
            }

            // Skip magically enhanced junk
            if (item.statBonuses && Object.keys(item.statBonuses).length > 0) {
                remainingInventory.push(item);
                continue;
            }

            // Execute Sale
            const { sellPrice } = calculateItemValue(item, player);
            const totalValue = sellPrice * item.quantity;
            player.coins += totalValue;
            goldGained += totalValue;
            itemsSold += item.quantity;
            
            if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(totalValue);

        } else {
            // It's a potion, armor, weapon, tool, etc. Keep it!
            remainingInventory.push(item);
        }
    }

    if (itemsSold > 0) {
        // Swap arrays
        player.inventory = remainingInventory;
        
        logMessage(`Mass Sold ${itemsSold} junk/trade items for {gold:${goldGained} gold}.`);
        
        // JUICE: Massive Gold Explosion
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(player.x, player.y, `+${goldGained}g`, "#facc15");
            ParticleSystem.createExplosion(player.x, player.y, '#facc15', 30);
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

        // 🚨 FIREBASE OPTIMIZATION: Push to the debouncer instead of instantaneous save!
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({
                coins: player.coins,
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
            });
        }
        
        renderShop();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderStats === 'function') renderStats();
    } else {
        logMessage("{gray:You have no unequipped junk or trade goods to sell.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    }
}

function renderShop() {
    const shopBuyList = _tradeDOMCache.getBuyList();
    const shopSellList = _tradeDOMCache.getSellList();
    const shopPlayerCoins = _tradeDOMCache.getPlayerCoins();
    const shopTitle = _tradeDOMCache.getShopTitle();

    if (!shopBuyList || !shopSellList || !shopPlayerCoins) return;

    // 1. Clear old lists
    shopBuyList.innerHTML = '';
    shopSellList.innerHTML = '';

    // 2. Update player's gold
    shopPlayerCoins.innerHTML = `Your Gold: <span class="text-yellow-400 drop-shadow-sm">${gameState.player.coins}</span>`;

    // 3. Extract Biome context for dynamic flavor text
    let biome = 'Plains';
    if (gameState.mapMode === 'dungeon' && gameState.currentCaveTheme === 'ROCK') biome = 'Mountain';
    else if (gameState.mapMode === 'skyrealm') biome = 'Sky Realm';
    else if (gameState.mapMode === 'underworld') biome = 'Underworld';
    else if (gameState.mapMode === 'overworld') {
        const realmOffset = (gameState.currentRealm || 0) * 100;
        if (typeof elevationNoise !== 'undefined' && typeof moistureNoise !== 'undefined') {
            const elev = elevationNoise.noise(gameState.player.x / 70, gameState.player.y / 70, realmOffset);
            const moist = moistureNoise.noise(gameState.player.x / 50, gameState.player.y / 50, realmOffset);
            if (elev < 0.35) biome = 'Water';
            else if (elev < 0.4 && moist > 0.7) biome = 'Swamp';
            else if (elev > 0.8) biome = 'Mountain';
            else if (elev > 0.6 && moist < 0.3) biome = 'Deadlands';
            else if (moist < 0.15) biome = 'Desert';
            else if (moist > 0.55) biome = 'Forest';
        }
    }

    // LORE WIN: Dynamic Shop Flavor Quotes based on biome!
    if (shopTitle) {
        let flavors = ["A traveling merchant with weary eyes."];
        if (gameState.currentRealm !== 0 && gameState.currentRealm) flavors = [
            "I trade in secrets, soul-shards, and silence. But mostly secrets.",
            "I didn't expect to find a customer in this dimension.",
            "Everything has a price here. Even your memories."
        ];
        else if (biome === 'Desert') flavors = [
            "Water is worth its weight in gold here.",
            "The sand gets into everything. Even the coin purses."
        ];
        else if (biome === 'Deadlands') flavors = [
            "I would trade my own soul for a sip of clean water.",
            "Do not linger here. The ash remembers the living."
        ];
        else if (biome === 'Mountain') flavors = [
            "I'll pay top coin for wood and food.",
            "The climb is steep, but the profits are steeper."
        ];
        else if (biome === 'Swamp') flavors = [
            "Antidotes are flying off the shelves.",
            "Smells like rot, but it pays like gold."
        ];
        else if (biome === 'Underworld') flavors = [
            "I collect things the surface dwellers fear.",
            "Down here, the only currency that matters is survival."
        ];
        else if (biome === 'Sky Realm') flavors = [
            "The air is thin, but the views are priceless.",
            "I caught a cloud in a jar once. Tasted like mint."
        ];
        else if (gameState.mapMode === 'castle') flavors = [
            "Luxury goods and rare artifacts accepted.",
            "The guards take their cut, but the trade is safe.",
            "I've got apples for your horse... or raw meat for your wolf, if you ride one."
        ];
        
        const selectedFlavor = flavors[Math.floor(Math.random() * flavors.length)];
        shopTitle.innerHTML = `Merchant <span class="block text-xs font-normal text-gray-400 mt-1 italic tracking-normal font-serif">"${selectedFlavor}"</span>`;
    }

    // PERFORMANCE: Use DocumentFragments
    const buyFrag = document.createDocumentFragment();
    const sellFrag = document.createDocumentFragment();

    // 4. Populate "Buy" list
    activeShopInventory.forEach(item => {
        const itemKey = getTradeItemKey(item.name);
        const baseBuyPrice = item.price;
        const itemTemplate = window.ITEM_DATA ? window.ITEM_DATA[itemKey] : null;
        
        // Discounts
        let discountPercent = gameState.player.charisma * 0.005;
        if (gameState.player.completedLoreSets && gameState.player.completedLoreSets.includes('king_fall')) {
            discountPercent += 0.10; 
        }
        const finalDiscount = Math.min(discountPercent, 0.5);
        const finalBuyPrice = Math.max(1, Math.floor(baseBuyPrice * (1.0 - finalDiscount)));

        // UX WIN: Visually highlight the discount in green
        let priceHtml = `${finalBuyPrice}g`;
        if (finalBuyPrice < baseBuyPrice) {
            priceHtml = `<del class="text-gray-500 text-xs mr-1 font-normal">${baseBuyPrice}g</del><span class="text-green-400">${finalBuyPrice}g</span>`;
        }

        // Color code the price if you can't afford it
        const canAffordItem = gameState.player.coins >= finalBuyPrice;
        const priceColorClass = canAffordItem ? 'text-yellow-500' : 'text-red-500';

        // QoL WIN: Buy Max Button for Stackables
        let actionsHtml = `<button data-buy-item="${item.name}" data-amount="1" style="transform: translateZ(0);" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded shadow-sm transition-transform active:scale-95 disabled:opacity-50 font-bold">Buy 1</button>`;
        const isStackable = itemTemplate && ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(itemTemplate.type);
        
        if (isStackable && item.stock > 1) {
            actionsHtml += `<button data-buy-item="${item.name}" data-amount="all" style="transform: translateZ(0);" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 ml-2 text-xs font-bold">Max</button>`;
        }

        const outOfStockClass = item.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-green-500 hover:-translate-y-0.5 hover:shadow-md';

        const li = document.createElement('li');
        li.className = `shop-item transition-all duration-150 bg-gray-900 bg-opacity-40 border border-gray-700 rounded-lg p-3 ${outOfStockClass}`;
        li.innerHTML = `
            <div>
                <span class="shop-item-name font-bold text-lg text-gray-200">${item.name} <span class="text-2xl drop-shadow-md align-middle">${itemTemplate?.tile || '?'}</span></span>
                <span class="shop-item-details font-bold block mt-1 ${priceColorClass}">Price: ${priceHtml} <span class="text-xs text-gray-500 font-normal ml-2 bg-black bg-opacity-30 px-1 rounded border border-gray-700">(Stock: ${item.stock})</span></span>
            </div>
            <div class="shop-item-actions flex items-center ml-2">
                ${actionsHtml}
            </div>
        `;

        if (!canAffordItem || item.stock <= 0) {
            const btns = li.querySelectorAll('button');
            btns.forEach(b => b.disabled = true);
        }
        buyFrag.appendChild(li);
    });

    // 5. Populate "Sell" list
    if (gameState.player.inventory.length === 0) {
        shopSellList.innerHTML = '<li class="shop-item-details italic text-sm text-gray-500 border border-gray-700 p-4 rounded-lg bg-black bg-opacity-20 text-center shadow-inner font-serif">Your pockets hold only dust.</li>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            // DRY OPTIMIZATION: Use our helper
            const { sellPrice, regionMult } = calculateItemValue(item, gameState.player);

            // LORE & JUICE WIN: Color-code the market demand so the player doesn't have to guess!
            let sellPriceColor = "text-yellow-500";
            let demandTag = "";
            if (regionMult > 1.0) {
                sellPriceColor = "text-green-400";
                demandTag = `<span class="text-[9px] bg-green-900 bg-opacity-40 text-green-400 px-1 rounded ml-2 uppercase border border-green-800 shadow-inner block mt-1 w-max animate-pulse">High Demand</span>`;
            } else if (regionMult < 1.0) {
                sellPriceColor = "text-red-400";
                demandTag = `<span class="text-[9px] bg-red-900 bg-opacity-40 text-red-400 px-1 rounded ml-2 uppercase border border-red-800 shadow-inner block mt-1 w-max opacity-80">Low Demand</span>`;
            }

            const li = document.createElement('li');
            li.className = 'shop-item hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 bg-gray-900 bg-opacity-40 border border-gray-700 rounded-lg p-3';
            
            // UX WIN: Add a "Sell Stack" button if they have more than 1!
            let actionsHtml = `<button data-sell-index="${index}" data-amount="1" style="transform: translateZ(0);" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow-sm transition-transform active:scale-95 disabled:opacity-50 font-bold" ${item.isEquipped ? 'disabled title="Unequip first"' : ''}>Sell 1</button>`;
            
            if (item.quantity > 1 && !item.isEquipped) {
                actionsHtml += `<button data-sell-index="${index}" data-amount="all" style="transform: translateZ(0);" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 ml-2 text-xs font-bold">All (${item.quantity})</button>`;
            } else if (item.isEquipped) {
                actionsHtml = `<span class="text-[10px] font-bold text-yellow-500 bg-black bg-opacity-40 px-2 py-1 rounded uppercase tracking-widest border border-yellow-800 shadow-inner">Equipped</span>`;
            }
            
            let nameColor = 'text-gray-200';
            if (item._rarity === 'uncommon') nameColor = 'text-green-400 font-bold';
            else if (item._rarity === 'rare') nameColor = 'text-purple-400 font-bold';
            else if (item._rarity === 'epic') nameColor = 'text-red-400 font-bold';
            else if (item._rarity === 'legendary') nameColor = 'text-yellow-400 font-bold';
            else if (item.statBonuses && Object.keys(item.statBonuses).length > 0) nameColor = 'text-fuchsia-400 font-bold';

            li.innerHTML = `
                <div class="flex-grow pr-2">
                    <span class="shop-item-name block mb-1 ${nameColor}">${item.tile || '🎒'} ${item.name} <span class="text-[10px] text-gray-400 bg-black bg-opacity-30 px-1 rounded border border-gray-700 ml-1">x${item.quantity}</span></span>
                    <span class="shop-item-details font-bold block ${sellPriceColor}">Sell for: ${sellPrice}g <span class="text-xs text-gray-500 font-normal">(ea)</span></span>
                    ${demandTag}
                </div>
                <div class="shop-item-actions flex items-center ml-2">
                    ${actionsHtml}
                </div>
            `;
            sellFrag.appendChild(li);
        });
    }

    shopBuyList.appendChild(buyFrag);
    shopSellList.appendChild(sellFrag);

    // --- Inject Dynamic Headers ---
    const sellListContainer = shopSellList.parentElement;
    const sellHeader = sellListContainer.querySelector('h3');

    if (sellHeader) {
        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
        
        // UX WIN: Smart-disable the button if there is no junk to sell
        const hasJunk = gameState.player.inventory.some(i => !i.isEquipped && (i.type === 'junk' || i.type === 'trade'));
        const btnClass = hasJunk ? "bg-red-700 hover:bg-red-600 text-white cursor-pointer shadow-md" : "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed border border-gray-700 shadow-inner";

        sellHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span>Your Bag <span class="text-[10px] text-gray-400 font-normal ml-1 bg-black bg-opacity-30 px-1 rounded border border-gray-700 shadow-inner">(${gameState.player.inventory.length}/${invCap})</span></span>
                <button id="sellAllBtn" style="transform: translateZ(0);" class="text-[10px] uppercase font-bold tracking-widest px-2 py-1.5 rounded transition-transform active:scale-95 ${btnClass}" ${hasJunk ? '' : 'disabled'}>Sell All Junk</button>
            </div>
        `;
    }
}

// LORE WIN: MASSIVELY EXPANDED SUPPLY/DEMAND LOGIC
function getRegionalPriceMultiplier(itemType, itemName) {
    let multiplier = 1.0;

    // Get current biome info
    const isDungeon = gameState.mapMode === 'dungeon';
    const isCastle = gameState.mapMode === 'castle';
    const isUnderworld = gameState.mapMode === 'underworld';
    const isAlternateRealm = (typeof gameState !== 'undefined' && gameState.currentRealm && gameState.currentRealm !== 0);

    // Default Overworld check
    let biome = 'Plains';
    if (!isDungeon && !isCastle && !isUnderworld && typeof elevationNoise !== 'undefined') {
        const realmOffset = isAlternateRealm ? gameState.currentRealm * 100 : 0;
        const elev = elevationNoise.noise(gameState.player.x / 70, gameState.player.y / 70, realmOffset);
        const moist = moistureNoise.noise(gameState.player.x / 50, gameState.player.y / 50, realmOffset);
        if (elev < 0.35) biome = 'Water';
        else if (elev < 0.4 && moist > 0.7) biome = 'Swamp';
        else if (elev > 0.8) biome = 'Mountain';
        else if (elev > 0.6 && moist < 0.3) biome = 'Deadlands';
        else if (moist < 0.15) biome = 'Desert';
        else if (moist > 0.55) biome = 'Forest';
    }

    // --- SUPPLY & DEMAND LOGIC ---

    // 1. MULTIVERSE / ALTERNATE DIMENSIONS: Survival items are priceless
    if (isAlternateRealm) {
        if (itemName === 'Clean Water' || itemName === 'Flask of Water' || itemName === 'Hardtack') multiplier = 3.0; // Tripled!
        if (itemName === 'Torch' || itemName === 'Campfire Kit') multiplier = 2.0;
        if (itemName === 'Void Dust' || itemName === 'Memory Shard') multiplier = 0.5; // Very common here
    }

    // 2. DESERT: Pays huge for Water/Food/Herbs. Hates Sand/Cactus.
    if (biome === 'Desert') {
        if (itemName === 'Cactus Fruit') multiplier = 0.5; // Supply is high
        if (itemName === 'Wildberry' || itemName === 'Healing Potion') multiplier = 2.0; // Demand is high
        if (itemName === 'Clean Water' || itemName === 'Flask of Water') multiplier = 2.5; 
        if (itemName === 'Obsidian Shard') multiplier = 1.5;
    }
    
    // 3. DEADLANDS & UNDERWORLD: Will pay extraordinary sums for basic survival gear!
    if (biome === 'Deadlands' || isUnderworld) {
        if (itemName === 'Clean Water' || itemName === 'Flask of Water' || itemName === 'Healing Potion') multiplier = 3.0; 
        if (itemName === 'Torch' || itemName === 'Ever-Burning Candle' || itemName === 'Campfire Kit') multiplier = 2.5;
        if (itemName === 'Void Dust' || itemName === 'Demon Horn' || itemName === 'Bone Shard') multiplier = 0.5; // Common drops here
        if (itemName === 'Wood Log') multiplier = 2.0; // No trees down here!
    }

    // 4. MOUNTAIN & VOLCANO: Pays for Wood/Food. Hates Ore/Stone.
    if (biome === 'Mountain' || (isDungeon && gameState.currentCaveTheme === 'ROCK') || (isDungeon && gameState.currentCaveTheme === 'FIRE')) {
        if (itemName === 'Iron Ore' || itemName === 'Stone' || itemName === 'Obsidian Shard' || itemName === 'Star-Metal Ore') multiplier = 0.5;
        if (itemName === 'Stick' || itemName === 'Wood Log' || itemName === 'Machete') multiplier = 2.0;
    }

    // 5. FOREST/SWAMP: Pays for Metal/Tech. Hates Wood/Herbs.
    if (biome === 'Forest' || biome === 'Swamp') {
        if (itemName === 'Medicinal Herb' || itemName === 'Stick' || itemName === 'Wood Log') multiplier = 0.5;
        if (itemName === 'Iron Ore' || itemName === 'Steel Sword') multiplier = 1.5;
        if (itemName === 'Antidote') multiplier = 2.5; // Extreme demand in swamps!
        if (itemName === 'Spider Silk') multiplier = 0.5;
    }

    // 6. CASTLES/VILLAGES: Pay extra for Luxury, Relics, and Exotic Fish
    if (isCastle || biome === 'Safe Haven') {
        if (itemType === 'junk' || itemType === 'quest' || itemType === 'trade') multiplier = 1.2; 
        if (itemName === 'Shattered Crown' || itemName === 'Signet Ring' || itemName === 'Golden Pocket Watch') multiplier = 2.0; // Doubled!
        if (['Golden Koi', 'Black Pearl', 'Rainbow Shell', 'Abyssal Oyster', 'Astral Jelly', 'Void Ray', 'Star-Eater'].includes(itemName)) multiplier = 1.5;
        // Villagers hate monster parts
        if (['Rat Tail', 'Bat Wing', 'Sludge Eel', 'Bone Shard', 'Dirty Water'].includes(itemName)) multiplier = 0.5;
    }

    return multiplier;
}

// ==========================================
// SECURITY & PERFORMANCE WIN: Event Delegation
// ==========================================
function initShopListeners() {
    const closeShopButton = document.getElementById('closeShopButton');
    const shopModalEl = document.getElementById('shopModal');

    if (closeShopButton && !closeShopButton.dataset.listenerBound) {
        closeShopButton.addEventListener('click', () => {
            if (shopModalEl) shopModalEl.classList.add('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        });
        closeShopButton.dataset.listenerBound = 'true';
    }

    if (shopModalEl && !shopModalEl.dataset.listenersBound) {
        shopModalEl.addEventListener('click', (e) => {
            
            // Buy Button
            const buyBtn = e.target.closest('button[data-buy-item]');
            if (buyBtn && !buyBtn.disabled) {
                handleBuyItem(buyBtn.dataset.buyItem, buyBtn.dataset.amount || 1);
                return;
            }

            // Sell Button
            const sellBtn = e.target.closest('button[data-sell-index]');
            if (sellBtn && !sellBtn.disabled) {
                handleSellItem(parseInt(sellBtn.dataset.sellIndex, 10), sellBtn.dataset.amount || 1);
                return;
            }

            // Sell All Junk Button
            const sellAllBtn = e.target.closest('#sellAllBtn');
            if (sellAllBtn && !sellAllBtn.disabled) {
                handleSellAllItems();
                return;
            }
        });
        
        shopModalEl.dataset.listenersBound = 'true';
    }
}

// --- END OF FILE trade.js ---
