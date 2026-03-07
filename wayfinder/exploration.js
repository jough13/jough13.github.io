 // --- PLANETARY INTERACTION UI ---
function openPlanetView(location) {
    openGenericModal(`ORBITING: ${(location.name || 'Planet').toUpperCase()}`);
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Parse the biome data cleanly
    const biomeId = location.biome || 'BARREN_ROCK';
    const biomeData = PLANET_BIOMES && PLANET_BIOMES[biomeId] ? PLANET_BIOMES[biomeId] : { name: biomeId, description: "Unknown planet type.", landable: true, image: "" };

    // THE FIX: Use playerX and playerY directly so procedural deep-space planets don't fail this check!
    const isColonyHere = (typeof playerColony !== 'undefined' && playerColony.established && playerColony.x === playerX && playerColony.y === playerY);
    
    const planetStatus = isColonyHere ? 
        `<div style="color:var(--success); font-weight:bold; letter-spacing: 1px;">SETTLED: ${playerColony.name.toUpperCase()}</div>
         <div style="color:#666; font-size: 11px; margin-top: 5px;">Concord Recognized Pioneer Settlement</div>` :
        `<div style="color:var(--danger); font-weight:bold; letter-spacing: 1px;">UNCLAIMED WILDERNESS</div>
         <div style="color:#666; font-size: 11px; margin-top: 5px;">No civilized structures detected. High concentration of raw materials present in the crust.</div>`;

    // Dynamic Image Loading
    let imageHtml = biomeData.image ? `<img src="${biomeData.image}" style="width:100px; height:100px; margin-bottom:15px; border-radius:50%; object-fit:cover; border: 2px solid var(--border-color); box-shadow: 0 0 20px rgba(0, 224, 224, 0.2);">` : `<div style="text-align:center; font-size: 60px; margin-bottom:15px; filter: drop-shadow(0 0 15px ${location.color || '#00E0E0'});">🪐</div>`;

    // 1. Render Planet Vitals
    detailEl.innerHTML = `
        <div style="text-align:center; padding-top: 20px;">
            ${imageHtml}
            <h3 style="color:var(--accent-color); margin-top:0; margin-bottom: 5px; font-size: 24px;">${location.name || 'Uncharted Planet'}</h3>
            <p style="color:var(--item-desc-color); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Class: ${biomeData.name}</p>
        </div>
        
        <div style="border: 1px dashed var(--border-color); background: var(--bg-color); padding: 15px; margin-top: 20px; border-radius: 4px;">
            <div style="color:var(--item-desc-color); font-size:10px; margin-bottom: 5px; letter-spacing: 1px;">PLANETARY STATUS:</div>
            ${planetStatus}
        </div>
        
        <div id="surfaceScanResultBox"></div>
        
        <p style="color:var(--text-color); font-size: 13px; line-height: 1.5; margin-top: 20px; font-style: italic;">
            "${biomeData.description}"
        </p>
    `;

    // 2. Build the Actions Menu
    let btnHtml = ``;

    // Quick Action: Surface Scan
    btnHtml += `<button class="action-button" onclick="if(typeof conductSurfaceScan === 'function') conductSurfaceScan()">CONDUCT SURFACE SCAN</button>`;
    
    // Quick Action: Orbital Drill
    btnHtml += `<button class="action-button" onclick="if(typeof startOrbitalMining === 'function') startOrbitalMining()">ORBITAL EXTRACTION</button>`;

    // --- THE FIX: Routing to the proper Planet View ---
    if (biomeData && biomeData.landable) {
        btnHtml += `<button class="action-button" onclick="landOnStandalonePlanet()" style="border-color: var(--success); color: var(--success); margin-top: 10px;">DESCEND TO SURFACE</button>`;
    } else {
        btnHtml += `<button class="action-button" disabled style="margin-top: 10px; border-color:#444; color:#666;">UNINHABITABLE (CANNOT LAND)</button>`;
    }

    // --- COLONY BUILDER HOOK ---
    if (typeof playerHasColonyCharter !== 'undefined' && playerHasColonyCharter && (!playerColony || !playerColony.established)) {
        if (biomeData && biomeData.landable) {
            btnHtml += `
                <button class="action-button" onclick="surveyForColony('${location.name}', '${biomeId}', ${playerX}, ${playerY})" style="border-color: var(--gold-text); color: var(--gold-text); margin-top: 15px;">
                    🚩 SURVEY FOR SETTLEMENT
                </button>
            `;
        }
    } else if (isColonyHere) {
        btnHtml += `
            <button class="action-button" onclick="if(typeof openColonyManagement === 'function') openColonyManagement()" style="border-color: var(--success); color: var(--success); margin-top: 15px; box-shadow: 0 0 10px rgba(0, 170, 170, 0.4);">
                🏢 MANAGE COLONY
            </button>
        `;
    }

    btnHtml += `
        <button class="action-button" onclick="closeGenericModal()" style="margin-top: 10px;">
            LEAVE ORBIT
        </button>
    `;

    actionsEl.innerHTML = btnHtml;
}

// --- STANDALONE PLANET ROUTING ---
function landOnStandalonePlanet() {
    closeGenericModal();
    
    const location = chunkManager.getTile(playerX, playerY);
    if (!location) return;

    const biomeId = location.biome || 'BARREN_ROCK';
    
    // Fetch any saved data so rocks don't infinitely respawn if you leave and come back
    const sysKey = `${playerX},${playerY}_p0`;
    const savedState = worldStateDeltas[sysKey] || {};

    // Generate a temporary 1-planet system in memory
    currentSystemData = {
        name: location.name || "Deep Space Rogue Planet",
        x: playerX,
        y: playerY,
        planets: [{
            name: "Surface",
            biome: PLANET_BIOMES[biomeId] || PLANET_BIOMES['BARREN_ROCK'],
            id: `${playerX},${playerY}-0`,
            minedThisVisit: savedState.mined || false,
            scannedThisVisit: savedState.scanned || false
        }]
    };

    // Lock onto the only planet in the array
    selectedPlanetIndex = 0;
    
    logMessage(`Initiating landing sequence for ${location.name || 'the planet'}...`);
    
    // Push the UI into the planetary exploration screen!
    changeGameState(GAME_STATES.PLANET_VIEW);
}

// --- PLANETARY MECHANICS ---

function conductSurfaceScan() {
    const location = chunkManager.getTile(playerX, playerY);
    if (!location) return;
    
    // Play a nice radar ping if sound is enabled
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate(); 
    
    let scanText = "Surface consists of barren rock and trace atmosphere. ";
    
    // Add some flavor text based on the planet's generated name
    if (location.name.includes("Prime") || location.name.includes("Alpha")) scanText = "Highly dense core detected. Magnetic fields are erratic. ";
    if (location.name.includes("Tartarus") || location.name.includes("Volcan")) scanText = "Extreme geothermal activity. High probability of rare metals. ";
    
    // Check our new depletion flag
    if (location.miningDepleted) {
        scanText += "<br><span style='color:var(--danger); font-weight:bold;'>Geological survey: Depleted.</span>";
    } else {
        scanText += "<br><span style='color:var(--success); font-weight:bold;'>Geological survey: Viable ore veins detected.</span>";
    }

    // Inject the scan results directly into the designated container
    const scanBox = document.getElementById('surfaceScanResultBox');
    if (scanBox) {
        scanBox.innerHTML = `
            <div style="margin-top: 15px; padding: 10px; border-left: 3px solid #00E0E0; background: rgba(0, 224, 224, 0.1); font-size: 12px; color: var(--text-color); animation: fadeIn 0.5s;">
                <div style="color: #00E0E0; font-weight: bold; margin-bottom: 5px;">SCAN RESULTS:</div>
                ${scanText}
            </div>
        `;
    }
}

function renderPlanetView() {
     const planetView = document.getElementById('planetView');
     const planet = currentSystemData.planets[selectedPlanetIndex];

     // Logic checks for buttons
     const bioResources = planet.biome.resources.filter(r => BIOLOGICAL_RESOURCES.has(r));
     const mineralResources = planet.biome.resources.filter(r => !BIOLOGICAL_RESOURCES.has(r));

     const canMine = planet.biome.landable && mineralResources.length > 0;
     const mineButtonState = canMine ? '' : 'disabled';
     const mineLabel = canMine ? 'Mine Minerals' : 'No Minerals Detected';

     const canScan = planet.biome.landable && bioResources.length > 0;
     const scanButtonState = canScan ? '' : 'disabled';
     const scanLabel = canScan ? 'Scan Lifeforms' : 'No Bio-Signs';

     // Check if player has at least 1 drone
     const hasDrone = (playerCargo.MINING_DRONE || 0) > 0;
     const surveyButtonState = hasDrone ? '' : 'disabled';
     const surveyLabel = hasDrone ? 'Launch Geo-Survey' : 'Geo-Survey <br><span style="font-size:10px; opacity:0.7">(Requires Drone)</span>';
     
     // Clean HTML Structure
     let html = `
        <div class="planet-view-content">
            <div class="planet-actions-grid">
                <button class="action-button" onclick="minePlanet()" ${mineButtonState}>
                    ${mineLabel}
                </button>
                
                <button class="action-button" onclick="scanPlanetForLife()" ${scanButtonState}>
                    ${scanLabel}
                </button>
                
                <button class="action-button" disabled>
                    Establish Colony <br><span style="font-size:10px; opacity:0.7">(Coming Soon)</span>
                </button>
                
                <button class="action-button" onclick="performGeoSurvey()" ${surveyButtonState}>
                    ${surveyLabel}
                </button>

                <button class="action-button full-width-btn" onclick="returnToOrbit()">
                    &lt;&lt; Return to Orbit
                </button>
            </div>
        </div>
    `;

     planetView.innerHTML = html;
     renderUIStats();
 }

 function startOrbitalMining() {
    const location = chunkManager.getTile(playerX, playerY);
    if (!location || location.miningDepleted) return;

    // --- THE FIX: Use the engine's master global capacity ---
    // Prevent mining if the hold is completely full
    if (typeof currentCargoLoad === 'undefined') window.currentCargoLoad = 0; 
    if (currentCargoLoad >= PLAYER_CARGO_CAPACITY) {
        showToast("Cargo hold is full! Cannot extract ore.", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    // 2. Play Audio FX (Laser firing, then metallic mining sound)
    if (typeof soundManager !== 'undefined') {
        soundManager.playLaser(); 
        setTimeout(() => soundManager.playMining(), 400); 
    }

    // 3. Calculate Loot Table (RNG dictates rarity)
    const roll = Math.random();
    let itemId = "MINERALS"; // Default fallback
    let amount = Math.floor(Math.random() * 5) + 5; // Yields 5 to 9 units

    // Pull from your actual items.js database!
    if (roll > 0.95) { itemId = "VOID_CRYSTALS"; amount = 1; }
    else if (roll > 0.75) { itemId = "RARE_METALS"; amount = Math.floor(Math.random() * 3) + 2; }
    else if (roll > 0.50) { itemId = "PLATINUM_ORE"; amount = Math.floor(Math.random() * 4) + 1; }

    // --- Cap the extracted amount against the global capacity ---
    if (currentCargoLoad + amount > PLAYER_CARGO_CAPACITY) {
        amount = PLAYER_CARGO_CAPACITY - currentCargoLoad;
    }

    // 4. Add items to Inventory
    if (!window.playerCargo) window.playerCargo = {};
    playerCargo[itemId] = (playerCargo[itemId] || 0) + amount;
    
    // --- THE FIX: Trigger the Event Bus so the UI updates flawlessly ---
    if (typeof updateCurrentCargoLoad === 'function') {
        updateCurrentCargoLoad();
    } else {
        currentCargoLoad += amount; // Safety fallback
    }

    // 5. Deplete the planet & grant XP
    location.miningDepleted = true;
    playerXP += 35;
    if (typeof checkLevelUp === 'function') checkLevelUp();

    // 6. Update all UI elements
    logMessage(`Deployed Orbital Extractor. <span style="color:var(--gold-text)">+${amount} ${COMMODITIES[itemId].name}</span> secured.`, true);
    showToast(`Mined ${amount} ${COMMODITIES[itemId].name}`, "success");
    
    if (typeof renderUIStats === 'function') renderUIStats();
    
    // Refresh the planet view so the button instantly turns gray
    if (typeof openPlanetView === 'function') openPlanetView(location);
    if (typeof saveGame === 'function') saveGame(); // Lock in the loot!
}

 /**
  * Handles the logic for mining mineral resources on a planet's surface.
  */

 function minePlanet() {
    // 1. Validation: Ensure we are in the correct view
    if (currentGameState !== GAME_STATES.PLANET_VIEW) return;

    // 2. Target the specific planet we are currently landed on
    const planet = currentSystemData.planets[selectedPlanetIndex];

    // 3. Check if already mined
    if (planet.minedThisVisit) {
        logMessage("Mineral deposits in this landing zone are depleted.");
        showToast("ZONE DEPLETED", "error");
        return;
    }

    // 4. Filter for Minerals (Ignore Biology)
    // We assume BIOLOGICAL_RESOURCES is available globally from your biomes.js
    const mineralResources = planet.biome.resources.filter(r => !BIOLOGICAL_RESOURCES.has(r));

    if (mineralResources.length === 0) {
        logMessage("No mineable mineral deposits detected.");
        return;
    }

    // 5. Check Cargo Space
    // We check if we have space for at least a small yield
    const potentialYield = 5;
    if (currentCargoLoad + potentialYield > PLAYER_CARGO_CAPACITY) {
        logMessage("Mining operation failed: Not enough cargo space.");
        showToast("CARGO FULL", "error");
        return;
    }

    let minedResourcesMessage = "Mining Report:";
    let minedSomething = false;
    let spaceLeft = true;
    
    // Initialize the Toast HTML (This was the cause of the crash in the original bug!)
    let toastHTML = "<span style='font-weight:bold; color:var(--accent-color);'>MINING SUCCESSFUL</span><br>";

    // 6. Iterate through resources
    mineralResources.forEach(resourceId => {
        if (!spaceLeft) return;

        // Yield calculation: 5 to 15 units
        const yieldAmount = 5 + Math.floor(Math.random() * 11);

        const availableSpace = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        const actualYield = Math.min(yieldAmount, availableSpace);

        if (actualYield > 0) {
            playerCargo[resourceId] = (playerCargo[resourceId] || 0) + actualYield;
            updateCurrentCargoLoad();
            
            // Log & Toast Updates
            const resName = COMMODITIES[resourceId].name;
            minedResourcesMessage += `\n  +${formatNumber(actualYield)} ${resName}`;
            toastHTML += `+${formatNumber(actualYield)} ${resName}<br>`;
            
            minedSomething = true;
            if (actualYield < yieldAmount) {
                 minedResourcesMessage += ` (Hold full)`;
                 spaceLeft = false; // Stop further loop iterations
            }
        } else {
            minedResourcesMessage += `\n  (Cargo full, could not collect ${COMMODITIES[resourceId].name})`;
            spaceLeft = false;
        }
    });

    if (minedSomething) {
        // Play Sound & Haptic
        if (typeof soundManager !== 'undefined') soundManager.playMining();
        if (typeof triggerHaptic === 'function') triggerHaptic(50);
        
        // XP Reward (Double that of asteroids)
        const xpGain = XP_PER_MINING_OP * 2;
        playerXP += xpGain;
        minedResourcesMessage += `\n  +${formatNumber(xpGain)} XP`;
        
        logMessage(minedResourcesMessage);
        showToast(toastHTML, "success");
        
         // 1. Update local object so UI updates instantly
        planet.minedThisVisit = true;

        // 2. Save to World State Deltas so it persists across saves
        // We create a unique key: "SystemX,SystemY_PlanetIndex"
        const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
        
        // We reuse the global worldStateDeltas object
        if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
        worldStateDeltas[sysKey].mined = true;
        worldStateDeltas[sysKey].lastInteraction = currentGameDate;
        
        // Advance time slightly
        advanceGameTime(0.15);
        checkLevelUp();
    } else {
        logMessage("Mining operations yielded no usable resources.");
        showToast("No Yield", "error");
    }

    // Refresh UI
    renderUIStats();
    // We do NOT call handleInteraction() here, because that would print the 
    // generic "You are on a planet" text over our nice mining report.
}

 function scoopHydrogen() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot scoop fuel now.");
         return;
     }

     const cT = chunkManager.getTile(playerX, playerY);
     const tileType = getTileType(cT);

     if (tileType !== 'star' && tileType !== 'nebula') {
         logMessage("No star or nebula here to scoop from.");
         return;
     }

     if (playerFuel >= MAX_FUEL) {
         logMessage("Fuel tanks full!");
         showToast("TANKS FULL", "info");
         return;
     }

     let fuelGained = 0;
     let logMsg = "";
     let timePassed = 0.05;

     if (tileType === 'star') {
         if (cT.scoopedThisVisit) {
             logMessage("This star's corona has been depleted for this visit.");
             showToast("CORONA DEPLETED", "error");
             return;
         }

         // Pull the exact yield from the Star Class data!
         const starData = generateStarData(playerX, playerY);
         fuelGained = starData.scoopYield;
         
         if (typeof hasCrewPerk === 'function' && hasCrewPerk('SCOOP_BONUS')) {
             fuelGained = Math.floor(fuelGained * 1.20); 
         }

         updateWorldState(playerX, playerY, { scoopedThisVisit: true, lastInteraction: currentGameDate });
         logMsg = `Initiated Deep Scoop on ${starData.class}-Class Star.`;

         // Radiation check for hot stars!
         if (starData.class === "O" || starData.class === "B") {
            const util = COMPONENTS_DATABASE[playerShip.components.utility || "UTIL_NONE"];
            if (!util || !util.radImmunity) {
                GameBus.emit('HULL_DAMAGED', { amount: 20, reason: "Melted in stellar corona" });
                logMessage("<span style='color:var(--danger);'>Radiation shielding breached! Hull integrity compromised while scooping.</span>");
            }
         }

     } else if (tileType === 'nebula') {
         fuelGained = Math.floor(MIN_SCOOP_YIELD / 2) + Math.floor(Math.random() * SCOOP_RANDOM_BONUS);
         if (hasCrewPerk('SCOOP_BONUS')) {
             fuelGained = Math.floor(fuelGained * 1.20); 
         }
         fuelGained = Math.max(1, fuelGained);
         logMsg = "Siphoned trace hydrogen from the gas cloud.";
         timePassed = 0.02;
     }

     const originalFuel = playerFuel;
     
     // Add fuel, then multiply by 10, round, and divide by 10 to keep 1 decimal place clean.
     let newFuel = playerFuel + fuelGained;
     newFuel = Math.min(MAX_FUEL, newFuel);
     playerFuel = Math.round(newFuel * 10) / 10; 

     const actualGained = playerFuel - originalFuel;

     // Use a small epsilon for float comparison just in case, though the rounding above solves 99%
     if (actualGained > 0.01) {
         advanceGameTime(timePassed);
         logMessage(`${logMsg}\nGained ${actualGained.toFixed(1)} fuel.\nFuel: ${playerFuel.toFixed(1)}/${MAX_FUEL.toFixed(1)}`);
         showToast(`FUEL SCOOPED<br>+${actualGained.toFixed(1)} Units`, "success");
     } else {
         logMessage("Scooping yielded no fuel. Tanks are full.");
     }
 }

 function mineAsteroid() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot mine now.");
         return;
     }

     const asteroid = chunkManager.getTile(playerX, playerY);

     if (getTileType(asteroid) !== 'asteroid') {
         logMessage("No asteroid field here to mine.");
         return;
     }
     if (asteroid.minedThisVisit) {
         logMessage("This asteroid field has been depleted for this visit.");
         showToast("ASTEROID DEPLETED", "error"); // Toast for empty rock
         return;
     }

     // Distance Scaling
     const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));
     const richnessMultiplier = 1 + (distanceFromCenter / 1000);

     let minedResourcesMessage = "Mining operation yields:\n";
     let minedSomething = false;
     let gainedRareXP = false;
     
     // TOAST DATA ACCUMULATOR
     let toastHTML = "<strong>MINING OPERATIONS</strong><br>";

     // Apply Scaling to Yield
     const density = asteroid.density || 0.5;
     const baseYield = 5 + Math.floor(Math.random() * 15 * density);
     
     let yieldAmount = Math.floor(baseYield * richnessMultiplier);

     if (Math.random() < 0.10) {
            yieldAmount *= 2;
            toastHTML += `<span style="color:var(--accent-color); font-weight:900;">CRITICAL VEIN STRUCK!</span><br>`;
            if (typeof soundManager !== 'undefined') setTimeout(() => soundManager.playGain(), 200);
        }

        // --- PERK HOOK ---
        if (playerPerks.has('DEEP_CORE_MINING')) {
            yieldAmount += 3;
            // visual flare logic can go here
        }

     if (yieldAmount > 0) {
         const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
         const actualYield = Math.min(yieldAmount, spaceLeft);

         if (actualYield > 0) {
             playerCargo.MINERALS = (playerCargo.MINERALS || 0) + actualYield;
             updateCurrentCargoLoad();
             minedResourcesMessage += ` ${formatNumber(actualYield)} Minerals`;
             toastHTML += `+${formatNumber(actualYield)} Minerals<br>`;
             
             if (richnessMultiplier > 1.2) minedResourcesMessage += " (Rich Vein!)";
             if (actualYield < yieldAmount) minedResourcesMessage += " (Hold full, left remainder)";
             minedResourcesMessage += "\n";
             minedSomething = true;
         } else {
             minedResourcesMessage += ` Not enough cargo space for Minerals.\n`;
             showToast("CARGO FULL: Minerals Discarded", "error");
         }
     }

     // Increase Rare Chance in Deep Space
     const baseRareChance = 0.05;
     const bonusFromDensity = density * 0.1;
     const deepSpaceBonus = Math.min(0.2, distanceFromCenter / 5000);

     if (Math.random() < (baseRareChance + bonusFromDensity + deepSpaceBonus)) {
         const rareYield = 1 + Math.floor(Math.random() * 2);

         const rareSpaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
         const actualRareYield = Math.min(rareYield, rareSpaceLeft);

         if (actualRareYield > 0) {
             const resourceId = (Math.random() < 0.7) ? "RARE_METALS" : "PLATINUM_ORE";
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + actualRareYield;
             updateCurrentCargoLoad();
             
             const rareName = COMMODITIES[resourceId].name;
             minedResourcesMessage += `<span style='color:#FFFF99;'>+ ${actualRareYield} ${rareName}!</span>\n`;
             toastHTML += `<span style="color:#FFFF00">+${actualRareYield} ${rareName}</span><br>`; 
             
             playerXP += XP_BONUS_RARE_MINERAL;
             gainedRareXP = true;
             minedSomething = true;
         } else {
             minedResourcesMessage += ` Not enough cargo space for rare materials.\n`;
         }
     }

     if (minedSomething) {
         // --- HAPTIC FEEDBACK: SUCCESS ---
         triggerHaptic(50); 

         playerXP += XP_PER_MINING_OP;
         spawnParticles(playerX, playerY, 'mining'); 
         minedResourcesMessage += `\n+${XP_PER_MINING_OP} XP.`;
         
         if (gainedRareXP) {
             minedResourcesMessage += ` +${XP_BONUS_RARE_MINERAL} XP (Rare Find)!`;
         }
         checkLevelUp();
         
         // FIRE THE TOAST!
         showToast(toastHTML, "success");
         
     } else {
         minedResourcesMessage = "Mining yielded nothing of value this attempt.";
     }

     advanceGameTime(0.1);
     updateWorldState(playerX, playerY, { minedThisVisit: true, lastInteraction: currentGameDate });
     logMessage(minedResourcesMessage);
 }

 /**
  * Handles the logic for scanning a planet for biological lifeforms and samples.
  */

 function scanPlanetForLife() {
     if (currentGameState !== GAME_STATES.PLANET_VIEW) return;
     const planet = currentSystemData.planets[selectedPlanetIndex];

     // NEW: Filter for *only* biological resources
     const bioResources = planet.biome.resources.filter(r => BIOLOGICAL_RESOURCES.has(r));

     if (bioResources.length === 0) {
         logMessage("No viable biological signatures detected.");
         return;
     }

     // Check for cargo space
     if (currentCargoLoad + 1 > PLAYER_CARGO_CAPACITY) { // Check for at least 1 unit
         logMessage("Scan complete, but no cargo space to store samples.");
         return;
     }

     let scanMessage = "Biological scan yields:\n";
     let foundSomething = false;
     let spaceLeft = true;

     bioResources.forEach(resourceId => {
         if (!spaceLeft) return;
         const yieldAmount = 1 + Math.floor(Math.random() * 5); // 1-5 units (bio scans are more precise)

         const availableSpace = PLAYER_CARGO_CAPACITY - currentCargoLoad;
         const actualYield = Math.min(yieldAmount, availableSpace);

         if (actualYield > 0) {
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + actualYield;
             updateCurrentCargoLoad();
             scanMessage += ` ${actualYield} ${COMMODITIES[resourceId].name}\n`;
             foundSomething = true;
             
             if (actualYield < yieldAmount) {
                 scanMessage += ` (Hold full, remainder left behind)\n`;
                 spaceLeft = false; 
             }
         } else {
             scanMessage += ` Not enough cargo space for ${COMMODITIES[resourceId].name}.\n`;
             spaceLeft = false;
         }
     });

     if (foundSomething) {
        let xpGained = XP_PER_MINING_OP;
    
        // --- PERK HOOK ---
        if (playerPerks.has('XENO_BIOLOGIST')) {
            xpGained *= 2; // Double XP
        }
         playerXP += xpGained;
         scanMessage += `\n+${xpGained} XP.`;
         advanceGameTime(0.10); // Scanning takes a bit of time
         checkLevelUp();
        
         planet.scannedThisVisit = true;
        
        const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
        if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
        worldStateDeltas[sysKey].scanned = true;
     } else if (!spaceLeft) {
         // Already logged "no cargo space"
     } else {
         scanMessage = "Scan complete. No viable samples could be collected.";
     }

     logMessage(scanMessage);
     renderUIStats();
 }


 function performGeoSurvey() {
     // 1. Validation
     if (currentGameState !== GAME_STATES.PLANET_VIEW) return;
     if ((playerCargo.MINING_DRONE || 0) < 1) {
         logMessage("Launch failed: No Survey Drones in cargo.");
         return;
     }
     
     // 2. Consume Drone
     playerCargo.MINING_DRONE = (playerCargo.MINING_DRONE || 0) - 1;
     // Safety cleanup (optional but good practice)
     if (playerCargo.MINING_DRONE <= 0) delete playerCargo.MINING_DRONE;
     updateCurrentCargoLoad();

     // 3. Calculate Reward
     // Surveying always yields data, and sometimes finds raw resources too.
     const xpGain = 45;
     playerXP += xpGain;
     
     let surveyMsg = "Drone deployed. Telemetry received.\n";
     surveyMsg += `<span style='color:#00FF00'>+${xpGain} XP.</span>\n`;
     
     // Reward 1: Planetary Data (The main goal)
     if (currentCargoLoad + 1 <= PLAYER_CARGO_CAPACITY) {
         playerCargo.PLANETARY_DATA = (playerCargo.PLANETARY_DATA || 0) + 1;
         surveyMsg += "Acquired: 1x Planetary Data cartridge.\n";
         updateCurrentCargoLoad();
     } else {
         surveyMsg += "Sensors recorded data, but cargo hold is full! Data disk ejected.\n";
     }

     // Reward 2: Random Bonus (20% chance for extra minerals)
     if (Math.random() < 0.20) {
         const bonusAmt = Math.floor(Math.random() * 5) + 2;
         if (currentCargoLoad + bonusAmt <= PLAYER_CARGO_CAPACITY) {
             playerCargo.RARE_METALS = (playerCargo.RARE_METALS || 0) + bonusAmt;
             surveyMsg += `<span style='color:#FFFF00'>Bonus: Drone recovered ${bonusAmt}x Rare Metals!</span>`;
             updateCurrentCargoLoad();
         }
     }

     checkLevelUp();
     logMessage(surveyMsg);
     renderPlanetView(); // Re-render to update drone count button
 }

// ==========================================
// --- ASTEROID MINING MINI-GAME ---
// ==========================================

function startMiningMiniGame() {
    openGenericModal("ASTEROID MINING");
    
    // Randomize the sweet spot size and location based on player perks (if any)
    let baseWidth = 15;
    if (hasCrewPerk('ASTROMETRICS')) baseWidth += 10; // Scientists make mining easier!
    
    const spotWidth = Math.floor(Math.random() * 10) + baseWidth; // 15% to 25% width
    const spotStart = Math.floor(Math.random() * (100 - spotWidth));
    miningSweetSpot = { start: spotStart, end: spotStart + spotWidth };

    miningPos = 0;
    miningDir = 1;

    renderMiningUI();

    clearInterval(miningInterval);
    // The cursor moves back and forth. Faster = harder!
    miningInterval = setInterval(() => {
        miningPos += miningDir * 4; 
        if (miningPos >= 100) { miningPos = 100; miningDir = -1; }
        if (miningPos <= 0) { miningPos = 0; miningDir = 1; }
        
        const cursor = document.getElementById('miningCursor');
        if (cursor) cursor.style.left = `${miningPos}%`;
    }, 40);
}

function renderMiningUI() {
    const detailEl = document.getElementById('genericDetailContent');
    const listEl = document.getElementById('genericModalList');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `
        <div style="padding: 20px; text-align:center;">
            <div style="font-size: 60px; margin-bottom: 10px; color: #FFAA66;">🌑</div>
            <h3 style="color:var(--warning); margin-bottom: 5px;">DENSE ASTEROID</h3>
            <p style="color:var(--item-desc-color); font-size:12px;">High-yield minerals detected. Align the mining laser phase to extract without overloading the rock's structural integrity.</p>
        </div>
    `;

    detailEl.innerHTML = `
        <div style="padding: 40px 20px; text-align:center;">
            <h4 style="color:var(--text-color); margin-bottom: 30px; letter-spacing: 2px;">LASER PHASE ALIGNMENT</h4>
            
            <div style="width: 100%; height: 40px; background: #111; border: 2px solid var(--border-color); position: relative; border-radius: 4px; overflow: hidden; box-shadow: inset 0 0 10px #000;">
                
                <div style="position: absolute; left: ${miningSweetSpot.start}%; width: ${miningSweetSpot.end - miningSweetSpot.start}%; height: 100%; background: rgba(0, 255, 0, 0.2); border-left: 2px solid var(--success); border-right: 2px solid var(--success);"></div>
                
                <div id="miningCursor" style="position: absolute; left: 0%; top: -5px; width: 6px; height: 50px; background: var(--danger); box-shadow: 0 0 15px var(--danger); border-radius: 3px; z-index: 10;"></div>
            </div>
            
            <p style="color:var(--item-desc-color); font-size:11px; margin-top:20px; font-style:italic;">Hit [EXTRACT] when the laser aligns with the green structural fault line.</p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button danger-btn" onclick="attemptExtraction()" style="font-weight:bold; font-size: 16px;">🔥 FIRE LASER (EXTRACT) 🔥</button>
        <button class="action-button" onclick="cancelMining()">ABORT</button>
    `;
}

function attemptExtraction() {
    clearInterval(miningInterval); // Stop the cursor!
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Did they hit the sweet spot?
    if (miningPos >= miningSweetSpot.start && miningPos <= miningSweetSpot.end) {
        // ==========================================
        // --- SUCCESS: ADVANCED LOOT SIMULATION ---
        // ==========================================
        
        // 1. Calculate Distance & Scaling
        const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));
        const richnessMultiplier = 1 + (distanceFromCenter / 1000);
        const tile = chunkManager.getTile(playerX, playerY);
        const density = tile && tile.density ? tile.density : 0.5;

        // 2. Base Yield & Perks
        let baseYield = 5 + Math.floor(Math.random() * 15 * density);
        let yieldAmount = Math.floor(baseYield * richnessMultiplier);

        let isCritical = false;
        if (Math.random() < 0.10) {
            yieldAmount *= 2;
            isCritical = true;
        }

        // --- PERK HOOK ---
        if (typeof playerPerks !== 'undefined' && playerPerks.has('DEEP_CORE_MINING')) {
            yieldAmount += 3;
        }

        // 3. Cargo Check (Standard Minerals)
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        let spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        let actualYield = Math.min(yieldAmount, spaceLeft);
        
        let lootMessage = "";
        let toastHTML = "<strong>MINING OPERATIONS</strong><br>";
        
        if (actualYield > 0) {
            playerCargo.MINERALS = (playerCargo.MINERALS || 0) + actualYield;
            lootMessage += `Extracted ${formatNumber(actualYield)} Minerals.<br>`;
            toastHTML += `+${formatNumber(actualYield)} Minerals<br>`;
            if (isCritical) toastHTML += `<span style="color:var(--accent-color); font-weight:900;">CRITICAL VEIN STRUCK!</span><br>`;
            
            // Increment local tracker so rare drops know how much space is left
            currentCargoLoad += actualYield; 
        } else {
            lootMessage += `<span style="color:var(--danger)">Cargo full. Minerals discarded.</span><br>`;
        }

        // 4. Rare Drops (Rare Metals / Platinum)
        const baseRareChance = 0.05;
        const bonusFromDensity = density * 0.1;
        const deepSpaceBonus = Math.min(0.2, distanceFromCenter / 5000);
        
        let rareLootHtml = "";
        let rareXP = 0;

        if (Math.random() < (baseRareChance + bonusFromDensity + deepSpaceBonus)) {
            const rareYield = 1 + Math.floor(Math.random() * 2);
            spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
            const actualRareYield = Math.min(rareYield, spaceLeft);

            if (actualRareYield > 0) {
                const resourceId = (Math.random() < 0.7) ? "RARE_METALS" : "PLATINUM_ORE";
                playerCargo[resourceId] = (playerCargo[resourceId] || 0) + actualRareYield;
                
                const rareName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[resourceId]) ? COMMODITIES[resourceId].name : resourceId.replace('_', ' ');
                
                rareLootHtml = `<div style="color:var(--gold-text); font-weight:bold; margin-top:10px; text-shadow: 0 0 10px rgba(255,215,0,0.5);">+${actualRareYield} ${rareName} (RARE)</div>`;
                toastHTML += `<span style="color:#FFFF00">+${actualRareYield} ${rareName}</span><br>`; 
                
                rareXP = typeof XP_BONUS_RARE_MINERAL !== 'undefined' ? XP_BONUS_RARE_MINERAL : 25;
            }
        }

        // 5. XP & State Updates
        const baseXP = typeof XP_PER_MINING_OP !== 'undefined' ? XP_PER_MINING_OP : 15;
        const totalXP = baseXP + rareXP;
        if (typeof playerXP !== 'undefined') playerXP += totalXP;
        
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

        // 6. Game Engine Juice (Sound, Haptics, Particles, Toasts)
        if (typeof soundManager !== 'undefined') {
            if (isCritical) setTimeout(() => soundManager.playGain(), 200);
            else soundManager.playBuy();
        }
        if (typeof triggerHaptic === 'function') triggerHaptic(50);
        if (typeof spawnParticles === 'function') spawnParticles(playerX, playerY, 'mining'); 
        if (typeof showToast === 'function') showToast(toastHTML, "success");
        
        // 7. Time & World State
        if (typeof advanceGameTime === 'function') advanceGameTime(0.1);
        if (typeof updateWorldState === 'function') {
            updateWorldState(playerX, playerY, { minedThisVisit: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
        } else if (tile) {
            tile.mined = true; // Fallback
            tile.minedThisVisit = true;
        }

        // 8. Render the Victory UI
        detailEl.innerHTML = `
            <div style="padding: 40px 20px; text-align:center;">
                <div style="font-size: 50px; margin-bottom: 10px;">💎</div>
                <h3 style="color:var(--success); margin-bottom: 10px;">EXTRACTION SUCCESSFUL</h3>
                <p style="color:var(--item-desc-color); font-size: 13px;">${lootMessage}</p>
                ${rareLootHtml}
                <div style="color:var(--accent-color); font-weight:bold; font-size:16px; margin-top:15px;">+${totalXP} XP</div>
            </div>
        `;
        
    } else {
        // ==========================================
        // --- FAILURE: LASER OVERLOAD ---
        // ==========================================
        const damage = Math.floor(Math.random() * 20) + 10;
        playerHull -= damage;
        
        if (typeof soundManager !== 'undefined' && soundManager.playExplosion) soundManager.playExplosion();
        if (typeof triggerHaptic === 'function') triggerHaptic([100, 50, 100]); // Heavier failure haptic

        detailEl.innerHTML = `
            <div style="padding: 40px 20px; text-align:center;">
                <div style="font-size: 50px; margin-bottom: 10px;">💥</div>
                <h3 style="color:var(--danger); margin-bottom: 10px;">LASER OVERLOAD</h3>
                <p style="color:var(--item-desc-color);">The phase misalignment caused a localized thermal explosion. Shrapnel struck your hull!</p>
                <div style="color:var(--danger); font-weight:bold; font-size:20px; margin-top:15px; text-shadow: 0 0 10px rgba(255,85,85,0.5);">-${damage} HULL DAMAGE</div>
            </div>
        `;
        
        if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
        if (typeof advanceGameTime === 'function') advanceGameTime(0.1); // Time passes even if you fail!
        
        // Check if the explosion killed them
        if (playerHull <= 0) {
            setTimeout(() => { if (typeof triggerGameOver === 'function') triggerGameOver("Destroyed by a mining accident"); }, 1500);
        }
    }

    actionsEl.innerHTML = `
        <button class="action-button" onclick="cancelMining()">CLOSE</button>
    `;
    
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof checkLevelUp === 'function') checkLevelUp();
}

function cancelMining() {
    clearInterval(miningInterval);
    closeGenericModal();
}

function scanLocation() {
    // 1. Prevent scanning if another menu or combat is active
    if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
        logMessage("Cannot scan now.");
        return;
    }
    
    advanceGameTime(0.05); 
    const scanner = COMPONENTS_DATABASE[playerShip.components.scanner];
    const scanBonus = scanner.stats.scanBonus || 0;
    const tileObject = chunkManager.getTile(playerX, playerY);
    
    // Play sensor sweep sound
    if (typeof soundManager !== 'undefined' && soundManager.playScan) {
        soundManager.playScan();
    }

    // 2. Setup default fallback data (for empty space)
    let targetName = "DEEP SPACE";
    let targetImage = "assets/planet_placeholder.png"; // Ensure you have a generic image or it will use the fallback
    let threatLevel = "LOW";
    let flavorText = "Sensors detect nothing but the cosmic background radiation.";
    let faction = getFactionAt(playerX, playerY);
    
    // 3. Determine what we are scanning and pull its specific data
    if (tileObject && tileObject.type === 'location') {
        targetName = tileObject.name;
        
        // This handles both simple strings AND the detailed object approach we discussed
        if (typeof tileObject.scanFlavor === 'object') {
            flavorText = `
                <strong>Atmosphere:</strong> ${tileObject.scanFlavor.atmosphere || 'Unknown'}<br>
                <strong>Anomalies:</strong> ${tileObject.scanFlavor.notableAnomalies || 'None Detected'}
            `;
            threatLevel = tileObject.scanFlavor.threatLevel || "UNKNOWN";
        } else {
            flavorText = tileObject.scanFlavor || "A stationary structure in deep space. No further data.";
        }
        
        faction = tileObject.faction || faction;
        
        // Assign dynamic images based on the location type
        targetImage = tileObject.isBlackMarket ? "assets/black_market.png" : "assets/concord_market.png";
        if (tileObject.char === OUTPOST_CHAR_VAL) targetImage = "assets/outpost.png";
        
    } else {
        const tileChar = getTileChar(tileObject);
        switch (tileChar) {
            case STAR_CHAR_VAL:
                targetName = "STELLAR BODY";
                flavorText = `Brilliant star. ${tileObject.richness > 0.75 ? "High hydrogen concentrations detected!" : ""}`;
                targetImage = "assets/o_class.png"; // Fallback star image
                threatLevel = "EXTREME (HEAT/RADIATION)";
                break;
            case ASTEROID_CHAR_VAL:
                targetName = "ASTEROID FIELD";
                let densityDesc = (tileObject.density > 0.6) ? "High" : (tileObject.density > 0.3) ? "Moderate" : "Low";
                flavorText = `Asteroid field. Field density is ${densityDesc}. Local nav hazards present.`;
                targetImage = "assets/asteroid.png"; 
                threatLevel = "MODERATE (COLLISION)";
                break;
            case NEBULA_CHAR_VAL:
                targetName = "GAS NEBULA";
                flavorText = "Inside a dense gas cloud. Sensors are intermittent. High concentration of scoopable isotopes.";
                targetImage = "assets/nebula.png";
                threatLevel = "LOW (STATIC)";
                break;
            case ANOMALY_CHAR_VAL:
                targetName = "UNKNOWN ANOMALY";
                flavorText = "Unstable energy readings. Reality seems to warp around this point. Proceed with extreme caution.";
                targetImage = "assets/anomaly.png";
                threatLevel = "UNKNOWN";
                break;
            case DERELICT_CHAR_VAL:
                targetName = "DERELICT VESSEL";
                flavorText = "A ruined ship drifts aimlessly. Life support is offline. Potential salvage opportunity detected.";
                targetImage = "assets/derelict.png";
                threatLevel = "LOW";
                break;
        }
    }

    // 4. Open the UI Modal
    openGenericModal("SENSOR SWEEP RESULTS");
    
    const container = document.getElementById('genericModalContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Wipe any previous modal layouts (like the two-column lists)
    document.getElementById('genericModalList').innerHTML = '';
    document.getElementById('genericDetailContent').innerHTML = '';

    // Reset container styling to allow our Flexbox classes to take over
    container.style.display = 'block';
    container.style.padding = '0';
    
    // 5. Inject the Side-by-Side Flex Layout HTML
    container.innerHTML = `
        <div class="modal-split-layout" style="padding: 20px;">
            
            <div class="modal-left-pane">
                <img src="${targetImage}" alt="Scan Image" onerror="this.src='assets/outpost.png'" style="width: 100%; max-width: 150px; height: auto; aspect-ratio: 1; object-fit: cover; background: rgba(0,0,0,0.5); padding: 10px; border: 1px solid var(--border-color); border-radius: 8px;">
                <div class="sys-meta-row" style="margin-top: 15px; justify-content: center; width: 100%;">
                    <span style="color: ${threatLevel.includes('HIGH') || threatLevel.includes('EXTREME') ? 'var(--danger)' : 'var(--warning)'}; font-weight: bold; text-align: center;">
                        THREAT LEVEL:<br>${threatLevel}
                    </span>
                </div>
            </div>

            <div class="modal-right-pane">
                <h2 class="sys-title-large" style="color: var(--accent-color); margin-bottom: 5px;">${targetName.toUpperCase()}</h2>
                <div style="font-size: 10px; color: #888; letter-spacing: 2px; margin-bottom: 15px; text-transform: uppercase;">
                    FACTION ZONE: ${faction}
                </div>
                
                <div class="scan-data-box" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); padding: 15px; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: var(--text-color); font-size: 12px; border-bottom: 1px solid #333; padding-bottom: 5px;">TACTICAL ASSESSMENT</h4>
                    <p class="sys-flavor-text" style="margin: 0; line-height: 1.6; color: var(--item-desc-color);">${flavorText}</p>
                    
                    ${scanBonus > 0 ? `
                        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed var(--accent-color);">
                            <span style="color: var(--success); font-size: 11px; font-weight: bold;">[+] ENHANCED SENSOR DATA:</span>
                            <p style="font-size: 12px; color: #aaa; margin-top: 5px;">Advanced telemetry processing complete. Sub-surface structural integrity mapped.</p>
                        </div>
                    ` : ''}
                </div>
            </div>

        </div>
    `;

    // 6. Provide the exit button
    actionsEl.innerHTML = `
        <button class="action-button full-width-btn" style="max-width: 300px; margin: 0 auto;" onclick="closeGenericModal()">CLOSE SENSORS</button>
    `;
}


// ==========================================
// --- ASTROPHYSICS: DEEP SCAN UI ---
// ==========================================

function evaluateStar(starData, starId) {
    // 1. Initialize the modal with your standard header
    openGenericModal("STELLAR CARTOGRAPHY");

    // 2. Target the core modal elements
    const container = document.getElementById('genericModalContent');
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // --- LAYOUT ENGINE RESET ---
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '75vh'; 
    container.style.maxHeight = '650px'; // Increased height for more content
    container.style.overflow = 'hidden';

    const panelWrapper = document.createElement('div');
    panelWrapper.style.display = 'flex';
    panelWrapper.style.flexDirection = 'row';
    panelWrapper.style.flex = '1';
    panelWrapper.style.overflow = 'hidden';
    panelWrapper.style.minHeight = '0'; // THE CRITICAL FIX

    container.innerHTML = '';
    container.appendChild(panelWrapper);
    panelWrapper.appendChild(listEl);
    panelWrapper.appendChild(detailEl);
    container.appendChild(actionsEl);

    // Style the panels
    listEl.style.flex = '0 0 40%';
    listEl.style.minHeight = '0'; // Allows Flexbox to trigger scrollbars
    listEl.style.overflowY = 'auto';
    listEl.style.borderRight = '1px solid var(--border-color)';
    listEl.style.padding = '0';

    detailEl.style.flex = '1';
    detailEl.style.minHeight = '0'; // Allows Flexbox to trigger scrollbars
    detailEl.style.overflowY = 'auto';
    detailEl.style.padding = '0 15px';
    detailEl.style.boxSizing = 'border-box';

    // --- LIGHT MODE / CONTRAST DETECTION ---
    let isLight = document.body.classList.contains('light-mode');
    let displayColor = starData.color;
    if (isLight) {
        if (starData.class === "A") displayColor = "#444444";
        else if (starData.class === "F") displayColor = "#999900";
        else if (starData.class === "B") displayColor = "#3355BB";
        else if (starData.class === "O") displayColor = "#0033AA";
    }

    const assetPath = `assets/${starData.class.toLowerCase()}_class.png`;

    // --- LEFT PANEL: SENSOR DATA & H-R DIAGRAM ---
    listEl.innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1);">
            <h4 style="color:var(--accent-color); margin: 0 0 10px 0; letter-spacing: 1px;">[ SENSOR TELEMETRY ]</h4>
            <div style="font-size: 11px; color: var(--success); font-family: 'Roboto Mono', monospace; line-height: 1.6;">
                > SPECTROSCOPY... <span style="float:right;">[OK]</span><br>
                > PHOTOSPHERE... <span style="float:right;">[OK]</span><br>
                > STELLAR MASS... <span style="float:right;">[OK]</span><br>
                > LUMINOSITY... <span style="float:right;">[OK]</span>
            </div>
        </div>
        <div style="padding: 15px;">
            <h4 style="color:var(--text-color); margin: 0 0 10px 0; font-size: 12px; letter-spacing: 1px;">ARCHIVE: MORGAN-KEENAN SYSTEM</h4>
            <p style="font-size: 11px; color: var(--item-desc-color); line-height: 1.6; margin-bottom: 15px;">
                The MK system categorizes stars by temperature and spectrum.
            </p>
            <div style="text-align: center; margin-top: 15px;">
                ${typeof generateHRDiagram === 'function' ? generateHRDiagram(starData.class, displayColor, isLight) : '[DIAGRAM ERROR]'}
                <div style="font-size: 9px; margin-top: 8px; color: var(--item-desc-color); letter-spacing: 1px;">FIG 1: H-R DIAGRAM</div>
            </div>
        </div>
    `;

    // --- XP & DISCOVERY LOGIC ---
    let xpMessage = "";
    const scanKey = `STAR_SCAN_${starId}`;
    if (typeof discoveredLocations !== 'undefined' && !discoveredLocations.has(scanKey)) {
        discoveredLocations.add(scanKey);
        playerXP += 25;
        xpMessage = `<div style="color:var(--success); font-weight:bold; margin: 10px 0; font-size: 11px;">+25 XP (FIRST-SCAN BONUS)</div>`;
        if (typeof checkLevelUp === 'function') checkLevelUp();
        if (typeof showToast === 'function') showToast("STELLAR DATA RECORDED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playScan();
    } else {
        xpMessage = `<div style="color:var(--item-desc-color); font-size: 10px; margin: 10px 0;">DATA PREVIOUSLY RECORDED</div>`;
    }
    
    // --- Generate the new detailed report ---
    const stellarReportHTML = typeof generateStellarReport === 'function' ? generateStellarReport(starData, starId) : "";

    // --- RIGHT PANEL: VISUALS & STATS ---
    detailEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0;">
            <div style="text-align: center;">
                <h3 style="color:${displayColor}; margin: 0; font-size: 20px; text-transform: uppercase;">${starData.designation}</h3>
                <div style="color:var(--accent-color); font-size: 10px; letter-spacing: 2px;">REGION: ${starData.sectorName}</div>
            </div>
            
            <img src="${assetPath}" alt="Star" style="width: 200px; height: 200px; object-fit: contain; filter: drop-shadow(0 0 30px ${displayColor}); animation: starPulse 4s infinite ease-in-out;">
            
            ${xpMessage}
            
            <div style="width: 100%; background: var(--panel-bg); border: 1px solid var(--border-color); padding: 15px; border-radius: 4px; box-sizing: border-box;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block;">TEMPERATURE</span>
                        <div style="font-size:13px; font-weight:bold;">${starData.temp}</div>
                    </div>
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block;">RADIATION</span>
                        <div style="font-size:13px; font-weight:bold; color:${starData.hazard === 'NONE' ? 'var(--success)' : 'var(--danger)'}">${starData.hazard}</div>
                    </div>
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block;">SCOOP YIELD</span>
                        <div style="font-size:13px; font-weight:bold;">${starData.scoopYield} Units</div>
                    </div>
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block;">INCIDENCE</span>
                        <div style="font-size:13px; font-weight:bold;">${(starData.rarity * 100).toFixed(1)}%</div>
                    </div>
                </div>
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 12px 0;">
                <p style="color:var(--item-desc-color); font-style:italic; margin:0; line-height:1.4; font-size: 12px;">"${starData.desc}"</p>
            </div>

            <!-- NEW: Inject the detailed report -->
            ${stellarReportHTML}
        </div>
    `;

    // --- BUTTONS ---
    actionsEl.innerHTML = `
        <button class="action-button" onclick="closeGenericModal()" style="border-color: ${displayColor}; color: ${displayColor}; width: 200px; margin: 10px auto;">
            CLOSE SENSORS
        </button>
    `;
}


function generateStellarReport(starData, starId) {
    // 1. Extract coordinates and peek at the system's actual generated planets
    const [x, y] = starId.split('_').map(Number);
    const system = generateStarSystem(x, y); // Safe to call, it caches the result!
    const planets = system.planets;
    
    // 2. Analyze the system composition
    let hasHabitable = false;
    let hasGasGiant = false;
    let hasCrystals = false;
    
    planets.forEach(p => {
        if (['TERRAN', 'OCEANIC', 'TOXIC'].includes(p.biome.name.toUpperCase().replace(' WORLD', '').replace(' JUNGLE', ''))) hasHabitable = true;
        if (['GAS GIANT', 'ICE GIANT'].includes(p.biome.name.toUpperCase())) hasGasGiant = true;
        if (p.biome.name.toUpperCase().includes('CRYSTAL')) hasCrystals = true;
    });

    // 3. Generate Astrochemistry (Based on Star Class)
    let chemistry = "";
    if (["O", "B"].includes(starData.class)) {
        chemistry = "Heavy ultraviolet output. High metallicity in the corona indicates recent local supernova activity. Trace amounts of exotic heavy elements detected in the stellar wind.";
    } else if (["A", "F", "G"].includes(starData.class)) {
        chemistry = "Stable fusion cycle. Spectral absorption lines show distinct traces of carbon, silicates, and water vapor in the inner system. Optimal conditions for complex molecular synthesis.";
    } else { // K, M
        chemistry = "Deep convective zones churning. High probability of sudden magnetic reconnection events (flares). The local heliosphere is dense with ionized iron and sluggish plasma.";
    }

    // 4. Generate Astrobiology/System (Based on Planets)
    let biology = "";
    if (hasHabitable) {
        biology = "<span style='color:var(--success)'>Positive Biosignatures.</span> Atmospheric spectroscopy of local planetary bodies reveals non-equilibrium oxygen/methane mixtures, strongly indicating active metabolic processes.";
    } else if (hasCrystals) {
        biology = "<span style='color:#FF33FF'>Exotic Lithosphere Detected.</span> Sensors are picking up crystalline resonance patterns. Standard biological models do not apply; potential silicon-based matrices present.";
    } else if (planets.length > 0) {
        if (hasGasGiant) {
            biology = "Massive gravimetric shadows detected (Gas/Ice Giants). The planetary bodies fall outside the habitable Goldilocks zone. Lithospheric analysis shows predominantly sterile, inorganic crusts.";
        } else {
            biology = "Planetary bodies detected, but environmental conditions are harsh. No complex organic compounds or viable biospheres registered on deep-range scans.";
        }
    } else {
        biology = "No distinct planetary accretion detected. The local space is likely swept clean by intense stellar winds or ancient gravitational perturbations.";
    }

    // 5. Construct the UI HTML
    return `
        <h4 style="color:var(--text-color); margin: 0 0 10px 0; font-size: 12px; letter-spacing: 1px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">ASTROCHEMISTRY</h4>
        <p style="font-size: 11px; color: var(--item-desc-color); line-height: 1.6; margin-bottom: 15px;">${chemistry}</p>
        
        <h4 style="color:var(--text-color); margin: 0 0 10px 0; font-size: 12px; letter-spacing: 1px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">SYSTEM & ASTROBIOLOGY</h4>
        <p style="font-size: 11px; color: var(--item-desc-color); line-height: 1.6; margin-bottom: 15px;">
            <span style="color:#888;">Orbital Bodies: ${planets.length}</span><br>
            ${biology}
        </p>
    `;
}

// ==========================================
// --- ASTROPHYSICS: SPECTRAL CLASSES ---
// ==========================================

const SPECTRAL_CLASSES = [
    { class: "O", color: "#99BBFF", name: "Blue Supergiant", temp: "≥ 30,000K", hazard: "SEVERE RADIATION", rarity: 0.02, scoopYield: 150, desc: "A short-lived, fiercely hot colossus emitting massive amounts of ionizing ultraviolet radiation." },
    { class: "B", color: "#BBCCFF", name: "Blue-White Giant", temp: "10,000K - 30,000K", hazard: "HIGH RADIATION", rarity: 0.06, scoopYield: 100, desc: "A highly luminous star with intense stellar winds and dangerous radiation output." },
    { class: "A", color: "#FFFFFF", name: "White Star", temp: "7,500K - 10,000K", hazard: "MODERATE GLARE", rarity: 0.12, scoopYield: 75, desc: "A rapidly rotating, incredibly bright star with strong hydrogen absorption lines." },
    { class: "F", color: "#FFFFDD", name: "Yellow-White Dwarf", temp: "6,000K - 7,500K", hazard: "NONE", rarity: 0.15, scoopYield: 60, desc: "A stable, massive main-sequence star often surrounded by rich planetary systems." },
    { class: "G", color: "#FFDD00", name: "Yellow Dwarf", temp: "5,200K - 6,000K", hazard: "NONE", rarity: 0.20, scoopYield: 50, desc: "A stable, mid-sized star. Conditions in its habitable zone are ideal for terrestrial life." },
    { class: "K", color: "#FFAA00", name: "Orange Dwarf", temp: "3,700K - 5,200K", hazard: "NONE", rarity: 0.20, scoopYield: 40, desc: "A cool, long-lived star. Safe to approach, but stellar winds are sluggish." },
    { class: "M", color: "#FF5555", name: "Red Dwarf", temp: "≤ 3,700K", hazard: "SOLAR FLARES", rarity: 0.25, scoopYield: 25, desc: "The most common star type in the galaxy. Cool, dim, and prone to violent magnetic flares." }
];

function generateStarData(x, y) {
    // 1. Create a pseudo-random seed based strictly on the specific star's coordinates
    const seed = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
    const rand = seed - Math.floor(seed); 

    // 2. Roll against our rarity tables to pick the spectral class
    let cumulative = 0;
    let selectedClass = SPECTRAL_CLASSES[SPECTRAL_CLASSES.length - 1]; // Default to M-Class

    for (let i = 0; i < SPECTRAL_CLASSES.length; i++) {
        cumulative += SPECTRAL_CLASSES[i].rarity;
        if (rand <= cumulative) {
            selectedClass = SPECTRAL_CLASSES[i];
            break;
        }
    }

    // ==========================================
    // --- NATIVE SECTOR-BASED NAMING (FIXED) ---
    // ==========================================

    let actualSectorPrefix = "Uncharted";
    let fullSectorName = "Deep Space";

    if (typeof SECTOR_SIZE !== 'undefined' && typeof generateSectorName === 'function') {
        // Calculate which macro-sector this star belongs to
        const sectorX = Math.floor(x / SECTOR_SIZE);
        const sectorY = Math.floor(y / SECTOR_SIZE);
        
        // Generate the exact same name the Top HUD uses!
        fullSectorName = generateSectorName(sectorX, sectorY);
        
        // Extract just the first word for the prefix (e.g. "Delta Ridge" becomes "Delta")
        actualSectorPrefix = fullSectorName.split(' ')[0];
    }

    // Assign a Greek letter for flavor based on the star's unique seed
    const greekLetters = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Theta", "Sigma", "Omega", "Prime"];
    const greekModifier = greekLetters[Math.floor((seed * 100) % greekLetters.length)];
    
    // Generate the final designation
    const number = Math.floor(rand * 9000) + 1000;

    return {
        // e.g., "DELTA-SIGMA 4192"
        designation: `${actualSectorPrefix.toUpperCase()}-${greekModifier.toUpperCase()} ${number}`,
        sectorName: fullSectorName,
        ...selectedClass
    };
}

// ==========================================
// --- ASTROPHYSICS: DYNAMIC H-R DIAGRAM ---
// ==========================================

function generateHRDiagram(starClass, displayColor, isLight) {
    // We use your native CSS variables so the box perfectly matches your current theme!
    const bg = "var(--bg-color)";
    const gridColor = "var(--border-color)";
    const textColor = "var(--item-desc-color)";
    
    // SVG curves still need a little hardcoded transparency to look good
    const curve1 = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)";
    const curve2 = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
    const crosshair = isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)";

    const classCoords = {
        'O': { x: 15, y: 15 }, 
        'B': { x: 30, y: 30 }, 
        'A': { x: 45, y: 50 }, 
        'F': { x: 60, y: 65 }, 
        'G': { x: 70, y: 75 }, 
        'K': { x: 85, y: 85 }, 
        'M': { x: 95, y: 92 }  
    };
    
    const pos = classCoords[starClass] || { x: 50, y: 50 };
    
    return `
        <div style="position: relative; width: 100%; height: 140px; background: ${bg}; border: 1px solid var(--border-color); overflow: hidden; font-family: 'Roboto Mono', monospace; border-radius: 4px;">
            <div style="position: absolute; bottom: 4px; right: 8px; font-size: 9px; color: ${textColor}; letter-spacing: 1px;">TEMP (K) →</div>
            <div style="position: absolute; top: 8px; left: 8px; font-size: 9px; color: ${textColor}; transform: rotate(-90deg); transform-origin: 0 0; letter-spacing: 1px;">LUMINOSITY</div>
            
            <div style="position: absolute; top: 25%; left: 0; right: 0; border-top: 1px dashed ${gridColor};"></div>
            <div style="position: absolute; top: 50%; left: 0; right: 0; border-top: 1px dashed ${gridColor};"></div>
            <div style="position: absolute; top: 75%; left: 0; right: 0; border-top: 1px dashed ${gridColor};"></div>
            <div style="position: absolute; left: 33%; top: 0; bottom: 0; border-left: 1px dashed ${gridColor};"></div>
            <div style="position: absolute; left: 66%; top: 0; bottom: 0; border-left: 1px dashed ${gridColor};"></div>

            <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
                <path d="M 10 10 Q 150 100 300 130" fill="none" stroke="${curve1}" stroke-width="30" stroke-linecap="round"/>
                <path d="M 10 10 Q 150 100 300 130" fill="none" stroke="${curve2}" stroke-width="10" stroke-linecap="round"/>
            </svg>
            
            <div style="position: absolute; left: ${pos.x}%; top: ${pos.y}%; transform: translate(-50%, -50%); z-index: 10;">
                <div style="position: absolute; top: -15px; left: -15px; width: 30px; height: 30px; border-radius: 50%; border: 1px solid ${displayColor}; animation: starPulse 2s infinite;"></div>
                <div style="position: absolute; top: -4px; left: -4px; width: 8px; height: 8px; border-radius: 50%; background: ${displayColor}; box-shadow: 0 0 10px ${displayColor};"></div>
                <div style="position: absolute; top: -20px; left: 0; width: 1px; height: 40px; background: ${crosshair};"></div>
                <div style="position: absolute; top: 0; left: -20px; width: 40px; height: 1px; background: ${crosshair};"></div>
            </div>
            
            <div style="position: absolute; top: 8px; right: 8px; font-size: 10px; color: ${displayColor}; text-align: right; text-shadow: 0 0 5px ${isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}; font-weight: bold;">
                TARGET LOCKED<br>
                <span style="color:var(--text-color);">CLASS-${starClass}</span>
            </div>
        </div>
    `;
}

 // --- ANOMALY SCANNING MINIGAME ---

function handleAnomalyEncounter(anomalyObject) {
    // 1. Initialize persistent puzzle data on the tile if it's new
    if (!anomalyObject.anomalyTargets) {
        anomalyObject.anomalyTargets = [
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100)
        ];
        anomalyObject.stability = 4; // You get 4 test attempts before it explodes!
        
        // Push the brand new puzzle to the world memory immediately
        updateWorldState(playerX, playerY, { anomalyTargets: anomalyObject.anomalyTargets, stability: 4 });
        autoSaveGame(); // Force a hard save so they can't reroll the puzzle!
    }

    // 2. Set up the local session context
    anomalyContext = {
        tile: anomalyObject,
        currentVals: [50, 50, 50], // Sliders start at 50
        lastResonance: 0
    };

    openGenericModal("ANOMALY CONTAINMENT FIELD");
    renderAnomalyUI();
}

function renderAnomalyUI() {
    if (!anomalyContext) return;
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const tile = anomalyContext.tile;

    // 1. Render Instructions & Stability Bar
    listEl.innerHTML = `
        <div style="padding:15px;">
            <h3 style="color:var(--danger); animation: blink 2s infinite; letter-spacing: 1px;">! UNSTABLE FIELD !</h3>
            <p style="font-size:13px; color:#aaa; line-height: 1.5;">Align the containment frequencies to match the anomaly's signature before the field collapses.</p>
            
            <div style="margin-top:25px;">
                <div style="color:var(--item-name-color); margin-bottom:8px; font-size:12px; font-weight:bold; letter-spacing:1px;">FIELD STABILITY</div>
                <div style="display:flex; gap:5px;">
                    ${Array(4).fill(0).map((_,i) => `<div style="height:12px; flex:1; border-radius:2px; background:${i < tile.stability ? 'var(--accent-color)' : '#333'}; box-shadow:${i < tile.stability ? '0 0 8px rgba(0,224,224,0.4)' : 'none'};"></div>`).join('')}
                </div>
            </div>
            
            <div style="margin-top:30px; color:#888; font-size:12px; line-height: 1.6; background: rgba(0,0,0,0.2); padding: 10px; border-left: 2px solid var(--border-color);">
                > Adjust the tuning sliders.<br>
                > Click 'TEST ALIGNMENT' to check resonance.<br>
                > Reach <span style="color:var(--success)">>85% Resonance</span> to safely extract.<br>
                > If stability hits zero, the anomaly detonates.
            </div>
        </div>
    `;

    // 2. Render Tuning Sliders & Resonance Bar
    detailEl.innerHTML = `
        <div style="padding: 15px;">
            <div style="text-align:center; font-size:40px; margin-bottom:15px; animation: spin 10s linear infinite; display: inline-block; width: 100%;">🌀</div>
            
            <div style="margin-bottom: 30px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px; font-weight:bold;">
                    <span style="color:var(--text-color)">Current Resonance:</span>
                    <span style="color:${anomalyContext.lastResonance >= 85 ? 'var(--success)' : 'var(--warning)'}">${anomalyContext.lastResonance.toFixed(1)}%</span>
                </div>
                <div style="width:100%; height:18px; background:#111; border:1px solid #444; border-radius:4px; position:relative; overflow:hidden;">
                    <div style="height:100%; width:${anomalyContext.lastResonance}%; background:${anomalyContext.lastResonance >= 85 ? 'var(--success)' : 'var(--warning)'}; transition: width 0.4s ease-out;"></div>
                    <div style="position:absolute; top:0; left:85%; width:2px; height:100%; background:var(--danger); box-shadow: 0 0 5px red;"></div>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px;">
                ${['PHASE VARIANCE', 'AMPLITUDE MODULATION', 'HARMONIC FREQUENCY'].map((label, i) => `
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                            <label style="font-size:11px; color:var(--accent-color); font-weight:bold; letter-spacing:1px;">${label}</label>
                            <span id="anomVal${i}" style="font-size:11px; color:var(--text-color);">${anomalyContext.currentVals[i]}</span>
                        </div>
                        <input type="range" id="anomSlider${i}" min="0" max="100" value="${anomalyContext.currentVals[i]}" 
                            style="width:100%; accent-color: var(--accent-color); cursor: pointer;"
                            oninput="document.getElementById('anomVal${i}').textContent = this.value; anomalyContext.currentVals[${i}] = this.value;">
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const canExtract = anomalyContext.lastResonance >= 85;

    // 3. Render Actions
    actionsEl.innerHTML = `
        <button class="action-button" onclick="testAnomalyAlignment()" style="border-color:var(--warning); color:var(--warning);" ${tile.stability <= 0 ? 'disabled' : ''}>TEST ALIGNMENT</button>
        <button class="action-button" onclick="extractAnomalyData()" style="border-color:var(--success); color:var(--success); box-shadow: ${canExtract ? '0 0 15px rgba(0,255,0,0.2)' : 'none'};" ${!canExtract ? 'disabled' : ''}>EXTRACT DATA</button>
        <button class="action-button danger-btn" onclick="abortAnomaly()">ABORT</button>
    `;
}

function testAnomalyAlignment() {
    if (!anomalyContext || anomalyContext.tile.stability <= 0) return;

    const tile = anomalyContext.tile;
    const v0 = parseInt(anomalyContext.currentVals[0]);
    const v1 = parseInt(anomalyContext.currentVals[1]);
    const v2 = parseInt(anomalyContext.currentVals[2]);

    // Calculate distance from the hidden targets
    const diff0 = Math.abs(tile.anomalyTargets[0] - v0);
    const diff1 = Math.abs(tile.anomalyTargets[1] - v1);
    const diff2 = Math.abs(tile.anomalyTargets[2] - v2);
    
    const totalDiff = diff0 + diff1 + diff2;
    
    // Convert difference to a percentage (Max realistic diff is ~150)
    let resonance = 100 - (totalDiff / 1.5);
    if (resonance < 0) resonance = 0;

    anomalyContext.lastResonance = resonance;
    tile.stability--;
    
    // Save state persistently so they can't exploit by closing and reopening!
    updateWorldState(playerX, playerY, { 
        anomalyTargets: tile.anomalyTargets, 
        stability: tile.stability 
    });

    if (typeof soundManager !== 'undefined') soundManager.playUIHover(); 

    autoSaveGame(); // Lock in the drained stability immediately!

    // Did they run out of time while still failing?
    if (tile.stability <= 0 && resonance < 85) {
        anomalyDetonates();
    } else {
        renderAnomalyUI(); // Re-render to show updated meter and drained stability bar
    }
}

function extractAnomalyData() {
    if (!anomalyContext || anomalyContext.lastResonance < 85) return;
    
    const resonance = anomalyContext.lastResonance;
    closeGenericModal();
    
    // Base rewards
    let xp = 75;
    let items = [];
    let logMsg = `<span style="color:var(--success)">Anomaly Containment Successful! (${resonance.toFixed(1)}% Resonance)</span>`;
    
    // Higher resonance = exponentially better rewards
    if (resonance >= 98) {
        xp += 150;
        items.push({id: 'VOID_CRYSTALS', qty: 3});
        items.push({id: 'PRECURSOR_CIPHER', qty: 1}); // Rare drop!
        logMsg += `<br><span style="color:var(--gold-text)">PERFECT ALIGNMENT: Precursor artifacts extracted!</span>`;
    } else if (resonance >= 90) {
        xp += 50;
        items.push({id: 'VOID_CRYSTALS', qty: 1});
    }
    
    logMsg += `<br>Gained ${xp} XP.`;
    
    // Award items
    items.forEach(item => {
        if (currentCargoLoad + item.qty <= PLAYER_CARGO_CAPACITY) {
            playerCargo[item.id] = (playerCargo[item.id] || 0) + item.qty;
            
            // This safely triggers the GameBus CARGO_MODIFIED event!
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad(); 
            
            logMsg += `<br>Extracted: ${item.qty}x ${COMMODITIES[item.id].name}`;
        } else {
            logMsg += `<br>Extracted ${COMMODITIES[item.id].name}, but cargo hold is full!`;
        }
    });
    
    updateWorldState(playerX, playerY, { studied: true }); // Mark as completed
    
    logMessage(logMsg);
    if (typeof showToast === 'function') showToast("ANOMALY HARVESTED", "success");
    if (typeof soundManager !== 'undefined') soundManager.playGain();
    
    // --- THE MAGIC HANDOFF ---
    // The GameBus automatically adds the XP, checks for level-ups, and refreshes the UI!
    GameBus.emit('XP_GAINED', xp);
    
    anomalyContext = null;

    autoSaveGame(); // Save immediately so they can't duplicate the rewards
}

function anomalyDetonates() {
    closeGenericModal();
    
    const dmg = 25 + Math.floor(Math.random() * 25);
    
    updateWorldState(playerX, playerY, { studied: true }); // It blew up, so it's gone
    
    logMessage(`<span style="color:var(--danger)">CONTAINMENT FAILURE! Anomaly collapses violently!</span><br>Hull takes ${dmg} damage!`);
    if (typeof showToast === 'function') showToast("ANOMALY DETONATION", "error");
    
    // --- THE MAGIC HANDOFF ---
    // The GameBus now handles the math, the screen shake, the haptics, AND the game-over check!
    GameBus.emit('HULL_DAMAGED', { amount: dmg, reason: "Vaporized by Anomaly Collapse" });
    
    anomalyContext = null;
    autoSaveGame(); 
}

function abortAnomaly() {
    closeGenericModal();
    logMessage("Anomaly scan aborted. The field remains unstable.");
    anomalyContext = null;
}

// --- DERELICT SYSTEM ---

function openDerelictView() {
    const tile = chunkManager.getTile(playerX, playerY);
    if (!tile) return;

    updateModalInfoBar('derelictInfoBar');
    document.getElementById('derelictOverlay').style.display = 'flex';
    
    // --- NEW: Check if already looted (Using persistent flags) ---
    if (tile.looted || tile.studied) {
        document.getElementById('derelictNameTitle').textContent = `DERELICT ${tile.name || "UNKNOWN"} [STRIPPED]`;
        document.getElementById('derelictLog').innerHTML = "> Sensors locked. Life support offline. Wreckage has been picked clean.<br>";
    } else {
        document.getElementById('derelictNameTitle').textContent = `DERELICT ${tile.name || "UNKNOWN"}`;
        document.getElementById('derelictLog').innerHTML = "> Sensors locked. Vessel appears to be drifting.<br>";
    }
    
    // Replace the canvas with the static PNG
    const canvas = document.getElementById('derelictCanvas');
    if (canvas) {
        let img = document.getElementById('derelictStaticImg');
        if (!img) {
            img = document.createElement('img');
            img.id = 'derelictStaticImg';
            img.src = 'assets/derelict.png'; 
            img.style.width = '100%';
            img.style.maxWidth = '200px';
            img.style.height = 'auto';
            img.style.border = '1px solid var(--border-color)';
            img.style.borderRadius = '8px';
            img.style.display = 'block';
            img.style.margin = '0 auto 15px auto';
            img.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
            canvas.parentNode.insertBefore(img, canvas);
            canvas.style.display = 'none'; 
        }
    }
}

function closeDerelictView() {
    document.getElementById('derelictOverlay').style.display = 'none';
    updateSideBorderVisibility();
}

function logDerelict(msg, type="neutral") {
    const logEl = document.getElementById('derelictLog');
    const color = type === 'bad' ? '#FF5555' : (type === 'good' ? '#00FF00' : '#888');
    logEl.innerHTML += `<span style="color:${color}">> ${msg}</span><br>`;
    logEl.scrollTop = logEl.scrollHeight;
}

function handleDerelictAction(action) {
    const tile = chunkManager.getTile(playerX, playerY);
    if (!tile) return;

    // 1. Stop the exploit instantly
    if (tile.looted || tile.studied) {
        logDerelict("Further attempts yield no new results. The wreck is tapped out.", "neutral");
        return; 
    }

    // 2. THE FIX: Permanently save the looted state to the world data!
    updateWorldState(playerX, playerY, { looted: true, studied: true });

    if (action === 'SCAN') {
        const xp = 25;
        playerXP += xp;
        logDerelict(`Scan Complete. Structural analysis recorded. +${xp} XP`, 'good');
        checkLevelUp();
    }
    else if (action === 'SALVAGE') {
        if (Math.random() < 0.7) {
            const scrap = 2 + Math.floor(Math.random() * 5);
            if (currentCargoLoad + scrap <= PLAYER_CARGO_CAPACITY) {
                playerCargo.TECH_PARTS = (playerCargo.TECH_PARTS || 0) + scrap;
                updateCurrentCargoLoad();
                logDerelict(`Salvage successful. Recovered ${scrap} Tech Parts.`, 'good');
                updateModalInfoBar('derelictInfoBar');
            } else {
                logDerelict("Cargo hold full! Cannot salvage. Wreck destabilized.", 'bad');
            }
        } else {
            const dmg = 5;
            playerHull -= dmg;
            logDerelict(`Accident! Debris collision. Hull -${dmg}`, 'bad');
            if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
            if (playerHull <= 0) {
                closeDerelictView();
                triggerGameOver("Crushed by Derelict Debris");
            }
            updateModalInfoBar('derelictInfoBar');
        }
    }
    else if (action === 'BREACH') {
        const roll = Math.random();
        
        if (roll < 0.4) {
            logDerelict("WARNING: Lifeforms detected in the airlock!", "bad");
            
            // Triggers the new boarding minigame if it exists, otherwise falls back to ship combat
            if (typeof startBoardingCombat === 'function') {
                setTimeout(startBoardingCombat, 1000); 
            } else {
                closeDerelictView();
                startCombat();
            }
        } else if (roll < 0.8) {
            const credits = 200 + Math.floor(Math.random() * 500);
            playerCredits += credits;
            logDerelict(`Hull breached. Captain's safe located! Found ${credits} credits.`, 'good');
            updateModalInfoBar('derelictInfoBar');
        } else {
            const dmg = 20;
            playerHull -= dmg;
            logDerelict(`TRAP TRIGGERED! Explosive decompression. Hull -${dmg}`, 'bad');
            if (typeof soundManager !== 'undefined') soundManager.playExplosion();
            if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
            
            if (playerHull <= 0) {
                closeDerelictView();
                triggerGameOver("Killed by Derelict Trap");
            }
            updateModalInfoBar('derelictInfoBar');
        }
    }
}

function traverseWormhole() {
     // 1. Check if player has enough fuel
     if (playerFuel < WORMHOLE_TRAVEL_FUEL_COST) {
         logMessage(`Cannot traverse: Requires ${WORMHOLE_TRAVEL_FUEL_COST} fuel, you have ${playerFuel.toFixed(1)}.`);
         return;
     }

     // 2. Deduct Fuel
     playerFuel -= WORMHOLE_TRAVEL_FUEL_COST;
     playerFuel = parseFloat(playerFuel.toFixed(1));

     // 3. Calculate a massive jump across the universe
     // We multiply by 100 to ensure we jump many sectors away
     let jumpX = (WORMHOLE_JUMP_MIN_DIST + Math.random() * (WORMHOLE_JUMP_MAX_DIST - WORMHOLE_JUMP_MIN_DIST)) * 100;
     let jumpY = (WORMHOLE_JUMP_MIN_DIST + Math.random() * (WORMHOLE_JUMP_MAX_DIST - WORMHOLE_JUMP_MIN_DIST)) * 100;

     // Randomize direction (positive or negative coordinates)
     if (Math.random() < 0.5) jumpX *= -1;
     if (Math.random() < 0.5) jumpY *= -1;

    // 4. Update Player Coordinates
     playerX += Math.floor(jumpX);
     playerY += Math.floor(jumpY);

     // Wipe ambient traffic so the old sector's ships don't linger in memory
     if (typeof activeNPCs !== 'undefined') activeNPCs = [];

     // 5. Update Sector State (Critical Fix for Desync)
     // This ensures the UI immediately reflects the new sector name and coordinates
     updateSectorState();

     const pCX = Math.floor(playerX / chunkManager.CHUNK_SIZE);
     const pCY = Math.floor(playerY / chunkManager.CHUNK_SIZE);
     chunkManager.pruneChunks(pCX, pCY);

     // 6. Grant XP and Unlock Lore
     playerXP += XP_WORMHOLE_TRAVERSE;
     unlockLoreEntry("PHENOMENON_WORMHOLE");

     // 7. Log the Event
     let warpMessage = `The wormhole violently ejects you into an unknown region of deep space!`;
     warpMessage += `\n<span style='color:#00DD00;'>Wormhole Traversed! +${XP_WORMHOLE_TRAVERSE} XP!</span>`;
     logMessage(warpMessage);

     soundManager.playWarp();

     // 8. Handle Post-Jump State
     checkLevelUp(); // Check if the XP gain caused a level up
     handleInteraction(); // Describe what is at the new location immediately

     // Stumble Protection: Prevent accidental movement for 500ms after transition
    lastInputTime = Date.now() + 500;
 }

 // ==========================================
// --- RANDOM SPACE EVENTS (LUCKY FINDS) ---
// ==========================================

function triggerRandomEvent() {
    // We add a global multiplier so we can scale this with ship upgrades later!
    // Right now, it defaults to a factor of 0.1 (10%). 
    // Later, an upgrade could set this to 1.0, 5.0, etc.
    let salvageMultiplier = 0.1; 
    
    // Example hook for future upgrades: 
    // if (playerPerks.has('DEEP_SPACE_SCAVENGER')) salvageMultiplier = 1.0;

    const events = [
        {
            text: "You spot a drifting fuel canister.",
            effect: () => {
                // Base was 10-30. Now it's 1-3.
                const baseAmount = 10 + Math.floor(Math.random() * 20);
                const amount = Math.max(1, Math.floor(baseAmount * salvageMultiplier));
                
                playerFuel = Math.min(MAX_FUEL, playerFuel + amount);
                logMessage(`<span style="color:#00E0E0">Lucky Find:</span> Refueled ${amount} units from salvage.`);
            }
        },
        {
            text: "You intercept a fragmented credit transfer.",
            effect: () => {
                // Base was 25-100. Now it's 2-10.
                const baseAmount = 25 + Math.floor(Math.random() * 75);
                const amount = Math.max(2, Math.floor(baseAmount * salvageMultiplier));
                
                if (typeof playerCredits !== 'undefined') playerCredits += amount;
                logMessage(`<span style="color:var(--gold-text)">Lucky Find:</span> Decrypted ${formatNumber(amount)} credits.`);
            }
        },
        {
            text: "You scan an ancient navigation buoy.",
            effect: () => {
                // Base was 15. Now it's 1-2.
                const baseAmount = 15;
                const amount = Math.max(1, Math.floor(baseAmount * salvageMultiplier));
                
                if (typeof playerXP !== 'undefined') playerXP += amount;
                logMessage(`<span style="color:#00FF00">Lucky Find:</span> Downloaded nav data. +${amount} XP.`);
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    logMessage(event.text);
    event.effect();
    
    // Optional: Render UI stats to show the trickle immediately
    if (typeof renderUIStats === 'function') renderUIStats();
}

// ==========================================
// --- PIONEER COLONY SYSTEM ---
// ==========================================

function surveyForColony(planetName, biomeId, x, y) {
    // 1. Consume the Official Charter
    if (playerCargo["COLONY_CHARTER"] > 0) {
        playerCargo["COLONY_CHARTER"]--;
        if (playerCargo["COLONY_CHARTER"] <= 0) delete playerCargo["COLONY_CHARTER"];
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    } else {
        showToast("Charter Required!", "error");
        return;
    }

    // 2. Setup Colony Data
    let customName = prompt("Enter a name for your new settlement:", "New Earth");
    if (!customName) customName = "Pioneer Outpost";

    playerColony.established = true;
    playerColony.name = customName;
    playerColony.x = x;
    playerColony.y = y;
    playerColony.planetName = planetName;
    playerColony.biome = biomeId;
    playerColony.phase = "OUTPOST";
    playerColony.population = 0;
    playerColony.morale = 100;
    playerColony.suppliesDelivered = { habModules: 0, atmosProcessors: 0 };

    // 3. Update the World Map!
    // This permanently changes the tile on the galactic map to your colony
    updateWorldState(x, y, {
        name: customName,
        type: 'location',
        isColony: true, // Special flag for our engine
        char: 'C', 
        customColor: 'var(--success)', // Bright green so it stands out
        scanFlavor: "A burgeoning pioneer settlement founded by Captain " + playerName + "."
    });

    logMessage(`<span style="color:var(--success); font-weight:bold;">COLONY ESTABLISHED: ${customName}</span>`);
    showToast("SETTLEMENT FOUNDED", "success");
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();

    // 4. Transition UI
    closeGenericModal();
    openColonyManagement();
    autoSaveGame();
}

function openColonyManagement() {
    openGenericModal(`COLONY: ${playerColony.name.toUpperCase()}`);
    
    const detailEl = document.getElementById('genericDetailContent');
    const listEl = document.getElementById('genericModalList');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Render Infrastructure Goals (Left Pane)
    listEl.innerHTML = `
        <div style="padding:15px;">
            <h4 style="color:var(--accent-color); margin-top:0; letter-spacing:1px;">DEVELOPMENT GOALS</h4>
            <p style="font-size:12px; color:var(--item-desc-color); line-height: 1.5;">Deliver infrastructure and personnel to advance your settlement's phase.</p>
            
            <div style="margin-top:15px; background:rgba(0,0,0,0.3); padding:15px; border:1px solid #333; border-radius: 4px;">
                <div style="color:var(--success); font-size:10px; font-weight:bold; letter-spacing:1px; margin-bottom:10px;">INFRASTRUCTURE GRID</div>
                
                <div style="font-size:13px; display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="color:#888;">Hab Modules:</span> 
                    <span style="color:var(--text-color); font-weight:bold;">${playerColony.suppliesDelivered.habModules}</span>
                </div>
                <div style="font-size:13px; display:flex; justify-content:space-between;">
                    <span style="color:#888;">Atmos Processors:</span> 
                    <span style="color:var(--text-color); font-weight:bold;">${playerColony.suppliesDelivered.atmosProcessors}</span>
                </div>
                
                <div style="margin-top:15px; border-top:1px dashed #444; padding-top:10px; font-size:11px; color:#666;">
                    * Each Hab Module supports 50 Colonists.
                </div>
            </div>
        </div>
    `;

    // 2. Render Colony Vitals (Right Pane)
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:10px; color:var(--success); filter: drop-shadow(0 0 15px rgba(0,255,0,0.3));">🏙️</div>
            <h3 style="color:var(--success); margin:0 0 5px 0;">${playerColony.name.toUpperCase()}</h3>
            
            <div style="display:inline-block; border:1px solid var(--success); padding:4px 8px; border-radius:2px; font-size:10px; color:var(--success); letter-spacing:2px; margin-bottom: 20px;">
                PHASE: ${playerColony.phase}
            </div>
            
            <div class="trade-math-area">
                <div class="trade-stat-row">
                    <span>Population:</span> 
                    <span style="color:var(--text-color); font-weight:bold; font-size:16px;">${formatNumber(playerColony.population)}</span>
                </div>
                <div class="trade-stat-row">
                    <span>Morale:</span> 
                    <span style="color:${playerColony.morale >= 50 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${playerColony.morale}%</span>
                </div>
                <div class="trade-stat-row" style="margin-top:5px; border-top:1px solid #333; padding-top:5px;">
                    <span>Biome Base:</span> 
                    <span style="color:var(--item-desc-color);">${PLANET_BIOMES[playerColony.biome]?.name || 'Unknown'}</span>
                </div>
            </div>
        </div>
    `;

    // 3. Setup Delivery Buttons
    let btnHtml = ``;

    const habs = playerCargo["HAB_MODULE"] || 0;
    const atmos = playerCargo["ATMOS_PROCESSOR"] || 0;
    const settlers = playerCargo["SETTLER_MANIFEST"] || 0;

    btnHtml += `<button class="action-button" ${habs > 0 ? '' : 'disabled'} onclick="deliverColonySupply('HAB_MODULE')" style="border-color:var(--accent-color); color:var(--accent-color);">DEPLOY HAB MODULE (${habs})</button>`;
    btnHtml += `<button class="action-button" ${atmos > 0 ? '' : 'disabled'} onclick="deliverColonySupply('ATMOS_PROCESSOR')" style="border-color:var(--warning); color:var(--warning);">INSTALL ATMOS PROCESSOR (${atmos})</button>`;
    btnHtml += `<button class="action-button" ${settlers > 0 ? '' : 'disabled'} onclick="deliverColonySupply('SETTLER_MANIFEST')" style="border-color:var(--success); color:var(--success);">AWAKEN SETTLERS (${settlers})</button>`;
    
    // Check if they are inside a system or deep space to route the exit properly
    const isSystemMap = document.getElementById('systemView').style.display === 'block';
    
    btnHtml += `
        <button class="action-button leave-btn" onclick="closeGenericModal()" style="margin-top: 15px;">
            ${isSystemMap ? 'RETURN TO ORBIT' : 'RETURN TO DEEP SPACE'}
        </button>
    `;

    actionsEl.innerHTML = btnHtml;
}

function deliverColonySupply(itemId) {
    if (!playerCargo[itemId] || playerCargo[itemId] <= 0) return;

    // 1. HARD CAP LOGIC (Can't drop colonists without housing!)
    if (itemId === 'SETTLER_MANIFEST') {
        const maxPop = playerColony.suppliesDelivered.habModules * 50;
        if (playerColony.population + 50 > maxPop) {
            logMessage(`<span style="color:var(--danger)">Cannot awaken settlers. Insufficient Hab Modules for housing!</span>`);
            showToast("HOUSING FULL", "error");
            
            // Penalize morale for attempting to overcrowd
            playerColony.morale = Math.max(0, playerColony.morale - 5); 
            openColonyManagement();
            if (typeof soundManager !== 'undefined') soundManager.playError();
            return; // Stop here, item is NOT consumed
        }
    }

    // 2. Consume from cargo safely
    playerCargo[itemId]--;
    if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    // 3. Apply to colony
    if (itemId === 'HAB_MODULE') {
        playerColony.suppliesDelivered.habModules++;
        logMessage(`Delivered 1 Hab Module. Housing capacity increased.`);
    } else if (itemId === 'ATMOS_PROCESSOR') {
        playerColony.suppliesDelivered.atmosProcessors++;
        logMessage(`Delivered 1 Atmos Processor. Air quality improving.`);
    } else if (itemId === 'SETTLER_MANIFEST') {
        playerColony.population += 50;
        logMessage(`<span style="color:var(--success)">50 Settlers awakened from cryo-sleep!</span>`);
        GameBus.emit('XP_GAINED', 100); // 100 XP reward for advancing humanity
    }

    // 4. Progression / Level Up Logic
    if (playerColony.phase === "OUTPOST" && playerColony.suppliesDelivered.habModules >= 2 && playerColony.suppliesDelivered.atmosProcessors >= 1) {
        playerColony.phase = "POPULATED";
        logMessage(`<span style="color:var(--accent-color); font-weight:bold;">Colony phase upgraded to: POPULATED</span>`);
        GameBus.emit('XP_GAINED', 500); // Big reward!
    } else if (playerColony.phase === "POPULATED" && playerColony.population >= 200 && playerColony.suppliesDelivered.atmosProcessors >= 3) {
        playerColony.phase = "OPERATIONAL";
        logMessage(`<span style="color:var(--gold-text); font-weight:bold;">Colony phase upgraded to: OPERATIONAL. Settlement is now a self-sustaining hub!</span>`);
        GameBus.emit('XP_GAINED', 1500); // Massive reward!
    }

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    openColonyManagement(); // Refresh UI instantly
    autoSaveGame();
}
