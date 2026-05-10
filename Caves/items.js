/**
 * Takes raw player data (from Firebase) and reconnects it to game templates.
 * ensuring items have effects, correct stats, and valid IDs.
 */

function rehydratePlayerState(data) {
    if (!data.inventory) return [];

    return data.inventory.map(item => {
        let templateItem = null;
        let templateKey = null;

        // 1. ROBUST LOOKUP
        if (item.templateId && ITEM_DATA[item.templateId]) {
            templateItem = ITEM_DATA[item.templateId];
            templateKey = item.templateId;
        }

        // 2. FALLBACK A: Name Match
        if (!templateItem) {
            templateKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === item.name);
            if (templateKey) templateItem = ITEM_DATA[templateKey];
        }

        // 3. FALLBACK B: Suffix Match
        if (!templateItem) {
            const candidates = Object.keys(ITEM_DATA).filter(k => item.name.endsWith(ITEM_DATA[k].name));
            if (candidates.length > 0) {
                // Find longest match (Iron Sword vs Sword)
                candidates.sort((a, b) => ITEM_DATA[b].name.length - ITEM_DATA[a].name.length);
                templateKey = candidates[0];
                templateItem = ITEM_DATA[templateKey];
            }
        }

        if (templateItem) {
            // Heal Data
            if (!item.templateId) item.templateId = templateKey;
            
            // Re-bind Logic
            item.effect = templateItem.effect;
            item.onHit = templateItem.onHit;
            item.procChance = templateItem.procChance;
            item.inflicts = templateItem.inflicts;
            item.inflictChance = templateItem.inflictChance;

            // Heal Missing Stats (Keep existing ones if present)
            if(item.damage === undefined || item.damage === null) item.damage = templateItem.damage;
            if(item.defense === undefined || item.defense === null) item.defense = templateItem.defense;
            item.slot = templateItem.slot; // Always force slot to prevent bugs
            item.tile = item.tile || templateItem.tile; // Ensure icon
            
        } else {
            console.warn(`Converting corrupted item to Ash: ${item.name}`);
            item.name = `Ash (${item.name})`;
            item.description = "Dust from a forgotten version.";
            item.type = 'junk';
            item.tile = '💨';
            item.quantity = item.quantity || 1;
        }
        return item;
    });
}

/**
 * Generates loot when an enemy is defeated.
 * Drops a mix of Junk, Gold, or Level-Scaled Loot.
 * @param {object} player - The player's full state object.
 * @param {object} enemy - The enemy data (from ENEMY_DATA or RTDB).
 * @returns {string} The tile character of the dropped item.
 */

function generateEnemyLoot(player, enemy) {

    // --- 0. QUEST ITEM DROPS ---
    // 1. Sun Shard (Desert, 5% chance)
    if (gameState.player.relicQuestStage === 1 && (enemy.tile === '🦂' || enemy.tile === 'm') && Math.random() < 0.05) {
        logMessage("You found the Sun Shard!");
        return '💎s';
    }
    // 2. Moon Tear (Swamp, 5% chance)
    if (gameState.player.relicQuestStage === 2 && (enemy.tile === 'l' || enemy.tile === 'Hydra') && Math.random() < 0.05) {
        logMessage("You found the Moon Tear!");
        return '💎m';
    }
    // 3. Void Crystal (Mountain, 5% chance)
    if (gameState.player.relicQuestStage === 3 && (enemy.tile === 'Y' || enemy.tile === '🐲') && Math.random() < 0.05) {
        logMessage("You found the Void Crystal!");
        return '💎v';
    }

    // --- 1. Check for Active Fetch Quests ---
    const enemyTile = enemy.tile || Object.keys(ENEMY_DATA).find(k => ENEMY_DATA[k].name === enemy.name);
    for (const questId in player.quests) {
        const playerQuest = player.quests[questId];
        const questData = QUEST_DATA[questId];
        if (playerQuest.status === 'active' && questData.type === 'fetch' && questData.enemy === enemyTile) {
            const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
            if (!hasItem) {
                const dropChance = 0.05 + (player.luck * 0.005);
                if (Math.random() < dropChance) {
                    logMessage(`The ${enemy.name} dropped a ${questData.itemNeeded}!`);
                    return questData.itemTile;
                }
            }
        }
    }

    // --- 2. Calculate Distance for Scaling ---
    let dist;
    if (gameState.mapMode === 'overworld') {
        dist = Math.sqrt(player.x * player.x + player.y * player.y);
    } else {
        // Extract the world coordinates from the dungeon/castle ID
        const instanceId = gameState.currentCaveId || gameState.currentCastleId || "";
        const parts = instanceId.split('_');
        const wX = parseInt(parts[1]) || 0;
        const wY = parseInt(parts[2]) || 0;
        dist = Math.sqrt(wX * wX + wY * wY);
    }

    // --- 3. Determine Drop Tables ---
    const JUNK_DROP_CHANCE = Math.max(0.05, 0.25 - (player.luck * 0.001));
    const GOLD_DROP_CHANCE = 0.50;

    const roll = Math.random();

    // Junk / Specific Loot
    if (roll < JUNK_DROP_CHANCE) {
        // Specific overrides for flavor items not in ENEMY_DATA loot field
        if (enemy.tile === 'l' || enemy.name === 'Giant Leech') return '🐟';
        if (enemy.tile === '🐗' || enemy.name === 'Wild Boar') return '🍖';

        // Otherwise return the default loot defined in ENEMY_DATA (Rat Tails, etc.)
        return enemy.loot || '$';
    }

    // Gold
    if (roll < JUNK_DROP_CHANCE + GOLD_DROP_CHANCE) {
        return '$';
    }

    // --- 4. Magic Item Chance  ---
    // Higher tier zones have higher chance of magic drops
    let magicChance = 0.01; // 1% Base
    if (dist > 500) magicChance = 0.10; // 10% in endgame
    else if (dist > 250) magicChance = 0.05; // 5% in midgame

    // Luck Bonus (0.5% per luck point)
    magicChance += (player.luck * 0.005);

    if (enemy.isElite) {
        magicChance += 0.15; // +15% chance for Magic Item from Elites!
        logMessage(`The ${enemy.name} leaves behind a powerful essence...`);
    }

    if (Math.random() < magicChance) {
        return '✨'; // Drop Unidentified Magic Item!
    }

    // --- 4.5 LEGENDARY DROPS (Tier 4 Only) ---
    // If we are in the Deep Wilds (> 2500) and it's a Rare enemy (10% spawn chance)
    // Give a small chance for a Legendary.
    if (dist > 2500 && Math.random() < 0.05) { // 5% chance per kill in deep wilds
        const legendaries = ['⚔️k', '🛡️a', '👢w', '👑v', '🍎g'];
        const drop = legendaries[Math.floor(Math.random() * legendaries.length)];

        const item = ITEM_DATA[drop];
        logMessage(`The enemy dropped a Legendary Artifact: ${item.name}!`);

        // Visual fanfare
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createLevelUp(player.x, player.y); // Reuse confetti
        }

        return drop;
    }

    // --- 5. Standard Equipment Drops ---
    const scaledRoll = Math.random();

    // Define Tiers
    const commonLoot = ['♥', '🔮', 'S', '💜', '🐀', '🦇w', '🦷', '🧣'];

    // Tier 1: Starter Gear (Club, Staff, Bow, Padded, Robes)
    const tier1Loot = ['/', '%', '🏏', '🦯', '🏹', '👕', '👘'];

    // Tier 2: Basic Iron/Leather
    const tier2Loot = ['!', '[', '📚', '🛡️s', '🛡️w'];

    // Tier 3: Steel/Chain/Magic
    const tier3Loot = ['⚔️s', 'A', 'Ψ', 'M', '⚔️l', '⛓️', '🛡️i'];

    // Tier 4: Heavy/Plate
    const tier4Loot = ['🪓', '🔨', '🛡️p'];

    // Base Chance for "Good Loot"
    let tier1Chance = 0.30;
    let tier2Chance = 0.0;
    let tier3Chance = 0.0;
    let tier4Chance = 0.0;

    // Adjust chances based on distance
    if (dist > 500) { // Endgame Zone
        tier1Chance = 0.0;
        tier2Chance = 0.20;
        tier3Chance = 0.50;
        tier4Chance = 0.30;
    } else if (dist > 250) { // Midgame Zone
        tier1Chance = 0.10;
        tier2Chance = 0.40;
        tier3Chance = 0.30;
        tier4Chance = 0.05;
    } else if (dist > 100) { // Adventure Zone
        tier1Chance = 0.30;
        tier2Chance = 0.30;
        tier3Chance = 0.05;
        tier4Chance = 0.0;
    }

    // Roll for Loot
    if (scaledRoll < tier4Chance) return tier4Loot[Math.floor(Math.random() * tier4Loot.length)];
    if (scaledRoll < tier4Chance + tier3Chance) return tier3Loot[Math.floor(Math.random() * tier3Loot.length)];
    if (scaledRoll < tier4Chance + tier3Chance + tier2Chance) return tier2Loot[Math.floor(Math.random() * tier2Loot.length)];
    if (scaledRoll < tier4Chance + tier3Chance + tier2Chance + tier1Chance) return tier1Loot[Math.floor(Math.random() * tier1Loot.length)];

    return commonLoot[Math.floor(Math.random() * commonLoot.length)];
}


function generateMagicItem(tier) {
    // 1. Pick a base item (Weapons or Armor)
    const baseKeys = Object.keys(ITEM_DATA).filter(k =>
        ITEM_DATA[k].type === 'weapon' || ITEM_DATA[k].type === 'armor'
    );
    
    // --- FIX: Strict Tier Filtering! ---
    const validBaseKeys = baseKeys.filter(k => {
        const item = ITEM_DATA[k];
        if (item.excludeFromLoot) return false;
        
        // Approximate the item's tier based on its raw power
        const power = Math.max(item.damage || 0, item.defense || 0);
        
        // Tier 1: Power 0-2 (Rags, Clubs, Daggers)
        // Tier 2: Power 2-3 (Iron)
        // Tier 3: Power 3-5 (Steel, Plate)
        // Tier 4: Power 5-7 (Dragon, Mithril)
        // Tier 5: Power 7+ (Void, Obsidian)
        
        if (tier === 1 && power > 2) return false;
        if (tier === 2 && (power < 2 || power > 3)) return false;
        if (tier === 3 && (power < 3 || power > 5)) return false;
        if (tier === 4 && (power < 5 || power > 7)) return false;
        if (tier >= 5 && power < 7) return false;
        
        return true;
    });

    // Fallback just in case the filter is too strict for a specific roll
    const finalKeys = validBaseKeys.length > 0 ? validBaseKeys : baseKeys.filter(k => !ITEM_DATA[k].excludeFromLoot);

    const baseKey = finalKeys[Math.floor(Math.random() * finalKeys.length)];
    const template = ITEM_DATA[baseKey];

    // Clone the item
    let newItem = {
        templateId: baseKey,
        name: template.name,
        type: template.type,
        quantity: 1,
        tile: template.tile || baseKey, // Always prefer explicit tile over key
        damage: template.damage || 0,
        defense: template.defense || 0,
        slot: template.slot,
        statBonuses: template.statBonuses ? { ...template.statBonuses } : {}
    };

    // 2. Roll for Prefix (50% chance + tier bonus)
    if (Math.random() < 0.5 + (tier * 0.1)) {
        const validPrefixes = Object.keys(LOOT_PREFIXES).filter(p => LOOT_PREFIXES[p].type === newItem.type);
        if (validPrefixes.length > 0) {
            const prefixName = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            const prefixData = LOOT_PREFIXES[prefixName];

            newItem.name = `${prefixName} ${newItem.name}`;

            for (const stat in prefixData.bonus) {
                if (stat === 'damage') newItem.damage += prefixData.bonus[stat];
                else if (stat === 'defense') newItem.defense += prefixData.bonus[stat];
                else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + prefixData.bonus[stat];
            }
        }
    }

    // 3. Roll for Suffix (30% chance + tier bonus)
    if (Math.random() < 0.3 + (tier * 0.1)) {
        const suffixKeys = Object.keys(LOOT_SUFFIXES);
        const suffixName = suffixKeys[Math.floor(Math.random() * suffixKeys.length)];
        const suffixData = LOOT_SUFFIXES[suffixName];

        newItem.name = `${newItem.name} ${suffixName}`;

        for (const stat in suffixData.bonus) {
            if (stat === 'damage') newItem.damage += suffixData.bonus[stat];
            else if (stat === 'defense') newItem.defense += suffixData.bonus[stat];
            else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + suffixData.bonus[stat];
        }
    }

    // 4. Scale base stats slightly by tier
    const tierBuff = Math.floor(Math.random() * tier) + 1;
    if (newItem.type === 'weapon') newItem.damage += tierBuff;
    if (newItem.type === 'armor') newItem.defense += tierBuff;

    // Ensure "Magic" status visually
    if (newItem.name === template.name) {
        newItem.name = `Reinforced ${newItem.name}`;
    }

    return newItem;
}

function getSanitizedEquipment() {
    const equip = gameState.player.equipment;

    // Helper to clean a single item
    const sanitize = (item, fallbackType) => {
        if (!item) return null;
        
        return {
            name: item.name || "Unknown",
            // If type is missing (like on Fists), fallback to 'weapon'/'armor' or null
            type: item.type || fallbackType || null, 
            quantity: item.quantity || 1,
            // If tile is missing, use a default icon based on fallback type
            tile: item.tile || (fallbackType === 'weapon' ? '👊' : '👕'), 
            
            // Use null if 0 or undefined to be safe, though 0 is valid for numbers. 
            // '|| null' converts 0 to null, which is fine for optional stats.
            damage: (item.damage !== undefined) ? item.damage : null,
            defense: (item.defense !== undefined) ? item.defense : null,
            
            slot: item.slot || null,
            statBonuses: item.statBonuses || null,
            spellId: item.spellId || null,
            skillId: item.skillId || null,
            stat: item.stat || null,
            isEquipped: true
        };
    };

    // Sanitize with specific fallbacks
    // If equip.weapon is just {name: 'Fists'}, it grabs 'weapon' as the type.
    let weapon = sanitize(equip.weapon, 'weapon');
    
    // Extra safety: If weapon is completely null (unequipped state?), force Fists
    if (!weapon) {
        weapon = { name: 'Fists', type: 'weapon', tile: '👊', damage: 0, isEquipped: true };
    }

    let armor = sanitize(equip.armor, 'armor');
    if (!armor) {
        armor = { name: 'Simple Tunic', type: 'armor', tile: '👕', defense: 0, isEquipped: true };
    }

    return {
        weapon: weapon,
        armor: armor,
        offhand: sanitize(equip.offhand, 'offhand'),
        accessory: sanitize(equip.accessory, 'accessory'),
        ammo: sanitize(equip.ammo, 'ammo')
    };
}

/**
 * Returns a clean array of inventory items ready for Firebase storage.
 * Removes functions (like 'effect') and ensures data consistency.
 */

function getSanitizedInventory() {
    return gameState.player.inventory.map(item => {
        // 1. Identify the Source Template
        const sourceId = item.templateId || item.tile; 
        
        return {
            templateId: sourceId, 
            name: item.name,
            type: item.type,
            quantity: item.quantity || 1,
            tile: item.tile,
            isEquipped: item.isEquipped || false,

            // Optional Stats
            damage: item.damage || null,
            defense: item.defense || null,
            statBonuses: item.statBonuses || null,
            
            // Magic/Skill Properties
            spellId: item.spellId || null,
            skillId: item.skillId || null,
            stat: item.stat || null,
            
            // We do NOT save 'effect' (function) as it crashes the DB
        };
    });
}

function rehydrateInventory(savedInventory) {
    if (!savedInventory || !Array.isArray(savedInventory)) return [];

    return savedInventory.map(savedItem => {
        // 1. Find the Template
        let template = null;

        // Try lookup by ID first (Best/Fastest)
        if (savedItem.templateId && ITEM_DATA[savedItem.templateId]) {
            template = ITEM_DATA[savedItem.templateId];
        } 
        // Fallback: Lookup by Name (For legacy saves)
        else {
            // Find key where ITEM_DATA[key].name matches savedItem.name
            const key = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === savedItem.name);
            if (key) {
                template = ITEM_DATA[key];
                savedItem.templateId = key; // Self-heal the save file for next time
            }
        }

        // 2. Handle Broken/Missing Items
        if (!template) {
            console.warn(`Item '${savedItem.name}' (ID: ${savedItem.templateId}) no longer exists in code.`);
            
            // Return a generic "Ash" item instead of crashing
            return {
                ...savedItem, // Keep ID/Qty
                name: `Crumbling Ash`, 
                description: "This item is from an old version and has crumbled to dust.",
                type: 'junk',
                tile: '💨',
                effect: null,
                isEquipped: false, // Ensure unequipped
                damage: 0,
                defense: 0,
                statBonuses: null
            };
        }

        // 3. Merge: Template (Logic) + Save (State)
        // savedItem properties OVERWRITE template properties.
        // This preserves "Masterwork" damage/names, but injects the `effect` function from template.
        return {
            ...template,       // Load static data (effect function, description, base stats)
            ...savedItem,      // Load instance data (qty, equipped status, custom name/stats)
            
            // Use template tile if exists, otherwise use saved tile, otherwise use the ID (emoji)
            tile: template.tile || savedItem.tile || savedItem.templateId 
        };
    });
}

function handleItemDrop(key) {
    const player = gameState.player;
    const keyNum = parseInt(key);

    if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) return;

    const itemIndex = keyNum - 1;
    const itemToDrop = player.inventory[itemIndex];

    if (!itemToDrop) return; // Empty slot

    if (itemToDrop.isEquipped) {
        logMessage("You cannot drop an item you are wearing!");
        // Visual feedback failure? Optional.
        return;
    }

    // --- MAGIC ITEM CHECK ---
    // Prevent accidental deletion of rare loot
    const template = ITEM_DATA[itemToDrop.tile] || ITEM_DATA[itemToDrop.templateId];
    // Check if name differs from template (Prefix/Suffix) or has bonuses
    const isModified = itemToDrop.statBonuses || (template && itemToDrop.name !== template.name);
    
    if (isModified) {
        logMessage("You cannot drop magic items! Sell or Stash them.");
        return;
    }

    // --- TILE VALIDATION ---
    let currentTile;
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        currentTile = (map && map[player.y]) ? map[player.y][player.x] : ' ';
    } else if (gameState.mapMode === 'castle') {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        currentTile = (map && map[player.y]) ? map[player.y][player.x] : ' ';
    } else {
        currentTile = chunkManager.getTile(player.x, player.y);
    }

    // Validate Floor
    let isValidDropTile = false;
    if (gameState.mapMode === 'overworld' && currentTile === '.') isValidDropTile = true;
    else if (gameState.mapMode === 'castle' && currentTile === '.') isValidDropTile = true;
    else if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        if (currentTile === theme.floor) isValidDropTile = true;
    }

    if (!isValidDropTile) {
        logMessage("You can't drop items here. (Must be on open floor)");
        return;
    }

    // --- EXECUTE DROP ---
    
    // 1. Logic
    itemToDrop.quantity--;
    logMessage(`Dropped 1x ${itemToDrop.name}.`);

    // 2. Place on Map
    if (gameState.mapMode === 'overworld') {
        // Items dropped manually by players despawn after 2 hours!
        chunkManager.setWorldTile(player.x, player.y, itemToDrop.tile, 2); 
    } else if (gameState.mapMode === 'dungeon') {
        chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = itemToDrop.tile;
    } else if (gameState.mapMode === 'castle') {
        chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = itemToDrop.tile;
    }

    // 3. Clear Loot Memory (So it can be picked up again)
    let tileId = (gameState.mapMode === 'overworld') 
        ? `${player.x},${-player.y}`
        : `${gameState.currentCaveId || gameState.currentCastleId}:${player.x},${-player.y}`;
    gameState.lootedTiles.delete(tileId);

    // 4. Cleanup Inventory Array
    if (itemToDrop.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // --- UI UPDATE ---
    
    // Turn off drop mode automatically after one drop (Standard UX)
    gameState.isDroppingItem = false;
    
    // Update DB
    playerRef.update({ 
        inventory: getSanitizedInventory(),
        lootedTiles: Object.fromEntries(gameState.lootedTiles)
    });
    
    // Refresh the UI immediately so the item disappears or count decreases
    renderInventory();
    render(); // Update map to show item on ground
    gameState.mapDirty = true; 
}

function useInventoryItem(itemIndex) {
    const itemToUse = gameState.player.inventory[itemIndex];
    if (!itemToUse) {
        logMessage(`No item in slot ${itemIndex + 1}.`);
        return;
    }

    let itemUsed = false;

    // --- FISHING LOGIC ---
    if (itemToUse.name === 'Fishing Rod') {
        itemUsed = executeFishing();
    }

    // --- CONSTRUCTIBLES (Walls, Floors) ---
    else if (itemToUse.type === 'constructible') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);

        // Cannot build on water, existing walls, or other objects
        const invalidTiles = ['~', '≈', '🧱', '+', '☒', '▓', '^'];

        if (invalidTiles.includes(currentTile)) {
            logMessage("You cannot build here.");
            return;
        }

        logMessage(`You place the ${itemToUse.name}.`);

        if (gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(gameState.player.x, gameState.player.y, itemToUse.tile);
        } else if (gameState.mapMode === 'dungeon') {
            chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] = itemToUse.tile;
        }

        // Consume item
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
        itemUsed = true;
        render();
    }

    // --- CONSUMABLES (Refactored Logic) ---
    else if (itemToUse.type === 'consumable') {
        if (itemToUse.effect) {
            // Execute the effect and check if it was successful (returns true)
            const consumed = itemToUse.effect(gameState);

            if (consumed) {
                itemToUse.quantity--;
                if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
                itemUsed = true;
            }
        } else {
            logMessage(`You can't use the ${itemToUse.name} right now.`);
        }
    }

    // --- UNIVERSAL EQUIPMENT LOGIC ---
    else if (['weapon', 'armor', 'offhand', 'accessory', 'ammo'].includes(itemToUse.slot)) {
        const slot = itemToUse.slot;
        const currentEquipped = gameState.player.equipment[slot];

        // 1. Unequip Current
        if (currentEquipped) {
            applyStatBonuses(currentEquipped, -1);
            currentEquipped.isEquipped = false;

            // Remove old weapon skill if it was a weapon
            if (slot === 'weapon') {
                const getWeaponSkill = (item) => {
                    if (item.name.includes("Hammer") || item.name.includes("Club") || item.tile === '🔨' || item.tile === '🏏') return 'crush';
                    if (item.name.includes("Dagger") || item.tile === '†' || item.tile === '🗡️') return 'quickstep';
                    if (item.name.includes("Sword") || item.name.includes("Blade") || item.tile === '⚔️' || item.tile === '!') return 'deflect';
                    if (item.name.includes("Staff") || item.tile === 'Ψ' || item.tile === '🦯') return 'channel';
                    return null;
                };
                const oldSkill = getWeaponSkill(currentEquipped);
                if (oldSkill && gameState.player.skillbook[oldSkill]) {
                    delete gameState.player.skillbook[oldSkill];
                    logMessage(`You unlearned ${SKILL_DATA[oldSkill].name}.`);
                }
            }
        }

        // 2. Equip New (If you didn't just click to unequip)
        if (currentEquipped === itemToUse) {
            // Revert to defaults if weapon or armor, else leave null
            gameState.player.equipment[slot] = (slot === 'weapon') ? { name: 'Fists', damage: 0 } : (slot === 'armor' ? { name: 'Tattered Rags', defense: 0 } : null);
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {

            // --- TWO-HANDED LOGIC ---
            if (slot === 'offhand' && gameState.player.equipment.weapon && gameState.player.equipment.weapon.isTwoHanded) {
                logMessage("{red:You cannot equip an off-hand while wielding a two-handed weapon!}");
                return;
            }
            if (slot === 'weapon' && itemToUse.isTwoHanded && gameState.player.equipment.offhand) {
                applyStatBonuses(gameState.player.equipment.offhand, -1);
                gameState.player.equipment.offhand.isEquipped = false;
                gameState.player.equipment.offhand = null;
                logMessage("You unequip your off-hand to hold the two-handed weapon.");
            }

            itemToUse.isEquipped = true;
            gameState.player.equipment[slot] = itemToUse;
            applyStatBonuses(itemToUse, 1);
            logMessage(`You equip the ${itemToUse.name}.`);

            // Grant new weapon skill
            if (slot === 'weapon') {
                const getWeaponSkill = (item) => {
                    if (item.name.includes("Hammer") || item.name.includes("Club") || item.tile === '🔨' || item.tile === '🏏') return 'crush';
                    if (item.name.includes("Dagger") || item.tile === '†' || item.tile === '🗡️') return 'quickstep';
                    if (item.name.includes("Sword") || item.name.includes("Blade") || item.tile === '⚔️' || item.tile === '!') return 'deflect';
                    if (item.name.includes("Staff") || item.tile === 'Ψ' || item.tile === '🦯') return 'channel';
                    if (item.name.includes("Bow") || item.tile === '🏹') return 'ranged_attack';
                    return null;
                };
                const newSkill = getWeaponSkill(itemToUse);
                if (newSkill) {
                    gameState.player.skillbook[newSkill] = 1; 
                    logMessage(`Weapon Technique: You learned ${SKILL_DATA[newSkill].name}!`);
                    if (!gameState.player.hotbar[0]) gameState.player.hotbar[0] = newSkill;
                }
            }
        }
        itemUsed = true;

    // --- SPELLBOOKS, SKILLBOOKS, TOOLS ---
    } else if (itemToUse.type === 'spellbook' || itemToUse.type === 'skillbook' || itemToUse.type === 'tool') {
        const player = gameState.player;
        let data = null;
        let learned = false;

        if (itemToUse.type === 'spellbook') {
            data = SPELL_DATA[itemToUse.spellId];
            if (!data) {
                logMessage("Dud item.");
            } else if (player.level < data.requiredLevel) {
                logMessage(`Requires Level ${data.requiredLevel}.`);
            } else {
                player.spellbook[itemToUse.spellId] = (player.spellbook[itemToUse.spellId] || 0) + 1;
                logMessage(player.spellbook[itemToUse.spellId] === 1 ? `Learned ${data.name}!` : `Upgraded ${data.name}!`);
                learned = true;
            }
        } else if (itemToUse.type === 'skillbook') {
            data = SKILL_DATA[itemToUse.skillId];
            if (!data) {
                logMessage("Dud item.");
            } else if (player.level < data.requiredLevel) {
                logMessage(`Requires Level ${data.requiredLevel}.`);
            } else {
                player.skillbook[itemToUse.skillId] = (player.skillbook[itemToUse.skillId] || 0) + 1;
                logMessage(player.skillbook[itemToUse.skillId] === 1 ? `Learned ${data.name}!` : `Upgraded ${data.name}!`);
                learned = true;
            }
        } else {
            // Tools (like Machete/Pickaxe) just exist in inventory
            logMessage(`You examine the ${itemToUse.name}. It looks useful.`);
            // Tools aren't "consumed" on use in the inventory menu
            learned = false;
        }

        if (learned) {
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

        // --- TOMES (Stat Boosts) ---
    } else if (itemToUse.type === 'tome') {
        const stat = itemToUse.stat;
        if (stat && gameState.player.hasOwnProperty(stat)) {
            gameState.player[stat]++;
            logMessage(`You consume the tome. ${stat} +1!`);
            triggerStatAnimation(statDisplays[stat], 'stat-pulse-green');
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        } else {
            logMessage("This tome seems to be a dud.");
        }

        // --- BUFF POTIONS ---
    } else if (itemToUse.type === 'buff_potion') {
        const player = gameState.player;
        const template = ITEM_DATA[Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === itemToUse.name)];

        if (player.strengthBonusTurns > 0) {
            logMessage("Effect already active.");
        } else {
            player.strengthBonus = template.amount;
            player.strengthBonusTurns = template.duration;
            logMessage(`You drink the potion. (+${template.amount} Str)`);
            triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

        // --- TELEPORT SCROLLS ---
    } else if (itemToUse.type === 'teleport') {
         logMessage("You chant the words of returning...");
        
        // 1. Visual Flair
        AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#3b82f6', 20);
        }

        // 2. Logic based on Map Mode
        if (gameState.mapMode === 'overworld') {
            // In Overworld: Teleport to 0,0 (Village)
            gameState.player.x = 0;
            gameState.player.y = 0;
            
            // Unload chunks around old location to prevent glitches
            chunkManager.loadedChunks = {}; 
            
            logMessage("The world twists... you stand at the Village gates.");
        } else {
            // In Instance: Exit to Overworld
            // Use existing exit logic to safely handle cleanup
            exitToOverworld("The magic pulls you out of the dungeon and back to the surface.");
        }

        // 3. Consume Item
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
        itemUsed = true;

        // --- TREASURE MAPS ---
    } else if (itemToUse.type === 'treasure_map') {
        if (!gameState.activeTreasure) {
            const dist = 50 + Math.floor(Math.random() * 100);
            const angle = Math.random() * 2 * Math.PI;
            const tx = Math.floor(gameState.player.x + Math.cos(angle) * dist);
            const ty = Math.floor(gameState.player.y + Math.sin(angle) * dist);
            gameState.activeTreasure = { x: tx, y: ty };

            playerRef.update({ activeTreasure: gameState.activeTreasure });

            logMessage(`The map reveals a hidden mark! Location: (${tx}, ${-ty}).`);
            // Maps are not consumed until the treasure is found (handled in movement logic)
            itemUsed = true;

        } else {
            logMessage(`The map marks a location at (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y}).`);
        }

        // --- JUNK / UNKNOWN ---
    } else {
        logMessage(`You can't use '${itemToUse.name}' right now.`);
    }

    // --- FINAL SAVE & RENDER ---
    if (itemUsed) {
        syncPlayerState();
        endPlayerTurn();
        renderInventory();
        renderEquipment();
        renderStats();
    }
}

/**
 * Adds or subtracts an item's stat bonuses from the player.
 * Automatically updates derived stats (Max HP, Mana, etc.) to prevent desync.
 * @param {object} item - The item object (from equipment).
 * @param {number} operation - 1 to add, -1 to subtract.
 */

function applyStatBonuses(item, operation) {
    // --- Safety Check ---
    if (!item || !item.statBonuses) {
        return;
    }

    const player = gameState.player;

    for (const stat in item.statBonuses) {
        if (player.hasOwnProperty(stat)) {
            let amount = item.statBonuses[stat];

            // --- BATTLEMAGE: ARCANE STEEL ---
            // If the item reduces Dexterity (Heavy Armor), and we are a Battlemage, ignore it.
            if (stat === 'dexterity' && amount < 0 && player.talents && player.talents.includes('arcane_steel')) {
                if (operation === 1) logMessage("Arcane Steel negates the armor's weight.");
                continue;
            }

            // 1. Apply the Core Stat Change
            player[stat] += (amount * operation);

            // 2. Update Derived Stats Immediately
            // This ensures Max HP/Mana stay in sync when swapping gear or dying.
            if (stat === 'constitution') {
                player.maxHealth += (amount * 5 * operation);
                // If unequipped, clamp current health so it doesn't exceed new max
                if (player.health > player.maxHealth) player.health = player.maxHealth;
            }
            else if (stat === 'wits') {
                player.maxMana += (amount * 5 * operation);
                if (player.mana > player.maxMana) player.mana = player.maxMana;
            }
            else if (stat === 'endurance') {
                player.maxStamina += (amount * 5 * operation);
                if (player.stamina > player.maxStamina) player.stamina = player.maxStamina;
            }
            else if (stat === 'willpower') {
                player.maxPsyche += (amount * 3 * operation); // +3 per point based on stat allocation logic
                if (player.psyche > player.maxPsyche) player.psyche = player.maxPsyche;
            }

            // (Keep your existing log/flash logic here)
            if (operation === 1) {
                logMessage(`You feel ${stat} increase! (+${amount})`);
                triggerStatFlash(statDisplays[stat], true);
            } else {
                triggerStatFlash(statDisplays[stat], false);
            }
        }
    }
}
