// --- START OF FILE data-items.js ---

window.COOKING_RECIPES = {
    "Oracle's Broth": {
        materials: { "Bluecap Mushroom": 2, "Medicinal Herb": 1, "Dirty Water": 1 },
        xp: 25, level: 2 
    },
    "Soldier's Last Meal": {
        materials: { "Steak": 2, "Hardtack": 2, "Wheel of Cheese": 1 },
        xp: 60, level: 3 
    },
    "Void-Salted Fish": {
        materials: { "Raw Fish": 1, "Void Dust": 1 },
        xp: 100, level: 4 
    },
    "Monster Stew": { 
        materials: { "Rat Tail": 2, "Bat Wing": 1, "Clean Water": 1 },
        xp: 20, level: 1 
    },
    "Berry Pie": {
        materials: { "Wildberry": 3, "Bag of Flour": 1, "Jar of Honey": 1 },
        xp: 40, level: 2
    },
    "Traveler's Wrap": {
        materials: { "Steak": 1, "Hardtack": 1, "Wheel of Cheese": 1 },
        xp: 30, level: 2
    },
    "Honey Glazed Ham": {
        materials: { "Raw Meat": 2, "Jar of Honey": 1 },
        xp: 35, level: 2
    },
    "Omelet": {
        materials: { "Bird Egg": 2, "Wheel of Cheese": 1 },
        xp: 20, level: 1
    },
    "Steak": {
        materials: { "Raw Meat": 1 },
        xp: 10, level: 1
    },
    "Grilled Fish": {
        materials: { "Raw Fish": 1 },
        xp: 10, level: 1
    },
    "Berry Juice": {
        materials: { "Wildberry": 3 },
        xp: 5, level: 1
    },
    "Cactus Stew": {
        materials: { "Cactus Fruit": 2, "Raw Meat": 1 },
        xp: 20, level: 2
    },
    "Clean Water": {
        materials: { "Dirty Water": 1 },
        xp: 5, level: 1
    },
    "Hearty Meal": {
        materials: { "Steak": 1, "Grilled Fish": 1, "Wildberry": 1 },
        xp: 50, level: 3
    }
};

window.CRAFTING_RECIPES = {
    "Ancient Key": {
        materials: { "Tablet of the North": 1, "Tablet of the East": 1, "Tablet of the West": 1, "Tablet of the South": 1 },
        xp: 500, level: 1 
    },
    // --- TIER 0 (Basic Survival) ---
    "Wooden Club": {
        materials: { "Stick": 2 },
        xp: 5, level: 1
    },
    "Fishing Rod": {
        materials: { "Stick": 2, "Spider Silk": 1 },
        xp: 15, level: 1
    },
    "Quarterstaff": {
        materials: { "Stick": 4 },
        xp: 10, level: 1
    },
    "Padded Armor": {
        materials: { "Tattered Rags": 2, "Stick": 1 }, 
        xp: 10, level: 1
    },
    "Wooden Arrow": { 
        materials: { "Stick": 1, "Bone Shard": 1 },
        xp: 15, level: 1, yield: 10
    },
    "Fire Arrow": { 
        materials: { "Wooden Arrow": 5, "Arcane Dust": 1 }, 
        xp: 25, level: 3, yield: 5 
    },
    "Poison Arrow": { 
        materials: { "Wooden Arrow": 5, "Snake Fang": 1 }, 
        xp: 25, level: 2, yield: 5 
    },    
    // --- TIER 1 (Basic Survival & Alchemy) ---
    "Leather Tunic": {
        materials: { "Wolf Pelt": 3 },
        xp: 10, level: 1
    },
    "Bone Dagger": {
        materials: { "Bone Shard": 5, "Stick": 1 },
        xp: 15, level: 1
    },
    "Healing Potion": {
        materials: { "Wildberry": 2, "Cactus Fruit": 1 }, 
        xp: 10, level: 1
    },
    "Mana Potion": {
        materials: { "Bluecap Mushroom": 2, "Clean Water": 1 }, 
        xp: 15, level: 1
    },
    "Stamina Potion": {
        materials: { "Wildberry": 2, "Clean Water": 1 }, 
        xp: 15, level: 1
    },

    // --- TIER 2 (Apprentice) ---
    "Antidote": {
        materials: { "Medicinal Herb": 1, "Clean Water": 1, "Bone Shard": 1 },
        xp: 20, level: 2
    },
    "Iron Arrow": { 
        materials: { "Stick": 1, "Iron Ore": 1 },
        xp: 25, level: 3, yield: 5 
    },
    "Steel Arrow": { 
        materials: { "Stick": 1, "Iron Ore": 2, "Dragon Scale": 1 },
        xp: 50, level: 4, yield: 5 
    },
    "Bandit Garb": {
        materials: { "Bandit's Insignia": 3, "Leather Tunic": 1 },
        xp: 25, level: 2
    },
    "Bandit's Boots": {
        materials: { "Bandit's Insignia": 5, "Wolf Pelt": 2 },
        xp: 20, level: 2
    },
    "Shovel": {
        materials: { "Stick": 2, "Iron Ore": 2 },
        xp: 30, level: 2
    },
    "Pickaxe": {
        materials: { "Stick": 2, "Orc Tusk": 3 },
        xp: 30, level: 2
    },
    "Machete": {
        materials: { "Bone Dagger": 1, "Stick": 2, "Wolf Pelt": 1 },
        xp: 30, level: 2
    },
    "Spike Trap": {
        materials: { "Iron Ore": 3, "Bone Shard": 3 },
        xp: 20, level: 2
    },

    // --- TIER 3 (Journeyman) ---
    "Iron Sword": {
        materials: { "Iron Ore": 5, "Stick": 1 },
        xp: 40, level: 3
    },
    "Iron Helm": {
        materials: { "Iron Ore": 4, "Wolf Pelt": 1 },
        xp: 35, level: 3
    },
    "Iron Mail": {
        materials: { "Iron Ore": 8, "Leather Tunic": 1 },
        xp: 50, level: 3
    },
    "Poisoned Dagger": {
        materials: { "Bone Dagger": 1, "Spider Silk": 5 },
        xp: 45, level: 3
    },
    "Steel Fishing Rod": {
        materials: { "Fishing Rod": 1, "Iron Ore": 3 },
        xp: 40, level: 3
    },
    "Silk Cowl": {
        materials: { "Spider Silk": 4 },
        xp: 40, level: 3
    },
    "Silk Gloves": {
        materials: { "Spider Silk": 3 },
        xp: 35, level: 3
    },
    // --- TIER 3 (Advanced) ---
    "Studded Armor": {
        materials: { "Leather Tunic": 1, "Iron Ore": 5, "Spider Silk": 2 },
        xp: 60, level: 3
    },
    "Masterwork Dagger": {
        materials: { "Bone Dagger": 1, "Obsidian Shard": 2, "Arcane Dust": 3 },
        xp: 80, level: 3
    },
    "Fisherman's Stew": {
        materials: { "Raw Fish": 2, "Wildberry": 2, "Cactus Fruit": 1 },
        xp: 30, level: 1 
    },
    "Void-Shielded Mail": {
        materials: { "Iron Mail": 1, "Void Dust": 5, "Arcane Dust": 5 },
        xp: 150, level: 4
    },

    // --- TIER 4 (Expert) ---
    "Steel Sword": {
        materials: { "Rusty Sword": 1, "Orc Tusk": 4, "Iron Ore": 2 },
        xp: 60, level: 4
    },
    "Steel Armor": {
        materials: { "Studded Armor": 1, "Orc Tusk": 6 },
        xp: 70, level: 4
    },
    "Warlock's Staff": {
        materials: { "Bone Dagger": 1, "Arcane Dust": 5 },
        xp: 65, level: 4
    },
    "Mage Robe": {
        materials: { "Bandit Garb": 1, "Arcane Dust": 5 },
        xp: 65, level: 4
    },
    "Climbing Tools": {
        materials: { "Stick": 3, "Wolf Pelt": 3, "Bone Shard": 5 },
        xp: 50, level: 4
    },

    // --- TIER 4.5 (Dragon) ---
    "Dragonscale Tunic": {
        materials: { "Dragon Scale": 5, "Leather Tunic": 1 },
        xp: 150, level: 4
    },
    "Dragonbone Dagger": {
        materials: { "Dragon Scale": 2, "Bone Dagger": 1, "Obsidian Shard": 1 },
        xp: 120, level: 4
    },
    
    // --- UTILITY ---
    "Black Powder Bomb": {
        materials: { "Stone": 1, "Fire Elemental Core": 1 }, 
        xp: 50, level: 3
    },

    // --- TIER 4/5 (Special & Keys) ---
    "Void Key": {
        materials: { "Void Dust": 5, "Obsidian Shard": 1 },
        xp: 100, level: 4
    },
    "Prime Tuning Fork": {
        materials: { "Iron Ore": 5, "Void Dust": 5 },
        xp: 150, level: 5
    },

    // --- TIER 5 (Master) ---
    "Diamond Tipped Pickaxe": {
        materials: { "Pickaxe": 1, "Raw Diamond": 2 },
        xp: 200, level: 5
    },
    "Obsidian Fishing Rod": {
        materials: { "Steel Fishing Rod": 1, "Obsidian Shard": 3, "Spider Silk": 3 },
        xp: 180, level: 5
    },
    "Obsidian Edge": {
        materials: { "Obsidian Shard": 3, "Steel Sword": 1, "Arcane Dust": 5 },
        xp: 100, level: 5
    },
    "Obsidian Plate": {
        materials: { "Obsidian Shard": 4, "Steel Armor": 1, "Frost Essence": 3 },
        xp: 120, level: 5
    },
    "Cryo Blade": {
        materials: { "Rusty Sword": 1, "Frost Essence": 5 },
        xp: 90, level: 5
    },
    "Frozen Mail": {
        materials: { "Studded Armor": 1, "Frost Essence": 5 },
        xp: 100, level: 5
    },
    "Arcane Blade": {
        materials: { "Steel Sword": 1, "Arcane Dust": 8 },
        xp: 110, level: 5
    },
    "Mithril Sword": {
        materials: { "Mithril Ore": 5, "Stick": 2 },
        xp: 150, level: 5
    },
    "Mithril Mail": {
        materials: { "Mithril Ore": 8, "Yeti Fur": 2 },
        xp: 180, level: 5
    },

    // --- TIER 6 (Legendary) ---
    "Void Blade": {
        materials: { "Obsidian Edge": 1, "Void Dust": 10, "Demon Horn": 2 },
        xp: 300, level: 6
    },
    "Demonplate": {
        materials: { "Obsidian Plate": 1, "Demon Horn": 5, "Elemental Core": 3 },
        xp: 350, level: 6
    },
    "Amulet of the Magi": {
        materials: { "Gold Coin": 200, "Arcane Dust": 10, "Basilisk Eye": 1 },
        xp: 250, level: 5
    },
    
    // --- HOMESTEAD ---
    "Stone Wall": {
        materials: { "Stone": 2 },
        xp: 10, level: 1
    },
    "Wood Floor": {
        materials: { "Wood Log": 1 },
        xp: 5, level: 1, yield: 2 
    },
    "Wooden Door": {
        materials: { "Wood Log": 2 },
        xp: 15, level: 1
    },
    "Stash Box": {
        materials: { "Wood Log": 4, "Iron Ore": 1 },
        xp: 50, level: 2
    },
    "Campfire Kit": {
        materials: { "Wood Log": 3, "Stone": 4 },
        xp: 15, level: 1
    },
    "Stick": {
        materials: { "Wood Log": 1 },
        xp: 5, level: 1, yield: 4 
    },
    "Torch": {
        materials: { "Stick": 1, "Tattered Rags": 1 },
        xp: 5, level: 1
    }
};

window.ITEM_DATA = {
    '🏆': {
        name: "Gladiator's Token",
        type: "consumable",
        tile: "🏆",
        description: "Proof of your victory in the Colosseum. {gold:Permanently +2 to All Core Stats!}",
        effect: (state) => {
            const p = state.player;
            p.strength += 2; 
            p.dexterity += 2; 
            p.wits += 2; 
            p.constitution += 2; 
            p.luck += 2;
            
            logMessage("{gold:You crush the token. The strength of champions flows into you!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#facc15', 30);
            
            if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();

            // Re-open the exit!
            if (state.mapMode === 'dungeon' && state.currentCaveTheme === 'ARENA') {
                chunkManager.caveMaps[state.currentCaveId][13][7] = '<';
                logMessage("{cyan:The gates reopen! You may exit the arena.}");
                state.mapDirty = true;
            }

            return true; 
        }
    },
    '🧨': {
        name: 'Dwarven TNT',
        type: 'consumable',
        tile: '🧨',
        description: "Aim and throw to blow up walls (🏚) and enemies in a 3x3 radius!",
        effect: (state) => {
            logMessage("{orange:Select a direction to throw the TNT... (WASD/Arrows)}");
            state.isAiming = true;
            state.abilityToAim = 'throwTNT';
            return false; 
        }
    },
    '📜c': { name: 'Cultist Orders', type: 'quest', description: "Plans detailing an attack on the village." },
    '🧿s': { name: 'Shadow Amulet', type: 'quest', description: "It hums with dark energy. A key for high-ranking cultists." },
    '🌱': {
        name: 'Cloudseed',
        type: 'consumable',
        tile: '🌱',
        description: "Plant this on open ground to grow a stalk into the heavens.",
        effect: (state) => {
            if (state.mapMode !== 'overworld') {
                logMessage("You must plant this under the open sky.");
                return false;
            }
            logMessage("{green:A massive beanstalk erupts from the earth, piercing the clouds!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            chunkManager.setWorldTile(state.player.x, state.player.y, '🌿');
            
            state.mapMode = 'skyrealm';
            state.mapDirty = true;
            if (typeof render === 'function') render();
            return true;
        }
    },
    '⚔️star': {
        name: 'Star-Forged Blade',
        type: 'weapon',
        tile: '⚔️',
        damage: 12,
        slot: 'weapon',
        statBonuses: { strength: 3, luck: 3 },
        description: "{red:+12 Dmg}, {green:+3 Str}, {gold:+3 Luck}. It glows with starlight.",
        excludeFromLoot: true 
    },
    '🧥abyss': {
        name: 'Abyssal Cloak',
        type: 'armor',
        tile: '🧥',
        defense: 6,
        slot: 'armor',
        statBonuses: { dexterity: 5, wits: 5 },
        description: "{blue:+6 Def}, {green:+5 Dex, +5 Wits}. It drinks the surrounding light.",
        excludeFromLoot: true 
    },
    'repel': {
        name: 'Dragon Repellent',
        type: 'consumable',
        tile: '🧄',
        description: "It smells strongly of garlic and snake oil. It definitely does not work.",
        effect: (state) => {
            logMessage("You spray yourself with the pungent liquid. You smell terrible. Dragons are completely unaffected.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.1, 800);
            return true;
        }
    },

    '🐾1': { 
        name: 'Beastmaster Vol I', type: 'journal', title: 'On Wolves and Bears', 
        content: "To tame a beast, one must first break its spirit, but not its body. Bring a wolf or bear to the brink of death (under 30% Health), and it may respect your dominance if you have enough Charisma." 
    },
    '🐾2': { 
        name: 'Beastmaster Vol II', type: 'journal', title: 'The Crawling Terrors', 
        content: "Spiders and Scorpions cannot be reasoned with. Their minds are alien. Do not attempt to tame them, for they will only see you as food. Fire is your only friend." 
    },
    '🐾3': { 
        name: 'Beastmaster Vol III', type: 'journal', title: 'The Drake', 
        content: "I saw a Young Drake today. It breathed fire that melted stone. I dare not approach it. Legend says dragons hoard gold because it is the only metal that doesn't melt when they sleep on it." 
    },
    '🧪a': {
        name: 'Antidote',
        type: 'consumable',
        tile: '🧪',
        description: "A foul-tasting chalky liquid. {green:Cures Poison instantly.}",
        effect: (state) => {
            if (state.player.poisonTurns <= 0) {
                logMessage("You aren't poisoned.");
                return false;
            }
            state.player.poisonTurns = 0;
            logMessage("{green:The poison is flushed from your veins!}");
            triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🧪m': {
        name: 'Mana Potion',
        type: 'consumable',
        tile: '🧪',
        description: "A glowing blue liquid. {blue:+30 Mana, +10 Thirst}",
        effect: (state) => {
            if (state.player.mana >= state.player.maxMana && state.player.thirst >= state.player.maxThirst) {
                logMessage("You don't need this right now.");
                return false;
            }
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 30);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 10);
            logMessage("Used a Mana Potion. {blue:(+30 Mana, +10 Thirst)}");
            triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');
            return true;
        }
    },
    '🧪y': {
        name: 'Stamina Potion',
        type: 'consumable',
        tile: '🧪',
        description: "A bubbling yellow liquid. {green:+30 Stamina}, {blue:+10 Thirst}",
        effect: (state) => {
            if (state.player.stamina >= state.player.maxStamina && state.player.thirst >= state.player.maxThirst) {
                logMessage("You don't need this right now.");
                return false;
            }
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 30);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 10);
            logMessage("Used a Stamina Potion. {green:(+30 Stamina)}, {blue:(+10 Thirst)}");
            triggerStatAnimation(document.getElementById('staminaDisplay'), 'stat-pulse-yellow');
            return true;
        }
    },
    '➹i': {
        name: 'Iron Arrow',
        type: 'ammo',
        tile: '➹',
        slot: 'ammo',
        damage: 3,
        description: "Heavy, armor-piercing arrows. {red:+3 Dmg}"
    },
    '➹s': {
        name: 'Steel Arrow',
        type: 'ammo',
        tile: '➹',
        slot: 'ammo',
        damage: 6,
        description: "Flawless, razor-sharp steel. {red:+6 Dmg}"
    },
    '🍲m': { 
        name: 'Monster Stew', 
        type: 'consumable', 
        tile: '🍲',
        description: "Looks awful, tastes worse. {yellow:+20 Hunger}, {red:-2 HP}", 
        effect: (state) => { 
            if (state.player.hunger >= state.player.maxHunger) return false;
            
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 20); 
            state.player.health -= 2; 
            
            logMessage("You gag as it goes down. {yellow:+20 Hunger}, {red:-2 HP}"); 
            triggerStatFlash(statDisplays.health, false); 
            return true; 
        } 
    },
    '⚓': {
        name: 'Rusted Anchor',
        type: 'trade',
        char: '⚓',
        description: "Heavy and encrusted with barnacles. A collector's item.",
        value: 75
    },
    'bone': {
        name: "Fossilized Bone",
        type: "trade",
        char: "🦴",
        color: "#a8a29e",
        description: "The remains of something that predates the Kingdom.",
        value: 5
    },
    'pottery': {
        name: "Shard of Pottery",
        type: "trade",
        char: "🏺",
        color: "#d97706",
        description: "It depicts a king with no face.",
        value: 15
    },
    'arrowhead': {
        name: "Obsidian Arrowhead",
        type: "trade",
        char: "🔺",
        color: "#1f2937",
        description: "Sharp as the day it was knapped. Elven make.",
        value: 25
    },
    'idol': {
        name: "Strange Idol",
        type: "trade",
        char: "🗿",
        color: "#78716c",
        description: "It feels warm to the touch. Unsettling.",
        value: 100
    },
    'tome_page': {
        name: "Rotting Page",
        type: "lore",
        char: "📜",
        color: "#fef3c7",
        description: "A fragment of a spell: '...the void requires a tether...'",
        value: 50
    },
    '🐙': {
        name: 'Kraken Ink Sac',
        type: 'trade',
        char: '🐙',
        description: "Pitch black and heavy. Alchemists pay a fortune for this.",
        value: 150
    },
    '🥥': {
        name: 'Coconut',
        type: 'consumable',
        tile: '🥥',
        description: "Hard to open, but refreshing. {yellow:+15 Hunger}, {blue:+20 Thirst}",
        effect: (state) => {
            if (state.player.hunger >= state.player.maxHunger && state.player.thirst >= state.player.maxThirst) return false;
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 15);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); 
            logMessage('You crack open the coconut. {yellow:(+15 Hunger)}, {blue:(+20 Thirst)}');
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
            return true;
        }
    },

    // ==========================================
    // --- FISHING EXPANSION ---
    // ==========================================
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
            
            let perksHtml = '';
            if (lvl >= 5) perksHtml += '<p class="text-xs text-green-400 font-bold mt-1">⭐ Master Angler (Trash fish ignored)</p>';
            if (lvl >= 10) perksHtml += '<p class="text-xs text-blue-400 font-bold mt-1">🌟 Deep Sea Master (Double Legendary Rate)</p>';
            if (lvl >= 15) perksHtml += '<p class="text-xs text-purple-400 font-bold mt-1">👑 Leviathan\'s Bane (No stamina loss on struggles, half damage from sea monsters)</p>';
            if (perksHtml === '') perksHtml = '<p class="text-xs text-gray-500 italic mt-1">Keep fishing to unlock Mastery Perks.</p>';

            const allFish = [
                'Minnow', 'River Trout', 'Leaping Salmon', 'Golden Koi',
                'Mudcat', 'Sludge Eel', 'Eyeless Cave Fish', 'Swamp Serpent Scale',
                'Deep Sea Cod', 'Silver Tuna', 'Swordfish', 'Abyssal Angler',
                'Magma Carp', 'Obsidian Eel', 'Heart of the Volcano'
            ];
            
            const caughtCount = allFish.filter(f => records[f]).length;
            const completionPercent = Math.floor((caughtCount / allFish.length) * 100);

            let gridHtml = `<div class="grid grid-cols-2 gap-2 mt-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">`;
            
            allFish.forEach(fishName => {
                const record = records[fishName];
                if (record) {
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

            let html = `
            <div class="mb-4 bg-black bg-opacity-20 p-3 rounded-lg border border-gray-700">
                <p class="text-lg font-bold text-blue-400 flex justify-between"><span>Fishing Level: ${lvl}</span> <span>${caughtCount}/${allFish.length}</span></p>
                <p class="text-xs text-gray-400 mb-2">XP: ${xp} / ${nextXp}</p>
                <div class="stat-bar-container mb-2"><div class="stat-bar bg-blue-500" style="width: ${Math.min(100, (xp/nextXp)*100)}%"></div></div>
                ${perksHtml}
            </div>
            <h3 class="font-bold border-b border-gray-600 mb-2 flex justify-between text-sm">
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
            return false;
        }
    },
    '🎣s': {
        name: 'Steel Fishing Rod', type: 'tool', tile: '🎣',
        description: "A durable rod with a metal spool. Boosts catch rates slightly."
    },
    '🎣o': {
        name: 'Obsidian Fishing Rod', type: 'tool', tile: '🎣',
        description: "Woven from fire-proof silk and dark glass. Required for Lava Fishing."
    },
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
    '🌋crp': { name: 'Magma Carp', type: 'consumable', tile: '🐟', description: "It's already cooked perfectly! {yellow:+35 Hunger}, {green:+10 HP}", effect: (s) => eatFish(s, 35, 10) },
    '🌋eel': { name: 'Obsidian Eel', type: 'weapon', tile: '🐍', damage: 6, slot: 'weapon', inflicts: 'burn', inflictChance: 0.3, description: "{red:+6 Dmg}. A living, whip-like eel that sears flesh. {orange:(Burns target)}" },
    '🌋hrt': { name: 'Heart of the Volcano', type: 'accessory', tile: '❤️', defense: 2, slot: 'accessory', statBonuses: { constitution: 5, strength: 3 }, description: "{blue:+2 Def}, {green:+5 Con, +3 Str}. It beats with volcanic fury." },
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
                
                const prizeKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === prize) || prize;
                const template = window.ITEM_DATA[prizeKey];
                
                const isStackable = template && ['junk', 'consumable', 'trade'].includes(template.type);
                const existingPrize = state.player.inventory.find(i => i.name === prize && !i.isEquipped);
                
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
            triggerStatFlash(document.getElementById('coinsDisplay'), true);
            return true; 
        }
    },
    '🍾': {
        name: 'Message in a Bottle', type: 'consumable', tile: '🍾',
        description: "There's a rolled up piece of parchment inside.",
        effect: (state) => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.1, 0.1, 2000); 
            logMessage("You smash the bottle and unroll the damp parchment...");
            
            if (Math.random() < 0.25) {
                const bottleStack = state.player.inventory.find(i => i.name === 'Message in a Bottle' && !i.isEquipped);
                const freesSlot = (bottleStack && bottleStack.quantity === 1) ? 1 : 0;
                
                if (state.player.inventory.length - freesSlot < (window.MAX_INVENTORY_SLOTS || 9)) {
                    logMessage(`{gold:It's a Tattered Map! X marks the spot!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    
                    const mapKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === 'Tattered Map') || '🗺️';
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
                    "...the magma carps only bite when the mountain rumbles..."
                ];
                const msg = loreFragments[Math.floor(Math.random() * loreFragments.length)];
                logMessage(`{gray:"${msg}"}`);
            }
            
            logMessage("{blue:You gain 50 Exploration XP!}");
            if (typeof grantXp === 'function') grantXp(50);
            return true; 
        }
    },
    
    // ==========================================
    // --- STARGAZING EXPANSION ---
    // ==========================================
    '🔭': {
        name: 'Brass Telescope',
        type: 'tool',
        tile: '🔭',
        description: "Use on a Mountain Peak at night to study the stars.",
        effect: (state) => {
            const hour = state.time.hour;
            const isNight = hour >= 20 || hour < 5;
            
            let tile;
            if (state.mapMode === 'overworld') tile = chunkManager.getTile(state.player.x, state.player.y);
            else {
                logMessage("You must be outdoors to gaze at the stars.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false; 
            }

            if (!isNight) {
                logMessage("The sun is too bright to see the stars.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false;
            }
            if (tile !== '^' && tile !== '⛰') {
                logMessage("You need to be higher up to get a clear view. Find a mountain peak.");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false;
            }
            if (state.weather !== 'clear') {
                logMessage(`The ${state.weather} obscures the night sky.`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false;
            }

            const constellations = ['constellation_1', 'constellation_2', 'constellation_3'];
            const discovered = constellations[Math.floor(Math.random() * constellations.length)];

            if (!state.foundCodexEntries.has(discovered)) {
                logMessage("{purple:You chart a new constellation in the night sky!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "✨", "#a855f7");
                
                const uniqueDiscoveryId = `stars_${state.player.x}_${state.player.y}_${discovered}`;
                grantLoreDiscovery(uniqueDiscoveryId, discovered);
            } else {
                logMessage("{gray:You study the stars, but find nothing new tonight.}");
            }
            return false; 
        }
    },
    'constellation_1': {
        name: 'Constellation: The Serpent',
        type: 'journal',
        title: 'The Great Serpent',
        content: "A winding trail of pale blue stars.\n\nThe ancients believed the world was not a sphere, but a massive egg resting in the coils of a cosmic serpent. When earthquakes rattle the mountains, it is merely the serpent tightening its grip."
    },
    'constellation_2': {
        name: 'Constellation: The Empty Throne',
        type: 'journal',
        title: 'The Empty Throne',
        content: "A rigid, box-like formation missing its central star.\n\nLegend says the central star fell to the earth during the First Age, taking the form of the Old King. Since his corruption, the throne in the sky has remained dark."
    },
    'constellation_3': {
        name: 'Constellation: The Weeping Eye',
        type: 'journal',
        title: 'The Weeping Eye',
        content: "A cluster of stars resembling a teardrop.\n\nAstronomers note that this constellation only became visible after the Void Rift opened. Some scholars believe it is not a cluster of stars at all, but a crack in the firmament looking back at us."
    },

    // --- NEW ARTIFACTS & PUZZLE ITEMS ---
    '📜l': {
        name: 'Forgotten Letter',
        type: 'random_lore',
        tile: '📄',
        description: "A crumbling piece of parchment."
    },
    '👓s': {
        name: 'Spirit Lens',
        slot: 'accessory',
        type: 'armor',
        tile: '👓',
        description: "Looking through it reveals the echoes of the dead.",
        excludeFromLoot: true 
    },
    '🧩n': {
        name: 'Tablet of the North',
        type: 'junk',
        description: "An ancient stone fragment. Etched on the back: 'First, the cold wind blows.'",
        tile: '🧩'
    },
    '🧩e': {
        name: 'Tablet of the East',
        type: 'junk',
        description: "An ancient stone fragment. Etched on the back: 'Second, the sun rises.'",
        tile: '🧩'
    },
    '🧩w': {
        name: 'Tablet of the West',
        type: 'junk',
        description: "An ancient stone fragment. Etched on the back: 'Third, the light fades.'",
        tile: '🧩'
    },
    '🧩s': {
        name: 'Tablet of the South',
        type: 'junk',
        description: "An ancient stone fragment. Etched on the back: 'Finally, the heat consumes.'",
        tile: '🧩'
    },
    '🗝️a': {
        name: 'Ancient Key',
        type: 'consumable',
        description: "Fused together from four fragments. It hums with power.",
        tile: '🗝️',
        effect: (state) => {
            logMessage("This key doesn't do anything... yet. You need to find the Sealed Door.");
            return false;
        }
    },
    // --- STORY-RICH ARTIFACTS ---
    '💍k': {
        name: 'The Queen\'s Promise',
        type: 'accessory',
        defense: 0,
        slot: 'accessory',
        statBonuses: { charisma: 4, luck: 2 },
        description: "{gold:+4 Cha}, {green:+2 Luck}. An elegant silver ring. 'Until the stars go dark.'"
    },
    '⚔️r': {
        name: 'Rebel\'s Edge',
        type: 'weapon',
        damage: 4,
        slot: 'weapon',
        statBonuses: { strength: 1, dexterity: 1 },
        description: "{red:+4 Dmg}, {green:+1 Str, +1 Dex}. A notched blade used in the failed coup."
    },
    '🏺o': {
        name: 'Urn of Eternal Ash',
        type: 'junk',
        description: "The remains of the first Oracle. It stays warm to the touch, even in the ice caves."
    },
    '📜f': {
        name: 'Faded Blueprint',
        type: 'junk',
        description: "A drawing of a machine that could supposedly bridge the gap between worlds."
    },
    '🧿v': {
        name: 'Eye of the Watcher',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { perception: 5, wits: -1 },
        description: "{gold:+5 Per}, {red:-1 Wits}. You see everything, but your thoughts feel distant."
    },
    // --- NEW ARTIFACTS ---
    '🔱o': {
        name: 'Scepter of the Tides',
        type: 'accessory', 
        defense: 2,
        slot: 'accessory',
        statBonuses: { intuition: 5, maxMana: 20 },
        description: "{blue:+2 Def, +20 Mana}, {gold:+5 Int}. It hums with the sound of distant waves."
    },
    '🌑': {
        name: 'Void-Touched Ring',
        type: 'accessory',
        defense: 0,
        slot: 'accessory',
        statBonuses: { willpower: 6, constitution: -2 }, 
        description: "{purple:+6 Will}, {red:-2 Con}. The metal feels like it's trying to merge with your finger."
    },
    '🫀': {
        name: 'Heart of the Forest',
        type: 'junk',
        description: "A pulsating emerald root. A collector would pay thousands of gold for this."
    },
    '🕯️b': {
        name: 'Ever-Burning Candle',
        type: 'tool',
        tile: '🕯️',
        statBonuses: { perception: 3 },
        description: "{gold:+3 Per}. The flame never flickers, even in the strongest wind."
    },

    // --- NEW MATERIALS & TRADE GOODS ---
    '💎g': { name: 'Emerald Dust', type: 'junk', description: "Fine green powder used in high-level alchemy." },
    '🦴w': { name: 'Whale Bone', type: 'junk', description: "Incredibly sturdy and light." },
    '📜r': { name: 'Royal Decree', type: 'junk', description: "An old order signed by the King. Historically significant." },
    '🧪p': {
        name: 'Berserker Brew',
        type: 'buff_potion',
        description: "{red:-5 Def} but {green:+10 Str} for 20 turns.",
        effect: (state) => {
            if (state.player.strengthBonusTurns > 0) {
                logMessage("Effect already active.");
                return false;
            }
            state.player.strengthBonus = 10;
            state.player.defenseBonus = -5;
            state.player.strengthBonusTurns = 20;
            state.player.defenseBonusTurns = 20;
            logMessage("{red:You feel a reckless rage! (+10 Str, -5 Def)}");
            return true;
        }
    },
    // --- RESOURCES ---
    '➹': {
        name: 'Wooden Arrow',
        type: 'ammo',
        tile: '➹',
        slot: 'ammo',
        damage: 1,
        description: "Ammunition for bows. {red:+1 Dmg}"
    },
    '➹f': {
        name: 'Fire Arrow',
        type: 'ammo',
        tile: '➹',
        slot: 'ammo',
        damage: 3, 
        description: "{red:+3 Dmg}. Wrapped in pitch and arcane fire. Ignites webs and oil barrels."
    },
    '➹p': {
        name: 'Poison Arrow',
        type: 'ammo',
        tile: '➹',
        slot: 'ammo',
        damage: 1, 
        description: "{red:+1 Dmg}. Dipped in potent venom. {green:(Poisons target)}"
    },
    '🎣': {
        name: 'Fishing Rod',
        type: 'tool',
        tile: '🎣',
        description: "Use on water to catch fish or... other things."
    },
    '🐟': { 
        name: 'Raw Fish',
        type: 'junk', 
        description: "Slimy. Can be cooked at a fire.",
        tile: '🐟'
    },
    '👢s': {
        name: 'Soggy Boot',
        type: 'junk',
        description: "Someone lost this a long time ago.",
        tile: '👢',
        excludeFromLoot: true
    },

    '🍞': {
        name: 'Hardtack',
        type: 'consumable',
        tile: '🍞',
        description: "Dry, hard bread. Keeps forever. {yellow:+30 Hunger}",
        effect: (state) => {
            if (state.player.hunger >= state.player.maxHunger) {
                logMessage("You are completely full.");
                return false; 
            }
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30);
            logMessage("You gnaw on the rock-hard bread. {yellow:(+30 Hunger)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '💧f': {
        name: 'Flask of Water',
        type: 'consumable',
        tile: '💧', 
        description: "Fresh water. {blue:+30 Thirst}",
        effect: (state) => {
            if (state.player.thirst >= state.player.maxThirst) {
                logMessage("You are not thirsty right now.");
                return false;
            }
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 30);
            logMessage("Refreshing. {blue:(+30 Thirst)}");
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
            return true;
        }
    },
    '🪵': {
        name: 'Wood Log',
        type: 'junk',
        description: "A sturdy log. Good for fuel or construction."
    },
    '🪨': {
        name: 'Stone',
        type: 'junk',
        description: "A heavy gray stone."
    },
    '🕯️': {
        name: 'Torch',
        type: 'tool',
        tile: '🕯️', 
        description: "Increases light radius in dark places. Keep in inventory."
    },
    '⛺k': {
        name: 'Campfire Kit',
        type: 'consumable',
        tile: '🔥',
        description: "Creates a cooking fire on open ground.",
        effect: (state) => {
            let currentTile;
            if (state.mapMode === 'overworld') {
                currentTile = chunkManager.getTile(state.player.x, state.player.y);
            } else if (state.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[state.currentCaveId];
                currentTile = (map && map[state.player.y] && map[state.player.y][state.player.x]) ? map[state.player.y][state.player.x] : ' ';
            } else if (state.mapMode === 'castle') {
                const map = chunkManager.castleMaps[state.currentCastleId];
                currentTile = (map && map[state.player.y] && map[state.player.y][state.player.x]) ? map[state.player.y][state.player.x] : ' ';
            }

            let valid = false;
            
            if ((state.mapMode === 'overworld' || state.mapMode === 'underworld') && (currentTile === '.' || currentTile === 'd' || currentTile === 'D')) {
                valid = true;
            }
            
            // Ensure it only places on valid Dungeon/Castle floors, protecting the stairs!
            if (state.mapMode === 'dungeon') {
                const theme = window.CAVE_THEMES[state.currentCaveTheme] || window.CAVE_THEMES['ROCK'];
                if (currentTile === theme.floor) valid = true;
            }
            if (state.mapMode === 'castle' && currentTile === '.') {
                valid = true;
            }

            if (valid) {
                logMessage("You arrange the stones and light the fire.");

                if (state.mapMode === 'overworld') {
                    chunkManager.setWorldTile(state.player.x, state.player.y, '🔥');
                } else if (state.mapMode === 'dungeon') {
                    chunkManager.caveMaps[state.currentCaveId][state.player.y][state.player.x] = '🔥';
                }

                render(); 
                return true; 
            } else {
                logMessage("You can't build a fire here.");
                return false; 
            }
        }
    },
    '👻s': {
        name: 'Memory Shard',
        type: 'junk', 
        tile: '👻',
        description: "A crystallized fragment of a forgotten memory. The Historian might want this."
    },
    '👢': {
        name: 'Traveler\'s Boots',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { endurance: 2 },
        description: "{blue:+1 Def}, {green:+2 End}. Good for long journeys."
    },
    '🧥': {
        name: 'Traveler\'s Cloak',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { perception: 2 },
        description: "{blue:+1 Def}, {gold:+2 Per}. Helps find secrets."
    },
    '🧭': {
        name: 'Brass Compass',
        type: 'tool', 
        statBonuses: { luck: 1 }, 
        description: "{gold:+1 Luck}. Just having it brings good fortune."
    },
    'vd': {
        name: 'Void Dust',
        type: 'junk', 
        description: "A pile of glittering dust that fades in and out of existence.",
        tile: '✨' 
    },
    '⚔️l': {
        name: 'Longsword',
        type: 'weapon',
        tile: '⚔️',
        damage: 4, 
        slot: 'weapon',
        description: "{red:+4 Dmg}. A versatile steel blade used by knights."
    },
    '🔨': {
        name: 'Warhammer',
        type: 'weapon',
        tile: '🔨',
        damage: 5, 
        isTwoHanded: true,
        slot: 'weapon',
        statBonuses: { dexterity: -1 }, 
        description: "{red:+5 Dmg}, {gray:-1 Dex}. Crushes armor and bone alike. (Two-Handed)"
    },
    '🪓': {
        name: 'Greataxe',
        type: 'weapon',
        tile: '🪓',
        damage: 6, 
        isTwoHanded: true,
        slot: 'weapon',
        statBonuses: { strength: 1, dexterity: -2 }, 
        description: "{red:+6 Dmg}, {green:+1 Str}, {gray:-2 Dex}. Devastating but slow. (Two-Handed)"
    },
    '🏏': {
        name: 'Wooden Club',
        type: 'weapon',
        tile: '🏏',
        damage: 2, 
        slot: 'weapon',
        description: "{red:+2 Dmg}. Crude but effective."
    },
    '🦯': { 
        name: 'Quarterstaff',
        type: 'weapon',
        tile: '🦯', 
        damage: 1,
        defense: 1,
        slot: 'weapon',
        description: "{red:+1 Dmg}, {blue:+1 Def}. A long pole used by travelers and monks."
    },
    '🏹': {
        name: 'Shortbow',
        type: 'weapon',
        tile: '🏹',
        damage: 2,
        range: 4, 
        isTwoHanded: true,
        slot: 'weapon',
        skillId: 'ranged_attack', 
        statBonuses: { dexterity: 1 },
        description: "{red:+2 Dmg}, {green:+1 Dex}. Simple wood and string. Requires Arrows."
    },
    '🏹l': {
        name: 'Longbow',
        type: 'weapon',
        tile: '🏹',
        damage: 4,
        range: 6, 
        isTwoHanded: true,
        slot: 'weapon',
        skillId: 'ranged_attack', 
        statBonuses: { dexterity: 2 },
        description: "{red:+4 Dmg}, {green:+2 Dex}. Superior range. Requires Arrows."
    },
    '🏹c': {
        name: 'Heavy Crossbow',
        type: 'weapon',
        tile: '🏹',
        damage: 6,
        range: 5,
        isTwoHanded: true,
        slot: 'weapon',
        skillId: 'ranged_attack', 
        statBonuses: { strength: 1 }, 
        description: "{red:+6 Dmg}, {green:+1 Str}. Powerful but slow. Requires Arrows."
    },

    // --- CULINARY EXPANSION ---
    '🍲o': {
        name: "Oracle's Broth",
        type: 'consumable',
        tile: '🍲',
        description: "Foul smelling. {purple:+5 Psyche}, {blue:+20 Mana}",
        effect: (state) => {
            state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + 5);
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 20);
            logMessage("Your mind expands. {purple:(+5 Psyche)}, {blue:(+20 Mana)}");
            triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');
            return true;
        }
    },
    '🍱s': {
        name: "Soldier's Last Meal",
        type: 'consumable',
        tile: '🍱',
        description: "Heavy and fulfilling. {yellow:+100 Hunger}, {green:+20 HP}, {yellow:+20 Stamina}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 100);
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 20);
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 20);
            logMessage("You feel ready for anything. {green:(+20 HP, +20 Stamina)}");
            triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🐟v': {
        name: "Void-Salted Fish",
        type: 'consumable',
        tile: '🐟',
        description: "Tastes like static. {blue:+50 Mana}, {yellow:+20 Hunger}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 20);
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 50);
            logMessage("Arcane energy courses through you. {blue:(+50 Mana)}");
            triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');
            return true;
        }
    },
    '🍖h': {
        name: "Honey Glazed Ham",
        type: 'consumable',
        tile: '🍖',
        description: "Sweet and savory. {yellow:+60 Hunger}, {green:+10 HP}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 60);
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 10);
            logMessage("Delicious! {yellow:(+60 Hunger)}, {green:(+10 HP)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🍳': {
        name: "Omelet",
        type: 'consumable',
        tile: '🍳',
        description: "Fluffy and filling. {yellow:+40 Hunger}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 40);
            logMessage("A great breakfast. {yellow:(+40 Hunger)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🥩': {
        name: "Steak",
        type: 'consumable',
        tile: '🥩',
        description: "A hearty cut of cooked meat. {yellow:+50 Hunger}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 50);
            logMessage("Tastes like victory. {yellow:(+50 Hunger)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🍣': {
        name: "Grilled Fish",
        type: 'consumable',
        tile: '🍣',
        description: "Crispy skin, flaky meat. {yellow:+35 Hunger}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 35);
            logMessage("Perfectly cooked. {yellow:(+35 Hunger)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🧃': {
        name: "Berry Juice",
        type: 'consumable',
        tile: '🧃',
        description: "Sweet and refreshing. {blue:+30 Thirst}, {green:+5 HP}",
        effect: (state) => {
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 30);
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 5);
            logMessage("Refreshing! {blue:(+30 Thirst)}, {green:(+5 HP)}");
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
            return true;
        }
    },
    '🥣c': {
        name: "Cactus Stew",
        type: 'consumable',
        tile: '🥣',
        description: "Spicy and hydrating. {yellow:+40 Hunger}, {blue:+20 Thirst}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 40);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20);
            logMessage("It clears your sinuses. {yellow:(+40 Hunger)}, {blue:(+20 Thirst)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🍱h': {
        name: "Hearty Meal",
        type: 'consumable',
        tile: '🍱',
        description: "A feast fit for a king. {yellow:+80 Hunger}, {green:+15 HP}",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 80);
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 15);
            logMessage("A feast! {yellow:(+80 Hunger)}, {green:(+15 HP)}");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🧀': { 
        name: 'Wheel of Cheese', 
        type: 'consumable', 
        description: "A pungent wheel of aged cheese. {yellow:+15 Hunger}", 
        effect: (state) => { 
            if (state.player.hunger >= state.player.maxHunger) return false;
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 15); 
            logMessage("It tastes sharp and nutty. {yellow:(+15 Hunger)}"); 
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true; 
        } 
    },
    '🥚': { name: 'Bird Egg', type: 'junk', description: "A speckled egg found in a nest." },
    '🌾': { name: 'Bag of Flour', type: 'junk', description: "Ground wheat. Essential for baking." },
    '🍯': { 
        name: 'Jar of Honey', 
        type: 'consumable', 
        description: "Sweet and sticky. {yellow:+10 Hunger, +5 Stamina}", 
        effect: (state) => { 
            if (state.player.hunger >= state.player.maxHunger && state.player.stamina >= state.player.maxStamina) return false;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5); 
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 10); 
            logMessage("Sweet energy! {yellow:(+10 Hunger)}, {green:(+5 Stamina)}"); 
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow'); 
            return true; 
        } 
    },
    '🥧': { 
        name: 'Berry Pie', 
        type: 'consumable', 
        description: "A masterpiece of baking. {yellow:+50 Hunger}, {purple:+10 Psyche}", 
        effect: (state) => { 
            if (state.player.hunger >= state.player.maxHunger && state.player.psyche >= state.player.maxPsyche) return false;
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 50); 
            state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + 10); 
            logMessage("Warm, sweet, and comforting. {yellow:(+50 Hunger)}, {purple:(+10 Psyche)}"); 
            triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple'); 
            return true; 
        } 
    },
    '🥙': { 
        name: 'Traveler\'s Wrap', 
        type: 'consumable', 
        description: "Portable and filling. {yellow:+40 Hunger}, {green:+5 HP}", 
        effect: (state) => { 
            if (state.player.hunger >= state.player.maxHunger && state.player.health >= state.player.maxHealth) return false;
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 40); 
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 5); 
            logMessage("A solid meal on the go. {yellow:(+40 Hunger)}, {green:(+5 HP)}"); 
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green'); 
            return true; 
        } 
    },

    // --- TRADE GOODS ---
    '🐚': { name: 'Rainbow Shell', type: 'junk', description: "It shimmers with every color. Collectors love these." }, 
    '🕰️': { name: 'Golden Pocket Watch', type: 'junk', description: "It's stopped at 12:00. The casing is pure gold." },
    '🗿': { name: 'Jade Idol', type: 'junk', description: "A heavy statue of a forgotten frog god." },
    '📜m': { name: 'Merchant\'s Ledger', type: 'junk', description: "Detailed trade routes. Bandits would pay for this info." },
    '🧵': { name: 'Spool of Silk', type: 'junk', description: "Fine material from the eastern lands." },
    '💎b': { name: 'Black Pearl', type: 'junk', description: "Found only in the deepest abysses." },
    '💎r': { name: 'Raw Diamond', type: 'junk', description: "Incredibly hard and valuable." },

    // --- LEGENDARY WEAPONS (On-Hit Effects) ---
    '⚡': {
        name: 'Stormbringer',
        type: 'weapon',
        tile: '⚡',
        damage: 5,
        slot: 'weapon',
        description: "{red:+5 Dmg}. Sparks fly from the blade. {blue:(20% chance to cast Chain Lightning on hit)}",
        onHit: 'chainLightning', 
        procChance: 0.20         
    },
    '🩸b': {
        name: 'Bloodthirster',
        type: 'weapon',
        tile: '🩸b',
        damage: 4,
        slot: 'weapon',
        description: "{red:+4 Dmg}. It pulses with a heartbeat. {green:(30% chance to cast Siphon Life on hit)}",
        onHit: 'siphonLife',
        procChance: 0.30
    },
    '❄️w': {
        name: 'Frostmourn',
        type: 'weapon',
        tile: '⚔️',
        damage: 5,
        slot: 'weapon',
        description: "{red:+5 Dmg}. Cold to the touch. {blue:(25% chance to cast Frost Bolt on hit)}",
        onHit: 'frostBolt',
        procChance: 0.25
    },

    // --- ARCHAEOLOGY TOOLS & LOOT ---
    '🥄': { 
        name: 'Shovel',
        type: 'tool',
        tile: '🥄',
        description: "Used to dig up Loose Soil (∴)."
    },
    '🏺a': {
        name: 'Ancient Vase',
        type: 'junk',
        description: "Intact pottery from the First Age. Museums would pay well.",
        tile: '🏺'
    },
    '🗿h': {
        name: 'Stone Head',
        type: 'junk',
        description: "The head of a statue. It looks surprisingly like the King.",
        tile: '🗿'
    },
    '🦴d': {
        name: 'Fossilized Bone',
        type: 'junk',
        description: "A bone from a creature larger than any dragon today.",
        tile: '🦴'
    },

    // --- QUEST RELICS ---
    '💎s': { name: 'Sun Shard', type: 'quest', description: "Warm glowing glass from the Desert.", tile: '💎' },
    '💎m': { name: 'Moon Tear', type: 'quest', description: "A cold gem found in the Swamp.", tile: '💎' },
    '💎v': { name: 'Void Crystal', type: 'quest', description: "It absorbs light. Found in the Mountains.", tile: '💎' },

    // --- SURVIVAL ITEMS ---
    '🫙': {
        name: 'Empty Bottle',
        type: 'consumable',
        description: "Use on water (~/≈) to fill.",
        tile: '🫙',
        effect: (state) => {
            let currentTile;
            if (state.mapMode === 'overworld') {
                currentTile = chunkManager.getTile(state.player.x, state.player.y);
            } else if (state.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[state.currentCaveId];
                currentTile = (map && map[state.player.y] && map[state.player.y][state.player.x]) ? map[state.player.y][state.player.x] : ' ';
            } else if (state.mapMode === 'castle') {
                const map = chunkManager.castleMaps[state.currentCastleId];
                currentTile = (map && map[state.player.y] && map[state.player.y][state.player.x]) ? map[state.player.y][state.player.x] : ' ';
            }

            if (currentTile === '~' || currentTile === '≈' || currentTile === '⛲') {
                logMessage("You fill the bottle.");

                const dirtyWater = { name: 'Dirty Water', type: 'consumable', quantity: 1, tile: '🤢', effect: window.ITEM_DATA['🤢'].effect };
                const existingDirty = state.player.inventory.find(i => i.name === 'Dirty Water');
                if (existingDirty) existingDirty.quantity++;
                else state.player.inventory.push(dirtyWater);

                return true;
            } else {
                logMessage("Stand on water (~/≈) to fill this.");
                return false;
            }
        }
    },
    '💧': {
        name: 'Clean Water',
        type: 'consumable',
        tile: '💧',
        description: "Refreshing. {blue:+40 Thirst}",
        effect: (state) => {
            if (state.player.thirst >= state.player.maxThirst) {
                logMessage("You are not thirsty right now.");
                return false;
            }
            
            const existingBottle = state.player.inventory.find(i => i.name === 'Empty Bottle' && !i.isEquipped);
            
            if (!existingBottle && state.player.inventory.length >= (window.MAX_INVENTORY_SLOTS || 9)) {
                const hasLargeWaterStack = state.player.inventory.some(i => i.name === 'Clean Water' && i.quantity > 1);
                if (hasLargeWaterStack) {
                    logMessage("{red:Your inventory is full. Clear a slot to hold the empty bottle before drinking.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return false; 
                }
            }

            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 40);
            logMessage("Ahhh. Crisp and cold. {blue:(+40 Thirst)}");
            if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue'); 

            if (existingBottle) {
                existingBottle.quantity++;
            } else {
                state.player.inventory.push({ 
                    templateId: '🫙',
                    name: 'Empty Bottle', 
                    type: 'consumable', 
                    quantity: 1, 
                    tile: '🫙',
                    effect: window.ITEM_DATA['🫙'].effect
                });
            }
            
            return true; 
        }
    },
    '🤢': {
        name: 'Dirty Water',
        type: 'consumable',
        tile: '🤢',
        description: "Gross. {blue:+15 Thirst}, but risky.",
        effect: (state) => {
            if (state.player.thirst >= state.player.maxThirst) {
                logMessage("You are not thirsty right now.");
                return false;
            }

            const existingBottle = state.player.inventory.find(i => i.name === 'Empty Bottle' && !i.isEquipped);
            
            if (!existingBottle && state.player.inventory.length >= (window.MAX_INVENTORY_SLOTS || 9)) {
                const hasLargeWaterStack = state.player.inventory.some(i => i.name === 'Dirty Water' && i.quantity > 1);
                if (hasLargeWaterStack) {
                    logMessage("{red:Your inventory is full. Clear a slot to hold the empty bottle before drinking.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return false; 
                }
            }
            
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 15);
            logMessage("You choke it down. {blue:(+15 Thirst)}");
            
            if (Math.random() < 0.2) {
                logMessage("Your stomach churns... {purple:(Poisoned)}");
                state.player.poisonTurns = 3;
            }

            if (existingBottle) {
                existingBottle.quantity++;
            } else {
                state.player.inventory.push({ 
                    templateId: '🫙',
                    name: 'Empty Bottle', 
                    type: 'consumable', 
                    quantity: 1, 
                    tile: '🫙',
                    effect: window.ITEM_DATA['🫙'].effect
                });
            }
            
            return true; 
        }
    },
    '🧪f': {
        name: 'Fire Resistance Potion',
        type: 'consumable',
        tile: '🧪',
        description: "Coats your throat in cooling frost. Immune to Lava/Fire for 50 turns.",
        effect: (state) => {
            if (state.player.fireResistTurns > 0) {
                logMessage("Effect already active.");
                return false;
            }
            state.player.fireResistTurns = 50; 
            logMessage("You feel an icy chill. You are immune to fire! (50 turns)");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "❄️", "#67e8f9");
            return true;
        }
    },
    '🧪w': {
        name: 'Gill Potion',
        type: 'consumable',
        tile: '🧪',
        description: "Grow temporary gills. Allows swimming in Deep Water for 20 turns.",
        effect: (state) => {
            if (state.player.waterBreathingTurns > 0) {
                logMessage("Effect already active.");
                return false;
            }
            state.player.waterBreathingTurns = 20;
            logMessage("You sprout gills! You can dive into deep water. (20 turns)");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "🫧", "#3b82f6");
            return true;
        }
    },

    // --- NEW WEAPONS ---
    '🔱': {
        name: 'Trident',
        type: 'weapon',
        tile: '🔱',
        damage: 4,
        slot: 'weapon',
        description: "{red:+4 Dmg}. Excellent for keeping enemies at bay."
    },
    '🔨h': { 
        name: 'Meteor Hammer',
        type: 'weapon',
        tile: '🔨',
        damage: 7, 
        isTwoHanded: true,
        slot: 'weapon',
        statBonuses: { dexterity: -3 }, 
        description: "{red:+7 Dmg}, {gray:-3 Dex}. A heavy iron ball on a chain. Devastating but unwieldy. (Two-Handed)"
    },
    '🗡️d': {
        name: 'Dragonbone Dagger',
        type: 'weapon',
        tile: '🗡️',
        damage: 4,
        slot: 'weapon',
        statBonuses: { dexterity: 2, luck: 1 },
        description: "{red:+4 Dmg}, {green:+2 Dex}, {gold:+1 Luck}. Carved from the fang of a drake."
    },
    '🗡️m': {
        name: 'Masterwork Dagger',
        type: 'weapon',
        damage: 5,
        slot: 'weapon',
        statBonuses: { dexterity: 2, luck: 1 },
        description: "{red:+5 Dmg}, {green:+2 Dex}, {gold:+1 Luck}. Perfectly balanced."
    },

    // --- DRAGONSCALE SET ---
    '🛡️d': {
        name: 'Dragonscale Shield',
        type: 'armor',
        tile: '🛡️',
        defense: 4,
        slot: 'armor',
        blockChance: 0.30, 
        description: "{blue:+4 Def}. Fashioned from a single massive scale."
    },
    '🧥d': {
        name: 'Dragonscale Tunic',
        type: 'armor',
        tile: '🧥',
        defense: 6,
        slot: 'armor',
        statBonuses: { strength: 1, willpower: 1 }, 
        description: "{blue:+6 Def}, {green:+1 Str}, {purple:+1 Will}. Fireproof and tough."
    },
    '🛡️v': {
        name: 'Void-Shielded Mail',
        type: 'armor',
        defense: 6,
        slot: 'armor',
        statBonuses: { willpower: 2, maxMana: 10 },
        description: "{blue:+6 Def}, {purple:+2 Will, +10 Max Mana}. Absorbs magical impacts."
    },

    // --- NEW CONSUMABLES ---
    '🧪s': {
        name: 'Potion of Speed',
        type: 'buff_potion',
        buff: 'dexterity',
        amount: 5,
        duration: 10,
        tile: '🧪',
        description: "You feel light as a feather. {green:(+5 Dex for 10 turns)}"
    },
    '💣': {
        name: 'Black Powder Bomb',
        type: 'consumable',
        tile: '💣',
        description: "Throw it! Deals 15 damage to a target.",
        effect: (state) => {
            logMessage("{red:BOOM!} The explosion blasts everything nearby! (-5 HP)");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#f97316', 15);
            state.player.health -= 5;
            triggerStatFlash(statDisplays.health, false);
            return true;
        }
    },

    // --- STARTER ARMOR ---
    '👕': {
        name: 'Padded Armor',
        type: 'armor',
        tile: '👕',
        defense: 1,
        slot: 'armor',
        description: "{blue:+1 Def}. Thick layers of cloth. Stops scratches, not swords."
    },
    '👘': {
        name: 'Heavy Robes',
        type: 'armor',
        tile: '👘',
        defense: 0,
        slot: 'armor',
        statBonuses: { maxMana: 5 }, 
        description: "{blue:+5 Max Mana}. Thick wool robes that help focus the mind."
    },

    // --- MONSTER LOOT ---
    '🐀': { name: 'Rat Tail', type: 'junk', description: "Gross, but the apothecary might buy it." },
    '🦇w': { name: 'Bat Wing', type: 'junk', description: "Leathery and thin." },
    '🦷': { name: 'Snake Fang', type: 'junk', description: "Still dripping with venom." },
    '🧣': { name: 'Red Bandana', type: 'junk', description: "Worn by low-level thugs." },

    // --- CLASSIC ARMOR ---
    '⛓️': {
        name: 'Chainmail',
        type: 'armor',
        tile: '⛓️',
        defense: 3, 
        slot: 'armor',
        description: "{blue:+3 Def}. Interlinked steel rings. Noisy but protective."
    },
    '🛡️p': {
        name: 'Plate Armor',
        type: 'armor',
        tile: '🛡️',
        defense: 5, 
        slot: 'armor',
        statBonuses: { dexterity: -2 }, 
        description: "{blue:+5 Def}, {gray:-2 Dex}. A full suit of polished steel plates."
    },
    // --- VALUABLE RELICS ---
    '👑': {
        name: 'Shattered Crown',
        type: 'armor', 
        tile: '👑',
        excludeFromLoot: true, 
        defense: 0,    
        slot: 'armor', 
        statBonuses: { 
            charisma: 5, 
            luck: 3,     
            willpower: 2 
        }, 
        description: "{gold:+5 Cha, +3 Luck}, {purple:+2 Will}. You feel kingly wearing it."
    },
    '👑_restored': {
        name: "Crown of the First King",
        type: "armor",
        tile: "👑",
        defense: 2,
        slot: "armor",
        statBonuses: {
            charisma: 10,
            luck: 5,
            maxMana: 20
        },
        description: "Restored to its former glory. You act with the authority of the Old World.",
        excludeFromLoot: true
    },
    '💍': {
        name: 'Signet Ring',
        type: 'junk',
        description: "Bearing the crest of a fallen house."
    },
    'gold_dust': {
        name: 'Pouch of Gold Dust',
        type: 'junk',
        tile: '💰' 
    },
    'ancient_coin': {
        name: 'Ancient Coin',
        type: 'junk',
        tile: '🪙',
        description: "Minted in an age before the Old King."
    },

    // --- COOKING INGREDIENTS ---
    '🍖': {
        name: 'Raw Meat',
        type: 'junk',
        description: "Bloody and raw. Needs cooking."
    },

    // --- HOMESTEAD ITEMS ---
    '🧱': {
        name: 'Stone Wall',
        type: 'constructible',
        tile: '🧱',
        description: "A solid wall to keep enemies out."
    },
    '▤': { 
        name: 'Wood Floor',
        type: 'constructible',
        tile: '▤',
        description: "Smooth wooden planks. Safe to walk on."
    },
    '+': {
        name: 'Wooden Door',
        type: 'constructible',
        tile: '+',
        description: "A door with a simple latch."
    },
    '☒': {
        name: 'Stash Box',
        type: 'constructible',
        tile: '☒',
        description: "Access your global storage from anywhere you place this."
    },
    '⛵': {
        name: 'Sailing Ship',
        type: 'consumable',
        tile: '⛵',
        description: "A sturdy vessel for crossing Deep Water. Use while standing next to the ocean to deploy.",
        effect: (state) => {
            const dirs = [[0,-1], [0,1], [-1,0], [1,0]];
            for(let [dx, dy] of dirs) {
                const tx = state.player.x + dx;
                const ty = state.player.y + dy;
                
                let t;
                if (state.mapMode === 'overworld') {
                    t = chunkManager.getTile(tx, ty);
                } else if (state.mapMode === 'dungeon') {
                    const map = chunkManager.caveMaps[state.currentCaveId];
                    t = (map && map[ty] && map[ty][tx]) ? map[ty][tx] : ' ';
                } else if (state.mapMode === 'castle') {
                    const map = chunkManager.castleMaps[state.currentCastleId];
                    t = (map && map[ty] && map[ty][tx]) ? map[ty][tx] : ' ';
                }
                
                if (t === '~' || t === '≈') {
                    if (state.mapMode === 'overworld') chunkManager.setWorldTile(tx, ty, '⛵');
                    else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][ty][tx] = '⛵';
                    else chunkManager.castleMaps[state.currentCastleId][ty][tx] = '⛵';
                    
                    logMessage("You deploy the Sailing Ship into the water!");
                    gameState.mapDirty = true;
                    if (typeof render === 'function') render();
                    return true; 
                }
            }
            logMessage("You must be standing directly next to Deep Water or a Swamp to deploy the ship.");
            return false; 
        }
    },
    // --- RARE CONSUMABLES ---
    '🍎': {
        name: 'Golden Apple',
        type: 'consumable',
        tile: '🍎',
        description: "Food of the gods. {gold:Permanently increases Max HP by 1.}",
        effect: (state) => {
            state.player.bonusMaxHealth = (state.player.bonusMaxHealth || 0) + 1;
            state.player.maxHealth += 1;
            state.player.health = state.player.maxHealth;
            logMessage("{gold:You feel divine power course through you! (+1 Max HP)}");
            triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '♥': {
        name: 'Healing Potion',
        type: 'consumable',
        description: "A thick red liquid. {green:+Health}, {blue:+10 Thirst}",
        effect: (state) => {
            if (state.player.health >= state.player.maxHealth && state.player.thirst >= state.player.maxThirst) {
                logMessage("You are already at full health and not thirsty.");
                return false;
            }
            const oldHealth = state.player.health;
            // Use 3 from previous version logic or dynamic amount
            const healAmt = typeof window.HEALING_AMOUNT !== 'undefined' ? window.HEALING_AMOUNT : 3;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + healAmt);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 10); 
            if (state.player.health > oldHealth) {
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            }
            logMessage(`Used a Healing Potion. {green:(+HP)}, {blue:(+10 Thirst)}`);
            return true;
        }
    },
    '🔮': { 
        name: 'Mana Orb',
        type: 'instant', 
        effect: (state, tileId) => {
            const oldMana = state.player.mana;
            const manaAmt = typeof window.MANA_RESTORE_AMOUNT !== 'undefined' ? window.MANA_RESTORE_AMOUNT : 3;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + manaAmt);
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            }
            logMessage('You absorb a Mana Orb!');
        },
        description: "A fragment of a dream given form. It feels insubstantial in your hand."
    },
    'S': {
        name: 'Stamina Crystal',
        type: 'instant', 
        effect: (state, tileId) => {
            const oldStamina = state.player.stamina;
            const stamAmt = typeof window.STAMINA_RESTORE_AMOUNT !== 'undefined' ? window.STAMINA_RESTORE_AMOUNT : 4;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + stamAmt);
            if (state.player.stamina > oldStamina) {
                triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            }
            logMessage(`You shatter a Stamina Crystal!`);
        },
        description: "A jagged green crystal that pulses with a rhythmic light."
    },
    '💜': { 
        name: 'Psyche Shard',
        type: 'instant', 
        effect: (state, tileId) => {
            const oldPsyche = state.player.psyche;
            const psychAmt = typeof window.PSYCHE_RESTORE_AMOUNT !== 'undefined' ? window.PSYCHE_RESTORE_AMOUNT : 2;
            state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + psychAmt);
            if (state.player.psyche > oldPsyche) {
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple'); 
            }
            logMessage('You absorb a Psyche Shard.');
        }
    },
    '📜C': {
        name: 'Mercenary Contract',
        type: 'consumable',
        tile: '📜',
        description: "Hires a Castle Guard to protect you.",
        effect: (state) => {
            if (state.player.companion) {
                logMessage("You already have a companion. Dismiss them first.");
                return false;
            }
            state.player.companion = {
                name: "Hired Guard",
                tile: "G",
                type: "humanoid",
                hp: 30,
                maxHp: 30,
                attack: 4,
                defense: 2
            };
            logMessage("The Guard salutes. 'I will watch your back.'");
            if (typeof playerRef !== 'undefined') playerRef.update({ companion: state.player.companion });
            return true;
        }
    },
    '🍇': { 
        name: 'Wildberry',
        type: 'consumable',
        tile: '🍇', 
        description: "Sweet! {yellow:+5 Hunger}, {blue:+5 Thirst}, {green:+1 HP}",
        effect: (state) => {
            if (state.player.health >= state.player.maxHealth && state.player.hunger >= state.player.maxHunger && state.player.thirst >= state.player.maxThirst) return false;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 1);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 5);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 5);
            logMessage('Sweet! {yellow:(+5 Hunger/Thirst)}, {green:(+1 HP)}');
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🍄': {
        name: 'Bluecap Mushroom',
        type: 'consumable',
        description: "Tastes like dirt. {blue:+1 Mana}, {yellow:+5 Hunger}",
        effect: (state) => {
            if (state.player.mana >= state.player.maxMana && state.player.hunger >= state.player.maxHunger) return false;
            const oldMana = state.player.mana;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 1);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 5); 
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            }
            logMessage('You eat a Bluecap. {blue:(+1 Mana)}, {yellow:(+5 Hunger)}');
            return true;
        }
    },
    '📒': {
        name: 'Tome: Candlelight',
        type: 'spellbook',
        spellId: 'candlelight'
    },
    '📖': {
        name: 'Spellbook: Lesser Heal',
        type: 'spellbook',
        spellId: 'lesserHeal'
    },
    '📚': {
        name: 'Spellbook: Magic Bolt',
        type: 'spellbook',
        spellId: 'magicBolt'
    },
    '📜': {
        name: 'Scroll: Clarity',
        type: 'spellbook',
        spellId: 'clarity'
    },
    '🛡️s': { 
        name: 'Tome of Shielding',
        type: 'spellbook',
        spellId: 'arcaneShield'
    },
    '🔥': {
        name: 'Tome of Fireball',
        type: 'spellbook',
        spellId: 'fireball'
    },
    '🩸': {
        name: 'Scroll of Siphoning',
        type: 'spellbook',
        spellId: 'siphonLife'
    },
    '📘': {
        name: 'Frozen Journal',
        type: 'journal',
        title: 'Frozen Journal',
        content: `Day 12: The cold... it seeps into your bones...`
    },
    
    // --- CRAFTING MATERIALS ---
    '❄️f': { name: 'Yeti Fur', type: 'junk', description: "Thick, warm, and smells like wet dog." },
    '🔥c': { name: 'Elemental Core', type: 'junk', description: "It burns your hands to hold it." },
    '🦑': { name: 'Kraken Ink', type: 'junk', description: "Blacker than the void." },
    '😈': { name: 'Demon Horn', type: 'junk', description: "Vibrates with dark energy." },
    '👁️': { name: 'Basilisk Eye', type: 'junk', description: "Don't look directly at it." },
    '💠': { name: 'Mithril Ore', type: 'junk', tile: '💠', description: "Lighter than steel, harder than dragon bone." },

    '⚔️k': {
        name: 'Blade of the Fallen King',
        type: 'weapon',
        tile: '⚔️',
        excludeFromLoot: true, 
        damage: 10,
        slot: 'weapon',
        statBonuses: { strength: 5, luck: 5 }, 
        description: "{red:+10 Dmg}, {green:+5 Str}, {gold:+5 Luck}. It thirsts for redemption."
    },
    '🛡️a': {
        name: 'Aegis of the Ancients',
        type: 'armor',
        tile: '🛡️',
        excludeFromLoot: true,
        defense: 8,
        slot: 'armor',
        blockChance: 0.50, 
        statBonuses: { constitution: 5 },
        description: "{blue:+8 Def}, {green:+5 Con}. A shield forged by giants."
    },
    '👢w': {
        name: 'Windstrider Boots',
        type: 'armor',
        tile: '👢',
        excludeFromLoot: true,
        defense: 2,
        slot: 'armor',
        statBonuses: { dexterity: 10, endurance: 10 },
        description: "{green:+10 Dex, +10 End}. You feel lighter than air."
    },
    '👑v': {
        name: 'Crown of the Void',
        type: 'armor',
        tile: '👑',
        excludeFromLoot: true, 
        defense: 3,
        slot: 'armor',
        statBonuses: { wits: 10, maxMana: 50 },
        description: "{blue:+50 Max Mana}, {purple:+10 Wits}. The whispers are clear to you now."
    },

    // --- TIER 5 EQUIPMENT (Mithril) ---
    '⛏️d': {
        name: 'Diamond Tipped Pickaxe',
        type: 'tool',
        description: "Can break through the hardest of stones with ease."
    },
    '⚔️m': {
        name: 'Mithril Sword',
        type: 'weapon',
        tile: '⚔️',
        damage: 6,
        slot: 'weapon',
        statBonuses: { dexterity: 2 }, 
        description: "{red:+6 Dmg}, {green:+2 Dex}. Light as a feather, sharp as a razor."
    },
    '🛡️m': {
        name: 'Mithril Mail',
        type: 'armor',
        tile: '🛡️',
        defense: 5,
        slot: 'armor',
        statBonuses: { dexterity: 2, endurance: 2 },
        description: "{blue:+5 Def}, {green:+2 Dex, +2 End}. Shines with a silvery light."
    },

    // --- TIER 6 EQUIPMENT (Void/Demon) ---
    '🗡️v': {
        name: 'Void Blade',
        type: 'weapon',
        tile: '🗡️',
        damage: 8,
        slot: 'weapon',
        statBonuses: { willpower: 3 },
        inflicts: 'madness', 
        inflictChance: 0.2,
        description: "{red:+8 Dmg}, {purple:+3 Will}. Forged from the nothingness between stars."
    },
    '👹': {
        name: 'Demonplate',
        type: 'armor',
        tile: '👹',
        defense: 7,
        slot: 'armor',
        statBonuses: { strength: 4, constitution: -2 }, 
        description: "{blue:+7 Def}, {green:+4 Str}, {red:-2 Con}. Fused with the horns of a Void Demon."
    },

    // --- ACCESSORIES  ---
    '💍r': {
        name: 'Ring of Regeneration',
        type: 'accessory',
        tile: '💍',
        defense: 0,
        slot: 'accessory',
        statBonuses: { constitution: 3, luck: 2 },
        description: "{green:+3 Con}, {gold:+2 Luck}. You can feel your wounds knitting together."
    },
    '🧿': {
        name: 'Amulet of the Magi',
        type: 'accessory',
        tile: '🧿',
        defense: 1,
        slot: 'accessory',
        statBonuses: { wits: 5, maxMana: 10 },
        description: "{blue:+1 Def, +10 Max Mana}, {purple:+5 Wits}. Humming with limitless power."
    },
    '\\': { 
        name: 'Stick',
        type: 'weapon', 
        tile: '\\',
        damage: 1, 
        slot: 'weapon',
        description: "{red:+1 Dmg}. A sturdy branch fallen from an oak tree.",
        excludeFromLoot: true 
    },
    '%': {
        name: 'Leather Tunic',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        description: "{blue:+1 Def}. Boiled leather stitched with sinew."
    },
    // --- SHIELDS ---
    '🛡️w': {
        name: 'Wooden Shield',
        type: 'armor',
        tile: '🛡️',
        defense: 1,
        slot: 'offhand', 
        blockChance: 0.10, 
        description: "{blue:+1 Def}. A splintered plank with a handle."
    },
    '🛡️i': {
        name: 'Iron Heater Shield',
        type: 'armor',
        tile: '🛡️',
        defense: 2,
        slot: 'armor', 
        blockChance: 0.20, 
        description: "{blue:+2 Def}. Sturdy iron protection."
    },
    '!': {
        name: 'Rusty Sword',
        type: 'weapon',
        damage: 2,
        slot: 'weapon',
        description: "{red:+2 Dmg}. The edge is pitted with age."
    },
    '[': {
        name: 'Studded Armor',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        description: "{blue:+2 Def}. Leather reinforced with iron rivets."
    },
    't': {
        name: 'Goblin Totem',
        type: 'junk'
    },
    'p': {
        name: 'Wolf Pelt',
        type: 'junk'
    },
    'i': {
        name: 'Bandit\'s Insignia',
        type: 'junk'
    },
    '(': {
        name: 'Bone Shard',
        type: 'junk'
    },
    '†': { 
        name: 'Bone Dagger',
        type: 'weapon',
        damage: 2, 
        slot: 'weapon',
        description: "{red:+2 Dmg}. Carved from a single femur."
    },
    '¶': { 
        name: 'Bandit Garb',
        type: 'armor',
        defense: 2, 
        slot: 'armor',
        description: "{blue:+2 Def}. Dark grey fabric designed to blend into shadows."
    },
    'U': {
        name: 'Orc Tusk',
        type: 'junk',
        description: "Yellowed and cracked. A brutal trophy."
    },
    '&': {
        name: 'Arcane Dust',
        type: 'junk',
        description: "It glitters like diamond dust, but vanishes if you don't look at it directly."
    },

    // --- TIER 3 GEAR ---
    '⚔️s': { 
        name: 'Steel Sword',
        type: 'weapon',
        tile: '⚔️', 
        damage: 4, 
        slot: 'weapon',
        description: "{red:+4 Dmg}. A soldier's blade. Well-balanced, sharp, and reliable."
    },
    'A': { 
        name: 'Steel Armor',
        type: 'armor',
        defense: 4, 
        slot: 'armor',
        description: "{blue:+4 Def}. Polished plates of steel."
    },
    'Ψ': { 
        name: 'Warlock\'s Staff',
        type: 'weapon',
        damage: 3, 
        slot: 'weapon',
        statBonuses: { willpower: 2 },
        description: "{red:+3 Dmg}, {purple:+2 Will}. The wood is charred black."
    },
    '👘m': {
        name: 'Mage Robe',
        type: 'armor',
        defense: 3, 
        slot: 'armor',
        statBonuses: { wits: 1 },
        description: "{blue:+3 Def}, {purple:+1 Wits}. Silk woven with arcane threads."
    },
    'E': {
        name: 'Frost Essence',
        type: 'junk'
    },
    '❄️b': {
        name: 'Cryo Blade',
        type: 'weapon',
        damage: 3, 
        slot: 'weapon'
    },
    '❄️m': {
        name: 'Frozen Mail',
        type: 'armor',
        defense: 3, 
        slot: 'armor'
    },
    '-': {
        name: 'Machete',
        type: 'tool' 
    },
    'h': {
        name: 'Climbing Tools',
        type: 'tool'
    },
    '★': {
        name: 'Sword of Strength',
        type: 'weapon',
        damage: 3, 
        slot: 'weapon',
        statBonuses: { strength: 2 }
    },
    '☆': {
        name: 'Robe of Wits',
        type: 'armor',
        defense: 2, 
        slot: 'armor',
        statBonuses: { wits: 2 }
    },
    '📕': {
        name: 'Tome of Bracing',
        type: 'skillbook',
        skillId: 'brace'
    },
    '📗': {
        name: 'Manual of Lunge',
        type: 'skillbook',
        skillId: 'lunge'
    },
    '💪': {
        name: 'Tome of Strength',
        type: 'tome',
        stat: 'strength'
    },
    '🧠': {
        name: 'Tome of Wits',
        type: 'tome',
        stat: 'wits'
    },
    '"': {
        name: 'Spider Silk',
        type: 'junk',
        description: "Incredibly strong and sticky. Handle with care."
    },
    'n': {
        name: 'Silk Cowl',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { wits: 1 } 
    },
    'u': {
        name: 'Silk Gloves',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { dexterity: 1 } 
    },
    'q': {
        name: "Bandit's Note",
        type: 'journal',
        title: 'A Crumpled Note',
        content: "The chief is crazy. He says he's hearing whispers from that big fortress to the east.\n\nHe's got us hoarding all this gold... for what? To give to *it*? I'd rather take my chances with the spiders.\n\nI'm taking my share and I'm gone. If anyone finds this, tell my brother I'm headed for the village. - T."
    },
    '📄': {
        name: 'A Scattered Page',
        type: 'random_journal'
    },
    'P': {
        name: 'Reinforced Tunic',
        type: 'armor',
        defense: 3, 
        slot: 'armor',
        statBonuses: { endurance: 1 } 
    },
    '*': {
        name: 'Arcane Blade',
        type: 'weapon',
        damage: 5, 
        slot: 'weapon',
        statBonuses: { wits: 1, willpower: 1 } 
    },
    ']': {
        name: 'Bandit\'s Boots',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { dexterity: 1 } 
    },
    '8': {
        name: 'Orcish Helm',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        statBonuses: { strength: 1 } 
    },
    '9': {
        name: 'Arcane Wraps',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { wits: 2 } 
    },
    '0': {
        name: 'Frozen Greaves',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        statBonuses: { endurance: 1 } 
    },
    '❄️': {
        name: 'Scroll: Frost Bolt',
        type: 'spellbook',
        spellId: 'frostBolt'
    },
    '🌀': {
        name: 'Tome: Psychic Blast',
        type: 'spellbook',
        spellId: 'psychicBlast'
    },
    '😱': {
        name: 'Tome of Madness',
        type: 'skillbook',
        skillId: 'inflictMadness'
    },
    '☣️': {
        name: 'Scroll: Poison Bolt',
        type: 'spellbook',
        spellId: 'poisonBolt'
    },
    '‡': {
        name: 'Poisoned Dagger',
        type: 'weapon',
        damage: 2,
        slot: 'weapon',
        inflicts: 'poison',
        inflictChance: 0.25,  
        statBonuses: { dexterity: 1 }
    },
    '🧪st': {
        name: 'Potion of Strength',
        type: 'buff_potion',
        buff: 'strength',
        amount: 5,
        duration: 5 
    },
    '💀': {
        name: 'Tome: Dark Pact',
        type: 'spellbook',
        spellId: 'darkPact'
    },
    '💔': {
        name: 'Corrupted Relic',
        type: 'junk'
    },
    'j': {
        name: 'Acolyte\'s Scribblings',
        type: 'journal',
        title: 'Acolyte\'s Scribblings',
        content: "He is risen! The folly of the Old King was not his failure, but his *success*.\n\nThe whispers are true. We, the Shadowed Hand, have come to pay tribute. The fortress is the key.\n\nThe shadows gather. We will be rewarded for our faith when He awakens."
    },
    '⛏️': {
        name: 'Pickaxe',
        type: 'tool'
    },
    '•': {
        name: 'Iron Ore',
        type: 'junk'
    },
    '<': {
        name: 'Spike Trap',
        type: 'constructible'
    },
    '¡': {
        name: 'Iron Sword',
        type: 'weapon',
        damage: 3, 
        slot: 'weapon'
    },
    '¦': {
        name: 'Iron Mail',
        type: 'armor',
        defense: 3, 
        slot: 'armor'
    },
    'I': {
        name: 'Iron Helm',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        statBonuses: { constitution: 1 } 
    },
    '▲': {
        name: 'Obsidian Shard',
        type: 'junk'
    },
    '⚔️o': {
        name: 'Obsidian Edge',
        type: 'weapon',
        tile: '🗡️',
        damage: 5, 
        slot: 'weapon',
        statBonuses: { wits: 2 } 
    },
    '🛡️o': {
        name: 'Obsidian Plate',
        type: 'armor',
        tile: '🛡️', 
        defense: 5,
        slot: 'armor',
        statBonuses: { willpower: 2 } 
    },
    '♦': {
        name: 'Heirloom',
        type: 'quest' 
    },
    '🍷': {
        name: 'Elixir of Life',
        type: 'consumable',
        description: "A legendary elixir. {gold:Permanently +5 Max HP.}",
        effect: (state) => {
            state.player.bonusMaxHealth = (state.player.bonusMaxHealth || 0) + 5;
            state.player.maxHealth += 5;
            state.player.health += 5;
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); 
            logMessage("You drink the thick red liquid. {gold:(+5 Max HP)}, {blue:(+20 Thirst)}");
            triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '🧪e': {
        name: 'Elixir of Power',
        type: 'consumable',
        description: "A legendary elixir. {gold:Permanently +5 Max Mana.}",
        effect: (state) => {
            state.player.bonusMaxMana = (state.player.bonusMaxMana || 0) + 5;
            state.player.maxMana += 5;
            state.player.mana += 5;
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20);
            logMessage("You drink the glowing blue liquid. {gold:(+5 Max Mana)}, {blue:(+20 Thirst)}");
            triggerStatAnimation(document.getElementById('manaDisplay'), 'stat-pulse-blue');
            return true;
        }
    },

    // --- DRUID MAGIC ---
    '📜e': {
        name: 'Scroll: Entangle',
        type: 'spellbook',
        spellId: 'entangle'
    },
    '🌵': {
        name: 'Tome: Thorn Skin',
        type: 'spellbook',
        spellId: 'thornSkin'
    },
    '🗝️v': {
        name: 'Void Key',
        type: 'quest', 
        tile: '🗝️',
        description: "It vibrates violently. Simply step on a Void Rift (Ω) to use it."
    },

    // --- THE MULTIVERSE KEYS ---
    '🧭v': {
        name: 'Void Astrolabe',
        type: 'consumable',
        tile: '🧭',
        description: "Tunes the leylines to a parallel dimension. Use it on open ground.",
        effect: (state) => {
            if (state.mapMode !== 'overworld') {
                logMessage("{red:You must be under the open sky to tear reality.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false;
            }

            const newRealmId = Math.floor(Math.random() * 999999) + 1;
            
            const mutatorKeys = Object.keys(window.REALM_MUTATORS);
            const numMutators = Math.random() < 0.2 ? 2 : 1;
            const chosenMutators = [];
            for(let i=0; i<numMutators; i++) {
                chosenMutators.push(mutatorKeys[Math.floor(Math.random() * mutatorKeys.length)]);
            }

            logMessage(`{purple:Reality tears open! You step into Realm #${newRealmId}...}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            state.screenShake = 50;

            state.currentRealm = newRealmId;
            state.realmMutators = chosenMutators;
            
            chosenMutators.forEach(m => logMessage(`{orange:Modifier: ${window.REALM_MUTATORS[m].name} - ${window.REALM_MUTATORS[m].description}}`));

            chunkManager.loadedChunks = {};
            chunkManager.worldState = {};
            Object.values(worldStateListeners).forEach(unsub => unsub());
            worldStateListeners = {};
            if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();
            state.sharedEnemies = {}; 
            state.exploredChunks = new Set(); 

            state.mapDirty = true;
            
            if (typeof playerRef !== 'undefined') {
                playerRef.update({
                    currentRealm: state.currentRealm,
                    realmMutators: state.realmMutators
                });
            }

            return true; 
        }
    },
    '🏠p': {
        name: 'Prime Tuning Fork',
        type: 'consumable',
        tile: '🏠',
        description: "Striking it returns you to Realm 0 (The Prime Overworld).",
        effect: (state) => {
            if (state.currentRealm === 0 || !state.currentRealm) {
                logMessage("{gray:You are already in the Prime Realm.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return false;
            }
            
            logMessage("{cyan:You strike the fork. The familiar hum of the Prime Realm pulls you back.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            state.screenShake = 30;
            state.currentRealm = 0;
            state.realmMutators = [];
            
            chunkManager.loadedChunks = {};
            chunkManager.worldState = {};
            Object.values(worldStateListeners).forEach(unsub => unsub());
            worldStateListeners = {};
            if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();
            state.sharedEnemies = {};
            state.exploredChunks = new Set();
            
            state.mapDirty = true;
            if (typeof playerRef !== 'undefined') {
                playerRef.update({ currentRealm: 0, realmMutators: [] });
            }
            return true;
        }
    },

    // --- ELITE LOOT ---
    '🐺': { 
        name: 'Alpha Pelt',
        type: 'junk' 
    },
    '🏠': {
        name: 'Scroll of Homing',
        type: 'teleport'
    },
    '🗺️': {
        name: 'Tattered Map',
        type: 'treasure_map'
    },
    'x': {
        name: 'Tattered Rags',
        type: 'armor',
        defense: 0, 
        slot: 'armor',
        excludeFromLoot: true
    },
    '1': {
        name: 'Conscript\'s Orders',
        type: 'journal',
        title: 'Crumpled Orders',
        content: "Soldier,\n\nThe fortress has fallen. The King is... changed. Regroup at the safe haven to the west. Do not engage the shadows. Survive at all costs."
    },
    '2': {
        name: 'Thief\'s Map',
        type: 'journal',
        title: 'Scribbled Map',
        content: "Easy job, they said. Just sneak in, grab the relic, sneak out. They didn't mention the walking skeletons. I dropped my lockpick near the entrance. If you're reading this, I'm probably dead."
    },
    '3': {
        name: 'Burned Scroll',
        type: 'journal',
        title: 'Singed Parchment',
        content: "The experiment failed. The rift is unstable. The creatures coming through... they feed on mana. I must warn the Sage. The Old King must not be disturbed."
    },
    '4': {
        name: 'Mad Scrawlings',
        type: 'journal',
        title: 'Dirty Scrap',
        content: "THE EYES. THE EYES IN THE DARK. THEY SEE ME. COLD. SO COLD. STONE IS SAFE. STONE DOES NOT LIE."
    },
    '$': {
        name: 'Gold Coin',
        type: 'instant',
        effect: (state, tileId) => { 
            const seed = stringToSeed(tileId || 'gold'); 
            const random = Alea(seed);

            // Access damage amount safely to avoid errors if script.js loads out of order
            const dmgAmt = typeof window.DAMAGE_AMOUNT !== 'undefined' ? window.DAMAGE_AMOUNT : 2;

            if (random() < 0.05) { 
                state.player.health -= dmgAmt;
                triggerStatFlash(statDisplays.health, false); 
                logMessage(`{red:It was a trap! Lost ${dmgAmt} health!}`);
            } else { 
                const amount = Math.floor(random() * 10) + 1; 
                state.player.coins += amount;
                triggerStatFlash(statDisplays.coins, true); 
                logMessage(`You found {gold:${amount} gold coins!}`);
            }
        }
    },
    '📜1': {
        name: 'Chronicle Vol. I',
        type: 'journal',
        title: 'The First Age: Starlight',
        content: "Before the sun, there was only the stars and the void. The First King was not a man, but a being of pure light who descended to the mountain peaks."
    },
    '📜2': {
        name: 'Chronicle Vol. II',
        type: 'journal',
        title: 'The Second Age: Iron',
        content: "Men learned to forge steel from the dwarves of the deep. The great fortresses were built, not to keep enemies out, but to keep the magic in."
    },
    '📜3': {
        name: 'Chronicle Vol. III',
        type: 'journal',
        title: 'The Third Age: Betrayal',
        content: "The Wizard Council grew jealous of the King's immortality. They whispered to the shadows, and the shadows whispered back."
    },
    '📜4': {
        name: 'Chronicle Vol. IV',
        type: 'journal',
        title: 'The Fourth Age: The Fall',
        content: "The sky turned purple. The dead rose. The King locked himself in the Grand Fortress, but he was already changed. The Golden Age ended in a single night."
    },
    '📜5': {
        name: 'Chronicle Vol. V',
        type: 'journal',
        title: 'Prophecy of the Return',
        content: "It is written: When the five thrones are empty, and the crown is shattered, a traveler from the void will restore the balance."
    },
    '✨': {
        name: 'Unidentified Magic Item',
        type: 'junk', 
        description: "It hums with potential energy."
    }
};

// --- RANDOMIZED LOOT DATA ---
window.LOOT_PREFIXES = {
    "Sharp": { type: 'weapon', bonus: { damage: 1 } },
    "Jagged": { type: 'weapon', bonus: { damage: 2 } },
    "Deadly": { type: 'weapon', bonus: { damage: 3 } },
    "Legendary": { type: 'weapon', bonus: { damage: 4 } },

    "Sturdy": { type: 'armor', bonus: { defense: 1 } },
    "Reinforced": { type: 'armor', bonus: { defense: 2 } },
    "Hardened": { type: 'armor', bonus: { defense: 3 } },
    "Impenetrable": { type: 'armor', bonus: { defense: 4 } },

    "Balanced": { type: 'weapon', bonus: { dexterity: 1 } },
    "Heavy": { type: 'weapon', bonus: { strength: 1 } },
    "Light": { type: 'armor', bonus: { dexterity: 1 } },
};

window.LOOT_SUFFIXES = {
    "of the Bear": { bonus: { strength: 1, constitution: 1 } },
    "of the Wolf": { bonus: { dexterity: 1, strength: 1 } },
    "of the Owl": { bonus: { wits: 2 } },
    "of the Eagle": { bonus: { perception: 2 } },
    "of the Fox": { bonus: { charisma: 2 } },
    "of Vitality": { bonus: { maxHealth: 5 } },
    "of the Titan": { bonus: { strength: 2, defense: 1 } },
    "of Speed": { bonus: { dexterity: 2 } },
    "of Kings": { bonus: { charisma: 1, luck: 1, willpower: 1 } },
    "of the Void": { bonus: { willpower: 2, psyche: 2 } },
    "of Stone": { bonus: { constitution: 2, defense: 1 } }
};


window.SHOP_INVENTORY =[
    { name: 'Healing Potion', price: 25, stock: 10 },
    { name: 'Mana Potion', price: 25, stock: 10 },
    { name: 'Stamina Potion', price: 25, stock: 10 },
    { name: 'Fire Resistance Potion', price: 50, stock: 5 },
    { name: 'Stamina Crystal', price: 15, stock: 20 },
    { name: 'Mana Orb', price: 20, stock: 10 },
    { name: 'Wooden Arrow', price: 2, stock: 50 }, 
    { name: 'Shovel', price: 40, stock: 2 },
    { name: 'Pickaxe', price: 60, stock: 2 },
    { name: 'Machete', price: 50, stock: 2 },
    { name: 'Bag of Flour', price: 5, stock: 20 },
    { name: 'Bird Egg', price: 3, stock: 10 },
    { name: 'Jar of Honey', price: 10, stock: 5 }
];

window.CASTLE_SHOP_INVENTORY =[
    { name: 'Healing Potion', price: 25, stock: 20 },
    { name: 'Mana Potion', price: 25, stock: 20 },
    { name: 'Stamina Potion', price: 25, stock: 20 },
    { name: 'Stamina Crystal', price: 15, stock: 30 },
    { name: 'Mana Orb', price: 20, stock: 20 },
    { name: 'Wooden Arrow', price: 2, stock: 100 }, 
    { name: 'Brass Telescope', price: 300, stock: 1 }, 
    { name: 'Rusty Sword', price: 100, stock: 1 },
    { name: 'Studded Armor', price: 120, stock: 1 },
    { name: 'Scroll: Clarity', price: 250, stock: 1 },
    { name: 'Scroll of Siphoning', price: 400, stock: 1 },
    { name: 'Shovel', price: 40, stock: 2 },
    { name: 'Pickaxe', price: 60, stock: 2 },
    { name: 'Machete', price: 150, stock: 2 },
    { name: 'Climbing Tools', price: 250, stock: 2 },
    { name: 'Bone Dagger', price: 80, stock: 3 },
    { name: 'Silk Cowl', price: 200, stock: 1 },
    { name: 'Bag of Flour', price: 5, stock: 20 },
    { name: 'Bird Egg', price: 3, stock: 10 },
    { name: 'Jar of Honey', price: 10, stock: 5 },
    { name: 'Star-Metal Ore', price: 150, stock: 0 },
    { name: 'Moonbloom Petal', price: 60, stock: 0 }
];

window.TRADER_INVENTORY =[
    { name: 'Golden Apple', price: 2000, stock: 1 },
    { name: 'Elixir of Life', price: 500, stock: 1 },
    { name: 'Elixir of Power', price: 500, stock: 1 },
    { name: 'Cloudseed', price: 1000, stock: 1 },
    { name: 'Void Astrolabe', price: 1500, stock: 1 },
    { name: 'Prime Tuning Fork', price: 500, stock: 1 },
    { name: 'Brass Telescope', price: 300, stock: 1 }, 
    { name: 'Obsidian Shard', price: 200, stock: 3 },
    { name: 'Scroll: Entangle', price: 300, stock: 1 },
    { name: 'Scroll of Homing', price: 150, stock: 2 },
    { name: 'Tattered Map', price: 100, stock: 3 },
    { name: 'Dragon Repellent', price: 500, stock: 1 } 
];

window.LOOT_TABLE_ARCHAEOLOGY =[
    'bone',        
    'bone',        
    'pottery',     
    'arrowhead',   
    'idol',        
    'tome_page'    
];

// --- END OF FILE data-items.js ---
