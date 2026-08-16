// --- START OF FILE expansion-pioneer.js ---

window.ExpansionManager.register({
    id: "pioneer_town",
    name: "The Pioneer (Town Builder)",
    version: "1.5", // Upgraded version!
    
    data: {
        // --- 1. NEW MAP TILES & NPCs ---
        tiles: {
            '🚷': { 
                type: 'landmark', name: 'Caged Prisoner', 
                flavor: "A rusty iron cage containing a weary captive.", 
                eventId: 'CAGED_PRISONER' 
            },
            '🛎️': {
                type: 'anomaly', name: 'Town Bell',
                flavor: "Ring to manage your settlement.",
                onInteract: (state, x, y) => {
                    if (typeof window.openTownBellUI === 'function') window.openTownBellUI();
                    return null;
                }
            },
            '🏠': {
                type: 'decoration', name: 'Cozy House',
                flavor: "A sturdy, well-built home for your townsfolk."
            },
            '⚒️t': {
                type: 'anomaly', name: 'Town Blacksmith',
                flavor: "Your personal blacksmith. He looks eager to work.",
                onInteract: (state, x, y) => {
                    if (typeof window.openCampBlacksmith === 'function') window.openCampBlacksmith();
                    return null;
                }
            },
            '👩‍🌾': {
                type: 'anomaly', name: 'Camp Botanist',
                flavor: "She is carefully tending to a potted sapling.",
                onInteract: (state, x, y) => {
                    if (typeof window.openCampBotanist === 'function') window.openCampBotanist();
                    return null;
                }
            },
            '🎸': {
                type: 'anomaly', name: 'Camp Bard',
                flavor: "He strums a lively tune by his doorway.",
                onInteract: (state, x, y) => {
                    if (typeof window.openCampBard === 'function') window.openCampBard();
                    return null;
                }
            }
        },

        // --- 2. THE EVENT LOGIC ---
        // 🌟 EXPANDABILITY WIN: Defined natively inside the expansion data payload!
        events: {
            'CAGED_PRISONER': {
                title: "Caged Prisoner",
                oncePerTile: true,
                lootedMessage: "The cage is broken and empty.",
                nodes: {
                    'start': {
                        text: "A weary traveler is locked inside a rusted iron cage. They look up at you with hope.\n\n\"Please! Get me out of here!\"",
                        choices: [
                            {
                                text: "Smash the cage open.",
                                // Requires 5 Strength OR any heavy tool
                                req: (player) => {
                                    const effStr = Number(player.strength) + (Number(player.strengthBonus) || 0);
                                    if (effStr >= 5) return true;
                                    return player.inventory.some(i => i && !i.isEquipped && (i.name.includes("Pickaxe") || i.name.includes("Hammer") || i.name.includes("Axe")));
                                },
                                reqHint: "5+ Str or Pickaxe/Axe/Hammer",
                                action: (state, ctx) => {
                                    if (!state.player.rescuedNpcs) state.player.rescuedNpcs = [];
                                    const pool = ['Blacksmith', 'Botanist', 'Bard'];
                                    const missing = pool.filter(n => !state.player.rescuedNpcs.includes(n));
                                    
                                    logMessage("{gray:CRASH! The rusted iron gives way.}");
                                    state.screenShake = 15;
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#d4d4d8', 15);

                                    if (missing.length > 0) {
                                        const rescued = missing[Math.floor(Math.random() * missing.length)];
                                        state.player.rescuedNpcs.push(rescued);
                                        logMessage(`{green:You rescued the ${rescued}! They thank you and head to your Safe Haven camp.}`);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playQuestComplete();
                                    } else {
                                        logMessage(`{green:You freed the traveler! They press a gem into your hand in thanks before fleeing.}`);
                                        state.player.coins += 100;
                                        
                                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                        
                                        const gems = ['💎r', '💎s', '💎d'];
                                        const gId = gems[Math.floor(Math.random() * gems.length)];
                                        const gName = gId === '💎r' ? 'Raw Ruby' : (gId === '💎s' ? 'Raw Sapphire' : 'Raw Diamond');
                                        
                                        // 🚨 BUG FIX & ROBUSTNESS WIN: Safe clone to prevent memory leaks from the global dictionary
                                        const template = typeof window.ITEM_DATA !== 'undefined' ? window.ITEM_DATA[gId] : null;
                                        const newItem = template && typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : { templateId: gId, name: gName, type: 'trade', quantity: 1, tile: '💎', isEquipped: false };
                                        
                                        if (state.player.inventory.length < invCap) {
                                            state.player.inventory.push(newItem);
                                            logMessage(`{purple:You received a ${gName} and 100 Gold!}`);
                                            if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                        } else {
                                            // 🚨 BUG FIX: Safe drop fallback so the gem isn't deleted into the void!
                                            logMessage(`{red:You received 100 Gold, but your pack is full! The ${gName} drops at your feet.}`);
                                            if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                                                window.EventManager.safeDropItem(state, ctx.x, ctx.y, '💎');
                                            }
                                        }
                                    }
                                    
                                    // Change the tile to a broken cage (rubble)
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') {
                                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(ctx.x, ctx.y, '🏚');
                                        else if (state.mapMode === 'dungeon') chunkManager.caveMaps[state.currentCaveId][ctx.y][ctx.x] = '🏚';
                                    }
                                    
                                    // Force immediate visual refresh so the cage actually disappears!
                                    state.mapDirty = true;
                                    if (typeof render === 'function') render();
                                }
                            },
                            { text: "Leave them to their fate." }
                        ]
                    }
                }
            }
        }
    },

    // --- 3. ENGINE HOOKS ---
    init: function() {
        
        // ==========================================
        // 1. INJECT INTO WORLD GENERATION
        // ==========================================
        // Sprinkle Caged Prisoners across the world and in dungeons
        
        if (typeof chunkManager !== 'undefined') {
            const origGenerateChunk = chunkManager.generateChunk;
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                // 🚨 ROBUSTNESS WIN: Safe PRNG fallback
                const random = (typeof Alea !== 'undefined' && typeof stringToSeed !== 'undefined') 
                    ? Alea(stringToSeed(`pioneer_spawn_${chunkId}`)) 
                    : Math.random;
                
                // 10% chance to spawn a cage in a chunk
                if (random() < 0.10) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    // Spawn primarily near forests or deadlands
                    if (chunkData[ry][rx] === 'F' || chunkData[ry][rx] === 'd') {
                        chunkData[ry][rx] = '🚷'; 
                    }
                }
            };
            
            const origGenerateCave = chunkManager.generateCave;
            chunkManager.generateCave = function(caveId) {
                const map = origGenerateCave.call(this, caveId);
                
                // 🚨 ROBUSTNESS WIN: Safe PRNG fallback
                const random = (typeof Alea !== 'undefined' && typeof stringToSeed !== 'undefined') 
                    ? Alea(stringToSeed(`pioneer_cave_${caveId}`)) 
                    : Math.random;
                
                // 25% chance to spawn a cage in a dungeon
                if (random() < 0.25 && !caveId.includes('arena') && !caveId.includes('spire')) {
                    let placed = false;
                    for(let i=0; i<50 && !placed; i++) {
                        const ry = Math.floor(random() * (map.length - 2)) + 1;
                        const rx = Math.floor(random() * (map[0].length - 2)) + 1;
                        // Only place on open floor away from the stairs
                        if ((map[ry][rx] === '.' || map[ry][rx] === 'F') && map[ry][rx] !== '>' && map[ry][rx] !== '<') {
                            map[ry][rx] = '🚷';
                            placed = true;
                        }
                    }
                }
                return map;
            };

            // ==========================================
            // 2. OVERHAUL CAMPSITE GENERATION
            // ==========================================
            // Safely inject the Town Bell, Houses, and NPCs without breaking existing structures
            
            const origGenerateCampsite = chunkManager.generateCampsite;
            chunkManager.generateCampsite = function() {
                const map = origGenerateCampsite.call(this);
                
                // Safety guard to ensure the engine has booted fully
                if (typeof gameState === 'undefined' || !gameState.player) return map;
                
                const p = gameState.player;
                const rescued = p.rescuedNpcs || [];
                const houses = p.builtHouses || [];

                // 🚨 BUG FIX & ROBUSTNESS: Strict Array Bound Check
                // Prevents a hard crash if another expansion shrunk the base player camp size!
                if (rescued.length > 0 && map[1] && map[1][6] !== undefined) {
                    map[1][6] = '🛎️';
                }

                // Place Blacksmith (Top Right)
                if (houses.includes('Blacksmith') && map[2] && map[3] && map[2][10] !== undefined) {
                    map[2][10] = '🏠';
                    map[3][10] = '⚒️t';
                }
                
                // Place Botanist (Bottom Right)
                if (houses.includes('Botanist') && map[5] && map[6] && map[5][10] !== undefined) {
                    map[5][10] = '🏠';
                    map[6][10] = '👩‍🌾';
                }
                
                // Place Bard (Bottom Left)
                if (houses.includes('Bard') && map[6] && map[7] && map[6][2] !== undefined) {
                    map[6][2] = '🏠';
                    map[7][2] = '🎸';
                }

                return map;
            };
        }

        // ==========================================
        // 3. TOWN MANAGEMENT UI & NPC INTERACTIONS
        // ==========================================
        
        window.openTownBellUI = function() {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            const p = gameState.player;
            if (!p.rescuedNpcs) p.rescuedNpcs = [];
            if (!p.builtHouses) p.builtHouses = [];
            
            const countMat = (name) => p.inventory.filter(i => i && i.name === name && !i.isEquipped).reduce((sum, i) => sum + i.quantity, 0);
            const wood = countMat('Wood Log');
            const stone = countMat('Stone');
            const iron = countMat('Iron Ore');

            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');

            if (!loreTitle || !loreContent || !loreModal) return;

            loreTitle.textContent = "Town Charter";
            
            let html = `<p class="text-sm muted-text mb-4 border-b border-gray-700 pb-2">Expand your settlement to house your rescued allies. (Current: ${wood} Wood, ${stone} Stone, ${iron} Iron)</p>`;
            let builtSomething = false;

            const addHouseBtn = (npcName, costStr, canAfford) => {
                const btnClass = canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed';
                html += `<button id="build_${npcName}" class="mb-3 ${btnClass} text-white font-bold py-3 px-4 rounded-xl w-full flex justify-between shadow-md transition-transform active:scale-95 border-b-4 border-gray-900 active:border-b-0 active:mt-1" ${canAfford ? '' : 'disabled'}>
                    <span>🏠 House ${npcName}</span> <span class="text-xs font-normal opacity-90">${costStr}</span>
                </button>`;
            };

            p.rescuedNpcs.forEach(npc => {
                if (!p.builtHouses.includes(npc)) {
                    builtSomething = true;
                    // Standard cost for all houses: 30 Wood, 30 Stone, 10 Iron
                    addHouseBtn(npc, '30 Wood, 30 Stone, 10 Iron', wood >= 30 && stone >= 30 && iron >= 10);
                }
            });

            if (!builtSomething && p.rescuedNpcs.length > 0) {
                html += `<p class="text-green-500 font-bold text-center mt-4 bg-green-900 bg-opacity-20 py-2 rounded shadow-inner border border-green-800">All rescued allies are safely housed!</p>`;
            } else if (p.rescuedNpcs.length === 0) {
                html += `<p class="muted-text italic text-center mt-4">You have not rescued anyone yet. Explore the world to find caged prisoners.</p>`;
            }

            loreContent.innerHTML = html;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                // 🚨 THE EXPLOIT FIX: Live counter to verify items immediately upon click!
                const countMatCurrent = (name) => p.inventory.filter(i => i && i.name === name && !i.isEquipped).reduce((sum, i) => sum + i.quantity, 0);

                const consume = (name, qty) => {
                    let needed = qty;
                    for (let i = p.inventory.length - 1; i >= 0; i--) {
                        if (needed <= 0) break;
                        let item = p.inventory[i];
                        if (item && item.name === name && !item.isEquipped) {
                            let take = Math.min(item.quantity, needed);
                            item.quantity -= take;
                            needed -= take;
                            if (item.quantity <= 0) p.inventory.splice(i, 1);
                        }
                    }
                };

                p.rescuedNpcs.forEach(npc => {
                    if (!p.builtHouses.includes(npc)) {
                        const btn = document.getElementById(`build_${npc}`);
                        if (btn) {
                            btn.onclick = () => {
                                // Re-verify at the exact moment of clicking
                                if (countMatCurrent('Wood Log') < 30 || countMatCurrent('Stone') < 30 || countMatCurrent('Iron Ore') < 10) {
                                    if (typeof logMessage === 'function') logMessage("{red:You lack the materials to build this!}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                    return;
                                }

                                btn.disabled = true; // Prevent double-clicks

                                consume('Wood Log', 30);
                                consume('Stone', 30);
                                consume('Iron Ore', 10);
                                
                                p.builtHouses.push(npc);
                                
                                // 🎨 JUICE WIN: Dynamic Build Animations!
                                if (typeof logMessage === 'function') logMessage(`{gold:You built a house for the ${npc}!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#facc15', 30);
                                if (typeof gameState !== 'undefined') gameState.screenShake = 15;
                                
                                const loreModal = document.getElementById('loreModal');
                                if (loreModal) loreModal.classList.add('hidden');
                                
                                // 🚨 BUG FIX WIN: Ensure the camp regenerates and redraws immediately in front of the player!
                                if (typeof chunkManager !== 'undefined') chunkManager.generateCampsite();
                                if (typeof gameState !== 'undefined') gameState.mapDirty = true;
                                if (typeof render === 'function') render();
                                if (typeof renderInventory === 'function') renderInventory();
                                
                                if (typeof triggerDebouncedSave === 'function') {
                                    triggerDebouncedSave({ builtHouses: p.builtHouses, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory });
                                }
                            };
                        }
                    }
                });
            }, 0);
        };

        // --- NPC: BLACKSMITH ---
        window.openCampBlacksmith = function() {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            const p = gameState.player;
            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');

            if (!loreTitle || !loreContent || !loreModal) return;

            loreTitle.textContent = "Town Blacksmith";
            loreContent.innerHTML = `
                <p class="italic muted-text mb-4 border-b border-gray-700 pb-2">"Thanks again for busting me out of that cage. The forge here is excellent. Need your gear maintained?"</p>
                <button id="buffWeapon" class="mb-3 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl w-full flex justify-between shadow-md transition-transform active:scale-95 border-b-4 border-red-900 active:border-b-0 active:mt-1">
                    <span>⚔️ Sharpen Blade</span> <span class="text-xs font-normal opacity-90">50 Gold</span>
                </button>
            `;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                const btn = document.getElementById('buffWeapon');
                if (btn) btn.onclick = () => {
                    if (p.coins < 50) {
                        if (typeof logMessage === 'function') logMessage("{red:You need 50 Gold to pay the Blacksmith.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }

                    // 🚨 EXPLOIT FIX: Multiplicative Buff Guard
                    // Prevents a player who drank a Berserker Potion (+10 Str, 20t) from speaking to the Blacksmith 
                    // and permanently locking in their massive +10 bonus for 500 turns!
                    if ((p.strengthBonus || 0) > 3) {
                        if (typeof logMessage === 'function') logMessage("{red:You are already under the effects of a more powerful enchantment!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }
                    
                    p.coins -= 50;
                    
                    // Assign fixed stats safely
                    p.strengthBonus = 3;
                    p.strengthBonusTurns = Math.max(p.strengthBonusTurns || 0, 500);
                    
                    if (typeof logMessage === 'function') logMessage("{red:The Blacksmith hones your weapons! (+3 Strength for 500 turns)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#ef4444', 15);
                    if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('strengthDisplay'), 'stat-pulse-green');
                    
                    if (typeof playerRef !== 'undefined') playerRef.update({ coins: p.coins, strengthBonus: p.strengthBonus, strengthBonusTurns: p.strengthBonusTurns });
                    if (typeof renderEquipment === 'function') renderEquipment();
                    if (typeof renderStats === 'function') renderStats(); 
                    loreModal.classList.add('hidden');
                };
            }, 0);
        };

        // --- NPC: BOTANIST ---
        window.openCampBotanist = function() {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            const p = gameState.player;
            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');

            if (!loreTitle || !loreContent || !loreModal) return;

            const currentDay = (gameState && gameState.time) ? gameState.time.day : 1;
            const canClaim = p.lastBotanistDay !== currentDay;

            loreTitle.textContent = "Town Botanist";
            
            let html = `<p class="italic muted-text mb-4 border-b border-gray-700 pb-2">"The soil here is incredibly rich! I've been doing some foraging around the perimeter."</p>`;
            
            if (canClaim) {
                html += `<button id="claimHerbs" class="mb-3 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl w-full flex justify-between shadow-md transition-transform active:scale-95 border-b-4 border-green-800 active:border-b-0 active:mt-1">
                    <span>🌿 Collect Daily Harvest</span> <span class="text-xs font-normal opacity-90">Free</span>
                </button>`;
            } else {
                html += `<button disabled class="mb-3 bg-gray-800 text-gray-500 font-bold py-3 px-4 rounded-xl w-full flex justify-between shadow-inner border border-gray-700 cursor-not-allowed">
                    <span>🌿 Harvest Collected</span> <span class="text-xs font-normal opacity-90">Come back tomorrow</span>
                </button>`;
            }

            loreContent.innerHTML = html;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                const btn = document.getElementById('claimHerbs');
                if (btn) btn.onclick = () => {
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(p) : 9;

                    // 🚨 LORE & GAMEPLAY WIN: Include Seed drops and Rare Items!
                    let itemsToGive = ['Medicinal Herb', 'Wildberry', 'Medicinal Herb', 'Wildberry', 'Herb Seed', 'Wildberry Seed', 'Bluecap Spore'];
                    if (Math.random() < 0.05) itemsToGive = ['Golden Apple', 'Luminous Spore', 'Moonbloom Bulb']; // 5% Rare drop!

                    const chosen = itemsToGive[Math.floor(Math.random() * itemsToGive.length)];
                    
                    // Fast O(1) template lookup
                    let tKey = null;
                    if (typeof getFarmItemKey === 'function') {
                        tKey = getFarmItemKey(chosen);
                    } else if (typeof window.ITEM_DATA !== 'undefined') {
                        tKey = Object.keys(window.ITEM_DATA).find(k => window.ITEM_DATA[k].name === chosen);
                    }
                    
                    const template = tKey ? window.ITEM_DATA[tKey] : null;
                    const existing = p.inventory.find(i => i && i.name === chosen && !i.isEquipped);
                    
                    // You get 1 of the rare stuff, but 2-4 of the regular stuff
                    const qty = ['Golden Apple', 'Luminous Spore', 'Moonbloom Bulb'].includes(chosen) ? 1 : (2 + Math.floor(Math.random() * 3)); 
                    
                    let itemGranted = false;

                    if (existing) {
                        existing.quantity += qty;
                        itemGranted = true;
                    } else if (template && p.inventory.length < invCap) {
                        // Safe deep clone to guarantee traits/effects don't bleed reference
                        const newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                        newItem.templateId = tKey;
                        newItem.quantity = qty;
                        newItem.isEquipped = false;
                        newItem.effect = template.effect || null;
                        newItem.onHit = template.onHit || null;
                        
                        p.inventory.push(newItem);
                        itemGranted = true;
                    }

                    p.lastBotanistDay = currentDay;
                    
                    if (itemGranted) {
                        if (typeof logMessage === 'function') logMessage(`{green:The Botanist hands you ${qty}x ${chosen}!}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                        if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#4ade80', 15);
                    } else {
                        // 🚨 BUG FIX: Safe drop fallback so harvest isn't permanently deleted!
                        if (typeof logMessage === 'function') logMessage(`{red:Your pack is full! The Botanist drops the ${chosen} on the ground.}`);
                        if (typeof window.EventManager !== 'undefined' && typeof window.EventManager.safeDropItem === 'function') {
                            window.EventManager.safeDropItem(gameState, p.x, p.y, template ? template.tile : '🌿');
                        }
                    }
                    
                    loreModal.classList.add('hidden');
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ lastBotanistDay: p.lastBotanistDay, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory });
                };
            }, 0);
        };

        // --- NPC: BARD ---
        window.openCampBard = function() {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            const p = gameState.player;
            const loreTitle = document.getElementById('loreTitle');
            const loreContent = document.getElementById('loreContent');
            const loreModal = document.getElementById('loreModal');

            if (!loreTitle || !loreContent || !loreModal) return;

            // 🎵 LORE WIN: Dynamic Bard Songs
            const songs = [
                "A lively tune about a rat that outsmarted a king.",
                "A sorrowful ballad for the ruined kingdom.",
                "A fast-paced jig about a dwarven brewmaster.",
                "A mysterious instrumental piece that reminds you of the ocean."
            ];
            const song = songs[Math.floor(Math.random() * songs.length)];

            loreTitle.textContent = "Town Bard";
            loreContent.innerHTML = `
                <p class="italic muted-text mb-4 border-b border-gray-700 pb-2">"Ah, the hero returns! Care to sit by the fire and listen to a song of your exploits?"<br><br><span class="text-blue-300 font-serif">He strums his lute. ${song}</span></p>
                <button id="buffBard" class="mb-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl w-full flex justify-between shadow-md transition-transform active:scale-95 border-b-4 border-blue-800 active:border-b-0 active:mt-1">
                    <span>🎵 Listen to Song</span> <span class="text-xs font-normal opacity-90">50 Gold</span>
                </button>
            `;
            loreModal.classList.remove('hidden');

            setTimeout(() => {
                const btn = document.getElementById('buffBard');
                if (btn) btn.onclick = () => {
                    if (p.coins < 50) {
                        if (typeof logMessage === 'function') logMessage("{red:You need 50 Gold to tip the Bard.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }
                    
                    // 🚨 EXPLOIT FIX: Multiplicative Buff Guard
                    if ((p.witsBonus || 0) > 3) {
                        if (typeof logMessage === 'function') logMessage("{red:You are already under the effects of a more powerful enchantment!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }
                    
                    p.coins -= 50;
                    
                    p.witsBonus = 3;
                    p.witsBonusTurns = Math.max(p.witsBonusTurns || 0, 500);
                    
                    if (typeof logMessage === 'function') logMessage("{blue:The Bard's tale inspires you! (+3 Wits for 500 turns)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(p.x, p.y, '#60a5fa', 15);
                    if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('witsDisplay'), 'stat-pulse-blue');
                    
                    if (typeof playerRef !== 'undefined') playerRef.update({ coins: p.coins, witsBonus: p.witsBonus, witsBonusTurns: p.witsBonusTurns });
                    if (typeof renderStats === 'function') renderStats(); 
                    loreModal.classList.add('hidden');
                };
            }, 0);
        };

        // --- MAP COLORS INJECTION ---
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🚷'] = [120, 113, 108, 255]; // Rusted Iron
            window.TILE_COLOR_MAP['🛎️'] = [250, 204, 21, 255];  // Gold Bell
            window.TILE_COLOR_MAP['🏠'] = [180, 83, 9, 255];    // Wood/Thatch
            window.TILE_COLOR_MAP['⚒️t'] = [156, 163, 175, 255]; // Blacksmith Gray
            window.TILE_COLOR_MAP['👩‍🌾'] = [34, 197, 94, 255];   // Botanist Green
            window.TILE_COLOR_MAP['🎸'] = [168, 85, 247, 255];  // Bard Purple
        }
    }
});

// --- END OF FILE expansion-pioneer.js ---
