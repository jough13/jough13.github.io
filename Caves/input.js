// --- CENTRAL INPUT HANDLER ---
function handleInput(key) {

    // 1. INPUT LOCK: Prevent spamming while network/animations are processing
    if (isProcessingMove) {
        // Suppress console spam for smoother background execution
        return;
    }

    // 2. Audio Context Resume (Browser Policy)
    if (AudioSystem.ctx && AudioSystem.ctx.state === 'suspended') {
        AudioSystem.ctx.resume();
    }

    // 3. Robust Safety Check
    // Ensure player is logged in and data exists before doing anything.
    // Also check if gameContainer is visible to prevent moving while in Character Select.
    if (!player_id || !gameState || !gameState.player || gameContainer.classList.contains('hidden')) {
        return;
    }

    // --- EASY WIN: UNIVERSAL ESCAPE KEY / MODAL CLOSER ---
    if (key === 'Escape') {
        // JUICE/FIX: Clear the queue instantly to stop runaway movement!
        if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 

        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            logMessage("Aiming canceled.");
            return;
        }
        
        if (gameState.isDroppingItem) {
            gameState.isDroppingItem = false;
            logMessage("Drop canceled.");
            renderInventory(); // Reset visuals to normal
            return;
        }

        // Find any active modal
        const activeModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (activeModal) {
            // Specific teardown hooks if needed
            if (activeModal.id === 'inventoryModal') closeInventoryModal();
            else if (activeModal.id === 'mapModal') closeWorldMap();
            else activeModal.classList.add('hidden'); // Generic close
            return;
        }
        
        return; // Nothing to close
    }

    // 4. Dead Check
    if (gameState.player.health <= 0) return;

    if (key.toLowerCase() === 'q') {
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
        
        // Include numpad for aiming too!
        if (key === 'ArrowUp' || key.toLowerCase() === 'w' || key === '8') dirY = -1;
        else if (key === 'ArrowDown' || key.toLowerCase() === 's' || key === '2') dirY = 1;
        else if (key === 'ArrowLeft' || key.toLowerCase() === 'a' || key === '4') dirX = -1;
        else if (key === 'ArrowRight' || key.toLowerCase() === 'd' || key === '6') dirX = 1;
        // Diagonals for aiming
        else if (key === '7' || key === 'Home') { dirX = -1; dirY = -1; }
        else if (key === '9' || key === 'PageUp') { dirX = 1; dirY = -1; }
        else if (key === '1' || key === 'End') { dirX = -1; dirY = 1; }
        else if (key === '3' || key === 'PageDown') { dirX = 1; dirY = 1; }

        if (dirX !== 0 || dirY !== 0) {
            lastActionTime = Date.now(); // FIX: Update global cooldown to prevent rapid-fire aiming exploit
            const abilityId = gameState.abilityToAim;
            
            // Route abilities
            if (abilityId === 'lunge') executeLunge(dirX, dirY);
            else if (['shieldBash', 'cleave', 'kick', 'crush'].includes(abilityId)) executeMeleeSkill(abilityId, dirX, dirY);
            else if (abilityId === 'quickstep') executeQuickstep(dirX, dirY);
            else if (SPELL_DATA[abilityId]) executeAimedSpell(abilityId, dirX, dirY);
            else if (abilityId === 'pacify') executePacify(dirX, dirY);
            else if (abilityId === 'inflictMadness') executeInflictMadness(dirX, dirY);
            else if (abilityId === 'tame') executeTame(dirX, dirY);
            else logMessage("Unknown ability. Aiming canceled.");

            gameState.isAiming = false;
            gameState.abilityToAim = null;
        } else {
            logMessage("Invalid direction. Use Arrow keys or Numpad.");
        }
        return;
    }

     // --- DROP MODE TOGGLE ---
    if (gameState.inventoryMode && key.toLowerCase() === 'd') {
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
            handleItemDrop(key); 
            return;
        }

        // Priority 2: Inventory Open? Use Item.
        if (gameState.inventoryMode) {
            useInventoryItem(keyNum - 1);
            return;
        }

        // Priority 3: Normal Hotbar usage
        if (keyNum <= 5) {
            useHotbarSlot(keyNum - 1);
            return;
        }
    }

    if (key.toLowerCase() === 'g') {
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

    // --- EASY WIN: MENU TOGGLES ---
    const toggleModal = (modalEl, openFunc, closeFunc) => {
        if (typeof inputQueue !== 'undefined') inputQueue.length = 0; // Prevent runaway buffering
        
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

    // Auto-focus chat on Enter
    if (key === 'Enter') { document.getElementById('chatInput').focus(); return; }

    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    if (anyModalOpen || gameState.inventoryMode) {
        return;
    }

    // NOTE: The massive local cooldown inputBuffer block was completely 
    // removed from here because the GameLoop handles throttling the queue now!

    let newX = gameState.player.x;
    let newY = gameState.player.y;
    let moved = false;

    // --- EASY WIN: NUMPAD & DIAGONAL SUPPORT ---
    switch (key) {
        // Cardinals
        case 'ArrowUp': case 'w': case 'W': case '8': newY--; moved = true; break;
        case 'ArrowDown': case 's': case 'S': case '2': newY++; moved = true; break;
        case 'ArrowLeft': case 'a': case 'A': case '4': newX--; moved = true; break;
        case 'ArrowRight': case 'd': case 'D': case '6': newX++; moved = true; break;
        
        // Diagonals (Numpad)
        case '7': case 'Home': newX--; newY--; moved = true; break; // NW
        case '9': case 'PageUp': newX++; newY--; moved = true; break; // NE
        case '1': case 'End': newX--; newY++; moved = true; break; // SW
        case '3': case 'PageDown': newX++; newY++; moved = true; break; // SE

        case 'r': case 'R':
            restPlayer();
            lastActionTime = Date.now(); 
            return;
        case ' ': case '5': case '.': // Spacebar or Numpad center/dot to skip turn
            logMessage("You wait a moment.");
            endPlayerTurn();
            lastActionTime = Date.now(); 
            return;
    }

    if (moved) {
        // JUICE: Store facing direction for rendering (e.g. flipping sprites or aiming slashes)
        if (newX > gameState.player.x) gameState.player.facing = 'right';
        else if (newX < gameState.player.x) gameState.player.facing = 'left';

        lastActionTime = Date.now(); // Update timer
        attemptMovePlayer(newX, newY);
    }
}

// Attach the listener
document.addEventListener('keydown', (event) => {
    // 1. Ignore if typing in chat
    if (document.activeElement === chatInput) return;

    // 2. Prevent default scrolling for game keys
    // Added numpad and auxiliary keys to prevent page jumping
    const keysToBlock = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ',
        'Home', 'End', 'PageUp', 'PageDown'
    ];

    if (keysToBlock.includes(event.key)) {
        event.preventDefault();
    }

    // --- THE INPUT QUEUE ROUTER ---
    // UI, Drop Mode, and Escaping menus should happen INSTANTLY for good UX
    const instantKeys = ['Escape', 'i', 'm', 'b', 'k', 'c', 'p', 'I', 'M', 'B', 'K', 'C', 'P', 'd', 'D', 'g', 'G', 'q', 'Q'];
    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    
    if (anyModalOpen || instantKeys.includes(event.key) || gameState.isDroppingItem || gameState.inventoryMode) {
        handleInput(event.key); // Execute instantly
    } else {
        // Gameplay actions (Movement, Combat, Aiming) queue up seamlessly!
        if (typeof inputQueue !== 'undefined' && inputQueue.length < 3) {
            inputQueue.push(event.key);
        } else if (typeof inputQueue === 'undefined') {
            // Fallback safe-guard
            handleInput(event.key);
        }
    }
});

// DEBOUNCE RESIZE: Only resize once the user STOPS dragging the window (saves CPU)
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeCanvas, 100); });
