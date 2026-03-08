// --- CONSOLIDATED TRADE SYSTEM ---
function openTradeModal(mode) {
    const location = chunkManager.getTile(playerX, playerY);
    
    if (!location || location.type !== 'location') {
        logMessage("Trading terminal offline.");
        return;
    }

    // --- ECONOMY RESTOCK LOGIC (Time-Gated) ---
    // Only restock if 1.0 stardate (~100 moves) has passed since the last time they looked at this market
    if (!location.lastRestockTime || (currentGameDate - location.lastRestockTime) > 1.0) {
        
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
        
        // Record the time of this restock
        location.lastRestockTime = currentGameDate;
    }
    
    // Slowly recover demand (buys)
    if (location.buys) {
        location.buys.forEach(item => {
            // If stock is high (they bought a lot from player), slowly reduce it
            if (item.stock > 0) {
                item.stock = Math.max(0, item.stock - (Math.floor(Math.random() * 2) + 1));
            }
        });
    }

    const isBuy = mode === 'buy';
    
    // --- 1. OPEN MODAL & DYNAMIC TITLE ---
    // Update the title to match the specialized faction marketplaces
    let modalTitle = isBuy ? "STATION MARKETPLACE" : "CARGO MANIFEST";
    const faction = location.faction; // Standardizing to location.faction

    // If it's a specialty market (like Xerxes, which uses its own Spire menu context), we update the title
    if (location.isBlackMarket) {
        modalTitle = isBuy ? "SHADOW NETWORK : BUY" : "SHADOW NETWORK : SELL";
    } else if (faction === 'KTHARR') {
        modalTitle = isBuy ? "PROVING GROUNDS : BETTING DECK" : "PROVING GROUNDS : FENCE COMMODITIES";
    }
    
    openGenericModal(modalTitle);

    // --- 2. DYNAMIC FACTION BANNER RESOLUTION ---
    let headerImageHTML = "";
    
    // Default asset (Independent/Aegis Standard)
    let bannerSrc = 'assets/concord_market.png';
    // Match the standard accent glow color to the faction aesthetic
    let borderColor = 'var(--accent-color)';
    let glowColor = 'rgba(0, 224, 224, 0.15)'; // Cyan standard
    
    // Black Market Override
    if (location.isBlackMarket) {
        bannerSrc = 'assets/black_market.png';
        borderColor = '#9C27B0'; // Purple illicit glow
        glowColor = 'rgba(156, 39, 176, 0.2)';
    } else {
        // Resolve standard faction-specific banners
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
            borderColor = '#9933FF'; // Purple illegal
            glowColor = 'rgba(153, 51, 255, 0.2)'; 
        } else if (faction === 'INDEPENDENT') {
            bannerSrc = 'assets/organic_market.png'; // specialty independent
            borderColor = 'var(--success)';
            glowColor = 'rgba(0, 255, 0, 0.15)'; // Sickly green
        }
    }

    // Create the beautiful framed viewport banner using the determined asset
    headerImageHTML = `
        <div style="width: 100%; height: 140px; background-image: url('${bannerSrc}'); background-size: cover; background-position: center 25%; border: 1px solid ${borderColor}; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 5px 20px ${glowColor}; flex-shrink: 0;"></div>
    `;

    const container = document.getElementById('genericModalContent');
    
    // Force the container to stack items cleanly
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
    
    // --- 3. POPULATE THE LISTS ---
    if (isBuy) {
        // --- BUY MODE ---
        const items = location.sells || [];
        if (items.length === 0) {
            listEl.innerHTML = `<div style="padding:15px; color:#888;">No commodities for sale here.</div>`;
            return;
        }

        items.forEach(itemEntry => {
            // Handle both object {id, stock} and simple string ID
            const itemId = itemEntry.id || itemEntry;
            const stock = itemEntry.stock || 99; // Default to 99 if not specified
            renderTradeRow(itemId, stock, true, location, listEl);
        });
        
    } else {
        // --- SELL MODE ---
        const playerHas = Object.keys(playerCargo).filter(id => playerCargo[id] > 0);
        const stationBuys = location.buys || [];
        
        if (playerHas.length > 0) {
            const header = document.createElement('div');
            header.className = 'trade-list-header';
            header.style.cssText = "color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;";
            header.textContent = "YOUR CARGO";
            listEl.appendChild(header);

            playerHas.forEach(itemId => {
                renderTradeRow(itemId, playerCargo[itemId], false, location, listEl);
            });
        }

        // Fix Station Demand to handle string IDs vs Objects
        const otherDemands = stationBuys.filter(b => {
            const bId = b.id || b;
            return !playerHas.includes(bId);
        });

        if (otherDemands.length > 0) {
            const header = document.createElement('div');
            header.className = 'trade-list-header';
            header.style.cssText = "color:#666; font-size:10px; letter-spacing:2px; margin-top:20px; margin-bottom:10px; border-bottom:1px solid #333;";
            header.textContent = "STATION DEMAND";
            listEl.appendChild(header);

            otherDemands.forEach(entry => {
                const itemId = entry.id || entry;
                renderTradeRow(itemId, 0, false, location, listEl);
            });
        }

        if (playerHas.length === 0 && otherDemands.length === 0) {
            listEl.innerHTML = `<div style="padding:15px; color:#888;">Station is not currently buying resources.</div>`;
        }
    }
}

// Helper to render individual rows consistently

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
    window.activeTradeItemId = itemId; // Tell the game to remember we are looking at this

    const item = COMMODITIES[itemId];
    const detailEl = document.getElementById('genericDetailContent');
    
    if (!item || !detailEl) return;

    const location = chunkManager.getTile(playerX, playerY);
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
                    <span style="color:var(--text-color);">Station Buy:</span>
                    <span style="color:var(--gold-text); font-weight:bold;">${localPrice}c</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span style="color:var(--text-color);">Station Sell:</span>
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

// Resets the market analysis panel to its empty state
function clearMarketAnalysis() {
    window.activeTradeItemId = null; // Clear the memory
    
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

function showTradeDetails(itemId, price, stock, isBuy, location) {
    const comm = COMMODITIES[itemId];
    let marketStatus = "Standard Market Rate";
    
    if (isBuy) {
        if (price < comm.basePrice * 0.8) marketStatus = "<span style='color:var(--success)'>BELOW MARKET VALUE (Cheap!)</span>";
        else if (price > comm.basePrice * 1.2) marketStatus = "<span style='color:var(--danger)'>INFLATED PRICE (Expensive)</span>";
    } else {
        const demand = location.buys.find(b => b.id === itemId);
        if (demand) marketStatus = "<span style='color:var(--success)'>HIGH DEMAND ITEM</span>";
        else marketStatus = "<span style='color:#888'>No Local Demand (Dumping)</span>";
    }

    const html = `
        <h3 style="color:var(--accent-color)">${comm.name}</h3>
        <p style="font-size:12px; color:var(--text-color); opacity:0.8;">${comm.description}</p>
        
        <div class="trade-math-area">
            <div class="trade-stat-row"><span>Unit Price:</span> <span>${formatNumber(price)}c</span></div>
            <div class="trade-stat-row"><span>Available: ${isBuy ? 'Stock' : 'In Hold'}</span> <span>${formatNumber(stock)} units</span></div>
            <div class="trade-stat-row" style="margin-top:10px; border-top:1px solid #333; padding-top:5px;">
                <span>Market Status:</span> <span style="font-size:10px">${marketStatus}</span>
            </div>
        </div>
        
        ${comm.illegal ? '<div style="background:#300; color:var(--danger); padding:5px; margin-top:10px; font-size:10px; text-align:center;">⚠ CONTRABAND: POSSESSION IS ILLEGAL ⚠</div>' : ''}
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;

    const actionsEl = document.getElementById('genericModalActions');
    
    if (isBuy) {
        const maxAfford = Math.floor(playerCredits / price);
        const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        const canBuy = Math.min(stock, maxAfford, spaceLeft);
        
        actionsEl.innerHTML = `
            <div style="text-align:center; margin-bottom:10px; color:#888;">Space: ${formatNumber(spaceLeft)} | Afford: ${formatNumber(maxAfford)}</div>
            <button class="action-button" ${canBuy > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 1, true)">BUY 1 (${formatNumber(price)}c)</button>
            <button class="action-button" ${canBuy >= 5 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 5, true)">BUY 5 (${formatNumber(price * 5)}c)</button>
            <button class="action-button" ${canBuy > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, ${canBuy}, true)">BUY MAX (${formatNumber(canBuy)})</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" ${stock > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 1, false)">SELL 1 (${formatNumber(price)}c)</button>
            <button class="action-button" ${stock >= 5 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 5, false)">SELL 5 (${formatNumber(price * 5)}c)</button>
            <button class="action-button" ${stock > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, ${stock}, false)">SELL ALL (${formatNumber(price * stock)}c)</button>
        `;
    }
}

function executeTrade(itemId, isBuy, specificQty = 1) {
    const location = chunkManager.getTile(playerX, playerY);
    const item = COMMODITIES[itemId];
    const price = calculateItemPrice(item, isBuy, location);

    // --- FETCH ITEM ENTRY FOR STOCK/DEMAND LIMITS ---
    const tradeList = isBuy ? location.sells : location.buys;
    // Find the specific item data for this station
    const itemEntry = tradeList ? tradeList.find(e => e.id === itemId || e === itemId) : null;
    const availableStock = itemEntry ? itemEntry.stock : 999; // Fallback if infinite/undefined

    // --- Custom Quantity Logic ---
    let qtyToTrade = specificQty;

    // If the user clicked the "[#]" button, ask them how many
    if (specificQty === 'custom') {
        const promptMsg = isBuy 
            ? `Buy how many ${item.name}? (Stock: ${availableStock}, Max affordable: ${Math.floor(playerCredits/price)})`
            : `Sell how many ${item.name}? (Demand: ${availableStock}, Owned: ${playerCargo[itemId] || 0})`;
            
        let input = prompt(promptMsg, "1");
        if (input === null) return; // Cancelled
        qtyToTrade = parseInt(input);
        
        if (isNaN(qtyToTrade) || qtyToTrade <= 0) {
            if (typeof showToast === 'function') showToast("Invalid Amount", "error");
            return;
        }
    }

    // --- BUY LOGIC ---
    if (isBuy) {
        const affordable = Math.floor(playerCredits / price);
        const space = PLAYER_CARGO_CAPACITY - currentCargoLoad;

        // Cap all buy options by the station's actual stock!
        if (qtyToTrade === 'max') {
            qtyToTrade = Math.min(affordable, space, availableStock);
        } else if (qtyToTrade === 10) {
            qtyToTrade = Math.min(10, affordable, space, availableStock);
        } else {
            // Cap custom input
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
        
        // Final Affordability Check for Custom Amounts
        if (playerCredits < price * qtyToTrade) {
             if (typeof showToast === 'function') showToast("Insufficient Credits!", "error");
             return;
        }
        // Final Space Check for Custom Amounts
        if (currentCargoLoad + qtyToTrade > PLAYER_CARGO_CAPACITY) {
            if (typeof showToast === 'function') showToast("Not enough Cargo Space!", "error");
            return;
        }

        const totalCost = price * qtyToTrade;
        playerCredits -= totalCost;
        playerCargo[itemId] = (playerCargo[itemId] || 0) + qtyToTrade;
        
        // --- DECREMENT THE STOCK ---
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
    // --- SELL LOGIC ---
    else {
        const owned = playerCargo[itemId] || 0;
        
        // Cap all sell options by what the station actually wants (demand/stock)
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
        if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
        
        // --- DECREMENT STATION DEMAND ---
        if (itemEntry) itemEntry.stock -= qtyToTrade;
        
        playerCredits += totalEarned;
        updateCurrentCargoLoad();

        // Economy XP
        const profitXP = Math.max(1, Math.floor((price * qtyToTrade) * (XP_PER_PROFIT_UNIT * 0.8)));
        playerXP += profitXP;
        checkLevelUp();

        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        if (typeof showToast === 'function') showToast(`Sold ${qtyToTrade}x ${item.name}`, "success");
    }

    // Save the station's modified inventory to the persistent world state.
    // The Garbage Collector will naturally "restock" this station after 50 stardates!
    if (location && (location.sells || location.buys)) {
        updateWorldState(playerX, playerY, {
            sells: location.sells,
            buys: location.buys,
            lastInteraction: currentGameDate
        });
    }

    // Refresh UI
    const savedItemId = window.activeTradeItemId; // Capture what we are looking at
    
    if (isBuy) openTradeModal('buy');
    else openTradeModal('sell');
    
    renderUIStats();

    // If we were looking at an item, immediately re-open its panel so it doesn't vanish
    if (savedItemId) {
        displayMarketAnalysis(savedItemId);
    }
}

/**
 * Centralized logic for item pricing.
 * Ensures Outposts, Stations, and Perks all affect price identically.
 */

function calculateItemPrice(itemOrId, isBuy, location) {
    // Flexibility: Accept either the full object or just the ID string
    const itemId = typeof itemOrId === 'string' ? itemOrId : Object.keys(COMMODITIES).find(key => COMMODITIES[key] === itemOrId);
    const item = typeof itemOrId === 'string' ? COMMODITIES[itemOrId] : itemOrId;

    if (!item) return 0;

    let price = item.basePrice || 0;
    let locMult = 1.0;

    // 1. Check for Station-Specific Economy Overrides
    if (location && (location.sells || location.buys)) {
        const tradeList = isBuy ? location.sells : location.buys;
        if (tradeList) {
            const entry = tradeList.find(e => (e.id === itemId) || (e === itemId));
            if (entry && entry.priceMod) {
                locMult = entry.priceMod;
            }
        }
    }

    // 2. Fallback to Outpost generic pricing
    if (locMult === 1.0 && location && location.type === OUTPOST_CHAR_VAL) {
        locMult = isBuy ? 1.2 : 0.8;
    }
    
    // 3. Trade Margin (Selling items to stations pays 50% base)
    if (!isBuy) {
        price = price * 0.5;
    }

    price = price * locMult;

    // 4. Illegal Goods Markup (Risk Premium)
    // If selling illegal goods, they are worth 2.5x more on the black market
    if (item.illegal && !isBuy) {
        price *= 2.5; 
    }

    // 5. Dynamic Market Trends (Hot Commodities)
    const locationName = location ? location.name : "";
    if (activeMarketTrend && 
        activeMarketTrend.station === locationName && 
        activeMarketTrend.item === itemId && 
        currentGameDate < activeMarketTrend.expiry) {
        
        if (activeMarketTrend.isBoom) {
            price *= 2.5; // Massive Shortage: They pay 2.5x standard value!
        } else {
            price *= 0.4; // Massive Surplus: They sell it for 60% off!
        }
        
    } else {
        // Standard Fluctuation (Sine Wave)
        const uniqueOffset = item.basePrice || 0;
        const fluctuation = Math.sin((currentGameDate + uniqueOffset) / 5);
        const marketFactor = 1 + (fluctuation * 0.15);
        price *= marketFactor;
    }

    // 6. Apply Perks & Crew Bonuses (Separated so they stack!)
    if (typeof playerPerks !== 'undefined' && playerPerks.has('SILVER_TONGUE')) {
        price = isBuy ? (price * 0.9) : (price * 1.1);
    }
    
    if (typeof hasCrewPerk === 'function' && hasCrewPerk('TRADE_BONUS')) {
        price = isBuy ? (price * 0.9) : (price * 1.1);
    }

    // 7. Safety Rounding
    price = Math.floor(price);
    return Math.max(1, price);
}

// --- ECLIPSE SHADOW BROKER ---

function openShadowBroker() {
    openGenericModal("SHADOW BROKER NETWORK");
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Initial landing view
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

    // Search player cargo for illegal goods
    for (const itemId in playerCargo) {
        if (playerCargo[itemId] > 0 && COMMODITIES[itemId] && COMMODITIES[itemId].illegal) {
            foundAny = true;
            const item = COMMODITIES[itemId];
            const qty = playerCargo[itemId];
            const value = (item.basePrice * 3) * qty; // 3x Premium Multiplier
            totalBlackMarketValue += value;
            
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.innerHTML = `<span style="color:#FF5555; font-weight:bold;">${item.name}</span> <span style="color:var(--text-color);">x${qty}</span>`;
            row.onclick = () => showShadowBrokerItemDetails(itemId);
            listEl.appendChild(row);
        }
    }

    if (!foundAny) {
        // Player is clean
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
        // Add a "Fence All" button at the very top of the list for convenience
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
        // Sell everything illegal
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
        // Sell single item type
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
        
        // Refresh the list view
        renderShadowBrokerList();
        
        // Update the right pane to show a success receipt
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

    // Initial landing view with the new custom image!
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

    // Define which items can be decrypted
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
    const hasPerk = playerPerks.has('CYBER_SLICER');
    
    // Dynamic cost scaling based on item rarity
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
    
    // Priority 1: Free Perk
    if (hasPerk) {
        btnHtml += `<button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color); box-shadow: 0 0 10px rgba(0,224,224,0.2);" onclick="processDecryption('perk', '${itemId}')">USE CYBER SLICER (FREE)</button>`;
    }
    
    // Priority 2: Consumable Item
    if (hasCipher) {
        btnHtml += `<button class="action-button" style="border-color:var(--success); color:var(--success);" onclick="processDecryption('cipher', '${itemId}')">USE CIPHER (CONSUMES 1)</button>`;
    }
    
    // Priority 3: Pay Credits
    const canAfford = playerCredits >= decryptCost;
    btnHtml += `<button class="action-button" ${canAfford ? '' : 'disabled'} style="border-color:var(--gold-text); color:var(--gold-text);" onclick="processDecryption('credits', '${itemId}')">PAY CRYPTARCH (${decryptCost}c)</button>`;

    actionsEl.innerHTML = btnHtml;
}

// --- MASTER DECRYPTION FUNCTION ---
function processDecryption(method, itemId = 'ENCRYPTED_ENGRAM') {
    let cost = 250;
    if (itemId === 'ENCRYPTED_DATA') cost = 500;
    if (itemId === 'ANCIENT_ARCHIVE') cost = 1000;
    
    // Check if we are at Xerxes for the "Spire Boost"
    const isAtXerxes = document.getElementById('xerxesOverlay').style.display === 'flex';
    const xpMultiplier = isAtXerxes ? 2 : 1;

    // 1. Handle the specific cost of the method used
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

    // 2. Consume the Target Item
    playerCargo[itemId] -= 1;
    if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
    
    updateCurrentCargoLoad(); 

    // 3. Reward Pool Generation
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
    
    // --- APPLY THE XERXES MULTIPLIER ---
    const finalXP = xpReward * xpMultiplier;
    playerXP += finalXP;

    // 4. Feedback
    if (isAtXerxes) {
        logMessage(`<span style="color:#00E0E0">> SPIRE RESONANCE: Decryption output doubled! (+${finalXP} XP)</span>`);
        if (typeof xerxesLog === 'function') xerxesLog("Spire energy channeled into decryption. Output maximized.", "good");
    }

    logMessage(`<span style="color:#DDA0DD">> SUCCESS: ${textReward}</span>`);
    showToast(`DECRYPTED: +${finalXP} XP`, "success");
    
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    checkLevelUp(); 
    
    // 5. Cleanup / Refresh UI
    if (document.getElementById('cargoOverlay').style.display !== 'none') {
        renderCargoList();
    } else if (document.getElementById('genericModalOverlay').style.display !== 'none') {
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

// ==========================================
// --- ECLIPSE CARTEL SERVICES ---
// ==========================================

function fenceEclipseContraband() {
    // Instantly sells all illegal goods for 3x value
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
    // PLACEHOLDER: Pay a massive flat fee (e.g., 5000c) to instantly wipe your Notoriety without dealing with Concord.
    showToast("The Forger is currently laying low.", "info");
    logMessage("A hooded figure whispers: 'Got too much heat right now. Come back next cycle.'");
}
