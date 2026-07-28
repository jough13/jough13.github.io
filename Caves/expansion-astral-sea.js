// --- START OF FILE expansion-astral-sea.js ---

window.ExpansionManager.register({
    id: "astral_sea",
    name: "The Astral Sea (Sailing Expansion)",
    version: "1.1", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🔔': {
                name: 'Diving Bell', type: 'tool', tile: '🔔',
                description: "A heavy iron bell. Use while sailing on Deep Water to dive into Sunken Shipwrecks.",
                effect: (state) => {
                    if (!state.player.isSailing) {
                        logMessage("{red:You must be Sailing in the Deep Ocean to use the Diving Bell.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    
                    const tileAt = typeof chunkManager !== 'undefined' ? chunkManager.getTile(state.player.x, state.player.y) : null;
                    if (tileAt !== '~') {
                        logMessage("{red:The water here is too shallow to dive. Find Deep Water (~).}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }

                    logMessage("{cyan:You lower the Diving Bell into the abyssal depths...}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.2, 1000); 
                    
                    state.mapMode = 'dungeon';
                    state.currentCaveId = `shipwreck_${state.player.x}_${state.player.y}`;
                    state.overworldExit = { x: state.player.x, y: state.player.y };
                    
                    // Generate the dungeon
                    const caveMap = chunkManager.generateCave(state.currentCaveId);
                    
                    // Find spawn point
                    for (let y = 0; y < caveMap.length; y++) {
                        const x = caveMap[y].indexOf('>');
                        if (x !== -1) { state.player.x = x; state.player.y = y; break; }
                    }
                    
                    const baseEnemies = chunkManager.caveEnemies[state.currentCaveId] || [];
                    state.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
                    
                    if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
                    state.mapDirty = true;
                    if (typeof render === 'function') render();
                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    if (typeof finalizeMapTransition === 'function') finalizeMapTransition();
                    
                    return false; // Tool is reusable, don't consume!
                }
            },
            '🗺️p': {
                name: 'Pirate Treasure Map', type: 'treasure_map', tile: '🗺️',
                description: "Reveals the coordinates of a buried Pirate Cove deep in the ocean.",
                effect: (state) => {
                    if (state.mapMode !== 'overworld') {
                        logMessage("{red:You must be in the Overworld to read this.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    
                    // Generate coordinates FAR away (2000-4000 tiles out!)
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 2000 + Math.random() * 2000; 
                    const tx = Math.floor(state.player.x + Math.cos(angle) * dist);
                    const ty = Math.floor(state.player.y + Math.sin(angle) * dist);
                    
                    // 🚨 THE BUG FIX: Actually spawn the dungeon entrance via worldState so it exists when they arrive!
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.setWorldTile(tx, ty, '⚓c', 168); // Lasts 7 in-game days (168 hrs)
                    }

                    // QoL WIN: Automatically add a custom map pin to the player's map!
                    if (!state.player.customPins) state.player.customPins = [];
                    state.player.customPins.push({ x: tx, y: ty });
                    
                    logMessage(`{gold:The map reveals a hidden Pirate Cove at (${tx}, ${-ty})! A pin has been added to your map.}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    
                    state.mapDirty = true;
                    return true; // Consume map
                }
            },
            '🔫': {
                name: 'Hand Cannon', type: 'weapon', tags: ['crossbow', 'armor_piercing', 'firearm'], tile: '🔫',
                damage: 15, range: 6, isTwoHanded: true, slot: 'weapon', skillId: 'ranged_attack',
                description: "{red:+15 Dmg}. A devastating black-powder weapon. Fires Cannonballs.", _rarity: 'legendary'
            },
            '💣c': {
                name: 'Cannonball', type: 'ammo', tile: '💣', slot: 'ammo', damage: 5,
                description: "Heavy iron balls for Hand Cannons. {red:+5 Dmg}"
            },
            '🎩p': {
                name: 'Captain\'s Tricorne', type: 'armor', tile: '🎩', defense: 3, slot: 'armor',
                statBonuses: { charisma: 5, luck: 5 }, description: "{blue:+3 Def}, {gold:+5 Cha, +5 Luck}. Yar.", _rarity: 'epic'
            },
            '🍺r': {
                name: 'Spiced Rum', type: 'consumable', tile: '🍺', _rarity: 'uncommon',
                description: "Burns going down. {yellow:+30 Stamina, +20 Psyche}, {red:-2 Wits (50 turns)}",
                effect: (state) => {
                    window.modifyVital('stamina', 30);
                    window.modifyVital('psyche', 20);
                    
                    // Applies a minor debuff to represent being slightly drunk!
                    state.player.witsBonus = (state.player.witsBonus || 0) - 2;
                    state.player.witsBonusTurns = 50;
                    
                    logMessage("{orange:You chug the rum. You feel fearless, but dizzy. (+30 Stam, +20 Psyche, -2 Wits)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('staminaDisplay'), 'stat-pulse-yellow');
                    return true;
                }
            },
            '⚓w': {
                name: 'Dredged Anchor', type: 'weapon', tags: ['blunt'], tile: '⚓',
                damage: 12, isTwoHanded: true, slot: 'weapon', statBonuses: { strength: 4, dexterity: -3 },
                description: "{red:+12 Dmg}, {green:+4 Str}, {gray:-3 Dex}. Impossibly heavy. (Two-Handed)", _rarity: 'rare'
            },
            '📜p2': {
                name: 'Sodden Journal', type: 'journal', title: 'Mutiny', tile: '📜',
                content: "The Captain has gone mad. He claims the Leviathan spoke to him, told him to sail into the black fog. We strike at midnight. If I fall, tell my wife I died an honest pirate."
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '🏴‍☠️': {
                name: 'Pirate Galleon', tags: ['construct', 'wood'], mountable: false,
                maxHealth: 150, attack: 15, defense: 5, xp: 300,
                isRanged: true, range: 6, color: '#111827', loot: '🗺️p',
                flavor: "A massive ship flying the black flag. Its cannons are aimed right at you!"
            },
            '👻p': {
                name: 'Drowned Buccaneer', tags: ['undead', 'aquatic'], mountable: false,
                maxHealth: 35, attack: 6, defense: 2, xp: 50,
                color: '#0ea5e9', loot: 'ancient_coin',
                flavor: "Covered in barnacles. He still clutches his rusted cutlass."
            },
            '🏴‍☠️c': {
                name: 'Pirate Captain', tags: ['humanoid', 'boss'], mountable: false,
                maxHealth: 250, attack: 12, defense: 4, xp: 800,
                isRanged: true, range: 5, color: '#dc2626', loot: '🔫', isBoss: true,
                flavor: "He laughs maniacally, leveling his Hand Cannon at your chest."
            },
            '🧜‍♀️c': {
                name: 'Abyssal Siren', tags: ['humanoid', 'aquatic', 'magic', 'void'], mountable: false,
                maxHealth: 50, attack: 8, defense: 2, xp: 120,
                caster: true, castRange: 5, spellDamage: 10, inflicts: 'madness', inflictChance: 0.5,
                color: '#a855f7', loot: '🐚',
                flavor: "Her song doesn't draw you into the water—it pulls the water into your lungs."
            }
        },

        // --- 3. NEW TILES & DUNGEON THEMES ---
        tiles: {
            '⚓c': {
                type: 'dungeon_entrance', name: 'Pirate Cove',
                flavor: "A hidden cove dug into the side of the island. Skulls line the entrance.",
                getCaveId: (x, y) => `pirate_${x}_${y}`
            }
        },
        caveThemes: {
            'SUNKEN_SHIPWRECK': {
                name: 'Sunken Shipwreck',
                wall: '~', floor: '=', secretWall: '▒', // Surrounded by water, walking on planks
                colors: { wall: '#1e3a8a', floor: '#451a03' },
                decorations: ['📦w', '⚓', '🐚', '🦴'],
                enemies: ['👻p', '🦀', '🦈', '🧜‍♀️c']
            },
            'PIRATE_COVE': {
                name: 'Pirate Cove',
                wall: '▓', floor: 'D', secretWall: '🏚', // Sand floors
                colors: { wall: '#57534e', floor: '#fde047' },
                decorations: ['🌴', '📦', '$', '🛢'],
                enemies: ['b', 'C', '👻p'] 
            }
        },

        // --- 4. SHOPS ---
        shops: {
            castle: [
                { name: 'Diving Bell', price: 1500, stock: 1 },
                { name: 'Cannonball', price: 10, stock: 50 }
            ]
        }
    },

    // --- 5. ENGINE HOOKS ---
    init: function() {
        
        // 1. INJECT ISLAND GENERATION INTO THE WORLD RENDERER
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                // Only process islands in Realm 0
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                // Loop through the chunk and spawn islands in deep water
                for(let y = 0; y < 16; y++) {
                    for(let x = 0; x < 16; x++) {
                        const worldX = chunkX * 16 + x;
                        const worldY = chunkY * 16 + y;
                        const distSq = (worldX * worldX) + (worldY * worldY);
                        
                        // Deep Ocean Check (> 1000 tiles from spawn)
                        if (chunkData[y][x] === '~' && distSq > 1000000) { 
                            // Custom Perlin Noise threshold for islands
                            const islandNoise = typeof elevationNoise !== 'undefined' ? elevationNoise.noise(worldX / 15 + 5000, worldY / 15 + 5000) : 0;
                            
                            if (islandNoise > 0.85) {
                                chunkData[y][x] = 'D'; // Sand beach
                                
                                const random = typeof Alea !== 'undefined' ? Alea(stringToSeed(`island_${worldX}_${worldY}`)) : Math.random;
                                
                                // Flora & Features (LORE WIN: Dynamic island populations!)
                                const rVal = random();
                                if (rVal < 0.05) chunkData[y][x] = '🌴';
                                else if (rVal < 0.08) chunkData[y][x] = '∴'; // Dig spot!
                                else if (rVal < 0.10) chunkData[y][x] = '🦀'; // Giant crab!
                                else if (rVal < 0.11) chunkData[y][x] = '🍺r'; // Washed up rum

                                // Pirate Coves (Rare)
                                if (islandNoise > 0.92 && random() < 0.05) {
                                    chunkData[y][x] = '⚓c';
                                }
                            } else if (islandNoise > 0.80 && Math.random() < 0.005) {
                                // Blockading Pirate Ships sitting just off the coast!
                                chunkData[y][x] = '🏴‍☠️';
                            }
                        }
                    }
                }
            };
        }

        // 2. INJECT DUNGEON THEME OVERRIDES
        // We monkey-patch the cave generator so our custom Dungeon Entrances map to our new Themes!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCave) {
            const origGenerateCave = chunkManager.generateCave;
            
            chunkManager.generateCave = function(caveId) {
                // Let the original function build the maze
                const map = origGenerateCave.call(this, caveId);
                
                // If it's a shipwreck or pirate cove, forcefully repaint the walls and floors
                // to match the correct aesthetic, bypassing the random theme picker!
                if (caveId.startsWith('shipwreck_') || caveId.startsWith('pirate_')) {
                    const themeKey = caveId.startsWith('shipwreck_') ? 'SUNKEN_SHIPWRECK' : 'PIRATE_COVE';
                    const oldThemeKey = this.caveThemes[caveId]; // Whatever it randomly picked
                    this.caveThemes[caveId] = themeKey; // Override
                    
                    const newTheme = window.CAVE_THEMES[themeKey];
                    const oldTheme = window.CAVE_THEMES[oldThemeKey] || { wall: '▓', floor: '.' };
                    
                    // Repaint the map array O(N)
                    for(let y = 0; y < map.length; y++) {
                        for(let x = 0; x < map[y].length; x++) {
                            if (map[y][x] === oldTheme.wall) map[y][x] = newTheme.wall;
                            else if (map[y][x] === oldTheme.floor) map[y][x] = newTheme.floor;
                        }
                    }

                    // Special Rule: Spawn the Pirate Captain in Pirate Coves!
                    if (themeKey === 'PIRATE_COVE') {
                        const cy = Math.floor(map.length / 2);
                        const cx = Math.floor(map[0].length / 2);
                        if (map[cy][cx] === newTheme.floor || map[cy][cx] === oldTheme.floor) {
                            map[cy][cx] = '🏴‍☠️c';
                            const bData = window.ENEMY_DATA['🏴‍☠️c'];
                            this.caveEnemies[caveId].push(this._createInstancedEnemy(`${caveId}:boss`, cx, cy, '🏴‍☠️c', bData, bData));
                        }
                    }
                }
                return map;
            };
        }

        // 3. INJECT THEMATIC ROOM TEMPLATES
        if (typeof window.CAVE_ROOM_TEMPLATES !== 'undefined') {
            window.CAVE_ROOM_TEMPLATES["Captain's Quarters"] = {
                width: 7, height: 7,
                map: [' WWWWW ', 'W📦.🛏️.W', 'W.....W', 'W..🏴‍☠️c.W', 'W.....W', 'W..🍺r.W', ' WWWWW ']
            };
            window.CAVE_ROOM_TEMPLATES["Flooded Cargo Hold"] = {
                width: 9, height: 5,
                map: [' WWWWWWW ', 'W📦.≈.📦W', 'W.≈.👻p.W', 'W.📦.≈..W', ' WWWWWWW ']
            };
            window.CACHED_ROOM_TEMPLATES = null; // Force cache rebuild
        }

        // 4. INJECT COLORS INTO THE MINIMAP CACHE
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🏴‍☠️'] = [17, 24, 39, 255];  // Black Ship
            window.TILE_COLOR_MAP['⚓c'] = [133, 77, 14, 255]; // Wood/Brown Cove
            window.TILE_COLOR_MAP['🍺r'] = [234, 179, 8, 255]; // Gold/Rum
        }
    }
});

// --- END OF FILE expansion-astral-sea.js ---
