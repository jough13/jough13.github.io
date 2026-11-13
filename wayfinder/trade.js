// --- START OF FILE trade.js ---

// Track average purchase price per item ID for live profit/loss telemetry
window.playerCargoCostBasis = window.playerCargoCostBasis || {};

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
                openStationView();
                return;
            }
        }
        closeGenericModal();
    } else {
        closeGenericModal();
    }
}

// ==========================================
// --- CONSOLIDATED TRADE SYSTEM ---
// ==========================================

function openTradeModal(mode = 'buy') {
    // Patch the close function once to ensure Ship-to-Ship state is wiped when closed
    if (typeof window.closeGenericModal === 'function' && !window._tradeClosePatched) {
        const originalClose = window.closeGenericModal;
        window.closeGenericModal = function() {
            window.activeTradeNPC = null;
            originalClose();
        };
        window._tradeClosePatched = true;
    }

    // Prioritize the active NPC if we are in Ship-to-Ship trade, otherwise use the tile
    const location = window.activeTradeNPC || chunkManager.getTile(playerX, playerY);
    
    if (!location || location.type !== 'location') {
        logMessage("Trading terminal offline.");
        return;
    }

    // --- ECONOMY RESTOCK LOGIC (Time-Gated) ---
    if (!window.activeTradeNPC && (!location.lastRestockTime || (currentGameDate - location.lastRestockTime) > 1.0)) {
        if (location.factory && location.buys && location.sells) {
            let buyStock = location.buys.find(b => b.id === location.factory.consumes);
            let sellStock = location.sells.find(s => s.id === location.factory.produces);
            if (buyStock && sellStock) {
                if (buyStock.stock >= location.factory.consumeQty) {
                    buyStock.stock -= location.factory.consumeQty;
                    sellStock.stock += location.factory.produceQty;
                    sellStock.priceMod = 1.0; 
                } else {
                    sellStock.priceMod = 2.0; 
                }
            }
        }
        if (location.sells) {
            location.sells.forEach(item => {
                if (typeof item === 'object' && item.stock !== undefined && item.stock < 100) {
                    item.stock += Math.floor(Math.random() * 4) + 2;
                }
            });
        }
        if (location.buys) {
            location.buys.forEach(item => {
                if (typeof item === 'object' && item.stock !== undefined && item.stock < 50) {
                    item.stock += Math.floor(Math.random() * 5) + 3;
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

    // --- 2. DYNAMIC FACTION BANNER RESOLUTION ---
    let bannerSrc = 'assets/concord_market.png';
    let borderColor = 'var(--accent-color)';
    let glowColor = 'rgba(0, 224, 224, 0.15)'; 
    
    if (window.activeTradeNPC) {
        bannerSrc = 'assets/civ_hauler.jpg'; 
        borderColor = 'var(--gold-text)';
        glowColor = 'rgba(255, 215, 0, 0.2)';
    } else if (location.isBlackMarket) {
        bannerSrc = 'assets/black_market.jpg';
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

    const headerImageHTML = `
        <div style="width: 100%; height: 140px; background-image: url('${bannerSrc}'); background-size: cover; background-position: center 25%; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 5px 20px ${glowColor}; flex-shrink: 0;"></div>
    `;

    // --- 3. THE PADDED FLEXBOX LAYOUT ---
    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";
    
    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                
                <div style="display: flex; gap: 10px; margin-bottom: 10px; flex-shrink: 0;">
                    <button class="action-button" style="flex: 1; margin-bottom: 0; border-color: ${isBuy ? 'var(--accent-color)' : '#555'}; color: ${isBuy ? 'var(--accent-color)' : '#888'};" onclick="openTradeModal('buy')">🛒 BUY</button>
                    <button class="action-button" style="flex: 1; margin-bottom: 0; border-color: ${!isBuy ? 'var(--success)' : '#555'}; color: ${!isBuy ? 'var(--success)' : '#888'};" onclick="openTradeModal('sell')">📦 SELL</button>
                </div>
                
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100%;">
                        <div style="font-size: 50px; margin-bottom: 20px; opacity: 0.1;">📊</div>
                        <p style="color:var(--text-color); text-align:center; font-size: 14px; line-height: 1.6; padding: 0 15px;">
                            Select a commodity from the list to view local market analytics and price trends.
                        </p>
                    </div>
                </div>
                
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const fragment = document.createDocumentFragment();

    if (isBuy) {
        const items = location.sells || [];
        if (items.length === 0) {
            const noData = document.createElement('div');
            noData.innerHTML = `<div style="padding:15px; color:#888;">No commodities for sale here.</div>`;
            fragment.appendChild(noData);
        } else {
            items.forEach(itemEntry => {
                const itemId = itemEntry.id || itemEntry;
                const stock = (typeof itemEntry === 'object' && itemEntry.stock !== undefined) ? itemEntry.stock : 99; 
                renderTradeRow(itemId, stock, true, location, fragment);
            });
        }
    } else {
        const playerHas = Object.keys(playerCargo).filter(id => playerCargo[id] > 0);
        const stationBuys = location.buys || [];
        
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
            return !playerHas.includes(bId);
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
            noData.innerHTML = `<div style="padding:15px; color:#888;">Station is not currently buying resources.</div>`;
            fragment.appendChild(noData);
        }
    }

    listEl.appendChild(fragment);

    // --- RETURN BUTTON ---
    const actionsEl = document.getElementById('genericModalActions');
    if (actionsEl) {
        if (window.activeTradeNPC && window.activeTradeNPC.id) {
            const npcId = window.activeTradeNPC.id;
            actionsEl.innerHTML = `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: var(--accent-color); color: var(--accent-color);" onclick="const npc = EntityManager.entities.find(e => e.id === '${npcId}'); window.activeTradeNPC = null; if(npc) interactWithNPC(npc); else closeGenericModal();">
                    ◀ RETURN TO COMM LINK
                </button>
            `;
        } else {
            actionsEl.innerHTML = `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="closeGenericModal()">
                    ◀ BACK TO STATION
                </button>
            `;
        }
    }
}

function renderTradeRow(itemId, qty, isBuy, location, listEl) {
    const item = COMMODITIES[itemId];
    if (!item) return;

    let isLocked = false;
    let lockReason = "";
    if (isBuy && item.reqFaction) {
        const currentRep = playerFactionStanding[item.reqFaction] || 0;
        if (currentRep < item.minRep) {
            isLocked = true;
            lockReason = `Requires ${item.reqFaction} Rep`;
        }
    }

    const row = document.createElement('div');
    row.className = 'trade-item-row';
    row.style.cssText = "padding: 14px 10px; padding-right: 15px; border-bottom: 1px solid var(--border-color); display: flex; gap: 15px;";
    if (isLocked) row.style.opacity = "0.5";

    const price = calculateItemPrice(item, isBuy, location);

    // Check if the station has a finite demand limit on the Sell tab
    let demandNote = "";
    let demandMet = false;
    if (!isBuy && location && location.buys) {
        const buyEntry = location.buys.find(b => (b.id === itemId) || (b === itemId));
        if (buyEntry && buyEntry.stock !== undefined) {
            demandNote = ` <span style="color:#888; font-size:11px;">(Demand: ${buyEntry.stock})</span>`;
            if (buyEntry.stock <= 0) demandMet = true;
        }
    }

    // Calculate profit/loss telemetry if player owns this item and has a recorded cost basis
    let profitBadgeHtml = "";
    if (!isBuy && qty > 0 && window.playerCargoCostBasis && window.playerCargoCostBasis[itemId] !== undefined) {
        const avgPaid = Math.round(window.playerCargoCostBasis[itemId]);
        const diff = price - avgPaid;
        const diffColor = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        const sign = diff >= 0 ? '+' : '';
        profitBadgeHtml = `<div style="font-size:11px; color:${diffColor};">Avg Paid: ${formatNumber(avgPaid)}c (${sign}${formatNumber(diff)}c/u)</div>`;
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
                <button class="trade-btn ${actionClass}" ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', true, 1)" style="padding:8px 10px; font-size:13px; cursor:pointer; min-width:56px;">
                    ${formatNumber(price)}c
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px 6px; font-weight:bold; font-size:11px; min-width: 36px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', true, 10)" title="Buy 10">
                    +10
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px 6px; font-weight:bold; font-size:11px; min-width: 40px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', true, 'max')" title="Buy Max">
                    MAX
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px 6px; font-weight:bold; font-size:11px; min-width: 32px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', true, 'custom')" title="Enter Amount">
                    #
                </button>
            </div>`;
        } else {
            actionButtonHtml = flexContainer + `
                <button class="trade-btn ${actionClass}" ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', false, 1)" style="padding:8px 12px; font-size:13px; cursor:pointer; min-width:60px;">
                    ${formatNumber(price)}c
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 40px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', false, 'all')" title="Sell All">
                    ALL
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 36px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', false, 'custom')" title="Enter Amount">
                    #
                </button>
            </div>`;
        }
    }

    const illegalBadge = item.illegal ? `<span style="color:var(--danger); border:1px solid var(--danger); font-size:9px; padding:1px 4px; border-radius:2px; margin-left:6px;">ILLEGAL</span>` : '';

    row.innerHTML = `
        <div class="trade-item-icon" onclick="displayMarketAnalysis('${itemId}')" style="cursor:pointer; font-size: 32px; padding-top: 2px;">${item.icon || '📦'}</div>
        
        <div class="trade-item-details" style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <div class="trade-item-name" onclick="displayMarketAnalysis('${itemId}')" style="cursor:pointer; font-size: 15px; font-weight: bold; color: var(--item-name-color); letter-spacing: 0.5px;">
                ${item.name} ${illegalBadge}
                ${isLocked ? `<span style="color:var(--danger); font-size:11px; margin-left: 6px;">(${lockReason})</span>` : ''}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div class="trade-item-sub" onclick="displayMarketAnalysis('${itemId}')" style="cursor:pointer; font-size: 13px; color: var(--text-color); line-height: 1.4;">
                    <div>${isBuy ? `In Stock: ${qty}` : `Owned: ${qty}${demandNote}`}</div>
                    <div style="color:var(--gold-text); font-size: 11px;">Galactic Base: ${formatNumber(item.basePrice)}c</div>
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

    const location = window.activeTradeNPC || chunkManager.getTile(playerX, playerY);
    const localPrice = calculateItemPrice(item, true, location); 
    const sellPrice = calculateItemPrice(item, false, location); 
    
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
               <span style="color:var(--accent-color); font-weight:bold;">${formatNumber(Math.round(window.playerCargoCostBasis[itemId]))}c</span>
           </div>`
        : '';

    detailEl.innerHTML = `
        <div style="animation: fadeIn 0.3s ease-out; display: flex; flex-direction: column; min-height: 100%;">
            <div style="display:flex; gap:15px; margin-bottom:25px; align-items:center;">
                <div style="font-size:45px; background:var(--bg-color); padding:12px; border-radius:10px; border:1px solid var(--border-color);">
                    ${item.icon || '📦'}
                </div>
                <div>
                    <div style="color:var(--accent-color); font-size:11px; margin-bottom:4px; letter-spacing:1px; text-transform:uppercase;">Registered Commodity</div>
                    <div style="font-size:18px; font-weight:bold; color:var(--item-name-color); letter-spacing:0.5px;">${item.name}</div>
                    <div style="font-size:13px; margin-top:4px; color:var(--text-color);">Volatility: <span style="color:${volColor}; font-weight:bold;">${volatility}</span></div>
                </div>
            </div>

            <div style="background:var(--bg-color); padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:25px; font-size:14px;">
                <h4 style="margin:0 0 12px 0; color:var(--accent-color); font-size:12px; border-bottom:1px solid var(--border-color); padding-bottom:6px; letter-spacing:1px;">LOCAL MARKET DATA</h4>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:var(--text-color);">Market Buy:</span>
                    <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(localPrice)}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span style="color:var(--text-color);">Market Sell:</span>
                    <span style="color:var(--success); font-weight:bold;">${formatNumber(sellPrice)}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:10px; font-size:13px;">
                    <span style="color:var(--item-desc-color);">Galactic Base:</span>
                    <span style="color:var(--item-desc-color);">${formatNumber(item.basePrice)}c</span>
                </div>
                ${avgPaid}
            </div>

            <div style="margin-bottom:20px; padding: 0 5px;">
                <h4 style="margin:0 0 8px 0; color:var(--text-color); font-size:12px; letter-spacing:1px; text-transform:uppercase;">Log Entry</h4>
                <div style="font-size:14px; color:var(--item-desc-color); line-height:1.6;">
                    ${item.description}
                </div>
            </div>

            ${item.reqFaction ? `
                <div style="font-size:13px; color:var(--danger); border:1px solid var(--danger); background:transparent; padding:12px; text-align:center; border-radius:4px; font-weight:bold; letter-spacing:0.5px; margin-bottom: 20px;">
                    ⚠️ RESTRICTED: ${item.reqFaction} Clearance Required
                </div>
            ` : ''}

            <div style="margin-top: auto; padding-top: 20px; padding-bottom: 10px; border-top: 1px solid var(--border-color); text-align: center;">
                <button class="trade-btn" style="padding: 10px 20px; font-size: 12px; cursor: pointer; background: transparent; border: 1px solid var(--text-color); color: var(--text-color); letter-spacing: 1px; width: 100%; border-radius: 4px;" onclick="clearMarketAnalysis()">
                    CLOSE DATA PANEL
                </button>
            </div>
        </div>
    `;
}

function clearMarketAnalysis() {
    window.activeTradeItemId = null; 
    
    const detailEl = document.getElementById('genericDetailContent');
    if (detailEl) {
        detailEl.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100%;">
                <div style="font-size: 50px; margin-bottom: 20px; opacity: 0.1;">📊</div>
                <p style="color:var(--text-color); text-align:center; font-size: 14px; line-height: 1.6; padding: 0 15px;">
                    Select a commodity from the list to view local market analytics and price trends.
                </p>
            </div>
        `;
    }
}

function executeTrade(itemId, isBuy, specificQty = 1) {
    let leveledUp = false;
    
    const location = window.activeTradeNPC || chunkManager.getTile(playerX, playerY);
    const item = COMMODITIES[itemId];
    if (!item || !location) return;

    const price = calculateItemPrice(item, isBuy, location);

    // --- FETCH ITEM ENTRY FOR STOCK/DEMAND LIMITS ---
    const tradeList = isBuy ? location.sells : location.buys;
    const itemEntry = tradeList ? tradeList.find(e => e.id === itemId || e === itemId) : null;
    const availableStock = (itemEntry && itemEntry.stock !== undefined) ? itemEntry.stock : 999; 

    let qtyToTrade = specificQty;

    if (specificQty === 'custom') {
        const promptMsg = isBuy 
            ? `Buy how many ${item.name}? (Stock: ${availableStock}, Max affordable: ${Math.floor(playerCredits / price)})`
            : `Sell how many ${item.name}? (Demand: ${availableStock}, Owned: ${playerCargo[itemId] || 0})`;
            
        let input = prompt(promptMsg, "1");
        if (input === null) return; 
        qtyToTrade = parseInt(input, 10);
        
        if (isNaN(qtyToTrade) || qtyToTrade <= 0) {
            if (typeof showToast === 'function') showToast("Invalid Amount", "error");
            return;
        }
    }

    if (isBuy) {
        const itemWeight = item.weight !== undefined ? item.weight : 1;
        const affordable = Math.floor(playerCredits / price);
        
        let space = 999;
        // 👇 BUG FIX: Handle Troop limits BEFORE completing the transaction!
        if (item.isTroop && typeof playerShip !== 'undefined' && playerShip.forces) {
            const maxTroops = playerShip.forces.maxTroops || 20;
            if (item.isVehicle) {
                space = Math.max(0, maxTroops - (playerShip.forces.heavyMechs || 0));
            } else {
                // Number of platoons you can buy based on marine capacity
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
            qtyToTrade = Math.min(qtyToTrade, availableStock);
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
            return;
        }
        
        if (!item.isTroop && currentCargoLoad + (qtyToTrade * itemWeight) > PLAYER_CARGO_CAPACITY) {
            if (typeof showToast === 'function') showToast("Not enough Cargo Space!", "error");
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

    } 
    else {
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

        // If the player sold raw inputs that this station's factory consumes, boost factory output!
        if (location.factory && location.factory.consumes === itemId && location.sells) {
            const producedEntry = location.sells.find(s => s.id === location.factory.produces);
            if (producedEntry && producedEntry.stock !== undefined) {
                const batches = Math.max(1, Math.floor(qtyToTrade / Math.max(1, location.factory.consumeQty)));
                producedEntry.stock += batches * (location.factory.produceQty || 1);
                producedEntry.priceMod = 1.0;
            }
        }
        
        playerCredits += totalEarned;
        updateCurrentCargoLoad();

        const profitXP = Math.max(1, Math.floor((price * qtyToTrade) * (XP_PER_PROFIT_UNIT * 0.8)));
        playerXP += profitXP;
        
        leveledUp = checkLevelUp();

        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`Sold ${qtyToTrade}x ${item.name} (+${formatNumber(totalEarned)}c)`, "success");
    }

    if (!window.activeTradeNPC && location && (location.sells || location.buys)) {
        updateWorldState(playerX, playerY, {
            sells: location.sells,
            buys: location.buys,
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
    
    renderUIStats();
}

function calculateItemPrice(itemOrId, isBuy, location) {
    const itemId = typeof itemOrId === 'string' ? itemOrId : Object.keys(COMMODITIES).find(key => COMMODITIES[key] === itemOrId);
    const item = typeof itemOrId === 'string' ? COMMODITIES[itemOrId] : itemOrId;

    if (!item) return 0;

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

    // Check both .char and .type for procedural outposts
    if (locMult === 1.0 && location && (location.type === OUTPOST_CHAR_VAL || location.char === OUTPOST_CHAR_VAL)) {
        locMult = isBuy ? 1.2 : 0.8;
    }
    
    if (!isBuy) {
        price = price * 0.5;
    }

    price = price * locMult;

    const stationSellsItem = Boolean(location && location.sells && location.sells.some(e => (e.id === itemId) || (e === itemId)));

    // Contraband commands a high premium when sold to markets that don't already supply it
    if (item.illegal && !isBuy && !stationSellsItem) {
        price *= 2.5; 
    }

    const locationName = location ? location.name : "";
    if (activeMarketTrend && 
        activeMarketTrend.station === locationName && 
        activeMarketTrend.item === itemId && 
        currentGameDate < activeMarketTrend.expiry) {
        
        if (activeMarketTrend.isBoom) price *= 2.5; 
        else price *= 0.4; 
        
    } else {
        const uniqueOffset = item.basePrice || 0;
        const fluctuation = Math.sin((currentGameDate + uniqueOffset) / 5);
        const marketFactor = 1 + (fluctuation * 0.15);
        price *= marketFactor;
    }

    if (typeof playerPerks !== 'undefined' && playerPerks.has('SILVER_TONGUE')) {
        price = isBuy ? (price * 0.9) : (price * 1.1);
    }
    
    if (typeof hasCrewPerk === 'function' && hasCrewPerk('TRADE_BONUS')) {
        price = isBuy ? (price * 0.9) : (price * 1.1);
    }

    if (typeof playerFactionStanding !== 'undefined') {
        if (isBuy && location && location.faction === 'CONCORD' && (playerFactionStanding['CONCORD'] || 0) >= 50) {
            price *= 0.8; 
        }
    }

    price = Math.floor(price);

    // Prevent same-station buy/sell arbitrage loop if the station also sells this item
    if (!isBuy && stationSellsItem) {
        const buyPriceHere = calculateItemPrice(itemId, true, location);
        price = Math.min(price, Math.max(1, Math.floor(buyPriceHere * 0.85)));
    }

    return Math.max(1, price);
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
                "Concord patrols breathing down your neck? I can make your problems disappear... for a cut. I pay top credit for goods that don't officially exist."
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
    // If the station sells it, the broker knows you just bought it locally and will rip you off.
    // Otherwise, they pay a massive 3x premium for imported, high-risk contraband!
    if (soldLocally) {
        const localSellPrice = calculateItemPrice(item, false, loc);
        return Math.floor(Math.min(item.basePrice * 0.75, localSellPrice * 0.8));
    }
    
    return Math.floor(item.basePrice * 3);
}

function renderShadowBrokerList() {
    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;
    listEl.innerHTML = '';

    let foundAny = false;
    let totalBlackMarketValue = 0;

    for (const itemId in playerCargo) {
        if (playerCargo[itemId] > 0 && COMMODITIES[itemId] && COMMODITIES[itemId].illegal) {
            foundAny = true;
            const item = COMMODITIES[itemId];
            const qty = playerCargo[itemId];
            const value = getShadowBrokerUnitPrice(itemId) * qty; 
            totalBlackMarketValue += value;
            
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.innerHTML = `<span style="color:#FF5555; font-weight:bold;">${item.name}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showShadowBrokerItemDetails(itemId);
            listEl.appendChild(row);
        }
    }

    if (!foundAny) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = "padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;";
        emptyMsg.textContent = "Your hold is clean. The Broker has no interest in legal commodities.";
        listEl.appendChild(emptyMsg);
    } else {
        const fenceAllRow = document.createElement('div');
        fenceAllRow.className = 'trade-item-row';
        fenceAllRow.style.background = 'rgba(153, 51, 255, 0.1)';
        fenceAllRow.style.borderBottom = '2px solid #9933FF';
        fenceAllRow.innerHTML = `<span style="color:#DDA0DD; font-weight:bold;">FENCE ALL CONTRABAND</span> <span style="color:var(--gold-text);">${formatNumber(totalBlackMarketValue)}c</span>`;
        fenceAllRow.onclick = () => showFenceAllDetails(totalBlackMarketValue);
        listEl.prepend(fenceAllRow);
    }

    // The Smuggling Contract Button (Always visible at the top)
    const smuggleRow = document.createElement('div');
    smuggleRow.className = 'trade-item-row';
    smuggleRow.style.background = 'rgba(255, 0, 0, 0.1)';
    smuggleRow.style.borderBottom = '2px solid var(--danger)';
    smuggleRow.innerHTML = `<span style="color:var(--danger); font-weight:bold;">REQUEST SMUGGLING RUN</span> <span style="color:var(--warning); font-size:10px;">HIGH RISK</span>`;
    smuggleRow.onclick = () => showSmugglingContractDetails();
    listEl.prepend(smuggleRow);
}

function showSmugglingContractDetails() {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const currentLoc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const currentName = currentLoc && currentLoc.name ? currentLoc.name : "";

    // Filter Black Markets to exclude the current station and locked Xerxes
    let blackMarkets = Object.keys(LOCATIONS_DATA).filter(k => {
        if (k === currentName) return false;
        if (k === "Planet Xerxes" && (typeof xerxesPuzzleLevel === 'undefined' || xerxesPuzzleLevel < 1)) return false;
        return LOCATIONS_DATA[k].isBlackMarket;
    });

    if (blackMarkets.length === 0) {
        blackMarkets = Object.keys(LOCATIONS_DATA).filter(k => k !== currentName);
    }

    const destName = blackMarkets[Math.floor(Math.random() * blackMarkets.length)] || "The Rusty Anchor";
    const payout = 15000 + Math.floor(Math.random() * 10000);

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
                    <span style="color:var(--accent-color); font-weight:bold;">${destName}</span>
                </div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Cargo Requirement:</span> 
                    <span style="color:var(--text-color);">10 Units (Heavy)</span>
                </div>
                <div style="font-size:14px; margin-top:10px; display:flex; justify-content:space-between; border-top: 1px dashed #555; padding-top: 10px;">
                    <span style="color:#DDA0DD; font-weight:bold;">COMPLETION PAYOUT:</span> 
                    <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(payout)}c</span>
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
            <button class="action-button" style="border-color:var(--danger); color:var(--danger); box-shadow: 0 0 15px rgba(255,0,0,0.3);" onclick="acceptSmugglingRun('${destName.replace(/'/g, "\\'")}', ${payout})">ACCEPT HOT CARGO</button>
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
        isComplete: false,
        description: `Evade Concord patrols and deliver the Tracked Contraband to ${destName}. Use Silent Running (Q) to break target locks.`,
        rewards: { credits: payout, xp: 500, notoriety: 10 },
        objectives: [{ type: "DELIVERY", destinationName: destName, itemID: "HOT_CARGO", count: 1 }],
        progress: { delivery_0: { delivered: 0, required: 1, complete: false, destinationName: destName } }
    };

    logMessage(`<span style="color:var(--danger); font-weight:bold;">[ CONTRACT ACCEPTED ]</span> The tracker is active. Concord intercepts will arrive momentarily. Deliver to <b>${destName}</b>.`);
    if (typeof showToast === 'function') showToast("HOT CARGO LOADED", "warning");
    if (typeof soundManager !== 'undefined') soundManager.playWarning();
    
    closeGenericModal();
    if (typeof renderMissionTracker === 'function') renderMissionTracker();
    if (typeof renderUIStats === 'function') renderUIStats();
    autoSaveGame();
}

function showShadowBrokerItemDetails(itemId) {
    const item = COMMODITIES[itemId];
    const qty = playerCargo[itemId];
    const unitPrice = getShadowBrokerUnitPrice(itemId);
    const totalValue = unitPrice * qty;
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px;">${item.icon || '📦'}</div>
            <h3 style="color:#FF5555; margin:0;">${item.name.toUpperCase()}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0;">${item.description}</p>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid #FF5555; padding:10px; border-radius:4px; text-align:left;">
                <div style="color:#FF5555; font-size:11px; margin-bottom:8px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #333; padding-bottom:5px;">BLACK MARKET VALUATION:</div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Quantity:</span> 
                    <span style="color:var(--text-color); font-weight:bold;">${qty}</span>
                </div>
                <div style="font-size:13px; margin-bottom:4px; display:flex; justify-content:space-between;">
                    <span style="color:var(--item-desc-color)">Street Value (Per Unit):</span> 
                    <span style="color:var(--gold-text);">${formatNumber(unitPrice)}c</span>
                </div>
                <div style="font-size:14px; margin-top:10px; display:flex; justify-content:space-between; border-top: 1px dashed #555; padding-top: 10px;">
                    <span style="color:#DDA0DD; font-weight:bold;">TOTAL PAYOUT:</span> 
                    <span style="color:var(--success); font-weight:bold;">${formatNumber(totalValue)}c</span>
                </div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 10px rgba(153,51,255,0.2);" onclick="processShadowBrokerTrade('${itemId}')">FENCE GOODS (${formatNumber(totalValue)}c)</button>
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
                    ${formatNumber(totalValue)}c
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
    let soldItemsText = [];

    if (itemId === 'ALL') {
        for (const id in playerCargo) {
            if (playerCargo[id] > 0 && COMMODITIES[id] && COMMODITIES[id].illegal) {
                const qty = playerCargo[id];
                const value = getShadowBrokerUnitPrice(id) * qty;
                totalProfit += value;
                soldItemsText.push(`${qty}x ${COMMODITIES[id].name}`);
                
                delete playerCargo[id];
                delete window.playerCargoCostBasis[id];
            }
        }
    } else if (playerCargo[itemId] > 0) {
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
        
        logMessage(`<span style="color:#DDA0DD">[ FENCED ] Sold ${soldItemsText.join(', ')} for ${formatNumber(totalProfit)}c.</span>`);
        showToast(`CONTRABAND FENCED (+${formatNumber(totalProfit)}c)`, "success");
        
        renderUIStats();
        renderShadowBrokerList();
        
        document.getElementById('genericDetailContent').innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <div style="font-size:50px; margin-bottom:10px; color:var(--success);">🤝</div>
                <h3 style="color:var(--success);">TRANSACTION COMPLETE</h3>
                <p style="color:var(--text-color); font-size:13px; line-height:1.5;">"A pleasure doing business. Stay off the Concord's radar."</p>
                <p style="color:var(--gold-text); font-weight:bold; margin-top:10px;">+${formatNumber(totalProfit)}c</p>
            </div>
        `;
        document.getElementById('genericModalActions').innerHTML = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    }
}

// ==========================================
// --- CRYPTARCH MODAL SYSTEM ---
// ==========================================

function visitCryptarch() {
    openGenericModal("CRYPTARCH SANCTUM");
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <img src="assets/cryptarch.png" alt="The Cryptarch" 
                 style="width: 128px; height: 128px; object-fit: cover; image-rendering: pixelated; 
                        border: 2px solid var(--accent-color); border-radius: 8px; margin-bottom: 15px; 
                        box-shadow: 0 0 20px rgba(0, 224, 224, 0.2); background: #000;">
            <h3 style="color:var(--accent-color); margin-bottom:10px;">THE CRYPTARCH</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                "Secrets of the void, locked away in crystalline matrices. Bring me your engrams and data caches, and I will reveal their truths... for a price."
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
    let foundAny = false;

    encryptedItems.forEach(itemId => {
        if (playerCargo[itemId] && playerCargo[itemId] > 0) {
            foundAny = true;
            const item = COMMODITIES[itemId];
            const qty = playerCargo[itemId];
            
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.innerHTML = `<span style="color:var(--accent-color); font-weight:bold;">${item.name}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showCryptarchItemDetails(itemId);
            listEl.appendChild(row);
        }
    });

    if (!foundAny) {
        listEl.innerHTML = `<div style="padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;">No encrypted goods detected in your cargo hold. Come back when you find something interesting.</div>`;
    }
}

function showCryptarchItemDetails(itemId) {
    const item = COMMODITIES[itemId];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const hasCipher = (playerCargo['PRECURSOR_CIPHER'] || 0) > 0;
    const hasPerk = typeof playerPerks !== 'undefined' && playerPerks.has('CYBER_SLICER');
    
    let decryptCost = 250;
    if (itemId === 'ENCRYPTED_DATA') decryptCost = 500;
    if (itemId === 'ANCIENT_ARCHIVE') decryptCost = 1000;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; animation: pulse-cyan 2s infinite;">💠</div>
            <h3 style="color:var(--accent-color); margin:0;">${item.name.toUpperCase()}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0;">${item.description}</p>
            
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
        btnHtml += `<button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" onclick="processDecryption('perk', '${itemId}')">USE CYBER SLICER (FREE)</button>`;
    }
    if (hasCipher) {
        btnHtml += `<button class="action-button" style="border-color:var(--success); color:var(--success);" onclick="processDecryption('cipher', '${itemId}')">USE CIPHER (CONSUMES 1)</button>`;
    }
    const canAfford = playerCredits >= decryptCost;
    btnHtml += `<button class="action-button" ${canAfford ? '' : 'disabled'} style="border-color:var(--gold-text); color:var(--gold-text);" onclick="processDecryption('credits', '${itemId}')">PAY CRYPTARCH (${decryptCost}c)</button>`;
    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>`;

    actionsEl.innerHTML = btnHtml;
}

function processDecryption(method, itemId = 'ENCRYPTED_ENGRAM') {
    if (!playerCargo[itemId] || playerCargo[itemId] <= 0) return;

    let cost = 250;
    if (itemId === 'ENCRYPTED_DATA') cost = 500;
    if (itemId === 'ANCIENT_ARCHIVE') cost = 1000;
    
    const isAtXerxes = document.getElementById('xerxesOverlay') && document.getElementById('xerxesOverlay').style.display === 'flex';
    const xpMultiplier = isAtXerxes ? 2 : 1;

    if (method === 'cipher') {
        if ((playerCargo['PRECURSOR_CIPHER'] || 0) <= 0) return;
        playerCargo['PRECURSOR_CIPHER'] -= 1;
        if (playerCargo['PRECURSOR_CIPHER'] <= 0) delete playerCargo['PRECURSOR_CIPHER'];
        logMessage(`Cipher consumed. Initiating decryption...`);
    } else if (method === 'credits') {
        if (playerCredits < cost) {
            showToast(`INSUFFICIENT FUNDS (${cost}c Required)`, "error");
            return;
        }
        playerCredits -= cost;
        logMessage(`You pay the ${cost}c fee. The Cryptarch begins working...`);
    } else if (method === 'perk') {
        logMessage("Cyber Slicer perk active. Bypassing encryption...");
    }

    playerCargo[itemId] -= 1;
    if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
    
    updateCurrentCargoLoad(); 

    let xpReward = 150;
    let textReward = "Data recovered.";

    if (itemId === 'ENCRYPTED_ENGRAM') {
        const rewards = [
            { xp: 150, text: "FRAGMENT RECOVERED: 'The ruler of the sunless world is the DARKNESS.'" },
            { xp: 300, text: "NAV-DATA: 'Sector [39, 17] - Precursor activity detected.'" },
            { xp: 500, text: "JACKPOT: Precursor architectural schematics recovered." }
        ];
        const r = rewards[Math.floor(Math.random() * rewards.length)];
        xpReward = r.xp;
        textReward = r.text;
    } else if (itemId === 'ENCRYPTED_DATA') {
        xpReward = 250;
        const creditBonus = 500 + Math.floor(Math.random() * 500);
        playerCredits += creditBonus;
        textReward = `Data core sold to brokers (+${formatNumber(creditBonus)}c).`;
    } else if (itemId === 'ANCIENT_ARCHIVE') {
        xpReward = 500;
        const creditBonus = 1000 + Math.floor(Math.random() * 1000);
        playerCredits += creditBonus;
        textReward = `Holographic array unlocked! Forbidden history recovered (+${formatNumber(creditBonus)}c).`;
        if (typeof unlockLore === 'function') unlockLore('PRECURSOR_ORIGINS');
    }
    
    const finalXP = xpReward * xpMultiplier;
    playerXP += finalXP;

    if (isAtXerxes) {
        logMessage(`<span style="color:#00E0E0">> SPIRE RESONANCE: Decryption output doubled! (+${finalXP} XP)</span>`);
        if (typeof xerxesLog === 'function') xerxesLog("Spire energy channeled into decryption. Output maximized.", "good");
    }

    logMessage(`<span style="color:#DDA0DD">> SUCCESS: ${textReward}</span>`);
    showToast(`DECRYPTED: +${finalXP} XP`, "success");
    
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    const leveledUp = checkLevelUp(); 
    
    if (!leveledUp) {
        if (document.getElementById('cargoOverlay') && document.getElementById('cargoOverlay').style.display !== 'none') {
            renderCargoList();
        } else if (document.getElementById('genericModalOverlay') && document.getElementById('genericModalOverlay').style.display !== 'none') {
            renderCryptarchList();
            document.getElementById('genericDetailContent').innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <div style="font-size:50px; margin-bottom:10px; color:var(--success);">✅</div>
                    <h3 style="color:var(--success);">DECRYPTION SUCCESSFUL</h3>
                    <p style="color:var(--text-color); font-size:13px;">${textReward}</p>
                    <p style="color:var(--accent-color); font-weight:bold; margin-top:10px;">+${finalXP} XP ${isAtXerxes ? '(XERXES BOOST)' : ''}</p>
                </div>
            `;
            document.getElementById('genericModalActions').innerHTML = `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
            `;
        }
    }
    renderUIStats();
}

// Route Eclipse station "Shadow Broker" button directly into the full Shadow Broker & Smuggling UI
function fenceEclipseContraband() {
    openShadowBroker();
}

// ==========================================
// --- THE FORGER (TRANSPONDER & ID SPOOFING) ---
// ==========================================

function buyFakeID() {
    openGenericModal("THE FORGER : IDENTITY SPOOFING");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const currentNotoriety = typeof playerNotoriety !== 'undefined' ? playerNotoriety : 0;
    const scrubCost = Math.max(300, currentNotoriety * 300);
    const concordRep = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding['CONCORD']) ? playerFactionStanding['CONCORD'] : 0;

    listEl.innerHTML = `
        <div class="trade-list-header" style="color:#9933FF; font-size:10px; letter-spacing:2px; border-bottom:1px solid #333;">
            FORGERY SERVICES
        </div>
        <div class="trade-item-row" onclick="showForgerService('SCRUB_WARRANTS')" style="padding:12px 10px;">
            <div>
                <div style="color:#DDA0DD; font-weight:bold; font-size:13px;">🪪 Wipe Concord Warrants</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Erases active Notoriety (${currentNotoriety})</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">${currentNotoriety > 0 ? formatNumber(scrubCost) + 'c' : 'CLEAN'}</span>
        </div>
        <div class="trade-item-row" onclick="showForgerService('DIPLOMATIC_ID')" style="padding:12px 10px;">
            <div>
                <div style="color:var(--accent-color); font-weight:bold; font-size:13px;">📜 Forged Concord Credentials</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Restores/Boosts Concord Rep (+15)</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">2,500c</span>
        </div>
        <div class="trade-item-row" onclick="showForgerService('CALLSIGN_SCRAMBLE')" style="padding:12px 10px;">
            <div>
                <div style="color:var(--success); font-weight:bold; font-size:13px;">📡 Scramble Hull Transponder</div>
                <div style="color:var(--item-desc-color); font-size:10px; margin-top:4px;">Throws off active pursuit ships</div>
            </div>
            <span style="color:var(--gold-text); font-weight:bold;">1,200c</span>
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
                    <div class="trade-stat-row"><span>Slicing Fee:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(cost)}c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canUse ? 'disabled' : ''} style="border-color:#9933FF; color:#DDA0DD;" onclick="executeForgerService('SCRUB_WARRANTS', ${cost})">
                ${currentNotoriety <= 0 ? 'RECORD ALREADY CLEAN' : (playerCredits < cost ? 'INSUFFICIENT FUNDS' : `PURGE WARRANTS (${formatNumber(cost)}c)`)}
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
                     plants falsified merchant commendations into the Concord diplomatic registry, boosting your Concord standing by +15.
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
    } else if (serviceType === 'CALLSIGN_SCRAMBLE') {
        const cost = 1200;
        const canAfford = playerCredits >= cost;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:15px;">
                <div style="font-size:48px; margin-bottom:10px;">📡</div>
                <h3 style="color:var(--success); margin:0 0 10px 0;">TRANSPONDER SCRAMBLE</h3>
                <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--success); text-align:left;">
                    Cycles your hull's sub-space beacon frequencies, immediately throwing off all non-bounty hostile pursuers in the sector.
                </p>
                <div class="trade-math-area" style="text-align:left;">
                    <div class="trade-stat-row"><span>Service Cost:</span> <span style="color:var(--gold-text); font-weight:bold;">1,200c</span></div>
                </div>
            </div>
        `;
        actionsEl.innerHTML = `
            <button class="action-button" ${!canAfford ? 'disabled' : ''} style="border-color:var(--success); color:var(--success);" onclick="executeForgerService('CALLSIGN_SCRAMBLE', 1200)">
                ${canAfford ? 'SCRAMBLE TRANSPONDER (1,200c)' : 'INSUFFICIENT FUNDS'}
            </button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnFromTradeSubModal()">◀ BACK TO CONCOURSE</button>
        `;
    }
}

function executeForgerService(serviceType, cost) {
    if (playerCredits < cost) return;
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
    } else if (serviceType === 'CALLSIGN_SCRAMBLE') {
        if (typeof activeEnemies !== 'undefined') {
            activeEnemies = activeEnemies.filter(e => e.isBountyTarget || e.isProbe || e.isLegendary);
        }
        logMessage("<span style='color:var(--success)'>[ FORGER ] Hull transponder cycled. Pursuing patrols have lost your signal.</span>");
        if (typeof showToast === 'function') showToast("TRANSPONDER SCRAMBLED", "success");
    }

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    if (typeof renderUIStats === 'function') renderUIStats();
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
                { id: "MEDICAL_SUPPLIES", priceMod: 1.2, stock: Math.floor(Math.random() * 5) + 2 }
            ],
            buys: [
                { id: "MINERALS", priceMod: 0.9, stock: 50 },
                { id: "TECH_PARTS", priceMod: 1.1, stock: 10 }
            ]
        };

        const lowerDesc = (npc.desc || "").toLowerCase();
        const lowerName = (npc.name || "").toLowerCase();

        if (lowerName.includes("miner") || lowerDesc.includes("mining") || lowerDesc.includes("ore")) {
            profile.sells = [
                { id: "MINERALS", priceMod: 0.7, stock: Math.floor(Math.random() * 30) + 15 },
                { id: "RARE_METALS", priceMod: 0.8, stock: Math.floor(Math.random() * 5) + 1 }
            ];
            profile.buys = [
                { id: "FOOD_SUPPLIES", priceMod: 1.5, stock: 20 },
                { id: "FUEL_CELLS", priceMod: 1.5, stock: 15 }
            ];
        } else if (npc.faction === 'ECLIPSE' || lowerName.includes("smuggler")) {
            profile.sells = [
                { id: "PROHIBITED_STIMS", priceMod: 1.1, stock: Math.floor(Math.random() * 8) + 2 },
                { id: "FORBIDDEN_TEXTS", priceMod: 1.3, stock: Math.floor(Math.random() * 3) + 1 }
            ];
            profile.buys = [
                { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: 30 },
                { id: "MEDICAL_SUPPLIES", priceMod: 1.2, stock: 15 }
            ];
        } else if (npc.faction === 'KTHARR') {
            profile.sells = [
                { id: "KTHARR_SPICES", priceMod: 1.0, stock: Math.floor(Math.random() * 10) + 5 },
                { id: "LIVING_HULL_TISSUE", priceMod: 1.2, stock: Math.floor(Math.random() * 2) + 1 }
            ];
            profile.buys = [
                { id: "RARE_METALS", priceMod: 1.1, stock: 20 },
                { id: "MEDICAL_SUPPLIES", priceMod: 1.3, stock: 10 }
            ];
        } else if (npc.faction === 'CONCORD') {
            profile.sells = [
                { id: "NAVIGATION_CHARTS", priceMod: 1.0, stock: Math.floor(Math.random() * 5) + 1 },
                { id: "FUEL_CELLS", priceMod: 1.0, stock: Math.floor(Math.random() * 20) + 10 }
            ];
            profile.buys = [
                { id: "FOOD_SUPPLIES", priceMod: 1.1, stock: 30 }
            ];
        }

        npc.cachedTradeProfile = profile;
    }

    window.activeTradeNPC = npc.cachedTradeProfile;
    openTradeModal('buy');
}

// --- END OF FILE trade.js ---
