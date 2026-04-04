// =============================================================================
// │ DOM ELEMENT REFERENCES & VIRTUAL DOM SETUP                                │
// =============================================================================

const inventoryButton = document.getElementById('inventory-button');
const inventoryModalBackdrop = document.getElementById('inventory-modal-backdrop');
const inventoryModalClose = document.getElementById('inventory-modal-close');
const inventoryList = document.getElementById('inventory-list');
const inventoryWrapper = document.getElementById('inventory-wrapper');
const loreCompendiumButton = document.getElementById('lore-compendium-button');
const loreModalBackdrop = document.getElementById('lore-modal-backdrop');
const loreModalClose = document.getElementById('lore-modal-close');
const loreList = document.getElementById('lore-list');
const gameScreenContent = document.getElementById('game-screen-content');
const gameScreen = document.getElementById('game-screen');
const copyLogButton = document.getElementById('copy-log-button');
const statsZoneName = document.getElementById('zone-name');
const statsExploredPercentage = document.getElementById('explored-percentage');
const statsExplorationSpeed = document.getElementById('exploration-speed');
const statsGlimmeringDust = document.getElementById('glimmering-dust');
const statsAncientScraps = document.getElementById('ancient-scraps');
const statsRunesCollected = document.getElementById('runes-collected');
const voidEssenceDisplay = document.getElementById('void-essence-display');
const statsVoidEssence = document.getElementById('void-essence');
const companionDisplay = document.getElementById('companion-display');
const companionInfo = document.getElementById('companion-info');
const artifactsCollectedDisplay = document.getElementById('artifacts-collected');
const muteButton = document.getElementById('mute-button');
const statMightDisplay = document.getElementById('stat-might');
const statWitsDisplay = document.getElementById('stat-wits');
const statSpiritDisplay = document.getElementById('stat-spirit');
const playerHpWrapper = document.getElementById('player-hp-wrapper');
const playerLevelWrapper = document.getElementById('player-level-wrapper');
const playerXpWrapper = document.getElementById('player-xp-wrapper');
const playerClassWrapper = document.getElementById('player-class-wrapper');
const statMightWrapper = document.getElementById('stat-might-wrapper');
const statWitsWrapper = document.getElementById('stat-wits-wrapper');
const statSpiritWrapper = document.getElementById('stat-spirit-wrapper');
const glimmeringDustWrapper = document.getElementById('glimmering-dust-wrapper');
const ancientScrapsWrapper = document.getElementById('ancient-scraps-wrapper');
const runesCollectedWrapper = document.getElementById('runes-collected-wrapper');
const artifactsCollectedWrapper = document.getElementById('artifacts-collected-wrapper');
const explorationSpeedWrapper = document.getElementById('exploration-speed-wrapper');
const playerLevelDisplay = document.getElementById('player-level');
const playerXpDisplay = document.getElementById('player-xp');
const xpToNextLevelDisplay = document.getElementById('xp-to-next-level');
const playerHpDisplay = document.getElementById('player-hp');
const playerMaxHpDisplay = document.getElementById('player-max-hp');
const playerClassDisplay = document.getElementById('player-class');
const playerNameDisplay = document.getElementById('player-name-display');
const logArea = document.getElementById('log-area');
const pauseResumeButton = document.getElementById('pause-resume-button');
const upgradeSpeedButton = document.getElementById('upgrade-speed-button');
const decisionArea = document.getElementById('decision-area');
const decisionPromptText = document.getElementById('decision-prompt-text');
const decisionButtonsContainer = document.getElementById('decision-buttons-container');
const messageInputArea = document.getElementById('message-input-area');
const futureSelfTextarea = document.getElementById('future-self-textarea');
const saveMessageButton = document.getElementById('save-message-button');
const skipMessageButton = document.getElementById('skip-message-button');
const summaryArea = document.getElementById('summary-area');
const journeySummaryTextarea = document.getElementById('journey-summary-textarea');
const newJourneyButton = document.getElementById('new-journey-button');
const transcendButton = document.getElementById('transcend-button');
const meditateButton = document.getElementById('meditate-button');
const attuneRunesButton = document.getElementById('attune-runes-button');
const saveGameButton = document.getElementById('save-game-button');
const artifactModalBackdrop = document.getElementById('artifact-modal-backdrop');
const artifactModalClose = document.getElementById('artifact-modal-close');
const artifactList = document.getElementById('artifact-list');

const btnAutoCombat = document.getElementById('btn-auto-combat');
const btnAutoEvents = document.getElementById('btn-auto-events');
const btnAutoProgress = document.getElementById('btn-auto-progress');

let vDom = []; 
let domGrid = []; 

function initDOMGrid() {
    gameScreenContent.innerHTML = '';
    vDom = [];
    domGrid = [];

    for (let lane = 0; lane < NUM_LANES; lane++) {
        let rowVDom = [];
        let rowDom = [];
        let rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        
        for (let x = 0; x < SCREEN_WIDTH; x++) {
            let span = document.createElement('span');
            span.textContent = ' ';
            rowDiv.appendChild(span);
            rowDom.push(span);
            rowVDom.push({ char: ' ', class: '' });
        }
        gameScreenContent.appendChild(rowDiv);
        domGrid.push(rowDom);
        vDom.push(rowVDom);
    }
}

// =============================================================================
// │ UI MENUS & RENDERING                                                      │
// =============================================================================

function updateAutoButtonVisuals() {
    if (!btnAutoCombat || !btnAutoEvents || !btnAutoProgress) return;

    btnAutoCombat.textContent = `Auto-Combat: ${gameState.auto.combat ? 'ON' : 'OFF'}`;
    btnAutoEvents.textContent = `Auto-Events: ${gameState.auto.events ? 'ON' : 'OFF'}`;
    btnAutoProgress.textContent = `Auto-Progress: ${gameState.auto.progress ? 'ON' : 'OFF'}`;

    if (gameState.auto.combat) btnAutoCombat.classList.add('auto-btn-on'); else btnAutoCombat.classList.remove('auto-btn-on');
    if (gameState.auto.events) btnAutoEvents.classList.add('auto-btn-on'); else btnAutoEvents.classList.remove('auto-btn-on');
    if (gameState.auto.progress) btnAutoProgress.classList.add('auto-btn-on'); else btnAutoProgress.classList.remove('auto-btn-on');
}

function attemptUpgradeSpeed() {
    const upgradeCost = Math.round(50 * gameState.explorationSpeedMultiplier);
    if (gameState.resources.glimmeringDust >= upgradeCost) {
        gameState.resources.glimmeringDust -= upgradeCost;
        gameState.explorationSpeedMultiplier += 0.1;
        updateGameTickSpeed();
        addLogMessage(`Movement speed increased! (${gameState.explorationSpeedMultiplier.toFixed(1)}x)`, "synergy");
        renderStats();
    } else {
        addLogMessage("Not enough Glimmering Dust for upgrade.", "puzzle-fail");
    }
}

function presentNameChoice() {
    if (gameState.auto.progress) { 
        resolveNameChoice("Wanderer"); 
        return; 
    }

    pauseGameForDecision(true);

    decisionPromptText.textContent = "An echo on the wind seems to ask for your name...";
    decisionButtonsContainer.innerHTML = ''; 

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'playerNameInput'; 
    nameInput.placeholder = 'Wanderer';
    nameInput.maxLength = MAX_NAME_LENGTH;

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('name-confirm-button');

    confirmButton.onclick = () => {
        const chosenName = nameInput.value;
        resolveNameChoice(chosenName);
    };

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const chosenName = nameInput.value;
            resolveNameChoice(chosenName);
        }
    });

    decisionButtonsContainer.appendChild(nameInput);
    decisionButtonsContainer.appendChild(confirmButton);
    decisionArea.style.display = 'block';
    updateUIAccentColors();
    nameInput.focus(); 
}

function resolveNameChoice(chosenName) {
    const finalName = chosenName.trim();

    if (finalName && finalName.length > 0) {
        gameState.playerName = finalName;
        addLogMessage(`The echoes whisper back your name: ${gameState.playerName}.`, "name-choice");
    } else {
        addLogMessage(`You remain the silent Wanderer.`, "name-choice");
    }

    decisionArea.style.display = 'none';
    gameState.activeDecision = null;
    pauseGameForDecision(false);

    renderAll(); 
}

function presentClassChoice() {
    if (gameState.auto.progress) { 
        resolveClassChoice("WANDERER"); 
        return; 
    }
    pauseGameForDecision(true); 

    decisionPromptText.textContent = "A moment of clarity offers a choice of path...";
    decisionButtonsContainer.innerHTML = ''; 

    Object.values(PLAYER_CLASSES).forEach(playerClass => {
        const button = document.createElement('button');
        
        button.innerHTML = `<strong>${playerClass.name}</strong><br><small>${playerClass.description}</small>`;
        button.title = playerClass.description; 

        button.onclick = () => resolveClassChoice(playerClass.key);

        decisionButtonsContainer.appendChild(button);
    });

    decisionArea.style.display = 'block'; 
    updateUIAccentColors(); 
}

function resolveClassChoice(classKey) {
    const chosenClass = PLAYER_CLASSES[classKey];
    if (!chosenClass) {
        console.error("Invalid class key chosen:", classKey);
        pauseGameForDecision(false); 
        return;
    }

    gameState.playerClass = chosenClass.name;
    addLogMessage(`You have chosen the path of the ${chosenClass.name}.`, "class-choice");

    switch (classKey) {
        case 'STALWART':
            addLogMessage("Your body feels more resilient, ready for the hardships ahead.", "synergy");
            gameState.maxHp = calculateMaxHp();
            gameState.currentHp = gameState.maxHp;
            break;

        case 'ERUDITE':
            addLogMessage("Your mind feels sharper, ready to glean secrets from this broken world.", "synergy");
            break;

        case 'WANDERER':
            addLogMessage("You feel a quiet confidence, ready to face whatever comes.", "synergy");
            break;
    }

    decisionArea.style.display = 'none';
    gameState.activeDecision = null;
    pauseGameForDecision(false); 

    renderAll(); 
}

function presentCompanionNaming(companionData) {
    if (gameState.auto.progress) { 
        resolveCompanionName(companionData, companionData.name); 
        return; 
    }
    pauseGameForDecision(true);

    decisionPromptText.textContent = `A shimmering presence coalesces into a friendly ${companionData.type}! It seems to want to follow you. What will you name it?`;
    decisionButtonsContainer.innerHTML = '';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'companionNameInput'; 
    nameInput.placeholder = companionData.name; 
    nameInput.maxLength = MAX_NAME_LENGTH;

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('name-confirm-button');

    const submitCompanionName = () => {
        const chosenName = nameInput.value;
        resolveCompanionName(companionData, chosenName);
    };

    confirmButton.onclick = submitCompanionName;
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitCompanionName();
        }
    });

    decisionButtonsContainer.appendChild(nameInput);
    decisionButtonsContainer.appendChild(confirmButton);
    decisionArea.style.display = 'block';
    updateUIAccentColors();
    nameInput.focus();
}

function resolveCompanionName(companionData, chosenName) {
    const finalName = chosenName.trim();
    const name = (finalName && finalName.length > 0) ? finalName : companionData.name;

    gameState.companion = {
        ...companionData, 
        name: name        
    };

    addLogMessage(`You have a new companion: ${gameState.companion.name} the ${gameState.companion.type}!`, "companion");
    playSound('companionFind');
    awardXP(30);

    decisionArea.style.display = 'none';
    gameState.activeDecision = null;
    pauseGameForDecision(false);
    renderAll(); 
}

function presentUpgradeMenu() {
    pauseGameForDecision(true);
    const effectiveStats = getEffectiveStats();

    decisionPromptText.textContent = "You focus your mind, contemplating the path forward. Ancient Scraps can unlock your potential.";
    decisionButtonsContainer.innerHTML = '';

    const statsToUpgrade = ['might', 'wits', 'spirit'];

    statsToUpgrade.forEach(stat => {
        const baseCost = 5;
        const currentStatPoints = gameState.stats[stat] - BASE_STAT_VALUE;
        const cost = baseCost * (currentStatPoints + 1);

        const button = document.createElement('button');
        button.innerHTML = `Improve ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${gameState.stats[stat]}) <br><small>Cost: ${cost} Scraps</small>`;

        if (gameState.resources.ancientScraps < cost) {
            button.disabled = true;
            button.title = "Not enough Ancient Scraps.";
        }

        button.onclick = () => resolveStatUpgrade(stat, cost);
        decisionButtonsContainer.appendChild(button);
    });
    
    const closeButton = document.createElement('button');
    closeButton.textContent = "Done";
    closeButton.onclick = () => {
        decisionArea.style.display = 'none';
        pauseGameForDecision(false);
    };
    decisionButtonsContainer.appendChild(closeButton);

    decisionArea.style.display = 'block';
    updateUIAccentColors();
}

function resolveStatUpgrade(statToUpgrade, cost) {
    if (gameState.resources.ancientScraps >= cost) {
        gameState.resources.ancientScraps -= cost;
        gameState.stats[statToUpgrade]++;

        if (statToUpgrade === 'might') {
            const oldMaxHp = gameState.maxHp;
            gameState.maxHp = calculateMaxHp();
            const hpGain = gameState.maxHp - oldMaxHp;
            gameState.currentHp += hpGain; 
        }
        
        addLogMessage(`Your ${statToUpgrade} has increased!`, "synergy");

        presentUpgradeMenu(); 
        renderAll(); 

    } else {
        addLogMessage("You lack the resources for this.", "puzzle-fail");
    }
}

function presentRuneMenu() {
    pauseGameForDecision(true);

    const promptText = `Attune up to ${gameState.maxActiveRunes} Runes. Attuned runes are marked with [*].`;
    decisionPromptText.textContent = promptText;
    decisionButtonsContainer.innerHTML = '';

    if (gameState.runes.length === 0) {
        decisionButtonsContainer.innerHTML = '<p>You have not yet found any runes.</p>';
    } else {
        gameState.runes.forEach(runeSymbol => {
            const runeDetails = RUNE_DEFINITIONS[runeSymbol];
            if (!runeDetails) return;

            const button = document.createElement('button');
            const isActive = gameState.activeRunes.includes(runeSymbol);
            
            const activeMarker = isActive ? "[*] " : "";

            button.innerHTML = `${activeMarker}<strong>${runeDetails.name} (${runeSymbol})</strong><br><small>${runeDetails.description}</small>`;
            button.onclick = () => resolveRuneSelection(runeSymbol);
            decisionButtonsContainer.appendChild(button);
        });
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = "Done";
    closeButton.onclick = () => {
        decisionArea.style.display = 'none';
        pauseGameForDecision(false);
    };
    decisionButtonsContainer.appendChild(closeButton);

    decisionArea.style.display = 'block';
    updateUIAccentColors();
}

function resolveRuneSelection(runeSymbol) {
    const activeIndex = gameState.activeRunes.indexOf(runeSymbol);

    if (activeIndex > -1) {
        gameState.activeRunes.splice(activeIndex, 1);
        addLogMessage(`${RUNE_DEFINITIONS[runeSymbol].name} fades to silence.`, "decision");
    } else {
        if (gameState.activeRunes.length < gameState.maxActiveRunes) {
            gameState.activeRunes.push(runeSymbol);
            addLogMessage(`You feel the power of the ${RUNE_DEFINITIONS[runeSymbol].name}!`, "synergy");
        } else {
            addLogMessage(`You can only attune ${gameState.maxActiveRunes} runes at a time.`, "puzzle-fail");
        }
    }

    presentRuneMenu();
    renderAll();
}

function showArtifactViewer() {
    artifactList.innerHTML = '';

    if (gameState.collectedArtifacts.length === 0) {
        artifactList.innerHTML = '<p>No artifacts collected yet.</p>';
    } else {
        gameState.collectedArtifacts.forEach(key => {
            const artifact = ARTIFACTS.find(art => art.key === key);
            if (artifact) {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'artifact-entry';

                const nameElement = document.createElement('strong');
                nameElement.textContent = artifact.name;

                const descElement = document.createElement('p');
                descElement.textContent = artifact.description;

                entryDiv.appendChild(nameElement);
                entryDiv.appendChild(descElement);
                artifactList.appendChild(entryDiv);
            }
        });
    }

    pauseGameForDecision(true);
    artifactModalBackdrop.style.display = 'flex';
    setTimeout(() => artifactModalBackdrop.classList.add('visible'), 10);
}

function hideArtifactViewer() {
    artifactModalBackdrop.classList.remove('visible');
    setTimeout(() => artifactModalBackdrop.style.display = 'none', 250);
    pauseGameForDecision(false); 
}

function showLoreCompendium() {
    loreList.innerHTML = '';
    let hasLore = false;

    // 1. Check for Zone Introductions and Shrines
    for (const key in ZONE_LORE) {
        if (gameState.narrativeFlags[key]) {
            hasLore = true;
            const entryDiv = document.createElement('div');
            entryDiv.className = 'lore-entry';
            
            // Format the key to look like a title (e.g., ASHEN_WOODS_INTRO -> Ashen Woods)
            let formattedTitle = key.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
            if (formattedTitle.includes("Intro")) formattedTitle = formattedTitle.replace("Intro", "Arrival");
            
            entryDiv.innerHTML = `<h3>${formattedTitle}</h3><p>${ZONE_LORE[key]}</p>`;
            loreList.appendChild(entryDiv);
        }
    }

    // 2. Check for Discovered World Lore Fragments
    if (typeof WORLD_LORE_FRAGMENTS !== 'undefined') {
        WORLD_LORE_FRAGMENTS.forEach(frag => {
            if (gameState.narrativeFlags[frag.key]) {
                hasLore = true;
                const entryDiv = document.createElement('div');
                entryDiv.className = 'lore-entry';
                entryDiv.innerHTML = `<h3>Fragment of the Past</h3><p>${frag.text}</p>`;
                loreList.appendChild(entryDiv);
            }
        });
    }

    if (!hasLore) {
        loreList.innerHTML = '<p style="text-align:center; color:#888;">The echoes are silent. You have not discovered any lore yet.</p>';
    }

    pauseGameForDecision(true);
    loreModalBackdrop.style.display = 'flex';
    setTimeout(() => loreModalBackdrop.classList.add('visible'), 10);
}

function hideLoreCompendium() {
    loreModalBackdrop.classList.remove('visible');
    setTimeout(() => loreModalBackdrop.style.display = 'none', 250);
    pauseGameForDecision(false);
}

function showInventory() {
    inventoryList.innerHTML = '';
    let hasItems = false;

    for (const itemId in gameState.inventory) {
        const count = gameState.inventory[itemId];
        // Only show items that the player has at least 1 of, and that exist in CONSUMABLES
        if (count > 0 && typeof CONSUMABLES !== 'undefined' && CONSUMABLES[itemId]) {
            hasItems = true;
            const item = CONSUMABLES[itemId];
            const entryDiv = document.createElement('div');
            entryDiv.className = 'inventory-item';
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'inventory-item-info';
            infoDiv.innerHTML = `<strong>${item.name} (x${count})</strong><p>${item.description}</p>`;
            
            const useBtn = document.createElement('button');
            useBtn.className = 'inventory-use-btn';
            useBtn.textContent = 'Use';
            useBtn.onclick = () => {
                item.effect();
                gameState.inventory[itemId]--;
                renderAll();
                showInventory(); // Refresh the list instantly to update quantities 
            };
            
            entryDiv.appendChild(infoDiv);
            entryDiv.appendChild(useBtn);
            inventoryList.appendChild(entryDiv);
        }
    }

    if (!hasItems) {
        inventoryList.innerHTML = '<p style="text-align:center; color:#888;">Your pack is empty.</p>';
    }

    pauseGameForDecision(true);
    inventoryModalBackdrop.style.display = 'flex';
    setTimeout(() => inventoryModalBackdrop.classList.add('visible'), 10);
}

function hideInventory() {
    inventoryModalBackdrop.classList.remove('visible');
    setTimeout(() => inventoryModalBackdrop.style.display = 'none', 250);
    pauseGameForDecision(false);
}

function presentForgeOfferingChoice() {
    if (gameState.auto.events) {
        if (gameState.resources.voidEssence > 0) {
            gameState.resources.voidEssence--;
            addLogMessage("You automatically feed Void Essence to the forge. It shrieks, channeling the energy into an Obsidian Rune (Ω)!", "artifact_synergy");
            if (!gameState.runes.includes('Ω')) gameState.runes.push('Ω');
            awardXP(75);
        } else {
            addLogMessage("You have no Void Essence to offer.", "decision");
        }
        renderAll();
        return;
    }

    let prompt = "The awakened forge craves a catalyst. What will you offer to its ancient heart?";
    let options = [{ text: "Offer nothing more", outcome: "NOTHING" }];

    if (gameState.resources.voidEssence > 0) {
        options.unshift({ text: "Offer 1 Void Essence", outcome: "VOID" });
    }

    decisionPromptText.textContent = prompt;
    decisionButtonsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => {
            decisionArea.style.display = 'none';
            if (option.outcome === "VOID") {
                gameState.resources.voidEssence--;
                addLogMessage("You feed the Void Essence to the forge. It shrieks, consuming the dark energy and channeling it into a single, perfectly cut Obsidian Rune (Ω)!", "artifact_synergy");
                if (!gameState.runes.includes('Ω')) {
                     gameState.runes.push('Ω');
                }
                awardXP(75);
            } else {
                addLogMessage("You decide the forge has taken enough for one day.", "decision");
            }
            pauseGameForDecision(false);
            renderAll();
        };
        decisionButtonsContainer.appendChild(button);
    });
    decisionArea.style.display = 'block';
}

function presentStatChallengeDecision(flagKey, promptText, ignoreText, successCondition, failureCallback) {
    if (gameState.auto.events) {
        gameState.narrativeFlags[flagKey] = true; 
        pauseGameForDecision(true);
        setTimeout(() => {
            decisionArea.style.display = 'none'; 
            gameState.activeDecision = null;
            if (!successCondition()) {
                failureCallback();
            }
            pauseGameForDecision(false); 
            renderAll();
        }, 500); // 500ms delay so the player can read what happened!
        return;
    }

    pauseGameForDecision(true);
    gameState.narrativeFlags[flagKey] = true; 

    const decisionData = {
        prompt: promptText,
        options: [{
            text: "Attempt the challenge",
            isChallenge: true
        }, {
            text: "Ignore and move on",
            isIgnore: true
        }]
    };
    gameState.activeDecision = decisionData;

    decisionPromptText.textContent = decisionData.prompt;
    decisionButtonsContainer.innerHTML = '';

    decisionData.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => {
            decisionArea.style.display = 'none';
            gameState.activeDecision = null;

            if (option.isChallenge) {
                if (!successCondition()) { 
                    failureCallback();
                }
            } else { 
                addLogMessage(ignoreText, "decision");
            }
            pauseGameForDecision(false);
            renderAll();
        };
        decisionButtonsContainer.appendChild(button);
    });

    decisionArea.style.display = 'block';
    updateUIAccentColors();
}

function presentDecision(decisionKey) {
    const decisionData = DECISIONS[decisionKey];
    if (!decisionData) return;

    if (gameState.auto.progress) {
        const forwardOption = decisionData.options.find(opt => opt.nextZoneIndex !== -1);
        if (forwardOption) { 
            resolveDecision(forwardOption); 
            return; 
        }
    }

    gameState.activeDecision = decisionData;
    pauseGameForDecision(true);
    decisionPromptText.textContent = decisionData.prompt;
    decisionButtonsContainer.innerHTML = '';
    decisionData.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => resolveDecision(option);
        decisionButtonsContainer.appendChild(button);
    });
    decisionArea.style.display = 'block';
    updateUIAccentColors();
}

function resolveDecision(chosenOption) {
    addLogMessage(`You chose: "${chosenOption.text}"`, "decision");
    gameState.narrativeFlags[chosenOption.outcomeKey] = true;

    decisionArea.style.display = 'none';
    gameState.activeDecision = null;

    if (chosenOption.leaveMessage) {
        messageInputArea.style.display = 'block';
        updateUIAccentColors();
        return;
    }

    if (chosenOption.nextZoneIndex === -1) {
        handleGameEnd("The journey pauses here. The path ahead is shrouded, for now...");
        return;
    }

    transitionToZone(chosenOption.nextZoneIndex);
}

function saveGame() {
    if (gameState.inCombat) {
        addLogMessage("Cannot save during combat.", "puzzle-fail");
        return;
    }
    if (gameState.activeDecision || document.getElementById('decision-area').style.display === 'block') {
        addLogMessage("Cannot save while a choice awaits.", "puzzle-fail");
        return;
    }
    try {
        const saveState = JSON.stringify(gameState);
        localStorage.setItem('realmsOfRuneAndRust_savegame', saveState);
        addLogMessage("Game Saved.", "synergy");
    } catch (e) {
        console.error("Error saving game:", e);
        addLogMessage("Could not save the game. The echoes are weak.", "puzzle-fail");
    }
}

function loadGame() {
    try {
        const savedState = localStorage.getItem('realmsOfRuneAndRust_savegame');

        if (savedState) {
            const loadedState = JSON.parse(savedState);
            gameState = loadedState;
            
            if (gameState.activeDecision || gameState.inCombat) {
                gameState.activeDecision = null;
                gameState.inCombat = false;
                document.getElementById('decision-area').style.display = 'none';
                addLogMessage("Time has passed. The immediate dangers and choices of the past have faded.", "synergy");
            }
            
            if (!gameState.currentZoneElements) {
                gameState.currentZoneElements = generateZoneElements(gameState.currentZoneIndex);
            }
            
            // Backward compatibility: Create 'auto' settings if they don't exist
            if (!gameState.auto) {
                gameState.auto = { combat: false, events: false, progress: false };
            }
            
            updateAutoButtonVisuals();
            addLogMessage("Saved journey restored.", "synergy");
            return true;
        }
    } catch (e) {
        console.error("Error loading game:", e);
        addLogMessage("The saved journey is corrupted and could not be restored.", "puzzle-fail");
        localStorage.removeItem('realmsOfRuneAndRust_savegame');
    }
    return false;
}

function resetGame(isTranscending = false) {
    if (confirm("Start a new journey? Your current progress will be lost.")) {
        if (!isTranscending) {
             try {
                localStorage.removeItem(LEGACY_MIGHT_KEY);
                localStorage.removeItem(LEGACY_WITS_KEY);
                localStorage.removeItem(LEGACY_SPIRIT_KEY);
            } catch(e) { console.error("Could not clear legacy stats from localStorage:", e); }
        }
        location.reload();
    }
}

function handleTranscendence() {
     if (confirm("Transcend? Your journey will begin anew, but an echo of your strength will remain.")) {
        const legacyMight = Math.floor(gameState.stats.might / 4);
        const legacyWits = Math.floor(gameState.stats.wits / 4);
        const legacySpirit = Math.floor(gameState.stats.spirit / 4);

         try {
            localStorage.setItem(LEGACY_MIGHT_KEY, legacyMight);
            localStorage.setItem(LEGACY_WITS_KEY, legacyWits);
            localStorage.setItem(LEGACY_SPIRIT_KEY, legacySpirit);
        } catch(e) { console.error("Could not save legacy stats to localStorage:", e); }

        resetGame(true);
    }
}

function toggleDevControls() {
    const devControls = document.getElementById('dev-controls');
    if (devControls) {
        const isHidden = devControls.style.display === 'none';
        devControls.style.display = isHidden ? 'block' : 'none';
    }
}

function togglePause() {
    if (gameState.currentZoneIndex === -1) return;

    gameState.isPaused = !gameState.isPaused; 

    if (gameState.isPaused) {
        clearInterval(gameInterval); 
        gameInterval = null;
        pauseResumeButton.textContent = "Resume";
        addLogMessage("Game paused.", "system");
    } else {
        if (!gameInterval) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
        pauseResumeButton.textContent = "Pause";
        addLogMessage("Game resumed.", "system");
    }
}

function addLogMessage(message, type = "normal") {
    let classAttribute = "";
    if (type === "lore") classAttribute = "class='lore-message'";
    if (type === "world_lore") classAttribute = "class='world-lore-message'";
    if (type === "synergy" || type === "puzzle-success") classAttribute = "class='synergy-message'";
    if (type === "puzzle-fail") classAttribute = "class='puzzle-fail-message'";
    if (type === "artifact_synergy") classAttribute = "class='artifact-synergy-message'";
    if (type === "artifact") classAttribute = "class='artifact-message'";
    if (type === "npc") classAttribute = "class='npc-message'";
    if (type === "decision") classAttribute = "class='decision-outcome'";
    if (type === "future_self") classAttribute = "class='future-self-message'";
    if (type === "companion") classAttribute = "class='companion-message'";
    if (type === "grave") classAttribute = "class='grave-message'";
    if (type === "seed") classAttribute = "class='seed-message'";
    if (type === "startup") classAttribute = "class='startup-message'";
    if (type === "xp") classAttribute = "class='xp-message'";
    if (type === "level-up-message") classAttribute = "class='level-up-message'";
    if (type === "combat-message") classAttribute = "class='combat-message'";
    if (type === "combat-victory") classAttribute = "class='combat-victory'";
    if (type === "combat-defeat") classAttribute = "class='combat-defeat'";
    if (type === "quest") classAttribute = "class='quest-message'";
    if (type === "class-choice") classAttribute = "class='class-choice-message'";
    if (type === "name-choice") classAttribute = "class='name-choice-message'";

    gameState.logMessages.unshift(`<p ${classAttribute}>${message}</p>`);
    if (gameState.logMessages.length > gameState.maxLogMessages) {
        gameState.logMessages.pop();
    }
    renderLog();
}

function getElementDescription(elementChar) {
    const descriptions = {
        '@': 'You (The Wanderer)',
        'c': gameState.companion ? gameState.companion.name : 'flickering conduit',
        '¶': 'Tome of forgotten knowledge',
        '®': 'Ancient Runestone',
        'T': 'charred greatwood', 't': 'burnt sapling', 'Y': 'scorched tree',
        'w': 'swaying wind chime / smoldering bush', 'm': 'patch of ash', 'o': 'heated rock',
        '♦': 'crimson shard', '◊': 'violet crystal', '✧': 'glowing ember', '*': 'sparkling geode',
        '[': 'obsidian wall', ']': 'broken column', '¦': 'volcanic archway', '^': 'jagged peak',
        '.': 'pile of dust', '`': 'cloud of ash', ':': 'crystal speckle', "'": 'glassy shard', '%': 'twisted remnant',
        '~': 'pool of water', 'S': 'submerged shelf', 'b': 'waterlogged book/slate',
        '=': 'sturdy bridge', 'M': 'towering mountain', 'F': 'dense forest patch', '0': 'darkened earth/ruin',
        'C': 'drifting cloud', 'R': 'temple ruin', 'G': 'Guardian fragment', 'O': "Oracle's Dais",
        'B': 'blocked path', '?': 'faded runic etching', '!': 'whispering totem',
        '¥': 'blade in stone', 'd': 'dying creature',
        'L': 'repository of fragmented lore', 'H': 'sacred, time-worn shrine', 'A': 'forgotten artifact',
        'P': 'shimmering presence', '+': 'weathered grave marker', 'N': 'lone figure',
        'D': 'Data Crystal',
        'V': 'Void Shard', 'X': 'warped growth', 'E': 'Hostile Presence / Void Echo'
    };
    return descriptions[elementChar] || 'mysterious object';
}

function renderLog() {
    logArea.innerHTML = gameState.logMessages.join('');
    const firstLogEntry = logArea.querySelector('p:first-child');

    if (firstLogEntry && !firstLogEntry.classList.contains('lore-message') &&
        !firstLogEntry.classList.contains('world-lore-message') &&
        !firstLogEntry.classList.contains('synergy-message') &&
        !firstLogEntry.classList.contains('puzzle-success-message') &&
        !firstLogEntry.classList.contains('puzzle-fail-message') &&
        !firstLogEntry.classList.contains('artifact-synergy-message') &&
        !firstLogEntry.classList.contains('artifact-message') &&
        !firstLogEntry.classList.contains('npc-message') &&
        !firstLogEntry.classList.contains('decision-outcome') &&
        !firstLogEntry.classList.contains('future-self-message') &&
        !firstLogEntry.classList.contains('companion-message') &&
        !firstLogEntry.classList.contains('grave-message') &&
        !firstLogEntry.classList.contains('seed-message') &&
        !firstLogEntry.classList.contains('startup-message') &&
        !firstLogEntry.classList.contains('xp-message') &&
        !firstLogEntry.classList.contains('level-up-message') &&
        !firstLogEntry.classList.contains('combat-message') &&
        !firstLogEntry.classList.contains('combat-victory') &&
        !firstLogEntry.classList.contains('combat-defeat') &&
        !firstLogEntry.classList.contains('quest-message') &&
        !firstLogEntry.classList.contains('class-choice-message') &&
        !firstLogEntry.classList.contains('name-choice-message')
    ) {
        const zone = getCurrentZone();
        if (zone) firstLogEntry.style.color = lightenDarkenColor(zone.color, 60);
    }
}

function renderStats() {
    const zone = getCurrentZone();
    const effectiveStats = getEffectiveStats();

    if (gameState.currentZoneIndex === -1) {
        statsZoneName.textContent = "Journey Ended";
        statsExploredPercentage.textContent = "---";
        document.getElementById('zone-progress-bar').style.width = '100%';
    } else if (zone) {
        statsZoneName.textContent = zone.name;
        // Cap visual explore percentage at 100% even if Endless Abyss goes on forever
        const rawPercentage = (gameState.playerZoneX / zone.width) * 100;
        const exploredPercentage = Math.min(100, Math.floor(rawPercentage));
        statsExploredPercentage.textContent = exploredPercentage;
        
        // PHASE 4: Update Progress bar
        document.getElementById('zone-progress-bar').style.width = `${exploredPercentage}%`;
    }

    playerNameDisplay.textContent = gameState.playerName;
    playerHpDisplay.textContent = Math.max(0, gameState.currentHp);
    playerHpWrapper.title = "Health Points (HP): Your vitality. If this reaches 0, your journey ends.";
    playerMaxHpDisplay.textContent = gameState.maxHp;

    playerClassDisplay.textContent = gameState.playerClass || "None";
    playerClassWrapper.title = "Class: Your chosen specialization, granting unique bonuses.";

    statsExplorationSpeed.textContent = `${gameState.explorationSpeedMultiplier.toFixed(1)}x`;
    explorationSpeedWrapper.title = "Exploration Speed: How quickly you travel. Can be upgraded with Glimmering Dust.";

    statsGlimmeringDust.textContent = gameState.resources.glimmeringDust;
    glimmeringDustWrapper.title = "Glimmering Dust: A common resource used for basic upgrades and actions.";

    statsAncientScraps.textContent = gameState.resources.ancientScraps;
    ancientScrapsWrapper.title = "Ancient Scraps: Remnants of a bygone era, hinting at lost technology.";

    statsRunesCollected.textContent = gameState.runes.length > 0 ? gameState.runes.join(' ') : 'None';
    runesCollectedWrapper.title = "Runes: Powerful, permanent symbols you have attuned to.";

    const totalItems = Object.values(gameState.inventory || {}).reduce((a, b) => a + b, 0);
    document.getElementById('inventory-count').textContent = totalItems;
    document.getElementById('inventory-wrapper').title = "Consumable items. Use them in combat to survive.";

    if (gameState.resources.voidEssence > 0) {
        voidEssenceDisplay.style.display = 'inline';
        statsVoidEssence.textContent = gameState.resources.voidEssence;
        voidEssenceDisplay.title = "Void Essence: A rare and unsettling resource drawn from the Starfall Crater's influence.";
    } else {
        voidEssenceDisplay.style.display = 'none';
    }

    if (gameState.companion) {
        companionDisplay.style.display = 'inline';
        companionInfo.textContent = `${gameState.companion.name} the ${gameState.companion.type}`;
        companionDisplay.title = "Companion: A loyal creature who travels with you.";
    } else {
        companionDisplay.style.display = 'none';
    }
    artifactsCollectedDisplay.textContent = `${gameState.collectedArtifacts.length}/${ARTIFACTS.length}`;
    artifactsCollectedWrapper.title = "Artifacts: Unique relics from the past, each with its own story or effect.";

    statWitsDisplay.textContent = effectiveStats.wits;
    statWitsWrapper.title = "Wits (WIT): Increases success in deciphering runes, understanding lore, and discovering secrets.";

    statSpiritDisplay.textContent = effectiveStats.spirit;
    statSpiritWrapper.title = "Spirit (SPR): Enhances spiritual power and improves outcomes with companions, shrines, and mystical events.";

    playerLevelDisplay.textContent = gameState.level;
    playerLevelWrapper.title = "Level: Your overall character level. Increases with experience (XP).";

    playerXpDisplay.textContent = gameState.xp;
    playerXpWrapper.title = "Experience (XP): Gained from discoveries and combat. Earn enough to level up.";
    xpToNextLevelDisplay.textContent = gameState.xpToNextLevel;

    statMightWrapper.title = "Might (MGT): Increases max HP, physical power, and success in strength-based challenges.";
    if (effectiveStats.might !== gameState.stats.might) {
        statMightDisplay.textContent = `${effectiveStats.might} (${gameState.stats.might}+${effectiveStats.might - gameState.stats.might})`;
        statMightDisplay.style.color = '#90ee90';
    } else {
        statMightDisplay.textContent = effectiveStats.might;
        statMightDisplay.style.color = '';
    }

    const upgradeCost = 50 * gameState.explorationSpeedMultiplier;
    upgradeSpeedButton.textContent = `Upgrade Speed (Cost: ${Math.round(upgradeCost)} .)`;
    upgradeSpeedButton.disabled = gameState.resources.glimmeringDust < upgradeCost || gameState.currentZoneIndex === -1;
}

function updateUIAccentColors() {
    const zone = getCurrentZone();
    const root = document.documentElement; 

    if (zone && gameState.currentZoneIndex !== -1) {
        root.style.setProperty('--zone-color', zone.color);
        root.style.setProperty('--zone-bg-color', zone.bgColor);
        root.style.setProperty('--zone-color-dark', lightenDarkenColor(zone.color, -50));
    } else {
        root.style.setProperty('--zone-color', '#777777');
        root.style.setProperty('--zone-bg-color', '#222222');
        root.style.setProperty('--zone-color-dark', '#555555');
    }
}

function renderGameScreen() {
    const zone = getCurrentZone();

    if (!zone && gameState.currentZoneIndex === -1) {
        for (let lane = 0; lane < NUM_LANES; lane++) {
            for (let i = 0; i < SCREEN_WIDTH; i++) {
                let charToDraw = ' ';
                let classToDraw = '';
                
                if (i === PLAYER_VISUAL_POSITION && lane === gameState.playerLane) {
                    charToDraw = '@';
                    classToDraw = ''; 
                } else if (lane === gameState.playerLane && i > PLAYER_VISUAL_POSITION && i < PLAYER_VISUAL_POSITION + 14) {
                    const text = "Path Fades...";
                    charToDraw = text[i - PLAYER_VISUAL_POSITION - 1];
                }

                if (vDom[lane][i].char !== charToDraw || vDom[lane][i].class !== classToDraw) {
                    domGrid[lane][i].textContent = charToDraw;
                    domGrid[lane][i].className = classToDraw;
                    domGrid[lane][i].title = getElementDescription(charToDraw); // Apply tooltip
                    vDom[lane][i].char = charToDraw;
                    vDom[lane][i].class = classToDraw;
                }
            }
        }
        return;
    }
    if (!zone) return;

    for (let lane = 0; lane < NUM_LANES; lane++) {
        for (let screenX = 0; screenX < SCREEN_WIDTH; screenX++) {
            let charToDraw = ' ';
            let classToDraw = '';
            const worldX = gameState.playerZoneX - PLAYER_VISUAL_POSITION + screenX;

            // 1. Draw Player
            if (lane === gameState.playerLane && screenX === PLAYER_VISUAL_POSITION) {
                charToDraw = '@';
                classToDraw = 'player-char';
            } 
            // 2. Draw Companion
            else if (gameState.companion && lane === gameState.playerLane && screenX === PLAYER_VISUAL_POSITION - 1) {
                charToDraw = 'c';
                classToDraw = 'companion-char';
            }
            // 3. Draw Foreground Elements
            else if (gameState.currentZoneElements[worldX] && gameState.currentZoneElements[worldX].some(el => el.lane === lane)) {
                const element = gameState.currentZoneElements[worldX].find(el => el.lane === lane);
                charToDraw = element.char;
                
                if (element.char === '~') classToDraw = 'water-tile';
                else if (element.char === '=') classToDraw = 'bridge-tile';
                else if (element.char === 'M') classToDraw = 'mountain-tile';
                else if (element.char === 'F') classToDraw = 'forest-tile';
                else if (element.char === '0') classToDraw = 'dark-feature-tile';
                else if (element.char === 'C') classToDraw = 'cloud-tile';
                else if (element.char === 'R') classToDraw = 'ruin-tile';
                else if (element.char === 'w' && zone.name === "The Sky-Temple Aerie") classToDraw = 'windchime-tile';
                else if (element.char === 'G') classToDraw = 'guardian-tile';
                else if (element.char === 'O') classToDraw = 'oracle-dais-tile';
                else if (element.char === '®') classToDraw = 'runestone-tile';
                else if (element.enemyKey) classToDraw = 'enemy-tile';
                else if (element.char === 'B') classToDraw = 'blocked-path-tile';
                else if (element.char === '?') classToDraw = 'runic-etching-tile';
                else if (element.char === '!') classToDraw = 'whispering-totem-tile';
                else if (element.char === '¥') classToDraw = 'sword-stone-tile';
                else if (element.char === 'd') classToDraw = 'dying-creature-tile';
            } 
            // 4. Draw Background / Midground
            else {
                if ((worldX + lane) % 11 === 0) {
                    charToDraw = zone.backgroundChar;
                } else if ((worldX + lane * 2) % (zone.midgroundChar === '%' ? 5 : (zone.midgroundChar === 'c' ? 6 : (zone.midgroundChar === 'C' ? 8 : 9))) === 0) {
                    charToDraw = zone.midgroundChar;
                }
            }

            if (vDom[lane][screenX].char !== charToDraw || vDom[lane][screenX].class !== classToDraw) {
                domGrid[lane][screenX].textContent = charToDraw;
                domGrid[lane][screenX].className = classToDraw;
                domGrid[lane][screenX].title = getElementDescription(charToDraw); // Apply tooltip
                vDom[lane][screenX].char = charToDraw;
                vDom[lane][screenX].class = classToDraw;
            }
        }
    }
}

function lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] === "#") {
        col = col.slice(1);
        usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let g = ((num >> 8) & 0x00FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    let b = (num & 0x0000FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    const newR = r.toString(16).padStart(2, '0');
    const newG = g.toString(16).padStart(2, '0');
    const newB = b.toString(16).padStart(2, '0');
    return (usePound ? "#" : "") + newR + newG + newB;
}

function updateGameTickSpeed() {
    gameState.gameTickMs = INITIAL_GAME_TICK_MS / (gameState.explorationSpeedMultiplier * devSpeedMultiplier);
    if (gameInterval) {
        clearInterval(gameInterval);
        if (!gameState.isPaused && !gameState.activeDecision && gameState.currentZoneIndex !== -1) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
    }
}

function handleFutureSelfMessageSave(fromButton) {
    const message = futureSelfTextarea.value.trim();
    if (message && fromButton === 'save') {
        try {
            localStorage.setItem(FUTURE_SELF_MESSAGE_KEY, message);
            addLogMessage("Your message is woven into the echoes, awaiting your return.", "future_self");
        } catch (e) {
            console.error("Could not save message to localStorage:", e);
            addLogMessage("The echoes couldn't carry your message (localStorage error).", "lore");
        }
    }
    futureSelfTextarea.value = '';
    messageInputArea.style.display = 'none';
    gameState.activeDecision = null;
    handleGameEnd("The journey pauses here. The path ahead is shrouded, for now...");
}

function pauseGameForDecision(isPausing) {
    if (isPausing) {
        clearInterval(gameInterval);
    } else {
        if (!gameState.isPaused && gameState.currentZoneIndex !== -1 && !gameState.inCombat) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
    }
}

function handleGameEnd(message = "You have explored all realms. The echoes of this journey will linger.") {
    addLogMessage(message, "decision");
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = null;

    // --- Stop auto-saving ---
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = null;

    gameState.lastExploredZoneIndex = gameState.currentZoneIndex;
    gameState.currentZoneIndex = -1;
    pauseResumeButton.textContent = "Journey Ended";
    pauseResumeButton.disabled = true;
    upgradeSpeedButton.disabled = true;
    meditateButton.disabled = true;
    attuneRunesButton.disabled = true;

    const summaryText = generateCharacterSummary();
    journeySummaryTextarea.value = summaryText;
    summaryArea.style.display = 'block';

    if (gameState.level >= TRANSCEND_LEVEL_THRESHOLD) {
        transcendButton.style.display = 'inline-block';
    } else {
        transcendButton.style.display = 'none';
    }

    updateUIAccentColors();
    renderAll();
}

function renderAll() {
    renderStats();
    renderGameScreen();
    renderLog();
}

function showConfirmationModal(message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const modalText = document.getElementById('modalText');
    const confirmBtn = document.getElementById('modalConfirmButton');
    const cancelBtn = document.getElementById('modalCancelButton');

    modalText.textContent = message;

    const confirmClickHandler = () => {
        hideConfirmationModal();
        onConfirm(); 
        confirmBtn.removeEventListener('click', confirmClickHandler); 
    };
    confirmBtn.addEventListener('click', confirmClickHandler);

    cancelBtn.addEventListener('click', hideConfirmationModal, { once: true });

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10); 
}

function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('visible');
    setTimeout(() => modal.style.display = 'none', 250); 
}

function initializeAndRunGame() {
    initializeSounds();
    setupEventListeners(); 
    updateUIAccentColors();
    renderAll();
    document.body.classList.remove('loading');

    if (!gameState.isPaused && gameState.currentZoneIndex !== -1) {
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameState.gameTickMs);
    }

        // --- Start the silent auto-save loop (every 30 seconds / 30,000 ms) ---
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(autoSave, 30000);
}

document.addEventListener('DOMContentLoaded', () => {
    initDOMGrid(); 
    
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.querySelector('.game-container');
    const continueButton = document.getElementById('continueButton');
    const newGameButton = document.getElementById('newGameButton');

    const saveExists = localStorage.getItem('realmsOfRuneAndRust_savegame') !== null;

    if (saveExists) {
        continueButton.style.display = 'inline-block';
    }

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        toggleDevControls();
    }
});

const devSpeedSlider = document.getElementById('dev-speed-slider');
const devSpeedDisplay = document.getElementById('dev-speed-display');

if (devSpeedSlider && devSpeedDisplay) {
    devSpeedSlider.addEventListener('input', (e) => {
        devSpeedMultiplier = parseInt(e.target.value);
        devSpeedDisplay.textContent = devSpeedMultiplier;
        updateGameTickSpeed();
    });
}

continueButton.addEventListener('click', () => {
    startScreen.style.opacity = '0'; 
    setTimeout(() => {
        startScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        loadGame();
        initializeAndRunGame();
    }, 500); 
});

newGameButton.addEventListener('click', () => {
const startNew = () => {
    localStorage.removeItem('realmsOfRuneAndRust_savegame');
    localStorage.removeItem(LEGACY_MIGHT_KEY);
    localStorage.removeItem(LEGACY_WITS_KEY);
    localStorage.removeItem(LEGACY_SPIRIT_KEY);

    startScreen.style.opacity = '0'; 
    setTimeout(() => {
        startScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        startGame();
        initializeAndRunGame();
    }, 500); 
};

    if (saveExists) {
        showConfirmationModal(
            "Start a new journey? This will overwrite your saved progress.",
            startNew 
        );
    } else {
        startNew();
    }
});
}); 

function setupEventListeners() {
    if (pauseResumeButton) {
        pauseResumeButton.addEventListener('click', togglePause);
    }
    
    if (upgradeSpeedButton) {
        upgradeSpeedButton.addEventListener('click', attemptUpgradeSpeed);
    }

    if (inventoryButton) {
        inventoryButton.addEventListener('click', showInventory);
    }
    
    if (inventoryModalClose) {
        inventoryModalClose.addEventListener('click', hideInventory);
    }
    
    if (inventoryModalBackdrop) {
        inventoryModalBackdrop.addEventListener('click', (event) => {
            if (event.target === inventoryModalBackdrop) {
                hideInventory();
            }
        });
    }
    
    // Make the stat bar text clickable!
    if (inventoryWrapper) {
        inventoryWrapper.style.cursor = 'pointer';
        inventoryWrapper.addEventListener('click', showInventory);
    }

    if (btnAutoCombat) btnAutoCombat.addEventListener('click', () => { gameState.auto.combat = !gameState.auto.combat; updateAutoButtonVisuals(); });
    if (btnAutoEvents) btnAutoEvents.addEventListener('click', () => { gameState.auto.events = !gameState.auto.events; updateAutoButtonVisuals(); });
    if (btnAutoProgress) btnAutoProgress.addEventListener('click', () => { gameState.auto.progress = !gameState.auto.progress; updateAutoButtonVisuals(); });

    if (loreCompendiumButton) {
        loreCompendiumButton.addEventListener('click', showLoreCompendium);
    }
    
    if (loreModalClose) {
        loreModalClose.addEventListener('click', hideLoreCompendium);
    }
    
    if (loreModalBackdrop) {
        loreModalBackdrop.addEventListener('click', (event) => {
            if (event.target === loreModalBackdrop) {
                hideLoreCompendium();
            }
        });
    }

if (meditateButton) {
    meditateButton.addEventListener('click', () => {
        const MEDITATE_DUST_COST = 25;

        if (gameState.resources.glimmeringDust >= MEDITATE_DUST_COST) {
            gameState.resources.glimmeringDust -= MEDITATE_DUST_COST;
            addLogMessage(`You focus your mind, spending ${MEDITATE_DUST_COST} dust to meditate.`, "decision");
            presentUpgradeMenu();
            renderStats(); 
        } else {
            addLogMessage(`You lack the spiritual focus to meditate. (Requires ${MEDITATE_DUST_COST} Dust)`, "puzzle-fail");
        }
    });
}
    
    if (attuneRunesButton) {
        attuneRunesButton.addEventListener('click', presentRuneMenu);
    }

    if (saveGameButton) {
        saveGameButton.addEventListener('click', saveGame);
    }

    if (saveMessageButton) {
        saveMessageButton.addEventListener('click', () => handleFutureSelfMessageSave('save'));
    }
    
    if (skipMessageButton) {
        skipMessageButton.addEventListener('click', () => handleFutureSelfMessageSave('skip'));
    }

    if (newJourneyButton) {
        newJourneyButton.addEventListener('click', () => resetGame(false));
        newJourneyButton.title = 'Start a completely fresh journey. All progress and legacy stats will be erased.';
    }
    
    if (transcendButton) {
        transcendButton.addEventListener('click', handleTranscendence);
        transcendButton.title = 'Start a New Game+. A fraction of your final stats will carry over to give you a head start.';
    }

  if (copyLogButton) {
        copyLogButton.addEventListener('click', () => {
            navigator.clipboard.writeText(logArea.innerText).then(() => {
                const originalText = "Copy Log"; 
                copyLogButton.textContent = 'Copied!';
                copyLogButton.disabled = true;
                setTimeout(() => {
                    copyLogButton.textContent = originalText;
                    copyLogButton.disabled = false;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy log: ', err);
            });
        });
    }
    
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            gameState.isMuted = !gameState.isMuted;
            muteButton.textContent = gameState.isMuted ? "Unmute Sounds" : "Mute Sounds";
            
            if (typeof Tone !== 'undefined' && Tone.Destination) {
                Tone.Destination.mute = gameState.isMuted;
            }

            if (!gameState.isMuted && typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                Tone.start().catch(e => console.warn("Tone.start() failed on mute toggle.", e));
            }
        });
    }

    if (artifactsCollectedWrapper) {
        artifactsCollectedWrapper.addEventListener('click', showArtifactViewer);
    }
    
    if (artifactModalClose) {
        artifactModalClose.addEventListener('click', hideArtifactViewer);
    }
    
    if (artifactModalBackdrop) {
        artifactModalBackdrop.addEventListener('click', (event) => {
            if (event.target === artifactModalBackdrop) {
                hideArtifactViewer();
            }
        });
    }

    const devHardRefreshButton = document.getElementById('dev-hard-refresh');
    if (devHardRefreshButton) {
        devHardRefreshButton.addEventListener('click', () => {
            console.log("Developer: Performing a hard refresh to clear cache...");
            location.reload(true);
        });
    }

    const devWipeDataButton = document.getElementById('dev-wipe-data');
    if (devWipeDataButton) {
        devWipeDataButton.addEventListener('click', () => {
            const isConfirmed = confirm("DEVELOPER: Are you sure you want to WIPE ALL GAME DATA?\n\nThis includes your save file, legacy stats, and future-self messages. This cannot be undone.");

            if (isConfirmed) {
                console.log("Developer: Wiping all localStorage data for this game...");
                
                localStorage.removeItem('realmsOfRuneAndRust_savegame');
                localStorage.removeItem(LEGACY_MIGHT_KEY);
                localStorage.removeItem(LEGACY_WITS_KEY);
                localStorage.removeItem(LEGACY_SPIRIT_KEY);
                localStorage.removeItem(FUTURE_SELF_MESSAGE_KEY);

                alert("All game data has been wiped. The page will now reload.");
                location.reload();
            } else {
                console.log("Developer: Data wipe cancelled.");
            }
        });
    }
}

function startGame() {
    addLogMessage("✨ A new journey begins...", "startup");

    gameState = {
        level: 1,
        xp: 0,
        xpToNextLevel: calculateXPForNextLevel(1),
        
        playerName: "Wanderer",
        playerClass: null,
        
        currentHp: BASE_HP,
        maxHp: BASE_HP,
        stats: {
            might: BASE_STAT_VALUE,
            wits: BASE_STAT_VALUE,
            spirit: BASE_STAT_VALUE
        },
        
        currentZoneIndex: 0,
        lastExploredZoneIndex: 0,
        playerZoneX: 0,
        playerLane: PLAYER_INITIAL_LANE,
        explorationSpeedMultiplier: 1.0,
        
        resources: {
            glimmeringDust: 0,
            ancientScraps: 0,
            voidEssence: 0
        },
        
        runes: [],
        activeRunes: [],
        maxActiveRunes: 2,
        collectedArtifacts: [],
        companion: null,
        inventory: { 'healing_dust': 2 },

        auto: { combat: false, events: false, progress: false },
        
        isPaused: false,
        inCombat: false,
        activeDecision: null,
        gameTickMs: INITIAL_GAME_TICK_MS,
        isMuted: false,
        lastStepSoundTime: 0,
        
        narrativeFlags: {},
        encounteredNPCs: {},
        logMessages: [],
        maxLogMessages: MAX_LOG_MESSAGES,
        
        initialGameSeed: Date.now() % 2147483647,
        currentZoneElements: {}
    };

    initializeSeed(gameState.initialGameSeed);

    try {
        const legacyMight = parseInt(localStorage.getItem(LEGACY_MIGHT_KEY) || '0');
        const legacyWits = parseInt(localStorage.getItem(LEGACY_WITS_KEY) || '0');
        const legacySpirit = parseInt(localStorage.getItem(LEGACY_SPIRIT_KEY) || '0');
        
        gameState.stats.might += legacyMight;
        gameState.stats.wits += legacyWits;
        gameState.stats.spirit += legacySpirit;
        
        if (legacyMight > 0 || legacyWits > 0 || legacySpirit > 0) {
            addLogMessage(`Legacy Echoes whisper: MGT+${legacyMight}, WIT+${legacyWits}, SPR+${legacySpirit}`, "synergy");
        }
    } catch (e) {
        console.warn("Could not load legacy stats:", e);
    }

    gameState.maxHp = calculateMaxHp();
    gameState.currentHp = gameState.maxHp;

    addLogMessage(`World Seed: ${gameState.initialGameSeed}`, "seed");

    try {
        const savedMessage = localStorage.getItem(FUTURE_SELF_MESSAGE_KEY);
        if (savedMessage) {
            addLogMessage(`A message from a past journey echoes: "${savedMessage}"`, "future_self");
            localStorage.removeItem(FUTURE_SELF_MESSAGE_KEY);
        }
    } catch (e) {
        console.warn("Could not access localStorage for future self message:", e);
    }

    gameState.currentZoneElements = generateZoneElements(0);

    const initialZone = getCurrentZone();
    if (initialZone && initialZone.entryLoreKey && ZONE_LORE[initialZone.entryLoreKey]) {
        addLogMessage(ZONE_LORE[initialZone.entryLoreKey], "lore");
        gameState.narrativeFlags[initialZone.entryLoreKey] = true;
    }

    updateUIAccentColors();
    updateAutoButtonVisuals();
    renderAll();

    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(gameLoop, gameState.gameTickMs);

    pauseResumeButton.textContent = "Pause";
    pauseResumeButton.disabled = false;
    upgradeSpeedButton.disabled = false;
    meditateButton.disabled = false;
    attuneRunesButton.disabled = false;

    addLogMessage("Your journey begins...", "startup");
}

function showFloatingText(message, color, xOffset = 0) {
    const gameScreen = document.getElementById('game-screen');
    const rect = gameScreen.getBoundingClientRect();
    const floater = document.createElement('div');
    
    floater.textContent = message;
    floater.className = 'floating-text';
    floater.style.color = color;
    
    // Position it roughly near the center of the game screen, with slight randomization
    const startX = rect.left + (rect.width / 2) + xOffset + (Math.random() * 20 - 10);
    const startY = rect.top + (rect.height / 2) + (Math.random() * 20 - 10);
    
    floater.style.left = `${startX}px`;
    floater.style.top = `${startY}px`;
    
    document.body.appendChild(floater);
    
    // Clean up the DOM after the animation finishes
    setTimeout(() => floater.remove(), 1000);
}
