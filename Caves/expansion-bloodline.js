// --- START OF FILE expansion-bloodline.js ---

window.ExpansionManager.register({
    id: "the_bloodline",
    name: "The Bloodline (Prestige System)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🩸p': {
                name: 'Bloodline Pendant', type: 'accessory', tile: '🩸',
                description: "An heirloom of your past lives. It hums with accumulated souls.",
                _rarity: 'legendary', excludeFromLoot: true,
                // Stats are dynamically generated when granted during Prestige!
            },
            '📜t': {
                name: 'Title: The Undying', type: 'consumable', tile: '📜', _rarity: 'epic',
                description: "Equips the title 'The Undying' above your name and in chat.",
                effect: (state) => {
                    state.player.activeTitle = "The Undying";
                    logMessage("{gold:You are now known as The Undying!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof renderStats === 'function') renderStats();
                    return true;
                }
            },
            '📜a': {
                name: 'Title: Ascendant', type: 'consumable', tile: '📜', _rarity: 'legendary',
                description: "Equips the title 'Ascendant' above your name and in chat.",
                effect: (state) => {
                    state.player.activeTitle = "Ascendant";
                    logMessage("{gold:You are now known as Ascendant!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof renderStats === 'function') renderStats();
                    return true;
                }
            }
        },

        // --- 2. NEW TILES ---
        tiles: {
            '👑b': {
                type: 'anomaly', name: 'Ascendant Throne',
                flavor: "A throne of white marble and gold. Only the truly legendary may sit.",
                onInteract: (state, x, y) => {
                    if (typeof window.openPrestigeUI === 'function') window.openPrestigeUI();
                    return null;
                }
            }
        },

        // --- 3. ASCENDANT SHOP ---
        shops: {
            ascendant: [
                { name: 'Title: The Undying', price: 10000, stock: 1 },
                { name: 'Title: Ascendant', price: 50000, stock: 1 },
                { name: 'Golden Apple', price: 10000, stock: 5 },
                { name: 'Elixir of Power', price: 10000, stock: 5 }
            ]
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. INJECT THE PRESTIGE UI MODAL
        // ==========================================
        const prestigeModalHTML = `
        <div id="prestigeModal" class="modal-overlay hidden" role="dialog" aria-modal="true" style="z-index: 600;">
            <div class="modal-content themed-container p-8 rounded-2xl shadow-2xl border-4 border-yellow-400 max-w-lg w-full text-center bg-[var(--bg-container)] relative overflow-hidden">
                <!-- Divine glow background -->
                <div class="absolute inset-0 bg-yellow-900 opacity-20 pointer-events-none" style="background-image: radial-gradient(circle, #facc15 0%, transparent 70%);"></div>
                
                <h2 class="text-5xl font-bold mb-2 text-yellow-400 drop-shadow-md relative z-10" style="font-family: 'Uncial Antiqua', cursive;">The Bloodline</h2>
                <p class="text-gray-300 italic mb-6 relative z-10 font-serif">"Flesh decays, but the soul endures."</p>
                
                <div id="prestigeRequirements" class="bg-black bg-opacity-60 p-4 rounded-xl border border-yellow-800 mb-6 relative z-10 shadow-inner text-left">
                    <h3 class="text-yellow-500 font-bold mb-2 border-b border-yellow-900 pb-1">Requirements to Ascend:</h3>
                    <ul class="text-sm space-y-2">
                        <li id="reqLevel" class="text-gray-400">❌ Reach Level 50</li>
                        <li id="reqSpire" class="text-gray-400">❌ Conquer the Spire (Hold 1 Spire Token)</li>
                    </ul>
                </div>

                <div id="prestigeRewards" class="hidden bg-black bg-opacity-60 p-4 rounded-xl border border-green-800 mb-6 relative z-10 shadow-inner text-left">
                    <h3 class="text-green-400 font-bold mb-2 border-b border-green-900 pb-1">Ascension Rewards:</h3>
                    <ul class="text-sm space-y-1 text-green-200">
                        <li>✨ Enter Generation <span id="nextGenNum" class="font-bold text-yellow-400"></span></li>
                        <li>✨ Permanent +25% XP Multiplier</li>
                        <li>✨ Permanent +10 Base Health, Mana, Stamina, Psyche</li>
                        <li>✨ Awaken with the <strong class="text-fuchsia-400">Bloodline Pendant</strong></li>
                        <li>✨ The Radiant Aura (Multiplayer Cosmetic)</li>
                        <li class="text-red-400 font-bold mt-2 pt-2 border-t border-green-900">⚠️ WARNING: Your Level, Stats, Inventory, and Equipment will be wiped! (Stash & Gold are safe)</li>
                    </ul>
                </div>
                
                <div class="flex flex-col gap-3 relative z-10">
                    <button id="prestigeAscendBtn" class="hidden bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform active:scale-95 border-b-4 border-yellow-800 active:border-b-0 active:mt-1 uppercase tracking-widest text-lg">
                        Surrender Mortal Flesh
                    </button>
                    <button id="prestigeShopBtn" class="bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-fuchsia-900 active:border-b-0 active:mt-1">
                        Browse Ascendant Wares
                    </button>
                    <button id="prestigeCancelBtn" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-gray-900 active:border-b-0 active:mt-1">
                        Step Away
                    </button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', prestigeModalHTML);

        // ==========================================
        // 2. UI LOGIC & REBIRTH EXECUTION
        // ==========================================
        window.openPrestigeUI = function() {
            if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            const player = gameState.player;
            const hasSpireToken = player.inventory.some(i => i && i.name === 'Spire Token');
            const isLevel50 = player.level >= 50;

            const reqLevelEl = document.getElementById('reqLevel');
            const reqSpireEl = document.getElementById('reqSpire');
            const rewardsEl = document.getElementById('prestigeRewards');
            const ascendBtn = document.getElementById('prestigeAscendBtn');
            const shopBtn = document.getElementById('prestigeShopBtn');

            // Render Checks
            if (isLevel50) {
                reqLevelEl.innerHTML = `✅ Reach Level 50`;
                reqLevelEl.className = "text-green-400 font-bold";
            } else {
                reqLevelEl.innerHTML = `❌ Reach Level 50 (Current: ${player.level})`;
                reqLevelEl.className = "text-gray-400";
            }

            if (hasSpireToken) {
                reqSpireEl.innerHTML = `✅ Conquer the Spire (Hold 1 Spire Token)`;
                reqSpireEl.className = "text-green-400 font-bold";
            } else {
                reqSpireEl.innerHTML = `❌ Conquer the Spire (Hold 1 Spire Token)`;
                reqSpireEl.className = "text-gray-400";
            }

            // Lock or Unlock Ascension
            if (isLevel50 && hasSpireToken) {
                rewardsEl.classList.remove('hidden');
                ascendBtn.classList.remove('hidden');
                document.getElementById('nextGenNum').textContent = (player.generation || 0) + 1;
            } else {
                rewardsEl.classList.add('hidden');
                ascendBtn.classList.add('hidden');
            }

            // Lock or Unlock Shop
            if ((player.generation || 0) > 0) {
                shopBtn.classList.remove('hidden');
            } else {
                shopBtn.classList.add('hidden');
            }

            document.getElementById('prestigeModal').classList.remove('hidden');
        };

        // DOM Listeners
        document.getElementById('prestigeCancelBtn').addEventListener('click', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            document.getElementById('prestigeModal').classList.add('hidden');
        });

        document.getElementById('prestigeShopBtn').addEventListener('click', () => {
            document.getElementById('prestigeModal').classList.add('hidden');
            if (!gameState.shopStates) gameState.shopStates = {};
            const shopId = 'shop_ascendant';
            if (!gameState.shopStates[shopId]) {
                gameState.shopStates[shopId] = JSON.parse(JSON.stringify(window.ExpansionManager.expansions.includes('the_bloodline') ? window.ExpansionManager.expansions['the_bloodline'] : window.SHOP_INVENTORY)); 
                // We actually inject our custom shop here
                gameState.shopStates[shopId] = JSON.parse(JSON.stringify([
                    { name: 'Title: The Undying', price: 10000, stock: 1 },
                    { name: 'Title: Ascendant', price: 50000, stock: 1 },
                    { name: 'Golden Apple', price: 10000, stock: 5 },
                    { name: 'Elixir of Power', price: 10000, stock: 5 }
                ]));
            }
            window.activeShopInventory = gameState.shopStates[shopId];
            
            const shopTitle = document.getElementById('shopTitle');
            if (shopTitle) shopTitle.innerHTML = `Ascendant Wares <span class="block text-xs font-normal text-yellow-400 mt-1 italic tracking-normal font-serif">"Spoils for the eternal."</span>`;
            
            if (typeof renderShop === 'function') renderShop();
            document.getElementById('shopModal').classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        });

        // 🚨 THE REBIRTH EXECUTION 🚨
        document.getElementById('prestigeAscendBtn').addEventListener('click', async () => {
            const player = gameState.player;
            
            const confirmAscension = confirm("WARNING: This will wipe your Level, Stats, Inventory, and Equipment. Your Bank, Gold, Homestead, and Lore will remain. Are you absolutely sure you want to Ascend?");
            if (!confirmAscension) return;

            document.getElementById('prestigeModal').classList.add('hidden');
            
            logMessage("{yellow:You close your eyes as the physical world burns away. You are reborn.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();
            gameState.screenShake = 50;
            gameState.screenFlash = { color: '#facc15', alpha: 1.0, decay: 0.02 };

            // 1. Increment Generation
            player.generation = (player.generation || 0) + 1;

            // 2. Wipe Stats
            player.level = 1;
            player.xp = 0;
            player.xpToNextLevel = 100;
            player.statPoints = 0;
            player.talentPoints = 0;
            player.talents = [];
            player.spellbook = {};
            player.skillbook = {};
            player.bounty = 0;

            player.hotbar = [null, null, null, null, null];
            player.cooldowns = {}; // Clear lingering cooldowns too!

            const coreStats = ['strength', 'wits', 'constitution', 'dexterity', 'charisma', 'luck', 'willpower', 'perception', 'endurance', 'intuition'];
            coreStats.forEach(s => player[s] = 1);

            // 3. Keep Base Class background bonuses
            const bgData = typeof window.PLAYER_BACKGROUNDS !== 'undefined' ? window.PLAYER_BACKGROUNDS[player.background] : null;
            if (bgData && bgData.stats) {
                for (const stat in bgData.stats) {
                    player[stat] += bgData.stats[stat];
                }
            }
            
            // Revert evolution
            player.classEvolved = false;
            player.className = bgData ? bgData.name : 'Adventurer';

            // 4. Wipe Inventory & Equip Bloodline Pendant
            const genMult = player.generation * 2; // +2 All Stats per generation!
            
            const pendant = window.ITEM_DATA['🩸p'];
            const newPendant = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(pendant) : JSON.parse(JSON.stringify(pendant));
            
            newPendant.templateId = '🩸p';
            newPendant.quantity = 1;
            newPendant.isEquipped = true;
            newPendant.statBonuses = {
                strength: genMult, wits: genMult, constitution: genMult,
                dexterity: genMult, charisma: genMult, luck: genMult,
                willpower: genMult, perception: genMult, endurance: genMult, intuition: genMult
            };
            newPendant.description = `An heirloom of your past lives. {gold:+${genMult} to All Stats}.`;

            player.inventory = [newPendant];
            
            // Add fallback rags so they aren't naked
            player.inventory.push({ templateId: 'x', name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', isEquipped: true });

            player.equipment = {
                weapon: { name: 'Fists', damage: 0, tags: ['blunt'] },
                armor: player.inventory[1],
                offhand: null,
                accessory: newPendant,
                ammo: null
            };

            // 5. Apply Generation Base Vitals Boost
            player.bonusMaxHealth = player.generation * 10;
            player.bonusMaxMana = player.generation * 10;
            player.bonusMaxStamina = player.generation * 10;
            player.bonusMaxPsyche = player.generation * 10;

            if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
            
            player.health = player.maxHealth;
            player.mana = player.maxMana;
            player.stamina = player.maxStamina;
            player.psyche = player.maxPsyche;

            // 6. Announce to Server!
            if (typeof rtdb !== 'undefined') {
                rtdb.ref('chat').push().set({
                    senderId: 'SERVER',
                    email: 'SYSTEM',
                    message: `{gold:🌟 ${player.name} has transcended mortal flesh to become a Generation ${player.generation} Ascendant! 🌟}`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }

            // 7. Save and Render
            if (typeof syncPlayerState === 'function') syncPlayerState();
            if (typeof renderStats === 'function') renderStats();
            if (typeof renderEquipment === 'function') renderEquipment();
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof render === 'function') render();
            
            // Hard commit to DB
            if (typeof playerRef !== 'undefined') {
                await playerRef.set(typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(player) : player);
            }
        });

        // ==========================================
        // 3. OVERWORLD INJECTIONS
        // ==========================================

        // A. Place the Throne in the Safe Haven Village!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCastle) {
            const origGenerateCastle = chunkManager.generateCastle;
            chunkManager.generateCastle = function(castleId, layoutType) {
                const map = origGenerateCastle.call(this, castleId, layoutType);
                if (castleId.includes('village')) {
                    // Inject the Throne right in the middle of the village
                    if (map[4] && map[4][13] !== undefined) map[4][13] = '👑b'; 
                }
                return map;
            };
        }

        // B. Apply XP Multiplier
        if (typeof window.grantXp === 'function') {
            const origGrantXp = window.grantXp;
            window.grantXp = function(amount) {
                const gen = gameState.player.generation || 0;
                let finalAmount = amount;
                
                // +25% XP per Generation!
                if (gen > 0) {
                    finalAmount = Math.floor(amount * (1 + (gen * 0.25)));
                }
                
                origGrantXp(finalAmount);
            };
        }

        // C. MULTIPLAYER AURA (VISUAL JUICE)
        // We hook into the endPlayerTurn function to spawn a passive golden aura on the ground
        if (typeof window.endPlayerTurn === 'function') {
            const origEndPlayerTurn = window.endPlayerTurn;
            window.endPlayerTurn = function(updates = {}) {
                
                if ((gameState.player.generation || 0) > 0 && typeof ParticleSystem !== 'undefined') {
                    // 10% chance per turn to drop an ethereal golden sparkle
                    if (Math.random() < 0.10) {
                        ParticleSystem.spawn(gameState.player.x, gameState.player.y, '#facc15', 'sparkle', '', 3);
                    }
                }
                
                origEndPlayerTurn.call(this, updates);
            };
        }

        // D. CHAT & /WHO INJECTION
        if (typeof window.syncPlayerState === 'function') {
            const origSync = window.syncPlayerState;
            window.syncPlayerState = function() {
                origSync();
                // Ensure other players know your generation level!
                if (typeof onlinePlayerRef !== 'undefined' && onlinePlayerRef) {
                    onlinePlayerRef.update({ generation: gameState.player.generation || 0, activeTitle: gameState.player.activeTitle || null }).catch(()=>{});
                }
            };
        }

        if (typeof window.handleChatCommand === 'function') {
            const existingHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const command = raw.split(' ')[0].toLowerCase();
                
                if (command === 'who') {
                    const myGen = gameState.player.generation || 0;
                    const myTitle = gameState.player.activeTitle ? ` <${gameState.player.activeTitle}>` : '';
                    let onlineList = [`You${myGen > 0 ? ` {gold:[Gen ${myGen}]}` : ''}${myTitle}`];
                    
                    for (const id in otherPlayers) {
                        const p = otherPlayers[id];
                        const safeName = typeof escapeHtml === 'function' ? escapeHtml(p.email ? p.email.split('@')[0] : "Unknown") : "Unknown";
                        const genStr = (p.generation && p.generation > 0) ? ` {gold:[Gen ${p.generation}]}` : '';
                        const titleStr = p.activeTitle ? ` <${escapeHtml(p.activeTitle)}>` : '';
                        onlineList.push(`${safeName}${genStr}${titleStr}`);
                    }
                    logMessage(`Online Players (${onlineList.length}): ${onlineList.join(', ')}`);
                    return;
                }
                existingHandleChat(message);
            };
        }
    }
});

// --- END OF FILE expansion-bloodline.js ---
