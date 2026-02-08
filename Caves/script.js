// Globals

let creationState = {
    name: "",
    race: null,
    gender: null,
    background: null
};

/**
 * Queues a Firestore update. If another update comes in before the timer fires,
 * the previous one is cancelled and the new one takes its place.
 */

function triggerDebouncedSave(updates) {
    // 1. Cancel any previously pending save
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    // 2. Set a new timer for 2 seconds
    saveTimeout = setTimeout(() => {
        if (playerRef) {
            // This runs 2 seconds after the player STOPS moving
            playerRef.update(updates).catch(err => {
                console.error("Auto-save failed:", err);
            });
            console.log("☁️ Auto-saved to cloud."); // Debug log
        }
        saveTimeout = null;
    }, 2000); 
}

/**
 * Forces any pending debounced save to happen immediately.
 * Call this before entering combat or closing the window.
 */

function flushPendingSave(updates = null) {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
        
        // If specific updates provided, use them. Otherwise, we rely on the 
        // fact that game state is robust, but technically we need the data object.
        // In this implementation, we usually pass the latest updates data.
        if (updates && playerRef) {
            playerRef.update(updates);
            console.log("☁️ Forced flush save.");
        }
    }
}

/**
 * Saves the complete current game state to Firestore immediately.
 * Provides user feedback on success or failure.
 */
async function manualSaveGame() {
    if (!playerRef) {
        logMessage("{red:Cannot save: Not connected to a character.}");
        return;
    }

    const saveBtn = document.getElementById('btnManualSave');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
    }

    logMessage("💾 Saving game to the cloud...");

    // Force any pending debounced saves to happen first
    flushPendingSave(); 
    
    // Gather the complete, sanitized state for a robust save
    const finalState = {
        ...gameState.player,
        inventory: getSanitizedInventory(),
        equipment: getSanitizedEquipment(),
        lootedTiles: Array.from(gameState.lootedTiles),
        discoveredRegions: Array.from(gameState.discoveredRegions),
        exploredChunks: Array.from(gameState.exploredChunks),
        shopStates: gameState.shopStates || {},
        activeTreasure: gameState.activeTreasure || null,
    };

    try {
        // Use set with merge to ensure a clean overwrite with the current state
        await playerRef.set(sanitizeForFirebase(finalState), { merge: true });
        logMessage("{green:Game saved successfully!}");
        
        if (saveBtn) {
            saveBtn.textContent = "✅ Saved!";
            setTimeout(() => { 
                saveBtn.textContent = "💾 Save Progress";
                saveBtn.disabled = false;
            }, 2000);
        }
    } catch (err) {
        console.error("Manual save failed:", err);
        logMessage("{red:Save failed. Check console for details.}");
        if (saveBtn) {
            saveBtn.textContent = "💾 Save Progress";
            saveBtn.disabled = false;
        }
    }
}

// --- INPUT THROTTLE ---
let lastActionTime = 0;
const ACTION_COOLDOWN = 150; // ms (limits speed to ~6 moves per second)
let inputBuffer = null;

const SELL_MODIFIER = 0.5; // Players sell items for 50% of their base price

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

// --- PERFORMANCE: OFFSCREEN CANVAS ---
const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d');

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
            <h3 class="text-xl font-bold mb-1">${data.name || 'Unnamed'}</h3>
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
    Object.assign(gameState.player, defaultState);
    
    // Call our new UI initializer
    initCreationUI(); 
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

// --- CHARACTER CREATION LOGIC ---

function initCreationUI() {
    // 1. Clear State
    creationState = { name: "", race: null, gender: "Non-Binary", background: null };
    document.getElementById('charNameInput').value = "";
    
    // 2. Populate Races
    const raceContainer = document.getElementById('raceSelectionContainer');
    raceContainer.innerHTML = '';
    
    for (const key in PLAYER_RACES) {
        const r = PLAYER_RACES[key];
        const div = document.createElement('div');
        div.className = 'creation-option p-3 rounded-lg flex items-center gap-2';
        div.innerHTML = `<span class="text-2xl">${r.icon}</span> <span class="font-bold">${r.name}</span>`;
        div.onclick = () => selectCreationOption('race', key, div);
        div.dataset.key = key; // identifier
        raceContainer.appendChild(div);
    }

    // 3. Populate Classes (Backgrounds)
    const classContainer = document.getElementById('classSelectionContainer');
    classContainer.innerHTML = '';

    for (const key in PLAYER_BACKGROUNDS) {
        const bg = PLAYER_BACKGROUNDS[key];
        // Skip Wretch if you want it hidden, or keep it.
        const div = document.createElement('div');
        div.className = 'creation-option p-3 rounded-lg';
        div.innerHTML = `
            <div class="font-bold text-lg">${bg.name}</div>
            <div class="text-xs muted-text">Start: ${bg.items[0].name}</div>
        `;
        div.onclick = () => selectCreationOption('background', key, div);
        div.dataset.key = key;
        classContainer.appendChild(div);
    }

    // 4. Setup Gender Buttons
    const genderBtns = document.querySelectorAll('.gender-btn');
    genderBtns.forEach(btn => {
        btn.onclick = () => {
            // Visual toggle
            genderBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            creationState.gender = btn.dataset.value;
            updateCreationSummary();
        };
    });
    // Default select Non-Binary or first option
    genderBtns[2].click(); 

    updateCreationSummary();
    
    // Show Modal
    charCreationModal.classList.remove('hidden');
    loadingIndicator.classList.add('hidden');
}

function grantLoreDiscovery(itemId) {
    const player = gameState.player;
    
    // 1. Add to found set (existing logic)
    if (!gameState.foundLore) gameState.foundLore = new Set();
    if (gameState.foundLore.has(itemId)) return; // Already found
    
    gameState.foundLore.add(itemId);
    grantXp(25); // Base XP for reading
    logMessage("New Codex Entry added.");

    // 2. Check for Set Completion
    let completedSet = null;

    for (const setKey in LORE_SETS) {
        const set = LORE_SETS[setKey];
        // Check if all items in this set are in foundLore
        const allFound = set.items.every(id => gameState.foundLore.has(id));
        
        // Check if we haven't already awarded this set
        // We'll store completed sets in player.completedLoreSets
        if (!player.completedLoreSets) player.completedLoreSets = [];
        
        if (allFound && !player.completedLoreSets.includes(setKey)) {
            completedSet = set;
            player.completedLoreSets.push(setKey);
            
            // --- APPLY PERMANENT BONUS ---
            if (setKey === 'void_research') {
                player.maxMana += 10;
                player.mana += 10;
            }
            // (Other bonuses like price reduction are checked dynamically in their respective functions)
            
            logMessage(`{gold:CODEX COMPLETE: ${set.name}!}`);
            logMessage(`Bonus Unlocked: ${set.bonus}`);
            triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');
        }
    }

    // 3. Save
    playerRef.update({ 
        foundLore: Array.from(gameState.foundLore),
        completedLoreSets: player.completedLoreSets || [] 
    });
}

function selectCreationOption(type, key, element) {
    creationState[type] = key;

    // Visual Update: Remove 'selected' from siblings, add to clicked
    const container = element.parentElement;
    Array.from(container.children).forEach(child => child.classList.remove('selected'));
    element.classList.add('selected');

    updateCreationSummary();
}

function updateCreationSummary() {
    const summaryDiv = document.getElementById('creationSummary');
    const nameInput = document.getElementById('charNameInput');
    creationState.name = nameInput.value.trim();

    const raceName = creationState.race ? PLAYER_RACES[creationState.race].name : "???";
    const className = creationState.background ? PLAYER_BACKGROUNDS[creationState.background].name : "???";
    
    // Calculate Stats Preview
    let stats = [];
    if (creationState.race) {
        const rStats = PLAYER_RACES[creationState.race].stats;
        for(let s in rStats) stats.push(`+${rStats[s]} ${s} (Race)`);
    }
    if (creationState.background) {
        const cStats = PLAYER_BACKGROUNDS[creationState.background].stats;
        for(let s in cStats) stats.push(`+${cStats[s]} ${s} (Class)`);
    }

    summaryDiv.innerHTML = `
        <p>Name: <span class="highlight-text font-bold">${creationState.name || "???"}</span></p>
        <p>Identity: ${creationState.gender || "?"} ${raceName} ${className}</p>
        <div class="mt-2 text-xs border-t pt-2 border-gray-500">
            ${stats.length > 0 ? stats.join('<br>') : "Select Race & Class to see bonuses."}
        </div>
    `;

    // Enable/Disable Button
    const btn = document.getElementById('finalizeCreationBtn');
    if (creationState.name.length > 0 && creationState.race && creationState.background && creationState.gender) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Bind the Name Input to update summary live
document.getElementById('charNameInput').addEventListener('input', updateCreationSummary);

// Bind the Finalize Button
document.getElementById('finalizeCreationBtn').addEventListener('click', finalizeCharacterCreation);

async function finalizeCharacterCreation() {
    const btn = document.getElementById('finalizeCreationBtn');
    btn.disabled = true;
    btn.textContent = "Forging Destiny...";

    const player = gameState.player;
    const bgData = PLAYER_BACKGROUNDS[creationState.background];
    const raceData = PLAYER_RACES[creationState.race];

    // 1. Apply Base Data
    player.name = creationState.name;
    player.race = creationState.race;
    player.gender = creationState.gender;
    player.background = creationState.background; // Class ID

    // 2. Apply Class Stats
    for (const stat in bgData.stats) {
        player[stat] = (player[stat] || 1) + bgData.stats[stat];
    }
    
    // 3. Apply Race Stats
    for (const stat in raceData.stats) {
        player[stat] = (player[stat] || 1) + raceData.stats[stat];
    }

    // 4. Recalculate Derived Vitals (Health/Mana) based on TOTAL Constitution/Wits
    // (Default is 10, plus bonuses)
    player.maxHealth = 10 + (player.constitution * 5);
    player.health = player.maxHealth;
    
    player.maxMana = 10 + (player.wits * 5);
    player.mana = player.maxMana;
    
    player.maxStamina = 10 + (player.endurance * 5);
    player.stamina = player.maxStamina;

    // 5. Apply Inventory (Class Kit)
    bgData.items.forEach(newItem => {
        player.inventory.push(newItem);
    });

    // 6. Auto-Equip
    const weapon = player.inventory.find(i => i.type === 'weapon');
    const armor = player.inventory.find(i => i.type === 'armor');
    if (weapon) { player.equipment.weapon = weapon; weapon.isEquipped = true; }
    if (armor) { player.equipment.armor = armor; armor.isEquipped = true; }

    // 7. Save and Start
    await playerRef.set(sanitizeForFirebase(player));

    charCreationModal.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    canvas.style.visibility = 'visible';
    
    gameState.mapMode = 'overworld';
    
    logMessage(`Welcome, ${player.name} the ${raceData.name} ${bgData.name}.`);
    
    renderStats();
    renderEquipment();
    renderInventory();
    renderTime();
    resizeCanvas();
    render();
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
    '^': 2,
    '≈': 2, 
    '~': Infinity, 
    'F': 1, 
};


const talentModal = document.getElementById('talentModal');
const closeTalentButton = document.getElementById('closeTalentButton');
const talentListDiv = document.getElementById('talentList');
const talentPointsDisplay = document.getElementById('talentPointsDisplay');

function openTalentModal() {
    inputBuffer = null;
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

ctx.font = `${TILE_SIZE}px monospace`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

function triggerAtmosphericFlavor(tile) {
    // 5% chance to trigger flavor text on move (approx every 20 steps)
    if (Math.random() > 0.05) return;

    let flavorOptions = [];
    const time = gameState.time;
    const weather = gameState.weather;

    // 1. Add Weather/Time Context
    if (weather === 'storm' || weather === 'rain') {
        flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.STORM);
    }
    if (time.hour >= 20 || time.hour < 5) {
        flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.NIGHT);
    } else if (time.hour >= 5 && time.hour < 8) {
        flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.DAWN);
    }

    // 2. Add Biome Context
    if (tile === 'F') flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.FOREST);
    else if (tile === 'D') flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.DESERT);
    else if (tile === '^') flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.MOUNTAIN);
    else if (tile === '≈') flavorOptions = flavorOptions.concat(ATMOSPHERE_TEXT.SWAMP);

    // 3. Pick a Message
    if (flavorOptions.length > 0) {
        const msg = flavorOptions[Math.floor(Math.random() * flavorOptions.length)];
        // Use gray coloring for atmosphere to distinguish from game mechanics
        logMessage(`{gray:${msg}}`);
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
        // 1. Spend the point & Increase the Stat
        gameState.player.statPoints--;
        gameState.player[statToIncrease]++;

        logMessage(`You increased your ${statToIncrease}!`);

        // 2. Recalculate Derived Vitals (Health/Mana/etc) automatically
        // This replaces the big if/else block that manually added +5
        const oldMaxHealth = gameState.player.maxHealth;
        const oldMaxMana = gameState.player.maxMana;
        
        recalculateDerivedStats();

        // Optional: Heal the difference so they get the benefit immediately
        if (gameState.player.maxHealth > oldMaxHealth) {
            gameState.player.health += (gameState.player.maxHealth - oldMaxHealth);
        }
        if (gameState.player.maxMana > oldMaxMana) {
            gameState.player.mana += (gameState.player.maxMana - oldMaxMana);
        }

        // 3. Update database
        // We save the entire player object state to ensure sync
        playerRef.update({
            statPoints: gameState.player.statPoints,
            [statToIncrease]: gameState.player[statToIncrease],
            maxHealth: gameState.player.maxHealth,
            health: gameState.player.health,
            maxMana: gameState.player.maxMana,
            mana: gameState.player.mana,
            maxStamina: gameState.player.maxStamina,
            stamina: gameState.player.stamina,
            maxPsyche: gameState.player.maxPsyche,
            psyche: gameState.player.psyche
        });

        // 4. Update UI
        renderStats();
    }
}

// Add the event listener to the panel
coreStatsPanel.addEventListener('click', handleStatAllocation);

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

    const btnManualSave = document.getElementById('btnManualSave'); // Get the new button

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

    // --- 5. MANUAL SAVE HANDLER ---
    if (btnManualSave) {
        btnManualSave.onclick = (e) => {
            e.preventDefault();
            manualSaveGame();
        };
    }
    
    console.log("✅ Settings Listeners (Audio, Visuals, Backups, Manual Save) Attached.");
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

// In script.js

// --- AUTH UI ELEMENTS ---
const authTitle = document.getElementById('authTitle');
const authButton = document.getElementById('authButton');
const rememberMe = document.getElementById('rememberMe');
const authToggle = document.getElementById('authToggle');
let isLoginMode = true;

// --- AUTH TOGGLE HANDLER ---
authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        authTitle.textContent = 'Login';
        authButton.textContent = 'Login';
        authToggle.textContent = 'Create Account';
    } else {
        authTitle.textContent = 'Create Account';
        authButton.textContent = 'Sign Up';
        authToggle.textContent = 'Back to Login';
    }
    authError.textContent = '';
});

// --- UNIFIED AUTH BUTTON HANDLER ---
authButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';

    // Set persistence based on the "Remember Me" checkbox
    const persistence = rememberMe.checked 
        ? firebase.auth.Auth.Persistence.LOCAL // Stays logged in across browser sessions
        : firebase.auth.Auth.Persistence.SESSION; // Clears when tab is closed

    try {
        await auth.setPersistence(persistence);

        if (isLoginMode) {
            // LOGIN LOGIC
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            // SIGN UP LOGIC
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            // Note: createDefaultPlayerState() is now called in the selectSlot logic
        }
    } catch (error) {
        handleAuthError(error);
    }
});

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

    // If the Set doesn't exist yet, create it.
    if (!gameState.exploredChunks) {
        // Try to recover data from the player object if it exists there
        if (gameState.player && Array.isArray(gameState.player.exploredChunks)) {
            gameState.exploredChunks = new Set(gameState.player.exploredChunks);
        } else {
            gameState.exploredChunks = new Set();
        }
    }

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

function grantXp(amount) {
    const player = gameState.player;

    // Safety: Ensure amount is a number
    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) return;

    // --- TALENT: SCHOLAR (+20% XP) ---
    if (player.talents && player.talents.includes('scholar')) {
        amount = Math.floor(amount * 1.2);
    }

    player.xp += amount;
    
    logMessage(`You gained ${amount} XP!`);
    triggerStatFlash(statDisplays.xp, true);

    // --- Level Up Loop ---
    while (player.xp >= player.xpToNextLevel) { 
        
        const needed = player.xpToNextLevel; 
        
        if (player.xp >= needed) {
            player.xp -= needed;
            player.level++;
            player.statPoints++;
            player.xpToNextLevel = player.level * 100;

            logMessage(`LEVEL UP! You are now level ${player.level}!`);
            
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createLevelUp(player.x, player.y);
            }

            // Check for Class Evolution
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
        } else {
            break; 
        }
    }

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
    // We set the canvas size to match the TILES, not the container pixels.
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

function initMobileControls() {
    const mobileContainer = document.getElementById('mobileControls');
    if (!mobileContainer) return; // Safety check

    // Show controls when entering game
    mobileContainer.classList.remove('hidden');

    // --- Force show on larger mobile screens ---
    // This removes the Tailwind class that hides it on large screens
    mobileContainer.classList.remove('lg:hidden');

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
    inputBuffer = null; // <--- Stop pending moves
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
    inputBuffer = null;
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

function openBountyBoard() {
    inputBuffer = null; 
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
    if (!gameState.player.quests) return; // Safety check for missing quest object

    const playerQuests = gameState.player.quests;

    for (const questId in playerQuests) {
        const playerQuest = playerQuests[questId];
        const questData = QUEST_DATA[questId];

        // 1. Check if quest data exists in the game code
        if (!questData) {
            console.warn(`Skipping unknown quest ID in save file: ${questId}`);
            continue;
        }
        // 2. Check if the player's quest data is valid (not null/undefined)
        if (!playerQuest || typeof playerQuest !== 'object') {
            console.warn(`Skipping corrupted quest data for: ${questId}`);
            continue;
        }

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
    inputBuffer = null; 
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
    const player = gameState.player;
    // Ensure the set exists from previous step
    const foundEntries = new Set(player.foundCodexEntries || []);

    // 1. Loop through defined Sets
    for (const setKey in LORE_SETS) {
        const set = LORE_SETS[setKey];
        const isComplete = player.completedLoreSets && player.completedLoreSets.includes(setKey);
        
        // Count progress
        const foundCount = set.items.filter(id => foundEntries.has(id)).length;
        const totalCount = set.items.length;

        // Render Set Container
        const setDiv = document.createElement('div');
        setDiv.className = `panel p-3 mb-2 rounded border-2 ${isComplete ? 'border-yellow-500 bg-yellow-900 bg-opacity-10' : 'border-gray-600'}`;
        
        let headerHtml = `
            <div class="flex justify-between items-center cursor-pointer" onclick="toggleSetDetails('${setKey}')">
                <h3 class="font-bold ${isComplete ? 'text-yellow-500' : ''}">${set.name}</h3>
                <span class="text-xs">${foundCount}/${totalCount}</span>
            </div>
            <div class="text-xs text-gray-400 italic">${set.description}</div>
            <div class="text-xs text-green-400 mt-1">${isComplete ? 'Bonus Active: ' + set.bonus : ''}</div>
        `;

        // Render Entries inside the set (Hidden by default or separate logic)
        let entriesHtml = '<div class="mt-2 space-y-1 pl-2 border-l-2 border-gray-700 hidden" id="set-content-' + setKey + '">';
        
        set.items.forEach(itemId => {
            const itemData = ITEM_DATA[itemId];
            const hasFound = foundEntries.has(itemId);
            
            if (hasFound) {
                entriesHtml += `
                    <div class="text-sm p-1 hover:bg-gray-700 cursor-pointer rounded" 
                         onclick="openSpecificLore('${itemId}')">
                        📄 ${itemData.title || itemData.name}
                    </div>`;
            } else {
                entriesHtml += `
                    <div class="text-sm p-1 text-gray-600">
                        🔒 Undiscovered Entry
                    </div>`;
            }
        });
        entriesHtml += '</div>';

        setDiv.innerHTML = headerHtml + entriesHtml;
        libraryView.appendChild(setDiv);
    }
}

// Global helpers for HTML onclicks
window.toggleSetDetails = function(setKey) {
    const el = document.getElementById('set-content-' + setKey);
    if (el) el.classList.toggle('hidden');
};

window.openSpecificLore = function(itemId) {
    const data = ITEM_DATA[itemId];
    loreTitle.textContent = data.title;
    loreContent.textContent = data.content;
    loreModal.classList.remove('hidden');
};


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
    inputBuffer = null; 
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
    // The terrainCanvas is already scaled by DPR.
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

            if (tile === '👻k') {
                // We reused the 'hasLens' variable we defined at the top of render() in the previous step
                if (!hasLens) {
                    tile = '.'; // Visually replace ghost with floor
                } else {
                    // Visually render the ghost
                    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; // Ghostly Purple, transparent
                    ctx.font = `bold ${TILE_SIZE}px monospace`;
                    ctx.fillText('👻', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                    
                    // Skip the rest of the loop for this tile so we don't draw over it
                    continue; 
                }
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
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
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

    if (player.completedLoreSets && player.completedLoreSets.includes('adventurer_tips')) {
        hungerDrain *= 0.90; // 10% Slower drain
        thirstDrain *= 0.90; 
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
        ...updates, // Include specific status changes calculated above

        // Core Vitals
        health: gameState.player.health,
        stamina: gameState.player.stamina,
        mana: gameState.player.mana,
        psyche: gameState.player.psyche,
        hunger: gameState.player.hunger,
        thirst: gameState.player.thirst,

        // Progression (XP IS SAVED HERE)
        xp: gameState.player.xp,
        level: gameState.player.level,
        statPoints: gameState.player.statPoints,
        talentPoints: gameState.player.talentPoints || 0,
        killCounts: gameState.player.killCounts || {},
        quests: gameState.player.quests || {},

        // World State
        x: gameState.player.x,
        y: gameState.player.y,
        activeTreasure: gameState.activeTreasure || null,
        weather: gameState.weather || 'clear',
        
        // Exploration Data (Crucial for the "Region Discovery" bug)
        discoveredRegions: Array.from(gameState.discoveredRegions),
        exploredChunks: Array.from(gameState.exploredChunks),
        lootedTiles: Array.from(gameState.lootedTiles)
    };

    // --- 7. SAVE LOGIC ---
    if (gameState.mapMode === 'overworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
        const currentChunkId = `${currentChunkX},${currentChunkY}`;

        // A. IMMEDIATE SAVE ON CHUNK CHANGE
        if (lastPlayerChunkId !== currentChunkId) {
            console.log(`Chunk changed from ${lastPlayerChunkId} to ${currentChunkId}. Forcing immediate save.`);
            flushPendingSave(finalUpdates); // Save any lingering changes from the last chunk
            if (playerRef) {
                 playerRef.update(sanitizeForFirebase(finalUpdates)).catch(err => {
                    console.error("Chunk-change auto-save failed:", err);
                });
            }
            lastPlayerChunkId = currentChunkId; // Update tracker
        } else {
             // B. DEBOUNCED SAVE FOR LOCAL MOVEMENT
            triggerDebouncedSave(finalUpdates);
        }
    } else {
        // In Dungeons/Castles, save immediately on every turn
        if (saveTimeout) clearTimeout(saveTimeout); 
        playerRef.update(sanitizeForFirebase(finalUpdates));
    }

    // --- 8. PASSIVE TALENTS ---
    // PALADIN: HOLY AURA
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

    // 5. WELL RESTED BONUS
    if (inSafeZone && !rested) {
        if (gameState.player.strengthBonusTurns < 10) {
            gameState.player.strengthBonus = 2;
            gameState.player.strengthBonusTurns = 50;
            logMessage("{gold:You feel Well Rested! (+2 Strength for 50 turns)}");
            triggerStatAnimation(statDisplays.strength, 'stat-pulse-green');
            
            renderEquipment(); 
            endPlayerTurn(); // Saves everything
            return;
        } else {
            logMessage("You are already well rested.");
        }
    }

    // 6. Feedback
    if (!rested && !inSafeZone) {
        logMessage("You are already at full health and stamina.");
    } else if (rested) {
        if (inSafeZone) logMessage(`You rest comfortably in the haven. (+${restAmount} HP/Stamina)`);
        else logMessage(logMsg);
    }

    // 7. REMOVED: playerRef.update(...) <-- This was the cause of the bug!
    
    // 8. End Turn (This saves Health, Stamina, AND your pending XP)
    endPlayerTurn();
}

function recalculateDerivedStats() {
    const player = gameState.player;
    
    // 1. Reset to Base (Race + Background + Stat Points + Tomes)
    // Note: We assume current player.strength/constitution includes permanent stat points
    // If you separate base stats from spent points later, update this.
    
    // 2. Base Formulas
    let calculatedMaxHealth = 10 + (player.constitution * 5);
    let calculatedMaxMana = 10 + (player.wits * 5);
    let calculatedMaxStamina = 10 + (player.endurance * 5);
    let calculatedMaxPsyche = 10 + (player.willpower * 3);

    if (player.completedLoreSets) {
        // Void Research: +10 Max Mana
        if (player.completedLoreSets.includes('void_research')) {
            calculatedMaxMana += 10;
        }
        
        // Example Future Set: Titan's History (+10 Health)
        // if (player.completedLoreSets.includes('titan_history')) calculatedMaxHealth += 10;
    }

    // 3. Add Equipment Bonuses
    ['weapon', 'armor'].forEach(slot => {
        const item = player.equipment[slot];
        if (item && item.statBonuses) {
            if (item.statBonuses.constitution) calculatedMaxHealth += (item.statBonuses.constitution * 5);
            if (item.statBonuses.wits) calculatedMaxMana += (item.statBonuses.wits * 5);
            if (item.statBonuses.endurance) calculatedMaxStamina += (item.statBonuses.endurance * 5);
            if (item.statBonuses.willpower) calculatedMaxPsyche += (item.statBonuses.willpower * 3);
        }
    });

    // 4. Add Permanent Anomalies (Elder Tree, etc.)
    // You might need to store these specific permanent buffs in a separate object if they aren't just raw stat increases.
    
    // 5. Apply
    player.maxHealth = calculatedMaxHealth;
    player.maxMana = calculatedMaxMana;
    player.maxStamina = calculatedMaxStamina;
    player.maxPsyche = calculatedMaxPsyche;

    // 6. Clamp current values (don't allow HP > MaxHP)
    player.health = Math.min(player.health, player.maxHealth);
    player.mana = Math.min(player.mana, player.maxMana);
    player.stamina = Math.min(player.stamina, player.maxStamina);
    player.psyche = Math.min(player.psyche, player.maxPsyche);
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

    // 3. Obstacle Check
    if (tileData && tileData.type === 'obstacle') {
        logMessage(`You can't go that way.`);
        return; // Stop the move
    }

    // --- OBELISK PUZZLE LOGIC ---
    if (tileData && tileData.type === 'obelisk_puzzle') {
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
                    {
                        name: fragmentName,
                        type: 'junk',
                        quantity: 1,
                        tile: '🧩'
                    }
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

    if (tileData && tileData.type === 'spirit_npc') {
        const requiredItem = tileData.requiresItem;
        const hasItem = gameState.player.inventory.some(i => i.name === requiredItem);

        if (!hasItem) {
            logMessage(tileData.invisibleMessage || "You shiver.");
            gameState.player.x = newX;
            gameState.player.y = newY;
            gameState.mapDirty = true;
            AudioSystem.playStep();
            endPlayerTurn();
            render();
            return;
        }

        const seed = stringToSeed(tileId + gameState.playerTurnCount);
        const random = Alea(seed);
        const msg = tileData.dialogue[Math.floor(random() * tileData.dialogue.length)];

        loreTitle.textContent = tileData.name;
        loreContent.textContent = `The ghostly figure shimmers into view through your lens.\n\n"${msg}"`;
        loreModal.classList.remove('hidden');

        if (!gameState.foundLore.has(tileId)) {
            grantXp(50);
            gameState.foundLore.add(tileId);
            playerRef.update({
                foundLore: Array.from(gameState.foundLore)
            });
        }
        return;
    }

    // --- SEALED DOOR LOGIC ---
    if (tileData && tileData.type === 'sealed_door') {
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
            playerRef.update({
                stealthTurns: 0
            });
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

                        gameState.mapDirty = true;
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

            // Look up the live entity to get the correct name (e.g. "Spectral Giant Rat")
            // instead of the base template name ("Giant Rat").
            const enemyId = `overworld:${newX},${-newY}`;
            const liveEnemy = gameState.sharedEnemies[enemyId];
            const targetName = liveEnemy ? liveEnemy.name : enemyData.name;

            if (isCrit) {
                logMessage(`CRITICAL HIT! You strike the ${targetName} for ${playerDamage} damage!`);
                if (typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(newX, newY, "CRIT!", "#facc15");
                }
            } else {
                logMessage(`You attack the ${targetName} for ${playerDamage} damage!`);
            }

            isProcessingMove = true;

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
                gameState.sharedEnemies[enemyId] = { ...scaledStats,
                    tile: 's',
                    x: newX,
                    y: newY
                };

                render();
                return; // Stop movement, fight starts next turn
            } else if (roll < 0.50) {
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
            } else {
                // 50% Chance: Just dirt/worms
                logMessage("Just dirt and rocks.");
            }

            // Clear the tile
            chunkManager.setWorldTile(newX, newY, '.');
            playerRef.update({
                inventory: getSanitizedInventory()
            });
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

        // In script.js, inside the 'if (newTile === '🎓')' block:

        // --- 0. SECRET: RESTORE CROWN ---
        const crownIndex = inv.findIndex(i => i.name === 'Shattered Crown');
        if (crownIndex > -1) {
            loreTitle.textContent = "The Historian Gasps";
            loreContent.innerHTML = `
                <p>The Historian drops his quill when he sees the crown in your bag.</p>
                <p>"By the ancestors... that is the diadem of Alaric himself! It is shattered, but I can repair it using my tools."</p>
                <button id="restoreCrownBtn" class="mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded w-full">Restore the Crown</button>
            `;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                document.getElementById('restoreCrownBtn').onclick = () => {
                    // Remove Old Crown
                    inv.splice(crownIndex, 1);

                    // Add Restored Crown (New Item)
                    inv.push({
                        name: "Crown of the First King",
                        type: "armor",
                        tile: "👑",
                        quantity: 1,
                        defense: 2, // Now offers some protection
                        slot: "armor",
                        statBonuses: {
                            charisma: 10,
                            luck: 5,
                            maxMana: 20
                        }, // GODLY STATS
                        description: "Restored to its former glory. You act with the authority of the Old World."
                    });

                    logMessage("The Historian restores the crown. It shines like the sun!");
                    triggerStatAnimation(statDisplays.level, 'stat-pulse-purple');

                    // Save & Close
                    playerRef.update({
                        inventory: getSanitizedInventory()
                    });
                    renderInventory();
                    loreModal.classList.add('hidden');
                };
            }, 0);
            return; // Stop processing other historian dialogue
        }

        // --- 1. MAIN QUEST LOGIC ---
        if (player.relicQuestStage === 0) {
            dialogueHtml = `<p>"Ah, a traveler! I am researching the fall of the Old King. Legend says his power was sealed in three gems."</p><p>"Bring me the <b>Sun Shard</b> from the deserts to the south. I will reward you."</p>`;
            player.relicQuestStage = 1;
        } else if (player.relicQuestStage === 1) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Sun Shard');
            if (hasShardIndex > -1) {
                inv.splice(hasShardIndex, 1);
                player.relicQuestStage = 2;
                grantXp(200);
                dialogueHtml = `<p>"Magnificent! It is warm to the touch. Next, seek the <b>Moon Tear</b>. It is said to be lost in the deep swamps."</p>`;
            } else {
                dialogueHtml = `<p>"The <b>Sun Shard</b> is hidden in the scorching sands of the Desert. Please hurry."</p>`;
            }
        } else if (player.relicQuestStage === 2) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Moon Tear');
            if (hasShardIndex > -1) {
                inv.splice(hasShardIndex, 1);
                player.relicQuestStage = 3;
                grantXp(300);
                dialogueHtml = `<p>"Incredible. One remains. The <b>Void Crystal</b>. It lies in the highest peaks of the Mountains, guarded by ancient beasts."</p>`;
            } else {
                dialogueHtml = `<p>"The <b>Moon Tear</b> is in the Swamp. Beware the poison."</p>`;
            }
        } else if (player.relicQuestStage === 3) {
            const hasShardIndex = inv.findIndex(i => i.name === 'Void Crystal');
            if (hasShardIndex > -1) {
                // Check space before taking
                if (inv.length < MAX_INVENTORY_SLOTS) {
                    inv.splice(hasShardIndex, 1);
                    player.relicQuestStage = 4;
                    grantXp(500);
                    const reward = ITEM_DATA['⚡']; // Stormbringer
                    inv.push({ ...reward,
                        quantity: 1
                    });
                    dialogueHtml = `<p>"You have done it! The trinity is restored. As promised, take this... The King's own blade, <b>Stormbringer</b>."</p>`;
                } else {
                    dialogueHtml = `<p>"I have your reward, but your pack is full! Make space and return to me."</p>`;
                }
            } else {
                dialogueHtml = `<p>"The <b>Void Crystal</b> is in the Mountains. It is the most dangerous journey."</p>`;
            }
        } else {
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
                            playerRef.update({
                                inventory: getSanitizedInventory()
                            });
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
                            playerRef.update({
                                inventory: getSanitizedInventory()
                            });
                            renderInventory();
                        } else {
                            logMessage("Not enough shards.");
                        }
                    };
                }
            }, 0);
        }

        // Save progress
        playerRef.update({
            relicQuestStage: player.relicQuestStage,
            inventory: getSanitizedInventory()
        });
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
            gameState.player.inventory.push({
                name: 'Memory Shard',
                type: 'junk',
                quantity: 1,
                tile: '👻'
            });
        } else {
            logMessage("Your inventory is full, the shard falls to the ground.");
            // Logic to leave it on ground is handled by not clearing tile if full? 
            // Actually, let's just clear it and say it's lost to keep it simple, or drop it.
        }

        chunkManager.setWorldTile(newX, newY, '.'); // Remove ghost
        playerRef.update({
            inventory: getSanitizedInventory()
        });
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
        } else if (theme && (newTile === theme.wall || newTile === ' ')) {
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

            playerRef.update({
                strengthBonus: 5,
                strengthBonusTurns: 500
            });
            renderEquipment();
            shrineUsed = true;

            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({
                lootedTiles: Array.from(gameState.lootedTiles)
            });
            loreModal.classList.add('hidden');
        }, {
            once: true
        });

        document.getElementById('shrineWits').addEventListener('click', () => {
            logMessage("You pray for Wits. Your mind expands with ancient knowledge!");
            player.witsBonus = 5;
            player.witsBonusTurns = 500;

            playerRef.update({
                witsBonus: 5,
                witsBonusTurns: 500
            });
            renderStats();

            shrineUsed = true;
            if (shrineUsed) gameState.lootedTiles.add(tileId);
            playerRef.update({
                lootedTiles: Array.from(gameState.lootedTiles)
            });
            loreModal.classList.add('hidden');
        }, {
            once: true
        });

        return;
    }

    if (newTile === '⛲') {
        if (gameState.player.coins >= 50) {
            logMessage("You toss 50 gold into the well...");
            gameState.player.coins -= 50;
            playerRef.update({
                coins: gameState.player.coins
            });
            renderStats();
            const roll = Math.random();
            if (roll < 0.3) {
                logMessage("...and receive a Healing Potion!");
                gameState.player.inventory.push({
                    name: 'Healing Potion',
                    type: 'consumable',
                    quantity: 1,
                    tile: '+',
                    effect: ITEM_DATA['+'].effect
                });
            } else if (roll < 0.6) {
                logMessage("...and feel refreshed! (Full Heal)");
                gameState.player.health = gameState.player.maxHealth;
                gameState.player.mana = gameState.player.maxMana;
                playerRef.update({
                    health: gameState.player.health,
                    mana: gameState.player.mana
                });
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
    } else if (tileData && tileData.type === 'loot_chest') {

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
        playerRef.update({
            coins: gameState.player.coins,
            inventory: gameState.player.inventory
        });
        renderInventory();
        return;
    } else if (newTile === '<') {
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
                playerRef.update({
                    lootedTiles: Array.from(gameState.lootedTiles)
                });
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
        playerRef.update({
            isBoating: false
        });
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
            // New centralized handler
            grantLoreDiscovery(tileId); // tileId is used as unique key for map locations

            // For the Codex, we also want to mark the ITEM ID as found, not just the map coordinate.
            // This requires a slight shift: tracking "Lore Item IDs" separate from "Map Coordinates".
            // For simplicity, we can assume 'grantLoreDiscovery' handles both if we pass the right ID.
            // Let's rely on ITEM_DATA keys being unique enough for now.

            // To make the set system work, we need to track the ITEM TEMPLATE ID (e.g. "📜1")
            // alongside the specific map tile coordinates.
            if (!gameState.foundCodexEntries) gameState.foundCodexEntries = new Set();
            gameState.foundCodexEntries.add(newTile); // Add "📜1"
            playerRef.update({
                foundCodexEntries: Array.from(gameState.foundCodexEntries)
            });

            // Trigger the set check with the ITEM KEY, not the coordinate
            checkLoreSets(newTile);

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
                        else playerInventory.push({
                            name: 'Wood Log',
                            type: 'junk',
                            quantity: 1,
                            tile: '🪵'
                        });
                        logMessage("You gathered a Wood Log!");
                        inventoryWasUpdated = true;
                    } else {
                        logMessage("Inventory full! The wood is lost.");
                    }
                } else if (toolName === 'Pickaxe') {
                    if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                        const existingStone = playerInventory.find(i => i.name === 'Stone');
                        if (existingStone) existingStone.quantity++;
                        else playerInventory.push({
                            name: 'Stone',
                            type: 'junk',
                            quantity: 1,
                            tile: '🪨'
                        });
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
            playerRef.update({
                health: gameState.player.health,
                stamina: gameState.player.stamina,
                mana: gameState.player.mana,
                psyche: gameState.player.psyche
            });
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
                            gameState.player.inventory.push({
                                name: reward.name,
                                type: reward.type,
                                quantity: 1,
                                tile: '👓',
                                defense: reward.defense,
                                slot: reward.slot,
                                statBonuses: reward.statBonuses
                            });
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
                    gameState.player.inventory.push({
                        name: 'Scroll: Clarity',
                        type: 'spellbook',
                        quantity: 1,
                        tile: '📜',
                        spellId: 'clarity'
                    });
                } else {
                    logMessage("But your inventory is full.");
                    return;
                }
            }
            gameState.lootedTiles.add(tileId);
            playerRef.update({
                lootedTiles: Array.from(gameState.lootedTiles),
                inventory: gameState.player.inventory
            });
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
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
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
            playerRef.update({
                coins: gameState.player.coins,
                inventory: gameState.player.inventory
            });
            renderInventory();
            renderStats();
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
                playerRef.update({
                    unlockedWaypoints: player.unlockedWaypoints
                });
            }

            // 3. Generate Lore (Keep existing flavor)
            if (!gameState.foundLore.has(tileId)) {
                // grantXp(10); // Removed small XP, moved to Attunement above
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            const elev = elevationNoise.noise(newX / 70, newY / 70);
            const moist = moistureNoise.noise(newX / 50, newY / 50);
            let loreArray = LORE_PLAINS;
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
                    playerRef.update({
                        inventory: gameState.player.inventory
                    });
                    renderInventory();
                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    gameState.player.inventory.push({
                        name: 'Obsidian Shard',
                        type: 'junk',
                        quantity: 1,
                        tile: '▲'
                    });
                    logMessage("The Obelisk hums, and a shard of black glass falls into your hand.");
                    playerRef.update({
                        inventory: gameState.player.inventory
                    });
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
                    playerRef.update({
                        mana: gameState.player.mana,
                        psyche: gameState.player.psyche
                    });
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
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }
            return;
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
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            if (!playerQuest) {
                loreTitle.textContent = "Distraught Villager";
                loreContent.innerHTML = `<p>An old villager wrings their hands.\n\n"Oh, thank goodness! A goblin stole my family heirloom... It's all I have left. If you find it, please bring it back!"</p><button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll keep an eye out."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                    acceptQuest(npcQuestId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            } else if (playerQuest.status === 'active') {
                const hasItem = player.inventory.some(item => item.name === questData.itemNeeded);
                if (hasItem) {
                    loreTitle.textContent = "Joyful Villager";
                    loreContent.innerHTML = `<p>The villager's eyes go wide.\n\n"You found it! My heirloom! Thank you, thank you! I don't have much, but please, take this for your trouble."</p><button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                        turnInQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                } else {
                    loreTitle.textContent = "Anxious Villager";
                    loreContent.innerHTML = `<p>The villager looks up hopefully.\n\n"Any luck finding my heirloom? Those goblins are such pests..."</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                }
            } else if (playerQuest.status === 'completed') {
                const seed = stringToSeed(tileId);
                const random = Alea(seed);
                const rumor = VILLAGER_RUMORS[Math.floor(random() * VILLAGER_RUMORS.length)];
                loreTitle.textContent = "Grateful Villager";
                loreContent.innerHTML = `<p>The villager smiles warmly.\n\n"Thank you again for your help, adventurer. By the way..."</p><p class="italic text-sm mt-2">"${rumor}"</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Good to know."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('closeNpcLore').addEventListener('click', () => {
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
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
                document.getElementById('acceptGuard').addEventListener('click', () => {
                    acceptQuest(questId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
                return;
            } else if (playerQuest.status === 'active') {
                if (playerQuest.kills >= 1) {
                    loreTitle.textContent = "Impressed Captain";
                    loreContent.innerHTML = `<p>"They say the Chief is dead? Ha! I knew you had it in you. Take this blade, you've earned it."</p><button id="turnInGuard" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Thanks. (Complete)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInGuard').addEventListener('click', () => {
                        turnInQuest(questId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                    return;
                } else {
                    logMessage("The Captain nods. 'Bring me the Chief's head.'");
                }
            } else {
                // Default Flavor Text if quest is done
                const msgs = ["The roads are safer thanks to you.", "Stay sharp out there.", "Move along, citizen."];
                logMessage(`Guard: "${msgs[Math.floor(Math.random() * msgs.length)]}"`);
            }
            return;
        }

        if (newTile === 'O') {
            const tileId = (gameState.mapMode === 'overworld') ?
                `${newX},${-newY}` :
                `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;

            if (!gameState.foundLore.has(tileId)) {
                logMessage("You listen to the Sage's ramblings. +10 XP");
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
            loreTitle.textContent = "Sage";
            loreContent.textContent = `The old Sage is staring at a tapestry, muttering to themself.\n\n"...yes, yes... ${message}..."`;
            loreModal.classList.remove('hidden');
            return;
        }

        if (newTile === 'T') {
            // --- Define tileId ---
            const tileId = (gameState.mapMode === 'overworld') ?
                `${newX},${-newY}` :
                `${gameState.currentCaveId || gameState.currentCastleId}:${newX},${-newY}`;


            if (!gameState.foundLore.has(tileId)) {
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
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
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            if (!playerQuest) {
                loreTitle.textContent = "Frustrated Prospector";
                loreContent.innerHTML = `<p>A grizzled prospector, muttering to themself, jumps as you approach.\n\n"Goblins! I hate 'em! Always stealing my supplies, leaving these... these *totems* everywhere. Say, if you're clearing 'em out, bring me 10 of those Goblin Totems. I'll make it worth your while!"</p><button id="acceptNpcQuest" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full">"I'll see what I can do."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('acceptNpcQuest').addEventListener('click', () => {
                    acceptQuest(npcQuestId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            } else if (playerQuest.status === 'active') {
                const itemInInv = player.inventory.find(item => item.name === questData.itemNeeded);
                const hasItems = itemInInv && itemInInv.quantity >= questData.needed;
                if (hasItems) {
                    loreTitle.textContent = "Surprised Prospector";
                    loreContent.innerHTML = `<p>The prospector's eyes go wide as you show him the totems.\n\n"Ha! You actually did it! That'll teach 'em. Here, as promised. This is for your trouble."</p><button id="turnInNpcQuest" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Here you go. (Complete Quest)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInNpcQuest').addEventListener('click', () => {
                        turnInQuest(npcQuestId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                } else {
                    const needed = questData.needed - (itemInInv ? itemInInv.quantity : 0);
                    loreTitle.textContent = "Impatient Prospector";
                    loreContent.innerHTML = `<p>The prospector looks up.\n\n"Back already? You still need to find ${needed} more ${questData.itemNeeded}s. Get a move on!"</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"I'm still looking."</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('closeNpcLore').addEventListener('click', () => {
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
                }
            } else if (playerQuest.status === 'completed') {
                loreTitle.textContent = "Grateful Prospector";
                loreContent.innerHTML = `<p>The prospector nods at you.\n\n"Thanks again for your help, adventurer. The caves are a little quieter... for now."</p><button id="closeNpcLore" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"You're welcome."</button>`;
                loreModal.classList.remove('hidden');
                document.getElementById('closeNpcLore').addEventListener('click', () => {
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
            }
            return;
        }

        if (newTile === '§') {
            const hour = gameState.time.hour;
            if (hour < 6 || hour >= 20) {
                logMessage("The General Store is closed. A sign reads: 'Open 6 AM - 8 PM'.");
                return;
            }

            // Discovery XP Logic
            const tileId = `${newX},${-newY}`; // Used for lore discovery
            if (!gameState.foundLore.has(tileId)) {
                logMessage("You've discovered a General Store! +15 XP");
                grantXp(15);
                gameState.foundLore.add(tileId);
                playerRef.update({
                    foundLore: Array.from(gameState.foundLore)
                });
            }

            // --- NEW SHOP PERSISTENCE LOGIC ---

            // 1. Generate Unique Shop ID
            // We use the Map ID + Coordinates to ensure every specific shop node is unique
            let contextId = "overworld";
            if (gameState.mapMode === 'castle') contextId = gameState.currentCastleId;
            // (Dungeon shops don't exist yet, but this handles them if added)
            if (gameState.mapMode === 'dungeon') contextId = gameState.currentCaveId;

            const shopId = `shop_${contextId}_${newX}_${newY}`;

            // 2. Initialize Container if missing
            if (!gameState.shopStates) gameState.shopStates = {};

            // 3. Check if this specific shop has been visited this session
            if (!gameState.shopStates[shopId]) {
                // First visit! Clone the appropriate template.
                let template = SHOP_INVENTORY; // Default
                if (gameState.mapMode === 'castle') template = CASTLE_SHOP_INVENTORY;

                // Deep copy to break reference to the global constant
                gameState.shopStates[shopId] = JSON.parse(JSON.stringify(template));
            }

            // 4. Point active inventory to the persistent session state
            activeShopInventory = gameState.shopStates[shopId];

            if (gameState.mapMode === 'castle') {
                logMessage("You enter the castle emporium.");
            } else {
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
                document.getElementById('acceptHealer').addEventListener('click', () => {
                    acceptQuest(questId);
                    loreModal.classList.add('hidden');
                }, {
                    once: true
                });
                return;
            } else if (playerQuest.status === 'active') {
                const itemIndex = gameState.player.inventory.findIndex(i => i.name === 'Medicinal Herb');
                const qty = itemIndex > -1 ? gameState.player.inventory[itemIndex].quantity : 0;

                if (qty >= 5) {
                    loreTitle.textContent = "Relieved Healer";
                    loreContent.innerHTML = `<p>"You found them! These are perfect. Here, take these potions for your trouble."</p><button id="turnInHealer" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">"Glad to help. (Complete)"</button>`;
                    loreModal.classList.remove('hidden');
                    document.getElementById('turnInHealer').addEventListener('click', () => {
                        turnInQuest(questId);
                        loreModal.classList.add('hidden');
                    }, {
                        once: true
                    });
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
                openCraftingModal('workbench');
                return;
            case 'village_entrance':
                if (!gameState.foundLore.has(tileId)) {
                    logMessage("You've discovered a safe haven village! +100 XP");
                    grantXp(100);
                    gameState.foundLore.add(tileId);
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                gameState.mapMode = 'castle';
                gameState.currentCastleId = tileData.getVillageId(newX, newY);
                gameState.overworldExit = {
                    x: gameState.player.x,
                    y: gameState.player.y
                };
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
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                gameState.mapMode = 'dungeon';
                gameState.currentCaveId = 'cave_landmark';
                gameState.overworldExit = {
                    x: gameState.player.x,
                    y: gameState.player.y
                };
                const epicMap = chunkManager.generateCave(gameState.currentCaveId);
                gameState.currentCaveTheme = chunkManager.caveThemes[gameState.currentCaveId];
                for (let y = 0; y < epicMap.length; y++) {
                    const x = epicMap[y].indexOf('>');
                    if (x !== -1) {
                        gameState.player.x = x;
                        gameState.player.y = y;
                        break;
                    }
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
                    playerRef.update({
                        foundLore: Array.from(gameState.foundLore)
                    });
                }
                gameState.player.isBoating = true;
                logMessage("You get in the canoe.");
                gameState.flags.canoeEmbarkCount++;
                const count = gameState.flags.canoeEmbarkCount;
                if (count === 1 || count === 3 || count === 7) logMessage("Be warned: Rowing the canoe will cost stamina!");
                chunkManager.setWorldTile(newX, newY, '.');
                playerRef.update({
                    isBoating: true
                });
                break;
            case 'dungeon_entrance':
                // --- Ensure Set exists ---
                if (!gameState.foundLore) gameState.foundLore = new Set();

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

    // 4. Handle item pickups
    let tileId;
    if (gameState.mapMode === 'overworld') {
        tileId = `${newX},${-newY}`;
    } else {
        const mapId = gameState.currentCaveId || gameState.currentCastleId;
        tileId = `${mapId}:${newX},${-newY}`;
    }

    const itemData = ITEM_DATA[newTile];

    // --- MAGIC ITEM GENERATION (Sparkles) ---
    if (newTile === '✨') {
        if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
            const dist = Math.sqrt(newX * newX + newY * newY);
            let tier = 1;
            if (dist > 500) tier = 4;
            else if (dist > 250) tier = 3;
            else if (dist > 100) tier = 2;

            const newItem = generateMagicItem(tier);
            gameState.player.inventory.push(newItem);
            logMessage(`You picked up a ${newItem.name}!`);

            inventoryWasUpdated = true;
            gameState.lootedTiles.add(tileId);

            // Clear the tile visually
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
    }
    // --- STANDARD ITEM PICKUP ---
    else if (itemData) {
        let isTileLooted = gameState.lootedTiles.has(tileId);
        
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
            gameState.mapDirty = true; // Force redraw
        }

        if (itemData.type === 'random_lore') {
            const seed = stringToSeed(`${newX},${newY}`);
            const random = Alea(seed);
            const fragment = LORE_FRAGMENTS[Math.floor(random() * LORE_FRAGMENTS.length)];
            loreTitle.textContent = "Forgotten Letter";
            loreContent.textContent = `You smooth out the paper. The handwriting is faded.\n\n"${fragment}"`;
            loreModal.classList.remove('hidden');
            clearLootTile();
            inventoryWasUpdated = true;
        }
        else if (isTileLooted) {
            logMessage(`You see where a ${itemData.name} once was...`);
        } 
        else {
            // --- INSTANT ITEMS (Gold) ---
            if (itemData.type === 'instant') {
                itemData.effect(gameState, tileId);
                clearLootTile();
                inventoryWasUpdated = true; 
                renderStats(); 
                // FORCE SAVE: Prevents gold from resetting if you reload immediately
                if (typeof flushPendingSave === 'function') flushPendingSave();
            } 
            // HANDLE ALL PICKUPABLE ITEMS
            else {
                const existingItem = gameState.player.inventory.find(item => item.name === itemData.name);
                // Allow equipment to stack now too
                const isStackable = ['junk', 'consumable', 'trade', 'ingredient', 'quest', 'lore', 'tool', 'armor', 'weapon'].includes(itemData.type);

                if (existingItem && isStackable) {
                    existingItem.quantity++;
                    logMessage(`You picked up a ${itemData.name}.`);
                    
                    inventoryWasUpdated = true;
                    clearLootTile();
                    
                    // FORCE SAVE IMMEDIATELY to secure the loot
                    flushPendingSave({
                        inventory: getSanitizedInventory(),
                        lootedTiles: Array.from(gameState.lootedTiles)
                    });

                } else if (gameState.player.inventory.length < MAX_INVENTORY_SLOTS) {
                    
                    // Create safe object for DB (Copied from existing logic)
                    const itemForDb = {
                        name: itemData.name,
                        type: itemData.type,
                        quantity: 1,
                        tile: newTile,
                        damage: itemData.damage || null,
                        defense: itemData.defense || null,
                        slot: itemData.slot || null,
                        statBonuses: itemData.statBonuses || null,
                        effect: itemData.effect || null,
                        spellId: itemData.spellId || null,
                        skillId: itemData.skillId || null,
                        stat: itemData.stat || null
                    };
                    gameState.player.inventory.push(itemForDb);
                    
                    logMessage(`You picked up a ${itemData.name}.`);
                    inventoryWasUpdated = true;
                    clearLootTile();

                    // FORCE SAVE IMMEDIATELY to secure the loot
                    flushPendingSave({
                        inventory: getSanitizedInventory(),
                        lootedTiles: Array.from(gameState.lootedTiles)
                    });

                } else {
                    logMessage(`You see a ${itemData.name}, but your inventory is full!`);
                }
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
            } else if (gameState.activeTreasure && newX === gameState.activeTreasure.x && newY === gameState.activeTreasure.y) {
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

function clearSessionState() {
    gameState.lootedTiles.clear();
    gameState.discoveredRegions.clear();
    wokenEnemyTiles.clear();
    pendingSpawns.clear(); // Clear pending spawns

    gameState.mapMode = null;

    gameState.shopStates = {}; // Clear shop memory

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

    // 0. Cancel any pending saves immediately

    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }

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
        playerRef.set(sanitizeForFirebase(finalState), { merge: true }).catch(err => {
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

    // 1. Sync World Time
    const timeDoc = await db.collection('world').doc('time').get();
    if (timeDoc.exists) {
        const data = timeDoc.data();
        gameState.time.day = data.day;
        gameState.time.hour = data.hour;
        gameState.time.minute = data.minute;
        renderTime();
    }

    // 2. Handle Permadeath / Respawn Logic
    if (playerData.health <= 0) {
        logMessage("You have respawned at the village.");
        const defaultState = createDefaultPlayerState();
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
            maxHealth: playerData.maxHealth || 10,
            maxMana: playerData.maxMana || 10,
            maxStamina: playerData.maxStamina || 10,
            maxPsyche: playerData.maxPsyche || 10,
            spellbook: playerData.spellbook || {},
            skillbook: playerData.skillbook || {},
            craftingLevel: playerData.craftingLevel || 1,
            craftingXp: playerData.craftingXp || 0,
            craftingXpToNext: playerData.craftingXpToNext || 50,
            classEvolved: playerData.classEvolved || false,
            className: playerData.className || null,
            character: playerData.character || '@'
        };

        // Merge logic for respawn
        playerData = {
            ...defaultState,
            ...preservedStats,
            x: 0,
            y: 0,
            health: preservedStats.maxHealth,
            mana: preservedStats.maxMana,
            stamina: preservedStats.maxStamina,
            coins: Math.floor((playerData.coins || 0) / 2),
            inventory: [
                { name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', isEquipped: true }
            ],
            equipment: {
                weapon: { name: 'Fists', damage: 0 },
                armor: { name: 'Tattered Rags', defense: 0 }
            }
        };

        // Save new alive state
        await playerRef.set(sanitizeForFirebase(playerData));
    }

    // --- FIX: REHYDRATE ITEMS BEFORE APPLYING STATE ---
    if (playerData.inventory) {
        playerData.inventory = rehydratePlayerState(playerData);
    }

    // Merge everything into global gameState
    const fullPlayerData = {
        ...createDefaultPlayerState(),
        ...playerData 
    };
    Object.assign(gameState.player, fullPlayerData);

    // --- FIX: RELINK EQUIPMENT ---
    // Equipment slots must point to the specific objects in the inventory array
    if (gameState.player.equipment) {
        const invWeapon = gameState.player.inventory.find(i => i.type === 'weapon' && i.isEquipped);
        if (invWeapon) gameState.player.equipment.weapon = invWeapon;
        
        const invArmor = gameState.player.inventory.find(i => i.type === 'armor' && i.isEquipped);
        if (invArmor) gameState.player.equipment.armor = invArmor;
    }

    recalculateDerivedStats(); 

    // --- Anti-Stuck Logic (Safe spot search) ---
    if (gameState.mapMode === 'overworld') {
        const currentTile = chunkManager.getTile(gameState.player.x, gameState.player.y);
        const blockedTiles = ['^', '▓', '▒', '🧱'];
        if (!gameState.player.isBoating && (currentTile === '~' || currentTile === '≈')) {
            blockedTiles.push('~', '≈'); 
        }

        if (blockedTiles.includes(currentTile)) {
            console.warn("Player loaded inside obstacle. Finding safe spot...");
            let found = false;
            for (let r = 1; r <= 5; r++) { 
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
                            playerRef.update({ x: tx, y: ty });
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
    
    // Chunk Tracking
    const startChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
    const startChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
    lastPlayerChunkId = `${startChunkX},${startChunkY}`;

    // --- RESTORE SETS ---
    gameState.discoveredRegions = new Set(playerData.discoveredRegions || []);
    gameState.foundLore = new Set(playerData.foundLore || []);
    gameState.lootedTiles = new Set(playerData.lootedTiles || []);
    gameState.exploredChunks = new Set(playerData.exploredChunks || []);
    // Re-bind Codex (optional visual data not critical for engine but good for logs)
    // foundCodexEntries logic is handled via foundLore sets in this version

    if (!playerData.background) {
        loadingIndicator.classList.add('hidden');
        charCreationModal.classList.remove('hidden');
        return;
    }

    // --- SETUP LISTENERS ---
    if (sharedEnemiesListener) rtdb.ref('worldEnemies').off('value', sharedEnemiesListener);
    if (chatListener) rtdb.ref('chat').off('child_added', chatListener);

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
                    lootedTiles: Array.from(gameState.lootedTiles),
                    exploredChunks: Array.from(gameState.exploredChunks)
                };
                if (finalState.inventory) finalState.inventory = getSanitizedInventory();
                
                delete finalState.color;
                delete finalState.character;
                playerRef.set(sanitizeForFirebase(finalState), { merge: true });
            });
        }
    });

    db.collection('world').doc('time').onSnapshot((doc) => {
        if (doc.exists) {
            const serverTime = doc.data();
            gameState.time.day = serverTime.day;
            gameState.time.hour = serverTime.hour;
            gameState.time.minute = serverTime.minute;
            renderTime();
            render(); 
        }
    });

    rtdb.ref('onlinePlayers').on('value', (snapshot) => {
        const newOtherPlayers = snapshot.val() || {};
        if (newOtherPlayers[player_id]) {
            // Note: We deliberately DO NOT sync our own position from here 
            // to avoid jitter. Our local state is authority for position.
            delete newOtherPlayers[player_id];
        }
        otherPlayers = newOtherPlayers;
        render();
    });

    // --- ENEMY LISTENER ---
    const sharedEnemiesRef = rtdb.ref('worldEnemies');
    
    const onChildAdded = sharedEnemiesRef.on('child_added', (snapshot) => {
        const key = snapshot.key;
        const val = snapshot.val();
        if (val) {
            if (val.health <= 0) { rtdb.ref(`worldEnemies/${key}`).remove(); return; }
            if (val._processedThisTurn) delete val._processedThisTurn;
            gameState.sharedEnemies[key] = val;
            updateSpatialMap(key, null, null, val.x, val.y);
            if (pendingSpawnData[key]) delete pendingSpawnData[key];
            render();
        }
    });

    const onChildChanged = sharedEnemiesRef.on('child_changed', (snapshot) => {
        const key = snapshot.key;
        const val = snapshot.val();
        if (val) {
            if (val._processedThisTurn) delete val._processedThisTurn;
            const oldEnemy = gameState.sharedEnemies[key];

            // Floating Combat Text for OTHER players hits
            if (oldEnemy && val.health < oldEnemy.health) {
                const damageDiff = oldEnemy.health - val.health;
                if (damageDiff > 0 && typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.createFloatingText(val.x, val.y, `-${damageDiff}`, '#cbd5e1'); 
                    ParticleSystem.createExplosion(val.x, val.y, '#ef4444', 3);
                }
            }

            const oldX = oldEnemy ? oldEnemy.x : null;
            const oldY = oldEnemy ? oldEnemy.y : null;
            gameState.sharedEnemies[key] = val;
            updateSpatialMap(key, oldX, oldY, val.x, val.y);
            render();
        }
    });

    const onChildRemoved = sharedEnemiesRef.on('child_removed', (snapshot) => {
        const key = snapshot.key;
        if (gameState.sharedEnemies[key]) {
            const enemy = gameState.sharedEnemies[key];
            updateSpatialMap(key, enemy.x, enemy.y, null, null);
            delete gameState.sharedEnemies[key];
            render();
        }
    });

    sharedEnemiesListener = () => {
        sharedEnemiesRef.off('child_added', onChildAdded);
        sharedEnemiesRef.off('child_changed', onChildChanged);
        sharedEnemiesRef.off('child_removed', onChildRemoved);
    };

    gameState.initialEnemiesLoaded = true;

    // --- PROTECTED SNAPSHOT LISTENER (See previous step) ---
    unsubscribePlayerListener = playerRef.onSnapshot({ includeMetadataChanges: true }, (doc) => {
        // Prevent syncing over local changes during play
        if (doc.metadata.hasPendingWrites || gameState.mapMode || isProcessingMove) {
            return;
        }
        if (doc.exists) {
            const data = doc.data();
            // This only runs if we are sitting in a menu and an external admin changes our data,
            // or on extremely slow initial loads where the game state wasn't set yet.
            const statsToSync = ['coins', 'xp', 'level', 'statPoints'];
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
        const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const timeSpan = document.createElement('span');
        timeSpan.className = "muted-text text-xs";
        timeSpan.textContent = `[${timeString}] `;

        const nameStrong = document.createElement('strong');
        if (message.senderId === player_id) nameStrong.className = "highlight-text";
        const safeName = escapeHtml(message.email ? message.email.split('@')[0] : "Unknown");
        nameStrong.textContent = `${safeName}: `;

        const msgSpan = document.createElement('span');
        const safeBody = escapeHtml(message.message); 
        const formattedBody = safeBody
            .replace(/{red:(.*?)}/g, '<span class="text-red-500">$1</span>')
            .replace(/{blue:(.*?)}/g, '<span class="text-blue-400">$1</span>');

        msgSpan.innerHTML = formattedBody; 
        messageDiv.appendChild(timeSpan);
        messageDiv.appendChild(nameStrong);
        messageDiv.appendChild(msgSpan); 
        chatMessages.prepend(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // --- FINAL RENDER & INIT ---

    // Pre-warm data loading
    const waitForWorldData = new Promise((resolve) => {
        if (gameState.mapMode === 'overworld') {
            const cX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
            const cY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
            for(let y=-1; y<=1; y++) {
                for(let x=-1; x<=1; x++) {
                    chunkManager.getTile((cX+x)*chunkManager.CHUNK_SIZE, (cY+y)*chunkManager.CHUNK_SIZE);
                }
            }
            chunkManager.listenToChunkState(cX, cY, () => resolve());
        } else {
            resolve();
        }
    });

    const waitForEnemies = new Promise((resolve) => {
        if (gameState.mapMode === 'overworld') {
            rtdb.ref('worldEnemies').once('value').then(snapshot => {
                const enemies = snapshot.val() || {};
                Object.entries(enemies).forEach(([key, val]) => {
                    if (val && val.health > 0) {
                        gameState.sharedEnemies[key] = val;
                        updateSpatialMap(key, null, null, val.x, val.y);
                    }
                });
                resolve();
            });
        } else {
            resolve();
        }
    });

    Promise.all([waitForWorldData, waitForEnemies]).then(() => {
        if (gameState.mapMode === 'overworld') {
            wakeUpNearbyEnemies(); 
        }

        setTimeout(() => {
            // Force updates
            renderStats();
            renderEquipment();
            renderTime();
            resizeCanvas();
            renderHotbar();
            renderInventory(); // Renders rehydrated items
            render();
            
            canvas.style.visibility = 'visible';
            syncPlayerState();

            logMessage(`Welcome back, ${playerData.background} of level ${gameState.player.level}.`);
            updateRegionDisplay();
            updateExploration();
            loadingIndicator.classList.add('hidden');

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
    playerRef.set(sanitizeForFirebase(player));

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
