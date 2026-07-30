// --- START OF FILE expansion-lore-quests.js ---

window.ExpansionManager.register({
    id: "faction_lore",
    name: "Factions & Deep Lore",
    version: "1.2", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '👘c': { 
                name: 'Cultist Robes', type: 'armor', tile: '👘', defense: 2, slot: 'armor',
                statBonuses: { willpower: 2 }, 
                description: "{blue:+2 Def}, {purple:+2 Will}. Dark, heavy robes. Wearing these might fool the Shadowed Hand.", 
                _rarity: 'uncommon' 
            },
            '🧿st': { 
                name: 'Star-Glass Amulet', type: 'accessory', tile: '🧿', defense: 1, slot: 'accessory',
                statBonuses: { luck: 3, maxMana: 15 }, 
                description: "{blue:+1 Def, +15 Max Mana}, {gold:+3 Luck}. A token of gratitude from a being of the stars.", 
                _rarity: 'epic', excludeFromLoot: true
            },
            '🏅r': {
                name: 'Royal Signet', type: 'accessory', tile: '🏅', defense: 2, slot: 'accessory',
                statBonuses: { charisma: 3, luck: 1 },
                description: "{blue:+2 Def}, {gold:+3 Cha, +1 Luck}. A heavy gold ring bearing the King's crest.",
                _rarity: 'epic', excludeFromLoot: true
            }
        },

        // --- 2. NEW MAP TILES ---
        tiles: {
            '🕍c': { 
                type: 'landmark', name: 'Cultist Outpost', 
                flavor: "A heavily guarded outpost of the Shadowed Hand.", 
                eventId: 'CULT_OUTPOST_GATES' 
            },
            '🌠e': { 
                type: 'landmark', name: 'Strange Crater', 
                flavor: "A crater still smoking from a recent impact. Someone is inside.", 
                eventId: 'STAR_ELF_CRASH' 
            },
            '⛺e': {
                type: 'landmark', name: 'Royal Emissary Camp',
                flavor: "A pristine white tent guarded by heavily armored knights.",
                eventId: 'ROYAL_EMISSARY'
            }
        },

        // --- 3. SHOPS ---
        // 🌟 EXPANDABILITY WIN: Handled natively by the ExpansionManager
        shops: {
            black_market: [
                { name: 'Cultist Robes', price: 150, stock: 1 },
                { name: 'Poisoned Dagger', price: 200, stock: 1 },
                { name: 'Void Dust', price: 50, stock: 10 },
                { name: 'Demon Horn', price: 150, stock: 5 },
                { name: 'Elixir of Power', price: 1200, stock: 1 },
                { name: 'Scroll of Siphoning', price: 400, stock: 1 },
                { name: 'Tome: Dark Pact', price: 500, stock: 1 }
            ]
        },

        // --- 4. THE EVENT LOGIC ---
        events: {
            'CULT_OUTPOST_GATES': {
                title: "The Shadowed Hand",
                oncePerTile: false,
                nodes: {
                    'start': {
                        text: "Two cloaked figures step from the shadows, blocking the iron gate. They draw jagged daggers.\n\n\"None may enter the Sanctuary of the Void. Turn back, or be sacrificed.\"",
                        choices: [
                            {
                                text: "[Reputation] Give the sign of the Void.",
                                // Requires 50 Reputation with the Cult!
                                req: (player) => (player.reputation && player.reputation.shadowed_hand >= 50),
                                reqHint: "50+ Shadowed Hand Rep",
                                action: (state, ctx) => {
                                    logMessage("{purple:The guards recognize your devotion. They lower their weapons and bow.}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                                },
                                nextNode: 'market'
                            },
                            {
                                text: "[Disguise] Pull the Cultist Robes over your head.",
                                // Reads the player's actively equipped armor!
                                req: (player) => player.equipment.armor && player.equipment.armor.name === 'Cultist Robes',
                                reqHint: "Equip Cultist Robes",
                                action: (state, ctx) => {
                                    logMessage("{gray:The guards nod, mistaking you for an initiate.}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                                },
                                nextNode: 'market'
                            },
                            {
                                text: "Draw your weapon!",
                                action: (state, ctx) => {
                                    logMessage("{red:You attack the guards!}");
                                    state.screenShake = 15;
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#ef4444', 15);
                                    
                                    // Drop Reputation for attacking them
                                    state.player.reputation.shadowed_hand = (state.player.reputation.shadowed_hand || 0) - 10;
                                    logMessage("{gray:Your reputation with the Shadowed Hand decreases. (-10)}");
                                    
                                    // Spawn 2 Cultist Fanatics
                                    const eData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['z'] : { name: 'Cultist', maxHealth: 15, attack: 3, xp: 10 };
                                    const offsets = [[-1, 0], [1, 0]];
                                    offsets.forEach(off => {
                                        const ex = ctx.x + off[0];
                                        const ey = ctx.y + off[1];
                                        const enemyId = `overworld:${ex},${-ey}`;
                                        const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, ex, ey) : eData;
                                        
                                        state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'z', x: ex, y: ey, spawnTime: Date.now() };
                                        if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                                    });

                                    // 🚨 EXPLOIT FIX: Turn the Outpost into a standard ruined castle so they can't farm infinite cultists!
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') {
                                        chunkManager.setWorldTile(ctx.x, ctx.y, '🕍');
                                    }
                                    state.mapDirty = true;
                                }
                            },
                            { text: "Walk away slowly." }
                        ]
                    },
                    'market': {
                        text: "You step inside the dimly lit outpost. A quartermaster eyes you suspiciously from behind a barred counter.\n\n\"What do you need, Brother?\"",
                        choices: [
                            {
                                text: "Browse the Black Market",
                                action: (state, ctx) => {
                                    // Create a persistent shop instance for this specific outpost
                                    const shopId = `black_market_${ctx.x}_${ctx.y}`;
                                    if (!state.shopStates) state.shopStates = {};
                                    if (!state.shopStates[shopId]) {
                                        // Use the newly injected dictionary
                                        state.shopStates[shopId] = JSON.parse(JSON.stringify(window.BLACK_MARKET_INVENTORY || []));
                                    }
                                    
                                    // Route the UI to use this inventory
                                    window.activeShopInventory = state.shopStates[shopId];
                                    
                                    // Close Event UI, Open Shop UI
                                    document.getElementById('loreModal').classList.add('hidden');
                                    
                                    // Update the Shop Title dynamically
                                    const shopTitle = document.getElementById('shopTitle');
                                    if (shopTitle) shopTitle.innerHTML = `Cult Quartermaster <span class="block text-xs font-normal text-purple-400 mt-1 italic tracking-normal font-serif">"The Void provides."</span>`;
                                    
                                    if (typeof renderShop === 'function') renderShop();
                                    const shopModal = document.getElementById('shopModal');
                                    if (shopModal) shopModal.classList.remove('hidden');
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                                }
                            },
                            { text: "Leave." }
                        ]
                    }
                }
            },
            'STAR_ELF_CRASH': {
                title: "Fallen Star",
                oncePerTile: true,
                lootedMessage: "Only a scorched crater remains.",
                nodes: {
                    'start': {
                        text: "The crater is still burning. In the center, a being with iridescent skin and eyes like galaxies lies bleeding.\n\n\"Mortal... the Void... it followed me. Please...\"",
                        choices: [
                            {
                                text: "[Give Healing Potion] Help them.",
                                req: (player) => player.inventory.some(i => i && i.name === 'Healing Potion' && !i.isEquipped),
                                reqHint: "Requires Healing Potion",
                                action: (state, ctx) => {
                                    // Consume potion safely
                                    const idx = state.player.inventory.findIndex(i => i && i.name === 'Healing Potion' && !i.isEquipped);
                                    state.player.inventory[idx].quantity--;
                                    if (state.player.inventory[idx].quantity <= 0) state.player.inventory.splice(idx, 1);
                                    
                                    // Adjust Reputation
                                    state.player.reputation.fae_court = (state.player.reputation.fae_court || 0) + 25;
                                    logMessage("{green:The being drinks the potion and their wounds close. They hand you a glowing amulet before vanishing into light.}");
                                    logMessage("{blue:Reputation with the Fae Court increased! (+25)}");
                                    
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#3b82f6', 30);
                                    
                                    // Give Unique Artifact
                                    const amulet = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🧿st'] : null;
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    
                                    if (amulet) {
                                        if (state.player.inventory.length < invCap) {
                                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(amulet) : JSON.parse(JSON.stringify(amulet));
                                            newItem.templateId = '🧿st';
                                            newItem.quantity = 1;
                                            newItem.isEquipped = false;
                                            state.player.inventory.push(newItem);
                                        } else {
                                            logMessage("{red:Your inventory is full! The amulet drops at your feet.}");
                                            // 🚨 BUG FIX: Drop on player coords so map cleanup doesn't erase it
                                            if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(state.player.x, state.player.y, '🧿', 24);
                                        }
                                    }
                                    
                                    // Cleanup the map tile
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '.');
                                    state.mapDirty = true;
                                }
                            },
                            {
                                text: "Slay the creature for its magical core.",
                                action: (state, ctx) => {
                                    // Adjust Reputation (Dark Path)
                                    state.player.reputation.fae_court = (state.player.reputation.fae_court || 0) - 50;
                                    state.player.reputation.shadowed_hand = (state.player.reputation.shadowed_hand || 0) + 10;
                                    
                                    logMessage("{red:You mercilessly strike down the star-wanderer.}");
                                    logMessage("{gray:The Fae Court will remember this. (+10 Shadowed Hand Rep)}");
                                    
                                    state.screenShake = 15;
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy');
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#991b1b', 20);
                                    
                                    // Give Star-Metal
                                    const metal = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['☄️'] : { name: 'Star-Metal Ore', type: 'junk' };
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    
                                    const existingStack = state.player.inventory.find(i => i && i.name === 'Star-Metal Ore' && !i.isEquipped);
                                    if (existingStack) {
                                        existingStack.quantity += 2;
                                    } else if (state.player.inventory.length < invCap) {
                                        const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(metal) : JSON.parse(JSON.stringify(metal));
                                        newItem.templateId = '☄️';
                                        newItem.quantity = 2;
                                        newItem.isEquipped = false;
                                        state.player.inventory.push(newItem);
                                    } else {
                                        logMessage("{red:Your inventory is full! The ore drops at your feet.}");
                                        // 🚨 BUG FIX: Drop on player coords
                                        if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(state.player.x, state.player.y, '☄️', 24);
                                    }
                                    
                                    // Turn the crater into a deadlands tile to signify the corruption
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, 'd');
                                    state.mapDirty = true;
                                }
                            },
                            { text: "Walk away and leave them to their fate." }
                        ]
                    }
                }
            },
            'ROYAL_EMISSARY': {
                title: "The Crown's Emissary",
                oncePerTile: true,
                lootedMessage: "The knights stand at attention. The Emissary is busy drafting reports.",
                nodes: {
                    'start': {
                        text: "An aristocratic man in pristine silk robes looks up from a folding desk. Flanking him are two knights in heavy plate.\n\n\"Halt, traveler. By order of the Crown, state your business.\"",
                        choices: [
                            {
                                text: "[Reputation] Present your credentials.",
                                req: (player) => (player.reputation && player.reputation.the_crown >= 20),
                                reqHint: "20+ Crown Rep",
                                action: (state, ctx) => {
                                    logMessage("{blue:The Emissary smiles. \"Ah, a loyal servant of the realm. Please, take this for your continued efforts.\"}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#facc15', 20);

                                    state.player.coins += 250;
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    const itemTemplate = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🏅r'] : null;

                                    if (itemTemplate) {
                                        if (state.player.inventory.length < invCap) {
                                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(itemTemplate) : JSON.parse(JSON.stringify(itemTemplate));
                                            newItem.templateId = '🏅r';
                                            newItem.quantity = 1;
                                            newItem.isEquipped = false;
                                            state.player.inventory.push(newItem);
                                            logMessage("{purple:You received the Royal Signet and 250 Gold!}");
                                        } else {
                                            logMessage("{gold:You received 250 Gold, but your pack was full. The Signet drops at your feet.}");
                                            // 🚨 BUG FIX: Drop on player coords
                                            if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(state.player.x, state.player.y, '🏅', 24);
                                        }
                                    }
                                    state.lootedTiles.add(ctx.tileId);
                                }
                            },
                            {
                                text: "Donate 100 Gold to the Crown's war effort.",
                                req: (player) => player.coins >= 100,
                                reqHint: "100 Gold",
                                action: (state, ctx) => {
                                    state.player.coins -= 100;
                                    state.player.reputation.the_crown = (state.player.reputation.the_crown || 0) + 15;
                                    logMessage("{gold:The Emissary gladly accepts the coin. (+15 Crown Rep)}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                                    state.lootedTiles.add(ctx.tileId);
                                }
                            },
                            { text: "Walk away peacefully." }
                        ]
                    }
                }
            }
        }
    },

    init: function() {
        // ==========================================
        // 1. INJECT THE /REP CHAT COMMAND
        // ==========================================
        // We gracefully monkey-patch the original chat handler so players can type /rep in the global chat box!
        
        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const command = raw.split(' ')[0].toLowerCase();
                
                if (command === 'rep' || command === 'reputation') {
                    const r = gameState.player.reputation || {};
                    // 🎨 JUICE WIN: Colorful and thematic reputation output
                    logMessage("{yellow:--- 📜 Your Reputation 📜 ---}");
                    logMessage(`{blue:The Crown:} ${r.the_crown || 0}`);
                    logMessage(`{purple:Shadowed Hand:} ${r.shadowed_hand || 0}`);
                    logMessage(`{green:Fae Court:} ${r.fae_court || 0}`);
                    logMessage(`{gold:Merchants Guild:} ${r.merchants_guild || 0}`);
                    return; // Intercepted successfully
                }
                
                // If it's not our custom command, pass it back to the original engine!
                originalHandleChat(message);
            };
        }

        // ==========================================
        // 2. WORLD GENERATION SPAWNER
        // ==========================================
        // We safely post-process chunks to occasionally sprinkle our new event tiles!
        
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                // 🚨 ROBUSTNESS WIN: Safe PRNG fallback
                const random = (typeof Alea !== 'undefined' && typeof stringToSeed !== 'undefined') 
                    ? Alea(stringToSeed(`faction_spawn_${chunkId}`)) 
                    : Math.random;
                
                // 15% chance to spawn one of our new events in a chunk
                if (random() < 0.15) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    const tile = chunkData[ry][rx];
                    
                    const subRoll = random();
                    
                    // Spawn the Cultist Outpost in Deadlands or Swamps
                    if ((tile === 'd' || tile === '≈') && subRoll < 0.4) {
                        chunkData[ry][rx] = '🕍c'; 
                    }
                    // Spawn the Star Elf Crater in Mountains or Plains
                    else if ((tile === '^' || tile === '.') && subRoll >= 0.4 && subRoll < 0.7) {
                        chunkData[ry][rx] = '🌠e'; 
                    }
                    // Spawn the Royal Emissary in Forests or Plains
                    else if ((tile === 'F' || tile === '.') && subRoll >= 0.7) {
                        chunkData[ry][rx] = '⛺e';
                    }
                }
            };
        }

        // ==========================================
        // 3. MINIMAP COLOR INTEGRATION
        // ==========================================
        // Inject the newly generated tiles into the global TILE_COLOR_MAP
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🕍c'] = [153, 27, 27, 255];   // Dark Red
            window.TILE_COLOR_MAP['🌠e'] = [56, 189, 248, 255];  // Bright Cyan
            window.TILE_COLOR_MAP['⛺e'] = [30, 58, 138, 255];   // Royal Blue
        }
    }
});

// --- END OF FILE expansion-lore-quests.js ---
