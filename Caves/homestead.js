// --- START OF FILE homestead.js ---

// ==========================================
// HOMESTEAD & FARMING EXPANSION
// ==========================================

window.FARMING_DATA = {
    seeds: {
        'Herb Seed': { yields: 'Medicinal Herb', turnsToGrow: 150, minYield: 1, maxYield: 3, xp: 20 },
        'Wildberry Seed': { yields: 'Wildberry', turnsToGrow: 100, minYield: 2, maxYield: 4, xp: 15 },
        'Bluecap Spore': { yields: 'Bluecap Mushroom', turnsToGrow: 200, minYield: 1, maxYield: 3, xp: 30 },
        'Moonbloom Bulb': { yields: 'Moonbloom Petal', turnsToGrow: 400, minYield: 1, maxYield: 2, xp: 100 }
    }
};

// 1. Inject New Items into the Engine
var HOMESTEAD_ITEMS = {
    '🌱h': { name: 'Herb Seed', type: 'seed', tile: '🌱', description: "Plant in a Garden Plot to grow Medicinal Herbs." },
    '🌱w': { name: 'Wildberry Seed', type: 'seed', tile: '🌱', description: "Plant in a Garden Plot to grow Wildberries." },
    '🍄s': { name: 'Bluecap Spore', type: 'seed', tile: '🍄', description: "Plant in a Garden Plot to grow Bluecap Mushrooms." },
    '🌺b': { name: 'Moonbloom Bulb', type: 'seed', tile: '🧅', description: "A rare bulb. Plant in a Garden Plot to grow Moonblooms.", _rarity: 'rare' }
};

if (typeof window.ITEM_DATA !== 'undefined') {
    Object.assign(window.ITEM_DATA, HOMESTEAD_ITEMS);
}

// 2. Inject Seeds into the Shops
if (typeof window.SHOP_INVENTORY !== 'undefined') {
    window.SHOP_INVENTORY.push(
        { name: 'Herb Seed', price: 10, stock: 5 },
        { name: 'Wildberry Seed', price: 5, stock: 10 },
        { name: 'Bluecap Spore', price: 15, stock: 5 }
    );
}
if (typeof window.TRADER_INVENTORY !== 'undefined') {
    window.TRADER_INVENTORY.push({ name: 'Moonbloom Bulb', price: 200, stock: 2 });
}

// 3. Define the Garden Plot Tile
if (typeof window.TILE_DATA !== 'undefined') {
    window.TILE_DATA['🟫'] = {
        type: 'garden_plot',
        name: 'Garden Plot',
        flavor: "A patch of tilled, fertile earth.",
        onInteract: (state, x, y) => {
            openFarmingModal();
            return null; // Interaction handles state internally
        }
    };
}

// 4. Intercept Campsite Generation to place Garden Plots
if (typeof chunkManager !== 'undefined' && chunkManager.generateCampsite) {
    const originalGenerateCampsite = chunkManager.generateCampsite;
    chunkManager.generateCampsite = function() {
        const map = originalGenerateCampsite.call(this); // Call original
        const upgrades = gameState.player.campsiteUpgrades || [];
        
        // Place plots based on unlocked upgrades
        if (upgrades.includes('garden1')) map[1][2] = '🟫';
        if (upgrades.includes('garden2')) map[1][5] = '🟫';
        if (upgrades.includes('garden3')) map[1][8] = '🟫';
        
        return map;
    };
}

// 5. Intercept the Camp Ledger to add Garden Upgrades!
setTimeout(() => {
    if (typeof window.TILE_DATA !== 'undefined' && window.TILE_DATA['📋']) {
        const originalLedgerInteract = window.TILE_DATA['📋'].onInteract;
        
        window.TILE_DATA['📋'].onInteract = (state, x, y) => {
            const p = state.player;
            if (!p.campsiteUpgrades) p.campsiteUpgrades = [];
            const upg = p.campsiteUpgrades;

            const countMat = (name) => p.inventory.filter(i => i && i.name === name && !i.isEquipped).reduce((sum, i) => sum + i.quantity, 0);

            const wood = countMat('Wood Log');
            const stone = countMat('Stone');
            const iron = countMat('Iron Ore');
            const dust = countMat('Void Dust');

            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');

            if (!loreTitle || !loreContent || !loreModal) return null;

            loreTitle.textContent = "Campsite Ledger";
            
            let html = `<p class="text-sm text-gray-300 mb-4 border-b border-gray-700 pb-2">Invest materials to expand your campsite. (Current: ${wood} Wood, ${stone} Stone, ${iron} Iron, ${dust} Void Dust)</p>`;

            const addBtn = (id, name, costStr, canAfford) => {
                const btnClass = canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed';
                html += `<button id="btn_${id}" class="mb-2 ${btnClass} text-white font-bold py-2 px-4 rounded w-full flex justify-between shadow transition-transform active:scale-95" ${canAfford ? '' : 'disabled'}>
                    <span>Build ${name}</span> <span class="text-xs font-normal">${costStr}</span>
                </button>`;
            };

            // Existing Upgrades
            if (!upg.includes('stash')) addBtn('stash', 'Stash Box', '10 Wood, 5 Stone', wood >= 10 && stone >= 5);
            if (!upg.includes('workbench')) addBtn('workbench', 'Workbench', '15 Wood, 5 Iron', wood >= 15 && iron >= 5);
            if (!upg.includes('enchanter')) addBtn('enchanter', 'Enchanting Altar', '10 Stone, 5 Void Dust', stone >= 10 && dust >= 5);
            if (!upg.includes('waystone')) addBtn('waystone', 'Leyline Waystone', '10 Void Dust, 500 Gold', dust >= 10 && p.coins >= 500);
            if (!upg.includes('tent')) addBtn('tent', 'Large Tent', '20 Wood, 10 Wolf Pelt', wood >= 20 && countMat('Wolf Pelt') >= 10);
            
            // --- NEW: GARDEN UPGRADES ---
            if (!upg.includes('garden1')) addBtn('garden1', 'Garden Plot I', '5 Wood, 5 Stone', wood >= 5 && stone >= 5);
            else if (!upg.includes('garden2')) addBtn('garden2', 'Garden Plot II', '10 Wood, 10 Stone', wood >= 10 && stone >= 10);
            else if (!upg.includes('garden3')) addBtn('garden3', 'Garden Plot III', '15 Wood, 15 Stone', wood >= 15 && stone >= 15);

            loreContent.innerHTML = html;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                const consume = (name, qty) => {
                    let needed = qty;
                    for (let i = p.inventory.length - 1; i >= 0; i--) {
                        if (needed <= 0) break;
                        let item = p.inventory[i];
                        if (item && item.name === name && !item.isEquipped) {
                            let take = Math.min(item.quantity, needed);
                            item.quantity -= take;
                            needed -= take;
                            if (item.quantity <= 0) p.inventory.splice(i, 1);
                        }
                    }
                };

                const bindUpgrade = (id, reqs, action) => {
                    const btn = document.getElementById(`btn_${id}`);
                    if (btn) btn.onclick = () => {
                        reqs();
                        p.campsiteUpgrades.push(id);
                        action();
                        if (typeof logMessage === 'function') logMessage(`{green:Campsite upgraded: ${id.toUpperCase()}!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                        loreModal.classList.add('hidden');
                        
                        chunkManager.generateCampsite();
                        gameState.mapDirty = true;
                        if (typeof render === 'function') render();
                        
                        if (typeof triggerDebouncedSave === 'function') {
                            triggerDebouncedSave({ campsiteUpgrades: p.campsiteUpgrades, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory, coins: p.coins });
                        }
                        if (typeof renderInventory === 'function') renderInventory();
                    };
                };

                // Re-bind actions
                bindUpgrade('stash', () => { consume('Wood Log', 10); consume('Stone', 5); }, () => {});
                bindUpgrade('workbench', () => { consume('Wood Log', 15); consume('Iron Ore', 5); }, () => {});
                bindUpgrade('enchanter', () => { consume('Stone', 10); consume('Void Dust', 5); }, () => {});
                bindUpgrade('tent', () => { consume('Wood Log', 20); consume('Wolf Pelt', 10); }, () => {});
                bindUpgrade('waystone', () => { consume('Void Dust', 10); p.coins -= 500; }, () => {});
                
                // Bind Garden Actions
                bindUpgrade('garden1', () => { consume('Wood Log', 5); consume('Stone', 5); }, () => {});
                bindUpgrade('garden2', () => { consume('Wood Log', 10); consume('Stone', 10); }, () => {});
                bindUpgrade('garden3', () => { consume('Wood Log', 15); consume('Stone', 15); }, () => {});

            }, 0);

            return null;
        };
    }
}, 500); // Tiny timeout ensures data-maps.js is fully loaded

// ==========================================
// FARMING LOGIC & UI
// ==========================================

function openFarmingModal() {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    renderFarmingModal();
    const modal = document.getElementById('farmingModal');
    if (modal) modal.classList.remove('hidden');
}

function renderFarmingModal() {
    const farmingList = document.getElementById('farmingList');
    if (!farmingList) return;
    
    farmingList.innerHTML = '';
    const player = gameState.player;
    if (!player.gardenPlots) player.gardenPlots = [null, null, null];
    const upgrades = player.campsiteUpgrades || [];

    // Find all seeds currently in inventory
    const availableSeeds = player.inventory.filter(i => i && i.type === 'seed' && !i.isEquipped);

    // Build Seed Dropdown Options
    let seedOptions = `<option value="">-- Select Seed --</option>`;
    const uniqueSeeds = [...new Set(availableSeeds.map(s => s.name))];
    uniqueSeeds.forEach(seedName => {
        const count = availableSeeds.filter(s => s.name === seedName).reduce((a, b) => a + b.quantity, 0);
        seedOptions += `<option value="${seedName}">${seedName} (x${count})</option>`;
    });

    const hasWater = player.inventory.some(i => i && i.name === 'Flask of Water' && !i.isEquipped);

    for (let i = 0; i < 3; i++) {
        const isUnlocked = upgrades.includes(`garden${i+1}`);
        const plot = player.gardenPlots[i];
        
        const div = document.createElement('div');
        div.className = "panel p-4 mb-3 rounded-lg border-2 border-gray-700 bg-black bg-opacity-30 shadow-inner flex flex-col sm:flex-row justify-between items-center gap-4";

        if (!isUnlocked) {
            div.innerHTML = `
                <div class="flex items-center gap-4 opacity-50">
                    <div class="text-4xl">🔒</div>
                    <div>
                        <h3 class="font-bold text-gray-500 text-lg">Plot Locked</h3>
                        <p class="text-xs text-gray-600">Unlock via the Campsite Ledger.</p>
                    </div>
                </div>
            `;
        } 
        else if (!plot) {
            // Plot is empty and ready to plant
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="text-4xl drop-shadow-md">🟫</div>
                    <div class="w-full sm:w-auto">
                        <h3 class="font-bold text-yellow-600 text-lg" style="font-family: 'Uncial Antiqua', cursive;">Empty Plot</h3>
                        <div class="flex items-center gap-2 mt-2 w-full">
                            <select id="seedSelect_${i}" class="bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm w-full sm:w-48 outline-none focus:border-green-500">
                                ${seedOptions}
                            </select>
                            <button onclick="plantSeed(${i})" class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded shadow-md border-b-2 border-green-800 active:scale-95 active:border-b-0 active:mt-0.5">Plant</button>
                        </div>
                    </div>
                </div>
            `;
        } 
        else {
            // Plot is growing
            const turnsPassed = gameState.playerTurnCount - plot.plantedAt;
            const seedData = window.FARMING_DATA.seeds[plot.seedName];
            const turnsNeeded = seedData ? seedData.turnsToGrow : 100;
            const progressRaw = (turnsPassed / turnsNeeded) * 100;
            const progress = Math.min(100, Math.max(0, progressRaw));
            
            const isReady = progress >= 100;
            
            let icon = '🪴';
            if (isReady) {
                // Determine mature crop icon
                if (seedData.yields === 'Bluecap Mushroom') icon = '🍄';
                else if (seedData.yields === 'Moonbloom Petal') icon = '🌺';
                else icon = '🌿';
            }

            let statusHtml = '';
            if (isReady) {
                statusHtml = `
                    <div class="w-full">
                        <h3 class="font-bold text-green-400 text-lg" style="font-family: 'Uncial Antiqua', cursive;">Ready for Harvest</h3>
                        <p class="text-xs text-gray-400 italic">Yields: ${seedData.yields}</p>
                    </div>
                    <button onclick="harvestPlot(${i})" class="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg shadow-md border-b-2 border-yellow-800 active:scale-95 active:border-b-0 active:mt-0.5 whitespace-nowrap">Harvest</button>
                `;
            } else {
                statusHtml = `
                    <div class="w-full flex-grow">
                        <h3 class="font-bold text-blue-400 text-lg">${plot.seedName}</h3>
                        <div class="w-full bg-gray-900 rounded h-2 mt-2 border border-gray-700 shadow-inner overflow-hidden">
                            <div class="bg-green-500 h-full transition-all duration-500" style="width: ${progress}%"></div>
                        </div>
                        <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest text-right">${Math.floor(progress)}% Grown</p>
                    </div>
                    <button onclick="waterPlot(${i})" class="${hasWater ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 opacity-50 cursor-not-allowed'} text-white font-bold py-2 px-4 rounded shadow-md border-b-2 ${hasWater ? 'border-blue-800 active:scale-95 active:border-b-0 active:mt-0.5' : 'border-gray-800'} whitespace-nowrap flex flex-col items-center" ${hasWater ? '' : 'disabled'}>
                        <span>Water</span>
                        <span class="text-[9px] font-normal opacity-80">(Requires Flask)</span>
                    </button>
                `;
            }

            div.innerHTML = `
                <div class="flex items-center gap-4 w-full">
                    <div class="text-4xl drop-shadow-md relative">
                        ${icon}
                        ${plot.watered ? '<span class="absolute -bottom-1 -right-1 text-sm drop-shadow-md">💧</span>' : ''}
                    </div>
                    ${statusHtml}
                </div>
            `;
        }
        
        farmingList.appendChild(div);
    }
}

window.plantSeed = function(plotIndex) {
    const select = document.getElementById(`seedSelect_${plotIndex}`);
    const seedName = select ? select.value : null;

    if (!seedName) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const player = gameState.player;
    const invIndex = player.inventory.findIndex(i => i && i.name === seedName && !i.isEquipped);

    if (invIndex > -1) {
        // Consume seed
        player.inventory[invIndex].quantity--;
        if (player.inventory[invIndex].quantity <= 0) {
            player.inventory.splice(invIndex, 1);
        }

        // Set plot data
        player.gardenPlots[plotIndex] = {
            seedName: seedName,
            plantedAt: gameState.playerTurnCount,
            watered: false
        };

        if (typeof AudioSystem !== 'undefined') AudioSystem.playDig(player.x);
        if (typeof logMessage === 'function') logMessage(`{green:You planted a ${seedName} in the earth.}`);
        
        // Save
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({ gardenPlots: player.gardenPlots, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
        }
        
        renderFarmingModal();
    }
};

window.waterPlot = function(plotIndex) {
    const player = gameState.player;
    const plot = player.gardenPlots[plotIndex];

    if (!plot) return;
    if (plot.watered) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        if (typeof logMessage === 'function') logMessage("{gray:This plot is already well-watered.}");
        return;
    }

    const waterIdx = player.inventory.findIndex(i => i && i.name === 'Flask of Water' && !i.isEquipped);
    if (waterIdx > -1) {
        // Consume Water Flask and return Empty Bottle
        player.inventory[waterIdx].quantity--;
        if (player.inventory[waterIdx].quantity <= 0) player.inventory.splice(waterIdx, 1);

        const bottleIdx = player.inventory.findIndex(i => i && i.name === 'Empty Bottle' && !i.isEquipped);
        if (bottleIdx > -1) player.inventory[bottleIdx].quantity++;
        else player.inventory.push({ templateId: '🫙', name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });

        plot.watered = true;
        // Watering speeds up growth by jumping the plantedAt time back by 25 turns!
        plot.plantedAt -= 25; 

        if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 500); // Splash
        if (typeof logMessage === 'function') logMessage(`{blue:You watered the ${plot.seedName}. It looks healthier!}`);

        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({ gardenPlots: player.gardenPlots, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
        }

        renderFarmingModal();
    }
};

window.harvestPlot = function(plotIndex) {
    const player = gameState.player;
    const plot = player.gardenPlots[plotIndex];
    if (!plot) return;

    const seedData = window.FARMING_DATA.seeds[plot.seedName];
    if (!seedData) return;

    // Capacity check
    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
    const existingStack = player.inventory.find(i => i && i.name === seedData.yields && !i.isEquipped);
    
    if (!existingStack && player.inventory.length >= invCap) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        if (typeof logMessage === 'function') logMessage(`{red:Your inventory is full! Make space before harvesting.}`);
        return;
    }

    // Determine Yield
    let yieldAmount = Math.floor(Math.random() * (seedData.maxYield - seedData.minYield + 1)) + seedData.minYield;
    
    // Talents & Bonuses
    if (player.talents && player.talents.includes('survivalist')) {
        yieldAmount += 1; // Survivalist guarantees extra crop!
    }
    if (plot.watered && Math.random() < 0.5) {
        yieldAmount += 1; // Watering gives chance for extra
    }

    // Give Item
    if (existingStack) {
        existingStack.quantity += yieldAmount;
    } else {
        // Need to grab base template data for the crop
        const baseKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === seedData.yields);
        const template = window.ITEM_DATA[baseKey] || { type: 'ingredient', tile: '🌿' };
        
        player.inventory.push({
            templateId: baseKey,
            name: seedData.yields,
            type: template.type || 'ingredient',
            quantity: yieldAmount,
            tile: template.tile || '🌿',
            effect: template.effect || null,
            isEquipped: false
        });
    }

    // Give Farming XP
    player.farmingXp = (player.farmingXp || 0) + seedData.xp;
    const xpNeeded = (player.farmingLevel || 1) * 50;
    
    if (typeof logMessage === 'function') logMessage(`{gold:You harvested ${yieldAmount}x ${seedData.yields}! (+${seedData.xp} Farming XP)}`);

    if (player.farmingXp >= xpNeeded) {
        player.farmingXp -= xpNeeded;
        player.farmingLevel = (player.farmingLevel || 1) + 1;
        if (typeof logMessage === 'function') logMessage(`{green:FARMING LEVEL UP! You are now a Level ${player.farmingLevel} Botanist.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
    } else {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
    }

    // Track Metric
    if (!player.metrics) player.metrics = {};
    player.metrics.cropsHarvested = (player.metrics.cropsHarvested || 0) + yieldAmount;

    // Reset Plot
    player.gardenPlots[plotIndex] = null;

    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ 
            gardenPlots: player.gardenPlots, 
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory,
            farmingXp: player.farmingXp,
            farmingLevel: player.farmingLevel,
            metrics: player.metrics
        });
    }

    renderFarmingModal();
};

// Event Listeners for the modal
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeFarmingButton');
    const modal = document.getElementById('farmingModal');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            modal.classList.add('hidden');
        });
    }
});

// --- END OF FILE homestead.js ---
