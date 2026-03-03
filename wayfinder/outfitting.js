// ==========================================
// --- SHIPYARD UI & PURCHASING LOGIC ---
// ==========================================

function displayShipyard() {
    openGenericModal("STARBASE SHIPYARD");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    
    // 1. Default Landing Screen
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; text-align:center; margin-bottom:15px; opacity:0.5;">🛠️</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">WELCOME TO THE SHIPYARD</h3>
            <p style="color:var(--item-desc-color); font-size:12px;">Select a hull from the manifest on the left to view its specifications and place an order.</p>
        </div>
    `;
    document.getElementById('genericModalActions').innerHTML = '';

    // 2. Populate the Manifest
    listEl.innerHTML = '';
    
    for (const shipId in SHIP_CLASSES) {
        const ship = SHIP_CLASSES[shipId];
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        
        // --- FACTION LOCK LOGIC ---
        let isLocked = false;
        if (ship.reqFaction) {
            const standing = playerFactionStanding[ship.reqFaction] || 0;
            if (standing < ship.minRep) {
                isLocked = true;
            }
        }

        const isCurrent = playerShip.shipClass === shipId;
        
        if (isLocked) {
            row.style.opacity = '0.4';
            row.innerHTML = `<span style="color:var(--danger); font-weight:bold;">🔒 RESTRICTED CHASSIS</span> <span style="color:var(--text-color); font-size:10px;">${ship.reqFaction} MILITARY</span>`;
            row.onclick = () => {
                detailEl.innerHTML = `<div style="text-align:center; padding:30px;"><div style="font-size:50px; margin-bottom:15px;">🛑</div><h3 style="color:var(--danger);">ACCESS DENIED</h3><p style="color:#888;">Clearance Level Too Low. Requires ${ship.minRep} ${ship.reqFaction} Reputation.</p></div>`;
                document.getElementById('genericModalActions').innerHTML = `<button class="action-button danger-btn" disabled>RESTRICTED</button>`;
                if (typeof soundManager !== 'undefined') soundManager.playError();
            };
        } else {
            const nameColor = isCurrent ? "var(--success)" : "var(--text-color)";
            const costLabel = isCurrent ? "OWNED" : `${formatNumber(ship.baseCost)}c`;
            row.innerHTML = `<span style="color:${nameColor}">${isCurrent ? '▶ ' : ''}${ship.name}</span> <span style="color:var(--gold-text)">${costLabel}</span>`;
            row.onclick = () => showShipDetails(shipId); 
        }
        
        listEl.appendChild(row);
    }
}

function showShipDetails(shipId) {
    const ship = SHIP_CLASSES[shipId];
    const oldShip = SHIP_CLASSES[playerShip.shipClass];
    
    // 1. Calculate Ship Hull Trade-in
    let baseTradeIn = Math.floor(oldShip.baseCost * 0.5);
    
    // 2. Calculate Components Trade-in
    let componentsRefund = 0;
    for (const slot in playerShip.components) {
        const compId = playerShip.components[slot];
        const compData = COMPONENTS_DATABASE[compId];
        if (compData && compData.cost > 0) {
            componentsRefund += Math.floor(compData.cost * 0.5);
        }
    }
    
    const tradeIn = baseTradeIn + componentsRefund;
    const netCost = ship.baseCost - tradeIn;
    
    // 3. Render HTML
    let html = `
        <div style="text-align:center; padding-top: 10px;">
            ${ship.image 
                ? `<img src="${ship.image}" style="width:100%; max-width:200px; height:auto; margin: 0 auto 15px; display:block; border:1px solid var(--accent-color); border-radius:4px; box-shadow: 0 0 15px rgba(0,224,224,0.2);" onerror="this.src='assets/outpost.png'">` 
                : `<div style="font-size:60px; text-align:center; margin-bottom:15px; opacity:0.5; filter: hue-rotate(180deg);">🚀</div>`
            }
            <h3 style="color:var(--accent-color); margin-top:0;">${ship.name.toUpperCase()}</h3>
        </div>
        <p style="text-align:center; font-size:13px; color:var(--item-desc-color); margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #333;">${ship.description}</p>
        
        <div class="trade-math-area">
            <div class="trade-stat-row"><span>Max Hull:</span> <span style="color:var(--success)">${formatNumber(ship.baseHull)}</span></div>
            <div class="trade-stat-row"><span>Cargo Bay:</span> <span style="color:var(--accent-color)">${formatNumber(ship.cargoCapacity)} units</span></div>
            <div class="trade-stat-row" style="margin-top:10px; border-top:1px dashed #444; padding-top:10px;">
                <span>Chassis Base Cost:</span> <span>${formatNumber(ship.baseCost)}c</span>
            </div>
            <div class="trade-stat-row" style="color:#888">
                <span>Trade-In Value:</span> <span>-${formatNumber(tradeIn)}c</span>
            </div>
            <div class="total-cost-display" style="margin-top:10px;">NET COST: ${formatNumber(netCost)}c</div>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; border: 1px solid var(--border-color); background: rgba(0,224,224,0.05); text-align:left;">
            <span style="font-size:10px; color:var(--accent-color); letter-spacing:1px; display:block; margin-bottom:5px;">COMBAT PROTOCOL</span>
            <span style="font-weight:bold; color:var(--text-color); font-size:12px;">${ship.ability.name}:</span>
            <span style="font-size:12px; color:var(--item-desc-color);">${ship.ability.desc}</span>
        </div>
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;
    
    // --- Purchase Logic ---
    const cargoTooLarge = currentCargoLoad > ship.cargoCapacity;
    let btnLabel = `COMMISSION VESSEL (${formatNumber(netCost)}c)`;
    let isDisabled = '';

    if (playerShip.shipClass === shipId) {
        btnLabel = 'CURRENTLY EQUIPPED';
        isDisabled = 'disabled';
    } else if (playerCredits < netCost) {
        btnLabel = 'INSUFFICIENT FUNDS';
        isDisabled = 'disabled';
    } else if (cargoTooLarge) {
        btnLabel = 'CARGO EXCEEDS NEW HOLD';
        isDisabled = 'disabled';
    }

    document.getElementById('genericModalActions').innerHTML = `
        <button class="action-button" ${isDisabled} style="${isDisabled ? '' : 'border-color:var(--success); color:var(--success); box-shadow: 0 0 15px rgba(0,255,0,0.2);'}" 
            onclick="confirmBuyShip('${shipId}', ${netCost}, ${componentsRefund})">
            ${btnLabel}
        </button>
    `;
}

function confirmBuyShip(shipId, netCost, componentsRefund = 0) {
    const newShip = SHIP_CLASSES[shipId];
    
    // Safety blocks
    if (playerCredits < netCost) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        return;
    }
    if (currentCargoLoad > newShip.cargoCapacity) {
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

    playerHull = MAX_PLAYER_HULL; 
    playerShields = MAX_SHIELDS; 
    playerFuel = MAX_FUEL; 

    // Log & UI Updates
    logMessage(`Transaction complete! Welcome to your new ${newShip.name}!`);
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("VESSEL COMMISSIONED", "success");
    
    closeGenericModal();
    openStationView(); // Refresh station hub
    renderUIStats();
}

// --- Outfitting Functions ---
function displayOutfittingScreen() {
    openGenericModal("OUTFITTING SERVICES");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent'); 
    
    // --- Default Ship Display ---
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            ${SHIP_CLASSES[playerShip.shipClass].image 
                ? `<img src="${SHIP_CLASSES[playerShip.shipClass].image}" style="width:100%; max-width:200px; height:auto; margin: 0 auto 15px; display:block; filter: drop-shadow(0 0 10px rgba(0,224,224,0.2));">` 
                : `<div style="font-size:60px; text-align:center; margin-bottom:15px; opacity:0.5; filter: hue-rotate(180deg);">🚀</div>`
            }
            <h3 style="color:var(--accent-color); margin-bottom:10px;">${SHIP_CLASSES[playerShip.shipClass].name.toUpperCase()}</h3>
            <p style="color:var(--item-desc-color); font-size:12px;">Select a system slot on the left to view available upgrades and modifications.</p>
        </div>
    `;

    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
    
    slots.forEach(slot => {
        const currentId = playerShip.components[slot];
        const currentName = COMPONENTS_DATABASE[currentId] ? COMPONENTS_DATABASE[currentId].name : "Empty";
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.fontWeight = 'bold';
        // Added var(--text-color) to the currently equipped item name so it doesn't vanish in dark mode
        row.innerHTML = `<span style="color:var(--accent-color)">${slot.toUpperCase()} SLOT</span> <span style="color:var(--text-color); font-size:10px">${currentName}</span>`;
        row.onclick = () => showOutfittingOptions(slot);
        listEl.appendChild(row);
    });
}

function showOutfittingOptions(slot) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    // Added var(--text-color) to the header
    detailEl.innerHTML = `<h4 style="color:var(--text-color); border-bottom:1px solid var(--border-color); padding-bottom:5px;">Available ${slot} Upgrades</h4>`;
    actionsEl.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
    
    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        if (comp.reqFaction) {
             const standing = playerFactionStanding[comp.reqFaction] || 0;
             if (standing < comp.minRep) {
                 continue; 
             }
        }
        if (comp.slot === slot && playerShip.components[slot] !== compId) {
            
            const itemDiv = document.createElement('div');
            itemDiv.style.padding = '10px';
            itemDiv.style.borderBottom = '1px solid var(--border-color)';
            itemDiv.style.cursor = 'pointer';
            
            // Swapped hardcoded #CCC for var(--item-desc-color)
            const mfgBadge = comp.manufacturer ? `<span style="background:rgba(255,255,255,0.1); color:var(--item-desc-color); padding:2px 4px; border-radius:2px; font-size:9px; margin-left:6px; vertical-align:middle;">${comp.manufacturer}</span>` : '';

            itemDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div><span style="color:var(--item-name-color); font-weight:bold;">${comp.name}</span> ${mfgBadge}</div>
                    <span style="color:var(--gold-text)">${formatNumber(comp.cost)}c</span>
                </div>
                <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">${comp.description}</div>
            `;
            
            itemDiv.onclick = () => {
                actionsEl.innerHTML = `
                    <button class="action-button" ${playerCredits >= comp.cost ? '' : 'disabled'} 
                        onclick="confirmBuyComponent('${compId}')">
                        INSTALL ${comp.name.toUpperCase()} (${formatNumber(comp.cost)}c)
                    </button>
                `;
            };
            container.appendChild(itemDiv);
        }
    }
    
    if(container.children.length === 0) {
        container.innerHTML = "<p style='color:var(--item-desc-color)'>No upgrades available for this slot.</p>";
    }
    
    detailEl.appendChild(container);
}

function confirmBuyComponent(compId) {
    const newComp = COMPONENTS_DATABASE[compId];
    
    const currentCompId = playerShip.components[newComp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];
    
    const tradeInValue = currentComp ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = newComp.cost - tradeInValue;

    if(playerCredits < netCost) {
        showToast(`Insufficient Funds! Net cost: ${formatNumber(netCost)}c`, "error");
        return;
    }
    
    playerCredits -= netCost;
    playerShip.components[newComp.slot] = compId;
    
    if (newComp.stats.maxAmmo) {
        playerShip.ammo[compId] = newComp.stats.maxAmmo;
    }
    
    // --- DELETE OLD AMMO DATA ---
    if (currentCompId !== compId) {
        delete playerShip.ammo[currentCompId]; 
    }

    applyPlayerShipStats();
    
    // --- CLARIFY REFUNDS FOR DOWNGRADING ---
    let msg = `Installed ${newComp.name}.`;
    if (netCost < 0) {
        const refund = Math.abs(netCost);
        msg += `<br><span style="font-size:11px; color:var(--success);">(Salvage Refund: +${formatNumber(refund)}c)</span>`;
    } else if (tradeInValue > 0) {
        msg += `<br><span style="font-size:11px; color:var(--item-desc-color);">(Traded in ${currentComp.name} for ${formatNumber(tradeInValue)}c)</span>`;
    }
    
    showToast(msg, "success");
    displayOutfittingScreen(); 
    renderUIStats();
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

    // 2. Apply Base Component Stats First
    const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    const shield = COMPONENTS_DATABASE[playerShip.components.shield];
    const engine = COMPONENTS_DATABASE[playerShip.components.engine];

    PLAYER_ATTACK_DAMAGE = weapon.stats.damage || 0;
    PLAYER_HIT_CHANCE = weapon.stats.hitChance || 0;
    MAX_SHIELDS = shield.stats.maxShields || 0;
    MAX_FUEL = engine.stats.maxFuel || 0;

    // 3. Check Utility Slot (FIXED: Now includes shieldBonus!)
    const utilityId = playerShip.components.utility || "UTIL_NONE";
    const utility = COMPONENTS_DATABASE[utilityId];

    if (utility && utility.stats) {
        if (utility.stats.hullBonus) calculatedMaxHull += utility.stats.hullBonus;
        if (utility.stats.cargoBonus) calculatedMaxCargo += utility.stats.cargoBonus;
        if (utility.stats.shieldBonus) MAX_SHIELDS += utility.stats.shieldBonus; // <-- THE MISSING LINK!
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
