// --- START OF FILE expansion-monster-hunter.js ---

window.ExpansionManager.register({
    id: "monster_hunter",
    name: "The Monster Hunter (Tracking & Trophies)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🔪h': {
                name: "Hunter's Knife", type: 'tool', tile: '🔪',
                description: "A serrated, incredibly sharp blade. Essential for carving trophies from Apex Predators.", _rarity: 'uncommon'
            },
            
            // Trophies
            '🐉s': { name: 'Apex Drake Scale', type: 'trade', tile: '🐉', description: "It radiates intense heat. Required for Drakebane gear.", _rarity: 'epic' },
            '👁️v': { name: 'Apex Void Core', type: 'trade', tile: '👁️', description: "It whispers in a language you don't understand.", _rarity: 'epic' },
            '🦍p': { name: 'Apex Behemoth Pelt', type: 'trade', tile: '🦍', description: "Incredibly thick and heavy fur. Can stop a blade.", _rarity: 'epic' },

            // Hunter Armor
            '🛡️db': {
                name: 'Drakebane Mail', type: 'armor', tile: '🛡️', defense: 8, slot: 'armor',
                statBonuses: { strength: 5, constitution: 3 },
                description: "{blue:+8 Def}, {green:+5 Str, +3 Con}. \n{orange:Passive: Grants immunity to Fire and Lava.}", _rarity: 'legendary'
            },
            '🧥vs': {
                name: 'Voidstalker Cowl', type: 'armor', tile: '🧥', defense: 6, slot: 'armor',
                statBonuses: { wits: 8, perception: 4 },
                description: "{blue:+6 Def}, {purple:+8 Wits, +4 Per}. \n{fuchsia:Passive: Grants complete immunity to Void Madness.}", _rarity: 'legendary'
            },
            '🛡️bp': {
                name: 'Behemoth Plate', type: 'armor', tile: '🛡️', defense: 12, slot: 'armor',
                statBonuses: { endurance: 6, constitution: 5 },
                description: "{blue:+12 Def}, {green:+6 End, +5 Con}. \n{green:Passive: Grants permanent Thorns (Reflect 5 Dmg).}", _rarity: 'legendary'
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '🐉a': {
                name: 'Apex Drake', tags: ['beast', 'reptile', 'dragon', 'fire', 'boss'], mountable: false,
                maxHealth: 600, attack: 18, defense: 8, xp: 1200,
                caster: true, castRange: 4, spellDamage: 25, inflicts: 'burn', inflictChance: 0.8,
                color: '#dc2626', loot: '🥩d', isBoss: true, isElite: true,
                flavor: "An ancient terror of the skies. Its scales are as hard as steel."
            },
            '👁️a': {
                name: 'Apex Void Terror', tags: ['void', 'monster', 'ethereal', 'boss'], mountable: false,
                maxHealth: 500, attack: 12, defense: 4, xp: 1500,
                caster: true, castRange: 6, spellDamage: 20, inflicts: 'madness', inflictChance: 1.0, teleporter: true,
                color: '#7c3aed', loot: '🥩v', isBoss: true, isElite: true,
                flavor: "It phases in and out of reality, turning the area around it into a waking nightmare."
            },
            '🦍a': {
                name: 'Apex Behemoth', tags: ['beast', 'giant', 'boss'], mountable: false,
                maxHealth: 1000, attack: 22, defense: 5, xp: 1000,
                inflicts: 'stun', inflictChance: 0.4,
                color: '#78350f', loot: '🥩b', isBoss: true, isElite: true,
                flavor: "A towering mass of muscle and rage that shatters the earth when it walks."
            }
        },

        // --- 3. NEW TILES ---
        tiles: {
            '🐾': {
                type: 'anomaly', name: 'Monster Tracks',
                flavor: "Deep gouges in the earth left by an enormous creature.",
                onInteract: (state, x, y) => {
                    if (typeof window.handleMonsterTrack === 'function') window.handleMonsterTrack(state, x, y);
                    return null;
                }
            },
            // Carcasses
            '🥩d': {
                type: 'anomaly', name: 'Slain Drake', flavor: "The massive corpse of an Apex Drake. It is still smoking.",
                onInteract: (state, x, y) => { if (typeof window.carveMonster === 'function') window.carveMonster(state, x, y, 'Apex Drake Scale', '🥩d'); return null; }
            },
            '🥩v': {
                type: 'anomaly', name: 'Slain Void Terror', flavor: "The remains of a Void Terror. It is dissolving into purple mist.",
                onInteract: (state, x, y) => { if (typeof window.carveMonster === 'function') window.carveMonster(state, x, y, 'Apex Void Core', '🥩v'); return null; }
            },
            '🥩b': {
                type: 'anomaly', name: 'Slain Behemoth', flavor: "The mountain of fur and muscle that was the Apex Behemoth.",
                onInteract: (state, x, y) => { if (typeof window.carveMonster === 'function') window.carveMonster(state, x, y, 'Apex Behemoth Pelt', '🥩b'); return null; }
            },
            // Lairs
            '🐉L': { type: 'dungeon_entrance', name: 'Scorched Roost', flavor: "The air here is blisteringly hot.", getCaveId: (x, y) => `hunter_drake_${x}_${y}` },
            '👁️L': { type: 'dungeon_entrance', name: 'Tear in Reality', flavor: "The sky above this crater is completely black.", getCaveId: (x, y) => `hunter_void_${x}_${y}` },
            '🦍L': { type: 'dungeon_entrance', name: 'Shattered Cavern', flavor: "The trees have been ripped out by the roots to form this den.", getCaveId: (x, y) => `hunter_behemoth_${x}_${y}` }
        },

        // --- 4. SHOPS ---
        shops: {
            castle: [
                { name: 'Hunter\'s Knife', price: 300, stock: 1 }
            ],
            trader: [
                { name: 'Hunter\'s Knife', price: 250, stock: 1 }
            ]
        }
    },

    // --- 5. ENGINE HOOKS ---
    init: function() {

        // ==========================================
        // 1. ADD CRAFTING RECIPES FOR HUNTER GEAR
        // ==========================================
        if (typeof window.CRAFTING_RECIPES !== 'undefined') {
            window.CRAFTING_RECIPES["Drakebane Mail"] = { materials: { "Apex Drake Scale": 1, "Steel Armor": 1, "Elemental Core": 3 }, xp: 250, level: 5 };
            window.CRAFTING_RECIPES["Voidstalker Cowl"] = { materials: { "Apex Void Core": 1, "Silk Cowl": 1, "Void Dust": 5 }, xp: 250, level: 5 };
            window.CRAFTING_RECIPES["Behemoth Plate"] = { materials: { "Apex Behemoth Pelt": 1, "Studded Armor": 1, "Stone": 20 }, xp: 250, level: 5 };
        }

        // ==========================================
        // 2. TRACKING & CARVING LOGIC
        // ==========================================
        window.handleMonsterTrack = function(state, x, y) {
            const p = state.player;
            if (!p.activeHunt) p.activeHunt = { stage: 0, targetX: 0, targetY: 0, monster: null };

            // Determine if starting a new hunt or continuing
            let isNewHunt = false;
            if (p.activeHunt.stage === 0 || (p.activeHunt.targetX !== x && p.activeHunt.targetY !== y)) {
                isNewHunt = true;
                const monsters = ['Drake', 'Void Terror', 'Behemoth'];
                p.activeHunt = {
                    stage: 1,
                    monster: monsters[Math.floor(Math.random() * monsters.length)],
                    targetX: x, targetY: y
                };
            } else {
                p.activeHunt.stage++;
            }

            // Audio & Visuals
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 800); // Rustling sound
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#facc15', 10);
            state.screenShake = 5;

            // Generate Next Point (30 to 50 tiles away)
            let placedNext = false;
            let nextX = x, nextY = y;

            for (let attempts = 0; attempts < 50; attempts++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.floor(Math.random() * 20);
                const tx = Math.floor(x + Math.cos(angle) * dist);
                const ty = Math.floor(y + Math.sin(angle) * dist);

                const tileAt = chunkManager.getTile(tx, ty);
                if (['.', 'F', 'd', 'D'].includes(tileAt)) {
                    nextX = tx; nextY = ty;
                    placedNext = true;
                    break;
                }
            }

            if (!placedNext) {
                logMessage("{gray:The trail runs cold. You lost the scent.}");
                p.activeHunt = { stage: 0 };
                chunkManager.setWorldTile(x, y, '.');
                return;
            }

            // Place the next step!
            if (p.activeHunt.stage >= 3) {
                // SPAWN THE LAIR!
                let lairTile = '🦍L';
                if (p.activeHunt.monster === 'Drake') lairTile = '🐉L';
                if (p.activeHunt.monster === 'Void Terror') lairTile = '👁️L';
                
                chunkManager.setWorldTile(nextX, nextY, lairTile);
                
                // Add marker to map
                state.activeTreasure = { x: nextX, y: nextY };
                
                logMessage(`{red:You found the lair of the Apex ${p.activeHunt.monster}! It is marked on your map.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                
                p.activeHunt = { stage: 0 }; // Reset hunt state
            } else {
                // Spawn next track
                chunkManager.setWorldTile(nextX, nextY, '🐾');
                p.activeHunt.targetX = nextX;
                p.activeHunt.targetY = nextY;
                
                const dirStr = typeof getDirectionString === 'function' ? getDirectionString({x: Math.sign(nextX - x), y: Math.sign(nextY - y)}, true) : 'away';
                
                if (isNewHunt) {
                    logMessage(`{green:You found the tracks of an Apex ${p.activeHunt.monster}! The trail leads ${dirStr}.}`);
                } else {
                    logMessage(`{green:The trail is fresh. The ${p.activeHunt.monster} went ${dirStr}.}`);
                }
            }

            // Remove current track
            chunkManager.setWorldTile(x, y, '.');
            state.mapDirty = true;
            if (typeof render === 'function') render();
            
            if (typeof playerRef !== 'undefined') playerRef.update({ activeHunt: p.activeHunt });
        };

        window.carveMonster = function(state, x, y, trophyName, carcassTile) {
            const p = state.player;
            const hasKnife = p.inventory.some(i => i && i.name === 'Hunter\'s Knife' && !i.isEquipped);

            if (!hasKnife) {
                logMessage("{red:You need a Hunter's Knife to carve this carcass!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            logMessage(`{orange:You meticulously carve the monster, extracting the ${trophyName}!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('sweep'); // Slicing sound
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#ef4444', 20); // Blood spray
            
            p.stamina = Math.max(0, p.stamina - 5);
            if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);

            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(p) : 9;
            
            // Give Trophy
            const template = window.ITEM_DATA[Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === trophyName)];
            if (template && p.inventory.length < invCap) {
                const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                newItem.name = trophyName; newItem.quantity = 1; newItem.isEquipped = false;
                p.inventory.push(newItem);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
            } else {
                logMessage(`{red:Your pack is full! The ${trophyName} drops to the ground.}`);
                chunkManager.setWorldTile(x, y, template.tile || '💎', 24);
            }

            // Give Bonus Meat/Bones
            if (p.inventory.length < invCap) p.inventory.push({ name: 'Raw Meat', type: 'junk', quantity: 5, tile: '🍖' });
            if (p.inventory.length < invCap) p.inventory.push({ name: 'Fossilized Bone', type: 'trade', quantity: 2, tile: '🦴' });

            // Clear the carcass
            if (state.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '.');
            else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][y][x] = '.';
            
            state.mapDirty = true;
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof render === 'function') render();
        };

        // ==========================================
        // 3. OVERWORLD TRACK SPAWNING
        // ==========================================
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                // Only spawn new tracks in Realm 0
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                const random = Alea(stringToSeed(`hunter_spawn_${chunkId}`));
                
                // 5% chance per chunk to contain the start of a monster trail
                if (random() < 0.05) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    if (chunkData[ry][rx] === '.' || chunkData[ry][rx] === 'F') {
                        chunkData[ry][rx] = '🐾'; 
                    }
                }
            };
        }

        // ==========================================
        // 4. LAIR DUNGEON GENERATION
        // ==========================================
        // Monkey-patch generateCave to create the Boss Rooms!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCave) {
            const origGenerateCave = chunkManager.generateCave;
            chunkManager.generateCave = function(caveId) {
                if (caveId.startsWith('hunter_')) {
                    if (this.caveMaps[caveId]) return this.caveMaps[caveId];
                    
                    let themeKey = 'ROCK';
                    let bossTile = '🦍a';
                    
                    if (caveId.includes('drake')) { themeKey = 'FIRE'; bossTile = '🐉a'; }
                    else if (caveId.includes('void')) { themeKey = 'VOID'; bossTile = '👁️a'; }
                    else if (caveId.includes('behemoth')) { themeKey = 'OVERGROWN'; bossTile = '🦍a'; }
                    
                    this.caveThemes[caveId] = themeKey;
                    const theme = window.CAVE_THEMES[themeKey];
                    
                    // Create a 13x13 Boss Arena
                    const mapHeight = 13;
                    const mapWidth = 13;
                    const map = Array.from({ length: mapHeight }, () => Array(mapWidth).fill(theme.wall));
                    
                    this.caveEnemies[caveId] = [];
                    
                    // Hollow it out
                    for(let ry = 2; ry < mapHeight - 2; ry++){
                        for(let rx = 2; rx < mapWidth - 2; rx++){
                            map[ry][rx] = theme.floor;
                        }
                    }
                    
                    // Add Entrance
                    map[mapHeight-2][Math.floor(mapWidth/2)] = '>';
                    
                    // Spawn the Boss
                    const bx = Math.floor(mapWidth/2);
                    const by = 3;
                    map[by][bx] = bossTile;
                    
                    const bData = window.ENEMY_DATA[bossTile];
                    if (bData) {
                        this.caveEnemies[caveId].push(this._createInstancedEnemy(`${caveId}:boss`, bx, by, bossTile, bData, bData));
                    }
                    
                    this.caveMaps[caveId] = map;
                    return map;
                }
                return origGenerateCave.call(this, caveId);
            };
        }

        // ==========================================
        // 5. PASSIVE ARMOR EFFECTS (ENGINE HOOK)
        // ==========================================
        // Hook into the endPlayerTurn function to continuously apply the powerful passives of Hunter Gear!
        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            window.endPlayerTurn = function(updates = {}) {
                
                const armor = gameState.player.equipment.armor;
                if (armor) {
                    if (armor.name === 'Drakebane Mail') {
                        // Permanent Fire Immunity
                        gameState.player.fireResistTurns = Math.max(gameState.player.fireResistTurns || 0, 2);
                    }
                    else if (armor.name === 'Voidstalker Cowl') {
                        // Permanent Madness Immunity
                        if (gameState.player.madnessTurns > 0) {
                            gameState.player.madnessTurns = 0;
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "RESISTED", "#a855f7");
                        }
                    }
                    else if (armor.name === 'Behemoth Plate') {
                        // Permanent Thorns
                        gameState.player.thornsValue = Math.max(gameState.player.thornsValue || 0, 5);
                        gameState.player.thornsTurns = Math.max(gameState.player.thornsTurns || 0, 2);
                    }
                }
                
                // Pass back to original engine
                if (origEndPlayerTurn) origEndPlayerTurn(updates);
            };
        }

        // Add Tracks and Carcasses to minimap colors
        if (typeof TILE_COLOR_MAP !== 'undefined') {
            TILE_COLOR_MAP['🐾'] = [250, 204, 21, 255]; // Yellow tracks
            TILE_COLOR_MAP['🥩d'] = [220, 38, 38, 255]; // Red carcass
            TILE_COLOR_MAP['🥩v'] = [168, 85, 247, 255]; // Purple carcass
            TILE_COLOR_MAP['🥩b'] = [120, 53, 15, 255]; // Brown carcass
            TILE_COLOR_MAP['🐉L'] = [220, 38, 38, 255]; // Red Lair
            TILE_COLOR_MAP['👁️L'] = [168, 85, 247, 255]; // Purple Lair
            TILE_COLOR_MAP['🦍L'] = [120, 53, 15, 255]; // Brown Lair
        }
    }
});

// --- END OF FILE expansion-monster-hunter.js ---
