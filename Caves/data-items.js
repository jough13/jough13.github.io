window.COOKING_RECIPES = {
    "Oracle's Broth": {
        materials: { "Bluecap Mushroom": 2, "Medicinal Herb": 1, "Dirty Water": 1 },
        xp: 25, 
        level: 2 // It's foul, but it opens the mind.
    },
    "Soldier's Last Meal": {
        materials: { "Steak": 2, "Hardtack": 2, "Wheel of Cheese": 1 },
        xp: 60, 
        level: 3 // A heavy meal meant for those who don't expect to return.
    },
    "Void-Salted Fish": {
        materials: { "Raw Fish": 1, "Void Dust": 1 },
        xp: 100, 
        level: 4 // Dangerous to eat, but it fills you with strange energy.
    },
    "Monster Stew": { 
        materials: { "Rat Tail": 2, "Bat Wing": 1, "Clean Water": 1 },
        xp: 20, 
        level: 1 
    },
    "Berry Pie": {
        materials: { "Wildberry": 3, "Bag of Flour": 1, "Jar of Honey": 1 },
        xp: 40, 
        level: 2
    },
    "Traveler's Wrap": {
        materials: { "Steak": 1, "Hardtack": 1, "Wheel of Cheese": 1 },
        xp: 30, 
        level: 2
    },
    "Honey Glazed Ham": {
        materials: { "Raw Meat": 2, "Jar of Honey": 1 },
        xp: 35, 
        level: 2
    },
    "Omelet": {
        materials: { "Bird Egg": 2, "Wheel of Cheese": 1 },
        xp: 20, 
        level: 1
    },
    "Steak": {
        materials: { "Raw Meat": 1 },
        xp: 10, 
        level: 1
    },
    "Grilled Fish": {
        materials: { "Raw Fish": 1 },
        xp: 10, 
        level: 1
    },
    "Berry Juice": {
        materials: { "Wildberry": 3 },
        xp: 5, 
        level: 1
    },
    "Cactus Stew": {
        materials: { "Cactus Fruit": 2, "Raw Meat": 1 },
        xp: 20, 
        level: 2
    },
    "Clean Water": {
        materials: { "Dirty Water": 1 },
        xp: 5, 
        level: 1
    },
    "Hearty Meal": {
        materials: { "Steak": 1, "Grilled Fish": 1, "Wildberry": 1 },
        xp: 50, 
        level: 3
    }
};

window.CRAFTING_RECIPES = {
    "Ancient Key": {
        materials: { "Tablet of the North": 1, "Tablet of the East": 1, "Tablet of the West": 1, "Tablet of the South": 1 },
        xp: 500, 
        level: 1 // No level requirement, it's a puzzle reward
    },

    // --- TIER 0 (Basic Survival) ---
    "Wooden Club": {
        materials: { "Stick": 2 },
        xp: 5, 
        level: 1
    },
    "Fishing Rod": {
        materials: { "Stick": 2, "Spider Silk": 1 },
        xp: 15, 
        level: 1
    },
    "Quarterstaff": {
        materials: { "Stick": 4 },
        xp: 10, 
        level: 1
    },
    "Padded Armor": {
        materials: { "Tattered Rags": 2, "Stick": 1 }, 
        xp: 10, 
        level: 1
    },
    "Wooden Arrow": { 
        materials: { "Stick": 1, "Bone Shard": 1 },
        xp: 15, 
        level: 1, 
        yield: 5 // Creates a stack of 5 arrows!
    },
    
    // --- TIER 1 (Basic Survival) ---
    "Leather Tunic": {
        materials: { "Wolf Pelt": 3 },
        xp: 10, 
        level: 1
    },
    "Bone Dagger": {
        materials: { "Bone Shard": 5, "Stick": 1 },
        xp: 15, 
        level: 1
    },
    "Healing Potion": {
        materials: { "Wildberry": 2, "Cactus Fruit": 1 }, 
        xp: 10, 
        level: 1
    },

    // --- TIER 2 (Apprentice) ---
    "Bandit Garb": {
        materials: { "Bandit's Insignia": 3, "Leather Tunic": 1 },
        xp: 25, 
        level: 2
    },
    "Bandit's Boots": {
        materials: { "Bandit's Insignia": 5, "Wolf Pelt": 2 },
        xp: 20, 
        level: 2
    },
    "Pickaxe": {
        materials: { "Stick": 2, "Orc Tusk": 3 },
        xp: 30, 
        level: 2
    },
    "Machete": {
        materials: { "Bone Dagger": 1, "Stick": 2, "Wolf Pelt": 1 },
        xp: 30, 
        level: 2
    },
    "Spike Trap": {
        materials: { "Iron Ore": 3, "Bone Shard": 3 },
        xp: 20, 
        level: 2
    },

    // --- TIER 3 (Journeyman) ---
    "Iron Sword": {
        materials: { "Iron Ore": 5, "Stick": 1 },
        xp: 40, 
        level: 3
    },
    "Iron Helm": {
        materials: { "Iron Ore": 4, "Wolf Pelt": 1 },
        xp: 35, 
        level: 3
    },
    "Iron Mail": {
        materials: { "Iron Ore": 8, "Leather Tunic": 1 },
        xp: 50, 
        level: 3
    },
    "Poisoned Dagger": {
        materials: { "Bone Dagger": 1, "Spider Silk": 5 },
        xp: 45, 
        level: 3
    },
    "Silk Cowl": {
        materials: { "Spider Silk": 4 },
        xp: 40, 
        level: 3
    },
    "Silk Gloves": {
        materials: { "Spider Silk": 3 },
        xp: 35, 
        level: 3
    },

    // --- TIER 3 (Advanced) ---
    "Reinforced Tunic": {
        materials: { "Leather Tunic": 1, "Iron Ore": 5, "Spider Silk": 2 },
        xp: 60, 
        level: 3
    },
    "Masterwork Dagger": {
        materials: { "Bone Dagger": 1, "Obsidian Shard": 2, "Arcane Dust": 3 },
        xp: 80, 
        level: 3
    },
    "Fisherman's Stew": {
        materials: { "Raw Fish": 2, "Wildberry": 2, "Cactus Fruit": 1 },
        xp: 30, 
        level: 1 
    },
    "Void-Shielded Mail": {
        materials: { "Iron Mail": 1, "Void Dust": 5, "Arcane Dust": 5 },
        xp: 150, 
        level: 4
    },

    // --- TIER 4 (Expert) ---
    "Steel Sword": {
        materials: { "Rusty Sword": 1, "Orc Tusk": 4, "Iron Ore": 2 },
        xp: 60, 
        level: 4
    },
    "Steel Armor": {
        materials: { "Studded Armor": 1, "Orc Tusk": 6 },
        xp: 70, 
        level: 4
    },
    "Warlock's Staff": {
        materials: { "Bone Dagger": 1, "Arcane Dust": 5 },
        xp: 65, 
        level: 4
    },
    "Mage Robe": {
        materials: { "Bandit Garb": 1, "Arcane Dust": 5 },
        xp: 65, 
        level: 4
    },
    "Climbing Tools": {
        materials: { "Stick": 3, "Wolf Pelt": 3, "Bone Shard": 5 },
        xp: 50, 
        level: 4
    },

    // --- TIER 4.5 (Dragon) ---
    "Dragonscale Tunic": {
        materials: { "Dragon Scale": 5, "Leather Tunic": 1 },
        xp: 150, 
        level: 4
    },
    "Dragonbone Dagger": {
        materials: { "Dragon Scale": 2, "Bone Dagger": 1, "Obsidian Shard": 1 },
        xp: 120, 
        level: 4
    },

    // --- TIER 5 (Diamond) ---
    "Diamond Tipped Pickaxe": {
        materials: { "Pickaxe": 1, "Raw Diamond": 2 },
        xp: 200, 
        level: 5
    },

    // --- UTILITY ---
    "Black Powder Bomb": {
        materials: { "Stone": 1, "Elemental Core": 1 }, 
        xp: 50, 
        level: 3
    },

    // --- TIER 4/5 (Special) ---
    "Void Key": {
        materials: { "Void Dust": 5, "Obsidian Shard": 1 },
        xp: 100, 
        level: 4
    },

    // --- TIER 5 (Master) ---
    "Obsidian Edge": {
        materials: { "Obsidian Shard": 3, "Steel Sword": 1, "Arcane Dust": 5 },
        xp: 100, 
        level: 5
    },
    "Obsidian Plate": {
        materials: { "Obsidian Shard": 4, "Steel Armor": 1, "Frost Essence": 3 },
        xp: 120, 
        level: 5
    },
    "Cryo Blade": {
        materials: { "Rusty Sword": 1, "Frost Essence": 5 },
        xp: 90, 
        level: 5
    },
    "Frozen Mail": {
        materials: { "Studded Armor": 1, "Frost Essence": 5 },
        xp: 100, 
        level: 5
    },
    "Arcane Blade": {
        materials: { "Steel Sword": 1, "Arcane Dust": 8 },
        xp: 110, 
        level: 5
    },
    "Mithril Sword": {
        materials: { "Mithril Ore": 5, "Stick": 2 },
        xp: 150, 
        level: 5
    },
    "Mithril Mail": {
        materials: { "Mithril Ore": 8, "Yeti Fur": 2 },
        xp: 180, 
        level: 5
    },

    // --- TIER 6 (Legendary) ---
    "Void Blade": {
        materials: { "Obsidian Edge": 1, "Void Dust": 10, "Demon Horn": 2 },
        xp: 300, 
        level: 6
    },
    "Demonplate": {
        materials: { "Obsidian Plate": 1, "Demon Horn": 5, "Elemental Core": 3 },
        xp: 350, 
        level: 6
    },
    "Amulet of the Magi": {
        materials: { "Gold Coin": 200, "Arcane Dust": 10, "Basilisk Eye": 1 },
        xp: 250, 
        level: 5
    },

    // --- HOMESTEAD ---
    "Stone Wall": {
        materials: { "Stone": 2 },
        xp: 10, 
        level: 1
    },
    "Wood Floor": {
        materials: { "Wood Log": 1 },
        xp: 5, 
        level: 1, 
        yield: 2 
    },
    "Wooden Door": {
        materials: { "Wood Log": 2 },
        xp: 15, 
        level: 1
    },
    "Stash Box": {
        materials: { "Wood Log": 4, "Iron Ore": 1 },
        xp: 50, 
        level: 2
    },

    // --- SURVIVAL GEAR ---
    "Campfire Kit": {
        materials: { "Wood Log": 3, "Stone": 4 },
        xp: 15, 
        level: 1
    },
    "Stick": {
        materials: { "Wood Log": 1 },
        xp: 5, 
        level: 1,
        yield: 4 
    },
    "Torch": {
        materials: { "Stick": 1, "Tattered Rags": 1 },
        xp: 5, 
        level: 1
    }
};

window.ITEM_DATA = {

    'repel': {
        name: 'Dragon Repellent',
        type: 'junk',
        tile: '🧄',
        description: "It smells strongly of garlic and snake oil. It definitely does not work."
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

    // --- NEW ARTIFACTS & PUZZLE ITEMS ---
    '📜l': {
        name: 'Forgotten Letter',
        type: 'random_lore', 
        tile: '📄',
        description: "A crumbling piece of parchment."
    },
    '👓s': {
        name: 'Spirit Lens',
        type: 'tool', 
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
        type: 'armor',
        defense: 0,
        slot: 'armor',
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
        type: 'armor', 
        defense: 2,
        slot: 'armor',
        statBonuses: { intuition: 5, maxMana: 20 },
        description: "{blue:+2 Def, +20 Mana}, {gold:+5 Int}. It hums with the sound of distant waves."
    },
    '🌑': {
        name: 'Void-Touched Ring',
        type: 'armor',
        defense: 0,
        slot: 'armor',
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

    // --- MATERIALS & TRADE GOODS ---
    '💎g': { 
        name: 'Emerald Dust', 
        type: 'junk', 
        description: "Fine green powder used in high-level alchemy." 
    },
    '🦴w': { 
        name: 'Whale Bone', 
        type: 'junk', 
        description: "Incredibly sturdy and light." 
    },
    '📜r': { 
        name: 'Royal Decree', 
        type: 'junk', 
        description: "An old order signed by the King. Historically significant." 
    },
    '🧪p': {
        name: 'Berserker Brew',
        type: 'buff_potion',
        description: "Reduces your defense but doubles your strength. {green:+10 Str}, {red:-5 Def} for 20 turns.",
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
        description: "Contains flint, tinder, and dry wood. Creates a cooking fire.",
        effect: (state) => {
            const currentTile = chunkManager.getTile(state.player.x, state.player.y);

            let valid = false;
            if (state.mapMode === 'overworld' && (currentTile === '.' || currentTile === 'd' || currentTile === 'D')) valid = true;
            if (state.mapMode === 'dungeon') valid = true; 

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
        slot: 'weapon',
        statBonuses: { dexterity: -1 },
        description: "{red:+5 Dmg}, {gray:-1 Dex}. Crushes armor and bone alike."
    },
    '🪓': {
        name: 'Greataxe',
        type: 'weapon',
        tile: '🪓',
        damage: 6, 
        slot: 'weapon',
        statBonuses: { strength: 1, dexterity: -2 },
        description: "{red:+6 Dmg}, {green:+1 Str}, {gray:-2 Dex}. Requires two hands and a lot of rage."
    },
    '🏏': {
        name: 'Wooden Club',
        type: 'weapon',
        tile: '🏏',
        damage: 2, 
        slot: 'weapon',
        description: "{red:+2 Dmg}. A heavy piece of oak. Crude but effective."
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
        slot: 'weapon',
        skillId: 'ranged_attack',
        statBonuses: { dexterity: 1 },
        description: "{red:+2 Dmg}, {green:+1 Dex}. Simple wood and string. Requires Wooden Arrows."
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
        description: "Sweet and sticky. {yellow:+10 Hunger}, {green:+5 Stamina}",
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
    '🐚': { name: 'Rainbow Shell', type: 'junk', description: "It shimmers with every color. Collectors love these." },
    '🕰️': { name: 'Golden Pocket Watch', type: 'junk', description: "It's stopped at 12:00. The casing is pure gold." },
    '🗿': { name: 'Jade Idol', type: 'junk', description: "A heavy statue of a forgotten frog god." },
    '📜m': { name: 'Merchant\'s Ledger', type: 'junk', description: "Detailed trade routes. Bandits would pay for this info." },
    '🧵': { name: 'Spool of Silk', type: 'junk', description: "Fine material from the eastern lands." },
    '💎b': { name: 'Black Pearl', type: 'junk', description: "Found only in the deepest abysses." },
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
    '💎s': { name: 'Sun Shard', type: 'quest', description: "Warm glowing glass from the Desert.", tile: '💎' },
    '💎m': { name: 'Moon Tear', type: 'quest', description: "A cold gem found in the Swamp.", tile: '💎' },
    '💎v': { name: 'Void Crystal', type: 'quest', description: "It absorbs light. Found in the Mountains.", tile: '💎' },
    '🫙': {
        name: 'Empty Bottle',
        type: 'consumable',
        description: "Use on water (~/≈) to fill.",
        tile: '🫙',
        effect: (state) => {
            const currentTile = chunkManager.getTile(state.player.x, state.player.y);

            if (currentTile === '~' || currentTile === '≈' || currentTile === '⛲') {
                logMessage("You fill the bottle.");

                const dirtyWater = { name: 'Dirty Water', type: 'consumable', quantity: 1, tile: '🤢', effect: ITEM_DATA['🤢'].effect };

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
            
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 40);
            logMessage("Ahhh. Crisp and cold. {blue:(+40 Thirst)}");
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');

            const existingBottle = state.player.inventory.find(i => i.name === 'Empty Bottle');
            const waterStack = state.player.inventory.find(i => i.name === 'Clean Water');

            if (existingBottle) {
                existingBottle.quantity++;
                return true; 
            } else if (waterStack && waterStack.quantity === 1) {
                waterStack.name = 'Empty Bottle';
                waterStack.tile = '🫙';
                waterStack.type = 'consumable';
                waterStack.effect = ITEM_DATA['🫙'].effect; 
                return false; 
            } else {
                if (state.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    state.player.inventory.push({ 
                        name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙', effect: ITEM_DATA['🫙'].effect
                    });
                } else {
                    logMessage("No room for the Empty Bottle! It falls to the ground.");
                }
                return true; 
            }
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
            
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 15);
            logMessage("You choke it down. {blue:(+15 Thirst)}");
            
            if (Math.random() < 0.2) {
                logMessage("Your stomach churns... {purple:(Poisoned)}");
                state.player.poisonTurns = 3;
            }

            const existingBottle = state.player.inventory.find(i => i.name === 'Empty Bottle');
            const waterStack = state.player.inventory.find(i => i.name === 'Dirty Water');

            if (existingBottle) {
                existingBottle.quantity++;
                return true; 
            } else if (waterStack && waterStack.quantity === 1) {
                waterStack.name = 'Empty Bottle';
                waterStack.tile = '🫙';
                waterStack.type = 'consumable';
                waterStack.effect = ITEM_DATA['🫙'].effect; 
                return false; 
            } else {
                if (state.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    state.player.inventory.push({ 
                        name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙', effect: ITEM_DATA['🫙'].effect
                    });
                } else {
                    logMessage("No room for the Empty Bottle! It falls to the ground.");
                }
                return true; 
            }
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
    '🐉': { name: 'Dragon Scale', type: 'junk', description: "Warm to the touch and harder than steel." },
    '💎': { name: 'Raw Diamond', type: 'junk', description: "Uncut, but incredibly sharp." },
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
        slot: 'weapon',
        statBonuses: { dexterity: -3 }, 
        description: "{red:+7 Dmg}, {gray:-3 Dex}. A heavy iron ball on a chain. Devastating but unwieldy."
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
        description: "Highly unstable. Do not drop.",
        effect: (state) => {
            logMessage("{red:BOOM!} The explosion blasts everything nearby!");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#f97316', 15);
            state.player.health -= 5;
            triggerStatFlash(statDisplays.health, false);
            return true;
        }
    },
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
    '🐀': { name: 'Rat Tail', type: 'junk', description: "Gross, but the apothecary might buy it." },
    '🦇w': { name: 'Bat Wing', type: 'junk', description: "Leathery and thin." },
    '🦷': { name: 'Snake Fang', type: 'junk', description: "Still dripping with venom." },
    '🧣': { name: 'Red Bandana', type: 'junk', description: "Worn by low-level thugs." },
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
    '👑': {
        name: 'Shattered Crown',
        type: 'armor', 
        tile: '👑',
        defense: 0,    
        slot: 'armor', 
        statBonuses: { charisma: 5, luck: 3, willpower: 2 }, 
        description: "{gold:+5 Cha, +3 Luck}, {purple:+2 Will}. You feel kingly wearing it."
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
    '🍖': {
        name: 'Raw Meat',
        type: 'junk',
        description: "Bloody and raw. Needs cooking."
    },
    '🥩': {
        name: 'Steak',
        type: 'consumable',
        description: "Seared meat. {yellow:+40 Hunger}, {green:+5 HP}",
        effect: (state) => {
            if (state.player.hunger >= state.player.maxHunger && state.player.health >= state.player.maxHealth) return false;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 40);
            logMessage("Savory! {yellow:(+40 Hunger)}, {green:(+5 HP)}");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🍣': {
        name: 'Grilled Fish',
        type: 'consumable',
        description: "Flaky fish. {yellow:+30 Hunger}, {blue:+10 Thirst}",
        effect: (state) => {
            if (state.player.hunger >= state.player.maxHunger && state.player.thirst >= state.player.maxThirst && state.player.stamina >= state.player.maxStamina) return false;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 10);
            logMessage("Tasty! {yellow:(+30 Hunger)}, {blue:(+10 Thirst)}");
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            return true;
        }
    },
    '🥤': {
        name: 'Berry Juice',
        type: 'consumable',
        description: "Sweet and tart. {blue:+20 Thirst}, {purple:+3 Mana}",
        effect: (state) => {
            if (state.player.thirst >= state.player.maxThirst && state.player.mana >= state.player.maxMana) return false;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 3);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); 
            logMessage("Refreshing! {blue:(+20 Thirst)}, {purple:(+3 Mana)}");
            triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            return true;
        }
    },
    '🍲': {
        name: 'Cactus Stew',
        type: 'consumable',
        description: "Spicy and filling. {yellow:+30 Hunger}, {blue:+20 Thirst}, {green:+5 HP}",
        effect: (state) => {
            if (state.player.hunger >= state.player.maxHunger && state.player.thirst >= state.player.maxThirst && state.player.health >= state.player.maxHealth && state.player.stamina >= state.player.maxStamina) return false;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 5);
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30); 
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); 
            logMessage("Hearty and spicy! {yellow:(+30 Hunger)}, {blue:(+20 Thirst)}");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🥘': {
        name: 'Hearty Meal',
        type: 'consumable',
        description: "A feast fit for a king. {gold:Full Restore + Buff}",
        effect: (state) => {
            if (state.player.health >= state.player.maxHealth && state.player.stamina >= state.player.maxStamina && state.player.hunger >= state.player.maxHunger && state.player.thirst >= state.player.maxThirst && state.player.defenseBonusTurns > 0) return false;
            state.player.health = state.player.maxHealth;
            state.player.stamina = state.player.maxStamina;
            state.player.hunger = state.player.maxHunger; 
            state.player.thirst = state.player.maxThirst; 
            state.player.defenseBonus = 1;
            state.player.defenseBonusTurns = 20;
            logMessage("{gold:You feel invincible! (Full Restore + Well Fed)}");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            playerRef.update({ defenseBonus: 1, defenseBonusTurns: 20 });
            return true;
        }
    },
    '🧱': {
        name: 'Stone Wall',
        type: 'constructible',
        tile: '🧱',
        description: "A solid wall to keep enemies out."
    },
    '=': { 
        name: 'Wood Floor',
        type: 'constructible',
        tile: '=',
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
    '🍎': {
        name: 'Golden Apple',
        type: 'consumable',
        tile: '🍎',
        description: "Food of the gods. {gold:Permanently increases Max HP by 1.}",
        effect: (state) => {
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
            state.player.health = Math.min(state.player.maxHealth, state.player.health + HEALING_AMOUNT);
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
        description: "A fragment of a dream given form. It feels insubstantial in your hand.",
        effect: (state, tileId) => {
            const oldMana = state.player.mana;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + MANA_RESTORE_AMOUNT);
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            }
            logMessage('You absorb a Mana Orb!');
        }
    },
    'S': {
        name: 'Stamina Crystal',
        type: 'instant', 
        description: "A jagged green crystal that pulses with a rhythmic light.",
        effect: (state, tileId) => {
            const oldStamina = state.player.stamina;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + STAMINA_RESTORE_AMOUNT);
            if (state.player.stamina > oldStamina) {
                triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            }
            logMessage(`You shatter a Stamina Crystal!`);
        }
    },
    '💜': { 
        name: 'Psyche Shard',
        type: 'instant', 
        effect: (state, tileId) => {
            const oldPsyche = state.player.psyche;
            state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + PSYCHE_RESTORE_AMOUNT);
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
            playerRef.update({ companion: state.player.companion });
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
    '📒': { name: 'Tome: Candlelight', type: 'spellbook', spellId: 'candlelight' },
    '📖': { name: 'Spellbook: Lesser Heal', type: 'spellbook', spellId: 'lesserHeal' },
    '📚': { name: 'Spellbook: Magic Bolt', type: 'spellbook', spellId: 'magicBolt' },
    '📜': { name: 'Scroll: Clarity', type: 'spellbook', spellId: 'clarity' },
    '🛡️s': { name: 'Tome of Shielding', type: 'spellbook', spellId: 'arcaneShield' },
    '🔥': { name: 'Tome of Fireball', type: 'spellbook', spellId: 'fireball' },
    '🩸': { name: 'Scroll of Siphoning', type: 'spellbook', spellId: 'siphonLife' },
    '📘': {
        name: 'Frozen Journal',
        type: 'journal',
        title: 'Frozen Journal',
        content: `Day 12: The cold... it seeps into your bones...`
    },
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
        damage: 10,
        slot: 'weapon',
        statBonuses: { strength: 5, luck: 5 }, 
        description: "{red:+10 Dmg}, {green:+5 Str}, {gold:+5 Luck}. It thirsts for redemption."
    },
    '🛡️a': {
        name: 'Aegis of the Ancients',
        type: 'armor',
        tile: '🛡️',
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
        defense: 3,
        slot: 'armor',
        statBonuses: { wits: 10, maxMana: 50 },
        description: "{blue:+50 Max Mana}, {purple:+10 Wits}. The whispers are clear to you now."
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
    '💍r': {
        name: 'Ring of Regeneration',
        type: 'armor',
        tile: '💍',
        defense: 0,
        slot: 'armor',
        statBonuses: { constitution: 3, luck: 2 },
        description: "{green:+3 Con}, {gold:+2 Luck}. You can feel your wounds knitting together."
    },
    '🧿': {
        name: 'Amulet of the Magi',
        type: 'armor',
        tile: '🧿',
        defense: 1,
        slot: 'armor',
        statBonuses: { wits: 5, maxMana: 10 },
        description: "{blue:+1 Def, +10 Max Mana}, {purple:+5 Wits}. Humming with limitless power."
    },
    '/': {
        name: 'Stick',
        type: 'weapon', 
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
    '🛡️': { 
        name: 'Tome of Shielding',
        type: 'spellbook',
        spellId: 'arcaneShield'
    },
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
    't': { name: 'Goblin Totem', type: 'junk' },
    'p': { name: 'Wolf Pelt', type: 'junk' },
    'i': { name: 'Bandit\'s Insignia', type: 'junk' },
    '(': { name: 'Bone Shard', type: 'junk' },
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
        description: "{blue:+2 Def}. Dark fabric designed to blend into shadows."
    },
    'U': { name: 'Orc Tusk', type: 'junk', description: "Yellowed and cracked. A brutal trophy." },
    '&': { name: 'Arcane Dust', type: 'junk', description: "It glitters like diamond dust." },
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
    'E': { name: 'Frost Essence', type: 'junk' },
    '❄️b': { name: 'Cryo Blade', type: 'weapon', damage: 3, slot: 'weapon' },
    '❄️m': { name: 'Frozen Mail', type: 'armor', defense: 3, slot: 'armor' },
    '-': { name: 'Machete', type: 'tool' },
    'h': { name: 'Climbing Tools', type: 'tool' },
    '★': { name: 'Sword of Strength', type: 'weapon', damage: 3, slot: 'weapon', statBonuses: { strength: 2 } },
    '☆': { name: 'Robe of Wits', type: 'armor', defense: 2, slot: 'armor', statBonuses: { wits: 2 } },
    '📕': { name: 'Tome of Bracing', type: 'skillbook', skillId: 'brace' },
    '📗': { name: 'Manual of Lunge', type: 'skillbook', skillId: 'lunge' },
    '💪': { name: 'Tome of Strength', type: 'tome', stat: 'strength' },
    '🧠': { name: 'Tome of Wits', type: 'tome', stat: 'wits' },
    '"': { name: 'Spider Silk', type: 'junk', description: "Incredibly strong and sticky. Handle with care." },
    'n': { name: 'Silk Cowl', type: 'armor', defense: 1, slot: 'armor', statBonuses: { wits: 1 } },
    'u': { name: 'Silk Gloves', type: 'armor', defense: 1, slot: 'armor', statBonuses: { dexterity: 1 } },
    'q': {
        name: "Bandit's Note",
        type: 'journal',
        title: 'A Crumpled Note',
        content: "The chief is crazy. He says he's hearing whispers from that big fortress to the east.\n\nHe's got us hoarding all this gold... for what? To give to *it*? I'd rather take my chances with the spiders.\n\nI'm taking my share and I'm gone. If anyone finds this, tell my brother I'm headed for the village. - T."
    },
    '📄': { name: 'A Scattered Page', type: 'random_journal' },
    'P': { name: 'Reinforced Tunic', type: 'armor', defense: 3, slot: 'armor', statBonuses: { endurance: 1 } },
    '*': { name: 'Arcane Blade', type: 'weapon', damage: 5, slot: 'weapon', statBonuses: { wits: 1, willpower: 1 } },
    ']': { name: 'Bandit\'s Boots', type: 'armor', defense: 1, slot: 'armor', statBonuses: { dexterity: 1 } },
    '8': { name: 'Orcish Helm', type: 'armor', defense: 2, slot: 'armor', statBonuses: { strength: 1 } },
    '9': { name: 'Arcane Wraps', type: 'armor', defense: 1, slot: 'armor', statBonuses: { wits: 2 } },
    '0': { name: 'Frozen Greaves', type: 'armor', defense: 2, slot: 'armor', statBonuses: { endurance: 1 } },
    '❄️': { name: 'Scroll: Frost Bolt', type: 'spellbook', spellId: 'frostBolt' },
    '🌀': { name: 'Tome: Psychic Blast', type: 'spellbook', spellId: 'psychicBlast' },
    '😱': { name: 'Tome of Madness', type: 'skillbook', skillId: 'inflictMadness' },
    '☣️': { name: 'Scroll: Poison Bolt', type: 'spellbook', spellId: 'poisonBolt' },
    '‡': { name: 'Poisoned Dagger', type: 'weapon', damage: 2, slot: 'weapon', inflicts: 'poison', inflictChance: 0.25, statBonuses: { dexterity: 1 } },
    '🧪st': { name: 'Potion of Strength', type: 'buff_potion', buff: 'strength', amount: 5, duration: 5 },
    '💀': { name: 'Tome: Dark Pact', type: 'spellbook', spellId: 'darkPact' },
    '💔': { name: 'Corrupted Relic', type: 'junk' },
    'j': {
        name: 'Acolyte\'s Scribblings',
        type: 'journal',
        title: 'Acolyte\'s Scribblings',
        content: "He is risen! The folly of the Old King was not his failure, but his *success*.\n\nThe whispers are true. We, the Shadowed Hand, have come to pay tribute. The fortress is the key.\n\nThe shadows gather. We will be rewarded for our faith when He awakens."
    },
    '⛏️': { name: 'Pickaxe', type: 'tool' },
    '•': { name: 'Iron Ore', type: 'junk' },
    '<': { name: 'Spike Trap', type: 'trap' },
    '¡': { name: 'Iron Sword', type: 'weapon', damage: 3, slot: 'weapon' },
    '¦': { name: 'Iron Mail', type: 'armor', defense: 3, slot: 'armor' },
    'I': { name: 'Iron Helm', type: 'armor', defense: 2, slot: 'armor', statBonuses: { constitution: 1 } },
    '▲': { name: 'Obsidian Shard', type: 'junk' },
    '⚔️o': { name: 'Obsidian Edge', type: 'weapon', damage: 5, slot: 'weapon', statBonuses: { wits: 2 } },
    '🛡️o': { name: 'Obsidian Plate', type: 'armor', defense: 5, slot: 'armor', statBonuses: { willpower: 2 } },
    '♦': { name: 'Heirloom', type: 'quest' },
    '🍷': {
        name: 'Elixir of Life',
        type: 'consumable',
        description: "A legendary elixir. {gold:Permanently +5 Max HP.}",
        effect: (state) => {
            state.player.maxHealth += 5;
            state.player.health += 5;
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); 
            logMessage("You drink the thick red liquid. {gold:(+5 Max HP)}, {blue:(+20 Thirst)}");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🧪e': {
        name: 'Elixir of Power',
        type: 'consumable',
        description: "A legendary elixir. {gold:Permanently +5 Max Mana.}",
        effect: (state) => {
            state.player.maxMana += 5;
            state.player.mana += 5;
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20);
            logMessage("You drink the glowing blue liquid. {gold:(+5 Max Mana)}, {blue:(+20 Thirst)}");
            triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            return true;
        }
    },
    '📜e': { name: 'Scroll: Entangle', type: 'spellbook', spellId: 'entangle' },
    '🌵': { name: 'Tome: Thorn Skin', type: 'spellbook', spellId: 'thornSkin' },
    '🗝️v': {
        name: 'Void Key',
        type: 'consumable',
        tile: '🗝️',
        description: "It vibrates violently. Unlocks a Void Rift.",
        effect: (state) => {
            const currentTile = chunkManager.getTile(state.player.x, state.player.y);

            if (currentTile === 'Ω') {
                logMessage("You insert the key into the rift...");
                logMessage("REALITY SHATTERS.");

                state.mapMode = 'dungeon';
                state.currentCaveId = `void_${state.player.x}_${state.player.y}`;
                state.overworldExit = { x: state.player.x, y: state.player.y };

                const voidMap = chunkManager.generateCave(state.currentCaveId);
                state.currentCaveTheme = 'VOID';

                for (let y = 0; y < voidMap.length; y++) {
                    const x = voidMap[y].indexOf('>');
                    if (x !== -1) { state.player.x = x; state.player.y = y; break; }
                }

                const baseEnemies = chunkManager.caveEnemies[state.currentCaveId] || [];
                state.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));

                updateRegionDisplay();
                render();
                syncPlayerState();
                return true; 
            } else {
                logMessage("You must be standing on a Void Rift (Ω) to use this.");
                return false;
            }
        }
    },
    '🐺': { name: 'Alpha Pelt', type: 'junk' },
    '🏠': { name: 'Scroll of Homing', type: 'teleport', description: "Teleports you back to the Village." },
    '🗺️': { name: 'Tattered Map', type: 'treasure_map', description: "Marks a hidden treasure on your minimap." },
    '🍐': {
        name: 'Cactus Fruit',
        type: 'consumable',
        description: "Juicy and hydrating. {yellow:+10 Hunger}, {blue:+15 Thirst}, {green:+5 Stamina}",
        effect: (state) => {
            if (state.player.hunger >= state.player.maxHunger && state.player.thirst >= state.player.maxThirst && state.player.stamina >= state.player.maxStamina) return false;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 10); 
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 15); 
            logMessage('Juicy! {yellow:(+10 Hunger)}, {blue:(+15 Thirst)}, {green:(+5 Stamina)}');
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            return true;
        }
    },
    'x': {
        name: 'Tattered Rags',
        type: 'armor',
        defense: 0,
        slot: 'armor',
        excludeFromLoot: true
    },
    '1': { name: 'Conscript\'s Orders', type: 'journal', title: 'Crumpled Orders', content: "Soldier,\n\nThe fortress has fallen. The King is... changed. Regroup at the safe haven to the west. Do not engage the shadows. Survive at all costs." },
    '2': { name: 'Thief\'s Map', type: 'journal', title: 'Scribbled Map', content: "Easy job, they said. Just sneak in, grab the relic, sneak out. They didn't mention the walking skeletons. I dropped my lockpick near the entrance. If you're reading this, I'm probably dead." },
    '3': { name: 'Burned Scroll', type: 'journal', title: 'Singed Parchment', content: "The experiment failed. The rift is unstable. The creatures coming through... they feed on mana. I must warn the Sage. The Old King must not be disturbed." },
    '4': { name: 'Mad Scrawlings', type: 'journal', title: 'Dirty Scrap', content: "THE EYES. THE EYES IN THE DARK. THEY SEE ME. COLD. SO COLD. STONE IS SAFE. STONE DOES NOT LIE." },
    '$': {
        name: 'Gold Coin',
        type: 'instant',
        effect: (state, tileId) => { 
            const seed = stringToSeed(tileId || 'gold'); 
            const random = Alea(seed);

            if (random() < 0.05) { 
                state.player.health -= DAMAGE_AMOUNT;
                triggerStatFlash(statDisplays.health, false); 
                logMessage(`{red:It was a trap! Lost ${DAMAGE_AMOUNT} health!}`);
            } else { 
                const amount = Math.floor(random() * 10) + 1; 
                state.player.coins += amount;
                triggerStatFlash(statDisplays.coins, true); 
                logMessage(`You found {gold:${amount} gold coins!}`);
            }
        }
    },
    '📜1': { name: 'Chronicle Vol. I', type: 'journal', title: 'The First Age: Starlight', content: "Before the sun, there was only the stars and the void. The First King was not a man, but a being of pure light who descended to the mountain peaks." },
    '📜2': { name: 'Chronicle Vol. II', type: 'journal', title: 'The Second Age: Iron', content: "Men learned to forge steel from the dwarves of the deep. The great fortresses were built, not to keep enemies out, but to keep the magic in." },
    '📜3': { name: 'Chronicle Vol. III', type: 'journal', title: 'The Third Age: Betrayal', content: "The Wizard Council grew jealous of the King's immortality. They whispered to the shadows, and the shadows whispered back." },
    '📜4': { name: 'Chronicle Vol. IV', type: 'journal', title: 'The Fourth Age: The Fall', content: "The sky turned purple. The dead rose. The King locked himself in the Grand Fortress, but he was already changed. The Golden Age ended in a single night." },
    '📜5': { name: 'Chronicle Vol. V', type: 'journal', title: 'Prophecy of the Return', content: "It is written: When the five thrones are empty, and the crown is shattered, a traveler from the void will restore the balance." },
    '👓': {
        name: 'Scholar\'s Spectacles',
        type: 'armor', 
        defense: 1,
        slot: 'armor', 
        statBonuses: { wits: 3, intuition: 2 },
        description: "{purple:+3 Wits, +2 Int}. Relic of a master historian."
    },
    '🌿': {
        name: 'Medicinal Herb',
        type: 'consumable',
        tile: '🌿',
        description: "Bitter but healthy. {green:+2 HP} and cures poison.",
        effect: (state) => {
            if (state.player.health >= state.player.maxHealth && state.player.poisonTurns <= 0) {
                logMessage("You don't need this right now.");
                return false;
            }
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 2);
            if (state.player.poisonTurns > 0) {
                state.player.poisonTurns = 0;
                logMessage("The herb neutralizes the poison in your veins.");
            } else {
                logMessage("You chew the bitter herb. {green:(+2 HP)}");
            }
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '✨': { name: 'Unidentified Magic Item', type: 'junk', description: "It hums with potential energy." },
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


window.SHOP_INVENTORY = [
    { name: 'Healing Potion', price: 25, stock: 10 },
    { name: 'Fire Resistance Potion', price: 50, stock: 5 },
    { name: 'Stamina Crystal', price: 15, stock: 20 },
    { name: 'Mana Orb', price: 20, stock: 10 },
    { name: 'Wooden Arrow', price: 2, stock: 50 }, 
    { name: 'Bag of Flour', price: 5, stock: 20 },
    { name: 'Bird Egg', price: 3, stock: 10 },
    { name: 'Jar of Honey', price: 10, stock: 5 }
];

window.CASTLE_SHOP_INVENTORY = [
    { name: 'Healing Potion', price: 25, stock: 20 },
    { name: 'Stamina Crystal', price: 15, stock: 30 },
    { name: 'Mana Orb', price: 20, stock: 20 },
    { name: 'Wooden Arrow', price: 2, stock: 100 }, 
    { name: 'Rusty Sword', price: 100, stock: 1 },
    { name: 'Studded Armor', price: 120, stock: 1 },
    { name: 'Scroll: Clarity', price: 250, stock: 1 },
    { name: 'Scroll of Siphoning', price: 400, stock: 1 },
    { name: 'Machete', price: 150, stock: 2 },
    { name: 'Climbing Tools', price: 250, stock: 2 },
    { name: 'Bone Dagger', price: 80, stock: 3 },
    { name: 'Silk Cowl', price: 200, stock: 1 },
    { name: 'Bag of Flour', price: 5, stock: 20 },
    { name: 'Bird Egg', price: 3, stock: 10 },
    { name: 'Jar of Honey', price: 10, stock: 5 }
];

window.TRADER_INVENTORY = [
    { name: 'Elixir of Life', price: 500, stock: 1 },
    { name: 'Elixir of Power', price: 500, stock: 1 },
    { name: 'Obsidian Shard', price: 200, stock: 3 },
    { name: 'Scroll: Entangle', price: 300, stock: 1 },
    { name: 'Scroll of Homing', price: 150, stock: 2 },
    { name: 'Tattered Map', price: 100, stock: 3 },
    { name: 'Dragon Repellent', price: 500, stock: 1 } 
];

window.LOOT_TABLE_ARCHAEOLOGY = [
    'bone',        // Common
    'bone',        // Common
    'pottery',     // Uncommon
    'arrowhead',   // Uncommon
    'idol',        // Rare
    'tome_page'    // Very Rare (Lore Item)
];
