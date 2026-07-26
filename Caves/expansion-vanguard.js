// --- START OF FILE expansion-vanguard.js ---

window.ExpansionManager.register({
    id: "the_vanguard_raids",
    name: "The Vanguard (Multiplayer Raids)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🗝️r': {
                name: 'Vanguard Key', type: 'quest', tile: '🗝️',
                description: "A scorching hot key forged from star-metal. Used to awaken The Molten Lord.", _rarity: 'legendary'
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
            }
        },

        // --- 2. NEW ENEMIES ---
        enemies: {
            '👹r': {
                name: 'The Molten Lord', tags: ['elemental', 'fire', 'giant', 'boss'], mountable: false,
                maxHealth: 50000, attack: 25, defense: 10, xp: 10000,
                isRanged: false, caster: true, castRange: 8, spellDamage: 30, inflicts: 'burn', inflictChance: 1.0,
                color: '#dc2626', loot: '📦r', isBoss: true,
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

                    // Shift to the dedicated Raid Realm
                    state.currentRealm = 'raid_molten';
                    state.realmMutators = ['lava_oceans']; // Re-use our lava mutator!
                    
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
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playBossSpawn();

                    // Spawn the Boss at (0,0) in RTDB
                    const eData = window.ENEMY_DATA['👹r'];
                    const newBoss = { ...eData, tile: '👹r', x: 0, y: 0, spawnTime: Date.now() };
                    
                    if (typeof EnemyNetworkManager !== 'undefined' && typeof rtdb !== 'undefined') {
                        rtdb.ref(EnemyNetworkManager.getPath(0, 0, bossId)).set(newBoss);
                        
                        // Announce to global chat
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
            '📦r': {
                type: 'loot_container', name: 'Vanguard Cache',
                flavor: "A massive, glowing chest dropped by the Raid Boss!",
                lootTable: ['🛡️v', '⚔️v', '💍v', '💎b', '💎', '$']
            }
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // 1. ADD CRAFTING RECIPE FOR THE KEY
        if (typeof window.CRAFTING_RECIPES !== 'undefined') {
            window.CRAFTING_RECIPES["Vanguard Key"] = {
                materials: { "Star-Metal Ore": 5, "Elemental Core": 5, "Obsidian Shard": 10 },
                xp: 500, level: 6
            };
        }

        // 2. INJECT RAID MAP GENERATOR
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
                                
                                // Decorative Pillars
                                if ((worldX===3 && worldY===3) || (worldX===12 && worldY===3) || 
                                    (worldX===3 && worldY===12) || (worldX===12 && worldY===12)) {
                                    chunkData[y][x] = '🧱';
                                }
                            }
                        }
                        
                        // Place Interactive Objects using World Coordinates!
                        // In chunk 0,0, world coords match array indices.
                        // We place the Altar at (8, 4) and the Exit at (8, 14)
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
                    const random = Alea(stringToSeed(`vanguard_spawn_${chunkId}`));
                    
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

                    // Drop 4 extra chests around the boss asynchronously so they sync to RTDB
                    setTimeout(() => {
                        const cx = enemy.x; const cy = enemy.y;
                        if (typeof chunkManager !== 'undefined') {
                            chunkManager.setWorldTile(cx+1, cy, '📦r', 2);
                            chunkManager.setWorldTile(cx-1, cy, '📦r', 2);
                            chunkManager.setWorldTile(cx, cy+1, '📦r', 2);
                            chunkManager.setWorldTile(cx, cy-1, '📦r', 2);
                            gameState.mapDirty = true;
                            if (typeof render === 'function') render();
                        }
                    }, 200);

                    // Return the 5th chest for the center tile
                    return '📦r'; 
                }
                
                // Fallback to normal loot logic
                return origGenLoot(player, enemy);
            };
        }

        // 4. ADD COLORS TO MINIMAP
        if (typeof TILE_COLOR_MAP !== 'undefined') {
            TILE_COLOR_MAP['🌀r'] = [239, 68, 68, 255]; // Red Portal
            TILE_COLOR_MAP['🚪r'] = [59, 130, 246, 255]; // Blue Exit
            TILE_COLOR_MAP['🩸r'] = [153, 27, 27, 255]; // Blood Altar
            TILE_COLOR_MAP['📦r'] = [250, 204, 21, 255]; // Gold Cache
        }
    }
});

// --- END OF FILE expansion-vanguard.js ---
