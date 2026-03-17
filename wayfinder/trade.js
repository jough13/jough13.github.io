// --- CONSOLIDATED TRADE SYSTEM ---
function openTradeModal(mode) {
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
        
        // 🚨 SUPPLY CHAIN ENGINE
        if (location.factory) {
            let buyStock = location.buys.find(b => b.id === location.factory.consumes);
            let sellStock = location.sells.find(s => s.id === location.factory.produces);
            
            if (buyStock && sellStock) {
                if (buyStock.stock >= location.factory.consumeQty) {
                    // Factory is running! Consume raw materials, produce finished goods.
                    buyStock.stock -= location.factory.consumeQty;
                    sellStock.stock += location.factory.produceQty;
                    sellStock.priceMod = 1.0; // Price normalizes
                } else {
                    // Factory stalled! Price of finished goods skyrockets due to shortage!
                    sellStock.priceMod = 2.5; 
                }
            }
        }
        if (location.sells) {
            location.sells.forEach(item => {
                if (item.stock < 100) item.stock += Math.floor(Math.random() * 3) + 1;
            });
        }
        if (location.buys) {
            location.buys.forEach(item => {
                if (item.stock > 0) item.stock = Math.max(0, item.stock - (Math.floor(Math.random() * 2) + 1));
            });
        }
        location.lastRestockTime = currentGameDate;
    }
    
    if (!window.activeTradeNPC && location.buys) {
        location.buys.forEach(item => {
            if (item.stock > 0) item.stock = Math.max(0, item.stock - (Math.floor(Math.random() * 2) + 1));
        });
    }

    const isBuy = mode === 'buy';
    
    // --- 1. OPEN MODAL & DYNAMIC TITLE ---
    let modalTitle = isBuy ? "STATION MARKETPLACE" : "CARGO MANIFEST";
    const faction = location.faction; 

    if (window.activeTradeNPC) {
        modalTitle = isBuy ? "SHIP-TO-SHIP : BUY" : "SHIP-TO-SHIP : SELL";
    } else if (location.isBlackMarket) {
        modalTitle = isBuy ? "SHADOW NETWORK : BUY" : "SHADOW NETWORK : SELL";
    } else if (faction === 'KTHARR') {
        modalTitle = isBuy ? "PROVING GROUNDS : BETTING DECK" : "PROVING GROUNDS : FENCE COMMODITIES";
    }
    
    openGenericModal(modalTitle);

    // --- 2. DYNAMIC FACTION BANNER RESOLUTION ---
    let headerImageHTML = "";
    let bannerSrc = 'assets/concord_market.png';
    let borderColor = 'var(--accent-color)';
    let glowColor = 'rgba(0, 224, 224, 0.15)'; 
    
    if (window.activeTradeNPC) {
        bannerSrc = 'assets/civ_hauler.png'; // Reusing your ship asset for the banner
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

    headerImageHTML = `
        <div style="width: 100%; height: 140px; background-image: url('${bannerSrc}'); background-size: cover; background-position: center 25%; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 5px 20px ${glowColor}; flex-shrink: 0;"></div>
    `;

    const container = document.getElementById('genericModalContent');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    
    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 350px; overflow: hidden;">
            <div id="genericModalList" style="flex: 1.2; overflow-y: auto; padding-right: 15px; border-right: 1px solid var(--border-color);"></div>
            <div id="genericDetailContent" style="width: 340px; padding-left: 10px; padding-right: 20px; overflow-y: auto;">
                <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100%;">
                    <div style="font-size: 50px; margin-bottom: 20px; opacity: 0.1;">📊</div>
                    <p style="color:var(--text-color); text-align:center; font-size: 14px; line-height: 1.6; padding: 0 15px;">
                        Select a commodity from the list to view local market analytics and price trends.
                    </p>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    
    listEl.innerHTML = '';
    
    // --- NEW UI TABS: Clickable Buy/Sell Toggles! ---
    const toggleHeader = document.createElement('div');
    toggleHeader.style.cssText = "display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; position: sticky; top: 0; background: var(--bg-color); z-index: 5;";
    toggleHeader.innerHTML = `
        <button class="action-button" style="flex: 1; border-color: ${isBuy ? 'var(--accent-color)' : '#555'}; color: ${isBuy ? 'var(--accent-color)' : '#888'};" onclick="openTradeModal('buy')">🛒 BUY</button>
        <button class="action-button" style="flex: 1; border-color: ${!isBuy ? 'var(--success)' : '#555'}; color: ${!isBuy ? 'var(--success)' : '#888'};" onclick="openTradeModal('sell')">📦 SELL</button>
    `;
    listEl.appendChild(toggleHeader);
    
    // --- 3. POPULATE THE LISTS ---
    // Use a DocumentFragment for the Trade UI
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
                const stock = itemEntry.stock || 99; 
                // Notice we pass 'fragment' instead of 'listEl' here!
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
            header.textContent = "YOUR CARGO";
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

    // Push all generated trade rows to the screen at once!
    listEl.appendChild(fragment);
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
    row.style.cssText = "padding: 14px 10px; border-bottom: 1px solid var(--border-color); display: flex; gap: 15px;";
    if (isLocked) row.style.opacity = "0.5";

    const price = calculateItemPrice(item, isBuy, location);

    let actionButtonHtml = "";
    if (isLocked) {
        actionButtonHtml = `<button class="trade-btn locked" style="width:100%; padding:8px; font-size:13px;" disabled>🔒 LOCKED</button>`;
    } else {
        const actionClass = isBuy ? 'buy' : 'sell';
        const disabled = (isBuy && playerCredits < price) || (!isBuy && qty <= 0);
        
        const flexContainer = `<div style="display:flex; flex-wrap:nowrap; gap:6px; justify-content:flex-end; align-items:center;">`;
        
        if (isBuy) {
            actionButtonHtml = flexContainer + `
                <button class="trade-btn ${actionClass}" ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', true, 1)" style="padding:8px 12px; font-size:13px; cursor:pointer; min-width:60px;">
                    ${formatNumber(price)}c
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 40px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', true, 10)" title="Buy 10">
                    +10
                </button>
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 40px; cursor:pointer;" 
                    onclick="executeTrade('${itemId}', true, 'custom')" title="Enter Amount">
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
                <button class="trade-btn ${actionClass}" style="padding:8px; font-weight:bold; font-size:12px; min-width: 40px; cursor:pointer;" 
                    ${disabled ? 'disabled' : ''} onclick="executeTrade('${itemId}', false, 'custom')" title="Enter Amount">
                    #
                </button>
            </div>`;
        }
    }

    row.innerHTML = `
        <div class="trade-item-icon" onclick="displayMarketAnalysis('${itemId}')" style="cursor:pointer; font-size: 32px; padding-top: 2px;">${item.icon || '📦'}</div>
        
        <div class="trade-item-details" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div class="trade-item-name" onclick="displayMarketAnalysis('${itemId}')" style="cursor:pointer; font-size: 15px; font-weight: bold; color: var(--item-name-color); letter-spacing: 0.5px;">
                ${item.name} 
                ${isLocked ? `<span style="color:var(--danger); font-size:11px; margin-left: 6px;">(${lockReason})</span>` : ''}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div class="trade-item-sub" onclick="displayMarketAnalysis('${itemId}')" style="cursor:pointer; font-size: 13px; color: var(--text-color); line-height: 1.4;">
                    <div>${isBuy ? `In Stock: ${qty}` : `Owned: ${qty}`}</div>
                    <div style="color:var(--gold-text); font-size: 11px;">Galactic Base: ${formatNumber(item.basePrice)}c</div>
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
                    <span style="color:var(--gold-text); font-weight:bold;">${localPrice}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span style="color:var(--text-color);">Market Sell:</span>
                    <span style="color:var(--success); font-weight:bold;">${sellPrice}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:10px; font-size:13px;">
                    <span style="color:var(--item-desc-color);">Galactic Base:</span>
                    <span style="color:var(--item-desc-color);">${item.basePrice}c</span>
                </div>
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
    const location = window.activeTradeNPC || chunkManager.getTile(playerX, playerY);
    const item = COMMODITIES[itemId];
    const price = calculateItemPrice(item, isBuy, location);

    // --- FETCH ITEM ENTRY FOR STOCK/DEMAND LIMITS ---
    const tradeList = isBuy ? location.sells : location.buys;
    const itemEntry = tradeList ? tradeList.find(e => e.id === itemId || e === itemId) : null;
    const availableStock = itemEntry ? itemEntry.stock : 999; 

    let qtyToTrade = specificQty;

    if (specificQty === 'custom') {
        const promptMsg = isBuy 
            ? `Buy how many ${item.name}? (Stock: ${availableStock}, Max affordable: ${Math.floor(playerCredits/price)})`
            : `Sell how many ${item.name}? (Demand: ${availableStock}, Owned: ${playerCargo[itemId] || 0})`;
            
        let input = prompt(promptMsg, "1");
        if (input === null) return; 
        qtyToTrade = parseInt(input);
        
        if (isNaN(qtyToTrade) || qtyToTrade <= 0) {
            if (typeof showToast === 'function') showToast("Invalid Amount", "error");
            return;
        }
    }

    if (isBuy) {
        const affordable = Math.floor(playerCredits / price);
        const space = PLAYER_CARGO_CAPACITY - currentCargoLoad;

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
                if (typeof showToast === 'function') showToast("Cargo Hold Full!", "warning");
            }
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return;
        }
        
        if (playerCredits < price * qtyToTrade) {
             if (typeof showToast === 'function') showToast("Insufficient Credits!", "error");
             return;
        }
        if (currentCargoLoad + qtyToTrade > PLAYER_CARGO_CAPACITY) {
            if (typeof showToast === 'function') showToast("Not enough Cargo Space!", "error");
            return;
        }

        const totalCost = price * qtyToTrade;
        playerCredits -= totalCost;
        playerCargo[itemId] = (playerCargo[itemId] || 0) + qtyToTrade;
        
        if (itemEntry) itemEntry.stock -= qtyToTrade;
        
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
        
        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
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
                if (typeof showToast === 'function') showToast("Demand met!", "warning");
                if (typeof soundManager !== 'undefined') soundManager.playError();
            }
            return;
        }

        const totalEarned = price * qtyToTrade;
        playerCargo[itemId] -= qtyToTrade;
        if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
        
        if (itemEntry) itemEntry.stock -= qtyToTrade;
        
        playerCredits += totalEarned;
        updateCurrentCargoLoad();

        const profitXP = Math.max(1, Math.floor((price * qtyToTrade) * (XP_PER_PROFIT_UNIT * 0.8)));
        playerXP += profitXP;
        checkLevelUp();

        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        if (typeof showToast === 'function') showToast(`Sold ${qtyToTrade}x ${item.name}`, "success");
    }

    // Only update the world state if this is a physical station (not a passing NPC)
    if (!window.activeTradeNPC && location && (location.sells || location.buys)) {
        updateWorldState(playerX, playerY, {
            sells: location.sells,
            buys: location.buys,
            lastInteraction: currentGameDate
        });
    }

    const savedItemId = window.activeTradeItemId; 
    
    if (isBuy) openTradeModal('buy');
    else openTradeModal('sell');
    
    renderUIStats();

    if (savedItemId) {
        displayMarketAnalysis(savedItemId);
    }
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

    if (locMult === 1.0 && location && location.type === OUTPOST_CHAR_VAL) {
        locMult = isBuy ? 1.2 : 0.8;
    }
    
    if (!isBuy) {
        price = price * 0.5;
    }

    price = price * locMult;

    if (item.illegal && !isBuy) {
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
    return Math.max(1, price);
}

// --- ECLIPSE SHADOW BROKER ---

function openShadowBroker() {
    openGenericModal("SHADOW BROKER NETWORK");
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; opacity:0.8;">🎲</div>
            <h3 style="color:#9933FF; margin-bottom:10px;">THE SHADOW BROKER</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">"Concord patrols breathing down your neck? I can make your problems disappear... for a cut. I pay top credit for goods that don't officially exist."</p>
        </div>
    `;
    actionsEl.innerHTML = '';

    renderShadowBrokerList();
}

function renderShadowBrokerList() {
    const listEl = document.getElementById('genericModalList');
    listEl.innerHTML = '';

    let foundAny = false;
    let totalBlackMarketValue = 0;

    for (const itemId in playerCargo) {
        if (playerCargo[itemId] > 0 && COMMODITIES[itemId] && COMMODITIES[itemId].illegal) {
            foundAny = true;
            const item = COMMODITIES[itemId];
            const qty = playerCargo[itemId];
            const value = (item.basePrice * 3) * qty; 
            totalBlackMarketValue += value;
            
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.innerHTML = `<span style="color:#FF5555; font-weight:bold;">${item.name}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showShadowBrokerItemDetails(itemId);
            listEl.appendChild(row);
        }
    }

    if (!foundAny) {
        listEl.innerHTML = `<div style="padding:15px; color:var(--item-desc-color); text-align:center; line-height:1.5;">Your hold is clean. The Broker has no interest in legal commodities.</div>`;
        document.getElementById('genericDetailContent').innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <div style="font-size:60px; margin-bottom:15px; opacity:0.5;">🧼</div>
                <h3 style="color:var(--accent-color); margin-bottom:10px;">CLEAN RECORD</h3>
                <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">No contraband found.</p>
            </div>
        `;
        document.getElementById('genericModalActions').innerHTML = '';
    } else {
        const fenceAllRow = document.createElement('div');
        fenceAllRow.className = 'trade-item-row';
        fenceAllRow.style.background = 'rgba(153, 51, 255, 0.1)';
        fenceAllRow.style.borderBottom = '2px solid #9933FF';
        fenceAllRow.innerHTML = `<span style="color:#DDA0DD; font-weight:bold;">FENCE ALL CONTRABAND</span> <span style="color:var(--gold-text);">${formatNumber(totalBlackMarketValue)}c</span>`;
        fenceAllRow.onclick = () => showFenceAllDetails(totalBlackMarketValue);
        listEl.prepend(fenceAllRow);
    }
}

function showShadowBrokerItemDetails(itemId) {
    const item = COMMODITIES[itemId];
    const qty = playerCargo[itemId];
    const unitPrice = item.basePrice * 3;
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
    `;
}

function processShadowBrokerTrade(itemId) {
    let totalProfit = 0;
    let soldItemsText = [];

    if (itemId === 'ALL') {
        for (const id in playerCargo) {
            if (playerCargo[id] > 0 && COMMODITIES[id] && COMMODITIES[id].illegal) {
                const qty = playerCargo[id];
                const value = (COMMODITIES[id].basePrice * 3) * qty;
                totalProfit += value;
                soldItemsText.push(`${qty}x ${COMMODITIES[id].name}`);
                playerCargo[id] = 0;
            }
        }
    } else {
        const qty = playerCargo[itemId];
        const value = (COMMODITIES[itemId].basePrice * 3) * qty;
        totalProfit += value;
        soldItemsText.push(`${qty}x ${COMMODITIES[itemId].name}`);
        playerCargo[itemId] = 0;
    }

    if (totalProfit > 0) {
        playerCredits += totalProfit;
        updateCurrentCargoLoad();
        
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
        document.getElementById('genericModalActions').innerHTML = '';
    }
}

// --- CRYPTARCH MODAL SYSTEM ---

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
    actionsEl.innerHTML = '';

    renderCryptarchList();
}

function renderCryptarchList() {
    const listEl = document.getElementById('genericModalList');
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

    actionsEl.innerHTML = btnHtml;
}

function processDecryption(method, itemId = 'ENCRYPTED_ENGRAM') {
    let cost = 250;
    if (itemId === 'ENCRYPTED_DATA') cost = 500;
    if (itemId === 'ANCIENT_ARCHIVE') cost = 1000;
    
    const isAtXerxes = document.getElementById('xerxesOverlay') && document.getElementById('xerxesOverlay').style.display === 'flex';
    const xpMultiplier = isAtXerxes ? 2 : 1;

    if (method === 'cipher') {
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
        playerCredits += (500 + Math.floor(Math.random() * 500));
        textReward = `Data core sold to brokers.`;
    } else if (itemId === 'ANCIENT_ARCHIVE') {
        xpReward = 500;
        playerCredits += (1000 + Math.floor(Math.random() * 1000));
        textReward = `Holographic array unlocked! Forbidden history recovered.`;
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
    checkLevelUp(); 
    
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
        document.getElementById('genericModalActions').innerHTML = '';
    }
    renderUIStats();
}

function fenceEclipseContraband() {
    let soldSomething = false;
    let totalProfit = 0;
    
    for (const itemID in playerCargo) {
        if (playerCargo[itemID] > 0 && typeof COMMODITIES !== 'undefined' && COMMODITIES[itemID] && COMMODITIES[itemID].illegal) {
            const qty = playerCargo[itemID];
            const value = (COMMODITIES[itemID].basePrice * 3) * qty; 
            
            playerCredits += value;
            totalProfit += value;
            playerCargo[itemID] = 0;
            soldSomething = true;
        }
    }
    
    if (soldSomething) {
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        showToast(`CONTRABAND FENCED (+${totalProfit}c)`, "success");
        if (typeof renderUIStats === 'function') renderUIStats();

        unlockLoreEntry("FACTION_ECLIPSE_SMUGGLING");
    } else {
        showToast("No contraband in cargo hold.", "info");
    }
}

function buyFakeID() {
    showToast("The Forger is currently laying low.", "info");
    logMessage("A hooded figure whispers: 'Got too much heat right now. Come back next cycle.'");
}

// ==========================================
// --- DEEP SPACE NPC TRADING ---
// ==========================================

function openShipTrade(npc) {
    // Generate a temporary trading profile based on the NPC being hailed
    window.activeTradeNPC = {
        name: npc.name + " (Ship-to-Ship)",
        type: 'location',
        isNPC: true,
        faction: npc.faction || 'INDEPENDENT',
        isBlackMarket: npc.faction === 'ECLIPSE',
        sells: [
            { id: "FUEL_CELLS", priceMod: 1.5, stock: Math.floor(Math.random() * 10) + 5 }, // Marked up deep space delivery
            { id: "MEDICAL_SUPPLIES", priceMod: 1.2, stock: Math.floor(Math.random() * 5) + 2 }
        ],
        buys: [
            { id: "MINERALS", priceMod: 0.9, stock: 50 },
            { id: "TECH_PARTS", priceMod: 1.1, stock: 10 }
        ]
    };

    // Customize inventories based on the NPC's actual role/faction
    const lowerDesc = (npc.desc || "").toLowerCase();
    const lowerName = (npc.name || "").toLowerCase();

    if (lowerName.includes("miner") || lowerDesc.includes("mining") || lowerDesc.includes("ore")) {
        window.activeTradeNPC.sells = [
            { id: "MINERALS", priceMod: 0.7, stock: Math.floor(Math.random() * 30) + 15 },
            { id: "RARE_METALS", priceMod: 0.8, stock: Math.floor(Math.random() * 5) + 1 }
        ];
        window.activeTradeNPC.buys = [
            { id: "FOOD_SUPPLIES", priceMod: 1.5, stock: 20 },
            { id: "FUEL_CELLS", priceMod: 1.5, stock: 15 }
        ];
    } else if (npc.faction === 'ECLIPSE' || lowerName.includes("smuggler")) {
        window.activeTradeNPC.sells = [
            { id: "PROHIBITED_STIMS", priceMod: 1.1, stock: Math.floor(Math.random() * 8) + 2 },
            { id: "FORBIDDEN_TEXTS", priceMod: 1.3, stock: Math.floor(Math.random() * 3) + 1 }
        ];
        window.activeTradeNPC.buys = [
            { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: 30 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.2, stock: 15 }
        ];
    } else if (npc.faction === 'KTHARR') {
        window.activeTradeNPC.sells = [
            { id: "KTHARR_SPICES", priceMod: 1.0, stock: Math.floor(Math.random() * 10) + 5 },
            { id: "LIVING_HULL_TISSUE", priceMod: 1.2, stock: Math.floor(Math.random() * 2) + 1 }
        ];
        window.activeTradeNPC.buys = [
            { id: "RARE_METALS", priceMod: 1.1, stock: 20 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.3, stock: 10 }
        ];
    } else if (npc.faction === 'CONCORD') {
        window.activeTradeNPC.sells = [
            { id: "NAVIGATION_CHARTS", priceMod: 1.0, stock: Math.floor(Math.random() * 5) + 1 },
            { id: "FUEL_CELLS", priceMod: 1.0, stock: Math.floor(Math.random() * 20) + 10 }
        ];
        window.activeTradeNPC.buys = [
            { id: "FOOD_SUPPLIES", priceMod: 1.1, stock: 30 }
        ];
    }

    // Launch the standard trade interface loaded with our custom ship logic!
    openTradeModal('buy');
}
