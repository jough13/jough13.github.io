// --- START OF FILE expansion-bazaar.js ---

window.ExpansionManager.register({
    id: "the_bazaar",
    name: "The Bazaar (Multiplayer Trading)",
    version: "1.2", // Upgraded version!
    
    data: {}, // No new hardcoded items needed, purely a systems expansion

    init: function() {
        // ==========================================
        // 1. INJECT THE BAZAAR UI MODAL
        // ==========================================
        const bazaarHTML = `
        <div id="bazaarModal" class="modal-overlay hidden" role="dialog" aria-modal="true" style="z-index: 500;">
            <div class="modal-content themed-container p-6 rounded-2xl shadow-2xl border-2 border-yellow-600 max-w-5xl w-full h-[85vh] flex flex-col bg-[var(--bg-container)]">
                
                <!-- Header -->
                <div class="flex justify-between items-end mb-4 border-b-2 border-yellow-700 pb-3 flex-shrink-0">
                    <h2 class="text-4xl font-bold text-yellow-500 drop-shadow-md" style="font-family: 'Uncial Antiqua', cursive;">Secure Trade</h2>
                    <div class="font-bold text-lg bg-black bg-opacity-40 px-4 py-2 rounded-lg border border-yellow-800 shadow-inner">
                        Status: <span id="bazaarStatus" class="text-yellow-400 animate-pulse">Negotiating</span>
                    </div>
                </div>
                
                <!-- 3 Columns -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow overflow-hidden min-h-0">
                    
                    <!-- My Inventory -->
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-gray-700 p-3 shadow-inner">
                        <h3 class="text-lg font-bold mb-2 border-b border-gray-600 pb-1 text-gray-300">Your Bag (Gold: <span id="bazaarMyGold" class="text-yellow-400">0</span>)</h3>
                        <ul id="bazaarInvList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                        <div class="mt-2 flex gap-2 flex-shrink-0">
                            <input type="number" id="bazaarGoldInput" min="1" class="w-full bg-gray-900 text-yellow-400 font-bold px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-yellow-500" placeholder="Gold amt...">
                            <button id="bazaarOfferGoldBtn" class="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded shadow transition-transform active:scale-95 whitespace-nowrap border-b-2 border-yellow-900 active:border-b-0 active:mt-0.5">Offer Gold</button>
                        </div>
                    </div>
                    
                    <!-- My Offer -->
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-green-700 p-3 shadow-inner">
                        <h3 class="text-lg font-bold mb-2 border-b border-green-600 pb-1 text-green-400">Your Offer (Gold: <span id="bazaarMyOfferGold" class="text-yellow-400">0</span>)</h3>
                        <ul id="bazaarMyOfferList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                        <button id="bazaarLockBtn" class="mt-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow transition-transform active:scale-95 flex-shrink-0 border-b-4 border-green-800 active:border-b-0 active:mt-1">Lock Offer</button>
                    </div>
                    
                    <!-- Their Offer -->
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-blue-700 p-3 shadow-inner relative">
                        <h3 id="bazaarTheirName" class="text-lg font-bold mb-2 border-b border-blue-600 pb-1 text-blue-400">Their Offer (Gold: <span id="bazaarTheirOfferGold" class="text-yellow-400">0</span>)</h3>
                        <ul id="bazaarTheirOfferList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                        <div id="bazaarTheirLock" class="mt-2 text-center text-gray-500 font-bold bg-black bg-opacity-40 py-3 rounded-lg border border-gray-700 shadow-inner flex-shrink-0">Waiting for them...</div>
                        
                        <!-- Anti-Scam Overlay -->
                        <div id="antiScamOverlay" class="absolute inset-0 bg-red-900 bg-opacity-40 flex items-center justify-center z-10 rounded-xl hidden pointer-events-none">
                            <span class="text-red-400 font-bold bg-black bg-opacity-80 px-4 py-2 rounded-lg border border-red-500 shadow-lg">Offer Changed! Wait...</span>
                        </div>
                    </div>
                </div>
                
                <button type="button" id="bazaarCancelBtn" class="mt-4 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl w-full flex-shrink-0 shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1">Cancel Trade</button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', bazaarHTML);

        // ==========================================
        // 2. THE TRADE MANAGER (Logic Engine)
        // ==========================================
        window.TradeManager = {
            activeTradeId: null,
            targetId: null,
            targetName: "Player",
            isInitiator: false,
            role: null, 
            
            localInv: [], 
            localGold: 0,
            
            myOffer: { gold: 0, items: [] },
            theirOffer: { gold: 0, items: [] },
            myLock: false,
            theirLock: false,
            
            isProcessing: false, 
            tradeListenerRef: null,
            antiScamTimer: null,
            scamLockActive: false,

            // --- A. STARTING A TRADE ---
            requestTrade: function(targetUid, targetName) {
                if (!targetUid || targetUid === player_id) return;
                logMessage(`{yellow:Sending trade request to ${targetName}...}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                
                rtdb.ref(`tradeRequests/${targetUid}`).set({
                    fromId: player_id,
                    fromName: gameState.player.name || auth.currentUser.email.split('@')[0],
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            },

            // --- B. ACCEPTING A TRADE ---
            acceptTrade: function() {
                if (!this.pendingRequest) {
                    logMessage("{gray:You have no pending trade requests.}");
                    return;
                }
                
                const tradeId = `trade_${this.pendingRequest.fromId}_${player_id}`;
                logMessage(`{green:Accepting trade from ${this.pendingRequest.fromName}...}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                rtdb.ref(`trades/${tradeId}`).set({
                    status: 'active',
                    initiator: this.pendingRequest.fromId,
                    target: player_id,
                    offerA: { gold: 0, items: [] },
                    offerB: { gold: 0, items: [] },
                    lockA: false,
                    lockB: false
                });

                rtdb.ref(`tradeRequests/${this.pendingRequest.fromId}`).set({
                    accepted: tradeId,
                    targetName: gameState.player.name || auth.currentUser.email.split('@')[0]
                });

                this.joinTrade(tradeId, false, this.pendingRequest.fromName);
                this.pendingRequest = null;
                rtdb.ref(`tradeRequests/${player_id}`).remove(); 
            },

            // --- C. JOINING THE TRADE WINDOW ---
            joinTrade: function(tradeId, isInitiator, otherName) {
                if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
                
                this.activeTradeId = tradeId;
                this.isInitiator = isInitiator;
                this.role = isInitiator ? 'A' : 'B';
                this.targetName = otherName;
                
                // Deep clone and inject strict unique IDs for interaction tracking!
                this.localInv = (typeof window.cloneItemSafely === 'function' ? window.fastClone(gameState.player.inventory) : JSON.parse(JSON.stringify(gameState.player.inventory)))
                    .filter(i => i && !i.isEquipped && i.type !== 'quest')
                    .map((item, i) => { item._tradeUid = `inv_${i}`; return item; });
                
                this.localGold = Number(gameState.player.coins) || 0;
                
                this.myOffer = { gold: 0, items: [] };
                this.theirOffer = { gold: 0, items: [] };
                this.myLock = false;
                this.theirLock = false;
                this.scamLockActive = false;

                document.getElementById('bazaarTheirName').innerHTML = `${otherName}'s Offer (Gold: <span id="bazaarTheirOfferGold" class="text-yellow-400">0</span>)`;
                document.getElementById('bazaarModal').classList.remove('hidden');
                
                this.renderUI();

                this.tradeListenerRef = rtdb.ref(`trades/${tradeId}`);
                this.tradeListenerRef.on('value', (snap) => {
                    const data = snap.val();
                    if (!data) return;

                    if (data.status === 'cancelled') {
                        logMessage(`{red:The trade was cancelled.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        this.closeTrade();
                        return;
                    }

                    if (data.status === 'completed') {
                        this.executeFinalSwap();
                        return;
                    }

                    // Extract their new offer
                    const theirRole = this.isInitiator ? 'offerB' : 'offerA';
                    const newTheirGold = Number(data[theirRole]?.gold) || 0;
                    const newTheirItems = data[theirRole]?.items || [];
                    const theirLockKey = this.isInitiator ? 'lockB' : 'lockA';
                    const newTheirLock = data[theirLockKey] || false;

                    // 🚨 ANTI-SCAM GUARD: Detect if they modified their offer
                    const oldOfferStr = JSON.stringify(this.theirOffer.items);
                    const newOfferStr = JSON.stringify(newTheirItems);
                    
                    if (this.theirOffer.gold !== newTheirGold || oldOfferStr !== newOfferStr) {
                        if (this.myLock) {
                            // They changed the offer while I was locked! Revoke my lock immediately!
                            this.myLock = false;
                            this.pushUpdate(); // Broadcast my unlock
                        }
                        this.triggerAntiScamCooldown();
                    }

                    this.theirOffer.gold = newTheirGold;
                    this.theirOffer.items = newTheirItems;
                    this.theirLock = newTheirLock;

                    // Check Completion
                    if (this.myLock && this.theirLock && this.isInitiator) {
                        this.tradeListenerRef.update({ status: 'completed' });
                    }

                    this.renderUI();
                });
            },

            triggerAntiScamCooldown: function() {
                this.scamLockActive = true;
                const overlay = document.getElementById('antiScamOverlay');
                if (overlay) overlay.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                
                if (this.antiScamTimer) clearTimeout(this.antiScamTimer);
                
                // 3 Second Cooldown before you can accept a changed offer
                this.antiScamTimer = setTimeout(() => {
                    this.scamLockActive = false;
                    if (overlay) overlay.classList.add('hidden');
                    this.renderUI();
                }, 3000);
            },

            // --- D. INTERACTION LOGIC ---
            offerItem: function(uid) {
                if (this.isProcessing || this.myLock || this.scamLockActive) return;
                this.isProcessing = true;

                const actualIndex = this.localInv.findIndex(i => i._tradeUid === uid);
                if (actualIndex === -1) {
                    this.isProcessing = false; return;
                }
                
                let item = this.localInv[actualIndex];
                const isStackable = window.isStackableItem ? window.isStackableItem(item.type) : false;
                const existingOffer = isStackable ? this.myOffer.items.find(i => i.name === item.name) : null;
                
                if (existingOffer) {
                    existingOffer.quantity++;
                } else {
                    const offerClone = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(item) : JSON.parse(JSON.stringify(item));
                    offerClone.quantity = 1;
                    offerClone._tradeUid = `offer_${Date.now()}_${Math.random()}`; // Give it a new UID for the offer pool
                    this.myOffer.items.push(offerClone);
                }
                
                item.quantity--;
                if (item.quantity <= 0) this.localInv.splice(actualIndex, 1);
                
                this.pushUpdate();
                this.isProcessing = false;
            },

            revokeItem: function(uid) {
                if (this.isProcessing || this.myLock || this.scamLockActive) return;
                this.isProcessing = true;

                const actualIndex = this.myOffer.items.findIndex(i => i._tradeUid === uid);
                if (actualIndex === -1) {
                    this.isProcessing = false; return;
                }
                
                let item = this.myOffer.items[actualIndex];
                const isStackable = window.isStackableItem ? window.isStackableItem(item.type) : false;
                const existingInv = isStackable ? this.localInv.find(i => i.name === item.name) : null;
                
                if (existingInv) {
                    existingInv.quantity++;
                } else {
                    const invClone = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(item) : JSON.parse(JSON.stringify(item));
                    invClone.quantity = 1;
                    invClone._tradeUid = `inv_${Date.now()}_${Math.random()}`; 
                    this.localInv.push(invClone);
                }
                
                item.quantity--;
                if (item.quantity <= 0) this.myOffer.items.splice(actualIndex, 1);
                
                this.pushUpdate();
                this.isProcessing = false;
            },

            offerGold: function(amount) {
                if (this.isProcessing || this.myLock || this.scamLockActive) return;
                
                // Strict validation
                const safeAmt = Math.floor(Number(amount));
                if (isNaN(safeAmt) || safeAmt <= 0 || safeAmt > this.localGold) {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
                
                this.localGold -= safeAmt;
                this.myOffer.gold += safeAmt;
                this.pushUpdate();
            },

            revokeGold: function() {
                if (this.isProcessing || this.myLock || this.scamLockActive) return;
                if (this.myOffer.gold > 0) {
                    this.localGold += this.myOffer.gold;
                    this.myOffer.gold = 0;
                    this.pushUpdate();
                }
            },

            toggleLock: function() {
                if (this.isProcessing || this.scamLockActive) return;
                
                // Capacity Check
                if (!this.myLock) {
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                    let projectedSlots = this.localInv.length;
                    
                    this.theirOffer.items.forEach(tItem => {
                        const isStackable = window.isStackableItem ? window.isStackableItem(tItem.type) : false;
                        const existingLocal = isStackable ? this.localInv.find(i => i.name === tItem.name) : null;
                        if (!existingLocal) projectedSlots++;
                    });
                    
                    // 🚨 PRE-CHECK: If they don't have space, warn them, but STILL let them lock.
                    // The executeFinalSwap will handle the overflow via `safelyDropItem`.
                    if (projectedSlots > invCap) {
                        logMessage(`{yellow:Warning: You don't have enough space. Excess items will drop to the floor.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                    }
                }

                this.myLock = !this.myLock;
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                
                const lockKey = this.isInitiator ? 'lockA' : 'lockB';
                rtdb.ref(`trades/${this.activeTradeId}`).update({ [lockKey]: this.myLock });
                this.renderUI();
            },

            pushUpdate: function() {
                this.myLock = false; // Always unlock if you change your offer
                const offerKey = this.isInitiator ? 'offerA' : 'offerB';
                const lockKey = this.isInitiator ? 'lockA' : 'lockB';
                
                // Strip functions and UIDs before sending across network
                const sanitizedItems = this.myOffer.items.map(i => {
                    const clone = JSON.parse(JSON.stringify(i));
                    delete clone.effect; delete clone.onHit; delete clone._tradeUid;
                    return clone;
                });

                rtdb.ref(`trades/${this.activeTradeId}`).update({
                    [offerKey]: { gold: this.myOffer.gold, items: sanitizedItems },
                    [lockKey]: false,
                    status: 'active'
                });
                
                this.renderUI();
                if (typeof AudioSystem !== 'undefined') AudioSystem.playHover();
            },

            // --- E. FINALIZING ---
            executeFinalSwap: function() {
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
                gameState.screenShake = 10;

                // 1. Rebuild Inventory securely
                let finalInventory = [...this.localInv]; 
                
                // Add back equipped & quest items
                const safeOriginals = gameState.player.inventory.filter(i => i && (i.isEquipped || i.type === 'quest'));
                finalInventory = finalInventory.concat(safeOriginals);

                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                let droppedCount = 0;
                let summaryItemsGained = [];

                // 🚨 BULLETPROOF DROP FALLBACK
                const safelyDropItem = (itemDrop) => {
                    let placed = false;
                    const validFloor = gameState.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[gameState.currentCaveTheme] ? CAVE_THEMES[gameState.currentCaveTheme].floor : '.';
                    if (typeof chunkManager !== 'undefined') {
                        for (let r = 0; r <= 2 && !placed; r++) {
                            for (let dy = -r; dy <= r && !placed; dy++) {
                                for (let dx = -r; dx <= r && !placed; dx++) {
                                    const tx = gameState.player.x + dx;
                                    const ty = gameState.player.y + dy;
                                    let tileAt = chunkManager.getTile(tx, ty);
                                    if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx];
                                    if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx];

                                    if (tileAt === validFloor || tileAt === '.') {
                                        if (gameState.mapMode === 'overworld') chunkManager.setWorldTile(tx, ty, itemDrop.tile || '🎒', 24); 
                                        else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][ty][tx] = itemDrop.tile || '🎒';
                                        else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][ty][tx] = itemDrop.tile || '🎒';
                                        placed = true;
                                    }
                                }
                            }
                        }
                    }
                    gameState.mapDirty = true;
                };

                // Add THEIR items safely
                this.theirOffer.items.forEach(tItem => {
                    const isStackable = window.isStackableItem ? window.isStackableItem(tItem.type) : false;
                    const existing = isStackable ? finalInventory.find(i => i.name === tItem.name && !i.isEquipped) : null;
                    
                    if (existing) {
                        existing.quantity += tItem.quantity;
                        summaryItemsGained.push(`${tItem.name} (x${tItem.quantity})`);
                    } else {
                        const hydratedItem = typeof window.rehydrateItemArray === 'function' ? window.rehydrateItemArray([tItem])[0] : tItem;
                            
                        if (finalInventory.length < invCap) {
                            finalInventory.push(hydratedItem);
                            summaryItemsGained.push(`${hydratedItem.name}`);
                        } else {
                            // Inventory overflow! Safely drop on the floor!
                            safelyDropItem(hydratedItem);
                            droppedCount++;
                            summaryItemsGained.push(`${hydratedItem.name} [Dropped]`);
                        }
                    }
                });

                // 2. Adjust Gold
                gameState.player.coins = this.localGold + this.theirOffer.gold;
                if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(this.theirOffer.gold);

                // 3. Trade Receipt Logging
                let receipt = `{cyan:Trade with ${this.targetName} Complete!} `;
                let gainedArr = [];
                let lostArr = [];

                if (this.theirOffer.gold > 0) gainedArr.push(`{gold:${this.theirOffer.gold}g}`);
                if (summaryItemsGained.length > 0) gainedArr.push(`{green:${summaryItemsGained.join(', ')}}`);
                
                if (this.myOffer.gold > 0) lostArr.push(`{red:${this.myOffer.gold}g}`);
                if (this.myOffer.items.length > 0) {
                    lostArr.push(`{gray:${this.myOffer.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}}`);
                }

                receipt += `\n{blue:Received:} ${gainedArr.length > 0 ? gainedArr.join(', ') : 'Nothing'}`;
                receipt += `\n{gray:Gave:} ${lostArr.length > 0 ? lostArr.join(', ') : 'Nothing'}`;
                
                logMessage(receipt);
                if (droppedCount > 0) {
                    logMessage(`{red:Inventory was full. ${droppedCount} items dropped to the floor.}`);
                }

                // 4. Save & Close
                // Clean off the temporary UIDs before saving
                gameState.player.inventory = finalInventory.map(i => { delete i._tradeUid; return i; });

                if (typeof triggerDebouncedSave === 'function') {
                    triggerDebouncedSave({ coins: gameState.player.coins, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
                }

                if (this.isInitiator) {
                    // Cache the ID because closeTrade() will immediately nullify this.activeTradeId
                    const tradeIdToClean = this.activeTradeId; 
                    
                    // Give Player B a 5-second buffer to read the 'completed' state and save their items!
                    setTimeout(() => {
                        if (typeof rtdb !== 'undefined') {
                            rtdb.ref(`trades/${tradeIdToClean}`).remove().catch(e => console.error("Trade cleanup error:", e));
                        }
                    }, 5000); 
                }

                this.closeTrade(true);
            },

            closeTrade: function(success = false) {
                if (this.activeTradeId && !success && this.tradeListenerRef) {
                    rtdb.ref(`trades/${this.activeTradeId}`).update({ status: 'cancelled' });
                }
                if (this.tradeListenerRef) {
                    this.tradeListenerRef.off();
                    this.tradeListenerRef = null;
                }
                if (this.antiScamTimer) clearTimeout(this.antiScamTimer);
                
                document.getElementById('bazaarModal').classList.add('hidden');
                this.activeTradeId = null;
                this.scamLockActive = false;
                
                if (typeof renderInventory === 'function') renderInventory();
                if (typeof renderStats === 'function') renderStats();
            },

            // --- F. UI RENDERING ---
            renderUI: function() {
                const invList = document.getElementById('bazaarInvList');
                const myOfferList = document.getElementById('bazaarMyOfferList');
                const theirOfferList = document.getElementById('bazaarTheirOfferList');
                
                document.getElementById('bazaarMyGold').textContent = this.localGold;
                document.getElementById('bazaarMyOfferGold').textContent = this.myOffer.gold;
                document.getElementById('bazaarTheirOfferGold').textContent = this.theirOffer.gold;

                const statusEl = document.getElementById('bazaarStatus');
                if (this.myLock && this.theirLock) {
                    statusEl.textContent = "Finalizing...";
                    statusEl.className = "text-green-400 animate-pulse";
                } else if (this.myLock || this.theirLock) {
                    statusEl.textContent = "Locked (Waiting)";
                    statusEl.className = "text-yellow-400";
                } else {
                    statusEl.textContent = "Negotiating";
                    statusEl.className = "text-gray-400";
                }

                // Render Left (Local Inv)
                invList.innerHTML = '';
                this.localInv.forEach(item => {
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-gray-800 rounded border border-gray-700 flex justify-between items-center ${this.myLock || this.scamLockActive ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-blue-500 cursor-pointer'}`;
                    li.innerHTML = `<span class="text-sm font-bold text-gray-300">${item.tile || '🎒'} ${safeName} <span class="text-xs text-gray-500">x${item.quantity}</span></span>`;
                    
                    if (!this.myLock && !this.scamLockActive) li.onclick = () => this.offerItem(item._tradeUid);
                    invList.appendChild(li);
                });

                // Render Middle (My Offer)
                myOfferList.innerHTML = '';
                this.myOffer.items.forEach(item => {
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-green-900 bg-opacity-30 rounded border border-green-800 flex justify-between items-center ${this.myLock || this.scamLockActive ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-red-500 cursor-pointer'}`;
                    li.innerHTML = `<span class="text-sm font-bold text-green-400">${item.tile || '🎒'} ${safeName} <span class="text-xs text-gray-400">x${item.quantity}</span></span>`;
                    
                    if (!this.myLock && !this.scamLockActive) li.onclick = () => this.revokeItem(item._tradeUid);
                    myOfferList.appendChild(li);
                });

                // Render Right (Their Offer)
                theirOfferList.innerHTML = '';
                this.theirOffer.items.forEach(item => {
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-blue-900 bg-opacity-30 rounded border border-blue-800 flex justify-between items-center`;
                    li.innerHTML = `<span class="text-sm font-bold text-blue-400">${item.tile || '🎒'} ${safeName} <span class="text-xs text-gray-400">x${item.quantity}</span></span>`;
                    theirOfferList.appendChild(li);
                });

                // Lock Buttons
                const myLockBtn = document.getElementById('bazaarLockBtn');
                if (this.scamLockActive) {
                    myLockBtn.disabled = true;
                    myLockBtn.textContent = "Cooldown...";
                    myLockBtn.className = "mt-2 w-full bg-gray-700 text-gray-400 font-bold py-3 rounded-lg shadow-inner cursor-not-allowed flex-shrink-0 border border-gray-600";
                } else if (this.myLock) {
                    myLockBtn.disabled = false;
                    myLockBtn.textContent = "Unlock Offer";
                    myLockBtn.className = "mt-2 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg shadow transition-transform active:scale-95 flex-shrink-0 border-b-4 border-yellow-800 active:border-b-0 active:mt-1";
                } else {
                    myLockBtn.disabled = false;
                    myLockBtn.textContent = "Lock Offer";
                    myLockBtn.className = "mt-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow transition-transform active:scale-95 flex-shrink-0 border-b-4 border-green-800 active:border-b-0 active:mt-1";
                }

                const theirLockEl = document.getElementById('bazaarTheirLock');
                if (this.theirLock) {
                    theirLockEl.textContent = "LOCKED";
                    theirLockEl.className = "mt-2 text-center text-green-400 font-bold bg-green-900 bg-opacity-40 py-3 rounded-lg border border-green-700 shadow-inner flex-shrink-0 drop-shadow-md";
                } else {
                    theirLockEl.textContent = "Modifying...";
                    theirLockEl.className = "mt-2 text-center text-gray-500 font-bold bg-black bg-opacity-40 py-3 rounded-lg border border-gray-700 shadow-inner flex-shrink-0";
                }
            }
        };

        // ==========================================
        // 3. ATTACH LISTENERS & HOOKS
        // ==========================================

        document.getElementById('bazaarCancelBtn').addEventListener('click', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            TradeManager.closeTrade();
        });

        document.getElementById('bazaarLockBtn').addEventListener('click', () => {
            TradeManager.toggleLock();
        });

        document.getElementById('bazaarOfferGoldBtn').addEventListener('click', () => {
            const input = document.getElementById('bazaarGoldInput');
            const amt = parseInt(input.value);
            if (!isNaN(amt)) {
                TradeManager.offerGold(amt);
                input.value = '';
            }
        });

        document.getElementById('bazaarMyOfferGold').parentElement.addEventListener('click', () => {
            TradeManager.revokeGold();
        });

        // Hook into Firebase Inbox
        setTimeout(() => {
            if (typeof rtdb !== 'undefined' && typeof player_id !== 'undefined' && player_id) {
                rtdb.ref(`tradeRequests/${player_id}`).on('value', (snap) => {
                    const data = snap.val();
                    if (!data) return;

                    if (data.accepted) {
                        logMessage(`{green:${data.targetName} accepted your trade request!}`);
                        rtdb.ref(`tradeRequests/${player_id}`).remove();
                        TradeManager.joinTrade(data.accepted, true, data.targetName);
                    } 
                    else if (data.fromId && data.fromName) {
                        TradeManager.pendingRequest = data;
                        logMessage(`{gold:🔔 ${data.fromName} wants to trade! Type /trade accept to begin.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    }
                });
            }
        }, 3000); 

        // Bind Y Key explicitly
        if (typeof INSTANT_KEYS !== 'undefined') {
            INSTANT_KEYS.add('y'); INSTANT_KEYS.add('Y');
        }

        if (typeof window.handleInput === 'function') {
            const origHandleInput = window.handleInput;
            window.handleInput = function(key) {
                if (key.toLowerCase() === 'y' && typeof otherPlayers !== 'undefined' && gameState.mapMode === 'overworld') {
                    for (const pid in otherPlayers) {
                        const op = otherPlayers[pid];
                        if (op.x === gameState.player.x && op.y === gameState.player.y && op.mapMode === gameState.mapMode && op.currentRealm === gameState.currentRealm) {
                            const targetName = op.email ? op.email.split('@')[0] : "Player";
                            TradeManager.requestTrade(pid, targetName);
                            return; 
                        }
                    }
                }
                return origHandleInput.call(this, key);
            };
        }

        // Chat Hooks
        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const parts = raw.split(' ');
                const command = parts[0].toLowerCase();
                
                if (command === 'trade') {
                    if (parts[1] && parts[1].toLowerCase() === 'accept') {
                        TradeManager.acceptTrade();
                    } else if (parts[1]) {
                        const targetName = parts[1].toLowerCase();
                        let found = false;
                        for (const pid in otherPlayers) {
                            const op = otherPlayers[pid];
                            if (op.email && op.email.split('@')[0].toLowerCase() === targetName) {
                                TradeManager.requestTrade(pid, op.email.split('@')[0]);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            logMessage(`{gray:Could not find an online player named '${parts[1]}'.}`);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        }
                    } else {
                        logMessage("{gray:Usage: /trade [name] or /trade accept}");
                    }
                    return; 
                }
                originalHandleChat(message);
            };
        }
    }
});

// --- END OF FILE expansion-bazaar.js ---
