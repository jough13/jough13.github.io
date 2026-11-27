// --- START OF FILE trade.js ---

// Track average purchase price per item ID for live profit/loss telemetry
window.playerCargoCostBasis = window.playerCargoCostBasis || {};
window.currentTradeFilter = window.currentTradeFilter || 'ALL';
window._brokerSmuggleOffers = window._brokerSmuggleOffers || {};

// ==========================================
// --- INTERNAL TRADE HELPERS ---
// ==========================================

function _tradeEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _tradeEscapeJsArg(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function _tradeFormat(num) {
    if (typeof formatNumber === 'function') return formatNumber(num);
    return String(Math.trunc(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Safe helper to check player perks whether stored as a Set or Array
function _tradeHasPerk(perkId) {
    if (typeof hasPlayerPerk === 'function') return hasPlayerPerk(perkId);
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

function _tradeBearing(dx, dy) {
    if (dx === 0 && dy === 0) return "HERE";
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const idx = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return dirs[(idx + 8) % 8];
}

function _tradeDistAndBearing(tx, ty) {
    const px = typeof playerX !== 'undefined' ? playerX : 0;
    const py = typeof playerY !== 'undefined' ? playerY : 0;
    const dx = tx - px;
    const dy = ty - py;
    return {
        distance: Math.floor(Math.sqrt(dx * dx + dy * dy)),
        bearing: _tradeBearing(dx, dy)
    };
}

// Helper to refresh both the background HUD and the active modal's top info bar
function _refreshTradeHUD() {
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof updateModalInfoBar === 'function') {
        updateModalInfoBar('genericInfoBar');
        updateModalInfoBar('xerxesInfoBar');
    }
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

// Helper to normalize station sells/buys entries so string entries never fail stock/priceMod mutations
function _normalizeLocationTradeLists(location) {
    if (!location) return;
    if (Array.isArray(location.sells)) {
        location.sells = location.sells.map(entry => {
            if (typeof entry === 'string') {
                return { id: entry, priceMod: 1.0, _basePriceMod: 1.0, stock: 45, _baseStock: 45 };
            }
            if (entry) {
                if (entry.stock === undefined) entry.stock = 45;
                if (entry._baseStock === undefined) entry._baseStock = entry.stock;
                if (entry._basePriceMod === undefined) entry._basePriceMod = entry.priceMod !== undefined ? entry.priceMod : 1.0;
            }
            return entry;
        });
    }
    if (Array.isArray(location.buys)) {
        location.buys = location.buys.map(entry => {
            if (typeof entry === 'string') {
                return { id: entry, priceMod: 1.0, _basePriceMod: 1.0, stock: 50, _baseStock: 50 };
            }
            if (entry) {
                if (entry.stock === undefined) entry.stock = 50;
                if (entry._baseStock === undefined) entry._baseStock = entry.stock;
                if (entry._basePriceMod === undefined) entry._basePriceMod = entry.priceMod !== undefined ? entry.priceMod : 1.0;
            }
            return entry;
        });
    }
}

function _getActiveContractItemId() {
    if (typeof playerActiveMission === 'undefined' || !playerActiveMission || playerActiveMission.isComplete) return null;
    if (playerActiveMission.type !== 'DELIVERY' && playerActiveMission.type !== 'ACQUIRE') return null;
    const obj = playerActiveMission.objectives && playerActiveMission.objectives[0];
    return obj && obj.itemID ? obj.itemID : null;
}

const _BULK_PROTECTED_IDS = new Set([
    'HOT_CARGO',
    'COLONY_CHARTER',
    'WAYFINDER_CORE',
    'PRECURSOR_NAV_CORE',
    'PRECURSOR_STAR_MAP_FRAGMENT',
    'PRECURSOR_CIPHER',
    'ENCRYPTED_ENGRAM',
    'ENCRYPTED_DATA',
    'ANCIENT_ARCHIVE',
    'STATION_CORE',
    'WORMHOLE_STABILIZER',
    'PREFAB_COLONY_CORE',
    'SENSOR_DECOY',
    'SUBSPACE_BEACON',
    'MINING_DRONE',
    'MINING_DRONE_MK2',
    'COMBAT_DRONE_MK1',
    'TELEMETRY_PROBE'
]);

const _BULK_PROTECTED_CATEGORIES = new Set([
    'CONSUMABLE',
    'DRONE',
    'QUEST',
    'MEGASTRUCTURE',
    'PRECURSOR',
    'FACTION'
]);

function _isProtectedBulkSellItem(itemId) {
    if (!itemId || _BULK_PROTECTED_IDS.has(itemId)) return true;
    if (itemId === _getActiveContractItemId()) return true;
    const item = typeof COMMODITIES !== 'undefined' ? COMMODITIES[itemId] : null;
    if (!item) return true;
    if (item.isComponent || item.isTroop || item.illegal) return true;
    if (item.category && _BULK_PROTECTED_CATEGORIES.has(item.category)) return true;
    return false;
}

function _getStationMarketGreeting(location, isBuy) {
    if (window.activeTradeNPC) {
        return {
            icon: "📡",
            title: "COMM-LINK EXCHANGE",
            quote: isBuy
                ? "Comparing cargo manifests across open subspace. Select an item on the left to inspect pricing and margin intel."
                : "Transmitting your cargo manifest to the other vessel. Select any item to compare offer value against your average cost."
        };
    }
    if (location && location.isBlackMarket) {
        return {
            icon: "🕶️",
            title: "SHADOW NETWORK EXCHANGE",
            quote: "Encrypted escrow active. Foreign contraband moves fast here—never flip local stock back to the same deck."
        };
    }
    const fac = location ? location.faction : 'INDEPENDENT';
    if (fac === 'KTHARR') {
        return {
            icon: "⚔️",
            title: "HEGEMONY QUARTERMASTER",
            quote: "Metal, rations, and forged steel move the Ascendancy. Choose your trade cleanly, outlander."
        };
    }
    if (fac === 'CONCORD') {
        return {
            icon: "🏛️",
            title: "CONCORD TRADE EXCHANGE",
            quote: "All weights and credits are verified by Concord Customs. Select a commodity to review local supply, price modifiers, and charted trade lanes."
        };
    }
    return {
        icon: "📊",
        title: "FRONTIER EXCHANGE",
        quote: "Independent dock rates shift with sector supply and demand. Select any commodity to inspect local margins and charted route intel."
    };
}

// Helper to return cleanly to whichever station or NPC menu is active underneath
function returnFromTradeSubModal() {
    const xerxesEl = document.getElementById('xerxesOverlay');
    const stationEl = document.getElementById('stationOverlay');

    if (xerxesEl && xerxesEl.style.display === 'flex') {
        closeGenericModal();
    } else if (stationEl && stationEl.style.display === 'flex') {
        closeGenericModal();
    } else if (typeof openStationView === 'function') {
        const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        if (tile && tile.type === 'location') {
            if (tile.name && tile.name.includes('Xerxes') && typeof openXerxesView === 'function') {
                closeGenericModal();
                openXerxesView();
                return;
            } else if (tile.isMajorHub || tile.char === OUTPOST_CHAR_VAL) {
                closeGenericModal();
                openStationView();
                return;
            } else if (tile.isPlayerOwned && tile.isTinyOutpost && typeof openPlayerOutpost === 'function') {
                closeGenericModal();
                openPlayerOutpost(tile);
                return;
            }
        }
        closeGenericModal();
    } else {
        closeGenericModal();
    }
}

function returnFromShipTrade(npcId = null) {
    const npc = (npcId && typeof EntityManager !== 'undefined' && Array.isArray(EntityManager.entities))
        ? EntityManager.entities.find(e => e && e.id === npcId)
        : null;
    window.activeTradeNPC = null;
    if (npc && typeof interactWithNPC === 'function') {
        interactWithNPC(npc);
    } else if (typeof closeGenericModal === 'function') {
        closeGenericModal();
    }
}

// Helper to scan charted locations for the best buyers/sellers of a given commodity
function _getGalacticTradeIntel(itemId) {
    if (typeof LOCATIONS_DATA === 'undefined' || !COMMODITIES[itemId]) {
        return { bestBuyers: [], bestSellers: [], chartedCount: 0 };
    }
    const item = COMMODITIES[itemId];
    const bestBuyers = [];
    const bestSellers = [];
    let chartedCount = 0;

    for (const locKey in LOCATIONS_DATA) {
        const loc = LOCATIONS_DATA[locKey];
        if (!loc || loc.isLandmark || !loc.coords) continue;

        // Skip locked Xerxes in public market intel unless Layer 1 is unlocked
        if (locKey === "Planet Xerxes" && (typeof xerxesPuzzleLevel === 'undefined' || xerxesPuzzleLevel < 1)) continue;

        const displayName = loc.name || locKey;
        const isCharted = (
            locKey === "Starbase Alpha" ||
            (typeof discoveredLocations !== 'undefined' && discoveredLocations.has &&
                (discoveredLocations.has(displayName) || discoveredLocations.has(locKey)))
        );
        if (!isCharted) continue;
        chartedCount++;

        const nav = _tradeDistAndBearing(loc.coords.x, loc.coords.y);
        const evalLoc = {
            name: displayName,
            faction: loc.faction,
            type: loc.type,
            char: loc.char,
            isBlackMarket: loc.isBlackMarket,
            buys: loc.buys,
            sells: loc.sells
        };

        if (Array.isArray(loc.buys)) {
            const buyEntry = loc.buys.find(b => (b.id === itemId) || (b === itemId));
            if (buyEntry) {
                const estPrice = calculateItemPrice(item, false, evalLoc);
                bestBuyers.push({ name: displayName, price: estPrice, coords: loc.coords, ...nav });
            }
        }
        if (Array.isArray(loc.sells)) {
            const sellEntry = loc.sells.find(s => (s.id === itemId) || (s === itemId));
            if (sellEntry) {
                const estPrice = calculateItemPrice(item, true, evalLoc);
                bestSellers.push({ name: displayName, price: estPrice, coords: loc.coords, ...nav });
            }
        }
    }

    bestBuyers.sort((a, b) => b.price - a.price);
    bestSellers.sort((a, b) => a.price - b.price);

    return {
        bestBuyers: bestBuyers.slice(0, 3),
        bestSellers: bestSellers.slice(0, 3),
        chartedCount
    };
}

function setTradeFilter(filterMode) {
    window.currentTradeFilter = filterMode || 'ALL';
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    openTradeModal(window.currentTradeMode || 'buy');
}

// ==========================================
// --- CONSOLIDATED TRADE SYSTEM ---
// ==========================================

function openTradeModal(mode = 'buy') {
    // Patch the close function once to ensure Ship-to-Ship state is wiped when closed
    if (typeof window.closeGenericModal === 'function' && !window._tradeClosePatched) {
        const originalClose = window.closeGenericModal;
        window.closeGenericModal = function() {
            if (!window._preserveTradeNPCOnRefresh) {
                window.activeTradeNPC = null;
            }
            originalClose();
        };
        window._tradeClosePatched = true;
    }

    // Preserve scroll position if we are refreshing the trade list in-place
    const prevListEl = document.getElementById('genericModalList');
    const savedScrollTop = prevListEl ? prevListEl.scrollTop : 0;

    // Prioritize the active NPC if we are in Ship-to-Ship trade, otherwise use the tile
    const location = window.activeTradeNPC || (typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null);

    if (!location || location.type !== 'location') {
        logMessage("Trading terminal offline.");
        return;
    }

    _normalizeLocationTradeLists(location);

    // --- ECONOMY RESTOCK & REFINERY LOGIC (Time-Gated) ---
    if (!window.activeTradeNPC && (location.lastRestockTime === undefined || (currentGameDate - location.lastRestockTime) >= 1.0)) {
        const elapsedCycles = location.lastRestockTime === undefined
            ? 1
            : Math.min(10, Math.max(1, Math.floor(currentGameDate - location.lastRestockTime)));

        if (location.factory && location.buys && location.sells) {
            const sellStock = location.sells.find(s => s.id === location.factory.produces);
            if (sellStock) {
                const baseMod = sellStock._basePriceMod !== undefined ? sellStock._basePriceMod : 1.0;
                const consumeQty = Math.max(1, location.factory.consumeQty || 4);
                const produceQty = Math.max(1, location.factory.produceQty || 2);

                // Baseline autonomous freight deliveries add trickle raw materials; player sales add directly to buffer
                location.factoryInputBuffer = (location.factoryInputBuffer || consumeQty) + (elapsedCycles * Math.ceil(consumeQty * 0.5));

                if (location.factoryInputBuffer >= consumeQty) {
                    const batches = Math.min(elapsedCycles, Math.floor(location.factoryInputBuffer / consumeQty));
                    location.factoryInputBuffer -= batches * consumeQty;
                    sellStock.stock = Math.min(150, (sellStock.stock || 0) + (batches * produceQty));
                    // Well-supplied refinery restores native discount (or modest surplus markdown)
                    sellStock.priceMod = location.factoryInputBuffer >= consumeQty * 2
                        ? parseFloat((baseMod * 0.92).toFixed(2))
                        : baseMod;
                } else {
                    // Input shortage nudges output price up modestly without erasing native baseMod
                    sellStock.priceMod = parseFloat((baseMod * 1.25).toFixed(2));
                }
            }
        }

        if (location.sells) {
            location.sells.forEach(item => {
                if (typeof item === 'object' && item.stock !== undefined) {
                    const targetCap = Math.max(40, item._baseStock || 60);
                    if (item.stock < targetCap) {
                        const addAmt = (Math.floor(Math.random() * 4) + 2) * elapsedCycles;
                        item.stock = Math.min(targetCap, item.stock + addAmt);
                    }
                }
            });
        }
        if (location.buys) {
            location.buys.forEach(item => {
                if (typeof item === 'object' && item.stock !== undefined) {
                    const targetCap = Math.max(30, item._baseStock || 50);
                    if (item.stock < targetCap) {
                        const addAmt = (Math.floor(Math.random() * 5) + 3) * elapsedCycles;
                        item.stock = Math.min(targetCap, item.stock + addAmt);
                    }
                }
            });
        }
        location.lastRestockTime = currentGameDate;
    }

    // Normalize mode so both 'buy' and 'BUY' work properly
    const isBuy = String(mode || 'buy').toLowerCase() === 'buy';
    window.currentTradeMode = isBuy ? 'buy' : 'sell';

    // --- 1. DYNAMIC TITLE FIX ---
    let modalTitle = "MARKETPLACE";
    const faction = location.faction;

    if (window.activeTradeNPC) {
        modalTitle = isBuy ? "SHIP COMM-LINK : BUY" : "SHIP COMM-LINK : SELL";
    } else if (location.isBlackMarket) {
        modalTitle = isBuy ? "SHADOW NETWORK : BUY" : "SHADOW NETWORK : SELL";
    } else if (faction === 'KTHARR') {
        modalTitle = isBuy ? "PROVING GROUNDS : BUY" : "PROVING GROUNDS : SELL";
    } else {
        modalTitle = isBuy ? "STATION MARKETPLACE : BUY" : "STATION MARKETPLACE : SELL";
    }

    openGenericModal(modalTitle);

    // --- 2. DYNAMIC FACTION BANNER RESOLUTION (Existing Assets Only) ---
    let bannerSrc = 'assets/concord_market.png';
    let borderColor = 'var(--accent-color)';
    let glowColor = 'rgba(0, 224, 224, 0.15)';

    if (window.activeTradeNPC) {
        bannerSrc = 'assets/civ_hauler.png';
        borderColor = 'var(--gold-text)';
        glowColor = 'rgba(255, 215, 0, 0.2)';
    } else if (location.isBlackMarket) {
        bannerSrc = 'assets/black_market.png';
        borderColor = '#9C27B0';
        glowColor = 'rgba(156, 39, 176, 0.2)';
    } else {
        if (faction === 'CONCORD') {
            bannerSrc = 'assets/concord_market.png';
            borderColor = 'var(--accent-color)';
            glowColor = 'rgba(0, 224, 224, 0.15)';
        } else if (faction === 'KTHARR') {
            bannerSrc = 'assets/ktharr_market.png';
            borderColor = 'var(--danger)';
            glowColor = 'rgba(255, 85, 85, 0.2)';
        } else if (faction === 'ECLIPSE') {
            bannerSrc = 'assets/eclipse_market.png';
            borderColor = '#9933FF';
            glowColor = 'rgba(153, 51, 255, 0.2)';
        } else if (faction === 'INDEPENDENT') {
            bannerSrc = 'assets/organic_market.png';
            borderColor = 'var(--success)';
            glowColor = 'rgba(0, 255, 0, 0.15)';
        }
    }

    // Build Live Galactic Market Trend / Factory Status Ticker
    let marketTickerHtml = '';
    if (typeof activeMarketTrend !== 'undefined' && activeMarketTrend && currentGameDate < activeMarketTrend.expiry) {
        const trendItem = COMMODITIES[activeMarketTrend.item] ? COMMODITIES[activeMarketTrend.item].name : activeMarketTrend.item;
        const isLocalTrend = location.name === activeMarketTrend.station;
        const trendBadge = activeMarketTrend.isBoom
            ? `<span style="color:var(--warning); font-weight:bold;">🔥 SHORTAGE (+150% PRICE)</span>`
            : `<span style="color:var(--success); font-weight:bold;">📉 SURPLUS (-60% PRICE)</span>`;
        marketTickerHtml = `
            <div style="background:rgba(0,0,0,0.7); border-bottom:1px solid ${borderColor}; padding:5px 12px; font-size:11px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span>📡 <b>SECTOR TICKER:</b> ${trendBadge} on <b style="color:var(--gold-text);">${_tradeEscapeHtml(trendItem)}</b> at <b>${_tradeEscapeHtml(activeMarketTrend.station)}</b></span>
                ${isLocalTrend ? `<span style="background:var(--danger); color:#000; font-weight:bold; padding:1px 6px; border-radius:3px; font-size:9px; flex-shrink:0;">ACTIVE HERE</span>` : ''}
            </div>
        `;
    } else if (location.factory && COMMODITIES[location.factory.consumes] && COMMODITIES[location.factory.produces]) {
        const inName = COMMODITIES[location.factory.consumes].name;
        const outName = COMMODITIES[location.factory.produces].name;
        marketTickerHtml = `
            <div style="background:rgba(0,0,0,0.7); border-bottom:1px solid ${borderColor}; padding:5px 12px; font-size:11px; color:var(--item-desc-color);">
                ⚙️ <b>STATION REFINERY:</b> Consumes <b style="color:var(--accent-color);">${_tradeEscapeHtml(inName)}</b> → Manufactures <b style="color:var(--success);">${_tradeEscapeHtml(outName)}</b>
            </div>
        `;
    }

    const headerImageHTML = `
        <div style="width: 100%; height: 135px; background-image: url('${bannerSrc}'); background-size: cover; background-position: center 25%; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 5px 20px ${glowColor}; flex-shrink: 0; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden;">
            ${marketTickerHtml}
        </div>
    `;

    const activeFilter = window.currentTradeFilter || 'ALL';
    const filterButtonsHtml = `
        <div style="display:flex; gap:6px; margin-bottom:10px; flex-shrink:0; flex-wrap:wrap;">
            ${['ALL', 'DEALS', 'ILLEGAL', 'TECH'].map(f => {
                const isSelected = activeFilter === f;
                return `<button onclick="setTradeFilter('${f}')" style="flex:1; padding:4px 6px; font-size:10px; font-family:var(--title-font); cursor:pointer; border-radius:3px; background:${isSelected ? 'rgba(0,224,224,0.15)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${isSelected ? 'var(--accent-color)' : '#444'}; color:${isSelected ? 'var(--accent-color)' : '#888'}; font-weight:bold;">${f}</button>`;
            }).join('')}
        </div>
    `;

    const greeting = _getStationMarketGreeting(location, isBuy);

    // --- 3. THE PADDED FLEXBOX LAYOUT ---
    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                
                <div style="display: flex; gap: 10px; margin-bottom: 8px; flex-shrink: 0;">
                    <button class="action-button" style="flex: 1; margin-bottom: 0; border-color: ${isBuy ? 'var(--accent-color)' : '#555'}; color: ${isBuy ? 'var(--accent-color)' : '#888'};" onclick="openTradeModal('buy')">🛒 BUY</button>
                    <button class="action-button" style="flex: 1; margin-bottom: 0; border-color: ${!isBuy ? 'var(--success)' : '#555'}; color: ${!isBuy ? 'var(--success)' : '#888'};" onclick="openTradeModal('sell')">📦 SELL</button>
                </div>

                ${filterButtonsHtml}
                
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100%; text-align:center;">
                        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.75;">${greeting.icon}</div>
                        <div style="font-size: 11px; color: var(--accent-color); letter-spacing: 2px; font-weight: bold; margin-bottom: 10px;">${greeting.title}</div>
                        <p style="color:var(--text-color); text-align:left; font-size: 13px; line-height: 1.55; padding: 12px; background:rgba(0,0,0,0.3); border-left:2px solid ${borderColor}; border-radius:4px; margin:0 10px;">
                            "${greeting.quote}"
                        </p>
                    </div>
                </div>
                
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
            </div>
        </div>
    `;

    // Helper to check if an item passes the current filter pill
    const passesFilter = (itemId, isBuyTab) => {
        const item = COMMODITIES[itemId];
        if (!item) return false;
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'ILLEGAL') return Boolean(item.illegal);
        if (activeFilter === 'TECH') {
            return Boolean(item.isComponent || item.onUse || item.isTroop || item.basePrice >= 250);
        }
        if (activeFilter === 'DEALS') {
            const p = calculateItemPrice(item, isBuyTab, location);
            if (isBuyTab) return p <= item.basePrice;
            const costBasis = (window.playerCargoCostBasis && window.playerCargoCostBasis[itemId] !== undefined)
                ? window.playerCargoCostBasis[itemId]
                : (item.basePrice * 0.5);
            return p >= costBasis;
        }
        return true;
    };

    const listEl = document.getElementById('genericModalList');
    const fragment = document.createDocumentFragment();
    let bulkSellSummary = { count: 0, value: 0 };

    if (isBuy) {
        const items = (location.sells || []).filter(entry => passesFilter(entry.id || entry, true));
        if (items.length === 0) {
            const noData = document.createElement('div');
            noData.innerHTML = `<div style="padding:15px; color:#888;">No commodities match the active filter (${activeFilter}).</div>`;
            fragment.appendChild(noData);
        } else {
            items.forEach(itemEntry => {
                const itemId = itemEntry.id || itemEntry;
                const stock = (typeof itemEntry === 'object' && itemEntry.stock !== undefined) ? itemEntry.stock : 99;
                renderTradeRow(itemId, stock, true, location, fragment);
            });
        }
    } else {
        // Exclude active quest items (HOT_CARGO, COLONY_CHARTER) from accidental sale on regular markets
        const playerHas = Object.keys(playerCargo).filter(id => {
            if (playerCargo[id] <= 0) return false;
            if (id === 'HOT_CARGO' || id === 'COLONY_CHARTER') return false;
            return passesFilter(id, false);
        });
        const stationBuys = location.buys || [];

        // Compute eligible bulk-sell valuation for standard legal trade cargo
        Object.keys(playerCargo).forEach(id => {
            if (playerCargo[id] > 0 && !_isProtectedBulkSellItem(id)) {
                const buyEntry = stationBuys.find(b => (b.id === id) || (b === id));
                const demandCap = (buyEntry && buyEntry.stock !== undefined) ? buyEntry.stock : 999;
                const sellableQty = Math.min(playerCargo[id], demandCap);
                if (sellableQty > 0) {
                    bulkSellSummary.count += sellableQty;
                    bulkSellSummary.value += calculateItemPrice(id, false, location) * sellableQty;
                }
            }
        });

        if (playerHas.length > 0) {
            const header = document.createElement('div');
            header.className = 'trade-list-header';
            header.style.cssText = "color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;";
            header.textContent = "COMMODITIES IN CARGO HOLD";
            fragment.appendChild(header);

            playerHas.forEach(itemId => {
                renderTradeRow(itemId, playerCargo[itemId], false, location, fragment);
            });
        }

        const otherDemands = stationBuys.filter(b => {
            const bId = b.id || b;
            return !playerHas.includes(bId) && passesFilter(bId, false);
        });

        if (otherDemands.length > 0) {
            const header = document.createElement('div');
            header.className = 'trade-list-header';
            header.style.cssText = "color:#666; font-size:10px; letter-spacing:2px; margin-top:20px; margin-bottom:10px; border-bottom:1px solid #333;";
            header.textContent = "STATION DEMAND";
            fragment.appendChild(header);

            otherDemands.forEach(entry => {
                const itemId = entry.id || entry;
                renderTradeRow(itemId, 0, false, location, fragment);
            });
        }

        if (playerHas.length === 0 && otherDemands.length === 0) {
            const noData = document.createElement('div');
            noData.innerHTML = `<div style="padding:15px; color:#888;">No matching commodities in cargo or station demand.</div>`;
            fragment.appendChild(noData);
        }
    }

    listEl.appendChild(fragment);
    if (savedScrollTop > 0) {
        listEl.scrollTop = savedScrollTop;
    }

    // --- BOTTOM ACTIONS (Bulk Sell on Sell Tab + Clean Return) ---
    const actionsEl = document.getElementById('genericModalActions');
    if (actionsEl) {
        let actionHtml = '';

        if (!isBuy && bulkSellSummary.count > 0) {
            actionHtml += `
                <button class="action-button" style="width:100%; padding:9px; font-size:11px; margin-bottom:8px; border-color:var(--success); color:var(--success);"
                    title="Sells standard legal trade cargo while protecting consumables, drones, contraband, relics, and contract cargo."
                    onclick="sellAllBulkCargo()">
                    ⚡ SELL LEGAL TRADE GOODS (${bulkSellSummary.count}u · +${_tradeFormat(bulkSellSummary.value)}c)
                </button>
            `;
        }

        if (window.activeTradeNPC) {
            const npcIdArg = window.activeTradeNPC.id ? `'${_tradeEscapeJsArg(window.activeTradeNPC.id)}'` : 'null';
            const backLabel = window.activeTradeNPC.id ? '◀ RETURN TO COMM LINK' : '◀ CLOSE COMM-LINK';
            actionHtml += `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: var(--accent-color); color: var(--accent-color);" onclick="returnFromShipTrade(${npcIdArg})">
                    ${backLabel}
                </button>
            `;
        } else {
            actionHtml += `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">
                    ◀ BACK TO STATION
                </button>
            `;
        }

        actionsEl.innerHTML = actionHtml;
    }

    _refreshTradeHUD();
}

function sellAllBulkCargo(skipConfirm = false) {
    const location = window.activeTradeNPC || (typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null);
    if (!location || location.type !== 'location') return;

    _normalizeLocationTradeLists(location);
    const stationBuys = location.buys || [];

    const sellPlan = [];
    let totalUnits = 0;
    let totalCredits = 0;

    for (const id in playerCargo) {
        if (playerCargo[id] <= 0 || _isProtectedBulkSellItem(id)) continue;
        const buyEntry = stationBuys.find(b => (b.id === id) || (b === id));
        const demandCap = (buyEntry && buyEntry.stock !== undefined) ? buyEntry.stock : 999;
        const qty = Math.min(playerCargo[id], demandCap);
        if (qty <= 0) continue;

        const unitPrice = calculateItemPrice(id, false, location);
        sellPlan.push({ id, qty, unitPrice, buyEntry });
        totalUnits += qty;
        totalCredits += unitPrice * qty;
    }

    if (sellPlan.length === 0) {
        if (typeof showToast === 'function') showToast("NO ELIGIBLE BULK TRADE CARGO", "info");
        return;
    }

    if (!skipConfirm && typeof showConfirmationModal === 'function') {
        showConfirmationModal(
            `Sell ${totalUnits} units of standard legal trade goods across ${sellPlan.length} commodity type(s) for +${_tradeFormat(totalCredits)}c? (Consumables, drones, contraband, relics & active contract cargo are kept safe.)`,
            () => sellAllBulkCargo(true)
        );
        return;
    }

    sellPlan.forEach(({ id, qty, buyEntry }) => {
        playerCargo[id] -= qty;
        if (playerCargo[id] <= 0) {
            delete playerCargo[id];
            delete window.playerCargoCostBasis[id];
        }
        if (buyEntry && buyEntry.stock !== undefined) {
            buyEntry.stock = Math.max(0, buyEntry.stock - qty);
        }
        if (location.factory && location.factory.consumes === id && location.sells) {
            location.factoryInputBuffer = (location.factoryInputBuffer || 0) + qty;
            const producedEntry = location.sells.find(s => s.id === location.factory.produces);
            if (producedEntry && producedEntry.stock !== undefined) {
                const batches = Math.floor(location.factoryInputBuffer / Math.max(1, location.factory.consumeQty || 1));
                if (batches > 0) {
                    location.factoryInputBuffer -= batches * Math.max(1, location.factory.consumeQty || 1);
                    producedEntry.stock = Math.min(150, producedEntry.stock + (batches * (location.factory.produceQty || 1)));
                    producedEntry.priceMod = producedEntry._basePriceMod !== undefined ? producedEntry._basePriceMod : 1.0;
                }
            }
        }
    });

    playerCredits += totalCredits;
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    const profitUnitXP = typeof XP_PER_PROFIT_UNIT !== 'undefined' ? XP_PER_PROFIT_UNIT : 0.1;
    const profitXP = Math.max(1, Math.floor(totalCredits * (profitUnitXP * 0.8)));
    playerXP += profitXP;

    if (!window.activeTradeNPC && typeof updateWorldState === 'function') {
        updateWorldState(playerX, playerY, {
            sells: location.sells,
            buys: location.buys,
            factoryInputBuffer: location.factoryInputBuffer || 0,
            lastRestockTime: location.lastRestockTime,
            lastInteraction: currentGameDate
        });
    }

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(`SOLD ${totalUnits}u (+${_tradeFormat(totalCredits)}c)`, "success");
    logMessage(`<span style="color:var(--success)">[ BULK SALE ]</span> Offloaded ${totalUnits} units of trade cargo at ${_tradeEscapeHtml(location.name)} for <b>${_tradeFormat(totalCredits)}c</b> (+${profitXP} XP).`);

    const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
    if (!leveledUp) {
        openTradeModal('sell');
    }
    _refreshTradeHUD();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function renderTradeRow(itemId, qty, isBuy, location, listEl) {
    const item = COMMODITIES[itemId];
    if (!item) return;

    let isLocked = false;
    let lockReason = "";
    if (isBuy && item.reqFaction) {
        const currentRep = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding[item.reqFaction]) ? playerFactionStanding[item.reqFaction] : 0;
        if (currentRep < item.minRep) {
            isLocked = true;
            lockReason = `Requires ${item.reqFaction} Rep ${item.minRep}`;
        }
    }

    const row = document.createElement('div');
    row.className = 'trade-item-row';
    row.style.cssText = "padding: 14px 10px; padding-right: 15px; border-bottom: 1px solid var(--border-color); display: flex; gap: 15px;";
    if (isLocked) row.style.opacity = "0.5";

    const price = calculateItemPrice(item, isBuy, location);
    const safeItemArg = _tradeEscapeJsArg(itemId);

    // Check if the station has a finite demand limit on the Sell tab
    let demandNote = "";
    let demandMet = false;
    let isHighDemand = false;
    if (!isBuy && location && location.buys) {
        const buyEntry = location.buys.find(b => (b.id === itemId) || (b === itemId));
        if (buyEntry) {
            isHighDemand = true;
            if (buyEntry.stock !== undefined) {
                demandNote = ` <span style="color:var(--accent-color); font-size:11px;">(Demand: ${buyEntry.stock})</span>`;
                if (buyEntry.stock <= 0) demandMet = true;
            }
        }
    }

    // Calculate profit/loss telemetry if player owns this item and has a recorded cost basis
    let profitBadgeHtml = "";
    if (!isBuy && qty > 0 && window.playerCargoCostBasis && window.playerCargoCostBasis[itemId] !== undefined) {
        const avgPaid = Math.round(window.playerCargoCostBasis[itemId]);
        const diff = price - avgPaid;
        const diffColor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        const sign = diff >= 0 ? '+' : '';
        profitBadgeHtml = `<div style="font-size:11px; color:${diffColor};">Avg Paid: ${_tradeFormat(avgPaid)}c (${sign}${_tradeFormat(diff)}c/u)</div>`;
    } else if (isBuy) {
        const ownedCount = item.isTroop
            ? ((playerShip && playerShip.forces) ? (item.isVehicle ? (playerShip.forces.heavyMechs || 0) : (playerShip.forces.marines || 0)) : 0)
            : (playerCargo[itemId] || 0);
        if (ownedCount > 0) {
            const unitLabel = item.isTroop ? (item.isVehicle ? 'Mechs' : 'Marines') : 'In Hold';
            profitBadgeHtml = `<div style="font-size:11px; color:var(--accent-color);">${unitLabel}: ${ownedCount}</div>`;
        }
    }

    let actionButtonHtml = "";
    if (isLocked) {
        actionButtonHtml = `<button class="trade-btn locked" style="width:100%; padding:8px; font-size:13px;" disabled>🔒 LOCKED</button>`;
    } else {
        const actionClass = isBuy ? 'buy' : 'sell';
        const disabled = (isBuy && (playerCredits < price || qty <= 0)) || (!isBuy && (qty <= 0 || demandMet));

        const flexContainer = `<div style="display:flex; flex-wrap:nowrap; gap:6px; justify-content:flex-end; align-items:center;">`;

        if (isBuy) {
            actionButtonHtml = flexContainer + `
                <button class="trade-btn ${actionClass}" ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', true, 1)" style="padding:8px 10px; font-size:13px; cursor:pointer; min-width:56px;">
                    ${_tradeFormat(price)}c
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px 6px; font-weight:bold; font-size:11px; min-width: 36px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', true, 10)" title="Buy 10">
                    +10
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px 6px; font-weight:bold; font-size:11px; min-width: 40px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', true, 'max')" title="Buy Max">
                    MAX
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px 6px; font-weight:bold; font-size:11px; min-width: 32px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', true, 'custom')" title="Enter Amount">
                    #
                </button>
            </div>`;
        } else {
            actionButtonHtml = flexContainer + `
                <button class="trade-btn ${actionClass}" ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', false, 1)" style="padding:8px 12px; font-size:13px; cursor:pointer; min-width:60px;">
                    ${_tradeFormat(price)}c
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 40px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', false, 'all')" title="Sell All">
                    ALL
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 36px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${safeItemArg}', false, 'custom')" title="Enter Amount">
                    #
                </button>
            </div>`;
        }
    }

    const illegalBadge = item.illegal ? `<span style="color:var(--danger); border:1px solid var(--danger); font-size:9px; padding:1px 4px; border-radius:2px; margin-left:6px;">ILLEGAL</span>` : '';
    const demandBadge = (!isBuy && isHighDemand && !demandMet) ? `<span style="color:var(--success); border:1px solid var(--success); font-size:9px; padding:1px 4px; border-radius:2px; margin-left:6px;">WANTED HERE</span>` : '';
    const contractBadge = (itemId === _getActiveContractItemId()) ? `<span style="color:var(--gold-text); border:1px solid var(--gold-text); font-size:9px; padding:1px 4px; border-radius:2px; margin-left:6px;">CONTRACT</span>` : '';

    row.innerHTML = `
        <div class="trade-item-icon" onclick="displayMarketAnalysis('${safeItemArg}')" style="cursor:pointer; font-size: 32px; padding-top: 2px;">${item.icon || '📦'}</div>
        
        <div class="trade-item-details" style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div class="trade-item-name" onclick="displayMarketAnalysis('${safeItemArg}')" style="cursor:pointer; font-size: 15px; font-weight: bold; color: var(--item-name-color); letter-spacing: 0.5px;">
                ${_tradeEscapeHtml(item.name)} ${illegalBadge}${demandBadge}${contractBadge}
                ${isLocked ? `<span style="color:var(--danger); font-size:11px; margin-left: 6px;">(${_tradeEscapeHtml(lockReason)})</span>` : ''}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div class="trade-item-sub" onclick="displayMarketAnalysis('${safeItemArg}')" style="cursor:pointer; font-size: 13px; color: var(--text-color); line-height: 1.4;">
                    <div>${isBuy ? `In Stock: ${qty}` : `Owned: ${qty}${demandNote}`}</div>
                    <div style="color:var(--gold-text); font-size: 11px;">Galactic Base: ${_tradeFormat(item.basePrice)}c</div>
                    ${profitBadgeHtml}
                </div>
                
                <div class="trade-item-actions">
                    ${actionButtonHtml}
                </div>
            </div>
        </div>
    `;

    listEl.appendChild(row);
}

// --- MARKET ANALYSIS MODAL ---
function displayMarketAnalysis(itemId) {
    window.activeTradeItemId = itemId;

    const item = COMMODITIES[itemId];
    const detailEl = document.getElementById('genericDetailContent');

    if (!item || !detailEl) return;

    // Unlock commodity lore if inspecting an item with a loreKey
    if (item.loreKey && typeof unlockLoreEntry === 'function') {
        unlockLoreEntry(item.loreKey);
    }

    const location = window.activeTradeNPC || (typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null);
    const localPrice = calculateItemPrice(item, true, location);
    const sellPrice = calculateItemPrice(item, false, location);
    const isBuyMode = (window.currentTradeMode || 'buy') === 'buy';
    const breakdown = _getPriceBreakdown(itemId, isBuyMode, location);

    let volatility = "STABLE";
    let volColor = "var(--success)";
    if (item.illegal) {
        volatility = "HIGH RISK";
        volColor = "var(--danger)";
    } else if (item.basePrice > 200) {
        volatility = "FLUCTUATING";
        volColor = "var(--warning)";
    }

    const avgPaid = (window.playerCargoCostBasis && window.playerCargoCostBasis[itemId] !== undefined)
        ? `<div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:8px; border-top:1px dashed #333; font-size:13px;">
               <span style="color:var(--item-desc-color);">Your Avg Cost:</span>
               <span style="color:var(--accent-color); font-weight:bold;">${_tradeFormat(Math.round(window.playerCargoCostBasis[itemId]))}c</span>
           </div>`
        : '';

    // Active Price Modifiers Breakdown
    let modifiersHtml = '';
    if (breakdown.factors.length > 0) {
        modifiersHtml = `
            <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); font-size:11px;">
                <div style="color:#888; font-size:9px; letter-spacing:1px; margin-bottom:4px;">ACTIVE ${isBuyMode ? 'BUY' : 'SELL'} MODIFIERS</div>
                ${breakdown.factors.map(f => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                        <span style="color:var(--item-desc-color);">${_tradeEscapeHtml(f.label)}</span>
                        <span style="color:${f.color}; font-weight:bold;">${_tradeEscapeHtml(f.delta)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Charted Galactic Route Intel (Best Buyers / Sellers)
    const routeIntel = _getGalacticTradeIntel(itemId);
    let routeIntelHtml = '';
    if (routeIntel.bestBuyers.length > 0 || routeIntel.bestSellers.length > 0) {
        const sellersText = routeIntel.bestSellers.map(s => `
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
                <span>• ${_tradeEscapeHtml(s.name)} <span style="color:#777;">(${s.distance}u ${s.bearing})</span></span>
                <span style="color:var(--gold-text); font-weight:bold;">~${_tradeFormat(s.price)}c</span>
            </div>
        `).join('');
        const buyersText = routeIntel.bestBuyers.map(b => `
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
                <span>• ${_tradeEscapeHtml(b.name)} <span style="color:#777;">(${b.distance}u ${b.bearing})</span></span>
                <span style="color:var(--success); font-weight:bold;">~${_tradeFormat(b.price)}c</span>
            </div>
        `).join('');
        routeIntelHtml = `
            <div style="background:rgba(0,0,0,0.35); padding:12px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:16px;">
                <h4 style="margin:0 0 8px 0; color:var(--accent-color); font-size:11px; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:4px;">CHARTED GALACTIC INTEL (${routeIntel.chartedCount} PORTS)</h4>
                ${sellersText ? `<div style="font-size:10px; color:#888; margin-bottom:3px;">LOWEST EXPORT HUBS:</div>${sellersText}` : ''}
                ${buyersText ? `<div style="font-size:10px; color:#888; margin-top:8px; margin-bottom:3px;">HIGHEST IMPORT DEMAND:</div>${buyersText}` : ''}
            </div>
        `;
    }

    detailEl.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out; display: flex; flex-direction: column; min-height: 100%;">
            <div style="display:flex; gap:15px; margin-bottom:16px; align-items:center;">
                <div style="font-size:44px; background:var(--bg-color); padding:10px; border-radius:10px; border:1px solid var(--border-color);">
                    ${item.icon || '📦'}
                </div>
                <div>
                    <div style="color:var(--accent-color); font-size:11px; margin-bottom:4px; letter-spacing:1px; text-transform:uppercase;">${_tradeEscapeHtml(item.category || 'Registered')} Commodity</div>
                    <div style="font-size:18px; font-weight:bold; color:var(--item-name-color); letter-spacing:0.5px;">${_tradeEscapeHtml(item.name)}</div>
                    <div style="font-size:12px; margin-top:4px; color:var(--text-color);">Volatility: <span style="color:${volColor}; font-weight:bold;">${volatility}</span> · Mass: ${item.weight !== undefined ? item.weight : 1}t</div>
                </div>
            </div>

            <div style="background:var(--bg-color); padding:14px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:16px; font-size:14px;">
                <h4 style="margin:0 0 10px 0; color:var(--accent-color); font-size:12px; border-bottom:1px solid var(--border-color); padding-bottom:6px; letter-spacing:1px;">LOCAL MARKET DATA</h4>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="color:var(--text-color);">Market Buy:</span>
                    <span style="color:var(--gold-text); font-weight:bold;">${_tradeFormat(localPrice)}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:var(--text-color);">Market Sell:</span>
                    <span style="color:var(--success); font-weight:bold;">${_tradeFormat(sellPrice)}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:8px; font-size:12px;">
                    <span style="color:var(--item-desc-color);">Galactic Base:</span>
                    <span style="color:var(--item-desc-color);">${_tradeFormat(item.basePrice)}c</span>
                </div>
                ${avgPaid}
                ${modifiersHtml}
            </div>

            ${routeIntelHtml}

            <div style="margin-bottom:16px; padding: 0 5px;">
                <h4 style="margin:0 0 6px 0; color:var(--text-color); font-size:11px; letter-spacing:1px; text-transform:uppercase;">Manifest Entry</h4>
                <div style="font-size:12px; color:var(--item-desc-color); line-height:1.55;">
                    ${_tradeEscapeHtml(item.description)}
                </div>
            </div>

            ${item.reqFaction ? `
                <div style="font-size:12px; color:var(--danger); border:1px solid var(--danger); background:transparent; padding:10px; text-align:center; border-radius:4px; font-weight:bold; letter-spacing:0.5px; margin-bottom: 16px;">
                    ⚠️ RESTRICTED: ${_tradeEscapeHtml(item.reqFaction)} Clearance Required
                </div>
            ` : ''}

            <div style="margin-top: auto; padding-top: 12px; padding-bottom: 8px; border-top: 1px solid var(--border-color); text-align: center;">
                <button class="trade-btn" style="padding: 9px 18px; font-size: 11px; cursor: pointer; background: transparent; border: 1px solid var(--text-color); color: var(--text-color); letter-spacing: 1px; width: 100%; border-radius: 4px;" onclick="clearMarketAnalysis()">
                    CLOSE DATA PANEL
                </button>
            </div>
        </div>
    `;
}

function clearMarketAnalysis() {
    window.activeTradeItemId = null;

    const location = window.activeTradeNPC || (typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null);
    const greeting = _getStationMarketGreeting(location, (window.currentTradeMode || 'buy') === 'buy');

    const detailEl = document.getElementById('genericDetailContent');
    if (detailEl) {
        detailEl.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100%; text-align:center;">
                <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.75;">${greeting.icon}</div>
                <div style="font-size: 11px; color: var(--accent-color); letter-spacing: 2px; font-weight: bold; margin-bottom: 10px;">${greeting.title}</div>
                <p style="color:var(--text-color); text-align:left; font-size: 13px; line-height: 1.55; padding: 12px; background:rgba(0,0,0,0.3); border-left:2px solid var(--accent-color); border-radius:4px; margin:0 10px;">
                    "${greeting.quote}"
                </p>
            </div>
        `;
    }
}

function executeTrade(itemId, isBuy, specificQty = 1, skipConfirm = false) {
    let leveledUp = false;

    const location = window.activeTradeNPC || (typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null);
    const item = COMMODITIES[itemId];
    if (!item || !location) return;

    // Safeguard against accidentally selling the endgame Wayfinder Core
    if (!isBuy && itemId === 'WAYFINDER_CORE' && !skipConfirm && typeof showConfirmationModal === 'function') {
        showConfirmationModal(
            "WARNING: Sell your Precursor Wayfinder Core? You need it to awaken The First Nexus!",
            () => executeTrade(itemId, isBuy, specificQty, true)
        );
        return;
    }

    _normalizeLocationTradeLists(location);
    const price = calculateItemPrice(item, isBuy, location);

    // --- FETCH ITEM ENTRY FOR STOCK/DEMAND LIMITS ---
    const tradeList = isBuy ? location.sells : location.buys;
    const itemEntry = tradeList ? tradeList.find(e => e.id === itemId || e === itemId) : null;
    const availableStock = (itemEntry && itemEntry.stock !== undefined) ? itemEntry.stock : 999;

    let qtyToTrade = specificQty;

    if (specificQty === 'custom') {
        const promptMsg = isBuy
            ? `Buy how many ${item.name}? (Stock: ${availableStock}, Max affordable: ${Math.floor(playerCredits / Math.max(1, price))})`
            : `Sell how many ${item.name}? (Demand: ${availableStock}, Owned: ${playerCargo[itemId] || 0})`;

        const input = prompt(promptMsg, "1");
        if (input === null) return;
        qtyToTrade = parseInt(input, 10);

        if (isNaN(qtyToTrade) || qtyToTrade <= 0) {
            if (typeof showToast === 'function') showToast("Invalid Amount", "error");
            return;
        }
    }

    if (isBuy) {
        const itemWeight = item.weight !== undefined ? item.weight : 1;
        const affordable = Math.floor(playerCredits / Math.max(1, price));

        let space = 999;
        // Handle Troop limits BEFORE completing the transaction
        if (item.isTroop && typeof playerShip !== 'undefined') {
            if (!playerShip.forces) {
                playerShip.forces = { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: 20 };
            }
            const maxTroops = playerShip.forces.maxTroops || 20;
            if (item.isVehicle) {
                space = Math.max(0, maxTroops - (playerShip.forces.heavyMechs || 0));
            } else {
                space = Math.max(0, Math.floor((maxTroops - (playerShip.forces.marines || 0)) / (item.troopCount || 10)));
            }
        } else if (itemWeight > 0) {
            space = Math.floor((PLAYER_CARGO_CAPACITY - currentCargoLoad) / itemWeight);
        }

        if (qtyToTrade === 'max') {
            qtyToTrade = Math.min(affordable, space, availableStock);
        } else if (qtyToTrade === 10) {
            qtyToTrade = Math.min(10, affordable, space, availableStock);
        } else {
            qtyToTrade = Math.min(qtyToTrade, space, availableStock);
        }

        if (qtyToTrade <= 0) {
            if (availableStock <= 0) {
                if (typeof showToast === 'function') showToast("Out of Stock!", "error");
            } else if (playerCredits < price) {
                if (typeof showToast === 'function') showToast("Insufficient Credits!", "error");
            } else {
                if (typeof showToast === 'function') showToast(item.isTroop ? "Barracks Full!" : "Cargo Hold Full!", "warning");
            }
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }

        if (playerCredits < price * qtyToTrade) {
            if (typeof showToast === 'function') showToast("Insufficient Credits!", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }

        if (!item.isTroop && currentCargoLoad + (qtyToTrade * itemWeight) > PLAYER_CARGO_CAPACITY) {
            if (typeof showToast === 'function') showToast("Not enough Cargo Space!", "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }

        const totalCost = price * qtyToTrade;
        const prevOwned = playerCargo[itemId] || 0;
        const prevAvg = window.playerCargoCostBasis[itemId] !== undefined ? window.playerCargoCostBasis[itemId] : price;

        playerCredits -= totalCost;

        // Route Troop items directly into ship barracks if purchased
        if (item.isTroop && typeof playerShip !== 'undefined' && playerShip.forces) {
            if (item.isVehicle) {
                playerShip.forces.heavyMechs = (playerShip.forces.heavyMechs || 0) + qtyToTrade;
            } else {
                playerShip.forces.marines = Math.min(
                    playerShip.forces.maxTroops || 20,
                    (playerShip.forces.marines || 0) + (qtyToTrade * (item.troopCount || 10))
                );
            }
        } else {
            playerCargo[itemId] = prevOwned + qtyToTrade;
            window.playerCargoCostBasis[itemId] = ((prevOwned * prevAvg) + totalCost) / (prevOwned + qtyToTrade);
        }

        if (itemEntry && itemEntry.stock !== undefined) itemEntry.stock -= qtyToTrade;

        updateCurrentCargoLoad();

        if (item.loreKey && typeof unlockLoreEntry === 'function') {
            unlockLoreEntry(item.loreKey);
        }

        if (itemId === 'WAYFINDER_CORE' && typeof mystery_first_nexus_location !== 'undefined' && !mystery_first_nexus_location) {
            const dist = 500 + Math.floor(seededRandom(WORLD_SEED) * 500);
            const angle = seededRandom(WORLD_SEED + 1) * Math.PI * 2;
            mystery_first_nexus_location = {
                x: Math.floor(Math.cos(angle) * dist),
                y: Math.floor(Math.sin(angle) * dist)
            };
            if (typeof unlockLoreEntry === 'function') unlockLoreEntry("MYSTERY_WAYFINDER_QUEST_COMPLETED");
            logMessage("\n<span style='color:#40E0D0; font-weight:bold;'>! ARTIFACT ACTIVATED !</span>\nThe Wayfinder Core hums violently! Coordinates projected into navigation computer.");
        }

        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`Bought ${qtyToTrade}x ${item.name}`, "success");
    } else {
        const owned = playerCargo[itemId] || 0;

        if (qtyToTrade === 'all') {
            qtyToTrade = Math.min(owned, availableStock);
        } else {
            qtyToTrade = Math.min(qtyToTrade, owned, availableStock);
        }

        if (qtyToTrade <= 0) {
            if (availableStock <= 0) {
                if (typeof showToast === 'function') showToast("Station demand met!", "warning");
                if (typeof soundManager !== 'undefined') soundManager.playError();
            }
            return;
        }

        const totalEarned = price * qtyToTrade;
        playerCargo[itemId] -= qtyToTrade;
        if (playerCargo[itemId] <= 0) {
            delete playerCargo[itemId];
            delete window.playerCargoCostBasis[itemId];
        }

        if (itemEntry && itemEntry.stock !== undefined) {
            itemEntry.stock = Math.max(0, itemEntry.stock - qtyToTrade);
        }

        // Selling raw inputs to a station refinery feeds its buffer and boosts finished goods stock!
        if (location.factory && location.factory.consumes === itemId && location.sells) {
            location.factoryInputBuffer = (location.factoryInputBuffer || 0) + qtyToTrade;
            const producedEntry = location.sells.find(s => s.id === location.factory.produces);
            if (producedEntry && producedEntry.stock !== undefined) {
                const reqBatch = Math.max(1, location.factory.consumeQty || 1);
                const batches = Math.floor(location.factoryInputBuffer / reqBatch);
                if (batches > 0) {
                    location.factoryInputBuffer -= batches * reqBatch;
                    producedEntry.stock = Math.min(150, producedEntry.stock + (batches * (location.factory.produceQty || 1)));
                    producedEntry.priceMod = producedEntry._basePriceMod !== undefined ? producedEntry._basePriceMod : 1.0;
                }
            }
        }

        playerCredits += totalEarned;
        updateCurrentCargoLoad();

        const profitUnitXP = typeof XP_PER_PROFIT_UNIT !== 'undefined' ? XP_PER_PROFIT_UNIT : 0.1;
        const profitXP = Math.max(1, Math.floor((price * qtyToTrade) * (profitUnitXP * 0.8)));
        playerXP += profitXP;

        if (typeof checkLevelUp === 'function') leveledUp = checkLevelUp();

        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`Sold ${qtyToTrade}x ${item.name} (+${_tradeFormat(totalEarned)}c)`, "success");
    }

    if (!window.activeTradeNPC && location && (location.sells || location.buys) && typeof updateWorldState === 'function') {
        updateWorldState(playerX, playerY, {
            sells: location.sells,
            buys: location.buys,
            factoryInputBuffer: location.factoryInputBuffer || 0,
            lastRestockTime: location.lastRestockTime,
            lastInteraction: currentGameDate
        });
    }

    const savedItemId = window.activeTradeItemId;

    // Only re-open the trade modal if a level-up didn't take over the screen
    if (!leveledUp) {
        if (isBuy) openTradeModal('buy');
        else openTradeModal('sell');

        if (savedItemId) {
            displayMarketAnalysis(savedItemId);
        }
    }

    _refreshTradeHUD();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function _getPriceBreakdown(itemOrId, isBuy, location) {
    const itemId = typeof itemOrId === 'string'
        ? itemOrId
        : (itemOrId && itemOrId.id ? itemOrId.id : Object.keys(COMMODITIES).find(key => COMMODITIES[key] === itemOrId));
    const item = typeof itemOrId === 'string' ? COMMODITIES[itemOrId] : itemOrId;

    if (!item) return { finalPrice: 0, factors: [] };

    const factors = [];
    let price = item.basePrice || 0;
    let locMult = 1.0;

    if (location && (location.sells || location.buys)) {
        const tradeList = isBuy ? location.sells : location.buys;
        if (tradeList) {
            const entry = tradeList.find(e => (e.id === itemId) || (e === itemId));
            if (entry && entry.priceMod) {
                locMult = entry.priceMod;
            }
        }
    }

    if (locMult === 1.0 && location && (location.type === OUTPOST_CHAR_VAL || location.char === OUTPOST_CHAR_VAL)) {
        locMult = isBuy ? 1.2 : 0.8;
    }

    if (!isBuy) {
        price = price * 0.5;
    }

    if (locMult !== 1.0) {
        const pct = Math.round((locMult - 1.0) * 100);
        const goodForPlayer = isBuy ? pct < 0 : pct > 0;
        factors.push({
            label: "Local Port Rate",
            delta: `${pct > 0 ? '+' : ''}${pct}%`,
            color: goodForPlayer ? "var(--success)" : "var(--warning)"
        });
    }
    price = price * locMult;

    const stationSellsItem = Boolean(location && location.sells && location.sells.some(e => (e.id === itemId) || (e === itemId)));

    // Contraband commands a high premium when sold to markets that don't already supply it
    if (item.illegal && !isBuy && !stationSellsItem) {
        price *= 2.5;
        factors.push({ label: "Foreign Contraband Markup", delta: "+150%", color: "var(--gold-text)" });
    }

    const locationName = location ? location.name : "";
    if (typeof activeMarketTrend !== 'undefined' && activeMarketTrend &&
        activeMarketTrend.station === locationName &&
        activeMarketTrend.item === itemId &&
        currentGameDate < activeMarketTrend.expiry) {
        if (activeMarketTrend.isBoom) {
            price *= 2.5;
            factors.push({ label: "Sector Shortage Boom", delta: "+150%", color: isBuy ? "var(--danger)" : "var(--success)" });
        } else {
            price *= 0.4;
            factors.push({ label: "Sector Surplus Crash", delta: "-60%", color: isBuy ? "var(--success)" : "var(--danger)" });
        }
    } else {
        const uniqueOffset = item.basePrice || 0;
        const fluctuation = Math.sin(((typeof currentGameDate !== 'undefined' ? currentGameDate : 0) + uniqueOffset) / 5);
        const marketFactor = 1 + (fluctuation * 0.15);
        const fPct = Math.round(fluctuation * 15);
        if (fPct !== 0) {
            factors.push({
                label: "Daily Market Drift",
                delta: `${fPct > 0 ? '+' : ''}${fPct}%`,
                color: (isBuy ? fPct < 0 : fPct > 0) ? "var(--success)" : "var(--item-desc-color)"
            });
        }
        price *= marketFactor;
    }

    if (_tradeHasPerk('SILVER_TONGUE')) {
        price = isBuy ? (price * 0.9) : (price * 1.1);
        factors.push({ label: "Silver Tongue Perk", delta: isBuy ? "-10%" : "+10%", color: "var(--success)" });
    }

    if (typeof hasCrewPerk === 'function' && hasCrewPerk('TRADE_BONUS')) {
        price = isBuy ? (price * 0.9) : (price * 1.1);
        factors.push({ label: "Crew Trade Specialist", delta: isBuy ? "-10%" : "+10%", color: "var(--success)" });
    }

    if (typeof playerFactionStanding !== 'undefined' && location && location.faction) {
        const facRep = playerFactionStanding[location.faction] || 0;
        if (isBuy && facRep >= 50) {
            price *= 0.85;
            factors.push({ label: `Allied ${location.faction} Discount`, delta: "-15%", color: "var(--accent-color)" });
        } else if (!isBuy && facRep >= 50 && !stationSellsItem) {
            price *= 1.10;
            factors.push({ label: `Allied ${location.faction} Bonus`, delta: "+10%", color: "var(--accent-color)" });
        }
    }

    price = Math.floor(price);

    // Prevent same-station buy/sell arbitrage loop if the station also sells this item
    if (!isBuy && stationSellsItem) {
        const buyPriceHere = calculateItemPrice(itemId, true, location);
        const capPrice = Math.max(1, Math.floor(buyPriceHere * 0.85));
        if (price > capPrice) {
            price = capPrice;
            factors.push({ label: "Local Buyback Cap", delta: "85% Buy", color: "var(--warning)" });
        }
    }

    return { finalPrice: Math.max(1, price), factors };
}

function calculateItemPrice(itemOrId, isBuy, location) {
    return _getPriceBreakdown(itemOrId, isBuy, location).finalPrice;
}

// ==========================================
// --- ECLIPSE SHADOW BROKER ---
// ==========================================

function openShadowBroker() {
    openGenericModal("SHADOW BROKER NETWORK");

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; opacity:0.8;">🎲</div>
            <h3 style="color:#9933FF; margin-bottom:10px;">THE SHADOW BROKER</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Concord patrols breathing down your neck? I can make your problems disappear... for a cut. I pay triple street value for foreign contraband that doesn't officially exist."
            </p>
        </div>
    `;
    actionsEl.innerHTML = `
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">
            ◀ BACK TO CONCOURSE
        </button>
    `;

    renderShadowBrokerList();
}

function getShadowBrokerUnitPrice(itemId) {
    const item = COMMODITIES[itemId];
    if (!item) return 0;
    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const soldLocally = loc && loc.sells && loc.sells.some(s => (s.id === itemId) || (s === itemId));

    // Prevent Same-Station Black Market Arbitrage
    if (soldLocally) {
        const localBuyPrice = calculateItemPrice(item, true, loc);
        return Math.max(1, Math.floor(localBuyPrice * 0.85));
    }

    return Math.floor(item.basePrice * 3);
}

function renderShadowBrokerList() {
    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const currentLoc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const currentName = currentLoc && currentLoc.name ? currentLoc.name : "";

    // Check if the player has an active Smuggling Run ready for drop-off at this station!
    if (typeof playerActiveMission !== 'undefined' && playerActiveMission &&
        playerActiveMission.id && playerActiveMission.id.startsWith("SMUGGLE_") &&
        (playerCargo['HOT_CARGO'] || 0) > 0) {
        const destName = playerActiveMission.objectives && playerActiveMission.objectives[0]
            ? playerActiveMission.objectives[0].destinationName
            : "";
        if (destName === currentName) {
            const turnInRow = document.createElement('div');
            turnInRow.className = 'trade-item-row';
            turnInRow.style.background = 'rgba(0, 255, 0, 0.12)';
            turnInRow.style.borderBottom = '2px solid var(--success)';
            turnInRow.innerHTML = `<span style="color:var(--success); font-weight:bold;">📦 DELIVER HOT CARGO</span> <span style="color:var(--gold-text); font-weight:bold;">${_tradeFormat(playerActiveMission.rewards.credits)}c</span>`;
            turnInRow.onclick = () => completeSmugglingRunAtBroker();
            listEl.appendChild(turnInRow);
        }
    }

    let foundAny = false;
    let totalBlackMarketValue = 0;

    for (const itemId in playerCargo) {
        // Never fence HOT_CARGO as generic 0-credit contraband or it soft-locks the Smuggling mission
        if (itemId === 'HOT_CARGO') continue;

        if (playerCargo[itemId] > 0 && COMMODITIES[itemId] && COMMODITIES[itemId].illegal) {
            foundAny = true;
            const item = COMMODITIES[itemId];
            const qty = playerCargo[itemId];
            const value = getShadowBrokerUnitPrice(itemId) * qty;
            totalBlackMarketValue += value;

            const soldLocally = currentLoc && currentLoc.sells && currentLoc.sells.some(s => (s.id === itemId) || (s === itemId));
            const tagHtml = soldLocally
                ? `<span style="color:var(--warning); font-size:9px; margin-left:4px;">(LOCAL)</span>`
                : `<span style="color:var(--success); font-size:9px; margin-left:4px;">(300%)</span>`;

            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.innerHTML = `<span style="color:#FF5555; font-weight:bold;">${_tradeEscapeHtml(item.name)}${tagHtml}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showShadowBrokerItemDetails(itemId);
            listEl.appendChild(row);
        }
    }

    if (!foundAny) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = "padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;";
        emptyMsg.textContent = "Your hold has no fenceable contraband. The Broker has no interest in legal commodities.";
        listEl.appendChild(emptyMsg);
    } else {
        const fenceAllRow = document.createElement('div');
        fenceAllRow.className = 'trade-item-row';
        fenceAllRow.style.background = 'rgba(153, 51, 255, 0.1)';
        fenceAllRow.style.borderBottom = '2px solid #9933FF';
        fenceAllRow.innerHTML = `<span style="color:#DDA0DD; font-weight:bold;">FENCE ALL CONTRABAND</span> <span style="color:var(--gold-text);">${_tradeFormat(totalBlackMarketValue)}c</span>`;
        fenceAllRow.onclick = () => showFenceAllDetails(totalBlackMarketValue);
        listEl.prepend(fenceAllRow);
    }

    // Black Market Tactical Gear Supply Row
    const gearRow = document.createElement('div');
    gearRow.className = 'trade-item-row';
    gearRow.style.background = 'rgba(0, 224, 224, 0.06)';
    gearRow.style.borderBottom = '1px solid #444';
    gearRow.innerHTML = `<span style="color:var(--accent-color); font-weight:bold;">🛰️ ILLICIT TACTICAL GEAR</span> <span style="color:#888; font-size:10px;">DECOYS / STIMS</span>`;
    gearRow.onclick = () => showBrokerTacticalSupply();
    listEl.prepend(gearRow);

    // The Smuggling Contract Button (Always visible at the top)
    const smuggleRow = document.createElement('div');
    smuggleRow.className = 'trade-item-row';
    smuggleRow.style.background = 'rgba(255, 0, 0, 0.1)';
    smuggleRow.style.borderBottom = '2px solid var(--danger)';
    smuggleRow.innerHTML = `<span style="color:var(--danger); font-weight:bold;">REQUEST SMUGGLING RUN</span> <span style="color:var(--warning); font-size:10px;">HIGH RISK</span>`;
    smuggleRow.onclick = () => showSmugglingContractDetails();
    listEl.prepend(smuggleRow);
}

// Allow turning in Smuggling Run directly inside the Shadow Broker UI at destination
function completeSmugglingRunAtBroker() {
    if (!playerActiveMission || (playerCargo['HOT_CARGO'] || 0) <= 0) return;

    const completedId = playerActiveMission.id;
    const completedTitle = playerActiveMission.title || "Smuggle Hot Cargo";

    playerCargo['HOT_CARGO'] -= 1;
    if (playerCargo['HOT_CARGO'] <= 0) delete playerCargo['HOT_CARGO'];
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    const payout = (playerActiveMission.rewards && playerActiveMission.rewards.credits) ? playerActiveMission.rewards.credits : 15000;
    const xpGain = (playerActiveMission.rewards && playerActiveMission.rewards.xp) ? playerActiveMission.rewards.xp : 500;
    const notGain = (playerActiveMission.rewards && playerActiveMission.rewards.notoriety) ? playerActiveMission.rewards.notoriety : 5;

    playerCredits += payout;
    playerXP += xpGain;
    if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(notGain);
    if (typeof playerFactionStanding !== 'undefined') {
        playerFactionStanding['ECLIPSE'] = (playerFactionStanding['ECLIPSE'] || 0) + 10;
    }
    if (typeof playerCompletedMissions !== 'undefined' && playerCompletedMissions.add && completedId) {
        playerCompletedMissions.add(completedId);
    }
    if (typeof addMilestone === 'function') {
        addMilestone(`Completed Eclipse smuggling run '${completedTitle}' (+${_tradeFormat(payout)}c).`);
    }

    playerActiveMission = null;
    if (typeof renderMissionTracker === 'function') renderMissionTracker();

    logMessage(`<span style="color:var(--success); font-weight:bold;">[ SMUGGLING RUN COMPLETE ]</span> Delivered the Tracked Contraband! Earned <b>${_tradeFormat(payout)}c</b>, +${xpGain} XP, and +10 Eclipse Rep.`);
    if (typeof showToast === 'function') showToast(`CONTRACT COMPLETE: +${_tradeFormat(payout)}c`, "success");
    if (typeof soundManager !== 'undefined') soundManager.playGain();

    const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
    _refreshTradeHUD();
    if (!leveledUp) {
        openShadowBroker();
    }
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function showBrokerTacticalSupply() {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
    const hasNeuralStim = typeof COMMODITIES !== 'undefined' && Boolean(COMMODITIES['NEURAL_STIM_PACK']);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:48px; margin-bottom:10px;">🛰️</div>
            <h3 style="color:var(--accent-color); margin:0 0 10px 0;">SYNDICATE FIELD GEAR</h3>
            <p style="font-size:12px; color:var(--item-desc-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--accent-color); text-align:left;">
                "Heading into hot space? Stock up on spoofing buoys, combat stims, and decryption ciphers before you undock."
            </p>
            <div class="trade-math-area" style="text-align:left; margin-top:12px;">
                <div class="trade-stat-row"><span>🛰️ Sensor Decoy (-1 Notoriety):</span> <span style="color:var(--gold-text); font-weight:bold;">500c</span></div>
                <div class="trade-stat-row"><span>💉 Combat Stims (Reset Ability CD):</span> <span style="color:var(--gold-text); font-weight:bold;">400c</span></div>
                ${hasNeuralStim ? `<div class="trade-stat-row"><span>⚡ Neural Reflex Injector (Combat):</span> <span style="color:var(--gold-text); font-weight:bold;">600c</span></div>` : ''}
                <div class="trade-stat-row"><span>🔑 Precursor Cipher (Decrypt Key):</span> <span style="color:var(--gold-text); font-weight:bold;">200c</span></div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" ${(playerCredits < 500 || spaceLeft < 1) ? 'disabled' : ''} style="border-color:var(--accent-color); color:var(--accent-color);" onclick="buyBrokerSupplyItem('SENSOR_DECOY', 500)">BUY SENSOR DECOY (500c)</button>
        <button class="action-button" ${(playerCredits < 400 || spaceLeft < 1) ? 'disabled' : ''} style="border-color:var(--warning); color:var(--warning);" onclick="buyBrokerSupplyItem('PROHIBITED_STIMS', 400)">BUY COMBAT STIMS (400c)</button>
        ${hasNeuralStim ? `<button class="action-button" ${(playerCredits < 600 || spaceLeft < 1) ? 'disabled' : ''} style="border-color:#9933FF; color:#DDA0DD;" onclick="buyBrokerSupplyItem('NEURAL_STIM_PACK', 600)">BUY NEURAL INJECTOR (600c)</button>` : ''}
        <button class="action-button" ${(playerCredits < 200 || spaceLeft < 1) ? 'disabled' : ''} style="border-color:var(--success); color:var(--success);" onclick="buyBrokerSupplyItem('PRECURSOR_CIPHER', 200)">BUY PRECURSOR CIPHER (200c)</button>
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
    `;
}

function buyBrokerSupplyItem(itemId, cost) {
    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
    if (playerCredits < cost || spaceLeft < 1) {
        if (typeof showToast === 'function') showToast(spaceLeft < 1 ? "Cargo Hold Full!" : "Insufficient Credits!", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }
    playerCredits -= cost;
    playerCargo[itemId] = (playerCargo[itemId] || 0) + 1;
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    const itemName = COMMODITIES[itemId] ? COMMODITIES[itemId].name : itemId;
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(`Acquired 1x ${itemName}`, "success");
    _refreshTradeHUD();
    renderShadowBrokerList();
    showBrokerTacticalSupply();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function showSmugglingContractDetails() {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const currentLoc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const currentName = currentLoc && currentLoc.name ? currentLoc.name : "OUTPOST";
    const dayKey = Math.floor(typeof currentGameDate !== 'undefined' ? currentGameDate : 0);

    // Cache offer per station per stardate so clicking repeatedly can't fish for max payouts
    let cachedOffer = window._brokerSmuggleOffers[currentName];
    if (!cachedOffer || cachedOffer.day !== dayKey) {
        let blackMarkets = Object.keys(LOCATIONS_DATA).filter(k => {
            const loc = LOCATIONS_DATA[k];
            if (!loc || loc.isLandmark || !loc.coords) return false;
            if (k === currentName || loc.name === currentName) return false;
            if (k === "Planet Xerxes" && (typeof xerxesPuzzleLevel === 'undefined' || xerxesPuzzleLevel < 1)) return false;
            return Boolean(loc.isBlackMarket);
        });

        if (blackMarkets.length === 0) {
            blackMarkets = Object.keys(LOCATIONS_DATA).filter(k => {
                const loc = LOCATIONS_DATA[k];
                return loc && !loc.isLandmark && loc.coords && k !== currentName && loc.name !== currentName;
            });
        }

        const destKey = blackMarkets[Math.floor(Math.random() * blackMarkets.length)] || "The Rusty Anchor";
        const destObj = LOCATIONS_DATA[destKey];
        const destName = (destObj && destObj.name) ? destObj.name : destKey;
        const payout = 15000 + Math.floor(Math.random() * 10000);

        cachedOffer = {
            day: dayKey,
            destKey,
            destName,
            coords: destObj ? destObj.coords : null,
            payout
        };
        window._brokerSmuggleOffers[currentName] = cachedOffer;
    }

    const { destName, payout, coords } = cachedOffer;
    let routeRowHtml = '';
    if (coords) {
        const nav = _tradeDistAndBearing(coords.x, coords.y);
        routeRowHtml = `
            <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between;">
                <span style="color:var(--item-desc-color)">Vector:</span>
                <span style="color:var(--accent-color); font-weight:bold;">[${coords.x}, ${-coords.y}] · ${nav.distance}u ${nav.bearing}</span>
            </div>
        `;
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; filter: hue-rotate(300deg);">📦</div>
            <h3 style="color:var(--danger); margin:0;">HOT CARGO RUN</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0; line-height: 1.5;">
                "I have a crate of highly classified Concord data-cores. The problem? They have active tracking beacons inside. The moment you leave the station, Aegis Pursuit Craft will warp in and hunt you."
            </p>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--danger); padding:10px; border-radius:4px; text-align:left;">
                <div style="color:var(--danger); font-size:11px; margin-bottom:8px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">CONTRACT PARAMETERS:</div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Drop-off Location:</span> 
                    <span style="color:var(--accent-color); font-weight:bold;">${_tradeEscapeHtml(destName)}</span>
                </div>
                ${routeRowHtml}
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Cargo Requirement:</span> 
                    <span style="color:var(--text-color);">10 Units (Heavy)</span>
                </div>
                <div style="font-size:14px; margin-top:10px; display:flex; justify-content:space-between; border-top: 1px dashed #555; padding-top: 10px;">
                    <span style="color:#DDA0DD; font-weight:bold;">COMPLETION PAYOUT:</span> 
                    <span style="color:var(--gold-text); font-weight:bold;">${_tradeFormat(payout)}c</span>
                </div>
            </div>
        </div>
    `;

    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - currentCargoLoad;
    let btnHtml = "";
    if (spaceLeft < 10) {
        btnHtml = `<button class="action-button danger-btn" disabled>INSUFFICIENT CARGO SPACE (Needs 10)</button>`;
    } else if (playerActiveMission) {
        btnHtml = `<button class="action-button danger-btn" disabled>LIMIT 1 ACTIVE CONTRACT</button>`;
    } else {
        btnHtml = `
            <button class="action-button" style="border-color:var(--danger); color:var(--danger); box-shadow: 0 0 15px rgba(255,0,0,0.3);" onclick="acceptSmugglingRun('${_tradeEscapeJsArg(destName)}', ${payout})">ACCEPT HOT CARGO</button>
        `;
    }
    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>`;
    actionsEl.innerHTML = btnHtml;
}

function acceptSmugglingRun(destName, payout) {
    playerCargo['HOT_CARGO'] = (playerCargo['HOT_CARGO'] || 0) + 1;
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    playerActiveMission = {
        id: "SMUGGLE_" + Date.now(),
        type: "DELIVERY",
        title: "Smuggle Hot Cargo",
        giver: destName,
        faction: "ECLIPSE",
        isComplete: false,
        description: `Evade Concord patrols and deliver the Tracked Contraband to ${destName}. Use Silent Running (Q) to break target locks.`,
        rewards: { credits: payout, xp: 500, notoriety: 5 },
        objectives: [{ type: "DELIVERY", destinationName: destName, itemID: "HOT_CARGO", count: 1 }],
        progress: { delivery_0: { delivered: 0, required: 1, complete: false, destinationName: destName } }
    };

    logMessage(`<span style="color:var(--danger); font-weight:bold;">[ CONTRACT ACCEPTED ]</span> The tracker is active. Concord intercepts will arrive momentarily. Deliver to <b>${_tradeEscapeHtml(destName)}</b>.`);
    if (typeof showToast === 'function') showToast("HOT CARGO LOADED", "warning");
    if (typeof soundManager !== 'undefined') soundManager.playWarning();

    closeGenericModal();
    if (typeof renderMissionTracker === 'function') renderMissionTracker();
    _refreshTradeHUD();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function showShadowBrokerItemDetails(itemId) {
    const item = COMMODITIES[itemId];
    if (!item || !playerCargo[itemId]) return;
    const qty = playerCargo[itemId];
    const unitPrice = getShadowBrokerUnitPrice(itemId);
    const totalValue = unitPrice * qty;

    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const soldLocally = loc && loc.sells && loc.sells.some(s => (s.id === itemId) || (s === itemId));
    const safeItemArg = _tradeEscapeJsArg(itemId);

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px;">${item.icon || '📦'}</div>
            <h3 style="color:#FF5555; margin:0;">${_tradeEscapeHtml(item.name.toUpperCase())}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0;">${_tradeEscapeHtml(item.description)}</p>
            
            ${soldLocally ? `
                <div style="background:rgba(255,170,0,0.1); border:1px solid var(--warning); padding:8px; border-radius:4px; margin-bottom:12px; font-size:11px; color:var(--warning); text-align:left;">
                    ⚠️ <b>LOCAL MERCHANDISE:</b> This port already stocks ${_tradeEscapeHtml(item.name)}. Smuggle it to a different black market for triple street value!
                </div>
            ` : ''}

            <div style="background:rgba(0,0,0,0.3); border:1px solid #FF5555; padding:10px; border-radius:4px; text-align:left;">
                <div style="color:#FF5555; font-size:11px; margin-bottom:8px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">BLACK MARKET VALUATION:</div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Quantity:</span> 
                    <span style="color:var(--text-color); font-weight:bold;">${qty}</span>
                </div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Street Value (Per Unit):</span> 
                    <span style="color:var(--gold-text);">${_tradeFormat(unitPrice)}c</span>
                </div>
                <div style="font-size:14px; margin-top:10px; display:flex; justify-content:space-between; border-top: 1px dashed #555; padding-top: 10px;">
                    <span style="color:#DDA0DD; font-weight:bold;">TOTAL PAYOUT:</span> 
                    <span style="color:var(--success); font-weight:bold;">${_tradeFormat(totalValue)}c</span>
                </div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 10px rgba(153,51,255,0.2);" onclick="processShadowBrokerTrade('${safeItemArg}')">FENCE GOODS (${_tradeFormat(totalValue)}c)</button>
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
    `;
}

function showFenceAllDetails(totalValue) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; filter: hue-rotate(240deg);">💼</div>
            <h3 style="color:#9933FF; margin:0;">BULK FENCE</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0;">"I'll take the whole lot off your hands. No questions asked, no logs kept. Concord will never know you had it."</p>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid #9933FF; padding:10px; border-radius:4px; text-align:center;">
                <div style="color:#DDA0DD; font-size:11px; margin-bottom:8px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">TOTAL BLACK MARKET VALUATION</div>
                <div style="font-size:24px; color:var(--success); font-weight:bold; margin-top:10px;">
                    ${_tradeFormat(totalValue)}c
                </div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--success); color:var(--success); box-shadow: 0 0 15px rgba(0,255,0,0.2);" onclick="processShadowBrokerTrade('ALL')">FENCE ALL CONTRABAND</button>
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
    `;
}

function processShadowBrokerTrade(itemId) {
    let totalProfit = 0;
    const soldItemsText = [];

    if (itemId === 'ALL') {
        for (const id in playerCargo) {
            if (id === 'HOT_CARGO') continue;
            if (playerCargo[id] > 0 && COMMODITIES[id] && COMMODITIES[id].illegal) {
                const qty = playerCargo[id];
                const value = getShadowBrokerUnitPrice(id) * qty;
                totalProfit += value;
                soldItemsText.push(`${qty}x ${COMMODITIES[id].name}`);

                delete playerCargo[id];
                delete window.playerCargoCostBasis[id];
            }
        }
    } else if (itemId !== 'HOT_CARGO' && playerCargo[itemId] > 0) {
        const qty = playerCargo[itemId];
        const value = getShadowBrokerUnitPrice(itemId) * qty;
        totalProfit += value;
        soldItemsText.push(`${qty}x ${COMMODITIES[itemId].name}`);

        delete playerCargo[itemId];
        delete window.playerCargoCostBasis[itemId];
    }

    if (totalProfit > 0) {
        playerCredits += totalProfit;
        updateCurrentCargoLoad();
        if (typeof unlockLoreEntry === 'function') unlockLoreEntry("FACTION_ECLIPSE_SMUGGLING");

        if (typeof soundManager !== 'undefined') soundManager.playGain();

        logMessage(`<span style="color:#DDA0DD">[ FENCED ] Sold ${_tradeEscapeHtml(soldItemsText.join(', '))} for ${_tradeFormat(totalProfit)}c.</span>`);
        if (typeof showToast === 'function') showToast(`CONTRABAND FENCED (+${_tradeFormat(totalProfit)}c)`, "success");

        _refreshTradeHUD();
        renderShadowBrokerList();

        const detailEl = document.getElementById('genericDetailContent');
        const actionsEl = document.getElementById('genericModalActions');
        if (detailEl) {
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <div style="font-size:50px; margin-bottom:10px; color:var(--success);">🤝</div>
                    <h3 style="color:var(--success);">TRANSACTION COMPLETE</h3>
                    <p style="color:var(--text-color); font-size:13px; line-height:1.5;">"A pleasure doing business. Stay off the Concord's radar."</p>
                    <p style="color:var(--gold-text); font-weight:bold; margin-top:10px;">+${_tradeFormat(totalProfit)}c</p>
                </div>
            `;
        }
        if (actionsEl) {
            actionsEl.innerHTML = `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
            `;
        }
        if (typeof autoSaveGame === 'function') autoSaveGame();
    }
}

// ==========================================
// --- CRYPTARCH MODAL SYSTEM ---
// ==========================================

function visitCryptarch() {
    openGenericModal("CRYPTARCH SANCTUM");

    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const isAtXerxes = Boolean(
        (document.getElementById('xerxesOverlay') && document.getElementById('xerxesOverlay').style.display === 'flex') ||
        (loc && loc.name && loc.name.includes('Xerxes'))
    );

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <img src="assets/cryptarch.png" onerror="this.style.display='none'" alt="The Cryptarch" 
                 style="width: 128px; height: 128px; object-fit: cover; image-rendering: pixelated; 
                        border: 2px solid var(--accent-color); border-radius: 8px; margin-bottom: 15px; 
                        box-shadow: 0 0 20px rgba(0, 224, 224, 0.2); background: #000;">
            <h3 style="color:var(--accent-color); margin-bottom:10px;">THE CRYPTARCH</h3>
            ${isAtXerxes ? `<div style="display:inline-block; margin-bottom:10px; padding:3px 8px; border:1px solid #9933FF; background:rgba(153,51,255,0.15); color:#DDA0DD; font-size:10px; font-weight:bold; letter-spacing:1px;">✦ XERXES SPIRE RESONANCE ACTIVE (2x DECRYPTION XP)</div>` : ''}
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Secrets of the void, locked away in crystalline matrices. Bring me your engrams, data caches, and Precursor relics, and I will reveal their truths... for a price."
            </p>
        </div>
    `;
    actionsEl.innerHTML = `
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">
            ◀ BACK TO CONCOURSE
        </button>
    `;

    renderCryptarchList();
}

function renderCryptarchList() {
    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const encryptedItems = ['ENCRYPTED_ENGRAM', 'ENCRYPTED_DATA', 'ANCIENT_ARCHIVE'];
    const scholarlyRelics = ['ARTIFACT_SHARDS', 'ANCIENT_RELICS', 'PRECURSOR_DATACUBE', 'PRECURSOR_STAR_MAP_FRAGMENT'];
    let foundAny = false;

    encryptedItems.forEach(itemId => {
        if (playerCargo[itemId] && playerCargo[itemId] > 0 && COMMODITIES[itemId]) {
            foundAny = true;
            const item = COMMODITIES[itemId];
            const qty = playerCargo[itemId];

            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.innerHTML = `<span style="color:var(--accent-color); font-weight:bold;">💠 ${_tradeEscapeHtml(item.name)}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showCryptarchItemDetails(itemId);
            listEl.appendChild(row);
        }
    });

    // Also allow selling physical Precursor relics directly to the Cryptarch for a scholarly grant + XP
    scholarlyRelics.forEach(relicId => {
        if (playerCargo[relicId] && playerCargo[relicId] > 0 && COMMODITIES[relicId]) {
            foundAny = true;
            const item = COMMODITIES[relicId];
            const qty = playerCargo[relicId];
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.borderLeft = '3px solid var(--gold-text)';
            row.innerHTML = `<span style="color:var(--gold-text); font-weight:bold;">🏺 ${_tradeEscapeHtml(item.name)}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showCryptarchRelicAppraisal(relicId);
            listEl.appendChild(row);
        }
    });

    if (!foundAny) {
        listEl.innerHTML = `<div style="padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;">No encrypted goods or Precursor relics detected in your cargo hold. Come back when you find something interesting.</div>`;
    }
}

function showCryptarchRelicAppraisal(relicId) {
    const item = COMMODITIES[relicId];
    if (!item || !playerCargo[relicId]) return;
    const qty = playerCargo[relicId];
    const unitGrant = Math.floor(item.basePrice * 2.2);
    const unitXp = Math.max(25, Math.floor(item.basePrice * 0.15));
    const safeRelicArg = _tradeEscapeJsArg(relicId);

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const mapHintHtml = relicId === 'PRECURSOR_STAR_MAP_FRAGMENT'
        ? `<div style="margin-bottom:12px; padding:8px; background:rgba(0,224,224,0.08); border:1px solid var(--accent-color); border-radius:4px; font-size:11px; color:var(--accent-color); text-align:left;">
               💡 <b>TIP:</b> Collect 3 Star Map Fragments and activate them in Cargo (I) to assemble an intact <b>Wayfinder Core</b>.
           </div>`
        : '';

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px;">🏺</div>
            <h3 style="color:var(--gold-text); margin:0;">${_tradeEscapeHtml(item.name.toUpperCase())}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0;">${_tradeEscapeHtml(item.description)}</p>
            ${mapHintHtml}
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--gold-text); padding:10px; border-radius:4px; text-align:left;">
                <div style="color:var(--gold-text); font-size:11px; margin-bottom:8px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">SCHOLARLY ENDOWMENT:</div>
                <div class="trade-stat-row"><span>Owned:</span> <span style="color:var(--text-color); font-weight:bold;">${qty}</span></div>
                <div class="trade-stat-row"><span>Grant per Relic:</span> <span style="color:var(--gold-text); font-weight:bold;">${_tradeFormat(unitGrant)}c</span></div>
                <div class="trade-stat-row"><span>Research XP per Relic:</span> <span style="color:var(--success); font-weight:bold;">+${unitXp} XP</span></div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="donateRelicToCryptarch('${safeRelicArg}', 1)">TURN IN 1x (+${_tradeFormat(unitGrant)}c, +${unitXp} XP)</button>
        ${qty > 1 ? `<button class="action-button" style="border-color:var(--success); color:var(--success);" onclick="donateRelicToCryptarch('${safeRelicArg}', ${qty})">TURN IN ALL ${qty}x (+${_tradeFormat(unitGrant * qty)}c)</button>` : ''}
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
    `;
}

function donateRelicToCryptarch(relicId, count = 1) {
    const owned = playerCargo[relicId] || 0;
    const item = COMMODITIES[relicId];
    if (!item || owned <= 0) return;

    const actualCount = Math.min(owned, count);
    const totalCredits = Math.floor(item.basePrice * 2.2) * actualCount;
    const totalXp = Math.max(25, Math.floor(item.basePrice * 0.15)) * actualCount;

    playerCargo[relicId] -= actualCount;
    if (playerCargo[relicId] <= 0) {
        delete playerCargo[relicId];
        delete window.playerCargoCostBasis[relicId];
    }
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    playerCredits += totalCredits;
    playerXP += totalXp;
    if (typeof unlockLoreEntry === 'function') {
        unlockLoreEntry("XENO_PRECURSORS");
        if (relicId === 'PRECURSOR_DATACUBE') unlockLoreEntry("COMMODITY_PRECURSOR_DATACUBE");
        if (relicId === 'PRECURSOR_STAR_MAP_FRAGMENT') unlockLoreEntry("COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT");
    }

    logMessage(`<span style="color:var(--gold-text)">[ CRYPTARCH ]</span> Appraised ${actualCount}x ${_tradeEscapeHtml(item.name)} for <b>${_tradeFormat(totalCredits)}c</b> and <b>+${totalXp} XP</b>.`);
    if (typeof showToast === 'function') showToast(`RELIC APPRAISED: +${_tradeFormat(totalCredits)}c`, "success");
    if (typeof soundManager !== 'undefined') soundManager.playGain();

    const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
    _refreshTradeHUD();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    if (!leveledUp) {
        visitCryptarch();
    }
}

function showCryptarchItemDetails(itemId) {
    const item = COMMODITIES[itemId];
    if (!item) return;
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const hasCipher = (playerCargo['PRECURSOR_CIPHER'] || 0) > 0;
    const hasPerk = _tradeHasPerk('CYBER_SLICER');
    const safeItemArg = _tradeEscapeJsArg(itemId);

    let decryptCost = 250;
    if (itemId === 'ENCRYPTED_DATA') decryptCost = 500;
    if (itemId === 'ANCIENT_ARCHIVE') decryptCost = 1000;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; animation: pulse-cyan 2s infinite;">💠</div>
            <h3 style="color:var(--accent-color); margin:0;">${_tradeEscapeHtml(item.name.toUpperCase())}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0;">${_tradeEscapeHtml(item.description)}</p>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:10px; border-radius:4px; text-align:left;">
                <div style="color:var(--text-color); font-size:11px; margin-bottom:8px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">DECRYPTION METHODS:</div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Standard Fee:</span> 
                    <span style="color:var(--gold-text); font-weight:bold;">${decryptCost}c</span>
                </div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Precursor Cipher:</span> 
                    <span style="color:${hasCipher ? 'var(--success)' : 'var(--danger)'}">${hasCipher ? 'Available (' + playerCargo['PRECURSOR_CIPHER'] + ')' : 'None'}</span>
                </div>
                <div style="font-size:13px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Cyber Slicer Perk:</span> 
                    <span style="color:${hasPerk ? 'var(--accent-color)' : 'var(--danger)'}">${hasPerk ? 'Active' : 'Not Installed'}</span>
                </div>
            </div>
        </div>
    `;

    let btnHtml = '';

    if (hasPerk) {
        btnHtml += `<button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" onclick="processDecryption('perk', '${safeItemArg}')">USE CYBER SLICER (FREE)</button>`;
    }
    if (hasCipher) {
        btnHtml += `<button class="action-button" style="border-color:var(--success); color:var(--success);" onclick="processDecryption('cipher', '${safeItemArg}')">USE CIPHER (CONSUMES 1)</button>`;
    }
    const canAfford = playerCredits >= decryptCost;
    btnHtml += `<button class="action-button" ${canAfford ? '' : 'disabled'} style="border-color:var(--gold-text); color:var(--gold-text);" onclick="processDecryption('credits', '${safeItemArg}')">PAY CRYPTARCH (${decryptCost}c)</button>`;
    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>`;

    actionsEl.innerHTML = btnHtml;
}

function processDecryption(method, itemId = 'ENCRYPTED_ENGRAM') {
    if (!playerCargo[itemId] || playerCargo[itemId] <= 0) return;

    let cost = 250;
    if (itemId === 'ENCRYPTED_DATA') cost = 500;
    if (itemId === 'ANCIENT_ARCHIVE') cost = 1000;

    const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const isAtXerxes = Boolean(
        (document.getElementById('xerxesOverlay') && document.getElementById('xerxesOverlay').style.display === 'flex') ||
        (loc && loc.name && loc.name.includes('Xerxes'))
    );
    const xpMultiplier = isAtXerxes ? 2 : 1;

    if (method === 'cipher') {
        if ((playerCargo['PRECURSOR_CIPHER'] || 0) <= 0) return;
        playerCargo['PRECURSOR_CIPHER'] -= 1;
        if (playerCargo['PRECURSOR_CIPHER'] <= 0) delete playerCargo['PRECURSOR_CIPHER'];
        logMessage(`Cipher consumed. Initiating decryption...`);
    } else if (method === 'credits') {
        if (playerCredits < cost) {
            if (typeof showToast === 'function') showToast(`INSUFFICIENT FUNDS (${cost}c Required)`, "error");
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }
        playerCredits -= cost;
        logMessage(`You pay the ${cost}c fee. The Cryptarch begins working...`);
    } else if (method === 'perk') {
        logMessage("Cyber Slicer perk active. Bypassing encryption...");
    }

    playerCargo[itemId] -= 1;
    if (playerCargo[itemId] <= 0) {
        delete playerCargo[itemId];
        delete window.playerCargoCostBasis[itemId];
    }

    updateCurrentCargoLoad();

    let xpReward = 150;
    let textReward = "Data recovered.";
    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);

    if (itemId === 'ENCRYPTED_ENGRAM') {
        const rewards = [
            { xp: 180, lore: "XENO_THE_SPIRE", text: "SPIRE CIPHER FRAGMENT: 'The ruler of the sunless world is the DARKNESS.'" },
            { xp: 260, lore: "LOCATION_SANCTUARY_OF_THE_VOID", text: "NAV-DATA RECOVERED: 'Precursor Sanctuary conduit active at coordinates [39, 17].'" },
            { xp: 240, lore: "LOCATION_CHOIR_SPIRE_ALPHA", text: "PILGRIM VECTOR: 'Offer a single Void Crystal at Choir Spire Alpha [-115, -145] for renewal.'" },
            { xp: 280, lore: "LOCATION_SILENTIUM_RELAY_ZERO", text: "DEEP-RIM BEACON: 'Silentium Relay Zero holds at [280, 240]—the last warning before the Silence.'" },
            { xp: 240, lore: "LEGEND_DIASPORA_ARKS", text: "DIASPORA TELEMETRY: '2144 CE sleeper ark CSS Hesperia located adrift near [-145, 185].'" },
            { xp: 500, itemDrop: "VOID_CRYSTALS", qty: 2, lore: "PHENOMENON_VOID_CRYSTALS", text: "JACKPOT: Precursor crystalline matrix stabilized into Void Crystals!" },
            { xp: 400, itemDrop: "PRECURSOR_STAR_MAP_FRAGMENT", qty: 1, lore: "COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT", text: "ASTRONOMICAL CACHE: Extracted an intact Precursor Star Map Fragment!" }
        ];
        const r = rewards[Math.floor(Math.random() * rewards.length)];
        xpReward = r.xp;
        textReward = r.text;

        if (r.lore && typeof unlockLoreEntry === 'function') {
            unlockLoreEntry(r.lore);
        }
        if (r.itemDrop && COMMODITIES[r.itemDrop]) {
            const wantQty = r.qty || 1;
            const weight = COMMODITIES[r.itemDrop].weight !== undefined ? COMMODITIES[r.itemDrop].weight : 1;
            const maxFit = weight > 0 ? Math.floor(spaceLeft / weight) : wantQty;
            const actualAdded = Math.max(0, Math.min(wantQty, maxFit));
            if (actualAdded > 0) {
                playerCargo[r.itemDrop] = (playerCargo[r.itemDrop] || 0) + actualAdded;
                updateCurrentCargoLoad();
                textReward += ` (+${actualAdded}x ${COMMODITIES[r.itemDrop].name})`;
                if (actualAdded < wantQty) textReward += " — Cargo hold full, remainder lost.";
            } else {
                textReward += ` (Hold full — ${COMMODITIES[r.itemDrop].name} could not be stowed!)`;
            }
        }
    } else if (itemId === 'ENCRYPTED_DATA') {
        xpReward = 250;
        const creditBonus = 500 + Math.floor(Math.random() * 500);
        playerCredits += creditBonus;
        const dataFlavors = [
            `Decrypted Syndicate shipping ledger (+${_tradeFormat(creditBonus)}c broker payout).`,
            `Recovered pre-Concord astrometric survey records (+${_tradeFormat(creditBonus)}c Cygnus grant).`,
            `Cracked Xy-Corp mineral assay drive (+${_tradeFormat(creditBonus)}c finder's fee).`
        ];
        textReward = dataFlavors[Math.floor(Math.random() * dataFlavors.length)];
    } else if (itemId === 'ANCIENT_ARCHIVE') {
        xpReward = 500;
        const creditBonus = 1000 + Math.floor(Math.random() * 1000);
        playerCredits += creditBonus;
        const archiveFlavors = [
            `Holographic array unlocked: 'We tuned the First Chord to outlast the Silence.' (+${_tradeFormat(creditBonus)}c endowment).`,
            `Precursor star-atlas restored: 'Three shards form the Compass; the Compass wakes the Nexus.' (+${_tradeFormat(creditBonus)}c endowment).`,
            `Forbidden Observatory logs recovered: 'At [-85, -220], the Whispering Prism splits voidlight into harmonic glass.' (+${_tradeFormat(creditBonus)}c endowment).`
        ];
        textReward = archiveFlavors[Math.floor(Math.random() * archiveFlavors.length)];
        if (typeof unlockLoreEntry === 'function') {
            unlockLoreEntry('XENO_PRECURSORS');
            unlockLoreEntry('PRECURSOR_ORIGINS');
            unlockLoreEntry('LEGEND_THE_SILENCERS');
        }
    }

    const finalXP = xpReward * xpMultiplier;
    playerXP += finalXP;

    if (isAtXerxes) {
        logMessage(`<span style="color:#00E0E0">> SPIRE RESONANCE: Decryption output doubled! (+${finalXP} XP)</span>`);
        if (typeof xerxesLog === 'function') xerxesLog("Spire energy channeled into decryption. Output maximized.", "good");
    }

    logMessage(`<span style="color:#DDA0DD">> SUCCESS: ${_tradeEscapeHtml(textReward)}</span>`);
    if (typeof showToast === 'function') showToast(`DECRYPTED: +${finalXP} XP`, "success");

    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;

    if (!leveledUp) {
        if (document.getElementById('cargoOverlay') && document.getElementById('cargoOverlay').style.display !== 'none') {
            renderCargoList();
        } else if (document.getElementById('genericModalOverlay') && document.getElementById('genericModalOverlay').style.display !== 'none') {
            renderCryptarchList();
            const remainingCount = playerCargo[itemId] || 0;
            const safeItemArg = _tradeEscapeJsArg(itemId);
            document.getElementById('genericDetailContent').innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <div style="font-size:50px; margin-bottom:10px; color:var(--success);">✅</div>
                    <h3 style="color:var(--success);">DECRYPTION SUCCESSFUL</h3>
                    <p style="color:var(--text-color); font-size:13px; line-height:1.55;">${_tradeEscapeHtml(textReward)}</p>
                    <p style="color:var(--accent-color); font-weight:bold; margin-top:10px;">+${finalXP} XP ${isAtXerxes ? '(XERXES BOOST)' : ''}</p>
                </div>
            `;
            let actionButtons = '';
            if (remainingCount > 0) {
                actionButtons += `<button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="showCryptarchItemDetails('${safeItemArg}')">DECRYPT NEXT (${remainingCount} LEFT)</button>`;
            }
            actionButtons += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>`;
            document.getElementById('genericModalActions').innerHTML = actionButtons;
        }
    }
    _refreshTradeHUD();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// Route Eclipse station "Shadow Broker" button directly into the full Shadow Broker & Smuggling UI
function fenceEclipseContraband() {
    openShadowBroker();
}

// ==========================================
// --- THE FORGER (TRANSPONDER & ID SPOOFING) ---
// ==========================================

function _countActivePursuers() {
    if (typeof activeEnemies === 'undefined' || !Array.isArray(activeEnemies)) return 0;
    return activeEnemies.filter(e => e && !e.isBountyTarget && !e.isProbe && !e.isLegendary).length;
}

function buyFakeID() {
    openGenericModal("THE FORGER : IDENTITY SPOOFING");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const currentNotoriety = typeof playerNotoriety !== 'undefined' ? playerNotoriety : 0;
    const scrubCost = Math.max(300, currentNotoriety * 300);
    const pursuerCount = _countActivePursuers();

    listEl.innerHTML = `
        <div class="trade-list-header" style="color:#9933FF; font-size:10px; letter-spacing:2px; border-bottom:1px solid #333;">
            FORGERY SERVICES
        </div>
        <div class="trade-item-row" onclick="showForgerService('SCRUB_WARRANTS')" style="padding:12px 10px;">
            <div>
                <div style="color:#DDA0DD; font-weight:bold; font-size:13px;">🪪 Wipe Concord Warrants</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Erases active Notoriety (${currentNotoriety})</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">${currentNotoriety > 0 ? _tradeFormat(scrubCost) + 'c' : 'CLEAN'}</span>
        </div>
        <div class="trade-item-row" onclick="showForgerService('DIPLOMATIC_ID')" style="padding:12px 10px;">
            <div>
                <div style="color:var(--accent-color); font-weight:bold; font-size:13px;">📜 Forged Concord Credentials</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Restores/Boosts Concord Rep (+15)</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">2,500c</span>
        </div>
        <div class="trade-item-row" onclick="showForgerService('KTHARR_SIGNET')" style="padding:12px 10px;">
            <div>
                <div style="color:var(--danger); font-weight:bold; font-size:13px;">🩸 Counterfeit K'tharr Blood-Signet</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Restores/Boosts K'tharr Rep (+15)</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">2,500c</span>
        </div>
        <div class="trade-item-row" onclick="showForgerService('ECLIPSE_VOUCH')" style="padding:12px 10px;">
            <div>
                <div style="color:#9933FF; font-weight:bold; font-size:13px;">🎲 Syndicate Cipher Vouch</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Restores/Boosts Eclipse Rep (+15)</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">2,000c</span>
        </div>
        <div class="trade-item-row" onclick="showForgerService('CALLSIGN_SCRAMBLE')" style="padding:12px 10px;">
            <div>
                <div style="color:var(--success); font-weight:bold; font-size:13px;">📡 Scramble Hull Transponder</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Throws off active pursuit ships (${pursuerCount} detected)</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">${pursuerCount > 0 ? '1,200c' : 'CLEAR'}</span>
        </div>
    `;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:55px; margin-bottom:15px; filter: drop-shadow(0 0 15px #9933FF);">🪪</div>
            <h3 style="color:#9933FF; margin-bottom:10px;">THE IDENTITY BROKER</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5; font-style:italic;">
                "Names, hull registries, criminal ledgers—it's all just quantum ink in the Concord's database. Tell me who you want to be, Commander."
            </p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">
            ◀ BACK TO CONCOURSE
        </button>
    `;
}

function showForgerService(serviceType) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const currentNotoriety = typeof playerNotoriety !== 'undefined' ? playerNotoriety : 0;

    if (serviceType === 'SCRUB_WARRANTS') {
        const cost = Math.max(300, currentNotoriety * 300);
        const canUse = currentNotoriety > 0 && playerCredits >= cost;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <div style="font-size:48px; margin-bottom:10px;">🪪</div>
                <h3 style="color:#DDA0DD; margin:0 0 10px 0;">SCRUB CONCORD WARRANTS</h3>
                <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid #9933FF; text-align:left;">
                    Slices into SEC-COM's regional relay and purges all active warrants tied to your biometric signature. Cheaper than paying official Concord fines.
                </p>
                <div class="trade-math-area" style="text-align:left;">
                    <div class="trade-stat-row"><span>Current Notoriety:</span> <span style="color:var(--danger); font-weight:bold;">${currentNotoriety} Infractions</span></div>
                    <div class="trade-stat-row"><span>Slicing Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">${_tradeFormat(cost)}c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canUse ? 'disabled' : ''} style="border-color:#9933FF; color:#DDA0DD;" onclick="executeForgerService('SCRUB_WARRANTS', ${cost})">
                ${currentNotoriety <= 0 ? 'RECORD ALREADY CLEAN' : (playerCredits < cost ? 'INSUFFICIENT FUNDS' : `PURGE WARRANTS (${_tradeFormat(cost)}c)`)}
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    } else if (serviceType === 'DIPLOMATIC_ID') {
        const cost = 2500;
        const canAfford = playerCredits >= cost;
        const concordRep = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding['CONCORD']) ? playerFactionStanding['CONCORD'] : 0;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <div style="font-size:48px; margin-bottom:10px;">📜</div>
                <h3 style="color:var(--accent-color); margin:0 0 10px 0;">FORGED CLEARANCE CODES</h3>
                <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--accent-color); text-align:left;">
                    Plants falsified merchant commendations into the Concord diplomatic registry, boosting your Concord standing by +15.
                </p>
                <div class="trade-math-area" style="text-align:left;">
                    <div class="trade-stat-row"><span>Current Concord Rep:</span> <span style="color:var(--accent-color); font-weight:bold;">${concordRep}</span></div>
                    <div class="trade-stat-row"><span>Forgery Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">2,500c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canAfford ? 'disabled' : ''} style="border-color:var(--accent-color); color:var(--accent-color);" onclick="executeForgerService('DIPLOMATIC_ID', 2500)">
                ${canAfford ? 'PURCHASE CLEARANCE (2,500c)' : 'INSUFFICIENT FUNDS'}
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    } else if (serviceType === 'KTHARR_SIGNET') {
        const cost = 2500;
        const canAfford = playerCredits >= cost;
        const ktharrRep = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding['KTHARR']) ? playerFactionStanding['KTHARR'] : 0;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <div style="font-size:48px; margin-bottom:10px;">🩸</div>
                <h3 style="color:var(--danger); margin:0 0 10px 0;">K'THARR BLOOD-SIGNET</h3>
                <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--danger); text-align:left;">
                    Transmits falsified trophy-kill telemetry to K'tharr border warlords, raising your K'tharr Ascendancy standing by +15.
                </p>
                <div class="trade-math-area" style="text-align:left;">
                    <div class="trade-stat-row"><span>Current K'tharr Rep:</span> <span style="color:var(--danger); font-weight:bold;">${ktharrRep}</span></div>
                    <div class="trade-stat-row"><span>Forgery Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">2,500c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canAfford ? 'disabled' : ''} style="border-color:var(--danger); color:var(--danger);" onclick="executeForgerService('KTHARR_SIGNET', 2500)">
                ${canAfford ? 'PURCHASE SIGNET (2,500c)' : 'INSUFFICIENT FUNDS'}
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    } else if (serviceType === 'ECLIPSE_VOUCH') {
        const cost = 2000;
        const canAfford = playerCredits >= cost;
        const eclipseRep = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding['ECLIPSE']) ? playerFactionStanding['ECLIPSE'] : 0;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <div style="font-size:48px; margin-bottom:10px;">🎲</div>
                <h3 style="color:#9933FF; margin:0 0 10px 0;">SYNDICATE CIPHER VOUCH</h3>
                <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid #9933FF; text-align:left;">
                    Bribes high-ranking Eclipse Cartel ledger-keepers to vouch for your crew, boosting your Eclipse standing by +15.
                </p>
                <div class="trade-math-area" style="text-align:left;">
                    <div class="trade-stat-row"><span>Current Eclipse Rep:</span> <span style="color:#9933FF; font-weight:bold;">${eclipseRep}</span></div>
                    <div class="trade-stat-row"><span>Bribe Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">2,000c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canAfford ? 'disabled' : ''} style="border-color:#9933FF; color:#DDA0DD;" onclick="executeForgerService('ECLIPSE_VOUCH', 2000)">
                ${canAfford ? 'PURCHASE VOUCH (2,000c)' : 'INSUFFICIENT FUNDS'}
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    } else if (serviceType === 'CALLSIGN_SCRAMBLE') {
        const cost = 1200;
        const pursuers = _countActivePursuers();
        const canUse = pursuers > 0 && playerCredits >= cost;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <div style="font-size:48px; margin-bottom:10px;">📡</div>
                <h3 style="color:var(--success); margin:0 0 10px 0;">TRANSPONDER SCRAMBLE</h3>
                <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--success); text-align:left;">
                    Cycles your hull's sub-space beacon frequencies, immediately throwing off all non-bounty hostile pursuers in the sector.
                </p>
                <div class="trade-math-area" style="text-align:left;">
                    <div class="trade-stat-row"><span>Active Pursuers:</span> <span style="color:${pursuers > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">${pursuers} Hostile(s)</span></div>
                    <div class="trade-stat-row"><span>Service Cost:</span> <span style="color:var(--gold-text); font-weight:bold;">1,200c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canUse ? 'disabled' : ''} style="border-color:var(--success); color:var(--success);" onclick="executeForgerService('CALLSIGN_SCRAMBLE', 1200)">
                ${pursuers <= 0 ? 'NO ACTIVE PURSUERS DETECTED' : (playerCredits < cost ? 'INSUFFICIENT FUNDS' : 'SCRAMBLE TRANSPONDER (1,200c)')}
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    }
}

function executeForgerService(serviceType, cost) {
    if (playerCredits < cost) return;
    if (serviceType === 'CALLSIGN_SCRAMBLE' && _countActivePursuers() <= 0) return;

    playerCredits -= cost;

    if (serviceType === 'SCRUB_WARRANTS') {
        playerNotoriety = 0;
        if (typeof updateNotorietyTitle === 'function') updateNotorietyTitle();
        logMessage("<span style='color:#DDA0DD'>[ FORGER ] Biometric warrants purged from SEC-COM relays. Your record is clean.</span>");
        if (typeof showToast === 'function') showToast("WARRANTS WIPED", "success");
    } else if (serviceType === 'DIPLOMATIC_ID') {
        playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 15;
        logMessage("<span style='color:var(--accent-color)'>[ FORGER ] Falsified diplomatic credentials uploaded (+15 Concord Standing).</span>");
        if (typeof showToast === 'function') showToast("+15 CONCORD REP", "success");
    } else if (serviceType === 'KTHARR_SIGNET') {
        playerFactionStanding['KTHARR'] = (playerFactionStanding['KTHARR'] || 0) + 15;
        logMessage("<span style='color:var(--danger)'>[ FORGER ] Counterfeit K'tharr Blood-Signet registered (+15 K'tharr Standing).</span>");
        if (typeof showToast === 'function') showToast("+15 K'THARR REP", "success");
    } else if (serviceType === 'ECLIPSE_VOUCH') {
        playerFactionStanding['ECLIPSE'] = (playerFactionStanding['ECLIPSE'] || 0) + 15;
        logMessage("<span style='color:#9933FF'>[ FORGER ] Syndicate ledger updated in your favor (+15 Eclipse Standing).</span>");
        if (typeof showToast === 'function') showToast("+15 ECLIPSE REP", "success");
    } else if (serviceType === 'CALLSIGN_SCRAMBLE') {
        if (typeof activeEnemies !== 'undefined') {
            activeEnemies = activeEnemies.filter(e => e.isBountyTarget || e.isProbe || e.isLegendary);
        }
        logMessage("<span style='color:var(--success)'>[ FORGER ] Hull transponder cycled. Pursuing patrols have lost your signal.</span>");
        if (typeof showToast === 'function') showToast("TRANSPONDER SCRAMBLED", "success");
    }

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    _refreshTradeHUD();
    if (typeof autoSaveGame === 'function') autoSaveGame();
    buyFakeID();
}

// ==========================================
// --- DEEP SPACE NPC TRADING ---
// ==========================================

function openShipTrade(npc) {
    if (!npc) return;

    // Cache the generated trade inventory on the NPC entity so re-opening doesn't reroll infinite stock
    if (!npc.cachedTradeProfile) {
        const profile = {
            id: npc.id,
            name: npc.name + " (Ship-to-Ship)",
            type: 'location',
            isNPC: true,
            faction: npc.faction || 'INDEPENDENT',
            isBlackMarket: npc.faction === 'ECLIPSE',
            sells: [
                { id: "FUEL_CELLS", priceMod: 1.5, stock: Math.floor(Math.random() * 10) + 5 },
                { id: "MEDICAL_SUPPLIES", priceMod: 1.2, stock: Math.floor(Math.random() * 5) + 2 },
                { id: "FROTHY_MOON_ALE", priceMod: 1.1, stock: Math.floor(Math.random() * 6) + 2 }
            ],
            buys: [
                { id: "MINERALS", priceMod: 0.9, stock: 50 },
                { id: "TECH_PARTS", priceMod: 1.1, stock: 10 },
                { id: "WATER", priceMod: 1.2, stock: 25 }
            ]
        };

        const lowerDesc = (npc.desc || "").toLowerCase();
        const lowerName = (npc.name || "").toLowerCase();

        if (npc.isColonyHauler || lowerName.includes("convoy")) {
            profile.sells = [
                { id: "REFINED_ALLOY", priceMod: 0.85, stock: Math.floor(Math.random() * 10) + 5 },
                { id: "LUXURY_GOODS", priceMod: 0.9, stock: Math.floor(Math.random() * 6) + 3 },
                { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: Math.floor(Math.random() * 20) + 10 }
            ];
            profile.buys = [
                { id: "TECH_PARTS", priceMod: 1.35, stock: 20 },
                { id: "FUEL_CELLS", priceMod: 1.4, stock: 25 },
                { id: "MEDICAL_SUPPLIES", priceMod: 1.3, stock: 15 }
            ];
        } else if (lowerName.includes("miner") || lowerDesc.includes("mining") || lowerDesc.includes("ore")) {
            profile.sells = [
                { id: "MINERALS", priceMod: 0.7, stock: Math.floor(Math.random() * 30) + 15 },
                { id: "RARE_METALS", priceMod: 0.8, stock: Math.floor(Math.random() * 5) + 1 },
                { id: "PLATINUM_ORE", priceMod: 0.85, stock: Math.floor(Math.random() * 4) + 2 },
                { id: "MINERAL_GEODE", priceMod: 0.9, stock: Math.floor(Math.random() * 3) + 1 }
            ];
            profile.buys = [
                { id: "FOOD_SUPPLIES", priceMod: 1.5, stock: 20 },
                { id: "FUEL_CELLS", priceMod: 1.5, stock: 15 },
                { id: "FROTHY_MOON_ALE", priceMod: 1.7, stock: 15 },
                { id: "NANO_REPAIR_KIT", priceMod: 1.4, stock: 10 }
            ];
        } else if (lowerName.includes("science") || lowerName.includes("survey") || lowerDesc.includes("research")) {
            profile.sells = [
                { id: "NAVIGATION_CHARTS", priceMod: 0.85, stock: Math.floor(Math.random() * 6) + 2 },
                { id: "QUANTUM_FLUID", priceMod: 0.9, stock: Math.floor(Math.random() * 4) + 2 },
                { id: "TELEMETRY_PROBE", priceMod: 0.95, stock: 2 }
            ];
            profile.buys = [
                { id: "PLANETARY_DATA", priceMod: 1.55, stock: 10 },
                { id: "GENETIC_SAMPLES", priceMod: 1.45, stock: 12 },
                { id: "VOID_CRYSTALS", priceMod: 1.5, stock: 8 }
            ];
        } else if (npc.faction === 'ECLIPSE' || lowerName.includes("smuggler") || lowerName.includes("shadow")) {
            profile.sells = [
                { id: "PROHIBITED_STIMS", priceMod: 1.1, stock: Math.floor(Math.random() * 8) + 2 },
                { id: "FORBIDDEN_TEXTS", priceMod: 1.3, stock: Math.floor(Math.random() * 3) + 1 },
                { id: "SENSOR_DECOY", priceMod: 1.0, stock: Math.floor(Math.random() * 3) + 1 }
            ];
            profile.buys = [
                { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: 30 },
                { id: "MEDICAL_SUPPLIES", priceMod: 1.2, stock: 15 },
                { id: "STOLEN_CONCORD_MEDALS", priceMod: 1.6, stock: 20 }
            ];
        } else if (npc.faction === 'KTHARR') {
            profile.sells = [
                { id: "KTHARR_SPICES", priceMod: 1.0, stock: Math.floor(Math.random() * 10) + 5 },
                { id: "LIVING_HULL_TISSUE", priceMod: 1.2, stock: Math.floor(Math.random() * 2) + 1 },
                { id: "WEAPONS", priceMod: 1.0, stock: Math.floor(Math.random() * 6) + 3 }
            ];
            profile.buys = [
                { id: "RARE_METALS", priceMod: 1.1, stock: 20 },
                { id: "MEDICAL_SUPPLIES", priceMod: 1.3, stock: 10 },
                { id: "REFINED_ALLOY", priceMod: 1.25, stock: 15 }
            ];
        } else if (npc.faction === 'CONCORD') {
            profile.sells = [
                { id: "NAVIGATION_CHARTS", priceMod: 1.0, stock: Math.floor(Math.random() * 5) + 1 },
                { id: "FUEL_CELLS", priceMod: 1.0, stock: Math.floor(Math.random() * 20) + 10 },
                { id: "NANO_REPAIR_KIT", priceMod: 1.0, stock: Math.floor(Math.random() * 4) + 1 }
            ];
            profile.buys = [
                { id: "FOOD_SUPPLIES", priceMod: 1.1, stock: 30 },
                { id: "PLANETARY_DATA", priceMod: 1.3, stock: 10 }
            ];
        } else if (npc.faction === 'FUEL_RATS') {
            profile.sells = [
                { id: "FUEL_CELLS", priceMod: 0.8, stock: 40 },
                { id: "NANO_REPAIR_KIT", priceMod: 0.9, stock: 8 }
            ];
            profile.buys = [
                { id: "HYDROGEN_3", priceMod: 1.3, stock: 25 },
                { id: "TECH_PARTS", priceMod: 1.2, stock: 20 }
            ];
        }

        npc.cachedTradeProfile = profile;
    }

    window.activeTradeNPC = npc.cachedTradeProfile;
    openTradeModal('buy');
}

// ==========================================
// --- PUBLIC TRADE UTILITY API ---
// ==========================================

window.TradeUtils = {
    getPrice: calculateItemPrice,
    getPriceBreakdown: _getPriceBreakdown,
    getGalacticIntel: _getGalacticTradeIntel,
    isProtectedCargo: _isProtectedBulkSellItem,
    getHoldValuation(locationOverride = null) {
        const loc = locationOverride || window.activeTradeNPC || (typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null);
        let total = 0;
        let units = 0;
        if (typeof playerCargo !== 'undefined' && typeof COMMODITIES !== 'undefined') {
            for (const id in playerCargo) {
                if (playerCargo[id] > 0 && COMMODITIES[id]) {
                    units += playerCargo[id];
                    total += calculateItemPrice(id, false, loc) * playerCargo[id];
                }
            }
        }
        return { units, totalValue: total };
    }
};

// --- END OF FILE trade.js ---
