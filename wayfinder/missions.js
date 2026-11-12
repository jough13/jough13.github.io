// --- START OF FILE missions.js ---

// ==========================================
// --- CONTRACT & BOUNTY SYSTEM ---
// ==========================================

if (typeof window._stationBountyBannerAssignments === 'undefined') {
    window._stationBountyBannerAssignments = {};
}
if (typeof window._stationMissionLastRefresh === 'undefined') {
    window._stationMissionLastRefresh = {};
}

// Helper to keep progress keys synchronized across legacy and updated objective names
function syncActiveMissionProgress() {
    if (typeof playerActiveMission === 'undefined' || !playerActiveMission || !playerActiveMission.progress) return;
    const p = playerActiveMission.progress;

    // 1. Sync Bounty / Eliminate keys (combat.js increments eliminate_0, script_2.js templates use bounty_0)
    if (p.bounty_0 && !p.eliminate_0) p.eliminate_0 = p.bounty_0;
    else if (p.eliminate_0 && !p.bounty_0) p.bounty_0 = p.eliminate_0;
    else if (p.bounty_0 && p.eliminate_0 && p.bounty_0 !== p.eliminate_0) {
        const maxCur = Math.max(p.bounty_0.current || 0, p.eliminate_0.current || 0);
        const isComp = Boolean(p.bounty_0.complete || p.eliminate_0.complete);
        p.bounty_0.current = maxCur;
        p.bounty_0.complete = isComp;
        p.eliminate_0 = p.bounty_0;
    }

    // 2. Sync Delivery / Deliver keys
    if (p.delivery_0 && !p.deliver_0) p.deliver_0 = p.delivery_0;
    else if (p.deliver_0 && !p.delivery_0) p.delivery_0 = p.deliver_0;

    // 3. Sync Survey / Scan_Object keys
    if (p.survey_0 && !p.scan_object_0) p.scan_object_0 = p.survey_0;
    else if (p.scan_object_0 && !p.survey_0) p.survey_0 = p.scan_object_0;
}

function generateMissionsForStation(stationName) {
    const generatedMissions = [];
    const availableTemplates = MISSION_TEMPLATES.filter(t => playerLevel >= (t.prerequisites.minLevel || 1));
    
    // Generate 3 to 4 contracts per station
    const numMissionsToGenerate = 3 + Math.floor(Math.random() * 2);

    let attempts = 0;
    const MAX_ATTEMPTS = 25;

    const locationTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const giverFaction = locationTile ? (locationTile.faction || 'INDEPENDENT') : 'INDEPENDENT';

    while (generatedMissions.length < numMissionsToGenerate && availableTemplates.length > 0 && attempts < MAX_ATTEMPTS) {
        attempts++;

        try {
            const chosenTemplate = getWeightedRandomOutcome(availableTemplates);
            let newMission = JSON.parse(JSON.stringify(chosenTemplate));

            newMission.id = `${newMission.id_prefix}${attempts}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
            newMission.giver = stationName;
            newMission.faction = giverFaction;

            const objective = newMission.objective_templates[0];
            let success = true;

            switch (newMission.type) {
                case "BOUNTY": {
                    const pirateCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));
                    objective.count = pirateCount;
                    newMission.title = newMission.title_template.replace('{sectorName}', currentSectorName);
                    newMission.description = newMission.description_template
                        .replace('{sectorName}', currentSectorName)
                        .replace('{sectorCoords}', `(${currentSectorX},${-currentSectorY})`)
                        .replace('{count}', objective.count);
                    break;
                }

                case "DELIVERY": {
                    const destination = selectRandomDestination(stationName);
                    if (!destination) {
                        success = false;
                        break;
                    }

                    const deliveryItem = selectRandomCommodity(destination.name);
                    if (!deliveryItem || !COMMODITIES[deliveryItem]) {
                        success = false;
                        break;
                    }

                    const itemWeight = COMMODITIES[deliveryItem].weight || 1;
                    const maxHold = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
                    const maxSafeUnits = Math.max(1, Math.floor((maxHold * 0.7) / Math.max(1, itemWeight)));

                    let itemCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));
                    itemCount = Math.min(itemCount, maxSafeUnits);

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
                    if (!acquireItem || !COMMODITIES[acquireItem]) {
                        success = false;
                        break;
                    }

                    const itemWeight = COMMODITIES[acquireItem].weight || 1;
                    const maxHold = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
                    const maxSafeUnits = Math.max(1, Math.floor((maxHold * 0.7) / Math.max(1, itemWeight)));

                    let itemCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));
                    itemCount = Math.min(itemCount, maxSafeUnits);

                    objective.itemID = acquireItem;
                    objective.count = itemCount;

                    newMission.title = newMission.title_template.replace('{itemName}', COMMODITIES[acquireItem].name);
                    newMission.description = newMission.description_template
                        .replace('{count}', objective.count)
                        .replace('{itemName}', COMMODITIES[acquireItem].name);
                    break;
                }

                case "SURVEY": {
                    objective.targetType = 'anomaly';
                    objective.subtype = 'unstable warp pocket';
                    objective.sectorKey = "ANY";
                    newMission.title = newMission.title_template.replace('{subtype}', objective.subtype);
                    newMission.description = newMission.description_template.replace('{subtype}', objective.subtype);
                    break;
                }

                default:
                    success = false;
            }

            newMission.objectives = [objective];

            if (!newMission.rewards) {
                newMission.rewards = {};
            }

            // Scale rewards slightly with player level and cargo value
            const levelScale = 1 + Math.min(1.5, ((typeof playerLevel !== 'undefined' ? playerLevel : 1) - 1) * 0.1);
            let baseCreds = newMission.rewards_template.credits[0] + Math.floor(Math.random() * (newMission.rewards_template.credits[1] - newMission.rewards_template.credits[0] + 1));

            // Ensure ACQUIRE and DELIVERY missions reimburse the commodity's base cost + profit margin!
            if ((newMission.type === "ACQUIRE" || newMission.type === "DELIVERY") && objective.itemID && COMMODITIES[objective.itemID]) {
                const goodsValue = (COMMODITIES[objective.itemID].basePrice || 25) * (objective.count || 1);
                baseCreds = Math.max(baseCreds, Math.floor(goodsValue * 1.4) + 200);
            }

            newMission.rewards.credits = Math.floor(baseCreds * levelScale);
            newMission.rewards.xp = newMission.rewards_template.xp[0] + Math.floor(Math.random() * (newMission.rewards_template.xp[1] - newMission.rewards_template.xp[0] + 1));
            newMission.rewards.notoriety = newMission.rewards_template.notoriety[0] + Math.floor(Math.random() * (newMission.rewards_template.notoriety[1] - newMission.rewards_template.notoriety[0] + 1));

            if (success) {
                generatedMissions.push(newMission);
            }
        } catch (error) {
            console.error("Failed to generate a mission:", error);
        }
    }

    if (typeof currentGameDate !== 'undefined') {
        window._stationMissionLastRefresh[stationName] = currentGameDate;
    }
    return generatedMissions;
}

// --- DISPLAY MISSIONS MODAL ---
function displayMissionBoard(forceRefresh = false) {
    syncActiveMissionProgress();

    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : { name: "STARBASE", faction: "INDEPENDENT" };
    const stationName = location.name || "STARBASE";
    const faction = location.faction || "INDEPENDENT";
    
    let brandColor = "var(--accent-color)";
    if (faction === 'CONCORD') brandColor = "#4488FF";
    else if (faction === 'ECLIPSE') brandColor = "#9933FF";
    else if (faction === 'KTHARR') brandColor = "var(--danger)";
    else brandColor = "var(--success)";

    const lastRefresh = window._stationMissionLastRefresh[stationName] || 0;
    const timeElapsed = (typeof currentGameDate !== 'undefined' ? currentGameDate : 0) - lastRefresh;
    const remainingActive = (MISSIONS_DATABASE[stationName] || []).filter(m => !playerCompletedMissions.has(m.id));

    if (forceRefresh || !MISSIONS_DATABASE[stationName] || remainingActive.length === 0 || timeElapsed >= 20.0) {
        MISSIONS_DATABASE[stationName] = generateMissionsForStation(stationName);
    }

    // Ensure the player's currently active mission is visible at its giver or destination station
    if (playerActiveMission && !MISSIONS_DATABASE[stationName].some(m => m.id === playerActiveMission.id)) {
        const obj = playerActiveMission.objectives && playerActiveMission.objectives[0];
        if (playerActiveMission.giver === stationName || (obj && obj.destinationName === stationName)) {
            MISSIONS_DATABASE[stationName].unshift(playerActiveMission);
        }
    }
    
    openGenericModal(`${stationName.toUpperCase()} : CONTRACTS`);
    
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
                <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px; display:flex; justify-content:space-between; align-items:center;">
                    <span>AVAILABLE CONTRACTS</span>
                    <button class="icon-btn" style="padding:2px 6px; font-size:9px;" onclick="displayMissionBoard(true)" title="Refresh Local Postings">⟳ REFRESH</button>
                </div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">LOCAL CONTRACTS</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                            Review available bounties, courier requests, and exploration directives. Accepting a contract requires a commitment, and completing it boosts your standing with the issuing faction.
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
    let activeMissionIdx = -1;

    missions.forEach((mission, index) => {
        if (playerCompletedMissions.has(mission.id)) return;
        foundActive = true;
        
        const isCurrentMission = playerActiveMission && playerActiveMission.id === mission.id;
        if (isCurrentMission) activeMissionIdx = index;
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
        
        let typeColor = "var(--success)";
        if (mission.type === 'BOUNTY') typeColor = "var(--danger)";
        if (mission.type === 'DELIVERY') typeColor = "var(--warning)";
        if (mission.type === 'SURVEY') typeColor = "#4488FF";

        if (isCurrentMission) {
            row.style.background = 'rgba(0, 224, 224, 0.1)';
            row.style.borderLeft = `3px solid ${typeColor}`;
        }

        const statusBadge = isCurrentMission
            ? (playerActiveMission.isComplete ? '[ READY FOR TURN-IN ]' : '[ ACTIVE CONTRACT ]')
            : `[ ${mission.type} ]`;

        row.innerHTML = `
            <div>
                <div style="color:var(--text-color); font-weight:bold; font-size: 13px;">${mission.title}</div>
                <div style="color:${isCurrentMission && playerActiveMission.isComplete ? 'var(--success)' : typeColor}; font-size: 10px; letter-spacing: 1px; margin-top: 4px;">${statusBadge}</div>
            </div>
            <div style="text-align:right;">
                <span style="color:var(--gold-text, #FFD700); font-weight:bold;">${formatNumber(mission.rewards.credits)}c</span>
            </div>
        `;
        row.onclick = () => showMissionDetails(stationName, index, brandColor);
        listEl.appendChild(row);
    });
    
    if (!foundActive) {
        listEl.innerHTML = "<div style='padding:15px; color:#888; font-style:italic;'>No contracts currently available. Click REFRESH to query subspace relays.</div>";
    } else if (activeMissionIdx !== -1) {
        showMissionDetails(stationName, activeMissionIdx, brandColor);
    }
}

function showMissionDetails(stationName, index, brandColor) {
    syncActiveMissionProgress();

    const mission = MISSIONS_DATABASE[stationName][index];
    if (!mission) return;

    const isThisMission = playerActiveMission && playerActiveMission.id === mission.id;
    const hasOtherMission = playerActiveMission && playerActiveMission.id !== mission.id;
    const activeMission = isThisMission ? playerActiveMission : mission;
    const obj = activeMission.objectives && activeMission.objectives[0] ? activeMission.objectives[0] : null;
    
    let typeColor = "var(--success)";
    if (activeMission.type === 'BOUNTY') typeColor = "var(--danger)";
    if (activeMission.type === 'DELIVERY') typeColor = "var(--warning)";
    if (activeMission.type === 'SURVEY') typeColor = "#4488FF";

    let html = `
        <div style="font-size:10px; color:${typeColor}; letter-spacing:2px; margin-bottom:5px;">
            [ ${activeMission.type} CONTRACT ]
        </div>
        <h3 style="color:${brandColor}; margin:0 0 5px 0;">${activeMission.title}</h3>
        <p style="font-size:11px; color:var(--item-desc-color); border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px;">Client: ${activeMission.giver} (${activeMission.faction || 'INDEPENDENT'})</p>
        
        <p style="color:var(--text-color); font-size:12px; line-height: 1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${typeColor}; margin-bottom:20px;">
            "${activeMission.description}"
        </p>
        
        <div class="trade-math-area">
            <div style="font-size:10px; color:${brandColor}; letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">REWARD TELEMETRY</div>
            <div class="trade-stat-row"><span style="color:var(--item-desc-color);">Credits:</span> <span style="color:var(--gold-text, #FFD700); font-weight:bold;">${formatNumber(activeMission.rewards.credits)}c</span></div>
            <div class="trade-stat-row"><span style="color:var(--item-desc-color);">Experience:</span> <span style="color:var(--success, #00FF00); font-weight:bold;">+${formatNumber(activeMission.rewards.xp)} XP</span></div>
            ${activeMission.faction && activeMission.faction !== 'INDEPENDENT' ? `<div class="trade-stat-row"><span style="color:var(--item-desc-color);">${activeMission.faction} Standing:</span> <span style="color:var(--accent-color); font-weight:bold;">+${Math.max(5, Math.abs(activeMission.rewards.notoriety || 5))} Rep</span></div>` : ''}
        </div>
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;
    
    let btnHtml = "";
    
    if (isThisMission) {
        // Check if we can complete or claim this mission right here!
        if (playerActiveMission.isComplete && playerActiveMission.giver === stationName) {
            btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--success); color:var(--success); box-shadow: 0 0 15px rgba(0,255,0,0.2);" onclick="grantMissionRewards(); displayMissionBoard();">🏆 CLAIM CONTRACT REWARD</button>`;
        } else if (!playerActiveMission.isComplete && playerActiveMission.type === "DELIVERY" && obj && obj.destinationName === stationName) {
            const haveQty = playerCargo[obj.itemID] || 0;
            const canDeliver = haveQty >= obj.count;
            btnHtml += `<button class="action-button" ${!canDeliver ? 'disabled' : ''} style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--gold-text); color:var(--gold-text);" onclick="handleCompleteDelivery(); displayMissionBoard();">📦 DELIVER CARGO (${haveQty}/${obj.count})</button>`;
        } else if (!playerActiveMission.isComplete && playerActiveMission.type === "ACQUIRE" && obj && playerActiveMission.giver === stationName) {
            const haveQty = playerCargo[obj.itemID] || 0;
            const canTurnIn = haveQty >= obj.count;
            btnHtml += `<button class="action-button" ${!canTurnIn ? 'disabled' : ''} style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--gold-text); color:var(--gold-text);" onclick="handleTurnInAcquire(); displayMissionBoard();">💎 TURN IN RESOURCES (${haveQty}/${obj.count})</button>`;
        }

        btnHtml += `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="abandonMission()">ABANDON CONTRACT</button>`;
    } else if (hasOtherMission) {
        btnHtml = `<button class="action-button" disabled style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;">FINISH CURRENT JOB FIRST</button>`;
    } else {
        btnHtml = `<button class="action-button" style="border-color:${brandColor}; color:${brandColor}; width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="confirmAcceptMission('${stationName.replace(/'/g, "\\'")}', ${index})">AUTHORIZE CONTRACT</button>`;
    }
    
    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openStationView()">◀ BACK TO CONCOURSE</button>`;
    
    document.getElementById('genericModalActions').innerHTML = btnHtml;
}

function confirmAcceptMission(stationName, index) {
    const mission = MISSIONS_DATABASE[stationName][index];
    if (!mission) return;
    
    playerActiveMission = JSON.parse(JSON.stringify(mission));
    playerActiveMission.isComplete = false;
    playerActiveMission.progress = {};
    
    playerActiveMission.objectives.forEach((obj, idx) => {
        const key = `${obj.type.toLowerCase()}_${idx}`;
        if (obj.type === "ELIMINATE" || obj.type === "BOUNTY") {
            const progObj = { current: 0, required: obj.count, complete: false };
            playerActiveMission.progress[key] = progObj;
            playerActiveMission.progress[`eliminate_${idx}`] = progObj;
            playerActiveMission.progress[`bounty_${idx}`] = progObj;
        } else if (obj.type === "DELIVERY" || obj.type === "DELIVER") {
            const progObj = { delivered: 0, required: obj.count, complete: false, destinationName: obj.destinationName };
            playerActiveMission.progress[key] = progObj;
            playerActiveMission.progress[`delivery_${idx}`] = progObj;
            playerActiveMission.progress[`deliver_${idx}`] = progObj;
        } else if (obj.type === "SURVEY" || obj.type === "SCAN_OBJECT") {
            const progObj = { scanned: false, complete: false };
            playerActiveMission.progress[key] = progObj;
            playerActiveMission.progress[`survey_${idx}`] = progObj;
            playerActiveMission.progress[`scan_object_${idx}`] = progObj;
        } else if (obj.type === "ACQUIRE") {
            playerActiveMission.progress[key] = { acquired: 0, required: obj.count, complete: false };
        }
    });

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    showToast("CONTRACT ACCEPTED", "success");
    logMessage(`<span style='color:var(--accent-color)'>[ CONTRACT AUTHORIZED ]</span> ${playerActiveMission.title}.`);
    closeGenericModal();
    openStationView();
    renderMissionTracker();
}

function abandonMission() {
    if (playerActiveMission) {
        // If abandoning a Hot Cargo smuggling run, remove the tracked contraband crate
        if (playerActiveMission.id && playerActiveMission.id.startsWith("SMUGGLE_") && playerCargo['HOT_CARGO']) {
            delete playerCargo['HOT_CARGO'];
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
        logMessage(`You dropped the contract: ${playerActiveMission.title}.`);
        if (typeof showToast === 'function') showToast("CONTRACT ABANDONED", "info");
        playerActiveMission = null;
        renderMissionTracker();
        
        displayMissionBoard();
    }
}

/**
 * Handles turning in resources for an ACQUIRE mission at the giver's station.
 */
function handleTurnInAcquire() {
    syncActiveMissionProgress();
    if (!playerActiveMission || playerActiveMission.type !== "ACQUIRE" || playerActiveMission.isComplete) {
        logMessage("No active acquisition mission to turn in here.");
        return;
    }

    const objective = playerActiveMission.objectives[0];
    const progressKey = `acquire_0`;
    const objectiveProgress = playerActiveMission.progress[progressKey];

    if ((playerCargo[objective.itemID] || 0) >= objective.count) {
        playerCargo[objective.itemID] -= objective.count;
        if (playerCargo[objective.itemID] <= 0) delete playerCargo[objective.itemID]; 
        updateCurrentCargoLoad();
        objectiveProgress.acquired = objective.count;
        objectiveProgress.complete = true;
        logMessage(`<span style='color:var(--success)'>Turned in ${objective.count}x ${COMMODITIES[objective.itemID].name} to ${playerActiveMission.giver}.</span>`);
        if (typeof showToast === 'function') showToast("RESOURCES DELIVERED", "success");
        checkMissionObjectiveCompletion();
    } else {
        logMessage(`You don't have enough ${COMMODITIES[objective.itemID].name}. Required: ${objective.count}, You have: ${playerCargo[objective.itemID] || 0}.`);
        if (typeof showToast === 'function') showToast("INSUFFICIENT RESOURCES", "error");
    }

    renderMissionTracker();
    renderUIStats();
}

function handleCompleteDelivery() {
    syncActiveMissionProgress();
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
        if (obj.type === "DELIVERY" || obj.type === "DELIVER") {
            const progressKey = `${obj.type.toLowerCase()}_${index}`;
            const objectiveProgress = playerActiveMission.progress[progressKey] || playerActiveMission.progress[`delivery_${index}`] || playerActiveMission.progress[`deliver_${index}`];
            if (objectiveProgress && !objectiveProgress.complete && currentLocation.name === obj.destinationName) {
                if ((playerCargo[obj.itemID] || 0) >= obj.count) {
                    playerCargo[obj.itemID] -= obj.count;
                    if (playerCargo[obj.itemID] <= 0) delete playerCargo[obj.itemID]; 
                    updateCurrentCargoLoad();
                    objectiveProgress.delivered = obj.count;
                    objectiveProgress.complete = true;
                    logMessage(`<span style='color:var(--success)'>Delivered ${obj.count}x ${COMMODITIES[obj.itemID].name} to ${obj.destinationName}.</span>`, true);
                    if (typeof showToast === 'function') showToast("CARGO DELIVERED", "success");
                    deliveryMade = true;
                } else {
                    logMessage(`You don't have enough ${COMMODITIES[obj.itemID].name}. Required: ${obj.count}, You have: ${playerCargo[obj.itemID] || 0}.`, true);
                    if (typeof showToast === 'function') showToast("MISSING DELIVERY CARGO", "error");
                }
            }
        }
    });
    if (deliveryMade) {
        checkMissionObjectiveCompletion();
    }
    renderMissionTracker();
    renderUIStats();
}

function checkMissionObjectiveCompletion() {
    syncActiveMissionProgress();
    if (!playerActiveMission || playerActiveMission.isComplete) return false;
    
    let allObjectivesNowComplete = true;
    
    for (let i = 0; i < playerActiveMission.objectives.length; i++) {
        const objective = playerActiveMission.objectives[i];
        const progressKey = `${objective.type.toLowerCase()}_${i}`;
        const objectiveProgress = playerActiveMission.progress[progressKey] ||
                                  playerActiveMission.progress[`eliminate_${i}`] ||
                                  playerActiveMission.progress[`bounty_${i}`] ||
                                  playerActiveMission.progress[`delivery_${i}`] ||
                                  playerActiveMission.progress[`survey_${i}`];
        
        if (!objectiveProgress || !objectiveProgress.complete) {
            allObjectivesNowComplete = false;
            break;
        }
    }
    
    if (allObjectivesNowComplete && !playerActiveMission.isComplete) {
        playerActiveMission.isComplete = true;
        logMessage(`<span style='color:var(--success); font-weight:bold;'>All objectives for '${playerActiveMission.title}' complete!</span>\nReturn to ${playerActiveMission.giver} to claim your reward.`, true);
        if (typeof showToast === 'function') showToast("CONTRACT OBJECTIVES COMPLETE", "success");
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    }
    
    return allObjectivesNowComplete;
}

function grantMissionRewards() {
    syncActiveMissionProgress();
    if (!playerActiveMission || !playerActiveMission.isComplete) return;
     
    const currentLocation = getCombinedLocationData(playerX, playerY);
    const isShadowBrokerClaim = playerActiveMission.giver === "Shadow Broker" && currentLocation && currentLocation.isBlackMarket;
     
    if (!currentLocation || (currentLocation.name !== playerActiveMission.giver && !isShadowBrokerClaim)) {
        logMessage("You must be at " + playerActiveMission.giver + " to claim this reward.");
        return;
    }

    const mission = playerActiveMission;
    playerCredits += mission.rewards.credits;
    playerXP += mission.rewards.xp;
     
    updatePlayerNotoriety(mission.rewards.notoriety);
     
    let standingMsg = "";
    const targetFaction = (mission.faction && mission.faction !== 'INDEPENDENT') ? mission.faction : (currentLocation.faction !== 'INDEPENDENT' ? currentLocation.faction : null);

    if (targetFaction) {
        const repGain = Math.max(5, Math.abs(mission.rewards.notoriety || 5));
        playerFactionStanding[targetFaction] = (playerFactionStanding[targetFaction] || 0) + repGain;
        standingMsg = `\n  ${targetFaction} Standing: +${repGain}`;
    }

    playerCompletedMissions.add(mission.id);
     
    let rewardMsg = `<span style='color:var(--gold-text); font-weight:bold;'>Mission '${mission.title}' Complete!</span>\nRewards:\n  +${formatNumber(mission.rewards.credits)} Credits\n  +${formatNumber(mission.rewards.xp)} XP`;

    if (mission.rewards.notoriety !== 0) {
        rewardMsg += `\n  Notoriety ${mission.rewards.notoriety > 0 ? '+' : ''}${mission.rewards.notoriety}`;
    }
    rewardMsg += standingMsg;

    playerActiveMission = null;
    currentMissionContext = null;
    logMessage(rewardMsg);
    if (typeof showToast === 'function') showToast(`REWARD CLAIMED: +${formatNumber(mission.rewards.credits)}c`, "success");
    if (typeof soundManager !== 'undefined') soundManager.playGain();
     
    const leveledUp = checkLevelUp();
     
    if (!leveledUp) {
        const stationModal = document.getElementById('stationOverlay');
        if (stationModal && stationModal.style.display === 'flex' && typeof openStationView === 'function') {
            openStationView();
        }
    }
     
    renderMissionTracker(); 
    renderUIStats();
}

function renderMissionTracker() {
    syncActiveMissionProgress();
    const textEl = document.getElementById('missionText');
    if (!textEl) return;
    
    if (!playerActiveMission) {
        textEl.textContent = "No Active Contract";
        textEl.style.color = "#555";
        return;
    }

    let objectiveText = "Objective Unknown";
    const objective = playerActiveMission.objectives[0];
    const progress = playerActiveMission.progress[`${objective.type.toLowerCase()}_0`] ||
                     playerActiveMission.progress.eliminate_0 ||
                     playerActiveMission.progress.bounty_0 ||
                     playerActiveMission.progress.delivery_0 ||
                     playerActiveMission.progress.survey_0;

    if (playerActiveMission.isComplete) {
        objectiveText = `[READY] Return to ${playerActiveMission.giver}`;
        textEl.style.color = "var(--success)";
        textEl.textContent = `${playerActiveMission.title}: ${objectiveText}`;
        return; 
    } 
    
    if (objective.type === 'BOUNTY' || objective.type === 'ELIMINATE') {
        objectiveText = `Hunt Targets (${progress ? progress.current : 0}/${objective.count})`;
    } else if (objective.type === 'DELIVERY' || objective.type === 'DELIVER') {
        const haveQty = playerCargo[objective.itemID] || 0;
        const itemName = COMMODITIES[objective.itemID] ? COMMODITIES[objective.itemID].name : "Cargo";
        objectiveText = `Deliver ${objective.count}x ${itemName} to ${objective.destinationName} (Hold: ${haveQty})`;
    } else if (objective.type === 'SURVEY' || objective.type === 'SCAN_OBJECT') {
        objectiveText = `Survey Anomaly (?)`;
    } else if (objective.type === 'ACQUIRE') {
        const currentAmt = playerCargo[objective.itemID] || 0;
        const itemName = COMMODITIES[objective.itemID] ? COMMODITIES[objective.itemID].name : "Unknown Item";
        objectiveText = `Acquire ${itemName} (${currentAmt}/${objective.count})`;
    }

    textEl.textContent = `${playerActiveMission.title}: ${objectiveText}`;
    textEl.style.color = "#FFD700";
}

// ==========================================
// --- BOUNTY BOARD UI & LOGIC ---
// ==========================================

function openBountyBoard() {
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : { name: "STARBASE", faction: "CONCORD" };
    const stationName = location.name || "STARBASE";
    const faction = location.faction || "CONCORD";
    
    let brandColor = "var(--danger)";

    openGenericModal(`${stationName.toUpperCase()} : BOUNTY BOARD`);
    
    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";
    
    const availableBanners = ['assets/bounty_banner.png', 'assets/bounty_banner2.png'];
    let assignedBanner = window._stationBountyBannerAssignments[stationName];
    
    if (!assignedBanner) {
        assignedBanner = availableBanners[Math.floor(Math.random() * availableBanners.length)];
        window._stationBountyBannerAssignments[stationName] = assignedBanner;
    }

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; background: url('${assignedBanner}') center/cover; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 15px; box-shadow: 0 0 25px ${brandColor}44; flex-shrink: 0;" onerror="this.style.display='none'"></div>
    `;

    const hasLegendaryBoard = typeof openLegendaryBounties === 'function';

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px; display:flex; justify-content:space-between; align-items:center;">
                    <span>ACTIVE TARGETS</span>
                    ${hasLegendaryBoard ? `<button class="icon-btn" style="padding:2px 6px; font-size:9px; border-color:var(--gold-text); color:var(--gold-text);" onclick="openLegendaryBounties()">★ HIGH-VALUE TARGETS</button>` : ''}
                </div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">WANTED BY ${faction}</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                            Sanctioned elimination contracts. Targets are considered armed and highly dangerous. Bounties are paid immediately upon confirmed destruction of the target vessel.
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
        generateBountyTargets();
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

    if (currentStationBounties && currentStationBounties.length > 0) {
        currentStationBounties.forEach(bounty => {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
            
            let facColor = "var(--danger)";
            if (bounty.faction === "KTHARR") facColor = "var(--success)";
            if (bounty.faction === "INDEPENDENT") facColor = "var(--warning)";

            row.innerHTML = `
                <div>
                    <div style="color:${facColor}; font-weight:bold; font-size: 13px;">${bounty.targetName}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">Threat: Class ${bounty.difficulty} (${bounty.shipClass})</div>
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

    let facColor = "var(--danger)";
    if (bounty.faction === "KTHARR") facColor = "var(--success)";
    if (bounty.faction === "INDEPENDENT") facColor = "var(--warning)";

    const shipDisplayName = (typeof PIRATE_SHIP_CLASSES !== 'undefined' && PIRATE_SHIP_CLASSES[bounty.shipClass])
        ? PIRATE_SHIP_CLASSES[bounty.shipClass].name
        : bounty.shipClass;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; filter: drop-shadow(0 0 15px ${facColor});">🎯</div>
            <h3 style="color:${facColor}; margin:0;">${bounty.targetName.toUpperCase()}</h3>
            <div style="color:var(--item-desc-color); font-size:12px; margin-bottom:15px; border-bottom: 1px solid #333; padding-bottom: 10px;">WANTED FOR: ${bounty.crime.toUpperCase()}</div>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid #333; padding:10px; border-radius:4px; text-align:left;">
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Threat Level:</span> <span style="color:var(--warning); font-weight:bold;">Class ${bounty.difficulty}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Vessel Type:</span> <span style="color:var(--text-color);">${shipDisplayName}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Alliance:</span> <span style="color:${facColor};">${bounty.faction}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Last Seen:</span> <span style="color:var(--accent-color);">Coords [${bounty.x}, ${-bounty.y}]</span></div>
                
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

function spawnBountyEntityOnMap(bounty) {
    if (!bounty || typeof activeEnemies === 'undefined') return;

    // Normalize legacy invalid shipClass keys (e.g., "SCOUT" -> "RAIDER")
    let validClassKey = bounty.shipClass || "RAIDER";
    if (typeof PIRATE_SHIP_CLASSES !== 'undefined' && !PIRATE_SHIP_CLASSES[validClassKey]) {
        validClassKey = bounty.difficulty > 5 ? "STRIKER" : "RAIDER";
        bounty.shipClass = validClassKey;
    }

    activeEnemies = activeEnemies.filter(e => e.id !== bounty.id);
    activeEnemies.push({
        id: bounty.id,
        x: bounty.x,
        y: bounty.y,
        name: bounty.targetName,
        shipClass: validClassKey,
        shipClassKey: validClassKey,
        faction: bounty.faction || "ECLIPSE",
        isBountyTarget: true, 
        level: bounty.difficulty,
        hp: bounty.difficulty * 50,
        maxHp: bounty.difficulty * 50,
        shields: bounty.difficulty * 25,
        maxShields: bounty.difficulty * 25,
        char: 'V', 
        color: '#FF4444' 
    });
}

function acceptBounty(bountyId) {
    const selected = currentStationBounties.find(b => b.id === bountyId);
    if (selected) {
        playerActiveBounty = selected;
        spawnBountyEntityOnMap(selected);
        
        if (typeof showToast === 'function') showToast("BOUNTY ACCEPTED", "warning");
        logMessage(`Tracking target: <b>${selected.targetName}</b>. Sensors indicate they are hiding near [${selected.x}, ${-selected.y}].`);
        
        openBountyBoard();
        if (typeof render === 'function') render();
    }
}

function abandonBounty() {
    if (playerActiveBounty) {
        if (typeof activeEnemies !== 'undefined') {
            activeEnemies = activeEnemies.filter(e => e.id !== playerActiveBounty.id);
        }
        
        if (typeof showToast === 'function') showToast("BOUNTY ABANDONED", "info");
        logMessage(`You dropped the contract on ${playerActiveBounty.targetName}. Local security has been notified.`);
        
        playerActiveBounty = null;
        openBountyBoard();
        if (typeof render === 'function') render();
    }
}

function processBountyVictory(defeatedEnemy) {
    if (playerActiveBounty && defeatedEnemy && defeatedEnemy.isBountyTarget && defeatedEnemy.id === playerActiveBounty.id) {
        if (typeof playerCredits !== 'undefined') {
            playerCredits += playerActiveBounty.reward;
        }
        
        const xpGain = (defeatedEnemy.level || playerActiveBounty.difficulty || 1) * 25;
        if (typeof playerXP !== 'undefined') {
            playerXP += xpGain;
        }
        
        logMessage(`<span style="color:var(--success); font-weight:bold;">BOUNTY COMPLETE:</span> Target [${playerActiveBounty.targetName}] eliminated. Transferred ${formatNumber(playerActiveBounty.reward)}c to your account.`);
        if (typeof showToast === 'function') showToast(`BOUNTY COMPLETE: +${formatNumber(playerActiveBounty.reward)}c`, "success");
        if (typeof soundManager !== 'undefined' && typeof soundManager.playBuy === 'function') soundManager.playBuy(); 
        
        currentStationBounties = currentStationBounties.filter(b => b.id !== playerActiveBounty.id);
        playerActiveBounty = null;
    }
}

function createStationBountyTargets() {
    currentStationBounties = [];
    const numBounties = Math.floor(Math.random() * 3) + 2; // 2 to 4 bounties per station
    
    const firstNames = ["'Mad Dog'", "Viper", "'Iron'", "Jax", "Silas", "Kaelen", "'Ghost'", "Rook", "Vane", "Kira"];
    const lastNames = ["Vance", "Karn", "Trex", "the Butcher", "Valerius", "Thorne", "Graves", "Black", "Kryik"];
    const crimeList = ["Smuggling", "Piracy", "Assassination", "Data Theft", "Illegal Cybernetics", "Shipjacking"];
    
    for (let i = 0; i < numBounties; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.floor(Math.random() * 15) + 5; // 5 to 20 tiles away
        
        const targetX = Math.floor(playerX + Math.cos(angle) * distance);
        const targetY = Math.floor(playerY + Math.sin(angle) * distance);
        
        let difficultyLevel = playerLevel;
        if (Math.random() > 0.7) difficultyLevel += 2; 
        
        const factionList = ["ECLIPSE", "ECLIPSE", "KTHARR", "INDEPENDENT"];
        const targetFaction = factionList[Math.floor(Math.random() * factionList.length)];
        
        let shipClass = "RAIDER";
        if (targetFaction === "ECLIPSE" || targetFaction === "INDEPENDENT") {
            if (difficultyLevel > 6) shipClass = "BRUISER";
            else if (difficultyLevel > 3) shipClass = "STRIKER";
        } else if (targetFaction === "KTHARR") {
            shipClass = difficultyLevel > 5 ? "KTHARR_DESTROYER" : "KTHARR_SCOUT";
        }
        
        const baseReward = (difficultyLevel * 1500) + Math.floor(Math.random() * 500);
        const distanceBonus = distance * 50;
        const totalReward = baseReward + distanceBonus;
        
        currentStationBounties.push({
            id: `BOUNTY_${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`,
            targetName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            crime: crimeList[Math.floor(Math.random() * crimeList.length)],
            x: targetX,
            y: targetY,
            difficulty: difficultyLevel,
            reward: totalReward, 
            faction: targetFaction, 
            shipClass: shipClass 
        });
    }
}

window.generateBountyTargets = createStationBountyTargets;

function selectRandomDestination(currentStationName) {
    const allLocationKeys = Object.keys(LOCATIONS_DATA);
     
    const possibleDestinations = allLocationKeys.filter(key => {
        const loc = LOCATIONS_DATA[key];
        const hasTradeDemand = loc.buys && loc.buys.length > 0;
        return key !== currentStationName && key !== "Planet Xerxes" && hasTradeDemand;
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

function selectRandomCommodity(locationName) {
    const location = LOCATIONS_DATA[locationName];
    if (!location || !location.buys || location.buys.length === 0) return null;

    const commodity = location.buys[Math.floor(Math.random() * location.buys.length)];
    return commodity.id || commodity; 
}

// ==========================================
// --- SELF-CONTAINED MISSION & BOUNTY HOOKS ---
// ==========================================

if (typeof GameBus !== 'undefined') {
    // 1. Live-update the Mission Tracker whenever cargo changes (for ACQUIRE / DELIVERY contracts)
    GameBus.on('CARGO_MODIFIED', () => {
        if (typeof playerActiveMission !== 'undefined' && playerActiveMission) {
            renderMissionTracker();
        }
    });

    // 2. Keep active bounty target alive in activeEnemies even if the player warps > 100 tiles away
    GameBus.on('TICK_PROCESSED', (tick) => {
        if (!tick || tick.interrupt) return;
        syncActiveMissionProgress();

        if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty && typeof activeEnemies !== 'undefined') {
            if (typeof currentCombatContext === 'undefined' || !currentCombatContext) {
                const trackedEnemy = activeEnemies.find(e => e.id === playerActiveBounty.id);
                if (trackedEnemy) {
                    // Keep bounty compass coordinates synced with the moving target!
                    playerActiveBounty.x = trackedEnemy.x;
                    playerActiveBounty.y = trackedEnemy.y;
                } else {
                    spawnBountyEntityOnMap(playerActiveBounty);
                }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    // 1. Override script.js's duplicate generateBountyTargets with our valid ship-class version
    window.generateBountyTargets = createStationBountyTargets;

    // 2. Prevent Bounty Targets from triggering Pirate Extortion or Eclipse Cartel Truces
    if (typeof window.initiatePirateExtortion === 'function' && !window._missionsExtortionPatched) {
        const origExtortion = window.initiatePirateExtortion;
        window.initiatePirateExtortion = function(enemy) {
            if (enemy && enemy.isBountyTarget) {
                logMessage(`<span style='color:var(--danger); font-weight:bold;'>[ BOUNTY INTERCEPTED ]</span> Target <b>${enemy.name}</b> locked in sights! Engaging weapons!`);
                if (typeof startCombat === 'function') startCombat(enemy);
                return;
            }
            return origExtortion.apply(this, arguments);
        };
        window._missionsExtortionPatched = true;
    }

    if (typeof window.startCombat === 'function' && !window._missionsCombatTrucePatched) {
        const origStartCombat = window.startCombat;
        window.startCombat = function(specificEnemyEntity = null) {
            // Temporarily mask Eclipse standing if fighting an Eclipse Bounty Target so the truce doesn't cancel the fight!
            const isBounty = specificEnemyEntity && specificEnemyEntity.isBountyTarget;
            const savedEclipseRep = (isBounty && typeof playerFactionStanding !== 'undefined') ? playerFactionStanding['ECLIPSE'] : null;

            if (isBounty && savedEclipseRep !== null && savedEclipseRep >= 50) {
                playerFactionStanding['ECLIPSE'] = 0;
            }

            try {
                origStartCombat.apply(this, arguments);
            } finally {
                if (isBounty && savedEclipseRep !== null) {
                    playerFactionStanding['ECLIPSE'] = savedEclipseRep;
                }
            }
        };
        window._missionsCombatTrucePatched = true;
    }

    // 3. Wrap handleVictory in combat.js so `bounty_0` and `eliminate_0` always stay synced on pirate kills
    if (typeof window.handleVictory === 'function' && !window._missionsVictoryPatched) {
        const origHandleVictory = window.handleVictory;
        window.handleVictory = function() {
            syncActiveMissionProgress();
            origHandleVictory.apply(this, arguments);
            syncActiveMissionProgress();
        };
        window._missionsVictoryPatched = true;
    }
});

// --- END OF FILE missions.js ---
