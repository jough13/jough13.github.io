// --- START OF FILE input.js ---

// ==========================================
// INPUT HANDLING & QUEUE SYSTEM
// ==========================================

window.inputQueue = window.inputQueue || [];

window.MOVEMENT_MAP = {
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

const BLOCKED_SCROLL_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ',
    'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Enter', '/'
]);

// 🚨 RESPONSIVENESS WIN: Added 'Shift' and 'v' to bypass the movement queue
// Guarantees stealth toggles happen instantly without waiting for footsteps to finish!
const INSTANT_KEYS = new Set([
    'Escape', 'i', 'm', 'b', 'k', 'c', 'p', 'h', 'd', 'g', 'q', 'j', 'z', 'l', '/', 't',
    'I', 'M', 'B', 'K', 'C', 'P', 'H', 'D', 'G', 'Q', 'J', 'Z', 'L', 'T',
    '+', '=', '-', '_', 'Shift', 'v', 'V'
]);

const ACTION_KEYS = new Set([
    'q', 'z', 'g', 'r', ' ', '5', 'numpad5', 'clear', '.'
]);

const HOTKEY_MAPPINGS = {
    'i': { modal: 'inventoryModal',   openFunc: 'openInventoryModal',  closeFunc: 'closeInventoryModal' },
    'm': { modal: 'mapModal',         openFunc: 'openWorldMap',        closeFunc: 'closeWorldMap' },
    'b': { modal: 'spellModal',       openFunc: 'openSpellbook',       closeFunc: null },
    'k': { modal: 'skillModal',       openFunc: 'openSkillbook',       closeFunc: null },
    'c': { modal: 'collectionsModal', openFunc: 'openCollections',     closeFunc: null },
    'l': { modal: 'collectionsModal', openFunc: 'openCollections',     closeFunc: null }, 
    'p': { modal: 'talentModal',      openFunc: 'openTalentModal',     closeFunc: null },
    'j': { modal: 'questModal',       openFunc: 'openBountyBoard',     closeFunc: null },
    'h': { modal: 'helpModal',        openFunc: null,                  closeFunc: null } 
};

// 🚨 PERFORMANCE WIN: Layout Thrashing Fix
// Completely bypasses `getComputedStyle()` which forces the browser to halt JS and recalculate page layout!
const _modalCache = {
    collection: null,
    getActive: () => {
        if (!_modalCache.collection) _modalCache.collection = document.getElementsByClassName('modal-overlay');
        
        let topModal = null;
        let highestZ = -1;
        
        for (let i = 0; i < _modalCache.collection.length; i++) {
            const modal = _modalCache.collection[i];
            
            if (!modal.classList.contains('hidden')) {
                // Parse the z-index safely via inline styles or dataset (O(1) memory lookup)
                let z = 0;
                if (modal.style.zIndex) {
                    z = parseInt(modal.style.zIndex, 10) || 0;
                } else if (modal.dataset.baseZ) {
                    z = parseInt(modal.dataset.baseZ, 10) || 0;
                }
                
                if (z >= highestZ) {
                    highestZ = z;
                    topModal = modal;
                }
            }
        }
        return topModal;
    },
    isAnyOpen: () => !!_modalCache.getActive()
};

// 🌟 LORE WIN: Massively expanded atmospheric descriptions
window.WAIT_FLAVORS = {
    DEFAULT: [
        "You pause to catch your breath.",
        "You listen to the sounds of the world.",
        "You stand perfectly still.",
        "You gather your thoughts.",
        "You wait a moment.",
        "You stare into the middle distance.",
        "You adjust the straps of your gear."
    ],
    // --- CLASS FLAVORS ---
    WARRIOR: [
        "You roll your shoulders, loosening the weight of your armor.",
        "You test the edge of your weapon with your thumb.",
        "You firmly plant your feet, ready for anything."
    ],
    ROGUE: [
        "You spin a dagger deftly over your knuckles.",
        "You check the shadows, ensuring you aren't being watched.",
        "You remain perfectly, unnervingly still."
    ],
    MAGE: [
        "You recite a complex arcane theorem under your breath.",
        "Sparks dance harmlessly between your fingers.",
        "You feel the thrum of the nearest leyline vibrating in your chest."
    ],
    NECROMANCER: [
        "You listen intently to the whispers of the buried dead.",
        "The air around you grows unnaturally cold as you focus.",
        "You brush a layer of grave dust from your cloak."
    ],
    CLERIC: [
        "You bow your head in a brief, silent prayer.",
        "You grip your holy symbol, finding comfort in the Light.",
        "A faint, warm aura surrounds you as you center your spirit."
    ],
    HUNTER: [
        "You check the tension of your bowstring.",
        "You scan the horizon for tracks and broken branches.",
        "You test the wind direction."
    ],
    WRETCH: [
        "You shiver in the cold.",
        "You glance around nervously.",
        "You wonder how you are still alive."
    ],
    ARTISAN: [
        "You tighten the bindings on your tools.",
        "You inspect a mechanism in your pack, adjusting a loose gear.",
        "Your mind works through the blueprints of your next creation."
    ],
    // --- EXPANSION CLASS FLAVORS ---
    DEFECTOR: [
        "You nervously check over your shoulder for Cult assassins.",
        "You trace a forbidden rune in the dirt with your boot, then quickly erase it.",
        "The whispers of the Void briefly echo in your mind before you push them away."
    ],
    MONK: [
        "You center your breathing, finding perfect stillness.",
        "You stretch your limbs in a practiced, fluid motion.",
        "You close your eyes and feel the energy of the world flowing around you."
    ],
    PEDDLER: [
        "You pat your coin purse to ensure it's still heavy.",
        "You mentally calculate the potential profit of your current surroundings.",
        "You pause to check your wares for damage."
    ],
    RUNESMITH: [
        "You inspect the magical etchings on your gear for fading.",
        "You trace the shape of an ancient dwarven ward in the air.",
        "The heavy scent of ozone and hot metal lingers around you as you rest."
    ],
    // --- RACE FLAVORS ---
    DHAMPIR: [
        "You suppress a sudden, intense pang of hunger.",
        "You bare your fangs in the darkness.",
        "The shadows cling to you like an old friend."
    ],
    SYLPH: [
        "You float an inch off the ground to rest your legs.",
        "The wind dances playfully around your fingertips.",
        "You listen intently to the currents of the air."
    ],
    VOIDKISSED: [
        "A sudden chill drops the temperature around you by ten degrees.",
        "Your eyes reflect a galaxy that doesn't exist in this sky.",
        "You stare off into the distance, listening to something no one else can hear."
    ],
    // --- ENVIRONMENTAL FLAVORS ---
    MOUNTED: [
        "You pat the neck of your %MOUNT%.",
        "Your %MOUNT% huffs restlessly.",
        "Your %MOUNT% shifts its weight.",
        "You adjust your grip on the reins."
    ],
    SAILING: [
        "The ship rocks gently on the waves.", 
        "You check the rigging.", 
        "The sea breeze fills the sails.",
        "Salt spray mists across the deck.",
        "You listen to the timber of the hull creaking."
    ],
    BOATING: [
        "Your canoe drifts slightly.", 
        "You rest your paddle across your lap.", 
        "Water ripples against the hull.",
        "You check the bottom for leaks."
    ],
    MULTIVERSE: [
        "You wait, feeling the alien gravity of this dimension.",
        "The sky above fractures and reforms as you rest.",
        "You catch your breath. The air here tastes like static.",
        "The silence of this realm is utterly unnatural.",
        "A color that doesn't exist flashes in the corner of your eye."
    ],
    FROZEN_WASTES: [
        "Your breath freezes before it leaves your lips.",
        "You brush rime-ice from your shoulders.",
        "The cold here is absolute and unforgiving.",
        "You shiver violently as the magical chill bites deep."
    ],
    RAIN: [
        "You pause, letting the rain wash over you.", 
        "You listen to the drumming of the rain.", 
        "Water runs down your face.", 
        "The mud sucks at your boots."
    ],
    STORM: [
        "You wait, feeling the thunder rattle your teeth.", 
        "Lightning briefly illuminates the landscape.", 
        "The smell of ozone is thick and dizzying."
    ],
    SNOW: [
        "You watch your breath fog in the freezing air.", 
        "You wait, letting the snow settle.", 
        "The silence of the snow is deafening.", 
        "You brush a layer of fresh powder from your gear."
    ],
    FOG: [
        "You wait, peering into the thick mist.", 
        "The fog clings to your clothes like a wet shroud.", 
        "Shadows seem to dance in the thick gray soup."
    ],
    BLOOD_MOON: [
        "You freeze, hoping the blood-crazed beasts don't see you.", 
        "You wait in the bloody crimson light, trembling.",
        "The air smells of rust and violence.",
        "You hear something screaming in the distance."
    ],
    ECLIPSE: [
        "You stand in the absolute dark. The stars are hidden.",
        "The unnatural night presses in on all sides.",
        "You hear the whispering of things that fear the light."
    ],
    SURGE: [
        "The hair on your arms stands up as magic surges.",
        "The ground hums with immense arcane pressure.",
        "Sparks dance across your fingertips."
    ],
    CAVE_VOID: [
        "You listen to the deafening silence of the Void.", 
        "You feel like you are being watched by a thousand unblinking eyes.", 
        "A distant, structural groan echoes through the nothingness."
    ],
    CAVE_FIRE: [
        "You wipe sweat from your brow in the stifling heat.", 
        "The magma bubbles and pops nearby.", 
        "The sulfur stings your eyes."
    ],
    CAVE_ICE: [
        "You shiver uncontrollably in the glacial cold.", 
        "Ice cracks echoing like gunshots in the dark.", 
        "Your breath crystallizes instantly."
    ],
    CAVE_DEFAULT: [
        "You listen to the echoing water dripping in the dark.", 
        "You pause, straining your eyes against the gloom.", 
        "You check the shadows for movement.", 
        "The stale air is heavy in your lungs."
    ],
    UNDERWORLD: [
        "You stand still. The crushing weight of the earth above presses down.",
        "You pause. The shadows here feel alive.",
        "A distant rumble echoes through the cavern.",
        "You feel the tectonic plates shifting miles below."
    ],
    CASTLE: [
        "You admire the ancient stonework.",
        "You pause in the quiet halls.",
        "You listen for the sound of marching boots.",
        "Dust motes dance in a faint shaft of light."
    ],
    GUILD: [
        "You polish your guild insignia proudly.",
        "You stand tall, representing your comrades.",
        "You check the perimeter for rival guild members."
    ],
    STEALTH: [
        "You hold your breath in the shadows.",
        "You remain perfectly, unnervingly still.",
        "You meld into the darkness."
    ]
};

const _safeExecuteWithLock = async (actionFunc) => {
    if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
    if (typeof actionFunc !== 'function') return;

    isProcessingMove = true;
    
    // Self-resolving asynchronous watchdog
    const watchdog = setTimeout(() => {
        if (isProcessingMove) {
            console.warn("[AKASHIC ENGINE] Watchdog forced engine unlock.");
            isProcessingMove = false;
        }
    }, 5000);

    try {
        const result = actionFunc();
        if (result instanceof Promise) {
            await result;
        }
    } catch (e) {
        console.error("[AKASHIC ENGINE] Action execution failed:", e);
    } finally {
        clearTimeout(watchdog);
        isProcessingMove = false;
    }
};

function handleInput(key) {
    // 🚨 Clean, O(1) lock check. 
    if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
    
    if (typeof isBackupOperationRunning !== 'undefined' && isBackupOperationRunning) {
        return; 
    }
    
    // 🚨 BUG FIX WIN: Zombie-Walk Prevention!
    // If the player dies or is fully incapacitated while keystrokes are still in the queue, 
    // instantly flush the queue and abort so they don't walk around as a corpse!
    if (typeof gameState !== 'undefined' && gameState.player && gameState.player.health <= 0) {
        window.inputQueue.length = 0;
        return;
    }

    if (typeof window.ExpansionManager !== 'undefined') {
        const hookRes = window.ExpansionManager.triggerHook('onBeforeInput', { key: key, handled: false });
        if (hookRes && hookRes.handled) return;
    }

    if (typeof AudioSystem !== 'undefined' && AudioSystem._ctx && AudioSystem._ctx.state === 'suspended') {
        try { AudioSystem._ctx.resume().catch(() => {}); } catch(e){}
    }

    if (!key || typeof key !== 'string') return;
    if (typeof player_id === 'undefined' || !player_id || typeof gameState === 'undefined' || !gameState.player) {
        return;
    }
    
    const gc = document.getElementById('gameContainer');
    if (!gc || gc.classList.contains('hidden')) return;

    const lowerKey = key.toLowerCase();

    // 🚨 BUG FIX & ROBUSTNESS WIN: Strict Numeric Parsing
    // Using purely Regex ensures that keys like "5a" or "F5" do not accidentally map 
    // to hotbar slot 5 because of JavaScript's loose `parseInt` evaluation!
    let numericTestStr = key.startsWith('Numpad') ? key.replace('Numpad', '') : key;
    const isNumberKey = /^[1-9]$/.test(numericTestStr);
    const testKeyNum = isNumberKey ? parseInt(numericTestStr, 10) : NaN;
    
    const isGameplayKey = window.MOVEMENT_MAP[key] || ACTION_KEYS.has(lowerKey) || isNumberKey;
    
    if (gameState.player.stunTurns > 0 && isGameplayKey) {
        const currentCooldown = window.ACTION_COOLDOWN || 150;
        
        if (Date.now() - (window.lastActionTime || 0) >= currentCooldown) {
            logMessage("{yellow:You are stunned and cannot act!}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            
            window.inputQueue.length = 0; 
            window.lastActionTime = Date.now();  
            
            if (typeof endPlayerTurn === 'function') {
                _safeExecuteWithLock(() => {
                    endPlayerTurn();
                    if (typeof render === 'function') render(); 
                });
            }
        }
        return;
    }

    if (HOTKEY_MAPPINGS[lowerKey] || key === 'Escape') {
        let stateCanceled = false;
        
        if (gameState.isAiming) {
            gameState.isAiming = false;
            gameState.abilityToAim = null;
            stateCanceled = true;
        }
        if (gameState.isDroppingItem) {
            gameState.isDroppingItem = false;
            stateCanceled = true;
        }

        if (stateCanceled) {
            logMessage("{gray:Action aborted.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            // 🌟 JUICE WIN: Better cancellation visual feedback
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "Canceled", "#9ca3af");
            }
            
            if (typeof render === 'function') render(); 
            if (typeof renderInventory === 'function') renderInventory();
            
            if (key === 'Escape') return; 
        }
    }

    if (key === 'Escape') {
        window.inputQueue.length = 0; 

        const activeModal = _modalCache.getActive();
        if (activeModal) {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            
            if (activeModal.id === 'inventoryModal' && typeof closeInventoryModal === 'function') closeInventoryModal();
            else if (activeModal.id === 'mapModal' && typeof closeWorldMap === 'function') closeWorldMap();
            else activeModal.classList.add('hidden'); 
            
            if (document.activeElement) document.activeElement.blur();
        }
        return; 
    }

    // 🌟 JUICE WIN: Zoom Feedback
    if (key === '=' || key === '+') {
        window.currentZoom = Math.min(40, window.currentZoom + 2);
        if (typeof resizeCanvas === 'function') resizeCanvas();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "ZOOM IN", "#9ca3af");
        return;
    }
    if (key === '-' || key === '_') {
        window.currentZoom = Math.max(12, window.currentZoom - 2);
        if (typeof resizeCanvas === 'function') resizeCanvas();
        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "ZOOM OUT", "#9ca3af");
        return;
    }

    if (key === 'Enter') { 
        const chatIn = document.getElementById('chatInput');
        if (chatIn) chatIn.focus(); 
        return; 
    }

    if (key === '/') {
        const chatIn = document.getElementById('chatInput');
        if (chatIn) {
            chatIn.focus();
            chatIn.value = '/';
        }
        return;
    }

    const mapping = HOTKEY_MAPPINGS[lowerKey];
    if (mapping) {
        const modalEl = document.getElementById(mapping.modal);
        const activeModal = _modalCache.getActive();

        if (modalEl) {
            const openFunc = typeof window[mapping.openFunc] === 'function' ? window[mapping.openFunc] : null;
            const closeFunc = mapping.closeFunc && typeof window[mapping.closeFunc] === 'function' ? window[mapping.closeFunc] : null;

            if (activeModal && activeModal !== modalEl) {
                activeModal.classList.add('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            }
            
            if (typeof window.toggleModal === 'function') {
                window.toggleModal(modalEl, openFunc, closeFunc);
            } else {
                window.inputQueue.length = 0; 
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                if (!modalEl.classList.contains('hidden')) {
                    if (closeFunc) closeFunc();
                    else modalEl.classList.add('hidden');
                } else if (openFunc) {
                    openFunc();
                } else {
                    modalEl.classList.remove('hidden');
                }
            }
        }
        return;
    }

    if (_modalCache.isAnyOpen() || gameState.inventoryMode) {
        return;
    }

    // ==========================================
    // --- GAMEPLAY ACTIONS ---
    // ==========================================

    if (gameState.isDroppingItem) {
        if (isNumberKey) {
            if (typeof handleItemDrop === 'function') handleItemDrop(testKeyNum.toString()); 
        } else {
            logMessage("{gray:Select an item to drop, or press Esc to cancel.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
        return;
    }

    if (gameState.isAiming) {
        const abilityId = gameState.abilityToAim;
        if (!abilityId) {
            gameState.isAiming = false;
            return;
        }
        
        const dir = window.MOVEMENT_MAP[key];
        
        if (dir) {
            const [dirX, dirY] = dir;
            window.lastActionTime = Date.now();
            
            if (dirX > 0) gameState.player.facing = 'right';
            else if (dirX < 0) gameState.player.facing = 'left';

            let expansionHandled = false;
            if (typeof window.ExpansionManager !== 'undefined') {
                const hookRes = window.ExpansionManager.triggerHook('onAimAbility', { abilityId, dirX, dirY, handled: false });
                if (hookRes && hookRes.handled) expansionHandled = true;
            }

            if (!expansionHandled) {
                if (abilityId === 'lunge') { if (typeof executeLunge === 'function') executeLunge(dirX, dirY); }
                else if (abilityId === 'ranged_attack') { if (typeof executeRangedAttack === 'function') executeRangedAttack(dirX, dirY); }
                else if (['shieldBash', 'cleave', 'kick', 'crush'].includes(abilityId)) { if (typeof executeMeleeSkill === 'function') executeMeleeSkill(abilityId, dirX, dirY); }
                else if (abilityId === 'quickstep') { if (typeof executeQuickstep === 'function') executeQuickstep(dirX, dirY); }
                else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) { if (typeof executeAimedSpell === 'function') executeAimedSpell(abilityId, dirX, dirY); }
                else if (abilityId === 'pacify') { if (typeof executePacify === 'function') executePacify(dirX, dirY); }
                else if (abilityId === 'inflictMadness') { if (typeof executeInflictMadness === 'function') executeInflictMadness(dirX, dirY); }
                else if (abilityId === 'tame') { if (typeof executeTame === 'function') executeTame(dirX, dirY); }
                else if (abilityId === 'throwTNT') { if (typeof executeThrowTNT === 'function') executeThrowTNT(dirX, dirY); }
                else if (abilityId.startsWith('throwPotion_')) { if (typeof executeThrowPotion === 'function') executeThrowPotion(abilityId, dirX, dirY); } 
                else logMessage("{red:Unknown ability. Aiming canceled.}");
            }

            gameState.isAiming = false;
            gameState.abilityToAim = null;
        } else {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "?", "#ef4444");
            logMessage("{gray:Invalid direction. Use Arrow keys or WASD to aim. (Esc) to cancel.}");
        }
        return;
    }

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

    if (isNumberKey) {
        if (gameState.inventoryMode) {
            if (typeof useInventoryItem === 'function') useInventoryItem(testKeyNum - 1);
            return;
        }

        if (typeof useHotbarSlot === 'function') useHotbarSlot(testKeyNum - 1);
        return;
    }

    if (lowerKey === 'q') {
        _safeExecuteWithLock(async () => {
            if (typeof drinkFromSource === 'function') await drinkFromSource();
        });
        return;
    }

    if (lowerKey === 'z') {
        if (typeof window.toggleMount === 'function') window.toggleMount();
        return;
    }

    if (lowerKey === 'g') {
        let tileId;
        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') tileId = `${gameState.player.x},${-gameState.player.y}`;
        else tileId = `${gameState.currentCaveId || gameState.currentCastleId}:${gameState.player.x},${-gameState.player.y}`;

        const currentTile = (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') 
            ? chunkManager.getTile(gameState.player.x, gameState.player.y)
            : (gameState.mapMode === 'dungeon' ? chunkManager.caveMaps[gameState.currentCaveId]?.[gameState.player.y]?.[gameState.player.x] : chunkManager.castleMaps[gameState.currentCastleId]?.[gameState.player.y]?.[gameState.player.x]);

        // 🚨 Note: Currently 'g' simulates an attemptMovePlayer to trigger the auto-loot logic from movement.js
        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[currentTile]) {
            logMessage("You scour the ground for items...");
            
            // Visual feedback of reaching down
            gameState.player.visualY += 0.25;
            
            if (typeof attemptMovePlayer === 'function') attemptMovePlayer(gameState.player.x, gameState.player.y); 
            return;
        } else {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "Nothing", "#9ca3af");
            logMessage("{gray:There is nothing here to pick up.}");
            return;
        }
    }

    // Note: The Spacebar (' ') also technically hits this block as a wait/rest action via ACTION_KEYS
    if (lowerKey === 'r' || lowerKey === ' ') {
        _safeExecuteWithLock(async () => {
            // JUICE WIN: Audio feedback for waiting/resting
            if (typeof AudioSystem !== 'undefined') {
                AudioSystem.playNoise(0.08, 0.05, 400); // Soft breath/rustle
            }
            if (typeof restPlayer === 'function') await restPlayer();
            window.lastActionTime = Date.now(); 
        });
        return;
    }

    const dir = window.MOVEMENT_MAP[key];

    if (dir) {
        const [dirX, dirY] = dir;
        let newX = gameState.player.x + dirX;
        let newY = gameState.player.y + dirY;

        if (newX > gameState.player.x) gameState.player.facing = 'right';
        else if (newX < gameState.player.x) gameState.player.facing = 'left';

        window.lastActionTime = Date.now(); 
        window._lastAutoTickTime = Date.now();
        
        if (typeof attemptMovePlayer === 'function') attemptMovePlayer(newX, newY);
        return;
    }

    if (ACTION_KEYS.has(lowerKey)) {
        
        // 🌟 LORE WIN: Merge class-specific flavors with environment!
        let waitFlavors = [...window.WAIT_FLAVORS.DEFAULT];
        const bg = gameState.player.background;
        
        if (bg) {
            const bgKey = bg.toUpperCase();
            if (window.WAIT_FLAVORS[bgKey]) {
                waitFlavors = waitFlavors.concat(window.WAIT_FLAVORS[bgKey]);
            }
            // Add race specific flavors too
            const raceKey = (gameState.player.race || "").toUpperCase();
            if (window.WAIT_FLAVORS[raceKey]) {
                waitFlavors = waitFlavors.concat(window.WAIT_FLAVORS[raceKey]);
            }
        }
        
        let pColor = "#9ca3af";
        let pIcon = "...";

        if (gameState.player.stealthTurns > 0) {
            waitFlavors = window.WAIT_FLAVORS.STEALTH;
            pIcon = "💨";
            pColor = "#6b7280";
        } else if (gameState.player.isMounted && gameState.player.companion) {
            waitFlavors = window.WAIT_FLAVORS.MOUNTED;
        } else if (gameState.player.isSailing) {
            waitFlavors = window.WAIT_FLAVORS.SAILING;
            pIcon = "🫧";
            pColor = "#3b82f6";
        } else if (gameState.player.isBoating) {
            waitFlavors = window.WAIT_FLAVORS.BOATING;
            pIcon = "🫧";
            pColor = "#3b82f6";
        } else if (gameState.mapMode === 'castle' && gameState.currentCastleId && gameState.currentCastleId.includes('village') && gameState.player.guildTag) {
            if (window.WAIT_FLAVORS.GUILD) waitFlavors = window.WAIT_FLAVORS.GUILD;
        }
        else if (gameState.currentRealm !== 0 && gameState.currentRealm) {
            if (gameState.realmMutators && gameState.realmMutators.includes('frozen_wastes')) {
                waitFlavors = window.WAIT_FLAVORS.FROZEN_WASTES;
                pIcon = "💨";
                pColor = "#e0f2fe";
            } else if (gameState.currentRealm === 'raid_molten') {
                waitFlavors = window.WAIT_FLAVORS.CAVE_FIRE; 
                pColor = "#f97316";
            } else {
                waitFlavors = window.WAIT_FLAVORS.MULTIVERSE;
                pColor = "#a855f7";
            }
        }
        else if (gameState.mapMode === 'overworld') {
            if (gameState.isBloodMoon) {
                waitFlavors = window.WAIT_FLAVORS.BLOOD_MOON;
                pColor = "#ef4444";
            }
            else if (gameState.isEclipse) waitFlavors = window.WAIT_FLAVORS.ECLIPSE;
            else if (gameState.isLeylineSurge) waitFlavors = window.WAIT_FLAVORS.SURGE;
            else if (gameState.weather === 'rain') waitFlavors = window.WAIT_FLAVORS.RAIN;
            else if (gameState.weather === 'storm') waitFlavors = window.WAIT_FLAVORS.STORM;
            else if (gameState.weather === 'snow') {
                waitFlavors = window.WAIT_FLAVORS.SNOW;
                pIcon = "💨";
                pColor = "#f3f4f6";
            }
            else if (gameState.weather === 'fog') waitFlavors = window.WAIT_FLAVORS.FOG;
        } 
        else if (gameState.mapMode === 'dungeon') {
            if (gameState.currentCaveTheme === 'VOID') waitFlavors = window.WAIT_FLAVORS.CAVE_VOID;
            else if (gameState.currentCaveTheme === 'FIRE') waitFlavors = window.WAIT_FLAVORS.CAVE_FIRE;
            else if (gameState.currentCaveTheme === 'ICE' || gameState.currentCaveTheme === 'FROZEN_RUIN') {
                waitFlavors = window.WAIT_FLAVORS.CAVE_ICE;
                pIcon = "💨";
                pColor = "#e0f2fe";
            }
            else if (gameState.currentCaveTheme === 'PIRATE_COVE' || gameState.currentCaveTheme === 'SUNKEN_SHIPWRECK') waitFlavors = window.WAIT_FLAVORS.SAILING;
            else waitFlavors = window.WAIT_FLAVORS.CAVE_DEFAULT;
        } 
        else if (gameState.mapMode === 'underworld') {
            waitFlavors = window.WAIT_FLAVORS.UNDERWORLD;
            pColor = "#57534e";
        }
        else if (gameState.mapMode === 'castle') {
            waitFlavors = window.WAIT_FLAVORS.CASTLE;
        }

        let msg = waitFlavors[Math.floor(Math.random() * waitFlavors.length)];
        if (msg.includes('%MOUNT%')) {
            msg = msg.replace(/%MOUNT%/g, gameState.player.companion ? gameState.player.companion.name : 'companion');
        }

        logMessage(`{gray:${msg}}`);
        
        // 🌟 JUICE WIN: Thematic resting particles and audio!
        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.playNoise(0.08, 0.05, 400); 
        }
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, pIcon, pColor);
        }
        
        _safeExecuteWithLock(async () => {
            if (typeof endPlayerTurn === 'function') await endPlayerTurn();
            window.lastActionTime = Date.now(); 
        });
        return;
    }
}

document.addEventListener('keydown', (event) => {
    // Ignore key combinations
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // Ignore typing in input fields
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (!event.key) return; 
    
    // 🚨 BUG FIX: Exclude Function keys so they don't break the queue!
    if (event.key.startsWith('F') && !isNaN(parseInt(event.key.slice(1)))) return;

    if (BLOCKED_SCROLL_KEYS.has(event.key)) {
        if (typeof _modalCache !== 'undefined' && _modalCache.isAnyOpen()) {
            // Do not prevent default inside scrollable modals!
        } else {
            event.preventDefault();
        }
    }

    let inputStr = event.key;
    if (event.code && event.code.startsWith('Numpad') && !isNaN(parseInt(event.key))) {
        inputStr = 'Numpad' + event.key;
    }

    // Prevents holding 'I' or 'M' to spam open/close modals
    if (event.repeat && INSTANT_KEYS.has(inputStr)) {
        return;
    }

    if (typeof gameState !== 'undefined' && gameState.player && gameState.player.health <= 0) return;
    
    const isMenuKey = !!HOTKEY_MAPPINGS[inputStr.toLowerCase()];
    
    if (_modalCache.isAnyOpen() || INSTANT_KEYS.has(inputStr) || isMenuKey || (typeof gameState !== 'undefined' && (gameState.isDroppingItem || gameState.inventoryMode))) {
        handleInput(inputStr); 
    } else {
        // Allows holding WASD to queue up moves smoothly up to 3 frames ahead!
        if (window.inputQueue.length < 3) {
            window.inputQueue.push(inputStr);
        }
    }
}, { passive: false });

let resizeTimer;
window.addEventListener('resize', () => { 
    clearTimeout(resizeTimer); 
    if (typeof resizeCanvas === 'function') {
        resizeTimer = setTimeout(resizeCanvas, 100); 
    }
});

// --- END OF FILE input.js ---
