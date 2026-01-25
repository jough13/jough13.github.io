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

// Initialize Firebase (Prevent multiple instances)
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();

// Apply settings only if not already configured to avoid "Overriding host" error
// We wrap this in a try-catch because checking 'settings' directly is difficult in v8
try {
    db.settings({
        cacheSizeBytes: 10485760 // 10 MB
    });
} catch (e) {
    console.log("Firestore settings already applied, skipping.");
}

// Globals
let player_id;
let playerRef;
let onlinePlayerRef;
let otherPlayers = {};
let unsubscribePlayerListener;
let worldStateListeners = {};

let isProcessingMove = false; 

let lastAiExecution = 0;

let cachedThemeColors = {};

const processingSpawnTiles = new Set();

let areGlobalListenersInitialized = false;

// --- SPATIAL PARTITIONING HELPERS ---
const SPATIAL_CHUNK_SIZE = 16; // Match your chunkManager size

function getSpatialKey(x, y) {
    const cx = Math.floor(x / SPATIAL_CHUNK_SIZE);
    const cy = Math.floor(y / SPATIAL_CHUNK_SIZE);
    return `${cx},${cy}`;
}

function updateSpatialMap(enemyId, oldX, oldY, newX, newY) {
    // 1. Remove from old bucket if it exists
    if (oldX !== null && oldY !== null && oldX !== undefined && oldY !== undefined) {
        const oldKey = getSpatialKey(oldX, oldY);
        if (gameState.enemySpatialMap.has(oldKey)) {
            const set = gameState.enemySpatialMap.get(oldKey);
            set.delete(enemyId);
            if (set.size === 0) gameState.enemySpatialMap.delete(oldKey); // Cleanup
        }
    }

    // 2. Add to new bucket
    if (newX !== null && newY !== null && newX !== undefined && newY !== undefined) {
        const newKey = getSpatialKey(newX, newY);
        if (!gameState.enemySpatialMap.has(newKey)) {
            gameState.enemySpatialMap.set(newKey, new Set());
        }
        gameState.enemySpatialMap.get(newKey).add(enemyId);
    }
}

// --- OPTIMIZATION: Spatial Hash ---
const SpatialHash = {
    buckets: new Map(),
    getKey: (x, y) => `${x},${y}`,
    add: function(entity, x, y) {
        this.buckets.set(this.getKey(x, y), entity);
    },
    remove: function(x, y) {
        this.buckets.delete(this.getKey(x, y));
    },
    get: function(x, y) {
        return this.buckets.get(this.getKey(x, y));
    },
    clear: function() {
        this.buckets.clear();
    }
};

// --- INPUT THROTTLE ---
let lastActionTime = 0;
const ACTION_COOLDOWN = 150; // ms (limits speed to ~6 moves per second)
let inputBuffer = null;

// Track Listeners so we can turn them off
let sharedEnemiesListener = null;
let chatListener = null;
let connectedListener = null;

// Track enemies currently being spawned so they don't flicker
let pendingSpawns = new Set();

let pendingSpawnData = {};

let activeShopInventory = [];

const SELL_MODIFIER = 0.5; // Players sell items for 50% of their base price

// --- OPTIMIZATION: Cache Emoji Checks ---
const charWidthCache = {};

// PRE-FILL CACHE: Mark standard ASCII as "not wide" to skip regex
const ascii = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};':\",./<>?`~|\\ ";
for (let i = 0; i < ascii.length; i++) {
    charWidthCache[ascii[i]] = false;
}

const isWideChar = (char) => {
    if (charWidthCache[char] !== undefined) return charWidthCache[char];
    const isWide = /\p{Extended_Pictographic}/u.test(char); 
    charWidthCache[char] = isWide;
    return isWide;
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
    enemy.attack = Math.floor(enemy.attack * multiplier) + Math.floor(zoneLevel / 3);
    enemy.xp = Math.floor(enemy.xp * multiplier);

    // --- NEW: SAFE ZONE NERF (The Fix) ---
    // If within 100 tiles of spawn, weaken enemies significantly
    if (dist < 100) {
        // Reduce Attack by 1 (Min 1). This turns 2 dmg rats into 1 dmg rats.
        enemy.attack = Math.max(1, enemy.attack - 1); 
        // Reduce HP by 20% so they die faster
        enemy.maxHealth = Math.ceil(enemy.maxHealth * 0.8); 
    }
    // -------------------------------------

    // 4. Apply Zone Name (Cosmetic)
    if (zoneLevel === 0) {
        // No prefix for zone 0
    } else if (zoneLevel >= 2 && zoneLevel < 5) {
        enemy.name = `Feral ${enemy.name}`;
    } else if (zoneLevel >= 5 && zoneLevel < 10) {
        enemy.name = `Elder ${enemy.name}`;
    } else if (zoneLevel >= 10) {
        enemy.name = `Ancient ${enemy.name}`;
    }

    // --- 5. Elite Affix Roll ---
    const eliteChance = 0.05 + (zoneLevel * 0.01);

    // --- NEW: DISABLE ELITES NEAR SPAWN ---
    // Elites can only spawn if distance > 150. 
    // No more "Savage Rats" killing you at level 1.
    if (dist > 150 && !enemy.isBoss && Math.random() < eliteChance) {
        const prefixKeys = Object.keys(ENEMY_PREFIXES);
        const prefixKey = prefixKeys[Math.floor(Math.random() * prefixKeys.length)];
        const affix = ENEMY_PREFIXES[prefixKey];

        enemy.name = `${prefixKey} ${enemy.name}`;
        enemy.isElite = true;
        enemy.color = affix.color;

        if (affix.statModifiers) {
            if (affix.statModifiers.attack) enemy.attack += affix.statModifiers.attack;
            if (affix.statModifiers.defense) enemy.defense = (enemy.defense || 0) + affix.statModifiers.defense;
            if (affix.statModifiers.maxHealth) enemy.maxHealth += affix.statModifiers.maxHealth;
        }

        if (affix.special === 'poison') {
            enemy.inflicts = 'poison';
            enemy.inflictChance = 0.5;
        } else if (affix.special === 'frostbite') {
            enemy.inflicts = 'frostbite';
            enemy.inflictChance = 0.5;
        }

        enemy.xp = Math.floor(enemy.xp * affix.xpMult);
    }

    // Reset current health to new max
    enemy.health = enemy.maxHealth;

    return enemy;
}

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

// --- PERFORMANCE: OFFSCREEN CANVAS ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d');

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
const finalLevelDisplay = document.getElementById('finalLevelDisplay');
const finalCoinsDisplay = document.getElementById('finalCoinsDisplay');

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

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(string) {
  if (!string) return "";
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

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
window.selectBackground = async function (bgKey) {
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
    charCreationModal.classList.add('hidden'); // Hide the class selector
    gameContainer.classList.remove('hidden');  // NOW we show the game map
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
    
    document.title = "Caves and Castles";

    currentUser = user;
    
    authContainer.classList.add('hidden');
    gameContainer.classList.add('hidden'); // Force hide game map
    charCreationModal.classList.add('hidden'); // Force hide creation modal
    characterSelectModal.classList.remove('hidden');
    loadingIndicator.classList.remove('hidden'); 

    // 1. Legacy Migration Check
    const oldRootRef = db.collection('players').doc(user.uid);
    const oldDoc = await oldRootRef.get();

    if (oldDoc.exists && oldDoc.data().level) {
        console.log("Migrating legacy save to Slot 1...");
        const legacyData = oldDoc.data();
        await oldRootRef.collection('characters').doc('slot1').set(legacyData);
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
                    <p class="text-xs muted-text mt-2">${getRegionName(Math.floor((data.x || 0) / 160), Math.floor((data.y || 0) / 160))}</p>
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
                if (e.target === slotDiv || e.target.closest('.empty-slot-content')) selectSlot(slotId);
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
window.selectSlot = async function (slotId) {
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

        const defaultState = createDefaultPlayerState();
        // We DON'T save yet. We wait for background selection.
        Object.assign(gameState.player, defaultState);

        loadingIndicator.classList.add('hidden');
        charCreationModal.classList.remove('hidden');
    }
};

let slotPendingDeletion = null; // Store the slot ID temporarily

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

// 1. Open the Modal
window.deleteSlot = function (slotId) {
    slotPendingDeletion = slotId;
    deleteConfirmModal.classList.remove('hidden');
};

// 2. Handle Confirmation
if (confirmDeleteButton) {
    confirmDeleteButton.onclick = async () => {
        if (slotPendingDeletion) {
            const btn = confirmDeleteButton;
            const originalText = btn.textContent;
            
            // Visual feedback
            btn.disabled = true;
            btn.textContent = "Deleting...";

            try {
                await db.collection('players').doc(currentUser.uid).collection('characters').doc(slotPendingDeletion).delete();
                await renderSlots(); // Refresh the slot list
            } catch (e) {
                console.error("Error deleting slot:", e);
                alert("Failed to delete character. Check console.");
            }

            // Reset UI
            btn.disabled = false;
            btn.textContent = originalText;
            deleteConfirmModal.classList.add('hidden');
            slotPendingDeletion = null;
        }
    };
}

// 3. Handle Cancellation
if (cancelDeleteButton) {
    cancelDeleteButton.onclick = () => {
        deleteConfirmModal.classList.add('hidden');
        slotPendingDeletion = null;
    };
}

// 4. Click outside to cancel
deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
        deleteConfirmModal.classList.add('hidden');
        slotPendingDeletion = null;
    }
});

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

// --- BACKUP INTEGRITY UTILS ---
const BACKUP_SALT = "kEsMaI_v1_S3cR3t_s@lt"; // Change this to something random!

// Simple string hashing function
function generateSaveSignature(data) {
    // We only hash critical stats to ensure they match
    const stringToHash = `${data.xp}_${data.level}_${data.coins}_${data.background}_${BACKUP_SALT}`;
    
    let hash = 0;
    if (stringToHash.length === 0) return hash;
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// --- BACKUP SYSTEM ---

async function createCloudBackup() {
    if (!playerRef) return;

    logMessage("Creating cloud backup...");
    
    // 1. Get clean data
    // We explicitly define the object to avoid copying 'undefined' junk from gameState.player
    const rawData = {
        ...gameState.player,
        lootedTiles: Array.from(gameState.lootedTiles),
        exploredChunks: Array.from(gameState.exploredChunks),
        inventory: getSanitizedInventory(),
        equipment: getSanitizedEquipment(),
        timestamp: Date.now()
    };

    // JSON stringify/parse hack removes 'undefined' keys automatically
    // This is the "Nuclear Option" against the "Unsupported field value: undefined" error.
    const backupState = JSON.parse(JSON.stringify(rawData));

    // 2. Sign the data (After sanitization!)
    backupState.signature = generateSaveSignature(backupState);

    // 3. Save
    try {
        await playerRef.collection('backups').doc('latest').set(backupState);
        logMessage("{green:Backup successful!}");
        updateBackupUI(); 
    } catch (err) {
        console.error(err);
        logMessage("{red:Backup failed.} See console.");
    }
}

async function restoreCloudBackup() {
    if (!playerRef) return;

    if (!confirm("Are you sure? This will overwrite your current progress with the last backup.")) return;

    logMessage("Locating backup...");

    try {
        const doc = await playerRef.collection('backups').doc('latest').get();

        if (!doc.exists) {
            logMessage("{red:No backup found.}");
            return;
        }

        const data = doc.data();

        // 1. Verify Integrity
        const calculatedSig = generateSaveSignature(data);
        if (data.signature !== calculatedSig) {
            logMessage("{red:CORRUPT DATA.} Backup signature mismatch.");
            return; // STOP RESTORE
        }

        // 2. Restore
        logMessage("Restoring data...");
        
        // Remove the backup-specific fields before applying to game
        delete data.signature; 
        delete data.timestamp;

        // Apply to Game State (Reuse your enterGame logic structure)
        await enterGame(data);
        
        // Save immediately to the main slot so it persists
        await playerRef.set(data);

        logMessage("{green:Restore complete.}");
        
        // Close modal
        document.getElementById('settingsModal').classList.add('hidden');

    } catch (err) {
        console.error(err);
        logMessage("{red:Restore failed.}");
    }
}

async function updateBackupUI() {
    if (!playerRef) return;
    const label = document.getElementById('lastBackupLabel');
    if (!label) return;

    try {
        const doc = await playerRef.collection('backups').doc('latest').get();
        if (doc.exists) {
            const date = new Date(doc.data().timestamp);
            label.textContent = `Last Backup: ${date.toLocaleString()}`;
            label.classList.remove('text-red-500');
            label.classList.add('text-gray-400');
        } else {
            label.textContent = "No backup found.";
        }
    } catch (e) {
        label.textContent = "Status: Unknown";
    }
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

        obeliskProgress: [], // Tracks the order: ['north', 'east'] etc.

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
            { templateId: '🍞', name: 'Hardtack', type: 'consumable', quantity: 2, tile: '🍞' },
            { templateId: '💧f', name: 'Flask of Water', type: 'consumable', quantity: 2, tile: '💧' }
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
        for (let stat in bgStats) {
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

window.handleFastTravel = function (targetX, targetY) {
    const player = gameState.player;
    const TRAVEL_COST = 10;

    // Ensure the destination chunk is loaded or generate it temporarily to check the tile
    const tile = chunkManager.getTile(targetX, targetY);
    const invalidTiles = ['^', '~', '≈', '▓']; // Mountains, Water, Walls

    if (invalidTiles.includes(tile)) {
        logMessage("The Waystone is obstructed by terrain. Teleport unsafe.");
        return;
    }

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
    return function () {
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
    init: function (seed) {
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
    noise: function (x, y, z = 0) {
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
    '^': 2, // Changed from 3 to 2. Now you can walk 5 tiles instead of 3!
    '≈': 2, 
    '~': Infinity, 
    'F': 1, 
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
window.learnTalent = function (talentId) {
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

function getSanitizedEquipment() {
    const equip = gameState.player.equipment;

    // Helper to clean a single item
    const sanitize = (item, fallbackType) => {
        if (!item) return null;
        
        return {
            name: item.name || "Unknown",
            // FIX: If type is missing (like on Fists), fallback to 'weapon'/'armor' or null
            type: item.type || fallbackType || null, 
            quantity: item.quantity || 1,
            // FIX: If tile is missing, use a default icon based on fallback type
            tile: item.tile || (fallbackType === 'weapon' ? '👊' : '👕'), 
            
            // Use null if 0 or undefined to be safe, though 0 is valid for numbers. 
            // '|| null' converts 0 to null, which is fine for optional stats.
            damage: (item.damage !== undefined) ? item.damage : null,
            defense: (item.defense !== undefined) ? item.defense : null,
            
            slot: item.slot || null,
            statBonuses: item.statBonuses || null,
            spellId: item.spellId || null,
            skillId: item.skillId || null,
            stat: item.stat || null,
            isEquipped: true
        };
    };

    // Sanitize with specific fallbacks
    // If equip.weapon is just {name: 'Fists'}, it grabs 'weapon' as the type.
    let weapon = sanitize(equip.weapon, 'weapon');
    
    // Extra safety: If weapon is completely null (unequipped state?), force Fists
    if (!weapon) {
        weapon = { name: 'Fists', type: 'weapon', tile: '👊', damage: 0, isEquipped: true };
    }

    let armor = sanitize(equip.armor, 'armor');
    if (!armor) {
        armor = { name: 'Simple Tunic', type: 'armor', tile: '👕', defense: 0, isEquipped: true };
    }

    return {
        weapon: weapon,
        armor: armor
    };
}

/**
 * Returns a clean array of inventory items ready for Firebase storage.
 * Removes functions (like 'effect') and ensures data consistency.
 */

function getSanitizedInventory() {
    return gameState.player.inventory.map(item => ({
        templateId: item.templateId || item.tile || null,
        name: item.name || "Unknown",
        // FIX: Default to 'junk' if type is somehow missing
        type: item.type || "junk", 
        quantity: item.quantity || 1,
        tile: item.tile || '?',
        
        // Explicit checks for undefined to preserve 0 but convert undefined to null
        damage: (item.damage !== undefined) ? item.damage : null,
        defense: (item.defense !== undefined) ? item.defense : null,
        
        slot: item.slot || null,
        statBonuses: item.statBonuses || null,
        spellId: item.spellId || null,
        skillId: item.skillId || null,
        stat: item.stat || null,
        isEquipped: item.isEquipped || false
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
        ctx.moveTo(tx - 3, ty - 3); ctx.lineTo(tx + 3, ty + 3);
        ctx.moveTo(tx + 3, ty - 3); ctx.lineTo(tx - 3, ty + 3);
        ctx.stroke();
    },

    // --- BIOME RENDERERS (Now accepting mapX/mapY) ---

    // 🐊 Swamp (Static - Stagnant Muck)
    drawSwamp: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);

        // Deterministic random (so the muck doesn't move when you walk)
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        ctx.fillStyle = accentColor;

        // Draw random horizontal "scum" patches or reeds
        if (rand > 0.6) {
            ctx.fillRect((x * TILE_SIZE) + 3, (y * TILE_SIZE) + 6, 8, 2);
        }
        if (rand < 0.4) {
            ctx.fillRect((x * TILE_SIZE) + 10, (y * TILE_SIZE) + 14, 6, 2);
        }
        // Occasional bubble
        if (rand > 0.9) {
            ctx.beginPath();
            ctx.arc((x * TILE_SIZE) + 15, (y * TILE_SIZE) + 5, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // 🌲 Procedural Pine Forests
    drawForest: (ctx, x, y, mapX, mapY, baseColor) => {
        // 1. Draw Ground
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // 2. Deterministic Random
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        // 3. Determine Tree Properties
        // Some tiles have 1 big tree, others have 2 smaller ones
        const treeCount = rand > 0.7 ? 2 : 1;

        for (let i = 0; i < treeCount; i++) {
            // Offset logic for multiple trees
            const offsetX = (i === 0) ? (TILE_SIZE / 2) : (TILE_SIZE / 2) + ((rand - 0.5) * 10);
            const offsetY = (i === 0) ? (TILE_SIZE) : (TILE_SIZE) - ((rand) * 5);

            const tx = (x * TILE_SIZE) + offsetX;
            const ty = (y * TILE_SIZE) + offsetY;

            // Height variation
            const height = (TILE_SIZE * 0.8) + (rand * (TILE_SIZE * 0.4)) - (i * 5);
            const width = height * 0.6;

            // Trunk
            ctx.fillStyle = '#451a03'; // Dark Wood
            ctx.fillRect(tx - 2, ty - (height * 0.2), 4, height * 0.2);

            // Foliage (Triangle)
            // We use two shades of green for "lighting"
            const treeColor = (mapX + mapY) % 2 === 0 ? '#166534' : '#15803d'; // Varying greens

            ctx.fillStyle = treeColor;
            ctx.beginPath();
            ctx.moveTo(tx, ty - height); // Top
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2)); // Bottom Right
            ctx.lineTo(tx - (width / 2), ty - (height * 0.2)); // Bottom Left
            ctx.fill();

            // Shadow (Right side of tree for 3D effect)
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.moveTo(tx, ty - height);
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2));
            ctx.lineTo(tx, ty - (height * 0.2));
            ctx.fill();
        }
    },

    // ⛰ Improved "Low Poly" Mountains with Valleys
    drawMountain: (ctx, x, y, mapX, mapY, baseColor) => {
        // 1. Deterministic Random Seed
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed); // 0.0 to 1.0

        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // 2. Draw Ground (Matches biome to hide gaps)
        ctx.fillStyle = baseColor;
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // --- 3. NEGATIVE SPACE (The Valley) ---
        // 15% chance to be a flat valley tile.
        // This breaks up the "wall" of mountains.
        if (rand > 0.85) {
            // Draw a tiny pebble so it looks intentional, not like a glitch
            ctx.fillStyle = '#44403c'; // Dark grey pebble
            ctx.beginPath();
            // Randomize pebble position slightly based on seed
            const pX = tx + (TILE_SIZE * 0.3) + (rand * 5);
            const pY = ty + (TILE_SIZE * 0.3) + (rand * 5);
            ctx.arc(pX, pY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            return; // Stop here! Don't draw a peak.
        }

        // --- HELPER: Draw a single peak ---
        const drawPeak = (offsetX, offsetY, scaleW, scaleH) => {
            // Randomize peak tip slightly based on seed
            const jitterX = (rand - 0.5) * 4;

            const peakX = tx + (TILE_SIZE / 2) + offsetX + jitterX;
            const peakY = ty + (TILE_SIZE * 0.1) + offsetY;

            const width = TILE_SIZE * scaleW;
            const height = TILE_SIZE * scaleH;

            const baseLeft = peakX - (width / 2);
            const baseRight = peakX + (width / 2);
            const baseBottom = ty + TILE_SIZE;

            // Shadow Side (Right) - Warm Dark Grey
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(baseRight, baseBottom);
            ctx.lineTo(peakX, baseBottom);
            ctx.fill();

            // Sunlit Side (Left) - Warm Medium Grey
            ctx.fillStyle = '#78716c';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(peakX, baseBottom);
            ctx.lineTo(baseLeft, baseBottom);
            ctx.fill();

            // Snow Cap (Only on tall peaks)
            if (scaleH > 0.85) {
                const snowLine = peakY + (height * 0.25);
                ctx.fillStyle = '#f3f4f6'; // White
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX + (width * 0.2), snowLine + 2);
                ctx.lineTo(peakX, snowLine - 1); // Slight jagged dip
                ctx.lineTo(peakX - (width * 0.2), snowLine + 2);
                ctx.fill();
            }
        };

        // --- 4. CHOOSE PEAK VARIATION ---
        // Adjusted probabilities since top 15% is now Valley

        if (rand < 0.45) {
            // VARIATION A: The Titan (45% Chance)
            // One large, dominant peak.
            drawPeak(0, 0, 1.2, 1.0);
        }
        else if (rand < 0.75) {
            // VARIATION B: The Ridge (30% Chance)
            // One main peak with a small "shoulder" peak attached.
            const side = (rand < 0.60) ? -1 : 1;
            drawPeak(side * 5, 4, 0.7, 0.6);
            drawPeak(0, 0, 1.1, 1.0);
        }
        else {
            // VARIATION C: Twin Peaks (10% Chance)
            // Two distinct peaks.
            drawPeak(-3, 3, 0.7, 0.8);
            drawPeak(4, 5, 0.6, 0.6);
        }
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
            const tx = x * TILE_SIZE + TILE_SIZE / 2;
            const ty = y * TILE_SIZE + TILE_SIZE / 2;
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

    // 🌊 Water (Animated - Organic Flow)
    drawWater: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Slower time factor (2000 instead of 1500)
        // Mix mapX and mapY to create diagonal drift instead of vertical bouncing
        const time = Date.now() / 2000;
        const wavePhase = time + (mapX * 0.2) + (mapY * 0.1);

        const yOffset = Math.sin(wavePhase) * 3;

        ctx.beginPath();
        // Draw a slight curve instead of a straight line
        ctx.moveTo(tx + 2, ty + TILE_SIZE / 2 + yOffset);
        ctx.bezierCurveTo(
            tx + 8, ty + TILE_SIZE / 2 + yOffset - 2,
            tx + 12, ty + TILE_SIZE / 2 + yOffset + 2,
            tx + TILE_SIZE - 2, ty + TILE_SIZE / 2 + yOffset
        );
        ctx.stroke();
    },

    // 🔥 Fire (Animated)

    drawFire: (ctx, x, y, baseColor) => { // <-- Added baseColor parameter
        TileRenderer.drawBase(ctx, x, y, baseColor || '#451a03'); // <-- Use it, or fallback to brown

        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE - 2;
        const flicker = Math.sin(Date.now() / 100) * 3;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(tx, ty - 4, 4 + (flicker * 0.2), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(tx, ty - 4, 2 + (flicker * 0.1), 0, Math.PI * 2); ctx.fill();
    },

    // Ω Void Rift (Animated)
    drawVoid: (ctx, x, y) => {
        TileRenderer.drawBase(ctx, x, y, '#000');
        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(Date.now() / 300);
        const size = 6 + (pulse * 2);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, size, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#581c87';
        ctx.beginPath(); ctx.arc(tx, ty, size / 2, 0, Math.PI * 2); ctx.fill();
    },

    // 🧱 Enhanced Wall Renderer
    drawWall: (ctx, x, y, baseColor, accentColor, style = 'rough') => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Draw Base
        TileRenderer.drawBase(ctx, x, y, baseColor);
        ctx.fillStyle = accentColor;

        if (style === 'brick') {
            // CASTLE STYLE: Clean Bricks
            const brickH = TILE_SIZE / 4;
            // Row 1
            ctx.fillRect(tx, ty, TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 2, ty, 1, brickH);
            // Row 2
            ctx.fillRect(tx, ty + brickH, TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 4, ty + brickH, 1, brickH);
            ctx.fillRect(tx + (TILE_SIZE * 0.75), ty + brickH, 1, brickH);
            // Row 3
            ctx.fillRect(tx, ty + (brickH * 2), TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 2, ty + (brickH * 2), 1, brickH);
        } else {
            // CAVE STYLE: Rough Stone (Noise)
            // Deterministic random based on position
            const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            const rand = seed - Math.floor(seed);

            // Draw random cracks/texture
            ctx.fillRect(tx + (rand * 10), ty + (rand * 5), 4, 4);
            ctx.fillRect(tx + ((1 - rand) * 10), ty + ((1 - rand) * 10) + 5, 3, 3);

            // Border shadow for depth
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(tx, ty + TILE_SIZE - 2, TILE_SIZE, 2); // Bottom shadow
        }
    },

    // 1. NEW: Visual Warning Zone
    drawTelegraph: (ctx, x, y) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Pulsing Red Overlay
        const alpha = 0.3 + (Math.sin(Date.now() / 150) * 0.15); // Fast pulse

        ctx.save();
        ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`; // Red
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // Warning Border with Cross
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // Draw an 'X' to make it colorblind friendly
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
        ctx.moveTo(tx + TILE_SIZE, ty);
        ctx.lineTo(tx, ty + TILE_SIZE);
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        ctx.restore();
    },

    // 2. NEW: Universal Health Bar Helper
    drawHealthBar: (ctx, x, y, current, max) => {
        if (max <= 0) return;
        const percent = Math.max(0, current / max);

        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Bar Container (Black background)
        const barHeight = 4;
        const yOffset = TILE_SIZE - barHeight; // Bottom of tile

        ctx.fillStyle = '#1f2937'; // Dark Gray
        ctx.fillRect(tx, ty + yOffset, TILE_SIZE, barHeight);

        // Health Color (Green -> Yellow -> Red)
        let color = '#22c55e'; // Green
        if (percent < 0.5) color = '#eab308'; // Yellow
        if (percent < 0.25) color = '#ef4444'; // Red

        ctx.fillStyle = color;
        ctx.fillRect(tx, ty + yOffset, TILE_SIZE * percent, barHeight);

        // Border for clarity
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx, ty + yOffset, TILE_SIZE, barHeight);
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

        // Calculate cave location from ID (format: cave_X_Y)
        const parts = caveId.split('_');
        const cX = parts.length > 2 ? parseInt(parts[1]) : 0;
        const cY = parts.length > 2 ? parseInt(parts[2]) : 0;
        const dist = Math.sqrt(cX * cX + cY * cY);

        // Safe Zone Density Nerf
        if (dist < 150) { 
            enemyCount = 10; // Half the enemies for starter caves!
        }

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
        if (!this.caveEnemies[caveId]) {
            this.caveEnemies[caveId] = [];
        }

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
                            spellDamage: Math.floor((enemyTemplate.spellDamage || 0) * (1 + (Math.floor(Math.sqrt(caveX * caveX + caveY * caveY) / 50) * 0.1))),
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
            map[startPos.y + 1][startPos.x] = '.';
            map[startPos.y - 1][startPos.x] = '.';
            map[startPos.y][startPos.x + 1] = '.';
            map[startPos.y][startPos.x - 1] = '.';
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
            map[startPos.y + 1][startPos.x] = '.';
            map[startPos.y - 1][startPos.x] = '.';
            map[startPos.y][startPos.x + 1] = '.';
            map[startPos.y][startPos.x - 1] = '.';
        }

        // --- 4. Place procedural loot and decorations ---

        const CAVE_LOOT_TABLE = ['+', '🔮', 'Y', 'S', '$', '📄', '🍄', '🏺', '⚰️'];
        const lootQuantity = Math.floor(random() * 4);

        for (let i = 0; i < lootQuantity; i++) {
            const itemToPlace = CAVE_LOOT_TABLE[Math.floor(random() * CAVE_LOOT_TABLE.length)];
            let placed = false;
            for (let attempt = 0; attempt < 5 && !placed; attempt++) {
                const randY = Math.floor(random() * (CAVE_HEIGHT - 2)) + 1;
                const randX = Math.floor(random() * (CAVE_WIDTH - 2)) + 1;

                // Construct the unique ID for this specific tile in this specific cave
                const uniqueTileId = `${caveId}:${randX},${-randY}`;

                const lootId = `${caveId}:${randX},${-randY}`;

                if (gameState.lootedTiles.has(lootId)) {
                    continue; // Skip placing loot here, it's already taken
                }

                if (map[randY][randX] === theme.floor) {
                    map[randY][randX] = itemToPlace;
                    placed = true;
                }
            }
        }

        // --- Safety check for themes without decorations ---
        const themeDecorations = theme.decorations || [];
        const specialItems = themeDecorations.filter(item => !CAVE_LOOT_TABLE.includes(item));

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
            for (let i = 0; i < 40; i++) {
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

            // --- MOVED INSIDE THE IF BLOCK ---
            if (!bossPlaced) {
                console.warn("⚠️ Boss placement RNG failed. Forcing spawn at center.");

                // Pick the dead center of the map
                const bx = Math.floor(CAVE_WIDTH / 2);
                const by = Math.floor(CAVE_HEIGHT / 2);

                // Force the terrain to be a floor (in case it was a wall)
                map[by][bx] = theme.floor;

                // Place the Boss Tile
                const bossTile = '🧙';
                map[by][bx] = bossTile;

                const bossTemplate = ENEMY_DATA[bossTile];

                // Add to enemy list manually
                this.caveEnemies[caveId].push({
                    id: `${caveId}:BOSS`,
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
                    isBoss: true,
                    madnessTurns: 0,
                    frostbiteTurns: 0,
                    poisonTurns: 0,
                    rootTurns: 0
                });
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

        // Calculate the maximum width of any row
let maxWidth = 0;
for (let r of map) {
    if (r.length > maxWidth) maxWidth = r.length;
}

// Pad shorter rows with walls ('▓') or void (' ') to match maxWidth
for (let y = 0; y < map.length; y++) {
    while (map[y].length < maxWidth) {
        map[y].push('▓'); // Fill gaps on the right side with Wall
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

                if (map[spawnY] && map[spawnY][spawnX] !== undefined) {
            map[spawnY][spawnX] = '.';
        } else {
            console.error(`CRITICAL: Spawn point {x:${spawnX}, y:${spawnY}} is out of bounds for layout!`);
            // Fallback: Force spawn to 1,1 to prevent crash
            if(map[1] && map[1][1]) map[1][1] = '.';
            // Note: Player might spawn in a wall if layout is tiny, but game won't crash.
        }

        // Finally, ensure the spawn tile itself is a floor tile
        map[spawnY][spawnX] = '.';

        // Extract Guards to Entities (Living World) ---
        // Clear old friendly NPCs for this ID to prevent duplicates
        this.friendlyNpcs = this.friendlyNpcs || {};
        this.friendlyNpcs[castleId] = [];

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
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

    listenToChunkState(chunkX, chunkY, onInitialLoad = null) { // Added callback param
        const chunkId = `${chunkX},${chunkY}`;

        // If we are already listening, just fire the callback immediately
        if (worldStateListeners[chunkId]) {
            if (onInitialLoad) onInitialLoad();
            return;
        }

        const docRef = db.collection('worldState').doc(chunkId);

        worldStateListeners[chunkId] = docRef.onSnapshot(doc => {
            this.worldState[chunkId] = doc.exists ? doc.data() : {};

            // If this is the first time data arrived, fire the callback
            if (onInitialLoad) {
                onInitialLoad();
                onInitialLoad = null; // Ensure it only runs once
            }

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

    // Helper: Determine enemy spawn based on Biome and Distance
    getEnemySpawn(biome, dist, random) {
        // --- CONFIGURATION ---
        // Tier 0: 0-500 (Tutorial/Easy - Rats, Snakes, Weak Bandits)
        // Tier 1: 500-1500 (Standard - Wolves, Goblins, Skeletons)
        // Tier 2: 1500-3000 (Hard - Bears, Orcs, Draugr)
        // Tier 3: 3000-6000 (Very Hard - Golems, Yetis, Demons)
        // Tier 4: 6000+ (Nightmare - Dragons, Rexes, Horrors)
        const TIER_THRESHOLDS = [500, 1500, 3000, 6000];

        // 1. Calculate Tier dynamically
        let tier = 0;
        for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
            if (dist > TIER_THRESHOLDS[i]) {
                tier = i + 1;
            } else {
                break;
            }
        }

        // 2. Define Spawn Tables
        const spawns = {
            '.': { // Plains
                0: ['r', 'r', 'b'], // Rat, Rat, Bandit
                1: ['b', 'w', 'o'], // Bandit, Wolf, Orc
                2: ['o', 'C', '🐺'], // Orc, Chief, Dire Wolf
                3: ['o', '🐺', 'Ø'], // Orc, Dire Wolf, Ogre
                4: ['Ø', '🦖', '🤖'] // Ogre, Rex, Guardian
            },
            'F': { // Forest
                0: ['🐍', '🦌', '🐗'], // Snake, Stag, Boar
                1: ['w', '🐗', '🐻'], // Wolf, Boar, Bear
                2: ['🐻', '🐺', '🕸'], // Bear, Dire Wolf, Web (Spider)
                3: ['🐺', '🐻', '🌲'], // Dire Wolf, Bear, Ent (Treant)
                4: ['🌲', '🧛', '👾'] // Treant, Vampire, Horror
            },
            '^': { // Mountain
                0: ['🦇', 'g', 'R'], // Bat, Goblin, Recruit
                1: ['g', 's', '🦅'], // Goblin, Skeleton, Eagle
                2: ['s', '🗿', 'Y'], // Skeleton, Golem, Yeti
                3: ['Y', 'Ø', '🐲'], // Yeti, Ogre, Drake
                4: ['🐲', '🦖', '🤖'] // Drake, Rex, Guardian
            },
            '≈': { // Swamp
                0: ['🦟', '🐸', '🐍'], // Mosquito, Toad, Snake
                1: ['🐍', 'l', 'Z'], // Snake, Leech, Draugr
                2: ['Z', 'l', '💀'], // Draugr, Leech, Necro Tome (Trap)
                3: ['Z', '💀', 'Hydra'], // Draugr, Necro, Hydra
                4: ['Hydra', '👾', '🧛'] // Hydra, Horror, Vampire
            },
            'D': { // Desert
                0: ['🦂s', '🐍', '🌵'], // Small Scorpion, Snake, Cactus
                1: ['🦂', '🐍c', '🌵'], // Giant Scorpion, Cobra, Cactus
                2: ['🦂', 'm', '💀'], // Scorpion, Mage, Necro
                3: ['m', '💀', 'Efreet'], // Mage, Necro, Efreet
                4: ['Efreet', '🦖', '🤖'] // Efreet, Rex, Guardian
            },
            'd': { // Deadlands
                0: ['s', 'b', 'R'], // Skeleton, Bandit, Recruit
                1: ['s', 'Z', 'a'], // Skeleton, Draugr, Acolyte
                2: ['Z', 'a', 'D'], // Draugr, Acolyte, Demon
                3: ['D', 'v', '🧙'], // Demon, Void Stalker, Necro Lord
                4: ['🧙', '👾', '🧛'] // Necro Lord, Horror, Vampire
            }
        };

        // 3. Select Enemy
        const table = spawns[biome];
        // If biome isn't listed (e.g. Water), no spawn
        if (!table) return null;

        // Cap the tier at the maximum defined for this biome
        const maxDefinedTier = Math.max(...Object.keys(table).map(Number));
        const safeTier = Math.min(tier, maxDefinedTier);

        const tierList = table[safeTier];
        if (!tierList) return null;

        // Weighted Random Selection
        // 60% Common, 30% Uncommon, 10% Rare
        const roll = random();
        if (roll < 0.60) return tierList[0];
        if (roll < 0.90) return tierList[1];
        return tierList[2];
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

                // --- BIOME GENERATION ---
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

                // --- SAFETY OVERRIDE: SPAWN IS ALWAYS SAFE ---
                if (Math.abs(worldX) < 3 && Math.abs(worldY) < 3) {
                    tile = '.';
                }

                const featureRoll = random();

                // ... inside generateChunk loop ...

// --- PUZZLE SPAWNS (Deterministic Locations) ---
// We place the 4 obelisks at specific distances in cardinal directions from spawn (0,0)

// North Obelisk (High Y negative)
if (worldX === 0 && worldY === -50) { 
    this.setWorldTile(worldX, worldY, '|n');
    chunkData[y][x] = '|n';
}
// East Obelisk (High X positive)
else if (worldX === 50 && worldY === 0) { 
    this.setWorldTile(worldX, worldY, '|e');
    chunkData[y][x] = '|e';
}
// West Obelisk
else if (worldX === -50 && worldY === 0) { 
    this.setWorldTile(worldX, worldY, '|w');
    chunkData[y][x] = '|w';
}
// South Obelisk
else if (worldX === 0 && worldY === 50) { 
    this.setWorldTile(worldX, worldY, '|s');
    chunkData[y][x] = '|s';
}
// The Vault Entrance (Somewhere tricky)
else if (worldX === 35 && worldY === 35) {
    this.setWorldTile(worldX, worldY, '⛩️d');
    chunkData[y][x] = '⛩️d';
}

                // --- 1. LEGENDARY LANDMARKS (Unique, Very Rare) ---
                if (tile === '.' && featureRoll < 0.0000005) { // 1 in 2M
                    this.setWorldTile(worldX, worldY, '♛');
                    chunkData[y][x] = '♛';
                }
                else if ((tile === 'd' || tile === '^') && featureRoll < 0.000001) {
                    this.setWorldTile(worldX, worldY, '🕳️');
                    chunkData[y][x] = '🕳️';
                }

                // --- 2. BIOME ANOMALIES (Very Rare) ---
                else if (tile === 'F' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🌳e');
                    chunkData[y][x] = '🌳e';
                }
                else if (tile === '^' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🗿k');
                    chunkData[y][x] = '🗿k';
                }
                else if (tile === 'D' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🦴d');
                    chunkData[y][x] = '🦴d';
                }

                // --- 3. RARE STRUCTURES (Scaled by Distance) ---
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

                // --- 4. MAJOR STRUCTURES (Explicit Spawn Rates) ---
                else if (tile === '^' && featureRoll < 0.008) {
                    this.setWorldTile(worldX, worldY, '⛰');
                    chunkData[y][x] = '⛰';
                }
                else if (tile === 'd' && featureRoll < 0.004) {
                    this.setWorldTile(worldX, worldY, '⛰');
                    chunkData[y][x] = '⛰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0005 && featureRoll < 0.0015) {
                    this.setWorldTile(worldX, worldY, '🏰');
                    chunkData[y][x] = '🏰';
                }
                else if ((tile === '.' || tile === 'F') && featureRoll > 0.0015 && featureRoll < 0.0020) {
                    this.setWorldTile(worldX, worldY, '⛰');
                    chunkData[y][x] = '⛰';
                }

                // --- 5. COMMON FEATURES ---
                else if (tile === '.' && featureRoll < 0.0005) {
    // 1. Grab every key from TILE_DATA
    let features = Object.keys(TILE_DATA);

    // 2. Filter to ONLY include generic, non-breaking features
    features = features.filter(f => {
        const data = TILE_DATA[f];
        
        // We ONLY want these specific types to spawn randomly in the fields
        const allowedTypes = [
            'lore',           // Signposts
            'lore_statue',    // Statues / Hermits
            'loot_container', // Chests / Shipwrecks
            'campsite',       // Tents
            'decoration'      // Trees / Rocks
        ];

        return allowedTypes.includes(data.type);
    });

    // 3. Pick one at random from the safe list
    if (features.length > 0) {
        const featureTile = features[Math.floor(random() * features.length)];
        this.setWorldTile(worldX, worldY, featureTile);
        chunkData[y][x] = featureTile;
    }
}

                // --- 6. RIDDLE STATUES ---
                else if (tile === '.' && featureRoll < 0.00008) {
                    this.setWorldTile(worldX, worldY, '?');
                    chunkData[y][x] = '?';
                }

                // --- 7. GENERIC STRUCTURES ---
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0001) {
                    this.setWorldTile(worldX, worldY, '🏛️');
                    chunkData[y][x] = '🏛️';
                }
                else if (tile !== '~' && tile !== '≈' && featureRoll < 0.0002) {
                    this.setWorldTile(worldX, worldY, '⛺');
                    chunkData[y][x] = '⛺';
                }

                // --- 8. ARCHAEOLOGY SPOTS (The Fix!) ---
                // We check this BEFORE enemies so you don't get a goblin standing on a dig spot
                else if (['.', 'd', 'D', 'F'].includes(tile) && featureRoll < (tile === 'd' || tile === 'D' ? 0.0015 : 0.0005)) {
                    this.setWorldTile(worldX, worldY, '∴');
                    chunkData[y][x] = '∴';
                }

                else {
                    // --- 9. ENEMY & RESOURCE SPAWNING ---
                    const hostileRoll = random();

                    // Base Spawn Chance
                    let spawnChance = 0.0015;

                    // Biome Modifiers
                    if (tile === 'F') spawnChance = 0.0025;
                    if (tile === 'd') spawnChance = 0.0040;
                    if (tile === '^') spawnChance = 0.0020;

                    if (hostileRoll < spawnChance) {
                        const enemyTile = this.getEnemySpawn(tile, dist, random);

                        if (enemyTile && (ENEMY_DATA[enemyTile] || TILE_DATA[enemyTile])) {
                            chunkData[y][x] = enemyTile;
                            if (TILE_DATA[enemyTile]) {
                                this.setWorldTile(worldX, worldY, enemyTile);
                            }
                        } else {
                            chunkData[y][x] = tile;
                        }
                    }
                    // --- 10. RESOURCE FALLBACKS ---
                    else if (tile === '^' && hostileRoll < 0.03) {
                        this.setWorldTile(worldX, worldY, '🏚');
                        chunkData[y][x] = '🏚';
                    }
                    else if (tile === 'F' && hostileRoll < 0.03) {
                        this.setWorldTile(worldX, worldY, '🌳');
                        chunkData[y][x] = '🌳';
                    }
                    else {
                        chunkData[y][x] = tile;
                    }
                }
            }
        }

        // --- SMOOTHING PASS ---
        for (let y = 1; y < this.CHUNK_SIZE - 1; y++) {
            for (let x = 1; x < this.CHUNK_SIZE - 1; x++) {
                const currentTile = chunkData[y][x];
                const naturalTerrain = ['.', 'F', 'd', 'D', '^', '~', '≈'];
                if (!naturalTerrain.includes(currentTile)) continue;

                const neighbors = [
                    chunkData[y - 1][x], chunkData[y + 1][x],
                    chunkData[y][x - 1], chunkData[y][x + 1]
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
    unloadOutOfRangeChunks: function (playerChunkX, playerChunkY) {
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
    pool: [],
    activeParticles: [],
    MAX_PARTICLES: 150,

    // Initialize the pool
    init: function() {
        for(let i=0; i<this.MAX_PARTICLES; i++) this.pool.push({ active: false });
    },

    spawn: function(x, y, color, type='dust', text='', size=2) {
        if(this.pool.length === 0) return; // Pool empty, skip particle
        
        const p = this.pool.pop(); // Reuse an old particle
        p.active = true;
        p.x = x + 0.5; 
        p.y = y + 0.5;
        p.color = color; 
        p.type = type; 
        p.text = text; 
        p.size = size;
        p.life = 1.0;
        
        if (type === 'text') {
            p.vx = 0; 
            p.vy = -0.02; 
            p.size = 14;
            p.gravity = 0;
        } else {
            p.vx = (Math.random() - 0.5) * 0.2;
            p.vy = (Math.random() - 0.5) * 0.2;
            p.gravity = 0.01;
        }
        this.activeParticles.push(p);
    },

    createExplosion: function(x, y, color, count=8) {
        for(let i=0; i<count; i++) this.spawn(x, y, color, 'dust', '', Math.random()*3+2);
    },

    createFloatingText: function(x, y, text, color) {
        this.spawn(x, y, color, 'text', text);
    },

    createLevelUp: function(x, y) {
        this.createFloatingText(x, y, "LEVEL UP!", "#facc15");
        for(let i=0; i<20; i++) this.spawn(x, y, ['#facc15','#ef4444'][Math.floor(Math.random()*2)], 'dust');
    },

    update: function() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.x += p.vx; 
            p.y += p.vy;
            p.life -= 0.02;
            if(p.gravity) p.vy += p.gravity;

            if (p.life <= 0) {
                p.active = false;
                this.pool.push(p); // Recycle back to pool
                this.activeParticles.splice(i, 1);
            }
        }
    },

    draw: function(ctx, startX, startY) {
        // Simple culling bounds
        const minX = -TILE_SIZE;
        const maxX = ctx.canvas.width + TILE_SIZE;
        const minY = -TILE_SIZE;
        const maxY = ctx.canvas.height + TILE_SIZE;

        for(let i=0; i<this.activeParticles.length; i++) {
            const p = this.activeParticles[i];
            const screenX = (p.x - startX) * TILE_SIZE;
            const screenY = (p.y - startY) * TILE_SIZE;

            if (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY) continue;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);

            if (p.type === 'text') {
                ctx.fillStyle = p.color;
                // Pop effect
                const scale = 1 + (Math.sin(p.life * Math.PI) * 0.5);
                ctx.font = `bold ${p.size * scale}px monospace`;
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(p.text, screenX, screenY);
                ctx.fillText(p.text, screenX, screenY);
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(screenX, screenY, p.size, p.size);
            }
            ctx.restore();
        }
    }
};
// Initialize immediately
ParticleSystem.init();

const gameState = {
    initialEnemiesLoaded: false,
    mapDirty: true,
    screenShake: 0,
    weather: 'clear',
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

    activeTreasure: null,

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
    enemySpatialMap: new Map(), // Key: "chunkX,chunkY", Value: Set(enemyId)
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

    // 1. SANITIZE: Turn "<script>" into "&lt;script&gt;"
    // This renders the text visibly but prevents it from running as code.
    let safeText = escapeHtml(text);

    // 2. FORMAT: Now it is safe to re-introduce YOUR specific HTML tags
    // Since we escaped the input first, users cannot inject their own <span> tags.
    let formattedText = safeText
        .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>')
        .replace(/{green:(.*?)}/g, '<span class="text-green-500 font-bold">$1</span>')
        .replace(/{blue:(.*?)}/g, '<span class="text-blue-400 font-bold">$1</span>')
        .replace(/{gold:(.*?)}/g, '<span class="text-yellow-500 font-bold">$1</span>')
        .replace(/{gray:(.*?)}/g, '<span class="text-gray-500">$1</span>');

    messageElement.innerHTML = `> ${formattedText}`;
    messageLog.prepend(messageElement);

    if (messageLog.children.length > 50) {
        messageLog.removeChild(messageLog.lastChild);
    }
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

function updateThemeColors() {
    const style = getComputedStyle(document.documentElement);
    cachedThemeColors = {
        canvasBg: style.getPropertyValue('--canvas-bg').trim(),
        mtnBase: style.getPropertyValue('--mtn-base').trim() || '#57534e',
        mtnShadow: style.getPropertyValue('--mtn-shadow').trim() || '#44403c',
        mtnCap: style.getPropertyValue('--mtn-cap').trim() || '#f9fafb'
    };
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
        // Only update if mapMode is active (meaning we are actually playing, not in menus)
    if (gameState.mapMode && gameState.player && gameState.player.level) {
        document.title = `HP: ${gameState.player.health}/${gameState.player.maxHealth} | Lvl ${gameState.player.level} - Caves & Castles`;
    }
};

// --- ADVANCED AUDIO SYSTEM (OPTIMIZED) ---
const AudioSystem = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    noiseBuffer: null, // Cache the buffer here

    // Settings State
    settings: JSON.parse(localStorage.getItem('audioSettings')) || {
        master: true,
        steps: true,
        combat: true,
        magic: true,
        ui: true
    },

    saveSettings: () => {
        localStorage.setItem('audioSettings', JSON.stringify(AudioSystem.settings));
    },

    // Initialize the buffer once
    initNoise: function() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2.0; 
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    },

    playNoise: function(duration, vol = 0.1, filterFreq = 1000) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.settings.master) return;

        // Lazy load the buffer if it doesn't exist
        if (!this.noiseBuffer) this.initNoise();

        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer; // Reuse existing buffer

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        src.start();
        src.stop(this.ctx.currentTime + duration);
    },

    playTone: (freq, type, duration, vol = 0.1) => {
        if (AudioSystem.ctx.state === 'suspended') AudioSystem.ctx.resume();
        if (!AudioSystem.settings.master) return;

        const osc = AudioSystem.ctx.createOscillator();
        const gain = AudioSystem.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, AudioSystem.ctx.currentTime);

        gain.gain.setValueAtTime(vol, AudioSystem.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, AudioSystem.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(AudioSystem.ctx.destination);
        osc.start();
        osc.stop(AudioSystem.ctx.currentTime + duration);
    },

    playStep: () => { if (AudioSystem.settings.steps) AudioSystem.playNoise(0.08, 0.05, 600); },
    playAttack: () => { 
        if (!AudioSystem.settings.master || !AudioSystem.settings.combat) return;
        if (AudioSystem.ctx.state === 'suspended') AudioSystem.ctx.resume();
        const osc = AudioSystem.ctx.createOscillator();
        const gain = AudioSystem.ctx.createGain();
        osc.frequency.setValueAtTime(300, AudioSystem.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, AudioSystem.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, AudioSystem.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, AudioSystem.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(AudioSystem.ctx.destination);
        osc.start();
        osc.stop(AudioSystem.ctx.currentTime + 0.1);
    },
    playHit: () => { if (AudioSystem.settings.combat) AudioSystem.playTone(80, 'square', 0.15, 0.1); },
    playMagic: () => { if (AudioSystem.settings.magic) AudioSystem.playTone(600, 'sine', 0.3, 0.05); },
    playCoin: () => { if (AudioSystem.settings.ui) AudioSystem.playTone(1200, 'sine', 0.1, 0.05); }
};

// Global set to track processed tiles this session
// (Ensure this is defined at the top of your file with other globals)
const wokenEnemyTiles = new Set();

async function wakeUpNearbyEnemies() {
    // Determine player location
    const player = gameState.player;
    if (!player) return;

    const WAKE_RADIUS = 14; // Increased slightly to ensure they spawn before you see them

    // Use a batch update for map tiles to prevent excessive rendering/saving
    let mapUpdates = {}; 
    let spawnUpdates = {};
    let enemiesSpawnedCount = 0;
    let visualUpdateNeeded = false;

    for (let y = player.y - WAKE_RADIUS; y <= player.y + WAKE_RADIUS; y++) {
        for (let x = player.x - WAKE_RADIUS; x <= player.x + WAKE_RADIUS; x++) {
            
            // 1. Check the static map tile
            const tile = chunkManager.getTile(x, y);
            
            // Optimization: Only check logic if it looks like an enemy tile
            // This prevents looking up ENEMY_DATA for every single grass tile
            if (tile === '.' || tile === 'F' || tile === 'd' || tile === 'D' || tile === '^' || tile === '~' || tile === '≈') continue;

            const enemyData = ENEMY_DATA[tile];

            // 2. If it's a valid enemy tile, we "Wake" it
            if (enemyData) {
                const enemyId = `overworld:${x},${-y}`;

                // Only spawn if it doesn't already exist in the live world
                if (!gameState.sharedEnemies[enemyId] && !pendingSpawnData[enemyId]) {
                    
                    // A. Create the Live Entity
                    const scaledStats = getScaledEnemy(enemyData, x, y);
                    const newEnemy = {
                        ...scaledStats,
                        tile: tile, // Keep visual ref
                        x: x,
                        y: y,
                        spawnTime: Date.now()
                    };

                    // B. Queue for Firebase (The Source of Truth)
                    spawnUpdates[`worldEnemies/${enemyId}`] = newEnemy;
                    
                    // C. Add to local pending (Immediate Visual Feedback)
                    // CRITICAL FIX: Add directly to sharedEnemies immediately so there is 0 frames of invisibility
                    pendingSpawnData[enemyId] = newEnemy;
                    gameState.sharedEnemies[enemyId] = newEnemy; 
                    
                    // D. Update Spatial Map immediately so AI knows it exists
                    updateSpatialMap(enemyId, null, null, x, y);

                    // E. CONSUME THE MAP TILE
                    chunkManager.setWorldTile(x, y, '.'); 
                    
                    enemiesSpawnedCount++;
                    visualUpdateNeeded = true;
                }
            }
        }
    }

    // 3. Send Batch to Firebase (Atomic Operation)
    if (enemiesSpawnedCount > 0) {
        rtdb.ref().update(spawnUpdates).catch(err => {
            console.error("Mass Spawn Error:", err);
        });
    }

    // 4. Force Render if we changed anything
    if (visualUpdateNeeded) {
        gameState.mapDirty = true; // Forces terrain cache to redraw (removing static 'r')
        render(); // Draws the new dynamic 'r' on top immediately
    }
}

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

function handleItemDrop(key) {
    const player = gameState.player;
    const keyNum = parseInt(key);

    if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) return;

    const itemIndex = keyNum - 1;
    const itemToDrop = player.inventory[itemIndex];

    if (!itemToDrop) return; // Empty slot

    if (itemToDrop.isEquipped) {
        logMessage("You cannot drop an item you are wearing!");
        // Visual feedback failure? Optional.
        return;
    }

    // --- MAGIC ITEM CHECK ---
    // Prevent accidental deletion of rare loot
    const template = ITEM_DATA[itemToDrop.tile] || ITEM_DATA[itemToDrop.templateId];
    // Check if name differs from template (Prefix/Suffix) or has bonuses
    const isModified = itemToDrop.statBonuses || (template && itemToDrop.name !== template.name);
    
    if (isModified) {
        logMessage("You cannot drop magic items! Sell or Stash them.");
        return;
    }

    // --- TILE VALIDATION ---
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

    // Validate Floor
    let isValidDropTile = false;
    if (gameState.mapMode === 'overworld' && currentTile === '.') isValidDropTile = true;
    else if (gameState.mapMode === 'castle' && currentTile === '.') isValidDropTile = true;
    else if (gameState.mapMode === 'dungeon') {
        const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        if (currentTile === theme.floor) isValidDropTile = true;
    }

    if (!isValidDropTile) {
        logMessage("You can't drop items here. (Must be on open floor)");
        return;
    }

    // --- EXECUTE DROP ---
    
    // 1. Logic
    itemToDrop.quantity--;
    logMessage(`Dropped 1x ${itemToDrop.name}.`);

    // 2. Place on Map
    if (gameState.mapMode === 'overworld') {
        chunkManager.setWorldTile(player.x, player.y, itemToDrop.tile);
    } else if (gameState.mapMode === 'dungeon') {
        chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = itemToDrop.tile;
    } else if (gameState.mapMode === 'castle') {
        chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = itemToDrop.tile;
    }

    // 3. Clear Loot Memory (So it can be picked up again)
    let tileId = (gameState.mapMode === 'overworld') 
        ? `${player.x},${-player.y}`
        : `${gameState.currentCaveId || gameState.currentCastleId}:${player.x},${-player.y}`;
    gameState.lootedTiles.delete(tileId);

    // 4. Cleanup Inventory Array
    if (itemToDrop.quantity <= 0) {
        player.inventory.splice(itemIndex, 1);
    }

    // --- UI UPDATE ---
    
    // Turn off drop mode automatically after one drop (Standard UX)
    gameState.isDroppingItem = false;
    
    // Update DB
    playerRef.update({ inventory: getSanitizedInventory() });
    
    // Refresh the UI immediately so the item disappears or count decreases
    renderInventory();
    render(); // Update map to show item on ground
    gameState.mapDirty = true; 
}

function generateMagicItem(tier) {
    // 1. Pick a random base item (Weapons or Armor)
    const baseKeys = Object.keys(ITEM_DATA).filter(k =>
        ITEM_DATA[k].type === 'weapon' || ITEM_DATA[k].type === 'armor'
    );
    // Filter out items explicitly marked to be excluded
    const validBaseKeys = baseKeys.filter(k => !ITEM_DATA[k].excludeFromLoot);

    const baseKey = validBaseKeys[Math.floor(Math.random() * validBaseKeys.length)];
    const template = ITEM_DATA[baseKey];

    // Clone the item
    let newItem = {
        templateId: baseKey,
        name: template.name,
        type: template.type,
        quantity: 1,
        tile: baseKey,
        damage: template.damage || 0,
        defense: template.defense || 0,
        slot: template.slot,
        statBonuses: template.statBonuses ? { ...template.statBonuses } : {}
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

// Visual Settings State
let crtEnabled = localStorage.getItem('crtSetting') !== 'false'; // Default to true

function applyVisualSettings() {

    const container = document.getElementById('gameCanvasWrapper');

    if (container) {
        if (crtEnabled) {
            container.classList.add('crt');
        } else {
            container.classList.remove('crt');
        }
    }
}

function initSettingsListeners() {
    console.log("⚙️ Initializing Settings Listeners...");

    // --- DOM ELEMENTS ---
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsButton');
    const openBtn = document.getElementById('settingsButton');

    // Audio Checkboxes
    const cbMaster = document.getElementById('settingMaster');
    const cbSteps = document.getElementById('settingSteps');
    const cbCombat = document.getElementById('settingCombat');
    const cbMagic = document.getElementById('settingMagic');
    const cbUI = document.getElementById('settingUI');

    // Visual Checkboxes
    const cbCRT = document.getElementById('settingCRT');

    // Cloud Backup Buttons
    const btnBackup = document.getElementById('btnBackup');
    const btnRestore = document.getElementById('btnRestore');

    // Safety Check: If critical UI is missing, abort to prevent errors
    if (!modal || !openBtn || !closeBtn) {
        console.error("❌ Critical Settings UI elements missing from HTML!");
        return;
    }

    // --- HELPER: SYNC UI ---
    // Updates checkboxes to match current global variables/localStorage
    const syncUI = () => {
        // Audio Sync
        if (cbMaster) cbMaster.checked = AudioSystem.settings.master;
        if (cbSteps) cbSteps.checked = AudioSystem.settings.steps;
        if (cbCombat) cbCombat.checked = AudioSystem.settings.combat;
        if (cbMagic) cbMagic.checked = AudioSystem.settings.magic;
        if (cbUI) cbUI.checked = AudioSystem.settings.ui;

        // Visual Sync
        if (cbCRT) cbCRT.checked = crtEnabled;

        // Master Volume Logic: Disable sub-options if master is off
        if (cbMaster) {
            const isMasterOn = cbMaster.checked;
            [cbSteps, cbCombat, cbMagic, cbUI].forEach(cb => {
                if (cb) {
                    cb.disabled = !isMasterOn;
                    // Visual flair: dim the label if disabled (optional, depends on CSS)
                    cb.parentElement.style.opacity = isMasterOn ? '1' : '0.5';
                }
            });
        }
    };

    // --- 1. OPEN/CLOSE MODAL ---
    
    openBtn.onclick = (e) => {
        e.preventDefault();
        
        // 1. Refresh Checkboxes
        syncUI();
        
        // 2. Refresh Backup Timestamp (Async)
        updateBackupUI(); 
        
        // 3. Show Modal
        modal.classList.remove('hidden');
    };

    closeBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add('hidden');
    };

    // --- 2. AUDIO HANDLERS ---
    
    const handleAudioToggle = (key, element) => {
        if (!element) return;
        element.onchange = (e) => {
            // Update State
            AudioSystem.settings[key] = e.target.checked;
            AudioSystem.saveSettings();
            
            // If Master changed, update the UI (disable/enable children)
            if (key === 'master') syncUI();

            // Feedback Sound
            if (e.target.checked && AudioSystem.settings.master) {
                if (key === 'steps') AudioSystem.playStep();
                else AudioSystem.playCoin();
            }
        };
    };

    handleAudioToggle('master', cbMaster);
    handleAudioToggle('steps', cbSteps);
    handleAudioToggle('combat', cbCombat);
    handleAudioToggle('magic', cbMagic);
    handleAudioToggle('ui', cbUI);

    // --- 3. VISUAL HANDLERS ---

    if (cbCRT) {
        cbCRT.onchange = (e) => {
            crtEnabled = e.target.checked;
            localStorage.setItem('crtSetting', crtEnabled);
            applyVisualSettings(); // Apply CSS class immediately
            
            if (crtEnabled) AudioSystem.playMagic(); // Sound effect
        };
    }

    // --- 4. CLOUD BACKUP HANDLERS ---

    if (btnBackup) {
        btnBackup.onclick = (e) => {
            e.preventDefault();
            // Prevent spamming
            btnBackup.disabled = true;
            btnBackup.textContent = "Saving...";
            
            createCloudBackup().then(() => {
                btnBackup.disabled = false;
                btnBackup.textContent = "☁️ Create Backup";
            });
        };
    }

    if (btnRestore) {
        btnRestore.onclick = (e) => {
            e.preventDefault();
            restoreCloudBackup();
        };
    }

    console.log("✅ Settings Listeners (Audio, Visuals, Backups) Attached.");
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

// --- HELPER: DRAW FANCY MOUNTAIN (OPTIMIZED) ---
function drawMountain(ctx, x, y, size) {
    // Use the global cache we created in Step 1
    if (!cachedThemeColors.mtnBase) updateThemeColors();

    const { mtnBase, mtnShadow, mtnCap } = cachedThemeColors;

    // 1. Draw the main mountain body
    ctx.fillStyle = mtnBase;
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size / 2, y + size * 0.1);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();

    // 2. Draw the shadow
    ctx.fillStyle = mtnShadow;
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size * 0.1);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size / 2, y + size);
    ctx.closePath();
    ctx.fill();

    // 3. Draw the snow cap
    ctx.fillStyle = mtnCap;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.25, y + size * 0.5);
    ctx.lineTo(x + size * 0.35, y + size * 0.4);
    ctx.lineTo(x + size * 0.5, y + size * 0.55);
    ctx.lineTo(x + size * 0.65, y + size * 0.4);
    ctx.lineTo(x + size * 0.75, y + size * 0.5);
    ctx.lineTo(x + size / 2, y + size * 0.1);
    ctx.closePath();
    ctx.fill();
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

    // --- SAFETY FIX START ---
    // If the Set doesn't exist yet, create it.
    if (!gameState.exploredChunks) {
        // Try to recover data from the player object if it exists there
        if (gameState.player && Array.isArray(gameState.player.exploredChunks)) {
            gameState.exploredChunks = new Set(gameState.player.exploredChunks);
        } else {
            gameState.exploredChunks = new Set();
        }
    }
    // --- SAFETY FIX END ---

    // Calculate Chunk ID
    const chunkX = Math.floor(gameState.player.x / MAP_CHUNK_SIZE);
    const chunkY = Math.floor(gameState.player.y / MAP_CHUNK_SIZE);
    const chunkId = `${chunkX},${chunkY}`;

    // Add to Set if new
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

    // --- 0. QUEST ITEM DROPS ---
    // 1. Sun Shard (Desert, 5% chance)
    if (gameState.player.relicQuestStage === 1 && (enemy.tile === '🦂' || enemy.tile === 'm') && Math.random() < 0.05) {
        logMessage("You found the Sun Shard!");
        return '💎s';
    }
    // 2. Moon Tear (Swamp, 5% chance)
    if (gameState.player.relicQuestStage === 2 && (enemy.tile === 'l' || enemy.tile === 'Hydra') && Math.random() < 0.05) {
        logMessage("You found the Moon Tear!");
        return '💎m';
    }
    // 3. Void Crystal (Mountain, 5% chance)
    if (gameState.player.relicQuestStage === 3 && (enemy.tile === 'Y' || enemy.tile === '🐲') && Math.random() < 0.05) {
        logMessage("You found the Void Crystal!");
        return '💎v';
    }

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

    // --- 4.5 LEGENDARY DROPS (Tier 4 Only) ---
    // If we are in the Deep Wilds (> 2500) and it's a Rare enemy (10% spawn chance)
    // Give a small chance for a Legendary.
    if (dist > 2500 && Math.random() < 0.05) { // 5% chance per kill in deep wilds
        const legendaries = ['⚔️k', '🛡️a', '👢w', '👑v', '🍎g'];
        const drop = legendaries[Math.floor(Math.random() * legendaries.length)];

        const item = ITEM_DATA[drop];
        logMessage(`The enemy dropped a Legendary Artifact: ${item.name}!`);

        // Visual fanfare
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createLevelUp(player.x, player.y); // Reuse confetti
        }

        return drop;
    }

    // --- 5. Standard Equipment Drops ---
    const scaledRoll = Math.random();

    // Define Tiers
    const commonLoot = ['+', '🔮', 'S', 'Y', '🐀', '🦇', '🦷', '🧣'];

    // Tier 1: Starter Gear (Club, Staff, Bow, Padded, Robes)
    const tier1Loot = ['/', '%', '🏏', '🦯', '🏹', '👕', '👘'];

    // Tier 2: Basic Iron/Leather
    const tier2Loot = ['!', '[', '📚', '🛡️', '🛡️w'];

    // Tier 3: Steel/Chain/Magic
    const tier3Loot = ['⚔️s', 'A', 'Ψ', 'M', '⚔️l', '⛓️', '🛡️i'];

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
 * Automatically updates derived stats (Max HP, Mana, etc.) to prevent desync.
 * @param {object} item - The item object (from equipment).
 * @param {number} operation - 1 to add, -1 to subtract.
 */
function applyStatBonuses(item, operation) {
    // --- FIX: Safety Check ---
    if (!item || !item.statBonuses) {
        return;
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

            // 1. Apply the Core Stat Change
            player[stat] += (amount * operation);

            // 2. FIX: Update Derived Stats Immediately
            // This ensures Max HP/Mana stay in sync when swapping gear or dying.
            if (stat === 'constitution') {
                player.maxHealth += (amount * 5 * operation);
                // If unequipped, clamp current health so it doesn't exceed new max
                if (player.health > player.maxHealth) player.health = player.maxHealth;
            }
            else if (stat === 'wits') {
                player.maxMana += (amount * 5 * operation);
                if (player.mana > player.maxMana) player.mana = player.maxMana;
            }
            else if (stat === 'endurance') {
                player.maxStamina += (amount * 5 * operation);
                if (player.stamina > player.maxStamina) player.stamina = player.maxStamina;
            }
            else if (stat === 'willpower') {
                player.maxPsyche += (amount * 3 * operation); // +3 per point based on stat allocation logic
                if (player.psyche > player.maxPsyche) player.psyche = player.maxPsyche;
            }

            // (Keep your existing log/flash logic here)
            if (operation === 1) {
                logMessage(`You feel ${stat} increase! (+${amount})`);
                triggerStatFlash(statDisplays[stat], true);
            } else {
                triggerStatFlash(statDisplays[stat], false);
            }
        }
    }
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

        if (player.level >= 10 && !player.classEvolved) {
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

    // --- CHARISMA LOGIC ---
    const basePrice = shopItem.price;
    // 0.5% discount per point of Charisma
    const discountPercent = player.charisma * 0.005;
    // Cap the discount at 25% (at 100 Charisma)
    const finalDiscount = Math.min(discountPercent, 0.25);
    const finalBuyPrice = Math.floor(basePrice * (1.0 - finalDiscount));


    // 1. Check if player has enough gold
    if (player.coins < finalBuyPrice) {
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
        if (existingStack.quantity >= 99) {
            logMessage("You cannot carry any more of that item.");
            return;
        }
        existingStack.quantity++;
    } else {

        const itemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === itemName);

        player.inventory.push({

            templateId: itemKey,
            name: itemTemplate.name,
            type: itemTemplate.type,
            quantity: 1,
            tile: itemKey || '?',
            effect: itemTemplate.effect || null
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
        else if (itemToSell.name === 'Signet Ring') basePrice = 80;
        else if (itemToSell.name === 'Pouch of Gold Dust') basePrice = 50;
        else if (itemToSell.name === 'Ancient Coin') basePrice = 25;
        else if (itemToSell.name === 'Alpha Pelt') basePrice = 60;
    }

    const regionMult = getRegionalPriceMultiplier(itemToSell.type, itemToSell.name);

    const sellBonusPercent = player.charisma * 0.005;
    const finalSellBonus = Math.min(sellBonusPercent, 0.25);

    // --- FIX START: Economy Cap ---
    // Calculate raw sell price
    let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

    // Cap the sell price at 80% of the base price to prevent infinite money loops
    // (e.g. buying for 90g and selling for 100g)
    const maxSellPrice = Math.floor(basePrice * 0.8);

    // If the item is a rare relic (not sold in shops), we don't need to cap it strictly
    // against a shop price, but for general goods, we apply the cap.
    const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;
    // --- FIX END ---

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
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return;

    // 1. Get Container Dimensions
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;

    TILE_SIZE = 20;

    // 2. Calculate Viewport (Round UP to ensure full coverage, +1 for buffer)
    VIEWPORT_WIDTH = Math.ceil(containerWidth / TILE_SIZE) + 1;
    VIEWPORT_HEIGHT = Math.ceil(containerHeight / TILE_SIZE) + 1;

    const dpr = window.devicePixelRatio || 1;

    // 3. Resize Main Canvas (SNAP TO GRID)
    // CRITICAL FIX: We set the canvas size to match the TILES, not the container pixels.
    // This prevents stretching/blurring.
    const logicalWidth = VIEWPORT_WIDTH * TILE_SIZE;
    const logicalHeight = VIEWPORT_HEIGHT * TILE_SIZE;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;

    // Force CSS to match logical size to prevent scrollbars or stretching
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;

    // 4. Configure Main Context
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr, dpr); // Apply DPI scale
    ctx.imageSmoothingEnabled = false; // Forces crisp pixel/text edges
    ctx.font = `${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 5. Resize Offscreen Canvas (Match Main Canvas Exactly)
    terrainCanvas.width = canvas.width;
    terrainCanvas.height = canvas.height;
    
    // 6. Configure Offscreen Context
    terrainCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    terrainCtx.scale(dpr, dpr); // Apply DPI scale
    terrainCtx.font = `${TILE_SIZE}px monospace`;
    terrainCtx.textAlign = 'center';
    terrainCtx.textBaseline = 'middle';

    // 7. Force Redraw
    if (typeof gameState !== 'undefined') {
        gameState.mapDirty = true; 
        render();
    }
}

function handleSellAllItems() {
    const player = gameState.player;
    let itemsSold = 0;
    let goldGained = 0;

    // Iterate backwards so we can remove items safely while looping
    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];

        // 1. CRITICAL: Skip equipped items
        if (item.isEquipped) continue;

        // 2. Filter: Only sell 'junk' (Loot) and 'consumable' (Food/Potions)
        // We skip 'weapon', 'armor', 'tool', 'spellbook', etc. to be safe.
        if (item.type === 'junk') {

            // --- Price Calculation Logic (Matches handleSellItem) ---
            // 1. Try exact match
            let shopItem = activeShopInventory.find(sItem => sItem.name === item.name);

            // 2. Template ID Fallback
            if (!shopItem && item.templateId && ITEM_DATA[item.templateId]) {
                const baseName = ITEM_DATA[item.templateId].name;
                shopItem = activeShopInventory.find(sItem => sItem.name === baseName);
            }

            // 3. String Fallback
            if (!shopItem) {
                shopItem = activeShopInventory.find(sItem => item.name.endsWith(sItem.name));
            }
            let basePrice = 2;

            if (shopItem) {
                basePrice = shopItem.price;
                // Bonus for modified items
                if (item.name !== shopItem.name) {
                    basePrice = Math.floor(basePrice * 1.5);
                }
            } else {
                // Relic/Special Prices
                if (item.name === 'Shattered Crown') basePrice = 200;
                else if (item.name === 'Signet Ring') basePrice = 80;
                else if (item.name === 'Pouch of Gold Dust') basePrice = 50;
                else if (item.name === 'Ancient Coin') basePrice = 25;
                else if (item.name === 'Alpha Pelt') basePrice = 60;
            }

            const regionMult = getRegionalPriceMultiplier(item.type, item.name);
            const sellBonusPercent = player.charisma * 0.005;
            const finalSellBonus = Math.min(sellBonusPercent, 0.25);

            let calculatedSellPrice = Math.floor(basePrice * (SELL_MODIFIER + finalSellBonus) * regionMult);

            // Economy Cap logic
            const maxSellPrice = Math.floor(basePrice * 0.8);
            const sellPrice = shopItem ? Math.min(calculatedSellPrice, maxSellPrice) : calculatedSellPrice;
            // -------------------------------------------------------

            // 3. Execute Sale
            const totalValue = sellPrice * item.quantity;
            player.coins += totalValue;
            goldGained += totalValue;
            itemsSold += item.quantity;

            // Remove from inventory
            player.inventory.splice(i, 1);
        }
    }

    if (itemsSold > 0) {
        logMessage(`Sold ${itemsSold} items for ${goldGained} gold.`);
        AudioSystem.playCoin();

        // Save and Update UI
        playerRef.update({
            coins: player.coins,
            inventory: getSanitizedInventory()
        });
        renderShop();
        renderInventory();
        renderStats();
    } else {
        logMessage("You have no unequipped junk or consumables to sell.");
    }
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

    // --- NEW: Inject Sell All Button into the Header ---
    const sellListContainer = shopSellList.parentElement;
    const header = sellListContainer.querySelector('h3');

    if (header) {
        // Only inject if we haven't already (prevents duplicates on re-render)
        if (!header.querySelector('#sellAllBtn')) {
            header.innerHTML = `
                <div class="flex justify-between items-center w-full">
                    <span>Your Inventory</span>
                    <button id="sellAllBtn" class="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors">Sell All Junk</button>
                </div>
            `;
            // Bind the click event
            document.getElementById('sellAllBtn').onclick = handleSellAllItems;
        }
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

window.handleStashTransfer = function (action, index) {
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
        // Deep copy
        let withdrawnItem = JSON.parse(JSON.stringify(item));

        // RE-BIND EFFECT LOGIC
        const template = Object.values(ITEM_DATA).find(i => i.name === withdrawnItem.name);
        if (template && template.effect) {
            withdrawnItem.effect = template.effect;
        }

        // Check if item exists in inventory
        const invItem = player.inventory.find(i => i.name === item.name);
        if (invItem) {
            invItem.quantity += item.quantity;
        } else {
            player.inventory.push(withdrawnItem); // Push the re-bound item
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

    // Absolute positioned label that sits on the border/top-left
    const label = document.createElement('div');
    label.className = 'absolute -top-3 left-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-[var(--bg-panel)] px-1';
    label.textContent = 'Hotkeys';
    hotbarContainer.appendChild(label);

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
    const btn = document.getElementById('closeInventoryButton');
    const modal = document.getElementById('inventoryModal');

    // 1. Button Logic (Force override to ensure it works)
    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeInventoryModal();
        };
        // Add touch support for mobile responsiveness
        btn.ontouchend = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeInventoryModal();
        };
    } else {
        console.error("Error: closeInventoryButton not found in DOM.");
    }

    // 2. Click Outside to Close (Backup UX)
    if (modal) {
        modal.onclick = (e) => {
            // If the user clicks the dark background (the modal itself), close it.
            // (e.target is the element actually clicked, 'modal' is the container)
            if (e.target === modal) {
                closeInventoryModal();
            }
        };
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

            case 'channel':
                const manaGain = 5 + (player.wits * 2);
                player.mana = Math.min(player.maxMana, player.mana + manaGain);
                logMessage(`You channel energy... +${manaGain} Mana.`);
                triggerStatAnimation(statDisplays.mana, 'stat-pulse-blue');
                skillUsedSuccessfully = true;
                break;

            case 'deflect':
                player.thornsValue = 100; // Reflect huge damage
                player.thornsTurns = 1;   // Only for the very next turn/hit
                logMessage("You raise your blade, ready to deflect the next blow.");
                skillUsedSuccessfully = true;
                break;

            // STEALTH ---
            case 'stealth':
                player.stealthTurns = skillData.duration;
                logMessage("You fade into the shadows... (Invisible)");
                playerRef.update({ stealthTurns: player.stealthTurns });
                skillUsedSuccessfully = true;
                break;

            // WHIRLWIND ---
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

                        // --- Handle Overworld vs Instanced ---
                        if (gameState.mapMode === 'overworld') {
                            const tile = chunkManager.getTile(tx, ty);
                            const enemyData = ENEMY_DATA[tile];
                            if (enemyData) {
                                // Calculate damage (simplified for AoE)
                                const finalDmg = Math.max(1, baseDmg - (enemyData.defense || 0));
                                // Call the async handler (fire and forget)
                                handleOverworldCombat(tx, ty, enemyData, tile, finalDmg);
                                hitCount++;
                            }
                        } else {
                            // Existing Instanced Logic
                            let enemy = gameState.instancedEnemies.find(e => e.x === tx && e.y === ty);
                            if (enemy) {
                                enemy.health -= baseDmg;
                                logMessage(`Whirlwind hits ${enemy.name} for ${baseDmg}!`);
                                hitCount++;

                                if (enemy.health <= 0) {
                                    logMessage(`${enemy.name} is slain!`);
                                    registerKill(enemy);
                                    gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);

                                    // Update persistent dungeon state
                                    if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                                        chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                                    }
                                }
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

            // FIX: Ensure enemyData has stats (maxHealth) to prevent attacking non-combat tiles
            if (enemyData && enemyData.maxHealth) {
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
                            // FIX: Safety check inside transaction
                            if (!enemyData) return null;

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
                                chunkManager.setWorldTile(tx, ty, '.');
                                if (gameState.sharedEnemies[enemyId]) {
                                    delete gameState.sharedEnemies[enemyId];
                                }
                                render(); // Force update
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

function executeQuickstep(dirX, dirY) {
    const player = gameState.player;
    // Move 2 tiles
    const targetX = player.x + (dirX * 2);
    const targetY = player.y + (dirY * 2);

    // Check collision
    let tile = chunkManager.getTile(targetX, targetY);
    // (Simple check, you can expand to dungeon maps if needed)
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        tile = map[targetY][targetX];
    }

    if (['.', 'F', 'd', 'D'].includes(tile)) {
        player.x = targetX;
        player.y = targetY;
        player.stamina -= SKILL_DATA['quickstep'].cost;
        logMessage("You dash forward with blinding speed!");
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#fff', 5);

        triggerAbilityCooldown('quickstep');
        endPlayerTurn();
        render();
    } else {
        logMessage("Path blocked.");
        gameState.isAiming = false; // Reset aiming
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
                ${Object.entries(evo.stats).map(([k, v]) => `+${v} ${k}`).join(', ')}
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

    AudioSystem.playMagic();

    let hitSomething = false;

    // --- CALCULATE DAMAGE WITH BONUS ---
    const effectiveWits = player.wits + (player.witsBonus || 0);
    const effectiveWill = player.willpower; // Add willpowerBonus here if you ever add that stat!

    // --- 2. Execute Spell Logic ---
    switch (spellId) {

        // --- 1. ENTANGLE (Unique Logic) ---
        case 'entangle': {
            logMessage("Vines burst from the ground!");
            const entangleDmg = spellData.baseDamage + (player.intuition * spellLevel); 

            // Entangle hits a specific spot or the first thing in line
            for (let i = 1; i <= 3; i++) {
                const tx = player.x + (dirX * i);
                const ty = player.y + (dirY * i);

                if (await applySpellDamage(tx, ty, entangleDmg, spellId)) {
                    hitSomething = true;
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createFloatingText(tx, ty, "ROOTED", "#22c55e");
                    }
                    break;
                }
            }
            break;
        }

        // --- 2. STANDARD PROJECTILES (Shared Logic) ---
        case 'magicBolt':
        case 'siphonLife':
        case 'psychicBlast':
        case 'frostBolt':
        case 'poisonBolt': {
            // Determine which stat scales damage based on the specific spell ID
            const damageStat = (spellId === 'siphonLife' || spellId === 'psychicBlast' || spellId === 'poisonBolt') 
                ? effectiveWill 
                : effectiveWits;

            const spellDamage = spellData.baseDamage + (damageStat * spellLevel);

            let logMsg = "You cast your spell!";
            if (spellId === 'magicBolt') logMsg = "You hurl a bolt of energy!";
            else if (spellId === 'siphonLife') logMsg = "You cast Siphon Life!";
            else if (spellId === 'psychicBlast') logMsg = "You unleash a blast of mental energy!";
            else if (spellId === 'frostBolt') logMsg = "You launch a shard of ice!";
            else if (spellId === 'poisonBolt') logMsg = "You hurl a bolt of acid!";
            
            logMessage(logMsg);

            // Projectile travel logic (Range 1-3)
            for (let i = 1; i <= 3; i++) {
                const targetX = player.x + (dirX * i);
                const targetY = player.y + (dirY * i);
                
                if (await applySpellDamage(targetX, targetY, spellDamage, spellId)) {
                    hitSomething = true;
                    break; // Stop, we hit a target
                }
            }
            break;
        }

        // --- 3. OTHER SPELLS (Keep existing logic) ---
        case 'thunderbolt': {
            const thunderDmg = spellData.baseDamage + (player.wits * spellLevel);
            logMessage("CRACK! Lightning strikes!");
            // Thunderbolt is instant hit, range 4
            for (let i = 1; i <= 4; i++) {
                const tx = player.x + (dirX * i);
                const ty = player.y + (dirY * i);
                if (await applySpellDamage(tx, ty, thunderDmg, spellId)) {
                    ParticleSystem.createExplosion(tx, ty, '#facc15');
                    hitSomething = true;
                    break;
                }
            }
            break;
        }

        case 'meteor': {
            // Huge AoE (radius 2)
            const meteorDmg = spellData.baseDamage + (player.wits * spellLevel);
            const mx = player.x + (dirX * 3);
            const my = player.y + (dirY * 3);
            logMessage("A meteor crashes down!");

            for (let y = my - spellData.radius; y <= my + spellData.radius; y++) {
                for (let x = mx - spellData.radius; x <= mx + spellData.radius; x++) {
                    applySpellDamage(x, y, meteorDmg, spellId).then(hit => {
                        if (hit) ParticleSystem.createExplosion(x, y, '#f97316');
                    });
                }
            }
            hitSomething = true;
            break;
        }

        case 'raiseDead': {
            // (Keep existing raiseDead logic...)
            // 1. Calculate target coordinates
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
                        hp: 15 + (player.willpower * 5),
                        maxHp: 15 + (player.willpower * 5),
                        attack: 3 + Math.floor(player.wits / 2),
                        defense: 1,
                        x: targetX,
                        y: targetY
                    };

                    playerRef.update({ companion: gameState.player.companion });
                    hitSomething = true;
                    render();
                }
            } else {
                logMessage("You need a pile of bones '(' or a grave '⚰️' to raise the dead.");
            }
            break;
        }

        case 'chainLightning': {
            // (Keep existing chainLightning logic...)
            const lightningDmg = spellData.baseDamage + (player.wits * spellLevel);
            const targetX = player.x + (dirX * 3);
            const targetY = player.y + (dirY * 3);

            logMessage("A bolt of lightning arcs from your hands!");

            const hitPrimary = await applySpellDamage(targetX, targetY, lightningDmg, spellId);

            if (hitPrimary) {
                hitSomething = true;
                ParticleSystem.createExplosion(targetX, targetY, '#facc15');
            }

            const jumpRadius = 3; 
            let potentialJumpTargets = [];

            for (let y = targetY - jumpRadius; y <= targetY + jumpRadius; y++) {
                for (let x = targetX - jumpRadius; x <= targetX + jumpRadius; x++) {
                    if (x === targetX && y === targetY) continue;

                    let hasEnemy = false;
                    if (gameState.mapMode === 'overworld') {
                        const tile = chunkManager.getTile(x, y);
                        if (ENEMY_DATA[tile]) hasEnemy = true;
                    } else {
                        if (gameState.instancedEnemies.some(e => e.x === x && e.y === y)) hasEnemy = true;
                    }

                    if (hasEnemy) potentialJumpTargets.push({ x, y });
                }
            }

            const maxJumps = 2 + Math.floor(spellLevel / 2);
            potentialJumpTargets.sort(() => Math.random() - 0.5);
            const jumpsToMake = Math.min(potentialJumpTargets.length, maxJumps);

            if (jumpsToMake > 0) {
                setTimeout(() => logMessage(`The lightning arcs to ${jumpsToMake} nearby enemies!`), 200);
            }

            for (let i = 0; i < jumpsToMake; i++) {
                const jumpTgt = potentialJumpTargets[i];
                const jumpDmg = Math.max(1, Math.floor(lightningDmg * 0.75));
                applySpellDamage(jumpTgt.x, jumpTgt.y, jumpDmg, spellId).then(hit => {
                    if (hit) ParticleSystem.createExplosion(jumpTgt.x, jumpTgt.y, '#93c5fd');
                });
            }
            break;
        }

        case 'fireball': {
            // (Keep existing fireball logic...)
            const fbDamage = spellData.baseDamage + (player.wits * spellLevel);
            const radius = spellData.radius; 
            const targetX = player.x + (dirX * 3);
            const targetY = player.y + (dirY * 3);
            logMessage("A fireball erupts in the distance!");

            for (let y = targetY - radius; y <= targetY + radius; y++) {
                for (let x = targetX - radius; x <= targetX + radius; x++) {
                    let tileAt;
                    if (gameState.mapMode === 'overworld') tileAt = chunkManager.getTile(x, y);
                    else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[y]?.[x];
                    else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[y]?.[x];

                    if (tileAt === '🛢') {
                        logMessage("BOOM! An Oil Barrel explodes!");
                        ParticleSystem.createExplosion(x, y, '#f97316', 12);
                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '.');
                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][y][x] = '.';
                        else chunkManager.castleMaps[gameState.currentCastleId][y][x] = '.';
                        applySpellDamage(x, y, 15, 'fireball');
                    }

                    if (gameState.mapMode === 'dungeon' && tileAt === '🕸') {
                        const map = chunkManager.caveMaps[gameState.currentCaveId];
                        const theme = CAVE_THEMES[gameState.currentCaveTheme];
                        if (map && map[y]) {
                            map[y][x] = theme.floor;
                            logMessage("The web catches fire and burns away!");
                        }
                    }

                    applySpellDamage(x, y, fbDamage, spellId).then(hit => {
                        if (hit) hitSomething = true;
                    });
                }
            }
            break;
        }
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
                    templateId: rewardKey,
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
            playerQuest.kills < questData.needed) {
            playerQuest.kills++;
            logMessage(`Bounty: (${playerQuest.kills} / ${questData.needed})`);

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
    const sortedEnemies = Object.keys(ENEMY_DATA).sort((a, b) => ENEMY_DATA[a].name.localeCompare(ENEMY_DATA[b].name));

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
 * @param {string} recipeName - The name of the item to craft.
 * @returns {boolean} - True if the player has all materials, false otherwise.
 */
function checkHasMaterials(recipeName) {
    // Check both crafting and cooking lists
    const recipe = CRAFTING_RECIPES[recipeName] || COOKING_RECIPES[recipeName];
    if (!recipe) return false;

    const playerInventory = gameState.player.inventory;

    // Check every material in the recipe
    for (const materialName in recipe.materials) {
        const requiredQuantity = recipe.materials[materialName];

        // Count TOTAL amount of this material across all UNEQUIPPED stacks
        const totalAmount = playerInventory.reduce((sum, item) => {
            // Only count items that match the name AND are NOT equipped
            if (item.name === materialName && !item.isEquipped) {
                return sum + item.quantity;
            }
            return sum;
        }, 0);

        // If the total across all stacks is less than required, we can't craft
        if (totalAmount < requiredQuantity) {
            return false;
        }
    }

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
    const playerCraftLevel = player.craftingLevel || 1;
    if (CRAFTING_RECIPES[recipeName] && playerCraftLevel < recipe.level) {
        logMessage(`You need Crafting Level ${recipe.level} to make this.`);
        return;
    }

    // 3. Verify Materials (Double check using our robust function)
    if (!checkHasMaterials(recipeName)) {
        logMessage("You are missing materials (or they are currently equipped).");
        return;
    }

    // Look up the resulting item template
    const outputItemKey = Object.keys(ITEM_DATA).find(key => ITEM_DATA[key].name === recipeName);
    const itemTemplate = ITEM_DATA[outputItemKey];

    // Check Inventory Space
    // If it's stackable, check if we have a stack. If not, check for empty slot.
    const isStackable = itemTemplate.type === 'junk' || itemTemplate.type === 'consumable';
    const existingStack = playerInventory.find(item => item.name === itemTemplate.name);

    if (!existingStack || !isStackable) {
        if (playerInventory.length >= MAX_INVENTORY_SLOTS) {
            logMessage("Inventory full! Cannot craft.");
            return;
        }
    }

    // 4. Consume Materials (The Fix)
    for (const materialName in recipe.materials) {
        let remainingNeeded = recipe.materials[materialName];

        // Iterate backwards so we can safely remove items while looping
        for (let i = playerInventory.length - 1; i >= 0; i--) {
            if (remainingNeeded <= 0) break; // We have consumed enough of this material

            const item = playerInventory[i];

            // Only take from matching items that are NOT equipped
            if (item.name === materialName && !item.isEquipped) {
                // Take as much as we can from this stack, up to the remaining need
                const amountToTake = Math.min(item.quantity, remainingNeeded);

                item.quantity -= amountToTake;
                remainingNeeded -= amountToTake;

                // If stack is empty, remove it from inventory
                if (item.quantity <= 0) {
                    playerInventory.splice(i, 1);
                }
            }
        }
    }

    // 5. Add Crafted Item

    // --- Masterwork Logic (Only for Equipment) ---
    const levelDiff = playerCraftLevel - recipe.level;
    const masterworkChance = 0.10 + (levelDiff * 0.05);
    let isMasterwork = false;
    let craftedName = itemTemplate.name;
    let craftedStats = itemTemplate.statBonuses ? { ...itemTemplate.statBonuses } : {};

    if ((itemTemplate.type === 'weapon' || itemTemplate.type === 'armor') && Math.random() < masterworkChance) {
        isMasterwork = true;
        craftedName = `Masterwork ${itemTemplate.name}`;

        const stats = ['strength', 'wits', 'dexterity', 'constitution', 'luck'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        craftedStats[randomStat] = (craftedStats[randomStat] || 0) + 1;

        if (itemTemplate.type === 'weapon') itemTemplate.damage = (itemTemplate.damage || 0) + 1;
        if (itemTemplate.type === 'armor') itemTemplate.defense = (itemTemplate.defense || 0) + 1;
    }

    // DETERMINE QUANTITY
// If it's a Masterwork, we usually just make 1, otherwise use recipe yield or default to 1
let craftQuantity = (isMasterwork) ? 1 : (recipe.yield || 1); 

// Add to Inventory
if (existingStack && isStackable && !isMasterwork) {
    existingStack.quantity += craftQuantity; // CHANGED FROM ++
} else {
    const newItem = {
        templateId: outputItemKey,
        name: craftedName,
        type: itemTemplate.type,
        quantity: craftQuantity, // CHANGED FROM 1
        tile: outputItemKey || '?',
        damage: itemTemplate.damage || null,
        defense: itemTemplate.defense || null,
        slot: itemTemplate.slot || null,
        statBonuses: Object.keys(craftedStats).length > 0 ? craftedStats : null,
        effect: itemTemplate.effect || null
    };
    playerInventory.push(newItem);
}

if (isMasterwork) {
        logMessage(`Critical Success! You crafted a ${craftedName}!`);
        triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
    } else {
        const qtyStr = craftQuantity > 1 ? ` (x${craftQuantity})` : '';
        logMessage(`You crafted/cooked: ${recipeName}${qtyStr}.`);
    }

    // 6. Grant XP
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

            AudioSystem.playMagic();

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

function calculateHitChance(player, enemy) {
    // Base 88% accuracy
    let chance = 0.88;

    // Add 2% per point of Perception or Dexterity
    chance += (player.perception * 0.02);

    // Level Grace: +5% hit chance for every level under 5
    if (player.level < 5) {
        chance += (5 - player.level) * 0.05;
    }

    // Cap it at 98% (rarely miss) and floor at 50%
    return Math.max(0.5, Math.min(0.98, chance));
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

                    // APPLY STUN (Shield Bash OR Crush)
                    if (skillId === 'shieldBash' || skillId === 'crush') {
                        enemy.stunTurns = 3;
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

        // --- FIX START: Capture Stats Before Damage ---
        // Just like melee, we check if we have a local visual copy of this enemy.
        // If we do, we use its stats (Name, Elite status, Max HP) for the transaction.
        const liveEnemy = gameState.sharedEnemies[enemyId];
        const enemyInfo = liveEnemy || getScaledEnemy(enemyData, targetX, targetY);
        // --- FIX END ---

        try {
            const transactionResult = await enemyRef.transaction(currentData => {
                let enemy;

                if (currentData === null) {
                    // FIX: Use enemyInfo (the visual state) instead of generating random new stats
                    enemy = {
                        name: enemyInfo.name, 
                        health: enemyInfo.maxHealth,
                        maxHealth: enemyInfo.maxHealth,
                        attack: enemyInfo.attack,
                        defense: enemyData.defense, // Base defense is usually fine, or use enemyInfo.defense
                        xp: enemyInfo.xp,
                        loot: enemyData.loot,
                        tile: tile,
                        // Critical: Persist Elite status and color
                        isElite: enemyInfo.isElite || false,
                        color: enemyInfo.color || null
                    };
                } else {
                    enemy = currentData;
                }

                // Calculate actual damage
                damageDealt = Math.max(1, damage);
                enemy.health -= damageDealt;

                let color = '#3b82f6'; // Blue for magic

                if (spellId === 'fireball') color = '#f97316'; // Orange for fire
                if (spellId === 'poisonBolt') color = '#22c55e'; // Green for poison

                // Note: Visuals inside transaction might fire multiple times on retries, 
                // but for this game it's acceptable.
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(targetX, targetY, color);
                    ParticleSystem.createFloatingText(targetX, targetY, `-${damageDealt}`, color);
                }

                if (enemy.health <= 0) return null;
                return enemy;
            });

            const finalEnemyState = transactionResult.snapshot.val();
            
            if (finalEnemyState === null) {
                // Enemy Died
                // Use enemyInfo for the log and XP so it matches what the player saw
                logMessage(`The ${enemyInfo.name} was vanquished!`);
                registerKill(enemyInfo);

                // Pass Elite flag to loot generator
                const lootData = { ...enemyData, isElite: enemyInfo.isElite };
                const droppedLoot = generateEnemyLoot(player, lootData);

                chunkManager.setWorldTile(targetX, targetY, droppedLoot);
            }
        } catch (error) {
            console.error("Spell damage transaction failed: ", error);
        }

    } else {
        // Handle Instanced Combat
        let enemy = gameState.instancedEnemies.find(e => e.x === targetX && e.y === targetY);
        if (enemy) {
            damageDealt = Math.max(1, damage);
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

/**
 * Handles combat for overworld enemies, syncing health via RTDB.
 * Counter-attack logic removed to prevent double-striking bug.
 */
async function handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage) { 
    const player = gameState.player;
    const enemyId = `overworld:${newX},${-newY}`; 
    const enemyRef = rtdb.ref(`worldEnemies/${enemyId}`);

    // --- Capture Stats Before Death ---
    const liveEnemy = gameState.sharedEnemies[enemyId];
    const enemyInfo = liveEnemy || getScaledEnemy(enemyData, newX, newY);

    try {
        // Use a transaction to safely read and write enemy health
        const transactionResult = await enemyRef.transaction(currentData => {
            let enemy;
            if (currentData === null) {
                // Use enemyInfo (the visual state) instead of generating random new stats
                enemy = {
                    name: enemyInfo.name, 
                    health: enemyInfo.maxHealth,
                    maxHealth: enemyInfo.maxHealth,
                    attack: enemyInfo.attack,
                    defense: enemyInfo.defense || enemyData.defense,
                    xp: enemyInfo.xp,
                    loot: enemyData.loot,
                    tile: newTile,
                    isElite: enemyInfo.isElite || false,
                    color: enemyInfo.color || null
                };
            } else {
                enemy = currentData;
            }

            // --- Player Attacks Enemy ---
            enemy.health -= playerDamage;

            if (enemy.health <= 0) {
                return null; // Delete if dead
            } else {
                return enemy; // Update if alive
            }
        });

        // --- Process Transaction Results ---
        const finalEnemyState = transactionResult.snapshot.val();

        if (transactionResult.committed) {
            // Visual Feedback
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(newX, newY, '#ef4444');
                ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');
            }
        }

        if (finalEnemyState === null) {
            // Enemy Died
            logMessage(`The ${enemyInfo.name} was vanquished!`);
            grantXp(enemyInfo.xp);
            updateQuestProgress(newTile); 

            const tileId = `${newX},${-newY}`;
            if (gameState.lootedTiles.has(tileId)) {
                gameState.lootedTiles.delete(tileId);
                playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles) });
            }

            // Generate loot based on the TEMPLATE
            const lootData = { ...enemyData, isElite: enemyInfo.isElite };
            const droppedLoot = generateEnemyLoot(player, lootData);

            if (gameState.sharedEnemies[enemyId]) {
                delete gameState.sharedEnemies[enemyId];
            }

            const currentTerrain = chunkManager.getTile(newX, newY);
            const passableTerrain = ['.', 'd', 'D', 'F', '≈']; 

            if (passableTerrain.includes(currentTerrain) || currentTerrain === newTile) {
                chunkManager.setWorldTile(newX, newY, droppedLoot);
            }
        } 
        // NOTE: The "else" block (Counter-attack) has been removed.
        // The enemy will now strike normally during processOverworldEnemyTurns.

    } catch (error) {
        console.error("Firebase transaction failed: ", error);
        logMessage("Your attack falters... (network error)");
        return; 
    }

    // Finalize Turn
    endPlayerTurn();
    render();
}

const renderInventory = () => {
    inventoryModalList.innerHTML = '';
    const titleElement = document.querySelector('#inventoryModal h2');

    // --- VISUAL STATE HANDLING ---
    if (gameState.isDroppingItem) {
        titleElement.textContent = "SELECT ITEM TO DROP";
        titleElement.classList.add('text-red-500', 'font-extrabold');
        titleElement.classList.remove('text-default'); // Assuming standard text color class
    } else {
        titleElement.textContent = "Inventory";
        titleElement.classList.remove('text-red-500', 'font-extrabold');
        titleElement.classList.add('text-default');
    }

    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryModalList.innerHTML = '<span class="muted-text italic px-2">Inventory is empty.</span>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');

            // --- DYNAMIC STYLING ---
            let slotClass = 'inventory-slot p-2 rounded-md cursor-pointer transition-all duration-200';
            
            if (gameState.isDroppingItem) {
                // Red Border/Glow for Drop Mode
                slotClass += ' border-2 border-red-500 bg-red-900 bg-opacity-20 hover:bg-opacity-40';
            } else if (item.isEquipped) {
                // Gold Border for Equipped
                slotClass += ' equipped';
            } else {
                // Standard Hover
                slotClass += ' hover:border-blue-500';
            }
            
            itemDiv.className = slotClass;

            // Click Handler: Passes input to main handler to decide Use vs Drop
            itemDiv.onclick = (e) => {
                e.stopPropagation(); // Prevent clicking through to modal background
                handleInput((index + 1).toString());
            };

            // Build Tooltip
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

            // Elements
            const itemChar = document.createElement('span');
            itemChar.className = 'item-char';
            itemChar.textContent = item.tile;

            const itemQuantity = document.createElement('span');
            itemQuantity.className = 'item-quantity';
            itemQuantity.textContent = `x${item.quantity}`;

            const slotNumber = document.createElement('span');
            slotNumber.className = 'absolute top-0 left-1 text-xs highlight-text font-bold';
            if (index < 9) slotNumber.textContent = index + 1;

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
    equippedWeaponDisplay.innerHTML = weaponString;

    // Update the strength display to show the total damage
    statDisplays.strength.textContent = `Strength: ${player.strength} (Dmg: ${totalDamage})`;

    // --- ARMOR & DEFENSE ---
    const armor = player.equipment.armor || { name: 'Simple Tunic', defense: 0 };

    const weaponIcon = document.getElementById('slotWeaponIcon');
    const armorIcon = document.getElementById('slotArmorIcon');

    if (weaponIcon) weaponIcon.textContent = weapon.tile || '👊';
    if (armorIcon) armorIcon.textContent = armor.tile || '👕';

    // Calculate total defense
    const baseDefense = Math.floor(player.dexterity / 3);
    const armorDefense = armor.defense || 0;
    const buffDefense = player.defenseBonus || 0;

    // --- TALENT: IRON SKIN ---
    const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;

    const totalDefense = baseDefense + armorDefense + buffDefense + (player.constitution * 0.1);

    // Update the display
    let armorString = `Armor: ${armor.name} (+${armorDefense} Def)`;
    if (buffDefense > 0) {
        // Add the buff text, e.g. [Braced +2] (3t)
        armorString += ` <span class="text-green-500">[Braced +${buffDefense} (${player.defenseBonusTurns}t)]</span>`;
    }

    // Show Base Defense in the total
    equippedArmorDisplay.innerHTML = `${armorString} (Base: ${baseDefense}, Total: ${totalDefense} Def)`;
};

// --- HEAVY RENDERING (Only runs when moving) ---
function renderTerrainCache(startX, startY) {
    // Clear the offscreen canvas
    terrainCtx.clearRect(0, 0, terrainCanvas.width, terrainCanvas.height);

    // If cache is empty (first run), populate it
    if (!cachedThemeColors.canvasBg) updateThemeColors();
    const { canvasBg } = cachedThemeColors;

    // Fill Background
    terrainCtx.fillStyle = canvasBg;
    terrainCtx.fillRect(0, 0, terrainCanvas.width, terrainCanvas.height);

    // Loop through the Viewport
    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH; x++) {
            const mapX = startX + x;
            const mapY = startY + y;

            let tile;
            let fgChar = null;
            let fgColor = '#FFFFFF';
            let bgColor = null;

            // --- RESOLVE TILE TYPE ---
            if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                
                bgColor = theme.colors.floor;

                if (tile === theme.wall) {
                    TileRenderer.drawWall(terrainCtx, x, y, theme.colors.wall, 'rgba(0,0,0,0.2)', 'rough');
                } else if (tile === theme.floor) {
                    TileRenderer.drawBase(terrainCtx, x, y, theme.colors.floor);
                } else {
                    TileRenderer.drawBase(terrainCtx, x, y, theme.colors.floor);
                    fgChar = tile;
                }
            } 
            else if (gameState.mapMode === 'castle') {
                const map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                bgColor = '#a16207';

                if (tile === '▓' || tile === '▒') {
                    TileRenderer.drawWall(terrainCtx, x, y, '#78350f', '#451a03', 'brick');
                } else {
                    TileRenderer.drawBase(terrainCtx, x, y, '#a16207');
                    fgChar = tile;
                }
            } 
            else { // Overworld
                tile = chunkManager.getTile(mapX, mapY);
                const baseTerrain = getBaseTerrain(mapX, mapY);
                
                // Color Logic
                bgColor = '#22c55e'; // Plains
                if (baseTerrain === 'F') bgColor = '#14532d';
                else if (baseTerrain === 'd') bgColor = '#2d2d2d';
                else if (baseTerrain === 'D') bgColor = '#fde047';
                else if (baseTerrain === '≈') bgColor = '#422006';
                else if (baseTerrain === '^') bgColor = '#57534e';
                else if (baseTerrain === '~') bgColor = '#1e3a8a';

                TileRenderer.drawBase(terrainCtx, x, y, bgColor);

                // --- STATIC DRAWING ---
                // Note: We skip animated tiles (~, 🔥, Ω) here. They are drawn in the main loop.
                if (tile !== '~' && tile !== '≈' && tile !== '🔥' && tile !== 'D' && tile !== 'Ω') {
                    switch (tile) {
                        case '.': TileRenderer.drawPlains(terrainCtx, x, y, mapX, mapY, bgColor, '#15803d'); break;
                        case 'F': TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '^': TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case 'd': TileRenderer.drawDeadlands(terrainCtx, x, y, mapX, mapY, bgColor, '#444'); break;
                        // For Desert, structures, etc., we treat them as chars or specific renders
                        case 'D': TileRenderer.drawDesert(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '🧱': TileRenderer.drawWall(terrainCtx, x, y, '#78716c', '#57534e'); break;
                        case '=': TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); break;
                        case '+': fgChar = '+'; fgColor = '#fbbf24'; break;
                        case '/': fgChar = '/'; fgColor = '#000'; break;
                        default:
                            fgChar = tile;
                            if (ENEMY_DATA[tile]) fgColor = ENEMY_DATA[tile].color || '#ef4444';
                            break;
                    }
                }
            }

            // Draw Static Character (Items, Objects)
            if (fgChar) {
                if (fgChar === '^' || fgChar === '⛰') {
                    TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor || '#22c55e');
                    if (fgChar === '⛰') {
                        terrainCtx.fillStyle = '#1f2937';
                        terrainCtx.fillRect((x * TILE_SIZE) + (TILE_SIZE * 0.4), (y * TILE_SIZE) + (TILE_SIZE * 0.7), TILE_SIZE * 0.2, TILE_SIZE * 0.3);
                    }
                } else {
                    terrainCtx.fillStyle = fgColor;
                    terrainCtx.font = isWideChar(fgChar) ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
                    terrainCtx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }
    }
}

const render = () => {
    if (!gameState.mapMode) return;

    // --- SETUP ---
    if (!cachedThemeColors.canvasBg) updateThemeColors();
    const { canvasBg } = cachedThemeColors;

        // Check if the player possesses the lens right now
    const hasLens = gameState.player.inventory.some(i => i.name === 'Spirit Lens');

    // 1. Clear & Fill Background (Handles "Shake Gaps")
    // We fill the background BEFORE translation so screen shake doesn't leave trails/voids
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to absolute coordinates
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); // Restore to logical coordinates (scaled by dpr)

    // --- SCREEN SHAKE ---
    let shakeX = 0; let shakeY = 0;
    if (gameState.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * gameState.screenShake;
        shakeY = (Math.random() - 0.5) * gameState.screenShake;
        gameState.screenShake *= 0.9;
        if (gameState.screenShake < 0.5) gameState.screenShake = 0;
    }

    ctx.save(); // Start Scene Transform
    ctx.translate(shakeX, shakeY);

    const viewportCenterX = Math.floor(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.floor(VIEWPORT_HEIGHT / 2);
    const startX = gameState.player.x - viewportCenterX;
    const startY = gameState.player.y - viewportCenterY;

    // --- 2. UPDATE TERRAIN CACHE ---
    if (gameState.mapDirty) {
        renderTerrainCache(startX, startY);
        gameState.mapDirty = false;
    }

    // --- 3. DRAW CACHED TERRAIN ---
    // CRITICAL FIX: The terrainCanvas is already scaled by DPR.
    // The Main CTX is already scaled by DPR.
    // To draw it 1:1, we must draw it at logical 0,0 with logical dimensions.
    const dpr = window.devicePixelRatio || 1;
    const logicalW = terrainCanvas.width / dpr;
    const logicalH = terrainCanvas.height / dpr;

    // We use the logical dimensions because ctx is currently scaled
    ctx.drawImage(terrainCanvas, 0, 0, logicalW, logicalH);

    // --- 4. LIGHTING & DYNAMIC LAYER ---
    let ambientLight = 0.0;
    let baseRadius = 10;
    const hasTorch = gameState.player.inventory.some(item => item.name === 'Torch');
    const torchBonus = hasTorch ? 6 : 0;
    const candleBonus = (gameState.player.candlelightTurns > 0) ? 8 : 0;

    if (gameState.mapMode === 'dungeon') {
        ambientLight = 0.6;
        baseRadius = 6 + Math.floor(gameState.player.perception / 2) + torchBonus + candleBonus;
    } else if (gameState.mapMode === 'castle') {
        ambientLight = 0.2;
        baseRadius = 12 + torchBonus + candleBonus;
    } else {
        const hour = gameState.time.hour;
        if (hour >= 6 && hour < 18) ambientLight = 0.0;
        else if (hour >= 18 && hour < 20) ambientLight = 0.3;
        else if (hour >= 5 && hour < 6) ambientLight = 0.3;
        else ambientLight = 0.5;
        baseRadius = (ambientLight > 0.3) ? 8 + torchBonus + candleBonus : 25;
    }

    const now = Date.now();
    const torchFlicker = (Math.sin(now / 1000) * 0.2) + (Math.cos(now / 2500) * 0.1);
    const lightRadius = baseRadius + torchFlicker;

    // --- LIGHTING LOOP ---
    for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH; x++) {
            const mapX = startX + x;
            const mapY = startY + y;

            const distSq = (mapX - gameState.player.x) ** 2 + (mapY - gameState.player.y) ** 2;

// --- OPTIMIZATION: Early Exit ---
// If the tile is waaaay outside our max possible light radius, skip the math.
// (15 is a safe upper limit for torch + flicker + noise)
if (distSq > 225 && gameState.mapMode !== 'dungeon') { // 15^2 = 225
    // Just draw shadow and continue
    if (ambientLight < 1.0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - ambientLight})`; // Invert logic for opacity
        // Actually, your logic uses 'tileShadowOpacity'. 
        // If it's far away, opacity is 1.0 (black) in dungeons, or 'ambient' in overworld.
    }
    // Note: If you have ambient light (Daytime), you still need to render, 
    // but you can skip the 'Noise' and 'EffectiveRadius' math below.
}

let effectiveRadius = lightRadius;

// ONLY run the expensive Perlin Noise if we are actually near the light's edge
// (This saves running it 400 times a frame for tiles that are obviously dark or obviously bright)
if (typeof elevationNoise !== 'undefined' && distSq < 400) { 
    effectiveRadius += elevationNoise.noise(mapX / 5, mapY / 5) * 1.5;
}

            const effectiveRadiusSq = effectiveRadius * effectiveRadius;

            let tileShadowOpacity = ambientLight;

            if (gameState.mapMode === 'dungeon') {
                if (distSq > effectiveRadiusSq) {
                    tileShadowOpacity = 1.0;
                } else {
                    const dist = Math.sqrt(distSq);
                    const edge = effectiveRadius - dist;
                    if (edge < 5) tileShadowOpacity = 1.0 - (edge / 5);
                    else tileShadowOpacity = 0.0;
                }
            } else if (distSq < effectiveRadiusSq) {
                const dist = Math.sqrt(distSq);
                const edge = effectiveRadius - dist;
                if (edge < 5) tileShadowOpacity = ambientLight * (1 - (edge / 5));
                else tileShadowOpacity = 0;
            }

            // Animated Tiles Overlay
            let tile = null;
            if (gameState.mapMode === 'overworld') tile = chunkManager.getTile(mapX, mapY);
            else if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[mapY]) ? map[mapY][mapX] : null;
            }

            if (tile) {
                if (tile === '~') {
                    const waveVal = (now / 1500) + (mapX * 0.3) + (mapY * 0.2) + Math.sin(mapY * 0.5);
                    let fgChar = Math.sin(waveVal) > 0 ? '~' : '≈';
                    ctx.fillStyle = '#3b82f6';
                    ctx.font = `bold ${TILE_SIZE}px monospace`;
                    ctx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                } else if (tile === '🔥' || tile === 'D') {
                    const flicker = Math.floor(now / 100) % 3;
                    let fgColor = flicker === 0 ? '#ef4444' : (flicker === 1 ? '#f97316' : '#facc15');
                    if (tile === '🔥') {
                        TileRenderer.drawFire(ctx, x, y);
                    } else if (tile === 'D' && gameState.currentCaveTheme === 'FIRE') {
                        ctx.fillStyle = fgColor;
                        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                } else if (tile === 'Ω') {
                    const spin = Math.floor(now / 150) % 4;
                    const chars = ['Ω', 'C', 'U', '∩'];
                    ctx.fillStyle = '#a855f7';
                    ctx.font = `bold ${TILE_SIZE}px monospace`;
                    ctx.fillText(chars[spin], x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }

            // Apply Shadow
            if (tileShadowOpacity > 0) {
                ctx.fillStyle = `rgba(0, 0, 0, ${tileShadowOpacity})`;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            // Apply Tint
            if (ambientLight > 0.3 && tileShadowOpacity < 0.5) {
                let r = 255, g = 180, b = 100;
                if (gameState.mapMode === 'dungeon') {
                    const themeName = chunkManager.caveThemes[gameState.currentCaveId];
                    if (themeName === 'ICE') { r = 100; g = 200; b = 255; }
                    if (themeName === 'FIRE') { r = 255; g = 100; b = 50; }
                } else if (gameState.mapMode === 'overworld') {
                    if (tile === '≈') { r = 100; g = 200; b = 100; }
                    else if (tile === 'd') { r = 200; g = 200; b = 180; }
                    else if (gameState.weather === 'storm') { r = 100; g = 100; b = 150; }
                }
                const dist = Math.sqrt(distSq);
                const tintStrength = (1 - (dist / effectiveRadius)) * 0.15;
                if (tintStrength > 0) {
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${tintStrength})`;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // --- ENTITIES & PLAYERS ---
    
    // Attack Telegraphs
    if (gameState.instancedEnemies) {
        gameState.instancedEnemies.forEach(enemy => {
            if (enemy.pendingAttacks) {
                enemy.pendingAttacks.forEach(t => {
                    const screenX = t.x - startX;
                    const screenY = t.y - startY;
                    if (screenX >= 0 && screenX < VIEWPORT_WIDTH && screenY >= 0 && screenY < VIEWPORT_HEIGHT) {
                        TileRenderer.drawTelegraph(ctx, screenX, screenY);
                    }
                });
            }
        });
    }

    const drawEntity = (entity, x, y) => {
        // --- 1. SPIRIT LOGIC START ---
        // If the entity definition has type: 'spirit' AND the player lacks the lens...
        if (entity.type === 'spirit' && !hasLens) {
            return; // STOP. Do not draw this entity. It is invisible.
        }
        // --- SPIRIT LOGIC END ---

        const char = entity.tile || '?';
        
        // (Existing width check logic)
        const isWide = charWidthCache[char] !== undefined ? charWidthCache[char] : /\p{Extended_Pictographic}/u.test(char);
        
        // --- 2. OPTIONAL: VISUAL FLAIR ---
        // If it is a spirit and we CAN see it, make it look ghostly (semi-transparent)
        if (entity.type === 'spirit') {
            ctx.globalAlpha = 0.6; // Make it see-through
        }

        ctx.fillStyle = entity.color || '#ef4444';
        ctx.font = isWide ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
        ctx.fillText(char, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        
        // Reset transparency for the next item
        if (entity.type === 'spirit') {
            ctx.globalAlpha = 1.0; 
        }
        
        if (entity.isElite) {
            ctx.strokeStyle = entity.color || '#facc15';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        TileRenderer.drawHealthBar(ctx, x, y, entity.health, entity.maxHealth);
    };

    if (gameState.mapMode === 'overworld') {
        for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
            for (let x = 0; x < VIEWPORT_WIDTH; x++) {
                const mapX = startX + x;
                const mapY = startY + y;
                const enemyKey = `overworld:${mapX},${-mapY}`;
                if (gameState.sharedEnemies[enemyKey]) {
                    drawEntity(gameState.sharedEnemies[enemyKey], x, y);
                }
            }
        }
    } else {
        gameState.instancedEnemies.forEach(enemy => {
            const screenX = enemy.x - startX;
            const screenY = enemy.y - startY;
            if (screenX >= 0 && screenX < VIEWPORT_WIDTH && screenY >= 0 && screenY < VIEWPORT_HEIGHT) {
                drawEntity(enemy, screenX, screenY);
            }
        });
    }

    const shouldRenderOtherPlayers = gameState.mapMode !== 'dungeon';
    if (shouldRenderOtherPlayers) {
        for (const id in otherPlayers) {
            if (otherPlayers[id].mapMode !== gameState.mapMode || 
                otherPlayers[id].mapId !== (gameState.currentCaveId || gameState.currentCastleId)) continue;
            const op = otherPlayers[id];
            const screenX = (op.x - startX) * TILE_SIZE;
            const screenY = (op.y - startY) * TILE_SIZE;
            if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
                ctx.fillStyle = '#f97316';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText('@', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                if (op.companion) {
                    ctx.fillStyle = '#86efac';
                    ctx.font = `bold ${TILE_SIZE * 0.7}px monospace`;
                    ctx.fillText(op.companion.tile || '?', screenX + TILE_SIZE - 2, screenY + 6);
                }
            }
        }
    }

    const playerChar = gameState.player.isBoating ? 'c' : gameState.player.character;
    ctx.font = `bold ${TILE_SIZE}px monospace`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(playerChar, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(playerChar, viewportCenterX * TILE_SIZE + TILE_SIZE / 2, viewportCenterY * TILE_SIZE + TILE_SIZE / 2);

    const intensity = gameState.player.weatherIntensity || 0;
    if (intensity > 0 && gameState.weather !== 'clear') {
        ctx.save();
        ctx.globalAlpha = intensity;
        if (gameState.weather === 'rain') {
            ctx.fillStyle = 'rgba(0, 0, 100, 0.2)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr); // Fix fill size
            ctx.strokeStyle = 'rgba(120, 140, 255, 0.6)';
            ctx.lineWidth = 1;
            const dropCount = Math.floor(200 * intensity);
            for (let i = 0; i < dropCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                const len = 10 + Math.random() * 10;
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + len); ctx.stroke();
            }
        }
        else if (gameState.weather === 'snow') {
            ctx.fillStyle = 'rgba(200, 200, 220, 0.15)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.fillStyle = 'white';
            const flakeCount = Math.floor(150 * intensity);
            for (let i = 0; i < flakeCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                const size = Math.random() * 2 + 1;
                ctx.fillRect(rx, ry, size, size);
            }
        }
        else if (gameState.weather === 'storm') {
            ctx.fillStyle = 'rgba(10, 10, 30, 0.4)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            const dropCount = Math.floor(300 * intensity);
            for (let i = 0; i < dropCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 15); ctx.stroke();
            }
            if (Math.random() < 0.05 * intensity) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            }
        }
        else if (gameState.weather === 'fog') {
            ctx.fillStyle = `rgba(200, 200, 200, ${0.5 * intensity})`;
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
        ctx.restore();
    }

    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.draw(ctx, startX, startY);
    }

    if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
        const bosses = gameState.instancedEnemies.filter(e => e.isBoss);
        if (bosses.length > 0) {
            let activeBoss = bosses[0];
            let minDist = Infinity;
            bosses.forEach(b => {
                const d = Math.sqrt(Math.pow(b.x - gameState.player.x, 2) + Math.pow(b.y - gameState.player.y, 2));
                if (d < minDist) {
                    minDist = d;
                    activeBoss = b;
                }
            });
            if (minDist < 20 || bosses.length === 1) {
                const barWidth = (canvas.width / dpr) * 0.6;
                const barHeight = 20;
                const barX = ((canvas.width / dpr) - barWidth) / 2;
                const barY = 40;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY - 20, barWidth, barHeight + 20);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(activeBoss.name, (canvas.width / dpr) / 2, barY - 5);

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY, barWidth, barHeight);

                const healthPercent = Math.max(0, activeBoss.health / activeBoss.maxHealth);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * healthPercent, barHeight - 4);

                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                ctx.fillText(`${activeBoss.health} / ${activeBoss.maxHealth}`, (canvas.width / dpr) / 2, barY + 14);
            }
        }
    }

    ctx.restore();
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
            email: auth.currentUser.email,
            // Sync Companion Position
            companion: gameState.player.companion ? {
                tile: gameState.player.companion.tile,
                name: gameState.player.companion.name,
                x: gameState.player.companion.x, // Sync X
                y: gameState.player.companion.y  // Sync Y
            } : null
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
    const playerX = gameState.player.x;
    const playerY = gameState.player.y;
    const searchRadius = 25;
    const searchDistSq = searchRadius * searchRadius;
    const HEARING_DISTANCE_SQ = 15 * 15;

    let nearestEnemyDir = null;
    let minDist = Infinity; 
    let multiPathUpdate = {};
    let movesQueued = false;
    const processedIdsThisFrame = new Set();

    // 1. Gather candidates from local buckets
    const activeEnemyIds = [];
    const pChunkX = Math.floor(playerX / SPATIAL_CHUNK_SIZE);
    const pChunkY = Math.floor(playerY / SPATIAL_CHUNK_SIZE);

    for (let y = pChunkY - 1; y <= pChunkY + 1; y++) {
        for (let x = pChunkX - 1; x <= pChunkX + 1; x++) {
            const key = `${x},${y}`;
            if (gameState.enemySpatialMap.has(key)) {
                gameState.enemySpatialMap.get(key).forEach(id => activeEnemyIds.push(id));
            }
        }
    }

    // Helper: Valid path check for overworld
    const isValidMove = (tx, ty, enemyType) => {
        const t = chunkManager.getTile(tx, ty);
        if (t === '~') return false; // Water blocks most
        if (['.', 'F', 'd', 'D', '≈'].includes(t)) return true;
        if (t === '^') {
            const climbers = ['Y', '🐲', 'Ø', 'g', 'o', '🦇', '🦅'];
            return climbers.includes(enemyType);
        }
        return false;
    };

    for (const enemyId of activeEnemyIds) {
        if (processedIdsThisFrame.has(enemyId)) continue;

        const enemy = gameState.sharedEnemies[enemyId];
                // --- SAFETY CHECK ---
        // If enemy is missing or coords are invalid, skip it (don't crash the loop)
        if (!enemy || typeof enemy.x !== 'number' || typeof enemy.y !== 'number') {
            continue;
        }

        const distSq = Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2);
        if (distSq > searchDistSq) continue;

        // --- AI LOGIC ---
        let chaseChance = 0.20;
        if (distSq < 400) chaseChance = 0.85; // Close range
        if (distSq < 100) chaseChance = 1.00; // Aggressive

        if (Math.random() < 0.80) { // 80% chance to act per turn
            let dirX = 0, dirY = 0;
            let isChasing = false;

            if (Math.random() < chaseChance) {
                dirX = Math.sign(playerX - enemy.x);
                dirY = Math.sign(playerY - enemy.y);
                isChasing = true;
            } else {
                dirX = Math.floor(Math.random() * 3) - 1;
                dirY = Math.floor(Math.random() * 3) - 1;
            }

            if (dirX === 0 && dirY === 0) continue;

            let finalX = enemy.x + dirX;
            let finalY = enemy.y + dirY;
            let canMove = false;

            // Simple collision check with world terrain
            if (isValidMove(finalX, finalY, enemy.tile)) {
                canMove = true;
            } 
            // Pathfinding "slide" (if diagonal blocked, try cardinal)
            else if (isChasing) {
                if (dirX !== 0 && isValidMove(enemy.x + dirX, enemy.y, enemy.tile)) {
                    finalX = enemy.x + dirX; finalY = enemy.y; canMove = true;
                } else if (dirY !== 0 && isValidMove(enemy.x, enemy.y + dirY, enemy.tile)) {
                    finalX = enemy.x; finalY = enemy.y + dirY; canMove = true;
                }
            }

            if (canMove) {
                // Combat Check
                if (finalX === playerX && finalY === playerY) {
                    const dmg = Math.max(1, enemy.attack - (gameState.player.defenseBonus || 0));
                    gameState.player.health -= dmg;
                    gameState.screenShake = 10;
                    logMessage(`A ${enemy.name} attacks you for ${dmg} damage!`);
                    triggerStatFlash(statDisplays.health, false);
                    if (gameState.player.health <= 0) handlePlayerDeath();
                    processedIdsThisFrame.add(enemyId);
                    continue; 
                }

                // --- EXECUTE MOVE & SYNC BUCKETS ---
                const newId = `overworld:${finalX},${-finalY}`;
                
                // If another enemy just moved into this exact coordinate this turn, skip
                if (gameState.sharedEnemies[newId] || multiPathUpdate[`worldEnemies/${newId}`]) continue;

                const updatedEnemy = { ...enemy, x: finalX, y: finalY };
                if (updatedEnemy._processedThisTurn) delete updatedEnemy._processedThisTurn;

                // 1. Prepare Firebase Batch
                multiPathUpdate[`worldEnemies/${newId}`] = updatedEnemy;
                multiPathUpdate[`worldEnemies/${enemyId}`] = null;

                // 2. Update Local "sharedEnemies" (Snappy Visuals)
                delete gameState.sharedEnemies[enemyId];
                gameState.sharedEnemies[newId] = updatedEnemy;

                // 3. CRITICAL: Update Spatial Map Buckets immediately
                // This prevents the enemy from "vanishing" from the AI loop
                updateSpatialMap(enemyId, enemy.x, enemy.y, null, null); // Remove old
                updateSpatialMap(newId, null, null, finalX, finalY);     // Add new

                processedIdsThisFrame.add(newId);
                movesQueued = true;

                // Intuition logic
                if (distSq < minDist && distSq < HEARING_DISTANCE_SQ) {
                    minDist = distSq;
                    nearestEnemyDir = { x: Math.sign(finalX - playerX), y: Math.sign(finalY - playerY) };
                }
            }
        }
    }

    if (movesQueued) {
        rtdb.ref().update(multiPathUpdate).catch(err => console.error("AI Sync Error:", err));
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
    const player = gameState.player;

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

        // --- 3. DAMAGE STATUS EFFECTS ---
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
                if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                    chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                }
                map[enemy.y][enemy.x] = generateEnemyLoot(player, enemy);
                return;
            }
            if (enemy.poisonTurns === 0) logMessage(`The ${enemy.name} is no longer poisoned.`);
        }

        // --- 4. CALCULATE DISTANCE ---
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // --- 5. DORMANT CHECK ---
        // If enemy is > 25 tiles away, they don't move/act.
        if (dist > 25) return;

        // --- 6. BOSS & ELITE BEHAVIORS ---
        if (enemy.isBoss) {
            // Boss Immunity
            if ((enemy.poisonTurns > 0 || enemy.rootTurns > 0) && Math.random() < 0.5) {
                enemy.poisonTurns = 0; enemy.rootTurns = 0;
                logMessage(`The ${enemy.name} shrugs off your magic!`);
            }

            // --- BOSS ENRAGE PHASES ---
            if (enemy.health < enemy.maxHealth * 0.5 && !enemy.hasEnraged) {
                enemy.hasEnraged = true; // Ensure it only happens once

                // 1. NECROMANCER LORD: Army of the Dead
                if (enemy.name.includes("Necromancer")) {
                    logMessage(`The ${enemy.name} screams! "ARISE, MY SERVANTS!"`);
                    gameState.screenShake = 20;

                    // Spawn 3 Skeletons around him
                    const offsets = [[-1, -1], [1, -1], [0, 1], [-1, 1], [1, 1]];
                    let spawned = 0;
                    for (let ofs of offsets) {
                        if (spawned >= 3) break;
                        const sx = enemy.x + ofs[0];
                        const sy = enemy.y + ofs[1];
                        if (isWalkable(sx, sy)) {
                            map[sy][sx] = 's';
                            const t = ENEMY_DATA['s'];
                            // Create scaled minion
                            gameState.instancedEnemies.push({
                                id: `${gameState.currentCaveId}:minion_${Date.now()}_${spawned}`,
                                x: sx, y: sy, tile: 's', name: "Enraged Skeleton",
                                health: t.maxHealth, maxHealth: t.maxHealth,
                                attack: t.attack + 1, defense: t.defense, xp: 5
                            });
                            ParticleSystem.createExplosion(sx, sy, '#a855f7'); // Purple smoke
                            spawned++;
                        }
                    }
                }

                // 2. VOID DEMON: Reality Shift
                else if (enemy.name.includes("Demon") || enemy.tile === 'D') {
                    logMessage(`The ${enemy.name} roars and shatters reality!`);
                    gameState.screenShake = 30;

                    // Teleport PLAYER to a random spot in the room
                    let teleported = false;
                    for (let i = 0; i < 10; i++) {
                        const tx = player.x + (Math.floor(Math.random() * 10) - 5);
                        const ty = player.y + (Math.floor(Math.random() * 10) - 5);
                        if (isWalkable(tx, ty)) {
                            player.x = tx;
                            player.y = ty;
                            teleported = true;
                            break;
                        }
                    }

                    if (teleported) {
                        logMessage("You are thrown through the void!");
                        ParticleSystem.createExplosion(player.x, player.y, '#a855f7');
                        gameState.isAiming = false;
                    }

                    // Buff the Demon
                    enemy.attack += 2;
                    logMessage(`The ${enemy.name} grows stronger!`);
                }

                return; // Enrage consumes the turn
            }

            // Boss Summon (20% chance if close)
            if (dist < 10 && Math.random() < 0.20) {
                const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (let ofs of offsets) {
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
            if (enemy.health < enemy.maxHealth * 0.25 && Math.random() < 0.25) {
                const tx = Math.max(1, Math.min(map[0].length - 2, enemy.x + (Math.floor(Math.random() * 10) - 5)));
                const ty = Math.max(1, Math.min(map.length - 2, enemy.y + (Math.floor(Math.random() * 10) - 5)));
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
            if (dist > 1.5 && Math.random() < 0.20) {
                const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
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

        // --- 6.5 TELEGRAPH MECHANIC (Bosses & Casters) ---

        // A. EXECUTE PENDING ATTACKS (The Boom)
        if (enemy.pendingAttacks && enemy.pendingAttacks.length > 0) {
            let hitPlayer = false;

            enemy.pendingAttacks.forEach(tile => {
                // Visual explosion
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createExplosion(tile.x, tile.y, '#ef4444', 8);
                }

                // Check collision with player
                if (tile.x === player.x && tile.y === player.y) {
                    const dmg = Math.floor(enemy.attack * 1.5); // 150% Damage
                    player.health -= dmg;
                    gameState.screenShake = 15;
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`You are caught in the ${enemy.name}'s blast! (-${dmg} HP)`);
                    hitPlayer = true;
                }
            });

            if (!hitPlayer) {
                logMessage(`The ${enemy.name}'s attack strikes the ground!`);
            }

            // Clear attacks and consume turn
            enemy.pendingAttacks = null;

            // --- DEATH CHECK ---
            if (handlePlayerDeath()) return;

            return; // Turn ends after firing
        }

        // B. PREPARE NEW ATTACK (The Warning)
        // 20% chance for Bosses/Mages to start a telegraph if player is in range
        const canTelegraph = enemy.isBoss || enemy.tile === 'm' || enemy.tile === 'D' || enemy.tile === '🐲';

        if (canTelegraph && dist < 6 && Math.random() < 0.20) {
            enemy.pendingAttacks = [];

            // Pattern 1: The "Cross" (Mages/Demons)
            if (enemy.tile === 'm' || enemy.tile === 'D') {
                logMessage(`The ${enemy.name} gathers dark energy...`);
                // Target player's current spot + adjacent
                enemy.pendingAttacks.push({ x: player.x, y: player.y });
                enemy.pendingAttacks.push({ x: player.x + 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x - 1, y: player.y });
                enemy.pendingAttacks.push({ x: player.x, y: player.y + 1 });
                enemy.pendingAttacks.push({ x: player.x, y: player.y - 1 });
            }
            // Pattern 2: The "Breath" (Dragons/Bosses)
            else {
                logMessage(`The ${enemy.name} takes a deep breath!`);
                // 3x3 area centered on player
                for (let ty = -1; ty <= 1; ty++) {
                    for (let tx = -1; tx <= 1; tx++) {
                        enemy.pendingAttacks.push({ x: player.x + tx, y: player.y + ty });
                    }
                }
            }

            return; // Turn ends (Charging up)
        }

        // --- 7. COMBAT LOGIC ---

        // Melee Attack (Range 1)
        if (distSq <= 2) {
            const armorDefense = player.equipment.armor ? player.equipment.armor.defense : 0;
            const baseDefense = Math.floor(player.dexterity / 3);
            const buffDefense = player.defenseBonus || 0;
            const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
            const totalDefense = baseDefense + armorDefense + buffDefense + (player.constitution * 0.1);

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
                    gameState.screenShake = 10; // Shake intensity
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} hits you for {red:${dmg}} damage!`);
                    ParticleSystem.createFloatingText(player.x, player.y, `-${dmg}`, '#ef4444');

                    // --- DEATH CHECK ---
                    if (handlePlayerDeath()) return;
                }
                // Thorns Reflect
                if (player.thornsValue > 0) {
                    enemy.health -= player.thornsValue;
                    logMessage(`The ${enemy.name} takes ${player.thornsValue} thorn damage!`);
                    if (enemy.health <= 0) {
                        registerKill(enemy);
                        gameState.instancedEnemies = gameState.instancedEnemies.filter(e => e.id !== enemy.id);
                        if (gameState.mapMode === 'dungeon' && chunkManager.caveEnemies[gameState.currentCaveId]) {
                            chunkManager.caveEnemies[gameState.currentCaveId] = chunkManager.caveEnemies[gameState.currentCaveId].filter(e => e.id !== enemy.id);
                        }
                        map[enemy.y][enemy.x] = generateEnemyLoot(player, enemy);
                    }
                }
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
                    gameState.screenShake = 10; // Shake intensity
                    triggerStatFlash(statDisplays.health, false);
                    logMessage(`The ${enemy.name} casts ${spellName} for {red:${dmg}} damage!`);

                    if (enemy.inflicts === 'frostbite') player.frostbiteTurns = 5;
                    if (enemy.inflicts === 'poison') player.poisonTurns = 5;

                    // --- DEATH CHECK ---
                    if (handlePlayerDeath()) return;
                }
            }
            return;
        }

        // --- 8. NEW DYNAMIC MOVEMENT LOGIC (AI) ---

        let desiredX = 0;
        let desiredY = 0;
        let moveType = 'wander';

        // A. KITING LOGIC (For Casters/Ranged)
        if (enemy.caster) {
            if (dist < 3) {
                moveType = 'flee'; // Too close! Run!
            } else if (dist < 6) {
                moveType = 'idle'; // Good range. Stand ground and cast.
            } else {
                moveType = 'chase'; // Too far. Get closer.
            }
        }
        // B. STANDARD MELEE LOGIC
        else {
            // Calculate Chase Probability based on distance
            let chaseChance = 0.20; // 20% Base chance (Wandering/Idle)
            if (dist < 15) chaseChance = 0.50; // 50% if somewhat close
            if (dist < 8) chaseChance = 0.95; // 95% Aggressive chase if very close

            if (Math.random() < chaseChance) {
                moveType = 'chase';
            }
        }

        // C. FEAR LOGIC (Overrides everything)
        // Fleeing Override (Low Health + Not Fearless)
        const isFearless = ['s', 'Z', 'D', 'v', 'a', 'm'].includes(enemy.tile) || enemy.isBoss;
        if (!isFearless && (enemy.health < enemy.maxHealth * 0.25)) {
            moveType = 'flee';
        }

        // --- EXECUTE MOVE TYPE ---
        if (moveType === 'idle') {
            // Do nothing, just wait for combat turn
            return;
        } else if (moveType === 'flee') {
            desiredX = -Math.sign(dx);
            desiredY = -Math.sign(dy);
            // If directly inline, pick a diagonal escape to avoid getting stuck in corners
            if (desiredX === 0) desiredX = Math.random() < 0.5 ? 1 : -1;
            if (desiredY === 0) desiredY = Math.random() < 0.5 ? 1 : -1;
        } else if (moveType === 'chase') {
            desiredX = Math.sign(dx);
            desiredY = Math.sign(dy);
        } else {
            // Wander: Random direction
            desiredX = Math.floor(Math.random() * 3) - 1;
            desiredY = Math.floor(Math.random() * 3) - 1;
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
                    // Reduce log spam: only log flee occasionally
                    if (Math.random() < 0.2) logMessage(`The ${enemy.name} retreats!`);
                }
            }
        }
    });

    return nearestEnemyDir;
}

/**
 * Asynchronously runs the AI turns for shared maps.
 * Uses a Firebase RTDB Transaction to ensure only ONE client
 * runs the AI per interval. Includes logic to break stale locks.
 */
async function runSharedAiTurns() {
    const now = Date.now();
    const AI_INTERVAL = 150; // Match action cooldown
    const STALE_TIMEOUT = 5000; // 5 seconds - if heartbeat is older than this, steal it

    const heartbeatRef = rtdb.ref('worldState/aiHeartbeat');

    try {
        const result = await heartbeatRef.transaction((lastHeartbeat) => {
            // 1. If no heartbeat exists, claim it
            if (!lastHeartbeat) return now;

            // 2. If the lock is "stale" (old host crashed/lagged out), claim it
            if (now - lastHeartbeat > STALE_TIMEOUT) return now;

            // 3. Standard interval check
            if (now - lastHeartbeat >= AI_INTERVAL) return now;

            // 4. Otherwise, abort (someone else ran it recently)
            return;
        });

        // If we won the race (committed = true), run the logic
        if (result.committed) {
            const nearestEnemyDir = await processOverworldEnemyTurns();

            // Client-side intuition feedback
            if (nearestEnemyDir) {
                const player = gameState.player;
                // Chance to hear/sense enemies based on stats
                const intuitChance = Math.min(player.intuition * 0.005, 0.5);
                if (Math.random() < intuitChance) {
                    const dirString = getDirectionString(nearestEnemyDir);
                    logMessage(`You sense a hostile presence to the ${dirString}!`);
                }
            }
        }
    } catch (err) {
        console.error("AI Heartbeat Transaction failed:", err);
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

function handlePlayerDeath() {
    if (gameState.player.health > 0) return false; // Not dead

    const player = gameState.player;

    // 1. Visuals & Logs
    // Ensure health is clamped to 0 so the game loop knows we are dead
    player.health = 0; 
    logMessage("{red:You have perished!}");
    triggerStatFlash(statDisplays.health, false);

    // 2. Remove Equipment Stats (So we don't carry buffs over)
    if (player.equipment.weapon) applyStatBonuses(player.equipment.weapon, -1);
    if (player.equipment.armor) applyStatBonuses(player.equipment.armor, -1);

    // 3. CORPSE SCATTER LOGIC
    // (This drops your inventory on the ground where you died)
    const deathX = player.x;
    const deathY = player.y;
    const pendingUpdates = {};

    for (let i = player.inventory.length - 1; i >= 0; i--) {
        const item = player.inventory[i];
        let placed = false;
        
        // Try to place item in a 3x3 grid around death spot
        for (let r = 0; r <= 2 && !placed; r++) {
            for (let dy = -r; dy <= r && !placed; dy++) {
                for (let dx = -r; dx <= r && !placed; dx++) {
                    const tx = deathX + dx;
                    const ty = deathY + dy;
                    let tile;

                    // Check terrain validity
                    if (gameState.mapMode === 'overworld') tile = chunkManager.getTile(tx, ty);
                    else if (gameState.mapMode === 'dungeon') tile = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx];
                    else tile = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx];

                    if (tile === '.') {
                        if (gameState.mapMode === 'overworld') {
                            const cX = Math.floor(tx / chunkManager.CHUNK_SIZE);
                            const cY = Math.floor(ty / chunkManager.CHUNK_SIZE);
                            const cId = `${cX},${cY}`;
                            const lX = (tx % chunkManager.CHUNK_SIZE + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
                            const lY = (ty % chunkManager.CHUNK_SIZE + chunkManager.CHUNK_SIZE) % chunkManager.CHUNK_SIZE;
                            const lKey = `${lX},${lY}`;
                            if (!pendingUpdates[cId]) pendingUpdates[cId] = {};
                            pendingUpdates[cId][lKey] = item.tile;
                        } else if (gameState.mapMode === 'dungeon') {
                            chunkManager.caveMaps[gameState.currentCaveId][ty][tx] = item.tile;
                        } else {
                            chunkManager.castleMaps[gameState.currentCastleId][ty][tx] = item.tile;
                        }
                        placed = true;
                    }
                }
            }
        }
    }

    // Apply map updates
    if (gameState.mapMode === 'overworld') {
        for (const [cId, updates] of Object.entries(pendingUpdates)) {
            db.collection('worldState').doc(cId).set(updates, { merge: true });
        }
    }

    // 4. CALCULATE PENALTIES (But do not move player yet)
    const goldLost = Math.floor(player.coins / 2);
    player.coins -= goldLost;
    
    // Clear inventory immediately so it can't be accessed while dead
    player.inventory = []; 
    player.equipment = { weapon: { name: 'Fists', damage: 0 }, armor: { name: 'Simple Tunic', defense: 0 } };

    // 5. Update Modal UI
    document.getElementById('finalLevelDisplay').textContent = `Level: ${player.level}`;
    document.getElementById('finalCoinsDisplay').textContent = `Gold lost: ${goldLost}`;

    // 6. Show Modal
    gameOverModal.classList.remove('hidden');

    // 7. Save "Dead" State
    // We save health: 0 and current X/Y. 
    // This ensures if they refresh the page, they are still dead.
    playerRef.set(player);

    return true;
}

function endPlayerTurn() {
    
    let updates = {}; // Defined at the top to catch status changes

    // --- LIGHT SURVIVAL MECHANICS ---
    const player = gameState.player;

    // Base drain rates (Standard difficulty)
    let hungerDrain = 0.02;
    let thirstDrain = 0.05;

    // Grace Period (Level 1-2)
    if (player.level < 3) {
        hungerDrain = 0.005;
        thirstDrain = 0.01;
    }

    // --- LICH: UNDEATH ---
    if (!player.talents || !player.talents.includes('undeath')) {
        player.hunger = Math.max(0, player.hunger - hungerDrain);
        player.thirst = Math.max(0, player.thirst - thirstDrain);
    }

    // --- ENVIRONMENTAL HAZARDS ---
    let currentTile;
    if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        currentTile = (map && map[player.y]) ? map[player.y][player.x] : '.';
    }
    else if (gameState.mapMode === 'castle') {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        currentTile = (map && map[player.y]) ? map[player.y][player.x] : '.';
    }
    else {
        currentTile = chunkManager.getTile(player.x, player.y);
    }

    const inDungeon = gameState.mapMode === 'dungeon';

    // 1. LAVA (Volcano Biome)
    if (inDungeon && gameState.currentCaveTheme === 'FIRE' && (currentTile === '~' || currentTile === '≈')) {
        const hasArmor = player.equipment.armor && player.equipment.armor.name.includes('Dragonscale');
        const hasPotion = player.fireResistTurns > 0;

        if (!hasArmor && !hasPotion) {
            logMessage("The lava burns you! (2 Dmg)");
            player.health -= 2;
            gameState.screenShake = 10;
            triggerStatFlash(statDisplays.health, false);
            ParticleSystem.createFloatingText(player.x, player.y, "BURN", "#ef4444");

            if (handlePlayerDeath()) return;
        }
    }

    // 2. DROWNING (Sunken Temple / Deep Water)
    if (currentTile === '~') {
        const hasGills = player.waterBreathingTurns > 0;
        const isBoating = player.isBoating;

        if (!hasGills && !isBoating) {
            if (player.waterBreathingTurns === 0 && updates.waterBreathingTurns === 0) {
                logMessage("Your magical gills fade away...");
            }
            logMessage("The deep water swallows you whole!");
            logMessage("You have drowned.");

            player.health = 0;
            ParticleSystem.createFloatingText(player.x, player.y, "☠️", "#1e3a8a");

            handlePlayerDeath();
            return;
        }
    }

    // --- 1. THE BONUSES (Vitality) ---
    let regenBonus = false;

    if (player.hunger > 80 && player.health < player.maxHealth && gameState.playerTurnCount % 5 === 0) {
        player.health++;
        logMessage("Well Fed: You regenerate 1 Health.");
        triggerStatFlash(statDisplays.health, true);
        ParticleSystem.createFloatingText(player.x, player.y, "♥", "#22c55e");
        regenBonus = true;
    }

    if (player.thirst > 80 && player.stamina < player.maxStamina && gameState.playerTurnCount % 3 === 0) {
        player.stamina++;
        logMessage("Hydrated: You regenerate 1 Stamina.");
        triggerStatFlash(statDisplays.stamina, true);
        regenBonus = true;
    }

    // --- 2. THE PENALTIES (Weakness) ---
    if (player.hunger <= 0 && gameState.playerTurnCount % 10 === 0) {
        logMessage("Your stomach growls. You feel weak. (No HP Regen)");
    }
    if (player.thirst <= 0 && gameState.playerTurnCount % 10 === 0) {
        logMessage("Your throat is parched. You feel sluggish. (No Stamina Regen)");
    }

    if (gameState.mapMode === 'overworld') {
        wakeUpNearbyEnemies();
    }

    // --- UPDATED AMBUSH LOGIC ---
    // Was: % 60 and < 0.20 (Avg every 300 turns)
    // Now: % 150 and < 0.05 (Avg every 3000 turns) -> Much rarer!
     // --- UPDATED AMBUSH LOGIC ---
    if (gameState.mapMode === 'overworld' && gameState.playerTurnCount % 150 === 0) {
        
        // --- 1. CALCULATE SAFETY METRICS ---
        const distFromSpawn = Math.sqrt(player.x * player.x + player.y * player.y);
        
        // --- 2. APPLY SAFEGUARDS ---
        // Rule A: No ambushes within 50 tiles of the village (Safe Zone)
        // Rule B: No ambushes if Level 1 (Newbie Grace Period)
        if (distFromSpawn > 50 && player.level >= 2) {

            // 5% Chance (1 in 20)
            if (Math.random() < 0.05) { 
                logMessage("{red:AMBUSH!} Enemies are closing in!");
                gameState.screenShake = 15;
                AudioSystem.playHit();

                const currentTile = chunkManager.getTile(player.x, player.y);
                let ambushType = 'b';
                if (currentTile === 'F') ambushType = 'w';
                if (currentTile === 'd') ambushType = 's';
                if (currentTile === 'D') ambushType = '🦂';

                // Reduce spawn count slightly (3 instead of 4) for fairness
                const offsets = [[-4, 0], [4, 0], [0, -4]]; 

                offsets.forEach(offset => {
                    const tx = player.x + offset[0] + Math.floor(Math.random() * 3) - 1;
                    const ty = player.y + offset[1] + Math.floor(Math.random() * 3) - 1;

                    const enemyData = window.ENEMY_DATA[ambushType]; // Use window. to be safe
                    const enemyId = `overworld:${tx},${-ty}`;
                    
                    // Use our safe scaling logic
                    const scaledStats = getScaledEnemy(enemyData, tx, ty);
                    
                    // Ensure we don't overwrite an existing enemy
                    if (!gameState.sharedEnemies[enemyId]) {
                        const newEnemy = { 
                            ...scaledStats, 
                            tile: ambushType, 
                            x: tx, 
                            y: ty,
                            spawnTime: Date.now() 
                        };

                        rtdb.ref(`worldEnemies/${enemyId}`).set(newEnemy);
                        
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createExplosion(tx, ty, '#ef4444');
                        }
                    }
                });
            }
        }
    }

    gameState.playerTurnCount++;
    updateWeather();

    // --- STORM LIGHTNING STRIKES ---
    if (gameState.mapMode === 'overworld' && gameState.weather === 'storm') {
        if (Math.random() < 0.15) {
            const rx = gameState.player.x + Math.floor(Math.random() * 20) - 10;
            const ry = gameState.player.y + Math.floor(Math.random() * 20) - 10;

            logMessage("⚡ CRACK! Lightning strikes nearby!");
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(rx, ry, '#facc15', 10);
            }

            if (rx === gameState.player.x && ry === gameState.player.y) {
                logMessage("You were struck by lightning!! (10 Dmg)");
                gameState.player.health -= 10;
                gameState.screenShake = 10;
                triggerStatFlash(statDisplays.health, false);
            }
            else {
                applySpellDamage(rx, ry, 10, 'thunderbolt');
            }
        }
    }

    // --- 1. Tick Status Effects ---
    if (player.poisonTurns > 0) {
        player.poisonTurns--;
        player.health -= 1;
        gameState.screenShake = 10;
        logMessage("You take 1 poison damage...");
        triggerStatFlash(statDisplays.health, false);
        ParticleSystem.createFloatingText(player.x, player.y, "-1", "#22c55e");

        updates.health = player.health;
        updates.poisonTurns = player.poisonTurns;
        if (player.poisonTurns === 0) {
            logMessage("The poison has worn off.");
        }
    }

    if (player.waterBreathingTurns > 0) {
        player.waterBreathingTurns--;
        updates.waterBreathingTurns = player.waterBreathingTurns;

        if (player.waterBreathingTurns === 3) {
            logMessage("Warning: Your gills are starting to close up! (3 turns left)");
        }
        if (player.waterBreathingTurns === 0) {
            logMessage("Your gills disappear.");
        }
    }

    if (player.frostbiteTurns > 0) {
        player.frostbiteTurns--;
        player.stamina = Math.max(0, player.stamina - 2);
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
        renderEquipment();
    }

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
            renderHotbar();
        }
    }

    // --- CANDLELIGHT TIMER ---
    if (player.candlelightTurns > 0) {
        player.candlelightTurns--;
        updates.candlelightTurns = player.candlelightTurns;
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
        gameState.player.defenseBonusTurns--;

        if (gameState.player.defenseBonusTurns === 0) {
            gameState.player.defenseBonus = 0;
            logMessage("You are no longer bracing.");
            playerRef.update({
                defenseBonus: 0,
                defenseBonusTurns: 0
            });
        } else {
            playerRef.update({
                defenseBonusTurns: gameState.player.defenseBonusTurns,
                ...updates
            });
        }
        renderEquipment();
    }

    if (gameState.player.shieldTurns > 0) {
        gameState.player.shieldTurns--;

        if (gameState.player.shieldTurns === 0) {
            gameState.player.shieldValue = 0;
            logMessage("Your Arcane Shield fades.");
            playerRef.update({
                shieldValue: 0,
                shieldTurns: 0
            });
        } else {
            playerRef.update({
                shieldTurns: gameState.player.shieldTurns,
                ...updates
            });
        }
        renderStats();
    }

    processFriendlyTurns();
    runCompanionTurn();
    runSharedAiTurns();

    processEnemyTurns(); // <--- This activates dungeon/castle enemies!

    // We merge the specific status updates (poison, buffs) with the core stats.
    // This ensures XP, Quests, and Health are saved together, preventing the reset bug.
    const finalUpdates = {
        ...updates, // Include the specific changes calculated above (poison, cooldowns, etc.)

        // Core Vitals (Save these every turn to prevent desync)
        health: gameState.player.health,
        stamina: gameState.player.stamina,
        mana: gameState.player.mana,
        psyche: gameState.player.psyche,

        // Progression (Moved here from grantXp/registerKill)
        xp: gameState.player.xp,
        level: gameState.player.level,
        statPoints: gameState.player.statPoints,
        talentPoints: gameState.player.talentPoints || 0,
        killCounts: gameState.player.killCounts || {},
        quests: gameState.player.quests || {},

        // Position
        x: gameState.player.x,
        y: gameState.player.y
    };

    playerRef.update(finalUpdates);

    // --- PALADIN: HOLY AURA ---
    if (player.talents && player.talents.includes('holy_aura')) {
        if (player.companion && player.companion.hp < player.companion.maxHp) {
            player.companion.hp = Math.min(player.companion.maxHp, player.companion.hp + 2);
            if (Math.random() < 0.1) logMessage("Holy Aura heals your companion.");
        }
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
    } else {
        // --- TELEPORT SAFETY FALLBACK ---
        // If we don't know where we came from, send player to spawn (0,0)
        // This prevents getting stuck in walls or oceans at dungeon coordinates (e.g. 15,15)
        logMessage("You lost your bearings in the dark...");
        logMessage("...and found your way back to the Village.");
        gameState.player.x = 0;
        gameState.player.y = 0;
    }

    gameState.mapMode = 'overworld';
    gameState.mapDirty = true; 

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
        { x: 0, y: 0 },   // Standing on
        { x: 0, y: -1 },  // North
        { x: 0, y: 1 },   // South
        { x: -1, y: 0 },  // West
        { x: 1, y: 0 }    // East
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
        // Allow drinking from magic fountains even if thirst is full
        if (waterType !== 'magic' && player.thirst >= player.maxThirst) {
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
            // Optional: Check if actually needed
            if (player.thirst >= player.maxThirst && player.stamina >= player.maxStamina) {
                logMessage("The fountain hums, but you are already fully revitalized.");
                return; // Don't waste a turn
            }

            player.thirst = player.maxThirst;
            player.stamina = player.maxStamina;
            logMessage("The magic water revitalizes you! (Full Thirst & Stamina)");
            triggerStatAnimation(document.getElementById('thirstDisplay'), 'stat-pulse-blue');
            triggerStatAnimation(document.getElementById('staminaDisplay'), 'stat-pulse-yellow'); // Add visual for stamina too
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

        case 'purge':
            // 1. Clear local memory
            chunkManager.loadedChunks = {};
            chunkManager.worldState = {};
            gameState.exploredChunks = new Set();

            // 2. Clear Firebase World State (This deletes ALL map data)
            logMessage("Purging world map... (This may take a moment)");
            const batch = db.batch();
            // Note: Deleting collections client-side is hard in Firestore. 
            // Instead, we will just force a re-render of the CURRENT chunk locally
            // and overwrite it.

            chunkManager.loadedChunks = {}; // Clear local cache
            chunkManager.worldState = {};   // Clear state buffer

            // Force regenerate current location
            const cX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
            const cY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
            const chunkId = `${cX},${cY}`;

            // Delete the specific document for this chunk from Firebase
            db.collection('worldState').doc(chunkId).delete().then(() => {
                logMessage("Current chunk purged. Regenerating...");
                render();
            });
            break;

        case 'nuke':
            logMessage("NUKE: Wiping all enemies from the map...");
            rtdb.ref('worldEnemies').remove().then(() => {
                logMessage("Map cleared. Enemies will respawn naturally.");
                gameState.sharedEnemies = {}; // Clear local state
                wokenEnemyTiles.clear(); // Reset spawn memory
                render();
            });
            break;

        case 'who':
            let onlineList = ["You"];
            for (const id in otherPlayers) {
                const p = otherPlayers[id];
                // Sanitize the name before adding it to the list
                const rawName = p.email ? p.email.split('@')[0] : "Unknown";
                const safeName = escapeHtml(rawName);
                
                onlineList.push(`${safeName} (Lvl ${escapeHtml(p.level) || '?'})`);
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

    // 1. Audio Context Resume (Browser Policy)
    if (AudioSystem.ctx && AudioSystem.ctx.state === 'suspended') {
        AudioSystem.ctx.resume();
    }

    // 2. FIX: Robust Safety Check
    // Ensure player is logged in and data exists before doing anything.
    // Also check if gameContainer is visible to prevent moving while in Character Select.
    if (!player_id || !gameState || !gameState.player || gameContainer.classList.contains('hidden')) {
        return;
    }

     // --- ESCAPE KEY UPDATE ---
    if (key === 'Escape') {
        if (!helpModal.classList.contains('hidden')) { helpModal.classList.add('hidden'); return; }
        if (!loreModal.classList.contains('hidden')) { loreModal.classList.add('hidden'); return; }
        // if (!inventoryModal.classList.contains('hidden')) ... (This line is handled by logic below now)
        if (!skillModal.classList.contains('hidden')) { skillModal.classList.add('hidden'); return; }
        if (!craftingModal.classList.contains('hidden')) { craftingModal.classList.add('hidden'); return; }
        if (!settingsModal.classList.contains('hidden')) { settingsModal.classList.add('hidden'); return; } 

        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            logMessage("Aiming canceled.");
            return;
        }
        
        // If in Drop Mode, Cancel Drop Mode but keep Inventory Open
        if (gameState.isDroppingItem) {
            gameState.isDroppingItem = false;
            logMessage("Drop canceled.");
            renderInventory(); // Reset visuals to normal
            return;
        }

        if (gameState.inventoryMode) {
            closeInventoryModal();
            return;
        }
        return;
    }

    // 3. FIX: Allow 'Escape' even if dead
    // This prevents getting stuck in menus after death.
    if (key === 'Escape') {
        if (!helpModal.classList.contains('hidden')) { helpModal.classList.add('hidden'); return; }
        if (!loreModal.classList.contains('hidden')) { loreModal.classList.add('hidden'); return; }
        if (!inventoryModal.classList.contains('hidden')) { closeInventoryModal(); return; }
        if (!skillModal.classList.contains('hidden')) { skillModal.classList.add('hidden'); return; }
        if (!craftingModal.classList.contains('hidden')) { craftingModal.classList.add('hidden'); return; }
        if (!settingsModal.classList.contains('hidden')) { settingsModal.classList.add('hidden'); return; } // Added Settings Modal support

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

    // 4. Dead Check
    // Now that we've handled system keys (Escape), we block gameplay inputs if dead.
    if (gameState.player.health <= 0) return;

    if (key === 'q' || key === 'Q') {
        drinkFromSource();
        return;
    }

    // --- DROP MODE ---

    if (gameState.isDroppingItem) {
        // Pass the key string directly
        handleItemDrop(key);
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
            else if (abilityId === 'shieldBash' || abilityId === 'cleave' || abilityId === 'kick' || abilityId === 'crush') executeMeleeSkill(abilityId, dirX, dirY);
            else if (abilityId === 'quickstep') executeQuickstep(dirX, dirY);
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

     // --- DROP MODE TOGGLE ---
    // If we are in inventory mode and press D
    if (gameState.inventoryMode && (key === 'd' || key === 'D')) {
        if (gameState.player.inventory.length === 0) {
            logMessage("Inventory empty.");
            return;
        }
        
        // Toggle Drop Mode State
        gameState.isDroppingItem = !gameState.isDroppingItem;

        if (gameState.isDroppingItem) {
            logMessage("Drop Mode: Select an item to discard.");
        } else {
            logMessage("Drop Mode cancelled.");
        }

        // Re-render to show red borders (DO NOT CLOSE MODAL)
        renderInventory(); 
        return;
    }

    // --- NUMBER KEYS (1-9) ---
    // This handles both Using and Dropping based on state
    const keyNum = parseInt(key);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        
        // Priority 1: Drop Mode active?
        if (gameState.isDroppingItem) {
            handleItemDrop(key); // Use the string key "1", "2", etc.
            return;
        }

        // Priority 2: Inventory Open? Use Item.
        if (gameState.inventoryMode) {
            useInventoryItem(keyNum - 1);
            return;
        }

        // Priority 3: Normal Hotbar usage
        // Note: Only 1-5 usually used for hotbar, but we check range 1-9 to be safe
        if (keyNum <= 5) {
            useHotbarSlot(keyNum - 1);
            return;
        }
    }

    if (key === 'g' || key === 'G') {
    // 1. Get tile ID
    let tileId;
    if (gameState.mapMode === 'overworld') tileId = `${gameState.player.x},${-gameState.player.y}`;
    else tileId = `${gameState.currentCaveId || gameState.currentCastleId}:${gameState.player.x},${-gameState.player.y}`;

    // 2. Check current tile for lootable items
    const currentTile = (gameState.mapMode === 'overworld') 
        ? chunkManager.getTile(gameState.player.x, gameState.player.y)
        : (gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] : chunkManager.castleMaps[gameState.currentCastleId][gameState.player.y][gameState.player.x]);

    // 3. Trigger pickup if it's an item
    if (ITEM_DATA[currentTile]) {
        // We reuse the move logic's pickup code by faking a "wait" on the spot
        logMessage("You scour the ground for items...");
        attemptMovePlayer(gameState.player.x, gameState.player.y); 
        return;
    } else {
        logMessage("There is nothing here to pick up.");
        return;
    }
}

    // --- MENUS ---
    if (key === 'i' || key === 'I') { openInventoryModal(); return; }
    if (key === 'm' || key === 'M') { openWorldMap(); return; }
    if (key === 'b' || key === 'B') { openSpellbook(); return; }
    if (key === 'k' || key === 'K') { openSkillbook(); return; }
    if (key === 'c' || key === 'C') { openCollections(); return; }
    if (key === 'p' || key === 'P') { openTalentModal(); return; }

    // 1. THROTTLE CHECK & BUFFERING
    const now = Date.now();
    if (now - lastActionTime < ACTION_COOLDOWN) {
        // Only buffer movement keys to prevent menu weirdness
        const moveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];

        if (moveKeys.includes(key)) {
            inputBuffer = key; // Store the intent
        }
        return;
    }

    // If we are executing a move, clear the buffer so we don't double-move later
    inputBuffer = null;

    let newX = gameState.player.x;
    let newY = gameState.player.y;
    let moved = false;
    let acted = false; // Track if we actually did something

    switch (key) {
        case 'ArrowUp': case 'w': case 'W': newY--; moved = true; acted = true; break;
        case 'ArrowDown': case 's': case 'S': newY++; moved = true; acted = true; break;
        case 'ArrowLeft': case 'a': case 'A': newX--; moved = true; acted = true; break;
        case 'ArrowRight': case 'd': case 'D': newX++; moved = true; acted = true; break;
        case 'r': case 'R':
            restPlayer();
            lastActionTime = now; // Update timer
            return;
        case ' ': // Spacebar to skip turn / wait
            logMessage("You wait a moment.");
            endPlayerTurn();
            lastActionTime = now; // Update timer
            return;
    }

    if (moved) {
        lastActionTime = now; // Update timer only if we actually move
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

    // --- FISHING LOGIC ---
    if (itemToUse.name === 'Fishing Rod') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);

        // Check if standing on water (Deep Water or Swamp)
        if (currentTile !== '~' && currentTile !== '≈') {
            logMessage("You need to be standing in water to fish.");
            return;
        }

        // 1. Stamina Check
        if (gameState.player.stamina < 2) {
            logMessage("You are too tired to fish.");
            return;
        }
        gameState.player.stamina -= 2;

        // 2. Calculate Success
        // Base 40% + 2% per Dexterity + 2% per Luck
        const chance = 0.40 + (gameState.player.dexterity * 0.02) + (gameState.player.luck * 0.02);

        logMessage("You cast your line...");

        if (Math.random() < chance) {
            // 3. Loot Table
            const roll = Math.random();
            let catchName = 'Raw Fish';
            let catchTile = '🐟';

            // Rare Treasures (5%)
            if (roll > 0.95) {
                const treasures = [
                    { n: 'Ring of Regeneration', t: '💍r' },
                    { n: 'Ancient Coin', t: '🪙' },
                    { n: 'Empty Bottle', t: '🫙' }
                ];
                const t = treasures[Math.floor(Math.random() * treasures.length)];
                catchName = t.n;
                catchTile = t.t;
                logMessage(`You pull up something heavy... It's a ${catchName}!`);
                grantXp(20);
            }
            // Junk (15%)
            else if (roll < 0.15) {
                catchName = 'Soggy Boot';
                catchTile = '👢s';
                logMessage("Ugh, just an old boot.");
            }
            // Fish (80%)
            else {
                logMessage("You caught a fish!");
                grantXp(5);
            }

            // Add to Inventory
            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                // Find template to get full data
                const template = Object.values(ITEM_DATA).find(i => i.name === catchName);
                gameState.player.inventory.push({
                    name: catchName,
                    type: template ? (template.type || 'junk') : 'junk',
                    quantity: 1,
                    tile: catchTile,
                    // Copy stats if it's equipment
                    defense: template ? template.defense : null,
                    statBonuses: template ? template.statBonuses : null,

                    effect: template ? template.effect : null
                });
            } else {
                logMessage("...but you have no room to keep it, so you throw it back.");
            }
        } else {
            logMessage("...not even a nibble.");
        }

        // Fishing always consumes a turn/stamina, so we mark it used to trigger updates
        itemUsed = true;
    }

    // --- CONSTRUCTIBLES (Walls, Floors) ---
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

    // --- CONSUMABLES (Refactored Logic) ---
    else if (itemToUse.type === 'consumable') {
        if (itemToUse.effect) {
            // Execute the effect and check if it was successful (returns true)
            const consumed = itemToUse.effect(gameState);

            if (consumed) {
                itemToUse.quantity--;
                if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
                itemUsed = true;
            }
        } else {
            logMessage(`You can't use the ${itemToUse.name} right now.`);
        }
    }

    // --- WEAPONS ---
    else if (itemToUse.type === 'weapon') {
        const currentWeapon = gameState.player.inventory.find(i => i.type === 'weapon' && i.isEquipped);

        // Helper to map weapon icons/names to skills
        const getWeaponSkill = (item) => {
            if (!item) return null;
            if (item.name.includes("Hammer") || item.name.includes("Club") || item.tile === '🔨' || item.tile === '🏏') return 'crush';
            if (item.name.includes("Dagger") || item.tile === '†' || item.tile === '🗡️') return 'quickstep';
            if (item.name.includes("Sword") || item.name.includes("Blade") || item.tile === '⚔️' || item.tile === '!') return 'deflect';
            if (item.name.includes("Staff") || item.tile === 'Ψ' || item.tile === '🦯') return 'channel';
            return null;
        };

        // 1. Unequip Current
        if (currentWeapon) {
            applyStatBonuses(currentWeapon, -1);
            currentWeapon.isEquipped = false;

            // Remove old skill
            const oldSkill = getWeaponSkill(currentWeapon);
            if (oldSkill && gameState.player.skillbook[oldSkill]) {
                delete gameState.player.skillbook[oldSkill];
                logMessage(`You unlearned ${SKILL_DATA[oldSkill].name}.`);
            }
        }

        // 2. Equip New (if different)
        if (currentWeapon === itemToUse) {
            gameState.player.equipment.weapon = { name: 'Fists', damage: 0 };
            logMessage(`You unequip the ${itemToUse.name}.`);
        } else {
            itemToUse.isEquipped = true;
            gameState.player.equipment.weapon = itemToUse;
            applyStatBonuses(itemToUse, 1);
            logMessage(`You equip the ${itemToUse.name}.`);

            // Grant new skill
            const newSkill = getWeaponSkill(itemToUse);
            if (newSkill) {
                gameState.player.skillbook[newSkill] = 1; // Level 1 mastery
                logMessage(`Weapon Technique: You learned ${SKILL_DATA[newSkill].name}!`);
                // Auto-assign to hotbar slot 1 for convenience if empty
                if (!gameState.player.hotbar[0]) gameState.player.hotbar[0] = newSkill;
            }
        }
        itemUsed = true;

        // --- ARMOR ---
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

        // --- SPELLBOOKS, SKILLBOOKS, TOOLS ---
    } else if (itemToUse.type === 'spellbook' || itemToUse.type === 'skillbook' || itemToUse.type === 'tool') {
        const player = gameState.player;
        let data = null;
        let learned = false;

        if (itemToUse.type === 'spellbook') {
            data = SPELL_DATA[itemToUse.spellId];
            if (!data) {
                logMessage("Dud item.");
            } else if (player.level < data.requiredLevel) {
                logMessage(`Requires Level ${data.requiredLevel}.`);
            } else {
                player.spellbook[itemToUse.spellId] = (player.spellbook[itemToUse.spellId] || 0) + 1;
                logMessage(player.spellbook[itemToUse.spellId] === 1 ? `Learned ${data.name}!` : `Upgraded ${data.name}!`);
                learned = true;
            }
        } else if (itemToUse.type === 'skillbook') {
            data = SKILL_DATA[itemToUse.skillId];
            if (!data) {
                logMessage("Dud item.");
            } else if (player.level < data.requiredLevel) {
                logMessage(`Requires Level ${data.requiredLevel}.`);
            } else {
                player.skillbook[itemToUse.skillId] = (player.skillbook[itemToUse.skillId] || 0) + 1;
                logMessage(player.skillbook[itemToUse.skillId] === 1 ? `Learned ${data.name}!` : `Upgraded ${data.name}!`);
                learned = true;
            }
        } else {
            // Tools (like Machete/Pickaxe) just exist in inventory
            logMessage(`You examine the ${itemToUse.name}. It looks useful.`);
            // Tools aren't "consumed" on use in the inventory menu
            learned = false;
        }

        if (learned) {
            itemToUse.quantity--;
            if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
            itemUsed = true;
        }

        // --- TOMES (Stat Boosts) ---
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

        // --- BUFF POTIONS ---
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

        // --- TELEPORT SCROLLS ---
    } else if (itemToUse.type === 'teleport') {
        logMessage("Space warps around you...");
        gameState.player.x = 0;
        gameState.player.y = 0;
        exitToOverworld("You vanish and reappear at the village gates.");
        itemToUse.quantity--;
        if (itemToUse.quantity <= 0) gameState.player.inventory.splice(itemIndex, 1);
        itemUsed = true;

        // --- TREASURE MAPS ---
    } else if (itemToUse.type === 'treasure_map') {
        if (!gameState.activeTreasure) {
            const dist = 50 + Math.floor(Math.random() * 100);
            const angle = Math.random() * 2 * Math.PI;
            const tx = Math.floor(gameState.player.x + Math.cos(angle) * dist);
            const ty = Math.floor(gameState.player.y + Math.sin(angle) * dist);
            gameState.activeTreasure = { x: tx, y: ty };

            playerRef.update({ activeTreasure: gameState.activeTreasure });

            logMessage(`The map reveals a hidden mark! Location: (${tx}, ${-ty}).`);
            // Maps are not consumed until the treasure is found (handled in movement logic)
            itemUsed = true;

        } else {
            logMessage(`The map marks a location at (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y}).`);
        }

        // --- JUNK / UNKNOWN ---
    } else {
        logMessage(`You can't use '${itemToUse.name}' right now.`);
    }

    // --- FINAL SAVE & RENDER ---
    if (itemUsed) {
        playerRef.update({
            inventory: getSanitizedInventory(),
            equipment: getSanitizedEquipment(),
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
    // 1. Check Survival Constraints
    if (gameState.player.hunger <= 0 || gameState.player.thirst <= 0) {
        logMessage("You are too weak from hunger or thirst to rest effectively.");
        endPlayerTurn(); 
        return;
    }

    let rested = false;
    let logMsg = "You rest for a moment. ";

    // 2. Check Location
    const inSafeZone = (gameState.mapMode === 'castle');
    const restAmount = inSafeZone ? 5 : 1;

    // 3. Regenerate Stamina
    if (gameState.player.stamina < gameState.player.maxStamina) {
        const amountToAdd = Math.min(gameState.player.maxStamina - gameState.player.stamina, restAmount);
        gameState.player.stamina += amountToAdd;
        triggerStatFlash(statDisplays.stamina, true);
        logMsg += `Recovered ${amountToAdd} stamina. `;
        rested = true;
    }

    // 4. Regenerate Health
    if (gameState.player.health < gameState.player.maxHealth) {
        const amountToAdd = Math.min(gameState.player.maxHealth - gameState.player.health, restAmount);
        gameState.player.health += amountToAdd;
        triggerStatFlash(statDisplays.health, true);
        logMsg += `Recovered ${amountToAdd} health.`;
        rested = true;
    }

    // 5. --- NEW: WELL RESTED BONUS ---
    // If we are in a safe zone AND fully healed, give a buff!
    if (inSafeZone && !rested) {
        // Only apply if we don't already have a long buff active
        if (gameState.player.strengthBonusTurns < 10) {
            gameState.player.strengthBonus = 2;     // +2 Strength
            gameState.player.strengthBonusTurns = 50; // Lasts 50 Turns
            // --- ADVANCED AUDIO SYSTEM (OPTIMIZED) ---
            logMessage("{gold:You feel Well Rested! (+2 Strength for 50 turns)}");
            triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
            
            // We need to save and render this immediately
            playerRef.update({
                strengthBonus: 2,
                strengthBonusTurns: 50
            });
            renderEquipment(); // Updates the stat display UI
            endPlayerTurn();
            return;
        } else {
            logMessage("You are already well rested.");
        }
    }
    // ---------------------------------

    // 6. Standard Feedback
    if (!rested && !inSafeZone) {
        logMessage("You are already at full health and stamina.");
    } else if (rested) {
        if (inSafeZone) logMessage(`You rest comfortably in the haven. (+${restAmount} HP/Stamina)`);
        else logMessage(logMsg);
    }

    // 7. Save & End Turn
    playerRef.update({
        stamina: gameState.player.stamina,
        health: gameState.player.health
    });
    endPlayerTurn();
}

async function attemptMovePlayer(newX, newY) {
    // 1. Unlock input if we are just waiting (Safety fallback)
    if (newX === gameState.player.x && newY === gameState.player.y) {
        isProcessingMove = false;
        return;
    }

    // --- DIAGONAL CLIPPING CHECK ---
    const dx = newX - gameState.player.x;
    const dy = newY - gameState.player.y;

    // If moving diagonally (change in X and Y is 1)
    if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {

        // Helper to get a tile regardless of map mode
        const getTileAt = (tx, ty) => {
            if (gameState.mapMode === 'overworld') return chunkManager.getTile(tx, ty);
            if (gameState.mapMode === 'dungeon') return chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx] || ' ';
            if (gameState.mapMode === 'castle') return chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx] || ' ';
            return ' ';
        };

        // Get the two "cardinal" neighbors we are passing between
        const t1 = getTileAt(gameState.player.x + dx, gameState.player.y); // Horizontal neighbor
        const t2 = getTileAt(gameState.player.x, gameState.player.y + dy); // Vertical neighbor

        // Define what counts as a "Hard Block" for squeezing
        const isHardBlock = (t) => {
            // 1. Check defined obstacles (Trees, Webs, Barrels)
            if (TILE_DATA[t] && TILE_DATA[t].type === 'obstacle') return true;

            // 2. Check Walls and Mountains
            // ▓/▒ = Dungeon/Castle Walls, 🧱 = Village Walls, ^ = Mountains
            if (['▓', '▒', '🧱', '^'].includes(t)) return true;

            // 3. Check Water (unless boating or has gills)
            if ((t === '~' || t === '≈') && !gameState.player.isBoating && gameState.player.waterBreathingTurns <= 0) return true;

            return false;
        };

        // If BOTH neighbors are blocked, you can't squeeze through the crack
        if (isHardBlock(t1) && isHardBlock(t2)) {
            logMessage("The gap is too tight to squeeze through.");
            return; // Stop the move immediately
        }
    }

    let newTile;

    // --- CHECK FOR LIVE ENEMIES FIRST (Combat Priority) ---
    if (gameState.mapMode === 'overworld') {
        const enemyKey = `overworld:${newX},${-newY}`;
        const overlayEnemy = gameState.sharedEnemies[enemyKey];

        if (overlayEnemy) {
            // If there is a live enemy here, force the tile to be the enemy type so combat triggers.
            newTile = overlayEnemy.tile;
        } else {
            newTile = chunkManager.getTile(newX, newY);
        }
    } else if (gameState.mapMode === 'dungeon') {
        const map = chunkManager.caveMaps[gameState.currentCaveId];
        newTile = (map && map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';
    } else {
        const map = chunkManager.castleMaps[gameState.currentCastleId];
        newTile = (map && map[newY] && map[newY][newX]) ? map[newY][newX] : ' ';
    }

    // --- SPAWN LOCK CHECK ---
    const spawnLockId = `${newX},${newY}`;
    const enemyKey = `overworld:${newX},${-newY}`;

    if (processingSpawnTiles.has(spawnLockId) && !gameState.sharedEnemies[enemyKey]) {
        console.log("Blocked move: Enemy spawning...");
        isProcessingMove = false;
        return;
    }

    let inventoryWasUpdated = false;
    let tileData = TILE_DATA[newTile];

    // 3. Obstacle Check (The Fix)
    if (tileData && tileData.type === 'obstacle') {
        logMessage(`You can't go that way.`);
        return; // Stop the move
    }

    // --- OBELISK PUZZLE LOGIC ---
if (tileData.type === 'obelisk_puzzle') {
    const dir = tileData.direction;
    const requiredOrder = ['north', 'east', 'west', 'south'];
    const currentStep = gameState.player.obeliskProgress.length;

    logMessage(tileData.flavor);

    // Check if we are activating the CORRECT next step
    if (dir === requiredOrder[currentStep]) {
        if (!gameState.player.obeliskProgress.includes(dir)) {
            gameState.player.obeliskProgress.push(dir);
            
            logMessage(`The Obelisk hums violently! (${gameState.player.obeliskProgress.length}/4 activated)`);
            ParticleSystem.createExplosion(newX, newY, '#3b82f6', 15); // Blue explosion
            AudioSystem.playMagic();

            // REWARD: Give the fragment for this specific direction
            const fragmentName = `Tablet of the ${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
            gameState.player.inventory.push(
                // Lookup item from ITEM_DATA using the name map logic or hardcode keys
                { name: fragmentName, type: 'junk', quantity: 1, tile: '🧩' }
            );
            logMessage(`A stone fragment falls from the obelisk: ${fragmentName}`);

            // Save progress
            playerRef.update({ 
                obeliskProgress: gameState.player.obeliskProgress,
                inventory: gameState.player.inventory 
            });
        } else {
            logMessage("This obelisk is already active.");
        }
    } 
    // Wrong order? Reset!
    else if (!gameState.player.obeliskProgress.includes(dir)) {
        logMessage("The Obelisk shrieks! A shockwave knocks you back!");
        logMessage("{red:PUZZLE FAILED. Sequence Reset.}");
        
        gameState.player.health -= 5;
        gameState.player.obeliskProgress = []; // Reset
        
        triggerStatFlash(statDisplays.health, false);
        playerRef.update({ 
            health: gameState.player.health,
            obeliskProgress: [] 
        });
        
        // Punishment damage visual
        ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ef4444', 10);
    }
    return;
}

// --- SEALED DOOR LOGIC ---
if (tileData.type === 'sealed_door') {
    const hasKey = gameState.player.inventory.some(i => i.name === 'Ancient Key');
    
    if (hasKey) {
        logMessage("You insert the Ancient Key. The massive doors grind open...");
        // Teleport to a special Vault Dungeon ID
        gameState.mapMode = 'dungeon';
        gameState.currentCaveId = 'vault_kings_treasure';
        gameState.currentCaveTheme = 'GOLDEN'; // Make sure this theme exists in data-maps
        
        // Generate the Vault
        chunkManager.generateCave(gameState.currentCaveId);
        
        // Move player
        gameState.player.x = 10; // Arbitrary safe spot in your gen logic
        gameState.player.y = 10;
        
        updateRegionDisplay();
        render();
        syncPlayerState();
    } else {
        logMessage("The door is sealed tight. There is a keyhole shaped like four joined stone fragments.");
    }
    return;
}

    // 4. Obsolete Tile Cleanup
    const obsoleteTiles = [];
    if (obsoleteTiles.includes(newTile)) {
        logMessage("You clear away remnants of an older age.");
        chunkManager.setWorldTile(newX, newY, '.');
    }

    // 5. Overlay Collision Check
    if (gameState.mapMode === 'overworld') {
        const enemyKey = `overworld:${newX},${-newY}`;
        const overlayEnemy = gameState.sharedEnemies[enemyKey];

        if (overlayEnemy) {
            // Check if this is a valid enemy
            if (ENEMY_DATA[overlayEnemy.tile]) {
                // Valid enemy: Override tile to trigger combat
                newTile = overlayEnemy.tile;
                // Update tileData in case the enemy tile has interaction data (rare, but safe)
                tileData = TILE_DATA[newTile];
            } else {
                // Invalid "Ghost" enemy logic
                logMessage("Dissipating a phantom signal...");

                // 1. Delete from DB and Local State
                rtdb.ref(`worldEnemies/${enemyKey}`).remove();
                delete gameState.sharedEnemies[enemyKey];

                // 2. Reset the destination tile to the actual terrain
                // This allows the player to walk onto the tile immediately
                newTile = chunkManager.getTile(newX, newY);
                tileData = TILE_DATA[newTile];

                // 3. Force a visual update to remove the sprite
                render();
            }
        }
    }

    console.log("Attempting Move to:", newX, newY);
    console.log("Tile Char:", newTile);
    console.log("Tile Data:", tileData);

    // --- COMBAT CHECK ---
    const enemyData = ENEMY_DATA[newTile];
    if (enemyData) {

        // handleInput already updated the timer!

        const hitChance = calculateHitChance(gameState.player, enemyData);

        if (Math.random() > hitChance) {
            logMessage(`You swing at the ${enemyData.name} but miss!`);

        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(newX, newY, "MISS", "#9ca3af");
        }


            // We still end the turn so the enemy can move/attack
            endPlayerTurn();
            return;
        }

        // 1. Calculate Player's Raw Attack Power
        const weaponDamage = gameState.player.equipment.weapon ? gameState.player.equipment.weapon.damage : 0;
        const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);

        let rawDamage = playerStrength + weaponDamage;

        // --- APPLY TALENT MODIFIERS ---
        rawDamage = getPlayerDamageModifier(rawDamage);

        // --- BREAK STEALTH ---
        if (gameState.player.stealthTurns > 0) {
            gameState.player.stealthTurns = 0;
            logMessage("You emerge from the shadows.");
            playerRef.update({ stealthTurns: 0 });
        }

        // 2. Critical Hit Check
        const critChance = 0.05 + (gameState.player.luck * 0.005);
        let isCrit = false;

        if (Math.random() < critChance) {
            const mult = (gameState.player.talents && gameState.player.talents.includes('backstab')) ? 3.0 : 1.5;
            rawDamage = Math.floor(rawDamage * mult);
            isCrit = true;
        }

        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
            // --- INSTANCED COMBAT (Inside attemptMovePlayer) ---
let enemy = gameState.instancedEnemies.find(e => e.x === newX && e.y === newY);
let enemyId = enemy ? enemy.id : null;

if (enemy) {
    const boostedDamage = getPlayerDamageModifier(rawDamage);
    let playerDamage = Math.max(1, boostedDamage - (enemy.defense || 0));

    // Low-level grace logic
    if (gameState.player.level < 4 && enemyData.maxHealth <= 10) {
        const graceFloor = Math.ceil(gameState.player.strength / 2);
        playerDamage = Math.max(playerDamage, graceFloor);
    }

    enemy.health -= playerDamage;

    // --- WEAPON PROC SYSTEM ---
    const equippedWeapon = gameState.player.equipment.weapon;
    if (equippedWeapon && equippedWeapon.onHit && Math.random() < equippedWeapon.procChance) {
        logMessage(`Your ${equippedWeapon.name} surges with power!`);
        const spellId = equippedWeapon.onHit;
        const spellData = SPELL_DATA[spellId];
        const procDmg = spellData.baseDamage + (gameState.player.wits * 0.5);
        applySpellDamage(newX, newY, procDmg, spellId);
    }

    AudioSystem.playAttack();

    // Log & Effects
    if (isCrit) {
        logMessage(`CRITICAL HIT! You strike the ${enemy.name} for ${playerDamage} damage!`);
        ParticleSystem.createExplosion(newX, newY, '#facc15');
        ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
    } else {
        logMessage(`You attack the ${enemy.name} for {red:${playerDamage}} damage!`);
        ParticleSystem.createExplosion(newX, newY, '#ef4444');
        ParticleSystem.createFloatingText(newX, newY, `-${playerDamage}`, '#fff');
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
    } 

    // FINALIZE TURN - No counter-attack here! 
    // The enemy will now attack during the processEnemyTurns() AI loop.
    endPlayerTurn();
    render();
    return;

            } else {
                logMessage(`You see the corpse of a ${enemyData.name}.`);
            }

        } else if (gameState.mapMode === 'overworld') {
            // --- SHARED COMBAT ---
            let playerDamage = Math.max(1, rawDamage - (enemyData.defense || 0));

            if (gameState.player.level < 4 && enemyData.maxHealth <= 10) {
                const graceFloor = Math.ceil(gameState.player.strength / 2);
                playerDamage = Math.max(playerDamage, graceFloor);
            }

            AudioSystem.playAttack();

            // --- FIX START: Get Real Name ---
            // Look up the live entity to get the correct name (e.g. "Spectral Giant Rat")
            // instead of the base template name ("Giant Rat").
            const enemyId = `overworld:${newX},${-newY}`;
            const liveEnemy = gameState.sharedEnemies[enemyId];
            const targetName = liveEnemy ? liveEnemy.name : enemyData.name;
            // --- FIX END ---

            if (isCrit) {
                logMessage(`CRITICAL HIT! You strike the ${targetName} for ${playerDamage} damage!`);
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                }
            } else {
                logMessage(`You attack the ${targetName} for ${playerDamage} damage!`);
            }

            await handleOverworldCombat(newX, newY, enemyData, newTile, playerDamage);
            return;
        }
    }

    // --- ANOMALY INTERACTIONS ---
    if (newTile === '🌳e') {
        const tileId = `${newX},${-newY}`;
        if (!gameState.lootedTiles.has(tileId)) {
            logMessage("You touch the Elder Tree. Warmth flows into you.");
            logMessage("Permanent Effect: +2 Max Health.");
            gameState.player.maxHealth += 2;
            gameState.player.health = gameState.player.maxHealth; // Full heal

            triggerStatAnimation(statDisplays.health, 'stat-pulse-green');
            ParticleSystem.createLevelUp(newX, newY); // Confetti!

            gameState.lootedTiles.add(tileId);
            playerRef.update({
                maxHealth: gameState.player.maxHealth,
                health: gameState.player.health,
                lootedTiles: Array.from(gameState.lootedTiles)
            });
            renderStats();
        } else {
            logMessage("The Elder Tree stands silent and majestic.");
        }
        return;
    }

    if (newTile === '🗿k') {
        const tileId = `${newX},${-newY}`;
        if (!gameState.lootedTiles.has(tileId)) {
            logMessage("You clear the moss from the Giant's eyes.");
            logMessage("You feel heavier, sturdier. (Permanent +1 Defense)");

            // We don't have a base defense stat, so we give a permanent passive trait
            if (!gameState.player.talents) gameState.player.talents = [];
            if (!gameState.player.talents.includes('iron_skin')) {
                gameState.player.talents.push('iron_skin');
                logMessage("You gained the Iron Skin talent!");
            } else {
                logMessage("You feel a kinship with the stone. (+500 XP)");
                grantXp(500);
            }

            gameState.lootedTiles.add(tileId);
            playerRef.update({
                talents: gameState.player.talents,
                lootedTiles: Array.from(gameState.lootedTiles)
            });
        } else {
            logMessage("The Giant sleeps.");
        }
        return;
    }

    if (newTile === '🦴d') {
        const tileId = `${newX},${-newY}`;
        if (!gameState.lootedTiles.has(tileId)) {
            logMessage("You search the Dragon's ribs...");
            // High tier loot
            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                const loot = generateMagicItem(4); // Tier 4 Item!
                gameState.player.inventory.push(loot);
                logMessage(`You found a ${loot.name} buried in the sand!`);
            } else {
                logMessage("You found treasure, but your inventory is full!");
                return;
            }

            gameState.lootedTiles.add(tileId);
            playerRef.update({
                inventory: getSanitizedInventory(),
                lootedTiles: Array.from(gameState.lootedTiles)
            });
            renderInventory();
        } else {
            logMessage("Only bleached bones remain.");
        }
        return;
    }

    // --- ARCHAEOLOGY LOGIC ---
    if (newTile === '∴') {
        const hasShovel = gameState.player.inventory.some(i => i.name === 'Shovel');

        if (hasShovel) {
            logMessage("You dig into the loose soil...");

            // 1. Stamina Cost
            gameState.player.stamina = Math.max(0, gameState.player.stamina - 2);
            triggerStatFlash(statDisplays.stamina, false);

            // 2. Loot Table
            const roll = Math.random();
            let foundItem = null;

            if (roll < 0.15) {
                // 15% Chance: Trap/Enemy!
                logMessage("You disturbed a grave! A Skeleton crawls out!");
                chunkManager.setWorldTile(newX, newY, 's'); // Spawn Skeleton

                // Create enemy in memory immediately so it can fight
                const enemyData = ENEMY_DATA['s'];
                const enemyId = `overworld:${newX},${-newY}`;
                const scaledStats = getScaledEnemy(enemyData, newX, newY);
                gameState.sharedEnemies[enemyId] = { ...scaledStats, tile: 's', x: newX, y: newY };

                render();
                return; // Stop movement, fight starts next turn
            }
            else if (roll < 0.50) {
                // 35% Chance: Artifact
                const artifacts = ['🏺a', '🗿h', '🦴d', 'ancient_coin', 'gold_dust'];
                const key = artifacts[Math.floor(Math.random() * artifacts.length)];
                const template = ITEM_DATA[key];

                if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: template.name,
                        type: template.type,
                        quantity: 1,
                        tile: template.tile || key
                    });
                    logMessage(`You unearthed a ${template.name}!`);
                    grantXp(25); // Discovery XP
                } else {
                    logMessage(`You found a ${template.name}, but your inventory is full.`);
                }
            }
            else {
                // 50% Chance: Just dirt/worms
                logMessage("Just dirt and rocks.");
            }

            // Clear the tile
            chunkManager.setWorldTile(newX, newY, '.');
            playerRef.update({ inventory: getSanitizedInventory() });
            renderInventory();
            render();
            return; // Digging takes a turn
        } else {
            logMessage("The soil is loose here. If only you had a Shovel...");
        }
    }

    // --- INTERACTION LOGIC ---

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

    if (newTile === '🎓') {
        const player = gameState.player;
        const inv = player.inventory;

        // Initialize Quest Stage if missing
        player.relicQuestStage = player.relicQuestStage || 0;

        loreTitle.textContent = "Royal Historian";
        let dialogueHtml = "";

        // --- 1. MAIN QUEST LOGIC ---
        if (player.relicQuestStage === 0) {
            dialogueHtml = `<p>"Ah, a traveler! I am researching the fall of the Old King. Legend says his power was sealed in three gems."</p><p>"Bring me the <b>Sun Shard</b> from the deserts to the south. I will reward you."</p>`;
            player.relicQuestStage = 1;
        }
        else if (player.relicQuestStage === 1) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Sun Shard');
            if (hasShardIndex > -1) {
                inv.splice(hasShardIndex, 1);
                player.relicQuestStage = 2;
                grantXp(200);
                dialogueHtml = `<p>"Magnificent! It is warm to the touch. Next, seek the <b>Moon Tear</b>. It is said to be lost in the deep swamps."</p>`;
            } else {
                dialogueHtml = `<p>"The <b>Sun Shard</b> is hidden in the scorching sands of the Desert. Please hurry."</p>`;
            }
        }
        else if (player.relicQuestStage === 2) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Moon Tear');
            if (hasShardIndex > -1) {
                inv.splice(hasShardIndex, 1);
                player.relicQuestStage = 3;
                grantXp(300);
                dialogueHtml = `<p>"Incredible. One remains. The <b>Void Crystal</b>. It lies in the highest peaks of the Mountains, guarded by ancient beasts."</p>`;
            } else {
                dialogueHtml = `<p>"The <b>Moon Tear</b> is in the Swamp. Beware the poison."</p>`;
            }
        }
        else if (player.relicQuestStage === 3) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Void Crystal');
            if (hasShardIndex > -1) {
                // Check space before taking
                if (inv.length < MAX_INVENTORY_SLOTS) {
                    inv.splice(hasShardIndex, 1);
                    player.relicQuestStage = 4;
                    grantXp(500);
                    const reward = ITEM_DATA['⚡']; // Stormbringer
                    inv.push({ ...reward, quantity: 1 });
                    dialogueHtml = `<p>"You have done it! The trinity is restored. As promised, take this... The King's own blade, <b>Stormbringer</b>."</p>`;
                } else {
                    dialogueHtml = `<p>"I have your reward, but your pack is full! Make space and return to me."</p>`;
                }
            } else {
                dialogueHtml = `<p>"The <b>Void Crystal</b> is in the Mountains. It is the most dangerous journey."</p>`;
            }
        }
        else {
            dialogueHtml = `<p>"The history books will remember your name, hero."</p>`;
        }

        // --- 2. MEMORY SHARD TRADE LOGIC ---
        const shardIndex = inv.findIndex(i => i.name === 'Memory Shard');
        let tradeHtml = "";

        if (shardIndex > -1) {
            const shardCount = inv[shardIndex].quantity;
            tradeHtml = `
                <hr class="my-4 border-gray-500">
                <p class="text-sm italic">"I see you have found <b>${shardCount} Memory Shards</b>. I can trade for them."</p>
                <button id="tradeShardXP" class="mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded w-full">Trade 1 Shard for 100 XP</button>
                <button id="tradeShardStat" class="mt-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded w-full">Trade 3 Shards for Stat Tome</button>
            `;
        }

        // --- 3. RENDER UI ---
        loreContent.innerHTML = dialogueHtml + tradeHtml;
        loreModal.classList.remove('hidden');

        // --- 4. BIND BUTTONS (If they exist) ---
        if (shardIndex > -1) {
            setTimeout(() => { // Timeout ensures DOM is updated before we grab elements
                const btnXP = document.getElementById('tradeShardXP');
                const btnStat = document.getElementById('tradeShardStat');

                if (btnXP) {
                    btnXP.onclick = () => {
                        // Re-check inventory to be safe
                        const currentShardIdx = gameState.player.inventory.findIndex(i => i.name === 'Memory Shard');
                        if (currentShardIdx > -1) {
                            gameState.player.inventory[currentShardIdx].quantity--;
                            if (gameState.player.inventory[currentShardIdx].quantity <= 0) gameState.player.inventory.splice(currentShardIdx, 1);

                            grantXp(100);
                            logMessage("The Historian shares ancient secrets with you.");
                            loreModal.classList.add('hidden');
                            playerRef.update({ inventory: getSanitizedInventory() });
                            renderInventory();
                        }
                    };
                }

                if (btnStat) {
                    btnStat.onclick = () => {
                        const currentShardIdx = gameState.player.inventory.findIndex(i => i.name === 'Memory Shard');
                        if (currentShardIdx > -1 && gameState.player.inventory[currentShardIdx].quantity >= 3) {
                            gameState.player.inventory[currentShardIdx].quantity -= 3;
                            if (gameState.player.inventory[currentShardIdx].quantity <= 0) gameState.player.inventory.splice(currentShardIdx, 1);

                            if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                                // Random Stat Tome
                                const stats = ['strength', 'wits', 'constitution', 'dexterity', 'luck'];
                                const rndStat = stats[Math.floor(Math.random() * stats.length)];
                                // Create a dynamic tome based on the random stat
                                const tomeItem = {
                                    name: `Tome of ${rndStat.charAt(0).toUpperCase() + rndStat.slice(1)}`,
                                    type: 'tome',
                                    quantity: 1,
                                    tile: '📖', // Using generic book icon
                                    stat: rndStat
                                };
                                gameState.player.inventory.push(tomeItem);
                                logMessage(`Received ${tomeItem.name}!`);
                            } else {
                                logMessage("Inventory full! Shards returned.");
                                gameState.player.inventory[currentShardIdx].quantity += 3; // Refund
                            }

                            loreModal.classList.add('hidden');
                            playerRef.update({ inventory: getSanitizedInventory() });
                            renderInventory();
                        } else {
                            logMessage("Not enough shards.");
                        }
                    };
                }
            }, 0);
        }

        // Save progress
        playerRef.update({ relicQuestStage: player.relicQuestStage, inventory: getSanitizedInventory() });
        renderInventory();
        return;
    }

    if (newTile === '👻') {
        const echoes = [
            "I saw the King... his eyes were black as the void.",
            "We sealed the doors, but the shadows came through the walls.",
            "The mages promised power. They only brought ruin.",
            "My sword passed right through them. We never stood a chance.",
            "Run... while you still can."
        ];
        const msg = echoes[Math.floor(Math.random() * echoes.length)];

        logMessage(`The ghost whispers: "${msg}"`);
        logMessage("It fades away, leaving a Memory Shard.");

        // Give Item
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            gameState.player.inventory.push({ name: 'Memory Shard', type: 'junk', quantity: 1, tile: '👻' });
        } else {
            logMessage("Your inventory is full, the shard falls to the ground.");
            // Logic to leave it on ground is handled by not clearing tile if full? 
            // Actually, let's just clear it and say it's lost to keep it simple, or drop it.
        }

        chunkManager.setWorldTile(newX, newY, '.'); // Remove ghost
        playerRef.update({ inventory: getSanitizedInventory() });
        renderInventory();
        return;
    }

    if (newTile === '?') {
        const tileId = `${newX},${-newY}`;

        // Check if already solved
        if (gameState.lootedTiles.has(tileId)) {
            logMessage("The statue stands silent. Its riddle is solved.");
            return;
        }

        // Pick a riddle based on location hash
        const seed = stringToSeed(tileId);
        const riddleIndex = Math.abs(seed) % RIDDLE_DATA.length;
        const riddle = RIDDLE_DATA[riddleIndex];

        // Setup UI
        loreTitle.textContent = "The Whispering Statue";
        loreContent.textContent = `A voice echoes in your mind:\n\n"${riddle.question}"`;

        const riddleContainer = document.getElementById('riddleContainer');
        const riddleInput = document.getElementById('riddleInput');
        const submitBtn = document.getElementById('submitRiddle');

        riddleContainer.classList.remove('hidden');
        riddleInput.value = ''; // Clear old input
        loreModal.classList.remove('hidden');

        // Handle Submit (One-time event listener wrapper)
        submitBtn.onclick = () => {
            const answer = riddleInput.value.toLowerCase().trim();
            if (riddle.answers.includes(answer)) {
                // Correct!
                logMessage(riddle.message);
                gameState.player[riddle.reward]++; // Give Stat
                triggerStatAnimation(statDisplays[riddle.reward], 'stat-pulse-green');

                // Mark solved
                gameState.lootedTiles.add(tileId);
                playerRef.update({
                    lootedTiles: Array.from(gameState.lootedTiles),
                    [riddle.reward]: gameState.player[riddle.reward]
                });

                loreModal.classList.add('hidden');
                renderStats();
            } else {
                // Wrong
                logMessage("The statue remains silent. That is not the answer.");
                gameState.player.health -= 2; // Punishment
                triggerStatFlash(statDisplays.health, false);
                loreModal.classList.add('hidden');
                renderStats();
            }
        };
        return;
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

    if (tileData && tileData.type === 'shrine') {
        const tileId = `${newX},${-newY}`;
        const player = gameState.player;
        let shrineUsed = false;

        if (gameState.lootedTiles.has(tileId)) {
            logMessage("The shrine's power is spent.");
            return;
        }

        loreTitle.textContent = "An Ancient Shrine";
        loreContent.innerHTML = `
            <p>The shrine hums with a faint energy. You feel you can ask for one boon.</p>
            <button id="shrineStr" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Strength (+5 Str for 500 turns)</button>
            <button id="shrineWits" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">Pray for Wits (+5 Wits for 500 turns)</button>
        `;
        loreModal.classList.remove('hidden');

        document.getElementById('shrineStr').addEventListener('click', () => {
            logMessage("You pray for Strength. You feel a surge of power that will last for days!");
            player.strengthBonus = 5;
            player.strengthBonusTurns = 500;

            playerRef.update({ strengthBonus: 5, strengthBonusTurns: 500 });
            renderEquipment();
            shrineUsed = true;

            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({ lootedTiles: Array.from(gameState.lootedTiles) });
            loreModal.classList.add('hidden');
        }, { once: true });

        document.getElementById('shrineWits').addEventListener('click', () => {
            logMessage("You pray for Wits. Your mind expands with ancient knowledge!");
            player.witsBonus = 5;
            player.witsBonusTurns = 500;

            playerRef.update({ witsBonus: 5, witsBonusTurns: 500 });
            renderStats();

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
    }

    if (newTile === '🌵') {
        logMessage("Ouch! The thorns prick you, but you grab a fruit.");
        gameState.player.health -= 1;
        gameState.screenShake = 10; // Shake intensity
        triggerStatFlash(statDisplays.health, false);

        if (handlePlayerDeath()) return;

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
        if (Math.random() < 0.10) {
            logMessage("The chest lurches open... It has teeth! IT'S A MIMIC!");

            if (gameState.mapMode === 'overworld') {
                chunkManager.setWorldTile(newX, newY, 'M');
            } else if (gameState.mapMode === 'dungeon') {
                chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = 'M';
            } else {
                chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = 'M';
            }

            gameState.player.health -= 3;
            gameState.screenShake = 10;
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
                gameState.screenShake = 10;
                triggerStatFlash(statDisplays.health, false);
                gameState.lootedTiles.add(tileId);

                if (handlePlayerDeath()) return;
            }
        }
    }

    let moveCost = TERRAIN_COST[newTile] ?? 0;

    // --- GILL POTION OVERRIDE ---
    if (newTile === '~' && gameState.player.waterBreathingTurns > 0) {
        moveCost = 1;
    }

    if ((newTile === '~' || newTile === '≈') && gameState.player.waterBreathingTurns > 0) {
        moveCost = 0; // Swim effortlessly
    }

    if (newTile === 'F' && gameState.player.talents && gameState.player.talents.includes('pathfinder')) {
        moveCost = 0;
        if (Math.random() < 0.05) logMessage("You move swiftly through the trees.");
    }

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
                    gameState.mapDirty = true;
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
        // Just walk through
    }

    // --- STASH LOGIC ---
    if (newTile === '☒') {
        logMessage("You open your Stash Box.");
        openStashModal();
        return;
    }

    // Check special tiles
    if (tileData) {
        console.log("Entering TileData Block. Type:", tileData.type);

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
            logMessage("You smash the barrel open!");
            if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(newX, newY, '.');
            else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][newY][newX] = '.';
            else chunkManager.castleMaps[gameState.currentCastleId][newY][newX] = '.';

            // 30% chance to drop oil (fuel)
            if (Math.random() < 0.3) {
                logMessage("You salvage some oil.");
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

                playerRef.update({
                    inventory: getSanitizedInventory()
                });
                renderInventory();

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
            if (!lootTable || tileData.name === 'Dusty Urn' || newTile === '📦') {
                const dist = Math.sqrt(newX * newX + newY * newY);
                if (dist > 250) {
                    // High Tier + New Trade Goods (Shells, Pearls, Idols)
                    lootTable = ['$', '$', 'S', '🔮', '+', '⚔️l', '⛓️', '💎', '🧪', '🐚', '💎b', '🗿'];
                } else {
                    // Low Tier + Common Trade Goods (Shells, Spools)
                    lootTable = ['$', '$', '(', '†', '+', '!', '[', '🛡️w', '🐚', '🧵'];
                }
            }
            const seed = stringToSeed(tileId);
            const random = Alea(seed);
            const lootCount = 1 + Math.floor(random() * 2);

            for (let i = 0; i < lootCount; i++) {
                const itemKey = lootTable[Math.floor(random() * lootTable.length)];
                if (itemKey === '$') {
                    const amount = 5 + Math.floor(random() * 15);
                    gameState.player.coins += amount;

                    AudioSystem.playCoin();

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
            const tileId = (gameState.mapMode === 'overworld')
                ? `${newX},${-newY}`
                : `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;

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
            // --- FIX: Define tileId ---
            const tileId = (gameState.mapMode === 'overworld')
                ? `${newX},${-newY}`
                : `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;


            if (!gameState.foundLore.has(tileId)) {
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
            // This ensures every time we open the shop, stock is fresh (or at least reset for the session)
            // In a real MMO, stock would be synced to DB, but for now, we prevent session pollution.
            if (gameState.mapMode === 'castle') {
                activeShopInventory = JSON.parse(JSON.stringify(CASTLE_SHOP_INVENTORY));
                logMessage("You enter the castle emporium.");
            } else {
                activeShopInventory = JSON.parse(JSON.stringify(SHOP_INVENTORY));
                logMessage("You enter the General Store.");
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

                gameState.mapDirty = true;

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

                gameState.mapDirty = true;

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
                // --- SAFETY FIX: Ensure Set exists ---
                if (!gameState.foundLore) gameState.foundLore = new Set();

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

                gameState.mapDirty = true;

                render();
                syncPlayerState();
                return;
            case 'dungeon_exit':
                exitToOverworld("You emerge back into the sunlight.");
                return;
            case 'landmark_castle':
                if (!gameState.foundLore) gameState.foundLore = new Set();
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
                if (!gameState.foundLore) gameState.foundLore = new Set();

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

                gameState.mapDirty = true;
                
                render();
                syncPlayerState();
                return;
            case 'castle_exit':
                exitToOverworld("You leave the castle.");
                return;
            case 'lore':
                if (!gameState.foundLore) gameState.foundLore = new Set();
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
                    const itemForDb = { name: itemData.name, type: itemData.type, quantity: 1, tile: newTile, effect: itemData.effect || null };
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

    gameState.mapDirty = true; 

    AudioSystem.playStep();

    if (gameState.player.companion) {
        gameState.player.companion.x = prevX;
        gameState.player.companion.y = prevY;
    }

    if (gameState.player.stamina >= moveCost) {
        gameState.player.stamina -= moveCost;
    } else {
        gameState.player.stamina = 0;
        gameState.player.health -= staminaDeficit;
        gameState.screenShake = 10; // Shake intensity
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
        activeTreasure: gameState.activeTreasure || null,

        weather: gameState.weather || 'clear',

        weatherState: gameState.player.weatherState || 'calm', // Default to 'calm'
        weatherIntensity: gameState.player.weatherIntensity || 0, // Default to 0
        weatherDuration: gameState.player.weatherDuration || 0 // Default to 0
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

        // Load 3x3 chunk area around player
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                chunkManager.listenToChunkState(currentChunkX + x, currentChunkY + y);
            }
        }

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

    updateThemeColors();

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
                let message = chatInput.value.trim();
        
        // 1. Limit Length
        if (message.length > 255) {
            logMessage("{red:Message too long.}");
            return;
        }

        chatInput.value = ''; 

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
    wokenEnemyTiles.clear();
    pendingSpawns.clear(); // Clear pending spawns

    gameState.mapMode = null;

    if (gameState.flags) {
        gameState.flags.hasSeenForestWarning = false;
        gameState.flags.canoeEmbarkCount = 0;
    }

    chunkManager.caveMaps = {};
    chunkManager.castleMaps = {};
    chunkManager.caveEnemies = {};
    chunkManager.caveThemes = {};
    chunkManager.castleSpawnPoints = {};

    // --- LISTENER CLEANUP ---
    if (sharedEnemiesListener) {
        rtdb.ref('worldEnemies').off('value', sharedEnemiesListener);
        sharedEnemiesListener = null;
    }
    if (chatListener) { // If you saved the chat listener reference
        rtdb.ref('chat').off('child_added', chatListener);
        chatListener = null;
    }
    // Also clear the local enemy list to prevent ghosts
    gameState.sharedEnemies = {};

    areGlobalListenersInitialized = false; 
}

logoutButton.addEventListener('click', () => {
    // 1. Only attempt to save if we have a valid database reference
    if (playerRef) {
        const finalState = {
            ...gameState.player,
            lootedTiles: Array.from(gameState.lootedTiles)
        };

        // Create a clean version of the inventory before saving
        if (finalState.inventory) {
            finalState.inventory = getSanitizedInventory();
        }

        // Remove ephemeral visual properties
        delete finalState.color;
        delete finalState.character;

        // Save to Firestore
        playerRef.set(finalState, {
            merge: true
        }).catch(err => {
            console.error("Error saving on logout:", err);
        });
    }

    // 2. Remove from Online Players list (Realtime DB)
    if (onlinePlayerRef) {
        onlinePlayerRef.remove().catch(err => console.error(err));
    }

    // 3. Detach Firebase Listeners
    if (unsubscribePlayerListener) {
        unsubscribePlayerListener();
        unsubscribePlayerListener = null;
    }
    
    Object.values(worldStateListeners).forEach(unsubscribe => unsubscribe());
    worldStateListeners = {};

    // 4. Clear Local Memory
    clearSessionState();

    // 5. Sign Out
    auth.signOut().then(() => {
        console.log("Signed out successfully.");
        // UI reset is handled by onAuthStateChanged, but we can force hide here to be snappy
        gameContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
    });
});

async function enterGame(playerData) {
    gameContainer.classList.remove('hidden');

    applyVisualSettings();

    const loadingIndicator = document.getElementById('loadingIndicator');
    canvas.style.visibility = 'hidden';

    const timeDoc = await db.collection('world').doc('time').get();
if (timeDoc.exists) {
    const data = timeDoc.data();
    gameState.time.day = data.day;
    gameState.time.hour = data.hour;
    gameState.time.minute = data.minute;
    renderTime();
}

    // --- FIX: PERMADEATH LOOP PREVENTION ---
    if (playerData.health <= 0) {
        logMessage("You have respawned at the village.");

        // 1. Get a fresh default state (for structure safety)
        const defaultState = createDefaultPlayerState();

        // 2. Preserve Critical Progression Stats from the loaded data
        // We explicitly copy over everything that represents "Progress"
        const preservedStats = {
            background: playerData.background,
            level: playerData.level || 1,
            xp: playerData.xp || 0,
            xpToNextLevel: playerData.xpToNextLevel || 100,
            statPoints: playerData.statPoints || 0,
            talentPoints: playerData.talentPoints || 0,
            talents: playerData.talents || [],
            quests: playerData.quests || {},
            killCounts: playerData.killCounts || {},
            foundLore: playerData.foundLore || [],
            discoveredRegions: playerData.discoveredRegions || [],
            unlockedWaypoints: playerData.unlockedWaypoints || [],

            // Keep Core Stats
            strength: playerData.strength || 1,
            wits: playerData.wits || 1,
            constitution: playerData.constitution || 1,
            dexterity: playerData.dexterity || 1,
            charisma: playerData.charisma || 1,
            luck: playerData.luck || 1,
            willpower: playerData.willpower || 1,
            perception: playerData.perception || 1,
            endurance: playerData.endurance || 1,
            intuition: playerData.intuition || 1,

            // Keep Derived Max Stats (Important if stats were boosted)
            maxHealth: playerData.maxHealth || 10,
            maxMana: playerData.maxMana || 10,
            maxStamina: playerData.maxStamina || 10,
            maxPsyche: playerData.maxPsyche || 10,

            // Keep Skills/Spells/Crafting
            spellbook: playerData.spellbook || {},
            skillbook: playerData.skillbook || {},
            craftingLevel: playerData.craftingLevel || 1,
            craftingXp: playerData.craftingXp || 0,
            craftingXpToNext: playerData.craftingXpToNext || 50,

            // Keep Class Evolution status
            classEvolved: playerData.classEvolved || false,
            className: playerData.className || null,
            character: playerData.character || '@' // Keep custom sprite if evolved
        };

        // 3. Merge: Default Structure + Preserved Stats + Respawn Penalties
        playerData = {
            ...defaultState,
            ...preservedStats,

            // 4. Enforce Respawn Conditions (Village, Full Health)
            x: 0,
            y: 0,
            health: preservedStats.maxHealth, // HEAL TO FULL
            mana: preservedStats.maxMana,
            stamina: preservedStats.maxStamina,

            // 5. Apply Death Penalties (Match handlePlayerDeath logic)
            coins: Math.floor((playerData.coins || 0) / 2), // Lose half gold

            // Reset Inventory to Rags (Hardcore-lite penalty)
            // If you want them to KEEP items on reload, change this line to: inventory: playerData.inventory
            inventory: [
                { name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', isEquipped: true }
            ],
            equipment: {
                weapon: { name: 'Fists', damage: 0 },
                armor: { name: 'Tattered Rags', defense: 0 }
            }
        };

        // 6. Save the fixed state immediately so next reload is clean
        await playerRef.set(playerData);
    }

    const fullPlayerData = {
        ...createDefaultPlayerState(),
        ...playerData
    };
    Object.assign(gameState.player, fullPlayerData);

    // If not in a dungeon, ensure we aren't inside a wall/water without a boat
if (gameState.mapMode === 'overworld') {
    const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
    const blockedTiles = ['^', '▓', '▒', '🧱']; // Walls/Mountains
    // Also check water if not boating
    if (!gameState.player.isBoating && (currentTile === '~' || currentTile === '≈')) {
        blockedTiles.push('~', '≈'); 
    }

    if (blockedTiles.includes(currentTile)) {
        console.warn("Player loaded inside obstacle. Finding safe spot...");
        // Spiral search for nearest floor
        let found = false;
        for (let r = 1; r <= 5; r++) { // Check radius 1 to 5
            if (found) break;
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const tx = gameState.player.x + dx;
                    const ty = gameState.player.y + dy;
                    const t = chunkManager.getTile(tx, ty);
                    if (['.', 'F', 'd', 'D'].includes(t)) {
                        gameState.player.x = tx;
                        gameState.player.y = ty;
                        found = true;
                        logMessage("You woke up in a safer spot.");
                        playerRef.update({ x: tx, y: ty }); // Save fix
                        break;
                    }
                }
                if (found) break;
            }
        }
    }
}

    if (playerData.activeTreasure) {
        gameState.activeTreasure = playerData.activeTreasure;
        logMessage(`You recall a location marked on your map: (${gameState.activeTreasure.x}, ${-gameState.activeTreasure.y})`);
    } else {
        gameState.activeTreasure = null;
    }

    gameState.weather = playerData.weather || 'clear';

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
    // Cleanup old listeners first (Safety check)
    if (sharedEnemiesListener) rtdb.ref('worldEnemies').off('value', sharedEnemiesListener);
    if (chatListener) rtdb.ref('chat').off('child_added', chatListener);

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

    // --- LIVE FIRESTORE CLOCK SYNC ---
// This listens for your server-side function to update the time
db.collection('world').doc('time').onSnapshot((doc) => {
    if (doc.exists) {
        const serverTime = doc.data();
        
        // Directly sync the server's time to your game state
        gameState.time.day = serverTime.day;
        gameState.time.hour = serverTime.hour;
        gameState.time.minute = serverTime.minute;

        // Force the UI and Lighting to update automatically
        renderTime();
        render(); 
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
    
    // 1. Child Added
    const onChildAdded = sharedEnemiesRef.on('child_added', (snapshot) => {
        const key = snapshot.key;
        const val = snapshot.val();
        if (val) {

                    if (val.health <= 0) {
            // Self-healing: If we receive a dead enemy, delete it immediately
            rtdb.ref(`worldEnemies/${key}`).remove();
            return;
        }

            if (val._processedThisTurn) delete val._processedThisTurn;

            gameState.sharedEnemies[key] = val;
            
            // OPTIMIZATION: Add to Spatial Map
            updateSpatialMap(key, null, null, val.x, val.y);

            if (pendingSpawnData[key]) delete pendingSpawnData[key];
            render();
        }
    });

    // 2. Child Changed
    const onChildChanged = sharedEnemiesRef.on('child_changed', (snapshot) => {
        const key = snapshot.key;
        const val = snapshot.val();
        if (val) {
            if (val._processedThisTurn) delete val._processedThisTurn;

            // OPTIMIZATION: Get old coords before overwriting
            const oldEnemy = gameState.sharedEnemies[key];

                    if (oldEnemy && val.health < oldEnemy.health) {
            const damageDiff = oldEnemy.health - val.health;
            if (damageDiff > 0 && typeof ParticleSystem !== 'undefined') {
                // Show damage number from other players/sources
                // We use a different color (e.g., Gray/White) to distinguish from your hits
                ParticleSystem.createFloatingText(val.x, val.y, `-${damageDiff}`, '#cbd5e1'); 
                ParticleSystem.createExplosion(val.x, val.y, '#ef4444', 3); // Small blood pop
            }
        }

            const oldX = oldEnemy ? oldEnemy.x : null;
            const oldY = oldEnemy ? oldEnemy.y : null;

            // Update Main State
            gameState.sharedEnemies[key] = val;

            // Update Spatial Map (Move from old bucket to new bucket)
            updateSpatialMap(key, oldX, oldY, val.x, val.y);

            render();
        }
    });

    // 3. Child Removed
    const onChildRemoved = sharedEnemiesRef.on('child_removed', (snapshot) => {
        const key = snapshot.key;
        
        // OPTIMIZATION: Remove from Spatial Map
        if (gameState.sharedEnemies[key]) {
            const enemy = gameState.sharedEnemies[key];
            updateSpatialMap(key, enemy.x, enemy.y, null, null);
            
            delete gameState.sharedEnemies[key];
            render();
        }
    });

    // Store unsubs for cleanup
    sharedEnemiesListener = () => {
        sharedEnemiesRef.off('child_added', onChildAdded);
        sharedEnemiesRef.off('child_changed', onChildChanged);
        sharedEnemiesRef.off('child_removed', onChildRemoved);
    };

    // Helper flag
    gameState.initialEnemiesLoaded = true;

    unsubscribePlayerListener = playerRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // --- Update Inventory ---
            if (data.inventory) {
                data.inventory.forEach(item => {
                    let templateItem = null;
                    let templateKey = null;

                    // 1. ROBUST LOOKUP: Use the ID if available (Best Case)
                    if (item.templateId && ITEM_DATA[item.templateId]) {
                        templateItem = ITEM_DATA[item.templateId];
                        templateKey = item.templateId;
                    }

                    // 2. FALLBACK A: Exact Name Match (Legacy Data)
                    if (!templateItem) {
                        templateKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === item.name);
                        if (templateKey) templateItem = ITEM_DATA[templateKey];
                    }

                    // 3. FALLBACK B: Smart Suffix Match (The "Masterwork" Fix)
                    // Handles "Sharp Rusty Sword" matching "Rusty Sword" instead of just "Sword"
                    if (!templateItem) {
                        // Find all templates that match the end of the item name
                        const candidates = Object.keys(ITEM_DATA).filter(k => item.name.endsWith(ITEM_DATA[k].name));

                        if (candidates.length > 0) {
                            // Sort by name length descending. We want the longest match.
                            // e.g. "Iron Sword" (len 10) is better than "Sword" (len 5)
                            candidates.sort((a, b) => ITEM_DATA[b].name.length - ITEM_DATA[a].name.length);

                            templateKey = candidates[0];
                            templateItem = ITEM_DATA[templateKey];
                        }
                    }

                    if (templateItem) {
                        // SELF-HEAL: Save the ID for next time so we don't have to guess again
                        if (!item.templateId) {
                            item.templateId = templateKey;
                        }

                        // --- RE-BINDING LOGIC ---

                        // 1. Re-bind functions (These don't survive database storage)
                        item.effect = templateItem.effect;

                        // 2. Re-bind static properties needed for logic
                        item.onHit = templateItem.onHit;
                        item.procChance = templateItem.procChance;
                        item.inflicts = templateItem.inflicts;
                        item.inflictChance = templateItem.inflictChance;

                        // 3. Restore Missing Stats (But preserve crafted/randomized stats!)
                        // We only overwrite if the saved item is missing the property entirely.
                        if (templateItem.type === 'weapon') {
                            if (item.damage === undefined || item.damage === null) item.damage = templateItem.damage;
                            // Always enforce the correct slot type from the template
                            item.slot = templateItem.slot;
                        } else if (templateItem.type === 'armor') {
                            if (item.defense === undefined || item.defense === null) item.defense = templateItem.defense;
                            item.slot = templateItem.slot;
                        }
                    } else {
                        console.warn(`⚠️ Could not re-bind item: "${item.name}". It may be a deprecated item.`);
                    }
                });

                // Sync Equipment based on the 'isEquipped' flag in the inventory list
                const equippedWeapon = data.inventory.find(i => i.type === 'weapon' && i.isEquipped);
                const equippedArmor = data.inventory.find(i => i.type === 'armor' && i.isEquipped);

                gameState.player.equipment.weapon = equippedWeapon || { name: 'Fists', damage: 0 };
                gameState.player.equipment.armor = equippedArmor || { name: 'Simple Tunic', defense: 0 };

                gameState.player.inventory = data.inventory;
                renderInventory();
            }

            // --- Update Equipment Stats ---
            if (data.equipment) {
                // Merge DB equipment data with our calculated state
                gameState.player.equipment = {
                    ...gameState.player.equipment,
                    ...data.equipment
                };
                renderEquipment();
            }

            // --- Sync Core Stats if changed externally ---
            // This ensures if you buy something or heal, the UI updates
            const statsToSync = ['coins', 'xp', 'level', 'statPoints', 'talentPoints', 'health', 'mana', 'stamina', 'psyche'];
            statsToSync.forEach(stat => {
                if (data[stat] !== undefined) gameState.player[stat] = data[stat];
            });
            renderStats();
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

        const timeSpan = document.createElement('span');
        timeSpan.className = "muted-text text-xs";
        timeSpan.textContent = `[${timeString}] `;

        const nameStrong = document.createElement('strong');
        if (message.senderId === player_id) nameStrong.className = "highlight-text";
        
        // 1. Sanitize the Email/Name (Crucial!)
        const safeName = escapeHtml(message.email ? message.email.split('@')[0] : "Unknown");
        nameStrong.textContent = `${safeName}: `;

        // 2. Sanitize and Format the Message Body
        // This allows players to use {red:text} but NOT <script>
        const msgSpan = document.createElement('span');
        const safeBody = escapeHtml(message.message); 
        
        // Apply color formatting to the SAFE body
        const formattedBody = safeBody
            .replace(/{red:(.*?)}/g, '<span class="text-red-500">$1</span>')
            .replace(/{blue:(.*?)}/g, '<span class="text-blue-400">$1</span>');

        msgSpan.innerHTML = formattedBody; 

        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(nameStrong);
        messageDiv.appendChild(msgSpan); // Use the span instead of raw text node
        chatMessages.prepend(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

     // --- 5. Final Render & Initialization (PRE-WARM & SYNC) ---

    // A. Wait for Static Map Modifications (Dead static enemies, walls, etc.)
    const waitForWorldData = new Promise((resolve) => {
        if (gameState.mapMode === 'overworld') {
            const cX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
            const cY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
            
            // Force generate the chunks in memory now so wakeUpNearbyEnemies has data to read
            for(let y=-1; y<=1; y++) {
                for(let x=-1; x<=1; x++) {
                    chunkManager.getTile((cX+x)*chunkManager.CHUNK_SIZE, (cY+y)*chunkManager.CHUNK_SIZE);
                }
            }

            // Listen for persistent changes
            chunkManager.listenToChunkState(cX, cY, () => {
                resolve();
            });
        } else {
            // Dungeons/Castles resolve immediately
            resolve();
        }
    });

    // B. Wait for Dynamic Enemies (Snapshot)
    // Instead of waiting for the 'child_added' listener to trickle in, we grab a snapshot
    const waitForEnemies = new Promise((resolve) => {
        if (gameState.mapMode === 'overworld') {
            rtdb.ref('worldEnemies').once('value').then(snapshot => {
                const enemies = snapshot.val() || {};
                // Populate local state immediately
                Object.entries(enemies).forEach(([key, val]) => {
                    if (val && val.health > 0) {
                        gameState.sharedEnemies[key] = val;
                        // Add to spatial map so logic finds them immediately
                        updateSpatialMap(key, null, null, val.x, val.y);
                    }
                });
                resolve();
            });
        } else {
            resolve();
        }
    });

    // Run Pre-Warm Sequence
    Promise.all([waitForWorldData, waitForEnemies]).then(() => {
        
        // C. THE STEALTH CHECK: Wake up enemies before the screen drops
        if (gameState.mapMode === 'overworld') {
            console.log("🔥 Pre-warming world: Waking up static entities...");
            // This detects any static 'r' or 'g' tiles near spawn and converts them 
            // to dynamic entities instantly in the background.
            wakeUpNearbyEnemies(); 
        }

        // Small buffer to let the wakeUpNearbyEnemies async operations settle
        setTimeout(() => {
            renderStats();
            renderEquipment();
            renderTime();
            resizeCanvas();

            // Force a sync to ensure UI is perfect
            renderHotbar();
            renderInventory();

            // D. First Render
            // Now we render. Any static enemy near us has already been converted to a 
            // dynamic one in gameState.sharedEnemies by step C.
            render();

            canvas.style.visibility = 'visible';
            syncPlayerState();

            logMessage(`Welcome back, ${playerData.background} of level ${gameState.player.level}.`);
            updateRegionDisplay();
            updateExploration();

            loadingIndicator.classList.add('hidden');

            // Initialize UI Listeners (One time only)
            if (!areGlobalListenersInitialized) {
                console.log("Initializing Global UI Listeners...");
                initShopListeners();
                initSpellbookListeners();
                initInventoryListeners();
                initSkillbookListeners();
                initQuestListeners();
                initCraftingListeners();
                initSkillTrainerListeners();
                initMobileControls();
                initSettingsListeners();

                areGlobalListenersInitialized = true; 
            } else {
                console.log("UI Listeners already active. Skipping.");
                const mobileContainer = document.getElementById('mobileControls');
                if (mobileContainer) mobileContainer.classList.remove('hidden');
            }
        }, 100); 
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) applyTheme(savedTheme);
        else if (prefersDark) applyTheme('dark');
        else applyTheme('light');

        // --- Call initCharacterSelect instead of startGame ---
        gameContainer.classList.add('hidden');
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

let lastFrameTime = 0;
const FPS_LIMIT = 30;
const FRAME_MIN_TIME = 1000 / FPS_LIMIT;

function gameLoop(timestamp) {
    // 1. Throttle FPS
    if (timestamp - lastFrameTime < FRAME_MIN_TIME) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = timestamp;

    // 2. Update Particles
    if (typeof ParticleSystem !== 'undefined') ParticleSystem.update();

    // 3. Process Input Buffer
    if (inputBuffer && Date.now() - lastActionTime >= ACTION_COOLDOWN) {
        const key = inputBuffer;
        inputBuffer = null; 
        handleInput(key);
    }

    // 4. Re-render
    if (gameState.mapMode) {
        render();
    }

    requestAnimationFrame(gameLoop);
}

// Start the loop
requestAnimationFrame(gameLoop);

// DEBOUNCE RESIZE: Only resize once the user STOPS dragging the window (saves CPU)
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeCanvas, 100); });

// PREVENT SCROLLING: Stop arrow keys and spacebar from scrolling the browser window
window.addEventListener('keydown', e => { if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault(); }, false);

// AUTO-SAVE: Save the game if the user closes the tab or refreshes
window.addEventListener('beforeunload', () => { if(typeof player_id !== 'undefined' && player_id) saveGame(); });

// --- Restart / Respawn Handler ---
restartButton.onclick = () => {
    const player = gameState.player;

    // 1. Reset Position (The "Original Coordinates")
    player.x = 0;
    player.y = 0;

    // 2. Restore Vitals
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.mana = player.maxMana;
    player.hunger = 50;
    player.thirst = 50;
    
    // Clear buffs
    player.poisonTurns = 0;
    player.frostbiteTurns = 0;

    // 3. Give Starter Gear (Hardcore penalty: Rags)
    player.inventory = [
        { name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', isEquipped: true }
    ];
    player.equipment = {
        weapon: { name: 'Fists', damage: 0 },
        armor: { name: 'Tattered Rags', defense: 0 }
    };

    // 4. Reset Map Mode to Overworld
    gameState.mapMode = 'overworld';
    gameState.currentCaveId = null;
    gameState.currentCastleId = null;

    // 5. Save "Alive" State to DB
    playerRef.set(player);

    // 6. UI Cleanup
    gameOverModal.classList.add('hidden');
    logMessage("{green:You open your eyes... you have been given a second chance.}");

    // Force full re-render
    updateRegionDisplay();
    renderStats();
    renderInventory();
    renderEquipment();
    resizeCanvas();
    render();
};

// --- Main Menu Handler ---
const mainMenuBtn = document.getElementById('mainMenuButton');
if (mainMenuBtn) {
    mainMenuBtn.onclick = () => {
        // Reloading is the safest way to clear all game state (variables, listeners, etc.)
        // and return to the login/character select screen.
        location.reload();
    };
}
