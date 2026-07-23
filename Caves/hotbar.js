// --- START OF FILE hotbar.js ---

// ==========================================
// HOTBAR & QUICK ACTION SYSTEM
// ==========================================

const hotbarContainerEl = document.getElementById('hotbarContainer');

// PERFORMANCE WIN: O(1) Cache for Item Name Lookups on the Hotbar
// Prevents O(N) scans of ITEM_DATA every time the hotbar renders!
window._hotbarItemKeyCache = window._hotbarItemKeyCache || {};

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

    // 🚨 BUG FIX & QoL WIN: Aggregate Inventory Map
    // We now sum the quantities of fragmented stacks across the inventory so the 
    // hotbar displays the TRUE total amount of an item (e.g., 3 stacks of 5 arrows = 15 arrows).
    const inventoryTotals = new Map();
    const inventorySample = new Map(); // Keep a sample to extract tile icons and metadata
    
    if (player.inventory) {
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (!item || item.quantity <= 0) continue; // 🚨 GHOST GUARD
            
            const keysToMap = [item.name];
            if (item.templateId && item.templateId !== item.name) keysToMap.push(item.templateId);
            
            for (const k of keysToMap) {
                inventoryTotals.set(k, (inventoryTotals.get(k) || 0) + item.quantity);
                if (!inventorySample.has(k)) inventorySample.set(k, item);
            }
        }
    }

    const fragment = document.createDocumentFragment();
    let hotbarMutated = false; // Tracks if we need to auto-clear depleted disposable items

    hotbar.forEach((abilityId, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.id = `hotbarSlot-${index}`;
        slotDiv.dataset.index = index;
        
        let slotClasses = "hotbar-slot relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer bg-[var(--bg-page)] transition-all shadow-sm";
        
        // --- JUICE WIN: Active Telegraphing ---
        // Dynamically resolve aiming states for items that have internal system prefixes!
        let isActivelyAiming = false;
        if (typeof gameState !== 'undefined' && gameState.isAiming && gameState.abilityToAim) {
            if (gameState.abilityToAim === abilityId) isActivelyAiming = true;
            else if (gameState.abilityToAim === 'throwTNT' && abilityId === 'Dwarven TNT') isActivelyAiming = true;
            else if (gameState.abilityToAim === `throwPotion_${abilityId}`) isActivelyAiming = true;
        }

        if (isActivelyAiming) {
            slotClasses += " border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] transform scale-105 z-10 animate-pulse";
        } else {
            slotClasses += " hover:border-blue-500";
        }
        
        // We will apply slotClasses to className *after* checking item rarity below!

        // EXPANDABILITY WIN: If the hotbar ever expands to 10 slots, slot 10 safely renders as '0'
        const hotkeyNumber = (index + 1) % 10 === 0 && index !== 0 ? 0 : index + 1;

        const keyHint = document.createElement('span');
        keyHint.className = "absolute top-0 left-1 text-[10px] font-bold text-[var(--text-muted)] z-20";
        keyHint.textContent = hotkeyNumber;
        slotDiv.appendChild(keyHint);

        if (abilityId) {
            const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[abilityId] : null;
            const spellData = typeof SPELL_DATA !== 'undefined' ? SPELL_DATA[abilityId] : null;
            
            let invItem = inventorySample.get(abilityId);
            let totalQty = inventoryTotals.get(abilityId) || 0;
            let itemData = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[abilityId] : null;
            
            // ROBUSTNESS & PERFORMANCE WIN: Match dynamic prefixed items against their base template!
            // If we don't have a direct key match, scan for the base name using O(1) cache.
            if (!itemData && typeof ITEM_DATA !== 'undefined') {
                if (window._hotbarItemKeyCache[abilityId]) {
                    itemData = ITEM_DATA[window._hotbarItemKeyCache[abilityId]];
                } else {
                    const itemKey = Object.keys(ITEM_DATA).find(k => ITEM_DATA[k].name === abilityId);
                    if (itemKey) {
                        window._hotbarItemKeyCache[abilityId] = itemKey;
                        itemData = ITEM_DATA[itemKey];
                    }
                }
            }

            if (skillData || spellData) {
                slotDiv.className = slotClasses; // Apply base classes
                
                const data = skillData || spellData;
                const abrv = document.createElement('span');
                
                let colorClass = "text-gray-200";
                if (spellData) {
                    const sName = data.name || "";
                    // Color-code the spell icons natively based on their element!
                    if (sName.includes("Fire") || sName.includes("Meteor") || sName.includes("Pact") || sName.includes("Boil")) colorClass = "text-orange-400";
                    else if (sName.includes("Frost")) colorClass = "text-cyan-300";
                    else if (sName.includes("Poison") || sName.includes("Entangle") || sName.includes("Venom") || sName.includes("Acid")) colorClass = "text-green-400";
                    else if (sName.includes("Divine") || sName.includes("Heal") || sName.includes("Nova") || sName.includes("Holy")) colorClass = "text-yellow-400";
                    else if (sName.includes("Dark") || sName.includes("Siphon") || sName.includes("Smoke")) colorClass = "text-red-500";
                    else if (sName.includes("Lightning") || sName.includes("Thunder")) colorClass = "text-yellow-300";
                    else colorClass = "text-blue-300";
                } else if (skillData) {
                    colorClass = "text-yellow-500"; 
                }

                abrv.className = `font-bold text-sm ${colorClass} drop-shadow-md`;
                abrv.textContent = (data.name || '??').substring(0, 2).toUpperCase(); 
                
                // SECURITY & LORE WIN: Detailed, escaped tooltips
                const safeDataName = typeof escapeHtml === 'function' ? escapeHtml(data.name || 'Unknown') : (data.name || 'Unknown');
                let tooltipDmg = data.baseDamage ? `\nBase Dmg: ${data.baseDamage}` : '';
                if (data.baseHeal) tooltipDmg = `\nHeals: ${data.baseHeal}`;
                if (data.baseShield) tooltipDmg = `\nShields: ${data.baseShield}`;
                
                slotDiv.title = `[${hotkeyNumber}] ${safeDataName}\nCost: ${data.cost || 0} ${data.costType || 'Resource'}${tooltipDmg}\n(Right-click to unbind)`;
                slotDiv.appendChild(abrv);

                // JUICE WIN: Added animate-pulse to the red cooldown overlay
                if (cooldowns[abilityId] > 0) {
                    slotDiv.classList.add('cursor-not-allowed', 'border-red-900', 'grayscale');
                    const cdOverlay = document.createElement('div');
                    cdOverlay.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-[2px] text-red-400 font-bold text-xl rounded shadow-inner animate-pulse z-20";
                    cdOverlay.textContent = cooldowns[abilityId];
                    slotDiv.appendChild(cdOverlay);
                }
            } else if (invItem || itemData) {
                const displayName = invItem ? invItem.name : (itemData ? itemData.name : 'Unknown Item');
                const displayTile = invItem ? (invItem.tile || '🎒') : (itemData ? (itemData.tile || '🎒') : '🎒');
                const rarity = invItem ? invItem._rarity : (itemData ? itemData._rarity : null);
                
                // 🚨 PERFORMANCE WIN: Batched Auto-Clearing
                // If the item is completely depleted and it's a disposable type, wipe it.
                if (totalQty <= 0 && typeof playerRef !== 'undefined') {
                    const isDisposable = itemData && (itemData.type === 'consumable' || itemData.type === 'ammo');
                    if (isDisposable) {
                        player.hotbar[index] = null;
                        hotbarMutated = true;
                        return; // Skip rendering this slot
                    }
                }
                
                // --- JUICE WIN: Apply Rarity Colors and Glows to Hotbar! ---
                let iconColorClass = "text-gray-200";
                if (rarity && totalQty > 0) {
                    if (rarity === 'uncommon') {
                        iconColorClass = 'text-green-400';
                        slotClasses += ' border-green-800';
                    } else if (rarity === 'rare') {
                        iconColorClass = 'text-purple-400';
                        slotClasses += ' border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]';
                    } else if (rarity === 'epic') {
                        iconColorClass = 'text-red-400';
                        slotClasses += ' border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
                    } else if (rarity === 'legendary') {
                        iconColorClass = 'text-yellow-400 text-magic-shimmer';
                        slotClasses += ' border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
                    }
                }
                slotDiv.className = slotClasses;
                
                const iconSpan = document.createElement('span');
                iconSpan.className = `font-bold text-2xl drop-shadow-md z-10 ${iconColorClass}`;
                iconSpan.textContent = displayTile;
                
                // SECURITY WIN: Escape tooltip names!
                const safeDisplayName = typeof escapeHtml === 'function' ? escapeHtml(displayName) : displayName;
                slotDiv.title = `[${hotkeyNumber}] ${safeDisplayName} (Qty: ${totalQty})\n(Right-click to unbind)`;
                slotDiv.appendChild(iconSpan);
                
                // UX WIN: Format 999+ so massive stacks don't overflow the UI box
                const displayQty = totalQty > 999 ? '999+' : totalQty;
                const qtyBadge = document.createElement('span');
                qtyBadge.className = "absolute bottom-0 right-0 text-[10px] bg-black bg-opacity-70 text-white px-1 rounded-tl font-bold border border-gray-700 z-20";
                qtyBadge.textContent = displayQty;
                slotDiv.appendChild(qtyBadge);

                // LORE WIN: If they run out of non-disposable items (like a specific sword), color the border red so they know it's a dead slot
                if (totalQty <= 0) {
                    slotDiv.classList.add('opacity-40', 'grayscale', 'border-red-900');
                    slotDiv.title = `[${hotkeyNumber}] Missing: ${safeDisplayName}\n(Right-click to unbind)`;
                }
            }
        } else {
            slotDiv.className = slotClasses; // Apply base
            slotDiv.classList.add('border-dashed', 'opacity-30', 'border-gray-600');
            // LORE WIN: Thematic empty pocket hint
            slotDiv.title = "Empty Quick-Slot\n(Your hand grasps at air. Open your Bag or Grimoire to bind an action here.)";
        }

        fragment.appendChild(slotDiv);
    });
    
    // 🚨 BATCHED AUTO-CLEAR RESOLUTION
    // If one or more slots depleted entirely during this render pass, push ONE save and trigger ONE re-render!
    if (hotbarMutated) {
        if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ hotbar: player.hotbar });
        setTimeout(renderHotbar, 0); // Escape the current execution context and redraw clean
        return;
    }

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
            slotEl.addEventListener('animationend', () => slotEl.classList.remove('shake'), { once: true });
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

    // Auto-dismount for combat actions
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
        // Evaluate dynamic names vs base templates
        let targetName = abilityId;
        if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) {
            targetName = ITEM_DATA[abilityId].name;
        }

        const invIndex = player.inventory.findIndex(i => 
            i && (i.name === targetName || i.templateId === abilityId) && i.quantity > 0 // 🚨 GHOST GUARD
        );
        
        if (invIndex > -1) {
            if (typeof useInventoryItem === 'function') useInventoryItem(invIndex);
        } else {
            // LORE WIN: Visceral realization that you are out of an item in the heat of combat!
            const safeTargetName = typeof escapeHtml === 'function' ? escapeHtml(targetName) : targetName;
            logMessage(`{gray:Your fingers trace an empty pouch. You are out of ${safeTargetName}s!}`);
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
        const invItem = player.inventory.find(i => i && (i.templateId === abilityId || i.name === abilityId)); // 🚨 GHOST GUARD
        if (invItem) readableName = invItem.name;
    }

    const existingIndex = hotbar.indexOf(abilityId);
    const safeReadableName = typeof escapeHtml === 'function' ? escapeHtml(readableName) : readableName;
    
    if (existingIndex !== -1) {
        logMessage(`{gray:${safeReadableName} is already bound to Slot ${existingIndex + 1}.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }

    // ROBUSTNESS WIN: Use findIndex instead of indexOf to catch 'undefined' or empty strings safely
    let index = hotbar.findIndex(slot => slot === null || slot === undefined || slot === "");

    // 🚨 UX WIN: Graceful Rejection
    // Don't blindly overwrite Slot 1 and ruin a player's primary attack!
    if (index === -1) {
        logMessage(`{red:Quick-Slots full! Right-click a slot to unbind it first.}`);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        
        // Jiggle the hotbar so they look at it
        if (hotbarContainerEl) {
            hotbarContainerEl.classList.remove('shake');
            void hotbarContainerEl.offsetWidth;
            hotbarContainerEl.classList.add('shake');
        }
        return;
    }

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

    logMessage(`{${flavorColor}:You ${verb} ${safeReadableName} to Quick-Slot ${index + 1}.}`);

    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

    hotbar[index] = abilityId;
    
    if (typeof triggerDebouncedSave === 'function') {
        triggerDebouncedSave({ hotbar: hotbar });
    } else if (typeof playerRef !== 'undefined' && playerRef) {
        playerRef.update({ hotbar: hotbar });
    }
    
    renderHotbar();
    
    // JUICE WIN: Dynamic pulsing glow based on the type of action bound
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

// SECURITY & PERFORMANCE WIN: Event Delegation
if (hotbarContainerEl && !hotbarContainerEl.dataset.listenersBound) {
    
    // Left Click (Use Ability)
    hotbarContainerEl.addEventListener('click', (e) => {
        // 🚨 SECURITY & BUG FIX: Direct UI clicks were bypassing the input.js guards!
        // Prevents interacting with the hotbar while an AI move is processing, you're stunned, or menus are open.
        if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
        if (typeof _modalCache !== 'undefined' && _modalCache.isAnyOpen()) return; 
        
        if (typeof gameState !== 'undefined') {
            if (gameState.isDroppingItem) return;
            if (gameState.player && gameState.player.health <= 0) return;
            if (gameState.player && gameState.player.stunTurns > 0) {
                if (typeof logMessage !== 'undefined') logMessage("{yellow:You are stunned and cannot act!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }
        }
        
        const slotDiv = e.target.closest('.hotbar-slot');
        if (slotDiv && !slotDiv.classList.contains('cursor-not-allowed')) {
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
            
            // 🚨 BUG FIX WIN: Abort Aiming Mode gracefully if they right click!
            if (typeof gameState !== 'undefined' && gameState.isAiming) {
                gameState.isAiming = false;
                gameState.abilityToAim = null;
                if (typeof logMessage !== 'undefined') logMessage("{gray:Aiming canceled.}");
                if (typeof render === 'function') render();
            }
            
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
                        const invItem = player.inventory.find(i => i && (i.templateId === abilityId || i.name === abilityId)); // 🚨 GHOST GUARD
                        if (invItem) readableName = invItem.name;
                    }
                    
                    const safeReadableName = typeof escapeHtml === 'function' ? escapeHtml(readableName) : readableName;
                    if (typeof logMessage !== 'undefined') logMessage(`{gray:You wiped the memory of ${safeReadableName} from Quick-Slot ${index + 1}.}`);
                }
                
                player.hotbar[index] = null;
                
                if (typeof triggerDebouncedSave === 'function') {
                    triggerDebouncedSave({ hotbar: player.hotbar });
                } else if (typeof playerRef !== 'undefined' && playerRef) {
                    playerRef.update({ hotbar: player.hotbar });
                }
                
                renderHotbar();
            }
        }
    });

    hotbarContainerEl.dataset.listenersBound = 'true';
}

// --- END OF FILE hotbar.js ---
