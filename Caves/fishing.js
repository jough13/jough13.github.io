// ==========================================
// EXPANDED FISHING SYSTEM & PROFESSION
// ==========================================

// --- 1. DYNAMIC ITEM INJECTION ---
// We inject these directly into the main game's ITEM_DATA so they function flawlessly!
const NEW_FISHING_ITEMS = {
    // Fish
    '🐟min': { name: 'Minnow', type: 'consumable', tile: '🐟', description: "A tiny fish. Good for a snack, but better as live bait! {yellow:+5 Hunger}", effect: (s) => eatFish(s, 5) },
    '🐟trp': { name: 'River Trout', type: 'consumable', tile: '🐟', description: "A decent sized river fish. {yellow:+15 Hunger}", effect: (s) => eatFish(s, 15) },
    '🐟slm': { name: 'Leaping Salmon', type: 'consumable', tile: '🐟', description: "Fights hard. {yellow:+20 Hunger}, {green:+2 HP}", effect: (s) => eatFish(s, 20, 2) },
    '🐟koi': { name: 'Golden Koi', type: 'junk', tile: '🐟', description: "Its scales are pure gold! Merchants will pay dearly for this." }, 
    
    '🐟mud': { name: 'Mudcat', type: 'consumable', tile: '🐟', description: "Tastes like dirt. {yellow:+10 Hunger}", effect: (s) => eatFish(s, 10) },
    '🐟eel': { name: 'Sludge Eel', type: 'junk', tile: '🐍', description: "Slimy and writhing. Alchemists might want it." },
    '🐟eye': { name: 'Eyeless Cave Fish', type: 'junk', tile: '🐟', description: "It has adapted to complete darkness." },
    '🐉s':   { name: 'Swamp Serpent Scale', type: 'junk', tile: '🐉', description: "You barely managed to reel this in before the beast snapped your line." },
    
    '🐟cod': { name: 'Deep Sea Cod', type: 'consumable', tile: '🐟', description: "A massive, meaty fish. {yellow:+30 Hunger}", effect: (s) => eatFish(s, 30) },
    '🐟tna': { name: 'Silver Tuna', type: 'consumable', tile: '🐟', description: "Swift and valuable. {yellow:+40 Hunger}, {green:+5 HP}", effect: (s) => eatFish(s, 40, 5) },
    '🐟swd': { name: 'Swordfish', type: 'weapon', tile: '🗡️', damage: 4, slot: 'weapon', description: "{red:+4 Dmg}. The bill of a massive swordfish. Surprisingly sharp." },
    '🐟ang': { name: 'Abyssal Angler', type: 'tool', tile: '💡', statBonuses: { perception: 2 }, description: "{gold:+2 Per}. Its glowing lure still shines even in death." },
    
    // Dredged Treasures
    '📦w': { 
        name: 'Waterlogged Chest', type: 'consumable', tile: '📦', 
        description: "Covered in seaweed. Use it to pry it open!",
        effect: (state) => {
            const gold = 50 + Math.floor(Math.random() * 100);
            state.player.coins += gold;
            logMessage(`You pry open the chest... Found {gold:${gold} coins}!`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
            
            // 40% chance for a bonus item/artifact
            if (Math.random() < 0.4) {
                const lootTable = ['Black Pearl', 'Rainbow Shell', 'Brass Compass', 'Trident', 'Ancient Coin'];
                const prize = lootTable[Math.floor(Math.random() * lootTable.length)];
                if (state.player.inventory.length < 9) { // MAX_INVENTORY_SLOTS
                    const template = Object.values(window.ITEM_DATA).find(i => i.name === prize);
                    state.player.inventory.push({
                        templateId: Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === prize),
                        name: prize, 
                        type: template ? (template.type || 'junk') : 'junk', 
                        quantity: 1, 
                        tile: template ? template.tile : '💎',
                        defense: template ? template.defense : null,
                        damage: template ? template.damage : null,
                        slot: template ? template.slot : null,
                        statBonuses: template ? template.statBonuses : null,
                    });
                    logMessage(`{purple:You also found a ${prize} hidden inside!}`);
                }
            }
            triggerStatFlash(document.getElementById('coinsDisplay'), true);
            return true; // Consumes the chest
        }
    },
    '🍾': {
        name: 'Message in a Bottle', type: 'consumable', tile: '🍾',
        description: "There's a rolled up piece of parchment inside.",
        effect: (state) => {
            const loreFragments = [
                "...to whoever finds this... the treasure lies deep beneath the eastern waves...",
                "...the Leviathan is real. It took the Captain. It took the mast...",
                "...if you reach the Safe Haven, tell Elara I won't be coming home...",
                "...the sirens sing not of love, but of the void below..."
            ];
            const msg = loreFragments[Math.floor(Math.random() * loreFragments.length)];
            logMessage("You smash the bottle and read the note...");
            logMessage(`{gray:"${msg}"}`);
            logMessage("{blue:You gain 50 Exploration XP!}");
            if (typeof grantXp === 'function') grantXp(50);
            return true; // Consumes the bottle
        }
    }
};

// Inject them into the main game database
Object.assign(window.ITEM_DATA, NEW_FISHING_ITEMS);

// Add them to Castle Shop so they have base prices for selling
if (window.CASTLE_SHOP_INVENTORY) {
    window.CASTLE_SHOP_INVENTORY.push(
        { name: 'Minnow', price: 2, stock: 0 }, { name: 'River Trout', price: 6, stock: 0 },
        { name: 'Leaping Salmon', price: 25, stock: 0 }, { name: 'Golden Koi', price: 150, stock: 0 },
        { name: 'Mudcat', price: 3, stock: 0 }, { name: 'Sludge Eel', price: 15, stock: 0 },
        { name: 'Eyeless Cave Fish', price: 40, stock: 0 }, { name: 'Swamp Serpent Scale', price: 200, stock: 0 },
        { name: 'Deep Sea Cod', price: 10, stock: 0 }, { name: 'Silver Tuna', price: 50, stock: 0 },
        { name: 'Waterlogged Chest', price: 75, stock: 0 }, { name: 'Message in a Bottle', price: 15, stock: 0 }
    );
}

// Helper to handle eating fish dynamically
function eatFish(state, hungerAmt, hpAmt = 0) {
    if (state.player.hunger >= state.player.maxHunger && state.player.health >= state.player.maxHealth) {
        logMessage("You are completely full.");
        return false;
    }
    state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + hungerAmt);
    if (hpAmt > 0) state.player.health = Math.min(state.player.maxHealth, state.player.health + hpAmt);
    
    logMessage(`You eat the raw fish. {yellow:(+${hungerAmt} Hunger)}${hpAmt > 0 ? `, {green:(+${hpAmt} HP)}` : ''}`);
    triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
    if (hpAmt > 0) triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
    return true;
}

// --- 2. THE LOOT TABLES (With Trophy Weights) ---
const FISHING_LOOT = {
    shallow: {
        trash: [{ name: 'Soggy Boot' }, { name: 'Wood Log' }, { name: 'Bone Shard' }],
        common: [{ name: 'Minnow' }, { name: 'Raw Fish' }],
        uncommon: [{ name: 'River Trout', minW: 2, maxW: 10 }, { name: 'Raw Fish' }],
        rare: [{ name: 'Leaping Salmon', minW: 12, maxW: 35 }, { name: 'Message in a Bottle' }],
        legendary: [{ name: 'Golden Koi', minW: 10, maxW: 40 }, { name: 'Ring of Regeneration' }]
    },
    swamp: {
        trash: [{ name: 'Soggy Boot' }, { name: 'Stick' }, { name: 'Dirty Water' }],
        common: [{ name: 'Mudcat' }, { name: 'Raw Fish' }],
        uncommon: [{ name: 'Sludge Eel', minW: 5, maxW: 25 }, { name: 'Mudcat' }],
        rare: [{ name: 'Eyeless Cave Fish', minW: 2, maxW: 8 }, { name: 'Poisoned Dagger' }],
        legendary: [{ name: 'Swamp Serpent Scale' }, { name: 'Waterlogged Chest' }]
    },
    deep: {
        trash: [{ name: 'Rusted Anchor' }, { name: 'Soggy Boot' }, { name: 'Wood Log' }],
        common: [{ name: 'Deep Sea Cod', minW: 10, maxW: 50 }, { name: 'Raw Fish' }],
        uncommon: [{ name: 'Silver Tuna', minW: 40, maxW: 150 }, { name: 'Deep Sea Cod', minW: 30, maxW: 80 }],
        rare: [{ name: 'Swordfish' }, { name: 'Waterlogged Chest' }, { name: 'Message in a Bottle' }],
        legendary: [{ name: 'Abyssal Angler', minW: 60, maxW: 200 }, { name: 'Scepter of the Tides' }]
    }
};

// --- 3. MAIN FISHING EXECUTION ---
function executeFishing() {
    const player = gameState.player;
    const currentTile = chunkManager.getTile(player.x, player.y);

    if (currentTile !== '~' && currentTile !== '≈') {
        logMessage("You need to be standing in water or sailing to fish.");
        return false;
    }

    if (player.stamina < 2) {
        logMessage("You are too tired to cast your line.");
        return false;
    }
    
    // Deduct stamina
    player.stamina -= 2;
    triggerStatFlash(document.getElementById('staminaDisplay'), false);

    // Initialize Fishing Stats if they don't exist
    if (typeof player.fishingLevel === 'undefined') player.fishingLevel = 1;
    if (typeof player.fishingXp === 'undefined') player.fishingXp = 0;
    if (typeof player.fishingRecords === 'undefined') player.fishingRecords = {}; 

    // --- DETERMINE BIOME ---
    let zone = 'shallow';
    if (currentTile === '≈') zone = 'swamp';
    if (player.isSailing) zone = 'deep';

    // --- ADVANCED BAIT SYSTEM ---
    let usedBaitName = null;
    let baitCatchBoost = 0;
    let baitRareBoost = 0;

    // Define baits (Order matters! The game checks for the best bait first)
    const validBaits = [
        { name: 'Minnow', catchBoost: 0.10, rareBoost: 0.30 }, // Live bait! Huge rare boost
        { name: 'Raw Meat', catchBoost: 0.25, rareBoost: 0.10 }, // Heavy scent, huge catch boost
        { name: 'Bird Egg', catchBoost: 0.15, rareBoost: 0.05 }  // Basic bait
    ];

    for (let b of validBaits) {
        const idx = player.inventory.findIndex(i => i.name === b.name && !i.isEquipped);
        if (idx > -1) {
            usedBaitName = b.name;
            baitCatchBoost = b.catchBoost;
            baitRareBoost = b.rareBoost;
            // Consume the bait
            player.inventory[idx].quantity--;
            if (player.inventory[idx].quantity <= 0) player.inventory.splice(idx, 1);
            break; 
        }
    }

    // --- NIGHT FISHING SYNERGY ---
    const hour = gameState.time.hour;
    const isNight = hour >= 20 || hour <= 5;

    // --- DANGEROUS WATERS (Enemy Hooking!) ---
    if (zone === 'deep' && Math.random() < 0.05) {
        logMessage("{red:You hooked something massive... IT'S PULLING YOU IN!}");
        logMessage("A Kraken Tentacle breaches the surface and whips your ship! (-10 HP)");
        player.health -= 10;
        gameState.screenShake = 15;
        triggerStatFlash(document.getElementById('healthDisplay'), false);
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#ef4444', 10);
        
        if (player.health <= 0) if (typeof handlePlayerDeath === 'function') handlePlayerDeath();
        return true; 
    }

    if (zone === 'swamp' && Math.random() < 0.05) {
        logMessage("{red:You hooked something aggressive... A Giant Leech bursts from the water!}");
        
        // Spawn it on the player's tile (since swamp water is walkable)
        if (gameState.mapMode === 'overworld') {
            const enemyId = `overworld:${player.x},${-player.y}`;
            const enemyData = ENEMY_DATA['l'];
            const scaledStats = getScaledEnemy(enemyData, player.x, player.y);
            gameState.sharedEnemies[enemyId] = { ...scaledStats, tile: 'l', x: player.x, y: player.y, spawnTime: Date.now() };
            
            if (typeof EnemyNetworkManager !== 'undefined') {
                rtdb.ref(EnemyNetworkManager.getPath(player.x, player.y, enemyId)).set(gameState.sharedEnemies[enemyId]);
            }
        }
        if (typeof render === 'function') render();
        return true; 
    }

    // --- CALCULATE SUCCESS CHANCE ---
    // Base 30% + 5% per Fishing Level + Dex/Luck bonuses
    let catchChance = 0.30 + (player.fishingLevel * 0.05) + (player.dexterity * 0.02) + (player.luck * 0.02);
    
    if (zone === 'deep') catchChance += 0.20; // Oceans have more fish
    if (gameState.weather === 'rain' || gameState.weather === 'storm') catchChance += 0.15; // Weather bonus
    catchChance += baitCatchBoost; // Apply bait bonus

    let flavorText = zone === 'deep' ? "You drop your heavy line into the abyss..." : "You cast your line...";
    if (usedBaitName) flavorText += ` (Used ${usedBaitName} as bait)`;
    if (isNight) flavorText += " The water is pitch black.";
    logMessage(`{gray:${flavorText}}`);

    // --- ROLL FOR CATCH ---
    if (Math.random() < catchChance) {
        
        // --- ROLL FOR RARITY ---
        const roll = Math.random();
        let rarity = 'common';
        let xpGained = 5;
        
        const nightBoost = isNight ? 0.20 : 0; // Huge boost at night!
        const luckBoost = player.luck * 0.01;
        
        // Level 10 Perk: Double Legendary Chance
        const lvlBoost = (player.fishingLevel >= 10) ? (player.fishingLevel * 0.04) : (player.fishingLevel * 0.02);
        
        const totalRareChance = roll + baitRareBoost + nightBoost + luckBoost + lvlBoost;

        if (totalRareChance > 0.98) { rarity = 'legendary'; xpGained = 100; }
        else if (totalRareChance > 0.85) { rarity = 'rare'; xpGained = 35; }
        else if (totalRareChance > 0.60) { rarity = 'uncommon'; xpGained = 15; }
        else if (totalRareChance < 0.10) { rarity = 'trash'; xpGained = 1; }

        // Level 5 Perk: Master Angler (No more trash!)
        if (player.fishingLevel >= 5 && rarity === 'trash') {
            rarity = 'common';
            logMessage("{blue:Your angling expertise saves you from hooking trash.}");
        }

        // Pick the catch
        const table = FISHING_LOOT[zone][rarity];
        const catchData = table[Math.floor(Math.random() * table.length)];
        const baseName = catchData.name;
        
        let finalItemName = baseName;
        let isTrophy = false;

        // --- TROPHY FISH CALCULATION ---
        if (catchData.minW && catchData.maxW) {
            const weight = Math.floor(Math.random() * (catchData.maxW - catchData.minW + 1)) + catchData.minW;
            finalItemName = `[${weight}lb] ${baseName}`;
            isTrophy = true;

            const currentRecord = player.fishingRecords[baseName] || 0;
            if (weight > currentRecord) {
                player.fishingRecords[baseName] = weight;
                logMessage(`{gold:🏆 NEW RECORD! You caught a ${weight}lb ${baseName}!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y); 
                xpGained += 25; 
            }
        }

        const template = ITEM_DATA[Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === baseName)];
        const catchTile = template ? (template.tile || '🐟') : '🐟';

        if (rarity === 'legendary') logMessage(`{gold:A MASSIVE TUG! You hauled up a ${finalItemName}!}`);
        else if (rarity === 'rare') logMessage(`{purple:A strong bite! You caught a ${finalItemName}!}`);
        else if (rarity === 'trash') logMessage(`{gray:You reeled in some trash... a ${finalItemName}.}`);
        else if (!isTrophy) logMessage(`You caught a ${finalItemName}!`);

        // Add to Inventory
        if (player.inventory.length < 9) { // MAX_INVENTORY_SLOTS
            
            const existingStack = player.inventory.find(i => i.name === finalItemName && !i.isEquipped);
            const isStackable = template && ['junk', 'consumable'].includes(template.type) && !isTrophy;

            if (existingStack && isStackable) {
                existingStack.quantity++;
            } else {
                player.inventory.push({
                    templateId: Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === baseName),
                    name: finalItemName, 
                    type: template ? (template.type || 'junk') : 'junk',
                    quantity: 1,
                    tile: catchTile,
                    defense: template ? template.defense : null,
                    damage: template ? template.damage : null,
                    slot: template ? template.slot : null,
                    statBonuses: template ? template.statBonuses : null,
                    effect: template ? template.effect : null
                });
            }

            // --- FISHING XP PROGRESSION ---
            player.fishingXp += xpGained;
            const xpNeeded = player.fishingLevel * 50;

            if (player.fishingXp >= xpNeeded) {
                player.fishingXp -= xpNeeded;
                player.fishingLevel++;
                logMessage(`{blue:FISHING LEVEL UP! You are now a Level ${player.fishingLevel} Angler.}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            }

        } else {
            logMessage("{red:You caught something, but your pack is full! You throw it back.}");
        }
    } else {
        logMessage("{gray:...not even a nibble.}");
    }

    // Save state
    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update({
            stamina: player.stamina,
            fishingLevel: player.fishingLevel,
            fishingXp: player.fishingXp,
            fishingRecords: player.fishingRecords,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
        });
    }

    if (typeof renderInventory === 'function') renderInventory();
    return true; 
}
