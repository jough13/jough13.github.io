// DOM Element Selectors
const characterSelectModal = document.getElementById('characterSelectModal');
const slotsContainer = document.getElementById('slotsContainer');
const logoutFromSelectButton = document.getElementById('logoutFromSelectButton');
let currentUser = null; // Store the firebase user object

const charCreationModal = document.getElementById('charCreationModal');
const timeDisplay = document.getElementById('timeDisplay');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

const logMessage = (text) => {
    const messageElement = document.createElement('p');

    // 1. SANITIZE: Turn "<script>" into "&lt;script&gt;"
    // This renders the text visibly but prevents it from running as code.
    let safeText = escapeHtml(text);

    // 2. FORMAT: Now it is safe to re-introduce YOUR specific HTML tags
    // Since we escaped the input first, users cannot inject their own <span> tags.
    let formattedText = safeText
        .replace(/{red:(.*?)}/g, '<span class="text-red-500 font-bold">$1</span>')
        .replace(/{green:(.*?)}/g, '<span class="text-green-500 font-bold">$1</span>')
        .replace(/{blue:(.*?)}/g, '<span class="text-blue-400 font-bold">$1</span>')
        .replace(/{gold:(.*?)}/g, '<span class="text-yellow-500 font-bold">$1</span>')
        .replace(/{gray:(.*?)}/g, '<span class="text-gray-500">$1</span>');

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
                const percent = (value / max) * 100;

                // Update text and bar width
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
                const percent = (value / max) * 100;

                // Update bar width
                statBarElements.health.style.width = `${percent}%`;
                
                // 1. Calculate display value (Round up to avoid 9.99/10)
                let displayHealth = Math.ceil(value); 
                
                // 2. Declare string ONCE
                let healthString = `${label}: ${displayHealth}`;

                // 3. Add Shield text if active
                if (gameState.player.shieldValue > 0) {
                    healthString += ` <span class="text-blue-400">(+${Math.ceil(gameState.player.shieldValue)})</span>`;
                }
                
                // 4. Update the element text
                element.innerHTML = healthString;

                // Update text and bar color
                element.classList.remove('text-red-500', 'text-yellow-500', 'text-green-500'); // Clear old text colors

                if (percent > 60) {
                    element.classList.add('text-green-500');
                    statBarElements.health.style.backgroundColor = '#22c55e'; // Green
                } else if (percent > 30) {
                    element.classList.add('text-yellow-500');
                    statBarElements.health.style.backgroundColor = '#eab308'; // Yellow
                } else {
                    element.classList.add('text-red-500');
                    statBarElements.health.style.backgroundColor = '#ef4444'; // Red
                }

            } else if (statName === 'mana') {
                const max = gameState.player.maxMana;
                const percent = (value / max) * 100;
                statBarElements.mana.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

            } else if (statName === 'stamina') {
                const max = gameState.player.maxStamina;
                const percent = (value / max) * 100;
                statBarElements.stamina.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

            } else if (statName === 'wits') {
                let witsText = `${label}: ${value}`;
                // Check for bonus
                if (gameState.player.witsBonus > 0) {
                    witsText += ` <span class="text-green-500">(+${gameState.player.witsBonus})</span>`;
                }
                // Use innerHTML to render the color span
                element.innerHTML = witsText;

            } else if (statName === 'psyche') {
                const max = gameState.player.maxPsyche;
                const percent = (value / max) * 100;
                statBarElements.psyche.style.width = `${percent}%`;
                element.textContent = `${label}: ${value}`;

            } else if (statName === 'hunger') {
                const max = gameState.player.maxHunger;
                const percent = (value / max) * 100;
                statBarElements.hunger.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`; // Use Math.floor to hide decimals
            } else if (statName === 'thirst') {
                const max = gameState.player.maxThirst;
                const percent = (value / max) * 100;
                statBarElements.thirst.style.width = `${percent}%`;
                element.textContent = `${label}: ${Math.floor(value)}`;

            } else {
                // Default case for Coins, Level, and Core Stats
                element.textContent = `${label}: ${value}`;
            }
        }
    }
        // Only update if mapMode is active (meaning we are actually playing, not in menus)
    if (gameState.mapMode && gameState.player && gameState.player.level) {
        document.title = `HP: ${gameState.player.health}/${gameState.player.maxHealth} | Lvl ${gameState.player.level} - Caves & Castles`;
    }
};

const renderInventory = () => {
    inventoryModalList.innerHTML = '';
    const titleElement = document.querySelector('#inventoryModal h2');

    // --- VISUAL STATE HANDLING ---
    if (gameState.isDroppingItem) {
        titleElement.textContent = "SELECT ITEM TO DROP";
        titleElement.classList.add('text-red-500', 'font-extrabold');
        titleElement.classList.remove('text-default'); // Assuming standard text color class
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

            // --- DYNAMIC STYLING ---
            let slotClass = 'inventory-slot p-2 rounded-md cursor-pointer transition-all duration-200';
            
            if (gameState.isDroppingItem) {
                // Red Border/Glow for Drop Mode
                slotClass += ' border-2 border-red-500 bg-red-900 bg-opacity-20 hover:bg-opacity-40';
            } else if (item.isEquipped) {
                // Gold Border for Equipped
                slotClass += ' equipped';
            } else {
                // Standard Hover
                slotClass += ' hover:border-blue-500';
            }
            
            itemDiv.className = slotClass;

            // Click Handler: Passes input to main handler to decide Use vs Drop
            itemDiv.onclick = (e) => {
                e.stopPropagation(); // Prevent clicking through to modal background
                handleInput((index + 1).toString());
            };

            // Build Tooltip
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

            // Elements
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
    // --- WEAPON & DAMAGE ---
    const player = gameState.player;
    const weapon = player.equipment.weapon || { name: 'Fists', damage: 0 };

    // Calculate total damage, including the new strength buff
    const playerStrength = player.strength + (player.strengthBonus || 0); // <-- APPLY BUFF
    const baseDamage = playerStrength;
    const weaponDamage = weapon.damage || 0;
    const totalDamage = baseDamage + weaponDamage;

    // Update the display to show the buff
    let weaponString = `Weapon: ${weapon.name} (+${weaponDamage})`;
    if (player.strengthBonus > 0) { // <-- ADDED THIS BLOCK
        weaponString += ` <span class="text-green-500">[Strong +${player.strengthBonus} (${player.strengthBonusTurns}t)]</span>`;
    }
    equippedWeaponDisplay.innerHTML = weaponString;

    // Update the strength display to show the total damage
    statDisplays.strength.textContent = `Strength: ${player.strength} (Dmg: ${totalDamage})`;

    // --- ARMOR & DEFENSE ---
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

    // --- ROUNDING LOGIC ---
    const baseDefense = Math.floor(player.dexterity / 3);
    const armorDefense = armor.defense || 0;
    const buffDefense = player.defenseBonus || 0;

    // --- TALENT: IRON SKIN ---
    const talentDefense = (player.talents && player.talents.includes('iron_skin')) ? 1 : 0;

    // We Math.floor the Constitution bonus so it matches combat logic (0.3 becomes 0)
    const conBonus = Math.floor(player.constitution * 0.1); 
    
    const totalDefense = baseDefense + armorDefense + buffDefense + conBonus + talentDefense;

    // Update the display
    let armorString = `Armor: ${armor.name} (+${armorDefense} Def)`;
    if (buffDefense > 0) {
        armorString += ` <span class="text-green-500">[Braced +${buffDefense} (${player.defenseBonusTurns}t)]</span>`;
    }

    // Show Base Defense in the total
    equippedArmorDisplay.innerHTML = `${armorString} (Base: ${baseDefense}, Total: ${totalDefense} Def)`;
};

function updateRegionDisplay() {
    if (gameState.mapMode === 'overworld') {
        const currentRegionX = Math.floor(gameState.player.x / REGION_SIZE);
        const currentRegionY = Math.floor(gameState.player.y / REGION_SIZE);
        const regionId = `${currentRegionX},${currentRegionY}`;

        const regionName = getRegionName(currentRegionX, currentRegionY);

        // --- Append coordinates ---
        const playerCoords = `(${gameState.player.x}, ${-gameState.player.y})`; // Invert Y for display
        regionDisplay.textContent = `${regionName} ${playerCoords}`; // Combine name and coords

        // Check if the region is newly discovered
        if (!gameState.discoveredRegions.has(regionId)) {
            logMessage(`You have entered ${regionName}.`); // Log only on discovery
            gameState.discoveredRegions.add(regionId);
            
            // Grant XP for discovery
            grantXp(50);
        }
    } else if (gameState.mapMode === 'dungeon') {
        // Display the procedurally generated cave name
        regionDisplay.textContent = getCaveName(gameState.currentCaveId); //
    } else if (gameState.mapMode === 'castle') {
        // Display the procedurally generated castle name
        regionDisplay.textContent = getCastleName(gameState.currentCastleId); //
    }
}

function triggerStatFlash(statElement, positive = true) {
    const animationClass = positive ? 'stat-flash-green' : 'stat-flash-red';
    statElement.classList.add(animationClass);
    // Remove the class after the animation finishes to allow it to be re-triggered
    setTimeout(() => {
        statElement.classList.remove(animationClass);
    }, 500);
}

function triggerStatAnimation(statElement, animationClass) {
    statElement.classList.add(animationClass);
    // Remove the class after the animation finishes
    setTimeout(() => {
        statElement.classList.remove(animationClass);
    }, 600); // 600ms matches the CSS animation time
}


/**
 * Updates the UI to show active buff and debuff icons.
 */

function renderStatusEffects() {
    if (!statusEffectsPanel) return; // Safety check

    const player = gameState.player;
    let icons = ''; // We'll build this up as an HTML string

    // Buffs
    if (player.shieldValue > 0) {
        icons += `<span title="Arcane Shield (${Math.ceil(player.shieldValue)} points, ${player.shieldTurns}t)">💠</span>`;
    }
    if (player.defenseBonusTurns > 0) {
        icons += `<span title="Braced (+${player.defenseBonus} Def, ${player.defenseBonusTurns}t)">🛡️</span>`;
    }
    if (player.strengthBonusTurns > 0) {
        icons += `<span title="Strong (+${player.strengthBonus} Str, ${player.strengthBonusTurns}t)">💪</span>`;
    }

    // Debuffs
    if (player.poisonTurns > 0) {
        icons += `<span title="Poisoned (${player.poisonTurns}t)">☣️</span>`;
    }
    if (player.frostbiteTurns > 0) {
        icons += `<span title="Frostbitten (${player.frostbiteTurns}t)">❄️</span>`;
    }

    statusEffectsPanel.innerHTML = icons;
}
