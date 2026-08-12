// --- START OF FILE alchemy.js ---

window.ExpansionManager.register({
    id: "alchemy_and_throwables",
    name: "Alchemy & Throwables",
    version: "1.3", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🧪v': {
                name: 'Venom Flask', type: 'consumable', tile: '🧪', pColor: '#22c55e', pSize: 20,
                description: "Throw to shatter, splashing a 3x3 area with toxins. Poisons enemies.",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{green:Select a direction to throw the Venom Flask... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Venom Flask'; 
                    return false; 
                }
            },
            '🧪a': {
                name: 'Acid Flask', type: 'consumable', tile: '🧪', pColor: '#4ade80', pSize: 25,
                description: "Throw to melt armor. Deals massive 3x3 Poison damage. Highly effective vs machines/metal.",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{green:Select a direction to throw the Acid Flask... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Acid Flask';
                    return false;
                }
            },
            '💣s': {
                name: 'Smoke Bomb', type: 'consumable', tile: '💣', pColor: '#9ca3af', pSize: 30,
                description: "Throw to create a 3x3 cloud. Stuns enemies for 2 turns. Grants you Stealth if caught in the blast.",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{gray:Select a direction to throw the Smoke Bomb... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Smoke Bomb';
                    return false;
                }
            },
            '🧪h': {
                name: 'Holy Water', type: 'consumable', tile: '🧪', pColor: '#facc15', pSize: 30,
                description: "Throw to bless a 3x3 area. Incinerates Undead/Demons. Heals you if caught in the blast.",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{gold:Select a direction to throw the Holy Water... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Holy Water';
                    return false;
                }
            },
            '🧪vf': {
                name: 'Void-Fire Flask', type: 'consumable', tile: '🧪', pColor: '#a855f7', pSize: 40,
                description: "Throw to unleash a 3x3 inferno of dark fire. Deals massive Fire and Psychic damage.",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{purple:Select a direction to throw the Void-Fire Flask... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Void-Fire Flask';
                    return false;
                }
            },
            '🧪str': {
                name: 'Elixir of Strength', type: 'buff_potion', tile: '🧪',
                description: "A potent brew. {red:+8 Strength for 30 turns.}",
                effect: (state) => {
                    if (state.player.strengthBonusTurns > 0 || state.player.defenseBonusTurns > 0) {
                        if (typeof logMessage === 'function') logMessage("{red:Your body is already under the effects of a powerful concoction!}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    state.player.strengthBonus = 8;
                    state.player.strengthBonusTurns = 30;
                    if (typeof logMessage === 'function') logMessage("{red:You feel an overwhelming surge of physical power! (+8 Str)}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(state.player.x, state.player.y, '#ef4444', 15);
                    return true;
                }
            },
            // --- EXPANSION WIN: New Tactical Throwable ---
            '💣f': {
                name: 'Flash Powder', type: 'consumable', tile: '💣', pColor: '#ffffff', pSize: 50, _rarity: 'rare',
                description: "Throw to detonate a massive blinding flash. Stuns all enemies in a huge 5x5 radius.",
                effect: (state) => {
                    if (typeof logMessage === 'function') logMessage("{yellow:Select a direction to throw the Flash Powder... (WASD/Arrows)}");
                    state.isAiming = true;
                    state.abilityToAim = 'throwPotion_Flash Powder';
                    return false;
                }
            }
        },

        // --- 2. THE ALCHEMY MORTAR TILE ---
        tiles: {
            '⚗️': {
                type: 'workbench',
                title: 'Alchemy Mortar',
                flavor: "A heavy stone mortar and pestle, stained with vibrant liquids.",
                onInteract: (state, x, y) => {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.2, 0.05, 1000); // Grinding sound
                    if (typeof openCraftingModal === 'function') openCraftingModal('alchemy');
                    return null;
                }
            }
        },

        // --- 3. RECIPES ---
        // 🌟 EXPANDABILITY WIN: Native dictionary injection!
        alchemyRecipes: {
            "Minor Healing Potion": { materials: { "Medicinal Herb": 2, "Clean Water": 1 }, xp: 15, level: 1, yield: 1 },
            "Venom Flask": { materials: { "Snake Fang": 2, "Dirty Water": 1 }, xp: 25, level: 1, yield: 2 },
            "Acid Flask": { materials: { "Sludge Eel": 1, "Spider Silk": 1, "Empty Bottle": 1 }, xp: 40, level: 2, yield: 2 },
            "Smoke Bomb": { materials: { "Bat Wing": 2, "Wood Log": 1, "Stone": 1 }, xp: 35, level: 2, yield: 2 },
            "Holy Water": { materials: { "Clean Water": 2, "Moonbloom Petal": 1, "Bone Shard": 1 }, xp: 60, level: 3, yield: 1 },
            "Elixir of Strength": { materials: { "Orc Tusk": 2, "Wildberry": 3, "Clean Water": 1 }, xp: 50, level: 3, yield: 1 },
            "Void-Fire Flask": { materials: { "Void Dust": 2, "Fire Elemental Core": 1, "Empty Bottle": 1 }, xp: 100, level: 4, yield: 1 },
            "Flash Powder": { materials: { "Void Dust": 2, "Stone": 2 }, xp: 50, level: 3, yield: 2 }
        }
    },

    // --- 4. ENGINE HOOKS ---
    init: function() {
        
        // --- HOMESTEAD INJECTION ---
        // Seamlessly adds the Mortar to the camp generation map
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCampsite) {
            const originalGenerateCampsite = chunkManager.generateCampsite;
            chunkManager.generateCampsite = function() {
                const map = originalGenerateCampsite.call(this); // Call original base layout
                const upgrades = gameState.player.campsiteUpgrades || [];
                
                // Place the mortar next to the workbench
                if (upgrades.includes('mortar')) map[4][2] = '⚗️'; 
                return map;
            };
        }

        // Seamlessly inject the Mortar purchase button into the Camp Ledger!
        setTimeout(() => {
            if (typeof window.TILE_DATA !== 'undefined' && window.TILE_DATA['📋']) {
                const originalLedgerInteract = window.TILE_DATA['📋'].onInteract;
                
                window.TILE_DATA['📋'].onInteract = (state, x, y) => {
                    const res = originalLedgerInteract(state, x, y); // Open the normal modal first
                    
                    // Wait 10ms for the DOM to populate, then inject our custom button
                    setTimeout(() => {
                        const loreContent = document.getElementById('loreContent');
                        
                        // 🚨 BUG FIX WIN: Anti-Duplication Guard
                        // Prevents the button from spawning twice if the player double-clicks the ledger!
                        if (loreContent && loreContent.innerHTML.includes('Invest materials') && !document.getElementById('btn_mortar')) {
                            const p = state.player;
                            const upg = p.campsiteUpgrades || [];
                            
                            if (!upg.includes('mortar')) {
                                const countMat = (name) => p.inventory.filter(i => i && i.name === name && !i.isEquipped).reduce((sum, i) => sum + i.quantity, 0);
                                const wood = countMat('Wood Log');
                                const stone = countMat('Stone');
                                
                                const canAfford = wood >= 10 && stone >= 15;
                                const btnClass = canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 opacity-50 cursor-not-allowed';
                                
                                const btnHtml = `<button id="btn_mortar" class="mb-2 ${btnClass} text-white font-bold py-2 px-4 rounded w-full flex justify-between shadow transition-transform active:scale-95 border-b-2 active:border-b-0 active:mt-0.5" ${canAfford ? '' : 'disabled'}>
                                    <span>Build Alchemy Mortar</span> <span class="text-xs font-normal">10 Wood, 15 Stone</span>
                                </button>`;
                                
                                loreContent.insertAdjacentHTML('beforeend', btnHtml);
                                
                                // Bind Click Event
                                const btn = document.getElementById('btn_mortar');
                                if (btn) {
                                    btn.onclick = () => {
                                        let wNeeded = 10, sNeeded = 15;
                                        for (let i = p.inventory.length - 1; i >= 0; i--) {
                                            let item = p.inventory[i];
                                            if (item && !item.isEquipped) {
                                                if (item.name === 'Wood Log' && wNeeded > 0) {
                                                    let take = Math.min(item.quantity, wNeeded);
                                                    item.quantity -= take; wNeeded -= take;
                                                    if (item.quantity <= 0) p.inventory.splice(i, 1);
                                                } else if (item.name === 'Stone' && sNeeded > 0) {
                                                    let take = Math.min(item.quantity, sNeeded);
                                                    item.quantity -= take; sNeeded -= take;
                                                    if (item.quantity <= 0) p.inventory.splice(i, 1);
                                                }
                                            }
                                        }
                                        p.campsiteUpgrades.push('mortar');
                                        if (typeof logMessage === 'function') logMessage('{green:Campsite upgraded: ALCHEMY MORTAR!}');
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                                        document.getElementById('loreModal').classList.add('hidden');
                                        
                                        if (typeof chunkManager !== 'undefined') chunkManager.generateCampsite();
                                        gameState.mapDirty = true;
                                        if (typeof render === 'function') render();
                                        if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ campsiteUpgrades: p.campsiteUpgrades, inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : p.inventory });
                                        if (typeof renderInventory === 'function') renderInventory();
                                    };
                                }
                            }
                        }
                    }, 10);
                    return res;
                };
            }
        }, 500);


        // --- THROWING PHYSICS & COMBAT LOGIC ---
        // Hook this directly to the window so input.js can trigger it seamlessly
        window.executeThrowPotion = async function(abilityId, dirX, dirY) {
            const player = gameState.player;
            const potionName = abilityId.replace('throwPotion_', '');
            
            // LOCK THE ENGINE
            if (isProcessingMove) return;

            try {
                isProcessingMove = true;
                // 1. Consume the Potion from Inventory
                const invIndex = player.inventory.findIndex(i => i && i.name === potionName && !i.isEquipped);
                let potionTemplate = null;

                if (invIndex > -1) {
                    potionTemplate = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[player.inventory[invIndex].templateId || ''] : null;
                    
                    // Consume the flask
                    player.inventory[invIndex].quantity--;
                    
                    // Safe Bottle Drop
                    // If the player drinks/throws a flask, we MUST give them the empty bottle back safely!
                    if (potionTemplate && (potionTemplate.tile === '🧪' || potionTemplate.name.includes('Flask'))) {
                        const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(player) : 9;
                        const emptyStack = player.inventory.find(i => i && i.name === 'Empty Bottle' && !i.isEquipped);
                        
                        // Did consuming the flask free up a slot entirely?
                        const freesSlot = (player.inventory[invIndex].quantity <= 0) ? 1 : 0;
                        
                        if (emptyStack) {
                            emptyStack.quantity++;
                        } else if (player.inventory.length - freesSlot < invCap) {
                            player.inventory.push({ templateId: '🫙', name: 'Empty Bottle', type: 'consumable', quantity: 1, tile: '🫙' });
                        } else {
                            if (typeof logMessage === 'function') logMessage("{red:Inventory full! The Empty Bottle drops to the ground.}");
                            
                            // 🚨 BUG FIX WIN: Safe Outward Spiral Drop
                            // If the inventory was full, the engine dropped the bottle directly onto the player's coordinate.
                            // If the player was standing on a dungeon exit ('<'), it permanently overwrote the stairs!
                            // This ensures the bottle scatters to an adjacent empty floor tile.
                            let placed = false;
                            let validFloor = '.';
                            if (gameState.mapMode === 'dungeon' && typeof CAVE_THEMES !== 'undefined' && CAVE_THEMES[gameState.currentCaveTheme]) {
                                validFloor = CAVE_THEMES[gameState.currentCaveTheme].floor;
                            }

                            if (typeof chunkManager !== 'undefined') {
                                for (let r = 0; r <= 2 && !placed; r++) {
                                    for (let dy = -r; dy <= r && !placed; dy++) {
                                        for (let dx = -r; dx <= r && !placed; dx++) {
                                            const tx = player.x + dx;
                                            const ty = player.y + dy;
                                            let tileAt;
                                            if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') tileAt = chunkManager.getTile(tx, ty);
                                            else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[ty]?.[tx];
                                            else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[ty]?.[tx];

                                            if (tileAt === validFloor || tileAt === '.') {
                                                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(tx, ty, '🫙', 24);
                                                else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][ty][tx] = '🫙';
                                                else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][ty][tx] = '🫙';
                                                placed = true;
                                            }
                                        }
                                    }
                                }
                                if (!placed) { // Absolute fallback
                                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') chunkManager.setWorldTile(player.x, player.y, '🫙', 24);
                                    else if (gameState.mapMode === 'dungeon') chunkManager.caveMaps[gameState.currentCaveId][player.y][player.x] = '🫙';
                                    else if (gameState.mapMode === 'castle') chunkManager.castleMaps[gameState.currentCastleId][player.y][player.x] = '🫙';
                                }
                                gameState.mapDirty = true;
                            }
                        }
                    }
                    
                    // Now safely splice the original item if it's completely depleted
                    if (player.inventory[invIndex].quantity <= 0) {
                        player.inventory.splice(invIndex, 1);
                    }
                    
                    // 🚨 PERFORMANCE WIN: Explicitly save the ENTIRE serialized inventory array here!
                    // If we don't, a player who throws their very last potion (triggering a splice deletion)
                    // and then refreshes their page will get the potion back, resulting in infinite potions!
                    if (typeof triggerDebouncedSave === 'function') {
                        triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory });
                    }
                } else {
                    if (typeof logMessage === 'function') logMessage(`{red:You are out of ${potionName}s.}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return; 
                }

                // 2. Raycast to find landing zone (Max Range: 4 tiles)
                let targetX = player.x;
                let targetY = player.y;

                for (let i = 1; i <= 4; i++) {
                    const checkX = player.x + (dirX * i);
                    const checkY = player.y + (dirY * i);

                    // Draw a faint dust trail to show the arc
                    if (typeof ParticleSystem !== 'undefined') {
                        setTimeout(() => { ParticleSystem.spawn(checkX, checkY, '#9ca3af', 'dust', '', 2); }, i * 30);
                    }

                    let tileAt = '.';
                    if (typeof chunkManager !== 'undefined') {
                        if (gameState.mapMode === 'overworld') tileAt = chunkManager.getTile(checkX, checkY);
                        else if (gameState.mapMode === 'dungeon') tileAt = chunkManager.caveMaps[gameState.currentCaveId]?.[checkY]?.[checkX] || ' ';
                        else if (gameState.mapMode === 'castle') tileAt = chunkManager.castleMaps[gameState.currentCastleId]?.[checkY]?.[checkX] || ' ';
                    }

                    // If it hits a solid wall, the flask shatters one tile BEFORE the wall!
                    if (['▓', '▒', '🧱', '^'].includes(tileAt)) {
                        break; 
                    }
                    
                    targetX = checkX;
                    targetY = checkY;
                }

                // 3. Trigger Specific Potion Effects!
                const batchedPayload = {};
                
                // Wait for the "travel time" to finish visually before exploding
                await new Promise(resolve => setTimeout(resolve, 150));
                
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.3, 0.1, 3000); // Glass shatter

                const explosionColor = (potionTemplate && potionTemplate.pColor) ? potionTemplate.pColor : '#ffffff';
                const explosionSize = (potionTemplate && potionTemplate.pSize) ? potionTemplate.pSize : 20;

                // --- VENOM FLASK ---
                if (potionName === 'Venom Flask') {
                    if (typeof logMessage === 'function') logMessage("{green:The flask shatters, spraying toxic venom!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize);
                    
                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            // Friendly Fire!
                            if (x === player.x && y === player.y && !gameState.godMode) {
                                if (typeof logMessage === 'function') logMessage("{green:You are splashed by your own venom!}");
                                player.poisonTurns = 3;
                                if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('healthDisplay'), false);
                                continue;
                            }
                            if (typeof applySpellDamage === 'function') {
                                const res = await applySpellDamage(x, y, 10, 'poisonBolt', true);
                                if (res && res.hit) Object.assign(batchedPayload, res.payload);
                            }
                        }
                    }
                }
                // --- ACID FLASK ---
                else if (potionName === 'Acid Flask') {
                    if (typeof logMessage === 'function') logMessage("{green:The flask erupts in corrosive acid!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize);
                    
                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            if (x === player.x && y === player.y && !gameState.godMode) {
                                if (typeof logMessage === 'function') logMessage("{green:The acid burns your skin! (-10 HP)}");
                                if (typeof window.modifyVital === 'function') window.modifyVital('health', -10);
                                player.poisonTurns = 2;
                                if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('healthDisplay'), false);
                                continue;
                            }
                            if (typeof applySpellDamage === 'function') {
                                const res = await applySpellDamage(x, y, 20, 'poisonBolt', true);
                                if (res && res.hit) Object.assign(batchedPayload, res.payload);
                            }
                        }
                    }
                }
                // --- SMOKE BOMB ---
                else if (potionName === 'Smoke Bomb') {
                    if (typeof logMessage === 'function') logMessage("{gray:A thick cloud of smoke erupts!}");
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize); 
                    }
                    
                    if (Math.abs(targetX - player.x) <= 1 && Math.abs(targetY - player.y) <= 1) {
                        if (typeof logMessage === 'function') logMessage("{gray:You vanish into the smoke screen! (Stealth)}");
                        player.stealthTurns = 5;
                    }

                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                                let enemy = gameState.instancedEnemies.find(e => e && e.x === x && e.y === y && e.health > 0);
                                if (enemy) {
                                    enemy.stunTurns = 2;
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "DAZED", "#9ca3af");
                                }
                            } else {
                                const enemyId = `overworld:${x},${-y}`;
                                if (gameState.sharedEnemies && gameState.sharedEnemies[enemyId]) {
                                    const liveEnemy = gameState.sharedEnemies[enemyId];
                                    let enemyData = JSON.parse(JSON.stringify(liveEnemy));
                                    enemyData.stunTurns = 2; // Inject Stun!
                                    
                                    if (typeof EnemyNetworkManager !== 'undefined') {
                                        batchedPayload[EnemyNetworkManager.getPath(x, y, enemyId)] = enemyData;
                                    }
                                    
                                    gameState.sharedEnemies[enemyId].stunTurns = 2;
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "DAZED", "#9ca3af");
                                }
                            }
                        }
                    }
                }
                // --- FLASH POWDER (NEW) ---
                else if (potionName === 'Flash Powder') {
                    if (typeof logMessage === 'function') logMessage("{yellow:A blinding flash erupts!}");
                    if (typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize); 
                    }
                    gameState.screenFlash = { color: '#ffffff', alpha: 1.0, decay: 0.05 };
                    gameState.screenShake = 10;
                    
                    // Massive 5x5 Stun Area!
                    for (let y = targetY - 2; y <= targetY + 2; y++) {
                        for (let x = targetX - 2; x <= targetX + 2; x++) {
                            if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                                let enemy = gameState.instancedEnemies.find(e => e && e.x === x && e.y === y && e.health > 0);
                                if (enemy) {
                                    enemy.stunTurns = 3;
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "BLINDED", "#facc15");
                                }
                            } else {
                                const enemyId = `overworld:${x},${-y}`;
                                if (gameState.sharedEnemies && gameState.sharedEnemies[enemyId]) {
                                    const liveEnemy = gameState.sharedEnemies[enemyId];
                                    let enemyData = JSON.parse(JSON.stringify(liveEnemy));
                                    enemyData.stunTurns = 3; 
                                    
                                    if (typeof EnemyNetworkManager !== 'undefined') {
                                        batchedPayload[EnemyNetworkManager.getPath(x, y, enemyId)] = enemyData;
                                    }
                                    
                                    gameState.sharedEnemies[enemyId].stunTurns = 3;
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(x, y, "BLINDED", "#facc15");
                                }
                            }
                        }
                    }
                }
                // --- HOLY WATER ---
                else if (potionName === 'Holy Water') {
                    if (typeof logMessage === 'function') logMessage("{gold:The Holy Water erupts in a blinding flash of light!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize);
                    gameState.screenShake = 10;
                    
                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            if (x === player.x && y === player.y) {
                                if (typeof window.modifyVital === 'function') {
                                    const actualHeal = window.modifyVital('health', 15);
                                    if (actualHeal > 0) {
                                        if (typeof logMessage === 'function') logMessage(`{green:The holy waters cleanse your wounds! (+${actualHeal} HP)}`);
                                        if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('healthDisplay'), 'stat-pulse-green');
                                    }
                                }
                                continue; 
                            }
                            if (typeof applySpellDamage === 'function') {
                                const res = await applySpellDamage(x, y, 30, 'divineLight', true);
                                if (res && res.hit) Object.assign(batchedPayload, res.payload);
                            }
                        }
                    }
                }
                // --- VOID-FIRE FLASK ---
                else if (potionName === 'Void-Fire Flask') {
                    if (typeof logMessage === 'function') logMessage("{purple:A terrifying vortex of dark fire consumes the area!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize);
                    gameState.screenShake = 20;
                    
                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            if (x === player.x && y === player.y && !gameState.godMode) {
                                if (typeof logMessage === 'function') logMessage("{purple:You are caught in your own void inferno! (-20 HP)}");
                                if (typeof window.modifyVital === 'function') window.modifyVital('health', -20);
                                player.burnTurns = 3;
                                if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('healthDisplay'), false);
                                continue;
                            }
                            if (typeof applySpellDamage === 'function') {
                                const res = await applySpellDamage(x, y, 40, 'fireball', true);
                                if (res && res.hit) Object.assign(batchedPayload, res.payload);
                            }
                        }
                    }
                }
                // --- GLACIAL SHARD ---
                // 🚨 BUG FIX WIN: The Glacial Shard actually executes here!
                else if (potionName === 'Glacial Shard') {
                    if (typeof logMessage === 'function') logMessage("{cyan:The shard shatters, erupting in a blast of freezing wind!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize);
                    gameState.screenShake = 10;
                    
                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            if (x === player.x && y === player.y && !gameState.godMode) {
                                if (typeof logMessage === 'function') logMessage("{cyan:You are caught in the freezing blast!}");
                                player.frostbiteTurns = 5;
                                if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('staminaDisplay'), false);
                                continue;
                            }
                            if (typeof applySpellDamage === 'function') {
                                // Maps directly to the 'frostBolt' logic in the engine so it naturally extinguishes fires and creates ice bridges!
                                const res = await applySpellDamage(x, y, 15, 'frostBolt', true);
                                if (res && res.hit) Object.assign(batchedPayload, res.payload);
                            }
                        }
                    }
                }
                // --- BONE HARPOON (From Monster Hunter) ---
                else if (potionName === 'Bone Harpoon') {
                    if (typeof logMessage === 'function') logMessage("{red:The heavy harpoon strikes the ground violently!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(targetX, targetY, explosionColor, explosionSize);
                    gameState.screenShake = 15;
                    
                    for (let y = targetY - 1; y <= targetY + 1; y++) {
                        for (let x = targetX - 1; x <= targetX + 1; x++) {
                            if (x === player.x && y === player.y && !gameState.godMode) {
                                if (typeof logMessage === 'function') logMessage("{red:You impaled your own foot! (-10 HP)}");
                                if (typeof window.modifyVital === 'function') window.modifyVital('health', -10);
                                if (typeof triggerStatFlash === 'function') triggerStatFlash(document.getElementById('healthDisplay'), false);
                                continue;
                            }
                            if (typeof applySpellDamage === 'function') {
                                // Uses 'poisonBolt' as a proxy to inflict the bleeding/poison dot naturally
                                const res = await applySpellDamage(x, y, 25, 'poisonBolt', true);
                                if (res && res.hit) Object.assign(batchedPayload, res.payload);
                            }
                        }
                    }
                }

                // Push the entire AoE payload to Firebase instantly
                if (Object.keys(batchedPayload).length > 0 && typeof rtdb !== 'undefined') {
                    rtdb.ref().update(batchedPayload).catch(e => console.error("Alchemy Batch Error:", e));
                }
                
                // Finalize Turn
                gameState.isAiming = false;

                // Prevent rendering alive UI if splashed by your own lethal potion!
                if (gameState.player.health <= 0 || gameState.isDead) return;
                
                // Push newly acquired debuffs/buffs via debouncer
                if (typeof triggerDebouncedSave === 'function') {
                    triggerDebouncedSave({
                        health: player.health,
                        poisonTurns: player.poisonTurns,
                        burnTurns: player.burnTurns,
                        stealthTurns: player.stealthTurns,
                        frostbiteTurns: player.frostbiteTurns
                    });
                }
                
                if (typeof endPlayerTurn === 'function') endPlayerTurn();
                if (typeof render === 'function') render();
                if (typeof renderInventory === 'function') renderInventory();
                if (typeof renderHotbar === 'function') renderHotbar();

            } finally {
                isProcessingMove = false;
            }
        };

    }
});

// --- END OF FILE alchemy.js ---
