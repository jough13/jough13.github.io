// --- START OF FILE expansion-menagerie.js ---

window.ExpansionManager.register({
    id: "the_menagerie",
    name: "The Menagerie (Advanced Companions)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS (PET GEAR) ---
        items: {
            '🛡️b': { 
                name: 'Leather Barding', type: 'pet_armor', defense: 2, tile: '🛡️', 
                description: "Equip to your Companion. {blue:+2 Pet Defense.}", _rarity: 'uncommon' 
            },
            '🛡️i': { 
                name: 'Iron Barding', type: 'pet_armor', defense: 5, tile: '🛡️', 
                description: "Equip to your Companion. {blue:+5 Pet Defense.}", _rarity: 'rare' 
            },
            '⛓️c': { 
                name: 'Spiked Collar', type: 'pet_weapon', attack: 3, tile: '⛓️', 
                description: "Equip to your Companion. {red:+3 Pet Attack.}", _rarity: 'rare' 
            },
            '🍖t': { 
                name: 'Beast Treat', type: 'consumable', tile: '🍖', 
                description: "Use to fully heal your companion and grant them +50 Pet XP.",
                effect: (state) => {
                    const pet = state.player.companion;
                    if (!pet) {
                        logMessage("{gray:You don't have a companion to feed this to.}");
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return false;
                    }
                    
                    pet.hp = pet.maxHp;
                    
                    // Initialize XP if missing
                    if (!pet.level) { pet.level = 1; pet.xp = 0; pet.xpToNext = 50; }
                    
                    pet.xp += 50;
                    logMessage(`{green:Your ${pet.name} happily eats the treat! (Fully Healed, +50 XP)}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playConsume();
                    if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(pet.x, pet.y, "♥", "#22c55e");
                    
                    // Trigger level up check (handled in the UI loop below)
                    window._forcePetLevelCheck = true; 
                    
                    if (typeof window.renderPetUI === 'function') window.renderPetUI();
                    return true; // Consume item
                }
            }
        },

        // --- 2. SHOPS & CRAFTING ---
        shops: {
            castle: [
                { name: 'Beast Treat', price: 50, stock: 5 },
                { name: 'Leather Barding', price: 200, stock: 1 },
                { name: 'Spiked Collar', price: 350, stock: 1 }
            ]
        }
    },

    // --- 3. ENGINE HOOKS ---
    init: function() {
        
        // --- ADD CRAFTING RECIPES ---
        if (typeof window.CRAFTING_RECIPES !== 'undefined') {
            window.CRAFTING_RECIPES["Leather Barding"] = { materials: { "Wolf Pelt": 4, "Stick": 2 }, xp: 20, level: 2 };
            window.CRAFTING_RECIPES["Spiked Collar"] = { materials: { "Iron Ore": 3, "Leather Tunic": 1 }, xp: 30, level: 3 };
            window.CRAFTING_RECIPES["Iron Barding"] = { materials: { "Iron Ore": 6, "Leather Barding": 1 }, xp: 50, level: 4 };
        }

        // ==========================================
        // FEATURE 1: PET UI
        // ==========================================
        // We commandeer the hidden 'partyContainer' in the HTML to show pet stats!
        window.renderPetUI = function() {
            const pc = document.getElementById('partyContainer');
            const pl = document.getElementById('partyList');
            if (!pc || !pl) return;

            const pet = gameState.player.companion;
            if (!pet) {
                pc.classList.add('hidden');
                return;
            }

            pc.classList.remove('hidden');
            
            // Initialize stats if tame happened before expansion was added
            if (!pet.level) { pet.level = 1; pet.xp = 0; pet.xpToNext = 50; }

            // Handle Level Up Logic (if triggered by XP or Treats)
            while (pet.xp >= pet.xpToNext && pet.level < 20) {
                pet.xp -= pet.xpToNext;
                pet.level++;
                pet.xpToNext = Math.floor(pet.xpToNext * 1.5);
                
                pet.maxHp += 5;
                pet.hp = pet.maxHp;
                pet.attack += 1;
                if (pet.level % 3 === 0) pet.defense = (pet.defense || 0) + 1;
                
                logMessage(`{green:⭐ Your ${pet.name} leveled up to Level ${pet.level}!}`);
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createLevelUp(pet.x, pet.y);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            }

            const xpPct = Math.min(100, (pet.xp / pet.xpToNext) * 100);
            const wpnName = pet.weapon ? pet.weapon.name : 'Unarmed';
            const armName = pet.armor ? pet.armor.name : 'Unarmored';
            
            // Calculate effective stats for display
            const effAtk = pet.attack + (pet.weapon ? pet.weapon.attack : 0);
            const effDef = (pet.defense || 0) + (pet.armor ? pet.armor.defense : 0);

            pl.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-green-400 drop-shadow-md text-sm">${pet.tile} ${pet.name} <span class="text-[10px] text-gray-400 bg-black bg-opacity-40 px-1 rounded ml-1">Lvl ${pet.level}</span></span>
                    <span class="text-xs text-red-400 font-bold">♥ ${pet.hp}/${pet.maxHp}</span>
                </div>
                <div class="w-full bg-gray-900 rounded h-1.5 mb-2 mt-1 border border-gray-700 shadow-inner overflow-hidden">
                    <div class="bg-purple-500 h-full transition-all duration-300" style="width: ${xpPct}%"></div>
                </div>
                <div class="text-[10px] text-gray-300 flex justify-between bg-black bg-opacity-30 p-1.5 rounded shadow-inner">
                    <span class="font-bold text-red-400">⚔️ ${effAtk} <span class="text-gray-500 font-normal">(${wpnName})</span></span>
                    <span class="font-bold text-blue-400">🛡️ ${effDef} <span class="text-gray-500 font-normal">(${armName})</span></span>
                </div>
                <p class="text-[9px] text-gray-500 mt-1 italic text-right">Right-click Pet Gear in inventory to unequip.</p>
            `;
        };

        // Attach UI update to the main renderStats loop seamlessly
        const origRenderStats = window.renderStats;
        window.renderStats = function() {
            if (origRenderStats) origRenderStats();
            if (typeof window.renderPetUI === 'function') window.renderPetUI();
        };

        // ==========================================
        // FEATURE 2: XP SHARING
        // ==========================================
        const origGrantXp = window.grantXp;
        window.grantXp = function(amount) {
            origGrantXp(amount); // Give player XP
            
            // Give Pet XP
            const pet = gameState.player.companion;
            if (pet) {
                if (!pet.level) { pet.level = 1; pet.xp = 0; pet.xpToNext = 50; }
                pet.xp += Math.floor(amount / 2); // Pet gets 50% of earned XP
                if (typeof window.renderPetUI === 'function') window.renderPetUI();
            }
        };

        // ==========================================
        // FEATURE 3: EQUIPPING PET GEAR
        // ==========================================
        const origUseInventoryItem = window.useInventoryItem;
        window.useInventoryItem = function(index) {
            const item = gameState.player.inventory[index];
            
            if (item && (item.type === 'pet_armor' || item.type === 'pet_weapon')) {
                const pet = gameState.player.companion;
                if (!pet) {
                    logMessage("{red:You do not have a companion to equip this to!}");
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }
                
                const slot = item.type === 'pet_armor' ? 'armor' : 'weapon';
                
                // Unequip old item
                if (pet[slot]) {
                    const unequipped = pet[slot];
                    gameState.player.inventory.push(unequipped);
                }
                
                // Equip new item safely
                pet[slot] = window.cloneItemSafely(item);
                logMessage(`{green:You equipped the ${item.name} onto your ${pet.name}!}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(pet.x, pet.y, '#facc15', 15);
                
                // Remove from player bag
                item.quantity--;
                if (item.quantity <= 0) gameState.player.inventory.splice(index, 1);
                
                window.renderPetUI();
                if (typeof renderInventory === 'function') renderInventory();
                
                // Save state
                if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ companion: pet, inventory: getSanitizedInventory() });
                return; // Stop here, do not run original logic
            }
            
            // If not pet gear, proceed normally
            origUseInventoryItem(index);
        };

        // Right-Click to Unequip Pet Gear
        document.addEventListener('contextmenu', (e) => {
            const partyContainer = document.getElementById('partyContainer');
            if (partyContainer && partyContainer.contains(e.target)) {
                e.preventDefault();
                const pet = gameState.player.companion;
                if (!pet) return;
                
                let unequippedSomething = false;
                
                if (pet.weapon) {
                    gameState.player.inventory.push(pet.weapon);
                    logMessage(`{gray:You removed the ${pet.weapon.name} from your ${pet.name}.}`);
                    pet.weapon = null;
                    unequippedSomething = true;
                }
                else if (pet.armor) {
                    gameState.player.inventory.push(pet.armor);
                    logMessage(`{gray:You removed the ${pet.armor.name} from your ${pet.name}.}`);
                    pet.armor = null;
                    unequippedSomething = true;
                }
                
                if (unequippedSomething) {
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
                    window.renderPetUI();
                    if (typeof renderInventory === 'function') renderInventory();
                    if (typeof triggerDebouncedSave === 'function') triggerDebouncedSave({ companion: pet, inventory: getSanitizedInventory() });
                }
            }
        });

        // ==========================================
        // FEATURE 4: PET COMBAT SKILLS
        // ==========================================
        const origRunCompanionTurn = window.runCompanionTurn;
        
        window.runCompanionTurn = async function() {
            const pet = gameState.player.companion;
            
            if (pet && !gameState.player.isMounted) {
                // 1. Temporarily apply gear stats
                const pArmor = pet.armor ? (pet.armor.defense || 0) : 0;
                const pWpn = pet.weapon ? (pet.weapon.attack || 0) : 0;
                
                const realAtk = pet.attack;
                const realDef = pet.defense || 0;
                
                pet.attack = realAtk + pWpn;
                pet.defense = realDef + pArmor;

                // 2. Check for unique active skills!
                let skillUsed = false;
                
                // 25% chance for pets to use their special ability instead of standard melee
                if (Math.random() < 0.25) {
                    
                    // Helper to find an enemy adjacent to the pet
                    let target = null;
                    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
                    
                    for (const [dx, dy] of dirs) {
                        const tx = pet.x + dx;
                        const ty = pet.y + dy;
                        
                        if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
                            target = gameState.instancedEnemies.find(e => e && e.x === tx && e.y === ty && e.health > 0);
                        } else {
                            const enemyId = `overworld:${tx},${-ty}`;
                            target = gameState.sharedEnemies[enemyId];
                        }
                        if (target) break; // Found one!
                    }

                    if (target) {
                        // --- WOLF: Howl (Buff Player) ---
                        if (pet.tile === '🐺' || pet.tile === 'w') {
                            logMessage(`{gold:Your ${pet.name} lets out a rallying howl!}`);
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(pet.x, pet.y, '#facc15', 10);
                            
                            gameState.player.strengthBonus = Math.max(gameState.player.strengthBonus || 0, 3);
                            gameState.player.strengthBonusTurns = 5;
                            logMessage("{green:You feel a surge of primal strength! (+3 Str)}");
                            if (typeof triggerStatAnimation !== 'undefined') triggerStatAnimation(document.getElementById('strengthDisplay'), 'stat-pulse-green');
                            
                            skillUsed = true;
                        } 
                        // --- SPIDER: Web (Root Enemy) ---
                        else if (pet.tile === '@' || pet.tile === '🕷️') {
                            logMessage(`{green:Your ${pet.name} shoots a sticky web at the ${target.name}!}`);
                            target.rootTurns = 3;
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(target.x, target.y, "ROOTED", "#4ade80");
                            skillUsed = true;
                        } 
                        // --- DRAKE: Fire Breath (Burn Enemy) ---
                        else if (pet.tile === '🐲') {
                            logMessage(`{orange:Your ${pet.name} breathes fire on the ${target.name}!}`);
                            target.burnTurns = 3;
                            if (typeof applySpellDamage === 'function') applySpellDamage(target.x, target.y, pet.attack * 2, 'fireball');
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(target.x, target.y, "BURN", "#f97316");
                            skillUsed = true;
                        }
                        // --- BEAR/OGRE: Ground Slam (AoE Stun) ---
                        else if (pet.tile === '🐻' || pet.tile === 'Ø' || pet.tile === '🧌') {
                            logMessage(`{gray:Your ${pet.name} smashes the ground!}`);
                            gameState.screenShake = 15;
                            if (typeof AudioSystem !== 'undefined') AudioSystem.playAttack('heavy');
                            target.stunTurns = 2;
                            if (typeof applySpellDamage === 'function') applySpellDamage(target.x, target.y, pet.attack, 'crush');
                            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createFloatingText(target.x, target.y, "STUNNED", "#facc15");
                            skillUsed = true;
                        }
                    }
                }

                // 3. Fallback to normal AI if no skill was used
                if (!skillUsed && origRunCompanionTurn) {
                    await origRunCompanionTurn();
                }

                // 4. Restore original unbuffed stats
                pet.attack = realAtk;
                pet.defense = realDef;
                
            } else if (origRunCompanionTurn) {
                await origRunCompanionTurn();
            }
        };
    }
});

// --- END OF FILE expansion-menagerie.js ---
