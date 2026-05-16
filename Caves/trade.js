function handleBuyItem(itemName) {
    const player = gameState.player;
    const shopItem = activeShopInventory.find(item => item.name === itemName);
    const itemTemplate = ITEM_DATA[Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName)];

    if (!shopItem || !itemTemplate) {
        logMessage("Error: Item not found in shop.");
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
    const finalBuyPrice = Math.floor(basePrice * (1.0 - finalDiscount));

    // 1. Check if player has enough gold
    if (player.coins < finalBuyPrice) {
        logMessage("You don't have enough gold for that.");
        return;
    }

    if (shopItem.stock <= 0) {
        logMessage("The shop is out of stock!");
        return;
    }

    // 2. Check if player has inventory space
    const existingStack = player.inventory.find(item => item.name === itemName);
    if (!existingStack && player.inventory.length >= MAX_INVENTORY_SLOTS) {
        logMessage("Your inventory is full!");
        return;
    }

    // 3. Process the transaction
    player.coins -= finalBuyPrice;
    shopItem.stock--;
    logMessage(`You bought a ${itemName} for ${finalBuyPrice} gold.`); // <-- Use new variable

    if (existingStack) {
        if (existingStack.quantity >= 99) {
            logMessage("You cannot carry any more of that item.");
            return;
        }
        existingStack.quantity++;
    } else {

        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName);

        player.inventory.push({

            templateId: itemKey,
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: 1,
            tile: itemKey || '?',
            effect: itemTemplate.effect || null
        });
    }

    // 4. Update database and UI
    playerRef.update({
        coins: player.coins,
        inventory: player.inventory
    });

    playerRef.update({
        coins: player.coins,
        inventory: getSanitizedInventory()
    });

    renderShop(); // Re-render the shop to show new gold and inventory
    renderInventory(); // Update the main UI inventory
    renderStats(); // Update the main UI gold display
}

function handleSellItem(itemIndex) {
    const player = gameState.player;
        if (itemIndex < 0 || itemIndex >= player.inventory.length) return;
    
    const itemToSell = player.inventory[itemIndex];
    if (!itemToSell) return; 

    if (itemToSell.isEquipped) {
        logMessage("You cannot sell an item you are wearing!");
        return;
    }

    if (!itemToSell) {
        logMessage("Error: Item not in inventory.");
        return;
    }

// Find the item's base price in the shop.
    const shopItem = activeShopInventory.find(i => i.name === itemToSell.name);
    
    // 1. Establish the Base Price
    let basePrice = 2; // Default
    if (shopItem) {
        basePrice = shopItem.price;
    } else {
        // --- SPECIAL PRICES FOR RELICS ---
        if (itemToSell.name === 'Shattered Crown') basePrice = 200;
        else if (itemToSell.name === 'Signet Ring') basePrice = 80;
        else if (itemToSell.name === 'Pouch of Gold Dust') basePrice = 50;
        else if (itemToSell.name === 'Ancient Coin') basePrice = 25;
        else if (itemToSell.name === 'Alpha Pelt') basePrice = 60;
    }

    // 2. Calculate Modifiers
    const regionMult = getRegionalPriceMultiplier(itemToSell.type, itemToSell.name);
    const sellBonusPercent = player.charisma * 0.005;
    const finalSellBonus = Math.min(sellBonusPercent, 0.25);

    // 3. Calculate Raw Sell Price
    let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

    // 4. --- Economy Caps ---
    if (shopItem) {
        // Calculate what the player would currently BUY this for
        let discountPercent = player.charisma * 0.005;
        if (player.completedLoreSets && player.completedLoreSets.includes('king_fall')) {
            discountPercent += 0.10;
        }
        const finalDiscount = Math.min(discountPercent, 0.50);
        const currentBuyPrice = Math.floor(shopItem.price * (1.0 - finalDiscount));

        // CAP: You can never sell an item for more than 80% of your current BUY price
        const absoluteMaxSell = Math.max(1, Math.floor(currentBuyPrice * 0.80));
        calculatedSellPrice = Math.min(calculatedSellPrice, absoluteMaxSell);
    } else {
        // General cap for non-shop items
        const maxSellPrice = Math.floor(basePrice * 0.8);
        calculatedSellPrice = Math.min(calculatedSellPrice, maxSellPrice);
    }

    const sellPrice = calculatedSellPrice;

    if (regionMult > 1.0) logMessage(`Market demand is high here! (x${regionMult})`);
    else if (regionMult < 1.0) logMessage(`Market flooded. Low demand. (x${regionMult})`);

    // 1. Process the transaction
    player.coins += sellPrice;
    logMessage(`You sold a ${itemToSell.name} for ${sellPrice} gold.`);

    // 2. Remove one from the stack
    itemToSell.quantity--;
    if (itemToSell.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // 3. Update database and UI
    playerRef.update({
        coins: player.coins,
        inventory: getSanitizedInventory()
    });

    renderShop();
    renderInventory();
    renderStats();
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

        // 2. Filter: Only sell 'junk' (Loot) and 'consumable' (Food/Potions)
        // We skip 'weapon', 'armor', 'tool', 'spellbook', etc. to be safe.
        if (item.type === 'junk' || item.type === 'consumable') {

            // --- Price Calculation Logic (Matches handleSellItem) ---
            // 1. Try exact match
            let shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

            // 2. Template ID Fallback
            if (!shopItem && item.templateId && ITEM_DATA[item.templateId]) {
                const baseName = ITEM_DATA[item.templateId].name;
                shopItem = activeShopInventory.find(sItem => sItem.name === baseName);
            }

            // 3. String Fallback
            if (!shopItem) {
                shopItem = activeShopInventory.find(sItem => item.name.endsWith(sItem.name));
            }
            let basePrice = 2;

            if (shopItem) {
                basePrice = shopItem.price;
                // Bonus for modified items
                if (item.name !== shopItem.name) {
                    basePrice = Math.floor(basePrice * 1.5);
                }
            } else {
                // Relic/Special Prices
                if (item.name === 'Shattered Crown') basePrice = 200;
                else if (item.name === 'Signet Ring') basePrice = 80;
                else if (item.name === 'Pouch of Gold Dust') basePrice = 50;
                else if (item.name === 'Ancient Coin') basePrice = 25;
                else if (item.name === 'Alpha Pelt') basePrice = 60;
            }

            const regionMult = getRegionalPriceMultiplier(item.type, item.name);
            const sellBonusPercent = player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.25);

            let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

            // Economy Cap logic
            if (shopItem) {
                let discountPercent = player.charisma * 0.005;
                if (player.completedLoreSets && player.completedLoreSets.includes('king_fall')) discountPercent += 0.10;
                const finalDiscount = Math.min(discountPercent, 0.50);
                const currentBuyPrice = Math.floor(shopItem.price * (1.0 - finalDiscount));

                const absoluteMaxSell = Math.max(1, Math.floor(currentBuyPrice * 0.80));
                calculatedSellPrice = Math.min(calculatedSellPrice, absoluteMaxSell);
            } else {
                const maxSellPrice = Math.floor(basePrice * 0.8);
                calculatedSellPrice = Math.min(calculatedSellPrice, maxSellPrice);
            }
            const sellPrice = calculatedSellPrice;

            // 3. Execute Sale
            const totalValue = sellPrice * item.quantity;
            player.coins += totalValue;
            goldGained += totalValue;
            itemsSold += item.quantity;

            // Remove from inventory
            player.inventory.splice(i, 1);
        }
    }

    if (itemsSold > 0) {
        logMessage(`Sold ${itemsSold} items for ${goldGained} gold.`);
        AudioSystem.playCoin();

        // Save and Update UI
        playerRef.update({
            coins: player.coins,
            inventory: getSanitizedInventory()
        });
        renderShop();
        renderInventory();
        renderStats();
    } else {
        logMessage("You have no unequipped junk or consumables to sell.");
    }
}

function renderShop() {
    // 1. Clear old lists
    shopBuyList.innerHTML = '';
    shopSellList.innerHTML = '';

    // 2. Update player's gold
    shopPlayerCoins.textContent = `Your Gold: ${gameState.player.coins}`;

    // 3. Populate "Buy" list
    activeShopInventory.forEach(item => {
        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === item.name);

        const baseBuyPrice = item.price;
        
        // 1. Charisma Discount (Max 25%)
        let discountPercent = gameState.player.charisma * 0.005;
        
        // 2. Codex Discount (+10% Flat)
        if (gameState.player.completedLoreSets && gameState.player.completedLoreSets.includes('king_fall')) {
            discountPercent += 0.10; 
        }

        // Cap Total Discount (e.g., max 50% off)
        const finalDiscount = Math.min(discountPercent, 0.5);
        const finalBuyPrice = Math.floor(baseBuyPrice * (1.0 - finalDiscount));

        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <div>
                <span class="shop-item-name">${item.name} (${itemKey || '?'})</span>
                <span class="shop-item-details">Price: ${finalBuyPrice}g</span>
            </div>
              <div class="shop-item-actions">
            <button data-buy-item="${item.name}">Buy 1</button> 
        </div>
    `;
        if (gameState.player.coins < finalBuyPrice) {
            li.querySelector('button').disabled = true;
        }
        shopBuyList.appendChild(li);
    });

    // 4. Populate "Sell" list
    if (gameState.player.inventory.length === 0) {
        shopSellList.innerHTML = '<li class="shop-item-details italic">Your inventory is empty.</li>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

            // 1. Determine Base Price
            let basePrice = 2; // Default
            if (shopItem) {
                basePrice = shopItem.price;
            } else {
                // Relic Prices (Must match handleSellItem logic!)
                if (item.name === 'Shattered Crown') basePrice = 200;
                else if (item.name === 'Signet Ring') basePrice = 80;
                else if (item.name === 'Pouch of Gold Dust') basePrice = 50;
                else if (item.name === 'Ancient Coin') basePrice = 25;
                else if (item.name === 'Alpha Pelt') basePrice = 60;
            }

            // 2. Calculate Bonuses
            const regionMult = getRegionalPriceMultiplier(item.type, item.name);
            const sellBonusPercent = gameState.player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.5);
            let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

            // 3. Apply the 80% Cap
            const maxSellPrice = Math.floor(basePrice * 0.8);
            const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;

            const li = document.createElement('li');
            li.className = 'shop-item';
            li.innerHTML = `
                <div>
                    <span class="shop-item-name">${item.name} (x${item.quantity})</span>
                    <span class="shop-item-details">Sell for: ${sellPrice}g</span>
                </div>
                <div class="shop-item-actions">
                    <button data-sell-index="${index}">Sell 1</button>
                </div>
            `;
            shopSellList.appendChild(li);
        });
    }

    // --- Inject Sell All Button into the Header ---
    const sellListContainer = shopSellList.parentElement;
    const header = sellListContainer.querySelector('h3');

    if (header) {
        // Only inject if we haven't already (prevents duplicates on re-render)
        if (!header.querySelector('#sellAllBtn')) {
            header.innerHTML = `
                <div class="flex justify-between items-center w-full">
                    <span>Your Inventory</span>
                    <button id="sellAllBtn" class="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors">Sell All Junk</button>
                </div>
            `;
            // Bind the click event
            document.getElementById('sellAllBtn').onclick = handleSellAllItems;
        }
    }
}

function getRegionalPriceMultiplier(itemType, itemName) {
    let multiplier = 1.0;

    // Get current biome info
    const isDungeon = gameState.mapMode === 'dungeon';
    const isCastle = gameState.mapMode === 'castle';

    // Default Overworld check
    let biome = 'Plains';
    if (!isDungeon && !isCastle) {
        const elev = elevationNoise.noise(gameState.player.x / 70, gameState.player.y / 70);
        const moist = moistureNoise.noise(gameState.player.x / 50, gameState.player.y / 50);
        if (elev < 0.35) biome = 'Water';
        else if (elev < 0.4 && moist > 0.7) biome = 'Swamp';
        else if (elev > 0.8) biome = 'Mountain';
        else if (elev > 0.6 && moist < 0.3) biome = 'Deadlands';
        else if (moist < 0.15) biome = 'Desert';
        else if (moist > 0.55) biome = 'Forest';
    }

    // --- SUPPLY & DEMAND LOGIC ---

    // 1. DESERT: Pays huge for Water/Food/Herbs. Hates Sand/Cactus.
    if (biome === 'Desert') {
        if (itemName === 'Cactus Fruit') multiplier = 0.5; // Supply is high
        if (itemName === 'Wildberry' || itemName === 'Healing Potion') multiplier = 2.0; // Demand is high
        if (itemName === 'Obsidian Shard') multiplier = 1.5;
    }

    // 2. MOUNTAIN: Pays for Wood/Food. Hates Ore/Stone.
    if (biome === 'Mountain' || (isDungeon && gameState.currentCaveTheme === 'ROCK')) {
        if (itemName === 'Iron Ore' || itemName === 'Stone') multiplier = 0.5;
        if (itemName === 'Stick' || itemName === 'Machete') multiplier = 1.5;
    }

    // 3. FOREST/SWAMP: Pays for Metal/Tech. Hates Wood/Herbs.
    if (biome === 'Forest' || biome === 'Swamp') {
        if (itemName === 'Medicinal Herb' || itemName === 'Stick') multiplier = 0.5;
        if (itemName === 'Iron Ore' || itemName === 'Steel Sword') multiplier = 1.3;
    }

    // 4. CASTLES: Pay extra for Luxury/Relics.
    if (isCastle) {
        if (itemType === 'junk' || itemType === 'quest') multiplier = 1.2; // Art/History
        if (itemName === 'Shattered Crown' || itemName === 'Signet Ring') multiplier = 1.5;
    }

    return multiplier;
}
