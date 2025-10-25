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
};

const CAVE_THEMES = {
    ROCK: {
        name: 'A Dark Cave',
        wall: '▓',
        floor: '.',
        colors: {
            wall: '#422006',
            floor: '#a16207'
        },
        decorations: ['+', 'o', '$', '📖']
    },
    ICE: {
        name: 'A Glacial Cavern',
        wall: '▒', // A lighter, "icy" wall
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
        floor: '.', // Use a standard floor tile
        colors: {
            wall: '#450a0a',
            floor: '#ef4444'
        }, // The red color makes it look like lava
        decorations: ['+', '$'] // Only healing and gold
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

const DAYS_OF_WEEK = ["Sunsday", "Moonsday", "Kingsday", "Earthday", "Watersday", "Windsday", "Firesday"];
const MONTHS_OF_YEAR = ["First Seed", "Rains Hand", "Second Seed", "Suns Height", "Last Seed", "Hearthfire", "Frostfall", "Suns Dusk", "Evening Star", "Morning Star", "Suns Dawn", "Deep Winter"];
const DAYS_IN_MONTH = 30;

const NAME_PREFIXES = ["Whispering", "Sunken", "Forgotten", "Broken", "Shrouded", "Glimmering", "Verdant", "Ashen"];
const NAME_MIDDLES = ["Plains", "Forest", "Hills", "Expanse", "Valley", "Marsh", "Reach", "Woods"];
const NAME_SUFFIXES = ["of Sorrow", "of the Ancients", "of Ash", "of the King", "of Renewal", "of Despair"];

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

        map[startPos.y][startPos.x] = '>'; // Place the exit
        this.caveMaps[caveId] = map;
        return map;
    },

    generateCastle(castleId) {
        if (this.castleMaps[castleId]) return this.castleMaps[castleId];
        const baseMap = [
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒.▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓',
            '▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓',
            '▓▒▓...................B....................▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓',
            '▓▒▓........................................▓......▓.▓▓▓▒▓',
            '▓▒▓........................................▓......▓....▓▒▓',
            '▓▒▓........................................▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓',
            '▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓............▓▒▓',
            '▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒.▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓............▓▒▓',
            '▓........................................▓............▓▒▓',
            '▓.▓▓▓▓▓▓▓▓▓......................▓▓▓▓▓▓▓▓▓............▓▒▓',
            '▓.▓......▓▓......................▓......▓............▓▒▓',
            '▓.▓......▓▓......................▓......▓............▓▒▓',
            '▓.▓......▓▓......................▓......▓............▓▒▓',
            '▓.▓▓▓▓▓▓▓▓▓......................▓▓▓▓▓▓▓▓▓............▓▒▓',
            '▓....................................................▓▒▓',

            '▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓',
            '▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...................▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓',
            '▓▒▓....................................................▓▒▓',
            '▓▒▓....................................................▓▒▓',
            '▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓...................▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▓',
            '▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓',
            '▓......................................................▓',
            '▓.............................X........................▓',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        ];
        const map = baseMap.map(row => row.split(''));

        const random = Alea(stringToSeed(castleId));

        // Procedurally add breaches and rubble with smarter rules
        for (let i = 0; i < 50; i++) { // Increased iterations for more detail
            const y = Math.floor(random() * (map.length - 2)) + 1;
            const x = Math.floor(random() * (map[0].length - 2)) + 1;

            // Rule 1: 50% chance to breach an existing wall
            if (map[y][x] === '▓' && random() > 0.5) {
                map[y][x] = '.';
            }
            // Rule 2: Add rubble ONLY to floors that are adjacent to a wall
            else if (map[y][x] === '.') {
                const neighbors = [map[y - 1][x], map[y + 1][x], map[y][x - 1], map[y][x + 1]];
                const isNextToWall = neighbors.includes('▓');

                // 30% chance to add rubble if the rule is met
                if (isNextToWall && random() > 0.7) {
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
                if (tile === '.' && featureRoll < 0.001) {
                    let features = Object.keys(TILE_DATA);
                    features = features.filter(f => TILE_DATA[f].type !== 'dungeon_exit' && TILE_DATA[f].type !== 'castle_exit');
                    features = features.filter(f => f !== 'B' && f !== '📖'); // Also filter out the Journal
                    const featureTile = features[Math.floor(Math.random() * features.length)];

                    if (TILE_DATA[featureTile].type === 'dungeon_entrance' || TILE_DATA[featureTile].type === 'castle_entrance') {
                        this.setWorldTile(worldX, worldY, featureTile);
                        chunkData[y][x] = featureTile;
                    } else {
                        chunkData[y][x] = featureTile;
                    }
                } else {
                    chunkData[y][x] = tile;
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
                element.textContent = `XP: ${value} / ${gameState.player.xpToNextLevel}`;
            } else if (statName === 'statPoints') {
                if (value > 0) {
                    element.textContent = `Stat Points: ${value}`;
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            } else {
                element.textContent = `${label}: ${value}`;
            }
        }
    }
};

function grantXp(amount) {
    const player = gameState.player;
    player.xp += amount;
    logMessage(`You gained ${amount} XP!`);

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
            const healthPercent = (otherPlayer.health || 0) / (otherPlayer.maxHealth || 10);
            const healthBarWidth = TILE_SIZE;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY - 7, healthBarWidth, 5);
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(screenX, screenY - 7, healthBarWidth * healthPercent, 5);
            ctx.fillStyle = 'red';
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
        };
        onlinePlayerRef.set(stateToSync);
    }
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
        regionDisplay.textContent = "A Dark Cave";
    } else if (gameState.mapMode === 'castle') {
        regionDisplay.textContent = "Castle Courtyard";
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
    let startX = gameState.player.x,
        startY = gameState.player.y;
    let newX = startX,
        newY = startY;
    switch (event.key) {
        case 'ArrowUp':
        case 'w': // Add this
        case 'W': // Add this
            newY--;
            break;
        case 'ArrowDown':
        case 's': // Add this
        case 'S': // Add this
            newY++;
            break;
        case 'ArrowLeft':
        case 'a': // Add this
        case 'A': // Add this
            newX--;
            break;
        case 'ArrowRight':
        case 'd': // Add this
        case 'D': // Add this
            newX++;
            break;
        case 'r':
        case 'R':
            if (gameState.player.stamina < gameState.player.maxStamina) {
                gameState.player.stamina++;
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

    // --- PASTE THIS NEW BLOCK IN ITS PLACE ---
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
        if (gameState.mapMode === 'dungeon') {
            const theme = CAVE_THEMES[gameState.currentCaveTheme];
            if (theme && (newTile === theme.wall || newTile === ' ')) {
                logMessage("The wall is solid.");
                return; // Stop here if it's a wall
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
            if (tileData.type === 'journal') {

                const tileId = `${newX},${-newY}`;
                if (!gameState.foundLore.has(tileId)) {
                    grantXp(25);
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }

                loreTitle.textContent = tileData.title;
                loreContent.textContent = tileData.content;
                loreModal.classList.remove('hidden');
                return; // Stop processing after showing lore
            }
            if (newTile === 'B') {
                const tileId = `${newX},${-newY}`;
                
                // Grant XP the first time the player reads it
                if (!gameState.foundLore.has(tileId)) {
                    grantXp(15); // A bit more than lore, less than a journal
                    gameState.foundLore.add(tileId);
                    playerRef.update({ foundLore: Array.from(gameState.foundLore) });
                }

                // Get the DOM elements for the modal
                loreTitle.textContent = "Bounty Board";
                
                // Set the content for the modal
                // (The \n newlines work because of the 'whitespace-pre-wrap' class in your HTML)
                loreContent.textContent = "A weathered board. Most notices are unreadable, but a few stand out:\n\n- REWARD: 50 GOLD for clearing the 'Glacial Cavern' to the north.\n\n- LOST: My favorite pet rock, 'Rocky'. Last seen near the old castle.\n\n- BEWARE: A dark presence stirs in the west. Travel with caution.";
                
                // Show the modal
                loreModal.classList.remove('hidden');
                
                // IMPORTANT: Stop processing so the player doesn't move
                return; 
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
                    const caveMap = chunkManager.generateCave(gameState.currentCaveId); // MOVED UP: Generate the cave first.
                    gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId]; // NOW, get the theme.
                    for (let y = 0; y < caveMap.length; y++) {
                        const x = caveMap[y].indexOf('>');
                        if (x !== -1) {
                            gameState.player.x = x;
                            gameState.player.y = y;
                            break;
                        }
                    }
                    logMessage("You enter the " + (CAVE_THEMES[gameState.currentCaveTheme]?.name || 'cave') + "...");
                    updateRegionDisplay();
                    render();
                    syncPlayerState();
                    return;
                case 'dungeon_exit':
                    gameState.player.x = gameState.overworldExit.x;
                    gameState.player.y = gameState.overworldExit.y;
                    gameState.mapMode = 'overworld';
                    gameState.currentCaveId = null;
                    gameState.overworldExit = null;
                    logMessage("You emerge back into the sunlight.");
                    updateRegionDisplay();
                    render();
                    syncPlayerState();
                    return;
                case 'castle_entrance':
                    gameState.mapMode = 'castle';
                    gameState.currentCastleId = tileData.getCastleId(newX, newY);
                    gameState.overworldExit = {
                        x: gameState.player.x,
                        y: gameState.player.y
                    };
                    const castleMap = chunkManager.generateCastle(gameState.currentCastleId);
                    for (let y = 0; y < castleMap.length; y++) {
                        const x = castleMap[y].indexOf('X');
                        if (x !== -1) {
                            gameState.player.x = x;
                            gameState.player.y = y;
                            break;
                        }
                    }
                    logMessage("You enter the castle courtyard.");
                    updateRegionDisplay();
                    render();
                    syncPlayerState();
                    return;
                case 'castle_exit':
                    gameState.player.x = gameState.overworldExit.x;
                    gameState.player.y = gameState.overworldExit.y;
                    gameState.mapMode = 'overworld';
                    gameState.currentCastleId = null;
                    gameState.overworldExit = null;
                    logMessage("You leave the castle.");
                    updateRegionDisplay();
                    render();
                    syncPlayerState();
                    return;
                case 'lore':
                    const tileId = `${newX},${-newY}`;
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
        const itemData = ITEM_DATA[newTile];
        const tileId = `${newX},${-newY}`;
        if (itemData) {
            if (gameState.lootedTiles.has(tileId)) {
                logMessage(`You see where a ${itemData.name} once was...`);
            } else {
                if (itemData.type === 'consumable') {
                    const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                    if (existingItem) existingItem.quantity++;
                    else {
                        const itemForDb = {
                            name: itemData.name,
                            type: itemData.type,
                            quantity: 1,
                            tile: newTile
                        };
                        gameState.player.inventory.push(itemForDb);
                    }
                    logMessage(`You picked up a ${itemData.name}.`);
                    playerRef.update({
                        inventory: gameState.player.inventory
                    });
                } else ITEM_DATA[newTile].effect(gameState);
                gameState.lootedTiles.add(tileId);
                chunkManager.setWorldTile(newX, newY, '.');
            }
        } else if (moveCost > 0) {
            triggerStatFlash(statDisplays.stamina, false);
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
