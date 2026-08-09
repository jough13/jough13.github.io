// --- START OF FILE expansion-clockwork.js ---

window.ExpansionManager.register({
    id: "clockwork_uprising",
    name: "The Clockwork Uprising",
    version: "1.4", // Upgraded version!
    
    data: {
        // --- 1. EXPANDED ITEMS ---
        items: {
            '⚙️c': { 
                name: 'Clockwork Core', type: 'trade', tile: '⚙️', 
                description: "A faintly glowing, ticking heart from a machine.", value: 150, _rarity: 'rare' 
            },
            '⚙️s': { 
                name: 'Brass Sprocket', type: 'junk', tile: '⚙️', 
                description: "A greasy brass gear. Valuable to tinkers.", value: 25 
            },
            '⚡g': {
                name: 'Galvanic Rifle', type: 'weapon', tags: ['crossbow', 'lightning', 'firearm'], tile: '🔫',
                damage: 10, range: 6, isTwoHanded: true, slot: 'weapon', skillId: 'ranged_attack',
                description: "{red:+10 Dmg}. A highly advanced weapon that fires bolts of pure energy. Requires Galvanic Batteries.",
                _rarity: 'epic'
            },
            '🔋g': { 
                name: 'Galvanic Battery', type: 'ammo', tile: '🔋', slot: 'ammo', damage: 4, 
                description: "A high-capacity energy cell for firearms. {red:+4 Dmg}.", _rarity: 'uncommon' 
            },
            '📓m': {
                name: 'Manual: Overcharge', type: 'skillbook', skillId: 'overcharge', tile: '📓'
            },
            '📜cw1': { 
                name: 'The Grand Design', type: 'journal', title: 'The Grand Design', 
                content: "The flesh is weak. It starves, it freezes, it rots. Brass and steam do not suffer. We will replace the King's guard with our creations. They will never tire. They will never question." 
            }
        },

        // --- 2. EXPANDED ENEMIES ---
        enemies: {
            '🤖m': {
                name: 'Clockwork Minotaur', tags: ['construct', 'metal', 'giant'], mountable: false,
                maxHealth: 60, attack: 10, defense: 6, xp: 180,
                color: '#f59e0b', loot: '⚙️c',
                flavor: "Steam hisses from its brass nostrils. It was built for war."
            },
            '🐕c': { 
                name: 'Brass Hound', tags: ['construct', 'metal', 'beast'], mountable: false,
                maxHealth: 25, attack: 6, defense: 2, xp: 50, 
                color: '#d97706', loot: '⚙️s', 
                flavor: "A mechanical canine that tracks the scent of blood and magic." 
            },
            '🤖g': { 
                name: 'Automaton Guard', tags: ['construct', 'metal'], mountable: false,
                maxHealth: 40, attack: 7, defense: 4, xp: 80, 
                color: '#9ca3af', loot: '🔋g', isRanged: true, range: 4, 
                flavor: "It patrols the factory floors with clockwork precision, firing arcing bolts of energy." 
            },
            '👨‍🔧': { 
                name: 'The Grand Engineer', tags: ['humanoid', 'boss'], mountable: false,
                maxHealth: 400, attack: 12, defense: 5, xp: 800, isBoss: true, isElite: true, 
                caster: true, castRange: 5, spellDamage: 15, inflicts: 'stun', inflictChance: 0.5, 
                color: '#fcd34d', loot: '⚡g', 
                flavor: "Half-man, half-machine. He oversees the endless assembly lines of the deep." 
            }
        },

        // --- 3. NEW SKILLS ---
        skills: {
            'overcharge': {
                name: "Overcharge",
                description: "Fires a massive {yellow:Lightning} beam, but {red:permanently destroys} your weapon! Scales with {red:Strength}.",
                flavor: "You push the mechanical core past its limits until it violently detonates.",
                cost: 20, costType: "stamina", requiredLevel: 5, target: "aimed", baseDamageMultiplier: 3.0, cooldown: 10,
                scalingStat: "strength", weaponTags: ['firearm', 'lightning']
            }
        },

        // --- 4. MAP TILES & THEMES ---
        tiles: {
            '🏭': {
                type: 'dungeon_entrance',
                name: 'Brass Factory',
                flavor: "Smoke pours from the vents of a massive, half-buried machine complex.",
                getCaveId: (x, y) => `clockwork_${x}_${y}`
            },
            '🤖x': { 
                type: 'landmark', 
                name: 'Scrapped Automaton', 
                flavor: "A lifeless machine from the Second Age. It sparks faintly.", 
                eventId: 'BROKEN_AUTOMATON' 
            }
        },

        // 🌟 LORE WIN: Interactive Overworld Events for the Clockwork expansion!
        events: {
            'BROKEN_AUTOMATON': {
                title: "Broken Automaton",
                oncePerTile: true,
                lootedMessage: "Only a pile of useless, rusted scrap remains.",
                nodes: {
                    'start': {
                        text: "A mechanized soldier lies half-buried in the dirt. One of its optical sensors flickers weakly. It poses no threat.",
                        choices: [
                            {
                                text: "Scavenge for parts.",
                                action: (state, ctx) => {
                                    logMessage("{gray:You brutally rip the valuable brass and copper from its chassis.}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();
                                    
                                    const invCap = typeof getInventoryCap === 'function' ? getInventoryCap(state.player) : 9;
                                    const yields = Math.floor(Math.random() * 3) + 1;
                                    
                                    const existing = state.player.inventory.find(i => i && i.name === 'Brass Sprocket' && !i.isEquipped);
                                    if (existing) {
                                        existing.quantity += yields;
                                        logMessage(`{purple:You salvaged ${yields} Brass Sprockets!}`);
                                    } else if (state.player.inventory.length < invCap) {
                                        state.player.inventory.push({ templateId: '⚙️s', name: 'Brass Sprocket', type: 'junk', quantity: yields, tile: '⚙️', isEquipped: false });
                                        logMessage(`{purple:You salvaged ${yields} Brass Sprockets!}`);
                                    } else {
                                        logMessage("{red:You pulled out some gears, but your pack is full! They drop to the floor.}");
                                        if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '⚙️s', 24);
                                    }
                                    
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '🏚'); // Replace with rubble
                                    state.mapDirty = true;
                                }
                            },
                            {
                                text: "Attempt to reactivate it.",
                                req: (player) => player.inventory.some(i => i && i.name === 'Clockwork Core' && !i.isEquipped),
                                reqHint: "Requires Clockwork Core",
                                action: (state, ctx) => {
                                    // Consume the Core
                                    const idx = state.player.inventory.findIndex(i => i && i.name === 'Clockwork Core' && !i.isEquipped);
                                    state.player.inventory[idx].quantity--;
                                    if (state.player.inventory[idx].quantity <= 0) state.player.inventory.splice(idx, 1);
                                    
                                    logMessage("{yellow:You slot the glowing core into the machine's chest. It whirs to life!}");
                                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(ctx.x, ctx.y, '#facc15', 20);
                                    
                                    // Wait... does it turn hostile or friendly?
                                    if (Math.random() < 0.3) {
                                        logMessage("{red:Its optics turn red! Target Acquired!}");
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playWarning();
                                        
                                        const eData = typeof window.ENEMY_DATA !== 'undefined' ? window.ENEMY_DATA['🤖g'] : { name: 'Automaton Guard', maxHealth: 40, attack: 7, xp: 80 };
                                        const scaledStats = typeof getScaledEnemy === 'function' ? getScaledEnemy(eData, ctx.x, ctx.y) : eData;
                                        
                                        const enemyId = `overworld:${ctx.x},${-ctx.y}`;
                                        state.sharedEnemies[enemyId] = { ...scaledStats, tile: '🤖g', x: ctx.x, y: ctx.y, spawnTime: Date.now() };
                                        if (typeof EnemyNetworkManager !== 'undefined') rtdb.ref(EnemyNetworkManager.getPath(ctx.x, ctx.y, enemyId)).set(state.sharedEnemies[enemyId]);
                                    } else {
                                        logMessage("{green:The machine hums smoothly. It downloads its ancient archives into your mind before fully powering down.}");
                                        logMessage("{blue:You gain a massive surge of knowledge! (+500 XP)}");
                                        if (typeof grantXp === 'function') grantXp(500);
                                        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
                                    }
                                    
                                    state.lootedTiles.add(ctx.tileId);
                                    if (typeof chunkManager !== 'undefined') chunkManager.setWorldTile(ctx.x, ctx.y, '.'); // Remove it completely
                                    state.mapDirty = true;
                                }
                            },
                            { text: "Leave it alone." }
                        ]
                    }
                }
            }
        },

        caveThemes: {
            'CLOCKWORK_FACTORY': {
                name: 'The Brass Factory',
                wall: '⚙️', floor: '▤', secretWall: '▒',
                colors: { wall: '#b45309', floor: '#292524' },
                decorations: ['🛢', '⛓️', '💡', '⚙️s', '📜cw1', '🔋g'], 
                enemies: ['🤖', '🔪', '🤖m', 'g', '🐕c', '🤖g'] 
            }
        },

        // --- 5. SHOPS ---
        shops: {
            trader: [
                { name: 'Galvanic Rifle', price: 1200, stock: 1 },
                { name: 'Manual: Overcharge', price: 800, stock: 1 },
                { name: 'Galvanic Battery', price: 10, stock: 20 }
            ],
            castle: [
                { name: 'Galvanic Battery', price: 10, stock: 50 }
            ]
        },

        // --- 6. RECIPES & BLUEPRINTS ---
        alchemyRecipes: {
            "Liquid Lightning": {
                materials: { "Clockwork Core": 1, "Clean Water": 1, "Empty Bottle": 1 },
                xp: 150, level: 5, yield: 1
            }
        },
        craftingRecipes: {
            "Galvanic Battery": {
                materials: { "Clockwork Core": 1, "Iron Ore": 2 },
                xp: 40, level: 3, yield: 5
            }
        },
        roomTemplates: {
            "Assembly Line": {
                width: 9, height: 5,
                map: [' WWWWWWW ', 'W.......W', 'W.▤.⚙️.▤.W', 'W.......W', ' WWWWWWW ']
            },
            "Generator Room": {
                width: 7, height: 7,
                map: [' WWWWW ', 'W..💡.W', 'W.⚙️.⚙️.W', 'W💡.👨‍🔧.💡W', 'W.⚙️.⚙️.W', 'W..💡.W', ' WWWWW ']
            }
        }
    },

    // ==========================================
    // 7. INITIALIZATION & ENGINE HOOKS
    // ==========================================
    init: function() {
        
        // --- A. WORLD SPAWNER INJECTION ---
        // Dynamically spawns the Factory entrance and broken automatons in the desert and deadlands
        if (typeof chunkManager !== 'undefined' && chunkManager.generateChunk) {
            const origGenerateChunk = chunkManager.generateChunk;
            chunkManager.generateChunk = function(chunkX, chunkY) {
                origGenerateChunk.call(this, chunkX, chunkY);
                
                // Only spawn in the Prime Realm
                if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) return;

                const chunkId = `${chunkX},${chunkY}`;
                const chunkData = this.loadedChunks[chunkId];
                
                // Deterministic PRNG
                const random = typeof Alea !== 'undefined' ? Alea(typeof stringToSeed !== 'undefined' ? stringToSeed(`clockwork_spawn_${chunkId}`) : 1) : Math.random;
                
                // 3% chance per chunk to contain a Brass Factory
                if (random() < 0.03) { 
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    
                    const tile = chunkData[ry][rx];
                    if (tile === 'D' || tile === 'd') { // Desert or Deadlands
                        chunkData[ry][rx] = '🏭'; 
                    }
                }
                
                // 10% chance per chunk to contain a Scrapped Automaton event
                if (random() > 0.90) {
                    const rx = Math.floor(random() * 14) + 1;
                    const ry = Math.floor(random() * 14) + 1;
                    
                    const tile = chunkData[ry][rx];
                    if (tile === 'D' || tile === 'd' || tile === '.') { 
                        chunkData[ry][rx] = '🤖x'; 
                    }
                }
            };
        }

        // Add the new factory to the minimap colors
        if (typeof window.TILE_COLOR_MAP !== 'undefined') {
            window.TILE_COLOR_MAP['🏭'] = [180, 83, 9, 255]; // Deep Brass Orange
            window.TILE_COLOR_MAP['🤖x'] = [107, 114, 128, 255]; // Gray Scrap
        }

        // --- B. OVERCHARGE SKILL LOGIC ---
        // Creates the actual executable function for the skill so it doesn't crash the engine
        window.executeOvercharge = async function(dirX, dirY) {
            const player = gameState.player;
            const skillId = 'overcharge';
            const skillData = window.SKILL_DATA[skillId];

            // 1. Weapon Tag Check
            const weapon = player.equipment.weapon;
            if (!weapon || !weapon.tags || (!weapon.tags.includes('lightning') && !weapon.tags.includes('firearm'))) {
                logMessage("{red:You must equip a Galvanic or Lightning weapon to overcharge!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            // 2. Cost Check
            if (player.stamina < skillData.cost) {
                logMessage("{red:You lack the stamina to trigger an overcharge!}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
            try {
                isProcessingMove = true;
                player.stamina -= skillData.cost;
                logMessage(`{yellow:You push the ${weapon.name} past its limits! It hums violently!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
                
                // 🚨 LORE & GAMEPLAY WIN: Environmental Grounding Synergy
                // If you fire a massive lightning blast while standing in a swamp or river, you ground the circuit!
                let currentTile = '.';
                if (typeof chunkManager !== 'undefined') {
                    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') currentTile = chunkManager.getTile(player.x, player.y);
                    else if (gameState.mapMode === 'dungeon') currentTile = chunkManager.caveMaps[gameState.currentCaveId]?.[player.y]?.[player.x] || '.';
                    else currentTile = chunkManager.castleMaps[gameState.currentCastleId]?.[player.y]?.[player.x] || '.';
                }

                if (currentTile === '~' || currentTile === '≈') {
                    logMessage("{red:The water grounds the galvanic charge! You shock yourself!}");
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#facc15', 20);
                    
                    // The damage recoil bypasses armor
                    if (typeof window.modifyVital === 'function') window.modifyVital('health', -15);
                    gameState.screenShake = 25;
                    
                    if (player.health <= 0) return; // Die instantly, abort beam
                }

                // JUICE WIN: Massive Detonation Effects
                gameState.screenShake = 20;
                gameState.screenFlash = { color: '#facc15', alpha: 0.8, decay: 0.05 };

                // Weapon damage + Strength scaled by the skill multiplier
                const baseDmg = Math.floor((player.strength + (weapon.damage || 0)) * skillData.baseDamageMultiplier);
                const batchedPayload = {};
                let hitSomething = false;

                // 3. Shoot a 5-tile piercing beam
                for (let i = 1; i <= 5; i++) {
                    const tx = player.x + (dirX * i);
                    const ty = player.y + (dirY * i);

                    if (typeof ParticleSystem !== 'undefined') {
                        setTimeout(() => ParticleSystem.spawn(tx, ty, '#facc15', 'dust', '', 5), i * 50);
                    }

                    // Collision Check
                    let tile;
                    let isSolid = false;
                    
                    if (gameState.mapMode === 'dungeon') {
                        const map = chunkManager.caveMaps[gameState.currentCaveId];
                        tile = (map && map[ty] && map[ty][tx]) ? map[ty][tx] : ' ';
                        const theme = typeof CAVE_THEMES !== 'undefined' ? CAVE_THEMES[gameState.currentCaveTheme] : null;
                        const wallTile = theme ? theme.wall : '▓';
                        if (tile === wallTile || tile === '▒' || tile === '+') isSolid = true;
                    } else if (gameState.mapMode === 'castle') {
                        const map = chunkManager.castleMaps[gameState.currentCastleId];
                        tile = (map && map[ty] && map[ty][tx]) ? map[ty][tx] : ' ';
                        if (tile === '▓' || tile === '▒' || tile === '+') isSolid = true;
                    } else {
                        const enemyId = `overworld:${tx},${-ty}`;
                        const liveEnemy = gameState.sharedEnemies[enemyId];
                        tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(tx, ty);
                        if (['^', 'F', '🧱', '+', '☒'].includes(tile) && !liveEnemy) isSolid = true;
                    }

                    if (isSolid) {
                        logMessage("{gray:The beam strikes a solid object and dissipates.}");
                        break;
                    }

                    if (typeof applySpellDamage === 'function') {
                        // We use the 'thunderbolt' spell ID to natively trigger wet/metal elemental synergies!
                        const res = await applySpellDamage(tx, ty, baseDmg, 'thunderbolt', true);
                        if (res && res.hit) {
                            Object.assign(batchedPayload, res.payload);
                            hitSomething = true;
                        }
                    }
                }

                if (Object.keys(batchedPayload).length > 0 && typeof rtdb !== 'undefined') {
                    rtdb.ref().update(batchedPayload).catch(e => console.error("Overcharge Batch Error:", e));
                }

                // 4. DESTROY WEAPON
                logMessage(`{red:BOOM! The ${weapon.name} shatters into scrap metal from the overload!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#9ca3af', 25);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playHit();

                // 🚨 EXPLOIT FIX & ROBUSTNESS WIN: Safe Weapon Destruction
                // The execute function has 'awaits'. A clever player could open their bag and unequip
                // the gun mid-animation. We check identity (===) to ensure we destroy the EXACT 
                // gun that was fired, even if they moved it to their backpack!
                
                if (player.equipment.weapon === weapon) {
                    if (typeof _internalUnequip === 'function') {
                        _internalUnequip(weapon, player);
                    } else if (typeof applyStatBonuses === 'function') {
                        applyStatBonuses(weapon, -1);
                    }
                    player.equipment.weapon = { name: 'Fists', damage: 0, tags: ['blunt'] };
                } else {
                    // They swapped it! Find it in the inventory and delete it anyway.
                    const stolenIdx = player.inventory.indexOf(weapon);
                    if (stolenIdx > -1) {
                        player.inventory.splice(stolenIdx, 1);
                        logMessage("{gray:The gun overheats and melts inside your backpack!}");
                    }
                }

                if (typeof triggerAbilityCooldown === 'function') triggerAbilityCooldown(skillId);
                if (typeof renderEquipment === 'function') renderEquipment();
                if (typeof endPlayerTurn === 'function') endPlayerTurn();
                if (typeof render === 'function') render();

            } finally {
                isProcessingMove = false;
            }
        };

        // --- C. INPUT MONKEY-PATCH ---
        // Safely intercepts the aiming phase to route the Overcharge command 
        // to our new logic block above without touching the core input.js file!
        if (typeof window.handleInput === 'function') {
            const origHandleInput = window.handleInput;
            
            window.handleInput = function() {
                // We use `.apply(arguments)` instead of hardcoded params to future-proof 
                // against any underlying changes to the core engine's input router.
                const key = arguments[0];
                
                if (typeof gameState !== 'undefined' && gameState.isAiming && gameState.abilityToAim === 'overcharge') {
                    
                    // 🚀 PERFORMANCE WIN: Use the global movement map instead of re-allocating it per keystroke
                    const dir = typeof window.MOVEMENT_MAP !== 'undefined' ? window.MOVEMENT_MAP[key] : null;
                    
                    if (dir) {
                        const [dirX, dirY] = dir;
                        
                        // Face direction
                        if (dirX > 0) gameState.player.facing = 'right';
                        else if (dirX < 0) gameState.player.facing = 'left';

                        if (typeof executeOvercharge === 'function') executeOvercharge(dirX, dirY);
                        
                        gameState.isAiming = false;
                        gameState.abilityToAim = null;
                        return; // Intercepted!
                    } else if (key === 'Escape') {
                        // Let the core engine handle the Escape cancellation!
                        return origHandleInput.apply(this, arguments);
                    } else {
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        logMessage("{gray:Invalid direction. Use Arrow keys or WASD to aim. (Esc) to cancel.}");
                        return; // Block invalid inputs
                    }
                }
                
                return origHandleInput.apply(this, arguments);
            };
        }
    }
});

// --- END OF FILE expansion-clockwork.js ---
