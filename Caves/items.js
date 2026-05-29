/**
 * Takes raw player data (from Firebase) and reconnects it to game templates.
 * ensuring items have effects, correct stats, and valid IDs.
 */
function rehydratePlayerState(data) {
    if (!data.inventory) return [];

    return data.inventory.map(item => {
        let templateItem = null;
        let templateKey = null;

        // 1. ROBUST LOOKUP (By ID)
        if (item.templateId && ITEM_DATA[item.templateId]) {
            templateItem = ITEM_DATA[item.templateId];
            templateKey = item.templateId;
        }

        // 2. FALLBACK A: Name Match
        if (!templateItem) {
            templateKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === item.name);
            if (templateKey) templateItem = ITEM_DATA[templateKey];
        }

        // 3. FALLBACK B: Suffix Match (For randomly generated magic items)
        if (!templateItem) {
            const candidates = Object.keys(ITEM_DATA).filter(k => item.name.endsWith(ITEM_DATA[k].name));
            if (candidates.length > 0) {
                // Find longest match (e.g. 'Steel Sword' vs 'Sword')
                candidates.sort((a, b) => ITEM_DATA[b].name.length - ITEM_DATA[a].name.length);
                templateKey = candidates[0];
                templateItem = ITEM_DATA[templateKey];
            }
        }

        if (templateItem) {
            // Heal Data
            if (!item.templateId) item.templateId = templateKey;
            
            // Re-bind Logic (Functions and properties that cannot be saved to JSON)
            item.effect = templateItem.effect;
            item.onHit = templateItem.onHit;
            item.procChance = templateItem.procChance;
            item.inflicts = templateItem.inflicts;
            item.inflictChance = templateItem.inflictChance;

            // Heal Missing Stats (Keep existing ones if present)
            if (item.damage === undefined || item.damage === null) item.damage = templateItem.damage;
            if (item.defense === undefined || item.defense === null) item.defense = templateItem.defense;
            item.slot = templateItem.slot; // Always force slot to prevent bugs
            item.tile = item.tile || templateItem.tile; // Ensure icon
            
            item.range = item.range || templateItem.range || null;
            item.isTwoHanded = (item.isTwoHanded !== undefined) ? item.isTwoHanded : (templateItem.isTwoHanded || false);
            
        } else {
            // Graceful degradation for removed items
            console.warn(`Converting corrupted/missing item to Ash: ${item.name}`);
            item.name = `Crumbling Ash`;
            item.description = "Dust from a forgotten age. This item no longer exists.";
            item.type = 'junk';
            item.tile = '💨';
            item.quantity = item.quantity || 1;
            item.isEquipped = false;
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
        logMessage("{gold:You found the Sun Shard!}");
        return '💎s';
    }
    // 2. Moon Tear (Swamp, 5% chance)
    if (gameState.player.relicQuestStage === 2 && (enemy.tile === 'l' || enemy.tile === 'Hydra') && Math.random() < 0.05) {
        logMessage("{blue:You found the Moon Tear!}");
        return '💎m';
    }
    // 3. Void Crystal (Mountain, 5% chance)
    if (gameState.player.relicQuestStage === 3 && (enemy.tile === 'Y' || enemy.tile === '🐲') && Math.random() < 0.05) {
        logMessage("{purple:You found the Void Crystal!}");
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
                    logMessage(`{yellow:The ${enemy.name} dropped a ${questData.itemNeeded}!}`);
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
        const instanceId = gameState.currentCaveId || gameState.currentCastleId || "";
        
        // --- ENDGAME BOSS SCALING ---
        // The Abyssal Maw doesn't have coordinates in its ID. 
        // We force it to a massive distance to guarantee Tier 4+ and Legendary loot!
        if (instanceId === 'cave_landmark') {
            dist = 5000; 
        } else {
            // Bulletproof extraction of coordinates from normal instance IDs (e.g. cave_10_20_2)
            const parts = instanceId.split('_').map(Number).filter(n => !isNaN(n));
            
            if (parts.length >= 2) {
                // Usually the first two numbers are X and Y
                const wX = parts[0]; 
                const wY = parts[1];
                dist = Math.sqrt(wX * wX + wY * wY);
            } else {
                dist = 100; // Safe fallback for other unknown dungeon IDs
            }
        }
    }

    // --- 3. Determine Drop Tables ---
    const JUNK_DROP_CHANCE = Math.max(0.05, 0.25 - (player.luck * 0.001));
    const GOLD_DROP_CHANCE = 0.50;

    const roll = Math.random();

    // Junk / Specific Loot
    if (roll < JUNK_DROP_CHANCE) {
        if (enemy.tile === 'l' || enemy.name === 'Giant Leech') return '🐟';
        if (enemy.tile === '🐗' || enemy.name === 'Wild Boar') return '🍖';
        return enemy.loot || '$';
    }

    // Gold
    if (roll < JUNK_DROP_CHANCE + GOLD_DROP_CHANCE) {
        return '$';
    }

    // --- 4. Magic Item Chance ---
    let magicChance = 0.01; // 1% Base
    if (dist > 500) magicChance = 0.10; // 10% in endgame
    else if (dist > 250) magicChance = 0.05; // 5% in midgame

    // Luck Bonus (0.5% per luck point)
    magicChance += (player.luck * 0.005);

    if (enemy.isElite) {
        magicChance += 0.15; // +15% chance for Magic Item from Elites!
        logMessage(`{purple:The ${enemy.name} leaves behind a glowing essence...}`);
    }

    if (Math.random() < magicChance) {
        return '✨'; // Drop Unidentified Magic Item!
    }

    // --- 4.5 LEGENDARY DROPS (Tier 4 Only) ---
    if (dist > 2500 && Math.random() < 0.05) { // 5% chance per kill in deep wilds
        const legendaries = ['⚔️k', '🛡️a', '👢w', '👑v', '🍎'];
        const drop = legendaries[Math.floor(Math.random() * legendaries.length)];

        const item = ITEM_DATA[drop];
        logMessage(`{gold:The enemy dropped a Legendary Artifact: ${item.name}!}`);

        // Visual fanfare
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createLevelUp(player.x, player.y);
        }

        return drop;
    }

    // --- 5. Standard Equipment Drops ---
    const scaledRoll = Math.random();

    const commonLoot = ['♥', '🔮', 'S', '💜', '🐀', '🦇w', '🦷', '🧣'];
    const tier1Loot = ['\\', '%', '🏏', '🦯', '🏹', '👕', '👘'];
    const tier2Loot = ['!', '[', '📚', '🛡️s', '🛡️w'];
    const tier3Loot = ['⚔️s', 'A', 'Ψ', 'M', '⚔️l', '⛓️', '🛡️i'];
    const tier4Loot = ['🪓', '🔨', '🛡️p'];

    let tier1Chance = 0.30;
    let tier2Chance = 0.0;
    let tier3Chance = 0.0;
    let tier4Chance = 0.0;

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
    
    // Strict Tier Filtering
    const validBaseKeys = baseKeys.filter(k => {
        const item = ITEM_DATA[k];
        if (item.excludeFromLoot) return false;
        
        // Approximate the item's tier based on its raw power
        const power = Math.max(item.damage || 0, item.defense || 0);
        
        if (tier === 1 && power > 2) return false;
        if (tier === 2 && (power < 2 || power > 3)) return false;
        if (tier === 3 && (power < 3 || power > 5)) return false;
        if (tier === 4 && (power < 5 || power > 7)) return false;
        if (tier >= 5 && power < 7) return false;
        
        return true;
    });

    const finalKeys = validBaseKeys.length > 0 ? validBaseKeys : baseKeys.filter(k => !ITEM_DATA[k].excludeFromLoot);
    const baseKey = finalKeys[Math.floor(Math.random() * finalKeys.length)];
    const template = ITEM_DATA[baseKey];

    // Clone the item safely
    let newItem = {
        templateId: baseKey,
        name: template.name,
        type: template.type,
        quantity: 1,
        tile: template.tile || baseKey,
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

    // Ensure "Magic" status visually if no affixes were added
    if (newItem.name === template.name) {
        newItem.name = `Reinforced ${newItem.name}`;
        if (newItem.type === 'weapon') newItem.damage += 1;
        if (newItem.type === 'armor') newItem.defense += 1;
    }

    return newItem;
}

// ==========================================
// DB SANITIZATION (FIREBASE SAFE)
// ==========================================

// Centralized safe-clone for DB writes. Explicitly strips ALL functions.
function sanitizeItemForDB(item, forceEquipped = false) {
    if (!item) return null;
    
    return {
        templateId: item.templateId || item.tile, 
        name: item.name || "Unknown",
        type: item.type || null,
        quantity: item.quantity || 1,
        tile: item.tile || '?',
        isEquipped: forceEquipped ? true : (item.isEquipped || false),
        
        damage: (item.damage !== undefined) ? item.damage : null,
        defense: (item.defense !== undefined) ? item.defense : null,
        
        range: (item.range !== undefined) ? item.range : null,
        isTwoHanded: item.isTwoHanded || false,

        slot: item.slot || null,
        statBonuses: item.statBonuses ? { ...item.statBonuses } : null,
        spellId: item.spellId || null,
        skillId: item.skillId || null,
        stat: item.stat || null
        
        // Notice we EXPLICITLY leave out 'effect', 'onHit', 'procChance', 'inflicts'.
        // This is what prevents the Firebase crash!
    };
}

function getSanitizedEquipment() {
    const equip = gameState.player.equipment;

    let weapon = sanitizeItemForDB(equip.weapon, true);
    if (!weapon) weapon = { name: 'Fists', type: 'weapon', tile: '👊', damage: 0, isEquipped: true };

    let armor = sanitizeItemForDB(equip.armor, true);
    if (!armor) armor = { name: 'Simple Tunic', type: 'armor', tile: '👕', defense: 0, isEquipped: true };

    return {
        weapon: weapon,
        armor: armor,
        offhand: sanitizeItemForDB(equip.offhand, true),
        accessory: sanitizeItemForDB(equip.accessory, true),
        ammo: sanitizeItemForDB(equip.ammo, true)
    };
}

function getSanitizedInventory() {
    return gameState.player.inventory.map(item => sanitizeItemForDB(item, false));
}

function getSanitizedBank() {
    if (!gameState.player.bank) return [];
    return gameState.player.bank.map(item => sanitizeItemForDB(item, false));
}

function rehydrateInventory(savedInventory) {
    if (!savedInventory || !Array.isArray(savedInventory)) return [];
    
    // We simply leverage the now-bulletproof state rehydrator
    return rehydratePlayerState({ inventory: savedInventory });
}

function handleItemDrop(key) {
    const player = gameState.player;
    const keyNum = parseInt(key);

    if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) return;

    const itemIndex = keyNum - 1;
    const itemToDrop = player.inventory[itemIndex];

    if (!itemToDrop) return; // Empty slot

    if (itemToDrop.isEquipped) {
        logMessage("{red:You cannot drop an item you are wearing!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- MAGIC ITEM CHECK ---
    const template = ITEM_DATA[itemToDrop.tile] || ITEM_DATA[itemToDrop.templateId];
    const isModified = itemToDrop.statBonuses || (template && itemToDrop.name !== template.name);
    
    if (isModified) {
        logMessage("{red:You cannot drop magic items! Sell or Stash them.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
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
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // --- EXECUTE DROP ---
    itemToDrop.quantity--;
    logMessage(`Dropped 1x ${itemToDrop.name}.`);

    // Place on Map
    if (gameState.mapMode === 'overworld') {
        // Items dropped manually by players despawn after 2 hours!
        chunkManager.setWorldTile(player.x, player.y, itemToDrop.tile, 2); 
    } else if (gameState.mapMode === 'dungeon') {
        chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = itemToDrop.tile;
    } else if (gameState.mapMode === 'castle') {
        chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = itemToDrop.tile;
    }

    // Clear Loot Memory (So it can be picked up again)
    let tileId = (gameState.mapMode === 'overworld') 
        ? `${player.x},${-player.y}`
        : `${gameState.currentCaveId || gameState.currentCastleId}:${player.x},${-player.y}`;
    gameState.lootedTiles.delete(tileId);

    // Cleanup Inventory Array
    if (itemToDrop.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // Turn off drop mode automatically after one drop (Standard UX)
    gameState.isDroppingItem = false;
    
    // Update DB & UI
    playerRef.update({ 
        inventory: getSanitizedInventory(),
        lootedTiles: Object.fromEntries(gameState.lootedTiles)
    });
    
    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
    renderInventory();
    gameState.mapDirty = true; 
    render(); 
}

function useInventoryItem(itemIndex) {
    const player = gameState.player;
    const itemToUse = player.inventory[itemIndex];
    
    if (!itemToUse) {
        logMessage(`No item in slot ${itemIndex + 1}.`);
        return;
    }

    let itemUsed = false;

    // --- MAGIC ITEM IDENTIFICATION ---
    if (itemToUse.name === 'Unidentified Magic Item' || itemToUse.tile === '✨') {
        
        // Block identification if it's stacked and inventory is full!
        if (itemToUse.quantity > 1 && player.inventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("{red:Inventory full! Make space before identifying stacked items.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // Calculate appropriate tier based on player level (1-6)
        let tier = Math.max(1, Math.min(6, Math.floor(player.level / 5) + 1));
        
        // 20% chance to roll one tier higher than expected!
        if (Math.random() < 0.20) tier = Math.min(6, tier + 1);

        const identifiedItem = generateMagicItem(tier);
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
        
        logMessage(`{purple:The item stops humming and reveals its true form: ${identifiedItem.name}!}`);
        
        // Replace in inventory
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) {
            player.inventory.splice(itemIndex, 1, identifiedItem);
        } else {
            // Because of our safety check above, we KNOW we have space here.
            player.inventory.push(identifiedItem);
        }
        itemUsed = true;
    }

    // --- FISHING LOGIC ---
    else if (itemToUse.name === 'Fishing Rod' || itemToUse.name === 'Obsidian Fishing Rod') {
        itemUsed = executeFishing();
    }

    // --- CONSTRUCTIBLES (Walls, Floors) ---
    else if (itemToUse.type === 'constructible') {
        const currentTile = chunkManager.getTile(player.x, player.y);
        const invalidTiles = ['~', '≈', '🧱', '+', '☒', '▓', '^'];

        if (invalidTiles.includes(currentTile)) {
            logMessage("You cannot build here.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        logMessage(`You place the ${itemToUse.name}.`);

        if (gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(player.x, player.y, itemToUse.tile);
        } else if (gameState.mapMode === 'dungeon') {
            chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = itemToUse.tile;
        }

        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
        itemUsed = true;
        gameState.mapDirty = true;
    }

    // --- CONSUMABLES ---
    else if (itemToUse.type === 'consumable') {
        if (itemToUse.effect) {
            const consumed = itemToUse.effect(gameState);
            if (consumed) {
                itemToUse.quantity--;
                if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
                itemUsed = true;
            }
        } else {
            logMessage(`You can't use the ${itemToUse.name} right now.`);
        }
    }

    // --- UNIVERSAL EQUIPMENT LOGIC ---
    else if (['weapon', 'armor', 'offhand', 'accessory', 'ammo'].includes(itemToUse.slot)) {
        const slot = itemToUse.slot;
        const currentEquipped = player.equipment[slot];

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
                if (oldSkill && player.skillbook[oldSkill]) {
                    delete player.skillbook[oldSkill];
                    logMessage(`You unlearned ${SKILL_DATA[oldSkill].name}.`);
                }
            }
        }

        // 2. Equip New (Or finalize unequip)
        if (currentEquipped === itemToUse) {
            // Revert to defaults
            player.equipment[slot] = (slot === 'weapon') ? { name: 'Fists', damage: 0 } : (slot === 'armor' ? { name: 'Tattered Rags', defense: 0 } : null);
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {
            // --- TWO-HANDED LOGIC SAFEGUARDS ---
            if (slot === 'offhand' && player.equipment.weapon && player.equipment.weapon.isTwoHanded) {
                logMessage("{red:You cannot equip an off-hand while wielding a two-handed weapon!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }
            if (slot === 'weapon' && itemToUse.isTwoHanded && player.equipment.offhand) {
                applyStatBonuses(player.equipment.offhand, -1);
                player.equipment.offhand.isEquipped = false;
                player.equipment.offhand = null;
                logMessage("{gray:You unequip your off-hand to hold the two-handed weapon.}");
            }

            itemToUse.isEquipped = true;
            player.equipment[slot] = itemToUse;
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
                    player.skillbook[newSkill] = 1; 
                    logMessage(`Weapon Technique: You learned ${SKILL_DATA[newSkill].name}!`);
                    if (!player.hotbar[0]) player.hotbar[0] = newSkill;
                }
            }
        }
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Clinking equip sound
        itemUsed = true;

    // --- SPELLBOOKS, SKILLBOOKS, TOOLS ---
    } else if (itemToUse.type === 'spellbook' || itemToUse.type === 'skillbook' || itemToUse.type === 'tool') {
        let data = null;
        let learned = false;

        // --- DEFINE THE MAX LEVEL CAP ---
        const MAX_ABILITY_LEVEL = 10; 

        if (itemToUse.type === 'spellbook') {
            data = SPELL_DATA[itemToUse.spellId];
            const currentLevel = player.spellbook[itemToUse.spellId] || 0;

            if (!data) {
                logMessage("Dud item.");
            } else if (player.level < data.requiredLevel) {
                logMessage(`Requires Level ${data.requiredLevel}.`);
            } else if (currentLevel >= MAX_ABILITY_LEVEL) {
                logMessage(`{red:You have already mastered ${data.name} (Max Level ${MAX_ABILITY_LEVEL}).}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            } else {
                player.spellbook[itemToUse.spellId] = currentLevel + 1;
                logMessage(player.spellbook[itemToUse.spellId] === 1 ? `{purple:Learned ${data.name}!}` : `{purple:Upgraded ${data.name} to Level ${player.spellbook[itemToUse.spellId]}!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                learned = true;
            }
        } else if (itemToUse.type === 'skillbook') {
            data = SKILL_DATA[itemToUse.skillId];
            const currentLevel = player.skillbook[itemToUse.skillId] || 0;

            if (!data) {
                logMessage("Dud item.");
            } else if (player.level < data.requiredLevel) {
                logMessage(`Requires Level ${data.requiredLevel}.`);
            } else if (currentLevel >= MAX_ABILITY_LEVEL) {
                logMessage(`{red:You have already mastered ${data.name} (Max Level ${MAX_ABILITY_LEVEL}).}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            } else {
                player.skillbook[itemToUse.skillId] = currentLevel + 1;
                logMessage(player.skillbook[itemToUse.skillId] === 1 ? `{blue:Learned ${data.name}!}` : `{blue:Upgraded ${data.name} to Level ${player.skillbook[itemToUse.skillId]}!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                learned = true;
            }
        } else {
            // Tools (like Machete/Pickaxe) just exist in inventory
            logMessage(`You examine the ${itemToUse.name}. It looks useful.`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        }

        if (learned) {
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

    // --- TOMES (Stat Boosts) ---
    } else if (itemToUse.type === 'tome') {
        const stat = itemToUse.stat;
        if (stat && player.hasOwnProperty(stat)) {
            player[stat]++;
            logMessage(`{gold:You consume the tome. ${stat.toUpperCase()} +1!}`);
            triggerStatAnimation(statDisplays[stat], 'stat-pulse-green');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            
            // Re-calc max HP/Mana instantly
            if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
            
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        } else {
            logMessage("This tome seems to be a dud.");
        }

    // --- BUFF POTIONS ---
    } else if (itemToUse.type === 'buff_potion') {
        const template = ITEM_DATA[Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === itemToUse.name)];

        if (player.strengthBonusTurns > 0) {
            logMessage("Effect already active.");
        } else {
            player.strengthBonus = template.amount;
            player.strengthBonusTurns = template.duration;
            logMessage(`You drink the potion. (+${template.amount} Str)`);
            triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

    // --- TELEPORT SCROLLS ---
    } else if (itemToUse.type === 'teleport') {
         logMessage("You chant the words of returning...");
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 20);

        if (gameState.mapMode === 'overworld') {
            player.x = 0;
            player.y = 0;
            chunkManager.loadedChunks = {}; 
            logMessage("The world twists... you stand at the Village gates.");
        } else {
            exitToOverworld("The magic pulls you out of the dungeon and back to the surface.");
        }

        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
        itemUsed = true;

    // --- TREASURE MAPS ---
    } else if (itemToUse.type === 'treasure_map') {
        if (!gameState.activeTreasure) {
            const dist = 50 + Math.floor(Math.random() * 100);
            const angle = Math.random() * 2 * Math.PI;
            const tx = Math.floor(player.x + Math.cos(angle) * dist);
            const ty = Math.floor(player.y + Math.sin(angle) * dist);
            
            gameState.activeTreasure = { x: tx, y: ty };
            if (playerRef) playerRef.update({ activeTreasure: gameState.activeTreasure });

            logMessage(`{gold:The map reveals a hidden mark! Location: (${tx}, ${-ty}).}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            itemUsed = true;
        } else {
            logMessage(`The map marks a location at (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y}).`);
        }

    // --- JOURNALS & LORE ---
    } else if (['journal', 'lore', 'random_journal', 'random_lore'].includes(itemToUse.type)) {
        
        // Find the original item template to grab the text content
        const template = window.ITEM_DATA[itemToUse.templateId] || window.ITEM_DATA[itemToUse.tile] || {};
        const title = itemToUse.title || template.title || itemToUse.name;
        const content = itemToUse.content || template.content || itemToUse.description || "The pages are illegible.";

        // Grant the Codex Discovery (Used for Lore Set Collection bonuses!)
        if (typeof grantLoreDiscovery === 'function') {
            grantLoreDiscovery(itemToUse.templateId, itemToUse.templateId);
        }

        const loreTitle = document.getElementById('loreTitle');
        const loreContent = document.getElementById('loreContent');
        const loreModal = document.getElementById('loreModal');

        if (loreTitle && loreContent && loreModal) {
            loreTitle.textContent = title;
            loreContent.textContent = content; // Modal CSS handles the \n line breaks
            loreModal.classList.remove('hidden');
        }

        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        itemUsed = false; // IMPORTANT: Do not consume the item or end the turn!

    // --- JUNK / UNKNOWN ---
    } else {
        logMessage(`You can't use '${itemToUse.name}' right now.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    }

    // --- FINAL SAVE & RENDER ---
    if (itemUsed) {
        syncPlayerState();
        endPlayerTurn();
        renderInventory();
        renderEquipment();
        renderStats();
        if (typeof render === 'function') render();
    }
}

/**
 * Adds or subtracts an item's stat bonuses from the player.
 * Automatically triggers derived stat recalculation to prevent HP/Mana desyncs.
 * @param {object} item - The item object (from equipment).
 * @param {number} operation - 1 to add, -1 to subtract.
 */
function applyStatBonuses(item, operation) {
    if (!item || !item.statBonuses) return;

    const player = gameState.player;

    for (const stat in item.statBonuses) {
        if (player.hasOwnProperty(stat)) {
            let amount = item.statBonuses[stat];

            // --- BATTLEMAGE: ARCANE STEEL ---
            if (stat === 'dexterity' && amount < 0 && player.talents && player.talents.includes('arcane_steel')) {
                if (operation === 1) logMessage("{purple:Arcane Steel negates the armor's weight.}");
                continue;
            }

            // Apply the Core Stat Change
            player[stat] += (amount * operation);

            // Visual Juice
            if (operation === 1) {
                logMessage(`You feel ${stat} increase! (+${amount})`);
                triggerStatFlash(statDisplays[stat], true);
            } else {
                triggerStatFlash(statDisplays[stat], false);
            }
        }
    }

    // Leverage the global recalculator to safely enforce Max HP/Mana bounds
    if (typeof recalculateDerivedStats === 'function') {
        recalculateDerivedStats();
    }
}
