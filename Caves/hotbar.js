// --- START OF FILE hotbar.js ---

// ==========================================
// HOTBAR & QUICK ACTION SYSTEM
// ==========================================

const hotbarContainerEl = document.getElementById('hotbarContainer');

// PERFORMANCE WIN: O(1) Cache for Item Name Lookups on the Hotbar
// Prevents O(N) scans of ITEM_DATA every time the hotbar renders!
window._hotbarItemKeyCache = window._hotbarItemKeyCache || {};

// 🚨 BUG FIX & ROBUSTNESS WIN: Hardware Mutex Lock
// Prevents double-casting from faulty mice or sensitive touch screens that send 
// two click events in under 10ms, which bypasses async engine locks!
let _isHotbarExecuting = false;

function renderHotbar() {
    if (!hotbarContainerEl) return;
    
    hotbarContainerEl.innerHTML = '';

    // Absolute positioned label that sits on the border/top-left
    const label = document.createElement('div');
    label.className = 'absolute -top-3 left-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-[var(--bg-panel)] px-1 shadow-sm rounded-sm';
    label.textContent = 'Hotkeys';
    hotbarContainerEl.appendChild(label);

    // PERFORMANCE WIN: Cache player object reference
    const player = gameState.player;
    const hotbar = player.hotbar || [null, null, null, null, null];
    const cooldowns = player.cooldowns || {};

    // 🚨 BUG FIX & QoL WIN: Aggregate Inventory Map & Equipment State
    // We now sum the quantities of fragmented stacks across the inventory so the 
    // hotbar displays the TRUE total amount of an item (e.g., 3 stacks of 5 arrows = 15 arrows).
    const inventoryTotals = new Map();
    const inventorySample = new Map(); // Keep a sample to extract tile icons and metadata
    const inventoryEquipped = new Set(); // Tracks what is currently worn!
    
    if (player.inventory) {
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            if (!item || item.quantity <= 0) continue; // 🚨 GHOST GUARD
            
            // Map strictly to the name and the template ID to ensure it catches both potential binding methods
            inventoryTotals.set(item.name, (inventoryTotals.get(item.name) || 0) + item.quantity);
            if (!inventorySample.has(item.name)) inventorySample.set(item.name, item);
            
            if (item.templateId && item.templateId !== item.name) {
                inventoryTotals.set(item.templateId, (inventoryTotals.get(item.templateId) || 0) + item.quantity);
                if (!inventorySample.has(item.templateId)) inventorySample.set(item.templateId, item);
            }
            
            // Track Equipment State for UI overlays!
            if (item.isEquipped) {
                inventoryEquipped.add(item.name);
                if (item.templateId) inventoryEquipped.add(item.templateId);
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
        let isSlotEmpty = false;
        
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
        
        // EXPANDABILITY WIN: If the hotbar ever expands to 10 slots, slot 10 safely renders as '0'
        const hotkeyNumber = (index + 1) % 10 === 0 && index !== 0 ? 0 : index + 1;

        const keyHint = document.createElement('span');
        keyHint.className = "absolute top-0 left-1 text-[10px] font-bold text-[var(--text-muted)] z-20 pointer-events-none";
        keyHint.textContent = hotkeyNumber;
        slotDiv.appendChild(keyHint);

        if (abilityId) {
            const skillData = typeof SKILL_DATA !== 'undefined' ? SKILL_DATA[abilityId] : null;
            const spellData = typeof SPELL_DATA !== 'undefined' ? SPELL_DATA[abilityId] : null;
            
            // 🚨 ROBUSTNESS WIN: Corrupted Slot Failsafe
            // If the player uninstalled an expansion or performed a prestige reset that wiped their spellbook,
            // but the hotbar wasn't cleared, the slot will point to nothing and crash.
            if (skillData && (!player.skillbook || !player.skillbook[abilityId])) {
                player.hotbar[index] = null;
                hotbarMutated = true;
                isSlotEmpty = true;
            }
            else if (spellData && (!player.spellbook || !player.spellbook[abilityId])) {
                player.hotbar[index] = null;
                hotbarMutated = true;
                isSlotEmpty = true;
            }
            else {
                let invItem = inventorySample.get(abilityId);
                let totalQty = inventoryTotals.get(abilityId) || 0;
                let itemData = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[abilityId] : null;
                
                // Fetch template data for dynamically prefixed items
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
                    const data = skillData || spellData;
                    
                    // --- 🚨 UX WIN: Out of Mana/Stamina (OOM) Indication ---
                    let isOOM = false;
                    let actualCost = Number(data.cost) || 0;
                    
                    if (spellData) {
                        if (spellData.costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
                            actualCost = Math.floor(actualCost * 0.8);
                        }
                    }
                    
                    // Safe numeric coercion
                    if ((Number(player[data.costType]) || 0) < actualCost) {
                        isOOM = true;
                    }
                    
                    if (isOOM) {
                        slotClasses += " opacity-60 grayscale-[50%]";
                        // Subtle colored border based on what you are missing!
                        if (data.costType === 'mana') slotClasses += " border-blue-900";
                        else if (data.costType === 'stamina') slotClasses += " border-yellow-900";
                        else if (data.costType === 'psyche') slotClasses += " border-purple-900";
                    }
                    
                    slotDiv.className = slotClasses; 
                    
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

                    abrv.className = `font-bold text-sm ${colorClass} drop-shadow-md pointer-events-none`;
                    abrv.textContent = (data.name || '??').substring(0, 2).toUpperCase(); 
                    
                    // SECURITY & LORE WIN: Detailed, escaped tooltips
                    const safeDataName = typeof escapeHtml === 'function' ? escapeHtml(data.name || 'Unknown') : (data.name || 'Unknown');
                    let tooltipDmg = data.baseDamage ? `\nBase Dmg: ${data.baseDamage}` : '';
                    if (data.baseHeal) tooltipDmg = `\nHeals: ${data.baseHeal}`;
                    if (data.baseShield) tooltipDmg = `\nShields: ${data.baseShield}`;
                    
                    let oomWarning = '';
                    if (isOOM && data.costType) {
                        const cleanType = data.costType.charAt(0).toUpperCase() + data.costType.slice(1);
                        oomWarning = `\n(Not enough ${cleanType})`;
                    }
                    
                    slotDiv.title = `[${hotkeyNumber}] ${safeDataName}\nCost: ${actualCost} ${data.costType || 'Resource'}${tooltipDmg}${oomWarning}\n(Right-click to unbind)`;
                    slotDiv.appendChild(abrv);

                    // --- JUICE WIN: Dynamic Cooldown Colors ---
                    if (cooldowns[abilityId] > 0) {
                        slotDiv.classList.add('cursor-not-allowed', 'border-red-900', 'grayscale');
                        const cd = cooldowns[abilityId];
                        const cdOverlay = document.createElement('div');
                        // Flashes yellow if only 1 turn left, otherwise menacing red
                        const cdColor = cd === 1 ? 'text-yellow-400' : 'text-red-400';
                        
                        cdOverlay.className = `absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-[2px] ${cdColor} font-bold text-xl rounded shadow-inner animate-pulse z-20 pointer-events-none`;
                        cdOverlay.textContent = cd;
                        slotDiv.appendChild(cdOverlay);
                    }
                } 
                else if (invItem || itemData) {
                    const displayName = invItem ? invItem.name : (itemData ? itemData.name : 'Unknown Item');
                    const displayTile = invItem ? (invItem.tile || '🎒') : (itemData ? (itemData.tile || '🎒') : '🎒');
                    const rarity = invItem ? invItem._rarity : (itemData ? itemData._rarity : null);
                    
                    // 🚨 BUG FIX & PERFORMANCE WIN: True Auto-Clearing
                    // Instead of aborting the render and skipping the slot (which shrinks the hotbar),
                    // we flag it as mutated and set `isSlotEmpty` to true so the empty pocket graphic renders cleanly!
                    if (totalQty <= 0) {
                        const isDisposable = itemData && (itemData.type === 'consumable' || itemData.type === 'ammo');
                        if (isDisposable) {
                            player.hotbar[index] = null;
                            hotbarMutated = true;
                            isSlotEmpty = true;
                        }
                    }
                    
                    if (!isSlotEmpty) {
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
                        iconSpan.className = `font-bold text-2xl drop-shadow-md z-10 pointer-events-none ${iconColorClass}`;
                        iconSpan.textContent = displayTile;
                        
                        // Escape tooltip names!
                        const safeDisplayName = typeof escapeHtml === 'function' ? escapeHtml(displayName) : displayName;
                        slotDiv.title = `[${hotkeyNumber}] ${safeDisplayName} (Qty: ${totalQty})\n(Right-click to unbind)`;
                        slotDiv.appendChild(iconSpan);
                        
                        // Format 999+ so massive stacks don't overflow the UI box
                        const displayQty = totalQty > 999 ? '999+' : totalQty;
                        const qtyBadge = document.createElement('span');
                        qtyBadge.className = "absolute bottom-0 right-0 text-[10px] bg-black bg-opacity-70 text-white px-1 rounded-tl font-bold border border-gray-700 z-20 pointer-events-none";
                        qtyBadge.textContent = displayQty;
                        slotDiv.appendChild(qtyBadge);

                        // 🌟 UX WIN: Equipped Indicator!
                        if (inventoryEquipped.has(abilityId)) {
                            const equipBadge = document.createElement('span');
                            equipBadge.className = 'absolute top-0 right-0 bg-yellow-500 text-black text-[9px] px-1 py-0.5 font-bold rounded-bl-lg rounded-tr shadow-sm z-20 pointer-events-none';
                            equipBadge.textContent = 'EQP';
                            slotDiv.appendChild(equipBadge);
                        }

                        // If they run out of non-disposable items (like a specific sword), color the border red so they know it's a dead slot
                        if (totalQty <= 0) {
                            slotDiv.classList.add('opacity-40', 'grayscale', 'border-red-900');
                            slotDiv.title = `[${hotkeyNumber}] Missing: ${safeDisplayName}\n(Right-click to unbind)`;
                        }
                    }
                } else {
                    // If it's not a skill, spell, or known item... it's a ghost binding!
                    player.hotbar[index] = null;
                    hotbarMutated = true;
                    isSlotEmpty = true;
                }
            }
        } else {
            isSlotEmpty = true;
        }

        // 🚨 UI WIN: Clean Empty Slot Rendering
        // Ensures the hotbar never physically collapses, maintaining exactly 5 boxes!
        if (isSlotEmpty) {
            slotDiv.className = slotClasses + " border-dashed opacity-30 border-gray-600";
            slotDiv.title = "Empty Quick-Slot\n(Your hand grasps at air. Open your Bag or Grimoire to bind an action here.)";
        }

        fragment.appendChild(slotDiv);
    });
    
    // Quietly sync the newly scrubbed hotbar to the database without forcing an infinite recursive re-render!
    if (hotbarMutated) {
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({ hotbar: player.hotbar });
        } else if (typeof playerRef !== 'undefined' && playerRef) {
            playerRef.update({ hotbar: player.hotbar });
        }
    }

    hotbarContainerEl.appendChild(fragment);
}

function useHotbarSlot(index) {
    // 🚨 BUG FIX & STABILITY WIN: Hardware Mutex Lock
    // Prevents double-casting the same spell and dropping into negative mana if a mouse click bounces
    if (_isHotbarExecuting) return;
    _isHotbarExecuting = true;

    try {
        const player = gameState.player;
        const abilityId = player.hotbar[index];
        if (!abilityId) return;

        // 🚨 GAMEPLAY WIN: Guard against double-casting while actively aiming
        if (gameState.isAiming) {
            if (gameState.abilityToAim === abilityId) {
                // Clicking the same ability while aiming toggles it OFF!
                gameState.isAiming = false;
                gameState.abilityToAim = null;
                logMessage("{gray:Aiming canceled.}");
                if (typeof render === 'function') render();
                renderHotbar();
                return;
            } else {
                // Clicking a different ability automatically swaps your aim!
                gameState.isAiming = false;
            }
        }

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

        // --- 🚨 TACTILE UX WIN: OOM Pre-Shake Check ---
        // Instantly shakes the hotbar slot *before* routing to the logic if we know we can't afford it,
        // or if the item is physically missing from our bag!
        let preCheckFailed = false;
        
        if (isSkill) {
            const cost = Number(SKILL_DATA[abilityId].cost) || 0;
            if ((Number(player[SKILL_DATA[abilityId].costType]) || 0) < cost) preCheckFailed = true;
        } else if (isSpell) {
            let cost = Number(SPELL_DATA[abilityId].cost) || 0;
            if (SPELL_DATA[abilityId].costType === 'mana' && player.talents && player.talents.includes('mana_flow')) {
                cost = Math.floor(cost * 0.8);
            }
            if ((Number(player[SPELL_DATA[abilityId].costType]) || 0) < cost) preCheckFailed = true;
        } else {
            // Item Pre-Check: Do we actually have it?
            const targetName = (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) ? ITEM_DATA[abilityId].name : abilityId;
            const hasItem = player.inventory.some(i => i && (i.name === targetName || i.templateId === abilityId) && i.quantity > 0);
            if (!hasItem) preCheckFailed = true;
        }

        if (preCheckFailed) {
            triggerSlotShake();
            // If it's a spell/skill, let it fall through so the core engine prints the specific "Not enough Mana" error text.
            // If it's an item, we intercept it here to prevent the engine from silently failing.
            if (!isSkill && !isSpell) {
                const safeTargetName = typeof escapeHtml === 'function' ? escapeHtml(abilityId) : abilityId;
                logMessage(`{gray:Your fingers trace an empty pouch. You are out of ${safeTargetName}s!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }
        }

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
                i && (i.name === targetName || i.templateId === abilityId) && i.quantity > 0 
            );
            
            if (invIndex > -1) {
                if (typeof useInventoryItem === 'function') useInventoryItem(invIndex);
            }
        }
    } finally {
        // Unlock mutex safely after a 100ms hardware debounce
        setTimeout(() => { _isHotbarExecuting = false; }, 100);
    }
}

function assignToHotbar(abilityId) {
    const player = gameState.player;
    const hotbar = player.hotbar;
    
    // --- 🚨 BUG FIX & ROBUSTNESS WIN: Ghost Bind Failsafe ---
    // Prevents binding items/spells that technically don't exist anymore due to an uninstalled expansion
    let isValid = false;
    let readableName = abilityId;
    let bindType = 'item'; 
    
    if (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) {
        readableName = SKILL_DATA[abilityId].name;
        bindType = 'skill';
        isValid = true;
    }
    else if (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) {
        readableName = SPELL_DATA[abilityId].name;
        bindType = 'spell';
        isValid = true;
    }
    else if (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]) {
        readableName = ITEM_DATA[abilityId].name;
        isValid = true;
    }
    else {
        const invItem = player.inventory.find(i => i && (i.templateId === abilityId || i.name === abilityId)); // 🚨 GHOST GUARD
        if (invItem) {
            readableName = invItem.name;
            isValid = true;
        }
    }

    if (!isValid) {
        logMessage("{red:Cannot bind an unknown ability or missing item.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
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
        if (slotDiv && !slotDiv.classList.contains('cursor-not-allowed') && !slotDiv.classList.contains('border-dashed')) {
            const index = parseInt(slotDiv.dataset.index, 10);
            if (!isNaN(index)) {
                // Subtle press animation
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
                
                // UX WIN: Graceful unbinding if empty
                if (!abilityId) return;
                
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 1200); // Tearing sound
                
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
                
                player.hotbar[index] = null;
                
                // Clear the input queue to prevent them walking forward if they missed the right click
                if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
                
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

/**
 * Sets the cooldown for a skill or spell and updates the UI.
 * (Globally accessible from magic.js, skills.js, and items.js)
 */

window.triggerAbilityCooldown = function(abilityId) {
    let data = (typeof SKILL_DATA !== 'undefined' && SKILL_DATA[abilityId]) || 
               (typeof SPELL_DATA !== 'undefined' && SPELL_DATA[abilityId]) ||
               (typeof ITEM_DATA !== 'undefined' && ITEM_DATA[abilityId]); // Future-proofing

    if (data && data.cooldown) {
        if (!gameState.player.cooldowns) gameState.player.cooldowns = {};

        let cd = data.cooldown;

        // 🚨 EXPANDABILITY WIN: Call Expansion hook to allow modifications to cooldowns dynamically!
        if (typeof window.ExpansionManager !== 'undefined') {
            const hookRes = window.ExpansionManager.triggerHook('onCalculateCooldown', { abilityId, baseCooldown: cd, player: gameState.player });
            if (hookRes && hookRes.baseCooldown !== undefined) cd = hookRes.baseCooldown;
        }

        // --- Class specific Cooldown Reduction! ---
        if (gameState.player.talents) {
            // Rogues with Evasion recover movement skills faster
            if (data.type === 'movement' && gameState.player.talents.includes('evasion')) {
                cd = Math.max(1, cd - 1);
            }
            // Archmages recover spells faster
            if (data.costType === 'mana' && gameState.player.talents.includes('mana_flow')) {
                cd = Math.max(1, cd - 1);
            }
        }

        gameState.player.cooldowns[abilityId] = cd;

        if (typeof renderHotbar === 'function') renderHotbar();
    }
};

// --- END OF FILE hotbar.js ---
