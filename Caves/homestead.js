// --- START OF FILE homestead.js ---

// ==========================================
// HOMESTEAD & FARMING EXPANSION
// ==========================================

window.ExpansionManager.register({
    id: "homestead_farming",
    name: "The Homestead (Farming & Campsites)",
    version: "1.4", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🌱h': { name: 'Herb Seed', type: 'seed', tile: '🌱', description: "Plant in a Garden Plot to grow Medicinal Herbs." },
            '🌱w': { name: 'Wildberry Seed', type: 'seed', tile: '🌱', description: "Plant in a Garden Plot to grow Wildberries." },
            '🍄s': { name: 'Bluecap Spore', type: 'seed', tile: '🍄', description: "Plant in a Garden Plot to grow Bluecap Mushrooms." },
            '🌺b': { name: 'Moonbloom Bulb', type: 'seed', tile: '🧅', description: "A rare bulb. Plant in a Garden Plot to grow Moonblooms.", _rarity: 'rare' },
            '🌵s': { name: 'Cactus Seed', type: 'seed', tile: '🌱', description: "Plant in a Garden Plot to grow Cactus Fruit." },
            
            // --- EXPANSION WINS: New Magic Seed & Fertilizer ---
            '🍄g': { name: 'Ghostcap Spore', type: 'seed', tile: '🍄', description: "Plant in a Garden Plot to grow ethereal Ghostcaps. Thrives in the dark.", _rarity: 'epic' },
            '🍄gc': {
                name: 'Ghostcap', type: 'consumable', tile: '🍄', _rarity: 'epic',
                description: "A translucent, humming fungus. {purple:+25 Psyche}, {gray:Grants 5 turns of Stealth.}",
                effect: (state) => {
                    if (typeof window.modifyVital === 'function') window.modifyVital('psyche', 25);
                    else state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + 25);
                    
                    state.player.stealthTurns = Math.max(state.player.stealthTurns || 0, 5);
                    if (typeof window.StealthManager !== 'undefined' && typeof window.StealthManager.updateUI === 'function') {
                        state.player.isCrouching = true;
                        window.StealthManager.updateUI();
                    }
                    
                    logMessage("{purple:You consume the Ghostcap. The world fades and your mind expands! (+25 Psyche, +5 Stealth)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#c084fc', 20);
                    return true;
                }
            },
            '🦴m': { 
                name: 'Bone Meal', type: 'consumable', tile: '🦴', _rarity: 'uncommon',
                description: "Fertilizer made from crushed bones. {green:Instantly matures a growing Garden Plot.}",
                effect: (state) => {
                    logMessage("{gray:Use Bone Meal directly from the Botanical Garden interface at your camp.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return false; // Prevent consuming it manually
                }
            }
        },

        // --- 2. SHOPS & CRAFTING ---
        shops: {
            general: [
                { name: 'Herb Seed', price: 10, stock: 5 },
                { name: 'Wildberry Seed', price: 5, stock: 10 },
                { name: 'Cactus Seed', price: 15, stock: 5 },
                { name: 'Bluecap Spore', price: 15, stock: 5 }
            ],
            trader: [
                { name: 'Moonbloom Bulb', price: 200, stock: 2 },
                { name: 'Bone Meal', price: 50, stock: 5 }
            ],
            black_market: [
                { name: 'Ghostcap Spore', price: 400, stock: 1 }
            ]
        },
        craftingRecipes: {
            "Bone Meal": { materials: { "Bone Shard": 2 }, xp: 15, level: 1, yield: 2 }
        },

        // --- 3. MAP TILES ---
        tiles: {
            '🟫': {
                type: 'garden_plot',
                name: 'Garden Plot',
                flavor: "A patch of tilled, fertile earth.",
                onInteract: (state, x, y) => {
                    if (typeof window.openFarmingModal === 'function') window.openFarmingModal();
                    
                    // 🚨 BUG FIX WIN: Return an empty object (acting as 'true' for the turn resolver)
                    // instead of 'null'. Returning null told the engine the interaction failed/was free,
                    // allowing players to farm instantly without passing time or draining stamina!
                    return {}; 
                }
            }
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        const logger = window.ExpansionManager.getLogger("Homestead");

        // 1. ATTACH FARMING DATA GLOBALLY (Modularly!)
        if (typeof window.FARMING_DATA === 'undefined') window.FARMING_DATA = { seeds: {} };
        
        Object.assign(window.FARMING_DATA.seeds, {
            'Herb Seed': { yields: 'Medicinal Herb', turnsToGrow: 150, minYield: 1, maxYield: 3, xp: 20 },
            'Wildberry Seed': { yields: 'Wildberry', turnsToGrow: 100, minYield: 2, maxYield: 4, xp: 15 },
            'Cactus Seed': { yields: 'Cactus Fruit', turnsToGrow: 120, minYield: 1, maxYield: 3, xp: 20 },
            'Bluecap Spore': { yields: 'Bluecap Mushroom', turnsToGrow: 200, minYield: 1, maxYield: 3, xp: 30 },
            'Moonbloom Bulb': { yields: 'Moonbloom Petal', turnsToGrow: 400, minYield: 1, maxYield: 2, xp: 100 },
            'Ghostcap Spore': { yields: 'Ghostcap', turnsToGrow: 250, minYield: 1, maxYield: 2, xp: 75 }
        });

        // PERFORMANCE WIN: O(1) Item Lookup Cache for Farming
        window._farmItemKeyCache = window._farmItemKeyCache || {};
        window.getFarmItemKey = function(name) {
            if (window._farmItemKeyCache[name]) return window._farmItemKeyCache[name];
            if (typeof window.ITEM_DATA === 'undefined') return null;
            const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
            if (key) window._farmItemKeyCache[name] = key;
            return key;
        };

        const applySafePatch = (target, method, factory) => {
            if (typeof window.ExpansionManager.patchFunction === 'function') {
                window.ExpansionManager.patchFunction(target, method, factory);
            } else {
                const orig = target[method];
                target[method] = factory(orig ? orig.bind(target) : null);
            }
        };

        // 2. INTERCEPT CAMPSITE GENERATION (Place Garden Plots)
        if (typeof chunkManager !== 'undefined') {
            applySafePatch(chunkManager, 'generateCampsite', (origGenerateCampsite) => {
                return function() {
                    const map = origGenerateCampsite ? origGenerateCampsite.call(this) : [];
                    if (typeof gameState === 'undefined' || !gameState.player) return map;
                    
                    const upgrades = gameState.player.campsiteUpgrades || [];
                    
                    // Safe Array Bounds Checking
                    if (map && map[1]) {
                        if (upgrades.includes('garden1') && map[1][2] !== undefined) map[1][2] = '🟫';
                        if (upgrades.includes('garden2') && map[1][5] !== undefined) map[1][5] = '🟫';
                        if (upgrades.includes('garden3') && map[1][8] !== undefined) map[1][8] = '🟫';
                    }
                    
                    return map;
                };
            });
        }

        // 3. INTERCEPT CAMP LEDGER (Add Garden Upgrades WITHOUT breaking other mods!)
        setTimeout(() => {
            if (typeof window.TILE_DATA !== 'undefined' && window.TILE_DATA['📋']) {
                const originalLedgerInteract = window.TILE_DATA['📋'].onInteract;
                
                window.TILE_DATA['📋'].onInteract = (state, x, y) => {
                    // Call the original base game interaction FIRST so it sets up the core HTML!
                    const res = originalLedgerInteract ? originalLedgerInteract(state, x, y) : null;
                    
                    // Use a tiny timeout to safely inject our content AFTER the DOM has painted
                    setTimeout(() => {
                        const loreTitle = document.getElementById('loreTitle');
                        const loreContent = document.getElementById('loreContent');

                        if (loreTitle && loreTitle.textContent === 'Campsite Ledger' && loreContent) {
                            const p = state.player;
                            if (!p.campsiteUpgrades) p.campsiteUpgrades = [];
                            const upg = p.campsiteUpgrades;

                            // Only inject if the garden buttons aren't already there!
                            if (!document.getElementById('btn_garden1') && !upg.includes('garden3')) {
                                const countMatCurrent = (name) => p.inventory.filter(i => i && i.name === name && !i.isEquipped).reduce((sum, i) => sum + i.quantity, 0);
                                const wood = countMatCurrent('Wood Log');
                                const stone = countMatCurrent('Stone');

                                const addBtn = (id, name, costStr, canAfford) => {
                                    const btnClass = canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed';
                                    return `<button id="btn_${id}" class="mb-2 ${btnClass} text-white font-bold py-2 px-4 rounded w-full flex justify-between shadow transition-transform active:scale-95 border-b-2 active:border-b-0 active:mt-0.5" ${canAfford ? '' : 'disabled'}>
                                        <span>Build ${name}</span> <span class="text-xs font-normal">${costStr}</span>
                                    </button>`;
                                };

                                let newHtml = '';
                                if (!upg.includes('garden1')) newHtml += addBtn('garden1', 'Garden Plot I', '5 Wood, 5 Stone', wood >= 5 && stone >= 5);
                                else if (!upg.includes('garden2')) newHtml += addBtn('garden2', 'Garden Plot II', '10 Wood, 10 Stone', wood >= 10 && stone >= 10);
                                else if (!upg.includes('garden3')) newHtml += addBtn('garden3', 'Garden Plot III', '15 Wood, 15 Stone', wood >= 15 && stone >= 15);

                                // Find the "Your camp is fully upgraded!" text from the core engine and remove it
                                // so we can cleanly append our new buttons without UI overlap!
                                const fullyUpgradedText = Array.from(loreContent.querySelectorAll('p')).find(p => p.textContent.includes('fully upgraded'));
                                if (fullyUpgradedText) fullyUpgradedText.remove();

                                loreContent.insertAdjacentHTML('beforeend', newHtml);
                                
                                // Check for FULL completion across base game + mod
                                if (upg.length >= 7) { 
                                    loreContent.insertAdjacentHTML('beforeend', `<p class="text-green-400 font-bold text-center mt-4">Your camp is fully upgraded!</p>`);
                                }

                                // Bind the click logic for the injected buttons
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

                                const bindUpgrade = (id, checkAfford, consumeReqs) => {
                                    const btn = document.getElementById(`btn_${id}`);
                                    if (btn) btn.onclick = () => {
                                        // Re-verify at the exact moment of clicking to prevent race conditions!
                                        if (!checkAfford()) {
                                            if (typeof logMessage === 'function') logMessage("{red:You lack the materials to build this!}");
                                            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                            return;
                                        }
                                        
                                        btn.disabled = true; 
                                        consumeReqs();
                                        p.campsiteUpgrades.push(id);
                                        
                                        if (typeof logMessage === 'function') logMessage(`{green:Campsite upgraded: ${id.toUpperCase()}!}`);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                                        
                                        const loreModal = document.getElementById('loreModal');
                                        if (loreModal) loreModal.classList.add('hidden');
                                        
                                        if (typeof chunkManager !== 'undefined') chunkManager.generateCampsite();
                                        if (typeof gameState !== 'undefined') gameState.mapDirty = true;
                                        if (typeof render === 'function') render();
                                        
                                        if (typeof triggerDebouncedSave === 'function') {
                                            triggerDebouncedSave({ campsiteUpgrades: p.campsiteUpgrades, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory, coins: p.coins });
                                        }
                                        if (typeof renderInventory === 'function') renderInventory();
                                    };
                                };

                                bindUpgrade('garden1', () => countMatCurrent('Wood Log') >= 5 && countMatCurrent('Stone') >= 5, () => { consume('Wood Log', 5); consume('Stone', 5); });
                                bindUpgrade('garden2', () => countMatCurrent('Wood Log') >= 10 && countMatCurrent('Stone') >= 10, () => { consume('Wood Log', 10); consume('Stone', 10); });
                                bindUpgrade('garden3', () => countMatCurrent('Wood Log') >= 15 && countMatCurrent('Stone') >= 15, () => { consume('Wood Log', 15); consume('Stone', 15); });
                            }
                        }
                    }, 10);
                    
                    return res;
                };
            }
        }, 500); 

        // ==========================================
        // 4. LORE WIN: NATURAL RAIN WATERING
        // ==========================================
        if (typeof window.endPlayerTurn === 'function') {
            applySafePatch(window, 'endPlayerTurn', (origEndPlayerTurn) => {
                return function(updates = {}) {
                    // Check if it's raining outside
                    if (typeof gameState !== 'undefined' && gameState.weather === 'rain' && gameState.mapMode === 'overworld') {
                        const p = gameState.player;
                        if (p && p.gardenPlots) {
                            let wateredAny = false;
                            
                            // Iterate through the plots and water them organically
                            p.gardenPlots.forEach((plot, index) => {
                                if (plot && !plot.watered) {
                                    plot.watered = true;
                                    plot.plantedAt -= 30; // Jump growth forward!
                                    wateredAny = true;
                                }
                            });
                            
                            if (wateredAny) {
                                // Don't spam the chat, just occasionally let them know their crops are happy
                                if (typeof logMessage === 'function' && Math.random() < 0.15) {
                                    logMessage("{blue:The gentle rain organically waters your crops back at camp.}");
                                }
                                
                                // Auto-save the plot growth
                                if (typeof triggerDebouncedSave === 'function') {
                                    triggerDebouncedSave({ gardenPlots: p.gardenPlots });
                                }
                            }
                        }
                    }
                    // Pass all original logic forward seamlessly
                    if (origEndPlayerTurn) return origEndPlayerTurn.apply(this, arguments);
                };
            });
        }

        // ==========================================
        // 5. FARMING LOGIC & UI EXPORTS
        // ==========================================
        
        let isFarmingProcessing = false; // 🚨 EXPLOIT FIX WIN: Mutex lock for fast clicking

        window.openFarmingModal = function() {
            if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            if (typeof window.renderFarmingModal === 'function') window.renderFarmingModal();
            const modal = document.getElementById('farmingModal');
            if (modal) modal.classList.remove('hidden');
        };

        window.renderFarmingModal = function() {
            const farmingList = document.getElementById('farmingList');
            if (!farmingList) return;
            
            farmingList.innerHTML = '';
            const player = gameState.player;
            if (!player.gardenPlots) player.gardenPlots = [null, null, null];
            const upgrades = player.campsiteUpgrades || [];

            // 🚨 PERFORMANCE WIN: Single pass seed tallying
            const seedCounts = {};
            let hasWater = false;
            let hasBoneMeal = false;
            
            for (let i = 0; i < player.inventory.length; i++) {
                const itm = player.inventory[i];
                if (!itm || itm.isEquipped) continue;
                
                if (itm.type === 'seed') {
                    seedCounts[itm.name] = (seedCounts[itm.name] || 0) + itm.quantity;
                } else if (itm.name === 'Flask of Water') {
                    hasWater = true;
                } else if (itm.name === 'Bone Meal') {
                    hasBoneMeal = true;
                }
            }

            // Build Seed Dropdown Options
            let seedOptions = `<option value="">-- Select Seed --</option>`;
            for (const [seedName, count] of Object.entries(seedCounts)) {
                // Security: Escape user-provided data just in case
                const safeName = typeof escapeHtml === 'function' ? escapeHtml(seedName) : seedName;
                seedOptions += `<option value="${safeName}">${safeName} (x${count})</option>`;
            }

            // Use DocumentFragment for batched DOM insertion
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < 3; i++) {
                const isUnlocked = upgrades.includes(`garden${i+1}`);
                const plot = player.gardenPlots[i];
                
                const div = document.createElement('div');
                div.className = "panel p-4 mb-3 rounded-lg border-2 border-gray-700 bg-black bg-opacity-30 shadow-inner flex flex-col sm:flex-row justify-between items-center gap-4";

                if (!isUnlocked) {
                    div.innerHTML = `
                        <div class="flex items-center gap-4 opacity-50 w-full">
                            <div class="text-4xl">🔒</div>
                            <div>
                                <h3 class="font-bold text-gray-500 text-lg">Plot Locked</h3>
                                <p class="text-xs text-gray-600">Unlock via the Campsite Ledger.</p>
                            </div>
                        </div>
                    `;
                } 
                else if (!plot) {
                    div.innerHTML = `
                        <div class="flex items-center gap-4 w-full">
                            <div class="text-4xl drop-shadow-md">🟫</div>
                            <div class="w-full flex-grow">
                                <h3 class="font-bold text-yellow-600 text-lg" style="font-family: 'Uncial Antiqua', cursive;">Empty Plot</h3>
                                <div class="flex items-center gap-2 mt-2 w-full">
                                    <select id="seedSelect_${i}" class="bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm w-full outline-none focus:border-green-500">
                                        ${seedOptions}
                                    </select>
                                    <button data-action="plant" data-plot="${i}" class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded shadow-md border-b-2 border-green-800 active:scale-95 active:border-b-0 active:mt-0.5 whitespace-nowrap">Plant</button>
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
                    const safePlotName = typeof escapeHtml === 'function' ? escapeHtml(plot.seedName) : plot.seedName;
                    
                    let icon = '🪴';
                    if (isReady) {
                        if (seedData && seedData.yields === 'Bluecap Mushroom') icon = '🍄';
                        else if (seedData && seedData.yields === 'Ghostcap') icon = '🍄';
                        else if (seedData && seedData.yields === 'Moonbloom Petal') icon = '🌺';
                        else if (seedData && seedData.yields === 'Cactus Fruit') icon = '🌵';
                        else icon = '🌿';
                    }

                    let statusHtml = '';
                    if (isReady) {
                        statusHtml = `
                            <div class="w-full flex-grow">
                                <h3 class="font-bold text-green-400 text-lg" style="font-family: 'Uncial Antiqua', cursive;">Ready for Harvest</h3>
                                <p class="text-xs text-gray-400 italic">Yields: ${seedData ? seedData.yields : 'Unknown Crop'}</p>
                            </div>
                            <button data-action="harvest" data-plot="${i}" class="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg shadow-md border-b-2 border-yellow-800 active:scale-95 active:border-b-0 active:mt-0.5 whitespace-nowrap">Harvest</button>
                        `;
                    } else {
                        statusHtml = `
                            <div class="w-full flex-grow">
                                <h3 class="font-bold text-blue-400 text-lg">${safePlotName}</h3>
                                <div class="w-full bg-gray-900 rounded h-2 mt-2 border border-gray-700 shadow-inner overflow-hidden">
                                    <div class="bg-green-500 h-full transition-all duration-500" style="width: ${progress}%"></div>
                                </div>
                                <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest text-right">${Math.floor(progress)}% Grown</p>
                            </div>
                            <div class="flex gap-2">
                                <button data-action="water" data-plot="${i}" class="${hasWater && !plot.watered ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 opacity-50 cursor-not-allowed'} text-white font-bold py-2 px-3 rounded shadow-md border-b-2 ${hasWater && !plot.watered ? 'border-blue-800 active:scale-95 active:border-b-0 active:mt-0.5' : 'border-gray-800'} whitespace-nowrap flex flex-col items-center" title="Jump growth forward 30 turns." ${hasWater && !plot.watered ? '' : 'disabled'}>
                                    <span>Water</span>
                                    <span class="text-[9px] font-normal opacity-80">(Needs Flask)</span>
                                </button>
                                <button data-action="fertilize" data-plot="${i}" class="${hasBoneMeal ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 opacity-50 cursor-not-allowed'} text-white font-bold py-2 px-3 rounded shadow-md border-b-2 ${hasBoneMeal ? 'border-purple-800 active:scale-95 active:border-b-0 active:mt-0.5' : 'border-gray-800'} whitespace-nowrap flex flex-col items-center" title="Instantly matures crop." ${hasBoneMeal ? '' : 'disabled'}>
                                    <span>Fertilize</span>
                                    <span class="text-[9px] font-normal opacity-80">(Needs Bone Meal)</span>
                                </button>
                            </div>
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
                
                fragment.appendChild(div);
            }
            
            farmingList.appendChild(fragment);
        };

        window.plantSeed = function(plotIndex) {
            if (isFarmingProcessing) return;
            isFarmingProcessing = true;

            try {
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
                    
                    const safeSeedName = typeof escapeHtml === 'function' ? escapeHtml(seedName) : seedName;
                    if (typeof logMessage === 'function') logMessage(`{green:You planted a ${safeSeedName} in the earth.}`);
                    
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#16a34a', 10);
                    
                    // Save
                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ gardenPlots: player.gardenPlots, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
                    }
                    
                    if (typeof window.renderFarmingModal === 'function') window.renderFarmingModal();
                }
            } finally {
                isFarmingProcessing = false;
            }
        };

        window.waterPlot = function(plotIndex) {
            if (isFarmingProcessing) return;
            isFarmingProcessing = true;

            try {
                const player = gameState.player;
                const plot = player.gardenPlots[plotIndex];

                if (!plot || plot.watered) return;

                const waterIdx = player.inventory.findIndex(i => i && i.name === 'Flask of Water' && !i.isEquipped);
                if (waterIdx > -1) {
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Bottle Re-Injection
                    player.inventory[waterIdx].quantity--;
                    
                    // Track if consuming the flask actually freed up the slot entirely
                    const freesSlot = (player.inventory[waterIdx].quantity <= 0) ? 1 : 0;
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;

                    const bottleIdx = player.inventory.findIndex(i => i && i.name === 'Empty Bottle' && !i.isEquipped);
                    if (bottleIdx > -1) {
                        player.inventory[bottleIdx].quantity++;
                    } else if (player.inventory.length - freesSlot < invCap) {
                        player.inventory.push({ templateId: '🫙', name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });
                    } else {
                        if (typeof logMessage === 'function') logMessage("{red:Inventory full! The empty bottle falls to the ground.}");
                        if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                            window.EventManager.safeDropItem(gameState, player.x, player.y, '🫙');
                        }
                    }

                    // Splice the consumed flask
                    if (freesSlot) player.inventory.splice(waterIdx, 1);

                    plot.watered = true;
                    // Watering speeds up growth by jumping the plantedAt time back by 30 turns!
                    plot.plantedAt -= 30; 

                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(plot.seedName) : plot.seedName;

                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 500); // Splash
                    if (typeof logMessage === 'function') logMessage(`{blue:You watered the ${safeName}. It looks healthier!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, "WATERED", "#3b82f6");

                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ gardenPlots: player.gardenPlots, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
                    }

                    if (typeof window.renderFarmingModal === 'function') window.renderFarmingModal();
                }
            } finally {
                isFarmingProcessing = false;
            }
        };

        window.fertilizePlot = function(plotIndex) {
            if (isFarmingProcessing) return;
            isFarmingProcessing = true;

            try {
                const player = gameState.player;
                const plot = player.gardenPlots[plotIndex];

                if (!plot) return;

                const boneIdx = player.inventory.findIndex(i => i && i.name === 'Bone Meal' && !i.isEquipped);
                if (boneIdx > -1) {
                    player.inventory[boneIdx].quantity--;
                    if (player.inventory[boneIdx].quantity <= 0) player.inventory.splice(boneIdx, 1);

                    // Instantly mature the crop by jumping plantedAt to -1000
                    plot.plantedAt -= 1000; 
                    
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(plot.seedName) : plot.seedName;

                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    if (typeof logMessage === 'function') logMessage(`{purple:The Bone Meal works instantly! The ${safeName} bursts into full bloom!}`);
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#a855f7', 20);

                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ gardenPlots: player.gardenPlots, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
                    }

                    if (typeof window.renderFarmingModal === 'function') window.renderFarmingModal();
                }
            } finally {
                isFarmingProcessing = false;
            }
        };

        window.harvestPlot = function(plotIndex) {
            if (isFarmingProcessing) return;
            isFarmingProcessing = true;

            try {
                const player = gameState.player;
                const plot = player.gardenPlots[plotIndex];
                if (!plot) return;

                const seedData = window.FARMING_DATA.seeds[plot.seedName];
                if (!seedData) {
                    // Safe cleanup if seed data vanished due to a mod uninstall
                    player.gardenPlots[plotIndex] = null;
                    if (typeof window.renderFarmingModal === 'function') window.renderFarmingModal();
                    return; 
                }

                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
                const existingStack = player.inventory.find(i => i && i.name === seedData.yields && !i.isEquipped);
                
                // Determine Yield
                let yieldAmount = Math.floor(Math.random() * (seedData.maxYield - seedData.minYield + 1)) + seedData.minYield;
                
                // Talents & Bonuses
                if (player.talents && player.talents.includes('survivalist')) {
                    yieldAmount += 1; // Survivalist guarantees extra crop!
                }
                if (plot.watered && Math.random() < 0.5) {
                    yieldAmount += 1; // Watering gives chance for extra
                }

                // 🚨 ROBUSTNESS WIN: Fetch base template safely using the O(1) cache!
                let baseKey = null;
                if (typeof window.getFarmItemKey === 'function') {
                    baseKey = window.getFarmItemKey(seedData.yields);
                } else if (typeof window.ITEM_DATA !== 'undefined') {
                    baseKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === seedData.yields);
                }
                const template = window.ITEM_DATA[baseKey] || { type: 'ingredient', tile: '🌿' };
                
                const safeYieldName = typeof escapeHtml === 'function' ? escapeHtml(seedData.yields) : seedData.yields;

                // Give Item safely
                if (existingStack) {
                    existingStack.quantity += yieldAmount;
                    if (typeof logMessage === 'function') logMessage(`{gold:You harvested ${yieldAmount}x ${safeYieldName}! (+${seedData.xp} Farming XP)}`);
                } 
                else if (player.inventory.length < invCap) {
                    // Safe deep clone
                    let newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                    newItem.templateId = baseKey;
                    newItem.name = seedData.yields;
                    newItem.type = template.type || 'ingredient';
                    newItem.quantity = yieldAmount;
                    newItem.tile = template.tile || '🌿';
                    newItem.isEquipped = false;
                    
                    // Explicit function re-binds for safety
                    newItem.effect = template.effect || null;
                    newItem.onHit = template.onHit || null;
                    
                    player.inventory.push(newItem);
                    if (typeof logMessage === 'function') logMessage(`{gold:You harvested ${yieldAmount}x ${safeYieldName}! (+${seedData.xp} Farming XP)}`);
                } 
                else {
                    // 🚨 BUG FIX & QoL WIN: Inventory is full! Drop it safely to the ground!
                    if (typeof logMessage === 'function') logMessage(`{red:Your pack is full! The ${safeYieldName} falls to the ground.}`);
                    if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                        window.EventManager.safeDropItem(gameState, player.x, player.y, template.tile || '🌿');
                    }
                }

                // Give Farming XP
                player.farmingXp = (player.farmingXp || 0) + seedData.xp;
                const xpNeeded = (player.farmingLevel || 1) * 50;

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

                if (typeof window.renderFarmingModal === 'function') window.renderFarmingModal();
            } finally {
                isFarmingProcessing = false;
            }
        };

        // 🚨 SECURITY & PERFORMANCE WIN: Event Delegation for Farming Modal
        // Added standard `bound` flag checks to ensure it only maps once!
        const setupFarmingListeners = () => {
            const closeBtn = document.getElementById('closeFarmingButton');
            const modal = document.getElementById('farmingModal');
            const farmingList = document.getElementById('farmingList');
            
            if (closeBtn && modal && !closeBtn.dataset.listenerBound) {
                closeBtn.addEventListener('click', () => {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                    modal.classList.add('hidden');
                });
                closeBtn.dataset.listenerBound = 'true';
            }

            if (farmingList && !farmingList.dataset.listenersBound) {
                farmingList.addEventListener('click', (e) => {
                    const btn = e.target.closest('button[data-action]');
                    if (!btn || btn.disabled) return;
                    
                    const action = btn.dataset.action;
                    const plotIndex = parseInt(btn.dataset.plot, 10);
                    
                    if (isNaN(plotIndex)) return;

                    if (action === 'plant') window.plantSeed(plotIndex);
                    else if (action === 'water') window.waterPlot(plotIndex);
                    else if (action === 'fertilize') window.fertilizePlot(plotIndex);
                    else if (action === 'harvest') window.harvestPlot(plotIndex);
                });
                farmingList.dataset.listenersBound = 'true';
            }
        };

        // Standard bootloader check for listener execution
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupFarmingListeners);
        } else {
            setupFarmingListeners();
        }
        
        logger.log("Farming & Campsite hooks initialized safely.");
    }
});

// --- END OF FILE homestead.js ---
