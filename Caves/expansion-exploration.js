:// --- START OF FILE expansion-exploration.js ---

window.ExpansionManager.register({
    id: "exploration_expanded",
    name: "Expanded Exploration",
    version: "1.3", // Upgraded version!
    
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
                    window.modifyVital('thirst', 50);
                    window.modifyVital('health', 5);
                    logMessage("{blue:The water is perfectly crisp and restorative. (+50 Thirst, +5 HP)}");
                    if (typeof triggerStatAnimation !== 'undefined') {
                        triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
                        triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
                    }
                    return true;
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
            }
        }
    },

    init: function() {
        // ==========================================
        // FEATURE 1: MICRO-DUNGEON GENERATION
        // ==========================================
        // We safely intercept the cave generator. If it's a "micro" dungeon, we 
        // generate a single 5x5 room instead of a massive procedural maze!
        
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
                        bossTile = '@'; // Giant Spider
                    } else if (caveId.includes('hollow')) {
                        themeKey = 'OVERGROWN';
                        roomKey = 'Micro Elder Hollow';
                        bossTile = '🌳c'; // Corrupted Treant
                    } else if (caveId.includes('crevasse')) {
                        themeKey = 'ICE';
                        roomKey = 'Micro Glacial Rift';
                        bossTile = 'Y'; // Yeti
                    } else if (caveId.includes('scorch')) {
                        themeKey = 'FIRE';
                        roomKey = 'Micro Lava Vent';
                        bossTile = 'f'; // Fire Elemental
                    } else if (caveId.includes('oasis')) {
                        themeKey = 'SUNKEN';
                        roomKey = 'Micro Oasis Grotto';
                        bossTile = '🐸'; // Giant Toad
                    }
                    
                    this.caveThemes[caveId] = themeKey;
                    const theme = (typeof window.CAVE_THEMES !== 'undefined' && window.CAVE_THEMES[themeKey]) ? window.CAVE_THEMES[themeKey] : { wall: '▓', floor: '.' };
                    
                    // Pull from our custom room dictionary
                    const room = (typeof window.CAVE_ROOM_TEMPLATES !== 'undefined' && window.CAVE_ROOM_TEMPLATES[roomKey]) 
                        ? window.CAVE_ROOM_TEMPLATES[roomKey] 
                        : { width: 5, height: 5, map: [' WWWWW ', 'W.....W', 'W..g..W', 'W.....W', ' WWWWW '] };
                    
                    // Build a map exactly the size of the room template + a border wall
                    const mapHeight = room.height + 2;
                    const mapWidth = room.width + 2;
                    const map = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(theme.wall));
                    
                    this.caveEnemies[caveId] = [];
                    
                    // 🚨 ROBUSTNESS WIN: Safe Entity Instantiator Fallback
                    const createEntity = typeof this._createInstancedEnemy === 'function' 
                        ? this._createInstancedEnemy.bind(this) 
                        : (id, x, y, tile, scaled, template) => ({ id, x, y, tile, name: scaled.name, health: scaled.maxHealth, maxHealth: scaled.maxHealth, attack: scaled.attack, defense: scaled.defense || 0, xp: scaled.xp, loot: template.loot });

                    // Stamp the room into the center
                    for(let ry = 0; ry < room.height; ry++){
                        for(let rx = 0; rx < room.width; rx++){
                            const t = room.map[ry][rx];
                            let finalTile = t;
                            
                            if (t === 'W') finalTile = theme.wall;
                            else if (t === 'F' || t === '.') finalTile = theme.floor;
                            else if (typeof window.ENEMY_DATA !== 'undefined' && window.ENEMY_DATA[t]) {
                                finalTile = theme.floor;
                                const tData = window.ENEMY_DATA[t];
                                const eId = `${caveId}:${rx+1},${ry+1}`;
                                
                                const scaled = { ...tData, maxHealth: Math.floor((tData.maxHealth || 10) * 1.5), xp: (tData.xp || 5) * 2 };
                                this.caveEnemies[caveId].push(createEntity(eId, rx+1, ry+1, t, scaled, tData));
                            }
                            
                            map[ry+1][rx+1] = finalTile;
                        }
                    }
                    
                    // Spawn the Mini-Boss in the center of the room!
                    map[Math.floor(mapHeight/2)][Math.floor(mapWidth/2)] = bossTile;
                    const bData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA[bossTile] : null;
                    if (bData) {
                        const bossScaled = { 
                            ...bData, 
                            isBoss: true, 
                            isElite: true, 
                            maxHealth: (bData.maxHealth || 20) * 3, 
                            attack: (bData.attack || 5) + 2, 
                            xp: (bData.xp || 20) * 4 
                        };
                        
                        // Inject unique drops onto the boss based on the dungeon type
                        if (themeKey === 'FUNGAL') bossScaled.loot = '🕸️g';
                        if (themeKey === 'OVERGROWN') bossScaled.loot = '🪵e';
                        if (themeKey === 'SUNKEN') bossScaled.loot = '💧o';

                        this.caveEnemies[caveId].push(createEntity(`${caveId}:boss`, Math.floor(mapWidth/2), Math.floor(mapHeight/2), bossTile, bossScaled, bData));
                    }
                    
                    // Ensure a loot chest always spawns near the back wall
                    map[2][Math.floor(mapWidth/2)] = '📦';
                    
                    // The Entrance/Exit is always at the bottom center
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
                
                // MULTIVERSE CHECK: Ensure we only spawn naturally in the Prime Realm
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                const random = (typeof Alea !== 'undefined' && typeof stringToSeed !== 'undefined') 
                    ? Alea(stringToSeed(`micro_spawn_${chunkId}`)) 
                    : Math.random;
                
                // 25% chance per chunk to contain a micro-dungeon!
                if (random() < 0.25) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    const tile = chunkData[ry][rx];
                    
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Terrain Overwrite Guard
                    // Prevents deleting Obelisks, NPCs, or Villages!
                    const allowedTerrain = ['F', '🌳', '≈', '❄️', '🧊', 'D', 'd'];
                    if (!allowedTerrain.includes(tile)) return;
                    
                    // Spawn contextually based on the terrain it picked
                    if (tile === 'F' || tile === '🌳') chunkData[ry][rx] = '🌲h'; // Hollowed tree in forest
                    else if (tile === '≈') chunkData[ry][rx] = '🕸️b'; // Spider burrow in swamp
                    else if (tile === '❄️' || tile === '🧊') chunkData[ry][rx] = '🧊c'; // Crevasse in snow/ice
                    else if (tile === 'd') chunkData[ry][rx] = '🔥s'; // Sinkhole in deadlands
                    else if (tile === 'D') chunkData[ry][rx] = '🏝️g'; // Oasis Grotto in the desert
                }
            };
        }

        // ==========================================
        // FEATURE 3: DYNAMIC WEATHER PHYSICS
        // ==========================================
        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            window.endPlayerTurn = function(turnUpdates = {}) {
                
                if (typeof gameState !== 'undefined' && gameState.mapMode === 'overworld') {
                    const p = gameState.player;
                    
                    // Throttle this to run only once every 3 turns to save CPU
                    if (gameState.weather !== 'clear' && gameState.playerTurnCount % 3 === 0) {
                        
                        let mapUpdatedLocally = false;
                        const now = Date.now();
                        
                        // Scan a 7x7 grid around the player safely
                        for(let dy = -3; dy <= 3; dy++) {
                            for(let dx = -3; dx <= 3; dx++) {
                                const tx = p.x + dx;
                                const ty = p.y + dy;
                                
                                // 🚨 BUG FIX WIN: The "Trapped in Ice" Boat Fix
                                if (tx === p.x && ty === p.y && (p.isBoating || p.isSailing)) continue;
                                
                                const tile = chunkManager.getTile(tx, ty);
                                
                                // ❄️ ICE BRIDGES: Snow freezes water temporarily!
                                if (gameState.weather === 'snow' && (tile === '~' || tile === '≈')) {
                                    // Set the tile to Ice with a TTL of 1 hour (melts automatically!)
                                    chunkManager.setWorldTile(tx, ty, '🧊', 1);
                                    mapUpdatedLocally = true;
                                    
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, '#e0f2fe', 3);
                                    if (typeof AudioSystem !== 'undefined' && Math.random() < 0.05) AudioSystem.playTone(800, 'square', 0.1, 0.05, false, 100);
                                }
                                
                                // 🌧️ SPRING SHOWERS: Rain sprouts flora in forests!
                                else if (gameState.weather === 'rain' && tile === 'F') {
                                    if (Math.random() < 0.02) {
                                        const sprout = Math.random() > 0.8 ? '🌺' : '🍄';
                                        // Sprout lives for 4 in-game hours before withering
                                        chunkManager.setWorldTile(tx, ty, sprout, 4);
                                        mapUpdatedLocally = true;
                                        
                                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, sprout === '🌺' ? '#f472b6' : '#d946ef', 4);
                                        if (typeof AudioSystem !== 'undefined' && Math.random() < 0.1) AudioSystem.playMelody([800, 1200], 'sine', 0.05, 0.02);
                                    }
                                }

                                // ⚡ DEADLANDS STORMS: Lightning ignites the ash!
                                else if (gameState.weather === 'storm' && tile === 'd') {
                                    if (Math.random() < 0.01) {
                                        chunkManager.setWorldTile(tx, ty, '🔥', 0.5); // Lasts 30 mins
                                        mapUpdatedLocally = true;
                                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(tx, ty, '#facc15', 5);
                                    }
                                }
                            }
                        }
                        
                        if (mapUpdatedLocally) {
                            gameState.mapDirty = true;
                            if (typeof render === 'function') render();
                        }
                    }
                }

                // Safely call the original function, passing the arguments forward
                if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
            };
        }

        // ==========================================
        // FEATURE 4: MINIMAP INTEGRATION
        // ==========================================
        
        // Inject the newly generated tiles into the global TILE_COLOR_MAP
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🕸️b'] = [15, 23, 42, 255];     // Very Dark Blue/Grey
            window.TILE_COLOR_MAP['🌲h'] = [6, 78, 59, 255];      // Deep Forest Green
            window.TILE_COLOR_MAP['🧊c'] = [186, 230, 253, 255];  // Pale Ice Blue
            window.TILE_COLOR_MAP['🔥s'] = [153, 27, 27, 255];    // Scorched Red
            window.TILE_COLOR_MAP['🏝️g'] = [34, 197, 94, 255];    // Emerald Green Oasis
        }
    }
});

// --- END OF FILE expansion-exploration.js ---
