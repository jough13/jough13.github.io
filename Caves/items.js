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
    const dist = Math.sqrt(player.x * player.x + player.y * player.y);

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
    const commonLoot = ['+', '🔮', 'S', 'Y', '🐀', '🦇', '🦷', '🧣'];

    // Tier 1: Starter Gear (Club, Staff, Bow, Padded, Robes)
    const tier1Loot = ['/', '%', '🏏', '🦯', '🏹', '👕', '👘'];

    // Tier 2: Basic Iron/Leather
    const tier2Loot = ['!', '[', '📚', '🛡️', '🛡️w'];

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
    // 1. Pick a random base item (Weapons or Armor)
    const baseKeys = Object.keys(ITEM_DATA).filter(k =>
        ITEM_DATA[k].type === 'weapon' || ITEM_DATA[k].type === 'armor'
    );
    // Filter out items explicitly marked to be excluded
    const validBaseKeys = baseKeys.filter(k => !ITEM_DATA[k].excludeFromLoot);

    const baseKey = validBaseKeys[Math.floor(Math.random() * validBaseKeys.length)];
    const template = ITEM_DATA[baseKey];

    // Clone the item
    let newItem = {
        templateId: baseKey,
        name: template.name,
        type: template.type,
        quantity: 1,
        tile: baseKey,
        damage: template.damage || 0,
        defense: template.defense || 0,
        slot: template.slot,
        statBonuses: template.statBonuses ? { ...template.statBonuses } : {}
    };

    // 2. Roll for Prefix (50% chance + tier bonus)
    if (Math.random() < 0.5 + (tier * 0.1)) {
        const validPrefixes = Object.keys(LOOT_PREFIXES).filter(p => LOOT_PREFIXES[p].type === newItem.type);
        if (validPrefixes.length > 0) {
            // Pick based on tier (approximate logic: higher tier = better chance for good prefix)
            const prefixName = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            const prefixData = LOOT_PREFIXES[prefixName];

            newItem.name = `${prefixName} ${newItem.name}`;

            // Apply bonuses
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

        // Apply bonuses
        for (const stat in suffixData.bonus) {
            if (stat === 'damage') newItem.damage += suffixData.bonus[stat];
            else if (stat === 'defense') newItem.defense += suffixData.bonus[stat];
            else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + suffixData.bonus[stat];
        }
    }

    // 4. Scale base stats slightly by tier (The "+1 to +4" logic)
    // If it didn't get a prefix, force a small buff based on tier
    const tierBuff = Math.floor(Math.random() * tier) + 1;
    if (newItem.type === 'weapon') newItem.damage += tierBuff;
    if (newItem.type === 'armor') newItem.defense += tierBuff;

    // Ensure "Magic" status visually
    if (newItem.name === template.name) {
        newItem.name = `Reinforced ${newItem.name}`; // Fallback name
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
        armor: armor
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
        chunkManager.setWorldTile(player.x, player.y, itemToDrop.tile);
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
        lootedTiles: Array.from(gameState.lootedTiles)
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
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);

        // Check if standing on water (Deep Water or Swamp)
        if (currentTile !== '~' && currentTile !== '≈') {
            logMessage("You need to be standing in water to fish.");
            return;
        }

        // 1. Stamina Check
        if (gameState.player.stamina < 2) {
            logMessage("You are too tired to fish.");
            return;
        }
        gameState.player.stamina -= 2;

        // 2. Calculate Success
        // Base 40% + 2% per Dexterity + 2% per Luck
        const chance = 0.40 + (gameState.player.dexterity * 0.02) + (gameState.player.luck * 0.02);

        logMessage("You cast your line...");

        if (Math.random() < chance) {
            // 3. Loot Table
            const roll = Math.random();
            let catchName = 'Raw Fish';
            let catchTile = '🐟';

            // Rare Treasures (5%)
            if (roll > 0.95) {
                const treasures = [
                    { n: 'Ring of Regeneration', t: '💍r' },
                    { n: 'Ancient Coin', t: '🪙' },
                    { n: 'Empty Bottle', t: '🫙' }
                ];
                const t = treasures[Math.floor(Math.random() * treasures.length)];
                catchName = t.n;
                catchTile = t.t;
                logMessage(`You pull up something heavy... It's a ${catchName}!`);
                grantXp(20);
            }
            // Junk (15%)
            else if (roll < 0.15) {
                catchName = 'Soggy Boot';
                catchTile = '👢s';
                logMessage("Ugh, just an old boot.");
            }
            // Fish (80%)
            else {
                logMessage("You caught a fish!");
                grantXp(5);
            }

            // Add to Inventory
            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                // Find template to get full data
                const template = Object.values(ITEM_DATA).find(i => i.name === catchName);
                gameState.player.inventory.push({
                    name: catchName,
                    type: template ? (template.type || 'junk') : 'junk',
                    quantity: 1,
                    tile: catchTile,
                    // Copy stats if it's equipment
                    defense: template ? template.defense : null,
                    statBonuses: template ? template.statBonuses : null,

                    effect: template ? template.effect : null
                });
            } else {
                logMessage("...but you have no room to keep it, so you throw it back.");
            }
        } else {
            logMessage("...not even a nibble.");
        }

        // Fishing always consumes a turn/stamina, so we mark it used to trigger updates
        itemUsed = true;
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

    // --- WEAPONS ---
    else if (itemToUse.type === 'weapon') {
        const currentWeapon = gameState.player.inventory.find(i => i.type === 'weapon' && i.isEquipped);

        // Helper to map weapon icons/names to skills
        const getWeaponSkill = (item) => {
            if (!item) return null;
            if (item.name.includes("Hammer") || item.name.includes("Club") || item.tile === '🔨' || item.tile === '🏏') return 'crush';
            if (item.name.includes("Dagger") || item.tile === '†' || item.tile === '🗡️') return 'quickstep';
            if (item.name.includes("Sword") || item.name.includes("Blade") || item.tile === '⚔️' || item.tile === '!') return 'deflect';
            if (item.name.includes("Staff") || item.tile === 'Ψ' || item.tile === '🦯') return 'channel';
            return null;
        };

        // 1. Unequip Current
        if (currentWeapon) {
            applyStatBonuses(currentWeapon, -1);
            currentWeapon.isEquipped = false;

            // Remove old skill
            const oldSkill = getWeaponSkill(currentWeapon);
            if (oldSkill && gameState.player.skillbook[oldSkill]) {
                delete gameState.player.skillbook[oldSkill];
                logMessage(`You unlearned ${SKILL_DATA[oldSkill].name}.`);
            }
        }

        // 2. Equip New (if different)
        if (currentWeapon === itemToUse) {
            gameState.player.equipment.weapon = { name: 'Fists', damage: 0 };
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {
            itemToUse.isEquipped = true;
            gameState.player.equipment.weapon = itemToUse;
            applyStatBonuses(itemToUse, 1);
            logMessage(`You equip the ${itemToUse.name}.`);

            // Grant new skill
            const newSkill = getWeaponSkill(itemToUse);
            if (newSkill) {
                gameState.player.skillbook[newSkill] = 1; // Level 1 mastery
                logMessage(`Weapon Technique: You learned ${SKILL_DATA[newSkill].name}!`);
                // Auto-assign to hotbar slot 1 for convenience if empty
                if (!gameState.player.hotbar[0]) gameState.player.hotbar[0] = newSkill;
            }
        }
        itemUsed = true;

        // --- ARMOR ---
    } else if (itemToUse.type === 'armor') {
        const currentArmor = gameState.player.inventory.find(i => i.type === 'armor' && i.isEquipped);
        if (currentArmor) {
            applyStatBonuses(currentArmor, -1);
            currentArmor.isEquipped = false;
        }
        if (currentArmor === itemToUse) {
            gameState.player.equipment.armor = { name: 'Simple Tunic', defense: 0 };
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {
            itemToUse.isEquipped = true;
            gameState.player.equipment.armor = itemToUse;
            applyStatBonuses(itemToUse, 1);
            logMessage(`You equip the ${itemToUse.name}.`);
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

function handleBuyItem(itemName) {
    const player = gameState.player;
    const shopItem = activeShopInventory.find(item => item.name === itemName);
    const itemTemplate = ITEM_DATA[Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName)];

    if (!shopItem || !itemTemplate) {
        logMessage("Error: Item not found in shop.");
        return;
    }
   // --- PRICING LOGIC START --- 
    const basePrice = shopItem.price;
    
    // 1. Charisma
    let discountPercent = player.charisma * 0.005;

    // 2. Codex Bonus
    if (player.completedLoreSets && player.completedLoreSets.includes('king_fall')) {
        discountPercent += 0.10;
    }

    // 3. Final Calculation
    const finalDiscount = Math.min(discountPercent, 0.50);
    const finalBuyPrice = Math.floor(basePrice * (1.0 - finalDiscount));

    // 1. Check if player has enough gold
    if (player.coins < finalBuyPrice) {
        logMessage("You don't have enough gold for that.");
        return;
    }

    if (shopItem.stock <= 0) {
        logMessage("The shop is out of stock!");
        return;
    }

    // 2. Check if player has inventory space
    const existingStack = player.inventory.find(item => item.name === itemName);
    if (!existingStack && player.inventory.length >= MAX_INVENTORY_SLOTS) {
        logMessage("Your inventory is full!");
        return;
    }

    // 3. Process the transaction
    player.coins -= finalBuyPrice;
    shopItem.stock--;
    logMessage(`You bought a ${itemName} for ${finalBuyPrice} gold.`); // <-- Use new variable

    if (existingStack) {
        if (existingStack.quantity >= 99) {
            logMessage("You cannot carry any more of that item.");
            return;
        }
        existingStack.quantity++;
    } else {

        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName);

        player.inventory.push({

            templateId: itemKey,
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: 1,
            tile: itemKey || '?',
            effect: itemTemplate.effect || null
        });
    }

    // 4. Update database and UI
    playerRef.update({
        coins: player.coins,
        inventory: player.inventory
    });

    playerRef.update({
        coins: player.coins,
        inventory: getSanitizedInventory()
    });

    renderShop(); // Re-render the shop to show new gold and inventory
    renderInventory(); // Update the main UI inventory
    renderStats(); // Update the main UI gold display
}

function handleSellItem(itemIndex) {
    const player = gameState.player;
        if (itemIndex < 0 || itemIndex >= player.inventory.length) return;
    
    const itemToSell = player.inventory[itemIndex];
    if (!itemToSell) return; 

    if (itemToSell.isEquipped) {
        logMessage("You cannot sell an item you are wearing!");
        return;
    }

    if (!itemToSell) {
        logMessage("Error: Item not in inventory.");
        return;
    }

    // Find the item's base price in the shop.
    const shopItem = activeShopInventory.find(i => i.name === itemToSell.name);
        if (shopItem) {
            // Never allow selling for more than 75% of base buy price, regardless of modifiers
            const maxSell = Math.floor(shopItem.price * 0.75);
            calculatedSellPrice = Math.min(calculatedSellPrice, maxSell);
        }

    let basePrice = 2; // Default
    if (shopItem) {
        basePrice = shopItem.price;
    } else {
        // --- SPECIAL PRICES FOR RELICS ---
        if (itemToSell.name === 'Shattered Crown') basePrice = 200;
        else if (itemToSell.name === 'Signet Ring') basePrice = 80;
        else if (itemToSell.name === 'Pouch of Gold Dust') basePrice = 50;
        else if (itemToSell.name === 'Ancient Coin') basePrice = 25;
        else if (itemToSell.name === 'Alpha Pelt') basePrice = 60;
    }

    const regionMult = getRegionalPriceMultiplier(itemToSell.type, itemToSell.name);

    const sellBonusPercent = player.charisma * 0.005;
    const finalSellBonus = Math.min(sellBonusPercent, 0.25);

    // --- Economy Cap ---
    // Calculate raw sell price
    let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

    // Cap the sell price at 80% of the base price to prevent infinite money loops
    // (e.g. buying for 90g and selling for 100g)
    const maxSellPrice = Math.floor(basePrice * 0.8);

    // If the item is a rare relic (not sold in shops), we don't need to cap it strictly
    // against a shop price, but for general goods, we apply the cap.
    const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;

    if (regionMult > 1.0) logMessage(`Market demand is high here! (x${regionMult})`);
    else if (regionMult < 1.0) logMessage(`Market flooded. Low demand. (x${regionMult})`);

    // 1. Process the transaction
    player.coins += sellPrice;
    logMessage(`You sold a ${itemToSell.name} for ${sellPrice} gold.`);

    // 2. Remove one from the stack
    itemToSell.quantity--;
    if (itemToSell.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // 3. Update database and UI
    playerRef.update({
        coins: player.coins,
        inventory: getSanitizedInventory()
    });

    renderShop();
    renderInventory();
    renderStats();
}

function handleSellAllItems() {
    const player = gameState.player;
    let itemsSold = 0;
    let goldGained = 0;

    // Iterate backwards so we can remove items safely while looping
    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];

        // 1. CRITICAL: Skip equipped items
        if (item.isEquipped) continue;

        // 2. Filter: Only sell 'junk' (Loot) and 'consumable' (Food/Potions)
        // We skip 'weapon', 'armor', 'tool', 'spellbook', etc. to be safe.
        if (item.type === 'junk') {

            // --- Price Calculation Logic (Matches handleSellItem) ---
            // 1. Try exact match
            let shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

            // 2. Template ID Fallback
            if (!shopItem && item.templateId && ITEM_DATA[item.templateId]) {
                const baseName = ITEM_DATA[item.templateId].name;
                shopItem = activeShopInventory.find(sItem => sItem.name === baseName);
            }

            // 3. String Fallback
            if (!shopItem) {
                shopItem = activeShopInventory.find(sItem => item.name.endsWith(sItem.name));
            }
            let basePrice = 2;

            if (shopItem) {
                basePrice = shopItem.price;
                // Bonus for modified items
                if (item.name !== shopItem.name) {
                    basePrice = Math.floor(basePrice * 1.5);
                }
            } else {
                // Relic/Special Prices
                if (item.name === 'Shattered Crown') basePrice = 200;
                else if (item.name === 'Signet Ring') basePrice = 80;
                else if (item.name === 'Pouch of Gold Dust') basePrice = 50;
                else if (item.name === 'Ancient Coin') basePrice = 25;
                else if (item.name === 'Alpha Pelt') basePrice = 60;
            }

            const regionMult = getRegionalPriceMultiplier(item.type, item.name);
            const sellBonusPercent = player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.25);

            let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

            // Economy Cap logic
            const maxSellPrice = Math.floor(basePrice * 0.8);
            const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;
            // -------------------------------------------------------

            // 3. Execute Sale
            const totalValue = sellPrice * item.quantity;
            player.coins += totalValue;
            goldGained += totalValue;
            itemsSold += item.quantity;

            // Remove from inventory
            player.inventory.splice(i, 1);
        }
    }

    if (itemsSold > 0) {
        logMessage(`Sold ${itemsSold} items for ${goldGained} gold.`);
        AudioSystem.playCoin();

        // Save and Update UI
        playerRef.update({
            coins: player.coins,
            inventory: getSanitizedInventory()
        });
        renderShop();
        renderInventory();
        renderStats();
    } else {
        logMessage("You have no unequipped junk or consumables to sell.");
    }
}

function renderShop() {
    // 1. Clear old lists
    shopBuyList.innerHTML = '';
    shopSellList.innerHTML = '';

    // 2. Update player's gold
    shopPlayerCoins.textContent = `Your Gold: ${gameState.player.coins}`;

    // 3. Populate "Buy" list
    activeShopInventory.forEach(item => {
        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === item.name);

        const baseBuyPrice = item.price;
        
        // 1. Charisma Discount (Max 25%)
        let discountPercent = gameState.player.charisma * 0.005;
        
        // 2. Codex Discount (+10% Flat)
        if (gameState.player.completedLoreSets && gameState.player.completedLoreSets.includes('king_fall')) {
            discountPercent += 0.10; 
        }

        // Cap Total Discount (e.g., max 50% off)
        const finalDiscount = Math.min(discountPercent, 0.5);
        const finalBuyPrice = Math.floor(baseBuyPrice * (1.0 - finalDiscount));

        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <div>
                <span class="shop-item-name">${item.name} (${itemKey || '?'})</span>
                <span class="shop-item-details">Price: ${finalBuyPrice}g</span>
            </div>
              <div class="shop-item-actions">
            <button data-buy-item="${item.name}">Buy 1</button> 
        </div>
    `;
        if (gameState.player.coins < finalBuyPrice) {
            li.querySelector('button').disabled = true;
        }
        shopBuyList.appendChild(li);
    });

    // 4. Populate "Sell" list
    if (gameState.player.inventory.length === 0) {
        shopSellList.innerHTML = '<li class="shop-item-details italic">Your inventory is empty.</li>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

            // 1. Determine Base Price
            let basePrice = 2; // Default
            if (shopItem) {
                basePrice = shopItem.price;
            } else {
                // Relic Prices (Must match handleSellItem logic!)
                if (item.name === 'Shattered Crown') basePrice = 200;
                else if (item.name === 'Signet Ring') basePrice = 80;
                else if (item.name === 'Pouch of Gold Dust') basePrice = 50;
                else if (item.name === 'Ancient Coin') basePrice = 25;
                else if (item.name === 'Alpha Pelt') basePrice = 60;
            }

            // 2. Calculate Bonuses
            const regionMult = getRegionalPriceMultiplier(item.type, item.name);
            const sellBonusPercent = gameState.player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.5);
            let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

            // 3. Apply the 80% Cap
            const maxSellPrice = Math.floor(basePrice * 0.8);
            const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;

            const li = document.createElement('li');
            li.className = 'shop-item';
            li.innerHTML = `
                <div>
                    <span class="shop-item-name">${item.name} (x${item.quantity})</span>
                    <span class="shop-item-details">Sell for: ${sellPrice}g</span>
                </div>
                <div class="shop-item-actions">
                    <button data-sell-index="${index}">Sell 1</button>
                </div>
            `;
            shopSellList.appendChild(li);
        });
    }

    // --- Inject Sell All Button into the Header ---
    const sellListContainer = shopSellList.parentElement;
    const header = sellListContainer.querySelector('h3');

    if (header) {
        // Only inject if we haven't already (prevents duplicates on re-render)
        if (!header.querySelector('#sellAllBtn')) {
            header.innerHTML = `
                <div class="flex justify-between items-center w-full">
                    <span>Your Inventory</span>
                    <button id="sellAllBtn" class="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors">Sell All Junk</button>
                </div>
            `;
            // Bind the click event
            document.getElementById('sellAllBtn').onclick = handleSellAllItems;
        }
    }
}

function getRegionalPriceMultiplier(itemType, itemName) {
    let multiplier = 1.0;

    // Get current biome info
    const isDungeon = gameState.mapMode === 'dungeon';
    const isCastle = gameState.mapMode === 'castle';

    // Default Overworld check
    let biome = 'Plains';
    if (!isDungeon && !isCastle) {
        const elev = elevationNoise.noise(gameState.player.x / 70, gameState.player.y / 70);
        const moist = moistureNoise.noise(gameState.player.x / 50, gameState.player.y / 50);
        if (elev < 0.35) biome = 'Water';
        else if (elev < 0.4 && moist > 0.7) biome = 'Swamp';
        else if (elev > 0.8) biome = 'Mountain';
        else if (elev > 0.6 && moist < 0.3) biome = 'Deadlands';
        else if (moist < 0.15) biome = 'Desert';
        else if (moist > 0.55) biome = 'Forest';
    }

    // --- SUPPLY & DEMAND LOGIC ---

    // 1. DESERT: Pays huge for Water/Food/Herbs. Hates Sand/Cactus.
    if (biome === 'Desert') {
        if (itemName === 'Cactus Fruit') multiplier = 0.5; // Supply is high
        if (itemName === 'Wildberry' || itemName === 'Healing Potion') multiplier = 2.0; // Demand is high
        if (itemName === 'Obsidian Shard') multiplier = 1.5;
    }

    // 2. MOUNTAIN: Pays for Wood/Food. Hates Ore/Stone.
    if (biome === 'Mountain' || (isDungeon && gameState.currentCaveTheme === 'ROCK')) {
        if (itemName === 'Iron Ore' || itemName === 'Stone') multiplier = 0.5;
        if (itemName === 'Stick' || itemName === 'Machete') multiplier = 1.5;
    }

    // 3. FOREST/SWAMP: Pays for Metal/Tech. Hates Wood/Herbs.
    if (biome === 'Forest' || biome === 'Swamp') {
        if (itemName === 'Medicinal Herb' || itemName === 'Stick') multiplier = 0.5;
        if (itemName === 'Iron Ore' || itemName === 'Steel Sword') multiplier = 1.3;
    }

    // 4. CASTLES: Pay extra for Luxury/Relics.
    if (isCastle) {
        if (itemType === 'junk' || itemType === 'quest') multiplier = 1.2; // Art/History
        if (itemName === 'Shattered Crown' || itemName === 'Signet Ring') multiplier = 1.5;
    }

    return multiplier;
}

/**
 * Handles the logic of crafting an item.
 * Consumes materials and adds the new item to inventory.
 * @param {string} recipeName - The name of the item to craft.
 */

function handleCraftItem(recipeName) {
    // 1. Check both lists to find the recipe data
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];

    if (!recipe) return;

    const player = gameState.player;
    const playerInventory = player.inventory;

    // 2. Check Level Requirement
    const playerCraftLevel = player.craftingLevel || 1;
    if (CRAFTING_RECIPES[recipeName] && playerCraftLevel < recipe.level) {
        logMessage(`You need Crafting Level ${recipe.level} to make this.`);
        return;
    }

    // 3. Verify Materials (Double check using our robust function)
    if (!checkHasMaterials(recipeName)) {
        logMessage("You are missing materials (or they are currently equipped).");
        return;
    }

    // Look up the resulting item template
    const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
    const itemTemplate = ITEM_DATA[outputItemKey];

    // Check Inventory Space
    // If it's stackable, check if we have a stack. If not, check for empty slot.
    const isStackable = itemTemplate.type === 'junk' || itemTemplate.type === 'consumable';
    const existingStack = playerInventory.find(item => item.name === itemTemplate.name);

    if (!existingStack || !isStackable) {
        if (playerInventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("Inventory full! Cannot craft.");
            return;
        }
    }

    // 4. Consume Materials
    for (const materialName in recipe.materials) {
        let remainingNeeded = recipe.materials[materialName];

        // Iterate backwards so we can safely remove items while looping
        for (let i = playerInventory.length - 1; i >= 0; i--) {
            if (remainingNeeded <= 0) break; // We have consumed enough of this material

            const item = playerInventory[i];

            // Only take from matching items that are NOT equipped
            if (item.name === materialName && !item.isEquipped) {
                // Take as much as we can from this stack, up to the remaining need
                const amountToTake = Math.min(item.quantity, remainingNeeded);

                item.quantity -= amountToTake;
                remainingNeeded -= amountToTake;

                // If stack is empty, remove it from inventory
                if (item.quantity <= 0) {
                    playerInventory.splice(i, 1);
                }
            }
        }
    }

    // 5. Add Crafted Item

    // --- Masterwork Logic (Only for Equipment) ---
    const levelDiff = playerCraftLevel - recipe.level;
    const masterworkChance = 0.10 + (levelDiff * 0.05);
    let isMasterwork = false;
    let craftedName = itemTemplate.name;
    let craftedStats = itemTemplate.statBonuses ? { ...itemTemplate.statBonuses } : {};

    if ((itemTemplate.type === 'weapon' || itemTemplate.type === 'armor') && Math.random() < masterworkChance) {
        isMasterwork = true;
        craftedName = `Masterwork ${itemTemplate.name}`;

        const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        craftedStats[randomStat] = (craftedStats[randomStat] || 0) + 1;

        if (itemTemplate.type === 'weapon') itemTemplate.damage = (itemTemplate.damage || 0) + 1;
        if (itemTemplate.type === 'armor') itemTemplate.defense = (itemTemplate.defense || 0) + 1;
    }

    // DETERMINE QUANTITY
// If it's a Masterwork, we usually just make 1, otherwise use recipe yield or default to 1
let craftQuantity = (isMasterwork) ? 1 : (recipe.yield || 1); 

// Add to Inventory
if (existingStack && isStackable && !isMasterwork) {
    existingStack.quantity += craftQuantity; // CHANGED FROM ++
} else {
    // --- 1. Calculate Stats Locally ---
    // We calculate these values here instead of modifying itemTemplate directly.
    const finalDamage = (isMasterwork && itemTemplate.type === 'weapon') 
        ? (itemTemplate.damage || 0) + 1 
        : (itemTemplate.damage || null);

    const finalDefense = (isMasterwork && itemTemplate.type === 'armor') 
        ? (itemTemplate.defense || 0) + 1 
        : (itemTemplate.defense || null);

    // --- 2. Create the Item Object ---
    const newItem = {
        templateId: outputItemKey,  // CRITICAL: This is the anchor for rehydration
        name: craftedName,
        type: itemTemplate.type,
        quantity: craftQuantity,
        tile: outputItemKey || '?',
        
        // Use our safe local variables
        damage: finalDamage, 
        defense: finalDefense,
        
        slot: itemTemplate.slot || null,
        statBonuses: Object.keys(craftedStats).length > 0 ? craftedStats : null,
        
        // We include 'effect' here so the item is usable IMMEDIATELY in this session.
        // The getSanitizedInventory() function will strip this out before saving to DB.
        effect: itemTemplate.effect || null,
        
        isEquipped: false
    };
    playerInventory.push(newItem);
}

if (isMasterwork) {
        logMessage(`Critical Success! You crafted a ${craftedName}!`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
    } else {
        const qtyStr = craftQuantity > 1 ? ` (x${craftQuantity})` : '';
        logMessage(`You crafted/cooked: ${recipeName}${qtyStr}.`);
    }

    // 6. Grant XP
    const xpGain = recipe.xp || 10;
    player.craftingXp = (player.craftingXp || 0) + xpGain;
    player.craftingXpToNext = player.craftingXpToNext || 50;

    logMessage(`+${xpGain} Crafting XP`);

    if (player.craftingXp >= player.craftingXpToNext) {
        player.craftingXp -= player.craftingXpToNext;
        player.craftingLevel++;
        player.craftingXpToNext = Math.floor(player.craftingXpToNext * 1.5);
        logMessage(`CRAFTING LEVEL UP! You are now Artisan Level ${player.craftingLevel}.`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-blue');
    }

    // 7. Update Database & UI
    playerRef.update({
        inventory: getSanitizedInventory(),
        craftingLevel: player.craftingLevel,
        craftingXp: player.craftingXp,
        craftingXpToNext: player.craftingXpToNext
    });

    renderCraftingModal();
    renderInventory();
}

function openCraftingModal(mode = 'workbench') {
    inputBuffer = null; 
    gameState.currentCraftingMode = mode;

    // Update Title based on mode
    const title = document.querySelector('#craftingModal h2');
    if (mode === 'cooking') {
        title.textContent = "Cooking Pot";
    } else {
        title.textContent = "Crafting Workbench";
    }

    renderCraftingModal();
    craftingModal.classList.remove('hidden');
}

/**
 * Checks if the player has the required materials for a recipe.
 * @param {string} recipeName - The name of the item to craft.
 * @returns {boolean} - True if the player has all materials, false otherwise.
 */

function checkHasMaterials(recipeName) {
    // Check both crafting and cooking lists
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return false;

    const playerInventory = gameState.player.inventory;

    // Check every material in the recipe
    for (const materialName in recipe.materials) {
        const requiredQuantity = recipe.materials[materialName];

        // Count TOTAL amount of this material across all UNEQUIPPED stacks
        const totalAmount = playerInventory.reduce((sum, item) => {
            // Only count items that match the name AND are NOT equipped
            if (item.name === materialName && !item.isEquipped) {
                return sum + item.quantity;
            }
            return sum;
        }, 0);

        // If the total across all stacks is less than required, we can't craft
        if (totalAmount < requiredQuantity) {
            return false;
        }
    }

    return true;
}

/**
 * Renders the list of all available crafting recipes
 * and checks which ones the player can craft.
 */

function renderCraftingModal() {
    craftingRecipeList.innerHTML = '';
    const playerInventory = gameState.player.inventory;

    // Select the correct recipe list
    let activeRecipes = {};
    let playerLevel = 1;

    if (gameState.currentCraftingMode === 'cooking') {
        activeRecipes = COOKING_RECIPES;
        playerLevel = 1; // Everyone can cook level 1 stuff for now
        // Or use wisdom? Let's just allow all cooking for simplicity.
    } else {
        activeRecipes = CRAFTING_RECIPES;
        playerLevel = gameState.player.craftingLevel || 1;
    }

    for (const recipeName in activeRecipes) {
        const recipe = activeRecipes[recipeName];

        // --- CHECK MATERIALS (Reused Logic) ---
        let canCraft = true;
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            if (!itemInInventory || itemInInventory.quantity < requiredQuantity) {
                canCraft = false;
            }
        }

        const levelMet = playerLevel >= recipe.level;

        // Find the tile
        const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
        const outputItemTile = outputItemKey || '?';

        // Build Material List
        let materialsHtml = '<ul class="crafting-item-materials">';
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            const currentQuantity = itemInInventory ? itemInInventory.quantity : 0;
            const quantityClass = currentQuantity < requiredQuantity ? 'text-red-500' : '';
            materialsHtml += `<li class="${quantityClass}">${materialName} (${currentQuantity}/${requiredQuantity})</li>`;
        }
        materialsHtml += '</ul>';

        // Build Info Line
        let infoHtml = '';
        if (gameState.currentCraftingMode === 'workbench') {
            let levelClass = levelMet ? 'text-green-600' : 'text-red-500 font-bold';
            infoHtml = `<div class="text-xs mt-1 ${levelClass}">Requires Crafting Lvl ${recipe.level} (Reward: ${recipe.xp} XP)</div>`;
        } else {
            // Cooking doesn't have levels yet, just XP
            infoHtml = `<div class="text-xs mt-1 text-green-600">Delicious! (Reward: ${recipe.xp} XP)</div>`;
        }

        const li = document.createElement('li');
        li.className = 'crafting-item';
        li.innerHTML = `
            <div>
                <span class="crafting-item-name">${recipeName} (${outputItemTile})</span>
                ${materialsHtml}
                ${infoHtml}
            </div>
            <div class="crafting-item-actions">
                <button data-craft-item="${recipeName}" ${canCraft && levelMet ? '' : 'disabled'}>${gameState.currentCraftingMode === 'cooking' ? 'Cook' : 'Craft'}</button>
            </div>
        `;
        craftingRecipeList.appendChild(li);
    }
}

window.handleStashTransfer = function (action, index) {
    const player = gameState.player;
    if (!player.bank) player.bank = [];

    if (action === 'deposit') {
        const item = player.inventory[index];
        // Check if item exists in bank
        const bankItem = player.bank.find(i => i.name === item.name);
        if (bankItem) {
            bankItem.quantity += item.quantity;
        } else {
            player.bank.push(JSON.parse(JSON.stringify(item))); // Deep copy
        }
        player.inventory.splice(index, 1);
        logMessage(`Deposited ${item.name}.`);
    }
    else if (action === 'withdraw') {
        const item = player.bank[index];
        if (player.inventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("Your inventory is full!");
            return;
        }
        // Deep copy
        let withdrawnItem = JSON.parse(JSON.stringify(item));

        // RE-BIND EFFECT LOGIC
        const template = Object.values(ITEM_DATA).find(i => i.name === withdrawnItem.name);
        if (template && template.effect) {
            withdrawnItem.effect = template.effect;
        }

        // Check if item exists in inventory
        const invItem = player.inventory.find(i => i.name === item.name);
        if (invItem) {
            invItem.quantity += item.quantity;
        } else {
            player.inventory.push(withdrawnItem); // Push the re-bound item
        }
        player.bank.splice(index, 1);
        logMessage(`Withdrew ${item.name}.`);
    }

    // Save and Render
    playerRef.update({ inventory: player.inventory, bank: player.bank });
    renderStash();
    renderInventory();
};

function renderStash() {
    stashPlayerList.innerHTML = '';
    stashBankList.innerHTML = '';

    // Render Player Inventory (Deposit)
    gameState.player.inventory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <button class="text-xs bg-green-600 text-white px-2 py-1 rounded" onclick="handleStashTransfer('deposit', ${index})">Deposit</button>
        `;
        stashPlayerList.appendChild(li);
    });

    // Render Bank (Withdraw)
    const bank = gameState.player.bank || [];
    if (bank.length === 0) {
        stashBankList.innerHTML = '<li class="italic text-sm text-gray-500">Stash is empty.</li>';
    } else {
        bank.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item';
            li.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded" onclick="handleStashTransfer('withdraw', ${index})">Withdraw</button>
            `;
            stashBankList.appendChild(li);
        });
    }
}

function openStashModal() {
    inputBuffer = null; 
    
    renderStash();
    stashModal.classList.remove('hidden');
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
