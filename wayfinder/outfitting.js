// ==========================================
// --- SHIPYARD UI & PURCHASING LOGIC ---
// ==========================================

function displayShipyard() {
    openGenericModal("STARBASE SHIPYARD");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">CHASSIS MANIFEST</div>`;
    
    // 1. Build the Left Pane (The Manifest)
    for (const shipId in SHIP_CLASSES) {
        const ship = SHIP_CLASSES[shipId];
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        
        // --- FACTION LOCK LOGIC ---
        let isLocked = false;
        if (ship.reqFaction) {
            const standing = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[ship.reqFaction] || 0) : 0;
            if (standing < ship.minRep) isLocked = true;
        }

        const isCurrent = playerShip.shipClass === shipId;
        
        if (isLocked) {
            row.style.opacity = '0.4';
            row.innerHTML = `
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <span style="color:var(--danger); font-weight:bold; font-size:12px;">🔒 RESTRICTED</span> 
                    <span style="color:var(--text-color); font-size:10px;">Requires ${ship.reqFaction} Clearance</span>
                </div>
            `;
            row.onclick = () => {
                detailEl.innerHTML = `
                    <div style="text-align:center; padding: 40px 20px;">
                        <div style="font-size:60px; margin-bottom:15px; color:var(--danger); filter: drop-shadow(0 0 15px rgba(255,0,0,0.4));">🛑</div>
                        <h3 style="color:var(--danger); margin-bottom:10px;">ACCESS DENIED</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">This chassis is restricted to highly trusted allies of the ${ship.reqFaction}. Your current clearance level is insufficient to view its schematics.</p>
                    </div>
                `;
                actionsEl.innerHTML = `<button class="action-button danger-btn" disabled>RESTRICTED CHASSIS</button>`;
                if (typeof soundManager !== 'undefined') soundManager.playError();
            };
        } else {
            const nameColor = isCurrent ? "var(--success)" : "var(--text-color)";
            const costLabel = isCurrent ? "OWNED" : `${formatNumber(ship.baseCost)}c`;
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:${nameColor}; font-weight:bold; font-size:12px;">${isCurrent ? '▶ ' : ''}${ship.name}</span>
                    <span style="color:var(--gold-text); font-size:10px;">${costLabel}</span>
                </div>
            `;
            row.onclick = () => showShipDetails(shipId); 
        }
        listEl.appendChild(row);
    }

    // 2. Default Landing Screen (Right Pane)
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6;">🏭</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">AUTHORIZED DEALERSHIP</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Select a hull from the manifest on the left to view its specifications and place an order. 
                Your current vessel and installed components will be automatically appraised for trade-in value.
            </p>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="openStationView()">RETURN TO CONCOURSE</button>`;
}

function showShipDetails(shipId) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    const ship = SHIP_CLASSES[shipId];
    const oldShip = SHIP_CLASSES[playerShip.shipClass];
    const isCurrent = playerShip.shipClass === shipId;
    
    // 1. Calculate Trade-in Values
    let baseTradeIn = Math.floor(oldShip.baseCost * 0.5);
    let componentsRefund = 0;
    for (const slot in playerShip.components) {
        const compId = playerShip.components[slot];
        const compData = COMPONENTS_DATABASE[compId];
        if (compData && compData.cost > 0) {
            componentsRefund += Math.floor(compData.cost * 0.5);
        }
    }
    
    const tradeIn = baseTradeIn + componentsRefund;
    const netCost = isCurrent ? 0 : ship.baseCost - tradeIn;

    // 2. The Hologram Effect!
    const hologramHtml = ship.image 
        ? `<img src="${ship.image}" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;" onerror="this.src='assets/outpost.png'">` 
        : `<div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; filter: hue-rotate(180deg);">🚀</div>`;

    // 3. Stat Deltas (Green Arrows for upgrades, Red for downgrades)
    const formatDelta = (newVal, oldVal) => {
        if (isCurrent || newVal === oldVal) return `<span style="color:var(--text-color); font-weight:bold;">${newVal}</span>`;
        if (newVal > oldVal) return `<span style="color:var(--success); font-weight:bold;">${newVal} ▲</span>`;
        if (newVal < oldVal) return `<span style="color:var(--danger); font-weight:bold;">${newVal} ▼</span>`;
        return `<span style="color:var(--text-color); font-weight:bold;">${newVal}</span>`;
    };

    const oldHull = oldShip.baseHull || 100;
    const newHull = ship.baseHull || 100;
    const oldCargo = oldShip.cargoCapacity || 50;
    const newCargo = ship.cargoCapacity || 50;
    const oldEvasion = oldShip.baseEvasion || 0;
    const newEvasion = ship.baseEvasion || 0;

    // 4. Render Right Pane
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:5px;">
                ${isCurrent ? 'CURRENTLY EQUIPPED' : 'CHASSIS SELECTED'}
            </div>
            <h3 style="color:var(--item-name-color); margin:0 0 15px 0; letter-spacing: 1px;">${ship.name.toUpperCase()}</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 20px;">
                ${hologramHtml}
            </div>

            <p style="color:var(--text-color); font-size:12px; line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${isCurrent ? '#666' : 'var(--accent-color)'}; margin-bottom:20px; text-align:left;">
                "${ship.description}"
            </p>

            <div class="trade-math-area" style="text-align:left;">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">CHASSIS TELEMETRY</div>
                <div class="trade-stat-row"><span>Base Max Hull:</span> ${formatDelta(newHull, oldHull)}</div>
                <div class="trade-stat-row"><span>Cargo Bay Limit:</span> ${formatDelta(newCargo, oldCargo)} Units</div>
                <div class="trade-stat-row"><span>Base Evasion:</span> ${formatDelta((newEvasion * 100).toFixed(0) + '%', (oldEvasion * 100).toFixed(0) + '%')}</div>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; border: 1px solid var(--border-color); background: rgba(0,224,224,0.05); text-align:left;">
                <span style="font-size:10px; color:var(--accent-color); letter-spacing:1px; display:block; margin-bottom:5px;">COMBAT PROTOCOL</span>
                <span style="font-weight:bold; color:var(--text-color); font-size:12px;">${ship.ability.name}:</span>
                <span style="font-size:12px; color:var(--item-desc-color);">${ship.ability.desc}</span>
            </div>

            ${!isCurrent ? `
                <div class="trade-math-area" style="margin-top:15px; text-align:left; background:rgba(0,0,0,0.5);">
                    <div class="trade-stat-row"><span>Sticker Price:</span> <span>${formatNumber(ship.baseCost)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Hull Trade-in:</span> <span>-${formatNumber(baseTradeIn)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Parts Trade-in:</span> <span>-${formatNumber(componentsRefund)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                        <span>Net Cost:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(netCost)}c</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // 5. Actions Pane
    if (isCurrent) {
        actionsEl.innerHTML = `<button class="action-button" onclick="displayShipyard()">BACK TO MANIFEST</button>`;
    } else {
        const cargoTooLarge = typeof currentCargoLoad !== 'undefined' && currentCargoLoad > ship.cargoCapacity;
        const canAfford = playerCredits >= netCost;
        
        let btnLabel = `AUTHORIZE TRANSFER (${formatNumber(netCost)}c)`;
        let isDisabled = false;

        if (!canAfford) {
            btnLabel = 'INSUFFICIENT FUNDS';
            isDisabled = true;
        } else if (cargoTooLarge) {
            btnLabel = 'CARGO EXCEEDS NEW HOLD';
            isDisabled = true;
        }

        actionsEl.innerHTML = `
            <button class="action-button" style="${isDisabled ? '' : 'border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2);'}" 
                ${isDisabled ? 'disabled' : ''} onclick="confirmBuyShip('${shipId}', ${netCost}, ${componentsRefund})">
                ${btnLabel}
            </button>
            <button class="action-button" onclick="displayShipyard()">CANCEL</button>
        `;
    }
}

function confirmBuyShip(shipId, netCost, componentsRefund = 0) {
    const newShip = SHIP_CLASSES[shipId];
    
    // Safety blocks
    if (playerCredits < netCost) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        return;
    }
    if (typeof currentCargoLoad !== 'undefined' && currentCargoLoad > newShip.cargoCapacity) {
        if (typeof showToast === 'function') showToast("CARGO EXCEEDS NEW SHIP CAPACITY", "error");
        return;
    }

    // Execute Transaction
    playerCredits -= netCost;
    playerShip.shipClass = shipId;

    // Reset components to defaults (Stripped Chassis)
    playerShip.components = {
        weapon: "WEAPON_PULSE_LASER_MK1",
        shield: "SHIELD_BASIC_ARRAY_A",
        engine: "ENGINE_STD_DRIVE_MK1",
        scanner: "SCANNER_BASIC_SUITE",
        utility: "UTIL_NONE"
    };

    // This ensures no "ghost" ammo counters from previous weapons bloat the save file
    playerShip.ammo = {};

    // Initialize Ammo
    const defaultWeapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    if (defaultWeapon && defaultWeapon.stats.maxAmmo) {
        playerShip.ammo[playerShip.components.weapon] = defaultWeapon.stats.maxAmmo;
    }

    applyPlayerShipStats();

    playerHull = typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100; 
    playerShields = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50; 
    playerFuel = typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220; 

    // Log & UI Updates
    logMessage(`Transaction complete! Welcome to your new <span style="color:var(--accent-color); font-weight:bold;">${newShip.name}</span>!`);
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("VESSEL COMMISSIONED", "success");
    
    closeGenericModal();
    openStationView(); // Refresh station hub
    if (typeof renderUIStats === 'function') renderUIStats();
}

// ==========================================
// --- ENGINEERING BAY (OUTFITTING UI) ---
// ==========================================

function displayOutfittingScreen() {
    openGenericModal("ENGINEERING BAY");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">SYSTEM SLOTS</div>`;

    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
    
    // 1. Build the Left Pane (The Slots)
    slots.forEach(slot => {
        const currentId = playerShip.components[slot];
        const compData = COMPONENTS_DATABASE[currentId];
        const currentName = compData ? compData.name : "Empty Slot";
        const mfg = compData && compData.manufacturer ? compData.manufacturer : "Standard";
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; gap: 4px;">
                <span style="color:var(--accent-color); font-weight:bold; text-transform:uppercase;">${slot}</span> 
                <span style="color:var(--text-color); font-size:11px;">${currentName} <span style="color:#666; font-size:9px;">[${mfg}]</span></span>
            </div>
            <div style="color:var(--item-desc-color); font-size:16px;">▶</div>
        `;
        row.onclick = () => showOutfittingOptions(slot);
        listEl.appendChild(row);
    });

    // 2. Build the Right Pane (The Holographic Blueprint)
    const shipImage = SHIP_CLASSES[playerShip.shipClass].image;
    
    // We use pure CSS filters here to turn your standard PNG ship image into a glowing cyan hologram!
    const hologramHtml = shipImage 
        ? `<img src="${shipImage}" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">` 
        : `<div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6;">🚀</div>`;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <h3 style="color:var(--accent-color); margin-bottom:20px; letter-spacing: 2px;">${SHIP_CLASSES[playerShip.shipClass].name.toUpperCase()} CHASSIS</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 25px;">
                ${hologramHtml}
            </div>

            <div class="trade-math-area" style="text-align:left; background: rgba(0,0,0,0.3);">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:4px;">SYSTEM DIAGNOSTICS</div>
                <div class="trade-stat-row"><span>Hull Integrity:</span> <span style="color:var(--success); font-weight:bold;">${playerHull} / ${MAX_PLAYER_HULL}</span></div>
                <div class="trade-stat-row"><span>Shield Emitters:</span> <span style="color:var(--accent-color); font-weight:bold;">${MAX_SHIELDS}</span></div>
                <div class="trade-stat-row"><span>Cargo Capacity:</span> <span style="color:var(--gold-text); font-weight:bold;">${PLAYER_CARGO_CAPACITY} Units</span></div>
                <div class="trade-stat-row"><span>Evasion Rating:</span> <span style="color:#9933FF; font-weight:bold;">${typeof PLAYER_EVASION !== 'undefined' ? (PLAYER_EVASION * 100).toFixed(0) : 0}%</span></div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="openStationView()">RETURN TO CONCOURSE</button>`;
}

function showOutfittingOptions(slot) {
    const listEl = document.getElementById('genericModalList');
    
    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">${slot.toUpperCase()} INVENTORY</div>`;
    
    let hasUpgrades = false;

    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        
        // Faction Lock Check
        if (comp.reqFaction) {
             const standing = playerFactionStanding[comp.reqFaction] || 0;
             if (standing < comp.minRep) continue; 
        }
        
        // Only show items that fit this slot AND aren't currently equipped
        if (comp.slot === slot && playerShip.components[slot] !== compId) {
            hasUpgrades = true;
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:var(--text-color); font-weight:bold; font-size:12px;">${comp.name}</span>
                    <span style="color:var(--gold-text); font-size:10px;">${formatNumber(comp.cost)}c</span>
                </div>
            `;
            row.onclick = () => renderComponentComparison(compId, slot);
            listEl.appendChild(row);
        }
    }
    
    if (!hasUpgrades) {
        listEl.innerHTML += `<div style="padding:15px; color:#666; font-size:11px; font-style:italic;">No compatible upgrades detected in local station inventory.</div>`;
    }
    
    // Instantly render the currently equipped item in the right pane for reference!
    renderComponentComparison(playerShip.components[slot], slot, true);
}

function renderComponentComparison(compId, slot, isEquipped = false) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    const selectedComp = COMPONENTS_DATABASE[compId] || { name: "Empty", stats: {}, description: "No component installed.", cost: 0 };
    const currentCompId = playerShip.components[slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId] || { name: "Empty", stats: {}, cost: 0 };

    const mfg = selectedComp.manufacturer || "Standard";
    
    // Trade-in Math
    const tradeInValue = isEquipped ? 0 : Math.floor((currentComp.cost || 0) * 0.5);
    const netCost = isEquipped ? 0 : (selectedComp.cost || 0) - tradeInValue;

    // --- DYNAMIC STAT COMPARISON BUILDER ---
    let statsHtml = '';
    // Collect all unique stat keys from BOTH components so we don't miss any drops
    const allStats = new Set([...Object.keys(selectedComp.stats), ...Object.keys(currentComp.stats)]);
    
    allStats.forEach(statName => {
        const newVal = selectedComp.stats[statName] || 0;
        const oldVal = currentComp.stats[statName] || 0;
        
        if (newVal === 0 && oldVal === 0) return; // Skip irrelevant stats

        let color = "var(--text-color)";
        let diffArrow = "";
        
        if (!isEquipped) {
            if (newVal > oldVal) { color = "var(--success)"; diffArrow = "▲"; }
            else if (newVal < oldVal) { color = "var(--danger)"; diffArrow = "▼"; }
        }
        
        // Format the camelCase stat name into Title Case
        const formattedName = statName.replace(/([A-Z])/g, ' $1').trim();
        
        statsHtml += `<div class="trade-stat-row">
            <span style="text-transform:capitalize;">${formattedName}:</span> 
            <span style="color:${color}; font-weight:bold;">${newVal} ${diffArrow}</span>
        </div>`;
    });
    
    if (!statsHtml) statsHtml = `<div style="color:#666; font-size:11px; font-style:italic;">No measurable stat changes.</div>`;

    // --- RENDER THE PANE ---
    detailEl.innerHTML = `
        <div style="padding: 20px;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:5px;">
                ${isEquipped ? 'CURRENTLY EQUIPPED' : 'UPGRADE SELECTED'}
            </div>
            
            <h3 style="color:var(--item-name-color); margin:0 0 5px 0;">${selectedComp.name.toUpperCase()}</h3>
            
            <div style="display:inline-block; background:rgba(255,255,255,0.1); color:var(--item-desc-color); padding:2px 6px; border-radius:2px; font-size:9px; letter-spacing:1px; margin-bottom: 15px;">
                MFG: ${mfg}
            </div>
            
            <p style="color:var(--text-color); font-size:12px; line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${isEquipped ? '#666' : 'var(--accent-color)'}; margin-bottom:20px;">
                "${selectedComp.description}"
            </p>

            <div class="trade-math-area">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">TELEMETRY DELTAS</div>
                ${statsHtml}
            </div>
            
            ${!isEquipped ? `
                <div class="trade-math-area" style="margin-top:15px; background:rgba(0,0,0,0.5);">
                    <div class="trade-stat-row"><span>Base Cost:</span> <span>${formatNumber(selectedComp.cost || 0)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Trade-in (${currentComp.name}):</span> <span>-${formatNumber(tradeInValue)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                        <span>Net Cost:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(netCost)}c</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // --- RENDER ACTIONS ---
    if (isEquipped) {
        actionsEl.innerHTML = `<button class="action-button" onclick="displayOutfittingScreen()">BACK TO SLOTS</button>`;
    } else {
        const canAfford = playerCredits >= netCost;
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" 
                ${!canAfford ? 'disabled' : ''} onclick="confirmBuyComponent('${compId}')">
                ${canAfford ? 'AUTHORIZE INSTALL' : 'INSUFFICIENT FUNDS'}
            </button>
            <button class="action-button" onclick="displayOutfittingScreen()">CANCEL</button>
        `;
    }
}

function confirmBuyComponent(compId) {
    const newComp = COMPONENTS_DATABASE[compId];
    const currentCompId = playerShip.components[newComp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];
    
    const tradeInValue = currentComp ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = newComp.cost - tradeInValue;

    if(playerCredits < netCost) {
        if (typeof showToast === 'function') showToast(`Insufficient Funds!`, "error");
        return;
    }
    
    playerCredits -= netCost;
    playerShip.components[newComp.slot] = compId;
    
    // Swap ammo tracking safely
    if (newComp.stats && newComp.stats.maxAmmo) {
        playerShip.ammo[compId] = newComp.stats.maxAmmo;
    }
    if (currentCompId !== compId && playerShip.ammo[currentCompId]) {
        delete playerShip.ammo[currentCompId]; 
    }

    applyPlayerShipStats();
    
    let msg = `Installed ${newComp.name}.`;
    if (netCost < 0) {
        const refund = Math.abs(netCost);
        msg += `<br><span style="font-size:11px; color:var(--success);">(Salvage Refund: +${formatNumber(refund)}c)</span>`;
    } else if (tradeInValue > 0) {
        msg += `<br><span style="font-size:11px; color:var(--item-desc-color);">(Traded in ${currentComp.name} for ${formatNumber(tradeInValue)}c)</span>`;
    }
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(msg, "success");
    
    // Return to the main engineering screen so they can pick another slot!
    displayOutfittingScreen(); 
    if (typeof renderUIStats === 'function') renderUIStats();
}

 function displayComponentsForSlot(slotType) {
     currentOutfitContext.step = 'selectComponent';
     currentOutfitContext.selectedSlot = slotType;
     let componentMsg = `--- Upgrading ${slotType.toUpperCase()} ---\nAvailable components (Cr: ${playerCredits}):\n`;
     let componentIndex = 1;
     currentOutfitContext.availableComponents = [];
     for (const compId in COMPONENTS_DATABASE) {
         const comp = COMPONENTS_DATABASE[compId];
         if (comp.slot === slotType && playerShip.components[slotType] !== compId) {
             componentMsg += `${componentIndex}. ${comp.name} (${comp.cost}c) - ${comp.description}\n`;
             componentMsg += `   Stats: `;
             let statsStr = [];
             for (const stat in comp.stats) {
                 statsStr.push(`${stat}: ${comp.stats[stat]}`);
             }
             componentMsg += statsStr.join(', ') + "\n";
             currentOutfitContext.availableComponents.push({
                 id: compId,
                 ...comp
             }); // Store ID with component
             componentIndex++;
         }
     }
     if (currentOutfitContext.availableComponents.length === 0) {
         componentMsg += "No other upgrades currently available for this slot.\n";
     }
     componentMsg += "Enter # to purchase, or 'L' to go back.";
     logMessage(componentMsg);
 }

 function buyComponent(selectedComponentId) {
     const component = COMPONENTS_DATABASE[selectedComponentId];
     if (!component) {
         logMessage("Invalid component selection.");
         displayComponentsForSlot(currentOutfitContext.selectedSlot);
         return;
     }
     if (playerCredits < component.cost) {
         logMessage("Not enough credits to purchase " + component.name + ".", true);
         displayComponentsForSlot(currentOutfitContext.selectedSlot);
         return;
     }
     const oldComponent = COMPONENTS_DATABASE[playerShip.components[component.slot]];
     playerCredits -= component.cost;
     playerShip.components[component.slot] = selectedComponentId;

     // --- Initialize Ammo for the new weapon ---
     if (component.stats && component.stats.maxAmmo) {
         playerShip.ammo[selectedComponentId] = component.stats.maxAmmo;
     }

     applyPlayerShipStats();

     unlockLoreEntry(component.loreKey);
     logMessage(`Installed ${component.name}. Old ${oldComponent.name} unequipped.\nCredits: ${playerCredits}`);
     currentOutfitContext = null;
     handleInteraction();
 }

  /**
  * Handles the logic for repairing the player's ship hull at a station.
  */

function repairShip() {
    let repaired = false;
    let rearmed = false;

    // 1. REARM WEAPONS FIRST
    const weaponId = playerShip.components.weapon;
    const weapon = COMPONENTS_DATABASE[weaponId];
    
    if (weapon && weapon.stats && weapon.stats.maxAmmo) {
        const currentAmmo = playerShip.ammo[weaponId] || 0;
        if (currentAmmo < weapon.stats.maxAmmo) {
            playerShip.ammo[weaponId] = weapon.stats.maxAmmo;
            logMessage("Ordnance magazines reloaded.");
            rearmed = true;
        }
    }

    // 2. REPAIR HULL
    if (playerHull < MAX_PLAYER_HULL) {
        const hullToRepair = MAX_PLAYER_HULL - playerHull;
        const totalCost = Math.ceil(hullToRepair * HULL_REPAIR_COST_PER_POINT);

        if (playerCredits < totalCost) {
            logMessage(`Cannot afford full repairs. Cost: ${totalCost}c.`);
            showToast("INSUFFICIENT FUNDS", "error");
            return;
        }

        playerCredits -= totalCost;
        playerHull = MAX_PLAYER_HULL;
        logMessage(`Ship hull repaired for ${totalCost} credits.`);
        repaired = true;
    }

    // 3. FINAL OUTPUT
    if (repaired || rearmed) {
        showToast(repaired ? "HULL REPAIRED & REARMED" : "WEAPONS RELOADED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        handleInteraction();
        renderUIStats();
    } else {
        logMessage("Hull is at maximum integrity and weapons are fully loaded.");
        showToast("SYSTEMS NOMINAL", "info");
    }
}

// ==========================================
// --- SMART REFUELING LOGIC ---
// ==========================================

function refuelShip() {
    if (playerFuel >= MAX_FUEL) {
        if (typeof showToast === 'function') showToast("TANK ALREADY FULL", "info");
        logMessage("Fuel tanks are already at maximum capacity.");
        return;
    }

    const fuelNeeded = MAX_FUEL - playerFuel;
    const FUEL_PRICE_PER_UNIT = 1; 
    
    // Round the cost up to the nearest whole credit!
    const totalCost = Math.ceil(fuelNeeded * FUEL_PRICE_PER_UNIT);

    // 1. SUCCESS: Player can afford the full tank
    if (playerCredits >= totalCost) {
        playerCredits -= totalCost;
        
        // Safety net: Force credits to remain an integer
        playerCredits = Math.floor(playerCredits); 
        
        playerFuel = MAX_FUEL;
        
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`REFUELED: -${totalCost}c`, "success");
        logMessage(`Ship refueled to maximum capacity for ${totalCost} credits.`);
    } 
    // 2. PARTIAL FILL: Player can't afford a full tank, give them what they can afford
    else {
        const affordableFuel = Math.floor(playerCredits / FUEL_PRICE_PER_UNIT);
        
        if (affordableFuel > 0) {
            const cost = affordableFuel * FUEL_PRICE_PER_UNIT;
            playerCredits -= cost; 
            playerCredits = Math.floor(playerCredits); // Safety net
            playerFuel += affordableFuel; 
            
            if (typeof soundManager !== 'undefined') soundManager.playBuy();
            if (typeof showToast === 'function') showToast(`PARTIAL REFUEL: -${cost}c`, "warning");
            logMessage(`<span style='color:var(--warning)'>Insufficient funds for a full tank. The dockworker filled ${affordableFuel} units for ${cost} credits.</span>`);
        } 
        // 3. COMPLETELY BROKE: Can't even afford 1 unit of fuel
        else {
            if (typeof soundManager !== 'undefined') soundManager.playError();
            if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
            logMessage("<span style='color:var(--danger)'>You don't have enough credits to buy even a single drop of fuel.</span>");
        }
    }

    // Refresh the UI to show the new fuel level and credit balance
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

function applyPlayerShipStats() {
    const shipClassData = SHIP_CLASSES[playerShip.shipClass];
    
    // 1. Get Base Stats
    let calculatedMaxHull = shipClassData.baseHull || 100;
    let calculatedMaxCargo = shipClassData.cargoCapacity || 50;
    let calculatedEvasion = shipClassData.baseEvasion || 0; 
    let calculatedSignature = shipClassData.baseSignature || 1.0; // 🚨 NEW: Base Radar Signature

    // 2. Apply Base Component Stats First
    const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    const shield = COMPONENTS_DATABASE[playerShip.components.shield];
    const engine = COMPONENTS_DATABASE[playerShip.components.engine];

    PLAYER_ATTACK_DAMAGE = weapon.stats.damage || 0;
    PLAYER_HIT_CHANCE = weapon.stats.hitChance || 0;
    
    if (typeof playerPerks !== 'undefined' && playerPerks.has('WEAPON_OVERCLOCK')) {
        PLAYER_ATTACK_DAMAGE = Math.floor(PLAYER_ATTACK_DAMAGE * 1.15);
    }
    
    MAX_SHIELDS = shield.stats.maxShields || 0;
    MAX_FUEL = engine.stats.maxFuel || 0;

    // 3. Check Utility Slot
    const utilityId = playerShip.components.utility || "UTIL_NONE";
    const utility = COMPONENTS_DATABASE[utilityId];

    if (utility && utility.stats) {
        if (utility.stats.hullBonus) calculatedMaxHull += utility.stats.hullBonus;
        if (utility.stats.cargoBonus) calculatedMaxCargo += utility.stats.cargoBonus;
        if (utility.stats.shieldBonus) MAX_SHIELDS += utility.stats.shieldBonus;
        
        // 🚨 NEW: Check if the utility module reduces signature (e.g. Smuggler's Hold)
        if (utility.stats.signatureMod) calculatedSignature += utility.stats.signatureMod; 
    }

    // --- 4. APPLY CREW & MERCENARY BONUSES ---
    if (typeof playerCrew !== 'undefined' && playerCrew.length > 0) {
        playerCrew.forEach(crew => {
            // Apply Eclipse Mercenary raw stats
            if (crew.stats) {
                if (crew.stats.hullBonus) calculatedMaxHull += crew.stats.hullBonus;
                if (crew.stats.damageBonus) PLAYER_ATTACK_DAMAGE += crew.stats.damageBonus;
                if (crew.stats.evasionBonus) calculatedEvasion += crew.stats.evasionBonus;
            }
            
            // Apply Standard Crew COMBAT perk
            if (crew.perk === "COMBAT_DAMAGE") {
                PLAYER_ATTACK_DAMAGE = Math.floor(PLAYER_ATTACK_DAMAGE * 1.15);
            }
        });
    }

    // 5. Apply Final Calculations to Globals
    MAX_PLAYER_HULL = calculatedMaxHull;
    PLAYER_CARGO_CAPACITY = calculatedMaxCargo;
    PLAYER_EVASION = calculatedEvasion; 
    
    // 🚨 NEW: Export the final signature globally (capping it so it can never drop below 10%)
    window.PLAYER_SIGNATURE = Math.max(0.1, calculatedSignature); 

    // --- 6. APPLY SYNERGIES (SET BONUSES) ---
    if (typeof SYNERGIES_DATABASE !== 'undefined') {
        activeSynergy = null;
        const mfgCounts = {};
        const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
        
        slots.forEach(slot => {
            const comp = COMPONENTS_DATABASE[playerShip.components[slot]];
            if (comp && comp.manufacturer) {
                mfgCounts[comp.manufacturer] = (mfgCounts[comp.manufacturer] || 0) + 1;
            }
        });

        for (const mfg in mfgCounts) {
            if (mfgCounts[mfg] >= 3 && SYNERGIES_DATABASE[mfg]) {
                activeSynergy = SYNERGIES_DATABASE[mfg];
                activeSynergy.effect(); // Apply the raw stat boosts
                break; 
            }
        }
    }

    // 7. Cap Vitals
    if (playerHull > MAX_PLAYER_HULL) playerHull = MAX_PLAYER_HULL;
    if (playerShields > MAX_SHIELDS) playerShields = MAX_SHIELDS;
    if (playerFuel > MAX_FUEL) playerFuel = MAX_FUEL;

    // --- TELL THE BUS WE CHANGED MAX STATS ---
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}
