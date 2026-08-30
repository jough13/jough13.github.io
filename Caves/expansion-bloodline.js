// --- START OF FILE expansion-bloodline.js ---

window.ExpansionManager.register({
    id: "the_bloodline",
    name: "The Bloodline (Prestige System)",
    version: "1.6", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🩸p': {
                name: 'Bloodline Pendant', type: 'accessory', tile: '🩸',
                description: "An heirloom of your past lives. It hums with accumulated souls.",
                _rarity: 'legendary', excludeFromLoot: true
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
            },
            '📜gs': {
                name: 'Title: God-Slayer', type: 'consumable', tile: '📜', _rarity: 'legendary',
                description: "Equips the title 'God-Slayer' above your name and in chat.",
                effect: (state) => {
                    state.player.activeTitle = "God-Slayer";
                    logMessage("{red:You are now known as God-Slayer!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof renderStats === 'function') renderStats();
                    return true;
                }
            },
            '📜rw': {
                name: 'Title: Realmwalker', type: 'consumable', tile: '📜', _rarity: 'epic',
                description: "Equips the title 'Realmwalker' above your name and in chat.",
                effect: (state) => {
                    state.player.activeTitle = "Realmwalker";
                    logMessage("{purple:You are now known as Realmwalker!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof renderStats === 'function') renderStats();
                    return true;
                }
            },
            '⌛': {
                name: 'Ascendant\'s Hourglass', type: 'consumable', tile: '⌛', _rarity: 'legendary', excludeFromLoot: true,
                description: "Crush the glass to fold space and instantly teleport to the Infinite Spire.",
                effect: (state) => {
                    if (state.mapMode !== 'overworld' || (state.currentRealm && state.currentRealm !== 0)) {
                        logMessage("{red:The Hourglass only functions under the open sky of the Prime Realm.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    
                    logMessage("{gold:You crush the Hourglass. The sands of time whip around you!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();
                    
                    state.screenShake = 30;
                    state.screenFlash = { color: '#facc15', alpha: 0.8, decay: 0.02 };
                    
                    // Spire is always far out in the desert, roughly 2000-3000 coords out. Let's spawn an instance!
                    const tx = 2500;
                    const ty = 2500;
                    
                    // Drop the Spire tile at the destination to ensure it's there
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.setWorldTile(tx, ty, '🗼', 24); // 24h TTL just to be safe
                    }
                    
                    state.player.x = tx;
                    state.player.y = -ty; // Safe negative mapping
                    
                    // 🚨 CRITICAL BUG FIX WIN: Force chunk generation and Firebase sync!
                    // Without this, players teleported into a completely black void because 
                    // chunkManager hadn't fetched the new region!
                    if (typeof finalizeMapTransition === 'function') finalizeMapTransition();
                    
                    state.mapDirty = true;
                    if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
                    if (typeof render === 'function') render();
                    
                    return true; // Consume the hourglass
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
                { name: 'Title: Realmwalker', price: 15000, stock: 1 },
                { name: 'Title: Ascendant', price: 50000, stock: 1 },
                { name: 'Title: God-Slayer', price: 75000, stock: 1 },
                { name: 'Ascendant\'s Hourglass', price: 5000, stock: 5 },
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
        
        // 🚨 PERFORMANCE & MEMORY LEAK WIN: Prevent duplicate DOM injection on hot-reloads
        if (!document.getElementById('prestigeModal')) {
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
                            <li>✨ Passive Ascendant Regeneration (Scales with Generation)</li>
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
        }

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
        const bindButtonSafely = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn) {
                // Remove old listeners on hot-reload by cloning the button
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', handler);
            }
        };

        bindButtonSafely('prestigeCancelBtn', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            document.getElementById('prestigeModal').classList.add('hidden');
        });

        bindButtonSafely('prestigeShopBtn', () => {
            document.getElementById('prestigeModal').classList.add('hidden');
            
            if (!gameState.shopStates) gameState.shopStates = {};
            const shopId = 'shop_ascendant';
            
            if (!gameState.shopStates[shopId]) {
                // 🚨 ROBUSTNESS: Safe fallback if ASCENDANT_INVENTORY wasn't populated yet
                const shopTemplate = typeof window.ASCENDANT_INVENTORY !== 'undefined' ? window.ASCENDANT_INVENTORY : [];
                gameState.shopStates[shopId] = JSON.parse(JSON.stringify(shopTemplate)); 
            }
            
            window.activeShopInventory = gameState.shopStates[shopId];
            
            const shopTitle = document.getElementById('shopTitle');
            if (shopTitle) shopTitle.innerHTML = `Ascendant Wares <span class="block text-xs font-normal text-yellow-400 mt-1 italic tracking-normal font-serif">"Spoils for the eternal."</span>`;
            
            if (typeof renderShop === 'function') renderShop();
            const shopModal = document.getElementById('shopModal');
            if (shopModal) shopModal.classList.remove('hidden');
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        });

        // 🚨 THE REBIRTH EXECUTION 🚨
        bindButtonSafely('prestigeAscendBtn', async () => {
            const player = gameState.player;
            
            const confirmAscension = window.confirm("WARNING: This will wipe your Level, Stats, Inventory, and Equipment. Your Bank, Gold, Homestead, and Lore will remain. Are you absolutely sure you want to Ascend?");
            if (!confirmAscension) return;

            document.getElementById('prestigeModal').classList.add('hidden');
            
            // --- JUICE WIN: Cinematic Ascension ---
            logMessage("{yellow:The physical world begins to burn away...}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            if (typeof ParticleSystem !== 'undefined') {
                for(let i=0; i<40; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 6 + Math.random() * 4;
                    ParticleSystem.spawn(player.x + Math.cos(angle)*dist, player.y + Math.sin(angle)*dist, '#facc15', 'sparkle');
                    const p = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length-1];
                    if (p) { p.vx = -Math.cos(angle)*0.15; p.vy = -Math.sin(angle)*0.15; p.lifeFade = 0.015; }
                }
            }
            
            gameState.screenShake = 5;

            // Wait for the implosion to finish before detonating reality
            await new Promise(resolve => setTimeout(resolve, 1500));

            logMessage("{gold:YOU ARE REBORN.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();
            gameState.screenShake = 50;
            gameState.screenFlash = { color: '#facc15', alpha: 1.0, decay: 0.015 };

            // 1. Increment Generation & Handle Titles
            player.generation = (player.generation || 0) + 1;
            
            if (!player.titles) player.titles = [];
            if (player.generation === 2 && !player.titles.includes("The Reborn")) {
                player.titles.push("The Reborn");
                logMessage("{cyan:You have unlocked the title <The Reborn>!}");
            }
            if (player.generation === 5 && !player.titles.includes("The Eternal")) {
                player.titles.push("The Eternal");
                logMessage("{purple:You have unlocked the title <The Eternal>!}");
            }
            if (player.generation === 10 && !player.titles.includes("The Demi-God")) {
                player.titles.push("The Demi-God");
                logMessage("{gold:You have unlocked the mythic title <The Demi-God>!}");
            }

            // 2. Wipe Stats (And explicitly clear the hotbar to prevent Ghost Spells!)
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
            player.cooldowns = {};

            const coreStats = ['strength', 'wits', 'constitution', 'dexterity', 'charisma', 'luck', 'willpower', 'perception', 'endurance', 'intuition'];
            coreStats.forEach(s => player[s] = 1);

            // 3. Keep Base Class background bonuses
            const bgData = typeof window.PLAYER_BACKGROUNDS !== 'undefined' ? window.PLAYER_BACKGROUNDS[player.background] : null;
            if (bgData && bgData.stats) {
                for (const stat in bgData.stats) {
                    player[stat] += bgData.stats[stat];
                }
            }
            
            player.classEvolved = false;
            player.className = bgData ? bgData.name : 'Adventurer';

            // 4. Wipe Inventory & Equip Bloodline Pendant
            const genMult = player.generation * 2; 
            
            if (player.bank && Array.isArray(player.bank)) {
                player.bank = player.bank.filter(item => item && item.templateId !== '🩸p' && item.name !== 'Bloodline Pendant');
            }
            
            const pendant = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA['🩸p'] : null;
            let newPendant = null;
            
            if (pendant) {
                newPendant = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(pendant) : JSON.parse(JSON.stringify(pendant));
                newPendant.templateId = '🩸p';
                newPendant.quantity = 1;
                newPendant.isEquipped = true;
                newPendant.statBonuses = {
                    strength: genMult, wits: genMult, constitution: genMult,
                    dexterity: genMult, charisma: genMult, luck: genMult,
                    willpower: genMult, perception: genMult, endurance: genMult, intuition: genMult
                };
                newPendant.description = `An heirloom of your past lives. {gold:+${genMult} to All Stats}.`;
            }

            const rags = { templateId: 'x', name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', isEquipped: true };
            
            // 🚨 BUG FIX & ROBUSTNESS WIN: Safely preserve Spire Tokens without leaking prototype references
            const tokenStack = player.inventory.find(i => i && i.name === 'Spire Token');
            let preservedTokens = null;
            if (tokenStack) {
                preservedTokens = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(tokenStack) : JSON.parse(JSON.stringify(tokenStack));
                preservedTokens.isEquipped = false;
            }
            
            player.inventory = [rags];
            if (newPendant) player.inventory.unshift(newPendant); 
            if (preservedTokens) player.inventory.push(preservedTokens); 

            player.equipment = {
                weapon: { name: 'Fists', damage: 0, tags: ['blunt'] },
                armor: rags,
                offhand: null,
                accessory: newPendant,
                ammo: null
            };

            if (typeof applyStatBonuses === 'function') {
                if (player.equipment.weapon) applyStatBonuses(player.equipment.weapon, 1);
                if (player.equipment.armor) applyStatBonuses(player.equipment.armor, 1);
                if (player.equipment.accessory) applyStatBonuses(player.equipment.accessory, 1);
            }

            delete player.spireBackupInv;
            delete player.spireBackupEquip;
            
            gameState.mapMode = 'overworld';
            gameState.currentCaveId = null;
            gameState.currentCastleId = null;
            gameState.currentRealm = 0;
            gameState.realmMutators = [];
            player.x = 0;
            player.y = 0;

            // 5. Apply Generation Base Vitals Boost
            player.bonusMaxHealth = (Number(player.bonusMaxHealth) || 0) + 10;
            player.bonusMaxMana = (Number(player.bonusMaxMana) || 0) + 10;
            player.bonusMaxStamina = (Number(player.bonusMaxStamina) || 0) + 10;
            player.bonusMaxPsyche = (Number(player.bonusMaxPsyche) || 0) + 10;

            if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
            
            if (typeof clampAllVitals === 'function') window.clampAllVitals();
            else {
                player.health = player.maxHealth;
                player.mana = player.maxMana;
                player.stamina = player.maxStamina;
                player.psyche = player.maxPsyche;
            }

            // 6. Announce to Server
            if (typeof rtdb !== 'undefined') {
                rtdb.ref('chat').push().set({
                    senderId: 'SERVER',
                    email: 'SYSTEM',
                    message: `{gold:🌟 ${player.name} has transcended mortal flesh to become a Generation ${player.generation} Ascendant! 🌟}`,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            }
            
            if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
            if (typeof renderStats === 'function') renderStats();
            if (typeof renderEquipment === 'function') renderEquipment();
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderHotbar === 'function') renderHotbar(); 
            
            gameState.mapDirty = true;
            if (typeof render === 'function') render();
            
            if (typeof playerRef !== 'undefined') {
                const resetPayload = typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(player) : player;
                resetPayload.mapMode = 'overworld';
                resetPayload.currentRealm = 0;
                resetPayload.realmMutators = [];
                
                let deleteField = null;
                try {
                    if (typeof window.getFirestoreDelete === 'function') {
                        deleteField = window.getFirestoreDelete();
                    } else if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                        deleteField = firebase.firestore.FieldValue.delete();
                    }
                } catch(e) {}
                
                if (deleteField) {
                    resetPayload.spireBackupInv = deleteField;
                    resetPayload.spireBackupEquip = deleteField;
                }
                
                resetPayload.inventory = typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory;
                resetPayload.bank = typeof getSanitizedBank === 'function' ? getSanitizedBank() : player.bank;
                
                await playerRef.set(resetPayload);
            }

            if (typeof lastValidatedState !== 'undefined') {
                lastValidatedState = JSON.parse(JSON.stringify(gameState.player));
                window.legitimateGoldDelta = 0;
                window.legitimateXpDelta = 0;
            }
        });

        // ==========================================
        // 3. OVERWORLD INJECTIONS
        // ==========================================

        const applySafePatch = (target, method, factory) => {
            if (typeof window.ExpansionManager.patchFunction === 'function') {
                window.ExpansionManager.patchFunction(target, method, factory);
            } else {
                const orig = target[method];
                target[method] = factory(orig ? orig.bind(target) : null);
            }
        };

        // A. Place the Throne in the Safe Haven Village
        if (typeof chunkManager !== 'undefined') {
            applySafePatch(chunkManager, 'generateCastle', (origGenerateCastle) => {
                return function(castleId, layoutType) {
                    const map = origGenerateCastle ? origGenerateCastle.call(this, castleId, layoutType) : [];
                    if (castleId.includes('village')) {
                        if (map[4] && map[4][13] !== undefined) map[4][13] = '👑b'; 
                    }
                    return map;
                };
            });
        }

        // B. Apply XP Multiplier
        applySafePatch(window, 'grantXp', (origGrantXp) => {
            return function(amount) {
                const gen = (typeof gameState !== 'undefined' && gameState.player && gameState.player.generation) ? gameState.player.generation : 0;
                let finalAmount = amount;
                if (gen > 0) {
                    finalAmount = Math.floor(amount * (1 + (gen * 0.25)));
                }
                if (origGrantXp) origGrantXp(finalAmount);
            };
        });

        // C. END-TURN HOOK (Multiplayer Aura & Passive Regeneration)
        applySafePatch(window, 'endPlayerTurn', (origEndPlayerTurn) => {
            return function(updates = {}) {
                if (typeof gameState !== 'undefined' && gameState.player) {
                    const player = gameState.player;
                    
                    // 🚨 CRITICAL BUG FIX: Anti-Zombification Guard
                    // Prevent passive Ascendant heals from triggering if the player is technically dead
                    // or in the middle of dying, which would override the Game Over screen!
                    if (player.health <= 0 || gameState.isDead) {
                        if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
                        return;
                    }
                    
                    const gen = player.generation || 0;
                    
                    if (gen > 0) {
                        // 🌟 Radiant Aura (Scales based on Generation!)
                        if (gameState.activeFilter !== 'gold') {
                            if (typeof ParticleSystem !== 'undefined' && Math.random() < 0.10) {
                                let auraColor = '#e2e8f0'; // Gen 1: Silver
                                if (gen >= 10) auraColor = '#facc15'; // Gen 10: Gold
                                else if (gen >= 5) auraColor = '#a855f7'; // Gen 5: Purple
                                
                                ParticleSystem.spawn(player.x, player.y, auraColor, 'sparkle', '', 3);
                            }
                        }

                        // 🚨 Ascendant Regeneration (Scales with Gen!)
                        if (gameState.playerTurnCount % 10 === 0) {
                            let regenerated = false;
                            const healAmt = 1 + Math.floor(gen / 5); 
                            
                            if (player.health < player.maxHealth) {
                                if (typeof window.modifyVital === 'function') window.modifyVital('health', healAmt);
                                else player.health = Math.min(player.maxHealth, player.health + healAmt);
                                regenerated = true;
                            }
                            if (player.mana < player.maxMana) {
                                if (typeof window.modifyVital === 'function') window.modifyVital('mana', healAmt);
                                else player.mana = Math.min(player.maxMana, player.mana + healAmt);
                                regenerated = true;
                            }
                            if (player.stamina < player.maxStamina) {
                                if (typeof window.modifyVital === 'function') window.modifyVital('stamina', healAmt);
                                else player.stamina = Math.min(player.maxStamina, player.stamina + healAmt);
                                regenerated = true;
                            }
                        }
                    }
                }
                
                // Safely apply arguments so updates object is not lost
                if (origEndPlayerTurn) origEndPlayerTurn.apply(this, arguments);
            };
        });

        // D. CHAT & /WHO INJECTION
        applySafePatch(window, 'syncPlayerState', (origSync) => {
            return function() {
                if (origSync) origSync();
                if (typeof onlinePlayerRef !== 'undefined' && onlinePlayerRef && typeof gameState !== 'undefined' && gameState.player) {
                    onlinePlayerRef.update({ 
                        generation: gameState.player.generation || 0, 
                        activeTitle: gameState.player.activeTitle || null 
                    }).catch(()=>{});
                }
            };
        });
    }
});

// --- END OF FILE expansion-bloodline.js ---
