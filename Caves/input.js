// --- GLOBALS & SAFETY ---
window.inputQueue = window.inputQueue || []; // Guarantee queue exists regardless of load order

// PERFORMANCE WIN: O(1) Directional Mapping
// Replaces massive if/else and switch statements with a single instant dictionary lookup
const MOVEMENT_MAP = {
    // Cardinals
    'ArrowUp': [0, -1], 'w': [0, -1], 'W': [0, -1], '8': [0, -1], 'Numpad8': [0, -1],
    'ArrowDown': [0, 1], 's': [0, 1], 'S': [0, 1], '2': [0, 1], 'Numpad2': [0, 1],
    'ArrowLeft': [-1, 0], 'a': [-1, 0], 'A': [-1, 0], '4': [-1, 0], 'Numpad4': [-1, 0],
    'ArrowRight': [1, 0], 'd': [1, 0], 'D': [1, 0], '6': [1, 0], 'Numpad6': [1, 0],
    // Diagonals
    '7': [-1, -1], 'Numpad7': [-1, -1], 'Home': [-1, -1],
    '9': [1, -1], 'Numpad9': [1, -1], 'PageUp': [1, -1],
    '1': [-1, 1], 'Numpad1': [-1, 1], 'End': [-1, 1],
    '3': [1, 1], 'Numpad3': [1, 1], 'PageDown': [1, 1]
};

// --- CENTRAL INPUT HANDLER ---
function handleInput(key) {

    // 1. INPUT LOCK: Prevent spamming while network/animations are processing
    if (isProcessingMove) {
        return;
    }

    // 2. Audio Context Resume (Browser Policy)
    if (typeof AudioSystem !== 'undefined' && AudioSystem.ctx && AudioSystem.ctx.state === 'suspended') {
        AudioSystem.ctx.resume();
    }

    // 3. Robust Safety Check
    if (!player_id || !gameState || !gameState.player || gameContainer.classList.contains('hidden')) {
        return;
    }

    // --- ESCAPE KEY / MODAL CLOSER ---
    if (key === 'Escape') {
        window.inputQueue.length = 0; 

        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            logMessage("Aiming canceled.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            return;
        }
        
        if (gameState.isDroppingItem) {
            gameState.isDroppingItem = false;
            logMessage("Drop canceled.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            renderInventory(); 
            return;
        }

        // Find any active modal
        const activeModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (activeModal) {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            if (activeModal.id === 'inventoryModal') closeInventoryModal();
            else if (activeModal.id === 'mapModal') closeWorldMap();
            else activeModal.classList.add('hidden'); 
            return;
        }
        
        return; 
    }

    // 4. Dead Check
    if (gameState.player.health <= 0) return;

    if (key.toLowerCase() === 'q') {
        drinkFromSource();
        return;
    }

    // --- DROP MODE ---
    if (gameState.isDroppingItem) {
        handleItemDrop(key);
        return;
    }

    // --- AIMING MODE ---
    if (gameState.isAiming) {
        const dir = MOVEMENT_MAP[key];
        
        if (dir) {
            const [dirX, dirY] = dir;
            lastActionTime = Date.now(); 
            const abilityId = gameState.abilityToAim;
            
            if (abilityId === 'lunge') executeLunge(dirX, dirY);
            else if (abilityId === 'ranged_attack') executeRangedAttack(dirX, dirY);
            else if (['shieldBash', 'cleave', 'kick', 'crush'].includes(abilityId)) executeMeleeSkill(abilityId, dirX, dirY);
            else if (abilityId === 'quickstep') executeQuickstep(dirX, dirY);
            else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) executeAimedSpell(abilityId, dirX, dirY);
            else if (abilityId === 'pacify') executePacify(dirX, dirY);
            else if (abilityId === 'inflictMadness') executeInflictMadness(dirX, dirY);
            else if (abilityId === 'tame') executeTame(dirX, dirY);
            else logMessage("Unknown ability. Aiming canceled.");

            gameState.isAiming = false;
            gameState.abilityToAim = null;
        } else {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            logMessage("Invalid direction. Use Arrow keys or Numpad.");
        }
        return;
    }

    // --- DROP MODE TOGGLE ---
    if (gameState.inventoryMode && key.toLowerCase() === 'd') {
        if (gameState.player.inventory.length === 0) {
            logMessage("Inventory empty.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }
        
        gameState.isDroppingItem = !gameState.isDroppingItem;
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

        if (gameState.isDroppingItem) {
            logMessage("Drop Mode: Select an item to discard.");
        } else {
            logMessage("Drop Mode cancelled.");
        }

        renderInventory(); 
        return;
    }

    // --- NUMBER KEYS (1-9) ---
    const keyNum = parseInt(key);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        
        if (gameState.isDroppingItem) {
            handleItemDrop(key); 
            return;
        }

        if (gameState.inventoryMode) {
            useInventoryItem(keyNum - 1);
            return;
        }

        if (keyNum <= 5) {
            useHotbarSlot(keyNum - 1);
            return;
        }
    }

    if (key.toLowerCase() === 'g') {
        let tileId;
        if (gameState.mapMode === 'overworld') tileId = `${gameState.player.x},${-gameState.player.y}`;
        else tileId = `${gameState.currentCaveId || gameState.currentCastleId}:${gameState.player.x},${-gameState.player.y}`;

        const currentTile = (gameState.mapMode === 'overworld') 
            ? chunkManager.getTile(gameState.player.x, gameState.player.y)
            : (gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] : chunkManager.castleMaps[gameState.currentCastleId][gameState.player.y][gameState.player.x]);

        if (ITEM_DATA[currentTile]) {
            logMessage("You scour the ground for items...");
            attemptMovePlayer(gameState.player.x, gameState.player.y); 
            return;
        } else {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            logMessage("There is nothing here to pick up.");
            return;
        }
    }

    // --- MENU TOGGLES (With Audio Hooks) ---
    const toggleModal = (modalEl, openFunc, closeFunc) => {
        window.inputQueue.length = 0; 
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        
        if (!modalEl.classList.contains('hidden')) {
            if (closeFunc) closeFunc();
            else modalEl.classList.add('hidden');
        } else {
            openFunc();
        }
    };

    if (key.toLowerCase() === 'i') { toggleModal(inventoryModal, openInventoryModal, closeInventoryModal); return; }
    if (key.toLowerCase() === 'm') { toggleModal(mapModal, openWorldMap, closeWorldMap); return; }
    if (key.toLowerCase() === 'b') { toggleModal(spellModal, openSpellbook); return; }
    if (key.toLowerCase() === 'k') { toggleModal(skillModal, openSkillbook); return; }
    if (key.toLowerCase() === 'c') { toggleModal(collectionsModal, openCollections); return; }
    if (key.toLowerCase() === 'p') { toggleModal(talentModal, openTalentModal); return; }

    if (key === 'Enter') { document.getElementById('chatInput').focus(); return; }

    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    if (anyModalOpen || gameState.inventoryMode) {
        return;
    }

    // --- MOVEMENT & ACTION EXECUTION ---
    const dir = MOVEMENT_MAP[key];

    if (dir) {
        const [dirX, dirY] = dir;
        let newX = gameState.player.x + dirX;
        let newY = gameState.player.y + dirY;

        // JUICE: Store facing direction for rendering
        if (newX > gameState.player.x) gameState.player.facing = 'right';
        else if (newX < gameState.player.x) gameState.player.facing = 'left';

        lastActionTime = Date.now(); 
        attemptMovePlayer(newX, newY);
        return;
    }

    if (key.toLowerCase() === 'r') {
        restPlayer();
        lastActionTime = Date.now(); 
        return;
    }

    if ([' ', '5', 'Numpad5', '.'].includes(key)) {
        logMessage("You wait a moment.");
        endPlayerTurn();
        lastActionTime = Date.now(); 
        return;
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (event) => {
    // 1. Ignore if typing in chat
    if (document.activeElement === chatInput) return;

    // 2. Prevent default scrolling for game keys
    const keysToBlock = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ',
        'Home', 'End', 'PageUp', 'PageDown'
    ];

    if (keysToBlock.includes(event.key)) {
        event.preventDefault();
    }

    // --- Differentiate Numpad from Top Row ---
    let inputStr = event.key;
    if (event.code && event.code.startsWith('Numpad') && !isNaN(parseInt(event.key))) {
        inputStr = 'Numpad' + event.key;
    }

    // --- THE INPUT QUEUE ROUTER ---
    const instantKeys = ['Escape', 'i', 'm', 'b', 'k', 'c', 'p', 'I', 'M', 'B', 'K', 'C', 'P', 'd', 'D', 'g', 'G', 'q', 'Q'];
    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    
    if (anyModalOpen || instantKeys.includes(event.key) || gameState.isDroppingItem || gameState.inventoryMode) {
        handleInput(inputStr); // Execute instantly
    } else {
        // Gameplay actions (Movement, Combat, Aiming) queue up seamlessly!
        if (window.inputQueue.length < 3) {
            window.inputQueue.push(inputStr);
        }
    }
});

// DEBOUNCE RESIZE: Only resize once the user STOPS dragging the window (saves CPU)
let resizeTimer;
window.addEventListener('resize', () => { 
    clearTimeout(resizeTimer); 
    resizeTimer = setTimeout(resizeCanvas, 100); 
});
