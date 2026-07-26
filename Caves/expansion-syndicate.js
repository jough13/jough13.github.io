// --- START OF FILE expansion-syndicate.js ---

window.ExpansionManager.register({
    id: "the_syndicate",
    name: "The Syndicate (Outlaws & PvP)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🧭b': {
                name: 'Bounty Compass', type: 'tool', tile: '🧭',
                description: "Spins wildly, pointing towards the nearest player with an active Outlaw Bounty.",
                effect: (state) => {
                    if (typeof otherPlayers === 'undefined' || Object.keys(otherPlayers).length === 0) {
                        logMessage("{gray:The compass needle sits dead. You are alone.}");
                        return false;
                    }

                    let nearestOutlaw = null;
                    let minDist = Infinity;

                    for (const id in otherPlayers) {
                        const op = otherPlayers[id];
                        // Must be an outlaw, and must be in the same dimension/layer as you
                        if (op.bounty > 0 && op.mapMode === state.mapMode && op.currentRealm === state.currentRealm) {
                            const dist = Math.sqrt(Math.pow(op.x - state.player.x, 2) + Math.pow(op.y - state.player.y, 2));
                            if (dist < minDist) {
                                minDist = dist;
                                nearestOutlaw = op;
                            }
                        }
                    }

                    if (nearestOutlaw) {
                        const safeName = typeof escapeHtml === 'function' ? escapeHtml(nearestOutlaw.email.split('@')[0]) : "An Outlaw";
                        state.activeInvestigation = { x: nearestOutlaw.x, y: nearestOutlaw.y, eventId: null };
                        
                        logMessage(`{red:The compass spins wildly! It points towards ${safeName} (Bounty: ${nearestOutlaw.bounty}g)!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                        state.mapDirty = true;
                        return true;
                    } else {
                        logMessage("{gray:The needle drifts lazily. There are no outlaws in this realm.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                        return false;
                    }
                }
            },
            '📜p': {
                name: 'Royal Pardon', type: 'consumable', tile: '📜',
                description: "A legally binding pardon bearing the King's seal. Clears your Outlaw Bounty instantly.",
                _rarity: 'epic',
                effect: (state) => {
                    if (!state.player.bounty || state.player.bounty <= 0) {
                        logMessage("{gray:You have no crimes to be pardoned for.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    
                    logMessage("{gold:You read the Royal Pardon. The kingdom forgives your transgressions!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#facc15', 30);
                    
                    state.player.bounty = 0;
                    if (typeof playerRef !== 'undefined') playerRef.update({ bounty: 0 });
                    return true;
                }
            }
        },

        // --- 2. SHOPS ---
        shops: {
            castle: [
                { name: 'Bounty Compass', price: 500, stock: 1 }
            ],
            // Add the Pardon to the Black Market from the Lore Expansion!
            trader: [
                { name: 'Bounty Compass', price: 400, stock: 1 },
                { name: 'Royal Pardon', price: 5000, stock: 1 } // Very expensive way to escape prison!
            ]
        },

        // --- 3. PRISON LAYOUT ---
        castleLayouts: {
            'ROYAL_PRISON': {
                spawn: { x: 3, y: 3 },
                map: [
                    '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
                    '▓.▓.....▓..............▓',
                    '▓+▓.▓▓▓.▓.▓▓▓▓▓▓▓▓▓▓.▓.▓',
                    '▓.▓...▓.▓.▓.G......▓.▓.▓',
                    '▓.▓▓▓.▓.▓.▓........▓.▓.▓',
                    '▓...▓.▓.▓.▓▓▓▓+▓▓▓▓▓.▓.▓',
                    '▓.▓▓▓.▓.▓......G.....▓.▓',
                    '▓...▓.▓.▓▓▓▓▓▓▓▓▓▓▓▓▓▓.▓',
                    '▓▓▓.▓.▓..........G.....▓',
                    '▓...▓.▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓.▓',
                    '▓.▓▓▓..................▓',
                    '▓.....▓▓▓▓▓▓.X.▓▓▓▓▓▓▓▓▓',
                    '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓'
                ]
            }
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. INJECT THE PVP MODAL
        // ==========================================
        const pvpModalHTML = `
        <div id="pvpModal" class="modal-overlay hidden" role="dialog" aria-modal="true" style="z-index: 600;">
            <div class="modal-content themed-container p-6 rounded-2xl shadow-2xl border-2 border-red-600 max-w-md w-full text-center bg-[var(--bg-container)]">
                <h2 id="pvpTitle" class="text-3xl font-bold mb-4 border-b border-red-700 pb-2 drop-shadow-md" style="color: var(--title-color);">Player Interaction</h2>
                <p id="pvpDesc" class="muted-text italic mb-6">You stand face to face with another traveler. What will you do?</p>
                
                <div class="flex flex-col gap-3">
                    <button id="pvpTradeBtn" class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-blue-800 active:border-b-0 active:mt-1">
                        🤝 Send Trade Request
                    </button>
                    <button id="pvpAttackBtn" class="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1">
                        🗡️ Assassinate (PvP)
                    </button>
                    <button id="pvpCancelBtn" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-gray-900 active:border-b-0 active:mt-1">
                        Walk Away
                    </button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', pvpModalHTML);

        // ==========================================
        // 2. MONKEY PATCH NPC INTERACTIONS (THE CRIME SYSTEM)
        // ==========================================
        const makeMuggable = (tileChar, name, mugGold, bountyAmt) => {
            if (!window.TILE_DATA[tileChar]) return;
            
            const origInteract = window.TILE_DATA[tileChar].onInteract;
            
            window.TILE_DATA[tileChar].onInteract = (state, x, y) => {
                
                // 🚨 BUG FIX: Only show the Crime modal if they are sneaking up on them!
                if (!state.player.isCrouching) {
                    if (origInteract) return origInteract(state, x, y);
                    return false; // Fall through to input.js hardcoded logic!
                }

                const loreModal = document.getElementById('loreModal');
                const loreTitle = document.getElementById('loreTitle');
                const loreContent = document.getElementById('loreContent');

                loreTitle.textContent = name;
                
                // 🚨 UI FIX: Replaced 'text-gray-300' with 'muted-text' for Light Mode visibility
                loreContent.innerHTML = `
                    <p class="mb-4 muted-text italic">You approach the ${name}. What will you do?</p>
                    <button id="npcTalkBtn" class="mb-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 border-b-4 border-blue-800 active:border-b-0 active:mt-1">Interact peacefully</button>
                    <button id="npcMugBtn" class="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1">Assassinate (Gain ${bountyAmt}g Bounty)</button>
                `;
                loreModal.classList.remove('hidden');
                if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();

                setTimeout(() => {
                    document.getElementById('npcTalkBtn').onclick = () => {
                        loreModal.classList.add('hidden');
                        
                        // 🚨 BUG FIX: Automatically uncrouch the player and hit the tile again to 
                        // trigger the standard hardcoded interaction seamlessly!
                        state.player.isCrouching = false;
                        if (typeof window.StealthManager !== 'undefined') window.StealthManager.updateUI();
                        if (typeof render === 'function') render();
                        
                        setTimeout(() => {
                            if (typeof window.attemptMovePlayer === 'function') {
                                window.attemptMovePlayer(x, y);
                            }
                        }, 50);
                    };
                    
                    document.getElementById('npcMugBtn').onclick = () => {
                        loreModal.classList.add('hidden');
                        
                        // Execute Crime
                        state.player.bounty = (state.player.bounty || 0) + bountyAmt;
                        state.player.coins += mugGold;
                        
                        logMessage(`{red:You murdered the ${name}! +${bountyAmt}g Bounty. Claimed ${mugGold} gold.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                        state.screenShake = 20;
                        
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createExplosion(x, y, '#ef4444', 20);
                            ParticleSystem.createFloatingText(x, y, `+${mugGold}g`, "#facc15");
                        }

                        // Remove NPC
                        if (state.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '⚰️', 2);
                        else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][y][x] = '⚰️';
                        else chunkManager.castleMaps[state.currentCastleId][y][x] = '⚰️';

                        state.mapDirty = true;
                        if (typeof render === 'function') render();
                        if (typeof renderStats === 'function') renderStats();
                        
                        if (typeof playerRef !== 'undefined') {
                            playerRef.update({ coins: state.player.coins, bounty: state.player.bounty });
                        }
                    };
                }, 10);
                
                return null;
            };
        };

        // Make merchants and guards muggable!
        makeMuggable('¥', 'Wandering Trader', 250, 1000);
        makeMuggable('§', 'General Store Merchant', 500, 2000);
        makeMuggable('G', 'Castle Guard', 50, 500);
        makeMuggable('H', 'Village Healer', 100, 1500);

        // ==========================================
        // 3. OVERRIDE INPUT FOR PVP INTERACTION
        // ==========================================
        if (typeof window.handleInput === 'function') {
            const origHandleInput = window.handleInput;
            
            window.handleInput = function(key) {
                if (key.toLowerCase() === 'g' && typeof otherPlayers !== 'undefined') {
                    
                    // Look for a player on the exact same tile
                    let targetPid = null; 
                    let targetOp = null;
                    
                    for (const pid in otherPlayers) {
                        const op = otherPlayers[pid];
                        if (op.x === gameState.player.x && op.y === gameState.player.y && op.mapMode === gameState.mapMode && op.currentRealm === gameState.currentRealm) {
                            targetPid = pid; 
                            targetOp = op; 
                            break;
                        }
                    }
                    
                    if (targetPid) {
                        const safeName = typeof escapeHtml === 'function' ? escapeHtml(targetOp.email.split('@')[0]) : "Traveler";
                        
                        document.getElementById('pvpTitle').innerHTML = `Encounter: ${safeName}`;
                        
                        if (targetOp.bounty > 0) {
                            document.getElementById('pvpDesc').innerHTML = `They are a <strong class="text-red-500">Wanted Outlaw</strong>! Defeat them to claim their ${targetOp.bounty}g bounty.`;
                        } else {
                            document.getElementById('pvpDesc').innerHTML = `A peaceful traveler. Murdering them will grant you a severe bounty.`;
                        }
                        
                        document.getElementById('pvpModal').classList.remove('hidden');
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        
                        // Bind Buttons
                        document.getElementById('pvpCancelBtn').onclick = () => {
                            document.getElementById('pvpModal').classList.add('hidden');
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        };
                        
                        document.getElementById('pvpTradeBtn').onclick = () => {
                            document.getElementById('pvpModal').classList.add('hidden');
                            // Seamless integration with the Bazaar Expansion!
                            if (typeof window.TradeManager !== 'undefined') {
                                window.TradeManager.requestTrade(targetPid, safeName);
                            } else {
                                logMessage("{gray:Trading is currently unavailable.}");
                            }
                        };
                        
                        document.getElementById('pvpAttackBtn').onclick = () => {
                            document.getElementById('pvpModal').classList.add('hidden');
                            
                            // CALCULATE PVP DAMAGE
                            const weapon = gameState.player.equipment.weapon;
                            const weaponDamage = weapon ? weapon.damage : 0;
                            const wpnTags = weapon && weapon.tags ? weapon.tags : [];
                            const isRanged = wpnTags.includes('bow') || wpnTags.includes('crossbow') || wpnTags.includes('firearm');

                            let rawPower = 0;

                            if (isRanged) {
                                // 1. Ranged Scaling: Dexterity + Weapon + Ammo
                                const ammo = gameState.player.equipment.ammo;
                                const ammoDamage = ammo ? ammo.damage : 0;
                                
                                // Note: If they have no ammo, ammoDamage is 0 (hitting someone with an unloaded bow!)
                                rawPower = gameState.player.dexterity + weaponDamage + ammoDamage;

                                // Optional but highly recommended: Pull in the Ranger's 'Eagle Eye' talent!
                                if (gameState.player.talents && gameState.player.talents.includes('eagle_eye')) {
                                    rawPower = Math.floor(rawPower * 1.5);
                                }
                            } else {
                                // 2. Melee Scaling: Strength + Weapon
                                const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);
                                rawPower = playerStrength + weaponDamage;
                            }

                            // 3. Apply Universal Passive Modifiers (Blood Rage, Shadow Strike, etc.)
                            if (typeof getPlayerDamageModifier === 'function') {
                                rawPower = getPlayerDamageModifier(rawPower);
                            }
                            
                            // Send the attack to RTDB!
                            if (typeof rtdb !== 'undefined') {
                                rtdb.ref(`pvpAttacks/${targetPid}`).push({
                                    attackerId: player_id,
                                    attackerName: gameState.player.name || auth.currentUser.email.split('@')[0],
                                    damage: rawPower,
                                    timestamp: firebase.database.ServerValue.TIMESTAMP
                                });
                            }
                            
                            // Crime Penalty
                            if (!targetOp.bounty || targetOp.bounty <= 0) {
                                gameState.player.bounty = (gameState.player.bounty || 0) + 1000;
                                logMessage("{red:You assaulted an innocent! +1000g Bounty.}");
                                if (typeof playerRef !== 'undefined') playerRef.update({ bounty: gameState.player.bounty });
                            }
                            
                            logMessage(`{orange:You mercilessly strike ${safeName} for ${rawPower} damage!}`);
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy');
                            gameState.screenShake = 10;
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ef4444', 15);
                        };
                        
                        return; // VERY IMPORTANT: Do not call origHandleInput, as that would trigger ground looting!
                    }
                }
                return origHandleInput.call(this, key);
            };
        }

        // ==========================================
        // 4. FIREBASE PVP LISTENERS
        // ==========================================
        // We wait a few seconds to ensure player_id is populated by the auth system
        setTimeout(() => {
            if (typeof rtdb !== 'undefined' && typeof player_id !== 'undefined' && player_id) {
                
                // A. Listen for incoming Assassinations
                rtdb.ref(`pvpAttacks/${player_id}`).on('child_added', (snap) => {
                    const attack = snap.val();
                    if (!attack) return;

                    const dmg = attack.damage || 0;
                    logMessage(`{red:⚔️ ${attack.attackerName} assassinated you for ${dmg} damage!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    gameState.screenShake = 20;
                    
                    window.modifyVital('health', -dmg);

                    if (gameState.player.health <= 0) {
                        logMessage(`{red:You were slain by ${attack.attackerName}!}`);
                        
                        // Push reward to attacker!
                        const rewardGold = (gameState.player.bounty || 0) + (gameState.player.coins || 0);
                        rtdb.ref(`pvpRewards/${attack.attackerId}`).push({
                            gold: rewardGold,
                            targetName: gameState.player.name || auth.currentUser.email.split('@')[0]
                        });
                        
                        // Clear our gold natively (so the Prison spawn doesn't give us back half)
                        gameState.player.coins = 0;
                    }
                    
                    if (typeof renderStats === 'function') renderStats();
                    rtdb.ref(`pvpAttacks/${player_id}/${snap.key}`).remove(); // Clear inbox
                });

                // B. Listen for incoming Bounty Claims (Gold)
                rtdb.ref(`pvpRewards/${player_id}`).on('child_added', (snap) => {
                    const reward = snap.val();
                    if (!reward) return;

                    logMessage(`{gold:🏆 Target Eliminated! You claimed ${reward.targetName}'s bounty of ${reward.gold} gold!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
                    
                    gameState.player.coins += reward.gold;
                    if (typeof trackLegitimateGold === 'function') trackLegitimateGold(reward.gold);
                    
                    if (typeof renderStats === 'function') renderStats();
                    if (typeof playerRef !== 'undefined') playerRef.update({ coins: gameState.player.coins });
                    
                    rtdb.ref(`pvpRewards/${player_id}/${snap.key}`).remove(); // Clear inbox
                });
            }
        }, 4000);

        // ==========================================
        // 5. THE ROYAL PRISON OVERRIDE
        // ==========================================
        if (typeof window.handlePlayerDeath === 'function') {
            const origHandleDeath = window.handlePlayerDeath;
            
            window.handlePlayerDeath = function() {
                // If they are an outlaw, they go to jail instead of dying normally!
                if (gameState.player.bounty && gameState.player.bounty > 0 && !gameState.inSpire) {
                    
                    logMessage("{red:You have been slain... and dragged to the Royal Prison to answer for your crimes!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();
                    
                    gameState.screenShake = 30;
                    gameState.screenFlash = { color: '#000000', alpha: 1.0, decay: 0.05 };

                    // 1. Confiscate Bounty & Gold
                    gameState.player.bounty = 0;
                    gameState.player.coins = 0;

                    // 2. Setup Prison Instance
                    gameState.mapMode = 'castle';
                    gameState.currentCastleId = 'castle_royal_prison';
                    gameState.currentRealm = 0; // Ensure they are back in normal reality
                    
                    // Generate layout
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.generateCastle(gameState.currentCastleId, 'ROYAL_PRISON');
                        const spawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                        gameState.player.x = spawn.x;
                        gameState.player.y = spawn.y;
                    }

                    // 3. Full Heal
                    gameState.player.health = gameState.player.maxHealth;
                    gameState.player.mana = gameState.player.maxMana;
                    gameState.player.stamina = gameState.player.maxStamina;
                    
                    // Critical: Release Death Locks
                    gameState.isDead = false;
                    gameState.player._isDying = false;

                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    if (typeof renderStats === 'function') renderStats();
                    if (typeof render === 'function') render();

                    // Force DB Save
                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({
                        bounty: 0,
                        coins: 0,
                        health: gameState.player.health,
                        mapMode: 'castle',
                        mapId: gameState.currentCastleId
                    });

                    return true; // Abort standard death wipe!
                }
                
                return origHandleDeath.apply(this, arguments);
            };
        }

        // ==========================================
        // 6. CHAT & PLAYER SYNC HOOKS
        // ==========================================
        // Ensure other players know you are an outlaw!
        if (typeof window.syncPlayerState === 'function') {
            const origSync = window.syncPlayerState;
            window.syncPlayerState = function() {
                origSync();
                if (typeof onlinePlayerRef !== 'undefined' && onlinePlayerRef) {
                    onlinePlayerRef.update({ bounty: gameState.player.bounty || 0 }).catch(()=>{});
                }
            };
        }

        if (typeof window.handleChatCommand === 'function') {
            const existingHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                const raw = message.substring(1); 
                const command = raw.split(' ')[0].toLowerCase();
                
                if (command === 'who') {
                    let onlineList = [`You ${gameState.player.bounty > 0 ? '{red:[OUTLAW]}' : ''}`];
                    for (const id in otherPlayers) {
                        const p = otherPlayers[id];
                        const safeName = typeof escapeHtml === 'function' ? escapeHtml(p.email ? p.email.split('@')[0] : "Unknown") : "Unknown";
                        const bountyStr = p.bounty > 0 ? ` {red:[Bounty: ${p.bounty}g]}` : '';
                        onlineList.push(`${safeName}${bountyStr}`);
                    }
                    logMessage(`Online Players (${onlineList.length}): ${onlineList.join(', ')}`);
                    return;
                }
                existingHandleChat(message);
            };
        }
    }
});

// --- END OF FILE expansion-syndicate.js ---
