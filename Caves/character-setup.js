let creationState = {
    name: "",
    race: null,
    gender: null,
    background: null
};

window.selectBackground = async function (bgKey) {
    const background = PLAYER_BACKGROUNDS[bgKey];
    if (!background) return;

    const player = gameState.player;

    // 1. Apply Stats
    for (const stat in background.stats) {
        player[stat] += background.stats[stat];
    }
    
    // EASY WIN: Proper recalculation so we don't desync Health/Mana
    player.maxHealth = 5 + (player.constitution * 5);
    player.health = player.maxHealth;
    
    player.maxMana = 5 + (player.wits * 5);
    player.mana = player.maxMana;

    // 2. Apply Inventory
    // We replace the default "Fists/Simple Tunic" start with the class kit
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
};

async function initCharacterSelect(user) {
    document.title = "Caves and Castles";

    currentUser = user;
    
    authContainer.classList.add('hidden');
    gameContainer.classList.add('hidden'); 
    charCreationModal.classList.add('hidden'); 
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

window.selectSlot = async function (slotId) {
    loadingIndicator.classList.remove('hidden');

    player_id = currentUser.uid; 
    playerRef = db.collection('players').doc(player_id).collection('characters').doc(slotId);

    const doc = await playerRef.get();

    characterSelectModal.classList.add('hidden');

    if (doc.exists) {
        enterGame(doc.data());
    } else {
        const defaultState = createDefaultPlayerState();
        Object.assign(gameState.player, defaultState);
        initCreationUI(); 
    }
};

let slotPendingDeletion = null; 

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

window.deleteSlot = function (slotId) {
    slotPendingDeletion = slotId;
    deleteConfirmModal.classList.remove('hidden');
};

if (confirmDeleteButton) {
    confirmDeleteButton.onclick = async () => {
        if (slotPendingDeletion) {
            const btn = confirmDeleteButton;
            const originalText = btn.textContent;
            
            btn.disabled = true;
            btn.textContent = "Deleting...";

            try {
                await db.collection('players').doc(currentUser.uid).collection('characters').doc(slotPendingDeletion).delete();
                await renderSlots(); 
            } catch (e) {
                console.error("Error deleting slot:", e);
                alert("Failed to delete character. Check console.");
            }

            btn.disabled = false;
            btn.textContent = originalText;
            deleteConfirmModal.classList.add('hidden');
            slotPendingDeletion = null;
        }
    };
}

if (cancelDeleteButton) {
    cancelDeleteButton.onclick = () => {
        deleteConfirmModal.classList.add('hidden');
        slotPendingDeletion = null;
    };
}

deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
        deleteConfirmModal.classList.add('hidden');
        slotPendingDeletion = null;
    }
});

// --- CHARACTER CREATION LOGIC ---

function selectCreationOption(type, key, element) {
    creationState[type] = key;

    const container = element.parentElement;
    Array.from(container.children).forEach(child => child.classList.remove('selected'));
    element.classList.add('selected');

    updateCreationSummary();
}

function updateCreationSummary() {
    const summaryDiv = document.getElementById('creationSummary');
    const nameInput = document.getElementById('charNameInput');
    
    // Clean the input to prevent weird spacing or hidden HTML tags
    creationState.name = nameInput.value.replace(/[^a-zA-Z0-9 ]/g, '').trim();

    const raceName = creationState.race ? PLAYER_RACES[creationState.race].name : "???";
    const className = creationState.background ? PLAYER_BACKGROUNDS[creationState.background].name : "???";
    
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

    const btn = document.getElementById('finalizeCreationBtn');
    
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
        btn.textContent = "Begin Adventure!";
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-600');
        btn.classList.add('bg-green-600', 'hover:bg-green-500');
    }
}

// Attach listeners
document.getElementById('charNameInput').addEventListener('input', updateCreationSummary);
document.getElementById('finalizeCreationBtn').addEventListener('click', finalizeCharacterCreation);

// Random Name Generator helper
window.generateRandomName = function() {
    const prefixes = ["Thor", "Garr", "El", "Fae", "Kael", "Mor", "Vex", "Zar", "Brim", "Nyx"];
    const suffixes = ["in", "ick", "ara", "en", "is", "os", "ia", "on", "us", "th"];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    document.getElementById('charNameInput').value = p + s;
    updateCreationSummary(); // Force UI to update immediately
};

function initCreationUI() {
    creationState = { name: "", race: null, gender: "Non-Binary", background: null };
    
    const nameInput = document.getElementById('charNameInput');
    nameInput.value = "";
    
    // EASY WIN: Inject the dice button next to the name input dynamically
    if (!document.getElementById('randomNameBtn')) {
        const nameContainer = nameInput.parentElement;
        const wrapper = document.createElement('div');
        wrapper.className = "flex gap-2";
        
        nameInput.parentNode.insertBefore(wrapper, nameInput);
        wrapper.appendChild(nameInput);
        
        const diceBtn = document.createElement('button');
        diceBtn.id = 'randomNameBtn';
        diceBtn.className = "bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xl";
        diceBtn.title = "Generate Random Name";
        diceBtn.textContent = "🎲";
        diceBtn.onclick = generateRandomName;
        wrapper.appendChild(diceBtn);
    }
    
    const raceContainer = document.getElementById('raceSelectionContainer');
    raceContainer.innerHTML = '';
    
    for (const key in PLAYER_RACES) {
        const r = PLAYER_RACES[key];
        const div = document.createElement('div');
        div.className = 'creation-option p-3 rounded-lg flex items-center gap-2';
        div.innerHTML = `<span class="text-2xl">${r.icon}</span> <span class="font-bold">${r.name}</span>`;
        div.onclick = () => selectCreationOption('race', key, div);
        div.dataset.key = key; 
        raceContainer.appendChild(div);
    }

    const classContainer = document.getElementById('classSelectionContainer');
    classContainer.innerHTML = '';

    for (const key in PLAYER_BACKGROUNDS) {
        const bg = PLAYER_BACKGROUNDS[key];
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

    const genderBtns = document.querySelectorAll('.gender-btn');
    genderBtns.forEach(btn => {
        btn.onclick = () => {
            genderBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            creationState.gender = btn.dataset.value;
            updateCreationSummary();
        };
    });
    
    // Default select Non-Binary
    genderBtns[2].click(); 

    updateCreationSummary();
    
    charCreationModal.classList.remove('hidden');
    loadingIndicator.classList.add('hidden');
}

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
    player.background = creationState.background; 

    // 2. Apply Class Stats
    for (const stat in bgData.stats) {
        player[stat] = (player[stat] || 1) + bgData.stats[stat];
    }
    
    // 3. Apply Race Stats
    for (const stat in raceData.stats) {
        player[stat] = (player[stat] || 1) + raceData.stats[stat];
    }

    player.maxHealth = 5 + (player.constitution * 5);
    player.health = player.maxHealth;
    
    player.maxMana = 5 + (player.wits * 5);
    player.mana = player.maxMana;
    
    player.maxStamina = 5 + (player.endurance * 5);
    player.stamina = player.maxStamina;

    player.maxPsyche = 7 + (player.willpower * 3);
    player.psyche = player.maxPsyche;

    // 4. Apply Inventory (Class Kit)
    bgData.items.forEach(newItem => {
        player.inventory.push(newItem);
    });

    // 5. Auto-Equip
    const weapon = player.inventory.find(i => i.type === 'weapon');
    const armor = player.inventory.find(i => i.type === 'armor');
    if (weapon) { player.equipment.weapon = weapon; weapon.isEquipped = true; }
    if (armor) { player.equipment.armor = armor; armor.isEquipped = true; }

    // 6. Save and Start
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
