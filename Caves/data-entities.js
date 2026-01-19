
const RIDDLE_DATA = [
    {
        id: "fire",
        question: "I have no mouth, but I always consume. I have no life, but I must be fed. What am I?",
        answers: ["fire", "flame", "campfire"],
        reward: "strength", // Grants +1 Strength
        message: "The statue's eyes glow red. You feel a surge of heat."
    },
    {
        id: "shadow",
        question: "The more of me there is, the less you see. What am I?",
        answers: ["darkness", "dark", "shadow", "night"],
        reward: "wits", // Grants +1 Wits
        message: "The statue seems to vanish for a moment. Your mind sharpens."
    },
    {
        id: "echo",
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        answers: ["echo"],
        reward: "psyche", // Grants +1 Psyche
        message: "A whisper surrounds you. Your will is strengthened."
    },
    {
        id: "silence",
        question: "I am so fragile that if you say my name, you break me. What am I?",
        answers: ["silence"],
        reward: "dexterity", // Grants +1 Dex (Stealth theme)
        message: "The world goes quiet. You feel lighter."
    }
];

const QUEST_DATA = {
    "healerSupply": {
        title: "Herbal Remedies",
        description: "The Healer is running low on supplies. Gather 5 Medicinal Herbs ('🌿') from the swamp.",
        type: 'collect',
        itemNeeded: 'Medicinal Herb',
        needed: 5,
        reward: {
            xp: 200,
            coins: 50,
            item: 'Healing Potion', // New reward type!
            itemQty: 3
        }
    },
    "banditChief": {
        title: "Wanted: The Chief",
        description: "The Bandit Chief ('C') has been spotted in the fortresses. Put an end to his reign.",
        type: 'kill', // Uses the standard kill tracking
        enemy: 'C',   // Tracks kills of 'C' (Bandit Chief)
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
        enemy: 'a', // The 'a' tile for Shadow Acolyte
        needed: 10,
        reward: {
            xp: 150,
            coins: 100
        }
    },
    "spiderHunt": {
        title: "Bounty: Spider Nest",
        description: "The caves are crawling with giant spiders. Clear out the nests.",
        enemy: '@', // The '@' tile for Giant Spider
        needed: 12,
        reward: {
            xp: 120,
            coins: 80
        }
    },
    "wolfHunt": {
        title: "Bounty: Wolf Hunt",
        description: "The local shepherds are plagued by wolves. Thin their numbers.",
        enemy: 'w', // The enemy tile to track
        needed: 10,
        reward: {
            xp: 100,
            coins: 50
        }
    },
    "goblinHunt": {
        title: "Bounty: Goblin Hunt",
        description: "Goblins are multiplying in the nearby caves. Clear them out.",
        enemy: 'g', // Tracks 'g' tile
        needed: 15, // Need to kill 15
        reward: {
            xp: 75,
            coins: 30
        }
    },
    "skeletonScourge": {
        title: "Bounty: Skeleton Scourge",
        description: "Restless dead are rising. Put them back to rest.",
        enemy: 's', // Tracks 's' tile
        needed: 10,
        reward: {
            xp: 100,
            coins: 50
        }
    },
    "banditCleanup": {
        title: "Bounty: Bandit Cleanup",
        description: "Bandits have been waylaying travelers. Bring them to justice.",
        enemy: 'b', // Tracks 'b' tile
        needed: 12,
        reward: {
            xp: 120,
            coins: 75
        }
    }

};

const ENEMY_PREFIXES = {
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

const ENEMY_DATA = {
    // --- LEVEL 1 (Vermin & Weaklings) ---
    'r': {
        name: 'Giant Rat',
        maxHealth: 3,
        attack: 1,
        defense: 0,
        xp: 4,
        loot: '🐀', // Rat Tail
        flavor: "It hisses and bares yellow teeth."
    },
    '🦇': {
        name: 'Giant Bat',
        maxHealth: 2,
        attack: 1,
        defense: 0,
        xp: 5,
        loot: '🦇', // Bat Wing
        flavor: "It swoops down from the darkness!"
    },
    '🐍': {
        name: 'Viper',
        maxHealth: 4,
        attack: 2,
        defense: 0,
        xp: 8,
        loot: '🦷', // Snake Fang
        inflicts: 'poison',
        inflictChance: 0.2
    },
    'R': {
        name: 'Bandit Recruit',
        maxHealth: 5,
        attack: 2, // Has a weapon
        defense: 0,
        xp: 10,
        loot: '🧣', // Red Bandana
        flavor: "He looks nervous, holding his dagger with shaking hands."
    },

    // --- DESERT WILDLIFE ---
    '🦂s': { // Small Scorpion variant
        name: 'Sand Scorpion',
        maxHealth: 5, attack: 2, defense: 1, xp: 8,
        loot: '🦷',
        inflicts: 'poison', inflictChance: 0.3,
        flavor: "It burrows in the sand, waiting."
    },
    '🐍c': { // Cobra
        name: 'King Cobra',
        maxHealth: 15, attack: 5, defense: 0, xp: 30,
        loot: '🦷',
        inflicts: 'poison', inflictChance: 0.5,
        flavor: "It rears up, hood flared, hissing loudly."
    },

    // --- SWAMP WILDLIFE ---
    '🐸': {
        name: 'Giant Toad',
        maxHealth: 20, attack: 3, defense: 0, xp: 25,
        loot: '🍖', // Drops meat!
        flavor: "It looks at you with unblinking eyes."
    },
    '🦟': {
        name: 'Blood Mosquito',
        maxHealth: 2, attack: 1, defense: 5, // Hard to hit!
        xp: 10,
        loot: 'vd',
        flavor: "An annoying, high-pitched whine follows it."
    },

    // --- FOREST WILDLIFE ---
    '🐻': {
        name: 'Cave Bear',
        maxHealth: 14, // Reduced from 30 (Now doable in ~6-7 hits)
        attack: 3,     // Reduced from 5 (Player survives ~4-5 hits)
        defense: 1,    // Reduced from 2 (So basic weapons actually do damage)
        xp: 25,        // Reduced from 50 to match new difficulty
        loot: '❄️f',   // Yeti Fur (Generic Fur)
        flavor: "A large bear. It looks hungry, but not invincible."
    },
    '🦌': {
        name: 'Stag',
        maxHealth: 15, attack: 2, defense: 0, xp: 10,
        loot: '🍖',
        flavor: "It watches you warily."
    },

    // --- LEVEL 2-3 (Standard Threats) ---
    'g': {
        name: 'Goblin',
        maxHealth: 6,
        attack: 2,
        defense: 0,
        xp: 12,
        loot: 't'
    },
    'w': {
        name: 'Wolf',
        maxHealth: 8,
        attack: 3,
        defense: 0,
        xp: 15,
        loot: 'p'
    },
    's': {
        name: 'Skeleton',
        maxHealth: 10,
        attack: 3,
        defense: 1, // Bones are hard
        xp: 18,
        loot: '('
    },
    'b': {
        name: 'Bandit',
        maxHealth: 10,
        attack: 2,
        defense: 1, // Leather armor
        xp: 20,
        loot: 'i'
    },
    'k': {
        name: 'Kobold',
        maxHealth: 6,
        attack: 2,
        defense: 0,
        xp: 10,
        loot: '$',
        flavor: "Yip yip!"
    },
    '🐗': {
        name: 'Wild Boar',
        maxHealth: 12,
        attack: 3,
        defense: 0,
        xp: 20,
        loot: '🍖'
    },
    'a': {
        name: 'Shadow Acolyte',
        maxHealth: 8,
        attack: 1,
        defense: 0,
        xp: 15,
        loot: 'r',
        caster: true,
        castRange: 4,
        spellDamage: 3
    },

    // --- LEVEL 4-5 (Advanced Threats) ---
    '@': {
        name: 'Giant Spider',
        maxHealth: 10,
        attack: 4,
        defense: 0,
        xp: 25,
        loot: '"',
        inflicts: 'poison'
    },
    '🦂': {
        name: 'Giant Scorpion',
        maxHealth: 12,
        attack: 4,
        defense: 2, // Hard shell
        xp: 30,
        loot: 'i',
        inflicts: 'poison'
    },
    'l': {
        name: 'Giant Leech',
        maxHealth: 15,
        attack: 2,
        defense: 0,
        xp: 20,
        loot: 'p',
        inflicts: 'poison'
    },
    'o': {
        name: 'Orc Brute',
        maxHealth: 20,
        attack: 5,
        defense: 1,
        xp: 40,
        loot: 'U'
    },
    'Z': {
        name: 'Draugr',
        maxHealth: 18,
        attack: 4,
        defense: 2,
        xp: 35,
        loot: 'E',
        inflicts: 'frostbite'
    },

    // --- LEVEL 6+ (Elites) ---
    '🐺': {
        name: 'Dire Wolf',
        maxHealth: 25,
        attack: 6,
        defense: 1,
        xp: 60,
        loot: '🐺'
    },
    'Ø': { // FIXED: Changed ID to avoid Sage conflict
        name: 'Ogre',
        maxHealth: 35,
        attack: 7,
        defense: 1,
        xp: 80,
        loot: '$'
    },
    'Y': {
        name: 'Yeti',
        maxHealth: 40,
        attack: 6,
        defense: 2,
        xp: 90,
        loot: '❄️f',
        inflicts: 'frostbite'
    },
    'm': {
        name: 'Arcane Mage',
        maxHealth: 15,
        attack: 2,
        defense: 0,
        xp: 50,
        loot: '&',
        caster: true,
        castRange: 6,
        spellDamage: 6
    },
    'C': {
        name: 'Bandit Chief',
        maxHealth: 25,
        attack: 5,
        defense: 2,
        xp: 50,
        loot: 'i'
    },
    'f': {
        name: 'Fire Elemental',
        maxHealth: 20,
        attack: 5,
        defense: 3,
        xp: 60,
        loot: '🔥c',
        caster: true,
        castRange: 4,
        spellDamage: 5,
        inflicts: 'burn'
    },
    'D': {
        name: 'Void Demon',
        maxHealth: 50,
        attack: 8,
        defense: 4,
        xp: 200,
        loot: '😈',
        teleporter: true,
        inflicts: 'madness'
    },
    'v': {
        name: 'Void Stalker',
        maxHealth: 15,
        attack: 6,
        defense: 1,
        xp: 55,
        loot: 'vd',
        teleporter: true
    },
    'M': {
        name: 'Mimic',
        maxHealth: 20,
        attack: 6,
        defense: 2,
        xp: 50,
        loot: '💍',
        inflicts: 'root'
    },
    '🧙': {
        name: 'Necromancer Lord',
        maxHealth: 80,
        attack: 7,
        defense: 3,
        xp: 1000,
        loot: '👑',
        caster: true,
        castRange: 7,
        spellDamage: 8,
        isBoss: true
    },
    'c': {
        name: 'Cultist Initiate',
        maxHealth: 12,
        attack: 3,
        defense: 0,
        xp: 25,
        loot: '📜', // Drops random scrolls often
        flavor: "He mutters prayers to a sleeping god."
    },
    'z': {
        name: 'Cultist Fanatic',
        maxHealth: 15,
        attack: 6, // High damage!
        defense: 0, // No armor
        xp: 35,
        loot: '🗡️', // Often drops daggers
        flavor: "He fights with reckless abandon."
    },

    // --- NEW BEASTS (Tanky & Dangerous) ---
    '🗿': {
        name: 'Stone Golem',
        maxHealth: 40,
        attack: 4,
        defense: 4, // Very high defense! Needs magic or pickaxe.
        xp: 60,
        loot: '🪨', // Drops Stone/Ore
        flavor: "A walking boulder. Blades skitter off its hide."
    },
    '🐲': {
        name: 'Young Drake',
        maxHealth: 50,
        attack: 7,
        defense: 2,
        xp: 100,
        loot: '🐉', // Dragon Scale
        inflicts: 'burn', // We'll map this to fire damage
        inflictChance: 0.3,
        flavor: "Smoke curls from its nostrils."
    },
    // --- TIER 4 (The Deep Wilds - 2500+ Distance) ---
    '🦖': {
        name: 'Ancient Rex',
        maxHealth: 150,
        attack: 12,
        defense: 5,
        xp: 500,
        loot: '🦖', // T-Rex Tooth (Junk/Trophy)
        flavor: "The earth shakes with every step."
    },
    '🧛': {
        name: 'Vampire Lord',
        maxHealth: 80,
        attack: 10,
        defense: 3,
        xp: 600,
        loot: '🩸', // Vial of Blood
        caster: true,
        castRange: 5,
        spellDamage: 8,
        inflicts: 'siphon', // We can reuse siphon logic or just high damage
        flavor: "He moves faster than your eyes can follow."
    },
    '👾': {
        name: 'Eldritch Horror',
        maxHealth: 200,
        attack: 15,
        defense: 0, // Soft but massive HP
        xp: 800,
        loot: 'vd',
        inflicts: 'madness',
        inflictChance: 0.5,
        flavor: "To look at it is to invite insanity."
    },
    '🤖': {
        name: 'Clockwork Guardian',
        maxHealth: 100,
        attack: 8,
        defense: 10, // Insane defense, needs magic/piercing
        xp: 500,
        loot: '⚙️', // Gear
        flavor: "A relic of a lost civilization, still patrolling."
    },
};


const PLAYER_BACKGROUNDS = {
    'warrior': {
        name: 'Warrior',
        stats: { strength: 2, constitution: 1 },
        items: [
            { templateId: '!', name: 'Rusty Sword', type: 'weapon', quantity: 1, tile: '!', damage: 2, slot: 'weapon' },
            { templateId: '%', name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor' },
            { templateId: '1', name: 'Conscript\'s Orders', type: 'journal', quantity: 1, tile: '1', title: 'Crumpled Orders', content: ITEM_DATA['1'].content }
        ]
    },
    'rogue': {
        name: 'Rogue',
        stats: { dexterity: 2, luck: 1 },
        items: [
            { templateId: '†', name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon' },
            { templateId: '%', name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor' },
            { templateId: '2', name: 'Thief\'s Map', type: 'journal', quantity: 1, tile: '2', title: 'Scribbled Map', content: ITEM_DATA['2'].content }
        ]
    },
    'mage': {
        name: 'Mage',
        stats: { wits: 2, willpower: 1 },
        items: [
            { templateId: '📚', name: 'Spellbook: Magic Bolt', type: 'spellbook', quantity: 1, tile: '📚', spellId: 'magicBolt' },
            { templateId: '3', name: 'Burned Scroll', type: 'journal', quantity: 1, tile: '3', title: 'Singed Parchment', content: ITEM_DATA['3'].content }
        ]
    },
    'necromancer': {
        name: 'Necromancer',
        stats: { wits: 1, willpower: 2 },
        items: [
            { templateId: '†', name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon' },
            // Note: We use '💀' as templateId, but override the spellId to raiseDead
            { templateId: '💀', name: 'Tome: Raise Dead', type: 'spellbook', quantity: 1, tile: '💀', spellId: 'raiseDead' },
            { templateId: '4', name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap', content: ITEM_DATA['4'].content }
        ]
    },
    'wretch': {
        name: 'The Wretch',
        stats: {},
        items: [
            { templateId: 'x', name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor' },
            { templateId: '4', name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap', content: ITEM_DATA['4'].content }
        ]
    }
};

const EVOLUTION_DATA = {
    'warrior': [
        {
            id: 'berserker',
            name: 'Berserker',
            icon: '👹', // New Character Sprite
            description: "Gain Rage on hit. Deal double damage below 50% HP.",
            stats: { strength: 4, constitution: 2 },
            talent: 'blood_rage'
        },
        {
            id: 'paladin',
            name: 'Paladin',
            icon: '🛡️',
            description: "Immune to Poison/Disease. Heals allies nearby.",
            stats: { constitution: 4, willpower: 2 },
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
            description: "Can move through Forests without stamina cost.",
            stats: { dexterity: 3, perception: 3 },
            talent: 'pathfinder'
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

const SPELL_DATA = {
    "candlelight": {
        name: "Candlelight",
        description: "Summons a floating light. Huge vision radius (+6) for a long time.",
        cost: 15,
        costType: "mana",
        requiredLevel: 1, // Easy to learn
        target: "self",
        type: "buff",
        duration: 100 // Lasts 100 turns!
    },
    "chainLightning": {
        name: "Chain Lightning",
        description: "Strikes a target, then jumps to a nearby enemy.",
        cost: 18,
        costType: "mana",
        requiredLevel: 6,
        target: "aimed",
        baseDamage: 6,
        // You'd handle the "jump" in executeAimedSpell
    },
    "stoneSkin": {
        name: "Stone Skin",
        description: "Greatly increases Defense but lowers Dexterity.",
        cost: 20,
        costType: "mana",
        requiredLevel: 3,
        target: "self",
        type: "buff",
        // Handled in castSpell switch case
    },
    "lesserHeal": {
        name: "Lesser Heal",
        description: "Heals for a small amount, scaling with Wits.",
        cost: 5,
        costType: "mana",
        requiredLevel: 1, // Player level needed to learn this
        target: "self",   // 'self' or 'aimed'
        baseHeal: 5       // The base amount for the formula
    },
    "clarity": {
        name: "Clarity",
        description: "Focus your mind to reveal adjacent secret walls.",
        cost: 8,
        costType: "psyche",
        requiredLevel: 1,
        target: "self",
        type: "utility" // Special type
    },
    "raiseDead": {
        name: "Raise Dead",
        description: "Summons a Skeleton Minion from a corpse (or bone pile) to fight for you.",
        cost: 15,
        costType: "mana", // Or 'psyche' if you prefer
        requiredLevel: 1,
        target: "aimed", // You aim at the tile you want to raise
        range: 3
    },
    "arcaneShield": {
        name: "Arcane Shield",
        description: "Creates a temporary shield that absorbs damage. Scales with Wits.",
        cost: 10,
        costType: "mana",
        requiredLevel: 3,
        target: "self",
        type: "buff",
        baseShield: 5,
        duration: 5 // Lasts for 5 player turns
    },
    "fireball": {
        name: "Fireball",
        description: "An explosive orb damages enemies in a 3x3 area. Scales with Wits.",
        cost: 15,
        costType: "mana",
        requiredLevel: 5,
        target: "aimed",
        baseDamage: 8,
        radius: 1 // 1-tile radius = 3x3 area
    },
    "siphonLife": {
        name: "Siphon Life",
        description: "Drains life from a target, healing you. Scales with Willpower.",
        cost: 12,
        costType: "psyche",
        requiredLevel: 4,
        target: "aimed",
        baseDamage: 4,
        healPercent: 0.5 // Heals for 50% of damage dealt
    },
    "thunderbolt": {
        name: "Thunderbolt",
        description: "Strikes a target with massive lightning damage. Scales with Wits.",
        cost: 20,
        costType: "mana",
        requiredLevel: 6,
        target: "aimed",
        baseDamage: 12 // Huge single target damage
    },
    "meteor": {
        name: "Meteor",
        description: "Summons a meteor from the heavens. Large AoE (5x5). Scales with Wits.",
        cost: 30,
        costType: "mana",
        requiredLevel: 8,
        target: "aimed",
        baseDamage: 10,
        radius: 2 // 2 tile radius = 5x5 area!
    },
    "divineLight": {
        name: "Divine Light",
        description: "Fully restores Health and cures all status effects.",
        cost: 25,
        costType: "psyche", // Miracle
        requiredLevel: 5,
        target: "self",
        type: "utility"
    },
    "magicBolt": {
        name: "Magic Bolt",
        description: "Hurls a bolt of energy, scaling with Wits.",
        cost: 8,
        costType: "mana",
        requiredLevel: 1,
        target: "aimed",
        baseDamage: 5
    },
    "psychicBlast": {
        name: "Psychic Blast",
        description: "Assaults a target's mind, scaling with Willpower.",
        cost: 10,                 // Costs a bit more than Magic Bolt
        costType: "psyche",       // <-- Uses Psyche!
        requiredLevel: 2,         // A level 2 spell
        target: "aimed",
        baseDamage: 6             // Does a bit more base damage
    },
    "frostBolt": {
        name: "Frost Bolt",
        description: "Hurls a shard of ice, scaling with Willpower. Has a chance to inflict Frostbite.",
        cost: 10,                 // A bit more expensive
        costType: "mana",
        requiredLevel: 1,
        target: "aimed",
        baseDamage: 5,
        inflicts: "frostbite",  // <-- Links to our status effect!
        inflictChance: 0.25     // 25% chance to inflict it
    },
    "poisonBolt": {
        name: "Poison Bolt",
        description: "Launches a bolt of acidic poison, scaling with Willpower. Has a chance to inflict Poison.",
        cost: 10,
        costType: "psyche",       // <-- Uses Psyche
        requiredLevel: 2,
        target: "aimed",
        baseDamage: 4,            // A bit less direct damage
        inflicts: "poison",
        inflictChance: 0.50     // 50% chance to inflict it
    },

    "darkPact": {
        name: "Dark Pact",
        description: "Sacrifice 5 Health to restore 10 Mana. Scales with Willpower.",
        cost: 5,
        costType: "health", // <-- Uses Health!
        requiredLevel: 4,
        target: "self",
        baseRestore: 10
    },
    "entangle": {
        name: "Entangle",
        description: "Roots an enemy in place, preventing movement and attacks. Scales with Intuition.",
        cost: 12,
        costType: "mana",
        requiredLevel: 3,
        target: "aimed",
        baseDamage: 2,       // Low damage
        inflicts: "root",    // New status!
        inflictChance: 1.0   // 100% chance (it's the main point of the spell)
    },
    "thornSkin": {
        name: "Thorn Skin",
        description: "Reflects damage back to attackers. Scales with Intuition.",
        cost: 15,
        costType: "mana",
        requiredLevel: 4,
        target: "self",
        type: "buff",
        baseReflect: 2, // Base damage reflected
        duration: 5
    }
    // We can easily add more spells here later!
};

const TALENT_DATA = {
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
    }
};

const SKILL_DATA = {
    "kick": {
        name: "Kick",
        description: "Stun an enemy for 2 turns. Deals low damage.",
        cost: 8,
        costType: "stamina",
        requiredLevel: 1,
        target: "aimed",
        baseDamageMultiplier: 0.2, // Very low damage
        cooldown: 8,

    },
    "vanish": {
        name: "Vanish",
        description: "Instantly drop all enemy aggro and enter Stealth.",
        cost: 15,
        costType: "stamina",
        requiredLevel: 4,
        target: "self",
        cooldown: 30,
        type: "utility"
        // Needs a tiny update in useSkill to set stealthTurns
    },
    "brace": {
        name: "Brace",
        description: "Gain temporary Defense. Scales with Constitution.",
        cost: 6,
        costType: "stamina",
        requiredLevel: 2,
        target: "self",
        type: "buff",
        baseDefense: 1,
        duration: 3,
        cooldown: 5 // <-- NEW
    },
    "tame": {
        name: "Tame Beast",
        description: "Attempt to bond with a weakened animal (HP < 30%). Scales with Charisma.",
        cost: 15,
        costType: "psyche",
        requiredLevel: 3,
        target: "aimed",
        cooldown: 20
    },
    "lunge": {
        name: "Lunge",
        description: "Attack an enemy 2-3 tiles away. Scales with Strength.",
        cost: 5,
        costType: "stamina",
        requiredLevel: 2,
        target: "aimed",
        baseDamageMultiplier: 1.0,
        cooldown: 3 // <-- NEW
    },
    "shieldBash": {
        name: "Shield Bash",
        description: "Strike an enemy with your shield, stunning them. Scales with Constitution.",
        cost: 10,
        costType: "stamina",
        requiredLevel: 3,
        target: "aimed",
        baseDamageMultiplier: 0.5, // Low damage
        cooldown: 5
        // Note: Needs logic update below
    },
    "cleave": {
        name: "Cleave",
        description: "Strike the target and enemies adjacent to it.",
        cost: 12,
        costType: "stamina",
        requiredLevel: 5,
        target: "aimed",
        baseDamageMultiplier: 0.8,
        cooldown: 4
    },
    "adrenaline": {
        name: "Adrenaline",
        description: "Instantly restore 10 Stamina.",
        cost: 5,
        costType: "health", // Sacrifice health for energy
        requiredLevel: 2,
        target: "self",
        cooldown: 10
    },
    "pacify": {
        name: "Pacify",
        description: "Attempt to calm a hostile target. Scales with Charisma.",
        cost: 10,
        costType: "psyche",
        requiredLevel: 3,
        target: "aimed",
        cooldown: 5 // <-- NEW
    },
    "inflictMadness": {
        name: "Inflict Madness",
        description: "Assault a target's mind. Scales with Charisma.",
        cost: 12,
        costType: "psyche",
        requiredLevel: 5,
        target: "aimed",
        cooldown: 8 // <-- NEW
    },
    "whirlwind": {
        name: "Whirlwind",
        description: "Strike all adjacent enemies. Scales with Strength and Dexterity.",
        cost: 15,
        costType: "stamina",
        requiredLevel: 4,
        target: "self", // Instant AoE
        cooldown: 6
    },
    "stealth": {
        name: "Stealth",
        description: "Become invisible to enemies for 5 turns or until you attack.",
        cost: 10,
        costType: "stamina",
        requiredLevel: 3,
        target: "self",
        duration: 5,
        cooldown: 10
    },
    // --- WEAPON TECHNIQUES ---
    "crush": {
        name: "Crush",
        description: "A heavy blow that stuns the target. (Hammer/Club only)",
        cost: 8,
        costType: "stamina",
        requiredLevel: 1,
        target: "aimed",
        baseDamageMultiplier: 1.2,
        cooldown: 6
        // Logic handled in executeMeleeSkill (we will treat it like shieldBash)
    },
    "quickstep": {
        name: "Quickstep",
        description: "Dash 2 tiles instantly. (Dagger only)",
        cost: 5,
        costType: "stamina",
        requiredLevel: 1,
        target: "aimed", // We'll use aiming to pick direction
        cooldown: 4,
        type: "movement"
    },
    "deflect": {
        name: "Deflect",
        description: "Enter a defensive stance, reflecting the next attack. (Sword only)",
        cost: 6,
        costType: "stamina",
        requiredLevel: 1,
        target: "self",
        duration: 2,
        cooldown: 5
    },
    "channel": {
        name: "Channel",
        description: "Focus your energy to restore Mana. (Staff only)",
        cost: 0, // Free to cast
        costType: "stamina", // But takes a turn
        requiredLevel: 1,
        target: "self",
        cooldown: 10
    },
};


const LORE_STONE_MESSAGES = [
    "The stars align when the five thrones are empty.",
    "Iron rots, but obsidian remembers.",
    "Do not trust the water in the deep grotto.",
    "The King was not the first to fall to the shadow.",
    "Magic requires sacrifice. Always."
];

const LORE_PLAINS = [
    "The wind whispers of the Old King's return.",
    "These fields were once a great battlefield. Rusty arrowheads still surface after rain.",
    "Travelers say the safe haven lies to the west, past the old ruins.",
    "The grass hides many secrets, and many graves.",
    "Look for the shrines. They still hold the power of the old gods.",
    "A broken cart lies here, its wheel rotted away.",
    "The horizon feels endless here. You feel small.",
    "Wildflowers grow in a perfect circle here. Strange.",
    "You find a stone marker with a name you cannot read."
];

const LORE_FOREST = [
    "The trees remember what the axe forgets.",
    "Wolves guard the heart of the wood. Tread lightly.",
    "Beware the shadows that move against the wind.",
    "The Elves left long ago, but their magic remains in the roots.",
    "A Machete is a traveler's best friend here.",
    "The canopy is so thick it blocks out the sun.",
    "You hear a twig snap behind you, but see nothing.",
    "Old carvings on the bark warn of 'The Sleeper'.",
    "Mushrooms glow faintly in the twilight."
];

const LORE_MOUNTAIN = [
    "The stone is hollow. The dark deepens.",
    "Dragons once roosted on these peaks. Now, only the wind remains.",
    "The Prospector seeks gold, but he will find only madness.",
    "Iron and bone. That is all that remains here.",
    "Climbing requires strength, or the right tools.",
    "The air is thin and cold. Every breath is a struggle.",
    "You see a cave entrance that looks like a screaming mouth.",
    "Avalanches are common this time of year.",
    "The echo of your footsteps sounds like someone following you."
];

const LORE_SWAMP = [
    "The water tastes of rot and old magic.",
    "Sickness takes the weak. Endurance is key.",
    "The spiders... they are growing larger.",
    "Do not follow the lights in the mist. They lead to drowning.",
    "A sunken city lies beneath the muck. You can see the spires.",
    "Bubbles rise from the bog, smelling of sulfur.",
    "The mud sucks at your boots, trying to pull you down.",
    "Leeches the size of your arm swim in the murky pools."
];

const VILLAGER_RUMORS = [
    "I heard spiders hate fire. Burn 'em, I say!",
    "If you find a pickaxe, try the mountains. Good ore there.",
    "The castle guards are tough, but they protect good loot.",
    "Don't eat the yellow snow. Or the blue mushrooms. Actually, just stick to bread.",
    "I saw a stone glowing in the woods last night. Didn't go near it.",
    "My cousin went into the crypts. He came back... wrong. Kept staring at the wall.",
    "Endurance helps you resist the swamp sickness. Eat your greens.",
    "Wits will help you find hidden doors in the caves. Knock on every wall!",
    "They say the Old King isn't dead, just... waiting.",
    "The shopkeeper cheats at cards. Don't play him.",
    "If you see a rift in the world, jump in! What's the worst that could happen?",
    "A Golden Apple can bring a man back from the brink of death."
];

const VISIONS_OF_THE_PAST = [ // For the new Obelisks
    "A VISION: You see a golden king standing atop the fortress. He raises a hand, and the mountain splits. A shadow rises from the fissure, swallowing the sun.",
    "A VISION: Five knights kneel before a dark altar. They drink from a chalice of black ichor, and their eyes turn to blue ice.",
    "A VISION: The sky burns. Not with fire, but with arcane light. The mages scream as their tower collapses, shattering into dust.",
    "A VISION: A lone figure seals the crypt doors. He is weeping. 'Sleep well, my brothers,' he whispers. 'Sleep until the world breaks.'",
    "A VISION: The blacksmith hammers a blade of black glass. 'It drinks the light,' he mutters. 'It drinks the soul.'",
    "A VISION: A star falls from the heavens, crashing into the plains. The crater glows with a purple light that does not fade.",
    "A VISION: The woods were not always trees. Once, they were tall spires of bone, reaching for a moon that wasn't there.",
    "A VISION: The King sits upon his throne, but his face is blank. A shadow whispers in his ear, and the King nods slowly."
];

const RANDOM_JOURNAL_PAGES = [
    "Day 4: My boots are soaked. The swamp is trying to swallow me whole. I swear I saw a spider the size of a wolf.",
    "I've heard tales of a safe village, but the paths are hidden. The guards say it's for our own good.",
    "The recipe for a 'Machete'? Why would I need... oh. The forest. Of course.",
    "...the ore from the mountains is useless, but the Draugr guard something... an 'essence'...",
    "The mage in the tower just laughed. 'Power comes to those who seek it,' he said, before blasting a rock to smithereens.",
    "T. was right to leave. The chief *is* mad. He's taking all our gold to the old fortress. Says he's 'paying tribute'. To what?",
    "Don't bother with the caves near the coast. They're flooded and full of grotto-spiders. Nothing of value.",
    "I saw a wolf the other day... it was *glowing*. Just faintly. I didn't stick around to find out why.",
    "That prospector, 'K', he's always looking for totems. Says he's building 'a monument to their stupidity'. Strange fellow.",
    "The guards in the village are jumpy. They keep talking about 'the King's folly' and looking east, toward the old fortress.",
    "Endurance is the key. A strong constitution can shrug off swamp-sickness, or so I've heard.",
    "Someone told me a silver tongue is as good as a steel sword. I wonder if they've ever tried to 'pacify' a skeleton?",
    "That fortress... something is *wrong* there. It's not just bandits. The air feels... heavy."
];
