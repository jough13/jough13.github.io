// --- START OF FILE expansion-bazaar.js ---

window.ExpansionManager.register({
    id: "the_bazaar",
    name: "The Bazaar (Multiplayer Trading)",
    version: "1.1", // Upgraded version!
    
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
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-blue-700 p-3 shadow-inner">
                        <h3 id="bazaarTheirName" class="text-lg font-bold mb-2 border-b border-blue-600 pb-1 text-blue-400">Their Offer (Gold: <span id="bazaarTheirOfferGold" class="text-yellow-400">0</span>)</h3>
                        <ul id="bazaarTheirOfferList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                        <div id="bazaarTheirLock" class="mt-2 text-center text-gray-500 font-bold bg-black bg-opacity-40 py-3 rounded-lg border border-gray-700 shadow-inner flex-shrink-0">Waiting for them...</div>
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
            isInitiator: false,
            role: null, // 'offerA' or 'offerB'
            
            // Local state to prevent touching the real inventory until the trade is completely finalized
            localInv: [], 
            localGold: 0,
            
            myOffer: { gold: 0, items: [] },
            theirOffer: { gold: 0, items: [] },
            myLock: false,
            theirLock: false,
            
            isProcessing: false, // Mutex lock
            tradeListenerRef: null,

            // --- A. STARTING A TRADE ---
            requestTrade: function(targetUid, targetName) {
                if (!targetUid || targetUid === player_id) return;
                logMessage(`{yellow:Sending trade request to ${targetName}...}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                
                // Write a request to their specific inbox
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

                // Setup the empty trade room in Firebase
                rtdb.ref(`trades/${tradeId}`).set({
                    status: 'active',
                    initiator: this.pendingRequest.fromId,
                    target: player_id,
                    offerA: { gold: 0, items: [] },
                    offerB: { gold: 0, items: [] },
                    lockA: false,
                    lockB: false
                });

                // Tell the initiator we accepted
                rtdb.ref(`tradeRequests/${this.pendingRequest.fromId}`).set({
                    accepted: tradeId,
                    targetName: gameState.player.name || auth.currentUser.email.split('@')[0]
                });

                this.joinTrade(tradeId, false, this.pendingRequest.fromName);
                this.pendingRequest = null;
                rtdb.ref(`tradeRequests/${player_id}`).remove(); // Clear inbox
            },

            // --- C. JOINING THE TRADE WINDOW ---
            joinTrade: function(tradeId, isInitiator, otherName) {
                if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
                
                this.activeTradeId = tradeId;
                this.isInitiator = isInitiator;
                this.role = isInitiator ? 'A' : 'B';
                
                // Deep clone the inventory so we don't accidentally mutate the real one
                this.localInv = typeof window.cloneItemSafely === 'function' ? window.fastClone(gameState.player.inventory) : JSON.parse(JSON.stringify(gameState.player.inventory));
                // Filter out equipped items and quest items!
                this.localInv = this.localInv.filter(i => i && !i.isEquipped && i.type !== 'quest');
                
                this.localGold = gameState.player.coins || 0;
                
                this.myOffer = { gold: 0, items: [] };
                this.theirOffer = { gold: 0, items: [] };
                this.myLock = false;
                this.theirLock = false;

                document.getElementById('bazaarTheirName').innerHTML = `${otherName}'s Offer (Gold: <span id="bazaarTheirOfferGold" class="text-yellow-400">0</span>)`;
                document.getElementById('bazaarModal').classList.remove('hidden');
                
                this.renderUI();

                // Listen for changes from the other player
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

                    // Sync their offer
                    const theirRole = this.isInitiator ? 'offerB' : 'offerA';
                    this.theirOffer.gold = data[theirRole]?.gold || 0;
                    this.theirOffer.items = data[theirRole]?.items || [];
                    
                    const theirLockKey = this.isInitiator ? 'lockB' : 'lockA';
                    this.theirLock = data[theirLockKey] || false;

                    // If we were locked but they changed their offer, Firebase rules usually require an unlock. 
                    // To be safe, if their lock is false, we should warn the user.
                    
                    // Check Completion
                    if (this.myLock && this.theirLock && this.isInitiator) {
                        // Both locked! Initiator seals the deal to prevent race conditions.
                        this.tradeListenerRef.update({ status: 'completed' });
                    }

                    this.renderUI();
                });
            },

            // --- D. INTERACTION LOGIC ---
            offerItem: function(index, expectedName) {
                if (this.isProcessing || this.myLock) return;
                this.isProcessing = true;

                let actualIndex = index;
                let item = this.localInv[actualIndex];
                
                // 🚨 BUG FIX: Verify index matches the item to prevent UI desync shifting
                if (expectedName && (!item || item.name !== expectedName)) {
                    actualIndex = this.localInv.findIndex(i => i && i.name === expectedName);
                    if (actualIndex === -1) {
                        this.isProcessing = false;
                        return;
                    }
                    item = this.localInv[actualIndex];
                }

                if (item) {
                    const isStackable = window.isStackableItem ? window.isStackableItem(item.type) : false;
                    const existingOffer = isStackable ? this.myOffer.items.find(i => i.name === item.name) : null;
                    
                    // Move 1 quantity at a time for simplicity, or use prompts for bulk. Let's do 1 for speed.
                    if (existingOffer) {
                        existingOffer.quantity++;
                    } else {
                        const offerClone = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(item) : JSON.parse(JSON.stringify(item));
                        offerClone.quantity = 1;
                        this.myOffer.items.push(offerClone);
                    }
                    
                    item.quantity--;
                    if (item.quantity <= 0) this.localInv.splice(actualIndex, 1);
                    
                    this.pushUpdate();
                }
                this.isProcessing = false;
            },

            revokeItem: function(index, expectedName) {
                if (this.isProcessing || this.myLock) return;
                this.isProcessing = true;

                let actualIndex = index;
                let item = this.myOffer.items[actualIndex];
                
                // 🚨 BUG FIX: Verify index matches the item to prevent UI desync shifting
                if (expectedName && (!item || item.name !== expectedName)) {
                    actualIndex = this.myOffer.items.findIndex(i => i && i.name === expectedName);
                    if (actualIndex === -1) {
                        this.isProcessing = false;
                        return;
                    }
                    item = this.myOffer.items[actualIndex];
                }

                if (item) {
                    const isStackable = window.isStackableItem ? window.isStackableItem(item.type) : false;
                    const existingInv = isStackable ? this.localInv.find(i => i.name === item.name) : null;
                    
                    if (existingInv) {
                        existingInv.quantity++;
                    } else {
                        const invClone = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(item) : JSON.parse(JSON.stringify(item));
                        invClone.quantity = 1;
                        this.localInv.push(invClone);
                    }
                    
                    item.quantity--;
                    if (item.quantity <= 0) this.myOffer.items.splice(actualIndex, 1);
                    
                    this.pushUpdate();
                }
                this.isProcessing = false;
            },

            offerGold: function(amount) {
                if (this.isProcessing || this.myLock) return;
                if (amount <= 0 || amount > this.localGold) {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
                
                this.localGold -= amount;
                this.myOffer.gold += amount;
                this.pushUpdate();
            },

            revokeGold: function() {
                if (this.isProcessing || this.myLock) return;
                if (this.myOffer.gold > 0) {
                    this.localGold += this.myOffer.gold;
                    this.myOffer.gold = 0;
                    this.pushUpdate();
                }
            },

            toggleLock: function() {
                if (this.isProcessing) return;
                
                // Capacity Check
                if (!this.myLock) {
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                    let projectedSlots = this.localInv.length;
                    
                    // Add their unstackable items to projection
                    this.theirOffer.items.forEach(tItem => {
                        const isStackable = window.isStackableItem ? window.isStackableItem(tItem.type) : false;
                        const existingLocal = isStackable ? this.localInv.find(i => i.name === tItem.name) : null;
                        if (!existingLocal) projectedSlots++;
                    });
                    
                    if (projectedSlots > invCap) {
                        logMessage("{red:You do not have enough inventory space to accept their offer!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
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
                
                // Strip functions before saving to RTDB
                const sanitizedItems = this.myOffer.items.map(i => {
                    const clone = JSON.parse(JSON.stringify(i));
                    delete clone.effect; delete clone.onHit;
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
                logMessage("{gold:Trade completed successfully!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
                gameState.screenShake = 10;

                // 1. Rebuild Inventory
                // Start with the local inventory (which had my offered items removed safely)
                let finalInventory = [...this.localInv]; 
                
                // Add back equipped items and quest items that were filtered out
                const safeOriginals = gameState.player.inventory.filter(i => i && (i.isEquipped || i.type === 'quest'));
                finalInventory = finalInventory.concat(safeOriginals);

                // Add THEIR items safely
                this.theirOffer.items.forEach(tItem => {
                    const isStackable = window.isStackableItem ? window.isStackableItem(tItem.type) : false;
                    const existing = isStackable ? finalInventory.find(i => i.name === tItem.name && !i.isEquipped) : null;
                    
                    if (existing) {
                        existing.quantity += tItem.quantity;
                    } else {
                        // 🚨 BUG FIX & ROBUSTNESS WIN: Re-hydrate logic functions!
                        // Since `theirOffer.items` came directly from the Firebase network payload, 
                        // all function references (`effect`, `onHit`) were destroyed by JSON.stringify.
                        // We must securely bind them back using the master ITEM_DATA dictionary!
                        let tKey = tItem.templateId;
                        if (!tKey && typeof window.ITEM_DATA !== 'undefined') {
                            tKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === tItem.name);
                        }
                        
                        const template = typeof window.ITEM_DATA !== 'undefined' && tKey ? window.ITEM_DATA[tKey] : null;
                        
                        if (template) {
                            tItem.effect = template.effect;
                            tItem.onHit = template.onHit;
                            tItem.procChance = template.procChance;
                            tItem.inflicts = template.inflicts;
                            tItem.inflictChance = template.inflictChance;
                            
                            // Safe tag array cloning
                            if (template.tags) {
                                tItem.tags = [...template.tags];
                            }
                        }
                        finalInventory.push(tItem);
                    }
                });

                // 2. Adjust Gold
                gameState.player.coins = this.localGold + this.theirOffer.gold;
                if (typeof window.trackLegitimateGold === 'function') window.trackLegitimateGold(this.theirOffer.gold);

                // 3. Save & Close
                gameState.player.inventory = finalInventory;
                if (typeof triggerDebouncedSave === 'function') {
                    triggerDebouncedSave({ coins: gameState.player.coins, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : finalInventory });
                }
                
                // Initiator cleans up the DB node to save space
                if (this.isInitiator) {
                    rtdb.ref(`trades/${this.activeTradeId}`).remove();
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
                
                document.getElementById('bazaarModal').classList.add('hidden');
                this.activeTradeId = null;
                
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
                this.localInv.forEach((item, index) => {
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-gray-800 rounded border border-gray-700 flex justify-between items-center ${this.myLock ? 'opacity-50 grayscale' : 'hover:border-blue-500 cursor-pointer'}`;
                    li.innerHTML = `<span class="text-sm font-bold text-gray-300">${item.tile || '🎒'} ${safeName} <span class="text-xs text-gray-500">x${item.quantity}</span></span>`;
                    
                    // 🚨 BUG FIX: Added `data-name` property for the click handler
                    if (!this.myLock) {
                        li.dataset.index = index;
                        li.dataset.name = item.name;
                        li.onclick = () => this.offerItem(index, item.name);
                    }
                    invList.appendChild(li);
                });

                // Render Middle (My Offer)
                myOfferList.innerHTML = '';
                this.myOffer.items.forEach((item, index) => {
                    const safeName = typeof escapeHtml === 'function' ? escapeHtml(item.name) : item.name;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-green-900 bg-opacity-30 rounded border border-green-800 flex justify-between items-center ${this.myLock ? 'opacity-50 grayscale' : 'hover:border-red-500 cursor-pointer'}`;
                    li.innerHTML = `<span class="text-sm font-bold text-green-400">${item.tile || '🎒'} ${safeName} <span class="text-xs text-gray-400">x${item.quantity}</span></span>`;
                    
                    // 🚨 BUG FIX: Added `data-name` property for the click handler
                    if (!this.myLock) {
                        li.dataset.index = index;
                        li.dataset.name = item.name;
                        li.onclick = () => this.revokeItem(index, item.name);
                    }
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
                if (this.myLock) {
                    myLockBtn.textContent = "Unlock Offer";
                    myLockBtn.className = "mt-2 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg shadow transition-transform active:scale-95 flex-shrink-0 border-b-4 border-yellow-800 active:border-b-0 active:mt-1";
                } else {
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

        // DOM Listeners
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

        // Click on My Offer Gold to revoke it
        document.getElementById('bazaarMyOfferGold').parentElement.addEventListener('click', () => {
            TradeManager.revokeGold();
        });

        // Hook into Firebase Inbox for incoming requests and accepted requests
        setTimeout(() => {
            if (typeof rtdb !== 'undefined' && typeof player_id !== 'undefined' && player_id) {
                rtdb.ref(`tradeRequests/${player_id}`).on('value', (snap) => {
                    const data = snap.val();
                    if (!data) return;

                    // I sent a request, and they accepted it!
                    if (data.accepted) {
                        logMessage(`{green:${data.targetName} accepted your trade request!}`);
                        rtdb.ref(`tradeRequests/${player_id}`).remove();
                        TradeManager.joinTrade(data.accepted, true, data.targetName);
                    } 
                    // Someone else sent ME a request!
                    else if (data.fromId && data.fromName) {
                        TradeManager.pendingRequest = data;
                        logMessage(`{gold:🔔 ${data.fromName} wants to trade! Type /trade accept to begin.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                    }
                });
            }
        }, 3000); // Give the engine a few seconds to boot up `player_id`

        // Add 'Y' to the engine's instant keys so it bypasses the movement queue!
        if (typeof INSTANT_KEYS !== 'undefined') {
            INSTANT_KEYS.add('y');
            INSTANT_KEYS.add('Y');
        }

        // Hook into the 'Y' key (Trade) to initiate trades if standing on someone!
        if (typeof window.handleInput === 'function') {
            const origHandleInput = window.handleInput;
            window.handleInput = function(key) {
                // Changed from 't' to 'y' to prevent double-binding clash with Syndicate's Target menu!
                if (key.toLowerCase() === 'y' && typeof otherPlayers !== 'undefined' && gameState.mapMode === 'overworld') {
                    for (const pid in otherPlayers) {
                        const op = otherPlayers[pid];
                        if (op.x === gameState.player.x && op.y === gameState.player.y && op.mapMode === gameState.mapMode && op.currentRealm === gameState.currentRealm) {
                            const targetName = op.email ? op.email.split('@')[0] : "Player";
                            TradeManager.requestTrade(pid, targetName);
                            return; // 🚨 Added return to prevent overlap
                        }
                    }
                }
                return origHandleInput.call(this, key);
            };
        }

        // Hook into chat commands for /trade [name] and /trade accept
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
                    return; // Intercepted successfully
                }
                originalHandleChat(message);
            };
        }
    }
});

// --- END OF FILE expansion-bazaar.js ---
