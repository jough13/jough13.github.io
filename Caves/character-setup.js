// --- START OF FILE character-setup.js ---

// ==========================================
// CHARACTER CREATION & SLOT MANAGEMENT
// ==========================================

let creationState = {
    name: "",
    race: null,
    gender: null,
    background: null
};

// PERFORMANCE WIN: Cache DOM elements that are queried repeatedly (like on every keystroke)
const _DOMCache = {
    nameInput: null,
    summaryBox: null,
    finalizeBtn: null,
    getNameInput: () => _DOMCache.nameInput || (document.getElementById('charNameInput') && (_DOMCache.nameInput = document.getElementById('charNameInput'))),
    getSummaryBox: () => _DOMCache.summaryBox || (document.getElementById('creationSummary') && (_DOMCache.summaryBox = document.getElementById('creationSummary'))),
    getFinalizeBtn: () => _DOMCache.finalizeBtn || (document.getElementById('finalizeCreationBtn') && (_DOMCache.finalizeBtn = document.getElementById('finalizeCreationBtn')))
};

async function initCharacterSelect(user) {
    document.title = "Caves and Castles";

    currentUser = user;
    
    authContainer.classList.add('hidden');
    gameContainer.classList.add('hidden'); 
    charCreationModal.classList.add('hidden'); 
    characterSelectModal.classList.remove('hidden');
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    // Only show the interim loading screen if the page has fully loaded
    // and the user has bypassed the Title Screen, preventing overlap!
    if (loadingIndicator && document.body.classList.contains('is-loaded')) {
        loadingIndicator.classList.remove('hidden'); 
    }

    // 1. Legacy Migration Check
    const oldRootRef = db.collection('players').doc(user.uid);
    try {
        const oldDoc = await oldRootRef.get();

        if (oldDoc.exists && oldDoc.data().level) {
            console.log("Migrating legacy save to Slot 1...");
            const legacyData = oldDoc.data();
            await oldRootRef.collection('characters').doc('slot1').set(legacyData);
            await oldRootRef.delete();
        }
    } catch (e) {
        console.warn("Legacy migration check bypassed.", e);
    }

    renderSlots();
}

let isEnteringGame = false; // Global lock to prevent double-clicks

window.selectSlot = async function (slotId) {
    // 🚨 Prevent Double Clicks and Server Hammering
    if (isEnteringGame) return; 
    isEnteringGame = true;

    // JUICE WIN: Play a deep, resonant magical tone when tethering to a timeline
    if (typeof AudioSystem !== 'undefined') {
        AudioSystem.playTone(200, 'sine', 0.5, 0.2, false, 100);
    }

    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
        const flavorText = document.getElementById('loadingFlavorText');
        if (flavorText) flavorText.textContent = "Tethering Soul to the Leylines..."; // LORE WIN
    }

    player_id = currentUser.uid; 
    playerRef = db.collection('players').doc(player_id).collection('characters').doc(slotId);

    try {
        const doc = await playerRef.get();

        characterSelectModal.classList.add('hidden');

        // Robust check: doc exists AND actually has data (not an empty placeholder)
        if (doc.exists && doc.data().level) {
            enterGame(doc.data());
        } else {
            // It's a completely empty slot. Setup the default state.
            const defaultState = createDefaultPlayerState();
            Object.assign(gameState.player, defaultState);
            initCreationUI(); 
        }
    } catch (e) {
        console.error("Failed to load character slot:", e);
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        characterSelectModal.classList.remove('hidden');
        alert("Network error loading character. Please try again.");
    } finally {
        // Unlock after a short delay to ensure modal hides safely and prevents ghost clicks
        setTimeout(() => { isEnteringGame = false; }, 1000);
    }
};

// --- SLOT DELETION LOGIC ---
let slotPendingDeletion = null; 

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

window.deleteSlot = function (slotId) {
    // JUICE & LORE WIN: Ominous warning sound and atmospheric text update
    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning(); 
    slotPendingDeletion = slotId;
    
    if (deleteConfirmModal) {
        const title = document.getElementById('deleteConfirmTitle');
        if (title) title.innerHTML = "Sever Timeline?";
        
        const desc = document.querySelector('#deleteConfirmModal p');
        if (desc) desc.innerHTML = "Are you sure you want to erase this soul from the Akashic Records? This action is <strong class='text-red-400 font-bold tracking-widest uppercase'>permanent</strong> and cannot be undone.";
        
        deleteConfirmModal.classList.remove('hidden');
    }
};

if (confirmDeleteButton) {
    confirmDeleteButton.onclick = async () => {
        if (slotPendingDeletion) {
            const btn = confirmDeleteButton;
            const originalText = btn.textContent;
            
            // ROBUSTNESS: Disable buttons during deletion to prevent spamming
            btn.disabled = true;
            btn.textContent = "Erasing Soul...";
            btn.classList.add('animate-pulse');
            if (cancelDeleteButton) cancelDeleteButton.disabled = true;

            try {
                // Delete the main character document
                await db.collection('players').doc(currentUser.uid).collection('characters').doc(slotPendingDeletion).delete();
                
                // PERFORMANCE/CLEANUP: Also delete any attached backups to save database space!
                const backupsRef = db.collection('players').doc(currentUser.uid).collection('characters').doc(slotPendingDeletion).collection('backups');
                const backups = await backupsRef.get();
                const batch = db.batch();
                backups.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                // JUICE WIN: Play the heavy death dirge to signify permanent erasure
                if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playDeath === 'function') {
                    AudioSystem.playDeath();
                } else if (typeof AudioSystem !== 'undefined') {
                    AudioSystem.playStep();
                }
                
                await renderSlots(); 
            } catch (e) {
                console.error("Error deleting slot:", e);
                alert("Failed to delete character. Check console.");
            }

            // Restore buttons
            btn.disabled = false;
            btn.textContent = originalText;
            btn.classList.remove('animate-pulse');
            if (cancelDeleteButton) cancelDeleteButton.disabled = false;
            
            if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
            slotPendingDeletion = null;
        }
    };
}

if (cancelDeleteButton) {
    cancelDeleteButton.onclick = () => {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
        slotPendingDeletion = null;
    };
}

if (deleteConfirmModal) {
    deleteConfirmModal.addEventListener('click', (e) => {
        // Prevent closing if we are currently deleting
        if (confirmDeleteButton && confirmDeleteButton.disabled) return;
        
        if (e.target === deleteConfirmModal) {
            deleteConfirmModal.classList.add('hidden');
            slotPendingDeletion = null;
        }
    });
}

// ==========================================
// CHARACTER CREATION LOGIC
// ==========================================

function selectCreationOption(type, key, element) {
    creationState[type] = key;
    
    // JUICE WIN: Soft magical hum when selecting identity traits
    if (typeof AudioSystem !== 'undefined') AudioSystem.playTone(600, 'sine', 0.1, 0.05, false);

    const container = element.parentElement;
    Array.from(container.children).forEach(child => child.classList.remove('selected', 'bg-blue-900', 'bg-opacity-20'));
    element.classList.add('selected', 'bg-blue-900', 'bg-opacity-20');

    updateCreationSummary();
}

function updateCreationSummary() {
    const summaryDiv = _DOMCache.getSummaryBox();
    const nameInput = _DOMCache.getNameInput();
    
    if (!nameInput) return;

    // Clean the input to prevent weird spacing or hidden HTML tags (including zero-width chars)
    let rawName = nameInput.value.replace(/[^a-zA-Z0-9 \-']/g, '').replace(/\s+/g, ' ').trimStart();
    
    // QoL WIN: Auto Title-Case the name (e.g. "gandalf the grey" -> "Gandalf The Grey")
    let formattedName = rawName.split(' ')
        .map(word => word.charAt(0) ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
        .join(' ');
        
    creationState.name = formattedName.trim();

    const raceName = creationState.race ? PLAYER_RACES[creationState.race].name : "???";
    const className = creationState.background ? PLAYER_BACKGROUNDS[creationState.background].name : "???";
    
    const raceDesc = creationState.race ? PLAYER_RACES[creationState.race].description : "";
    const classDesc = creationState.background ? PLAYER_BACKGROUNDS[creationState.background].description : "";
    
    // JUICE WIN: Dynamic Avatar Preview
    const raceIcon = creationState.race ? PLAYER_RACES[creationState.race].icon : "👤";
    
    let stats = [];
    let calcCon = 1, calcWits = 1, calcEnd = 1, calcWill = 1;

    if (creationState.race) {
        const rStats = PLAYER_RACES[creationState.race].stats;
        for(let s in rStats) {
            stats.push(`+${rStats[s]} ${s.charAt(0).toUpperCase() + s.slice(1)} (Race)`);
            if (s === 'constitution') calcCon += rStats[s];
            if (s === 'wits') calcWits += rStats[s];
            if (s === 'endurance') calcEnd += rStats[s];
            if (s === 'willpower') calcWill += rStats[s];
        }
    }
    if (creationState.background) {
        const cStats = PLAYER_BACKGROUNDS[creationState.background].stats;
        for(let s in cStats) {
            stats.push(`+${cStats[s]} ${s.charAt(0).toUpperCase() + s.slice(1)} (Class)`);
            if (s === 'constitution') calcCon += cStats[s];
            if (s === 'wits') calcWits += cStats[s];
            if (s === 'endurance') calcEnd += cStats[s];
            if (s === 'willpower') calcWill += cStats[s];
        }
    }

    // GAMEPLAY WIN: Projected Vitals Preview
    const projHP = 5 + (calcCon * 5);
    const projMana = 5 + (calcWits * 5);
    const projStamina = 5 + (calcEnd * 5);
    const projPsyche = 7 + (calcWill * 3);

    const vitalsHtml = (creationState.race && creationState.background) ? `
        <div class="grid grid-cols-2 gap-1 text-[11px] mt-3 bg-black bg-opacity-30 p-2 rounded border border-gray-700 shadow-inner">
            <span class="text-green-400 font-bold">HP: ${projHP}</span>
            <span class="text-blue-400 font-bold">Mana: ${projMana}</span>
            <span class="text-yellow-400 font-bold">Stam: ${projStamina}</span>
            <span class="text-purple-400 font-bold">Psych: ${projPsyche}</span>
        </div>
    ` : '';

    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <div class="flex items-center gap-4 mb-3">
                <div class="text-5xl drop-shadow-lg bg-black bg-opacity-30 rounded-xl p-3 border border-gray-600 flex-shrink-0">${raceIcon}</div>
                <div class="flex flex-col flex-grow">
                    <div class="highlight-text font-bold text-xl leading-tight truncate max-w-[180px]">${creationState.name || "???"}</div>
                    <div class="text-xs text-gray-400 uppercase tracking-widest mt-1">${creationState.gender || "?"} ${raceName}</div>
                    <div class="text-xs text-yellow-500 font-bold" style="font-family: 'Uncial Antiqua', cursive;">${className}</div>
                </div>
            </div>
            ${(raceDesc || classDesc) ? `
            <div class="text-xs italic text-gray-400 mb-3 border-l-2 border-gray-600 pl-2">
                ${raceDesc} ${classDesc}
            </div>` : ''}
            <div class="text-xs border-t pt-2 border-gray-600 text-gray-300 font-bold">
                ${stats.length > 0 ? stats.join('<br>') : "<span class='italic opacity-50 font-normal'>Select Race & Class to see bonuses.</span>"}
            </div>
            ${vitalsHtml}
        `;
    }

    const btn = _DOMCache.getFinalizeBtn();
    if (!btn) return;
    
    // Dynamic button text tells the player exactly what is missing!
    if (creationState.name.length === 0) {
        btn.textContent = "Enter a Name...";
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-600');
        btn.classList.remove('bg-green-600', 'hover:bg-green-500');
    } else if (!creationState.race) {
        btn.textContent = "Select a Race...";
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-600');
        btn.classList.remove('bg-green-600', 'hover:bg-green-500');
    } else if (!creationState.background) {
        btn.textContent = "Select a Class...";
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-600');
        btn.classList.remove('bg-green-600', 'hover:bg-green-500');
    } else {
        btn.innerHTML = "Begin Adventure <span>→</span>";
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-600');
        btn.classList.add('bg-green-600', 'hover:bg-green-500');
    }
}

// Attach listeners safely
setTimeout(() => {
    const nameInput = _DOMCache.getNameInput();
    if (nameInput) nameInput.addEventListener('input', updateCreationSummary);

    const finalizeCreationBtn = _DOMCache.getFinalizeBtn();
    if (finalizeCreationBtn) finalizeCreationBtn.addEventListener('click', finalizeCharacterCreation);
}, 0);

// EXPANDABILITY & LORE WIN: Massive Name Generator Expansion
window.generateRandomName = function() {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    const prefixes = [
        "Thor", "Garr", "El", "Fae", "Kael", "Mor", "Vex", "Zar", "Brim", "Nyx",
        "Ael", "Val", "Dra", "Bael", "Xyl", "Quin", "Syl", "Or", "Ign", "Gloom",
        "Lu", "Cor", "Ash", "Sil", "Fen", "Grim", "Mal", "Ren", "Tav", "Zeph",
        "Aer", "Bryn", "Cael", "Dorn", "Ery", "Fael", "Gael", "Hald", "Ith", "Jor",
        "Vor", "Kra", "Zin", "Thal", "Orik", "Ul", "Xan", "Yrr", "Aka", "Chro", "Ley"
    ];
    const suffixes = [
        "in", "ick", "ara", "en", "is", "os", "ia", "on", "us", "th",
        "ius", "dor", "mir", "vyn", "ryn", "las", "ric", "tar", "eth", "mont",
        "stone", "fire", "bane", "weaver", "shade", "moon", "sun", "heart", "blood",
        "forge", "smith", "strider", "whisper", "song", "wind", "storm",
        "grip", "fist", "gaze", "step", "mancer", "walker", "born"
    ];
    
    // Fun RPG Titles (20% chance to append)
    const titles = [
        " the Brave", " the Swift", " of the Void", " the Wise", " the Exile", 
        " Ironheart", " Shadow-walker", " the Lost", " the Cursed", " the Bold",
        " the Unbroken", " the Star-Touched", " the Pale", " Giantsbane", " the Silent",
        // LORE WIN: Thematic Multiverse/Akashic Titles
        " the Ley-Walker", " of the Akashic Records", " the Void-Dancer", " the Unbound", " the Chronomancer"
    ];
    
    let p = prefixes[Math.floor(Math.random() * prefixes.length)];
    let s = suffixes[Math.floor(Math.random() * suffixes.length)];
    let t = (Math.random() < 0.20) ? titles[Math.floor(Math.random() * titles.length)] : "";
    
    const nameInput = _DOMCache.getNameInput();
    if (nameInput) {
        nameInput.value = p + s + t;
        
        // JUICE WIN: Make the summary box "pop" so it feels like a tactile dice roll
        const summaryBox = _DOMCache.getSummaryBox();
        if (summaryBox && summaryBox.parentElement) {
            summaryBox.parentElement.style.animation = 'none';
            void summaryBox.parentElement.offsetWidth; // Trigger reflow
            summaryBox.parentElement.style.animation = 'pop-in 0.2s ease-out';
        }
        
        updateCreationSummary(); // Force UI to update immediately
    }
};

// QoL WIN: Instant Full Randomizer for Roguelike feel
window.quickRollCharacter = function() {
    generateRandomName();
            
    const genders = ['Male', 'Female', 'Non-Binary'];
    const rG = genders[Math.floor(Math.random() * genders.length)];
    const btnG = document.querySelector(`.gender-btn[data-value="${rG}"]`);
    if (btnG) btnG.click();

    const races = Object.keys(PLAYER_RACES);
    const rR = races[Math.floor(Math.random() * races.length)];
    const btnR = document.querySelector(`#raceSelectionContainer div[data-key="${rR}"]`);
    if (btnR) btnR.click();

    const classes = Object.keys(PLAYER_BACKGROUNDS);
    const rC = classes[Math.floor(Math.random() * classes.length)];
    const btnC = document.querySelector(`#classSelectionContainer div[data-key="${rC}"]`);
    if (btnC) btnC.click();
    
    // JUICE WIN: Tactile feedback for throwing the character dice
    if (typeof AudioSystem !== 'undefined') {
        AudioSystem.playClick();
        setTimeout(() => AudioSystem.playTone(800, 'sine', 0.1, 0.05), 50);
        setTimeout(() => AudioSystem.playMagic(), 150);
    }
};

function initCreationUI() {
    creationState = { name: "", race: null, gender: "Non-Binary", background: null };
    
    const nameInput = _DOMCache.getNameInput();
    if (nameInput) nameInput.value = "";
    
    // EASY WIN: Inject the dice buttons dynamically
    if (nameInput && !document.getElementById('randomNameBtn')) {
        const nameContainer = nameInput.parentElement;
        
        // 1. Wrap the name input to add the dice button next to it
        const wrapper = document.createElement('div');
        wrapper.className = "flex gap-2";
        nameInput.parentNode.insertBefore(wrapper, nameInput);
        wrapper.appendChild(nameInput);
        
        const diceBtn = document.createElement('button');
        diceBtn.id = 'randomNameBtn';
        diceBtn.className = "bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xl shadow-md transition-transform active:scale-95";
        diceBtn.title = "Generate Random Name";
        diceBtn.textContent = "🎲";
        diceBtn.onclick = generateRandomName;
        wrapper.appendChild(diceBtn);

        // 2. Add the "Quick Roll" macro button just above it
        const quickRollBtn = document.createElement('button');
        quickRollBtn.id = 'quickRollBtn';
        quickRollBtn.className = "bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg text-xs tracking-widest uppercase shadow-md transition-transform active:scale-95 mb-3 flex items-center justify-center gap-2 w-full";
        quickRollBtn.innerHTML = `<span>⚡</span> Quick Roll Character`;
        quickRollBtn.onclick = window.quickRollCharacter;
        nameContainer.insertBefore(quickRollBtn, wrapper);
    }
    
    // PERFORMANCE WIN: Use DocumentFragments to prevent layout thrashing
    const raceContainer = document.getElementById('raceSelectionContainer');
    if (raceContainer) {
        raceContainer.innerHTML = '';
        const raceFrag = document.createDocumentFragment();
        for (const key in PLAYER_RACES) {
            const r = PLAYER_RACES[key];
            const div = document.createElement('div');
            div.className = 'creation-option p-3 rounded-lg flex items-center gap-3 border-gray-600 border-2 transition-all';
            div.innerHTML = `<span class="text-3xl">${r.icon}</span> <span class="font-bold text-lg">${r.name}</span>`;
            div.onclick = () => selectCreationOption('race', key, div);
            div.dataset.key = key; 
            raceFrag.appendChild(div);
        }
        raceContainer.appendChild(raceFrag);
    }

    const classContainer = document.getElementById('classSelectionContainer');
    if (classContainer) {
        classContainer.innerHTML = '';
        const classFrag = document.createDocumentFragment();
        for (const key in PLAYER_BACKGROUNDS) {
            const bg = PLAYER_BACKGROUNDS[key];
            const div = document.createElement('div');
            div.className = 'creation-option p-3 rounded-lg border-gray-600 border-2 transition-all';
            div.innerHTML = `
                <div class="font-bold text-lg text-yellow-500" style="font-family: 'Uncial Antiqua', cursive;">${bg.name}</div>
                <div class="text-xs text-gray-400 mt-1 truncate">Start: ${bg.items[0].name}</div>
            `;
            div.onclick = () => selectCreationOption('background', key, div);
            div.dataset.key = key;
            classFrag.appendChild(div);
        }
        classContainer.appendChild(classFrag);
    }

    const genderBtns = document.querySelectorAll('.gender-btn');
    if (genderBtns.length > 0) {
        genderBtns.forEach(btn => {
            btn.onclick = () => {
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                genderBtns.forEach(b => b.classList.remove('selected', 'bg-blue-600', 'text-white'));
                btn.classList.add('selected', 'bg-blue-600', 'text-white');
                creationState.gender = btn.dataset.value;
                updateCreationSummary();
            };
        });
        
        // Default select Non-Binary
        genderBtns[2].click(); 
    }

    updateCreationSummary();
    
    if (charCreationModal) charCreationModal.classList.remove('hidden');
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
}

async function finalizeCharacterCreation() {
    const btn = _DOMCache.getFinalizeBtn();
    if (!btn) return;
    
    // Failsafe: Prevent empty names from slipping through
    if (!creationState.name || creationState.name.trim() === "") {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    
    btn.disabled = true;
    btn.textContent = "Forging Destiny...";
    btn.classList.add('animate-pulse');
    
    // JUICE WIN: Triumphant start sound!
    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp(); 

    const player = gameState.player;
    const bgData = PLAYER_BACKGROUNDS[creationState.background];
    const raceData = PLAYER_RACES[creationState.race];

    // 1. Apply Base Data
    player.name = creationState.name;
    player.race = creationState.race;
    player.gender = creationState.gender;
    player.background = creationState.background; 
    
    // Set the character icon to the Race's Emoji!
    player.character = raceData.icon || '@';

    // 2. Apply Class Stats
    for (const stat in bgData.stats) {
        player[stat] = (player[stat] || 1) + bgData.stats[stat];
    }
    
    // 3. Apply Race Stats
    for (const stat in raceData.stats) {
        player[stat] = (player[stat] || 1) + raceData.stats[stat];
    }

    // 4. Calculate Derived Stats
    if (typeof recalculateDerivedStats === 'function') {
        recalculateDerivedStats();
    } else {
        // Fallback if script.js hasn't loaded properly
        player.maxHealth = Math.max(1, 5 + (player.constitution * 5));
        player.maxMana = Math.max(1, 5 + (player.wits * 5));
        player.maxStamina = Math.max(1, 5 + (player.endurance * 5));
        player.maxPsyche = Math.max(1, 7 + (player.willpower * 3));
    }
    
    player.health = player.maxHealth;
    player.mana = player.maxMana;
    player.stamina = player.maxStamina;
    player.psyche = player.maxPsyche;

    // 5. Apply Inventory (Class Kit)
    // PERFORMANCE WIN: Utilize fastClone utility over JSON.parse to prevent CPU blocking during load
    bgData.items.forEach(newItem => {
        const clonedItem = typeof fastClone === 'function' ? fastClone(newItem) : JSON.parse(JSON.stringify(newItem));
        player.inventory.push(clonedItem);
    });

    // 6. Auto-Equip
    const weapon = player.inventory.find(i => i.type === 'weapon');
    const armor = player.inventory.find(i => i.type === 'armor');
    if (weapon) { player.equipment.weapon = weapon; weapon.isEquipped = true; }
    if (armor) { player.equipment.armor = armor; armor.isEquipped = true; }

    // 7. Save and Start
    try {
        await playerRef.set(typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(player) : player);

        if (charCreationModal) charCreationModal.classList.add('hidden');
        if (gameContainer) gameContainer.classList.remove('hidden');
        if (canvas) canvas.style.visibility = 'visible';
        
        gameState.mapMode = 'overworld';
        
        // LORE & JUICE WIN: Majestic spawn-in sequence!
        logMessage(`{cyan:The leylines converge. A new destiny begins...}`);
        logMessage(`{green:Welcome, ${player.name} the ${raceData.name} ${bgData.name}.}`);
        
        gameState.screenShake = 20; // Massive world-entry thud
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(player.x, player.y, '#3b82f6', 40); // Huge blue leyline burst
        }
        
        // Force the UI to catch up with the newly created stats!
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderTime === 'function') renderTime();
        if (typeof resizeCanvas === 'function') resizeCanvas();
        if (typeof render === 'function') render();
    } catch (e) {
        console.error("Failed to save new character:", e);
        alert("Failed to finalize character creation. Check your connection.");
        btn.disabled = false;
        btn.innerHTML = "Begin Adventure <span>→</span>";
        btn.classList.remove('animate-pulse');
    }
}

// --- END OF FILE character-setup.js ---
