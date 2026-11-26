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

// ==========================================
// --- INTERNAL MISSION HELPERS ---
// ==========================================

function _missionEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _missionFindLocation(nameOrKey) {
    if (!nameOrKey || typeof LOCATIONS_DATA === 'undefined') return null;
    if (LOCATIONS_DATA[nameOrKey]) return LOCATIONS_DATA[nameOrKey];
    for (const key in LOCATIONS_DATA) {
        if (LOCATIONS_DATA[key] && LOCATIONS_DATA[key].name === nameOrKey) {
            return LOCATIONS_DATA[key];
        }
    }
    return null;
}

function _missionBearing(dx, dy) {
    if (dx === 0 && dy === 0) return "HERE";
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const idx = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return dirs[(idx + 8) % 8];
}

function _missionDistAndBearing(targetX, targetY) {
    const px = typeof playerX !== 'undefined' ? playerX : 0;
    const py = typeof playerY !== 'undefined' ? playerY : 0;
    const dx = targetX - px;
    const dy = targetY - py;
    return {
        distance: Math.floor(Math.sqrt(dx * dx + dy * dy)),
        bearing: _missionBearing(dx, dy)
    };
}

// Safely close the generic modal before returning to the underlying station or Xerxes concourse
function returnToConcourseFromMissions() {
    if (typeof closeGenericModal === 'function') closeGenericModal();
    const xerxesEl = document.getElementById('xerxesOverlay');
    const stationEl = document.getElementById('stationOverlay');

    if (xerxesEl && xerxesEl.style.display === 'flex') return;
    if (stationEl && stationEl.style.display === 'flex') return;

    const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    if (tile && tile.type === 'location') {
        if (tile.name && tile.name.includes('Xerxes') && typeof openXerxesView === 'function') {
            openXerxesView();
        } else if ((tile.isMajorHub || tile.char === OUTPOST_CHAR_VAL) && typeof openStationView === 'function') {
            openStationView();
        }
    }
}

// Inject expanded faction & frontier mission templates into MISSION_TEMPLATES once
function _ensureExpandedMissionTemplates() {
    if (typeof MISSION_TEMPLATES === 'undefined' || !Array.isArray(MISSION_TEMPLATES) || window._missionsTemplatesExpanded) return;

    const extraTemplates = [
        {
            id_prefix: "SALVAGE_RECOVERY_",
            type: "ACQUIRE",
            weight: 2,
            title_template: "Salvage Recovery: {itemName}",
            briefing_template: "Engineering teams require salvaged {itemName} from deep space.",
            description_template: "Our shipyards are running critically low on {itemName}. Salvage, mine, or trade for {count} units and deliver them to our quartermaster for immediate compensation.",
            objective_templates: [{
                type: "ACQUIRE",
                itemID: "SALVAGE_POOL",
                count: [3, 7]
            }],
            rewards_template: {
                credits: [450, 950],
                xp: [60, 120],
                notoriety: [-2, -1]
            },
            prerequisites: { minLevel: 1 }
        },
        {
            id_prefix: "BLACK_MARKET_ACQUIRE_",
            type: "ACQUIRE",
            weight: 2,
            onlyBlackMarket: true,
            title_template: "Syndicate Procurement: {itemName}",
            briefing_template: "Shadow Network brokers are paying top credit for {itemName}.",
            description_template: "A discreet buyer at this port requires {count} units of {itemName}. Bypass Concord patrols and bring the goods directly to our dock.",
            objective_templates: [{
                type: "ACQUIRE",
                itemID: "CONTRABAND_POOL",
                count: [2, 5]
            }],
            rewards_template: {
                credits: [1200, 2600],
                xp: [100, 180],
                notoriety: [3, 6]
            },
            prerequisites: { minLevel: 2 }
        },
        {
            id_prefix: "ASTRO_SURVEY_",
            type: "SURVEY",
            weight: 2,
            title_template: "Astrometric Survey Directive",
            briefing_template: "Science Division requests high-resolution anomaly or stellar telemetry.",
            description_template: "Deploy into deep space and complete a detailed sensor study of an uncharted Spatial Anomaly (?), Stellar Corona (V), Deep-Sky Observatory Plate (O), Gas Giant Skim, or Planetary Surface Expedition. Return here with the telemetry.",
            objective_templates: [{
                type: "SURVEY",
                targetType: "anomaly",
                subtype: "spatial or stellar phenomenon",
                sectorKey: "ANY"
            }],
            rewards_template: {
                credits: [380, 720],
                xp: [80, 140],
                notoriety: [-2, -1]
            },
            prerequisites: { minLevel: 1 }
        },
        {
            id_prefix: "CONCORD_PATROL_",
            type: "BOUNTY",
            weight: 2,
            onlyFaction: "CONCORD",
            title_template: "Aegis Lane Sweep: {sectorName}",
            briefing_template: "Concord Naval Command requests auxiliary patrol support against raiders.",
            description_template: "Raiders have been shadowing merchant lanes across {sectorName} ({sectorCoords}). Neutralize {count} hostile vessels and report back to receive Aegis hazard pay and a standing commendation.",
            objective_templates: [{
                type: "BOUNTY",
                targetName: "Hostile Vessel",
                count: [2, 4],
                targetSectorKey: "CURRENT"
            }],
            rewards_template: {
                credits: [450, 900],
                xp: [65, 115],
                notoriety: [-4, -2]
            },
            prerequisites: { minLevel: 1 }
        },
        {
            id_prefix: "KTHARR_HUNT_",
            type: "BOUNTY",
            weight: 3,
            onlyFaction: "KTHARR",
            title_template: "Blood-Trial: {sectorName}",
            briefing_template: "K'tharr war-captains demand proof of iron in battle.",
            description_template: "Words mean nothing at our docks, outlander. Hunt down and shatter {count} hostile hulls in the void around {sectorName}, then return with your gun-camera logs to earn K'tharr respect.",
            objective_templates: [{
                type: "BOUNTY",
                targetName: "Worthy Foe",
                count: [2, 5],
                targetSectorKey: "CURRENT"
            }],
            rewards_template: {
                credits: [650, 1300],
                xp: [85, 150],
                notoriety: [-1, 0]
            },
            prerequisites: { minLevel: 1 }
        },
        {
            id_prefix: "RELIEF_DELIVERY_",
            type: "DELIVERY",
            weight: 2,
            excludeBlackMarket: true,
            title_template: "Frontier Relief: {destinationName}",
            briefing_template: "Urgent humanitarian shipment requested for {destinationName}.",
            description_template: "Dockworkers at {destinationName} are running low on essential supplies. Purchase or haul {count} units of {itemName} to their port and return here for full reimbursement plus hazard pay.",
            objective_templates: [{
                type: "DELIVERY",
                itemID: "RELIEF_POOL",
                count: [4, 12],
                destinationType: ["PLANET", "OUTPOST"]
            }],
            rewards_template: {
                credits: [350, 750],
                xp: [55, 100],
                notoriety: [-2, -1]
            },
            prerequisites: { minLevel: 1 }
        },
        {
            id_prefix: "ACADEMIC_DATA_",
            type: "ACQUIRE",
            weight: 2,
            onlyFaction: "CONCORD",
            title_template: "Cygnus Research Grant: {itemName}",
            briefing_template: "Academic fellows are sponsoring acquisition of {itemName}.",
            description_template: "The Concord Science Directorate has posted an open grant for {count} units of {itemName}. Gather the samples via planetary survey, deep-space exploration, or trade and deliver them here.",
            objective_templates: [{
                type: "ACQUIRE",
                itemID: "ACADEMIC_POOL",
                count: [1, 3]
            }],
            rewards_template: {
                credits: [700, 1600],
                xp: [95, 175],
                notoriety: [-2, -1]
            },
            prerequisites: { minLevel: 2 }
        },
        {
            id_prefix: "RELIC_ACQUIRE_",
            type: "ACQUIRE",
            weight: 1.5,
            title_template: "Xeno-Relic Commission: {itemName}",
            briefing_template: "Private antiquarians seek {itemName} from deep-space ruins.",
            description_template: "An anonymous collector has placed a high-value retainer for {count} units of {itemName}. Recover them from derelicts, tomb worlds, or black-market brokers and bring them back intact.",
            objective_templates: [{
                type: "ACQUIRE",
                itemID: "RELIC_POOL",
                count: [1, 3]
            }],
            rewards_template: {
                credits: [1100, 2400],
                xp: [120, 210],
                notoriety: [0, 2]
            },
            prerequisites: { minLevel: 3 }
        }
    ];

    extraTemplates.forEach(t => {
        if (!MISSION_TEMPLATES.some(existing => existing.id_prefix === t.id_prefix)) {
            MISSION_TEMPLATES.push(t);
        }
    });

    window._missionsTemplatesExpanded = true;
}

// Helper to keep progress keys synchronized across legacy and updated objective names
function syncActiveMissionProgress() {
    if (typeof playerActiveMission === 'undefined' || !playerActiveMission || !playerActiveMission.progress) return;
    const p = playerActiveMission.progress;

    // 1. Sync Bounty / Eliminate keys
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
    _ensureExpandedMissionTemplates();

    const generatedMissions = [];
    const locationTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const giverFaction = locationTile ? (locationTile.faction || 'INDEPENDENT') : 'INDEPENDENT';
    const isBlackMarketPort = Boolean(locationTile && (locationTile.isBlackMarket || giverFaction === 'ECLIPSE'));

    const availableTemplates = (typeof MISSION_TEMPLATES !== 'undefined' ? MISSION_TEMPLATES : []).filter(t => {
        if (!t || !t.prerequisites) return false;
        if (playerLevel < (t.prerequisites.minLevel || 1)) return false;
        if (t.onlyBlackMarket && !isBlackMarketPort) return false;
        if (t.excludeBlackMarket && isBlackMarketPort) return false;
        if (t.onlyFaction && t.onlyFaction !== giverFaction) return false;
        return true;
    });

    // Generate 4 contracts per station for a fuller board
    const numMissionsToGenerate = 4;

    let attempts = 0;
    const MAX_ATTEMPTS = 36;
    const usedTitles = new Set();

    while (generatedMissions.length < numMissionsToGenerate && availableTemplates.length > 0 && attempts < MAX_ATTEMPTS) {
        attempts++;

        try {
            const chosenTemplate = getWeightedRandomOutcome(availableTemplates);
            if (!chosenTemplate) break;
            const newMission = JSON.parse(JSON.stringify(chosenTemplate));

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

                    let deliveryItem = null;
                    if (objective.itemID === "RELIEF_POOL") {
                        const reliefPool = ['FOOD_SUPPLIES', 'WATER', 'MEDICAL_SUPPLIES'].filter(id => typeof COMMODITIES !== 'undefined' && COMMODITIES[id]);
                        deliveryItem = reliefPool[Math.floor(Math.random() * reliefPool.length)];
                    } else {
                        deliveryItem = selectRandomCommodity(destination.name, true);
                    }

                    if (!deliveryItem || typeof COMMODITIES === 'undefined' || !COMMODITIES[deliveryItem]) {
                        success = false;
                        break;
                    }

                    const itemWeight = COMMODITIES[deliveryItem].weight || 1;
                    const maxHold = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
                    const maxSafeUnits = Math.max(1, Math.floor((maxHold * 0.65) / Math.max(1, itemWeight)));

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
                    let acquireItem = null;
                    if (objective.itemID === "SALVAGE_POOL") {
                        const salvagePool = ['TECH_PARTS', 'MINERALS', 'RARE_METALS', 'PLATINUM_ORE', 'ARTIFACT_SHARDS', 'VOID_CRYSTALS'].filter(id => typeof COMMODITIES !== 'undefined' && COMMODITIES[id]);
                        acquireItem = salvagePool[Math.floor(Math.random() * salvagePool.length)];
                    } else if (objective.itemID === "CONTRABAND_POOL") {
                        const illicitPool = ['PROHIBITED_STIMS', 'STARDUST_EXOTICA', 'SENTIENT_MYCELIUM', 'ARTIFACT_SHARDS', 'OBSIDIAN_TEAR_PLATING', 'FORBIDDEN_TEXTS'].filter(id => typeof COMMODITIES !== 'undefined' && COMMODITIES[id]);
                        acquireItem = illicitPool[Math.floor(Math.random() * illicitPool.length)];
                    } else if (objective.itemID === "ACADEMIC_POOL") {
                        const academicPool = ['PLANETARY_DATA', 'GENETIC_SAMPLES', 'QUANTUM_FLUID', 'VOID_CRYSTALS', 'NAVIGATION_CHARTS'].filter(id => typeof COMMODITIES !== 'undefined' && COMMODITIES[id]);
                        acquireItem = academicPool[Math.floor(Math.random() * academicPool.length)];
                    } else if (objective.itemID === "RELIC_POOL") {
                        const relicPool = ['ARTIFACT_SHARDS', 'XENO_ANTIQUES', 'ANCIENT_RELICS', 'PRECURSOR_DATACUBE'].filter(id => typeof COMMODITIES !== 'undefined' && COMMODITIES[id]);
                        acquireItem = relicPool[Math.floor(Math.random() * relicPool.length)];
                    } else {
                        acquireItem = selectRandomCommodity(stationName, false);
                    }

                    if (!acquireItem || typeof COMMODITIES === 'undefined' || !COMMODITIES[acquireItem]) {
                        success = false;
                        break;
                    }

                    const itemWeight = COMMODITIES[acquireItem].weight || 1;
                    const maxHold = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
                    const maxSafeUnits = Math.max(1, Math.floor((maxHold * 0.65) / Math.max(1, itemWeight)));

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
                    objective.subtype = objective.subtype === 'ANY_ANOMALY' ? 'unstable warp pocket' : (objective.subtype || 'spatial anomaly');
                    objective.sectorKey = "ANY";
                    newMission.title = newMission.title_template.replace('{subtype}', objective.subtype);
                    newMission.description = newMission.description_template.replace('{subtype}', objective.subtype);
                    break;
                }

                default:
                    success = false;
            }

            if (usedTitles.has(newMission.title)) {
                success = false;
            }

            newMission.objectives = [objective];
            if (!newMission.rewards) newMission.rewards = {};

            // Scale rewards slightly with player level and cargo value
            const levelScale = 1 + Math.min(1.5, ((typeof playerLevel !== 'undefined' ? playerLevel : 1) - 1) * 0.1);
            let baseCreds = newMission.rewards_template.credits[0] + Math.floor(Math.random() * (newMission.rewards_template.credits[1] - newMission.rewards_template.credits[0] + 1));

            // Ensure ACQUIRE and DELIVERY missions reimburse commodity base cost + healthy profit margin
            if ((newMission.type === "ACQUIRE" || newMission.type === "DELIVERY") && objective.itemID && typeof COMMODITIES !== 'undefined' && COMMODITIES[objective.itemID]) {
                const goodsValue = (COMMODITIES[objective.itemID].basePrice || 25) * (objective.count || 1);
                baseCreds = Math.max(baseCreds, Math.floor(goodsValue * 1.45) + 250);
            }

            newMission.rewards.credits = Math.floor(baseCreds * levelScale);
            newMission.rewards.xp = newMission.rewards_template.xp[0] + Math.floor(Math.random() * (newMission.rewards_template.xp[1] - newMission.rewards_template.xp[0] + 1));
            newMission.rewards.notoriety = newMission.rewards_template.notoriety[0] + Math.floor(Math.random() * (newMission.rewards_template.notoriety[1] - newMission.rewards_template.notoriety[0] + 1));

            if (success) {
                usedTitles.add(newMission.title);
                generatedMissions.push(newMission);
            }
        } catch (error) {
            // BUG FIX: Use console.warn instead of console.error so Flight Recorder doesn't crash on a skipped roll
            console.warn("Skipped malformed mission template roll:", error);
        }
    }

    if (typeof currentGameDate !== 'undefined') {
        window._stationMissionLastRefresh[stationName] = currentGameDate;
    }
    return generatedMissions;
}

// Guarded board action helpers so Level-Up screens are never overwritten by displayMissionBoard()
function _claimMissionFromBoard() {
    grantMissionRewards();
    if (typeof currentGameState === 'undefined' || currentGameState !== 'level_up') {
        displayMissionBoard();
    }
}

function _deliverMissionFromBoard() {
    handleCompleteDelivery();
    if (typeof currentGameState === 'undefined' || currentGameState !== 'level_up') {
        displayMissionBoard();
    }
}

function _turnInAcquireFromBoard() {
    handleTurnInAcquire();
    if (typeof currentGameState === 'undefined' || currentGameState !== 'level_up') {
        displayMissionBoard();
    }
}

// --- DISPLAY MISSIONS MODAL ---
function displayMissionBoard(forceRefresh = false) {
    syncActiveMissionProgress();

    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : { name: "STARBASE", faction: "INDEPENDENT" };
    const stationName = (location && location.name) ? location.name : "STARBASE";
    const faction = (location && location.faction) ? location.faction : "INDEPENDENT";

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
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 15px; box-shadow: 0 0 25px ${brandColor}44; flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/mission_banner.png" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';">
        </div>
    `;

    const completedCount = (typeof playerCompletedMissions !== 'undefined' && playerCompletedMissions.size) ? playerCompletedMissions.size : 0;

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
                            Review available bounties, courier requests, and exploration directives. Completing contracts earns credits, XP, and standing with the issuing faction.
                        </p>
                        <div style="margin-top: 16px; font-size: 13px; color: var(--text-color); border: 1px solid var(--border-color); padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                            <div>Current ${_missionEscapeHtml(faction)} Standing: <b style="color:${brandColor};">${typeof playerFactionStanding !== 'undefined' ? (playerFactionStanding[faction] || 0) : 0} Rep</b></div>
                            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Career Contracts Fulfilled: <b style="color:var(--success);">${completedCount}</b></div>
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnToConcourseFromMissions()">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const missions = MISSIONS_DATABASE[stationName] || [];
    let foundActive = false;
    let activeMissionIdx = -1;

    missions.forEach((mission, index) => {
        if (!mission || playerCompletedMissions.has(mission.id)) return;
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
                <div style="color:var(--text-color); font-weight:bold; font-size: 13px;">${_missionEscapeHtml(mission.title)}</div>
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

    const mission = MISSIONS_DATABASE[stationName] ? MISSIONS_DATABASE[stationName][index] : null;
    if (!mission) return;

    const isThisMission = playerActiveMission && playerActiveMission.id === mission.id;
    const hasOtherMission = playerActiveMission && playerActiveMission.id !== mission.id;
    const activeMission = isThisMission ? playerActiveMission : mission;
    const obj = activeMission.objectives && activeMission.objectives[0] ? activeMission.objectives[0] : null;

    let typeColor = "var(--success)";
    if (activeMission.type === 'BOUNTY') typeColor = "var(--danger)";
    if (activeMission.type === 'DELIVERY') typeColor = "var(--warning)";
    if (activeMission.type === 'SURVEY') typeColor = "#4488FF";

    // Build live cargo/location telemetry for DELIVERY and ACQUIRE contracts
    let logisticsHtml = "";
    if (obj && (activeMission.type === 'DELIVERY' || activeMission.type === 'ACQUIRE') && obj.itemID) {
        const itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[obj.itemID]) ? COMMODITIES[obj.itemID] : { name: obj.itemID };
        const ownedQty = (typeof playerCargo !== 'undefined' && playerCargo[obj.itemID]) ? playerCargo[obj.itemID] : 0;
        const hasEnough = ownedQty >= obj.count;
        const locTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        const soldHere = Boolean(locTile && locTile.sells && locTile.sells.some(s => (s.id === obj.itemID) || (s === obj.itemID)));

        let destCoordText = "";
        if (activeMission.type === 'DELIVERY' && obj.destinationName) {
            const destLoc = _missionFindLocation(obj.destinationName);
            if (destLoc && destLoc.coords) {
                const c = destLoc.coords;
                const nav = _missionDistAndBearing(c.x, c.y);
                destCoordText = `
                    <div class="trade-stat-row">
                        <span style="color:var(--item-desc-color);">Destination:</span>
                        <span style="color:var(--accent-color); font-weight:bold;">[${c.x}, ${-c.y}] · ${nav.distance}u ${nav.bearing}</span>
                    </div>`;
            }
        }

        logisticsHtml = `
            <div class="trade-math-area" style="margin-bottom:12px; background:rgba(0,0,0,0.4);">
                <div style="font-size:10px; color:var(--warning); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">LOGISTICS MANIFEST</div>
                <div class="trade-stat-row">
                    <span style="color:var(--item-desc-color);">Required Cargo:</span>
                    <span style="color:var(--text-color); font-weight:bold;">${obj.count}x ${_missionEscapeHtml(itemDef.name)}</span>
                </div>
                <div class="trade-stat-row">
                    <span style="color:var(--item-desc-color);">In Your Hold:</span>
                    <span style="color:${hasEnough ? 'var(--success)' : 'var(--warning)'}; font-weight:bold;">${ownedQty} / ${obj.count}</span>
                </div>
                ${soldHere ? `<div style="font-size:10px; color:var(--success); margin-top:4px;">✓ Available in this station's Marketplace</div>` : ''}
                ${destCoordText}
            </div>
        `;
    }

    const html = `
        <div style="font-size:10px; color:${typeColor}; letter-spacing:2px; margin-bottom:5px;">
            [ ${_missionEscapeHtml(activeMission.type)} CONTRACT ]
        </div>
        <h3 style="color:${brandColor}; margin:0 0 5px 0;">${_missionEscapeHtml(activeMission.title)}</h3>
        <p style="font-size:11px; color:var(--item-desc-color); border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 15px;">Client: ${_missionEscapeHtml(activeMission.giver)} (${_missionEscapeHtml(activeMission.faction || 'INDEPENDENT')})</p>
        
        <p style="color:var(--text-color); font-size:12px; line-height: 1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${typeColor}; margin-bottom:15px;">
            "${_missionEscapeHtml(activeMission.description)}"
        </p>

        ${logisticsHtml}
        
        <div class="trade-math-area">
            <div style="font-size:10px; color:${brandColor}; letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">REWARD TELEMETRY</div>
            <div class="trade-stat-row"><span style="color:var(--item-desc-color);">Credits:</span> <span style="color:var(--gold-text, #FFD700); font-weight:bold;">${formatNumber(activeMission.rewards.credits)}c</span></div>
            <div class="trade-stat-row"><span style="color:var(--item-desc-color);">Experience:</span> <span style="color:var(--success, #00FF00); font-weight:bold;">+${formatNumber(activeMission.rewards.xp)} XP</span></div>
            ${activeMission.faction && activeMission.faction !== 'INDEPENDENT' ? `<div class="trade-stat-row"><span style="color:var(--item-desc-color);">${_missionEscapeHtml(activeMission.faction)} Standing:</span> <span style="color:var(--accent-color); font-weight:bold;">+${Math.max(5, Math.abs(activeMission.rewards.notoriety || 5))} Rep</span></div>` : ''}
        </div>
    `;

    const detailEl = document.getElementById('genericDetailContent');
    if (detailEl) detailEl.innerHTML = html;

    let btnHtml = "";

    if (isThisMission) {
        if (playerActiveMission.isComplete && playerActiveMission.giver === stationName) {
            btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--success); color:var(--success); box-shadow: 0 0 15px rgba(0,255,0,0.2);" onclick="_claimMissionFromBoard()">🏆 CLAIM CONTRACT REWARD</button>`;
        } else if (!playerActiveMission.isComplete && playerActiveMission.type === "DELIVERY" && obj && obj.destinationName === stationName) {
            const haveQty = playerCargo[obj.itemID] || 0;
            const canDeliver = haveQty >= obj.count;
            btnHtml += `<button class="action-button" ${!canDeliver ? 'disabled' : ''} style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--gold-text); color:var(--gold-text);" onclick="_deliverMissionFromBoard()">📦 DELIVER CARGO (${haveQty}/${obj.count})</button>`;
        } else if (!playerActiveMission.isComplete && playerActiveMission.type === "ACQUIRE" && obj && playerActiveMission.giver === stationName) {
            const haveQty = playerCargo[obj.itemID] || 0;
            const canTurnIn = haveQty >= obj.count;
            btnHtml += `<button class="action-button" ${!canTurnIn ? 'disabled' : ''} style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--gold-text); color:var(--gold-text);" onclick="_turnInAcquireFromBoard()">💎 TURN IN & CLAIM REWARD (${haveQty}/${obj.count})</button>`;
        }

        btnHtml += `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="abandonMission()">ABANDON CONTRACT</button>`;
    } else if (hasOtherMission) {
        btnHtml = `<button class="action-button" disabled style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;">FINISH CURRENT JOB FIRST</button>`;
    } else {
        const safeStationArg = String(stationName).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        btnHtml = `<button class="action-button" style="border-color:${brandColor}; color:${brandColor}; width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="confirmAcceptMission('${safeStationArg}', ${index})">AUTHORIZE CONTRACT</button>`;
    }

    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnToConcourseFromMissions()">◀ BACK TO CONCOURSE</button>`;

    const actionsEl = document.getElementById('genericModalActions');
    if (actionsEl) actionsEl.innerHTML = btnHtml;
}

function confirmAcceptMission(stationName, index) {
    const mission = MISSIONS_DATABASE[stationName] ? MISSIONS_DATABASE[stationName][index] : null;
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
    if (typeof showToast === 'function') showToast("CONTRACT ACCEPTED", "success");
    logMessage(`<span style='color:var(--accent-color)'>[ CONTRACT AUTHORIZED ]</span> ${_missionEscapeHtml(playerActiveMission.title)}.`);
    returnToConcourseFromMissions();
    renderMissionTracker();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function abandonMission(skipConfirm = false) {
    if (!playerActiveMission) return;

    if (!skipConfirm && typeof showConfirmationModal === 'function') {
        const isSmuggle = playerActiveMission.id && playerActiveMission.id.startsWith("SMUGGLE_");
        const msg = isSmuggle
            ? `Abandon '${playerActiveMission.title}'? The Tracked Contraband crate will be jettisoned.`
            : `Abandon active contract '${playerActiveMission.title}'? All objective progress will be lost.`;
        showConfirmationModal(msg, () => abandonMission(true));
        return;
    }

    if (playerActiveMission.id && playerActiveMission.id.startsWith("SMUGGLE_") && playerCargo['HOT_CARGO']) {
        delete playerCargo['HOT_CARGO'];
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    }
    logMessage(`You dropped the contract: ${_missionEscapeHtml(playerActiveMission.title)}.`);
    if (typeof showToast === 'function') showToast("CONTRACT ABANDONED", "info");
    playerActiveMission = null;
    renderMissionTracker();
    if (typeof autoSaveGame === 'function') autoSaveGame();

    displayMissionBoard();
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
    const itemName = (COMMODITIES[objective.itemID] && COMMODITIES[objective.itemID].name) ? COMMODITIES[objective.itemID].name : objective.itemID;

    if ((playerCargo[objective.itemID] || 0) >= objective.count) {
        playerCargo[objective.itemID] -= objective.count;
        if (playerCargo[objective.itemID] <= 0) delete playerCargo[objective.itemID];
        updateCurrentCargoLoad();
        if (objectiveProgress) {
            objectiveProgress.acquired = objective.count;
            objectiveProgress.complete = true;
        }
        logMessage(`<span style='color:var(--success)'>Turned in ${objective.count}x ${_missionEscapeHtml(itemName)} to ${_missionEscapeHtml(playerActiveMission.giver)}.</span>`);
        if (typeof showToast === 'function') showToast("RESOURCES DELIVERED", "success");
        checkMissionObjectiveCompletion();

        const currentLocation = getCombinedLocationData(playerX, playerY);
        if (playerActiveMission && playerActiveMission.isComplete && currentLocation && currentLocation.name === playerActiveMission.giver) {
            grantMissionRewards();
            return;
        }
    } else {
        logMessage(`You don't have enough ${itemName}. Required: ${objective.count}, You have: ${playerCargo[objective.itemID] || 0}.`);
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
            const itemName = (COMMODITIES[obj.itemID] && COMMODITIES[obj.itemID].name) ? COMMODITIES[obj.itemID].name : obj.itemID;

            if (objectiveProgress && !objectiveProgress.complete && currentLocation.name === obj.destinationName) {
                if ((playerCargo[obj.itemID] || 0) >= obj.count) {
                    playerCargo[obj.itemID] -= obj.count;
                    if (playerCargo[obj.itemID] <= 0) delete playerCargo[obj.itemID];
                    updateCurrentCargoLoad();
                    objectiveProgress.delivered = obj.count;
                    objectiveProgress.complete = true;
                    logMessage(`<span style='color:var(--success)'>Delivered ${obj.count}x ${_missionEscapeHtml(itemName)} to ${_missionEscapeHtml(obj.destinationName)}.</span>`, true);
                    if (typeof showToast === 'function') showToast("CARGO DELIVERED", "success");
                    deliveryMade = true;
                } else {
                    logMessage(`You don't have enough ${itemName}. Required: ${obj.count}, You have: ${playerCargo[obj.itemID] || 0}.`, true);
                    if (typeof showToast === 'function') showToast("MISSING DELIVERY CARGO", "error");
                }
            }
        }
    });
    if (deliveryMade) {
        checkMissionObjectiveCompletion();

        if (playerActiveMission && playerActiveMission.isComplete &&
            (currentLocation.name === playerActiveMission.giver || (playerActiveMission.giver === "Shadow Broker" && currentLocation.isBlackMarket))) {
            grantMissionRewards();
            return;
        }
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
        logMessage(`<span style='color:var(--success); font-weight:bold;'>All objectives for '${_missionEscapeHtml(playerActiveMission.title)}' complete!</span>\nReturn to ${_missionEscapeHtml(playerActiveMission.giver)} to claim your reward.`, true);
        if (typeof showToast === 'function') showToast("CONTRACT OBJECTIVES COMPLETE", "success");
        if (typeof soundManager !== 'undefined') {
            if (typeof soundManager.playMissionComplete === 'function') soundManager.playMissionComplete();
            else soundManager.playAbilityActivate();
        }
        if (typeof autoSaveGame === 'function') autoSaveGame();
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

    updatePlayerNotoriety(mission.rewards.notoriety || 0);

    let standingMsg = "";
    const targetFaction = (mission.faction && mission.faction !== 'INDEPENDENT') ? mission.faction : (currentLocation.faction !== 'INDEPENDENT' ? currentLocation.faction : null);

    if (targetFaction) {
        const repGain = Math.max(5, Math.abs(mission.rewards.notoriety || 5));
        playerFactionStanding[targetFaction] = (playerFactionStanding[targetFaction] || 0) + repGain;
        standingMsg = `\n  ${targetFaction} Standing: +${repGain}`;
    }

    playerCompletedMissions.add(mission.id);
    if (typeof addMilestone === 'function') {
        addMilestone(`Completed contract '${mission.title}' for ${mission.giver} (+${formatNumber(mission.rewards.credits)}c).`);
    }

    let rewardMsg = `<span style='color:var(--gold-text); font-weight:bold;'>Mission '${_missionEscapeHtml(mission.title)}' Complete!</span>\nRewards:\n  +${formatNumber(mission.rewards.credits)} Credits\n  +${formatNumber(mission.rewards.xp)} XP`;

    if (mission.rewards.notoriety) {
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
    if (typeof autoSaveGame === 'function') autoSaveGame();
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
        objectiveText = `Survey Anomaly (?), Star (V/O), or Planet`;
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

function openBountyBoard(forceRefresh = false) {
    const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : { name: "STARBASE", faction: "CONCORD" };
    const stationName = (location && location.name) ? location.name : "STARBASE";
    const faction = (location && location.faction) ? location.faction : "CONCORD";

    const brandColor = "var(--danger)";

    openGenericModal(`${stationName.toUpperCase()} : BOUNTY BOARD`);

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const availableBanners = ['assets/bounty_banner.png', 'assets/bounty_banner2.png'];
    let assignedBanner = window._stationBountyBannerAssignments[stationName];

    if (!assignedBanner) {
        assignedBanner = availableBanners[Math.floor(Math.random() * availableBanners.length)];
        window._stationBountyBannerAssignments[stationName] = assignedBanner;
    }

    // BUG FIX: Render an actual <img> inside the container so onerror works properly (divs never fire onerror)
    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid ${brandColor}; margin-bottom: 15px; box-shadow: 0 0 25px ${brandColor}44; flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="${assignedBanner}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';">
        </div>
    `;

    const hasLegendaryBoard = typeof openLegendaryBounties === 'function';
    const canRefreshBounties = !playerActiveBounty;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:${brandColor}; font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px; display:flex; justify-content:space-between; align-items:center; gap:6px;">
                    <span>ACTIVE TARGETS</span>
                    <div style="display:flex; gap:5px; align-items:center;">
                        ${canRefreshBounties ? `<button class="icon-btn" style="padding:2px 6px; font-size:9px;" onclick="openBountyBoard(true)" title="Query Fresh Bounty Warrants">⟳ REFRESH</button>` : ''}
                        ${hasLegendaryBoard ? `<button class="icon-btn" style="padding:2px 6px; font-size:9px; border-color:var(--gold-text); color:var(--gold-text);" onclick="openLegendaryBounties()">★ HIGH-VALUE TARGETS</button>` : ''}
                    </div>
                </div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 20px 0;">
                        <h3 style="color:${brandColor}; margin-bottom:10px; letter-spacing: 2px;">WANTED BY ${_missionEscapeHtml(faction)}</h3>
                        <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                            Sanctioned elimination contracts. Targets are armed and actively patrolling nearby sectors. Bounties are wired immediately upon confirmed hull destruction, along with faction standing.
                        </p>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnToConcourseFromMissions()">◀ BACK TO CONCOURSE</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');

    if ((forceRefresh && !playerActiveBounty) || !currentStationBounties || currentStationBounties.length === 0) {
        generateBountyTargets();
    }

    if (playerActiveBounty) {
        const nav = _missionDistAndBearing(playerActiveBounty.x, playerActiveBounty.y);
        listEl.innerHTML = `
            <div class="trade-item-row" style="background: rgba(255,0,0,0.1); border-left: 3px solid var(--danger); padding: 12px 10px; cursor: pointer;" onclick="showBountyDetails(playerActiveBounty, true)">
                <div>
                    <div style="color:var(--warning); font-size: 10px; letter-spacing: 1px; margin-bottom: 4px;">[ ACTIVE PURSUIT ]</div>
                    <div style="color:var(--danger); font-weight:bold; font-size: 14px;">${_missionEscapeHtml(playerActiveBounty.targetName)}</div>
                </div>
                <div style="text-align:right; font-size:11px; color:var(--accent-color); font-weight:bold;">
                    ${nav.distance}u ${nav.bearing}
                </div>
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

            const shipDisplayName = (typeof PIRATE_SHIP_CLASSES !== 'undefined' && PIRATE_SHIP_CLASSES[bounty.shipClass])
                ? PIRATE_SHIP_CLASSES[bounty.shipClass].name
                : (bounty.shipClass || "Raider");
            const nav = _missionDistAndBearing(bounty.x, bounty.y);

            row.innerHTML = `
                <div>
                    <div style="color:${facColor}; font-weight:bold; font-size: 13px;">${_missionEscapeHtml(bounty.targetName)}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">Class ${bounty.difficulty} (${_missionEscapeHtml(shipDisplayName)}) · ${nav.distance}u ${nav.bearing}</div>
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
    if (!detailEl || !actionsEl || !bounty) return;

    // Resolve Legendary Boss metadata if tracking a High-Value Target from script.js
    const rawBossId = bounty.bossId || (bounty.id ? String(bounty.id).replace(/_\d+$/, '') : null);
    const legDef = (typeof LEGENDARY_BOUNTIES !== 'undefined' && rawBossId && LEGENDARY_BOUNTIES[rawBossId])
        ? LEGENDARY_BOUNTIES[rawBossId]
        : null;

    let facColor = legDef ? (legDef.color || "var(--danger)") : "var(--danger)";
    if (!legDef && bounty.faction === "KTHARR") facColor = "var(--success)";
    if (!legDef && bounty.faction === "INDEPENDENT") facColor = "var(--warning)";

    const shipKey = (legDef && legDef.shipClassKey) || bounty.shipClass || bounty.shipClassKey || "RAIDER";
    const shipDisplayName = (typeof PIRATE_SHIP_CLASSES !== 'undefined' && PIRATE_SHIP_CLASSES[shipKey])
        ? PIRATE_SHIP_CLASSES[shipKey].name
        : shipKey;

    const crimeText = legDef ? "High-Value Galactic Warrant" : (bounty.crime || "High-Treason & Piracy");
    const diffText = legDef ? "OMEGA (LEGENDARY)" : `Class ${bounty.difficulty || 1}`;
    const rewardVal = legDef ? legDef.reward : (bounty.reward || 1500);
    const dossierText = legDef ? legDef.description : (bounty.dossier || "Armed hostile sighted harassing local traffic. Engage with full shields.");
    const nav = _missionDistAndBearing(bounty.x, bounty.y);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:48px; margin-bottom:10px; filter: drop-shadow(0 0 15px ${facColor});">${legDef ? '☠️' : '🎯'}</div>
            <h3 style="color:${facColor}; margin:0;">${_missionEscapeHtml((bounty.targetName || "Target").toUpperCase())}</h3>
            <div style="color:var(--item-desc-color); font-size:11px; margin-bottom:12px; border-bottom: 1px solid #333; padding-bottom: 10px;">WANTED FOR: ${_missionEscapeHtml(crimeText.toUpperCase())}</div>
            
            <p style="font-size:12px; color:var(--text-color); line-height:1.5; text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${facColor}; margin:0 0 12px 0; font-style:italic;">
                "${_missionEscapeHtml(dossierText)}"
            </p>

            <div style="background:rgba(0,0,0,0.3); border:1px solid #333; padding:10px; border-radius:4px; text-align:left; font-size:12px;">
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Threat Level:</span> <span style="color:var(--warning); font-weight:bold;">${diffText}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Vessel Type:</span> <span style="color:var(--text-color);">${_missionEscapeHtml(shipDisplayName)}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Alliance:</span> <span style="color:${facColor};">${_missionEscapeHtml(bounty.faction || (legDef ? "ROGUE" : "OUTLAW"))}</span></div>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between;"><span style="color:#888;">Last Seen:</span> <span style="color:var(--accent-color); font-weight:bold;">[${bounty.x}, ${-bounty.y}] · ${nav.distance}u ${nav.bearing}</span></div>
                
                <div style="margin-top:12px; border-top:1px dashed #444; padding-top:10px; display:flex; justify-content:space-between;"><span style="color:#888;">Bounty Payout:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(rewardVal)}c</span></div>
            </div>
        </div>
    `;

    if (isActive) {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="abandonBounty()">ABANDON CONTRACT</button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnToConcourseFromMissions()">◀ BACK TO CONCOURSE</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color:var(--danger); color:var(--danger); margin-bottom: 10px;" onclick="acceptBounty('${bounty.id}')">ACCEPT CONTRACT</button>
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="returnToConcourseFromMissions()">◀ BACK TO CONCOURSE</button>
        `;
    }
}

function spawnBountyEntityOnMap(bounty) {
    if (!bounty || typeof activeEnemies === 'undefined') return;

    // Offset the bounty if it tries to spawn directly on top of the player
    if (typeof playerX !== 'undefined' && bounty.x === playerX && bounty.y === playerY) {
        bounty.x += (Math.random() < 0.5 ? -4 : 4);
        bounty.y += (Math.random() < 0.5 ? -4 : 4);
    }

    const rawBossId = bounty.bossId || (bounty.id ? String(bounty.id).replace(/_\d+$/, '') : null);
    const legendaryDef = (typeof LEGENDARY_BOUNTIES !== 'undefined' && rawBossId && LEGENDARY_BOUNTIES[rawBossId])
        ? LEGENDARY_BOUNTIES[rawBossId]
        : null;

    if (legendaryDef) {
        activeEnemies = activeEnemies.filter(e => e.id !== bounty.id);
        activeEnemies.push({
            id: bounty.id,
            bossId: legendaryDef.id,
            x: bounty.x,
            y: bounty.y,
            type: 'BOSS',
            char: '☠️',
            color: legendaryDef.color || 'var(--danger)',
            shipClassKey: legendaryDef.shipClassKey,
            shipClass: legendaryDef.shipClassKey,
            isBoss: true,
            isLegendary: true,
            isBountyTarget: true,
            name: legendaryDef.title,
            exclusiveDrop: legendaryDef.exclusiveDrop,
            difficultyMultiplier: 1.5,
            reward: legendaryDef.reward
        });
        return;
    }

    let validClassKey = bounty.shipClass || bounty.shipClassKey || "RAIDER";
    if (typeof PIRATE_SHIP_CLASSES !== 'undefined' && !PIRATE_SHIP_CLASSES[validClassKey]) {
        validClassKey = (bounty.difficulty || 1) > 5 ? "STRIKER" : "RAIDER";
        bounty.shipClass = validClassKey;
    }

    const diff = bounty.difficulty || 1;
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
        level: diff,
        hp: diff * 50,
        maxHp: diff * 50,
        shields: diff * 25,
        maxShields: diff * 25,
        char: 'V',
        color: '#FF4444'
    });
}

function acceptBounty(bountyId) {
    const selected = currentStationBounties.find(b => b.id === bountyId);
    if (selected) {
        playerActiveBounty = selected;
        spawnBountyEntityOnMap(selected);

        const nav = _missionDistAndBearing(selected.x, selected.y);
        if (typeof showToast === 'function') showToast("BOUNTY ACCEPTED", "warning");
        logMessage(`Tracking target: <b>${_missionEscapeHtml(selected.targetName)}</b>. Sensors indicate they are lurking near [${selected.x}, ${-selected.y}] (${nav.distance}u ${nav.bearing}).`);

        openBountyBoard();
        if (typeof render === 'function') render();
        if (typeof autoSaveGame === 'function') autoSaveGame();
    }
}

function abandonBounty(skipConfirm = false) {
    if (!playerActiveBounty) return;

    if (!skipConfirm && typeof showConfirmationModal === 'function') {
        showConfirmationModal(
            `Abandon active pursuit of ${playerActiveBounty.targetName}? The target will slip off your Nav-Computer.`,
            () => abandonBounty(true)
        );
        return;
    }

    if (typeof activeEnemies !== 'undefined') {
        activeEnemies = activeEnemies.filter(e => e.id !== playerActiveBounty.id);
    }

    if (typeof showToast === 'function') showToast("BOUNTY ABANDONED", "info");
    logMessage(`You dropped the contract on ${_missionEscapeHtml(playerActiveBounty.targetName)}. Local security has been notified.`);

    playerActiveBounty = null;
    openBountyBoard();
    if (typeof render === 'function') render();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function processBountyVictory(defeatedEnemy) {
    if (!playerActiveBounty || !defeatedEnemy) return;

    const isMatchingTarget = (
        defeatedEnemy.id === playerActiveBounty.id ||
        (defeatedEnemy.isLegendary && playerActiveBounty.targetName === defeatedEnemy.name)
    );

    if (!isMatchingTarget) return;

    if (!defeatedEnemy.isLegendary && typeof playerActiveBounty.reward === 'number' && playerActiveBounty.reward > 0) {
        if (typeof playerCredits !== 'undefined') {
            playerCredits += playerActiveBounty.reward;
        }
        const xpGain = (defeatedEnemy.level || playerActiveBounty.difficulty || 1) * 25;
        if (typeof playerXP !== 'undefined') {
            playerXP += xpGain;
        }

        // Grant +3 standing with the issuing faction (and trim 1 Concord Notoriety on Concord warrants)
        let repNote = "";
        const issuer = playerActiveBounty.issuerFaction || "CONCORD";
        if (issuer !== "INDEPENDENT" && typeof playerFactionStanding !== 'undefined') {
            playerFactionStanding[issuer] = (playerFactionStanding[issuer] || 0) + 3;
            repNote = ` (+3 ${issuer} Rep)`;
        }
        if (issuer === "CONCORD" && typeof playerNotoriety !== 'undefined' && playerNotoriety > 0 && typeof updatePlayerNotoriety === 'function') {
            updatePlayerNotoriety(-1);
        }

        logMessage(`<span style="color:var(--success); font-weight:bold;">BOUNTY COMPLETE:</span> Target [${_missionEscapeHtml(playerActiveBounty.targetName)}] eliminated. Transferred ${formatNumber(playerActiveBounty.reward)}c and +${xpGain} XP${repNote}.`);
        if (typeof showToast === 'function') showToast(`BOUNTY COMPLETE: +${formatNumber(playerActiveBounty.reward)}c`, "success");
        if (typeof soundManager !== 'undefined' && typeof soundManager.playBuy === 'function') soundManager.playBuy();
    }

    if (typeof addMilestone === 'function') {
        addMilestone(`Eliminated wanted bounty target: ${playerActiveBounty.targetName}.`);
    }

    if (Array.isArray(currentStationBounties)) {
        currentStationBounties = currentStationBounties.filter(b => b.id !== playerActiveBounty.id);
    }
    playerActiveBounty = null;
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

function createStationBountyTargets() {
    currentStationBounties = [];
    const numBounties = Math.floor(Math.random() * 3) + 2; // 2 to 4 bounties per station

    const locTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
    const issuerFaction = (locTile && locTile.faction) ? locTile.faction : "CONCORD";

    const firstNames = ["'Mad Dog'", "Viper", "'Iron'", "Jax", "Silas", "Kaelen", "'Ghost'", "Rook", "Vane", "Kira", "'Void-Eye'", "Soren", "Nyx", "'Shiv'", "'Ash'", "Drax"];
    const lastNames = ["Vance", "Karn", "Trex", "the Ravager", "Valerius", "Morrow", "Graves", "Black", "Kryik", "Vex", "Kestrel", "Thorn"];
    const crimeList = ["Smuggling", "Piracy", "Assassination", "Data Theft", "Illegal Cybernetics", "Shipjacking", "Blockade Running", "Beacon Sabotage", "Convoy Ambush"];
    const dossiers = [
        "Spotted shadowing independent haulers along outer asteroid belts. Known to overcharge weapons early.",
        "Escaped SEC-COM custody near Kepler Listening Post. Refitted hull with black-market deflectors.",
        "Suspected of raiding frontier mining barges and fencing stolen platinum at outlaw relays.",
        "Veteran Void Vulture wing-leader wanted across three neighboring sectors. Expect aggressive maneuvers.",
        "Intercepted firing on unarmed Fuel Rats supply tugs. Authorized for immediate termination.",
        "Carries falsified Concord transponders and ambushes ships emerging from nebula clouds."
    ];

    const usedNames = new Set();

    for (let i = 0; i < numBounties; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.floor(Math.random() * 15) + 5; // 5 to 20 tiles away

        const targetX = Math.floor(playerX + Math.cos(angle) * distance);
        const targetY = Math.floor(playerY + Math.sin(angle) * distance);

        let difficultyLevel = typeof playerLevel !== 'undefined' ? playerLevel : 1;
        if (Math.random() > 0.65) difficultyLevel += Math.floor(Math.random() * 2) + 1;

        const factionList = ["ECLIPSE", "ECLIPSE", "KTHARR", "INDEPENDENT"];
        const targetFaction = factionList[Math.floor(Math.random() * factionList.length)];

        let shipClass = "RAIDER";
        const hasExpandedShips = typeof PIRATE_SHIP_CLASSES !== 'undefined';

        if (targetFaction === "ECLIPSE" || targetFaction === "INDEPENDENT") {
            if (difficultyLevel >= 8 && hasExpandedShips && PIRATE_SHIP_CLASSES.PIRATE_DREADNOUGHT) {
                shipClass = "PIRATE_DREADNOUGHT";
            } else if (difficultyLevel >= 6) {
                const highPool = ['BRUISER', 'PIRATE_GUNSHIP', 'ECLIPSE_GUNSHIP'].filter(k => !hasExpandedShips || PIRATE_SHIP_CLASSES[k]);
                shipClass = highPool[Math.floor(Math.random() * highPool.length)] || "BRUISER";
            } else if (difficultyLevel >= 3) {
                const midPool = ['STRIKER', 'PIRATE_INTERCEPTOR', 'VOID_VULTURE_CORSAIR', 'ECLIPSE_ASSASSIN', 'ECLIPSE_PHANTOM'].filter(k => !hasExpandedShips || PIRATE_SHIP_CLASSES[k]);
                shipClass = midPool[Math.floor(Math.random() * midPool.length)] || "STRIKER";
            }
        } else if (targetFaction === "KTHARR") {
            if (difficultyLevel >= 7 && hasExpandedShips && PIRATE_SHIP_CLASSES.KTHARR_CRUISER) {
                shipClass = "KTHARR_CRUISER";
            } else if (difficultyLevel >= 5) {
                const kthHigh = ['KTHARR_DESTROYER', 'KTHARR_GUNSHIP'].filter(k => !hasExpandedShips || PIRATE_SHIP_CLASSES[k]);
                shipClass = kthHigh[Math.floor(Math.random() * kthHigh.length)] || "KTHARR_DESTROYER";
            } else {
                const kthLow = ['KTHARR_SCOUT', 'KTHARR_RAIDER'].filter(k => !hasExpandedShips || PIRATE_SHIP_CLASSES[k]);
                shipClass = kthLow[Math.floor(Math.random() * kthLow.length)] || "KTHARR_SCOUT";
            }
        }

        let targetName = "";
        for (let tries = 0; tries < 15; tries++) {
            const candidate = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            if (!usedNames.has(candidate)) {
                targetName = candidate;
                usedNames.add(candidate);
                break;
            }
        }
        if (!targetName) targetName = `Outlaw-${Math.floor(Math.random() * 900 + 100)}`;

        const baseReward = (difficultyLevel * 1500) + Math.floor(Math.random() * 500);
        const distanceBonus = distance * 50;
        const totalReward = baseReward + distanceBonus;

        currentStationBounties.push({
            id: `BOUNTY_${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`,
            targetName: targetName,
            crime: crimeList[Math.floor(Math.random() * crimeList.length)],
            dossier: dossiers[Math.floor(Math.random() * dossiers.length)],
            x: targetX,
            y: targetY,
            difficulty: difficultyLevel,
            reward: totalReward,
            faction: targetFaction,
            issuerFaction: issuerFaction,
            shipClass: shipClass
        });
    }
}

window.generateBountyTargets = createStationBountyTargets;

function selectRandomDestination(currentStationName) {
    if (typeof LOCATIONS_DATA === 'undefined') return null;
    const allLocationKeys = Object.keys(LOCATIONS_DATA);

    const possibleDestinations = allLocationKeys.filter(key => {
        const loc = LOCATIONS_DATA[key];
        if (!loc || !loc.coords || loc.isLandmark) return false;
        const hasTradeDemand = Array.isArray(loc.buys) && loc.buys.length > 0;
        return key !== currentStationName && loc.name !== currentStationName && key !== "Planet Xerxes" && hasTradeDemand;
    });

    if (possibleDestinations.length === 0) return null;

    const destinationKey = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
    const destinationData = LOCATIONS_DATA[destinationKey];
    const secX = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destinationData.coords.x / SECTOR_SIZE) : 0;
    const secY = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destinationData.coords.y / SECTOR_SIZE) : 0;

    return {
        name: destinationData.name || destinationKey,
        key: `${secX},${secY}`,
        coords: destinationData.coords
    };
}

function selectRandomCommodity(locationName, onlyLegal = false) {
    const location = _missionFindLocation(locationName);
    if (!location || !location.buys || location.buys.length === 0) return null;

    const excluded = new Set(['WAYFINDER_CORE', 'COLONY_CHARTER', 'STATION_CORE', 'WORMHOLE_STABILIZER', 'HOT_CARGO', 'PREFAB_COLONY_CORE']);

    let pool = location.buys.map(b => b.id || b).filter(id => {
        const c = typeof COMMODITIES !== 'undefined' ? COMMODITIES[id] : null;
        if (!c || excluded.has(id) || c.isComponent || c.isTroop) return false;
        if (onlyLegal && (c.illegal || c.basePrice > 400)) return false;
        return true;
    });

    if (pool.length === 0) pool = ['MINERALS', 'FOOD_SUPPLIES', 'TECH_PARTS'];

    return pool[Math.floor(Math.random() * pool.length)];
}

// Helper to mark an active SURVEY mission complete from any astrometric/anomaly/planetary scan
function _completeActiveSurveyMission() {
    syncActiveMissionProgress();
    if (typeof playerActiveMission === 'undefined' || !playerActiveMission || playerActiveMission.type !== "SURVEY" || playerActiveMission.isComplete) {
        return;
    }
    const progress = playerActiveMission.progress.survey_0 || playerActiveMission.progress.scan_object_0;
    if (progress && !progress.complete) {
        progress.scanned = true;
        progress.complete = true;
        checkMissionObjectiveCompletion();
        renderMissionTracker();
    }
}

// ==========================================
// --- PUBLIC MISSION UTILITY API ---
// ==========================================

const MissionUtils = {
    getActiveContractSummary() {
        syncActiveMissionProgress();
        if (typeof playerActiveMission === 'undefined' || !playerActiveMission) return null;
        const obj = playerActiveMission.objectives && playerActiveMission.objectives[0] ? playerActiveMission.objectives[0] : null;
        return {
            id: playerActiveMission.id,
            type: playerActiveMission.type,
            title: playerActiveMission.title,
            giver: playerActiveMission.giver,
            faction: playerActiveMission.faction || "INDEPENDENT",
            isComplete: Boolean(playerActiveMission.isComplete),
            rewards: playerActiveMission.rewards || {},
            objective: obj
        };
    },
    getBountyDistanceAndBearing() {
        if (typeof playerActiveBounty === 'undefined' || !playerActiveBounty) return null;
        return {
            targetName: playerActiveBounty.targetName,
            coords: { x: playerActiveBounty.x, y: playerActiveBounty.y },
            ..._missionDistAndBearing(playerActiveBounty.x, playerActiveBounty.y)
        };
    },
    getBoardStats() {
        return {
            completedCount: (typeof playerCompletedMissions !== 'undefined' && playerCompletedMissions.size) ? playerCompletedMissions.size : 0,
            hasActiveContract: Boolean(typeof playerActiveMission !== 'undefined' && playerActiveMission),
            hasActiveBounty: Boolean(typeof playerActiveBounty !== 'undefined' && playerActiveBounty),
            templateCount: (typeof MISSION_TEMPLATES !== 'undefined' && Array.isArray(MISSION_TEMPLATES)) ? MISSION_TEMPLATES.length : 0
        };
    },
    registerMissionTemplate(templateDef) {
        if (typeof MISSION_TEMPLATES === 'undefined' || !Array.isArray(MISSION_TEMPLATES)) return false;
        if (!templateDef || !templateDef.id_prefix || !templateDef.type) return false;
        if (!MISSION_TEMPLATES.some(t => t.id_prefix === templateDef.id_prefix)) {
            MISSION_TEMPLATES.push(templateDef);
        }
        return true;
    }
};
window.MissionUtils = MissionUtils;

// ==========================================
// --- SELF-CONTAINED MISSION & BOUNTY HOOKS ---
// ==========================================

if (typeof GameBus !== 'undefined' && !window._missionsBusRegistered) {
    window._missionsBusRegistered = true;

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
    _ensureExpandedMissionTemplates();

    // 1. Override duplicate generateBountyTargets with our valid ship-class version
    window.generateBountyTargets = createStationBountyTargets;

    // 2. Prevent Bounty Targets from triggering Pirate Extortion or Eclipse Cartel Truces
    if (typeof window.initiatePirateExtortion === 'function' && !window._missionsExtortionPatched) {
        const origExtortion = window.initiatePirateExtortion;
        window.initiatePirateExtortion = function(enemy) {
            if (enemy && (enemy.isBountyTarget || enemy.isLegendary)) {
                logMessage(`<span style='color:var(--danger); font-weight:bold;'>[ BOUNTY INTERCEPTED ]</span> Target <b>${_missionEscapeHtml(enemy.name)}</b> locked in sights! Engaging weapons!`);
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
            const isBounty = specificEnemyEntity && (specificEnemyEntity.isBountyTarget || specificEnemyEntity.isLegendary);
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

    // 4. Hook Stellar, Observatory, Atmo-Skim & Surface Expedition scans so SURVEY contracts complete reliably
    if (typeof window.evaluateStar === 'function' && !window._missionsEvalStarPatched) {
        const origEvaluateStar = window.evaluateStar;
        window.evaluateStar = function(starData, starId) {
            origEvaluateStar.apply(this, arguments);
            _completeActiveSurveyMission();
        };
        window._missionsEvalStarPatched = true;
    }

    if (typeof window.captureDeepSkyImage === 'function' && !window._missionsDeepSkyPatched) {
        const origCaptureDeepSky = window.captureDeepSkyImage;
        window.captureDeepSkyImage = function() {
            origCaptureDeepSky.apply(this, arguments);
            _completeActiveSurveyMission();
        };
        window._missionsDeepSkyPatched = true;
    }

    if (typeof window.skimGasGiantAtmosphere === 'function' && !window._missionsAtmoSkimPatched) {
        const origSkim = window.skimGasGiantAtmosphere;
        window.skimGasGiantAtmosphere = function() {
            origSkim.apply(this, arguments);
            _completeActiveSurveyMission();
        };
        window._missionsAtmoSkimPatched = true;
    }

    if (typeof window.startSurfaceExpedition === 'function' && !window._missionsExpeditionPatched) {
        const origExp = window.startSurfaceExpedition;
        window.startSurfaceExpedition = function() {
            origExp.apply(this, arguments);
            _completeActiveSurveyMission();
        };
        window._missionsExpeditionPatched = true;
    }
});

// --- END OF FILE missions.js ---
