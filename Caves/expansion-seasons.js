// --- START OF FILE expansion-seasons.js ---

window.ExpansionManager.register({
    id: "seasons_of_the_realm",
    name: "Seasons of the Realm (Dynamic Live-Ops)",
    version: "1.0",
    
    data: {
        // --- 1. SEASONAL ITEMS ---
        items: {
            '❄️c': { 
                name: 'Winter Core', type: 'trade', tile: '❄️', _rarity: 'rare',
                description: "A perpetually freezing crystal. Drops from Winter beasts.", value: 150 
            },
            '🌸s': { 
                name: 'Spring Blossom', type: 'consumable', tile: '🌸', _rarity: 'rare',
                description: "Smells of new life. {green:Fully Restores Health & Cures Poison.}", 
                effect: (state) => {
                    window.modifyVital('health', state.player.maxHealth);
                    state.player.poisonTurns = 0;
                    logMessage("{green:The Spring Blossom revitalizes your body completely!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal();
                    return true;
                }
            },
            '☀️e': { 
                name: 'Summer Ember', type: 'trade', tile: '☀️', _rarity: 'rare',
                description: "A chunk of raw heat. Drops from Summer beasts.", value: 150 
            },
            '🍁a': { 
                name: 'Autumn Harvest', type: 'consumable', tile: '🍁', _rarity: 'rare',
                description: "A perfect bountiful crop. {yellow:Fully Restores Hunger & Stamina.}", 
                effect: (state) => {
                    window.modifyVital('hunger', state.player.maxHunger);
                    window.modifyVital('stamina', state.player.maxStamina);
                    logMessage("{yellow:The Autumn Harvest fills your belly and restores your energy!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    return true;
                }
            }
        },

        // --- 2. SEASONAL BOSSES / ENEMIES ---
        enemies: {
            '⛄': {
                name: 'Frost Colossus', tags: ['elemental', 'frost', 'giant'], mountable: false,
                maxHealth: 80, attack: 12, defense: 4, xp: 200,
                color: '#7dd3fc', loot: '❄️c', isElite: true,
                flavor: "A towering mass of ice and packed snow. It brings the blizzard with it."
            },
            '🌞': {
                name: 'Solar Flare', tags: ['elemental', 'fire', 'flying'], mountable: false,
                maxHealth: 60, attack: 15, defense: 1, xp: 200,
                color: '#facc15', loot: '☀️e', isElite: true,
                inflicts: 'burn', inflictChance: 0.5,
                flavor: "A blinding sphere of superheated plasma."
            }
        },
        
        // --- 3. SEASONAL SHOPS ---
        shops: {
            // A wandering "Time Weaver" merchant could sell these, but for now we add them to the Bazaar
            trader: [
                { name: 'Spring Blossom', price: 500, stock: 1 },
                { name: 'Autumn Harvest', price: 500, stock: 1 }
            ]
        }
    },

    init: function() {
        
        // ==========================================
        // 1. THE SEASONAL CLOCK ENGINE
        // ==========================================
        window.OVERRIDE_SEASON = null; // Use /season [name] in chat to override for testing!

        window.getCurrentSeason = function() {
            if (window.OVERRIDE_SEASON) return window.OVERRIDE_SEASON;
            
            const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
            
            // Northern Hemisphere Seasons (Standard RPG Trope)
            if (month === 11 || month === 0 || month === 1) return 'Winter'; // Dec, Jan, Feb
            if (month >= 2 && month <= 4) return 'Spring'; // Mar, Apr, May
            if (month >= 5 && month <= 7) return 'Summer'; // Jun, Jul, Aug
            return 'Autumn'; // Sep, Oct, Nov
        };

        // ==========================================
        // 2. UI INJECTION (Time Panel & Chat Commands)
        // ==========================================
        const origRenderTime = window.renderTime;
        window.renderTime = function() {
            if (origRenderTime) origRenderTime();
            
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) {
                const season = window.getCurrentSeason();
                let seasonColor = '#9ca3af';
                let icon = '🍂';
                
                if (season === 'Winter') { seasonColor = '#7dd3fc'; icon = '❄️'; }
                if (season === 'Spring') { seasonColor = '#4ade80'; icon = '🌸'; }
                if (season === 'Summer') { seasonColor = '#facc15'; icon = '☀️'; }
                if (season === 'Autumn') { seasonColor = '#f97316'; icon = '🍁'; }

                timeDisplay.innerHTML += ` <span style="color: ${seasonColor}; font-weight: bold;" class="drop-shadow-sm ml-2 border-l border-gray-600 pl-2">${icon} ${season}</span>`;
            }
        };

        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const parts = raw.split(' ');
                const command = parts[0].toLowerCase();
                
                if (command === 'season' && parts[1]) {
                    const requested = parts[1].toLowerCase();
                    if (requested === 'winter') window.OVERRIDE_SEASON = 'Winter';
                    else if (requested === 'spring') window.OVERRIDE_SEASON = 'Spring';
                    else if (requested === 'summer') window.OVERRIDE_SEASON = 'Summer';
                    else if (requested === 'autumn') window.OVERRIDE_SEASON = 'Autumn';
                    else if (requested === 'clear') window.OVERRIDE_SEASON = null;
                    
                    logMessage(`{purple:The Time Weavers shift the timeline. It is now ${window.getCurrentSeason()}.}`);
                    
                    // Force complete map purge so chunks regenerate with the new season
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.loadedChunks = {};
                        chunkManager.worldState = {};
                        gameState.mapDirty = true;
                        if (typeof render === 'function') render();
                    }
                    if (typeof renderTime === 'function') renderTime();
                    return;
                }
                originalHandleChat(message);
            };
        }

        // ==========================================
        // 3. TERRAIN MUTATIONS (Winter Ice & Spring Blooms)
        // ==========================================
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                // Only mutate the Prime Realm
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                const season = window.getCurrentSeason();
                const random = typeof Alea !== 'undefined' ? Alea(typeof stringToSeed !== 'undefined' ? stringToSeed(`season_${season}_${chunkId}`) : 1) : Math.random;
                
                for(let y = 0; y < 16; y++) {
                    for(let x = 0; x < 16; x++) {
                        const tile = chunkData[y][x];
                        
                        if (season === 'Winter') {
                            // Shallow water and swamps freeze over!
                            if (tile === '≈') chunkData[y][x] = '🧊'; 
                            // 30% of plains and forests are covered in snow
                            else if ((tile === '.' || tile === 'F') && random() < 0.3) {
                                chunkData[y][x] = '❄️';
                            }
                        } 
                        else if (season === 'Spring') {
                            // Flowers bloom wildly on the plains
                            if (tile === '.' && random() < 0.05) chunkData[y][x] = '🌺';
                        } 
                        else if (season === 'Summer') {
                            // Drought: Swamps and shallows dry up into deadlands/deserts
                            if (tile === '≈' && random() < 0.3) chunkData[y][x] = 'd';
                            if (tile === '.' && random() < 0.05) chunkData[y][x] = 'D'; // Small sand patches
                        } 
                        else if (season === 'Autumn') {
                            // Leaves die, forests thin out into deadlands
                            if (tile === 'F' && random() < 0.2) chunkData[y][x] = 'd'; 
                            // Wild mushrooms grow aggressively
                            if ((tile === '.' || tile === 'F') && random() < 0.03) chunkData[y][x] = '🍄';
                        }
                    }
                }
            };
        }

        // ==========================================
        // 4. WEATHER SKEWING
        // ==========================================
        if (typeof window.updateWeather === 'function') {
            const origUpdateWeather = window.updateWeather;
            window.updateWeather = function() {
                // Call the original weather machine to generate the forecast
                origUpdateWeather();
                
                const season = window.getCurrentSeason();
                
                // Override the local forecast before the state machine executes it
                if (gameState.mapMode === 'overworld' && gameState.player.weatherState === 'calm') {
                    if (season === 'Winter') {
                        // Rain becomes Snow. Clear has a 20% chance to become Snow.
                        if (gameState.currentForecast === 'rain') gameState.currentForecast = 'snow';
                        else if (gameState.currentForecast === 'clear' && Math.random() < 0.20) gameState.currentForecast = 'snow';
                    } 
                    else if (season === 'Spring') {
                        // Snow becomes Rain. Clear has a 30% chance to become Rain.
                        if (gameState.currentForecast === 'snow') gameState.currentForecast = 'rain';
                        else if (gameState.currentForecast === 'clear' && Math.random() < 0.30) gameState.currentForecast = 'rain';
                    }
                    else if (season === 'Summer') {
                        // Summer is almost always clear. Snow is impossible.
                        if (gameState.currentForecast === 'snow') gameState.currentForecast = 'clear';
                        else if (gameState.currentForecast !== 'clear' && Math.random() < 0.60) gameState.currentForecast = 'clear';
                    }
                    else if (season === 'Autumn') {
                        // High winds and storms
                        if (gameState.currentForecast === 'clear' && Math.random() < 0.25) gameState.currentForecast = 'storm';
                    }
                }
            };
        }

        // ==========================================
        // 5. SEASONAL SURVIVAL MECHANICS
        // ==========================================
        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            window.endPlayerTurn = function(updates = {}) {
                
                // Only tick these massive overworld effects once every 15 turns to prevent log spam
                if (gameState.playerTurnCount % 15 === 0 && gameState.mapMode === 'overworld') {
                    const season = window.getCurrentSeason();
                    const p = gameState.player;
                    
                    if (season === 'Summer') {
                        // Intense Heat: Extra thirst drain
                        p.thirst = Math.max(0, p.thirst - 1);
                        if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('thirstDisplay'), false);
                    } 
                    else if (season === 'Winter') {
                        // Biting Cold: Drains stamina unless you have fire resistance or a torch!
                        const hasTorch = p.inventory.some(i => i && !i.isEquipped && (i.name === 'Torch' || i.name === 'Ever-Burning Candle'));
                        if (p.fireResistTurns <= 0 && !hasTorch) {
                            p.stamina = Math.max(0, p.stamina - 1);
                            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);
                        }
                    } 
                    else if (season === 'Spring') {
                        // Rebirth: Passive health regeneration
                        if (p.health < p.maxHealth && p.hunger > 0 && p.thirst > 0) {
                            p.health = Math.min(p.maxHealth, p.health + 1);
                            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('healthDisplay'), true);
                        }
                    } 
                    else if (season === 'Autumn') {
                        // The Great Harvest: Passive hunger regeneration
                        if (p.hunger < p.maxHunger) {
                            p.hunger = Math.min(p.maxHunger, p.hunger + 1);
                            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('hungerDisplay'), true);
                        }
                    }
                }
                
                // Call the original function to complete the save cycle
                if (origEndPlayerTurn) origEndPlayerTurn(updates);
            };
        }

        // ==========================================
        // 6. ENEMY MIGRATIONS
        // ==========================================
        if (typeof chunkManager !== 'undefined' && chunkManager.getEnemySpawn) {
            const origGetEnemySpawn = chunkManager.getEnemySpawn;
            
            chunkManager.getEnemySpawn = function(biome, distSq, random) {
                const season = window.getCurrentSeason();
                
                // 15% chance to intercept the spawn table and inject a seasonal enemy!
                if (Math.random() < 0.15) {
                    if (season === 'Winter' && (biome === '.' || biome === 'F')) return '⛄'; 
                    if (season === 'Spring' && biome === 'F') return '🍄s'; // Sporelings breed rapidly
                    if (season === 'Summer' && (biome === 'D' || biome === 'd')) return '🌞'; 
                    if (season === 'Autumn' && (biome === 'F' || biome === 'd')) return '👻p'; // Ghosts wander
                }
                
                return origGetEnemySpawn.call(this, biome, distSq, random);
            };
        }

        // ==========================================
        // 7. HOMESTEAD HARVEST BONUSES
        // ==========================================
        if (typeof window.harvestPlot === 'function') {
            const origHarvestPlot = window.harvestPlot;
            
            window.harvestPlot = function(plotIndex) {
                const p = gameState.player;
                const plot = p.gardenPlots ? p.gardenPlots[plotIndex] : null;
                
                if (plot) {
                    const turnsPassed = gameState.playerTurnCount - plot.plantedAt;
                    const seedData = typeof window.FARMING_DATA !== 'undefined' ? window.FARMING_DATA.seeds[plot.seedName] : null;
                    
                    if (seedData && (turnsPassed / seedData.turnsToGrow) * 100 >= 100) {
                        const season = window.getCurrentSeason();
                        
                        // In Autumn, crops yield an extra clone of themselves!
                        if (season === 'Autumn') {
                            const templateId = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === seedData.yields);
                            const template = window.ITEM_DATA[templateId];
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(p) : 9;
                            
                            if (templateId && template && p.inventory.length < invCap) {
                                let bonusItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                                bonusItem.templateId = templateId;
                                bonusItem.quantity = 1;
                                bonusItem.isEquipped = false;
                                p.inventory.push(bonusItem);
                                logMessage(`{orange:Autumn Harvest Bonus! (+1 ${seedData.yields})}`);
                            }
                        }
                    }
                }
                
                origHarvestPlot(plotIndex);
            };
        }
    }
});

// --- END OF FILE expansion-seasons.js ---
