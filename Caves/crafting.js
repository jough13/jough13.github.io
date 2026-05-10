/**
 * Handles the logic of crafting an item.
 * Consumes materials and adds the new item to inventory.
 * @param {string} recipeName - The name of the item to craft.
 */

function handleCraftItem(recipeName) {
    // 1. Check both lists to find the recipe data
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];

    if (!recipe) return;

    const player = gameState.player;
    const playerInventory = player.inventory;

    // 2. Check Level Requirement
    const playerCraftLevel = player.craftingLevel || 1;
    if (CRAFTING_RECIPES[recipeName] && playerCraftLevel < recipe.level) {
        logMessage(`You need Crafting Level ${recipe.level} to make this.`);
        return;
    }

    // 3. Verify Materials (Double check using our robust function)
    if (!checkHasMaterials(recipeName)) {
        logMessage("You are missing materials (or they are currently equipped).");
        return;
    }

    // Look up the resulting item template
    const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
    const itemTemplate = ITEM_DATA[outputItemKey];

    // Check Inventory Space
    // If it's stackable, check if we have a stack. If not, check for empty slot.
    const isStackable = itemTemplate.type === 'junk' || itemTemplate.type === 'consumable';
    const existingStack = playerInventory.find(item => item.name === itemTemplate.name);

    if (!existingStack || !isStackable) {
        if (playerInventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("Inventory full! Cannot craft.");
            return;
        }
    }

    // 4. Consume Materials
    for (const materialName in recipe.materials) {
        let remainingNeeded = recipe.materials[materialName];

        // Iterate backwards so we can safely remove items while looping
        for (let i = playerInventory.length - 1; i >= 0; i--) {
            if (remainingNeeded <= 0) break; // We have consumed enough of this material

            const item = playerInventory[i];

            // Only take from matching items that are NOT equipped
            if (item.name === materialName && !item.isEquipped) {
                // Take as much as we can from this stack, up to the remaining need
                const amountToTake = Math.min(item.quantity, remainingNeeded);

                item.quantity -= amountToTake;
                remainingNeeded -= amountToTake;

                // If stack is empty, remove it from inventory
                if (item.quantity <= 0) {
                    playerInventory.splice(i, 1);
                }
            }
        }
    }

    // 5. Add Crafted Item

    // --- Masterwork Logic (Only for Equipment) ---
    const levelDiff = playerCraftLevel - recipe.level;
    const masterworkChance = 0.10 + (levelDiff * 0.05);
    let isMasterwork = false;
    let craftedName = itemTemplate.name;
    let craftedStats = itemTemplate.statBonuses ? { ...itemTemplate.statBonuses } : {};

    if ((itemTemplate.type === 'weapon' || itemTemplate.type === 'armor') && Math.random() < masterworkChance) {
        isMasterwork = true;
        craftedName = `Masterwork ${itemTemplate.name}`;

        const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        craftedStats[randomStat] = (craftedStats[randomStat] || 0) + 1;

        if (itemTemplate.type === 'weapon') itemTemplate.damage = (itemTemplate.damage || 0) + 1;
        if (itemTemplate.type === 'armor') itemTemplate.defense = (itemTemplate.defense || 0) + 1;
    }

    // DETERMINE QUANTITY
// If it's a Masterwork, we usually just make 1, otherwise use recipe yield or default to 1
let craftQuantity = (isMasterwork) ? 1 : (recipe.yield || 1); 

// Add to Inventory
if (existingStack && isStackable && !isMasterwork) {
    existingStack.quantity += craftQuantity; // CHANGED FROM ++
} else {
    // --- 1. Calculate Stats Locally ---
    // We calculate these values here instead of modifying itemTemplate directly.
    const finalDamage = (isMasterwork && itemTemplate.type === 'weapon') 
        ? (itemTemplate.damage || 0) + 1 
        : (itemTemplate.damage || null);

    const finalDefense = (isMasterwork && itemTemplate.type === 'armor') 
        ? (itemTemplate.defense || 0) + 1 
        : (itemTemplate.defense || null);

    // --- 2. Create the Item Object ---
    const newItem = {
        templateId: outputItemKey,  // CRITICAL: This is the anchor for rehydration
        name: craftedName,
        type: itemTemplate.type,
        quantity: craftQuantity,
        tile: outputItemKey || '?',
        
        // Use our safe local variables
        damage: finalDamage, 
        defense: finalDefense,
        
        slot: itemTemplate.slot || null,
        statBonuses: Object.keys(craftedStats).length > 0 ? craftedStats : null,
        
        // We include 'effect' here so the item is usable IMMEDIATELY in this session.
        // The getSanitizedInventory() function will strip this out before saving to DB.
        effect: itemTemplate.effect || null,
        
        isEquipped: false
    };
    playerInventory.push(newItem);
}

if (isMasterwork) {
        logMessage(`Critical Success! You crafted a ${craftedName}!`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
    } else {
        const qtyStr = craftQuantity > 1 ? ` (x${craftQuantity})` : '';
        logMessage(`You crafted/cooked: ${recipeName}${qtyStr}.`);
    }

    // 6. Grant XP
    const xpGain = recipe.xp || 10;
    player.craftingXp = (player.craftingXp || 0) + xpGain;
    player.craftingXpToNext = player.craftingXpToNext || 50;

    logMessage(`+${xpGain} Crafting XP`);

    if (player.craftingXp >= player.craftingXpToNext) {
        player.craftingXp -= player.craftingXpToNext;
        player.craftingLevel++;
        player.craftingXpToNext = Math.floor(player.craftingXpToNext * 1.5);
        logMessage(`CRAFTING LEVEL UP! You are now Artisan Level ${player.craftingLevel}.`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-blue');
    }

    // 7. Update Database & UI
    playerRef.update({
        inventory: getSanitizedInventory(),
        craftingLevel: player.craftingLevel,
        craftingXp: player.craftingXp,
        craftingXpToNext: player.craftingXpToNext
    });

    renderCraftingModal();
    renderInventory();
}

function openCraftingModal(mode = 'workbench') {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
    gameState.currentCraftingMode = mode;

    // Update Title based on mode
    const title = document.querySelector('#craftingModal h2');
    if (mode === 'cooking') {
        title.textContent = "Cooking Pot";
    } else {
        title.textContent = "Crafting Workbench";
    }

    renderCraftingModal();
    craftingModal.classList.remove('hidden');
}

/**
 * Checks if the player has the required materials for a recipe.
 * @param {string} recipeName - The name of the item to craft.
 * @returns {boolean} - True if the player has all materials, false otherwise.
 */

function checkHasMaterials(recipeName) {
    // Check both crafting and cooking lists
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return false;

    const playerInventory = gameState.player.inventory;

    // Check every material in the recipe
    for (const materialName in recipe.materials) {
        const requiredQuantity = recipe.materials[materialName];

        // Count TOTAL amount of this material across all UNEQUIPPED stacks
        const totalAmount = playerInventory.reduce((sum, item) => {
            // Only count items that match the name AND are NOT equipped
            if (item.name === materialName && !item.isEquipped) {
                return sum + item.quantity;
            }
            return sum;
        }, 0);

        // If the total across all stacks is less than required, we can't craft
        if (totalAmount < requiredQuantity) {
            return false;
        }
    }

    return true;
}

/**
 * Renders the list of all available crafting recipes
 * and checks which ones the player can craft.
 */

function renderCraftingModal() {
    craftingRecipeList.innerHTML = '';
    const playerInventory = gameState.player.inventory;

    // Select the correct recipe list
    let activeRecipes = {};
    let playerLevel = 1;

    if (gameState.currentCraftingMode === 'cooking') {
        activeRecipes = COOKING_RECIPES;
        playerLevel = 1; // Everyone can cook level 1 stuff for now
        // Or use wisdom? Let's just allow all cooking for simplicity.
    } else {
        activeRecipes = CRAFTING_RECIPES;
        playerLevel = gameState.player.craftingLevel || 1;
    }

    for (const recipeName in activeRecipes) {
        const recipe = activeRecipes[recipeName];

        // --- CHECK MATERIALS (Reused Logic) ---
        let canCraft = true;
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            if (!itemInInventory || itemInInventory.quantity < requiredQuantity) {
                canCraft = false;
            }
        }

        const levelMet = playerLevel >= recipe.level;

        // Find the tile
        const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
        const outputItemTile = outputItemKey || '?';

        // Build Material List
        let materialsHtml = '<ul class="crafting-item-materials">';
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            const currentQuantity = itemInInventory ? itemInInventory.quantity : 0;
            const quantityClass = currentQuantity < requiredQuantity ? 'text-red-500' : '';
            materialsHtml += `<li class="${quantityClass}">${materialName} (${currentQuantity}/${requiredQuantity})</li>`;
        }
        materialsHtml += '</ul>';

        // Build Info Line
        let infoHtml = '';
        if (gameState.currentCraftingMode === 'workbench') {
            let levelClass = levelMet ? 'text-green-600' : 'text-red-500 font-bold';
            infoHtml = `<div class="text-xs mt-1 ${levelClass}">Requires Crafting Lvl ${recipe.level} (Reward: ${recipe.xp} XP)</div>`;
        } else {
            // Cooking doesn't have levels yet, just XP
            infoHtml = `<div class="text-xs mt-1 text-green-600">Delicious! (Reward: ${recipe.xp} XP)</div>`;
        }

        const li = document.createElement('li');
        li.className = 'crafting-item';
        li.innerHTML = `
            <div>
                <span class="crafting-item-name">${recipeName} (${outputItemTile})</span>
                ${materialsHtml}
                ${infoHtml}
            </div>
            <div class="crafting-item-actions">
                <button data-craft-item="${recipeName}" ${canCraft && levelMet ? '' : 'disabled'}>${gameState.currentCraftingMode === 'cooking' ? 'Cook' : 'Craft'}</button>
            </div>
        `;
        craftingRecipeList.appendChild(li);
    }
}
