// --- START OF FILE expansion-lore-quests.js ---

window.ExpansionManager.register({
    id: "faction_lore",
    name: "Factions & Deep Lore",
    version: "1.4", // Upgraded version!
    
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
            },
            // --- EXPANSION WIN: Dwarven Consumables ---
            '🍺d': {
                name: 'Dwarven Stout', type: 'consumable', tile: '🍺', _rarity: 'rare',
                description: "Thick, dark, and aggressively alcoholic. {green:+10 Max HP (50 turns)}, {red:-2 Dex (50 turns)}",
                effect: (state) => {
                    state.player.bonusMaxHealth = (state.player.bonusMaxHealth || 0) + 10;
                    if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
                    window.modifyVital('health', 10); // Heal the gap
                    
                    // Add temporary debuff (Engine hooks will clean up the max health boost dynamically if tracked, 
                    // but for simplicity we treat the Stout as a semi-permanent vitality heal with a dex penalty)
                    state.player.dexterityBonus = (state.player.dexterityBonus || 0) - 2;
                    state.player.dexterityBonusTurns = Math.max(state.player.dexterityBonusTurns || 0, 50);
                    
                    logMessage("{green:You chug the stout! You feel indestructible, but a bit sluggish.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    state.screenShake = 5;
                    return true;
                }
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
            },
            '🛒d': {
                type: 'landmark', name: 'Dwarven Steam-Cart',
                flavor: "A massive, broken-down iron cart venting steam.",
                eventId: 'DWARVEN_CARAVAN'
            }
        },

        // --- 3. SHOPS ---
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
                                    
                                    // 🚨 LORE & ROBUSTNESS WIN: Safe reputation modifier
                                    if (typeof window.modifyReputation === 'function') {
                                        window.modifyReputation('shadowed_hand', -10);
                                    }
                                    
                                    // Spawn 2 Cultist Fanatics safely
                                    const eData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['z'] : { name: 'Cultist', maxHealth: 15, attack: 3, xp: 10 };
                                    const offsets = [[-1, 0], [1, 0]];
                                    offsets.forEach(off => {
                                        const ex = ctx.x + off[0];
                                        const ey = ctx.y + off[1];
                                        
                                        if (typeof chunkManager !== 'undefined') {
                                            const tileAt = chunkManager.getTile(ex, ey);
                                            if (!['.', 'F', 'd', 'D', '≈'].includes(tileAt)) return;
                                        }

                                        const enemyId = `overworld:${ex},${-ey}`;
                                        const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, ex, ey) : eData;
                                        
                                        state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'z', x: ex, y: ey, spawnTime: Date.now() };
                                        
                                        if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, null, null, ex, ey);

                                        if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                                    });

                                    // Turn the Outpost into a standard ruined castle so they can't farm infinite cultists!
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') {
                                        chunkManager.setWorldTile(ctx.x, ctx.y, '🕍');
                                    }
                                    state.mapDirty = true;
                                    
                                    // 🚨 BUG FIX: Ensure the save triggers
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ reputation: state.player.reputation, lootedTiles: Object.fromEntries(state.lootedTiles) });
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
                                        state.shopStates[shopId] = JSON.parse(JSON.stringify(window.BLACK_MARKET_INVENTORY || []));
                                    }
                                    
                                    window.activeShopInventory = state.shopStates[shopId];
                                    
                                    document.getElementById('loreModal').classList.add('hidden');
                                    
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
                                    const dropSafely = (tileToDrop) => {
                                        let placed = false;
                                        if (typeof chunkManager !== 'undefined') {
                                            for (let r = 0; r <= 2 && !placed; r++) {
                                                for (let dy = -r; dy <= r && !placed; dy++) {
                                                    for (let dx = -r; dx <= r && !placed; dx++) {
                                                        const tx = state.player.x + dx;
                                                        const ty = state.player.y + dy;
                                                        const tileAt = chunkManager.getTile(tx, ty);
                                                        if (['.', 'F', 'd', 'D', '❄️', '🍄'].includes(tileAt)) {
                                                            chunkManager.setWorldTile(tx, ty, tileToDrop, 24);
                                                            placed = true;
                                                        }
                                                    }
                                                }
                                            }
                                            if (!placed) chunkManager.setWorldTile(state.player.x, state.player.y, tileToDrop, 24);
                                            state.mapDirty = true;
                                        }
                                    };

                                    const idx = state.player.inventory.findIndex(i => i && i.name === 'Healing Potion' && !i.isEquipped);
                                    state.player.inventory[idx].quantity--;
                                    if (state.player.inventory[idx].quantity <= 0) state.player.inventory.splice(idx, 1);
                                    
                                    // 🚨 LORE & ROBUSTNESS WIN: Safe reputation modifier
                                    if (typeof window.modifyReputation === 'function') {
                                        window.modifyReputation('fae_court', 25);
                                    }
                                    
                                    logMessage("{green:The being drinks the potion and their wounds close. They hand you a glowing amulet before vanishing into light.}");
                                    
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    if (typeof ParticleSystem !== 'undefined') {
                                        ParticleSystem.createExplosion(ctx.x, ctx.y, '#3b82f6', 30);
                                    }
                                    
                                    const amulet = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🧿st'] : null;
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    
                                    if (amulet) {
                                        if (state.player.inventory.length < invCap) {
                                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(amulet) : JSON.parse(JSON.stringify(amulet));
                                            newItem.templateId = '🧿st'; newItem.quantity = 1; newItem.isEquipped = false;
                                            state.player.inventory.push(newItem);
                                        } else {
                                            logMessage("{red:Your inventory is full! The amulet drops at your feet.}");
                                            dropSafely('🧿');
                                        }
                                    }
                                    
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '.');
                                    state.mapDirty = true;
                                    
                                    // 🚨 BUG FIX: Ensure the save triggers
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ reputation: state.player.reputation, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) });
                                }
                            },
                            {
                                text: "Slay the creature for its magical core.",
                                action: (state, ctx) => {
                                    const dropSafely = (tileToDrop) => {
                                        let placed = false;
                                        if (typeof chunkManager !== 'undefined') {
                                            for (let r = 0; r <= 2 && !placed; r++) {
                                                for (let dy = -r; dy <= r && !placed; dy++) {
                                                    for (let dx = -r; dx <= r && !placed; dx++) {
                                                        const tx = state.player.x + dx;
                                                        const ty = state.player.y + dy;
                                                        const tileAt = chunkManager.getTile(tx, ty);
                                                        if (['.', 'F', 'd', 'D', '❄️', '🍄'].includes(tileAt)) {
                                                            chunkManager.setWorldTile(tx, ty, tileToDrop, 24);
                                                            placed = true;
                                                        }
                                                    }
                                                }
                                            }
                                            if (!placed) chunkManager.setWorldTile(state.player.x, state.player.y, tileToDrop, 24);
                                            state.mapDirty = true;
                                        }
                                    };

                                    // Safe reputation modifiers
                                    if (typeof window.modifyReputation === 'function') {
                                        window.modifyReputation('fae_court', -50);
                                        window.modifyReputation('shadowed_hand', 10);
                                    }
                                    
                                    logMessage("{red:You mercilessly strike down the star-wanderer.}");
                                    state.screenShake = 15;
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy');
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#991b1b', 20);
                                    
                                    // 🚨 BUG FIX: Grant XP for the kill
                                    if (typeof grantXp === 'function') grantXp(500);

                                    // 🚨 BUG FIX: Replace the terrain FIRST so the dropped item isn't overwritten!
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, 'd');

                                    const metal = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['☄️'] : { name: 'Star-Metal Ore', type: 'junk' };
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    
                                    const existingStack = state.player.inventory.find(i => i && i.name === 'Star-Metal Ore' && !i.isEquipped);
                                    if (existingStack) {
                                        existingStack.quantity += 2;
                                    } else if (state.player.inventory.length < invCap) {
                                        const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(metal) : JSON.parse(JSON.stringify(metal));
                                        newItem.templateId = '☄️'; newItem.quantity = 2; newItem.isEquipped = false;
                                        state.player.inventory.push(newItem);
                                    } else {
                                        logMessage("{red:Your inventory is full! The ore drops at your feet.}");
                                        dropSafely('☄️');
                                    }
                                    
                                    state.mapDirty = true;
                                    
                                    // Ensure the save triggers
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ reputation: state.player.reputation, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) });
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
                                    const dropSafely = (tileToDrop) => {
                                        let placed = false;
                                        if (typeof chunkManager !== 'undefined') {
                                            for (let r = 0; r <= 2 && !placed; r++) {
                                                for (let dy = -r; dy <= r && !placed; dy++) {
                                                    for (let dx = -r; dx <= r && !placed; dx++) {
                                                        const tx = state.player.x + dx;
                                                        const ty = state.player.y + dy;
                                                        const tileAt = chunkManager.getTile(tx, ty);
                                                        if (['.', 'F', 'd', 'D'].includes(tileAt)) {
                                                            chunkManager.setWorldTile(tx, ty, tileToDrop, 24);
                                                            placed = true;
                                                        }
                                                    }
                                                }
                                            }
                                            if (!placed) chunkManager.setWorldTile(state.player.x, state.player.y, tileToDrop, 24);
                                            state.mapDirty = true;
                                        }
                                    };

                                    logMessage("{blue:The Emissary smiles. \"Ah, a loyal servant of the realm. Please, take this for your continued efforts.\"}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#facc15', 20);

                                    state.player.coins = (Number(state.player.coins) || 0) + 250;
                                    if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(250); // Anti-cheat
                                    
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    const itemTemplate = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🏅r'] : null;

                                    if (itemTemplate) {
                                        if (state.player.inventory.length < invCap) {
                                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(itemTemplate) : JSON.parse(JSON.stringify(itemTemplate));
                                            newItem.templateId = '🏅r'; newItem.quantity = 1; newItem.isEquipped = false;
                                            state.player.inventory.push(newItem);
                                            logMessage("{purple:You received the Royal Signet and 250 Gold!}");
                                        } else {
                                            logMessage("{gold:You received 250 Gold, but your pack was full. The Signet drops at your feet.}");
                                            dropSafely('🏅');
                                        }
                                    }
                                    state.lootedTiles.add(ctx.tileId);
                                    
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ coins: state.player.coins, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) });
                                }
                            },
                            {
                                text: "Donate 100 Gold to the Crown's war effort.",
                                req: (player) => player.coins >= 100,
                                reqHint: "100 Gold",
                                action: (state, ctx) => {
                                    state.player.coins -= 100;
                                    
                                    // 🚨 LORE & ROBUSTNESS WIN: Safe reputation modifier
                                    if (typeof window.modifyReputation === 'function') {
                                        window.modifyReputation('the_crown', 15);
                                    }
                                    
                                    logMessage("{gold:The Emissary gladly accepts the coin.}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                                    if (typeof ParticleSystem !== 'undefined') {
                                        ParticleSystem.createFloatingText(ctx.x, ctx.y, "-100g", "#ef4444");
                                    }
                                    
                                    state.lootedTiles.add(ctx.tileId);
                                    
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ coins: state.player.coins, reputation: state.player.reputation, lootedTiles: Object.fromEntries(state.lootedTiles) });
                                }
                            },
                            { text: "Walk away peacefully." }
                        ]
                    }
                }
            },
            'DWARVEN_CARAVAN': {
                title: "Stranded Dwarves",
                oncePerTile: false,
                nodes: {
                    'start': {
                        text: "A massive steam-powered cart sits mired in the mud. Three angry dwarves are striking it with wrenches.\n\n\"The boiler cracked! We need Iron Ore to patch it, or we're sitting ducks!\"",
                        choices: [
                            {
                                text: "Give them 10 Iron Ore.",
                                req: (player) => {
                                    const iron = player.inventory.find(i => i && i.name === 'Iron Ore' && !i.isEquipped);
                                    return iron && iron.quantity >= 10;
                                },
                                reqHint: "10x Iron Ore",
                                action: (state, ctx) => {
                                    const dropSafely = (tileToDrop) => {
                                        let placed = false;
                                        if (typeof chunkManager !== 'undefined') {
                                            for (let r = 0; r <= 2 && !placed; r++) {
                                                for (let dy = -r; dy <= r && !placed; dy++) {
                                                    for (let dx = -r; dx <= r && !placed; dx++) {
                                                        const tx = state.player.x + dx;
                                                        const ty = state.player.y + dy;
                                                        const tileAt = chunkManager.getTile(tx, ty);
                                                        if (['.', 'F', 'd', 'D'].includes(tileAt)) {
                                                            chunkManager.setWorldTile(tx, ty, tileToDrop, 24);
                                                            placed = true;
                                                        }
                                                    }
                                                }
                                            }
                                            if (!placed) chunkManager.setWorldTile(state.player.x, state.player.y, tileToDrop, 24);
                                            state.mapDirty = true;
                                        }
                                    };

                                    const idx = state.player.inventory.findIndex(i => i && i.name === 'Iron Ore' && !i.isEquipped);
                                    state.player.inventory[idx].quantity -= 10;
                                    const freesSlot = state.player.inventory[idx].quantity <= 0;
                                    if (freesSlot) state.player.inventory.splice(idx, 1);
                                    
                                    // 🚨 LORE & ROBUSTNESS WIN: Safe reputation modifier
                                    if (typeof window.modifyReputation === 'function') {
                                        window.modifyReputation('dwarven_clans', 20);
                                    }
                                    
                                    logMessage("{green:\"Ha! Good stone, this! Take a flagon for your troubles!\"}");
                                    
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    
                                    const stout = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🍺d'] : null;
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    
                                    if (stout) {
                                        if (state.player.inventory.length - (freesSlot ? 1 : 0) < invCap) {
                                            const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(stout) : JSON.parse(JSON.stringify(stout));
                                            newItem.templateId = '🍺d'; newItem.quantity = 1; newItem.isEquipped = false; newItem.effect = stout.effect;
                                            state.player.inventory.push(newItem);
                                            logMessage("{purple:You received a Dwarven Stout!}");
                                        } else {
                                            logMessage("{red:Your inventory is full! The Stout drops at your feet.}");
                                            dropSafely('🍺');
                                        }
                                    }
                                    
                                    // They fix the cart and leave!
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '.');
                                    state.mapDirty = true;
                                    
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ reputation: state.player.reputation, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory, lootedTiles: Object.fromEntries(state.lootedTiles) });
                                }
                            },
                            {
                                text: "Rob them! (PvE)",
                                action: (state, ctx) => {
                                    if (typeof window.modifyReputation === 'function') {
                                        window.modifyReputation('dwarven_clans', -30);
                                    }
                                    
                                    logMessage("{red:\"To arms! Defend the cargo!\"}");
                                    state.screenShake = 15;
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                    
                                    // Spawn 3 angry miners
                                    const eData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['👷'] : { name: 'Dwarven Miner', maxHealth: 25, attack: 5, xp: 35 };
                                    const offsets = [[-1, 0], [1, 0], [0, -1]];
                                    offsets.forEach(off => {
                                        const ex = ctx.x + off[0];
                                        const ey = ctx.y + off[1];
                                        
                                        if (typeof chunkManager !== 'undefined') {
                                            const tileAt = chunkManager.getTile(ex, ey);
                                            if (!['.', 'F', 'd', 'D', '≈'].includes(tileAt)) return;
                                        }

                                        const enemyId = `overworld:${ex},${-ey}`;
                                        const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, ex, ey) : eData;
                                        
                                        state.sharedEnemies[enemyId] = { ...scaledStats, tile: '👷', name: 'Angry Dwarf', x: ex, y: ey, spawnTime: Date.now() };
                                        
                                        if (typeof updateSpatialMap === 'function') updateSpatialMap(enemyId, null, null, ex, ey);

                                        if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                                    });

                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') {
                                        chunkManager.setWorldTile(ctx.x, ctx.y, '📦'); // Leave their cargo!
                                    }
                                    state.mapDirty = true;
                                    
                                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ reputation: state.player.reputation, lootedTiles: Object.fromEntries(state.lootedTiles) });
                                }
                            },
                            { text: "Walk away." }
                        ]
                    }
                }
            }
        }
    },

    init: function() {
        
        // ==========================================
        // 1. REPUTATION CLAMPING & TITLES ENGINE
        // ==========================================
        // Attaches a globally accessible helper for all expansions to use!
        window.modifyReputation = function(factionKey, amount) {
            const p = gameState.player;
            if (!p.reputation) p.reputation = {};
            if (!p.titles) p.titles = [];
            
            let current = Number(p.reputation[factionKey]) || 0;
            let next = Math.max(-100, Math.min(100, current + amount));
            
            p.reputation[factionKey] = next;
            
            const diff = next - current;
            if (diff !== 0) {
                const color = diff > 0 ? '#3b82f6' : '#ef4444';
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(p.x, p.y, `${diff > 0 ? '+' : ''}${diff} Rep`, color);
                }
            }
            
            // --- EXALTED TITLES SYSTEM ---
            const factionTitles = {
                'the_crown': { name: "Knight of the Realm", color: "blue" },
                'shadowed_hand': { name: "Hand of the Void", color: "purple" },
                'fae_court': { name: "Friend of the Fae", color: "green" },
                'dwarven_clans': { name: "Honorary Ironborn", color: "orange" },
                'merchants_guild': { name: "Master of Coin", color: "gold" }
            };

            if (next === 100 && factionTitles[factionKey]) {
                const titleData = factionTitles[factionKey];
                if (!p.titles.includes(titleData.name)) {
                    p.titles.push(titleData.name);
                    logMessage(`{${titleData.color}:🌟 EXALTED! You are fully trusted by this faction. You earned the title <${titleData.name}>!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                }
            }
            
            const infamousTitles = {
                'the_crown': { name: "Most Wanted", color: "red" },
                'fae_court': { name: "Bane of the Woods", color: "gray" },
                'dwarven_clans': { name: "Oathbreaker", color: "gray" }
            };

            if (next === -100 && infamousTitles[factionKey]) {
                const titleData = infamousTitles[factionKey];
                if (!p.titles.includes(titleData.name)) {
                    p.titles.push(titleData.name);
                    logMessage(`{${titleData.color}:☠️ INFAMOUS! You are deeply despised by this faction. You earned the title <${titleData.name}>!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                }
            }
        };

        // ==========================================
        // 2. INJECT THE /REP CHAT COMMAND (WITH ASCII UI!)
        // ==========================================
        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            
            window.handleChatCommand = function(message) {
                if (!message.startsWith('/')) return;

                const raw = message.substring(1); 
                const command = raw.split(' ')[0].toLowerCase();
                const args = raw.split(' ').slice(1);
                
                if (command === 'rep' || command === 'reputation') {
                    const r = gameState.player.reputation || {};
                    
                    // --- 🌟 UX WIN: ASCII PROGRESS BARS ---
                    const drawBar = (val) => {
                        const safeVal = Number(val) || 0;
                        const pct = Math.floor((safeVal + 100) / 20); // Maps -100..100 to 0..10
                        const filled = '='.repeat(pct);
                        const empty = '-'.repeat(10 - pct);
                        // Make the 0 line clear
                        let bar = `[${filled}${empty}]`;
                        if (pct < 5) bar = `{red:${bar}}`;
                        else if (pct === 5) bar = `{gray:${bar}}`;
                        else bar = `{green:${bar}}`;
                        return bar;
                    };

                    const getStatus = (val) => {
                        const num = Number(val) || 0;
                        if (num >= 100) return '{yellow:[Exalted]}';
                        if (num >= 50) return '{green:[Allied]}';
                        if (num >= 20) return '{blue:[Friendly]}';
                        if (num <= -100) return '{red:[Nemesis]}';
                        if (num <= -50) return '{red:[Hunted]}';
                        if (num <= -20) return '{orange:[Hostile]}';
                        return '{gray:[Neutral]}';
                    };

                    logMessage("{yellow:--- 📜 Faction Standing 📜 ---}");
                    logMessage(`{blue:The Crown:}      ${drawBar(r.the_crown)} ${getStatus(r.the_crown)}`);
                    logMessage(`{purple:Shadowed Hand:}  ${drawBar(r.shadowed_hand)} ${getStatus(r.shadowed_hand)}`);
                    logMessage(`{green:Fae Court:}      ${drawBar(r.fae_court)} ${getStatus(r.fae_court)}`);
                    logMessage(`{orange:Dwarven Clans:}  ${drawBar(r.dwarven_clans)} ${getStatus(r.dwarven_clans)}`);
                    logMessage(`{gold:Merchants Guild:} ${drawBar(r.merchants_guild)} ${getStatus(r.merchants_guild)}`);
                    return; 
                }
                
                // --- 🌟 EXPANSION WIN: Title Command ---
                if (command === 'title') {
                    const p = gameState.player;
                    if (!p.titles || p.titles.length === 0) {
                        logMessage("{gray:You have not earned any Exalted titles yet.}");
                        return;
                    }
                    
                    const reqTitle = args.join(' ').trim();
                    if (!reqTitle) {
                        logMessage(`{gold:Your Titles:} ${p.titles.map(t => `<${t}>`).join(', ')}`);
                        logMessage("{gray:Use /title [name] to equip one, or /title clear.}");
                        return;
                    }
                    
                    if (reqTitle.toLowerCase() === 'clear') {
                        p.activeTitle = null;
                        logMessage("{gray:Title cleared.}");
                        if (typeof renderStats === 'function') renderStats();
                        if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ activeTitle: null });
                        return;
                    }

                    // Case insensitive search
                    const match = p.titles.find(t => t.toLowerCase() === reqTitle.toLowerCase());
                    if (match) {
                        p.activeTitle = match;
                        logMessage(`{gold:You are now known as <${match}>.}`);
                        if (typeof renderStats === 'function') renderStats();
                        if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ activeTitle: match });
                    } else {
                        logMessage("{red:You have not earned that title.}");
                    }
                    return;
                }
                
                originalHandleChat(message);
            };
        }

        // ==========================================
        // 3. WORLD GENERATION SPAWNER
        // ==========================================

        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
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
                    if ((tile === 'd' || tile === '≈') && subRoll < 0.3) {
                        chunkData[ry][rx] = '🕍c'; 
                    }
                    // Spawn the Star Elf Crater in Mountains or Plains
                    else if ((tile === '^' || tile === '.') && subRoll >= 0.3 && subRoll < 0.6) {
                        chunkData[ry][rx] = '🌠e'; 
                    }
                    // Spawn the Royal Emissary in Forests or Plains
                    else if ((tile === 'F' || tile === '.') && subRoll >= 0.6 && subRoll < 0.9) {
                        chunkData[ry][rx] = '⛺e';
                    }
                    // Spawn the Dwarven Steam-Cart on Paths or Mountains
                    else if ((tile === '▤' || tile === '^' || tile === 'd') && subRoll >= 0.9) {
                        chunkData[ry][rx] = '🛒d';
                    }
                }
            };
        }

        // ==========================================
        // 4. MINIMAP COLOR INTEGRATION
        // ==========================================

        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🕍c'] = [153, 27, 27, 255];   // Dark Red
            window.TILE_COLOR_MAP['🌠e'] = [56, 189, 248, 255];  // Bright Cyan
            window.TILE_COLOR_MAP['⛺e'] = [30, 58, 138, 255];   // Royal Blue
            window.TILE_COLOR_MAP['🛒d'] = [120, 113, 108, 255]; // Stone Gray
        }
    }
});

// --- END OF FILE expansion-lore-quests.js ---
