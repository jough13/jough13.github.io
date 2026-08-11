// --- START OF FILE expansion-syndicate.js ---

window.ExpansionManager.register({
    id: "the_syndicate",
    name: "The Syndicate (Outlaws & PvP)",
    version: "1.2", // Upgraded Version
    
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
                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ bounty: 0 });
                    } else if (typeof playerRef !== 'undefined') {
                        playerRef.update({ bounty: 0 });
                    }
                    return true;
                }
            }
        },

        // --- 2. SHOPS ---
        shops: {
            castle: [
                { name: 'Bounty Compass', price: 500, stock: 1 }
            ],
            // Added to the Black Market from the Lore Expansion
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
                
                // Fallthrough allows standard interaction if not crouching!
                if (!state.player.isCrouching) {
                    if (origInteract) return origInteract(state, x, y);
                    return false; // Fall through to input.js hardcoded logic!
                }

                const loreModal = document.getElementById('loreModal');
                const loreTitle = document.getElementById('loreTitle');
                const loreContent = document.getElementById('loreContent');

                loreTitle.textContent = name;
                
                // Replaced hardcoded text-gray-300 with muted-text for Light Mode visibility
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
                        
                        // Automatically uncrouch the player and re-trigger the 
                        // tile interaction seamlessly to open their shop/dialogue!
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
                        
                        // Strict Number Coercion
                        // Prevents NaN from infecting the player's core stats
                        const safeBountyAmt = Math.floor(Number(bountyAmt) || 0);
                        const safeMugGold = Math.floor(Number(mugGold) || 0);

                        state.player.bounty = Math.floor(Number(state.player.bounty) || 0) + safeBountyAmt;
                        state.player.coins = Math.floor(Number(state.player.coins) || 0) + safeMugGold;
                        
                        logMessage(`{red:You murdered the ${name}! +${safeBountyAmt}g Bounty. Claimed ${safeMugGold} gold.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                        state.screenShake = 20;
                        
                        if (typeof ParticleSystem !== 'undefined') {
                            ParticleSystem.createExplosion(x, y, '#ef4444', 20);
                            ParticleSystem.createFloatingText(x, y, `+${safeMugGold}g`, "#facc15");
                        }

                        // Remove NPC
                        if (state.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '⚰️', 2);
                        else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][y][x] = '⚰️';
                        else chunkManager.castleMaps[state.currentCastleId][y][x] = '⚰️';

                        state.mapDirty = true;
                        if (typeof render === 'function') render();
                        if (typeof renderStats === 'function') renderStats();
                        
                        if (typeof triggerDebouncedSave === 'function') {
                            triggerDebouncedSave({ coins: state.player.coins, bounty: state.player.bounty });
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
                // Ignore empty keys
                if (!key) return origHandleInput.call(this, key);

                if (key.toLowerCase() === 't' && typeof otherPlayers !== 'undefined') {
                    
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
                        
                        const isLawlessZone = () => {
                            if (gameState.mapMode === 'underworld') return true;
                            if (gameState.currentRealm !== 0) return true; 
                            if (gameState.mapMode === 'dungeon' && ['ARENA', 'VOID', 'ABYSS', 'CORRUPTED'].includes(gameState.currentCaveTheme)) return true;
                            return false;
                        };

                        const inZone = isLawlessZone();
                        const myPvP = gameState.player.pvpEnabled;
                        const theirPvP = targetOp.pvpEnabled;
                        const isSneaking = gameState.player.stealthTurns > 0; // Check stealth!
                        const attackBtn = document.getElementById('pvpAttackBtn');

                        // Determine the state of the Attack Button
                        if (targetOp.bounty > 0) {
                            document.getElementById('pvpDesc').innerHTML = `They are a <strong class="text-red-500">Wanted Outlaw</strong>! Defeat them to claim their ${targetOp.bounty}g bounty.`;
                            attackBtn.disabled = false;
                            attackBtn.className = "bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1";
                            attackBtn.innerHTML = "🗡️ Claim Bounty (PvP)";
                        } else if (!inZone) {
                            document.getElementById('pvpDesc').innerHTML = `A peaceful traveler. You are in a <strong class="text-blue-400">Safe Zone</strong>.`;
                            attackBtn.disabled = true;
                            attackBtn.className = "bg-gray-800 text-gray-500 font-bold py-3 px-4 rounded-xl shadow-inner border border-gray-700 cursor-not-allowed";
                            attackBtn.innerHTML = "🚫 PvP Disabled (Safe Zone)";
                        } else if (!myPvP || !theirPvP) {
                            // --- STEALTH REQUIREMENT ---
                            if (!isSneaking) {
                                document.getElementById('pvpDesc').innerHTML = `A peaceful traveler. You must be in <strong class="text-purple-400">Stealth Mode (Shift)</strong> to assassinate them!`;
                                attackBtn.disabled = true;
                                attackBtn.className = "bg-gray-800 text-gray-500 font-bold py-3 px-4 rounded-xl shadow-inner border border-gray-700 cursor-not-allowed";
                                attackBtn.innerHTML = "🚫 Stealth Required";
                            } else {
                                document.getElementById('pvpDesc').innerHTML = `You creep up behind the traveler. <strong class="text-red-500">Assassination</strong> will grant a severe bounty!`;
                                attackBtn.disabled = false;
                                attackBtn.className = "bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1";
                                attackBtn.innerHTML = "🗡️ Assassinate (PvP)";
                            }
                        } else {
                            document.getElementById('pvpDesc').innerHTML = `A fellow traveler. <strong class="text-red-500">Honorable Combat</strong> is permitted here!`;
                            attackBtn.disabled = false;
                            attackBtn.className = "bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1";
                            attackBtn.innerHTML = "🗡️ Duel (PvP)";
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
                            if (typeof window.TradeManager !== 'undefined') {
                                window.TradeManager.requestTrade(targetPid, safeName);
                            } else {
                                logMessage("{gray:Trading is currently unavailable.}");
                            }
                        };
                        
                        document.getElementById('pvpAttackBtn').onclick = () => {
                            document.getElementById('pvpModal').classList.add('hidden');
                            
                            // --- NEW: WEAPON TAG SCALING FOR PVP ---
                            const weapon = gameState.player.equipment.weapon;
                            const weaponDamage = weapon ? weapon.damage : 0;
                            const wpnTags = weapon && weapon.tags ? weapon.tags : [];
                            const isRanged = wpnTags.includes('bow') || wpnTags.includes('crossbow') || wpnTags.includes('firearm');

                            let rawPower = 0;

                            if (isRanged) {
                                const ammo = gameState.player.equipment.ammo;
                                const ammoDamage = ammo ? ammo.damage : 0;
                                rawPower = gameState.player.dexterity + weaponDamage + ammoDamage;
                                
                                if (gameState.player.talents && gameState.player.talents.includes('eagle_eye')) {
                                    rawPower = Math.floor(rawPower * 1.5);
                                }
                            } else {
                                const playerStrength = gameState.player.strength + (gameState.player.strengthBonus || 0);
                                rawPower = playerStrength + weaponDamage;
                            }

                            if (typeof getPlayerDamageModifier === 'function') {
                                rawPower = getPlayerDamageModifier(rawPower);
                            }
                            
                            // Protect RTDB from NaN Damage Packets
                            const safeDamage = Math.max(1, Math.floor(Number(rawPower) || 1));
                            
                            // Send the attack to RTDB!
                            if (typeof rtdb !== 'undefined') {
                                rtdb.ref(`pvpAttacks/${targetPid}`).push({
                                    attackerId: player_id,
                                    attackerName: gameState.player.name || auth.currentUser.email.split('@')[0],
                                    damage: safeDamage,
                                    timestamp: firebase.database.ServerValue.TIMESTAMP
                                });
                            }
                            
                            // Crime Penalty ONLY if attacking an innocent outlaw!
                            // (This is a failsafe, since the UI blocks illegal attacks now anyway)
                            if (!targetOp.bounty || targetOp.bounty <= 0) {
                                logMessage(`{orange:You strike ${safeName} for ${safeDamage} damage in honorable combat!}`);
                            } else {
                                logMessage(`{orange:You mercilessly strike the outlaw ${safeName} for ${safeDamage} damage!}`);
                            }
                            
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

        setTimeout(() => {
            if (typeof rtdb !== 'undefined' && typeof player_id !== 'undefined' && player_id) {
                
                // A. Listen for incoming Attacks
                rtdb.ref(`pvpAttacks/${player_id}`).on('child_added', (snap) => {
                    const attack = snap.val();
                    if (!attack) return;

                    let dmg = attack.damage || 0;
                    
                    // --- MULTIPLAYER MONSTER COMBAT RESOLUTION ---
                    if (attack.isMonster) {
                        // 1. Process Dodging & Armor for Physical Attacks
                        if (!attack.isSpell) {
                            const { totalDefense, dodgeChance } = typeof getPlayerDefenseStats === 'function' ? getPlayerDefenseStats() : { totalDefense: 0, dodgeChance: 0 };
                            
                            if (Math.random() < dodgeChance) {
                                logMessage(`{blue:The ${attack.attackerName} shoots an arrow, but you dodge!}`);
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "Dodge!", "#3b82f6");
                                rtdb.ref(`pvpAttacks/${player_id}/${snap.key}`).remove();
                                return; // Nullified!
                            }
                            // Subtract Armor
                            dmg = Math.max(1, dmg - totalDefense);
                        }
                        
                        // 2. Process Arcane Shield
                        if (gameState.player.shieldValue > 0) {
                            const absorb = Math.min(gameState.player.shieldValue, dmg);
                            gameState.player.shieldValue -= absorb;
                            dmg -= absorb;
                            logMessage(`{cyan:Shield absorbs ${absorb} damage from the ${attack.attackerName}!}`);
                        }
                        
                        // 3. Process Status Effects
                        if (dmg > 0 && attack.inflicts) {
                            if (attack.inflicts === 'poison') gameState.player.poisonTurns = 5;
                            if (attack.inflicts === 'frostbite') gameState.player.frostbiteTurns = 5;
                            if (attack.inflicts === 'burn') gameState.player.burnTurns = 5;
                        }
                        
                        // 4. Log it specifically as a monster attack
                        if (dmg > 0) {
                            const spellText = attack.isSpell ? `casts ${attack.spellName || 'a spell'}` : (attack.spellName ? `shoots ${attack.spellName}` : 'attacks');
                            logMessage(`{red:The ${attack.attackerName} ${spellText} for ${dmg} damage!}`);
                        }
                    } else {
                        // It's a PvP Player Attack
                        logMessage(`{red:⚔️ ${attack.attackerName} struck you for ${dmg} damage!}`);
                    }

                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    gameState.screenShake = 20;

                    // Dismount the victim if they get hit!
                    if (gameState.player.isMounted) {
                        gameState.player.isMounted = false;
                        logMessage("{red:You were knocked off your mount!}");
                        if (typeof render === 'function') render();
                    }
                    
                    if (dmg > 0) {
                        window.modifyVital('health', -dmg);

                        if (gameState.player.health <= 0) {
                            // If a monster killed us, standard death occurs. If a player killed us, pay the bounty!
                            if (!attack.isMonster) {
                                logMessage(`{red:You were slain by ${attack.attackerName}!}`);
                                
                                // Prevent NaN poisoning when calculating the attacker's reward
                                const safeBounty = Math.floor(Number(gameState.player.bounty) || 0);
                                const safeCoins = Math.floor(Number(gameState.player.coins) || 0);
                                const rewardGold = safeBounty + safeCoins;
                                
                                rtdb.ref(`pvpRewards/${attack.attackerId}`).push({
                                    gold: rewardGold,
                                    targetName: gameState.player.name || auth.currentUser.email.split('@')[0]
                                });
                                gameState.player.coins = 0;
                            }
                        }
                    }
                    
                    if (typeof renderStats === 'function') renderStats();
                    rtdb.ref(`pvpAttacks/${player_id}/${snap.key}`).remove(); // Clear inbox
                });

                // B. Listen for incoming Bounty Claims (Gold)
                rtdb.ref(`pvpRewards/${player_id}`).on('child_added', (snap) => {
                    const reward = snap.val();
                    if (!reward) return;

                    // Cleanse incoming network data before applying it locally
                    const safeGold = Math.max(0, Math.floor(Number(reward.gold) || 0));

                    logMessage(`{gold:🏆 Target Eliminated! You claimed ${reward.targetName}'s gold: ${safeGold}g!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
                    
                    gameState.player.coins = Math.floor(Number(gameState.player.coins) || 0) + safeGold;
                    if (typeof trackLegitimateGold === 'function') trackLegitimateGold(safeGold);
                    
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
                    // Safely purge local map memory before forcing the layout!
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.loadedChunks = {};
                        chunkManager.worldState = {};
                    }
                    if (typeof worldStateListeners !== 'undefined') {
                        Object.values(worldStateListeners).forEach(unsub => unsub());
                        worldStateListeners = {};
                    }
                    if (typeof EnemyNetworkManager !== 'undefined') EnemyNetworkManager.clearAll();
                    gameState.sharedEnemies = {};

                    gameState.mapMode = 'castle';
                    gameState.currentCastleId = 'castle_royal_prison';
                    gameState.currentRealm = 0; // Ensure they are back in normal reality
                    
                    // Generate layout
                    if (typeof chunkManager !== 'undefined') {
                        chunkManager.generateCastle(gameState.currentCastleId, 'ROYAL_PRISON');
                        const spawn = chunkManager.castleSpawnPoints[gameState.currentCastleId];
                        gameState.player.x = spawn.x;
                        gameState.player.y = spawn.y;
                        
                        // Ensure the castle instanced arrays are explicitly pulled from the new map!
                        const baseEnemies = chunkManager.castleEnemies[gameState.currentCastleId] || [];
                        gameState.instancedEnemies = JSON.parse(JSON.stringify(baseEnemies));
                        gameState.friendlyNpcs = JSON.parse(JSON.stringify(chunkManager.friendlyNpcs?.[gameState.currentCastleId] || []));
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

        if (typeof window.syncPlayerState === 'function') {
            const origSync = window.syncPlayerState;
            window.syncPlayerState = function() {
                origSync();
                if (typeof onlinePlayerRef !== 'undefined' && onlinePlayerRef) {
                    onlinePlayerRef.update({ 
                        bounty: gameState.player.bounty || 0,
                        pvpEnabled: gameState.player.pvpEnabled || false 
                    }).catch(()=>{});
                }
            };
        }

        if (typeof window.handleChatCommand === 'function') {
            const existingHandleChat = window.handleChatCommand;
            window.handleChatCommand = function(message) {
                if (!message) return; // Prevent string slice crash
                const raw = message.substring(1); 
                const command = raw.split(' ')[0].toLowerCase();
                
                // --- NEW: /PVP COMMAND ---
                if (command === 'pvp') {
                    gameState.player.pvpEnabled = !gameState.player.pvpEnabled;
                    if (gameState.player.pvpEnabled) {
                        logMessage("{red:PvP Enabled. You can now duel in Lawless Zones.}");
                    } else {
                        logMessage("{green:PvP Disabled. You are protected from duels.}");
                    }
                    if (typeof playerRef !== 'undefined') playerRef.update({ pvpEnabled: gameState.player.pvpEnabled });
                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    return;
                }

                existingHandleChat(message);
            };
        }
    }
});

// --- END OF FILE expansion-syndicate.js ---
