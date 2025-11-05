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
            '▓.........▓...L.....▓', // Put a journal here
            '▓.........▓.........▓',
            '▓.........▓▓▓.......▓',
            '▓.............▓.....▓',
            '▓.............▓.....▓',
            '▓.............▓.....▓',
            '▓.............▓.....▓',
            '▓.............X.....▓', // Exit
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
        ]
    },
    // --- NEWLY ADDED LAYOUT ---
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
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓.......▓...▓...▓.........▓...▓.........▓...▓',
            '▓...▓.............▓...▓.........▓...▓.▓...▓...▓...$.....▓...▓...▓.........▓...▓.........▓...▓',
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
    }
];

const QUEST_DATA = {
    "wolfHunt": {
        title: "Bounty: Wolf Hunt",
        description: "The local shepherds are plagued by wolves. Thin their numbers.",
        enemy: 'w', // The enemy tile to track
        needed: 10,
        reward: {
            xp: 100,
            coins: 50
        }
    }
    // We can add more quests here later, like "banditHunt"
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
        decorations: ['+', 'o', '$', '📖']
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
        decorations: ['S', 'Y', '$'] // Stamina/Psyche items are more common
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
        decorations: ['+', '$', '🔥']
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
        decorations: ['Y', 'o', '$'] // Psyche, Mana, and Gold
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
        decorations: ['+', 'S', 'o'] // Health, Stamina, Mana
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

const LORE_STONE_MESSAGES = [
    "The sky bleeds...",
    "Five thrones, five traitors...",
    "What was sundered must be remade.",
    "The King's folly... the mountain's wrath...",
    "Ash seeks its own.",
    "Below the castles, the old gods wait.",
    "The marsh whispers your name.",
    "Immortality is a cage.",
    "They came from the ice.",
    "The Fourth Age is the last.",
    "He did not die. He waits.",
    "All rivers run to the Sunken Valley.",
    "The forest remembers.",
    "Stolen from the stars, returned to the earth.",
    "A crown of shadow, a broken sword."
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
    }
    // We can add many more recipes here later
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
        }
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
        const CAVE_WIDTH = 50;
        const CAVE_HEIGHT = 50;
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
        let steps = 1000;
        while (steps > 0) {
            map[y][x] = theme.floor; // Use theme's floor
            const direction = Math.floor(random() * 4);
            if (direction === 0 && x > 1) x--;
            else if (direction === 1 && x < CAVE_WIDTH - 2) x++;
            else if (direction === 2 && y > 1) y--;
            else if (direction === 3 && y < CAVE_HEIGHT - 2) y++;
            steps--;
        }

        // 3. Place loot and decorations

        // --- Part A: Place 0-3 random loot items ---
        const CAVE_LOOT_TABLE = ['+', 'o', 'Y', 'S', '$'];
        const lootQuantity = Math.floor(random() * 4); // Generates 0, 1, 2, or 3

        for (let i = 0; i < lootQuantity; i++) {
            // Pick a random item from your global loot table
            const itemToPlace = CAVE_LOOT_TABLE[Math.floor(random() * CAVE_LOOT_TABLE.length)];

            // Try 5 times to find an empty spot
            let placed = false;
            for (let attempt = 0; attempt < 5 && !placed; attempt++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

                // Only place on a floor tile
                if (map[randY][randX] === theme.floor) {
                    map[randY][randX] = itemToPlace;
                    placed = true;
                }
            }
        }

        // --- Part B: Place special theme items (like '📖') ---
        // This finds items in the theme list that AREN'T in our loot table
        const specialItems = theme.decorations.filter(item => !CAVE_LOOT_TABLE.includes(item));

        for (const itemToPlace of specialItems) {
            // Try 5 times to find an empty spot
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

        this.caveEnemies[caveId] = []; // Reset/init the enemy list for this cave
        const enemyTypes = Object.keys(ENEMY_DATA);

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
                    loot: enemyTemplate.loot
                });
            }
        }

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
                else if (moist > 0.55) tile = 'F'; // Forest
                else tile = '.'; // Plains

                const featureRoll = random();

                // 0.001% chance to spawn the Landmark Fortress

                if (tile === '.' && featureRoll < 0.00001) {
                    this.setWorldTile(worldX, worldY, '♛');
                    chunkData[y][x] = '♛';
                } else if (tile === '.' && featureRoll < 0.0003) { // Spawn safe features
                    let features = Object.keys(TILE_DATA);
                    features = features.filter(f => TILE_DATA[f].type !== 'dungeon_exit' &&
                        TILE_DATA[f].type !== 'castle_exit' &&
                        TILE_DATA[f].type !== 'enemy' &&
                        f !== '📖');

                    const featureTile = features[Math.floor(Math.random() * features.length)];

                    if (TILE_DATA[featureTile].type === 'dungeon_entrance' || TILE_DATA[featureTile].type === 'castle_entrance') {
                        this.setWorldTile(worldX, worldY, featureTile);
                        chunkData[y][x] = featureTile;
                    } else {
                        chunkData[y][x] = featureTile;
                    }
                } else {
                    // No safe feature spawned. Check for hostile spawn.
                    const hostileRoll = random();

                    // Wolves spawn in forests (0.02% chance)
                    if (tile === 'F' && hostileRoll < 0.0002) {
                        chunkData[y][x] = 'w';
                    }
                    // Wolves (0.01%) and Bandits (0.01%) spawn on plains
                else if (tile === '.' && hostileRoll < 0.0002) {
                    if (hostileRoll < 0.0001) {
                        chunkData[y][x] = 'w'; // Wolf
                    } else {
                        // This is a "Bandit" spawn
                        if (random() < 0.1) { // 10% of these are a Chief
                            chunkData[y][x] = 'C';
                        } else { // 90% are a normal Bandit
                            chunkData[y][x] = 'b';
                        }
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
        psycheRegenProgress: 0
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
        hasSeenForestWarning: false
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
        tile: item.tile
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

function generateEnemyLoot(player, enemy) { // <-- UPDATED SIGNATURE
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
        tile: item.tile
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
        tile: item.tile
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
        // ... (rest of loop)
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
                    // Refund the cost
                    player[costType] += cost;
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
    const playerBaseDamage = player.strength + weaponDamage;

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
            // These are single-target, 2-3 tile range spells.
            const damageStat = (spellId === 'siphonLife') ? player.willpower : player.wits;
            const spellDamage = spellData.baseDamage + (damageStat * spellLevel);
            let logMsg = (spellId === 'magicBolt') ? "You hurl a bolt of energy!" : "You cast Siphon Life!";
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

    if (!quest || !playerQuest || playerQuest.kills < quest.needed) {
        logMessage("Quest is not ready to turn in.");
        return;
    }
    
    // --- Give Rewards ---
    logMessage(`Quest Complete! You gained ${quest.reward.xp} XP and ${quest.reward.coins} Gold!`);
    grantXp(quest.reward.xp);
    gameState.player.coins += quest.reward.coins;

    // --- Mark as Completed ---
    playerQuest.status = 'completed';
    
    playerRef.update({
        quests: gameState.player.quests,
        coins: gameState.player.coins
    });

    renderBountyBoard(); // Re-render the modal
    renderStats(); // Update coins display
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
            slot: itemTemplate.slot || null
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
        damage: item.damage,
        slot: item.slot,
        defense: item.defense
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
    const spellData = SPELL_DATA[spellId]; // Get data from our new constant
    
    // --- FIX: spellLevel is now defined up here, but *after* the spellData check ---
    if (!spellData) {
        logMessage("You don't know how to cast that. (No spell data found)");
        return;
    }
    
    const spellLevel = player.spellbook[spellId] || 0; // Get the player's level for this spell

    if (spellLevel === 0) {
        logMessage("You don't know that spell.");
        return;
    }

    // --- 1. Check Resource Cost ---
    const cost = spellData.cost;
    const costType = spellData.costType; // 'mana' or 'psyche'

    if (player[costType] < cost) {
        logMessage(`You don't have enough ${costType} to cast that.`);
        return; // Do not close modal, do not end turn
    }

    // --- 2. Handle Targeting ---
    if (spellData.target === 'aimed') {
        // --- Aimed Spells (e.g., Magic Bolt) ---
        // Don't deduct cost yet, just enter aiming mode.
        gameState.isAiming = true;
        gameState.abilityToAim = spellId; // Store the spellId (e.g., "magicBolt")
        spellModal.classList.add('hidden');
        logMessage(`${spellData.name}: Press an arrow key or WASD to fire. (Esc) to cancel.`);
        return; // We don't end the turn until they fire

    } else if (spellData.target === 'self') {
        // --- Self-Cast Spells (e.g., Heal, Clarity) ---
        // Cast immediately.
        player[costType] -= cost; // Deduct the resource cost
        let spellCastSuccessfully = false;

        // --- 3. Execute Spell Effect ---
        // --- FIX: spellLevel is now available to all cases ---
        switch (spellId) {
            case 'lesserHeal':
                const healAmount = spellData.baseHeal + (player.wits * spellLevel); // Use spell level!
                const oldHealth = player.health;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                const healedFor = player.health - oldHealth;

                if (healedFor > 0) {
                    logMessage(`You cast Lesser Heal and recover ${healedFor} health.`);
                    triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
                } else {
                    logMessage("You cast Lesser Heal, but you're already at full health.");
                }
                playerRef.update({ health: player.health });
                spellCastSuccessfully = true;
                break;

            case 'arcaneShield':
                if (player.shieldTurns > 0) {
                    logMessage("You already have an active shield!");
                    spellCastSuccessfully = false; // Don't cast
                    // We'll refund the cost since this was a mistake
                    player[costType] += cost;
                    break; // Exit the switch
                }
                
                // const spellLevel = player.spellbook[spellId] || 1; // <-- This redundant line is removed
                const shieldAmount = spellData.baseShield + (player.wits * spellLevel);
                player.shieldValue = shieldAmount;
                player.shieldTurns = spellData.duration;

                logMessage(`You conjure an Arcane Shield, absorbing ${shieldAmount} damage!`);
                triggerStatAnimation(statDisplays.health, 'stat-pulse-blue'); // Blue for a magic shield
                
                playerRef.update({ 
                    shieldValue: player.shieldValue,
                    shieldTurns: player.shieldTurns
                });
                spellCastSuccessfully = true;
                break;

            case 'clarity':
                if (gameState.mapMode !== 'dungeon') {
                    logMessage("You can only feel for secret walls in caves.");
                    // We already spent the psyche, but we'll end the turn.
                    spellCastSuccessfully = true;
                    break;
                }

                const map = chunkManager.caveMaps[gameState.currentCaveId];
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                const secretWallTile = theme.secretWall;
                let foundWall = false;

                // Check all 8 adjacent tiles (this logic is unchanged)
                for (let y = -1; y <= 1; y++) {
                    for (let x = -1; x <= 1; x++) {
                        if (x === 0 && y === 0) continue;
                        const checkX = player.x + x;
                        const checkY = player.y + y;

                        if (map[checkY] && map[checkY][checkX] === secretWallTile) {
                            map[checkY][checkX] = theme.floor; // Reveal the wall!
                            foundWall = true;
                        }
                    }
                }

                if (foundWall) {
                    logMessage("You focus your mind... and a passage is revealed!");
                    render(); // Re-render to show the new passage
                } else {
                    logMessage("You focus, but find no hidden passages nearby.");
                }
                triggerStatAnimation(statDisplays.psyche, 'stat-pulse-purple');
                spellCastSuccessfully = true;
                break;
        }

        // --- 4. Finalize Self-Cast Turn ---
        if (spellCastSuccessfully) {
            playerRef.update({ [costType]: player[costType] }); // Save the new mana/psyche
            spellModal.classList.add('hidden');
            endPlayerTurn();
            renderStats();
        } else {
            // Refund the cost if the spell failed for some reason
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
                
                // Apply any remaining damage to health
                if (damageToApply > 0) {
                    player.health -= damageToApply;
                }
                // --- END NEW SHIELD LOGIC ---
            }
            // --- END LUCK DODGE CHECK ---
            
            // --- This is the fix for the stray '}' bug ---
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
            itemDiv.className = 'inventory-slot p-2 rounded-md';
            itemDiv.title = item.name;
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

    // Calculate total damage
    const baseDamage = player.strength; // Strength is your base damage
    const weaponDamage = weapon.damage || 0;
    const totalDamage = baseDamage + weaponDamage;

    // Update the display
    equippedWeaponDisplay.textContent = `Weapon: ${weapon.name} (+${weaponDamage})`;
    // We'll update the strength display to show the total
    statDisplays.strength.textContent = `Strength: ${player.strength} (Dmg: ${totalDamage})`;

    // --- ARMOR & DEFENSE ---
    const armor = player.equipment.armor || { name: 'Simple T tunic', defense: 0 };

    // Calculate total defense
    // --- Dexterity adds 1 base def every 5 points ---
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
    // Use innerHTML to render the new span
    // --- MODIFIED: Show Base Defense in the total ---
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
                        fgChar = '"';
                        fgColor = '#14532d';
                        break;
                    case '.':
                        bgColor = '#22c55e';
                        fgChar = '.';
                        fgColor = '#16a34a';
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

    // 1. Draw the outline
    ctx.strokeStyle = '#000000'; // A solid black outline
    ctx.lineWidth = 2; // How thick the outline is
    ctx.strokeText(gameState.player.character, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);

    // 2. Fill the character with the player color
    ctx.fillStyle = playerColor;
    ctx.fillText(gameState.player.character, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);

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
        theme = {
            floor: '.'
        };
    }

    if (!map) return null;

    // Track nearest enemy direction ---
    let nearestEnemyDir = null;
    let minDist = Infinity;
    const HEARING_DISTANCE_SQ = 15 * 15; // "Hearing" range

    const halfViewW = Math.floor(VIEWPORT_WIDTH / 2); // (This is no longer used, but fine to keep)
    const halfViewH = Math.floor(VIEWPORT_HEIGHT / 2); // (This is no longer used)

    // --- NEW: Chance for an enemy to chase you ---
    const CHASE_CHANCE = 0.5; // 50% chance to chase

    // Loop through a copy of the array so we can modify it
    const enemiesToMove = [...gameState.instancedEnemies];

    enemiesToMove.forEach(enemy => {
        // 50% chance to move (upped from 25%)
        if (Math.random() < 0.50) {

            let dirX, dirY;

            // --- NEW CHASE LOGIC ---
            if (Math.random() < CHASE_CHANCE) {
                // CHASE: Move directly towards the player
                dirX = Math.sign(gameState.player.x - enemy.x);
                dirY = Math.sign(gameState.player.y - enemy.y);
            } else {
                // WANDER: Move randomly
                dirX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                dirY = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            }
            // --- END NEW LOGIC ---

            if (dirX === 0 && dirY === 0) {
                return; // No movement
            }

            const newX = enemy.x + dirX;
            const newY = enemy.y + dirY;

            const targetTile = (map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';

            // Is the target tile a floor?
            if (targetTile === theme.floor) {
                // It's a valid move!
                map[enemy.y][enemy.x] = theme.floor;
                map[newY][newX] = enemy.tile;
                enemy.x = newX;
                enemy.y = newY;

                const distSq = Math.pow(enemy.x - gameState.player.x, 2) + Math.pow(enemy.y - gameState.player.y, 2);
                if (distSq < minDist && distSq < HEARING_DISTANCE_SQ) {
                    minDist = distSq;
                    const dirX = Math.sign(enemy.x - gameState.player.x);
                    const dirY = Math.sign(enemy.y - gameState.player.y);
                    nearestEnemyDir = { x: dirX, y: dirY };
                }

                // Check if this enemy is on-screen
                const distY = Math.abs(enemy.y - gameState.player.y);
                const distX = Math.abs(enemy.x - gameState.player.x);
                if (distX <= halfViewW && distY <= halfViewH) {
                 
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
        } else {
            // Fail. Give vague message.
            logMessage("You hear a shuffle nearby...");
        }
    }
}

function endPlayerTurn() {
    gameState.playerTurnCount++; // Increment the player's turn

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
                defenseBonusTurns: gameState.player.defenseBonusTurns
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
                shieldTurns: gameState.player.shieldTurns
            });
        }
        renderStats(); // Update UI (to show new turn count or remove shield)
    }

    // --- MODIFIED BLOCK ---
    if (gameState.playerTurnCount % 2 === 0) {
        // Call our new async wrapper function.
        // We don't 'await' it; just let it run in the background.
        runSharedAiTurns();
    }
    // --- END MODIFIED BLOCK ---

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

            } else if (itemToUse.type === 'weapon') {
                // --- 1. EQUIP WEAPON (This is the missing logic) ---
                const oldWeapon = gameState.player.equipment.weapon;

                // Equip the new item
                gameState.player.equipment.weapon = itemToUse;
                gameState.player.inventory.splice(itemIndex, 1);

                // Add the old weapon back to inventory (if it's not Fists)
                if (oldWeapon && oldWeapon.name !== 'Fists') {
                    const oldWeaponItem = {
                        name: oldWeapon.name,
                        type: 'weapon',
                        quantity: 1,
                        tile: oldWeapon.tile || '/', // Use default stick tile if missing
                        damage: oldWeapon.damage,
                        slot: oldWeapon.slot
                    };
                    gameState.player.inventory.push(oldWeaponItem);
                }

                logMessage(`You equip the ${itemToUse.name}.`);
                itemUsed = true;

            } else if (itemToUse.type === 'armor') {
                // --- 2. EQUIP ARMOR (New Logic) ---
                const oldArmor = gameState.player.equipment.armor;

                // Equip the new item
                gameState.player.equipment.armor = itemToUse;
                gameState.player.inventory.splice(itemIndex, 1);

                // Add the old armor back to inventory (if it's not Simple Tunic)
                if (oldArmor && oldArmor.name !== 'Simple Tunic') {
                    const oldArmorItem = {
                        name: oldArmor.name,
                        type: 'armor',
                        quantity: 1,
                        tile: oldArmor.tile || '%',
                        defense: oldArmor.defense,
                        slot: oldArmor.slot
                    };
                    gameState.player.inventory.push(oldArmorItem);
                }

                logMessage(`You equip the ${itemToUse.name}.`);
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

            } else {
                logMessage(`You can't use '${itemToUse.name}' right now.`);
            }
            // --- END BRANCHING LOGIC ---

            if (itemUsed) {
                const inventoryToSave = gameState.player.inventory.map(item => ({
                    name: item.name,
                    type: item.type,
                    quantity: item.quantity,
                    tile: item.tile,
                    damage: item.damage,
                    slot: item.slot,
                    defense: item.defense // <-- Add defense
                }));

                playerRef.update({
                    inventory: inventoryToSave,
                    equipment: gameState.player.equipment,
                    spellbook: gameState.player.spellbook
                });

                syncPlayerState();
                endPlayerTurn();
                renderInventory();
                renderEquipment();
            }

            closeInventoryModal();
            return;
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

    const obsoleteTiles = ['C', '<', '!', 'E', 'D', 'W', 'P', '&', '>'];
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
                    const playerDamage = Math.max(1, (gameState.player.strength + weaponDamage) - enemy.defense);

                    enemy.health -= playerDamage;
                    logMessage(`You attack the ${enemy.name} for ${playerDamage} damage!`);

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
                        const buffDefense = gameState.player.defenseBonus || 0;
                        const playerDefense = armorDefense + buffDefense;
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
                const playerDamage = Math.max(1, (gameState.player.strength + weaponDamage) - (enemyData.defense || 0));

                // Pass the calculated damage to the function
                await handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage);
                return; // Stop the player's move
            }
        }

        const moveCost = TERRAIN_COST[newTile] ?? 0;
        if (moveCost === Infinity) {

            // --- NEW SECRET CAVE LOGIC ---
            // Check if the player is bumping into a Mountain tile
            if (newTile === '^' && gameState.mapMode === 'overworld') {
                const tileId = `${newX},${-newY}`;
                const seed = stringToSeed(WORLD_SEED + ':' + tileId);
                const random = Alea(seed);

                // Give it a 1 in 20 (5%) chance of being a secret entrance
                // This check is seeded, so it's the same for all players, always.
                if (random() < 0.05) {
                    logMessage("You push against the rock... and it gives way! You've found a hidden passage! +50 XP");
                    grantXp(50); // Extra XP for finding a secret

                    // 1. Permanently change this tile to a real entrance for everyone
                    chunkManager.setWorldTile(newX, newY, '⛰');

                    // 2. Trigger the "enter cave" logic
                    // (This is copied from the 'dungeon_entrance' case below)
                    gameState.mapMode = 'dungeon';
                    gameState.currentCaveId = `cave_${newX}_${newY}`; // Use the standard ID
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };

                    const caveMap = chunkManager.generateCave(gameState.currentCaveId);
                    gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];

                    // Find the spawn point '>'
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
            // --- END SECRET CAVE LOGIC ---

            logMessage("That way is blocked."); // Default "bump into wall" message
            return; // Stop here if impassable
        }

        // 3. If no collision, check for special tiles (entrances, lore, etc.)
        const tileData = TILE_DATA[newTile];
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
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const messageIndex = Math.floor(random() * LORE_STONE_MESSAGES.length);
                const message = LORE_STONE_MESSAGES[messageIndex];
                loreTitle.textContent = "A Faded Rune Stone";
                loreContent.textContent = `The stone hums with a faint energy. You can just make out the words:\n\n"...${message}..."`;
                loreModal.classList.remove('hidden');
                return;
            }

            if (newTile === 'N') {
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You met a new villager. +5 XP");
                    grantXp(5);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const npcDialogues = [
                    "Be careful in those caves. I've heard strange noises coming from them.",
                    "It's a tough world. Glad I'm just here, minding my own business.",
                    "Looking for the castle? It's said to be cursed, you know.",
                    "If you find any gold, you should visit a shop. I hear there's one... somewhere."
                ];
                const dialogue = npcDialogues[Math.floor(random() * npcDialogues.length)];

                loreTitle.textContent = "Villager";
                loreContent.textContent = `An old villager looks up as you approach.\n\n"${dialogue}"`;
                loreModal.classList.remove('hidden');
                return;
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
                    "Watch yourself near the battlements. It's a long way down."
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
                // --- NEW CASE ---
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
                // --- END NEW CASE ---

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
                            slot: itemData.slot
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
                            slot: itemData.slot
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up ${itemData.name}.`);
                        inventoryWasUpdated = true;
                        clearLootTile(); // <-- FIXED
                    } else {
                        logMessage(`You see ${itemData.name}, but your inventory is full!`);
                        return; // <-- Cancel the move!
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
            tile: item.tile
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
                        tile: item.tile
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
                        } else if (templateItem.type === 'armor') { // <-- ADD THIS
                            item.defense = templateItem.defense;
                            item.slot = templateItem.slot;
                        }
                    }
                });
                gameState.player.inventory = playerData.inventory;
                renderInventory();
            }

            // --- Update Equipment ---
            if (playerData.equipment) {
                // --- MODIFICATION ---
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
