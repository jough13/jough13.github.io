// --- START OF FILE events.js ---

// ==========================================
// EVENT & NARRATIVE ENGINE
// ==========================================

window.EVENT_DATA = {
    'CULT_HIDEOUT': {
        title: "Hidden Trapdoor",
        oncePerTile: false,
        nodes: {
            'start': {
                text: "You arrive at the coordinates from the ledger. Hidden beneath a pile of brush is a heavy wooden trapdoor bound in iron.\n\nYou hear chanting coming from below.",
                choices: [
                    {
                        text: "Kick the door open and attack!",
                        action: (state, ctx) => {
                            logMessage("{red:You kick the door open! The cultists shriek and attack!}");
                            state.screenShake = 20;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                            
                            // Spawn 3 Cultists in a ring around the trapdoor
                            const spawnSpots = [[-1, 0], [1, 0], [0, -1]];
                            for (let i = 0; i < 3; i++) {
                                const ex = ctx.x + spawnSpots[i][0];
                                const ey = ctx.y + spawnSpots[i][1];
                                
                                const enemyData = window.ENEMY_DATA['z']; // Fanatic
                                const enemyId = `overworld:${ex},${-ey}`;
                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyData, ex, ey) : enemyData;
                                
                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: 'z', x: ex, y: ey, spawnTime: Date.now() };
                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ex, ey, enemyId)).set(state.sharedEnemies[enemyId]);
                            }

                            // Clear the investigation
                            state.activeInvestigation = null;
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#ef4444', 15);
                        }
                    },
                    {
                        text: "Sneak inside and steal their loot.",
                        req: (player) => player.dexterity >= 5, // Requires 5 Dex to pass!
                        action: (state, ctx) => {
                            logMessage("{green:You slip into the shadows, bypassing the guards, and find their stash!}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                            
                            state.player.coins += 250;
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            if (state.player.inventory.length < invCap) {
                                const scroll = window.ITEM_DATA['🩸']; // Siphon Life
                                state.player.inventory.push({ ...scroll, templateId: '🩸', quantity: 1, tile: '🩸', isEquipped: false });
                                logMessage("{purple:You stole a Scroll of Siphoning and 250 Gold!}");
                            } else {
                                logMessage("{gold:You stole 250 Gold, but your pack is too full for the Scroll!}");
                            }

                            // Clear the investigation
                            state.activeInvestigation = null;
                        }
                    },
                    {
                        text: "Leave it alone for now."
                    }
                ]
            }
        }
    },
    'WOUNDED_KNIGHT': {
        title: "Wounded Knight",
        oncePerTile: false, 
        nodes: {
            'start': {
                text: "A royal knight slumps against a rock, clutching a bleeding wound.\n\n\"Traveler... the shadows... they took the caravan...\"",
                choices: [
                    {
                        text: "Take his offering.",
                        action: (state, ctx) => {
                            logMessage("{gray:The knight presses something into your hand before going still.}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHeal();
                            state.player.coins += 50;
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            if (state.player.inventory.length < invCap) {
                                const potion = window.ITEM_DATA['🍷']; 
                                state.player.inventory.push({ ...potion, templateId: '🍷', quantity: 1, tile: '🍷', isEquipped: false });
                                logMessage("{gold:You received an Elixir of Life and 50 Gold.}");
                            } else {
                                logMessage("{gold:You received 50 Gold, but your pack is too full for the Elixir!}");
                                if (state.mapMode === 'overworld') chunkManager.setWorldTile(ctx.x, ctx.y, '🍷', 24);
                            }
                            
                            // Turn the knight into a grave marker ONLY if on solid ground!
                            if (state.mapMode === 'overworld' || state.mapMode === 'underworld') {
                                const currentTile = chunkManager.getTile(ctx.x, ctx.y);
                                if (['.', 'F', 'd', 'D', '❄️', '🍄'].includes(currentTile)) {
                                    chunkManager.setWorldTile(ctx.x, ctx.y, '⚰️');
                                    state.mapDirty = true;
                                } else {
                                    // If standing on a bridge, just delete the knight anomaly
                                    chunkManager.setWorldTile(ctx.x, ctx.y, currentTile);
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    'ALTAR_OF_BLOOD': {
        title: 'Altar of Blood',
        oncePerTile: true,
        lootedMessage: "The altar is dormant. It has fed enough.",
        nodes: {
            'start': {
                text: "A jagged crimson stone. It whispers promises of power... for a price.\n\nThe Altar demands half of your current life force in exchange for a dark boon.",
                choices: [
                    {
                        text: "{red:Sacrifice Life Force}",
                        action: (state, ctx) => {
                            const sacrificeAmount = Math.floor(state.player.health / 2);
                            window.modifyVital('health', -sacrificeAmount);
                            
                            logMessage(`{red:You slash your palm over the altar! (-${sacrificeAmount} HP)}`);
                            state.screenShake = 20;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#ef4444', 30);

                            const roll = Math.random();
                            if (roll < 0.25) {
                                // 25% Chance it betrays you and spawns a Demon!
                                logMessage("{purple:The blood summons a horror from the Void!}");
                                const enemyTemplate = window.ENEMY_DATA['😈d'];
                                const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(enemyTemplate, ctx.x, ctx.y) : enemyTemplate;
                                const enemyId = `overworld:${ctx.x+1},${-ctx.y}`;
                                state.sharedEnemies[enemyId] = { ...scaledStats, tile: '😈d', x: ctx.x+1, y: ctx.y, spawnTime: Date.now() };
                                
                                if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ctx.x+1, ctx.y, enemyId)).set(state.sharedEnemies[enemyId]);
                            } else {
                                // 75% Chance for Epic/Legendary Loot or massive stat boost
                                if (Math.random() < 0.5) {
                                    state.player.bonusMaxHealth = (state.player.bonusMaxHealth || 0) + 3;
                                    if (typeof recalculateDerivedStats === 'function') recalculateDerivedStats();
                                    logMessage("{gold:The blood boils in your veins. Your vitality permanently increases! (+3 Max HP)}");
                                } else {
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    const loot = typeof generateMagicItem === 'function' ? generateMagicItem(5) : { name: 'Blood Blade', type: 'weapon', quantity: 1, damage: 10, tile: '🗡️', isEquipped: false };
                                    
                                    if (state.player.inventory.length < invCap) {
                                        state.player.inventory.push(loot);
                                        logMessage(`{purple:The altar regurgitates a dark weapon: ${loot.name}!}`);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                    } else {
                                        logMessage(`{red:The altar offers the ${loot.name}, but your pack is full! It drops to the ground.}`);
                                        if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(ctx.x, ctx.y, loot.tile || '🗡️', 24);
                                    }
                                }
                            }
                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "Step away."
                    }
                ]
            }
        }
    },
    'SHADY_SMUGGLER': {
        title: "Shady Smuggler",
        oncePerTile: false,
        nodes: {
            'start': {
                text: "A hooded figure motions for you to approach from the shadows.\n\n\"I got a mystery box. 100 Gold. You want it or not?\"",
                choices: [
                    {
                        text: "Buy Mystery Box (100 Gold)",
                        req: (player) => player.coins >= 100,
                        action: (state, ctx) => {
                            state.player.coins -= 100;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playCoin();
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            
                            const roll = Math.random();
                            if (roll < 0.2) {
                                logMessage("{red:You open the box... it's just rocks! You got scammed!}");
                            } else if (roll < 0.8) {
                                if (state.player.inventory.length < invCap) {
                                    logMessage("{green:You open the box and find a massive cache of supplies!}");
                                    state.player.inventory.push({ templateId: '♥', name: 'Healing Potion', type: 'consumable', quantity: 3, tile: '♥', effect: window.ITEM_DATA['♥'].effect, isEquipped: false });
                                } else {
                                    logMessage("{red:You open the box, but your inventory is full! The potions spill onto the ground.}");
                                }
                            } else {
                                logMessage("{purple:You open the box... A Legendary Artifact is inside!}");
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#facc15', 20);
                                
                                const loot = typeof generateMagicItem === 'function' ? generateMagicItem(5) : { name: 'Smuggler Blade', type: 'weapon', quantity: 1, damage: 8, tile: '🗡️', isEquipped: false };
                                
                                if (state.player.inventory.length < invCap) {
                                    state.player.inventory.push(loot);
                                } else {
                                    logMessage("{red:Your inventory is full! The artifact falls to the ground.}");
                                    if (state.mapMode === 'overworld' || state.mapMode === 'underworld') chunkManager.setWorldTile(ctx.x, ctx.y, loot.tile || '🗡️', 24);
                                }
                            }
                            
                            // Smuggler vanishes after trading
                            if (state.mapMode === 'overworld') chunkManager.setWorldTile(ctx.x, ctx.y, '.');
                            state.mapDirty = true;
                        }
                    },
                    {
                        text: "Leave him be."
                    }
                ]
            }
        }
    },
    'WHISPERING_MONOLITH': {
        title: "Whispering Monolith",
        oncePerTile: true,
        lootedMessage: "The runes are dark. It has nothing more to teach you.",
        nodes: {
            'start': {
                text: "A towering slab of black stone covered in glowing, shifting runes. The voices call to you.",
                choices: [
                    {
                        text: "Touch the monolith.",
                        action: (state, ctx) => {
                            logMessage("{purple:You touch the Monolith. Forbidden knowledge floods your mind!}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#a855f7', 30);
                            
                            state.screenShake = 15;
                            
                            // Huge XP burst but causes Madness
                            if (typeof grantXp === 'function') grantXp(1000);
                            state.player.madnessTurns = (state.player.madnessTurns || 0) + 5;
                            logMessage("{red:The sheer weight of the truth shatters your sanity! (Madness)}");

                            state.lootedTiles.add(ctx.tileId);
                        }
                    }
                ]
            }
        }
    },
    'FALLEN_TITAN': {
        title: "Fallen Titan",
        oncePerTile: true,
        lootedMessage: "You've already salvaged all the usable parts from this behemoth.",
        nodes: {
            'start': {
                text: "A rusted clockwork automaton the size of a castle, half-buried in the earth.",
                choices: [
                    {
                        text: "Pry loose the gears (Requires Pickaxe)",
                        req: (player) => player.inventory.some(i => i.name === 'Pickaxe' || i.name === 'Diamond Tipped Pickaxe'),
                        action: (state, ctx) => {
                            logMessage("{orange:You strike the rusted joints, prying loose valuable metals!}");
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#f59e0b', 15);

                            state.player.stamina = Math.max(0, state.player.stamina - 5);
                            
                            const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                            const yieldAmt = 3 + Math.floor(Math.random() * 3);
                            
                            // Give Iron Ore
                            const ironStack = state.player.inventory.find(i => i.name === 'Iron Ore' && !i.isEquipped);
                            if (ironStack) ironStack.quantity += yieldAmt;
                            else if (state.player.inventory.length < invCap) state.player.inventory.push({ templateId: '•', name: 'Iron Ore', type: 'junk', quantity: yieldAmt, tile: '•', isEquipped: false });
                            
                            // 30% chance for a Star-Metal Core
                            if (Math.random() < 0.30) {
                                logMessage("{purple:You found the Titan's power core! (Star-Metal Ore)}");
                                const starStack = state.player.inventory.find(i => i.name === 'Star-Metal Ore' && !i.isEquipped);
                                if (starStack) starStack.quantity += 1;
                                else if (state.player.inventory.length < invCap) state.player.inventory.push({ templateId: '☄️', name: 'Star-Metal Ore', type: 'junk', quantity: 1, tile: '☄️', isEquipped: false });
                            }

                            state.lootedTiles.add(ctx.tileId);
                        }
                    },
                    {
                        text: "Walk away."
                    }
                ]
            }
        }
    }
};

window.EventManager = {
    activeEvent: null,
    activeContext: null,

    startEvent: function(eventId, x, y) {
        const eventData = window.EVENT_DATA[eventId];
        if (!eventData) return;

        this.activeEvent = eventData;
        this.activeContext = { x: x, y: y, tileId: `${x},${-y}` };

        // Handle one-time events natively
        if (eventData.oncePerTile && gameState.lootedTiles.has(this.activeContext.tileId)) {
            logMessage(`{gray:${eventData.lootedMessage || "There is nothing more to do here."}}`);
            return;
        }

        this.renderNode('start');
    },

    renderNode: function(nodeId) {
        const node = this.activeEvent.nodes[nodeId];
        if (!node) {
            this.endEvent();
            return;
        }

        const loreTitle = document.getElementById('loreTitle');
        const loreContent = document.getElementById('loreContent');
        const loreModal = document.getElementById('loreModal');

        if (!loreTitle || !loreContent || !loreModal) return;

        loreTitle.textContent = this.activeEvent.title;

        // Use the global formatMenuText so colors parse properly!
        let html = `<p class="font-serif leading-relaxed text-gray-300 mb-6">${formatMenuText(node.text)}</p>`;
        html += `<div class="space-y-3">`;

        node.choices.forEach((choice, index) => {
            const meetsReq = choice.req ? choice.req(gameState.player, this.activeContext) : true;
            const btnClass = meetsReq ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-800 active:border-b-0 active:mt-1' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-75 border-gray-700';
            
            html += `<button id="evt-btn-${index}" class="w-full ${btnClass} font-bold py-3 px-4 rounded-xl shadow-md transition-transform border-b-4 ${meetsReq ? 'active:scale-95' : ''}" ${meetsReq ? '' : 'disabled'}>
                ${formatMenuText(choice.text)}
            </button>`;
        });

        html += `</div>`;
        loreContent.innerHTML = html;
        loreModal.classList.remove('hidden');

        // Attach listeners securely
        setTimeout(() => {
            node.choices.forEach((choice, index) => {
                const btn = document.getElementById(`evt-btn-${index}`);
                if (btn && !btn.disabled) {
                    btn.onclick = () => {
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
                        this.executeChoice(choice);
                    };
                }
            });
        }, 0);
    },

    executeChoice: function(choice) {
        // Execute dynamic code modifications
        if (choice.action) {
            choice.action(gameState, this.activeContext);
        }

        // Navigate the tree
        if (choice.nextNode) {
            this.renderNode(choice.nextNode);
        } else {
            this.endEvent();
        }
    },

    endEvent: function() {
        this.activeEvent = null;
        this.activeContext = null;
        const loreModal = document.getElementById('loreModal');
        if (loreModal) loreModal.classList.add('hidden');
        
        // Force full engine refresh to catch inventory/stat modifications
        if (typeof render === 'function') render();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderStats === 'function') renderStats();
        if (typeof syncPlayerState === 'function') syncPlayerState();
        
        // Push state changes to Firebase via Debouncer
        if (typeof triggerDebouncedSave === 'function') {
            triggerDebouncedSave({
                inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
                coins: gameState.player.coins,
                health: gameState.player.health,
                stamina: gameState.player.stamina,
                lootedTiles: Object.fromEntries(gameState.lootedTiles)
            });
        }
    }
};
// --- END OF FILE events.js ---
