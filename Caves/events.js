// --- START OF FILE events.js ---

// ==========================================
// EVENT & NARRATIVE ENGINE
// ==========================================

// PERFORMANCE WIN: Cache DOM lookups for the Event Engine
const _evtDOMCache = {
    title: null,
    content: null,
    modal: null,
    getTitle: () => _evtDOMCache.title || (document.getElementById('loreTitle') && (_evtDOMCache.title = document.getElementById('loreTitle'))),
    getContent: () => _evtDOMCache.content || (document.getElementById('loreContent') && (_evtDOMCache.content = document.getElementById('loreContent'))),
    getModal: () => _evtDOMCache.modal || (document.getElementById('loreModal') && (_evtDOMCache.modal = document.getElementById('loreModal')))
};

window.EVENT_DATA = {
    'CULT_HIDEOUT': {
        title: "Hidden Trapdoor",
        oncePerTile: false,
        nodes: {
            'start': {
                text: "You arrive at the coordinates from the ledger. Hidden beneath a pile of brush is a heavy wooden trapdoor bound in iron.\n\nYou hear chanting coming from below.",
                choices: [
                    {
                        text: "Kick the door open and attack!",
                        action: (state, ctx) => {
                            logMessage("{red:You kick the door open! The cultists shriek and attack!}");
                            state.screenShake = 20;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                            
                            // 🚨 GHOST GUARD: Ensure enemy data exists before mapping
                            const enemyData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['z'] : { name: 'Cultist', maxHealth: 15, attack: 3, xp: 10 };
                            
                            // Spawn 3 Cultists in a ring around the trapdoor
                            const spawnSpots = [[-1, 0], [1, 0], [0, -1]];
                            for (let i = 0; i < 3; i++) {
                                const ex = ctx.x + spawnSpots[i][0];
                                const ey = ctx.y + spawnSpots[i][1];
                                
                                const enemyId = `overworld:${ex},${-ey}`;
                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, ex, ey) : enemyData;
                                
                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'z', x: ex, y: ey, spawnTime: Date.now() };
                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                            }

                            // Clear the investigation
                            state.activeInvestigation = null;
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#ef4444', 15);
                        }
                    },
                    {
                        text: "Sneak inside and steal their loot.",
                        req: (player) => (Number(player.dexterity) + Number(player.dexterityBonus || 0)) >= 5, 
                        reqHint: "Requires 5 Dexterity", 
                        action: (state, ctx) => {
                            logMessage("{green:You slip into the shadows, bypassing the guards, and find their stash!}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                            
                            state.player.coins = (Number(state.player.coins) || 0) + 250;
                            if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(250);
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const scroll = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🩸'] : { name: 'Scroll of Siphoning', type: 'spellbook', tile: '🩸' };
                            let newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(scroll) : JSON.parse(JSON.stringify(scroll));
                            
                            newItem.templateId = '🩸';
                            newItem.quantity = 1;
                            newItem.tile = scroll.tile || '🩸';
                            newItem.isEquipped = false;

                            if (state.player.inventory.length < invCap) {
                                state.player.inventory.push(newItem);
                                logMessage("{purple:You stole a Scroll of Siphoning and 250 Gold!}");
                            } else {
                                // 🚨 BUG FIX WIN: Fallback to safe spiral drop if inventory is full!
                                logMessage("{gold:You stole 250 Gold, but your pack is too full for the Scroll! It drops to the floor.}");
                                if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                    window.EventManager.safeDropItem(state, ctx.x, ctx.y, newItem.tile);
                                }
                            }

                            // Clear the investigation
                            state.activeInvestigation = null;
                        }
                    },
                    {
                        text: "Leave it alone for now."
                    }
                ]
            }
        }
    },
    'WOUNDED_KNIGHT': {
        title: "Wounded Knight",
        oncePerTile: false, 
        nodes: {
            'start': {
                text: "A royal knight slumps against a rock, clutching a bleeding wound.\n\n\"Traveler... the shadows... they took the caravan...\"",
                choices: [
                    {
                        text: "Take his offering.",
                        action: (state, ctx) => {
                            logMessage("{gray:The knight presses something into your hand before going still.}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal();
                            
                            state.player.coins = (Number(state.player.coins) || 0) + 50;
                            if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(50);
                            
                            // 1. Resolve the NPC tile cleanup securely
                            window.EventManager.replaceEventTile(state, ctx.x, ctx.y, '⚰️');
                            
                            // 2. Grant or drop the item safely!
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const potion = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🍷'] : null;
                            
                            if (potion) {
                                const existing = state.player.inventory.find(i => i && i.name === potion.name && !i.isEquipped);
                                
                                if (existing) {
                                    existing.quantity++;
                                    logMessage("{gold:You received an Elixir of Life and 50 Gold.}");
                                } else if (state.player.inventory.length < invCap) {
                                    // 🚨 ROBUSTNESS WIN: Safe deep clone
                                    let newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(potion) : JSON.parse(JSON.stringify(potion));
                                    newItem.templateId = '🍷';
                                    newItem.quantity = 1;
                                    newItem.tile = potion.tile || '🍷';
                                    newItem.isEquipped = false;
                                    newItem.effect = potion.effect;
                                    state.player.inventory.push(newItem);
                                    logMessage("{gold:You received an Elixir of Life and 50 Gold.}");
                                } else {
                                    logMessage("{gold:You received 50 Gold, but your pack is too full! The Elixir drops to the ground.}");
                                    // 🚨 THE FIX: Drop the item via outward spiral to prevent map corruption
                                    if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                        window.EventManager.safeDropItem(state, state.player.x, state.player.y, potion.tile || '🍷');
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    'ALTAR_OF_BLOOD': {
        title: 'Altar of Blood',
        oncePerTile: true,
        lootedMessage: "The altar is dormant. It has fed enough.",
        nodes: {
            'start': {
                text: "A jagged crimson stone. It whispers promises of power... for a price.\n\nThe Altar demands half of your current life force in exchange for a dark boon.",
                choices: [
                    {
                        text: "{red:Sacrifice Life Force}",
                        action: (state, ctx) => {
                            const sacrificeAmount = Math.max(1, Math.floor(state.player.health / 2));
                            if (typeof window.modifyVital === 'function') {
                                window.modifyVital('health', -sacrificeAmount);
                            } else {
                                state.player.health -= sacrificeAmount;
                            }
                            
                            logMessage(`{red:You slash your palm over the altar! (-${sacrificeAmount} HP)}`);
                            state.screenShake = 20;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#ef4444', 30);

                            if (state.player.health <= 0) return;

                            const roll = Math.random();
                            if (roll < 0.25) {
                                logMessage("{purple:The blood summons a horror from the Void!}");
                                const enemyTemplate = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['😈d'] : { name: 'Void Demon', maxHealth: 50, attack: 8 };
                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyTemplate, ctx.x, ctx.y) : enemyTemplate;
                                const enemyId = `overworld:${ctx.x+1},${-ctx.y}`;
                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: '😈d', x: ctx.x+1, y: ctx.y, spawnTime: Date.now() };
                                
                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ctx.x+1, ctx.y, enemyId)).set(state.sharedEnemies[enemyId]);
                            } else {
                                if (Math.random() < 0.5) {
                                    state.player.bonusMaxHealth = (Number(state.player.bonusMaxHealth) || 0) + 3;
                                    if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
                                    logMessage("{gold:The blood boils in your veins. Your vitality permanently increases! (+3 Max HP)}");
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "+3 MAX HP", "#facc15");
                                } else {
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    const fallbackWeapon = { name: 'Blood Blade', type: 'weapon', quantity: 1, damage: 10, tile: '🗡️', isEquipped: false, tags: ['blade'], statBonuses: {} };
                                    const loot = typeof generateMagicItem === 'function' ? generateMagicItem(5) : fallbackWeapon;
                                    
                                    if (state.player.inventory.length < invCap) {
                                        state.player.inventory.push(loot);
                                        logMessage(`{purple:The altar regurgitates a dark weapon: ${loot.name}!}`);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    } else {
                                        logMessage(`{red:The altar offers the ${loot.name}, but your pack is full! It drops to the ground.}`);
                                        if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                            window.EventManager.safeDropItem(state, ctx.x, ctx.y, loot.tile || '🗡️');
                                        }
                                    }
                                }
                            }
                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "Step away."
                    }
                ]
            }
        }
    },
    // --- 🌟 LORE WIN: New Event! ---
    'CURSED_SWORD_STONE': {
        title: "The Bleeding Stone",
        oncePerTile: true,
        lootedMessage: "The stone is cracked and lifeless.",
        nodes: {
            'start': {
                text: "A pitch-black blade is thrust deep into a block of jagged obsidian. The stone itself seems to be slowly bleeding a thick, dark liquid.\n\nThe air around it is freezing cold.",
                choices: [
                    {
                        text: "Pull the blade. (Requires 20 HP)",
                        req: (player) => player.health > 20,
                        reqHint: "Requires > 20 Health",
                        action: (state, ctx) => {
                            // Deduct massive health
                            if (typeof window.modifyVital === 'function') window.modifyVital('health', -15);
                            else state.player.health -= 15;
                            
                            logMessage("{red:You grasp the hilt! Black veins crawl up your arms, draining your life force! (-15 HP)}");
                            state.screenShake = 30;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#991b1b', 40);
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const cursedWeapon = {
                                templateId: '🗡️v', name: 'Cursed Obsidian Edge', type: 'weapon', tags: ['blade'], tile: '🗡️',
                                quantity: 1, damage: 15, slot: 'weapon', isEquipped: false, _rarity: 'epic',
                                statBonuses: { luck: -3, willpower: -2 }, inflicts: 'madness', inflictChance: 0.3,
                                description: "{red:+15 Dmg}, {gray:-3 Luck, -2 Will}. The blade whispers to you. Can inflict Madness on targets."
                            };

                            if (state.player.inventory.length < invCap) {
                                state.player.inventory.push(cursedWeapon);
                                logMessage(`{purple:The stone shatters! You acquired the ${cursedWeapon.name}!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                            } else {
                                logMessage(`{red:The stone shatters, but your pack is full! The ${cursedWeapon.name} drops to the ground.}`);
                                if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                    window.EventManager.safeDropItem(state, ctx.x, ctx.y, cursedWeapon.tile);
                                }
                            }
                            
                            window.EventManager.replaceEventTile(state, ctx.x, ctx.y, '🏚');
                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "Leave it. It's not worth the risk."
                    }
                ]
            }
        }
    },
    'SHADY_SMUGGLER': {
        title: "Shady Smuggler",
        oncePerTile: false,
        nodes: {
            'start': {
                text: "A hooded figure motions for you to approach from the shadows.\n\n\"I got a mystery box. 100 Gold. You want it or not?\"",
                choices: [
                    {
                        text: "Buy Mystery Box",
                        req: (player) => player.coins >= 100,
                        reqHint: "Requires 100 Gold",
                        action: (state, ctx) => {
                            state.player.coins -= 100;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                            
                            // 1. Remove the Smuggler NPC from the map safely
                            window.EventManager.replaceEventTile(state, ctx.x, ctx.y, '.');
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const roll = Math.random();
                            
                            // 2. Grant or drop the item!
                            if (roll < 0.2) {
                                logMessage("{red:You open the box... it's just rocks! You got scammed!}");
                            } else if (roll < 0.8) {
                                const existing = state.player.inventory.find(i => i && i.name === 'Healing Potion' && !i.isEquipped);
                                
                                if (existing) {
                                    existing.quantity += 3;
                                    logMessage("{green:You open the box and find a massive cache of supplies!}");
                                } else if (state.player.inventory.length < invCap) {
                                    const template = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['♥'] : null;
                                    // Safe deep clone
                                    const newItem = template && typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : { name: 'Healing Potion', type: 'consumable', tile: '♥' };
                                    
                                    newItem.templateId = '♥'; 
                                    newItem.quantity = 3; 
                                    newItem.isEquipped = false; 
                                    
                                    state.player.inventory.push(newItem);
                                    logMessage("{green:You open the box and find a massive cache of supplies!}");
                                } else {
                                    logMessage("{red:You open the box, but your inventory is full! The potions spill to the ground.}");
                                    if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                        window.EventManager.safeDropItem(state, state.player.x, state.player.y, '♥');
                                    }
                                }
                            } else {
                                logMessage("{purple:You open the box... A Legendary Artifact is inside!}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#facc15', 20);
                                
                                const fallbackWeapon = { name: 'Smuggler Blade', type: 'weapon', quantity: 1, damage: 8, tile: '🗡️', isEquipped: false, tags: ['blade'], statBonuses: {} };
                                const loot = typeof generateMagicItem === 'function' ? generateMagicItem(5) : fallbackWeapon;
                                
                                if (state.player.inventory.length < invCap) {
                                    state.player.inventory.push(loot);
                                } else {
                                    logMessage("{red:Your inventory is full! The artifact falls to the ground.}");
                                    if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                        window.EventManager.safeDropItem(state, state.player.x, state.player.y, loot.tile || '🗡️');
                                    }
                                }
                            }
                        }
                    },
                    {
                        text: "Leave him be."
                    }
                ]
            }
        }
    },
    'MERCHANT_CARAVAN': {
        title: "Lost Caravan",
        oncePerTile: true,
        lootedMessage: "Only broken wagons and trampled grass remain.",
        nodes: {
            'start': {
                text: "You find a heavily armored trade caravan bogged down in the mud. The merchant looks panicked.\n\n\"Traveler! We've been trapped here for days. My guards are parched and starving. Do you have food and water to spare? We pay well!\"",
                choices: [
                    {
                        text: "Trade 2 Clean Water and 2 Meat for a Rare Relic.",
                        req: (player) => {
                            const water = player.inventory.find(i => i && i.name === 'Clean Water' && !i.isEquipped);
                            const meat = player.inventory.find(i => i && i.name === 'Raw Meat' && !i.isEquipped);
                            return (water && water.quantity >= 2) && (meat && meat.quantity >= 2);
                        },
                        reqHint: "Requires 2 Clean Water & 2 Raw Meat",
                        action: (state, ctx) => {
                            const consume = (name, qty) => {
                                let needed = qty;
                                for (let i = state.player.inventory.length - 1; i >= 0; i--) {
                                    if (needed <= 0) break;
                                    let item = state.player.inventory[i];
                                    if (item && item.name === name && !item.isEquipped) {
                                        let take = Math.min(item.quantity, needed);
                                        item.quantity -= take; needed -= take;
                                        if (item.quantity <= 0) state.player.inventory.splice(i, 1);
                                    }
                                }
                            };
                            consume('Clean Water', 2);
                            consume('Raw Meat', 2);

                            logMessage(`{gold:"Bless you, traveler! Take this. We found it in the sands."}`);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();

                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            
                            const existing = state.player.inventory.find(i => i && i.name === 'Void Astrolabe' && !i.isEquipped);
                            if (existing) {
                                existing.quantity++;
                                logMessage(`{purple:You received a Void Astrolabe!}`);
                            } else if (state.player.inventory.length < invCap) {
                                const template = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🧭v'] : null;
                                let newItem = template && typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : { name: 'Void Astrolabe', type: 'consumable', tile: '🧭' };
                                
                                newItem.templateId = '🧭v';
                                newItem.quantity = 1;
                                newItem.isEquipped = false;
                                
                                state.player.inventory.push(newItem);
                                logMessage(`{purple:You received a Void Astrolabe!}`);
                            } else {
                                logMessage(`{red:The merchant hands you the Astrolabe, but your pack is full! It drops.}`);
                                if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                    window.EventManager.safeDropItem(state, ctx.x, ctx.y, '🧭');
                                }
                            }
                            
                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "Demand they hand over their gold or die.",
                        action: (state, ctx) => {
                            logMessage("{red:\"To arms!\" the merchant screams. \"We're being raided!\"}");
                            state.screenShake = 15;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                            
                            const spawnSpots = [[-1, 0], [1, 0]];
                            const enemyData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['b'] : { name: 'Bandit', maxHealth: 10, attack: 2, defense: 1, xp: 20 };
                            
                            for (let i = 0; i < 2; i++) {
                                const ex = ctx.x + spawnSpots[i][0];
                                const ey = ctx.y + spawnSpots[i][1];
                                const enemyId = `overworld:${ex},${-ey}`;
                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, ex, ey) : enemyData;
                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'b', x: ex, y: ey, name: "Caravan Guard", spawnTime: Date.now() };
                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                            }

                            state.player.alignment = (Number(state.player.alignment) || 0) - 10;
                            logMessage("{gray:Your soul darkens... (-10 Alignment)}");

                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "\"I cannot spare anything. Good luck.\""
                    }
                ]
            }
        }
    },
    'FAE_TRICKSTER': {
        title: "The Laughing Fae",
        oncePerTile: true,
        lootedMessage: "You hear faint giggling on the wind, but see no one.",
        nodes: {
            'start': {
                text: "A beautiful, ethereal creature with iridescent wings hovers before you.\n\n\"Oh, a mortal! How delightful. Will you play a game with me? Give me something shiny, and I shall give you a blessing. Or a curse! The mystery is the fun part!\"",
                choices: [
                    {
                        text: "Offer a Gold Coin to the Fae.",
                        req: (player) => player.coins >= 1,
                        reqHint: "Requires 1 Gold",
                        action: (state, ctx) => {
                            state.player.coins = Math.max(0, (Number(state.player.coins) || 0) - 1);
                            
                            if (Math.random() < 0.5) {
                                logMessage("{green:\"Shiny! I love it! Here, step lightly, mortal!\"}");
                                state.player.dexterityBonus = (Number(state.player.dexterityBonus) || 0) + 5;
                                state.player.dexterityBonusTurns = Math.max(Number(state.player.dexterityBonusTurns) || 0, 100);
                                logMessage("{cyan:You feel impossibly light on your feet! (+5 Dexterity for 100 turns)}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                            } else {
                                logMessage("{purple:\"Boring! I wanted something else! Catch!\"}");
                                state.player.madnessTurns = (Number(state.player.madnessTurns) || 0) + 5;
                                logMessage("{red:The Fae blows sparkling dust in your face. Your mind reels! (Madness)}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                state.screenShake = 15;
                            }
                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "Politely decline and back away."
                    }
                ]
            }
        }
    }
};

window.EventManager = {
    activeEvent: null,
    activeContext: null,
    isProcessingChoice: false, 

    // 🚨 ARCHITECTURE WIN: Global Helper Methods
    // Provides a robust, cross-dimensional way for ANY expansion to modify map tiles during events
    replaceEventTile: function(state, x, y, newTile, ttlHours = 0) {
        if (typeof chunkManager !== 'undefined') {
            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                chunkManager.setWorldTile(x, y, newTile, ttlHours);
            } else if (state.mapMode === 'dungeon') {
                chunkManager.caveMaps[state.currentCaveId][y][x] = newTile;
            } else if (state.mapMode === 'castle') {
                chunkManager.castleMaps[state.currentCastleId][y][x] = newTile;
            }
            state.mapDirty = true;
        }
    },

    safeDropItem: function(state, startX, startY, itemTile) {
        let placed = false;
        let validFloor = '.';
        if (state.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[state.currentCaveTheme]) {
            validFloor = CAVE_THEMES[state.currentCaveTheme].floor;
        }

        if (typeof chunkManager !== 'undefined') {
            // Spiral outwards up to 2 tiles away looking for an empty floor
            for (let r = 0; r <= 2 && !placed; r++) {
                for (let dy = -r; dy <= r && !placed; dy++) {
                    for (let dx = -r; dx <= r && !placed; dx++) {
                        const tx = startX + dx;
                        const ty = startY + dy;
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
            if (!placed) { // Absolute fallback to exact coordinate
                if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(startX, startY, itemTile, 24);
                else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][startY][startX] = itemTile;
                else if (state.mapMode === 'castle') chunkManager.castleMaps[state.currentCastleId][startY][startX] = itemTile;
            }
            state.mapDirty = true;
        }
    },

    startEvent: function(eventId, x, y) {
        const eventData = window.EVENT_DATA[eventId];
        if (!eventData) return;

        this.activeEvent = eventData;
        this.activeContext = { x: x, y: y, tileId: `${x},${-y}` };

        if (eventData.oncePerTile && gameState.lootedTiles.has(this.activeContext.tileId)) {
            logMessage(`{gray:${eventData.lootedMessage || "There is nothing more to do here."}}`);
            return;
        }

        // Add a subtle entrance audio cue for events to draw attention
        if (typeof AudioSystem !== 'undefined') AudioSystem.playHover();

        this.renderNode('start');
    },

    renderNode: function(nodeId) {
        const node = this.activeEvent.nodes[nodeId];
        if (!node) {
            this.endEvent();
            return;
        }

        const loreTitle = _evtDOMCache.getTitle();
        const loreContent = _evtDOMCache.getContent();
        const loreModal = _evtDOMCache.getModal();

        if (!loreTitle || !loreContent || !loreModal) return;

        loreTitle.textContent = this.activeEvent.title;

        // 1. Render ONLY the text inside the scrollable lore container
        loreContent.innerHTML = `<p class="font-serif leading-relaxed mb-2">${formatMenuText(node.text)}</p>`;

        // 2. Build the buttons in a separate container using strings (high performance)
        let btnHtml = `<div id="eventChoicesContainer" class="flex flex-col gap-3 flex-shrink-0 mt-4 border-t border-gray-700 pt-4 w-full opacity-0 translate-y-2 transition-all duration-300" style="animation: fade-in-up 0.3s ease-out forwards;">`;

        node.choices.forEach((choice, index) => {
            const meetsReq = choice.req ? choice.req(gameState.player, this.activeContext) : true;
            
            let btnText = formatMenuText(choice.text);
            if (!meetsReq && choice.reqHint) {
                const safeHint = typeof escapeHtml === 'function' ? escapeHtml(choice.reqHint) : choice.reqHint;
                btnText += ` <span class="text-[10px] uppercase tracking-widest bg-black bg-opacity-40 px-1 rounded shadow-inner border border-gray-700 ml-1">(${safeHint})</span>`;
            }

            const btnClass = meetsReq ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-800 active:border-b-0 active:mt-1' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-75 border-gray-700';
            
            btnHtml += `<button id="evt-btn-${index}" class="w-full ${btnClass} font-bold py-3 px-4 rounded-xl shadow-md transition-transform border-b-4 ${meetsReq ? 'active:scale-95' : ''}" ${meetsReq ? '' : 'disabled'}>
                ${btnText}
            </button>`;
        });

        btnHtml += `</div>`;
        
        // 3. Clean up any old choices from previous nodes
        const oldContainer = document.getElementById('eventChoicesContainer');
        if (oldContainer) oldContainer.remove();

        // 4. Inject the buttons OUTSIDE the scrollable text box, right before the hidden Close button!
        const closeBtn = document.getElementById('closeLoreButton');
        if (closeBtn) {
            closeBtn.classList.add('hidden');
            closeBtn.insertAdjacentHTML('beforebegin', btnHtml);
        }

        loreModal.classList.remove('hidden');

        // 5. Bind Listeners securely
        setTimeout(() => {
            node.choices.forEach((choice, index) => {
                const btn = document.getElementById(`evt-btn-${index}`);
                if (btn && !btn.disabled) {
                    btn.onclick = () => {
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        this.executeChoice(choice);
                    };
                }
            });
        }, 0);
    },

    executeChoice: function(choice) {
        if (this.isProcessingChoice) return;
        this.isProcessingChoice = true;

        try {
            if (choice.action) {
                choice.action(gameState, this.activeContext);
            }

            if (choice.nextNode) {
                this.renderNode(choice.nextNode);
            } else {
                this.endEvent();
            }
        } finally {
            this.isProcessingChoice = false;
        }
    },

    endEvent: function() {
        this.activeEvent = null;
        this.activeContext = null;
        
        const loreModal = _evtDOMCache.getModal();
        if (loreModal) loreModal.classList.add('hidden');
        
        // 🚨 CLEANUP: Remove the injected buttons and restore the native Close button
        const oldContainer = document.getElementById('eventChoicesContainer');
        if (oldContainer) oldContainer.remove();
        
        const closeBtn = document.getElementById('closeLoreButton');
        if (closeBtn) closeBtn.classList.remove('hidden');
        
        if (typeof render === 'function') render();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderStats === 'function') renderStats();
        if (typeof syncPlayerState === 'function') syncPlayerState();
        
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
                coins: gameState.player.coins,
                health: gameState.player.health,
                stamina: gameState.player.stamina,
                lootedTiles: Object.fromEntries(gameState.lootedTiles)
            });
        }
        
        if (document.activeElement) document.activeElement.blur();
    }
};

// 🚨 BUG FIX WIN: The Ghost Buttons Modal Watcher
// If the player opened an event modal but closed it via the Escape key, `endEvent` was bypassed.
// This caused the custom buttons to permanently glue themselves to the UI on standard books/shrines!
// This observer guarantees the DOM is surgically cleaned the millisecond the modal hides.
(function initEventCleanupObserver() {
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachObserver);
    } else {
        attachObserver();
    }

    function attachObserver() {
        const loreModal = document.getElementById('loreModal');
        if (loreModal) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class' && loreModal.classList.contains('hidden')) {
                        // Purge event buttons
                        const oldContainer = document.getElementById('eventChoicesContainer');
                        if (oldContainer) oldContainer.remove();
                        
                        // Restore original close button
                        const closeBtn = document.getElementById('closeLoreButton');
                        if (closeBtn) closeBtn.classList.remove('hidden');
                        
                        // Nullify state
                        if (typeof window.EventManager !== 'undefined') {
                            window.EventManager.activeEvent = null;
                            window.EventManager.activeContext = null;
                        }
                    }
                });
            });
            observer.observe(loreModal, { attributes: true });
            
            // Inject tiny CSS animation for UI smoothness
            const style = document.createElement('style');
            style.innerHTML = `@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
            document.head.appendChild(style);
        }
    }
})();

// --- END OF FILE events.js ---
