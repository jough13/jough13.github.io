// --- START OF FILE expansion-seasons.js ---

window.ExpansionManager.register({
    id: "seasons_of_the_realm",
    name: "Seasons of the Realm (Dynamic Live-Ops)",
    version: "1.3", // Upgraded version!
    
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
                    if (typeof window.modifyVital === 'function') window.modifyVital('health', state.player.maxHealth);
                    else state.player.health = state.player.maxHealth;
                    
                    state.player.poisonTurns = 0;
                    logMessage("{green:The Spring Blossom revitalizes your body completely!}");
                    
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#4ade80', 20);
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
                    if (typeof window.modifyVital === 'function') {
                        window.modifyVital('hunger', state.player.maxHunger);
                        window.modifyVital('stamina', state.player.maxStamina);
                    } else {
                        state.player.hunger = state.player.maxHunger;
                        state.player.stamina = state.player.maxStamina;
                    }
                    
                    logMessage("{yellow:The Autumn Harvest fills your belly and restores your energy!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 20);
                    return true;
                }
            },
            // NEW SEASONAL WEAPONS
            '⚔️sun': {
                name: 'Sun-Forged Blade', type: 'weapon', tags: ['blade', 'fire'], tile: '⚔️',
                damage: 8, slot: 'weapon', statBonuses: { strength: 2 }, inflicts: 'burn', inflictChance: 0.3,
                description: "{red:+8 Dmg}, {green:+2 Str}. Radiates the intense heat of the Summer sun.", _rarity: 'epic'
            },
            '🪓gla': {
                name: 'Glacial Axe', type: 'weapon', tags: ['axe', 'frost'], tile: '🪓',
                damage: 9, isTwoHanded: true, slot: 'weapon', statBonuses: { constitution: 2 }, inflicts: 'frostbite', inflictChance: 0.3,
                description: "{red:+9 Dmg}, {green:+2 Con}. A heavy blade of never-melting ice. (Two-Handed)", _rarity: 'epic'
            }
        },

        // --- 2. SEASONAL BOSSES / ENEMIES ---
        enemies: {
            '⛄': {
                name: 'Frost Colossus', tags: ['elemental', 'frost', 'giant'], mountable: false,
                maxHealth: 80, attack: 12, defense: 4, xp: 200,
                color: '#7dd3fc', loot: '❄️c', isElite: true,
                inflicts: 'frostbite', inflictChance: 0.4,
                flavor: "A towering mass of ice and packed snow. It brings the blizzard with it."
            },
            '🌞': {
                name: 'Solar Flare', tags: ['elemental', 'fire', 'flying'], mountable: false,
                maxHealth: 60, attack: 15, defense: 1, xp: 200,
                color: '#facc15', loot: '☀️e', isElite: true,
                inflicts: 'burn', inflictChance: 0.5,
                flavor: "A blinding sphere of superheated plasma."
            },
            '🌸w': {
                name: 'Verdant Warden', tags: ['elemental', 'wood', 'magic'], mountable: false,
                maxHealth: 70, attack: 8, defense: 3, xp: 180,
                color: '#4ade80', loot: '🌸s', isElite: true,
                inflicts: 'root', inflictChance: 0.4,
                flavor: "A towering protector woven from blooming spring flora."
            },
            '🎃s': {
                name: 'Harvester Spirit', tags: ['undead', 'ethereal'], type: 'spirit', mountable: false,
                maxHealth: 50, attack: 14, defense: 0, xp: 180,
                color: '#f97316', loot: '🍁a', isElite: true,
                flavor: "A restless ghost that haunts the dying autumn fields."
            }
        },
        
        // --- 3. SEASONAL SHOPS ---
        shops: {
            // A wandering "Time Weaver" merchant could sell these, but for now we add them to the Bazaar
            trader: [
                { name: 'Spring Blossom', price: 500, stock: 1 },
                { name: 'Autumn Harvest', price: 500, stock: 1 }
            ]
        },

        // --- 4. SEASONAL RECIPES ---
        // Native dictionary injection!
        craftingRecipes: {
            "Sun-Forged Blade": { materials: { "Summer Ember": 1, "Iron Sword": 1, "Arcane Dust": 5 }, xp: 150, level: 5 },
            "Glacial Axe": { materials: { "Winter Core": 1, "Greataxe": 1, "Arcane Dust": 5 }, xp: 150, level: 5 }
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
                else if (season === 'Spring') { seasonColor = '#4ade80'; icon = '🌸'; }
                else if (season === 'Summer') { seasonColor = '#facc15'; icon = '☀️'; }
                else if (season === 'Autumn') { seasonColor = '#f97316'; icon = '🍁'; }

                // 🚨 UI WIN: Appends cleanly because the base engine explicitly overwrites `timeDisplay.textContent` first!
                timeDisplay.innerHTML += ` <span style="color: ${seasonColor}; font-weight: bold;" class="drop-shadow-sm ml-2 border-l border-gray-600 pl-2" title="${season} Season">${icon} ${season}</span>`;
            }
        };

        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const parts = raw.split(' ');
                const command = parts[0].toLowerCase();
                
                if (command === 'season' && parts[1]) {
                    // Admin Guard
                    const ADMIN_EMAILS = ["your.email@gmail.com", "admin@cavesandcastles.com"];
                    if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
                        logMessage("{red:Unauthorized. The Time Weavers ignore you.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }

                    const requested = parts[1].toLowerCase();
                    if (requested === 'winter') window.OVERRIDE_SEASON = 'Winter';
                    else if (requested === 'spring') window.OVERRIDE_SEASON = 'Spring';
                    else if (requested === 'summer') window.OVERRIDE_SEASON = 'Summer';
                    else if (requested === 'autumn') window.OVERRIDE_SEASON = 'Autumn';
                    else if (requested === 'clear') window.OVERRIDE_SEASON = null;
                    else {
                        logMessage("{gray:Usage: /season [winter|spring|summer|autumn|clear]}");
                        return;
                    }
                    
                    logMessage(`{purple:The Time Weavers violently shift the timeline. It is now ${window.getCurrentSeason()}.}`);
                    
                    // Massive Temporal Shift Effects
                    if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playTimelineShift === 'function') {
                        AudioSystem.playTimelineShift();
                    }
                    if (typeof gameState !== 'undefined') {
                        gameState.screenShake = 30;
                        gameState.screenFlash = { color: '#a855f7', alpha: 0.6, decay: 0.02 };
                    }
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#a855f7', 40);
                    }

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
                        if (typeof window.modifyVital === 'function') window.modifyVital('thirst', -1);
                        else p.thirst = Math.max(0, p.thirst - 1);
                        
                        if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('thirstDisplay'), false);
                    } 
                    else if (season === 'Winter') {
                        // Biting Cold: Drains stamina unless you have fire resistance or a torch!
                        // Removed !i.isEquipped so holding a torch in an off-hand slot protects you!
                        const hasTorch = p.inventory.some(i => i && (i.name === 'Torch' || i.name === 'Ever-Burning Candle'));
                        if (p.fireResistTurns <= 0 && !hasTorch) {
                            if (typeof window.modifyVital === 'function') window.modifyVital('stamina', -1);
                            else p.stamina = Math.max(0, p.stamina - 1);
                            
                            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);
                        }
                    } 
                    else if (season === 'Spring') {
                        // Rebirth: Passive health regeneration
                        if (p.health < p.maxHealth && p.hunger > 0 && p.thirst > 0) {
                            if (typeof window.modifyVital === 'function') window.modifyVital('health', 1);
                            else p.health = Math.min(p.maxHealth, p.health + 1);
                            
                            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('healthDisplay'), true);
                        }
                    } 
                    else if (season === 'Autumn') {
                        // The Great Harvest: Passive hunger regeneration
                        if (p.hunger < p.maxHunger) {
                            if (typeof window.modifyVital === 'function') window.modifyVital('hunger', 1);
                            else p.hunger = Math.min(p.maxHunger, p.hunger + 1);
                            
                            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('hungerDisplay'), true);
                        }
                    }
                }
                
                // Use .apply to safely pass all original arguments forward!
                if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
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
                    if (season === 'Spring' && biome === 'F') return '🌸w'; // Verdant Warden
                    if (season === 'Summer' && (biome === 'D' || biome === 'd')) return '🌞'; 
                    if (season === 'Autumn' && (biome === 'F' || biome === 'd')) return '🎃s'; // Harvester Spirit
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
                
                // 1. Capture the plot state BEFORE the original function runs and potentially wipes it
                const plotBefore = p.gardenPlots ? p.gardenPlots[plotIndex] : null;
                
                let seedData = null;
                let isFullyGrown = false;
                
                if (plotBefore) {
                    const turnsPassed = gameState.playerTurnCount - plotBefore.plantedAt;
                    seedData = typeof window.FARMING_DATA !== 'undefined' ? window.FARMING_DATA.seeds[plotBefore.seedName] : null;
                    
                    if (seedData && (turnsPassed / seedData.turnsToGrow) * 100 >= 100) {
                        isFullyGrown = true;
                    }
                }
                
                // 2. Call original logic to handle standard harvesting, XP, and inventory capacity checks
                origHarvestPlot(plotIndex);
                
                const plotAfter = p.gardenPlots ? p.gardenPlots[plotIndex] : null;
                
                // Infinite Harvest Prevention
                // We only grant the bonus if the original function actually SUCCEEDED and cleared the plot!
                // Previously, players could trigger the harvest with a full inventory, abort the base 
                // harvest, but still receive the Autumn bonus indefinitely!
                if (plotBefore && plotAfter === null && isFullyGrown && seedData) {
                    const season = window.getCurrentSeason();
                    
                    // In Autumn, crops yield an extra clone of themselves!
                    if (season === 'Autumn') {
                        // 🚀 PERFORMANCE WIN: High-speed cross-expansion integration!
                        // Looks up the homestead crop cache first instead of iterating global dictionary.
                        let templateId = null;
                        if (typeof getFarmItemKey === 'function') {
                            templateId = getFarmItemKey(seedData.yields);
                        } else if (typeof window.ITEM_DATA !== 'undefined') {
                            templateId = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === seedData.yields);
                        }
                        
                        const template = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA[templateId] : null;
                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(p) : 9;
                        
                        if (templateId && template && p.inventory.length < invCap) {
                            let bonusItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                            bonusItem.templateId = templateId;
                            bonusItem.quantity = 1;
                            bonusItem.isEquipped = false;
                            p.inventory.push(bonusItem);
                            
                            logMessage(`{orange:Autumn Harvest Bonus! (+1 ${seedData.yields})}`);
                            
                            // Sparkles!
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(p.x, p.y, "BONUS", "#f97316");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                        }
                    }
                }
            };
        }
    }
});

// --- END OF FILE expansion-seasons.js ---
