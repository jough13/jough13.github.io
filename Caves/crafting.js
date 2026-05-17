/**
 * HIGH-PERFORMANCE HELPER: Tallies unequipped materials in a single pass.
 * Prevents O(N^3) nested loops when rendering the recipe list.
 */
function getAvailableMaterials(inventory) {
    const matCount = {};
    for (let i = 0; i < inventory.length; i++) {
        if (!inventory[i].isEquipped) {
            matCount[inventory[i].name] = (matCount[inventory[i].name] || 0) + inventory[i].quantity;
        }
    }
    return matCount;
}

/**
 * Calculates the maximum number of times a recipe can be crafted.
 */
function getMaxCraftable(recipeName, availableMats) {
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return 0;
    
    let max = Infinity;
    for (const mat in recipe.materials) {
        const req = recipe.materials[mat];
        const has = availableMats[mat] || 0;
        if (has < req) return 0;
        max = Math.min(max, Math.floor(has / req));
    }
    return max === Infinity ? 0 : max;
}

/**
 * Handles the logic of crafting an item.
 * @param {string} recipeName - The name of the item to craft.
 * @param {boolean} requestBatch - If true, crafts as many as possible (Stackables only).
 */
function handleCraftItem(recipeName, requestBatch = false) {
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return;

    const player = gameState.player;
    const playerCraftLevel = player.craftingLevel || 1;

    // 1. Check Level Requirement
    if (CRAFTING_RECIPES[recipeName] && playerCraftLevel < recipe.level) {
        logMessage(`You need Crafting Level ${recipe.level} to make this.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // 2. Verify Materials efficiently
    const availableMats = getAvailableMaterials(player.inventory);
    const maxCraftable = getMaxCraftable(recipeName, availableMats);

    if (maxCraftable <= 0) {
        logMessage("You are missing materials (or they are currently equipped).");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // 3. Determine Output Template
    const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
    const itemTemplate = ITEM_DATA[outputItemKey];
    
    // Safety check in case recipe points to an undefined item
    if (!itemTemplate) {
        console.error(`Recipe output missing in ITEM_DATA: ${recipeName}`);
        return;
    }

    const isStackable = ['junk', 'consumable', 'ammo', 'ingredient', 'trade'].includes(itemTemplate.type);

    // 4. Determine Batch Size
    // Prevent batching non-stackables (weapons/armor) to avoid masterwork RNG complexitites and inventory bloat
    const batchSize = (requestBatch && isStackable) ? maxCraftable : 1;

    // 5. Inventory Space Check
    const existingStack = player.inventory.find(item => item.name === itemTemplate.name && !item.isEquipped);
    const slotsNeeded = isStackable ? (existingStack ? 0 : 1) : batchSize;

    if (player.inventory.length + slotsNeeded > MAX_INVENTORY_SLOTS) {
        logMessage("Inventory full! Cannot craft.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // 6. Consume Materials (Backward loop for safe array mutation)
    for (const matName in recipe.materials) {
        let needed = recipe.materials[matName] * batchSize;
        for (let i = player.inventory.length - 1; i >= 0 && needed > 0; i--) {
            const item = player.inventory[i];
            
            if (item.name === matName && !item.isEquipped) {
                const take = Math.min(item.quantity, needed);
                item.quantity -= take;
                needed -= take;
                
                if (item.quantity <= 0) {
                    player.inventory.splice(i, 1);
                }
            }
        }
    }

    // 7. Generate Items
    let masterworksCrafted = 0;

    for (let i = 0; i < batchSize; i++) {
        // --- Masterwork Logic (Only for Equipment) ---
        const levelDiff = playerCraftLevel - recipe.level;
        const masterworkChance = 0.10 + (levelDiff * 0.05);
        let isMasterwork = false;
        
        let craftedName = itemTemplate.name;
        let craftedStats = itemTemplate.statBonuses ? { ...itemTemplate.statBonuses } : {};
        let finalDamage = itemTemplate.damage || null;
        let finalDefense = itemTemplate.defense || null;

        if ((itemTemplate.type === 'weapon' || itemTemplate.type === 'armor') && Math.random() < masterworkChance) {
            isMasterwork = true;
            masterworksCrafted++;
            craftedName = `Masterwork ${itemTemplate.name}`;

            const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
            const randomStat = stats[Math.floor(Math.random() * stats.length)];
            craftedStats[randomStat] = (craftedStats[randomStat] || 0) + 1;

            if (itemTemplate.type === 'weapon') finalDamage = (finalDamage || 0) + 1;
            if (itemTemplate.type === 'armor') finalDefense = (finalDefense || 0) + 1;
        }

        // Determine Quantity Yield per craft
        const craftYield = (isMasterwork) ? 1 : (recipe.yield || 1); 

        // Add to Inventory
        // (Re-evaluate existing stack inside the loop in case previous iterations created it)
        const curStack = player.inventory.find(item => item.name === craftedName && !item.isEquipped);

        if (curStack && isStackable && !isMasterwork) {
            curStack.quantity += craftYield; 
        } else {
            player.inventory.push({
                templateId: outputItemKey,
                name: craftedName,
                type: itemTemplate.type,
                quantity: craftYield,
                tile: outputItemKey || '?',
                damage: finalDamage, 
                defense: finalDefense,
                slot: itemTemplate.slot || null,
                statBonuses: Object.keys(craftedStats).length > 0 ? craftedStats : null,
                effect: itemTemplate.effect || null,
                isEquipped: false
            });
        }
    }

    // 8. Flavor & Juice Logging
    if (masterworksCrafted > 0) {
        logMessage(`{purple:Critical Success! You crafted ${masterworksCrafted}x ${itemTemplate.name}!}`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    } else {
        const totalYield = batchSize * (recipe.yield || 1);
        const qtyStr = totalYield > 1 ? ` (x${totalYield})` : '';
        logMessage(`You crafted/cooked: ${recipeName}${qtyStr}.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
    }

    // 9. Grant XP
    const xpGain = (recipe.xp || 10) * batchSize;
    player.craftingXp = (player.craftingXp || 0) + xpGain;
    player.craftingXpToNext = player.craftingXpToNext || 50;

    logMessage(`+${xpGain} Crafting XP`);

    while (player.craftingXp >= player.craftingXpToNext) {
        player.craftingXp -= player.craftingXpToNext;
        player.craftingLevel++;
        player.craftingXpToNext = Math.floor(player.craftingXpToNext * 1.5);
        
        logMessage(`{blue:CRAFTING LEVEL UP! You are now Artisan Level ${player.craftingLevel}.}`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-blue');
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    }

    // 10. Finalize & Save
    playerRef.update({
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory,
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

    const title = document.querySelector('#craftingModal h2');
    if (title) {
        title.textContent = mode === 'cooking' ? "Cooking Pot" : "Crafting Workbench";
    }

    renderCraftingModal();
    craftingModal.classList.remove('hidden');
}

/**
 * Renders the list of all available crafting recipes using DocumentFragment
 */
function renderCraftingModal() {
    craftingRecipeList.innerHTML = '';
    
    const player = gameState.player;
    // O(N) Material check pass
    const availableMats = getAvailableMaterials(player.inventory);

    let activeRecipes = gameState.currentCraftingMode === 'cooking' ? COOKING_RECIPES : CRAFTING_RECIPES;
    let playerLevel = gameState.currentCraftingMode === 'cooking' ? 1 : (player.craftingLevel || 1);

    // PERFORMANCE: Use DocumentFragment to batch DOM inserts
    const fragment = document.createDocumentFragment();

    for (const recipeName in activeRecipes) {
        const recipe = activeRecipes[recipeName];
        
        const maxCraftable = getMaxCraftable(recipeName, availableMats);
        const levelMet = playerLevel >= recipe.level;
        const canCraft = maxCraftable > 0 && levelMet;

        const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
        const outputItemTile = outputItemKey || '?';
        const itemTemplate = ITEM_DATA[outputItemKey] || {};
        
        const isStackable = ['junk', 'consumable', 'ammo', 'ingredient', 'trade'].includes(itemTemplate.type);

        // Build Material List HTML
        let materialsHtml = '<ul class="crafting-item-materials">';
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const currentQuantity = availableMats[materialName] || 0;
            const quantityClass = currentQuantity < requiredQuantity ? 'text-red-500' : 'text-green-500';
            materialsHtml += `<li class="text-xs ${quantityClass}">${materialName} (${currentQuantity}/${requiredQuantity})</li>`;
        }
        materialsHtml += '</ul>';

        // Build Info Line HTML
        let infoHtml = '';
        if (gameState.currentCraftingMode === 'workbench') {
            let levelClass = levelMet ? 'text-blue-400' : 'text-red-500 font-bold';
            infoHtml = `<div class="text-[10px] uppercase font-bold mt-1 ${levelClass}">Requires Lvl ${recipe.level} | Reward: ${recipe.xp} XP</div>`;
        } else {
            infoHtml = `<div class="text-[10px] uppercase font-bold mt-1 text-green-500">Delicious! | Reward: ${recipe.xp} XP</div>`;
        }

        // Build Action Buttons
        const actionText = gameState.currentCraftingMode === 'cooking' ? 'Cook' : 'Craft';
        let actionHtml = `<button data-craft-item="${recipeName}" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" ${canCraft ? '' : 'disabled'}>${actionText}</button>`;
        
        // Add "Craft All" Batch button if applicable
        if (isStackable && maxCraftable > 1 && levelMet) {
            actionHtml += `<button data-craft-all="${recipeName}" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded text-xs font-bold shadow transition-all active:scale-95 ml-2">All (${maxCraftable})</button>`;
        }

        const li = document.createElement('li');
        li.className = 'crafting-item hover:border-blue-500 transition-colors duration-150';
        li.innerHTML = `
            <div class="flex-grow">
                <span class="crafting-item-name font-bold text-lg">${recipeName} <span class="text-xl ml-1">${outputItemTile}</span></span>
                ${materialsHtml}
                ${infoHtml}
            </div>
            <div class="crafting-item-actions flex items-center ml-2">
                ${actionHtml}
            </div>
        `;
        fragment.appendChild(li);
    }
    
    craftingRecipeList.appendChild(fragment);
}

// Ensure the crafting listener routes both normal and batch buttons correctly
function initCraftingListeners() {
    const closeBtn = document.getElementById('closeCraftingButton');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('craftingModal').classList.add('hidden');
        });
    }

    const recipeList = document.getElementById('craftingRecipeList');
    if (recipeList) {
        recipeList.addEventListener('click', (e) => {
            const craftBtn = e.target.closest('button[data-craft-item]');
            const batchBtn = e.target.closest('button[data-craft-all]');
            
            if (craftBtn && !craftBtn.disabled) {
                handleCraftItem(craftBtn.dataset.craftItem, false);
            } else if (batchBtn && !batchBtn.disabled) {
                handleCraftItem(batchBtn.dataset.craftAll, true);
            }
        });
    }
}

// Call this once on load if needed, otherwise rely on main initialization logic
if (typeof areGlobalListenersInitialized !== 'undefined' && !areGlobalListenersInitialized) {
    initCraftingListeners();
}
