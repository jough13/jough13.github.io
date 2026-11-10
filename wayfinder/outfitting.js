// --- START OF FILE outfitting.js ---

// ==========================================
// --- SHIPYARD UI & PURCHASING LOGIC ---
// ==========================================

function displayShipyard() {
    // 1. Get the current station to make the UI dynamic!
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    let stationName = location ? location.name.toUpperCase() : "STARBASE";
    let faction = location ? location.faction : "INDEPENDENT";
    
    // 2. Set dynamic branding colors based on who owns the station
    let brandColor = "var(--accent-color)";
    if (faction === 'CONCORD') brandColor = "#4488FF";
    else if (faction === 'ECLIPSE') brandColor = "#9933FF";
    else if (faction === 'KTHARR') brandColor = "var(--danger)";
    else brandColor = "var(--success)";

    openGenericModal(`${stationName} : SHIPYARD`);
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `<div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">CHASSIS MANIFEST</div>`;
    
    // --- THE DYNAMIC CINEMATIC HEADER ---
    const headerHtml = `
        <div style="width: 100%; height: 180px; background: url('assets/shipyard_banner.png') center/cover; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 20px; box-shadow: 0 0 25px ${brandColor}44;">
        </div>
        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">${stationName} YARDS</h3>
    `;

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
                    <div style="text-align:center; padding: 0 20px 20px 20px;">
                        ${headerHtml}
                        <div style="background: rgba(255,0,0,0.1); border: 1px solid var(--danger); padding: 15px; border-radius: 4px; margin-top: 15px; text-align: left;">
                            <div style="color:var(--danger); font-weight:bold; letter-spacing: 1px; border-bottom: 1px solid var(--danger); padding-bottom: 5px; margin-bottom: 8px;">ACCESS DENIED</div>
                            <p style="color:var(--item-desc-color); font-size:12px; margin:0; line-height: 1.5;">You lack the necessary <span style="color:var(--text-color); font-weight:bold;">${ship.reqFaction}</span> faction standing to purchase this chassis. Gain reputation by completing local contracts.</p>
                        </div>
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
        <div style="text-align:center; padding: 0 20px 20px 20px;">
            ${headerHtml}
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Browse available chassis frames. Purchasing a new vessel will trade in your current hull and subsystems for a 50% credit refund, and equip the new vessel with standard Mk1 systems. Cargo and crew are safely transferred.
            </p>
            <div style="margin-top: 20px; font-size: 14px; color: var(--gold-text); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                Available Funds: <b>${formatNumber(playerCredits)}c</b>
            </div>
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

    // 2. The Hologram Effect! (Updated with safe fallbacks)
    const hologramHtml = ship.image 
        ? `<img src="${ship.image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">
           <div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; filter: hue-rotate(180deg); display:none;">🚀</div>`
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
        // Calculate new cargo capacity purely off the chassis (since they lose their utility slot)
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

function openOutfittingUI() {
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
        ? `<img src="${shipImage}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">
           <div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; display:none;">🚀</div>`
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
    listEl.innerHTML = '';
    
    let storeHtml = '';
    let cargoHtml = '';
    
    // 1. Check Cargo for Equippable Items (Prototypes, Crafted, Looted)
    for (const itemId in playerCargo) {
        if (playerCargo[itemId] > 0 && COMPONENTS_DATABASE[itemId] && COMPONENTS_DATABASE[itemId].slot === slot) {
            const comp = COMPONENTS_DATABASE[itemId];
            if (playerShip.components[slot] === itemId) continue; // Skip if already somehow equipped
            
            cargoHtml += `
                <div class="trade-item-row" style="cursor:pointer; background:rgba(0, 224, 224, 0.05); border-left: 3px solid var(--accent-color);" onclick="renderComponentComparison('${itemId}', '${slot}', false, true)">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:var(--accent-color); font-weight:bold; font-size:12px;">📦 ${comp.name}</span>
                        <span style="color:var(--success); font-size:10px; font-weight:bold;">IN CARGO</span>
                    </div>
                </div>
            `;
        }
    }
    
    // 2. Check Store for Buyable Items
    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        
        // Skip unfathomably expensive (boss loot), free/default items, or procedurally generated items
        if (comp.cost === 0 || comp.cost >= 999999 || compId.match(/_\d+$/)) continue;
        
        // Faction Lock Check
        if (comp.reqFaction) {
             const standing = playerFactionStanding[comp.reqFaction] || 0;
             if (standing < comp.minRep) continue; 
        }

        if (comp.slot === slot && playerShip.components[slot] !== compId) {
            storeHtml += `
                <div class="trade-item-row" style="cursor:pointer;" onclick="renderComponentComparison('${compId}', '${slot}', false, false)">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:var(--text-color); font-weight:bold; font-size:12px;">${comp.name}</span>
                        <span style="color:var(--gold-text); font-size:10px;">${formatNumber(comp.cost)}c</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Render the Headers and HTML chunks
    if (cargoHtml) {
        listEl.innerHTML += `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:5px; border-bottom:1px solid #333;">AVAILABLE IN CARGO</div>${cargoHtml}`;
    }
    
    listEl.innerHTML += `<div class="trade-list-header" style="color:var(--gold-text); font-size:10px; letter-spacing:2px; margin-top:10px; margin-bottom:5px; border-bottom:1px solid #333;">STATION MARKETPLACE</div>`;
    
    if (!storeHtml) {
        listEl.innerHTML += `<div style="padding:15px; color:#666; font-size:11px; font-style:italic;">No compatible upgrades detected in local station inventory.</div>`;
    } else {
        listEl.innerHTML += storeHtml;
    }
    
    // Instantly render the currently equipped item in the right pane for reference
    renderComponentComparison(playerShip.components[slot], slot, true, false);
}

function renderComponentComparison(compId, slot, isEquipped = false, isOwned = false) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    const selectedComp = COMPONENTS_DATABASE[compId] || { name: "Empty", stats: {}, description: "No component installed.", cost: 0 };
    const currentCompId = playerShip.components[slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId] || { name: "Empty", stats: {}, cost: 0 };

    const mfg = selectedComp.manufacturer || "Standard";
    
    // Trade-in Math
    const tradeInValue = isEquipped ? 0 : Math.floor((currentComp.cost || 0) * 0.5);
    const netCost = (isEquipped || isOwned) ? 0 : (selectedComp.cost || 0) - tradeInValue;

    // --- DYNAMIC STAT COMPARISON BUILDER ---
    let statsHtml = '';
    const allStats = new Set([...Object.keys(selectedComp.stats), ...Object.keys(currentComp.stats)]);
    
    const percentageStats = ['hitChance', 'critChance', 'evasionBonus', 'accuracyBonus', 'scanBonus', 'signatureMod', 'fuelEfficiency'];
    
    allStats.forEach(statName => {
        let newVal = selectedComp.stats[statName] || 0;
        let oldVal = currentComp.stats[statName] || 0;
        
        if (newVal === 0 && oldVal === 0) return; // Skip irrelevant stats
        
        // Format Percentages
        let displayNew = percentageStats.includes(statName) ? `${newVal > 0 ? '+' : ''}${(newVal * 100).toFixed(0)}%` : newVal;
        
        let color = "var(--text-color)";
        let diffArrow = "";
        
        if (!isEquipped) {
            // Lower is better for these specific stats
            const reverseLogic = statName === 'signatureMod' || statName === 'fuelEfficiency';
            
            if (newVal > oldVal) { 
                color = reverseLogic ? "var(--danger)" : "var(--success)"; 
                diffArrow = "▲"; 
            }
            else if (newVal < oldVal) { 
                color = reverseLogic ? "var(--success)" : "var(--danger)"; 
                diffArrow = "▼"; 
            }
        }
        
        // Format the camelCase stat name into Title Case
        const formattedName = statName.replace(/([A-Z])/g, ' $1').trim();
        
        statsHtml += `<div class="trade-stat-row">
            <span style="text-transform:capitalize;">${formattedName}:</span> 
            <span style="color:${color}; font-weight:bold;">${displayNew} ${diffArrow}</span>
        </div>`;
    });
    
    if (!statsHtml) statsHtml = `<div style="color:#666; font-size:11px; font-style:italic;">No measurable stat changes.</div>`;

    // --- RENDER THE PANE ---
    detailEl.innerHTML = `
        <div style="padding: 20px;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:5px;">
                ${isEquipped ? 'CURRENTLY EQUIPPED' : (isOwned ? 'SELECT FROM CARGO' : 'UPGRADE SELECTED')}
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
            
            ${(!isEquipped && !isOwned) ? `
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
        actionsEl.innerHTML = `<button class="action-button" onclick="openOutfittingUI()">BACK TO SLOTS</button>`;
    } else if (isOwned) {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" 
                onclick="confirmBuyComponent('${compId}', true)">
                INSTALL FROM CARGO
            </button>
            <button class="action-button" onclick="openOutfittingUI()">CANCEL</button>
        `;
    } else {
        const canAfford = playerCredits >= netCost;
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" 
                ${!canAfford ? 'disabled' : ''} onclick="confirmBuyComponent('${compId}', false)">
                ${canAfford ? 'AUTHORIZE INSTALL' : 'INSUFFICIENT FUNDS'}
            </button>
            <button class="action-button" onclick="openOutfittingUI()">CANCEL</button>
        `;
    }
}

function confirmBuyComponent(compId, isOwned = false) {
    const newComp = COMPONENTS_DATABASE[compId];
    const currentCompId = playerShip.components[newComp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];
    
    const tradeInValue = currentComp ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = isOwned ? 0 : newComp.cost - tradeInValue;

    if(!isOwned && playerCredits < netCost) {
        if (typeof showToast === 'function') showToast(`Insufficient Funds!`, "error");
        return;
    }
    
    if (!isOwned) {
        playerCredits -= netCost;
    } else {
        // Remove the new component from cargo
        playerCargo[compId]--;
        if (playerCargo[compId] <= 0) delete playerCargo[compId];
        
        // Pack the old component into cargo (if it's not a free Mk1)
        if (currentComp && currentComp.cost > 0) {
            playerCargo[currentCompId] = (playerCargo[currentCompId] || 0) + 1;
        }
    }
    
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
    if (isOwned) {
        if (currentComp && currentComp.cost > 0) {
            msg += `<br><span style="font-size:11px; color:var(--success);">(Stowed ${currentComp.name} in Cargo Hold)</span>`;
        }
    } else {
        if (netCost < 0) {
            const refund = Math.abs(netCost);
            msg += `<br><span style="font-size:11px; color:var(--success);">(Salvage Refund: +${formatNumber(refund)}c)</span>`;
        } else if (tradeInValue > 0) {
            msg += `<br><span style="font-size:11px; color:var(--item-desc-color);">(Traded in ${currentComp.name} for ${formatNumber(tradeInValue)}c)</span>`;
        }
    }
    
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(msg, "success");
    
    openOutfittingUI(); 
    if (typeof renderUIStats === 'function') renderUIStats();
}

// --- REPAIR & REFUEL ---

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

// --- CENTRALIZED STAT CALCULATION ENGINE ---
function applyPlayerShipStats() {
    const shipClassData = SHIP_CLASSES[playerShip.shipClass];
    
    // 1. Base Chassis Stats
    let calcHull = shipClassData.baseHull || 100;
    let calcCargo = shipClassData.cargoCapacity || 50;
    let calcEvasion = shipClassData.baseEvasion || 0; 
    let calcSignature = shipClassData.baseSignature || 1.0; 

    let calcShields = 0;
    let calcFuel = 0;
    let calcDmg = 0;
    let calcHit = 0;
    
    let totalDmgBonus = 0;
    let totalEvasionBonus = 0;
    let totalHitBonus = 0;
    let fuelEfficiencyMult = 1.0;

    // 2. Aggregate Base & Bonus Stats from Components
    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
    slots.forEach(slot => {
        const compId = playerShip.components[slot];
        const comp = COMPONENTS_DATABASE[compId];
        if (comp && comp.stats) {
            // Base Definitions
            if (slot === 'weapon') {
                calcDmg = comp.stats.damage || 0;
                calcHit = comp.stats.hitChance || 0;
            }
            if (slot === 'shield') calcShields = comp.stats.maxShields || 0;
            if (slot === 'engine') calcFuel = comp.stats.maxFuel || 0;
            
            // Universal Bonuses (can roll on ANY item due to procedural loot)
            if (comp.stats.hullBonus) calcHull += comp.stats.hullBonus;
            if (comp.stats.cargoBonus) calcCargo += comp.stats.cargoBonus;
            if (comp.stats.shieldBonus) calcShields += comp.stats.shieldBonus;
            if (comp.stats.signatureMod) calcSignature += comp.stats.signatureMod;
            if (comp.stats.damageBonus) totalDmgBonus += comp.stats.damageBonus;
            if (comp.stats.evasionBonus) totalEvasionBonus += comp.stats.evasionBonus;
            if (comp.stats.accuracyBonus) totalHitBonus += comp.stats.accuracyBonus;
            if (comp.stats.fuelEfficiency) fuelEfficiencyMult *= comp.stats.fuelEfficiency;
        }
    });

    PLAYER_ATTACK_DAMAGE = calcDmg + totalDmgBonus;
    PLAYER_HIT_CHANCE = calcHit + totalHitBonus;
    calcEvasion += totalEvasionBonus;

    // 3. Apply Perks (Player)
    if (typeof playerPerks !== 'undefined' && playerPerks.has('WEAPON_OVERCLOCK')) {
        PLAYER_ATTACK_DAMAGE = Math.floor(PLAYER_ATTACK_DAMAGE * 1.15);
    }
    
    // 4. Apply Crew & Mercenary Bonuses
    if (typeof playerCrew !== 'undefined' && playerCrew.length > 0) {
        window.hasEclipseMerc = false;
        playerCrew.forEach(crew => {
            if (crew.stats) {
                if (crew.stats.hullBonus) calcHull += crew.stats.hullBonus;
                if (crew.stats.damageBonus) PLAYER_ATTACK_DAMAGE += crew.stats.damageBonus;
                if (crew.stats.evasionBonus) calcEvasion += crew.stats.evasionBonus;
            }
            if (crew.perk === "COMBAT_DAMAGE") {
                PLAYER_ATTACK_DAMAGE = Math.floor(PLAYER_ATTACK_DAMAGE * 1.15);
            }
            if (crew.perk === "SHIELD_BOOST") {
                calcShields = Math.floor(calcShields * 1.25);
            }
        });
    }

    // 5. Apply Crafting Synthesis Bonuses
    if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas['CRAFTING_BONUSES']) {
        const bonuses = worldStateDeltas['CRAFTING_BONUSES'];
        calcHull += bonuses.hull || 0;
        calcShields += bonuses.shields || 0;
        calcFuel += bonuses.fuel || 0;
        PLAYER_ATTACK_DAMAGE += bonuses.damage || 0;
    }

    // 6. Apply Codex Mastery Bonuses
    if (typeof LORE_DATABASE !== 'undefined') {
        const categories = {};
        for (const key in LORE_DATABASE) {
            const cat = LORE_DATABASE[key].category;
            if (!categories[cat]) categories[cat] = { total: 0, unlocked: 0 };
            categories[cat].total++;
            if (LORE_DATABASE[key].unlocked) categories[cat].unlocked++;
        }
        for (const cat in categories) {
            if (categories[cat].total > 0 && categories[cat].unlocked === categories[cat].total) {
                if (cat === "Starships") calcHull += 5;
                else if (cat === "Phenomena") calcFuel += 10;
                else if (cat === "Locations") calcEvasion += 0.02; 
                else if (cat === "Factions") calcShields += 5;
                else calcCargo += 2; 
            }
        }
    }

    // 7. Final Output to Globals
    MAX_PLAYER_HULL = calcHull;
    PLAYER_CARGO_CAPACITY = calcCargo;
    MAX_SHIELDS = calcShields;
    
    // Apply efficiency multiplier to base engine fuel, then set global
    MAX_FUEL = Math.floor(calcFuel * fuelEfficiencyMult);
    
    PLAYER_EVASION = calcEvasion; 
    window.PLAYER_SIGNATURE = Math.max(0.1, calcSignature); 

    // 8. Apply Synergies (SET BONUSES)
    if (typeof SYNERGIES_DATABASE !== 'undefined') {
        activeSynergy = null;
        const mfgCounts = {};
        
        slots.forEach(slot => {
            const comp = COMPONENTS_DATABASE[playerShip.components[slot]];
            if (comp && comp.manufacturer) {
                mfgCounts[comp.manufacturer] = (mfgCounts[comp.manufacturer] || 0) + 1;
            }
        });

        for (const mfg in mfgCounts) {
            if (mfgCounts[mfg] >= 3 && SYNERGIES_DATABASE[mfg]) {
                activeSynergy = SYNERGIES_DATABASE[mfg];
                activeSynergy.effect(); 
                break; 
            }
        }
    }

    // 9. Cap Current Vitals
    if (typeof playerHull !== 'undefined') playerHull = Math.min(playerHull, MAX_PLAYER_HULL);
    if (typeof playerShields !== 'undefined') playerShields = Math.min(playerShields, MAX_SHIELDS);
    if (typeof playerFuel !== 'undefined') playerFuel = Math.min(playerFuel, MAX_FUEL);

    // Tell the Bus
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

// --- END OF FILE outfitting.js ---
