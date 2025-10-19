// --- FIREBASE INITIALIZATION ---
 const firebaseConfig = {
    apiKey: "AIzaSyDttMG2NlSVyhCfY2A9-2TOuRxiJwAlESE",
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
    '#': { type: 'lore', message: 'An ancient, weathered stone stands here. The markings are faded.' },
    '_': { type: 'lore', message: 'A hastily made signpost. It reads: "Beware the northern mountains."' },
    '<': { type: 'lore', message: 'A dark cave entrance beckons. You feel a cold draft.' },
};

const TILE_SIZE = 14;
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

canvas.width = VIEWPORT_WIDTH * TILE_SIZE;
canvas.height = VIEWPORT_HEIGHT * TILE_SIZE;

const DAY_CYCLE_STOPS = [
    { time: 0,    color: [10, 10, 40], opacity: 0.3 },
    { time: 350,  color: [20, 20, 80], opacity: 0.35 },
    { time: 390,  color: [255, 150, 80], opacity: 0.2 },
    { time: 430,  color: [240, 255, 255], opacity: 0.0 },
    { time: 1070, color: [240, 255, 255], opacity: 0.0 },
    { time: 1110, color: [255, 150, 80], opacity: 0.2 },
    { time: 1150, color: [20, 20, 80], opacity: 0.35 },
    { time: 1440, color: [10, 10, 40], opacity: 0.3 }
];

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

const advanceTime = () => {
    let time = gameState.time;
    time.minute += TURN_DURATION_MINUTES;
    while (time.minute >= 60) {
        time.minute -= 60;
        time.hour++;
        if (time.hour >= 24) {
            time.hour = 0;
            time.day++;
        }
    }
};

const renderTime = () => {
    const time = gameState.time;
    const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
    const ampm = time.hour < 12 ? 'AM' : 'PM';
    const minutePadded = String(time.minute).padStart(2, '0');
    timeDisplay.textContent = `Day ${time.day}, ${hour12}:${minutePadded} ${ampm}`;
};

function Alea(seed) {
    let s0 = 0, s1 = 0, s2 = 0, c = 1;
    if (seed == null) { seed = +new Date; }
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
        s0 = s1; s1 = s2; s2 = t;
        return (s2 >>> 0) / 0x100000000;
    };
}

const Perlin = {
    p: [],
    init: function(seed) {
        const random = Alea(seed);
        this.p = new Array(512);
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const n = Math.floor((i + 1) * random());
            const t = p[i]; p[i] = p[n]; p[n] = t;
        }
        for (let i=0; i < 256; i++) { this.p[i] = this.p[i + 256] = p[i]; }
    },
    noise: function(x, y, z = 0) {
        const floor = Math.floor;
        const X = floor(x) & 255, Y = floor(y) & 255, Z = floor(z) & 255;
        x -= floor(x); y -= floor(y); z -= floor(z);
        const u = this.fade(x), v = this.fade(y), w = this.fade(z);
        const A = this.p[X]+Y, AA = this.p[A]+Z, AB = this.p[A+1]+Z, B = this.p[X+1]+Y, BA = this.p[B]+Z, BB = this.p[B+1]+Z;
        return this.scale(this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x-1, y, z)), this.lerp(u, this.grad(this.p[AB], x, y-1, z), this.grad(this.p[BB], x-1, y-1, z))), this.lerp(v, this.lerp(u, this.grad(this.p[AA+1], x, y, z-1), this.grad(this.p[BA+1], x-1, y, z-1)), this.lerp(u, this.grad(this.p[AB+1], x, y-1, z-1), this.grad(this.p[BB+1], x-1, y-1, z-1)))));
    },
    fade: t => t * t * t * (t * (t * 6 - 15) + 10),
    lerp: (t, a, b) => a + t * (b - a),
    grad: (hash, x, y, z) => {
        const h = hash & 15;
        const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    },
    scale: n => (1 + n) / 2
};

const TERRAIN_COST = {
    '.': 0, '^': 3, '~': Infinity, 'F': 1, '+': 0, 'o': 0, 'S': 0, 'Y': 0, '$': 0, '!': 0, '?': 0,
    'E': 0, 'D': 0, 'C': 0, 'W': 0, 'P': 0, '&': 0, '>': 0,
    '#': 0, '_': 0, '<': 0,
};

const ITEM_DATA = {
    '+': { name: 'Healing Potion', type: 'consumable', effect: (state) => { state.player.health = Math.min(state.player.maxHealth, state.player.health + HEALING_AMOUNT); logMessage(`Used a Healing Potion. Restored ${HEALING_AMOUNT} health!`); } },
    'o': { name: 'Mana Orb', type: 'consumable', effect: (state) => { state.player.mana = Math.min(state.player.maxMana, state.player.mana + MANA_RESTORE_AMOUNT); logMessage('Used a Mana Orb. Restored mana!'); } },
    'S': { name: 'Stamina Crystal', type: 'consumable', effect: (state) => { state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + STAMINA_RESTORE_AMOUNT); logMessage(`Used a Stamina Crystal. Restored ${STAMINA_RESTORE_AMOUNT} stamina!`); } },
    'Y': { name: 'Psyche Shard', type: 'consumable', effect: (state) => { state.player.psyche = Math.min(state.player.maxPsyche, state.player.psyche + PSYCHE_RESTORE_AMOUNT); logMessage('Used a Psyche Shard. Restored psyche.'); } },
    '$': { name: 'Gold Coin', type: 'instant', effect: (state) => { state.player.health -= DAMAGE_AMOUNT; logMessage(`It was a trap! Lost ${DAMAGE_AMOUNT} health!`); } },
    '!': { name: 'Wit Elixir', type: 'instant', effect: (state) => { state.player.wits += STAT_INCREASE_AMOUNT; logMessage('Wits increased!'); } },
    '?': { name: 'Lucky Charm', type: 'instant', effect: (state) => { state.player.luck += STAT_INCREASE_AMOUNT; logMessage('Luck increased!'); } },
    'E': { name: 'Constitution Stone', type: 'instant', effect: (state) => { state.player.constitution += STAT_INCREASE_AMOUNT; logMessage('Constitution increased!'); } },
    'D': { name: 'Dexterity Token', type: 'instant', effect: (state) => { state.player.dexterity += STAT_INCREASE_AMOUNT; logMessage('Dexterity increased!'); } },
    'C': { name: 'Charisma Emblem', type: 'instant', effect: (state) => { state.player.charisma += STAT_INCREASE_AMOUNT; logMessage('Charisma increased!'); } },
    'W': { name: 'Willpower Shard', type: 'instant', effect: (state) => { state.player.willpower += STAT_INCREASE_AMOUNT; logMessage('Willpower increased!'); } },
    'P': { name: 'Perception Gem', type: 'instant', effect: (state) => { state.player.perception += STAT_INCREASE_AMOUNT; logMessage('Perception increased!'); } },
    '&': { name: 'Endurance Rune', type: 'instant', effect: (state) => { state.player.endurance += STAT_INCREASE_AMOUNT; logMessage('Endurance increased!'); } },
    '>': { name: 'Intuition Crystal', type: 'instant', effect: (state) => { state.player.intuition += STAT_INCREASE_AMOUNT; logMessage('Intuition increased!'); } },
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
    intuition: document.getElementById('intuitionDisplay')
};

const elevationNoise = Object.create(Perlin);
elevationNoise.init(Alea(WORLD_SEED + ':elevation')());
const moistureNoise = Object.create(Perlin);
moistureNoise.init(Alea(WORLD_SEED + ':moisture')());

const chunkManager = {
    CHUNK_SIZE: 16,
    loadedChunks: {},
    worldState: {},

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
        const localX = worldX % this.CHUNK_SIZE;
        const localY = worldY % this.CHUNK_SIZE;
        
        if (!this.worldState[chunkId]) {
            this.worldState[chunkId] = {};
        }
        
        const tileKey = `${localX},${localY}`;
        this.worldState[chunkId][tileKey] = newTile;

        db.collection('worldState').doc(chunkId).set(this.worldState[chunkId], { merge: true });
    },

    generateChunk(chunkX, chunkY) {
        const chunkKey = `${chunkX},${chunkY}`;
        let chunkData = Array.from({ length: this.CHUNK_SIZE }, () => Array(this.CHUNK_SIZE));
        for (let y = 0; y < this.CHUNK_SIZE; y++) {
            for (let x = 0; x < this.CHUNK_SIZE; x++) {
                const worldX = chunkX * this.CHUNK_SIZE + x;
                const worldY = chunkY * this.CHUNK_SIZE + y;
                const elev = elevationNoise.noise(worldX / 70, worldY / 70);
                const moist = moistureNoise.noise(worldX / 50, worldY / 50);
                let tile = '.';
                if (elev < 0.35) tile = '~';
                else if (elev > 0.8) tile = '^';
                else if (moist > 0.55) tile = 'F';
                else tile = '.';
                
                const featureRoll = Math.random();
                if (tile === '.' && featureRoll < 0.005) {
                    const features = Object.keys(TILE_DATA);
                    tile = features[Math.floor(Math.random() * features.length)];
                }

                chunkData[y][x] = tile;
            }
        }
        this.loadedChunks[chunkKey] = chunkData;
    },

    getTile(worldX, worldY) {
        if (worldX < 0 || worldX >= WORLD_WIDTH || worldY < 0 || worldY >= WORLD_HEIGHT) { return ' '; }
        const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
        const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
        const chunkId = `${chunkX},${chunkY}`;
        
        this.listenToChunkState(chunkX, chunkY);

        const localX = worldX % this.CHUNK_SIZE;
        const localY = worldY % this.CHUNK_SIZE;
        const tileKey = `${localX},${localY}`;
        if (this.worldState[chunkId] && this.worldState[chunkId][tileKey] !== undefined) {
            return this.worldState[chunkId][tileKey];
        }

        if (!this.loadedChunks[chunkId]) { this.generateChunk(chunkX, chunkY); }
        const chunk = this.loadedChunks[chunkId];
        return chunk[localY][localX];
    },
};

const gameState = {
    player: {
        x: Math.floor(WORLD_WIDTH / 2), y: Math.floor(WORLD_HEIGHT / 2), character: '@', color: 'blue',
        health: 10, maxHealth: 10, mana: 10, maxMana: 10, stamina: 10, maxStamina: 10, psyche: 10, maxPsyche: 10,
        strength: 1, wits: 1, luck: 1, constitution: 1, dexterity: 1, charisma: 1, willpower: 1, perception: 1, endurance: 1, intuition: 1,
        inventory: []
    },
    messages: [],
    flags: {
        hasSeenForestWarning: false
    },
    time: {
        day: 1,
        hour: 6,
        minute: 0
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
        if (element) {
            const value = gameState.player[statName];
            const label = statName.charAt(0).toUpperCase() + statName.slice(1);
            element.textContent = `${label}: ${value}`;
        }
    }
};

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
    const terrainColor = style.getPropertyValue('--terrain-color');
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const viewportCenterX = Math.floor(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.floor(VIEWPORT_HEIGHT / 2);
    const startX = gameState.player.x - viewportCenterX;
    const startY = gameState.player.y - viewportCenterY;
    
    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH; x++) {
            const mapX = startX + x;
            const mapY = startY + y;
            let tile = chunkManager.getTile(mapX, mapY);
            let color = terrainColor;
            switch (tile) {
                case '~': color = '#60a5fa'; break;
                case 'F': color = '#228B22'; break;
                case '#': color = '#a3a3a3'; break;
                case '_': color = '#854d0e'; break;
                case '<': color = '#404040'; break;
                case '+': color = '#FF4500'; break; case 'o': color = '#6a0dad'; break; case 'S': color = '#ADFF2F'; break; case 'Y': color = '#4B0082'; break;
                case '$': color = '#ffd700'; break; case '!': color = '#d4a017'; break; case '?': color = '#ff69b4'; break; case 'E': color = '#964B00'; break;
                case 'D': color = '#54876b'; break; case 'C': color = '#ff8c00'; break; case 'W': color = '#800080'; break; case 'P': color = '#00CED1'; break;
                case '&': color = '#a9a9a9'; break; case '>': color = '#add8e6'; break;
            }
            ctx.fillStyle = color;
            ctx.fillText(tile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }
    }

    for (const id in otherPlayers) {
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

    ctx.fillStyle = playerColor;
    gameState.player.color = playerColor;
    ctx.fillText(gameState.player.character, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);

    const { hour, minute } = gameState.time;
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
        };
        onlinePlayerRef.set(stateToSync);
    }
}

helpButton.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
});

closeHelpButton.addEventListener('click', () => {
    helpModal.classList.add('hidden');
});

// Close modal if user clicks outside of it
helpModal.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        helpModal.classList.add('hidden');
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
            if (itemToUse.quantity <= 0) {
                gameState.player.inventory.splice(itemIndex, 1);
            }
            itemUsed = true;
        } else if (itemToUse) {
            logMessage(`Cannot use '${itemToUse.name}'.`);
        } else {
            logMessage(`No item in slot ${keyNum}.`);
        }
        
        if (itemUsed) {
            playerRef.update({ inventory: gameState.player.inventory });
            syncPlayerState();
            renderStats();
            advanceTime(); 
            renderTime();
            renderInventory();
        }
        event.preventDefault();
        return;
    }

    let startX = gameState.player.x;
    let startY = gameState.player.y;
    let newX = startX; 
    let newY = startY;
    
    switch (event.key) {
        case 'ArrowUp': case 'w': case 'W': newY--; break;
        case 'ArrowDown': case 's': case 'S': newY++; break;
        case 'ArrowLeft': case 'a': case 'A': newX--; break;
        case 'ArrowRight': case 'd': case 'D': newX++; break;
        case 'r': case 'R':
            if (gameState.player.stamina < gameState.player.maxStamina) {
                gameState.player.stamina++;
                logMessage("You rest for a moment, recovering 1 stamina.");
                syncPlayerState();
            } else {
                logMessage("You are already at full stamina.");
            }
            renderStats();
            advanceTime(); renderTime(); 
            event.preventDefault();
            return;
        default: return;
    }
    event.preventDefault();

    if (newX === startX && newY === startY) return;

    (async () => {
        const newTile = chunkManager.getTile(newX, newY);
        if (newTile === ' ') { logMessage("You've reached the edge of the known world."); return; }
        const moveCost = TERRAIN_COST[newTile] ?? 0;
        if (moveCost === Infinity) { logMessage("That way is blocked."); return; }

        const tileData = TILE_DATA[newTile];
        if (tileData && tileData.type === 'lore') {
            logMessage(tileData.message);
            advanceTime();
            renderTime();
            return;
        }
        
        const staminaDeficit = moveCost - gameState.player.stamina;
        if (moveCost > gameState.player.stamina && gameState.player.health <= staminaDeficit) {
            logMessage("You're too tired, and pushing on would be fatal!");
            return;
        }
        
        // This is a valid move, so update local state
        gameState.player.x = newX;
        gameState.player.y = newY;
        
        if (gameState.player.stamina >= moveCost) {
            gameState.player.stamina -= moveCost;
        } else {
            gameState.player.stamina = 0;
            gameState.player.health -= staminaDeficit;
            logMessage(`You push yourself to the limit, costing ${staminaDeficit} health!`);
        }
        
        if (newTile === 'F' && !gameState.flags.hasSeenForestWarning) {
            logMessage("Be careful! Moving through forests costs stamina.");
            gameState.flags.hasSeenForestWarning = true;
        } else {
            const itemData = ITEM_DATA[newTile];
            if (itemData) {
                if (itemData.type === 'consumable') {
                    const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                    if (existingItem) {
                        existingItem.quantity++;
                    } else {
                         const itemForDb = { 
                            name: itemData.name, 
                            type: itemData.type, 
                            quantity: 1, 
                            tile: newTile 
                        };
                        gameState.player.inventory.push(itemForDb);
                    }
                    logMessage(`You picked up a ${itemData.name}.`);
                    playerRef.update({ inventory: gameState.player.inventory });
                } else {
                    ITEM_DATA[newTile].effect(gameState);
                }
                chunkManager.setWorldTile(newX, newY, '.');
            } else if (moveCost > 0) {
                logMessage(`Traversing the terrain costs ${moveCost} stamina.`);
            } else {
                logMessage(`Moved to world coordinate (${newX}, ${newY}).`);
            }
        }
        
        // Now sync all changes to databases
        syncPlayerState();
        playerRef.update({ 
            x: gameState.player.x, 
            y: gameState.player.y,
            health: gameState.player.health,
            stamina: gameState.player.stamina,
        });


        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
            logMessage("You have perished! Game Over.");
            syncPlayerState();
        }

        advanceTime();
        renderTime();
        renderStats();
    })();
});

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    darkModeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
    ctx.font = `${TILE_SIZE}px monospace`;
};

darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

chatInput.addEventListener('keydown', (event) => {
    event.stopPropagation();
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
        await playerRef.set({
            x: Math.floor(WORLD_WIDTH / 2),
            y: Math.floor(WORLD_HEIGHT / 2),
            health: 10, maxHealth: 10,
            mana: 10, maxMana: 10,
            stamina: 10, maxStamina: 10,
            psyche: 10, maxPsyche: 10,
            strength: 1, wits: 1, luck: 1,
            constitution: 1, dexterity: 1, charisma: 1,
            willpower: 1, perception: 1, endurance: 1, intuition: 1,
            inventory: []
        });
    } catch (error) {
        authError.textContent = error.message;
        console.error("Error signing up:", error);
    }
});

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        authError.textContent = error.message;
        console.error("Error logging in:", error);
    }
});

logoutButton.addEventListener('click', () => {
    if (playerRef && gameState) {
        // Save the full final state on logout
        const finalState = { ...gameState.player };
        delete finalState.color;
        delete finalState.character; 
        playerRef.set(finalState, { merge: true });
    }
    if (onlinePlayerRef) {
        onlinePlayerRef.remove();
    }
    if (unsubscribePlayerListener) {
        unsubscribePlayerListener();
    }
    Object.values(worldStateListeners).forEach(unsubscribe => unsubscribe());
    worldStateListeners = {};
    auth.signOut();
});

async function startGame(user) {
    player_id = user.uid;
    playerRef = db.collection('players').doc(player_id);
    
    authContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    try {
        const doc = await playerRef.get();
        if (doc.exists) {
            const initialPlayerData = doc.data();
            Object.assign(gameState.player, initialPlayerData);
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
            };
            onlinePlayerRef.set(stateToSet);

            onlinePlayerRef.onDisconnect().remove().then(() => {
                const finalState = { ...gameState.player };
                delete finalState.color;
                delete finalState.character; 
                playerRef.set(finalState, { merge: true });
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
        if(doc.exists) {
            const playerData = doc.data();
            if (playerData.inventory) {
                playerData.inventory.forEach(item => {
                    const templateItem = Object.values(ITEM_DATA).find(d => d.name === item.name);
                    if (templateItem) {
                        item.effect = templateItem.effect;
                    }
                });
                gameState.player.inventory = playerData.inventory;
                renderInventory();
            }
        }
    });

    const chatRef = rtdb.ref('chat').orderByChild('timestamp').limitToLast(100);
    chatRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageDiv = document.createElement('div');
        
        const date = new Date(message.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        if (message.senderId === player_id) {
            messageDiv.innerHTML = `<span class="muted-text text-xs">[${timeString}]</span> <strong class="highlight-text">${message.email}:</strong> ${message.message}`;
        } else {
            messageDiv.innerHTML = `<span class="muted-text text-xs">[${timeString}]</span> <strong>${message.email}:</strong> ${message.message}`;
        }
        
        chatMessages.prepend(messageDiv);
    });

    renderTime();
    renderStats();
    syncPlayerState();
    logMessage(`Logged in as ${user.email}`);
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) { applyTheme(savedTheme); } 
        else if (prefersDark) { applyTheme('dark'); } 
        else { applyTheme('light'); }

        startGame(user);
    } else {
        authContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        player_id = null;
        if (onlinePlayerRef) {
            onlinePlayerRef.remove();
        }
        if (unsubscribePlayerListener) {
            unsubscribePlayerListener();
        }
        Object.values(worldStateListeners).forEach(unsubscribe => unsubscribe());
        worldStateListeners = {};
        console.log("No user is signed in.");
    }
});
