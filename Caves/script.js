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
    '📖': {
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
    'b': {
        type: 'enemy'
    },
    'w': {
        type: 'enemy'
    },
};

const CASTLE_LAYOUTS = {
    COURTYARD: {
        spawn: { x: 37, y: 32 }, // Your original spawn point
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
        spawn: { x: 10, y: 18 }, // New spawn point for this map
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
            '▓.........▓....$....▓',
            '▓.........▓.........▓',
            '▓.........▓...📖.....▓', // Put a journal here
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
        spawn: { x: 4, y: 38 }, // Spawns near the gate
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
            '▓...▓...B...▓...▓...📖...▓...▓.......▓...▓.......▓...▓...$.....▓...▓...$.....▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓.......▓...▓',
            '▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓▓▓▓▓▓▓▓▓...▓',
            '▓...............................................................................▓',
            '▓...............................................................................▓',
            '▓▓▓▓▓.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
            '▓....X..........................................................................▓', // Exit is here
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓T▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...▓',
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

const SHOP_INVENTORY = [
    { 
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

const ENEMY_DATA = {
    'g': {
        name: 'Goblin',
        maxHealth: 5,
        attack: 2,
        defense: 0,
        xp: 10,
        loot: '$' // Goblins drop gold
    },
    's': {
        name: 'Skeleton',
        maxHealth: 8,
        attack: 3,
        defense: 1,
        xp: 15,
        loot: '+' // Skeletons drop healing potions
    },
    'b': {
        name: 'Bandit',
        maxHealth: 10,
        attack: 3,
        defense: 1,
        xp: 20,
        loot: '$' // Bandits drop gold
    },
    'w': {
        name: 'Wolf',
        maxHealth: 6,
        attack: 4,
        defense: 0,
        xp: 15,
        loot: '+' // Wolves can drop potions
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
        decorations: ['+', '$'] // Only healing and gold
    },

    CRYSTAL: {
        name: 'A Crystalline Tunnel',
        wall: '▒', // Use the 'ice' wall, but colors will make it different
        secretWall: '▓',
        floor: '.',
        colors: {
            wall: '#67e8f9', // Bright Cyan
            floor: '#22d3ee'  // Darker Cyan
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
            floor: '#16a34a'  // Bright Green
        },
        decorations: ['+', 'S', 'o'] // Health, Stamina, Mana
    }
};

const TILE_SIZE = 12;
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

const coreStatsPanel = document.getElementById('coreStatsPanel');

canvas.width = VIEWPORT_WIDTH * TILE_SIZE;
canvas.height = VIEWPORT_HEIGHT * TILE_SIZE;

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
        inventory: [],

        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        statPoints: 0,
        foundLore: [] // Used to track lore/journals for XP
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

    '$': {
        name: 'Gold Coin',
        type: 'instant',
        effect: (state) => {
            if (Math.random() < 0.05) { // 5% chance of being a trap
                state.player.health -= DAMAGE_AMOUNT;
                triggerStatFlash(statDisplays.health, false); // Flash red
                logMessage(`It was a trap! Lost ${DAMAGE_AMOUNT} health!`);
            } else { // 95% chance of being a reward
                const amount = Math.floor(Math.random() * 10) + 1; // 1 to 10 coins
                state.player.coins += amount;
                triggerStatFlash(statDisplays.coins, true); // Flash green
                logMessage(`You found ${amount} gold coins!`);
            }
        }
    },
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

        // 3. Place decorations based on the theme
        for (let i = 0; i < 15; i++) {
            const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
            const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;
            if (map[randY][randX] === theme.floor) {
                map[randY][randX] = theme.decorations[Math.floor(random() * theme.decorations.length)];
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
                        
                        if (map[y-1][x] === theme.wall) wallCount++; else floorDir = 0;
                        if (map[y+1][x] === theme.wall) wallCount++; else floorDir = 1;
                        if (map[y][x-1] === theme.wall) wallCount++; else floorDir = 2;
                        if (map[y][x+1] === theme.wall) wallCount++; else floorDir = 3;

                        // If it's a dead end and we roll the dice (5% chance)
                        if (wallCount === 3 && random() > 0.95) { 
                            
                            // Find the wall opposite the entrance and carve
                            // We also check that there is solid wall 2-tiles away to carve into
                            if (floorDir === 0 && map[y+2][x] === theme.wall) { // Entrance North, carve South
                                map[y+1][x] = secretWallTile;
                                map[y+2][x] = '$'; // Place treasure right behind it
                            } else if (floorDir === 1 && map[y-2][x] === theme.wall) { // Entrance South, carve North
                                map[y-1][x] = secretWallTile;
                                map[y-2][x] = '$';
                            } else if (floorDir === 2 && map[y][x+2] === theme.wall) { // Entrance West, carve East
                                map[y][x+1] = secretWallTile;
                                map[y][x+2] = '$';
                            } else if (floorDir === 3 && map[y][x-2] === theme.wall) { // Entrance East, carve West
                                map[y][x-1] = secretWallTile;
                                map[y][x-2] = '$';
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

generateCastle(castleId) {
        if (this.castleMaps[castleId]) return this.castleMaps[castleId];
        
        // --- MODIFICATION START ---
        
        // 1. Use the castleId to pick a layout
        const randomLayout = Alea(stringToSeed(castleId + ':layout'));
        const layoutKeys = Object.keys(CASTLE_LAYOUTS);
        const chosenLayoutKey = layoutKeys[Math.floor(randomLayout() * layoutKeys.length)];
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
            }
            else if (map[y][x] === '.') {
                const neighbors = [map[y - 1][x], map[y + 1][x], map[y][x - 1], map[y][x + 1]];
                const isNextToWall = neighbors.includes('▓');
                if (isNextToWall && random() > 0.85) {
                    map[y][x] = '▒';
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

                const featureRoll = Math.random();
                if (tile === '.' && featureRoll < 0.0003) { // Spawn safe features
                    let features = Object.keys(TILE_DATA);
                    features = features.filter(f => TILE_DATA[f].type !== 'dungeon_exit' && 
                                                    TILE_DATA[f].type !== 'castle_exit' &&
                                                    TILE_DATA[f].type !== 'enemy'); // <-- Don't spawn enemies here
                    
                    const featureTile = features[Math.floor(Math.random() * features.length)];

                    if (TILE_DATA[featureTile].type === 'dungeon_entrance' || TILE_DATA[featureTile].type === 'castle_entrance') {
                        this.setWorldTile(worldX, worldY, featureTile);
                        chunkData[y][x] = featureTile;
                    } else {
                        chunkData[y][x] = featureTile;
                    }
                } else {
                    // No safe feature spawned. Check for hostile spawn.
                    const hostileRoll = Math.random();
                    
                    // Wolves spawn in forests (0.02% chance)
                    if (tile === 'F' && hostileRoll < 0.0002) { 
                        chunkData[y][x] = 'w';
                    } 
                    // Wolves (0.01%) and Bandits (0.01%) spawn on plains
                    else if (tile === '.' && hostileRoll < 0.0002) { 
                        if (hostileRoll < 0.0001) {
                            chunkData[y][x] = 'w'; // 1% chance
                        } else {
                            chunkData[y][x] = 'b'; // 1% chance
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
    instancedEnemies: [],
    worldEnemies: {},
    isDroppingItem: false,
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
                const percent = (value / max)* 100;

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
                element.textContent = `${label}: ${value}`;
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

        } else {
            // This handles stats that don't have derived effects yet (like Strength, Luck, etc.)
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
    playerRef.update({ inventory: player.inventory });

    // 7. Exit drop mode
    gameState.isDroppingItem = false;
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
    const shopItem = SHOP_INVENTORY.find(item => item.name === itemName);
    const itemTemplate = ITEM_DATA[Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName)];

    if (!shopItem || !itemTemplate) {
        logMessage("Error: Item not found in shop.");
        return;
    }

    // 1. Check if player has enough gold
    if (player.coins < shopItem.price) {
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
    player.coins -= shopItem.price;
    logMessage(`You bought a ${itemName} for ${shopItem.price} gold.`);

    if (existingStack) {
        existingStack.quantity++;
    } else {
        player.inventory.push({
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: 1,
            tile: itemTemplate.tile || '?' // Find the tile from ITEM_DATA
        });
    }

    // 4. Update database and UI
    playerRef.update({ 
        coins: player.coins,
        inventory: player.inventory
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
    const shopItem = SHOP_INVENTORY.find(item => item.name === itemToSell.name);
    const basePrice = shopItem ? shopItem.price : 2; // Sell unlisted items for 2 gold
    
    const sellPrice = Math.floor(basePrice * SELL_MODIFIER);

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
    playerRef.update({ 
        coins: player.coins,
        inventory: player.inventory
    });
    renderShop();
    renderInventory();
    renderStats();
}

function renderShop() {
    // 1. Clear old lists
    shopBuyList.innerHTML = '';
    shopSellList.innerHTML = '';

    // 2. Update player's gold
    shopPlayerCoins.textContent = `Your Gold: ${gameState.player.coins}`;

    // 3. Populate "Buy" list
    SHOP_INVENTORY.forEach(item => {
        const itemTemplate = ITEM_DATA[Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === item.name)];
        const li = document.createElement('li');
        li.className = 'shop-item';
        li.innerHTML = `
            <div>
                <span class="shop-item-name">${item.name} (${itemTemplate.tile})</span>
                <span class="shop-item-details">Price: ${item.price}g</span>
            </div>
            <div class="shop-item-actions">
                <button data-buy-item="${item.name}">Buy</button>
            </div>
        `;
        // Disable buy button if player can't afford it
        if (gameState.player.coins < item.price) {
            li.querySelector('button').disabled = true;
        }
        shopBuyList.appendChild(li);
    });

    // 4. Populate "Sell" list
    if (gameState.player.inventory.length === 0) {
        shopSellList.innerHTML = '<li class="shop-item-details italic">Your inventory is empty.</li>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const shopItem = SHOP_INVENTORY.find(sItem => sItem.name === item.name);
            const basePrice = shopItem ? shopItem.price : 2; // Default sell price if not in shop
            const sellPrice = Math.floor(basePrice * SELL_MODIFIER);

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

const renderInventory = () => {
    inventoryList.innerHTML = '';
    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryList.innerHTML = '<span class="muted-text italic px-2">Inventory is empty.</span>';
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
            inventoryList.appendChild(itemDiv);
        });
    }
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
                        bgColor = '#596643'; // Murky green-brown
                        fgChar = ',';
                        fgColor = '#4b5535'; // Slightly darker texture color
                        break;
                    case '^':
                        bgColor = '#78350f'; // Brown background
                        fgChar = '^'; // The mountain character
                        fgColor = '#52230a'; // A darker brown for texture
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

            if (fgChar) {
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
            email: auth.currentUser.email // <-- ADD THIS LINE
        };
        onlinePlayerRef.set(stateToSync);
    }
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
}

function updateRegionDisplay() {
    if (gameState.mapMode === 'overworld') {
        const currentRegionX = Math.floor(gameState.player.x / REGION_SIZE);
        const currentRegionY = Math.floor(gameState.player.y / REGION_SIZE);
        const regionId = `${currentRegionX},${currentRegionY}`;

        const regionName = getRegionName(currentRegionX, currentRegionY);
        regionDisplay.textContent = regionName;

        if (!gameState.discoveredRegions.has(regionId)) {
            logMessage(`You have entered ${regionName}.`);
            gameState.discoveredRegions.add(regionId);

            playerRef.update({ discoveredRegions: Array.from(gameState.discoveredRegions) });

            grantXp(50);
        }
    } else if (gameState.mapMode === 'dungeon') {
        // --- MODIFIED ---
        regionDisplay.textContent = getCaveName(gameState.currentCaveId);
    } else if (gameState.mapMode === 'castle') {
        // --- MODIFIED ---
        regionDisplay.textContent = getCastleName(gameState.currentCastleId);
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
        // (We already handle 'isDroppingItem' and 'chatInput' in their own
        // 'Escape' listeners, so this won't interfere with them)
    }

    if (gameState.isDroppingItem) {
        handleItemDrop(event);
        return; // Stop further processing
    }

    const keyNum = parseInt(event.key);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        const itemIndex = keyNum - 1;
        const itemToUse = gameState.player.inventory[itemIndex];
        let itemUsed = false;
        if (itemToUse && itemToUse.type === 'consumable') {
            itemToUse.effect(gameState);
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        } else if (itemToUse) logMessage(`Cannot use '${itemToUse.name}'.`);
        else logMessage(`No item in slot ${keyNum}.`);
        if (itemUsed) {
            // Create a "clean" version of the inventory for Firestore, without functions.
            const inventoryToSave = gameState.player.inventory.map(item => ({
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                tile: item.tile
            }));

            playerRef.update({
                inventory: inventoryToSave
            });
            syncPlayerState();
            renderStats();
            renderInventory();
        }
        event.preventDefault();
        return;
    }

    if (event.key === 'd' || event.key === 'D') {
        if (gameState.player.inventory.length === 0) {
            logMessage("Your inventory is empty.");
            return;
        }
        logMessage("Drop which item? (1-9) or (Esc) to cancel.");
        gameState.isDroppingItem = true;
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
            if (gameState.player.stamina < gameState.player.maxStamina) {
                gameState.player.stamina++;
                triggerStatFlash(statDisplays.stamina, true); // Flash green for gain
                logMessage("You rest for a moment, recovering 1 stamina.");
            } else logMessage("You are already at full stamina.");
            playerRef.update({
                stamina: gameState.player.stamina
            });
            renderStats();
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

        // --- UNIFIED COMBAT CHECK (MOVED TO CORRECT LOCATION) ---
        const enemyData = ENEMY_DATA[newTile];
        if (enemyData) { // This tile is an enemy: 'g', 's', 'b', or 'w'
            
            let enemy; // This will hold the "live" enemy instance
            let enemyId;
            let isInstanceEnemy = false;

            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                // 1. INSTANCE: Find the enemy in the instanced list.
                enemy = gameState.instancedEnemies.find(e => e.x === newX && e.y === newY);
                if (enemy) {
                    enemyId = enemy.id;
                    isInstanceEnemy = true;
                }
            } else if (gameState.mapMode === 'overworld') {
                // 2. OVERWORLD: Check if this enemy is in our session cache.
                enemyId = `overworld:${newX},${-newY}`; // Unique overworld ID
                enemy = gameState.worldEnemies[enemyId];

                if (!enemy) {
                    // 3. Not in cache. Create a new "live" instance for this session.
                    enemy = {
                        // We only need to cache its health and stats
                        name: enemyData.name,
                        health: enemyData.maxHealth,
                        maxHealth: enemyData.maxHealth,
                        attack: enemyData.attack,
                        defense: enemyData.defense,
                        xp: enemyData.xp,
                        loot: enemyData.loot
                    };
                    // 4. Add it to the session cache.
                    gameState.worldEnemies[enemyId] = enemy;
                }
            }

            if (enemy) {
                // --- PLAYER ATTACKS ENEMY ---
                const playerDamage = Math.max(1, gameState.player.strength - enemy.defense);
                enemy.health -= playerDamage;
                logMessage(`You attack the ${enemy.name} for ${playerDamage} damage!`);

                if (enemy.health <= 0) {
                    // --- ENEMY IS DEFEATED ---
                    logMessage(`You defeated the ${enemy.name}!`);
                    grantXp(enemy.xp);
                    
                    // Remove enemy from the map and its cache
                    if (isInstanceEnemy) {
                        // Remove from instance list
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemyId);
                        // Replace tile on instance map
                        if (gameState.mapMode === 'dungeon') {
                            chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = enemy.loot;
                        } else if (gameState.mapMode === 'castle') {
                            // Ready for when we add castle enemies
                        }
                    } else {
                        // Remove from world cache
                        delete gameState.worldEnemies[enemyId];
                        // PERMANENTLY kill the enemy by replacing its tile
                        chunkManager.setWorldTile(newX, newY, enemy.loot);
                    }
                } else {
                    // --- ENEMY SURVIVES AND ATTACKS ---
                    const enemyDamage = Math.max(0, enemy.attack); // (Add player defense later)
                    gameState.player.health -= enemyDamage;
                    triggerStatFlash(statDisplays.health, false); // Flash health red
                    logMessage(`The ${enemy.name} hits you for ${enemyDamage} damage!`);
                    
                    // Check for player death
                    if (gameState.player.health <= 0) {
                        gameState.player.health = 0;
                        logMessage("You have perished!");
                        syncPlayerState();
                        document.getElementById('finalLevelDisplay').textContent = `Level: ${gameState.player.level}`;
                        document.getElementById('finalCoinsDisplay').textContent = `Gold: ${gameState.player.coins}`;
                        gameOverModal.classList.remove('hidden');
                    }
                }
                
                // Update stats and re-render
                renderStats();
                render();
                return; // Stop the player's move, ending the turn
                
            } else if (gameState.mapMode === 'dungeon') {
                // This means it was a dungeon enemy ('g'/'s') but not in the active list
                // It was killed this session. Treat it as a floor.
                logMessage(`You see the corpse of a ${enemyData.name}.`);
            }
        
        }
        if (gameState.mapMode === 'castle' && (newTile === '▓' || newTile === '▒' || newTile === ' ')) {
            logMessage("You bump into the castle wall.");
            return; // Stop here if it's a wall or rubble
        }
        const moveCost = TERRAIN_COST[newTile] ?? 0;
        if (moveCost === Infinity) {
            logMessage("That way is blocked.");
            return; // Stop here if impassable
        }

        // 3. If no collision, check for special tiles (entrances, lore, etc.)
        const tileData = TILE_DATA[newTile];
        if (tileData) {
            const tileId = `${newX},${-newY}`; // Get tileId for XP checks

            // Handle all lore/journal/NPC types
            if (tileData.type === 'journal') {
                if (!gameState.foundLore.has(tileId)) {
                    grantXp(25);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                loreTitle.textContent = tileData.title;
                loreContent.textContent = tileData.content;
                loreModal.classList.remove('hidden');
                return; // Stop processing
            }

            if (newTile === 'B') {
                if (!gameState.foundLore.has(tileId)) {
                    grantXp(15);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                loreTitle.textContent = "Bounty Board";
                loreContent.textContent = "A weathered board. Most notices are unreadable, but a few stand out:\n\n- REWARD: 50 GOLD for clearing the 'Glacial Cavern' to the north.\n\n- LOST: My favorite pet rock, 'Rocky'. Last seen near the old castle.\n\n- BEWARE: A dark presence stirs in the west. Travel with caution.";
                loreModal.classList.remove('hidden');
                return; 
            }
            
            if (newTile === '#') {
                if (!gameState.foundLore.has(tileId)) {
                    grantXp(10);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const messageIndex = Math.floor(random() * LORE_STONE_MESSAGES.length);
                const message = LORE_STONE_MESSAGES[messageIndex];
                loreTitle.textContent = "A Faded Rune Stone";
                loreContent.textContent = `The stone hums with a faint energy. You can just make out the words:\n\n"...${message}..."`;
                loreModal.classList.remove('hidden');
                return; // Stop processing
            }

            // --- NEW 'N' (NPC) TILE ---
            if (newTile === 'N') {
                if (!gameState.foundLore.has(tileId)) {
                    grantXp(5); // A little XP for talking to someone new
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
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

            // --- NEW '§' (SHOP) TILE ---
            if (newTile === '§') {
                logMessage("You enter the General Store.");
                renderShop(); // Populate the shop
                shopModal.classList.remove('hidden'); // Show it
                return; // Stop player from moving
            }

            // Handle all other special tiles like entrances/exits
            switch (tileData.type) {
                case 'dungeon_entrance':
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
                case 'castle_entrance':
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
                    // This is for the '☗' tile
                    if (!gameState.foundLore.has(tileId)) {
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

        // 4. If the move is valid, calculate stamina and move the player.
        const staminaDeficit = moveCost - gameState.player.stamina;
        if (moveCost > gameState.player.stamina && gameState.player.health <= staminaDeficit) {
            logMessage("You're too tired, and pushing on would be fatal!");
            return;
        }

        gameState.player.x = newX;
        gameState.player.y = newY;

        if (gameState.player.stamina >= moveCost) gameState.player.stamina -= moveCost;
        else {
            gameState.player.stamina = 0;
            gameState.player.health -= staminaDeficit;
            triggerStatFlash(statDisplays.health, false);
            logMessage(`You push yourself to the limit, costing ${staminaDeficit} health!`);
        }

        // 5. Handle item pickups and final updates
let tileId;
if (gameState.mapMode === 'overworld') {
    tileId = `${newX},${-newY}`;
} else {
    // This creates a unique ID like "cave_120_340:15,-22"
    const mapId = gameState.currentCaveId || gameState.currentCastleId;
    tileId = `${mapId}:${newX},${-newY}`;
}

const itemData = ITEM_DATA[newTile];
if (itemData) {
    // Now this check works for all map modes
    let isTileLooted = gameState.lootedTiles.has(tileId);

            if (isTileLooted) {
                logMessage(`You see where a ${itemData.name} once was...`);
            } else {
                let itemPickedUp = false;
                let tileLooted = true; // Assume we loot it

                if (itemData.type === 'consumable') {
                    const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                    
                    if (existingItem) {
                        // Case 1: Player has this item, so stack it
                        existingItem.quantity++;
                        logMessage(`You picked up a ${itemData.name}.`);
                        itemPickedUp = true;
                    } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        // Case 2: Player has a free slot
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile
                        };
                        gameState.player.inventory.push(itemForDb);
                        logMessage(`You picked up a ${itemData.name}.`);
                        itemPickedUp = true;
                    } else {
                        // Case 3: Inventory is full
                        logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                        tileLooted = false; // Don't loot the tile, leave item
                    }

                    if (itemPickedUp) {
                        playerRef.update({ inventory: gameState.player.inventory });
                    }

                } else {
                    // This handles instant items like '$' (Gold)
                    ITEM_DATA[newTile].effect(gameState);
                }

                if (tileLooted) {
                    // --- MODIFIED: Add to lootedTiles REGARDLESS of map mode ---
                    gameState.lootedTiles.add(tileId);

                    // Now, just change the tile based on the map
                    if (gameState.mapMode === 'overworld') {
                        chunkManager.setWorldTile(newX, newY, '.');
                    } else if (gameState.mapMode === 'dungeon') {
                        const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                        chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = theme.floor;
                    } else if (gameState.mapMode === 'castle') {
                        chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';
                    }
                    // --- END MODIFICATION ---
                }
            }
        } else if (moveCost > 0) {
            triggerStatFlash(statDisplays.stamina, false); // Flash red for stamina cost
            logMessage(`Traversing the terrain costs ${moveCost} stamina.`);
        } else {
            logMessage(`Moved to world coordinate (${newX}, ${-newY}).`);
        }

        updateRegionDisplay();
        syncPlayerState();

        playerRef.update({
            x: gameState.player.x,
            y: gameState.player.y,
            health: gameState.player.health,
            stamina: gameState.player.stamina,
            coins: gameState.player.coins
        });

        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
            logMessage("You have perished!");
            syncPlayerState();

            document.getElementById('finalLevelDisplay').textContent = `Level: ${gameState.player.level}`;
            document.getElementById('finalCoinsDisplay').textContent = `Gold: ${gameState.player.coins}`;

            gameOverModal.classList.remove('hidden');
        }
        renderStats();

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
}

logoutButton.addEventListener('click', () => {
    const finalState = {
        ...gameState.player
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
                    ...gameState.player
                };

                // ADD THIS BLOCK TO CLEAN THE INVENTORY
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

    unsubscribePlayerListener = playerRef.onSnapshot((doc) => {
        if (doc.exists) {
            const playerData = doc.data();
            if (playerData.inventory) {
                playerData.inventory.forEach(item => {
                    const templateItem = Object.values(ITEM_DATA).find(d => d.name === item.name);
                    if (templateItem) item.effect = templateItem.effect;
                });
                gameState.player.inventory = playerData.inventory;
                renderInventory();
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
    renderTime();
    render();
    canvas.style.visibility = 'visible';
    syncPlayerState();
    logMessage(`Logged in as ${user.email}`);
    updateRegionDisplay();

    loadingIndicator.classList.add('hidden');
    initShopListeners();
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
