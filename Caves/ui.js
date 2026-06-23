// --- START OF FILE ui.js ---

// ==========================================
// USER INTERFACE & DOM MANAGEMENT
// ==========================================

// DOM Element Selectors
const characterSelectModal = document.getElementById('characterSelectModal');
const slotsContainer = document.getElementById('slotsContainer');
const logoutFromSelectButton = document.getElementById('logoutFromSelectButton');
let currentUser = null; // Store the firebase user object

const charCreationModal = document.getElementById('charCreationModal');
const timeDisplay = document.getElementById('timeDisplay');
const weatherDisplay = document.getElementById('weatherDisplay'); 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d');

// PERFORMANCE WIN: Cache the canvas wrapper used heavily in render layers for damage flashes
const canvasWrapperEl = document.getElementById('gameCanvasWrapper');

const darkModeToggle = document.getElementById('darkModeToggle');
const messageLog = document.getElementById('messageLog');
const inventoryList = document.getElementById('inventoryList');
const authContainer = document.getElementById('authContainer');
const gameContainer = document.getElementById('gameContainer');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const authError = document.getElementById('authError');
const logoutButton = document.getElementById('logoutButton');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeHelpButton = document.getElementById('closeHelpButton');
const regionDisplay = document.getElementById('regionDisplay');
const loreModal = document.getElementById('loreModal');
const closeLoreButton = document.getElementById('closeLoreButton');
const loreTitle = document.getElementById('loreTitle');
const loreContent = document.getElementById('loreContent');

const gameOverModal = document.getElementById('gameOverModal');
const restartButton = document.getElementById('restartButton');
const finalLevelDisplay = document.getElementById('finalLevelDisplay');
const finalCoinsDisplay = document.getElementById('finalCoinsDisplay');

const shopModal = document.getElementById('shopModal');
const closeShopButton = document.getElementById('closeShopButton');
const shopPlayerCoins = document.getElementById('shopPlayerCoins');
const shopBuyList = document.getElementById('shopBuyList');
const shopSellList = document.getElementById('shopSellList');

const spellModal = document.getElementById('spellModal');
const closeSpellButton = document.getElementById('closeSpellButton');
const spellList = document.getElementById('spellList');

const inventoryModal = document.getElementById('inventoryModal');
const closeInventoryButton = document.getElementById('closeInventoryButton');
const inventoryModalList = document.getElementById('inventoryModalList');

const skillModal = document.getElementById('skillModal');
const closeSkillButton = document.getElementById('closeSkillButton');
const skillList = document.getElementById('skillList');

const questModal = document.getElementById('questModal');
const closeQuestButton = document.getElementById('closeQuestButton');
const questList = document.getElementById('questList');

const craftingModal = document.getElementById('craftingModal');
const closeCraftingButton = document.getElementById('closeCraftingButton');
const craftingRecipeList = document.getElementById('craftingRecipeList');

const skillTrainerModal = document.getElementById('skillTrainerModal');
const closeSkillTrainerButton = document.getElementById('closeSkillTrainerButton');
const skillTrainerList = document.getElementById('skillTrainerList');
const skillTrainerStatPoints = document.getElementById('skillTrainerStatPoints');

const equippedWeaponDisplay = document.getElementById('equippedWeaponDisplay');
const equippedArmorDisplay = document.getElementById('equippedArmorDisplay');

const coreStatsPanel = document.getElementById('coreStatsPanel');
const statusEffectsPanel = document.getElementById('statusEffectsPanel');
const statusPanel = document.getElementById('statusPanel'); // Vitals container

let lastLogText = "";
let lastLogCount = 1;

const statDisplays = {
    health: document.getElementById('healthDisplay'),
    mana: document.getElementById('manaDisplay'),
    stamina: document.getElementById('staminaDisplay'),
    psyche: document.getElementById('psycheDisplay'),
    hunger: document.getElementById('hungerDisplay'),
    thirst: document.getElementById('thirstDisplay'),
    strength: document.getElementById('strengthDisplay'),
    wits: document.getElementById('witsDisplay'),
    constitution: document.getElementById('constitutionDisplay'),
    dexterity: document.getElementById('dexterityDisplay'),
    charisma: document.getElementById('charismaDisplay'),
    luck: document.getElementById('luckDisplay'),
    willpower: document.getElementById('willpowerDisplay'),
    perception: document.getElementById('perceptionDisplay'),
    endurance: document.getElementById('enduranceDisplay'),
    intuition: document.getElementById('intuitionDisplay'),
    coins: document.getElementById('coinsDisplay'),
    level: document.getElementById('levelDisplay'),
    xp: document.getElementById('xpDisplay'),
    statPoints: document.getElementById('statPointsDisplay')
};

const statBarElements = {
    health: document.getElementById('healthBar'),
    mana: document.getElementById('manaBar'),
    stamina: document.getElementById('staminaBar'),
    psyche: document.getElementById('psycheBar'),
    hunger: document.getElementById('hungerBar'),
    thirst: document.getElementById('thirstBar'),
    xp: document.getElementById('xpBar')
};

// --- GLOBAL UI STATE ---
window.currentZoom = 20; // The absolute source of truth for TILE_SIZE

// --- CHAT & MESSAGE LOG SYSTEM ---
// PERFORMANCE WIN: Cache Regexes so the V8 engine doesn't recompile them on every log
const CRIT_REGEX = /\b(CRITICAL HIT!|CRITICAL|AMBUSH!|LEVEL UP!|NEW RECORD!|MAXED)\b/g;
// LORE WIN: Added explicit Void and Ethereal parsing colors for future-proof lore formatting!
const FORMAT_REGEXES = [
    { rx: /{red:(.*?)}/g, repl: '<span class="text-red-500 font-bold drop-shadow-md">$1</span>' },
    { rx: /{green:(.*?)}/g, repl: '<span class="text-green-500 font-bold drop-shadow-md">$1</span>' },
    { rx: /{blue:(.*?)}/g, repl: '<span class="text-blue-400 font-bold drop-shadow-md">$1</span>' },
    { rx: /{gold:(.*?)}/g, repl: '<span class="text-yellow-500 font-bold drop-shadow-md">$1</span>' },
    { rx: /{purple:(.*?)}/g, repl: '<span class="text-purple-400 font-bold drop-shadow-md">$1</span>' },
    { rx: /{cyan:(.*?)}/g, repl: '<span class="text-cyan-400 font-bold drop-shadow-md">$1</span>' },
    { rx: /{orange:(.*?)}/g, repl: '<span class="text-orange-400 font-bold drop-shadow-md">$1</span>' },
    { rx: /{gray:(.*?)}/g, repl: '<span class="text-gray-500 italic">$1</span>' },
    { rx: /{void:(.*?)}/g, repl: '<span class="text-fuchsia-600 font-bold drop-shadow-md animate-pulse">$1</span>' },
    { rx: /{ethereal:(.*?)}/g, repl: '<span class="text-teal-300 italic drop-shadow-md">$1</span>' }
];

const logMessage = (text) => {
    if (!text || !messageLog) return; 

    // 1. SANITIZE: Turn "<script>" into "&lt;script&gt;"
    let safeText = escapeHtml(text);

    // 2. QoL WIN: Smart Auto-Highlighting
    let formattedText = safeText.replace(CRIT_REGEX, '{gold:$1}');

    // 3. FORMAT: Apply cached color tags
    for (let i = 0; i < FORMAT_REGEXES.length; i++) {
        formattedText = formattedText.replace(FORMAT_REGEXES[i].rx, FORMAT_REGEXES[i].repl);
    }

    // --- ANTI-SPAM LOGIC ---
    if (text === lastLogText && messageLog.firstChild) {
        lastLogCount++;
        messageLog.firstChild.innerHTML = `> ${formattedText} <span class="text-gray-400 ml-2 font-bold bg-black bg-opacity-40 px-1.5 py-0.5 rounded border border-gray-700 shadow-inner text-[10px]">(x${lastLogCount})</span>`;
        // JUICE: Small bump animation to show it updated physically
        messageLog.firstChild.style.animation = 'none';
        void messageLog.firstChild.offsetWidth; 
        messageLog.firstChild.style.animation = 'pop-in 0.15s ease-out';
        return; 
    }

    lastLogText = text;
    lastLogCount = 1;

    // 3. CREATE & APPEND NEW MESSAGE
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `> ${formattedText}`;
    
    // Slide down / fade in animation for new log messages
    messageElement.style.animation = 'fade-in 0.25s ease-out';
    messageElement.style.transformOrigin = 'top center';
    
    messageLog.prepend(messageElement);

    // --- STRICT CULLING ---
    // Remove the oldest messages if the log exceeds 40 lines.
    while (messageLog.children.length > 40) {
        messageLog.removeChild(messageLog.lastChild);
    }
    
    messageLog.scrollTop = 0;
};

// --- CORE STAT RENDERING ---
const renderStats = () => {
    renderStatusEffects();
    updateWeatherUI(); // Ensure weather/events are displayed

    for (const statName in statDisplays) {
        const element = statDisplays[statName];
        if (element && gameState.player.hasOwnProperty(statName)) {
            const value = gameState.player[statName];
            const label = statName.charAt(0).toUpperCase() + statName.slice(1);

            if (statName === 'level') {
                // LORE WIN: Display active titles with a shimmering magic effect!
                const titleStr = gameState.player.activeTitle ? `<span class="block text-[10px] uppercase tracking-widest mt-1 font-bold text-magic-shimmer">${gameState.player.activeTitle}</span>` : '';
                element.innerHTML = `Level: ${value}${titleStr}`;
            }
            else if (statName === 'xp') {
                const max = gameState.player.xpToNextLevel;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));

                element.innerHTML = `<span>XP</span> <span>${value} / ${max}</span>`;
                statBarElements.xp.style.width = `${percent}%`;

            } else if (statName === 'statPoints') {
                if (value > 0) {
                    element.textContent = `Stat Points: ${value}`;
                    element.classList.remove('hidden');
                    coreStatsPanel.classList.add('show-stat-buttons');
                } else {
                    element.classList.add('hidden');
                    coreStatsPanel.classList.remove('show-stat-buttons');
                }

            } else if (statName === 'health') {
                const max = gameState.player.maxHealth;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));

                statBarElements.health.style.width = `${percent}%`;
                
                let displayHealth = Math.ceil(value); 
                let healthString = `<span>Health</span> <span>${displayHealth}/${max}</span>`;

                if (gameState.player.shieldValue > 0) {
                    healthString += ` <span class="text-blue-400 absolute right-16">(+${Math.ceil(gameState.player.shieldValue)})</span>`;
                }
                
                element.innerHTML = healthString;

                element.classList.remove('text-red-500', 'text-yellow-500', 'text-green-500', 'text-purple-500'); 

                if (gameState.player.poisonTurns > 0) {
                    element.classList.add('text-purple-500');
                    statBarElements.health.style.backgroundColor = '#a855f7'; 
                    if(canvasWrapperEl) canvasWrapperEl.classList.add('critical-health'); 
                    if(statusPanel) statusPanel.classList.remove('border-red-600', 'shadow-[0_0_15px_rgba(220,38,38,0.5)]');
                } else {
                    if (percent > 60) {
                        element.classList.add('text-green-500');
                        statBarElements.health.style.backgroundColor = '#22c55e'; 
                        if(canvasWrapperEl) canvasWrapperEl.classList.remove('critical-health'); 
                        if(statusPanel) statusPanel.classList.remove('border-red-600', 'shadow-[0_0_15px_rgba(220,38,38,0.5)]');
                    } else if (percent > 25) {
                        element.classList.add('text-yellow-500');
                        statBarElements.health.style.backgroundColor = '#eab308'; 
                        if(canvasWrapperEl) canvasWrapperEl.classList.remove('critical-health'); 
                        if(statusPanel) statusPanel.classList.remove('border-red-600', 'shadow-[0_0_15px_rgba(220,38,38,0.5)]');
                    } else {
                        // JUICE WIN: Pulsing Red Vitals Panel on Critical Health
                        element.classList.add('text-red-500');
                        statBarElements.health.style.backgroundColor = '#ef4444'; 
                        if(canvasWrapperEl) canvasWrapperEl.classList.add('critical-health'); 
                        if(statusPanel) statusPanel.classList.add('border-red-600', 'shadow-[0_0_15px_rgba(220,38,38,0.5)]', 'transition-all', 'duration-300');
                    }
                }

            } else if (statName === 'mana') {
                const max = gameState.player.maxMana;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                
                statBarElements.mana.style.width = `${percent}%`;
                statBarElements.mana.style.backgroundColor = '#3b82f6';
                
                element.innerHTML = `<span>Mana</span> <span>${Math.floor(value)}/${max}</span>`;

            } else if (statName === 'stamina') {
                const max = gameState.player.maxStamina;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.stamina.style.width = `${percent}%`;
                element.innerHTML = `<span>Stamina</span> <span>${Math.floor(value)}/${max}</span>`;

                element.classList.remove('text-green-500', 'text-cyan-400');
                if (gameState.player.frostbiteTurns > 0) {
                    element.classList.add('text-cyan-400');
                    statBarElements.stamina.style.backgroundColor = '#38bdf8'; 
                } else {
                    element.classList.add('text-green-500');
                    statBarElements.stamina.style.backgroundColor = '#16a34a'; 
                }

            } else if (statName === 'wits') {
                let witsText = `${label}: ${value}`;
                if (gameState.player.witsBonus > 0) {
                    witsText += ` <span class="text-green-500">(+${gameState.player.witsBonus})</span>`;
                }
                element.innerHTML = witsText;

             } else if (statName === 'psyche') {
                const max = gameState.player.maxPsyche;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                
                statBarElements.psyche.style.width = `${percent}%`;
                statBarElements.psyche.style.backgroundColor = '#6366f1';
                
                element.innerHTML = `<span>Psyche</span> <span>${Math.floor(value)}/${max}</span>`;

            } else if (statName === 'hunger') {
                const max = gameState.player.maxHunger;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.hunger.style.width = `${percent}%`;
                element.innerHTML = `<span>Hunger</span> <span>${Math.floor(percent)}%</span>`; 

            } else if (statName === 'thirst') {
                const max = gameState.player.maxThirst;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.thirst.style.width = `${percent}%`;
                element.innerHTML = `<span>Thirst</span> <span>${Math.floor(percent)}%</span>`;

            } else {
                element.textContent = `${label}: ${value}`;
            }
        }
    }
    
    // Update Browser Tab Title
    if (gameState.mapMode && gameState.player && gameState.player.level) {
        document.title = `HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth} | Lvl ${gameState.player.level} - Caves & Castles`;
    }
    
    // --- JUICE WIN: FULL SCREEN FILTERS & FLASHES ---
    if (canvasWrapperEl) {
        // Clear old persistent filters
        canvasWrapperEl.classList.remove('frost-flash', 'void-distortion');
        
        // Apply persistent state filters
        if (gameState.player.frostbiteTurns > 0) canvasWrapperEl.classList.add('frost-flash');
        else if (gameState.player.madnessTurns > 0 || gameState.currentCaveTheme === 'VOID') canvasWrapperEl.classList.add('void-distortion');
        
        // Handle explosive one-time flashes (like lightning or level ups)
        if (gameState.screenFlash && gameState.screenFlash.alpha > 0) {
            // Apply a dynamic CSS filter overlay based on the requested color and alpha
            const hex = gameState.screenFlash.color || '#ffffff';
            const {r, g, b} = ColorUtils.hexToRgb(hex);
            const shadow = `inset 0 0 150px 50px rgba(${r}, ${g}, ${b}, ${gameState.screenFlash.alpha})`;
            const bg = `rgba(${r}, ${g}, ${b}, ${gameState.screenFlash.alpha * 0.3})`; // Subtle background tint
            
            // Override the standard box-shadow with our explosive one
            canvasWrapperEl.style.boxShadow = shadow;
            canvasWrapperEl.style.backgroundColor = bg;
            
            // Decay the flash for the next frame
            gameState.screenFlash.alpha -= gameState.screenFlash.decay;
            if (gameState.screenFlash.alpha <= 0) {
                gameState.screenFlash = null;
                canvasWrapperEl.style.boxShadow = ''; // Reset to default CSS
                canvasWrapperEl.style.backgroundColor = '';
            } else {
                // Keep calling renderStats to animate the decay if the flash is still active
                requestAnimationFrame(renderStats);
            }
        }
    }
};

// --- DYNAMIC WEATHER & EVENT DISPLAY ---
function updateWeatherUI() {
    if (!weatherDisplay) return;

    let displayString = '';
    let colorClass = 'text-gray-400';
    let hoverTitle = ''; // LORE WIN: Mechanical hints on hover

    if (gameState.mapMode === 'overworld') {
        if (gameState.isBloodMoon) {
            displayString = '🩸 BLOOD MOON';
            colorClass = 'text-red-500 animate-pulse';
            hoverTitle = "Monsters are frenzied, deal more damage, and grant double XP. Danger is extreme.";
        } else if (gameState.isEclipse) {
            displayString = '🌑 TOTAL ECLIPSE';
            colorClass = 'text-purple-500 font-bold';
            hoverTitle = "Absolute darkness. Ancient terrors stalk the land.";
        } else if (gameState.isLeylineSurge) {
            displayString = '⚡ LEYLINE SURGE';
            colorClass = 'text-blue-400 animate-pulse';
            hoverTitle = "Magic courses through the air. Spells cost less and hit harder.";
        } else if (gameState.weather !== 'clear') {
            if (gameState.weather === 'rain') { 
                displayString = '🌧️ Downpour'; 
                colorClass = 'text-blue-400'; 
                hoverTitle = "Fire magic is weakened. Fish are biting."; 
            }
            if (gameState.weather === 'storm') { 
                displayString = '⛈️ Thunderstorm'; 
                colorClass = 'text-yellow-400'; 
                hoverTitle = "Lightning magic is amplified. Beware of random lightning strikes."; 
            }
            if (gameState.weather === 'snow') { 
                displayString = '❄️ Blizzard'; 
                colorClass = 'text-cyan-300'; 
                hoverTitle = "Frost magic is deadly. Movement requires more stamina."; 
            }
            if (gameState.weather === 'fog') { 
                displayString = '🌫️ Dense Fog'; 
                colorClass = 'text-gray-400'; 
                hoverTitle = "Visibility is severely reduced. Ambush risk is high."; 
            }
        }
    }

    // GAMEPLAY WIN: Multiverse UI Indication
    // If the player steps into an alternate dimension, display its rules immediately!
    if (gameState.currentRealm !== 0 && gameState.currentRealm) {
        if (typeof window.REALM_MUTATORS !== 'undefined' && gameState.realmMutators && gameState.realmMutators.length > 0) {
            const mutatorNames = gameState.realmMutators.map(m => window.REALM_MUTATORS[m]?.name || "Unknown").join(", ");
            if (displayString) {
                displayString += ` | 🌌 [${mutatorNames}]`;
            } else {
                displayString = `🌌 ANOMALY: [${mutatorNames}]`;
            }
            // Anomaly overrides color
            colorClass = 'text-purple-400 animate-pulse';
            hoverTitle = "The fundamental rules of reality have been altered in this dimension.";
        } else {
            // Failsafe string for pure procedural dimensions
            if (displayString) displayString += ` | 🌌 DIMENSION #${gameState.currentRealm}`;
            else displayString = `🌌 DIMENSION #${gameState.currentRealm}`;
            colorClass = 'text-purple-400';
            hoverTitle = "You are far from home. Proceed with extreme caution.";
        }
    }

    if (displayString) {
        weatherDisplay.innerHTML = displayString;
        weatherDisplay.className = `text-[10px] font-bold mt-1 tracking-widest uppercase block cursor-help ${colorClass}`;
        weatherDisplay.title = hoverTitle;
    } else {
        weatherDisplay.classList.add('hidden');
    }
}

// --- INVENTORY SORTING MECHANIC ---
window.sortInventory = function() {
    if (!gameState.player.inventory) return;

    const originalLength = gameState.player.inventory.length;
    let didConsolidate = false;

    // 1. Consolidate stacks (Merge partial stacks of arrows, meat, logs, etc)
    const consolidated = [];
    gameState.player.inventory.forEach(item => {
        const isStackable = ['junk', 'consumable', 'trade', 'ingredient', 'ammo'].includes(item.type);
        
        const existing = consolidated.find(i => 
            i.name === item.name && 
            !i.isEquipped && 
            !item.isEquipped && 
            isStackable
        );
        
        if (existing) {
            existing.quantity += item.quantity;
            didConsolidate = true;
        } else {
            consolidated.push({...item}); 
        }
    });

    // 2. Sort by Type, then Name
    const typeWeights = { 
        'weapon': 1, 'armor': 2, 'accessory': 3, 'ammo': 4, 
        'consumable': 5, 'tool': 6, 'spellbook': 7, 'quest': 8, 'trade': 9, 'junk': 10 
    };
    
    // Create a string representation of the array before sorting to check for changes
    const preSortString = consolidated.map(i => i.name).join();

    consolidated.sort((a, b) => {
        // Equipped gear ALWAYS floats to the top
        if (a.isEquipped !== b.isEquipped) return a.isEquipped ? -1 : 1; 
        
        const wA = typeWeights[a.type] || 20;
        const wB = typeWeights[b.type] || 20;
        
        if (wA !== wB) return wA - wB; // Sort by category
        return a.name.localeCompare(b.name); // Alphabetical within category
    });

    const postSortString = consolidated.map(i => i.name).join();

    // PERFORMANCE: Only update DB and UI if the sort ACTUALLY changed something
    if (didConsolidate || preSortString !== postSortString || originalLength !== consolidated.length) {
        gameState.player.inventory = consolidated;

        if (typeof playerRef !== 'undefined' && playerRef) {
            playerRef.update({ inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : consolidated });
        }
        renderInventory();
    }
    
    // ANTI-SPAM AUDIO
    const now = Date.now();
    if (!window.lastSortAudio || now - window.lastSortAudio > 300) {
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep(); 
        window.lastSortAudio = now;
    }
};

// --- INVENTORY RENDERING (Optimized with DocumentFragment) ---
const renderInventory = () => {
    inventoryModalList.innerHTML = '';
    const titleElement = document.querySelector('#inventoryModal h2');

    // Dynamically inject the Auto-Sort button into the header if missing
    if (titleElement) {
        if (!titleElement.querySelector('#sortInvBtn')) {
            const titleText = titleElement.textContent;
            titleElement.innerHTML = `
                <div class="flex justify-between items-center w-full">
                    <span id="invTitleText">${titleText}</span>
                    <button id="sortInvBtn" onclick="sortInventory()" title="Consolidate and sort inventory" class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow transition-all active:scale-95 border-b-2 border-blue-800 active:border-b-0 active:mt-0.5 drop-shadow-sm">Auto-Sort</button>
                </div>
            `;
        }
        
        const titleSpan = document.getElementById('invTitleText');
        if (gameState.isDroppingItem) {
            titleSpan.textContent = "SELECT ITEM TO DROP";
            titleSpan.className = 'text-red-500 font-extrabold animate-pulse drop-shadow-md';
        } else {
            titleSpan.textContent = "Inventory";
            titleSpan.className = 'text-default font-bold';
        }
    }

    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryModalList.innerHTML = '<div class="w-full text-center mt-8 text-gray-500 italic font-serif">Your bag is completely empty.</div>';
    } else {
        // PERFORMANCE: Batch DOM updates using DocumentFragment
        const fragment = document.createDocumentFragment();

        gameState.player.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');

            let slotClass = 'inventory-slot p-2 rounded-xl cursor-pointer transition-all duration-200';
            
            if (gameState.isDroppingItem) {
                slotClass += ' border-2 border-red-500 bg-red-900 bg-opacity-20 hover:bg-opacity-40';
            } else if (item.isEquipped) {
                slotClass += ' equipped';
            } else if (item.type === 'consumable') {
                slotClass += ' bg-blue-900 bg-opacity-10 hover:border-blue-500';
            } else {
                slotClass += ' hover:border-blue-500 hover:bg-gray-800';
            }

            // JUICE WIN: Dynamic Borders for Magical/Rare Items!
            if (!item.isEquipped && item._rarity) {
                if (item._rarity === 'rare') slotClass += ' rarity-rare border-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.3)]';
                else if (item._rarity === 'epic') slotClass += ' rarity-epic border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.3)]';
                else if (item._rarity === 'legendary') slotClass += ' rarity-legendary border-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.3)]';
            }
            
            itemDiv.className = slotClass;
            
            // SECURITY & PERFORMANCE WIN: Removed inline onclick for event delegation logic!
            itemDiv.dataset.index = index;

            // Build the Native Tooltip
            let title = item.name;
            if (item.type === 'treasure_map') title = `🗺️ ${title}`; // QoL
            
            if (item.statBonuses) {
                title += " (";
                let bonuses = [];
                for (const stat in item.statBonuses) {
                    bonuses.push(`${item.statBonuses[stat] > 0 ? '+' : ''}${item.statBonuses[stat]} ${stat}`);
                }
                title += bonuses.join(', ') + ")";
            }

            // QoL WIN: Dynamic Equipment Comparison!
            if (!item.isEquipped && (item.type === 'weapon' || item.type === 'armor')) {
                const isWpn = item.type === 'weapon';
                const equippedItem = isWpn ? gameState.player.equipment.weapon : gameState.player.equipment.armor;
                
                if (equippedItem) {
                    const statName = isWpn ? 'damage' : 'defense';
                    const myStat = item[statName] || 0;
                    const eqStat = equippedItem[statName] || 0;
                    const diff = myStat - eqStat;
                    
                    if (diff > 0) title += `\n[ Better than equipped: +${diff} ${statName} ]`;
                    else if (diff < 0) title += `\n[ Worse than equipped: ${diff} ${statName} ]`;
                    else title += `\n[ Equal to equipped ]`;
                }
            }

            itemDiv.title = title;

            const itemChar = document.createElement('span');
            itemChar.className = 'item-char text-3xl mb-1';
            itemChar.textContent = item.tile || '🎒';

            const itemQuantity = document.createElement('span');
            itemQuantity.className = 'item-quantity bg-black bg-opacity-70 text-white px-1.5 rounded border border-gray-700 font-bold';
            itemQuantity.textContent = `x${item.quantity}`;

            const slotNumber = document.createElement('span');
            slotNumber.className = 'absolute top-1 left-1.5 text-[10px] text-gray-500 font-bold';
            if (index < 9) slotNumber.textContent = index + 1;

            if (item.isEquipped) {
                const equipBadge = document.createElement('span');
                equipBadge.className = 'absolute top-0 right-0 bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 font-bold rounded-bl-lg rounded-tr-xl shadow-sm';
                equipBadge.textContent = 'EQP';
                itemDiv.appendChild(equipBadge);
            }

            // Show a hover "Bind" button for usables!
            if (item.type === 'consumable' || item.type === 'instant' || item.type === 'tool') {
                const assignBtn = document.createElement('button');
                // Uses Tailwind group-hover to only appear when mousing over the item
                assignBtn.className = 'absolute -bottom-2 right-0 bg-blue-600 hover:bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow z-20 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity border-b border-blue-800 active:border-b-0 active:translate-y-px';
                assignBtn.textContent = 'Bind';
                
                // SECURITY & PERFORMANCE WIN: Event Delegation data attributes
                assignBtn.dataset.action = 'bind';
                assignBtn.dataset.id = item.templateId || item.name;
                
                itemDiv.classList.add('group'); // Attach group class to parent
                itemDiv.appendChild(assignBtn);
            }

            itemDiv.appendChild(slotNumber);
            itemDiv.appendChild(itemChar);
            itemDiv.appendChild(itemQuantity);
            fragment.appendChild(itemDiv);
        });
        
        inventoryModalList.appendChild(fragment); // Single paint!
    }
};

function initInventoryListeners() {
    const btn = document.getElementById('closeInventoryButton');
    const modal = document.getElementById('inventoryModal');
    const listEl = document.getElementById('inventoryModalList');

    // SECURITY & PERFORMANCE WIN: Universal Event Delegation for the Inventory List!
    // We attach exactly ONE listener to the list container instead of 9+ listeners every render cycle.
    if (listEl && !listEl.dataset.listenersBound) {
        listEl.addEventListener('click', (e) => {
            // Check if they clicked the 'Bind' button first
            const bindBtn = e.target.closest('button[data-action="bind"]');
            if (bindBtn) {
                e.stopPropagation();
                if (typeof assignToHotbar === 'function') assignToHotbar(bindBtn.dataset.id);
                return;
            }

            // Otherwise, check if they clicked an inventory slot
            const itemDiv = e.target.closest('.inventory-slot');
            if (itemDiv) {
                e.stopPropagation();
                const idx = parseInt(itemDiv.dataset.index, 10);
                if (!isNaN(idx) && typeof handleInput === 'function') {
                    handleInput((idx + 1).toString()); // Safely route interaction through central input handler
                }
            }
        });
        listEl.dataset.listenersBound = 'true';
    }

    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.toggleModal === 'function') {
                window.toggleModal(inventoryModal, openInventoryModal, closeInventoryModal);
            } else {
                closeInventoryModal();
            }
        };
        btn.ontouchend = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.toggleModal === 'function') {
                window.toggleModal(inventoryModal, openInventoryModal, closeInventoryModal);
            } else {
                closeInventoryModal();
            }
        };
    }

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                if (typeof window.toggleModal === 'function') {
                    window.toggleModal(inventoryModal, openInventoryModal, closeInventoryModal);
                } else {
                    closeInventoryModal();
                }
            }
        };
    }
}

// --- EQUIPMENT RENDERING & TOOLTIPS ---
const renderEquipment = () => {
    const player = gameState.player;
    const equip = player.equipment;

    const weapon = equip.weapon || { name: 'Fists', damage: 0 };
    const armor = equip.armor || { name: 'Tattered Rags', defense: 0 };
    const offhand = equip.offhand;
    const acc = equip.accessory;
    const ammo = equip.ammo;

    // --- UI/UX WIN: Dynamic Empty Slot Styling & Lore Hints ---
    const applySlotStyle = (iconElement, isEmpty) => {
        if (!iconElement) return;
        if (isEmpty) {
            iconElement.className = 'equipment-slot text-3xl opacity-30 border-dashed border-gray-600 transition-all cursor-help';
        } else {
            iconElement.className = 'equipment-slot text-3xl border-solid border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all bg-black bg-opacity-20 cursor-pointer';
        }
    };

    // --- DAMAGE CALCULATION ---
    const playerStrength = player.strength + (player.strengthBonus || 0); 
    const weaponDamage = weapon.damage || 0;
    const ammoDamage = ammo ? (ammo.damage || 0) : 0;
    const totalDamage = playerStrength + weaponDamage + ammoDamage;

    let weaponString = `Wpn: ${weapon.name} (+${weaponDamage})`;
    // QoL WIN: Explicitly show base + bonus stats in the tooltip
    let weaponTooltip = `${weapon.name}\nBase Damage: +${weaponDamage}\n(Your Total: ${totalDamage})`;
    
    if (weapon.name === 'Fists') {
        weaponTooltip = "Empty Main Hand: Your fists deal base damage based on Strength.";
    } else {
        if (weapon.isTwoHanded) weaponTooltip += "\n(Two-Handed Weapon)";
        
        if (weapon.statBonuses) {
            const bonusArr = Object.entries(weapon.statBonuses).map(([k, v]) => `${v >= 0 ? '+' : ''}${v} ${k.substring(0,3).toUpperCase()}`);
            if (bonusArr.length > 0) {
                weaponString += ` <span class="text-indigo-400">[${bonusArr.join(', ')}]</span>`;
                weaponTooltip += `\nBonuses: ${Object.entries(weapon.statBonuses).map(([k, v]) => `+${v} ${k}`).join(', ')}`;
            }
        }
    }
    
    if (player.strengthBonus > 0) { 
        weaponString += ` <span class="text-green-500 drop-shadow-sm">[+${player.strengthBonus} Str (${player.strengthBonusTurns}t)]</span>`;
    }
    equippedWeaponDisplay.innerHTML = weaponString;
    statDisplays.strength.textContent = `Strength: ${player.strength} (Dmg: ${totalDamage})`;

    // --- DEFENSE CALCULATION ---
    const baseDefense = Math.floor((player.dexterity || 1) / 3);
    const armorDefense = armor.defense || 0;
    const offhandDefense = offhand ? (offhand.defense || 0) : 0;
    const accDefense = acc ? (acc.defense || 0) : 0;
    const buffDefense = player.defenseBonus || 0;
    const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
    const conBonus = Math.floor((player.constitution || 1) * 0.1); 
    
    const totalDefense = baseDefense + armorDefense + offhandDefense + accDefense + buffDefense + conBonus + talentDefense;

    let armorString = `Body: ${armor.name} (+${armorDefense})`;
    let armorTooltip = `${armor.name}\nBase Defense: +${armorDefense}\n(Your Total: ${totalDefense})`;
    
    if (armor.name === 'Tattered Rags' || armor.name === 'Simple Tunic') {
        armorTooltip = `${armor.name}\nEmpty Body: No robust armor equipped. You are vulnerable.`;
    } else if (armor.statBonuses) {
        const bonusArr = Object.entries(armor.statBonuses).map(([k, v]) => `${v >= 0 ? '+' : ''}${v} ${k.substring(0,3).toUpperCase()}`);
        if (bonusArr.length > 0) {
            armorString += ` <span class="text-indigo-400">[${bonusArr.join(', ')}]</span>`;
            armorTooltip += `\nBonuses: ${Object.entries(armor.statBonuses).map(([k, v]) => `+${v} ${k}`).join(', ')}`;
        }
    }
    if (buffDefense > 0) {
        armorString += ` <span class="text-green-500 drop-shadow-sm">[+${buffDefense} Def (${player.defenseBonusTurns}t)]</span>`;
    }
    equippedArmorDisplay.innerHTML = `${armorString} <br><span class="text-gray-400 font-bold bg-black bg-opacity-30 px-2 py-0.5 rounded border border-gray-700 mt-1 inline-block">(Total: ${totalDefense} Def)</span>`;

    // --- MISC / ACC DISPLAY ---
    let miscString = "";
    if (offhand) miscString += `Off: ${offhand.name} | `;
    if (acc) miscString += `Acc: ${acc.name}`;
    if (!offhand && !acc) miscString = "Off-Hand & Accessory Empty";
    document.getElementById('equippedMiscDisplay').textContent = miscString;

    // --- UPDATE ICONS & HOVER TOOLTIPS ---
    const wIcon = document.getElementById('slotWeaponIcon');
    const aIcon = document.getElementById('slotArmorIcon');
    const oIcon = document.getElementById('slotOffhandIcon');
    const cIcon = document.getElementById('slotAccessoryIcon');
    const mIcon = document.getElementById('slotAmmoIcon');
    const ammoCount = document.getElementById('ammoCountDisplay');

    if (wIcon) {
        wIcon.textContent = (weapon.tile || '👊').replace(/[a-zA-Z]/g, '');
        applySlotStyle(wIcon, weapon.name === 'Fists');
        wIcon.title = weaponTooltip; 
    }
    if (aIcon) {
        aIcon.textContent = (armor.tile || '👕').replace(/[a-zA-Z]/g, '');
        applySlotStyle(aIcon, armor.name === 'Simple Tunic' || armor.name === 'Tattered Rags');
        aIcon.title = armorTooltip;
    }
    if (oIcon) {
        oIcon.textContent = offhand ? offhand.tile.replace(/[a-zA-Z]/g, '') : '🛡️';
        applySlotStyle(oIcon, !offhand);
        
        let oTip = offhand ? `${offhand.name}\nDefense: +${offhand.defense || 0}` : 'Empty Off-Hand: Equip a shield to block or a secondary item.';
        if (weapon.isTwoHanded && !offhand) oTip = `(Blocked: Wielding a Two-Handed Weapon)`;
        oIcon.title = oTip;
    }
    if (cIcon) {
        cIcon.textContent = acc ? acc.tile.replace(/[a-zA-Z]/g, '') : '💍';
        applySlotStyle(cIcon, !acc);
        let accTooltip = acc ? acc.name : 'Empty Accessory: Magic rings and amulets go here.';
        if (acc && acc.statBonuses) accTooltip += `\nBonuses: ${Object.entries(acc.statBonuses).map(([k, v]) => `+${v} ${k}`).join(', ')}`;
        cIcon.title = accTooltip;
    }
    if (mIcon && ammoCount) {
        mIcon.childNodes[0].nodeValue = ammo ? ammo.tile.replace(/[a-zA-Z]/g, '') : '➹';
        applySlotStyle(mIcon, !ammo);
        mIcon.title = ammo ? `${ammo.name}\nDamage: +${ammo.damage || 0}\nRemaining: ${ammo.quantity}` : 'Empty Ammo: Arrows and bolts for ranged weapons.';
        
        ammoCount.textContent = ammo ? ammo.quantity : '';
        ammoCount.style.display = ammo ? 'block' : 'none';
    }
};

function updateRegionDisplay() {
    if (gameState.mapMode === 'overworld') {
        const currentRegionX = Math.floor(gameState.player.x / REGION_SIZE);
        const currentRegionY = Math.floor(gameState.player.y / REGION_SIZE);
        const regionId = `${currentRegionX},${currentRegionY}`;

        // PERFORMANCE WIN: Cache the region name so we don't recalculate RNG strings 60 times a second
        if (!window.lastRegionCache || window.lastRegionCache.id !== regionId) {
            window.lastRegionCache = {
                id: regionId,
                name: typeof getRegionName === 'function' ? getRegionName(currentRegionX, currentRegionY) : 'Wilderness'
            };
        }
        
        let regionName = window.lastRegionCache.name;
        
        // LORE WIN: Dynamic vehicle flavor text
        if (gameState.player.isMounted && gameState.player.companion) regionName = `Riding through ${regionName}`;
        if (gameState.player.isBoating) regionName = `Paddling through ${regionName}`;
        if (gameState.player.isSailing) regionName = `Sailing the coast of ${regionName}`;
        
        const playerCoords = `(${gameState.player.x}, ${-gameState.player.y})`; 
        regionDisplay.textContent = `${regionName} ${playerCoords}`; 

        if (!gameState.discoveredRegions.has(regionId)) {
            logMessage(`{gold:Discovered: ${window.lastRegionCache.name}!}`); 
            
            // --- Procedural Regional Lore ---
            const seed = stringToSeed(regionId);
            const random = Alea(seed);
            const history = window.REGION_HISTORY[Math.floor(random() * window.REGION_HISTORY.length)];
            logMessage(`{gray:Codex: ${history}}`); // Prints the lore!

            gameState.discoveredRegions.add(regionId);
            if(typeof grantXp === 'function') grantXp(50);
            
            // Check if there is a major landmark here to pin on the map
            const currentTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(gameState.player.x, gameState.player.y) : '.';
            if (['V', '🏰', '♛', '⛰', '🕍', '🌋', '🛕'].includes(currentTile)) {
                if (!gameState.player.discoveredPOIs) gameState.player.discoveredPOIs = [];
                
                gameState.player.discoveredPOIs.push({
                    x: gameState.player.x, 
                    y: gameState.player.y, 
                    icon: currentTile, 
                    name: window.lastRegionCache.name
                });
                
                logMessage(`{blue:Point of Interest added to your map.}`);
            }

            // Save XP, level, and Map data instantly!
            if (typeof playerRef !== 'undefined' && playerRef) {
                playerRef.update({ 
                    discoveredRegions: Array.from(gameState.discoveredRegions),
                    discoveredPOIs: gameState.player.discoveredPOIs || [],
                    xp: gameState.player.xp,
                    level: gameState.player.level,
                    statPoints: gameState.player.statPoints
                });
            }
            
            if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playDiscovery === 'function') {
                AudioSystem.playDiscovery();
            }
            if (typeof ParticleSystem !== 'undefined') {
                ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#facc15', 30);
            }
        }
    } else if (gameState.mapMode === 'dungeon') {
        let displayName = typeof getCaveName === 'function' ? getCaveName(gameState.currentCaveId) : 'Dark Cave';
        
        // Extract Z-depth from ID (cave_X_Y_Z)
        const parts = gameState.currentCaveId ? gameState.currentCaveId.split('_') : [];
        if (parts.length > 3 && !isNaN(parts[3])) {
            const floorZ = parts[3];
            displayName += ` (Floor ${floorZ})`;
        }
        
        regionDisplay.textContent = displayName;
    } else if (gameState.mapMode === 'castle') {
        regionDisplay.textContent = typeof getCastleName === 'function' ? getCastleName(gameState.currentCastleId) : 'Castle Ruins'; 
    }
}

// JUICE: Reflow DOM to ensure rapid flashes restart their animations properly!
function triggerStatFlash(statElement, positive = true) {
    if (!statElement) return;
    const animationClass = positive ? 'stat-flash-green' : 'stat-flash-red';
    
    statElement.classList.remove(animationClass);
    void statElement.offsetWidth; 
    statElement.classList.add(animationClass);
    
    statElement.onanimationend = () => {
        statElement.classList.remove(animationClass);
    };
}

function triggerStatAnimation(statElement, animationClass) {
    if (!statElement) return;
    statElement.classList.remove(animationClass);
    void statElement.offsetWidth; 
    statElement.classList.add(animationClass);
    
    statElement.onanimationend = () => {
        statElement.classList.remove(animationClass);
    };
}

function renderStatusEffects() {
    if (!statusEffectsPanel) return; 

    const player = gameState.player;
    let icons = ''; 

    // --- MOUNTS & VEHICLES ---
    if (player.isMounted && player.companion) {
        icons += `<span title="Mounted: ${player.companion.name}" class="drop-shadow-md cursor-help text-orange-400 relative top-[-2px]">${player.companion.tile || '🐎'}</span>`;
    }
    if (player.isSailing) {
        icons += `<span title="Sailing Ship" class="drop-shadow-md cursor-help text-blue-400">⛵</span>`;
    } else if (player.isBoating) {
        icons += `<span title="Canoe" class="drop-shadow-md cursor-help text-green-600">🛶</span>`;
    }

    // --- BUFFS & DEBUFFS ---
    if (player.shieldValue > 0) {
        icons += `<span title="Arcane Shield (${Math.ceil(player.shieldValue)} points, ${player.shieldTurns}t)" class="drop-shadow-md cursor-help">💠</span>`;
    }
    if (player.defenseBonusTurns > 0) {
        icons += `<span title="Braced (+${player.defenseBonus} Def, ${player.defenseBonusTurns}t)" class="drop-shadow-md cursor-help">🛡️</span>`;
    }
    if (player.strengthBonusTurns > 0) {
        icons += `<span title="Strong (+${player.strengthBonus} Str, ${player.strengthBonusTurns}t)" class="drop-shadow-md cursor-help">💪</span>`;
    }
    if (player.poisonTurns > 0) {
        icons += `<span title="Poisoned (${player.poisonTurns}t)" class="text-green-500 animate-pulse drop-shadow-md cursor-help">☣️</span>`;
    }
    if (player.frostbiteTurns > 0) {
        icons += `<span title="Frostbitten (${player.frostbiteTurns}t)" class="text-cyan-400 drop-shadow-md cursor-help">❄️</span>`;
    }
    if (player.madnessTurns > 0) {
        icons += `<span title="Void Madness (${player.madnessTurns}t)" class="text-purple-500 animate-spin drop-shadow-md inline-block cursor-help">👁️</span>`;
    }

    statusEffectsPanel.innerHTML = icons;
}

// --- FIX: INFINITE RESIZE LOOP & OVERSTRETCHING ---
function resizeCanvas() {
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return;

    // ROBUSTNESS: Ensure exact pixel math without forcing the container to warp
    canvas.style.display = 'none';
    
    // We must read the exact client dimensions *after* hiding the canvas 
    // to prevent the container from getting stuck in an oversized state.
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    
    canvas.style.display = 'block';

    if (containerWidth === 0 || containerHeight === 0) return; // Prevent crashes when hidden

    // Directly sync TILE_SIZE to our global zoom state
    TILE_SIZE = window.currentZoom;

    // 3. Calculate Logical Viewport (The number of tiles that fit on screen)
    // Add a safe buffer of +2 to ensure scrolling never exposes empty pixels at the edges
    VIEWPORT_WIDTH = Math.ceil(containerWidth / TILE_SIZE) + 2; 
    VIEWPORT_HEIGHT = Math.ceil(containerHeight / TILE_SIZE) + 2;

    const dpr = window.devicePixelRatio || 1;

    // 4. Set HTML5 Canvas back-buffer resolution (The actual pixel density)
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;

    // 5. Force CSS width/height to match container exactly
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    // 6. Configure Main Context
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.scale(dpr, dpr); 
    ctx.imageSmoothingEnabled = false; 
    ctx.font = `${TILE_SIZE}px monospace`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 7. Resize Offscreen Canvas (Added +4 Buffer for camera panning)
    const logicalWidth = (VIEWPORT_WIDTH + 4) * TILE_SIZE; 
    const logicalHeight = (VIEWPORT_HEIGHT + 4) * TILE_SIZE; 

    terrainCanvas.width = logicalWidth * dpr;
    terrainCanvas.height = logicalHeight * dpr;
    
    // 8. Configure Offscreen Context
    terrainCtx.setTransform(1, 0, 0, 1, 0, 0); 
    terrainCtx.scale(dpr, dpr); 
    terrainCtx.font = `${TILE_SIZE}px monospace`; 
    terrainCtx.textAlign = 'center';
    terrainCtx.textBaseline = 'middle';

    // 9. Force Redraw
    if (typeof gameState !== 'undefined') {
        gameState.mapDirty = true; 
        if (typeof render === 'function') render();
    }
}

// LORE EXPANSION WIN: Inject RPG Tooltips into the Stat Panel
(function initStatTooltips() {
    const statDescriptions = {
        // Core Profile
        level: "Level: Represents your overall power and experience. You gain Stat Points and occasionally Mastery Talents when leveling up.",
        xp: "Experience: Earned by slaying monsters, exploring regions, and discovering lore. Fills to increase your Level.",
        coins: "Gold Coins: The currency of the realm. Used for trading, camp upgrades, and magical fountains.",
        // Vitals
        health: "Health: The physical toll your body can endure. If it hits 0, you die and lose gold/items.",
        mana: "Mana: Magical essence channeled from the leylines. Used to cast Spells and Fast Travel.",
        stamina: "Stamina: Physical energy. Used to perform powerful Weapon Skills, run, or mine ore.",
        psyche: "Psyche: Mental fortitude. Required to tame beasts, pacify enemies, and resist Void madness.",
        hunger: "Hunger: Determines natural healing. If empty, you stop regenerating Health over time.",
        thirst: "Thirst: Determines physical recovery. If empty, you stop regenerating Stamina over time.",
        // Attributes
        strength: "Strength: Modifies raw Melee Damage. Also improves mining yield, carry capacity, and unarmed damage.",
        wits: "Wits: Increases Spell Damage, Arcane Shield strength, and expands maximum Mana reserves.",
        constitution: "Constitution: Hardens the body. Increases base Defense and expands maximum Health.",
        dexterity: "Dexterity: Enhances reflexes. Increases Dodge chance, Stealth duration, Ranged Damage, and Fishing catch rate.",
        charisma: "Charisma: The art of influence. Grants better Shop Prices and improves the chance to Tame/Pacify beasts and Mount success.",
        luck: "Luck: Bends fate. Increases Critical Hit chance, Dodge chance, rare Magic Loot drops, and Trophy Fish rates.",
        willpower: "Willpower: Dark resilience. Increases Max Psyche, Dark/Frost spell damage, and summon health.",
        perception: "Perception: Keen senses. Improves combat Accuracy and the chance to passively spot Secret Doors.",
        endurance: "Endurance: Tireless resolve. Increases Max Stamina and improves resistance to Swamp Sickness.",
        intuition: "Intuition: Connection to nature. Improves Druidic spells and senses unseen enemies nearby."
    };

    setTimeout(() => {
        for (const stat in statDescriptions) {
            const displayEl = statDisplays[stat];
            if (displayEl && displayEl.parentElement) {
                displayEl.parentElement.title = statDescriptions[stat];
                displayEl.parentElement.classList.add('cursor-help'); 
            }
        }
    }, 500);
})();

// --- ZOOM EVENT LISTENER ---
if (canvasWrapperEl) {
    canvasWrapperEl.addEventListener('wheel', (e) => {
        e.preventDefault(); 
        
        const zoomDirection = Math.sign(e.deltaY);
        
        if (zoomDirection < 0) {
            window.currentZoom = Math.min(40, window.currentZoom + 2); // Max zoom in
        } else if (zoomDirection > 0) {
            window.currentZoom = Math.max(12, window.currentZoom - 2); // Max zoom out
        }
        
        resizeCanvas();
    }, { passive: false });
}

// --- Add return focus to Canvas after closing modals ---
function returnFocusToCanvas() {
    // Only focus if the canvas is actually visible
    if (!gameContainer.classList.contains('hidden')) {
        if (document.activeElement) document.activeElement.blur(); 
    }
}

// Wrap all existing close buttons
const attachCloseFocus = (btn) => {
    if (btn) btn.addEventListener('click', returnFocusToCanvas);
};

attachCloseFocus(closeInventoryButton);
attachCloseFocus(closeSpellButton);
attachCloseFocus(closeSkillButton);
attachCloseFocus(closeQuestButton);
attachCloseFocus(closeShopButton);
attachCloseFocus(closeCraftingButton);
attachCloseFocus(closeSkillTrainerButton);
attachCloseFocus(document.getElementById('closeStashButton'));
attachCloseFocus(document.getElementById('closeCollectionsButton'));
attachCloseFocus(closeLoreButton);
attachCloseFocus(document.getElementById('closeMapButton'));
attachCloseFocus(document.getElementById('closeFastTravelButton'));
attachCloseFocus(closeHelpButton);

// Update Modal toggler from input.js to also call this
const originalToggleModal = window.toggleModal;
window.toggleModal = (modalEl, openFunc, closeFunc) => {
    if (typeof inputQueue !== 'undefined') inputQueue.length = 0; 
    if (!modalEl.classList.contains('hidden')) {
        if (closeFunc) closeFunc();
        else modalEl.classList.add('hidden');
        returnFocusToCanvas(); // Ensure focus returns!
    } else {
        openFunc();
    }
};

// ==========================================
// GAME SETTINGS & VISUALS
// ==========================================

// Load visual settings from localStorage
function loadVisualSettings() {
    const defaultSettings = { crt: true };
    const saved = localStorage.getItem('visualSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
}

// Applies the CRT visual filter based on saved preferences
function applyVisualSettings() {
    const settings = loadVisualSettings();
    if (canvasWrapperEl) {
        if (settings.crt) {
            canvasWrapperEl.classList.add('crt');
        } else {
            canvasWrapperEl.classList.remove('crt');
        }
    }
}

// Binds all the checkboxes and buttons inside the Settings Modal
function initSettingsListeners() {
    const settingsBtn = document.getElementById('settingsButton');
    const closeSettingsBtn = document.getElementById('closeSettingsButton');
    const settingsModal = document.getElementById('settingsModal');

    // Audio checkboxes
    const settingMaster = document.getElementById('settingMaster');
    const settingSteps = document.getElementById('settingSteps');
    const settingCombat = document.getElementById('settingCombat');
    const settingMagic = document.getElementById('settingMagic');
    const settingUI = document.getElementById('settingUI');

    // Visual checkboxes
    const settingCRT = document.getElementById('settingCRT');

    // Backup Buttons
    const btnManualSave = document.getElementById('btnManualSave');
    const btnBackup = document.getElementById('btnBackup');
    const btnRestore = document.getElementById('btnRestore');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            // Sync modal UI checkboxes to the actual engine state
            if (typeof AudioSystem !== 'undefined') {
                if (settingMaster) settingMaster.checked = AudioSystem.settings.master;
                if (settingSteps) settingSteps.checked = AudioSystem.settings.steps;
                if (settingCombat) settingCombat.checked = AudioSystem.settings.combat;
                if (settingMagic) settingMagic.checked = AudioSystem.settings.magic;
                if (settingUI) settingUI.checked = AudioSystem.settings.ui;
            }

            const visualSettings = loadVisualSettings();
            if (settingCRT) settingCRT.checked = visualSettings.crt;

            // Refresh the "Last Backup" text
            if (typeof updateBackupUI === 'function') updateBackupUI();

            settingsModal.classList.remove('hidden');
        });
    }

    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
        
        // Let players close settings with the Escape key or clicking outside
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
    }

    // Audio Handlers
    const updateAudioSettings = () => {
        if (typeof AudioSystem !== 'undefined') {
            AudioSystem.settings.master = settingMaster.checked;
            AudioSystem.settings.steps = settingSteps.checked;
            AudioSystem.settings.combat = settingCombat.checked;
            AudioSystem.settings.magic = settingMagic.checked;
            AudioSystem.settings.ui = settingUI.checked;
            AudioSystem.saveSettings();
        }
    };

    if (settingMaster) settingMaster.addEventListener('change', updateAudioSettings);
    if (settingSteps) settingSteps.addEventListener('change', updateAudioSettings);
    if (settingCombat) settingCombat.addEventListener('change', updateAudioSettings);
    if (settingMagic) settingMagic.addEventListener('change', updateAudioSettings);
    if (settingUI) settingUI.addEventListener('change', updateAudioSettings);

    // Visual Handlers
    if (settingCRT) {
        settingCRT.addEventListener('change', (e) => {
            const visualSettings = loadVisualSettings();
            visualSettings.crt = e.target.checked;
            localStorage.setItem('visualSettings', JSON.stringify(visualSettings));
            applyVisualSettings();
        });
    }

    // Save & Backup Handlers
    if (btnManualSave) {
        btnManualSave.addEventListener('click', () => {
            if (typeof manualSaveGame === 'function') manualSaveGame();
        });
    }

    if (btnBackup) {
        btnBackup.addEventListener('click', () => {
            if (typeof createCloudBackup === 'function') createCloudBackup();
        });
    }

    if (btnRestore) {
        btnRestore.addEventListener('click', () => {
            if (typeof restoreCloudBackup === 'function') restoreCloudBackup();
        });
    }
}

// --- END OF FILE ui.js ---
