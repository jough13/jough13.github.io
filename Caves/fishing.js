// --- START OF FILE fishing.js ---

// ==============================================
// THE ULTIMATE FISHING EXPANSION (MASTERPIECE++)
// ==============================================

// Item Lookup Cache
// Prevents scanning the massive ITEM_DATA dictionary multiple times per catch
// Attaching to window prevents hot-reload SyntaxErrors!
window._itemKeyCache = window._itemKeyCache || {};

function getItemKeyByName(name) {
    if (window._itemKeyCache[name]) return window._itemKeyCache[name];
    if (typeof window.ITEM_DATA === 'undefined') return null; // Safe fallback
    const key = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === name);
    if (key) window._itemKeyCache[name] = key;
    return key;
}

// Procedural Sound Effects for Fishing
function playSplash() {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.25, 0.05, 400);
}
function playLineSnap() {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playTone(150, 'sawtooth', 0.2, 0.1, false, 50);
}

// Cached DOM elements for eating (Attached to window for hot-reload safety)
window._hungerDisplayObj = window._hungerDisplayObj || null;
window._healthDisplayObj = window._healthDisplayObj || null;

// --- 1. DYNAMIC ITEM INJECTION ---
// Using 'var' prevents block-scoped redeclaration crashes during hot-reloads
var NEW_FISHING_ITEMS = {
    // --- Tools & Utility ---
    '📖fsh': { 
        name: "Angler's Logbook", type: 'consumable', tile: '📖', 
        description: "Records your fishing prowess and personal bests. Use to read.",
        effect: (state) => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

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
                'Magma Carp', 'Obsidian Eel', 'Heart of the Volcano',
                'Astral Jelly', 'Void Ray', 'Star-Eater' // Expanded to include Void Fish
            ];
            
            let caughtCount = 0;
            let totalWeight = 0;

            let gridHtml = `<div class="grid grid-cols-2 gap-2 mt-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">`;
            
            allFish.forEach(fishName => {
                const record = records[fishName];
                if (record) {
                    caughtCount++;
                    totalWeight += record;
                    
                    let color = "text-gray-300";
                    if (record >= 50) color = "text-blue-300";
                    if (record >= 100) color = "text-purple-400 font-bold";
                    if (record >= 200) color = "text-yellow-400 font-bold";
                    
                    gridHtml += `
                    <div class="bg-gray-800 bg-opacity-50 p-2 rounded border border-green-600 border-opacity-30 hover:bg-gray-700 transition-colors">
                        <div class="text-xs font-bold text-green-400">${fishName}</div>
                        <div class="text-[10px] ${color}">Best: ${record} lbs</div>
                    </div>`;
                } else {
                    gridHtml += `
                    <div class="bg-gray-900 bg-opacity-50 p-2 rounded border border-gray-700 border-opacity-50">
                        <div class="text-xs font-bold text-gray-500">???</div>
                        <div class="text-[10px] text-gray-600">Undiscovered</div>
                    </div>`;
                }
            });
            gridHtml += `</div>`;

            const completionPercent = Math.floor((caughtCount / allFish.length) * 100);

            // UI WIN: Cap XP bar visuals if max level (15) is reached
            const isMax = lvl >= 15;
            const xpBarWidth = isMax ? 100 : Math.min(100, (xp/nextXp)*100);
            const xpText = isMax ? `<span class="text-yellow-500 font-bold uppercase tracking-widest">MAXED</span>` : `XP: ${xp} / ${nextXp}`;

            let html = `
            <div class="mb-4 bg-black bg-opacity-20 p-3 rounded-lg border border-gray-700 shadow-inner">
                <p class="text-lg font-bold text-blue-400 flex justify-between"><span>Fishing Level: ${lvl}</span> <span>${caughtCount}/${allFish.length}</span></p>
                <p class="text-xs text-gray-400 mb-2">${xpText}</p>
                <div class="stat-bar-container mb-2"><div class="stat-bar ${isMax ? 'bg-yellow-500' : 'bg-blue-500'}" style="width: ${xpBarWidth}%"></div></div>
                ${perksHtml}
                <div class="mt-2 text-xs text-gray-400 text-right italic">Total Trophy Weight: <span class="text-yellow-500 font-bold">${totalWeight} lbs</span></div>
            </div>
            <h3 class="font-bold border-b border-gray-600 mb-2 flex justify-between text-sm text-yellow-500">
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
    '🎣s': {
        name: 'Steel Fishing Rod', type: 'tool', tile: '🎣',
        description: "A durable rod with a metal spool. Boosts catch rates slightly."
    },
    '🎣o': {
        name: 'Obsidian Fishing Rod', type: 'tool', tile: '🎣',
        description: "Woven from fire-proof silk and dark glass. Required for Lava & Void Fishing."
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
    '🌋hrt': { name: 'Heart of the Volcano', type: 'accessory', tile: '❤️', defense: 2, slot: 'accessory', statBonuses: { constitution: 5, strength: 3 }, description: "{blue:+2 Def}, {green:+5 Con, +3 Str}. It beats with volcanic fury." },

    // --- Void/Astral Fish (NEW) ---
    '🐟str': { name: 'Astral Jelly', type: 'consumable', tile: '🪼', description: "It tastes like blueberries and static electricity. {yellow:+15 Hunger}, {purple:+20 Psyche}", effect: (s) => eatFish(s, 15, 0, 20) },
    '🐟vry': { name: 'Void Ray', type: 'junk', tile: '🦇', description: "A flat, cartilaginous creature that swims through empty space. Highly valuable." },
    '🦈str': { name: 'Star-Eater', type: 'weapon', tile: '🦈', damage: 8, slot: 'weapon', statBonuses: { willpower: 2 }, description: "{red:+8 Dmg}, {purple:+2 Will}. A terrifying maw pulled from the rift." },

    // --- Dredged Treasures & Lore Expansion ---
    '🪖r': { name: 'Rusted Helm', type: 'armor', tile: '🪖', defense: 1, slot: 'armor', description: "{blue:+1 Def}. Pulled from the muck. Still slightly damp." },
    '💀d': { name: 'Drowned Skull', type: 'junk', tile: '💀', description: "Covered in algae. Unsettling." },
    '🦪': { 
        name: 'Abyssal Oyster', type: 'consumable', tile: '🦪', description: "Pry it open...", 
        effect: (state) => {
            logMessage("You pry open the tough shell...");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.1, 0.1, 1000);
            
            if (Math.random() < 0.20) {
                const existingPearl = state.player.inventory.find(i => i.name === 'Black Pearl' && !i.isEquipped);
                if (existingPearl || state.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
                    logMessage("{purple:You found a Black Pearl inside!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, '💎', '#a855f7');
                    
                    if (existingPearl) existingPearl.quantity++;
                    else state.player.inventory.push({ templateId: '💎b', name: 'Black Pearl', type: 'junk', quantity: 1, tile: '💎' });
                } else {
                    logMessage("{red:You found a Black Pearl, but your inventory is full!}");
                }
            } else {
                logMessage("Just some slimy oyster meat. {yellow:(+15 Hunger)}");
                state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 15);
                if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            }
            return true; // Consume Oyster
        }
    },
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
                
                const prizeKey = getItemKeyByName(prize);
                const template = window.ITEM_DATA[prizeKey];
                
                const isStackable = template && ['junk', 'consumable', 'trade'].includes(template.type);
                const existingPrize = state.player.inventory.find(i => i.name === prize && !i.isEquipped);
                
                // ADVANCED LOGIC: If this chest is the LAST item in its stack, it will free up a slot as it gets consumed.
                // We calculate this dynamically so we don't accidentally block the player's reward!
                const chestStack = state.player.inventory.find(i => i.name === 'Waterlogged Chest' && !i.isEquipped);
                const freesSlot = (chestStack && chestStack.quantity === 1) ? 1 : 0;
                
                if (existingPrize && isStackable) {
                    existingPrize.quantity++;
                    logMessage(`{purple:You also found a ${prize} hidden inside!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                } 
                else if (state.player.inventory.length - freesSlot < (window.MAX_INVENTORY_SLOTS || 9)) {
                    state.player.inventory.push({
                        templateId: prizeKey,
                        name: prize, 
                        type: template ? (template.type || 'junk') : 'junk', 
                        quantity: 1, 
                        tile: template ? template.tile : '💎', 
                        defense: template ? template.defense : null,
                        damage: template ? template.damage : null, 
                        slot: template ? template.slot : null,
                        statBonuses: template ? template.statBonuses : null,
                        effect: template ? template.effect : null
                    });
                    logMessage(`{purple:You also found a ${prize} hidden inside!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                } else {
                    logMessage(`{red:You found a ${prize}, but your inventory was full and it washed away!}`);
                }
            }
            if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('coinsDisplay'), true);
            return true; // Consumes the chest
        }
    },
    '🍾': {
        name: 'Message in a Bottle', type: 'consumable', tile: '🍾',
        description: "There's a rolled up piece of parchment inside.",
        effect: (state) => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.1, 0.1, 2000); // Smash sound
            logMessage("You smash the bottle and unroll the damp parchment...");
            
            // 25% Chance to yield an actual Treasure Map!
            if (Math.random() < 0.25) {
                // If this bottle is the LAST item in its stack, it frees up a slot as it gets consumed!
                const bottleStack = state.player.inventory.find(i => i.name === 'Message in a Bottle' && !i.isEquipped);
                const freesSlot = (bottleStack && bottleStack.quantity === 1) ? 1 : 0;
                
                if (state.player.inventory.length - freesSlot < (window.MAX_INVENTORY_SLOTS || 9)) {
                    logMessage(`{gold:It's a Tattered Map! X marks the spot!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    
                    const mapKey = getItemKeyByName('Tattered Map');
                    const mapTemplate = window.ITEM_DATA[mapKey];
                    state.player.inventory.push({
                        templateId: mapKey,
                        name: 'Tattered Map', type: 'treasure_map', quantity: 1, tile: '🗺️',
                        effect: mapTemplate ? mapTemplate.effect : null
                    });
                } else {
                    logMessage(`{red:It's a Tattered Map, but your pack is full! The wind blows it away.}`);
                }
            } else {
                const loreFragments = [
                    "...to whoever finds this... the treasure lies deep beneath the eastern waves...",
                    "...the Leviathan is real. It took the Captain. It took the mast...",
                    "...if you reach the Safe Haven, tell Elara I won't be coming home...",
                    "...the sirens sing not of love, but of the void below...",
                    "...the magma carps only bite when the mountain rumbles...",
                    "...I saw the Old King's face in the water. He was weeping black tears...",
                    "...the Shadowed Hand is searching the coast. I must hide the map...",
                    "...don't trust the fairies in the forest. They stole my best rod...",
                    "...the stars aren't moving. We are falling..."
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

// Inject items safely
if (typeof window.ITEM_DATA !== 'undefined') {
    Object.assign(window.ITEM_DATA, NEW_FISHING_ITEMS);
}

// SAFE INJECTION: Prevent duplicating the logbook if script hot-reloads
if (window.CASTLE_SHOP_INVENTORY && !window.CASTLE_SHOP_INVENTORY.some(i => i.name === 'Angler\'s Logbook')) {
    window.CASTLE_SHOP_INVENTORY.push(
        { name: 'Angler\'s Logbook', price: 20, stock: 1 },
        { name: 'Steel Fishing Rod', price: 150, stock: 1 },
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

// EXPANSION WIN: Support for Psyche restoration from Void Fish
function eatFish(state, hungerAmt, hpAmt = 0, psycheAmt = 0) {
    if (state.player.hunger >= state.player.maxHunger && state.player.health >= state.player.maxHealth && state.player.psyche >= state.player.maxPsyche) {
        logMessage("You are completely full and refreshed.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return false;
    }
    
    // Performance: Cache DOM lookups safely attached to window
    if (!window._hungerDisplayObj) window._hungerDisplayObj = document.getElementById('hungerDisplay');
    if (!window._healthDisplayObj) window._healthDisplayObj = document.getElementById('healthDisplay');
    const _psycheDisplayObj = document.getElementById('psycheDisplay'); 

    state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + hungerAmt);
    if (hpAmt > 0) state.player.health = Math.min(state.player.maxHealth, state.player.health + hpAmt);
    if (psycheAmt > 0) state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + psycheAmt);
    
    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); // Munch sound
    
    let logStr = `You eat the fish. {yellow:(+${hungerAmt} Hunger)}`;
    if (hpAmt > 0) logStr += `, {green:(+${hpAmt} HP)}`;
    if (psycheAmt > 0) logStr += `, {purple:(+${psycheAmt} Psyche)}`;
    logMessage(logStr);
    
    if (typeof triggerStatAnimation !== 'undefined') {
        triggerStatAnimation(window._hungerDisplayObj, 'stat-pulse-green');
        if (hpAmt > 0) triggerStatAnimation(window._healthDisplayObj, 'stat-pulse-green');
        if (psycheAmt > 0 && _psycheDisplayObj) triggerStatAnimation(_psycheDisplayObj, 'stat-pulse-purple');
    }
    return true;
}

// --- 2. THE LOOT TABLES ---
// Use 'var' to prevent redeclaration crashes on hot-reloading
var FISHING_LOOT = {
    shallow: {
        trash: [{ name: 'Soggy Boot' }, { name: 'Wood Log' }, { name: 'Bone Shard' }, { name: 'Rusted Helm' }],
        common: [{ name: 'Minnow' }, { name: 'Raw Fish' }],
        uncommon: [{ name: 'River Trout', minW: 2, maxW: 10 }, { name: 'Raw Fish' }],
        rare: [{ name: 'Leaping Salmon', minW: 12, maxW: 35 }, { name: 'Message in a Bottle' }],
        legendary: [{ name: 'Golden Koi', minW: 10, maxW: 40 }, { name: 'Ring of Regeneration' }]
    },
    swamp: {
        trash: [{ name: 'Soggy Boot' }, { name: 'Stick' }, { name: 'Dirty Water' }, { name: 'Drowned Skull' }],
        common: [{ name: 'Mudcat' }, { name: 'Raw Fish' }],
        uncommon: [{ name: 'Sludge Eel', minW: 5, maxW: 25 }, { name: 'Mudcat' }],
        rare: [{ name: 'Eyeless Cave Fish', minW: 2, maxW: 8 }, { name: 'Poisoned Dagger' }],
        legendary: [{ name: 'Swamp Serpent Scale' }, { name: 'Waterlogged Chest' }]
    },
    deep: {
        trash: [{ name: 'Rusted Anchor' }, { name: 'Soggy Boot' }, { name: 'Wood Log' }],
        common: [{ name: 'Deep Sea Cod', minW: 10, maxW: 50 }, { name: 'Raw Fish' }],
        uncommon: [{ name: 'Silver Tuna', minW: 40, maxW: 150 }, { name: 'Deep Sea Cod', minW: 30, maxW: 80 }],
        rare: [{ name: 'Swordfish' }, { name: 'Waterlogged Chest' }, { name: 'Abyssal Oyster' }],
        legendary: [{ name: 'Abyssal Angler', minW: 60, maxW: 200 }, { name: 'Scepter of the Tides' }]
    },
    lava: {
        trash: [{ name: 'Stone' }, { name: 'Iron Ore' }, { name: 'Bone Shard' }],
        common: [{ name: 'Magma Carp', minW: 5, maxW: 20 }],
        uncommon: [{ name: 'Obsidian Shard' }, { name: 'Magma Carp', minW: 20, maxW: 50 }],
        rare: [{ name: 'Obsidian Eel', minW: 10, maxW: 30 }],
        legendary: [{ name: 'Heart of the Volcano' }, { name: 'Obsidian Edge' }] 
    },
    void: {
        trash: [{ name: 'Void Dust' }, { name: 'Bone Shard' }, { name: 'Memory Shard' }],
        common: [{ name: 'Astral Jelly', minW: 1, maxW: 5 }],
        uncommon: [{ name: 'Astral Jelly', minW: 5, maxW: 15 }, { name: 'Void Dust' }],
        rare: [{ name: 'Void Ray', minW: 20, maxW: 80 }],
        legendary: [{ name: 'Star-Eater', minW: 100, maxW: 500 }, { name: 'Void-Touched Ring' }] 
    }
};

// --- 3. MAIN FISHING EXECUTION ---
function executeFishing() {
    const player = gameState.player;
    
    // Context-aware tile fetching!
    let currentTile;
    if (gameState.mapMode === 'overworld') {
        currentTile = chunkManager.getTile(player.x, player.y);
    } else if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        currentTile = (map && map[player.y] && map[player.y][player.x]) ? map[player.y][player.x] : ' ';
    } else if (gameState.mapMode === 'castle') {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        currentTile = (map && map[player.y] && map[player.y][player.x]) ? map[player.y][player.x] : ' ';
    }

    const hasSteelRod = player.inventory.some(i => i.name === 'Steel Fishing Rod' && !i.isEquipped);
    const hasObsidianRod = player.inventory.some(i => i.name === 'Obsidian Fishing Rod' && !i.isEquipped);
    
    const isLava = currentTile === '🌋' || (currentTile === '~' && gameState.mapMode === 'dungeon' && gameState.currentCaveTheme === 'FIRE');
    
    // You can fish in the void if you are in an alternate dimension or in a corrupted cave
    const isVoid = (gameState.currentRealm !== 0) || (gameState.mapMode === 'dungeon' && ['VOID', 'ABYSS', 'CORRUPTED'].includes(gameState.currentCaveTheme));

    if (currentTile !== '~' && currentTile !== '≈' && currentTile !== '🌋') {
        logMessage("You need to be standing in water, lava, or sailing to fish.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return false;
    }

    if (isLava && !hasObsidianRod) {
        logMessage("{red:You cast your line into the lava... and it instantly incinerates!}");
        logMessage("You need an Obsidian Fishing Rod to fish here.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return false;
    }

    if (isVoid && !hasSteelRod && !hasObsidianRod) {
        logMessage("{red:Your wooden rod instantly rots away in these unnatural waters!}");
        logMessage("You need at least a Steel Fishing Rod here.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return false;
    }

    if (player.stamina < 2) {
        logMessage("You are too tired to cast your line.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return false;
    }
    
    player.stamina -= 2;
    if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('staminaDisplay'), false);

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
    if (isVoid) zone = 'void'; // Overrides previous classifications

    // --- ADVANCED BAIT SYSTEM ---
    let usedBaitName = null;
    let baitCatchBoost = 0;
    let baitRareBoost = 0;
    let baitWeightMult = 1.0; // GAMEPLAY WIN: Good bait catches bigger fish!
    let baitColor = 'gray';

    // QoL WIN: Expanded Bait options using early game junk!
    const validBaits = [
        { name: 'Void Dust', catchBoost: 0.20, rareBoost: 0.60, weightMult: 1.50, zoneOnly: 'void', color: 'purple' },
        { name: 'Kraken Ink Sac', catchBoost: 0.10, rareBoost: 0.50, weightMult: 1.25, zoneOnly: 'deep', color: 'purple' }, 
        { name: 'Fire Elemental Core', catchBoost: 0.10, rareBoost: 0.50, weightMult: 1.25, zoneOnly: 'lava', color: 'orange' }, 
        { name: 'Minnow', catchBoost: 0.15, rareBoost: 0.30, weightMult: 1.15, color: 'blue' }, 
        { name: 'Raw Meat', catchBoost: 0.25, rareBoost: 0.10, weightMult: 1.05, color: 'red' }, 
        { name: 'Rat Tail', catchBoost: 0.10, rareBoost: 0.0, weightMult: 0.9, color: 'gray' }, 
        { name: 'Bat Wing', catchBoost: 0.10, rareBoost: 0.05, weightMult: 0.9, color: 'gray' }, 
        { name: 'Bird Egg', catchBoost: 0.10, rareBoost: 0.05, weightMult: 1.0, color: 'gray' } 
    ];

    for (let b of validBaits) {
        if (b.zoneOnly && b.zoneOnly !== zone) continue;
        const idx = player.inventory.findIndex(i => i.name === b.name && !i.isEquipped);
        if (idx > -1) {
            usedBaitName = b.name;
            baitCatchBoost = b.catchBoost;
            baitRareBoost = b.rareBoost;
            baitWeightMult = b.weightMult;
            baitColor = b.color;
            player.inventory[idx].quantity--;
            if (player.inventory[idx].quantity <= 0) player.inventory.splice(idx, 1);
            break; 
        }
    }

    // Check if player meant to use bait but ran out
    if (!usedBaitName && player.fishingLevel > 1 && Math.random() < 0.2) {
        logMessage("{gray:(You are fishing without bait. Catch rates are lower.)}");
    }

    // --- LORE & MECHANIC WIN: WEATHER SYNERGY ---
    const hour = gameState.time.hour;
    const isNight = hour >= 20 || hour <= 5;
    const isFrenzy = (hour >= 5 && hour <= 7) || (hour >= 18 && hour <= 20); // Dawn and Dusk
    
    // Blood Moon makes fishing incredibly dangerous but highly rewarding!
    const isBloodMoon = gameState.isBloodMoon || false; 

    // --- DANGEROUS WATERS (Hostile Hooks!) ---
    // If it's a thunderstorm or a blood moon, the chance to hook a monster skyrockets!
    let hostilityChance = 0.05;
    if (gameState.weather === 'storm') hostilityChance = 0.15;
    if (isBloodMoon) hostilityChance = 0.30;

    if (zone === 'deep' && Math.random() < hostilityChance) {
        playSplash();
        logMessage("{red:You hooked something massive... IT'S PULLING YOU IN!}");
        const dmg = isLeviathansBane ? 5 : 10;
        logMessage(`A Kraken Tentacle breaches the surface and whips your ship! (-${dmg} HP)`);
        
        if (isLeviathansBane) logMessage("{purple:Leviathan's Bane reduces the damage!}");
        playLineSnap();

        player.health -= dmg;
        gameState.screenShake = 20; // JUICE
        if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('healthDisplay'), false);
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#ef4444', 15);
        if (player.health <= 0) if (typeof handlePlayerDeath === 'function') handlePlayerDeath();
        return true; 
    }

    // CONTENT WIN: Ambush monsters based on biomes
    let ambushEnemy = null;
    if (zone === 'swamp' && Math.random() < hostilityChance) ambushEnemy = 'l'; // Leech
    if (zone === 'void' && Math.random() < hostilityChance) ambushEnemy = 'v';  // Void Stalker

    if (ambushEnemy) {
        playSplash();
        logMessage(`{purple:You hooked something from the depths... A hostile creature emerges!}`);
        
        const enemyData = window.ENEMY_DATA[ambushEnemy];
        const spawnX = player.x + 1;
        const spawnY = player.y;
        
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
            const enemyId = `overworld:${spawnX},${-spawnY}`;
            const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, spawnX, spawnY) : enemyData;
            gameState.sharedEnemies[enemyId] = { ...scaledStats, tile: ambushEnemy, x: spawnX, y: spawnY, spawnTime: Date.now() };
            
            if (typeof EnemyNetworkManager !== 'undefined') {
                rtdb.ref(EnemyNetworkManager.getPath(spawnX, spawnY, enemyId)).set(gameState.sharedEnemies[enemyId]);
            }
        } else {
            const newEnemy = {
                id: `${gameState.currentCaveId || gameState.currentCastleId}:ambush_${Date.now()}`,
                x: spawnX, y: spawnY, tile: ambushEnemy, name: enemyData.name,
                health: enemyData.maxHealth, maxHealth: enemyData.maxHealth,
                attack: enemyData.attack, defense: enemyData.defense || 0,
                xp: enemyData.xp, loot: enemyData.loot,
                inflicts: enemyData.inflicts, madnessTurns: 0, frostbiteTurns: 0, poisonTurns: 0, rootTurns: 0
            };
            gameState.instancedEnemies.push(newEnemy);
        }
        
        gameState.screenShake = 15; // JUICE
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(spawnX, spawnY, '#111827', 10);
        }
        if (typeof render === 'function') render();
        return true; 
    }

    // --- CALCULATE SUCCESS CHANCE ---
    let catchChance = 0.30 + (player.fishingLevel * 0.05) + (player.dexterity * 0.02) + (player.luck * 0.02);
    
    // MECHANIC WIN: Steel Rod gives a baseline boost to offset the Deep Water penalty
    if (hasSteelRod || hasObsidianRod) catchChance += 0.10;
    
    if (zone === 'deep' || zone === 'void') catchChance -= 0.15; 
    if (zone === 'lava') catchChance -= 0.10; 
    
    // WEATHER SYNERGY: Rain hides the line, making fish easier to catch!
    if (gameState.weather === 'rain' || gameState.weather === 'storm') catchChance += 0.15; 
    
    if (isFrenzy) catchChance += 0.25; // Massive frenzy boost
    catchChance += baitCatchBoost; 

    let flavorText = "You cast your line...";
    if (zone === 'deep') flavorText = "You drop your heavy line into the abyss...";
    if (zone === 'lava') flavorText = "You cast your obsidian line into the bubbling magma...";
    if (zone === 'void') flavorText = "You cast your line into the shimmering rift...";
    
    if (usedBaitName) flavorText += ` {${baitColor}:(Used ${usedBaitName})}`;
    if (isNight) flavorText += " The darkness is absolute.";
    if (isBloodMoon) flavorText += " The water reflects the crimson moon.";
    if (gameState.weather === 'rain') flavorText += " The rain pelts the surface of the water.";
    
    if (isFrenzy) logMessage("{blue:The water is boiling with activity! (Feeding Frenzy)}");
    logMessage(`{gray:${flavorText}}`);
    
    playSplash(); // Cast audio
    
    // JUICE: Visual water splash matching the biome
    if (typeof ParticleSystem !== 'undefined') {
        let splashColor = '#60a5fa'; // Blue
        if (zone === 'swamp') splashColor = '#16a34a'; // Green
        if (zone === 'lava') splashColor = '#f97316'; // Orange
        if (zone === 'void') splashColor = '#a855f7'; // Purple
        
        ParticleSystem.createExplosion(player.x, player.y - 1, splashColor, 5);
    }

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
        
        // WEATHER SYNERGY: Thunderstorms and Blood Moons massively boost rarity rolls
        let weatherBoost = 0;
        if (gameState.weather === 'storm') weatherBoost = 0.20;
        if (isBloodMoon) weatherBoost = 0.35; 
        
        const totalRareChance = roll + baitRareBoost + nightBoost + frenzyBoost + luckBoost + lvlBoost + weatherBoost;

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
            // Apply bait weight multiplier to upper bound
            const effMaxW = Math.floor(catchData.maxW * baitWeightMult);
            const weight = Math.floor(Math.random() * (effMaxW - catchData.minW + 1)) + catchData.minW;
            finalItemName = `[${weight}lb] ${baseName}`;
            isTrophy = true;

            // The Line-Snap Stamina Battle!
            if (weight > 100) {
                logMessage(`{orange:It's a monster! It fights the line!}`);
                if (isLeviathansBane) {
                    logMessage("{purple:Leviathan's Bane: You effortlessly tire out the beast!}");
                } else {
                    const stamDrain = (hasSteelRod || hasObsidianRod) ? 2 : 4;
                    logMessage(`{orange:(-${stamDrain} Stamina)}`);
                    
                    if (player.stamina < stamDrain) {
                        playLineSnap();
                        logMessage(`{red:You are too exhausted to reel it in... The line snaps!}`);
                        player.stamina = 0;
                        if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('staminaDisplay'), false);
                        return true; 
                    } else {
                        player.stamina -= stamDrain;
                        if (typeof triggerStatFlash !== 'undefined') triggerStatFlash(document.getElementById('staminaDisplay'), false);
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

        const baseKey = getItemKeyByName(baseName);
        const template = window.ITEM_DATA[baseKey];
        const catchTile = template ? (template.tile || '🐟') : '🐟';

        // --- VISUAL CATCH JUICE ---
        if (typeof ParticleSystem !== 'undefined') {
            // Launch the emoji into the air!
            ParticleSystem.spawn(player.x, player.y - 1, '#ffffff', 'text', catchTile, 16);
            playSplash();
        }

        if (rarity === 'legendary') {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            logMessage(`{gold:A MASSIVE TUG! You hauled up a ${finalItemName}!}`);
            gameState.screenShake = 5; // JUICE
        } else if (rarity === 'rare') {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
            logMessage(`{purple:A strong bite! You caught a ${finalItemName}!}`);
        } else if (rarity === 'trash') {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            logMessage(`{gray:You reeled in some trash... a ${finalItemName}.}`);
        } else {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            if (!isTrophy) logMessage(`You caught a ${finalItemName}!`);
        }
            
        // THE FIX: Proper Stack & Capacity Checking!
        const existingStack = player.inventory.find(i => i.name === finalItemName && !i.isEquipped);
        const isStackable = template && ['junk', 'consumable', 'trade'].includes(template.type) && !isTrophy;

        if (existingStack && isStackable) {
            existingStack.quantity++;
        } else if (player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            // Inject the templateId here so the effect binds correctly on re-hydration!
            player.inventory.push({
                templateId: baseKey, 
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
        } else {
            // Inventory is full and the item doesn't stack!
            logMessage(`{red:Your pack is too full to keep the ${finalItemName}. It flops back into the water!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y - 1, '#60a5fa', 5); // Flop splash
            // Note: XP and Records are kept intentionally because they still succeeded at the fishing mini-game mechanic.
        }

        player.fishingXp += xpGained;
        const xpNeeded = player.fishingLevel * 50;

        if (player.fishingXp >= xpNeeded && player.fishingLevel < 15) {
            player.fishingXp -= xpNeeded;
            player.fishingLevel++;
            logMessage(`{blue:FISHING LEVEL UP! You are now a Level ${player.fishingLevel} Angler.}`);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(player.x, player.y);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
        }

    } else {
        logMessage("{gray:...not even a nibble.}");
    }

    if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update({
            stamina: player.stamina,
            health: player.health,
            psyche: player.psyche, // Added for new jelly fish
            fishingLevel: player.fishingLevel,
            fishingXp: player.fishingXp,
            fishingRecords: player.fishingRecords,
            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory
        });
    }

    if (typeof renderInventory === 'function') renderInventory();
    return true; 
}

// --- END OF FILE fishing.js ---
