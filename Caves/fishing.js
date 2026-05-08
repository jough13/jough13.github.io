// ==========================================
// THE ULTIMATE FISHING EXPANSION (MASTERPIECE++)
// ==========================================

// --- 1. DYNAMIC ITEM INJECTION ---
const NEW_FISHING_ITEMS = {
    // --- Tools & Utility ---
    '📖fsh': { 
        name: "Angler's Logbook", type: 'consumable', tile: '📖', 
        description: "Records your fishing prowess and personal bests. Use to read.",
        effect: (state) => {
            const player = state.player;
            const lvl = player.fishingLevel || 1;
            const xp = player.fishingXp || 0;
            const nextXp = lvl * 50;
            const records = player.fishingRecords || {};
            
            // Build the Mastery Perks list
            let perksHtml = '';
            if (lvl >= 5) perksHtml += '<p class="text-xs text-green-400 font-bold mt-1">⭐ Master Angler (Trash fish ignored)</p>';
            if (lvl >= 10) perksHtml += '<p class="text-xs text-blue-400 font-bold mt-1">🌟 Deep Sea Master (Double Legendary Rate)</p>';
            if (lvl >= 15) perksHtml += '<p class="text-xs text-purple-400 font-bold mt-1">👑 Leviathan\'s Bane (No stamina loss on struggles, half damage from sea monsters)</p>';
            if (perksHtml === '') perksHtml = '<p class="text-xs text-gray-500 italic mt-1">Keep fishing to unlock Mastery Perks.</p>';

            // Build the "Fish-dex" Grid
            const allFish = [
                'Minnow', 'River Trout', 'Leaping Salmon', 'Golden Koi',
                'Mudcat', 'Sludge Eel', 'Eyeless Cave Fish', 'Swamp Serpent Scale',
                'Deep Sea Cod', 'Silver Tuna', 'Swordfish', 'Abyssal Angler',
                'Magma Carp', 'Obsidian Eel', 'Heart of the Volcano'
            ];
            
            const caughtCount = allFish.filter(f => records[f]).length;
            const completionPercent = Math.floor((caughtCount / allFish.length) * 100);

            let gridHtml = `<div class="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">`;
            
            allFish.forEach(fishName => {
                const record = records[fishName];
                if (record) {
                    let color = "text-gray-300";
                    if (record >= 50) color = "text-blue-300";
                    if (record >= 100) color = "text-purple-400 font-bold";
                    if (record >= 200) color = "text-yellow-400 font-bold";
                    gridHtml += `<div class="bg-gray-800 bg-opacity-50 p-2 rounded border border-green-600 border-opacity-30">
                        <div class="text-xs font-bold text-green-400">${fishName}</div>
                        <div class="text-[10px] ${color}">Best: ${record} lbs</div>
                    </div>`;
                } else {
                    gridHtml += `<div class="bg-gray-900 bg-opacity-50 p-2 rounded border border-gray-700 border-opacity-50">
                        <div class="text-xs font-bold text-gray-500">???</div>
                        <div class="text-[10px] text-gray-600">Undiscovered</div>
                    </div>`;
                }
            });
            gridHtml += `</div>`;

            let html = `
            <div class="mb-4">
                <p class="text-lg font-bold text-blue-400">Fishing Level: ${lvl}</p>
                <p class="text-sm text-gray-400">XP: ${xp} / ${nextXp}</p>
                ${perksHtml}
            </div>
            <h3 class="font-bold border-b border-gray-600 mb-2 flex justify-between">
                <span>Fish Directory</span>
                <span class="text-yellow-500">${completionPercent}% Complete</span>
            </h3>
            ${gridHtml}`;
            
            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');
            
            if (loreTitle && loreContent && loreModal) {
                loreTitle.textContent = "Angler's Logbook";
                loreContent.innerHTML = html;
                loreModal.classList.remove('hidden');
            }
            return false; // Don't consume the book!
        }
    },
    '🎣o': {
        name: 'Obsidian Fishing Rod', type: 'tool', tile: '🎣',
        description: "Woven from fire-proof silk and dark glass. Required for Lava Fishing."
    },

    // --- Shallow & Swamp Fish ---
    '🐟min': { name: 'Minnow', type: 'consumable', tile: '🐟', description: "A tiny fish. Good for a snack, but better as live bait! {yellow:+5 Hunger}", effect: (s) => eatFish(s, 5) },
    '🐟trp': { name: 'River Trout', type: 'consumable', tile: '🐟', description: "A decent sized river fish. {yellow:+15 Hunger}", effect: (s) => eatFish(s, 15) },
    '🐟slm': { name: 'Leaping Salmon', type: 'consumable', tile: '🐟', description: "Fights hard. {yellow:+20 Hunger}, {green:+2 HP}", effect: (s) => eatFish(s, 20, 2) },
    '🐟koi': { name: 'Golden Koi', type: 'junk', tile: '🐟', description: "Its scales are pure gold! Merchants will pay dearly for this." }, 
    '🐟mud': { name: 'Mudcat', type: 'consumable', tile: '🐟', description: "Tastes like dirt. {yellow:+10 Hunger}", effect: (s) => eatFish(s, 10) },
    '🐟eel': { name: 'Sludge Eel', type: 'junk', tile: '🐍', description: "Slimy and writhing. Alchemists might want it." },
    '🐟eye': { name: 'Eyeless Cave Fish', type: 'junk', tile: '🐟', description: "It has adapted to complete darkness." },
    '🐉s':   { name: 'Swamp Serpent Scale', type: 'junk', tile: '🐉', description: "You barely managed to reel this in before the beast snapped your line." },
    
    // --- Deep Sea Fish ---
    '🐟cod': { name: 'Deep Sea Cod', type: 'consumable', tile: '🐟', description: "A massive, meaty fish. {yellow:+30 Hunger}", effect: (s) => eatFish(s, 30) },
    '🐟tna': { name: 'Silver Tuna', type: 'consumable', tile: '🐟', description: "Swift and valuable. {yellow:+40 Hunger}, {green:+5 HP}", effect: (s) => eatFish(s, 40, 5) },
    '🐟swd': { name: 'Swordfish', type: 'weapon', tile: '🗡️', damage: 4, slot: 'weapon', description: "{red:+4 Dmg}. The bill of a massive swordfish. Surprisingly sharp." },
    '🐟ang': { name: 'Abyssal Angler', type: 'tool', tile: '💡', statBonuses: { perception: 2 }, description: "{gold:+2 Per}. Its glowing lure still shines even in death." },
    
    // --- Lava Fish ---
    '🌋crp': { name: 'Magma Carp', type: 'consumable', tile: '🐟', description: "It's already cooked perfectly! {yellow:+35 Hunger}, {green:+10 HP}", effect: (s) => eatFish(s, 35, 10) },
    '🌋eel': { name: 'Obsidian Eel', type: 'weapon', tile: '🐍', damage: 6, slot: 'weapon', inflicts: 'burn', inflictChance: 0.3, description: "{red:+6 Dmg}. A living, whip-like eel that sears flesh. {orange:(Burns target)}" },
    '🌋hrt': { name: 'Heart of the Volcano', type: 'accessory', tile: '❤️', defense: 2, slot: 'armor', statBonuses: { constitution: 5, strength: 3 }, description: "{blue:+2 Def}, {green:+5 Con, +3 Str}. It beats with volcanic fury." },

    // --- Dredged Treasures ---
    '📦w': { 
        name: 'Waterlogged Chest', type: 'consumable', tile: '📦', 
        description: "Covered in seaweed. Use it to pry it open!",
        effect: (state) => {
            const gold = 50 + Math.floor(Math.random() * 100);
            state.player.coins += gold;
            logMessage(`You pry open the chest... Found {gold:${gold} coins}!`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
            
            if (Math.random() < 0.4) {
                const lootTable = ['Black Pearl', 'Rainbow Shell', 'Brass Compass', 'Trident', 'Ancient Coin'];
                const prize = lootTable[Math.floor(Math.random() * lootTable.length)];
                if (state.player.inventory.length < 9) { // MAX_INVENTORY_SLOTS
                    const template = Object.values(window.ITEM_DATA).find(i => i.name === prize);
                    state.player.inventory.push({
                        templateId: Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === prize),
                        name: prize, type: template ? (template.type || 'junk') : 'junk', quantity: 1, 
                        tile: template ? template.tile : '💎', defense: template ? template.defense : null,
                        damage: template ? template.damage : null, slot: template ? template.slot : null,
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
            logMessage("You smash the bottle and unroll the damp parchment...");
            
            // 25% Chance to yield an actual Treasure Map!
            if (Math.random() < 0.25 && state.player.inventory.length < 9) {
                logMessage(`{gold:It's a Tattered Map! X marks the spot!}`);
                const mapTemplate = Object.values(window.ITEM_DATA).find(i => i.name === 'Tattered Map');
                state.player.inventory.push({
                    name: 'Tattered Map', type: 'treasure_map', quantity: 1, tile: '🗺️',
                    effect: mapTemplate ? mapTemplate.effect : null
                });
            } else {
                const loreFragments = [
                    "...to whoever finds this... the treasure lies deep beneath the eastern waves...",
                    "...the Leviathan is real. It took the Captain. It took the mast...",
                    "...if you reach the Safe Haven, tell Elara I won't be coming home...",
                    "...the sirens sing not of love, but of the void below...",
                    "...the magma carps only bite when the mountain rumbles..."
                ];
                const msg = loreFragments[Math.floor(Math.random() * loreFragments.length)];
                logMessage(`{gray:"${msg}"}`);
            }
            
            logMessage("{blue:You gain 50 Exploration XP!}");
            if (typeof grantXp === 'function') grantXp(50);
            return true; // Consumes the bottle
        }
    }
};

// Inject items
Object.assign(window.ITEM_DATA, NEW_FISHING_ITEMS);

// Inject to Shop
if (window.CASTLE_SHOP_INVENTORY) {
    window.CASTLE_SHOP_INVENTORY.push(
        { name: 'Angler\'s Logbook', price: 20, stock: 1 },
        { name: 'Obsidian Fishing Rod', price: 500, stock: 1 },
        { name: 'Minnow', price: 2, stock: 0 }, { name: 'River Trout', price: 6, stock: 0 },
        { name: 'Leaping Salmon', price: 25, stock: 0 }, { name: 'Golden Koi', price: 150, stock: 0 },
        { name: 'Mudcat', price: 3, stock: 0 }, { name: 'Sludge Eel', price: 15, stock: 0 },
        { name: 'Eyeless Cave Fish', price: 40, stock: 0 }, { name: 'Swamp Serpent Scale', price: 200, stock: 0 },
        { name: 'Deep Sea Cod', price: 10, stock: 0 }, { name: 'Silver Tuna', price: 50, stock: 0 },
        { name: 'Magma Carp', price: 60, stock: 0 },
        { name: 'Waterlogged Chest', price: 75, stock: 0 }, { name: 'Message in a Bottle', price: 15, stock: 0 }
    );
}

function eatFish(state, hungerAmt, hpAmt = 0) {
    if (state.player.hunger >= state.player.maxHunger && state.player.health >= state.player.maxHealth) {
        logMessage("You are completely full.");
        return false;
    }
    state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + hungerAmt);
    if (hpAmt > 0) state.player.health = Math.min(state.player.maxHealth, state.player.health + hpAmt);
    
    logMessage(`You eat the fish. {yellow:(+${hungerAmt} Hunger)}${hpAmt > 0 ? `, {green:(+${hpAmt} HP)}` : ''}`);
    triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
    if (hpAmt > 0) triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
    return true;
}

// --- 2. THE LOOT TABLES ---
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
    },
    lava: {
        trash: [{ name: 'Stone' }, { name: 'Iron Ore' }, { name: 'Bone Shard' }],
        common: [{ name: 'Magma Carp', minW: 5, maxW: 20 }],
        uncommon: [{ name: 'Obsidian Shard' }, { name: 'Magma Carp', minW: 20, maxW: 50 }],
        rare: [{ name: 'Obsidian Eel', minW: 10, maxW: 30 }],
        legendary: [{ name: 'Heart of the Volcano' }, { name: 'Obsidian Edge' }] 
    }
};

// --- 3. MAIN FISHING EXECUTION ---
function executeFishing() {
    const player = gameState.player;
    const currentTile = chunkManager.getTile(player.x, player.y);

    const hasObsidianRod = player.inventory.some(i => i.name === 'Obsidian Fishing Rod' && !i.isEquipped);
    const isLava = (currentTile === '~' && gameState.mapMode === 'dungeon' && gameState.currentCaveTheme === 'FIRE');
    
    if (currentTile !== '~' && currentTile !== '≈') {
        logMessage("You need to be standing in water or sailing to fish.");
        return false;
    }

    if (isLava && !hasObsidianRod) {
        logMessage("{red:You cast your line into the lava... and it instantly incinerates!}");
        logMessage("You need an Obsidian Fishing Rod to fish here.");
        return false;
    }

    if (player.stamina < 2) {
        logMessage("You are too tired to cast your line.");
        return false;
    }
    
    player.stamina -= 2;
    triggerStatFlash(document.getElementById('staminaDisplay'), false);

    if (typeof player.fishingLevel === 'undefined') player.fishingLevel = 1;
    if (typeof player.fishingXp === 'undefined') player.fishingXp = 0;
    if (typeof player.fishingRecords === 'undefined') player.fishingRecords = {}; 

    // --- CAPSTONE PERK CHECKS ---
    const isMasterAngler = player.fishingLevel >= 5;
    const isDeepSeaMaster = player.fishingLevel >= 10;
    const isLeviathansBane = player.fishingLevel >= 15;

    // --- DETERMINE BIOME ---
    let zone = 'shallow';
    if (currentTile === '≈') zone = 'swamp';
    if (player.isSailing) zone = 'deep';
    if (isLava) zone = 'lava';

    // --- ADVANCED BAIT SYSTEM ---
    let usedBaitName = null;
    let baitCatchBoost = 0;
    let baitRareBoost = 0;

    const validBaits = [
        { name: 'Kraken Ink Sac', catchBoost: 0.10, rareBoost: 0.50, zoneOnly: 'deep' }, 
        { name: 'Fire Elemental Core', catchBoost: 0.10, rareBoost: 0.50, zoneOnly: 'lava' }, 
        { name: 'Minnow', catchBoost: 0.15, rareBoost: 0.30 }, 
        { name: 'Raw Meat', catchBoost: 0.25, rareBoost: 0.10 }, 
        { name: 'Bird Egg', catchBoost: 0.10, rareBoost: 0.05 } 
    ];

    for (let b of validBaits) {
        if (b.zoneOnly && b.zoneOnly !== zone) continue;
        const idx = player.inventory.findIndex(i => i.name === b.name && !i.isEquipped);
        if (idx > -1) {
            usedBaitName = b.name;
            baitCatchBoost = b.catchBoost;
            baitRareBoost = b.rareBoost;
            player.inventory[idx].quantity--;
            if (player.inventory[idx].quantity <= 0) player.inventory.splice(idx, 1);
            break; 
        }
    }

    // --- SYNERGIES: FEEDING FRENZY & NIGHT FISHING ---
    const hour = gameState.time.hour;
    const isNight = hour >= 20 || hour <= 5;
    const isFrenzy = (hour >= 5 && hour <= 7) || (hour >= 18 && hour <= 20); // Dawn and Dusk

    // --- DANGEROUS WATERS (Hostile Hooks!) ---
    if (zone === 'deep' && Math.random() < 0.05) {
        logMessage("{red:You hooked something massive... IT'S PULLING YOU IN!}");
        const dmg = isLeviathansBane ? 5 : 10;
        logMessage(`A Kraken Tentacle breaches the surface and whips your ship! (-${dmg} HP)`);
        if (isLeviathansBane) logMessage("{purple:Leviathan's Bane reduces the damage!}");
        
        player.health -= dmg;
        gameState.screenShake = 15;
        triggerStatFlash(document.getElementById('healthDisplay'), false);
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#ef4444', 10);
        if (player.health <= 0) if (typeof handlePlayerDeath === 'function') handlePlayerDeath();
        return true; 
    }

    if (zone === 'swamp' && Math.random() < 0.05) {
        logMessage("{red:You hooked something aggressive... A Giant Leech bursts from the water!}");
        if (gameState.mapMode === 'overworld') {
            const enemyId = `overworld:${player.x},${-player.y}`;
            const enemyData = window.ENEMY_DATA['l'];
            const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, player.x, player.y) : enemyData;
            gameState.sharedEnemies[enemyId] = { ...scaledStats, tile: 'l', x: player.x, y: player.y, spawnTime: Date.now() };
            
            if (typeof EnemyNetworkManager !== 'undefined') {
                rtdb.ref(EnemyNetworkManager.getPath(player.x, player.y, enemyId)).set(gameState.sharedEnemies[enemyId]);
            }
        }
        if (typeof render === 'function') render();
        return true; 
    }

    // --- CALCULATE SUCCESS CHANCE ---
    let catchChance = 0.30 + (player.fishingLevel * 0.05) + (player.dexterity * 0.02) + (player.luck * 0.02);
    
    if (zone === 'deep') catchChance += 0.20; 
    if (zone === 'lava') catchChance -= 0.10; 
    if (gameState.weather === 'rain' || gameState.weather === 'storm') catchChance += 0.15; 
    if (isFrenzy) catchChance += 0.25; // Massive frenzy boost
    catchChance += baitCatchBoost; 

    let flavorText = "You cast your line...";
    if (zone === 'deep') flavorText = "You drop your heavy line into the abyss...";
    if (zone === 'lava') flavorText = "You cast your obsidian line into the bubbling magma...";
    
    if (usedBaitName) flavorText += ` (Used ${usedBaitName} as bait)`;
    if (isNight) flavorText += " The darkness is absolute.";
    if (isFrenzy) logMessage("{blue:The water is boiling with activity! (Feeding Frenzy)}");
    logMessage(`{gray:${flavorText}}`);

    // --- ROLL FOR CATCH ---
    if (Math.random() < catchChance) {
        
        // --- ROLL FOR RARITY ---
        const roll = Math.random();
        let rarity = 'common';
        let xpGained = 5;
        
        const nightBoost = isNight ? 0.20 : 0; 
        const frenzyBoost = isFrenzy ? 0.15 : 0;
        const luckBoost = player.luck * 0.01;
        const lvlBoost = isDeepSeaMaster ? (player.fishingLevel * 0.04) : (player.fishingLevel * 0.02);
        
        const totalRareChance = roll + baitRareBoost + nightBoost + frenzyBoost + luckBoost + lvlBoost;

        if (totalRareChance > 0.98) { rarity = 'legendary'; xpGained = 150; }
        else if (totalRareChance > 0.85) { rarity = 'rare'; xpGained = 50; }
        else if (totalRareChance > 0.60) { rarity = 'uncommon'; xpGained = 20; }
        else if (totalRareChance < 0.10) { rarity = 'trash'; xpGained = 1; }

        if (isMasterAngler && rarity === 'trash') {
            rarity = 'common';
            logMessage("{blue:Your Master Angler expertise saves you from hooking trash.}");
        }

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

            // The Line-Snap Stamina Battle!
            if (weight > 100) {
                logMessage(`{orange:It's a monster! It fights the line!}`);
                if (isLeviathansBane) {
                    logMessage("{purple:Leviathan's Bane: You effortlessly tire out the beast!}");
                } else {
                    logMessage("{orange:(-4 Stamina)}");
                    if (player.stamina < 4) {
                        logMessage(`{red:You are too exhausted to reel it in... The line snaps!}`);
                        player.stamina = 0;
                        triggerStatFlash(document.getElementById('staminaDisplay'), false);
                        return true; 
                    } else {
                        player.stamina -= 4;
                        triggerStatFlash(document.getElementById('staminaDisplay'), false);
                    }
                }
            }

            const currentRecord = player.fishingRecords[baseName] || 0;
            if (weight > currentRecord) {
                player.fishingRecords[baseName] = weight;
                logMessage(`{gold:🏆 NEW RECORD! You caught a ${weight}lb ${baseName}!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y); 
                xpGained += 25; 
            }
        }

        const template = window.ITEM_DATA[Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === baseName)];
        const catchTile = template ? (template.tile || '🐟') : '🐟';

        // --- VISUAL CATCH JUICE ---
        if (typeof ParticleSystem !== 'undefined') {
            // Launch the emoji into the air!
            ParticleSystem.spawn(player.x, player.y - 1, '#ffffff', 'text', catchTile, 16);
        }

        if (rarity === 'legendary') logMessage(`{gold:A MASSIVE TUG! You hauled up a ${finalItemName}!}`);
        else if (rarity === 'rare') logMessage(`{purple:A strong bite! You caught a ${finalItemName}!}`);
        else if (rarity === 'trash') logMessage(`{gray:You reeled in some trash... a ${finalItemName}.}`);
        else if (!isTrophy) logMessage(`You caught a ${finalItemName}!`);

        if (player.inventory.length < 9) { 
            
            const existingStack = player.inventory.find(i => i.name === finalItemName && !i.isEquipped);
            const isStackable = template && ['junk', 'consumable'].includes(template.type) && !isTrophy;

            if (existingStack && isStackable) {
                existingStack.quantity++;
            } else {
                player.inventory.push({
                    templateId: Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === baseName),
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

    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update({
            stamina: player.stamina,
            health: player.health,
            fishingLevel: player.fishingLevel,
            fishingXp: player.fishingXp,
            fishingRecords: player.fishingRecords,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
        });
    }

    if (typeof renderInventory === 'function') renderInventory();
    return true; 
}
