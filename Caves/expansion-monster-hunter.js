// --- START OF FILE expansion-monster-hunter.js ---

window.ExpansionManager.register({
    id: "monster_hunter",
    name: "The Monster Hunter (Tracking & Trophies)",
    version: "1.5", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🔪h': {
                name: "Hunter's Knife", type: 'tool', tile: '🔪',
                description: "A serrated, incredibly sharp blade. Essential for carving trophies from Apex Predators.", _rarity: 'uncommon'
            },
            '📜mh': {
                name: 'Hunter\'s Log', type: 'journal', title: 'The Apex Predators', tile: '📜',
                content: "To track an Apex, look for the anomalies. Deep gouges in the dirt. Once you find their tracks, do not rest. They move fast, and their lairs are heavily guarded. Bring a knife, or you'll have nothing to show for the kill."
            },
            
            // Trophies
            '🐉s': { name: 'Apex Drake Scale', type: 'trade', tile: '🐉', description: "It radiates intense heat. Required for Drakebane gear.", _rarity: 'epic' },
            '👁️v': { name: 'Apex Void Core', type: 'trade', tile: '👁️', description: "It whispers in a language you don't understand.", _rarity: 'epic' },
            '🦍p': { name: 'Apex Behemoth Pelt', type: 'trade', tile: '🦍', description: "Incredibly thick and heavy fur. Can stop a blade.", _rarity: 'epic' },
            '🧪v': { name: 'Apex Venom Gland', type: 'trade', tile: '🧪', description: "A sac of highly concentrated, lethal neurotoxin.", _rarity: 'epic' },

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
            },
            '🧥b': {
                name: 'Broodmother Cloak', type: 'armor', tile: '🧥', defense: 7, slot: 'armor',
                statBonuses: { dexterity: 6, luck: 4 },
                description: "{blue:+7 Def}, {green:+6 Dex}, {gold:+4 Luck}. \n{green:Passive: Grants complete immunity to Poison.}", _rarity: 'legendary'
            },
            // --- EXPANSION WIN: New Tactical Items ---
            '🗡️bh': {
                name: 'Bone Harpoon', type: 'consumable', tile: '🗡️', _rarity: 'rare',
                description: "A heavy, barbed throwing spear. Throw to deal massive physical damage and inflict {green:Poison} (Deep Bleed).",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{red:Select a direction to hurl the Bone Harpoon... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Bone Harpoon'; // Hooks into the Alchemy throwing engine cleanly!
                    return false;
                }
            },
            '🧪ws': {
                name: "Witcher's Salve", type: 'buff_potion', tile: '🧪', yieldsBottle: true, _rarity: 'rare',
                description: "A pungent, alchemically enhanced paste. {blue:Grants immunity to Stun and Root effects for 20 turns.}",
                effect: (state) => {
                    if (state.player.statusImmunities && state.player.statusImmunities.includes('stun')) {
                        if (typeof logMessage === 'function') logMessage("{gray:The salve is already active.}");
                        return false;
                    }
                    
                    if (!state.player.statusImmunities) state.player.statusImmunities = [];
                    state.player.statusImmunities.push('stun', 'root');
                    
                    // The duration is managed dynamically by the engine hook below
                    state.player._salveTurns = 20;
                    
                    if (typeof logMessage === 'function') logMessage("{blue:You rub the pungent salve over your skin. You feel unstoppable!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#38bdf8', 15);
                    
                    // Bottle Return Logic
                    const emptyStack = state.player.inventory.find(i => i && i.name === 'Empty Bottle' && !i.isEquipped);
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                    if (emptyStack) {
                        emptyStack.quantity++;
                    } else if (state.player.inventory.length < invCap) {
                        state.player.inventory.push({ templateId: '🫙', name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });
                    }
                    return true;
                }
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
            },
            '🕷️a': {
                name: 'Apex Broodmother', tags: ['beast', 'bug', 'poison', 'boss'], mountable: false,
                maxHealth: 750, attack: 15, defense: 6, xp: 1100,
                caster: true, castRange: 5, spellDamage: 20, inflicts: 'poison', inflictChance: 1.0,
                color: '#16a34a', loot: '🥩s', isBoss: true, isElite: true,
                flavor: "An enormous arachnid. Hundreds of glowing green eyes stare back at you."
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
            '🥩s': {
                type: 'anomaly', name: 'Slain Broodmother', flavor: "The twitching carcass of the Apex Broodmother.",
                onInteract: (state, x, y) => { if (typeof window.carveMonster === 'function') window.carveMonster(state, x, y, 'Apex Venom Gland', '🥩s'); return null; }
            },
            // Lairs
            '🐉L': { type: 'dungeon_entrance', name: 'Scorched Roost', flavor: "The air here is blisteringly hot.", getCaveId: (x, y) => `hunter_drake_${x}_${y}` },
            '👁️L': { type: 'dungeon_entrance', name: 'Tear in Reality', flavor: "The sky above this crater is completely black.", getCaveId: (x, y) => `hunter_void_${x}_${y}` },
            '🦍L': { type: 'dungeon_entrance', name: 'Shattered Cavern', flavor: "The trees have been ripped out by the roots to form this den.", getCaveId: (x, y) => `hunter_behemoth_${x}_${y}` },
            '🕸️L': { type: 'dungeon_entrance', name: 'Infested Burrow', flavor: "The entrance is completely choked with thick, green webbing.", getCaveId: (x, y) => `hunter_broodmother_${x}_${y}` }
        },

        // --- 4. SHOPS ---
        shops: {
            castle: [
                { name: 'Hunter\'s Knife', price: 300, stock: 1 }
            ],
            trader: [
                { name: 'Hunter\'s Knife', price: 250, stock: 1 },
                { name: 'Hunter\'s Log', price: 50, stock: 1 }
            ],
            black_market: [
                { name: "Witcher's Salve", price: 600, stock: 3 }
            ]
        },

        // --- 5. RECIPES ---
        craftingRecipes: {
            "Drakebane Mail": { materials: { "Apex Drake Scale": 1, "Steel Armor": 1, "Elemental Core": 3 }, xp: 250, level: 5 },
            "Voidstalker Cowl": { materials: { "Apex Void Core": 1, "Silk Cowl": 1, "Void Dust": 5 }, xp: 250, level: 5 },
            "Behemoth Plate": { materials: { "Apex Behemoth Pelt": 1, "Studded Armor": 1, "Stone": 20 }, xp: 250, level: 5 },
            "Broodmother Cloak": { materials: { "Apex Venom Gland": 1, "Silk Cowl": 1, "Spider Silk": 15 }, xp: 250, level: 5 },
            "Bone Harpoon": { materials: { "Fossilized Bone": 1, "Iron Ore": 1 }, xp: 50, level: 3, yield: 2 }
        },
        
        alchemyRecipes: {
            "Bone Harpoon": { materials: {}, xp: 0, level: 1, yield: 1, hidden: true },
            "Witcher's Salve": { materials: { "Medicinal Herb": 3, "Bone Shard": 1, "Empty Bottle": 1 }, xp: 45, level: 3, yield: 1 }
        }
    },

    // --- 6. ENGINE HOOKS ---
    init: function() {
        const logger = window.ExpansionManager.getLogger("Hunter");
        
        // 🚨 OVERRIDE: Register Bone Harpoon in the Potion Engine to allow throwing
        if (typeof window.ITEM_DATA !== 'undefined' && window.ITEM_DATA['🗡️bh']) {
            window.ITEM_DATA['🗡️bh'].pColor = '#ef4444'; // Red blood spray
            window.ITEM_DATA['🗡️bh'].pSize = 10;
            
            if (!window.ITEM_DATA['Bone Harpoon']) window.ITEM_DATA['Bone Harpoon'] = window.ITEM_DATA['🗡️bh'];
        }

        const applySafePatch = (target, method, factory) => {
            if (typeof window.ExpansionManager.patchFunction === 'function') {
                window.ExpansionManager.patchFunction(target, method, factory);
            } else {
                const orig = target[method];
                target[method] = factory(orig ? orig.bind(target) : null);
            }
        };

        // ==========================================
        // 1. TRACKING & CARVING LOGIC
        // ==========================================
        window.handleMonsterTrack = function(state, x, y) {
            const p = state.player;
            if (!p.activeHunt) p.activeHunt = { stage: 0, targetX: 0, targetY: 0, monster: null };

            // Determine if starting a new hunt or continuing
            let isNewHunt = false;
            if (p.activeHunt.stage === 0 || (p.activeHunt.targetX !== x && p.activeHunt.targetY !== y)) {
                isNewHunt = true;
                const monsters = ['Drake', 'Void Terror', 'Behemoth', 'Broodmother'];
                p.activeHunt = {
                    stage: 1,
                    monster: monsters[Math.floor(Math.random() * monsters.length)],
                    targetX: x, targetY: y
                };
            } else {
                p.activeHunt.stage++;
            }

            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 800); 
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
                
                // Safe Tracker Placement (Explicitly check WorldState)
                const chunkX = Math.floor(tx / 16);
                const chunkY = Math.floor(ty / 16);
                const lX = (((tx % 16) + 16) % 16);
                const lY = (((ty % 16) + 16) % 16);
                
                let isWorldStateClear = true;
                if (chunkManager.worldState[`${chunkX},${chunkY}`] && chunkManager.worldState[`${chunkX},${chunkY}`][`${lX},${lY}`]) {
                    isWorldStateClear = false;
                }

                if (isWorldStateClear && ['.', 'F', 'd', 'D'].includes(tileAt)) {
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

            // --- 🎨 JUICE WIN: Color-Coded Scent Trail Particles! ---
            if (typeof ParticleSystem !== 'undefined') {
                let trackColor = '#4ade80'; // default green
                if (p.activeHunt.monster === 'Drake') trackColor = '#f97316';
                if (p.activeHunt.monster === 'Void Terror') trackColor = '#a855f7';
                if (p.activeHunt.monster === 'Behemoth') trackColor = '#b45309';
                if (p.activeHunt.monster === 'Broodmother') trackColor = '#22c55e';
                
                const angleToNext = Math.atan2(nextY - y, nextX - x);
                for(let i = 1; i <= 8; i++) {
                    setTimeout(() => {
                        ParticleSystem.spawn(x + Math.cos(angleToNext) * i, y + Math.sin(angleToNext) * i, trackColor, 'dust', '', 3);
                    }, i * 60);
                }
            }

            // Place the next step!
            if (p.activeHunt.stage >= 3) {
                // SPAWN THE LAIR!
                let lairTile = '🦍L';
                if (p.activeHunt.monster === 'Drake') lairTile = '🐉L';
                if (p.activeHunt.monster === 'Void Terror') lairTile = '👁️L';
                if (p.activeHunt.monster === 'Broodmother') lairTile = '🕸️L';
                
                chunkManager.setWorldTile(nextX, nextY, lairTile);
                
                // Add marker to map
                state.activeTreasure = { x: nextX, y: nextY };
                
                logMessage(`{red:You found the lair of the Apex ${p.activeHunt.monster}! It is marked on your map.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playBossSpawn(); // Huge roar!
                state.screenShake = 20;
                
                p.activeHunt = { stage: 0 }; 
            } else {
                // Spawn next track
                chunkManager.setWorldTile(nextX, nextY, '🐾');
                p.activeHunt.targetX = nextX;
                p.activeHunt.targetY = nextY;
                
                const dirStr = typeof getDirectionString === 'function' ? getDirectionString({x: Math.sign(nextX - x), y: Math.sign(nextY - y)}, true) : 'away';
                
                if (isNewHunt) {
                    logMessage(`{green:You found the tracks of an Apex ${p.activeHunt.monster}! The scent trail leads ${dirStr}.}`);
                } else {
                    logMessage(`{green:The trail is fresh. The ${p.activeHunt.monster} went ${dirStr}.}`);
                }
            }

            // Remove current track
            chunkManager.setWorldTile(x, y, '.');
            state.mapDirty = true;
            if (typeof render === 'function') render();
            
            if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ activeHunt: p.activeHunt });
        };

        window.carveMonster = function(state, x, y, trophyName, carcassTile) {
            
            // 🚨 BUG FIX & EXPLOIT GUARD: Mutex Lock
            if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
            
            try {
                isProcessingMove = true;
                const p = state.player;
                const hasKnife = p.inventory.some(i => i && i.name === 'Hunter\'s Knife' && !i.isEquipped);

                if (!hasKnife) {
                    logMessage("{red:You need a Hunter's Knife to carve this carcass!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }

                logMessage(`{orange:You meticulously carve the monster, extracting the ${trophyName}!}`);
                if (typeof AudioSystem !== 'undefined') {
                    AudioSystem.playAttack('sweep'); 
                    setTimeout(() => AudioSystem.playNoise(0.2, 0.1, 400), 100); 
                }
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#ef4444', 25); 
                
                p.stamina = Math.max(0, p.stamina - 5);
                if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);

                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(p) : 9;
                
                // Safe Outward Spiral Drop for Multiple Loot Returns!
                const safelyDropItem = (itemTile) => {
                    let placed = false;
                    let validFloor = '.';
                    if (state.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[state.currentCaveTheme]) {
                        validFloor = CAVE_THEMES[state.currentCaveTheme].floor;
                    }

                    if (typeof chunkManager !== 'undefined') {
                        for (let r = 0; r <= 2 && !placed; r++) {
                            for (let dy = -r; dy <= r && !placed; dy++) {
                                for (let dx = -r; dx <= r && !placed; dx++) {
                                    const tx = x + dx; 
                                    const ty = y + dy;
                                    let tileAt;
                                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') tileAt = chunkManager.getTile(tx, ty);
                                    else if (state.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[state.currentCaveId]?.[ty]?.[tx];
                                    else if (state.mapMode === 'castle') tileAt = chunkManager.castleMaps[state.currentCastleId]?.[ty]?.[tx];

                                    if (tileAt === validFloor || tileAt === '.') {
                                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(tx, ty, itemTile, 24); 
                                        else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][ty][tx] = itemTile;
                                        else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][ty][tx] = itemTile;
                                        placed = true;
                                    }
                                }
                            }
                        }
                        if (!placed) { // Absolute fallback
                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(x, y, itemTile, 24);
                            else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][y][x] = itemTile;
                            else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][y][x] = itemTile;
                        }
                    }
                };

                const addOrDropItem = (itemName, itemType, itemQty, itemTile) => {
                    const existing = p.inventory.find(i => i && i.name === itemName && !i.isEquipped);
                    const isStackable = ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(itemType);
                    
                    if (existing && isStackable) {
                        existing.quantity += itemQty;
                    } else if (p.inventory.length < invCap) {
                        // Safe Template Cloning!
                        const baseKey = Object.keys(window.ITEM_DATA || {}).find(k => window.ITEM_DATA[k].name === itemName);
                        const template = baseKey ? window.ITEM_DATA[baseKey] : null;
                        
                        let newItem = template && typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : { name: itemName, type: itemType, tile: itemTile };
                        newItem.templateId = baseKey;
                        newItem.quantity = itemQty; 
                        newItem.isEquipped = false;
                        p.inventory.push(newItem);
                    } else {
                        safelyDropItem(itemTile);
                        logMessage(`{red:Inventory full! The ${itemName} drops to the ground.}`);
                    }
                };

                // 1. Give Trophy
                addOrDropItem(trophyName, 'trade', 1, '💎');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();

                // 2. Give Bonus Meat/Bones safely
                addOrDropItem('Raw Meat', 'junk', 5, '🍖');
                addOrDropItem('Fossilized Bone', 'trade', 2, '🦴');

                // Clear the carcass
                if (state.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '.');
                else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][y][x] = '.';
                
                state.mapDirty = true;
                if (typeof renderInventory === 'function') renderInventory();
                if (typeof render === 'function') render();
                if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory });
                
            } finally {
                isProcessingMove = false;
            }
        };

        // ==========================================
        // 2. OVERWORLD TRACK SPAWNING
        // ==========================================
        
        if (typeof chunkManager !== 'undefined') {
            applySafePatch(chunkManager, 'generateChunk', (origGenerateChunk) => {
                return function(chunkX, chunkY) {
                    if (origGenerateChunk) origGenerateChunk.call(this, chunkX, chunkY);
                    
                    // Only spawn new tracks in Realm 0
                    if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                    const chunkId = `${chunkX},${chunkY}`;
                    const chunkData = this.loadedChunks[chunkId];
                    const random = typeof Alea !== 'undefined' ? Alea(typeof stringToSeed !== 'undefined' ? stringToSeed(`hunter_spawn_${chunkId}`) : 1) : Math.random;
                    
                    // 5% chance per chunk to contain the start of a monster trail
                    if (random() < 0.05) { 
                        const rx = Math.floor(random() * 14) + 1;
                        const ry = Math.floor(random() * 14) + 1;
                        if (chunkData[ry][rx] === '.' || chunkData[ry][rx] === 'F') {
                            chunkData[ry][rx] = '🐾'; 
                        }
                    }
                };
            });

            // ==========================================
            // 3. LAIR DUNGEON GENERATION
            // ==========================================
            
            applySafePatch(chunkManager, 'generateCave', (origGenerateCave) => {
                return function(caveId) {
                    if (caveId.startsWith('hunter_')) {
                        if (this.caveMaps[caveId]) return this.caveMaps[caveId];
                        
                        let themeKey = 'ROCK';
                        let bossTile = '🦍a';
                        
                        if (caveId.includes('drake')) { themeKey = 'FIRE'; bossTile = '🐉a'; }
                        else if (caveId.includes('void')) { themeKey = 'VOID'; bossTile = '👁️a'; }
                        else if (caveId.includes('behemoth')) { themeKey = 'OVERGROWN'; bossTile = '🦍a'; }
                        else if (caveId.includes('broodmother')) { themeKey = 'FUNGAL'; bossTile = '🕷️a'; }
                        
                        this.caveThemes[caveId] = themeKey;
                        const theme = window.CAVE_THEMES[themeKey] || { wall: '▓', floor: '.' };
                        
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
                        
                        // 🚨 BUG FIX WIN: Ensure there is an EXIT `<` so players aren't trapped!
                        // Force placed near the top wall behind the boss
                        map[2][Math.floor(mapWidth/2)] = '<';
                        
                        // Safe Entity Instantiator Fallback
                        const createEntity = typeof this._createInstancedEnemy === 'function' 
                            ? this._createInstancedEnemy.bind(this) 
                            : (id, x, y, tile, scaled, template) => ({ id, x, y, tile, name: scaled.name, health: scaled.maxHealth, maxHealth: scaled.maxHealth, attack: scaled.attack, defense: scaled.defense || 0, xp: scaled.xp, loot: template.loot });

                        // Spawn the Boss
                        const bx = Math.floor(mapWidth/2);
                        const by = 4;
                        map[by][bx] = bossTile;
                        
                        const bData = window.ENEMY_DATA ? window.ENEMY_DATA[bossTile] : null;
                        if (bData) {
                            // Safe clone to sever memory references to global template!
                            const bossScaled = typeof window.fastClone === 'function' ? window.fastClone(bData) : JSON.parse(JSON.stringify(bData));
                            this.caveEnemies[caveId].push(createEntity(`${caveId}:boss`, bx, by, bossTile, bossScaled, bData));
                        }
                        
                        this.caveMaps[caveId] = map;
                        return map;
                    }
                    if (origGenerateCave) return origGenerateCave.call(this, caveId);
                };
            });
        }

        // ==========================================
        // 4. PASSIVE ARMOR & POTION EFFECTS (ENGINE HOOK)
        // ==========================================

        if (typeof window.endPlayerTurn === 'function') {
            applySafePatch(window, 'endPlayerTurn', (origEndPlayerTurn) => {
                return function(updates = {}) {
                    
                    if (typeof gameState !== 'undefined' && gameState.player) {
                        const p = gameState.player;
                        
                        // --- Witcher's Salve Timer ---
                        if (p._salveTurns > 0) {
                            p._salveTurns--;
                            if (p._salveTurns === 0) {
                                // Safely remove 'stun' and 'root' from the immunities list
                                if (p.statusImmunities) {
                                    p.statusImmunities = p.statusImmunities.filter(i => i !== 'stun' && i !== 'root');
                                }
                                logMessage("{gray:The Witcher's Salve wears off. You feel vulnerable again.}");
                            }
                        }

                        // --- Armor Passives ---
                        if (p.equipment) {
                            const armor = p.equipment.armor;
                            if (armor) {
                                // 🚨 BUG FIX & ROBUSTNESS WIN: Use Template ID for safe passive checks!
                                // This ensures that "Masterwork Drakebane Mail" still grants Fire Immunity!
                                const armorTemplateId = armor.templateId || (typeof window.ITEM_DATA !== 'undefined' ? Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === armor.name) : null);
                                
                                if (armorTemplateId === '🛡️db' || armor.name.includes('Drakebane')) {
                                    // Permanent Fire Immunity
                                    p.fireResistTurns = Math.max(p.fireResistTurns || 0, 2);
                                }
                                else if (armorTemplateId === '🧥vs' || armor.name.includes('Voidstalker')) {
                                    // Permanent Madness Immunity
                                    if (p.madnessTurns > 0) {
                                        p.madnessTurns = 0;
                                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(p.x, p.y, "RESISTED", "#a855f7");
                                    }
                                }
                                else if (armorTemplateId === '🛡️bp' || armor.name.includes('Behemoth Plate')) {
                                    // Permanent Thorns
                                    p.thornsValue = Math.max(p.thornsValue || 0, 5);
                                    p.thornsTurns = Math.max(p.thornsTurns || 0, 2);
                                }
                                else if (armorTemplateId === '🧥b' || armor.name.includes('Broodmother')) {
                                    // Permanent Poison Immunity
                                    if (p.poisonTurns > 0) {
                                        p.poisonTurns = 0;
                                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(p.x, p.y, "RESISTED", "#22c55e");
                                    }
                                }
                            }
                        }
                    }
                    
                    // Pass all arguments forward safely
                    if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
                };
            });
        }

        // Add Tracks and Carcasses to minimap colors
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🐾'] = [250, 204, 21, 255]; // Yellow tracks
            window.TILE_COLOR_MAP['🥩d'] = [220, 38, 38, 255]; // Red carcass
            window.TILE_COLOR_MAP['🥩v'] = [168, 85, 247, 255]; // Purple carcass
            window.TILE_COLOR_MAP['🥩b'] = [120, 53, 15, 255]; // Brown carcass
            window.TILE_COLOR_MAP['🥩s'] = [22, 163, 74, 255]; // Green carcass
            window.TILE_COLOR_MAP['🐉L'] = [220, 38, 38, 255]; // Red Lair
            window.TILE_COLOR_MAP['👁️L'] = [168, 85, 247, 255]; // Purple Lair
            window.TILE_COLOR_MAP['🦍L'] = [120, 53, 15, 255]; // Brown Lair
            window.TILE_COLOR_MAP['🕸️L'] = [22, 163, 74, 255]; // Green Lair
        }
        
        logger.log("Hunter tracking hooks securely activated.");
    }
});

// --- END OF FILE expansion-monster-hunter.js ---
