// --- CENTRAL INPUT HANDLER ---
function handleInput(key) {

    // 1. INPUT LOCK: Prevent spamming while network/animations are processing
    if (isProcessingMove) {
        // Suppress console spam for smoother background execution
        return;
    }

    // 2. Audio Context Resume (Browser Policy)
    if (typeof AudioSystem !== 'undefined' && AudioSystem.ctx && AudioSystem.ctx.state === 'suspended') {
        AudioSystem.ctx.resume();
    }

    // 3. Robust Safety Check
    // Ensure player is logged in and data exists before doing anything.
    // Also check if gameContainer is visible to prevent moving while in Character Select.
    const gameContainer = document.getElementById('gameContainer');
    if (!player_id || !gameState || !gameState.player || (gameContainer && gameContainer.classList.contains('hidden'))) {
        return;
    }

    // --- ESCAPE KEY / MODAL CLOSER ---
    if (key === 'Escape') {
        // JUICE & POLISH: Clear the movement queue instantly to stop runaway movement!
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
            if (typeof renderInventory === 'function') renderInventory(); // Reset visuals to normal
            return;
        }

        // Find any active modal
        const activeModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (activeModal) {
            // Specific teardown hooks if needed
            if (activeModal.id === 'inventoryModal' && typeof closeInventoryModal === 'function') closeInventoryModal();
            else if (activeModal.id === 'mapModal' && typeof closeWorldMap === 'function') closeWorldMap();
            else activeModal.classList.add('hidden'); // Generic close
            return;
        }
        
        return; // Nothing to close
    }

    // 4. Dead Check
    if (gameState.player.health <= 0) return;

    // Quick Drink
    if (key.toLowerCase() === 'q') {
        if (typeof drinkFromSource === 'function') drinkFromSource();
        return;
    }

    // --- DROP MODE ---
    if (gameState.isDroppingItem) {
        // Pass the key string directly
        if (typeof handleItemDrop === 'function') handleItemDrop(key);
        return;
    }

    // --- AIMING MODE ---
    if (gameState.isAiming) {
        let dirX = 0, dirY = 0;
        
        // Map aiming inputs
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
            lastActionTime = Date.now(); // Update global cooldown to prevent rapid-fire aiming exploit
            const abilityId = gameState.abilityToAim;
            
            // Route abilities
            if (abilityId === 'lunge') executeLunge(dirX, dirY);
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
        if (typeof renderInventory === 'function') renderInventory(); 
        return;
    }

    // --- NUMBER KEYS (1-9) ---
    // This handles both Using and Dropping based on state. 
    // Numpad collision is solved in the keydown listener before it reaches this point!
    const keyNum = parseInt(key);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        
        // Priority 1: Drop Mode active?
        if (gameState.isDroppingItem) {
            if (typeof handleItemDrop === 'function') handleItemDrop(key); 
            return;
        }

        // Priority 2: Inventory Open? Use Item.
        if (gameState.inventoryMode) {
            if (typeof useInventoryItem === 'function') useInventoryItem(keyNum - 1);
            return;
        }

        // Priority 3: Normal Hotbar usage
        if (keyNum <= 5) {
            if (typeof useHotbarSlot === 'function') useHotbarSlot(keyNum - 1);
            return;
        }
    }

    // --- GROUND LOOTING / PICKUP ---
    if (key.toLowerCase() === 'g') {
        if (isProcessingMove) return;
        isProcessingMove = true;

        // 1. Check current tile for lootable items
        const currentTile = (gameState.mapMode === 'overworld') 
            ? chunkManager.getTile(gameState.player.x, gameState.player.y)
            : (gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] : chunkManager.castleMaps[gameState.currentCastleId][gameState.player.y][gameState.player.x]);

        // 2. Trigger pickup if it's an item
        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[currentTile]) {
            // We reuse the move logic's pickup code by faking a "wait" on the spot
            logMessage("You scour the ground for items...");
            Promise.resolve(attemptMovePlayer(gameState.player.x, gameState.player.y)).finally(() => {
                isProcessingMove = false;
            });
            return;
        } else {
            logMessage("There is nothing here to pick up.");
            isProcessingMove = false;
            return;
        }
    }

    // --- MENU TOGGLES ---
    const invokeModalToggle = (modalEl, openFunc, closeFunc) => {
        if (typeof inputQueue !== 'undefined') inputQueue.length = 0; // Prevent runaway buffering
        
        if (!modalEl.classList.contains('hidden')) {
            if (closeFunc) closeFunc();
            else modalEl.classList.add('hidden');
        } else {
            openFunc();
        }
    };

    if (key.toLowerCase() === 'i') { invokeModalToggle(document.getElementById('inventoryModal'), window.openInventoryModal, window.closeInventoryModal); return; }
    if (key.toLowerCase() === 'm') { invokeModalToggle(document.getElementById('mapModal'), window.openWorldMap, window.closeWorldMap); return; }
    if (key.toLowerCase() === 'b') { invokeModalToggle(document.getElementById('spellModal'), window.openSpellbook); return; }
    if (key.toLowerCase() === 'k') { invokeModalToggle(document.getElementById('skillModal'), window.openSkillbook); return; }
    if (key.toLowerCase() === 'c') { invokeModalToggle(document.getElementById('collectionsModal'), window.openCollections); return; }
    if (key.toLowerCase() === 'p') { invokeModalToggle(document.getElementById('talentModal'), window.openTalentModal); return; }

    // Auto-focus chat on Enter
    if (key === 'Enter') { 
        const chatIn = document.getElementById('chatInput');
        if (chatIn) chatIn.focus(); 
        return; 
    }

    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    if (anyModalOpen || gameState.inventoryMode) {
        return;
    }

    let newX = gameState.player.x;
    let newY = gameState.player.y;
    let moved = false;

    // --- MOVEMENT: NUMPAD & DIAGONAL SUPPORT ---
    switch (key) {
        // Cardinals
        case 'ArrowUp': case 'w': case 'W': case '8': newY--; moved = true; break;
        case 'ArrowDown': case 's': case 'S': case '2': newY++; moved = true; break;
        case 'ArrowLeft': case 'a': case 'A': case '4': newX--; moved = true; break;
        case 'ArrowRight': case 'd': case 'D': case '6': newX++; moved = true; break;
        
        // Diagonals
        case '7': case 'Home': newX--; newY--; moved = true; break; // NW
        case '9': case 'PageUp': newX++; newY--; moved = true; break; // NE
        case '1': case 'End': newX--; newY++; moved = true; break; // SW
        case '3': case 'PageDown': newX++; newY++; moved = true; break; // SE

        case 'r': case 'R':
            if (isProcessingMove) return;
            isProcessingMove = true;
            if (typeof restPlayer === 'function') restPlayer();
            lastActionTime = Date.now(); 
            isProcessingMove = false;
            return;
        case ' ': case '5': case '.': case 'Clear': // Spacebar or Numpad center/dot to skip turn
            if (isProcessingMove) return;
            isProcessingMove = true;
            logMessage("You wait a moment.");
            if (typeof endPlayerTurn === 'function') endPlayerTurn();
            lastActionTime = Date.now(); 
            isProcessingMove = false;
            return;
    }

    if (moved) {
        // CRITICAL BUG FIX: Implement Async Safety Lock!
        // Prevents multi-stepping through locked doors or multi-hitting enemies 
        // if the player holds a key down and Firebase transactions lag behind.
        if (isProcessingMove) return;
        isProcessingMove = true;

        // JUICE: Store facing direction for rendering (e.g. flipping sprites or aiming slashes)
        if (newX > gameState.player.x) gameState.player.facing = 'right';
        else if (newX < gameState.player.x) gameState.player.facing = 'left';

        lastActionTime = Date.now(); // Update timer

        // Wrapping in Promise.resolve allows attemptMovePlayer to be awaited 
        // ensuring the lock only releases when the entire transaction (or failure) finishes.
        Promise.resolve(attemptMovePlayer(newX, newY)).finally(() => {
            isProcessingMove = false;
        });
    }
}

// --- GLOBAL KEYBOARD LISTENER ---
document.addEventListener('keydown', (event) => {
    const chatInputEl = document.getElementById('chatInput');

    // 1. Ignore if typing in chat
    if (document.activeElement === chatInputEl) return;

    // 2. Prevent default scrolling for game keys
    // Added numpad and auxiliary keys to prevent page jumping
    const keysToBlock = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ',
        'Home', 'End', 'PageUp', 'PageDown', 'Clear'
    ];

    if (keysToBlock.includes(event.key)) {
        event.preventDefault();
    }

    // 3. NUMPAD vs HOTBAR COLLISION FIX
    // If NumLock is ON, pressing Numpad 7 yields event.key = "7" and event.code = "Numpad7".
    // We translate it to the semantic movement string so the Queue processor doesn't 
    // confuse it with Hotbar slot #7!
    let semanticKey = event.key;
    if (event.code && event.code.startsWith('Numpad')) {
        const numpadMap = {
            'Numpad1': 'End',       // SW
            'Numpad2': 'ArrowDown', // S
            'Numpad3': 'PageDown',  // SE
            'Numpad4': 'ArrowLeft', // W
            'Numpad5': 'Clear',     // Wait/Rest
            'Numpad6': 'ArrowRight',// E
            'Numpad7': 'Home',      // NW
            'Numpad8': 'ArrowUp',   // N
            'Numpad9': 'PageUp'     // NE
        };
        if (numpadMap[event.code]) {
            semanticKey = numpadMap[event.code];
        }
    }

    // --- THE INPUT QUEUE ROUTER ---
    // UI, Drop Mode, and Escaping menus should happen INSTANTLY for good UX
    const instantKeys = ['Escape', 'i', 'm', 'b', 'k', 'c', 'p', 'I', 'M', 'B', 'K', 'C', 'P', 'd', 'D', 'g', 'G', 'q', 'Q'];
    const anyModalOpen = document.querySelector('.modal-overlay:not(.hidden)');
    
    if (anyModalOpen || instantKeys.includes(semanticKey) || gameState.isDroppingItem || gameState.inventoryMode) {
        handleInput(semanticKey); // Execute instantly
    } else {
        // Gameplay actions (Movement, Combat, Aiming) queue up seamlessly!
        if (typeof inputQueue !== 'undefined' && inputQueue.length < 3) {
            inputQueue.push(semanticKey);
        } else if (typeof inputQueue === 'undefined') {
            // Fallback safe-guard
            handleInput(semanticKey);
        }
    }
});

// --- MOBILE UX POLISH: CHAT BLUR FIX ---
// Automatically returns focus to the game when the mobile keyboard is dismissed, 
// preventing the on-screen D-pad from becoming unresponsive.
document.addEventListener('DOMContentLoaded', () => {
    const chatInputEl = document.getElementById('chatInput');
    if (chatInputEl) {
        chatInputEl.addEventListener('blur', () => {
            // Removing focus from all active elements forces it back to the body document
            if (document.activeElement) document.activeElement.blur();
        });
    }
});

// --- DEBOUNCE RESIZE --- 
// Only resize once the user STOPS dragging the window (saves massive amounts of CPU)
let resizeTimer;
window.addEventListener('resize', () => { 
    clearTimeout(resizeTimer); 
    resizeTimer = setTimeout(() => {
        if (typeof resizeCanvas === 'function') resizeCanvas();
    }, 100); 
});
