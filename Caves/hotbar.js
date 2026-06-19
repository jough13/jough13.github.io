// --- START OF FILE hotbar.js ---

// ==========================================
// HOTBAR & QUICK ACTION SYSTEM
// ==========================================

// FIX: Renamed to hotbarContainerEl to prevent global DOM ID collision
const hotbarContainerEl = document.getElementById('hotbarContainer');

function renderHotbar() {
    hotbarContainerEl.innerHTML = '';

    // Absolute positioned label that sits on the border/top-left
    const label = document.createElement('div');
    label.className = 'absolute -top-3 left-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-[var(--bg-panel)] px-1';
    label.textContent = 'Hotkeys';
    hotbarContainerEl.appendChild(label);

    const hotbar = gameState.player.hotbar;
    const cooldowns = gameState.player.cooldowns || {};

    // PERFORMANCE: Use DocumentFragment to batch DOM inserts
    const fragment = document.createDocumentFragment();

    hotbar.forEach((abilityId, index) => {
        const slotDiv = document.createElement('div');
        // Added an ID so we can target specific slots for animations later
        slotDiv.id = `hotbarSlot-${index}`;
        slotDiv.className = "relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer bg-[var(--bg-page)] hover:border-blue-500 transition-all shadow-sm";

        // Add keyboard number hint
        const keyHint = document.createElement('span');
        keyHint.className = "absolute top-0 left-1 text-[10px] font-bold text-[var(--text-muted)]";
        keyHint.textContent = index + 1;
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
                slotDiv.title = `${data.name} (Cost: ${data.cost} ${data.costType})`;
                slotDiv.appendChild(abrv);

                // Cooldown Overlay
                if (cooldowns[abilityId] > 0) {
                    slotDiv.classList.add('opacity-50', 'cursor-not-allowed', 'border-red-900');
                    const cdOverlay = document.createElement('div');
                    cdOverlay.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white font-bold text-lg rounded";
                    cdOverlay.textContent = cooldowns[abilityId];
                    slotDiv.appendChild(cdOverlay);
                }
            } else if (itemData) {
                // It's an item! Show the emoji icon
                const iconSpan = document.createElement('span');
                iconSpan.className = "font-bold text-2xl drop-shadow-md";
                iconSpan.textContent = itemData.tile || '🎒';
                
                // Get current quantity from inventory
                const invItem = gameState.player.inventory.find(i => i.name === itemData.name || i.templateId === abilityId);
                const qty = invItem ? invItem.quantity : 0;
                
                slotDiv.title = `${itemData.name} (Qty: ${qty})`;
                slotDiv.appendChild(iconSpan);
                
                // Show quantity badge
                const qtyBadge = document.createElement('span');
                qtyBadge.className = "absolute bottom-0 right-0 text-[10px] bg-black bg-opacity-70 text-white px-1 rounded-tl font-bold";
                qtyBadge.textContent = qty;
                slotDiv.appendChild(qtyBadge);

                // Gray out if we ran out of them
                if (qty <= 0) {
                    slotDiv.classList.add('opacity-40', 'grayscale', 'border-gray-700');
                }
            }
        } else {
            slotDiv.classList.add('border-dashed', 'opacity-30', 'border-gray-600');
        }

        // Left Click to Use
        slotDiv.onclick = () => {
            if (gameState.inventoryMode) return; 
            
            // JUICE: Visual "button press" feedback on click
            slotDiv.style.transform = 'scale(0.9)';
            setTimeout(() => { slotDiv.style.transform = 'scale(1)'; }, 100);
            
            useHotbarSlot(index);
        };
        
        // Right Click to unbind a slot!
        slotDiv.oncontextmenu = (e) => {
            e.preventDefault();
            
            if (gameState.player.hotbar[index]) {
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                logMessage(`{gray:Cleared Hotbar Slot ${index + 1}.}`);
            }
            
            gameState.player.hotbar[index] = null;
            if (typeof playerRef !== 'undefined') playerRef.update({ hotbar: gameState.player.hotbar });
            renderHotbar();
        };

        fragment.appendChild(slotDiv);
    });
    
    hotbarContainerEl.appendChild(fragment);
}

function useHotbarSlot(index) {
    const abilityId = gameState.player.hotbar[index];
    if (!abilityId) return;

    const cooldowns = gameState.player.cooldowns || {};
    if (cooldowns[abilityId] > 0) {
        logMessage(`{gray:That ability is on cooldown! (${cooldowns[abilityId]} turns left)}`);
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

    if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) {
        useSkill(abilityId);
    } else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) {
        castSpell(abilityId);
    } else {
        // Assume it's an item, resolve its proper name
        let targetName = abilityId;
        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) {
            targetName = ITEM_DATA[abilityId].name;
        }

        // Find the item in the inventory
        const invIndex = gameState.player.inventory.findIndex(i => i.name === targetName || i.templateId === abilityId);
        
        if (invIndex > -1) {
            useInventoryItem(invIndex);
        } else {
            logMessage(`{gray:You don't have any more of that item.}`);
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
    // Find first empty slot
    const hotbar = gameState.player.hotbar;
    let index = hotbar.indexOf(null);

    // Get the readable name for the log message
    let readableName = abilityId;
    if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) readableName = SKILL_DATA[abilityId].name;
    else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) readableName = SPELL_DATA[abilityId].name;
    else if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) readableName = ITEM_DATA[abilityId].name;

    if (index === -1) {
        // Full? Replace slot 1 or just notify
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

// --- END OF FILE hotbar.js ---
