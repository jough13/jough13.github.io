// --- START OF FILE stations.js ---

// ==========================================
// --- INTERNAL STATION HELPERS ---
// ==========================================

function _stationEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _stationEscapeJsArg(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function _stationFormat(num) {
    if (typeof formatNumber === 'function') return formatNumber(num);
    return String(Math.trunc(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function _refreshStationBars() {
    if (typeof updateModalInfoBar === 'function') {
        updateModalInfoBar('stationInfoBar');
        updateModalInfoBar('genericInfoBar');
    }
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

// ==========================================
// --- STATION CONCOURSE HUB ---
// ==========================================

function openStationView() {
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    if (!location) return;

    // --- 1. XERXES REDIRECT ---
    if (location.name === 'Planet Xerxes' || location.name === 'Xerxes Prime') {
        if (typeof openXerxesView === 'function') {
            openXerxesView();
            return;
        }
    }

    // Close any open generic sub-modal when returning to the concourse
    if (typeof closeGenericModal === 'function') closeGenericModal();

    // --- 2. SETUP UI TEXT ---
    const overlay = document.getElementById('stationOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';

    const titleEl = document.getElementById('stationNameTitle');
    if (titleEl) titleEl.textContent = String(location.name || "OUTPOST").toUpperCase();

    const faction = location.faction || (typeof getFactionAt === 'function' ? getFactionAt(playerX, playerY) : "INDEPENDENT");
    const badgeEl = document.getElementById('stationFactionBadge');
    if (badgeEl) {
        badgeEl.textContent = faction;
        if (location.isBlackMarket) {
            badgeEl.style.color = '#9C27B0';
            badgeEl.style.borderColor = '#9C27B0';
        } else {
            badgeEl.style.color = '';
            badgeEl.style.borderColor = '';
        }
    }

    let descText = (typeof location.scanFlavor === 'string' && location.scanFlavor)
        ? location.scanFlavor
        : "A frontier outpost on the edge of civilized space.";
    if (location.isBlackMarket) {
        descText = "⚠️ SHADOW NETWORK SECURE NODE. ALL TRANSACTIONS ENCRYPTED.\n\n" + descText;
    }

    const descEl = document.getElementById('stationDescText');
    if (descEl) descEl.textContent = descText;

    // --- 3. SETUP STATION IMAGE (Existing Assets Only) ---
    const canvas = document.getElementById('stationCanvas');
    let img = document.getElementById('stationStaticImg');

    if (canvas) {
        if (!img) {
            img = document.createElement('img');
            img.id = 'stationStaticImg';
            Object.assign(img.style, {
                width: '100%',
                height: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                display: 'none',
                margin: '0 auto 15px auto',
                boxShadow: '0 0 20px rgba(0,224,224,0.2)',
                background: 'rgba(0,0,0,0.3)'
            });
            canvas.parentNode.insertBefore(img, canvas);
        }

        let targetSrc = 'assets/outpost.png';

        img.style.maxWidth = '240px';
        img.style.borderColor = 'var(--border-color)';
        img.style.boxShadow = '0 0 20px rgba(0,224,224,0.2)';

        if (location.name === 'The Rusty Anchor') {
            targetSrc = 'assets/rusty_anchor.png';
            img.style.maxWidth = '240px';
            img.style.borderColor = '#9C27B0';
            img.style.boxShadow = '0 0 30px rgba(156, 39, 176, 0.4)';
        } else if (location.name === 'Aegis Dyson Sphere') {
            targetSrc = 'assets/dyson_sphere.png';
        } else if (location.isBlackMarket) {
            targetSrc = 'assets/black_market.png';
            img.style.maxWidth = '100%';
            img.style.borderColor = '#9C27B0';
            img.style.boxShadow = '0 0 30px rgba(156, 39, 176, 0.4)';
        } else if (location.isMajorHub) {
            targetSrc = 'assets/starbase_alpha.png';
        }

        img.onload = () => {
            canvas.style.display = 'none';
            img.style.display = 'block';
            if (typeof soundManager !== 'undefined' && typeof soundManager.playUIRefresh === 'function') {
                soundManager.playUIRefresh();
            }
        };

        img.onerror = () => {
            console.warn(`Failed to load ${targetSrc}, falling back to default outpost.`);
            img.onerror = null;
            img.src = 'assets/outpost.png';
        };

        img.src = targetSrc;
    }

    // 4. Refresh Info Bar & Render Dynamic Menu
    if (typeof updateModalInfoBar === 'function') updateModalInfoBar('stationInfoBar');
    if (typeof renderStationMenu === 'function') renderStationMenu(location, faction);

    // 5. Borders
    if (typeof updateSideBorderVisibility === 'function') updateSideBorderVisibility();
}

function closeStationView() {
    const overlay = document.getElementById('stationOverlay');
    if (overlay) overlay.style.display = 'none';
    if (typeof updateSideBorderVisibility === 'function') updateSideBorderVisibility();
}

// --- STATION MAINTENANCE & CONCOURSE MENU ---

function renderStationMenu(location, faction) {
    const menuGrid = document.getElementById('dynamicStationMenu');
    if (!menuGrid || !location) return;
    let html = '';

    // --- SAVE FILE COMPATIBILITY PATCH (UNIVERSAL) ---
    if (typeof LOCATIONS_DATA !== 'undefined' && LOCATIONS_DATA[location.name]) {
        const baseData = LOCATIONS_DATA[location.name];
        if (!location.sells || location.sells.length === 0) {
            location.sells = JSON.parse(JSON.stringify(baseData.sells || []));
        }
        if (!location.buys || location.buys.length === 0) {
            location.buys = JSON.parse(JSON.stringify(baseData.buys || []));
        }
        if (location.isBlackMarket === undefined) {
            location.isBlackMarket = baseData.isBlackMarket || false;
        }
    }

    const isBlackMarketNode = Boolean(location.isBlackMarket || location.name === 'Planet Xerxes' || location.name === 'Xerxes Prime');

    const createBtn = (icon, title, sub, action, extraStyle = "", extraClass = "") => `
        <button class="station-action-btn ${extraClass}" style="${extraStyle}" onclick="${action}">
            <div class="btn-icon">${icon}</div>
            <div>
                <div class="btn-label">${title}</div>
                <span class="btn-sub">${sub}</span>
            </div>
        </button>
    `;

    // --- 1. TRADE & COMMERCE ---
    if (isBlackMarketNode) {
        html += createBtn('💀', 'Shadow Network: Buy', 'Acquire illicit goods', "openTradeModal('buy')", "", "xerxes-btn xerxes-spire-btn");
        html += createBtn('💰', 'Shadow Network: Sell', 'Fence contraband', "openTradeModal('sell')", "", "xerxes-btn xerxes-spire-btn");
    } else {
        if ((location.sells && location.sells.length > 0) || (location.buys && location.buys.length > 0)) {
            html += createBtn('🛒', 'Marketplace', 'Buy Commodities', "openTradeModal('buy')");
            html += createBtn('💰', 'Sell Cargo', 'Offload Goods', "openTradeModal('sell')");
        }
    }

    // --- 2. STANDARD SERVICES ---
    html += createBtn('📜', 'Mission Board', 'Contracts & Deliveries', "displayMissionBoard()");
    html += createBtn('🎯', 'Bounty Board', 'Hunt Wanted Targets', "openBountyBoard()", "border-left: 3px solid var(--danger);");
    html += createBtn('⚙️', 'Outfitting', 'Subsystems & Upgrades', "openOutfittingUI()", "border-left: 3px solid var(--accent-color);");
    html += createBtn('🍸', 'Cantina', 'Rumors, Pazaak & Crew', "visitCantina()");

    // --- 3. MAJOR HUB ONLY SERVICES ---
    let cryptarchRendered = false;
    if (location.isMajorHub) {
        html += createBtn('🚀', 'Shipyard', 'Commission New Hulls', "displayShipyard()");

        if (location.name !== 'The Rusty Anchor') {
            html += createBtn('👁️', 'Cryptarch', 'Decrypt Engrams & Relics', "visitCryptarch()");
            cryptarchRendered = true;
        }
    }

    // --- 4. LOCATION SPECIFIC SERVICES ---
    if (!cryptarchRendered && isBlackMarketNode && location.name !== 'The Rusty Anchor') {
        html += createBtn('👁️', 'The Cryptarch', 'Decrypt Data', "visitCryptarch()", "border-left: 3px solid #9C27B0;");
    }

    if (location.name === 'Port Nomad') {
        html += createBtn('🐀', 'Fuel Rats Dispatch', 'Sanctuary & VIP Refuel', "openFuelRatsSanctuary()", "border-left: 3px solid var(--warning);");
    } else if (location.name === 'Cygnus Prime' && typeof openObservatory === 'function') {
        html += createBtn('🔭', 'University Observatory', 'Deep-Sky Telemetry', "openObservatory()", "border-left: 3px solid var(--accent-color);");
    }

    // --- 5. FACTION & BLACK MARKET SERVICES ---
    if (faction === 'CONCORD') {
        html += createBtn('⚖️', 'Security Office', 'Clear Warrants & Fines', "openSecurityOffice()", "border-left: 3px solid var(--accent-color);");
        html += createBtn('🛡️', 'Aegis Armory', 'Concord Military Gear', "openConcordArmory()", "border-left: 3px solid var(--accent-color);");
        html += createBtn('📡', 'Naval Command', 'Hire Aegis Escort', "requestConcordEscort()", "border-left: 3px solid var(--accent-color);");
        html += createBtn('🪖', 'Marine Barracks', 'Recruit Ground Forces', "openBarracksUI()", "border-left: 3px solid var(--accent-color);");
    } else if (faction === 'KTHARR') {
        html += createBtn('⚔️', 'Proving Grounds', 'Arena Betting', "openProvingGrounds()", "border-left: 3px solid var(--danger);");
        html += createBtn('🍖', 'The Blood Pits', 'Bio-Trade & Grafting', "openBloodPitsTrade()", "border-left: 3px solid var(--danger);");
        html += createBtn('💀', 'Rite of Combat', 'Challenge Warlord', "challengeKtharrWarlord()", "border-left: 3px solid var(--danger);");
    } else if (faction === 'ECLIPSE') {
        html += createBtn('🎲', 'Shadow Broker', 'Fence & Smuggling Runs', "openShadowBroker()", "border-left: 3px solid #9933FF;");
        html += createBtn('🪪', 'The Forger', 'Wipe Heat & Fake IDs', "buyFakeID()", "border-left: 3px solid #9933FF;");
        html += createBtn('🗡️', 'Mercenary Den', 'Hire Shadow Operatives', "openMercenaryDen()", "border-left: 3px solid #9933FF;");
    } else if (isBlackMarketNode) {
        // Independent Black Markets (The Rusty Anchor, The Sunken Compass, Archivist's Vault)
        html += createBtn('🎲', 'Shadow Broker', 'Fence & Smuggling Runs', "openShadowBroker()", "border-left: 3px solid #9933FF;");
    }

    // --- 6. MAINTENANCE & LEAVE ---
    const missingFuel = Math.ceil(Math.max(0, (typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220) - (typeof playerFuel !== 'undefined' ? playerFuel : 0)));
    const refuelLabel = missingFuel > 0 ? `${_stationFormat(missingFuel)}c` : "Tanks Full";

    html += createBtn('⛽', 'Refuel', refuelLabel, "refuelShip(); openStationView();", "background: rgba(0, 224, 224, 0.05);");

    const repairRate = typeof HULL_REPAIR_COST_PER_POINT !== 'undefined' ? HULL_REPAIR_COST_PER_POINT : 5;
    const repairCost = Math.ceil(Math.max(0, (typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100) - (typeof playerHull !== 'undefined' ? playerHull : 100)) * repairRate);
    const repairLabel = repairCost > 0 ? `${_stationFormat(repairCost)}c` : "Hull 100%";

    html += createBtn('🔧', 'Repair Hull', repairLabel, "repairShip(); openStationView();", "background: rgba(255, 170, 0, 0.05);", "repair-btn");

    html += createBtn('👋', 'Undock', 'Return to Space', "closeStationView()", "background: rgba(255, 85, 85, 0.05);", "leave-btn");

    menuGrid.innerHTML = html;
}

// ==========================================
// --- PORT NOMAD: FUEL RATS SANCTUARY ---
// ==========================================

function openFuelRatsSanctuary() {
    openGenericModal("PORT NOMAD : FUEL RATS DISPATCH");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    const ratRep = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding['FUEL_RATS'] || 0) : 0;
    const isVIP = ratRep >= 5;

    listEl.innerHTML = `
        <div class="trade-list-header" style="color:var(--warning); font-size:10px; letter-spacing:2px;">COLLECTIVE STATUS</div>
        <div style="padding:14px; font-size:12px; line-height:1.6; color:var(--text-color);">
            <div class="trade-math-area">
                <div class="trade-stat-row"><span>Collective Standing:</span> <span style="color:var(--warning); font-weight:bold;">${ratRep} Rep</span></div>
                <div class="trade-stat-row"><span>VIP Rescue Status (5+):</span> <span style="color:${isVIP ? 'var(--success)' : '#888'}; font-weight:bold;">${isVIP ? 'ACTIVE' : 'LOCKED'}</span></div>
                <div class="trade-stat-row"><span>Salvage Tug Unlock (10+):</span> <span style="color:${ratRep >= 10 ? 'var(--success)' : '#888'}; font-weight:bold;">${ratRep >= 10 ? 'UNLOCKED' : `${ratRep}/10`}</span></div>
            </div>
            <p style="font-size:11px; color:var(--item-desc-color); font-style:italic; margin-top:12px;">
                "No spacer dies cold in the black while another ship still has hydrogen to spare." — Founding Charter, 2341 CE
            </p>
        </div>
    `;

    detailEl.innerHTML = `
        <div style="text-align:center; padding:18px 12px;">
            <div style="font-size:52px; margin-bottom:10px; filter: drop-shadow(0 0 15px var(--warning));">🐀</div>
            <h3 style="color:var(--warning); margin:0 0 10px 0; letter-spacing:2px;">PORT NOMAD SANCTUARY</h3>
            <p style="font-size:12px; color:var(--text-color); line-height:1.6; text-align:left; background:rgba(0,0,0,0.3); padding:12px; border-left:3px solid var(--warning);">
                ${isVIP
                    ? "Dispatch Chief Callaghan waves you into the priority bay: 'Good to see a friend of the Collective! Your hydrogen top-off and hull patch are on the house today.'"
                    : "Volunteer rescue pilots hustle between refueling rigs. Support the Collective's emergency fund to earn VIP standing, free sanctuary servicing, and access to the Fuel Rats Salvage Tug."}
            </p>
        </div>
    `;

    let btns = '';
    if (isVIP) {
        const needsService = (playerFuel < MAX_FUEL) || (playerHull < MAX_PLAYER_HULL);
        btns += `<button class="action-button" ${!needsService ? 'disabled' : ''} style="border-color:var(--success); color:var(--success);" onclick="executeFuelRatSanctuaryService('VIP_FREE')">${needsService ? '⛽ FREE VIP REFUEL & HULL OVERHAUL' : '✓ VESSEL ALREADY AT 100%'}</button>`;
    }
    btns += `
        <button class="action-button" ${playerCredits < 250 ? 'disabled' : ''} style="border-color:var(--warning); color:var(--warning);" onclick="executeFuelRatSanctuaryService('DONATE_250')">💰 DONATE TO RESCUE FUND (250c → +2 Rep)</button>
        <button class="action-button" ${playerCredits < 1000 ? 'disabled' : ''} style="border-color:var(--gold-text); color:var(--gold-text);" onclick="executeFuelRatSanctuaryService('DONATE_1000')">🏆 SPONSOR TUG OVERHAUL (1,000c → +8 Rep)</button>
        <button class="action-button" style="border-color:#888; color:#888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
    `;
    actionsEl.innerHTML = btns;
}

function executeFuelRatSanctuaryService(mode) {
    if (typeof unlockLoreEntry === 'function') unlockLoreEntry("FACTION_FUEL_RATS");

    if (mode === 'VIP_FREE') {
        playerFuel = MAX_FUEL;
        playerHull = MAX_PLAYER_HULL;
        playerShields = MAX_SHIELDS;
        logMessage("<span style='color:var(--warning)'>[ PORT NOMAD ]</span> Fuel Rats mechanics topped off your tanks and welded your hull on the house!");
        if (typeof showToast === 'function') showToast("VIP SANCTUARY SERVICE COMPLETE", "success");
        if (typeof soundManager !== 'undefined') soundManager.playGain();
    } else if (mode === 'DONATE_250') {
        if (playerCredits < 250) return;
        playerCredits -= 250;
        if (typeof playerFactionStanding !== 'undefined') {
            playerFactionStanding['FUEL_RATS'] = (playerFactionStanding['FUEL_RATS'] || 0) + 2;
        }
        logMessage("<span style='color:var(--warning)'>[ PORT NOMAD ]</span> Donated 250c to the Fuel Rats Collective (+2 Fuel Rats Rep).");
        if (typeof showToast === 'function') showToast("+2 FUEL RATS REP", "success");
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
    } else if (mode === 'DONATE_1000') {
        if (playerCredits < 1000) return;
        playerCredits -= 1000;
        if (typeof playerFactionStanding !== 'undefined') {
            playerFactionStanding['FUEL_RATS'] = (playerFactionStanding['FUEL_RATS'] || 0) + 8;
        }
        logMessage("<span style='color:var(--gold-text)'>[ PORT NOMAD ]</span> Sponsored a rescue tug overhaul for 1,000c (+8 Fuel Rats Rep)!");
        if (typeof showToast === 'function') showToast("+8 FUEL RATS REP", "success");
        if (typeof soundManager !== 'undefined') soundManager.playGain();
    }

    _refreshStationBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openFuelRatsSanctuary();
}

// --- STATE MANAGEMENT ---
// Persists throughout the session, storing which cantina image is assigned to which station.
if (typeof window._stationCantinaBannerAssignments === 'undefined') {
    window._stationCantinaBannerAssignments = {};
}

// --- CANTINA & RUMOR SYSTEM ---
function visitCantina() {
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const stationName = (location && location.name) ? location.name.toUpperCase() : "STARBASE";
    const faction = (location && location.faction) ? location.faction : "INDEPENDENT";

    let brandColor = "var(--accent-color)";
    if (faction === 'CONCORD') brandColor = "#4488FF";
    else if (faction === 'ECLIPSE') brandColor = "#9933FF";
    else if (faction === 'KTHARR') brandColor = "var(--danger)";
    else brandColor = "var(--success)";

    const isBlackMarket = Boolean(location && (location.name === 'The Rusty Anchor' || location.isBlackMarket));

    let flavorPool = [
        "The air is thick with smoke and the hum of a failing ventilation unit.",
        "A K'tharr mercenary eyes you suspiciously from the corner.",
        "Techno-jazz blares from speakers that have seen better days.",
        "The bartender polishes a glass with a rag that looks grease-stained."
    ];
    if (location && location.name === 'Frothy Moon Outpost') {
        flavorPool = [
            "Roasted dark synth-ale foams in heavy mugs while astronomers compare star-plates under the lunar dome.",
            "Through the panoramic viewport, deep-sky nebulae shimmer above the crater ridge."
        ];
    } else if (faction === 'KTHARR') {
        flavorPool = [
            "Heavy drums echo from the nearby Proving Grounds as off-duty K'tharr warriors slam iron tankards.",
            "The smell of volcanic sulfur and spiced blood-wine hangs over the trading pits."
        ];
    } else if (isBlackMarket) {
        brandColor = "#9C27B0";
        flavorPool = [
            "The air is thick with the smell of ozone, illegal stims, and quiet deals made in dark booths.",
            "Encrypted datapads change hands under flickering violet neon; nobody here uses their real callsign."
        ];
    }

    const randomFlavor = flavorPool[Math.floor(Math.random() * flavorPool.length)];

    // --- PERSISTENT RANDOMIZATION LOGIC (Existing Assets Only) ---
    const normalBanners = ['assets/outpost_cantina.png', 'assets/outpost_cantina2.png'];
    const rustyBanners = ['assets/rusty_cantina.png', 'assets/rusty_cantina2.png'];

    let assignedBanner = window._stationCantinaBannerAssignments[stationName];
    if (!assignedBanner) {
        const availableBanners = (location && location.name === 'The Rusty Anchor') ? rustyBanners : normalBanners;
        assignedBanner = availableBanners[Math.floor(Math.random() * availableBanners.length)];
        window._stationCantinaBannerAssignments[stationName] = assignedBanner;
    }

    openGenericModal(`${stationName} : CANTINA`);

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 15px; box-shadow: 0 0 25px ${brandColor}44; flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="${assignedBanner}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" onerror="this.onerror=null; this.src='assets/outpost_cantina.png';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">LOCAL AMENITIES</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <div style="font-size:50px; margin-bottom:15px; filter: drop-shadow(0 0 15px ${brandColor}); opacity:0.8;">🍻</div>
                        <h3 style="color:${brandColor}; margin-top:0; margin-bottom:10px; letter-spacing: 2px;">THE LOCAL WATERING HOLE</h3>
                        <p style="color:var(--text-color); font-size:13px; line-height:1.5; font-style:italic; background: rgba(0,0,0,0.3); padding: 10px; border-left: 2px solid ${brandColor}; text-align: left;">
                            "${_stationEscapeHtml(randomFlavor)}"
                        </p>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button full-width-btn" onclick="openStationView()" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');

    const actions = [
        { name: "Buy a Drink", desc: "Restores 10 Hull.", cost: "15c", icon: "🥃", fn: () => cantinaAction('DRINK') },
        { name: "Eavesdrop on Rumors", desc: "Listen to local chatter for clues.", cost: "FREE", icon: "👂", fn: () => listenToRumors() },
        { name: "Trade Intel", desc: "Buy the latest market trend data.", cost: "50c", icon: "📈", fn: () => cantinaAction('RUMOR') },
        { name: "Play Pazaak", desc: "Gamble with the locals (200c pot).", cost: "100c", icon: "🃏", fn: () => cantinaAction('GAMBLE') },
        { name: "Crew Recruitment", desc: "Hire specialized crew members.", cost: "VARIES", icon: "🧑‍🚀", fn: () => openRecruitmentBoard() }
    ];

    actions.forEach(act => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="font-size: 20px; filter: drop-shadow(0 0 5px ${brandColor});">${act.icon}</div>
                <div>
                    <div style="color:${brandColor}; font-weight:bold; font-size: 13px;">${act.name}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${act.desc}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <span style="color:var(--gold-text); font-weight:bold;">${act.cost}</span>
            </div>
        `;
        row.onclick = act.fn;
        listEl.appendChild(row);
    });
}

// ==========================================
// --- CANTINA ACTIONS ---
// ==========================================

function listenToRumors() {
    const detailEl = document.getElementById('genericDetailContent');
    if (typeof soundManager !== 'undefined' && soundManager.playUIHover) soundManager.playUIHover();

    let randomRumor = "The void is quiet today.";

    if (typeof window.getSmartRumor === 'function') {
        randomRumor = window.getSmartRumor();
    } else if (typeof RUMORS !== 'undefined' && RUMORS.length > 0) {
        randomRumor = RUMORS[Math.floor(Math.random() * RUMORS.length)];
    }

    if (detailEl) {
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <div style="font-size:48px; margin-bottom:10px;">🗣️</div>
                <h3 style="color:var(--accent-color); margin: 0 0 15px 0; font-size:22px;">LOCAL CHATTER</h3>
                
                <div style="text-align:left; background: var(--bg-color); border: 1px dashed var(--border-color); padding: 20px; border-radius: 4px;">
                    <p style="font-size:13px; color:var(--text-color); font-style:italic; margin:0; line-height:1.6;">
                        You sit quietly in a dark corner booth and tune your cybernetics to filter out the baseline noise.
                        <br><br>
                        <span style="color:var(--warning);">"...${_stationEscapeHtml(randomRumor)}"</span>
                    </p>
                </div>
            </div>
        `;
    }
}

function cantinaAction(action) {
    const detailEl = document.getElementById('genericDetailContent');

    if (action === 'DRINK') {
        if (playerCredits < 15) {
            if (typeof showToast === 'function') showToast("Not enough credits!", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }
        if (playerHull >= MAX_PLAYER_HULL) {
            if (typeof showToast === 'function') showToast("Hull integrity already maxed.", "info");
            return;
        }

        playerCredits -= 15;
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 10);

        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        logMessage(`<span style="color:var(--success);">[ REFRESHED ] You down the Synth-Ale. +10 Hull restored.</span>`);
        if (typeof showToast === 'function') showToast("Refreshing! Hull repaired +10.", "success");

        if (detailEl) {
            detailEl.innerHTML = `
                <div style="text-align:center; padding:24px 12px; animation: fadeIn 0.25s;">
                    <div style="font-size:48px; margin-bottom:10px;">🥃</div>
                    <h3 style="color:var(--success); margin:0 0 10px 0;">SYNTH-ALE SERVED</h3>
                    <p style="font-size:12px; color:var(--text-color); line-height:1.5;">
                        Warm, metallic, and strong enough to strip paint. A dockhand outside patches a loose bulkhead plate while you finish your mug.
                    </p>
                    <div style="color:var(--success); font-weight:bold; margin-top:12px;">+10 Hull (${Math.floor(playerHull)}/${MAX_PLAYER_HULL})</div>
                </div>
            `;
        }
        _refreshStationBars();
    } else if (action === 'RUMOR') {
        if (playerCredits < 50) {
            if (typeof showToast === 'function') showToast("Bartender ignores you. (Need 50c)", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }

        if (!activeMarketTrend || currentGameDate > activeMarketTrend.expiry) {
            if (typeof generateMarketTrend === 'function') generateMarketTrend();
        }

        const trend = activeMarketTrend;
        if (!trend || !trend.item) {
            if (typeof showToast === 'function') showToast("No fresh trade wires today.", "info");
            return;
        }

        playerCredits -= 50;
        const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[trend.item]) ? COMMODITIES[trend.item].name : trend.item;
        const statusDesc = trend.isBoom
            ? `folks at <span style="color:var(--accent-color);">${_stationEscapeHtml(trend.station)}</span> are desperate for <span style="color:var(--warning);">${_stationEscapeHtml(itemName)}</span> (paying 250% right now!).`
            : `a bulk freighter just flooded <span style="color:var(--accent-color);">${_stationEscapeHtml(trend.station)}</span> with <span style="color:var(--success);">${_stationEscapeHtml(itemName)}</span> (selling at 40%!).`;

        logMessage(`<span style="color:var(--accent-color); font-weight:bold;">[ INTEL ACQUIRED ]</span> "Heard ${statusDesc}"`);
        if (typeof showToast === 'function') showToast("TRADE INTEL ACQUIRED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playBuy();

        if (detailEl) {
            detailEl.innerHTML = `
                <div style="text-align:center; padding:20px 10px; animation: fadeIn 0.25s;">
                    <div style="font-size:48px; margin-bottom:10px;">📈</div>
                    <h3 style="color:var(--gold-text); margin:0 0 12px 0;">MARKET WIRE INTERCEPT</h3>
                    <div style="text-align:left; background:rgba(0,0,0,0.4); border-left:3px solid var(--gold-text); padding:14px; border-radius:4px; font-size:13px; line-height:1.6;">
                        "Heard ${statusDesc}"
                    </div>
                    <div style="font-size:11px; color:var(--item-desc-color); margin-top:10px;">
                        Expires around Stardate ${trend.expiry ? trend.expiry.toFixed(1) : 'soon'}
                    </div>
                </div>
            `;
        }
        _refreshStationBars();
    } else if (action === 'RECRUIT') {
        openRecruitmentBoard();
    } else if (action === 'GAMBLE') {
        if (playerCredits < 100) {
            if (typeof showToast === 'function') showToast("House limit is 100c.", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }

        playerCredits -= 100;
        const won = Math.random() > 0.55; // 45% Win Chance

        if (won) {
            const win = 200;
            playerCredits += win;
            if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();

            logMessage(`<span style="color:var(--gold-text); font-weight:bold;">[ PAZAAK WIN ] You cleared the table! +${win}c</span>`);
            if (typeof showToast === 'function') showToast(`YOU WON! (+${win}c)`, "success");
        } else {
            if (typeof soundManager !== 'undefined') soundManager.playError();

            logMessage(`<span style="color:var(--danger);">[ PAZAAK LOSS ] The dealer takes your credits with a smirk.</span>`);
            if (typeof showToast === 'function') showToast("You lost 100c.", "error");
        }

        if (detailEl) {
            const playerScore = won ? (18 + Math.floor(Math.random() * 3)) : (15 + Math.floor(Math.random() * 4));
            const houseScore = won ? Math.max(14, playerScore - 1 - Math.floor(Math.random() * 3)) : Math.min(20, playerScore + 1 + Math.floor(Math.random() * 2));

            detailEl.innerHTML = `
                <div style="text-align:center; padding:18px 10px; animation: fadeIn 0.2s;">
                    <div style="font-size:46px; margin-bottom:8px;">🃏</div>
                    <h3 style="color:${won ? 'var(--gold-text)' : 'var(--danger)'}; margin:0 0 10px 0;">${won ? 'PAZAAK VICTORY!' : 'HOUSE TAKES THE POT'}</h3>
                    <div class="trade-math-area" style="text-align:left; margin-bottom:12px;">
                        <div class="trade-stat-row"><span>Your Hand:</span> <span style="color:var(--accent-color); font-weight:bold;">${playerScore} / 20</span></div>
                        <div class="trade-stat-row"><span>Dealer Hand:</span> <span style="color:var(--warning); font-weight:bold;">${houseScore} / 20</span></div>
                        <div class="trade-stat-row" style="margin-top:6px; border-top:1px dashed #333; padding-top:6px;">
                            <span>Net Result:</span>
                            <span style="color:${won ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${won ? '+100c' : '-100c'}</span>
                        </div>
                    </div>
                    <button class="action-button" ${playerCredits < 100 ? 'disabled' : ''} style="border-color:var(--gold-text); color:var(--gold-text); padding:9px; font-size:11px;" onclick="cantinaAction('GAMBLE')">🃏 DEAL ANOTHER HAND (100c)</button>
                </div>
            `;
        }
        _refreshStationBars();
    }
}

// ==========================================
// --- CONCORD CUSTOMS SCAN ENGINE ---
// ==========================================

function _calculateCustomsExposure() {
    const contrabandFound = [];
    let hiddenCapacity = 0;

    if (typeof playerShip !== 'undefined' && playerShip.components) {
        const utilId = playerShip.components.utility || "UTIL_NONE";
        const util = COMPONENTS_DATABASE[utilId];
        if (util && util.stats && util.stats.isSmuggler) {
            hiddenCapacity = utilId === 'UTIL_ECLIPSE_DECOY_BAY' ? 8 : 5;
        }
    }

    for (const itemID in playerCargo) {
        const itemDef = COMMODITIES[itemID];
        if (playerCargo[itemID] > 0 && itemDef && itemDef.illegal) {
            let exposedQty = playerCargo[itemID];

            if (hiddenCapacity > 0) {
                const amountToHide = Math.min(exposedQty, hiddenCapacity);
                hiddenCapacity -= amountToHide;
                exposedQty -= amountToHide;
            }

            if (exposedQty > 0) {
                contrabandFound.push({ id: itemID, exposedQty });
            }
        }
    }

    let catchChance = contrabandFound.length > 0 ? (0.30 + (contrabandFound.length * 0.10)) : 0;
    catchChance *= (window.PLAYER_SIGNATURE || 1.0);
    if (typeof isSilentRunning !== 'undefined' && isSilentRunning) {
        catchChance *= 0.5;
    }

    return { contrabandFound, catchChance: Math.min(0.95, catchChance) };
}

function performCustomsScan() {
    const { contrabandFound, catchChance } = _calculateCustomsExposure();
    if (contrabandFound.length === 0) return true;

    logMessage("Scanning vessel signature...", true);

    if (Math.random() < catchChance) {
        if (typeof soundManager !== 'undefined') soundManager.playError();
        if (typeof triggerHaptic === 'function') triggerHaptic([200, 100, 200]);

        let fine = 0;
        contrabandFound.forEach(c => {
            const val = COMMODITIES[c.id].basePrice || 0;
            fine += (c.exposedQty * val * 0.5);

            playerCargo[c.id] -= c.exposedQty;
            if (playerCargo[c.id] <= 0) {
                delete playerCargo[c.id];
                if (window.playerCargoCostBasis) delete window.playerCargoCostBasis[c.id];
            }
        });

        fine = Math.floor(fine);

        const hasSmoothTalker = typeof playerPerks !== 'undefined' &&
            ((playerPerks.has && playerPerks.has('SMOOTH_TALKER')) ||
             (playerPerks.includes && playerPerks.includes('SMOOTH_TALKER')));

        if (hasSmoothTalker) {
            fine = Math.floor(fine / 2);
            logMessage("<span style='color:var(--accent-color)'>[ PERK ] Smooth Talker activated! You talked the fine down by 50%.</span>");
            if (typeof unlockLoreEntry === 'function') unlockLoreEntry('TACTIC_CUSTOMS_EVASION');
        }

        playerCredits = Math.max(0, playerCredits - fine);
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

        if (typeof playerActiveMission !== 'undefined' && playerActiveMission && playerActiveMission.id && playerActiveMission.id.startsWith("SMUGGLE_") && !playerCargo['HOT_CARGO']) {
            logMessage("<span style='color:var(--danger); font-weight:bold;'>[ CONTRACT FAILED ] The Tracked Contraband was seized by Concord Customs. The Cartel will not be pleased.</span>");
            playerActiveMission = null;
            if (typeof renderMissionTracker === 'function') renderMissionTracker();
        }

        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(5);

        if (typeof showConfirmationModal === 'function') {
            showConfirmationModal(
                `CUSTOMS ALERT: Contraband detected! Exposed cargo confiscated. Fined ${_stationFormat(fine)} credits.`,
                () => {}
            );
        }

        logMessage(`<span style="color:#FF4444">CUSTOMS VIOLATION:</span> ${_stationFormat(fine)}c fine assessed. Contraband seized.`);
        _refreshStationBars();
        if (typeof autoSaveGame === 'function') autoSaveGame();
        return false;
    } else {
        const stealthNote = (typeof isSilentRunning !== 'undefined' && isSilentRunning) ? " Silent Running baffled their sweep!" : "";
        logMessage(`<span style="color:#FFFF00">Scan Complete.</span> Sensors failed to detect concealed cargo.${stealthNote}`);
        return true;
    }
}

// ==========================================
// --- CONCORD FACTION SERVICES ---
// ==========================================

function clearConcordBounty() {
    if (playerNotoriety <= 0) {
        if (typeof showToast === 'function') showToast("Record Clean. Have a safe flight.", "info");
        return;
    }
    const fine = playerNotoriety * 500;
    if (playerCredits >= fine) {
        playerCredits -= fine;
        playerNotoriety = 0;

        if (typeof updateNotorietyTitle === 'function') updateNotorietyTitle();
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        if (typeof showToast === 'function') showToast(`CLEARED: Paid ${_stationFormat(fine)}c fine.`, "success");
        _refreshStationBars();
        if (typeof autoSaveGame === 'function') autoSaveGame();

        const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        if (location && typeof renderStationMenu === 'function') {
            renderStationMenu(location, 'CONCORD');
        }
    } else {
        if (typeof showToast === 'function') showToast(`INSUFFICIENT FUNDS (${_stationFormat(fine)}c required)`, "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
    }
}

// ==========================================
// --- CONCORD ARMORY (Military Surplus) ---
// ==========================================

function openConcordArmory() {
    openGenericModal("AEGIS ARMORY");

    const baseReqRep = 20;
    const concordRep = typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding["CONCORD"] || 0) : 0;
    const hasBaseClearance = concordRep >= baseReqRep;

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--accent-color); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 224, 224, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/armory_banner.png" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(this.parentElement) this.parentElement.style.display='none';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">AUTHORIZED REQUISITIONS</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <h3 style="color:var(--accent-color); margin-bottom:10px; letter-spacing: 2px;">CONCORD MUNITIONS</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5; font-style:italic;">
                            "Authorized personnel only. All equipment is strictly regulated under Concord Martial Law Section 4."
                        </p>
                        
                        <div style="margin-top: 20px; padding: 15px; background: rgba(0,224,224,0.05); border: 1px solid var(--accent-color); border-radius: 4px;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Base Armory Clearance</div>
                            <div style="font-size: 18px; font-weight: bold; font-family: var(--title-font); letter-spacing: 2px; color: ${hasBaseClearance ? 'var(--success)' : 'var(--danger)'};">
                                ${hasBaseClearance ? 'AUTHORIZED' : 'DENIED'}
                            </div>
                            <div style="font-size: 12px; color: var(--text-color); margin-top: 5px;">
                                Concord Reputation: ${concordRep} / ${baseReqRep}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const actionsEl = document.getElementById('genericModalActions');

    // Gather non-procedural, buyable Concord military hardware sorted by clearance then cost
    const concordItems = [];
    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        if (!comp || comp.cost <= 0 || comp.cost >= 999999 || compId.match(/_\d+$/)) continue;
        if (comp.manufacturer === 'CONCORD' || comp.reqFaction === 'CONCORD') {
            concordItems.push({ id: compId, ...comp });
        }
    }
    concordItems.sort((a, b) => ((a.minRep || 0) - (b.minRep || 0)) || ((a.cost || 0) - (b.cost || 0)));

    if (concordItems.length === 0) {
        listEl.innerHTML = `<div style="padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;">Shipment delayed. The Armory is currently awaiting new stock.</div>`;
        return;
    }

    concordItems.forEach(comp => {
        const itemReqRep = Math.max(baseReqRep, comp.minRep || 0);
        const itemCleared = concordRep >= itemReqRep;
        const isEquipped = playerShip && playerShip.components && playerShip.components[comp.slot] === comp.id;

        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";

        if (!itemCleared) {
            row.style.opacity = '0.45';
            row.innerHTML = `
                <div>
                    <div style="color:var(--danger); font-weight:bold; font-size: 13px;">🔒 ${_stationEscapeHtml(comp.name)}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${comp.slot.toUpperCase()} · Requires Concord Rep ${itemReqRep}</div>
                </div>
                <div style="text-align:right; color:#888; font-size:11px;">${_stationFormat(comp.cost)}c</div>
            `;
            row.onclick = () => {
                actionsEl.innerHTML = `
                    <button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>REQUIRES CONCORD REP ${itemReqRep} (${concordRep}/${itemReqRep})</button>
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
                `;
                if (typeof soundManager !== 'undefined') soundManager.playError();
            };
        } else {
            row.innerHTML = `
                <div>
                    <div style="color:${isEquipped ? 'var(--success)' : 'var(--accent-color)'}; font-weight:bold; font-size: 13px;">${isEquipped ? '✓ ' : ''}${_stationEscapeHtml(comp.name)}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${comp.slot.toUpperCase()} · Clearance ${itemReqRep}+</div>
                </div>
                <div style="text-align:right;">
                    <span style="color:${isEquipped ? 'var(--success)' : 'var(--gold-text)'}; font-weight:bold;">${isEquipped ? 'EQUIPPED' : _stationFormat(comp.cost) + 'c'}</span>
                </div>
            `;
            row.onclick = () => showConcordArmoryDetails(comp.id);
        }
        listEl.appendChild(row);
    });
}

function showConcordArmoryDetails(compId) {
    const comp = COMPONENTS_DATABASE[compId];
    if (!comp) return;

    const currentCompId = playerShip.components[comp.slot];
    const currentComp = COMPONENTS_DATABASE[currentCompId];
    const safeCompArg = _stationEscapeJsArg(compId);

    const willStowOld = Boolean(
        currentComp &&
        currentCompId !== 'UTIL_NONE' &&
        currentComp.cost < 999999 &&
        (currentCompId.startsWith('PROC_') || (currentComp.cost === 0 && currentComp.manufacturer === 'UNKNOWN'))
    );
    const tradeInValue = (currentComp && currentComp.cost < 999999 && !willStowOld) ? Math.floor(currentComp.cost * 0.5) : 0;
    const netCost = comp.cost - tradeInValue;

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Build concise stat readout for the item
    const statLines = [];
    if (comp.stats) {
        for (const [k, v] of Object.entries(comp.stats)) {
            const label = k.replace(/([A-Z])/g, ' $1').trim();
            let valText = v;
            if (typeof v === 'boolean') valText = v ? 'YES' : 'NO';
            else if (['hitChance', 'critChance', 'evasionBonus', 'accuracyBonus', 'scanBonus', 'signatureMod'].includes(k)) {
                valText = `${Math.round(v * 100)}%`;
            } else if (k === 'fuelEfficiency') {
                valText = `${Math.round(v * 100)}% Burn`;
            }
            statLines.push(`<div class="trade-stat-row"><span style="text-transform:capitalize;">${_stationEscapeHtml(label)}:</span> <span style="color:var(--accent-color); font-weight:bold;">${valText}</span></div>`);
        }
    }

    detailEl.innerHTML = `
        <div style="text-align: center; padding: 14px 0;">
            <div style="font-size: 46px; margin-bottom: 8px; filter: drop-shadow(0 0 10px rgba(0,224,224,0.4));">🛡️</div>
            <h3 style="color:var(--accent-color); margin-top:0; margin-bottom: 5px;">${_stationEscapeHtml(comp.name.toUpperCase())}</h3>
            
            <div style="background: rgba(0,224,224,0.1); border: 1px solid var(--accent-color); display: inline-block; padding: 3px 8px; border-radius: 2px; font-size: 10px; color: var(--accent-color); margin-bottom: 12px; letter-spacing: 1px;">
                MIL-SPEC ${comp.slot.toUpperCase()}
            </div>
            
            <p style="font-size:12px; color:var(--text-color); text-align:left; background:rgba(0,0,0,0.3); border-left:2px solid var(--accent-color); padding:10px; margin-bottom: 14px; line-height: 1.5;">${_stationEscapeHtml(comp.description)}</p>

            ${statLines.length > 0 ? `<div class="trade-math-area" style="text-align:left; margin-bottom:12px;">${statLines.join('')}</div>` : ''}
            
            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Requisition Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">${_stationFormat(comp.cost)}c</span></div>
                <div class="trade-stat-row" style="color:#888"><span>${willStowOld ? 'Old Prototype Stowed' : `Trade-In (${_stationEscapeHtml(currentComp ? currentComp.name : 'None')})`}:</span> <span>-${_stationFormat(tradeInValue)}c</span></div>
                <div class="trade-stat-row" style="margin-top:8px; border-top:1px dashed var(--border-color); padding-top:8px; font-weight:bold;">
                    <span style="color:var(--text-color);">NET COST:</span> <span style="color:var(--gold-text)">${_stationFormat(netCost)}c</span>
                </div>
            </div>
        </div>
    `;

    let btnHtml = "";
    if (playerShip.components[comp.slot] === compId) {
        btnHtml = `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>ALREADY EQUIPPED</button>`;
    } else if (playerCredits < netCost) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>INSUFFICIENT FUNDS (${_stationFormat(netCost)}c)</button>`;
    } else {
        btnHtml = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 15px rgba(0,224,224,0.2);" onclick="confirmBuyComponent('${safeCompArg}')">
                AUTHORIZE REQUISITION
            </button>
        `;
    }

    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>`;
    actionsEl.innerHTML = btnHtml;
}

function requestConcordEscort() {
    openGenericModal("NAVAL COMMAND : ESCORT WING");

    const cost = 1500;
    const duration = 10;
    const canAfford = playerCredits >= cost;
    const isAlreadyHired = window.concordEscortJumps && window.concordEscortJumps > 0;

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--accent-color); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 224, 224, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/escort_banner.png" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(this.parentElement) this.parentElement.style.display='none';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">SUPPORT WINGS</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    
                    <div class="trade-item-row" style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; background: rgba(0,224,224,0.1); border-left: 3px solid var(--accent-color);">
                        <div>
                            <div style="color:var(--accent-color); font-weight:bold; font-size: 13px;">Heavy Gunship Escort</div>
                            <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">Class-4 Support Vessel (12–26 DMG/Turn)</div>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:var(--gold-text); font-weight:bold;">${_stationFormat(cost)}c</span>
                        </div>
                    </div>
                    
                </div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <div style="font-size:50px; margin-bottom:10px; filter: drop-shadow(0 0 10px rgba(0,224,224,0.4));">🛡️</div>
                        <h3 style="color:var(--accent-color); margin-top:0; margin-bottom:10px; letter-spacing: 2px;">AEGIS ESCORT WING</h3>
                        
                        <p style="color:var(--text-color); font-size:13px; line-height:1.5; text-align:left; background:rgba(0,0,0,0.3); border-left:2px solid var(--accent-color); padding:10px; margin-bottom: 20px;">
                            "Space is dangerous, Commander. For a fee, we can assign a heavy gunship to shadow your vessel and provide automated covering fire during combat encounters."
                        </p>
                        
                        <div class="trade-math-area" style="text-align:left;">
                            <div class="trade-stat-row"><span>Contract Duration:</span> <span style="color:var(--text-color); font-weight:bold;">${duration} Flight Moves</span></div>
                            <div class="trade-stat-row"><span>Service Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">${_stationFormat(cost)}c</span></div>
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
            </div>
        </div>
    `;

    const actionsEl = document.getElementById('genericModalActions');

    if (isAlreadyHired) {
        actionsEl.innerHTML = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>ESCORT ACTIVE (${window.concordEscortJumps} MOVES LEFT)</button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
        `;
    } else if (!canAfford) {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>INSUFFICIENT FUNDS (${_stationFormat(cost)}c)</button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 15px rgba(0,224,224,0.2);" 
                onclick="executeConcordEscort(${cost}, ${duration})">
                AUTHORIZE CONTRACT
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
        `;
    }
}

function executeConcordEscort(cost, duration) {
    if (playerCredits < cost) return;
    playerCredits -= cost;
    window.concordEscortJumps = duration;

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    logMessage(`<span style='color:var(--accent-color); font-weight:bold;'>[ AEGIS COMMAND ]</span> Escort wing assigned. They will shadow you for ${duration} moves.`);
    if (typeof showToast === 'function') showToast("ESCORT WING HIRED", "success");

    _refreshStationBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openStationView();
}

// ==========================================
// --- K'THARR FACTION SERVICES ---
// ==========================================

function openBloodPitsTrade() {
    openGenericModal("THE BLOOD PITS : BIOMATERIALS");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
    const needsHull = typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull < MAX_PLAYER_HULL;

    if (listEl) {
        listEl.innerHTML = `
            <div class="trade-list-header" style="color:var(--danger); font-size:10px; letter-spacing:2px;">FLESH-FORGE OFFERINGS</div>
            <div style="padding:14px; font-size:12px; color:var(--text-color); line-height:1.6;">
                <div class="trade-math-area">
                    <div class="trade-stat-row"><span>2x Living Hull Tissue (+2 Rep):</span> <span style="color:var(--gold-text); font-weight:bold;">1,400c</span></div>
                    <div class="trade-stat-row"><span>Direct Bio-Graft (+50 Hull):</span> <span style="color:var(--gold-text); font-weight:bold;">450c</span></div>
                    <div class="trade-stat-row"><span>Cargo Bay Free:</span> <span style="color:var(--accent-color); font-weight:bold;">${spaceLeft}t</span></div>
                </div>
                <p style="font-size:11px; color:var(--item-desc-color); font-style:italic; margin-top:10px;">
                    Note: Living Hull Tissue is classified contraband in Concord Core space. Activate it from Cargo (I) in emergencies to knit +60 Hull.
                </p>
            </div>
        `;
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:56px; margin-bottom:12px; color:var(--danger); animation: pulse-danger-subtle 3s infinite;">🧬</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">THE FLESH MARKET</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "We don't deal in brittle Concord alloys here. We breed living armor in volcanic vats. Buy a canister for the road, or let our bio-smiths graft your hull directly."
            </p>
        </div>
    `;

    const canBuyPack = playerCredits >= 1400 && spaceLeft >= 2;
    const canBioGraft = playerCredits >= 450 && needsHull;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--danger); color:var(--danger);" ${!canBuyPack ? 'disabled' : ''} onclick="executeBloodPitTrade('TISSUE')">
            PURCHASE 2x LIVING HULL TISSUE (1,400c)
        </button>
        <button class="action-button" style="border-color:var(--success); color:var(--success);" ${!canBioGraft ? 'disabled' : ''} onclick="executeBloodPitTrade('GRAFT')">
            ${needsHull ? 'DIRECT BIO-GRAFT OVERHAUL (+50 Hull, 450c)' : 'HULL ALREADY AT 100%'}
        </button>
        <button class="action-button" style="border-color:#888; color:#888;" onclick="openStationView()">◀ LEAVE BLOOD PITS</button>
    `;
}

function executeBloodPitTrade(mode = 'TISSUE') {
    if (mode === 'GRAFT') {
        if (playerCredits < 450 || playerHull >= MAX_PLAYER_HULL) return;
        playerCredits -= 450;
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 50);
        if (typeof soundManager !== 'undefined') soundManager.playRepair();
        logMessage("<span style='color:var(--success)'>[ BLOOD PITS ]</span> Bio-smiths grafted living carapace across your outer breaches (+50 Hull).");
        if (typeof showToast === 'function') showToast("BIO-GRAFT COMPLETE (+50 HULL)", "success");
    } else {
        if (playerCredits < 1400) return;
        const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
        if (spaceLeft < 2) {
            if (typeof showToast === 'function') showToast("Need 2 free cargo space!", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }

        playerCredits -= 1400;
        playerCargo["LIVING_HULL_TISSUE"] = (playerCargo["LIVING_HULL_TISSUE"] || 0) + 2;
        if (typeof playerFactionStanding !== 'undefined') {
            playerFactionStanding['KTHARR'] = (playerFactionStanding['KTHARR'] || 0) + 2;
        }
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        if (typeof soundManager !== 'undefined') soundManager.playGain();

        logMessage("<span style='color:var(--danger)'>[ BLOOD PITS ]</span> Purchased 2x Living Hull Tissue (+2 K'tharr Rep).");
        if (typeof showToast === 'function') showToast("ACQUIRED 2x LIVING TISSUE", "success");
    }

    _refreshStationBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    openBloodPitsTrade();
}

function challengeKtharrWarlord() {
    openGenericModal("RITE OF COMBAT");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const hullPct = Math.round((playerHull / Math.max(1, MAX_PLAYER_HULL)) * 100);
    const shldPct = Math.round((playerShields / Math.max(1, MAX_SHIELDS)) * 100);

    if (listEl) {
        listEl.innerHTML = `
            <div class="trade-list-header" style="color:var(--danger); font-size:10px; letter-spacing:2px;">COMBAT READINESS</div>
            <div style="padding:14px; font-size:12px;">
                <div class="trade-math-area">
                    <div class="trade-stat-row"><span>Your Hull:</span> <span style="color:${hullPct >= 75 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${Math.floor(playerHull)}/${MAX_PLAYER_HULL} (${hullPct}%)</span></div>
                    <div class="trade-stat-row"><span>Your Shields:</span> <span style="color:var(--accent-color); font-weight:bold;">${Math.floor(playerShields)}/${MAX_SHIELDS} (${shldPct}%)</span></div>
                    <div class="trade-stat-row"><span>Victory Honor:</span> <span style="color:var(--gold-text); font-weight:bold;">+50 K'tharr Rep</span></div>
                </div>
                <p style="font-size:11px; color:var(--item-desc-color); margin-top:10px;">
                    Enemy Profile: <b>Kaeber's Wrath</b> (Blood-Dreadnought · 260+ Base Hull, Heavy Artillery).
                </p>
            </div>
        `;
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:56px; margin-bottom:12px; color:var(--danger);">💀</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">WARLORD CHALLENGE</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "You dare challenge the Warlord of Karak-Tor? If you undock now, it is a fight to the death. Tractor beams lock the arena. No retreat. No hailing. Only blood."
            </p>
            <div style="margin-top:15px; padding: 10px; background: rgba(255,0,0,0.1); border: 1px solid var(--danger);">
                <p style="color:var(--warning); font-weight:bold; margin:0; font-size:12px;">
                    WARNING: DEADLY BOSS ENCOUNTER (NO ESCAPE)
                </p>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button danger-btn" style="box-shadow: 0 0 15px rgba(255,0,0,0.3);" onclick="executeWarlordChallenge()">ACCEPT THE RITE (UNDOCK)</button>
        <button class="action-button" onclick="openStationView()">COWER IN FEAR (Cancel)</button>
    `;
}

function executeWarlordChallenge() {
    closeGenericModal();
    closeStationView();

    logMessage("<span style='color:var(--danger); font-weight:bold;'>[ RITE OF COMBAT ] The station alarms blare as you undock. The Warlord's Dreadnought drops into real-space right on top of you!</span>");

    const warlord = {
        shipClassKey: "KTHARR_WARLORD",
        isBoss: true,
        name: "Kaeber's Wrath (Warlord)"
    };

    if (typeof startCombat === 'function') {
        setTimeout(() => { startCombat(warlord); }, 800);
    }
}

// ==========================================
// --- ECLIPSE MERCENARY DEN ---
// ==========================================

function openMercenaryDen() {
    openGenericModal("MERCENARY DEN");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    listEl.innerHTML = `<div class="trade-list-header" style="color:#9933FF; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">SHADOW OPERATIVES</div>`;

    const crewArr = (typeof playerCrew !== 'undefined' && Array.isArray(playerCrew)) ? playerCrew : [];

    if (typeof ECLIPSE_MERCENARIES !== 'undefined' && Array.isArray(ECLIPSE_MERCENARIES)) {
        ECLIPSE_MERCENARIES.forEach(merc => {
            const isHired = crewArr.some(c => c && c.id === merc.id);
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
            if (isHired) row.style.opacity = '0.4';

            row.innerHTML = `
                <div>
                    <div style="color:var(--danger); font-weight:bold; font-size: 13px;">${_stationEscapeHtml(merc.name)}</div>
                    <div style="color:var(--text-color); font-size: 10px; margin-top: 4px;">${_stationEscapeHtml(merc.role)}</div>
                </div>
                <div style="text-align:right;">
                    <span style="color:var(--gold-text); font-weight:bold;">${isHired ? 'HIRED' : _stationFormat(merc.cost) + 'c'}</span>
                </div>
            `;

            if (!isHired) row.onclick = () => showMercenaryDetails(merc);
            listEl.appendChild(row);
        });
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: grayscale(100%);">🗡️</div>
            <h3 style="color:#9933FF; margin-bottom:10px;">SHADOW OPERATIVES</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Need someone who doesn't ask questions? Our operatives increase your ship's combat lethality, but they have... sticky fingers. Keep their loyalty high if you want your cargo left alone."
            </p>
        </div>
    `;

    actionsEl.innerHTML = `<button class="action-button" onclick="openStationView()">RETURN TO CONCOURSE</button>`;
}

function showMercenaryDetails(merc) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl || !merc) return;

    const crewArr = (typeof playerCrew !== 'undefined' && Array.isArray(playerCrew)) ? playerCrew : [];
    const maxCrew = typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3;
    const evaPct = (merc.stats && merc.stats.evasionBonus) ? Math.round(merc.stats.evasionBonus * 100) : 0;
    const drawbackPct = (merc.drawback && merc.drawback.chance) ? Math.round(merc.drawback.chance * 100) : 0;
    const safeMercId = _stationEscapeJsArg(merc.id);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <div style="font-size:50px; margin-bottom:10px;">🥷</div>
            <h3 style="color:var(--danger); margin:0 0 15px 0;">${_stationEscapeHtml(merc.name.toUpperCase())}</h3>
            
            <p style="color:var(--text-color); font-size:12px; line-height:1.5; text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--danger); margin-bottom:20px;">
                "${_stationEscapeHtml(merc.desc)}"
            </p>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Contract Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">${_stationFormat(merc.cost)}c</span></div>
                ${(merc.stats && merc.stats.damageBonus) ? `<div class="trade-stat-row"><span>Combat Bonus:</span> <span style="color:var(--success); font-weight:bold;">+${merc.stats.damageBonus} Damage</span></div>` : ''}
                ${evaPct > 0 ? `<div class="trade-stat-row"><span>Evasion Bonus:</span> <span style="color:var(--success); font-weight:bold;">+${evaPct}%</span></div>` : ''}
                ${merc.drawback ? `
                    <div class="trade-stat-row" style="margin-top: 10px; border-top: 1px dashed var(--danger); padding-top: 10px;">
                        <span style="color:var(--danger);">Known Drawback:</span>
                        <span style="color:var(--text-color);">${_stationEscapeHtml(merc.drawback.type.replace(/_/g, ' '))} (${drawbackPct}% Chance)</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    if (playerCredits < merc.cost) {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" disabled>INSUFFICIENT FUNDS (${_stationFormat(merc.cost)}c)</button>
            <button class="action-button" onclick="openMercenaryDen()">◀ BACK TO ROSTER</button>
        `;
    } else if (crewArr.length >= maxCrew) {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" disabled>CREW QUARTERS FULL (${crewArr.length}/${maxCrew})</button>
            <button class="action-button" onclick="openMercenaryDen()">◀ BACK TO ROSTER</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 10px rgba(153, 51, 255, 0.2);" onclick="hireMercenary('${safeMercId}')">
                HIRE OPERATIVE
            </button>
            <button class="action-button" onclick="openMercenaryDen()">◀ CANCEL</button>
        `;
    }
}

// ==========================================
// --- K'THARR PROVING GROUNDS UI ---
// ==========================================

function openProvingGrounds() {
    openGenericModal("THE BLOOD PITS : ARENA BETTING");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    const gladiators = [
        { name: "Kaelen's Wrath", species: "K'tharr Warlord", odds: 1.5, winChance: 0.65, icon: "🪓", color: "var(--danger)", bio: "Undefeated champion of the basalt ring. Wields a dual-edged plasma glaive." },
        { name: "Unit-77", species: "Hacked Loader Mech", odds: 3.0, winChance: 0.35, icon: "🤖", color: "var(--warning)", bio: "Industrial cargo walker welded with mining cutters and zero pain limiters." },
        { name: "The Void-Stalker", species: "Captured Xenomorph", odds: 5.0, winChance: 0.18, icon: "🕷️", color: "#9933FF", bio: "Apex Death-World predator dragged from the outer rim in stasis chains." },
        { name: "Vex the Iron-Jaw", species: "Cyborg Pit-Fighter", odds: 2.2, winChance: 0.45, icon: "🦾", color: "var(--accent-color)", bio: "Disgraced Concord marine fighting off debt with military reflex chrome." }
    ];

    listEl.innerHTML = `<div style="padding:15px; color:var(--danger); font-family:var(--title-font); border-bottom:2px solid var(--danger); text-align:center; letter-spacing:2px;">TODAY'S MATCHES</div>`;

    gladiators.forEach(glad => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">${glad.icon}</span>
                <div>
                    <div style="color:${glad.color}; font-weight:bold; font-size:13px;">${_stationEscapeHtml(glad.name.toUpperCase())}</div>
                    <div style="color:var(--item-desc-color); font-size:10px;">${_stationEscapeHtml(glad.species)}</div>
                </div>
            </div>
            <div style="color:var(--gold-text); font-weight:bold; font-size:13px;">${glad.odds}x Payout</div>
        `;
        row.onclick = () => showGladiatorDetails(glad);
        listEl.appendChild(row);
    });

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(255,0,0,0.5));">⚔️</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">THE RITE OF COMBAT</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Place your credits, outlander. Blood waters the sands of Karak-Tor, and fortune favors the bold. High-roller winners earn Hegemony respect."
            </p>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button" onclick="openStationView()">LEAVE ARENA</button>`;
}

function showGladiatorDetails(glad) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl || !glad) return;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 18px;">
            <div style="font-size:48px; margin-bottom:8px;">${glad.icon}</div>
            <h3 style="color:${glad.color}; margin:0 0 8px 0;">${_stationEscapeHtml(glad.name.toUpperCase())}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); font-style:italic; margin:0 0 14px 0;">"${_stationEscapeHtml(glad.bio || glad.species)}"</p>
            
            <div class="trade-math-area" style="border-color:var(--danger); background:rgba(50,0,0,0.2); text-align:left;">
                <div class="trade-stat-row"><span>Current Odds:</span> <span style="color:var(--gold-text); font-weight:bold;">${glad.odds}x Payout</span></div>
                <div class="trade-stat-row"><span>Est. Win Chance:</span> <span style="color:var(--text-color); font-weight:bold;">~${Math.round(glad.winChance * 100)}%</span></div>
            </div>
            
            <p style="font-size:11px; color:var(--text-color); margin-top:14px;">Select your wager below. Winning a 1,000c High-Roller bet also earns +1 K'tharr Rep.</p>
        </div>
    `;

    const canBet100 = playerCredits >= 100;
    const canBet500 = playerCredits >= 500;
    const canBet1000 = playerCredits >= 1000;

    actionsEl.innerHTML = `
        <div style="display:flex; gap:8px; width:100%;">
            <button class="action-button" style="flex:1; margin:0; padding:10px 4px; font-size:11px; border-color:var(--danger); color:var(--danger);" ${!canBet100 ? 'disabled' : ''} onclick="processArenaBet(${glad.winChance}, ${glad.odds}, 100)">100c</button>
            <button class="action-button" style="flex:1; margin:0; padding:10px 4px; font-size:11px; border-color:var(--danger); color:var(--danger);" ${!canBet500 ? 'disabled' : ''} onclick="processArenaBet(${glad.winChance}, ${glad.odds}, 500)">500c</button>
            <button class="action-button" style="flex:1; margin:0; padding:10px 4px; font-size:11px; border-color:var(--gold-text); color:var(--gold-text);" ${!canBet1000 ? 'disabled' : ''} onclick="processArenaBet(${glad.winChance}, ${glad.odds}, 1000)">1,000c</button>
        </div>
        <button class="action-button" style="margin-top:10px;" onclick="openStationView()">CANCEL</button>
    `;
}

function processArenaBet(winChance, odds, betAmount) {
    if (playerCredits < betAmount) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT CREDITS", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    playerCredits -= betAmount;
    _refreshStationBars();

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    if (detailEl) {
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <div style="font-size:50px; animation: shake-effect 0.5s infinite;">💥</div>
                <h3 style="color:var(--warning); margin-top:20px;">COMBAT IN PROGRESS...</h3>
            </div>
        `;
    }
    if (actionsEl) actionsEl.innerHTML = '';
    if (typeof soundManager !== 'undefined') soundManager.playLaser();

    setTimeout(() => {
        const won = Math.random() < winChance;
        let repNote = "";

        if (won) {
            const payout = Math.floor(betAmount * odds);
            playerCredits += payout;
            if (betAmount >= 1000 && typeof playerFactionStanding !== 'undefined') {
                playerFactionStanding['KTHARR'] = (playerFactionStanding['KTHARR'] || 0) + 1;
                repNote = " (+1 K'tharr Rep)";
            }

            if (typeof soundManager !== 'undefined') soundManager.playGain();
            logMessage(`<span style="color:var(--success)">[ ARENA ] Won wager! Paid out ${_stationFormat(payout)} credits${repNote}.</span>`);

            const titleEl = document.getElementById('genericModalTitle');
            const modalEl = document.getElementById('genericModalOverlay');
            if (modalEl && modalEl.style.display === 'flex' && titleEl && titleEl.textContent === "THE BLOOD PITS : ARENA BETTING") {
                if (detailEl) {
                    detailEl.innerHTML = `
                        <div style="text-align:center; padding: 30px;">
                            <div style="font-size:60px; margin-bottom:15px; color:var(--success);">🏆</div>
                            <h3 style="color:var(--success); margin:0 0 10px 0;">VICTORY!</h3>
                            <p style="color:var(--text-color);">Your champion stands over their defeated foe.</p>
                            <div style="color:var(--gold-text); font-size:24px; font-weight:bold; margin-top:16px;">+${_stationFormat(payout)}c</div>
                            ${repNote ? `<div style="color:var(--success); font-size:12px; margin-top:6px;">${repNote}</div>` : ''}
                        </div>
                    `;
                }
                if (actionsEl) {
                    actionsEl.innerHTML = `
                        <button class="action-button" onclick="openProvingGrounds()">PLACE ANOTHER WAGER</button>
                        <button class="action-button" style="border-color:#888; color:#888;" onclick="openStationView()">◀ LEAVE ARENA</button>
                    `;
                }
            }
        } else {
            if (typeof soundManager !== 'undefined') soundManager.playError();
            if (typeof triggerHaptic === 'function') triggerHaptic(150);
            logMessage(`<span style="color:var(--danger)">[ ARENA ] Champion defeated. Lost ${_stationFormat(betAmount)} credits.</span>`);

            const titleEl = document.getElementById('genericModalTitle');
            const modalEl = document.getElementById('genericModalOverlay');
            if (modalEl && modalEl.style.display === 'flex' && titleEl && titleEl.textContent === "THE BLOOD PITS : ARENA BETTING") {
                if (detailEl) {
                    detailEl.innerHTML = `
                        <div style="text-align:center; padding: 30px;">
                            <div style="font-size:60px; margin-bottom:15px; color:var(--danger);">💀</div>
                            <h3 style="color:var(--danger); margin:0 0 10px 0;">DEFEAT.</h3>
                            <p style="color:var(--text-color);">Your champion was brutally executed. The house takes your wager.</p>
                            <div style="color:var(--danger); font-size:20px; font-weight:bold; margin-top:16px;">-${_stationFormat(betAmount)}c</div>
                        </div>
                    `;
                }
                if (actionsEl) {
                    actionsEl.innerHTML = `
                        <button class="action-button" onclick="openProvingGrounds()">PLACE ANOTHER WAGER</button>
                        <button class="action-button" style="border-color:#888; color:#888;" onclick="openStationView()">◀ LEAVE ARENA</button>
                    `;
                }
            }
        }

        _refreshStationBars();
        if (typeof autoSaveGame === 'function') autoSaveGame();
    }, 1400);
}

// ==========================================
// --- MARINE BARRACKS (GROUND FORCES) ---
// ==========================================

function _ensureShipForces() {
    if (typeof playerShip !== 'undefined' && playerShip && !playerShip.forces) {
        playerShip.forces = { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: 20 };
    }
    return (typeof playerShip !== 'undefined' && playerShip) ? playerShip.forces : { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: 20 };
}

function openBarracksUI() {
    openGenericModal("AEGIS MARINE BARRACKS");

    const forces = _ensureShipForces();
    const maxTroops = forces.maxTroops || 20;
    const currentMarines = forces.marines || 0;
    const currentMechs = forces.heavyMechs || 0;

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--accent-color); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 224, 224, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/barracks_banner.png" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(this.parentElement) this.parentElement.style.display='none';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">GROUND FORCES FOR HIRE</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(0,224,224,0.4)); opacity:0.8;">🪖</div>
                        <h3 style="color:var(--accent-color); margin-top:0; margin-bottom:10px;">EXPEDITIONARY FORCES</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                            "You can't conquer a pirate stronghold from orbit, Commander. Hire ground troops to board crippled ships for 3x salvage and assault fortified Cartel bases."
                        </p>
                        
                        <div class="trade-math-area" style="margin-top: 20px; background: rgba(0, 224, 224, 0.05); border: 1px dashed var(--accent-color);">
                            <div style="color: var(--accent-color); font-size: 11px; margin-bottom: 8px; font-weight: bold; letter-spacing: 1px;">CURRENT MANIFEST</div>
                            <div style="display:flex; justify-content:space-between; font-size: 13px; margin-bottom: 5px;">
                                <span style="color:var(--text-color)">Active Marines:</span> 
                                <span style="color:${currentMarines > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${currentMarines} / ${maxTroops}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size: 13px;">
                                <span style="color:var(--text-color)">Heavy Mechs:</span> 
                                <span style="color:var(--warning); font-weight:bold;">${currentMechs} / ${maxTroops}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');

    const marineRow = document.createElement('div');
    marineRow.className = 'trade-item-row';
    marineRow.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
    marineRow.innerHTML = `
        <div>
            <div style="color:var(--accent-color); font-weight:bold; font-size: 13px;">Mercenary Platoon</div>
            <div style="color:var(--success); font-size: 10px; margin-top: 4px;">+10 Marines</div>
        </div>
        <div style="text-align:right;">
            <span style="color:var(--gold-text); font-weight:bold;">5,000c</span>
        </div>
    `;
    marineRow.onclick = () => showTroopDetails('MERCENARY_PLATOON');
    listEl.appendChild(marineRow);

    const mechRow = document.createElement('div');
    mechRow.className = 'trade-item-row';
    mechRow.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
    mechRow.innerHTML = `
        <div>
            <div style="color:var(--warning); font-weight:bold; font-size: 13px;">Goliath Assault Mech</div>
            <div style="color:var(--success); font-size: 10px; margin-top: 4px;">+1 Heavy Mech (+50% Raid Firepower)</div>
        </div>
        <div style="text-align:right;">
            <span style="color:var(--gold-text); font-weight:bold;">15,000c</span>
        </div>
    `;
    mechRow.onclick = () => showTroopDetails('ASSAULT_MECH');
    listEl.appendChild(mechRow);
}

function showTroopDetails(itemId) {
    const item = (typeof COMMODITIES !== 'undefined' && COMMODITIES[itemId]) ? COMMODITIES[itemId] : {
        name: itemId === 'ASSAULT_MECH' ? 'Goliath Assault Mech' : 'Mercenary Platoon',
        basePrice: itemId === 'ASSAULT_MECH' ? 15000 : 5000,
        isVehicle: itemId === 'ASSAULT_MECH',
        description: "Hardened expeditionary ground forces."
    };

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const forces = _ensureShipForces();
    const maxTroops = forces.maxTroops || 20;
    const currentMarines = forces.marines || 0;
    const currentMechs = forces.heavyMechs || 0;

    let isFull = false;
    if (itemId === 'MERCENARY_PLATOON' && currentMarines + 10 > maxTroops) {
        isFull = true;
    } else if (itemId === 'ASSAULT_MECH' && currentMechs + 1 > maxTroops) {
        isFull = true;
    }

    const typeColor = item.isVehicle ? "var(--warning)" : "var(--accent-color)";
    const safeItemArg = _stationEscapeJsArg(itemId);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 16px 0;">
            <div style="font-size:48px; margin-bottom:8px; filter: drop-shadow(0 0 10px ${typeColor});">${item.isVehicle ? '🤖' : '🪖'}</div>
            <h3 style="color:var(--item-name-color); margin:0 0 12px 0;">${_stationEscapeHtml(item.name.toUpperCase())}</h3>
            
            <p style="color:var(--text-color); font-size:12px; line-height:1.5; text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${typeColor}; margin-bottom:16px;">
                "${_stationEscapeHtml(item.description)}"
            </p>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Contract Cost:</span> <span style="color:var(--gold-text); font-weight:bold;">${_stationFormat(item.basePrice)}c</span></div>
                <div class="trade-stat-row"><span>Force Yield:</span> <span style="color:var(--success); font-weight:bold;">${item.isVehicle ? '+1 Heavy Mech' : '+10 Marines'}</span></div>
                <div class="trade-stat-row" style="margin-top:6px; border-top:1px dashed #333; padding-top:6px;">
                    <span>Current Aboard:</span>
                    <span style="color:${typeColor}; font-weight:bold;">${item.isVehicle ? `${currentMechs} / ${maxTroops} Mechs` : `${currentMarines} / ${maxTroops} Marines`}</span>
                </div>
            </div>
        </div>
    `;

    let btnHtml = "";
    if (playerCredits < item.basePrice) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>INSUFFICIENT FUNDS (${_stationFormat(item.basePrice)}c)</button>`;
    } else if (isFull) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>BARRACKS CAPACITY EXCEEDED</button>`;
    } else {
        btnHtml = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:${typeColor}; color:${typeColor}; box-shadow: 0 0 15px rgba(0,224,224,0.2);" onclick="purchaseTroops('${safeItemArg}', ${item.basePrice})">
                AUTHORIZE DEPLOYMENT
            </button>
        `;
    }

    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openBarracksUI()">◀ BACK TO BARRACKS</button>`;
    actionsEl.innerHTML = btnHtml;
}

function purchaseTroops(itemId, cost) {
    if (playerCredits < cost) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT CREDITS", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    const forces = _ensureShipForces();
    const maxTroops = forces.maxTroops || 20;

    if (itemId === 'MERCENARY_PLATOON') {
        if ((forces.marines || 0) + 10 > maxTroops) {
            logMessage("<span style='color:var(--danger)'>[ BARRACKS ] Troop capacity exceeded. Cannot accommodate more Marines.</span>");
            if (typeof showToast === 'function') showToast("BARRACKS FULL", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }
        playerCredits -= cost;
        forces.marines = (forces.marines || 0) + 10;
        logMessage(`<span style="color:var(--success)">[ BARRACKS ] 10 Marines boarded the vessel (${forces.marines}/${maxTroops}).</span>`);
        if (typeof showToast === 'function') showToast("+10 MARINES RECRUITED", "success");
    } else if (itemId === 'ASSAULT_MECH') {
        if ((forces.heavyMechs || 0) + 1 > maxTroops) {
            logMessage("<span style='color:var(--danger)'>[ BARRACKS ] Vehicle bay capacity exceeded. Cannot accommodate more Mechs.</span>");
            if (typeof showToast === 'function') showToast("VEHICLE BAY FULL", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }
        playerCredits -= cost;
        forces.heavyMechs = (forces.heavyMechs || 0) + 1;
        logMessage(`<span style="color:var(--warning)">[ BARRACKS ] Goliath Assault Mech loaded into the vehicle bay (${forces.heavyMechs}/${maxTroops}).</span>`);
        if (typeof showToast === 'function') showToast("+1 ASSAULT MECH LOADED", "success");
    }

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    _refreshStationBars();
    if (typeof autoSaveGame === 'function') autoSaveGame();

    showTroopDetails(itemId);
}

// ==========================================
// --- PUBLIC STATION UTILITY API ---
// ==========================================

window.StationUtils = {
    getCurrentStation() {
        if (typeof chunkManager === 'undefined' || typeof playerX === 'undefined') return null;
        const tile = chunkManager.getTile(playerX, playerY);
        return (tile && tile.type === 'location') ? tile : null;
    },
    isDocked() {
        const s = this.getCurrentStation();
        return Boolean(s && (s.isMajorHub || s.char === OUTPOST_CHAR_VAL || s.isBlackMarket || s.isPlayerOwned));
    },
    getCustomsRiskEstimate() {
        const { contrabandFound, catchChance } = _calculateCustomsExposure();
        return {
            exposedTypes: contrabandFound.length,
            catchPercent: Math.round(catchChance * 100)
        };
    }
};

// --- END OF FILE stations.js ---
