// --- START OF FILE items.js ---

// O(1) Cache for Item Name Lookups during Rehydration
// Prevents the engine from scanning the massive ITEM_DATA dictionary thousands of times when loading a save.
const _itemTemplateCache = {};
function resolveTemplateIdByName(name) {
    if (_itemTemplateCache[name]) return _itemTemplateCache[name];
    if (typeof window.ITEM_DATA === 'undefined') return null;
    const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
    if (key) _itemTemplateCache[name] = key;
    return key;
}

/**
 * Takes raw player data (from Firebase) and reconnects it to game templates.
 * ensuring items have effects, correct stats, and valid IDs.
 */
function rehydratePlayerState(data) {
    if (!data.inventory || !Array.isArray(data.inventory)) return [];

    // 🚨 BUG FIX: Filter out null/undefined ghost slots from Firebase sparse arrays BEFORE mapping!
    return data.inventory.filter(item => item !== null && item !== undefined).map(item => {
        let templateItem = null;
        let templateKey = null;

        // 1. ROBUST LOOKUP (By ID)
        if (item.templateId && ITEM_DATA[item.templateId]) {
            templateItem = ITEM_DATA[item.templateId];
            templateKey = item.templateId;
        }

        // 2. FALLBACK A: Name Match (Using Cache for Performance)
        if (!templateItem) {
            templateKey = resolveTemplateIdByName(item.name);
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
            if (item.damage === undefined || item.damage === null) item.damage = templateItem.damage || 0;
            if (item.defense === undefined || item.defense === null) item.defense = templateItem.defense || 0;
            
            // ROBUSTNESS WIN: Force the slot to match the template to prevent save-file hacking
            item.slot = templateItem.slot; 
            item.tile = item.tile || templateItem.tile; 
            item.range = item.range || templateItem.range || null;
            item.isTwoHanded = (item.isTwoHanded !== undefined) ? item.isTwoHanded : (templateItem.isTwoHanded || false);
            
            // ECS WIN: Rehydrate tags for old save files!
            item.tags = item.tags || templateItem.tags || null;
            
        } else {
            // Graceful degradation for removed items
            console.warn(`[AKASHIC ENGINE] Converting corrupted/missing item to Ash: ${item.name}`);
            item.name = `Crumbling Ash`;
            item.description = "Dust from a forgotten age. This item no longer exists in the timeline.";
            item.type = 'junk';
            item.tile = '💨';
            item.quantity = item.quantity || 1;
            
            // BUG FIX: Strip equip data so corrupted items don't break the combat renderer
            item.slot = null; 
            item.isEquipped = false;
            item.tags = null;
            item._rarity = null;
        }
        return item;
    });
}

/**
 * Generates loot when an enemy is defeated.
 * Drops a mix of Junk, Gold, or Level-Scaled Loot.
 */
function generateEnemyLoot(player, enemy) {
    // --- 0. QUEST ITEM DROPS ---
    if (gameState.player.relicQuestStage === 1 && (enemy.tile === '🦂' || enemy.tile === 'm') && Math.random() < 0.05) {
        logMessage("{gold:You found the Sun Shard!}");
        return '💎s';
    }
    if (gameState.player.relicQuestStage === 2 && (enemy.tile === 'l' || enemy.tile === '🐉h') && Math.random() < 0.05) {
        logMessage("{blue:You found the Moon Tear!}");
        return '💎m';
    }
    if (gameState.player.relicQuestStage === 3 && (enemy.tile === 'Y' || enemy.tile === '🐲') && Math.random() < 0.05) {
        logMessage("{purple:You found the Void Crystal!}");
        return '💎v';
    }
    if ((gameState.player.shadowQuestStage || 0) === 0 && enemy.name.includes('Cultist') && Math.random() < 0.20) {
        logMessage("{purple:You found Cultist Orders on the body!}");
        return '📜c';
    }
    if (gameState.player.shadowQuestStage === 1 && enemy.name === 'Cultist Fanatic' && Math.random() < 0.25) {
        logMessage("{purple:You found a Shadow Amulet!}");
        return '🧿s';
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
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        dist = Math.sqrt(player.x * player.x + player.y * player.y);
        if (gameState.currentRealm && gameState.currentRealm !== 0) dist += 1000; 
    } else {
        const instanceId = gameState.currentCaveId || gameState.currentCastleId || "";
        if (instanceId === 'cave_landmark' || instanceId.includes('tomb_of_alaric')) {
            dist = 5000; 
        } else {
            const parts = instanceId.split('_').map(Number).filter(n => !isNaN(n));
            if (parts.length >= 2) {
                dist = Math.sqrt(parts[0] * parts[0] + parts[1] * parts[1]);
            } else {
                dist = 100;
            }
        }
    }

    // --- 3. Determine Drop Tables ---
    const JUNK_DROP_CHANCE = Math.max(0.05, 0.25 - (player.luck * 0.001));
    const GOLD_DROP_CHANCE = 0.50;
    const roll = Math.random();

    if (roll < JUNK_DROP_CHANCE) {
        if (enemy.tile === 'l' || enemy.name === 'Giant Leech') return '🐟';
        if (enemy.tile === '🐗' || enemy.name === 'Wild Boar') return '🍖';
        return enemy.loot || '$';
    }

    if (roll < JUNK_DROP_CHANCE + GOLD_DROP_CHANCE) return '$';

    // --- 4. Magic Item Chance ---
    let magicChance = 0.01; 
    if (dist > 1500) magicChance = 0.15; 
    else if (dist > 500) magicChance = 0.10; 
    else if (dist > 250) magicChance = 0.05; 

    magicChance += (player.luck * 0.005);

    // CONTENT WIN: Guaranteed Loot for Bosses
    if (enemy.isBoss) {
        magicChance = 1.0; 
        logMessage(`{gold:The ${enemy.name} collapses, leaving behind a powerful artifact...}`);
    } else if (enemy.isElite) {
        magicChance += 0.20; 
        logMessage(`{purple:The ${enemy.name} leaves behind a glowing essence...}`);
    }

    if (Math.random() < magicChance) return '✨'; 

    // --- 4.5 LEGENDARY ARTIFACT DROPS (Tier 6 Only) ---
    if (dist > 2500 && Math.random() < 0.05) { 
        const legendaries = ['⚔️k', '🛡️a', '👢w', '👑v', '🍎', '🗡️v', '👹'];
        const drop = legendaries[Math.floor(Math.random() * legendaries.length)];
        const item = ITEM_DATA[drop];
        logMessage(`{gold:The enemy dropped a Legendary Artifact: ${item.name}!}`);
        
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
        return drop;
    }

    // --- 5. Standard Equipment Drops ---
    const scaledRoll = Math.random();
    const commonLoot = ['♥', '🔮', 'S', '💜', '🐀', '🦇w', '🦷', '🧣'];
    const tier1Loot = ['\\', '%', '🏏', '🦯', '🏹', '👕', '👘'];
    const tier2Loot = ['!', '[', '📚', '🛡️s', '🛡️w', 'P', '8'];
    const tier3Loot = ['⚔️s', 'A', 'Ψ', 'M', '⚔️l', '⛓️', '🛡️i', '9'];
    const tier4Loot = ['🪓', '🔨', '🛡️p', '*'];
    const tier5Loot = ['⚔️o', '🛡️o', '❄️b', '❄️m', '⚔️m', '🛡️m']; 

    let tier1Chance = 0.30, tier2Chance = 0.0, tier3Chance = 0.0, tier4Chance = 0.0, tier5Chance = 0.0;

    if (dist > 1500) { tier1Chance = 0.0; tier2Chance = 0.05; tier3Chance = 0.20; tier4Chance = 0.40; tier5Chance = 0.35; } 
    else if (dist > 500) { tier1Chance = 0.0; tier2Chance = 0.20; tier3Chance = 0.40; tier4Chance = 0.20; tier5Chance = 0.05; } 
    else if (dist > 250) { tier1Chance = 0.10; tier2Chance = 0.40; tier3Chance = 0.30; tier4Chance = 0.05; } 
    else if (dist > 100) { tier1Chance = 0.30; tier2Chance = 0.30; tier3Chance = 0.05; }

    if (scaledRoll < tier5Chance) return tier5Loot[Math.floor(Math.random() * tier5Loot.length)] || '$';
    if (scaledRoll < tier5Chance + tier4Chance) return tier4Loot[Math.floor(Math.random() * tier4Loot.length)] || '$';
    if (scaledRoll < tier5Chance + tier4Chance + tier3Chance) return tier3Loot[Math.floor(Math.random() * tier3Loot.length)] || '$';
    if (scaledRoll < tier5Chance + tier4Chance + tier3Chance + tier2Chance) return tier2Loot[Math.floor(Math.random() * tier2Loot.length)] || '$';
    if (scaledRoll < tier5Chance + tier4Chance + tier3Chance + tier2Chance + tier1Chance) return tier1Loot[Math.floor(Math.random() * tier1Loot.length)] || '$';

    return commonLoot[Math.floor(Math.random() * commonLoot.length)] || '$';
}

// PERFORMANCE WIN: Static Cache for Magic Item Base Templates
window._cachedBaseItemKeys = null;

function generateMagicItem(tier) {
    const playerLuck = (gameState && gameState.player && gameState.player.luck) ? gameState.player.luck : 1;
    const luckBonus = playerLuck * 0.01; 

    if (!window._cachedBaseItemKeys) {
        window._cachedBaseItemKeys = Object.keys(ITEM_DATA).filter(k =>
            ITEM_DATA[k].type === 'weapon' || ITEM_DATA[k].type === 'armor'
        );
    }
    
    const validBaseKeys = window._cachedBaseItemKeys.filter(k => {
        const item = ITEM_DATA[k];
        if (item.excludeFromLoot) return false;
        
        const power = Math.max(item.damage || 0, item.defense || 0);
        if (tier === 1 && power > 2) return false;
        if (tier === 2 && (power < 2 || power > 3)) return false;
        if (tier === 3 && (power < 3 || power > 5)) return false;
        if (tier === 4 && (power < 5 || power > 7)) return false;
        if (tier >= 5 && power < 7) return false;
        return true;
    });

    const finalKeys = validBaseKeys.length > 0 ? validBaseKeys : window._cachedBaseItemKeys.filter(k => !ITEM_DATA[k].excludeFromLoot);
    const baseKey = finalKeys[Math.floor(Math.random() * finalKeys.length)];
    const template = ITEM_DATA[baseKey];

    let newItem = {
        templateId: baseKey,
        name: template.name,
        type: template.type,
        quantity: 1,
        tile: template.tile || baseKey,
        damage: template.damage || 0,
        defense: template.defense || 0,
        slot: template.slot,
        statBonuses: template.statBonuses ? JSON.parse(JSON.stringify(template.statBonuses)) : {},
        tags: template.tags ? [...template.tags] : [] 
    };

    let hasPrefix = false;
    let hasSuffix = false;

    // LORE WIN: Dynamic Named Artifacts
    if (tier >= 5 && Math.random() < 0.05) {
        const prefixes = ['Aegis', 'Wrath', 'Whisper', 'Sorrow', 'Echo', 'Vanguard'];
        const suffixes = ['the Void', 'the Forgotten King', 'the Deep', 'the Shattered Sky'];
        
        newItem.name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} of ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
        newItem._rarity = 'legendary';
        
        if (newItem.type === 'weapon') newItem.damage += 4;
        if (newItem.type === 'armor') newItem.defense += 4;
        newItem.statBonuses.luck = (newItem.statBonuses.luck || 0) + 2;
        
        return newItem; 
    }

    // Expanded Cursed Items
    if (tier >= 3 && Math.random() < 0.05) {
        const curses = ["Cursed", "Doomed", "Forsaken", "Blood-Starved", "Whispering", "Blighted"];
        const curseWord = curses[Math.floor(Math.random() * curses.length)];
        
        newItem.name = `${curseWord} ${newItem.name}`;
        hasPrefix = true;
        
        if (newItem.type === 'weapon') newItem.damage += (3 + Math.floor(Math.random() * 3)); 
        if (newItem.type === 'armor') newItem.defense += (3 + Math.floor(Math.random() * 3));
        
        newItem.statBonuses.luck = (newItem.statBonuses.luck || 0) - 2;
        newItem.statBonuses.willpower = (newItem.statBonuses.willpower || 0) - 2;
        
        const drains = ['constitution', 'strength', 'wits'];
        const extraDrain = drains[Math.floor(Math.random() * drains.length)];
        newItem.statBonuses[extraDrain] = (newItem.statBonuses[extraDrain] || 0) - 1;
        
        newItem._rarity = 'epic'; 
    } else {
        if (Math.random() < 0.5 + (tier * 0.1) + luckBonus) {
            const validPrefixes = Object.keys(LOOT_PREFIXES).filter(p => LOOT_PREFIXES[p].type === newItem.type);
            if (validPrefixes.length > 0) {
                const prefixName = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
                const prefixData = LOOT_PREFIXES[prefixName];

                newItem.name = `${prefixName} ${newItem.name}`;
                hasPrefix = true;

                for (const stat in prefixData.bonus) {
                    if (stat === 'damage') newItem.damage += prefixData.bonus[stat];
                    else if (stat === 'defense') newItem.defense += prefixData.bonus[stat];
                    else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + prefixData.bonus[stat];
                }
            }
        }
    }

    if (Math.random() < 0.3 + (tier * 0.1) + (luckBonus * 0.5)) {
        const suffixKeys = Object.keys(LOOT_SUFFIXES);
        const suffixName = suffixKeys[Math.floor(Math.random() * suffixKeys.length)];
        const suffixData = LOOT_SUFFIXES[suffixName];

        newItem.name = `${newItem.name} ${suffixName}`;
        hasSuffix = true;

        for (const stat in suffixData.bonus) {
            if (stat === 'damage') newItem.damage += suffixData.bonus[stat];
            else if (stat === 'defense') newItem.defense += suffixData.bonus[stat];
            else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + suffixData.bonus[stat];
        }
    }

    const tierBuff = Math.floor(Math.random() * tier) + 1;
    if (newItem.type === 'weapon') newItem.damage += tierBuff;
    if (newItem.type === 'armor') newItem.defense += tierBuff;

    if (!hasPrefix && !hasSuffix) {
        newItem.name = `Fine ${newItem.name}`; 
        if (newItem.type === 'weapon') newItem.damage += 1;
        if (newItem.type === 'armor') newItem.defense += 1;
    }

    if (!newItem._rarity) {
        if (hasPrefix && hasSuffix) newItem._rarity = 'epic';
        else if (hasPrefix || hasSuffix) newItem._rarity = 'rare';
        else newItem._rarity = 'uncommon';
        if (tier >= 5) newItem._rarity = 'legendary';
    }

    return newItem;
}

// ==========================================
// DB SANITIZATION (FIREBASE SAFE)
// ==========================================

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
        stat: item.stat || null,
        tags: item.tags || null, 
        _rarity: item._rarity || null,
        _negatedDex: item._negatedDex || null 
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

// 🚨 BUG FIX: Filter out null values before they hit Firebase!
function getSanitizedInventory() {
    if (!gameState.player.inventory) return [];
    return gameState.player.inventory
        .filter(item => item !== null && item !== undefined)
        .map(item => sanitizeItemForDB(item, false));
}

function getSanitizedBank() {
    if (!gameState.player.bank) return [];
    return gameState.player.bank
        .filter(item => item !== null && item !== undefined)
        .map(item => sanitizeItemForDB(item, false));
}

function rehydrateInventory(savedInventory) {
    if (!savedInventory || !Array.isArray(savedInventory)) return [];
    return rehydratePlayerState({ inventory: savedInventory });
}

function handleItemDrop(key) {
    const player = gameState.player;
    const keyNum = parseInt(key);

    if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) return;

    const itemIndex = keyNum - 1;
    const itemToDrop = player.inventory[itemIndex];

    if (!itemToDrop) return; 

    if (itemToDrop.isEquipped) {
        logMessage("{red:You cannot drop an item you are wearing!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    
    if (itemToDrop.type === 'quest') {
        logMessage("{red:You cannot drop crucial quest artifacts!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    const template = ITEM_DATA[itemToDrop.tile] || ITEM_DATA[itemToDrop.templateId];
    const isModified = itemToDrop.statBonuses || (template && itemToDrop.name !== template.name);
    
    if (isModified) {
        logMessage("{red:You cannot drop magic items! Sell or Stash them.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    let currentTile;
    if (gameState.mapMode === 'dungeon') {
        currentTile = chunkManager.caveMaps[gameState.currentCaveId]?.[player.y]?.[player.x] || ' ';
    } else if (gameState.mapMode === 'castle') {
        currentTile = chunkManager.castleMaps[gameState.currentCastleId]?.[player.y]?.[player.x] || ' ';
    } else {
        currentTile = chunkManager.getTile(player.x, player.y);
    }

    if (currentTile === '🌋' || currentTile === '🔥') {
        logMessage(`{orange:You toss the ${itemToDrop.name} into the flames. It turns to ash instantly.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.2, 800); 
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#f97316', 8);
        
        itemToDrop.quantity--;
        if (itemToDrop.quantity <= 0) player.inventory.splice(itemIndex, 1);
        
        gameState.isDroppingItem = false;
        if (typeof playerRef !== 'undefined') playerRef.update({ inventory: getSanitizedInventory() });
        if (typeof renderInventory === 'function') renderInventory();
        return;
        
    } else if (currentTile === 'Ω' || currentTile === '🕳️' || gameState.mapMode === 'skyrealm') {
        logMessage(`{void:You drop the ${itemToDrop.name} into the abyss. It ceases to exist.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#a855f7', 12);
        
        itemToDrop.quantity--;
        if (itemToDrop.quantity <= 0) player.inventory.splice(itemIndex, 1);
        
        gameState.isDroppingItem = false;
        if (typeof playerRef !== 'undefined') playerRef.update({ inventory: getSanitizedInventory() });
        if (typeof renderInventory === 'function') renderInventory();
        return;
    }

    let isValidDropTile = false;
    if (gameState.mapMode === 'overworld' && currentTile === '.') isValidDropTile = true;
    else if (gameState.mapMode === 'castle' && currentTile === '.') isValidDropTile = true;
    else if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        if (currentTile === theme.floor) isValidDropTile = true;
    }

    if (!isValidDropTile) {
        if (currentTile === '~' || currentTile === '≈') {
            logMessage(`{gray:You toss the ${itemToDrop.name} into the water. It sinks out of sight.}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 500); 
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 6);
            
            itemToDrop.quantity--;
            if (itemToDrop.quantity <= 0) player.inventory.splice(itemIndex, 1);
            
            gameState.isDroppingItem = false;
            if (typeof playerRef !== 'undefined') playerRef.update({ inventory: getSanitizedInventory() });
            if (typeof renderInventory === 'function') renderInventory();
            return;
        } else {
            logMessage("{red:You can't drop items here. (Must be on open floor)}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }
    }

    itemToDrop.quantity--;
    logMessage(`Dropped 1x ${itemToDrop.name}.`);

    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        chunkManager.setWorldTile(player.x, player.y, itemToDrop.tile, 2);
    } else if (gameState.mapMode === 'dungeon') {
        chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = itemToDrop.tile;
    } else if (gameState.mapMode === 'castle') {
        chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = itemToDrop.tile;
    }

    let tileId = (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') 
        ? `${player.x},${-player.y}`
        : `${gameState.currentCaveId || gameState.currentCastleId}:${player.x},${-player.y}`;
    gameState.lootedTiles.delete(tileId);

    if (itemToDrop.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    gameState.isDroppingItem = false;
    
    if (typeof playerRef !== 'undefined') {
        playerRef.update({ 
            inventory: getSanitizedInventory(),
            lootedTiles: Object.fromEntries(gameState.lootedTiles)
        });
    }
    
    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.createExplosion(player.x, player.y, '#9ca3af', 6);
        ParticleSystem.createFloatingText(player.x, player.y, "Dropped", "#9ca3af");
    }

    if (typeof renderInventory === 'function') renderInventory();
    gameState.mapDirty = true; 
    if (typeof render === 'function') render(); 
}

// PERFORMANCE & DRY WIN: Unified Equipment Helper
function _internalUnequip(item, player) {
    if (!item) return;
    applyStatBonuses(item, -1);
    item.isEquipped = false;
    logMessage(`{gray:You unequip the ${item.name}.}`);
    
    if (item.slot === 'weapon') {
        const getWeaponSkill = (i) => {
            const tags = i.tags || [];
            if (tags.includes("blunt") || tags.includes("axe")) return 'crush';
            if (tags.includes("dagger")) return 'quickstep';
            if (tags.includes("blade")) return 'deflect';
            if (tags.includes("staff")) return 'channel';
            if (tags.includes("bow") || tags.includes("crossbow")) return 'ranged_attack';
            return null;
        };
        const oldSkill = getWeaponSkill(item);
        if (oldSkill && player.skillbook[oldSkill]) {
            delete player.skillbook[oldSkill];
            logMessage(`{gray:You unlearned ${typeof SKILL_DATA !== 'undefined' && SKILL_DATA[oldSkill] ? SKILL_DATA[oldSkill].name : 'a skill'}.}`);
        }
    }
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
        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
        if (itemToUse.quantity > 1 && player.inventory.length >= invCap) {
            logMessage("{red:Inventory full! Make space before identifying stacked items.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        let tier = Math.max(1, Math.min(6, Math.floor(player.level / 5) + 1));
        if (Math.random() < 0.20) tier = Math.min(6, tier + 1);

        const identifiedItem = generateMagicItem(tier);
        
        let colorTag = 'blue';
        let rarityLabel = 'Uncommon';
        
        if (identifiedItem._rarity === 'rare') { colorTag = 'purple'; rarityLabel = 'Rare'; }
        if (identifiedItem._rarity === 'epic') { colorTag = 'red'; rarityLabel = 'Epic'; }
        if (identifiedItem._rarity === 'legendary') { colorTag = 'gold'; rarityLabel = 'Legendary'; }
        
        if (identifiedItem.name.includes("Cursed") || identifiedItem.name.includes("Doomed") || identifiedItem.name.includes("Forsaken")) {
            logMessage(`{red:The item radiates malice... You identified a Cursed artifact: ${identifiedItem.name}!}`);
            gameState.screenShake = 15;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning(); 
        } else {
            logMessage(`{${colorTag}:✨ The magic settles... You identified a ${rarityLabel} item: ${identifiedItem.name}!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
            if (identifiedItem._rarity === 'legendary') gameState.screenShake = 5;
        }

        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
        
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) {
            player.inventory.splice(itemIndex, 1, identifiedItem);
        } else {
            player.inventory.push(identifiedItem);
        }
        itemUsed = true;
    }

    // --- FISHING LOGIC ---
    else if (itemToUse.name === 'Fishing Rod' || itemToUse.name === 'Obsidian Fishing Rod' || itemToUse.name === 'Steel Fishing Rod') {
        itemUsed = typeof executeFishing === 'function' ? executeFishing() : false;
    }

    // --- CONSTRUCTIBLES (Walls, Floors, Traps) ---
    else if (itemToUse.type === 'constructible') {
        let currentTile;
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            currentTile = chunkManager.getTile(player.x, player.y);
        } else if (gameState.mapMode === 'dungeon') {
            currentTile = chunkManager.caveMaps[gameState.currentCaveId]?.[player.y]?.[player.x] || ' ';
        } else if (gameState.mapMode === 'castle') {
            currentTile = chunkManager.castleMaps[gameState.currentCastleId]?.[player.y]?.[player.x] || ' ';
        }

        const invalidTiles = ['~', '≈', '🧱', '+', '☒', '▓', '▒', '^', '<', '>', 'X', 'V', '🚪', '⛰'];

        if (invalidTiles.includes(currentTile)) {
            logMessage("You cannot build here.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        logMessage(`You place the ${itemToUse.name}.`);

        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
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
            _internalUnequip(currentEquipped, player);
            if (slot === 'weapon') player.equipment.weapon = { name: 'Fists', damage: 0, tags: ['blunt'] };
            else if (slot === 'armor') player.equipment.armor = { name: 'Simple Tunic', defense: 0 };
            else player.equipment[slot] = null;
        }

        // 2. Equip New
        if (currentEquipped !== itemToUse) {
            // --- TWO-HANDED LOGIC SAFEGUARDS ---
            if (slot === 'offhand' && player.equipment.weapon && player.equipment.weapon.isTwoHanded) {
                _internalUnequip(player.equipment.weapon, player);
                player.equipment.weapon = { name: 'Fists', damage: 0, tags: ['blunt'] };
                logMessage(`{gray:You stow away your two-handed weapon to hold your off-hand.}`);
            }
            
            if (slot === 'weapon' && itemToUse.isTwoHanded && player.equipment.offhand) {
                _internalUnequip(player.equipment.offhand, player);
                player.equipment.offhand = null;
                logMessage("{gray:You unequip your off-hand to hold the two-handed weapon.}");
            }

            let deltaText = "";
            if (slot === 'weapon') {
                const oldDmg = currentEquipped ? (currentEquipped.damage || 0) : 0;
                const newDmg = itemToUse.damage || 0;
                const diff = newDmg - oldDmg;
                if (diff !== 0) {
                    const color = diff > 0 ? 'green' : 'red';
                    deltaText = ` {${color}:(Damage ${diff > 0 ? '+' : ''}${diff})}`;
                }
            } else if (['armor', 'offhand', 'accessory'].includes(slot)) {
                const oldDef = currentEquipped ? (currentEquipped.defense || 0) : 0;
                const newDef = itemToUse.defense || 0;
                const diff = newDef - oldDef;
                if (diff !== 0) {
                    const color = diff > 0 ? 'blue' : 'red';
                    deltaText = ` {${color}:(Defense ${diff > 0 ? '+' : ''}${diff})}`;
                }
            }

            itemToUse.isEquipped = true;
            player.equipment[slot] = itemToUse;
            applyStatBonuses(itemToUse, 1);
            
            let equipVerb = "equip";
            if (slot === 'weapon') equipVerb = "wield";
            else if (slot === 'armor') equipVerb = "don";
            else if (slot === 'ammo') equipVerb = "nock";
            else if (slot === 'accessory') equipVerb = "put on";
            
            logMessage(`You ${equipVerb} the ${itemToUse.name}.${deltaText}`);

            if (itemToUse._rarity === 'legendary' || itemToUse._rarity === 'epic' || itemToUse.name.includes("Fallen King")) {
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#facc15', 25);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                gameState.screenShake = 5;
            } else {
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); 
            }

            // Grant new weapon skill
            if (slot === 'weapon') {
                const getWeaponSkill = (item) => {
                    const tags = item.tags || [];
                    if (tags.includes("blunt") || tags.includes("axe")) return 'crush';
                    if (tags.includes("dagger")) return 'quickstep';
                    if (tags.includes("blade")) return 'deflect';
                    if (tags.includes("staff")) return 'channel';
                    if (tags.includes("bow") || tags.includes("crossbow")) return 'ranged_attack';
                    return null;
                };
                const newSkill = getWeaponSkill(itemToUse);
                if (newSkill) {
                    player.skillbook[newSkill] = 1; 
                    logMessage(`Weapon Technique: You learned ${typeof SKILL_DATA !== 'undefined' && SKILL_DATA[newSkill] ? SKILL_DATA[newSkill].name : newSkill}!`);
                    if (!player.hotbar[0]) player.hotbar[0] = newSkill;
                }
            }
        }
        
        itemUsed = true;

    // --- SPELLBOOKS, SKILLBOOKS, TOOLS ---
    } else if (itemToUse.type === 'spellbook' || itemToUse.type === 'skillbook' || itemToUse.type === 'tool') {
        let data = null;
        let learned = false;

        const MAX_ABILITY_LEVEL = 10; 

        if (itemToUse.type === 'spellbook') {
            data = typeof SPELL_DATA !== 'undefined' ? SPELL_DATA[itemToUse.spellId] : null;
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
            data = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[itemToUse.skillId] : null;
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
            // Tools
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
            
            let color = '#facc15';
            let statText = stat.substring(0,3).toUpperCase();
            
            if (stat === 'strength') { color = '#ef4444'; statText = "Strength"; }
            if (stat === 'wits') { color = '#3b82f6'; statText = "Wits"; }
            if (stat === 'constitution') { color = '#22c55e'; statText = "Constitution"; }
            if (stat === 'dexterity') { color = '#84cc16'; statText = "Dexterity"; }
            if (stat === 'willpower') { color = '#a855f7'; statText = "Willpower"; }
            
            logMessage(`{gold:You consume the tome. Your ${statText} permanently increases!}`);
            
            if (typeof triggerStatAnimation !== 'undefined' && typeof statDisplays !== 'undefined') {
                triggerStatAnimation(statDisplays[stat], 'stat-pulse-green');
            }
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(player.x, player.y, color, 20);
                ParticleSystem.createFloatingText(player.x, player.y, `+1 ${statText}`, color);
            }
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            
            if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
            
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        } else {
            logMessage("This tome seems to be a dud.");
        }

    // --- BUFF POTIONS ---
    } else if (itemToUse.type === 'buff_potion') {
        const template = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === itemToUse.name)] : null;

        if (template && player.strengthBonusTurns > 0) {
            logMessage("Effect already active.");
        } else if (template) {
            player.strengthBonus = template.amount;
            player.strengthBonusTurns = template.duration;
            logMessage(`You drink the potion. (+${template.amount} Str)`);
            if (typeof triggerStatAnimation !== 'undefined' && typeof statDisplays !== 'undefined') {
                triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
            }
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

    // --- TELEPORT SCROLLS ---
    } else if (itemToUse.type === 'teleport') {
         logMessage("{purple:You chant the words of returning...}");
        
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 20);
        
        gameState.screenShake = 15;

        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            player.x = 0;
            player.y = 0;
            if (typeof chunkManager !== 'undefined') chunkManager.loadedChunks = {}; 
            logMessage("The world twists... you stand at the Village gates.");
        } else {
            if (typeof exitToOverworld === 'function') exitToOverworld("The magic pulls you out of the dungeon and back to the surface.");
        }

        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
        itemUsed = true;

    // --- TREASURE MAPS ---
    } else if (itemToUse.type === 'treasure_map') {
        if (gameState.mapMode !== 'overworld') {
            logMessage("{red:You must be under the open sky in the Overworld to chart these coordinates.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            itemUsed = false; 
        } 
        else if (!gameState.activeTreasure) {
            const dist = 50 + Math.floor(Math.random() * 100);
            const angle = Math.random() * 2 * Math.PI;
            const tx = Math.floor(player.x + Math.cos(angle) * dist);
            const ty = Math.floor(player.y + Math.sin(angle) * dist);
            
            gameState.activeTreasure = { x: tx, y: ty };
            if (typeof playerRef !== 'undefined' && playerRef) playerRef.update({ activeTreasure: gameState.activeTreasure });

            logMessage(`{gold:The map reveals a hidden mark! Location: (${tx}, ${-ty}).}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) player.inventory.splice(itemIndex, 1);
            
            itemUsed = true;
        } else {
            logMessage(`You are already tracking a treasure at (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y}).`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            itemUsed = false;
        }

    // --- JOURNALS & LORE ---
    } else if (['journal', 'lore', 'random_journal', 'random_lore'].includes(itemToUse.type)) {
        
        const template = typeof window.ITEM_DATA !== 'undefined' ? (window.ITEM_DATA[itemToUse.templateId] || window.ITEM_DATA[itemToUse.tile] || {}) : {};
        const title = itemToUse.title || template.title || itemToUse.name;
        
        let content = itemToUse.content || template.content || itemToUse.description || "The pages are illegible.";
        if (typeof autoFormatLore === 'function') content = autoFormatLore(content);

        if (typeof grantLoreDiscovery === 'function') {
            grantLoreDiscovery(itemToUse.templateId, itemToUse.templateId);
        }

        const loreTitle = document.getElementById('loreTitle');
        const loreContent = document.getElementById('loreContent');
        const loreModal = document.getElementById('loreModal');

        if (loreTitle && loreContent && loreModal) {
            loreTitle.textContent = title;
            loreContent.innerHTML = `<div class="font-serif leading-relaxed text-gray-300">${content}</div>`;
            loreModal.classList.remove('hidden');
        }

        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        itemUsed = false; 

    // --- JUNK / UNKNOWN ---
    } else {
        logMessage(`You can't use '${itemToUse.name}' right now.`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    }

    // --- FINAL SAVE & RENDER ---
    if (itemUsed) {
        if (typeof syncPlayerState === 'function') syncPlayerState();
        if (typeof endPlayerTurn === 'function') endPlayerTurn();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderStats === 'function') renderStats();
        if (typeof render === 'function') render();
    }
}

/**
 * BUG FIX WIN: The `_negatedDex` flag allows us to safely bypass `Arcane Steel` edge cases
 * when a player levels up while wearing Heavy Armor.
 */
function applyStatBonuses(item, operation) {
    if (!item || !item.statBonuses) return;

    const player = gameState.player;

    const oldMaxes = {
        health: player.maxHealth || 10,
        mana: player.maxMana || 10,
        stamina: player.maxStamina || 10,
        psyche: player.maxPsyche || 10
    };

    for (const stat in item.statBonuses) {
        if (player.hasOwnProperty(stat)) {
            let amount = item.statBonuses[stat];

            // --- BATTLEMAGE: ARCANE STEEL BUG FIX ---
            if (stat === 'dexterity' && amount < 0) {
                if (operation === 1 && player.talents && player.talents.includes('arcane_steel')) {
                    logMessage("{purple:Arcane Steel negates the armor's weight.}");
                    item._negatedDex = true; 
                    continue; 
                } else if (operation === -1 && item._negatedDex) {
                    delete item._negatedDex; // Clean up flag
                    continue; // Skip removing the penalty because it was never applied!
                }
            }

            player[stat] += (amount * operation);

            if (operation === 1) {
                logMessage(`You feel ${stat} increase! (+${amount})`);
                if (typeof triggerStatFlash === 'function' && typeof statDisplays !== 'undefined') triggerStatFlash(statDisplays[stat], true);
            } else {
                if (typeof triggerStatFlash === 'function' && typeof statDisplays !== 'undefined') triggerStatFlash(statDisplays[stat], false);
            }
        }
    }

    if (typeof recalculateDerivedStats === 'function') {
        recalculateDerivedStats();

        const hpDelta = player.maxHealth - oldMaxes.health;
        if (hpDelta !== 0) player.health = Math.max(1, Math.min(player.maxHealth, player.health + hpDelta));
        
        const manaDelta = player.maxMana - oldMaxes.mana;
        if (manaDelta !== 0) player.mana = Math.max(0, Math.min(player.maxMana, player.mana + manaDelta));

        const stamDelta = player.maxStamina - oldMaxes.stamina;
        if (stamDelta !== 0) player.stamina = Math.max(0, Math.min(player.maxStamina, player.stamina + stamDelta));

        const psycheDelta = player.maxPsyche - oldMaxes.psyche;
        if (psycheDelta !== 0) player.psyche = Math.max(0, Math.min(player.maxPsyche, player.psyche + psycheDelta));
    }
}

// --- END OF FILE items.js ---
