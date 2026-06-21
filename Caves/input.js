// --- START OF FILE input.js ---

// ==========================================
// INPUT HANDLING & QUEUE SYSTEM
// ==========================================

// --- GLOBALS & SAFETY ---
window.inputQueue = window.inputQueue || []; // Guarantee queue exists regardless of load order

// O(1) Directional Mapping
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

// PERFORMANCE & QoL WIN: O(1) Key Lookups & Expanded Browser Protections
// Moved out of the event listener so they aren't instantiated on every single keystroke.
// Added Tab and Enter to prevent unwanted browser scrolling/focus-shifting while playing.
const BLOCKED_SCROLL_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ',
    'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Enter'
]);

// Added the new J (Journal) and Zoom (+ / -) hotkeys to the spam guard
const INSTANT_KEYS = new Set([
    'Escape', 'i', 'm', 'b', 'k', 'c', 'p', 'h', 'd', 'g', 'q', 'j',
    'I', 'M', 'B', 'K', 'C', 'P', 'H', 'D', 'G', 'Q', 'J',
    '+', '=', '-', '_'
]);

// PERFORMANCE WIN: Live HTMLCollection Cache for O(1) Modal Checks
// Completely eliminates the need to run document.querySelector on every single keystroke!
const _modalCache = {
    collection: null,
    getActive: () => {
        if (!_modalCache.collection) _modalCache.collection = document.getElementsByClassName('modal-overlay');
        for (let i = 0; i < _modalCache.collection.length; i++) {
            if (!_modalCache.collection[i].classList.contains('hidden')) return _modalCache.collection[i];
        }
        return null;
    },
    isAnyOpen: () => !!_modalCache.getActive()
};

// --- CENTRAL INPUT HANDLER ---
function handleInput(key) {

    // 1. INPUT LOCK: Prevent spamming while network/animations are processing
    if (isProcessingMove) {
        return;
    }

    // 2. Audio Context Resume (Browser Policy)
    if (typeof AudioSystem !== 'undefined' && AudioSystem._ctx && AudioSystem._ctx.state === 'suspended') {
        AudioSystem._ctx.resume().catch(() => {});
    }

    // 3. Robust Safety Check
    if (!player_id || !gameState || !gameState.player || gameContainer.classList.contains('hidden')) {
        return;
    }

    // PERFORMANCE WIN: Cache the lowercased key to prevent repeated string allocations
    const lowerKey = key.toLowerCase();

    // --- ESCAPE KEY / MODAL CLOSER ---
    if (key === 'Escape') {
        // PERFORMANCE & SAFETY WIN: Aggressively clear the queue if the user panics and mashes Escape
        window.inputQueue.length = 0; 

        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            logMessage("{gray:You lower your weapon. (Aiming canceled)}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            // JUICE: Visual cancellation feedback
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "Canceled", "#9ca3af");
            if (typeof render === 'function') render(); // Clear telegraphs instantly
            return;
        }
        
        if (gameState.isDroppingItem) {
            gameState.isDroppingItem = false;
            logMessage("{gray:You reconsider and keep the item. (Drop canceled)}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            // JUICE: Visual cancellation feedback
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "Canceled", "#9ca3af");
            if (typeof renderInventory === 'function') renderInventory(); 
            return;
        }

        // Find any active modal and close it using our ultra-fast cache
        const activeModal = _modalCache.getActive();
        if (activeModal) {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            if (activeModal.id === 'inventoryModal' && typeof closeInventoryModal === 'function') closeInventoryModal();
            else if (activeModal.id === 'mapModal' && typeof closeWorldMap === 'function') closeWorldMap();
            else activeModal.classList.add('hidden'); 
            
            // Return focus to game so WASD works immediately
            if (document.activeElement) document.activeElement.blur();
            return;
        }
        
        return; 
    }

    // 4. Dead Check
    if (gameState.player.health <= 0) return;

    if (lowerKey === 'q') {
        if (typeof drinkFromSource === 'function') drinkFromSource();
        return;
    }

    // --- ACCESSIBILITY WIN: Keyboard Zoom Controls ---
    if (key === '=' || key === '+') {
        window.currentZoom = Math.min(40, window.currentZoom + 2);
        if (typeof resizeCanvas === 'function') resizeCanvas();
        return;
    }
    if (key === '-' || key === '_') {
        window.currentZoom = Math.max(12, window.currentZoom - 2);
        if (typeof resizeCanvas === 'function') resizeCanvas();
        return;
    }

    // --- DROP MODE ---
    if (gameState.isDroppingItem) {
        if (typeof handleItemDrop === 'function') handleItemDrop(key);
        return;
    }

    // --- AIMING MODE ---
    if (gameState.isAiming) {
        const dir = MOVEMENT_MAP[key];
        
        if (dir) {
            const [dirX, dirY] = dir;
            lastActionTime = Date.now(); 
            const abilityId = gameState.abilityToAim;
            
            // JUICE WIN: Make the player physically turn to face the direction they are aiming!
            if (dirX > 0) gameState.player.facing = 'right';
            else if (dirX < 0) gameState.player.facing = 'left';

            if (abilityId === 'lunge') executeLunge(dirX, dirY);
            else if (abilityId === 'ranged_attack') executeRangedAttack(dirX, dirY);
            else if (['shieldBash', 'cleave', 'kick', 'crush'].includes(abilityId)) executeMeleeSkill(abilityId, dirX, dirY);
            else if (abilityId === 'quickstep') executeQuickstep(dirX, dirY);
            else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) executeAimedSpell(abilityId, dirX, dirY);
            else if (abilityId === 'pacify') executePacify(dirX, dirY);
            else if (abilityId === 'inflictMadness') executeInflictMadness(dirX, dirY);
            else if (abilityId === 'tame') executeTame(dirX, dirY);
            else if (abilityId === 'throwTNT') executeThrowTNT(dirX, dirY);
            else logMessage("{red:Unknown ability. Aiming canceled.}");

            gameState.isAiming = false;
            gameState.abilityToAim = null;
        } else {
            // JUICE WIN: Dynamic visual/audio feedback for pressing invalid keys while aiming
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "?", "#ef4444");
            logMessage("{gray:Invalid direction. Use Arrow keys or WASD to aim. (Esc) to cancel.}");
        }
        return;
    }

    // --- DROP MODE TOGGLE ---
    if (gameState.inventoryMode && lowerKey === 'd') {
        if (gameState.player.inventory.length === 0) {
            logMessage("{gray:Inventory empty.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }
        
        gameState.isDroppingItem = !gameState.isDroppingItem;
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

        if (gameState.isDroppingItem) {
            logMessage("{red:Drop Mode: Select an item to discard.}");
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "DROP", "#ef4444");
        } else {
            logMessage("{gray:Drop Mode cancelled.}");
        }

        if (typeof renderInventory === 'function') renderInventory(); 
        return;
    }

    // --- NUMBER KEYS (1-9) ---
    const keyNum = parseInt(key);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
        
        if (gameState.isDroppingItem) {
            if (typeof handleItemDrop === 'function') handleItemDrop(key); 
            return;
        }

        if (gameState.inventoryMode) {
            if (typeof useInventoryItem === 'function') useInventoryItem(keyNum - 1);
            return;
        }

        // Outside of inventory, numbers 1-5 activate the Hotbar
        if (keyNum <= 5) {
            if (typeof useHotbarSlot === 'function') useHotbarSlot(keyNum - 1);
            return;
        }
    }

    // --- GROUND LOOTING ---
    if (lowerKey === 'g') {
        let tileId;
        if (gameState.mapMode === 'overworld') tileId = `${gameState.player.x},${-gameState.player.y}`;
        else tileId = `${gameState.currentCaveId || gameState.currentCastleId}:${gameState.player.x},${-gameState.player.y}`;

        const currentTile = (gameState.mapMode === 'overworld') 
            ? chunkManager.getTile(gameState.player.x, gameState.player.y)
            : (gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId][gameState.player.y][gameState.player.x] : chunkManager.castleMaps[gameState.currentCastleId][gameState.player.y][gameState.player.x]);

        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[currentTile]) {
            logMessage("You scour the ground for items...");
            if (typeof attemptMovePlayer === 'function') attemptMovePlayer(gameState.player.x, gameState.player.y); 
            return;
        } else {
            // JUICE WIN: Clearer visual/audio rejection for failed looting
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "Nothing", "#9ca3af");
            logMessage("{gray:There is nothing here to pick up.}");
            return;
        }
    }

    // --- MENU TOGGLES (With Centralized UI Hooks) ---
    const toggleMenu = (modalEl, openFunc, closeFunc) => {
        if (typeof window.toggleModal === 'function') {
            window.toggleModal(modalEl, openFunc, closeFunc);
        } else {
            // Fallback just in case ui.js hasn't hooked up yet
            window.inputQueue.length = 0; 
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            if (!modalEl.classList.contains('hidden')) {
                if (closeFunc) closeFunc();
                else modalEl.classList.add('hidden');
            } else {
                openFunc();
            }
        }
    };

    if (lowerKey === 'i') { toggleMenu(inventoryModal, openInventoryModal, closeInventoryModal); return; }
    if (lowerKey === 'm') { toggleMenu(mapModal, openWorldMap, closeWorldMap); return; }
    if (lowerKey === 'b') { toggleMenu(spellModal, openSpellbook, null); return; }
    if (lowerKey === 'k') { toggleMenu(skillModal, openSkillbook, null); return; }
    if (lowerKey === 'c') { toggleMenu(collectionsModal, openCollections, null); return; }
    if (lowerKey === 'p') { toggleMenu(talentModal, openTalentModal, null); return; }
    if (lowerKey === 'j') { toggleMenu(questModal, openBountyBoard, null); return; } // QoL WIN: Journal Hotkey
    
    // Help Hotkey
    if (lowerKey === 'h') { 
        toggleMenu(helpModal, () => helpModal.classList.remove('hidden'), null); 
        return; 
    }

    // Direct Chat Input focus wrapper
    if (key === 'Enter') { 
        const chatIn = document.getElementById('chatInput');
        if (chatIn) {
            // Must use window.event if accessing the global event object, though it's safer 
            // to just focus it and let the natural behavior occur here.
            chatIn.focus(); 
        }
        return; 
    }

    // Block gameplay inputs if any menu is open (using our fast O(1) cache)
    if (_modalCache.isAnyOpen() || gameState.inventoryMode) {
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
        if (typeof attemptMovePlayer === 'function') attemptMovePlayer(newX, newY);
        return;
    }

    if (lowerKey === 'r') {
        if (typeof restPlayer === 'function') restPlayer();
        lastActionTime = Date.now(); 
        return;
    }

    if ([' ', '5', 'Numpad5', 'Clear', '.'].includes(key)) {
        
        // LORE & CONTENT WIN: Massively Expanded, Biome/Event-Aware Atmospheric Waiting
        let waitFlavors = [
            "You pause to catch your breath.",
            "You listen to the sounds of the world.",
            "You stand perfectly still.",
            "You gather your thoughts.",
            "You wait a moment.",
            "You stare into the middle distance.",
            "You adjust the straps of your gear."
        ];

        if (gameState.mapMode === 'overworld') {
            if (gameState.weather === 'rain') waitFlavors.push("You pause, letting the rain wash over you.", "You listen to the drumming of the rain.", "Water runs down your face.");
            if (gameState.weather === 'storm') waitFlavors.push("You wait, feeling the thunder rattle your teeth.", "Lightning briefly illuminates the landscape.");
            if (gameState.weather === 'snow') waitFlavors.push("You watch your breath fog in the freezing air.", "You wait, letting the snow settle.", "The silence of the snow is deafening.");
            if (gameState.weather === 'fog') waitFlavors.push("You wait, peering into the thick mist.", "The fog clings to your clothes like a wet shroud.");
            
            // Extreme Danger State Overrides
            if (gameState.isBloodMoon) waitFlavors = [
                "You freeze, hoping the blood-crazed beasts don't see you.", 
                "You wait in the bloody crimson light, trembling.",
                "The air smells of rust and violence.",
                "You hear something screaming in the distance."
            ];
            if (gameState.isEclipse) waitFlavors.push("You stand in the absolute dark. The stars are hidden.");
            if (gameState.isLeylineSurge) waitFlavors.push("The hair on your arms stands up as magic surges.");
        } 
        else if (gameState.mapMode === 'dungeon') {
            waitFlavors.push("You listen to the echoing water dripping in the dark.");
            waitFlavors.push("You pause, straining your eyes against the gloom.");
            waitFlavors.push("You check the shadows for movement.");
            if (gameState.currentCaveTheme === 'VOID') waitFlavors.push("You listen to the deafening silence of the Void.", "You feel like you are being watched by a thousand unblinking eyes.");
            if (gameState.currentCaveTheme === 'FIRE') waitFlavors.push("You wipe sweat from your brow in the stifling heat.", "The magma bubbles and pops nearby.");
            if (gameState.currentCaveTheme === 'ICE') waitFlavors.push("You shiver uncontrollably in the glacial cold.");
        } 
        else if (gameState.mapMode === 'underworld') {
            waitFlavors.push("You stand still. The crushing weight of the earth above presses down.");
            waitFlavors.push("You pause. The shadows here feel alive.");
            waitFlavors.push("A distant rumble echoes through the cavern.");
        }
        else if (gameState.mapMode === 'castle') {
            waitFlavors.push("You admire the ancient stonework.");
            waitFlavors.push("You pause in the quiet halls.");
            waitFlavors.push("You listen for the sound of marching boots.");
        }

        const msg = waitFlavors[Math.floor(Math.random() * waitFlavors.length)];
        logMessage(`{gray:${msg}}`);
        
        // JUICE WIN: Better visual feedback for passing time!
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "...", "#9ca3af");
        }
        
        if (typeof endPlayerTurn === 'function') endPlayerTurn();
        lastActionTime = Date.now(); 
        return;
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (event) => {
    // 1. MODIFIER KEY GUARD (Bug Fix)
    // Prevents shortcuts like Ctrl+R from triggering a "Rest" action in-game!
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // 2. UNIVERSAL INPUT PROTECTOR
    // Ignore WASD and Hotkeys if the user is typing in ANY input field (Chat, Riddle, Character Name)
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

    // 3. Prevent default scrolling for game keys
    if (BLOCKED_SCROLL_KEYS.has(event.key)) {
        event.preventDefault();
    }

    // --- Differentiate Numpad from Top Row ---
    let inputStr = event.key;
    if (event.code && event.code.startsWith('Numpad') && !isNaN(parseInt(event.key))) {
        inputStr = 'Numpad' + event.key;
    }

    // 4. AUTO-REPEAT SPAM GUARD (Bug Fix)
    // If the player holds down 'I', it won't toggle the inventory 60 times a second.
    // Movement keys (WASD) bypass this so you can still hold to walk!
    if (event.repeat && INSTANT_KEYS.has(inputStr)) {
        return;
    }

    // --- THE INPUT QUEUE ROUTER ---
    // Dead check before queueing
    if (gameState && gameState.player && gameState.player.health <= 0) return;
    
    if (_modalCache.isAnyOpen() || INSTANT_KEYS.has(inputStr) || gameState.isDroppingItem || gameState.inventoryMode) {
        handleInput(inputStr); // Execute instantly
    } else {
        // Gameplay actions (Movement, Combat, Aiming) queue up seamlessly!
        // The queue is capped at 3 to prevent sliding into lava after releasing the key.
        if (window.inputQueue.length < 3) {
            window.inputQueue.push(inputStr);
        }
    }
});

// DEBOUNCE RESIZE: Only resize once the user STOPS dragging the window (saves CPU)
let resizeTimer;
window.addEventListener('resize', () => { 
    clearTimeout(resizeTimer); 
    if (typeof resizeCanvas === 'function') {
        resizeTimer = setTimeout(resizeCanvas, 100); 
    }
});

// --- END OF FILE input.js ---
