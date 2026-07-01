// --- START OF FILE hotbar.js ---

// ==========================================
// HOTBAR & QUICK ACTION SYSTEM
// ==========================================

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

    // PERFORMANCE WIN: O(N) Pre-Mapped Inventory Cache
    const inventoryMap = new Map();
    if (player.inventory) {
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            // Prefer items that actually have quantity > 0 in case of ghost stacks
            if (!inventoryMap.has(item.name) || item.quantity > 0) inventoryMap.set(item.name, item);
            if (item.templateId && (!inventoryMap.has(item.templateId) || item.quantity > 0)) inventoryMap.set(item.templateId, item);
        }
    }

    const fragment = document.createDocumentFragment();

    hotbar.forEach((abilityId, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.id = `hotbarSlot-${index}`;
        slotDiv.dataset.index = index;
        
        slotDiv.className = "hotbar-slot relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer bg-[var(--bg-page)] hover:border-blue-500 transition-all shadow-sm";

        // EXPANDABILITY WIN: If the hotbar ever expands to 10 slots, slot 10 safely renders as '0'
        const hotkeyNumber = (index + 1) % 10 === 0 && index !== 0 ? 0 : index + 1;

        const keyHint = document.createElement('span');
        keyHint.className = "absolute top-0 left-1 text-[10px] font-bold text-[var(--text-muted)]";
        keyHint.textContent = hotkeyNumber;
        slotDiv.appendChild(keyHint);

        if (abilityId) {
            const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[abilityId] : null;
            const spellData = typeof SPELL_DATA !== 'undefined' ? SPELL_DATA[abilityId] : null;
            
            let invItem = inventoryMap.get(abilityId);
            let itemData = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[abilityId] : null;
            if (!itemData && typeof ITEM_DATA !== 'undefined') {
                const itemKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === abilityId);
                if (itemKey) itemData = ITEM_DATA[itemKey];
            }

            if (skillData || spellData) {
                const data = skillData || spellData;
                const abrv = document.createElement('span');
                
                let colorClass = "text-gray-200";
                if (spellData) {
                    const sName = data.name || "";
                    if (sName.includes("Fire") || sName.includes("Meteor")) colorClass = "text-orange-400";
                    else if (sName.includes("Frost")) colorClass = "text-cyan-300";
                    else if (sName.includes("Poison") || sName.includes("Entangle")) colorClass = "text-green-400";
                    else if (sName.includes("Divine") || sName.includes("Heal")) colorClass = "text-yellow-400";
                    else if (sName.includes("Dark") || sName.includes("Siphon")) colorClass = "text-red-500";
                    else if (sName.includes("Lightning") || sName.includes("Thunder")) colorClass = "text-yellow-300";
                    else colorClass = "text-blue-300";
                } else if (skillData) {
                    colorClass = "text-yellow-500"; 
                }

                abrv.className = `font-bold text-sm ${colorClass} drop-shadow-md`;
                abrv.textContent = (data.name || '??').substring(0, 2).toUpperCase(); 
                
                slotDiv.title = `[${hotkeyNumber}] ${data.name || 'Unknown'}\nCost: ${data.cost || 0} ${data.costType || 'Resource'}\n(Right-click to unbind)`;
                slotDiv.appendChild(abrv);

                // JUICE WIN: Added animate-pulse to the red cooldown overlay
                if (cooldowns[abilityId] > 0) {
                    slotDiv.classList.add('cursor-not-allowed', 'border-red-900');
                    const cdOverlay = document.createElement('div');
                    cdOverlay.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-[2px] text-red-400 font-bold text-xl rounded shadow-inner animate-pulse";
                    cdOverlay.textContent = cooldowns[abilityId];
                    slotDiv.appendChild(cdOverlay);
                }
            } else if (invItem || itemData) {
                const displayName = invItem ? invItem.name : (itemData ? itemData.name : 'Unknown Item');
                const displayTile = invItem ? (invItem.tile || '🎒') : (itemData ? (itemData.tile || '🎒') : '🎒');
                const qty = invItem ? invItem.quantity : 0;
                
                const iconSpan = document.createElement('span');
                iconSpan.className = "font-bold text-2xl drop-shadow-md";
                iconSpan.textContent = displayTile;
                
                slotDiv.title = `[${hotkeyNumber}] ${displayName} (Qty: ${qty})\n(Right-click to unbind)`;
                slotDiv.appendChild(iconSpan);
                
                const qtyBadge = document.createElement('span');
                qtyBadge.className = "absolute bottom-0 right-0 text-[10px] bg-black bg-opacity-70 text-white px-1 rounded-tl font-bold border border-gray-700";
                qtyBadge.textContent = qty;
                slotDiv.appendChild(qtyBadge);

                // LORE WIN: If they run out of items, color the border red so they know it's a dead slot
                if (qty <= 0) {
                    slotDiv.classList.add('opacity-40', 'grayscale', 'border-red-900');
                }
            }
        } else {
            slotDiv.classList.add('border-dashed', 'opacity-30', 'border-gray-600');
            // LORE WIN: Thematic empty pocket hint
            slotDiv.title = "Empty Quick-Slot\n(Your hand grasps at air. Open your Bag or Grimoire to bind an action here.)";
        }

        fragment.appendChild(slotDiv);
    });
    
    hotbarContainerEl.appendChild(fragment);
}

function useHotbarSlot(index) {
    const player = gameState.player;
    const abilityId = player.hotbar[index];
    if (!abilityId) return;

    const triggerSlotShake = () => {
        const slotEl = document.getElementById(`hotbarSlot-${index}`);
        if (slotEl) {
            slotEl.classList.remove('shake');
            void slotEl.offsetWidth; 
            slotEl.classList.add('shake');
            slotEl.onanimationend = () => slotEl.classList.remove('shake');
        }
    };

    const cooldowns = player.cooldowns || {};
    if (cooldowns[abilityId] > 0) {
        let cdMsg = `{gray:That ability is not ready yet! (${cooldowns[abilityId]} turns left)}`;
        
        if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) {
            cdMsg = `{blue:The arcane energies are still gathering! (${cooldowns[abilityId]} turns left)}`;
        } else if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) {
            cdMsg = `{yellow:You need a moment to recover your breath! (${cooldowns[abilityId]} turns left)}`;
        }
        
        logMessage(cdMsg);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        
        triggerSlotShake();
        return;
    }

    const isSkill = typeof SKILL_DATA !== 'undefined' && !!SKILL_DATA[abilityId];
    const isSpell = typeof SPELL_DATA !== 'undefined' && !!SPELL_DATA[abilityId];

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
        let targetName = abilityId;
        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) {
            targetName = ITEM_DATA[abilityId].name;
        }

        const invIndex = player.inventory.findIndex(i => 
            (i.name === targetName || i.templateId === abilityId) && i.quantity > 0
        );
        
        if (invIndex > -1) {
            if (typeof useInventoryItem === 'function') useInventoryItem(invIndex);
        } else {
            // LORE WIN: Visceral realization that you are out of an item in the heat of combat!
            logMessage(`{gray:Your fingers trace an empty pouch. You are out of ${targetName}s!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            
            triggerSlotShake();
        }
    }
}

function assignToHotbar(abilityId) {
    const player = gameState.player;
    const hotbar = player.hotbar;
    
    let readableName = abilityId;
    let bindType = 'item'; 
    
    if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) {
        readableName = SKILL_DATA[abilityId].name;
        bindType = 'skill';
    }
    else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) {
        readableName = SPELL_DATA[abilityId].name;
        bindType = 'spell';
    }
    else if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) {
        readableName = ITEM_DATA[abilityId].name;
    }
    else {
        const invItem = player.inventory.find(i => i.templateId === abilityId || i.name === abilityId);
        if (invItem) readableName = invItem.name;
    }

    const existingIndex = hotbar.indexOf(abilityId);
    if (existingIndex !== -1) {
        logMessage(`{gray:${readableName} is already bound to Slot ${existingIndex + 1}.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // ROBUSTNESS WIN: Use findIndex instead of indexOf to catch 'undefined' or empty strings safely
    let index = hotbar.findIndex(slot => !slot);

    // LORE WIN: Highly atmospheric binding verbs!
    let flavorColor = 'gray';
    let verb = 'attached';
    
    if (bindType === 'spell') {
        verb = 'inscribed the runes for';
        flavorColor = 'blue';
    } else if (bindType === 'skill') {
        verb = 'committed to muscle memory:';
        flavorColor = 'yellow';
    } else {
        verb = 'hooked the';
        flavorColor = 'green';
    }

    if (index === -1) {
        index = 0;
        logMessage(`{${flavorColor}:Quick-Slots full. Overwrote Slot 1 and ${verb} ${readableName}.}`);
    } else {
        logMessage(`{${flavorColor}:You ${verb} ${readableName} to Quick-Slot ${index + 1}.}`);
    }

    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

    hotbar[index] = abilityId;
    if (typeof playerRef !== 'undefined') playerRef.update({ hotbar: hotbar });
    
    renderHotbar();
    
    setTimeout(() => {
        const slotEl = document.getElementById(`hotbarSlot-${index}`);
        if (slotEl) {
            let glowColor = 'rgba(209, 213, 219, 1)'; 
            let borderColor = '#d1d5db';
            
            if (bindType === 'spell') { glowColor = 'rgba(59, 130, 246, 1)'; borderColor = '#3b82f6'; }
            if (bindType === 'skill') { glowColor = 'rgba(234, 179, 8, 1)'; borderColor = '#eab308'; }
            if (bindType === 'item')  { glowColor = 'rgba(34, 197, 94, 1)'; borderColor = '#22c55e'; }

            slotEl.style.transition = 'none';
            slotEl.style.boxShadow = `0 0 15px ${glowColor}`;
            slotEl.style.borderColor = borderColor;
            
            setTimeout(() => {
                slotEl.style.transition = 'all 0.5s ease-out';
                slotEl.style.boxShadow = '';
                slotEl.style.borderColor = '';
            }, 50);
        }
    }, 0);
}

if (hotbarContainerEl && !hotbarContainerEl.dataset.listenersBound) {
    
    // Left Click (Use Ability)
    hotbarContainerEl.addEventListener('click', (e) => {
        if (typeof _modalCache !== 'undefined' && _modalCache.isAnyOpen()) return; 
        if (typeof gameState !== 'undefined' && gameState.isDroppingItem) return;
        
        const slotDiv = e.target.closest('.hotbar-slot');
        if (slotDiv) {
            const index = parseInt(slotDiv.dataset.index, 10);
            if (!isNaN(index)) {
                slotDiv.style.transform = 'scale(0.9)';
                setTimeout(() => { slotDiv.style.transform = ''; }, 100); 
                useHotbarSlot(index);
            }
        }
    });

    // Right Click (Clear Slot)
    hotbarContainerEl.addEventListener('contextmenu', (e) => {
        const slotDiv = e.target.closest('.hotbar-slot');
        if (slotDiv) {
            e.preventDefault(); 
            
            const index = parseInt(slotDiv.dataset.index, 10);
            if (!isNaN(index)) {
                const player = gameState.player;
                const abilityId = player.hotbar[index];
                
                if (abilityId) {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                    
                    // LORE WIN: Dynamic unbind text
                    let readableName = abilityId;
                    if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) readableName = SKILL_DATA[abilityId].name;
                    else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) readableName = SPELL_DATA[abilityId].name;
                    else if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) readableName = ITEM_DATA[abilityId].name;
                    else {
                        const invItem = player.inventory.find(i => i.templateId === abilityId || i.name === abilityId);
                        if (invItem) readableName = invItem.name;
                    }
                    
                    logMessage(`{gray:You wiped the memory of ${readableName} from Quick-Slot ${index + 1}.}`);
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
