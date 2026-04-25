// DOM Element Selectors
const characterSelectModal = document.getElementById('characterSelectModal');
const slotsContainer = document.getElementById('slotsContainer');
const logoutFromSelectButton = document.getElementById('logoutFromSelectButton');
let currentUser = null; // Store the firebase user object

const charCreationModal = document.getElementById('charCreationModal');
const timeDisplay = document.getElementById('timeDisplay');
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

const logMessage = (text) => {
    // 1. SANITIZE: Turn "<script>" into "&lt;script&gt;"
    let safeText = escapeHtml(text);

    // 2. FORMAT: Re-introduce specific HTML tags safely
    let formattedText = safeText
        .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>')
        .replace(/{green:(.*?)}/g, '<span class="text-green-500 font-bold">$1</span>')
        .replace(/{blue:(.*?)}/g, '<span class="text-blue-400 font-bold">$1</span>')
        .replace(/{gold:(.*?)}/g, '<span class="text-yellow-500 font-bold">$1</span>')
        .replace(/{gray:(.*?)}/g, '<span class="text-gray-500">$1</span>');

    // --- ANTI-SPAM LOGIC ---
    if (text === lastLogText && messageLog.firstChild) {
        lastLogCount++;
        messageLog.firstChild.innerHTML = `> ${formattedText} <span class="text-gray-500 ml-2 font-bold">(x${lastLogCount})</span>`;
        return; 
    }

    lastLogText = text;
    lastLogCount = 1;

    // 3. CREATE & APPEND NEW MESSAGE
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `> ${formattedText}`;
    messageLog.prepend(messageElement);

    if (messageLog.children.length > 50) {
        messageLog.removeChild(messageLog.lastChild);
    }
    messageLog.scrollTop = 0;
};

const renderStats = () => {
    renderStatusEffects();

    for (const statName in statDisplays) {
        const element = statDisplays[statName];
        if (element && gameState.player.hasOwnProperty(statName)) {
            const value = gameState.player[statName];
            const label = statName.charAt(0).toUpperCase() + statName.slice(1);

            if (statName === 'xp') {
                const max = gameState.player.xpToNextLevel;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));

                element.textContent = `XP: ${value} / ${max}`;
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
                let healthString = `${label}: ${displayHealth}`;

                if (gameState.player.shieldValue > 0) {
                    healthString += ` <span class="text-blue-400">(+${Math.ceil(gameState.player.shieldValue)})</span>`;
                }
                
                element.innerHTML = healthString;

                element.classList.remove('text-red-500', 'text-yellow-500', 'text-green-500', 'text-purple-500'); 
                const canvasWrapper = document.getElementById('gameCanvasWrapper');

                if (gameState.player.poisonTurns > 0) {
                    element.classList.add('text-purple-500');
                    statBarElements.health.style.backgroundColor = '#a855f7'; 
                    canvasWrapper.classList.add('critical-health'); 
                } else {
                    if (percent > 60) {
                        element.classList.add('text-green-500');
                        statBarElements.health.style.backgroundColor = '#22c55e'; 
                        canvasWrapper.classList.remove('critical-health'); 
                    } else if (percent > 25) {
                        element.classList.add('text-yellow-500');
                        statBarElements.health.style.backgroundColor = '#eab308'; 
                        canvasWrapper.classList.remove('critical-health'); 
                    } else {
                        element.classList.add('text-red-500');
                        statBarElements.health.style.backgroundColor = '#ef4444'; 
                        canvasWrapper.classList.add('critical-health'); 
                    }
                }

            } else if (statName === 'mana') {
                const max = gameState.player.maxMana;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.mana.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`;

            } else if (statName === 'stamina') {
                const max = gameState.player.maxStamina;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.stamina.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`;

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
                element.textContent = `${label}: ${Math.floor(value)}`;

            } else if (statName === 'hunger') {
                const max = gameState.player.maxHunger;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.hunger.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`; 

            } else if (statName === 'thirst') {
                const max = gameState.player.maxThirst;
                const percent = Math.max(0, Math.min(100, (value / max) * 100));
                statBarElements.thirst.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`;

            } else {
                element.textContent = `${label}: ${value}`;
            }
        }
    }
    
    if (gameState.mapMode && gameState.player && gameState.player.level) {
        document.title = `HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth} | Lvl ${gameState.player.level} - Caves & Castles`;
    }
};

const renderInventory = () => {
    inventoryModalList.innerHTML = '';
    const titleElement = document.querySelector('#inventoryModal h2');

    if (gameState.isDroppingItem) {
        titleElement.textContent = "SELECT ITEM TO DROP";
        titleElement.classList.add('text-red-500', 'font-extrabold');
        titleElement.classList.remove('text-default'); 
    } else {
        titleElement.textContent = "Inventory";
        titleElement.classList.remove('text-red-500', 'font-extrabold');
        titleElement.classList.add('text-default');
    }

    if (!gameState.player.inventory || gameState.player.inventory.length === 0) {
        inventoryModalList.innerHTML = '<span class="muted-text italic px-2">Inventory is empty.</span>';
    } else {
        gameState.player.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');

            let slotClass = 'inventory-slot p-2 rounded-md cursor-pointer transition-all duration-200';
            
            if (gameState.isDroppingItem) {
                slotClass += ' border-2 border-red-500 bg-red-900 bg-opacity-20 hover:bg-opacity-40';
            } else if (item.isEquipped) {
                slotClass += ' equipped';
            } else if (item.type === 'consumable') {
                slotClass += ' bg-blue-900 bg-opacity-10 hover:border-blue-500';
            } else {
                slotClass += ' hover:border-blue-500';
            }
            
            itemDiv.className = slotClass;

            itemDiv.onclick = (e) => {
                e.stopPropagation(); 
                handleInput((index + 1).toString());
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
            itemChar.className = 'item-char';
            itemChar.textContent = item.tile;

            const itemQuantity = document.createElement('span');
            itemQuantity.className = 'item-quantity';
            itemQuantity.textContent = `x${item.quantity}`;

            const slotNumber = document.createElement('span');
            slotNumber.className = 'absolute top-0 left-1 text-xs highlight-text font-bold';
            if (index < 9) slotNumber.textContent = index + 1;

            itemDiv.appendChild(slotNumber);
            itemDiv.appendChild(itemChar);
            itemDiv.appendChild(itemQuantity);
            inventoryModalList.appendChild(itemDiv);
        });
    }
};

const renderEquipment = () => {
    const player = gameState.player;
    const weapon = player.equipment.weapon || { name: 'Fists', damage: 0 };

    const playerStrength = player.strength + (player.strengthBonus || 0); 
    const baseDamage = playerStrength;
    const weaponDamage = weapon.damage || 0;
    const totalDamage = baseDamage + weaponDamage;

    let weaponString = `Weapon: ${weapon.name} (+${weaponDamage})`;
    if (player.strengthBonus > 0) { 
        weaponString += ` <span class="text-green-500">[Strong +${player.strengthBonus} (${player.strengthBonusTurns}t)]</span>`;
    }
    equippedWeaponDisplay.innerHTML = weaponString;
    statDisplays.strength.textContent = `Strength: ${player.strength} (Dmg: ${totalDamage})`;

    const armor = player.equipment.armor || { name: 'Simple Tunic', defense: 0 };

    const weaponIcon = document.getElementById('slotWeaponIcon');
    const armorIcon = document.getElementById('slotArmorIcon');

    if (weaponIcon) {
        weaponIcon.textContent = weapon.tile || '👊';
        weaponIcon.style.color = (weapon.name === 'Fists') ? 'var(--text-muted)' : 'var(--text-default)';
    }

    if (armorIcon) {
        armorIcon.textContent = armor.tile || '👕';
        armorIcon.style.color = (armor.name === 'Simple Tunic' || armor.name === 'Tattered Rags') ? 'var(--text-muted)' : 'var(--text-default)';
    }

    const baseDefense = Math.floor(player.dexterity / 3);
    const armorDefense = armor.defense || 0;
    const buffDefense = player.defenseBonus || 0;
    const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;
    const conBonus = Math.floor(player.constitution * 0.1); 
    
    const totalDefense = baseDefense + armorDefense + buffDefense + conBonus + talentDefense;

    let armorString = `Armor: ${armor.name} (+${armorDefense} Def)`;
    if (buffDefense > 0) {
        armorString += ` <span class="text-green-500">[Braced +${buffDefense} (${player.defenseBonusTurns}t)]</span>`;
    }

    equippedArmorDisplay.innerHTML = `${armorString} (Base: ${baseDefense}, Total: ${totalDefense} Def)`;
};

function updateRegionDisplay() {
    if (gameState.mapMode === 'overworld') {
        const currentRegionX = Math.floor(gameState.player.x / REGION_SIZE);
        const currentRegionY = Math.floor(gameState.player.y / REGION_SIZE);
        const regionId = `${currentRegionX},${currentRegionY}`;

        const regionName = getRegionName(currentRegionX, currentRegionY);
        const playerCoords = `(${gameState.player.x}, ${-gameState.player.y})`; 
        regionDisplay.textContent = `${regionName} ${playerCoords}`; 

        if (!gameState.discoveredRegions.has(regionId)) {
            logMessage(`You have entered ${regionName}.`); 
            gameState.discoveredRegions.add(regionId);
            grantXp(50);
        }
    } else if (gameState.mapMode === 'dungeon') {
        regionDisplay.textContent = getCaveName(gameState.currentCaveId); 
    } else if (gameState.mapMode === 'castle') {
        regionDisplay.textContent = getCastleName(gameState.currentCastleId); 
    }
}

function triggerStatFlash(statElement, positive = true) {
    const animationClass = positive ? 'stat-flash-green' : 'stat-flash-red';
    statElement.classList.add(animationClass);
    setTimeout(() => {
        statElement.classList.remove(animationClass);
    }, 500);
}

function triggerStatAnimation(statElement, animationClass) {
    statElement.classList.add(animationClass);
    setTimeout(() => {
        statElement.classList.remove(animationClass);
    }, 600); 
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
        icons += `<span title="Poisoned (${player.poisonTurns}t)">☣️</span>`;
    }
    if (player.frostbiteTurns > 0) {
        icons += `<span title="Frostbitten (${player.frostbiteTurns}t)">❄️</span>`;
    }

    statusEffectsPanel.innerHTML = icons;
}

function resizeCanvas() {
    const canvasContainer = canvas.parentElement;
    if (!canvasContainer) return;

    // 1. Hide the canvas for 1 millisecond.
    // This stops the canvas from physically pushing the grid walls outward,
    // allowing us to measure the TRUE natural width of the column!
    canvas.style.display = 'none';
    
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    
    // Bring it back immediately
    canvas.style.display = 'block';

    // 2. Update the global zoom tracker
    if (!window.currentZoom) window.currentZoom = 20;
    TILE_SIZE = window.currentZoom;

    // 3. Calculate Logical Viewport (Tiles that fit + 2 buffer tiles for smooth sliding)
    VIEWPORT_WIDTH = Math.ceil(containerWidth / TILE_SIZE) + 2; 
    VIEWPORT_HEIGHT = Math.ceil(containerHeight / TILE_SIZE) + 2;

    const dpr = window.devicePixelRatio || 1;

    // 4. Set HTML5 Canvas back-buffer resolution to match physical pixels
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;

    // 5. Force CSS to 100% so it perfectly fits the container without stretching it
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // 6. Configure Main Context
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.scale(dpr, dpr); 
    ctx.imageSmoothingEnabled = false; 
    ctx.font = `${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 7. Resize Offscreen Canvas (Matches the logical padded viewport)
    const logicalWidth = VIEWPORT_WIDTH * TILE_SIZE;
    const logicalHeight = VIEWPORT_HEIGHT * TILE_SIZE;

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

// INJECT STAT TOOLTIPS
(function initStatTooltips() {
    const statDescriptions = {
        strength: "Increases Melee Damage and carry weight.",
        wits: "Increases Max Mana, Spell Damage, and Shield strength.",
        constitution: "Increases Max Health and Base Defense.",
        dexterity: "Increases Dodge Chance, Stealth, and Base Defense.",
        charisma: "Improves Shop Prices and Taming/Pacify chances.",
        luck: "Increases Critical Hit chance, Dodge chance, and rare Loot drops.",
        willpower: "Increases Max Psyche and Dark/Frost spell damage.",
        perception: "Increases Accuracy and chance to find Secret Doors.",
        endurance: "Increases Max Stamina and resistance to Swamp Sickness.",
        intuition: "Improves Nature/Druid spells and senses unseen enemies."
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
        // Prevent the whole webpage from scrolling when zooming the map
        e.preventDefault(); 
        
        if (!window.currentZoom) window.currentZoom = 20;

        // Tweak numbers to control zoom speed and limits
        if (e.deltaY < 0) {
            window.currentZoom = Math.min(40, window.currentZoom + 2); // Max zoom in
        } else {
            window.currentZoom = Math.max(12, window.currentZoom - 2); // Max zoom out
        }
        
        // Instantly recalculate the grid and redraw!
        resizeCanvas();
    }, { passive: false });
}
