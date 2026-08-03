// --- START OF FILE expansion-vanguard.js ---

window.ExpansionManager.register({
    id: "the_vanguard_raids",
    name: "The Vanguard (Multiplayer Raids)",
    version: "1.3", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🗝️r': {
                name: 'Vanguard Key', type: 'quest', tile: '🗝️',
                description: "A scorching hot key forged from star-metal. Used to awaken The Molten Lord and his court.", _rarity: 'legendary'
            },
            '🛡️v': {
                name: 'Vanguard\'s Aegis', type: 'armor', tags: ['shield'], tile: '🛡️',
                defense: 12, slot: 'offhand', blockChance: 0.40, statBonuses: { constitution: 8, strength: 5 },
                description: "{blue:+12 Def}, {green:+8 Con, +5 Str}. Forged in the fires of a raid boss.", _rarity: 'legendary', excludeFromLoot: true
            },
            '⚔️v': {
                name: 'Vanguard\'s Edge', type: 'weapon', tags: ['blade', 'fire'], tile: '⚔️',
                damage: 18, slot: 'weapon', statBonuses: { strength: 8, dexterity: 4 }, inflicts: 'burn', inflictChance: 0.5,
                description: "{red:+18 Dmg}, {green:+8 Str, +4 Dex}. It constantly drips magma.", _rarity: 'legendary', excludeFromLoot: true
            },
            '💍v': {
                name: 'Molten Core Ring', type: 'accessory', tile: '💍', defense: 2, slot: 'accessory',
                statBonuses: { willpower: 10, maxMana: 30 },
                description: "{blue:+2 Def, +30 Max Mana}, {purple:+10 Will}. The still-beating heart of the Lord.", _rarity: 'legendary', excludeFromLoot: true
            },
            '🍷v': {
                name: 'Vanguard\'s Elixir', type: 'consumable', tile: '🍷', _rarity: 'legendary', excludeFromLoot: true,
                description: "The absolute peak of alchemy. {gold:Permanently +10 Max HP & +10 Max Mana.}",
                effect: (state) => {
                    state.player.bonusMaxHealth = (state.player.bonusMaxHealth || 0) + 10;
                    state.player.bonusMaxMana = (state.player.bonusMaxMana || 0) + 10;
                    
                    if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
                    else { state.player.maxHealth += 10; state.player.maxMana += 10; }
                    
                    if (typeof window.modifyVital === 'function') {
                        window.modifyVital('health', 10);
                        window.modifyVital('mana', 10);
                    } else {
                        state.player.health = state.player.maxHealth;
                        state.player.mana = state.player.maxMana;
                    }
                    
                    logMessage("{gold:Cosmic power courses through your veins! (+10 Max HP, +10 Max Mana)}");
                    if (typeof triggerStatAnimation !== 'undefined') {
                        triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
                        triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');
                    }
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 30);
                    
                    return true;
                }
            },
            '📜vr': {
                name: 'Vanguard\'s Log', type: 'journal', title: 'A Charred Diary', tile: '📜',
                content: "The heat is unbearable. We sealed him away in the core, but the keys... they were scattered to the winds. If anyone finds this, I beg of you, do not turn the lock. The Molten Lord must sleep."
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '👹r': {
                name: 'The Molten Lord', tags: ['elemental', 'fire', 'giant', 'boss'], mountable: false,
                maxHealth: 50000, attack: 25, defense: 10, xp: 10000,
                isRanged: false, caster: true, castRange: 8, spellDamage: 30, inflicts: 'burn', inflictChance: 1.0,
                color: '#dc2626', loot: '📦r', isBoss: true, isElite: true,
                flavor: "A towering behemoth of magma and black iron. The heat is unbearable."
            }
        },

        // --- 3. NEW TILES ---
        tiles: {
            '🌀r': {
                type: 'anomaly', name: 'Vanguard Portal',
                flavor: "A swirling vortex of fire and ash. It leads to the Molten Core.",
                onInteract: (state, x, y) => {
                    const confirmEntry = confirm("You are about to enter a Multiplayer Raid Instance. It is highly recommended you bring a party. Proceed?");
                    if (!confirmEntry) return null;

                    logMessage("{purple:You step into the portal. Reality tears away...}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();
                    
                    // Intense portal entry visuals
                    state.screenShake = 20;
                    state.screenFlash = { color: '#ef4444', alpha: 0.8, decay: 0.02 };
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#a855f7', 40);

                    // 🛡️ STABILITY WIN: Purge Old Map Memory & Listeners
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.loadedChunks = {};
                        chunkManager.worldState = {};
                    }
                    if (typeof worldStateListeners !== 'undefined') {
                        Object.values(worldStateListeners).forEach(unsub => unsub());
                        worldStateListeners = {};
                    }
                    if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();
                    state.sharedEnemies = {};

                    // Shift to the dedicated Raid Realm
                    state.currentRealm = 'raid_molten';
                    state.realmMutators = ['lava_oceans']; 
                    
                    // 🚨 ANTI-GRIEFING WIN: Force disable PvP upon entering a raid!
                    if (state.player.pvpEnabled) {
                        state.player.pvpEnabled = false;
                        logMessage("{green:The immense heat of this realm suppresses your bloodlust. PvP is disabled. Stand together, or burn.}");
                    }
                    
                    // Teleport to the safe zone inside the Raid Arena
                    state.player.x = 0;
                    state.player.y = 8;
                    state.overworldExit = { x: x, y: y }; // Save exit
                    
                    state.mapDirty = true;
                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    if (typeof finalizeMapTransition === 'function') finalizeMapTransition();
                    return null;
                }
            },
            '🚪r': {
                type: 'anomaly', name: 'Raid Exit',
                flavor: "A shimmering portal leading back to the Prime Realm.",
                onInteract: (state, x, y) => {
                    logMessage("{cyan:You step through the portal and return to the overworld.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    
                    // 🛡️ STABILITY WIN: Purge Raid Memory & Listeners
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.loadedChunks = {};
                        chunkManager.worldState = {};
                    }
                    if (typeof worldStateListeners !== 'undefined') {
                        Object.values(worldStateListeners).forEach(unsub => unsub());
                        worldStateListeners = {};
                    }
                    if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();
                    state.sharedEnemies = {};

                    state.currentRealm = 0;
                    state.realmMutators = [];
                    if (state.overworldExit) {
                        state.player.x = state.overworldExit.x;
                        state.player.y = state.overworldExit.y;
                    } else {
                        state.player.x = 0; state.player.y = 0;
                    }
                    
                    state.mapDirty = true;
                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    if (typeof finalizeMapTransition === 'function') finalizeMapTransition();
                    return null;
                }
            },
            '🩸r': {
                type: 'anomaly', name: 'Summoning Altar',
                flavor: "An altar of black iron. It has a keyhole glowing with immense heat.",
                onInteract: (state, x, y) => {
                    // Check if boss is already alive
                    const bossId = `overworld:0,0`;
                    if (state.sharedEnemies && state.sharedEnemies[bossId]) {
                        logMessage("{red:The Molten Lord is already awake!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return null;
                    }

                    const inv = state.player.inventory;
                    const keyIdx = inv.findIndex(i => i && i.name === 'Vanguard Key' && !i.isEquipped);

                    if (keyIdx === -1) {
                        logMessage("{gray:You need a Vanguard Key to activate the altar.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return null;
                    }

                    // Consume Key
                    inv[keyIdx].quantity--;
                    if (inv[keyIdx].quantity <= 0) inv.splice(keyIdx, 1);

                    logMessage(`{orange:You turn the key. The ground violently shakes!}`);
                    state.screenShake = 40;
                    gameState.screenFlash = { color: '#f97316', alpha: 0.6, decay: 0.02 };
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playBossSpawn();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(x, y, '#ef4444', 50);

                    if (typeof EnemyNetworkManager !== 'undefined' && typeof rtdb !== 'undefined') {
                        // 🚀 PERFORMANCE WIN: Atomic Batching
                        // Build a single payload dictionary instead of writing to Firebase 5 separate times!
                        const spawnPayload = {};
                        
                        // 1. Spawn the Boss at (0,0)
                        const eData = window.ENEMY_DATA['👹r'];
                        const newBoss = { ...eData, tile: '👹r', x: 0, y: 0, spawnTime: Date.now() };
                        spawnPayload[EnemyNetworkManager.getPath(0, 0, bossId)] = newBoss;
                        
                        // 2. Spawn Adds! (Fire Elementals at the 4 pillars)
                        const adds = [[3,3], [12,3], [3,12], [12,12]];
                        const fData = window.ENEMY_DATA['f']; // Fire Elemental
                        if (fData) {
                            adds.forEach((pos) => {
                                const aId = `overworld:${pos[0]},${-pos[1]}`;
                                const newAdd = { ...fData, tile: 'f', x: pos[0], y: pos[1], spawnTime: Date.now() };
                                spawnPayload[EnemyNetworkManager.getPath(pos[0], pos[1], aId)] = newAdd;
                                
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(pos[0], pos[1], '#f97316', 15);
                            });
                        }
                        
                        // Execute atomic payload
                        rtdb.ref().update(spawnPayload).catch(e => console.error("Raid Spawn Sync Error:", e));
                        
                        // 3. Announce to global chat
                        rtdb.ref('chat').push().set({
                            senderId: 'SERVER', email: 'SYSTEM',
                            message: `{red:🌋 THE MOLTEN LORD HAS BEEN AWAKENED! 🌋}`,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                    }

                    if (typeof renderInventory === 'function') renderInventory();
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv };
                }
            },
            // 🚨 ANTI-GRIEFING WIN: Instanced Raid Loot!
            // Instead of being a standard 'loot_container' which deletes itself from the server when opened,
            // this is an anomaly that grants loot but stays on the map. It uses local `lootedTiles` so 
            // everyone in the raid party can click it once and get their own loot!
            '📦r': {
                type: 'anomaly', name: 'Vanguard Cache',
                flavor: "A massive, glowing chest dropped by the Raid Boss!",
                onInteract: (state, x, y) => {
                    const tileId = `raid_cache_${x}_${y}`;
                    
                    if (state.lootedTiles.has(tileId)) {
                        logMessage("{gray:You have already claimed your share of the raid loot from this chest.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return null;
                    }

                    logMessage("{gold:You pry open the Vanguard Cache...}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 500); // Rummage sound
                    
                    // Base Gold
                    const goldAmount = 500 + Math.floor(Math.random() * 500);
                    state.player.coins += goldAmount;
                    logMessage(`{gold:You found ${goldAmount} Gold!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();

                    // Loot Table
                    const lootTable = ['🛡️v', '⚔️v', '💍v', '🍷v', '📜vr', '💎b', '💎b', '💎'];
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                    
                    // Give 2 Items!
                    for(let i=0; i<2; i++) {
                        const itemKey = lootTable[Math.floor(Math.random() * lootTable.length)];
                        const template = window.ITEM_DATA[itemKey];
                        
                        if (template && state.player.inventory.length < invCap) {
                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                            newItem.templateId = itemKey;
                            newItem.quantity = 1;
                            newItem.isEquipped = false;
                            newItem.effect = template.effect || null;
                            newItem.onHit = template.onHit || null;
                            
                            state.player.inventory.push(newItem);
                            logMessage(`You found: {purple:${template.name}}`);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                        } else if (template) {
                            logMessage(`{red:You found a ${template.name}, but your pack is full!}`);
                        }
                    }

                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(x, y, '#facc15', 20);
                        ParticleSystem.createFloatingText(x, y, "+LOOT", "#facc15");
                    }

                    // Mark as looted locally! DO NOT delete the tile from the world!
                    state.lootedTiles.add(tileId);
                    
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof renderStats === 'function') renderStats();
                    
                    return { 
                        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, 
                        coins: state.player.coins,
                        lootedTiles: Object.fromEntries(state.lootedTiles)
                    };
                }
            }
        },

        // --- 4. RECIPES ---
        craftingRecipes: {
            "Vanguard Key": {
                materials: { "Star-Metal Ore": 5, "Elemental Core": 5, "Obsidian Shard": 10 },
                xp: 500, level: 6
            }
        }
    },

    // --- 5. ENGINE HOOKS ---
    init: function() {

        // 1. INJECT RAID MAP GENERATOR
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                // If we are in the specific raid realm, override normal generation!
                if (typeof gameState !== 'undefined' && gameState.currentRealm === 'raid_molten') {
                    
                    const chunkId = `${chunkX},${chunkY}`;
                    let chunkData = Array.from({ length: this.CHUNK_SIZE }, () => Array(this.CHUNK_SIZE).fill('🌋')); // Fill with Lava
                    
                    // If we are generating the center chunk (0,0), build the arena
                    if (chunkX === 0 && chunkY === 0) {
                        for (let y = 0; y < this.CHUNK_SIZE; y++) {
                            for (let x = 0; x < this.CHUNK_SIZE; x++) {
                                const worldX = x;
                                const worldY = y;
                                
                                // Create a 11x11 square platform in the middle
                                if (worldX >= 2 && worldX <= 13 && worldY >= 2 && worldY <= 13) {
                                    chunkData[y][x] = 'd'; // Ashen ground
                                }
                                
                                // Decorative Pillars (Spawn points for the Adds!)
                                if ((worldX===3 && worldY===3) || (worldX===12 && worldY===3) || 
                                    (worldX===3 && worldY===12) || (worldX===12 && worldY===12)) {
                                    chunkData[y][x] = '🧱';
                                }
                            }
                        }
                        
                        // Place Interactive Objects using World Coordinates!
                        chunkData[4][8] = '🩸r'; 
                        chunkData[14][8] = '🚪r'; 
                        
                        // A safe bridge leading to the exit
                        chunkData[13][8] = 'd';
                    }
                    
                    this.loadedChunks[chunkId] = chunkData;
                    return; // Prevent normal generation from running
                }

                // Normal Overworld Hook (Spawn the Portal)
                origGenerateChunk.call(this, chunkX, chunkY);
                
                if (gameState.currentRealm === 0 || !gameState.currentRealm) {
                    const chunkId = `${chunkX},${chunkY}`;
                    const chunkData = this.loadedChunks[chunkId];
                    
                    // Safe PRNG fallback
                    const random = (typeof Alea !== 'undefined' && typeof stringToSeed !== 'undefined') 
                        ? Alea(stringToSeed(`vanguard_spawn_${chunkId}`)) 
                        : Math.random;
                    
                    // Spawn portals deep in Deadlands
                    if (random() < 0.05) { 
                        const rx = Math.floor(random() * 14) + 1;
                        const ry = Math.floor(random() * 14) + 1;
                        if (chunkData[ry][rx] === 'd' && (chunkX*chunkX + chunkY*chunkY) > 2500) {
                            chunkData[ry][rx] = '🌀r'; 
                        }
                    }
                }
            };
        }

        // 2. LORE & JUCIE WIN: ATMOSPHERIC RAID DAMAGE
        // Hooks into the player turn end to deal ambient heat damage if they lack fire resistance!
        if (typeof window.ExpansionManager !== 'undefined') {
            window.ExpansionManager.triggerHook = window.ExpansionManager.triggerHook || function(){}; // Failsafe
            
            // If the event bus is ready, register the hook natively!
            if (window.ExpansionManager.activeHooks) {
                if (!window.ExpansionManager.activeHooks['onTurnEnd']) window.ExpansionManager.activeHooks['onTurnEnd'] = [];
                
                window.ExpansionManager.activeHooks['onTurnEnd'].push({
                    id: 'the_vanguard_raids',
                    func: (context) => {
                        const state = typeof gameState !== 'undefined' ? gameState : context.gameState;
                        if (state && state.currentRealm === 'raid_molten' && state.playerTurnCount % 10 === 0) {
                            
                            // Visual embers
                            if (typeof ParticleSystem !== 'undefined' && Math.random() < 0.3) {
                                const px = state.player.x + (Math.random() * 10 - 5);
                                const py = state.player.y + (Math.random() * 10 - 5);
                                ParticleSystem.spawn(px, py, '#f97316', 'sparkle');
                            }
                            
                            // Ambient Heat Damage
                            const hasArmor = state.player.equipment.armor && state.player.equipment.armor.name.includes('Dragonscale');
                            const hasPotion = state.player.fireResistTurns > 0;
                            
                            if (!hasArmor && !hasPotion && !state.godMode) {
                                logMessage("{orange:The ambient heat of the Molten Core sears your lungs! (-2 HP)}");
                                if (typeof window.modifyVital === 'function') window.modifyVital('health', -2);
                                state.screenShake = 5;
                                if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('healthDisplay'), false);
                            }
                        }
                    }
                });
            }
        }

        // 3. INJECT MASSIVE LOOT EXPLOSION ON BOSS DEATH
        if (typeof window.generateEnemyLoot === 'function') {
            const origGenLoot = window.generateEnemyLoot;
            
            window.generateEnemyLoot = function(player, enemy) {
                if (enemy.name === 'The Molten Lord' || enemy.tile === '👹r') {
                    // Announce to server
                    if (typeof rtdb !== 'undefined') {
                        rtdb.ref('chat').push().set({
                            senderId: 'SERVER', email: 'SYSTEM',
                            message: `{gold:🏆 The Molten Lord has been slain by ${player.name || 'a party'}!}`,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                    }

                    // 🚨 BUG FIX & ANTI-GRIEFING WIN: Safe Instanced Loot Drops
                    // We spawn 5 instanced `📦r` chests (one in the center, 4 surrounding).
                    // Because they are anomalies that track looted state locally, every player
                    // in the raid can open all 5 chests on their own screen!
                    setTimeout(() => {
                        const cx = enemy.x; const cy = enemy.y;
                        if (typeof chunkManager !== 'undefined') {
                            const offsets = [[1,0], [-1,0], [0,1], [0,-1]];
                            for(let i=0; i<4; i++) {
                                const targetX = cx + offsets[i][0];
                                const targetY = cy + offsets[i][1];
                                const tileAt = chunkManager.getTile(targetX, targetY);
                                
                                // Only drop cache if it's on safe ground (Ash, Floor, or Lava)
                                if (['d', '.', '🌋'].includes(tileAt)) {
                                    // 2 Hour TTL for Raid Caches so they eventually clean up the server memory
                                    chunkManager.setWorldTile(targetX, targetY, '📦r', 2);
                                }
                            }
                            gameState.mapDirty = true;
                            if (typeof render === 'function') render();
                        }
                    }, 200);

                    // Return the 5th chest for the center tile natively
                    return '📦r'; 
                }
                
                // Fallback to normal loot logic
                return origGenLoot(player, enemy);
            };
        }

        // 4. ADD COLORS TO MINIMAP
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🌀r'] = [239, 68, 68, 255]; // Red Portal
            window.TILE_COLOR_MAP['🚪r'] = [59, 130, 246, 255]; // Blue Exit
            window.TILE_COLOR_MAP['🩸r'] = [153, 27, 27, 255]; // Blood Altar
            window.TILE_COLOR_MAP['📦r'] = [250, 204, 21, 255]; // Gold Cache
        }
    }
});

// --- END OF FILE expansion-vanguard.js ---
