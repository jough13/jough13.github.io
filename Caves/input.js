// --- CENTRAL INPUT HANDLER ---
function handleInput(key) {

     // 1. INPUT LOCK: Prevent spamming while network/animations are processing
    if (isProcessingMove) {
        console.log("Input blocked: Move in progress.");
        return;
    }

    // 2. Audio Context Resume (Browser Policy)
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

    // 3. Allow 'Escape' even if dead
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

    // --- GUARD: BLOCK MOVEMENT IF MENUS ARE OPEN ---
    // This prevents walking while in Inventory, Shop, or Map
    if (gameState.inventoryMode || 
        !mapModal.classList.contains('hidden') || 
        !spellModal.classList.contains('hidden') ||
        !skillModal.classList.contains('hidden') ||
        !shopModal.classList.contains('hidden') ||
        !craftingModal.classList.contains('hidden') ||
        !stashModal.classList.contains('hidden') ||
        !questModal.classList.contains('hidden') ||
        !loreModal.classList.contains('hidden')) {
        
        // Allow ONLY closing menus (Escape is handled above) or specific menu keys
        return;
    }

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

// DEBOUNCE RESIZE: Only resize once the user STOPS dragging the window (saves CPU)
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeCanvas, 100); });

// PREVENT SCROLLING: Stop arrow keys and spacebar from scrolling the browser window
window.addEventListener('keydown', e => { if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault(); }, false);
