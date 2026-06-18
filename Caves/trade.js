// --- START OF FILE trade.js ---

// ==========================================
// TRADE & ECONOMY SYSTEM
// ==========================================

// O(1) Item Lookup Cache for Trading
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

// --- Centralized Value Dictionary ---
// For items that aren't natively sold in shops but have high intrinsic value to traders.
window.BASE_ITEM_VALUES = window.BASE_ITEM_VALUES || {
    // Relics & Artifacts
    'Shattered Crown': 200, 'Signet Ring': 80, 'Pouch of Gold Dust': 50, 
    'Ancient Coin': 25, 'Alpha Pelt': 60, 'Rainbow Shell': 100, 
    'Golden Pocket Watch': 120, 'Jade Idol': 90, 'Black Pearl': 250,
    'Heart of the Forest': 300, 'Kraken Ink Sac': 150, 'Ancient Vase': 75,
    'Stone Head': 60, 'Fossilized Bone': 40, 'Drowned Skull': 30, 'Rusted Helm': 15,
    
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
    'Astral Jelly': 80, 'Void Ray': 150, 'Star-Eater': 500, // Void Fish

    // High-Tier Tools & Magic
    'Diamond Tipped Pickaxe': 300, 'Cloudseed': 500, 'Void Astrolabe': 750
};

/**
 * High-performance helper to calculate the exact sell price of any item.
 * Evaluates Charisma, Lore Bonuses, Regional Demand, and Economy Caps.
 */
function calculateItemValue(item, player) {
    // 1. Try to find the item in the current shop to get its native buy price
    let shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

    // Fallback: Check Template ID match (for modified/magic items)
    if (!shopItem && item.templateId && window.ITEM_DATA && window.ITEM_DATA[item.templateId]) {
        const baseName = window.ITEM_DATA[item.templateId].name;
        shopItem = activeShopInventory.find(sItem => sItem.name === baseName);
    }

    // Fallback: Check string suffix (e.g. "Sharp Steel Sword" -> "Steel Sword")
    if (!shopItem) {
        shopItem = activeShopInventory.find(sItem => item.name.endsWith(sItem.name));
    }

    // 2. Establish Base Price
    let basePrice = 2; // Absolute lowest default
    
    if (shopItem) {
        basePrice = shopItem.price;
        // Bonus value if the item has magical affixes (Prefix/Suffix)
        if (item.name !== shopItem.name) {
            basePrice = Math.floor(basePrice * 1.5);
        }
    } else {
        // Look up against our central dictionary
        let lookupName = item.name;
        if (item.templateId && window.ITEM_DATA && window.ITEM_DATA[item.templateId]) {
            lookupName = window.ITEM_DATA[item.templateId].name;
        }
        if (window.BASE_ITEM_VALUES[lookupName]) basePrice = window.BASE_ITEM_VALUES[lookupName];
        else if (window.BASE_ITEM_VALUES[item.name]) basePrice = window.BASE_ITEM_VALUES[item.name];
    }

    // 3. Calculate Modifiers
    const regionMult = getRegionalPriceMultiplier(item.type, item.name);
    const sellBonusPercent = player.charisma * 0.005;
    const finalSellBonus = Math.min(sellBonusPercent, 0.25); // Max 25% boost from Charisma

    const SELL_MODIFIER = 0.5; // Base 50% markdown when selling to shops
    let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

    // 4. Economy Caps (Prevent infinite money loops)
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
        // General cap for non-shop items
        const maxSellPrice = Math.floor(basePrice * 0.8);
        calculatedSellPrice = Math.min(calculatedSellPrice, maxSellPrice);
    }

    return { 
        sellPrice: Math.max(1, calculatedSellPrice), 
        basePrice: basePrice, 
        regionMult: regionMult 
    };
}

// QoL WIN: Added 'amount' parameter for stack buying!
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

    if (!existingStack && player.inventory.length >= (window.MAX_INVENTORY_SLOTS || 9)) {
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
        ParticleSystem.createFloatingText(player.x, player.y, `-${totalCost}g`, "#ef4444");
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

    if (existingStack && isStackable) {
        existingStack.quantity += buyQty;
    } else {
        player.inventory.push({
            templateId: itemKey,
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: buyQty,
            tile: itemTemplate.tile || itemKey || '?',
            damage: itemTemplate.damage || null,
            defense: itemTemplate.defense || null,
            slot: itemTemplate.slot || null,
            statBonuses: itemTemplate.statBonuses || null,
            effect: itemTemplate.effect || null,
            isEquipped: false
        });
    }

    if (typeof playerRef !== 'undefined') {
        playerRef.update({
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

    if (regionMult > 1.0) logMessage(`Market demand is high here! {green:(x${regionMult})}`);
    else if (regionMult < 1.0) logMessage(`Market flooded. Low demand. {red:(x${regionMult})}`);

    // Determine quantity to sell
    const qtyToSell = amount === 'all' ? itemToSell.quantity : 1;
    const totalValue = sellPrice * qtyToSell;

    // Process the transaction
    player.coins += totalValue;
    
    if (qtyToSell > 1) {
        logMessage(`You sold a stack of ${itemToSell.name} (x${qtyToSell}) for {gold:${totalValue} gold}.`);
    } else {
        logMessage(`You sold a ${itemToSell.name} for {gold:${totalValue} gold}.`);
    }
    
    // JUICE: Gold particles in the background
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createFloatingText(player.x, player.y, `+${totalValue}g`, "#facc15");
    }
    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

    // Remove from inventory
    itemToSell.quantity -= qtyToSell;
    if (itemToSell.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // Update database and UI
    if (typeof playerRef !== 'undefined') {
        playerRef.update({
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

    // Iterate backwards so we can remove items safely while looping
    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];

        // 1. CRITICAL: Skip equipped items
        if (item.isEquipped) continue;

        // 2. Filter: Only sell 'junk' (Loot/Fish) and 'trade' goods
        // ROBUSTNESS: Explicitly protect 'ingredient' and 'consumable' so they don't sell their crafting mats or potions!
        if (item.type === 'junk' || item.type === 'trade') {

            // Skip magically enhanced junk just in case (edge cases)
            if (item.statBonuses && Object.keys(item.statBonuses).length > 0) continue;

            // DRY OPTIMIZATION: Use our helper
            const { sellPrice } = calculateItemValue(item, player);

            // Execute Sale
            const totalValue = sellPrice * item.quantity;
            player.coins += totalValue;
            goldGained += totalValue;
            itemsSold += item.quantity;

            // Remove from inventory
            player.inventory.splice(i, 1);
        }
    }

    if (itemsSold > 0) {
        logMessage(`Mass Sold ${itemsSold} junk/trade items for {gold:${goldGained} gold}.`);
        
        // JUICE: Gold particles in the background
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(player.x, player.y, `+${goldGained}g`, "#facc15");
        }
        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

        // Save and Update UI
        if (typeof playerRef !== 'undefined') {
            playerRef.update({
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
    const shopBuyList = document.getElementById('shopBuyList');
    const shopSellList = document.getElementById('shopSellList');
    const shopPlayerCoins = document.getElementById('shopPlayerCoins');
    const shopTitle = document.getElementById('shopTitle');

    if (!shopBuyList || !shopSellList || !shopPlayerCoins) return;

    // 1. Clear old lists
    shopBuyList.innerHTML = '';
    shopSellList.innerHTML = '';

    // 2. Update player's gold
    shopPlayerCoins.innerHTML = `Your Gold: <span class="text-yellow-400">${gameState.player.coins}</span>`;

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

    // JUICE: Dynamic Shop Flavor Text
    if (shopTitle) {
        let flavor = "A traveling merchant.";
        if (gameState.currentRealm !== 0 && gameState.currentRealm) flavor = "I didn't expect to find a customer in this dimension.";
        else if (biome === 'Desert') flavor = "Water is worth its weight in gold here.";
        else if (biome === 'Deadlands') flavor = "I would trade my own soul for a sip of clean water.";
        else if (biome === 'Mountain') flavor = "I'll pay top coin for wood and food.";
        else if (biome === 'Swamp') flavor = "Antidotes are flying off the shelves.";
        else if (biome === 'Underworld') flavor = "I collect things the surface dwellers fear.";
        else if (biome === 'Sky Realm') flavor = "The air is thin, but the views are priceless.";
        else if (gameState.mapMode === 'castle') flavor = "Luxury goods and rare artifacts accepted.";
        
        shopTitle.innerHTML = `Merchant <span class="block text-xs font-normal text-gray-400 mt-1 italic tracking-normal font-sans">"${flavor}"</span>`;
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
        let actionsHtml = `<button data-buy-item="${item.name}" data-amount="1" style="transform: translateZ(0);" class="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded shadow-sm transition-transform active:scale-95 disabled:opacity-50">Buy 1</button>`;
        const isStackable = itemTemplate && ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(itemTemplate.type);
        
        if (isStackable && item.stock > 1) {
            actionsHtml += `<button data-buy-item="${item.name}" data-amount="all" style="transform: translateZ(0);" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 ml-2 text-xs">Max</button>`;
        }

        const outOfStockClass = item.stock <= 0 ? 'opacity-50 grayscale' : 'hover:border-green-500';

        const li = document.createElement('li');
        li.className = `shop-item transition-colors duration-150 ${outOfStockClass}`;
        li.innerHTML = `
            <div>
                <span class="shop-item-name">${item.name} <span class="text-xl">${itemTemplate?.tile || '?'}</span></span>
                <span class="shop-item-details font-bold ${priceColorClass}">Price: ${priceHtml} <span class="text-xs text-gray-500 font-normal">(Stock: ${item.stock})</span></span>
            </div>
            <div class="shop-item-actions flex items-center">
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
        shopSellList.innerHTML = '<li class="shop-item-details italic text-sm text-gray-500 border border-gray-700 p-2 rounded">Your inventory is empty.</li>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            // DRY OPTIMIZATION: Use our helper
            const { sellPrice, regionMult } = calculateItemValue(item, gameState.player);

            // JUICE WIN: Color-code the market demand so the player doesn't have to guess!
            let sellPriceColor = "text-yellow-500";
            let demandTag = "";
            if (regionMult > 1.0) {
                sellPriceColor = "text-green-400";
                demandTag = `<span class="text-[9px] bg-green-900 bg-opacity-40 text-green-400 px-1 rounded ml-1 uppercase border border-green-800">High Demand</span>`;
            } else if (regionMult < 1.0) {
                sellPriceColor = "text-red-400";
                demandTag = `<span class="text-[9px] bg-red-900 bg-opacity-40 text-red-400 px-1 rounded ml-1 uppercase border border-red-800">Low Demand</span>`;
            }

            const li = document.createElement('li');
            li.className = 'shop-item hover:border-blue-500 transition-colors duration-150';
            
            // UX WIN: Add a "Sell Stack" button if they have more than 1!
            let actionsHtml = `<button data-sell-index="${index}" data-amount="1" style="transform: translateZ(0);" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow-sm transition-transform active:scale-95 disabled:opacity-50" ${item.isEquipped ? 'disabled title="Unequip first"' : ''}>Sell 1</button>`;
            
            if (item.quantity > 1 && !item.isEquipped) {
                actionsHtml += `<button data-sell-index="${index}" data-amount="all" style="transform: translateZ(0);" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 ml-2 text-xs">All (${item.quantity})</button>`;
            } else if (item.isEquipped) {
                actionsHtml = `<span class="text-[10px] font-bold text-yellow-500 bg-black bg-opacity-30 px-2 py-1 rounded uppercase tracking-widest border border-yellow-800">Equipped</span>`;
            }

            li.innerHTML = `
                <div>
                    <span class="shop-item-name">${item.name} <span class="text-xs text-gray-400">x${item.quantity}</span></span>
                    <span class="shop-item-details font-bold ${sellPriceColor}">Sell for: ${sellPrice}g <span class="text-xs text-gray-500 font-normal">(ea)</span>${demandTag}</span>
                </div>
                <div class="shop-item-actions flex items-center">
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
        // UX WIN: Smart-disable the button if there is no junk to sell
        const hasJunk = gameState.player.inventory.some(i => !i.isEquipped && (i.type === 'junk' || i.type === 'trade'));
        const btnClass = hasJunk ? "bg-red-600 hover:bg-red-500 text-white cursor-pointer" : "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed border border-gray-700";

        sellHeader.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <span>Your Bag <span class="text-[10px] text-gray-400 font-normal ml-1">(${gameState.player.inventory.length}/${window.MAX_INVENTORY_SLOTS || 9})</span></span>
                <button id="sellAllBtn" style="transform: translateZ(0);" class="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded shadow-sm transition-transform active:scale-95 ${btnClass}" ${hasJunk ? '' : 'disabled'}>Sell All Junk</button>
            </div>
        `;
        // Ensure we assign the handler directly 
        document.getElementById('sellAllBtn').onclick = handleSellAllItems;
    }
}

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
        if (itemName === 'Clean Water' || itemName === 'Flask of Water' || itemName === 'Hardtack') multiplier = 2.0;
        if (itemName === 'Torch' || itemName === 'Campfire Kit') multiplier = 1.5;
    }

    // 2. DESERT: Pays huge for Water/Food/Herbs. Hates Sand/Cactus.
    if (biome === 'Desert') {
        if (itemName === 'Cactus Fruit') multiplier = 0.5; // Supply is high
        if (itemName === 'Wildberry' || itemName === 'Healing Potion') multiplier = 2.0; // Demand is high
        if (itemName === 'Obsidian Shard') multiplier = 1.5;
    }
    
    // 3. DEADLANDS & UNDERWORLD: Will pay extraordinary sums for basic survival gear!
    if (biome === 'Deadlands' || isUnderworld) {
        if (itemName === 'Clean Water' || itemName === 'Flask of Water' || itemName === 'Healing Potion') multiplier = 2.5; 
        if (itemName === 'Torch' || itemName === 'Ever-Burning Candle' || itemName === 'Campfire Kit') multiplier = 2.0;
        if (itemName === 'Void Dust' || itemName === 'Demon Horn') multiplier = 0.8; // Common drops here
    }

    // 4. MOUNTAIN & VOLCANO: Pays for Wood/Food. Hates Ore/Stone.
    if (biome === 'Mountain' || (isDungeon && gameState.currentCaveTheme === 'ROCK') || (isDungeon && gameState.currentCaveTheme === 'FIRE')) {
        if (itemName === 'Iron Ore' || itemName === 'Stone' || itemName === 'Obsidian Shard') multiplier = 0.5;
        if (itemName === 'Stick' || itemName === 'Wood Log' || itemName === 'Machete') multiplier = 1.5;
    }

    // 5. FOREST/SWAMP: Pays for Metal/Tech. Hates Wood/Herbs.
    if (biome === 'Forest' || biome === 'Swamp') {
        if (itemName === 'Medicinal Herb' || itemName === 'Stick' || itemName === 'Wood Log') multiplier = 0.5;
        if (itemName === 'Iron Ore' || itemName === 'Steel Sword') multiplier = 1.3;
        if (itemName === 'Antidote') multiplier = 2.0; // High demand in swamps!
    }

    // 6. CASTLES/VILLAGES: Pay extra for Luxury, Relics, and Exotic Fish
    if (isCastle || biome === 'Safe Haven') {
        if (itemType === 'junk' || itemType === 'quest' || itemType === 'trade') multiplier = 1.2; 
        if (itemName === 'Shattered Crown' || itemName === 'Signet Ring') multiplier = 1.5;
        if (['Golden Koi', 'Black Pearl', 'Rainbow Shell', 'Abyssal Oyster', 'Astral Jelly', 'Void Ray'].includes(itemName)) multiplier = 1.3;
    }

    return multiplier;
}

// --- FIX SHOP LISTENER DELEGATION ---
// We need to intercept the newly added 'data-amount' parameter for the Sell Stack feature
function initShopListeners() {
    const shopBuyList = document.getElementById('shopBuyList');
    const shopSellList = document.getElementById('shopSellList');
    const closeShopButton = document.getElementById('closeShopButton');

    if (closeShopButton) {
        closeShopButton.addEventListener('click', () => {
            const shopModal = document.getElementById('shopModal');
            if (shopModal) shopModal.classList.add('hidden');
        });
    }

    if (shopBuyList) {
        // Remove existing listener to prevent duplicates
        const newBuyList = shopBuyList.cloneNode(false);
        shopBuyList.parentNode.replaceChild(newBuyList, shopBuyList);
        
        newBuyList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-buy-item]');
            if (btn) {
                const amount = btn.dataset.amount || 1;
                handleBuyItem(btn.dataset.buyItem, amount);
            }
        });
    }

    if (shopSellList) {
        // Remove existing listener to prevent duplicates
        const newSellList = shopSellList.cloneNode(false);
        shopSellList.parentNode.replaceChild(newSellList, shopSellList);
        
        newSellList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-sell-index]');
            if (btn) {
                const amount = btn.dataset.amount || 1;
                handleSellItem(parseInt(btn.dataset.sellIndex, 10), amount);
            }
        });
    }
}

// --- END OF FILE trade.js ---
