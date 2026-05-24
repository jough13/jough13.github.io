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
const weatherDisplay = document.getElementById('weatherDisplay'); // NEW UI Hook
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const terrainCanvas = document.createElement('canvas');
const terrainCtx = terrainCanvas.getContext('2d');

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

// --- CHAT & MESSAGE LOG SYSTEM ---
const logMessage = (text) => {
    if (!text || !messageLog) return; 

    // 1. SANITIZE: Turn "<script>" into "&lt;script&gt;"
    let safeText = escapeHtml(text);

    // 2. FORMAT: Re-introduce specific HTML tags safely
    let formattedText = safeText
        .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>')
        .replace(/{green:(.*?)}/g, '<span class="text-green-500 font-bold">$1</span>')
        .replace(/{blue:(.*?)}/g, '<span class="text-blue-400 font-bold">$1</span>')
        .replace(/{gold:(.*?)}/g, '<span class="text-yellow-500 font-bold">$1</span>')
        .replace(/{purple:(.*?)}/g, '<span class="text-purple-400 font-bold">$1</span>')
        .replace(/{cyan:(.*?)}/g, '<span class="text-cyan-400 font-bold">$1</span>')
        .replace(/{orange:(.*?)}/g, '<span class="text-orange-400 font-bold">$1</span>')
        .replace(/{gray:(.*?)}/g, '<span class="text-gray-500">$1</span>');

    // --- ANTI-SPAM LOGIC ---
    if (text === lastLogText && messageLog.firstChild) {
        lastLogCount++;
        messageLog.firstChild.innerHTML = `> ${formattedText} <span class="text-gray-500 ml-2 font-bold">(x${lastLogCount})</span>`;
        // JUICE: Small bump animation to show it updated
        messageLog.firstChild.style.animation = 'none';
        void messageLog.firstChild.offsetWidth; 
        messageLog.firstChild.style.animation = 'pop-in 0.1s ease-out';
        return; 
    }

    lastLogText = text;
    lastLogCount = 1;

    // 3. CREATE & APPEND NEW MESSAGE
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `> ${formattedText}`;
    
    // JUICE: Slide down / fade in animation for new log messages
    messageElement.style.animation = 'fade-in 0.2s ease-out';
    messageElement.style.transformOrigin = 'top center';
    
    messageLog.prepend(messageElement);

    if (messageLog.children.length > 50) {
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

            if (statName === 'xp') {
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
                const canvasWrapper = document.getElementById('gameCanvasWrapper');

                if (gameState.player.poisonTurns > 0) {
                    element.classList.add('text-purple-500');
                    statBarElements.health.style.backgroundColor = '#a855f7'; 
                    if(canvasWrapper) canvasWrapper.classList.add('critical-health'); 
                } else {
                    if (percent > 60) {
                        element.classList.add('text-green-500');
                        statBarElements.health.style.backgroundColor = '#22c55e'; 
                        if(canvasWrapper) canvasWrapper.classList.remove('critical-health'); 
                    } else if (percent > 25) {
                        element.classList.add('text-yellow-500');
                        statBarElements.health.style.backgroundColor = '#eab308'; 
                        if(canvasWrapper) canvasWrapper.classList.remove('critical-health'); 
                    } else {
                        element.classList.add('text-red-500');
                        statBarElements.health.style.backgroundColor = '#ef4444'; 
                        if(canvasWrapper) canvasWrapper.classList.add('critical-health'); 
                    }
                }

            } else if (statName === 'mana') {
                const max = gameState.player.maxMana;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.mana.style.width = `${percent}%`;
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
    
    if (gameState.mapMode && gameState.player && gameState.player.level) {
        document.title = `HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth} | Lvl ${gameState.player.level} - Caves & Castles`;
    }
};

// --- DYNAMIC WEATHER & EVENT DISPLAY ---
function updateWeatherUI() {
    if (!weatherDisplay) return;

    let displayString = '';
    let colorClass = 'text-gray-400';

    if (gameState.mapMode === 'overworld') {
        if (gameState.isBloodMoon) {
            displayString = '🩸 BLOOD MOON';
            colorClass = 'text-red-500 animate-pulse';
        } else if (gameState.weather !== 'clear') {
            if (gameState.weather === 'rain') { displayString = '🌧️ Raining'; colorClass = 'text-blue-400'; }
            if (gameState.weather === 'storm') { displayString = '⛈️ Thunderstorm'; colorClass = 'text-yellow-400'; }
            if (gameState.weather === 'snow') { displayString = '❄️ Snowing'; colorClass = 'text-cyan-300'; }
            if (gameState.weather === 'fog') { displayString = '🌫️ Foggy'; colorClass = 'text-gray-400'; }
        }
    }

    if (displayString) {
        weatherDisplay.innerHTML = displayString;
        weatherDisplay.className = `text-[10px] font-bold mt-1 tracking-widest uppercase block ${colorClass}`;
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
                    <button id="sortInvBtn" onclick="sortInventory()" class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow transition-all active:scale-95">Auto-Sort</button>
                </div>
            `;
        }
        
        const titleSpan = document.getElementById('invTitleText');
        if (gameState.isDroppingItem) {
            titleSpan.textContent = "SELECT ITEM TO DROP";
            titleSpan.className = 'text-red-500 font-extrabold';
        } else {
            titleSpan.textContent = "Inventory";
            titleSpan.className = 'text-default font-bold';
        }
    }

    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryModalList.innerHTML = '<div class="w-full text-center mt-8 text-gray-500 italic">Your bag is empty.</div>';
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
            
            itemDiv.className = slotClass;

            itemDiv.onclick = (e) => {
                e.stopPropagation(); 
                if (typeof handleInput === 'function') handleInput((index + 1).toString());
            };

            let title = item.name;
            if (item.statBonuses) {
                title += " (";
                let bonuses = [];
                for (const stat in item.statBonuses) {
                    bonuses.push(`+${item.statBonuses[stat]} ${stat}`);
                }
                title += bonuses.join(', ');
                title += ")";
            }
            itemDiv.title = title;

            const itemChar = document.createElement('span');
            itemChar.className = 'item-char text-3xl mb-1';
            itemChar.textContent = item.tile || '🎒';

            const itemQuantity = document.createElement('span');
            itemQuantity.className = 'item-quantity bg-black bg-opacity-60 text-white px-1 rounded';
            itemQuantity.textContent = `x${item.quantity}`;

            const slotNumber = document.createElement('span');
            slotNumber.className = 'absolute top-1 left-1.5 text-[10px] text-gray-400 font-bold';
            if (index < 9) slotNumber.textContent = index + 1;

            if (item.isEquipped) {
                const equipBadge = document.createElement('span');
                equipBadge.className = 'absolute top-0 right-0 bg-yellow-500 text-black text-[9px] px-1.5 py-0.5 font-bold rounded-bl-lg rounded-tr-xl';
                equipBadge.textContent = 'EQP';
                itemDiv.appendChild(equipBadge);
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

    // --- DAMAGE CALCULATION ---
    const playerStrength = player.strength + (player.strengthBonus || 0); 
    const weaponDamage = weapon.damage || 0;
    const ammoDamage = ammo ? (ammo.damage || 0) : 0;
    const totalDamage = playerStrength + weaponDamage + ammoDamage;

    let weaponString = `Wpn: ${weapon.name} (+${weaponDamage})`;
    let weaponTooltip = `${weapon.name}\nDamage: +${weaponDamage}`;
    if (weapon.statBonuses) {
        const bonusArr = Object.entries(weapon.statBonuses).map(([k, v]) => `${v >= 0 ? '+' : ''}${v} ${k.substring(0,3).toUpperCase()}`);
        if (bonusArr.length > 0) {
            weaponString += ` <span class="text-indigo-400">[${bonusArr.join(', ')}]</span>`;
            weaponTooltip += `\nBonuses: ${Object.entries(weapon.statBonuses).map(([k, v]) => `+${v} ${k}`).join(', ')}`;
        }
    }
    if (player.strengthBonus > 0) { 
        weaponString += ` <span class="text-green-500">[+${player.strengthBonus} Str (${player.strengthBonusTurns}t)]</span>`;
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
    let armorTooltip = `${armor.name}\nDefense: +${armorDefense}`;
    if (armor.statBonuses) {
        const bonusArr = Object.entries(armor.statBonuses).map(([k, v]) => `${v >= 0 ? '+' : ''}${v} ${k.substring(0,3).toUpperCase()}`);
        if (bonusArr.length > 0) {
            armorString += ` <span class="text-indigo-400">[${bonusArr.join(', ')}]</span>`;
            armorTooltip += `\nBonuses: ${Object.entries(armor.statBonuses).map(([k, v]) => `+${v} ${k}`).join(', ')}`;
        }
    }
    if (buffDefense > 0) {
        armorString += ` <span class="text-green-500">[+${buffDefense} Def (${player.defenseBonusTurns}t)]</span>`;
    }
    equippedArmorDisplay.innerHTML = `${armorString} <br><span class="text-gray-500">(Total: ${totalDefense} Def)</span>`;

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
        wIcon.style.opacity = (weapon.name === 'Fists') ? '0.3' : '1';
        wIcon.title = weaponTooltip; 
    }
    if (aIcon) {
        aIcon.textContent = (armor.tile || '👕').replace(/[a-zA-Z]/g, '');
        aIcon.style.opacity = (armor.name === 'Simple Tunic' || armor.name === 'Tattered Rags') ? '0.3' : '1';
        aIcon.title = armorTooltip;
    }
    if (oIcon) {
        oIcon.textContent = offhand ? offhand.tile.replace(/[a-zA-Z]/g, '') : '🛡️';
        oIcon.style.opacity = offhand ? '1' : '0.3';
        oIcon.title = offhand ? `${offhand.name}\nDefense: +${offhand.defense || 0}` : 'Empty Off-Hand';
    }
    if (cIcon) {
        cIcon.textContent = acc ? acc.tile.replace(/[a-zA-Z]/g, '') : '💍';
        cIcon.style.opacity = acc ? '1' : '0.3';
        let accTooltip = acc ? acc.name : 'Empty Accessory';
        if (acc && acc.statBonuses) accTooltip += `\nBonuses: ${Object.entries(acc.statBonuses).map(([k, v]) => `+${v} ${k}`).join(', ')}`;
        cIcon.title = accTooltip;
    }
    if (mIcon && ammoCount) {
        mIcon.childNodes[0].nodeValue = ammo ? ammo.tile.replace(/[a-zA-Z]/g, '') : '➹';
        mIcon.style.opacity = ammo ? '1' : '0.3';
        mIcon.title = ammo ? `${ammo.name}\nDamage: +${ammo.damage || 0}\nRemaining: ${ammo.quantity}` : 'No Ammo Equipped';
        
        ammoCount.textContent = ammo ? ammo.quantity : '';
        ammoCount.style.display = ammo ? 'block' : 'none';
    }
};

function updateRegionDisplay() {
    if (gameState.mapMode === 'overworld') {
        const currentRegionX = Math.floor(gameState.player.x / REGION_SIZE);
        const currentRegionY = Math.floor(gameState.player.y / REGION_SIZE);
        const regionId = `${currentRegionX},${currentRegionY}`;

        const regionName = typeof getRegionName === 'function' ? getRegionName(currentRegionX, currentRegionY) : 'Wilderness';
        const playerCoords = `(${gameState.player.x}, ${-gameState.player.y})`; 
        regionDisplay.textContent = `${regionName} ${playerCoords}`; 

        if (!gameState.discoveredRegions.has(regionId)) {
            logMessage(`{gold:Discovered: ${regionName}!}`); 
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
                    name: regionName
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
            
            if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playLevelUp === 'function') {
                AudioSystem.playLevelUp();
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

    if (player.shieldValue > 0) {
        icons += `<span title="Arcane Shield (${Math.ceil(player.shieldValue)} points, ${player.shieldTurns}t)">💠</span>`;
    }
    if (player.defenseBonusTurns > 0) {
        icons += `<span title="Braced (+${player.defenseBonus} Def, ${player.defenseBonusTurns}t)">🛡️</span>`;
    }
    if (player.strengthBonusTurns > 0) {
        icons += `<span title="Strong (+${player.strengthBonus} Str, ${player.strengthBonusTurns}t)">💪</span>`;
    }
    if (player.poisonTurns > 0) {
        icons += `<span title="Poisoned (${player.poisonTurns}t)" class="text-green-500 animate-pulse">☣️</span>`;
    }
    if (player.frostbiteTurns > 0) {
        icons += `<span title="Frostbitten (${player.frostbiteTurns}t)" class="text-cyan-400">❄️</span>`;
    }

    statusEffectsPanel.innerHTML = icons;
}

// --- FIX: INFINITE RESIZE LOOP & OVERSTRETCHING ---
function resizeCanvas() {
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return;

    // 1. THE MAGIC FIX: We MUST account for the padding/border of the container
    // OffsetWidth/Height includes borders, ClientWidth/Height includes padding. 
    // To get the pure drawing area, we measure the client dimensions.
    
    // We temporarily hide the canvas to prevent it from forcing the container to be larger than it should be
    canvas.style.display = 'none';
    
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    
    canvas.style.display = 'block';

    if (containerWidth === 0 || containerHeight === 0) return; // Prevent crashes when hidden

    // 2. Update the global zoom tracker
    if (!window.currentZoom) window.currentZoom = 20;
    window.TILE_SIZE = window.currentZoom;

    // 3. Calculate Logical Viewport (The number of tiles that fit on screen)
    window.VIEWPORT_WIDTH = Math.ceil(containerWidth / window.TILE_SIZE) + 2; 
    window.VIEWPORT_HEIGHT = Math.ceil(containerHeight / window.TILE_SIZE) + 2;

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
    ctx.font = `${window.TILE_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 7. Resize Offscreen Terrain Cache Canvas
    // THE FIX: We must account for the overdraw buffer! The loop goes from -1 to VIEWPORT_WIDTH + 1 (which is +3 tiles total)
    const logicalWidth = (window.VIEWPORT_WIDTH + 3) * window.TILE_SIZE;
    const logicalHeight = (window.VIEWPORT_HEIGHT + 3) * window.TILE_SIZE;

    terrainCanvas.width = logicalWidth * dpr;
    terrainCanvas.height = logicalHeight * dpr;
    
    // 8. Configure Offscreen Context
    terrainCtx.setTransform(1, 0, 0, 1, 0, 0); 
    terrainCtx.scale(dpr, dpr); 
    terrainCtx.font = `${window.TILE_SIZE}px monospace`;
    terrainCtx.textAlign = 'center';
    terrainCtx.textBaseline = 'middle';

    // 9. Force Redraw
    if (typeof gameState !== 'undefined') {
        gameState.mapDirty = true; 
        if (typeof render === 'function') render();
    }
}

// INJECT STAT TOOLTIPS
(function initStatTooltips() {
    const statDescriptions = {
        // Vitals
        health: "Your life force. If it hits 0, you die and lose gold/items.",
        mana: "Magical energy used to cast Spells and travel Leylines.",
        stamina: "Physical energy used for Weapon Skills, running, and mining.",
        psyche: "Mental fortitude. Used for Taming, Pacifying, and resisting madness.",
        hunger: "If empty, you stop regenerating HP.",
        thirst: "If empty, you stop regenerating Stamina.",
        // Attributes
        strength: "Increases Melee Damage, carry capacity, and mining yield.",
        wits: "Increases Max Mana, Spell Damage, and Arcane Shield strength.",
        constitution: "Increases Max Health and Base Defense.",
        dexterity: "Increases Dodge Chance, Stealth, Ranged Damage, and Base Defense.",
        charisma: "Improves Shop Prices and Taming/Pacify chances.",
        luck: "Increases Critical Hit chance, Dodge chance, and rare Loot drops.",
        willpower: "Increases Max Psyche, Dark/Frost spell damage, and summon health.",
        perception: "Increases Accuracy, Vision Radius, and chance to find Secret Doors.",
        endurance: "Increases Max Stamina and resistance to Swamp Sickness.",
        intuition: "Improves Nature/Druid spells and senses unseen enemies nearby."
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
const canvasWrapper = document.getElementById('gameCanvasWrapper');
if (canvasWrapper) {
    canvasWrapper.addEventListener('wheel', (e) => {
        e.preventDefault(); 
        
        if (!window.currentZoom) window.currentZoom = 20;

        const zoomDirection = Math.sign(e.deltaY);
        
        if (zoomDirection < 0) {
            window.currentZoom = Math.min(40, window.currentZoom + 2); // Max zoom in
        } else if (zoomDirection > 0) {
            window.currentZoom = Math.max(12, window.currentZoom - 2); // Max zoom out
        }
        
        resizeCanvas();
    }, { passive: false });
}

// --- FIX: Add return focus to Canvas after closing modals ---
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
