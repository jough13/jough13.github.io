// --- START OF FILE expansion-exploration.js ---

window.ExpansionManager.register({
    id: "exploration_expanded",
    name: "Expanded Exploration",
    version: "1.5", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        
        items: {
            '🕸️g': { 
                name: 'Gossamer Silk', type: 'trade', tile: '🕸️', 
                description: "Unbelievably strong and light. Dropped by giant arachnids in deep burrows.", value: 120, _rarity: 'rare' 
            },
            '🪵e': { 
                name: 'Elder Heartwood', type: 'trade', tile: '🪵', 
                description: "Wood that hums with ancient, verdant magic.", value: 150, _rarity: 'epic' 
            },
            '💧o': {
                name: 'Oasis Water', type: 'consumable', tile: '💧',
                description: "Pristine water from a deep underground spring. {blue:+50 Thirst}, {green:+5 HP}",
                _rarity: 'uncommon',
                effect: (state) => {
                    if (state.player.thirst >= state.player.maxThirst && state.player.health >= state.player.maxHealth) {
                        logMessage("You are completely refreshed.");
                        return false;
                    }
                    if (typeof window.modifyVital === 'function') {
                        window.modifyVital('thirst', 50);
                        window.modifyVital('health', 5);
                    } else {
                        state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 50);
                        state.player.health = Math.min(state.player.maxHealth, state.player.health + 5);
                    }
                    logMessage("{blue:The water is perfectly crisp and restorative.}");
                    if (typeof triggerStatAnimation !== 'undefined') {
                        triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
                        triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
                    }
                    return true;
                }
            },
            // --- EXPANSION WIN: New Tactical Items ---
            '🍄l': {
                name: 'Luminous Spore', type: 'consumable', tile: '🍄',
                description: "A glowing fungus. Crush it to release a cloud of bioluminescent dust. {gold:Grants Candlelight for 50 turns without costing Mana.}",
                _rarity: 'uncommon',
                effect: (state) => {
                    logMessage("{yellow:You crush the spore, and glowing dust fills the air around you!}");
                    state.player.candlelightTurns = Math.max(state.player.candlelightTurns || 0, 50);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 15);
                    return true;
                }
            },
            '🧊s': {
                name: 'Glacial Shard', type: 'consumable', tile: '🧊',
                description: "A piece of never-melting ice. Throw to deal 15 Frost damage and inflict {cyan:Frostbite}.",
                _rarity: 'rare',
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{cyan:Select a direction to hurl the Glacial Shard... (WASD/Arrows)}");
                    state.isAiming = true;
                    // Binds perfectly into the alchemy throwing engine!
                    state.abilityToAim = 'throwPotion_Glacial Shard'; 
                    return false;
                }
            }
        },

        // --- 2. NEW MICRO-DUNGEON ENTRANCES ---

        tiles: {
            '🕸️b': {
                type: 'dungeon_entrance',
                name: 'Spider Burrow',
                flavor: "A dark hole covered in thick, sticky webbing. Something chatters below.",
                getCaveId: (x, y) => `micro_spider_${x}_${y}`
            },
            '🌲h': {
                type: 'dungeon_entrance',
                name: 'Hollowed Elder Tree',
                flavor: "The massive roots part to reveal a hidden underground enclave.",
                getCaveId: (x, y) => `micro_hollow_${x}_${y}`
            },
            '🧊c': {
                type: 'dungeon_entrance',
                name: 'Glacial Crevasse',
                flavor: "A sheer drop into the freezing depths of the ice.",
                getCaveId: (x, y) => `micro_crevasse_${x}_${y}`
            },
            '🔥s': {
                type: 'dungeon_entrance',
                name: 'Scorched Sinkhole',
                flavor: "A collapsed sinkhole emitting waves of blistering heat.",
                getCaveId: (x, y) => `micro_scorch_${x}_${y}`
            },
            '🏝️g': {
                type: 'dungeon_entrance',
                name: 'Oasis Grotto',
                flavor: "A hidden underground spring surrounded by glowing desert flora.",
                getCaveId: (x, y) => `micro_oasis_${x}_${y}`
            },
            '🏰r': {
                type: 'dungeon_entrance',
                name: 'Forgotten Cellar',
                flavor: "Crumbling stone steps descend into a forgotten storage cellar.",
                getCaveId: (x, y) => `micro_cellar_${x}_${y}`
            }
        },

        // --- 3. CUSTOM MICRO-DUNGEON ROOMS ---

        roomTemplates: {
            "Micro Spider Den": {
                width: 5, height: 5,
                map: [' WWWWW ', 'W🕸️.🕸️W', 'W..@..W', 'W🕸️.🕸️W', ' WWWWW ']
            },
            "Micro Elder Hollow": {
                width: 5, height: 5,
                map: [' WWWWW ', 'W🌿.🌿W', 'W..🌳c.W', 'W🌿.🌿W', ' WWWWW ']
            },
            "Micro Glacial Rift": {
                width: 5, height: 5,
                map: [' WWWWW ', 'W🧊.🧊W', 'W..Y..W', 'W🧊.🧊W', ' WWWWW ']
            },
            "Micro Lava Vent": {
                width: 5, height: 5,
                map: [' WWWWW ', 'W🔥.🔥W', 'W..f..W', 'W🔥.🔥W', ' WWWWW ']
            },
            "Micro Oasis Grotto": {
                width: 5, height: 5,
                map: [' WWWWW ', 'W🌿.🌿W', 'W.~🐸~W', 'W🌿.🌿W', ' WWWWW ']
            },
            "Micro Forgotten Cellar": {
                width: 5, height: 5,
                map: [' WWWWW ', 'W🛢..📦W', 'W..Z..W', 'W⚰️...W', ' WWWWW ']
            }
        },
        
        // Throwing definition for the Glacial Shard (Intercepts Alchemy engine)
        alchemyRecipes: {
            "Glacial Shard": { materials: {}, xp: 0, level: 1, yield: 1, hidden: true }
        }
    },

    init: function() {
        
        // 🚨 OVERRIDE: Register Glacial Shard in the Potion Engine to allow throwing
        if (typeof window.ITEM_DATA !== 'undefined' && window.ITEM_DATA['🧊s']) {
            window.ITEM_DATA['🧊s'].pColor = '#7dd3fc';
            window.ITEM_DATA['🧊s'].pSize = 25;
            
            // Re-route the effect definition so the engine can look it up correctly!
            if (typeof ITEM_DATA !== 'undefined' && !ITEM_DATA['Glacial Shard']) {
                ITEM_DATA['Glacial Shard'] = window.ITEM_DATA['🧊s'];
            }
        }

        // ==========================================
        // FEATURE 1: MICRO-DUNGEON GENERATION
        // ==========================================

        if (typeof chunkManager !== 'undefined' && chunkManager.generateCave) {
            const origGenerateCave = chunkManager.generateCave;
            
            chunkManager.generateCave = function(caveId) {
                if (caveId.startsWith('micro_')) {
                    if (this.caveMaps[caveId]) return this.caveMaps[caveId];
                    
                    // Determine theme and room based on the ID prefix
                    let themeKey = 'ROCK';
                    let roomKey = 'Treasure Nook'; 
                    let bossTile = 'g';
                    
                    if (caveId.includes('spider')) {
                        themeKey = 'FUNGAL';
                        roomKey = 'Micro Spider Den';
                        bossTile = '@'; 
                    } else if (caveId.includes('hollow')) {
                        themeKey = 'OVERGROWN';
                        roomKey = 'Micro Elder Hollow';
                        bossTile = '🌳c'; 
                    } else if (caveId.includes('crevasse')) {
                        themeKey = 'ICE';
                        roomKey = 'Micro Glacial Rift';
                        bossTile = 'Y'; 
                    } else if (caveId.includes('scorch')) {
                        themeKey = 'FIRE';
                        roomKey = 'Micro Lava Vent';
                        bossTile = 'f'; 
                    } else if (caveId.includes('oasis')) {
                        themeKey = 'SUNKEN';
                        roomKey = 'Micro Oasis Grotto';
                        bossTile = '🐸'; 
                    } else if (caveId.includes('cellar')) {
                        themeKey = 'CRYPT';
                        roomKey = 'Micro Forgotten Cellar';
                        bossTile = 'Z'; 
                    }
                    
                    this.caveThemes[caveId] = themeKey;
                    const theme = (typeof window.CAVE_THEMES !== 'undefined' && window.CAVE_THEMES[themeKey]) ? window.CAVE_THEMES[themeKey] : { wall: '▓', floor: '.' };
                    
                    const room = (typeof window.CAVE_ROOM_TEMPLATES !== 'undefined' && window.CAVE_ROOM_TEMPLATES[roomKey]) 
                        ? window.CAVE_ROOM_TEMPLATES[roomKey] 
                        : { width: 5, height: 5, map: [' WWWWW ', 'W.....W', 'W..g..W', 'W.....W', ' WWWWW '] };
                    
                    const mapHeight = room.height + 2;
                    const mapWidth = room.width + 2;
                    const map = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(theme.wall));
                    
                    this.caveEnemies[caveId] = [];
                    
                    const createEntity = typeof this._createInstancedEnemy === 'function' 
                        ? this._createInstancedEnemy.bind(this) 
                        : (id, x, y, tile, scaled, template) => ({ id, x, y, tile, name: scaled.name, health: scaled.maxHealth, maxHealth: scaled.maxHealth, attack: scaled.attack, defense: scaled.defense || 0, xp: scaled.xp, loot: template.loot });

                    for(let ry = 0; ry < room.height; ry++){
                        for(let rx = 0; rx < room.width; rx++){
                            const t = room.map[ry][rx];
                            let finalTile = t;
                            
                            if (t === 'W') finalTile = theme.wall;
                            else if (t === 'F' || t === '.') finalTile = theme.floor;
                            else if (typeof window.ENEMY_DATA !== 'undefined' && window.ENEMY_DATA[t] && t !== bossTile) {
                                finalTile = theme.floor;
                                const tData = window.ENEMY_DATA[t];
                                const eId = `${caveId}:${rx+1},${ry+1}`;
                                
                                const baseClone = typeof window.fastClone === 'function' ? window.fastClone(tData) : JSON.parse(JSON.stringify(tData));
                                const scaled = { 
                                    ...baseClone, 
                                    maxHealth: Math.floor((Number(baseClone.maxHealth) || 10) * 1.5), 
                                    xp: Math.floor((Number(baseClone.xp) || 5) * 2) 
                                };
                                this.caveEnemies[caveId].push(createEntity(eId, rx+1, ry+1, t, scaled, tData));
                            }
                            
                            map[ry+1][rx+1] = finalTile;
                        }
                    }
                    
                    // Spawn the Mini-Boss!
                    map[Math.floor(mapHeight/2)][Math.floor(mapWidth/2)] = bossTile;
                    const bData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA[bossTile] : null;
                    if (bData) {
                        const bossClone = typeof window.fastClone === 'function' ? window.fastClone(bData) : JSON.parse(JSON.stringify(bData));
                        const bossScaled = { 
                            ...bossClone, 
                            isBoss: true, 
                            isElite: true, 
                            maxHealth: Math.floor((Number(bossClone.maxHealth) || 20) * 3), 
                            attack: (Number(bossClone.attack) || 5) + 2, 
                            xp: Math.floor((Number(bossClone.xp) || 20) * 4) 
                        };
                        
                        // 🚨 BUG FIX WIN: Modify the clone, NOT the global dictionary template!
                        if (themeKey === 'FUNGAL') bossScaled.loot = '🕸️g';
                        if (themeKey === 'OVERGROWN') bossScaled.loot = '🪵e';
                        if (themeKey === 'SUNKEN') bossScaled.loot = '💧o';
                        if (themeKey === 'ICE') bossScaled.loot = '🧊s';
                        if (themeKey === 'CRYPT') bossScaled.loot = 'ancient_coin';

                        this.caveEnemies[caveId].push(createEntity(`${caveId}:boss`, Math.floor(mapWidth/2), Math.floor(mapHeight/2), bossTile, bossScaled, bData));
                    }
                    
                    // Ensure a loot chest always spawns near the back wall if one wasn't hardcoded into the template
                    if (!map.some(row => row.includes('📦'))) {
                        map[2][Math.floor(mapWidth/2)] = '📦';
                    }
                    
                    map[mapHeight-1][Math.floor(mapWidth/2)] = '>';
                    this.caveMaps[caveId] = map;
                    return map;
                }
                
                return origGenerateCave.call(this, caveId);
            };
        }

        // ==========================================
        // FEATURE 2: NATURAL WORLD SPAWNING
        // ==========================================

        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                const random = (typeof Alea !== 'undefined' && typeof stringToSeed !== 'undefined') 
                    ? Alea(stringToSeed(`micro_spawn_${chunkId}`)) 
                    : Math.random;
                
                if (random() < 0.25) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    const tile = chunkData[ry][rx];
                    
                    // Allow spawning on standard wilderness tiles
                    const allowedTerrain = ['F', '🌳', '≈', '❄️', '🧊', 'D', 'd', '.', '🧱'];
                    if (!allowedTerrain.includes(tile)) return;
                    
                    if (tile === 'F' || tile === '🌳') chunkData[ry][rx] = '🌲h'; 
                    else if (tile === '≈') chunkData[ry][rx] = '🕸️b'; 
                    else if (tile === '❄️' || tile === '🧊') chunkData[ry][rx] = '🧊c'; 
                    else if (tile === 'd') chunkData[ry][rx] = '🔥s'; 
                    else if (tile === 'D') chunkData[ry][rx] = '🏝️g'; 
                    else if (tile === '.' || tile === '🧱') chunkData[ry][rx] = '🏰r'; 
                }
            };
        }

        // ==========================================
        // FEATURE 3: DYNAMIC WEATHER PHYSICS (BATCH OPTIMIZED)
        // ==========================================

        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            window.endPlayerTurn = function(turnUpdates = {}) {
                
                if (typeof gameState !== 'undefined' && gameState.mapMode === 'overworld') {
                    const p = gameState.player;
                    
                    // Throttle this to run only once every 3 turns to save CPU
                    if (gameState.weather !== 'clear' && gameState.playerTurnCount % 3 === 0) {
                        
                        let hasLocalUpdates = false;
                        const weatherBatchPayload = {};
                        const now = Date.now();
                        
                        for(let dy = -3; dy <= 3; dy++) {
                            for(let dx = -3; dx <= 3; dx++) {
                                const tx = p.x + dx;
                                const ty = p.y + dy;
                                
                                const tile = chunkManager.getTile(tx, ty);
                                let newTile = null;
                                let ttlHours = 0;
                                let particleColor = null;
                                
                                // ❄️ ICE BRIDGES: Snow freezes water temporarily!
                                if (gameState.weather === 'snow' && (tile === '~' || tile === '≈')) {
                                    // 🚨 SAFEGUARD: Protect parked boats from freezing over and disappearing!
                                    if (tx === p.x && ty === p.y && (p.isBoating || p.isSailing)) continue;
                                    
                                    newTile = '🧊';
                                    ttlHours = 1;
                                    particleColor = '#e0f2fe';
                                    if (typeof AudioSystem !== 'undefined' && Math.random() < 0.05) AudioSystem.playTone(800, 'square', 0.1, 0.05, false, 100);
                                }
                                
                                // 🌧️ SPRING SHOWERS: Rain sprouts flora in forests!
                                else if (gameState.weather === 'rain' && tile === 'F') {
                                    if (Math.random() < 0.02) {
                                        // 5% chance for Luminous Spore, otherwise normal flora
                                        const roll = Math.random();
                                        if (roll > 0.95) newTile = '🍄l';
                                        else if (roll > 0.70) newTile = '🌺';
                                        else newTile = '🍄';
                                        
                                        ttlHours = 4;
                                        particleColor = newTile === '🌺' ? '#f472b6' : '#d946ef';
                                        if (typeof AudioSystem !== 'undefined' && Math.random() < 0.1) AudioSystem.playMelody([800, 1200], 'sine', 0.05, 0.02);
                                    }
                                }

                                // ⚡ DEADLANDS STORMS: Lightning ignites the ash!
                                else if (gameState.weather === 'storm' && tile === 'd') {
                                    if (Math.random() < 0.01) {
                                        newTile = '🔥';
                                        ttlHours = 0.5; // Lasts 30 mins
                                        particleColor = '#facc15';
                                    }
                                }
                                
                                // --- APPLY BATCHED UPDATES ---
                                if (newTile) {
                                    const cx = Math.floor(tx / 16);
                                    const cy = Math.floor(ty / 16);
                                    const lx = ((tx % 16) + 16) % 16;
                                    const ly = ((ty % 16) + 16) % 16;
                                    const chunkId = `${cx},${cy}`;
                                    const tileKey = `${lx},${ly}`;
                                    
                                    if (!chunkManager.worldState[chunkId]) chunkManager.worldState[chunkId] = {};
                                    
                                    const tileData = { t: newTile, expires: now + (ttlHours * 3600000) };
                                    chunkManager.worldState[chunkId][tileKey] = tileData;
                                    
                                    let realmPrefix = '';
                                    if (gameState.currentRealm !== 0 && gameState.currentRealm) realmPrefix = `realm_${gameState.currentRealm}/`;
                                    
                                    weatherBatchPayload[`worldState/${realmPrefix}${chunkId}/${tileKey}`] = tileData;
                                    hasLocalUpdates = true;
                                    
                                    if (particleColor && typeof ParticleSystem !== 'undefined') {
                                        ParticleSystem.createExplosion(tx, ty, particleColor, 3);
                                    }
                                }
                            }
                        }
                        
                        // 🚨 PERFORMANCE WIN: Push all terrain updates to Firebase atomically!
                        if (hasLocalUpdates) {
                            gameState.mapDirty = true;
                            if (typeof render === 'function') render();
                            
                            if (typeof rtdb !== 'undefined' && Object.keys(weatherBatchPayload).length > 0) {
                                rtdb.ref().update(weatherBatchPayload).catch(e => console.error("Weather Batch Error", e));
                            }
                        }
                    }
                }

                if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
            };
        }

        // ==========================================
        // FEATURE 4: MINIMAP INTEGRATION
        // ==========================================
        
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🕸️b'] = [15, 23, 42, 255];     // Very Dark Blue/Grey
            window.TILE_COLOR_MAP['🌲h'] = [6, 78, 59, 255];      // Deep Forest Green
            window.TILE_COLOR_MAP['🧊c'] = [186, 230, 253, 255];  // Pale Ice Blue
            window.TILE_COLOR_MAP['🔥s'] = [153, 27, 27, 255];    // Scorched Red
            window.TILE_COLOR_MAP['🏝️g'] = [34, 197, 94, 255];    // Emerald Green Oasis
            window.TILE_COLOR_MAP['🏰r'] = [68, 64, 60, 255];     // Stone Gray
            window.TILE_COLOR_MAP['🍄l'] = [250, 204, 21, 255];   // Bright Yellow Spore
        }
    }
});

// --- END OF FILE expansion-exploration.js ---
