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
