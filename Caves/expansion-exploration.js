// --- START OF FILE expansion-exploration.js ---

window.ExpansionManager.register({
    id: "exploration_expanded",
    name: "Expanded Exploration",
    version: "1.0",
    
    data: {
        // --- 1. NEW MICRO-DUNGEON ENTRANCES ---
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
            }
        }
    },

    init: function() {
        // ==========================================
        // FEATURE 1: MICRO-DUNGEON GENERATION
        // ==========================================
        // We safely intercept the cave generator. If it's a "micro" dungeon, we 
        // generate a single 7x7 room instead of a massive procedural maze!
        
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
                    roomKey = 'The Spider\'s Nest';
                    bossTile = '@'; // Giant Spider
                } else if (caveId.includes('hollow')) {
                    themeKey = 'OVERGROWN';
                    roomKey = 'The Botanist\'s Enclave';
                    bossTile = '🌳c'; // Corrupted Treant
                } else if (caveId.includes('crevasse')) {
                    themeKey = 'ICE';
                    roomKey = 'Frozen Armory';
                    bossTile = 'Y'; // Yeti
                }
                
                this.caveThemes[caveId] = themeKey;
                const theme = window.CAVE_THEMES[themeKey];
                const room = window.CAVE_ROOM_TEMPLATES[roomKey];
                
                // Build a map exactly the size of the room template + a border wall
                const mapHeight = room.height + 2;
                const mapWidth = room.width + 2;
                const map = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(theme.wall));
                
                this.caveEnemies[caveId] = [];
                
                // Stamp the room into the center
                for(let ry = 0; ry < room.height; ry++){
                    for(let rx = 0; rx < room.width; rx++){
                        const t = room.map[ry][rx];
                        let finalTile = t;
                        
                        if (t === 'W') finalTile = theme.wall;
                        else if (t === 'F' || t === '.') finalTile = theme.floor;
                        else if (window.ENEMY_DATA && window.ENEMY_DATA[t]) {
                            // Convert enemy markers to floor, and spawn the entity
                            finalTile = theme.floor;
                            const tData = window.ENEMY_DATA[t];
                            const eId = `${caveId}:${rx+1},${ry+1}`;
                            
                            // Boost their stats slightly for the micro-dungeon
                            const scaled = { ...tData, maxHealth: Math.floor(tData.maxHealth * 1.5), xp: tData.xp * 2 };
                            this.caveEnemies[caveId].push(this._createInstancedEnemy(eId, rx+1, ry+1, t, scaled, tData));
                        }
                        
                        map[ry+1][rx+1] = finalTile;
                    }
                }
                
                // Spawn the Mini-Boss in the center of the room!
                map[Math.floor(mapHeight/2)][Math.floor(mapWidth/2)] = bossTile;
                const bData = window.ENEMY_DATA[bossTile];
                if (bData) {
                    const bossScaled = { ...bData, isBoss: true, isElite: true, maxHealth: bData.maxHealth * 3, attack: bData.attack + 2, xp: bData.xp * 4 };
                    this.caveEnemies[caveId].push(this._createInstancedEnemy(`${caveId}:boss`, Math.floor(mapWidth/2), Math.floor(mapHeight/2), bossTile, bossScaled, bData));
                }
                
                // Ensure a loot chest always spawns
                map[2][Math.floor(mapWidth/2)] = '📦';
                
                // The Entrance/Exit is always at the bottom center
                map[mapHeight-1][Math.floor(mapWidth/2)] = '>';
                
                this.caveMaps[caveId] = map;
                return map;
            }
            
            // If it's a normal cave, run the original generator!
            return origGenerateCave.call(this, caveId);
        };

        // ==========================================
        // FEATURE 2: NATURAL WORLD SPAWNING
        // ==========================================
        // We safely post-process chunks right after they are generated to sprinkle
        // our new micro-dungeons across the world!

        const origGenerateChunk = chunkManager.generateChunk;
        chunkManager.generateChunk = function(chunkX, chunkY) {
            origGenerateChunk.call(this, chunkX, chunkY);
            
            const chunkId = `${chunkX},${chunkY}`;
            const chunkData = this.loadedChunks[chunkId];
            
            // Predictable PRNG for this specific chunk
            const random = Alea(stringToSeed(`micro_spawn_${chunkId}`));
            
            // 25% chance per chunk to contain a micro-dungeon!
            if (random() < 0.25) { 
                const rx = Math.floor(random() * 14) + 1;
                const ry = Math.floor(random() * 14) + 1;
                const tile = chunkData[ry][rx];
                
                // Spawn contextually based on the terrain it picked
                if (tile === 'F' || tile === '🌳') chunkData[ry][rx] = '🌲h'; // Hollowed tree in forest
                else if (tile === 'd' || tile === '≈') chunkData[ry][rx] = '🕸️b'; // Spider burrow in deadlands/swamp
                else if (tile === '❄️' || tile === '🧊') chunkData[ry][rx] = '🧊c'; // Crevasse in snow/ice
            }
        };

        // ==========================================
        // FEATURE 3: DYNAMIC WEATHER PHYSICS
        // ==========================================
        // Hook into the end of the player's turn to physically alter the world around them
        // based on the current weather forecast!
        
        const origEndPlayerTurn = window.endPlayerTurn;
        window.endPlayerTurn = function(turnUpdates = {}) {
            
            if (typeof gameState !== 'undefined' && gameState.mapMode === 'overworld') {
                const p = gameState.player;
                
                // Throttle this to run only once every 3 turns to save CPU
                if (gameState.weather !== 'clear' && gameState.playerTurnCount % 3 === 0) {
                    
                    let mapUpdatedLocally = false;
                    const updatesToFirebase = {};
                    
                    // Scan a 7x7 grid around the player
                    for(let dy = -3; dy <= 3; dy++) {
                        for(let dx = -3; dx <= 3; dx++) {
                            const tx = p.x + dx;
                            const ty = p.y + dy;
                            const tile = chunkManager.getTile(tx, ty);
                            
                            // ❄️ ICE BRIDGES: Snow freezes water temporarily!
                            if (gameState.weather === 'snow' && (tile === '~' || tile === '≈')) {
                                // Set the tile to Ice with a TTL of 1 hour (melts automatically!)
                                chunkManager.setWorldTile(tx, ty, '🧊', 1);
                                mapUpdatedLocally = true;
                            }
                            
                            // 🌧️ SPRING SHOWERS: Rain sprouts flora in forests!
                            else if (gameState.weather === 'rain' && tile === 'F') {
                                if (Math.random() < 0.02) {
                                    const sprout = Math.random() > 0.8 ? '🌺' : '🍄';
                                    // Sprout lives for 4 in-game hours before withering
                                    chunkManager.setWorldTile(tx, ty, sprout, 4);
                                    mapUpdatedLocally = true;
                                }
                            }
                        }
                    }
                    
                    if (mapUpdatedLocally && typeof render === 'function') {
                        gameState.mapDirty = true;
                        render();
                    }
                }
            }

            // Call the original function so saves and standard ticking still happen!
            if (origEndPlayerTurn) origEndPlayerTurn(turnUpdates);
        };

    }
});

// --- END OF FILE expansion-exploration.js ---
