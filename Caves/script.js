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
    'R': {
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
    'T': {
        type: 'decoration', // Dead Tree
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
        spawn: { x: 14, y: 14 }, // Spawn in the middle
        map: [
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'F.🔥.FFFFFFFFFFFFFFFFFFFFFFFFF',
            'F.F........................FFF',
            'FFF..▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓..FFF',
            'FFF..▓...H.▓...▓...§.▓...▓...T.▓..FFF',
            'FFF..▓.....▓...▓.....▓...▓.....▓..FFF',
            'FFF..▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓▓..FFF',
            'FFF........................FFF',
            'FFF........................FFF',
            'FFF..▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓..FFF',
            'FFF..▓...W.▓...▓.....▓...▓.....▓..FFF',
            'FFF..▓.....▓...▓..B..▓...▓.....▓..FFF',
            'FFF..▓▓▓▓▓▓...▓▓▓▓▓▓...▓▓▓▓▓▓..FFF',
            'FFF............X.............FFF', // Use 'X' as the exit
            'FFF........................FFF',
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
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
        name: 'Stamina Crystal',
        price: 15,
        stock: 20
    },
    {
        name: 'Mana Orb',
        price: 20,
        stock: 10
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
    }
];

const QUEST_DATA = {
    "goblinHeirloom": {
        title: "The Lost Heirloom",
        description: "A villager is distraught. A goblin ('g') stole their family heirloom!",
        type: 'fetch',       // <-- New quest type
        enemy: 'g',          // <-- Who drops it (Goblin)
        itemNeeded: 'Heirloom', // <-- What we need (from ITEM_DATA)
        itemTile: '♦',       // <-- The tile to drop (from ITEM_DATA)
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

const ENEMY_DATA = {
    'g': {
        name: 'Goblin',
        maxHealth: 3, // Down from 5
        attack: 1, // Down from 2
        defense: 0,
        xp: 5, // Down from 10
        loot: 't'
    },
    's': {
        name: 'Skeleton',
        maxHealth: 5, // Down from 8
        attack: 2, // Down from 3
        defense: 0, // Down from 1
        xp: 10, // Down from 15
        loot: '('
    },
    'b': {
        name: 'Bandit',
        maxHealth: 6, // Down from 10
        attack: 2, // Down from 3
        defense: 0, // Down from 1
        xp: 10, // Down from 20
        loot: 'i'
    },
    'w': {
        name: 'Wolf',
        maxHealth: 4, // Down from 6
        attack: 2, // Down from 4 (This is the biggest fix)
        defense: 0,
        xp: 8, // Down from 15
        loot: 'p'
    },
    'C': {
        name: 'Bandit Chief',
        maxHealth: 12, // Tougher than a normal Bandit
        attack: 3,     // Hits harder
        defense: 2,
        xp: 25,
        loot: 'i'      // Drops the same insignia (or we could change it)
    },
    'o': {
        name: 'Orc Brute',
        maxHealth: 15, // High health
        attack: 4,     // High attack
        defense: 1,    // Low defense
        xp: 30,
        loot: 'U'      // New item: Orc Tusk
    },
    'm': {
        name: 'Arcane Mage',
        maxHealth: 10, // Low health
        attack: 5,     // Very high attack (like a glass cannon)
        defense: 0,
        xp: 30,
        loot: '&',
        caster: true,
        castRange: 6,
        spellDamage: 5 
    },
    'Z': {
        name: 'Draugr',
        maxHealth: 12, // Tough
        attack: 3,     // Decent attack
        defense: 2,    // High defense
        xp: 25,
        loot: 'E',
        caster: true,
        castRange: 5,
        spellDamage: 4,
        inflicts: 'frostbite'
    },
    '@': {
        name: 'Giant Spider',
        maxHealth: 6,     // Low health (glass cannon)
        attack: 3,        // Decent melee attack
        defense: 0,
        xp: 12,
        loot: '"',        // Drops our new "Spider Silk" item
        caster: true,     // It "spits" poison
        castRange: 4,     // Shorter range than a mage
        spellDamage: 2,   // The spell itself does low damage...
        inflicts: 'poison'  // ...but it inflicts POISON
    },
    '🦂': {
        name: 'Giant Scorpion',
        maxHealth: 6,
        attack: 3,
        defense: 1, // Hard shell
        xp: 15,
        loot: 'i', // Chitin/Insignia
        inflicts: 'poison'
    },
    '🐺': {
        name: 'Dire Wolf',
        maxHealth: 12,    // Double a normal wolf
        attack: 4,        // Hits hard
        defense: 1,
        xp: 40,
        loot: '🐺'        // Drops Alpha Pelt
    },
    '👺': {
        name: 'Goblin Warlord',
        maxHealth: 15,    // Tanky
        attack: 5,        // Very dangerous
        defense: 2,
        xp: 50,
        loot: '$'         // Drops gold\
    },
    'a': {
        name: 'Shadow Acolyte',
        maxHealth: 5,
        attack: 1,
        defense: 0,
        xp: 8,
        loot: 'r' // Drops our new "Corrupted Relic"
    },
    'l': {
        name: 'Giant Leech',
        maxHealth: 8,      // Tanky (High HP)
        attack: 1,         // Low direct damage...
        defense: 0,
        xp: 12,
        loot: 'p',         // Drops slime/pelts (we can use 'p' for now)
        inflicts: 'poison' // ...but dangerous because of poison!
    }
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
        decorations: ['+', 'o', '$', '📖', 'K'],
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
        decorations: ['S', 'Y', '$', 'R', '❄️'],
        enemies: ['s', 'w', 'Z']
    },
    FIRE: {
        name: 'A Volcanic Fissure',
        wall: '▓',
        secretWall: '▒',
        floor: '.', // Use a standard floor tile
        colors: {
            wall: '#450a0a',
            floor: '#ef4444'
        }, // The red color makes it look like lava
        decorations: ['+', '$', '🔥', 'J'],
        enemies: ['b', 'C', 'o', 'm', '👺']
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
        decorations: ['+', '$', '(', '†', '🌀', '😱', '💀'],
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

    GROTTO: {
        name: 'A Sunken Grotto',
        wall: '▓', // Use standard 'rock' wall
        floor: ':', // Use 'ice' floor, but colors make it look slick/wet
        secretWall: '▒',
        colors: {
            wall: '#14532d', // Dark Green
            floor: '#16a34a' // Bright Green
        },
        decorations: ['+', 'S', 'o', '☣️'],
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

let TILE_SIZE = 12;

const VIEWPORT_WIDTH = 40;
const VIEWPORT_HEIGHT = 25;
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

const LORE_PLAINS = [
    "The wind whispers of the Old King's return.",
    "These fields were once a great battlefield.",
    "Travelers say the safe haven lies to the west.",
    "The grass hides many secrets, and many graves.",
    "Look for the shrines. They still hold power."
];

const LORE_FOREST = [
    "The trees remember what the axe forgets.",
    "Wolves guard the heart of the wood.",
    "Beware the shadows that move against the wind.",
    "The Elves left long ago, but their magic remains.",
    "A Machete is a traveler's best friend here."
];

const LORE_MOUNTAIN = [
    "The stone is hollow. The dark deepens.",
    "Dragons once roosted on these peaks.",
    "The Prospector seeks gold, but he will find only madness.",
    "Iron and bone. That is all that remains here.",
    "Climbing requires strength, or the right tools."
];

const LORE_SWAMP = [
    "The water tastes of rot and old magic.",
    "Sickness takes the weak. Endurance is key.",
    "The spiders... they are growing larger.",
    "Do not follow the lights in the mist.",
    "A sunken city lies beneath the muck."
];

const VILLAGER_RUMORS = [
    "I heard spiders hate fire. Burn 'em, I say!",
    "If you find a pickaxe, try the mountains. Good ore there.",
    "The castle guards are tough, but they protect good loot.",
    "Don't eat the yellow snow. Or the blue mushrooms.",
    "I saw a stone glowing in the woods last night.",
    "My cousin went into the crypts. He came back... wrong.",
    "Endurance helps you resist the swamp sickness.",
    "Wits will help you find hidden doors in the caves."
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
        coins: 0,
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

        inventory: [],

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

        frostbiteTurns: 0,
        poisonTurns: 0,
        rootTurns: 0,

        isBoating: false,

        activeTreasure: null,

        quests: {}
    };
}

async function restartGame() {
    // Get the default state for a new character
    const defaultState = createDefaultPlayerState();

    // Update the current game state in memory
    Object.assign(gameState.player, defaultState);

    gameState.mapMode = 'overworld';
    gameState.currentCastleId = null;
    gameState.currentCaveId = null;

    clearSessionState(); // Resets lootedTiles and discoveredRegions

    // Save the new default state to the database
    await playerRef.set(defaultState);

    // Update all the UI elements to reflect the new state
    logMessage("Your adventure begins anew...");
    renderStats();
    renderInventory();
    updateRegionDisplay();
    render();

    // Hide the game over screen
    gameOverModal.classList.add('hidden');
}

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

const CRAFTING_RECIPES = {
    // Tier 1 Items
    "Leather Tunic": { // The name of the item from ITEM_DATA
        "Wolf Pelt": 3    // Requires 3 "Wolf Pelt"
    },
    "Stick": {
        "Bone Shard": 3   // 3 Bone Shards -> 1 Stick (for future use)
    },
    
    // Tier 2 Items
    "Bone Dagger": {      // A new item we will define
        "Bone Shard": 5,
        "Stick": 1
    },
    "Bandit Garb": {      // A new item
        "Bandit's Insignia": 3,
        "Leather Tunic": 1
    },
    "Steel Sword": {
        "Rusty Sword": 1,
        "Orc Tusk": 4
    },
    "Steel Armor": {
        "Studded Armor": 1,
        "Orc Tusk": 6
    },
    "Warlock's Staff": {
        "Bone Dagger": 1,
        "Arcane Dust": 5
    },
    "Bandit's Boots": {
        "Bandit's Insignia": 5, // Requires 5 insignias
        "Wolf Pelt": 2          // And some pelts for padding
    },
    "Orcish Helm": {
        "Orc Tusk": 6,          // Requires 6 tusks
        "Bone Shard": 4         // And some bone shards for reinforcement
    },
    "Poisoned Dagger": {
        "Bone Dagger": 1,
        "Spider Silk": 5 // Uses the spider loot!
    },
    "Potion of Strength": {
        "Healing Potion": 1, // Requires a potion base
        "Orc Tusk": 2        // And some strong tusks
    },
    "Pickaxe": {
        "Stick": 2,
        "Orc Tusk": 3 // Tusks make a good pick head
    },
    "Spike Trap": {
        "Iron Ore": 3,
        "Bone Shard": 3
    },
    "Iron Sword": {
        "Iron Ore": 5,
        "Stick": 1
    },
    "Iron Mail": {
        "Iron Ore": 8,
        "Leather Tunic": 1 // This is a compound recipe!
    },
    "Iron Helm": {
        "Iron Ore": 4,
        "Wolf Pelt": 1 // For padding
    },
    "Obsidian Edge": {
        "Obsidian Shard": 3, // Requires finding 3 Obelisks!
        "Steel Sword": 1,    // Upgrade from Steel
        "Arcane Dust": 5
    },
    "Obsidian Plate": {
        "Obsidian Shard": 4, // Requires finding 4 Obelisks!
        "Steel Armor": 1,    // Upgrade from Steel
        "Frost Essence": 3
    },
    "Arcane Wraps": {
        "Arcane Dust": 5,
        "Spider Silk": 2 // Uses other junk items
    },
    "Frozen Greaves": {
        "Frost Essence": 5,
        "Wolf Pelt": 3   // Uses other junk items
    },
    "Mage Robe": {
        "Bandit Garb": 1,
        "Arcane Dust": 5
    },"Cryo Blade": {
        "Rusty Sword": 1,
        "Frost Essence": 5
    },
    "Silk Cowl": {
        "Spider Silk": 4
    },
    "Silk Gloves": {
        "Spider Silk": 3
    },
    "Reinforced Tunic": {
        "Leather Tunic": 1, // <-- Uses a crafted item!
        "Spider Silk": 4
    },
    "Arcane Blade": {
        "Steel Sword": 1,   // <-- Uses a crafted item!
        "Arcane Dust": 5
    },
    "Machete": {
        "Bone Dagger": 1, // Requires a hilt/blade
        "Stick": 2,
        "Wolf Pelt": 1 // For the grip
    },
    "Climbing Tools": {
        "Stick": 3,
        "Wolf Pelt": 3, // For straps and ropes
        "Bone Shard": 5 // For spikes/hooks
    },
    "Frozen Mail": {
        "Studded Armor": 1,
        "Frost Essence": 5
    }
};

const ITEM_DATA = {
    '+': {
        name: 'Healing Potion',
        type: 'consumable',
        effect: (state) => {
            const oldHealth = state.player.health;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + HEALING_AMOUNT);
            if (state.player.health > oldHealth) {
                // MODIFIED: Use the new pulse animation
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            }
            logMessage(`Used a Healing Potion. Restored ${HEALING_AMOUNT} health!`);
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
        }
    },

    'S': {
        name: 'Stamina Crystal',
        type: 'consumable',
        effect: (state) => {
            const oldStamina = state.player.stamina;
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + STAMINA_RESTORE_AMOUNT);
            if (state.player.stamina > oldStamina) {
                // MODIFIED: Use the new pulse animation
                triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            }
            logMessage(`Used a Stamina Crystal. Restored ${STAMINA_RESTORE_AMOUNT} stamina!`);
        }
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
        },
        ':': {
        name: 'Wildberry',
        type: 'consumable',
        effect: (state) => {
            const oldHealth = state.player.health;
            state.player.health = Math.min(state.player.maxHealth, state.player.health + 1);
            if (state.player.health > oldHealth) {
                triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            }
            logMessage('You eat a Wildberry. Tasty! (+1 HP)');
        }
    },
    '🍄': {
        name: 'Bluecap Mushroom',
        type: 'consumable',
        effect: (state) => {
            const oldMana = state.player.mana;
            state.player.mana = Math.min(state.player.maxMana, state.player.mana + 1);
            if (state.player.mana > oldMana) {
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
            }
            logMessage('You eat a Bluecap. It tingles... (+1 Mana)');
        }
    },
    },
    '📖': {
        name: 'Spellbook: Lesser Heal',
        type: 'spellbook',
        spellId: 'lesserHeal' // This links it to SPELL_DATA
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
    '/': {
        name: 'Stick',
        type: 'weapon', // A new type
        damage: 1, // It's better than Fists!
        slot: 'weapon'
    },
    '%': {
        name: 'Leather Tunic',
        type: 'armor',
        defense: 1,
        slot: 'armor'
    },
    '!': {
        name: 'Rusty Sword',
        type: 'weapon',
        damage: 2,
        slot: 'weapon'
    },
    '[': {
        name: 'Studded Armor',
        type: 'armor',
        defense: 2,
        slot: 'armor'
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
        slot: 'weapon'
    },
    '¶': { // Pilcrow (paragraph) symbol
        name: 'Bandit Garb',
        type: 'armor',
        defense: 2, // Same as Studded Armor (Tier 2)
        slot: 'armor'
    },
    'U': {
        name: 'Orc Tusk',
        type: 'junk'
    },
    '&': {
        name: 'Arcane Dust',
        type: 'junk'
    },
    
    // --- NEW TIER 3 GEAR ---
    '=': {
        name: 'Steel Sword',
        type: 'weapon',
        damage: 4, // Better than Rusty Sword (2)
        slot: 'weapon'
    },
    'A': { // Using 'A' for Heavy armor
        name: 'Steel Armor',
        type: 'armor',
        defense: 4, // Better than Studded Armor (2)
        slot: 'armor'
    },
    'Ψ': { // Psi symbol
        name: 'Warlock\'s Staff',
        type: 'weapon',
        damage: 3, // A good magic-themed weapon
        slot: 'weapon',
        statBonuses: { willpower: 2 }
    },
    'M': { // Using 'M' for Mage robe
        name: 'Mage Robe',
        type: 'armor',
        defense: 3, // Good, but less than Steel
        slot: 'armor',
        statBonuses: { wits: 1 }
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
        type: 'junk'
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
    'r': {
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
            logMessage("You drink the thick red liquid. Your Max Health increases by 5!");
            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
        }
    },
    '🧪': { // Reusing the potion icon, or we can use a new one like ⚗️
        name: 'Elixir of Power',
        type: 'consumable',
        effect: (state) => {
            state.player.maxMana += 5;
            state.player.mana += 5;
            logMessage("You drink the glowing blue liquid. Your Max Mana increases by 5!");
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
    '🍐': { // Using pear icon for cactus fruit
        name: 'Cactus Fruit',
        type: 'consumable',
        effect: (state) => {
            state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 5);
            logMessage('Juicy and refreshing! (+5 Stamina)');
            triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
        }
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
};

const SPELL_DATA = {
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

const SKILL_DATA = {
    "brace": {
        name: "Brace",
        description: "Gain temporary Defense. Scales with Constitution.",
        cost: 6,
        costType: "stamina",
        requiredLevel: 2, // Player level needed to learn this
        target: "self",   // 'self' or 'aimed'
        type: "buff",
        // Formula: defense = base + (Constitution * 0.5)
        baseDefense: 1, 
        duration: 3 // Lasts for 3 player turns
    },
    "lunge": {
        name: "Lunge",
        description: "Attack an enemy 2-3 tiles away. Scales with Strength.",
        cost: 5,
        costType: "stamina",
        requiredLevel: 2,
        target: "aimed",
        // Formula: damage = (PlayerDamage * 1.0) + (Strength * level)
        baseDamageMultiplier: 1.0 
    },
    "pacify": {
        name: "Pacify",
        description: "Attempt to calm a hostile target, making it non-aggressive. Scales with Charisma.",
        cost: 10,
        costType: "psyche",
        requiredLevel: 3,
        target: "aimed"
    },
    "inflictMadness": {
        name: "Inflict Madness",
        description: "Assault a target's mind, causing it to flee in terror for 5 turns. Scales with Charisma.",
        cost: 12,
        costType: "psyche",
        requiredLevel: 5,
        target: "aimed"
    }
    // We can add more skills here later (e.g., Power Attack, Whirlwind)
};

const statDisplays = {
    health: document.getElementById('healthDisplay'),
    mana: document.getElementById('manaDisplay'),
    stamina: document.getElementById('staminaDisplay'),
    psyche: document.getElementById('psycheDisplay'),
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
    xp: document.getElementById('xpBar')
};

const elevationNoise = Object.create(Perlin);
elevationNoise.init(WORLD_SEED + ':elevation');
const moistureNoise = Object.create(Perlin);
moistureNoise.init(WORLD_SEED + ':moisture');

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

        // 1. Pick a theme for this cave, seeded by its location
        const randomTheme = Alea(stringToSeed(caveId + ':theme'));
        const themeKeys = Object.keys(CAVE_THEMES);
        const chosenThemeKey = themeKeys[Math.floor(randomTheme() * themeKeys.length)];
        const theme = CAVE_THEMES[chosenThemeKey];
        this.caveThemes[caveId] = chosenThemeKey; // Remember the theme

        // 2. Generate the map layout
        const CAVE_WIDTH = 70;
        const CAVE_HEIGHT = 70;
        const map = Array.from({
            length: CAVE_HEIGHT
        }, () => Array(CAVE_WIDTH).fill(theme.wall)); // Use theme's wall
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

        // --- 3. (NEW) STAMP THEMED ROOMS ---
        // We do this *before* procedural loot/enemies
        
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
                        this.caveEnemies[caveId].push({
                            id: `${caveId}:${mapX},${mapY}`,
                            x: mapX,
                            y: mapY,
                            tile: tileToPlace,
                            name: enemyTemplate.name,
                            health: enemyTemplate.maxHealth,
                            maxHealth: enemyTemplate.maxHealth,
                            attack: enemyTemplate.attack,
                            defense: enemyTemplate.defense,
                            xp: enemyTemplate.xp,
                            loot: enemyTemplate.loot,
                            madnessTurns: 0,
                            frostbiteTurns: 0,
                            poisonTurns: 0
                        });
                    }
                }
            }
        }

        // 4. Place procedural loot and decorations

        const CAVE_LOOT_TABLE = ['+', 'o', 'Y', 'S', '$', '📄', '🍄'];
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

        // 5. (MOVED) Place procedural enemies
        // This loop now spawns enemies in the random corridors
        // AND in the "F" (floor) tiles of our stamped rooms
        
        const enemyTypes = theme.enemies || Object.keys(ENEMY_DATA);

        for (let i = 0; i < 20; i++) { // Try to spawn 20 enemies
            const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
            const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

            // Only spawn on a floor tile that isn't the start
            if (map[randY][randX] === theme.floor && (randX !== startPos.x || randY !== startPos.y)) {
                const enemyTile = enemyTypes[Math.floor(random() * enemyTypes.length)];
                const enemyTemplate = ENEMY_DATA[enemyTile];

                // Place the enemy tile on the map
                map[randY][randX] = enemyTile;

                // Add its data to the caveEnemies template cache
                this.caveEnemies[caveId].push({
                    id: `${caveId}:${randX},${randY}`,
                    x: randX,
                    y: randY,
                    tile: enemyTile,
                    name: enemyTemplate.name,
                    health: enemyTemplate.maxHealth, // Start at full health
                    maxHealth: enemyTemplate.maxHealth,
                    attack: enemyTemplate.attack,
                    defense: enemyTemplate.defense,
                    xp: enemyTemplate.xp,
                    loot: enemyTemplate.loot,
                    madnessTurns: 0,
                    frostbiteTurns: 0,
                    poisonTurns: 0
                });
            }
        }
        
        // 6. (NEW) Place the Exit
        // We do this *after* rooms are stamped to ensure the exit isn't overwritten.
        map[startPos.y][startPos.x] = '>'; // Place the exit
        
        // --- This is where the old function's logic resumes ---
        // (The Secret Wall logic starts here, around line 1361)
        const secretWallTile = theme.secretWall;
        
        if (secretWallTile) { // Only run if the theme *has* a secret wall defined
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
                            // We also check that there is solid wall 2-tiles away to carve into
                            if (floorDir === 0 && map[y + 2][x] === theme.wall) { // Entrance North, carve South
                                map[y + 1][x] = secretWallTile;
                                map[y + 2][x] = '$'; // Place treasure right behind it
                            } else if (floorDir === 1 && map[y - 2][x] === theme.wall) { // Entrance South, carve North
                                map[y - 1][x] = secretWallTile;
                                map[y - 2][x] = '$';
                            } else if (floorDir === 2 && map[y][x + 2] === theme.wall) { // Entrance West, carve East
                                map[y][x + 1] = secretWallTile;
                                map[y][x + 2] = '$';
                            } else if (floorDir === 3 && map[y][x - 2] === theme.wall) { // Entrance East, carve West
                                map[y][x - 1] = secretWallTile;
                                map[y][x - 2] = '$';
                            }
                        }
                    }
                }
            }
        }

        map[startPos.y][startPos.x] = '>'; // Place the exit
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

        const map = baseMap.map(row => row.split(''));

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

        let chunkData = Array.from({
            length: this.CHUNK_SIZE
        }, () => Array(this.CHUNK_SIZE));
        for (let y = 0; y < this.CHUNK_SIZE; y++) {
            for (let x = 0; x < this.CHUNK_SIZE; x++) {
                const worldX = chunkX * this.CHUNK_SIZE + x;
                const worldY = chunkY * this.CHUNK_SIZE + y;
                const elev = elevationNoise.noise(worldX / 70, worldY / 70);
                const moist = moistureNoise.noise(worldX / 50, worldY / 50);

                let tile = '.';
                if (elev < 0.35) tile = '~'; // Water
                else if (elev < 0.4 && moist > 0.7) tile = '≈'; // Swamp: low elevation, very high moisture
                else if (elev > 0.8) tile = '^'; // Mountain
                // High-ish elevation (hills) but very dry
                else if (elev > 0.6 && moist < 0.3) tile = 'd'; // Deadlands
                // Low elevation and very dry
                else if (moist < 0.15) tile = 'D';
                else if (moist > 0.55) tile = 'F'; // Forest
                else tile = '.'; // Plains

            const featureRoll = random();

                
                if (tile === '.' && featureRoll < 0.000001) { 
                    this.setWorldTile(worldX, worldY, '♛');
                    chunkData[y][x] = '♛';
                
                } else if (tile === '.' && featureRoll < 0.000011) { 
                    this.setWorldTile(worldX, worldY, 'V');
                    chunkData[y][x] = 'V';

                } else if (tile === '.' && featureRoll < 0.000061) { 
                    this.setWorldTile(worldX, worldY, '⛩️');
                    chunkData[y][x] = '⛩️';

                } else if (tile === '.' && featureRoll < 0.000071) { 
                    this.setWorldTile(worldX, worldY, '|');
                    chunkData[y][x] = '|';

                } else if (tile === '.' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '⛲');
                    chunkData[y][x] = '⛲';
                } else if ((tile === 'd' || tile === 'D') && featureRoll < 0.00001) { 
                    this.setWorldTile(worldX, worldY, 'Ω');
                    chunkData[y][x] = 'Ω';

                } else if (tile === '.' && featureRoll < 0.001) { 
                    let features = Object.keys(TILE_DATA);
                    // Filter out tiles that shouldn't auto-spawn
                    features = features.filter(f => TILE_DATA[f].type !== 'dungeon_exit' &&
                        TILE_DATA[f].type !== 'castle_exit' &&
                        TILE_DATA[f].type !== 'enemy' &&
                        f !== '📖' && // Don't spawn Lesser Heal
                        f !== '♛' && // Already spawned
                        f !== 'V' && // Already spawned
                        f !== 'c'    // Spawned separately
                    );

                    // Use the seeded random, not Math.random
                    const featureTile = features[Math.floor(random() * features.length)]; 
                    
                  
                    // ALWAYS set the tile in the DB and local chunk
                    this.setWorldTile(worldX, worldY, featureTile);
                    chunkData[y][x] = featureTile;
                   

                } else if (tile === '.' && featureRoll < 0.015) {
                    // Check if this land tile is adjacent to water by checking elevation noise
                    
                    // This helper function checks the noise value for a given coord
                    const isWater = (wx, wy) => {
                        const e = elevationNoise.noise(wx / 70, wy / 70);
                        return e < 0.35; // This is our water threshold
                    };

                    // Check neighbors' noise instead of calling getTile()
                    if (isWater(worldX, worldY - 1) || // North
                        isWater(worldX, worldY + 1) || // South
                        isWater(worldX - 1, worldY) || // West
                        isWater(worldX + 1, worldY))   // East
                    {
                        chunkData[y][x] = 'c'; // Place a canoe!
                        this.setWorldTile(worldX, worldY, 'c');
                    } else {
                        chunkData[y][x] = tile; // No water, just place the terrain
                    }

                } else {
                    // No safe feature spawned. Check for hostiles or foraging.
                    const hostileRoll = random();

                    // --- FORESTS: Wolves ('w') or Wildberries (':') ---
                    if (tile === 'F') {
                        if (hostileRoll < 0.002) {
                            chunkData[y][x] = 'w'; 
                        } else if (hostileRoll < 0.00025) { // Rare Elite Spawn
                            chunkData[y][x] = '🐺'; 
                        } else if (hostileRoll < 0.00035) { // Rare Trader Spawn
                            chunkData[y][x] = '¥';
                            this.setWorldTile(worldX, worldY, '¥');
                        } else if (hostileRoll < 0.001) { 
                            chunkData[y][x] = ':'; 
                            this.setWorldTile(worldX, worldY, ':');
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }

                    else if (tile === 'd') {
                        // Deadlands are dangerous!
                        if (hostileRoll < 0.0001) { // High spawn rate
                            if (hostileRoll < 0.000005) chunkData[y][x] = 's'; // Skeletons
                            else chunkData[y][x] = 'b'; // Bandits
                        } else if (hostileRoll < 0.0002) {
                             chunkData[y][x] = 'T'; // Dead Trees (Decoration)
                             this.setWorldTile(worldX, worldY, 'T');
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }

                        else if (tile === 'D') {
                         if (hostileRoll < 0.0002) { // Cacti are common
                            chunkData[y][x] = '🌵';
                            this.setWorldTile(worldX, worldY, '🌵');
                         } else if (hostileRoll < 0.0022) { // Scorpions
                            chunkData[y][x] = '🦂';
                         } else {
                            chunkData[y][x] = tile;
                         }
                    }

                    // --- SWAMPS: Giant Leeches ('l') ---
                    else if (tile === '≈') {
                        if (hostileRoll < 0.0000003) { // Slightly more common than wolves
                            chunkData[y][x] = 'l'; // Giant Leech
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }
                    // --- PLAINS: Wolves, Bandits, or Chiefs ---
                    else if (tile === '.') {
                        if (hostileRoll < 0.000002) {
                            if (hostileRoll < 0.000001) {
                                chunkData[y][x] = 'w'; // Wolf
                            } else {
                                // Bandit spawn
                                if (random() < 0.1) chunkData[y][x] = 'C'; // Chief
                                else chunkData[y][x] = 'b'; // Bandit
                            }
                        } else if (hostileRoll < 0.000025) { // Rare Trader Spawn (Plains)
                            chunkData[y][x] = '¥';
                            this.setWorldTile(worldX, worldY, '¥');
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }
                    // No hostile spawn, just place the terrain tile
                    else {
                        chunkData[y][x] = tile;
                    }
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
        poisonTurns: 0
    },

    lootedTiles: new Set(),
    discoveredRegions: new Set(),
    mapMode: 'overworld',
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
    instancedEnemies: [],
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
                // --- END NEW ---
                
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

            } else if (statName === 'psyche') {
                const max = gameState.player.maxPsyche;
                const percent = (value / max) * 100;
                statBarElements.psyche.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

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
        inventory: inventoryToSave
    
    }); // Save the clean version

    // 7. Exit drop mode
    gameState.isDroppingItem = false;
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

        // Is this an active fetch quest, for this enemy?
        if (playerQuest.status === 'active' && 
            questData.type === 'fetch' &&
            questData.enemy === enemyTile) 
        {
            // Does the player NOT already have the item?
            const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
            
            if (!hasItem) {
                // Player is on the quest and needs the item. Roll for it!
                // 5% base chance + 0.5% per point of Luck
                const dropChance = 0.05 + (player.luck * 0.005); 
                
                if (Math.random() < dropChance) {
                    logMessage(`The ${enemy.name} dropped a ${questData.itemNeeded}!`);
                    return questData.itemTile; // Return the '♦' tile
                }
            }
        }
    }

    // --- DEFINE DROP CHANCES ---
    // --- NEW LUCK LOGIC ---
    // Base 25% junk chance. Each point of Luck reduces this by 0.1%
    // Capped at a minimum of 5% junk chance.
    const JUNK_DROP_CHANCE = Math.max(0.05, 0.25 - (player.luck * 0.001));
    const GOLD_DROP_CHANCE = 0.50; // 50% chance for gold
    // (This leaves a 25% chance for level-scaled loot)

    const roll = Math.random(); // A roll from 0.0 to 1.0

    // --- 1. Check for Junk Drop (First % based on Luck) ---
    if (enemy.loot && roll < JUNK_DROP_CHANCE) { // roll < (e.g., 0.25)

        // Use the enemy's specific loot item (e.g., 'p' for Wolf Pelt)
        // If one isn't defined, fall back to Gold.
        return enemy.loot || '$';
    }

    // --- 2. Check for Gold Drop (Next 50%) ---
    if (roll < JUNK_DROP_CHANCE + GOLD_DROP_CHANCE) { // roll < 0.75 (0.25 + 0.50)
        return '$'; // Drop gold
    }

    // --- 3. If neither, generate Level-Scaled Loot (Final 25%) ---
    // This is your original tiered loot logic, but with Gold
    // REMOVED from the commonLoot pool.

    const scaledRoll = Math.random(); // A *new* roll just for the tiered loot

    // --- IMPORTANT: Gold '$' is REMOVED from this list ---
    const commonLoot = ['+', 'o', 'S', 'Y']; // Consumables ONLY
    const tier1Loot = ['/', '%']; // Stick, Leather Tunic
    const tier2Loot = ['!', '[', '📚', '🛡️']; // Rusty Sword, Studded Armor, Spellbook: Magic Bolt, Tome of Shielding

    // --- Tier 2 Loot (Best) ---
    // (This logic is unchanged)
    const tier2Chance = Math.max(0, (player.level - 1) * 0.08);
    if (scaledRoll < tier2Chance) {
        return tier2Loot[Math.floor(Math.random() * tier2Loot.length)];
    }

    // --- Tier 1 Loot (Medium) ---
    // (This logic is unchanged)
    const tier1Chance = Math.max(0.1, 0.30 - (player.level * 0.03));
    if (scaledRoll < tier2Chance + tier1Chance) {
        return tier1Loot[Math.floor(Math.random() * tier1Loot.length)];
    }

    // --- Common Loot (Base) ---
    // (This is now just consumables)
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
            const amount = item.statBonuses[stat] * operation;
            player[stat] += amount;

            // Log the change
            if (operation === 1) {
                logMessage(`You feel ${stat} increase! (+${item.statBonuses[stat]})`);
                triggerStatFlash(statDisplays[stat], true);
            } else {
                logMessage(`You feel your ${stat} bonus fade...`);
                triggerStatFlash(statDisplays[stat], false);
            }
        }
    }
    // We don't need to renderStats() here, the equip logic will do it.
}

function grantXp(amount) {
    const player = gameState.player;
    player.xp += amount;
    logMessage(`You gained ${amount} XP!`);

    triggerStatFlash(statDisplays.xp, true); // Flash green for XP gain

    // Check for level up (using 'while' handles multiple level-ups at once)
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel; // Subtract the XP needed, keep the remainder
        player.level++;
        player.statPoints++;
        player.xpToNextLevel = player.level * 100; // The next level costs more

        logMessage(`LEVEL UP! You are now level ${player.level}!`);
        logMessage(`You have ${player.statPoints} stat point(s) to spend.`);

        // Optional: Flash the level and stat point displays
        triggerStatAnimation(statDisplays.level, 'stat-pulse-blue');
        triggerStatAnimation(statDisplays.statPoints, 'stat-pulse-purple');
    }

    // Save the new XP and level state to Firestore
    playerRef.update({
        xp: player.xp,
        level: player.level,
        xpToNextLevel: player.xpToNextLevel,
        statPoints: player.statPoints
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

    // 2. Check if player has inventory space
    const existingStack = player.inventory.find(item => item.name === itemName);
    if (!existingStack && player.inventory.length >= MAX_INVENTORY_SLOTS) {
        logMessage("Your inventory is full!");
        return;
    }

    // 3. Process the transaction
    player.coins -= finalBuyPrice; // <-- Use new variable
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
        coins: player.coins,
        inventory: inventoryToSave // Save the clean version
    });

    renderShop(); // Re-render the shop to show new gold and inventory
    renderInventory(); // Update the main UI inventory
    renderStats(); // Update the main UI gold display
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
    // If not in the shop, we'll give it a default low price.
    const shopItem = activeShopInventory.find(item => item.name === itemToSell.name);
    const basePrice = shopItem ? shopItem.price : 2; // Sell unlisted items for 2 gold

    // --- NEW CHARISMA LOGIC ---
    // SELL_MODIFIER is 0.5 (50%)
    const sellBonusPercent = player.charisma * 0.005; // 0.5% bonus per Charisma
    // Cap the bonus at 50% (at 100 Charisma), for a max of 100% sell price
    const finalSellBonus = Math.min(sellBonusPercent, 0.5); 
    const sellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus));
    // --- END NEW LOGIC ---

    // 1. Process the transaction
    player.coins += sellPrice;
    logMessage(`You sold a ${itemToSell.name} for ${sellPrice} gold.`);

    // 2. Remove one from the stack
    itemToSell.quantity--;
    if (itemToSell.quantity <= 0) {
        // If stack is empty, remove it
        player.inventory.splice(itemIndex, 1);
    }

    // 3. Update database and UI
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
        coins: player.coins,
        inventory: inventoryToSave // Save the clean version
    });
    renderShop();
    renderInventory();
    renderStats();
}

function resizeCanvas() {
    // Get the container element that holds the canvas
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return; // Exit if container not found

    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight; // We might need this later

    // Calculate the best tile size based on width, ensuring it's an integer
    // We subtract a small amount (e.g., 2px) to prevent potential minor overflow issues
    const newTileSizeBasedOnWidth = Math.max(8, Math.floor((containerWidth - 2) / VIEWPORT_WIDTH));

    // --- Optional: Add height constraint if needed ---
    // const newTileSizeBasedOnHeight = Math.max(8, Math.floor((containerHeight - 2) / VIEWPORT_HEIGHT));
    // TILE_SIZE = Math.min(newTileSizeBasedOnWidth, newTileSizeBasedOnHeight); // Use the smaller size
    TILE_SIZE = newTileSizeBasedOnWidth; // Using width only for now

    // Update the canvas internal resolution
    canvas.width = VIEWPORT_WIDTH * TILE_SIZE;
    canvas.height = VIEWPORT_HEIGHT * TILE_SIZE;

    // Update the context font size (crucial for drawing)
    ctx.font = `${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center'; // Re-apply text alignment
    ctx.textBaseline = 'middle'; // Re-apply text baseline

    // Re-render the game at the new size
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
        // Find the key (e.g., '+') which is the tile character
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
        // Disable buy button if player can't afford it
        if (gameState.player.coins < finalBuyPrice) { // <-- Use new variable
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
            const basePrice = shopItem ? shopItem.price : 2; // Default sell price if not in shop
            
            // --- NEW: Calculate final sell price for display ---
            const sellBonusPercent = gameState.player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.5);
            const sellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus));
            // --- END NEW LOGIC ---

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
    closeInventoryButton.addEventListener('click', closeInventoryModal);
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
            <span class="font-bold ${costColorClass}">${costString}</span>
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
                   
                    break; // Exit the switch
                }
                
                // Formula: defense = base + (Constitution * 0.5 * level)
                const defenseBonus = Math.floor(skillData.baseDefense + (player.constitution * 0.5 * skillLevel));
                const duration = skillData.duration;

                player.defenseBonus = defenseBonus;
                player.defenseBonusTurns = duration;

                logMessage(`You brace for impact, gaining +${defenseBonus} Defense!`);
                
                playerRef.update({ 
                    defenseBonus: player.defenseBonus,
                    defenseBonusTurns: player.defenseBonusTurns
                });
                skillUsedSuccessfully = true;
                break;
            
            // Add other self-cast skills here in the future
        }

        // --- 5. Finalize Self-Cast Turn ---
        if (skillUsedSuccessfully) {
            playerRef.update({ [costType]: player[costType] }); // Save the new stamina
            triggerStatFlash(statDisplays.stamina, false); // Flash stamina for cost
            skillModal.classList.add('hidden');
            endPlayerTurn();
            renderEquipment(); // Update UI to show buff
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
    // This is the player's total damage *before* the skill modifier
    const weaponDamage = player.equipment.weapon ? player.equipment.weapon.damage : 0;
    const playerStrength = player.strength + (player.strengthBonus || 0);
    const playerBaseDamage = playerStrength + weaponDamage;

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
            logMessage(`You lunge and attack the ${enemyData.name}!`);
            hit = true;
            
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
                        grantXp(enemy.xp);
                        updateQuestProgress(enemy.tile);
                        const droppedLoot = generateEnemyLoot(player, enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
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
    endPlayerTurn(); // Always end turn, even if you miss
    render(); // Re-render to show enemy health change
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
    player[spellData.costType] -= spellData.cost;
    let hitSomething = false;

    // --- 2. Execute Spell Logic ---
        switch (spellId) {

        case 'magicBolt':
        case 'siphonLife':
        case 'psychicBlast':
        case 'frostBolt':
        case 'poisonBolt':
            
            const damageStat = (spellId === 'siphonLife' || spellId === 'psychicBlast' || spellId === 'poisonBolt') ? player.willpower : player.wits;
            
            const spellDamage = spellData.baseDamage + (damageStat * spellLevel);
            
            let logMsg = "You cast your spell!";
            if (spellId === 'magicBolt') logMsg = "You hurl a bolt of energy!";
            if (spellId === 'siphonLife') logMsg = "You cast Siphon Life!";
            if (spellId === 'psychicBlast') logMsg = "You unleash a blast of mental energy!";
            if (spellId === 'frostBolt') logMsg = "You launch a shard of ice!";
            if (spellId === 'poisonBolt') logMsg = "You hurl a bolt of acid!";
            logMessage(logMsg);

            for (let i = 2; i <= 3; i++) {
                const targetX = player.x + (dirX * i);
                const targetY = player.y + (dirY * i);
                // We await here so Siphon Life's heal applies correctly
                if (await applySpellDamage(targetX, targetY, spellDamage, spellId)) {
                    hitSomething = true;
                    break; // Stop, we hit a target
                }
            }
            break;

            case 'thornSkin':
                const reflectAmount = spellData.baseReflect + (player.intuition * spellLevel);
                player.thornsValue = reflectAmount;
                player.thornsTurns = spellData.duration;
                logMessage(`Your skin hardens with sharp thorns! (Reflect ${reflectAmount} dmg)`);
                updates.thornsValue = reflectAmount;
                updates.thornsTurns = spellData.duration;
                spellCastSuccessfully = true;
                break;

        case 'fireball':
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
                    // Don't await in the AoE loop, just fire them all off
                    // This feels more like a simultaneous explosion
                    applySpellDamage(x, y, fbDamage, spellId).then(hit => {
                        if (hit) hitSomething = true;
                    });
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
        inventory: gameState.player.inventory.map(item => ({ 
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
        }))
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
    for (const materialName in recipe) {
        const requiredQuantity = recipe[materialName];
        
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
    craftingRecipeList.innerHTML = ''; // Clear the old list
    const playerInventory = gameState.player.inventory;

    for (const recipeName in CRAFTING_RECIPES) {
        const recipe = CRAFTING_RECIPES[recipeName];
        const canCraft = checkHasMaterials(recipeName);

        // Find the tile for the item we're crafting
        const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
        const outputItemTile = outputItemKey || '?';

        // Build the list of materials
        let materialsHtml = '<ul class="crafting-item-materials">';
        for (const materialName in recipe) {
            const requiredQuantity = recipe[materialName];
            const itemInInventory = playerInventory.find(item => item.name === materialName);
            const currentQuantity = itemInInventory ? itemInInventory.quantity : 0;
            
            // Add a red text class if the player is missing this material
            const quantityClass = currentQuantity < requiredQuantity ? 'text-red-500' : '';
            
            materialsHtml += `<li class="${quantityClass}">${materialName} (${currentQuantity}/${requiredQuantity})</li>`;
        }
        materialsHtml += '</ul>';

        // Build the full list item
        const li = document.createElement('li');
        li.className = 'crafting-item';
        li.innerHTML = `
            <div>
                <span class="crafting-item-name">${recipeName} (${outputItemTile})</span>
                ${materialsHtml}
            </div>
            <div class="crafting-item-actions">
                <button data-craft-item="${recipeName}" ${canCraft ? '' : 'disabled'}>Craft</button>
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
    // Final check to make sure we can craft it
    if (!checkHasMaterials(recipeName)) {
        logMessage("You're missing the materials for that.");
        return;
    }

    const recipe = CRAFTING_RECIPES[recipeName];
    const playerInventory = gameState.player.inventory;

    // 1. Consume Materials
    for (const materialName in recipe) {
        const requiredQuantity = recipe[materialName];
        const itemInInventory = playerInventory.find(item => item.name === materialName);

        itemInInventory.quantity -= requiredQuantity;

        // If the stack is empty, remove it
        if (itemInInventory.quantity <= 0) {
            const itemIndex = playerInventory.indexOf(itemInInventory);
            playerInventory.splice(itemIndex, 1);
        }
    }

    // 2. Add Crafted Item
    const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
    const itemTemplate = ITEM_DATA[outputItemKey];

    const existingStack = playerInventory.find(item => item.name === recipeName);

    if (existingStack) {
        // Player already has a stack of this, add to it
        existingStack.quantity++;
    } else {
        // Create a new item stack
        const newItem = {
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: 1,
            tile: outputItemKey || '?',
            // Add weapon/armor stats if they exist
            damage: itemTemplate.damage || null,
            defense: itemTemplate.defense || null,
            slot: itemTemplate.slot || null,
            statBonuses: itemTemplate.statBonuses || null
        };
        playerInventory.push(newItem);
    }
    
    logMessage(`You successfully crafted a ${recipeName}!`);

    // 3. Update Database and UI
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
    
    playerRef.update({ inventory: inventoryToSave });

    renderCraftingModal(); // Re-render the modal to show new quantities
    renderInventory(); // Re-render the main UI inventory
}

function openCraftingModal() {
    renderCraftingModal(); // Populate the list based on current inventory
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
            <span class="font-bold ${costColorClass}">${costString}</span>
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
    
    const spellLevel = player.spellbook[spellId] || 0;

    if (spellLevel === 0) {
        logMessage("You don't know that spell.");
        return;
    }

    // --- 1. Check Resource Cost ---
    const cost = spellData.cost;
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
            case 'lesserHeal':
                const healAmount = spellData.baseHeal + (player.wits * spellLevel);
                const oldHealth = player.health;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                const healedFor = player.health - oldHealth;

                if (healedFor > 0) {
                    logMessage(`You cast Lesser Heal and recover ${healedFor} health.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
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
                
                const shieldAmount = spellData.baseShield + (player.wits * spellLevel);
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
            endPlayerTurn();
            renderStats();
        } else {
            // Refund the cost if the spell failed (e.g., shield already active)
            player[costType] += cost;
        }
    }
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
                if (currentData === null) return; // Enemy already dead or gone
                
                // Calculate actual damage vs. defense (magic ignores defense for now)
                damageDealt = Math.max(1, damage); // TODO: Add magic resistance?
                currentData.health -= damageDealt;
                
                if (currentData.health <= 0) return null;
                return currentData;
            });

            const finalEnemyState = transactionResult.snapshot.val();
            if (finalEnemyState === null) {
                logMessage(`The ${enemyData.name} was vanquished!`);
                grantXp(enemyData.xp);
                updateQuestProgress(tile);
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
                grantXp(enemy.xp);
                updateQuestProgress(enemy.tile);
                const droppedLoot = generateEnemyLoot(player, enemy);
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
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
                enemy = {
                    health: enemyData.maxHealth,
                    maxHealth: enemyData.maxHealth,
                    attack: enemyData.attack,
                    defense: enemyData.defense,
                    xp: enemyData.xp,
                    loot: enemyData.loot,
                    tile: newTile // Store the original tile
                };
            } else {
                enemy = currentData;
            }

            // --- Player Attacks Enemy ---
            // We now use the damage value passed into the function!
            enemy.health -= playerDamage; 

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
            // --- ENEMY WAS DEFEATED ---
            enemyWasKilled = true;
            logMessage(`You defeated the ${enemyData.name}!`);
            grantXp(enemyData.xp);
            updateQuestProgress(newTile);

            const droppedLoot = generateEnemyLoot(gameState.player, enemyData);
            chunkManager.setWorldTile(newX, newY, droppedLoot);

        } else {
            // --- ENEMY SURVIVES AND ATTACKS ---
            enemyAttackedBack = true;
            const enemy = finalEnemyState;
            const armorDefense = player.equipment.armor ? player.equipment.armor.defense : 0;
            // --- FIX: Add Dex defense ---
            const baseDefense = Math.floor(player.dexterity / 5);
            const buffDefense = player.defenseBonus || 0;
            const playerDefense = baseDefense + armorDefense + buffDefense; // <-- Corrected total defense
            // --- END FIX ---
            enemyDamageTaken = Math.max(1, enemy.attack - playerDefense);

            // --- NEW LUCK DODGE CHECK ---
            const luckDodgeChance = Math.min(player.luck * 0.002, 0.25); // 0.2% per luck, max 25%
            if (Math.random() < luckDodgeChance) {
                logMessage(`The ${enemyData.name} attacks, but you luckily dodge!`);
                enemyDamageTaken = 0; // Negate the damage
            } else {
                // --- NEW SHIELD DAMAGE LOGIC ---
                let damageToApply = enemyDamageTaken;
                if (player.shieldValue > 0) {
                    const damageAbsorbed = Math.min(player.shieldValue, damageToApply);
                    player.shieldValue -= damageAbsorbed;
                    damageToApply -= damageAbsorbed;
                    
                    logMessage(`Your shield absorbs ${damageAbsorbed} damage!`);
                    
                    if (player.shieldValue === 0) {
                        logMessage("Your Arcane Shield shatters!");
                    }
                }
                
// --- THORNS LOGIC (OVERWORLD) ---
            if (player.thornsValue > 0) {
                logMessage(`The ${enemyData.name} takes ${player.thornsValue} damage from your thorns!`);
                
                // We run a second transaction to apply the thorn damage safely
                enemyRef.transaction(thornData => {
                    if (!thornData) return null; // Enemy already gone
                    
                    thornData.health -= player.thornsValue;
                    
                    // If health <= 0, return null to delete the enemy
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

                // Apply any remaining damage to health
                if (damageToApply > 0) {
                    player.health -= damageToApply;
                }
                // --- END NEW SHIELD LOGIC ---
            }
            // --- END LUCK DODGE CHECK ---
            
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
        inventoryModalList.innerHTML = '<span class="muted-text italic px-2">Inventory is empty.</span>'; // <-- THIS LINE WAS FIXED
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            
            // Check for isEquipped flag
            if (item.isEquipped) {
                itemDiv.className = 'inventory-slot equipped p-2 rounded-md';
            } else {
                itemDiv.className = 'inventory-slot p-2 rounded-md';
            }

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

            itemDiv.title = title; // <-- SETS THE TOOLTIP

            const itemChar = document.createElement('span');
            itemChar.className = 'item-char';
            itemChar.textContent = item.tile;
            const itemQuantity = document.createElement('span');
            itemQuantity.className = 'item-quantity';
            itemQuantity.textContent = `x${item.quantity}`;
            const slotNumber = document.createElement('span');
            slotNumber.className = 'absolute top-0 left-1 text-xs highlight-text font-bold';
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
    const style = getComputedStyle(document.documentElement);
    const canvasBg = style.getPropertyValue('--canvas-bg');
    const playerColor = style.getPropertyValue('--player-color');
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const viewportCenterX = Math.floor(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.floor(VIEWPORT_HEIGHT / 2);
    const startX = gameState.player.x - viewportCenterX;
    const startY = gameState.player.y - viewportCenterY;

    const isWideChar = (char) => /\p{Extended_Pictographic}/u.test(char);

    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH; x++) {
            const mapX = startX + x;
            const mapY = startY + y;
            let tile;
            let bgColor;
            let fgChar = null;
            let fgColor = '#FFFFFF';

            if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;

                if (tile === theme.wall) bgColor = theme.colors.wall;
                else if (tile === theme.floor) bgColor = theme.colors.floor;
                else { // It's a decoration or item
                    bgColor = theme.colors.floor;
                    fgChar = tile;
                }
            } else if (gameState.mapMode === 'castle') {
                const map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';

                if (tile === '▓' || tile === '▒') { // Group wall and rubble tiles
                    bgColor = '#422006'; // Render both as dark walls
                } else {
                    bgColor = '#a16207'; // Everything else is a floor
                    fgChar = tile;
                }
            } else { // Overworld
                tile = chunkManager.getTile(mapX, mapY);
                switch (tile) {
                    case '~':
                        bgColor = '#1e3a8a';
                        break;
                    case '≈':
                        bgColor = '#596643';
                        fgChar = ',';
                        fgColor = '#4b5535';
                        break;
                    case '^':
                        bgColor = '#78350f';
                        fgChar = '^';
                        fgColor = '#52230a';
                        break;
                    case 'F':
                        bgColor = '#15803d';
                        fgColor = '#14532d';
                        // Add stable random "noise"
                        const forestSeed = stringToSeed(`${mapX},${mapY}`);
                        const forestRandom = Alea(forestSeed);
                        const forestTiles = ['"', 'F', '"', 'F', 'F']; // Weighted
                        fgChar = forestTiles[Math.floor(forestRandom() * forestTiles.length)];
                        break;
                    case '.':
                        bgColor = '#22c55e';
                        fgColor = '#16a34a';
                        // Add stable random "noise"
                        const plainsSeed = stringToSeed(`${mapX},${mapY}`);
                        const plainsRandom = Alea(plainsSeed);
                        const plainsTiles = ['.', ',', "'", '.', '.']; // Weighted
                        fgChar = plainsTiles[Math.floor(plainsRandom() * plainsTiles.length)];
                        break;
                    case 'd':
                        bgColor = '#2d2d2d'; // Dark Grey
                        fgChar = '.';
                        fgColor = '#57534e'; // Warm Grey dots
                        break;
                    case 'T': // Dead Tree
                        bgColor = '#2d2d2d';
                        fgChar = 'T';
                        fgColor = '#a8a29e'; // Light Grey tree
                        break;
                    case 'D':
                        bgColor = '#fde047'; // Bright Yellow
                        fgColor = '#eab308'; // Darker Yellow dots
                        fgChar = '.';
                        break;
                    case '🌵':
                        bgColor = '#fde047'; // Match sand
                        fgChar = '🌵';
                        break;
                    case '⛲':
                        bgColor = '#22c55e'; // Grass bg usually
                        if (gameState.mapMode === 'overworld') bgColor = '#22c55e'; // Simplification
                        fgChar = '⛲';
                        break;
                    case 'Ω':
                        bgColor = '#000000'; // Void black
                        fgColor = '#a855f7'; // Purple
                        fgChar = 'Ω';
                        break;
                    case '📦': // Buried Chest
                         bgColor = (gameState.mapMode === 'overworld') ? '#22c55e' : '#422006';
                         // Override bg if in deadlands (hard to check here easily, simpler to just default)
                         if (gameState.mapMode === 'overworld') bgColor = '#2d2d2d'; // Assume deadlands/ground
                         fgChar = '📦';
                         break;
                    case '▓':
                        bgColor = '#422006';
                        break;
                    case '▒':
                        bgColor = '#a16207';
                        break;
                    default:
                        bgColor = (gameState.mapMode === 'castle') ? '#a16207' : '#22c55e';
                        fgChar = tile;
                        break;
                }
            }

            ctx.fillStyle = bgColor;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            // --- NEW: Draw Overworld Enemy Health Bars ---
            if (gameState.mapMode === 'overworld' && ENEMY_DATA[fgChar]) {
                const enemyId = `overworld:${mapX},${-mapY}`;
                const enemyHealthData = gameState.sharedEnemies[enemyId];

                // Check if this enemy has shared health data
                if (enemyHealthData) {
                    const healthPercent = enemyHealthData.health / enemyHealthData.maxHealth;
                    const healthBarWidth = TILE_SIZE;
                    const barX = x * TILE_SIZE;
                    // Draw the bar at the bottom of the tile
                    const barY = (y * TILE_SIZE) + TILE_SIZE - 4;

                    // 1. Draw the "empty" part of the bar
                    ctx.fillStyle = '#333'; // Dark background
                    ctx.fillRect(barX, barY, healthBarWidth, 3);

                    // 2. Pick the color for the "full" part
                    if (healthPercent > 0.6) ctx.fillStyle = '#4caf50'; // Green
                    else if (healthPercent > 0.3) ctx.fillStyle = '#eab308'; // Yellow
                    else ctx.fillStyle = '#ef4444'; // Red

                    // 3. Draw the "full" part on top
                    ctx.fillRect(barX, barY, healthBarWidth * healthPercent, 3);
                }
            }

            if (fgChar) {
                // --- NEW: Check if the tile is an enemy ---
                if (ENEMY_DATA[fgChar]) {
                    fgColor = '#ef4444'; // Force a bright red color
                }
                // --- END NEW ---
                else {
                    // Original color logic for items/landmarks
                    switch (fgChar) {
                        case '⛰':
                            fgColor = '#6b7280';
                            break;
                        case '>':
                            fgColor = '#eab308';
                            break;
                        case '🏰':
                            fgColor = '#f59e0b';
                            break;
                        case 'X':
                            fgColor = '#eab308';
                            break;
                        case '☗':
                            fgColor = '#854d0e';
                            break;
                        case '+':
                            fgColor = '#FF4500';
                            break;
                        case 'o':
                            fgColor = '#6a0dad';
                            break;
                        case 'S':
                            fgColor = '#ADFF2F';
                            break;
                        case 'Y':
                            fgColor = '#4B0082';
                            break;
                        case '$':
                            fgColor = '#ffd700';
                            break;
                        case 'B':
                            fgColor = '#fde047';
                            break;
                    }
                }

                ctx.fillStyle = fgColor;
                if (isWideChar(fgChar)) {
                    ctx.font = `${TILE_SIZE + 2}px monospace`;
                    ctx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + 1);
                } else {
                    ctx.font = `${TILE_SIZE}px monospace`;
                    ctx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }
    }

    ctx.font = `${TILE_SIZE}px monospace`;

    // (The rest of the render function for other players and the main player is unchanged)
    for (const id in otherPlayers) {
        if (otherPlayers[id].mapMode !== gameState.mapMode || otherPlayers[id].mapId !== (gameState.currentCaveId || gameState.currentCastleId)) continue;
        const otherPlayer = otherPlayers[id];
        const screenX = (otherPlayer.x - startX) * TILE_SIZE;
        const screenY = (otherPlayer.y - startY) * TILE_SIZE;

        if (screenX > -TILE_SIZE && screenX < canvas.width && screenY > -TILE_SIZE && screenY < canvas.height) {

            if (otherPlayer.email) {
                const name = otherPlayer.email.split('@')[0]; // Show name, not full email
                ctx.fillStyle = '#FFFFFF'; // White text for the name
                ctx.textAlign = 'center';
                // Draw name slightly above the character
                ctx.fillText(name, screenX + TILE_SIZE / 2, screenY - 12);
            }

            const healthPercent = (otherPlayer.health || 0) / (otherPlayer.maxHealth || 10);
            const healthBarWidth = TILE_SIZE;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY - 7, healthBarWidth, 5);
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(screenX, screenY - 7, healthBarWidth * healthPercent, 5);
            ctx.fillStyle = '#f97316'; // A neutral orange
            ctx.fillText('@', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
    }

    // Make the player character bold and outlined to stand out
    ctx.font = `bold ${TILE_SIZE}px monospace`;

// Check if player is boating and change their character
    const playerChar = gameState.player.isBoating ? 'c' : gameState.player.character;

    // Make the player character bold and outlined to stand out
    ctx.font = `bold ${TILE_SIZE}px monospace`;

    // 1. Draw the outline
    ctx.strokeStyle = '#000000'; // A solid black outline
    ctx.lineWidth = 2; // How thick the outline is
    ctx.strokeText(playerChar, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);

    // 2. Fill the character with the player color
    ctx.fillStyle = playerColor;
    ctx.fillText(playerChar, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);

    // 3. Reset the font to normal for any other text
    ctx.font = `${TILE_SIZE}px monospace`;

    const {
        hour,
        minute
    } = gameState.time;
    const overlayColor = getInterpolatedDayCycleColor(hour, minute);
    ctx.fillStyle = overlayColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    // --- NEW: Chance for an enemy to chase you ---
    const CHASE_CHANCE = 0.5; // 50% chance to chase

    // 2. Loop through the search box
    for (let y = playerY - searchRadius; y <= playerY + searchRadius; y++) {
        for (let x = playerX - searchRadius; x <= playerX + searchRadius; x++) {
            // Don't move the tile the player is on
            if (x === playerX && y === playerY) continue;

            const tile = chunkManager.getTile(x, y);

            // 3. Is this tile an enemy?
            if (ENEMY_DATA[tile]) {

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
                    if (tile === 'w') { // Wolves
                        // Wolves can move on plains OR in forests
                        canMove = (targetTile === '.' || targetTile === 'F');
                    } else if (tile === 'b') { // Bandits
                        // Bandits stick to the plains
                        canMove = (targetTile === '.');
                    }

                    if (canMove) { 

                        // Add this move to our batch
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
                        if (distX <= 10 && distY <= 10) { // Smaller radius for "hearing"
                            
                        }
                    }
                }
            }
        }
    }

    // --- Process all moves ---
    // We use a 'for...of' loop to allow 'await'
    for (const move of movesToMake) {
        // 1. Move the enemy on the world map (for everyone)
        chunkManager.setWorldTile(move.oldX, move.oldY, '.'); // Clear old tile
        chunkManager.setWorldTile(move.newX, move.newY, move.tile); // Set new tile

        // 2. Define the database paths for its health data
        const oldId = `overworld:${move.oldX},${-move.oldY}`;
        const newId = `overworld:${move.newX},${-move.newY}`;
        const oldRef = rtdb.ref(`worldEnemies/${oldId}`);
        const newRef = rtdb.ref(`worldEnemies/${newId}`);

        // 3. Check if this enemy had any health data
        const snapshot = await oldRef.once('value');
        const healthData = snapshot.val();

        if (healthData) {
            // 4. It did! Move the data by setting it in the new spot...
            await newRef.set(healthData);
            // ...and removing it from the old one.
            await oldRef.remove();
        }
    }

    return nearestEnemyDir;
}

function processEnemyTurns() {
    // This function only runs for dungeon/castle enemies
    if (gameState.mapMode !== 'dungeon' && gameState.mapMode !== 'castle') {
        return false;
    }

    // Get the correct map and theme
    let map;
    let theme;
    if (gameState.mapMode === 'dungeon') {
        map = chunkManager.caveMaps[gameState.currentCaveId];
        theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
    } else {
        map = chunkManager.castleMaps[gameState.currentCastleId];
        theme = { floor: '.' }; // Castles use '.' as floor
    }

    if (!map) return null;

    // Track nearest enemy direction
    let nearestEnemyDir = null;
    let minDist = Infinity;
    const HEARING_DISTANCE_SQ = 15 * 15;
    const player = gameState.player;

    const CHASE_CHANCE = 0.5;

    // Loop through a copy of the array so we can modify it
    const enemiesToMove = [...gameState.instancedEnemies];

    enemiesToMove.forEach(enemy => {

        if (enemy.rootTurns > 0) {
            enemy.rootTurns--;
            logMessage(`The ${enemy.name} struggles against the entangling roots!`);
            if (enemy.rootTurns === 0) logMessage(`The ${enemy.name} breaks free.`);
            return; // Skip turn completely
        }

        // --- HANDLE "MADNESS" (FLEEING) ---
        if (enemy.madnessTurns > 0) {
            enemy.madnessTurns--;
            
            // Calculate the direction *away* from the player
            const fleeDirX = -Math.sign(player.x - enemy.x);
            const fleeDirY = -Math.sign(player.y - enemy.y);

            const newX = enemy.x + fleeDirX;
            const newY = enemy.y + fleeDirY;
            const targetTile = (map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';

            if (targetTile === theme.floor) {
                // This is a valid floor tile to flee to
                map[enemy.y][enemy.x] = theme.floor; // Clear old spot
                map[newY][newX] = enemy.tile;      // Move to new spot
                enemy.x = newX;
                enemy.y = newY;
                logMessage(`The ${enemy.name} flees in terror!`);
            } else {
                // Can't flee, it's cornered
                logMessage(`The ${enemy.name} cowers in the corner!`);
            }

            if (enemy.madnessTurns === 0) {
                logMessage(`The ${enemy.name} seems to regain its senses.`);
            }

            return; // --- This enemy's turn is over. It will not attack or chase. ---
        }

        if (enemy.frostbiteTurns > 0) {
            enemy.frostbiteTurns--;
            logMessage(`The ${enemy.name} shivers from the frost...`);

            if (enemy.frostbiteTurns === 0) {
                logMessage(`The ${enemy.name} is no longer frostbitten.`);
            }

            // 25% chance to be "frozen" and skip its turn
            if (Math.random() < 0.25) {
                logMessage(`The ${enemy.name} is frozen solid and skips its turn!`);
                return; // --- This enemy's turn is over. ---
            }
        }

        if (enemy.poisonTurns > 0) {
            enemy.poisonTurns--;
            const poisonDamage = 1; // Poison does 1 damage per turn
            enemy.health -= poisonDamage;
            logMessage(`The ${enemy.name} takes ${poisonDamage} poison damage...`);

            if (enemy.health <= 0) {
                // Enemy died from poison
                logMessage(`The ${enemy.name} succumbs to the poison!`);
                grantXp(enemy.xp);
                updateQuestProgress(enemy.tile);
                const droppedLoot = generateEnemyLoot(gameState.player, enemy);
                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                if (gameState.mapMode === 'dungeon') {
                    chunkManager.caveMaps[gameState.currentCaveId][enemy.y][enemy.x] = droppedLoot;
                }
                return; // Enemy is dead, end its turn
            }

            if (enemy.poisonTurns === 0) {
                logMessage(`The ${enemy.name} is no longer poisoned.`);
            }
        }

        // --- GET DISTANCE TO PLAYER ---
        const distSq = Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2);

        // --- 1. NEW: MELEE ATTACK LOGIC (for ALL enemies) ---
        if (distSq <= 2) {
            // (Your existing melee logic is perfect)
            // ...
            const armorDefense = player.equipment.armor ? player.equipment.armor.defense : 0;
            const baseDefense = Math.floor(player.dexterity / 5);
            const buffDefense = player.defenseBonus || 0;
            const playerDefense = baseDefense + armorDefense + buffDefense;
            const enemyDamage = Math.max(1, enemy.attack - playerDefense);

            // Check for Luck Dodge
            const luckDodgeChance = Math.min(player.luck * 0.002, 0.25);
            if (Math.random() < luckDodgeChance) {
                logMessage(`The ${enemy.name} attacks, but you luckily dodge!`);
                return; // End this enemy's turn
            }

            // Check for Shield Absorb
            let damageToApply = enemyDamage;
            if (player.shieldValue > 0) {
                const damageAbsorbed = Math.min(player.shieldValue, damageToApply);
                player.shieldValue -= damageAbsorbed;
                damageToApply -= damageAbsorbed;
                logMessage(`Your shield absorbs ${damageAbsorbed} damage!`);
                if (player.shieldValue === 0) {
                    logMessage("Your Arcane Shield shatters!");
                }
            }

            // Apply remaining damage
            if (damageToApply > 0) {
                player.health -= damageToApply;
                triggerStatFlash(statDisplays.health, false);
                logMessage(`The ${enemy.name} hits you for ${damageToApply} damage!`);
            }

            // Check for player death
            if (player.health <= 0) {
                player.health = 0;
                logMessage("You have perished!");
                syncPlayerState();
                document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
                document.getElementById('finalCoinsDisplay').textContent = `Gold: ${player.coins}`;
                gameOverModal.classList.remove('hidden');
            }
            return; // End this enemy's turn
        }

        // --- 2. NEW: CASTER ATTACK LOGIC (for Caster enemies) ---
        const castRangeSq = Math.pow(enemy.castRange || 6, 2);
        
        if (enemy.caster && distSq <= castRangeSq && Math.random() < 0.33) {
            // (Your existing caster logic is perfect)
            // ...
            const spellDamage = enemy.spellDamage || 1; 
            const enemyDamage = Math.max(1, spellDamage);

            let spellName = "spell";
            if (enemy.tile === 'm') spellName = "Arcane Bolt";
            if (enemy.tile === 'Z') spellName = "Frost Shard";
            if (enemy.tile === '@') spellName = "Poison Spit";

            const luckDodgeChance = Math.min(player.luck * 0.002, 0.25);
            if (Math.random() < luckDodgeChance) {
                logMessage(`The ${enemy.name} hurls a ${spellName}, but you dodge!`);
                return; // End this enemy's turn
            }
            
            let damageToApply = enemyDamage;
            if (player.shieldValue > 0) {
                const damageAbsorbed = Math.min(player.shieldValue, damageToApply);
                player.shieldValue -= damageAbsorbed;
                damageToApply -= damageAbsorbed;
                logMessage(`Your shield absorbs ${damageAbsorbed} magic damage!`);
                if (player.shieldValue === 0) {
                    logMessage("Your Arcane Shield shatters!");
                }
            }

            // Apply remaining damage
            if (damageToApply > 0) {
                player.health -= damageToApply;
                triggerStatFlash(statDisplays.health, false);
                logMessage(`The ${enemy.name}'s ${spellName} hits you for ${damageToApply} damage!`);

            if (enemy.inflicts === 'frostbite' && player.frostbiteTurns <= 0) {
                    logMessage("You are afflicted with Frostbite!");
                    player.frostbiteTurns = 5; // Lasts 5 turns
                } else if (enemy.inflicts === 'poison' && player.poisonTurns <= 0) {
                    logMessage("The creature's spit poisons you!");
                    player.poisonTurns = 5; // Lasts 5 turns
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
            return; // End this enemy's turn
        } // <-- ***THIS IS THE MISSING CLOSING BRACE }***

        // --- 3. MOVEMENT LOGIC (if no attack/cast) ---
        // This is now correctly *outside* the caster block.
        if (Math.random() < 0.50) {
            let dirX, dirY;

            // (Your existing movement logic is perfect)
            // ...
            if (Math.random() < CHASE_CHANCE) {
                dirX = Math.sign(player.x - enemy.x);
                dirY = Math.sign(player.y - enemy.y);
            } else {
                dirX = Math.floor(Math.random() * 3) - 1;
                dirY = Math.floor(Math.random() * 3) - 1;
            }

            if (dirX === 0 && dirY === 0) {
                return; // No movement
            }

            const newX = enemy.x + dirX;
            const newY = enemy.y + dirY;

            const targetTile = (map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';

            if (targetTile === theme.floor) {
                map[enemy.y][enemy.x] = theme.floor; 
                map[newY][newX] = enemy.tile;      
                enemy.x = newX;
                enemy.y = newY;

                const newDistSq = Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2);
                if (newDistSq < minDist && newDistSq < HEARING_DISTANCE_SQ) {
                    minDist = newDistSq;
                    nearestEnemyDir = { x: Math.sign(enemy.x - player.x), y: Math.sign(enemy.y - player.y) };
                }
            }
        }
    });

    return nearestEnemyDir; // Return for the intuition check
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
        } else {
            // Fail. Give vague message.
            logMessage("You hear a shuffle nearby...");
        }
    }
}

function endPlayerTurn() {
    gameState.playerTurnCount++; // Increment the player's turn
    const player = gameState.player;
    let updates = {};

    // --- 1. Tick Status Effects ---
    if (player.poisonTurns > 0) {
        player.poisonTurns--;
        player.health -= 1; // Poison deals 1 damage
        logMessage("You take 1 poison damage...");
        triggerStatFlash(statDisplays.health, false);
        updates.health = player.health;
        updates.poisonTurns = player.poisonTurns;
        if (player.poisonTurns === 0) {
            logMessage("The poison has worn off.");
        }
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
            // No need to update playerRef here, the final updates.length check will catch it
        }
        renderEquipment(); // Update UI
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

    // Tick down buff/debuff durations (This is your existing code)
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

    if (gameState.playerTurnCount % 2 === 0) {
        // Call our new async wrapper function.
        // We don't 'await' it; just let it run in the background.
        runSharedAiTurns();
    }

    // Save any status effect changes if buffs didn't already
    if (Object.keys(updates).length > 0) {
        playerRef.update(updates);
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

document.addEventListener('keydown', (event) => {
    if (!player_id || gameState.player.health <= 0 || document.activeElement === chatInput) return;

    if (event.key === 'Escape') {
        // Check if a modal is open and close it
        if (!helpModal.classList.contains('hidden')) {
            helpModal.classList.add('hidden');
            event.preventDefault();
            return;
        }
        if (!loreModal.classList.contains('hidden')) {
            loreModal.classList.add('hidden');
            event.preventDefault();
            return;
        }

        if (!inventoryModal.classList.contains('hidden')) {
            closeInventoryModal();
            event.preventDefault();
            return;
        }

        if (!skillModal.classList.contains('hidden')) {
            skillModal.classList.add('hidden');
            event.preventDefault();
            return;
        }

        // --- ADDED ---
        if (!craftingModal.classList.contains('hidden')) {
            craftingModal.classList.add('hidden');
            event.preventDefault();
            return;
        }
        // --- END ADDED ---


        // Handle exiting game states ---
        if (gameState.isDroppingItem) {
            logMessage("Drop canceled.");
            gameState.isDroppingItem = false;
            event.preventDefault();
            return;
        }

        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            logMessage("Aiming canceled.");
            event.preventDefault();
            return;
        }

        if (gameState.inventoryMode) {
            logMessage("Exited inventory mode.");
            gameState.inventoryMode = false;
            event.preventDefault();
            return;
        }
        // --- END NEW ---
    }

    // Handle Drop Mode
    if (gameState.isDroppingItem) {
        handleItemDrop(event);
        return; // Stop further processing
    }

    if (gameState.isAiming) {
    event.preventDefault();
    let dirX = 0,
        dirY = 0;

    if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') dirY = -1;
    else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') dirY = 1;
    else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') dirX = -1;
    else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') dirX = 1;

if (dirX !== 0 || dirY !== 0) {
        const abilityId = gameState.abilityToAim; // e.g., "lunge", "magicBolt", "fireball"

        if (abilityId === 'lunge') {
            executeLunge(dirX, dirY);
        } else if (SPELL_DATA[abilityId]) { // Check if it's a key in our spell database
            // It's a spell! Call our new generic execute function
            executeAimedSpell(abilityId, dirX, dirY); 
        } else if (abilityId === 'pacify') {
            executePacify(dirX, dirY);

        } else if (abilityId === 'inflictMadness') {
            executeInflictMadness(dirX, dirY);

        } else {
            // Fallback in case something went wrong
            logMessage("Unknown ability. Aiming canceled.");
        }

        gameState.isAiming = false;
        gameState.abilityToAim = null;

    // This 'Escape' check is now handled by the main 'Escape' block above
    // } else if (event.key === 'Escape') { ... }

    } else {
        logMessage("Invalid direction. Use arrow keys or WASD. (Esc) to cancel.");
    }
    return; // Stop all other key processing
}

    // --- Handle Inventory Mode ---
    if (gameState.inventoryMode) {
        event.preventDefault(); // Prevent movement keys while in this mode

        // --- Start: Correct 1-9 Logic (for Use/Equip) ---
        const keyNum = parseInt(event.key);

        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
            const itemIndex = keyNum - 1;
            const itemToUse = gameState.player.inventory[itemIndex];
            let itemUsed = false;

            if (!itemToUse) {
                logMessage(`No item in slot ${keyNum}.`);
                closeInventoryModal();
                return;
            }

            // --- BRANCHING LOGIC FOR ITEM TYPE ---
            if (itemToUse.type === 'consumable') {
                // 1. Apply the item's effect
                if (itemToUse.effect) {
                    itemToUse.effect(gameState); // (e.g., restore health)
                }

                // 2. Remove one from the stack
                itemToUse.quantity--;
                logMessage(`You used a ${itemToUse.name}.`);

                // 3. If the stack is empty, remove it from inventory
                if (itemToUse.quantity <= 0) {
                    gameState.player.inventory.splice(itemIndex, 1);
                }
                itemUsed = true;

            // 1. Find currently equipped weapon (if any) and unequip it
                const currentWeapon = gameState.player.inventory.find(i => i.type === 'weapon' && i.isEquipped);
                if (currentWeapon) {
                    applyStatBonuses(currentWeapon, -1); // Remove stats
                    currentWeapon.isEquipped = false;
                }

                // 2. If we selected the SAME weapon, we are just unequipping it.
                if (currentWeapon === itemToUse) {
                    gameState.player.equipment.weapon = { name: 'Fists', damage: 0 };
                    logMessage(`You unequip the ${itemToUse.name}.`);
                } else {
                    // 3. Equip the new weapon
                    itemToUse.isEquipped = true;
                    gameState.player.equipment.weapon = itemToUse;
                    applyStatBonuses(itemToUse, 1); // Add stats
                    logMessage(`You equip the ${itemToUse.name}.`);
                }
                
                itemUsed = true; // Triggers save/render
            }

            } else if (itemToUse.type === 'armor') {
                // --- NEW EQUIP LOGIC (No Splice) ---
                
                // 1. Find currently equipped armor
                const currentArmor = gameState.player.inventory.find(i => i.type === 'armor' && i.isEquipped);
                if (currentArmor) {
                    applyStatBonuses(currentArmor, -1);
                    currentArmor.isEquipped = false;
                }

                // 2. Toggle check
                if (currentArmor === itemToUse) {
                    gameState.player.equipment.armor = { name: 'Simple Tunic', defense: 0 };
                    logMessage(`You unequip the ${itemToUse.name}.`);
                } else {
                    // 3. Equip new
                    itemToUse.isEquipped = true;
                    gameState.player.equipment.armor = itemToUse;
                    applyStatBonuses(itemToUse, 1);
                    logMessage(`You equip the ${itemToUse.name}.`);
                }

                itemUsed = true;

            } else if (itemToUse.type === 'spellbook') {
                const spellId = itemToUse.spellId;
                const spellData = SPELL_DATA[spellId];
                const player = gameState.player;

                if (!spellData) {
                    logMessage("This item appears to be a dud. (No spell data found)");
                    itemUsed = false; // Don't consume the item
                } else if (player.level < spellData.requiredLevel) {
                    logMessage(`You ponder the text, but must be Level ${spellData.requiredLevel} to understand it.`);
                    itemUsed = false; // Don't consume
                } else {
                    // All checks passed. Use the item.
                    if (player.spellbook[spellId]) {
                        // Player already knows the spell: Level it up
                        player.spellbook[spellId]++;
                        logMessage(`You study the text and learn more about ${spellData.name}! It is now Level ${player.spellbook[spellId]}.`);
                    } else {
                        // Player is learning the spell for the first time
                        player.spellbook[spellId] = 1; // Set to level 1
                        logMessage(`You have learned a new spell: ${spellData.name}!`);
                    }
                    
                    // Consume the item
                    itemToUse.quantity--;
                    if (itemToUse.quantity <= 0) {
                        player.inventory.splice(itemIndex, 1);
                    }
                    itemUsed = true;
                    // Note: We'll update the 'playerRef' in the 'if (itemUsed)' block below
                }

                } else if (itemToUse.type === 'skillbook') {
            const skillId = itemToUse.skillId;
            const skillData = SKILL_DATA[skillId];
            const player = gameState.player;

            if (!skillData) {
                logMessage("This item appears to be a dud. (No skill data found)");
                itemUsed = false;
            } else if (player.level < skillData.requiredLevel) {
                logMessage(`You ponder the text, but must be Level ${skillData.requiredLevel} to understand it.`);
                itemUsed = false;
            } else {
                // All checks passed. Use the item.
                if (player.skillbook[skillId]) {
                    // Player already knows the skill: Level it up
                    player.skillbook[skillId]++;
                    logMessage(`You study the text and learn more about ${skillData.name}! It is now Level ${player.skillbook[skillId]}.`);
                } else {
                    // Player is learning the skill for the first time
                    player.skillbook[skillId] = 1; // Set to level 1
                    logMessage(`You have learned a new skill: ${skillData.name}!`);
                }

                // Consume the item
                itemToUse.quantity--;
                if (itemToUse.quantity <= 0) {
                    player.inventory.splice(itemIndex, 1);
                }
                itemUsed = true;
            }

            } else if (itemToUse.type === 'tome') {
                const stat = itemToUse.stat;
                if (stat && gameState.player.hasOwnProperty(stat)) {
                    gameState.player[stat]++;
                    logMessage(`You consume the tome. Your ${stat} has permanently increased by 1!`);
                    triggerStatAnimation(statDisplays[stat], 'stat-pulse-green');
                    
                    // Consume the item
                    itemToUse.quantity--;
                    if (itemToUse.quantity <= 0) {
                        gameState.player.inventory.splice(itemIndex, 1);
                    }
                    itemUsed = true;
                } else {
                    logMessage("This tome seems to be a dud.");
                    itemUsed = false;
                }

                
            }
            
            else if (itemToUse.type === 'buff_potion') {
                const player = gameState.player;
                if (player.strengthBonusTurns > 0) { // Check if buff is active
                    logMessage("A similar effect is already active.");
                    itemUsed = false;
                } else {
                    // Apply the buff
                    player.strengthBonus = itemData.amount;
                    player.strengthBonusTurns = itemData.duration;
                    
                    logMessage(`You drink the potion and feel a surge of strength! (+${itemData.amount} Strength for ${itemData.duration} turns)`);
                    triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');

                    // Consume the item
                    itemToUse.quantity--;
                    if (itemToUse.quantity <= 0) {
                        player.inventory.splice(itemIndex, 1);
                    }
                    itemUsed = true;
                }
            }

            else if (itemToUse.type === 'teleport') {
                logMessage("You read the scroll. Space warps around you...");
                // Teleport to start (0,0)
                gameState.player.x = 0;
                gameState.player.y = 0;
                exitToOverworld("You vanish and reappear at the village gates.");
                
                itemToUse.quantity--;
                if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
                itemUsed = true;
            }
            // --- ADD TREASURE MAP LOGIC ---
            else if (itemToUse.type === 'treasure_map') {
                // Generate a treasure location if we don't have one
                if (!gameState.activeTreasure) {
                    // Random spot 50-150 tiles away
                    const dist = 50 + Math.floor(Math.random() * 100);
                    const angle = Math.random() * 2 * Math.PI;
                    const tx = Math.floor(gameState.player.x + Math.cos(angle) * dist);
                    const ty = Math.floor(gameState.player.y + Math.sin(angle) * dist);
                    
                    gameState.activeTreasure = { x: tx, y: ty };
                    logMessage(`The map reveals a hidden mark! Location: (${tx}, ${-ty}).`);
                } else {
                     logMessage(`The map marks a location at (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y}).`);
                }
                // Maps are NOT consumed on use, they are kept until treasure is found
                itemUsed = false; 
            }

            else {
                logMessage(`You can't use '${itemToUse.name}' right now.`);
            }
            // --- END BRANCHING LOGIC ---

            if (itemUsed) {
                // 1. Define the inventory map
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

                // 2. Update Firebase
                playerRef.update({
                    inventory: inventoryToSave,
                    equipment: gameState.player.equipment,
                    spellbook: gameState.player.spellbook,

                    strength: gameState.player.strength,
                    wits: gameState.player.wits,
                    luck: gameState.player.luck,
                    constitution: gameState.player.constitution,
                    dexterity: gameState.player.dexterity,
                    charisma: gameState.player.charisma,
                    willpower: gameState.player.willpower,
                    perception: gameState.player.perception,
                    endurance: gameState.player.endurance,
                    intuition: gameState.player.intuition
                });

                syncPlayerState();
                endPlayerTurn();
                renderInventory();
                renderEquipment();
                renderStats();
            }

        // --- Start: Correct 'D' Key Logic (for Drop) ---
        if (event.key === 'd' || event.key === 'D') {
            if (gameState.player.inventory.length === 0) {
                logMessage("Your inventory is empty.");
                closeInventoryModal(); // Exit inventory mode
                return;
            }
            logMessage("Drop Mode: Press 1-9 to drop or (Esc) to cancel.");
            gameState.isDroppingItem = true;
            closeInventoryModal(); // Exit inventory mode, enter drop mode
            return;
        }
        // --- End: Correct 'D' Key Logic ---


        // If any other key is pressed in inventory mode, just log a reminder
        logMessage("Inventory Mode: Press 1-9 to use, D to drop, or (Esc) to exit.");
        return;
    }
    // --- END NEW INVENTORY MODE ---

    // --- Top-level 'I' key to ENTER inventory mode ---
    if (event.key === 'i' || event.key === 'I') {
        openInventoryModal();
        event.preventDefault();
        return;
    }

    if (event.key === 'm' || event.key === 'M') {
        openSpellbook();
        event.preventDefault();
        return;
    }

    if (event.key === 'k' || event.key === 'K') {
        openSkillbook();
        event.preventDefault();
        return;
    }

    let startX = gameState.player.x,
        startY = gameState.player.y;
    let newX = startX,
        newY = startY;
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            newY--;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            newY++;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            newX--;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            newX++;
            break;
        case 'r':
        case 'R':
            let rested = false;
            let logMsg = "You rest for a moment. ";

            // Restore 1 Stamina
            if (gameState.player.stamina < gameState.player.maxStamina) {
                gameState.player.stamina++;
                triggerStatFlash(statDisplays.stamina, true);
                logMsg += "Recovered 1 stamina.";
                rested = true;
            }

            // Restore 1 Health
            if (gameState.player.health < gameState.player.maxHealth) {
                gameState.player.health++;
                triggerStatFlash(statDisplays.health, true);
                logMsg += " Recovered 1 health.";
                rested = true;
            }

            if (!rested) {
                logMessage("You are already at full health and stamina.");
            } else {
                logMessage(logMsg);
            }

            // Update the database
            playerRef.update({
                stamina: gameState.player.stamina,
                health: gameState.player.health
            });

            endPlayerTurn();

            event.preventDefault();
            return;

        default:
            return;
    }
    event.preventDefault();
    if (newX === startX && newY === startY) return;

const obsoleteTiles = ['C', '<', '!', 'E', 'D', 'W', 'P', '&', '>', 
                           '★', '☆', '📕', '📗', '💪', '🧠', '"', 'n', 'u', 'q', '📄', 'P', '*',
                           ']', '8', '❄️', '🌀', '😱', '☣️', '‡', '🧪', '💀', 'a', 'r', 'j',
                           '⛏️', '•', '<', 'I', '⛩️', '|', '▲', '⚔️', '🛡️', ':', '🍄', 'l', '¥', '⛲', 'Ω', '🌵', '🍐', '🦂',
                           '🐺', '👺', '🍷', '🧪', '🌿', '🌵'];

    const tileAtDestination = chunkManager.getTile(newX, newY);
    if (obsoleteTiles.includes(tileAtDestination)) {
        logMessage("You clear away remnants of an older age.");
        chunkManager.setWorldTile(newX, newY, '.');
    }

    (async () => {
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

        const tileData = TILE_DATA[newTile];

        if (newTile === '¥') {
            activeShopInventory = TRADER_INVENTORY;
            logMessage("You meet a Wandering Trader. 'Rare goods, for a price...'");
            renderShop();
            shopModal.classList.remove('hidden');
            return;
        }

        // 2. Perform ALL collision checks immediately.
        // --- DUNGEON WALL CHECK ---
        if (gameState.mapMode === 'dungeon') {
            const theme = CAVE_THEMES[gameState.currentCaveTheme];
            const secretWallTile = theme ? theme.secretWall : null;

            // Check for secret wall
            if (secretWallTile && newTile === secretWallTile) {
                logMessage("The wall sounds hollow... You break through!");
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
                grantXp(15);
                render();
                return;
            }
            // This is the original wall check
            if (theme && (newTile === theme.wall || newTile === ' ')) {
                logMessage("The wall is solid.");
                return;
            }
        }
        // --- END DUNGEON WALL CHECK ---

        // --- CASTLE WALL CHECK ---
        if (gameState.mapMode === 'castle' && (newTile === '▓' || newTile === '▒' || newTile === ' ')) {
            logMessage("You bump into the castle wall.");
            return; // Stop here if it's a wall or rubble
        }
        // --- END CASTLE WALL CHECK ---

        // --- UNIFIED COMBAT CHECK ---
        const enemyData = ENEMY_DATA[newTile];
        if (enemyData) { // This tile is an enemy: 'g', 's', 'b', or 'w'

            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                // --- INSTANCED COMBAT ---
                let enemy = gameState.instancedEnemies.find(e => e.x === newX && e.y === newY);
                let enemyId = enemy ? enemy.id : null;

                if (enemy) {
                    // --- PLAYER ATTACKS ENEMY ---
                    const weaponDamage = gameState.player.equipment.weapon ? gameState.player.equipment.weapon.damage : 0;
                    const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);
                    const playerDamage = Math.max(1, (playerStrength + weaponDamage) - enemy.defense);

                    enemy.health -= playerDamage;
                    logMessage(`You attack the ${enemy.name} for ${playerDamage} damage!`);

                    const weapon = gameState.player.equipment.weapon;
                if (weapon.inflicts === 'poison' && 
                    enemy.poisonTurns <= 0 && 
                    Math.random() < (weapon.inflictChance || 0.25)) 
                {
                    logMessage(`Your weapon poisons the ${enemy.name}!`);
                    enemy.poisonTurns = 3; // 3 turns from a weapon
                }

                    if (enemy.health <= 0) {
                        // --- ENEMY IS DEFEATED ---
                        logMessage(`You defeated the ${enemy.name}!`);
                        grantXp(enemy.xp);
                        updateQuestProgress(enemy.tile);

                        const droppedLoot = generateEnemyLoot(gameState.player, enemyData);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemyId);

                        if (gameState.mapMode === 'dungeon') {
                            chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = droppedLoot;
                        } else if (gameState.mapMode === 'castle') {
                            // Ready for when we add castle enemies
                        }
                        } else {
                        // --- ENEMY SURVIVES AND ATTACKS ---
                        const armorDefense = gameState.player.equipment.armor ? gameState.player.equipment.armor.defense : 0;
                        const baseDefense = Math.floor(gameState.player.dexterity / 5);
                        const buffDefense = gameState.player.defenseBonus || 0;
                        const playerDefense = baseDefense + armorDefense + buffDefense;
                        const enemyDamage = Math.max(1, enemy.attack - playerDefense);

                        // --- NEW LUCK DODGE CHECK ---
                        const luckDodgeChance = Math.min(gameState.player.luck * 0.002, 0.25); // 0.2% per luck, max 25%
if (Math.random() < luckDodgeChance) { //
                            logMessage(`The ${enemy.name} attacks, but you luckily dodge!`);
                        } else {
                            // --- NEW SHIELD DAMAGE LOGIC ---
                            let damageToApply = enemyDamage;
                            if (gameState.player.shieldValue > 0) {
                                const damageAbsorbed = Math.min(gameState.player.shieldValue, damageToApply);
                                gameState.player.shieldValue -= damageAbsorbed;
                                damageToApply -= damageAbsorbed;

                                logMessage(`Your shield absorbs ${damageAbsorbed} damage!`);

                                if (gameState.player.shieldValue === 0) {
                                    logMessage("Your Arcane Shield shatters!");
                                }
                            }

                            // Apply remaining damage to health
                            if (damageToApply > 0) {
                                gameState.player.health -= damageToApply;
                                triggerStatFlash(statDisplays.health, false);
                                logMessage(`The ${enemy.name} hits you for ${damageToApply} damage!`);
                            }

                            if (gameState.player.thornsValue > 0) {
                            enemy.health -= gameState.player.thornsValue;
                            logMessage(`The ${enemy.name} takes ${gameState.player.thornsValue} damage from your thorns!`);

                            if (enemy.health <= 0) {
                                logMessage(`The ${enemy.name} is killed by your thorns!`);
                                grantXp(enemy.xp);
                                updateQuestProgress(enemy.tile);
                                const droppedLoot = generateEnemyLoot(gameState.player, enemy);
                                
                                // Remove from the array immediately
                                gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemyId);

                                // Place loot on the map
                                if (gameState.mapMode === 'dungeon') {
                                    chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = droppedLoot;
                                }
                                // (If we add castle enemies later, add castle loot logic here)
                            }
                        }
                            // --- END NEW SHIELD LOGIC ---
                        }
                        // --- END LUCK DODGE CHECK ---

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
                    return; // Stop the player's move
                } else {
                    logMessage(`You see the corpse of a ${enemyData.name}.`);
                }
                // (End of instanced combat)

            } else if (gameState.mapMode === 'overworld') {
                // --- NEW SHARED OVERWORLD COMBAT ---
                logMessage(`You attack the ${enemyData.name}!`); // <-- Add log message here
                
                // Calculate damage first
                const weaponDamage = gameState.player.equipment.weapon ? gameState.player.equipment.weapon.damage : 0;
                const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);
                const playerDamage = Math.max(1, (playerStrength + weaponDamage) - (enemyData.defense || 0));

                // Pass the calculated damage to the function
                await handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage);
                return; // Stop the player's move
            }
        }

        if (tileData && tileData.type === 'shrine') {
            const tileId = `${newX},${-newY}`;
            const player = gameState.player;
            let shrineUsed = false;

            if (gameState.lootedTiles.has(tileId)) {
                logMessage("The shrine's power is spent.");
                return; // Stop the move
            }

            loreTitle.textContent = "An Ancient Shrine";
            loreContent.innerHTML = `
                <p>The shrine hums with a faint energy. You feel you can ask for one boon.</p>
                <button id="shrineStr" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Strength (+5 Str for 5 turns)</button>
                <button id="shrineWits" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Wits (+5 Wits for 5 turns)</button>
            `;
            loreModal.classList.remove('hidden');

            // Add listeners for the new buttons
            document.getElementById('shrineStr').addEventListener('click', () => {
                if (player.strengthBonusTurns > 0) {
                    logMessage("You are already under the effect of a similar boon!");
                } else {
                    logMessage("You pray for Strength. You feel a surge of power!");
                    player.strengthBonus = 5;
                    player.strengthBonusTurns = 5;
                    playerRef.update({ strengthBonus: 5, strengthBonusTurns: 5 });
                    renderEquipment(); // Update UI
                    shrineUsed = true;
                }
                if (shrineUsed) gameState.lootedTiles.add(tileId);
                loreModal.classList.add('hidden');
            }, { once: true });

            document.getElementById('shrineWits').addEventListener('click', () => {
                // We don't have a witsBuff, so we'll just add to Wits temporarily
                // This is a bit more complex, let's just do Strength for now.
                // TODO: Add a Wits buff system later.
                logMessage("You pray for Wits... but nothing happens. (Wits buff not implemented)");
                loreModal.classList.add('hidden');

                /* // --- This is what the Wits logic would look like ---
                if (player.witsBonusTurns > 0) {
                     logMessage("You are already under the effect of a similar boon!");
                } else {
                    logMessage("You pray for Wits. Your mind feels sharper!");
                    player.witsBonus = 5;
                    player.witsBonusTurns = 5;
                    playerRef.update({ witsBonus: 5, witsBonusTurns: 5 });
                    shrineUsed = true;
                }
                if (shrineUsed) gameState.lootedTiles.add(tileId);
                loreModal.classList.add('hidden');
                */
            }, { once: true });
            
            return; // Stop the player's move
        }

        // 1. THE WISHING WELL
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

        // 2. THE UNSTABLE RIFT
        if (newTile === 'Ω') {
            logMessage("The world dissolves around you...");
            // Teleport huge distance
            const rX = Math.floor((Math.random() * 4000) - 2000);
            const rY = Math.floor((Math.random() * 4000) - 2000);
            gameState.player.x = rX;
            gameState.player.y = rY;
            exitToOverworld("You stumble out of a rift in a strange land.");
            return;
        }

        // 3. CACTUS (Harvesting)
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
                // Clear the cactus
                chunkManager.setWorldTile(newX, newY, 'D'); // Replace with Desert Sand
                renderInventory();
            } else {
                logMessage("Inventory full! You drop the fruit.");
            }
            return; 
        }

        else if (tileData && tileData.type === 'loot_chest') {
            logMessage("You pry open the chest...");
            
            // Give randomized high-tier loot
            const rareLoot = ['💎', '🍷', '🧪', '⚔️', '🛡️', '📜', '💰']; // Gems, Elixirs, Obsidian, Scrolls
            // (For MVP, let's just give 50-100 gold and an Elixir)
            
            const goldAmount = 50 + Math.floor(Math.random() * 50);
            gameState.player.coins += goldAmount;
            logMessage(`You found ${goldAmount} Gold!`);
            
            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                 gameState.player.inventory.push({
                    name: 'Elixir of Life',
                    type: 'consumable',
                    quantity: 1,
                    tile: '🍷',
                    effect: ITEM_DATA['🍷'].effect // Re-bind effect
                });
                logMessage("You found an Elixir of Life!");
            }
            
            // Clear the chest
            chunkManager.setWorldTile(newX, newY, '.'); 
            
            playerRef.update({ coins: gameState.player.coins, inventory: gameState.player.inventory });
            renderInventory();
            return; 
        }

        else if (newTile === '<') {
            const player = gameState.player;
            let tileId;
            if (gameState.mapMode === 'overworld') {
                tileId = `${newX},${-newY}`; // Traps shouldn't be in overworld, but good to have
            } else {
                const mapId = gameState.currentCaveId || gameState.currentCastleId;
                tileId = `${mapId}:${newX},${-newY}`;
            }

            // Check if trap has already been triggered/looted
            if (gameState.lootedTiles.has(tileId)) {
                logMessage("You step over a disarmed trap.");
            } else {
                // It's a live trap! Check Dexterity.
                const avoidChance = Math.min(0.75, player.dexterity * 0.01); // 1% per Dex, max 75%

                if (Math.random() < avoidChance) {
                    // --- SUCCESS ---
                    logMessage("You spot a spike trap and deftly avoid it, disarming it!");
                    // We "disarm" it by adding it to lootedTiles, but we stop the move.
                    gameState.lootedTiles.add(tileId);
                    playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles) });
                    return; // Stop the move!
                } else {
                    // --- FAILURE ---
                    logMessage("You step right on a spike trap! Ouch!");
                    const trapDamage = 3;
                    player.health -= trapDamage;
                    triggerStatFlash(statDisplays.health, false);
                    
                    // Mark it as "looted" so it's gone
                    gameState.lootedTiles.add(tileId);
                    // We *don't* return, allowing the player to move onto the tile.
                    // The item pickup logic later will see it's "looted" and clear it.
                }
            }
        }

let moveCost = TERRAIN_COST[newTile] ?? 0; // Changed to 'let'
        let isDisembarking = false;

        // --- 1. ARE WE BOATING? ---
        if (gameState.player.isBoating) {
            if (newTile === '~') {
                moveCost = 1; // Row, row, row your boat (costs 1 stamina)
            } else if (moveCost !== Infinity) {
                // This is a land tile! We are disembarking.
                isDisembarking = true;
                // moveCost is already 0 (for '.') or 1 (for 'F'), which is fine.
            } else {
                // Trying to boat onto a mountain or other impassable tile
                logMessage("You can't beach the canoe here.");
                return;
            }
        
        // --- 2. WE ARE ON FOOT (This 'else' block contains your tool logic) ---
        } else {
            // Check for tool logic
            if (gameState.mapMode === 'overworld') {
                const playerInventory = gameState.player.inventory;
                // --- YOUR TOOL LOGIC IS HERE ---
                if (newTile === 'F' && playerInventory.some(item => item.name === 'Machete')) {
                    moveCost = 0; 
                }
                // --- YOUR TOOL LOGIC IS HERE ---
                if (newTile === '^' && playerInventory.some(item => item.name === 'Climbing Tools')) {
                    moveCost = Math.max(1, moveCost - 1);
                }
            }
            
            // Standard impassable check
            if (moveCost === Infinity) {
                // Check for secret cave logic
                if (newTile === '^' && gameState.mapMode === 'overworld') {
                    const tileId = `${newX},${-newY}`;
                    const seed = stringToSeed(WORLD_SEED + ':' + tileId);
                    const random = Alea(seed);
                    
                    if (random() < 0.05) { // 5% chance of being a secret
                        logMessage("You push against the rock... and it gives way! You've found a hidden passage! +50 XP");
                        grantXp(50); // Extra XP for finding a secret

                        chunkManager.setWorldTile(newX, newY, '⛰');

                        // Trigger the "enter cave" logic
                        gameState.mapMode = 'dungeon';
                        gameState.currentCaveId = `cave_${newX}_${newY}`;
                        gameState.overworldExit = {
                            x: gameState.player.x,
                            y: gameState.player.y
                        };

                        const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                        gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];

                        for (let y = 0; y < caveMap.length; y++) {
                            const x = caveMap[y].indexOf('>');
                            if (x !== -1) {
                                gameState.player.x = x;
                                gameState.player.y = y;
                                break;
                            }
                        }

                        const baseEnemies = chunkManager.caveEnemies[gameState.currentCaveId] || [];
                        gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));

                        logMessage("You enter the " + (CAVE_THEMES[gameState.currentCaveTheme]?.name || 'cave') + "...");
                        updateRegionDisplay();
                        render();
                        syncPlayerState();
                        return; // Stop the rest of the turn
                    }
                }
                
                logMessage("That way is blocked."); // Default "bump into wall" message
                return; // Stop here if impassable
            }
        }
        
        // --- 3. HANDLE DISEMBARKING (if flagged) ---
        if (isDisembarking) {
            gameState.player.isBoating = false;
            logMessage("You beach the canoe and step onto the shore.");
            // Place the canoe back where we WERE (startX, startY)
            chunkManager.setWorldTile(startX, startY, 'c');
            playerRef.update({ isBoating: false });
        }
        
        // 3. If no collision, check for special tiles (entrances, lore, etc.)

        if (tileData) {
            const tileId = `${newX},${-newY}`; // Get tileId for XP checks

            if (tileData.type === 'journal') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You found a new journal! +25 XP");
                    grantXp(25);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                loreTitle.textContent = tileData.title;
                loreContent.textContent = tileData.content;
                loreModal.classList.remove('hidden');
                return;
            }

            if (newTile === 'B') {
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've discovered a Bounty Board! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            openBountyBoard();
            return; // Stop the player's move
            }

            if (newTile === '#') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've found an ancient Rune Stone! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                
                // --- BIOME DETECTION LOGIC ---
                // We recalculate the noise for this specific spot to determine the biome
                // Note: We divide coordinates by CHUNK_SIZE (16) because the noise function expects world coords
                // Actually, newX/newY ARE world coords, so we use the same math as generateChunk.
                const elev = elevationNoise.noise(newX / 70, newY / 70);
                const moist = moistureNoise.noise(newX / 50, newY / 50);

                let loreArray = LORE_PLAINS; // Default
                let biomeName = "Plains";

                if (elev < 0.4 && moist > 0.7) {
                    loreArray = LORE_SWAMP;
                    biomeName = "Swamp";
                } else if (elev > 0.8) {
                    loreArray = LORE_MOUNTAIN;
                    biomeName = "Mountain";
                } else if (moist > 0.55) {
                    loreArray = LORE_FOREST;
                    biomeName = "Forest";
                }
                // --- END BIOME DETECTION ---

                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const messageIndex = Math.floor(random() * loreArray.length);
                const message = loreArray[messageIndex];

                loreTitle.textContent = `Rune Stone (${biomeName})`;
                loreContent.textContent = `The stone hums with the energy of the ${biomeName}.\n\n"...${message}..."`;
                loreModal.classList.remove('hidden');
                return;
            }

            if (tileData.type === 'obelisk') {
                 // 1. Check if this is a new discovery
                 if (!gameState.foundLore.has(tileId)) {
    // ... (XP and Lore logic) ...

    // --- STACK-AWARE DROP LOGIC ---
    // Step 1: Look for an existing stack first
    const existingStack = gameState.player.inventory.find(item => item.name === 'Obsidian Shard');
    
    if (existingStack) {
        // Case A: We found a stack! Just add to it.
        existingStack.quantity++;
        logMessage("The Obelisk hums, and another shard forms in your pack.");
        playerRef.update({ inventory: gameState.player.inventory });
        renderInventory();
    } 
    else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
        // Case B: No stack, but we have room for a new one.
        gameState.player.inventory.push({
            name: 'Obsidian Shard',
            type: 'junk',
            quantity: 1,
            tile: '▲'
        });
        logMessage("The Obelisk hums, and a shard of black glass falls into your hand.");
        playerRef.update({ inventory: gameState.player.inventory });
        renderInventory();
    } 
    else {
        // Case C: No stack and no room.
        logMessage("The Obelisk offers a shard, but your inventory is full!");
    }
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
                return; // Stop the player's move
            }

            if (tileData.type === 'random_journal') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You found a scattered page! +10 XP");
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                // Use the tile's location to pick a random, but persistent, message
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const messageIndex = Math.floor(random() * RANDOM_JOURNAL_PAGES.length);
                const message = RANDOM_JOURNAL_PAGES[messageIndex];

                loreTitle.textContent = "A Scattered Page";
                loreContent.textContent = `You pick up a damp, crumpled page...\n\n"...${message}..."`;
                loreModal.classList.remove('hidden');
                return; // Stop the player's move
            }

            if (newTile === 'N') {
                // --- NEW FETCH QUEST LOGIC FOR VILLAGERS ---
                const npcQuestId = "goblinHeirloom"; // The quest this NPC type gives
                const questData = QUEST_DATA[npcQuestId];
                const playerQuest = gameState.player.quests[npcQuestId];
                const player = gameState.player;
                
                // Add lore XP for the first time meeting *any* villager
                const genericVillagerId = "met_villager"; 
                if (!gameState.foundLore.has(genericVillagerId)) {
                    logMessage("You meet a villager. +5 XP");
                    grantXp(5);
                    gameState.foundLore.add(genericVillagerId); // Use a generic ID
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }

                if (!playerQuest) {
                    // --- SCENARIO A: Player does NOT have the quest ---
                    loreTitle.textContent = "Distraught Villager";
                    loreContent.innerHTML = `
                        <p>An old villager wrings their hands.\n\n"Oh, thank goodness! A goblin stole my family heirloom... It's all I have left. If you find it, please bring it back!"</p>
                        <button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll keep an eye out."</button>
                    `;
                    loreModal.classList.remove('hidden');
                    
                    // Add a one-time listener for the new button
                    document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                        acceptQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, { once: true }); // {once: true} is important!

                } else if (playerQuest.status === 'active') {
                    // --- SCENARIO B: Player has the quest ---
                    const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);

                    if (hasItem) {
                        // B1: Player has the item!
                        loreTitle.textContent = "Joyful Villager";
                        loreContent.innerHTML = `
                            <p>The villager's eyes go wide.\n\n"You found it! My heirloom! Thank you, thank you! I don't have much, but please, take this for your trouble."</p>
                            <button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>
                        `;
                        loreModal.classList.remove('hidden');

                        document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                            turnInQuest(npcQuestId);
                            loreModal.classList.add('hidden');
                        }, { once: true });

                    } else {
                        // B2: Player does NOT have the item
                        loreTitle.textContent = "Anxious Villager";
                        loreContent.innerHTML = `
                            <p>The villager looks up hopefully.\n\n"Any luck finding my heirloom? Those goblins are such pests..."</p>
                            <button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>
                        `;
                        loreModal.classList.remove('hidden');

                        document.getElementById('closeNpcLore').addEventListener('click', () => {
                            loreModal.classList.add('hidden');
                        }, { once: true });
                    }

                } else if (playerQuest.status === 'completed') {
                    // --- SCENARIO C: Player has completed the quest ---
                    const seed = stringToSeed(tileId); // Need a seed for consistent rumor
                    const random = Alea(seed);
                    const rumor = VILLAGER_RUMORS[Math.floor(random() * VILLAGER_RUMORS.length)];

                    loreTitle.textContent = "Grateful Villager";
                    loreContent.innerHTML = `
                        <p>The villager smiles warmly.\n\n"Thank you again for your help, traveler. By the way..."</p>
                        <p class="italic text-sm mt-2">"${rumor}"</p>
                        <button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Good to know."</button>
                    `;
                    loreModal.classList.remove('hidden');

                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                    }, { once: true });
                }
                
                return; // Stop the player's move
            }

            if (newTile === 'G') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You spoke to a Castle Guard. +5 XP");
                    grantXp(5);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                // Use a seeded random to make their dialogue consistent
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const guardDialogues = [
                    "Keep your wits about you. Even in a castle, you can't be too careful.",
                    "This fortress has stood for ages. It'll stand for many more, long as we're here.",
                    "Looking for the Sage? He's the one muttering about 'five thrones' all the time.",
                    "The King's old chambers are off-limits. Place is haunted, they say.",
                    "Watch yourself near the battlements. It's a long way down.",
                    "Steer clear of the old throne room. We've found... strange relics. Dark sigils. The Sage is worried."
                ];
                const dialogue = guardDialogues[Math.floor(random() * guardDialogues.length)];

                loreTitle.textContent = "Castle Guard";
                loreContent.textContent = `The guard nods as you approach.\n\n"${dialogue}"`;
                loreModal.classList.remove('hidden');
                return;
            }

            // --- NEW SAGE LOGIC ---
            if (newTile === 'O') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You listen to the Sage's ramblings. +10 XP");
                    grantXp(10); // Same as a rune stone
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                // Use the same lore as the Rune Stones for a consistent feel
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
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                openSkillTrainerModal();
                return; // Stop the player's move
            }

            if (newTile === 'K') {
                // --- NEW COLLECT QUEST LOGIC FOR PROSPECTOR ---
                const npcQuestId = "goblinTrophies"; // The quest this NPC type gives
                const questData = QUEST_DATA[npcQuestId];
                const playerQuest = gameState.player.quests[npcQuestId];
                const player = gameState.player;
                
                // Add lore XP for the first time meeting *any* prospector
                const genericProspectorId = "met_prospector"; 
                if (!gameState.foundLore.has(genericProspectorId)) {
                    logMessage("You meet a Lost Prospector. +5 XP");
                    grantXp(5);
                    gameState.foundLore.add(genericProspectorId); // Use a generic ID
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }

                if (!playerQuest) {
                    // --- SCENARIO A: Player does NOT have the quest ---
                    loreTitle.textContent = "Frustrated Prospector";
                    loreContent.innerHTML = `
                        <p>A grizzled prospector, muttering to themself, jumps as you approach.\n\n"Goblins! I hate 'em! Always stealing my supplies, leaving these... these *totems* everywhere. Say, if you're clearing 'em out, bring me 10 of those Goblin Totems. I'll make it worth your while!"</p>
                        <button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll see what I can do."</button>
                    `;
                    loreModal.classList.remove('hidden');
                    
                    document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                        acceptQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, { once: true });

                } else if (playerQuest.status === 'active') {
                    // --- SCENARIO B: Player has the quest ---
                    const itemInInv = player.inventory.find(item => item.name === questData.itemNeeded);
                    const hasItems = itemInInv && itemInInv.quantity >= questData.needed;

                    if (hasItems) {
                        // B1: Player has the items!
                        loreTitle.textContent = "Surprised Prospector";
                        loreContent.innerHTML = `
                            <p>The prospector's eyes go wide as you show him the totems.\n\n"Ha! You actually did it! That'll teach 'em. Here, as promised. This is for your trouble."</p>
                            <button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>
                        `;
                        loreModal.classList.remove('hidden');

                        document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                            turnInQuest(npcQuestId);
                            loreModal.classList.add('hidden');
                        }, { once: true });

                    } else {
                        // B2: Player does NOT have the items
                        const needed = questData.needed - (itemInInv ? itemInInv.quantity : 0);
                        loreTitle.textContent = "Impatient Prospector";
                        loreContent.innerHTML = `
                            <p>The prospector looks up.\n\n"Back already? You still need to find ${needed} more ${questData.itemNeeded}s. Get a move on!"</p>
                            <button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>
                        `;
                        loreModal.classList.remove('hidden');

                        document.getElementById('closeNpcLore').addEventListener('click', () => {
                            loreModal.classList.add('hidden');
                        }, { once: true });
                    }

                } else if (playerQuest.status === 'completed') {
                    // --- SCENARIO C: Player has completed the quest ---
                    loreTitle.textContent = "Grateful Prospector";
                    loreContent.innerHTML = `
                        <p>The prospector nods at you.\n\n"Thanks again for your help, adventurer. The caves are a little quieter... for now."</p>
                        <button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"You're welcome."</button>
                    `;
                    loreModal.classList.remove('hidden');

                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                    }, { once: true });
                }
                
                return; // Stop the player's move
            }

            if (newTile === '§') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a General Store! +15 XP");
                    grantXp(15);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
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
                const HEAL_COST = 10;
                const player = gameState.player;

                if (player.health < player.maxHealth) {
                    if (player.coins >= HEAL_COST) {
                        player.coins -= HEAL_COST;
                        player.health = player.maxHealth;

                        logMessage(`The Healer restores your health for ${HEAL_COST} gold.`);
                        triggerStatAnimation(statDisplays.health, 'stat-pulse-green');

                        playerRef.update({
                            health: player.health,
                            coins: player.coins
                        });
                    } else {
                        logMessage(`"You need ${HEAL_COST} gold for my services," the Healer says.`);
                    }
                } else {
                    logMessage(`"You are already at full health!" the Healer says.`);
                }
                return;
            }

// Handle all other special tiles like entrances/exits
            switch (tileData.type) {
                case 'workbench':
                    if (!gameState.foundLore.has(tileId)) {
                        logMessage("You found a workbench! +10 XP");
                        grantXp(10);
                        gameState.foundLore.add(tileId);
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    openCraftingModal();
                    return; // Stop the player's move
                case 'village_entrance':
                    if (!gameState.foundLore.has(tileId)) {
                        logMessage("You've discovered a safe haven village! +100 XP");
                        grantXp(100);
                        gameState.foundLore.add(tileId);
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    gameState.mapMode = 'castle'; // We re-use 'castle' mode
                    gameState.currentCastleId = tileData.getVillageId(newX, newY); // Use its unique ID
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };
                    
                    // Force it to use our new layout
                    chunkManager.generateCastle(gameState.currentCastleId, 'SAFE_HAVEN');
                    
                    const villageSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                    gameState.player.x = villageSpawn.x;
                    gameState.player.y = villageSpawn.y;
                    
                    // We need to clear instanced enemies, as this is a safe zone
                    gameState.instancedEnemies = []; 

                    logMessage("You enter the peaceful village.");
                    updateRegionDisplay();
                    render();
                    syncPlayerState();
                    return; // Stop the move

                case 'canoe':
                    if (!gameState.foundLore.has(tileId)) {
                        logMessage("You found a canoe! +10 XP");
                        grantXp(10);
                        gameState.foundLore.add(tileId);
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    gameState.player.isBoating = true;
                    logMessage("You get in the canoe.");

                    gameState.flags.canoeEmbarkCount++; // Increment the session counter
                    const count = gameState.flags.canoeEmbarkCount;

                    if (count === 1 || count === 3 || count === 7) {
                        logMessage("Be warned: Rowing the canoe will cost stamina!");
                    }
                    
                    // Remove the canoe from the map, replace with land
                    chunkManager.setWorldTile(newX, newY, '.');
                    playerRef.update({ isBoating: true });
                    // We break here; the move itself will be handled next
                    break; 
                // --- END NEW LOGIC ---

                case 'dungeon_entrance':
                    if (!gameState.foundLore.has(tileId)) {
                        logMessage("You've discovered a cave entrance! +10 XP");
                        grantXp(10);
                        gameState.foundLore.add(tileId);
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    gameState.mapMode = 'dungeon';
                    gameState.currentCaveId = tileData.getCaveId(newX, newY);
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };
                    const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                    gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                    for (let y = 0; y < caveMap.length; y++) {
                        const x = caveMap[y].indexOf('>');
                        if (x !== -1) {
                            gameState.player.x = x;
                            gameState.player.y = y;
                            break;
                        }
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
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    gameState.mapMode = 'castle';
                    gameState.currentCastleId = tileData.getCastleId(newX, newY);
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };

                    
                    // Instead of a random layout, we force it to use FORTRESS
                    chunkManager.generateCastle(gameState.currentCastleId, 'GRAND_FORTRESS');
                    

                    const landmarkSpawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                    gameState.player.x = landmarkSpawn.x;
                    gameState.player.y = landmarkSpawn.y;

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
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    gameState.mapMode = 'castle';
                    gameState.currentCastleId = tileData.getCastleId(newX, newY);
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };
                    chunkManager.generateCastle(gameState.currentCastleId);
                    const spawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                    gameState.player.x = spawn.x;
                    gameState.player.y = spawn.y;
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
                        playerRef.update({
                            foundLore: Array.from(gameState.foundLore)
                        });
                    }
                    if (Array.isArray(tileData.message)) {
                        const currentTurn = Math.floor((gameState.time.day * 1440 + gameState.time.hour * 60 + gameState.time.minute) / TURN_DURATION_MINUTES);
                        const messageIndex = currentTurn % tileData.message.length;
                        logMessage(tileData.message[messageIndex]);
                    } else logMessage(tileData.message);
            }
        }

        // --- *** BEGIN REFACTORED LOGIC *** ---

        // 4. Handle item pickups *BEFORE* moving.
        let tileId;
        if (gameState.mapMode === 'overworld') {
            tileId = `${newX},${-newY}`;
        } else {
            const mapId = gameState.currentCaveId || gameState.currentCastleId;
            tileId = `${mapId}:${newX},${-newY}`;
        }

        const itemData = ITEM_DATA[newTile];
        let inventoryWasUpdated = false; // Flag to save inventory

        // --- Helper function to clear the tile ---
        function clearLootTile() {
            gameState.lootedTiles.add(tileId); // Mark as looted
            // Clear the tile from the map
            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(newX, newY, '.');
            } else if (gameState.mapMode === 'dungeon') {
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
            } else if (gameState.mapMode === 'castle') {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
            }
        }
        // --- End Helper ---

        if (itemData) {
            let isTileLooted = gameState.lootedTiles.has(tileId);

            if (isTileLooted) {
                logMessage(`You see where a ${itemData.name} once was...`);
            } else {
                // This is an item we can pick up.

                if (itemData.type === 'consumable') {
                    const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                    if (existingItem) {
                        existingItem.quantity++;
                        logMessage(`You picked up a ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile(); // <-- FIXED
                    } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up a ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile(); // <-- FIXED
                    } else {
                        logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                        return; // <-- Cancel the move!
                    }

                } else if (itemData.type === 'weapon') {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile,
                            damage: itemData.damage,
                            slot: itemData.slot,
                            statBonuses: itemData.statBonuses || null
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up a ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile(); // <-- FIXED
                    } else {
                        logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                        return; // <-- Cancel the move!
                    }

                } else if (itemData.type === 'armor') {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile,
                            defense: itemData.defense,
                            slot: itemData.slot,
                            statBonuses: itemData.statBonuses || null
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile(); // <-- FIXED
                    } else {
                        logMessage(`You see ${itemData.name}, but your inventory is full!`);
                        return; // <-- Cancel the move!
                    }

                    } else if (itemData.type === 'spellbook' || itemData.type === 'skillbook' || itemData.type === 'tool') {
                    // This block handles all special items that just need to be in inventory
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile,
                            spellId: itemData.spellId || null, // For spellbooks
                            skillId: itemData.skillId || null,  // For skillbooks
                            stat: itemData.stat || null
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up the ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile();
                    } else {
                        logMessage(`You see the ${itemData.name}, but your inventory is full!`);
                        return; // Cancel the move
                    }

                } else if (itemData.type === 'junk') {
                    const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);

                    if (existingItem) {
                        // Case 1: Stack it
                        existingItem.quantity++;
                        logMessage(`You picked up a ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile();
                    } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        // Case 2: Add new item to inventory
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up a ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile();
                    } else {
                        // Case 3: Inventory full
                        logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                        return; // <-- Cancel the move!
                    }
                } else if (itemData.type === 'instant') {
                    itemData.effect(gameState, tileId);
                    clearLootTile();
                }
            }
        }

        // 5. If move is valid (not blocked, no full inv), calculate stamina and move.
        const staminaDeficit = moveCost - gameState.player.stamina;
        if (moveCost > gameState.player.stamina && gameState.player.health <= staminaDeficit) {
            logMessage("You're too tired, and pushing on would be fatal!");
            return;
        }

        gameState.player.x = newX;
        gameState.player.y = newY;

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

        if (newTile === '≈') { // Swamplands
            // 1% chance per point *under* 10 Endurance.
            // At 10 Endurance, resistChance = 0%.
            // At 1 Endurance, resistChance = 9%.
            const resistChance = Math.max(0, (10 - player.endurance)) * 0.01;
            if (Math.random() < resistChance && player.poisonTurns <= 0) {
                logMessage("You feel sick from the swamp's foul water. You are Poisoned!");
                player.poisonTurns = 5; // 5 turns of poison
            }
        }

        if (gameState.mapMode === 'overworld') {
            const playerInventory = gameState.player.inventory;
            const hasPickaxe = playerInventory.some(item => item.name === 'Pickaxe');

            if (hasPickaxe) {
                // Case A: Mining Mountains
                if (newTile === '^') {
                    logMessage("You use your Pickaxe to chip at the rock...");
                    
                    // 25% chance to find ore
                    if (Math.random() < 0.25) {
                        const existingStack = playerInventory.find(item => item.name === 'Iron Ore');
                        
                        if (existingStack) {
                            existingStack.quantity++;
                            logMessage("...and find some Iron Ore!");
                            inventoryWasUpdated = true;
                        } else if (playerInventory.length < MAX_INVENTORY_SLOTS) {
                            // Add new item
                            playerInventory.push({
                                name: 'Iron Ore',
                                type: 'junk',
                                quantity: 1,
                                tile: '•'
                            });
                            logMessage("...and find some Iron Ore!");
                            inventoryWasUpdated = true;
                        } else {
                            logMessage("...you find ore, but your inventory is full!");
                        }
                    } else {
                        logMessage("...but find nothing of value.");
                    }
                } 
                // Case B: Digging for Treasure
                else if (gameState.activeTreasure && 
                         newX === gameState.activeTreasure.x && 
                         newY === gameState.activeTreasure.y) {
                    
                    logMessage("You dig where the map marked... clunk!");
                    logMessage("You found a Buried Chest!");
                    
                    // Spawn the chest tile
                    chunkManager.setWorldTile(newX, newY, '📦');
                    
                    // Clear the active treasure
                    gameState.activeTreasure = null;
                    
                    // Consume the map
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

        // 6. Handle final updates
        
        // --- NEW: Call Perception Check ---
        // Must be AFTER player.x/y are updated but BEFORE render()
        passivePerceptionCheck();
        // --- END NEW ---
        
        render();
        updateRegionDisplay();
        syncPlayerState();

        // --- Consolidated Database Update ---
        let updates = {
            x: gameState.player.x,
            y: gameState.player.y,
            health: gameState.player.health,
            stamina: gameState.player.stamina,
            coins: gameState.player.coins
        };

        if (inventoryWasUpdated) {
            updates.inventory = gameState.player.inventory.map(item => ({
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                tile: item.tile,
                damage: item.damage || null, // <-- With Firebase fix
                slot: item.slot || null, // <-- With Firebase fix
                defense: item.defense || null // <-- With Firebase fix
            }));

            updates.lootedTiles = Array.from(gameState.lootedTiles);

            renderInventory(); // Re-render inventory only if it changed
        }

        playerRef.update(updates);
        // --- End Consolidated Update ---

        // After moving, check if we need to unload any chunks
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

    })();

});

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
        const message = chatInput.value;
        chatInput.value = '';
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
        finalState.inventory = finalState.inventory.map(item => ({
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

async function startGame(user) {
    player_id = user.uid;
    playerRef = db.collection('players').doc(player_id);
    authContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    const loadingIndicator = document.getElementById('loadingIndicator');

    canvas.style.visibility = 'hidden';

    try {
        const doc = await playerRef.get();
        if (doc.exists) {
            let playerData = doc.data();
            if (playerData.health <= 0) {
                logMessage("You have respawned.");
                playerData = createDefaultPlayerState();
                await playerRef.set(playerData);
            }
            const fullPlayerData = {
                ...createDefaultPlayerState(),
                ...playerData
            };
            Object.assign(gameState.player, fullPlayerData);

            if (playerData.discoveredRegions && Array.isArray(playerData.discoveredRegions)) {
                gameState.discoveredRegions = new Set(playerData.discoveredRegions);
            }

            if (playerData.foundLore && Array.isArray(playerData.foundLore)) {
                gameState.foundLore = new Set(playerData.foundLore);
            } else {
                gameState.foundLore = new Set();
            }

            if (playerData.lootedTiles && Array.isArray(playerData.lootedTiles)) {
                gameState.lootedTiles = new Set(playerData.lootedTiles);
            } else {
                // This is a new player or first login since the fix
                gameState.lootedTiles = new Set();
            }

        } else {

            // It handles users who are logged in but don't have a player document yet.
            logMessage("Welcome! Creating your character sheet...");
            const defaultState = createDefaultPlayerState();
            await playerRef.set(defaultState);
            Object.assign(gameState.player, defaultState);
        }
    } catch (error) {
        console.error("Error fetching initial player state:", error);
    }

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
                const finalState = {
                    ...gameState.player,
                    lootedTiles: Array.from(gameState.lootedTiles)
                };

                if (finalState.inventory) {
                    finalState.inventory = finalState.inventory.map(item => ({
                    
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
        render(); // Re-render the screen to show new health bars
    });

    unsubscribePlayerListener = playerRef.onSnapshot((doc) => {
        if (doc.exists) {
            const playerData = doc.data();

            // --- Update Inventory ---
            if (playerData.inventory) {
                playerData.inventory.forEach(item => {
                    const templateItem = Object.values(ITEM_DATA).find(d => d.name === item.name);
                    if (templateItem) {
                        item.effect = templateItem.effect;
                        if (templateItem.type === 'weapon') {
                            item.damage = templateItem.damage;
                            item.slot = templateItem.slot;
                        } else if (templateItem.type === 'armor') {
                            item.defense = templateItem.defense;
                            item.slot = templateItem.slot;
                        }
                    }
                });

                // After loading inventory, set equipment pointers
                const equippedWeapon = playerData.inventory.find(i => i.type === 'weapon' && i.isEquipped);
                const equippedArmor = playerData.inventory.find(i => i.type === 'armor' && i.isEquipped);

                gameState.player.equipment.weapon = equippedWeapon || { name: 'Fists', damage: 0 };
                gameState.player.equipment.armor = equippedArmor || { name: 'Simple Tunic', defense: 0 };

                gameState.player.inventory = playerData.inventory;
                renderInventory();
            }

            // --- Update Equipment ---
            if (playerData.equipment) {

                // Ensure default equipment is present if not in DB
                gameState.player.equipment = {
                    ...{
                        weapon: {
                            name: 'Fists',
                            damage: 0
                        },
                        armor: {
                            name: 'Simple Tunic',
                            defense: 0
                        }
                    },
                    ...playerData.equipment
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

                // Define a helper function for clarity
                const applyRegen = (stat, maxStat, progressStat) => {
                    if (player[stat] < player[maxStat]) {
                        player[progressStat] += regenAmount;
                        if (player[progressStat] >= 1) {
                            const pointsToAdd = Math.floor(player[progressStat]);
                            player[stat] = Math.min(player[maxStat], player[stat] + pointsToAdd);
                            player[progressStat] -= pointsToAdd; // Keep the remainder
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
        // This keeps the scrollbar at the bottom (most recent message)
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    renderStats();

    renderEquipment();

    renderTime();

    resizeCanvas();

    render();
    canvas.style.visibility = 'visible';
    syncPlayerState();
    logMessage(`Logged in as ${user.email}`);
    updateRegionDisplay();

    loadingIndicator.classList.add('hidden');
    initShopListeners();
    initSpellbookListeners();
    initInventoryListeners();
    initSkillbookListeners();

    initQuestListeners();

    initCraftingListeners();

    initSkillTrainerListeners();
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) applyTheme(savedTheme);
        else if (prefersDark) applyTheme('dark');
        else applyTheme('light');
        startGame(user);
    } else {
        authContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        player_id = null;
        if (onlinePlayerRef) onlinePlayerRef.remove();
        if (unsubscribePlayerListener) unsubscribePlayerListener();
        Object.values(worldStateListeners).forEach(unsubscribe => unsubscribe());
        worldStateListeners = {};
        clearSessionState();
        console.log("No user is signed in.");
    }
});

window.addEventListener('resize', resizeCanvas);
