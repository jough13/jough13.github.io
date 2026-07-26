// --- START OF FILE expansion-guilds.js ---

window.ExpansionManager.register({
    id: "guilds_and_strongholds",
    name: "Guilds & Strongholds (Social Expansion)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '📜g': {
                name: 'Guild Charter', type: 'consumable', tile: '📜',
                description: "Use while standing on a Dark Castle Ruin (🕍) to conquer it and build a Guild Stronghold.",
                _rarity: 'legendary',
                effect: (state) => {
                    const tag = state.player.guildTag;
                    if (!tag) {
                        logMessage("{red:You must be in a Guild to use this.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    if (state.mapMode !== 'overworld') {
                        logMessage("{red:You must use this in the Overworld.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }

                    const currentTile = chunkManager.getTile(state.player.x, state.player.y);
                    if (currentTile !== '🕍') {
                        logMessage("{red:You must be standing directly on a Dark Castle Ruin (🕍) to claim it.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }

                    logMessage(`{gold:You plant your banner in the ruins! This land now belongs to [${tag}]!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 30);
                    state.screenShake = 20;

                    // Convert the tile on the global map!
                    chunkManager.setWorldTile(state.player.x, state.player.y, '🏰g');
                    state.mapDirty = true;
                    if (typeof render === 'function') render();

                    // Announce to the server
                    if (typeof rtdb !== 'undefined') {
                        rtdb.ref('chat').push().set({
                            senderId: 'SERVER',
                            email: 'SYSTEM',
                            message: `{gold:🏰 The guild [${tag}] has conquered a Stronghold at (${state.player.x}, ${-state.player.y})!}`,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                    }

                    return true; // Consume the Charter
                }
            }
        },

        // --- 2. NEW TILES ---
        tiles: {
            '🏰g': {
                type: 'anomaly',
                name: 'Guild Stronghold',
                flavor: "A mighty fortress flying a player guild's banner.",
                onInteract: (state, x, y) => {
                    const tag = state.player.guildTag;
                    if (!tag) {
                        logMessage("{red:The guards block your path. \"Guild members only.\"}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return null;
                    }

                    logMessage(`{green:The guards salute you. Welcome to the Stronghold, member of [${tag}].}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    
                    // Open the Guild Vault UI!
                    if (typeof window.openGuildVault === 'function') window.openGuildVault(tag);
                    return null;
                }
            }
        },

        // --- 3. SHOPS ---
        shops: {
            castle: [
                { name: 'Guild Charter', price: 5000, stock: 1 } // Extremely expensive endgame goal
            ]
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. INJECT THE GUILD VAULT UI
        // ==========================================
        const guildVaultHTML = `
        <div id="guildVaultModal" class="modal-overlay hidden" role="dialog" aria-modal="true" style="z-index: 500;">
            <div class="modal-content themed-container p-6 rounded-2xl shadow-2xl border-2 border-yellow-500 max-w-4xl w-full h-[85vh] flex flex-col bg-[var(--bg-container)]">
                
                <div class="flex justify-between items-end mb-4 border-b-2 border-yellow-700 pb-3 flex-shrink-0">
                    <h2 class="text-4xl font-bold text-yellow-500 drop-shadow-md" style="font-family: 'Uncial Antiqua', cursive;">Guild Vault</h2>
                    <div class="text-sm font-bold bg-black bg-opacity-40 px-3 py-1 rounded-lg border border-yellow-800 shadow-inner text-yellow-300">
                        Guild: <span id="vaultGuildTag" class="text-white"></span>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden min-h-0">
                    <!-- Player Bag -->
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-gray-700 p-4 shadow-inner">
                        <h3 class="text-xl font-bold mb-3 border-b border-gray-600 pb-2 flex-shrink-0 text-gray-200">Your Bag</h3>
                        <ul id="guildPlayerList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                    </div>
                    <!-- Guild Vault -->
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-yellow-700 p-4 shadow-inner relative">
                        <h3 class="text-xl font-bold mb-3 border-b border-yellow-600 pb-2 flex-shrink-0 text-yellow-500 flex justify-between">
                            <span>Shared Vault</span>
                            <span id="vaultSyncIndicator" class="text-[10px] bg-green-900 text-green-400 px-2 py-1 rounded border border-green-700 hidden">Synced</span>
                        </h3>
                        <ul id="guildVaultList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                        <!-- Loading Overlay -->
                        <div id="vaultLoading" class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 rounded-xl hidden">
                            <span class="text-yellow-400 font-bold animate-pulse">Syncing with Leylines...</span>
                        </div>
                    </div>
                </div>
                
                <button type="button" id="closeGuildVaultBtn" class="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl w-full flex-shrink-0 shadow-md transition-transform active:scale-95 border-b-4 border-gray-900 active:border-b-0 active:mt-1">Leave Stronghold</button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', guildVaultHTML);

        // ==========================================
        // 2. GUILD VAULT LOGIC (MULTIPLAYER SAFE)
        // ==========================================
        window.GuildManager = {
            activeTag: null,
            vaultData: {}, // Local mirror of the Firebase object
            vaultRef: null,
            isProcessing: false,

            openVault: function(tag) {
                if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
                this.activeTag = tag;
                document.getElementById('vaultGuildTag').textContent = `[${tag}]`;
                document.getElementById('guildVaultModal').classList.remove('hidden');
                
                // Detach old listeners just in case
                if (this.vaultRef) this.vaultRef.off();
                
                document.getElementById('vaultLoading').classList.remove('hidden');

                // 🚨 ARCHITECTURE WIN: Dictionary-based Inventory
                // We store vault items as an Object { "uuid": {itemData} } rather than an Array.
                // This prevents the "Index Shifting" bug where Player A withdraws item 0, 
                // pushing item 1 to index 0, causing Player B to withdraw the wrong item!
                this.vaultRef = rtdb.ref(`guilds/${tag}/vault`);
                
                this.vaultRef.on('value', (snap) => {
                    this.vaultData = snap.val() || {};
                    document.getElementById('vaultLoading').classList.add('hidden');
                    this.renderUI();
                    
                    // Flash sync indicator
                    const syncInd = document.getElementById('vaultSyncIndicator');
                    syncInd.classList.remove('hidden');
                    setTimeout(() => syncInd.classList.add('hidden'), 1000);
                });
            },

            closeVault: function() {
                if (this.vaultRef) {
                    this.vaultRef.off();
                    this.vaultRef = null;
                }
                document.getElementById('guildVaultModal').classList.add('hidden');
                this.activeTag = null;
                if (typeof renderInventory === 'function') renderInventory();
            },

            deposit: async function(inventoryIndex) {
                if (this.isProcessing) return;
                
                const item = gameState.player.inventory[inventoryIndex];
                if (!item || item.isEquipped || item.type === 'quest') {
                    logMessage("{red:You cannot deposit this item.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
                
                // Hardcap vault size to prevent Firebase crashing
                if (Object.keys(this.vaultData).length >= 100) {
                    logMessage("{red:The Guild Vault is completely full! (Max 100 items)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }

                this.isProcessing = true;
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();

                try {
                    // Safe Clone
                    const itemClone = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(item) : JSON.parse(JSON.stringify(item));
                    
                    // Generate a unique push ID for this item
                    const newItemRef = this.vaultRef.push();
                    await newItemRef.set(itemClone);

                    // Remove from player
                    gameState.player.inventory.splice(inventoryIndex, 1);
                    
                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
                    }
                } catch (e) {
                    console.error("Vault Deposit Error:", e);
                } finally {
                    this.isProcessing = false;
                }
            },

            withdraw: async function(itemUuid) {
                if (this.isProcessing) return;
                
                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                if (gameState.player.inventory.length >= invCap) {
                    logMessage("{red:Your inventory is full!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }

                this.isProcessing = true;

                try {
                    const specificItemRef = rtdb.ref(`guilds/${this.activeTag}/vault/${itemUuid}`);
                    
                    // Transaction ensures two people don't withdraw the exact same item simultaneously
                    const txResult = await specificItemRef.transaction((currentData) => {
                        if (currentData === null) return undefined; // Already gone!
                        return null; // Delete it to claim it
                    });

                    if (txResult.committed && txResult.snapshot.val()) {
                        const claimedItem = txResult.snapshot.val();
                        
                        // Rehydrate logic functions
                        if (typeof window.ITEM_DATA !== 'undefined') {
                            const tKey = claimedItem.templateId || Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === claimedItem.name);
                            const template = window.ITEM_DATA[tKey];
                            if (template) {
                                claimedItem.effect = template.effect;
                                claimedItem.onHit = template.onHit;
                            }
                        }
                        
                        gameState.player.inventory.push(claimedItem);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                        
                        if (typeof triggerDebouncedSave === 'function') {
                            triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
                        }
                    } else {
                        logMessage("{gray:Someone else grabbed that item first!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    }
                } catch (e) {
                    console.error("Vault Withdraw Error:", e);
                } finally {
                    this.isProcessing = false;
                }
            },

            renderUI: function() {
                const playerList = document.getElementById('guildPlayerList');
                const vaultList = document.getElementById('guildVaultList');
                
                playerList.innerHTML = '';
                vaultList.innerHTML = '';

                // Player Inventory
                gameState.player.inventory.forEach((item, index) => {
                    if (!item) return;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-gray-800 rounded border border-gray-700 flex justify-between items-center ${item.isEquipped ? 'opacity-50 grayscale' : 'hover:border-blue-500 cursor-pointer'}`;
                    li.innerHTML = `
                        <span class="text-sm font-bold text-gray-300">${item.tile || '🎒'} ${item.name} <span class="text-xs text-gray-500">x${item.quantity}</span></span>
                        ${!item.isEquipped ? `<button data-deposit="${index}" class="text-[10px] bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 uppercase font-bold border-b-2 border-green-900 active:border-b-0 active:mt-0.5">Deposit</button>` : `<span class="text-[9px] font-bold text-yellow-500 bg-black bg-opacity-40 px-2 py-1 rounded uppercase tracking-widest border border-yellow-800 shadow-inner">Equipped</span>`}
                    `;
                    playerList.appendChild(li);
                });

                // Vault Inventory (Iterating over the dictionary!)
                Object.entries(this.vaultData).forEach(([uuid, item]) => {
                    if (!item) return;
                    
                    let nameColor = 'text-gray-200';
                    if (item._rarity === 'rare') nameColor = 'text-purple-400 font-bold';
                    if (item._rarity === 'epic') nameColor = 'text-red-400 font-bold';
                    if (item._rarity === 'legendary') nameColor = 'text-yellow-400 font-bold';

                    const li = document.createElement('li');
                    li.className = `p-2 bg-yellow-900 bg-opacity-20 rounded border border-yellow-800 flex justify-between items-center hover:border-yellow-500 cursor-pointer`;
                    li.innerHTML = `
                        <span class="text-sm ${nameColor}">${item.tile || '🎒'} ${item.name} <span class="text-xs text-gray-500">x${item.quantity}</span></span>
                        <button data-withdraw="${uuid}" class="text-[10px] bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 uppercase font-bold border-b-2 border-blue-900 active:border-b-0 active:mt-0.5">Take</button>
                    `;
                    vaultList.appendChild(li);
                });
            }
        };

        // Attach Global Accessor
        window.openGuildVault = (tag) => window.GuildManager.openVault(tag);

        // Bind DOM Events
        document.getElementById('closeGuildVaultBtn').addEventListener('click', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            window.GuildManager.closeVault();
        });

        document.getElementById('guildVaultModal').addEventListener('click', (e) => {
            const depBtn = e.target.closest('button[data-deposit]');
            if (depBtn) window.GuildManager.deposit(parseInt(depBtn.dataset.deposit));

            const withBtn = e.target.closest('button[data-withdraw]');
            if (withBtn) window.GuildManager.withdraw(withBtn.dataset.withdraw);
        });


        // ==========================================
        // 3. GUILD CHAT & COMMAND INJECTION
        // ==========================================
        
        let activeGuildChatListener = null;

        // Subscribe to Guild Chat if the player is in a guild on load
        const subscribeToGuildChat = (tag) => {
            if (activeGuildChatListener) rtdb.ref(`guildChat/${gameState.player.guildTag}`).off('child_added', activeGuildChatListener);
            if (!tag) return;

            activeGuildChatListener = rtdb.ref(`guildChat/${tag}`).limitToLast(50).on('child_added', (snap) => {
                const msg = snap.val();
                if (!msg) return;
                
                // Format and push to the combat log or chat box!
                const safeName = typeof escapeHtml === 'function' ? escapeHtml(msg.sender) : msg.sender;
                const safeBody = typeof escapeHtml === 'function' ? escapeHtml(msg.msg) : msg.msg;
                
                // Render into the global chat box with a green [GUILD] prefix
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    const messageDiv = document.createElement('div');
                    messageDiv.innerHTML = `<span class="text-green-400 font-bold">[${tag}]</span> <strong class="text-green-300">${safeName}:</strong> <span>${safeBody}</span>`;
                    chatMessages.prepend(messageDiv);
                    
                    // Cull old messages
                    while (chatMessages.children.length > 50) {
                        chatMessages.removeChild(chatMessages.lastChild);
                    }
                }
            });
        };

        // Delay checking the player state to ensure Firebase has fully hydrated `gameState.player`
        setTimeout(() => {
            if (gameState.player && gameState.player.guildTag) {
                subscribeToGuildChat(gameState.player.guildTag);
            }
        }, 3000);

        // Monkey-Patch Chat Commands
        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            
            window.handleChatCommand = async function(message) {
                const raw = message.substring(1); 
                const parts = raw.split(' ');
                const command = parts[0].toLowerCase();
                const args = parts.slice(1);
                
                // --- GUILD CHAT (/g) ---
                if (command === 'g') {
                    const tag = gameState.player.guildTag;
                    if (!tag) {
                        logMessage("{red:You are not in a guild.}");
                        return;
                    }
                    if (args.length === 0) return;

                    rtdb.ref(`guildChat/${tag}`).push({
                        sender: gameState.player.name || auth.currentUser.email.split('@')[0],
                        msg: args.join(' '),
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });
                    return; // Handled
                }

                // --- GUILD MANAGEMENT (/guild) ---
                if (command === 'guild') {
                    const subCommand = args[0] ? args[0].toLowerCase() : null;

                    if (subCommand === 'create') {
                        if (gameState.player.guildTag) {
                            logMessage("{red:You are already in a guild! Type /guild leave first.}");
                            return;
                        }
                        
                        const tag = args[1] ? args[1].toUpperCase() : null;
                        if (!tag || tag.length < 2 || tag.length > 4) {
                            logMessage("{gray:Usage: /guild create [TAG] (Tag must be 2-4 letters)}");
                            return;
                        }

                        // Check if tag exists
                        const guildSnap = await rtdb.ref(`guilds/${tag}`).once('value');
                        if (guildSnap.exists()) {
                            logMessage(`{red:The guild tag [${tag}] is already taken!}`);
                            return;
                        }

                        // Deduct Gold
                        if (gameState.player.coins < 1000) {
                            logMessage("{red:Creating a guild requires 1000 Gold.}");
                            return;
                        }
                        gameState.player.coins -= 1000;

                        // Create Guild in RTDB
                        await rtdb.ref(`guilds/${tag}`).set({
                            owner: player_id,
                            created: firebase.database.ServerValue.TIMESTAMP,
                            vault: {}
                        });

                        // Assign to Player
                        gameState.player.guildTag = tag;
                        if (typeof playerRef !== 'undefined') playerRef.update({ guildTag: tag, coins: gameState.player.coins });
                        
                        logMessage(`{green:You have successfully founded the guild [${tag}]!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                        
                        subscribeToGuildChat(tag);
                        return;
                    }

                    if (subCommand === 'join') {
                        if (gameState.player.guildTag) {
                            logMessage("{red:You are already in a guild!}");
                            return;
                        }
                        
                        const tag = args[1] ? args[1].toUpperCase() : null;
                        if (!tag) {
                            logMessage("{gray:Usage: /guild join [TAG]}");
                            return;
                        }

                        // Verify it exists
                        const guildSnap = await rtdb.ref(`guilds/${tag}`).once('value');
                        if (!guildSnap.exists()) {
                            logMessage(`{red:Guild [${tag}] does not exist.}`);
                            return;
                        }

                        gameState.player.guildTag = tag;
                        if (typeof playerRef !== 'undefined') playerRef.update({ guildTag: tag });
                        
                        logMessage(`{green:You have joined [${tag}]!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                        
                        // Announce
                        rtdb.ref(`guildChat/${tag}`).push({
                            sender: "SYSTEM",
                            msg: `{gold:${gameState.player.name} has joined the guild!}`,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                        
                        subscribeToGuildChat(tag);
                        return;
                    }

                    if (subCommand === 'leave') {
                        const tag = gameState.player.guildTag;
                        if (!tag) {
                            logMessage("{gray:You are not in a guild.}");
                            return;
                        }

                        logMessage(`{red:You have left [${tag}].}`);
                        rtdb.ref(`guildChat/${tag}`).push({
                            sender: "SYSTEM",
                            msg: `{gray:${gameState.player.name} has left the guild.}`,
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });

                        gameState.player.guildTag = null;
                        if (typeof playerRef !== 'undefined') playerRef.update({ guildTag: null });
                        
                        if (activeGuildChatListener) rtdb.ref(`guildChat/${tag}`).off('child_added', activeGuildChatListener);
                        activeGuildChatListener = null;
                        return;
                    }

                    logMessage("{gray:Guild Commands: /guild create [TAG], /guild join [TAG], /guild leave}");
                    logMessage("{gray:Guild Chat: /g [Message]}");
                    return;
                }
                
                // If not caught, pass to original
                originalHandleChat(message);
            };
        }

        // ==========================================
        // 4. OVERHEAD UI INJECTION (PLAYER TAGS)
        // ==========================================
        // Monkey-patch the syncPlayerState function to upload the Guild Tag to the online registry
        if (typeof window.syncPlayerState === 'function') {
            const origSync = window.syncPlayerState;
            window.syncPlayerState = function() {
                origSync();
                if (typeof onlinePlayerRef !== 'undefined' && onlinePlayerRef && gameState.player.guildTag) {
                    onlinePlayerRef.update({ guildTag: gameState.player.guildTag }).catch(()=>{});
                }
            };
        }

        // Note: Full overhead text rendering requires modifying the deep renderer loop, 
        // but since we added /who earlier, we can monkey-patch /who to display tags!
        if (typeof window.handleChatCommand === 'function') {
            const existingHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const command = raw.split(' ')[0].toLowerCase();
                
                existingHandleChat(message);
            };
        }
    }
});

// --- END OF FILE expansion-guilds.js ---
