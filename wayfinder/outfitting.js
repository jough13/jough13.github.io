// --- START OF FILE outfitting.js ---

// ==========================================
// --- SELF-CONTAINED DATABASE EXPANSIONS ---
// ==========================================

// Helper to safely check player perks whether stored as a Set or Array
function _outfittingHasPerk(perkId) {
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

// Safely close the generic modal before returning to the underlying station view
function returnToStationConcourse() {
    if (typeof closeGenericModal === 'function') closeGenericModal();
    if (typeof openStationView === 'function') {
        const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        if (tile && tile.type === 'location' && (tile.isMajorHub || tile.char === OUTPOST_CHAR_VAL)) {
            openStationView();
        }
    }
}

// Ensure Crafted Prototypes (from script.js) and Faction Set pieces exist in COMPONENTS_DATABASE,
// and mirror equippable components into COMMODITIES so they render cleanly when stowed in Cargo!
function _initializeOutfittingDatabases() {
    if (typeof COMPONENTS_DATABASE === 'undefined') return;

    const expansionComponents = {
        // Crafted Prototypes referenced by CRAFTING_RECIPES.PROTOTYPES in script.js
        WEAPON_VOID_CASTER: {
            name: "Void Caster",
            type: "weapon",
            slot: "weapon",
            manufacturer: "UNKNOWN",
            cost: 0,
            description: "Experimental Precursor-hybridemitter firing coherent void-energy lances that bypass conventional deflectors.",
            stats: { damage: 42, hitChance: 0.88, critChance: 0.15, vsShieldBonus: 20 }
        },
        SHIELD_AETHER_WARD: {
            name: "Aether Ward",
            type: "shield",
            slot: "shield",
            manufacturer: "UNKNOWN",
            cost: 0,
            description: "Phase-shifted defensive screen that shunts incoming kinetic and thermal energy into subspace.",
            stats: { maxShields: 160, rechargeRate: 2.5, evasionBonus: 0.08 }
        },
        ENGINE_SLIPSTREAM: {
            name: "Slipstream Drive",
            type: "engine",
            slot: "engine",
            manufacturer: "UNKNOWN",
            cost: 0,
            description: "Reverse-engineered Precursor sublight motivator with near-zero hydrogen consumption and extreme thrust vectoring.",
            stats: { maxFuel: 450, fuelEfficiency: 0.60, evasionBonus: 0.15 }
        },

        // Special Scanners & Utilities referenced across config.js / biomes.js / exploration.js
        SCANNER_NEXSTAR_4SE: {
            name: "NexStar-4SE Optical Array",
            type: "scanner",
            slot: "scanner",
            manufacturer: "CONCORD",
            cost: 6800,
            description: "High-precision Maksutov-Cassegrain prime-focus optical & deep-space telemetry suite with integrated T-ring spectrograph.",
            stats: { scanBonus: 0.35, accuracyBonus: 0.10, critChance: 0.05 }
        },
        UTIL_DOSIMETRY_ARRAY: {
            name: "Lead-Lined Dosimetry & Rad-Shield",
            type: "utility",
            slot: "utility",
            manufacturer: "CONCORD",
            cost: 5200,
            description: "Active health-physics telemetry and magnetic deflection grid. Grants complete immunity to stellar corona and planetary radiation hazards.",
            stats: { radImmunity: true, shieldBonus: 20, hullBonus: 15 }
        },
        UTIL_ORBITAL_EXTRACTOR: {
            name: "Orbital Deep-Core Extractor",
            type: "utility",
            slot: "utility",
            manufacturer: "FRONTIER",
            cost: 4500,
            description: "High-yield gravimetric mining beam that allows direct ore extraction from planetary orbit without landing.",
            stats: { unlocksMining: true, cargoBonus: 15 }
        },

        // Additional Faction / Manufacturer Set Pieces so all 3-piece Synergies are achievable
        SCANNER_CONCORD_TAC: {
            name: "Aegis Tactical Auspex",
            type: "scanner",
            slot: "scanner",
            manufacturer: "CONCORD",
            cost: 4200,
            reqFaction: "CONCORD",
            minRep: 15,
            description: "Standard-issue Concord fleet fire-control radar. Improves turret tracking and shield harmonics.",
            stats: { accuracyBonus: 0.12, shieldBonus: 15, scanBonus: 0.15 }
        },
        ENGINE_KTHARR_WARP: {
            name: "K'tharr Blood-Burner Thrusters",
            type: "engine",
            slot: "engine",
            manufacturer: "KTHARR",
            cost: 5800,
            reqFaction: "KTHARR",
            minRep: 10,
            description: "Brutal, unmuffled plasma injectors built for aggressive close-range charges and reinforced hull bracing.",
            stats: { maxFuel: 280, hullBonus: 30, damageBonus: 4, signatureMod: 0.15 }
        },
        SHIELD_KTHARR_CARAPACE: {
            name: "K'tharr Bio-Carapace Screen",
            type: "shield",
            slot: "shield",
            manufacturer: "KTHARR",
            cost: 5400,
            reqFaction: "KTHARR",
            minRep: 10,
            description: "Magnetic shield array interwoven with regenerative K'tharr hull plating.",
            stats: { maxShields: 95, rechargeRate: 1.5, hullBonus: 35 }
        },
        UTIL_KTHARR_REGEN_GLAND: {
            name: "Living Hull Symbiote",
            type: "utility",
            slot: "utility",
            manufacturer: "KTHARR",
            cost: 6500,
            reqFaction: "KTHARR",
            minRep: 25,
            description: "Bio-engineered K'tharr hull tissue that slowly knits damaged armor plates back together during flight.",
            stats: { passiveRegen: true, hullBonus: 25 }
        },
        SCANNER_ECLIPSE_GHOST: {
            name: "Eclipse Whisper Sensor Suite",
            type: "scanner",
            slot: "scanner",
            manufacturer: "ECLIPSE",
            cost: 5600,
            reqFaction: "ECLIPSE",
            minRep: 10,
            description: "Passive ECM array that masks your transponder signature while pinpointing target weak spots.",
            stats: { signatureMod: -0.25, critChance: 0.10, evasionBonus: 0.06 }
        },
        SHIELD_ECLIPSE_PHANTOM: {
            name: "Eclipse Phantom Deflector",
            type: "shield",
            slot: "shield",
            manufacturer: "ECLIPSE",
            cost: 6200,
            reqFaction: "ECLIPSE",
            minRep: 15,
            description: "Low-emissionholo-field generator favored by Cartel blockade runners.",
            stats: { maxShields: 90, rechargeRate: 2.2, evasionBonus: 0.10, signatureMod: -0.20 }
        },
        UTIL_SMUGGLER_BAFFLES: {
            name: "Shielded Smuggler Bulkheads",
            type: "utility",
            slot: "utility",
            manufacturer: "ECLIPSE",
            cost: 5000,
            description: "Sensor-dampened hidden cargo compartments that expand capacity and reduce ship radar profile.",
            stats: { cargoBonus: 25, signatureMod: -0.20, evasionBonus: 0.05 }
        },
        SHIELD_FRONTIER_SCRAP: {
            name: "Frontier Jury-Rigged Grid",
            type: "shield",
            slot: "shield",
            manufacturer: "FRONTIER",
            cost: 2900,
            description: "Overclocked salvage capacitors welded to an industrial frame. Bulky, cheap, and surprisingly tough.",
            stats: { maxShields: 80, rechargeRate: 1.4, hullBonus: 15, cargoBonus: 10 }
        },
        ENGINE_FRONTIER_HAULER: {
            name: "Frontier Long-Haul Burner",
            type: "engine",
            slot: "engine",
            manufacturer: "FRONTIER",
            cost: 3400,
            description: "Outpost-grade deuterium drive with oversized reserve tanks for deep-rim prospecting.",
            stats: { maxFuel: 340, fuelEfficiency: 0.85, cargoBonus: 10 }
        }
    };

    for (const id in expansionComponents) {
        if (!COMPONENTS_DATABASE[id]) {
            COMPONENTS_DATABASE[id] = expansionComponents[id];
        }
    }

    // Sync components into COMMODITIES so stowed modules in playerCargo render properly in Cargo UI & Trade
    _syncComponentsToCommodities();
}

function _syncComponentsToCommodities() {
    if (typeof COMPONENTS_DATABASE === 'undefined' || typeof COMMODITIES === 'undefined') return;
    const slotIcons = { weapon: "🔫", shield: "🛡️", engine: "🚀", scanner: "📡", utility: "🔧" };

    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        if (!comp || compId === 'UTIL_NONE') continue;
        if (!COMMODITIES[compId]) {
            const baseVal = (comp.cost && comp.cost < 999999) ? Math.max(250, Math.floor(comp.cost * 0.6)) : 2500;
            COMMODITIES[compId] = {
                name: comp.name,
                basePrice: baseVal,
                icon: slotIcons[comp.slot] || "⚙️",
                weight: 1,
                isComponent: true,
                slot: comp.slot,
                description: `${comp.description} [Ship Module - Install at an Engineering Bay or activate from Cargo while docked].`
            };
        }
        
        // 👇 FIX: ALWAYS re-attach the function so it survives JSON serialization / game loads!
        COMMODITIES[compId].onUse = () => {
            const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
            const isDocked = loc && loc.type === 'location' && (loc.isMajorHub || loc.char === OUTPOST_CHAR_VAL || loc.isPlayerOwned);
            if (!isDocked) {
                if (typeof showToast === 'function') showToast("DOCK AT A STATION TO INSTALL MODULES", "warning");
                return false;
            }
            confirmBuyComponent(compId, true);
            return false; 
        };
    }
}

// ==========================================
// --- PROCEDURAL MODULE GENERATOR ---
// ==========================================

function generateProceduralModule(templateType = "RANDOM") {
    const prefixes = [
        { name: "Overclocked", mfg: "FRONTIER", dmg: 4, shield: 15, eva: 0.04, eff: 0.92 },
        { name: "Aegis-Spec", mfg: "CONCORD", dmg: 2, shield: 25, acc: 0.08, hull: 15 },
        { name: "Blood-Forged", mfg: "KTHARR", dmg: 6, hull: 30, shield: 10, crit: 0.06 },
        { name: "Shadow-Tuned", mfg: "ECLIPSE", eva: 0.08, sig: -0.20, crit: 0.08, acc: 0.06 },
        { name: "Precursor-Touched", mfg: "UNKNOWN", dmg: 5, shield: 30, eva: 0.06, eff: 0.85 }
    ];

    const slotTemplates = {
        MILITARY_SHIELD_MOD: { slot: "shield", baseName: "Bastion Deflector", baseStats: { maxShields: 110, rechargeRate: 1.8 } },
        WEAPON_MOD: { slot: "weapon", baseName: "Plasma Repeater", baseStats: { damage: 24, hitChance: 0.82 } },
        ENGINE_MOD: { slot: "engine", baseName: "Vector Thruster", baseStats: { maxFuel: 300, fuelEfficiency: 0.85 } },
        SCANNER_MOD: { slot: "scanner", baseName: "Deep-Core Auspex", baseStats: { scanBonus: 0.25, accuracyBonus: 0.08 } },
        UTILITY_MOD: { slot: "utility", baseName: "Tactical Co-Processor", baseStats: { hullBonus: 20, cargoBonus: 15 } }
    };

    const keys = Object.keys(slotTemplates);
    const chosenTemplate = slotTemplates[templateType] || slotTemplates[keys[Math.floor(Math.random() * keys.length)]];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const uniqueNum = Date.now() + Math.floor(Math.random() * 1000);
    const id = `PROC_${chosenTemplate.slot.toUpperCase()}_${uniqueNum}`;

    const stats = Object.assign({}, chosenTemplate.baseStats);
    if (prefix.dmg) stats.damageBonus = (stats.damageBonus || 0) + prefix.dmg;
    if (prefix.shield) stats.shieldBonus = (stats.shieldBonus || 0) + prefix.shield;
    if (prefix.hull) stats.hullBonus = (stats.hullBonus || 0) + prefix.hull;
    if (prefix.eva) stats.evasionBonus = Number(((stats.evasionBonus || 0) + prefix.eva).toFixed(2));
    if (prefix.acc) stats.accuracyBonus = Number(((stats.accuracyBonus || 0) + prefix.acc).toFixed(2));
    if (prefix.crit) stats.critChance = Number(((stats.critChance || 0) + prefix.crit).toFixed(2));
    if (prefix.sig) stats.signatureMod = Number(((stats.signatureMod || 0) + prefix.sig).toFixed(2));
    if (prefix.eff && chosenTemplate.slot === "engine") {
        stats.fuelEfficiency = Number(((stats.fuelEfficiency || 1.0) * prefix.eff).toFixed(2));
    }

    const newModule = {
        id: id,
        name: `${prefix.name} ${chosenTemplate.baseName}`,
        type: chosenTemplate.slot,
        slot: chosenTemplate.slot,
        manufacturer: prefix.mfg,
        cost: 4800 + Math.floor(Math.random() * 3200),
        description: `Custom-calibrated ${prefix.mfg} prototype module recovered from deep-space operations.`,
        stats: stats
    };

    if (typeof COMPONENTS_DATABASE !== 'undefined') {
        COMPONENTS_DATABASE[id] = newModule;
    }
    _syncComponentsToCommodities();
    return newModule;
}

window.generateProceduralModule = generateProceduralModule;

// Run database initialization in the correct boot order
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initializeOutfittingDatabases);
} else {
    _initializeOutfittingDatabases();
}

// ==========================================
// --- SHIPYARD UI & PURCHASING LOGIC ---
// ==========================================

function displayShipyard() {
    _initializeOutfittingDatabases();

    // 1. Get the current station to make the UI dynamic!
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    let stationName = (location && location.name) ? location.name.toUpperCase() : "STARBASE";
    let faction = (location && location.faction) ? location.faction : "INDEPENDENT";
    
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
    if (!listEl || !detailEl || !actionsEl) return;

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
        if (!ship) continue;

        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        
        // --- FACTION LOCK LOGIC ---
        let isLocked = false;
        let currentStanding = 0;
        if (ship.reqFaction) {
            currentStanding = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[ship.reqFaction] || 0) : 0;
            if (currentStanding < ship.minRep) isLocked = true;
        }

        const isCurrent = playerShip.shipClass === shipId;
        
        if (isLocked) {
            row.style.opacity = '0.45';
            row.innerHTML = `
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <span style="color:var(--danger); font-weight:bold; font-size:12px;">🔒 ${ship.name}</span> 
                    <span style="color:var(--text-color); font-size:10px;">Requires ${ship.reqFaction} Rep ${ship.minRep} (Current: ${currentStanding})</span>
                </div>
            `;
            row.onclick = () => {
                detailEl.innerHTML = `
                    <div style="text-align:center; padding: 0 20px 20px 20px;">
                        ${headerHtml}
                        <div style="background: rgba(255,0,0,0.1); border: 1px solid var(--danger); padding: 15px; border-radius: 4px; margin-top: 15px; text-align: left;">
                            <div style="color:var(--danger); font-weight:bold; letter-spacing: 1px; border-bottom: 1px solid var(--danger); padding-bottom: 5px; margin-bottom: 8px;">ACCESS DENIED: ${ship.name.toUpperCase()}</div>
                            <p style="color:var(--item-desc-color); font-size:12px; margin:0; line-height: 1.5;">
                                You lack the necessary <span style="color:var(--text-color); font-weight:bold;">${ship.reqFaction}</span> standing (${currentStanding} / ${ship.minRep}) to commission this military hull. Complete faction contracts or warzone assists to earn clearance.
                            </p>
                        </div>
                    </div>
                `;
                actionsEl.innerHTML = `
                    <button class="action-button danger-btn" disabled>RESTRICTED CHASSIS</button>
                    <button class="action-button" onclick="returnToStationConcourse()">RETURN TO CONCOURSE</button>
                `;
                if (typeof soundManager !== 'undefined') soundManager.playError();
            };
        } else {
            const nameColor = isCurrent ? "var(--success)" : "var(--text-color)";
            const costLabel = isCurrent ? "ACTIVE HULL" : `${formatNumber(ship.baseCost)}c`;
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span style="color:${nameColor}; font-weight:bold; font-size:12px;">${isCurrent ? '▶ ' : ''}${ship.name}</span>
                    <span style="color:${isCurrent ? 'var(--success)' : 'var(--gold-text)'}; font-size:10px; font-weight:bold;">${costLabel}</span>
                </div>
            `;
            row.onclick = () => showShipDetails(shipId); 
        }
        listEl.appendChild(row);
    }

    // 2. Default Landing Screen (Right Pane)
    const activeShipObj = SHIP_CLASSES[playerShip.shipClass] || { name: "Light Freighter" };
    const registryName = playerShip.name ? `"${playerShip.name}" (${activeShipObj.name})` : activeShipObj.name;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 0 20px 20px 20px;">
            ${headerHtml}
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Browse available starship hulls. Commissioning a new vessel trades in your current chassis and standard subsystems for a <b>50% credit valuation</b>, and equips the new vessel with factory Mk1 systems. Any crafted prototypes, cargo, and crew are automatically transferred.
            </p>
            <div style="margin-top: 15px; font-size: 12px; color: var(--accent-color); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,224,224,0.05); border-radius: 4px;">
                Current Registry: <b>${registryName}</b>
            </div>
            <div style="margin-top: 10px; font-size: 14px; color: var(--gold-text); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                Available Funds: <b>${formatNumber(playerCredits)}c</b>
            </div>
        </div>
    `;
    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="if(typeof renameShip === 'function') renameShip(); displayShipyard();">✏️ CHRISTEN / RENAME VESSEL</button>
        <button class="action-button full-width-btn" onclick="returnToStationConcourse()">RETURN TO CONCOURSE</button>
    `;
}

// Helper to calculate accurate ship & component trade-in values (excluding 999,999c Boss Drops)
function _calculateShipTradeInValue() {
    const oldShip = SHIP_CLASSES[playerShip.shipClass] || { baseCost: 0 };
    const baseTradeIn = Math.floor((oldShip.baseCost || 0) * 0.5);
    let componentsRefund = 0;

    if (playerShip && playerShip.components && typeof COMPONENTS_DATABASE !== 'undefined') {
        for (const slot in playerShip.components) {
            const compId = playerShip.components[slot];
            const compData = COMPONENTS_DATABASE[compId];
            // BUG FIX: Exclude 999,999c Legendary Boss drops from granting half-million credit refunds!
            if (compData && compData.cost > 0 && compData.cost < 999999) {
                componentsRefund += Math.floor(compData.cost * 0.5);
            }
        }
    }

    return {
        baseTradeIn,
        componentsRefund,
        totalTradeIn: baseTradeIn + componentsRefund
    };
}

function showShipDetails(shipId) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;
    
    const ship = SHIP_CLASSES[shipId];
    const oldShip = SHIP_CLASSES[playerShip.shipClass] || { baseHull: 100, cargoCapacity: 50, baseEvasion: 0, baseSignature: 1.0, baseCost: 0 };
    if (!ship) return;

    const isCurrent = playerShip.shipClass === shipId;
    
    // 1. Calculate Safe Trade-in Values
    const { baseTradeIn, componentsRefund, totalTradeIn } = _calculateShipTradeInValue();
    const netCost = isCurrent ? 0 : ship.baseCost - totalTradeIn;

    // 2. The Hologram Effect! (Updated with safe fallbacks)
    const hologramHtml = ship.image 
        ? `<img src="${ship.image}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">
           <div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; filter: hue-rotate(180deg); display:none;">🚀</div>`
        : `<div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; filter: hue-rotate(180deg);">🚀</div>`;

    // 3. Stat Deltas (Green Arrows for upgrades, Red for downgrades)
    const formatDelta = (newVal, oldVal, displayNew = newVal, reverse = false) => {
        if (isCurrent || newVal === oldVal) return `<span style="color:var(--text-color); font-weight:bold;">${displayNew}</span>`;
        const isBetter = reverse ? (newVal < oldVal) : (newVal > oldVal);
        const color = isBetter ? "var(--success)" : "var(--danger)";
        const arrow = newVal > oldVal ? "▲" : "▼";
        return `<span style="color:${color}; font-weight:bold;">${displayNew} ${arrow}</span>`;
    };

    const oldHull = oldShip.baseHull || 100;
    const newHull = ship.baseHull || 100;
    const oldCargo = oldShip.cargoCapacity || 50;
    const newCargo = ship.cargoCapacity || 50;
    const oldEvasion = oldShip.baseEvasion || 0;
    const newEvasion = ship.baseEvasion || 0;
    const oldSig = oldShip.baseSignature || 1.0;
    const newSig = ship.baseSignature || 1.0;

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
                <div class="trade-stat-row"><span>Cargo Bay Limit:</span> ${formatDelta(newCargo, oldCargo, newCargo + ' Units')}</div>
                <div class="trade-stat-row"><span>Base Evasion:</span> ${formatDelta(newEvasion, oldEvasion, (newEvasion * 100).toFixed(0) + '%')}</div>
                <div class="trade-stat-row"><span>Radar Signature:</span> ${formatDelta(newSig, oldSig, (newSig * 100).toFixed(0) + '%', true)}</div>
            </div>
            
            <div style="margin-top: 15px; padding: 10px; border: 1px solid var(--border-color); background: rgba(0,224,224,0.05); text-align:left;">
                <span style="font-size:10px; color:var(--accent-color); letter-spacing:1px; display:block; margin-bottom:5px;">COMBAT PROTOCOL (COOLDOWN: ${ship.ability ? ship.ability.cooldown : 3} TURNS)</span>
                <span style="font-weight:bold; color:var(--text-color); font-size:12px;">${ship.ability ? ship.ability.name : 'Standard'}:</span>
                <span style="font-size:12px; color:var(--item-desc-color);">${ship.ability ? ship.ability.desc : ''}</span>
            </div>

            ${!isCurrent ? `
                <div class="trade-math-area" style="margin-top:15px; text-align:left; background:rgba(0,0,0,0.5);">
                    <div class="trade-stat-row"><span>Sticker Price:</span> <span>${formatNumber(ship.baseCost)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Hull Trade-in:</span> <span>-${formatNumber(baseTradeIn)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Parts Trade-in:</span> <span>-${formatNumber(componentsRefund)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                        <span>${netCost >= 0 ? 'Net Cost:' : 'Net Trade-In Credit:'}</span>
                        <span style="color:${netCost >= 0 ? 'var(--gold-text)' : 'var(--success)'}; font-weight:bold;">
                            ${netCost >= 0 ? formatNumber(netCost) + 'c' : '+' + formatNumber(Math.abs(netCost)) + 'c'}
                        </span>
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
        
        let btnLabel = netCost >= 0
            ? `AUTHORIZE TRANSFER (${formatNumber(netCost)}c)`
            : `AUTHORIZE DOWNSIZE (+${formatNumber(Math.abs(netCost))}c REFUND)`;
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
    if (!newShip) return;

    // Recalculate trade-in server-side so inline HTML parameters can never be exploited
    const { totalTradeIn } = _calculateShipTradeInValue();
    const verifiedNetCost = newShip.baseCost - totalTradeIn;
    
    // Safety blocks
    if (playerCredits < verifiedNetCost) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        return;
    }
    if (typeof currentCargoLoad !== 'undefined' && currentCargoLoad > newShip.cargoCapacity) {
        if (typeof showToast === 'function') showToast("CARGO EXCEEDS NEW SHIP CAPACITY", "error");
        return;
    }

    // Preserve any equipped 0-cost Crafted Prototypes by stowing them in cargo before resetting slots!
    const stowedPrototypes = [];
    if (playerShip && playerShip.components && typeof COMPONENTS_DATABASE !== 'undefined') {
        for (const slot in playerShip.components) {
            const oldCompId = playerShip.components[slot];
            const oldComp = COMPONENTS_DATABASE[oldCompId];
            if (oldComp && oldComp.cost === 0 && oldComp.manufacturer === 'UNKNOWN' && oldCompId !== 'UTIL_NONE') {
                playerCargo[oldCompId] = (playerCargo[oldCompId] || 0) + 1;
                stowedPrototypes.push(oldComp.name);
            }
        }
    }

    // Execute Transaction
    playerCredits -= verifiedNetCost;
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
    if (defaultWeapon && defaultWeapon.stats && defaultWeapon.stats.maxAmmo) {
        playerShip.ammo[playerShip.components.weapon] = defaultWeapon.stats.maxAmmo;
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    applyPlayerShipStats();

    playerHull = typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100; 
    playerShields = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50; 
    playerFuel = typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220; 

    // Log & UI Updates
    let logText = `Transaction complete! Welcome to your new <span style="color:var(--accent-color); font-weight:bold;">${newShip.name}</span>!`;
    if (stowedPrototypes.length > 0) {
        logText += `<br><span style="color:#DDA0DD">[ ENGINEERING ] Safely unmounted and stowed prototype gear in Cargo: <b>${stowedPrototypes.join(', ')}</b>.</span>`;
    }
    logMessage(logText);

    if (typeof addMilestone === 'function') {
        addMilestone(`Commissioned a new ${newShip.name} chassis.`);
    }
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("VESSEL COMMISSIONED", "success");
    
    returnToStationConcourse();
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// ==========================================
// --- ENGINEERING BAY (OUTFITTING UI) ---
// ==========================================

function openOutfittingUI() {
    _initializeOutfittingDatabases();

    openGenericModal("ENGINEERING BAY");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">SYSTEM SLOTS</div>`;

    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
    const mfgCounts = {};
    
    // 1. Build the Left Pane (The Slots)
    slots.forEach(slot => {
        const currentId = playerShip.components[slot];
        const compData = COMPONENTS_DATABASE[currentId];
        const currentName = compData ? compData.name : "Empty Slot";
        const mfg = compData && compData.manufacturer ? compData.manufacturer : "Standard";
        if (compData && compData.manufacturer && compData.manufacturer !== 'NONE') {
            mfgCounts[compData.manufacturer] = (mfgCounts[compData.manufacturer] || 0) + 1;
        }
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; gap: 4px;">
                <span style="color:var(--accent-color); font-weight:bold; text-transform:uppercase;">${slot}</span> 
                <span style="color:var(--text-color); font-size:11px;">${currentName} <span style="color:#888; font-size:9px;">[${mfg}]</span></span>
            </div>
            <div style="color:var(--item-desc-color); font-size:16px;">▶</div>
        `;
        row.onclick = () => showOutfittingOptions(slot);
        listEl.appendChild(row);
    });

    // Add Experimental R&D / Calibration Bench Row to Left Pane
    const rndRow = document.createElement('div');
    rndRow.className = 'trade-item-row';
    rndRow.style.cursor = 'pointer';
    rndRow.style.marginTop = '10px';
    rndRow.style.borderTop = '1px dashed #444';
    rndRow.style.background = 'rgba(153, 51, 255, 0.08)';
    rndRow.innerHTML = `
        <div style="display:flex; flex-direction:column; gap: 4px;">
            <span style="color:#DDA0DD; font-weight:bold; font-size:12px;">⚗️ R&D CALIBRATION BENCH</span> 
            <span style="color:var(--item-desc-color); font-size:10px;">Synthesize & Tune Custom Modules</span>
        </div>
        <div style="color:#DDA0DD; font-size:16px;">▶</div>
    `;
    rndRow.onclick = () => openEngineeringCalibrationBench();
    listEl.appendChild(rndRow);

    // 2. Build Manufacturer Set Synergy Progress HTML
    let synergyProgressHtml = '';
    if (typeof SYNERGIES_DATABASE !== 'undefined') {
        synergyProgressHtml = `<div style="margin-top:12px; padding:10px; background:rgba(0,0,0,0.4); border:1px solid var(--border-color); border-radius:4px; text-align:left;">
            <div style="font-size:10px; color:var(--gold-text); letter-spacing:1px; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px;">MANUFACTURER SET SYNERGIES (3 REQUIRED)</div>`;
        for (const mfgKey in SYNERGIES_DATABASE) {
            const syn = SYNERGIES_DATABASE[mfgKey];
            const count = mfgCounts[mfgKey] || 0;
            const isActive = count >= 3;
            synergyProgressHtml += `
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px; color:${isActive ? 'var(--success)' : 'var(--item-desc-color)'}; font-weight:${isActive ? 'bold' : 'normal'};">
                    <span>${isActive ? '★ ' : ''}${syn.name} (${mfgKey}):</span>
                    <span>[${Math.min(3, count)}/3] ${syn.desc}</span>
                </div>
            `;
        }
        synergyProgressHtml += `</div>`;
    }

    // 3. Build the Right Pane (The Holographic Blueprint)
    const shipObj = SHIP_CLASSES[playerShip.shipClass] || { name: "Starship", image: "" };
    const shipImage = shipObj.image;
    
    const hologramHtml = shipImage 
        ? `<img src="${shipImage}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">
           <div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; display:none;">🚀</div>`
        : `<div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6;">🚀</div>`;

    const effPct = typeof window.PLAYER_FUEL_EFFICIENCY !== 'undefined' ? Math.round((1 - window.PLAYER_FUEL_EFFICIENCY) * 100) : 0;
    const effDisplay = effPct >= 0 ? `+${effPct}%` : `${effPct}%`;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px 20px;">
            <h3 style="color:var(--accent-color); margin-bottom:15px; letter-spacing: 2px;">${shipObj.name.toUpperCase()} CHASSIS</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 15px;">
                ${hologramHtml}
            </div>

            <div class="trade-math-area" style="text-align:left; background: rgba(0,0,0,0.3);">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:4px;">SYSTEM DIAGNOSTICS</div>
                <div class="trade-stat-row"><span>Hull Integrity:</span> <span style="color:var(--success); font-weight:bold;">${Math.floor(playerHull)} / ${MAX_PLAYER_HULL}</span></div>
                <div class="trade-stat-row"><span>Shield Emitters:</span> <span style="color:var(--accent-color); font-weight:bold;">${Math.floor(playerShields)} / ${MAX_SHIELDS}</span></div>
                <div class="trade-stat-row"><span>Weapon Output:</span> <span style="color:var(--danger); font-weight:bold;">${PLAYER_ATTACK_DAMAGE} DMG (${Math.round((PLAYER_HIT_CHANCE || 0.7) * 100)}% Hit)</span></div>
                <div class="trade-stat-row"><span>Cargo Capacity:</span> <span style="color:var(--gold-text); font-weight:bold;">${currentCargoLoad} / ${PLAYER_CARGO_CAPACITY} Units</span></div>
                <div class="trade-stat-row"><span>Evasion / Fuel Burn:</span> <span style="color:#9933FF; font-weight:bold;">${typeof PLAYER_EVASION !== 'undefined' ? (PLAYER_EVASION * 100).toFixed(0) : 0}% Eva | ${effDisplay} Eff</span></div>
            </div>

            ${synergyProgressHtml}
        </div>
    `;

    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="returnToStationConcourse()">RETURN TO CONCOURSE</button>`;
}

// ==========================================
// --- R&D EXPERIMENTAL CALIBRATION BENCH ---
// ==========================================

function openEngineeringCalibrationBench() {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const techOwned = playerCargo['TECH_PARTS'] || 0;
    const alloyOwned = playerCargo['REFINED_ALLOY'] || 0;
    const canFabricateMod = playerCredits >= 2500 && techOwned >= 5 && alloyOwned >= 1;
    const spaceLeft = PLAYER_CARGO_CAPACITY - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:55px; margin-bottom:10px; filter: drop-shadow(0 0 15px #9933FF);">⚗️</div>
            <h3 style="color:#DDA0DD; margin:0 0 10px 0; letter-spacing:1px;">EXPERIMENTAL MODULE FABRICATOR</h3>
            <p style="color:var(--item-desc-color); font-size:12px; line-height:1.6; background:rgba(0,0,0,0.3); padding:12px; border-left:2px solid #9933FF; text-align:left;">
                Combine station machine-shop tolerances with salvaged components to fabricate a randomized, custom-tuned starship module with multi-stat bonuses.
            </p>

            <div class="trade-math-area" style="text-align:left; margin-top:15px;">
                <div style="font-size:10px; color:#DDA0DD; letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">FABRICATION REQUIREMENTS</div>
                <div class="trade-stat-row"><span>Calibration Fee:</span> <span style="color:${playerCredits >= 2500 ? 'var(--gold-text)' : 'var(--danger)'}; font-weight:bold;">2,500c</span></div>
                <div class="trade-stat-row"><span>Tech Parts:</span> <span style="color:${techOwned >= 5 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${techOwned} / 5</span></div>
                <div class="trade-stat-row"><span>Refined Alloy:</span> <span style="color:${alloyOwned >= 1 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${alloyOwned} / 1</span></div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" ${(!canFabricateMod || spaceLeft < 0) ? 'disabled' : ''} style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 12px rgba(153,51,255,0.3);" onclick="executeExperimentalModuleRoll()">
            ${canFabricateMod ? 'FABRICATE CUSTOM MODULE (2,500c)' : 'INSUFFICIENT MATERIALS / CREDITS'}
        </button>
        <button class="action-button" onclick="openOutfittingUI()">BACK TO ENGINEERING</button>
    `;
}

function executeExperimentalModuleRoll() {
    if (playerCredits < 2500 || (playerCargo['TECH_PARTS'] || 0) < 5 || (playerCargo['REFINED_ALLOY'] || 0) < 1) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT RESOURCES", "error");
        return;
    }

    playerCredits -= 2500;
    playerCargo['TECH_PARTS'] -= 5;
    if (playerCargo['TECH_PARTS'] <= 0) delete playerCargo['TECH_PARTS'];
    playerCargo['REFINED_ALLOY'] -= 1;
    if (playerCargo['REFINED_ALLOY'] <= 0) delete playerCargo['REFINED_ALLOY'];

    const newMod = generateProceduralModule("RANDOM");
    playerCargo[newMod.id] = (playerCargo[newMod.id] || 0) + 1;
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    logMessage(`<span style="color:#DDA0DD; font-weight:bold;">[ R&D FABRICATOR ]</span> Synthesized custom module: <span style="color:var(--gold-text)">${newMod.name}</span> (${newMod.manufacturer} ${newMod.slot.toUpperCase()})! Stowed in Cargo.`);
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    if (typeof showToast === 'function') showToast(`CRAFTED: ${newMod.name}`, "success");

    showOutfittingOptions(newMod.slot);
    renderComponentComparison(newMod.id, newMod.slot, false, true);
}

// ==========================================
// --- SLOT OPTIONS & COMPARISON ---
// ==========================================

function showOutfittingOptions(slot) {
    _initializeOutfittingDatabases();

    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    let storeHtml = '';
    let cargoHtml = '';
    
    // 1. Check Cargo for Equippable Items (Prototypes, Crafted, Looted)
    for (const itemId in playerCargo) {
        if (playerCargo[itemId] > 0 && COMPONENTS_DATABASE[itemId] && COMPONENTS_DATABASE[itemId].slot === slot) {
            const comp = COMPONENTS_DATABASE[itemId];
            if (playerShip.components[slot] === itemId) continue; // Skip if already equipped
            
            cargoHtml += `
                <div class="trade-item-row" style="cursor:pointer; background:rgba(0, 224, 224, 0.05); border-left: 3px solid var(--accent-color);" onclick="renderComponentComparison('${itemId}', '${slot}', false, true)">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <span style="color:var(--accent-color); font-weight:bold; font-size:12px;">📦 ${comp.name}</span>
                        <span style="color:var(--success); font-size:10px; font-weight:bold;">IN CARGO (x${playerCargo[itemId]})</span>
                    </div>
                </div>
            `;
        }
    }
    
    // 2. Check Store for Buyable Items
    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        if (!comp) continue;
        
        // Skip unfathomably expensive (boss loot), free/default items, or procedurally generated items
        if (comp.cost === 0 || comp.cost >= 999999 || compId.match(/_\d+$/)) continue;
        
        // Faction Lock Check
        if (comp.reqFaction) {
             const standing = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[comp.reqFaction] || 0) : 0;
             if (standing < comp.minRep) continue; 
        }

        if (comp.slot === slot && playerShip.components[slot] !== compId) {
            storeHtml += `
                <div class="trade-item-row" style="cursor:pointer;" onclick="renderComponentComparison('${compId}', '${slot}', false, false)">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div>
                            <div style="color:var(--text-color); font-weight:bold; font-size:12px;">${comp.name}</div>
                            <div style="color:#888; font-size:9px;">MFG: ${comp.manufacturer || 'Standard'}</div>
                        </div>
                        <span style="color:var(--gold-text); font-size:11px; font-weight:bold;">${formatNumber(comp.cost)}c</span>
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
    if (!detailEl || !actionsEl) return;
    
    const selectedComp = COMPONENTS_DATABASE[compId] || { name: "Empty", stats: {}, description: "No component installed.", cost: 0 };
    const currentCompId = playerShip.components[slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId] || { name: "Empty", stats: {}, cost: 0 };

    const mfg = selectedComp.manufacturer || "Standard";
    
    // Cap trade-in at 0 if the item is a Legendary Boss Drop (Cost >= 999999)
    const tradeInValue = (isEquipped || (currentComp.cost && currentComp.cost >= 999999)) 
        ? 0 
        : Math.floor((currentComp.cost || 0) * 0.5);
        
    const netCost = (isEquipped || isOwned) ? 0 : (selectedComp.cost || 0) - tradeInValue;

    // --- DYNAMIC STAT COMPARISON BUILDER ---
    let statsHtml = '';
    const selectedStats = selectedComp.stats || {};
    const currentStats = currentComp.stats || {};
    const allStats = new Set([...Object.keys(selectedStats), ...Object.keys(currentStats)]);
    
    const percentageStats = ['hitChance', 'critChance', 'evasionBonus', 'accuracyBonus', 'scanBonus', 'signatureMod', 'fuelEfficiency'];
    
    allStats.forEach(statName => {
        // BUG FIX: Baseline for engine fuelEfficiency is 1.0 (100% fuel burn), not 0!
        const defaultBaseline = (statName === 'fuelEfficiency') ? 1.0 : 0;
        let newVal = selectedStats[statName] !== undefined ? selectedStats[statName] : defaultBaseline;
        let oldVal = currentStats[statName] !== undefined ? currentStats[statName] : defaultBaseline;
        
        if (newVal === defaultBaseline && oldVal === defaultBaseline) return;

        // Handle boolean flags cleanly (like radImmunity, passiveRegen, unlocksMining)
        if (typeof newVal === 'boolean' || typeof oldVal === 'boolean') {
            const formattedFlag = statName.replace(/([A-Z])/g, ' $1').trim();
            const flagActive = Boolean(newVal);
            statsHtml += `<div class="trade-stat-row">
                <span style="text-transform:capitalize;">${formattedFlag}:</span> 
                <span style="color:${flagActive ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${flagActive ? 'ENABLED' : 'OFFLINE'}</span>
            </div>`;
            return;
        }
        
        // Format Percentages
        let displayNew = newVal;
        if (statName === 'fuelEfficiency') {
            const burnDiff = Math.round((newVal - 1.0) * 100);
            displayNew = `${burnDiff > 0 ? '+' : ''}${burnDiff}% Burn (${Math.round(newVal * 100)}%)`;
        } else if (percentageStats.includes(statName)) {
            displayNew = `${newVal > 0 && statName !== 'hitChance' ? '+' : ''}${(newVal * 100).toFixed(0)}%`;
        }
        
        let color = "var(--text-color)";
        let diffArrow = "";
        
        if (!isEquipped) {
            // Lower is better for signatureMod and fuelEfficiency
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

    // Warn player if replacing a hardwired Boss Prototype
    const bossDestroyWarning = (!isEquipped && currentComp.cost && currentComp.cost >= 999999)
        ? `<div style="margin-top:10px; padding:8px; border:1px solid var(--danger); background:rgba(255,0,0,0.1); color:var(--danger); font-size:11px;">
               ⚠️ <b>WARNING:</b> Replacing hardwired exotic prototype <b>${currentComp.name}</b> will permanently destroy it!
           </div>`
        : '';

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
                        <span>${netCost >= 0 ? 'Net Cost:' : 'Salvage Credit:'}</span>
                        <span style="color:${netCost >= 0 ? 'var(--gold-text)' : 'var(--success)'}; font-weight:bold;">
                            ${netCost >= 0 ? formatNumber(netCost) + 'c' : '+' + formatNumber(Math.abs(netCost)) + 'c'}
                        </span>
                    </div>
                </div>
            ` : ''}
            ${bossDestroyWarning}
        </div>
    `;

    // --- RENDER ACTIONS ---
    if (isEquipped) {
        let unmountBtn = '';
        if (slot === 'utility' && compId !== 'UTIL_NONE') {
            unmountBtn = `<button class="action-button" style="border-color:var(--warning); color:var(--warning);" onclick="unequipComponentToCargo('utility')">UNMOUNT TO CARGO</button>`;
        }
        actionsEl.innerHTML = `
            ${unmountBtn}
            <button class="action-button" onclick="openOutfittingUI()">BACK TO SLOTS</button>
        `;
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

// Allow players to unmount their Utility module directly into Cargo
function unequipComponentToCargo(slot) {
    if (slot !== 'utility') return;
    const currentCompId = playerShip.components.utility;
    if (!currentCompId || currentCompId === 'UTIL_NONE') return;

    const currentComp = COMPONENTS_DATABASE[currentCompId];
    const oldCargoBonus = (currentComp && currentComp.stats && currentComp.stats.cargoBonus) ? currentComp.stats.cargoBonus : 0;
    const simulatedCapacity = PLAYER_CARGO_CAPACITY - oldCargoBonus;

    // Need +1 space for the unmounted utility module itself!
    if ((typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + 1 > simulatedCapacity) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT CARGO SPACE TO UNMOUNT", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    playerShip.components.utility = 'UTIL_NONE';
    playerCargo[currentCompId] = (playerCargo[currentCompId] || 0) + 1;

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    applyPlayerShipStats();

    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    if (typeof showToast === 'function') showToast(`UNMOUNTED: ${currentComp ? currentComp.name : currentCompId}`, "info");
    openOutfittingUI();
}

function confirmBuyComponent(compId, isOwned = false) {
    _initializeOutfittingDatabases();

    const newComp = COMPONENTS_DATABASE[compId];
    if (!newComp) return;

    const currentCompId = playerShip.components[newComp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];
    
    // Prevent half-million credit exploits on Boss Drops (cost >= 999999)
    const tradeInValue = (currentComp && currentComp.cost < 999999) ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = isOwned ? 0 : newComp.cost - tradeInValue;

    // Simulate new cargo capacity to prevent over-encumbrance exploit!
    const oldCargoBonus = (currentComp && currentComp.stats && currentComp.stats.cargoBonus) ? currentComp.stats.cargoBonus : 0;
    const newCargoBonus = (newComp && newComp.stats && newComp.stats.cargoBonus) ? newComp.stats.cargoBonus : 0;
    const simulatedCapacity = PLAYER_CARGO_CAPACITY - oldCargoBonus + newCargoBonus;

    // Account for cargo load delta when swapping from cargo (-1 for newComp, +1 if oldComp is stowed)
    const willStowOld = Boolean(
        currentComp &&
        currentCompId !== 'UTIL_NONE' &&
        currentComp.cost < 999999 &&
        (isOwned ? (currentComp.cost > 0 || currentComp.manufacturer === 'UNKNOWN') : (currentComp.cost === 0 && currentComp.manufacturer === 'UNKNOWN'))
    );
    const loadDelta = (isOwned ? -1 : 0) + (willStowOld ? 1 : 0);
    const projectedLoad = (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + loadDelta;
    
    if (projectedLoad > simulatedCapacity) {
        if (typeof showToast === 'function') showToast(`CARGO OVERFLOW: Need ${projectedLoad - simulatedCapacity} free space`, "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    if (!isOwned && playerCredits < netCost) {
        if (typeof showToast === 'function') showToast(`Insufficient Funds!`, "error");
        return;
    }
    
    if (!isOwned) {
        playerCredits -= netCost;
        // If replacing a 0-cost crafted prototype with a store item, stow the prototype so it isn't lost!
        if (willStowOld) {
            playerCargo[currentCompId] = (playerCargo[currentCompId] || 0) + 1;
        } else if (currentComp && currentComp.cost >= 999999) {
            logMessage(`<span style="color:var(--danger)">[ WARNING ] Prototype weapon ${currentComp.name} could not be safely unmounted and was destroyed.</span>`);
        }
    } else {
        playerCargo[compId]--;
        if (playerCargo[compId] <= 0) delete playerCargo[compId];
        
        // Allow standard or Unknown/Crafted prototypes to be stowed, but DESTROY 999999 boss drops!
        if (willStowOld) {
            playerCargo[currentCompId] = (playerCargo[currentCompId] || 0) + 1;
        } else if (currentComp && currentComp.cost >= 999999) {
            logMessage(`<span style="color:var(--danger)">[ WARNING ] Prototype weapon ${currentComp.name} could not be safely unmounted and was destroyed.</span>`);
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

    // Unlock component lore if present
    if (newComp.loreKey && typeof unlockLoreEntry === 'function') {
        unlockLoreEntry(newComp.loreKey);
    }

    applyPlayerShipStats();

    // If upgrading shields while docked at a station, recharge shields to the new maximum
    if (newComp.slot === 'shield') {
        playerShields = MAX_SHIELDS;
    }
    
    let msg = `Installed ${newComp.name}.`;
    if (willStowOld && currentComp) {
        msg += `<br><span style="font-size:11px; color:var(--success);">(Stowed ${currentComp.name} in Cargo Hold)</span>`;
    } else if (!isOwned) {
        if (netCost < 0) {
            const refund = Math.abs(netCost);
            msg += `<br><span style="font-size:11px; color:var(--success);">(Salvage Refund: +${formatNumber(refund)}c)</span>`;
        } else if (tradeInValue > 0 && currentComp) {
            msg += `<br><span style="font-size:11px; color:var(--item-desc-color);">(Traded in ${currentComp.name} for ${formatNumber(tradeInValue)}c)</span>`;
        }
    }
    
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(msg, "success");
    
    openOutfittingUI(); 
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof autoSaveGame === 'function') autoSaveGame();
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

    // 2. REPAIR HULL (Supports both Full and Partial Repairs)
    const repairCostPerPoint = typeof HULL_REPAIR_COST_PER_POINT !== 'undefined' ? HULL_REPAIR_COST_PER_POINT : 5;
    if (playerHull < MAX_PLAYER_HULL) {
        const hullToRepair = MAX_PLAYER_HULL - playerHull;
        const totalCost = Math.ceil(hullToRepair * repairCostPerPoint);

        if (playerCredits >= totalCost) {
            playerCredits = Math.floor(playerCredits - totalCost);
            playerHull = MAX_PLAYER_HULL;
            logMessage(`Ship hull fully repaired for ${formatNumber(totalCost)} credits.`);
            repaired = true;
        } else {
            // Partial hull repair so low-credit players aren't stranded with a broken hull!
            const affordableHull = Math.floor(playerCredits / repairCostPerPoint);
            if (affordableHull > 0) {
                const partialCost = affordableHull * repairCostPerPoint;
                playerCredits = Math.floor(playerCredits - partialCost);
                playerHull = Math.min(MAX_PLAYER_HULL, playerHull + affordableHull);
                logMessage(`<span style='color:var(--warning)'>Insufficient funds for full overhaul. Patched ${affordableHull} hull points for ${formatNumber(partialCost)} credits.</span>`);
                repaired = true;
            } else if (!rearmed) {
                logMessage(`Cannot afford hull repairs. Cost: ${formatNumber(totalCost)}c.`);
                if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
                if (typeof soundManager !== 'undefined') soundManager.playError();
                return;
            }
        }
    }

    // 3. FINAL OUTPUT
    if (repaired || rearmed) {
        if (typeof showToast === 'function') {
            showToast(repaired ? "HULL REPAIRED & REARMED" : "WEAPONS RELOADED", "success");
        }
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof updateModalInfoBar === 'function') updateModalInfoBar('genericInfoBar');
        if (typeof renderUIStats === 'function') renderUIStats();
        if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
    } else {
        logMessage("Hull is at maximum integrity and weapons are fully loaded.");
        if (typeof showToast === 'function') showToast("SYSTEMS NOMINAL", "info");
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
        playerCredits = Math.floor(playerCredits); 
        playerFuel = MAX_FUEL;
        
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`REFUELED: -${formatNumber(totalCost)}c`, "success");
        logMessage(`Ship refueled to maximum capacity for ${formatNumber(totalCost)} credits.`);
    } 
    // 2. PARTIAL FILL: Player can't afford a full tank, give them what they can afford
    else {
        const affordableFuel = Math.floor(playerCredits / FUEL_PRICE_PER_UNIT);
        
        if (affordableFuel > 0) {
            const cost = affordableFuel * FUEL_PRICE_PER_UNIT;
            playerCredits -= cost; 
            playerCredits = Math.floor(playerCredits);
            playerFuel = Math.min(MAX_FUEL, playerFuel + affordableFuel); 
            
            if (typeof soundManager !== 'undefined') soundManager.playBuy();
            if (typeof showToast === 'function') showToast(`PARTIAL REFUEL: -${formatNumber(cost)}c`, "warning");
            logMessage(`<span style='color:var(--warning)'>Insufficient funds for a full tank. The dockworker filled ${affordableFuel} units for ${formatNumber(cost)} credits.</span>`);
        } 
        // 3. COMPLETELY BROKE: Can't even afford 1 unit of fuel
        else {
            if (typeof soundManager !== 'undefined') soundManager.playError();
            if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
            logMessage("<span style='color:var(--danger)'>You don't have enough credits to buy even a single drop of fuel.</span>");
        }
    }

    if (typeof updateModalInfoBar === 'function') updateModalInfoBar('genericInfoBar');
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

// --- CENTRALIZED STAT CALCULATION ENGINE ---
function applyPlayerShipStats() {
    if (typeof SHIP_CLASSES === 'undefined' || typeof playerShip === 'undefined') return;
    const shipClassData = SHIP_CLASSES[playerShip.shipClass] || { baseHull: 100, cargoCapacity: 50, baseEvasion: 0, baseSignature: 1.0 };
    
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
        const compId = playerShip.components ? playerShip.components[slot] : null;
        const comp = (typeof COMPONENTS_DATABASE !== 'undefined' && compId) ? COMPONENTS_DATABASE[compId] : null;
        if (comp && comp.stats) {
            // Base Definitions
            if (slot === 'weapon') {
                calcDmg = comp.stats.damage || 0;
                calcHit = comp.stats.hitChance || 0;
            }
            if (slot === 'shield') calcShields += comp.stats.maxShields || 0;
            if (slot === 'engine') calcFuel += comp.stats.maxFuel || 0;
            
            // Universal Bonuses (can roll on ANY item due to procedural loot)
            if (comp.stats.hullBonus) calcHull += comp.stats.hullBonus;
            if (comp.stats.cargoBonus) calcCargo += comp.stats.cargoBonus;
            if (comp.stats.shieldBonus) calcShields += comp.stats.shieldBonus;
            if (comp.stats.fuelBonus) calcFuel += comp.stats.fuelBonus;
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
    if (_outfittingHasPerk('WEAPON_OVERCLOCK')) {
        PLAYER_ATTACK_DAMAGE = Math.floor(PLAYER_ATTACK_DAMAGE * 1.15);
    }
    
    // Ensure the global flag is reset even if the crew array is completely empty!
    window.hasEclipseMerc = false; 
    
    // 4. Apply Crew & Mercenary Bonuses
    if (typeof playerCrew !== 'undefined' && Array.isArray(playerCrew) && playerCrew.length > 0) {
        playerCrew.forEach(crew => {
            if (!crew) return;
            if (crew.isMercenary) window.hasEclipseMerc = true; 
            
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
            if (key.startsWith('SPIRE')) continue;
            const cat = LORE_DATABASE[key].category;
            if (!cat) continue;
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
    MAX_PLAYER_HULL = Math.max(10, calcHull);
    PLAYER_CARGO_CAPACITY = Math.max(10, calcCargo);
    MAX_SHIELDS = Math.max(0, calcShields);
    
    // Save fuel efficiency separately to be used in movement
    MAX_FUEL = Math.max(50, Math.floor(calcFuel));
    window.PLAYER_FUEL_EFFICIENCY = Math.max(0.1, fuelEfficiencyMult);
    
    PLAYER_EVASION = Math.max(0, calcEvasion); 
    window.PLAYER_SIGNATURE = Math.max(0.1, calcSignature);

    // 8. Apply Synergies (SET BONUSES)
    if (typeof SYNERGIES_DATABASE !== 'undefined') {
        activeSynergy = null;
        const mfgCounts = {};
        
        slots.forEach(slot => {
            const compId = playerShip.components ? playerShip.components[slot] : null;
            const comp = (typeof COMPONENTS_DATABASE !== 'undefined' && compId) ? COMPONENTS_DATABASE[compId] : null;
            if (comp && comp.manufacturer) {
                mfgCounts[comp.manufacturer] = (mfgCounts[comp.manufacturer] || 0) + 1;
            }
        });

        for (const mfg in mfgCounts) {
            if (mfgCounts[mfg] >= 3 && SYNERGIES_DATABASE[mfg]) {
                activeSynergy = SYNERGIES_DATABASE[mfg];
                if (typeof activeSynergy.effect === 'function') activeSynergy.effect(); 
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

// Legacy aliases so script.js input handlers never throw ReferenceErrors
window.displayOutfittingScreen = openOutfittingUI;
window.displayComponentsForSlot = showOutfittingOptions;
window.buyComponent = (compId) => confirmBuyComponent(compId, false);

// --- END OF FILE outfitting.js ---
