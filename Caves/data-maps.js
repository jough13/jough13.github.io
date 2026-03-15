window.TILE_DATA = {

       '👻k': {
        type: 'spirit_npc',
        name: 'Echo of the King',
        tile: '👻', 
        // We use a custom property for the specific requirements
        requiresItem: 'Spirit Lens', 
        invisibleMessage: "You walk through a patch of unnaturally cold air.",
        dialogue: [
            "You... you can see me?",
            "The Five Thrones were a mistake. We divided the power, and it divided the world.",
            "My knights are gone. My kingdom is ash. Only the Void remains.",
            "Seek the Obelisks to the North, East, West, and South. Restore the key."
        ]
    },

    // 1. Forest: The Whispering Root
'♣': {
    type: 'mini_dungeon_entrance',
    theme: 'ROOT',
    name: 'Hollow Root',
    flavor: "A tunnel bores into the massive roots of an ancient tree.",
    tile: '♣'
},

// 2. Desert: The Hidden Oasis
'🏝️': {
    type: 'mini_dungeon_entrance',
    theme: 'OASIS',
    name: 'Hidden Oasis',
    flavor: "A cool breeze flows from a cave hidden behind the palms.",
    tile: '🏝️'
},

// 3. Mountain: Glacial Crevasse
'🧊': {
    type: 'mini_dungeon_entrance',
    theme: 'ICE',
    name: 'Glacial Crevasse',
    flavor: "A narrow crack in the ice leads deep into the glacier.",
    tile: '🧊'
},

// 4. The Exit (Used inside the mini-dungeons)
'🔼': {
    type: 'dungeon_exit', // Reuses your existing exit logic!
    tile: '🔼'
},

// 1. The Obelisks (The Puzzle Components)
'⬆️': { type: 'obelisk_puzzle', direction: 'north', flavor: "A freezing cold obelisk stands here.", tile: '|' },
'➡️': { type: 'obelisk_puzzle', direction: 'east', flavor: "Moss grows on the east side of this stone.", tile: '|' },
'⬅️': { type: 'obelisk_puzzle', direction: 'west', flavor: "The stone is warm, facing the setting sun.", tile: '|' },
'⬇️': { type: 'obelisk_puzzle', direction: 'south', flavor: "The stone is scorched and hot.", tile: '|' },

// 2. The Sealed Door (The Reward Location)
'🚪': { 
    type: 'sealed_door', 
    name: 'The Vault of the Old King',
    flavor: "A massive stone door with no handle. It has a keyhole.",
    tile: '⛩️' 
},

// 3. Invisible Spirit (Plot NPC)
'👻k': {
    type: 'spirit_npc',
    name: 'Echo of the King',
    tile: '👻',
    dialogue: [
        "You... you can see me?",
        "The Five Thrones were a mistake. We divided the power, and it divided the world.",
        "Find the Obelisks. Restore the key. End my suffering."
    ]
},
    '🚢': {
        type: 'loot_container', // Reuses the chest logic!
        name: 'Sunken Shipwreck',
        flavor: "You search the rotting hull for salvaged goods...",
        lootTable: ['$', '🐚', '💎b', '⚓', '🐟'] 
    },
    '🧙‍♂️': {
        type: 'lore_statue', // Reuses statue logic!
        message: [
            "The hermit's ghost whispers: 'The King didn't find the Void. The Void found him.'",
            "A message is carved into the stone: 'Beware the rain in the deadlands.'"
        ]
    },
    '#': {
        type: 'lore',
        message: 'An ancient, weathered stone stands here. The markings are faded.'
    },
    '☗': {
        type: 'lore',
        message: ['"...the king has fallen..."', '"...his castle to the west lies empty..."', '"...but a dark presence still lingers."']
    },
    '⛰': {
        type: 'dungeon_entrance',
        getCaveId: (x, y) => `cave_${x}_${y}`
    },
    '>': {
        type: 'dungeon_exit'
    },
    '🏰': {
        type: 'castle_entrance',
        getCastleId: (x, y) => `castle_${x}_${y}`
    },
    'X': {
        type: 'castle_exit'
    },
    'B': {
        type: 'lore',
        message: 'This is a bounty board, covered in notices.'
    },
    'L': {
        type: 'journal',
        title: 'The King\'s Lament',
        content: `Day 34 since the fall...\n\nThe stones of this castle weep. I hear them every night. The whispers tell of a power that sleeps beneath the mountains, a power we were foolish to awaken.\n\nMy knights are gone. My kingdom is ash. All that remains is this cursed immortality, a silent witness to my failure.`
    },
    'N': {
        type: 'npc',
        title: 'Villager'
    },
    '§': {
        type: 'shop',
        title: 'General Store'
    },
    'H': {
        type: 'npc_healer',
        title: 'Healer'
    },
    'W': {
        type: 'workbench',
        title: 'Crafting Workbench'
    },
    'G': {
        type: 'npc_guard',
        title: 'Castle Guard'
    },
    'O': {
        type: 'npc_sage',
        title: 'Sage'
    },
    'T': {
        type: 'npc_skill_trainer',
        title: 'Skill Trainer'
    },
    'J': {
        type: 'journal',
        title: 'Orc War-Chant',
        content: `Blood and dust. Steel and bone.\n\nThe weak build with stone. The strong build with fear.\n\nWe come from the fire, we return to the ash. The mountain is our mother, the world our feast. Stomp the soft-skins. Take their steel. Raise the tusk-banner.\n\n...the rest is scrawled in a crude, unintelligible script.`
    },
    '📘': {
        type: 'journal',
        title: 'Frozen Journal',
        content: `Day 12: The cold... it seeps into your bones. But the essence in these walls is worth a fortune. I must have more.\n\nDay 15: I saw one of them today. A... walking corpse, encased in ice. It didn't see me. My pickaxe feels heavy.\n\nDay 17: They are the old ones. The first warriors. The cold preserves them. Binds them. They guard the essence.\n\nDay ???: Can't feel my fingers. It's in my pack. I can't... I...`
    },
    'K': {
        type: 'npc_prospector',
        title: 'Lost Prospector'
    },
    'c': {
        type: 'canoe',
        title: 'A small canoe'
    },
    '♛': {
        type: 'landmark_castle',
        getCastleId: (x, y) => `castle_landmark_${x}_${y}`
    },
    'b': {
        type: 'enemy'
    },
    'w': {
        type: 'enemy'
    },
    'V': {
        type: 'village_entrance',
        getVillageId: (x, y) => `village_${x}_${y}`
    },
    '⛩️': {
        type: 'shrine'
    },
    '🎓': {
        type: 'npc_historian',
        title: 'Royal Historian'
    },
    '|': {
        type: 'obelisk'
    },
    '¥': {
        type: 'trader'
    },
    '📦': {
        type: 'loot_chest'
    },
    '🔥': {
        type: 'cooking_fire',
        flavor: "A crackling fire. Good for cooking."
    },
    'Ω': {
        type: 'dungeon_entrance',
        getCaveId: (x, y) => `void_${x}_${y}`, // Creates a unique ID starting with "void_"
        flavor: "The reality tears open here. You hear whispers from the other side."
    },
    '∴': {
        type: 'dig_spot',
        name: 'Loose Soil',
        flavor: "The earth here looks disturbed recently..."
    },
    'T': {
        type: 'decoration', // Dead Tree
    },
    '⚰️': {
        type: 'loot_container', // We'll treat this like a chest, but with specific flavor
        name: 'Ancient Grave',
        flavor: "You disturb the resting place of a forgotten warrior...",
        lootTable: ['(', '(', '†', '👢', '🛡️', '💀'] // Bones, Daggers, Boots, Shields
    },
    '🗿': {
        type: 'lore_statue',
        message: [
            "The statue's face is worn away, but it still holds a bowl of fresh water.",
            "A statue of a weeping knight. The inscription reads: 'Duty is heavier than a mountain.'",
            "A crude idol made of mud and sticks. It smells of goblin musk.",
            "A statue of a woman holding a lantern. You feel safer standing near it.",
            "A headless statue pointing toward the eastern mountains.",
            "A statue of a dog. Someone has left a Fossilized Bone at its feet."
        ]
    },
    '🏺': {
        type: 'loot_container',
        name: 'Dusty Urn',
        flavor: "You smash the urn open...",
        lootTable: ['$', '$', 'gold_dust', 'ancient_coin', '💍']
    },
    '🕳️': {
        type: 'landmark_cave', // New type
        getCaveId: (x, y) => `cave_landmark`, // Fixed ID so it's always the same dungeon
        flavor: "A gaping abyss stares back at you. Cold air rushes up from the depths."
    },
    '⛺': {
        type: 'campsite',
        flavor: "An abandoned campsite. The embers are still warm."
    },
    '🏛️': {
        type: 'ruin',
        flavor: "The crumbling remains of an ancient library."
    },
    '🌿': {
        type: 'forage',
        item: 'Medicinal Herb'
    },
    '🕸': {
        type: 'obstacle',
        name: 'Spider Web',
        tool: 'Machete',
        spell: 'fireball', // Fireball can burn it
        flavor: "A thick, sticky web blocks the path."
    },
    '🛢': {
        type: 'barrel',
        name: 'Oil Barrel',
        flavor: "Filled with volatile oil. Highly flammable."
    },
    '🏚': {
        type: 'obstacle',
        name: 'Cracked Wall',
        tool: 'Pickaxe',
        flavor: "The stone looks fractured and weak."
    },
    '🌳': {
        type: 'obstacle',
        name: 'Thicket',
        tool: 'Machete',
        flavor: "A dense wall of thorny vines."
    },
    '🌳e': {
        type: 'anomaly',
        name: 'Elder Tree',
        flavor: "A massive tree with silver bark. It hums with life."
    },
    '🗿k': {
        type: 'anomaly',
        name: 'Petrified Giant',
        flavor: "A boulder shaped like a weeping giant. Moss covers its eyes."
    },
    '🦴d': { // Reusing bone icon for map tile
        type: 'anomaly',
        name: 'Dragon Skeleton',
        flavor: "The bleached ribs of a colossal beast rise from the sand."
    },
};

window.CASTLE_LAYOUTS = {
LIBRARY_WING: {
        spawn: { x: 10, y: 11 }, // <--- CHANGED x from 11 to 10
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓.........B.........▓',
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.▓L▓.▓L▓.O.▓L▓.▓L▓.▓', 
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓...................▓',
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.▓L▓.▓L▓.🎓.▓L▓.▓L▓.▓', 
            '▓.▓▓▓.▓▓▓...▓▓▓.▓▓▓.▓',
            '▓.........W.........▓', 
            '▓...................▓',
            '▓...▓▓▓▓▓▓.X.▓▓▓▓▓▓.▓', // The X is at 11, so we spawn at 10 (left of it)
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },
    COURTYARD: {
        spawn: {
            x: 37,
            y: 32
        }, // Your original spawn point
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...................................................................▓',
            '▓...................................B...................................▓',
            '▓.....▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.....▓',
            '▓.....▓.....................▓.......▓.....................▓.....▓',
            '▓.....▓.....................▓.......▓.....................▓.....▓',
            '▓.....▓.....................▓.......▓...▓▓▓...▓▓▓...▓▓▓...▓.....▓',
            '▓.....▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.......▓...▓.▓...▓.▓...▓.▓...▓.....▓',
            '▓...................................▓...▓▓▓...▓▓▓...▓▓▓...▓.....▓',
            '▓...................................▓.....................▓.....▓',
            '▓...................................▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.....▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓....▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓.......................................▓',
            '▓....▓...................▓..........................................▓',
            '▓....▓...▓▓▓...▓▓▓...▓...▓..........................................▓',
            '▓....▓...▓.▓...▓.▓...▓...▓..........................................▓',
            '▓....▓...▓▓▓...▓▓▓...▓...▓..........................................▓',
            '▓....▓...................▓..........................................▓',
            '▓....▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓..........................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓...................................................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓X▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', // Exit
        ]
    },

    TOWER: {
        spawn: { x: 10, y: 18 },
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...................▓',
            '▓...▓▓▓.............▓',
            '▓...▓.▓...▓▓▓.......▓',
            '▓...▓.▓...▓.▓.......▓',
            '▓...▓▓▓...▓▓▓.......▓',
            '▓...................▓',
            '▓.........▓▓▓▓▓▓▓▓▓▓▓',
            '▓.........▓.........▓',
            '▓.........▓........▓', // Note: This row in your original was also missing a space at the end
            '▓.........▓.........▓',
            '▓.........▓...L.....▓',
            '▓.........▓.........▓',
            '▓...▓▓▓...▓▓▓.......▓',
            '▓...▓.O.▓.......▓...▓', // Fixed width
            '▓...▓.📄.▓.......▓...▓', // Fixed width
            '▓...▓▓▓...▓.......▓...▓', // Fixed width
            '▓.............▓.....▓',
            '▓.............X.....▓',
            '▓▓▓▓▓▓▓▓▓▓▓T▓▓▓▓▓▓▓▓▓'
        ]
    },

    FORTRESS: {
        spawn: {
            x: 4,
            y: 38
        }, // Spawns near the gate
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...................................................▓...▓...▓',
            '▓...▓...▓..........▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...............................................................................▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓...B...▓...▓.......▓...▓.......▓...▓.......▓...▓...$.....▓...▓...$.....▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓',
            '▓...............................................................................▓',
            '▓...............T.....................................................G.........▓',
            '▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................................................................▓', // Exit is here
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...............▓$▓...............▓',
            '▓....W..........▓$▓....W..........▓',
            '▓...............▓$▓...............▓',
            '▓...............▓▓▓...............▓',
            '▓.................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', // Bottom of the fortress
        ]
    },
    GRAND_FORTRESS: {
        spawn: {
            x: 4,
            y: 38
        }, // Same spawn as Fortress
        map: [
            // This is a copy of FORTRESS, with two new rooms added
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...................................................▓...▓...▓',
            '▓...▓...▓..........▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓...▓.......................................................................▓...▓',
            '▓...▓...▓..................▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.......................▓...▓',
            '▓...▓...▓..................▓.........B.........▓.......▓.......................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓▓▓...▓.........▓...L...▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓.......▓.......▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓▓▓...▓.......▓..O....▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓.......▓.......▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓▓▓▓▓▓▓▓▓...▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓.....j.▓...▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓...💪....▓...▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓.......▓...▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓▓▓▓▓▓▓▓▓...▓...▓.........▓...▓.........▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...............................................................................▓',
            '▓.......................▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...............................▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓.......$.......▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓...$...$...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓...B...▓...▓.......▓...▓...$...B...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓...$...$...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......$.......▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓................................G...G..........................................▓',
            '▓...............................................................................▓',
            '▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................................................................▓', // Exit is here
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',

            '▓...............▓$▓...............▓',
            '▓...............▓$▓...............▓',
            '▓...............▓$▓...............▓',
            '▓...............▓▓▓...............▓',
            '▓.................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', // Bottom of the fortress
        ]

    },

    SAFE_HAVEN: {
        spawn: { x: 15, y: 26 },
        map: [
            'F F F F F F F F F F F F F F F F F F F F F F F F F F F F F F',
            'F F F F F F F F F F F F F F F F F F F F F F F F F F F F F F',
            'F F 🧱🧱🧱🧱🧱 F F F F F F F F F F F F F 🧱🧱🧱🧱🧱 F F',
            'F F 🧱.....🧱 F F F F F F F F F F F F F 🧱.....🧱 F F',
            'F F 🧱..H..🧱 F F F F F F F F F F F F F 🧱..§..🧱 F F',
            'F F 🧱.....🧱 F F F F F F F F F F F F F 🧱.....🧱 F F',
            'F F 🧱🧱+🧱🧱 F F F F F F F F F F F F F 🧱🧱+🧱🧱 F F',
            'F F F ... F F F F F F F F F F F F F F F F ... F F F',
            'F F F ... F F F F F F F F F F F F F F F F ... F F F',
            'F F F ... F F F 🧱🧱🧱🧱🧱🧱🧱 F F F F F ... F F F',
            'F F F ... F F F 🧱...........🧱 F F F F F ... F F F',
            'F F F ... F F F 🧱...🔥.B...🧱 F F F F F ... F F F',
            'F F F ... F F F 🧱...........🧱 F F F F F ... F F F',
            'F F F ... F F F 🧱.....🎓.....🧱 F F F F F ... F F F',
            'F F F ... F F F 🧱🧱🧱...🧱🧱🧱 F F F F F ... F F F',
            'F F F ... F F F F F F ... F F F F F F F F ... F F F',
            'F F F ... F F F F F F ... F F F F F F F F ... F F F',
            'F F 🧱🧱+🧱🧱 F F F F ... F F F F F F F 🧱🧱+🧱🧱 F F',
            'F F 🧱.....🧱 F F F F ... F F F F F F F 🧱.....🧱 F F',
            'F F 🧱..R..🧱 F F F F ... F F F F F F F 🧱..T..🧱 F F',
            'F F 🧱.....🧱 F F F F ... F F F F F F F 🧱.....🧱 F F',
            'F F 🧱🧱🧱🧱🧱 F F F F ... F F F F F F F 🧱🧱🧱🧱🧱 F F',
            'F F F F F F F F F F F ... F F F F F F F F F F F F F F',
            'F F F F F F F F F F F ... F F F F F F F F F F F F F F',
            'F F F F F F F F F F F ... F F F F F F F F F F F F F F',
            'F F F F F F F F F F F ... F F F F F F F F F F F F F F',
            'F F F F F F F F F F F .X. F F F F F F F F F F F F F F', // Exit
            'F F F F F F F F F F F F F F F F F F F F F F F F F F F',
        ]
    },

};

window.CAVE_THEMES = {
    FUNGAL: {
        name: 'The Mycelium Depths',
        wall: '▓',
        floor: '.',
        secretWall: '▒',
        colors: {
            wall: '#4a1d96', // Deep Purple
            floor: '#7e22ce' // Bright Purple
        },
        decorations: ['🍄', '🍄', '🌿', '🏺', 'S'], // Heavy mushroom spawns
        enemies: ['@', 'l', 's'] // Spiders, Leeches, Skeletons
    },
    GOLDEN: {
        name: 'The Glimmering Vault',
        wall: '🧱',
        floor: '.',
        secretWall: '▒',
        colors: {
            wall: '#ca8a04', // Dark Gold/Bronze
            floor: '#facc15' // Gold
        },
        decorations: ['$', '$', '🏺', '👑', '📦'], // High gold spawns
        enemies: ['m', 'o', 'C'] // Mages, Orcs, and Bandit Chiefs
    },
    CORRUPTED: {
        name: 'The Abyssal Tear',
        wall: '▓',
        floor: '.',
        phaseWall: '▒',
        colors: {
            wall: '#000000', 
            floor: '#1e1b4b' // Deep Midnight Blue
        },
        decorations: ['✨', '💀', 'vd', 'Ω'],
        enemies: ['v', '😈d', 'a']
    },
    ROCK: {
        name: 'A Dark Cave',
        wall: '▓',
        floor: '.',
        secretWall: '▒',
        colors: {
            wall: '#422006',
            floor: '#a16207'
        },
        decorations: ['+', '🔮', '$', '📖', 'K', '🏚'],
        enemies: ['g', 's', '@']
    },
    ICE: {
        name: 'A Glacial Cavern',
        wall: '▒', 
        secretWall: '▓',
        floor: '.', // FIX: Changed from ':' to '.' to prevent Wildberry conflict
        colors: {
            wall: '#99f6e4',
            floor: '#e0f2fe' // This color makes it look like ice
        },
        enemies: ['s', 'w', 'Z', 'Y']
    },
    FIRE: {
        name: 'A Volcanic Fissure',
        wall: '▓',
        secretWall: '▒',
        floor: '.', 
        colors: {
            wall: '#450a0a',
            floor: '#ef4444' 
        },
        decorations: ['+', '$', '🔥', 'J'],
        enemies: ['b', 'C', 'o', 'm', '👺', 'f']
    },
    CRYPT: {
        name: 'A Musty Crypt',
        wall: '▓', 
        floor: '.', 
        secretWall: '▒',
        colors: {
            wall: '#374151', 
            floor: '#4b5563' 
        },
        decorations: ['+', '$', '(', '†', '🌀', '😱', '💀', '🕸'],
        enemies: ['s', 'Z', 'a']
    },
    CRYSTAL: {
        name: 'A Crystalline Tunnel',
        wall: '▒', 
        secretWall: '▓',
        floor: '.',
        colors: {
            wall: '#67e8f9', 
            floor: '#22d3ee' 
        },
        decorations: ['💜', '🔮', '$', 'K'],
        enemies: ['g']
    },
    VOID: {
        name: 'The Void Sanctum',
        wall: '▓',         
        floor: '.',        
        phaseWall: '▒',    
        colors: {
            wall: '#2e0249', 
            floor: '#0f0518' 
        },
        decorations: ['✨', '💀', 'Ω'],
        enemies: ['v', 'a', 'm', 'v', '😈d']
    },
    ABYSS: {
        name: 'The Maw',
        wall: '▓',
        floor: '.',
        secretWall: '▒',
        colors: {
            wall: '#0f0f0f', 
            floor: '#331133' 
        },
        decorations: ['💀', '🕸️', '🔥', 'Ω', '💎', '🕸'],
        enemies: ['o', 'm', 'Z', 'g', '🐺', '🦂', 'a'] 
    },
    SUNKEN: {
        name: 'The Sunken Temple',
        wall: '🧱',
        floor: '.', 
        secretWall: '▒',
        colors: {
            wall: '#0e7490', 
            floor: '#1e3a8a'  
        },
        decorations: ['🐟', '🌿', '🗿', '🦀'],
        enemies: ['🐸', '🐍', 'l', '🦑']
    },
    GROTTO: {
        name: 'A Sunken Grotto',
        wall: '▓', 
        floor: '.', // Changed from ':' to '.'
        secretWall: '▒',
        colors: {
            wall: '#14532d', 
            floor: '#16a34a' 
        },
        decorations: ['+', 'S', '🔮', '☣️', '🕸'],
        enemies: ['g', 'w', '@']
    }
};

window.CAVE_ROOM_TEMPLATES = {
    "The Alchemist's Lab": {
        width: 7,
        height: 5,
        map: [
            ' WWWWW ',
            'W🧪.🧪W', // Potions
            'W..W..W',
            'W.🧪.🧪W',
            ' WWWWW '
        ]
    },
    "Void Observation Deck": {
        width: 9,
        height: 5,
        map: [
            ' WWWWWWW ',
            'W.......W',
            'W..Ω.Ω..W', // Two Void Rifts
            'W.......W',
            ' WWWWWWW '
        ]
    },
    "Goblin Barracks": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.....W',
            'W.g.g.W',
            'W..📕..W',
            'W.g.g.W',
            'W.....W',
            ' WWWWW '
        ]
    },
    "Skeleton Crypt": {
        width: 9,
        height: 7,
        map: [
            ' WWWWWWW ',
            'WW.....WW',
            'W...s...W',
            'W..s†s..W', // Spawns a Bone Dagger!
            'W...s...W',
            'WW.....WW',
            ' WWWWWWW '
        ]
    },
    "Orc Stash": {
        width: 5,
        height: 5,
        map: [
            'WWWWW',
            'W.J.W', // Orc Journal
            'W.+o.W',
            'W.📗.W',
            'WWWWW'
        ]
    },
    "Treasure Nook": {
        width: 3,
        height: 3,
        map: [
            'W★W',
            '$ $',
            'W☆W'
        ]
    },
    "Flooded Grotto": {
        width: 9,
        height: 7,
        map: [
            ' WWWWWWW ',
            'W~~~~~~~W',
            'W~W...W~W',
            'W~W.S.W~W', // Stamina Crystal
            'W~W...W~W',
            'W~~~~~~~W',
            ' WWWWWWW '
        ]
    },
    "Bandit Stash": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.b.b.W',
            'W.<q<.W',
            'W..C..W', // Bandit Chief
            'W.$.$.W', // Gold
            'W.<...W',
            ' WWWWW '
        ]
    },
    "Abandoned Camp": {
        width: 5,
        height: 5,
        map: [
            'WWWWW',
            'W...W',
            'W.J.W', // A Journal
            'W.+📄.W',
            'WWWWW'
        ]
    },
    "Acolyte's Nook": {
        width: 5,
        height: 5,
        map: [
            'WWWWW',
            'W...W',
            'W.a.W', // An Acolyte
            'W.j.W', // The new Journal
            'WWWWW'
        ]
    },
    "Champion's Crypt": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.<.<.W', // Traps!
            'W.....W',
            'W..s..W', // The Skeleton "Champion"
            'W..💪..W', // Guards the Tome of Strength!
            'W.<.<.W', // More traps!
            ' WWWWW '
        ]
    }
};

window.ATMOSPHERE_TEXT = {
    NIGHT: [
        "The stars are uncaringly bright tonight.",
        "A distant wolf howl shivers through the air.",
        "The darkness feels heavy, like a physical weight.",
        "You hear something chittering in the dark.",
        "The moon casts long, twisted shadows."
    ],
    DAWN: [
        "The first light of dawn paints the horizon gold.",
        "Dew glistens on the ground.",
        "The world wakes up. Birds begin to sing.",
        "A cold morning mist clings to the ground."
    ],
    STORM: [
        "Thunder rattles your teeth.",
        "The wind screams like a banshee.",
        "Lightning illuminates the landscape in a stark flash.",
        "The rain is torrential. It's hard to see."
    ],
    FOREST: [
        "The trees seem to lean in as you pass.",
        "You spot scratch marks on a trunk. Too big for a bear.",
        "The smell of pine and rotting leaves is thick.",
        "Was that a face in the bark? No, just a knot."
    ],
    DESERT: [
        "The heat rising from the sand distorts the air.",
        "Your throat feels dry just looking at the dunes.",
        "The wind shifts the sand, erasing your footprints.",
        "Bleached bones poke out from a dune."
    ],
    MOUNTAIN: [
        "The air is thin and sharp here.",
        "Loose gravel clatters down the cliffside.",
        "You feel vertiginous looking down.",
        "The wind howls through the crags."
    ],
    SWAMP: [
        "Bubbles rise from the muck with a foul smell.",
        "Insects swarm around your head.",
        "The ground feels spongy and unstable.",
        "You see ripples in the water. Something is moving."
    ]
};
