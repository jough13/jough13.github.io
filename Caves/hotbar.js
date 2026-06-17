// --- START OF FILE hotbar.js ---

// ==========================================
// HOTBAR & QUICK ACTION SYSTEM
// ==========================================

const hotbarContainer = document.getElementById('hotbarContainer');

function renderHotbar() {
    hotbarContainer.innerHTML = '';

    // Absolute positioned label that sits on the border/top-left
    const label = document.createElement('div');
    label.className = 'absolute -top-3 left-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-[var(--bg-panel)] px-1';
    label.textContent = 'Hotkeys';
    hotbarContainer.appendChild(label);

    const hotbar = gameState.player.hotbar;
    const cooldowns = gameState.player.cooldowns || {};

    hotbar.forEach((abilityId, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = "relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer bg-[var(--bg-page)] hover:border-blue-500 transition-all";

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
                abrv.className = "font-bold text-sm";
                abrv.textContent = data.name.substring(0, 2).toUpperCase(); 
                slotDiv.title = `${data.name} (Cost: ${data.cost} ${data.costType})`;
                slotDiv.appendChild(abrv);

                // Cooldown Overlay
                if (cooldowns[abilityId] > 0) {
                    slotDiv.classList.add('opacity-50', 'cursor-not-allowed');
                    const cdOverlay = document.createElement('div');
                    cdOverlay.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-bold";
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
                    slotDiv.classList.add('opacity-40', 'grayscale');
                }
            }
        } else {
            slotDiv.classList.add('border-dashed', 'opacity-50');
        }

        // Left Click to Use
        slotDiv.onclick = () => {
            if (gameState.inventoryMode) return; 
            useHotbarSlot(index);
        };
        
        // Right Click to unbind a slot!
        slotDiv.oncontextmenu = (e) => {
            e.preventDefault();
            gameState.player.hotbar[index] = null;
            if (typeof playerRef !== 'undefined') playerRef.update({ hotbar: gameState.player.hotbar });
            renderHotbar();
        };

        hotbarContainer.appendChild(slotDiv);
    });
}

function useHotbarSlot(index) {
    const abilityId = gameState.player.hotbar[index];
    if (!abilityId) return;

    const cooldowns = gameState.player.cooldowns || {};
    if (cooldowns[abilityId] > 0) {
        logMessage("{gray:That ability is on cooldown!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    if (SKILL_DATA[abilityId]) {
        useSkill(abilityId);
    } else if (SPELL_DATA[abilityId]) {
        castSpell(abilityId);
    } else {
        // Assume it's an item, resolve its proper name
        let targetName = abilityId;
        if (ITEM_DATA[abilityId]) {
            targetName = ITEM_DATA[abilityId].name;
        }

        // Find the item in the inventory
        const invIndex = gameState.player.inventory.findIndex(i => i.name === targetName || i.templateId === abilityId);
        
        if (invIndex > -1) {
            useInventoryItem(invIndex);
        } else {
            logMessage(`{gray:You don't have any more of that item.}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
    }
}

function assignToHotbar(abilityId) {
    // Find first empty slot
    const hotbar = gameState.player.hotbar;
    let index = hotbar.indexOf(null);

    if (index === -1) {
        // Full? Replace slot 1 or just notify
        index = 0;
        logMessage(`Hotbar full. Replaced Slot 1 with ${abilityId}.`);
    } else {
        logMessage(`Assigned ${abilityId} to Hotbar Slot ${index + 1}.`);
    }

    hotbar[index] = abilityId;
    playerRef.update({ hotbar: hotbar });
    renderHotbar();
}
