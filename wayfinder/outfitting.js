// --- START OF FILE outfitting.js ---

// ==========================================
// --- INTERNAL OUTFITTING HELPERS ---
// ==========================================

window._shipyardFilter = window._shipyardFilter || 'ALL';
window._outfittingMfgFilter = window._outfittingMfgFilter || 'ALL';
window._outfittingActiveSlot = window._outfittingActiveSlot || null;

function _outfitEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _outfitEscapeJsArg(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function _outfitFormat(num) {
    if (typeof formatNumber === 'function') return formatNumber(num);
    return String(Math.trunc(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper to safely check player perks whether stored as a Set or Array
function _outfittingHasPerk(perkId) {
    if (typeof hasPlayerPerk === 'function') return hasPlayerPerk(perkId);
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

function _refreshOutfittingBars() {
    if (typeof updateModalInfoBar === 'function') {
        updateModalInfoBar('genericInfoBar');
        updateModalInfoBar('stationInfoBar');
        updateModalInfoBar('xerxesInfoBar');
    }
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

// Safely close the generic modal before returning to the underlying station view
function returnToStationConcourse() {
    if (typeof closeGenericModal === 'function') closeGenericModal();
    const xerxesEl = document.getElementById('xerxesOverlay');
    const stationEl = document.getElementById('stationOverlay');
    if (xerxesEl && xerxesEl.style.display === 'flex') return;
    if (stationEl && stationEl.style.display === 'flex') return;

    if (typeof openStationView === 'function') {
        const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        if (tile && tile.type === 'location') {
            if (tile.name && tile.name.includes('Xerxes') && typeof openXerxesView === 'function') {
                openXerxesView();
            } else if (tile.isMajorHub || tile.char === OUTPOST_CHAR_VAL) {
                openStationView();
            }
        }
    }
}

// ==========================================
// --- SELF-CONTAINED DATABASE EXPANSIONS ---
// ==========================================

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
            description: "Experimental Precursor-hybrid emitter firing coherent void-energy lances that bypass conventional deflectors.",
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
            description: "Low-emission holo-field generator favored by Cartel blockade runners.",
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
            expansionComponents[id].id = id;
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
                id: compId,
                name: comp.name,
                basePrice: baseVal,
                icon: slotIcons[comp.slot] || "⚙️",
                weight: 1,
                illegal: false,
                isComponent: true,
                slot: comp.slot,
                category: "TECH",
                description: `${comp.description} [Ship Module - Install at an Engineering Bay or activate from Cargo while docked].`
            };
        }

        // Always re-attach onUse so it survives JSON serialization / game loads
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

// Run database initialization in the correct boot order
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initializeOutfittingDatabases);
} else {
    _initializeOutfittingDatabases();
}

// ==========================================
// --- SHIPYARD UI & PURCHASING LOGIC ---
// ==========================================

function setShipyardFilter(filterKey) {
    window._shipyardFilter = filterKey || 'ALL';
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    displayShipyard();
}

function _matchesShipyardFilter(ship, filterKey) {
    if (!ship) return false;
    if (filterKey === 'ALL') return true;
    if (filterKey === 'FACTION') return Boolean(ship.reqFaction);
    const role = String(ship.role || "").toLowerCase();
    if (filterKey === 'COMBAT') {
        return role.includes('dogfighter') || role.includes('striker') || role.includes('assault') ||
               role.includes('escort') || role.includes('raider') || role.includes('fortress') || role.includes('cruiser');
    }
    if (filterKey === 'TRADE') {
        return role.includes('freighter') || role.includes('utility') || role.includes('mining') ||
               role.includes('runner') || role.includes('smuggler');
    }
    if (filterKey === 'EXPLORE') {
        return role.includes('recon') || role.includes('research') || role.includes('rescue') || role.includes('runner');
    }
    return true;
}

function displayShipyard() {
    _initializeOutfittingDatabases();

    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const stationName = (location && location.name) ? location.name.toUpperCase() : "STARBASE";
    const faction = (location && location.faction) ? location.faction : "INDEPENDENT";

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

    const activeFilter = window._shipyardFilter || 'ALL';
    const filterPills = ['ALL', 'COMBAT', 'TRADE', 'EXPLORE', 'FACTION'].map(f => {
        const sel = activeFilter === f;
        return `<button type="button" onclick="setShipyardFilter('${f}')" style="flex:1; padding:4px 3px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; font-weight:bold; background:${sel ? 'rgba(0,224,224,0.15)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${sel ? brandColor : '#444'}; color:${sel ? brandColor : '#888'};">${f}</button>`;
    }).join('');

    listEl.innerHTML = `
        <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:6px; border-bottom:1px solid #333;">CHASSIS MANIFEST</div>
        <div style="display:flex; gap:4px; padding:0 8px 8px 8px; border-bottom:1px solid #333;">${filterPills}</div>
    `;

    const headerHtml = `
        <div style="width: 100%; height: 180px; background: url('assets/shipyard_banner.png') center/cover; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 20px; box-shadow: 0 0 25px ${brandColor}44;">
        </div>
        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">${_outfitEscapeHtml(stationName)} YARDS</h3>
    `;

    let renderedCount = 0;

    // 1. Build the Left Pane (The Manifest)
    for (const shipId in SHIP_CLASSES) {
        const ship = SHIP_CLASSES[shipId];
        if (!ship || !_matchesShipyardFilter(ship, activeFilter)) continue;
        renderedCount++;

        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';

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
                    <span style="color:var(--danger); font-weight:bold; font-size:12px;">🔒 ${_outfitEscapeHtml(ship.name)}</span> 
                    <span style="color:var(--text-color); font-size:10px;">Requires ${_outfitEscapeHtml(ship.reqFaction)} Rep ${ship.minRep} (Current: ${currentStanding})</span>
                </div>
            `;
            row.onclick = () => {
                detailEl.innerHTML = `
                    <div style="text-align:center; padding: 0 20px 20px 20px;">
                        ${headerHtml}
                        <div style="background: rgba(255,0,0,0.1); border: 1px solid var(--danger); padding: 15px; border-radius: 4px; margin-top: 15px; text-align: left;">
                            <div style="color:var(--danger); font-weight:bold; letter-spacing: 1px; border-bottom: 1px solid var(--danger); padding-bottom: 5px; margin-bottom: 8px;">ACCESS DENIED: ${_outfitEscapeHtml(ship.name.toUpperCase())}</div>
                            <p style="color:var(--item-desc-color); font-size:12px; margin:0; line-height: 1.5;">
                                You lack the necessary <span style="color:var(--text-color); font-weight:bold;">${_outfitEscapeHtml(ship.reqFaction)}</span> standing (${currentStanding} / ${ship.minRep}) to commission this restricted hull. Complete faction contracts, bounties, or warzone assists to earn clearance.
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
            const costLabel = isCurrent ? "ACTIVE HULL" : `${_outfitFormat(ship.baseCost)}c`;
            if (isCurrent) {
                row.style.background = 'rgba(0, 224, 224, 0.08)';
                row.style.borderLeft = '3px solid var(--success)';
            }
            row.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div>
                        <div style="color:${nameColor}; font-weight:bold; font-size:12px;">${isCurrent ? '▶ ' : ''}${_outfitEscapeHtml(ship.name)}</div>
                        <div style="color:var(--item-desc-color); font-size:9px; margin-top:2px;">${_outfitEscapeHtml(ship.role || 'Utility')} · Hull ${ship.baseHull} · Cargo ${ship.cargoCapacity}t</div>
                    </div>
                    <span style="color:${isCurrent ? 'var(--success)' : 'var(--gold-text)'}; font-size:10px; font-weight:bold;">${costLabel}</span>
                </div>
            `;
            row.onclick = () => showShipDetails(shipId);
        }
        listEl.appendChild(row);
    }

    if (renderedCount === 0) {
        listEl.innerHTML += `<div style="padding:15px; color:#666; font-size:12px; font-style:italic;">No hulls match the "${activeFilter}" filter.</div>`;
    }

    // 2. Default Landing Screen (Right Pane)
    const activeShipObj = SHIP_CLASSES[playerShip.shipClass] || { name: "Light Freighter" };
    const registryName = playerShip.name ? `"${playerShip.name}" (${activeShipObj.name})` : activeShipObj.name;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 0 20px 20px 20px;">
            ${headerHtml}
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Browse available starship hulls. Commissioning a new vessel trades in your current chassis and standard subsystems for a <b>50% credit valuation</b>, and equips the new vessel with factory Mk1 systems. Crafted prototypes and custom R&amp;D modules are safely stowed in your hold if space permits.
            </p>
            <div style="margin-top: 15px; font-size: 12px; color: var(--accent-color); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,224,224,0.05); border-radius: 4px;">
                Current Registry: <b>${_outfitEscapeHtml(registryName)}</b>
            </div>
            <div style="margin-top: 10px; font-size: 14px; color: var(--gold-text); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                Available Funds: <b>${_outfitFormat(playerCredits)}c</b>
            </div>
        </div>
    `;
    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="if(typeof renameShip === 'function') renameShip(); displayShipyard();">✏️ CHRISTEN / RENAME VESSEL</button>
        <button class="action-button full-width-btn" onclick="returnToStationConcourse()">RETURN TO CONCOURSE</button>
    `;
}

// Helper to calculate accurate ship & component trade-in values (excluding 999,999c Boss Drops & stowed prototypes)
function _calculateShipTradeInValue() {
    const oldShip = SHIP_CLASSES[playerShip.shipClass] || { baseCost: 0 };
    const baseTradeIn = Math.floor((oldShip.baseCost || 0) * 0.5);
    let componentsRefund = 0;
    const stowableIds = [];
    const destroyedBossNames = [];

    if (playerShip && playerShip.components && typeof COMPONENTS_DATABASE !== 'undefined') {
        for (const slot in playerShip.components) {
            const compId = playerShip.components[slot];
            if (!compId || compId === 'UTIL_NONE') continue;
            const compData = COMPONENTS_DATABASE[compId];
            if (!compData) continue;

            if (compData.cost >= 999999) {
                destroyedBossNames.push(compData.name);
            } else if ((compData.cost === 0 && compData.manufacturer === 'UNKNOWN') || compId.startsWith('PROC_')) {
                stowableIds.push(compId);
            } else if (compData.cost > 0) {
                componentsRefund += Math.floor(compData.cost * 0.5);
            }
        }
    }

    return {
        baseTradeIn,
        componentsRefund,
        totalTradeIn: baseTradeIn + componentsRefund,
        stowableIds,
        destroyedBossNames
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
    const safeShipId = _outfitEscapeJsArg(shipId);

    // 1. Calculate Safe Trade-in Values
    const { baseTradeIn, componentsRefund, totalTradeIn, stowableIds, destroyedBossNames } = _calculateShipTradeInValue();
    const netCost = isCurrent ? 0 : ship.baseCost - totalTradeIn;

    // 2. The Hologram Effect
    const hologramHtml = ship.image
        ? `<img src="${_outfitEscapeHtml(ship.image)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; max-width:220px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">
           <div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; filter: hue-rotate(180deg); display:none;">🚀</div>`
        : `<div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; filter: hue-rotate(180deg);">🚀</div>`;

    // 3. Stat Deltas
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

    // Warnings for boss prototypes or smaller barracks
    const bossWarnHtml = (!isCurrent && destroyedBossNames.length > 0)
        ? `<div style="margin-top:10px; padding:8px; border:1px solid var(--danger); background:rgba(255,0,0,0.1); color:var(--danger); font-size:11px; text-align:left;">
               ⚠️ <b>PROTOTYPE WARNING:</b> Commissioning a new hull will permanently destroy your hardwired <b>${_outfitEscapeHtml(destroyedBossNames.join(', '))}</b>!
           </div>`
        : '';

    const stowNoteHtml = (!isCurrent && stowableIds.length > 0)
        ? `<div style="margin-top:10px; padding:8px; border:1px solid #9933FF; background:rgba(153,51,255,0.08); color:#DDA0DD; font-size:11px; text-align:left;">
               📦 <b>AUTO-STOW:</b> ${stowableIds.length} equipped prototype / R&amp;D module(s) will be transferred into Cargo.
           </div>`
        : '';

    const curMarines = (playerShip && playerShip.forces) ? (playerShip.forces.marines || 0) : 0;
    const newBarracks = ship.baseTroops || 20;
    const troopWarnHtml = (!isCurrent && curMarines > newBarracks)
        ? `<div style="margin-top:10px; padding:8px; border:1px solid var(--warning); background:rgba(255,170,0,0.08); color:var(--warning); font-size:11px; text-align:left;">
               🪖 <b>BARRACKS LIMIT:</b> New hull holds ${newBarracks} Marines (${curMarines} aboard). Excess Marines will be mustered out at 500c each.
           </div>`
        : '';

    // 4. Render Right Pane
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:5px;">
                ${isCurrent ? 'CURRENTLY EQUIPPED' : 'CHASSIS SELECTED'}
            </div>
            <h3 style="color:var(--item-name-color); margin:0 0 15px 0; letter-spacing: 1px;">${_outfitEscapeHtml(ship.name.toUpperCase())}</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 20px;">
                ${hologramHtml}
            </div>

            <p style="color:var(--text-color); font-size:12px; line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${isCurrent ? '#666' : 'var(--accent-color)'}; margin-bottom:20px; text-align:left;">
                "${_outfitEscapeHtml(ship.description)}"
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
                <span style="font-weight:bold; color:var(--text-color); font-size:12px;">${_outfitEscapeHtml(ship.ability ? ship.ability.name : 'Standard')}:</span>
                <span style="font-size:12px; color:var(--item-desc-color);">${_outfitEscapeHtml(ship.ability ? ship.ability.desc : '')}</span>
            </div>

            ${!isCurrent ? `
                <div class="trade-math-area" style="margin-top:15px; text-align:left; background:rgba(0,0,0,0.5);">
                    <div class="trade-stat-row"><span>Sticker Price:</span> <span>${_outfitFormat(ship.baseCost)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Hull Trade-in:</span> <span>-${_outfitFormat(baseTradeIn)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>Parts Trade-in:</span> <span>-${_outfitFormat(componentsRefund)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                        <span>${netCost >= 0 ? 'Net Cost:' : 'Net Trade-In Credit:'}</span>
                        <span style="color:${netCost >= 0 ? 'var(--gold-text)' : 'var(--success)'}; font-weight:bold;">
                            ${netCost >= 0 ? _outfitFormat(netCost) + 'c' : '+' + _outfitFormat(Math.abs(netCost)) + 'c'}
                        </span>
                    </div>
                </div>
            ` : ''}
            ${stowNoteHtml}
            ${troopWarnHtml}
            ${bossWarnHtml}
        </div>
    `;

    // 5. Actions Pane
    if (isCurrent) {
        actionsEl.innerHTML = `<button class="action-button" onclick="displayShipyard()">BACK TO MANIFEST</button>`;
    } else {
        const projectedLoad = (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + stowableIds.length;
        const cargoTooLarge = projectedLoad > ship.cargoCapacity;
        const canAfford = playerCredits >= netCost;

        let btnLabel = netCost >= 0
            ? `AUTHORIZE TRANSFER (${_outfitFormat(netCost)}c)`
            : `AUTHORIZE DOWNSIZE (+${_outfitFormat(Math.abs(netCost))}c REFUND)`;
        let isDisabled = false;

        if (!canAfford) {
            btnLabel = 'INSUFFICIENT FUNDS';
            isDisabled = true;
        } else if (cargoTooLarge) {
            btnLabel = `CARGO EXCEEDS NEW HOLD (${projectedLoad}/${ship.cargoCapacity}t)`;
            isDisabled = true;
        }

        actionsEl.innerHTML = `
            <button class="action-button" style="${isDisabled ? '' : 'border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2);'}" 
                ${isDisabled ? 'disabled' : ''} onclick="confirmBuyShip('${safeShipId}', ${netCost}, ${componentsRefund})">
                ${btnLabel}
            </button>
            <button class="action-button" onclick="displayShipyard()">CANCEL</button>
        `;
    }
}

function confirmBuyShip(shipId, netCost, componentsRefund = 0, skipConfirm = false) {
    const newShip = SHIP_CLASSES[shipId];
    if (!newShip) return;

    // Recalculate trade-in cleanly so inline HTML parameters can never be exploited
    const { totalTradeIn, stowableIds, destroyedBossNames } = _calculateShipTradeInValue();
    const verifiedNetCost = newShip.baseCost - totalTradeIn;

    if (playerCredits < verifiedNetCost) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        return;
    }

    const projectedLoad = (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + stowableIds.length;
    if (projectedLoad > newShip.cargoCapacity) {
        if (typeof showToast === 'function') showToast(`CARGO EXCEEDS NEW SHIP CAPACITY (${projectedLoad}/${newShip.cargoCapacity}t)`, "error");
        return;
    }

    // Confirm before permanently destroying a hardwired Legendary Boss weapon
    if (!skipConfirm && destroyedBossNames.length > 0 && typeof showConfirmationModal === 'function') {
        showConfirmationModal(
            `WARNING: Commissioning ${newShip.name} will permanently destroy your hardwired prototype (${destroyedBossNames.join(', ')}). Proceed?`,
            () => confirmBuyShip(shipId, netCost, componentsRefund, true)
        );
        return;
    }

    // Safely stow crafted 0-cost prototypes and custom PROC_ R&D modules in cargo before resetting slots
    const stowedNames = [];
    stowableIds.forEach(oldCompId => {
        const oldComp = COMPONENTS_DATABASE[oldCompId];
        if (oldComp) {
            playerCargo[oldCompId] = (playerCargo[oldCompId] || 0) + 1;
            stowedNames.push(oldComp.name);
        }
    });

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

    // Wipe ghost ammo counters from previous weapons
    playerShip.ammo = {};

    const defaultWeapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    if (defaultWeapon && defaultWeapon.stats && defaultWeapon.stats.maxAmmo) {
        playerShip.ammo[playerShip.components.weapon] = defaultWeapon.stats.maxAmmo;
    }

    // Handle barracks downsizing fairly
    let musteredNote = "";
    const newTroopCap = newShip.baseTroops || 20;
    if (playerShip.forces) {
        if ((playerShip.forces.marines || 0) > newTroopCap) {
            const excessMarines = playerShip.forces.marines - newTroopCap;
            const refund = excessMarines * 500;
            playerShip.forces.marines = newTroopCap;
            playerCredits += refund;
            musteredNote += ` Mustered out ${excessMarines} excess Marines (+${_outfitFormat(refund)}c).`;
        }
        if ((playerShip.forces.heavyMechs || 0) > newTroopCap) {
            const excessMechs = playerShip.forces.heavyMechs - newTroopCap;
            const refund = excessMechs * 7500;
            playerShip.forces.heavyMechs = newTroopCap;
            playerCredits += refund;
            musteredNote += ` Sold ${excessMechs} excess Assault Mech(s) (+${_outfitFormat(refund)}c).`;
        }
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    applyPlayerShipStats();

    playerHull = typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100;
    playerShields = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50;
    playerFuel = typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220;

    if (newShip.loreKey && typeof unlockLoreEntry === 'function') {
        unlockLoreEntry(newShip.loreKey);
    }

    let logText = `Transaction complete! Welcome to your new <span style="color:var(--accent-color); font-weight:bold;">${_outfitEscapeHtml(newShip.name)}</span>!`;
    if (stowedNames.length > 0) {
        logText += `<br><span style="color:#DDA0DD">[ ENGINEERING ] Safely unmounted and stowed custom gear in Cargo: <b>${_outfitEscapeHtml(stowedNames.join(', '))}</b>.</span>`;
    }
    if (musteredNote) {
        logText += `<br><span style="color:var(--warning)">[ BARRACKS ]${musteredNote}</span>`;
    }
    logMessage(logText);

    if (typeof addMilestone === 'function') {
        addMilestone(`Commissioned a new ${newShip.name} chassis.`);
    }

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("VESSEL COMMISSIONED", "success");

    returnToStationConcourse();
    _refreshOutfittingBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// ==========================================
// --- ENGINEERING BAY (OUTFITTING UI) ---
// ==========================================

function openOutfittingUI() {
    _initializeOutfittingDatabases();
    window._outfittingActiveSlot = null;

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

        let ammoTag = '';
        if (slot === 'weapon' && compData && compData.stats && compData.stats.maxAmmo) {
            const curAmmo = (playerShip.ammo && playerShip.ammo[currentId] !== undefined) ? playerShip.ammo[currentId] : compData.stats.maxAmmo;
            ammoTag = ` <span style="color:${curAmmo <= 0 ? 'var(--danger)' : 'var(--warning)'}; font-size:9px;">[${curAmmo}/${compData.stats.maxAmmo}]</span>`;
        }

        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; gap: 4px;">
                <span style="color:var(--accent-color); font-weight:bold; text-transform:uppercase;">${slot}</span> 
                <span style="color:var(--text-color); font-size:11px;">${_outfitEscapeHtml(currentName)} <span style="color:#888; font-size:9px;">[${_outfitEscapeHtml(mfg)}]</span>${ammoTag}</span>
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
            <span style="color:#DDA0DD; font-weight:bold; font-size:12px;">⚗️ R&amp;D CALIBRATION BENCH</span> 
            <span style="color:var(--item-desc-color); font-size:10px;">Synthesize &amp; Target Custom Modules</span>
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
                    <span>${isActive ? '★ ' : ''}${_outfitEscapeHtml(syn.name)} (${mfgKey}):</span>
                    <span>[${Math.min(3, count)}/3] ${_outfitEscapeHtml(syn.desc)}</span>
                </div>
            `;
        }
        synergyProgressHtml += `</div>`;
    }

    // 3. Build the Right Pane (The Holographic Blueprint)
    const shipObj = SHIP_CLASSES[playerShip.shipClass] || { name: "Starship", image: "" };
    const shipImage = shipObj.image;

    const hologramHtml = shipImage
        ? `<img src="${_outfitEscapeHtml(shipImage)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; max-width:210px; filter: sepia(1) hue-rotate(140deg) saturate(3) opacity(0.7) drop-shadow(0 0 15px var(--accent-color)); border-bottom: 2px solid rgba(0,224,224,0.3); padding-bottom: 10px;">
           <div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6; display:none;">🚀</div>`
        : `<div style="font-size:80px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.6;">🚀</div>`;

    const effPct = typeof window.PLAYER_FUEL_EFFICIENCY !== 'undefined' ? Math.round((1 - window.PLAYER_FUEL_EFFICIENCY) * 100) : 0;
    const effDisplay = effPct >= 0 ? `+${effPct}%` : `${effPct}%`;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 14px 18px;">
            <h3 style="color:var(--accent-color); margin-bottom:12px; letter-spacing: 2px;">${_outfitEscapeHtml(shipObj.name.toUpperCase())} CHASSIS</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 12px;">
                ${hologramHtml}
            </div>

            <div class="trade-math-area" style="text-align:left; background: rgba(0,0,0,0.3);">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">SYSTEM DIAGNOSTICS</div>
                <div class="trade-stat-row"><span>Hull Integrity:</span> <span style="color:var(--success); font-weight:bold;">${Math.floor(playerHull)} / ${MAX_PLAYER_HULL}</span></div>
                <div class="trade-stat-row"><span>Shield Emitters:</span> <span style="color:var(--accent-color); font-weight:bold;">${Math.floor(playerShields)} / ${MAX_SHIELDS}</span></div>
                <div class="trade-stat-row"><span>Weapon Output:</span> <span style="color:var(--danger); font-weight:bold;">${PLAYER_ATTACK_DAMAGE} DMG (${Math.round((PLAYER_HIT_CHANCE || 0.7) * 100)}% Hit)</span></div>
                <div class="trade-stat-row"><span>Cargo Capacity:</span> <span style="color:var(--gold-text); font-weight:bold;">${currentCargoLoad} / ${PLAYER_CARGO_CAPACITY} Units</span></div>
                <div class="trade-stat-row"><span>Evasion / Fuel Burn:</span> <span style="color:#9933FF; font-weight:bold;">${typeof PLAYER_EVASION !== 'undefined' ? (PLAYER_EVASION * 100).toFixed(0) : 0}% Eva | ${effDisplay} Eff</span></div>
            </div>

            ${synergyProgressHtml}
        </div>
    `;

    // Quick Drydock Service Strip (Refuel & Repair right from Engineering Bay)
    const missingFuel = Math.ceil(Math.max(0, MAX_FUEL - playerFuel));
    const repairCostPerPt = typeof HULL_REPAIR_COST_PER_POINT !== 'undefined' ? HULL_REPAIR_COST_PER_POINT : 5;
    const repairCost = Math.ceil(Math.max(0, MAX_PLAYER_HULL - playerHull) * repairCostPerPt);
    const curWep = COMPONENTS_DATABASE[playerShip.components.weapon];
    const needsAmmo = Boolean(curWep && curWep.stats && curWep.stats.maxAmmo && (playerShip.ammo[playerShip.components.weapon] || 0) < curWep.stats.maxAmmo);

    actionsEl.innerHTML = `
        <div style="display:flex; gap:8px; margin-bottom:8px;">
            <button class="action-button" ${missingFuel <= 0 ? 'disabled' : ''} style="flex:1; margin:0; padding:8px 6px; font-size:10px; border-color:var(--accent-color); color:var(--accent-color);" onclick="refuelShip(); openOutfittingUI();">
                ⛽ ${missingFuel > 0 ? `REFUEL (${missingFuel}c)` : 'FUEL FULL'}
            </button>
            <button class="action-button" ${(repairCost <= 0 && !needsAmmo) ? 'disabled' : ''} style="flex:1; margin:0; padding:8px 6px; font-size:10px; border-color:var(--warning); color:var(--warning);" onclick="repairShip(); openOutfittingUI();">
                🔧 ${repairCost > 0 ? `REPAIR (${_outfitFormat(repairCost)}c)` : (needsAmmo ? 'REARM' : 'HULL 100%')}
            </button>
        </div>
        <button class="action-button full-width-btn" onclick="returnToStationConcourse()">RETURN TO CONCOURSE</button>
    `;
}

// ==========================================
// --- R&D EXPERIMENTAL CALIBRATION BENCH ---
// ==========================================

function openEngineeringCalibrationBench(selectedSlot = 'RANDOM') {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const isTargeted = selectedSlot !== 'RANDOM';
    const creditCost = isTargeted ? 3500 : 2500;
    const techReq = isTargeted ? 6 : 5;
    const alloyReq = isTargeted ? 2 : 1;

    const techOwned = playerCargo['TECH_PARTS'] || 0;
    const alloyOwned = playerCargo['REFINED_ALLOY'] || 0;
    const canFabricateMod = playerCredits >= creditCost && techOwned >= techReq && alloyOwned >= alloyReq;

    const slotOptions = [
        { id: 'RANDOM', label: 'RANDOM' },
        { id: 'weapon', label: 'WEAPON' },
        { id: 'shield', label: 'SHIELD' },
        { id: 'engine', label: 'ENGINE' },
        { id: 'scanner', label: 'SCANNER' },
        { id: 'utility', label: 'UTILITY' }
    ];

    const slotPillsHtml = slotOptions.map(s => {
        const sel = selectedSlot === s.id;
        return `<button type="button" onclick="openEngineeringCalibrationBench('${s.id}')" style="flex:1; min-width:58px; padding:5px 4px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; font-weight:bold; background:${sel ? 'rgba(153,51,255,0.22)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${sel ? '#DDA0DD' : '#444'}; color:${sel ? '#DDA0DD' : '#888'};">${s.label}</button>`;
    }).join('');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 16px;">
            <div style="font-size:48px; margin-bottom:8px; filter: drop-shadow(0 0 15px #9933FF);">⚗️</div>
            <h3 style="color:#DDA0DD; margin:0 0 10px 0; letter-spacing:1px;">EXPERIMENTAL MODULE FABRICATOR</h3>
            <p style="color:var(--item-desc-color); font-size:12px; line-height:1.55; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid #9933FF; text-align:left;">
                Combine station machine-shop tolerances with salvaged components to fabricate a custom-tuned starship module with multi-stat RARE or EXOTIC modifiers. Choose <b>RANDOM</b> for a budget roll, or lock onto a specific subsystem slot.
            </p>

            <div style="margin-top:12px; text-align:left;">
                <div style="font-size:9px; color:#DDA0DD; letter-spacing:1.5px; margin-bottom:6px; font-weight:bold;">TARGET SUBSYSTEM SLOT</div>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">${slotPillsHtml}</div>
            </div>

            <div class="trade-math-area" style="text-align:left; margin-top:12px;">
                <div style="font-size:10px; color:#DDA0DD; letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">FABRICATION REQUIREMENTS (${isTargeted ? selectedSlot.toUpperCase() : 'RANDOM'})</div>
                <div class="trade-stat-row"><span>Calibration Fee:</span> <span style="color:${playerCredits >= creditCost ? 'var(--gold-text)' : 'var(--danger)'}; font-weight:bold;">${_outfitFormat(creditCost)}c</span></div>
                <div class="trade-stat-row"><span>Tech Parts:</span> <span style="color:${techOwned >= techReq ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${techOwned} / ${techReq}</span></div>
                <div class="trade-stat-row"><span>Refined Alloy:</span> <span style="color:${alloyOwned >= alloyReq ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${alloyOwned} / ${alloyReq}</span></div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" ${!canFabricateMod ? 'disabled' : ''} style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 12px rgba(153,51,255,0.3);" onclick="executeExperimentalModuleRoll('${_outfitEscapeJsArg(selectedSlot)}')">
            ${canFabricateMod ? `FABRICATE ${isTargeted ? selectedSlot.toUpperCase() : 'CUSTOM'} MODULE (${_outfitFormat(creditCost)}c)` : 'INSUFFICIENT MATERIALS / CREDITS'}
        </button>
        <button class="action-button" onclick="openOutfittingUI()">BACK TO ENGINEERING</button>
    `;
}

function executeExperimentalModuleRoll(targetSlot = 'RANDOM') {
    const isTargeted = targetSlot && targetSlot !== 'RANDOM';
    const creditCost = isTargeted ? 3500 : 2500;
    const techReq = isTargeted ? 6 : 5;
    const alloyReq = isTargeted ? 2 : 1;

    if (playerCredits < creditCost || (playerCargo['TECH_PARTS'] || 0) < techReq || (playerCargo['REFINED_ALLOY'] || 0) < alloyReq) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT RESOURCES", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    if (typeof generateProceduralModule !== 'function') {
        if (typeof showToast === 'function') showToast("R&D FABRICATOR OFFLINE", "error");
        return;
    }

    let baseKey = "RANDOM";
    if (isTargeted) {
        const eligible = Object.keys(COMPONENTS_DATABASE).filter(k => {
            const c = COMPONENTS_DATABASE[k];
            return c && c.slot === targetSlot && c.cost > 0 && c.cost < 999999 && !k.match(/_\d+$/);
        });
        if (eligible.length > 0) {
            baseKey = eligible[Math.floor(Math.random() * eligible.length)];
        }
    }

    const newMod = generateProceduralModule(baseKey);
    if (!newMod) {
        if (typeof showToast === 'function') showToast("CALIBRATION FAULT — TRY AGAIN", "error");
        return;
    }

    playerCredits -= creditCost;
    playerCargo['TECH_PARTS'] -= techReq;
    if (playerCargo['TECH_PARTS'] <= 0) delete playerCargo['TECH_PARTS'];
    playerCargo['REFINED_ALLOY'] -= alloyReq;
    if (playerCargo['REFINED_ALLOY'] <= 0) delete playerCargo['REFINED_ALLOY'];

    _syncComponentsToCommodities();
    playerCargo[newMod.id] = (playerCargo[newMod.id] || 0) + 1;
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    logMessage(`<span style="color:#DDA0DD; font-weight:bold;">[ R&amp;D FABRICATOR ]</span> Synthesized custom module: <span style="color:var(--gold-text)">${_outfitEscapeHtml(newMod.name)}</span> (${_outfitEscapeHtml(newMod.manufacturer || 'CUSTOM')} ${newMod.slot.toUpperCase()})! Stowed in Cargo.`);
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    if (typeof showToast === 'function') showToast(`CRAFTED: ${newMod.name}`, "success");

    _refreshOutfittingBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();

    showOutfittingOptions(newMod.slot);
    renderComponentComparison(newMod.id, newMod.slot, false, true);
}

// ==========================================
// --- SLOT OPTIONS & COMPARISON ---
// ==========================================

function setOutfittingMfgFilter(mfgKey) {
    window._outfittingMfgFilter = mfgKey || 'ALL';
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    if (window._outfittingActiveSlot) {
        showOutfittingOptions(window._outfittingActiveSlot);
    }
}

function showOutfittingOptions(slot) {
    _initializeOutfittingDatabases();
    window._outfittingActiveSlot = slot;

    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const activeMfg = window._outfittingMfgFilter || 'ALL';
    const mfgFilterPills = ['ALL', 'CONCORD', 'KTHARR', 'ECLIPSE', 'FRONTIER'].map(m => {
        const sel = activeMfg === m;
        const shortLabel = m === 'FRONTIER' ? 'FRNT' : (m === 'CONCORD' ? 'CNCD' : (m === 'ECLIPSE' ? 'ECLP' : (m === 'KTHARR' ? 'KTHR' : 'ALL')));
        return `<button type="button" onclick="setOutfittingMfgFilter('${m}')" title="Filter by ${m}" style="flex:1; padding:4px 2px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; font-weight:bold; background:${sel ? 'rgba(0,224,224,0.15)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${sel ? 'var(--accent-color)' : '#444'}; color:${sel ? 'var(--accent-color)' : '#888'};">${shortLabel}</button>`;
    }).join('');

    let cargoHtml = '';
    let storeHtml = '';
    let lockedHtml = '';

    // 1. Check Cargo for Equippable Items (Prototypes, Crafted, Looted)
    for (const itemId in playerCargo) {
        if (playerCargo[itemId] > 0 && COMPONENTS_DATABASE[itemId] && COMPONENTS_DATABASE[itemId].slot === slot) {
            const comp = COMPONENTS_DATABASE[itemId];
            if (playerShip.components[slot] === itemId) continue;
            if (activeMfg !== 'ALL' && comp.manufacturer !== activeMfg) continue;

            const safeId = _outfitEscapeJsArg(itemId);
            cargoHtml += `
                <div class="trade-item-row" style="cursor:pointer; background:rgba(0, 224, 224, 0.05); border-left: 3px solid var(--accent-color);" onclick="renderComponentComparison('${safeId}', '${slot}', false, true)">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div>
                            <div style="color:var(--accent-color); font-weight:bold; font-size:12px;">📦 ${_outfitEscapeHtml(comp.name)}</div>
                            <div style="color:#888; font-size:9px;">MFG: ${_outfitEscapeHtml(comp.manufacturer || 'Standard')}</div>
                        </div>
                        <span style="color:var(--success); font-size:10px; font-weight:bold;">IN CARGO (x${playerCargo[itemId]})</span>
                    </div>
                </div>
            `;
        }
    }

    // 2. Check Store for Buyable & Faction-Locked Items (sorted by cost ascending)
    const slotComponents = Object.keys(COMPONENTS_DATABASE)
        .filter(compId => {
            const comp = COMPONENTS_DATABASE[compId];
            if (!comp || comp.slot !== slot) return false;
            if (comp.cost === 0 || comp.cost >= 999999 || compId.match(/_\d+$/)) return false;
            if (playerShip.components[slot] === compId) return false;
            if (activeMfg !== 'ALL' && comp.manufacturer !== activeMfg) return false;
            return true;
        })
        .sort((a, b) => (COMPONENTS_DATABASE[a].cost || 0) - (COMPONENTS_DATABASE[b].cost || 0));

    slotComponents.forEach(compId => {
        const comp = COMPONENTS_DATABASE[compId];
        const safeId = _outfitEscapeJsArg(compId);

        let isLocked = false;
        let currentStanding = 0;
        if (comp.reqFaction) {
            currentStanding = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[comp.reqFaction] || 0) : 0;
            if (currentStanding < comp.minRep) isLocked = true;
        }

        if (isLocked) {
            lockedHtml += `
                <div class="trade-item-row" style="cursor:pointer; opacity:0.45;" onclick="renderComponentComparison('${safeId}', '${slot}', false, false, true)">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div>
                            <div style="color:var(--danger); font-weight:bold; font-size:12px;">🔒 ${_outfitEscapeHtml(comp.name)}</div>
                            <div style="color:var(--item-desc-color); font-size:9px;">Requires ${_outfitEscapeHtml(comp.reqFaction)} Rep ${comp.minRep} (${currentStanding})</div>
                        </div>
                        <span style="color:#888; font-size:10px;">${_outfitFormat(comp.cost)}c</span>
                    </div>
                </div>
            `;
        } else {
            storeHtml += `
                <div class="trade-item-row" style="cursor:pointer;" onclick="renderComponentComparison('${safeId}', '${slot}', false, false, false)">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div>
                            <div style="color:var(--text-color); font-weight:bold; font-size:12px;">${_outfitEscapeHtml(comp.name)}</div>
                            <div style="color:#888; font-size:9px;">MFG: ${_outfitEscapeHtml(comp.manufacturer || 'Standard')}</div>
                        </div>
                        <span style="color:var(--gold-text); font-size:11px; font-weight:bold;">${_outfitFormat(comp.cost)}c</span>
                    </div>
                </div>
            `;
        }
    });

    // Render Filter Header + Lists
    listEl.innerHTML += `
        <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; border-bottom:1px solid #333;">
            SLOT: ${slot.toUpperCase()}
        </div>
        <div style="display:flex; gap:4px; padding:6px 8px; border-bottom:1px solid #333;">${mfgFilterPills}</div>
    `;

    if (cargoHtml) {
        listEl.innerHTML += `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:5px; border-bottom:1px solid #333;">AVAILABLE IN CARGO</div>${cargoHtml}`;
    }

    listEl.innerHTML += `<div class="trade-list-header" style="color:var(--gold-text); font-size:10px; letter-spacing:2px; margin-top:6px; margin-bottom:5px; border-bottom:1px solid #333;">STATION MARKETPLACE</div>`;

    if (!storeHtml && !lockedHtml) {
        listEl.innerHTML += `<div style="padding:15px; color:#666; font-size:11px; font-style:italic;">No compatible upgrades match the active filter (${activeMfg}).</div>`;
    } else {
        listEl.innerHTML += storeHtml + lockedHtml;
    }

    // Instantly render the currently equipped item in the right pane for reference
    renderComponentComparison(playerShip.components[slot], slot, true, false, false);
}

// Helper to preview whether equipping a module activates or breaks a 3-piece Set Synergy
function _getSynergyImpactPreview(slot, newComp) {
    if (typeof SYNERGIES_DATABASE === 'undefined' || !playerShip || !playerShip.components) return "";
    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];

    const countMfgs = (overrideSlot, overrideMfg) => {
        const counts = {};
        slots.forEach(s => {
            let mfg = null;
            if (s === overrideSlot) {
                mfg = overrideMfg;
            } else {
                const c = COMPONENTS_DATABASE[playerShip.components[s]];
                mfg = c ? c.manufacturer : null;
            }
            if (mfg && SYNERGIES_DATABASE[mfg]) {
                counts[mfg] = (counts[mfg] || 0) + 1;
            }
        });
        return counts;
    };

    const beforeCounts = countMfgs(null, null);
    const afterCounts = countMfgs(slot, newComp ? newComp.manufacturer : null);

    const beforeActive = Object.keys(beforeCounts).find(k => beforeCounts[k] >= 3) || null;
    const afterActive = Object.keys(afterCounts).find(k => afterCounts[k] >= 3) || null;

    if (afterActive && afterActive !== beforeActive) {
        const syn = SYNERGIES_DATABASE[afterActive];
        return `<div style="margin-top:10px; padding:8px; border:1px solid var(--gold-text); background:rgba(255,215,0,0.08); color:var(--gold-text); font-size:11px;">
                    ★ <b>ACTIVATES SET SYNERGY:</b> ${_outfitEscapeHtml(syn.name)} (${_outfitEscapeHtml(syn.desc)})
                </div>`;
    }
    if (beforeActive && !afterActive) {
        const syn = SYNERGIES_DATABASE[beforeActive];
        return `<div style="margin-top:10px; padding:8px; border:1px solid var(--warning); background:rgba(255,170,0,0.08); color:var(--warning); font-size:11px;">
                    ⚠️ <b>BREAKS SET SYNERGY:</b> Will deactivate ${_outfitEscapeHtml(syn.name)} (${_outfitEscapeHtml(syn.desc)})
                </div>`;
    }
    return "";
}

function renderComponentComparison(compId, slot, isEquipped = false, isOwned = false, isLocked = false) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const selectedComp = COMPONENTS_DATABASE[compId] || { name: "Empty", stats: {}, description: "No component installed.", cost: 0 };
    const currentCompId = playerShip.components[slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId] || { name: "Empty", stats: {}, cost: 0 };
    const safeCompId = _outfitEscapeJsArg(compId);

    const mfg = selectedComp.manufacturer || "Standard";
    const mfgProfile = (typeof MANUFACTURER_PROFILES !== 'undefined' && MANUFACTURER_PROFILES[mfg])
        ? MANUFACTURER_PROFILES[mfg]
        : null;

    // Pre-calculate stow logic to prevent UI showing a false refund
    const willStowOld = Boolean(
        currentComp &&
        currentCompId !== 'UTIL_NONE' &&
        currentComp.cost < 999999 &&
        (isOwned
            ? (currentComp.cost > 0 || currentComp.manufacturer === 'UNKNOWN')
            : (currentCompId.startsWith('PROC_') || (currentComp.cost === 0 && currentComp.manufacturer === 'UNKNOWN')))
    );

    // Cap trade-in at 0 if the item is a Legendary Boss Drop, OR if it's being stowed
    const tradeInValue = (isEquipped || willStowOld || (currentComp.cost && currentComp.cost >= 999999))
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
        const defaultBaseline = (statName === 'fuelEfficiency') ? 1.0 : 0;
        const newVal = selectedStats[statName] !== undefined ? selectedStats[statName] : defaultBaseline;
        const oldVal = currentStats[statName] !== undefined ? currentStats[statName] : defaultBaseline;

        if (newVal === defaultBaseline && oldVal === defaultBaseline) return;

        if (typeof newVal === 'boolean' || typeof oldVal === 'boolean') {
            const formattedFlag = statName.replace(/([A-Z])/g, ' $1').trim();
            const flagActive = Boolean(newVal);
            statsHtml += `<div class="trade-stat-row">
                <span style="text-transform:capitalize;">${_outfitEscapeHtml(formattedFlag)}:</span> 
                <span style="color:${flagActive ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${flagActive ? 'ENABLED' : 'OFFLINE'}</span>
            </div>`;
            return;
        }

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
            const reverseLogic = statName === 'signatureMod' || statName === 'fuelEfficiency';
            if (newVal > oldVal) {
                color = reverseLogic ? "var(--danger)" : "var(--success)";
                diffArrow = "▲";
            } else if (newVal < oldVal) {
                color = reverseLogic ? "var(--success)" : "var(--danger)";
                diffArrow = "▼";
            }
        }

        const formattedName = statName.replace(/([A-Z])/g, ' $1').trim();

        statsHtml += `<div class="trade-stat-row">
            <span style="text-transform:capitalize;">${_outfitEscapeHtml(formattedName)}:</span> 
            <span style="color:${color}; font-weight:bold;">${displayNew} ${diffArrow}</span>
        </div>`;
    });

    if (!statsHtml) statsHtml = `<div style="color:#666; font-size:11px; font-style:italic;">No measurable stat changes.</div>`;

    const synergyPreviewHtml = !isEquipped ? _getSynergyImpactPreview(slot, selectedComp) : '';

    const bossDestroyWarning = (!isEquipped && currentComp.cost && currentComp.cost >= 999999)
        ? `<div style="margin-top:10px; padding:8px; border:1px solid var(--danger); background:rgba(255,0,0,0.1); color:var(--danger); font-size:11px;">
               ⚠️ <b>WARNING:</b> Replacing hardwired exotic prototype <b>${_outfitEscapeHtml(currentComp.name)}</b> will permanently destroy it!
           </div>`
        : '';

    const lockedNoticeHtml = isLocked && selectedComp.reqFaction
        ? `<div style="margin-top:10px; padding:8px; border:1px solid var(--danger); background:rgba(255,0,0,0.08); color:var(--danger); font-size:11px;">
               🔒 <b>FACTION LOCKED:</b> Requires ${selectedComp.minRep} standing with <b>${_outfitEscapeHtml(selectedComp.reqFaction)}</b> (Current: ${typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[selectedComp.reqFaction] || 0) : 0}).
           </div>`
        : '';

    // --- RENDER THE PANE ---
    detailEl.innerHTML = `
        <div style="padding: 18px;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:5px;">
                ${isEquipped ? 'CURRENTLY EQUIPPED' : (isOwned ? 'STOWED IN CARGO' : (isLocked ? 'RESTRICTED HARDWARE' : 'UPGRADE SELECTED'))}
            </div>
            
            <h3 style="color:var(--item-name-color); margin:0 0 5px 0;">${_outfitEscapeHtml(selectedComp.name.toUpperCase())}</h3>
            
            <div style="display:inline-block; background:rgba(255,255,255,0.1); color:var(--item-desc-color); padding:2px 6px; border-radius:2px; font-size:9px; letter-spacing:1px; margin-bottom: 12px;">
                MFG: ${_outfitEscapeHtml(mfg)}${selectedComp.rarity ? ` · ${_outfitEscapeHtml(selectedComp.rarity)}` : ''}
            </div>
            
            <p style="color:var(--text-color); font-size:12px; line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${isEquipped ? '#666' : 'var(--accent-color)'}; margin-bottom:14px;">
                "${_outfitEscapeHtml(selectedComp.description)}"
            </p>

            ${mfgProfile ? `<div style="font-size:10px; color:var(--item-desc-color); margin-bottom:12px; font-style:italic;">${_outfitEscapeHtml(mfgProfile.name)} — ${_outfitEscapeHtml(mfgProfile.synergySummary)}</div>` : ''}

            <div class="trade-math-area">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">TELEMETRY DELTAS</div>
                ${statsHtml}
            </div>
            
            ${(!isEquipped && !isOwned) ? `
                <div class="trade-math-area" style="margin-top:12px; background:rgba(0,0,0,0.5);">
                    <div class="trade-stat-row"><span>Base Cost:</span> <span>${_outfitFormat(selectedComp.cost || 0)}c</span></div>
                    <div class="trade-stat-row" style="color:#888;"><span>${willStowOld ? 'Old Module Stowed' : `Trade-in (${_outfitEscapeHtml(currentComp.name)})`}:</span> <span>-${_outfitFormat(tradeInValue)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                        <span>${netCost >= 0 ? 'Net Cost:' : 'Salvage Credit:'}</span>
                        <span style="color:${netCost >= 0 ? 'var(--gold-text)' : 'var(--success)'}; font-weight:bold;">
                            ${netCost >= 0 ? _outfitFormat(netCost) + 'c' : '+' + _outfitFormat(Math.abs(netCost)) + 'c'}
                        </span>
                    </div>
                </div>
            ` : ''}
            ${synergyPreviewHtml}
            ${lockedNoticeHtml}
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
    } else if (isLocked) {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" disabled>INSUFFICIENT FACTION STANDING</button>
            <button class="action-button" onclick="openOutfittingUI()">BACK TO SLOTS</button>
        `;
    } else if (isOwned) {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" 
                onclick="confirmBuyComponent('${safeCompId}', true)">
                INSTALL FROM CARGO
            </button>
            <button class="action-button" onclick="openOutfittingUI()">CANCEL</button>
        `;
    } else {
        const canAfford = playerCredits >= netCost;
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" 
                ${!canAfford ? 'disabled' : ''} onclick="confirmBuyComponent('${safeCompId}', false)">
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

    // Need +1 space for the unmounted utility module itself
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
    _refreshOutfittingBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openOutfittingUI();
}

function confirmBuyComponent(compId, isOwned = false, skipConfirm = false) {
    _initializeOutfittingDatabases();

    const newComp = COMPONENTS_DATABASE[compId];
    if (!newComp) return;

    // Double-check faction lock when buying directly (unless already owned in cargo)
    if (!isOwned && newComp.reqFaction) {
        const standing = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[newComp.reqFaction] || 0) : 0;
        if (standing < newComp.minRep) {
            if (typeof showToast === 'function') showToast(`REQUIRES ${newComp.reqFaction} REP ${newComp.minRep}`, "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }
    }

    const currentCompId = playerShip.components[newComp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];

    // Confirm before permanently destroying a hardwired Boss Prototype
    if (!skipConfirm && currentComp && currentComp.cost >= 999999 && currentCompId !== compId && typeof showConfirmationModal === 'function') {
        showConfirmationModal(
            `WARNING: Installing ${newComp.name} will permanently destroy your hardwired exotic prototype (${currentComp.name}). Proceed?`,
            () => confirmBuyComponent(compId, isOwned, true)
        );
        return;
    }

    // Determine if we are keeping the item BEFORE calculating cost
    const willStowOld = Boolean(
        currentComp &&
        currentCompId !== 'UTIL_NONE' &&
        currentComp.cost < 999999 &&
        (isOwned
            ? (currentComp.cost > 0 || currentComp.manufacturer === 'UNKNOWN')
            : (currentCompId.startsWith('PROC_') || (currentComp.cost === 0 && currentComp.manufacturer === 'UNKNOWN')))
    );

    const tradeInValue = (currentComp && currentComp.cost < 999999 && !willStowOld) ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = isOwned ? 0 : newComp.cost - tradeInValue;

    // Simulate new cargo capacity to prevent over-encumbrance exploit
    const oldCargoBonus = (currentComp && currentComp.stats && currentComp.stats.cargoBonus) ? currentComp.stats.cargoBonus : 0;
    const newCargoBonus = (newComp && newComp.stats && newComp.stats.cargoBonus) ? newComp.stats.cargoBonus : 0;
    const simulatedCapacity = PLAYER_CARGO_CAPACITY - oldCargoBonus + newCargoBonus;

    const loadDelta = (isOwned ? -1 : 0) + (willStowOld ? 1 : 0);
    const projectedLoad = (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + loadDelta;

    if (projectedLoad > simulatedCapacity) {
        if (typeof showToast === 'function') showToast(`CARGO OVERFLOW: Need ${projectedLoad - simulatedCapacity} free space`, "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    if (!isOwned && playerCredits < netCost) {
        if (typeof showToast === 'function') showToast(`Insufficient Funds!`, "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    if (!isOwned) {
        playerCredits -= netCost;
        if (willStowOld) {
            playerCargo[currentCompId] = (playerCargo[currentCompId] || 0) + 1;
        } else if (currentComp && currentComp.cost >= 999999) {
            logMessage(`<span style="color:var(--danger)">[ WARNING ] Prototype weapon ${_outfitEscapeHtml(currentComp.name)} could not be safely unmounted and was destroyed.</span>`);
        }
    } else {
        playerCargo[compId]--;
        if (playerCargo[compId] <= 0) delete playerCargo[compId];

        if (willStowOld) {
            playerCargo[currentCompId] = (playerCargo[currentCompId] || 0) + 1;
        } else if (currentComp && currentComp.cost >= 999999) {
            logMessage(`<span style="color:var(--danger)">[ WARNING ] Prototype weapon ${_outfitEscapeHtml(currentComp.name)} could not be safely unmounted and was destroyed.</span>`);
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

    let msg = `Installed ${_outfitEscapeHtml(newComp.name)}.`;
    if (willStowOld && currentComp) {
        msg += `<br><span style="font-size:11px; color:var(--success);">(Stowed ${_outfitEscapeHtml(currentComp.name)} in Cargo Hold)</span>`;
    } else if (!isOwned) {
        if (netCost < 0) {
            const refund = Math.abs(netCost);
            msg += `<br><span style="font-size:11px; color:var(--success);">(Salvage Refund: +${_outfitFormat(refund)}c)</span>`;
        } else if (tradeInValue > 0 && currentComp) {
            msg += `<br><span style="font-size:11px; color:var(--item-desc-color);">(Traded in ${_outfitEscapeHtml(currentComp.name)} for ${_outfitFormat(tradeInValue)}c)</span>`;
        }
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(msg, "success");

    openOutfittingUI();
    _refreshOutfittingBars();
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
            logMessage(`Ship hull fully repaired for ${_outfitFormat(totalCost)} credits.`);
            repaired = true;
        } else {
            const affordableHull = Math.floor(playerCredits / repairCostPerPoint);
            if (affordableHull > 0) {
                const partialCost = affordableHull * repairCostPerPoint;
                playerCredits = Math.floor(playerCredits - partialCost);
                playerHull = Math.min(MAX_PLAYER_HULL, playerHull + affordableHull);
                logMessage(`<span style='color:var(--warning)'>Insufficient funds for full overhaul. Patched ${affordableHull} hull points for ${_outfitFormat(partialCost)} credits.</span>`);
                repaired = true;
            } else if (!rearmed) {
                logMessage(`Cannot afford hull repairs. Cost: ${_outfitFormat(totalCost)}c.`);
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
        _refreshOutfittingBars();
        if (typeof autoSaveGame === 'function') autoSaveGame();
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
    const totalCost = Math.ceil(fuelNeeded * FUEL_PRICE_PER_UNIT);

    if (playerCredits >= totalCost) {
        playerCredits = Math.floor(playerCredits - totalCost);
        playerFuel = MAX_FUEL;

        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`REFUELED: -${_outfitFormat(totalCost)}c`, "success");
        logMessage(`Ship refueled to maximum capacity for ${_outfitFormat(totalCost)} credits.`);
        if (typeof autoSaveGame === 'function') autoSaveGame();
    } else {
        const affordableFuel = Math.floor(playerCredits / FUEL_PRICE_PER_UNIT);

        if (affordableFuel > 0) {
            const cost = affordableFuel * FUEL_PRICE_PER_UNIT;
            playerCredits = Math.floor(playerCredits - cost);
            playerFuel = Math.min(MAX_FUEL, playerFuel + affordableFuel);

            if (typeof soundManager !== 'undefined') soundManager.playBuy();
            if (typeof showToast === 'function') showToast(`PARTIAL REFUEL: -${_outfitFormat(cost)}c`, "warning");
            logMessage(`<span style='color:var(--warning)'>Insufficient funds for a full tank. The dockworker filled ${affordableFuel} units for ${_outfitFormat(cost)} credits.</span>`);
            if (typeof autoSaveGame === 'function') autoSaveGame();
        } else {
            if (typeof soundManager !== 'undefined') soundManager.playError();
            if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
            logMessage("<span style='color:var(--danger)'>You don't have enough credits to buy even a single drop of fuel.</span>");
        }
    }

    _refreshOutfittingBars();
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
            if (slot === 'weapon') {
                calcDmg = comp.stats.damage || 0;
                calcHit = comp.stats.hitChance || 0;
            }
            if (slot === 'shield') calcShields += comp.stats.maxShields || 0;
            if (slot === 'engine') calcFuel += comp.stats.maxFuel || 0;

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
    PLAYER_HIT_CHANCE = Math.min(1.0, Math.max(0.05, calcHit + totalHitBonus));
    calcEvasion += totalEvasionBonus;

    // 3. Apply Perks (Player)
    if (_outfittingHasPerk('WEAPON_OVERCLOCK')) {
        PLAYER_ATTACK_DAMAGE = Math.floor(PLAYER_ATTACK_DAMAGE * 1.15);
    }

    // Ensure the global flag is reset even if the crew array is completely empty
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

    // 6. Apply Codex Mastery Bonuses (deduplicated against aliased entries)
    if (typeof LORE_DATABASE !== 'undefined') {
        const seenLore = new Set();
        const categories = {};
        for (const key in LORE_DATABASE) {
            if (key.startsWith('SPIRE')) continue;
            const entry = LORE_DATABASE[key];
            if (!entry || seenLore.has(entry)) continue;
            seenLore.add(entry);

            const cat = entry.category;
            if (!cat) continue;
            if (!categories[cat]) categories[cat] = { total: 0, unlocked: 0 };
            categories[cat].total++;
            if (entry.unlocked || (typeof discoveredLoreEntries !== 'undefined' && discoveredLoreEntries.has && discoveredLoreEntries.has(key))) {
                categories[cat].unlocked++;
            }
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

    MAX_FUEL = Math.max(50, Math.floor(calcFuel));
    window.PLAYER_FUEL_EFFICIENCY = Math.max(0.1, fuelEfficiencyMult);

    PLAYER_EVASION = Math.min(0.85, Math.max(0, calcEvasion));
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

// ==========================================
// --- PUBLIC OUTFITTING UTILITY API ---
// ==========================================

window.OutfittingUtils = {
    getTradeInValuation: _calculateShipTradeInValue,
    getRepairQuote() {
        const rate = typeof HULL_REPAIR_COST_PER_POINT !== 'undefined' ? HULL_REPAIR_COST_PER_POINT : 5;
        const missing = Math.max(0, (typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100) - (typeof playerHull !== 'undefined' ? playerHull : 100));
        return { missingHull: Math.ceil(missing), cost: Math.ceil(missing * rate) };
    },
    getRefuelQuote() {
        const missing = Math.max(0, (typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220) - (typeof playerFuel !== 'undefined' ? playerFuel : 220));
        return { missingFuel: Math.ceil(missing), cost: Math.ceil(missing) };
    },
    getLoadoutSummary() {
        if (typeof playerShip === 'undefined' || !playerShip) return null;
        const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
        const equipped = {};
        slots.forEach(s => {
            const id = playerShip.components ? playerShip.components[s] : null;
            equipped[s] = id && COMPONENTS_DATABASE[id] ? { id, name: COMPONENTS_DATABASE[id].name, manufacturer: COMPONENTS_DATABASE[id].manufacturer } : null;
        });
        return {
            shipClass: playerShip.shipClass,
            shipName: playerShip.name || (SHIP_CLASSES[playerShip.shipClass] ? SHIP_CLASSES[playerShip.shipClass].name : "Starship"),
            activeSynergy: typeof activeSynergy !== 'undefined' ? activeSynergy : null,
            equipped
        };
    }
};

// Legacy aliases so script.js input handlers never throw ReferenceErrors
window.displayOutfittingScreen = openOutfittingUI;
window.displayComponentsForSlot = showOutfittingOptions;
window.buyComponent = (compId) => confirmBuyComponent(compId, false);

// --- END OF FILE outfitting.js ---
