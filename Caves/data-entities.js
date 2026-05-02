window.PLAYER_RACES = {
    'human': {
        name: 'Human',
        description: "Versatile and ambitious. They adapt to any situation.",
        stats: { charisma: 1, luck: 1, endurance: 1 }, // Jack of all trades
        icon: '👨'
    },
    'elf': {
        name: 'Elf',
        description: "Ancient and keen-eyed. Magic flows through their veins.",
        stats: { wits: 2, perception: 1 }, // Magic/Scouting focus
        icon: '🧝'
    },
    'dwarf': {
        name: 'Dwarf',
        description: "Stout and unyielding. Born of stone and steel.",
        stats: { constitution: 2, strength: 1 }, // Tank focus
        icon: '🧔'
    },
    'orc': {
        name: 'Orc',
        description: "Fierce and mighty. Glory is earned in blood.",
        stats: { strength: 2, endurance: 1 }, // Melee damage focus
        icon: '👹'
    },
    'halfling': {
        name: 'Halfling',
        description: "Small, quiet, and incredibly lucky.",
        stats: { dexterity: 2, luck: 1 }, // Stealth/Crit focus
        icon: '🦶'
    }
};

window.QUEST_DATA = {
    "healerSupply": {
        title: "Herbal Remedies",
        description: "The Healer is running low on supplies. Gather 5 Medicinal Herbs ('🌿') from the swamp.",
        type: 'collect',
        itemNeeded: 'Medicinal Herb',
        needed: 5,
        reward: {
            xp: 200,
            coins: 50,
            item: 'Healing Potion', 
            itemQty: 3
        }
    },
    "banditChief": {
        title: "Wanted: The Chief",
        description: "The Bandit Chief ('C') has been spotted in the fortresses. Put an end to his reign.",
        type: 'kill', 
        enemy: 'C',   
        needed: 1,
        reward: {
            xp: 500,
            coins: 300,
            item: 'Steel Sword',
            itemQty: 1
        }
    },
    "goblinHeirloom": {
        title: "The Lost Heirloom",
        description: "A villager is distraught. A goblin ('g') stole their family heirloom!",
        type: 'fetch',
        enemy: 'g',
        itemNeeded: 'Heirloom',
        itemTile: '♦',
        reward: {
            xp: 150,
            coins: 100
        }
    },
    "goblinTrophies": {
        title: "Goblin Trophies",
        description: "A Lost Prospector ('K') is tired of being harassed. He'll reward you for clearing out 10 Goblin Totems.",
        type: 'collect',
        itemNeeded: 'Goblin Totem',
        needed: 10,
        reward: {
            xp: 200,
            coins: 150
        }
    },
    "orcHunt": {
        title: "Bounty: Orc Hunt",
        description: "The brutes are getting bold. Put them down.",
        enemy: 'o',
        needed: 8,
        reward: {
            xp: 150,
            coins: 100
        }
    },
    "mageMenace": {
        title: "Bounty: Mage Menace",
        description: "Apprentice mages are experimenting in the wild. Stop them before they burn something down.",
        enemy: 'm',
        needed: 5,
        reward: {
            xp: 180,
            coins: 120
        }
    },
    "draugrProblems": {
        title: "Bounty: Draugr Problems",
        description: "The Draugr are walking again. Send them back to their graves.",
        enemy: 'Z',
        needed: 5,
        reward: {
            xp: 200,
            coins: 150
        }
    },
    "acolyteHunt": {
        title: "Bounty: Shadow Acolytes",
        description: "Strange, robed figures have been spotted in the crypts. Clear them out.",
        enemy: 'a', 
        needed: 10,
        reward: {
            xp: 150,
            coins: 100
        }
    },
    "spiderHunt": {
        title: "Bounty: Spider Nest",
        description: "The caves are crawling with giant spiders. Clear out the nests.",
        enemy: '@', 
        needed: 12,
        reward: {
            xp: 120,
            coins: 80
        }
    },
    "wolfHunt": {
        title: "Bounty: Wolf Hunt",
        description: "The local shepherds are plagued by wolves. Thin their numbers.",
        enemy: 'w', 
        needed: 10,
        reward: {
            xp: 100,
            coins: 50
        }
    },
    "goblinHunt": {
        title: "Bounty: Goblin Hunt",
        description: "Goblins are multiplying in the nearby caves. Clear them out.",
        enemy: 'g', 
        needed: 15, 
        reward: {
            xp: 75,
            coins: 30
        }
    },
    "skeletonScourge": {
        title: "Bounty: Skeleton Scourge",
        description: "Restless dead are rising. Put them back to rest.",
        enemy: 's', 
        needed: 10,
        reward: {
            xp: 100,
            coins: 50
        }
    },
    "banditCleanup": {
        title: "Bounty: Bandit Cleanup",
        description: "Bandits have been waylaying travelers. Bring them to justice.",
        enemy: 'b', 
        needed: 12,
        reward: {
            xp: 120,
            coins: 75
        }
    }
};

window.ENEMY_PREFIXES = {
    "Savage": {
        description: "Deals extra damage.",
        statModifiers: { attack: 2 },
        xpMult: 1.2,
        color: '#ef4444' // Red-ish
    },
    "Armored": {
        description: "Harder to hit.",
        statModifiers: { defense: 2 },
        xpMult: 1.2,
        color: '#9ca3af' // Grey
    },
    "Swift": {
        description: "Harder to hit and moves fast.",
        statModifiers: { defense: 1 }, // Simulates dodging
        xpMult: 1.1,
        color: '#facc15' // Yellow
    },
    "Massive": {
        description: "A giant among its kind.",
        statModifiers: { maxHealth: 10, attack: 1 },
        xpMult: 1.5,
        color: '#ea580c' // Orange
    },
    "Plagued": {
        description: "Carries disease.",
        statModifiers: { maxHealth: 5 },
        special: 'poison',
        xpMult: 1.3,
        color: '#22c55e' // Green
    },
    "Spectral": {
        description: "Hard to hurt with physical weapons.",
        statModifiers: { defense: 3, maxHealth: -5 }, // High def, low HP
        xpMult: 1.4,
        color: '#a855f7' // Purple
    }
};

window.ENEMY_DATA = {
    // --- LEVEL 1 (Vermin & Weaklings) ---
    'r': {
        name: 'Giant Rat',
        maxHealth: 3, attack: 1, defense: 0, xp: 4,
        loot: '🐀', 
        color: '#a8a29e', // Grey
        flavor: "It hisses and bares yellow teeth."
    },
    '🦇': {
        name: 'Giant Bat',
        maxHealth: 2, attack: 1, defense: 0, xp: 5,
        loot: '🦇', 
        color: '#52525b', // Dark Grey
        flavor: "It swoops down from the darkness!"
    },
    '🐍': {
        name: 'Viper',
        maxHealth: 4, attack: 2, defense: 0, xp: 8,
        loot: '🦷', 
        color: '#22c55e', // Green
        inflicts: 'poison', inflictChance: 0.2,
        flavor: "Its scales blend perfectly with the undergrowth."
    },
    'R': {
        name: 'Bandit Recruit',
        maxHealth: 5, attack: 2, defense: 0, xp: 10,
        loot: '🧣', 
        color: '#fca5a5', // Light red
        excludeFromLoot: true, // Prevent them dropping Tier 4 gear in deep wilds
        flavor: "He looks nervous, holding his dagger with shaking hands."
    },

    // --- DESERT WILDLIFE ---
    '🦂s': { 
        name: 'Sand Scorpion',
        maxHealth: 5, attack: 2, defense: 1, xp: 8,
        loot: '🦷',
        color: '#d97706', // Amber
        inflicts: 'poison', inflictChance: 0.3,
        flavor: "It burrows in the sand, waiting."
    },
    '🐍c': { 
        name: 'King Cobra',
        maxHealth: 15, attack: 5, defense: 0, xp: 30,
        loot: '🦷',
        color: '#eab308', // Yellow/Gold
        inflicts: 'poison', inflictChance: 0.5,
        flavor: "It rears up, hood flared, hissing loudly."
    },

    // --- SWAMP WILDLIFE ---
    '🐸': {
        name: 'Giant Toad',
        maxHealth: 20, attack: 3, defense: 0, xp: 25,
        loot: '🍖', 
        color: '#15803d', // Slimy dark green
        flavor: "It looks at you with unblinking, bulbous eyes."
    },
    '🦟': {
        name: 'Blood Mosquito',
        maxHealth: 2, attack: 1, defense: 5, 
        xp: 10,
        loot: 'vd',
        color: '#be123c', // Blood red
        flavor: "An annoying, high-pitched whine follows it."
    },

    // --- AQUATIC WILDLIFE ---
    '🦈': {
        name: 'Great Shark',
        maxHealth: 25, attack: 6, defense: 1, xp: 35,
        loot: '🐟', 
        color: '#94a3b8', // Slate Gray
        flavor: "A massive dorsal fin slices through the water towards your canoe."
    },
    '🦀': {
        name: 'Giant Crab',
        maxHealth: 18, attack: 4, defense: 5, xp: 25,
        loot: '🍖',
        color: '#ea580c', // Orange
        flavor: "Its claws are easily strong enough to snap an oar in half."
    },
    '🦑': {
        name: 'Kraken',
        maxHealth: 200, attack: 12, defense: 4, xp: 800,
        loot: '🐙', 
        color: '#7c3aed', // Purple
        isBoss: true,
        inflicts: 'root', inflictChance: 0.5,
        caster: true, castRange: 4, spellDamage: 8,
        flavor: "Massive, writhing tentacles burst from the deep ocean!"
    },

    // --- FOREST WILDLIFE ---
    '🐻': {
        name: 'Cave Bear',
        maxHealth: 14, attack: 3, defense: 1, xp: 25, 
        loot: '❄️f', 
        color: '#78350f', // Dark Brown
        flavor: "A large bear. It looks hungry, but not invincible."
    },
    '🦌': {
        name: 'Stag',
        maxHealth: 15, attack: 2, defense: 0, xp: 10,
        loot: '🍖',
        color: '#b45309', // Brown
        flavor: "It watches you warily, antlers lowered."
    },

    // --- LEVEL 2-3 (Standard Threats) ---
    'g': {
        name: 'Goblin',
        maxHealth: 6, attack: 2, defense: 0, xp: 12,
        loot: 't',
        color: '#16a34a', // Goblin Green
        flavor: "Scavengers who worship the scrap metal left behind by the Great Fall."
    },
    'w': {
        name: 'Wolf',
        maxHealth: 8, attack: 3, defense: 0, xp: 15,
        loot: 'p',
        color: '#78716c', // Grey-Brown
        flavor: "A lean, hungry predator of the wilds."
    },
    's': {
        name: 'Skeleton',
        maxHealth: 10, attack: 3, defense: 1, xp: 18,
        loot: '(',
        color: '#e5e7eb', // Bone White
        flavor: "Once the King's elite guard. Even in death, they cannot break their oath of silence."
    },
    'b': {
        name: 'Bandit',
        maxHealth: 10, attack: 2, defense: 1, xp: 20,
        loot: 'i',
        color: '#ef4444', // Red
        flavor: "Desperate men driven to crime by a dying world."
    },
    'k': {
        name: 'Kobold',
        maxHealth: 6, attack: 2, defense: 0, xp: 10,
        loot: '$',
        color: '#ea580c', // Orange-ish
        flavor: "Yip yip! A reptilian hoarder of shiny things."
    },
    '🐗': {
        name: 'Wild Boar',
        maxHealth: 12, attack: 3, defense: 0, xp: 20,
        loot: '🍖',
        color: '#57534e', // Muddy grey
        flavor: "It scrapes its tusks against the ground, preparing to charge."
    },
    'a': {
        name: 'Shadow Acolyte',
        maxHealth: 8, attack: 1, defense: 0, xp: 15,
        loot: 'r',
        color: '#4f46e5', // Deep Blue/Purple
        caster: true, castRange: 4, spellDamage: 3,
        flavor: "They whisper ancient texts that hurt your ears to hear."
    },

    // --- LEVEL 4-5 (Advanced Threats) ---
    '@': {
        name: 'Giant Spider',
        maxHealth: 10, attack: 4, defense: 0, xp: 25,
        loot: '"',
        color: '#1f2937', // Near Black
        inflicts: 'poison',
        flavor: "It moves with terrifying, silent speed."
    },
    '🦂': {
        name: 'Giant Scorpion',
        maxHealth: 12, attack: 4, defense: 2, xp: 30,
        loot: 'i',
        color: '#b45309', // Dark Amber
        inflicts: 'poison',
        flavor: "Its stinger drips with venom."
    },
    'l': {
        name: 'Giant Leech',
        maxHealth: 15, attack: 2, defense: 0, xp: 20,
        loot: 'p',
        color: '#111827', // Pitch Black
        inflicts: 'poison',
        flavor: "A writhing mass of hunger from the deep swamps."
    },
    'o': {
        name: 'Orc Brute',
        maxHealth: 20, attack: 5, defense: 1, xp: 40,
        loot: 'U',
        color: '#14532d', // Dark Forest Green
        flavor: "A towering wall of muscle and rage."
    },
    'Z': {
        name: 'Draugr',
        maxHealth: 18, attack: 4, defense: 2, xp: 35,
        loot: 'E',
        color: '#38bdf8', // Frost Blue
        inflicts: 'frostbite',
        flavor: "Ancient northmen, preserved by the biting frost."
    },

    // --- LEVEL 6+ (Elites) ---
    '🐺': {
        name: 'Dire Wolf',
        maxHealth: 25, attack: 6, defense: 1, xp: 60,
        loot: '🐺',
        color: '#44403c', // Dark Charcoal
        flavor: "An enormous beast with eyes like burning coals."
    },
    'Ø': { 
        name: 'Ogre',
        maxHealth: 35, attack: 7, defense: 1, xp: 80,
        loot: '$',
        color: '#84cc16', // Sickly Yellow-Green
        flavor: "Dull-witted but incredibly destructive."
    },
    'Y': {
        name: 'Yeti',
        maxHealth: 40, attack: 6, defense: 2, xp: 90,
        loot: '❄️f',
        color: '#f8fafc', // Pure White
        inflicts: 'frostbite',
        flavor: "The undisputed apex predator of the frozen peaks."
    },
    'm': {
        name: 'Arcane Mage',
        maxHealth: 15, attack: 2, defense: 0, xp: 50,
        loot: '&',
        color: '#c084fc', // Bright Purple
        caster: true, castRange: 6, spellDamage: 6,
        flavor: "A scholar who stared too long into the Void. Their body is now just a vessel for forbidden math."
    },
    'C': {
        name: 'Bandit Chief',
        maxHealth: 25, attack: 5, defense: 2, xp: 50,
        loot: 'i',
        color: '#991b1b', // Dark Red
        flavor: "A ruthless leader clad in stolen armor."
    },
    'f': {
        name: 'Fire Elemental',
        maxHealth: 20, attack: 5, defense: 3, xp: 60,
        loot: '🔥c',
        color: '#fb923c', // Bright Orange
        caster: true, castRange: 4, spellDamage: 5,
        inflicts: 'burn',
        flavor: "A walking inferno of pure elemental rage."
    },
    '👻': {
        name: 'Lost Soul',
        type: 'spirit', 
        maxHealth: 15, attack: 3, xp: 20,
        loot: 'ectoplasm',
        color: '#8b5cf6', // Ghostly Indigo
        flavor: "It wails silently, trapped between realms."
    },
    '😈d': {
        name: 'Void Demon',
        maxHealth: 50, attack: 8, defense: 4, xp: 200,
        loot: '😈',
        color: '#581c87', // Very Dark Purple
        teleporter: true, inflicts: 'madness',
        flavor: "A fragment of the nothingness that existed before the First Age."
    },
    'v': {
        name: 'Void Stalker',
        maxHealth: 15, attack: 6, defense: 1, xp: 55,
        loot: 'vd',
        color: '#7c3aed', // Purple
        teleporter: true,
        flavor: "It phases in and out of reality, tracking your scent."
    },
    'M': {
        name: 'Mimic',
        maxHealth: 20, attack: 6, defense: 2, xp: 50,
        loot: '💍',
        color: '#854d0e', // Chest Brown
        inflicts: 'root',
        flavor: "A monstrous shape-shifter hoping for a greedy victim."
    },
    '🧙': {
        name: 'Necromancer Lord',
        maxHealth: 80, attack: 7, defense: 3, xp: 1000,
        loot: '👑',
        color: '#000000', // Pure Black
        caster: true, castRange: 7, spellDamage: 8,
        isBoss: true,
        flavor: "He wears a crown of bone and commands the armies of the dead. Do not let him cast."
    },
    'c': {
        name: 'Cultist Initiate',
        maxHealth: 12, attack: 3, defense: 0, xp: 25,
        loot: '📜', 
        color: '#be185d', // Rose red
        flavor: "He mutters prayers to a sleeping god."
    },
    'z': {
        name: 'Cultist Fanatic',
        maxHealth: 15, attack: 6, defense: 0, xp: 35,
        loot: '🗡️', 
        color: '#9f1239', // Dark Rose
        flavor: "He fights with reckless, terrifying abandon."
    },

    // --- NEW BEASTS (Tanky & Dangerous) ---
    '🧌': { 
        name: 'Stone Golem',
        maxHealth: 40, attack: 4, defense: 3, xp: 60,
        loot: '🪨', 
        color: '#a8a29e', // Stone grey
        flavor: "A walking boulder. Blades skitter off its hide."
    },
    '🐲': {
        name: 'Young Drake',
        maxHealth: 50, attack: 7, defense: 2, xp: 100,
        loot: '🐉', 
        color: '#dc2626', // Bright red
        inflicts: 'burn', inflictChance: 0.3,
        flavor: "Smoke curls from its nostrils as it eyes you hungrily."
    },
    // --- TIER 4 (The Deep Wilds - 2500+ Distance) ---
    '🦖': {
        name: 'Ancient Rex',
        maxHealth: 150, attack: 12, defense: 5, xp: 500,
        loot: '🦖', 
        color: '#14532d', // Swamp green
        flavor: "The earth shakes with every step."
    },
    '🧛': {
        name: 'Vampire Lord',
        maxHealth: 80, attack: 10, defense: 3, xp: 600,
        loot: '🩸', 
        color: '#e11d48', // Crimson
        caster: true, castRange: 5, spellDamage: 8,
        inflicts: 'siphon', 
        flavor: "He moves faster than your eyes can follow."
    },
    '👾': {
        name: 'Eldritch Horror',
        maxHealth: 200, attack: 15, defense: 0, xp: 800,
        loot: 'vd',
        color: '#8b5cf6', // Violet
        inflicts: 'madness', inflictChance: 0.5,
        flavor: "To look at it is to invite insanity."
    },
    '🤖': {
        name: 'Clockwork Guardian',
        maxHealth: 100, attack: 8, defense: 10, xp: 500,
        loot: '⚙️', 
        color: '#d97706', // Brass/Bronze
        flavor: "A relic of a lost civilization, still relentlessly patrolling."
    },
    '🐉h': {
        name: 'Swamp Hydra',
        maxHealth: 60, attack: 6, defense: 2, xp: 150,
        loot: '🐉',
        color: '#15803d', // Dark green
        inflicts: 'poison',
        flavor: "Multiple heads snap at you from the muck."
    },
    '🔥e': {
        name: 'Efreet',
        maxHealth: 60, attack: 8, defense: 1, xp: 150,
        loot: '🔥c',
        color: '#f97316', // Vivid Orange
        caster: true, castRange: 5, spellDamage: 6,
        inflicts: 'burn',
        flavor: "A spirit of smoke and flame, bound by ancient chains."
    }
};

window.PLAYER_BACKGROUNDS = {
    'warrior': {
        name: 'Warrior',
        description: 'A master of martial combat, built to survive the frontline.',
        stats: { strength: 2, constitution: 1 },
        items: [
            { templateId: '!', name: 'Rusty Sword', type: 'weapon', quantity: 1, tile: '!', damage: 2, slot: 'weapon' },
            { templateId: '%', name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor' },
            { templateId: '1', name: 'Conscript\'s Orders', type: 'journal', quantity: 1, tile: '1', title: 'Crumpled Orders' }
        ]
    },
    'rogue': {
        name: 'Rogue',
        description: 'Nimble and lethal, favoring speed and critical strikes.',
        stats: { dexterity: 2, luck: 1 },
        items: [
            { templateId: '†', name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon' },
            { templateId: '%', name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor' },
            { templateId: '2', name: 'Thief\'s Map', type: 'journal', quantity: 1, tile: '2', title: 'Scribbled Map' }
        ]
    },
    'mage': {
        name: 'Mage',
        description: 'A scholar of the arcane, wielding destructive spells.',
        stats: { wits: 2, willpower: 1 },
        items: [
            { templateId: '📚', name: 'Spellbook: Magic Bolt', type: 'spellbook', quantity: 1, tile: '📚', spellId: 'magicBolt' },
            { templateId: '3', name: 'Burned Scroll', type: 'journal', quantity: 1, tile: '3', title: 'Singed Parchment' }
        ]
    },
    'necromancer': {
        name: 'Necromancer',
        description: 'Commands the forces of life and death, raising minions from the grave.',
        stats: { wits: 1, willpower: 2 },
        items: [
            { templateId: '†', name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon' },
            { templateId: '💀', name: 'Tome: Raise Dead', type: 'spellbook', quantity: 1, tile: '💀', spellId: 'raiseDead' },
            { templateId: '4', name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap' }
        ]
    },
    'wretch': {
        name: 'The Wretch',
        description: 'Naked, afraid, and penniless. A true challenge.',
        stats: { luck: 2, endurance: 2 }, // Giving them a tiny bit more survivability
        items: [
            { templateId: 'x', name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor' },
            { templateId: '4', name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap' }
        ]
    }
};

window.EVOLUTION_DATA = {
    'warrior': [
        {
            id: 'berserker',
            name: 'Berserker',
            icon: '👹', 
            description: "Gain Rage on hit. Deal double damage below 50% HP.",
            stats: { strength: 4, constitution: 2 },
            talent: 'blood_rage'
        },
        {
            id: 'paladin',
            name: 'Paladin',
            icon: '🛡️',
            description: "Immune to Poison/Disease. Heals allies nearby.",
            stats: { constitution: 3, willpower: 2, charisma: 2 },
            talent: 'holy_aura'
        }
    ],
    'rogue': [
        {
            id: 'assassin',
            name: 'Assassin',
            icon: '🥷',
            description: "Attacks from Stealth deal 4x damage.",
            stats: { dexterity: 4, wits: 2 },
            talent: 'shadow_strike'
        },
        {
            id: 'ranger',
            name: 'Ranger',
            icon: '🏹',
            description: "Master of the bow. Ranged attacks deal +50% damage.", // Prep for Archery!
            stats: { dexterity: 3, perception: 3 },
            talent: 'eagle_eye'
        }
    ],
    'mage': [
        {
            id: 'archmage',
            name: 'Archmage',
            icon: '🧙‍♂️',
            description: "Spells cost 20% less Mana.",
            stats: { wits: 5, maxMana: 20 },
            talent: 'mana_flow'
        },
        {
            id: 'battlemage',
            name: 'Battlemage',
            icon: '🗡️',
            description: "Can wear Heavy Armor without penalty.",
            stats: { strength: 3, wits: 3 },
            talent: 'arcane_steel'
        }
    ],
    'necromancer': [
        {
            id: 'lich',
            name: 'Lich',
            icon: '💀',
            description: "You no longer need food or water. You are Undead.",
            stats: { wits: 4, willpower: 4 },
            talent: 'undeath'
        }
    ],
    'wretch': [
        {
            id: 'hero',
            name: 'True Hero',
            icon: '👑',
            description: "Stats +5. You survived the darkness.",
            stats: { strength: 5, dexterity: 5, wits: 5, constitution: 5 },
            talent: 'legend'
        }
    ]
};

// EASY WIN: Added scalingStat to all spells for UI clarity
window.SPELL_DATA = {
    "candlelight": {
        name: "Candlelight",
        description: "Summons a floating light. Huge vision radius (+6) for a long time.",
        cost: 15, costType: "mana", requiredLevel: 1, target: "self", type: "buff", duration: 100 
    },
    "chainLightning": {
        name: "Chain Lightning",
        description: "Strikes a target, then jumps to a nearby enemy. Scales with Wits.",
        scalingStat: "wits",
        cost: 18, costType: "mana", requiredLevel: 6, target: "aimed", baseDamage: 6,
    },
    "stoneSkin": {
        name: "Stone Skin",
        description: "Greatly increases Defense but lowers Dexterity. Scales with Constitution.",
        scalingStat: "constitution",
        cost: 20, costType: "mana", requiredLevel: 3, target: "self", type: "buff",
    },
    "lesserHeal": {
        name: "Lesser Heal",
        description: "Heals for a small amount. Scales with Wits.",
        scalingStat: "wits",
        cost: 5, costType: "mana", requiredLevel: 1, target: "self", baseHeal: 5       
    },
    "clarity": {
        name: "Clarity",
        description: "Focus your mind to reveal adjacent secret walls.",
        cost: 8, costType: "psyche", requiredLevel: 1, target: "self", type: "utility" 
    },
    "raiseDead": {
        name: "Raise Dead",
        description: "Summons a Skeleton Minion from a corpse (or bone pile) to fight for you. Scales with Willpower.",
        scalingStat: "willpower",
        cost: 15, costType: "mana", requiredLevel: 1, target: "aimed", range: 3
    },
    "arcaneShield": {
        name: "Arcane Shield",
        description: "Creates a temporary shield that absorbs damage. Scales with Wits.",
        scalingStat: "wits",
        cost: 10, costType: "mana", requiredLevel: 3, target: "self", type: "buff", baseShield: 5, duration: 5 
    },
    "fireball": {
        name: "Fireball",
        description: "An explosive orb damages enemies in a 3x3 area. Scales with Wits.",
        scalingStat: "wits",
        cost: 15, costType: "mana", requiredLevel: 5, target: "aimed", baseDamage: 8, radius: 1 
    },
    "siphonLife": {
        name: "Siphon Life",
        description: "Drains life from a target, healing you. Scales with Willpower.",
        scalingStat: "willpower",
        cost: 12, costType: "psyche", requiredLevel: 4, target: "aimed", baseDamage: 4, healPercent: 0.5 
    },
    "thunderbolt": {
        name: "Thunderbolt",
        description: "Strikes a target with massive lightning damage. Scales with Wits.",
        scalingStat: "wits",
        cost: 20, costType: "mana", requiredLevel: 6, target: "aimed", baseDamage: 12 
    },
    "meteor": {
        name: "Meteor",
        description: "Summons a meteor from the heavens. Large AoE (5x5). Scales with Wits.",
        scalingStat: "wits",
        cost: 30, costType: "mana", requiredLevel: 8, target: "aimed", baseDamage: 10, radius: 2 
    },
    "divineLight": {
        name: "Divine Light",
        description: "Fully restores Health and cures all status effects.",
        cost: 25, costType: "psyche", requiredLevel: 5, target: "self", type: "utility"
    },
    "magicBolt": {
        name: "Magic Bolt",
        description: "Hurls a bolt of energy. Scales with Wits.",
        scalingStat: "wits",
        cost: 8, costType: "mana", requiredLevel: 1, target: "aimed", baseDamage: 5
    },
    "psychicBlast": {
        name: "Psychic Blast",
        description: "Assaults a target's mind. Scales with Willpower.",
        scalingStat: "willpower",
        cost: 10, costType: "psyche", requiredLevel: 2, target: "aimed", baseDamage: 6             
    },
    "frostBolt": {
        name: "Frost Bolt",
        description: "Hurls a shard of ice. Has a chance to inflict Frostbite. Scales with Willpower.",
        scalingStat: "willpower",
        cost: 10, costType: "mana", requiredLevel: 1, target: "aimed", baseDamage: 5, inflicts: "frostbite", inflictChance: 0.25     
    },
    "poisonBolt": {
        name: "Poison Bolt",
        description: "Launches a bolt of acidic poison. Has a chance to inflict Poison. Scales with Willpower.",
        scalingStat: "willpower",
        cost: 10, costType: "psyche", requiredLevel: 2, target: "aimed", baseDamage: 4, inflicts: "poison", inflictChance: 0.50     
    },
    "darkPact": {
        name: "Dark Pact",
        description: "Sacrifice 5 Health to restore 10 Mana. Scales with Willpower.",
        scalingStat: "willpower",
        cost: 5, costType: "health", requiredLevel: 4, target: "self", baseRestore: 10
    },
    "entangle": {
        name: "Entangle",
        description: "Roots an enemy in place, preventing movement and attacks. Scales with Intuition.",
        scalingStat: "intuition",
        cost: 12, costType: "mana", requiredLevel: 3, target: "aimed", baseDamage: 2, inflicts: "root", inflictChance: 1.0   
    },
    "thornSkin": {
        name: "Thorn Skin",
        description: "Reflects damage back to attackers. Scales with Intuition.",
        scalingStat: "intuition",
        cost: 15, costType: "mana", requiredLevel: 4, target: "self", type: "buff", baseReflect: 2, duration: 5
    }
};

window.TALENT_DATA = {
    "bloodlust": {
        name: "Bloodlust",
        description: "Heal 2 HP whenever you kill an enemy.",
        class: "warrior",
        icon: "🩸"
    },
    "iron_skin": {
        name: "Iron Skin",
        description: "Permanent +1 Bonus to Defense.",
        class: "warrior",
        icon: "🛡️"
    },
    "backstab": {
        name: "Backstab",
        description: "Critical hits deal 3x damage instead of 1.5x.",
        class: "rogue",
        icon: "🗡️"
    },
    "evasion": {
        name: "Evasion",
        description: "+10% chance to dodge enemy attacks.",
        class: "rogue",
        icon: "💨"
    },
    "arcane_potency": {
        name: "Arcane Potency",
        description: "All spells deal +2 Bonus Damage.",
        class: "mage",
        icon: "✨"
    },
    "scholar": {
        name: "Scholar",
        description: "Gain +20% more XP from all sources.",
        class: "mage",
        icon: "📖"
    },
    "soul_siphon": {
        name: "Soul Siphon",
        description: "Restore 2 Mana whenever you kill an enemy.",
        class: "necromancer",
        icon: "💀"
    },
    "survivalist": {
        name: "Survivalist",
        description: "Foraging (Wildberries/Herbs) restores double HP/Mana.",
        class: "general",
        icon: "🌿"
    },
    "pathfinder": {
        name: "Pathfinder",
        description: "Move through forests and brush without losing stamina.",
        class: "ranger",
        icon: "🌲"
    },
    "eagle_eye": {
        name: "Eagle Eye",
        description: "Ranged attacks deal +50% Damage.",
        class: "ranger",
        icon: "👁️"
    }
};

window.SKILL_DATA = {
    // --- BASIC TECHNIQUES ---
    "kick": {
        name: "Kick",
        description: "Stun an enemy for 2 turns. Deals low damage.",
        cost: 8, costType: "stamina", requiredLevel: 1, target: "aimed", baseDamageMultiplier: 0.2, cooldown: 8,
    },
    "vanish": {
        name: "Vanish",
        description: "Instantly drop all enemy aggro and enter Stealth.",
        cost: 15, costType: "stamina", requiredLevel: 4, target: "self", cooldown: 30, type: "utility"
    },
    "brace": {
        name: "Brace",
        description: "Gain temporary Defense. Scales with Constitution.",
        scalingStat: "constitution",
        cost: 6, costType: "stamina", requiredLevel: 2, target: "self", type: "buff", baseDefense: 1, duration: 3, cooldown: 5 
    },
    "tame": {
        name: "Tame Beast",
        description: "Attempt to bond with a weakened animal (HP < 30%). Scales with Charisma.",
        scalingStat: "charisma",
        cost: 15, costType: "psyche", requiredLevel: 3, target: "aimed", cooldown: 20
    },
    "lunge": {
        name: "Lunge",
        description: "Attack an enemy 2-3 tiles away. Scales with Strength.",
        scalingStat: "strength",
        cost: 5, costType: "stamina", requiredLevel: 2, target: "aimed", baseDamageMultiplier: 1.0, cooldown: 3 
    },
    "shieldBash": {
        name: "Shield Bash",
        description: "Strike an enemy with your shield, stunning them. Scales with Constitution.",
        scalingStat: "constitution",
        cost: 10, costType: "stamina", requiredLevel: 3, target: "aimed", baseDamageMultiplier: 0.5, cooldown: 5
    },
    "cleave": {
        name: "Cleave",
        description: "Strike the target and enemies adjacent to it. Scales with Strength.",
        scalingStat: "strength",
        cost: 12, costType: "stamina", requiredLevel: 5, target: "aimed", baseDamageMultiplier: 0.8, cooldown: 4
    },
    "adrenaline": {
        name: "Adrenaline",
        description: "Instantly restore 10 Stamina.",
        cost: 5, costType: "health", requiredLevel: 2, target: "self", cooldown: 10
    },
    "pacify": {
        name: "Pacify",
        description: "Attempt to calm a hostile target. Scales with Charisma.",
        scalingStat: "charisma",
        cost: 10, costType: "psyche", requiredLevel: 3, target: "aimed", cooldown: 5 
    },
    "inflictMadness": {
        name: "Inflict Madness",
        description: "Assault a target's mind. Scales with Charisma.",
        scalingStat: "charisma",
        cost: 12, costType: "psyche", requiredLevel: 5, target: "aimed", cooldown: 8 
    },
    "whirlwind": {
        name: "Whirlwind",
        description: "Strike all adjacent enemies. Scales with Strength and Dexterity.",
        scalingStat: "strength", // Relies on both, but primarily physical
        cost: 15, costType: "stamina", requiredLevel: 4, target: "self", cooldown: 6
    },
    "stealth": {
        name: "Stealth",
        description: "Become invisible to enemies for 5 turns or until you attack.",
        cost: 10, costType: "stamina", requiredLevel: 3, target: "self", duration: 5, cooldown: 10
    },
    // --- WEAPON TECHNIQUES ---
    "crush": {
        name: "Crush",
        description: "A heavy blow that stuns the target. Scales with Strength. (Hammer/Club only)",
        scalingStat: "strength",
        cost: 8, costType: "stamina", requiredLevel: 1, target: "aimed", baseDamageMultiplier: 1.2, cooldown: 6
    },
    "quickstep": {
        name: "Quickstep",
        description: "Dash 2 tiles instantly. (Dagger only)",
        cost: 5, costType: "stamina", requiredLevel: 1, target: "aimed", cooldown: 4, type: "movement"
    },
    "deflect": {
        name: "Deflect",
        description: "Enter a defensive stance, reflecting the next attack. (Sword only)",
        cost: 6, costType: "stamina", requiredLevel: 1, target: "self", duration: 2, cooldown: 5
    },
    "channel": {
        name: "Channel",
        description: "Focus your energy to restore Mana. (Staff only)",
        cost: 0, costType: "stamina", requiredLevel: 1, target: "self", cooldown: 10
    },
    // --- PREP FOR ARCHERY ---
    "ranged_attack": {
        name: "Shoot",
        description: "Fire an arrow at a distant target. Scales with Dexterity.",
        scalingStat: "dexterity",
        cost: 4, costType: "stamina", requiredLevel: 1, target: "aimed", baseDamageMultiplier: 1.0, cooldown: 0 
    }
};
