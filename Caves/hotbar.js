// --- START OF FILE hotbar.js ---

// ==========================================
// HOTBAR & QUICK ACTION SYSTEM
// ==========================================

// FIX: Renamed to hotbarContainerEl to prevent global DOM ID collision
const hotbarContainerEl = document.getElementById('hotbarContainer');

function renderHotbar() {
    if (!hotbarContainerEl) return;
    
    hotbarContainerEl.innerHTML = '';

    // Absolute positioned label that sits on the border/top-left
    const label = document.createElement('div');
    label.className = 'absolute -top-3 left-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-[var(--bg-panel)] px-1';
    label.textContent = 'Hotkeys';
    hotbarContainerEl.appendChild(label);

    // PERFORMANCE WIN: Cache player object reference
    const player = gameState.player;
    const hotbar = player.hotbar || [null, null, null, null, null];
    const cooldowns = player.cooldowns || {};

    // PERFORMANCE WIN: Use DocumentFragment to batch DOM inserts
    const fragment = document.createDocumentFragment();

    hotbar.forEach((abilityId, index) => {
        const slotDiv = document.createElement('div');
        // Added an ID and data-index so we can target specific slots for event delegation and animations
        slotDiv.id = `hotbarSlot-${index}`;
        slotDiv.dataset.index = index;
        
        // Add specific 'hotbar-slot' class to easily identify it during event bubbling
        slotDiv.className = "hotbar-slot relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer bg-[var(--bg-page)] hover:border-blue-500 transition-all shadow-sm";

        const hotkeyNumber = index + 1;

        // Add keyboard number hint
        const keyHint = document.createElement('span');
        keyHint.className = "absolute top-0 left-1 text-[10px] font-bold text-[var(--text-muted)]";
        keyHint.textContent = hotkeyNumber;
        slotDiv.appendChild(keyHint);

        if (abilityId) {
            const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[abilityId] : null;
            const spellData = typeof SPELL_DATA !== 'undefined' ? SPELL_DATA[abilityId] : null;
            
            // Check if the ID belongs to an item
            let itemData = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[abilityId] : null;
            if (!itemData && typeof ITEM_DATA !== 'undefined') {
                const itemKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === abilityId);
                if (itemKey) itemData = ITEM_DATA[itemKey];
            }

            if (skillData || spellData) {
                const data = skillData || spellData;
                const abrv = document.createElement('span');
                
                // LORE & UI WIN: Color-code the spell abbreviations based on magic type!
                let colorClass = "text-gray-200";
                if (spellData) {
                    if (data.name.includes("Fire") || data.name.includes("Meteor")) colorClass = "text-orange-400";
                    else if (data.name.includes("Frost")) colorClass = "text-cyan-300";
                    else if (data.name.includes("Poison") || data.name.includes("Entangle")) colorClass = "text-green-400";
                    else if (data.name.includes("Divine") || data.name.includes("Heal")) colorClass = "text-yellow-400";
                    else if (data.name.includes("Dark") || data.name.includes("Siphon")) colorClass = "text-red-500";
                    else if (data.name.includes("Lightning") || data.name.includes("Thunder")) colorClass = "text-yellow-300";
                    else colorClass = "text-blue-300"; // Generic arcane
                } else if (skillData) {
                    colorClass = "text-yellow-500"; // Skills are yellow
                }

                abrv.className = `font-bold text-sm ${colorClass} drop-shadow-md`;
                abrv.textContent = data.name.substring(0, 2).toUpperCase(); 
                
                // QoL WIN: Explicit instructions on hover
                slotDiv.title = `[${hotkeyNumber}] ${data.name}\nCost: ${data.cost} ${data.costType}\n(Right-click to unbind)`;
                slotDiv.appendChild(abrv);

                // JUICE WIN: Glassmorphism Cooldown Overlay
                if (cooldowns[abilityId] > 0) {
                    slotDiv.classList.add('cursor-not-allowed', 'border-red-900');
                    const cdOverlay = document.createElement('div');
                    cdOverlay.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-[2px] text-red-400 font-bold text-xl rounded shadow-inner";
                    cdOverlay.textContent = cooldowns[abilityId];
                    slotDiv.appendChild(cdOverlay);
                }
            } else if (itemData) {
                // It's an item! Show the emoji icon
                const iconSpan = document.createElement('span');
                iconSpan.className = "font-bold text-2xl drop-shadow-md";
                iconSpan.textContent = itemData.tile || '🎒';
                
                // Get current quantity from inventory
                const invItem = player.inventory.find(i => i.name === itemData.name || i.templateId === abilityId);
                const qty = invItem ? invItem.quantity : 0;
                
                slotDiv.title = `[${hotkeyNumber}] ${itemData.name} (Qty: ${qty})\n(Right-click to unbind)`;
                slotDiv.appendChild(iconSpan);
                
                // Show quantity badge
                const qtyBadge = document.createElement('span');
                qtyBadge.className = "absolute bottom-0 right-0 text-[10px] bg-black bg-opacity-70 text-white px-1 rounded-tl font-bold border border-gray-700";
                qtyBadge.textContent = qty;
                slotDiv.appendChild(qtyBadge);

                // Gray out if we ran out of them
                if (qty <= 0) {
                    slotDiv.classList.add('opacity-40', 'grayscale', 'border-gray-700');
                }
            }
        } else {
            slotDiv.classList.add('border-dashed', 'opacity-30', 'border-gray-600');
            slotDiv.title = "Empty Slot\n(Open Inventory/Spellbook and click 'Bind')";
        }

        fragment.appendChild(slotDiv);
    });
    
    hotbarContainerEl.appendChild(fragment);
}

function useHotbarSlot(index) {
    const player = gameState.player;
    const abilityId = player.hotbar[index];
    if (!abilityId) return;

    const cooldowns = player.cooldowns || {};
    if (cooldowns[abilityId] > 0) {
        // LORE WIN: Thematic cooldown messages instead of generic errors
        let cdMsg = `{gray:That ability is not ready yet! (${cooldowns[abilityId]} turns left)}`;
        
        if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) {
            cdMsg = `{blue:The arcane energies are still gathering! (${cooldowns[abilityId]} turns left)}`;
        } else if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) {
            cdMsg = `{yellow:You need a moment to recover your breath! (${cooldowns[abilityId]} turns left)}`;
        }
        
        logMessage(cdMsg);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        
        // JUICE WIN: Shake the slot to indicate it's blocked
        const slotEl = document.getElementById(`hotbarSlot-${index}`);
        if (slotEl) {
            slotEl.classList.remove('shake');
            void slotEl.offsetWidth; // Trigger reflow
            slotEl.classList.add('shake');
        }
        return;
    }

    const isSkill = typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId];
    const isSpell = typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId];

    // --- MOUNT EXPANSION: AUTO-DISMOUNT ---
    // If you use a combat ability while riding a beast, you leap off dynamically!
    if (player.isMounted && (isSkill || isSpell)) {
        player.isMounted = false;
        logMessage(`{orange:You leap from your mount into combat!}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
        gameState.mapDirty = true;
        if (typeof render === 'function') render();
    }

    if (isSkill) {
        if (typeof useSkill === 'function') useSkill(abilityId);
    } else if (isSpell) {
        if (typeof castSpell === 'function') castSpell(abilityId);
    } else {
        // Assume it's an item, resolve its proper name
        let targetName = abilityId;
        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) {
            targetName = ITEM_DATA[abilityId].name;
        }

        // Find the item in the inventory
        const invIndex = player.inventory.findIndex(i => i.name === targetName || i.templateId === abilityId);
        
        if (invIndex > -1) {
            if (typeof useInventoryItem === 'function') useInventoryItem(invIndex);
        } else {
            logMessage(`{gray:You don't have any more of that item in your bag.}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            
            // JUICE WIN: Shake the empty slot to indicate you've run out!
            const slotEl = document.getElementById(`hotbarSlot-${index}`);
            if (slotEl) {
                slotEl.classList.remove('shake');
                void slotEl.offsetWidth; 
                slotEl.classList.add('shake');
            }
        }
    }
}

function assignToHotbar(abilityId) {
    const player = gameState.player;
    const hotbar = player.hotbar;
    
    // Get the readable name for the log message
    let readableName = abilityId;
    if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) readableName = SKILL_DATA[abilityId].name;
    else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) readableName = SPELL_DATA[abilityId].name;
    else if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) readableName = ITEM_DATA[abilityId].name;

    // QoL / BUG FIX: Prevent binding the exact same spell to multiple slots
    const existingIndex = hotbar.indexOf(abilityId);
    if (existingIndex !== -1) {
        logMessage(`{gray:${readableName} is already bound to Slot ${existingIndex + 1}.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // Find first empty slot
    let index = hotbar.indexOf(null);

    if (index === -1) {
        // Full? Replace slot 1
        index = 0;
        logMessage(`{blue:Hotbar full. Replaced Slot 1 with ${readableName}.}`);
    } else {
        logMessage(`{green:Bound ${readableName} to Hotbar Slot ${index + 1}.}`);
    }

    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

    hotbar[index] = abilityId;
    if (typeof playerRef !== 'undefined') playerRef.update({ hotbar: hotbar });
    
    renderHotbar();
    
    // JUICE WIN: Make the slot "pop" so the user knows exactly where it went
    setTimeout(() => {
        const slotEl = document.getElementById(`hotbarSlot-${index}`);
        if (slotEl) {
            slotEl.style.transition = 'none';
            slotEl.style.boxShadow = '0 0 15px rgba(59, 130, 246, 1)';
            slotEl.style.borderColor = '#3b82f6';
            
            setTimeout(() => {
                slotEl.style.transition = 'all 0.5s ease-out';
                slotEl.style.boxShadow = '';
                slotEl.style.borderColor = '';
            }, 50);
        }
    }, 0);
}

// --- SECURITY & PERFORMANCE WIN: Event Delegation ---
// We attach the listeners to the parent container exactly ONCE.
// This prevents memory leaks and V8 garbage collection stutters when the hotbar re-renders every turn!
if (hotbarContainerEl && !hotbarContainerEl.dataset.listenersBound) {
    
    // Left Click (Use Ability)
    hotbarContainerEl.addEventListener('click', (e) => {
        if (gameState.inventoryMode) return; 
        
        const slotDiv = e.target.closest('.hotbar-slot');
        if (slotDiv) {
            const index = parseInt(slotDiv.dataset.index, 10);
            if (!isNaN(index)) {
                // JUICE: Visual "button press" feedback on click
                slotDiv.style.transform = 'scale(0.9)';
                setTimeout(() => { slotDiv.style.transform = ''; }, 100); // Clear inline style so CSS classes take over
                
                useHotbarSlot(index);
            }
        }
    });

    // Right Click (Clear Slot)
    hotbarContainerEl.addEventListener('contextmenu', (e) => {
        const slotDiv = e.target.closest('.hotbar-slot');
        if (slotDiv) {
            e.preventDefault(); // Stop standard browser right-click menu
            
            const index = parseInt(slotDiv.dataset.index, 10);
            if (!isNaN(index)) {
                const player = gameState.player;
                
                if (player.hotbar[index]) {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                    logMessage(`{gray:Cleared Hotbar Slot ${index + 1}.}`);
                }
                
                player.hotbar[index] = null;
                if (typeof playerRef !== 'undefined') playerRef.update({ hotbar: player.hotbar });
                renderHotbar();
            }
        }
    });

    hotbarContainerEl.dataset.listenersBound = 'true';
}

// --- END OF FILE hotbar.js ---
