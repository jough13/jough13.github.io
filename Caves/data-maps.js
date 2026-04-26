window.TILE_DATA = {

    '👻k': {
        type: 'spirit_npc',
        name: 'Echo of the King',
        tile: '👻', 
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
        type: 'dungeon_exit', 
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

    '🚢': {
        type: 'loot_container', 
        name: 'Sunken Shipwreck',
        flavor: "You search the rotting hull for salvaged goods...",
        lootTable: ['$', '🐚', '💎b', '⚓', '🐟'] 
    },
    '🧙‍♂️': {
        type: 'lore_statue', 
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
    '🎖️': {
        type: 'npc_captain',
        title: 'Captain of the Guard',
        flavor: "A grizzled veteran missing an eye."
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
    'b': { type: 'enemy' },
    'w': { type: 'enemy' },
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
        getCaveId: (x, y) => `void_${x}_${y}`, 
        flavor: "The reality tears open here. You hear whispers from the other side."
    },
    '∴': {
        type: 'dig_spot',
        name: 'Loose Soil',
        flavor: "The earth here looks disturbed recently..."
    },
    '⚰️': {
        type: 'loot_container', 
        name: 'Ancient Grave',
        flavor: "You disturb the resting place of a forgotten warrior...",
        lootTable: ['(', '(', '†', '👢', '🛡️w', '💀', ' ancient_coin']
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
        type: 'landmark_cave', 
        getCaveId: (x, y) => `cave_landmark`, 
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
        spell: 'fireball', 
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
    '🦴d': { 
        type: 'anomaly',
        name: 'Dragon Skeleton',
        flavor: "The bleached ribs of a colossal beast rise from the sand."
    },
};

window.CASTLE_LAYOUTS = {
    LIBRARY_WING: {
        spawn: { x: 10, y: 11 },
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
            '▓...▓▓▓▓▓▓.X.▓▓▓▓▓▓.▓', 
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },
    COURTYARD: {
        spawn: { x: 34, y: 34 }, 
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F▓',
            '▓...................................B.............................▓',
            '▓.F.F.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.F.F▓',
            '▓.....▓.....................▓.......▓.....................▓.......▓',
            '▓.F.F.▓.F.F.F.F.F.F.F.F.F.F.▓.......▓.F.F.F.F.F.F.F.F.F.F.▓.F.F.F.▓',
            '▓.....▓.F.F.F.F.F.F.F.F.F.F.▓.......▓.F.F.F.F.F.F.F.F.F.F.▓.......▓',
            '▓.F.F.▓▓▓▓▓▓▓▓▓▓▓=▓▓▓▓▓▓▓▓▓▓▓=======▓▓▓▓▓▓▓▓▓▓▓=▓▓▓▓▓▓▓▓▓▓▓.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................=..................=..........=..................▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F...=...F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓................====================..........=..................▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓..............................................=..................▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓..............................................=..................▓',
            '▓.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F.F..=..F.F.F.F.F.F.F.F.▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓X▓▓▓▓▓▓▓▓▓▓▓=▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', 
        ]
    },

    TOWER: {
        spawn: { x: 10, y: 17 },
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓......▓▓▓▓▓▓▓......▓',
            '▓....▓▓▓.....▓▓▓....▓',
            '▓...▓▓.........▓▓...▓',
            '▓..▓▓...🎓.......▓▓..▓',
            '▓.▓▓......O.......▓▓.▓',
            '▓.▓.......📖.......▓.▓',
            '▓▓▓...T.......L...▓▓▓',
            '▓▓........⛲........▓▓',
            '▓▓▓...............▓▓▓',
            '▓.▓.......W.......▓.▓',
            '▓.▓▓.............▓▓.▓',
            '▓..▓▓...........▓▓..▓',
            '▓...▓▓.........▓▓...▓',
            '▓....▓▓▓.....▓▓▓....▓',
            '▓......▓▓▓▓▓▓▓......▓',
            '▓.........X.........▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },

    FORTRESS: {
        spawn: { x: 4, y: 38 }, 
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
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.........▓...▓.........▓...▓.........▓...▓',
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
            '▓...............T.....................................................🎖️.........▓',
            '▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................................................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...............▓$▓...............▓.............................................▓',
            '▓....W..........▓$▓....W..........▓.............................................▓',
            '▓...............▓$▓...............▓.............................................▓',
            '▓...............▓▓▓...............▓.............................................▓',
            '▓.................................▓.............................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },

    GRAND_FORTRESS: {
        spawn: { x: 4, y: 38 }, 
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓...............................................................................▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...▓.......................................................................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓.........................................▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓▓▓▓▓▓▓...▓▓▓▓▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓......▓...▓...▓...▓......▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓..🧙...▓...▓...▓...▓..O...▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓...▓▓▓..▓▓▓...▓▓▓▓▓...▓▓▓..▓▓▓...▓...▓...▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓........=..................=.............▓...▓...▓...▓',
            '▓...▓...▓..........▓...▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓...▓',
            '▓...▓...▓..........▓..........==...................==................▓...▓...▓',
            '▓...▓...▓..........▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓...▓.....................==...................==...................▓...▓',
            '▓...▓...▓..................▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓.................▓...▓',
            '▓...▓...▓..................▓..==.....B.........▓...==..▓.................▓...▓',
            '▓...▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓.==▓▓▓...▓.........▓..==...▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓.......▓.......▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓▓▓...▓.......▓..O....▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓.......▓.......▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓▓▓▓▓▓▓▓▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓.....j.▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓...💪....▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓.......▓...▓...▓.........▓...▓',
            '▓...▓.............▓...▓.......==..▓...▓.▓...▓...▓▓▓▓▓▓▓▓▓...▓...▓.........▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓==▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓...▓',
            '▓...............................==..............................................▓',
            '▓.......................▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...............................▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...==..$.......▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓...==..$...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓...B...▓...▓.......▓...▓...==..B...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓...==..$...$...▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓.......▓...▓.......▓...▓...==..$.......▓...▓.......▓...▓.......▓...▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓...▓',
            '▓...............................==...............🎖️...G..........................▓',
            '▓...............T...............==....................................G.........▓',
            '▓▓▓▓...▓▓▓▓▓▓▓▓▓▓▓▓▓.▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................==..............................................▓', 
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓==▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓...............▓$▓.............==▓.............................................▓',
            '▓....W..........▓$▓....W........==▓.............................................▓',
            '▓...............▓$▓.............==▓.............................................▓',
            '▓...............▓▓▓.............==▓.............................................▓',
            '▓...............................==..............................................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]

    },

    SAFE_HAVEN: {
        spawn: { x: 13, y: 13 },
        map: [
            'FFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FF🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱FF',
            'FF🧱.........⛲.........🧱FF',
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱.🧱H+..===..+§🧱.🧱FF',
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱........===........🧱FF',
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱.🧱T+..===..+🎓🧱.🧱FF',
            'FF🧱.🧱🧱🧱.===.🧱🧱🧱.🧱FF',
            'FF🧱........===........🧱FF',
            'FF🧱🧱🧱🧱🧱.X.🧱🧱🧱🧱🧱FF',
            'FFFFFFFFFF...FFFFFFFFFFFFFF',
            'FFFFFFFFFF...FFFFFFFFFFFFFF'
        ]
    },

};

window.CAVE_THEMES = {
    FUNGAL: {
        name: 'The Mycelium Depths',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#4a1d96', floor: '#7e22ce' },
        decorations: ['🍄', '🍄', '🌿', '🏺', 'S'], 
        enemies: ['@', 'l', 's'] 
    },
    GOLDEN: {
        name: 'The Glimmering Vault',
        wall: '🧱', floor: '.', secretWall: '▒',
        colors: { wall: '#ca8a04', floor: '#facc15' },
        decorations: ['$', '$', '🏺', '👑', '📦'], 
        enemies: ['m', 'o', 'C'] 
    },
    CORRUPTED: {
        name: 'The Abyssal Tear',
        wall: '▓', floor: '.', phaseWall: '▒',
        colors: { wall: '#000000', floor: '#1e1b4b' },
        decorations: ['✨', '💀', 'vd', 'Ω'],
        enemies: ['v', '😈d', 'a']
    },
    ROCK: {
        name: 'A Dark Cave',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#422006', floor: '#a16207' },
        decorations: ['♥', '🔮', '$', '📖', 'K', '🏚'],
        enemies: ['g', 's', '@']
    },
    ICE: {
        name: 'A Glacial Cavern',
        wall: '▒', secretWall: '▓', floor: '.',
        colors: { wall: '#99f6e4', floor: '#e0f2fe' },
        enemies: ['s', 'w', 'Z', 'Y']
    },
    FIRE: {
        name: 'A Volcanic Fissure',
        wall: '▓', secretWall: '▒', floor: '.', 
        colors: { wall: '#450a0a', floor: '#ef4444' },
        decorations: ['♥', '$', '🔥', 'J'],
        enemies: ['b', 'C', 'o', 'm', 'f']
    },
    CRYPT: {
        name: 'A Musty Crypt',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#374151', floor: '#4b5563' },
        decorations: ['♥', '$', '(', '†', '🌀', '😱', '💀', '🕸', '⚰️'],
        enemies: ['s', 'Z', 'a']
    },
    CRYSTAL: {
        name: 'A Crystalline Tunnel',
        wall: '▒', secretWall: '▓', floor: '.',
        colors: { wall: '#67e8f9', floor: '#22d3ee' },
        decorations: ['💜', '🔮', '$', 'K'],
        enemies: ['g', '🧌']
    },
    VOID: {
        name: 'The Void Sanctum',
        wall: '▓', floor: '.', phaseWall: '▒',    
        colors: { wall: '#2e0249', floor: '#0f0518' },
        decorations: ['✨', '💀', 'Ω'],
        enemies: ['v', 'a', 'm', 'v', '😈d']
    },
    ABYSS: {
        name: 'The Maw',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#0f0f0f', floor: '#331133' },
        decorations: ['💀', '🕸️', '🔥', 'Ω', '💎', '🕸'],
        enemies: ['o', 'm', 'Z', 'g', '🐺', '🦂', 'a', '👾'] 
    },
    SUNKEN: {
        name: 'The Sunken Temple',
        wall: '🧱', floor: '.', secretWall: '▒',
        colors: { wall: '#0e7490', floor: '#1e3a8a' },
        decorations: ['🐟', '🌿', '🗿'],
        enemies: ['🐸', '🐍', 'l', '🐉h']
    },
    GROTTO: {
        name: 'A Sunken Grotto',
        wall: '▓', floor: '.', secretWall: '▒',
        colors: { wall: '#14532d', floor: '#16a34a' },
        decorations: ['♥', 'S', '🔮', '☣️', '🕸'], 
        enemies: ['g', 'w', '@']
    }
};

window.CAVE_ROOM_TEMPLATES = {
    "The Alchemist's Lab": {
        width: 7,
        height: 5,
        map: [
            ' WWWWW ',
            'W🧪.🧪W', 
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
            'W..Ω.Ω..W', 
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
            'W..s⚰️s..W', 
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
            'W.J.W', 
            'W.♥o.W',
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
            'W~W.S.W~W', 
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
            'W..C..W', 
            'W.$.$.W', 
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
            'W.J.W', 
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
            'W.a.W', 
            'W.j.W', 
            'WWWWW'
        ]
    },
    "Champion's Crypt": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.<.<.W', 
            'W.....W',
            'W..s..W', 
            'W..💪..W', 
            'W.<.<.W', 
            ' WWWWW '
        ]
    },
    "The Spider's Nest": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.🕸️.🕸️.W',
            'W🕸️.@.🕸️W',
            'W..🦴..W', 
            'W🕸️.@.🕸️W',
            'W.🕸️.🕸️.W',
            ' WWWWW '
        ]
    },
    "Cultist Summoning Circle": {
        width: 9,
        height: 7,
        map: [
            ' WWWWWWW ',
            'W.......W',
            'W..c.c..W',
            'W.c.Ω.c.W', 
            'W...z...W', 
            'W.......W',
            ' WWWWWWW '
        ]
    },
    "The Dragon's Hoard": {
        width: 9,
        height: 6,
        map: [
            ' WWWWWWW ',
            'W.$$$$.$W', 
            'W$🐲$$📦$W',
            'W.$$$$.$W',
            'W.......W', 
            ' WWWWWWW '
        ]
    },
    // --- NEW TEMPLATES ---
    "Forgotten Armory": {
        width: 7,
        height: 5,
        map: [
            ' WWWWW ',
            'W.....W',
            'W.⚔️.🛡️.W', 
            'W.....W',
            ' WWWWW '
        ]
    },
    "Torture Chamber": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.⛓️.⛓️.W',
            'W..s..W',
            'W.Z.Z.W',
            'W..s..W',
            'W.⛓️.⛓️.W',
            ' WWWWW '
        ]
    },
    "Ritual Dais": {
        width: 9,
        height: 7,
        map: [
            ' WWWWWWW ',
            'WW.....WW',
            'W..🔥.🔥..W',
            'W...a...W',
            'W..🔥.🔥..W',
            'WW.....WW',
            ' WWWWWWW '
        ]
    },
    "Mushroom Grotto": {
        width: 7,
        height: 7,
        map: [
            ' WWWWW ',
            'W.🍄.🍄.W',
            'W.....W',
            'W🍄.🌿.🍄W',
            'W.....W',
            'W.🍄.🍄.W',
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
        "The moon casts long, twisted shadows.",
        "A sudden drop in temperature makes you shiver.",
        "Something large moves just beyond the edge of your vision."
    ],
    DAWN: [
        "The first light of dawn paints the horizon gold.",
        "Dew glistens on the ground.",
        "The world wakes up. Birds begin to sing.",
        "A cold morning mist clings to the ground.",
        "The shadows retreat as the sun begins its climb."
    ],
    STORM: [
        "Thunder rattles your teeth.",
        "The wind screams like a banshee.",
        "Lightning illuminates the landscape in a stark flash.",
        "The rain is torrential. It's hard to see.",
        "The smell of ozone is thick in the air."
    ],
    FOREST: [
        "The trees seem to lean in as you pass.",
        "You spot scratch marks on a trunk. Too big for a bear.",
        "The smell of pine and rotting leaves is thick.",
        "Was that a face in the bark? No, just a knot.",
        "A sudden rustle in the bushes makes you freeze.",
        "Sunlight filters through the canopy in dusty shafts.",
        "You step on a dry branch. It sounds as loud as a thunderclap."
    ],
    DESERT: [
        "The heat rising from the sand distorts the air.",
        "Your throat feels dry just looking at the dunes.",
        "The wind shifts the sand, erasing your footprints.",
        "Bleached bones poke out from a dune.",
        "You spot a shimmering mirage on the horizon.",
        "The silence of the desert is absolute.",
        "A scuttling sound comes from beneath the sand."
    ],
    MOUNTAIN: [
        "The air is thin and sharp here.",
        "Loose gravel clatters down the cliffside.",
        "You feel vertiginous looking down.",
        "The wind howls through the crags.",
        "You find a massive, three-toed footprint in the snow.",
        "Clouds obscure the peaks above you.",
        "A distant rumble warns of falling rock."
    ],
    SWAMP: [
        "Bubbles rise from the muck with a foul smell.",
        "Insects swarm around your head.",
        "The ground feels spongy and unstable.",
        "You see ripples in the water. Something is moving.",
        "A strange, glowing light bobs over the water nearby.",
        "The trees here are draped in grey, weeping moss.",
        "You pull your boot out of the mud with a loud squelch."
    ]
};
