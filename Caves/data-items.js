
window.COOKING_RECIPES = {
    "Oracle's Broth": {
        materials: { "Bluecap Mushroom": 2, "Medicinal Herb": 1, "Dirty Water": 1 },
        xp: 25, level: 2 // It's foul, but it opens the mind.
    },
    "Soldier's Last Meal": {
        materials: { "Steak": 2, "Hardtack": 2, "Wheel of Cheese": 1 },
        xp: 60, level: 3 // A heavy meal meant for those who don't expect to return.
    },
    "Void-Salted Fish": {
        materials: { "Raw Fish": 1, "Void Dust": 1 },
        xp: 100, level: 4 // Dangerous to eat, but it fills you with strange energy.
    },
    "Berry Pie": {
        materials: { "Wildberry": 3, "Bag of Flour": 1, "Jar of Honey": 1 },
        xp: 40, level: 2
    },
    "Traveler's Wrap": {
        materials: { "Steak": 1, "Hardtack": 1, "Cheese": 1 },
        xp: 30, level: 2
    },
    "Honey Glazed Ham": {
        materials: { "Raw Meat": 2, "Jar of Honey": 1 },
        xp: 35, level: 2
    },
    "Omelet": {
        materials: { "Bird Egg": 2, "Cheese": 1 },
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
    // Add to window.CRAFTING_RECIPES
"Ancient Key": {
    materials: { "Tablet of the North": 1, "Tablet of the East": 1, "Tablet of the West": 1, "Tablet of the South": 1 },
    xp: 500, level: 1 // No level requirement, it's a puzzle reward
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
        materials: { "Tattered Rags": 2, "Stick": 1 }, // Represents sewing with a needle/stick
        xp: 10, level: 1
    },
    // --- TIER 1 (Basic Survival) ---
    "Leather Tunic": {
        materials: { "Wolf Pelt": 3 },
        xp: 10, level: 1
    },
    "Bone Dagger": {
        materials: { "Bone Shard": 5, "Stick": 1 },
        xp: 15, level: 1
    },
    "Healing Potion": {
        materials: { "Wildberry": 2, "Cactus Fruit": 1 }, // New recipe!
        xp: 10, level: 1
    },

    // --- TIER 2 (Apprentice) ---
    "Bandit Garb": {
        materials: { "Bandit's Insignia": 3, "Leather Tunic": 1 },
        xp: 25, level: 2
    },
    "Bandit's Boots": {
        materials: { "Bandit's Insignia": 5, "Wolf Pelt": 2 },
        xp: 20, level: 2
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
    "Silk Cowl": {
        materials: { "Spider Silk": 4 },
        xp: 40, level: 3
    },
    "Silk Gloves": {
        materials: { "Spider Silk": 3 },
        xp: 35, level: 3
    },
    // --- TIER 3 (Advanced) ---
    "Reinforced Tunic": {
        materials: { "Leather Tunic": 1, "Iron Ore": 5, "Spider Silk": 2 },
        xp: 60, level: 3
    },
    "Masterwork Dagger": {
        materials: { "Bone Dagger": 1, "Obsidian Shard": 2, "Arcane Dust": 3 },
        xp: 80, level: 3
    },
    "Fisherman's Stew": {
        materials: { "Raw Fish": 2, "Wildberry": 2, "Cactus Fruit": 1 },
        xp: 30, level: 1 // Everyone can cook this!
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
    // --- TIER 5 (Diamond) ---
    "Diamond Tipped Pickaxe": {
        materials: { "Pickaxe": 1, "Raw Diamond": 2 },
        xp: 200, level: 5
        // Note: You'd need to update obstacle logic to check for this name if you want it to break harder rocks!
    },
    // --- UTILITY ---
    "Black Powder Bomb": {
        materials: { "Stone": 1, "Fire Elemental Core": 1 }, // Requires killing fire elementals
        xp: 50, level: 3
    },

    // --- TIER 4/5 (Special) ---
    "Void Key": {
        materials: { "Void Dust": 5, "Obsidian Shard": 1 },
        xp: 100, level: 4
    },

    // --- TIER 5 (Master - Needs Rare Mats) ---
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
        xp: 5, level: 1, yield: 2 // Get 2 floors per log
    },
    "Wooden Door": {
        materials: { "Wood Log": 2 },
        xp: 15, level: 1
    },
    "Stash Box": {
        materials: { "Wood Log": 4, "Iron Ore": 1 },
        xp: 50, level: 2
    },
    // --- SURVIVAL GEAR ---
    "Campfire Kit": {
        materials: { "Wood Log": 3, "Stone": 4 },
        xp: 15, level: 1
    },
    // Update Stick to allow crafting from Wood
    "Stick": {
        materials: { "Wood Log": 1 },
        xp: 5, level: 1,
        yield: 4 // (Optional logic: 1 log = 4 sticks? For now, standard 1->1 or change logic later)
    },
    "Torch": {
        materials: { "Stick": 1, "Tattered Rags": 1 },
        xp: 5, level: 1
    },
};

window.ITEM_DATA = {
    // 2. Add these items to your ITEM_DATA
// (Paste this inside your existing window.ITEM_DATA object)
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
    type: 'random_lore', // New type
    tile: '📄',
    description: "A crumbling piece of parchment."
},
'👓s': {
    name: 'Spirit Lens',
    type: 'tool', // Passive effect when in inventory
    tile: '👓',
    description: "Looking through it reveals the echoes of the dead.",
    excludeFromLoot: true // Unique item found via puzzle/quest
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
        description: "An elegant silver ring. The inscription says: 'Until the stars go dark.'"
    },
    '⚔️r': {
        name: 'Rebel\'s Edge',
        type: 'weapon',
        damage: 4,
        slot: 'weapon',
        statBonuses: { strength: 1, dexterity: 1 },
        description: "A notched blade used in the failed coup of the Third Age."
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
        description: "You see everything, but your own thoughts feel distant and cold."
    },
    // --- NEW ARTIFACTS ---
    '🔱o': {
        name: 'Scepter of the Tides',
        type: 'armor', // Accessory slot
        defense: 2,
        slot: 'armor',
        statBonuses: { intuition: 5, maxMana: 20 },
        description: "It hums with the sound of distant waves."
    },
    '🌑': {
        name: 'Void-Touched Ring',
        type: 'armor',
        defense: 0,
        slot: 'armor',
        statBonuses: { willpower: 6, constitution: -2 }, // High power, low health
        description: "The metal feels like it's trying to merge with your finger."
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
        description: "The flame never flickers, even in the strongest wind."
    },

    // --- NEW MATERIALS & TRADE GOODS ---
    '💎g': { name: 'Emerald Dust', type: 'junk', description: "Fine green powder used in high-level alchemy." },
    '🦴w': { name: 'Whale Bone', type: 'junk', description: "Incredibly sturdy and light." },
    '📜r': { name: 'Royal Decree', type: 'junk', description: "An old order signed by the King. Historically significant." },
    '🧪p': {
        name: 'Berserker Brew',
        type: 'consumable',
        description: "Reduces your defense but doubles your strength. (+10 Str, -5 Def for 20 turns)",
        effect: (state) => {
            state.player.strengthBonus = 10;
            state.player.defenseBonus = -5;
            state.player.strengthBonusTurns = 20;
            state.player.defenseBonusTurns = 20;
            logMessage("You feel a reckless rage! (+10 Str, -5 Def)");
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
    '🐟': { // Update existing Raw Fish to be cookable
        name: 'Raw Fish',
        type: 'junk', // Change to 'ingredient' if you add that type, or keep junk
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
        description: "Dry, hard bread. Keeps forever. (+30 Hunger)",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30);
            logMessage("You gnaw on the rock-hard bread. (+30 Hunger)");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '💧f': {
        name: 'Flask of Water',
        type: 'consumable',
        tile: '💧', // Visual icon
        description: "Fresh water. (+30 Thirst)",
        effect: (state) => {
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 30);
            logMessage("Refreshing. (+30 Thirst)");
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
        tile: '🕯️', // Visual icon
        description: "Increases light radius in dark places. Keep in inventory."
    },
    '⛺k': {
        name: 'Campfire Kit',
        type: 'consumable',
        tile: '🔥',
        description: "Contains flint, tinder, and dry wood. Creates a cooking fire.",
        effect: (state) => {
            const currentTile = chunkManager.getTile(state.player.x, state.player.y);

            // Only place on flat ground or dungeon floors
            let valid = false;
            if (state.mapMode === 'overworld' && (currentTile === '.' || currentTile === 'd' || currentTile === 'D')) valid = true;
            if (state.mapMode === 'dungeon') valid = true; // Assume dungeon floor is stone

            if (valid) {
                logMessage("You arrange the stones and light the fire.");

                if (state.mapMode === 'overworld') {
                    chunkManager.setWorldTile(state.player.x, state.player.y, '🔥');
                } else if (state.mapMode === 'dungeon') {
                    chunkManager.caveMaps[state.currentCaveId][state.player.y][state.player.x] = '🔥';
                }

                render(); // Force immediate render
                return true; // CONSUME ITEM
            } else {
                logMessage("You can't build a fire here.");
                return false; // DO NOT CONSUME
            }
        }
    },
    '👻s': {
        name: 'Memory Shard',
        type: 'junk', // Tradeable
        tile: '👻',
        description: "A crystallized fragment of a forgotten memory. The Historian might want this."
    },
    '👢': {
        name: 'Traveler\'s Boots',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { endurance: 2 } // Helps you run further
    },
    '🧥': {
        name: 'Traveler\'s Cloak',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { perception: 2 } // Helps find secrets
    },
    '🧭': {
        name: 'Brass Compass',
        type: 'tool', // Keeps in inventory
        statBonuses: { luck: 1 } // Just having it brings luck
    },
    'vd': {
        name: 'Void Dust',
        type: 'junk', // Sellable for now, crafting later
        description: "A pile of glittering dust that fades in and out of existence.",
        tile: '✨' // Visual representation
    },
    '⚔️l': {
        name: 'Longsword',
        type: 'weapon',
        tile: '⚔️',
        damage: 4, // Tier 3
        slot: 'weapon',
        description: "A versatile steel blade used by knights."
    },
    '🔨': {
        name: 'Warhammer',
        type: 'weapon',
        tile: '🔨',
        damage: 5, // High damage
        slot: 'weapon',
        statBonuses: { dexterity: -1 }, // Heavy!
        description: "Crushes armor and bone alike."
    },
    '🪓': {
        name: 'Greataxe',
        type: 'weapon',
        tile: '🪓',
        damage: 6, // Tier 4
        slot: 'weapon',
        statBonuses: { strength: 1, dexterity: -2 }, // Very heavy
        description: "Requires two hands and a lot of rage."
    },
    '🏏': {
        name: 'Wooden Club',
        type: 'weapon',
        tile: '🏏',
        damage: 2, // Solid starter damage
        slot: 'weapon',
        description: "A heavy piece of oak. Crude but effective."
    },
    '🦯': { // CHANGED key from 'staff' to '🦯'
        name: 'Quarterstaff',
        type: 'weapon',
        tile: '🦯', // CHANGED tile from '/' to '🦯'
        damage: 1,
        defense: 1,
        slot: 'weapon',
        description: "A long pole used by travelers and monks."
    },
    '🏹': {
        name: 'Shortbow',
        type: 'weapon',
        tile: '🏹',
        damage: 2,
        slot: 'weapon',
        statBonuses: { dexterity: 1 },
        description: "Simple wood and string. Good for hunting."
    },

    // --- CULINARY EXPANSION ---
    '🧀': { name: 'Wheel of Cheese', type: 'consumable', description: "A pungent wheel of aged cheese. (+15 Hunger)", effect: (state) => { state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 15); logMessage("It tastes sharp and nutty."); return true; } },
    '🥚': { name: 'Bird Egg', type: 'junk', description: "A speckled egg found in a nest." },
    '🌾': { name: 'Bag of Flour', type: 'junk', description: "Ground wheat. Essential for baking." },
    '🍯': { name: 'Jar of Honey', type: 'consumable', description: "Sweet and sticky. (+10 Hunger, +5 Stamina)", effect: (state) => { state.player.stamina += 5; state.player.hunger += 10; logMessage("Sweet energy!"); triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow'); return true; } },
    '🥧': { name: 'Berry Pie', type: 'consumable', description: "A masterpiece of baking. (+50 Hunger, +10 Psyche)", effect: (state) => { state.player.hunger += 50; state.player.psyche += 10; logMessage("Warm, sweet, and comforting. You feel happier."); triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple'); return true; } },
    '🥙': { name: 'Traveler\'s Wrap', type: 'consumable', description: "Portable and filling. (+40 Hunger, +5 Health)", effect: (state) => { state.player.hunger += 40; state.player.health += 5; logMessage("A solid meal on the go."); triggerStatAnimation(statDisplays.health, 'stat-pulse-green'); return true; } },

    // --- TRADE GOODS ---
    '🐚': { name: 'Rainbow Shell', type: 'junk', description: "It shimmers with every color. Collectors love these." }, // High value
    '🕰️': { name: 'Golden Pocket Watch', type: 'junk', description: "It's stopped at 12:00. The casing is pure gold." },
    '🗿': { name: 'Jade Idol', type: 'junk', description: "A heavy statue of a forgotten frog god." },
    '📜m': { name: 'Merchant\'s Ledger', type: 'junk', description: "Detailed trade routes. Bandits would pay for this info." },
    '🧵': { name: 'Spool of Silk', type: 'junk', description: "Fine material from the eastern lands." },
    '💎b': { name: 'Black Pearl', type: 'junk', description: "Found only in the deepest abysses." },

    // --- LEGENDARY WEAPONS (On-Hit Effects) ---
    '⚡': {
        name: 'Stormbringer',
        type: 'weapon',
        tile: '⚡',
        damage: 5,
        slot: 'weapon',
        description: "Sparks fly from the blade. (20% chance to cast Chain Lightning on hit)",
        onHit: 'chainLightning', // The spell ID
        procChance: 0.20         // 20% chance
    },
    '🧛': {
        name: 'Bloodthirster',
        type: 'weapon',
        tile: '🧛',
        damage: 4,
        slot: 'weapon',
        description: "It pulses with a heartbeat. (30% chance to cast Siphon Life on hit)",
        onHit: 'siphonLife',
        procChance: 0.30
    },
    '❄️w': {
        name: 'Frostmourn',
        type: 'weapon',
        tile: '⚔️',
        damage: 5,
        slot: 'weapon',
        description: "Cold to the touch. (25% chance to cast Frost Bolt on hit)",
        onHit: 'frostBolt',
        procChance: 0.25
    },

    // --- ARCHAEOLOGY TOOLS & LOOT ---
    '🥄': { // Using spoon/shovel icon representation
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
            const currentTile = chunkManager.getTile(state.player.x, state.player.y);

            if (currentTile === '~' || currentTile === '≈' || currentTile === '⛲') {
                logMessage("You fill the bottle.");

                // Add Dirty Water
                const dirtyWater = { name: 'Dirty Water', type: 'consumable', quantity: 1, tile: '🤢', effect: ITEM_DATA['🤢'].effect };

                // Check for existing stack
                const existingDirty = state.player.inventory.find(i => i.name === 'Dirty Water');
                if (existingDirty) existingDirty.quantity++;
                else state.player.inventory.push(dirtyWater);

                // We return true to consume the Empty Bottle
                // The inventory UI update happens in the main function
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
        description: "Refreshing. (+40 Thirst)",
        effect: (state) => {
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 40);
            logMessage("Ahhh. Crisp and cold. (+40 Thirst)");
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-blue'); // Thirst boosts stamina regen indirectly

            const waterStack = state.player.inventory.find(i => i.name === 'Clean Water');

            // Case 1: Last item in stack. Morph it into a bottle.
        if (waterStack && waterStack.quantity === 1) {
            waterStack.name = 'Empty Bottle';
            waterStack.tile = '🫙';
            waterStack.type = 'consumable'; // Ensure type is correct
            // Return FALSE so the engine doesn't delete the item slot
            return false; 
        } 
        // Case 2: Stack > 1. Give a new bottle and consume 1 water.
        else {
            if (state.player.inventory.length < MAX_INVENTORY_SLOTS) {
                state.player.inventory.push({ name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });
            } else {
                logMessage("No room for the Empty Bottle! It falls to the ground.");
                // Optional: chunkManager.setWorldTile(state.player.x, state.player.y, '🫙');
            }
            return true; // Consume 1 water from stack
        }
    }
},
    '🤢': {
        name: 'Dirty Water',
        type: 'consumable',
        tile: '🤢',
        description: "Gross. Small thirst gain, but risky.",
        effect: (state) => {
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 15);
            logMessage("You choke it down. (+15 Thirst)");
            // 20% chance to feel sick (stop regen for a bit)
            if (Math.random() < 0.2) {
                logMessage("Your stomach churns... (Poisoned)");
                state.player.poisonTurns = 3;
            }
            // Return Empty Bottle
            if (state.player.inventory.length < MAX_INVENTORY_SLOTS) {
                state.player.inventory.push({ name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });
            }
        }
    },
    '🧪f': {
        name: 'Fire Resistance Potion',
        type: 'consumable',
        tile: '🧪',
        description: "Coats your throat in cooling frost. Immune to Lava/Fire for 50 turns.",
        effect: (state) => {
            state.player.fireResistTurns = 50; // We need to add this property logic below
            logMessage("You feel an icy chill. You are immune to fire! (50 turns)");
            // Trigger visual effect
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
            state.player.waterBreathingTurns = 20;
            logMessage("You sprout gills! You can dive into deep water. (20 turns)");
            // Optional Visual
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(state.player.x, state.player.y, "🫧", "#3b82f6");
            return true;
        }
    },
    // --- NEW CRAFTING MATERIALS ---
    '🐉': { name: 'Dragon Scale', type: 'junk', description: "Warm to the touch and harder than steel." },
    '💎': { name: 'Raw Diamond', type: 'junk', description: "Uncut, but incredibly sharp." },

    // --- NEW WEAPONS ---
    '🔱': {
        name: 'Trident',
        type: 'weapon',
        tile: '🔱',
        damage: 4,
        slot: 'weapon',
        description: "Excellent for keeping enemies at bay."
    },
    '🔨h': { // Heavy variant
        name: 'Meteor Hammer',
        type: 'weapon',
        tile: '🔨',
        damage: 7, // Very High Damage
        slot: 'weapon',
        statBonuses: { dexterity: -3 }, // Makes you clumsy
        description: "A heavy iron ball on a chain. Devastating but unwieldy."
    },
    '🗡️d': {
        name: 'Dragonbone Dagger',
        type: 'weapon',
        tile: '🗡️',
        damage: 4,
        slot: 'weapon',
        statBonuses: { dexterity: 2, luck: 1 },
        description: "Carved from the fang of a drake. Light and lethal."
    },

    // --- DRAGONSCALE SET (Tier 4.5 - Bridge to Endgame) ---
    '🛡️d': {
        name: 'Dragonscale Shield',
        type: 'armor',
        tile: '🛡️',
        defense: 4,
        slot: 'armor',
        blockChance: 0.30, // 30% Block!
        description: "Fashioned from a single massive scale."
    },
    '🧥d': {
        name: 'Dragonscale Tunic',
        type: 'armor',
        tile: '🧥',
        defense: 6,
        slot: 'armor',
        statBonuses: { strength: 1, willpower: 1 }, // Good for battlemages
        description: "Fireproof and tough."
    },

    // --- NEW CONSUMABLES ---
    '🧪s': {
        name: 'Potion of Speed',
        type: 'buff_potion',
        buff: 'dexterity',
        amount: 5,
        duration: 10,
        tile: '🧪',
        description: "You feel light as a feather. (+5 Dex for 10 turns)"
    },
    '💣': {
        name: 'Black Powder Bomb',
        type: 'consumable',
        tile: '💣',
        description: "Throw it! Deals 15 damage to a target.",
        effect: (state) => {
            // Simple instant "grenade" logic for now
            logMessage("You light the fuse... BOOM! (Deals 15 damage to self if not careful!)");
            // For safety in this version, let's make it a flat AoE around player or self-hit
            // Implementing aiming for items is complex, so let's make it a "Panic Button"
            // hits all adjacent enemies.
            logMessage("The explosion blasts everything nearby!");
            // (You would add AoE logic here similar to Whirlwind)
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
        description: "Thick layers of cloth. Stops scratches, not swords."
    },
    '👘': {
        name: 'Heavy Robes',
        type: 'armor',
        tile: '👘',
        defense: 0,
        slot: 'armor',
        statBonuses: { mana: 5 }, // Good for early mages
        description: "Thick wool robes that help focus the mind."
    },

    // --- NEW MONSTER LOOT ---
    '🐀': { name: 'Rat Tail', type: 'junk', description: "Gross, but the apothecary might buy it." },
    '🦇': { name: 'Bat Wing', type: 'junk', description: "Leathery and thin." },
    '🦷': { name: 'Snake Fang', type: 'junk', description: "Still dripping with venom." },
    '🧣': { name: 'Red Bandana', type: 'junk', description: "Worn by low-level thugs." },

    // --- CLASSIC ARMOR ---
    '⛓️': {
        name: 'Chainmail',
        type: 'armor',
        tile: '⛓️',
        defense: 3, // Tier 3
        slot: 'armor',
        description: "Interlinked steel rings. Noisy but protective."
    },
    '🛡️p': {
        name: 'Plate Armor',
        type: 'armor',
        tile: '🛡️',
        defense: 5, // Tier 4
        slot: 'armor',
        statBonuses: { dexterity: -2 }, // Hard to move
        description: "A full suit of polished steel plates."
    },
    // --- VALUABLE RELICS (Lore/Trade Goods) ---
    '👑': {
        name: 'Shattered Crown',
        type: 'junk', // High value sell item
        description: "The gold is tarnished, but the gems are real."
    },
    '💍': {
        name: 'Signet Ring',
        type: 'junk',
        description: "Bearing the crest of a fallen house."
    },
    'gold_dust': {
        name: 'Pouch of Gold Dust',
        type: 'junk',
        tile: '💰' // Visual tile
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
    '🐟': {
        name: 'Raw Fish',
        type: 'junk',
        description: "Freshly caught. Slimey."
    },
    // --- COOKED FOOD ---
    '🥩': {
        name: 'Steak',
        type: 'consumable',
        description: "Seared meat. (+40 Hunger, +5 HP)",
        effect: (state) => {
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 40);
            logMessage("Savory! (+40 Hunger, +5 HP)");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🍣': {
        name: 'Grilled Fish',
        type: 'consumable',
        description: "Flaky fish. (+30 Hunger, +10 Thirst)", // Fish is hydrating!
        effect: (state) => {
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 10);
            logMessage("Tasty! (+30 Hunger, +10 Thirst)");
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            return true;
        }
    },
    '🥤': {
        name: 'Berry Juice',
        type: 'consumable',
        description: "Sweet and tart. (+20 Thirst, +3 Mana)",
        effect: (state) => {
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 3);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); // <-- NEW
            logMessage("Refreshing! (+20 Thirst, +3 Mana)");
            triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            return true;
        }
    },
    '🍲': {
        name: 'Cactus Stew',
        type: 'consumable',
        description: "Spicy and filling. (+30 Hunger, +20 Thirst, +5 HP)",
        effect: (state) => {
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 5);
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30); // <-- NEW
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); // <-- NEW
            logMessage("Hearty and spicy! (+30 Hunger, +20 Thirst)");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🥘': {
        name: 'Hearty Meal',
        type: 'consumable',
        description: "A feast fit for a king. (Full Restore + Buff)",
        effect: (state) => {
            state.player.health = state.player.maxHealth;
            state.player.stamina = state.player.maxStamina;
            state.player.hunger = state.player.maxHunger; // <-- NEW
            state.player.thirst = state.player.maxThirst; // <-- NEW
            // Grant "Well Fed" buff
            state.player.defenseBonus = 1;
            state.player.defenseBonusTurns = 20;
            logMessage("You feel invincible! (Full Restore + Well Fed)");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            playerRef.update({ defenseBonus: 1, defenseBonusTurns: 20 });
            return true;
        }
    },

    // --- HOMESTEAD ITEMS ---
    '🧱': {
        name: 'Stone Wall',
        type: 'constructible',
        tile: '🧱',
        description: "A solid wall to keep enemies out."
    },
    '=': { // Using equals sign for wood floor planks
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

    // --- RARE CONSUMABLES ---
    '🍎': {
        name: 'Golden Apple',
        type: 'consumable',
        tile: '🍎',
        effect: (state) => {
            state.player.health = state.player.maxHealth;
            state.player.stamina = state.player.maxStamina;
            state.player.mana = state.player.maxMana;
            state.player.hunger = state.player.maxHunger; // <-- NEW
            state.player.thirst = state.player.maxThirst; // <-- NEW
            logMessage("You eat the Golden Apple. You feel revitalized! (Full Restore)");
            triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            return true;
        }
    },
    '+': {
        name: 'Healing Potion',
        type: 'consumable',
        description: "A thick red liquid. (+Health, +10 Thirst)",
        effect: (state) => {
            const oldHealth = state.player.health;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + HEALING_AMOUNT);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 10); // <-- NEW: Hydration
            if (state.player.health > oldHealth) {
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                return true;
            }
            logMessage(`Used a Healing Potion. (+HP, +10 Thirst)`);
        }
    },

    '🔮': { // Was 'o'
        name: 'Mana Orb',
        type: 'consumable',
        effect: (state) => {
            const oldMana = state.player.mana;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + MANA_RESTORE_AMOUNT);
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                return true;
            }
            logMessage('Used a Mana Orb. Restored mana!');
        },
        description: "A fragment of a dream given form. It feels insubstantial in your hand."
    },

    'S': {
        name: 'Stamina Crystal',
        type: 'consumable',
        effect: (state) => {
            const oldStamina = state.player.stamina;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + STAMINA_RESTORE_AMOUNT);
            if (state.player.stamina > oldStamina) {

                triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
                return true;
            }
            logMessage(`Used a Stamina Crystal. Restored ${STAMINA_RESTORE_AMOUNT} stamina!`);
        },
        description: "A jagged green crystal that pulses with a rhythmic light."
    },

    'Y': {
        name: 'Psyche Shard',
        type: 'consumable',
        effect: (state) => {
            const oldPsyche = state.player.psyche;
            state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + PSYCHE_RESTORE_AMOUNT);
            if (state.player.psyche > oldPsyche) {
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple'); // USE NEW FUNCTION
                return true;
            }
            logMessage('Used a Psyche Shard. Restored psyche.');
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
                return;
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
            // Save immediately
            playerRef.update({ companion: state.player.companion });
            return true;
        }
    },
        '🍇': { 
        name: 'Wildberry',
        type: 'consumable',
        tile: '🍇', // Explicit visual tile
        effect: (state) => {
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 1);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 5);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 5);
            logMessage('Sweet! (+5 Hunger/Thirst, +1 HP)');
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🍄': {
        name: 'Bluecap Mushroom',
        type: 'consumable',
        effect: (state) => {
            const oldMana = state.player.mana;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 1);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 5); // <-- NEW: Small snack
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                return true;
            }
            logMessage('You eat a Bluecap. (+1 Mana, +5 Hunger)');
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
    '🛡️': {
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
        damage: 10,
        slot: 'weapon',
        statBonuses: { strength: 5, luck: 5 }, // Massive stats
        description: "The blade hums with a sorrowful song. It thirsts for redemption."
    },
    '🛡️a': {
        name: 'Aegis of the Ancients',
        type: 'armor',
        tile: '🛡️',
        defense: 8,
        slot: 'armor',
        blockChance: 0.50, // 50% Block Chance!
        statBonuses: { constitution: 5 },
        description: "A shield forged by giants. It feels immovable."
    },
    '👢w': {
        name: 'Windstrider Boots',
        type: 'armor',
        tile: '👢',
        excludeFromLoot: true,
        defense: 2,
        slot: 'armor',
        statBonuses: { dexterity: 10, endurance: 10 },
        description: "You feel lighter than air. Movement costs almost nothing."
    },
    '👑v': {
        name: 'Crown of the Void',
        type: 'armor',
        tile: '👑',
        defense: 3,
        slot: 'armor',
        statBonuses: { wits: 10, maxMana: 50 },
        description: "The whispers of the void are clear to you now."
    },
    '🍎g': {
        name: 'Ambrosia',
        type: 'consumable',
        tile: '🍎',
        description: "Food of the gods. Permanently increases Max Health by 1.",
        effect: (state) => {
            state.player.maxHealth += 1;
            state.player.health = state.player.maxHealth;
            logMessage("You feel divine power course through you! (+1 Max HP)");
            triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
            return true;
        }
    },

    // --- TIER 5 EQUIPMENT (Mithril) ---
    '⚔️m': {
        name: 'Mithril Sword',
        type: 'weapon',
        tile: '⚔️',
        damage: 6,
        slot: 'weapon',
        statBonuses: { dexterity: 2 }, // Lightweight
        description: "Light as a feather, sharp as a razor."
    },
    '🛡️m': {
        name: 'Mithril Mail',
        type: 'armor',
        tile: '🛡️',
        defense: 5,
        slot: 'armor',
        statBonuses: { dexterity: 2, endurance: 2 },
        description: "Shines with a silvery light."
    },

    // --- TIER 6 EQUIPMENT (Void/Demon) ---
    '🗡️v': {
        name: 'Void Blade',
        type: 'weapon',
        tile: '🗡️',
        damage: 8,
        slot: 'weapon',
        statBonuses: { willpower: 3 },
        inflicts: 'madness', // Make enemies flee!
        inflictChance: 0.2,
        description: "A blade forged from the nothingness between stars."
    },
    '👹': {
        name: 'Demonplate',
        type: 'armor',
        tile: '👹',
        defense: 7,
        slot: 'armor',
        statBonuses: { strength: 4, constitution: -2 }, // Cursed but strong
        description: "Fused with the horns of a Void Demon."
    },

    // --- ACCESSORIES (New Slot Concept: Equips to Armor slot for now) ---
    '💍r': {
        name: 'Ring of Regeneration',
        type: 'armor',
        tile: '💍',
        defense: 0,
        slot: 'armor',
        statBonuses: { constitution: 3, luck: 2 },
        description: "You can feel your wounds knitting together."
    },
    '🧿': {
        name: 'Amulet of the Magi',
        type: 'armor',
        tile: '🧿',
        defense: 1,
        slot: 'armor',
        statBonuses: { wits: 5, maxMana: 10 },
        description: "Humming with limitless power."
    },
    '/': {
        name: 'Stick',
        type: 'weapon', // A new type
        damage: 1, // It's better than Fists!
        slot: 'weapon',
        description: "A sturdy branch fallen from an oak tree. Better than nothing.",
        excludeFromLoot: true //

    },
    '%': {
        name: 'Leather Tunic',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        description: "Boiled leather stitched with sinew. It smells of cured hide."
    },
    '🛡️': { // Tome of Shielding (Magic) - Keep as is
        name: 'Tome of Shielding',
        type: 'spellbook',
        spellId: 'arcaneShield'
    },
    // --- NEW PHYSICAL SHIELDS ---
    '🛡️w': {
        name: 'Wooden Shield',
        type: 'armor',
        tile: '🛡️',
        defense: 1,
        slot: 'offhand', // Note: You might need to change 'armor' slot logic if you want true dual slots, but for now we can treat it as armor
        blockChance: 0.10, // 10% Block Chance
        description: "A splintered plank with a handle."
    },
    '🛡️i': {
        name: 'Iron Heater Shield',
        type: 'armor',
        tile: '🛡️',
        defense: 2,
        slot: 'armor', // Occupies armor slot for simplicity in current code, or add 'offhand' logic later
        blockChance: 0.20, // 20% Block Chance
        description: "Sturdy iron protection."
    },
    '!': {
        name: 'Rusty Sword',
        type: 'weapon',
        damage: 2,
        slot: 'weapon',
        description: "The edge is pitted with age, but the steel core remains strong."
    },
    '[': {
        name: 'Studded Armor',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        description: "Leather reinforced with iron rivets. Offers decent protection against claws."
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
    '†': { // Dagger symbol
        name: 'Bone Dagger',
        type: 'weapon',
        damage: 2, // Same as Rusty Sword (Tier 2)
        slot: 'weapon',
        description: "Carved from a single femur. It feels unnaturally cold to the touch."
    },
    '¶': { // Pilcrow (paragraph) symbol
        name: 'Bandit Garb',
        type: 'armor',
        defense: 2, // Same as Studded Armor (Tier 2)
        slot: 'armor',
        description: "Dark grey fabric designed to blend into the shadows."
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

    // --- NEW TIER 3 GEAR ---
    '⚔️s': { // Changed from '=' to '⚔️s'
        name: 'Steel Sword',
        type: 'weapon',
        tile: '⚔️', // Use the emoji for visual display
        damage: 4, 
        slot: 'weapon',
        description: "A soldier's blade. Well-balanced, sharp, and reliable."
    },
    'A': { // Using 'A' for Heavy armor
        name: 'Steel Armor',
        type: 'armor',
        defense: 4, // Better than Studded Armor (2)
        slot: 'armor',
        description: "Polished plates of steel. Heavy, but it will turn aside all but the strongest blows."
    },
    'Ψ': { // Psi symbol
        name: 'Warlock\'s Staff',
        type: 'weapon',
        damage: 3, // A good magic-themed weapon
        slot: 'weapon',
        statBonuses: { willpower: 2 },
        description: "The wood is charred black and warm to the touch. It whispers to you."
    },
    'M': { // Using 'M' for Mage robe
        name: 'Mage Robe',
        type: 'armor',
        defense: 3, // Good, but less than Steel
        slot: 'armor',
        statBonuses: { wits: 1 },
        description: "Silk woven with arcane threads. It shimmers in the moonlight."
    },
    'E': {
        name: 'Frost Essence',
        type: 'junk'
    },
    'v': {
        name: 'Cryo Blade',
        type: 'weapon',
        damage: 3, // Tier 2.5 (better than Rusty Sword)
        slot: 'weapon'
    },
    'V': {
        name: 'Frozen Mail',
        type: 'armor',
        defense: 3, // Tier 2.5 (better than Studded Armor)
        slot: 'armor'
    },
    '-': {
        name: 'Machete',
        type: 'tool' // A new type, so it can't be "used" by default
    },
    'h': {
        name: 'Climbing Tools',
        type: 'tool'
    },
    '★': {
        name: 'Sword of Strength',
        type: 'weapon',
        damage: 3, // A solid Tier 2.5 weapon
        slot: 'weapon',
        statBonuses: { strength: 2 }
    },
    '☆': {
        name: 'Robe of Wits',
        type: 'armor',
        defense: 2, // A solid Tier 2.5 armor
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
        statBonuses: { wits: 1 } // Uses our magical item system!
    },
    'u': {
        name: 'Silk Gloves',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { dexterity: 1 } // Uses our magical item system!
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
        defense: 3, // Better than Studded Armor (2)
        slot: 'armor',
        statBonuses: { endurance: 1 } // Give it a small stat bonus
    },
    '*': {
        name: 'Arcane Blade',
        type: 'weapon',
        damage: 5, // Better than Steel Sword (4)
        slot: 'weapon',
        statBonuses: { wits: 1, willpower: 1 } // A great magic-user sword
    },
    ']': {
        name: 'Bandit\'s Boots',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { dexterity: 1 } // Bandits are quick
    },
    '8': {
        name: 'Orcish Helm',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        statBonuses: { strength: 1 } // Orcs are strong
    },
    '9': {
        name: 'Arcane Wraps',
        type: 'armor',
        defense: 1,
        slot: 'armor',
        statBonuses: { wits: 2 } // Good for magic users
    },
    '0': {
        name: 'Frozen Greaves',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        statBonuses: { endurance: 1 } // Good for stamina
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
        inflictChance: 0.25,  // 25% chance on hit
        statBonuses: { dexterity: 1 }
    },
    '🧪': {
        name: 'Potion of Strength',
        type: 'buff_potion',
        buff: 'strength',
        amount: 5,
        duration: 5 // Lasts 5 turns
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
        type: 'trap'
    },
    '¡': {
        name: 'Iron Sword',
        type: 'weapon',
        damage: 3, // Better than Rusty (2), worse than Steel (4)
        slot: 'weapon'
    },
    '¦': {
        name: 'Iron Mail',
        type: 'armor',
        defense: 3, // Better than Studded (2), worse than Steel (4)
        slot: 'armor'
    },
    'I': {
        name: 'Iron Helm',
        type: 'armor',
        defense: 2,
        slot: 'armor',
        statBonuses: { constitution: 1 } // A small toughness boost
    },
    '▲': {
        name: 'Obsidian Shard',
        type: 'junk'
    },
    '⚔️': {
        name: 'Obsidian Edge',
        type: 'weapon',
        damage: 5, // Top tier damage (beats Steel)
        slot: 'weapon',
        statBonuses: { wits: 2 } // Magical sword
    },
    '🛡️': {
        name: 'Obsidian Plate',
        type: 'armor',
        defense: 5, // Top tier defense (beats Steel)
        slot: 'armor',
        statBonuses: { willpower: 2 } // Mental fortification
    },
    '♦': {
        name: 'Heirloom',
        type: 'quest' // A new type, so it can't be sold or used
    },
    '🍷': {
        name: 'Elixir of Life',
        type: 'consumable',
        effect: (state) => {
            state.player.maxHealth += 5;
            state.player.health += 5;
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); // <-- NEW
            logMessage("You drink the thick red liquid. (+Max HP, +20 Thirst)");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '🧪': {
        name: 'Elixir of Power',
        type: 'consumable',
        effect: (state) => {
            state.player.maxMana += 5;
            state.player.mana += 5;
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 20); // <-- NEW
            logMessage("You drink the glowing blue liquid. (+Max Mana, +20 Thirst)");
            triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            return true;
        }
    },

    // --- DRUID MAGIC ---
    '🌿': {
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
        type: 'consumable',
        tile: '🗝️',
        description: "It vibrates violently. Unlocks a Void Rift.",
        effect: (state) => {
            const currentTile = chunkManager.getTile(state.player.x, state.player.y);

            if (currentTile === 'Ω') {
                logMessage("You insert the key into the rift...");
                logMessage("REALITY SHATTERS.");

                // --- TELEPORT TO VOID ---
                state.mapMode = 'dungeon';
                state.currentCaveId = `void_${state.player.x}_${state.player.y}`;
                state.overworldExit = { x: state.player.x, y: state.player.y };

                // Generate the Void
                const voidMap = chunkManager.generateCave(state.currentCaveId);
                state.currentCaveTheme = 'VOID';

                // Find entrance ('>')
                for (let y = 0; y < voidMap.length; y++) {
                    const x = voidMap[y].indexOf('>');
                    if (x !== -1) { state.player.x = x; state.player.y = y; break; }
                }

                // Setup enemies
                const baseEnemies = chunkManager.caveEnemies[state.currentCaveId] || [];
                state.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));

                updateRegionDisplay();
                render();
                syncPlayerState();
                return true; // Consume Key
            } else {
                logMessage("You must be standing on a Void Rift (Ω) to use this.");
                return false;
            }
        }
    },
    // --- ELITE LOOT ---
    '🐺': { // Using the wolf icon for the pelt bundle
        name: 'Alpha Pelt',
        type: 'junk' // Valuable sell item
    },
    '🏠': {
        name: 'Scroll of Homing',
        type: 'teleport'
    },
    '🗺️': {
        name: 'Tattered Map',
        type: 'treasure_map'
    },
    '🍐': {
        name: 'Cactus Fruit',
        type: 'consumable',
        description: "Juicy and hydrating. (+10 Hunger, +15 Thirst, +5 Stamina)",
        effect: (state) => {
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 10); // <-- NEW
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 15); // <-- NEW
            logMessage('Juicy! (+10 Hunger, +15 Thirst, +5 Stamina)');
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            return true;
        }
    },
    'x': {
        name: 'Tattered Rags',
        type: 'armor',
        defense: 0, // Provides no protection!
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
        effect: (state, tileId) => { // <-- ADD tileId
            // Create a deterministic result based on the tile's location
            const seed = stringToSeed(tileId || 'gold'); // Use tileId as seed
            const random = Alea(seed);

            if (random() < 0.05) { // 5% chance of being a trap (now deterministic)
                state.player.health -= DAMAGE_AMOUNT;
                triggerStatFlash(statDisplays.health, false); // Flash red
                logMessage(`It was a trap! Lost ${DAMAGE_AMOUNT} health!`);
            } else { // 95% chance of being a reward
                const amount = Math.floor(random() * 10) + 1; // 1 to 10 coins (now deterministic)
                state.player.coins += amount;
                triggerStatFlash(statDisplays.coins, true); // Flash green
                logMessage(`You found ${amount} gold coins!`);
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
    '👓': {
        name: 'Scholar\'s Spectacles',
        type: 'armor', // Accessory slot really
        defense: 1,
        slot: 'armor', // Takes armor slot for now
        statBonuses: { wits: 3, intuition: 2 },
        description: "Relic of a master historian. Reveals the world's secrets."
    },
    '🌿': {
        name: 'Medicinal Herb',
        type: 'consumable',
        tile: '🌿',
        effect: (state) => {
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 2);
            // Cures Poison!
            if (state.player.poisonTurns > 0) {
                state.player.poisonTurns = 0;
                logMessage("The herb neutralizes the poison in your veins.");
            } else {
                logMessage("You chew the bitter herb. (+2 HP)");
            }
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            return true;
        }
    },
    '✨': {
        name: 'Unidentified Magic Item',
        type: 'junk', // Temporary type until picked up
        description: "It hums with potential energy."
    },
    // --- VOID ITEMS ---
    '🗝️v': {
        name: 'Void Key',
        type: 'consumable', // Used on the rift
        tile: '🗝️',
        description: "It vibrates violently. Unlocks a Void Rift.",
        effect: (state) => {
            // Logic is handled in the main useInventoryItem function
            logMessage("Stand on a Void Rift (Ω) and use this to enter.");
            return true;
        }
    },
    'vd': {
        name: 'Void Dust',
        type: 'junk',
        tile: '✨',
        description: "Remains of a creature that shouldn't exist."
    },
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


window.SHOP_INVENTORY = [{
    name: 'Healing Potion',
    price: 25,
    stock: 10 // How many the shop has
},
{
    name: 'Fire Resistance Potion',
    price: 50,
    stock: 5
},
{
    name: 'Stamina Crystal',
    price: 15,
    stock: 20
},
{
    name: 'Mana Orb',
    price: 20,
    stock: 10
},
{
    name: 'Bag of Flour', // NEW
    price: 5,
    stock: 20
},
{
    name: 'Bird Egg', // NEW
    price: 3,
    stock: 10
},
{
    name: 'Jar of Honey', // NEW
    price: 10,
    stock: 5
}
];

window.CASTLE_SHOP_INVENTORY = [{
    name: 'Healing Potion',
    price: 25,
    stock: 20 // Castles have more stock
},
{
    name: 'Stamina Crystal',
    price: 15,
    stock: 30
},
{
    name: 'Mana Orb',
    price: 20,
    stock: 20
},
{
    name: 'Rusty Sword',
    price: 100, // This is a Tier 2 item
    stock: 1
},
{
    name: 'Studded Armor',
    price: 120, // This is a Tier 2 item
    stock: 1
},
{
    name: 'Scroll: Clarity',
    price: 250, // Make it a valuable purchase
    stock: 1    // Limited stock
},
{
    name: 'Scroll of Siphoning',
    price: 400, // This is a powerful Lvl 4 spell
    stock: 1
},
{
    name: 'Machete',
    price: 150,
    stock: 2
},
{
    name: 'Climbing Tools',
    price: 250,
    stock: 2
},
{
    name: 'Bone Dagger',
    price: 80,
    stock: 3
},
{
    name: 'Silk Cowl',
    price: 200, // It's magical, so it's pricey
    stock: 1
},
{
    name: 'Bag of Flour', // NEW
    price: 5,
    stock: 20
},
{
    name: 'Bird Egg', // NEW
    price: 3,
    stock: 10
},
{
    name: 'Jar of Honey', // NEW
    price: 10,
    stock: 5
}
];

window.TRADER_INVENTORY = [
    { name: 'Elixir of Life', price: 500, stock: 1 },
    { name: 'Elixir of Power', price: 500, stock: 1 },
    { name: 'Obsidian Shard', price: 200, stock: 3 },
    { name: 'Scroll: Entangle', price: 300, stock: 1 },
    { name: 'Scroll of Homing', price: 150, stock: 2 },
    { name: 'Tattered Map', price: 100, stock: 3 }
];

// 1. Define the Archaeology Loot Table
window.LOOT_TABLE_ARCHAEOLOGY = [
    'bone',        // Common
    'bone',        // Common
    'pottery',     // Uncommon
    'arrowhead',   // Uncommon
    'idol',        // Rare
    'tome_page'    // Very Rare (Lore Item)
];

