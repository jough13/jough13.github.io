// --- START OF FILE expansion-heist.js ---

window.ExpansionManager.register({
    id: "the_grand_heist",
    name: "The Grand Heist (Advanced Stealth)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🗝️p': {
                name: 'Lockpick', type: 'tool', tile: '🗝️',
                description: "A set of delicate metal tools. Essential for cracking Locked Doors (🔒) and Pickpocketing.", _rarity: 'uncommon'
            },
            '💰b': {
                name: 'Blood Ruby', type: 'trade', tile: '💎',
                description: "A highly illegal, stolen gemstone. Smugglers will pay a fortune for this.", value: 1000, _rarity: 'epic', excludeFromLoot: true
            }
        },

        // --- 2. NEW TILES ---
        tiles: {
            '🔒': {
                type: 'obstacle', name: 'Locked Vault Door',
                flavor: "A heavy iron door with a complex locking mechanism.",
                onInteract: (state, x, y) => {
                    const inv = state.player.inventory;
                    const pickIdx = inv.findIndex(i => i && i.name === 'Lockpick' && !i.isEquipped);

                    if (pickIdx === -1) {
                        logMessage("{red:The door is locked tight. You need a Lockpick.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return null;
                    }

                    logMessage("{purple:You insert the lockpick and listen to the tumblers...}");
                    
                    // Consume Lockpick (They are fragile!)
                    inv[pickIdx].quantity--;
                    if (inv[pickIdx].quantity <= 0) inv.splice(pickIdx, 1);

                    // Dexterity Check
                    const dex = state.player.dexterity + (state.player.dexterityBonus || 0);
                    const successChance = Math.min(0.85, 0.40 + (dex * 0.05));

                    if (Math.random() < successChance) {
                        logMessage("{green:CLICK! The lock disengages and the door swings open.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin(); // Metallic click
                        
                        // Replace door with open door
                        if (state.mapMode === 'overworld') chunkManager.setWorldTile(x, y, '/');
                        else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][y][x] = '/';
                        else chunkManager.castleMaps[state.currentCastleId][y][x] = '/';
                        
                        state.mapDirty = true;
                    } else {
                        logMessage("{red:SNAP! The lockpick breaks off in the keyhole!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playHit(); // Snap sound
                        state.screenShake = 5;
                    }

                    if (typeof renderInventory === 'function') renderInventory();
                    return { inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv };
                }
            }
        },

        // --- 3. SHOPS ---
        shops: {
            // General merchants don't sell lockpicks! Only shady ones.
            trader: [
                { name: 'Lockpick', price: 150, stock: 5 }
            ],
            // Added to the Black Market from the Lore Expansion
            black_market: [
                { name: 'Lockpick', price: 100, stock: 10 },
                { name: 'Blood Ruby', price: 10, stock: 0 } // They will buy it from you!
            ]
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. INJECT THE SUSPICION UI
        // ==========================================
        const stealthUI = `
        <div id="stealthMeterContainer" class="hidden panel p-3 mt-3 border-2 border-purple-800 bg-black bg-opacity-80 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] text-center transition-all duration-300 transform translateZ(0)">
            <div class="flex justify-between items-center mb-1">
                <span class="text-purple-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2"><span class="animate-pulse">🥷</span> Crouching</span>
                <span id="suspicionValueText" class="text-xs font-bold text-gray-300">0%</span>
            </div>
            <div class="w-full bg-gray-900 rounded-lg h-3 mt-1 border border-gray-700 overflow-hidden shadow-inner relative">
                <div id="suspicionBar" class="bg-gray-500 h-full transition-all duration-300" style="width: 0%"></div>
            </div>
            <span id="suspicionStatusText" class="text-[10px] text-gray-400 font-bold uppercase mt-2 block tracking-widest">Hidden</span>
        </div>
        `;
        // Inject below the Vitals panel
        const statusPanel = document.getElementById('statusPanel');
        if (statusPanel) statusPanel.insertAdjacentHTML('afterend', stealthUI);

        // ==========================================
        // 2. THE STEALTH MANAGER
        // ==========================================
        window.StealthManager = {
            toggleCrouch: function() {
                const p = gameState.player;
                
                // Block crouching if mounted or boating
                if (p.isMounted || p.isBoating || p.isSailing) {
                    logMessage("{red:You cannot crouch while riding or sailing!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }

                p.isCrouching = !p.isCrouching;
                
                const ui = document.getElementById('stealthMeterContainer');
                
                if (p.isCrouching) {
                    p.suspicion = p.suspicion || 0;
                    if (ui) ui.classList.remove('hidden');
                    logMessage("{purple:You crouch down, blending into the shadows...}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 300); // Whoosh
                    this.updateUI();
                } else {
                    if (ui) ui.classList.add('hidden');
                    logMessage("{gray:You stand up, leaving stealth mode.}");
                    p.stealthTurns = 0; // Drop active stealth immediately
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                    if (typeof renderStats === 'function') renderStats(); // Clear stealth icon
                }
                
                if (typeof render === 'function') render(); // Redraw character alpha
            },

            updateUI: function() {
                const p = gameState.player;
                if (!p.isCrouching) return;
                
                const val = p.suspicion || 0;
                const bar = document.getElementById('suspicionBar');
                const valTxt = document.getElementById('suspicionValueText');
                const statTxt = document.getElementById('suspicionStatusText');
                const container = document.getElementById('stealthMeterContainer');
                
                if (!bar || !valTxt || !statTxt) return;
                
                bar.style.width = `${val}%`;
                valTxt.textContent = `${Math.floor(val)}%`;

                // Dynamic Colors based on danger
                if (val >= 100) {
                    bar.className = "bg-red-600 h-full transition-all duration-300";
                    statTxt.textContent = "DETECTED!";
                    statTxt.className = "text-[12px] text-red-500 font-extrabold uppercase mt-2 block tracking-widest animate-pulse";
                    container.classList.add('border-red-600', 'shadow-[0_0_20px_rgba(220,38,38,0.5)]');
                    container.classList.remove('border-purple-800', 'shadow-[0_0_15px_rgba(168,85,247,0.3)]', 'border-yellow-600');
                } else if (val >= 60) {
                    bar.className = "bg-yellow-500 h-full transition-all duration-300";
                    statTxt.textContent = "Searching...";
                    statTxt.className = "text-[10px] text-yellow-400 font-bold uppercase mt-2 block tracking-widest";
                    container.classList.add('border-yellow-600', 'shadow-[0_0_15px_rgba(234,179,8,0.3)]');
                    container.classList.remove('border-purple-800', 'border-red-600');
                } else {
                    bar.className = "bg-gray-400 h-full transition-all duration-300";
                    statTxt.textContent = "Hidden";
                    statTxt.className = "text-[10px] text-gray-400 font-bold uppercase mt-2 block tracking-widest";
                    container.classList.add('border-purple-800', 'shadow-[0_0_15px_rgba(168,85,247,0.3)]');
                    container.classList.remove('border-red-600', 'border-yellow-600');
                }
            },

            processTurn: function(oldX, oldY) {
                const p = gameState.player;
                if (!p.isCrouching) return;

                // 1. Maintain Stealth Buff to trick the Enemy AI Loop!
                p.stealthTurns = 2; 

                // 2. Base recovery (Suspicion drops if you stay still)
                let suspicionDelta = -5;

                // 3. Movement Check
                const hasMoved = (p.x !== oldX || p.y !== oldY);
                if (hasMoved) {
                    suspicionDelta = 5; // Base movement penalty
                    
                    // LORE WIN: Crouching is exhausting
                    p.stamina = Math.max(0, p.stamina - 1);
                    if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);

                    // Noisy Terrain Check
                    let tile = '.';
                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') tile = chunkManager.getTile(p.x, p.y);
                    else if (gameState.mapMode === 'dungeon') tile = chunkManager.caveMaps[gameState.currentCaveId]?.[p.y]?.[p.x] || '.';
                    else tile = chunkManager.castleMaps[gameState.currentCastleId]?.[p.y]?.[p.x] || '.';

                    if (['~', '≈', 'd', 'D', '🕸', '🏺'].includes(tile)) {
                        suspicionDelta += 10; // Extra noisy!
                    }
                    if (tile === 'F' && (!p.talents || !p.talents.includes('pathfinder'))) {
                        suspicionDelta += 5; // Rustling leaves
                    }
                }

                // 4. Lighting Check (Carrying a torch makes you highly visible!)
                const hasTorch = p.inventory.some(i => i && !i.isEquipped && (i.name === 'Torch' || i.name === 'Ever-Burning Candle'));
                if (hasTorch || p.candlelightTurns > 0) {
                    suspicionDelta += 15;
                }

                // 5. Proximity Check (Are enemies nearby looking at you?)
                let enemiesNearby = 0;
                const checkRadius = 4;
                
                if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                    if (gameState.instancedEnemies) {
                        enemiesNearby = gameState.instancedEnemies.filter(e => e && e.health > 0 && Math.abs(e.x - p.x) <= checkRadius && Math.abs(e.y - p.y) <= checkRadius).length;
                    }
                } else if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                    if (gameState.sharedEnemies) {
                        enemiesNearby = Object.values(gameState.sharedEnemies).filter(e => e && e.health > 0 && Math.abs(e.x - p.x) <= checkRadius && Math.abs(e.y - p.y) <= checkRadius).length;
                    }
                }

                if (enemiesNearby > 0) {
                    suspicionDelta += (enemiesNearby * 10);
                } else {
                    // Recover faster if no enemies are nearby
                    if (!hasMoved) suspicionDelta -= 5; 
                }

                // Apply Dexterity Mitigation
                if (suspicionDelta > 0) {
                    const dexMitigation = Math.floor(p.dexterity / 3);
                    suspicionDelta = Math.max(1, suspicionDelta - dexMitigation);
                }

                // Apply Delta
                p.suspicion = Math.max(0, Math.min(100, (p.suspicion || 0) + suspicionDelta));

                // 6. CAUGHT!
                if (p.suspicion >= 100) {
                    logMessage("{red:You've been spotted!}");
                    gameState.screenShake = 15;
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(p.x, p.y, "DETECTED", "#ef4444");
                    
                    this.toggleCrouch(); // Force stand up
                }

                this.updateUI();
            }
        };

        // ==========================================
        // 3. INPUT INTERCEPTION (Toggle Crouch)
        // ==========================================
        if (typeof window.handleInput === 'function') {
            const origHandleInput = window.handleInput;
            window.handleInput = function(key) {
                if (key.toLowerCase() === 'v' || key === 'Shift') {
                    window.StealthManager.toggleCrouch();
                    return; // Intercepted
                }
                return origHandleInput.call(this, key);
            };
        }

        // ==========================================
        // 4. TURN INTERCEPTION (Suspicion Tick)
        // ==========================================
        if (typeof window.attemptMovePlayer === 'function') {
            const origAttemptMove = window.attemptMovePlayer;
            window.attemptMovePlayer = async function(newX, newY) {
                const oldX = gameState.player.x;
                const oldY = gameState.player.y;
                
                await origAttemptMove.call(this, newX, newY);
                
                // Only process stealth if the move was actually successful (prevent spikes when bumping into walls)
                if (gameState.player.x !== oldX || gameState.player.y !== oldY) {
                    window.StealthManager.processTurn(oldX, oldY);
                }
            };
        }

        // Also process suspicion when passing time (Spacebar)
        if (typeof window.restPlayer === 'function') {
            const origRest = window.restPlayer;
            window.restPlayer = function() {
                origRest.apply(this);
                window.StealthManager.processTurn(gameState.player.x, gameState.player.y);
            };
        }

        // ==========================================
        // 5. PICKPOCKET INJECTION
        // ==========================================
        // We seamlessly hook into the interaction menu generated by the Syndicate expansion
        
        const origMakeMuggable = window.TILE_DATA['¥'] ? window.TILE_DATA['¥'].onInteract : null;
        
        if (origMakeMuggable) {
            const npcTiles = ['¥', '§', 'G', 'H'];
            npcTiles.forEach(tChar => {
                if (window.TILE_DATA[tChar]) {
                    const originalInteract = window.TILE_DATA[tChar].onInteract;
                    
                    window.TILE_DATA[tChar].onInteract = (state, x, y) => {
                        // Call the original (Syndicate) interact to build the modal
                        const res = originalInteract(state, x, y);
                        
                        // 🚨 BUG FIX: If Syndicate returned false (not crouching), pass the false downward!
                        if (res === false) return false;
                        
                        // Set a timeout to safely inject our button into the rendered modal
                        setTimeout(() => {
                            const mugBtn = document.getElementById('npcMugBtn');
                            if (mugBtn && !document.getElementById('npcPickpocketBtn')) {
                                
                                const ppBtn = document.createElement('button');
                                ppBtn.id = 'npcPickpocketBtn';
                                ppBtn.className = 'bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold py-3 px-4 rounded-xl w-full shadow-md transition-transform active:scale-95 border-b-4 border-fuchsia-900 active:border-b-0 active:mt-1 mb-3';
                                ppBtn.innerText = '✋ Pickpocket';
                                
                                // Validation
                                const p = state.player;
                                const isCrouching = p.isCrouching;
                                
                                if (!isCrouching) {
                                    ppBtn.disabled = true;
                                    ppBtn.classList.add('opacity-50', 'cursor-not-allowed');
                                    ppBtn.innerText = '✋ Pickpocket (Requires Crouch)';
                                }
                                
                                mugBtn.parentNode.insertBefore(ppBtn, mugBtn);
                                
                                ppBtn.onclick = () => {
                                    document.getElementById('loreModal').classList.add('hidden');
                                    
                                    // Dexterity Check vs Suspicion (Removed lockpick cost)
                                    const dex = p.dexterity + (p.dexterityBonus || 0);
                                    const chance = 0.60 + (dex * 0.05) - ((p.suspicion || 0) / 200);
                                    
                                    if (Math.random() < chance) {
                                        // SUCCESS
                                        const goldStolen = 50 + Math.floor(Math.random() * 150);
                                        p.coins += goldStolen;
                                        logMessage(`{green:Sleight of hand! You silently slipped ${goldStolen} gold from their pocket.}`);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(p.x, p.y, `+${goldStolen}g`, "#4ade80");
                                        
                                        // 10% chance for Blood Ruby
                                        if (Math.random() < 0.10) {
                                            const ruby = window.ITEM_DATA['💰b'];
                                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(p) : 9;
                                            if (p.inventory.length < invCap) {
                                                const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(ruby) : JSON.parse(JSON.stringify(ruby));
                                                newItem.templateId = '💰b'; newItem.quantity = 1; newItem.isEquipped = false;
                                                p.inventory.push(newItem);
                                                logMessage("{purple:You also snagged a Blood Ruby!}");
                                            }
                                        }
                                        
                                        // Increase suspicion massively because they are close
                                        p.suspicion = Math.min(99, (p.suspicion || 0) + 40);
                                        window.StealthManager.updateUI();
                                        
                                    } else {
                                        // FAILURE
                                        logMessage("{red:\"Thief! Guards!\" You've been caught!}");
                                        state.screenShake = 15;
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                        
                                        p.suspicion = 100;
                                        window.StealthManager.updateUI(); // This will trigger the detection loop and force stand-up
                                        
                                        p.bounty = (p.bounty || 0) + 500;
                                        logMessage("{gray:+500g Bounty added to your head.}");
                                        
                                        // Turn NPC into an enemy!
                                        const eData = window.ENEMY_DATA['b']; // Fallback to bandit
                                        const enemyId = `overworld:${x},${-y}`;
                                        const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, x, y) : eData;
                                        state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'b', x: x, y: y, name: "Angry Victim", spawnTime: Date.now() };
                                        
                                        if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(x, y, '.');
                                        state.mapDirty = true;
                                        
                                        if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(x, y, enemyId)).set(state.sharedEnemies[enemyId]);
                                    }
                                    
                                    if (typeof renderInventory === 'function') renderInventory();
                                    if (typeof playerRef !== 'undefined') playerRef.update({ coins: p.coins, bounty: p.bounty || 0, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory });
                                };
                            }
                        }, 20); // Small buffer to ensure Syndicate buttons rendered first
                        
                        return res;
                    };
                }
            });
        }

        // ==========================================
        // 6. LOCKED VAULT GENERATOR
        // ==========================================
        // Intercept Castle Generation to spawn secret Vault rooms!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCastle) {
            const origGenCastle = chunkManager.generateCastle;
            
            chunkManager.generateCastle = function(castleId, layoutType) {
                const map = origGenCastle.call(this, castleId, layoutType);
                
                // Only spawn in standard or dark castles
                if (!castleId.includes('village')) {
                    const random = Alea(stringToSeed(`vault_${castleId}`));
                    
                    // 50% chance to spawn a vault room
                    if (random() < 0.50) {
                        let carved = false;
                        for(let attempt = 0; attempt < 50 && !carved; attempt++) {
                            const cx = Math.floor(random() * (map[0].length - 6)) + 3;
                            const cy = Math.floor(random() * (map.length - 6)) + 3;
                            
                            // Check if 5x5 area is purely solid walls
                            let allWalls = true;
                            for(let dy=-2; dy<=2; dy++) {
                                for(let dx=-2; dx<=2; dx++) {
                                    if (map[cy+dy][cx+dx] !== '▓' && map[cy+dy][cx+dx] !== '▒') {
                                        allWalls = false; break;
                                    }
                                }
                                if(!allWalls) break;
                            }
                            
                            if (allWalls) {
                                // Carve 3x3 vault
                                for(let dy=-1; dy<=1; dy++) {
                                    for(let dx=-1; dx<=1; dx++) {
                                        map[cy+dy][cx+dx] = '.';
                                    }
                                }
                                // Place massive loot
                                map[cy][cx] = '📦'; 
                                map[cy-1][cx] = '📦';
                                map[cy+1][cx] = '📦';
                                map[cy][cx-1] = '💎';
                                map[cy][cx+1] = '$';
                                
                                // Add the Locked Door!
                                const dir = Math.floor(random() * 4);
                                if (dir===0) map[cy-2][cx] = '🔒';
                                if (dir===1) map[cy+2][cx] = '🔒';
                                if (dir===2) map[cy][cx-2] = '🔒';
                                if (dir===3) map[cy][cx+2] = '🔒';
                                carved = true;
                            }
                        }
                    }
                }
                return map;
            };
        }
        
        // Add Vault Door to minimap colors
        if (typeof TILE_COLOR_MAP !== 'undefined') {
            TILE_COLOR_MAP['🔒'] = [245, 158, 11, 255]; // Golden Yellow
        }
    }
});

// --- END OF FILE expansion-heist.js ---
