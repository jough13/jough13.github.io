// --- START OF FILE expansion-guilds.js ---

window.ExpansionManager.register({
    id: "guilds_and_strongholds",
    name: "Guilds & Strongholds (Social Expansion)",
    version: "1.2", // Upgraded version!
    
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

                    const currentTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(state.player.x, state.player.y) : null;
                    if (currentTile !== '🕍') {
                        logMessage("{red:You must be standing directly on a Dark Castle Ruin (🕍) to claim it.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }

                    logMessage(`{gold:You plant your banner in the ruins! This land now belongs to [${tag}]!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 30);
                    state.screenShake = 20;

                    // 🚨 ROBUSTNESS WIN: Permanent Subcollection Tracking
                    // Using a 10-year TTL ensures the guild stronghold persists on the map essentially forever.
                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(state.player.x, state.player.y, '🏰g', 87600);
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
            ],
            black_market: [
                { name: 'Guild Charter', price: 4000, stock: 1 } 
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
                        <h3 class="text-xl font-bold mb-3 border-b border-gray-600 pb-2 flex-shrink-0 text-gray-200 flex justify-between items-center">
                            <span>Your Bag</span>
                            <span id="guildInvCapacity" class="text-[10px] text-gray-400 font-normal bg-black bg-opacity-30 px-1 rounded border border-gray-700 shadow-inner"></span>
                        </h3>
                        <ul id="guildPlayerList" class="space-y-2 overflow-y-auto pr-2 flex-grow custom-scrollbar"></ul>
                    </div>
                    <!-- Guild Vault -->
                    <div class="flex flex-col h-full bg-black bg-opacity-30 rounded-xl border border-yellow-700 p-4 shadow-inner relative">
                        <h3 class="text-xl font-bold mb-3 border-b border-yellow-600 pb-2 flex-shrink-0 text-yellow-500 flex justify-between items-center">
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
            vaultData: {}, 
            vaultRef: null,
            isProcessing: false,
            _lastVaultCache: "", // Used to prevent DOM thrashing

            openVault: function(tag) {
                if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
                this.activeTag = tag;
                document.getElementById('vaultGuildTag').textContent = `[${tag}]`;
                document.getElementById('guildVaultModal').classList.remove('hidden');
                
                if (this.vaultRef) this.vaultRef.off();
                
                document.getElementById('vaultLoading').classList.remove('hidden');

                // Using specific key mapping avoids the "Array Splice Index Shift" multiplayer bug
                if (typeof rtdb !== 'undefined') {
                    this.vaultRef = rtdb.ref(`guilds/${tag}/vault`);
                    
                    this.vaultRef.on('value', (snap) => {
                        this.vaultData = snap.val() || {};
                        document.getElementById('vaultLoading').classList.add('hidden');
                        this.renderUI();
                        
                        const syncInd = document.getElementById('vaultSyncIndicator');
                        if (syncInd) {
                            syncInd.classList.remove('hidden');
                            setTimeout(() => syncInd.classList.add('hidden'), 1000);
                        }
                    });
                }
            },

            closeVault: function() {
                if (this.vaultRef) {
                    this.vaultRef.off();
                    this.vaultRef = null;
                }
                document.getElementById('guildVaultModal').classList.add('hidden');
                this.activeTag = null;
                this._lastVaultCache = "";
                if (typeof renderInventory === 'function') renderInventory();
            },

            deposit: async function(inventoryIndex, expectedName) {
                if (this.isProcessing) return;
                
                let actualIndex = inventoryIndex;
                let item = gameState.player.inventory[actualIndex];
                
                // Verify index matches the item to prevent UI desync shifting
                if (expectedName && (!item || item.name !== expectedName)) {
                    actualIndex = gameState.player.inventory.findIndex(i => i && i.name === expectedName && !i.isEquipped);
                    if (actualIndex === -1) return;
                    item = gameState.player.inventory[actualIndex];
                }

                if (!item || item.isEquipped || item.type === 'quest') {
                    logMessage("{red:You cannot deposit this item.}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
                
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
                    
                    // Remove from inventory BEFORE awaiting Firebase to prevent race conditions
                    gameState.player.inventory.splice(actualIndex, 1);
                    this.renderUI(); // Force local update
                    
                    // Push to the Guild Vault
                    if (typeof rtdb !== 'undefined') {
                        const newItemRef = this.vaultRef.push();
                        await newItemRef.set(itemClone);
                    }

                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory });
                    }
                } catch (e) {
                    console.error("Vault Deposit Error:", e);
                    // Rollback
                    gameState.player.inventory.push(item);
                    this.renderUI();
                } finally {
                    this.isProcessing = false;
                }
            },

            withdraw: async function(itemUuid) {
                if (this.isProcessing) return;
                this.isProcessing = true;

                try {
                    if (typeof rtdb === 'undefined') return;
                    const specificItemRef = rtdb.ref(`guilds/${this.activeTag}/vault/${itemUuid}`);
                    
                    // The secure Transaction!
                    let capturedItem = null; 

                    const txResult = await specificItemRef.transaction((currentData) => {
                        if (currentData === null) return undefined; // Already taken!
                        
                        capturedItem = currentData;
                        return null; // Delete it to claim it
                    });

                    // 👇 Check the capturedItem instead of the post-transaction snapshot
                    if (txResult.committed && capturedItem) {
                        let claimedItem = capturedItem; // Assign the captured data
                        
                        // Check capacity safely *after* we have successfully secured it from the server
                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                        
                        // Rehydrate logic functions dynamically
                        if (typeof window.rehydrateItemArray === 'function') {
                            claimedItem = window.rehydrateItemArray([claimedItem])[0];
                        } else {
                            if (typeof window.ITEM_DATA !== 'undefined') {
                                const tKey = claimedItem.templateId || Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === claimedItem.name);
                                const template = window.ITEM_DATA[tKey];
                                if (template) {
                                    claimedItem.effect = template.effect;
                                    claimedItem.onHit = template.onHit;
                                }
                            }
                        }
                        
                        // Did our inventory fill up while waiting for the server?
                        if (gameState.player.inventory.length >= invCap) {
                            logMessage(`{red:Your inventory filled up! The ${claimedItem.name} falls to the ground.}`);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                            
                            // 🚨 SAFELY SPIRAL DROP IT
                            let placed = false;
                            if (typeof chunkManager !== 'undefined') {
                                for (let r = 0; r <= 2 && !placed; r++) {
                                    for (let dy = -r; dy <= r && !placed; dy++) {
                                        for (let dx = -r; dx <= r && !placed; dx++) {
                                            const tx = gameState.player.x + dx;
                                            const ty = gameState.player.y + dy;
                                            const tileAt = chunkManager.getTile(tx, ty);
                                            if (['.', 'F', 'd', 'D', '❄️'].includes(tileAt)) {
                                                chunkManager.setWorldTile(tx, ty, claimedItem.tile || '🎒', 24);
                                                placed = true;
                                            }
                                        }
                                    }
                                }
                                if (!placed) chunkManager.setWorldTile(gameState.player.x, gameState.player.y, claimedItem.tile || '🎒', 24);
                                gameState.mapDirty = true;
                            }
                        } else {
                            gameState.player.inventory.push(claimedItem);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                        }
                        
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
                const invCapText = document.getElementById('guildInvCapacity');
                if (!playerList || !vaultList) return;

                // Capacity Update
                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                if (invCapText) invCapText.textContent = `(${gameState.player.inventory.length}/${invCap})`;

                // 🚨 PERFORMANCE WIN: String Diffing
                // We build the full string for the vault, and only apply it to the DOM if it actually changed!
                // This prevents the scrollbar from jumping to the top every time someone else deposits an item.
                let newVaultHtml = '';
                
                Object.entries(this.vaultData).forEach(([uuid, item]) => {
                    if (!item) return;
                    
                    let nameColor = 'text-gray-200';
                    if (item._rarity === 'rare') nameColor = 'text-purple-400 font-bold';
                    if (item._rarity === 'epic') nameColor = 'text-red-400 font-bold';
                    if (item._rarity === 'legendary') nameColor = 'text-yellow-400 font-bold';

                    newVaultHtml += `
                    <li class="p-2 bg-yellow-900 bg-opacity-20 rounded border border-yellow-800 flex justify-between items-center hover:border-yellow-500 cursor-pointer">
                        <span class="text-sm ${nameColor}">${item.tile || '🎒'} ${item.name} <span class="text-xs text-gray-500">x${item.quantity}</span></span>
                        <button data-withdraw="${uuid}" class="text-[10px] bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 uppercase font-bold border-b-2 border-blue-900 active:border-b-0 active:mt-0.5" style="transform: translateZ(0);">Take</button>
                    </li>`;
                });

                if (this._lastVaultCache !== newVaultHtml) {
                    vaultList.innerHTML = newVaultHtml;
                    this._lastVaultCache = newVaultHtml;
                }

                // Player list is local, so we just clear and rebuild it normally using Fragments
                playerList.innerHTML = '';
                const pFrag = document.createDocumentFragment();

                gameState.player.inventory.forEach((item, index) => {
                    if (!item) return;
                    const li = document.createElement('li');
                    li.className = `p-2 bg-gray-800 rounded border border-gray-700 flex justify-between items-center ${item.isEquipped ? 'opacity-50 grayscale' : 'hover:border-blue-500 cursor-pointer'}`;
                    li.innerHTML = `
                        <span class="text-sm font-bold text-gray-300">${item.tile || '🎒'} ${item.name} <span class="text-xs text-gray-500">x${item.quantity}</span></span>
                        ${!item.isEquipped ? `<button data-deposit="${index}" data-name="${item.name}" class="text-[10px] bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded shadow-sm transition-transform active:scale-95 uppercase font-bold border-b-2 border-green-900 active:border-b-0 active:mt-0.5" style="transform: translateZ(0);">Deposit</button>` : `<span class="text-[9px] font-bold text-yellow-500 bg-black bg-opacity-40 px-2 py-1 rounded uppercase tracking-widest border border-yellow-800 shadow-inner">Equipped</span>`}
                    `;
                    pFrag.appendChild(li);
                });
                playerList.appendChild(pFrag);
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
            if (depBtn) window.GuildManager.deposit(parseInt(depBtn.dataset.deposit, 10), depBtn.dataset.name);

            const withBtn = e.target.closest('button[data-withdraw]');
            if (withBtn) window.GuildManager.withdraw(withBtn.dataset.withdraw);
        });

        // ==========================================
        // 3. GUILD CHAT & COMMAND INJECTION
        // ==========================================
        
        let activeGuildChatListener = null;

        const subscribeToGuildChat = (tag) => {
            if (activeGuildChatListener && typeof rtdb !== 'undefined') {
                rtdb.ref(`guildChat/${gameState.player.guildTag}`).off('child_added', activeGuildChatListener);
            }
            if (!tag || typeof rtdb === 'undefined') return;

            activeGuildChatListener = rtdb.ref(`guildChat/${tag}`).limitToLast(50).on('child_added', (snap) => {
                const msg = snap.val();
                if (!msg) return;
                
                const safeName = typeof escapeHtml === 'function' ? escapeHtml(msg.sender) : msg.sender;
                const safeBody = typeof escapeHtml === 'function' ? escapeHtml(msg.msg) : msg.msg;
                
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    const messageDiv = document.createElement('div');
                    // Render into the global chat box with a green [GUILD] prefix
                    messageDiv.innerHTML = `<span class="text-green-400 font-bold">[${tag}]</span> <strong class="text-green-300">${safeName}:</strong> <span>${safeBody}</span>`;
                    chatMessages.prepend(messageDiv);
                    
                    while (chatMessages.children.length > 50) {
                        chatMessages.removeChild(chatMessages.lastChild);
                    }
                }
            });
        };

        setTimeout(() => {
            if (typeof gameState !== 'undefined' && gameState.player && gameState.player.guildTag) {
                subscribeToGuildChat(gameState.player.guildTag);
            }
        }, 3000);

        if (typeof window.handleChatCommand === 'function') {
            const originalHandleChat = window.handleChatCommand;
            
            window.handleChatCommand = async function(message) {
                const raw = message.substring(1); 
                const parts = raw.split(' ');
                const command = parts[0].toLowerCase();
                const args = parts.slice(1);
                
                if (command === 'g') {
                    const tag = gameState.player.guildTag;
                    if (!tag) {
                        logMessage("{red:You are not in a guild.}");
                        return;
                    }
                    if (args.length === 0) return;

                    if (typeof rtdb !== 'undefined') {
                        rtdb.ref(`guildChat/${tag}`).push({
                            sender: gameState.player.name || (auth.currentUser ? auth.currentUser.email.split('@')[0] : "Traveler"),
                            msg: args.join(' '),
                            timestamp: firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                    return; 
                }

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

                        if (typeof rtdb !== 'undefined') {
                            const guildSnap = await rtdb.ref(`guilds/${tag}`).once('value');
                            if (guildSnap.exists()) {
                                logMessage(`{red:The guild tag [${tag}] is already taken!}`);
                                return;
                            }

                            if (gameState.player.coins < 1000) {
                                logMessage("{red:Creating a guild requires 1000 Gold.}");
                                return;
                            }
                            gameState.player.coins -= 1000;

                            await rtdb.ref(`guilds/${tag}`).set({
                                owner: player_id || "Unknown",
                                created: firebase.database.ServerValue.TIMESTAMP,
                                vault: {}
                            });
                        }

                        gameState.player.guildTag = tag;
                        if (typeof playerRef !== 'undefined') playerRef.update({ guildTag: tag, coins: gameState.player.coins });
                        
                        logMessage(`{green:You have successfully founded the guild [${tag}]!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                        if (typeof renderStats === 'function') renderStats();
                        
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

                        if (typeof rtdb !== 'undefined') {
                            const guildSnap = await rtdb.ref(`guilds/${tag}`).once('value');
                            if (!guildSnap.exists()) {
                                logMessage(`{red:Guild [${tag}] does not exist.}`);
                                return;
                            }
                        }

                        gameState.player.guildTag = tag;
                        if (typeof playerRef !== 'undefined') playerRef.update({ guildTag: tag });
                        
                        logMessage(`{green:You have joined [${tag}]!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                        
                        if (typeof rtdb !== 'undefined') {
                            rtdb.ref(`guildChat/${tag}`).push({
                                sender: "SYSTEM",
                                msg: `{gold:${gameState.player.name} has joined the guild!}`,
                                timestamp: firebase.database.ServerValue.TIMESTAMP
                            });
                        }
                        
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
                        
                        if (typeof rtdb !== 'undefined') {
                            rtdb.ref(`guildChat/${tag}`).push({
                                sender: "SYSTEM",
                                msg: `{gray:${gameState.player.name} has left the guild.}`,
                                timestamp: firebase.database.ServerValue.TIMESTAMP
                            });
                        }

                        gameState.player.guildTag = null;
                        if (typeof playerRef !== 'undefined') playerRef.update({ guildTag: null });
                        
                        if (activeGuildChatListener && typeof rtdb !== 'undefined') {
                            rtdb.ref(`guildChat/${tag}`).off('child_added', activeGuildChatListener);
                        }
                        activeGuildChatListener = null;
                        return;
                    }

                    logMessage("{gray:Guild Commands: /guild create [TAG], /guild join [TAG], /guild leave}");
                    logMessage("{gray:Guild Chat: /g [Message]}");
                    return;
                }
                
                originalHandleChat(message);
            };
        }

        // ==========================================
        // 4. PLAYER TAG & COLOR SYNC
        // ==========================================
        if (typeof window.syncPlayerState === 'function') {
            const origSync = window.syncPlayerState;
            window.syncPlayerState = function() {
                origSync();
                if (typeof onlinePlayerRef !== 'undefined' && onlinePlayerRef && gameState.player.guildTag) {
                    onlinePlayerRef.update({ guildTag: gameState.player.guildTag }).catch(()=>{});
                }
            };
        }

        // Add guild tags to the TILE_COLOR_MAP natively so they show up beautifully on the minimap
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🏰g'] = [234, 179, 8, 255]; // Golden Yellow
        }
    }
});

// --- END OF FILE expansion-guilds.js ---
