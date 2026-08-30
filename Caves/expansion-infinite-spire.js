// --- START OF FILE expansion-infinite-spire.js ---

window.ExpansionManager.register({
    id: "infinite_spire",
    name: "The Infinite Spire (Roguelike Endgame)",
    version: "1.1", // Upgraded version!
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🧿t': { 
                name: 'Spire Token', type: 'trade', tile: '🧿', 
                description: "Crystallized suffering. The currency of the Infinite Spire.", _rarity: 'epic' 
            },
            '⚔️i': {
                name: 'Infinity Blade', type: 'weapon', tags: ['blade'], tile: '⚔️',
                damage: 25, slot: 'weapon', statBonuses: { strength: 10, luck: 10 },
                description: "{red:+25 Dmg}, {green:+10 Str}, {gold:+10 Luck}. Forged outside of time.", _rarity: 'legendary', excludeFromLoot: true
            },
            '🛡️e': {
                name: 'Aegis of Eternity', type: 'armor', tags: ['shield'], tile: '🛡️',
                defense: 15, slot: 'armor', statBonuses: { constitution: 10, maxHealth: 50 },
                description: "{blue:+15 Def}, {green:+10 Con, +50 Max HP}. Unbreakable.", _rarity: 'legendary', excludeFromLoot: true
            }
        },

        // --- 2. NEW TILES ---
        tiles: {
            '🗼': {
                type: 'anomaly',
                name: 'The Infinite Spire',
                flavor: "A tower of black glass stretching endlessly into the heavens. It demands you enter with nothing.",
                onInteract: (state, x, y) => {
                    const confirmEntry = confirm("Entering the Spire will temporarily store your inventory and equipment. You must climb until you fall. Do you wish to proceed?");
                    if (!confirmEntry) return null;

                    logMessage("{purple:The glass doors dissolve as you approach. Your worldly possessions vanish!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();

                    // 1. Safely Backup the player's current gear
                    // 🚨 BUG FIX & ROBUSTNESS WIN: Use the safe cloning function recursively!
                    // This guarantees that any 'onHit' or 'effect' functions attached to their epic gear 
                    // survive the stringification process and are waiting for them when they respawn!
                    state.player.spireBackupInv = typeof window.rehydrateItemArray === 'function' ? window.rehydrateItemArray(state.player.inventory) : (typeof window.cloneItemSafely === 'function' ? window.fastClone(state.player.inventory) : JSON.parse(JSON.stringify(state.player.inventory)));
                    
                    state.player.spireBackupEquip = {};
                    const eqKeys = ['weapon', 'armor', 'offhand', 'accessory', 'ammo'];
                    eqKeys.forEach(k => {
                        const item = state.player.equipment[k];
                        if (item) {
                            state.player.spireBackupEquip[k] = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(item) : JSON.parse(JSON.stringify(item));
                            // Manually re-bind functions just in case fastClone failed
                            if (typeof window.ITEM_DATA !== 'undefined' && item.templateId && window.ITEM_DATA[item.templateId]) {
                                state.player.spireBackupEquip[k].effect = window.ITEM_DATA[item.templateId].effect;
                                state.player.spireBackupEquip[k].onHit = window.ITEM_DATA[item.templateId].onHit;
                            }
                        } else {
                            state.player.spireBackupEquip[k] = null;
                        }
                    });
                    
                    // 2. Strip them down to Roguelike starter gear
                    state.player.inventory = [
                        { templateId: '!', name: 'Rusty Sword', type: 'weapon', quantity: 1, tile: '!', damage: 2, slot: 'weapon', isEquipped: true, tags: ['blade'] },
                        { templateId: 'x', name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', isEquipped: true }
                    ];
                    state.player.equipment = {
                        weapon: state.player.inventory[0],
                        armor: state.player.inventory[1],
                        offhand: null, accessory: null, ammo: null
                    };

                    // 3. Set Spire State
                    state.inSpire = true;
                    state.mapMode = 'dungeon';
                    state.currentCaveId = 'cave_spire_0_1'; // Format: cave_spire_0_FLOOR
                    state.currentRealm = 999; // Total isolation
                    state.realmMutators = [];
                    state.overworldExit = { x: state.player.x, y: state.player.y };

                    // 4. Full Heal
                    state.player.health = state.player.maxHealth;
                    state.player.mana = state.player.maxMana;
                    state.player.stamina = state.player.maxStamina;

                    // 5. Generate Floor 1
                    chunkManager.generateCave(state.currentCaveId);
                    
                    // Find spawn point
                    const map = chunkManager.caveMaps[state.currentCaveId];
                    for (let ry = 0; ry < map.length; ry++) {
                        const rx = map[ry].indexOf('>');
                        if (rx !== -1) { state.player.x = rx; state.player.y = ry; break; }
                    }
                    
                    state.mapDirty = true;
                    if (typeof updateRegionDisplay === 'function') updateRegionDisplay();
                    if (typeof renderStats === 'function') renderStats();
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof renderEquipment === 'function') renderEquipment();
                    if (typeof render === 'function') render();
                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    
                    return { inSpire: true, inventory: state.player.inventory, equipment: state.player.equipment, spireBackupInv: state.player.spireBackupInv, spireBackupEquip: state.player.spireBackupEquip };
                }
            },
            '📊': {
                type: 'anomaly',
                name: 'Spire Leaderboard',
                flavor: "A glowing monolith detailing the greatest ascensions.",
                onInteract: (state, x, y) => {
                    const loreTitle = document.getElementById('loreTitle');
                    const loreContent = document.getElementById('loreContent');
                    const loreModal = document.getElementById('loreModal');

                    loreTitle.textContent = "Hall of Ascendants";
                    loreContent.innerHTML = `<p class="italic text-gray-400 text-center animate-pulse">Consulting the Akashic Records...</p>`;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                    // Fetch top 10 from Firebase
                    if (typeof rtdb !== 'undefined') {
                        rtdb.ref('leaderboards/infinite_spire').orderByChild('floor').limitToLast(10).once('value').then(snap => {
                            const data = snap.val();
                            if (!data) {
                                loreContent.innerHTML = `<p class="text-center text-gray-500">The Spire remains unconquered.</p>`;
                                return;
                            }

                            // Sort descending locally
                            const sortedScores = Object.values(data).sort((a, b) => b.floor - a.floor);
                            
                            let html = `<div class="space-y-2 mt-2">`;
                            sortedScores.forEach((score, idx) => {
                                let color = "text-gray-300";
                                let medal = `${idx + 1}.`;
                                if (idx === 0) { color = "text-yellow-400 font-bold drop-shadow-md"; medal = "🥇"; }
                                else if (idx === 1) { color = "text-gray-400 font-bold"; medal = "🥈"; }
                                else if (idx === 2) { color = "text-orange-400 font-bold"; medal = "🥉"; }

                                const safeName = typeof escapeHtml === 'function' ? escapeHtml(score.name) : score.name;
                                const safeClass = typeof escapeHtml === 'function' ? escapeHtml(score.class) : score.class;

                                html += `
                                <div class="bg-gray-900 bg-opacity-50 p-3 rounded border border-gray-700 shadow-inner flex justify-between items-center">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl">${medal}</span>
                                        <div>
                                            <div class="${color}">${safeName}</div>
                                            <div class="text-[10px] text-gray-500 uppercase tracking-widest">${safeClass}</div>
                                        </div>
                                    </div>
                                    <div class="text-lg font-bold text-fuchsia-400">Floor ${score.floor}</div>
                                </div>`;
                            });
                            html += `</div>`;
                            loreContent.innerHTML = html;
                        }).catch(e => {
                            loreContent.innerHTML = `<p class="text-red-500 text-center">Failed to contact the Leylines.</p>`;
                        });
                    }
                    return null;
                }
            },
            '🧞': {
                type: 'anomaly',
                name: 'Spire Vendor',
                flavor: "A glowing Djinn who deals exclusively in Spire Tokens.",
                onInteract: (state, x, y) => {
                    const loreTitle = document.getElementById('loreTitle');
                    const loreContent = document.getElementById('loreContent');
                    const loreModal = document.getElementById('loreModal');

                    const tokenStack = state.player.inventory.find(i => i && i.name === 'Spire Token' && !i.isEquipped);
                    const tokens = tokenStack ? tokenStack.quantity : 0;

                    loreTitle.textContent = "The Ascendant Djinn";
                    
                    let html = `
                        <p class="italic text-fuchsia-300 mb-4 border-b border-fuchsia-800 pb-2">"You carry the suffering of the Spire. Trade it to me for cosmic power."</p>
                        <div class="text-right text-xs font-bold text-gray-400 mb-3">Your Tokens: <span class="text-fuchsia-400 text-lg">${tokens}</span></div>
                    `;

                    const itemsForSale = [
                        { name: 'Infinity Blade', cost: 500, key: '⚔️i' },
                        { name: 'Aegis of Eternity', cost: 500, key: '🛡️e' },
                        { name: 'Elixir of Life', cost: 50, key: '🍷' },
                        { name: 'Elixir of Power', cost: 50, key: '🧪e' }
                    ];

                    itemsForSale.forEach(item => {
                        const canAfford = tokens >= item.cost;
                        const btnClass = canAfford ? 'bg-fuchsia-700 hover:bg-fuchsia-600' : 'bg-gray-800 opacity-50 cursor-not-allowed';
                        
                        html += `
                        <div class="flex justify-between items-center bg-black bg-opacity-30 p-2 rounded border border-gray-700 mb-2">
                            <span class="font-bold text-gray-200">${item.name}</span>
                            <button data-buy-spire="${item.key}" data-cost="${item.cost}" class="${btnClass} text-white text-xs font-bold py-2 px-4 rounded transition-transform active:scale-95 shadow-md" ${canAfford ? '' : 'disabled'}>
                                ${item.cost} Tokens
                            </button>
                        </div>`;
                    });

                    loreContent.innerHTML = html;
                    loreModal.classList.remove('hidden');
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                    setTimeout(() => {
                        const btns = loreContent.querySelectorAll('button[data-buy-spire]');
                        btns.forEach(btn => {
                            btn.onclick = () => {
                                const cost = parseInt(btn.dataset.cost);
                                const itemKey = btn.dataset.buySpire;
                                
                                // Verification
                                const currentTokens = state.player.inventory.find(i => i && i.name === 'Spire Token' && !i.isEquipped);
                                if (!currentTokens || currentTokens.quantity < cost) return;

                                const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                if (state.player.inventory.length >= invCap) {
                                    logMessage("{red:Your inventory is full!}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                                    return;
                                }

                                // Transaction
                                currentTokens.quantity -= cost;
                                if (currentTokens.quantity <= 0) state.player.inventory.splice(state.player.inventory.indexOf(currentTokens), 1);

                                // 🚨 BUG FIX & ROBUSTNESS WIN: Safe deep clone to guarantee weapon traits and tags carry over!
                                const template = window.ITEM_DATA[itemKey];
                                let newItem = typeof window.cloneItemSafely === 'function' ? window.cloneItemSafely(template) : JSON.parse(JSON.stringify(template));
                                newItem.templateId = itemKey;
                                newItem.quantity = 1;
                                newItem.isEquipped = false;
                                
                                // Explicit function re-binds for safety
                                newItem.effect = template ? template.effect : null;
                                newItem.onHit = template ? template.onHit : null;
                                
                                state.player.inventory.push(newItem);

                                logMessage(`{purple:You traded ${cost} Spire Tokens for a ${template.name}!}`);
                                if (typeof AudioSystem !== 'undefined') AudioSystem.playLootRare();
                                
                                loreModal.classList.add('hidden');
                                if (typeof renderInventory === 'function') renderInventory();
                                if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : state.player.inventory });
                            };
                        });
                    }, 0);

                    return null;
                }
            }
        }
    },

    // --- 3. ENGINE HOOKS ---
    init: function() {
        if (!window._spireMutatorCache) window._spireMutatorCache = {}; // Tracks applied mutators

        // ==========================================
        // 1. INJECT INTO WORLD GENERATION
        // ==========================================
        // Place the Spire Entrance extremely far out in the desert!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                // Only spawn in Prime Realm, deep in the desert (> 2000 tiles out)
                if ((typeof gameState !== 'undefined' && gameState.currentRealm !== 0) || 
                    (chunkX*chunkX + chunkY*chunkY) < 15000) return;

                const random = typeof Alea !== 'undefined' ? Alea(typeof stringToSeed !== 'undefined' ? stringToSeed(`spire_spawn_${chunkId}`) : 1) : Math.random;
                
                if (random() < 0.01) { // 1% chance per chunk in the extreme late game
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    if (chunkData[ry][rx] === 'D') {
                        chunkData[ry][rx] = '🗼'; 
                    }
                }
            };
        }

        // Place the Leaderboard and Vendor in the Safe Haven Village!
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCastle) {
            const origGenerateCastle = chunkManager.generateCastle;
            chunkManager.generateCastle = function(castleId, layoutType) {
                const map = origGenerateCastle.call(this, castleId, layoutType);
                if (castleId.includes('village')) {
                    // Safe Haven layout injection
                    if (map[6] && map[6][18] !== undefined) map[6][18] = '📊'; // Leaderboard
                    if (map[8] && map[8][18] !== undefined) map[8][18] = '🧞'; // Vendor
                }
                return map;
            };
        }

        // ==========================================
        // 2. SPIRE DUNGEON GENERATOR
        // ==========================================
        if (typeof chunkManager !== 'undefined' && chunkManager.generateCave) {
            const origGenerateCave = chunkManager.generateCave;
            
            chunkManager.generateCave = function(caveId) {
                if (caveId.startsWith('cave_spire_')) {
                    const floorZ = parseInt(caveId.split('_')[3]) || 1;
                    
                    // Rotating Themes
                    const themes = ['ROCK', 'FUNGAL', 'ICE', 'FIRE', 'VOID', 'ABYSS', 'CRYSTAL'];
                    const themeIdx = Math.floor((floorZ - 1) / 5) % themes.length;
                    const themeKey = themes[themeIdx];
                    this.caveThemes[caveId] = themeKey;
                    const theme = window.CAVE_THEMES[themeKey] || { wall: '▓', floor: '.', secretWall: '▒' };

                    // Realm Mutators every 5 floors
                    if (floorZ > 1 && (floorZ - 1) % 5 === 0 && !window._spireMutatorCache[floorZ]) {
                        const mutators = Object.keys(window.REALM_MUTATORS);
                        const newMutator = mutators[Math.floor(Math.random() * mutators.length)];
                        if (!gameState.realmMutators.includes(newMutator)) {
                            gameState.realmMutators.push(newMutator);
                            logMessage(`{purple:The Spire shifts! Reality Mutator Applied: ${window.REALM_MUTATORS[newMutator].name}}`);
                            gameState.screenShake = 15;
                        }
                        window._spireMutatorCache[floorZ] = true;
                    }

                    const mapW = 15 + Math.min(20, Math.floor(floorZ / 2));
                    const mapH = 15 + Math.min(20, Math.floor(floorZ / 2));
                    let map = Array.from({ length: mapH }, () => Array(mapW).fill(theme.wall));
                    
                    this.caveEnemies[caveId] = [];

                    // 🚨 ROBUSTNESS WIN: Safe Entity Instantiator Fallback
                    const createEntity = typeof this._createInstancedEnemy === 'function' 
                        ? this._createInstancedEnemy.bind(this) 
                        : (id, x, y, tile, scaled, template) => ({ id, x, y, tile, name: scaled.name, health: scaled.maxHealth, maxHealth: scaled.maxHealth, attack: scaled.attack, defense: scaled.defense || 0, xp: scaled.xp, loot: template.loot });

                    // --- BOSS FLOOR ---
                    if (floorZ % 10 === 0) {
                        // Hollow out an arena
                        for(let y=2; y<mapH-2; y++) {
                            for(let x=2; x<mapW-2; x++) {
                                map[y][x] = theme.floor;
                            }
                        }
                        map[Math.floor(mapH/2)][2] = '>'; // Entrance
                        
                        const bossTiles = ['☠️', '🩸c', '👸f', '🤖p', '🧙‍♂️s', '🦑', '🦕', '👾'];
                        const bossTile = bossTiles[Math.floor(Math.random() * bossTiles.length)];
                        const bossTemplate = window.ENEMY_DATA[bossTile] || { name: 'Void Terror', maxHealth: 50, attack: 5, xp: 50 };
                        
                        const bx = Math.floor(mapW/2);
                        const by = Math.floor(mapH/2);
                        map[by][bx] = bossTile;
                        
                        // MASSIVE SCALING (🚨 BUG FIX: Strict Number Coercion!)
                        const safeHealth = Number(bossTemplate.maxHealth) || 50;
                        const safeAttack = Number(bossTemplate.attack) || 5;
                        const safeXp = Number(bossTemplate.xp) || 50;
                        
                        const bossClone = typeof window.fastClone === 'function' ? window.fastClone(bossTemplate) : JSON.parse(JSON.stringify(bossTemplate));
                        
                        const scaled = { 
                            ...bossClone, 
                            maxHealth: Math.floor(safeHealth * (1 + floorZ * 0.5)), 
                            attack: safeAttack + Math.floor(floorZ * 1.5), 
                            xp: safeXp * floorZ 
                        };
                        this.caveEnemies[caveId].push(createEntity(`${caveId}:boss`, bx, by, bossTile, scaled, bossTemplate));
                        
                    } else {
                        // --- NORMAL FLOOR ---
                        let x = Math.floor(mapW/2), y = Math.floor(mapH/2);
                        let steps = mapW * mapH * 0.5;
                        while(steps > 0) {
                            map[y][x] = theme.floor;
                            const dir = Math.floor(Math.random() * 4);
                            if (dir===0 && x>2) x--; else if(dir===1 && x<mapW-3) x++;
                            else if(dir===2 && y>2) y--; else if(dir===3 && y<mapH-3) y++;
                            steps--;
                        }
                        
                        map[Math.floor(mapH/2)][Math.floor(mapW/2)] = '>'; // Entrance
                        
                        // Spawn Exit
                        let placedExit = false;
                        for(let i=0; i<100; i++) {
                            let ex = Math.floor(Math.random() * (mapW-4)) + 2;
                            let ey = Math.floor(Math.random() * (mapH-4)) + 2;
                            if (map[ey][ex] === theme.floor && (Math.abs(ex - Math.floor(mapW/2)) > 5)) {
                                map[ey][ex] = '<';
                                placedExit = true;
                                break;
                            }
                        }
                        if (!placedExit) map[Math.floor(mapH/2)+1][Math.floor(mapW/2)] = '<';

                        // Spawn Enemies
                        const enemyTypes = theme.enemies || ['r', 'b'];
                        const enemyCount = 5 + Math.floor(floorZ * 1.5);
                        for(let i=0; i<enemyCount; i++) {
                            let ex = Math.floor(Math.random() * (mapW-2)) + 1;
                            let ey = Math.floor(Math.random() * (mapH-2)) + 1;
                            if (map[ey][ex] === theme.floor && map[ey][ex] !== '>' && map[ey][ex] !== '<') {
                                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                                const template = window.ENEMY_DATA[type];
                                if (template) {
                                    // Spire enemy scaling! (🚨 BUG FIX: Strict Number Coercion)
                                    const safeHealth = Number(template.maxHealth) || 10;
                                    const safeAttack = Number(template.attack) || 2;
                                    
                                    const eClone = typeof window.fastClone === 'function' ? window.fastClone(template) : JSON.parse(JSON.stringify(template));
                                    
                                    const scaled = { 
                                        ...eClone, 
                                        maxHealth: Math.floor(safeHealth * (1 + floorZ * 0.2)), 
                                        attack: safeAttack + Math.floor(floorZ * 0.5) 
                                    };
                                    map[ey][ex] = type;
                                    this.caveEnemies[caveId].push(createEntity(`${caveId}:e_${i}`, ex, ey, type, scaled, template));
                                }
                            }
                        }
                        
                        // High-Tier Spire Loot
                        for(let i=0; i<3; i++) {
                            let ex = Math.floor(Math.random() * (mapW-2)) + 1;
                            let ey = Math.floor(Math.random() * (mapH-2)) + 1;
                            if (map[ey][ex] === theme.floor) map[ey][ex] = '📦';
                        }
                    }
                    
                    this.caveMaps[caveId] = map;
                    return map;
                }
                
                return origGenerateCave.call(this, caveId);
            };
        }

        // ==========================================
        // 3. BOSS DEATH EXIT INJECTION
        // ==========================================
        // When a Spire Boss dies, it reveals the stairs to the next floor!
        if (typeof window.handleInstancedEnemyDeath === 'function') {
            const origHandleEnemyDeath = window.handleInstancedEnemyDeath;
            window.handleInstancedEnemyDeath = function(enemy, x, y) {
                origHandleEnemyDeath.apply(this, arguments);
                
                if (gameState.inSpire && enemy.isBoss) {
                    if (typeof chunkManager !== 'undefined' && chunkManager.caveMaps[gameState.currentCaveId]) {
                        chunkManager.caveMaps[gameState.currentCaveId][y][x] = '<';
                        logMessage("{cyan:The boss collapses, revealing stairs leading deeper into the Spire...}");
                        if (typeof render === 'function') render();
                    }
                }
            };
        }

        // ==========================================
        // 4. SPIRE DEATH HANDLING
        // ==========================================
        if (typeof window.handlePlayerDeath === 'function') {
            const origHandleDeath = window.handlePlayerDeath;
            window.handlePlayerDeath = function() {
                if (gameState.inSpire) {
                    const floor = parseInt(gameState.currentCaveId.split('_')[3]) || 1;
                    const tokens = floor * 10;
                    
                    logMessage(`{purple:Your body crumbles to ash. The Spire rejects you at Floor ${floor}.}`);
                    logMessage(`{gold:You awaken outside, clutching ${tokens} Spire Tokens.}`);

                    if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();
                    gameState.screenShake = 30;
                    gameState.screenFlash = { color: '#ffffff', alpha: 1.0, decay: 0.05 };

                    // 1. Update Firebase Leaderboard
                    if (typeof rtdb !== 'undefined' && typeof player_id !== 'undefined' && player_id) {
                        const lbRef = rtdb.ref(`leaderboards/infinite_spire/${player_id}`);
                        lbRef.once('value').then(snap => {
                            const data = snap.val();
                            if (!data || floor > data.floor) {
                                lbRef.set({
                                    name: gameState.player.name || "Unknown",
                                    floor: floor,
                                    class: gameState.player.className || gameState.player.background || 'Unknown',
                                    timestamp: firebase.database.ServerValue.TIMESTAMP
                                });
                            }
                        }).catch(e => console.error("Leaderboard Error:", e));
                    }

                    // 2. Safely Restore Original Inventory & Gear
                    gameState.inSpire = false;
                    
                    // Strict Array type-checking prevents ghost wiping!
                    const rawInv = Array.isArray(gameState.player.spireBackupInv) ? gameState.player.spireBackupInv : [];
                    
                    // 1. Restore Inventory first (this rehydrates all items, including equipped ones)
                    gameState.player.inventory = typeof window.rehydrateItemArray === 'function' ? window.rehydrateItemArray(rawInv) : rawInv;
                    
                    // 2. Re-link Equipment Pointers from the newly restored inventory
                    // This prevents memory reference leaks where equipment objects detach from the inventory array!
                    gameState.player.equipment = { weapon: null, armor: null, offhand: null, accessory: null, ammo: null };
                    ['weapon', 'armor', 'offhand', 'accessory', 'ammo'].forEach(slot => {
                        const invItem = gameState.player.inventory.find(i => i && i.slot === slot && i.isEquipped);
                        if (invItem) {
                            gameState.player.equipment[slot] = invItem;
                        }
                    });
                    
                    // Clean up the backups
                    delete gameState.player.spireBackupInv;
                    delete gameState.player.spireBackupEquip;

                    // 3. Award Spire Tokens
                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(gameState.player) : 9;
                    const tokenStack = gameState.player.inventory.find(i => i && i.name === 'Spire Token');
                    if (tokenStack) {
                        tokenStack.quantity += tokens;
                    } else if (gameState.player.inventory.length < invCap) {
                        gameState.player.inventory.push({
                            templateId: '🧿t', name: 'Spire Token', type: 'trade', quantity: tokens, tile: '🧿', _rarity: 'epic', isEquipped: false
                        });
                    } else {
                        logMessage("{red:Your inventory was full! The Spire Tokens were lost to the void.}");
                    }

                    // 4. Teleport back to Safe Haven and Full Heal
                    gameState.player.x = 0;
                    gameState.player.y = 0;
                    gameState.mapMode = 'overworld';
                    gameState.currentCaveId = null;
                    gameState.currentRealm = 0;
                    gameState.realmMutators = [];
                    window._spireMutatorCache = {}; // Reset mutators
                    
                    gameState.player.health = gameState.player.maxHealth;
                    gameState.player.mana = gameState.player.maxMana;
                    gameState.player.stamina = gameState.player.maxStamina;
                    
                    // Critical: Release Death Locks
                    gameState.isDead = false;
                    gameState.player._isDying = false;

                    if (typeof syncPlayerState === 'function') syncPlayerState();
                    if (typeof finalizeMapTransition === 'function') finalizeMapTransition();
                    if (typeof renderStats === 'function') renderStats();
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof renderEquipment === 'function') renderEquipment();
                    if (typeof render === 'function') render();

                    // Safe Firebase Deletion
                    // Wrapped in a try-catch to prevent a fatal ReferenceError if the Firebase 
                    // SDK hasn't fully initialized due to a spotty connection!
                    let deleteField = null;
                    try {
                        if (typeof window.getFirestoreDelete === 'function') {
                            deleteField = window.getFirestoreDelete();
                        } else if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                            deleteField = firebase.firestore.FieldValue.delete();
                        }
                    } catch (e) {
                        console.warn("[AKASHIC ENGINE] Failed to fetch Firestore delete token. Falling back to null.");
                        deleteField = null;
                    }

                    // Force DB Save
                    if (typeof triggerDebouncedSave === 'function') {
                        const deathPayload = {
                            inSpire: false,
                            inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
                            equipment: typeof getSanitizedEquipment === 'function' ? getSanitizedEquipment() : gameState.player.equipment,
                            currentRealm: 0,
                            realmMutators: []
                        };
                        
                        // If we got the proper delete token, tell Firestore to erase the backups. 
                        // Otherwise, setting them to null accomplishes the same memory-clearing goal!
                        deathPayload.spireBackupInv = deleteField !== null ? deleteField : null;
                        deathPayload.spireBackupEquip = deleteField !== null ? deleteField : null;
                        
                        triggerDebouncedSave(deathPayload);
                    }

                    return true; // We handled death! Abort normal permadeath wipe!
                }
                
                return origHandleDeath.apply(this, arguments);
            };
        }
    }
});

// --- END OF FILE expansion-infinite-spire.js ---
