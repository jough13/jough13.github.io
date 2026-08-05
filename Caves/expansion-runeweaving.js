// --- START OF FILE expansion-runeweaving.js ---

// ==========================================
// RUNE-WEAVING (CUSTOM SPELLCRAFTING) EXPANSION
// ==========================================

window.ExpansionManager.register({
    id: "rune_weaving",
    name: "Rune-Weaving (Custom Spellcrafting)",
    version: "1.0",
    
    data: {
        // --- 1. NEW ITEMS ---
        items: {
            '🪨r': {
                name: 'Blank Runestone', type: 'trade', tile: '🪨',
                description: "A flawless, magically inert stone. Required to weave a new spell.",
                value: 300, _rarity: 'rare'
            },
            '⚒️r': {
                name: 'Rune-Weaver\'s Kit', type: 'tool', tile: '⚒️',
                description: "Use to open the Rune-Weaving interface. Requires Blank Runestones and Arcane Dust.",
                effect: (state) => {
                    if (typeof window.openRuneModal === 'function') {
                        window.openRuneModal();
                    }
                    return false; // Don't consume the kit!
                }
            }
        },

        // --- 2. SHOPS ---
        shops: {
            castle: [
                { name: 'Rune-Weaver\'s Kit', price: 1500, stock: 1 },
                { name: 'Blank Runestone', price: 500, stock: 3 }
            ],
            trader: [
                { name: 'Blank Runestone', price: 400, stock: 5 }
            ]
        }
    },

    // --- 3. ENGINE HOOKS & UI ---
    init: function() {
        
        // ==========================================
        // 1. INJECT THE RUNE-WEAVING UI MODAL
        // ==========================================
        const runeModalHTML = `
        <div id="runeModal" class="modal-overlay hidden" role="dialog" aria-modal="true" style="z-index: 500;">
            <div class="modal-content themed-container p-6 rounded-2xl shadow-2xl border-2 border-fuchsia-600 max-w-2xl w-full flex flex-col bg-[var(--bg-container)]">
                
                <div class="flex justify-between items-end mb-4 border-b-2 border-fuchsia-700 pb-3 flex-shrink-0">
                    <h2 class="text-4xl font-bold text-fuchsia-500 drop-shadow-md" style="font-family: 'Uncial Antiqua', cursive;">Rune-Weaving</h2>
                    <div class="text-sm font-bold bg-black bg-opacity-40 px-3 py-1 rounded-lg border border-fuchsia-800 shadow-inner">
                        Dust: <span id="runeDustCount" class="text-fuchsia-400">0</span> | Stones: <span id="runeStoneCount" class="text-gray-300">0</span>
                    </div>
                </div>
                
                <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    
                    <!-- Spell Name -->
                    <div>
                        <label class="block text-sm font-bold text-gray-300 mb-1">Spell Name</label>
                        <input type="text" id="runeSpellName" maxlength="20" class="w-full bg-gray-900 text-fuchsia-300 font-bold px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-fuchsia-500 shadow-inner" placeholder="e.g. Void Volley">
                    </div>

                    <!-- Form Selection -->
                    <div>
                        <label class="block text-sm font-bold text-gray-300 mb-1">Form (Delivery Method)</label>
                        <select id="runeForm" class="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-fuchsia-500">
                            <option value="bolt" data-cost="10" data-dmg="6">Projectile Bolt (Aimed, 6 Base Dmg)</option>
                            <option value="nova" data-cost="20" data-dmg="8">Nova Burst (AoE around you, 8 Base Dmg)</option>
                        </select>
                    </div>

                    <!-- Element Selection -->
                    <div>
                        <label class="block text-sm font-bold text-gray-300 mb-1">Element (Damage Type)</label>
                        <select id="runeElement" class="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-fuchsia-500">
                            <option value="fire" data-cost="0">Fire (Synergizes with Oil/Swamp Gas)</option>
                            <option value="frost" data-cost="0">Frost (Freezes water, bonus vs Fire)</option>
                            <option value="lightning" data-cost="5">Lightning (Bonus vs Wet/Metal targets)</option>
                            <option value="dark" data-cost="5">Void (Bonus vs Holy targets)</option>
                            <option value="poison" data-cost="0">Poison (Bonus vs Organic/Wood targets)</option>
                        </select>
                    </div>

                    <!-- Modifier Selection -->
                    <div>
                        <label class="block text-sm font-bold text-gray-300 mb-1">Modifier (Special Effect)</label>
                        <select id="runeModifier" class="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-fuchsia-500">
                            <option value="none" data-cost="0">None</option>
                            <option value="siphon" data-cost="15">Vampiric (Heal for 50% of damage dealt)</option>
                            <option value="pierce" data-cost="10">Piercing (Bolt Only: Shoots through enemies)</option>
                            <option value="chain" data-cost="20">Chaining (Bolt Only: Jumps to 2 nearby targets)</option>
                        </select>
                    </div>

                    <!-- Summary -->
                    <div class="bg-black bg-opacity-40 p-4 rounded-lg border border-fuchsia-900 shadow-inner mt-2">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-fuchsia-300">Spell Cost:</span>
                            <span id="runeManaCost" class="font-bold text-blue-400 text-lg">10 Mana</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-fuchsia-300">Crafting Cost:</span>
                            <span id="runeCraftCost" class="font-bold text-gray-300 text-sm">1 Blank Runestone, <span id="runeDustNeeded" class="text-fuchsia-400">10 Dust</span></span>
                        </div>
                    </div>

                    <!-- 🚨 NEW: UPGRADE SECTION -->
                    <div class="mt-6 border-t border-fuchsia-800 pt-4">
                        <h3 class="text-lg font-bold text-fuchsia-400 mb-2 drop-shadow-md">Refine Woven Spells</h3>
                        <p class="text-xs text-gray-400 mb-3 italic">Infuse Arcane Dust to increase the power of your custom magic.</p>
                        <ul id="runeUpgradeList" class="space-y-2"></ul>
                    </div>

                </div>
                
                <div class="flex gap-3 mt-6 flex-shrink-0">
                    <button id="runeCancelBtn" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-gray-900 active:border-b-0 active:mt-1">Cancel</button>
                    <button id="runeCraftBtn" class="flex-1 bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 border-b-4 border-fuchsia-900 active:border-b-0 active:mt-1">Weave Spell</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', runeModalHTML);

        // ==========================================
        // 2. UI LOGIC & EVENT LISTENERS
        // ==========================================
        const modal = document.getElementById('runeModal');
        const formEl = document.getElementById('runeForm');
        const elemEl = document.getElementById('runeElement');
        const modEl = document.getElementById('runeModifier');
        const manaCostEl = document.getElementById('runeManaCost');
        const dustNeededEl = document.getElementById('runeDustNeeded');
        const craftBtn = document.getElementById('runeCraftBtn');

        const updateCosts = () => {
            const formOpt = formEl.options[formEl.selectedIndex];
            const elemOpt = elemEl.options[elemEl.selectedIndex];
            const modOpt = modEl.options[modEl.selectedIndex];

            // Prevent invalid modifiers on Nova
            if (formOpt.value === 'nova' && (modOpt.value === 'pierce' || modOpt.value === 'chain')) {
                modEl.value = 'none';
            }

            const mana = parseInt(formOpt.dataset.cost) + parseInt(elemOpt.dataset.cost) + parseInt(modOpt.dataset.cost);
            const dust = mana * 2; // Arbitrary conversion: 1 Mana Cost = 2 Dust to craft

            manaCostEl.textContent = `${mana} Mana`;
            dustNeededEl.textContent = `${dust} Dust`;
            
            return { mana, dust };
        };

        formEl.addEventListener('change', updateCosts);
        elemEl.addEventListener('change', updateCosts);
        modEl.addEventListener('change', updateCosts);

        // 🚨 NEW: Renders the dynamic list of spells you own
        window.renderRuneUpgrades = function() {
            const upgradeList = document.getElementById('runeUpgradeList');
            if (!upgradeList) return;
            upgradeList.innerHTML = '';
            
            const player = gameState.player;
            const customSpells = player.customSpells || {};
            const dustCount = player.inventory.find(i => i && i.name === 'Arcane Dust' && !i.isEquipped)?.quantity || 0;
            
            const keys = Object.keys(customSpells);
            if (keys.length === 0) {
                upgradeList.innerHTML = '<li class="italic text-gray-500 text-xs p-3 text-center bg-black bg-opacity-20 rounded border border-gray-700">No custom spells woven yet.</li>';
                return;
            }
            
            const fragment = document.createDocumentFragment();
            
            keys.forEach(spellId => {
                const spell = customSpells[spellId];
                const currentLevel = player.spellbook[spellId] || 1;
                const MAX_LEVEL = 10;
                
                // Cost scales dynamically: 25, 50, 75, 100 Dust...
                const cost = currentLevel * 25; 
                const canAfford = dustCount >= cost;
                const isMax = currentLevel >= MAX_LEVEL;
                
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center bg-gray-900 bg-opacity-40 p-3 rounded-lg border border-fuchsia-900 shadow-sm';
                
                let btnHtml = '';
                if (isMax) {
                    btnHtml = `<span class="text-[10px] text-yellow-500 font-bold bg-black bg-opacity-40 px-2 py-1.5 rounded border border-yellow-700 shadow-inner tracking-widest uppercase">Maxed</span>`;
                } else {
                    const btnClass = canAfford ? 'bg-fuchsia-700 hover:bg-fuchsia-600 cursor-pointer shadow-md active:scale-95 border-b-2 border-fuchsia-900 active:border-b-0 active:mt-0.5' : 'bg-gray-700 opacity-50 cursor-not-allowed border-gray-800';
                    btnHtml = `<button data-upgrade-rune="${spellId}" data-cost="${cost}" class="${btnClass} text-xs text-white font-bold px-3 py-1.5 rounded transition-all" style="transform: translateZ(0);" ${canAfford ? '' : 'disabled'}>Lvl ${currentLevel+1} (-${cost} Dust)</button>`;
                }
                
                // XSS Protection
                const safeName = typeof escapeHtml === 'function' ? escapeHtml(spell.name) : spell.name;

                li.innerHTML = `
                    <div class="flex-grow">
                        <div class="text-sm font-bold text-fuchsia-300 drop-shadow-sm">${safeName} <span class="text-[10px] text-gray-400 bg-black bg-opacity-30 px-1.5 py-0.5 rounded border border-gray-700 shadow-inner ml-1">Lvl ${currentLevel}</span></div>
                    </div>
                    <div>${btnHtml}</div>
                `;
                fragment.appendChild(li);
            });
            
            upgradeList.appendChild(fragment);
        };

        // 🚨 NEW: Executes the purchase
        window.upgradeRuneSpell = function(spellId, cost) {
            const player = gameState.player;
            const dustIdx = player.inventory.findIndex(i => i && i.name === 'Arcane Dust' && !i.isEquipped);
            
            if (dustIdx === -1 || player.inventory[dustIdx].quantity < cost) {
                logMessage("{red:You do not have enough Arcane Dust.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }
            
            const currentLevel = player.spellbook[spellId] || 1;
            if (currentLevel >= 10) return;
            
            // Consume Dust
            player.inventory[dustIdx].quantity -= cost;
            if (player.inventory[dustIdx].quantity <= 0) player.inventory.splice(dustIdx, 1);
            
            // Level Up the Spell
            player.spellbook[spellId] = currentLevel + 1;
            
            logMessage(`{fuchsia:You infused the spell with raw magic! ${player.customSpells[spellId].name} is now Level ${currentLevel + 1}!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playEnchant();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(player.x, player.y, '#d946ef', 25);
            gameState.screenShake = 5;
            
            // Sync to Database
            if (typeof triggerDebouncedSave === 'function') {
                triggerDebouncedSave({
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : player.inventory,
                    spellbook: player.spellbook
                });
            }
            
            // Refresh local UI
            document.getElementById('runeDustCount').textContent = player.inventory.find(i => i && i.name === 'Arcane Dust' && !i.isEquipped)?.quantity || 0;
            window.renderRuneUpgrades(); // Redraw list
            if (typeof renderInventory === 'function') renderInventory();
        };

        window.openRuneModal = function() {
            if (typeof inputQueue !== 'undefined') inputQueue.length = 0;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            
            const inv = gameState.player.inventory;
            const dustCount = inv.find(i => i && i.name === 'Arcane Dust' && !i.isEquipped)?.quantity || 0;
            const stoneCount = inv.find(i => i && i.name === 'Blank Runestone' && !i.isEquipped)?.quantity || 0;
            
            document.getElementById('runeDustCount').textContent = dustCount;
            document.getElementById('runeStoneCount').textContent = stoneCount;
            
            updateCosts();
            if (typeof window.renderRuneUpgrades === 'function') window.renderRuneUpgrades(); // 🚨 NEW: Draw upgrades!
            modal.classList.remove('hidden');
        };

        document.getElementById('runeCancelBtn').addEventListener('click', () => {
            if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
            modal.classList.add('hidden');
        });

        // 🚨 NEW: Global Event Delegation for Upgrade Buttons
        modal.addEventListener('click', (e) => {
            const upgBtn = e.target.closest('button[data-upgrade-rune]');
            if (upgBtn && !upgBtn.disabled) {
                const spellId = upgBtn.dataset.upgradeRune;
                const cost = parseInt(upgBtn.dataset.cost, 10);
                if (!isNaN(cost) && typeof window.upgradeRuneSpell === 'function') {
                    window.upgradeRuneSpell(spellId, cost);
                }
            }
        });

        // ==========================================
        // 3. CRAFTING THE SPELL
        // ==========================================
        craftBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('runeSpellName').value.trim();
            if (!nameInput) {
                logMessage("{red:You must name your spell.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            const safeName = typeof escapeHtml === 'function' ? escapeHtml(nameInput).substring(0, 20) : nameInput.substring(0, 20);
            const { mana, dust } = updateCosts();
            
            const inv = gameState.player.inventory;
            const dustIdx = inv.findIndex(i => i && i.name === 'Arcane Dust' && !i.isEquipped);
            const stoneIdx = inv.findIndex(i => i && i.name === 'Blank Runestone' && !i.isEquipped);

            if (stoneIdx === -1) {
                logMessage("{red:You need a Blank Runestone to weave a new spell.}");
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }
            if (dustIdx === -1 || inv[dustIdx].quantity < dust) {
                logMessage(`{red:You need ${dust} Arcane Dust to weave this spell.}`);
                if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                return;
            }

            // Consume Materials
            inv[stoneIdx].quantity--;
            if (inv[stoneIdx].quantity <= 0) inv.splice(stoneIdx, 1);
            
            // Re-find dust index in case splicing the stone shifted the array
            const newDustIdx = inv.findIndex(i => i && i.name === 'Arcane Dust' && !i.isEquipped);
            inv[newDustIdx].quantity -= dust;
            if (inv[newDustIdx].quantity <= 0) inv.splice(newDustIdx, 1);

            // Construct the Custom Spell Object
            const form = formEl.value;
            const element = elemEl.value;
            const modifier = modEl.value;
            
            const customSpellId = `custom_${Date.now()}`;
            const baseDmg = parseInt(formEl.options[formEl.selectedIndex].dataset.dmg);

            let description = `A custom ${element} ${form}.`;
            if (modifier === 'siphon') description += " {red:Heals you for 50% of damage dealt.}";
            if (modifier === 'pierce') description += " {yellow:Pierces through enemies.}";
            if (modifier === 'chain') description += " {cyan:Lightning arcs to nearby enemies.}";

            const newSpellData = {
                name: safeName,
                description: description,
                flavor: "A unique spell crafted by your own hands.",
                cost: mana,
                costType: 'mana',
                requiredLevel: 5,
                target: form === 'bolt' ? 'aimed' : 'self',
                type: null,
                element: element,
                baseDamage: baseDmg,
                radius: form === 'nova' ? 2 : 0,
                AoE: form === 'nova',
                
                // Custom Engine Hooks
                isCustom: true,
                customForm: form,
                customModifier: modifier,
                healPercent: modifier === 'siphon' ? 0.5 : 0
            };

            // Save to Player Data
            if (!gameState.player.customSpells) gameState.player.customSpells = {};
            gameState.player.customSpells[customSpellId] = newSpellData;
            
            // Learn it immediately!
            gameState.player.spellbook[customSpellId] = 1;

            logMessage(`{fuchsia:You successfully wove a new spell: ${safeName}!}`);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
            if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#d946ef', 30);
            gameState.screenShake = 15;

            // Update global dictionary so the engine recognizes it instantly
            window.SPELL_DATA[customSpellId] = newSpellData;

            if (typeof triggerDebouncedSave === 'function') {
                triggerDebouncedSave({
                    inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : inv,
                    customSpells: gameState.player.customSpells,
                    spellbook: gameState.player.spellbook
                });
            }

            modal.classList.add('hidden');
        });

        // ==========================================
        // 4. ENGINE INTERCEPTION (MONKEY PATCHING)
        // ==========================================
        
        // A. Ensure Custom Spells are loaded into SPELL_DATA when the game boots
        const origRenderStats = window.renderStats;
        window.renderStats = function() {
            if (gameState.player && gameState.player.customSpells) {
                for (const spellId in gameState.player.customSpells) {
                    if (!window.SPELL_DATA[spellId]) {
                        window.SPELL_DATA[spellId] = gameState.player.customSpells[spellId];
                    }
                }
            }
            if (origRenderStats) origRenderStats();
        };

        // B. Intercept castSpell for Custom Novas
        const origCastSpell = window.castSpell;
        window.castSpell = async function(spellId) {
            const spellData = window.SPELL_DATA[spellId];
            
            if (spellData && spellData.isCustom && spellData.customForm === 'nova') {
                
                // 🚨 BUG FIX: Apply the Mutex Lock here too!
                if (typeof isProcessingMove !== 'undefined' && isProcessingMove) return;
                isProcessingMove = true;

                try {
                    if (gameState.player.isMounted) {
                    gameState.player.isMounted = false;
                    logMessage(`{orange:You leap from your mount to cast a spell!}`);
                }

                if (gameState.player.mana < spellData.cost) {
                    logMessage(`{red:You don't have enough mana to cast that.}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                    return;
                }

                gameState.player.mana -= spellData.cost;
                logMessage(`{fuchsia:You unleash ${spellData.name}!}`);
                gameState.screenShake = 20;
                if (typeof AudioSystem !== 'undefined') AudioSystem.playNoise(0.5, 0.3, 100);

                let colorClass = '#3b82f6';
                if (spellData.element === 'fire') colorClass = '#f97316'; 
                if (spellData.element === 'poison') colorClass = '#4ade80'; 
                if (spellData.element === 'frost') colorClass = '#7dd3fc';
                if (spellData.element === 'dark') colorClass = '#c084fc';
                if (spellData.element === 'lightning') colorClass = '#facc15';

                if (typeof ParticleSystem !== 'undefined') {
                    for(let i=0; i<30; i++) ParticleSystem.spawn(gameState.player.x, gameState.player.y, colorClass, 'dust', '', Math.random()*6+4);
                }

                const spellLevel = gameState.player.spellbook[spellId] || 1;
                const effWits = gameState.player.wits + (gameState.player.witsBonus || 0);
                const totalDmg = spellData.baseDamage + (effWits * spellLevel);

                const batchedPayload = {}; 
                let totalHealed = 0;

                for (let y = gameState.player.y - spellData.radius; y <= gameState.player.y + spellData.radius; y++) {
                    for (let x = gameState.player.x - spellData.radius; x <= gameState.player.x + spellData.radius; x++) {
                        if (x === gameState.player.x && y === gameState.player.y) continue;
                        
                        if (typeof applySpellDamage === 'function') {
                            const res = await applySpellDamage(x, y, totalDmg, spellId, true);
                            if (res && res.hit) {
                                Object.assign(batchedPayload, res.payload);
                                if (spellData.customModifier === 'siphon') totalHealed += Math.floor(totalDmg * 0.5);
                            }
                        }
                    }
                }
                
                if (Object.keys(batchedPayload).length > 0 && typeof rtdb !== 'undefined') {
                    rtdb.ref().update(batchedPayload).catch(e => console.error("Nova Batch Error:", e));
                }

                // Apply Siphon Healing
                if (totalHealed > 0) {
                    const actualHeal = window.modifyVital('health', totalHealed);
                    if (actualHeal > 0) logMessage(`{red:You siphoned ${actualHeal} health from your enemies!}`);
                }

                if (typeof triggerAbilityCooldown === 'function') triggerAbilityCooldown(spellId);
                if (typeof endPlayerTurn === 'function') endPlayerTurn();
                if (typeof render === 'function') render();
                
            } finally {
                // 🚨 BUG FIX: Unlock!
                isProcessingMove = false;
            }
            return;
        }
            
        // If not a custom nova, pass to original
        return origCastSpell(spellId);
    };

        // C. Intercept executeAimedSpell for Custom Projectiles (Pierce & Chain)
        const origExecuteAimedSpell = window.executeAimedSpell;
        window.executeAimedSpell = async function(spellId, dirX, dirY) {
            const spellData = window.SPELL_DATA[spellId];
            
            if (spellData && spellData.isCustom && spellData.customForm === 'bolt') {
                isProcessingMove = true;
                
                try {
                    if (gameState.player.mana < spellData.cost) {
                        logMessage(`{red:You don't have enough mana to cast that.}`);
                        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
                        return;
                    }

                    gameState.player.mana -= spellData.cost;
                    logMessage(`{fuchsia:You cast ${spellData.name}!}`);
                    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();

                    let colorClass = '#3b82f6';
                    if (spellData.element === 'fire') colorClass = '#f97316'; 
                    if (spellData.element === 'poison') colorClass = '#4ade80'; 
                    if (spellData.element === 'frost') colorClass = '#7dd3fc';
                    if (spellData.element === 'dark') colorClass = '#c084fc';
                    if (spellData.element === 'lightning') colorClass = '#facc15';

                    const spellLevel = gameState.player.spellbook[spellId] || 1;
                    const effWits = gameState.player.wits + (gameState.player.witsBonus || 0);
                    let currentHitDamage = spellData.baseDamage + (effWits * spellLevel);
                    
                    let hitSomething = false;
                    let lastHitX = null;
                    let lastHitY = null;
                    let totalHealed = 0;

                    for (let i = 1; i <= 5; i++) {
                        const targetX = gameState.player.x + (dirX * i);
                        const targetY = gameState.player.y + (dirY * i);

                        if (typeof ParticleSystem !== 'undefined') {
                            setTimeout(() => ParticleSystem.spawn(targetX, targetY, colorClass, 'dust', '', 3), i * 40); 
                        }

                        // Collision Check
                        let tile;
                        let isSolid = false;
                        if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                            const enemyId = `overworld:${targetX},${-targetY}`;
                            const liveEnemy = gameState.sharedEnemies[enemyId];
                            tile = liveEnemy ? liveEnemy.tile : chunkManager.getTile(targetX, targetY);
                            if (['^', 'F', '🧱', '+', '☒'].includes(tile) && !liveEnemy) isSolid = true;
                        } else {
                            const map = (gameState.mapMode === 'dungeon') ? chunkManager.caveMaps[gameState.currentCaveId] : chunkManager.castleMaps[gameState.currentCastleId];
                            tile = (map && map[targetY] && map[targetY][targetX]) ? map[targetY][targetX] : ' ';
                            if (tile === '▓' || tile === '▒' || tile === '+') isSolid = true;
                        }

                        if (isSolid) {
                            logMessage("{gray:Your spell strikes a solid object.}");
                            break;
                        }

                        // Apply Damage
                        if (typeof applySpellDamage === 'function') {
                            const didHit = await applySpellDamage(targetX, targetY, currentHitDamage, spellId);
                            if (didHit) {
                                hitSomething = true;
                                lastHitX = targetX;
                                lastHitY = targetY;
                                
                                if (spellData.customModifier === 'siphon') totalHealed += Math.floor(currentHitDamage * 0.5);

                                if (spellData.customModifier === 'pierce') {
                                    currentHitDamage = Math.floor(currentHitDamage * 0.5); // Halve damage after pierce
                                    if (currentHitDamage < 1) break; // Momentum lost
                                    logMessage(`{yellow:The bolt pierces right through!}`);
                                } else {
                                    break; // Normal bolts stop on first hit
                                }
                            }
                        }
                    }

                    // Handle Chain Modifier
                    if (hitSomething && spellData.customModifier === 'chain' && lastHitX !== null) {
                        const jumpRadius = 3; 
                        let potentialJumpTargets = [];

                        for (let y = lastHitY - jumpRadius; y <= lastHitY + jumpRadius; y++) {
                            for (let x = lastHitX - jumpRadius; x <= lastHitX + jumpRadius; x++) {
                                if (x === lastHitX && y === lastHitY) continue;

                                let hasEnemy = false;
                                if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
                                    const tile = chunkManager.getTile(x, y);
                                    if (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[tile]) hasEnemy = true;
                                } else {
                                    if (gameState.instancedEnemies && gameState.instancedEnemies.some(e => e && e.x === x && e.y === y && e.health > 0)) hasEnemy = true; 
                                }

                                if (hasEnemy) potentialJumpTargets.push({ x, y });
                            }
                        }

                        potentialJumpTargets.sort(() => Math.random() - 0.5);
                        const jumpsToMake = Math.min(potentialJumpTargets.length, 2);

                        if (jumpsToMake > 0) {
                            setTimeout(() => logMessage(`{cyan:The spell arcs to ${jumpsToMake} nearby enemies!}`), 200);
                            
                            const lightningPromises = []; 
                            const batchedLightningPayload = {};
                            
                            for (let i = 0; i < jumpsToMake; i++) {
                                const jumpTgt = potentialJumpTargets[i];
                                const jumpDmg = Math.max(1, Math.floor(currentHitDamage * 0.75));
                                
                                lightningPromises.push(
                                    new Promise(resolve => {
                                        setTimeout(async () => {
                                            const res = await applySpellDamage(jumpTgt.x, jumpTgt.y, jumpDmg, spellId, true);
                                            if (res && res.hit) {
                                                Object.assign(batchedLightningPayload, res.payload);
                                                if (typeof ParticleSystem !== 'undefined') ParticleSystem.createExplosion(jumpTgt.x, jumpTgt.y, colorClass);
                                                if (spellData.customModifier === 'siphon') totalHealed += Math.floor(jumpDmg * 0.5);
                                            }
                                            resolve();
                                        }, i * 150);
                                    })
                                );
                            }
                            await Promise.all(lightningPromises); 
                            
                            if (Object.keys(batchedLightningPayload).length > 0 && typeof rtdb !== 'undefined') {
                                rtdb.ref().update(batchedLightningPayload).catch(e => console.error("Chain Batch Error:", e));
                            }
                        }
                    }

                    if (totalHealed > 0) {
                        const actualHeal = window.modifyVital('health', totalHealed);
                        if (actualHeal > 0) logMessage(`{red:You siphoned ${actualHeal} health from your enemies!}`);
                    }

                    if (typeof triggerAbilityCooldown === 'function') triggerAbilityCooldown(spellId);
                    if (typeof endPlayerTurn === 'function') endPlayerTurn();
                    if (typeof render === 'function') render();

                } finally {
                    isProcessingMove = false;
                }
                return;
            }
            
            // If not a custom bolt, pass to original
            return origExecuteAimedSpell(spellId, dirX, dirY);
        };
    }
});

// --- END OF FILE expansion-runeweaving.js ---
