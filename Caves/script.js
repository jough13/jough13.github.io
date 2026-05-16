// Globals

/**
 * Queues a Firestore update. If another update comes in before the timer fires,
 * the previous one is cancelled and the new one takes its place.
 */

let pendingSaveData = null; // Add this to your globals at the top

function triggerDebouncedSave(updates) {
    if (saveTimeout) clearTimeout(saveTimeout);
    pendingSaveData = updates; 
    
    // Safety check: Only manipulate the indicator if it exists!
    const saveIcon = document.getElementById('saveIndicator');
    if (saveIcon) saveIcon.classList.remove('hidden'); 

    saveTimeout = setTimeout(() => {
        if (playerRef && pendingSaveData) {
            playerRef.update(sanitizeForFirebase(pendingSaveData)).catch(err => console.error(err));
        }
        saveTimeout = null;
        pendingSaveData = null;
        
        // Hide the icon once complete
        if (saveIcon) saveIcon.classList.add('hidden'); 
    }, 2000); 
}

function flushPendingSave(updates = null) {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
        
        // Use provided updates, or fallback to the global pending data
        const dataToSave = updates || pendingSaveData;
        if (dataToSave && playerRef) {
            playerRef.update(dataToSave);
            console.log("☁️ Forced flush save.");
        }
        pendingSaveData = null;
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
    
    // Only attempt to save if we have a valid database reference
    if (playerRef) {
        // Explicitly gather ALL engine state so we don't lose map memory on logout!
        const finalState = {
            ...gameState.player,
            inventory: getSanitizedInventory(),
            equipment: getSanitizedEquipment(),
            lootedTiles: Object.fromEntries(gameState.lootedTiles),
            discoveredRegions: Array.from(gameState.discoveredRegions),
            exploredChunks: Array.from(gameState.exploredChunks),
            foundLore: Array.from(gameState.foundLore || []),
            foundCodexEntries: Array.from(gameState.foundCodexEntries || []),
            shopStates: gameState.shopStates || {},
            activeTreasure: gameState.activeTreasure || null,
        };

        // Remove ephemeral visual properties
        delete finalState.color;
        delete finalState.character;

        // Save to Firestore
        playerRef.set(sanitizeForFirebase(finalState), { merge: true }).catch(err => {
            console.error("Error saving on logout:", err);
        });
    }

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
let inputQueue = [];

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

async function renderSlots() {
    slotsContainer.innerHTML = '';
    const charsRef = db.collection('players').doc(currentUser.uid).collection('characters');

    const slotIds = ['slot1', 'slot2', 'slot3'];

    for (const slotId of slotIds) {
        const doc = await charsRef.doc(slotId).get();
        const slotDiv = document.createElement('div');
        
        slotDiv.className = "ui-input-asset flex-col justify-between transition-transform cursor-pointer hover:scale-[1.02] min-h-[320px] w-full !p-6";

        if (doc.exists) {
            const data = doc.data();
            const bg = PLAYER_BACKGROUNDS[data.background] || { name: 'Unknown' };

            // --- OCCUPIED SLOT UI ---
            slotDiv.innerHTML = `
                <div class="text-center w-full pt-2">
                    <h3 class="text-3xl font-bold text-white mb-2" style="font-family: 'Uncial Antiqua', cursive; text-shadow: 2px 2px 0 #000;">${data.name || 'Unnamed'}</h3>
                    <div class="text-4xl my-3 text-[#4ade80]" style="text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);">${data.isBoating ? 'c' : (data.character || '@')}</div>
                    <p class="font-bold text-yellow-400 text-lg uppercase tracking-widest">${bg.name}</p>
                    <p class="text-sm text-gray-300 font-bold mt-1">Level ${data.level || 1}</p>
                    <p class="text-xs text-gray-400 mt-3 h-8 leading-tight">${getRegionName(Math.floor((data.x || 0) / 160), Math.floor((data.y || 0) / 160))}</p>
                </div>
                
                <div class="flex gap-2 w-full mt-4 items-center h-12">
                    <button onclick="selectSlot('${slotId}')" class="ui-btn-asset flex-grow h-full !text-2xl !p-0 !mt-0">PLAY</button>
                    
                    <!-- ADDED: relative top-[ px] right-[ px] -->
                    <button onclick="deleteSlot('${slotId}')" class="relative top-[3px] right-[9px] w-12 h-8 flex-none bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xl flex items-center justify-center transition-transform active:scale-95" style="border: 2px solid #000; box-shadow: inset -2px -2px 0px rgba(0,0,0,0.4), inset 2px 2px 0px rgba(255,255,255,0.3); text-shadow: 2px 2px 0px #000;" title="Delete">X</button>
                </div>
            `;
        } else {
            // --- EMPTY SLOT UI ---
            slotDiv.classList.add('opacity-80', 'hover:opacity-100');

            slotDiv.onclick = (e) => {
                if (e.target === slotDiv || e.target.closest('.empty-slot-content')) selectSlot(slotId);
            };

            slotDiv.innerHTML = `
                <div class="text-center w-full empty-slot-content pt-6 flex-grow flex flex-col justify-center">
                    <h3 class="text-2xl font-bold mb-4 text-gray-400" style="font-family: 'Uncial Antiqua', cursive;">Slot ${slotId.replace('slot', '')}</h3>
                    <div class="text-5xl mb-4 text-gray-600">+</div>
                    <p class="text-gray-500 font-bold tracking-widest uppercase">Empty</p>
                </div>
                
                <div class="w-full mt-4 h-12">
                    <button onclick="event.stopPropagation(); selectSlot('${slotId}')" class="ui-btn-asset w-full h-full !text-2xl !p-0 !mt-0 !text-gray-200">CREATE</button>
                </div>
            `;
        }
        slotsContainer.appendChild(slotDiv);
    }
    loadingIndicator.classList.add('hidden');
}

logoutFromSelectButton.addEventListener('click', () => {
    auth.signOut();
    characterSelectModal.classList.add('hidden');
    authContainer.classList.remove('hidden');
});

function createDefaultPlayerState() {
    return {
        x: 0,
        y: 0,
        character: '@',
        color: '#3b82f6',
        coins: 0,
        health: 5, // FIXED: Matches your recalculate Derived Stats logic
        maxHealth: 5,
        mana: 5,
        maxMana: 5,
        stamina: 5,
        maxStamina: 5,
        psyche: 7,
        maxPsyche: 7,

        // --- LIGHT SURVIVAL STATS ---
        hunger: 50,
        maxHunger: 100,
        thirst: 50,
        maxThirst: 100,

        unlockedWaypoints: [], 
        discoveredPOIs: [], // NEW: Tracks landmarks for the Map

        obeliskProgress: [], 

        strength: 1, wits: 1, luck: 1, constitution: 1,
        dexterity: 1, charisma: 1, willpower: 1, perception: 1,
        endurance: 1, intuition: 1,

        equipment: {
            weapon: { name: 'Fists', damage: 0 },
            armor: { name: 'Simple Tunic', defense: 0 },
            offhand: null,
            accessory: null,
            ammo: null
        },

        inventory: [
            { templateId: '🍞', name: 'Hardtack', type: 'consumable', quantity: 2, tile: '🍞' },
            { templateId: '💧f', name: 'Flask of Water', type: 'consumable', quantity: 2, tile: '💧' }
        ],

        bank: [], 
        talents: [], 
        talentPoints: 0,
        killCounts: {}, 

        spellbook: { "lesserHeal": 1, "magicBolt": 1 },
        skillbook: { "brace": 1, "lunge": 1 },

        level: 1, xp: 0, xpToNextLevel: 100, statPoints: 0,
        foundLore: [], 

        defenseBonus: 0, defenseBonusTurns: 0,
        shieldValue: 0, shieldTurns: 0,
        strengthBonus: 0, strengthBonusTurns: 0,
        witsBonus: 0, witsBonusTurns: 0,

        frostbiteTurns: 0, poisonTurns: 0, rootTurns: 0,
        candlelightTurns: 0, isBoating: false, activeTreasure: null,
        exploredChunks: [], quests: {},
        hotbar: [null, null, null, null, null], 
        cooldowns: {}, stealthTurns: 0, companion: null, 

        craftingLevel: 1, craftingXp: 0, craftingXpToNext: 50,
    };
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
            } else if (setKey === 'deep_delver') {
                player.maxStamina += 5;
                player.stamina += 5;
                triggerStatAnimation(statDisplays.stamina, 'stat-pulse-yellow');
            } else if (setKey === 'beastmaster_guide') {
                player.perception += 1;
                triggerStatAnimation(statDisplays.perception, 'stat-pulse-green');
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
    '<': 0, // Stairs are free to step on
    '>': 0  // Make sure exit stairs are free too
};


const talentModal = document.getElementById('talentModal');
const closeTalentButton = document.getElementById('closeTalentButton');
const talentListDiv = document.getElementById('talentList');
const talentPointsDisplay = document.getElementById('talentPointsDisplay');



closeTalentButton.addEventListener('click', () => talentModal.classList.add('hidden'));

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

    // 1. Initialize State if missing
    if (typeof player.weatherIntensity === 'undefined') player.weatherIntensity = 0;
    if (typeof player.weatherState === 'undefined') player.weatherState = 'calm'; 
    if (typeof player.weatherDuration === 'undefined') player.weatherDuration = 0;

    // OPTIMIZATION: Only sample the heavy Perlin noise once every 20 turns
    let localForecast = 'clear';
    if (gameState.mapMode === 'overworld') {
        if (gameState.playerTurnCount % 20 === 0 || !gameState.currentForecast) {
            const temp = elevationNoise.noise(player.x / 300, player.y / 300);
            const humid = moistureNoise.noise(player.x / 300 + 100, player.y / 300 + 100);
            
            if (humid > 0.92) { 
                if (temp < 0.3) gameState.currentForecast = 'snow';
                else if (humid > 0.96) gameState.currentForecast = 'storm'; 
                else gameState.currentForecast = 'rain';
            } else if (humid > 0.85 && temp < 0.35) { 
                gameState.currentForecast = 'fog';
            } else {
                gameState.currentForecast = 'clear';
            }
        }
        localForecast = gameState.currentForecast || 'clear';
    }

    // 2. Weather State Machine
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

// --- AUTH UI ELEMENTS ---
const authTitle = document.getElementById('authTitle'); // Back to targeting the H1!
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
        authButton.textContent = 'LOGIN';
        authToggle.textContent = 'Create Account';
    } else {
        authTitle.textContent = 'Create Account';
        authButton.textContent = 'SIGN UP';
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

    // Calculate Chunk ID
    const chunkX = Math.floor(gameState.player.x / MAP_CHUNK_SIZE);
    const chunkY = Math.floor(gameState.player.y / MAP_CHUNK_SIZE);
    
    // --- Prevent saving corrupted NaN chunk IDs ---
    if (isNaN(chunkX) || isNaN(chunkY)) return false;
    
    const chunkId = `${chunkX},${chunkY}`;

    // If the Set doesn't exist yet, create it.
    if (!gameState.exploredChunks) {
        // Try to recover data from the player object if it exists there
        if (gameState.player && Array.isArray(gameState.player.exploredChunks)) {
            gameState.exploredChunks = new Set(gameState.player.exploredChunks);
        } else {
            gameState.exploredChunks = new Set();
        }
    }

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

    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, `+${amount} XP`, '#a855f7');

    // --- Level Up Loop ---
    while (player.xp >= player.xpToNextLevel) { 
        
        const needed = player.xpToNextLevel; 
        
        if (player.xp >= needed) {
            player.xp -= needed;
            player.level++;
            player.statPoints++;
            player.xpToNextLevel = player.level * 100;
            
            // --- FULL HEAL ON LEVEL UP ---
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            player.stamina = player.maxStamina;
            player.hunger = player.maxHunger;
            player.thirst = player.maxThirst;

            logMessage(`LEVEL UP! You are now level ${player.level}!`);
            logMessage(`{green:You feel completely revitalized!}`); // Added flavor text
            
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
    inputQueue = [];
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

const evolutionModal = document.getElementById('evolutionModal');
const evolutionOptionsDiv = document.getElementById('evolutionOptions');

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

    // --- Reset the animated tile tracker! ---
    gameState.visibleAnimatedTiles =[];

    // --- OVERDRAW BUFFER: Shift canvas so x=-1 and y=-1 don't get clipped off ---
    terrainCtx.save();
    terrainCtx.translate(TILE_SIZE, TILE_SIZE);

    // Loop through the Viewport (START AT -1 FOR THE BUFFER)
    for (let y = -1; y <= VIEWPORT_HEIGHT + 1; y++) {
        for (let x = -1; x <= VIEWPORT_WIDTH + 1; x++) {
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
                
                // Base cobblestone/dark stone floor color
                bgColor = '#44403c'; 

                if (tile === '▓' || tile === '▒') {
                    TileRenderer.drawWall(terrainCtx, x, y, '#78350f', '#451a03', 'brick');
                } else if (tile === 'F') {
                    // Render castle courtyard gardens
                    TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, '#14532d');
                } else if (tile === '=') {
                    // Render wooden bridges/paths
                    TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); 
                } else if (tile === '.') {
                    // Render standard cobblestone floor
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                } else {
                    // Everything else (NPCs, Exits, Items)
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                    if (tile !== ' ') fgChar = tile;
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

                // --- STATIC DRAWING & ANIMATION SORTING ---
                // Note: We skip animated tiles here, but save them to an array so the main loop can draw them fast!
                if (tile === '~' || tile === '≈' || tile === '🔥' || tile === 'Ω' || tile === '👻k' || (tile === 'D' && gameState.currentCaveTheme === 'FIRE')) {
                    gameState.visibleAnimatedTiles.push({ screenX: x, screenY: y, mapX: mapX, mapY: mapY, tile: tile });
                } else {
                    switch (tile) {
                        case '.': TileRenderer.drawPlains(terrainCtx, x, y, mapX, mapY, bgColor, '#15803d'); break;
                        case 'F': TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '^': TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case 'd': TileRenderer.drawDeadlands(terrainCtx, x, y, mapX, mapY, bgColor, '#444'); break;
                        case 'D': TileRenderer.drawDesert(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '🧱': TileRenderer.drawWall(terrainCtx, x, y, '#78716c', '#57534e'); break;
                        case '▤': 
                        case '=': TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); break;
                        case '+': fgChar = '+'; fgColor = '#fbbf24'; break;
                        case '/': fgChar = '/'; fgColor = '#000'; break;
                        default:
                            fgChar = tile;
                            const isWideCharCheck = typeof isWideChar === 'function' ? isWideChar : (c) => /\p{Extended_Pictographic}/u.test(c);
                            if (ENEMY_DATA[tile]) fgColor = ENEMY_DATA[tile].color || '#ef4444';
                            break;
                    }
                }
            }

            // Draw Static Character (Items, Objects)
            if (fgChar) {
                if (fgChar === '^' || fgChar === '⛰') {
                    const isCave = (fgChar === '⛰');
                    
                    // Pass the isCave boolean so it forces a mountain peak to render!
                    TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor || '#22c55e', isCave);
                    
                    if (isCave) {
                        terrainCtx.fillStyle = '#1f2937';
                        terrainCtx.fillRect((x * TILE_SIZE) + (TILE_SIZE * 0.4), (y * TILE_SIZE) + (TILE_SIZE * 0.7), TILE_SIZE * 0.2, TILE_SIZE * 0.3);
                    }
                } else {
                    terrainCtx.fillStyle = fgColor;
                    const isWideCharCheck = typeof isWideChar === 'function' ? isWideChar : (c) => /\p{Extended_Pictographic}/u.test(c);
                    terrainCtx.font = isWideCharCheck(fgChar) ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
                    terrainCtx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }
    }

    // --- CLEANUP: Restore the context so subsequent draws aren't permanently shifted
    terrainCtx.restore();
}

const render = () => {
    if (!gameState.mapMode) return;

    // --- SETUP ---
    if (!cachedThemeColors.canvasBg) updateThemeColors();
    const { canvasBg } = cachedThemeColors;

    // Check if the player possesses the lens right now
    const hasLens = gameState.player.inventory.some(i => i.name === 'Spirit Lens');

    // 1. Clear & Fill Background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); 

    // --- SCREEN SHAKE ---
    let shakeX = 0; let shakeY = 0;
    if (gameState.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * gameState.screenShake;
        shakeY = (Math.random() - 0.5) * gameState.screenShake;
        gameState.screenShake *= 0.9;
        if (gameState.screenShake < 0.5) gameState.screenShake = 0;
    }

    ctx.save(); // Start Scene Transform
    
    // --- 1. SMOOTH CAMERA MATH ---
    const p = gameState.player;
    const visX = p.visualX !== undefined ? p.visualX : p.x;
    const visY = p.visualY !== undefined ? p.visualY : p.y;

    const viewportCenterX = Math.floor(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.floor(VIEWPORT_HEIGHT / 2);
    
    // Use Math.floor instead of Math.round to prevent non-linear jumps
    const startX = Math.floor(visX) - viewportCenterX;
    const startY = Math.floor(visY) - viewportCenterY;

    if (gameState.lastStartX !== startX || gameState.lastStartY !== startY) {
        gameState.mapDirty = true;
        gameState.lastStartX = startX;
        gameState.lastStartY = startY;
    }

    // Sub-tile offset for ultra-smooth camera panning
    const offsetX = (visX - Math.floor(visX)) * TILE_SIZE;
    const offsetY = (visY - Math.floor(visY)) * TILE_SIZE;
    
    // Math.round() the translate so the canvas doesn't bleed sub-pixels (Removes Grid Lines)
    ctx.translate(Math.round(shakeX - offsetX), Math.round(shakeY - offsetY));

    // --- 2. UPDATE TERRAIN CACHE ---
    if (gameState.mapDirty) {
        renderTerrainCache(startX, startY);
        gameState.mapDirty = false;
    }

    // --- 3. DRAW CACHED TERRAIN ---
    // The terrainCanvas is already scaled by DPR.
    const dpr = window.devicePixelRatio || 1;
    const logicalW = terrainCanvas.width / dpr;
    const logicalH = terrainCanvas.height / dpr;

    // Draw the cached terrain shifted UP and LEFT by 1 tile to counter the shift we did in the cache!
    ctx.drawImage(terrainCanvas, -TILE_SIZE, -TILE_SIZE, logicalW, logicalH);

    // --- 4. LIGHTING & DYNAMIC LAYER (OPTIMIZED) ---
    let ambientLight = 0.0;
    let baseRadius = 10;
    const hasTorch = gameState.player.inventory.some(item => item.name === 'Torch');
    const torchBonus = hasTorch ? 6 : 0;
    const candleBonus = (gameState.player.candlelightTurns > 0) ? 8 : 0;

    // Determine ambient light and base radius
    if (gameState.mapMode === 'dungeon') {
        ambientLight = 0.85; // Dungeons are permanently dark
        baseRadius = 6 + Math.floor(gameState.player.perception / 2) + torchBonus + candleBonus;
    } else { 
        // Overworld AND Castles use the Day/Night Cycle!
        const timeInMinutes = (gameState.time.hour * 60) + gameState.time.minute;
        
        // Creates a perfectly smooth wave: 0.0 at noon, 1.0 at midnight
        const timeWave = (Math.cos((timeInMinutes / 1440) * Math.PI * 2) + 1) / 2;
        
        // Scale it so max darkness is 0.85 (pitch black) and noon is 0.0 (bright)
        ambientLight = timeWave * 0.85;
        
        // If it's darker than 30%, shrink vision so torches matter!
        baseRadius = (ambientLight > 0.3) ? 8 + torchBonus + candleBonus : 25;
    }

    const now = Date.now();
    const torchFlicker = (Math.sin(now / 1000) * 0.2) + (Math.cos(now / 2500) * 0.1);
    const lightRadius = baseRadius + torchFlicker;

    // --- EFFICIENT ANIMATED TILE LOOP ---
    // We only loop over the ~15 tiles that actually move, skipping the 1,000+ static ones!
    if (gameState.visibleAnimatedTiles) {
        gameState.visibleAnimatedTiles.forEach(anim => {
            const { screenX: x, screenY: y, mapX, mapY, tile } = anim;

            // Draw Spirit Ghost
            if (tile === '👻k') {
                if (hasLens) {
                    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; 
                    ctx.font = `bold ${TILE_SIZE}px monospace`;
                    ctx.fillText('👻', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            } 
            // Draw Animated Terrain
            else if (tile === '~') {
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
                } else {
                    ctx.fillStyle = fgColor;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            } else if (tile === 'Ω') {
                const spin = Math.floor(now / 150) % 4;
                const chars =['Ω', 'C', 'U', '∩'];
                ctx.fillStyle = '#a855f7';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText(chars[spin], x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }
        });
    }

    // --- ENTITIES & PLAYERS ---
    
    // Attack Telegraphs
    const allEnemies = gameState.mapMode === 'overworld' ? Object.values(gameState.sharedEnemies) : gameState.instancedEnemies;
    if (allEnemies) {
        allEnemies.forEach(enemy => {
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
        const isWide = isWideChar(char);

        // --- 2. OPTIONAL: VISUAL FLAIR ---
        // If it is a spirit and we CAN see it, make it look ghostly (semi-transparent)
        if (entity.type === 'spirit') {
            ctx.globalAlpha = 0.6; // Make it see-through
        }

        ctx.fillStyle = entity.color || '#ef4444';
                ctx.font = isWide ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
        
        // 1. Draw the bright red outline/stroke FIRST (so it sits behind the text)
        ctx.strokeStyle = '#ef4444'; // Bright Red
        ctx.lineWidth = 2; // Thickness of the outline
        ctx.strokeText(char, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        
        // 2. Draw the actual colored entity ON TOP of the outline
        ctx.fillStyle = entity.color || '#ef4444';
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

    // Helper to calculate smooth gliding for any object

    const lerpEntity = (entity) => {
        if (entity.visualX === undefined) entity.visualX = entity.x;
        if (entity.visualY === undefined) entity.visualY = entity.y;
        
        // TELEPORT SNAP FOR ENEMIES AND OTHER PLAYERS
        if (Math.abs(entity.x - entity.visualX) > 2 || Math.abs(entity.y - entity.visualY) > 2) {
            entity.visualX = entity.x;
            entity.visualY = entity.y;
        }

        // We use a fixed interpolation speed for entities here to keep them snappy
        entity.visualX += (entity.x - entity.visualX) * 0.4;
        entity.visualY += (entity.y - entity.visualY) * 0.4;
        return { vx: entity.visualX, vy: entity.visualY };
    };

    // Draw Enemies (Smoothly!)
    const enemyList = gameState.mapMode === 'overworld' ? Object.values(gameState.sharedEnemies) : gameState.instancedEnemies;
    
    enemyList.forEach(enemy => {
        const { vx, vy } = lerpEntity(enemy);
        const screenX = vx - startX;
        const screenY = vy - startY;
        // Widened the on-screen check from -1 to -2 to ensure smooth gliding in from offscreen
        if (screenX >= -2 && screenX <= VIEWPORT_WIDTH && screenY >= -2 && screenY <= VIEWPORT_HEIGHT) {
            drawEntity(enemy, screenX, screenY);
        }
    });

    // Draw Multiplayer Friends (Smoothly!)
    if (gameState.mapMode !== 'dungeon') {
        for (const id in otherPlayers) {
            const op = otherPlayers[id];
            if (op.mapMode !== gameState.mapMode || op.mapId !== (gameState.currentCaveId || gameState.currentCastleId)) continue;
            
            const { vx, vy } = lerpEntity(op);
            const screenX = (vx - startX) * TILE_SIZE;
            const screenY = (vy - startY) * TILE_SIZE;
            
            if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
                ctx.fillStyle = '#f97316';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText('@', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
                if (op.companion) {
                    ctx.fillStyle = '#86efac';
                    ctx.font = `bold ${TILE_SIZE * 0.7}px monospace`;
                    ctx.fillText(op.companion.tile || '?', screenX + TILE_SIZE - 2, screenY + 6);

                }
            // --- NEW: DRAW OTHER PLAYER CHAT BUBBLE ---
                if (op.chatBubble && Date.now() < op.chatTimer) {
                    ctx.font = `bold 12px monospace`;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    const textWidth = ctx.measureText(op.chatBubble).width;
                    ctx.fillRect(screenX + TILE_SIZE/2 - textWidth/2 - 4, screenY - 20, textWidth + 8, 16);
                    
                    ctx.fillStyle = 'white';
                    ctx.fillText(op.chatBubble, screenX + TILE_SIZE/2, screenY - 12);
                }
            }
        }
    }

    // Draw the Player (Smoothly!)
    const playerChar = gameState.player.isSailing ? '⛵' : (gameState.player.isBoating ? 'c' : gameState.player.character);
    ctx.font = `bold ${TILE_SIZE}px monospace`;
    
    // Draw based on visual offset relative to startX/startY
    const pScreenX = (visX - startX) * TILE_SIZE + TILE_SIZE / 2;
    const pScreenY = (visY - startY) * TILE_SIZE + TILE_SIZE / 2;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(playerChar, pScreenX, pScreenY);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(playerChar, pScreenX, pScreenY);

    // --- DRAW YOUR CHAT BUBBLE ---
    if (gameState.player.chatBubble && Date.now() < gameState.player.chatTimer) {
        ctx.font = `bold 12px monospace`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(gameState.player.chatBubble).width;
        ctx.fillRect(pScreenX - textWidth/2 - 4, pScreenY - TILE_SIZE - 12, textWidth + 8, 16);
        
        ctx.fillStyle = 'white';
        ctx.fillText(gameState.player.chatBubble, pScreenX, pScreenY - TILE_SIZE - 4);
    }

    // --- 5. EFFICIENT SMOOTH LIGHTING OVERLAY ---
    
    // Unify darkness variable since we calculated it properly for all zones above!
    const outerDarkness = ambientLight; 

    // If it's daytime (outerDarkness is 0), this skips drawing the shadow entirely!
    if (outerDarkness > 0.0) {
        // Base Tint Color: Warm Orange
        let r = 255, g = 140, b = 0; 
        
        // Contextual Tints
        if (gameState.mapMode === 'dungeon') {
            const themeName = chunkManager.caveThemes[gameState.currentCaveId];
            if (themeName === 'ICE') { r = 100; g = 200; b = 255; }
            if (themeName === 'VOID') { r = 168; g = 85; b = 247; }
        } else if (gameState.mapMode === 'overworld' && gameState.weather === 'storm') {
            r = 100; g = 100; b = 150;
        }

        // Hardware-Accelerated Gradient
        const lightPxRadius = lightRadius * TILE_SIZE;
        const darknessGradient = ctx.createRadialGradient(
            pScreenX, pScreenY, lightPxRadius * 0.2, // Inner radius
            pScreenX, pScreenY, lightPxRadius        // Outer edge
        );

        // Center: Bright, warm orange glow
        darknessGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
        // Midpoint: Fading into shadow
        darknessGradient.addColorStop(0.5, `rgba(0, 0, 0, ${outerDarkness * 0.6})`);
        // Edge: Pitch Black
        darknessGradient.addColorStop(1, `rgba(0, 0, 0, ${outerDarkness})`);

        // Draw one single massive rectangle over the whole screen (Max Performance)
        ctx.fillStyle = darknessGradient;
        ctx.fillRect(-TILE_SIZE * 2, -TILE_SIZE * 2, (VIEWPORT_WIDTH + 4) * TILE_SIZE, (VIEWPORT_HEIGHT + 4) * TILE_SIZE);
    }

    // --- Nighttime Fireflies ---
    // If it's dark, and we are in a forest, spawn ambient fireflies!
    if (outerDarkness > 0.4 && gameState.mapMode === 'overworld') {
        const centerTile = chunkManager.getTile(p.x, p.y);
        if (centerTile === 'F' || centerTile === '🌳e') {
            // 5% chance per frame to spawn a firefly
            if (Math.random() < 0.05 && typeof ParticleSystem !== 'undefined') {
                const fx = p.x + (Math.random() * VIEWPORT_WIDTH) - (VIEWPORT_WIDTH / 2);
                const fy = p.y + (Math.random() * VIEWPORT_HEIGHT) - (VIEWPORT_HEIGHT / 2);
                ParticleSystem.spawn(fx, fy, '#86efac', 'dust', '', 2); // Glowing green
                
                // Hack: Override the standard gravity so fireflies float UP and drift
                const activeBug = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (activeBug) {
                    activeBug.vy = -0.02 - (Math.random() * 0.02);
                    activeBug.vx = (Math.random() - 0.5) * 0.05;
                    activeBug.gravity = 0;
                    activeBug.lifeFade = 0.01; // Fade out very slowly
                }
            }
        }
    }

    const intensity = gameState.player.weatherIntensity || 0;
        if (intensity > 0 && gameState.weather !== 'clear' && gameState.mapMode === 'overworld') {
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

/**
 * Calculates the natural terrain for a specific coordinate
 * based on the world seed noises.
 */

function getBaseTerrain(worldX, worldY) {
    const elev = elevationNoise.noise(worldX / 70, worldY / 70);
    const moist = moistureNoise.noise(worldX / 50, worldY / 50);

    let tile = '.';
    if (elev < 0.35) tile = '~'; // Water
    else if (elev < 0.4 && moist > 0.7) tile = '≈'; // Swamp
    else if (elev > 0.8) tile = '^'; // Mountain
    else if (elev > 0.6 && moist < 0.3) tile = 'd'; // Deadlands
    else if (moist < 0.15) tile = 'D'; // Desert
    else if (moist > 0.55) tile = 'F'; // Forest

    // --- NATURAL SPAWN SAFETY OVERRIDE ---
    // Instead of a hard square, use a circular radius (Distance Squared)
    const distSq = (worldX * worldX) + (worldY * worldY);
    if (distSq <= 100) { // Radius of 10 tiles from spawn
        // Only override blocking or dangerous terrain, let natural forests/deserts stay!
        if (['^', '~', '≈', 'd'].includes(tile)) {
            // Downgrade dangerous tiles to Forest or Plains depending on how wet the area is
            tile = moist > 0.5 ? 'F' : '.'; 
        }
    }

    return tile;
}

function endPlayerTurn(turnUpdates = {}) {
    
    // Inherit any updates passed in from movement/interactions!
    let updates = { ...turnUpdates }; 

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

        if (!hasArmor && !hasPotion && !gameState.godMode) {
            logMessage("The lava burns you! (2 Dmg)");
            player.health -= 2;
            gameState.screenShake = 10;
            triggerStatFlash(statDisplays.health, false);
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, "BURN", "#ef4444");

            if (handlePlayerDeath()) return;
        }
    }

    // 2. DROWNING (Sunken Temple / Deep Water)
    if (currentTile === '~') {
        const hasGills = player.waterBreathingTurns > 0;
        const isBoating = player.isBoating;

        if (!hasGills && !isBoating && !gameState.godMode) {
            if (player.waterBreathingTurns === 0 && updates.waterBreathingTurns === 0) {
                logMessage("Your magical gills fade away...");
            }
            logMessage("The deep water swallows you whole!");
            logMessage("You have drowned.");

            player.health = 0;
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(player.x, player.y, "☠️", "#1e3a8a");

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

    // Mages & Necromancers (and their evolutions) regenerate mana every 3 turns. Others every 5 turns.
    const isMage = ['mage', 'necromancer'].includes(player.background);
    const manaRegenRate = isMage ? 3 : 5; 

    // Regenerate if they aren't starving/dehydrated and aren't at max mana
    if (player.hunger > 0 && player.thirst > 0 && player.mana < player.maxMana && gameState.playerTurnCount % manaRegenRate === 0) {
        player.mana++;
        
        // We only log it occasionally to prevent spamming the chat box, but the UI bar flashes every time!
        if (gameState.playerTurnCount % (manaRegenRate * 3) === 0) {
            logMessage("Your magic reserves slowly replenish. (+1 Mana)");
        }
        
        triggerStatFlash(statDisplays.mana, true);
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

                        if (typeof EnemyNetworkManager !== 'undefined') {
                            rtdb.ref(EnemyNetworkManager.getPath(tx, ty, enemyId)).set(newEnemy);
                        }
                        
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

    // --- DISTRIBUTED ENEMY GARBAGE COLLECTION ---
    // Every 50 turns, have this client sweep the area to delete abandoned enemies
    if (gameState.mapMode === 'overworld' && gameState.playerTurnCount % 50 === 0) {
        Object.entries(gameState.sharedEnemies).forEach(([enemyId, enemy]) => {
            let isNearAnyone = false;
            
            // 1. Is it near YOU? (Within 100 tiles)
            if (Math.abs(enemy.x - gameState.player.x) < 100 && Math.abs(enemy.y - gameState.player.y) < 100) {
                isNearAnyone = true;
            }
            
            // 2. Is it near any OTHER online player?
            for (const pid in otherPlayers) {
                const op = otherPlayers[pid];
                if (op.mapMode === 'overworld' && Math.abs(enemy.x - op.x) < 100 && Math.abs(enemy.y - op.y) < 100) {
                    isNearAnyone = true;
                }
            }

            // 3. If no one is around, delete it from Firebase to save database quotas!
            if (!isNearAnyone) {
                if (typeof EnemyNetworkManager !== 'undefined') {
                    rtdb.ref(EnemyNetworkManager.getPath(enemy.x, enemy.y, enemyId)).remove();
                }
                delete gameState.sharedEnemies[enemyId];
            }
        });
    }

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

    processEnemyTurns();

    // We merge the specific status updates (poison, buffs) with the core stats.
    // This ensures XP, Quests, and Health are saved together, preventing the reset bug.
 const finalUpdates = {
        ...updates, 

        // Core Vitals
        health: gameState.player.health,
        stamina: gameState.player.stamina,
        mana: gameState.player.mana,
        psyche: gameState.player.psyche,
        hunger: gameState.player.hunger,
        thirst: gameState.player.thirst,

        // Progression 
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
        weather: gameState.weather || 'clear'
    };

    // OPTIMIZATION: Only serialize massive sets if they were flagged as changed in attemptMovePlayer
    if (updates.exploredChunks) finalUpdates.exploredChunks = updates.exploredChunks;
    if (updates.lootedTiles) finalUpdates.lootedTiles = updates.lootedTiles;
    if (updates.discoveredRegions) finalUpdates.discoveredRegions = updates.discoveredRegions;

    // --- 7. SAVE LOGIC (OPTIMIZED) ---
    if (gameState.mapMode === 'overworld') {
        const currentChunkX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
        const currentChunkId = `${currentChunkX},${currentChunkY}`;

        if (lastPlayerChunkId !== currentChunkId) {
            flushPendingSave(finalUpdates); 
            if (playerRef) playerRef.update(sanitizeForFirebase(finalUpdates)).catch(console.error);
            lastPlayerChunkId = currentChunkId; 
        } else {
            triggerDebouncedSave(finalUpdates);
        }
    } else {
        // Use debounced saving for instances too to prevent Firebase throttling
        triggerDebouncedSave(finalUpdates);
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

            // Delete the specific chunk from Firebase RTDB
            rtdb.ref('worldState/' + chunkId).remove().then(() => {
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
    let calculatedMaxHealth = 5 + (player.constitution * 5);
    let calculatedMaxMana = 5 + (player.wits * 5);
    let calculatedMaxStamina = 5 + (player.endurance * 5);
    let calculatedMaxPsyche = 7 + (player.willpower * 3);

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
            chatInput.blur(); 
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

        chatInput.blur(); // Unfocus after chatting so you can walk immediately!
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
        if (typeof EnemyNetworkManager !== 'undefined') {
        EnemyNetworkManager.clearAll();
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
            lootedTiles: Object.fromEntries(gameState.lootedTiles)
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

    gameState.exploredChunks = new Set(playerData.exploredChunks || []);
    gameState.shopStates = playerData.shopStates || {};

    gameState.lootedTiles = new Map();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (playerData.lootedTiles) {
        if (Array.isArray(playerData.lootedTiles)) {
            // Legacy Migration: Convert old arrays to timestamped map
            playerData.lootedTiles.forEach(id => gameState.lootedTiles.set(id, now));
        } else {
            // Normal Load: Filter out any tiles looted more than 24 hours ago
            for (const [id, timestamp] of Object.entries(playerData.lootedTiles)) {
                if (now - timestamp < TWENTY_FOUR_HOURS) {
                    gameState.lootedTiles.set(id, timestamp);
                }
            }
        }
    }
    
    // Polyfill .add() so we don't break existing game logic!
    gameState.lootedTiles.add = function(key) { this.set(key, Date.now()); };

    if (!playerData.background) {
        loadingIndicator.classList.add('hidden');
        charCreationModal.classList.remove('hidden');
        return;
    }

    // --- SETUP LISTENERS ---
    if (sharedEnemiesListener) {
        sharedEnemiesListener(); // Execute the cleanup wrapper!
        sharedEnemiesListener = null;
    }
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

            // We ONLY want to remove the player from the online list when they disconnect.
            // Do NOT append a .then() here, as it will execute immediately on the client and wipe data!
            onlinePlayerRef.onDisconnect().remove();
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

    // --- START ENEMY CHUNK LISTENER ---
    if (gameState.mapMode === 'overworld' && typeof EnemyNetworkManager !== 'undefined') {
        EnemyNetworkManager.syncChunks(gameState.player.x, gameState.player.y);
    }

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
    // Assign it to the global variable so it can be cleaned up on logout!
    chatListener = chatRef.on('child_added', (snapshot) => {
        const message = snapshot.val();

        // --- FLOATING CHAT BUBBLE ---
        // Store the message on the player object for 5 seconds
        // Only draw the bubble if the message was sent in the last 5 seconds!
        const now = Date.now();
        if (now - message.timestamp < 5000) {
            if (message.senderId === player_id) {
                gameState.player.chatBubble = message.message;
                gameState.player.chatTimer = now + 5000;
            } else if (otherPlayers[message.senderId]) {
                otherPlayers[message.senderId].chatBubble = message.message;
                otherPlayers[message.senderId].chatTimer = now + 5000;
            }
        }

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

    // --- Pre-warm data loading (Load ALL 3x3 chunks, not just the center!) ---
    const waitForWorldData = new Promise((resolve) => {
        if (gameState.mapMode === 'overworld') {
            const cX = Math.floor(gameState.player.x / chunkManager.CHUNK_SIZE);
            const cY = Math.floor(gameState.player.y / chunkManager.CHUNK_SIZE);
            
            let chunksLoaded = 0;
            const totalChunks = 9;

            for(let y = -1; y <= 1; y++) {
                for(let x = -1; x <= 1; x++) {
                    const targetX = cX + x;
                    const targetY = cY + y;
                    
                    // 1. Force procedural generation in local memory
                    chunkManager.getTile(targetX * chunkManager.CHUNK_SIZE, targetY * chunkManager.CHUNK_SIZE);
                    
                    // 2. Attach Firebase listener and wait for ALL 9 to return their initial snapshot
                    chunkManager.listenToChunkState(targetX, targetY, () => {
                        chunksLoaded++;
                        if (chunksLoaded === totalChunks) resolve();
                    });
                }
            }
        } else {
            resolve(); // Instanced maps (Dungeons/Castles) load instantly locally
        }
    });

    const waitForEnemies = new Promise((resolve) => {
        if (gameState.mapMode === 'overworld' && typeof EnemyNetworkManager !== 'undefined') {
            // Initiate the wide-net chunk sync right now instead of waiting for the first move
            EnemyNetworkManager.syncChunks(gameState.player.x, gameState.player.y);
            
            // Because RTDB `.on()` listeners don't have a clean "all done" callback like Firestore,
            // we give the Realtime Database a flat 400ms to download the surrounding enemies.
            setTimeout(resolve, 400); 
        } else {
            resolve();
        }
    });

    // Wait for BOTH the map modifications and the enemies to finish downloading
    Promise.all([waitForWorldData, waitForEnemies]).then(() => {
        if (gameState.mapMode === 'overworld') {
            wakeUpNearbyEnemies(); 
        }

        // Final tiny buffer to ensure the DOM has processed the new data
        setTimeout(() => {
            // Force updates
            renderStats();
            renderEquipment();
            renderTime();
            resizeCanvas();
            renderHotbar();
            renderInventory(); // Renders rehydrated items
            
            // Force a clean cache render BEFORE showing the canvas
            gameState.mapDirty = true; 
            render();
            
            canvas.style.visibility = 'visible';
            syncPlayerState();

            logMessage(`Welcome back, ${playerData.background} of level ${gameState.player.level}.`);
            updateRegionDisplay();
            updateExploration();
            
            // Drop the loading curtain!
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
let timeSinceLastDraw = 0;
const FPS_CAP = 1000 / 60; // 16.6ms per frame (60 FPS)

function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const rawDt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    timeSinceLastDraw += rawDt;

    // --- THROTTLE TO 60 FPS TO SAVE CPU/BATTERY ---
    if (timeSinceLastDraw < FPS_CAP) {
        requestAnimationFrame(gameLoop);
        return; // Skip drawing this frame
    }
    
    const dt = timeSinceLastDraw / 1000;

    // Cap delta-time so the game doesn't jump wildly if you switch browser tabs
    const safeDt = Math.min(dt, 0.1);
    timeSinceLastDraw = 0; // Reset accumulator

    // --- 1. LERP (SMOOTH GLIDE) THE PLAYER CAMERA ---
    const p = gameState.player;
    if (p.visualX === undefined) p.visualX = p.x;
    if (p.visualY === undefined) p.visualY = p.y;
    
    // TELEPORT SNAP: If the distance is > 2 tiles, snap instantly!
    if (Math.abs(p.x - p.visualX) > 2 || Math.abs(p.y - p.visualY) > 2) {
        p.visualX = p.x;
        p.visualY = p.y;
        gameState.lastStartX = null; // Force background to redraw instantly
    }

    // Move visual camera towards logical position smoothly.
    // '8' is the perfect speed to make holding WASD feel like continuous walking!
    p.visualX += (p.x - p.visualX) * 8 * safeDt;
    p.visualY += (p.y - p.visualY) * 8 * safeDt;

    // 2. Update Particles smoothly
    if (typeof ParticleSystem !== 'undefined') ParticleSystem.update();

    // 3. Process Input Queue
    if (inputQueue.length > 0 && Date.now() - lastActionTime >= ACTION_COOLDOWN) {
        const key = inputQueue.shift(); // Pulls the oldest key pressed
        handleInput(key);
    }

    // 4. Force continuous rendering while sliding
    if (gameState.mapMode) {
        if (Math.abs(p.x - p.visualX) > 0.01 || Math.abs(p.y - p.visualY) > 0.01) {
            render(); 
        } else {
            // Snap to exact coordinates to save CPU when standing still
            p.visualX = p.x;
            p.visualY = p.y;
            render();
        }
    }

    // Runs as fast as your monitor allows (60fps, 144fps, etc.)
    requestAnimationFrame(gameLoop);
}

// Start the loop
requestAnimationFrame(gameLoop);

// AUTO-SAVE: Save the game if the user closes the tab or refreshes
window.addEventListener('beforeunload', () => { 
    if(typeof player_id !== 'undefined' && player_id) {
        flushPendingSave(); 
    }
});

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

    // Clear local memory so they can earn XP and loot chests again!
    gameState.discoveredRegions.clear();
    gameState.exploredChunks.clear();
    gameState.lootedTiles.clear(); 
    player.discoveredPOIs = [];

    // 5. Save "Alive" State & Wiped Map to DB (Using merge to protect Lore/Bestiary/Stash!)
    const resetState = {
        ...player,
        discoveredRegions: [],
        exploredChunks: [],
        lootedTiles: [],
        discoveredPOIs: []
    };
    
    playerRef.set(sanitizeForFirebase(resetState), { merge: true });

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
