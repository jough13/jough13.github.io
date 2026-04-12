// ==========================================
// --- BOUNTY BOARD DATA ---
// ==========================================

function generateMissionsForStation(stationName) {
    const generatedMissions = [];
    // Filter templates based on player level
    const availableTemplates = MISSION_TEMPLATES.filter(t => playerLevel >= (t.prerequisites.minLevel || 1));
    
    // Determine how many missions we want to generate (2 to 3)
    const numMissionsToGenerate = 2 + Math.floor(Math.random() * 2);

    // Safety counter to prevent infinite loops if valid missions cannot be generated
    // (e.g., if selectRandomDestination keeps returning null)
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    while (generatedMissions.length < numMissionsToGenerate && availableTemplates.length > 0 && attempts < MAX_ATTEMPTS) {
        attempts++;

        try {
            // Select a weighted random template from the available ones
            const chosenTemplate = getWeightedRandomOutcome(availableTemplates);

            // Deep copy of the template to avoid side-effects
            let newMission = JSON.parse(JSON.stringify(chosenTemplate));

            // Generate a truly unique ID using Math.random entropy
            newMission.id = `${newMission.id_prefix}${attempts}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
            newMission.giver = stationName;

            // Get the first objective template
            const objective = newMission.objective_templates[0];

            let success = true;

            // Configure the mission details and build strings from templates
            switch (newMission.type) {
                case "BOUNTY":
                    const pirateCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));
                    objective.count = pirateCount;
                    newMission.title = newMission.title_template.replace('{sectorName}', currentSectorName);
                    newMission.description = newMission.description_template
                        .replace('{sectorName}', currentSectorName)
                        .replace('{sectorCoords}', `(${currentSectorX},${-currentSectorY})`)
                        .replace('{count}', objective.count);
                    break;

                case "DELIVERY": {
                    const destination = selectRandomDestination(stationName);
                    // Safety check: ensure a valid destination exists
                    if (!destination) {
                        success = false;
                        break;
                    }

                    const deliveryItem = selectRandomCommodity(destination.name);
                    // Safety check: ensure the destination actually buys something
                    if (!deliveryItem) {
                        success = false;
                        break;
                    }

                    const itemCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));

                    objective.destinationName = destination.name;
                    objective.destinationSectorKey = destination.key;
                    objective.itemID = deliveryItem;
                    objective.count = itemCount;

                    newMission.title = newMission.title_template.replace('{destinationName}', objective.destinationName);
                    newMission.description = newMission.description_template
                        .replace('{destinationName}', objective.destinationName)
                        .replace('{count}', objective.count)
                        .replace('{itemName}', COMMODITIES[deliveryItem].name);
                    break;
                }

                case "ACQUIRE": {
                    const acquireItem = selectRandomCommodity(stationName);
                    // Safety check: ensure the station buys something we can be asked to acquire
                    if (!acquireItem) {
                        success = false;
                        break;
                    }

                    const itemCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));

                    objective.itemID = acquireItem;
                    objective.count = itemCount;

                    newMission.title = newMission.title_template.replace('{itemName}', COMMODITIES[acquireItem].name);
                    newMission.description = newMission.description_template
                        .replace('{count}', objective.count)
                        .replace('{itemName}', COMMODITIES[acquireItem].name);
                    break;
                }

                case "SURVEY":
                    objective.targetType = 'anomaly';
                    objective.subtype = 'unstable warp pocket';
                    objective.sectorKey = "ANY";
                    newMission.title = newMission.title_template.replace('{subtype}', objective.subtype);
                    newMission.description = newMission.description_template.replace('{subtype}', objective.subtype);
                    break;

                default:
                    success = false;
            }

            // Set the final objectives on the new mission object
            newMission.objectives = [objective];

            // THE FIX: Create the rewards object if it doesn't exist yet!
            if (!newMission.rewards) {
                newMission.rewards = {};
            }

            // Randomize rewards and assign them
            newMission.rewards.credits = newMission.rewards_template.credits[0] + Math.floor(Math.random() * (newMission.rewards_template.credits[1] - newMission.rewards_template.credits[0] + 1));
            newMission.rewards.xp = newMission.rewards_template.xp[0] + Math.floor(Math.random() * (newMission.rewards_template.xp[1] - newMission.rewards_template.xp[0] + 1));
            newMission.rewards.notoriety = newMission.rewards_template.notoriety[0] + Math.floor(Math.random() * (newMission.rewards_template.notoriety[1] - newMission.rewards_template.notoriety[0] + 1));

            // Only push the mission if generation was successful
            if (success) {
                generatedMissions.push(newMission);
            }
        } catch (error) {
            console.error("Failed to generate a mission:", error);
        }
    }
    return generatedMissions;
}

// --- OVERRIDE: DISPLAY MISSIONS ---
function displayMissionBoard() {
    // 1. Get location data dynamically
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : {name: "STARBASE", faction: "INDEPENDENT"};
    const stationName = location.name;
    const faction = location.faction || "INDEPENDENT";
    
    // 2. Set dynamic branding colors
    let brandColor = "var(--accent-color)";
    if (faction === 'CONCORD') brandColor = "#4488FF";
    else if (faction === 'ECLIPSE') brandColor = "#9933FF";
    else if (faction === 'KTHARR') brandColor = "var(--danger)";
    else brandColor = "var(--success)";

    if (!MISSIONS_DATABASE[stationName]) {
         MISSIONS_DATABASE[stationName] = generateMissionsForStation(stationName);
    }
    
    openGenericModal(`${stationName.toUpperCase()} : CONTRACTS`);
    
    // --- 3. THE IRONCLAD FLEXBOX LAYOUT ---
    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";
    
    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 15px; box-shadow: 0 0 25px ${brandColor}44; flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/mission_banner.png" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='assets/mission_banner.png';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">AVAILABLE CONTRACTS</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">LOCAL CONTRACTS</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                            Review available bounties, courier requests, and exploration directives. Accepting a contract requires a commitment, and failure may result in reputation penalties.
                        </p>
                        <div style="margin-top: 20px; font-size: 14px; color: var(--text-color); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            Current ${faction} Standing: <b style="color:${brandColor};">${typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[faction] || 0) : 0} Rep</b>
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const missions = MISSIONS_DATABASE[stationName];
    let foundActive = false;

    missions.forEach((mission, index) => {
        if(playerCompletedMissions.has(mission.id)) return;
        foundActive = true;
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
        
        let typeColor = "var(--success)";
        if(mission.type === 'BOUNTY') typeColor = "var(--danger)";
        if(mission.type === 'DELIVERY') typeColor = "var(--warning)";
        if(mission.type === 'SURVEY') typeColor = "#4488FF";

        row.innerHTML = `
            <div>
                <div style="color:var(--text-color); font-weight:bold; font-size: 13px;">${mission.title}</div>
                <div style="color:${typeColor}; font-size: 10px; letter-spacing: 1px; margin-top: 4px;">[ ${mission.type} ]</div>
            </div>
            <div style="text-align:right;">
                <span style="color:var(--gold-text, #FFD700); font-weight:bold;">${formatNumber(mission.rewards.credits)}c</span>
            </div>
        `;
        row.onclick = () => showMissionDetails(stationName, index, brandColor);
        listEl.appendChild(row);
    });
    
    if(!foundActive) {
        listEl.innerHTML = "<div style='padding:15px; color:#888; font-style:italic;'>No contracts currently available. Check back later.</div>";
    }
}

function showMissionDetails(stationName, index, brandColor) {
    const mission = MISSIONS_DATABASE[stationName][index];
    const isActive = playerActiveMission !== null;
    
    let typeColor = "var(--success)";
    if(mission.type === 'BOUNTY') typeColor = "var(--danger)";
    if(mission.type === 'DELIVERY') typeColor = "var(--warning)";
    if(mission.type === 'SURVEY') typeColor = "#4488FF";

    let html = `
        <div style="font-size:10px; color:${typeColor}; letter-spacing:2px; margin-bottom:5px;">
            [ ${mission.type} CONTRACT ]
        </div>
        <h3 style="color:${brandColor}; margin:0 0 5px 0;">${mission.title}</h3>
        <p style="font-size:11px; color:var(--item-desc-color); border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px;">Client: ${mission.giver}</p>
        
        <p style="color:var(--text-color); font-size:12px; line-height: 1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${typeColor}; margin-bottom:20px;">
            "${mission.description}"
        </p>
        
        <div class="trade-math-area">
            <div style="font-size:10px; color:${brandColor}; letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">REWARD TELEMETRY</div>
            <div class="trade-stat-row"><span style="color:var(--item-desc-color);">Credits:</span> <span style="color:var(--gold-text, #FFD700); font-weight:bold;">${formatNumber(mission.rewards.credits)}c</span></div>
            <div class="trade-stat-row"><span style="color:var(--item-desc-color);">Experience:</span> <span style="color:var(--success, #00FF00); font-weight:bold;">+${formatNumber(mission.rewards.xp)} XP</span></div>
            ${mission.rewards.notoriety !== 0 ? `<div class="trade-stat-row"><span style="color:var(--item-desc-color);">Notoriety:</span> <span style="color:${mission.rewards.notoriety > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${mission.rewards.notoriety > 0 ? '+' : ''}${mission.rewards.notoriety}</span></div>` : ''}
        </div>
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;
    
    // --- SLEEK BUTTON SIZING ---
    const btnHtml = `
        <button class="action-button" ${isActive ? 'disabled' : ''} 
            style="${isActive ? '' : `border-color:${brandColor}; color:${brandColor};`} width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;"
            onclick="confirmAcceptMission('${stationName}', ${index})">
            ${isActive ? 'FINISH CURRENT JOB FIRST' : 'AUTHORIZE CONTRACT'}
        </button>
        <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">
            ◀ BACK TO CONCOURSE
        </button>
    `;
    
    document.getElementById('genericModalActions').innerHTML = btnHtml;
}

function confirmAcceptMission(stationName, index) {
    const mission = MISSIONS_DATABASE[stationName][index];
    
    playerActiveMission = JSON.parse(JSON.stringify(mission));
    playerActiveMission.isComplete = false;
    playerActiveMission.progress = {};
    
    playerActiveMission.objectives.forEach((obj, idx) => {
         const key = `${obj.type.toLowerCase()}_${idx}`;
         if (obj.type === "ELIMINATE") playerActiveMission.progress[key] = { current:0, required:obj.count, complete:false };
         if (obj.type === "DELIVERY") playerActiveMission.progress[key] = { delivered:0, required:obj.count, complete:false, destinationName: obj.destinationName };
         if (obj.type === "SURVEY") playerActiveMission.progress[key] = { scanned:false, complete:false };
         if (obj.type === "ACQUIRE") playerActiveMission.progress[key] = { acquired:0, required:obj.count, complete:false };
    });

    showToast("CONTRACT ACCEPTED", "success");
    closeGenericModal();
    renderMissionTracker();
}

 function displayMissionDetails(selectedIndex) {
    if (!currentMissionContext || currentMissionContext.step !== 'selectMission' || !currentMissionContext.availableMissions) {
        displayMissionBoard();
        return;
    }

    const mission = currentMissionContext.availableMissions[selectedIndex];
    if (!mission) {
        logMessage("Invalid mission selection.");
        displayMissionBoard();
        return;
    }

    let detailMsg = `--- Mission Briefing: ${mission.title} ---\n`;
    detailMsg += `From: ${mission.giver}\n\n`;
    detailMsg += `Description:\n${mission.description}\n\n`;
    detailMsg += `Objectives:\n`;

    mission.objectives.forEach(obj => {
        if (obj.type === "ELIMINATE") {
            let locationText = (obj.targetSectorKey === "CURRENT") ? "in this system" : "in any system";
            detailMsg += ` - Eliminate ${obj.count} ${obj.targetName}(s) ${locationText}.\n`;
        } else if (obj.type === "DELIVERY") {
            const itemName = COMMODITIES[obj.itemID] ? COMMODITIES[obj.itemID].name : "Goods";
            detailMsg += ` - Deliver ${obj.count} ${itemName} to ${obj.destinationName}.\n`;
        } else if (obj.type === "SCAN_OBJECT") {
            detailMsg += ` - Scan a ${obj.subtype} ${obj.targetType} in any system.\n`;
        } else if (obj.type === "ACQUIRE") {
            // THE FIX: Added missing Acquire text generation
            const itemName = COMMODITIES[obj.itemID] ? COMMODITIES[obj.itemID].name : "Resources";
            detailMsg += ` - Acquire ${obj.count} units of ${itemName} and return to ${mission.giver}.\n`;
        }
    });

    detailMsg += `\nRewards: ${mission.rewards.credits} Credits, ${mission.rewards.xp} XP, ${mission.rewards.notoriety} Notoriety.\n\n`;

    if (playerActiveMission) {
        detailMsg += "\n<span style='color:yellow;'>Note: You must complete or abandon your current mission before accepting this one.</span>\n";
        detailMsg += "\n(L) to go back to mission board.";
        currentMissionContext.step = 'viewOnlyDetails';
    } else {
        detailMsg += "Accept this mission? (Y/N) or (L) to go back.";
        currentMissionContext.step = 'confirmMission';
    }

    currentMissionContext.selectedMission = mission;
    logMessage(detailMsg);
}

function acceptMission() {
     if (!currentMissionContext || currentMissionContext.step !== 'confirmMission' || !currentMissionContext.selectedMission) {
         displayMissionBoard();
         return;
     }

     if (playerActiveMission) {
         logMessage("You already have an active mission. Complete or abandon it first.");
         displayMissionBoard();
         return;
     }

     playerActiveMission = JSON.parse(JSON.stringify(currentMissionContext.selectedMission));
     playerActiveMission.isComplete = false;
     playerActiveMission.progress = {};
     playerActiveMission.objectives.forEach((obj, index) => {

         const progressKeyBase = obj.type.toLowerCase();

         if (obj.type === "ELIMINATE") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 current: 0,
                 required: obj.count,
                 targetName: obj.targetName,
                 targetSectorKey: obj.targetSectorKey,
                 complete: false
             };
         } else if (obj.type === "SURVEY") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 scanned: false,
                 targetType: obj.targetType,
                 subtype: obj.subtype,
                 sectorKey: obj.sectorKey,
                 complete: false
             };
         } else if (obj.type === "DELIVERY") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 delivered: 0,
                 required: obj.count,
                 itemID: obj.itemID,
                 destinationName: obj.destinationName,
                 destinationSectorKey: obj.destinationSectorKey,
                 complete: false
             };
         } else if (obj.type === "ACQUIRE") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 acquired: 0,
                 required: obj.count,
                 itemID: obj.itemID,
                 complete: false
             };
         }
     });
     logMessage(`Mission Accepted: ${playerActiveMission.title}`);
     currentMissionContext = null;
     handleInteraction();
     renderMissionTracker(); // Mission tracker updated here
 }

 /**
  * Handles turning in resources for an ACQUIRE mission at the giver's station.
  */
 function handleTurnInAcquire() {
     if (!playerActiveMission || playerActiveMission.type !== "ACQUIRE" || playerActiveMission.isComplete) {
         logMessage("No active acquisition mission to turn in here.");
         return;
     }

     const objective = playerActiveMission.objectives[0]; // Assuming one acquire objective
     const progressKey = `acquire_0`;
     const objectiveProgress = playerActiveMission.progress[progressKey];

     if (playerCargo[objective.itemID] >= objective.count) {
         // We have enough!
         playerCargo[objective.itemID] -= objective.count;
         if (playerCargo[objective.itemID] <= 0) delete playerCargo[objective.itemID]; 
         updateCurrentCargoLoad();
         objectiveProgress.complete = true;
         logMessage(`Turned in ${objective.count} ${COMMODITIES[objective.itemID].name} to ${playerActiveMission.giver}.`);
         checkMissionObjectiveCompletion(); // This will set the mission to isComplete = true
     } else {
         // Not enough items
         logMessage(`You don't have enough ${COMMODITIES[objective.itemID].name}. Required: ${objective.count}, You have: ${playerCargo[objective.itemID] || 0}.`);
     }

     handleInteraction(); // Refresh docked message
     renderMissionTracker(); // Update the mission tracker UI
 }

 function handleCompleteDelivery() {
     if (!playerActiveMission || playerActiveMission.type !== "DELIVERY" || playerActiveMission.isComplete) {
         logMessage("No active delivery to complete here.");
         return;
     }
     const currentLocation = getCombinedLocationData(playerX, playerY);
     if (!currentLocation) {
         logMessage("Error: Not currently at a recognized location.");
         return;
     }
     let deliveryMade = false;
     playerActiveMission.objectives.forEach((obj, index) => {
         if (obj.type === "DELIVERY") {
             const progressKey = `delivery_${index}`;
             const objectiveProgress = playerActiveMission.progress[progressKey];
             if (objectiveProgress && !objectiveProgress.complete &&
                 currentLocation.name === obj.destinationName) {

                 if (playerCargo[obj.itemID] >= obj.count) {
                     playerCargo[obj.itemID] -= obj.count;
                     if (playerCargo[obj.itemID] <= 0) delete playerCargo[obj.itemID]; 
                     updateCurrentCargoLoad();
                     objectiveProgress.delivered = obj.count; // Mark this objective's delivery as done
                     objectiveProgress.complete = true;
                     logMessage(`Delivered ${obj.count} ${COMMODITIES[obj.itemID].name} to ${obj.destinationName}.`, true);
                     deliveryMade = true;
                 } else {
                     logMessage(`You don't have enough ${COMMODITIES[obj.itemID].name}. Required: ${obj.count}, You have: ${playerCargo[obj.itemID] || 0}.`, true);
                 }
             }
         }
     });
     if (deliveryMade) {
         checkMissionObjectiveCompletion();
     }
     handleInteraction(); // Refresh docked message
     renderMissionTracker(); // Mission tracker updated here
 }

 function checkMissionObjectiveCompletion() {
    if (!playerActiveMission || playerActiveMission.isComplete) return false;
    
    let allObjectivesNowComplete = true;
    
    for (let i = 0; i < playerActiveMission.objectives.length; i++) {
        const objective = playerActiveMission.objectives[i];
        const progressKey = `${objective.type.toLowerCase()}_${i}`;
        const objectiveProgress = playerActiveMission.progress[progressKey];
        
        if (!objectiveProgress || !objectiveProgress.complete) {
            allObjectivesNowComplete = false;
            break;
        }
    }
    
    if (allObjectivesNowComplete && !playerActiveMission.isComplete) {
        playerActiveMission.isComplete = true;
        logMessage(`All objectives for '${playerActiveMission.title}' complete!\nReturn to ${playerActiveMission.giver} to claim your reward.`, true);
        
        // Play a nice sound so the player knows they finished the job!
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    }
    
    return allObjectivesNowComplete;
}

function grantMissionRewards() {
     if (!playerActiveMission || !playerActiveMission.isComplete) return;
     
     const currentLocation = getCombinedLocationData(playerX, playerY);
     
     if (!currentLocation || currentLocation.name !== playerActiveMission.giver) {
         logMessage("You must be at " + playerActiveMission.giver + " to claim this reward.");
         return;
     }

     const mission = playerActiveMission;
     playerCredits += mission.rewards.credits;
     playerXP += mission.rewards.xp;
     
     updatePlayerNotoriety(mission.rewards.notoriety);
     
     let standingMsg = "";
     if (currentLocation.faction) {
         const repGain = Math.max(5, Math.abs(mission.rewards.notoriety || 5));
         playerFactionStanding[currentLocation.faction] = (playerFactionStanding[currentLocation.faction] || 0) + repGain;
         standingMsg = `\n  ${currentLocation.faction} Standing: +${repGain}`;
     }

     playerCompletedMissions.add(mission.id);
     
     // FormatNumber for both credits and XP in the log message
     let rewardMsg = `Mission '${mission.title}' Complete!\nRewards:\n  +${formatNumber(mission.rewards.credits)} Credits\n  +${formatNumber(mission.rewards.xp)} XP`;

     if (mission.rewards.notoriety !== 0) {
         rewardMsg += `\n  Notoriety ${mission.rewards.notoriety > 0 ? '+' : ''}${mission.rewards.notoriety}`;
     }
     rewardMsg += standingMsg;

    playerActiveMission = null;
     currentMissionContext = null;
     logMessage(rewardMsg);
     
     const leveledUp = checkLevelUp();
     
     // Only trigger the station interaction menu if we didn't level up
     if (!leveledUp) {
         handleInteraction();
     }
     
     renderMissionTracker(); 
     renderUIStats();
}

function renderMissionTracker() {
    const textEl = document.getElementById('missionText');
    
    if (!playerActiveMission) {
        textEl.textContent = "No Active Contract";
        textEl.style.color = "#555";
        return;
    }

    let objectiveText = "Objective Unknown";
    const objective = playerActiveMission.objectives[0];
    const progress = playerActiveMission.progress[`${objective.type.toLowerCase()}_0`];

    if (playerActiveMission.isComplete) {
        objectiveText = `Return to ${playerActiveMission.giver}`;
    } else if (objective.type === 'BOUNTY') {
        objectiveText = `Hunt Pirates (${progress.current}/${progress.required})`;
    } else if (objective.type === 'DELIVERY') {
        objectiveText = `Deliver to ${objective.destinationName}`;
    } else if (objective.type === 'SURVEY') {
        objectiveText = `Survey Anomaly`;
    } else if (objective.type === 'ACQUIRE') {
        const currentAmt = playerCargo[objective.itemID] || 0;
        // SAFE LOOKUP: Fallback to "Unknown Item" if the ID is corrupted
        const itemName = COMMODITIES[objective.itemID] ? COMMODITIES[objective.itemID].name : "Unknown Item";
        objectiveText = `Acquire ${itemName} (${currentAmt}/${objective.count})`;
    }

    textEl.textContent = `${playerActiveMission.title}: ${objectiveText}`;
    textEl.style.color = "#FFD700";
}

// --- STATE MANAGEMENT ---
// This object will persist throughout the play session, storing which image is assigned to which station.
// It uses window scope to survive if missions.js is reloaded.
if (typeof window._stationBountyBannerAssignments === 'undefined') {
    window._stationBountyBannerAssignments = {};
}

function openBountyBoard() {
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : {name: "STARBASE", faction: "CONCORD"};
    const stationName = location.name;
    const faction = location.faction || "CONCORD";
    
    let brandColor = "var(--danger)"; // Bounties are always red!

    openGenericModal(`${stationName.toUpperCase()} : BOUNTY BOARD`);
    
    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";
    
    // --- 🚨 PERSISTENT RANDOMIZATION LOGIC 🚨 ---
    
    // 1. Define the possible assets (Note: extensions differ as requested)
    const availableBanners = ['assets/bounty_banner.png', 'assets/bounty_banner2.png'];
    
    // 2. Check if this station already has an assigned banner
    let assignedBanner = window._stationBountyBannerAssignments[stationName];
    
    // 3. If no assignment exists, pick a random one and save it!
    if (!assignedBanner) {
        assignedBanner = availableBanners[Math.floor(Math.random() * availableBanners.length)];
        window._stationBountyBannerAssignments[stationName] = assignedBanner;
        console.log(`📡 Assigned ${assignedBanner} to ${stationName} terminal.`);
    }

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; background: url('${assignedBanner}') center/cover; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 15px; box-shadow: 0 0 25px ${brandColor}44; flex-shrink: 0;" onerror="this.style.display='none'"></div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">ACTIVE TARGETS</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">WANTED BY ${faction}</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                            Sanctioned elimination contracts. Targets are considered armed and highly dangerous. Bounties are paid upon confirmed destruction of the target vessel.
                        </p>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');

    if (!currentStationBounties || currentStationBounties.length === 0) {
        if(typeof generateBountyTargets === 'function') generateBountyTargets();
    }

    if (playerActiveBounty) {
        listEl.innerHTML = `
            <div class="trade-item-row" style="background: rgba(255,0,0,0.1); border-left: 3px solid var(--danger); padding: 12px 10px; cursor: pointer;" onclick="showBountyDetails(playerActiveBounty, true)">
                <div style="color:var(--warning); font-size: 10px; letter-spacing: 1px; margin-bottom: 4px;">[ ACTIVE PURSUIT ]</div>
                <div style="color:var(--danger); font-weight:bold; font-size: 14px;">${playerActiveBounty.targetName}</div>
            </div>
        `;
        showBountyDetails(playerActiveBounty, true);
        return;
    }

    if(currentStationBounties && currentStationBounties.length > 0) {
        currentStationBounties.forEach(bounty => {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
            row.innerHTML = `
                <div>
                    <div style="color:var(--danger); font-weight:bold; font-size: 13px;">${bounty.targetName}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">Threat: Class ${bounty.difficulty}</div>
                </div>
                <div style="text-align:right;">
                    <span style="color:var(--gold-text, #FFD700); font-weight:bold;">${formatNumber(bounty.reward)}c</span>
                </div>
            `;
            row.onclick = () => showBountyDetails(bounty, false);
            listEl.appendChild(row);
        });
    } else {
        listEl.innerHTML = "<div style='padding:15px; color:#888; font-style:italic;'>No local bounties posted at this time.</div>";
    }
}

function showBountyDetails(bounty, isActive) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; filter: drop-shadow(0 0 15px var(--danger));">🎯</div>
            <h3 style="color:var(--danger); margin:0;">${bounty.targetName.toUpperCase()}</h3>
            <div style="color:var(--item-desc-color); font-size:12px; margin-bottom:15px; border-bottom: 1px solid #333; padding-bottom: 10px;">WANTED FOR: ${bounty.crime.toUpperCase()}</div>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid #333; padding:10px; border-radius:4px; text-align:left;">
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Threat Level:</span> <span style="color:var(--warning); font-weight:bold;">Class ${bounty.difficulty}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Vessel Type:</span> <span style="color:var(--text-color);">${bounty.shipClass}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Last Seen:</span> <span style="color:var(--accent-color);">Sector [${bounty.x}, ${bounty.y}]</span></div>
                <div style="margin-top:12px; border-top:1px dashed #444; padding-top:10px; display:flex; justify-content:space-between;"><span style="color:#888;">Bounty Payout:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(bounty.reward)}c</span></div>
            </div>
        </div>
    `;

    if (isActive) {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="abandonBounty()">ABANDON CONTRACT</button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color:var(--danger); color:var(--danger); margin-bottom: 10px;" onclick="acceptBounty('${bounty.id}')">ACCEPT CONTRACT</button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>
        `;
    }
}

// ==========================================
// --- BOUNTY BOARD HELPER FUNCTIONS ---
// ==========================================

function acceptBounty(bountyId) {
    const selected = currentStationBounties.find(b => b.id === bountyId);
    if (selected) {
        playerActiveBounty = selected;
        
        // --- 1. SPAWN THE SHIP ON THE MAP ---
        // We create a custom enemy object scaled to the bounty's difficulty
        const bountyShip = {
            id: selected.id,
            x: selected.x,
            y: selected.y,
            name: selected.targetName,
            shipClass: selected.shipClass,
            faction: selected.faction,
            isBountyTarget: true, // Special flag for the combat engine
            level: selected.difficulty,
            hp: selected.difficulty * 50,
            maxHp: selected.difficulty * 50,
            shields: selected.difficulty * 25,
            maxShields: selected.difficulty * 25,
            char: 'V', // The standard enemy vessel icon
            color: 'var(--danger)' // Bright red
        };
        
        // Inject them into the engine's active memory
        if (typeof activeEnemies !== 'undefined') {
            activeEnemies.push(bountyShip);
        }
        
        if (typeof showToast === 'function') showToast("BOUNTY ACCEPTED", "warning");
        logMessage(`Tracking target: ${selected.targetName}. Sensors indicate they are hiding at Sector [${selected.x}, ${selected.y}].`);
        
        openBountyBoard(); // Refresh UI to show the "Active" screen
        if (typeof render === 'function') render(); // Force map to update
    }
}

function abandonBounty() {
    if (playerActiveBounty) {
        // --- 2. CLEAN UP THE GHOST SHIP ---
        // If the player bails on the contract, we have to erase the ship from the map
        if (typeof activeEnemies !== 'undefined') {
            activeEnemies = activeEnemies.filter(e => e.id !== playerActiveBounty.id);
        }
        
        if (typeof showToast === 'function') showToast("BOUNTY ABANDONED", "info");
        logMessage(`You dropped the contract on ${playerActiveBounty.targetName}. Local security has been notified.`);
        
        playerActiveBounty = null;
        openBountyBoard(); // Refresh UI back to the list
        if (typeof render === 'function') render(); // Force map to update
    }
}

// ==========================================
// --- BOUNTY COMBAT RESOLUTION ---
// ==========================================

function processBountyVictory(defeatedEnemy) {
    // Check if we actually have an active bounty AND if the ship we just blew up matches the ID
    if (playerActiveBounty && defeatedEnemy.isBountyTarget && defeatedEnemy.id === playerActiveBounty.id) {
        
        // 1. Pay the player!
        if (typeof playerCredits !== 'undefined') {
            playerCredits += playerActiveBounty.reward;
        }
        
        // 2. Grant some bonus Combat XP based on the target's difficulty
        const xpGain = defeatedEnemy.level * 25;
        if (typeof playerXP !== 'undefined') {
            playerXP += xpGain;
            if (typeof checkLevelUp === 'function') checkLevelUp();
        }
        
        // 3. UI and Audio Notifications
        logMessage(`<span style="color:var(--success); font-weight:bold;">BOUNTY COMPLETE:</span> Target [${playerActiveBounty.targetName}] eliminated. Transferred ${formatNumber(playerActiveBounty.reward)}c to your account.`);
        if (typeof showToast === 'function') showToast(`BOUNTY COMPLETE: +${formatNumber(playerActiveBounty.reward)}c`, "success");
        if (typeof soundManager !== 'undefined' && typeof soundManager.playBuy === 'function') soundManager.playBuy(); 
        
        // 4. Remove the bounty from the station board so it doesn't show up again
        currentStationBounties = currentStationBounties.filter(b => b.id !== playerActiveBounty.id);
        
        // 5. Clear the active contract so the player can take another one!
        playerActiveBounty = null;
    }
}

/**
  * Selects a random, valid mission destination from the LOCATIONS_DATA.
  * Ensures the destination is not the same as the starting station AND that it buys items.
  * @param {string} currentStationName - The name of the station generating the mission.
  * @returns {object|null} A location object {name, key, coords} or null if no valid destination is found.
  */

 function selectRandomDestination(currentStationName) {
     const allLocationKeys = Object.keys(LOCATIONS_DATA);
     
     // FILTER:
     // 1. Must not be the current station (can't deliver to yourself).
     // 2. Must have a 'buys' array with at least one item (otherwise we can't generate a cargo type).
     const possibleDestinations = allLocationKeys.filter(key => {
         const loc = LOCATIONS_DATA[key];
         const hasTradeDemand = loc.buys && loc.buys.length > 0;
         return key !== currentStationName && hasTradeDemand;
     });

     if (possibleDestinations.length === 0) return null;

     const destinationKey = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
     const destinationData = LOCATIONS_DATA[destinationKey];

     return {
         name: destinationKey,
         key: "0,0",
         coords: destinationData.coords
     };
 }

 /**
  * Selects a random commodity that a specific location buys.
  * @param {string} locationName - The name of the location.
  * @returns {string|null} The ID of a commodity or null.
  */
 
function selectRandomCommodity(locationName) {
     const location = LOCATIONS_DATA[locationName];
     if (!location || !location.buys || location.buys.length === 0) return null;

     const commodity = location.buys[Math.floor(Math.random() * location.buys.length)];
     // Handles both {id: "..."} objects and plain "..." strings!
     return commodity.id || commodity; 
 }
