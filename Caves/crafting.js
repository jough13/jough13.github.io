// --- START OF FILE crafting.js ---

// ==========================================
// CRAFTING & COOKING SYSTEM
// ==========================================

// O(1) Item Lookup Cache for Crafting
// Prevents O(N) string-matching scans against the massive ITEM_DATA dictionary every render frame.
const _craftItemKeyCache = {};
function getCraftItemKey(name) {
    if (_craftItemKeyCache[name]) return _craftItemKeyCache[name];
    const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
    if (key) _craftItemKeyCache[name] = key;
    return key;
}

/**
 * HIGH-PERFORMANCE HELPER: Tallies unequipped materials in a single pass.
 * Prevents O(N^3) nested loops when rendering the recipe list.
 */
function getAvailableMaterials(inventory) {
    const matCount = {};
    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        if (!item.isEquipped) {
            matCount[item.name] = (matCount[item.name] || 0) + item.quantity;
        }
    }
    return matCount;
}

/**
 * Calculates the maximum number of times a recipe can be crafted,
 * capped by both available materials AND available inventory slots.
 */
function getMaxCraftable(recipeName, availableMats, currentInventoryLength, isStackable, hasExistingStack) {
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return 0;
    
    let max = Infinity;
    
    // 1. Check material bottlenecks
    for (const mat in recipe.materials) {
        const req = recipe.materials[mat];
        const has = availableMats[mat] || 0;
        if (has < req) return 0;
        max = Math.min(max, Math.floor(has / req));
    }
    
    if (max === Infinity || max <= 0) return 0;
    
    // 2. Check inventory constraints
    // If it stacks and we already have a stack, we can craft infinite (up to max materials)
    if (isStackable && hasExistingStack) return max;
    
    // If it stacks but we DON'T have a stack, we need exactly 1 empty slot
    // If it DOESN'T stack (weapons/armor), we need 1 empty slot per craft
    const emptySlots = (window.MAX_INVENTORY_SLOTS || 9) - currentInventoryLength;
    
    if (isStackable) {
        return emptySlots > 0 ? max : 0;
    } else {
        return Math.min(max, emptySlots);
    }
}

/**
 * Handles the logic of crafting an item.
 * @param {string} recipeName - The name of the item to craft.
 * @param {boolean} requestBatch - If true, crafts as many as possible.
 */
function handleCraftItem(recipeName, requestBatch = false) {
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return;

    const player = gameState.player;
    const playerCraftLevel = player.craftingLevel || 1;

    // 1. Check Level Requirement
    if (CRAFTING_RECIPES[recipeName] && playerCraftLevel < recipe.level) {
        logMessage(`{red:You need Crafting Level ${recipe.level} to make this.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const outputItemKey = getCraftItemKey(recipeName); // PERFORMANCE WIN
    const itemTemplate = ITEM_DATA[outputItemKey];
    
    if (!itemTemplate) {
        console.error(`Recipe output missing in ITEM_DATA: ${recipeName}`);
        return;
    }

    const isStackable = ['junk', 'consumable', 'ammo', 'ingredient', 'trade'].includes(itemTemplate.type);
    const existingStack = player.inventory.find(item => item.name === itemTemplate.name && !item.isEquipped);

    // 2. Verify Materials and Capacity
    const availableMats = getAvailableMaterials(player.inventory);
    const maxCraftable = getMaxCraftable(recipeName, availableMats, player.inventory.length, isStackable, !!existingStack);

    if (maxCraftable <= 0) {
        logMessage("{red:You are missing materials, or your inventory is full.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // 3. Determine Batch Size (Strict Integer Parsing)
    const batchSize = requestBatch ? Math.floor(maxCraftable) : 1;
    if (batchSize < 1) return;

    // 4. Consume Materials (Backward loop for safe array mutation)
    for (const matName in recipe.materials) {
        let needed = recipe.materials[matName] * batchSize;
        
        for (let i = player.inventory.length - 1; i >= 0; i--) {
            if (needed <= 0) break; // Optimization: Stop looping if we've taken enough
            
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

    // 5. Generate Items
    let masterworksCrafted = 0;
    const isCooking = (gameState.currentCraftingMode === 'cooking');
    let lastCraftedName = itemTemplate.name;

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
            lastCraftedName = craftedName; // Used for Juice logging later

            const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
            const randomStat = stats[Math.floor(Math.random() * stats.length)];
            craftedStats[randomStat] = (craftedStats[randomStat] || 0) + 1;

            if (itemTemplate.type === 'weapon') finalDamage = (finalDamage || 0) + 1;
            if (itemTemplate.type === 'armor') finalDefense = (finalDefense || 0) + 1;
        }

        // Determine Quantity Yield per craft
        const craftYield = (isMasterwork) ? 1 : (recipe.yield || 1); 

        // Add to Inventory
        // Re-evaluate existing stack inside the loop in case previous iterations created it
        const curStack = player.inventory.find(item => item.name === craftedName && !item.isEquipped);

        // Allow stacking of identical masterworks if the base type allows it (e.g. Masterwork Arrows)
        if (curStack && isStackable) {
            curStack.quantity += craftYield; 
        } else {
            // --- ANTI-CHEAT & EXPLOIT FIX ---
            // If the inventory fills up mid-batch (due to masterwork rolls splitting items), drop it safely!
            if (player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
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
            } else {
                const dropTile = itemTemplate.tile || '🎒';
                logMessage(`{red:Your pack is full! The ${craftedName} drops to the floor.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                
                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                    chunkManager.setWorldTile(player.x, player.y, dropTile, 2); // Drops for 2 hours
                } else if (gameState.mapMode === 'dungeon') {
                    chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = dropTile;
                } else if (gameState.mapMode === 'castle') {
                    chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = dropTile;
                }
                
                // Un-mark the tile as looted so they can pick it up immediately
                let tileId = (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') 
                    ? `${player.x},${-player.y}`
                    : `${gameState.currentCaveId || gameState.currentCastleId}:${player.x},${-player.y}`;
                gameState.lootedTiles.delete(tileId);
                
                gameState.mapDirty = true;
            }
        }
    }

    // 6. Flavor & Juice Logging
    const totalYield = batchSize * (recipe.yield || 1);
    
    // EXPANDABILITY WIN: Track lifetime metrics!
    if (!player.metrics) player.metrics = {};
    if (isCooking) player.metrics.potionsBrewed = (player.metrics.potionsBrewed || 0) + totalYield;
    else player.metrics.itemsCrafted = (player.metrics.itemsCrafted || 0) + totalYield;
    
    // JUICE WIN: Floating World Particles for Crafting!
    if (typeof ParticleSystem !== 'undefined') {
        const floatText = masterworksCrafted > 0 ? `+${masterworksCrafted} ${lastCraftedName}` : `+${totalYield} ${lastCraftedName}`;
        const floatColor = masterworksCrafted > 0 ? '#a855f7' : '#4ade80';
        ParticleSystem.createFloatingText(player.x, player.y, floatText, floatColor);
    }

    if (masterworksCrafted > 0) {
        logMessage(`{purple:Critical Success! You crafted ${masterworksCrafted}x ${itemTemplate.name}!}`);
        if (typeof triggerStatAnimation === 'function') triggerStatAnimation(document.getElementById('levelDisplay'), 'stat-pulse-purple');
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    } else {
        const qtyStr = totalYield > 1 ? ` (x${totalYield})` : '';
        logMessage(`You ${isCooking ? 'cooked' : 'crafted'}: ${recipeName}${qtyStr}.`);
        
        if (typeof AudioSystem !== 'undefined') {
            if (typeof AudioSystem.playCraftSuccess === 'function') {
                AudioSystem.playCraftSuccess(); 
            } else {
                if (batchSize > 1) AudioSystem.playMagic(); 
                else AudioSystem.playStep(); 
            }
        }
    }

    // 7. Grant XP
    const xpGain = (recipe.xp || 10) * batchSize;
    player.craftingXp = (player.craftingXp || 0) + xpGain;
    player.craftingXpToNext = player.craftingXpToNext || 50;

    logMessage(`{gray:+${xpGain} Crafting XP}`);

    while (player.craftingXp >= player.craftingXpToNext) {
        player.craftingXp -= player.craftingXpToNext;
        player.craftingLevel++;
        player.craftingXpToNext = Math.floor(player.craftingXpToNext * 1.5);
        
        logMessage(`{blue:CRAFTING LEVEL UP! You are now Artisan Level ${player.craftingLevel}.}`);
        if (typeof triggerStatAnimation === 'function') triggerStatAnimation(document.getElementById('levelDisplay'), 'stat-pulse-blue');
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    }

    // 8. Finalize & Save
    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update({
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory,
            craftingLevel: player.craftingLevel,
            craftingXp: player.craftingXp,
            craftingXpToNext: player.craftingXpToNext,
            metrics: player.metrics
        });
    }

    renderCraftingModal();
    if (typeof renderInventory === 'function') renderInventory();
    if (gameState.mapDirty && typeof render === 'function') render();
}

function openCraftingModal(mode = 'workbench') {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
    gameState.currentCraftingMode = mode;

    const title = document.querySelector('#craftingModal h2');
    if (title) {
        title.innerHTML = mode === 'cooking' 
            ? "Cooking Pot <span class='text-sm text-yellow-500 block font-normal mt-1'>Combine ingredients to survive the wilds.</span>" 
            : "Crafting Workbench <span class='text-sm text-green-500 block font-normal mt-1'>Forge weapons, weave armor, and build tools.</span>";
    }

    renderCraftingModal();
    const modal = document.getElementById('craftingModal');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Renders the list of all available crafting recipes using DocumentFragment
 * QoL UPGRADE: Now features Smart Sorting, Dynamic Inventory Badges, and Lore Lookups!
 */
function renderCraftingModal() {
    const craftingRecipeList = document.getElementById('craftingRecipeList');
    if (!craftingRecipeList) return;
    
    craftingRecipeList.innerHTML = '';
    
    const player = gameState.player;
    // O(N) Material check pass
    const availableMats = getAvailableMaterials(player.inventory);

    let activeRecipes = gameState.currentCraftingMode === 'cooking' ? COOKING_RECIPES : CRAFTING_RECIPES;
    let playerLevel = gameState.currentCraftingMode === 'cooking' ? 1 : (player.craftingLevel || 1);

    // 1. Process all recipes into an array so we can sort them!
    const recipeDataArray = Object.entries(activeRecipes).map(([recipeName, recipe]) => {
        const outputItemKey = getCraftItemKey(recipeName);
        const itemTemplate = ITEM_DATA[outputItemKey] || {};
        const isStackable = ['junk', 'consumable', 'ammo', 'ingredient', 'trade'].includes(itemTemplate.type);
        const existingStack = player.inventory.find(item => item.name === itemTemplate.name && !item.isEquipped);
        
        const maxCraftable = getMaxCraftable(recipeName, availableMats, player.inventory.length, isStackable, !!existingStack);
        const levelMet = playerLevel >= recipe.level;
        const canCraft = maxCraftable > 0 && levelMet;

        return {
            recipeName, recipe, outputItemKey, itemTemplate, existingStack, maxCraftable, levelMet, canCraft
        };
    });

    // 2. SMART SORTING: Craftable -> Uncraftable (Missing Mats) -> Uncraftable (Missing Level)
    recipeDataArray.sort((a, b) => {
        if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1;
        if (a.levelMet !== b.levelMet) return a.levelMet ? -1 : 1;
        return a.recipe.level - b.recipe.level; // Sort by level ascending
    });

    // 3. Render Phase
    // PERFORMANCE: Use DocumentFragment to batch DOM inserts
    const fragment = document.createDocumentFragment();

    recipeDataArray.forEach(data => {
        const { recipeName, recipe, outputItemKey, itemTemplate, existingStack, maxCraftable, levelMet, canCraft } = data;
        const outputItemTile = outputItemKey || '?';

        // LORE WIN: Lookup the base description of the item so players know what it does
        // Use our stripColorTags helper if it exists to keep the UI clean
        let baseDescription = itemTemplate.description || "A crafted item.";
        if (typeof stripColorTags === 'function') {
            baseDescription = stripColorTags(baseDescription);
        } else {
            baseDescription = baseDescription.replace(/\{[a-z]+:(.*?)\}/ig, '$1'); // Fallback regex
        }

        // Build Material List HTML
        let materialsHtml = '<ul class="crafting-item-materials mt-2 flex flex-wrap gap-2">';
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const currentQuantity = availableMats[materialName] || 0;
            const quantityClass = currentQuantity < requiredQuantity ? 'text-red-400 font-bold border-red-900 bg-red-900 bg-opacity-20' : 'text-gray-300 border-gray-700 bg-black bg-opacity-30';
            materialsHtml += `<li class="text-[10px] px-2 py-0.5 rounded border ${quantityClass}">${materialName} (${currentQuantity}/${requiredQuantity})</li>`;
        }
        materialsHtml += '</ul>';

        // JUICE WIN: Calculate and display Masterwork Chance
        let masterworkHtml = '';
        if (gameState.currentCraftingMode === 'workbench' && (itemTemplate.type === 'weapon' || itemTemplate.type === 'armor') && levelMet) {
            const levelDiff = playerLevel - recipe.level;
            const mwChance = Math.min(100, Math.floor((0.10 + (levelDiff * 0.05)) * 100));
            masterworkHtml = ` <span class="text-purple-400">| ${mwChance}% Masterwork</span>`;
        }

        // Build Info Line HTML
        let infoHtml = '';
        if (gameState.currentCraftingMode === 'workbench') {
            let levelClass = levelMet ? 'text-blue-400' : 'text-red-500 font-bold';
            infoHtml = `<div class="text-[10px] uppercase font-bold mt-2 ${levelClass} bg-black bg-opacity-20 inline-block px-2 py-1 rounded border border-gray-700">Requires Lvl ${recipe.level} | Reward: ${recipe.xp} XP${masterworkHtml}</div>`;
        } else {
            infoHtml = `<div class="text-[10px] uppercase font-bold mt-2 text-yellow-500 bg-black bg-opacity-20 inline-block px-2 py-1 rounded border border-gray-700">Delicious! | Reward: ${recipe.xp} XP</div>`;
        }

        // QoL WIN: Show how many you already own!
        const ownedCount = existingStack ? existingStack.quantity : 0;
        const ownedHtml = ownedCount > 0 ? `<span class="text-[9px] bg-gray-800 border border-gray-600 text-gray-300 px-1.5 py-0.5 rounded ml-2 font-bold uppercase tracking-widest">Owned: ${ownedCount}</span>` : '';

        // Build Action Buttons (Hardware Accelerated)
        const actionText = gameState.currentCraftingMode === 'cooking' ? 'Cook 1' : 'Craft 1';
        let actionHtml = `<button data-craft-item="${recipeName}" style="transform: translate3d(0,0,0);" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold" ${canCraft ? '' : 'disabled'}>${actionText}</button>`;
        
        // Add "Craft All" Batch button if applicable
        if (maxCraftable > 1 && levelMet) {
            actionHtml += `<button data-craft-all="${recipeName}" style="transform: translate3d(0,0,0);" class="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded shadow transition-transform active:scale-95 ml-2 font-bold text-xs flex flex-col items-center">
                <span>All</span>
                <span class="text-[10px] font-normal opacity-80">(x${maxCraftable})</span>
            </button>`;
        }

        // Dim uncraftable items slightly to draw the eye to available recipes
        const liOpacity = canCraft ? 'opacity-100' : 'opacity-60 hover:opacity-100';

        const li = document.createElement('li');
        li.className = `crafting-item bg-gray-900 bg-opacity-40 border border-gray-700 p-3 rounded-lg flex justify-between items-center mb-2 hover:border-green-500 transition-all ${liOpacity}`;
        li.innerHTML = `
            <div class="flex-grow pr-4">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-2xl" title="${itemTemplate.name || recipeName}">${outputItemTile}</span>
                    <span class="crafting-item-name font-bold text-lg text-green-400" style="font-family: 'Uncial Antiqua', cursive;">${recipeName}</span>
                    ${ownedHtml}
                </div>
                <div class="text-xs text-gray-400 italic leading-tight">${baseDescription}</div>
                ${materialsHtml}
                ${infoHtml}
            </div>
            <div class="crafting-item-actions flex items-stretch ml-2">
                ${actionHtml}
            </div>
        `;
        fragment.appendChild(li);
    });
    
    craftingRecipeList.appendChild(fragment);
}

// Ensure the crafting listener routes both normal and batch buttons correctly
function initCraftingListeners() {
    const closeBtn = document.getElementById('closeCraftingButton');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('craftingModal');
            if (modal) modal.classList.add('hidden');
        });
    }

    const recipeList = document.getElementById('craftingRecipeList');
    if (recipeList) {
        // Remove old listener to prevent duplicates on soft-reloads
        const newList = recipeList.cloneNode(false);
        recipeList.parentNode.replaceChild(newList, recipeList);

        newList.addEventListener('click', (e) => {
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

// Global UI Hook
if (typeof areGlobalListenersInitialized !== 'undefined' && !areGlobalListenersInitialized) {
    initCraftingListeners();
}

// --- END OF FILE crafting.js ---
