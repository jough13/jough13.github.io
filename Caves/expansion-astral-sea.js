// --- START OF FILE expansion-astral-sea.js ---

window.ExpansionManager.register({
    id: "astral_sea",
    name: "The Astral Sea (Sailing Expansion)",
    version: "1.6", // Upgraded version!
    
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

                    logMessage("{cyan:You drop anchor and lower the Diving Bell into the abyssal depths...}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.2, 1000); 
                    
                    // JUICE WIN: Massive deep-sea splash
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#1e40af', 30);
                    state.screenShake = 15;
                    
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Vehicle Dismount!
                    // If we don't turn off 'isSailing', the player will literally sail their galleon INSIDE the dungeon!
                    state.player.isSailing = false;
                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(state.player.x, state.player.y, '⛵'); 
                    if (typeof playerRef !== 'undefined' && playerRef) playerRef.update({ isSailing: false });

                    // Setup the Dungeon
                    state.mapMode = 'dungeon';
                    state.currentCaveId = `shipwreck_${state.player.x}_${state.player.y}`;
                    state.overworldExit = { x: state.player.x, y: state.player.y };
                    
                    // Generate the dungeon
                    const caveMap = chunkManager.generateCave(state.currentCaveId);
                    
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Safe Spawn Fallback
                    // Prevents NaN coordinate crash if the generator failed to place a stairwell
                    let spawnX = null, spawnY = null;
                    for (let y = 0; y < caveMap.length; y++) {
                        const x = caveMap[y].indexOf('>');
                        if (x !== -1) { spawnX = x; spawnY = y; break; }
                    }
                    if (spawnX === null) {
                        spawnX = Math.floor(caveMap[0].length / 2);
                        spawnY = Math.floor(caveMap.length / 2);
                        caveMap[spawnY][spawnX] = '>'; // Force place one
                    }
                    
                    state.player.x = spawnX; 
                    state.player.y = spawnY;
                    
                    const baseEnemies = chunkManager.caveEnemies[state.currentCaveId] || [];
                    
                    // 🚀 PERFORMANCE WIN: High-speed recursive clone over JSON stringify
                    state.instancedEnemies = typeof window.fastClone === 'function' ? window.fastClone(baseEnemies) : JSON.parse(JSON.stringify(baseEnemies));
                    
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
                    
                    // 🚨 GAMEPLAY WIN: Smart Oceanic Raycasting
                    // Guarantees the Pirate Cove actually spawns in deep water instead of the middle of a desert!
                    let tx = state.player.x;
                    let ty = state.player.y;
                    let foundOcean = false;
                    
                    // Expanded to 100 attempts to ensure it almost never fails even in huge continents
                    for (let attempt = 0; attempt < 100; attempt++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 2000 + Math.random() * 2000; 
                        const checkX = Math.floor(state.player.x + Math.cos(angle) * dist);
                        const checkY = Math.floor(state.player.y + Math.sin(angle) * dist);
                        
                        const tileAt = typeof chunkManager !== 'undefined' ? chunkManager.getTile(checkX, checkY) : '~';
                        if (tileAt === '~') {
                            tx = checkX;
                            ty = checkY;
                            foundOcean = true;
                            break;
                        }
                    }
                    
                    // 🚨 ROBUSTNESS WIN: Failsafe Ocean Telemetry
                    if (!foundOcean) {
                        tx = state.player.x + 5000;
                        ty = state.player.y + 5000; 
                    }

                    // Actually spawn the dungeon entrance via worldState so it exists when they arrive!
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.setWorldTile(tx, ty, '⚓c', 168); // Lasts 7 in-game days (168 hrs)
                    }

                    // QoL WIN: Automatically add a custom map pin to the player's map!
                    if (!state.player.customPins) state.player.customPins = [];
                    // Prevent duplicate pins
                    if (!state.player.customPins.some(p => p.x === tx && p.y === ty)) {
                        state.player.customPins.push({ x: tx, y: ty });
                    }
                    
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
            // --- EXPANSION WIN: New Gear ---
            '🧥k': {
                name: 'Kraken-Hide Tunic', type: 'armor', tile: '🧥', defense: 5, slot: 'armor',
                statBonuses: { endurance: 3, dexterity: 2 }, _rarity: 'legendary',
                description: "{blue:+5 Def}, {green:+3 End, +2 Dex}. Woven from the beast of the depths. \n{blue:Passive: Grants permanent Water Breathing (Gills).}"
            },
            '🍺r': {
                name: 'Spiced Rum', type: 'consumable', tile: '🍺', _rarity: 'uncommon',
                description: "Burns going down. {yellow:+30 Stamina, +20 Psyche}, {red:-2 Wits (50 turns)}",
                effect: (state) => {
                    if (typeof window.modifyVital === 'function') {
                        window.modifyVital('stamina', 30);
                        window.modifyVital('psyche', 20);
                    } else {
                        state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 30);
                        state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + 20);
                    }
                    
                    // Applies a minor debuff to represent being slightly drunk!
                    state.player.witsBonus = (state.player.witsBonus || 0) - 2;
                    state.player.witsBonusTurns = Math.max(state.player.witsBonusTurns || 0, 50);
                    
                    logMessage("{orange:You chug the rum. You feel fearless, but dizzy. (+30 Stam, +20 Psyche, -2 Wits)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('staminaDisplay'), 'stat-pulse-yellow');
                    
                    // 🎨 JUICE WIN: Screen wobble!
                    state.screenShake = 8;
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
                name: 'Abyssal Siren', tags: ['humanoid', 'aquatic', 'magic', 'void', 'boss'], mountable: false,
                maxHealth: 150, attack: 8, defense: 2, xp: 300,
                caster: true, castRange: 5, spellDamage: 10, inflicts: 'madness', inflictChance: 0.5,
                color: '#a855f7', loot: '🐚', isBoss: true,
                flavor: "Her song doesn't draw you into the water—it pulls the water into your lungs."
            }
        },

        // --- 3. NEW TILES & DUNGEON THEMES ---
        tiles: {
            '⚓c': {
                type: 'dungeon_entrance', name: 'Pirate Cove',
                flavor: "A hidden cove dug into the side of the island. Skulls line the entrance.",
                getCaveId: (x, y) => `pirate_${x}_${y}`
            },
            '🚢g': {
                type: 'landmark', name: 'Derelict Galleon',
                flavor: "A massive ship floating silently on the waves. The sails are torn to shreds.",
                eventId: 'DERELICT_GALLEON'
            }
        },
        
        // 🌟 LORE WIN: Interactive Ocean Event
        events: {
            'DERELICT_GALLEON': {
                title: "The Ghost Ship",
                oncePerTile: true,
                lootedMessage: "Only the rotting, empty hull remains.",
                nodes: {
                    'start': {
                        text: "You pull alongside the massive, silent galleon. The deck is covered in algae, and the ship's wheel spins lazily in the wind. There is no crew in sight.",
                        choices: [
                            {
                                text: "Board the ship and search the cargo hold.",
                                action: (state, ctx) => {
                                    logMessage("{gray:You carefully step onto the rotting deck...}");
                                    
                                    // Ambush Check!
                                    if (Math.random() < 0.40) {
                                        logMessage("{red:It's a trap! Drowned Buccaneers pour out from the lower decks!}");
                                        state.screenShake = 15;
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                        
                                        // Spawn 2 Drowned Buccaneers
                                        const eData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['👻p'] : { name: 'Drowned Buccaneer', maxHealth: 35, attack: 6, xp: 50 };
                                        const offsets = [[-1, 0], [1, 0]];
                                        offsets.forEach(off => {
                                            const ex = ctx.x + off[0];
                                            const ey = ctx.y + off[1];
                                            
                                            // Only spawn if it's open water or the ship tile
                                            const tAt = typeof chunkManager !== 'undefined' ? chunkManager.getTile(ex, ey) : '~';
                                            if (tAt === '~' || tAt === '🚢g') {
                                                const enemyId = `overworld:${ex},${-ey}`;
                                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, ex, ey) : eData;
                                                
                                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: '👻p', x: ex, y: ey, spawnTime: Date.now() };
                                                
                                                // Ensure Spatial Map is updated instantly so they attack!
                                                if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, null, null, ex, ey);

                                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                                            }
                                        });
                                    } else {
                                        const gold = 200 + Math.floor(Math.random() * 300);
                                        // Strict coercion
                                        state.player.coins = (Number(state.player.coins) || 0) + gold;
                                        
                                        // Tell the Anti-Cheat system this gold is legitimate!
                                        if (typeof window.trackLegitimateGold === 'function') {
                                            window.trackLegitimateGold(gold);
                                        }
                                        
                                        logMessage(`{gold:The hold is unguarded! You plunder ${gold} gold coins!}`);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                                        
                                        // 🚨 BUG FIX WIN: Improved Outward Spiral Drop
                                        // Ensures drops can safely land on adjacent land tiles if the ship is near shore!
                                        const dropSafely = (itemKey) => {
                                            let placed = false;
                                            if (typeof chunkManager !== 'undefined') {
                                                for (let r = 0; r <= 2 && !placed; r++) {
                                                    for (let dy = -r; dy <= r && !placed; dy++) {
                                                        for (let dx = -r; dx <= r && !placed; dx++) {
                                                            const tx = ctx.x + dx;
                                                            const ty = ctx.y + dy;
                                                            const tileAt = chunkManager.getTile(tx, ty);
                                                            if (tileAt === '~' || tileAt === '🛟' || tileAt === '🚢g' || tileAt === '.' || tileAt === 'D' || tileAt === 'F') {
                                                                chunkManager.setWorldTile(tx, ty, itemKey, 24);
                                                                placed = true;
                                                            }
                                                        }
                                                    }
                                                }
                                                if (!placed) chunkManager.setWorldTile(ctx.x, ctx.y, itemKey, 24);
                                                state.mapDirty = true;
                                            }
                                        };

                                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                        const existingRum = state.player.inventory.find(i => i && i.name === 'Spiced Rum' && !i.isEquipped);
                                        
                                        if (existingRum) {
                                            existingRum.quantity += 2;
                                            logMessage("{purple:You also found a stash of Spiced Rum!}");
                                        } else if (state.player.inventory.length < invCap) {
                                            const rumTemplate = window.ITEM_DATA['🍺r'];
                                            const newRum = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(rumTemplate) : JSON.parse(JSON.stringify(rumTemplate));
                                            newRum.templateId = '🍺r'; newRum.quantity = 2; newRum.isEquipped = false;
                                            newRum.effect = rumTemplate.effect; // Rebind the effect manually just in case
                                            
                                            state.player.inventory.push(newRum);
                                            logMessage("{purple:You also found a stash of Spiced Rum!}");
                                        } else {
                                            logMessage("{red:You found a stash of Spiced Rum, but your pack is full! It drops onto the deck.}");
                                            dropSafely('🍺r'); // Safer than sinking!
                                        }
                                        
                                        // 🌟 LORE WIN: Ghost Ship Documents
                                        if (Math.random() < 0.3) {
                                            const journalTemplate = window.ITEM_DATA['📜p2'];
                                            if (state.player.inventory.length < invCap) {
                                                const newJ = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(journalTemplate) : JSON.parse(JSON.stringify(journalTemplate));
                                                newJ.templateId = '📜p2'; newJ.quantity = 1; newJ.isEquipped = false;
                                                state.player.inventory.push(newJ);
                                                logMessage("{cyan:You found a Sodden Journal!}");
                                            } else {
                                                dropSafely('📜p2');
                                            }
                                        }
                                    }
                                    
                                    // Mark as looted and sink the ship visually into Flotsam
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '🛟'); 
                                    state.mapDirty = true;
                                    
                                    if (typeof renderStats === 'function') renderStats();
                                    if (typeof renderInventory === 'function') renderInventory();
                                }
                            },
                            { text: "Leave it alone. It's cursed." }
                        ]
                    }
                }
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
            ],
            black_market: [
                { name: 'Kraken-Hide Tunic', price: 3000, stock: 1 }
            ]
        },

        // --- 5. CUSTOM ROOM TEMPLATES ---
        roomTemplates: {
            "Captain's Quarters": {
                width: 7, height: 7,
                map: [' WWWWW ', 'W📦.🛏️.W', 'W.....W', 'W..🏴‍☠️c.W', 'W.....W', 'W..🍺r.W', ' WWWWW ']
            },
            "Flooded Cargo Hold": {
                width: 9, height: 5,
                map: [' WWWWWWW ', 'W📦.≈.📦W', 'W.≈.👻p.W', 'W.📦.≈..W', ' WWWWWWW ']
            }
        }
    },

    // --- 6. ENGINE HOOKS ---
    init: function() {
        const logger = window.ExpansionManager.getLogger("Astral Sea");

        const applySafePatch = (target, method, factory) => {
            if (typeof window.ExpansionManager.patchFunction === 'function') {
                window.ExpansionManager.patchFunction(target, method, factory);
            } else {
                const orig = target[method];
                target[method] = factory(orig ? orig.bind(target) : null);
            }
        };
        
        // 1. INJECT ISLAND GENERATION INTO THE WORLD RENDERER
        if (typeof chunkManager !== 'undefined') {
            applySafePatch(chunkManager, 'generateChunk', (origGenerateChunk) => {
                return function(chunkX, chunkY) {
                    if (origGenerateChunk) origGenerateChunk.call(this, chunkX, chunkY);
                    
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
                                
                                // Deterministic PRNG seeded specifically to this world coordinate
                                const random = typeof Alea !== 'undefined' ? Alea(typeof stringToSeed !== 'undefined' ? stringToSeed(`ocean_${worldX}_${worldY}`) : 1) : Math.random;
                                
                                if (islandNoise > 0.85) {
                                    chunkData[y][x] = 'D'; // Sand beach
                                    
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
                                } 
                                // Use the deterministic `random()` instead of `Math.random()` to prevent ships flickering!
                                else if (islandNoise > 0.80 && random() < 0.005) {
                                    // Blockading Pirate Ships sitting just off the coast!
                                    chunkData[y][x] = '🏴‍☠️';
                                }
                                
                                // 🌟 EVENT WIN: Ghost Ships floating in the deep sea
                                if (random() < 0.002 && distSq > 4000000) {
                                    chunkData[y][x] = '🚢g';
                                }
                            }
                        }
                    }
                };
            });

            // 2. INJECT DUNGEON THEME OVERRIDES
            // We monkey-patch the cave generator so our custom Dungeon Entrances map to our new Themes!
            applySafePatch(chunkManager, 'generateCave', (origGenerateCave) => {
                return function(caveId) {
                    // Let the original function build the maze
                    const map = origGenerateCave ? origGenerateCave.call(this, caveId) : [];
                    
                    // If it's a shipwreck or pirate cove, forcefully repaint the walls and floors
                    // to match the correct aesthetic, bypassing the random theme picker!
                    if (caveId.startsWith('shipwreck_') || caveId.startsWith('pirate_')) {
                        const themeKey = caveId.startsWith('shipwreck_') ? 'SUNKEN_SHIPWRECK' : 'PIRATE_COVE';
                        const oldThemeKey = this.caveThemes[caveId]; // Whatever it randomly picked
                        this.caveThemes[caveId] = themeKey; // Override
                        
                        const newTheme = window.CAVE_THEMES[themeKey];
                        const oldTheme = window.CAVE_THEMES[oldThemeKey] || { wall: '▓', floor: '.', secretWall: '▒' };
                        
                        // Safe Theme Replacement
                        // Preserves custom decorative tiles and items stamped by the room generator!
                        for(let y = 0; y < map.length; y++) {
                            for(let x = 0; x < map[y].length; x++) {
                                if (map[y][x] === oldTheme.wall) map[y][x] = newTheme.wall;
                                else if (map[y][x] === oldTheme.floor) map[y][x] = newTheme.floor;
                                else if (map[y][x] === oldTheme.secretWall) map[y][x] = newTheme.secretWall;
                            }
                        }

                        // Safe Entity Instantiator Fallback
                        const createEntity = typeof this._createInstancedEnemy === 'function' 
                            ? this._createInstancedEnemy.bind(this) 
                            : (id, x, y, tile, scaled, template) => ({ id, x, y, tile, name: scaled.name, health: scaled.maxHealth, maxHealth: scaled.maxHealth, attack: scaled.attack, defense: scaled.defense || 0, xp: scaled.xp, loot: template.loot });

                        // 🚨 EXPANSION WIN: Injected Thematic Bosses!
                        // Both the Pirate Cove and the Sunken Shipwreck get a guaranteed Boss at the center!
                        const cy = Math.floor(map.length / 2);
                        const cx = Math.floor(map[0].length / 2);
                            
                        // Ensure we don't spawn the boss inside a wall or on the stairs
                        if (map[cy] && map[cy][cx] !== undefined && (map[cy][cx] === newTheme.floor || map[cy][cx] === oldTheme.floor)) {
                            
                            let bossTile = '🏴‍☠️c';
                            let baseBossData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['🏴‍☠️c'] : null;
                            
                            // Override if Shipwreck
                            if (themeKey === 'SUNKEN_SHIPWRECK') {
                                bossTile = '🧜‍♀️c';
                                baseBossData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['🧜‍♀️c'] : null;
                            }

                            if (baseBossData) {
                                map[cy][cx] = bossTile;
                                // Safe Fast Clone
                                const baseClone = typeof window.fastClone === 'function' ? window.fastClone(baseBossData) : JSON.parse(JSON.stringify(baseBossData));
                                const scaled = { ...baseClone, maxHealth: baseClone.maxHealth, attack: baseClone.attack, xp: baseClone.xp }; 
                                
                                this.caveEnemies[caveId].push(createEntity(`${caveId}:boss`, cx, cy, bossTile, scaled, baseBossData));
                            }
                        }
                    }
                    return map;
                };
            });
        }

        // 3. PASSIVE GEAR ENGINE HOOK
        // Apply Kraken-Hide Tunic Gills!
        applySafePatch(window, 'endPlayerTurn', (origEndPlayerTurn) => {
            return function(updates = {}) {
                if (typeof gameState !== 'undefined' && gameState.player && gameState.player.equipment) {
                    const armor = gameState.player.equipment.armor;
                    if (armor) {
                        const templateId = armor.templateId || (typeof window.ITEM_DATA !== 'undefined' ? Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === armor.name) : null);
                        
                        if (templateId === '🧥k' || armor.name.includes('Kraken')) {
                            // Permanent Water Breathing!
                            gameState.player.waterBreathingTurns = Math.max(gameState.player.waterBreathingTurns || 0, 2);
                        }
                    }
                }
                
                if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
            };
        });

        // 4. INJECT COLORS INTO THE MINIMAP CACHE
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🏴‍☠️'] = [17, 24, 39, 255];  // Black Ship
            window.TILE_COLOR_MAP['⚓c'] = [133, 77, 14, 255]; // Wood/Brown Cove
            window.TILE_COLOR_MAP['🍺r'] = [234, 179, 8, 255]; // Gold/Rum
            window.TILE_COLOR_MAP['🚢g'] = [55, 65, 81, 255];  // Gray Ghost Ship
        }
        
        logger.log("Astral Sea generation hooks active.");
    }
});

// --- END OF FILE expansion-astral-sea.js ---
