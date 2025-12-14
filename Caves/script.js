// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCkQ7H6KzvnLFTYOblS1l12RR2tv7Os6iY",
    authDomain: "caves-and-castles.firebaseapp.com",
    projectId: "caves-and-castles",
    storageBucket: "caves-and-castles.firebasestorage.app",
    messagingSenderId: "555632047629",
    appId: "1:555632047629:web:32ae69c34b7dbc13578744",
    measurementId: "G-E2QZTWE6N6"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();

// Globals
let player_id;
let playerRef;
let onlinePlayerRef;
let otherPlayers = {};
let unsubscribePlayerListener;
let worldStateListeners = {};

let activeShopInventory = [];

const TILE_DATA = {
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
    'S': {
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
            "A statue of a woman holding a lantern. You feel safer standing near it."
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
};

const CASTLE_LAYOUTS = {
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
        spawn: {
            x: 10,
            y: 18
        }, // New spawn point for this map
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
            '▓.........▓........▓',
            '▓.........▓.........▓',
            '▓.........▓...L.....▓',
            '▓.........▓.........▓',
            '▓...▓▓▓...▓▓▓.......▓',
            '▓...▓.O.▓.......▓.....▓', 
            '▓...▓.📄.▓.......▓.....▓', 
            '▓...▓▓▓...▓.......▓.....▓',
            '▓.............▓.....▓',
            '▓.............X.....▓',
            '▓▓▓▓▓▓▓▓▓▓▓T▓▓▓▓▓▓▓▓▓'  // <-- Added a Skill Trainer in the wall!
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
        spawn: { x: 14, y: 14 }, 
        map: [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓............................▓',
            '▓.🔥.........................▓',
            '▓............................▓',
            '▓....▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓.▓',
            '▓....▓...H.▓...▓...§.▓...▓...T.▓.▓',
            '▓....▓.....▓...▓.....▓...▓.....▓.▓',
            '▓....▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓▓.▓',
            '▓............................▓',
            '▓............................▓',
            '▓....▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓.▓',
            '▓....▓...W.▓...▓.....▓...▓.....▓.▓',
            '▓....▓.....▓...▓..B..▓...▓.....▓.▓',
            '▓....▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓▓.▓',
            '▓.............X..............▓', // Use 'X' as the exit
            '▓............................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        ]
    }

};

const SELL_MODIFIER = 0.5; // Players sell items for 50% of their base price

const SHOP_INVENTORY = [{
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

const CASTLE_SHOP_INVENTORY = [{
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
        type: 'collect',     // <-- New quest type
        itemNeeded: 'Goblin Totem', // <-- The item name from ITEM_DATA
        needed: 10,          // <-- The quantity required
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

/**
 * Scales an enemy based on distance from the center of the world.
 * Adds prefixes (Weak, Feral, Ancient) and buffs stats.
 */

function getScaledEnemy(enemyTemplate, x, y) {
    // 1. Calculate Distance & Zone
    const dist = Math.sqrt(x * x + y * y);
    const zoneLevel = Math.floor(dist / 150);

    // 2. Clone the template
    let enemy = { ...enemyTemplate };

    // 3. Apply Base Scaling (10% stats per zone level)
    const multiplier = 1 + (zoneLevel * 0.10);
    
    enemy.maxHealth = Math.floor(enemy.maxHealth * multiplier);
    enemy.attack = Math.floor(enemy.attack * multiplier);
    enemy.xp = Math.floor(enemy.xp * multiplier);

    // 4. Apply Zone Name (Cosmetic)
    if (zoneLevel === 0) {
        // No prefix for zone 0, keep it simple
    } else if (zoneLevel >= 2 && zoneLevel < 5) {
        enemy.name = `Feral ${enemy.name}`;
    } else if (zoneLevel >= 5 && zoneLevel < 10) {
        enemy.name = `Elder ${enemy.name}`;
    } else if (zoneLevel >= 10) {
        enemy.name = `Ancient ${enemy.name}`;
    }

    // --- 5. NEW: Elite Affix Roll (THIS WAS MISSING) ---
    // Chance increases with distance and player luck
    // Base 5% chance, +1% per zone level
    const eliteChance = 0.05 + (zoneLevel * 0.01); 
    
    // Don't apply prefixes to Bosses (they are hard enough)
    if (!enemy.isBoss && Math.random() < eliteChance) {
        const prefixKeys = Object.keys(ENEMY_PREFIXES);
        const prefixKey = prefixKeys[Math.floor(Math.random() * prefixKeys.length)];
        const affix = ENEMY_PREFIXES[prefixKey];

        // Apply Name Change
        enemy.name = `${prefixKey} ${enemy.name}`;
        enemy.isElite = true; // Flag for renderer and loot logic
        enemy.color = affix.color; // For the renderer

        // Apply Stat Modifiers
        if (affix.statModifiers) {
            if (affix.statModifiers.attack) enemy.attack += affix.statModifiers.attack;
            if (affix.statModifiers.defense) enemy.defense = (enemy.defense || 0) + affix.statModifiers.defense;
            if (affix.statModifiers.maxHealth) enemy.maxHealth += affix.statModifiers.maxHealth;
        }

        // Apply Special Effects
        if (affix.special === 'poison') {
            enemy.inflicts = 'poison';
            enemy.inflictChance = 0.5;
        } else if (affix.special === 'frostbite') {
            enemy.inflicts = 'frostbite';
            enemy.inflictChance = 0.5;
        }

        // Boost XP
        enemy.xp = Math.floor(enemy.xp * affix.xpMult);
    }

    // Reset current health to new max
    enemy.health = enemy.maxHealth;

    return enemy;
}

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
        maxHealth: 30, attack: 5, defense: 2, xp: 50,
        loot: '❄️f', // Use Yeti Fur tile as generic fur
        flavor: "A massive wall of muscle and fur."
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
};

const CAVE_THEMES = {
    ROCK: {
        name: 'A Dark Cave',
        wall: '▓',
        floor: '.',
        secretWall: '▒',
        colors: {
            wall: '#422006',
            floor: '#a16207'
        },
        decorations: ['+', 'o', '$', '📖', 'K', '🏚'],
        enemies: ['g', 's', '@']
    },
    ICE: {
        name: 'A Glacial Cavern',
        wall: '▒', // A lighter, "icy" wall
        secretWall: '▓',
        floor: ':', // A "slick" floor
        colors: {
            wall: '#99f6e4',
            floor: '#e0f2fe'
        },
        enemies: ['s', 'w', 'Z', 'Y']
    },
    FIRE: {
        name: 'A Volcanic Fissure',
        wall: '▓',
        secretWall: '▒',
        floor: '.', // REVERT to '.' (Safe ground)
        colors: {
            wall: '#450a0a',
            floor: '#ef4444' // The '.' will still be painted Red
        }, 
        decorations: ['+', '$', '🔥', 'J'],
        enemies: ['b', 'C', 'o', 'm', '👺', 'f']
    },

    CRYPT: {
        name: 'A Musty Crypt',
        wall: '▓', // Standard wall
        floor: '.', // Standard floor
        secretWall: '▒',
        colors: {
            wall: '#374151', // Dark stone color
            floor: '#4b5563'  // Lighter, cold stone floor
        },
        decorations: ['+', '$', '(', '†', '🌀', '😱', '💀', '🕸'],
        enemies: ['s', 'Z', 'a']
    },

    CRYSTAL: {
        name: 'A Crystalline Tunnel',
        wall: '▒', // Use the 'ice' wall, but colors will make it different
        secretWall: '▓',
        floor: '.',
        colors: {
            wall: '#67e8f9', // Bright Cyan
            floor: '#22d3ee' // Darker Cyan
        },
        decorations: ['Y', 'o', '$', 'K'],
        enemies: ['g']
    },
    VOID: {
        name: 'The Void Sanctum',
        wall: '▓',         // Solid Wall
        floor: '.',        // Floor
        phaseWall: '▒',    // <--- Special "Fake" Wall
        colors: {
            wall: '#2e0249', // Deep Purple
            floor: '#0f0518' // Almost Black
        },
        decorations: ['✨', '💀', 'Ω'],
        enemies: ['v', 'a', 'm', 'v', 'D']
    },
    ABYSS: {
        name: 'The Maw',
        wall: '▓',
        floor: '.',
        secretWall: '▒',
        colors: {
            wall: '#0f0f0f', // Almost black
            floor: '#331133' // Dark purple
        },
        decorations: ['💀', '🕸️', '🔥', 'Ω', '💎', '🕸'], // Omegas and Gems!
        enemies: ['o', 'm', 'Z', '👺', '🐺', 'scorpion', 'a'] // Only tough enemies
    },
    SUNKEN: {
        name: 'The Sunken Temple',
        wall: '🧱', 
        floor: '.', // REVERT to '.' (Wet Stone)
        secretWall: '▒',
        colors: {
            wall: '#0e7490', // Cyan-Blue bricks
            floor: '#1e3a8a'  // Deep Blue floor (looks like wet stone)
        },
        decorations: ['🐟', '🌿', '🗿', '🦀'], 
        enemies: ['🐸', '🐍', 'l', '🦑'] 
    },
    GROTTO: {
        name: 'A Sunken Grotto',
        wall: '▓', // Use standard 'rock' wall
        floor: ':', // Use 'ice' floor, but colors make it look slick/wet
        secretWall: '▒',
        colors: {
            wall: '#14532d', // Dark Green
            floor: '#16a34a' // Bright Green
        },
        decorations: ['+', 'S', 'o', '☣️', '🕸'],
        enemies: ['g', 'w', '@']
    }
};

const CAVE_ROOM_TEMPLATES = {
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

let TILE_SIZE = 20; // Fixed tile size (prevent them from getting huge)
let VIEWPORT_WIDTH = 40; // Will update on resize
let VIEWPORT_HEIGHT = 25; // Will update on resize

const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 500;
const WORLD_SEED = 'caves-and-castles-v1';
const HEALING_AMOUNT = 3;
const DAMAGE_AMOUNT = 2;
const MANA_RESTORE_AMOUNT = 3;
const STAMINA_RESTORE_AMOUNT = 4;
const PSYCHE_RESTORE_AMOUNT = 2;
const STAT_INCREASE_AMOUNT = 1;
const TURN_DURATION_MINUTES = 10;
const REGION_SIZE = 160;

const MAX_INVENTORY_SLOTS = 9; // Max number of inventory stacks


const TRADER_INVENTORY = [
    { name: 'Elixir of Life', price: 500, stock: 1 },
    { name: 'Elixir of Power', price: 500, stock: 1 },
    { name: 'Obsidian Shard', price: 200, stock: 3 },
    { name: 'Scroll: Entangle', price: 300, stock: 1 },
    { name: 'Scroll of Homing', price: 150, stock: 2 },
    { name: 'Tattered Map', price: 100, stock: 3 }
];

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

const DAYS_OF_WEEK = ["Sunsday", "Moonsday", "Kingsday", "Earthday", "Watersday", "Windsday", "Firesday"];
const MONTHS_OF_YEAR = ["First Seed", "Rains Hand", "Second Seed", "Suns Height", "Last Seed", "Hearthfire", "Frostfall", "Suns Dusk", "Evening Star", "Morning Star", "Suns Dawn", "Deep Winter"];
const DAYS_IN_MONTH = 30;

const NAME_PREFIXES = ["Whispering", "Sunken", "Forgotten", "Broken", "Shrouded", "Glimmering", "Verdant", "Ashen"];
const NAME_MIDDLES = ["Plains", "Forest", "Hills", "Expanse", "Valley", "Marsh", "Reach", "Woods"];
const NAME_SUFFIXES = ["of Sorrow", "of the Ancients", "of Ash", "of the King", "of Renewal", "of Despair"];

const CAVE_PREFIXES = ["Whispering", "Sunken", "Forgotten", "Broken", "Shrouded", "Glimmering", "Verdant", "Ashen", "Crystal", "Shadow", "Frozen", "Burning"];
const CAVE_SUFFIXES = ["Caverns", "Grotto", "Deep", "Lair", "Tunnels", "Delve", "Hollow", "Fissure", "Pits", "Maze"];

const CASTLE_PREFIXES = ["Broken", "Fallen", "King's", "Shadow", "Gleaming", "Iron", "Stone", "Forgotten", "Ancient", "Last", "Crimson"];
const CASTLE_SUFFIXES = ["Spire", "Keep", "Fortress", "Hold", "Citadel", "Bastion", "Tower", "Ruin", "Reach", "Sanctum"];

// DOM Element Selectors

const characterSelectModal = document.getElementById('characterSelectModal');
const slotsContainer = document.getElementById('slotsContainer');
const logoutFromSelectButton = document.getElementById('logoutFromSelectButton');
let currentUser = null; // Store the firebase user object

const charCreationModal = document.getElementById('charCreationModal');
const timeDisplay = document.getElementById('timeDisplay');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const darkModeToggle = document.getElementById('darkModeToggle');
const messageLog = document.getElementById('messageLog');
const inventoryList = document.getElementById('inventoryList');
const authContainer = document.getElementById('authContainer');
const gameContainer = document.getElementById('gameContainer');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const authError = document.getElementById('authError');
const logoutButton = document.getElementById('logoutButton');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeHelpButton = document.getElementById('closeHelpButton');
const regionDisplay = document.getElementById('regionDisplay');
const loreModal = document.getElementById('loreModal');
const closeLoreButton = document.getElementById('closeLoreButton');
const loreTitle = document.getElementById('loreTitle');
const loreContent = document.getElementById('loreContent');
const gameOverModal = document.getElementById('gameOverModal');
const restartButton = document.getElementById('restartButton');

const shopModal = document.getElementById('shopModal');
const closeShopButton = document.getElementById('closeShopButton');
const shopPlayerCoins = document.getElementById('shopPlayerCoins');
const shopBuyList = document.getElementById('shopBuyList');
const shopSellList = document.getElementById('shopSellList');

const spellModal = document.getElementById('spellModal');
const closeSpellButton = document.getElementById('closeSpellButton');
const spellList = document.getElementById('spellList');

const inventoryModal = document.getElementById('inventoryModal');
const closeInventoryButton = document.getElementById('closeInventoryButton');
const inventoryModalList = document.getElementById('inventoryModalList');

const skillModal = document.getElementById('skillModal');
const closeSkillButton = document.getElementById('closeSkillButton');
const skillList = document.getElementById('skillList');

const questModal = document.getElementById('questModal');
const closeQuestButton = document.getElementById('closeQuestButton');
const questList = document.getElementById('questList');

const craftingModal = document.getElementById('craftingModal');
const closeCraftingButton = document.getElementById('closeCraftingButton');
const craftingRecipeList = document.getElementById('craftingRecipeList');

const skillTrainerModal = document.getElementById('skillTrainerModal');
const closeSkillTrainerButton = document.getElementById('closeSkillTrainerButton');
const skillTrainerList = document.getElementById('skillTrainerList');
const skillTrainerStatPoints = document.getElementById('skillTrainerStatPoints');

const equippedWeaponDisplay = document.getElementById('equippedWeaponDisplay');

const equippedArmorDisplay = document.getElementById('equippedArmorDisplay');

const coreStatsPanel = document.getElementById('coreStatsPanel');
const statusEffectsPanel = document.getElementById('statusEffectsPanel');

const DAY_CYCLE_STOPS = [{
        time: 0,
        color: [10, 10, 40],
        opacity: 0.10
    },
    {
        time: 350,
        color: [20, 20, 80],
        opacity: 0.12
    },
    {
        time: 390,
        color: [255, 150, 80],
        opacity: 0.08
    },
    {
        time: 430,
        color: [240, 255, 255],
        opacity: 0.0
    },
    {
        time: 1070,
        color: [240, 255, 255],
        opacity: 0.0
    },
    {
        time: 1110,
        color: [255, 150, 80],
        opacity: 0.08
    },
    {
        time: 1150,
        color: [20, 20, 80],
        opacity: 0.12
    },
    {
        time: 1440,
        color: [10, 10, 40],
        opacity: 0.10
    }
];

// Make it globally accessible for the HTML onclick
window.selectBackground = async function(bgKey) {
    const background = PLAYER_BACKGROUNDS[bgKey];
    if (!background) return;

    const player = gameState.player;

    // 1. Apply Stats
    for (const stat in background.stats) {
        player[stat] += background.stats[stat];
    }
    // Heal to new max if Con increased
    if (background.stats.constitution) {
        player.maxHealth += (background.stats.constitution * 5);
        player.health = player.maxHealth;
    }
    // Restore mana if Wits increased
    if (background.stats.wits) {
        player.maxMana += (background.stats.wits * 5);
        player.mana = player.maxMana;
    }

    // 2. Apply Inventory
    // We replace the default "Fists/Simple Tunic" start with the class kit
    // Note: We keep the default inventory if the class items list doesn't override it completely
    background.items.forEach(newItem => {
        player.inventory.push(newItem);
    });

    // 3. Auto-Equip starting gear
    const weapon = player.inventory.find(i => i.type === 'weapon');
    const armor = player.inventory.find(i => i.type === 'armor');

    if (weapon) {
        player.equipment.weapon = weapon;
        weapon.isEquipped = true;
    }
    if (armor) {
        player.equipment.armor = armor;
        armor.isEquipped = true;
    }

    // 4. Save to Database
    // We save the whole player state + the new "background" tag
    await playerRef.set({
        ...player,
        background: bgKey
    }, { merge: true });

    // 5. Start the Game UI
    charCreationModal.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    canvas.style.visibility = 'visible';

    gameState.mapMode = 'overworld';
    
    logMessage(`You have chosen the path of the ${background.name}.`);
    
    // Re-run init logic to ensure UI catches up
    renderStats();
    renderEquipment();
    renderInventory();
    renderTime();

    resizeCanvas();

    render();
    
    // Resume the connection listener that was paused/waiting
    // (We don't need to explicitly resume, the firebase listener below is already running,
    //  it just updates the state which we just modified)
};



async function initCharacterSelect(user) {
    currentUser = user;
    authContainer.classList.add('hidden');
    characterSelectModal.classList.remove('hidden');
    loadingIndicator.classList.remove('hidden'); // Show loading while checking slots

    // 1. Legacy Migration Check
    // If the user has data in the old root path 'players/{uid}', move it to 'players/{uid}/characters/slot1'
    const oldRootRef = db.collection('players').doc(user.uid);
    const oldDoc = await oldRootRef.get();

    if (oldDoc.exists && oldDoc.data().level) {
        console.log("Migrating legacy save to Slot 1...");
        const legacyData = oldDoc.data();
        // Copy to Slot 1
        await oldRootRef.collection('characters').doc('slot1').set(legacyData);
        // Delete old data to prevent re-migration (and clean up)
        await oldRootRef.delete(); 
    }

    renderSlots();
}

async function renderSlots() {
    slotsContainer.innerHTML = '';
    const charsRef = db.collection('players').doc(currentUser.uid).collection('characters');
    
    // Define our 3 slots
    const slotIds = ['slot1', 'slot2', 'slot3'];

    for (const slotId of slotIds) {
        const doc = await charsRef.doc(slotId).get();
        const slotDiv = document.createElement('div');
        slotDiv.className = "panel p-4 rounded-xl border-2 flex flex-col items-center justify-between min-h-[200px] transition-all";
        
        if (doc.exists) {
            const data = doc.data();
            const bg = PLAYER_BACKGROUNDS[data.background] || { name: 'Unknown' };
            
            // --- OCCUPIED SLOT UI ---
            slotDiv.classList.add('hover:border-blue-500');
            slotDiv.innerHTML = `
                <div class="text-center w-full">
                    <h3 class="text-xl font-bold mb-1">Slot ${slotId.replace('slot', '')}</h3>
                    <div class="text-4xl mb-2">${data.isBoating ? 'c' : (data.character || '@')}</div>
                    <p class="font-bold highlight-text">${bg.name}</p>
                    <p class="text-sm muted-text">Level ${data.level || 1}</p>
                    <p class="text-xs muted-text mt-2">${getRegionName(Math.floor((data.x||0)/160), Math.floor((data.y||0)/160))}</p>
                </div>
                <div class="flex gap-2 w-full mt-4">
                    <button onclick="selectSlot('${slotId}')" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Play</button>
                    <button onclick="deleteSlot('${slotId}')" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">🗑️</button>
                </div>
            `;
        } else {
            // --- EMPTY SLOT UI ---
            slotDiv.classList.add('opacity-75', 'hover:opacity-100', 'hover:border-green-500', 'cursor-pointer');
            
            slotDiv.onclick = (e) => {
                // If they click the box background or the big +, select the slot
                if(e.target === slotDiv || e.target.closest('.empty-slot-content')) selectSlot(slotId);
            };

            slotDiv.innerHTML = `
                <div class="text-center w-full empty-slot-content">
                    <h3 class="text-xl font-bold mb-4">Slot ${slotId.replace('slot', '')}</h3>
                    <div class="text-4xl mb-4 text-gray-600">+</div>
                    <p class="muted-text">Empty</p>
                </div>
                <button onclick="event.stopPropagation(); selectSlot('${slotId}')" class="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Create New</button>
            `;
        }
        slotsContainer.appendChild(slotDiv);
    }
    loadingIndicator.classList.add('hidden');
}

// Make these global so HTML buttons can call them
window.selectSlot = async function(slotId) {
    loadingIndicator.classList.remove('hidden');
    
    // 1. Set the global playerRef to the specific character slot
    player_id = currentUser.uid; // Keep Auth ID for ownership
    // CRITICAL: This directs all game saves/loads to the specific slot
    playerRef = db.collection('players').doc(player_id).collection('characters').doc(slotId);
    
    // 2. Check if data exists
    const doc = await playerRef.get();
    
    characterSelectModal.classList.add('hidden');
    
    if (doc.exists) {
        // Load existing game
        enterGame(doc.data());
    } else {
        // Start creation wizard
        gameContainer.classList.remove('hidden'); // Needs to be visible for rendering logic
        canvas.style.visibility = 'hidden'; // Hide canvas until ready
        
        const defaultState = createDefaultPlayerState();
        // We DON'T save yet. We wait for background selection.
        Object.assign(gameState.player, defaultState);
        
        loadingIndicator.classList.add('hidden');
        charCreationModal.classList.remove('hidden');
    }
};

window.deleteSlot = async function(slotId) {
    if(confirm("Are you sure you want to delete this character? This cannot be undone.")) {
        await db.collection('players').doc(currentUser.uid).collection('characters').doc(slotId).delete();
        renderSlots();
    }
};

logoutFromSelectButton.addEventListener('click', () => {
    auth.signOut();
    characterSelectModal.classList.add('hidden');
    authContainer.classList.remove('hidden');
});

function handleAuthError(error) {
    let friendlyMessage = '';
    switch (error.code) {
        case 'auth/invalid-email':
            friendlyMessage = 'Please enter a valid email address.';
            break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            friendlyMessage = 'Invalid credentials. Please check your email and password.';
            break;
        case 'auth/email-already-in-use':
            friendlyMessage = 'This email address is already in use.';
            break;
        case 'auth/weak-password':
            friendlyMessage = 'Password must be at least 6 characters long.';
            break;
        default:
            friendlyMessage = 'An unexpected error occurred. Please try again.';
            break;
    }
    authError.textContent = friendlyMessage;
    console.error("Authentication Error:", error); // Keep the detailed log for yourself
}

function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash;
}

function createDefaultPlayerState() {
    return {
        x: 0,
        y: 0,
        character: '@',
        color: '#3b82f6',
        coins: 0,
        health: 10,
        maxHealth: 10,
        mana: 10,
        maxMana: 10,
        stamina: 10,
        maxStamina: 10,
        psyche: 10,
        maxPsyche: 10,

        // --- LIGHT SURVIVAL STATS ---
        hunger: 50, // Start at half (Neutral)
        maxHunger: 100,
        thirst: 50,
        maxThirst: 100,

        unlockedWaypoints: [], // Stores objects: { x, y, name }

        strength: 1,
        wits: 1,
        luck: 1,
        constitution: 1,
        dexterity: 1,
        charisma: 1,
        willpower: 1,
        perception: 1,
        endurance: 1,
        intuition: 1,

        equipment: {
            weapon: {
                name: 'Fists',
                damage: 0
            },
            armor: {
                name: 'Simple Tunic',
                defense: 0
            }
        },

        inventory: [
            { name: 'Hardtack', type: 'consumable', quantity: 2, tile: '🍞' },
            { name: 'Flask of Water', type: 'consumable', quantity: 2, tile: '💧' }
        ],

        bank: [], // Persistent storage

        talents: [], // Array of strings (e.g. ['bloodlust', 'scholar'])
        talentPoints: 0,

        killCounts: {}, // Tracks { "Goblin": 5, "Wolf": 12 }

        spellbook: {
            "lesserHeal": 1, // Key is the spellID, value is the spell's level
            "magicBolt": 1
        },

        skillbook: {
            "brace": 1, // Key is the skillID, value is the skill's level
            "lunge": 1
        },

        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        statPoints: 0,
        foundLore: [], // Used to track lore/journals for XP

        defenseBonus: 0,
        defenseBonusTurns: 0,

        shieldValue: 0,
        shieldTurns: 0,

        strengthBonus: 0,
        strengthBonusTurns: 0,

        witsBonus: 0,
        witsBonusTurns: 0,

        frostbiteTurns: 0,
        poisonTurns: 0,
        rootTurns: 0,

        candlelightTurns: 0,

        isBoating: false,

        activeTreasure: null,

        exploredChunks: [],

        quests: {},

        hotbar: [null, null, null, null, null], // 5 slots
        cooldowns: {}, // Tracks turns remaining: { 'lunge': 2 }
        stealthTurns: 0, // For the new Stealth skill

        companion: null, // Will store { name: "Wolf", tile: "w", type: "beast", hp: 10, maxHp: 10, atk: 2 }

        craftingLevel: 1,
        craftingXp: 0,
        craftingXpToNext: 50,
    };
}

async function restartGame() {
    // 1. Capture the current background so we don't lose the class choice
    const currentBg = gameState.player.background;

    // 2. Clear Session State FIRST (This resets mapMode to null)
    clearSessionState(); 

    // 3. Get fresh state
    const defaultState = createDefaultPlayerState();
    
    // 4. Re-apply background tag and stats (so you stay a Warrior/Mage/etc)
    if (currentBg && PLAYER_BACKGROUNDS[currentBg]) {
        defaultState.background = currentBg;
        
        const bgStats = PLAYER_BACKGROUNDS[currentBg].stats;
        for(let stat in bgStats) {
            defaultState[stat] += bgStats[stat];
        }
        // Recalculate derived stats based on background bonuses
        if (bgStats.constitution) defaultState.maxHealth += (bgStats.constitution * 5);
        if (bgStats.wits) defaultState.maxMana += (bgStats.wits * 5);
        
        // Heal to new max
        defaultState.health = defaultState.maxHealth;
        defaultState.mana = defaultState.maxMana;
        
        // Note: You get the default items (Bread/Water), not the starting class kit again.
        // If you want the class kit, you'd need to re-merge the 'items' array from PLAYER_BACKGROUNDS here.
    }

    // 5. Apply to Game State
    Object.assign(gameState.player, defaultState);

    // 6. Set Map Mode (MUST be done AFTER clearSessionState)
    gameState.mapMode = 'overworld'; 
    gameState.currentCastleId = null;
    gameState.currentCaveId = null;

    // 7. Save to DB
    await playerRef.set(defaultState);

    // 8. UI Updates
    logMessage("Your adventure begins anew...");
    renderStats();
    renderInventory();
    updateRegionDisplay();
    
    // Force a re-render/resize to ensure canvas is active
    resizeCanvas(); 
    render();

    // 9. Hide the modal
    gameOverModal.classList.add('hidden');
}

function registerKill(enemy) {
    // 1. Update Kill Count
    // Use the base name (remove "Feral", "Savage" prefixes) for clean tracking
    let baseName = enemy.name;
    // Simple logic: if name has 2+ words, check if the last word is the base
    // Or simpler: map Tile to Name using ENEMY_DATA
    if (ENEMY_DATA[enemy.tile]) {
        baseName = ENEMY_DATA[enemy.tile].name;
    }

    if (!gameState.player.killCounts) gameState.player.killCounts = {};
    
    gameState.player.killCounts[baseName] = (gameState.player.killCounts[baseName] || 0) + 1;

    // --- TALENT: BLOODLUST (Warrior) ---
    if (gameState.player.talents && gameState.player.talents.includes('bloodlust')) {
        const heal = 2;
        if (gameState.player.health < gameState.player.maxHealth) {
            gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + heal);
            logMessage("Bloodlust heals you for 2 HP!");
            triggerStatFlash(statDisplays.health, true);
        }
    }

    // --- TALENT: SOUL SIPHON (Necromancer) ---
    if (gameState.player.talents && gameState.player.talents.includes('soul_siphon')) {
        const restore = 2;
        if (gameState.player.mana < gameState.player.maxMana) {
            gameState.player.mana = Math.min(gameState.player.maxMana, gameState.player.mana + restore);
            logMessage("You siphon 2 Mana from the soul.");
            triggerStatFlash(statDisplays.mana, true);
        }
    }

    // 2. Handle Quests
    updateQuestProgress(enemy.tile);

    // 3. Grant XP
    grantXp(enemy.xp);
    
    // 4. Save
    playerRef.update({ 
        killCounts: gameState.player.killCounts,
        quests: gameState.player.quests
    });
}

const fastTravelModal = document.getElementById('fastTravelModal');
const fastTravelList = document.getElementById('fastTravelList');
const closeFastTravelButton = document.getElementById('closeFastTravelButton');

function openFastTravelModal() {
    renderFastTravelList();
    fastTravelModal.classList.remove('hidden');
    // Hide the lore modal if it was open (since we opened this from there)
    loreModal.classList.add('hidden');
}

function renderFastTravelList() {
    fastTravelList.innerHTML = '';
    const waypoints = gameState.player.unlockedWaypoints || [];
    
    if (waypoints.length <= 1) {
        fastTravelList.innerHTML = '<li class="italic text-gray-500 p-2">You haven\'t attuned to any other Waystones yet. Explore the world to find them!</li>';
        return;
    }

    waypoints.forEach(wp => {
        // Don't show the one we are standing on
        if (wp.x === gameState.player.x && wp.y === gameState.player.y) return;

        const li = document.createElement('li');
        li.className = 'shop-item'; // Reuse shop styling for nice boxes
        li.innerHTML = `
            <div>
                <span class="font-bold text-indigo-400">${wp.name}</span>
                <div class="text-xs text-gray-400">Coords: ${wp.x}, ${-wp.y}</div>
            </div>
            <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold" onclick="handleFastTravel(${wp.x}, ${wp.y})">Travel</button>
        `;
        fastTravelList.appendChild(li);
    });
}

window.handleFastTravel = function(targetX, targetY) {
    const player = gameState.player;
    const TRAVEL_COST = 10;

    if (player.mana < TRAVEL_COST) {
        logMessage("Not enough Mana to travel the leylines.");
        return;
    }

    player.mana -= TRAVEL_COST;
    player.x = targetX;
    player.y = targetY;

    logMessage("You dissolve into pure energy and reappear at the Waystone.");
    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
    
    // Teleport logic
    chunkManager.setWorldTile(player.x, player.y, '#'); // Ensure landing spot exists visually
    updateRegionDisplay();
    render();
    syncPlayerState();
    
    // Unload far chunks
    const currentChunkX = Math.floor(player.x / chunkManager.CHUNK_SIZE);
    const currentChunkY = Math.floor(player.y / chunkManager.CHUNK_SIZE);
    chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);

    fastTravelModal.classList.add('hidden');
    playerRef.update({ mana: player.mana, x: player.x, y: player.y });
};

closeFastTravelButton.addEventListener('click', () => fastTravelModal.classList.add('hidden'));

function getInterpolatedDayCycleColor(hour, minute) {
    const currentTimeInMinutes = hour * 60 + minute;
    let prevStop = DAY_CYCLE_STOPS[0];
    let nextStop = DAY_CYCLE_STOPS[DAY_CYCLE_STOPS.length - 1];
    for (let i = 0; i < DAY_CYCLE_STOPS.length; i++) {
        if (DAY_CYCLE_STOPS[i].time >= currentTimeInMinutes) {
            nextStop = DAY_CYCLE_STOPS[i];
            prevStop = DAY_CYCLE_STOPS[i - 1] || DAY_CYCLE_STOPS[0];
            break;
        }
    }
    const timeRange = nextStop.time - prevStop.time;
    const timeProgress = (timeRange === 0) ? 1 : (currentTimeInMinutes - prevStop.time) / timeRange;
    const lerp = (a, b, t) => a * (1 - t) + b * t;
    const r = Math.round(lerp(prevStop.color[0], nextStop.color[0], timeProgress));
    const g = Math.round(lerp(prevStop.color[1], nextStop.color[1], timeProgress));
    const b = Math.round(lerp(prevStop.color[2], nextStop.color[2], timeProgress));
    const opacity = lerp(prevStop.opacity, nextStop.opacity, timeProgress);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

function triggerStatFlash(statElement, positive = true) {
    const animationClass = positive ? 'stat-flash-green' : 'stat-flash-red';
    statElement.classList.add(animationClass);
    // Remove the class after the animation finishes to allow it to be re-triggered
    setTimeout(() => {
        statElement.classList.remove(animationClass);
    }, 500);
}

function triggerStatAnimation(statElement, animationClass) {
    statElement.classList.add(animationClass);
    // Remove the class after the animation finishes
    setTimeout(() => {
        statElement.classList.remove(animationClass);
    }, 600); // 600ms matches the CSS animation time
}

const renderTime = () => {
    const time = gameState.time;
    const dayOfWeek = DAYS_OF_WEEK[(time.day - 1) % DAYS_OF_WEEK.length];
    const month = MONTHS_OF_YEAR[Math.floor((time.day - 1) / DAYS_IN_MONTH) % MONTHS_OF_YEAR.length];
    const dayOfMonth = ((time.day - 1) % DAYS_IN_MONTH) + 1;
    const daySuffix = getOrdinalSuffix(dayOfMonth);
    const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
    const ampm = time.hour < 12 ? 'AM' : 'PM';
    const minutePadded = String(time.minute).padStart(2, '0');
    timeDisplay.textContent = `${dayOfWeek}, the ${dayOfMonth}${daySuffix} of ${month}, Year ${time.year} ${time.era} | ${hour12}:${minutePadded} ${ampm}`;
};

function Alea(seed) {
    let s0 = 0,
        s1 = 0,
        s2 = 0,
        c = 1;
    if (seed == null) {
        seed = +new Date;
    }
    s0 = (seed >>> 0) * 0x9e3779b9;
    s1 = (seed >>> 0) * 0x9e3779b9;
    s2 = (seed >>> 0) * 0x9e3779b9;
    for (let i = 0; i < 4; i++) {
        s0 = Math.sin(s0) * 1e9;
        s1 = Math.sin(s1) * 1e9;
        s2 = Math.sin(s2) * 1e9;
    }
    return function() {
        const t = (s0 * 0x9e3779b9 + c * 0x2b759141) | 0;
        c = t < 0 ? 1 : 0;
        s0 = s1;
        s1 = s2;
        s2 = t;
        return (s2 >>> 0) / 0x100000000;
    };
}

const Perlin = {
    p: [],
    init: function(seed) {
        const random = Alea(stringToSeed(seed));
        this.p = new Array(512);
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const n = Math.floor((i + 1) * random());
            const t = p[i];
            p[i] = p[n];
            p[n] = t;
        }
        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = p[i];
        }
    },
    noise: function(x, y, z = 0) {
        const floor = Math.floor;
        const X = floor(x) & 255,
            Y = floor(y) & 255,
            Z = floor(z) & 255;
        x -= floor(x);
        y -= floor(y);
        z -= floor(z);
        const u = this.fade(x),
            v = this.fade(y),
            w = this.fade(z);
        const A = this.p[X] + Y,
            AA = this.p[A] + Z,
            AB = this.p[A + 1] + Z,
            B = this.p[X + 1] + Y,
            BA = this.p[B] + Z,
            BB = this.p[B + 1] + Z;
        return this.scale(this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)))));
    },
    fade: t => t * t * t * (t * (t * 6 - 15) + 10),
    lerp: (t, a, b) => a + t * (b - a),
    grad: (hash, x, y, z) => {
        const h = hash & 15;
        const u = h < 8 ? x : y,
            v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    },
    scale: n => (1 + n) / 2
};

function getCaveName(caveId) {
    const seed = `${WORLD_SEED}:${caveId}`;
    const random = Alea(stringToSeed(seed));
    const prefix = CAVE_PREFIXES[Math.floor(random() * CAVE_PREFIXES.length)];
    const suffix = CAVE_SUFFIXES[Math.floor(random() * CAVE_SUFFIXES.length)];
    return `The ${prefix} ${suffix}`;
}

function getCastleName(castleId) {
    const seed = `${WORLD_SEED}:${castleId}`;
    const random = Alea(stringToSeed(seed));
    const prefix = CASTLE_PREFIXES[Math.floor(random() * CASTLE_PREFIXES.length)];
    const suffix = CASTLE_SUFFIXES[Math.floor(random() * CASTLE_SUFFIXES.length)];
    return `The ${prefix} ${suffix}`;
}

function getRegionName(regionX, regionY) {
    const seed = `${WORLD_SEED}:${regionX},${regionY}`;
    const random = Alea(stringToSeed(seed));
    const prefix = NAME_PREFIXES[Math.floor(random() * NAME_PREFIXES.length)];
    const middle = NAME_MIDDLES[Math.floor(random() * NAME_MIDDLES.length)];
    if (random() > 0.5) {
        const suffix = NAME_SUFFIXES[Math.floor(random() * NAME_SUFFIXES.length)];
        return `The ${prefix} ${middle} ${suffix}`;
    }
    return `The ${prefix} ${middle}`;
}

const TERRAIN_COST = {
    '^': 3, // Mountains cost 3 stamina
    '≈': 2, // Swamps cost 2 stamina
    '~': Infinity, // Water is impassable
    'F': 1, // Forests cost 1 stamina
};

const COOKING_RECIPES = {
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

const CRAFTING_RECIPES = {
    // --- TIER 0 (Basic Survival) ---
    "Wooden Club": { 
        materials: { "Stick": 2 }, 
        xp: 5, level: 1 
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
    "Stick": { 
        materials: { "Bone Shard": 2 }, 
        xp: 5, level: 1 
    },
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

const ITEM_DATA = {
    // --- RESOURCES ---
    '🍞': {
        name: 'Hardtack',
        type: 'consumable',
        tile: '🍞',
        description: "Dry, hard bread. Keeps forever. (+30 Hunger)",
        effect: (state) => {
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30);
            logMessage("You gnaw on the rock-hard bread. (+30 Hunger)");
            triggerStatAnimation(document.getElementById('hungerDisplay'), 'stat-pulse-green');
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
        type: 'consumable', // It's "consumed" when placed
        tile: '🔥', // Looks like fire in inventory
        description: "Contains flint, tinder, and dry wood. Creates a cooking fire.",
        effect: (state) => {
            // Logic handled in useInventoryItem to place it on the map
            logMessage("Use this item to place a fire on the ground.");
        }
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
    '🧀': { name: 'Wheel of Cheese', type: 'consumable', description: "A pungent wheel of aged cheese. (+15 Hunger)", effect: (state) => { state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 15); logMessage("It tastes sharp and nutty."); } },
    '🥚': { name: 'Bird Egg', type: 'junk', description: "A speckled egg found in a nest." },
    '🌾': { name: 'Bag of Flour', type: 'junk', description: "Ground wheat. Essential for baking." },
    '🍯': { name: 'Jar of Honey', type: 'consumable', description: "Sweet and sticky. (+10 Hunger, +5 Stamina)", effect: (state) => { state.player.stamina += 5; state.player.hunger += 10; logMessage("Sweet energy!"); triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow'); } },
    '🥧': { name: 'Berry Pie', type: 'consumable', description: "A masterpiece of baking. (+50 Hunger, +10 Psyche)", effect: (state) => { state.player.hunger += 50; state.player.psyche += 10; logMessage("Warm, sweet, and comforting. You feel happier."); triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple'); } },
    '🥙': { name: 'Traveler\'s Wrap', type: 'consumable', description: "Portable and filling. (+40 Hunger, +5 Health)", effect: (state) => { state.player.hunger += 40; state.player.health += 5; logMessage("A solid meal on the go."); triggerStatAnimation(statDisplays.health, 'stat-pulse-green'); } },

    // --- TRADE GOODS ---
    '🐚': { name: 'Rainbow Shell', type: 'junk', description: "It shimmers with every color. Collectors love these." }, // High value
    '🕰️': { name: 'Golden Pocket Watch', type: 'junk', description: "It's stopped at 12:00. The casing is pure gold." },
    '🗿': { name: 'Jade Idol', type: 'junk', description: "A heavy statue of a forgotten frog god." },
    '📜m': { name: 'Merchant\'s Ledger', type: 'junk', description: "Detailed trade routes. Bandits would pay for this info." },
    '🧵': { name: 'Spool of Silk', type: 'junk', description: "Fine material from the eastern lands." },
    '💎b': { name: 'Black Pearl', type: 'junk', description: "Found only in the deepest abysses." },

    // --- SURVIVAL ITEMS ---
    '🫙': {
        name: 'Empty Bottle',
        type: 'consumable', 
        description: "Use on water (~/≈) to fill.",
        tile: '🫙'
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
            
            // Return Empty Bottle
            if (state.player.inventory.length < MAX_INVENTORY_SLOTS) {
                state.player.inventory.push({ name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });
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
            }
            logMessage(`Used a Healing Potion. (+HP, +10 Thirst)`);
        }
    },

    'o': {
        name: 'Mana Orb',
        type: 'consumable',
        effect: (state) => {
            const oldMana = state.player.mana;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + MANA_RESTORE_AMOUNT);
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue'); // USE NEW FUNCTION
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
        }
    },
        ':': {
        name: 'Wildberry',
        type: 'consumable',
        effect: (state) => {
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 1);
            state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 5);
            state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 5);
            logMessage('Sweet! (+5 Hunger/Thirst, +1 HP)');
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
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
        description: "A sturdy branch fallen from an oak tree. Better than nothing."
        
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
    '=': {
        name: 'Steel Sword',
        type: 'weapon',
        damage: 4, // Better than Rusty Sword (2)
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
        skillId: 'brace'    // <-- Links to SKILL_DATA
    },
    '📗': {
        name: 'Manual of Lunge',
        type: 'skillbook',
        skillId: 'lunge'    // <-- Links to SKILL_DATA
    },
    '💪': {
        name: 'Tome of Strength',
        type: 'tome', // <-- NEW TYPE
        stat: 'strength'
    },
    '🧠': {
        name: 'Tome of Wits',
        type: 'tome', // <-- NEW TYPE
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
        type: 'consumable', // It is consumed upon use
        tile: '🗝️',
        description: "It vibrates violently. Unlocks a Void Rift.",
        effect: (state) => {
            logMessage("Stand on a Void Rift (Ω) and use this to enter.");
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
        }
    },
    'x': {
        name: 'Tattered Rags',
        type: 'armor',
        defense: 0, // Provides no protection!
        slot: 'armor'
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
const LOOT_PREFIXES = {
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

const LOOT_SUFFIXES = {
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

const PLAYER_BACKGROUNDS = {
    'warrior': {
        name: 'Warrior',
        stats: { strength: 2, constitution: 1 },
        items: [
            { name: 'Rusty Sword', type: 'weapon', quantity: 1, tile: '!', damage: 2, slot: 'weapon' },
            { name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor' },
            { name: 'Conscript\'s Orders', type: 'journal', quantity: 1, tile: '1', title: 'Crumpled Orders', content: ITEM_DATA['1'].content } // <-- Added Journal
        ]
    },
    'rogue': {
        name: 'Rogue',
        stats: { dexterity: 2, luck: 1 },
        items: [
            { name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon' },
            { name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor' },
            { name: 'Thief\'s Map', type: 'journal', quantity: 1, tile: '2', title: 'Scribbled Map', content: ITEM_DATA['2'].content } // <-- Added Journal
        ]
    },
    'mage': {
        name: 'Mage',
        stats: { wits: 2, willpower: 1 },
        items: [
             { name: 'Spellbook: Magic Bolt', type: 'spellbook', quantity: 1, tile: '📚', spellId: 'magicBolt' },
             { name: 'Burned Scroll', type: 'journal', quantity: 1, tile: '3', title: 'Singed Parchment', content: ITEM_DATA['3'].content } // <-- Added Journal
             // Mages keep default tunic
        ]
    },
    'necromancer': {
        name: 'Necromancer',
        stats: { wits: 1, willpower: 2 }, // High Willpower for managing minions
        items: [
             { name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon' },
             { name: 'Tome: Raise Dead', type: 'spellbook', quantity: 1, tile: '💀', spellId: 'raiseDead' },
             { name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap', content: ITEM_DATA['4'].content }
        ]
    },
    // --- HARD MODE CLASS ---
    'wretch': {
        name: 'The Wretch',
        stats: {}, // No bonus stats! (Starts with 1s)
        items: [
            { name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor' },
            { name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap', content: ITEM_DATA['4'].content }
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
        // You need to handle the stun logic in 'executeMeleeSkill' similar to shieldBash
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
    // --- NEW SKILLS ---
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
    }
};

const talentModal = document.getElementById('talentModal');
const closeTalentButton = document.getElementById('closeTalentButton');
const talentListDiv = document.getElementById('talentList');
const talentPointsDisplay = document.getElementById('talentPointsDisplay');

function openTalentModal() {
    renderTalentTree();
    talentModal.classList.remove('hidden');
}

function renderTalentTree() {
    talentListDiv.innerHTML = '';
    const player = gameState.player;
    const playerTalents = player.talents || [];
    
    talentPointsDisplay.textContent = `Mastery Points: ${player.talentPoints || 0}`;

    for (const key in TALENT_DATA) {
        const talent = TALENT_DATA[key];
        const isLearned = playerTalents.includes(key);
        const canAfford = (player.talentPoints > 0);

        const div = document.createElement('div');
        div.className = `panel p-3 rounded border ${isLearned ? 'border-green-500 bg-green-900 bg-opacity-20' : 'border-gray-600'}`;
        
        let btnHtml = '';
        if (isLearned) {
            btnHtml = `<span class="text-green-500 font-bold text-sm">Learned</span>`;
        } else if (canAfford) {
            btnHtml = `<button onclick="learnTalent('${key}')" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm">Learn</button>`;
        } else {
            btnHtml = `<span class="text-gray-500 text-sm">Locked</span>`;
        }

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="text-2xl">${talent.icon}</div>
                    <div>
                        <div class="font-bold">${talent.name} <span class="text-xs text-gray-400 uppercase">[${talent.class}]</span></div>
                        <div class="text-xs text-gray-300">${talent.description}</div>
                    </div>
                </div>
                <div>${btnHtml}</div>
            </div>
        `;
        talentListDiv.appendChild(div);
    }
}

// Global scope for HTML onclick
window.learnTalent = function(talentId) {
    const player = gameState.player;
    if (!player.talentPoints || player.talentPoints <= 0) return;
    if (player.talents && player.talents.includes(talentId)) return;

    if (!player.talents) player.talents = [];
    player.talents.push(talentId);
    player.talentPoints--;

    logMessage(`You mastered the ${TALENT_DATA[talentId].name} talent!`);
    triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');

    playerRef.update({
        talents: player.talents,
        talentPoints: player.talentPoints
    });

    renderTalentTree();
};

closeTalentButton.addEventListener('click', () => talentModal.classList.add('hidden'));

const statDisplays = {
    health: document.getElementById('healthDisplay'),
    mana: document.getElementById('manaDisplay'),
    stamina: document.getElementById('staminaDisplay'),
    psyche: document.getElementById('psycheDisplay'),
    hunger: document.getElementById('hungerDisplay'),
    thirst: document.getElementById('thirstDisplay'),
    strength: document.getElementById('strengthDisplay'),
    wits: document.getElementById('witsDisplay'),
    constitution: document.getElementById('constitutionDisplay'),
    dexterity: document.getElementById('dexterityDisplay'),
    charisma: document.getElementById('charismaDisplay'),
    luck: document.getElementById('luckDisplay'),
    willpower: document.getElementById('willpowerDisplay'),
    perception: document.getElementById('perceptionDisplay'),
    endurance: document.getElementById('enduranceDisplay'),
    intuition: document.getElementById('intuitionDisplay'),
    coins: document.getElementById('coinsDisplay'),

    level: document.getElementById('levelDisplay'),
    xp: document.getElementById('xpDisplay'),
    statPoints: document.getElementById('statPointsDisplay')
};

const statBarElements = {
    health: document.getElementById('healthBar'),
    mana: document.getElementById('manaBar'),
    stamina: document.getElementById('staminaBar'),
    psyche: document.getElementById('psycheBar'),
    hunger: document.getElementById('hungerBar'),
    thirst: document.getElementById('thirstBar'),
    xp: document.getElementById('xpBar')
};

const elevationNoise = Object.create(Perlin);
elevationNoise.init(WORLD_SEED + ':elevation');
const moistureNoise = Object.create(Perlin);
moistureNoise.init(WORLD_SEED + ':moisture');

/**
 * Returns a clean array of inventory items ready for Firebase storage.
 * Removes functions (like 'effect') and ensures data consistency.
 */
function getSanitizedInventory() {
    return gameState.player.inventory.map(item => ({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        tile: item.tile,
        damage: item.damage || null,
        slot: item.slot || null,
        defense: item.defense || null,
        statBonuses: item.statBonuses || null,
        spellId: item.spellId || null,
        skillId: item.skillId || null,
        stat: item.stat || null,
        isEquipped: item.isEquipped || false,
        // When we add Durability later, we only need to add it HERE:
        // durability: item.durability || null 
    }));
}

const TileRenderer = {
    // Helper: Deterministic random based on WORLD coordinates
    getPseudoRandom: (x, y) => {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    drawBase: (ctx, x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    },

    // --- DECORATION HELPERS ---
    drawGrassTuft: (ctx, x, y, color) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Draw 3 little blades
        ctx.moveTo(tx + 4, ty + 16); ctx.lineTo(tx + 4, ty + 10);
        ctx.moveTo(tx + 8, ty + 16); ctx.lineTo(tx + 8, ty + 8);
        ctx.moveTo(tx + 12, ty + 16); ctx.lineTo(tx + 12, ty + 11);
        ctx.stroke();
    },

    drawFlower: (ctx, x, y, seedX, seedY) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        // Stem
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx + 10, ty + 16); ctx.lineTo(tx + 10, ty + 8); ctx.stroke();
        // Petals (Color based on world coord, not screen)
        ctx.fillStyle = (seedX + seedY) % 2 === 0 ? '#f472b6' : '#facc15'; 
        ctx.beginPath(); ctx.arc(tx + 10, ty + 8, 2.5, 0, Math.PI * 2); ctx.fill();
    },

    drawPebble: (ctx, x, y, color, seedX, seedY) => {
        // Position relies on world coords to stay static
        const tx = x * TILE_SIZE + (Math.abs(seedX) * 3 % 10) + 2; 
        const ty = y * TILE_SIZE + (Math.abs(seedY) * 7 % 10) + 5;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI * 2); ctx.fill();
    },

    drawBone: (ctx, x, y) => {
        const tx = x * TILE_SIZE + 10;
        const ty = y * TILE_SIZE + 10;
        ctx.strokeStyle = '#d4d4d8';
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(tx-3, ty-3); ctx.lineTo(tx+3, ty+3);
        ctx.moveTo(tx+3, ty-3); ctx.lineTo(tx-3, ty+3);
        ctx.stroke();
    },

    // --- BIOME RENDERERS (Now accepting mapX/mapY) ---

    // 🌲 Forests
    drawForest: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        
        // Reduced frequency: 5% chance (was 20%)
        if (TileRenderer.getPseudoRandom(mapX, mapY) < 0.05) {
            const tx = x * TILE_SIZE + 10;
            const ty = y * TILE_SIZE + 14;
            ctx.fillStyle = '#fca5a5'; 
            ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI, true); ctx.fill(); 
            ctx.fillStyle = '#fff';
            ctx.fillRect(tx - 1, ty, 2, 4); 
        }

        ctx.fillStyle = accentColor;
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cy = y * TILE_SIZE + TILE_SIZE / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - TILE_SIZE * 0.4);
        ctx.lineTo(cx + TILE_SIZE * 0.3, cy + TILE_SIZE * 0.3);
        ctx.lineTo(cx - TILE_SIZE * 0.3, cy + TILE_SIZE * 0.3);
        ctx.fill();
    },

    // ⛰ Mountains
    drawMountain: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        // Reduced frequency: 10% chance (was 50%)
        if (TileRenderer.getPseudoRandom(mapX, mapY) < 0.1) {
            TileRenderer.drawPebble(ctx, x, y, '#78716c', mapX, mapY);
        }
        
        ctx.fillStyle = accentColor;
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        ctx.beginPath();
        ctx.moveTo(tx + TILE_SIZE * 0.5, ty + TILE_SIZE * 0.1);
        ctx.lineTo(tx + TILE_SIZE * 0.9, ty + TILE_SIZE * 0.9);
        ctx.lineTo(tx + TILE_SIZE * 0.1, ty + TILE_SIZE * 0.9);
        ctx.fill();
    },

    // . Plains
    drawPlains: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);
        
        // Reduced frequencies:
        if (rand < 0.02) { // 2% Chance for Flower (was 10%)
            TileRenderer.drawFlower(ctx, x, y, mapX, mapY); 
        } else if (rand < 0.10) { // 8% Chance for Grass (was 20%)
            TileRenderer.drawGrassTuft(ctx, x, y, accentColor); 
        } else if ((mapX * 123 + mapY * 456) % 11 === 0) { // Spread out detail lines
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1;
            const tx = x * TILE_SIZE + TILE_SIZE/2;
            const ty = y * TILE_SIZE + TILE_SIZE/2;
            ctx.beginPath();
            ctx.moveTo(tx - 2, ty + 2);
            ctx.lineTo(tx, ty - 2);
            ctx.lineTo(tx + 2, ty + 2);
            ctx.stroke();
        }
    },

    // d Deadlands
    drawDeadlands: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);
        
        if (rand < 0.03) { // 3% Chance for Bones (was 10%)
            TileRenderer.drawBone(ctx, x, y); 
        } else if (rand < 0.15) {
            TileRenderer.drawPebble(ctx, x, y, '#52525b', mapX, mapY);
        }
    },

    // D Desert
    drawDesert: (ctx, x, y, mapX, mapY, baseColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);
        if (rand > 0.7) { // Reduced ripples
            const tx = x * TILE_SIZE;
            const ty = y * TILE_SIZE;
            ctx.strokeStyle = '#d97706'; 
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tx + 4, ty + 10);
            ctx.lineTo(tx + 16, ty + 10);
            ctx.stroke();
        }
    },

    // 🌊 Water (Animated)
    drawWater: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        // Use mapX for consistent wave position
        const timeOffset = Math.sin(Date.now() / 1500 + mapX); 
        const yOffset = timeOffset * 2;
        ctx.beginPath();
        ctx.moveTo(tx + 2, ty + TILE_SIZE/2 + yOffset);
        ctx.lineTo(tx + TILE_SIZE - 2, ty + TILE_SIZE/2 + yOffset);
        ctx.stroke();
    },
    
    // 🔥 Fire (Animated)

    drawFire: (ctx, x, y, baseColor) => { // <-- Added baseColor parameter
        TileRenderer.drawBase(ctx, x, y, baseColor || '#451a03'); // <-- Use it, or fallback to brown
        
        const tx = x * TILE_SIZE + TILE_SIZE/2;
        const ty = y * TILE_SIZE + TILE_SIZE - 2;
        const flicker = Math.sin(Date.now() / 100) * 3;
        
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 4 + (flicker*0.2), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#facc15'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 2 + (flicker*0.1), 0, Math.PI * 2); ctx.fill();
    },

    // Ω Void Rift (Animated)
    drawVoid: (ctx, x, y) => {
        TileRenderer.drawBase(ctx, x, y, '#000');
        const tx = x * TILE_SIZE + TILE_SIZE/2;
        const ty = y * TILE_SIZE + TILE_SIZE/2;
        const pulse = Math.sin(Date.now() / 300);
        const size = 6 + (pulse * 2);
        
        ctx.strokeStyle = '#a855f7'; 
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, size, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#581c87'; 
        ctx.beginPath(); ctx.arc(tx, ty, size/2, 0, Math.PI * 2); ctx.fill();
    },

    // 🧱 Walls (Standard)
    drawWall: (ctx, x, y, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        ctx.beginPath(); ctx.moveTo(tx, ty + TILE_SIZE/2); ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx + TILE_SIZE/2, ty); ctx.lineTo(tx + TILE_SIZE/2, ty + TILE_SIZE/2); ctx.stroke();
    }
};

const chunkManager = {
    CHUNK_SIZE: 16,
    loadedChunks: {},
    worldState: {},
    caveMaps: {},
    caveThemes: {},
    castleMaps: {},
    caveEnemies: {},

generateCave(caveId) {
        if (this.caveMaps[caveId]) return this.caveMaps[caveId];

        // --- 1. Setup Variables (Dynamic Scaling) ---
        let chosenThemeKey;
        let CAVE_WIDTH = 70;
        let CAVE_HEIGHT = 70;
        let enemyCount = 20;

        // --- THEME SELECTION LOGIC ---
        if (caveId === 'cave_landmark') {
            chosenThemeKey = 'ABYSS'; // Force the Epic Theme
            CAVE_WIDTH = 100;  // Huge map (Standard is 70)
            CAVE_HEIGHT = 100; // Huge map
            enemyCount = 60;   // Triple the enemies (Standard is 20)
        } else if (caveId.startsWith('void_')) {
            chosenThemeKey = 'VOID'; // Force Void Theme
            enemyCount = 25;   // Slightly denser than normal
        } else {
            // Normal procedural cave
            const randomTheme = Alea(stringToSeed(caveId + ':theme'));
            // Filter out special themes so they doesn't appear in normal caves
            const themeKeys = Object.keys(CAVE_THEMES).filter(k => k !== 'ABYSS' && k !== 'VOID');
            chosenThemeKey = themeKeys[Math.floor(randomTheme() * themeKeys.length)];
        }
        // -----------------------

        const theme = CAVE_THEMES[chosenThemeKey];
        this.caveThemes[caveId] = chosenThemeKey; // Remember the theme

        // 2. Generate the map layout
        const map = Array.from({
            length: CAVE_HEIGHT
        }, () => Array(CAVE_WIDTH).fill(theme.wall));
        
        const random = Alea(stringToSeed(caveId));
        let x = Math.floor(CAVE_WIDTH / 2);
        let y = Math.floor(CAVE_HEIGHT / 2);

        const startPos = {
            x,
            y
        };
        let steps = 2000;
        while (steps > 0) {
            map[y][x] = theme.floor; // Use theme's floor
            const direction = Math.floor(random() * 4);
            if (direction === 0 && x > 1) x--;
            else if (direction === 1 && x < CAVE_WIDTH - 2) x++;
            else if (direction === 2 && y > 1) y--;
            else if (direction === 3 && y < CAVE_HEIGHT - 2) y++;
            steps--;
        }

        // --- 3. STAMP THEMED ROOMS ---
        // Initialize the enemy list here
        this.caveEnemies[caveId] = [];
        
        const roomTemplates = Object.values(CAVE_ROOM_TEMPLATES);
        const roomAttempts = 5; // Try to place 5 rooms

        for (let i = 0; i < roomAttempts; i++) {
            // Pick a random room template
            const room = roomTemplates[Math.floor(random() * roomTemplates.length)];
            
            // Pick a random top-left corner for the room
            const roomX = Math.floor(random() * (CAVE_WIDTH - room.width - 2)) + 1;
            const roomY = Math.floor(random() * (CAVE_HEIGHT - room.height - 2)) + 1;

            // Stamp the room
            for (let ry = 0; ry < room.height; ry++) {
                for (let rx = 0; rx < room.width; rx++) {
                    
                    const mapX = roomX + rx;
                    const mapY = roomY + ry;
                    const templateTile = room.map[ry][rx];

                    if (templateTile === ' ') continue; // Skip empty spaces

                    let tileToPlace = null;

                    if (templateTile === 'W') {
                        tileToPlace = theme.wall;
                    } else if (templateTile === 'F') {
                        tileToPlace = theme.floor;
                    } else {
                        tileToPlace = templateTile; // It's an item or enemy
                    }

                    // Stamp the tile onto the map
                    map[mapY][mapX] = tileToPlace;

                    // If it's an enemy, we must pre-populate it
                    if (ENEMY_DATA[tileToPlace]) {
                        const enemyTemplate = ENEMY_DATA[tileToPlace];
                        // Parse the cave's world coordinates if available, or default to 0
                        const parts = caveId.split('_');
                        const caveX = parts.length > 2 ? parseInt(parts[1]) : 0;
                        const caveY = parts.length > 2 ? parseInt(parts[2]) : 0;

                        // Generate scaled stats
                        const scaledStats = getScaledEnemy(enemyTemplate, caveX, caveY);

                        this.caveEnemies[caveId].push({
                            id: `${caveId}:${mapX},${mapY}`,
                            x: mapX,
                            y: mapY,
                            tile: tileToPlace,
                            name: scaledStats.name,
                            isElite: scaledStats.isElite || false,
                            color: scaledStats.color || null,
                            health: scaledStats.maxHealth,
                            maxHealth: scaledStats.maxHealth,
                            attack: scaledStats.attack,
                            defense: enemyTemplate.defense,
                            xp: scaledStats.xp,
                            loot: enemyTemplate.loot,
                            caster: enemyTemplate.caster || false,
                            castRange: enemyTemplate.castRange || 0,
                            spellDamage: Math.floor((enemyTemplate.spellDamage || 0) * (1 + (Math.floor(Math.sqrt(caveX*caveX + caveY*caveY)/50) * 0.1))),
                            inflicts: enemyTemplate.inflicts || null,
                            isElite: scaledStats.isElite || false,
                            color: scaledStats.color || null,
                            madnessTurns: 0,
                            frostbiteTurns: 0,
                            poisonTurns: 0,
                            rootTurns: 0
                        });
                    }
                }
            }
        }

        // --- 3b. THEME SPECIFIC TERRAIN GENERATION ---
        
        // VOLCANO: Generate Lava Pools (~30% of floor becomes Lava)
        if (chosenThemeKey === 'FIRE') {
            const lavaChance = 0.30;
            for (let y = 1; y < CAVE_HEIGHT - 1; y++) {
                for (let x = 1; x < CAVE_WIDTH - 1; x++) {
                    if (map[y][x] === theme.floor && random() < lavaChance) {
                        map[y][x] = '~'; // Turn floor into Lava
                    }
                }
            }
            // Ensure Start Area is safe
            map[startPos.y][startPos.x] = '.';
            map[startPos.y+1][startPos.x] = '.';
            map[startPos.y-1][startPos.x] = '.';
            map[startPos.y][startPos.x+1] = '.';
            map[startPos.y][startPos.x-1] = '.';
        }

        // SUNKEN TEMPLE: Flood the ruins
        if (chosenThemeKey === 'SUNKEN') {
            const shallowChance = 0.40; // 40% Shallow Water (Drains Stamina)
            const deepChance = 0.05;    // 5% Deep Water (Obstacle)
            
            for (let y = 1; y < CAVE_HEIGHT - 1; y++) {
                for (let x = 1; x < CAVE_WIDTH - 1; x++) {
                    if (map[y][x] === theme.floor) {
                        const roll = random();
                        if (roll < deepChance) {
                            map[y][x] = '~'; // Deep Water (Block)
                        } else if (roll < shallowChance + deepChance) {
                            map[y][x] = '≈'; // Shallow Water (Stamina Drain)
                        }
                    }
                }
            }
            // Ensure Start Area is safe
            map[startPos.y][startPos.x] = '.';
            map[startPos.y+1][startPos.x] = '.';
            map[startPos.y-1][startPos.x] = '.';
            map[startPos.y][startPos.x+1] = '.';
            map[startPos.y][startPos.x-1] = '.';
        }

        // --- 4. Place procedural loot and decorations ---

        const CAVE_LOOT_TABLE = ['+', 'o', 'Y', 'S', '$', '📄', '🍄', '🏺', '⚰️'];
        const lootQuantity = Math.floor(random() * 4);

        for (let i = 0; i < lootQuantity; i++) {
            const itemToPlace = CAVE_LOOT_TABLE[Math.floor(random() * CAVE_LOOT_TABLE.length)];
            let placed = false;
            for (let attempt = 0; attempt < 5 && !placed; attempt++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
                if (map[randY][randX] === theme.floor) {
                    map[randY][randX] = itemToPlace;
                    placed = true;
                }
            }
        }
        
        const specialItems = theme.decorations.filter(item => !CAVE_LOOT_TABLE.includes(item));
        for (const itemToPlace of specialItems) {
            let placed = false;
            for (let attempt = 0; attempt < 5 && !placed; attempt++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
                if (map[randY][randX] === theme.floor) {
                    map[randY][randX] = itemToPlace;
                    placed = true;
                }
            }
        }

        // --- 4b. Place Phase Walls (Only in Void) ---
        if (chosenThemeKey === 'VOID') {
            for(let i=0; i<40; i++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 4)) + 2;
                const randX = Math.floor(random() * (CAVE_WIDTH - 4)) + 2;
                // Turn a normal wall into a phase wall
                if (map[randY][randX] === theme.wall) {
                    map[randY][randX] = theme.phaseWall;
                }
            }
        }

        // --- 5. Place procedural enemies ---
        const enemyTypes = theme.enemies || Object.keys(ENEMY_DATA);
        
        for (let i = 0; i < enemyCount; i++) {

            const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
            const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

            if (map[randY][randX] === theme.floor && (randX !== startPos.x || randY !== startPos.y)) {
                const enemyTile = enemyTypes[Math.floor(random() * enemyTypes.length)];
                const enemyTemplate = ENEMY_DATA[enemyTile];

                // Parse coordinates for scaling
                const parts = caveId.split('_');
                const caveX = parts.length > 2 ? parseInt(parts[1]) : 0;
                const caveY = parts.length > 2 ? parseInt(parts[2]) : 0;
                const scaledStats = getScaledEnemy(enemyTemplate, caveX, caveY);


                map[randY][randX] = enemyTile;

                this.caveEnemies[caveId].push({
                    id: `${caveId}:${randX},${randY}`,
                    x: randX,
                    y: randY,
                    tile: enemyTile,
                    name: scaledStats.name, // Use scaled name
                    health: scaledStats.maxHealth, // Use scaled HP
                    maxHealth: scaledStats.maxHealth,
                    attack: scaledStats.attack, // Use scaled Atk
                    defense: enemyTemplate.defense,
                    xp: scaledStats.xp,
                    loot: enemyTemplate.loot,
                    teleporter: enemyTemplate.teleporter || false, 
                    caster: enemyTemplate.caster || false,
                    castRange: enemyTemplate.castRange || 0,
                    spellDamage: enemyTemplate.spellDamage || 0,
                    inflicts: enemyTemplate.inflicts || null,

                    isElite: scaledStats.isElite || false,
                    color: scaledStats.color || null,

                    madnessTurns: 0,
                    frostbiteTurns: 0,
                    poisonTurns: 0,
                    rootTurns: 0
                });
            }
        }
        
        // --- 6. Place the Exit ---
        map[startPos.y][startPos.x] = '>'; 
        
        // --- 7. Secret Wall Generation ---
        const secretWallTile = theme.secretWall;
        
        if (secretWallTile) { 
            for (let y = 2; y < CAVE_HEIGHT - 2; y++) {
                for (let x = 2; x < CAVE_WIDTH - 2; x++) {

                    if (map[y][x] === theme.floor) {
                        // Check if this is a "dead end" (3 walls)
                        let wallCount = 0;
                        let floorDir = null; // 0:North, 1:South, 2:West, 3:East

                        if (map[y - 1][x] === theme.wall) wallCount++;
                        else floorDir = 0;
                        if (map[y + 1][x] === theme.wall) wallCount++;
                        else floorDir = 1;
                        if (map[y][x - 1] === theme.wall) wallCount++;
                        else floorDir = 2;
                        if (map[y][x + 1] === theme.wall) wallCount++;
                        else floorDir = 3;

                        // If it's a dead end and we roll the dice (5% chance)
                        if (wallCount === 3 && random() > 0.95) {

                            // Find the wall opposite the entrance and carve
                            if (floorDir === 0 && map[y + 2][x] === theme.wall) { 
                                map[y + 1][x] = secretWallTile;
                                map[y + 2][x] = '$'; 
                            } else if (floorDir === 1 && map[y - 2][x] === theme.wall) { 
                                map[y - 1][x] = secretWallTile;
                                map[y - 2][x] = '$';
                            } else if (floorDir === 2 && map[y][x + 2] === theme.wall) { 
                                map[y][x + 1] = secretWallTile;
                                map[y][x + 2] = '$';
                            } else if (floorDir === 3 && map[y][x - 2] === theme.wall) { 
                                map[y][x - 1] = secretWallTile;
                                map[y][x - 2] = '$';
                            }
                        }
                    }
                }
            }
        }

        // --- 8. Landmark Boss Placement ---
        if (caveId === 'cave_landmark') {
            let bossPlaced = false;
            let attempts = 0;
            while (!bossPlaced && attempts < 1000) {
                // Pick a random spot
                const bx = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
                const by = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                
                // Must be floor, and far from entrance (distance > 30)
                const distFromStart = Math.sqrt(Math.pow(bx - startPos.x, 2) + Math.pow(by - startPos.y, 2));
                
                if (map[by][bx] === theme.floor && distFromStart > 30) {
                    const bossTile = '🧙';
                    const bossTemplate = ENEMY_DATA[bossTile];
                    
                    // Place on map
                    map[by][bx] = bossTile;
                    
                    // Add to enemy list
                    this.caveEnemies[caveId].push({
                        id: `${caveId}:BOSS`, // Unique ID
                        x: bx,
                        y: by,
                        tile: bossTile,
                        name: bossTemplate.name,
                        health: bossTemplate.maxHealth,
                        maxHealth: bossTemplate.maxHealth,
                        attack: bossTemplate.attack,
                        defense: bossTemplate.defense,
                        xp: bossTemplate.xp,
                        loot: bossTemplate.loot,
                        caster: true,
                        castRange: bossTemplate.castRange,
                        spellDamage: bossTemplate.spellDamage,
                        isBoss: true, // Important flag
                        madnessTurns: 0,
                        frostbiteTurns: 0,
                        poisonTurns: 0,
                        rootTurns: 0
                    });
                    bossPlaced = true;
                }
                attempts++;
            }
        }

        // Ensure entrance is clear
        map[startPos.y][startPos.x] = '>'; 
        this.caveMaps[caveId] = map;
        return map;
    },

    generateCastle(castleId, forcedLayoutKey = null) { // <-- ADD THIS
        if (this.castleMaps[castleId]) return this.castleMaps[castleId];

        // 1. Use the castleId to pick a layout
        let chosenLayoutKey;
        if (forcedLayoutKey && CASTLE_LAYOUTS[forcedLayoutKey]) {
            chosenLayoutKey = forcedLayoutKey; // Use the forced layout
        } else {
            // Pick a random one
            const randomLayout = Alea(stringToSeed(castleId + ':layout'));
            const layoutKeys = Object.keys(CASTLE_LAYOUTS);
            chosenLayoutKey = layoutKeys[Math.floor(randomLayout() * layoutKeys.length)];
        }
        const layout = CASTLE_LAYOUTS[chosenLayoutKey];

        // 2. Get the base map and spawn point from the chosen layout
        const baseMap = layout.map;
        // Store the spawn point so the movement handler can use it
        this.castleSpawnPoints = this.castleSpawnPoints || {};
        this.castleSpawnPoints[castleId] = layout.spawn;

        // --- MODIFICATION END ---

        const map = baseMap.map(row => [...row]);

        const random = Alea(stringToSeed(castleId));

        // Procedurally add breaches and rubble (This code is unchanged)
        for (let i = 0; i < 75; i++) {
            const y = Math.floor(random() * (map.length - 4)) + 2;
            const x = Math.floor(random() * (map[0].length - 4)) + 2;

            if (map[y][x] === '▓' && random() > 0.5) {
                map[y][x] = '.';
            } else if (map[y][x] === '.') {
                const neighbors = [map[y - 1][x], map[y + 1][x], map[y][x - 1], map[y][x + 1]];
                const isNextToWall = neighbors.includes('▓');
                if (isNextToWall && random() > 0.85) {
                    map[y][x] = '▒';
                }
            }
        }
        const npcTypesToSpawn = ['N', 'N', '§', 'H']; // 2 Villagers, 1 Shop, 1 Healer
        let spawnAttempts = 50; // Try 50 times to place them

        for (const npcTile of npcTypesToSpawn) {
            let placed = false;
            for (let i = 0; i < spawnAttempts && !placed; i++) {
                // Find a random x, y
                const randY = Math.floor(random() * (map.length - 2)) + 1;
                const randX = Math.floor(random() * (map[0].length - 2)) + 1;

                // Check if it's a floor tile
                if (map[randY][randX] === '.') {
                    map[randY][randX] = npcTile; // Place the NPC
                    placed = true;
                }
            }
        }

        // Ensure the tiles adjacent to spawn are walkable, fixing the
        // bug where players can be walled-in by procedural generation.
        const spawnX = layout.spawn.x;
        const spawnY = layout.spawn.y;

        // List of adjacent coordinates [y, x]
        const adjacentCoords = [
            [spawnY - 1, spawnX], // North
            [spawnY + 1, spawnX], // South
            [spawnY, spawnX - 1], // West
            [spawnY, spawnX + 1] // East
        ];

        // These tiles should NOT be overwritten
        const protectedTiles = ['▓', 'X', 'B', '📖'];

        for (const [y, x] of adjacentCoords) {
            // Bounds check
            if (map[y] && map[y][x]) {
                // Get the *original* tile from the layout
                const originalTile = (baseMap[y] && baseMap[y][x]) ? baseMap[y][x] : '▓';

                // If the original tile is NOT a protected tile,
                // force it to be a floor.
                // This clears any '▒' (rubble) or 'N', 'H', '§' (NPCs)
                if (!protectedTiles.includes(originalTile)) {
                    map[y][x] = '.';
                }
            }
        }

        // Finally, ensure the spawn tile itself is a floor tile
        map[spawnY][spawnX] = '.';

        // Extract Guards to Entities (Living World) ---
        // Clear old friendly NPCs for this ID to prevent duplicates
        this.friendlyNpcs = this.friendlyNpcs || {};
        this.friendlyNpcs[castleId] = [];

        for(let y=0; y < map.length; y++) {
            for(let x=0; x < map[0].length; x++) {
                if (map[y][x] === 'G') {
                    // Found a static guard tile. Remove it.
                    map[y][x] = '.'; 
                    
                    // Create a mobile guard entity
                    this.friendlyNpcs[castleId].push({
                        id: `guard_${x}_${y}`,
                        x: x,
                        y: y,
                        name: "Castle Guard",
                        tile: 'G',
                        role: 'guard',
                        dialogue: [
                            "The night shift is quiet. Just how I like it.",
                            "Keep your weapons sheathed in the village.",
                            "I heard wolves howling to the east.",
                            "Patrolling makes my feet ache.",
                            "Nothing to report."
                        ]
                    });
                }
            }
        }

        this.castleMaps[castleId] = map;
        return map;
    },

    listenToChunkState(chunkX, chunkY) {
        const chunkId = `${chunkX},${chunkY}`;
        if (worldStateListeners[chunkId]) return;
        const docRef = db.collection('worldState').doc(chunkId);
        worldStateListeners[chunkId] = docRef.onSnapshot(doc => {
            this.worldState[chunkId] = doc.exists ? doc.data() : {};
            render();
        });
    },

    setWorldTile(worldX, worldY, newTile) {
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        const chunkId = `${chunkX},${chunkY}`;
        const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        if (!this.worldState[chunkId]) this.worldState[chunkId] = {};
        const tileKey = `${localX},${localY}`;
        this.worldState[chunkId][tileKey] = newTile;
        db.collection('worldState').doc(chunkId).set(this.worldState[chunkId], {
            merge: true
        });
    },

generateChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        const random = Alea(stringToSeed(WORLD_SEED + ':' + chunkKey));

        let chunkData = Array.from({ length: this.CHUNK_SIZE }, () => Array(this.CHUNK_SIZE));

        for (let y = 0; y < this.CHUNK_SIZE; y++) {
            for (let x = 0; x < this.CHUNK_SIZE; x++) {
                const worldX = chunkX * this.CHUNK_SIZE + x;
                const worldY = chunkY * this.CHUNK_SIZE + y;
                
                // Calculate Distance from Spawn (0,0)
                const dist = Math.sqrt(worldX * worldX + worldY * worldY);

                const elev = elevationNoise.noise(worldX / 70, worldY / 70);
                const moist = moistureNoise.noise(worldX / 50, worldY / 50);

                let tile = '.';
                if (elev < 0.35) tile = '~'; 
                else if (elev < 0.4 && moist > 0.7) tile = '≈'; 
                else if (elev > 0.8) tile = '^'; 
                else if (elev > 0.6 && moist < 0.3) tile = 'd'; 
                else if (moist < 0.15) tile = 'D';
                else if (moist > 0.55) tile = 'F'; 
                else tile = '.'; 

                const featureRoll = random();

                // --- 1. LEGENDARY LANDMARKS (Unique, Very Rare) ---
                if (tile === '.' && featureRoll < 0.0000005) { // 1 in 2M
                    this.setWorldTile(worldX, worldY, '♛');
                    chunkData[y][x] = '♛';
                } 
                else if ((tile === 'd' || tile === '^') && featureRoll < 0.000001) { 
                    this.setWorldTile(worldX, worldY, '🕳️');
                    chunkData[y][x] = '🕳️';
                }
                
                // --- 2. RARE STRUCTURES (Scaled by Distance) ---
                else if (tile === '.' && featureRoll < 0.000005) { // Safe Haven
                    this.setWorldTile(worldX, worldY, 'V');
                    chunkData[y][x] = 'V';
                } 
                else if (tile === '.' && featureRoll < 0.00003) { // Shrine
                    this.setWorldTile(worldX, worldY, '⛩️');
                    chunkData[y][x] = '⛩️';
                } 
                else if (tile === '.' && featureRoll < 0.00004) { // Obelisk
                    this.setWorldTile(worldX, worldY, '|');
                    chunkData[y][x] = '|';
                } 
                else if (tile === '.' && featureRoll < 0.00005) { // Wishing Well
                    this.setWorldTile(worldX, worldY, '⛲');
                    chunkData[y][x] = '⛲';
                } 
                else if ((tile === 'd' || tile === 'D') && featureRoll < 0.000005) { // Void Rift
                    this.setWorldTile(worldX, worldY, 'Ω');
                    chunkData[y][x] = 'Ω';
                }

                // --- 3. COMMON FEATURES ---
                else if (tile === '.' && featureRoll < 0.0005) { 
                    let features = Object.keys(TILE_DATA);
                    features = features.filter(f => 
                        TILE_DATA[f].type !== 'dungeon_exit' &&
                        TILE_DATA[f].type !== 'castle_exit' &&
                        TILE_DATA[f].type !== 'enemy' &&
                        f !== '📖' && f !== '♛' && f !== 'V' && f !== 'c'
                    );
                    const featureTile = features[Math.floor(random() * features.length)]; 
                    this.setWorldTile(worldX, worldY, featureTile);
                    chunkData[y][x] = featureTile;
                }
                
                // --- 4. GENERIC STRUCTURES ---
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0001) { 
                    this.setWorldTile(worldX, worldY, '🏛️');
                    chunkData[y][x] = '🏛️';
                } 
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0002) { 
                    this.setWorldTile(worldX, worldY, '⛺');
                    chunkData[y][x] = '⛺';
                }

                else {
                    const hostileRoll = random();
                    
                    // --- MOUNTAINS ---
                    if (tile === '^') { 
                        if (dist > 300 && hostileRoll < 0.0002) chunkData[y][x] = 'Y'; // Yeti
                        else if (dist > 250 && hostileRoll < 0.0003) chunkData[y][x] = '🐲'; // Young Drake
                        else if (dist > 150 && hostileRoll < 0.0003) chunkData[y][x] = 'Ø'; // Ogre
                        else if (hostileRoll < 0.0004) chunkData[y][x] = '🗿'; // Stone Golem
                        else if (hostileRoll < 0.0006) chunkData[y][x] = 'g'; // Goblins
                        else if (hostileRoll < 0.0008) chunkData[y][x] = '🦇'; // Giant Bat
                        
                        // Resources
                        else if (hostileRoll < 0.007) { 
                            this.setWorldTile(worldX, worldY, '🏚'); 
                            chunkData[y][x] = '🏚'; 
                        }
                        else if (dist > 200 && hostileRoll < 0.010) { 
                            this.setWorldTile(worldX, worldY, '💠'); 
                            chunkData[y][x] = '💠'; 
                        } 
                        else chunkData[y][x] = tile;
                    }

                    // --- FORESTS (Updated with Wildlife) ---
                    else if (tile === 'F') {
                        if (dist > 250 && hostileRoll < 0.0001) chunkData[y][x] = '🐺'; // Dire Wolf
                        else if (hostileRoll < 0.0002) chunkData[y][x] = '🐻'; // Cave Bear (NEW)
                        else if (hostileRoll < 0.0004) chunkData[y][x] = 'w'; // Wolf
                        else if (hostileRoll < 0.0006) chunkData[y][x] = '🐗'; // Boar
                        else if (hostileRoll < 0.0008) chunkData[y][x] = '🦌'; // Stag (NEW)
                        else if (hostileRoll < 0.0010) chunkData[y][x] = '🐍'; // Viper
                        
                        // Resources
                        else if (hostileRoll < 0.009) { this.setWorldTile(worldX, worldY, '🌳'); chunkData[y][x] = '🌳'; } 
                        else if (hostileRoll < 0.012) { this.setWorldTile(worldX, worldY, '🕸'); chunkData[y][x] = '🕸'; } 
                        else if (hostileRoll < 0.015) { this.setWorldTile(worldX, worldY, ':'); chunkData[y][x] = ':'; }
                        else chunkData[y][x] = tile;
                    }

                    // --- SWAMP (Updated with Wildlife) ---
                    else if (tile === '≈') {
                        if (hostileRoll < 0.0003) chunkData[y][x] = 'l'; // Leech
                        else if (hostileRoll < 0.0005) chunkData[y][x] = '🐍'; // Viper
                        else if (hostileRoll < 0.0008) chunkData[y][x] = '🐸'; // Giant Toad (NEW)
                        else if (hostileRoll < 0.0012) chunkData[y][x] = '🦟'; // Blood Mosquito (NEW)
                        
                        else if (hostileRoll < 0.008) { this.setWorldTile(worldX, worldY, '🌿'); chunkData[y][x] = '🌿'; }
                        else chunkData[y][x] = tile;
                    }

                    // --- PLAINS ---
                    else if (tile === '.') {
                        if (dist > 150 && hostileRoll < 0.0001) chunkData[y][x] = 'o'; // Orcs
                        else if (dist > 120 && hostileRoll < 0.0002) chunkData[y][x] = 'w'; // Wolf
                        else if (dist > 80 && hostileRoll < 0.0003) chunkData[y][x] = 'b'; // Bandit
                        else if (hostileRoll < 0.0005) chunkData[y][x] = 'r'; // Rat
                        else if (hostileRoll < 0.0007) chunkData[y][x] = 'R'; // Bandit Recruit
                        else chunkData[y][x] = tile;
                    }

                    // --- DEADLANDS ---
                    else if (tile === 'd') {
                        if (dist > 400 && hostileRoll < 0.0001) chunkData[y][x] = 'D'; // Void Demon
                        else if (hostileRoll < 0.0002) chunkData[y][x] = 's'; // Skeleton
                        else if (hostileRoll < 0.0004) chunkData[y][x] = 'b'; // Bandit
                        else chunkData[y][x] = tile;
                    }

                    // --- DESERT (Updated with Wildlife) ---
                    else if (tile === 'D') {
                        if (hostileRoll < 0.001) { this.setWorldTile(worldX, worldY, '🌵'); chunkData[y][x] = '🌵'; }
                        else if (hostileRoll < 0.0003) chunkData[y][x] = '🦂'; // Giant Scorpion (Old)
                        else if (hostileRoll < 0.0005) chunkData[y][x] = '🦂s'; // Sand Scorpion (NEW)
                        else if (hostileRoll < 0.0007) chunkData[y][x] = '🐍c'; // King Cobra (NEW)
                        else chunkData[y][x] = tile;
                    }
                    
                    else {
                        chunkData[y][x] = tile;
                    }
                }
            }
        }

        // --- SMOOTHING PASS ---
        // Prevents 1-tile biome anomalies (The "Micro-Biome" Fix)
        for (let y = 1; y < this.CHUNK_SIZE - 1; y++) {
            for (let x = 1; x < this.CHUNK_SIZE - 1; x++) {
                const currentTile = chunkData[y][x];

                // Only smooth "Natural" terrain. 
                const naturalTerrain = ['.', 'F', 'd', 'D', '^', '~', '≈'];
                if (!naturalTerrain.includes(currentTile)) continue; 

                // Check 4 neighbors
                const neighbors = [
                    chunkData[y - 1][x], // North
                    chunkData[y + 1][x], // South
                    chunkData[y][x - 1], // West
                    chunkData[y][x + 1]  // East
                ];

                const counts = {};
                let maxCount = 0;
                let dominantTile = null;

                neighbors.forEach(n => {
                    if (naturalTerrain.includes(n)) {
                        counts[n] = (counts[n] || 0) + 1;
                        if (counts[n] > maxCount) {
                            maxCount = counts[n];
                            dominantTile = n;
                        }
                    }
                });

                // The "Peer Pressure" Rule: If 3 or more neighbors differ, switch.
                if (maxCount >= 3 && dominantTile !== currentTile) {
                    chunkData[y][x] = dominantTile;
                }
            }
        }

        this.loadedChunks[chunkKey] = chunkData;
    },

    getTile(worldX, worldY) {
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        const chunkId = `${chunkX},${chunkY}`;
        this.listenToChunkState(chunkX, chunkY);
        const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const tileKey = `${localX},${localY}`;
        if (this.worldState[chunkId] && this.worldState[chunkId][tileKey] !== undefined) {
            return this.worldState[chunkId][tileKey];
        }
        if (!this.loadedChunks[chunkId]) {
            this.generateChunk(chunkX, chunkY);
        }
        const chunk = this.loadedChunks[chunkId];
        return chunk[localY][localX];
    },
    unloadOutOfRangeChunks: function(playerChunkX, playerChunkY) {
        // This defines how many chunks to keep loaded around the player.
        // '2' means a 5x5 grid (2 chunks N, S, E, W + the center one).
        const VIEW_RADIUS_CHUNKS = 2;

        // 1. Create a Set of all chunk IDs that *should* be visible.
        const visibleChunkIds = new Set();
        for (let y = -VIEW_RADIUS_CHUNKS; y <= VIEW_RADIUS_CHUNKS; y++) {
            for (let x = -VIEW_RADIUS_CHUNKS; x <= VIEW_RADIUS_CHUNKS; x++) {
                const chunkId = `${playerChunkX + x},${playerChunkY + y}`;
                visibleChunkIds.add(chunkId);
            }
        }

        // 2. Loop through all chunk listeners we currently have active.
        for (const chunkId in worldStateListeners) {

            // 3. If an active listener is *not* in our visible set...
            if (!visibleChunkIds.has(chunkId)) {

                // 4. ...unload it!
                // console.log(`Unloading chunk: ${chunkId}`); // For debugging

                // Call the unsubscribe function to stop listening
                worldStateListeners[chunkId]();

                // Remove it from our tracking object
                delete worldStateListeners[chunkId];

                // (Optional but recommended) Clear the cached terrain data
                if (this.loadedChunks[chunkId]) {
                    delete this.loadedChunks[chunkId];
                }

                // (Optional but recommended) Clear the cached world state
                if (this.worldState[chunkId]) {
                    delete this.worldState[chunkId];
                }
            }
        }
    }
};

const ParticleSystem = {
    particles: [],
    
    // Creates a spray of "dust" or "blood"
    createExplosion: (x, y, color, count = 8) => {
        for (let i = 0; i < count; i++) {
            ParticleSystem.particles.push({
                x: x + 0.5, // Center of tile
                y: y + 0.5,
                vx: (Math.random() - 0.5) * 0.15, // Random velocity
                vy: (Math.random() - 0.5) * 0.15,
                life: 1.0,
                color: color,
                type: 'dust',
                size: Math.random() * 4 + 2
            });
        }
    },

    // Creates floating numbers floating UP
    createFloatingText: (x, y, text, color) => {
        ParticleSystem.particles.push({
            x: x + 0.5,
            y: y, // Start at top of tile
            vx: 0,
            vy: -0.05, // Float upwards
            life: 2.0, // Lasts 2 seconds
            color: color,
            text: text,
            type: 'text',
            size: 16
        });
    },

    // Confetti for Level Up
    createLevelUp: (x, y) => {
        for (let i = 0; i < 40; i++) {
            const colors = ['#facc15', '#ef4444', '#3b82f6', '#22c55e', '#a855f7'];
            ParticleSystem.particles.push({
                x: x + 0.5,
                y: y + 0.5,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                life: 3.0,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: 'dust',
                size: Math.random() * 5 + 3
            });
        }
        ParticleSystem.createFloatingText(x, y, "LEVEL UP!", "#facc15");
    },

    update: () => {
        for (let i = ParticleSystem.particles.length - 1; i >= 0; i--) {
            const p = ParticleSystem.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02; // Decay

            if (p.life <= 0) {
                ParticleSystem.particles.splice(i, 1);
            }
        }
    },

    draw: (ctx, startX, startY) => {
        // Draw relative to viewport (TILE_SIZE is global)
        ParticleSystem.particles.forEach(p => {
            const screenX = (p.x - startX) * TILE_SIZE;
            const screenY = (p.y - startY) * TILE_SIZE;

            // Optimization: Don't draw off-screen
            if (screenX < -TILE_SIZE || screenX > ctx.canvas.width ||
                screenY < -TILE_SIZE || screenY > ctx.canvas.height) return;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life); // Fade out
            
            if (p.type === 'text') {
                ctx.fillStyle = p.color;
                ctx.font = `bold ${p.size}px monospace`;
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(p.text, screenX, screenY);
                ctx.fillText(p.text, screenX, screenY);
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(screenX, screenY, p.size, p.size);
            }
            
            ctx.restore();
        });
    }
};

const gameState = {
    player: {
        x: 0,
        y: 0,
        character: '@',
        color: 'blue',
        health: 10,
        maxHealth: 10,
        mana: 10,
        maxMana: 10,
        stamina: 10,
        maxStamina: 10,
        psyche: 10,
        maxPsyche: 10,
        strength: 1,
        wits: 1,
        luck: 1,
        constitution: 1,
        dexterity: 1,
        charisma: 1,
        willpower: 1,
        perception: 1,
        endurance: 1,
        intuition: 1,
        inventory: [],
        coins: 0,
        healthRegenProgress: 0,
        staminaRegenProgress: 0,
        manaRegenProgress: 0,
        psycheRegenProgress: 0,

        strengthBonus: 0,
        strengthBonusTurns: 0,

        frostbiteTurns: 0,
        poisonTurns: 0,

        weather: 'clear', // clear, rain, storm, snow, fog
        weatherTimer: 0,  // Counts turns until weather changes
    },

    lootedTiles: new Set(),
    discoveredRegions: new Set(),

    mapMode: null,

    currentCaveId: null,
    currentCaveTheme: null,
    currentCastleId: null,
    overworldExit: null,
    messages: [],
    flags: {
        hasSeenForestWarning: false,
        canoeEmbarkCount: 0
    },
    inventoryMode: false,

    currentCraftingMode: 'workbench',

    instancedEnemies: [],
    friendlyNpcs: [],
    worldEnemies: {},
    sharedEnemies: {},
    isDroppingItem: false,
    playerTurnCount: 0,
    isAiming: false,
    abilityToAim: null,
    time: {
        day: 1,
        hour: 6,
        minute: 0,
        year: 642,
        era: "of the Fourth Age"
    }
};

ctx.font = `${TILE_SIZE}px monospace`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const logMessage = (text) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = `> ${text}`;
    messageLog.prepend(messageElement);
    messageLog.scrollTop = 0;
};

function triggerAtmosphericFlavor(tile) {
    // 2% chance to trigger flavor text on move
    if (Math.random() > 0.02) return;

    let flavorText = "";

    // Dungeons
    if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme];
        if (theme.name.includes("Ice")) {
            flavorText = "Your breath mists in the freezing air.";
        } else if (theme.name.includes("Fire")) {
            flavorText = "The heat is oppressive. Sweat runs down your back.";
        } else {
            flavorText = "Water drips rhythmically from the ceiling. Plip. Plip.";
        }
    } 
    // Castles
    else if (gameState.mapMode === 'castle') {
        flavorText = "Dust motes dance in a shaft of light.";
    } 
    // Overworld Biomes
    else {
        if (tile === 'F') { // Forest
            const msgs = ["Leaves rustle, though there is no wind.", "A bird calls out, then is suddenly silenced.", "The smell of pine and damp earth fills the air."];
            flavorText = msgs[Math.floor(Math.random() * msgs.length)];
        } else if (tile === '≈') { // Swamp
            const msgs = ["Something splashes in the water nearby.", "A thick mist rolls over the water.", "The air smells of decay."];
            flavorText = msgs[Math.floor(Math.random() * msgs.length)];
        } else if (tile === '^') { // Mountain
            const msgs = ["Loose stones clatter down the cliffside.", "The wind howls through the crags.", "You feel the weight of the mountain looming above."];
            flavorText = msgs[Math.floor(Math.random() * msgs.length)];
        } else if (tile === '.') { // Plains
            const msgs = ["A warm breeze ripples through the grass.", "Cloud shadows race across the plains.", "You spot a hawk circling high above."];
            flavorText = msgs[Math.floor(Math.random() * msgs.length)];
        } else if (tile === 'd' || tile === 'D') { // Deadlands/Desert
            flavorText = "The silence here is deafening.";
        }
    }

    if (flavorText) {
        logMessage(flavorText);
    }
}

function updateWeather() {
    const player = gameState.player;

    // 1. Initialize State if missing (Safety check for existing saves)
    if (typeof player.weatherIntensity === 'undefined') player.weatherIntensity = 0;
    if (typeof player.weatherState === 'undefined') player.weatherState = 'calm'; // calm, building, active, fading
    if (typeof player.weatherDuration === 'undefined') player.weatherDuration = 0;

    // 2. Determine Local Forecast (Where we are now)
    // We expanded the noise scale to 300 so weather zones are larger/longer
    const x = player.x;
    const y = player.y;
    const temp = elevationNoise.noise(x / 300, y / 300); 
    const humid = moistureNoise.noise(x / 300 + 100, y / 300 + 100);

    let localForecast = 'clear';
    // Overworld only
    if (gameState.mapMode === 'overworld') {
        if (humid > 0.6) {
            if (temp < 0.3) localForecast = 'snow';
            else if (humid > 0.8) localForecast = 'storm';
            else localForecast = 'rain';
        } else if (humid > 0.4 && temp < 0.4) {
            localForecast = 'fog';
        }
    }

    // 3. Weather State Machine
    const TRANSITION_SPEED = 0.1; // Takes 10 turns to fade in/out fully

    switch (player.weatherState) {
        case 'calm':
            // If the forecast calls for weather, start building it
            if (localForecast !== 'clear') {
                gameState.weather = localForecast; // Set the type
                player.weatherState = 'building';
                logMessage(`The sky darkens. It looks like ${localForecast} is coming.`);
            }
            break;

        case 'building':
            // Increase intensity
            player.weatherIntensity += TRANSITION_SPEED;
            if (player.weatherIntensity >= 1.0) {
                player.weatherIntensity = 1.0;
                player.weatherState = 'active';
                player.weatherDuration = 50 + Math.floor(Math.random() * 50); // Lasts 50-100 turns
                logMessage(`The ${gameState.weather} is fully upon you.`);
            }
            break;

        case 'active':
            player.weatherDuration--;
            
            // If we walked OUT of the bad weather zone, start fading early
            if (localForecast === 'clear' && player.weatherDuration > 5) {
                 player.weatherDuration = 5; 
                 logMessage("The weather seems to be clearing up.");
            }
            
            if (player.weatherDuration <= 0) {
                player.weatherState = 'fading';
            }
            break;

        case 'fading':
            // Decrease intensity
            player.weatherIntensity -= TRANSITION_SPEED;
            if (player.weatherIntensity <= 0) {
                player.weatherIntensity = 0;
                player.weatherState = 'calm';
                gameState.weather = 'clear';
                logMessage("The skies are clear again.");
            }
            break;
    }
}

/**
 * Updates the UI to show active buff and debuff icons.
 */

function renderStatusEffects() {
    if (!statusEffectsPanel) return; // Safety check

    const player = gameState.player;
    let icons = ''; // We'll build this up as an HTML string

    // Buffs
    if (player.shieldValue > 0) {
        icons += `<span title="Arcane Shield (${Math.ceil(player.shieldValue)} points, ${player.shieldTurns}t)">💠</span>`;
    }
    if (player.defenseBonusTurns > 0) {
        icons += `<span title="Braced (+${player.defenseBonus} Def, ${player.defenseBonusTurns}t)">🛡️</span>`;
    }
    if (player.strengthBonusTurns > 0) {
        icons += `<span title="Strong (+${player.strengthBonus} Str, ${player.strengthBonusTurns}t)">💪</span>`;
    }

    // Debuffs
    if (player.poisonTurns > 0) {
        icons += `<span title="Poisoned (${player.poisonTurns}t)">☣️</span>`;
    }
    if (player.frostbiteTurns > 0) {
        icons += `<span title="Frostbitten (${player.frostbiteTurns}t)">❄️</span>`;
    }

    statusEffectsPanel.innerHTML = icons;
}

const renderStats = () => {

    renderStatusEffects();

    for (const statName in statDisplays) {
        const element = statDisplays[statName];
        if (element && gameState.player.hasOwnProperty(statName)) {
            const value = gameState.player[statName];
            const label = statName.charAt(0).toUpperCase() + statName.slice(1);

            if (statName === 'xp') {
                const max = gameState.player.xpToNextLevel;
                const percent = (value / max) * 100;

                // Update text and bar width
                element.textContent = `XP: ${value} / ${max}`;
                statBarElements.xp.style.width = `${percent}%`;

            } else if (statName === 'statPoints') {
                if (value > 0) {
                    element.textContent = `Stat Points: ${value}`;
                    element.classList.remove('hidden');
                    coreStatsPanel.classList.add('show-stat-buttons');
                } else {
                    element.classList.add('hidden');
                    coreStatsPanel.classList.remove('show-stat-buttons');
                }
            

            } else if (statName === 'health') {
                const max = gameState.player.maxHealth;
                const percent = (value / max) * 100;

                // Update bar width
                statBarElements.health.style.width = `${percent}%`;

                // Update text and bar color
                let healthString = `${label}: ${value}`;
                if (gameState.player.shieldValue > 0) {
                    // e.g., "Health: 10 (+5)"
                    healthString += ` <span class="text-blue-400">(+${Math.ceil(gameState.player.shieldValue)})</span>`;
                }
                // Use innerHTML to render the span, and Math.ceil to avoid ugly decimals
                element.innerHTML = healthString; 
               
                
                // Update text and bar color
                element.classList.remove('text-red-500', 'text-yellow-500', 'text-green-500'); // Clear old text colors

                if (percent > 60) {
                    element.classList.add('text-green-500');
                    statBarElements.health.style.backgroundColor = '#22c55e'; // Green
                } else if (percent > 30) {
                    element.classList.add('text-yellow-500');
                    statBarElements.health.style.backgroundColor = '#eab308'; // Yellow
                } else {
                    element.classList.add('text-red-500');
                    statBarElements.health.style.backgroundColor = '#ef4444'; // Red
                }

            } else if (statName === 'mana') {
                const max = gameState.player.maxMana;
                const percent = (value / max) * 100;
                statBarElements.mana.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

            } else if (statName === 'stamina') {
                const max = gameState.player.maxStamina;
                const percent = (value / max) * 100;
                statBarElements.stamina.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

            } else if (statName === 'wits') {
                let witsText = `${label}: ${value}`;
                // Check for bonus
                if (gameState.player.witsBonus > 0) {
                    witsText += ` <span class="text-green-500">(+${gameState.player.witsBonus})</span>`;
                }
                // Use innerHTML to render the color span
                element.innerHTML = witsText;

            } else if (statName === 'psyche') {
                const max = gameState.player.maxPsyche;
                const percent = (value / max) * 100;
                statBarElements.psyche.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

            } else if (statName === 'hunger') {
                const max = gameState.player.maxHunger;
                const percent = (value / max) * 100;
                statBarElements.hunger.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`; // Use Math.floor to hide decimals
            } else if (statName === 'thirst') {
                const max = gameState.player.maxThirst;
                const percent = (value / max) * 100;
                statBarElements.thirst.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`;

            } else {
                // Default case for Coins, Level, and Core Stats
                element.textContent = `${label}: ${value}`;
            }
        }
    }
};

function handleStatAllocation(event) {
    // Only run if a stat button was clicked
    if (!event.target.classList.contains('stat-add-btn')) return;

    // Check if the player has points to spend
    if (gameState.player.statPoints <= 0) {
        logMessage("You have no stat points to spend.");
        return;
    }

    // Get the stat name from the button's 'data-stat' attribute
    const statToIncrease = event.target.dataset.stat;

    if (statToIncrease && gameState.player.hasOwnProperty(statToIncrease)) {
        // Spend the point
        gameState.player.statPoints--;
        gameState.player[statToIncrease]++;

        let derivedUpdate = {}; // Store changes for Firebase

        if (statToIncrease === 'constitution') {
            gameState.player.maxHealth += 5;
            gameState.player.health += 5; // Also heal them
            derivedUpdate.maxHealth = gameState.player.maxHealth;
            derivedUpdate.health = gameState.player.health;
            logMessage(`Your Constitution increases! Max Health is now ${gameState.player.maxHealth}.`);

        } else if (statToIncrease === 'wits') {
            gameState.player.maxMana += 5;
            gameState.player.mana += 5; // Restore mana
            derivedUpdate.maxMana = gameState.player.maxMana;
            derivedUpdate.mana = gameState.player.mana;
            logMessage(`Your Wits increase! Max Mana is now ${gameState.player.maxMana}.`);

        } else if (statToIncrease === 'endurance') {
            gameState.player.maxStamina += 5;
            gameState.player.stamina += 5; // Restore stamina
            derivedUpdate.maxStamina = gameState.player.maxStamina;
            derivedUpdate.stamina = gameState.player.stamina;
            logMessage(`Your Endurance increases! Max Stamina is now ${gameState.player.maxStamina}.`);

        } else if (statToIncrease === 'willpower') {
            // Psyche seems to be a smaller pool, so we'll add less
            gameState.player.maxPsyche += 3;
            gameState.player.psyche += 3; // Restore psyche
            derivedUpdate.maxPsyche = gameState.player.maxPsyche;
            derivedUpdate.psyche = gameState.player.psyche;
            logMessage(`Your Willpower increases! Max Psyche is now ${gameState.player.maxPsyche}.`);

        } else if (statToIncrease === 'dexterity') {
            logMessage(`Your Dexterity increases! You feel quicker and harder to hit.`);
        
        } else if (statToIncrease === 'luck') {
            logMessage(`Your Luck increases! You feel a bit luckier.`);
            
        } else if (statToIncrease === 'perception') {
            logMessage(`Your Perception increases! You feel more aware of your surroundings.`);

        } else if (statToIncrease === 'intuition') {
            logMessage(`Your Intuition increases! You feel more in tune with your surroundings.`);
            
        } else {
            // This handles stats that don't have derived effects yet
            logMessage(`You increased your ${statToIncrease}!`);
        }

        // Update database
        playerRef.update({
            statPoints: gameState.player.statPoints,
            [statToIncrease]: gameState.player[statToIncrease],
            ...derivedUpdate // Add any derived stat changes here
        });

        // Update UI
        renderStats();
    }
}

// Add the event listener to the panel
coreStatsPanel.addEventListener('click', handleStatAllocation);

function handleItemDrop(event) {
    event.preventDefault();
    const player = gameState.player;

    // Cancel action
    if (event.key === 'Escape') {
        logMessage("Drop canceled.");
        gameState.isDroppingItem = false;
        return;
    }

    const keyNum = parseInt(event.key);

    // Check for valid item slot
    if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) {
        logMessage("Invalid selection. Press 1-9 or (Esc) to cancel.");
        return;
    }

    const itemIndex = keyNum - 1;
    const itemToDrop = player.inventory[itemIndex];

    if (itemToDrop.isEquipped) {
        logMessage("You cannot drop an item you are wearing!");
        gameState.isDroppingItem = false;
        return;
    }

    if (!itemToDrop) {
        logMessage("No item in that slot.");
        gameState.isDroppingItem = false; // Exit drop mode
        return;
    }

    // Check if the player is standing on a valid drop tile (a floor)
    let currentTile;
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        currentTile = (map && map[player.y]) ? map[player.y][player.x] : ' ';
    } else if (gameState.mapMode === 'castle') {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        currentTile = (map && map[player.y]) ? map[player.y][player.x] : ' ';
    } else {
        currentTile = chunkManager.getTile(player.x, player.y);
    }

    let isValidDropTile = false;
    if (gameState.mapMode === 'overworld' && currentTile === '.') {
        isValidDropTile = true;
    } else if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        if (currentTile === theme.floor) isValidDropTile = true;
    } else if (gameState.mapMode === 'castle' && currentTile === '.') {
        isValidDropTile = true;
    }

    if (!isValidDropTile) {
        logMessage("You can't drop an item here. (Must be on a floor tile)");
        gameState.isDroppingItem = false; // Exit drop mode
        return;
    }

    // --- All checks passed, let's drop the item ---

    // 1. (MODIFIED) Create a unique tileId based on the map
    let tileId;
    if (gameState.mapMode === 'overworld') {
        tileId = `${player.x},${-player.y}`;
    } else {
        // This creates a unique ID like "cave_120_340:15,-22"
        const mapId = gameState.currentCaveId || gameState.currentCastleId;
        tileId = `${mapId}:${player.x},${-player.y}`;
    }

    // 2. Remove one item from the stack
    itemToDrop.quantity--;
    logMessage(`You dropped one ${itemToDrop.name}.`);

    // 3. (MODIFIED) Place the item tile on the map
    if (gameState.mapMode === 'overworld') {
        chunkManager.setWorldTile(player.x, player.y, itemToDrop.tile);
    } else if (gameState.mapMode === 'dungeon') {
        chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = itemToDrop.tile;
    } else if (gameState.mapMode === 'castle') {
        chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = itemToDrop.tile;
    }

    // 4. (MOVED & MODIFIED) Allow the tile to be re-looted by deleting
    // its unique ID from the looted list.
    gameState.lootedTiles.delete(tileId);

    // 5. If the stack is empty, remove it from inventory
    if (itemToDrop.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // 6. Update UI and DB
    renderInventory();
    render(); // Re-render the map to show the dropped item
    const inventoryToSave = gameState.player.inventory.map(item => ({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        tile: item.tile,
        damage: item.damage || null,
        slot: item.slot || null,
        defense: item.defense || null,
        statBonuses: item.statBonuses || null,
        spellId: item.spellId || null,
        skillId: item.skillId || null,
        stat: item.stat || null,
        isEquipped: item.isEquipped || false
        }));
    
        playerRef.update({
        inventory: getSanitizedInventory()
    }); // Save the clean version

    // 7. Exit drop mode
    gameState.isDroppingItem = false;
}

function generateMagicItem(tier) {
    // 1. Pick a random base item (Weapons or Armor)
    const baseKeys = Object.keys(ITEM_DATA).filter(k => 
        ITEM_DATA[k].type === 'weapon' || ITEM_DATA[k].type === 'armor'
    );
    // Filter out legendary/unique items if desired, or keep them for crazy rolls
    const validBaseKeys = baseKeys.filter(k => !['Fists', 'Simple Tunic'].includes(ITEM_DATA[k].name));
    
    const baseKey = validBaseKeys[Math.floor(Math.random() * validBaseKeys.length)];
    const template = ITEM_DATA[baseKey];
    
    // Clone the item
    let newItem = {
        name: template.name,
        type: template.type,
        quantity: 1,
        tile: baseKey,
        damage: template.damage || 0,
        defense: template.defense || 0,
        slot: template.slot,
        statBonuses: template.statBonuses ? {...template.statBonuses} : {}
    };

    // 2. Roll for Prefix (50% chance + tier bonus)
    if (Math.random() < 0.5 + (tier * 0.1)) {
        const validPrefixes = Object.keys(LOOT_PREFIXES).filter(p => LOOT_PREFIXES[p].type === newItem.type);
        if (validPrefixes.length > 0) {
            // Pick based on tier (approximate logic: higher tier = better chance for good prefix)
            const prefixName = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            const prefixData = LOOT_PREFIXES[prefixName];
            
            newItem.name = `${prefixName} ${newItem.name}`;
            
            // Apply bonuses
            for (const stat in prefixData.bonus) {
                if (stat === 'damage') newItem.damage += prefixData.bonus[stat];
                else if (stat === 'defense') newItem.defense += prefixData.bonus[stat];
                else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + prefixData.bonus[stat];
            }
        }
    }

    // 3. Roll for Suffix (30% chance + tier bonus)
    if (Math.random() < 0.3 + (tier * 0.1)) {
        const suffixKeys = Object.keys(LOOT_SUFFIXES);
        const suffixName = suffixKeys[Math.floor(Math.random() * suffixKeys.length)];
        const suffixData = LOOT_SUFFIXES[suffixName];
        
        newItem.name = `${newItem.name} ${suffixName}`;
        
        // Apply bonuses
        for (const stat in suffixData.bonus) {
            if (stat === 'damage') newItem.damage += suffixData.bonus[stat];
            else if (stat === 'defense') newItem.defense += suffixData.bonus[stat];
            else newItem.statBonuses[stat] = (newItem.statBonuses[stat] || 0) + suffixData.bonus[stat];
        }
    }
    
    // 4. Scale base stats slightly by tier (The "+1 to +4" logic)
    // If it didn't get a prefix, force a small buff based on tier
    const tierBuff = Math.floor(Math.random() * tier) + 1;
    if (newItem.type === 'weapon') newItem.damage += tierBuff;
    if (newItem.type === 'armor') newItem.defense += tierBuff;
    
    // Ensure "Magic" status visually
    if (newItem.name === template.name) {
        newItem.name = `Reinforced ${newItem.name}`; // Fallback name
    }

    return newItem;
}

// --- WORLD MAP SYSTEM ---
const mapModal = document.getElementById('mapModal');
const worldMapCanvas = document.getElementById('worldMapCanvas');
const worldMapCtx = worldMapCanvas.getContext('2d');
const mapCoordsDisplay = document.getElementById('mapCoords');

// Settings
const MAP_SCALE = 4; 
const MAP_CHUNK_SIZE = 16; // Renamed to avoid conflicts, explicit constant

// Camera State
let mapCamera = { x: 0, y: 0 };
let isDraggingMap = false;
let lastMouseX = 0;
let lastMouseY = 0;

function openWorldMap() {
    mapModal.classList.remove('hidden');
    
    // 1. Center Camera on Player immediately
    mapCamera.x = gameState.player.x;
    mapCamera.y = gameState.player.y;

    // 2. Force Exploration of CURRENT tile immediately
    // This ensures you are never standing in a "void" when you open the map
    updateExploration(); 

    // 3. Resize Canvas to fill the modal window
    fitMapCanvasToContainer();

    // 4. Render
    renderWorldMap();
}

function closeWorldMap() {
    mapModal.classList.add('hidden');
}

function fitMapCanvasToContainer() {
    const container = worldMapCanvas.parentElement;
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        worldMapCanvas.width = container.clientWidth;
        worldMapCanvas.height = container.clientHeight;
    }
}

function updateExploration() {
    // Only track exploration in the Overworld
    if (gameState.mapMode !== 'overworld') return false;

    // Use consistent Math.floor for both positive and negative coordinates
    const chunkX = Math.floor(gameState.player.x / MAP_CHUNK_SIZE);
    const chunkY = Math.floor(gameState.player.y / MAP_CHUNK_SIZE);
    const chunkId = `${chunkX},${chunkY}`;

    // Ensure the Set exists
    if (!gameState.exploredChunks) gameState.exploredChunks = new Set();

    if (!gameState.exploredChunks.has(chunkId)) {
        console.log(`[Map] Discovered new chunk: ${chunkId}`); // Debug Log
        gameState.exploredChunks.add(chunkId);
        return true; // Return true to signal that we need to save
    }
    return false;
}

function renderWorldMap() {
    if (!gameState.player.exploredChunks) return;

    // 1. Clear Background (Black Void)
    worldMapCtx.fillStyle = '#000000';
    worldMapCtx.fillRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);

    // 2. Calculate Screen Center
    const centerX = Math.floor(worldMapCanvas.width / 2);
    const centerY = Math.floor(worldMapCanvas.height / 2);

    // 3. Iterate ONLY Explored Chunks
    gameState.exploredChunks.forEach(chunkId => {
        const [cx, cy] = chunkId.split(',').map(Number);
        
        if (isNaN(cx) || isNaN(cy)) return; // Safety check

        // Chunk's World Position (Top-Left of the chunk)
        const chunkWorldX = cx * MAP_CHUNK_SIZE;
        const chunkWorldY = cy * MAP_CHUNK_SIZE;

        // Calculate Screen Position for this chunk
        // Formula: (ChunkWorldPos - CameraPos) * Scale + CenterOffset
        const screenX = Math.floor((chunkWorldX - mapCamera.x) * MAP_SCALE + centerX);
        const screenY = Math.floor((chunkWorldY - mapCamera.y) * MAP_SCALE + centerY);

        // Optimization: Skip drawing if completely off-screen
        const chunkSizeOnScreen = MAP_CHUNK_SIZE * MAP_SCALE;
        if (screenX + chunkSizeOnScreen < 0 || screenX > worldMapCanvas.width ||
            screenY + chunkSizeOnScreen < 0 || screenY > worldMapCanvas.height) {
            return;
        }

        // Draw Tiles in Chunk
        for (let y = 0; y < MAP_CHUNK_SIZE; y++) {
            for (let x = 0; x < MAP_CHUNK_SIZE; x++) {
                const worldX = chunkWorldX + x;
                const worldY = chunkWorldY + y;

                const color = getBiomeColorForMap(worldX, worldY);
                
                // Draw pixel
                worldMapCtx.fillStyle = color;
                worldMapCtx.fillRect(
                    screenX + (x * MAP_SCALE), 
                    screenY + (y * MAP_SCALE), 
                    MAP_SCALE, 
                    MAP_SCALE
                );
            }
        }

        // Debug: Draw faint outline around chunk to verify alignment
        // worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        // worldMapCtx.lineWidth = 1;
        // worldMapCtx.strokeRect(screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);
    });

    // 4. Draw Player Marker
    // The player is always at 'mapCamera' coordinates + center offset
    // This assumes camera is locked to player unless dragged.
    const playerScreenX = (gameState.player.x - mapCamera.x) * MAP_SCALE + centerX;
    const playerScreenY = (gameState.player.y - mapCamera.y) * MAP_SCALE + centerY;

    // Draw Red Dot (with white border for visibility)
    worldMapCtx.fillStyle = '#ef4444';
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX, playerScreenY, 4, 0, Math.PI * 2);
    worldMapCtx.fill();
    worldMapCtx.strokeStyle = '#ffffff';
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();
    
    // 5. Update Coordinates Text
    mapCoordsDisplay.textContent = `Current Location: ${gameState.player.x}, ${-gameState.player.y}`;
}

// --- MAP CONTROLS (Panning) ---
worldMapCanvas.addEventListener('mousedown', (e) => {
    isDraggingMap = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    worldMapCanvas.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    isDraggingMap = false;
    worldMapCanvas.style.cursor = 'grab';
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingMap) return;
    
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    
    // Move camera opposite to drag
    mapCamera.x -= dx / MAP_SCALE;
    mapCamera.y -= dy / MAP_SCALE;
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    renderWorldMap();
});

// Helper
function getBiomeColorForMap(x, y) {
    const elev = elevationNoise.noise(x / 70, y / 70);
    const moist = moistureNoise.noise(x / 50, y / 50);

    if (elev < 0.35) return '#3b82f6'; // Water
    if (elev < 0.4 && moist > 0.7) return '#422006'; // Swamp
    if (elev > 0.8) return '#57534e'; // Mountain
    if (elev > 0.6 && moist < 0.3) return '#2d2d2d'; // Deadlands
    if (moist < 0.15) return '#fde047'; // Desert
    if (moist > 0.55) return '#14532d'; // Forest
    return '#22c55e'; // Plains
}

// Listeners
document.getElementById('closeMapButton').addEventListener('click', closeWorldMap);
window.addEventListener('resize', () => {
    if (!mapModal.classList.contains('hidden')) {
        fitMapCanvasToContainer();
        renderWorldMap();
    }
});

function updateExploration() {
    // Only track exploration in the Overworld
    if (gameState.mapMode !== 'overworld') return false;

    const chunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
    const chunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
    const chunkId = `${chunkX},${chunkY}`;

    if (!gameState.exploredChunks.has(chunkId)) {
        gameState.exploredChunks.add(chunkId);
        return true; // Return true to signal that we need to save
    }
    return false;
}

/**
 * Generates loot when an enemy is defeated.
 * Drops a mix of Junk, Gold, or Level-Scaled Loot.
 * @param {object} player - The player's full state object.
 * @param {object} enemy - The enemy data (from ENEMY_DATA or RTDB).
 * @returns {string} The tile character of the dropped item.
 */

function generateEnemyLoot(player, enemy) {
    // --- 1. Check for Active Fetch Quests ---
    const enemyTile = enemy.tile || Object.keys(ENEMY_DATA).find(k => ENEMY_DATA[k].name === enemy.name);
    for (const questId in player.quests) {
        const playerQuest = player.quests[questId];
        const questData = QUEST_DATA[questId];
        if (playerQuest.status === 'active' && questData.type === 'fetch' && questData.enemy === enemyTile) {
            const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
            if (!hasItem) {
                const dropChance = 0.05 + (player.luck * 0.005); 
                if (Math.random() < dropChance) {
                    logMessage(`The ${enemy.name} dropped a ${questData.itemNeeded}!`);
                    return questData.itemTile;
                }
            }
        }
    }

    // --- 2. Calculate Distance for Scaling ---
    const dist = Math.sqrt(player.x * player.x + player.y * player.y);

    // --- 3. Determine Drop Tables ---
    const JUNK_DROP_CHANCE = Math.max(0.05, 0.25 - (player.luck * 0.001));
    const GOLD_DROP_CHANCE = 0.50;

    const roll = Math.random();

    // Junk / Specific Loot
    if (roll < JUNK_DROP_CHANCE) { 
        // Specific overrides for flavor items not in ENEMY_DATA loot field
        if (enemy.tile === 'l' || enemy.name === 'Giant Leech') return '🐟'; 
        if (enemy.tile === '🐗' || enemy.name === 'Wild Boar') return '🍖'; 
        
        // Otherwise return the default loot defined in ENEMY_DATA (Rat Tails, etc.)
        return enemy.loot || '$';
    }

    // Gold
    if (roll < JUNK_DROP_CHANCE + GOLD_DROP_CHANCE) { 
        return '$'; 
    }

    // --- 4. Magic Item Chance  ---
    // Higher tier zones have higher chance of magic drops
    let magicChance = 0.01; // 1% Base
    if (dist > 500) magicChance = 0.10; // 10% in endgame
    else if (dist > 250) magicChance = 0.05; // 5% in midgame
    
    // Luck Bonus (0.5% per luck point)
    magicChance += (player.luck * 0.005);

    if (enemy.isElite) {
        magicChance += 0.15; // +15% chance for Magic Item from Elites!
        logMessage(`The ${enemy.name} leaves behind a powerful essence...`);
    }

    if (Math.random() < magicChance) {
        return '✨'; // Drop Unidentified Magic Item!
    }

    // --- 5. Standard Equipment Drops ---
    const scaledRoll = Math.random();
    
    // Define Tiers
    const commonLoot = ['+', 'o', 'S', 'Y', '🐀', '🦇', '🦷', '🧣']; 
    
    // Tier 1: Starter Gear (Club, Staff, Bow, Padded, Robes)
    const tier1Loot = ['/', '%', '🏏', '🦯', '🏹', '👕', '👘']; 
    
    // Tier 2: Basic Iron/Leather
    const tier2Loot = ['!', '[', '📚', '🛡️', '🛡️w']; 
    
    // Tier 3: Steel/Chain/Magic
    const tier3Loot = ['=', 'A', 'Ψ', 'M', '⚔️l', '⛓️', '🛡️i']; 
    
    // Tier 4: Heavy/Plate
    const tier4Loot = ['🪓', '🔨', '🛡️p']; 

    // Base Chance for "Good Loot"
    let tier1Chance = 0.30;
    let tier2Chance = 0.0;
    let tier3Chance = 0.0;
    let tier4Chance = 0.0;

    // Adjust chances based on distance
    if (dist > 500) { // Endgame Zone
        tier1Chance = 0.0;
        tier2Chance = 0.20;
        tier3Chance = 0.50;
        tier4Chance = 0.30;
    } else if (dist > 250) { // Midgame Zone
        tier1Chance = 0.10;
        tier2Chance = 0.40;
        tier3Chance = 0.30;
        tier4Chance = 0.05;
    } else if (dist > 100) { // Adventure Zone
        tier1Chance = 0.30;
        tier2Chance = 0.30;
        tier3Chance = 0.05;
        tier4Chance = 0.0;
    }

    // Roll for Loot
    if (scaledRoll < tier4Chance) return tier4Loot[Math.floor(Math.random() * tier4Loot.length)];
    if (scaledRoll < tier4Chance + tier3Chance) return tier3Loot[Math.floor(Math.random() * tier3Loot.length)];
    if (scaledRoll < tier4Chance + tier3Chance + tier2Chance) return tier2Loot[Math.floor(Math.random() * tier2Loot.length)];
    if (scaledRoll < tier4Chance + tier3Chance + tier2Chance + tier1Chance) return tier1Loot[Math.floor(Math.random() * tier1Loot.length)];

    return commonLoot[Math.floor(Math.random() * commonLoot.length)];
}

/**
 * Adds or subtracts an item's stat bonuses from the player.
 * @param {object} item - The item object (from equipment).
 * @param {number} operation - 1 to add, -1 to subtract.
 */
function applyStatBonuses(item, operation) {
    if (!item || !item.statBonuses) {
        return; // Item has no bonuses, do nothing
    }

    const player = gameState.player;

    for (const stat in item.statBonuses) {
        if (player.hasOwnProperty(stat)) {
            let amount = item.statBonuses[stat];

            // --- BATTLEMAGE: ARCANE STEEL ---
            // If the item reduces Dexterity (Heavy Armor), and we are a Battlemage, ignore it.
            if (stat === 'dexterity' && amount < 0 && player.talents && player.talents.includes('arcane_steel')) {
                if (operation === 1) logMessage("Arcane Steel negates the armor's weight.");
                continue; 
            }

            player[stat] += (amount * operation);

            // (Keep your existing log/flash logic here)
            if (operation === 1) {
                logMessage(`You feel ${stat} increase! (+${amount})`);
                triggerStatFlash(statDisplays[stat], true);
            } else {
                triggerStatFlash(statDisplays[stat], false);
            }
        }
    }
    // We don't need to renderStats() here, the equip logic will do it.
}

function grantXp(amount) {
    const player = gameState.player;
    
    // --- TALENT: SCHOLAR (+20% XP) ---
    if (player.talents && player.talents.includes('scholar')) {
        amount = Math.floor(amount * 1.2);
    }
    // ---------------------------------

    player.xp += amount;
    logMessage(`You gained ${amount} XP!`);
    triggerStatFlash(statDisplays.xp, true); 

    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.statPoints++;
        player.xpToNextLevel = player.level * 100;

        logMessage(`LEVEL UP! You are now level ${player.level}!`);
        ParticleSystem.createLevelUp(player.x, player.y);

        if (player.level === 10 && !player.classEvolved) {
            openEvolutionModal();
        }
        
        // --- Award Talent Point every 3 levels ---
        if (player.level % 3 === 0) {
            player.talentPoints = (player.talentPoints || 0) + 1;
            logMessage("You gained a Mastery Talent Point! Press 'P' to spend it.");
            triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
        } else {
            logMessage(`You gained 1 Stat Point.`);
            triggerStatAnimation(statDisplays.level, 'stat-pulse-blue');
        }

    }

    playerRef.update({
        xp: player.xp,
        level: player.level,
        xpToNextLevel: player.xpToNextLevel,
        statPoints: player.statPoints,
        talentPoints: player.talentPoints || 0
    });

    renderStats();
}

function handleBuyItem(itemName) {
    const player = gameState.player;
    const shopItem = activeShopInventory.find(item => item.name === itemName);
    const itemTemplate = ITEM_DATA[Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName)];

    if (!shopItem || !itemTemplate) {
        logMessage("Error: Item not found in shop.");
        return;
    }

    // --- NEW CHARISMA LOGIC ---
    const basePrice = shopItem.price;
    // 0.5% discount per point of Charisma
    const discountPercent = player.charisma * 0.005; 
    // Cap the discount at 50% (at 100 Charisma)
    const finalDiscount = Math.min(discountPercent, 0.5); 
    const finalBuyPrice = Math.floor(basePrice * (1.0 - finalDiscount));
    // --- END NEW LOGIC ---


    // 1. Check if player has enough gold
    if (player.coins < finalBuyPrice) { // <-- Use new variable
        logMessage("You don't have enough gold for that.");
        return;
    }

    if (shopItem.stock <= 0) {
        logMessage("The shop is out of stock!");
        return;
    }

    // 2. Check if player has inventory space
    const existingStack = player.inventory.find(item => item.name === itemName);
    if (!existingStack && player.inventory.length >= MAX_INVENTORY_SLOTS) {
        logMessage("Your inventory is full!");
        return;
    }

    // 3. Process the transaction
    player.coins -= finalBuyPrice;
    shopItem.stock--;
    logMessage(`You bought a ${itemName} for ${finalBuyPrice} gold.`); // <-- Use new variable

    if (existingStack) {
        existingStack.quantity++;
    } else {

        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName);

        player.inventory.push({
            
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: 1,
            tile: itemKey || '?'
        });
    }

    // 4. Update database and UI
    playerRef.update({
        coins: player.coins,
        inventory: player.inventory
    });

    playerRef.update({
        coins: player.coins,
        inventory: getSanitizedInventory()
    });

    renderShop(); // Re-render the shop to show new gold and inventory
    renderInventory(); // Update the main UI inventory
    renderStats(); // Update the main UI gold display
}

function getRegionalPriceMultiplier(itemType, itemName) {
    let multiplier = 1.0;
    
    // Get current biome info
    const isDungeon = gameState.mapMode === 'dungeon';
    const isCastle = gameState.mapMode === 'castle';
    
    // Default Overworld check
    let biome = 'Plains';
    if (!isDungeon && !isCastle) {
        const elev = elevationNoise.noise(gameState.player.x / 70, gameState.player.y / 70);
        const moist = moistureNoise.noise(gameState.player.x / 50, gameState.player.y / 50);
        if (elev < 0.35) biome = 'Water';
        else if (elev < 0.4 && moist > 0.7) biome = 'Swamp';
        else if (elev > 0.8) biome = 'Mountain';
        else if (elev > 0.6 && moist < 0.3) biome = 'Deadlands';
        else if (moist < 0.15) biome = 'Desert';
        else if (moist > 0.55) biome = 'Forest';
    }

    // --- SUPPLY & DEMAND LOGIC ---

    // 1. DESERT: Pays huge for Water/Food/Herbs. Hates Sand/Cactus.
    if (biome === 'Desert') {
        if (itemName === 'Cactus Fruit') multiplier = 0.5; // Supply is high
        if (itemName === 'Wildberry' || itemName === 'Healing Potion') multiplier = 2.0; // Demand is high
        if (itemName === 'Obsidian Shard') multiplier = 1.5;
    }

    // 2. MOUNTAIN: Pays for Wood/Food. Hates Ore/Stone.
    if (biome === 'Mountain' || (isDungeon && gameState.currentCaveTheme === 'ROCK')) {
        if (itemName === 'Iron Ore' || itemName === 'Stone') multiplier = 0.5;
        if (itemName === 'Stick' || itemName === 'Machete') multiplier = 1.5;
    }

    // 3. FOREST/SWAMP: Pays for Metal/Tech. Hates Wood/Herbs.
    if (biome === 'Forest' || biome === 'Swamp') {
        if (itemName === 'Medicinal Herb' || itemName === 'Stick') multiplier = 0.5;
        if (itemName === 'Iron Ore' || itemName === 'Steel Sword') multiplier = 1.3;
    }

    // 4. CASTLES: Pay extra for Luxury/Relics.
    if (isCastle) {
        if (itemType === 'junk' || itemType === 'quest') multiplier = 1.2; // Art/History
        if (itemName === 'Shattered Crown' || itemName === 'Signet Ring') multiplier = 1.5;
    }

    return multiplier;
}

function handleSellItem(itemIndex) {
    const player = gameState.player;
    const itemToSell = player.inventory[itemIndex];

    if (itemToSell.isEquipped) {
        logMessage("You cannot sell an item you are wearing!");
        return;
    }

    if (!itemToSell) {
        logMessage("Error: Item not in inventory.");
        return;
    }

    // Find the item's base price in the shop.
    const shopItem = activeShopInventory.find(item => item.name === itemToSell.name);
    
    let basePrice = 2; // Default
    if (shopItem) {
        basePrice = shopItem.price;
    } else {
        // --- SPECIAL PRICES FOR RELICS ---
        if (itemToSell.name === 'Shattered Crown') basePrice = 200;
        if (itemToSell.name === 'Signet Ring') basePrice = 80;
        if (itemToSell.name === 'Pouch of Gold Dust') basePrice = 50;
        if (itemToSell.name === 'Ancient Coin') basePrice = 25;
        if (itemToSell.name === 'Alpha Pelt') basePrice = 60;
    }

    const regionMult = getRegionalPriceMultiplier(itemToSell.type, itemToSell.name);
    
    const sellBonusPercent = player.charisma * 0.005;
    const finalSellBonus = Math.min(sellBonusPercent, 0.5);
    
    // --- BUG FIX: ECONOMY CAP ---
    // Calculate raw sell price
    let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);
    
    // Cap the sell price at 80% of the base price to prevent infinite money loops
    // (e.g. buying for 90g and selling for 100g)
    const maxSellPrice = Math.floor(basePrice * 0.8);
    
    // If the item is a rare relic (not sold in shops), we don't need to cap it strictly
    // strictly against a shop price, but for general goods, we apply the cap.
    const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;
    // ----------------------------
    
    // Log the bonus if it's significant
    if (regionMult > 1.0) logMessage(`Market demand is high here! (x${regionMult})`);
    else if (regionMult < 1.0) logMessage(`Market flooded. Low demand. (x${regionMult})`);

    // 1. Process the transaction
    player.coins += sellPrice;
    logMessage(`You sold a ${itemToSell.name} for ${sellPrice} gold.`);

    // 2. Remove one from the stack
    itemToSell.quantity--;
    if (itemToSell.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // 3. Update database and UI
    playerRef.update({
        coins: player.coins,
        inventory: getSanitizedInventory() 
    });

    renderShop();
    renderInventory();
    renderStats();
}

function resizeCanvas() {
    // Get the container element that holds the canvas
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return; 

    const containerWidth = canvasContainer.clientWidth;
    
    // --- ADAPTIVE ZOOM FIX ---
    // Instead of stretching tiles, we calculate how many tiles fit in the width
    // We keep TILE_SIZE fixed at 20px (or whatever you prefer)
    TILE_SIZE = 20; 
    
    // Calculate new viewport width based on container size
    VIEWPORT_WIDTH = Math.floor(containerWidth / TILE_SIZE);
    
    // Optional: Adjust height to fit standard aspect ratio or fill container
    // For now, let's keep height somewhat static or slightly larger
    VIEWPORT_HEIGHT = 30; 

    // Update the canvas resolution
    canvas.width = VIEWPORT_WIDTH * TILE_SIZE;
    canvas.height = VIEWPORT_HEIGHT * TILE_SIZE;

    // Update the font
    ctx.font = `${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Re-render immediately
    render();
}

function renderShop() {
    // 1. Clear old lists
    shopBuyList.innerHTML = '';
    shopSellList.innerHTML = '';

    // 2. Update player's gold
    shopPlayerCoins.textContent = `Your Gold: ${gameState.player.coins}`;

    // 3. Populate "Buy" list
    activeShopInventory.forEach(item => {
        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === item.name);
        
        const baseBuyPrice = item.price;
        const discountPercent = gameState.player.charisma * 0.005;
        const finalDiscount = Math.min(discountPercent, 0.5);
        const finalBuyPrice = Math.floor(baseBuyPrice * (1.0 - finalDiscount));

        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <div>
                <span class="shop-item-name">${item.name} (${itemKey || '?'})</span>
                <span class="shop-item-details">Price: ${finalBuyPrice}g</span>
            </div>
              <div class="shop-item-actions">
            <button data-buy-item="${item.name}">Buy 1</button> 
        </div>
    `;
        if (gameState.player.coins < finalBuyPrice) {
            li.querySelector('button').disabled = true;
        }
        shopBuyList.appendChild(li);
    });

    // 4. Populate "Sell" list
    if (gameState.player.inventory.length === 0) {
        shopSellList.innerHTML = '<li class="shop-item-details italic">Your inventory is empty.</li>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const shopItem = activeShopInventory.find(sItem => sItem.name === item.name);
            
            // 1. Determine Base Price
            let basePrice = 2; // Default
            if (shopItem) {
                basePrice = shopItem.price;
            } else {
                // Relic Prices (Must match handleSellItem logic!)
                if (item.name === 'Shattered Crown') basePrice = 200;
                else if (item.name === 'Signet Ring') basePrice = 80;
                else if (item.name === 'Pouch of Gold Dust') basePrice = 50;
                else if (item.name === 'Ancient Coin') basePrice = 25;
                else if (item.name === 'Alpha Pelt') basePrice = 60;
            }

            // 2. Calculate Bonuses
            const regionMult = getRegionalPriceMultiplier(item.type, item.name);
            const sellBonusPercent = gameState.player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.5);
            let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

            // 3. Apply the 80% Cap (Visual Fix)
            const maxSellPrice = Math.floor(basePrice * 0.8);
            const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;

            const li = document.createElement('li');
            li.className = 'shop-item';
            li.innerHTML = `
                <div>
                    <span class="shop-item-name">${item.name} (x${item.quantity})</span>
                    <span class="shop-item-details">Sell for: ${sellPrice}g</span>
                </div>
                <div class="shop-item-actions">
                    <button data-sell-index="${index}">Sell 1</button>
                </div>
            `;
            shopSellList.appendChild(li);
        });
    }
}

function initMobileControls() {
    const mobileContainer = document.getElementById('mobileControls');
    if (!mobileContainer) return; // Safety check
    
    // Show controls when entering game
    mobileContainer.classList.remove('hidden');
    
    // --- FIX START: Force show on larger mobile screens ---
    // This removes the Tailwind class that hides it on large screens
    mobileContainer.classList.remove('lg:hidden'); 
    // --- FIX END ---

    // Remove old listeners to prevent duplicates (Standard practice)
    const newContainer = mobileContainer.cloneNode(true);
    mobileContainer.parentNode.replaceChild(newContainer, mobileContainer);
    
    // Attach Generic Listener
    newContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        
        // Prevent double-tap zoom behavior
        e.preventDefault();
        
        if (btn && btn.dataset.key) {
            e.stopPropagation(); 
            handleInput(btn.dataset.key); 
        }
    });
    
    // Prevent double-tap zoom on the buttons specifically
    newContainer.addEventListener('dblclick', (e) => {
        e.preventDefault();
    });
}

const stashModal = document.getElementById('stashModal');
const closeStashButton = document.getElementById('closeStashButton');
const stashPlayerList = document.getElementById('stashPlayerList');
const stashBankList = document.getElementById('stashBankList');

function openStashModal() {
    renderStash();
    stashModal.classList.remove('hidden');
}

function renderStash() {
    stashPlayerList.innerHTML = '';
    stashBankList.innerHTML = '';
    
    // Render Player Inventory (Deposit)
    gameState.player.inventory.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <button class="text-xs bg-green-600 text-white px-2 py-1 rounded" onclick="handleStashTransfer('deposit', ${index})">Deposit</button>
        `;
        stashPlayerList.appendChild(li);
    });

    // Render Bank (Withdraw)
    const bank = gameState.player.bank || [];
    if (bank.length === 0) {
        stashBankList.innerHTML = '<li class="italic text-sm text-gray-500">Stash is empty.</li>';
    } else {
        bank.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'shop-item';
            li.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded" onclick="handleStashTransfer('withdraw', ${index})">Withdraw</button>
            `;
            stashBankList.appendChild(li);
        });
    }
}

window.handleStashTransfer = function(action, index) {
    const player = gameState.player;
    if (!player.bank) player.bank = [];

    if (action === 'deposit') {
        const item = player.inventory[index];
        // Check if item exists in bank
        const bankItem = player.bank.find(i => i.name === item.name);
        if (bankItem) {
            bankItem.quantity += item.quantity;
        } else {
            player.bank.push(JSON.parse(JSON.stringify(item))); // Deep copy
        }
        player.inventory.splice(index, 1);
        logMessage(`Deposited ${item.name}.`);
    } 
    else if (action === 'withdraw') {
        const item = player.bank[index];
        if (player.inventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("Your inventory is full!");
            return;
        }
        // Check if item exists in inventory
        const invItem = player.inventory.find(i => i.name === item.name);
        if (invItem) {
            invItem.quantity += item.quantity;
        } else {
            player.inventory.push(JSON.parse(JSON.stringify(item)));
        }
        player.bank.splice(index, 1);
        logMessage(`Withdrew ${item.name}.`);
    }

    // Save and Render
    playerRef.update({ inventory: player.inventory, bank: player.bank });
    renderStash();
    renderInventory();
};

closeStashButton.addEventListener('click', () => stashModal.classList.add('hidden'));

function initShopListeners() {
    // Close button
    closeShopButton.addEventListener('click', () => {
        shopModal.classList.add('hidden');
    });

    // Handle clicks inside the "Buy" list
    shopBuyList.addEventListener('click', (e) => {
        if (e.target.dataset.buyItem) {
            handleBuyItem(e.target.dataset.buyItem);
        }
    });

    // Handle clicks inside the "Sell" list
    shopSellList.addEventListener('click', (e) => {
        if (e.target.dataset.sellIndex) {
            handleSellItem(parseInt(e.target.dataset.sellIndex, 10));
        }
    });
}

function initSpellbookListeners() {
    closeSpellButton.addEventListener('click', () => {
        spellModal.classList.add('hidden');
    });

    spellList.addEventListener('click', (e) => {
        const spellItem = e.target.closest('.spell-item');
        if (spellItem && spellItem.dataset.spell) {
            castSpell(spellItem.dataset.spell);
        }
    });
}

const hotbarContainer = document.getElementById('hotbarContainer');

function renderHotbar() {
    hotbarContainer.innerHTML = '';
    const hotbar = gameState.player.hotbar;
    const cooldowns = gameState.player.cooldowns || {};

    hotbar.forEach((abilityId, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = "relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer bg-[var(--bg-page)] hover:border-blue-500 transition-all";
        
        // Add keyboard number hint
        const keyHint = document.createElement('span');
        keyHint.className = "absolute top-0 left-1 text-[10px] font-bold text-[var(--text-muted)]";
        keyHint.textContent = index + 1;
        slotDiv.appendChild(keyHint);

        if (abilityId) {
            // Determine if it's a Skill or Spell for data lookup
            const data = SKILL_DATA[abilityId] || SPELL_DATA[abilityId];
            if (data) {
                // Show Icon/Name abbreviation
                const label = document.createElement('span');
                label.className = "font-bold text-sm";
                label.textContent = data.name.substring(0, 2).toUpperCase(); // First 2 letters
                slotDiv.title = `${data.name} (Cost: ${data.cost} ${data.costType})`;
                slotDiv.appendChild(label);

                // Cooldown Overlay
                if (cooldowns[abilityId] > 0) {
                    slotDiv.classList.add('opacity-50', 'cursor-not-allowed');
                    const cdOverlay = document.createElement('div');
                    cdOverlay.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-bold";
                    cdOverlay.textContent = cooldowns[abilityId];
                    slotDiv.appendChild(cdOverlay);
                }
            }
        } else {
            slotDiv.classList.add('border-dashed', 'opacity-50');
        }

        // Click to clear slot (Right click logic could go here later)
        slotDiv.onclick = () => {
            if (gameState.inventoryMode) return; // Don't trigger during inventory
            useHotbarSlot(index);
        };

        hotbarContainer.appendChild(slotDiv);
    });
}

/**
 * Sets the cooldown for a skill or spell and updates the DB/UI.
 */
function triggerAbilityCooldown(abilityId) {
    const data = SKILL_DATA[abilityId] || SPELL_DATA[abilityId];
    
    if (data && data.cooldown) {
        // Initialize object if it doesn't exist
        if (!gameState.player.cooldowns) gameState.player.cooldowns = {};
        
        // Set the turns
        gameState.player.cooldowns[abilityId] = data.cooldown;
        
        // Update Database
        playerRef.update({ cooldowns: gameState.player.cooldowns });
        
        // Update UI (Safeguard in case you haven't added the Hotbar UI yet)
        if (typeof renderHotbar === 'function') renderHotbar();
    }
}

function useHotbarSlot(index) {
    const abilityId = gameState.player.hotbar[index];
    if (!abilityId) return;

    const cooldowns = gameState.player.cooldowns || {};
    if (cooldowns[abilityId] > 0) {
        logMessage("That ability is on cooldown!");
        return;
    }

    if (SKILL_DATA[abilityId]) {
        useSkill(abilityId);
    } else if (SPELL_DATA[abilityId]) {
        castSpell(abilityId);
    }
}

function assignToHotbar(abilityId) {
    // Find first empty slot
    const hotbar = gameState.player.hotbar;
    let index = hotbar.indexOf(null);
    
    if (index === -1) {
        // Full? Replace slot 1 or just notify
        index = 0; 
        logMessage(`Hotbar full. Replaced Slot 1 with ${abilityId}.`);
    } else {
        logMessage(`Assigned ${abilityId} to Hotbar Slot ${index + 1}.`);
    }

    hotbar[index] = abilityId;
    playerRef.update({ hotbar: hotbar });
    renderHotbar();
}

function openInventoryModal() {
    if (gameState.player.inventory.length === 0) {
        logMessage("Your inventory is empty.");
        return;
    }
    renderInventory(); // Re-render inventory just before showing
    inventoryModal.classList.remove('hidden');
    gameState.inventoryMode = true; // Enter inventory mode
}

function closeInventoryModal() {
    inventoryModal.classList.add('hidden');
    gameState.inventoryMode = false; // Exit inventory mode
}

function initInventoryListeners() {
    // 1. Re-select the button to ensure we have the element
    const btn = document.getElementById('closeInventoryButton');
    
    if (btn) {
        // 2. Use 'onclick' which is a hard override (more reliable here)
        btn.onclick = (e) => {
            e.preventDefault();  // Stop any default browser behavior
            e.stopPropagation(); // Stop the click from bubbling to other elements
            closeInventoryModal();
        };
    } else {
        console.error("Error: closeInventoryButton not found in DOM.");
    }
}

/**
 * Opens the skillbook modal.
 * Dynamically renders the list of skills the player knows
 * based on their skillbook and the SKILL_DATA.
 */
function openSkillbook() {
    skillList.innerHTML = ''; // Clear the list
    const player = gameState.player;
    const playerSkills = player.skillbook || {};

    // Check if the skillbook is empty
    if (Object.keys(playerSkills).length === 0) {
        skillList.innerHTML = '<li class="spell-item-details italic p-4">You have not learned any skills.</li>';
        skillModal.classList.remove('hidden');
        return;
    }

    // Loop through every skill the player knows
    for (const skillId in playerSkills) {
        const skillLevel = playerSkills[skillId];
        const skillData = SKILL_DATA[skillId]; // Get data from our new constant

        if (!skillData) {
            console.warn(`Player has unknown skill in skillbook: ${skillId}`);
            continue;
        }

        let canUse = false;
        let costString = `${skillData.cost} ${skillData.costType}`;
        let costColorClass = ""; // CSS class for cost, e.g., text-red-500

        // Check if the player has enough resources to use
        if (skillData.costType === 'stamina') {
            canUse = player.stamina >= skillData.cost;
            if (!canUse) costColorClass = "text-red-500";
        }
        // (We can add other cost types here later, like 'health')

        // Build the new list item element
        const li = document.createElement('li');
        li.className = 'skill-item'; // Use 'skill-item'
        li.dataset.skill = skillId; // Use the skill's ID (e.g., "brace")
        
        // Make the item look disabled if it can't be used
        if (!canUse) {
            li.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Set the dynamic HTML for the skill
        li.innerHTML = `
            <div>
                <span class="skill-item-name">${skillData.name} (Lvl ${skillLevel})</span>
                <span class="spell-item-details">${skillData.description}</span>
            </div>
            <div class="flex flex-col items-end">
                <span class="font-bold ${costColorClass}">${costString}</span>
                <button class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded mt-1" 
                    onclick="assignToHotbar('${skillId}'); event.stopPropagation();">
                    Assign
                </button>
            </div>
        `;
        
        skillList.appendChild(li);
    }

    skillModal.classList.remove('hidden'); // Show the modal
}

/**
 * Handles all skill logic based on SKILL_DATA
 * and the player's skillbook.
 * @param {string} skillId - The ID of the skill to use (e.g., "brace").
 */

function useSkill(skillId) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId]; // Get data from our new constant
    
    if (!skillData) {
        logMessage("Unknown skill. (No skill data found)");
        return;
    }

    if (player.cooldowns && player.cooldowns[skillId] > 0) {
        logMessage(`That skill is not ready yet (${player.cooldowns[skillId]} turns).`);
        return;
    }

    const skillLevel = player.skillbook[skillId] || 0; // Get the player's level for this skill

    if (skillLevel === 0) {
        logMessage("You don't know that skill.");
        return;
    }

    // --- 1. Check Player Level Requirement ---
    if (player.level < skillData.requiredLevel) {
        logMessage(`You must be Level ${skillData.requiredLevel} to use this skill.`);
        return;
    }

    // --- 2. Check Resource Cost ---
    const cost = skillData.cost;
    const costType = skillData.costType; // 'stamina'

    if (player[costType] < cost) {
        logMessage(`You don't have enough ${costType} to use that.`);
        return; // Do not close modal, do not end turn
    }

    // --- 3. Handle Targeting ---
    if (skillData.target === 'aimed') {
        // --- Aimed Skills (e.g., Lunge) ---
        // Cost is checked, but *not* deducted. executeLunge will deduct it.
        gameState.isAiming = true;
        gameState.abilityToAim = skillId; // Store the skillId (e.g., "lunge")
        skillModal.classList.add('hidden');
        logMessage(`${skillData.name}: Press an arrow key or WASD to use. (Esc) to cancel.`);
        return; // We don't end the turn until they fire

    } else if (skillData.target === 'self') {
        // --- Self-Cast Skills (e.g., Brace) ---
        // Cast immediately.
        player[costType] -= cost; // Deduct the resource cost
        let skillUsedSuccessfully = false;

        // --- 4. Execute Skill Effect ---
        switch (skillId) {
            case 'brace':
                if (player.defenseBonusTurns > 0) {
                    logMessage("You are already bracing!");
                    break; 
                }
                // Formula: defense = base + (Constitution * 0.5 * level)
                const defenseBonus = Math.floor(skillData.baseDefense + (player.constitution * 0.5 * skillLevel));
                player.defenseBonus = defenseBonus;
                player.defenseBonusTurns = skillData.duration;

                logMessage(`You brace for impact, gaining +${defenseBonus} Defense!`);
                
                playerRef.update({ 
                    defenseBonus: player.defenseBonus,
                    defenseBonusTurns: player.defenseBonusTurns
                });
                skillUsedSuccessfully = true;
                break;

            // --- NEW SKILL: STEALTH ---
            case 'stealth':
                player.stealthTurns = skillData.duration;
                logMessage("You fade into the shadows... (Invisible)");
                playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;

            // --- NEW SKILL: WHIRLWIND ---
            case 'whirlwind':
                logMessage("You spin in a deadly vortex!");
                let hitCount = 0;
                // Stronger scaling: Str + Dex
                const baseDmg = (player.strength + player.dexterity) * skillLevel; 
                
                // Attack all adjacent tiles (-1 to 1)
                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue; // Skip self
                        const tx = player.x + x;
                        const ty = player.y + y;
                        
                        // Check for instanced enemies
                        let enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
                        if (enemy) {
                            enemy.health -= baseDmg;
                            logMessage(`Whirlwind hits ${enemy.name} for ${baseDmg}!`);
                            hitCount++;
                            
                            if (enemy.health <= 0) {
                                logMessage(`${enemy.name} is slain!`);
                               
                                registerKill(enemy);
                                
                                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                                // Note: Not generating loot for AoE to keep it simple, or add it if you want
                            }
                        }
                    }
                }
                if (hitCount === 0) logMessage("You whirl through empty air.");
                skillUsedSuccessfully = true;
                break;
        }

        // --- 5. Finalize Self-Cast Turn ---
        if (skillUsedSuccessfully) {
            playerRef.update({ [costType]: player[costType] }); // Save the new stamina
            triggerStatFlash(statDisplays.stamina, false); // Flash stamina for cost
            skillModal.classList.add('hidden');
            triggerAbilityCooldown(skillId);
            endPlayerTurn();
            renderEquipment(); // Update UI to show buff
        }
    }
}

async function runCompanionTurn() {
    const companion = gameState.player.companion;
    if (!companion) return;

    // Check adjacent tiles for enemies
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let attacked = false;

    for (const [dx, dy] of dirs) {
        if (attacked) break;
        const tx = companion.x + dx;
        const ty = companion.y + dy;

        // --- INSTANCED COMBAT (Dungeons/Castles) ---
        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            const enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
            if (enemy) {
                const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                enemy.health -= dmg;
                logMessage(`Your ${companion.name} attacks ${enemy.name} for ${dmg} damage!`);
                attacked = true;

                if (enemy.health <= 0) {
                    logMessage(`Your companion killed the ${enemy.name}!`);
                    grantXp(Math.floor(enemy.xp / 2)); // Half XP for pet kills
                    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                }
            }
        }
        // --- OVERWORLD COMBAT (Shared) ---
        else if (gameState.mapMode === 'overworld') {
            const tile = chunkManager.getTile(tx, ty);
            const enemyData = ENEMY_DATA[tile];
            
            if (enemyData) {
                attacked = true;
                const enemyId = `overworld:${tx},${-ty}`;
                const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);
                
                // --- BUG FIX: Custom Transaction for Companion ---
                // We do NOT use handleOverworldCombat here to avoid player taking damage
                try {
                    await enemyRef.transaction(currentData => {
                        let enemy = currentData;
                        
                        // If enemy doesn't exist in DB yet (fresh spawn), we create it momentarily to hit it
                        if (enemy === null) {
                             const scaledStats = getScaledEnemy(enemyData, tx, ty);
                             enemy = { ...scaledStats, tile: tile };
                        }

                        // Apply Companion Damage
                        const dmg = Math.max(1, companion.attack - (enemy.defense || 0));
                        enemy.health -= dmg;

                        // If dead, return null to delete
                        if (enemy.health <= 0) return null;
                        
                        return enemy;
                    }, (error, committed, snapshot) => {
                        if (committed) {
                            if (!snapshot.exists()) {
                                // Enemy died
                                logMessage(`Your ${companion.name} vanquished the ${enemyData.name}!`);
                                grantXp(Math.floor(enemyData.xp / 2));
                                // Visual cleanup handled by listener, but we can update local chunk tile
                                chunkManager.setWorldTile(tx, ty, '.'); // Clear enemy tile locally
                            } else {
                                // Enemy survived
                                logMessage(`Your ${companion.name} hits the ${enemyData.name}!`);
                            }
                        }
                    });
                } catch (err) {
                    console.error("Companion combat error:", err);
                }
            }
        }
    }
}

async function executeLunge(dirX, dirY) {
    const player = gameState.player;
    const skillId = "lunge"; // This function is only for Lunge
    const skillData = SKILL_DATA[skillId];
    const skillLevel = player.skillbook[skillId] || 1;

    // --- 1. Deduct Cost ---
    // Cost was checked in useSkill, but we deduct it here upon firing.
    player.stamina -= skillData.cost; 
    let hit = false;
    
    // --- 2. Calculate Base Damage ---

    const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
    const playerStrength = player.strength + (player.strengthBonus || 0);
    
    let rawPower = playerStrength + weaponDamage;

    // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
    rawPower = getPlayerDamageModifier(rawPower); 
    // -------------------------------------------

    const playerBaseDamage = rawPower;

    // Loop 2 and 3 tiles away
    for (let i = 2; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        // ... (rest of the tile-checking logic is the same) ...
        let tile;
        if (gameState.mapMode === 'dungeon') {
            const map = chunkManager.caveMaps[gameState.currentCaveId];
            tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        } else if (gameState.mapMode === 'castle') {
            const map = chunkManager.castleMaps[gameState.currentCastleId];
            tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        } else {
            tile = chunkManager.getTile(targetX, targetY);
        }

        const enemyData = ENEMY_DATA[tile];

        if (enemyData) {

            // Found a target!

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You strike from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }

            logMessage(`You lunge and attack the ${enemyData.name}!`);
            hit = true;

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You strike from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }
            
            // --- 3. Calculate Final Damage ---
            // Formula: ( (PlayerBaseDmg - EnemyDef) * Multiplier ) + (Strength * Level)
            const baseLungeDamage = (playerBaseDamage - (enemyData.defense || 0)) * skillData.baseDamageMultiplier;
            const scalingDamage = (player.strength * skillLevel);
            const totalLungeDamage = Math.max(1, Math.floor(baseLungeDamage + scalingDamage));
            // --- End Damage Calc ---

            if (gameState.mapMode === 'overworld') {
                // Handle Overworld Combat
                // We now pass our calculated skill damage!
                await handleOverworldCombat(targetX, targetY, enemyData, tile, totalLungeDamage);

            } else {
                // Handle Instanced Combat
                let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
                if (enemy) {
                    // We apply our new calculated damage!
                    enemy.health -= totalLungeDamage; 
                    logMessage(`You hit the ${enemy.name} for ${totalLungeDamage} damage!`);

                    if (enemy.health <= 0) {
                        logMessage(`You defeated the ${enemy.name}!`);
                        
                        registerKill(enemy);

                        const droppedLoot = generateEnemyLoot(player, enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                        
                        if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                        }

                        if (gameState.mapMode === 'dungeon') {
                            chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = droppedLoot;
                        }
                    }
                }
            }
            break; // Stop looping, we hit our target
        }
    }

    if (!hit) {
        logMessage("You lunge... and hit nothing.");
    }

    // --- 4. Finalize Turn ---
    playerRef.update({
        stamina: player.stamina
    });
    triggerStatFlash(statDisplays.stamina, false); // Flash stamina for cost
    triggerAbilityCooldown('lunge');
    endPlayerTurn(); // Always end turn, even if you miss
    render(); // Re-render to show enemy health change
}

const evolutionModal = document.getElementById('evolutionModal');
const evolutionOptionsDiv = document.getElementById('evolutionOptions');

function openEvolutionModal() {
    // 1. Get player's base class (e.g., 'warrior')
    // We stored this in 'player.background' in your save system
    const baseClass = gameState.player.background; 
    const options = EVOLUTION_DATA[baseClass];

    if (!options) return; // Should not happen if data is correct

    evolutionOptionsDiv.innerHTML = '';

    options.forEach(evo => {
        const div = document.createElement('div');
        div.className = "panel p-4 rounded-xl border-2 hover:border-yellow-500 cursor-pointer transition-all";
        div.onclick = () => selectEvolution(evo);
        div.innerHTML = `
            <div class="text-4xl mb-2">${evo.icon}</div>
            <h3 class="text-xl font-bold text-highlight">${evo.name}</h3>
            <p class="text-sm text-gray-500 mb-2">${evo.description}</p>
            <div class="text-xs font-bold text-green-500">
                ${Object.entries(evo.stats).map(([k,v]) => `+${v} ${k}`).join(', ')}
            </div>
        `;
        evolutionOptionsDiv.appendChild(div);
    });

    evolutionModal.classList.remove('hidden');
}

function selectEvolution(evoData) {
    const player = gameState.player;

    // 1. Apply Stats
    for (const stat in evoData.stats) {
        if (player.hasOwnProperty(stat)) {
            player[stat] += evoData.stats[stat];
        }
    }
    
    // 2. Apply Special Properties
    player.character = evoData.icon; // Change sprite
    player.classEvolved = true;
    player.className = evoData.name; // Store the new class name
    
    // 3. Add Talent
    if (!player.talents) player.talents = [];
    player.talents.push(evoData.talent);

    // 4. Update max health/mana if constitution/wits changed
    if (evoData.stats.constitution) player.maxHealth += (evoData.stats.constitution * 5);
    if (evoData.stats.wits) player.maxMana += (evoData.stats.wits * 5);
    if (evoData.stats.maxMana) player.maxMana += evoData.stats.maxMana; // Direct mana buff

    // 5. Full Heal on Evolve
    player.health = player.maxHealth;
    player.mana = player.maxMana;

    // 6. Save & Close
    logMessage(`You have evolved into a ${evoData.name}!`);
    playerRef.update({
        ...player, // Saves stats, character icon, talents
        classEvolved: true
    });

    evolutionModal.classList.add('hidden');
    renderStats();
    render(); // Update sprite on screen
}

/**
 * Executes the Pacify skill on a target
 * after the player chooses a direction.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

function executePacify(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA["pacify"];

    // --- 1. Deduct Cost ---
    player.psyche -= skillData.cost;
    let hit = false;
    
    // Loop 1 to 3 tiles away
    for (let i = 1; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        // This skill only works in instanced maps
        if (gameState.mapMode === 'overworld') {
            logMessage("This skill only works in dungeons and castles.");
            hit = true; // Prevents the "miss" message
            break;
        }

        let map;
        let theme;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        } else {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            theme = { floor: '.' };
        }
        
        const tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        const enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

        if (enemy) {

            if (enemy.isBoss) {
                logMessage(`The ${enemy.name} is immune to your charms!`);
                hit = true;
                break; 
            }

            // Found a target!
            hit = true;
            
            // --- 3. Calculate Success Chance ---
            // 5% chance per Charisma point, capped at 75%
            const successChance = Math.min(0.75, player.charisma * 0.05);

            if (Math.random() < successChance) {
                // --- SUCCESS ---
                logMessage(`You calm the ${enemy.name}! It becomes passive.`);
                
                // Remove it from the enemy list
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                
                // Set its tile to a floor
                map[targetY][targetX] = theme.floor;
                
            } else {
                // --- FAILURE ---
                logMessage(`Your attempt to pacify the ${enemy.name} fails!`);
            }
            break; // Stop looping, we found our target
        } else if (tile !== theme.floor) {
            // Hit a wall, stop the loop
            break;
        }
    }

    if (!hit) {
        logMessage("You attempt to calm... nothing.");
    }

    // --- 4. Finalize Turn ---
    playerRef.update({
        psyche: player.psyche
    });
    triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    triggerAbilityCooldown('pacify');
    endPlayerTurn();
    render();
}

function executeTame(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA["tame"];

    // 1. Deduct Cost
    player.psyche -= skillData.cost;
    let hit = false;

    // Range: 1-2 tiles
    for (let i = 1; i <= 2; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);
        
        // Check for instanced enemies (Dungeon/Castle)
        // (Simplification: Taming only works in instances for now to avoid complexity with Overworld RTDB deletion)
        if (gameState.mapMode === 'overworld') {
            logMessage("The beast is too wild here. Drive it into a cave first.");
            hit = true; 
            break;
        }

        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        
        if (enemy) {
            hit = true;
            
            // Check beast types (Wolf, Spider, Scorpion, Bear/DireWolf)
            const beastTiles = ['w', '@', '🦂', '🐺'];
            if (!beastTiles.includes(enemy.tile)) {
                logMessage("You can only tame beasts!");
                break;
            }

            // Check HP Threshold (30%)
            const hpPercent = enemy.health / enemy.maxHealth;
            if (hpPercent > 0.30) {
                logMessage(`The ${enemy.name} is too healthy to tame! Weaken it first.`);
                break;
            }

            // Success Roll
            const tameChance = 0.3 + (player.charisma * 0.05); // Base 30% + 5% per Charisma
            if (Math.random() < tameChance) {
                logMessage(`You calm the ${enemy.name}... It accepts you as its master!`);
                
                // Create Companion
                player.companion = {
                    name: `Tamed ${enemy.name}`,
                    tile: enemy.tile,
                    type: "beast",
                    hp: enemy.maxHealth, // Heals up when tamed
                    maxHp: enemy.maxHealth,
                    attack: enemy.attack,
                    defense: enemy.defense || 0,
                    x: player.x, // Temp position
                    y: player.y
                };

                // Remove enemy
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                playerRef.update({ companion: player.companion });

            } else {
                logMessage(`The ${enemy.name} resists your call and snaps at you!`);
            }
            break;
        }
    }

    if (!hit) logMessage("You try to tame the empty air.");

    playerRef.update({ psyche: player.psyche });
    triggerAbilityCooldown('tame');
    endPlayerTurn();
    render();
}

/**
 * Executes the Inflict Madness skill on a target
 * after the player chooses a direction.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

function executeInflictMadness(dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA["inflictMadness"];

    // --- 1. Deduct Cost ---
    player.psyche -= skillData.cost;
    let hit = false;
    
    // Loop 1 to 3 tiles away
    for (let i = 1; i <= 3; i++) {
        const targetX = player.x + (dirX * i);
        const targetY = player.y + (dirY * i);

        if (gameState.mapMode === 'overworld') {
            logMessage("This skill only works in dungeons and castles.");
            hit = true; 
            break;
        }

        let map;
        let theme;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        } else {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            theme = { floor: '.' };
        }
        
        const tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
        const enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);

        if (enemy) {

            if (enemy.isBoss) {
                logMessage(`The ${enemy.name}'s mind is too strong to break!`);
                hit = true;
                break; 
            }
            
            // Found a target!
            hit = true;
            
            // --- 3. Calculate Success Chance ---
            const successChance = Math.min(0.75, player.charisma * 0.05); // Scales with Charisma

            if (Math.random() < successChance) {
                // --- SUCCESS ---
                logMessage(`You assault the ${enemy.name}'s mind! It goes mad!`);
                enemy.madnessTurns = 5; // Set status for 5 turns
                
            } else {
                // --- FAILURE ---
                logMessage(`The ${enemy.name} resists your mental assault!`);
            }
            break; // Stop looping, we found our target
        } else if (tile !== theme.floor) {
            // Hit a wall, stop the loop
            break;
        }
    }

    if (!hit) {
        logMessage("You assault the minds of... nothing.");
    }

    // --- 4. Finalize Turn ---
    playerRef.update({
        psyche: player.psyche
    });
    triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    triggerAbilityCooldown('inflictMadness');
    endPlayerTurn();
    render();
}

/**
 * Executes an aimed spell (Magic Bolt, Fireball, Siphon Life)
 * after the player chooses a direction.
 * @param {string} spellId - The ID of the spell to execute.
 * @param {number} dirX - The x-direction of the aim.
 * @param {number} dirY - The y-direction of the aim.
 */

async function executeAimedSpell(spellId, dirX, dirY) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];
    const spellLevel = player.spellbook[spellId] || 1;

    // --- 1. Deduct Cost ---
    
    // The cost was already checked in castSpell. Now we deduct it.

    // --- ARCHMAGE: MANA FLOW ---
    
    let cost = spellData.cost;
    if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
        cost = Math.floor(cost * 0.8);
    }
    player[spellData.costType] -= cost;

    let hitSomething = false;

    // --- CALCULATE DAMAGE WITH BONUS ---
    const effectiveWits = player.wits + (player.witsBonus || 0);
    const effectiveWill = player.willpower; // Add willpowerBonus here if you ever add that stat!

    // --- 2. Execute Spell Logic ---
    switch (spellId) {

        case 'magicBolt':
        case 'siphonLife':
        case 'psychicBlast':
        case 'frostBolt':

        case 'entangle':
            { 
                logMessage("Vines burst from the ground!");
                const entangleDmg = spellData.baseDamage + (player.intuition * spellLevel); // Scales with Intuition
                
                // Entangle hits a specific spot 3 tiles away (Sniper root)
                // You can change '3' to 'i' in a loop if you want it to hit the first thing in line
                for (let i = 1; i <= 3; i++) {
                    const tx = player.x + (dirX * i);
                    const ty = player.y + (dirY * i);
                    
                    // We await the result. If we hit something, stop.
                    if (await applySpellDamage(tx, ty, entangleDmg, spellId)) {
                        hitSomething = true;
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createFloatingText(tx, ty, "ROOTED", "#22c55e");
                        }
                        break; 
                    }
                }
            } 
            break;

        case 'poisonBolt':
            {
                const damageStat = (spellId === 'siphonLife' || spellId === 'psychicBlast' || spellId === 'poisonBolt') ? effectiveWill : effectiveWits;
                
                const spellDamage = spellData.baseDamage + (damageStat * spellLevel);
                
                let logMsg = "You cast your spell!";
                if (spellId === 'magicBolt') logMsg = "You hurl a bolt of energy!";
                if (spellId === 'siphonLife') logMsg = "You cast Siphon Life!";
                if (spellId === 'psychicBlast') logMsg = "You unleash a blast of mental energy!";
                if (spellId === 'frostBolt') logMsg = "You launch a shard of ice!";
                if (spellId === 'poisonBolt') logMsg = "You hurl a bolt of acid!";
                logMessage(logMsg);

                // Now checks 1, 2, and 3 tiles away
                for (let i = 1; i <= 3; i++) { 
                    const targetX = player.x + (dirX * i);
                    const targetY = player.y + (dirY * i);
                    // We await here so Siphon Life's heal applies correctly
                    if (await applySpellDamage(targetX, targetY, spellDamage, spellId)) {
                        hitSomething = true;
                        break; // Stop, we hit a target
                    }
                }
            } // <--- CLOSE BRACE
            break;

        case 'thunderbolt':
            { // <--- BRACE ADDED FOR SCOPE
                const thunderDmg = spellData.baseDamage + (player.wits * spellLevel);
                logMessage("CRACK! Lightning strikes!");
                // Thunderbolt is instant hit, range 4
                for (let i = 1; i <= 4; i++) {
                    const tx = player.x + (dirX * i);
                    const ty = player.y + (dirY * i);
                    if (await applySpellDamage(tx, ty, thunderDmg, spellId)) {
                        ParticleSystem.createExplosion(tx, ty, '#facc15'); // Yellow sparks
                        hitSomething = true;
                        break;
                    }
                }
            } // <--- CLOSE BRACE
            break;

        case 'meteor':
            { // <--- BRACE ADDED FOR SCOPE
                // Huge AoE (radius 2)
                const meteorDmg = spellData.baseDamage + (player.wits * spellLevel);
                const mx = player.x + (dirX * 3);
                const my = player.y + (dirY * 3);
                logMessage("A meteor crashes down!");
                
                for (let y = my - spellData.radius; y <= my + spellData.radius; y++) {
                    for (let x = mx - spellData.radius; x <= mx + spellData.radius; x++) {
                        applySpellDamage(x, y, meteorDmg, spellId).then(hit => {
                            if (hit) ParticleSystem.createExplosion(x, y, '#f97316'); // Fire explosion
                        });
                    }
                }
                hitSomething = true;
            } // <--- CLOSE BRACE
            break;

        case 'raiseDead':
            { // <--- BRACE ADDED FOR SCOPE
                // 1. Calculate target coordinates
                // (We assume range 1-3 based on the loop in executeAimedSpell, 
                // but Raise Dead usually targets a specific spot. Let's look 1 tile away for simplicity first).
                const targetX = player.x + dirX;
                const targetY = player.y + dirY;
                
                // 2. Determine what is on that tile
                let tileType;
                if (gameState.mapMode === 'overworld') {
                    tileType = chunkManager.getTile(targetX, targetY);
                } else if (gameState.mapMode === 'dungeon') {
                     tileType = chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX];
                } else {
                     tileType = chunkManager.castleMaps[gameState.currentCastleId][targetY][targetX];
                }

                // 3. Check for valid "corpse" materials
                // Valid: 's' (Skeleton enemy?), '(' (Bone Shard), '⚰️' (Grave)
                // For now, let's say you can raise from Bone Shards '(' or graves '⚰️'
                // OR if we just want it to be a summon, we can ignore requirements. 
                // Let's require a Bone Shard '(' on the ground for balance.
                
                if (tileType === '(' || tileType === '⚰️') {
                    
                    if (gameState.player.companion) {
                        logMessage("You already have a companion! Dismiss them first.");
                    } else {
                        logMessage("You chant the words of unlife... A Skeleton rises to serve you!");
                        
                        // Consume the bones/grave
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(targetX, targetY, '.');
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = '.';
                        
                        // Create the companion
                        gameState.player.companion = {
                            name: "Risen Skeleton",
                            tile: "s",
                            type: "undead",
                            hp: 15 + (player.willpower * 5), // Scales with Willpower
                            maxHp: 15 + (player.willpower * 5),
                            attack: 3 + Math.floor(player.wits / 2),
                            defense: 1,
                            x: targetX,
                            y: targetY
                        };
                        
                        // Update DB
                        playerRef.update({ companion: gameState.player.companion });
                        hitSomething = true; // Consumes the spell resource
                        
                        render(); // Show the change
                    }
                } else {
                    logMessage("You need a pile of bones '(' or a grave '⚰️' to raise the dead.");
                }
            }
            break;

        case 'chainLightning':
            { 
                // 1. Calculate Base Damage
                const lightningDmg = spellData.baseDamage + (player.wits * spellLevel);
                
                // 2. Determine Primary Impact Point (3 tiles away, like Fireball)
                const targetX = player.x + (dirX * 3);
                const targetY = player.y + (dirY * 3);
                
                logMessage("A bolt of lightning arcs from your hands!");

                // 3. Hit Primary Target
                // We use 'await' here to ensure the main bolt hits first
                const hitPrimary = await applySpellDamage(targetX, targetY, lightningDmg, spellId);
                
                if (hitPrimary) {
                    hitSomething = true;
                    // Visual: Bright Blue/Yellow Spark
                    ParticleSystem.createExplosion(targetX, targetY, '#facc15'); 
                }

                // 4. The "Chain" Logic
                // Instead of a fixed square, we scan a radius and pick RANDOM valid enemies
                const jumpRadius = 3; // How far the lightning can jump
                let potentialJumpTargets = [];

                // Scan the area around the impact point
                for (let y = targetY - jumpRadius; y <= targetY + jumpRadius; y++) {
                    for (let x = targetX - jumpRadius; x <= targetX + jumpRadius; x++) {
                        // Don't hit the primary target again
                        if (x === targetX && y === targetY) continue; 

                        // Check if there is actually an enemy here
                        let hasEnemy = false;
                        if (gameState.mapMode === 'overworld') {
                            const tile = chunkManager.getTile(x, y);
                            if (ENEMY_DATA[tile]) hasEnemy = true;
                        } else {
                            if (gameState.instancedEnemies.some(e => e.x === x && e.y === y)) hasEnemy = true;
                        }

                        if (hasEnemy) {
                            potentialJumpTargets.push({x, y});
                        }
                    }
                }

                // 5. Select Jump Targets
                // Max jumps scales slightly with spell level (Base 2 jumps + 1 per 2 levels)
                const maxJumps = 2 + Math.floor(spellLevel / 2);
                
                // Shuffle the potential targets array (Fisher-Yates shuffle simplified)
                potentialJumpTargets.sort(() => Math.random() - 0.5);

                // Hit the first N targets
                const jumpsToMake = Math.min(potentialJumpTargets.length, maxJumps);
                
                if (jumpsToMake > 0) {
                    // Slight delay in log to simulate the "travel" time
                    setTimeout(() => logMessage(`The lightning arcs to ${jumpsToMake} nearby enemies!`), 200);
                }

                for (let i = 0; i < jumpsToMake; i++) {
                    const jumpTgt = potentialJumpTargets[i];
                    // Chain hits deal 75% damage
                    const jumpDmg = Math.max(1, Math.floor(lightningDmg * 0.75));
                    
                    applySpellDamage(jumpTgt.x, jumpTgt.y, jumpDmg, spellId).then(hit => {
                        if (hit) ParticleSystem.createExplosion(jumpTgt.x, jumpTgt.y, '#93c5fd'); // Lighter blue for arcs
                    });
                }
            } 
            break;

        case 'fireball':
            {
                // This is an AoE spell. It hits a 3x3 area, 3 tiles away.
                const fbDamage = spellData.baseDamage + (player.wits * spellLevel);
                const radius = spellData.radius; // 1
                
                // Fireball targets a point 3 tiles away
                const targetX = player.x + (dirX * 3);
                const targetY = player.y + (dirY * 3);
                logMessage("A fireball erupts in the distance!");

                // Loop in a 3x3 area around the target point
                for (let y = targetY - radius; y <= targetY + radius; y++) {
                    for (let x = targetX - radius; x <= targetX + radius; x++) {

                        let tileAt; // <--- Declared ONCE here
                        
                        // 1. Get the tile based on map mode
                        if (gameState.mapMode === 'overworld') {
                            tileAt = chunkManager.getTile(x, y);
                        } else if (gameState.mapMode === 'dungeon') {
                            const mapRef = chunkManager.caveMaps[gameState.currentCaveId];
                            tileAt = (mapRef && mapRef[y]) ? mapRef[y][x] : null;
                        } else if (gameState.mapMode === 'castle') {
                            const mapRef = chunkManager.castleMaps[gameState.currentCastleId];
                            tileAt = (mapRef && mapRef[y]) ? mapRef[y][x] : null;
                        }

                        // 2. Check for Barrel
                        if (tileAt === '🛢') {
                            logMessage("BOOM! An Oil Barrel explodes!");
                            ParticleSystem.createExplosion(x, y, '#f97316', 12); 
                            
                            // Destroy the barrel (Handle Overworld vs Instanced)
                            if (gameState.mapMode === 'overworld') {
                                chunkManager.setWorldTile(x, y, '.');
                            } else if (gameState.mapMode === 'dungeon') {
                                chunkManager.caveMaps[gameState.currentCaveId][y][x] = '.';
                            } else {
                                chunkManager.castleMaps[gameState.currentCastleId][y][x] = '.';
                            }
                            
                            // Deal extra damage to anything on this tile!
                            applySpellDamage(x, y, 15, 'fireball'); 
                        }

                        // 3. Check for Spider Webs (Using the SAME tileAt variable)
                        if (gameState.mapMode === 'dungeon' && tileAt === '🕸') {
                            const map = chunkManager.caveMaps[gameState.currentCaveId];
                            const theme = CAVE_THEMES[gameState.currentCaveTheme];
                            if (map && map[y]) {
                                map[y][x] = theme.floor; // Burn it away
                                logMessage("The web catches fire and burns away!");
                            }
                        }

                        // Don't await in the AoE loop, just fire them all off
                        applySpellDamage(x, y, fbDamage, spellId).then(hit => {
                            if (hit) hitSomething = true;
                        });
                    }
                }
            }
            break;
    }

    if (!hitSomething && (spellId === 'magicBolt' || spellId === 'siphonLife')) {
        logMessage("Your spell flies harmlessly into the distance.");
    }

    // --- 3. Finalize Turn ---
    playerRef.update({
        [spellData.costType]: player[spellData.costType] // Update mana or psyche
    });
    
    // Trigger the correct stat animation
    if (spellData.costType === 'mana') {
        triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
    } else if (spellData.costType === 'psyche') {
        triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
    }

    triggerAbilityCooldown(spellId);

    endPlayerTurn();
    render();
}

function initSkillbookListeners() {
    closeSkillButton.addEventListener('click', () => {
        skillModal.classList.add('hidden');
    });

    // Calls our new, unified useSkill function
    skillList.addEventListener('click', (e) => {
        const skillItem = e.target.closest('.skill-item');
        if (skillItem && skillItem.dataset.skill) {
            // Pass the skill's ID (e.g., "brace")
            useSkill(skillItem.dataset.skill); 
        }
    });
}

function openBountyBoard() {
    renderBountyBoard();
    questModal.classList.remove('hidden');
}

// Renders the content of the bounty board
function renderBountyBoard() {
    questList.innerHTML = '';
    const playerQuests = gameState.player.quests;

    // Loop through all defined quests
    for (const questId in QUEST_DATA) {
        const quest = QUEST_DATA[questId];

        if (quest.type === 'fetch' || quest.type === 'collect') continue;

        const playerQuest = playerQuests[questId];
        let questHtml = '';

        if (!playerQuest) {
            // --- Scenario 1: Quest is Available ---
            questHtml = `
                <div class="quest-item">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-description">${quest.description} (Reward: ${quest.reward.xp} XP, ${quest.reward.coins} Gold)</div>
                    <div class="quest-actions">
                        <button data-quest-id="${questId}" data-action="accept">Accept</button>
                    </div>
                </div>`;
        } else if (playerQuest.status === 'active') {
            // --- Scenario 2: Quest is In-Progress ---
            const progress = `(${playerQuest.kills} / ${quest.needed})`;
            let actionButton = '';

            if (playerQuest.kills >= quest.needed) {
                // --- 2a: Ready to Turn In ---
                actionButton = `<button data-quest-id="${questId}" data-action="turnin">Turn In</button>`;
            } else {
                // --- 2b: Still in progress ---
                actionButton = `<button disabled>In Progress</button>`;
            }
            
            questHtml = `
                <div class="quest-item">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-progress">Progress: ${progress}</div>
                    <div class="quest-actions">${actionButton}</div>
                </div>`;
        } else if (playerQuest.status === 'completed') {
            // --- Scenario 3: Quest is Done ---
             questHtml = `
                <div class="quest-item">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-description">You have already completed this bounty.</div>
                    <div class="quest-actions"><button disabled>Completed</button></div>
                </div>`;
        }
        questList.innerHTML += questHtml;
    }
}

function acceptQuest(questId) {
    const quest = QUEST_DATA[questId];
    if (!quest) return;

    logMessage(`New Quest Accepted: ${quest.title}`);
    gameState.player.quests[questId] = {
        status: 'active',
        kills: 0
    };
    
    playerRef.update({ quests: gameState.player.quests });
    renderBountyBoard(); // Re-render the modal
}

function turnInQuest(questId) {
    const quest = QUEST_DATA[questId];
    const playerQuest = gameState.player.quests[questId];

    // --- MODIFY THIS BLOCK ---
    if (!quest || !playerQuest) { // <-- Simplified check
        logMessage("Quest is not active.");
        return;
    }
    
    let hasRequirements = true; // Assume true
    let itemIndex = -1; // To store the item's location

    if (quest.type === 'fetch') {
        // --- Check for item ---
        itemIndex = gameState.player.inventory.findIndex(item => item.name === quest.itemNeeded && !item.isEquipped);
        if (itemIndex === -1) {
            logMessage(`You don't have the ${quest.itemNeeded}!`);
            hasRequirements = false;
        }

        } else if (quest.type === 'collect') {
        // --- Check for a stack of items ---
        itemIndex = gameState.player.inventory.findIndex(item => item.name === quest.itemNeeded);
        
        if (itemIndex === -1 || gameState.player.inventory[itemIndex].quantity < quest.needed) {
            logMessage(`You don't have enough ${quest.itemNeeded}s! You need ${quest.needed}.`);
            hasRequirements = false;
        }

    } else {
        // --- Check for kills (your old logic) ---
        if (playerQuest.kills < quest.needed) {
            logMessage("Quest is not ready to turn in.");
            hasRequirements = false;
        }
    }

    if (!hasRequirements) {
        return; // Stop if they don't have the item or kills
    }
    // --- END MODIFIED BLOCK ---
    
    // --- Give Rewards ---
    logMessage(`Quest Complete! You gained ${quest.reward.xp} XP and ${quest.reward.coins} Gold!`);
    grantXp(quest.reward.xp);
    gameState.player.coins += quest.reward.coins;

    if (quest.reward.item) {
        const rewardItem = Object.values(ITEM_DATA).find(i => i.name === quest.reward.item);
        if (rewardItem) {
            // Check keys to find the tile char
            const rewardKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === quest.reward.item);
            const qty = quest.reward.itemQty || 1;
            
            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                gameState.player.inventory.push({
                    name: rewardItem.name,
                    type: rewardItem.type,
                    quantity: qty,
                    tile: rewardKey || '?',
                    damage: rewardItem.damage || null,
                    defense: rewardItem.defense || null,
                    slot: rewardItem.slot || null,
                    statBonuses: rewardItem.statBonuses || null,
                    effect: rewardItem.effect // Bind effect function
                });
                logMessage(`You received: ${rewardItem.name} (x${qty})`);
            } else {
                logMessage(`You received a ${rewardItem.name}, but your inventory was full! It fell to the ground.`);
                // Logic to drop it on the ground would go here, but for now we warn them.
            }
        }
    }

    // --- Mark as Completed ---
    playerQuest.status = 'completed';
    
    if (quest.type === 'fetch' && itemIndex > -1) {
        // --- This is our existing fetch logic (unchanged) ---
        gameState.player.inventory.splice(itemIndex, 1);

    } else if (quest.type === 'collect' && itemIndex > -1) {
        // --- Remove the required quantity from the stack ---
        const itemStack = gameState.player.inventory[itemIndex];
        itemStack.quantity -= quest.needed;
        
        // If the stack is now empty, remove the item
        if (itemStack.quantity <= 0) {
            gameState.player.inventory.splice(itemIndex, 1);
        }
    }

// --- Update database (must include inventory!) ---

    playerRef.update({
        quests: gameState.player.quests,
        coins: gameState.player.coins,
        inventory: getSanitizedInventory()
    });

    renderBountyBoard(); // Re-render the modal
    renderStats(); // Update coins display
    renderInventory(); // <-- Add this
}

// This function will be called every time an enemy is killed
function updateQuestProgress(enemyTile) {
    const playerQuests = gameState.player.quests;

    for (const questId in playerQuests) {
        const questData = QUEST_DATA[questId];
        const playerQuest = playerQuests[questId];

        // Is this an active quest, not yet complete, and for this enemy type?
        if (playerQuest.status === 'active' && 
            questData.enemy === enemyTile &&
            playerQuest.kills < questData.needed) 
        {
            playerQuest.kills++;
            logMessage(`Bounty: (${playerQuest.kills} / ${questData.needed})`);
            
            // Save the new kill count
            playerRef.update({ quests: gameState.player.quests });
        }
    }
}

function initQuestListeners() {
    closeQuestButton.addEventListener('click', () => {
        questModal.classList.add('hidden');
    });

    questList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const questId = button.dataset.questId;
        const action = button.dataset.action;

        if (action === 'accept') {
            acceptQuest(questId);
        } else if (action === 'turnin') {
            turnInQuest(questId);
        }
    });
}

function initCraftingListeners() {
    closeCraftingButton.addEventListener('click', () => {
        craftingModal.classList.add('hidden');
    });

    craftingRecipeList.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-craft-item]');
        if (button) {
            handleCraftItem(button.dataset.craftItem);
        }
    });
}

const collectionsModal = document.getElementById('collectionsModal');
const closeCollectionsButton = document.getElementById('closeCollectionsButton');
const bestiaryView = document.getElementById('bestiaryView');
const libraryView = document.getElementById('libraryView');
const tabBestiary = document.getElementById('tabBestiary');
const tabLibrary = document.getElementById('tabLibrary');

function openCollections() {
    renderBestiary();
    renderLibrary();
    collectionsModal.classList.remove('hidden');
}

function renderBestiary() {
    bestiaryView.innerHTML = '';
    const kills = gameState.player.killCounts || {};
    const sortedEnemies = Object.keys(ENEMY_DATA).sort((a,b) => ENEMY_DATA[a].name.localeCompare(ENEMY_DATA[b].name));

    sortedEnemies.forEach(key => {
        const data = ENEMY_DATA[key];
        const count = kills[data.name] || 0;

        // Unlock Levels
        const unlockedName = count > 0;
        const unlockedStats = count >= 5;
        const unlockedLore = count >= 10;

        if (!unlockedName) {
            // Show ??? entry
            const div = document.createElement('div');
            div.className = 'bestiary-entry opacity-50';
            div.innerHTML = `<div class="bestiary-icon">?</div><div>Unknown Creature</div>`;
            bestiaryView.appendChild(div);
            return;
        }

        let statsHtml = `<span class="text-xs">Kills: ${count}</span>`;
        if (unlockedStats) {
            statsHtml += `<br><span class="text-green-600">HP: ${data.maxHealth}</span> | <span class="text-red-500">Atk: ${data.attack}</span> | <span class="text-blue-500">Def: ${data.defense}</span>`;
        } else {
            statsHtml += `<br><span class="text-xs italic text-gray-400">Kill 5 to reveal stats</span>`;
        }

        let loreHtml = '';
        if (unlockedLore && data.flavor) {
            loreHtml = `<div class="text-xs mt-1 italic text-gray-600">"${data.flavor}"</div>`;
        } else if (!unlockedLore) {
             loreHtml = `<div class="text-xs mt-1 text-gray-300">Kill 10 to reveal lore</div>`;
        }

        const div = document.createElement('div');
        div.className = 'bestiary-entry';
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="bestiary-icon">${key}</div>
                <div class="bestiary-info">
                    <h4>${data.name}</h4>
                    ${statsHtml}
                    ${loreHtml}
                </div>
            </div>
        `;
        bestiaryView.appendChild(div);
    });
}

function renderLibrary() {
    libraryView.innerHTML = '';
    
    // 1. Gather all journals the player has *seen* or currently *has*
    
    // Iterate ITEM_DATA. If type == 'journal', check if player.foundLore has the key OR inventory has it.
    
    const inventoryTiles = gameState.player.inventory.map(i => i.tile);
    
    Object.keys(ITEM_DATA).forEach(key => {
        const item = ITEM_DATA[key];
        if (item.type === 'journal' || item.type === 'random_journal') {
            
            // Do we have it?
            const hasItem = inventoryTiles.includes(key);
            // Alternatively, add a "collectedJournals" set to player state later for permanent record
            
            if (hasItem) {
                const div = document.createElement('div');
                div.className = 'library-entry';
                div.innerHTML = `<h4 class="font-bold">${item.name}</h4><p class="text-xs text-gray-500">${item.title || 'Untitled'}</p>`;
                div.onclick = () => {
                    loreTitle.textContent = item.title || item.name;
                    loreContent.textContent = item.content || "The ink is smeared...";
                    loreModal.classList.remove('hidden');
                };
                libraryView.appendChild(div);
            }
        }
    });
    
    if (libraryView.children.length === 0) {
        libraryView.innerHTML = '<div class="p-4 italic text-gray-500">You have not collected any journals yet.</div>';
    }
}

// --- Event Listeners ---
closeCollectionsButton.addEventListener('click', () => collectionsModal.classList.add('hidden'));

tabBestiary.addEventListener('click', () => {
    bestiaryView.classList.remove('hidden');
    libraryView.classList.add('hidden');
    tabBestiary.classList.add('border-b-2', 'border-blue-500', 'text-black');
    tabBestiary.classList.remove('text-gray-500');
    tabLibrary.classList.remove('border-b-2', 'border-blue-500', 'text-black');
    tabLibrary.classList.add('text-gray-500');
});

tabLibrary.addEventListener('click', () => {
    libraryView.classList.remove('hidden');
    bestiaryView.classList.add('hidden');
    tabLibrary.classList.add('border-b-2', 'border-blue-500', 'text-black');
    tabLibrary.classList.remove('text-gray-500');
    tabBestiary.classList.remove('border-b-2', 'border-blue-500', 'text-black');
    tabBestiary.classList.add('text-gray-500');
});

function initSkillTrainerListeners() {
    closeSkillTrainerButton.addEventListener('click', () => {
        skillTrainerModal.classList.add('hidden');
    });

    skillTrainerList.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-skill-id]');
        if (button && !button.disabled) {
            handleLearnSkill(button.dataset.skillId);
        }
    });
}

/**
 * Checks if the player has the required materials for a recipe.
 * @param {string} recipeName - The name of the item to craft (a key in CRAFTING_RECIPES).
 * @returns {boolean} - True if the player has all materials, false otherwise.
 */
function checkHasMaterials(recipeName) {
    const recipe = CRAFTING_RECIPES[recipeName];
    if (!recipe) return false; // Recipe doesn't exist

    const playerInventory = gameState.player.inventory;

    // Check every material in the recipe
    // We now iterate over 'recipe.materials' because the structure changed
    for (const materialName in recipe.materials) {
        const requiredQuantity = recipe.materials[materialName];
        
        // Find the material in the player's inventory
        const itemInInventory = playerInventory.find(item => item.name === materialName);

        if (!itemInInventory || itemInInventory.quantity < requiredQuantity) {
            // Player is missing this material or doesn't have enough
            return false;
        }
    }
    
    // If we get here, the player has everything
    return true;
}

/**
 * Renders the list of all available crafting recipes
 * and checks which ones the player can craft.
 */

function renderCraftingModal() {
    craftingRecipeList.innerHTML = ''; 
    const playerInventory = gameState.player.inventory;
    
    // Select the correct recipe list
    let activeRecipes = {};
    let playerLevel = 1;

    if (gameState.currentCraftingMode === 'cooking') {
        activeRecipes = COOKING_RECIPES;
        playerLevel = 1; // Everyone can cook level 1 stuff for now
        // Or use wisdom? Let's just allow all cooking for simplicity.
    } else {
        activeRecipes = CRAFTING_RECIPES;
        playerLevel = gameState.player.craftingLevel || 1;
    }

    for (const recipeName in activeRecipes) {
        const recipe = activeRecipes[recipeName];
        
        // --- CHECK MATERIALS (Reused Logic) ---
        let canCraft = true;
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            if (!itemInInventory || itemInInventory.quantity < requiredQuantity) {
                canCraft = false;
            }
        }
        // --------------------------------------
        
        const levelMet = playerLevel >= recipe.level;

        // Find the tile
        const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
        const outputItemTile = outputItemKey || '?';

        // Build Material List
        let materialsHtml = '<ul class="crafting-item-materials">';
        for (const materialName in recipe.materials) {
            const requiredQuantity = recipe.materials[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            const currentQuantity = itemInInventory ? itemInInventory.quantity : 0;
            const quantityClass = currentQuantity < requiredQuantity ? 'text-red-500' : '';
            materialsHtml += `<li class="${quantityClass}">${materialName} (${currentQuantity}/${requiredQuantity})</li>`;
        }
        materialsHtml += '</ul>';

        // Build Info Line
        let infoHtml = '';
        if (gameState.currentCraftingMode === 'workbench') {
             let levelClass = levelMet ? 'text-green-600' : 'text-red-500 font-bold';
             infoHtml = `<div class="text-xs mt-1 ${levelClass}">Requires Crafting Lvl ${recipe.level} (Reward: ${recipe.xp} XP)</div>`;
        } else {
             // Cooking doesn't have levels yet, just XP
             infoHtml = `<div class="text-xs mt-1 text-green-600">Delicious! (Reward: ${recipe.xp} XP)</div>`;
        }

        const li = document.createElement('li');
        li.className = 'crafting-item';
        li.innerHTML = `
            <div>
                <span class="crafting-item-name">${recipeName} (${outputItemTile})</span>
                ${materialsHtml}
                ${infoHtml}
            </div>
            <div class="crafting-item-actions">
                <button data-craft-item="${recipeName}" ${canCraft && levelMet ? '' : 'disabled'}>${gameState.currentCraftingMode === 'cooking' ? 'Cook' : 'Craft'}</button>
            </div>
        `;
        craftingRecipeList.appendChild(li);
    }
}

/**
 * Handles the logic of crafting an item.
 * Consumes materials and adds the new item to inventory.
 * @param {string} recipeName - The name of the item to craft.
 */

function handleCraftItem(recipeName) {
    // 1. Check both lists to find the recipe data
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    
    if (!recipe) return;

    const player = gameState.player;
    const playerInventory = player.inventory;
    
    // 2. Check Level Requirement
    // If it's a Workbench recipe, check crafting level. Cooking is currently Lvl 1 for all.
    const playerCraftLevel = player.craftingLevel || 1;
    if (CRAFTING_RECIPES[recipeName] && playerCraftLevel < recipe.level) {
        logMessage(`You need Crafting Level ${recipe.level} to make this.`);
        return;
    }

    // 3. Check Materials
    for (const materialName in recipe.materials) {
        const requiredQuantity = recipe.materials[materialName];
        const itemInInventory = playerInventory.find(item => item.name === materialName);
        
        if (!itemInInventory || itemInInventory.quantity < requiredQuantity) {
            logMessage(`You are missing materials: ${materialName}`);
            return;
        }
    }

    // 4. Consume Materials
    for (const materialName in recipe.materials) {
        const requiredQuantity = recipe.materials[materialName];
        const itemInInventory = playerInventory.find(item => item.name === materialName);

        itemInInventory.quantity -= requiredQuantity;
        if (itemInInventory.quantity <= 0) {
            const itemIndex = playerInventory.indexOf(itemInInventory);
            playerInventory.splice(itemIndex, 1);
        }
    }

    // 5. Add Crafted Item
    const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
    const itemTemplate = ITEM_DATA[outputItemKey];
    
    // --- Masterwork Logic (Only for Equipment) ---
    const levelDiff = playerCraftLevel - recipe.level;
    const masterworkChance = 0.10 + (levelDiff * 0.05);
    let isMasterwork = false;
    let craftedName = itemTemplate.name;
    let craftedStats = itemTemplate.statBonuses ? {...itemTemplate.statBonuses} : {};

    if ((itemTemplate.type === 'weapon' || itemTemplate.type === 'armor') && Math.random() < masterworkChance) {
        isMasterwork = true;
        craftedName = `Masterwork ${itemTemplate.name}`;
        
        const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        craftedStats[randomStat] = (craftedStats[randomStat] || 0) + 1;
        
        if (itemTemplate.type === 'weapon') itemTemplate.damage = (itemTemplate.damage || 0) + 1;
        if (itemTemplate.type === 'armor') itemTemplate.defense = (itemTemplate.defense || 0) + 1;
    }

    // Stack Logic (Don't stack masterworks)
    const existingStack = playerInventory.find(item => item.name === craftedName && !isMasterwork);

    if (existingStack) {
        existingStack.quantity++;
    } else {
        const newItem = {
            name: craftedName,
            type: itemTemplate.type,
            quantity: 1,
            tile: outputItemKey || '?',
            damage: itemTemplate.damage || null,
            defense: itemTemplate.defense || null,
            slot: itemTemplate.slot || null,
            statBonuses: Object.keys(craftedStats).length > 0 ? craftedStats : null,
            effect: itemTemplate.effect // CRITICAL: Copy the food effect!
        };
        playerInventory.push(newItem);
    }
    
    if (isMasterwork) {
        logMessage(`Critical Success! You crafted a ${craftedName}!`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
    } else {
        logMessage(`You crafted/cooked: ${recipeName}.`);
    }

    // 6. Grant XP (Unified Crafting XP)
    const xpGain = recipe.xp || 10;
    player.craftingXp = (player.craftingXp || 0) + xpGain;
    player.craftingXpToNext = player.craftingXpToNext || 50;
    
    logMessage(`+${xpGain} Crafting XP`);

    if (player.craftingXp >= player.craftingXpToNext) {
        player.craftingXp -= player.craftingXpToNext;
        player.craftingLevel++;
        player.craftingXpToNext = Math.floor(player.craftingXpToNext * 1.5);
        logMessage(`CRAFTING LEVEL UP! You are now Artisan Level ${player.craftingLevel}.`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-blue');
    }

    // 7. Update Database & UI
    // 7. Update Database & UI
    playerRef.update({ 
        inventory: getSanitizedInventory(),
        craftingLevel: player.craftingLevel,
        craftingXp: player.craftingXp,
        craftingXpToNext: player.craftingXpToNext
    });

    renderCraftingModal(); 
    renderInventory();
}

function openCraftingModal(mode = 'workbench') {
    gameState.currentCraftingMode = mode;
    
    // Update Title based on mode
    const title = document.querySelector('#craftingModal h2');
    if (mode === 'cooking') {
        title.textContent = "Cooking Pot";
    } else {
        title.textContent = "Crafting Workbench";
    }

    renderCraftingModal(); 
    craftingModal.classList.remove('hidden');
}

/**
 * Renders the skill trainer modal.
 * Lists all skills from SKILL_DATA and shows their learn/level-up status.
 */
function renderSkillTrainerModal() {
    skillTrainerList.innerHTML = ''; // Clear the old list
    const player = gameState.player;
    skillTrainerStatPoints.textContent = `Your Stat Points: ${player.statPoints}`;
    const canAfford = player.statPoints > 0;

    for (const skillId in SKILL_DATA) {
        const skillData = SKILL_DATA[skillId];
        const currentLevel = player.skillbook[skillId] || 0; // 0 if not learned

        let buttonHtml = '';
        let levelText = '';

        if (currentLevel === 0) {
            // Player does not know this skill
            levelText = '<span class="skill-trainer-level text-red-500">Not Learned</span>';
            if (player.level >= skillData.requiredLevel) {
                // Player meets level requirement, show "Learn" button
                buttonHtml = `<button data-skill-id="${skillId}" ${canAfford ? '' : 'disabled'}>Learn (1 SP)</button>`;
            } else {
                // Player does not meet level requirement
                buttonHtml = `<button disabled>Requires Lvl ${skillData.requiredLevel}</button>`;
            }
        } else {
            // Player knows this skill
            levelText = `<span class="skill-trainer-level">Level: ${currentLevel}</span>`;
            // TODO: Add a max level check here later if we want one
            buttonHtml = `<button data-skill-id="${skillId}" ${canAfford ? '' : 'disabled'}>Level Up (1 SP)</button>`;
        }

        // Build the full list item
        const li = document.createElement('li');
        li.className = 'skill-trainer-item';
        li.innerHTML = `
            <div>
                <span class="skill-trainer-name">${skillData.name}</span>
                <span class="skill-trainer-desc">${skillData.description}</span>
            </div>
            <div class="text-right">
                ${levelText}
                <div class="skill-trainer-actions mt-1">
                    ${buttonHtml}
                </div>
            </div>
        `;
        skillTrainerList.appendChild(li);
    }
}

/**
 * Handles the logic of spending a stat point to learn or level up a skill.
 * @param {string} skillId - The ID of the skill to learn (e.g., "brace").
 */
function handleLearnSkill(skillId) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId];

    // --- Final Security Checks ---
    if (player.statPoints <= 0) {
        logMessage("You don't have any Stat Points to spend.");
        return;
    }
    if (!skillData) {
        logMessage("That skill doesn't exist.");
        return;
    }

    const currentLevel = player.skillbook[skillId] || 0;
    if (currentLevel === 0 && player.level < skillData.requiredLevel) {
        logMessage("You are not high enough level to learn that.");
        return;
    }
    // --- End Checks ---

    // Spend the point
    player.statPoints--;

    if (currentLevel === 0) {
        // --- Learn the skill ---
        player.skillbook[skillId] = 1;
        logMessage(`You have learned ${skillData.name} (Level 1)!`);
    } else {
        // --- Level up the skill ---
        player.skillbook[skillId]++;
        logMessage(`${skillData.name} is now Level ${player.skillbook[skillId]}!`);
    }

    // Update database
    playerRef.update({
        statPoints: player.statPoints,
        skillbook: player.skillbook
    });

    // Update UI
    renderStats(); // Update the main UI stat point display
    renderSkillTrainerModal(); // Re-render the modal to show new state
}

/**
 * Opens the Skill Trainer modal.
 */
function openSkillTrainerModal() {
    renderSkillTrainerModal(); // Populate the list
    skillTrainerModal.classList.remove('hidden');
}

/**
 * Opens the spellbook modal.
 * Dynamically renders the list of spells the player knows
 * based on their spellbook and the SPELL_DATA.
 */
function openSpellbook() {
    spellList.innerHTML = ''; // Clear the list
    const player = gameState.player;
    const playerSpells = player.spellbook || {};

    // Check if the spellbook is empty
    if (Object.keys(playerSpells).length === 0) {
        spellList.innerHTML = '<li class="spell-item-details italic p-4">Your spellbook is empty.</li>';
        spellModal.classList.remove('hidden');
        return;
    }

    // Loop through every spell the player knows
    for (const spellId in playerSpells) {
        const spellLevel = playerSpells[spellId];
        const spellData = SPELL_DATA[spellId]; // Get data from our new constant

        if (!spellData) {
            console.warn(`Player has unknown spell in spellbook: ${spellId}`);
            continue;
        }

        let canCast = false;
        let costString = `${spellData.cost} ${spellData.costType}`;
        let costColorClass = ""; // CSS class for cost, e.g., text-red-500

        // Check if the player has enough resources to cast
        if (spellData.costType === 'mana') {
            canCast = player.mana >= spellData.cost;
            if (!canCast) costColorClass = "text-red-500";
        } else if (spellData.costType === 'psyche') {
            canCast = player.psyche >= spellData.cost;
            if (!canCast) costColorClass = "text-red-500";
        }

        // Build the new list item element
        const li = document.createElement('li');
        li.className = 'spell-item';
        li.dataset.spell = spellId; // Use the spell's ID (e.g., "lesserHeal")
        
        // Make the item look disabled if it can't be cast
        if (!canCast) {
            li.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Set the dynamic HTML for the spell
        li.innerHTML = `
            <div>
                <span class="spell-item-name">${spellData.name} (Lvl ${spellLevel})</span>
                <span class="spell-item-details">${spellData.description}</span>
            </div>
            <div class="flex flex-col items-end">
                <span class="font-bold ${costColorClass}">${costString}</span>
                <button class="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded mt-1" 
                    onclick="assignToHotbar('${spellId}'); event.stopPropagation();">
                    Assign
                </button>
            </div>
        `;
        
        spellList.appendChild(li);
    }

    spellModal.classList.remove('hidden'); // Show the modal
}

/**
 * Handles all spellcasting logic based on SPELL_DATA
 * and the player's spellbook.
 * @param {string} spellId - The ID of the spell to cast (e.g., "lesserHeal").
 */

function castSpell(spellId) {
    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];
    
    if (!spellData) {
        logMessage("You don't know how to cast that. (No spell data found)");
        return;
    }

    if (player.cooldowns && player.cooldowns[spellId] > 0) {
        logMessage(`That spell is not ready yet (${player.cooldowns[spellId]} turns).`);
        return;
    }
    
    const spellLevel = player.spellbook[spellId] || 0;

    if (spellLevel === 0) {
        logMessage("You don't know that spell.");
        return;
    }

    // --- 1. Check Resource Cost ---
    
    let cost = spellData.cost;
    // --- ARCHMAGE: MANA FLOW ---
    if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
        cost = Math.floor(cost * 0.8);
    }

    const costType = spellData.costType;

    // --- MODIFIED COST CHECK ---
    if (costType === 'health') {
        // Special check for health: must have MORE than the cost
        if (player[costType] <= cost) { 
            logMessage("You are too weak to sacrifice your life-force.");
            return;
        }
    } else if (player[costType] < cost) {
        logMessage(`You don't have enough ${costType} to cast that.`);
        return; 
    }
    // --- END MODIFICATION ---

    // --- 2. Handle Targeting ---
    if (spellData.target === 'aimed') {
        // (This block is unchanged)
        gameState.isAiming = true;
        gameState.abilityToAim = spellId;
        spellModal.classList.add('hidden');
        logMessage(`${spellData.name}: Press an arrow key or WASD to fire. (Esc) to cancel.`);
        return; 

    } else if (spellData.target === 'self') {
        // --- Self-Cast Spells ---
        player[costType] -= cost; // Deduct the resource cost
        let spellCastSuccessfully = false;
        let updates = {}; // --- NEW: Object to batch database updates ---

        // --- 3. Execute Spell Effect ---
        switch (spellId) {

            case 'stoneSkin':
                // Grants high defense for a short time
                const skinBonus = 3 + Math.floor(player.constitution * 0.2);
                player.defenseBonus = (player.defenseBonus || 0) + skinBonus;
                player.defenseBonusTurns = spellData.duration;
                
                logMessage(`Your skin turns to granite! (+${skinBonus} Defense)`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-gray'); // Gray for stone!
                
                updates.defenseBonus = player.defenseBonus;
                updates.defenseBonusTurns = player.defenseBonusTurns;
                spellCastSuccessfully = true;
                break;

            case 'thornSkin':
                const reflectAmount = spellData.baseReflect + (player.intuition * spellLevel);
                player.thornsValue = reflectAmount;
                player.thornsTurns = spellData.duration;
                logMessage(`Your skin hardens! (Reflect ${reflectAmount} dmg)`);
                
                updates.thornsValue = reflectAmount;
                updates.thornsTurns = spellData.duration;
                spellCastSuccessfully = true;
                break;

                case 'candlelight':
                if (player.candlelightTurns > 0) {
                    logMessage("You renew the magical light.");
                } else {
                    logMessage("A warm, floating orb of light appears above you.");
                }
                
                player.candlelightTurns = spellData.duration;
                
                // Visual Flair
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-yellow');
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(player.x, player.y, "💡", "#facc15");
                }
                
                updates.candlelightTurns = player.candlelightTurns;
                spellCastSuccessfully = true;
                break;

                case 'divineLight':
                player.health = player.maxHealth;
                player.poisonTurns = 0;
                player.frostbiteTurns = 0;
                player.madnessTurns = 0; // New status clean
                player.rootTurns = 0;
                
                logMessage("A holy light bathes you. You are fully restored!");
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                ParticleSystem.createLevelUp(player.x, player.y); // Use the sparkle effect
                
                updates.health = player.health;
                updates.poisonTurns = 0;
                updates.frostbiteTurns = 0;
                updates.madnessTurns = 0;
                spellCastSuccessfully = true;
                break;

            case 'lesserHeal':
                const effectiveWits = player.wits + (player.witsBonus || 0); 
                const healAmount = spellData.baseHeal + (effectiveWits * spellLevel);
                const oldHealth = player.health;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                const healedFor = player.health - oldHealth;

                if (healedFor > 0) {
                    logMessage(`You cast Lesser Heal and recover ${healedFor} health.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');

                    ParticleSystem.createFloatingText(player.x, player.y, `+${healedFor}`, '#22c55e'); // Green text

                } else {
                    logMessage("You cast Lesser Heal, but you're already at full health.");
                }
                updates.health = player.health; // <-- MODIFIED
                spellCastSuccessfully = true;
                break;

            case 'arcaneShield':
                if (player.shieldTurns > 0) {
                    logMessage("You already have an active shield!");
                    spellCastSuccessfully = false;
                    break;
                }
                
                const effWitsShield = player.wits + (player.witsBonus || 0); 
                const shieldAmount = spellData.baseShield + (effWitsShield * spellLevel);
                player.shieldValue = shieldAmount;
                player.shieldTurns = spellData.duration;

                logMessage(`You conjure an Arcane Shield, absorbing ${shieldAmount} damage!`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-blue');
                
                updates.shieldValue = player.shieldValue; // <-- MODIFIED
                updates.shieldTurns = player.shieldTurns; // <-- MODIFIED
                spellCastSuccessfully = true;
                break;

            case 'clarity':
                if (gameState.mapMode !== 'dungeon') {
                    logMessage("You can only feel for secret walls in caves.");
                    spellCastSuccessfully = true;
                    break;
                }

                const map = chunkManager.caveMaps[gameState.currentCaveId];
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                const secretWallTile = theme.secretWall;
                let foundWall = false;

                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue;
                        const checkX = player.x + x;
                        const checkY = player.y + y;

                        if (map[checkY] && map[checkY][checkX] === secretWallTile) {
                            map[checkY][checkX] = theme.floor;
                            foundWall = true;
                        }
                    }
                }

                if (foundWall) {
                    logMessage("You focus your mind... and a passage is revealed!");
                    render();
                } else {
                    logMessage("You focus, but find no hidden passages nearby.");
                }
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                spellCastSuccessfully = true;
                break;
            
            // --- ADD THIS NEW CASE ---
            case 'darkPact':
                const manaRestored = spellData.baseRestore + (player.willpower * spellLevel);
                const oldMana = player.mana;
                player.mana = Math.min(player.maxMana, player.mana + manaRestored);
                const actualRestore = player.mana - oldMana;

                if (actualRestore > 0) {
                    logMessage(`You sacrifice ${cost} health to restore ${actualRestore} mana.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-red'); // Our new animation
                    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                } else {
                    logMessage("You cast Dark Pact, but your mana is already full.");
                }
                updates.health = player.health; // Add health cost to updates
                updates.mana = player.mana;   // Add mana gain to updates
                spellCastSuccessfully = true;
                break;
            // --- END ---
        }

        // --- 4. Finalize Self-Cast Turn ---
        if (spellCastSuccessfully) {
            updates[costType] = player[costType]; // Add the resource cost (mana/psyche/health)
            playerRef.update(updates); // Send all updates at once
            spellModal.classList.add('hidden');

            triggerAbilityCooldown(spellId);

            endPlayerTurn();
            renderStats();
        } else {
            // Refund the cost if the spell failed (e.g., shield already active)
            player[costType] += cost;
        }
    }
}

async function executeMeleeSkill(skillId, dirX, dirY) {
    const player = gameState.player;
    const skillData = SKILL_DATA[skillId];
    const skillLevel = player.skillbook[skillId] || 1;

    player[skillData.costType] -= skillData.cost;
    let hit = false;

    // Calculate Damage
    const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
    const playerStrength = player.strength + (player.strengthBonus || 0);
    
    let rawPower = playerStrength + weaponDamage;

    // --- APPLY PASSIVE MODIFIERS (Blood Rage) ---
    rawPower = getPlayerDamageModifier(rawPower);

    const baseDmg = rawPower * skillData.baseDamageMultiplier;

    const finalDmg = Math.max(1, Math.floor(baseDmg + (player.strength * 0.5 * skillLevel)));

    // Target Logic
    // Shield Bash / Cleave hit adjacent (Range 1)
    const targetX = player.x + dirX;
    const targetY = player.y + dirY;

    let enemiesToHit = [{ x: targetX, y: targetY }];

    // If Cleave, add side targets
    if (skillId === 'cleave') {
        // If attacking North(0, -1), sides are (-1, -1) and (1, -1)
        // Simple logic: add perpendicular offsets? No, cleave usually hits a wide arc in front.
        // Let's hit the main target, plus the tiles 90 degrees to it.
        // If attacking (1, 0) [East], hit (1, -1) [NE] and (1, 1) [SE]
        if (dirX !== 0) { // Horizontal attack
            enemiesToHit.push({ x: targetX, y: targetY - 1 });
            enemiesToHit.push({ x: targetX, y: targetY + 1 });
        } else { // Vertical attack
            enemiesToHit.push({ x: targetX - 1, y: targetY });
            enemiesToHit.push({ x: targetX + 1, y: targetY });
        }
    }

    for (const coords of enemiesToHit) {
        // ... (Insert standard tile check logic here: Overworld vs Instanced) ...
        let tile;
        let map;
        if (gameState.mapMode === 'dungeon') {
            map = chunkManager.caveMaps[gameState.currentCaveId];
            tile = (map && map[coords.y]) ? map[coords.y][coords.x] : ' ';
        } else if (gameState.mapMode === 'castle') {
            map = chunkManager.castleMaps[gameState.currentCastleId];
            tile = (map && map[coords.y]) ? map[coords.y][coords.x] : ' ';
        } else {
            tile = chunkManager.getTile(coords.x, coords.y);
        }

        const enemyData = ENEMY_DATA[tile];
        if (enemyData) {

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You emerge from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }

            hit = true;

            if (player.stealthTurns > 0) {
                player.stealthTurns = 0;
                logMessage("You strike from the shadows!");
                playerRef.update({ stealthTurns: 0 });
            }

            // Apply Damage
            if (gameState.mapMode === 'overworld') {
                await handleOverworldCombat(coords.x, coords.y, enemyData, tile, finalDmg);
            } else {
                let enemy = gameState.instancedEnemies.find(e => e.x === coords.x && e.y === coords.y);
                if (enemy) {
                    enemy.health -= finalDmg;
                    logMessage(`You hit ${enemy.name} for ${finalDmg}!`);
                    ParticleSystem.createExplosion(coords.x, coords.y, '#fff');

                    // APPLY SHIELD BASH STUN
                    if (skillId === 'shieldBash') {
                        enemy.stunTurns = 3; // Stunned for 3 turns
                        logMessage(`${enemy.name} is stunned!`);
                    }

                    if (enemy.health <= 0) {
                        logMessage(`You defeated ${enemy.name}!`);

                        registerKill(enemy);

                        const droppedLoot = generateEnemyLoot(player, enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                        
                        if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                        
                        }

                        if (map) map[coords.y][coords.x] = droppedLoot;
                    }
                }
            }
        }
    }

    if (!hit) logMessage("You swing at empty air.");

    triggerAbilityCooldown(skillId);
    endPlayerTurn();
    render();
}

/**
 * Universal helper function to apply spell damage to a target.
 * Handles both overworld (Firebase) and instanced enemies.
 * Also handles special on-hit effects like Siphon Life.
 * @param {number} targetX - The x-coordinate of the target.
 * @param {number} targetY - The y-coordinate of the target.
 * @param {number} damage - The final calculated damage to apply.
 * @param {string} spellId - The ID of the spell being cast (e.g., "siphonLife").
 */
async function applySpellDamage(targetX, targetY, damage, spellId) {

    // --- WEATHER SYNERGY ---
    const weather = gameState.weather; // Get current weather
    let finalDamage = damage;

    // --- TALENT: ARCANE POTENCY ---
    if (gameState.player.talents && gameState.player.talents.includes('arcane_potency')) {
        finalDamage += 2;
    }

    if (gameState.mapMode === 'overworld' && weather !== 'clear') {
        
        // Rain/Storm Logic
        if (weather === 'rain' || weather === 'storm') {
            if (spellId === 'fireball' || spellId === 'meteor') {
                finalDamage = Math.floor(damage * 0.5); // Fire fizzles in rain
                // Visual cue (only if player is casting)
                if (gameState.player.x !== targetX) ParticleSystem.createFloatingText(targetX, targetY, "Fizzle...", "#aaa");
            } else if (spellId === 'thunderbolt' || spellId === 'magicBolt') { 
                finalDamage = Math.floor(damage * 1.5); // Lightning conducts!
            }
        } 
        
        // Snow Logic
        else if (weather === 'snow') {
             if (spellId === 'frostBolt') {
                 finalDamage = Math.floor(damage * 1.5); // Ice enhanced
             } else if (spellId === 'fireball') {
                 finalDamage = Math.floor(damage * 0.8); // Fire dampened
             }
        }
    }

    const player = gameState.player;
    const spellData = SPELL_DATA[spellId];

    // Determine the tile and enemy data
    let tile;
    if (gameState.mapMode === 'overworld') {
        tile = chunkManager.getTile(targetX, targetY);
    } else {
        const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
        tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
    }
    const enemyData = ENEMY_DATA[tile];
    if (!enemyData) return false; // No enemy here

    let damageDealt = 0; // Track actual damage for lifesteal

    if (gameState.mapMode === 'overworld') {
        const enemyId = `overworld:${targetX},${-targetY}`;
        const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);

        try {
            const transactionResult = await enemyRef.transaction(currentData => {
                let enemy;
                
                // --- NEW: Handle fresh spawn via magic ---
                if (currentData === null) {
                    // If it doesn't exist yet, create it scaled!
                    const scaledStats = getScaledEnemy(enemyData, targetX, targetY);
                    enemy = {
                        health: scaledStats.maxHealth,
                        maxHealth: scaledStats.maxHealth,
                        attack: scaledStats.attack,
                        defense: enemyData.defense,
                        xp: scaledStats.xp,
                        loot: enemyData.loot,
                        tile: tile,
                        name: scaledStats.name
                    };
                } else {
                    enemy = currentData;
                }
            
                // Calculate actual damage
                damageDealt = Math.max(1, finalDamage);
                enemy.health -= damageDealt;

                let color = '#3b82f6'; // Blue for magic
            
                    if (spellId === 'fireball') color = '#f97316'; // Orange for fire
                    if (spellId === 'poisonBolt') color = '#22c55e'; // Green for poison

                    ParticleSystem.createExplosion(targetX, targetY, color);
                    ParticleSystem.createFloatingText(targetX, targetY, `-${damageDealt}`, color);
                
                if (enemy.health <= 0) return null;
                return enemy;
            });

           const finalEnemyState = transactionResult.snapshot.val();
            if (finalEnemyState === null) {

                const deadEnemyInfo = getScaledEnemy(enemyData, targetX, targetY);
                
                registerKill(deadEnemyInfo);
                
                const droppedLoot = generateEnemyLoot(player, enemyData);
                
                chunkManager.setWorldTile(targetX, targetY, droppedLoot);
            }
                    } catch (error) {
            console.error("Spell damage transaction failed: ", error);
        }

    } else {
        // Handle Instanced Combat
        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        if (enemy) {
            damageDealt = Math.max(1, damage); // TODO: Add magic resistance?
            enemy.health -= damageDealt;
            logMessage(`You hit the ${enemy.name} for ${damageDealt} magic damage!`);

            if (enemy.health <= 0) {
                logMessage(`You defeated the ${enemy.name}!`);
                
                registerKill(enemy);

                const droppedLoot = generateEnemyLoot(player, enemy);
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                }
                if (gameState.mapMode === 'dungeon') {
                    chunkManager.caveMaps[gameState.currentCaveId][targetY][targetX] = droppedLoot;
                }
            }
        }
    }

    // --- Handle On-Hit Effects ---
    if (damageDealt > 0 && spellId === 'siphonLife') {
        const healedAmount = Math.floor(damageDealt * spellData.healPercent);
        if (healedAmount > 0) {
            const oldHealth = player.health;
            player.health = Math.min(player.maxHealth, player.health + healedAmount);
            const actualHeal = player.health - oldHealth;
            if (actualHeal > 0) {
                logMessage(`You drain ${actualHeal} health from the ${enemyData.name}.`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                playerRef.update({ health: player.health });
            }
        }
    }

    else if (damageDealt > 0 && spellData.inflicts && Math.random() < spellData.inflictChance) {
        
        // This only applies to instanced enemies for now
        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
            
            if (enemy && spellData.inflicts === 'frostbite' && enemy.frostbiteTurns <= 0) {
                logMessage(`The ${enemy.name} is afflicted with Frostbite!`);
                enemy.frostbiteTurns = 5; // Lasts 5 turns
            }

            else if (enemy && spellData.inflicts === 'poison' && enemy.poisonTurns <= 0) {
            logMessage(`The ${enemy.name} is afflicted with Poison!`);
            enemy.poisonTurns = 3; // Poison lasts 3 turns
        }

        else if (enemy && spellData.inflicts === 'root' && enemy.rootTurns <= 0) {
                logMessage(`Roots burst from the ground, trapping the ${enemy.name}!`);
                enemy.rootTurns = 3; // Root lasts 3 turns
            }
        }
    }
    
    return damageDealt > 0; // Return true if we hit something
}

/**
 * Converts a direction object {x, y} into a readable string.
 * @param {object} dir - An object with x and y properties (-1, 0, or 1)
 * @returns {string} A compass direction, e.g., "north-west".
 */
function getDirectionString(dir) {
    if (!dir) return 'nearby';

    const { x, y } = dir;

    if (y === -1) {
        if (x === -1) return 'north-west';
        if (x === 0) return 'north';
        if (x === 1) return 'north-east';
    } else if (y === 0) {
        if (x === -1) return 'west';
        if (x === 1) return 'east';
    } else if (y === 1) {
        if (x === -1) return 'south-west';
        if (x === 0) return 'south';
        if (x === 1) return 'south-east';
    }
    return 'nearby'; // Fallback
}

function passivePerceptionCheck() {
    const player = gameState.player;

    // This check only works in dungeons
    if (gameState.mapMode !== 'dungeon') {
        return;
    }

    const map = chunkManager.caveMaps[gameState.currentCaveId];
    if (!map) return; // Map not loaded
    
    const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
    const secretWallTile = theme.secretWall;
    if (!secretWallTile) return; // This theme has no secret walls

    let foundWall = false;

    // Check all 8 adjacent tiles
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            if (x === 0 && y === 0) continue; // Skip self

            const checkX = player.x + x;
            const checkY = player.y + y;

            if (map[checkY] && map[checkY][checkX] === secretWallTile) {
                // We are adjacent to a secret wall.
                // Roll to see if we spot it.
                // 1% chance per perception point, max 75% chance per check.
                const spotChance = Math.min(player.perception * 0.01, 0.75);
                
                if (Math.random() < spotChance) {
                    map[checkY][checkX] = theme.floor; // Reveal the wall!
                    foundWall = true;
                }
            }
        }
    }

    if (foundWall) {
        // We only log once even if multiple walls are found in one step
        logMessage("Your keen perception reveals a hidden passage!");
        grantXp(15); // Grant the same XP as breaking it
        // We don't need to call render() here, as the main movement
        // block will call render() just after this function finishes.
    }
}

/**
 * Handles combat for overworld enemies, syncing health via RTDB.
 * Accepts a pre-calculated playerDamage value.
 */

async function handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage) { // <-- ADDED playerDamage
    const player = gameState.player;
    const enemyId = `overworld:${newX},${-newY}`; // Unique RTDB key
    const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);

    // Log message is now passed from the caller (e.g., "You attack..." or "You lunge...")

    let enemyWasKilled = false;
    let enemyAttackedBack = false;
    let enemyDamageTaken = 0;

    try {
        // Use a transaction to safely read and write enemy health
        const transactionResult = await enemyRef.transaction(currentData => {
            let enemy;
            if (currentData === null) {
                // First time this enemy is hit. Create it in RTDB.
                const scaledStats = getScaledEnemy(enemyData, newX, newY);
                
                enemy = {
                    health: scaledStats.maxHealth,
                    maxHealth: scaledStats.maxHealth,
                    attack: scaledStats.attack,
                    defense: enemyData.defense,
                    xp: scaledStats.xp,
                    loot: enemyData.loot,
                    tile: newTile, // Store the original tile
                    name: scaledStats.name // Store the scaled name (e.g., "Feral Wolf")
                };
                // -----------------------------------
            } else {
                enemy = currentData;
            }

            // --- Player Attacks Enemy ---
            // We now use the damage value passed into the function!
            enemy.health -= playerDamage; 

            ParticleSystem.createExplosion(newX, newY, '#ef4444'); // Red blood
            ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');

            if (enemy.health <= 0) {
                // Enemy is dead. Return 'null' to delete it from RTDB.
                return null;
            } else {
                // Enemy is still alive. Update its health.
                return enemy;
            }
        });

        // --- Process Transaction Results ---
        const finalEnemyState = transactionResult.snapshot.val();
        if (finalEnemyState === null) {
            // Enemy Died
            const deadEnemyInfo = getScaledEnemy(enemyData, newX, newY);
            logMessage(`The ${deadEnemyInfo.name} was vanquished!`);
            grantXp(deadEnemyInfo.xp);
            updateQuestProgress(newTile); // Uses the original tile ID

            const droppedLoot = generateEnemyLoot(player, enemyData);

            // Remove the enemy from local memory immediately so it vanishes 
            // from the screen before the server listener catches up.
            if (gameState.sharedEnemies[enemyId]) {
                delete gameState.sharedEnemies[enemyId];
            }
            render(); // Force a re-draw to clear the sprite
            
            // We only set the tile if it's currently passable terrain.
            // This prevents loot from overwriting a wall if an enemy somehow died inside one.
            const currentTerrain = chunkManager.getTile(newX, newY);
            if (currentTerrain === '.' || currentTerrain === 'd' || currentTerrain === 'D' || currentTerrain === 'F') {
                 chunkManager.setWorldTile(newX, newY, droppedLoot);
            }

        } else {
            // --- ENEMY SURVIVES AND ATTACKS ---
            enemyAttackedBack = true;
            const enemy = finalEnemyState;

            // --- 1. NEW: Shield Block Check ---
            let blockChance = 0;
            // Check Armor slot (Shields)
            if (player.equipment.armor && player.equipment.armor.blockChance) {
                blockChance += player.equipment.armor.blockChance;
            }
            // Check Weapon slot (Parrying daggers or shields in main hand)
            if (player.equipment.weapon && player.equipment.weapon.blockChance) {
                blockChance += player.equipment.weapon.blockChance;
            }

            if (Math.random() < blockChance) {
                logMessage(`CLANG! You blocked the ${enemyData.name}'s attack!`);
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(player.x, player.y, "BLOCKED", "#ccc");
                }
                enemyDamageTaken = 0;
            } else {
                // --- 2. Calculate Potential Damage ---
                const armorDefense = player.equipment.armor ? player.equipment.armor.defense : 0;
                const baseDefense = Math.floor(player.dexterity / 5);
                const buffDefense = player.defenseBonus || 0;

                // --- TALENT: IRON SKIN ---
                const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;

                const playerDefense = baseDefense + armorDefense + buffDefense;

                enemyDamageTaken = Math.max(1, enemy.attack - playerDefense);

                // --- 3. Luck Dodge Check ---
                let dodgeChance = Math.min(player.luck * 0.002, 0.25);
// Add Evasion Talent
if (player.talents && player.talents.includes('evasion')) {
    dodgeChance += 0.10; // Flat +10%
}

if (Math.random() < dodgeChance) {
    logMessage(`The ${enemyData.name} attacks, but you dodge! (Evasion)`);
    enemyDamageTaken = 0;
}
            }

            // --- 4. Apply Final Damage & Reactives ---
            if (enemyDamageTaken > 0) {
                let damageToApply = enemyDamageTaken;

                // -- Arcane Shield Logic --
                if (player.shieldValue > 0) {
                    const damageAbsorbed = Math.min(player.shieldValue, damageToApply);
                    player.shieldValue -= damageAbsorbed;
                    damageToApply -= damageAbsorbed;

                    logMessage(`Your shield absorbs ${damageAbsorbed} damage!`);

                    if (player.shieldValue === 0) {
                        logMessage("Your Arcane Shield shatters!");
                    }
                }

                // -- Thorns Logic (Reflect Damage) --
                if (player.thornsValue > 0) {
                    logMessage(`The ${enemyData.name} takes ${player.thornsValue} damage from your thorns!`);

                    // Use a nested transaction to safely apply thorn damage to the DB
                    enemyRef.transaction(thornData => {
                        if (!thornData) return null; // Enemy already dead/gone
                        
                        thornData.health -= player.thornsValue;
                        
                        // If dead, return null to delete
                        return thornData.health <= 0 ? null : thornData;
                    }).then(result => {
                        // Check if the enemy was deleted (snapshot doesn't exist)
                        if (result.committed && !result.snapshot.exists()) {
                            logMessage(`The ${enemyData.name} is killed by your thorns!`);
                            grantXp(enemyData.xp);
                            updateQuestProgress(newTile);
                            const droppedLoot = generateEnemyLoot(player, enemyData);
                            chunkManager.setWorldTile(newX, newY, droppedLoot);
                        }
                    });
                }

                // -- Apply Final Health Damage --
                if (damageToApply > 0) {
                    player.health -= damageToApply;
                }
            }
        }

    } catch (error) {
        console.error("Firebase transaction failed: ", error);
        logMessage("Your attack falters... (network error)");
        return; // Exit combat on error
    }

    // --- Handle Post-Combat Player State ---
    if (enemyAttackedBack && enemyDamageTaken > 0) { 
        triggerStatFlash(statDisplays.health, false); // Flash health red
        logMessage(`The ${enemyData.name} hits you for ${enemyDamageTaken} damage!`);   

        ParticleSystem.createFloatingText(player.x, player.y, `-${enemyDamageTaken}`, '#ef4444');

        if (player.health <= 0) {
            player.health = 0;
            logMessage("You have perished!");
            syncPlayerState();
            document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
            document.getElementById('finalCoinsDisplay').textContent = `Gold: ${player.coins}`;
            gameOverModal.classList.remove('hidden');
        }
    }

    endPlayerTurn();
    render();
}

const renderInventory = () => {
    inventoryModalList.innerHTML = '';
    
    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryModalList.innerHTML = '<span class="muted-text italic px-2">Inventory is empty.</span>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            
            // Check for isEquipped flag and add cursor-pointer for hover indication
            if (item.isEquipped) {
                itemDiv.className = 'inventory-slot equipped p-2 rounded-md cursor-pointer';
            } else {
                itemDiv.className = 'inventory-slot p-2 rounded-md cursor-pointer';
            }

            // --- MOBILE UPDATE: CLICK TO USE ---
            // This allows clicking the slot to act exactly like pressing the number key
            itemDiv.onclick = () => {
                // If in Drop Mode, treat click as Drop command
                if (gameState.isDroppingItem) {
                    // Simulate pressing the number key for this slot
                    handleInput((index + 1).toString());
                } else {
                    // Otherwise, Use/Equip
                    handleInput((index + 1).toString());
                }
            };

            // Build Tooltip Title
            let title = item.name;
            if (item.statBonuses) {
                title += " (";
                let bonuses = [];
                for (const stat in item.statBonuses) {
                    bonuses.push(`+${item.statBonuses[stat]} ${stat}`);
                }
                title += bonuses.join(', ');
                title += ")";
            }
            itemDiv.title = title; 

            // Create Visual Elements
            const itemChar = document.createElement('span');
            itemChar.className = 'item-char';
            itemChar.textContent = item.tile;
            
            const itemQuantity = document.createElement('span');
            itemQuantity.className = 'item-quantity';
            itemQuantity.textContent = `x${item.quantity}`;
            
            const slotNumber = document.createElement('span');
            slotNumber.className = 'absolute top-0 left-1 text-xs highlight-text font-bold';
            
            // Only number the first 9 slots (since we use keys 1-9)
            if (index < 9) {
                slotNumber.textContent = index + 1;
            }
            
            itemDiv.appendChild(slotNumber);
            itemDiv.appendChild(itemChar);
            itemDiv.appendChild(itemQuantity);
            inventoryModalList.appendChild(itemDiv);
        });
    }
};

const renderEquipment = () => {
    // --- WEAPON & DAMAGE ---
    const player = gameState.player;
    const weapon = player.equipment.weapon || { name: 'Fists', damage: 0 };

    // Calculate total damage, including the new strength buff
    const playerStrength = player.strength + (player.strengthBonus || 0); // <-- APPLY BUFF
    const baseDamage = playerStrength; 
    const weaponDamage = weapon.damage || 0;
    const totalDamage = baseDamage + weaponDamage;

    // Update the display to show the buff
    let weaponString = `Weapon: ${weapon.name} (+${weaponDamage})`;
    if (player.strengthBonus > 0) { // <-- ADDED THIS BLOCK
        weaponString += ` <span class="text-green-500">[Strong +${player.strengthBonus} (${player.strengthBonusTurns}t)]</span>`;
    }
    equippedWeaponDisplay.innerHTML = weaponString; // <-- CHANGED to innerHTML
    
    // Update the strength display to show the total damage
    statDisplays.strength.textContent = `Strength: ${player.strength} (Dmg: ${totalDamage})`;

    // --- ARMOR & DEFENSE ---
    const armor = player.equipment.armor || { name: 'Simple Tunic', defense: 0 };

    // Calculate total defense
    const baseDefense = Math.floor(player.dexterity / 5); 
    const armorDefense = armor.defense || 0;
    const buffDefense = player.defenseBonus || 0; 

    // --- TALENT: IRON SKIN ---
    const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;

    const totalDefense = baseDefense + armorDefense + buffDefense;

    // Update the display
    let armorString = `Armor: ${armor.name} (+${armorDefense} Def)`;
    if (buffDefense > 0) {
        // Add the buff text, e.g. [Braced +2] (3t)
        armorString += ` <span class="text-green-500">[Braced +${buffDefense} (${player.defenseBonusTurns}t)]</span>`;
    }
    
    // Show Base Defense in the total
    equippedArmorDisplay.innerHTML = `${armorString} (Base: ${baseDefense}, Total: ${totalDefense} Def)`;
};

const render = () => {

    if (!gameState.mapMode) return;

    // 1. Setup Canvas
    const style = getComputedStyle(document.documentElement);
    const canvasBg = style.getPropertyValue('--canvas-bg');
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const viewportCenterX = Math.floor(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.floor(VIEWPORT_HEIGHT / 2);
    const startX = gameState.player.x - viewportCenterX;
    const startY = gameState.player.y - viewportCenterY;

    // --- 1. LIGHTING SETUP (RELAXED) ---
    // Instead of Pitch Black (1.0), we cap darkness at 0.6 (Dim)
    // This allows you to see everything, just slightly darker.
    let ambientLight = 0.0; 
    let baseRadius = 10; // Increased base radius for better atmosphere

    if (gameState.mapMode === 'dungeon') {
        ambientLight = 0.6; // Dungeon is Dim, not Black
    } 
    else if (gameState.mapMode === 'castle') {
        ambientLight = 0.2; // Castle is well lit
    } 
    else {
        // Overworld Day/Night
        const hour = gameState.time.hour;
        if (hour >= 6 && hour < 18) ambientLight = 0.0; 
        else if (hour >= 18 && hour < 20) ambientLight = 0.3; // Dusk
        else if (hour >= 5 && hour < 6) ambientLight = 0.3;   // Dawn
        else ambientLight = 0.5; // Night is Dim, not Black
    }

    // --- 2. CALCULATE FLICKER ---
    const now = Date.now();
    const torchFlicker = (Math.sin(now / 1000) * 0.2) + (Math.cos(now / 2500) * 0.1);
    const lightRadius = baseRadius + torchFlicker;

    const isWideChar = (char) => /\p{Extended_Pictographic}/u.test(char);

    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH; x++) {
            const mapX = startX + x;
            const mapY = startY + y;
            
            // --- 3. SHADOW CALCULATION ---
            const distToPlayer = Math.sqrt(Math.pow(mapX - gameState.player.x, 2) + Math.pow(mapY - gameState.player.y, 2));
            
            let tileShadowOpacity = ambientLight;
            
            // Create a "Light Circle" around player where it's fully bright
            if (distToPlayer < lightRadius) {
                // Smooth fade from bright center to dim edge
                const edge = lightRadius - distToPlayer;
                if (edge < 5) {
                    tileShadowOpacity = ambientLight * (1 - (edge / 5)); 
                } else {
                    tileShadowOpacity = 0; // Fully bright
                }
            }

            let tile;
            let fgChar = null;
            let fgColor = '#FFFFFF';

            // Get Tile Data
            if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                
                if (tile === theme.wall) TileRenderer.drawWall(ctx, x, y, theme.colors.wall, '#00000033');
                else if (tile === theme.floor) TileRenderer.drawBase(ctx, x, y, theme.colors.floor);
                else { TileRenderer.drawBase(ctx, x, y, theme.colors.floor); fgChar = tile; }
            } 
            else if (gameState.mapMode === 'castle') {
                const map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                if (tile === '▓' || tile === '▒') TileRenderer.drawWall(ctx, x, y, '#422006', '#2d1b0e');
                else { TileRenderer.drawBase(ctx, x, y, '#a16207'); fgChar = tile; }
            } 
            else { 
                tile = chunkManager.getTile(mapX, mapY);

                // --- PROCEDURAL OVERWORLD RENDERING ---

                switch (tile) {
                    // --- HOMESTEAD TILES ---
                    case '🧱': // Stone Wall
                        TileRenderer.drawWall(ctx, x, y, '#78716c', '#57534e'); // Grey brick
                        break;
                    case '=': // Wood Floor
                        TileRenderer.drawBase(ctx, x, y, '#78350f'); // Dark Wood
                        // Optional: Draw plank lines
                        ctx.strokeStyle = '#92400e';
                        ctx.beginPath(); ctx.moveTo(x*TILE_SIZE, y*TILE_SIZE+10); ctx.lineTo(x*TILE_SIZE+20, y*TILE_SIZE+10); ctx.stroke();
                        break;
                    case '+': // Door (Closed)
                        TileRenderer.drawBase(ctx, x, y, '#78350f'); // Wood background
                        TileRenderer.drawWall(ctx, x, y, '#78350f', '#000'); // Door frame
                        fgChar = '+'; fgColor = '#fbbf24'; // Gold handle/symbol
                        break;
                    case '/': // Door (Open)
                        TileRenderer.drawBase(ctx, x, y, '#78350f');
                        fgChar = '/'; fgColor = '#000';
                        break;
                    case '☒': // Stash
                        TileRenderer.drawBase(ctx, x, y, '#78350f');
                        fgChar = '☒'; fgColor = '#fbbf24'; // Gold Chest
                        break;
                    // --- BIOMES ---
                    case '~':
                        TileRenderer.drawWater(ctx, x, y, mapX, mapY, '#1e3a8a', '#3b82f6');
                        break;
                    case '≈': // Swamp
                        TileRenderer.drawWater(ctx, x, y, mapX, mapY, '#422006', '#14532d'); 
                        fgChar = ','; fgColor = '#4b5535';
                        break;
                    case '🔥': 
                    case '⛺':
                        const campMoist = moistureNoise.noise(mapX / 50, mapY / 50);
                        let campBg = '#22c55e'; // Default: Plains Green
                        
                        // Check biome thresholds to match the ground
                        if (campMoist > 0.55) campBg = '#14532d';      // Forest Green
                        else if (campMoist < 0.15) campBg = '#fde047'; // Desert Sand
                        
                        if (tile === '🔥') {
                            TileRenderer.drawFire(ctx, x, y, campBg);
                        } else {
                            TileRenderer.drawBase(ctx, x, y, campBg);
                            fgChar = tile;
                        }
                        break;
                    case '🏛️': 
                    case '🕳️':
                    case '📦':
                        // Calculate exact biome color for this spot
                        const smartElev = elevationNoise.noise(mapX / 70, mapY / 70);
                        const smartMoist = moistureNoise.noise(mapX / 50, mapY / 50);
                        let smartBg = '#22c55e'; // Default: Plains Green

                        if (smartElev > 0.8) smartBg = '#57534e';        // Mountain
                        else if (smartElev > 0.6 && smartMoist < 0.3) smartBg = '#2d2d2d'; // Deadlands
                        else if (smartMoist < 0.15) smartBg = '#fde047'; // Desert
                        else if (smartMoist > 0.55) smartBg = '#14532d'; // Forest
                        
                        TileRenderer.drawBase(ctx, x, y, smartBg);
                        fgChar = tile;
                        
                        // Optional: Abyss should look dark/scary
                        if (tile === '🕳️') fgColor = '#000'; 
                        break;
                    case 'Ω': // Void Rift
                        TileRenderer.drawVoid(ctx, x, y);
                        break;
                    case '^': 
                        const mtMoist = moistureNoise.noise(mapX / 50, mapY / 50);
                        let mtBg = '#57534e'; // Default: Grey Rock
                        
                        // FIX: Lower threshold to 0.35 so mountains near forests blend in!
                        if (mtMoist > 0.35) mtBg = '#14532d';      // High/Med Moisture: Forest Green
                        else if (mtMoist > 0.15) mtBg = '#22c55e'; // Low Moisture: Plains Green
                        
                        TileRenderer.drawMountain(ctx, x, y, mapX, mapY, mtBg, '#d6d3d1');
                        break;

                    case '⛰': // Cave Entrance
                        const caveMoist = moistureNoise.noise(mapX / 50, mapY / 50);
                        let caveBg = '#57534e'; 
                        
                        // FIX: Lower threshold here too
                        if (caveMoist > 0.35) caveBg = '#14532d';      
                        else if (caveMoist > 0.15) caveBg = '#22c55e'; 
                        
                        TileRenderer.drawBase(ctx, x, y, caveBg);
                        fgChar = tile; 
                        break;

                    case 'F':
                        TileRenderer.drawForest(ctx, x, y, mapX, mapY, '#14532d', '#166534');
                        break;
                    case '.':
                        TileRenderer.drawPlains(ctx, x, y, mapX, mapY, '#22c55e', '#15803d');
                        break;
                    case 'd': // Deadlands
                        TileRenderer.drawDeadlands(ctx, x, y, mapX, mapY, '#2d2d2d', '#444');
                        break;
                    case 'D': // Desert
                        TileRenderer.drawDesert(ctx, x, y, mapX, mapY, '#fde047');
                        break;

                    // --- FOREST ITEMS (Dark Green Background) ---
                    case ':': // Wildberry
                        TileRenderer.drawBase(ctx, x, y, '#14532d'); 
                        fgChar = tile; fgColor = '#f87171'; // Red Berries
                        break;
                    case '🕸': // Web
                        TileRenderer.drawBase(ctx, x, y, '#14532d'); 
                        fgChar = tile; fgColor = '#e5e7eb'; // White Web
                        break;
                    case '🌳': // Thicket
                        TileRenderer.drawBase(ctx, x, y, '#14532d'); 
                        fgChar = tile; fgColor = '#4ade80'; // Bright Green Thicket
                        break;

                    // --- SWAMP ITEMS (Swamp Water Background) ---
                    case '🌿': // Herb
                        TileRenderer.drawWater(ctx, x, y, mapX, mapY, '#422006', '#14532d');
                        fgChar = tile; fgColor = '#86efac'; // Light Green Herb
                        break;
                    case 'l': // Leech
                        TileRenderer.drawWater(ctx, x, y, mapX, mapY, '#422006', '#14532d');
                        fgChar = tile; fgColor = '#a3a3a3'; // Grey Leech
                        break;

                    // --- MOUNTAIN ITEMS (Grey Stone Background) ---
                    case '🏚': // Cracked Wall
                        TileRenderer.drawBase(ctx, x, y, '#57534e');
                        fgChar = tile; fgColor = '#d6d3d1'; // Light Grey Wall
                        break;
                    case '💠': // Mithril
                        TileRenderer.drawBase(ctx, x, y, '#57534e');
                        fgChar = tile; fgColor = '#67e8f9'; // Cyan Crystal
                        break;

                    // --- DESERT ITEMS (Sand Background) ---
                    case '🌵': // Cactus
                        TileRenderer.drawDesert(ctx, x, y, mapX, mapY, '#fde047');
                        fgChar = tile; fgColor = '#15803d'; // Green Cactus
                        break;

                    // --- DEFAULT (Plains Green) ---
                    default:
                        TileRenderer.drawBase(ctx, x, y, '#22c55e');
                        fgChar = tile;
                        break;
                }
            }

            // --- ENTITY RENDERING (OVERLAY LAYER) ---
            
            // 1. Check for Shared/Overworld Enemies at this location
            let overlayChar = null;
            let overlayColor = null;
            
            if (gameState.mapMode === 'overworld') {
                const enemyKey = `overworld:${mapX},${-mapY}`;
                const sharedEnemy = gameState.sharedEnemies[enemyKey];
                
                // FIX: Only render if it's a valid enemy in our data
                if (sharedEnemy && ENEMY_DATA[sharedEnemy.tile]) {
                    overlayChar = sharedEnemy.tile;
                    
                    // Draw Health Bar
                    const healthPercent = sharedEnemy.health / sharedEnemy.maxHealth;
                    ctx.fillStyle = '#333';
                    ctx.fillRect(x * TILE_SIZE, (y * TILE_SIZE) + TILE_SIZE - 4, TILE_SIZE, 3);
                    ctx.fillStyle = healthPercent > 0.5 ? '#4caf50' : '#ef4444';
                    ctx.fillRect(x * TILE_SIZE, (y * TILE_SIZE) + TILE_SIZE - 4, TILE_SIZE * healthPercent, 3);
                    
                    // Handle Elite Colors
                    if (sharedEnemy.isElite) {
                        ctx.strokeStyle = sharedEnemy.color || '#facc15';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                        overlayColor = sharedEnemy.color || '#ef4444';
                    } else {
                        overlayColor = '#ef4444'; // Default Red
                    }
                }
            } 
            // 2. Check for Instanced Enemies (Dungeon/Castle)
            else {
                const enemy = gameState.instancedEnemies.find(e => e.x === mapX && e.y === mapY);
                if (enemy) {
                    overlayChar = enemy.tile;
                    overlayColor = enemy.color || '#ef4444';
                    
                    if (enemy.isElite) {
                        ctx.strokeStyle = enemy.color || '#facc15';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
            }

            // 3. Draw the Overlay Character (If exists)
            // Note: We check tileShadowOpacity so we don't draw enemies in pitch blackness
            if (overlayChar && tileShadowOpacity < 0.95) {
                ctx.fillStyle = overlayColor;
                ctx.font = isWideChar(overlayChar) ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(overlayChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }

            // --- 4. SHADOW & TORCH OVERLAY ---
            if (tileShadowOpacity > 0) {
                if (gameState.mapMode === 'overworld') {
                    const colorString = getInterpolatedDayCycleColor(gameState.time.hour, gameState.time.minute);
                    const rgbMatch = colorString.match(/\d+, \d+, \d+/);
                    const rgb = rgbMatch ? rgbMatch[0] : "0, 0, 0"; 
                    ctx.fillStyle = `rgba(${rgb}, ${tileShadowOpacity})`;
                } else {
                    ctx.fillStyle = `rgba(0, 0, 0, ${tileShadowOpacity})`;
                }
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            // Warm Torch Tint (Only apply if we are visible and it's dark)
            // --- DYNAMIC LIGHTING TINT ---
            // Only apply tint if we are visible and it's somewhat dark
            if (ambientLight > 0.3 && tileShadowOpacity < 0.5) {
                
                // 1. Determine Light Color based on Location
                let r = 255, g = 180, b = 100; // Default Warm Orange (Torch)

                if (gameState.mapMode === 'dungeon') {
                    const theme = chunkManager.caveThemes[gameState.currentCaveId];
                    if (theme === 'ICE' || theme === 'CRYSTAL') {
                        r = 100; g = 240; b = 255; // Cold Cyan ❄️
                    } else if (theme === 'SWAMP' || theme === 'GROTTO') {
                        r = 50; g = 255; b = 50;   // Eerie Green 🤢
                    } else if (theme === 'FIRE') {
                        r = 255; g = 80; b = 50;   // Angry Red 🔥
                    } else if (theme === 'VOID' || theme === 'ABYSS') {
                        r = 180; g = 50; b = 255;  // Dark Purple 🔮
                    } else if (theme === 'CRYPT') {
                        r = 150; g = 150; b = 200; // Ghostly Blue/Grey 👻
                    }
                } 
                else if (gameState.mapMode === 'overworld') {
                    // Optional: Tint based on biome!
                    // Check the tile under the player
                    const pTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
                    if (pTile === '≈') { // Swamp
                        r = 100; g = 200; b = 100; 
                    } else if (pTile === 'd' || pTile === 'D') { // Deadlands/Desert
                        r = 200; g = 200; b = 180; // Desaturated Dust
                    } else if (gameState.weather === 'storm') {
                        r = 100; g = 100; b = 150; // Stormy Blue
                    }
                }

                // 2. Apply the Tint
                // Calculate intensity based on distance from center (brighter in center)
                const tintStrength = (1 - (distToPlayer / effectiveRadius)) * 0.15;
                
                if (tintStrength > 0) {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${tintStrength})`;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // --- Draw Characters/Particles (Overlay) ---
    // (Keep the existing drawing logic for NPCs, Companion, Other Players, Self)
    // ...
    if (gameState.mapMode === 'castle' && gameState.friendlyNpcs) {
        gameState.friendlyNpcs.forEach(npc => {
            const screenX = (npc.x - startX) * TILE_SIZE;
            const screenY = (npc.y - startY) * TILE_SIZE;
            if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
                ctx.fillStyle = '#FFFFFF'; 
                ctx.fillText(npc.tile, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
            }
        });
    }

    if (gameState.player.companion) {
        const comp = gameState.player.companion;
        const screenX = (comp.x - startX) * TILE_SIZE;
        const screenY = (comp.y - startY) * TILE_SIZE;
        if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
            ctx.fillStyle = '#06b6d4'; 
            ctx.fillText(comp.tile, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
        }
    }

    for (const id in otherPlayers) {
        if (otherPlayers[id].mapMode !== gameState.mapMode || otherPlayers[id].mapId !== (gameState.currentCaveId || gameState.currentCastleId)) continue;
        const op = otherPlayers[id];
        const screenX = (op.x - startX) * TILE_SIZE;
        const screenY = (op.y - startY) * TILE_SIZE;
        if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
            ctx.fillStyle = '#f97316';
            ctx.fillText('@', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
            if (op.email) {
                ctx.font = '10px monospace';
                ctx.fillStyle = '#fff';
                ctx.fillText(op.email.split('@')[0], screenX + TILE_SIZE/2, screenY - 5);
                ctx.font = `${TILE_SIZE}px monospace`;
            }
        }
    }

    const playerChar = gameState.player.isBoating ? 'c' : gameState.player.character;
    const style2 = getComputedStyle(document.documentElement);
    const playerColor = style2.getPropertyValue('--player-color');
    ctx.font = `bold ${TILE_SIZE}px monospace`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(playerChar, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);
    ctx.fillStyle = playerColor;
    ctx.fillText(playerChar, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);
    ctx.font = `${TILE_SIZE}px monospace`;

    // --- WEATHER RENDERING ---
    const intensity = gameState.player.weatherIntensity || 0;
    
    if (intensity > 0 && gameState.weather !== 'clear') {
        
        ctx.save(); // Save canvas state to safely use transparency
        ctx.globalAlpha = intensity; // Master fader for weather effects

        if (gameState.weather === 'rain') {
            // Darken sky
            ctx.fillStyle = 'rgba(0, 0, 100, 0.2)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Raindrops
            ctx.strokeStyle = 'rgba(120, 140, 255, 0.6)';
            ctx.lineWidth = 1;
            const dropCount = Math.floor(200 * intensity); // Up to 200 drops
            
            for(let i=0; i < dropCount; i++) {
                 const rx = Math.random() * canvas.width;
                 const ry = Math.random() * canvas.height;
                 const len = 10 + Math.random() * 10;
                 ctx.beginPath(); 
                 ctx.moveTo(rx, ry); 
                 ctx.lineTo(rx - 5, ry + len); // Angled rain
                 ctx.stroke();
            }
        } 
        else if (gameState.weather === 'snow') {
            // Whiteout effect
            ctx.fillStyle = 'rgba(200, 200, 220, 0.15)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            const flakeCount = Math.floor(150 * intensity);
            
            for(let i=0; i < flakeCount; i++) {
                 const rx = Math.random() * canvas.width;
                 const ry = Math.random() * canvas.height;
                 const size = Math.random() * 2 + 1;
                 ctx.fillRect(rx, ry, size, size);
            }
        } 
        else if (gameState.weather === 'storm') {
            // Dark Storm
            ctx.fillStyle = 'rgba(10, 10, 30, 0.4)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Heavy Rain
            ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            const dropCount = Math.floor(300 * intensity);
            
            for(let i=0; i < dropCount; i++) {
                 const rx = Math.random() * canvas.width;
                 const ry = Math.random() * canvas.height;
                 ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 15); ctx.stroke();
            }
            
            // Random Lightning Flash (Visual only)
            if (Math.random() < 0.05 * intensity) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } 
        else if (gameState.weather === 'fog') {
            ctx.fillStyle = `rgba(200, 200, 200, ${0.5 * intensity})`; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.restore(); // Restore opacity for UI/Text
    }

    if (gameState.mapMode === 'overworld') {
        const elev = elevationNoise.noise(gameState.player.x / 70, gameState.player.y / 70);
        const moist = moistureNoise.noise(gameState.player.x / 50, gameState.player.y / 50);
        let tintColor = null;
        if (elev > 0.6 && moist < 0.3) tintColor = 'rgba(50, 0, 0, 0.1)'; 
        else if (moist < 0.15) tintColor = 'rgba(255, 100, 0, 0.05)'; 
        else if (elev < 0.35 || (elev < 0.4 && moist > 0.7)) tintColor = 'rgba(0, 50, 0, 0.1)'; 
        else if (elev > 0.8) tintColor = 'rgba(200, 200, 255, 0.1)'; 

        if (tintColor) {
            ctx.fillStyle = tintColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.draw(ctx, startX, startY);
    }

    // --- BOSS HEALTH BAR UI ---
    // Check if there is an active boss in the current instance
    if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
        const activeBoss = gameState.instancedEnemies.find(e => e.isBoss);
        
        if (activeBoss) {
            const barWidth = canvas.width * 0.6; // 60% of screen width
            const barHeight = 20;
            const barX = (canvas.width - barWidth) / 2; // Center it
            const barY = 40; // Near the top

            // 1. Draw Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(activeBoss.name, canvas.width / 2, barY - 10);

            // 2. Draw Background (Black)
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // 3. Draw Health (Red)
            const healthPercent = Math.max(0, activeBoss.health / activeBoss.maxHealth);
            ctx.fillStyle = '#dc2626'; // Deep Red
            ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * healthPercent, barHeight - 4);

            // 4. Draw Text (HP / Max)
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(`${activeBoss.health} / ${activeBoss.maxHealth}`, canvas.width / 2, barY + 14);
        }
    }
};

function syncPlayerState() {
    if (onlinePlayerRef) {
        const stateToSync = {
            x: gameState.player.x,
            y: gameState.player.y,
            health: gameState.player.health,
            maxHealth: gameState.player.maxHealth,
            mapMode: gameState.mapMode,
            mapId: gameState.currentCaveId || gameState.currentCastleId || null,
            email: auth.currentUser.email
        };
        onlinePlayerRef.set(stateToSync);
    }
}

/**
 * Calculates the natural terrain for a specific coordinate
 * based on the world seed noises.
 */
function getBaseTerrain(worldX, worldY) {
    // Recalculate noise values for this specific spot
    const elev = elevationNoise.noise(worldX / 70, worldY / 70);
    const moist = moistureNoise.noise(worldX / 50, worldY / 50);

    // Return the correct biome character
    if (elev < 0.35) return '~'; // Water
    if (elev < 0.4 && moist > 0.7) return '≈'; // Swamp
    if (elev > 0.8) return '^'; // Mountain
    if (elev > 0.6 && moist < 0.3) return 'd'; // Deadlands
    if (moist < 0.15) return 'D'; // Desert
    if (moist > 0.55) return 'F'; // Forest
    return '.'; // Plains
}

async function processOverworldEnemyTurns() {
    // 1. Define search area around player (e.g., 30x30 box)
    const searchRadius = 15;
    const playerX = gameState.player.x;
    const playerY = gameState.player.y;

    let nearestEnemyDir = null;
    let minDist = Infinity;
    const HEARING_DISTANCE_SQ = 15 * 15; // "Hearing" range

    // A list to batch our updates for efficiency
    let movesToMake = [];

    const movedEnemies = new Set();

    // --- Chance for an enemy to chase you ---
    const CHASE_CHANCE = 0.5; // 50% chance to chase

    // 2. Loop through the search box
    for (let y = playerY - searchRadius; y <= playerY + searchRadius; y++) {
        for (let x = playerX - searchRadius; x <= playerX + searchRadius; x++) {
            // Don't move the tile the player is on
            if (x === playerX && y === playerY) continue;

            const tile = chunkManager.getTile(x, y);

            // 3. Is this tile an enemy?
            if (ENEMY_DATA[tile]) {

                const enemyId = `overworld:${x},${-y}`; // Construct ID
                if (movedEnemies.has(enemyId)) continue; // Skip if already moved

                // 4. Try to move it (75% chance)
                if (Math.random() < 0.75) {

                    let dirX, dirY;

                    // --- NEW CHASE LOGIC ---
                    if (Math.random() < CHASE_CHANCE) {
                        // CHASE: Move directly towards the player
                        dirX = Math.sign(playerX - x);
                        dirY = Math.sign(playerY - y);
                    } else {
                        // WANDER: Move randomly
                        dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                        dirY = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    }
                    // --- END NEW LOGIC ---

                    if (dirX === 0 && dirY === 0) continue;

                    const newX = x + dirX;
                    const newY = y + dirY;

                    // 5. Is the new spot valid?
                    const targetTile = chunkManager.getTile(newX, newY);

                    let canMove = false;

                    // 1. General Rule: Most enemies can only move on Plains ('.') or Dungeon Floors
                    // Since this is overworld, we usually just check for '.'
                    if (targetTile === '.') {
                        canMove = true; 
                    }

                    // 2. Specific Overrides
                    if (tile === 'w') { // Wolves
                        // Wolves can ALSO move in forests
                        if (targetTile === 'F') canMove = true;
                    }

                    if (canMove) { 

                        // If the enemy tries to move ONTO the player, hit them instead!
                        if (newX === playerX && newY === playerY) {
                            const enemyAtk = ENEMY_DATA[tile].attack;
                            const dmg = Math.max(1, enemyAtk - (gameState.player.defenseBonus || 0)); // Simple calc
                            gameState.player.health -= dmg;
                            logMessage(`A ${ENEMY_DATA[tile].name} moves in and attacks you for ${dmg} damage!`);
                            triggerStatFlash(statDisplays.health, false);
                            
                            // Don't move the enemy, they used their turn to attack
                            continue; 
                        }

                        const newEnemyId = `overworld:${newX},${-newY}`;
                        movedEnemies.add(newEnemyId);

                        movesToMake.push({
                            oldX: x,
                            oldY: y,
                            newX: newX,
                            newY: newY,
                            tile: tile
                        });

                        const distSq = Math.pow(newX - playerX, 2) + Math.pow(newY - playerY, 2);
                        if (distSq < minDist && distSq < HEARING_DISTANCE_SQ) {
                            minDist = distSq;
                            const dirX = Math.sign(newX - playerX);
                            const dirY = Math.sign(newY - playerY);
                            nearestEnemyDir = { x: dirX, y: dirY };
                        }

                        // 8. Check if it's "nearby" for the log message
                        const distY = Math.abs(newY - playerY);
                        const distX = Math.abs(newX - playerX);
                        
                    }
                }
            }
        }
    }

    // --- Process all moves ---
    for (const move of movesToMake) {
        // 1. Define the database paths
        const oldId = `overworld:${move.oldX},${-move.oldY}`;
        const newId = `overworld:${move.newX},${-move.newY}`;
        const oldRef = rtdb.ref(`worldEnemies/${oldId}`);
        const newRef = rtdb.ref(`worldEnemies/${newId}`);

        // 2. Move data in RTDB (The Entity Layer)
        // We do NOT touch chunkManager.setWorldTile here. 
        // This prevents the "Bulldozer" effect. The terrain remains untouched.
        
        try {
            const snapshot = await oldRef.once('value');
            const healthData = snapshot.val();

            if (healthData) {
                // Move the enemy data to the new coordinate key
                await newRef.set(healthData);
                // Remove from old coordinate key
                await oldRef.remove();
                
                // If the static map currently has this enemy tile 'baked in' from generation,
                // we can gently clean it. But we check first to ensure we don't delete an item.
                const currentStaticTile = chunkManager.getTile(move.oldX, move.oldY);
                if (currentStaticTile === move.tile) {
                    // Only restore base terrain if the tile matches the enemy exactly.
                    // This cleans up "ghost" enemies from the static map.
                    const baseTerrain = getBaseTerrain(move.oldX, move.oldY);
                    chunkManager.setWorldTile(move.oldX, move.oldY, baseTerrain);
                }
            }
        } catch (err) {
            console.error("Enemy move failed:", err);
        }
    }

    return nearestEnemyDir;
}

function processFriendlyTurns() {
    if (gameState.mapMode !== 'castle') return;

    const map = chunkManager.castleMaps[gameState.currentCastleId];
    if (!map) return;

    const player = gameState.player;

    gameState.friendlyNpcs.forEach(npc => {
        // 50% chance to move
        if (Math.random() < 0.5) {
            const dirX = Math.floor(Math.random() * 3) - 1;
            const dirY = Math.floor(Math.random() * 3) - 1;

            if (dirX === 0 && dirY === 0) return;

            const newX = npc.x + dirX;
            const newY = npc.y + dirY;

            // Check bounds and collision
            // Must be a floor '.', and not occupied by player or another NPC
            if (map[newY] && map[newY][newX] === '.') {
                const occupiedByPlayer = (newX === player.x && newY === player.y);
                const occupiedByNpc = gameState.friendlyNpcs.some(n => n.x === newX && n.y === newY);

                if (!occupiedByPlayer && !occupiedByNpc) {
                    npc.x = newX;
                    npc.y = newY;
                }
            }
        }
    });
}

function processEnemyTurns() {
    // This function only runs for dungeon/castle enemies
    if (gameState.mapMode !== 'dungeon' && gameState.mapMode !== 'castle') {
        return null;
    }

    // Get the correct map and theme
    let map;
    let theme;
    if (gameState.mapMode === 'dungeon') {
        map = chunkManager.caveMaps[gameState.currentCaveId];
        theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
    } else {
        map = chunkManager.castleMaps[gameState.currentCastleId];
        theme = { floor: '.' }; 
    }

    if (!map) return null;

    let nearestEnemyDir = null;
    let minDist = Infinity;
    const HEARING_DISTANCE_SQ = 15 * 15;
    const player = gameState.player; // <--- This is the ONLY declaration of 'player'

    // Helper: Check if a tile is free
    const isWalkable = (tx, ty) => {
        return map[ty] && map[ty][tx] === theme.floor;
    };

    // Loop through a copy so we can modify the original list safely
    const enemiesToMove = [...gameState.instancedEnemies];

    enemiesToMove.forEach(enemy => {

        // --- 1. STATUS EFFECTS (Turn Skips) ---
        if (enemy.rootTurns > 0) {
            enemy.rootTurns--;
            logMessage(`The ${enemy.name} struggles against roots!`);
            if (enemy.rootTurns === 0) logMessage(`The ${enemy.name} breaks free.`);
            return; 
        }
        if (enemy.stunTurns > 0) {
            enemy.stunTurns--;
            logMessage(`The ${enemy.name} is stunned!`);
            return; 
        }

        // --- 2. MADNESS LOGIC (Forced Fleeing) ---
        if (enemy.madnessTurns > 0) {
            enemy.madnessTurns--;
            // Move AWAY from player
            const fleeDirX = -Math.sign(player.x - enemy.x);
            const fleeDirY = -Math.sign(player.y - enemy.y);
            const newX = enemy.x + fleeDirX;
            const newY = enemy.y + fleeDirY;

            if (isWalkable(newX, newY)) {
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX;
                enemy.y = newY;
                logMessage(`The ${enemy.name} flees in terror!`);
            } else {
                logMessage(`The ${enemy.name} cowers in the corner!`);
            }

            if (enemy.madnessTurns === 0) logMessage(`The ${enemy.name} regains its senses.`);
            return; // Turn Over
        }

        // --- 3. BOSS & ELITE LOGIC ---
        if (enemy.isBoss) {
            // Boss Immunity
            if ((enemy.poisonTurns > 0 || enemy.rootTurns > 0) && Math.random() < 0.5) {
                enemy.poisonTurns = 0; enemy.rootTurns = 0;
                logMessage(`The ${enemy.name} shrugs off your magic!`);
            }
            // Boss Summon (20% chance)
            const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
            if (dist < 10 && Math.random() < 0.20) {
                const offsets = [[-1,0],[1,0],[0,-1],[0,1]];
                for(let ofs of offsets) {
                    const sx = enemy.x + ofs[0];
                    const sy = enemy.y + ofs[1];
                    if (isWalkable(sx, sy)) {
                        map[sy][sx] = 's';
                        const t = ENEMY_DATA['s'];
                        gameState.instancedEnemies.push({
                            id: `${gameState.currentCaveId}:minion_${Date.now()}`,
                            x: sx, y: sy, tile: 's', name: "Summoned Skeleton",
                            health: t.maxHealth, maxHealth: t.maxHealth, attack: t.attack, defense: t.defense, xp: 0
                        });
                        logMessage(`The ${enemy.name} summons a Skeleton!`);
                        return; // Turn used
                    }
                }
            }
            // Boss Panic Teleport
            if (enemy.health < enemy.maxHealth * 0.5 && Math.random() < 0.25) {
                const tx = Math.max(1, Math.min(map[0].length - 2, enemy.x + (Math.floor(Math.random()*10)-5)));
                const ty = Math.max(1, Math.min(map.length - 2, enemy.y + (Math.floor(Math.random()*10)-5)));
                if (isWalkable(tx, ty)) {
                    map[enemy.y][enemy.x] = theme.floor;
                    map[ty][tx] = enemy.tile;
                    enemy.x = tx; enemy.y = ty;
                    logMessage(`The ${enemy.name} vanishes in mist!`);
                    return;
                }
            }
        }

        // Void Stalker Teleport
        if (enemy.teleporter) {
            const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
            if (dist > 1.5 && Math.random() < 0.20) {
                const offsets = [[-1,0], [1,0], [0,-1], [0,1]];
                const pick = offsets[Math.floor(Math.random() * offsets.length)];
                const tx = player.x + pick[0];
                const ty = player.y + pick[1];
                if (isWalkable(tx, ty)) {
                    const occupied = gameState.instancedEnemies.some(e => e.x === tx && e.y === ty);
                    if (!occupied) {
                        map[enemy.y][enemy.x] = theme.floor;
                        map[ty][tx] = enemy.tile;
                        enemy.x = tx; enemy.y = ty;
                        logMessage(`The ${enemy.name} blinks through the void!`);
                        return;
                    }
                }
            }
        }

        // --- 4. DAMAGE STATUS EFFECTS ---
        if (enemy.frostbiteTurns > 0) {
            enemy.frostbiteTurns--;
            if (enemy.frostbiteTurns === 0) logMessage(`The ${enemy.name} is no longer frostbitten.`);
            if (Math.random() < 0.25) {
                logMessage(`The ${enemy.name} is frozen solid and skips its turn!`);
                return;
            }
        }

        if (enemy.poisonTurns > 0) {
            enemy.poisonTurns--;
            enemy.health -= 1;
            logMessage(`The ${enemy.name} takes poison damage.`);
            if (enemy.health <= 0) {
                logMessage(`The ${enemy.name} succumbs to poison!`);
                registerKill(enemy);
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                map[enemy.y][enemy.x] = generateEnemyLoot(player, enemy);
                return; 
            }
            if (enemy.poisonTurns === 0) logMessage(`The ${enemy.name} is no longer poisoned.`);
        }

        // --- 5. COMBAT LOGIC ---
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx*dx + dy*dy;
        const dist = Math.sqrt(distSq);

        // Melee Attack (Range 1)
        if (distSq <= 2) {
            const armorDefense = player.equipment.armor ? player.equipment.armor.defense : 0;
            const baseDefense = Math.floor(player.dexterity / 5);
            const buffDefense = player.defenseBonus || 0;
            const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
            const totalDefense = baseDefense + armorDefense + buffDefense + talentDefense;
            
            let dodgeChance = Math.min(player.luck * 0.002, 0.25);
                if (player.talents && player.talents.includes('evasion')) {
                dodgeChance += 0.10;
            }

        if (Math.random() < dodgeChance) {
            logMessage(`The ${enemy.name} attacks, but you dodge!`);

                ParticleSystem.createFloatingText(player.x, player.y, "Dodge!", "#3b82f6");

            } else {
                let dmg = Math.max(1, enemy.attack - totalDefense);
                // Shield Absorb
                if (player.shieldValue > 0) {
                    const absorb = Math.min(player.shieldValue, dmg);
                    player.shieldValue -= absorb;
                    dmg -= absorb;
                    logMessage(`Shield absorbs ${absorb} damage!`);
                    if (player.shieldValue === 0) logMessage("Your Arcane Shield shatters!");
                }
                if (dmg > 0) {
                    player.health -= dmg;
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} hits you for ${dmg} damage!`);

                    ParticleSystem.createFloatingText(player.x, player.y, `-${dmg}`, '#ef4444');
                }
                // Thorns Reflect
                if (player.thornsValue > 0) {
                    enemy.health -= player.thornsValue;
                    logMessage(`The ${enemy.name} takes ${player.thornsValue} thorn damage!`);
                    if (enemy.health <= 0) {
                        registerKill(enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                        map[enemy.y][enemy.x] = generateEnemyLoot(player, enemy);
                    }
                }
            }
            // Check Death
            if (player.health <= 0) {
                player.health = 0;
                logMessage("You have perished!");
                syncPlayerState();
                document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
                document.getElementById('finalCoinsDisplay').textContent = `Gold: ${player.coins}`;
                gameOverModal.classList.remove('hidden');
            }
            return; // Turn Over
        }

        // Caster Attack (Range Check)
        const castRangeSq = Math.pow(enemy.castRange || 6, 2);
        if (enemy.caster && distSq <= castRangeSq && Math.random() < 0.20) {
             const spellDmg = Math.max(1, enemy.spellDamage || 1);
             
             let spellName = "spell";
             if (enemy.tile === 'm') spellName = "Arcane Bolt";
             if (enemy.tile === 'Z') spellName = "Frost Shard";
             if (enemy.tile === '@') spellName = "Poison Spit";

             if (Math.random() < Math.min(player.luck * 0.002, 0.25)) {
                 logMessage(`The ${enemy.name} fires a ${spellName}, but you dodge!`);
             } else {
                 let dmg = spellDmg;
                 if (player.shieldValue > 0) {
                     const absorb = Math.min(player.shieldValue, dmg);
                     player.shieldValue -= absorb;
                     dmg -= absorb;
                     logMessage(`Shield absorbs ${absorb} magic damage!`);
                 }
                 if (dmg > 0) {
                     player.health -= dmg;
                     triggerStatFlash(statDisplays.health, false);
                     logMessage(`The ${enemy.name} casts ${spellName} for ${dmg} damage!`);
                     
                     if (enemy.inflicts === 'frostbite') player.frostbiteTurns = 5;
                     if (enemy.inflicts === 'poison') player.poisonTurns = 5;
                 }
             }
             if (player.health <= 0) {
                player.health = 0;
                logMessage("You have perished!");
                syncPlayerState();
                document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
                document.getElementById('finalCoinsDisplay').textContent = `Gold: ${player.coins}`;
                gameOverModal.classList.remove('hidden');
            }
             return;
        }

        // --- 6. NEW TACTICAL MOVEMENT ---
        
        let desiredX = 0;
        let desiredY = 0;
        let moveType = 'chase';

        // A. Fleeing Logic (Low Health + Not Undead)
        const isFearless = ['s', 'Z', 'D', 'v', 'a', 'm'].includes(enemy.tile) || enemy.isBoss;
        if (!isFearless && (enemy.health < enemy.maxHealth * 0.25)) {
            moveType = 'flee';
        } 
        // B. Kiting Logic (Casters stay at range 3-4)
        else if (enemy.caster && dist < 3.5) {
            moveType = 'flee'; 
        }

        if (moveType === 'flee') {
            desiredX = -Math.sign(dx);
            desiredY = -Math.sign(dy);
            if (desiredX === 0) desiredX = Math.random() < 0.5 ? 1 : -1;
            if (desiredY === 0) desiredY = Math.random() < 0.5 ? 1 : -1;
        } else {
            desiredX = Math.sign(dx);
            desiredY = Math.sign(dy);
        }

        // Smart Pathing: Try Primary -> Secondary -> Slide
        let moveX = 0, moveY = 0;
        let madeMove = false;

        // Try ideal Diagonal first
        if (isWalkable(enemy.x + desiredX, enemy.y + desiredY)) {
            moveX = desiredX; moveY = desiredY; madeMove = true;
        } 
        // If diagonal blocked, slide along axis
        else {
            if (Math.abs(dx) > Math.abs(dy)) {
                // X Priority
                if (desiredX !== 0 && isWalkable(enemy.x + desiredX, enemy.y)) {
                    moveX = desiredX; moveY = 0; madeMove = true;
                } else if (desiredY !== 0 && isWalkable(enemy.x, enemy.y + desiredY)) {
                    moveX = 0; moveY = desiredY; madeMove = true;
                }
            } else {
                // Y Priority
                if (desiredY !== 0 && isWalkable(enemy.x, enemy.y + desiredY)) {
                    moveX = 0; moveY = desiredY; madeMove = true;
                } else if (desiredX !== 0 && isWalkable(enemy.x + desiredX, enemy.y)) {
                    moveX = desiredX; moveY = 0; madeMove = true;
                }
            }
        }

        if (madeMove) {
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;
            
            // Check for collision with other enemies
            const occupied = gameState.instancedEnemies.some(e => e.x === newX && e.y === newY);
            if (!occupied) {
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX;
                enemy.y = newY;

                // Update intuition hint
                const newDistSq = Math.pow(newX - player.x, 2) + Math.pow(newY - player.y, 2);
                if (newDistSq < minDist && newDistSq < HEARING_DISTANCE_SQ) {
                    minDist = newDistSq;
                    nearestEnemyDir = { x: Math.sign(newX - player.x), y: Math.sign(newY - player.y) };
                }
                
                if (moveType === 'flee') {
                    logMessage(`The ${enemy.name} retreats!`);
                }
            }
        }
    });

    return nearestEnemyDir;
}

/**
 * Asynchronously runs the AI turns for shared maps.
 * Uses a Firebase RTDB lock to ensure only one client
 * runs the AI at a time.
 */

async function runSharedAiTurns() {
    let nearestEnemyDir = null;

    if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
        // Dungeons/castles are instanced, no lock needed.
        nearestEnemyDir = processEnemyTurns();

        render();

    } else if (gameState.mapMode === 'overworld') {
        // Overworld is shared. We need a lock.
        const lockRef = rtdb.ref('world/aiTurnLock');
        const now = Date.now();
        const LOCK_DURATION_MS = 5000; // 5 second lock

        try {
            const transactionResult = await lockRef.transaction(currentLockTime => {
                if (currentLockTime === null || currentLockTime < (now - LOCK_DURATION_MS)) {
                    // Lock is free or expired, take it.
                    return now;
                }
                // Lock is held by someone else, abort.
                return; // undefined aborts the transaction
            });

            if (transactionResult.committed) {
                // We got the lock!
                // console.log("Acquired AI lock, running overworld enemy turns...");

                // We MUST await this so we hold the lock until the AI is done.
                nearestEnemyDir = await processOverworldEnemyTurns();

                // Release the lock so the next player can run it.
                await lockRef.set(null);

            } else {
                // Someone else is running the AI. Do nothing.
                // console.log("AI lock held by another player.");
            }

        } catch (error) {
            console.error("AI Lock transaction failed: ", error);
            // If the transaction fails, release our lock just in case.
            await lockRef.set(null);
        }
    }

    if (nearestEnemyDir) {
        const player = gameState.player;
        // 0.5% chance per intuition point, max 50%
        const intuitChance = Math.min(player.intuition * 0.005, 0.5); 

        if (Math.random() < intuitChance) {
            // Success! Give specific direction.
            const dirString = getDirectionString(nearestEnemyDir);
            logMessage(`You sense a hostile presence to the ${dirString}!`);
        } else if (Math.random() < 0.1) { 
            // Fail. Only show vague message 10% of the time to reduce spam.
            logMessage("You hear a shuffle nearby...");
        }
    }
}

function getPlayerDamageModifier(baseDamage) {
    const player = gameState.player;
    let finalDamage = baseDamage;

    // --- BERSERKER: BLOOD RAGE ---
    // If Health is below 50%, deal double damage
    if (player.talents && player.talents.includes('blood_rage')) {
        if ((player.health / player.maxHealth) < 0.5) {
            finalDamage = Math.floor(finalDamage * 2);
            // 20% chance to show a message to avoid spam
            if (Math.random() < 0.2) logMessage("Blood Rage fuels your strike!");
        }
    }

    // --- ASSASSIN: SHADOW STRIKE ---
    // If Stealth is active, deal 4x damage
    if (player.talents && player.talents.includes('shadow_strike')) {
        if (player.stealthTurns > 0) {
            finalDamage = Math.floor(finalDamage * 4);
            logMessage("Shadow Strike! (4x Damage)");
            
            // Breaking stealth is handled in the attack logic, 
            // but the damage boost happens here.
        }
    }

    return finalDamage;
}

function endPlayerTurn() {

// --- LIGHT SURVIVAL MECHANICS ---
    const player = gameState.player;

    // Base drain rates (Standard difficulty)
    let hungerDrain = 0.02; // You lose 1 hunger every 50 turns. (Very slow)
    let thirstDrain = 0.05; // You lose 1 thirst every 20 turns. (Manageable)

    // Grace Period (Level 1-2)
    if (player.level < 3) {
        hungerDrain = 0.005; // Effectively zero
        thirstDrain = 0.01;
    }

    // --- LICH: UNDEATH ---
    if (!player.talents || !player.talents.includes('undeath')) {
        player.hunger = Math.max(0, player.hunger - hungerDrain);
        player.thirst = Math.max(0, player.thirst - thirstDrain);
    }

    // --- ENVIRONMENTAL HAZARDS ---
    const currentTile = chunkManager.getTile(player.x, player.y);
    const inDungeon = gameState.mapMode === 'dungeon';
    const currentTheme = inDungeon ? CAVE_THEMES[gameState.currentCaveTheme] : null;

    // 1. LAVA (Volcano Biome)
    if (inDungeon && gameState.currentCaveTheme === 'FIRE' && (currentTile === '~' || currentTile === '≈')) {
        
        const hasArmor = player.equipment.armor && player.equipment.armor.name.includes('Dragonscale');
        const hasPotion = player.fireResistTurns > 0; // Check potion buff

        if (!hasArmor && !hasPotion) { // Check both
            logMessage("The lava burns you! (2 Dmg)");
            player.health -= 2;
            triggerStatFlash(statDisplays.health, false);
            ParticleSystem.createFloatingText(player.x, player.y, "BURN", "#ef4444");
        }
    }

    // 2. DROWNING (Sunken Temple / Deep Water)
    if (currentTile === '~') {
        const hasGills = player.waterBreathingTurns > 0;

        // If you are in Deep Water AND don't have gills...
        if (!hasGills) {
            logMessage("Your gills vanish. The water fills your lungs...");
            logMessage("You have drowned.");
            
            // INSTANT DEATH
            player.health = 0; 
            
            // Visuals
            triggerStatFlash(statDisplays.health, false);
            ParticleSystem.createFloatingText(player.x, player.y, "☠️", "#1e3a8a");
        }
    }

    // --- 1. THE BONUSES (Vitality) ---
    // If stats are high (>80%), you regenerate naturally!
    let regenBonus = false;
    
    if (player.hunger > 80 && player.health < player.maxHealth && gameState.playerTurnCount % 5 === 0) {
        player.health++; // Free healing every 5 turns
        logMessage("Well Fed: You regenerate 1 Health.");
        triggerStatFlash(statDisplays.health, true);

        ParticleSystem.createFloatingText(player.x, player.y, "♥", "#22c55e"); // Heart icon!

        regenBonus = true;
    }
    
    if (player.thirst > 80 && player.stamina < player.maxStamina && gameState.playerTurnCount % 3 === 0) {
        player.stamina++; // Free energy every 3 turns
        logMessage("Hydrated: You regenerate 1 Stamina.");
        triggerStatFlash(statDisplays.stamina, true);
        regenBonus = true;
    }

    // --- 2. THE PENALTIES (Weakness) ---
    // If stats hit 0, you don't die, you just stop regenerating via Time/Rest
    // We handle the "Stop Regen" in the Time Listener below.
    if (player.hunger <= 0 && gameState.playerTurnCount % 10 === 0) {
        logMessage("Your stomach growls. You feel weak. (No HP Regen)");
    }
    if (player.thirst <= 0 && gameState.playerTurnCount % 10 === 0) {
        logMessage("Your throat is parched. You feel sluggish. (No Stamina Regen)");
    }

    gameState.playerTurnCount++; // Increment the player's turn

    updateWeather();

    // --- STORM LIGHTNING STRIKES ---
    if (gameState.mapMode === 'overworld' && gameState.weather === 'storm') {
        // 15% chance of a lightning strike per turn
        if (Math.random() < 0.15) {
            // Pick a random spot near the player
            const rx = gameState.player.x + Math.floor(Math.random() * 20) - 10;
            const ry = gameState.player.y + Math.floor(Math.random() * 20) - 10;
            
            // Visual Effect
            logMessage("⚡ CRACK! Lightning strikes nearby!");
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(rx, ry, '#facc15', 10);
            }

            // Check if Player was hit!
            if (rx === gameState.player.x && ry === gameState.player.y) {
                logMessage("You were struck by lightning!! (10 Dmg)");
                gameState.player.health -= 10;
                triggerStatFlash(statDisplays.health, false);
            } 
            else {
                // Check if Enemy was hit (re-use spell logic for convenience)
                // We fake a 'thunderbolt' cast by nature to damage enemies
                // We use 10 flat damage
                applySpellDamage(rx, ry, 10, 'thunderbolt');
            }
        }
    }

    let updates = {};

    // --- 1. Tick Status Effects ---
    if (player.poisonTurns > 0) {
        player.poisonTurns--;
        player.health -= 1; // Poison deals 1 damage
        logMessage("You take 1 poison damage...");
        triggerStatFlash(statDisplays.health, false);

        ParticleSystem.createFloatingText(player.x, player.y, "-1", "#22c55e"); // Green text for poison

        updates.health = player.health;
        updates.poisonTurns = player.poisonTurns;
        if (player.poisonTurns === 0) {
            logMessage("The poison has worn off.");
        }
    }

    if (player.waterBreathingTurns > 0) {
        player.waterBreathingTurns--;
        updates.waterBreathingTurns = player.waterBreathingTurns;
        if (player.waterBreathingTurns === 0) logMessage("Your gills disappear.");
    }

    if (player.frostbiteTurns > 0) {
        player.frostbiteTurns--;
        player.stamina = Math.max(0, player.stamina - 2); // Frostbite drains 2 stamina
        logMessage("Frostbite saps your stamina...");
        triggerStatFlash(statDisplays.stamina, false);
        updates.stamina = player.stamina;
        updates.frostbiteTurns = player.frostbiteTurns;
        if (player.frostbiteTurns === 0) {
            logMessage("You are no longer frostbitten.");
        }
    }
    
    if (player.strengthBonusTurns > 0) {
        player.strengthBonusTurns--;
        updates.strengthBonusTurns = player.strengthBonusTurns;

        if (player.strengthBonusTurns === 0) {
            player.strengthBonus = 0;
            logMessage("Your surge of strength fades.");
            updates.strengthBonus = 0;
        }
        renderEquipment(); // Update UI
    }

    // --- GILL POTION TIMER ---
    if (player.waterBreathingTurns > 0) {
        player.waterBreathingTurns--;
        updates.waterBreathingTurns = player.waterBreathingTurns;
        
        if (player.waterBreathingTurns === 3) {
            logMessage("Warning: Your gills are starting to close up! (3 turns left)");
        }
        if (player.waterBreathingTurns === 0) {
            // We don't need to kill them here; the drowning check at the 
            // start of the NEXT turn will handle it if they are still in water.
            logMessage("Your gills disappear.");
        }
    }

    // --- WITS BONUS TIMER ---
    if (player.witsBonusTurns > 0) {
        player.witsBonusTurns--;
        updates.witsBonusTurns = player.witsBonusTurns;

        if (player.witsBonusTurns === 0) {
            player.witsBonus = 0;
            logMessage("The clarity of mind fades.");
            updates.witsBonus = 0;
        }
        
    }

    if (player.thornsTurns > 0) {
        player.thornsTurns--;
        updates.thornsTurns = player.thornsTurns;
        if (player.thornsTurns === 0) {
            player.thornsValue = 0;
            updates.thornsValue = 0;
            logMessage("Your thorny skin softens.");
        }
    }

    if (player.fireResistTurns > 0) {
        player.fireResistTurns--;
        updates.fireResistTurns = player.fireResistTurns;
        if (player.fireResistTurns === 0) logMessage("Your fire resistance fades.");
    }

    // --- TICK COOLDOWNS ---
    if (player.cooldowns) {
        let cooldownsChanged = false;
        for (const key in player.cooldowns) {
            if (player.cooldowns[key] > 0) {
                player.cooldowns[key]--;
                cooldownsChanged = true;
            }
        }
        if (cooldownsChanged) {
            updates.cooldowns = player.cooldowns;
            renderHotbar(); // Update visuals
        }
    }

    // --- CANDLELIGHT TIMER ---
    if (player.candlelightTurns > 0) {
        player.candlelightTurns--;
        updates.candlelightTurns = player.candlelightTurns;
        
        // Warn when running low (optional, but helpful)
        if (player.candlelightTurns === 5) {
            logMessage("Your magical light is flickering...");
        }
        
        if (player.candlelightTurns === 0) {
            logMessage("Your Candlelight spell extinguishes.");
        }
    }
    
    // --- TICK STEALTH ---
    if (player.stealthTurns > 0) {
        player.stealthTurns--;
        if (player.stealthTurns === 0) {
            logMessage("You emerge from the shadows.");
        }
        updates.stealthTurns = player.stealthTurns;
    }

    // Tick down buff/debuff durations
    if (gameState.player.defenseBonusTurns > 0) {
        gameState.player.defenseBonusTurns--; // Tick down the turn

        if (gameState.player.defenseBonusTurns === 0) {
            // Buff expired
            gameState.player.defenseBonus = 0;
            logMessage("You are no longer bracing.");
            playerRef.update({
                defenseBonus: 0,
                defenseBonusTurns: 0
            });
        } else {
            // Save the new turn count
            playerRef.update({
                defenseBonusTurns: gameState.player.defenseBonusTurns,
                ...updates
            });
        }
        renderEquipment(); // Update UI (to show new turn count or remove buff)
    }

    if (gameState.player.shieldTurns > 0) {
        gameState.player.shieldTurns--; // Tick down the turn

        if (gameState.player.shieldTurns === 0) {
            // Shield expired
            gameState.player.shieldValue = 0;
            logMessage("Your Arcane Shield fades.");
            playerRef.update({
                shieldValue: 0,
                shieldTurns: 0
            });
        } else {
            // Save the new turn count
            playerRef.update({
                shieldTurns: gameState.player.shieldTurns,
                ...updates
            });
        }
        renderStats(); // Update UI (to show new turn count or remove shield)
    }

    // --- ENTITY LOGIC ---
    // These run independently of your shield or buffs
    processFriendlyTurns(); // Moves castle guards
    runCompanionTurn();     // Moves your skeleton/pet

    if (gameState.playerTurnCount % 2 === 0) {
        // Call our async AI wrapper function.
        // We don't 'await' it; just let it run in the background.
        runSharedAiTurns();
    }

    // Save any status effect changes if buffs didn't already
    if (Object.keys(updates).length > 0) {
        playerRef.update(updates);
    }

    // --- PALADIN: HOLY AURA ---
    if (player.talents && player.talents.includes('holy_aura')) {
        // Heal Companion
        if (player.companion && player.companion.hp < player.companion.maxHp) {
            player.companion.hp = Math.min(player.companion.maxHp, player.companion.hp + 2);
            if (Math.random() < 0.1) logMessage("Holy Aura heals your companion.");
        }
        // Small self-regen if critical (Last Stand)
        if (player.health < player.maxHealth * 0.3) {
             player.health += 1;
             triggerStatFlash(statDisplays.health, true);
        }
    }

    renderStats();
}

function exitToOverworld(exitMessage) {
    if (gameState.overworldExit) {
        gameState.player.x = gameState.overworldExit.x;
        gameState.player.y = gameState.overworldExit.y;
    }
    gameState.mapMode = 'overworld';
    gameState.currentCaveId = null;
    gameState.currentCastleId = null;
    gameState.overworldExit = null;

    gameState.instancedEnemies = [];

    logMessage(exitMessage);
    updateRegionDisplay();
    render();
    syncPlayerState();

    const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
    const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
    chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
}

function updateRegionDisplay() {
    if (gameState.mapMode === 'overworld') {
        const currentRegionX = Math.floor(gameState.player.x / REGION_SIZE);
        const currentRegionY = Math.floor(gameState.player.y / REGION_SIZE);
        const regionId = `${currentRegionX},${currentRegionY}`;

        const regionName = getRegionName(currentRegionX, currentRegionY);

        // --- Append coordinates ---
        const playerCoords = `(${gameState.player.x}, ${-gameState.player.y})`; // Invert Y for display
        regionDisplay.textContent = `${regionName} ${playerCoords}`; // Combine name and coords

        // Check if the region is newly discovered
        if (!gameState.discoveredRegions.has(regionId)) {
            logMessage(`You have entered ${regionName}.`); // Log only on discovery
            gameState.discoveredRegions.add(regionId);
            // Update the discovered regions in Firestore
            playerRef.update({
                discoveredRegions: Array.from(gameState.discoveredRegions)
            });
            // Grant XP for discovery
            grantXp(50);
        }
    } else if (gameState.mapMode === 'dungeon') {
        // Display the procedurally generated cave name
        regionDisplay.textContent = getCaveName(gameState.currentCaveId); //
    } else if (gameState.mapMode === 'castle') {
        // Display the procedurally generated castle name
        regionDisplay.textContent = getCastleName(gameState.currentCastleId); //
    }
}

restartButton.addEventListener('click', restartGame);

closeLoreButton.addEventListener('click', () => {
    loreModal.classList.add('hidden');
});

loreModal.addEventListener('click', (event) => {
    if (event.target === loreModal) {
        loreModal.classList.add('hidden');
    }
});

function drinkFromSource() {
    const player = gameState.player;
    
    // 1. Define offsets to check (Current tile + N/S/E/W)
    const offsets = [
        {x:0, y:0},   // Standing on
        {x:0, y:-1},  // North
        {x:0, y:1},   // South
        {x:-1, y:0},  // West
        {x:1, y:0}    // East
    ];

    let foundWater = false;
    let waterType = null;

    // 2. Scan surroundings
    for (const offset of offsets) {
        const tx = player.x + offset.x;
        const ty = player.y + offset.y;
        
        let tile;
        // Logic to get tile based on map mode
        if (gameState.mapMode === 'overworld') {
            tile = chunkManager.getTile(tx, ty);
        } else if (gameState.mapMode === 'dungeon') {
            const map = chunkManager.caveMaps[gameState.currentCaveId];
            tile = (map && map[ty]) ? map[ty][tx] : null;
        } else if (gameState.mapMode === 'castle') {
            const map = chunkManager.castleMaps[gameState.currentCastleId];
            tile = (map && map[ty]) ? map[ty][tx] : null;
        }

        // Check for water types
        if (tile === '~') { waterType = 'fresh'; foundWater = true; break; } // River/Lake
        if (tile === '≈') { waterType = 'swamp'; foundWater = true; break; } // Swamp
        if (tile === '⛲') { waterType = 'magic'; foundWater = true; break; } // Fountain
    }

    // 3. Apply Effects
    if (foundWater) {
        if (player.thirst >= player.maxThirst) {
            logMessage("You aren't thirsty.");
            return;
        }

        if (waterType === 'fresh') {
            player.thirst = Math.min(player.maxThirst, player.thirst + 50);
            logMessage("You cup your hands and drink from the water. (+50 Thirst)");
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
        } 
        else if (waterType === 'swamp') {
            player.thirst = Math.min(player.maxThirst, player.thirst + 30);
            logMessage("The water tastes foul, but it helps. (+30 Thirst)");
            
            // 20% chance of Dysentery (Poison)
            if (Math.random() < 0.2) {
                logMessage("Your stomach churns... (Poisoned)");
                player.poisonTurns = 5;
            }
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
        }
        else if (waterType === 'magic') {
            player.thirst = player.maxThirst;
            player.stamina = player.maxStamina; // Bonus!
            logMessage("The magic water revitalizes you! (Full Thirst & Stamina)");
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
        }

        // Save state
        playerRef.update({ 
            thirst: player.thirst,
            poisonTurns: player.poisonTurns,
            stamina: player.stamina 
        });
        
        // Cost 1 turn
        endPlayerTurn(); 
        renderStats();

    } else {
        logMessage("There is no water nearby to drink.");
    }
}

function handleChatCommand(message) {
    // 1. Remove the leading '/' and split into parts
    const raw = message.substring(1); // "give Rusty Sword 2"
    const parts = raw.split(' ');     // ["give", "Rusty", "Sword", "2"]
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 2. Command Switch
    switch (command) {
        
        case 'help':
        case 'commands':
            logMessage("--- Available Commands ---");
            logMessage("/who : List online players");
            logMessage("/stuck : Teleport to spawn (0,0)");
            logMessage("/tp [x] [y] : Teleport to coordinates");
            logMessage("/give [item name] [qty] : Spawn an item");
            logMessage("/heal : Full restore (Cheat)");
            logMessage("/god : Toggle God Mode (No hunger/thirst/damage)");
            break;

        case 'who':
            let onlineList = ["You"];
            for (const id in otherPlayers) {
                const p = otherPlayers[id];
                // Try to get name from email
                const name = p.email ? p.email.split('@')[0] : "Unknown";
                onlineList.push(`${name} (Lvl ${p.level || '?'})`);
            }
            logMessage(`Online Players (${onlineList.length}): ${onlineList.join(', ')}`);
            break;

        case 'stuck':
            gameState.player.x = 0;
            gameState.player.y = 0;
            exitToOverworld("You force a teleport back to the village.");
            break;

        case 'god':
            gameState.godMode = !gameState.godMode;
            if (gameState.godMode) {
                logMessage("God Mode ENABLED. You are immortal.");
                // Prevent death in damage logic by adding a check for gameState.godMode
            } else {
                logMessage("God Mode DISABLED.");
            }
            break;

        case 'heal':
            gameState.player.health = gameState.player.maxHealth;
            gameState.player.mana = gameState.player.maxMana;
            gameState.player.stamina = gameState.player.maxStamina;
            gameState.player.hunger = gameState.player.maxHunger;
            gameState.player.thirst = gameState.player.maxThirst;
            playerRef.update({
                health: gameState.player.health,
                mana: gameState.player.mana,
                stamina: gameState.player.stamina,
                hunger: gameState.player.hunger,
                thirst: gameState.player.thirst
            });
            renderStats();
            logMessage("Cheater! (Health fully restored)");
            break;

        case 'tp':
            if (args.length < 2) {
                logMessage("Usage: /tp [x] [y]");
                return;
            }
            const tx = parseInt(args[0]);
            const ty = parseInt(args[1]); // Remember y is usually inverted in display, but raw here
            
            if (isNaN(tx) || isNaN(ty)) {
                logMessage("Invalid coordinates.");
                return;
            }

            gameState.player.x = tx;
            gameState.player.y = -ty; // Invert Y to match map display logic if needed, or keep raw
            
            // Handle visual updates
            chunkManager.unloadOutOfRangeChunks(
                Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE),
                Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE)
            );
            
            logMessage(`Teleported to ${tx}, ${ty}.`);
            updateRegionDisplay();
            render();
            renderMinimap();
            syncPlayerState();
            
            playerRef.update({ x: gameState.player.x, y: gameState.player.y });
            break;

        case 'give':
            if (args.length < 1) {
                logMessage("Usage: /give [item name] [quantity]");
                return;
            }

            // Logic to handle multi-word items (e.g. "Rusty Sword")
            // Check if the last argument is a number (quantity)
            let quantity = 1;
            let itemName = "";
            
            const lastArg = args[args.length - 1];
            if (!isNaN(parseInt(lastArg))) {
                quantity = parseInt(lastArg);
                itemName = args.slice(0, -1).join(' '); // Join the rest as name
            } else {
                itemName = args.join(' '); // No number, assume name
            }

            // Case-insensitive search in ITEM_DATA
            const targetKey = Object.keys(ITEM_DATA).find(k => 
                ITEM_DATA[k].name.toLowerCase() === itemName.toLowerCase()
            );

            if (targetKey) {
                const template = ITEM_DATA[targetKey];
                
                // Add to inventory
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: template.name,
                        type: template.type,
                        quantity: quantity,
                        tile: targetKey,
                        // Copy properties if they exist
                        damage: template.damage || null,
                        defense: template.defense || null,
                        slot: template.slot || null,
                        statBonuses: template.statBonuses || null,
                        effect: template.effect // Copy function ref
                    });
                    
                    logMessage(`Spawned ${quantity}x ${template.name}.`);
                    renderInventory();
                    playerRef.update({ inventory: getSanitizedInventory() });
                } else {
                    logMessage("Inventory full!");
                }
            } else {
                logMessage(`Item '${itemName}' not found.`);
            }
            break;

        default:
            logMessage(`Unknown command: /${command}. Type /help for list.`);
            break;
    }
}

// --- CENTRAL INPUT HANDLER ---
function handleInput(key) {
    if (!player_id || gameState.player.health <= 0) return;

    // --- ESCAPE / CANCEL LOGIC ---
    if (key === 'Escape') {
        if (!helpModal.classList.contains('hidden')) { helpModal.classList.add('hidden'); return; }
        if (!loreModal.classList.contains('hidden')) { loreModal.classList.add('hidden'); return; }
        if (!inventoryModal.classList.contains('hidden')) { closeInventoryModal(); return; }
        if (!skillModal.classList.contains('hidden')) { skillModal.classList.add('hidden'); return; }
        if (!craftingModal.classList.contains('hidden')) { craftingModal.classList.add('hidden'); return; }
        
        if (gameState.isDroppingItem) {
            logMessage("Drop canceled.");
            gameState.isDroppingItem = false;
            return;
        }
        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            logMessage("Aiming canceled.");
            return;
        }
        if (gameState.inventoryMode) {
            logMessage("Exited inventory mode.");
            gameState.inventoryMode = false;
            return;
        }
        return;
    }

    if (key === 'q' || key === 'Q') {
        drinkFromSource();
        return;
    }

    // --- DROP MODE ---
    if (gameState.isDroppingItem) {
        // Mock an event object for handleItemDrop since it expects one
        handleItemDrop({ key: key, preventDefault: () => {} });
        return; 
    }

    // --- AIMING MODE ---
    if (gameState.isAiming) {
        let dirX = 0, dirY = 0;
        if (key === 'ArrowUp' || key === 'w' || key === 'W') dirY = -1;
        else if (key === 'ArrowDown' || key === 's' || key === 'S') dirY = 1;
        else if (key === 'ArrowLeft' || key === 'a' || key === 'A') dirX = -1;
        else if (key === 'ArrowRight' || key === 'd' || key === 'D') dirX = 1;

        if (dirX !== 0 || dirY !== 0) {
            const abilityId = gameState.abilityToAim; 
            // Route abilities
            if (abilityId === 'lunge') executeLunge(dirX, dirY);
            else if (abilityId === 'shieldBash' || abilityId === 'cleave' || abilityId === 'kick') executeMeleeSkill(abilityId, dirX, dirY);
            else if (SPELL_DATA[abilityId]) executeAimedSpell(abilityId, dirX, dirY); 
            else if (abilityId === 'pacify') executePacify(dirX, dirY);
            else if (abilityId === 'inflictMadness') executeInflictMadness(dirX, dirY);
            else if (abilityId === 'tame') executeTame(dirX, dirY);
            else logMessage("Unknown ability. Aiming canceled.");

            gameState.isAiming = false;
            gameState.abilityToAim = null;
        } else {
            logMessage("Invalid direction. Use D-Pad or Arrow keys.");
        }
        return; 
    }

    // --- INVENTORY MODE (USE ITEM) ---
    if (gameState.inventoryMode) {
        // Toggle Drop Mode
        if (key === 'd' || key === 'D') {
            if (gameState.player.inventory.length === 0) {
                logMessage("Inventory empty.");
                return;
            }
            logMessage("Drop Mode: Tap an item to drop.");
            gameState.isDroppingItem = true;
            closeInventoryModal(); 
            return;
        }

        const keyNum = parseInt(key);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
            const itemIndex = keyNum - 1;
            useInventoryItem(itemIndex); 
            return;
        }
        return;
    }

    // --- HOTBAR KEYS (1-5) ---
    const keyNum = parseInt(key);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 5) {
        useHotbarSlot(keyNum - 1);
        return;
    }

    // --- MENUS ---
    // --- MENUS ---
    if (key === 'i' || key === 'I') { openInventoryModal(); return; }
    if (key === 'm' || key === 'M') { openWorldMap(); return; }
    if (key === 'b' || key === 'B') { openSpellbook(); return; }
    if (key === 'k' || key === 'K') { openSkillbook(); return; }
    if (key === 'c' || key === 'C') { openCollections(); return; }
    if (key === 'p' || key === 'P') { openTalentModal(); return; }

    // --- MOVEMENT & REST ---
    let newX = gameState.player.x;
    let newY = gameState.player.y;
    let moved = false;

    switch (key) {
        case 'ArrowUp': case 'w': case 'W': newY--; moved = true; break;
        case 'ArrowDown': case 's': case 'S': newY++; moved = true; break;
        case 'ArrowLeft': case 'a': case 'A': newX--; moved = true; break;
        case 'ArrowRight': case 'd': case 'D': newX++; moved = true; break;
        case 'r': case 'R': 
            restPlayer(); 
            return;
    }

    if (moved) {
        attemptMovePlayer(newX, newY);
    }
}

// Attach the listener
document.addEventListener('keydown', (event) => {
    // 1. Ignore if typing in chat
    if (document.activeElement === chatInput) return;

    // 2. Prevent default scrolling for game keys
    // This tells the browser: "Don't scroll if I press these keys"
    const keysToBlock = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '];
    
    if (keysToBlock.includes(event.key)) {
        event.preventDefault(); 
    }

    // 3. Pass the input to the game logic
    handleInput(event.key);
});

function useInventoryItem(itemIndex) {
    const itemToUse = gameState.player.inventory[itemIndex];
    if (!itemToUse) {
        logMessage(`No item in slot ${itemIndex + 1}.`);
        return;
    }

    let itemUsed = false;

    // --- CAMPFIRE LOGIC ---
    if (itemToUse.name === 'Campfire Kit') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
        
        // Only place on flat ground (Plains, Desert, Deadlands)
        // or dungeon floors
        let valid = false;
        if (gameState.mapMode === 'overworld' && (currentTile === '.' || currentTile === 'd' || currentTile === 'D')) valid = true;
        if (gameState.mapMode === 'dungeon') valid = true; // Assume dungeon floor is stone

        if (valid) {
            logMessage("You arrange the stones and light the fire.");
            
            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(gameState.player.x, gameState.player.y, '🔥');
            } else if (gameState.mapMode === 'dungeon') {
                chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] = '🔥';
            }
            
            // Consume item
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
            
            // Force immediate render to show the fire
            render();
        } else {
            logMessage("You can't build a fire here.");
            return;
        }
    }

    else if (itemToUse.type === 'constructible') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
        
        // Cannot build on water, existing walls, or other objects
        const invalidTiles = ['~', '≈', '🧱', '+', '☒', '▓', '^'];
        
        if (invalidTiles.includes(currentTile)) {
            logMessage("You cannot build here.");
            return;
        }

        logMessage(`You place the ${itemToUse.name}.`);
        
        if (gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(gameState.player.x, gameState.player.y, itemToUse.tile);
        } else if (gameState.mapMode === 'dungeon') {
            chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] = itemToUse.tile;
        }
        
        // Consume item
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
        itemUsed = true;
        render();
    }

    // --- BOTTLE FILLING LOGIC ---
    if (itemToUse.name === 'Empty Bottle') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
        
        if (currentTile === '~' || currentTile === '≈' || currentTile === '⛲') {
            logMessage("You fill the bottle.");
            
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            
            const dirtyWater = { name: 'Dirty Water', type: 'consumable', quantity: 1, tile: '🤢', effect: ITEM_DATA['🤢'].effect };
            
            // Stack logic
            const existingDirty = gameState.player.inventory.find(i => i.name === 'Dirty Water');
            if (existingDirty) existingDirty.quantity++;
            else gameState.player.inventory.push(dirtyWater);
            
            renderInventory();
            return;
        } else {
            logMessage("Stand on water (~/≈) to fill this.");
            return;
        }
    }

    // --- VOID KEY LOGIC ---
    else if (itemToUse.name === 'Void Key') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
        
        if (currentTile === 'Ω') {
            logMessage("You insert the key into the rift...");
            logMessage("REALITY SHATTERS.");
            
            // Consume key
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;

            // --- TELEPORT TO VOID ---
            gameState.mapMode = 'dungeon';
            // Create a unique ID for this specific rift instance
            gameState.currentCaveId = `void_${gameState.player.x}_${gameState.player.y}`;
            gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
            
            // Generate the Void
            const voidMap = chunkManager.generateCave(gameState.currentCaveId);
            gameState.currentCaveTheme = 'VOID'; // Force the theme
            
            // Find entrance ('>')
            for (let y = 0; y < voidMap.length; y++) {
                const x = voidMap[y].indexOf('>');
                if (x !== -1) { gameState.player.x = x; gameState.player.y = y; break; }
            }
            
            // Setup enemies
            const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
            gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
            
            updateRegionDisplay();
            render();
            syncPlayerState();
            return; // Stop processing other logic
        } else {
            logMessage("You must be standing on a Void Rift (Ω) to use this.");
            return;
        }
    }

    else if (itemToUse.type === 'consumable') {
        if (itemToUse.effect) itemToUse.effect(gameState);
        itemToUse.quantity--;
        logMessage(`You used a ${itemToUse.name}.`);
        if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
        itemUsed = true;

    } else if (itemToUse.type === 'weapon') {
        const currentWeapon = gameState.player.inventory.find(i => i.type === 'weapon' && i.isEquipped);
        if (currentWeapon) {
            applyStatBonuses(currentWeapon, -1);
            currentWeapon.isEquipped = false;
        }
        if (currentWeapon === itemToUse) {
            gameState.player.equipment.weapon = { name: 'Fists', damage: 0 };
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {
            itemToUse.isEquipped = true;
            gameState.player.equipment.weapon = itemToUse;
            applyStatBonuses(itemToUse, 1);
            logMessage(`You equip the ${itemToUse.name}.`);
        }
        itemUsed = true;

    } else if (itemToUse.type === 'armor') {
        const currentArmor = gameState.player.inventory.find(i => i.type === 'armor' && i.isEquipped);
        if (currentArmor) {
            applyStatBonuses(currentArmor, -1);
            currentArmor.isEquipped = false;
        }
        if (currentArmor === itemToUse) {
            gameState.player.equipment.armor = { name: 'Simple Tunic', defense: 0 };
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {
            itemToUse.isEquipped = true;
            gameState.player.equipment.armor = itemToUse;
            applyStatBonuses(itemToUse, 1);
            logMessage(`You equip the ${itemToUse.name}.`);
        }
        itemUsed = true;

    } else if (itemToUse.type === 'spellbook' || itemToUse.type === 'skillbook' || itemToUse.type === 'tool') {
        // Logic for Books and Tools (handled similarly in your code)
        const player = gameState.player;
        let data = null;
        let learned = false;

        if (itemToUse.type === 'spellbook') {
            data = SPELL_DATA[itemToUse.spellId];
            if (!data) { logMessage("Dud item."); }
            else if (player.level < data.requiredLevel) { logMessage(`Requires Level ${data.requiredLevel}.`); }
            else {
                player.spellbook[itemToUse.spellId] = (player.spellbook[itemToUse.spellId] || 0) + 1;
                logMessage(player.spellbook[itemToUse.spellId] === 1 ? `Learned ${data.name}!` : `Upgraded ${data.name}!`);
                learned = true;
            }
        } else if (itemToUse.type === 'skillbook') {
            data = SKILL_DATA[itemToUse.skillId];
            if (!data) { logMessage("Dud item."); }
            else if (player.level < data.requiredLevel) { logMessage(`Requires Level ${data.requiredLevel}.`); }
            else {
                player.skillbook[itemToUse.skillId] = (player.skillbook[itemToUse.skillId] || 0) + 1;
                logMessage(player.skillbook[itemToUse.skillId] === 1 ? `Learned ${data.name}!` : `Upgraded ${data.name}!`);
                learned = true;
            }
        } else {
            // Tools just exist
            logMessage(`You picked up the ${itemToUse.name}.`);
            learned = true; // Technically 'used' to move to inventory
        }

        if (learned) {
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

    } else if (itemToUse.type === 'tome') {
        const stat = itemToUse.stat;
        if (stat && gameState.player.hasOwnProperty(stat)) {
            gameState.player[stat]++;
            logMessage(`You consume the tome. ${stat} +1!`);
            triggerStatAnimation(statDisplays[stat], 'stat-pulse-green');
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        } else {
            logMessage("This tome seems to be a dud.");
        }

    } else if (itemToUse.type === 'buff_potion') {
        const player = gameState.player;
        const template = ITEM_DATA[Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === itemToUse.name)];
        
        if (player.strengthBonusTurns > 0) { 
            logMessage("Effect already active.");
        } else {
            player.strengthBonus = template.amount;
            player.strengthBonusTurns = template.duration;
            logMessage(`You drink the potion. (+${template.amount} Str)`);
            triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

    } else if (itemToUse.type === 'teleport') {
        logMessage("Space warps around you...");
        gameState.player.x = 0;
        gameState.player.y = 0;
        exitToOverworld("You vanish and reappear at the village gates.");
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
        itemUsed = true;

    } else if (itemToUse.type === 'treasure_map') {
        if (!gameState.activeTreasure) {
            const dist = 50 + Math.floor(Math.random() * 100);
            const angle = Math.random() * 2 * Math.PI;
            const tx = Math.floor(gameState.player.x + Math.cos(angle) * dist);
            const ty = Math.floor(gameState.player.y + Math.sin(angle) * dist);
            gameState.activeTreasure = { x: tx, y: ty };

            playerRef.update({ activeTreasure: gameState.activeTreasure });

            logMessage(`The map reveals a hidden mark! Location: (${tx}, ${-ty}).`);
            
        } else {
             logMessage(`The map marks a location at (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y}).`);
        }
        itemUsed = false; 

    } else {
        logMessage(`You can't use '${itemToUse.name}' right now.`);
    }
    
        if (itemUsed) {
        playerRef.update({
            inventory: getSanitizedInventory(),
            equipment: gameState.player.equipment,
            health: gameState.player.health,
            mana: gameState.player.mana,
            stamina: gameState.player.stamina,
            psyche: gameState.player.psyche,
            strength: gameState.player.strength,
            wits: gameState.player.wits,

            strengthBonus: gameState.player.strengthBonus,
            strengthBonusTurns: gameState.player.strengthBonusTurns
        });

        syncPlayerState();
        endPlayerTurn();
        renderInventory();
        renderEquipment();
        renderStats();
    }
}

function restPlayer() {
    let rested = false;
    let logMsg = "You rest for a moment. ";

    if (gameState.player.stamina < gameState.player.maxStamina) {
        gameState.player.stamina++;
        triggerStatFlash(statDisplays.stamina, true);
        logMsg += "Recovered 1 stamina.";
        rested = true;
    }
    if (gameState.player.health < gameState.player.maxHealth) {
        gameState.player.health++;
        triggerStatFlash(statDisplays.health, true);
        logMsg += " Recovered 1 health.";
        rested = true;
    }

    if (!rested) logMessage("You are already at full health and stamina.");
    else logMessage(logMsg);

    playerRef.update({
        stamina: gameState.player.stamina,
        health: gameState.player.health
    });
    endPlayerTurn();
}

async function attemptMovePlayer(newX, newY) {
    if (newX === gameState.player.x && newY === gameState.player.y) return;

    const obsoleteTiles = [];
    const tileAtDestination = chunkManager.getTile(newX, newY);
    if (obsoleteTiles.includes(tileAtDestination)) {
        logMessage("You clear away remnants of an older age.");
        chunkManager.setWorldTile(newX, newY, '.');
    }

    // 1. Determine the destination tile
    let newTile;
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        newTile = (map && map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';
    } else if (gameState.mapMode === 'castle') {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        newTile = (map && map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';
    } else {
        newTile = chunkManager.getTile(newX, newY);
    }

    // --- OVERLAY COLLISION CHECK ---
    if (gameState.mapMode === 'overworld') {
        const enemyKey = `overworld:${newX},${-newY}`;
        const overlayEnemy = gameState.sharedEnemies[enemyKey];
        
        if (overlayEnemy) {
            // Check if this is a valid enemy
            if (ENEMY_DATA[overlayEnemy.tile]) {
                // Valid enemy: Override tile to trigger combat
                newTile = overlayEnemy.tile;
            } else {
                // Invalid "Ghost" enemy (like 'F'): Delete it from DB
                logMessage("Dissipating a phantom signal...");
                rtdb.ref(`worldEnemies/${enemyKey}`).remove();
                delete gameState.sharedEnemies[enemyKey];
                // Don't override newTile; let the player walk there.
            }
        }
    }

    const tileData = TILE_DATA[newTile];

    if (gameState.mapMode === 'castle' && gameState.friendlyNpcs) {
        const npc = gameState.friendlyNpcs.find(n => n.x === newX && n.y === newY);
        if (npc) {
            const seed = stringToSeed(gameState.playerTurnCount + npc.id);
            const random = Alea(seed);
            const dialogue = npc.dialogue[Math.floor(random() * npc.dialogue.length)];
            
            loreTitle.textContent = npc.name || "Villager";
            loreContent.textContent = `The ${npc.role} stops to address you.\n\n"${dialogue}"`;
            loreModal.classList.remove('hidden');
            return;
        }
    }

    if (newTile === '¥') {
        activeShopInventory = TRADER_INVENTORY;
        logMessage("You meet a Wandering Trader. 'Rare goods, for a price...'");
        renderShop();
        shopModal.classList.remove('hidden');
        return;
    }

    // --- DUNGEON WALL CHECK ---
    if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme];
        const secretWallTile = theme ? theme.secretWall : null;
        const phaseWallTile = theme ? theme.phaseWall : null;

        if (secretWallTile && newTile === secretWallTile) {
            logMessage("The wall sounds hollow... You break through!");
            chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            grantXp(15);
            render();
            return;
        }
        if (phaseWallTile && newTile === phaseWallTile) {
            logMessage("You step into the wall... and pass right through it like smoke.");
        }
        else if (theme && (newTile === theme.wall || newTile === ' ')) {
            logMessage("The wall is solid.");
            return;
        }
    }

    // --- CASTLE WALL CHECK ---
    if (gameState.mapMode === 'castle' && (newTile === '▓' || newTile === '▒' || newTile === ' ')) {
        logMessage("You bump into the castle wall.");
        return;
    }

    // --- COMBAT CHECK ---
    const enemyData = ENEMY_DATA[newTile];
    if (enemyData) {
        
        // 1. Calculate Player's Raw Attack Power

        const weaponDamage = gameState.player.equipment.weapon ? gameState.player.equipment.weapon.damage : 0;
        const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);
        
        let rawDamage = playerStrength + weaponDamage;

        // --- APPLY TALENT MODIFIERS (Gets the 4x bonus based on CURRENT stealth) ---
        rawDamage = getPlayerDamageModifier(rawDamage); 
        
        // --- NOW BREAK STEALTH (Safe to do so) ---
        if (gameState.player.stealthTurns > 0) {
            gameState.player.stealthTurns = 0;
            logMessage("You emerge from the shadows.");
            playerRef.update({ stealthTurns: 0 }); 
        }

        // 2. Critical Hit Check (5% base + 0.5% per Luck)
        const critChance = 0.05 + (gameState.player.luck * 0.005);
        let isCrit = false;
        
        if (Math.random() < critChance) {
    
            // --- TALENT: BACKSTAB ---
            const mult = (gameState.player.talents && gameState.player.talents.includes('backstab')) ? 3.0 : 1.5;
            rawDamage = Math.floor(rawDamage * 1.5); // 1.5x Damage on Crit
            isCrit = true;
        }

        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            // --- INSTANCED COMBAT ---
            let enemy = gameState.instancedEnemies.find(e => e.x === newX && e.y === newY);
            let enemyId = enemy ? enemy.id : null;

            if (enemy) {

                // --- APPLY TALENT MODIFIERS ---
                
                const boostedDamage = getPlayerDamageModifier(rawDamage);

                const playerDamage = Math.max(1, boostedDamage - (enemy.defense || 0));

                enemy.health -= playerDamage;
                
                // Log & Effects
                if (isCrit) {
                    logMessage(`CRITICAL HIT! You strike the ${enemy.name} for ${playerDamage} damage!`);
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(newX, newY, '#facc15'); // Yellow sparks
                        ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                    }
                } else {
                    logMessage(`You attack the ${enemy.name} for ${playerDamage} damage!`);
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(newX, newY, '#ef4444'); 
                        ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');
                    }
                }

                // Weapon Poison Effect
                const weapon = gameState.player.equipment.weapon;
                if (weapon && weapon.inflicts === 'poison' && enemy.poisonTurns <= 0 && Math.random() < (weapon.inflictChance || 0.25)) {
                    logMessage(`Your weapon poisons the ${enemy.name}!`);
                    enemy.poisonTurns = 3;
                }

                // Enemy Death Logic
                if (enemy.health <= 0) {
                    logMessage(`You defeated the ${enemy.name}!`);
                    
                    registerKill(enemy);

                    const droppedLoot = generateEnemyLoot(gameState.player, enemyData);
                    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemyId);

                    if (gameState.mapMode === 'dungeon') {
                        if (chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemyId);
                        }
                        chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = droppedLoot;
                    }
                } else {
                    // ENEMY ATTACKS BACK
                    const armorDefense = gameState.player.equipment.armor ? gameState.player.equipment.armor.defense : 0;
                    const baseDefense = Math.floor(gameState.player.dexterity / 5);
                    const buffDefense = gameState.player.defenseBonus || 0;
                    const playerDefense = baseDefense + armorDefense + buffDefense;
                    
                    const enemyDamage = Math.max(1, enemy.attack - playerDefense);

                    const luckDodgeChance = Math.min(gameState.player.luck * 0.002, 0.25);
                    
                    if (Math.random() < luckDodgeChance) {
                        logMessage(`The ${enemy.name} attacks, but you luckily dodge!`);
                    } else {
                        let damageToApply = enemyDamage;
                        
                        // Shield Absorb
                        if (gameState.player.shieldValue > 0) {
                            const damageAbsorbed = Math.min(gameState.player.shieldValue, damageToApply);
                            gameState.player.shieldValue -= damageAbsorbed;
                            damageToApply -= damageAbsorbed;
                            logMessage(`Your shield absorbs ${damageAbsorbed} damage!`);
                            if (gameState.player.shieldValue === 0) logMessage("Your Arcane Shield shatters!");
                        }

                        if (damageToApply > 0) {
                            gameState.player.health -= damageToApply;
                            if (typeof ParticleSystem !== 'undefined') {
                                ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ef4444'); 
                                ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, `-${damageToApply}`, '#ef4444');
                            }
                            triggerStatFlash(statDisplays.health, false);
                            logMessage(`The ${enemy.name} hits you for ${damageToApply} damage!`);
                        }

                        // Thorns Damage
                        if (gameState.player.thornsValue > 0) {
                            enemy.health -= gameState.player.thornsValue;
                            logMessage(`The ${enemy.name} takes ${gameState.player.thornsValue} damage from your thorns!`);
                            if (enemy.health <= 0) {
                                logMessage(`The ${enemy.name} is killed by your thorns!`);
                                
                                registerKill(enemy);

                                const droppedLoot = generateEnemyLoot(gameState.player, enemy);
                                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemyId);
                                if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = droppedLoot;
                            }
                        }
                    }

                    if (gameState.player.health <= 0) {
                        gameState.player.health = 0;
                        logMessage("You have perished!");
                        syncPlayerState();
                        document.getElementById('finalLevelDisplay').textContent = `Level: ${gameState.player.level}`;
                        document.getElementById('finalCoinsDisplay').textContent = `Gold: ${gameState.player.coins}`;
                        gameOverModal.classList.remove('hidden');
                    }
                }
                endPlayerTurn();
                render();
                return;
            } else {
                logMessage(`You see the corpse of a ${enemyData.name}.`);
            }

        } else if (gameState.mapMode === 'overworld') {
            // --- SHARED COMBAT ---
            // Calculate Final Damage vs Base Enemy Defense
            const playerDamage = Math.max(1, rawDamage - (enemyData.defense || 0));

            // Log before calling handleOverworldCombat (which handles the enemy reaction log)
            if (isCrit) {
                logMessage(`CRITICAL HIT! You strike the ${enemyData.name} for ${playerDamage} damage!`);
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                }
            } else {
                logMessage(`You attack the ${enemyData.name} for ${playerDamage} damage!`);
            }

            await handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage);
            return;
        }
    }

    if (tileData && tileData.type === 'shrine') {
        const tileId = `${newX},${-newY}`;
        const player = gameState.player;
        let shrineUsed = false;

        if (gameState.lootedTiles.has(tileId)) {
            logMessage("The shrine's power is spent.");
            return;
        }

        loreTitle.textContent = "An Ancient Shrine";
        // UPDATED TEXT to reflect 500 turns
        loreContent.innerHTML = `
            <p>The shrine hums with a faint energy. You feel you can ask for one boon.</p>
            <button id="shrineStr" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Strength (+5 Str for 500 turns)</button>
            <button id="shrineWits" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Wits (+5 Wits for 500 turns)</button>
        `;
        loreModal.classList.remove('hidden');

        document.getElementById('shrineStr').addEventListener('click', () => {
            // We allow overwriting old buffs now since this is a "Major" buff
            logMessage("You pray for Strength. You feel a surge of power that will last for days!");
            player.strengthBonus = 5;
            player.strengthBonusTurns = 500; // <--- UPDATED TO 500
            
            playerRef.update({ strengthBonus: 5, strengthBonusTurns: 500 });
            renderEquipment();
            shrineUsed = true;
            
            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles) });
            loreModal.classList.add('hidden');
        }, { once: true });

        document.getElementById('shrineWits').addEventListener('click', () => {
            logMessage("You pray for Wits. Your mind expands with ancient knowledge!");
            
            // Apply the 500-turn buff
            player.witsBonus = 5;
            player.witsBonusTurns = 500;
            
            playerRef.update({ witsBonus: 5, witsBonusTurns: 500 });
            renderStats(); // Update UI immediately
            
            shrineUsed = true;
            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles) });
            loreModal.classList.add('hidden');
        }, { once: true });
        
        return;
    }

    if (newTile === '⛲') {
        if (gameState.player.coins >= 50) {
            logMessage("You toss 50 gold into the well...");
            gameState.player.coins -= 50;
            playerRef.update({ coins: gameState.player.coins });
            renderStats();
            const roll = Math.random();
            if (roll < 0.3) {
                logMessage("...and receive a Healing Potion!");
                gameState.player.inventory.push({ name: 'Healing Potion', type: 'consumable', quantity: 1, tile: '+', effect: ITEM_DATA['+'].effect });
            } else if (roll < 0.6) {
                logMessage("...and feel refreshed! (Full Heal)");
                gameState.player.health = gameState.player.maxHealth;
                gameState.player.mana = gameState.player.maxMana;
                playerRef.update({ health: gameState.player.health, mana: gameState.player.mana });
            } else {
                logMessage("...splash. Nothing happens.");
            }
            renderInventory();
        } else {
            logMessage("You need 50 gold to make a wish.");
        }
        return;
    }

    if (newTile === 'Ω') {
        logMessage("A tear in reality. It is unstable.");
        logMessage("You need a Void Key to stabilize the passage.");
        // We allow the player to walk ONTO it, so they can use the key.
        // We do NOT return here, allowing the movement to complete.
    }

    if (newTile === '🌵') {
        logMessage("Ouch! The thorns prick you, but you grab a fruit.");
        gameState.player.health -= 1;
        triggerStatFlash(statDisplays.health, false);
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                gameState.player.inventory.push({
                name: 'Cactus Fruit',
                type: 'consumable',
                quantity: 1,
                tile: '🍐',
                effect: ITEM_DATA['🍐'].effect
            });
            chunkManager.setWorldTile(newX, newY, 'D');
            renderInventory();
        } else {
            logMessage("Inventory full! You drop the fruit.");
        }
        return; 
    }

    else if (tileData && tileData.type === 'loot_chest') {

    // --- MIMIC CHECK ---
        // 10% Chance to be a Mimic
        if (Math.random() < 0.10) {
            logMessage("The chest lurches open... It has teeth! IT'S A MIMIC!");
            
            // Transform the tile into a Mimic
            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(newX, newY, 'M');
            } else if (gameState.mapMode === 'dungeon') {
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = 'M';
            } else {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = 'M';
            }
            
            // Trigger combat immediately? Or let the player attack next turn?
            // Let's force a hit from the mimic immediately for surprise!
            gameState.player.health -= 3;
            triggerStatFlash(statDisplays.health, false);
            logMessage("The Mimic bites you for 3 damage!");
            render();
            return;
        }

        logMessage("You pry open the chest...");
        const goldAmount = 50 + Math.floor(Math.random() * 50);
        gameState.player.coins += goldAmount;
        logMessage(`You found ${goldAmount} Gold!`);
        
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                gameState.player.inventory.push({
                name: 'Elixir of Life',
                type: 'consumable',
                quantity: 1,
                tile: '🍷',
                effect: ITEM_DATA['🍷'].effect 
            });
            logMessage("You found an Elixir of Life!");
        }
        chunkManager.setWorldTile(newX, newY, '.'); 
        playerRef.update({ coins: gameState.player.coins, inventory: gameState.player.inventory });
        renderInventory();
        return; 
    }

    else if (newTile === '<') {
        const player = gameState.player;
        let tileId;
        if (gameState.mapMode === 'overworld') {
            tileId = `${newX},${-newY}`;
        } else {
            const mapId = gameState.currentCaveId || gameState.currentCastleId;
            tileId = `${mapId}:${newX},${-newY}`;
        }

        if (gameState.lootedTiles.has(tileId)) {
            logMessage("You step over a disarmed trap.");
        } else {
            const avoidChance = Math.min(0.75, player.dexterity * 0.01);
            if (Math.random() < avoidChance) {
                logMessage("You spot a spike trap and deftly avoid it, disarming it!");
                gameState.lootedTiles.add(tileId);
                playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles) });
                return;
            } else {
                logMessage("You step right on a spike trap! Ouch!");
                const trapDamage = 3;
                player.health -= trapDamage;
                triggerStatFlash(statDisplays.health, false);
                gameState.lootedTiles.add(tileId);
            }
        }
    }

    let moveCost = TERRAIN_COST[newTile] ?? 0;

    // --- GILL POTION OVERRIDE ---
    // If we have gills, Deep Water becomes easy to swim (Cost 1)
    if (newTile === '~' && gameState.player.waterBreathingTurns > 0) {
        moveCost = 1;
    }

    if ((newTile === '~' || newTile === '≈') && gameState.player.waterBreathingTurns > 0) {
        moveCost = 0; // Swim effortlessly
    }

    if (newTile === 'F' && gameState.player.talents && gameState.player.talents.includes('pathfinder')) {
        moveCost = 0;
        if(Math.random() < 0.05) logMessage("You move swiftly through the trees.");
    }

    // Entering a structure should never cost extra stamina
    if (['⛰', '🏰', 'V', '♛', '🕳️'].includes(newTile)) {
        moveCost = 0;
    }

    if (gameState.weather === 'storm' || gameState.weather === 'snow') {
        moveCost += 1;
    }

    let isDisembarking = false;
    if (gameState.player.isBoating) {
        if (newTile === '~') {
            moveCost = 1; 
        } else if (moveCost !== Infinity) {
            isDisembarking = true;
        } else {
            logMessage("You can't beach the canoe here.");
            return;
        }
    } else {
        if (gameState.mapMode === 'overworld') {
            const playerInventory = gameState.player.inventory;
            if (newTile === 'F' && playerInventory.some(item => item.name === 'Machete')) {
                moveCost = 0; 
            }
            if (newTile === '^' && playerInventory.some(item => item.name === 'Climbing Tools')) {
                moveCost = Math.max(1, moveCost - 1);
            }
        }
        
        if (moveCost === Infinity) {
            if (newTile === '^' && gameState.mapMode === 'overworld') {
                const tileId = `${newX},${-newY}`;
                const seed = stringToSeed(WORLD_SEED + ':' + tileId);
                const random = Alea(seed);
                if (random() < 0.05) {
                    logMessage("You push against the rock... and it gives way! You've found a hidden passage! +50 XP");
                    grantXp(50); 
                    chunkManager.setWorldTile(newX, newY, '⛰');
                    gameState.mapMode = 'dungeon';
                    gameState.currentCaveId = `cave_${newX}_${newY}`;
                    gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                    const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                    gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                    for (let y = 0; y < caveMap.length; y++) {
                        const x = caveMap[y].indexOf('>');
                        if (x !== -1) { gameState.player.x = x; gameState.player.y = y; break; }
                    }
                    const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                    gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
                    logMessage("You enter the " + (CAVE_THEMES[gameState.currentCaveTheme]?.name || 'cave') + "...");
                    updateRegionDisplay();
                    render();
                    syncPlayerState();
                    return;
                }
            }
            logMessage("That way is blocked.");
            return;
        }
    }
    
    if (isDisembarking) {
        gameState.player.isBoating = false;
        logMessage("You beach the canoe and step onto the shore.");
        chunkManager.setWorldTile(gameState.player.x, gameState.player.y, 'c');
        playerRef.update({ isBoating: false });
    }
    
// --- DOOR LOGIC ---
    if (newTile === '+') {
        logMessage("You open the door.");
        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '/'); // '/' is Open Door
        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '/';
        render();
        return; // Spend turn opening
    }
    if (newTile === '/') {
        // Auto-close logic? Or just walk through. Let's just walk through for now.
        // If you want to close it, maybe Ctrl+Click or specific command later.
        // For now, it's just walkable.
    }

    // --- STASH LOGIC ---
    if (newTile === '☒') {
        logMessage("You open your Stash Box.");
        openStashModal();
        return;
    }

    // Check special tiles
    if (tileData) {
        const tileId = `${newX},${-newY}`;

        if (tileData.type === 'journal') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You found a new journal! +25 XP");
                grantXp(25);
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            loreTitle.textContent = tileData.title;
            loreContent.textContent = tileData.content;
            loreModal.classList.remove('hidden');
            return;
        }

        if (tileData.type === 'barrel') {

            // Let's keep it simple: Attacking it destroys it.
            
            logMessage("You smash the barrel open!");
            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '.';
            else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
            
            // 30% chance to drop oil (fuel)
            if (Math.random() < 0.3) {
                 logMessage("You salvage some oil.");
                 // Give lantern fuel/torch duration?
                 player.candlelightTurns += 20; 
            }
            render();
            return;
        }

        if (tileData.type === 'obstacle') {
            const playerInventory = gameState.player.inventory;
            const toolName = tileData.tool;
            const hasTool = playerInventory.some(i => i.name === toolName);

            if (hasTool) {
                logMessage(`You use your ${toolName} to clear the ${tileData.name}.`);
                if (tileData.name === 'Thicket' || tileData.name === 'Dead Tree') {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const existingWood = playerInventory.find(i => i.name === 'Wood Log');
                        if (existingWood) existingWood.quantity++;
                        else playerInventory.push({ name: 'Wood Log', type: 'junk', quantity: 1, tile: '🪵' });
                        logMessage("You gathered a Wood Log!");
                        inventoryWasUpdated = true;
                    } else {
                        logMessage("Inventory full! The wood is lost.");
                    }
                } 
                // Only grant Stone if using a Pickaxe on a generic obstacle (like Cracked Wall)
                else if (toolName === 'Pickaxe') {
                     if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const existingStone = playerInventory.find(i => i.name === 'Stone');
                        if (existingStone) existingStone.quantity++;
                        else playerInventory.push({ name: 'Stone', type: 'junk', quantity: 1, tile: '🪨' });
                        logMessage("You gathered Stone!");
                        inventoryWasUpdated = true;
                    }
                }
                if (toolName === 'Pickaxe') triggerStatFlash(statDisplays.strength, true);
                if (toolName === 'Machete') triggerStatFlash(statDisplays.dexterity, true);

                if (newTile === '🏚') { 
                    const roll = Math.random();
                    let drop = null;
                    if (roll < 0.20) drop = '•'; 
                    else if (roll < 0.25) drop = '▲'; 
                    else if (roll < 0.26) drop = '💎'; 
                    
                    if (drop) {
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, drop);
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = drop;
                        logMessage("Something was hidden inside the wall!");
                        render();
                        return;
                    }
                }

                let floorTile = '.';
                if (gameState.mapMode === 'dungeon') {
                    const theme = CAVE_THEMES[gameState.currentCaveTheme];
                    floorTile = theme.floor;
                } else if (gameState.mapMode === 'overworld') {
                    if (newTile === '🌳') floorTile = 'F';
                    else if (newTile === '🏚') floorTile = '^'; 
                }

                if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, floorTile);
                else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = floorTile;
                else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';

                render();
                return;
            } else {
                logMessage(`${tileData.flavor} (Requires ${toolName})`);
                return;
            }
        }

        if (tileData.type === 'campsite') {
            logMessage("You rest at the abandoned camp...");
            gameState.player.health = gameState.player.maxHealth;
            gameState.player.stamina = gameState.player.maxStamina;
            gameState.player.mana = gameState.player.maxMana;
            gameState.player.psyche = gameState.player.maxPsyche;
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            logMessage("The fire warms your bones. You feel fully restored.");
            playerRef.update({ health: gameState.player.health, stamina: gameState.player.stamina, mana: gameState.player.mana, psyche: gameState.player.psyche });
        }

        if (tileData.type === 'ruin') {
            if (gameState.lootedTiles.has(tileId)) {
                logMessage("These ruins have already been searched.");
                return;
            }
            logMessage("You search the ancient shelves...");
            const allChronicles = ['📜1', '📜2', '📜3', '📜4', '📜5'];
            const playerItemTiles = gameState.player.inventory.map(i => i.tile); 
            const missingChronicles = allChronicles.filter(c => !playerItemTiles.includes(c));

            if (missingChronicles.length > 0) {
                const nextChronicleKey = missingChronicles[0]; 
                const itemTemplate = ITEM_DATA[nextChronicleKey];
                
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: itemTemplate.name,
                        type: itemTemplate.type,
                        quantity: 1,
                        tile: nextChronicleKey, 
                        title: itemTemplate.title, 
                        content: itemTemplate.content
                    });
                    logMessage(`You found ${itemTemplate.name}!`);
                    grantXp(50); 
                    
                    if (missingChronicles.length === 1) {
                        logMessage("You have collected all the Lost Chronicles!");
                        logMessage("You feel a surge of intellect.");
                        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                            const reward = ITEM_DATA['👓'];
                            gameState.player.inventory.push({ name: reward.name, type: reward.type, quantity: 1, tile: '👓', defense: reward.defense, slot: reward.slot, statBonuses: reward.statBonuses });
                            logMessage("You found the Scholar's Spectacles!");
                        } else {
                            logMessage("You found the Spectacles, but your pack was full! (They are lost in the rubble...)");
                        }
                    }
                } else {
                    logMessage("You found a Chronicle, but your inventory is full!");
                    return;
                }
            } else {
                logMessage("You found an Arcane Scroll.");
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({ name: 'Scroll: Clarity', type: 'spellbook', quantity: 1, tile: '📜', spellId: 'clarity' });
                } else {
                    logMessage("But your inventory is full.");
                    return;
                }
            }
            gameState.lootedTiles.add(tileId);
            playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles), inventory: gameState.player.inventory });
            renderInventory();
            return;
        }

        if (tileData.type === 'lore_statue') {
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const msg = tileData.message[Math.floor(random() * tileData.message.length)];
            loreTitle.textContent = "Weathered Statue";
            loreContent.textContent = msg;
            loreModal.classList.remove('hidden');
            if (!gameState.foundLore.has(tileId)) {
                grantXp(10);
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            return;
        }

        if (tileData.type === 'loot_container') {
            logMessage(tileData.flavor);
            let lootTable = tileData.lootTable; // Default table
            
            // --- Dynamic Loot Table for Generic Chests ---
            // If it's a generic chest (lootTable not strictly defined or is generic)
            // we inject scaling logic.
            if (!lootTable || tileData.name === 'Dusty Urn' || newTile === '📦') {
                const dist = Math.sqrt(newX*newX + newY*newY);
                if (dist > 250) {
                    // High Tier + New Trade Goods (Shells, Pearls, Idols)
                    lootTable = ['$', '$', 'S', 'o', '+', '⚔️l', '⛓️', '💎', '🧪', '🐚', '💎b', '🗿']; 
                } else {
                    // Low Tier + Common Trade Goods (Shells, Spools)
                    lootTable = ['$', '$', '(', '†', '+', '!', '[', '🛡️w', '🐚', '🧵']; 
                }
            }
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const lootCount = 1 + Math.floor(random() * 2);
            
            for(let i=0; i<lootCount; i++) {
                const itemKey = lootTable[Math.floor(random() * lootTable.length)];
                if (itemKey === '$') {
                    const amount = 5 + Math.floor(random() * 15);
                    gameState.player.coins += amount;
                    logMessage(`You found ${amount} gold coins.`);
                    continue;
                }
                const itemTemplate = ITEM_DATA[itemKey];
                if (itemTemplate) {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                            gameState.player.inventory.push({
                            name: itemTemplate.name,
                            type: itemTemplate.type,
                            quantity: 1,
                            tile: itemKey, 
                            damage: itemTemplate.damage || null,
                            defense: itemTemplate.defense || null,
                            slot: itemTemplate.slot || null,
                            statBonuses: itemTemplate.statBonuses || null
                        });
                        logMessage(`You found: ${itemTemplate.name}`);
                    } else {
                        logMessage(`You found a ${itemTemplate.name}, but your pack is full.`);
                    }
                }
            }
            
            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme];
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            }
            playerRef.update({ coins: gameState.player.coins, inventory: gameState.player.inventory });
            renderInventory();
            renderStats();
            return;
        }

        if (newTile === 'B') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've discovered a Bounty Board! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            openBountyBoard();
            return;
        }

        if (newTile === '#') {
        const tileId = `${newX},${-newY}`;
        const player = gameState.player;
        
        // 1. Initialize array if missing
        if (!player.unlockedWaypoints) player.unlockedWaypoints = [];

        // 2. Check if already unlocked
        const existingWP = player.unlockedWaypoints.find(wp => wp.x === newX && wp.y === newY);
        
        if (!existingWP) {
            // New discovery!
            const regionX = Math.floor(newX / REGION_SIZE);
            const regionY = Math.floor(newY / REGION_SIZE);
            const regionName = getRegionName(regionX, regionY);
            
            player.unlockedWaypoints.push({
                x: newX,
                y: newY,
                name: regionName
            });
            
            logMessage("Waystone Attuned! You can now fast travel here.");
            grantXp(25);
            triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue'); // Visual flair
            
            // Save immediately
            playerRef.update({ unlockedWaypoints: player.unlockedWaypoints });
        }

        // 3. Generate Lore (Keep existing flavor)
        if (!gameState.foundLore.has(tileId)) {
            // grantXp(10); // Removed small XP, moved to Attunement above
            gameState.foundLore.add(tileId);
            playerRef.update({ foundLore: Array.from(gameState.foundLore) });
        }
        
        const elev = elevationNoise.noise(newX / 70, newY / 70);
        const moist = moistureNoise.noise(newX / 50, newY / 50);
        let loreArray = LORE_PLAINS; let biomeName = "Plains";
        if (elev < 0.4 && moist > 0.7) { loreArray = LORE_SWAMP; biomeName = "Swamp"; }
        else if (elev > 0.8) { loreArray = LORE_MOUNTAIN; biomeName = "Mountain"; }
        else if (moist > 0.55) { loreArray = LORE_FOREST; biomeName = "Forest"; }

        const seed = stringToSeed(tileId);
        const random = Alea(seed);
        const messageIndex = Math.floor(random() * loreArray.length);
        const message = loreArray[messageIndex];

        // 4. Show Modal with Travel Button
        loreTitle.textContent = `Waystone: ${biomeName}`;
        loreContent.innerHTML = `
            <p class="italic text-gray-600 mb-4">"...${message}..."</p>
            <p>The stone hums with power. It is attuned to the leylines.</p>
            <button id="openFastTravel" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full">✨ Fast Travel (10 Mana)</button>
        `;
        loreModal.classList.remove('hidden');
        
        // Bind the button
        setTimeout(() => { // Timeout ensures element is in DOM
            const btn = document.getElementById('openFastTravel');
            if (btn) btn.onclick = openFastTravelModal;
        }, 0);
        
        return;
    }

        if (tileData.type === 'obelisk') {
            if (!gameState.foundLore.has(tileId)) {
                const existingStack = gameState.player.inventory.find(item => item.name === 'Obsidian Shard');
                if (existingStack) {
                    existingStack.quantity++;
                    logMessage("The Obelisk hums, and another shard forms in your pack.");
                    playerRef.update({ inventory: gameState.player.inventory });
                    renderInventory();
                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({ name: 'Obsidian Shard', type: 'junk', quantity: 1, tile: '▲' });
                    logMessage("The Obelisk hums, and a shard of black glass falls into your hand.");
                    playerRef.update({ inventory: gameState.player.inventory });
                    renderInventory();
                } else {
                    logMessage("The Obelisk offers a shard, but your inventory is full!");
                }
                
                if (gameState.player.mana < gameState.player.maxMana || gameState.player.psyche < gameState.player.maxPsyche) {
                    gameState.player.mana = gameState.player.maxMana;
                    gameState.player.psyche = gameState.player.maxPsyche;
                    triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                    triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                    logMessage("The ancient stone restores your magical energy.");
                    playerRef.update({ mana: gameState.player.mana, psyche: gameState.player.psyche });
                    renderStats();
                }

                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const visionIndex = Math.floor(random() * VISIONS_OF_THE_PAST.length);
                const vision = VISIONS_OF_THE_PAST[visionIndex];

                loreTitle.textContent = "Ancient Obelisk";
                loreContent.textContent = `The black stone is cold to the touch. Suddenly, the world fades away...\n\n${vision}`;
                loreModal.classList.remove('hidden');
                
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            return;
        }

        if (tileData.type === 'random_journal') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You found a scattered page! +10 XP");
                grantXp(10);
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const messageIndex = Math.floor(random() * RANDOM_JOURNAL_PAGES.length);
            const message = RANDOM_JOURNAL_PAGES[messageIndex];
            loreTitle.textContent = "A Scattered Page";
            loreContent.textContent = `You pick up a damp, crumpled page...\n\n"...${message}..."`;
            loreModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'N') {
            const npcQuestId = "goblinHeirloom"; 
            const questData = QUEST_DATA[npcQuestId];
            const playerQuest = gameState.player.quests[npcQuestId];
            const player = gameState.player;
            const genericVillagerId = "met_villager"; 
            if (!gameState.foundLore.has(genericVillagerId)) {
                logMessage("You meet a villager. +5 XP");
                grantXp(5);
                gameState.foundLore.add(genericVillagerId); 
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }

            if (!playerQuest) {
                loreTitle.textContent = "Distraught Villager";
                loreContent.innerHTML = `<p>An old villager wrings their hands.\n\n"Oh, thank goodness! A goblin stole my family heirloom... It's all I have left. If you find it, please bring it back!"</p><button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll keep an eye out."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptNpcQuest').addEventListener('click', () => { acceptQuest(npcQuestId); loreModal.classList.add('hidden'); }, { once: true });
            } else if (playerQuest.status === 'active') {
                const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
                if (hasItem) {
                    loreTitle.textContent = "Joyful Villager";
                    loreContent.innerHTML = `<p>The villager's eyes go wide.\n\n"You found it! My heirloom! Thank you, thank you! I don't have much, but please, take this for your trouble."</p><button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInNpcQuest').addEventListener('click', () => { turnInQuest(npcQuestId); loreModal.classList.add('hidden'); }, { once: true });
                } else {
                    loreTitle.textContent = "Anxious Villager";
                    loreContent.innerHTML = `<p>The villager looks up hopefully.\n\n"Any luck finding my heirloom? Those goblins are such pests..."</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('closeNpcLore').addEventListener('click', () => { loreModal.classList.add('hidden'); }, { once: true });
                }
            } else if (playerQuest.status === 'completed') {
                const seed = stringToSeed(tileId); 
                const random = Alea(seed);
                const rumor = VILLAGER_RUMORS[Math.floor(random() * VILLAGER_RUMORS.length)];
                loreTitle.textContent = "Grateful Villager";
                loreContent.innerHTML = `<p>The villager smiles warmly.\n\n"Thank you again for your help, adventurer. By the way..."</p><p class="italic text-sm mt-2">"${rumor}"</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Good to know."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('closeNpcLore').addEventListener('click', () => { loreModal.classList.add('hidden'); }, { once: true });
            }
            return;
        }

        if (newTile === 'G') {
        const questId = "banditChief";
        const playerQuest = gameState.player.quests[questId];

        if (!playerQuest) {
            loreTitle.textContent = "Captain of the Guard";
            loreContent.innerHTML = `<p>The Captain looks grim.\n\n"The Bandit Chief has grown too bold. He's holed up in a fortress nearby. I need someone expendable—err, brave—to take him out."</p><button id="acceptGuard" class="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">"Consider it done."</button>`;
            loreModal.classList.remove('hidden');
            document.getElementById('acceptGuard').addEventListener('click', () => { acceptQuest(questId); loreModal.classList.add('hidden'); }, { once: true });
            return;
        } 
        else if (playerQuest.status === 'active') {
            if (playerQuest.kills >= 1) {
                loreTitle.textContent = "Impressed Captain";
                loreContent.innerHTML = `<p>"They say the Chief is dead? Ha! I knew you had it in you. Take this blade, you've earned it."</p><button id="turnInGuard" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Thanks. (Complete)"</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('turnInGuard').addEventListener('click', () => { turnInQuest(questId); loreModal.classList.add('hidden'); }, { once: true });
                return;
            } else {
                logMessage("The Captain nods. 'Bring me the Chief's head.'");
            }
        } 
        else {
            // Default Flavor Text if quest is done
            const msgs = ["The roads are safer thanks to you.", "Stay sharp out there.", "Move along, citizen."];
            logMessage(`Guard: "${msgs[Math.floor(Math.random() * msgs.length)]}"`);
        }
        return;
    }

        if (newTile === 'O') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You listen to the Sage's ramblings. +10 XP");
                grantXp(10); 
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const messageIndex = Math.floor(random() * LORE_STONE_MESSAGES.length);
            const message = LORE_STONE_MESSAGES[messageIndex];
            loreTitle.textContent = "Sage";
            loreContent.textContent = `The old Sage is staring at a tapestry, muttering to themself.\n\n"...yes, yes... ${message}..."`;
            loreModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'T') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've found a Skill Trainer! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            openSkillTrainerModal();
            return;
        }

        if (newTile === 'K') {
            const npcQuestId = "goblinTrophies"; 
            const questData = QUEST_DATA[npcQuestId];
            const playerQuest = gameState.player.quests[npcQuestId];
            const player = gameState.player;
            const genericProspectorId = "met_prospector"; 
            if (!gameState.foundLore.has(genericProspectorId)) {
                logMessage("You meet a Lost Prospector. +5 XP");
                grantXp(5);
                gameState.foundLore.add(genericProspectorId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }

            if (!playerQuest) {
                loreTitle.textContent = "Frustrated Prospector";
                loreContent.innerHTML = `<p>A grizzled prospector, muttering to themself, jumps as you approach.\n\n"Goblins! I hate 'em! Always stealing my supplies, leaving these... these *totems* everywhere. Say, if you're clearing 'em out, bring me 10 of those Goblin Totems. I'll make it worth your while!"</p><button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll see what I can do."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptNpcQuest').addEventListener('click', () => { acceptQuest(npcQuestId); loreModal.classList.add('hidden'); }, { once: true });
            } else if (playerQuest.status === 'active') {
                const itemInInv = player.inventory.find(item => item.name === questData.itemNeeded);
                const hasItems = itemInInv && itemInInv.quantity >= questData.needed;
                if (hasItems) {
                    loreTitle.textContent = "Surprised Prospector";
                    loreContent.innerHTML = `<p>The prospector's eyes go wide as you show him the totems.\n\n"Ha! You actually did it! That'll teach 'em. Here, as promised. This is for your trouble."</p><button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInNpcQuest').addEventListener('click', () => { turnInQuest(npcQuestId); loreModal.classList.add('hidden'); }, { once: true });
                } else {
                    const needed = questData.needed - (itemInInv ? itemInInv.quantity : 0);
                    loreTitle.textContent = "Impatient Prospector";
                    loreContent.innerHTML = `<p>The prospector looks up.\n\n"Back already? You still need to find ${needed} more ${questData.itemNeeded}s. Get a move on!"</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('closeNpcLore').addEventListener('click', () => { loreModal.classList.add('hidden'); }, { once: true });
                }
            } else if (playerQuest.status === 'completed') {
                loreTitle.textContent = "Grateful Prospector";
                loreContent.innerHTML = `<p>The prospector nods at you.\n\n"Thanks again for your help, adventurer. The caves are a little quieter... for now."</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"You're welcome."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('closeNpcLore').addEventListener('click', () => { loreModal.classList.add('hidden'); }, { once: true });
            }
            return;
        }

        if (newTile === '§') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("The General Store is closed. A sign reads: 'Open 6 AM - 8 PM'.");
                return;
            }
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've discovered a General Store! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({ foundLore: Array.from(gameState.foundLore) });
            }
            if (gameState.mapMode === 'castle') {
                activeShopInventory = CASTLE_SHOP_INVENTORY;
                logMessage("You enter the castle emporium.");
            } else {
                activeShopInventory = SHOP_INVENTORY;
                logMessage("You enter the General Store.");
            }
            renderShop();
            shopModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'H') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("The Healer's cottage is dark. They must be sleeping.");
                return;
            }

            const questId = "healerSupply";
        const questData = QUEST_DATA[questId];
        const playerQuest = gameState.player.quests[questId];
        
        if (!playerQuest) {
            loreTitle.textContent = "Worried Healer";
            loreContent.innerHTML = `<p>"The swamp fever is spreading, and I am out of herbs. If you can brave the swamps and bring me 5 Medicinal Herbs, I can make a cure."</p><button id="acceptHealer" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll find them."</button>`;
            loreModal.classList.remove('hidden');
            document.getElementById('acceptHealer').addEventListener('click', () => { acceptQuest(questId); loreModal.classList.add('hidden'); }, { once: true });
            return;
        } 
        else if (playerQuest.status === 'active') {
            const itemIndex = gameState.player.inventory.findIndex(i => i.name === 'Medicinal Herb');
            const qty = itemIndex > -1 ? gameState.player.inventory[itemIndex].quantity : 0;
            
            if (qty >= 5) {
                loreTitle.textContent = "Relieved Healer";
                loreContent.innerHTML = `<p>"You found them! These are perfect. Here, take these potions for your trouble."</p><button id="turnInHealer" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Glad to help. (Complete)"</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('turnInHealer').addEventListener('click', () => { turnInQuest(questId); loreModal.classList.add('hidden'); }, { once: true });
                return;
            }
        }

            const HEAL_COST = 10;
            const player = gameState.player;
            if (player.health < player.maxHealth) {
                if (player.coins >= HEAL_COST) {
                    player.coins -= HEAL_COST;
                    player.health = player.maxHealth;
                    logMessage(`The Healer restores your health for ${HEAL_COST} gold.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                    playerRef.update({ health: player.health, coins: player.coins });
                } else {
                    logMessage(`"You need ${HEAL_COST} gold for my services," the Healer says.`);
                }
            } else {
                logMessage(`"You are already at full health!" the Healer says.`);
            }
            return;
        }

        switch (tileData.type) {
            case 'workbench':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You found a workbench! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                openCraftingModal('workbench');
                return;
            case 'village_entrance':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a safe haven village! +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'castle'; 
                gameState.currentCastleId = tileData.getVillageId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                chunkManager.generateCastle(gameState.currentCastleId, 'SAFE_HAVEN');
                const villageSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = villageSpawn.x;
                gameState.player.y = villageSpawn.y;
                gameState.instancedEnemies = []; 
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
                logMessage("You enter the peaceful village.");
                updateRegionDisplay();
                render();
                syncPlayerState();
                return;
            case 'cooking_fire':
                logMessage("You sit by the fire. The warmth is inviting.");
                openCraftingModal('cooking'); 
                return;
            case 'landmark_cave':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You stare into the abyss... and it stares back. +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'dungeon';
                gameState.currentCaveId = 'cave_landmark'; 
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                const epicMap = chunkManager.generateCave(gameState.currentCaveId);
                gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                for (let y = 0; y < epicMap.length; y++) {
                    const x = epicMap[y].indexOf('>');
                    if (x !== -1) { gameState.player.x = x; gameState.player.y = y; break; }
                }
                const epicEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(epicEnemies));
                logMessage("You descend into The Maw.");
                updateRegionDisplay();
                render();
                syncPlayerState();
                return;
            case 'canoe':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You found a canoe! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.player.isBoating = true;
                logMessage("You get in the canoe.");
                gameState.flags.canoeEmbarkCount++;
                const count = gameState.flags.canoeEmbarkCount;
                if (count === 1 || count === 3 || count === 7) logMessage("Be warned: Rowing the canoe will cost stamina!");
                chunkManager.setWorldTile(newX, newY, '.');
                playerRef.update({ isBoating: true });
                break; 
            case 'dungeon_entrance':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a cave entrance! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'dungeon';
                gameState.currentCaveId = tileData.getCaveId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                for (let y = 0; y < caveMap.length; y++) {
                    const x = caveMap[y].indexOf('>');
                    if (x !== -1) { gameState.player.x = x; gameState.player.y = y; break; }
                }
                const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
                logMessage("You enter the " + (CAVE_THEMES[gameState.currentCaveTheme]?.name || 'cave') + "...");
                updateRegionDisplay();
                render();
                syncPlayerState();
                return;
            case 'dungeon_exit':
                exitToOverworld("You emerge back into the sunlight.");
                return;
            case 'landmark_castle':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered the FORGOTTEN FORTRESS! +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                chunkManager.generateCastle(gameState.currentCastleId, 'GRAND_FORTRESS');
                const landmarkSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = landmarkSpawn.x;
                gameState.player.y = landmarkSpawn.y;
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
                logMessage("You enter the imposing fortress...");
                updateRegionDisplay();
                render();
                syncPlayerState();
                return;
            case 'castle_entrance':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a castle entrance! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getCastleId(newX, newY);
                gameState.overworldExit = { x: gameState.player.x, y: gameState.player.y };
                chunkManager.generateCastle(gameState.currentCastleId);
                const spawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                gameState.player.x = spawn.x;
                gameState.player.y = spawn.y;
                gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
                logMessage("You enter the castle grounds.");
                updateRegionDisplay();
                render();
                syncPlayerState();
                return;
            case 'castle_exit':
                exitToOverworld("You leave the castle.");
                return;
            case 'lore':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've found an old signpost! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                if (Array.isArray(tileData.message)) {
                    const currentTurn = Math.floor((gameState.time.day * 1440 + gameState.time.hour * 60 + gameState.time.minute) / TURN_DURATION_MINUTES);
                    const messageIndex = currentTurn % tileData.message.length;
                    logMessage(tileData.message[messageIndex]);
                } else logMessage(tileData.message);
        }
    }

    // 4. Handle item pickups *BEFORE* moving.
    let tileId;
    if (gameState.mapMode === 'overworld') {
        tileId = `${newX},${-newY}`;
    } else {
        const mapId = gameState.currentCaveId || gameState.currentCastleId;
        tileId = `${mapId}:${newX},${-newY}`;
    }

    const itemData = ITEM_DATA[newTile];
    let inventoryWasUpdated = false;

    if (newTile === '✨') {
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            // 1. Calculate Tier based on location
            const dist = Math.sqrt(newX * newX + newY * newY);
            let tier = 1;
            if (dist > 500) tier = 4;
            else if (dist > 250) tier = 3;
            else if (dist > 100) tier = 2;
            
            // 2. Generate the Item
            const newItem = generateMagicItem(tier);
            
            // 3. Add to inventory
            gameState.player.inventory.push(newItem);
            logMessage(`You picked up a ${newItem.name}!`);
            
            inventoryWasUpdated = true;
            gameState.lootedTiles.add(tileId); 
            
            // Clear the tile
            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            } else if (gameState.mapMode === 'castle') {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
            }
        } else {
            logMessage("You see a sparkling item, but your inventory is full!");
        }
        // Skip standard item logic
        itemData = null; 
    }

    function clearLootTile() {
        gameState.lootedTiles.add(tileId); 
        if (gameState.mapMode === 'overworld') {
            chunkManager.setWorldTile(newX, newY, '.');
        } else if (gameState.mapMode === 'dungeon') {
            const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
            chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
        } else if (gameState.mapMode === 'castle') {
            chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
        }
    }

    if (itemData) {
        let isTileLooted = gameState.lootedTiles.has(tileId);
        if (isTileLooted) {
            logMessage(`You see where a ${itemData.name} once was...`);
        } else {
            if (itemData.type === 'consumable') {
                const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                if (existingItem) {
                    existingItem.quantity++;
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile(); 
                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    const itemForDb = { name: itemData.name, type: itemData.type, quantity: 1, tile: newTile };
                    gameState.player.inventory.push(itemForDb);
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile(); 
                } else {
                    logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                    return; 
                }
            } else if (itemData.type === 'weapon') {
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    const itemForDb = { name: itemData.name, type: itemData.type, quantity: 1, tile: newTile, damage: itemData.damage, slot: itemData.slot, statBonuses: itemData.statBonuses || null };
                    gameState.player.inventory.push(itemForDb);
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile(); 
                } else {
                    logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                    return; 
                }
            } else if (itemData.type === 'armor') {
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    const itemForDb = { name: itemData.name, type: itemData.type, quantity: 1, tile: newTile, defense: itemData.defense, slot: itemData.slot, statBonuses: itemData.statBonuses || null };
                    gameState.player.inventory.push(itemForDb);
                    logMessage(`You picked up ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile(); 
                } else {
                    logMessage(`You see ${itemData.name}, but your inventory is full!`);
                    return; 
                }
            } else if (itemData.type === 'spellbook' || itemData.type === 'skillbook' || itemData.type === 'tool') {
                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    const itemForDb = { name: itemData.name, type: itemData.type, quantity: 1, tile: newTile, spellId: itemData.spellId || null, skillId: itemData.skillId || null, stat: itemData.stat || null };
                    gameState.player.inventory.push(itemForDb);
                    logMessage(`You picked up the ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile();
                } else {
                    logMessage(`You see the ${itemData.name}, but your inventory is full!`);
                    return; 
                }
            } else if (itemData.type === 'junk') {
                const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                if (existingItem) {
                    existingItem.quantity++;
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile();
                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    const itemForDb = { name: itemData.name, type: itemData.type, quantity: 1, tile: newTile };
                    gameState.player.inventory.push(itemForDb);
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile();
                } else {
                    logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                    return; 
                }
            } else if (itemData.type === 'instant') {
                itemData.effect(gameState, tileId);
                clearLootTile();
            }
        }
    }

    const staminaDeficit = moveCost - gameState.player.stamina;
    if (moveCost > gameState.player.stamina && gameState.player.health <= staminaDeficit) {
        logMessage("You're too tired, and pushing on would be fatal!");
        return;
    }

    const prevX = gameState.player.x;
    const prevY = gameState.player.y;

    gameState.player.x = newX;
    gameState.player.y = newY;

    if (gameState.player.companion) {
        gameState.player.companion.x = prevX;
        gameState.player.companion.y = prevY;
    }

    if (gameState.player.stamina >= moveCost) {
        gameState.player.stamina -= moveCost;
    } else {
        gameState.player.stamina = 0;
        gameState.player.health -= staminaDeficit;
        triggerStatFlash(statDisplays.health, false);
        logMessage(`You push yourself to the limit, costing ${staminaDeficit} health!`);
    }

    if (moveCost > 0) {
        triggerStatFlash(statDisplays.stamina, false);
        logMessage(`Traversing the terrain costs ${moveCost} stamina.`);
    }

    if (newTile === '≈') { 
        const resistChance = Math.max(0, (10 - gameState.player.endurance)) * 0.01;
        if (Math.random() < resistChance && gameState.player.poisonTurns <= 0) {
            logMessage("You feel sick from the swamp's foul water. You are Poisoned!");
            gameState.player.poisonTurns = 5; 
        }
    }

    if (gameState.mapMode === 'overworld') {
        const playerInventory = gameState.player.inventory;
        const hasPickaxe = playerInventory.some(item => item.name === 'Pickaxe');

        if (hasPickaxe) {
            if (newTile === '^') {
                logMessage("You use your Pickaxe to chip at the rock...");
                if (Math.random() < 0.25) {
                    const existingStack = playerInventory.find(item => item.name === 'Iron Ore');
                    if (existingStack) {
                        existingStack.quantity++;
                        logMessage("...and find some Iron Ore!");
                        inventoryWasUpdated = true;
                    } else if (playerInventory.length < MAX_INVENTORY_SLOTS) {
                        playerInventory.push({ name: 'Iron Ore', type: 'junk', quantity: 1, tile: '•' });
                        logMessage("...and find some Iron Ore!");
                        inventoryWasUpdated = true;
                    } else {
                        logMessage("...you find ore, but your inventory is full!");
                    }
                } else {
                    logMessage("...but find nothing of value.");
                }
            } 
            else if (gameState.activeTreasure && newX === gameState.activeTreasure.x && newY === gameState.activeTreasure.y) {
                logMessage("You dig where the map marked... clunk!");
                logMessage("You found a Buried Chest!");
                chunkManager.setWorldTile(newX, newY, '📦');
                gameState.activeTreasure = null;
                const mapIndex = playerInventory.findIndex(i => i.type === 'treasure_map');
                if (mapIndex > -1) {
                        playerInventory[mapIndex].quantity--;
                        if (playerInventory[mapIndex].quantity <= 0) playerInventory.splice(mapIndex, 1);
                        logMessage("The map crumbles to dust, its purpose fulfilled.");
                }
                inventoryWasUpdated = true;
            }
        }
    }

    passivePerceptionCheck();
    triggerAtmosphericFlavor(newTile);
    render();
    
    updateRegionDisplay();
    syncPlayerState();

    const newExploration = updateExploration();

    let updates = {
        x: gameState.player.x, 
        y: gameState.player.y, 
        health: gameState.player.health,
        stamina: gameState.player.stamina, 
        coins: gameState.player.coins,
        activeTreasure: gameState.activeTreasure,

        weather: gameState.weather, // Save current weather type
        weatherState: gameState.player.weatherState,
        weatherIntensity: gameState.player.weatherIntensity,
        weatherDuration: gameState.player.weatherDuration
    };

    // If we found a new chunk, add it to the save list
    if (newExploration) {
        updates.exploredChunks = Array.from(gameState.exploredChunks);
    }

    if (inventoryWasUpdated) {
        updates.inventory = getSanitizedInventory();
        updates.lootedTiles = Array.from(gameState.lootedTiles);
        renderInventory(); 
    }

    playerRef.update(updates);

    if (gameState.mapMode === 'overworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
    }

    if (gameState.player.health <= 0) {
        gameState.player.health = 0;
        logMessage("You have perished!");
        syncPlayerState();
        document.getElementById('finalLevelDisplay').textContent = `Level: ${gameState.player.level}`;
        document.getElementById('finalCoinsDisplay').textContent = `Gold: ${gameState.player.coins}`;
        gameOverModal.classList.remove('hidden');
    }

    endPlayerTurn();
}

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    darkModeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
    ctx.font = `${TILE_SIZE}px monospace`;
    render();
};

darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

helpButton.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
});

closeHelpButton.addEventListener('click', () => {
    helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        helpModal.classList.add('hidden');
    }
});

chatInput.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
        chatInput.blur();
        event.preventDefault();
        return;
    }
    
    if (event.key === 'Enter' && chatInput.value) {
        const message = chatInput.value.trim();
        chatInput.value = ''; // Clear input immediately

        if (message.startsWith('/')) {
            handleChatCommand(message);
            return; // Don't send commands to global chat
        }

        const messageRef = rtdb.ref('chat').push();
        messageRef.set({
            senderId: player_id,
            email: auth.currentUser.email,
            isBoating: gameState.player.isBoating,
            message: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }
});

signupButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const playerRef = db.collection('players').doc(user.uid);
        await playerRef.set(createDefaultPlayerState());
    } catch (error) {
        handleAuthError(error);
    }
});

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        handleAuthError(error);
    }
});

function clearSessionState() {
    gameState.lootedTiles.clear();
    gameState.discoveredRegions.clear();

    gameState.mapMode = null;

    // Reset session-based flags
    if (gameState.flags) {
        gameState.flags.hasSeenForestWarning = false;
        gameState.flags.canoeEmbarkCount = 0; // <-- ADD THIS
    }

    chunkManager.caveMaps = {};
    chunkManager.castleMaps = {};
    chunkManager.caveEnemies = {};
    chunkManager.caveThemes = {};
    chunkManager.castleSpawnPoints = {};
}

logoutButton.addEventListener('click', () => {
    const finalState = {
        ...gameState.player,
        lootedTiles: Array.from(gameState.lootedTiles)
    };

    // Create a clean version of the inventory before saving

    if (finalState.inventory) {
        finalState.inventory = getSanitizedInventory();
    }

    delete finalState.color;
    delete finalState.character;
    playerRef.set(finalState, {
        merge: true
    });
    if (onlinePlayerRef) onlinePlayerRef.remove();
    if (unsubscribePlayerListener) unsubscribePlayerListener();
    Object.values(worldStateListeners).forEach(unsubscribe => unsubscribe());
    worldStateListeners = {};
    clearSessionState();
    auth.signOut();
});

async function enterGame(playerData) {
    gameContainer.classList.remove('hidden');
    const loadingIndicator = document.getElementById('loadingIndicator');
    canvas.style.visibility = 'hidden';

    // --- 1. Load State ---
    if (playerData.health <= 0) {
        logMessage("You have respawned.");
        // Reset to default but keep the background
        const bgKey = playerData.background;
        playerData = createDefaultPlayerState();
        playerData.background = bgKey;
        
        // Note: playerRef is already set to the correct slot in selectSlot
        await playerRef.set(playerData);
    }

    const fullPlayerData = {
        ...createDefaultPlayerState(),
        ...playerData
    };
    Object.assign(gameState.player, fullPlayerData);

    if (playerData.activeTreasure) {
        gameState.activeTreasure = playerData.activeTreasure;
        logMessage(`You recall a location marked on your map: (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y})`);
    } else {
        gameState.activeTreasure = null;
    }

    gameState.mapMode = playerData.mapMode || 'overworld';

    // --- 2. Restore Sets (Discovery/Lore/Loot) ---
    if (playerData.discoveredRegions && Array.isArray(playerData.discoveredRegions)) {
        gameState.discoveredRegions = new Set(playerData.discoveredRegions);
    } else {
        gameState.discoveredRegions = new Set();
    }

    if (playerData.foundLore && Array.isArray(playerData.foundLore)) {
        gameState.foundLore = new Set(playerData.foundLore);
    } else {
        gameState.foundLore = new Set();
    }

    if (playerData.lootedTiles && Array.isArray(playerData.lootedTiles)) {
        gameState.lootedTiles = new Set(playerData.lootedTiles);
    } else {
        gameState.lootedTiles = new Set();
    }

    if (playerData.exploredChunks && Array.isArray(playerData.exploredChunks)) {
        gameState.exploredChunks = new Set(playerData.exploredChunks);
    } else {
        gameState.exploredChunks = new Set();
    }

    // --- 3. Check Background (Safety Check) ---
    if (!playerData.background) {
        // If no background, redirect to character creation
        loadingIndicator.classList.add('hidden');
        charCreationModal.classList.remove('hidden');
        return;
    }

    // --- 4. Setup Listeners ---
    // Note: player_id was set in selectSlot (it is currentUser.uid)
    onlinePlayerRef = rtdb.ref(`onlinePlayers/${player_id}`);
    const connectedRef = rtdb.ref('.info/connected');

    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            const stateToSet = {
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                maxHealth: gameState.player.maxHealth,
                mapMode: gameState.mapMode,
                mapId: gameState.currentCaveId || gameState.currentCastleId || null,
                email: auth.currentUser.email
            };
            onlinePlayerRef.set(stateToSet);

            onlinePlayerRef.onDisconnect().remove().then(() => {
                // Prepare final save state on disconnect
                const finalState = {
                    ...gameState.player,
                    lootedTiles: Array.from(gameState.lootedTiles),
                    exploredChunks: Array.from(gameState.exploredChunks)
                };

                if (finalState.inventory) {
                    finalState.inventory = getSanitizedInventory();
                }

                delete finalState.color;
                delete finalState.character;
                playerRef.set(finalState, {
                    merge: true
                });
            });
        }
    });

    rtdb.ref('onlinePlayers').on('value', (snapshot) => {
        const newOtherPlayers = snapshot.val() || {};
        if (newOtherPlayers[player_id]) {
            // Update local player position if needed (mostly for debugging/sync)
            const myData = newOtherPlayers[player_id];
            gameState.player.x = myData.x;
            gameState.player.y = myData.y;
            delete newOtherPlayers[player_id];
        }
        otherPlayers = newOtherPlayers;
        render();
    });

    const sharedEnemiesRef = rtdb.ref('worldEnemies');
    sharedEnemiesRef.on('value', (snapshot) => {
        gameState.sharedEnemies = snapshot.val() || {};
        render(); // Re-render to show new health bars
    });

    unsubscribePlayerListener = playerRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // --- Update Inventory ---
            if (data.inventory) {
                data.inventory.forEach(item => {
                    // 1. Try exact name match
                    let templateItem = Object.values(ITEM_DATA).find(d => d.name === item.name);
                    
                    // 2. If not found, check if it's a Masterwork and strip the prefix
                    if (!templateItem && item.name.startsWith("Masterwork ")) {
                        const baseName = item.name.replace("Masterwork ", "");
                        templateItem = Object.values(ITEM_DATA).find(d => d.name === baseName);
                    }

                    if (templateItem) {
                        item.effect = templateItem.effect; // Re-bind function
                        
                        // Only reset stats if they are missing (preserve crafted stats!)
                        if (templateItem.type === 'weapon') {
                            if (!item.damage) item.damage = templateItem.damage;
                            item.slot = templateItem.slot;
                        } else if (templateItem.type === 'armor') {
                            if (!item.defense) item.defense = templateItem.defense;
                            item.slot = templateItem.slot;
                        }
                    }
                });

                const equippedWeapon = data.inventory.find(i => i.type === 'weapon' && i.isEquipped);
                const equippedArmor = data.inventory.find(i => i.type === 'armor' && i.isEquipped);

                gameState.player.equipment.weapon = equippedWeapon || { name: 'Fists', damage: 0 };
                gameState.player.equipment.armor = equippedArmor || { name: 'Simple Tunic', defense: 0 };

                gameState.player.inventory = data.inventory;
                renderInventory();
            }

            // --- Update Equipment Stats ---
            if (data.equipment) {
                gameState.player.equipment = {
                    ...{
                        weapon: { name: 'Fists', damage: 0 },
                        armor: { name: 'Simple Tunic', defense: 0 }
                    },
                    ...data.equipment
                };
                renderEquipment();
            }
        }
    });

    const timeRef = db.collection("world").doc("time");
    timeRef.onSnapshot((doc) => {
        if (doc.exists) {
            const newTime = doc.data();
            const oldTotalMinutes = (gameState.time.day * 1440) + (gameState.time.hour * 60) + gameState.time.minute;
            const newTotalMinutes = (newTime.day * 1440) + (newTime.hour * 60) + newTime.minute;
            const elapsedMinutes = newTotalMinutes - oldTotalMinutes;

            if (elapsedMinutes > 0) {
                const REGEN_PER_MINUTE = 0.1;
                const regenAmount = elapsedMinutes * REGEN_PER_MINUTE;
                const player = gameState.player;
                let statsUpdated = false;

                const applyRegen = (stat, maxStat, progressStat) => {
                    // --- LIGHT SURVIVAL: PENALTY CHECK ---
                    // If Hunger is 0, Health won't regen passively
                    if (stat === 'health' && gameState.player.hunger <= 0) return;
                    
                    // If Thirst is 0, Stamina won't regen passively
                    if (stat === 'stamina' && gameState.player.thirst <= 0) return;

                    if (player[stat] < player[maxStat]) {
                        player[progressStat] += regenAmount;
                        if (player[progressStat] >= 1) {
                            const pointsToAdd = Math.floor(player[progressStat]);
                            player[stat] = Math.min(player[maxStat], player[stat] + pointsToAdd);
                            player[progressStat] -= pointsToAdd;
                            statsUpdated = true;
                        }
                    }
                };

                if (player.health > 0) applyRegen('health', 'maxHealth', 'healthRegenProgress');
                applyRegen('stamina', 'maxStamina', 'staminaRegenProgress');
                applyRegen('mana', 'maxMana', 'manaRegenProgress');
                applyRegen('psyche', 'maxPsyche', 'psycheRegenProgress');

                if (statsUpdated) {
                    playerRef.update({
                        health: player.health,
                        stamina: player.stamina,
                        mana: player.mana,
                        psyche: player.psyche
                    });
                    renderStats();
                }
            }

            Object.assign(gameState.time, newTime);
            renderTime();
        }
    });

    const chatRef = rtdb.ref('chat').orderByChild('timestamp').limitToLast(100);
    chatRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageDiv = document.createElement('div');
        const date = new Date(message.timestamp);
        const timeString = date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
        if (message.senderId === player_id) {
            messageDiv.innerHTML = `<span class="muted-text text-xs">[${timeString}]</span> <strong class="highlight-text">${message.email}:</strong> ${message.message}`;
        } else {
            messageDiv.innerHTML = `<span class="muted-text text-xs">[${timeString}]</span> <strong>${message.email}:</strong> ${message.message}`;
        }
        chatMessages.prepend(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // --- 5. Final Render & Initialization ---
    renderStats();
    renderEquipment();
    renderTime();
    resizeCanvas();
    render();

    renderHotbar();
    
    canvas.style.visibility = 'visible';
    syncPlayerState();
    
    logMessage(`Welcome back, ${playerData.background} of level ${gameState.player.level}.`);
    updateRegionDisplay();

    updateExploration();

    loadingIndicator.classList.add('hidden');
    
    // Initialize all UI listeners
    initShopListeners();
    initSpellbookListeners();
    initInventoryListeners();
    initSkillbookListeners();
    initQuestListeners();
    initCraftingListeners();
    initSkillTrainerListeners();
    initMobileControls();
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) applyTheme(savedTheme);
        else if (prefersDark) applyTheme('dark');
        else applyTheme('light');
        
        // --- Call initCharacterSelect instead of startGame ---
        initCharacterSelect(user); 
    } else {
        authContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        characterSelectModal.classList.add('hidden'); // Hide select modal
        player_id = null;
        if (onlinePlayerRef) onlinePlayerRef.remove();
        if (unsubscribePlayerListener) unsubscribePlayerListener();
        Object.values(worldStateListeners).forEach(unsubscribe => unsubscribe());
        worldStateListeners = {};
        clearSessionState();
        console.log("No user is signed in.");
    }
});

function gameLoop() {
    // 1. Update Particles
    ParticleSystem.update();
    
    // 2. Re-render the game
    // Note: This renders 60fps. If performance is an issue, we can limit this.
    if (gameState.mapMode) {
        render();
    }

    requestAnimationFrame(gameLoop);
}

// Start the loop
requestAnimationFrame(gameLoop);

window.addEventListener('resize', resizeCanvas);
