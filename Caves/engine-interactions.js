const InteractionManager = {
    _registry: {},

    /**
     * Register a handler for a specific tile char or "TYPE:typeName"
     * @param {string|string[]} keys - Tile char (e.g., '§') or Type string (e.g., 'TYPE:loot_container')
     * @param {function} handler - Function(player, x, y, tileData) returning true if handled
     */
    register: function(keys, handler) {
        if (Array.isArray(keys)) {
            keys.forEach(k => this._registry[k] = handler);
        } else {
            this._registry[keys] = handler;
        }
    },

    /**
     * Main entry point called by script.js
     */
    handle: function(player, x, y, tile, tileData) {
        // 1. Check specific Tile Character handler (e.g., '§', 'N')
        if (this._registry[tile]) {
            return this._registry[tile](player, x, y, tileData);
        }

        // 2. Check by Tile Data Type (e.g., 'TYPE:loot_container')
        if (tileData && tileData.type && this._registry[`TYPE:${tileData.type}`]) {
            return this._registry[`TYPE:${tileData.type}`](player, x, y, tileData);
        }

        // 3. Check for Item Pickup (If tile exists in ITEM_DATA)
        if (ITEM_DATA[tile]) {
            return this._handleItemPickup(player, x, y, tile, ITEM_DATA[tile]);
        }

        return false;
    },

    // Internal helper for item logic
    _handleItemPickup: function(player, x, y, tile, itemData) {
        // Special Case: Magic Item Sparkle
        if (tile === '✨') {
            if (player.inventory.length >= MAX_INVENTORY_SLOTS) {
                logMessage("You see a sparkling item, but your inventory is full!");
                return true;
            }
            const dist = Math.sqrt(x*x + y*y);
            let tier = 1;
            if (dist > 500) tier = 4;
            else if (dist > 250) tier = 3;
            else if (dist > 100) tier = 2;

            const newItem = generateMagicItem(tier);
            player.inventory.push(newItem);
            logMessage(`You picked up a ${newItem.name}!`);
            this._clearTile(x, y);
            this._syncInventory();
            return true;
        }

        // Standard Items
        if (player.inventory.length >= MAX_INVENTORY_SLOTS && itemData.type !== 'instant') {
             // Check for stackable existing item
             const existing = player.inventory.find(i => i.name === itemData.name);
             if (!existing || (itemData.type !== 'junk' && itemData.type !== 'consumable')) {
                 logMessage(`You see a ${itemData.name}, but your inventory is full.`);
                 return true; 
             }
        }

        // Instant Effects (Coins, Hearts)
        if (itemData.type === 'instant') {
            itemData.effect(gameState, `${x},${-y}`);
            this._clearTile(x, y);
            return true;
        }

        // Add to Inventory
        const existing = player.inventory.find(i => i.name === itemData.name);
        if (existing && (itemData.type === 'junk' || itemData.type === 'consumable')) {
            existing.quantity++;
        } else {
            player.inventory.push({
                name: itemData.name,
                type: itemData.type,
                quantity: 1,
                tile: tile,
                damage: itemData.damage,
                defense: itemData.defense,
                slot: itemData.slot,
                statBonuses: itemData.statBonuses,
                effect: itemData.effect
            });
        }

        logMessage(`You picked up ${itemData.name}.`);
        this._clearTile(x, y);
        this._syncInventory();
        return true;
    },

    _clearTile: function(x, y) {
        // Helper to remove object from map and mark looted
        const tileId = (gameState.mapMode === 'overworld') ? `${x},${-y}` : `${gameState.currentCaveId || gameState.currentCastleId}:${x},${-y}`;
        gameState.lootedTiles.add(tileId);
        
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '.');
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][y][x] = CAVE_THEMES[gameState.currentCaveTheme].floor;
        else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][y][x] = '.';
    },

    _syncInventory: function() {
        // Helper to update UI/DB
        playerRef.update({ inventory: getSanitizedInventory(), lootedTiles: Array.from(gameState.lootedTiles) });
        renderInventory();
        renderStats(); // Update gold
    }
};

// ==========================================
//  INTERACTION HANDLERS
// ==========================================

// --- 1. LORE & JOURNALS ---
InteractionManager.register(['TYPE:journal', 'TYPE:random_journal', 'TYPE:lore', 'TYPE:lore_statue'], (player, x, y, data) => {
    const tileId = `${x},${-y}`;
    
    // XP Discovery
    if (!gameState.foundLore.has(tileId)) {
        const xp = (data.type === 'lore_statue' || data.type === 'random_journal') ? 10 : 10; // Can tweak per type
        logMessage(`You found something interesting! +${xp} XP`);
        grantXp(xp);
        gameState.foundLore.add(tileId);
        
        // Codex Tracking
        if (data.type === 'journal') {
            if (!gameState.foundCodexEntries) gameState.foundCodexEntries = new Set();
            // Use the tile character as ID if no template ID exists (fallback)
            gameState.foundCodexEntries.add(chunkManager.getTile(x, y)); 
            grantLoreDiscovery(chunkManager.getTile(x, y)); // Check set completion
        }
        
        playerRef.update({ foundLore: Array.from(gameState.foundLore) });
    }

    // Determine Message/Content
    let title = data.title || "Ancient Inscription";
    let content = data.content || data.message;

    if (data.type === 'random_journal') {
        const seed = stringToSeed(tileId);
        const random = Alea(seed);
        content = `"${LORE_FRAGMENTS[Math.floor(random() * LORE_FRAGMENTS.length)]}"`;
        title = "Forgotten Letter";
        InteractionManager._clearTile(x, y); // Consume page
    } else if (data.type === 'lore_statue') {
        const seed = stringToSeed(tileId);
        const random = Alea(seed);
        const msg = Array.isArray(data.message) ? data.message[Math.floor(random() * data.message.length)] : data.message;
        content = msg;
        title = "Weathered Statue";
    }

    // Show Modal
    if (typeof loreModal !== 'undefined') {
        loreTitle.textContent = title;
        loreContent.textContent = content;
        loreModal.classList.remove('hidden');
    } else {
        logMessage(content);
    }
    return true;
});

// --- 2. LOOT CONTAINERS ---
InteractionManager.register(['TYPE:loot_container', 'TYPE:loot_chest', 'TYPE:barrel'], (player, x, y, data) => {
    // Mimic Check (10% chance)
    if (data.type === 'loot_chest' && Math.random() < 0.10) {
        logMessage("The chest has teeth! IT'S A MIMIC!");
        if(gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, 'M');
        else if(gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][y][x] = 'M';
        else chunkManager.castleMaps[gameState.currentCastleId][y][x] = 'M';
        
        player.health -= 3;
        gameState.screenShake = 10;
        triggerStatFlash(statDisplays.health, false);
        render();
        return true; 
    }

    if (data.type === 'barrel') {
        logMessage("You smash the barrel!");
        if (Math.random() < 0.3) {
            logMessage("You find some oil. (+20 Light)");
            player.candlelightTurns += 20;
        }
        InteractionManager._clearTile(x, y);
        return true;
    }

    // Generate Loot
    logMessage(data.flavor || "You open the container...");
    let lootTable = data.lootTable;
    if (!lootTable) {
        // Fallback dynamic table
        const dist = Math.sqrt(x*x + y*y);
        lootTable = (dist > 250) ? ['$', 'S', '🔮', '💎', '🧪'] : ['$', '(', '†', '+'];
    }

    const seed = stringToSeed(`${x},${-y}`);
    const random = Alea(seed);
    const count = 1 + Math.floor(random() * 2);

    for (let i = 0; i < count; i++) {
        const itemKey = lootTable[Math.floor(random() * lootTable.length)];
        // Reuse internal item logic to add to inventory
        InteractionManager._handleItemPickup(player, x, y, 'TEMP', ITEM_DATA[itemKey] || {name: 'Gold Coin', type: 'instant', effect: (s)=>{ s.player.coins+=10; }});
    }
    
    InteractionManager._clearTile(x, y);
    return true;
});

// --- 3. SHOPS & SERVICES ---
InteractionManager.register(['§', 'H', '¥', 'W', '🔥'], (player, x, y, data) => {
    const hour = gameState.time.hour;
    
    // General Store
    if (data.type === 'shop') {
        if (hour < 6 || hour >= 20) { logMessage("Shop is closed (6 AM - 8 PM)."); return true; }
        
        // Persistent Shop State
        let contextId = gameState.mapMode === 'castle' ? gameState.currentCastleId : 'overworld';
        const shopId = `shop_${contextId}_${x}_${y}`;
        if (!gameState.shopStates) gameState.shopStates = {};
        if (!gameState.shopStates[shopId]) {
            // First visit, clone inventory
            let template = (gameState.mapMode === 'castle') ? CASTLE_SHOP_INVENTORY : SHOP_INVENTORY;
            gameState.shopStates[shopId] = JSON.parse(JSON.stringify(template));
        }
        activeShopInventory = gameState.shopStates[shopId];
        
        logMessage("You enter the Store.");
        renderShop();
        shopModal.classList.remove('hidden');
    }
    
    // Healer
    else if (data.type === 'npc_healer') {
        if (hour < 6 || hour >= 20) { logMessage("The Healer is sleeping."); return true; }
        
        // Quest Check
        const qId = "healerSupply";
        if (!player.quests[qId]) {
            // Logic to offer quest... (Simplified for brevity, can call acceptQuest directly or show modal)
            logMessage("Healer: 'I need herbs for the fever...' (Check Bounty Board or interact again to Heal)");
            // Better: Trigger Quest UI logic here if we want direct interaction
        } 
        
        // Heal Logic
        if (player.health < player.maxHealth) {
            if (player.coins >= 10) {
                player.coins -= 10;
                player.health = player.maxHealth;
                logMessage("The Healer restores your health (-10g).");
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                renderStats();
            } else logMessage("Healer: 'Healing costs 10 gold.'");
        } else logMessage("Healer: 'You seem healthy.'");
    }

    // Trader
    else if (data.type === 'trader') {
        activeShopInventory = TRADER_INVENTORY;
        logMessage("Wandering Trader: 'Rare goods... for a price.'");
        renderShop();
        shopModal.classList.remove('hidden');
    }

    // Crafting
    else if (data.type === 'workbench' || data.type === 'cooking_fire') {
        openCraftingModal(data.type === 'cooking_fire' ? 'cooking' : 'workbench');
    }

    return true;
});

// --- 4. NPCS & QUEST GIVERS ---
InteractionManager.register(['N', 'G', 'K', 'O', 'T', '🎓', '👻'], (player, x, y, data) => {
    // Generic Handler for simple dialogue
    const showDialogue = (title, text) => {
        loreTitle.textContent = title;
        loreContent.innerHTML = text;
        loreModal.classList.remove('hidden');
    };

    if (data.tile === 'N') { // Villager
        const qId = "goblinHeirloom";
        if (!player.quests[qId]) {
            showDialogue("Villager", `"A goblin stole my heirloom! Please help!" <br><button onclick="acceptQuest('${qId}'); document.getElementById('loreModal').classList.add('hidden');" class="mt-2 bg-blue-500 text-white p-2 rounded">Accept</button>`);
        } else if (player.quests[qId].status === 'active') {
            const hasItem = player.inventory.some(i => i.name === 'Heirloom');
            if (hasItem) turnInQuest(qId);
            else logMessage("Villager: 'Please find my heirloom.'");
        } else logMessage("Villager: 'Bless you, hero.'");
    }

    else if (data.tile === 'G') { // Guard
        const qId = "banditChief";
        if (!player.quests[qId]) acceptQuest(qId); // Auto-popup logic handles this in original script
        else if (player.quests[qId].status === 'active' && player.quests[qId].kills >= 1) turnInQuest(qId);
        else logMessage("Guard: 'Keep your eyes open.'");
    }

    else if (data.tile === 'T') { // Trainer
        openSkillTrainerModal();
    }

    else if (data.tile === '🎓') { // Historian (Complex)
        player.relicQuestStage = player.relicQuestStage || 0;
        
        // --- 1. CROWN RESTORATION (The new feature!) ---
        const crownIndex = player.inventory.findIndex(i => i.name === 'Shattered Crown');
        if (crownIndex > -1) {
            showDialogue("Historian", `"By the gods... The Shattered Crown! I can restore this."<br><button id="restCrwn" class="mt-2 bg-yellow-600 text-white p-2 rounded w-full">Restore</button>`);
            setTimeout(() => {
                const btn = document.getElementById('restCrwn');
                if(btn) btn.onclick = () => {
                    player.inventory.splice(crownIndex, 1);
                    player.inventory.push({ name: "Crown of the First King", type: "armor", tile: "👑", defense: 2, slot: "armor", statBonuses: { charisma: 10, luck: 5, maxMana: 20 }, description: "Restored to glory." });
                    logMessage("Crown restored!");
                    renderInventory();
                    loreModal.classList.add('hidden');
                };
            }, 0);
            return true;
        }

        // --- 2. Memory Shard Trade ---
        const shardIdx = player.inventory.findIndex(i => i.name === 'Memory Shard');
        if (shardIdx > -1) {
            // (Simplified trade logic for brevity - matches existing script functionality)
            player.inventory[shardIdx].quantity--;
            if(player.inventory[shardIdx].quantity <= 0) player.inventory.splice(shardIdx, 1);
            grantXp(100);
            logMessage("You trade a Memory Shard for knowledge (100 XP).");
            renderInventory();
            return true;
        }

        // --- 3. Main Quest ---
        if (player.relicQuestStage === 0) {
            logMessage("Historian: 'Seek the Sun Shard in the desert.'");
            player.relicQuestStage = 1;
        } else {
            logMessage("Historian: 'Bring me the relics of the Old King.'");
        }
    }

    return true;
});

// --- 5. RESOURCES & OBSTACLES ---
InteractionManager.register('TYPE:obstacle', (player, x, y, data) => {
    const hasTool = player.inventory.some(i => i.name === data.tool);
    
    if (hasTool) {
        logMessage(`You use ${data.tool} to clear the ${data.name}.`);
        
        // Resource Gain
        if (data.name === 'Thicket') {
            InteractionManager._handleItemPickup(player, x, y, 'WOOD', {name: 'Wood Log', type: 'junk'});
        } else if (data.tool === 'Pickaxe') {
            InteractionManager._handleItemPickup(player, x, y, 'STONE', {name: 'Stone', type: 'junk'});
        }

        // Secret in Wall?
        if (data.tile === '🏚' && Math.random() < 0.25) {
            logMessage("You found something hidden in the wall!");
            InteractionManager._handleItemPickup(player, x, y, 'GEM', {name: 'Raw Diamond', type: 'junk'});
        }

        // Clear Tile (Visual)
        let floor = '.';
        if (gameState.mapMode === 'dungeon') floor = CAVE_THEMES[gameState.currentCaveTheme].floor;
        else if (data.tile === '🏚') floor = '^'; // Mountain floor
        
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, floor);
        else chunkManager.caveMaps[gameState.currentCaveId][y][x] = floor;
        
        render();
    } else {
        logMessage(`${data.flavor} (Requires ${data.tool})`);
    }
    return true;
});

// --- 6. MAP TRANSITIONS (Entrances) ---
InteractionManager.register(['🏰', '⛰', 'V', 'Ω', '🕳️', '♛'], (player, x, y, data) => {
    if (data.tile === 'Ω') {
        // Void Rift Check
        if (player.inventory.some(i => i.name === 'Void Key')) {
            // (Teleport logic handled by Key Item Usage usually, but can be here too)
            logMessage("Use the Void Key to enter.");
        } else {
            logMessage("The Rift is unstable. You need a Void Key.");
        }
        return true;
    }

    // Generic Entrance Logic
    const isDungeon = (data.type === 'dungeon_entrance' || data.type === 'landmark_cave');
    const isCastle = (data.type === 'castle_entrance' || data.type === 'village_entrance' || data.type === 'landmark_castle');

    if (isDungeon || isCastle) {
        // 1. Determine ID
        let mapId;
        if (data.getCaveId) mapId = data.getCaveId(x, y);
        else if (data.getCastleId) mapId = data.getCastleId(x, y);
        else if (data.getVillageId) mapId = data.getVillageId(x, y);

        // 2. Set State
        gameState.mapMode = isDungeon ? 'dungeon' : 'castle';
        if (isDungeon) gameState.currentCaveId = mapId;
        else gameState.currentCastleId = mapId;
        
        gameState.overworldExit = { x: player.x, y: player.y }; // Save exit

        // 3. Generate
        let spawnX = 1, spawnY = 1;
        
        if (isDungeon) {
            const theme = chunkManager.caveThemes[mapId] || (data.tile === '🕳️' ? 'ABYSS' : null);
            // Force generate
            const map = chunkManager.generateCave(mapId); 
            // Find entrance
            for (let ry = 0; ry < map.length; ry++) {
                if (map[ry].includes('>')) { spawnX = map[ry].indexOf('>'); spawnY = ry; break; }
            }
            gameState.currentCaveTheme = chunkManager.caveThemes[mapId];
            gameState.instancedEnemies = JSON.parse(JSON.stringify(chunkManager.caveEnemies[mapId] || []));
        } else {
            // Castle/Village
            const layout = (data.tile === 'V') ? 'SAFE_HAVEN' : (data.tile === '♛' ? 'GRAND_FORTRESS' : null);
            chunkManager.generateCastle(mapId, layout);
            const spawn = chunkManager.castleSpawnPoints[mapId];
            spawnX = spawn.x; spawnY = spawn.y;
            gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[mapId] || []));
            gameState.instancedEnemies = []; // Usually safe inside villages/castles unless triggered
        }

        // 4. Transport
        player.x = spawnX;
        player.y = spawnY;
        logMessage(`You enter ${data.name || 'the area'}.`);
        
        // 5. Render
        updateRegionDisplay();
        gameState.mapDirty = true;
        render();
        syncPlayerState();
    }
    return true;
});

// --- 7. EXITS ---
InteractionManager.register(['>', 'X', '🔼'], (player, x, y, data) => {
    exitToOverworld("You emerge back into the world.");
    return true;
});

// --- 8. PUZZLES & SPECIALS ---
InteractionManager.register(['#', '?', 'c', '⛲', '🌵'], (player, x, y, data) => {
    // Waystone
    if (data.tile === '#') {
        if (!player.unlockedWaypoints) player.unlockedWaypoints = [];
        const existing = player.unlockedWaypoints.find(wp => wp.x === x && wp.y === y);
        if (!existing) {
            player.unlockedWaypoints.push({ x: x, y: y, name: getRegionName(Math.floor(x/160), Math.floor(y/160)) });
            logMessage("Waystone Attuned!");
            grantXp(25);
        }
        openFastTravelModal();
    }
    // Riddle Statue
    else if (data.tile === '?') {
        const tileId = `${x},${-y}`;
        if (gameState.lootedTiles.has(tileId)) {
            logMessage("The statue is silent.");
        } else {
            // (Riddle modal logic matches script.js)
            loreTitle.textContent = "Sphinx";
            loreContent.textContent = "Answer my riddle...";
            document.getElementById('riddleContainer').classList.remove('hidden');
            loreModal.classList.remove('hidden');
        }
    }
    // Canoe
    else if (data.tile === 'c') {
        player.isBoating = true;
        logMessage("You push the canoe into the water.");
        chunkManager.setWorldTile(x, y, '.'); // Remove canoe item
        playerRef.update({ isBoating: true });
    }
    // Well
    else if (data.tile === '⛲') {
        if (player.coins >= 50) {
            player.coins -= 50;
            player.health = player.maxHealth;
            logMessage("You toss a coin. You feel refreshed! (Full Heal)");
            renderStats();
        } else {
            logMessage("A wishing well. Requires 50g.");
        }
    }
    // Cactus
    else if (data.tile === '🌵') {
        logMessage("Ouch! You grab a fruit but take damage.");
        player.health -= 1;
        InteractionManager._handleItemPickup(player, x, y, 'FRUIT', {name: 'Cactus Fruit', type: 'consumable'});
        chunkManager.setWorldTile(x, y, 'D'); // Replace with sand
        renderStats();
    }

    return true;
});
