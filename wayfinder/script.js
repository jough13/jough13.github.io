// ==========================================
// --- CINEMATIC BOOT SEQUENCE ---
// ==========================================

function bootSequence() {
    const titleScreen = document.getElementById('titleScreenOverlay');
    
    // 1. Read Audio Preferences
    let audioPref = localStorage.getItem('wayfinder_audio_pref');
    let shouldEnableAudio = (audioPref === null) ? false : (audioPref === 'true');
    
    if (typeof soundManager !== 'undefined') {
        soundManager.setMuteState(shouldEnableAudio); 
    }

    // 2. Check for returning players (Looking for a save file or a 'has played' flag)
    // Replace 'wayfinder_save_data' with whatever your actual save key is!
    let isReturningPlayer = localStorage.getItem('wayfinder_save_data') !== null;

    if (!isReturningPlayer) {
        // --- NEW PLAYER: PLAY THE MP4 INTRO MOVIE ---
        
        // 1. Check if the body has your custom CSS class
        const isBodyLight = document.body.classList.contains('light-mode'); 
        
        // 2. Check the user's actual Operating System settings!
        const isOSLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        
        // 3. If either is true, play the white video. Otherwise, play the black one.
        const isLightMode = isBodyLight || isOSLight;
        const videoSrc = isLightMode ? 'assets/intro_white.mp4' : 'assets/intro_black.mp4';
        
        // Inject the video player over the terminal text
        titleScreen.innerHTML = `
            <video id="introVideo" style="width: 100vw; height: 100vh; object-fit: cover;" autoplay>
                <source src="${videoSrc}" type="video/mp4">
            </video>
        `;
        
        const video = document.getElementById('introVideo');
        video.muted = !shouldEnableAudio; // Mute the video if the player has audio off!
        
        // When the video finishes naturally, transition into the game
        video.onended = () => {
            completeBootTransition(titleScreen, shouldEnableAudio);
        };
        
        // Safety fallback: if they click the video, skip it
        video.onclick = () => {
            video.pause();
            completeBootTransition(titleScreen, shouldEnableAudio);
        };

    } else {
        // --- RETURNING PLAYER: QUICK TERMINAL BOOT ---
        completeBootTransition(titleScreen, shouldEnableAudio);
    }
}

function completeBootTransition(titleScreen, shouldEnableAudio) {
    // Fade out whatever is on the title screen (video or terminal)
    titleScreen.style.transition = "opacity 1.5s ease-out";
    titleScreen.style.opacity = "0";
    
    setTimeout(() => {
        titleScreen.style.display = "none";
    }, 1500); 

    // Play the Warp Spool-up SFX
    if (shouldEnableAudio && typeof soundManager !== 'undefined') {
        setTimeout(() => soundManager.playWarp(), 300); 
    }

    // Inject flavor text
    logMessage("<span style='color:var(--accent-color); font-weight:bold;'>> SHIP SYSTEMS INITIALIZED.</span>");
    if (typeof soundManager !== 'undefined' && !soundManager.enabled) {
        logMessage("> <span style='color:var(--warning)'>WARNING: Audio Telemetry remains offline. Use dashboard toggle to enable.</span>");
    }
    logMessage("> Life support green. Engines hot. Awaiting captain's orders.");
}

// ==========================================
// --- SHARED MODULE UI & GAME STATES ---
// ==========================================

let visitedSectors;

let playerActiveBounty = null;
let currentStationBounties = []; // Temporarily holds the bounties available at the current station

let currentStationRecruits = [];

let miningInterval = null;
let miningPos = 0;
let miningDir = 1;
let miningSweetSpot = { start: 40, end: 60 }; 
let anomalyContext = null;

let boardingContext = null;

let selectedCargoIndex = -1;

let cachedAccentColor = '#00E0E0';

// --- ACTIVE ENEMIES ---
let activeEnemies = []; 

// --- RESCUE TRACKING ---
let isAwaitingRescue = false;
let rescueTargetStation = null;
let rescueFeePaid = 0;
let freebieUsed = false;

let activeDistressCalls = [];

// --- AMBIENT TRAFFIC SYSTEM ---
let activeNPCs = [];

const NPC_SHIP_TYPES = [
    { 
        id: "CIVILIAN_HAULER", 
        name: "Civilian Hauler", 
        char: "=",
        color: "#AAAAAA", 
        desc: "A sluggish, heavily laden cargo vessel.",
        image: "assets/civ_hauler.png",
        hails: [
            "Just keeping my head down and my engines hot.",
            "If you're looking for work, Starbase Alpha is hiring.",
            "Subspace chatter says the Kepler Nebula is acting up again."
        ],
        combatProfile: "BRUISER" 
    },
    { 
        id: "INDEPENDENT_MINER", 
        name: "Independent Miner", 
        char: "m",
        color: "#C27E0E", 
        desc: "A rugged rock-hopper covered in plasma burns.",
        image: "assets/independent_miner.png",
        hails: [
            "Good hunting out there, spacer.",
            "These asteroids are stripped bare. Moving to the next sector.",
            "My sensors are picking up weird echoes today..."
        ],
        combatProfile: "RAIDER" 
    },
    { 
        id: "CONCORD_PATROL", 
        name: "Concord Patrol", 
        char: "V",
        color: "#00E0E0", 
        desc: "A heavily armed peacekeeper. Don't cause trouble.",
        image: "assets/concord_patrol.png",
        hails: [
            "Concord Security. Maintain your current vector and stay out of trouble.",
            "We are tracking known pirate activity in this sector. Be advised.",
            "Scan complete. Your registry is clean. Move along."
        ],
        combatProfile: "CONCORD_PATROL" 
    }
];

// Spawns 1-2 neutral ships dynamically just outside the player's viewport
function spawnAmbientNPCs() {
    // Cap the traffic so the galaxy doesn't get cluttered
    if (activeNPCs.length >= 4) return; 

    const numNPCs = Math.floor(Math.random() * 2) + 1; 

    for (let i = 0; i < numNPCs; i++) {
        // Fallback in case NPC_SHIP_TYPES isn't defined yet
        if (typeof NPC_SHIP_TYPES === 'undefined') return;
        
        const type = NPC_SHIP_TYPES[Math.floor(Math.random() * NPC_SHIP_TYPES.length)];
        
        // Spawn them slightly off-screen (Radius based on viewport)
        const spawnDist = Math.floor(VIEWPORT_WIDTH_TILES / 2) + 2;
        const angle = Math.random() * Math.PI * 2;
        
        activeNPCs.push({
            x: Math.floor(playerX + Math.cos(angle) * spawnDist),
            y: Math.floor(playerY + Math.sin(angle) * spawnDist),
            ...type
        });
    }
}

// Call this function at the very end of your moveShip(dx, dy) function!
function updateAmbientNPCs() {
    if (typeof activeNPCs === 'undefined') return;

    // Loop backward because we might splice (despawn) elements!
    for (let i = activeNPCs.length - 1; i >= 0; i--) {
        const npc = activeNPCs[i];
        
        // ==========================================
        // --- 1. NEW FLIGHT STATE MACHINE ---
        // ==========================================
        
        // Initialize State Machine if they don't have one
        if (!npc.state) {
            npc.state = 'CRUISING';
            npc.vx = 0; 
            npc.vy = 0;
            npc.stepsRemaining = 0;
        }

        // A. DOCKED STATE: Wait at the station
        if (npc.state === 'DOCKED') {
            npc.dockTimer--;
            if (npc.dockTimer <= 0) {
                // Time to leave! Pick a random trajectory away from the station.
                npc.state = 'CRUISING';
                npc.stepsRemaining = Math.floor(Math.random() * 15) + 10;
                do {
                    npc.vx = Math.floor(Math.random() * 3) - 1;
                    npc.vy = Math.floor(Math.random() * 3) - 1;
                } while (npc.vx === 0 && npc.vy === 0);
            }
        }
        
        // B. DOCKING STATE: Intercepting a Station
        else if (npc.state === 'DOCKING') {
            // Move strictly toward the target coordinates
            if (npc.x < npc.targetX) npc.x++;
            else if (npc.x > npc.targetX) npc.x--;
            
            if (npc.y < npc.targetY) npc.y++;
            else if (npc.y > npc.targetY) npc.y--;

            // Have we arrived?
            if (npc.x === npc.targetX && npc.y === npc.targetY) {
                npc.state = 'DOCKED';
                npc.dockTimer = 20; // Wait 20 turns before undocking
            }
        }

        // B.5 RESCUE STATE: Fuel Rat intercepting player
        else if (npc.state === 'RESCUE') {
            // Fuel Rats move fast (2 tiles per turn) to reduce boring waiting
            for (let step = 0; step < 2; step++) {
                if (npc.x < playerX) npc.x++;
                else if (npc.x > playerX) npc.x--;
                
                if (npc.y < playerY) npc.y++;
                else if (npc.y > playerY) npc.y--;
                
                if (npc.x === playerX && npc.y === playerY) break;
            }
        }
        
        // C. CRUISING STATE: Standard Spaceflight
        else if (npc.state === 'CRUISING') {
            
            // --- THE FIX: NPC HESITATION ---
            // 30% chance for the NPC to pause this turn (scanning, adjusting nav, etc.)
            // This makes them effectively move at 0.7x speed, allowing the player to catch them!
            if (Math.random() < 0.30) {
                // We still do collision/hailing checks below, we just skip the movement logic for this turn.
            } else {
                // Sensory Sweep: Look for nearby stations (10% chance per step)
                if (Math.random() < 0.10) {
                    let foundStation = false;
                    // Scan a 7x7 grid around the NPC
                    for (let dy = -3; dy <= 3; dy++) {
                        for (let dx = -3; dx <= 3; dx++) {
                            const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(npc.x + dx, npc.y + dy) : null;
                            const char = typeof getTileChar === 'function' ? getTileChar(tile) : '.';
                            
                            // If we see a station, lock on and begin approach!
                            if (char === STARBASE_CHAR_VAL || char === OUTPOST_CHAR_VAL) {
                                npc.state = 'DOCKING';
                                npc.targetX = npc.x + dx;
                                npc.targetY = npc.y + dy;
                                foundStation = true;
                                break;
                            }
                        }
                        if (foundStation) break;
                    }
                    // If they just locked on, wait until next turn to start moving towards it
                    if (foundStation) {
                        // We skip normal movement, but continue to collision checks below
                    } else {
                         // Maintain Vector: Travel in a straight line
                        if (npc.stepsRemaining <= 0) {
                            // Pick a new vector and hold it for 5 to 20 turns
                            npc.stepsRemaining = Math.floor(Math.random() * 15) + 5; 
                            do {
                                npc.vx = Math.floor(Math.random() * 3) - 1;
                                npc.vy = Math.floor(Math.random() * 3) - 1;
                            } while (npc.vx === 0 && npc.vy === 0); // Don't stand still
                        }

                        // Apply momentum
                        npc.x += npc.vx;
                        npc.y += npc.vy;
                        npc.stepsRemaining--;
                    }
                } else {
                     // Maintain Vector: Travel in a straight line
                    if (npc.stepsRemaining <= 0) {
                        // Pick a new vector and hold it for 5 to 20 turns
                        npc.stepsRemaining = Math.floor(Math.random() * 15) + 5; 
                        do {
                            npc.vx = Math.floor(Math.random() * 3) - 1;
                            npc.vy = Math.floor(Math.random() * 3) - 1;
                        } while (npc.vx === 0 && npc.vy === 0); // Don't stand still
                    }

                    // Apply momentum
                    npc.x += npc.vx;
                    npc.y += npc.vy;
                    npc.stepsRemaining--;
                }
            }
        }

        // ==========================================
        // --- 2. DESPAWN, HAILING, & COLLISIONS ---
        // ==========================================

        const dist = Math.abs(npc.x - playerX) + Math.abs(npc.y - playerY);
        
        // Despawn if they drift too far off-screen (Keeps memory clean!)
        if (dist > VIEWPORT_WIDTH_TILES) {
            activeNPCs.splice(i, 1);
            continue;
        }

        // Proximity Hailing
        if (dist > 0 && dist <= 3 && Math.random() < 0.15) {
            if (npc.hails && npc.hails.length > 0) {
                const randomHail = npc.hails[Math.floor(Math.random() * npc.hails.length)];
                logMessage(`<span style="color:${npc.color || '#fff'}">[COMMS] ${npc.name}: "${randomHail}"</span>`);
            }
        }
        
        // Collision Check (Did you ram them, or did they catch you?)
        if (npc.x === playerX && npc.y === playerY) {
            if (npc.isFuelRat) {
                activeNPCs.splice(i, 1); // Delete the rat
                executeRescueSequence(); // Trigger the tow!
                continue; // Skip the rest of the loop
            } else {
                if (typeof interactWithNPC === 'function') interactWithNPC(npc, i);
            }
        }
    }
}

// ==========================================
// --- NPC INTERACTION & COMMS ---
// ==========================================

function interactWithNPC(npc, index) {
    openGenericModal("PROXIMITY ALERT");
    const modalContent = document.getElementById('genericModalContent');

    // Override the default two-column flex layout and enable scrolling.
    modalContent.style.cssText = "display: block; overflow-y: auto;";

    // Dynamically choose between the image portrait or the ASCII character
    let imageHtml = '';
    if (npc.image) {
        imageHtml = `
            <img src="${npc.image}" alt="${npc.name}" 
                 style="width: 120px; height: 120px; border-radius: 50%; border: 2px solid ${npc.color}; 
                        object-fit: cover; object-position: top; margin-bottom: 15px; background: #000; 
                        box-shadow: 0 0 15px ${npc.color};">
        `;
    } else {
        imageHtml = `
            <div style="font-size:60px; margin-bottom:15px; color:${npc.color}; text-shadow: 0 0 15px ${npc.color};">${npc.char}</div>
        `;
    }

    const transponderId = `${npc.name.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*9000)+1000}`;
    const shipClass = npc.shipClass || (npc.faction === 'CONCORD' ? 'Patrol Cruiser' : npc.faction === 'KTHARR' ? 'War Barge' : 'Modified Freighter');
    const threatLvl = npc.level || Math.floor(Math.random() * 5) + 1;
    
    let statusText = "ON PATROL";
    let statusColor = "var(--success)";
    if (npc.state === 'DOCKED') {
        statusText = "DOCKED (ENGINES COLD)";
        statusColor = "var(--item-desc-color)";
    } else if (npc.state === 'DOCKING') {
        statusText = "APPROACHING STATION";
        statusColor = "var(--accent-color)";
    } else if (npc.vx !== 0 || npc.vy !== 0) {
        statusText = "IN TRANSIT";
    }

    const commsText = (npc.dialogue && npc.dialogue.length > 0) 
        ? npc.dialogue[0] 
        : "We are transmitting our transponder codes. Please maintain safe distance.";

    // --- NEW UI: A 2x2 Button Grid ---
    modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10px 20px;">
            
            ${imageHtml}
            
            <h3 style="color:${npc.color}; margin: 0 0 5px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">${npc.name}</h3>
            <div style="color:var(--item-desc-color); font-size:11px; margin-bottom:15px; letter-spacing: 2px;">
                FACTION ALLIANCE: ${npc.faction || 'INDEPENDENT'}
            </div>

            <div style="width: 100%; text-align:left; background: var(--bg-color); border: 1px solid var(--border-color); padding: 12px; border-radius: 4px; margin-bottom: 15px; box-sizing: border-box;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block; margin-bottom:1px;">TRANSPONDER ID</span>
                        <div style="font-size:12px; font-weight:bold; color:var(--text-color);">${transponderId}</div>
                    </div>
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block; margin-bottom:1px;">VESSEL CLASS</span>
                        <div style="font-size:12px; font-weight:bold; color:var(--text-color);">${shipClass}</div>
                    </div>
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block; margin-bottom:1px;">THREAT ASSESSMENT</span>
                        <div style="font-size:12px; font-weight:bold; color:${threatLvl > 3 ? 'var(--danger)' : 'var(--warning)'};">LEVEL ${threatLvl}</div>
                    </div>
                    <div>
                        <span style="font-size:9px; color:var(--accent-color); display:block; margin-bottom:1px;">CURRENT VECTOR</span>
                        <div style="font-size:12px; font-weight:bold; color:${statusColor};">${statusText}</div>
                    </div>
                </div>
            </div>
            
            <p style="color:var(--item-desc-color); font-size:12px; line-height: 1.5; margin: 0 0 15px 0;">${npc.desc || "A standard vessel making its way through the sector."}</p>
            
            <div style="width: 100%; padding:15px; background:rgba(0,0,0,0.5); border:1px dashed ${npc.color}; border-radius:4px; font-style:italic; box-sizing: border-box;">
                "${commsText}"
            </div>

            <div id="tacticalScanResults" style="width: 100%; margin-top: 15px;"></div>

            <div class="trade-btn-group" style="margin-top: 20px; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="action-button" onclick="closeGenericModal()">
                    MAINTAIN COURSE
                </button>
                <button class="action-button" onclick="initiateShipToShipTrade(${index})" style="border-color:var(--gold-text); color:var(--gold-text);">
                    REQUEST TRADE
                </button>
                
                ${npc.faction === 'CONCORD' ? `
                <button class="action-button danger-btn" onclick="dumpAllContraband()">
                    DUMP CONTRABAND
                </button>
                ` : `
                <button class="action-button" onclick="scanNPCCargo(${index})" style="border-color:var(--accent-color); color:var(--accent-color);">
                    TACTICAL SCAN
                </button>
                `}
                
                <button class="action-button danger-btn" onclick="commitPiracy(${index})">
                    POWER WEAPONS
                </button>
            </div>
        </div>
    `;
}

function dumpAllContraband() {
    let dumped = false;
    for (const itemID in playerCargo) {
        if (COMMODITIES[itemID] && COMMODITIES[itemID].illegal && playerCargo[itemID] > 0) {
            delete playerCargo[itemID];
            dumped = true;
        }
    }
    if (dumped) {
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        if (typeof soundManager !== 'undefined') soundManager.playHullHit(); // Airlock thud
        showToast("CONTRABAND JETTISONED", "warning");
        logMessage("<span style='color:var(--warning)'>You flush all illegal cargo out the airlock before the patrol can scan you.</span>");
        closeGenericModal();
        renderUIStats();
    } else {
        showToast("NO CONTRABAND TO DUMP", "info");
    }
}

// --- SENSOR LOGIC ---

function scanNPCCargo(index) {
    // 1. Check if the player has the required gear/perk to pierce civilian shields
    const hasPerk = typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('LONG_RANGE_SENSORS');
    const hasScanner = playerShip && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE';
    
    if (!hasPerk && !hasScanner) {
        logMessage("<span style='color:var(--danger)'>[ SENSORS ] Tactical scan failed. Advanced Telemetry Array required to pierce hull plating.</span>");
        if (typeof showToast === 'function') showToast("SENSORS INSUFFICIENT", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    const npc = activeNPCs[index];
    const resultsContainer = document.getElementById('tacticalScanResults');
    
    if (typeof soundManager !== 'undefined') soundManager.playScan();
    logMessage(`<span style='color:var(--accent-color)'>[ SENSORS ] Penetrating hull plating of ${npc.name}...</span>`);

    // 2. Generate the manifest based on the ship type
    let cargoList = "";
    const lowerName = (npc.name || "").toLowerCase();
    
    if (lowerName.includes("miner")) {
        cargoList = `<li>MINERALS (High Yield)</li><li>RARE METALS (Trace Amounts)</li>`;
    } else if (npc.faction === 'ECLIPSE' || lowerName.includes("smuggler")) {
        cargoList = `<li style="color:var(--danger); font-weight:bold;">PROHIBITED STIMS (Contraband)</li><li style="color:var(--danger); font-weight:bold;">FORBIDDEN TEXTS (Contraband)</li><li>MEDICAL SUPPLIES</li>`;
    } else if (npc.faction === 'KTHARR') {
        cargoList = `<li>K'THARR SPICES</li><li>LIVING HULL TISSUE</li>`;
    } else if (npc.faction === 'CONCORD') {
        cargoList = `<li>WEAPONRY (Restricted)</li><li>FUEL CELLS (Standard)</li>`;
    } else {
        cargoList = `<li>FOOD SUPPLIES (Bulk)</li><li>FUEL CELLS (Standard)</li><li>TECH PARTS (Commercial)</li>`;
    }

    // 3. Inject the beautiful scan readout directly into the modal
    resultsContainer.innerHTML = `
        <div style="background:rgba(0, 224, 224, 0.1); border: 1px solid var(--accent-color); padding: 15px; border-radius: 4px; text-align: left; animation: fadeIn 0.5s;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--accent-color); padding-bottom:6px; margin-bottom:10px;">
                <div style="color:var(--accent-color); font-size:11px; letter-spacing:2px; font-weight:bold;">TACTICAL TELEMETRY</div>
                <div style="font-size:18px;">📡</div>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-bottom: 10px; font-size:12px;">
                <div style="color:var(--item-desc-color);">Shield Harmonics: <span style="color:var(--warning);">Stable</span></div>
                <div style="color:var(--item-desc-color);">Armor Plating: <span style="color:var(--success);">100%</span></div>
            </div>

            <div style="color:var(--text-color); font-size:11px; letter-spacing:1px; margin-bottom:5px;">DETECTED MANIFEST:</div>
            <ul style="color:var(--item-name-color); font-size:13px; margin:0; padding-left:20px; line-height:1.6;">
                ${cargoList}
            </ul>
        </div>
    `;

    // 4. Earned Knowledge: Unlock Codex Entries based on the successful scan!
    if (typeof unlockLoreEntry === 'function') {
        // Unlock Faction Lore
        if (npc.faction === 'CONCORD') unlockLoreEntry('FACTION_CONCORD');
        if (npc.faction === 'ECLIPSE') unlockLoreEntry('FACTION_ECLIPSE');
        if (npc.faction === 'KTHARR') unlockLoreEntry('FACTION_KTHARR');
        
        // Unlock Ship Chassis Lore
        const shipClassUpper = (npc.shipClass || "").toUpperCase();
        if (shipClassUpper.includes("FREIGHTER") || shipClassUpper.includes("HAULER")) unlockLoreEntry('LORE_SHIP_LIGHT_FREIGHTER');
        if (shipClassUpper.includes("COURIER")) unlockLoreEntry('LORE_SHIP_COURIER');
        if (shipClassUpper.includes("INTERCEPTOR") || shipClassUpper.includes("STRIKER")) unlockLoreEntry('LORE_SHIP_INTERCEPTOR');
        if (shipClassUpper.includes("SCOUT")) unlockLoreEntry('LORE_SHIP_SCOUT');
        if (shipClassUpper.includes("DREADNOUGHT") || shipClassUpper.includes("BARGE")) unlockLoreEntry('LORE_SHIP_DREADNOUGHT');
    }
}

// ==========================================
// --- NPC INTERACTION ACTIONS ---
// ==========================================

function commitPiracy(index) {
    const npc = activeNPCs[index];
    
    // 1. Remove them from the peaceful ambient traffic array
    activeNPCs.splice(index, 1);
    
    // 2. Convert them into a hostile enemy entity
    if (typeof activeEnemies === 'undefined') window.activeEnemies = [];
    
    const enemyEntity = {
        x: npc.x,
        y: npc.y,
        id: "PIRATED_" + Date.now(),
        name: npc.name,
        char: npc.char,
        color: '#FF5555', // Turn them red!
        shipClassKey: npc.combatProfile || "BRUISER",
        faction: npc.faction || 'INDEPENDENT',
        isHostile: true
    };
    
    activeEnemies.push(enemyEntity);
    
    // 3. Apply the legal consequences!
    playerNotoriety += 5;
    if (typeof updateNotorietyTitle === 'function') updateNotorietyTitle();
    
    logMessage(`<span style='color:var(--danger)'>[ HOSTILE ACTION ] Weapons locked on ${npc.name}. Concord bounties updated.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playWarning();
    
    closeGenericModal();
    
    // 4. Instantly start combat with this specific ship
    if (typeof startCombat === 'function') startCombat(enemyEntity);
}

function initiateShipToShipTrade(index) {
    const npc = activeNPCs[index];
    // We will build this in trade.js!
    if (typeof openShipTrade === 'function') {
        openShipTrade(npc);
    } else {
        logMessage(`"Sorry Commander, our manifest is locked. No trading today."`);
        closeGenericModal();
    }
}

// ==========================================
// --- EVENT BUS SYSTEM (Decoupling) ---
// ==========================================

const GameBus = {
    events: {},
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    },
    emit(event, data) {
        if (this.events[event]) this.events[event].forEach(l => l(data));
    }
};

// Universal Helper Function to fetch any piece of data safely
function getDef(category, id) {
    if (!GameRegistry[category]) return null;
    return GameRegistry[category][id] || null;
}

// --- COLONY BUILDER STATE ---
let playerHasColonyCharter = false; 

// Dictionary to store multiple colonies
let playerColonies = {};

// --- CORE SYSTEM LISTENERS ---
// Whenever cargo changes, automatically recalculate the load and update the UI
GameBus.on('CARGO_MODIFIED', () => {
    // 1. Calculate actual cargo weight using the database values
    currentCargoLoad = 0;
    for (const cID in playerCargo) {
        if (playerCargo[cID] > 0) {
            const itemData = typeof COMMODITIES !== 'undefined' ? COMMODITIES[cID] : null;
            const weightPerUnit = itemData && itemData.weight !== undefined ? itemData.weight : 1;
            
            currentCargoLoad += (playerCargo[cID] * weightPerUnit);
        }
    }
    
    // 2. The Invisible Quest Hooks & Lore Unlocks
    // If they have the charter in their hold, but haven't formally started the quest:
    if (playerCargo["COLONY_CHARTER"] > 0 && !playerHasColonyCharter) {
        playerHasColonyCharter = true;
        
        // Fire off the ceremonial Pioneer notifications!
        if (typeof showToast === 'function') showToast("CONCORD PIONEER STATUS GRANTED", "success");
        logMessage("<span style='color:var(--gold-text); font-weight:bold;'>QUEST UPDATE:</span> You are now a legally recognized Pioneer of the Concord Dominion. Find a habitable world to establish your settlement.");
        if (typeof soundManager !== 'undefined' && soundManager.playBuy) soundManager.playBuy();
        
        // Unlock the lore!
        unlockLoreEntry("TECH_COLONY_CHARTER");
    }

    // Check for Encrypted Engrams
    if (playerCargo["ENCRYPTED_ENGRAM"] > 0 && typeof discoveredLoreEntries !== 'undefined' && !discoveredLoreEntries.has("COMMODITY_ENCRYPTED_ENGRAM")) {
        unlockLoreEntry("COMMODITY_ENCRYPTED_ENGRAM");
    }

    // 3. Update the UI
    GameBus.emit('UI_REFRESH_REQUESTED');
});

// --- NEW GAMEBUS LISTENERS ---

// 1. Centralized XP Handler
GameBus.on('XP_GAINED', (amount) => {
    if (amount <= 0) return;
    
    playerXP += amount;
    
    // Automatically check for level up
    if (typeof checkLevelUp === 'function') checkLevelUp();
    
    // Auto-refresh the UI
    GameBus.emit('UI_REFRESH_REQUESTED');
});

// 2. Centralized Damage Handler
GameBus.on('HULL_DAMAGED', (data) => {
    // data = { amount: 15, reason: "Asteroid Collision" }
    playerHull -= data.amount;
    
    // Trigger all the universal juice (screen shake, sounds, red flash)
    if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
    if (typeof triggerHaptic === 'function') triggerHaptic([100, 50, 100]);
    
    // Death Check
    if (playerHull <= 0) {
        if (typeof triggerGameOver === 'function') {
            triggerGameOver(data.reason || "Catastrophic Hull Breach");
        }
    } else {
        GameBus.emit('UI_REFRESH_REQUESTED');
    }
});

// 3. Centralized Healing Handler
GameBus.on('HULL_REPAIRED', (amount) => {
    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + amount);
    GameBus.emit('UI_REFRESH_REQUESTED');
});

// Whenever vitals, credits, or stats change, refresh the UI
let _uiUpdatePending = false;
GameBus.on('UI_REFRESH_REQUESTED', () => {
    if (!_uiUpdatePending) {
        _uiUpdatePending = true;
        // Wait until the browser is ready to draw the next frame, then update the UI ONCE.
        requestAnimationFrame(() => {
            if (typeof renderUIStats === 'function') renderUIStats();
            _uiUpdatePending = false;
        });
    }
});

// --- NPC CREW SYSTEM GLOBALS ---
let playerCrew = []; 
const MAX_CREW = 3;

// The unique sidekicks available in the galaxy
const CREW_DATABASE = {
    "JAX_VANE": { id: "JAX_VANE", name: "Jax Vane", role: "Gunner", cost: 1500, icon: "🎯", desc: "Ex-pirate with a steady hand. Adds +15% to all ship weapon damage.", perk: "COMBAT_DAMAGE" },
    "ELARA_VOSS": { id: "ELARA_VOSS", name: "Elara Voss", role: "Smuggler", cost: 2000, icon: "🪙", desc: "Smooth talker with underworld ties. Negotiates 10% better prices at all markets.", perk: "TRADE_BONUS" },
    "KORG_MAH": { id: "KORG_MAH", name: "Korg'Mah", role: "Mechanic", cost: 1800, icon: "🔧", desc: "A rugged K'tharr engineer. Passively repairs hull damage while you travel.", perk: "PASSIVE_REPAIR" },
    "T3_SPARK": { id: "T3_SPARK", name: "T3-Spark", role: "Science Bot", cost: 2500, icon: "🤖", desc: "Advanced automated logic core. Increases fuel scooping yields by 20%.", perk: "SCOOP_BONUS" }
};

const ECLIPSE_MERCENARIES = [
    { 
        id: "MERC_VOIDFANG", name: "Kaelen 'Voidfang'", role: "Enforcer", cost: 4500, 
        desc: "Brutal, highly illegal combat augmentations. Will shoot first and ask questions never.", 
        stats: { damageBonus: 12 }, 
        drawback: { type: "STEAL_CREDITS", chance: 0.1, amount: 250 } 
    },
    { 
        id: "MERC_GHOST", name: "The Ghost", role: "Evasion Pilot", cost: 6000, 
        desc: "Can outfly a Concord tracking missile. Known to occasionally 'misplace' cargo.", 
        stats: { evasionBonus: 0.25 }, 
        drawback: { type: "STEAL_CARGO", chance: 0.05, amount: 2 } 
    }
];

// ==========================================
// --- CENTRALIZED GAME REGISTRY ---
// ==========================================

// Bundles all hardcoded data files into a single accessible engine object.
// This allows for easy modding, expansions, and data lookups.

const GameRegistry = {
    ships: typeof SHIP_CLASSES !== 'undefined' ? SHIP_CLASSES : {},
    items: typeof COMMODITIES !== 'undefined' ? COMMODITIES : {}, // Note: Check if your items.js uses COMMODITIES or LOOT_TABLES
    lore: typeof LORE_DATABASE !== 'undefined' ? LORE_DATABASE : {},
    perks: typeof PERKS_DATABASE !== 'undefined' ? PERKS_DATABASE : {},
    biomes: typeof PLANET_BIOMES !== 'undefined' ? PLANET_BIOMES : {},
    locations: typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA : {},
    rumors: typeof RUMORS !== 'undefined' ? RUMORS : [],
    crew: typeof CREW_DATABASE !== 'undefined' ? CREW_DATABASE : {}
};

// --- COMPONENT SYNERGY GLOBALS ---
let activeSynergy = null;

const SYNERGIES_DATABASE = {
    "CONCORD": { id: "CONCORD", name: "Concord Authority", req: 3, desc: "+20 Max Shields", effect: () => { MAX_SHIELDS += 20; } },
    "KTHARR": { id: "KTHARR", name: "K'tharr Blood-Iron", req: 3, desc: "+5 Weapon Damage", effect: () => { PLAYER_ATTACK_DAMAGE += 5; } },
    "ECLIPSE": { id: "ECLIPSE", name: "Eclipse Shadow", req: 3, desc: "+15% Evasion", effect: () => { /* Passive combat hook */ } },
    "FRONTIER": { id: "FRONTIER", name: "Scrapper's Luck", req: 3, desc: "+50 Max Fuel", effect: () => { MAX_FUEL += 50; } }
};

// Helper function to easily check if we have a specific crew member perk active
function hasCrewPerk(perkName) {
    return playerCrew.some(c => c.perk === perkName);
}

// A sector resets after this much "time" has passed since you last touched it.
// 50.0 stardate units is roughly 5000 moves or several jumps.
const RESOURCE_RESPAWN_TIME = 50.0;

let playerPerks = new Set(); // Stores IDs like "DEEP_CORE_MINING"

// --- ECONOMY GLOBALS ---
let activeMarketTrend = null; // Stores the current "Hot Tip" { station: "Name", item: "ID", expiry: 0 }

 // --- PARTICLE SYSTEM GLOBALS ---
let activeParticles = [];
let lastParticleTime = 0;
let particleAnimationId = null;

let floatingTexts = [];

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x: x + 0.5, y: y + 0.5, text, color, life: 1.0, offsetY: 0 });
    if (!particleAnimationId) animateParticles();
}

function getThemeColor(varName, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

/**
 * Spawns subtle particles at a specific world coordinate.
 * @param {number} x - World Grid X
 * @param {number} y - World Grid Y
 * @param {string} type - 'thruster', 'mining', 'explosion', 'gain'
 * @param {object} dir - Optional direction vector {x, y} for thrusters
 */

function spawnParticles(x, y, type, dir = { x: 0, y: 0 }) {
    let count = 0;
    let color = '#FFF';
    let speed = 0.1;
    let life = 1.0; // 1.0 = 100% opacity start

    // Center the particle on the tile
    const startX = x + 0.5;
    const startY = y + 0.5;

    switch (type) {
        case 'thruster':
            count = 3; 
            color = '#88CCFF'; // Cyan-ish engine glow
            speed = 0.05;
            break;
        case 'mining':
            count = 5;
            color = '#AAAAAA'; // Grey dust
            speed = 0.1;
            break;
        case 'explosion':
            count = 8;
            color = '#FF5555'; // Red sparks
            speed = 0.2;
            break;
        case 'gain':
            count = 6;
            color = '#FFFF00'; // Gold/Credit glint
            speed = 0.15;
            break;
    }

    for (let i = 0; i < count; i++) {
        // Random spread
        const angle = Math.random() * Math.PI * 2;
        let velX = Math.cos(angle) * speed * Math.random();
        let velY = Math.sin(angle) * speed * Math.random();

        // If thruster, push opposite to movement direction
        if (type === 'thruster') {
            velX = (dir.x * -0.1) + (Math.random() * 0.05 - 0.025);
            velY = (dir.y * -0.1) + (Math.random() * 0.05 - 0.025);
        }

        activeParticles.push({
            x: startX,
            y: startY,
            vx: velX,
            vy: velY,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03, // Fade speed
            color: color,
            size: Math.random() < 0.5 ? 2 : 1 // Minimalist pixels
        });
    }

    // Start the animation loop if it's not running
    if (!particleAnimationId) {
        animateParticles();
    }
}

function animateParticles() {
    // Stop the loop if there are no particles and no active pulse
    if (activeParticles.length === 0 && !sensorPulseActive) {
        particleAnimationId = null;
        if (currentGameState === GAME_STATES.GALACTIC_MAP) render(); 
        return;
    }

    // --- PAUSE LOOP IF NOT ON MAP ---
    // If the player is in a menu or on a planet, pause the animation entirely!
    if (currentGameState !== GAME_STATES.GALACTIC_MAP) {
        particleAnimationId = requestAnimationFrame(animateParticles);
        return; // Skip all math and rendering for this frame!
    }

    // Update Particles (Movement & Decay)
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            activeParticles.splice(i, 1);
        }
    }

    render(); 
    particleAnimationId = requestAnimationFrame(animateParticles);
}

 const chunkManager = {
     CHUNK_SIZE: 16,
     loadedChunks: {},
     staticLocations: new Map(),

     // --- Performance Optimization: Cache the last accessed chunk ---
     // This prevents thousands of string key generations/lookups per frame during rendering.
     lastChunkKey: null,
     lastChunkRef: null,

     initializeStaticLocations() {
         this.staticLocations.clear();
         
         // Safety Check: Ensure LOCATIONS_DATA exists before looping
         if (typeof LOCATIONS_DATA === 'undefined') {
             console.warn("locations.js failed to load or is missing.");
             return; 
         }

         for (const name in LOCATIONS_DATA) {
             const location = LOCATIONS_DATA[name];
             const key = `${location.coords.x},${location.coords.y}`;
             this.staticLocations.set(key, {
                 name,
                 ...location
             });
         }
     },

     generateChunk(chunkX, chunkY) {
         const chunkKey = `${chunkX},${chunkY}`;
         let chunkData = Array.from({
             length: this.CHUNK_SIZE
         }, () => Array(this.CHUNK_SIZE).fill(null));

         const representativeWorldX = chunkX * this.CHUNK_SIZE;
         const representativeWorldY = chunkY * this.CHUNK_SIZE;
         const sectorX = Math.floor(representativeWorldX / SECTOR_SIZE);
         const sectorY = Math.floor(representativeWorldY / SECTOR_SIZE);
         const sectorName = generateSectorName(sectorX, sectorY);

         let starChance = STAR_SPAWN_CHANCE;
         let asteroidChance = ASTEROID_SPAWN_CHANCE;
         let nebulaChance = 0.0; // Start at 0, only add in nebula sectors

         if (sectorName.includes("Belt") || sectorName.includes("Fields") || sectorName.includes("Reach")) {
             asteroidChance = ASTEROID_BELT_CHANCE;
         } else if (sectorName.includes("Nebula") || sectorName.includes("Veil") || sectorName.includes("Shroud")) {
             nebulaChance = NEBULA_SPAWN_CHANCE;
             starChance = STAR_SPAWN_CHANCE / 2;
         } else if (sectorName.includes("Badlands") || sectorName.includes("Peril") || sectorName.includes("Hazard")) {
             asteroidChance = 0.025;
         }

         for (let y = 0; y < this.CHUNK_SIZE; y++) {
             for (let x = 0; x < this.CHUNK_SIZE; x++) {
                 const worldX = chunkX * this.CHUNK_SIZE + x;
                 const worldY = chunkY * this.CHUNK_SIZE + y;
                 const locationKey = `${worldX},${worldY}`;

                 // NEW: SPAWN NEXUS ---
                 if (mystery_first_nexus_location && 
                     worldX === mystery_first_nexus_location.x && 
                     worldY === mystery_first_nexus_location.y) {
                     
                     chunkData[y][x] = {
                         char: NEXUS_CHAR_VAL,
                         type: 'nexus',
                         name: "The First Nexus",
                         activated: mystery_nexus_activated
                     };
                     continue; // Skip standard generation for this tile
                 }

                 if (this.staticLocations.has(locationKey)) {
                     const location = this.staticLocations.get(locationKey);
                     chunkData[y][x] = {
                         ...location,       
                         // 🚨 Prioritize custom characters over the type string!
                         char: location.char || location.displayChar || location.type, 
                         type: 'location'   
                     };
                 } else {
                     let tile = EMPTY_SPACE_CHAR_VAL;
                     const tileSeed = WORLD_SEED ^ (worldX * 73856093) ^ (worldY * 19349663);

                     if (seededRandom(tileSeed) < starChance) {
                         tile = {
                             char: STAR_CHAR_VAL,
                             type: 'star',
                             richness: seededRandom(tileSeed + 1),
                             scoopedThisVisit: false
                         };
                     } else if (seededRandom(tileSeed + 2) < asteroidChance) {
                         tile = {
                             char: ASTEROID_CHAR_VAL,
                             type: 'asteroid',
                             density: seededRandom(tileSeed + 3),
                             minedThisVisit: false
                         };
                     } else if (seededRandom(tileSeed + 4) < nebulaChance) {
                         tile = {
                             char: NEBULA_CHAR_VAL,
                             type: 'nebula'
                         };
                    } else if (seededRandom(tileSeed + 10) < 0.0005) { // Extremely rare
                        tile = {
                            char: PIRATE_BASE_CHAR_VAL,
                            type: 'location',
                            name: "Hidden Cartel Outpost",
                            isPirateBase: true,
                            cleared: false
                        };
                     } else if (seededRandom(tileSeed + 5) < WORMHOLE_SPAWN_CHANCE) {
                         tile = {
                             char: WORMHOLE_CHAR_VAL,
                             type: 'wormhole'
                         };
                     } else if (seededRandom(tileSeed + 6) < OUTPOST_SPAWN_CHANCE) {
                        const outpostSeed = tileSeed + 7;
                        const outpostName = `Outpost ${String.fromCharCode(65 + Math.floor(seededRandom(outpostSeed) * 26))}-${Math.floor(seededRandom(outpostSeed+1) * 999)}`;
                        
                        // 1. Create the Map Tile
                        tile = {
                            char: OUTPOST_CHAR_VAL,
                            type: 'location',
                            name: outpostName,
                            faction: "INDEPENDENT",
                            isMajorHub: false,
                            sells: [{
                                id: "FUEL_CELLS",
                                priceMod: 1.5,
                                stock: 20 + Math.floor(seededRandom(outpostSeed + 2) * 30)
                            }, {
                                id: "TECH_PARTS",
                                priceMod: 1.3,
                                stock: 5 + Math.floor(seededRandom(outpostSeed + 3) * 10)
                            }],
                            buys: [{
                                id: "MINERALS",
                                priceMod: 0.9,
                                stock: 30 + Math.floor(seededRandom(outpostSeed + 4) * 50)
                            }, {
                                id: "FOOD_SUPPLIES",
                                priceMod: 0.8,
                                stock: 20 + Math.floor(seededRandom(outpostSeed + 5) * 40)
                            }],
                            scanFlavor: "A small, automated independent outpost. It offers basic supplies at a markup and buys local resources."
                        };

                        // 2. Register in Global LOCATIONS_DATA
                        // This makes the outpost valid for Cantina Rumors and Delivery Missions!
                        if (typeof LOCATIONS_DATA !== 'undefined' && !LOCATIONS_DATA[outpostName]) {
                            LOCATIONS_DATA[outpostName] = {
                                coords: { x: worldX, y: worldY },
                                type: OUTPOST_CHAR_VAL, // Matches structure in locations.js
                                isMajorHub: false,
                                faction: "INDEPENDENT",
                                sells: tile.sells, // Reference the same trade data
                                buys: tile.buys,
                                scanFlavor: tile.scanFlavor
                            };
                        this.staticLocations.set(locationKey, tile);
                        }

                    } else if (seededRandom(tileSeed + 8) < ANOMALY_SPAWN_CHANCE) {
                         tile = {
                             char: ANOMALY_CHAR_VAL,
                             type: 'anomaly',
                             subtype: 'unstable warp pocket',
                             studied: false
                         };
                     } else if (seededRandom(tileSeed + 9) < DERELICT_SPAWN_CHANCE) {
                         tile = {
                             char: DERELICT_CHAR_VAL,
                             type: 'derelict',
                             studied: false
                         };
                     }
                    // Check if we have saved changes for this specific coordinate
                    const deltaKey = `${worldX},${worldY}`;
                    if (worldStateDeltas[deltaKey]) {
                        // Merge the saved flags (e.g., minedThisVisit) into the generated tile
                        Object.assign(tile, worldStateDeltas[deltaKey]);
                    }
                     chunkData[y][x] = tile;
                 }
             }
         }
         this.loadedChunks[chunkKey] = chunkData;
         return chunkData;
     },

     pruneChunks(playerChunkX, playerChunkY) {
         const MAX_CHUNK_DIST = 7; // Slightly increased to account for Manhattan math
         const keys = Object.keys(this.loadedChunks);
         let prunedCount = 0;

         keys.forEach(key => {
             const [cx, cy] = key.split(',').map(Number);
             
             // Use Manhattan Distance instead of square root!
             const dist = Math.abs(cx - playerChunkX) + Math.abs(cy - playerChunkY);

             if (dist > MAX_CHUNK_DIST) {
                 delete this.loadedChunks[key];
                 prunedCount++;
             }
         });

         if (prunedCount > 0) {
             // Optional: console.log(`Memory Manager: Unloaded ${prunedCount} distant chunks.`);
         }
     },

     getTile(worldX, worldY) {
         const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
         const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
         const chunkKey = `${chunkX},${chunkY}`;

         // --- OPTIMIZATION START ---
         // 1. Check if the requested chunk is the same as the last one accessed.
         // This is extremely common during the render loop (reading 256 tiles in a row).
         if (this.lastChunkKey === chunkKey && this.lastChunkRef) {
             const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
             const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
             return this.lastChunkRef[localY][localX];
         }
         // --- OPTIMIZATION END ---

         // 2. If not in cache, perform standard lookup or generation
         const chunk = this.loadedChunks[chunkKey] || this.generateChunk(chunkX, chunkY);

         // 3. Update the cache for next time
         this.lastChunkKey = chunkKey;
         this.lastChunkRef = chunk;

         const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
         const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;

         return chunk[localY][localX];
     }
 };

 let playerName = "Captain"; // Default name
 let playerPfp = "assets/pfp_01.png"; // Default profile picture

 const GAME_STATES = {
     TITLE_SCREEN: 'title_screen',
     GALACTIC_MAP: 'galactic_map',
     SYSTEM_MAP: 'system_map',
     PLANET_VIEW: 'planet_view',
     COMBAT: 'combat',
     GAME_OVER: 'game_over',
     LEVEL_UP: 'level_up'
 };

 // ==========================================
// --- CENTRALIZED GAME STATE MANAGER ---
// ==========================================

const GameState = {
    player: {
        x: 0,
        y: 0,
        fuel: 220,
        credits: 1000,
        hull: 100,
        shields: 50,
        xp: 0,
        level: 1,
        notoriety: 0,
        abilityCooldown: 0,
        isChargingAttack: false,
        isEvading: false,
        notorietyTitle: "Rookie Spacer",
        lastNotorietyDecayTime: 0,
        milestones: [] 
    },
    ship: {
        shipClass: "LIGHT_FREIGHTER",
        components: {
            weapon: "WEAPON_PULSE_LASER_MK1",
            shield: "SHIELD_BASIC_ARRAY_A",
            engine: "ENGINE_STD_DRIVE_MK1",
            scanner: "SCANNER_BASIC_SUITE",
            utility: "UTIL_NONE"
        },
        ammo: {},
        cargo: {},
        cargoLoad: 0,
        
        // 🔮 FUTURE EXPANSION: GROUND FORCES (v1.1)
        // Used for Planetary Raids, Base Defense, and Boarding Actions.
        // LLM NOTE: When implementing, consider adding a "Barracks" utility module to increase maxTroops.
        forces: {
            marines: 0,         // Basic infantry. Consumed on death.
            heavyMechs: 0,      // High damage, acts as a multiplier.
            dropDropships: 0,   // Required to deploy > 10 marines per raid.
            maxTroops: 10       // Baseline capacity without upgrades.
        }
    },
    world: {
        seed: 0,
        date: 2458.0,
        sectorX: 0,
        sectorY: 0,
        sectorName: "Sol Sector",
        factionOffsets: { ECLIPSE: -22, KTHARR: 22 }
    },
    ui: {
        currentState: 'title_screen', // Replaces currentGameState
        tradeContext: null,
        combatContext: null,
        outfitContext: null,
        missionContext: null,
        encounterContext: null,
        shipyardContext: null
    }
};

// --- THE STATE BRIDGE ---
// This safely maps your old global variables to the new GameState object.
// Legacy code (like combat.js) can still say `playerFuel -= 10`, but it will 
// secretly update `GameState.player.fuel` AND automatically refresh the UI!

function bindState(globalVarName, category, propName, autoRender = false) {
    Object.defineProperty(window, globalVarName, {
        get: () => GameState[category][propName],
        set: (val) => {
            GameState[category][propName] = val;
            // Automatically update the HUD if this is a visual stat!
            if (autoRender && typeof GameBus !== 'undefined') {
                GameBus.emit('UI_REFRESH_REQUESTED');
            }
        }
    });
}

// 1. Vitals & Wealth (Auto-Renders UI when changed!)
bindState('playerFuel', 'player', 'fuel', true);
bindState('playerCredits', 'player', 'credits', true);
bindState('playerHull', 'player', 'hull', true);
bindState('playerShields', 'player', 'shields', true);
bindState('playerXP', 'player', 'xp', true);
bindState('playerLevel', 'player', 'level', true);
bindState('playerNotoriety', 'player', 'notoriety', true);
bindState('currentCargoLoad', 'ship', 'cargoLoad', true);

// 2. Position & World
bindState('playerX', 'player', 'x');
bindState('playerY', 'player', 'y');
bindState('currentSectorX', 'world', 'sectorX');
bindState('currentSectorY', 'world', 'sectorY');
bindState('currentSectorName', 'world', 'sectorName');
bindState('currentGameDate', 'world', 'date');
bindState('WORLD_SEED', 'world', 'seed');

bindState('factionOffsets', 'world', 'factionOffsets');

// 3. Combat States
bindState('playerAbilityCooldown', 'player', 'abilityCooldown');
bindState('playerIsChargingAttack', 'player', 'isChargingAttack');
bindState('playerIsEvading', 'player', 'isEvading');

// 4. UI Contexts
bindState('currentGameState', 'ui', 'currentState');
bindState('currentTradeContext', 'ui', 'tradeContext');
bindState('currentCombatContext', 'ui', 'combatContext');
bindState('currentOutfitContext', 'ui', 'outfitContext');
bindState('currentMissionContext', 'ui', 'missionContext');
bindState('currentEncounterContext', 'ui', 'encounterContext');
bindState('currentShipyardContext', 'ui', 'shipyardContext');

// 5. Complex Objects (References)
Object.defineProperty(window, 'playerShip', {
    get: () => GameState.ship,
    set: (val) => { GameState.ship = val; }
});
Object.defineProperty(window, 'playerCargo', {
    get: () => GameState.ship.cargo,
    set: (val) => { GameState.ship.cargo = val; }
});

let xpToNextLevel; // Calculated dynamically, so we leave it loose for now

let worldStateDeltas = {};

function performGarbageCollection() {
    const keys = Object.keys(worldStateDeltas);
    let cleanedCount = 0;
    
    // We don't need to keep thousands of star systems in RAM. 
    // The seeded generator will flawlessly recreate them if you revisit!
    const sysCount = Object.keys(systemCache).length;
    if (sysCount > 25) {
        systemCache = {};
        // Optional: console.log(`Memory Manager: Cleared ${sysCount} solar systems from RAM.`);
    }
    
    // --- Thresholds for Memory Management ---
    const MAX_DELTAS = 1000;
    const isBloated = keys.length > MAX_DELTAS;

    keys.forEach(key => {
        // SAFETY CHECK 1: Never delete critical global system data!
        if (key === 'CRAFTING_BONUSES') return;
        
        const delta = worldStateDeltas[key];

        // Never delete critical story flags, player-built colonies, or mapped wormhole networks.
        if (delta.activated || delta.studied || delta.isUnique || delta.hasColony || delta.isDiscoveredWormhole) {
            return; 
        }

        // 1. Standard Time Check
        // If it's been a long time since the player touched this tile, it's safe to let resources respawn.
        const isOld = delta.lastInteraction && (currentGameDate - delta.lastInteraction > RESOURCE_RESPAWN_TIME);

        // 2. Distance Check (Only run if memory is getting bloated)
        let isDistant = false;
        if (isBloated) {
            // Keys are formatted as "X,Y" or "X,Y_p1" (for planets). Split by '_' then ','
            const coords = key.split('_')[0].split(',');
            if (coords.length === 2) {
                const dX = parseInt(coords[0], 10);
                const dY = parseInt(coords[1], 10);
                
                if (!isNaN(dX) && !isNaN(dY)) {
                    // Calculate distance. If it's > 300 tiles away, we can safely forget it.
                    const dist = Math.sqrt(Math.pow(playerX - dX, 2) + Math.pow(playerY - dY, 2));
                    if (dist > 300) isDistant = true;
                }
            }
        }

        // 3. Execute Cleanup
        // If the tile is old, or we are bloated and it's far away, wipe it.
        if (isOld || isDistant) {
            delete worldStateDeltas[key];
            cleanedCount++;
        }
    });

    if (cleanedCount > 0) {
        console.log(`Universe Cleanup: ${cleanedCount} sectors regenerated.`);
    }
}

/**
 * Helper to update both the current loaded tile AND the saveable delta.
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {object} changes - Object containing flags to set (e.g. { minedThisVisit: true })
 */

function updateWorldState(x, y, changes) {
    // 1. Update the in-memory tile so the UI reacts immediately
    const tile = chunkManager.getTile(x, y);
    if (tile) {
        Object.assign(tile, changes);
    }

    // 2. Save to the persistent delta object
    const key = `${x},${y}`;
    if (!worldStateDeltas[key]) {
        worldStateDeltas[key] = {};
    }
    Object.assign(worldStateDeltas[key], changes);
}

 const SECTOR_SIZE = 480; // Let's say a sector is a 160x160 tile area.

 const TILE_SIZE = 32;

 let gameCanvas, ctx; // For our new canvas

 const MAX_LOG_MESSAGES = 50; // The maximum number of messages to keep in the log
 let messageLog = []; // This array will hold our message history

 let currentTradeItemIndex = -1;
 let currentTradeQty = 1;

 let playerActiveMission = null;
 let missionsAvailableAtStation = [];
 let MISSIONS_DATABASE = {};

 let scannedObjectTypes;
 let discoveredLocations;
 let playerCompletedMissions;


 let currentQuantityInput = "";

 let discoveredLoreEntries;

 // Mystery State

 let mystery_wayfinder_progress;
 let mystery_wayfinder_finalLocation;
 let mystery_first_nexus_location;
 let mystery_nexus_activated = false;

 const MYSTERY_WAYFINDER_TARGET_SECTOR_VOLATILITY = 5;
 const MYSTERY_WAYFINDER_ANOMALY_HINT_TYPE = 'unstable warp pocket';
 const MYSTERY_WAYFINDER_DERELICT_HINT_TYPE = 'Concord patrol craft';
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_X_MIN = -5;
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_X_MAX = -1;
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_Y_MIN = 1;
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_Y_MAX = 5;

 // --- Mission Data ---

 const MISSION_TEMPLATES = [{
         id_prefix: "BOUNTY_PIRATE_",
         type: "BOUNTY",
         weight: 4, // <-- ADD THIS
         title_template: "Pirate Cull in {sectorName}",
         briefing_template: "Concord Security is offering a bounty for pirate vessels in the {sectorName} sector.",
         description_template: "Increased pirate activity in the {sectorName} ({sectorCoords}) sector is disrupting trade. Eliminate {count} pirate threats to secure the area and claim your reward.",
         objective_templates: [{
             type: "ELIMINATE",
             targetName: "Pirate",
             count: [2, 4],
             targetSectorKey: "CURRENT"
         }],
         rewards_template: {
             credits: [250, 500],
             xp: [40, 75],
             notoriety: [3, 6]
         },
         prerequisites: {
             minLevel: 1
         }
     },
     {
         id_prefix: "DELIVERY_",
         type: "DELIVERY",
         weight: 4, // <-- ADD THIS
         title_template: "Urgent Delivery to {destinationName}",
         briefing_template: "{destinationName} requires an immediate shipment of {itemName}.",
         description_template: "A priority one request from {destinationName}. They need {count} units of {itemName} for critical operations. Deliver the goods and return here for payment.",
         objective_templates: [{
             type: "DELIVER",
             itemID: "ANY_LEGAL",
             count: [5, 15],
             destinationType: ["PLANET", "OUTPOST"]
         }],
         rewards_template: {
             credits: [150, 400],
             xp: [30, 60],
             notoriety: [1, 3]
         },
         prerequisites: {
             minLevel: 1
         }
     },
     {
         id_prefix: "SURVEY_ANOMALY_",
         type: "SURVEY",
         weight: 2, // <-- ADD THIS
         title_template: "Investigate {subtype} Anomaly",
         briefing_template: "Concord Science Division requires scan data on a nearby anomaly.",
         description_template: "We've detected a faint {subtype} signature. We need a ship on-site to perform a detailed scan. The anomaly could be anywhere, so keep your sensors active. Return here with the data.",
         objective_templates: [{
             type: "SCAN_OBJECT",
             targetType: "anomaly",
             subtype: "ANY_ANOMALY",
             sectorKey: "ANY"
         }],
         rewards_template: {
             credits: [200, 350],
             xp: [50, 80],
             notoriety: [1, 2]
         },
         prerequisites: {
             minLevel: 2
         }
     },
     {
         id_prefix: "ACQUIRE_RESOURCES_",
         type: "ACQUIRE", // New type
         weight: 1, // <-- ADD THIS
         title_template: "Resource Acquisition: {itemName}",
         briefing_template: "We need a contractor to acquire a shipment of {itemName}.",
         description_template: "Our operations require {count} units of {itemName}. We don't care where you get it - mine it, trade for it, or 'find' it. Just bring the specified amount back here for a generous reward.",
         objective_templates: [{
             type: "ACQUIRE",
             itemID: "ANY_RARE",
             count: [3, 8]
         }],
         rewards_template: {
             credits: [500, 1200],
             xp: [70, 150],
             notoriety: [2, 4]
         },
         prerequisites: {
             minLevel: 3
         }
     }
 ];

 // --- DOM Elements ---

 let menuLevelElement;
let menuXPElement;
let menuShipElement;
let menuRepElement;

let fuelBarElement;
let shieldBarElement;
let hullBarElement;

let fuelValElement;
let shieldValElement;
let hullValElement;

let hudLevelStatElement;
let hudXpStatElement;
let statusOverlayElement;

 let gameMapElement;
 let messageAreaElement;
 let fuelStatElement;
 let creditsStatElement;
 let cargoStatElement;
 let shieldsStatElement;
 let hullStatElement;
 let sectorNameStatElement;
 let sectorCoordsStatElement;
 let levelXpStatElement;
 let shipClassStatElement;
 let notorietyStatElement;
 let codexOverlayElement;
 let codexCategoriesElement;
 let codexEntriesElement;
 let codexEntryTextElement;

 let saveButtonElement;
 let loadButtonElement;

 let stardateStatElement;

 function getTileChar(tile) {
     if (typeof tile === 'object' && tile !== null && tile.char) return tile.char;
     return tile;
 }

 function getTileType(tile) {
     if (typeof tile === 'object' && tile !== null && tile.type) return tile.type;
     return null;
 }

 /**
  * Initiates the state change to land on a selected planet.
  * @param {number} index - The index of the planet to land on.
  */

 function landOnPlanet(index) {
     if (currentGameState !== GAME_STATES.SYSTEM_MAP) return;

     selectedPlanetIndex = index;
     const planet = currentSystemData.planets[selectedPlanetIndex];

     if (planet.scannedThisVisit) {
        logMessage("Biological density too low for further sampling.");
        return;
    }

     if (!planet.biome.landable) {
         logMessage(`Cannot land on ${planet.biome.name}. Environment too hostile.`);
         return;
     }

     logMessage(`Initiating landing sequence for ${planet.biome.name}...`);
     changeGameState(GAME_STATES.PLANET_VIEW);
 }

 function returnToOrbit() {
     logMessage("Leaving planetary surface. Returning to orbit.");
     changeGameState(GAME_STATES.SYSTEM_MAP);
 }

 function calculateXpToNextLevel(level) {
     // Ensure XP requirement is at least 1 to prevent infinite loops
     const xp = Math.floor(BASE_XP_TO_LEVEL * Math.pow(level, XP_LEVEL_EXPONENT));
     return Math.max(1, xp);
 }

 /**
  * A helper function to render just the shared UI stats.
  */

 function renderUIStats() {
    // 0. Update the System Menu Stats
    if (menuLevelElement) menuLevelElement.textContent = playerLevel;
    if (menuXPElement) menuXPElement.textContent = Math.floor(playerXP) + " / " + xpToNextLevel;
    
    // --- SYNERGY UI DISPLAY ---
    let shipText = SHIP_CLASSES[playerShip.shipClass].name;
    if (activeSynergy) {
        shipText += `<br><span style="color:var(--gold-text); font-size:10px; letter-spacing:1px;">★ SET: ${activeSynergy.name.toUpperCase()} ★</span>`;
    }
    if (menuShipElement) menuShipElement.innerHTML = shipText;
    
    // --- Display Faction Standing ---
    const concordRep = playerFactionStanding["CONCORD"] || 0;
    const ktharrRep = playerFactionStanding["KTHARR"] || 0;
    
    if (menuRepElement) {
        menuRepElement.textContent = `Concord: ${concordRep} | K'tharr: ${ktharrRep}`;
        menuRepElement.style.fontSize = "10px";
    }

    // 1. Calculate Percentages for Bars (Clamped to 100% to prevent CSS overflow!)
    const fuelPct = Math.min(100, Math.max(0, (playerFuel / MAX_FUEL) * 100));
    const shieldPct = Math.min(100, Math.max(0, (playerShields / MAX_SHIELDS) * 100));
    const hullPct = Math.min(100, Math.max(0, (playerHull / MAX_PLAYER_HULL) * 100));

    // 2. Update Bar Widths
    if (fuelBarElement) fuelBarElement.style.width = `${fuelPct}%`;
    if (shieldBarElement) shieldBarElement.style.width = `${shieldPct}%`;
    if (hullBarElement) hullBarElement.style.width = `${hullPct}%`;

    // 3. Update Text Values
    if (fuelValElement) fuelValElement.textContent = Math.floor(playerFuel);
    if (shieldValElement) shieldValElement.textContent = `${Math.floor(playerShields)}`;
    if (hullValElement) hullValElement.textContent = `${Math.floor(playerHull)}`;

    // 4. Update HUD Text Stats
    if (creditsStatElement) creditsStatElement.textContent = formatNumber(playerCredits);
    if (cargoStatElement) cargoStatElement.textContent = `${currentCargoLoad}/${PLAYER_CARGO_CAPACITY}`;

    if (hudLevelStatElement) hudLevelStatElement.textContent = playerLevel;
    if (hudXpStatElement) hudXpStatElement.textContent = `${formatNumber(Math.floor(playerXP))} / ${formatNumber(xpToNextLevel)}`;
     
    // 5. Update Header Info (DYNAMIC FACTION & THREAT)
    const exactFaction = getFactionAt(playerX, playerY);
    let factionName = "Independent";
    const isLightMode = document.body.classList.contains('light-mode');
    let fColor = isLightMode ? "#888899" : "#FFFFFF";

    // --- MINI-MAP DISTANCE VISUALIZER ---
    // Creates a text-based "radar line" showing how far from Sector 0,0 the player is!
    const distToCore = Math.floor(Math.sqrt((currentSectorX * currentSectorX) + (currentSectorY * currentSectorY)));
    
    // Scale the distance so 50 sectors out fills the bar
    let mapString = "[";
    const maxDots = 15;
    const playerPos = Math.min(maxDots - 1, Math.floor((distToCore / 50) * maxDots));
    
    for (let i = 0; i < maxDots; i++) {
        if (i === playerPos) mapString += `<span style='color:${fColor}; font-weight:bold;'>@</span>`; // You (Draw this first!)
        else if (i === 0) mapString += "<span style='color:#00AAFF'>O</span>"; // Sol (Core)
        else mapString += "<span style='color:#444'>-</span>"; // Empty space
    }
    mapString += "]";
     
    if (exactFaction === "KTHARR") { factionName = "Hegemony"; fColor = "#00FF44"; }
    else if (exactFaction === "CONCORD") { factionName = "Concord"; fColor = "#00AAFF"; }
    else if (exactFaction === "ECLIPSE") { factionName = "Cartel"; fColor = "#FF4444"; }

    const dist = Math.sqrt((playerX * playerX) + (playerY * playerY));
    let threat = "SAFE";
    let threatColor = "#00FF00"; 
     
    if (dist > 2000) { threat = "DEADLY"; threatColor = "#FF0000"; } 
    else if (dist > 1200) { threat = "HIGH"; threatColor = "#FF5555"; } 
// --- NEW: TACTICAL RADAR OVERRIDE ---
    // If an enemy is actively hunting you (within 2 tiles), override the zone threat!
    if (typeof activeEnemies !== 'undefined' && activeEnemies.length > 0) {
        const nearEnemy = activeEnemies.find(e => Math.abs(e.x - playerX) <= 2 && Math.abs(e.y - playerY) <= 2 && !e.isProbe);
        if (nearEnemy) {
            threat = "HOSTILE DETECTED";
            threatColor = "var(--danger)";
        }
    }
    // Also override if the player has active Concord heat!
    if (playerNotoriety > 0) {
        threat = `WANTED (${playerNotoriety})`;
        threatColor = "var(--warning)";
    }

    if (sectorNameStatElement) {
        sectorNameStatElement.innerHTML = `${currentSectorName} <span style="color:${fColor}; opacity:0.9;">[${factionName}]</span> <span style="font-family: monospace; letter-spacing: 2px; margin-left: 10px;">${mapString}</span> <span style="color:${threatColor}; font-size: 0.8em; margin-left: 8px;">[${threat}]</span>`;
        sectorNameStatElement.style.color = "#00E0E0"; 
    }
     
    if (sectorCoordsStatElement) sectorCoordsStatElement.textContent = `[${playerX}, ${-playerY}]`;

    // 6. Log Handling
    if (messageAreaElement) {
        messageAreaElement.innerHTML = messageLog.join('<br>');
    }

    // --- 7. Visual Warning System ---
    if (statusOverlayElement) {
        statusOverlayElement.className = 'status-overlay'; 
        
        if (playerHull < (MAX_PLAYER_HULL * 0.25)) {
            statusOverlayElement.classList.add('critical-hull');
            statusOverlayElement.style.opacity = '1';
        } else if (playerFuel < (MAX_FUEL * 0.20)) {
            statusOverlayElement.classList.add('critical-fuel');
            statusOverlayElement.style.opacity = '1';
        } else {
            statusOverlayElement.style.opacity = '0';
        }
    }
}

 
 /**
  * Handles switching between different game views.
  * @param {string} newState - The state to switch to, from GAME_STATES.
  */

function changeGameState(newState) {
     // 1. Hide all main view containers
     document.getElementById('gameCanvas').style.display = 'none';
     document.getElementById('systemView').style.display = 'none';
     document.getElementById('planetView').style.display = 'none';
     document.getElementById('combatView').style.display = 'none';

     // 2. Show the correct container for the new state
     if (newState === GAME_STATES.GALACTIC_MAP) {
         document.getElementById('gameCanvas').style.display = 'block';
     } else if (newState === GAME_STATES.SYSTEM_MAP) {
         document.getElementById('systemView').style.display = 'block';
     } else if (newState === GAME_STATES.PLANET_VIEW) {
         document.getElementById('planetView').style.display = 'block';
     } else if (newState === GAME_STATES.COMBAT) {
         document.getElementById('combatView').style.display = 'flex';
     }

     currentGameState = newState;
     
     // 3. NEW: Update Border Visibility
     if (typeof updateSideBorderVisibility === "function") {
        updateSideBorderVisibility();
     }

     render();
 }
 
function updatePlayerNotoriety(amount) {
     // Safe math: Never let Notoriety drop below zero
     playerNotoriety = Math.max(0, playerNotoriety + amount);
     updateNotorietyTitle();

     GameBus.emit('UI_REFRESH_REQUESTED');
 }

 function updateNotorietyTitle() {
     let currentTitle = "Unknown"; // A default fallback
     // Loop backwards from the highest possible score to the lowest
     for (let i = NOTORIETY_TITLES.length - 1; i >= 0; i--) {
         // If the player's score is greater than or equal to the score for this title...
         if (playerNotoriety >= NOTORIETY_TITLES[i].score) {
             // ...we've found the correct title.
             currentTitle = NOTORIETY_TITLES[i].title;
             break; // Exit the loop immediately
         }
     }
     playerNotorietyTitle = currentTitle;
 }

// ==========================================
// --- CODEX COMPLETIONIST SYSTEM ---
// ==========================================

function unlockLoreEntry(key, isSilent = false) {
    if (typeof LORE_DATABASE === 'undefined' || !LORE_DATABASE[key]) return;
    
    if (!LORE_DATABASE[key].unlocked) {
        LORE_DATABASE[key].unlocked = true;
        const category = LORE_DATABASE[key].category;
        
        // --- BUG FIX: ADD TO THE SAVE FILE SET ---
        if (typeof discoveredLoreEntries !== 'undefined') {
            discoveredLoreEntries.add(key);
        }
        
        // Only push to the UI and play sounds if this was earned during active gameplay!
        if (!isSilent) {
            logMessage(`<span style="color:#00E0E0">[ CODEX ] New archive entry decrypted: ${LORE_DATABASE[key].title}</span>`);
            if (typeof showToast === 'function') showToast(`CODEX UPDATED: ${LORE_DATABASE[key].title}`, "info");
            if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        }
        
        checkCodexCompletion(category, isSilent);
        
        // Re-apply stats to immediately grant any newly unlocked buffs to the HUD
        if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
        if (typeof renderUIStats === 'function') renderUIStats();
    }
}

function checkCodexCompletion(categoryToCheck, isSilent = false) {
    let total = 0;
    let unlocked = 0;
    
    for (const key in LORE_DATABASE) {
        if (LORE_DATABASE[key].category === categoryToCheck) {
            total++;
            if (LORE_DATABASE[key].unlocked) unlocked++;
        }
    }

    // If they just unlocked the final entry for this category
    if (total > 0 && unlocked === total) {
        let masteryStorage = {};
        try {
            masteryStorage = JSON.parse(localStorage.getItem('wayfinder_codex_mastery')) || {};
        } catch(e) {}

        if (masteryStorage[categoryToCheck]) return; 

        masteryStorage[categoryToCheck] = true;
        localStorage.setItem('wayfinder_codex_mastery', JSON.stringify(masteryStorage));

        // --- THE SILENT FIX ---
        // Only hijack the screen with the massive modal if they earned it in-game!
        if (!isSilent) {
            openGenericModal("CODEX MASTERY ACHIEVED");
            
            let buffText = "Systems optimized.";
            if (categoryToCheck === "Starships") buffText = "+5 Max Hull Integrity";
            else if (categoryToCheck === "Phenomena") buffText = "+10 Max Fuel Capacity";
            else if (categoryToCheck === "Locations") buffText = "+2% Ship Evasion";
            else if (categoryToCheck === "Factions") buffText = "+5 Max Shields";
            else buffText = "+2 Cargo Capacity"; 

            const detailEl = document.getElementById('genericDetailContent');
            const listEl = document.getElementById('genericModalList');
            const actionsEl = document.getElementById('genericModalActions');
            
            if (listEl) listEl.innerHTML = ''; 
            if (detailEl) detailEl.innerHTML = `
                <div style="text-align:center; padding: 40px 20px;">
                    <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px var(--gold-text));">🏆</div>
                    <h3 style="color:var(--gold-text); margin-bottom:10px; letter-spacing:2px;">KNOWLEDGE IS POWER</h3>
                    <p style="color:var(--text-color); font-size:13px; line-height:1.6; margin-bottom: 20px;">
                        You have successfully uncovered all archived data within the <strong>${categoryToCheck}</strong> category. 
                        Your ship's computer has integrated this complete dataset, optimizing operational parameters.
                    </p>
                    <div style="background:rgba(255,215,0,0.1); border:1px solid var(--gold-text); padding:15px; border-radius:4px; font-weight:bold; color:var(--success);">
                        PASSIVE BUFF ACQUIRED: ${buffText}
                    </div>
                </div>
            `;
            if (actionsEl) actionsEl.innerHTML = `<button class="action-button full-width-btn" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="closeGenericModal()">ACKNOWLEDGE</button>`;
            
            if (typeof soundManager !== 'undefined') soundManager.playGain();
        }
    }
}

// --- NON-DESTRUCTIVE OUTFITTING PATCH ---
// We dynamically wrap your existing outfitting math so we don't have to rewrite outfitting.js!
if (typeof window._codexPatched === 'undefined') {
    const originalApply = window.applyPlayerShipStats;
    if (originalApply) {
        window.applyPlayerShipStats = function() {
            // 1. Run the original math first (which resets max stats based on ship chassis and components)
            originalApply();
            
            // 2. Tally up which codex categories are 100% complete
            const categories = {};
            for (const key in LORE_DATABASE) {
                const cat = LORE_DATABASE[key].category;
                if (!categories[cat]) categories[cat] = { total: 0, unlocked: 0 };
                categories[cat].total++;
                if (LORE_DATABASE[key].unlocked) categories[cat].unlocked++;
            }
            
            // 3. Layer the small permanent buffs on top!
            for (const cat in categories) {
                if (categories[cat].total > 0 && categories[cat].unlocked === categories[cat].total) {
                    if (cat === "Starships") MAX_PLAYER_HULL += 5;
                    else if (cat === "Phenomena") MAX_FUEL += 10;
                    else if (cat === "Locations") PLAYER_EVASION += 2; 
                    else if (cat === "Factions") MAX_SHIELDS += 5;
                    else PLAYER_CARGO_CAPACITY += 2; 
                }
            }
        };
    }
    window._codexPatched = true;
}

 let systemCache = {};
 let currentSystemData;

 let selectedPlanetIndex = -1;

  /**
  * Procedurally generates a unique and persistent star system based on its coordinates.
  * @param {number} starX - The world X coordinate of the star.
  * @param {number} starY - The world Y coordinate of the star.
  * @returns {object} The generated star system data.
  */

 function generateStarSystem(starX, starY) {
     const systemKey = `${starX},${starY}`;
     if (systemCache[systemKey]) {
         return systemCache[systemKey]; // Return from cache if we've already been here
     }

     const systemSeed = WORLD_SEED ^ (starX * 19349663) ^ (starY * 73856093);
     const biomeKeys = Object.keys(PLANET_BIOMES);

     const numPlanets = 2 + Math.floor(seededRandom(systemSeed) * 6); // 2 to 7 planets
     const planets = [];

     for (let i = 0; i < numPlanets; i++) {
         const planetSeed = systemSeed + i * 101; // Unique seed for each planet
         const biomeKey = biomeKeys[Math.floor(seededRandom(planetSeed) * biomeKeys.length)];

        // --- PERSISTENCE CHECK ---
         const sysKey = `${starX},${starY}_p${i}`;
         const savedState = worldStateDeltas[sysKey] || {};

            planets.push({
             name: `Planet ${i + 1}`, 
             biome: PLANET_BIOMES[biomeKey],
             id: `${systemKey}-${i}`,
             // Apply saved flags
             minedThisVisit: savedState.mined || false,
             scannedThisVisit: savedState.scanned || false
         });
     }

     const systemData = {
         name: `${currentSectorName} System`,
         x: starX,
         y: starY,
         planets: planets
     };

     systemCache[systemKey] = systemData; // Save to cache
     return systemData;
 }

 function initializeGame() {
    menuLevelElement = document.getElementById('menuLevel');
    menuXPElement = document.getElementById('menuXP');
    menuShipElement = document.getElementById('menuShip');
    menuRepElement = document.getElementById('menuRep');

    fuelBarElement = document.getElementById('fuelBar');
    shieldBarElement = document.getElementById('shieldBar');
    hullBarElement = document.getElementById('hullBar');

    fuelValElement = document.getElementById('fuelVal');
    shieldValElement = document.getElementById('shieldVal');
    hullValElement = document.getElementById('hullVal');

    hudLevelStatElement = document.getElementById('hudLevelStat');
    hudXpStatElement = document.getElementById('hudXpStat');
    statusOverlayElement = document.getElementById('statusOverlay');

    // 1. Reset Game Logic Systems & Collections
    chunkManager.initializeStaticLocations();
    
    // Clear Sets and Arrays
    visitedSectors = new Set();
    scannedObjectTypes = new Set();
    discoveredLocations = new Set();
    playerCompletedMissions = new Set();
    discoveredLoreEntries = new Set();
    missionsAvailableAtStation = [];

    setRandomPlayerPortrait();

    playerPerks = new Set();

    playerCrew = [];
    
    // Clear Caches
    systemCache = {}; 
    playerCargo = {};
    Object.keys(COMMODITIES).forEach(id => playerCargo[id] = 0);

    // --- CRITICAL: Reset World State Deltas & Chunk Cache ---
    worldStateDeltas = {}; 
    chunkManager.loadedChunks = {}; 
    chunkManager.lastChunkKey = null;
    chunkManager.lastChunkRef = null;

    // 2. Refresh DOM Elements References
    // (We re-fetch these to ensure references are fresh if the DOM was manipulated)
    messageAreaElement = document.getElementById('messageArea');
    fuelStatElement = document.getElementById('fuelStat');
    creditsStatElement = document.getElementById('creditsStat');
    cargoStatElement = document.getElementById('cargoStat');
    shieldsStatElement = document.getElementById('shieldsStat');
    hullStatElement = document.getElementById('hullStat');
    sectorNameStatElement = document.getElementById('sectorNameStat');
    sectorCoordsStatElement = document.getElementById('sectorCoordsStat');
    levelXpStatElement = document.getElementById('levelXpStat');
    shipClassStatElement = document.getElementById('shipClassStat');
    notorietyStatElement = document.getElementById('notorietyStat');
    codexOverlayElement = document.getElementById('codexOverlay');
    codexCategoriesElement = document.getElementById('codexCategories');
    codexEntriesElement = document.getElementById('codexEntries');
    codexEntryTextElement = document.getElementById('codexEntryText');
    stardateStatElement = document.getElementById('stardateStat');
    saveButtonElement = document.getElementById('saveButton');

    // 3. Player State Reset via GameState
    playerX = Math.floor(MAP_WIDTH / 2);
    playerY = Math.floor(MAP_HEIGHT / 2);

    currentSectorX = Math.floor(playerX / SECTOR_SIZE);
    currentSectorY = Math.floor(playerY / SECTOR_SIZE);
    currentSectorName = generateSectorName(currentSectorX, currentSectorY);

    // Reset Ship
    playerShip = {
        shipClass: "LIGHT_FREIGHTER",
        components: {
            weapon: "WEAPON_PULSE_LASER_MK1",
            shield: "SHIELD_BASIC_ARRAY_A",
            engine: "ENGINE_STD_DRIVE_MK1",
            scanner: "SCANNER_BASIC_SUITE",
            utility: "UTIL_NONE"
        },
        ammo: {},
        cargo: {},
        cargoLoad: 0,
        // 🚨 Re-injected the forces object so it doesn't get deleted on New Game!
        forces: {
            marines: 0,         
            heavyMechs: 0,      
            dropDropships: 0,   
            maxTroops: 10       
        }
    };

    // Initialize Ammo if applicable
    const startingWeapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    if (startingWeapon.stats.maxAmmo) {
        playerShip.ammo[playerShip.components.weapon] = startingWeapon.stats.maxAmmo;
    }

    applyPlayerShipStats(); // Calculates MAX values based on components
    
    // Using the bridged variables automatically updates GameState and fires the UI event!
    playerFuel = MAX_FUEL;
    playerCredits = INITIAL_CREDITS;
    playerHull = MAX_PLAYER_HULL;
    playerShields = MAX_SHIELDS;
    playerNotoriety = 0;
    playerLevel = 1;
    playerXP = 0;
    currentGameDate = 2458.0;

    xpToNextLevel = calculateXpToNextLevel(playerLevel);

    // 4. Unlock Default Lore (Silently)
    unlockLoreEntry("FACTION_CONCORD", true);
    unlockLoreEntry("XENO_PRECURSORS", true);
    unlockLoreEntry("MYSTERY_WAYFINDER_QUEST", true);
    unlockLoreEntry("REGION_SOL_SECTOR", true);

    Object.keys(COMPONENTS_DATABASE).forEach(key => {
        if (COMPONENTS_DATABASE[key].loreKey) unlockLoreEntry(COMPONENTS_DATABASE[key].loreKey, true);
    });
    Object.keys(SHIP_CLASSES).forEach(key => {
        if (SHIP_CLASSES[key].loreKey) unlockLoreEntry(SHIP_CLASSES[key].loreKey, true);
    });

    // 5. Reset Mystery / Quest State
    mystery_wayfinder_progress = 0;
    mystery_wayfinder_finalLocation = null;
    mystery_first_nexus_location = null;
    mystery_nexus_activated = false;
    xerxesPuzzleLevel = 0;

    updateCurrentCargoLoad();

    // 6. Clear all blocking UI contexts
    currentTradeContext = null;
    currentCombatContext = null;
    currentOutfitContext = null;
    currentEncounterContext = null;
    currentShipyardContext = null;

    // 7. Set State
    currentGameState = GAME_STATES.TITLE_SCREEN;
}

/**
  * A simple seeded random number generator.
  * Ensures that the same input 'seed' always produces the same output number.
  * @param {number} seed - The seed for the generator.
  * @returns {number} A pseudo-random number between 0 and 1.
  */
 function seededRandom(seed) {
     // A simple algorithm to create a predictable pseudo-random number.
     let x = Math.sin(seed) * 10000;
     return x - Math.floor(x);
 }

 /**
  * Generates a procedural and deterministic name for a sector based on its coordinates.
  * Now includes Faction Territory suffixes.
  */

 function generateSectorName(sectorX, sectorY) {
     if (sectorX === 0 && sectorY === 0) {
         return "Sol Sector"; // Cleaned up so it doesn't double-print Concord
     }

     // Create a unique seed for this specific sector coordinate pair.
     const seed = WORLD_SEED + (sectorX * 10000) + sectorY;
     const distance = Math.sqrt(sectorX * sectorX + sectorY * sectorY);

     let prefixPool, rootPool;

     if (distance < 10) { 
         prefixPool = SECTOR_NAME_PARTS.TIER1_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER1_ROOT;
     } else if (distance < 30) { 
         prefixPool = SECTOR_NAME_PARTS.TIER2_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER2_ROOT;
     } else { 
         prefixPool = SECTOR_NAME_PARTS.TIER3_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER3_ROOT;
     }

     const prefix = prefixPool[Math.floor(seededRandom(seed) * prefixPool.length)];
     const root = rootPool[Math.floor(seededRandom(seed + 1) * rootPool.length)];
     
     return `${prefix} ${root}`;
 }

const SECTOR_NAME_PARTS = {
     // TIER 1: Core Worlds (0-10 distance) - Orderly, Mythological, Scientific
     TIER1_PREFIX: [
         "Nova", "Kepler", "Orion", "Cygnus", "Lyra", "Terra", "Sol", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega", "Centauri", "Proxima", "Sirius", "Vega", "Altair", "Regulus", "Spica", "Arcturus", "Capella", "Rigel", "Betelgeuse", "Aldebaran", "Pollux", "Castor", "Deneb", "Fomalhaut", "Antares", "Canopus",
         // NEW ADDS:
         "Helios", "Chronos", "Atlas", "Hyperion", "Prometheus", "Daedalus", "Icarus", "Ares", "Athena", "Hermes", "Apollo"
     ],
     TIER1_ROOT: [
         "Reach", "Spur", "Arm", "Belt", "Cluster", "Expanse", "Frontier", "Verge", "Fields", "Plains", "Depths", "Shallows", "Haven", "Port", "Gate", "Passage", "Crossing", "Junction", "Nexus", "Hub", "Core", "Heart", "Prime", "Minor", "Major", "Central", "Inner", "Outer", "Drift", "Currents", "Flow", "Stream", "Shoals", "Banks", "Flats", "Heights", "Ridge", "Valley", "Canyon", "Basin"
     ],

     // TIER 2: The Frontier (10-30 distance) - Wild, Dangerous, Descriptive
     TIER2_PREFIX: [
         "Serpentis", "Draco", "Hydra", "Lupus", "Corvus", "Volans", "Crux", "Carina", "Vela", "Pictor", "Indus", "Pavo", "Tucana", "Grus", "Phoenix", "Horologium", "Reticulum", "Dorado", "Mensa", "Chamaeleon", "Apus", "Musca", "Circinus", "Triangulum", "Norma", "Ara", "Telescopium", "Corona", "Fornax", "Sculptor", "Caelum", "Eridanus", "Cetus", "Aquarius", "Capricornus", "Sagittarius", "Scorpius", "Libra", "Virgo", "Leo", "Cancer", "Gemini", "Taurus", "Aries", "Pisces", "Ophiuchus", "Lyra Minor", "Ursa Major", "Ursa Minor", "Canis Major", "Canis Minor", "Perseus", "Andromeda", "Cassiopeia", "Cepheus", "Lacerta", "Pegasus", "Delphinus", "Equuleus", "Aquila", "Sagitta", "Vulpecula", "Cygnus Minor"
     ],
     TIER2_ROOT: [
         "Void", "Abyss", "Chasm", "Gulf", "Maelstrom", "Nebula", "Wastes", "Badlands", "Peril", "Hazard", "Brink", "Edge", "Terminus", "Limit", "Maw", "Jaws", "Teeth", "Claws", "Fangs", "Spines", "Thorns", "Barrens", "Wilds", "Expanse", "Deeps", "Shroud", "Veil", "Mist", "Gloom", "Shadow", "Dark", "Grim", "Bleak", "Despair", "Sorrow", "Fear", "Dread", "Terror", "Whispers", "Echoes", "Silence", "Stillness", "Emptiness",
         // NEW ADDS:
         "Marches", "Hollows", "Thicket", "Boneyard", "Graveyard", "Sanctuary", "Refuge", "Outlands", "Tangle", "Drifts", "Shatter"
     ],

     // TIER 3: Deep Space (>30 distance) - Alien, Ancient, Ominous
     TIER3_PREFIX: [
         "Xylos", "Zylos", "Varkos", "Kryll", "Ghor", "Thrax", "Zargon", "Vorlag", "Nyx", "Erebus", "Tartarus", "Styx", "Acheron", "Phlegethon", "Cocytus", "Lethe", "Hades", "Gehenna", "Sheol", "Abaddon", "Apollyon", "Azrael", "Thanatos", "Moros", "Ker", "Keres", "Yama", "Hel", "Niflheim", "Muspelheim", "Jotunheim", "Svartalfheim", "Yomi", "Kur", "Irkalla", "Duat", "Xibalba", "Mictlan", "Naraka", "Patala", "Annwn", "Tuonela", "Adlivun", "Ukhu Pacha", "Chinvat", "Hamistagan", "Pescha", "Arqa", "Diyu",
         // NEW ADDS:
         "Xoth", "Yog", "K'n-Yan", "Leng", "Kadath", "R'lyeh", "Sarnath", "Ib", "Zul", "Azath", "Dagon"
     ],
     TIER3_ROOT: [
         "Oblivion", "Annihilation", "Desolation", "Ruin", "Terror", "Horror", "Madness", "Silence", "Emptiness", "Nothingness", "End", "Omega", "Ultima", "Finality", "Doom", "Blight", "Scourge", "Plague", "Curse", "Hex", "Bane", "Wrath", "Fury", "Storm", "Tempest", "Vortex", "Singularity", "Anomaly", "Paradox", "Enigma", "Labyrinth", "Maze", "Prison", "Tomb", "Crypt", "Sepulcher", "Citadel", "Fortress", "Bastion", "Stronghold", "Domain", "Realm", "Kingdom", "Empire", "Cataclysm", "Apocalypse", "Judgement", "Nadir", "Zero"
     ]
 };

 function leaveSystem() {
    soundManager.playWarp();
    changeGameState(GAME_STATES.GALACTIC_MAP);
    selectedPlanetIndex = -1; // Deselect planets
    handleInteraction(); // Refresh the text log for the sector you are in
}

function renderSystemMap() {
    const systemView = document.getElementById('systemView');
    if (!currentSystemData) return;

    // --- 1. GENERATE FLAVOR DATA ---
    // Create a deterministic seed from coordinates for consistent flavor text
    const flavorSeed = Math.abs((currentSystemData.x * 73856093) ^ (currentSystemData.y * 19349663));
    
    const starTypes = [
        "G2V Yellow Dwarf (Stable)", "M-Type Red Dwarf (Volatile)", 
        "K-Type Orange Star", "F-Type White Star", 
        "Binary Star System", "Neutron Star Remnant", "Protostar Nebula"
    ];
    const starType = starTypes[flavorSeed % starTypes.length];

    const descriptions = [
        "Sensors indicate optimal orbital trajectories. No immediate hazards detected.",
        "System is rich in heavy metals. Asteroid density is higher than average.",
        "Stellar radiation levels are fluctuating. Caution advised during EVA.",
        "A quiet system on the fringes of the sector. Long-range comms are static-heavy.",
        "Traces of ancient ion trails detected. This system was once a trade lane.",
        "Gravitational anomalies detected near the outer planets."
    ];
    const flavorText = descriptions[flavorSeed % descriptions.length];

    // --- THEME CHECK FOR READABILITY ---
    const isLightMode = document.body.classList.contains('light-mode');
    const titleColor = isLightMode ? '#111122' : '#E0FFFF'; 
    const titleShadow = isLightMode ? 'none' : '0 0 15px rgba(0, 224, 224, 0.5)';

    // --- 2. BUILD HTML ---
    // We use the new .system-header-panel class to constrain width
    let html = `
        <div class="system-header-panel">
            <h1 class="sys-title-large" style="color: ${titleColor}; text-shadow: ${titleShadow};">${currentSystemData.name}</h1>
            <div class="sys-meta-row">
                <span>Class: ${starType}</span>
                <span>//</span>
                <span>Bodies: ${currentSystemData.planets.length}</span>
                <span>//</span>
                <span>Dominion: ${getFactionAt(currentSystemData.x * SECTOR_SIZE, currentSystemData.y * SECTOR_SIZE)}</span>
            </div>
            <div class="sys-flavor-text">"${flavorText}"</div>
        </div>
    `;
    
    // --- 3. THE PLANET GRID ---
    // (This uses the class we added in the previous step)
    html += '<div class="system-planet-grid">';

    currentSystemData.planets.forEach((planet, index) => {
        const borderStyle = (index === selectedPlanetIndex) ? '2px solid #00E0E0' : '1px solid #303060';
        const bgStyle = (index === selectedPlanetIndex) ? 'rgba(0, 224, 224, 0.1)' : 'rgba(0,0,0,0.5)';
       
        const landButtonHTML = planet.biome.landable ?
            `<button class="action-button" style="margin-top: 10px;" onclick="landOnPlanet(${index})">LAND</button>` :
            `<button class="action-button" disabled style="margin-top: 10px; border-color:#444; color:#666;">UNINHABITABLE</button>`;

        // Visually tag planets the player has already explored!
        let statusBadge = "";
        if (planet.scannedThisVisit || planet.minedThisVisit || planet.exploredThisVisit) {
            statusBadge = `<div style="position:absolute; top:-10px; right:-10px; background:var(--success); color:#000; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow: 0 0 10px var(--success);">SCANNED</div>`;
        }

        html += `
           <div onclick="selectPlanet(${index})" ondblclick="examinePlanet(${index})" 
                style="border: ${borderStyle}; background: ${bgStyle}; padding: 15px; border-radius: 8px; text-align: center; flex: 1; min-width: 140px; max-width: 220px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s;">

                 ${statusBadge}
               
               <div>
                   <div style="font-size: 14px; font-weight:bold; color: #8888AA; margin-bottom: 8px;">PLANET ${index + 1}</div>
                   <img src="${planet.biome.image}" alt="${planet.biome.name}" class="planet-icon-img">
                   <div style="font-weight: bold; color: #00E0E0; margin-top: 5px;">${planet.biome.name}</div>
               </div>
               ${landButtonHTML}
           </div>
       `;
    });
    html += '</div>';

    // --- 4. NAVIGATION FOOTER ---
    html += `
       <div style="margin-top: 40px; width: 100%; max-width: 400px; margin-left: auto; margin-right: auto;">
            <div style="text-align:center; margin-bottom:10px; font-size:12px; color:#666;">(Double-Click a planet to Scan)</div>
            
            <button class="action-button full-width-btn" onclick="leaveSystem()">
               &lt;&lt; ENGAGE HYPERDRIVE (LEAVE SYSTEM)
           </button>
       </div>
    `;

    systemView.innerHTML = html;
    renderUIStats();
}

 function render() {
     // 1. CRITICAL SAFETY CHECK
     // If the game hasn't started yet (Title Screen), do not attempt to render.
     // This prevents errors where the code tries to access player properties (like ship/fuel)
     // that haven't been initialized yet.
     if (currentGameState === GAME_STATES.TITLE_SCREEN) return;

     // 2. State Dispatcher
     // Route the render call to the specific function for the current view.
     switch (currentGameState) {
         case GAME_STATES.GALACTIC_MAP:
             renderGalacticMap(); // Draws the canvas, particles, and map UI
             break;
         case GAME_STATES.SYSTEM_MAP:
             renderSystemMap(); // Draws the DOM-based solar system view
             break;
         case GAME_STATES.PLANET_VIEW:
             renderPlanetView(); // Draws the surface operations view
             break;
         case GAME_STATES.COMBAT:
             renderCombatView(); // Draws the combat UI
             break;
     }
 }

 /* Handles selecting a planet via a mouse click.
  * @param {number} index - The index of the planet that was clicked.
  */
 function selectPlanet(index) {
     if (currentGameState !== GAME_STATES.SYSTEM_MAP) return;
     selectedPlanetIndex = index;
     render(); // Re-render to show the new highlight.
 }

 /**
  * Handles examining a planet via a double-click.
  * @param {number} index - The index of the planet that was double-clicked.
  */

 function examinePlanet(index) {
     if (index < 0 || !currentSystemData || !currentSystemData.planets[index]) {
         logMessage("No target selected.");
         return;
     }
     if (currentGameState !== GAME_STATES.SYSTEM_MAP) return;

     selectedPlanetIndex = index;
     const planet = currentSystemData.planets[index];
     
     // --- NEW: BEAUTIFUL MODAL SCAN ---
     if (typeof openGenericModal === 'function') {
         openGenericModal(`PLANETARY SCAN: ${planet.biome.name.toUpperCase()}`);
         
         const listEl = document.getElementById('genericModalList');
         const detailEl = document.getElementById('genericDetailContent');
         const actionsEl = document.getElementById('genericModalActions');

         listEl.innerHTML = ''; // Hide left pane for full-screen view
         
         const resourcesHtml = planet.biome.resources && planet.biome.resources.length > 0 
            ? planet.biome.resources.map(r => `<span style="color:var(--gold-text); background:rgba(255,215,0,0.1); border:1px solid var(--gold-text); padding:4px 8px; border-radius:4px; font-size:11px; margin-right:5px; display:inline-block; margin-bottom:5px;">${r}</span>`).join('') 
            : "<span style='color:#666;'>No valuable resources detected.</span>";

         detailEl.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <img src="${planet.biome.image}" style="width:140px; height:140px; object-fit:cover; border-radius:50%; border:2px solid var(--accent-color); margin-bottom:15px; box-shadow: 0 0 25px rgba(0,224,224,0.3);">
                <h3 style="color:var(--accent-color); margin-bottom:10px; letter-spacing: 2px;">${planet.biome.name}</h3>
                
                <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px; text-align:left; margin-bottom:20px;">
                    <p style="color:var(--text-color); font-size:13px; line-height:1.6; margin:0;">
                        ${planet.biome.description}
                    </p>
                </div>
                
                <div style="text-align:left; background:rgba(0,0,0,0.3); padding: 15px; border-left: 3px solid var(--accent-color);">
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:10px;">DETECTED SIGNATURES:</div>
                    ${resourcesHtml}
                </div>
            </div>
         `;
         
         actionsEl.innerHTML = `
            <button class="action-button full-width-btn" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="closeGenericModal(); if(typeof render === 'function') render();">CLOSE SCANNER</button>
         `;
     } else {
         // Fallback just in case
         let scanReport = `Scan of Planet ${index + 1} (${planet.biome.name}):\n`;
         scanReport += `${planet.biome.description}\n`;
         scanReport += `Potential Resources: ${planet.biome.resources.join(', ')}`;
         logMessage(scanReport);
     }
     
     if (typeof render === 'function') render();
 }

function renderGalacticMap() {
    // --- 1. Check Theme & Hardware Status ---
    const isLightMode = document.body.classList.contains('light-mode');
    
    // Performance & Visual Fix: Disable glows on mobile, OR if Light Mode is active!
    const useHighGraphics = window.innerWidth > 768; 

    // --- 2. Calculate Camera Position ---
    const halfViewW = Math.floor(VIEWPORT_WIDTH_TILES / 2);
    const halfViewH = Math.floor(VIEWPORT_HEIGHT_TILES / 2);
    let camX = playerX - halfViewW;
    let camY = playerY - halfViewH;

    // --- 3. Define the logical dimensions of the map (THE ZOOM FIX) ---
    const logicalWidth = VIEWPORT_WIDTH_TILES * TILE_SIZE;
    const logicalHeight = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

    // --- 4. Clear Canvas & Reset Alignment ---
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // --- 5A. DRAW FACTION BACKGROUNDS (LAYER 0) ---
    if (sensorPulseActive) {
        const pulseIntensity = (1 - (sensorPulseRadius / MAX_PULSE_RADIUS)) * 0.2;
        ctx.fillStyle = isLightMode 
            ? `rgba(0, 119, 119, ${0.05 + pulseIntensity})` 
            : `rgba(0, 40, 40, ${0.4 + pulseIntensity})`;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    } else {
        ctx.fillStyle = isLightMode ? '#FFFFFF' : '#000000';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    const tileSize = TILE_SIZE;
    
    for (let y = 0; y < VIEWPORT_HEIGHT_TILES; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH_TILES; x++) {
            const worldX = Math.floor(camX + x);
            const worldY = Math.floor(camY + y);
            
            // 🚨 THE FIX: Calculate faction/hazard directly. 
            // We cannot cache this on the tileData because empty space is a primitive string!
            const factionKey = getFactionAt(worldX, worldY);
            const hazard = getHazardType(worldX, worldY);
            
            // --- FACTION LAYER ---
            const faction = FACTIONS[factionKey];
            
            if (faction && factionKey !== 'INDEPENDENT') {
                let factionBg = faction.bg;
                if (!isLightMode) {
                    factionBg = factionBg.replace('0.08', '0.15'); 
                }
                
                ctx.fillStyle = factionBg;
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }

            // --- HAZARD LAYER ---
            if (hazard === 'RADIATION_BELT') {
                // Upped the opacity and brightness so it looks like a distinct hazard zone
                ctx.fillStyle = isLightMode ? 'rgba(255, 120, 0, 0.25)' : 'rgba(255, 165, 0, 0.25)';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                
                // Draw harsh radioactive static sparks
                if (Math.random() < 0.15) {
                    ctx.fillStyle = isLightMode ? '#FF3300' : '#FFAA00';
                    ctx.fillRect((x * tileSize) + Math.random()*tileSize, (y * tileSize) + Math.random()*tileSize, 3, 3);
                }
            }
        }
    }

    // --- 5B. DRAW TILES & OBJECTS (LAYER 1) ---
    for (let y = 0; y < VIEWPORT_HEIGHT_TILES; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH_TILES; x++) {
            const worldX = Math.floor(camX + x);
            const worldY = Math.floor(camY + y);

            const tileData = chunkManager.getTile(worldX, worldY);
            const tileChar = getTileChar(tileData);

            // --- XERXES SPECIAL RENDER ---
            if (tileData && tileData.name && tileData.name.includes("Xerxes")) {
                ctx.save();
                if (useHighGraphics && !isLightMode) { 
                    const pulse = (Math.sin(Date.now() / 500) + 1) / 2;
                    ctx.shadowBlur = 20 + (pulse * 10);
                    ctx.shadowColor = '#8A2BE2'; 
                }
                ctx.fillStyle = '#9933FF';
                ctx.font = `bold ${TILE_SIZE * 1.2}px 'Orbitron', monospace`;
                ctx.fillText("●", x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
                ctx.restore();
                continue; 
            }

            // --- AEGIS DYSON SPHERE RENDER ---
            if (tileData && tileData.name === "Aegis Dyson Sphere") {
                ctx.save();
                const pulse = (Math.sin(Date.now() / 800) + 1) / 2;
                if (useHighGraphics && !isLightMode) { 
                    ctx.shadowBlur = 25 + (pulse * 15);
                    ctx.shadowColor = '#FFD700';
                }
                ctx.fillStyle = '#FFAA00'; 
                const sizeMod = 1.1 + (pulse * 0.1);
                ctx.font = `bold ${TILE_SIZE * sizeMod}px 'Orbitron', monospace`;
                ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
                ctx.restore();
                continue; 
            }

            // Custom colored tiles (Colonies, etc)
            if (tileData && tileData.customColor) {
                ctx.save();
                if (useHighGraphics && !isLightMode) { 
                    const pulse = (Math.sin(Date.now() / 600) + 1) / 2;
                    ctx.shadowBlur = 12 + (pulse * 8);
                    ctx.shadowColor = tileData.customColor;
                }
                ctx.fillStyle = tileData.customColor;
                ctx.font = `bold ${TILE_SIZE * 1.2}px 'Orbitron', monospace`;
                const charToDraw = tileData.displayChar || tileChar;
                ctx.fillText(charToDraw, x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
                ctx.restore();
                continue; 
            }

            // Standard Tile Colors
            switch (tileChar) {
                case STAR_CHAR_VAL: 
                    const phase = worldX + (worldY * 3); 
                    ctx.globalAlpha = 0.85 + (Math.sin((Date.now() / 2000) + phase) * 0.15);
                    
                    if (!tileData.visualStarData) {
                        tileData.visualStarData = generateStarData(worldX, worldY);
                    }
                    const visualStarData = tileData.visualStarData;
                    
                    let starColor = visualStarData.color;
                    if (isLightMode) {
                        if (visualStarData.class === "A") starColor = "#444444";       
                        else if (visualStarData.class === "F") starColor = "#999900";  
                        else if (visualStarData.class === "B") starColor = "#3355BB";  
                        else if (visualStarData.class === "O") starColor = "#0033AA";  
                    }
                    
                    ctx.fillStyle = starColor; 
                    
                    // 🚨 FIX: Bypassing the browser ghost-box bug by completely isolating the shadow rendering
                    if (useHighGraphics && !isLightMode) {
                        ctx.save(); // Lock the canvas state
                        ctx.shadowBlur = (visualStarData.class === "O" || visualStarData.class === "B") ? 15 : 5;
                        ctx.shadowColor = starColor;
                        ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                        ctx.restore(); // Instantly wipe the shadow state clean
                        continue; // Skip the standard text rendering below since we just drew it!
                    } 
                    break;
                case PLANET_CHAR_VAL: ctx.fillStyle = isLightMode ? '#0066CC' : '#88CCFF'; break;
                case STARBASE_CHAR_VAL: 
                    ctx.save();
                    const pulse = (Math.sin(Date.now() / 300) + 1) / 2; 
                    if (useHighGraphics && !isLightMode) { 
                        ctx.shadowBlur = 15 + (pulse * 15); 
                        ctx.shadowColor = isLightMode ? '#008888' : '#00FFFF'; 
                    }
                    ctx.fillStyle = isLightMode ? '#008888' : '#00FFFF';
                    const sizeMod = 1.0 + (pulse * 0.1); 
                    ctx.font = `bold ${TILE_SIZE * 1.3 * sizeMod}px 'Orbitron', monospace`;
                    ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                    ctx.restore(); 
                    continue; // 🚨 FIX: Skip standard render so we don't draw it twice!
                case OUTPOST_CHAR_VAL: ctx.fillStyle = isLightMode ? '#228822' : '#AADD99'; break;
                case ASTEROID_CHAR_VAL: 
                    ctx.fillStyle = (tileData && tileData.mined) ? '#555555' : (isLightMode ? '#CC6600' : '#FFAA66'); 
                    break;
                case NEBULA_CHAR_VAL: ctx.fillStyle = isLightMode ? '#8822BB' : '#DD99FF'; break;
                case DERELICT_CHAR_VAL: 
                    ctx.fillStyle = (tileData && tileData.studied) ? '#555555' : (isLightMode ? '#336699' : '#88AACC'); 
                    break;
                case ANOMALY_CHAR_VAL: ctx.fillStyle = isLightMode ? '#CC00CC' : '#FF33FF'; break;
                case WORMHOLE_CHAR_VAL: ctx.fillStyle = isLightMode ? '#CC8800' : '#FFB800'; break;
                case NEXUS_CHAR_VAL: ctx.fillStyle = isLightMode ? '#008888' : '#40E0D0'; break;
                case PIRATE_CHAR_VAL: ctx.fillStyle = isLightMode ? '#CC0000' : '#FF5555'; break;
                case EMPTY_SPACE_CHAR_VAL:
                default:
                    ctx.fillStyle = isLightMode ? '#444455' : '#909090';
                    break;
            }

            // Standard render for non-glowing objects
            ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            
            // Clean slate for the next tile
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0; 
            ctx.shadowColor = 'transparent'; 
        } 
    } 

    // --- 6. Draw Dynamic Entities (LAYER 2) ---
    const playerScreenX = (playerX - camX) * TILE_SIZE + TILE_SIZE / 2;
    const playerScreenY = (playerY - camY) * TILE_SIZE + TILE_SIZE / 2;

    // Draw Pulse Ring
    if (sensorPulseActive) {
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY - (TILE_SIZE/4), sensorPulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = cachedAccentColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // --- BOUNTY TRACKING RETICLE ---
    if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty !== null) {
        const screenX = playerActiveBounty.x - camX;
        const screenY = playerActiveBounty.y - camY;

        if (screenX >= 0 && screenX < VIEWPORT_WIDTH_TILES && screenY >= 0 && screenY < VIEWPORT_HEIGHT_TILES) {
            const pixelX = screenX * TILE_SIZE;
            const pixelY = screenY * TILE_SIZE;
            
            ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 300));
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.4 + (pulse * 0.6)})`;
            ctx.lineWidth = 2;
            
            if (useHighGraphics && !isLightMode) { 
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'var(--danger)';
            }
            
            const m = 4; 
            const s = TILE_SIZE;
            ctx.beginPath();
            ctx.moveTo(pixelX - m + 8, pixelY - m); ctx.lineTo(pixelX - m, pixelY - m); ctx.lineTo(pixelX - m, pixelY - m + 8);
            ctx.moveTo(pixelX - m, pixelY + s + m - 8); ctx.lineTo(pixelX - m, pixelY + s + m); ctx.lineTo(pixelX - m + 8, pixelY + s + m);
            ctx.moveTo(pixelX + s + m - 8, pixelY - m); ctx.lineTo(pixelX + s + m, pixelY - m); ctx.lineTo(pixelX + s + m, pixelY - m + 8);
            ctx.moveTo(pixelX + s + m, pixelY + s + m - 8); ctx.lineTo(pixelX + s + m, pixelY + s + m); ctx.lineTo(pixelX + s + m - 8, pixelY + s + m);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw Particles
    activeParticles.forEach(p => {
        const screenX = (p.x - camX) * TILE_SIZE;
        const screenY = (p.y - camY) * TILE_SIZE;
        if (screenX >= -TILE_SIZE && screenX <= logicalWidth && screenY >= -TILE_SIZE) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life; 
            ctx.fillRect(screenX, screenY, p.size, p.size);
            ctx.globalAlpha = 1.0; 
        }
    });

    // --- DRAW DISTRESS CALLS ---
    activeDistressCalls.forEach(ev => {
        const screenX = (ev.x - camX) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (ev.y - camY) * TILE_SIZE + TILE_SIZE / 2;
        
        // Only draw if it's currently on-screen
        if (screenX >= -TILE_SIZE && screenX <= logicalWidth && screenY >= -TILE_SIZE && screenY <= logicalHeight) {
            ctx.save();
            
            // Make it flash rapidly to grab attention!
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
            
            ctx.fillStyle = `rgba(255, 170, 0, ${0.4 + (pulse * 0.6)})`; // Warning Orange
            
            if (useHighGraphics && !isLightMode) { 
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#FFAA00';
            }
            
            ctx.font = `bold ${TILE_SIZE * 1.2}px 'Orbitron', monospace`;
            ctx.fillText("?", screenX, screenY);
            
            // Optional: Draw a tiny timer bar above it so the player knows it's urgent
            ctx.fillStyle = '#FFAA00';
            const barWidth = (ev.turnsRemaining / 30) * TILE_SIZE;
            ctx.fillRect(screenX - (TILE_SIZE/2), screenY - (TILE_SIZE/2) - 4, barWidth, 2);
            
            ctx.restore();
        }
    });

    // Draw Enemies
    activeEnemies.forEach(enemy => {
        const screenX = (enemy.x - camX) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (enemy.y - camY) * TILE_SIZE + TILE_SIZE / 2;
        if (screenX >= -TILE_SIZE && screenX <= logicalWidth && screenY >= -TILE_SIZE && screenY <= logicalHeight) {
            ctx.fillStyle = enemy.color || '#FF5555'; 
            ctx.font = `bold ${TILE_SIZE}px 'Roboto Mono', monospace`; 
            const charToDraw = enemy.char || PIRATE_CHAR_VAL;
            ctx.fillText(charToDraw, screenX, screenY);
        }
    });

    // Draw Ambient Traffic (NPCs)
    if (typeof activeNPCs !== 'undefined') {
        activeNPCs.forEach(npc => {
            const screenX = (npc.x - camX) * TILE_SIZE + TILE_SIZE / 2;
            const screenY = (npc.y - camY) * TILE_SIZE + TILE_SIZE / 2;
            if (screenX >= -TILE_SIZE && screenX <= logicalWidth && screenY >= -TILE_SIZE && screenY <= logicalHeight) {
                ctx.save();
                ctx.fillStyle = npc.color; 
                if (useHighGraphics && !isLightMode) { 
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = npc.color;
                }
                ctx.font = `bold ${TILE_SIZE * 0.9}px 'Orbitron', monospace`;
                ctx.fillText(npc.char, screenX, screenY);
                ctx.restore();
            }
        });
    }

    // Draw Player
    if (currentCombatContext) {
        ctx.fillStyle = '#FF5555';
        ctx.fillText(PLAYER_CHAR_VAL, playerScreenX, playerScreenY);
    } else {
        ctx.fillStyle = isLightMode ? '#000000' : '#FFFFFF'; 
        ctx.fillText(PLAYER_CHAR_VAL, playerScreenX, playerScreenY);
    }

    // Draw Floating Text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        const screenX = (ft.x - camX) * TILE_SIZE;
        const screenY = (ft.y - camY) * TILE_SIZE + ft.offsetY;
        
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life;
        ctx.font = `bold 14px 'Orbitron', monospace`;
        if (useHighGraphics && !isLightMode) { ctx.shadowBlur = 5; ctx.shadowColor = ft.color; }
        ctx.fillText(ft.text, screenX, screenY);
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        
        if (currentGameState === GAME_STATES.GALACTIC_MAP) {
            ft.offsetY -= 0.5; // Float up
            ft.life -= 0.02;   // Fade out
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }
    }

    // --- 7. Update UI Stats ---
    if (!particleAnimationId) {
        document.getElementById('versionInfo').textContent = `Wayfinder: Echoes of the Void - ${GAME_VERSION}`;
        if (typeof renderUIStats === 'function') renderUIStats();
    }

    // Check if the player turned off the compass!
    if (window.navAssistEnabled === false) return;

    // --- DYNAMIC WAYPOINT COMPASS ---
    // Look for an active target (Bounty, Rescue, or Delivery Mission)
    let targetPoint = null;
    let targetColor = "var(--accent-color)";
    let targetLabel = "NAV";

    if (isAwaitingRescue && rescueTargetStation) {
        targetPoint = { x: rescueTargetStation.x, y: rescueTargetStation.y };
        targetColor = "var(--warning)";
        targetLabel = "TUG";
    } else if (playerActiveBounty) {
        targetPoint = { x: playerActiveBounty.x, y: playerActiveBounty.y };
        targetColor = "var(--danger)";
        targetLabel = "KILL";
    } else if (playerActiveMission && playerActiveMission.type === "DELIVERY" && !playerActiveMission.isComplete) {
        const destName = playerActiveMission.objectives[0].destinationName;
        if (LOCATIONS_DATA[destName]) {
            targetPoint = { x: LOCATIONS_DATA[destName].coords.x, y: LOCATIONS_DATA[destName].coords.y };
            targetColor = "var(--gold-text)";
            targetLabel = "DROP";
        }
    } else if (playerActiveMission && playerActiveMission.isComplete && LOCATIONS_DATA[playerActiveMission.giver]) {
        targetPoint = { x: LOCATIONS_DATA[playerActiveMission.giver].coords.x, y: LOCATIONS_DATA[playerActiveMission.giver].coords.y };
        targetColor = "var(--success)";
        targetLabel = "TURN-IN";
    }

    // If we have a target, draw the compass pointer on the edge of the screen!
    if (targetPoint) {
        const dx = targetPoint.x - playerX;
        const dy = targetPoint.y - playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only draw the compass if the target is off-screen (further than half the viewport)
        if (dist > Math.min(VIEWPORT_WIDTH_TILES, VIEWPORT_HEIGHT_TILES) / 2) {
            const angle = Math.atan2(dy, dx);
            
            // Calculate screen edge intersection
            const padding = TILE_SIZE; // Keep it inside the canvas edge
            const cx = logicalWidth / 2;
            const cy = logicalHeight / 2;
            
            // Map the angle to the boundaries of the canvas
            let edgeX = cx + Math.cos(angle) * (cx - padding);
            let edgeY = cy + Math.sin(angle) * (cy - padding);
            
            // Clamp to a rectangle instead of an oval
            edgeX = Math.max(padding, Math.min(logicalWidth - padding, edgeX));
            edgeY = Math.max(padding, Math.min(logicalHeight - padding, edgeY));

            ctx.save();
            ctx.translate(edgeX, edgeY);
            ctx.rotate(angle);

            // Draw the Holographic Arrow
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-10, -8);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            
            ctx.fillStyle = targetColor;
            if (useHighGraphics && !isLightMode) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = targetColor;
            }
            ctx.fill();
            
            // Pulse opacity based on distance (Flashes faster as you get closer)
            const pulseSpd = Math.max(200, dist * 10);
            ctx.globalAlpha = 0.5 + (Math.sin(Date.now() / pulseSpd) * 0.5);

            ctx.restore(); // Un-rotate to draw text perfectly flat

            // Draw the Distance/Label Text
            ctx.save();
            ctx.fillStyle = targetColor;
            ctx.font = `bold 10px 'Orbitron', monospace`;
            
            // Nudge text away from the arrow so they don't overlap
            const textOffsetX = Math.cos(angle) * -25; 
            const textOffsetY = Math.sin(angle) * -25;
            
            ctx.fillText(`${Math.floor(dist)}u`, edgeX + textOffsetX, edgeY + textOffsetY - 6);
            ctx.fillText(targetLabel, edgeX + textOffsetX, edgeY + textOffsetY + 6);
            
            ctx.restore();
        }
    }
}

// ==========================================
// --- QoL: RE-ENTER / DOCK AT CURRENT TILE ---
// ==========================================

function reEnterCurrentTile() {
    // 1. Only allow this if we are actively flying on the map
    if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') {
        return; 
    }

    const tileData = chunkManager.getTile(playerX, playerY);
    const tileChar = getTileChar(tileData);

    // 2. Check if there is actually something interactable here
    if (tileChar === '#' || tileChar === 'O' || tileChar === OUTPOST_CHAR_VAL || (tileData && tileData.name)) {
        
        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        if (typeof showToast === 'function') showToast("DOCKING SEQUENCE INITIATED", "info");
        
        // 3. Re-trigger the main interaction loop to run customs checks/logs
        if (typeof handleInteraction === 'function') {
            handleInteraction(); 
        }

        // 4. Automatically open the visual UI for Hubs, Outposts, and Black Markets
        const isStationNode = (tileChar === '#' || tileChar === OUTPOST_CHAR_VAL || (tileData && tileData.isBlackMarket));
        if (isStationNode && typeof openStationView === 'function') {
            openStationView();
        }

    } else {
        if (typeof showToast === 'function') showToast("NO DOCKING TARGET DETECTED", "warning");
        logMessage("Sensors detect only empty space here. Nothing to interact with.");
    }
}

// 🚨 Universal Loot Generator
function generateLoot(lootTable) {
    // Expected format: [ { id: 'IRON', weight: 50, min: 1, max: 5 }, { id: 'GOLD', weight: 5, min: 1, max: 2 } ]
    const roll = Math.random() * lootTable.reduce((sum, item) => sum + item.weight, 0);
    let cumulative = 0;
    
    for (const item of lootTable) {
        cumulative += item.weight;
        if (roll <= cumulative) {
            // Found our item! Calculate the random quantity
            const qty = item.min + Math.floor(Math.random() * (item.max - item.min + 1));
            return { id: item.id, qty: qty };
        }
    }
    // Fallback to the most common item if rounding errors occur
    const fallback = lootTable[0];
    return { id: fallback.id, qty: fallback.min };
}

function processLootTable(tableName) {
    const table = LOOT_TABLES[tableName];
    if (!table) return;

    const outcome = getWeightedRandomOutcome(table);
    logMessage(outcome.text);

    // Handle specific outcome types
    if (outcome.type === "ITEM") {
        const itemDef = typeof COMMODITIES !== 'undefined' ? COMMODITIES[outcome.id] : null;
        const weightPerUnit = (itemDef && itemDef.weight !== undefined) ? itemDef.weight : 1;
        
        const qty = outcome.min + Math.floor(Math.random() * (outcome.max - outcome.min + 1));
        const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        
        // BUG FIX: Calculate how many we can ACTUALLY fit based on the item's weight!
        const maxFit = Math.floor(spaceLeft / weightPerUnit);
        const actualQty = Math.min(qty, maxFit);

        if (actualQty > 0) {
            playerCargo[outcome.id] = (playerCargo[outcome.id] || 0) + actualQty;
            updateCurrentCargoLoad();
            logMessage(`Received: ${actualQty} x ${itemDef ? itemDef.name : outcome.id}`, true);
            if (actualQty < qty) logMessage("Cargo full! Left remainder behind.", true);
        } else {
            logMessage("Cargo full! Item discarded.", true);
        }
    }
    else if (outcome.type === "CREDITS") {
        const amt = outcome.min + Math.floor(Math.random() * (outcome.max - outcome.min + 1));
        playerCredits += amt;
        logMessage(`Credits +${amt}`, true);
    }
    else if (outcome.type === "XP") {
        playerXP += outcome.amount;
        checkLevelUp();
    }
    else if (outcome.type === "HEAL") {
        playerShields = MAX_SHIELDS;
        logMessage("Shields restored to 100%.", true);
    }
    else if (outcome.type === "TRAP_PLASMA") {
        // Route this through the master GameBus so it triggers Game Over screens and haptics properly!
        if (typeof GameBus !== 'undefined') {
            GameBus.emit('HULL_DAMAGED', { amount: outcome.damage, reason: "Derelict Plasma Trap" });
        } else {
            playerHull -= outcome.damage;
        }
    }
    else if (outcome.type === "TRAP_PIRATE") {
        if (typeof startCombat === 'function') startCombat();
    }
    
    if (typeof renderUIStats === 'function') renderUIStats();
}

 function triggerSensorPulse() {
     if (sensorPulseActive) return; // Prevent spamming
     sensorPulseActive = true;
     sensorPulseRadius = 0;

     function animatePulse() {
         if (!sensorPulseActive) return;

         // Stop animating if we switch views (e.g. to Codex or Combat)
         if (currentGameState !== GAME_STATES.GALACTIC_MAP) {
             sensorPulseActive = false;
             return;
         }

         sensorPulseRadius += 5; // Speed of the pulse

         if (sensorPulseRadius >= MAX_PULSE_RADIUS) {
             sensorPulseActive = false;
             render(); // Final clear
         } else {
             render(); // Redraw frame
             requestAnimationFrame(animatePulse);
         }
     }
     animatePulse();
 }

 /**
  * Selects a random outcome from a list of weighted outcomes.
  * Each outcome object must have a 'weight' property (number).
  * @param {Array<object>} outcomes - The array of weighted outcome objects.
  * @returns {object} The chosen outcome.
  */

 function getWeightedRandomOutcome(outcomes) {
     const totalWeight = outcomes.reduce((sum, o) => sum + (o.weight || 1), 0);
     let random = Math.random() * totalWeight;

     for (const outcome of outcomes) {
         const weight = outcome.weight || 1; // Default to 1 if no weight is given
         if (random < weight) {
             return outcome;
         }
         random -= weight;
     }
     // Fallback in case of rounding errors
     return outcomes[outcomes.length - 1];
 }

function getCombinedLocationData(x, y) {
     const tileObject = chunkManager.getTile(x, y);

     // Check if the tile is a location type (starbase, planet, etc.)
     if (tileObject && tileObject.type === 'location') {
         return tileObject; // Return the location data object
     }

     // If it's not a location, return null
     return null;
 }

// ==========================================
// --- MASTER GAME TICK ENGINE ---
// ==========================================

function processGameTick(timeAmount, isMovement = false) {
    // 1. Advance the universal clock (Shields, K'tharr regen, etc.)
    if (typeof advanceGameTime === 'function') advanceGameTime(timeAmount);

    // 2. Resolve Environment & Hazards
    const hazard = getHazardType(playerX, playerY);
    const hasRadShield = playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY';

    if (hazard === 'RADIATION_BELT' && !hasRadShield) {
        if (playerShields > 0) {
            // Strips 5 shields per step
            playerShields = Math.max(0, playerShields - 5.0);
            
            // 40% chance to warn the player
            if (isMovement && Math.random() < 0.40) {
                logMessage("<span style='color:var(--warning)'>Dosimeters detect Ionized Radiation Belt. Shields degrading rapidly!</span>");
            }
        } else {
            // Burns 3 Fuel per step if shields are down!
            playerFuel = Math.max(0, playerFuel - 3.0); 
            if (isMovement && Math.random() < 0.40) {
                logMessage("<span style='color:var(--danger)'>Radiation interfering with plasma injectors. Excess fuel consumed!</span>");
            }
        }
        
        // 25% chance to shake the screen, flash red, and THROW SPARKS!
        if (Math.random() < 0.25) {
            if (typeof triggerDamageEffect === 'function') triggerDamageEffect();
            if (typeof spawnParticles === 'function') spawnParticles(playerX, playerY, 'explosion');
        }
    }

    // 3. Mercenary / Crew Passive Checks
    if (isMovement && typeof processMercenaryDrawbacks === 'function') {
        processMercenaryDrawbacks();
    }

    // --- 3.5 NOTORIETY DECAY (Laying Low) ---
    if (playerNotoriety > 0) {
        // Initialize the tracker if it doesn't exist
        if (!lastNotorietyDecayTime) lastNotorietyDecayTime = currentGameDate;
        
        // Every 15 stardates, your heat drops by 1
        if (currentGameDate - lastNotorietyDecayTime >= 15.0) {
            updatePlayerNotoriety(-1); 
            lastNotorietyDecayTime = currentGameDate;
            
            if (playerNotoriety === 0) {
                logMessage("<span style='color:var(--success)'>Concord warrants have expired. Your record is clean.</span>");
                if (typeof showToast === 'function') showToast("WARRANTS EXPIRED", "success");
            } else {
                logMessage("<span style='color:var(--item-desc-color)'>Heat fading. Concord patrols are scaling back their search.</span>");
            }
        }
    }

    // 4. Update Memory & Sectors
    updateSectorState();
    const pCX = Math.floor(playerX / chunkManager.CHUNK_SIZE);
    const pCY = Math.floor(playerY / chunkManager.CHUNK_SIZE);
    chunkManager.pruneChunks(pCX, pCY);

    // 5. Move AI Entities
    if (typeof updateEnemies === "function") updateEnemies();
    if (typeof updateAmbientNPCs === "function") updateAmbientNPCs();

    // 6. Spawn New Traffic (5% chance per tick)
    if (Math.random() < 0.05 && typeof spawnAmbientNPCs === "function") {
        spawnAmbientNPCs();
    }

    // 7. Check for Immediate Combat Collisions
    if (typeof activeEnemies !== 'undefined') {
        const enemyAtLoc = activeEnemies.find(e => e.x === playerX && e.y === playerY);
        if (enemyAtLoc) {
            triggerHaptic(200);
            startCombat(enemyAtLoc);
            removeEnemyAt(playerX, playerY);
            return true; // Return true to indicate the tick ended in combat!
        }
    }

    // --- 8. COLONY PRODUCTION ENGINE (The Tycoon Update) ---
    if (typeof playerColonies !== 'undefined') {
        Object.values(playerColonies).forEach(colony => {
            if (colony.established) {
                // Initialize storage arrays if they don't exist yet
                if (typeof colony.treasury === 'undefined') colony.treasury = 0;
                if (typeof colony.storage === 'undefined') colony.storage = {};
                if (typeof colony.lastTick === 'undefined') colony.lastTick = currentGameDate;

                // Produce passive income every 1.0 Stardates
                if (currentGameDate - colony.lastTick >= 1.0) {
                    colony.lastTick = currentGameDate;

                    // Phase 2: Populated -> Generates Taxes
                    if (colony.phase === 'POPULATED' || colony.phase === 'OPERATIONAL') {
                        const taxRate = 0.5; // Credits per citizen
                        const moraleMult = colony.morale / 100;
                        const taxes = Math.floor(colony.population * taxRate * moraleMult);
                        colony.treasury += taxes;
                    }

                    // Phase 3: Operational -> Generates Biome Resources
                    if (colony.phase === 'OPERATIONAL') {
                        const biomeDef = typeof PLANET_BIOMES !== 'undefined' ? PLANET_BIOMES[colony.biome] : null;
                        if (biomeDef && biomeDef.resources.length > 0) {
                            // Pick a random resource native to the biome
                            const res = biomeDef.resources[Math.floor(Math.random() * biomeDef.resources.length)];
                            const amount = Math.floor(Math.random() * 3) + 1 + Math.floor(colony.population / 100);
                            colony.storage[res] = (colony.storage[res] || 0) + amount;
                        }
                    }

                    // --- RARE COLONY EVENTS ---
                    // 0.2% chance per 1.0 stardate to trigger an event if they have population
                    if ((colony.phase === 'POPULATED' || colony.phase === 'OPERATIONAL') && Math.random() < 0.002) {
                        // Pass the whole 'colony' object, not just 'colony.id'!
                        if (typeof triggerColonyEvent === 'function') triggerColonyEvent(colony);
                    }
                }
            }
        });
    }

    // --- 9. DYNAMIC ECONOMY SHIFTS ---
    // If there is no active trend, or the current one has expired, generate a new one!
    if (!activeMarketTrend || currentGameDate > activeMarketTrend.expiry) {
        if (typeof generateMarketTrend === 'function') generateMarketTrend();
    }

    // 🚨 The Universal Tick Broadcast
    // Instead of hardcoding everything here, any script file (trade.js, colonies.js, etc.) 
    // can just listen for 'TICK_PROCESSED' and run its own background math!
    if (typeof GameBus !== 'undefined') {
        GameBus.emit('TICK_PROCESSED', { timeAmount: timeAmount, isMovement: isMovement });
    }

    return false; // Tick finished peacefully
}


 function movePlayer(dx, dy) {
    // 1. UI & State Blocks
    if (currentTradeContext || currentOutfitContext || currentMissionContext || currentEncounterContext || currentShipyardContext) {
        logMessage("Complete current action first.");
        return;
    }
    if (currentCombatContext) {
        logMessage("In combat! (F)ight or (R)un.");
        return;
    }

    // 2. Fuel Math
    const currentEngine = COMPONENTS_DATABASE[playerShip.components.engine];
    let actualFuelPerMove = typeof BASE_FUEL_PER_MOVE !== 'undefined' ? BASE_FUEL_PER_MOVE : 1.0;
    actualFuelPerMove *= (currentEngine.stats.fuelEfficiency || 1.0);
    
    if (playerPerks.has('EFFICIENT_THRUSTERS')) actualFuelPerMove *= 0.8; 
    
    // --- ASTROGATOR CREW PERK ---
    if (typeof hasCrewPerk === 'function' && hasCrewPerk('FUEL_EFFICIENCY')) {
        actualFuelPerMove *= 0.75; // 25% less fuel consumed per jump!
    }

    // 3. Fuel Check (Stranded)
    if (playerFuel < actualFuelPerMove && (dx !== 0 || dy !== 0)) {
        triggerHaptic(200);
        logMessage("<span style='color:red'>CRITICAL: OUT OF FUEL! Engines offline.</span>");
        
        const strandedActions = [
            { label: 'Distress Beacon', key: 'z', onclick: activateDistressBeacon },
            { label: 'Drift & Wait', key: '.', onclick: playerWaitTurn },
            { label: 'Self Destruct', key: 'x', onclick: confirmSelfDestruct }
        ];
        renderContextualActions(strandedActions);
        return;
    }

    // 4. Update Coordinates
    playerX += dx;
    playerY += dy;

    // 5. Execute Movement Logic
    if (dx !== 0 || dy !== 0) {
        currentStationRecruits = []; 
        currentStationBounties = []; // Wipe old bounties
        
        playerFuel = Math.max(0, playerFuel - actualFuelPerMove);
        
        spawnParticles(playerX - dx, playerY - dy, 'thruster', { x: dx, y: dy });

        // ==========================================
        // --- DYNAMIC DISTRESS CALL SYSTEM ---
        // ==========================================
        
        // 1. Roll to spawn a new event (0.05% chance per step, max 2 active at a time)
        if (Math.random() < 0.0005 && activeDistressCalls.length < 2) {
            // Spawn it 8 to 15 tiles away from the player
            const dist = 8 + Math.floor(Math.random() * 7);
            const angle = Math.random() * Math.PI * 2;
            
            const eventX = Math.floor(playerX + Math.cos(angle) * dist);
            const eventY = Math.floor(playerY + Math.sin(angle) * dist);
            
            activeDistressCalls.push({
                x: eventX,
                y: eventY,
                turnsRemaining: 60, // Player has 60 movement steps to reach it
                type: Math.random() > 0.5 ? 'AMBUSH' : 'RESCUE' 
            });
            
            if (typeof showToast === 'function') showToast("DISTRESS SIGNAL DETECTED", "warning");
            if (typeof soundManager !== 'undefined') soundManager.playUIHover(); // A soft blip sound
        }

        // 2. Tick down existing events and check for collisions
        for (let i = activeDistressCalls.length - 1; i >= 0; i--) {
            let ev = activeDistressCalls[i];
            ev.turnsRemaining--;
            
            // Did the player reach the exact coordinates?
            if (playerX === ev.x && playerY === ev.y) {
                if (ev.type === 'AMBUSH') {
                    logMessage("<span style='color:var(--danger)'>It was a trap! Pirates decloak!</span>");
                    // Trigger your existing combat system!
                    if (typeof startCombat === 'function') startCombat(); 
                } else {
                    logMessage("<span style='color:var(--success)'>You rescued a stranded pilot. They transfer 500c in gratitude.</span>");
                    playerCredits += 500;
                    if (typeof renderUIStats === 'function') renderUIStats();
                    if (typeof soundManager !== 'undefined') soundManager.playBuy();
                }
                // Remove the event since it was resolved
                activeDistressCalls.splice(i, 1); 
            } 
            // Did the timer hit zero?
            else if (ev.turnsRemaining <= 0) {
                logMessage("<span style='color:#666'>A nearby distress signal faded to static...</span>");
                activeDistressCalls.splice(i, 1);
            }
        }

        // --- THE MAGIC HANDOFF ---
        // Let the Tick Engine handle the rest!
        const combatStarted = processGameTick(0.01, true);
        
        // If the tick resulted in combat, stop processing interaction!
        if (combatStarted) return; 
    }

    // 6. Handle Random Events / Tile Interaction
    const encounterRoll = Math.random();
    if (encounterRoll < PIRATE_ENCOUNTER_CHANCE) {
        if (typeof spawnPirateNearPlayer === "function") spawnPirateNearPlayer();
        else startCombat(); 
    } else if (encounterRoll < PIRATE_ENCOUNTER_CHANCE + 0.015) {
        triggerRandomEvent(); // 1.5% chance for salvage
    } else {
        handleInteraction(); // Normal tile interaction
    }
}

function handleInteraction() {
    const currentFaction = getFactionAt(playerX, playerY);
    const standing = playerFactionStanding[currentFaction] || 0;
    
    // Hostile Territory Warning
    if (standing < -20 && Math.random() < 0.05 && !currentCombatContext) { 
        let shipKey = "STRIKER"; 
        if (currentFaction === 'ECLIPSE') shipKey = "STRIKER"; 
        if (currentFaction === 'KTHARR') shipKey = "KTHARR_SCOUT";
        if (currentFaction === 'CONCORD') shipKey = "CONCORD_PATROL";
        
        const factionName = FACTIONS[currentFaction] ? FACTIONS[currentFaction].name : currentFaction;
        logMessage(`WARNING: Entered hostile ${factionName} space! Interceptors launching!`, "color:#FF5555");
        startCombat({ shipClassKey: shipKey }); 
        return;
    }

    const tileObject = chunkManager.getTile(playerX, playerY);
    const tileChar = getTileChar(tileObject);

    // ==========================================
    // --- UNIVERSAL ON-INTERACT HOOK ---
    // ==========================================

    // If the data file defines a custom interaction for this specific tile,
    // run it immediately and skip the rest of the hardcoded engine logic!
    if (tileObject && typeof tileObject.onInteract === 'function') {
        tileObject.onInteract(tileObject);
        return; 
    }

    let bM = ""; 
    let availableActions = [];

    if (tileObject && tileObject.type === 'location') {
        const location = tileObject;
         
        // --- 1. XERXES INTERCEPT ---
        if (location.name.includes("Xerxes")) {
            // NATIVE FIX: Render the button before opening the view!
            availableActions.push({ label: 'Access Shadow Network', key: 'e', onclick: openXerxesView });
            if (typeof renderContextualActions === 'function') renderContextualActions(availableActions);
            
            openXerxesView();
            return; 
        }

        // --- COLONY INTERCEPT ---
        if (location.isColony) {
            if (typeof soundManager !== 'undefined') soundManager.playUIHover();
            if (typeof showToast === 'function') showToast(`WELCOME TO ${location.name.toUpperCase()}`, "success");

            availableActions.push({ label: `Manage Colony`, key: 'e', onclick: openColonyManagement });
            if (typeof renderContextualActions === 'function') renderContextualActions(availableActions);

            openColonyManagement();
            return; 
        }

        // --- 2. STATION & OUTPOST INTERCEPT ---
        if (location.isMajorHub || location.char === OUTPOST_CHAR_VAL) {
            
            // Customs scan for major hubs (Must pass to dock!)
            if (location.isMajorHub) {
                const cleared = performCustomsScan();
                if (!cleared) return; 
            }

            if (typeof soundManager !== 'undefined') soundManager.playUIHover();
            if (typeof showToast === 'function') showToast(`DOCKED: ${location.name.toUpperCase()}`, "success");

            playerShields = MAX_SHIELDS;
            
            // EMERGENCY COURTESY FUEL (Anti-Softlock)
            // 40 fuel is statistically enough to reach the nearest star to scoop, 
            // but forces the player to actually buy fuel if they want a full tank for long trips.
            const EMERGENCY_FUEL = 40; 
            if (playerFuel < EMERGENCY_FUEL) {
                playerFuel = EMERGENCY_FUEL;
                logMessage("<span style='color:var(--warning)'>Station port authority provided a courtesy emergency fuel reserve.</span>");
            }
            
            applyPlayerShipStats();

            // Handle Discovery XP
            if (!discoveredLocations.has(location.name)) {
                discoveredLocations.add(location.name);
                playerXP += XP_PER_LOCATION_DISCOVERY;
                if (typeof showToast === 'function') showToast(`Discovered: ${location.name}! +${XP_PER_LOCATION_DISCOVERY} XP`, "success");
                unlockLoreEntry(`LOCATION_${location.name.replace(/\s+/g, '_').toUpperCase()}`);
                checkLevelUp();
            }

            // NATIVE FIX: Render the button before opening the view!
            availableActions.push({ label: `Dock (${location.name})`, key: 'e', onclick: openStationView });
            if (typeof renderContextualActions === 'function') renderContextualActions(availableActions);

            // Open the visual modal and stop processing generic text logs
            openStationView();
            autoSaveGame();
            return; 
        }

        // --- 3. PLANETARY LANDING INTERCEPT ---
        // Catches generic planets and opens the mining/scan UI
        if (location.char === 'O' || (location.name && location.name.toLowerCase().includes("planet")) || location.biome) {
            // NATIVE FIX: Render the button before opening the view!
            availableActions.push({ label: `Land (${location.name || 'Planet'})`, key: 'e', onclick: () => openPlanetView(location) });
            if (typeof renderContextualActions === 'function') renderContextualActions(availableActions);

            openPlanetView(location);
            return;
        }

        // --- 4. PIRATE BASE INTERCEPT ---
        if (location.isPirateBase) {
            if (location.cleared) {
                logMessage("The outpost is a smoking ruin. Nothing left to salvage.");
                return;
            }
            
            availableActions.push({ label: `RAID OUTPOST`, key: 'e', onclick: () => startOutpostRaid(location) });
            if (typeof renderContextualActions === 'function') renderContextualActions(availableActions);
            
            logMessage("<span style='color:var(--danger)'>WARNING: Heavily armed pirate stronghold detected.</span>");
            return; 
        }

        // --- 5. GENERIC LOCATION FALLBACK ---
        // Anything that isn't a planet or station drops down here to use your classic menus
        bM = `Arrived at ${location.name}.`;

        if ((location.sells && location.sells.length > 0) || (location.buys && location.buys.length > 0)) {
            availableActions.push({ label: 'Buy', key: 'b', onclick: () => openTradeModal('buy') });
            availableActions.push({ label: 'Sell', key: 's', onclick: () => openTradeModal('sell') });
        }

        if (playerHull < MAX_PLAYER_HULL) {
            const hullToRepair = MAX_PLAYER_HULL - playerHull;
            const repairCost = hullToRepair * HULL_REPAIR_COST_PER_POINT;
            availableActions.push({ label: `Repair Hull (${formatNumber(repairCost)}c)`, key: 'r', onclick: repairShip });
        }

        // Mission turn-ins
        if (playerActiveMission && playerActiveMission.type === "DELIVERY" && !playerActiveMission.isComplete && location.name === playerActiveMission.objectives[0].destinationName) {
            availableActions.push({ label: 'Complete Delivery', key: 'c', onclick: handleCompleteDelivery });
        }
        if (playerActiveMission && playerActiveMission.isComplete && location.name === playerActiveMission.giver) {
            availableActions.push({ label: 'Get Reward', key: 'g', onclick: grantMissionRewards });
        }
        if (playerActiveMission && playerActiveMission.type === "ACQUIRE" && !playerActiveMission.isComplete && location.name === playerActiveMission.giver) {
            availableActions.push({ label: 'Turn in Resources', key: 'g', onclick: handleTurnInAcquire });
        }

        if (!discoveredLocations.has(location.name)) {
            discoveredLocations.add(location.name);
            playerXP += XP_PER_LOCATION_DISCOVERY;
            bM += `\n<span style='color:var(--success);'>Location Discovered: ${location.name}! +${formatNumber(XP_PER_LOCATION_DISCOVERY)} XP!</span>`;
            unlockLoreEntry(`LOCATION_${location.name.replace(/\s+/g, '_').toUpperCase()}`);
            checkLevelUp();
        }

    } else {
        // --- 6. DEEP SPACE PHENOMENA ---

        // ==========================================
        // --- DATA-DRIVEN TILE OVERRIDE HOOK ---
        // ==========================================

        // If the tile character exists in our custom interactions dictionary, 
        // run that logic and completely skip the hardcoded engine switch below!

        if (typeof TILE_INTERACTIONS !== 'undefined' && TILE_INTERACTIONS[tileChar]) {
            const customInteraction = TILE_INTERACTIONS[tileChar];
            
            if (customInteraction.log) logMessage(customInteraction.log);
            if (customInteraction.actions) {
                // If actions are provided as a function (for dynamic buttons), execute it
                if (typeof customInteraction.actions === 'function') {
                    renderContextualActions(customInteraction.actions(tileObject));
                } else {
                    renderContextualActions(customInteraction.actions);
                }
            }
            return; // Skip the rest of the hardcoded interactions!
        }

        switch (tileChar) {
            case STAR_CHAR_VAL:
                const starData = generateStarData(playerX, playerY);
                const starId = `${playerX}_${playerY}`; 
                
                // --- LIGHT MODE CONTRAST FIX FOR GAME LOG ---
                let logColor = starData.color;
                let isLight = false;
                if (typeof isLightMode !== 'undefined' && isLightMode === true) {
                    isLight = true;
                } else if (document.body.classList.contains('light-mode') || document.body.classList.contains('light-theme')) {
                    isLight = true;
                }
                
                // Darken the bright stars for the text log
                if (isLight) {
                    if (starData.class === "A") logColor = "#444444";
                    else if (starData.class === "F") logColor = "#999900";
                    else if (starData.class === "B") logColor = "#3355BB";
                    else if (starData.class === "O") logColor = "#0033AA";
                }
                
                // Build the log message using the contrast-safe logColor!
                bM = `<span style="color:${logColor}; font-size:16px; font-weight:bold;">SYSTEM: ${starData.designation.toUpperCase()}</span>\n`;
                
                // Hazard Warning
                if (starData.hazard !== "NONE") {
                    bM += `<span style="color:var(--danger); font-weight:bold;">WARNING: ${starData.hazard} DETECTED.</span>`;
                }

                // --- MULTI-COLONY BIFURCATION ---
                const localColonies = Object.values(playerColonies).filter(c => c.x === playerX && c.y === playerY);

                if (localColonies.length > 0) {
                    bM += `\n<span style="color:var(--success); font-weight:bold;">[!] SETTLEMENTS DETECTED: ${localColonies.length}</span>`;
                    localColonies.forEach((col, idx) => {
                        availableActions.push({ 
                            label: `Manage: ${col.name}`, 
                            // Bind the first colony to '1', the second to '2', etc.
                            key: (idx + 1).toString(), 
                            onclick: () => openColonyManagement(col.id) 
                        });
                    });
                }

                // 1. Evaluate / Scan Star 
                const hasScanned = typeof discoveredLocations !== 'undefined' && discoveredLocations.has(`STAR_SCAN_${starId}`);
                availableActions.push({ 
                    label: hasScanned ? 'Review Scan Data' : 'Run Deep Scan', 
                    key: 'v', 
                    onclick: () => evaluateStar(starData, starId) 
                });

                // 2. Enter System
                availableActions.push({ 
                    label: 'Enter System', 
                    key: 'e', 
                    onclick: () => { 
                        currentSystemData = generateStarSystem(playerX, playerY); 
                        changeGameState(GAME_STATES.SYSTEM_MAP); 
                    } 
                });
                
                // 3. Fuel Scoop
                availableActions.push({ 
                    label: `Fuel Scoop (${starData.scoopYield} Fuel)`, 
                    key: 'h', 
                    onclick: () => {
                        if (starData.class === "O" || starData.class === "B") {
                            const util = COMPONENTS_DATABASE[playerShip.components.utility || "UTIL_NONE"];
                            
                            // 🚨 BUG FIX: Safely check for the perk whether it's a Set or a legacy Array!
                            const hasRadPerk = typeof playerPerks !== 'undefined' && 
                                ((playerPerks.has && playerPerks.has('HEALTH_PHYSICIST')) || 
                                 (playerPerks.includes && playerPerks.includes('HEALTH_PHYSICIST')));
                            
                            if ((!util || !util.radImmunity) && !hasRadPerk) {
                                playerHull -= 20;
                                if (typeof triggerHaptic === 'function') triggerHaptic(200);
                                logMessage("<span style='color:var(--danger);'>Radiation shielding breached! Hull integrity compromised while scooping.</span>");
                            } else if (hasRadPerk && (!util || !util.radImmunity)) {
                                logMessage("<span style='color:var(--success);'>Radiological protocols active. Radiation bypassed safely.</span>");
                            }
                        }
                        if (playerFuel < MAX_FUEL) {
                            playerFuel = Math.min(MAX_FUEL, playerFuel + starData.scoopYield);
                            if (typeof showToast === 'function') showToast(`SCOOPED +${starData.scoopYield} HYDROGEN`, "info");
                            logMessage(`Successfully harvested ${starData.scoopYield} units of coronal plasma.`);
                            if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                            
                            // Use the master tick engine so colonies produce goods and NPCs move!
                            if (typeof processGameTick === 'function') processGameTick(1.0, false);
                        } else {
                            if (typeof showToast === 'function') showToast("TANKS FULL", "warning");
                        }
                    } 
                });
                
                unlockLoreEntry("PHENOMENON_STAR");
                break;

            case NEXUS_CHAR_VAL:
                bM = "You are hovering before a colossus of shifting geometry. The First Nexus.";
                if (typeof mystery_nexus_activated !== 'undefined' && mystery_nexus_activated) bM += "\nIt pulses with a silent, rhythmic light. It knows you are here.";
                else bM += "\nIt is dormant, but the Wayfinder Core in your hold is vibrating in unison.";
                availableActions.push({ label: 'Commune', key: 'x', onclick: handleNexusEncounter });
                unlockLoreEntry("MYSTERY_FIRST_NEXUS");
                break;
            case ASTEROID_CHAR_VAL:
                bM = `Asteroid field.`;
                const tile = chunkManager.getTile(playerX, playerY);
                
                // Check if the asteroid was already blown open by the mini-game!
                if (tile && (tile.mined || tile.minedThisVisit)) {
                    bM += ` Scanners show this rock is completely depleted.`;
                    availableActions.push({ 
                        label: 'Depleted', 
                        key: 'm', 
                        onclick: () => {
                            logMessage("Scanners show this asteroid has already been stripped bare.", "color:var(--item-desc-color)");
                            if (typeof showToast === 'function') showToast("ASTEROID DEPLETED", "info");
                        } 
                    });
                } else {
                    // Hook up our brand new mini-game!
                    availableActions.push({ label: 'Mine Asteroid', key: 'm', onclick: startMiningMiniGame });
                }
                
                unlockLoreEntry("PHENOMENON_ASTEROID");
                break;
            case NEBULA_CHAR_VAL:
                bM = `Inside a dense gas cloud. Sensors are intermittent.`;
                availableActions.push({ label: 'Scoop Fuel', key: 'h', onclick: scoopHydrogen });
                unlockLoreEntry("PHENOMENON_NEBULA");
                break;
            case WORMHOLE_CHAR_VAL:
                bM = `Near a swirling vortex in spacetime.`;
                availableActions.push({ label: 'Traverse', key: 't', onclick: traverseWormhole });
                unlockLoreEntry("PHENOMENON_WORMHOLE");
                break;
            case ANOMALY_CHAR_VAL:
                if (tileObject.studied) {
                    bM = "Scanners show this phenomenon has already dissipated.";
                } else {
                    bM = ""; 
                    // 50% chance to trigger the Hacking Minigame, 50% chance for Astrometrics!
                    if (Math.random() > 0.5 && typeof handleAnomalyEncounter === 'function') {
                        handleAnomalyEncounter(tileObject);
                    } else if (typeof handleAnomaly === 'function') {
                        handleAnomaly();
                        updateWorldState(playerX, playerY, { studied: true });
                    }
                }
                unlockLoreEntry("XENO_ANOMALIES");
                break;
            case DERELICT_CHAR_VAL:
                if (tileObject && tileObject.studied) {
                    // It's stripped! Set the classic text log message.
                    bM = "Scanners show this derelict has already been stripped of useful salvage.";
                    availableActions.push({ label: 'Inspect Wreckage', key: 'e', onclick: openDerelictView });
                } else {
                    // Fresh derelict! 
                    if (typeof unlockLoreEntry === 'function') unlockLoreEntry("XENO_DERELICTS");
                    availableActions.push({ label: 'Board Derelict', key: 'e', onclick: openDerelictView });
                }
                
                // We use setTimeout to wait 10 milliseconds. This lets the game finish 
                // drawing the map and the UI first, so our button doesn't get instantly erased!
                setTimeout(() => {
                    if (typeof renderContextualActions === 'function') {
                        renderContextualActions(availableActions);
                    }
                }, 10);
                
                break;
        }
    }

    if (bM) logMessage(bM);
    
    // ALWAYS run this, even if empty, so it clears the old buttons out!
    if (typeof renderContextualActions === 'function') {
        renderContextualActions(availableActions);
    }
    
    if (tileObject && tileObject.type === 'location') {
        autoSaveGame();
    }
}

 function handleNexusEncounter() {
     // Check if we have the key
     if (!playerCargo.WAYFINDER_CORE && !mystery_nexus_activated) {
         logMessage("The Nexus is silent. You feel you lack the 'key' to wake it.");
         return;
     }

     if (mystery_nexus_activated) {
         logMessage("The Nexus whispers to you... 'Wait for the Cycle to turn.' (Content TBD in v1.0)");
         return;
     }

     // ACTIVATE THE NEXUS
     mystery_nexus_activated = true;
     playerXP += 5000; // Massive XP boost
     playerCredits += 50000; // Massive Wealth
     
     // Update the world tile to reflect activation
     updateWorldState(playerX, playerY, { activated: true });

     // FX
     spawnParticles(playerX, playerY, 'explosion'); 
     setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 500);

     let msg = "<span style='color:#40E0D0'>THE NEXUS AWAKENS.</span>\n";
     msg += "A beam of pure information blasts into your mind. You see the birth of stars, the death of galaxies, and the path of the Precursors.\n";
     msg += "Your ship's computer is flooded with ancient data algorithms.\n";
     msg += "\n<span style='color:#FFD700'>REWARD: +5000 XP, +50,000 Credits.</span>";
     msg += "\n(You have reached the current end of the story content.)";

     logMessage(msg);
     checkLevelUp();
 }

  function startEncounter(tileObject) {
     switch (tileObject.type) {
         case 'anomaly':
             handleAnomalyEncounter(tileObject);
             break;
             // You could add a case for 'derelict' here in the future
         default:
             logMessage("Your sensors can't get a clear reading.");
             break;
     }

 }

 /**
  * Handles the random outcomes of salvaging a derelict ship using a weighted system.
  * This function now depends on the 'getWeightedRandomOutcome' helper function.
  * @param {object} derelictObject - The tile data for the derelict.
  */

function handleDerelictEncounter(derelictObject) {
    logMessage("Boarding derelict vessel...");
    
    // Simple logic: Is it a dangerous sector? Use the "Rare/Dangerous" table.
    // Otherwise use the "Common" table.
    const dist = Math.sqrt(playerX**2 + playerY**2);
    const tableToUse = (dist > 500 && Math.random() > 0.5) ? 'DERELICT_RARE' : 'DERELICT_COMMON';
    
    processLootTable(tableToUse);

    updateWorldState(playerX, playerY, { studied: true });
}

 /**
  * Regenerates the player's shields based on time passed and equipped shield.
  * Does not run in combat or when shields are full.
  * @param {number} timePassed - The amount of stardate that has passed.
  */

 function regenerateShields(timePassed) {
     // No regen in combat or when already full
     if (currentGameState === GAME_STATES.COMBAT || playerShields >= MAX_SHIELDS) {
         return;
     }

     // Get the equipped shield's stats
     const shield = COMPONENTS_DATABASE[playerShip.components.shield];
     const rechargeRate = shield.stats.rechargeRate || 1; // e.g., "1" point per 0.1 stardate

     // Calculate regen. A rate of 1 means 1 point per 0.1 stardate.
     // (rechargeRate / 0.1) gives us rate-per-stardate.
     const regenAmount = ((rechargeRate / 0.1) * timePassed) * 6;

     playerShields += regenAmount;

     // Don't let it overshoot
     if (playerShields > MAX_SHIELDS) {
         playerShields = MAX_SHIELDS;
     }
 }

 /**
  * Advances the game clock and triggers time-based events like shield regen.
  * This is our new "master" function for passing time.
  * @param {number} timeAmount - The amount of stardate to pass (e.g., 0.01 for one move).
  */

function advanceGameTime(timeAmount) {
    currentGameDate += timeAmount;

    // Existing per-tick updates (like shield regeneration)
    if (typeof regenerateShields === 'function') {
        regenerateShields(timeAmount);
    }

    // --- K'THARR BIO-REGEN ---
    // Safely check if the player has a ship and a utility item equipped
    if (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility) {
        
        const utilId = playerShip.components.utility;
        
        // We look up the equipped item in your components database
        if (typeof COMPONENTS_DATABASE !== 'undefined') {
            const utilItem = COMPONENTS_DATABASE[utilId];

            // If the item exists and has the passiveRegen flag turned on...
            if (utilItem && utilItem.stats && utilItem.stats.passiveRegen) {
                if (playerHull < MAX_PLAYER_HULL) {
                    
                    // Heal 2.0 hull points per 1.0 stardate passed. 
                    // Since moving 1 tile usually takes ~0.01 stardates, this equates 
                    // to roughly 1 hull point every 50 tiles moved. Slow, but free!
                    const healAmount = timeAmount * 2.0; 
                    
                    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + healAmount);
                }
            }
        }
    }
    // --- CREW BIO-REGEN ---
    if (hasCrewPerk('PASSIVE_REPAIR') && playerHull < MAX_PLAYER_HULL) {
        // Heals roughly 1 hull per 10 tiles moved (fast enough to be useful, not overpowered)
        const healAmount = timeAmount * 10.0; 
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + healAmount);
    }
}

function checkLevelUp() {
    // 1. Check Threshold
    if (playerXP < xpToNextLevel) return false;

    // 2. Consume XP and Level Up
    playerXP -= xpToNextLevel;
    playerLevel++;
    xpToNextLevel = calculateXpToNextLevel(playerLevel);
    
    // 3. Heal Player (Standard Reward)
    playerShields = MAX_SHIELDS;
    playerFuel = MAX_FUEL;
    playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 25);
    
    // 4. Trigger Perk Selection UI
    if (typeof soundManager !== 'undefined') {
        soundManager.playTone(600, 'sine', 0.1); 
        setTimeout(() => soundManager.playTone(800, 'sine', 0.2), 100);
    }
    
    // 🎆 MASSIVE GOLDEN PARTICLE BURST!
    if (typeof spawnParticles === 'function') {
        spawnParticles(playerX, playerY, 'gain');
        setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 100);
        setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 200);
    }

    // --- Safe Modal Hiding ---
    if (typeof closeGenericModal === 'function') closeGenericModal();
    
    // Safely hide old trade modals if they exist
    const oldTradeModal = document.getElementById('tradeOverlay');
    if (oldTradeModal) oldTradeModal.style.display = 'none';
    
    // Safely hide the Xerxes menu so the level up screen isn't blocked
    const xerxesModal = document.getElementById('xerxesOverlay');
    if (xerxesModal) xerxesModal.style.display = 'none';

    // Safely hide standard station menus
    const stationModal = document.getElementById('stationOverlay');
    if (stationModal) stationModal.style.display = 'none';
    
    if (typeof changeGameState === 'function') changeGameState(GAME_STATES.LEVEL_UP); 
    if (typeof renderLevelUpScreen === 'function') renderLevelUpScreen();
    
    return true;
}

function renderLevelUpScreen() {
    const overlay = document.getElementById('levelUpOverlay');
    const container = document.getElementById('perkCardsContainer');
    container.innerHTML = '';
    
    // 1. Get Random Perks (that we don't already have)
    const availablePerks = Object.values(PERKS_DATABASE).filter(p => !playerPerks.has(p.id));
    
    // --- VETERAN REWARD ANTI-LOOP ---
    // If the player has acquired every single perk in the game, 
    // grant them a generic "Veteran" bonus to prevent a menu soft-lock.
    if (availablePerks.length === 0) {
        playerCredits += 5000;
        playerHull = MAX_PLAYER_HULL;
        
        logMessage("<span style='color:#FFD700'>VETERAN RANK ACHIEVED: Granted 5,000c and full hull repair!</span>");
        if (typeof showToast === 'function') showToast("MAXIMUM LEVEL REACHED", "success");
        
        // Resume Game Without Menu
        changeGameState(GAME_STATES.GALACTIC_MAP);
        renderUIStats();
        saveGame();
        
        // Break the synchronous stack to prevent infinite recursion crashes!
        setTimeout(() => {
            if (typeof checkLevelUp === 'function') checkLevelUp();
        }, 250); 
        
        return;
    }

    // Shuffle
    const shuffled = availablePerks.sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    
    // 2. Render Cards (Using CSS Classes)
    choices.forEach(perk => {
        const card = document.createElement('div');
        card.className = 'perk-card'; 
        
        card.innerHTML = `
            <div class="perk-icon">${perk.icon}</div>
            <h3 class="perk-title">${perk.name}</h3>
            <p class="perk-desc">${perk.description}</p>
            <div class="perk-category">${perk.category} Class</div>
        `;
        
        // Click Logic
        card.onclick = () => selectPerk(perk.id);
        
        container.appendChild(card);
    });
    
    overlay.style.display = 'flex';
}

function selectPerk(perkId) {
    playerPerks.add(perkId);

    // Lore Unlock Hook
    unlockLoreEntry("TECH_CYBER_AUGMENTATION");
    
    logMessage(`<span style="color:#FFD700">UPGRADE INSTALLED: ${PERKS_DATABASE[perkId].name}</span>`);
    showToast(`${PERKS_DATABASE[perkId].name} Acquired!`, 'success');
    
    document.getElementById('levelUpOverlay').style.display = 'none';
    
    // --- NO MORE FORCED GALACTIC MAP RETURN ---
    // By removing changeGameState(GAME_STATES.GALACTIC_MAP) here, 
    // the game seamlessly leaves you in whatever menu you were already looking at!
    
    renderUIStats();
    saveGame(); // Auto-save on level up
    
    // --- UI BREATHING ROOM ---
    // Give the modal time to fade away before checking if we need to pop it up again
    setTimeout(() => {
        if (typeof checkLevelUp === 'function') checkLevelUp();
    }, 250);
}

/**
 * Procedurally generates environmental hazards using continuous wave noise.
 */

function getHazardType(worldX, worldY) {
    // --- SPAWN PROTECTION ---
    // 🚨 FIX: Ensure the protection is centered on Starbase Alpha, not the middle of the grid!
    const spawnX = MAP_WIDTH - 7;
    const spawnY = MAP_HEIGHT - 5;
    const distFromSpawn = Math.sqrt(Math.pow(worldX - spawnX, 2) + Math.pow(worldY - spawnY, 2));
    
    // Guarantees a completely clear 25-tile radius around the starting point
    if (distFromSpawn < 25) {
        return null; 
    }

    const scale = 0.08; 
    const noise = Math.sin(worldX * scale) + Math.cos(worldY * scale) + Math.sin((worldX + worldY) * scale * 0.5);
    
    if (noise > 2.4) {
        return 'RADIATION_BELT';
    }
    
    return null; 
}

/**
 * Determines the faction controlling a specific sector.
 * Uses Sector Coordinates (e.g. 0,0 or -20, 5), NOT World/Tile Coordinates.
 */

function getFactionAt(worldX, worldY) {
    // 1. Scale coordinates for "Macro Geography" (1 unit = 50 tiles)
    const macroX = worldX / 50; 
    const macroY = worldY / 50;

    const dist = Math.sqrt(macroX*macroX + macroY*macroY);
    
    // 2. Concord Core (8 macro units = 400 tiles safe zone)
    const safeRadius = (typeof FACTIONS !== 'undefined' && FACTIONS.CONCORD && FACTIONS.CONCORD.homeRadius) ? FACTIONS.CONCORD.homeRadius : 8;
    if (dist <= safeRadius) return 'CONCORD'; 

    // 3. Wavy Borders
    const noise = Math.sin(macroX * 0.12) + Math.cos(macroY * 0.18); 
    const distortion = noise * 12; 
    const effectiveX = macroX + distortion;

    // 4. Territory Check (DYNAMIC BORDERS)
    // Read the shifting borders directly from the save file!
    if (effectiveX < factionOffsets.ECLIPSE) return 'ECLIPSE';
    if (effectiveX > factionOffsets.KTHARR) return 'KTHARR';
    
    // 5. Islands
    const islandNoise = Math.sin(macroX * 0.4) * Math.cos(macroY * 0.4);
    if (islandNoise > 0.92) return 'ECLIPSE'; 
    if (islandNoise < -0.92) return 'KTHARR'; 

    return 'INDEPENDENT';
}

 function updateSectorState() {
     const newSectorX = Math.floor(playerX / SECTOR_SIZE);
     const newSectorY = Math.floor(playerY / SECTOR_SIZE);

     if (newSectorX !== currentSectorX || newSectorY !== currentSectorY) {
         currentSectorX = newSectorX;
         currentSectorY = newSectorY;
         currentSectorName = generateSectorName(currentSectorX, currentSectorY);

         // Run cleanup when entering a new sector
         performGarbageCollection();

         logMessage(`Now entering the ${currentSectorName} sector.`);

         const sectorKey = `${currentSectorX},${currentSectorY}`;
         if (!visitedSectors.has(sectorKey)) {
             visitedSectors.add(sectorKey);
             playerXP += XP_PER_NEW_SECTOR_DISCOVERY;
             logMessage(`<span style='color:#00DD00;'>New Sector Discovered! +${XP_PER_NEW_SECTOR_DISCOVERY} XP!</span>`);
             checkLevelUp();

             autoSaveGame();
         }
     }
 }

 // --- LORE PROGRESSION SYSTEM ---

function unlockLore(loreId) {
    // Redirect any old legacy triggers to the new, unified silent-capable function!
    unlockLoreEntry(loreId);
}

// --- Codex Functions ---

let currentCodexCategory = null;

// Placeholder Hooks for the buttons

function foundColony() { logMessage("<span style='color:var(--success)'>COLONY ESTABLISHED. Welcome to the frontier.</span>", true); }

 function findNearestStation(px, py) {
    let nearest = null;
    let minDist = Infinity;

    if (typeof LOCATIONS_DATA !== 'undefined') {
        for (const key in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[key];
            // Look for Hubs, Outposts, or Black Markets
            if (loc.type === '#' || loc.type === 'O' || loc.type === OUTPOST_CHAR_VAL) {
                const dist = Math.sqrt(Math.pow(px - loc.coords.x, 2) + Math.pow(py - loc.coords.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    nearest = { name: key, x: loc.coords.x, y: loc.coords.y };
                }
            }
        }
    }
    // Fallback to the tutorial start area if the universe is somehow empty
    return nearest || { name: "Starbase Alpha", x: MAP_WIDTH - 7, y: MAP_HEIGHT - 5 };
}

function activateDistressBeacon() {
    if (playerFuel > BASE_FUEL_PER_MOVE * 3) {
        logMessage("Fuel systems operational. Save the beacon for an actual emergency.");
        return;
    }
    if (currentCombatContext) {
        logMessage("Cannot broadcast distress signal during combat! Signal jammed.");
        return;
    }
    if (isAwaitingRescue) {
        logMessage("<span style='color:var(--warning)'>Rescue is already en route! Hold your position and wait (.).</span>");
        return;
    }

    // 1. Calculate Cost
    const standardFee = Math.max(100, Math.floor(playerCredits * 0.25));
    rescueFeePaid = standardFee;
    freebieUsed = false;

    if (playerCredits < standardFee) {
        rescueFeePaid = playerCredits;
        freebieUsed = true;
    }
    playerCredits -= rescueFeePaid;

    // 2. Find Destination & Dispatch Rat
    rescueTargetStation = findNearestStation(playerX, playerY);
    isAwaitingRescue = true;

    // Spawn the physical Fuel Rat at the station's coordinates
    if (typeof activeNPCs !== 'undefined') {
        activeNPCs.push({
            x: rescueTargetStation.x,
            y: rescueTargetStation.y,
            name: "Fuel Rats Rescue Tug",
            char: "R",
            color: "#FFAA00",
            state: "RESCUE",
            isFuelRat: true,
            desc: "A highly modified, extremely fast salvage tug. They have fuel, you don't."
        });
    }

    // 3. Calculate ETA for narrative
    const dist = Math.max(1, Math.abs(playerX - rescueTargetStation.x) + Math.abs(playerY - rescueTargetStation.y));
    const eta = Math.ceil(dist / 2); // Rats move 2 tiles per turn

    logMessage(`<span style='color:var(--warning)'>Distress Signal acknowledged!</span>`);
    logMessage(`"Fuel Rats" tug dispatched from ${rescueTargetStation.name}.`);
    logMessage(`ETA: ~${eta} system cycles. Hold position and wait (.).`);
    
    renderUIStats();
    render();
}

function executeRescueSequence() {
    isAwaitingRescue = false;
    
    // 1. Move Player to the Station
    playerX = rescueTargetStation.x;
    playerY = rescueTargetStation.y;
    
    // Give 15% fuel (enough to dock/fly around, but forces them to buy more)
    playerFuel = Math.max(playerFuel, Math.floor(MAX_FUEL * 0.15)); 

    // Clear the map cache so the new sector renders instantly
    chunkManager.loadedChunks = {}; 
    chunkManager.lastChunkKey = null;
    chunkManager.lastChunkRef = null;
    updateSectorState();

    // 2. Setup the game state for UI interaction
    changeGameState(GAME_STATES.GALACTIC_MAP);
    renderUIStats();
    
    // 3. Trigger the View-Screen Modal instead of a silent log drop
    showFuelRatRescueModal();
}

function showFuelRatRescueModal() {
    unlockLoreEntry("FACTION_FUEL_RATS");
    openGenericModal("INCOMING TRANSMISSION");
    
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    document.getElementById('genericModalList').innerHTML = ''; // Hide the list pane

    const isVIP = (playerFactionStanding['FUEL_RATS'] || 0) >= 5;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; animation: pulse-cyan 2s infinite;">🐀</div>
            <h3 style="color:var(--warning); margin-bottom:10px;">THE FUEL RATS</h3>
            <p style="color:var(--text-color); font-size:13px; line-height:1.6;">
                "We have fuel. You don't. Any questions?"
                <br><br>
                A battered tug drops out of subspace next to your stranded vessel. They deploy a refueling umbilicus.
                ${isVIP ? "<br><br><span style='color:var(--success); font-weight:bold;'>'Hey, I know you! You're good people. We're patching your hull integrity too, on the house.'</span>" : ""}
            </p>
        </div>
    `;

    // The tipping buttons!
    actionsEl.innerHTML = `
        <button class="action-button" onclick="executeFuelRatRescue(0)">ACCEPT RESCUE (Free)</button>
        <button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="executeFuelRatRescue(100)">TIP 100c (+1 Rep)</button>
        <button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="executeFuelRatRescue(500)">TIP 500c (+5 Rep)</button>
    `;
}

function executeFuelRatRescue(tipAmount) {
    if (playerCredits < tipAmount) {
        if (typeof showToast === 'function') showToast("Insufficient credits for tip!", "error");
        return;
    }
    
    playerCredits -= tipAmount;
    playerFuel = typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220;
    
    // Process the tip reputation
    if (tipAmount > 0) {
        const repGain = tipAmount === 500 ? 5 : 1;
        playerFactionStanding['FUEL_RATS'] = (playerFactionStanding['FUEL_RATS'] || 0) + repGain;
        logMessage(`<span style='color:var(--success)'>+${repGain} Fuel Rats Reputation</span>`);
    }

    // Process the VIP Perk: Free Hull Repair!
    if ((playerFactionStanding['FUEL_RATS'] || 0) >= 5) {
        playerHull = typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100;
        if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
    }

    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("TANKS REFILLED", "success");
    logMessage("<span style='color:var(--warning)'>[ RESCUE ] The Fuel Rats detach and jump away. Tanks are full.</span>");
    
    closeGenericModal();
    if (typeof renderUIStats === 'function') renderUIStats();
}

function renderFuelRatActions() {
    const actionsEl = document.getElementById('genericModalActions');
    
    let tipBtn = "";
    if (playerCredits >= 100) {
        tipBtn = `<button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text); box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);" onclick="tipFuelRats()">SEND TIP (100c)</button>`;
    }

    actionsEl.innerHTML = `
        ${tipBtn}
        <button class="action-button" onclick="closeFuelRatModal()">DISCONNECT & DOCK</button>
    `;
}

function tipFuelRats() {
    if (playerCredits >= 100) {
        playerCredits -= 100;
        
        // Future proofing: Increase faction rep here later!
        // playerFactionStanding["FUEL_RATS"] = (playerFactionStanding["FUEL_RATS"] || 0) + 1;
        
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        showToast("TIPPED FUEL RATS", "success");
        
        const detailEl = document.getElementById('genericDetailContent');
        detailEl.innerHTML += `
            <div style="margin: 15px; padding: 10px; background: rgba(0, 255, 0, 0.1); border-left: 3px solid var(--success); color: var(--success); font-size: 13px; animation: fadeIn 0.5s;">
                > Tip transferred. "Thanks for the creds, Commander. Fly safe out there."
            </div>
        `;
        
        renderUIStats();
        
        // Remove the tip button so they can't spam it (one tip is plenty)
        const actionsEl = document.getElementById('genericModalActions');
        actionsEl.innerHTML = `
            <button class="action-button" onclick="closeFuelRatModal()">DISCONNECT & DOCK</button>
        `;
    }
}

function closeFuelRatModal() {
    closeGenericModal();
    // Instead of forcing the station menu open directly, we trigger the standard tile interaction.
    // This perfectly cleans up the UI buttons, runs customs checks, and then safely opens the station view!
    handleInteraction();
}

function confirmSelfDestruct() {
    if (currentCombatContext) {
        logMessage("You're already dying! Just let them shoot you.");
        return;
    }
    showConfirmationModal(
        "WARNING: Initiating core overload will destroy your vessel and instantly terminate your current clone. PROCEED WITH SELF-DESTRUCT?",
        () => {
            playerHull = 0;
            if (typeof soundManager !== 'undefined') soundManager.playExplosion();
            triggerDamageEffect();
            // Wait half a second for the explosion effect before showing Game Over
            setTimeout(() => triggerGameOver("Intentional Core Overload (Self-Destruct)"), 500);
        }
    );
}

function playerWaitTurn() {
    logMessage("Systems cycling. You drift silently in the void...");
    
    // --- THE MAGIC HANDOFF ---
    // Pass 0.15 time (15x longer than a normal move), and flag isMovement as FALSE
    const combatStarted = processGameTick(0.15, false);

    // If waiting caused an enemy to catch us, stop!
    if (combatStarted) return; 
    
    // Risk of Ambush while waiting (especially bad if stranded!)
    if (Math.random() < PIRATE_ENCOUNTER_CHANCE) {
        if (typeof spawnPirateNearPlayer === "function") spawnPirateNearPlayer();
    }

    renderUIStats();
    render();
}

function handleCodexInput(key) {
    if (key === 'escape' || key === 'j') {
        toggleCodex(false);
    }
    // We always "handle" input when the codex is open
    return true;
}

 function handleMissionInput(key) {
     if (currentMissionContext.step === 'selectMission') {
         const selection = parseInt(key);
         if (!isNaN(selection) && selection > 0 && selection <= currentMissionContext.availableMissions.length) {
             displayMissionDetails(selection - 1);
         } else if (key === 'l' || key === 'escape') {
            currentMissionContext = null;
            handleInteraction();
        }
     } else if (currentMissionContext.step === 'confirmMission') {
         if (key === 'y') {
             if (!playerActiveMission) {
                 acceptMission();
             } else {
                 logMessage("Cannot accept: Another mission is already active.");
                 displayMissionBoard();
             }
         } else if (key === 'n' || key === 'l') {
             displayMissionBoard();
         }
     } else if (currentMissionContext.step === 'viewOnlyDetails' || currentMissionContext.step === 'noMissions') {
         if (key === 'l') {
             currentMissionContext = null;
             handleInteraction();
         }
     }
     // We always "handle" input when the mission board is open
     return true;
 }

 function handleOutfitInput(key) {
     if (currentOutfitContext.step === 'selectSlot') {
         if (key === '1') displayComponentsForSlot('weapon');
         else if (key === '2') displayComponentsForSlot('shield');
         else if (key === '3') displayComponentsForSlot('engine');
         else if (key === '4') displayComponentsForSlot('scanner');
         else if (key === '5') displayComponentsForSlot('utility');
         else if (key === 'l') {
             currentOutfitContext = null;
             handleInteraction();
         }
     } else if (currentOutfitContext.step === 'selectComponent') {
         const selection = parseInt(key);
         if (!isNaN(selection) && selection > 0 && selection <= currentOutfitContext.availableComponents.length) {
             buyComponent(currentOutfitContext.availableComponents[selection - 1].id);
         } else if (key === 'l' || key === 'escape') {
             displayOutfittingScreen();
         }
     }
     // We always "handle" input when the outfitter is open
     return true;
 }

function handleTradeInput(key) {
    // 1. Check for Exit Keys
    // We allow 'Escape' or 'l' (Leave) to close the modal instantly
    if (key === 'escape' || key === 'l') {
        closeTradeModal();
        return true;
    }

    // 2. Block Other Inputs
    // Since the actual trading (typing numbers, clicking buy) happens via 
    // HTML clicks and inputs, we don't need to handle keys here.
    // We simply return true to tell the game: 
    // "We are in a menu, do NOT move the ship with WASD."
    return true;
}

function handleCombatInput(key) {
     if (!currentCombatContext) return false;

     // Map keys to actions
     switch (key) {
         case 'z':
             activateDistressBeacon();
             return true;
         case 'f': // Fight
             handleCombatAction('fight');
             return true;
         case 'c': // Charge
             // Only allow if not already charging
             if (!playerIsChargingAttack) handleCombatAction('charge');
             else logMessage("Weapon already charged!");
             return true;
         case 'e': // Evade
             // Check fuel locally to give feedback, or just let handleCombatAction do it
             if (playerFuel >= EVASION_FUEL_COST) handleCombatAction('evade');
             else logMessage("Not enough fuel to evade!");
             return true;
         case 'r': // Run
             if (playerFuel >= RUN_FUEL_COST) handleCombatAction('run');
             else logMessage("Not enough fuel to run!");
             return true;
     }
     return false;
 }

 function handleGalacticMapInput(key) {
    // --- 1. DOCKED ACTIONS ---
    const currentLocation = getCombinedLocationData(playerX, playerY);
    if (currentLocation) {
        switch (key) {
            case 'b':
                openTradeModal('buy'); 
                return true;
            case 's':
                openTradeModal('sell'); 
                return true;
            case 'o':
                if (currentLocation.isMajorHub) {
                    displayOutfittingScreen();
                    return true;
                }
                break; 
            case 'k':
                if (currentLocation.isMajorHub) {
                    displayMissionBoard();
                    return true;
                }
                break; 
            case 'y':
                if (currentLocation.isMajorHub) {
                    displayShipyard();
                    return true;
                }
                break; 
            // Generic Interact Key
            case 'e': 
            case 'enter':
            case ' ': // <--- Browsers read spacebar as a literal space (' ')
                const currentTileForE = chunkManager.getTile(playerX, playerY);
                if (!currentTileForE) return true;
                
                // --- THE ROUTING ORDER ---
                
                // 1. Xerxes Intercept
                if (currentTileForE.name && currentTileForE.name.includes("Xerxes")) {
                    if (typeof openXerxesView === 'function') openXerxesView();
                }
                // 🚨 NEW: 2. Pirate Base Intercept
                else if (currentTileForE.isPirateBase) {
                    if (currentTileForE.cleared) {
                        logMessage("The outpost is a smoking ruin. Nothing left to salvage.");
                    } else if (typeof startOutpostRaid === 'function') {
                        startOutpostRaid(currentTileForE);
                    }
                }
                // 3. Station & Hub Routing
                else if (currentTileForE.isMajorHub || currentTileForE.char === OUTPOST_CHAR_VAL) {
                    if (typeof performCustomsScan === 'function' && currentTileForE.isMajorHub) {
                        if (!performCustomsScan()) return true; // Stop if they fail customs!
                    }
                    openStationView();
                } 
                // 4. Planetary Routing (Standard Planets)
                else if (currentTileForE.char === 'O' || (currentTileForE.name && currentTileForE.name.toLowerCase().includes("planet")) || currentTileForE.biome) {
                    openPlanetView(currentTileForE);
                } 
                return true;
            case 'c':
                // Fallback to Delivery Missions
                if (playerActiveMission && playerActiveMission.type === "DELIVERY") {
                    if (typeof handleCompleteDelivery === 'function') handleCompleteDelivery();
                    return true;
                }
                break;
            case 'g':
                if (playerActiveMission && playerActiveMission.isComplete && currentLocation.name === playerActiveMission.giver) {
                    grantMissionRewards();
                    return true;
                }
                if (playerActiveMission && playerActiveMission.type === "ACQUIRE" && !playerActiveMission.isComplete && currentLocation.name === playerActiveMission.giver) {
                    handleTurnInAcquire();
                    return true;
                }
                break; 
            case 'r':
                if (playerHull < MAX_PLAYER_HULL) {
                    repairShip();
                    return true;
                }
                break; 
            case 'v':
                visitCantina();
                return true;
            case 'l':
                handleInteraction();
                return true;
        }
    }

    // --- 2. IN-SPACE & GLOBAL ACTIONS ---
    let dx = 0, dy = 0;
    switch (key) {
        case 'w':
        case 'arrowup':
            dy = -1;
            break;
        case 's':
        case 'arrowdown':
            dy = 1;
            break;
        case 'a':
        case 'arrowleft':
            dx = -1;
            break;
        case 'd':
        case 'arrowright':
            dx = 1;
            break;

        case '`':
            openDevMenu();
            return true;
            
        case 'e':
        case 'E': {
            const currentTile = chunkManager.getTile(playerX, playerY);
            let tileChar = '.';
            if (typeof getTileChar === 'function') tileChar = getTileChar(currentTile);
            else if (currentTile && currentTile.char) tileChar = currentTile.char;

            triggerSensorPulse();

            if (tileChar === STAR_CHAR_VAL) {
                currentSystemData = generateStarSystem(playerX, playerY);
                if (typeof selectedPlanetIndex !== 'undefined') selectedPlanetIndex = -1;

                changeGameState(GAME_STATES.SYSTEM_MAP);
                logMessage(`Entering ${currentSystemData.name}...`);
                if (typeof showToast === 'function') showToast(`SYSTEM ORBIT:<br>${currentSystemData.name.toUpperCase()}`, "info");

            } else if (tileChar === 'D' || (typeof DERELICT_CHAR_VAL !== 'undefined' && tileChar === DERELICT_CHAR_VAL)) {
                // --- Let 'e' re-open the Derelict UI! ---
                if (typeof openDerelictView === 'function') openDerelictView();
                
            } else {
                // Fallback for empty space, anomalies, etc.
                setTimeout(() => {
                    if (typeof scanLocation === 'function') scanLocation();
                }, 300);
            }
            return true;
        }
        
        case 'v': { 
            const currentTile = chunkManager.getTile(playerX, playerY);
            let tileChar = '.';
            if (typeof getTileChar === 'function') tileChar = getTileChar(currentTile);
            else if (currentTile && currentTile.char) tileChar = currentTile.char;
            
            // 📡 FIRE THE BLUE RADAR RING!
            if (typeof triggerSensorPulse === 'function') triggerSensorPulse();
            
            if (tileChar === STAR_CHAR_VAL) {
                const starData = generateStarData(playerX, playerY);
                const starId = `${playerX}_${playerY}`;
                const scanKey = `STAR_SCAN_${starId}`;
                
                // Capture the scan status BEFORE evaluateStar() adds it to the list!
                const isFirstScan = typeof discoveredLocations !== 'undefined' && !discoveredLocations.has(scanKey);
                
                if (typeof soundManager !== 'undefined') soundManager.playUIHover();
                evaluateStar(starData, starId);

                // Only trigger engrams on the first scan
                if (isFirstScan) {
                    // 🚨 Safely check for VOID_DIVER whether it's a Set or an Array
                    const hasVoidDiver = typeof playerPerks !== 'undefined' && 
                        ((playerPerks.has && playerPerks.has('VOID_DIVER')) || 
                         (playerPerks.includes && playerPerks.includes('VOID_DIVER')));

                    const engramChance = hasVoidDiver ? 0.25 : 0.10;
                    
                    if (Math.random() < engramChance) {
                        playerCargo['ENCRYPTED_ENGRAM'] = (playerCargo['ENCRYPTED_ENGRAM'] || 0) + 1;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        logMessage("<span style='color:#DDA0DD'>[ SENSORS ] Anomaly detected in the stellar corona. Tractor beam recovered 1x Encrypted Engram!</span>");
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                    }
                }
            } else {
                logMessage("Deep scanners read nothing but the void.");
            }
            return true;
        }

        // --- HOTKEY: SMART NAV-COMPUTER PING (N) ---
        case 'n': 
        case 'N': {
            let targetPoint = null;
            let targetLabel = "";
            let targetColor = "var(--accent-color)";

            // 1. Prioritize Emergency Rescues
            if (typeof isAwaitingRescue !== 'undefined' && isAwaitingRescue && rescueTargetStation) {
                targetPoint = rescueTargetStation;
                targetLabel = "Fuel Rat Rescue Tug";
                targetColor = "var(--warning)";
            } 
            // 2. Prioritize Bounties
            else if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty) {
                targetPoint = { x: playerActiveBounty.x, y: playerActiveBounty.y, name: playerActiveBounty.targetName };
                targetLabel = "Bounty Target";
                targetColor = "var(--danger)";
            } 
            // 3. Prioritize Active Delivery Missions
            else if (typeof playerActiveMission !== 'undefined' && playerActiveMission && playerActiveMission.type === "DELIVERY" && !playerActiveMission.isComplete) {
                const destName = playerActiveMission.objectives[0].destinationName;
                if (LOCATIONS_DATA[destName]) {
                    targetPoint = { x: LOCATIONS_DATA[destName].coords.x, y: LOCATIONS_DATA[destName].coords.y, name: destName };
                    targetLabel = "Delivery Destination";
                    targetColor = "var(--gold-text)";
                }
            } 
            // 4. Prioritize Mission Turn-ins
            else if (typeof playerActiveMission !== 'undefined' && playerActiveMission && playerActiveMission.isComplete) {
                if (LOCATIONS_DATA[playerActiveMission.giver]) {
                    targetPoint = { x: LOCATIONS_DATA[playerActiveMission.giver].coords.x, y: LOCATIONS_DATA[playerActiveMission.giver].coords.y, name: playerActiveMission.giver };
                    targetLabel = "Contract Turn-In";
                    targetColor = "var(--success)";
                }
            } 
            // 5. Fallback to Nearest Station
            else {
                targetPoint = findNearestStation(playerX, playerY);
                targetLabel = "Nearest Safe Harbor";
            }

            // Output the ping to the log!
            if (targetPoint) {
                let dirY = targetPoint.y < playerY ? "North" : targetPoint.y > playerY ? "South" : "";
                let dirX = targetPoint.x > playerX ? "East" : targetPoint.x < playerX ? "West" : "";
                let direction = `${dirY}${dirX}` || "Here";
                
                const dist = Math.floor(Math.sqrt(Math.pow(targetPoint.x - playerX, 2) + Math.pow(targetPoint.y - playerY, 2)));
                
                logMessage(`<span style='color:${targetColor}'>[ NAV-COMPUTER ]</span> ${targetLabel}: <b>${targetPoint.name}</b> is approx ${dist} units <b>${direction}</b>.`);
                if (typeof soundManager !== 'undefined') soundManager.playScan();
                
                // Fire the visual blue pulse!
                if (typeof triggerSensorPulse === 'function') triggerSensorPulse();
            } else {
                logMessage("<span style='color:var(--item-desc-color)'>[ NAV-COMPUTER ] No significant targets detected in this quadrant.</span>");
            }
            return true;
        }
        
        case 'h':
            if (typeof scoopHydrogen === 'function') scoopHydrogen();
            return true;
        case 'm':
            const tile = chunkManager.getTile(playerX, playerY);
            if (getTileChar(tile) === ASTEROID_CHAR_VAL) {
                if (tile && tile.mined) {
                    if (typeof showToast === 'function') showToast("ASTEROID DEPLETED", "info");
                    logMessage("Scanners show this asteroid has already been stripped bare.", "color:var(--item-desc-color)");
                } else {
                    if (typeof startMiningMiniGame === 'function') startMiningMiniGame();
                }
            }
            return true;
        case 'j':
            if (typeof toggleCodex === 'function') toggleCodex(true);
            return true;
        case 'i':
            if (typeof openCargoModal === 'function') openCargoModal();
            return true;
            
        // --- OBSERVATORY HOTKEY (O) ---
        case 'o':
        case 'O':
            if (document.getElementById('genericModalOverlay').style.display !== 'flex') {
                if (typeof openObservatory === 'function') openObservatory();
            }
            return true;
            
        case 'p':
        case 'P':
            // Active Sensor Ping
            fireSensorPing();
            return true;

        case 'u':
        case 'U':
            if (typeof openCraftingMenu === 'function') openCraftingMenu();
            return true;
            
        case 't': { 
            const tileForWormhole = chunkManager.getTile(playerX, playerY);
            let whType = '';
            if (typeof getTileType === 'function') whType = getTileType(tileForWormhole);
            
            if (whType === 'wormhole' && typeof traverseWormhole === 'function') traverseWormhole();
            else logMessage("No wormhole here.");
            return true;
        }
        
        case 'z': 
            activateDistressBeacon();
            return true;
        case 'x':
            confirmSelfDestruct();
            return true;
        case '.': 
            if (typeof playerWaitTurn === 'function') playerWaitTurn();
            return true;
            
        case 'f6':
            if (typeof saveGame === 'function') saveGame();
            return true;
        case 'f7':
            if (typeof loadGame === 'function') loadGame();
            return true;
        default:
            if (dx === 0 && dy === 0) return false; 
    }

    if (dx !== 0 || dy !== 0) {
        if (typeof movePlayer === 'function') movePlayer(dx, dy);
    }
    return true; 
}

 function handleSystemMapInput(key) {
     if (key === 'e') {
         if (selectedPlanetIndex !== -1) {
             examinePlanet(selectedPlanetIndex);
         } else {
             logMessage("No planet selected. Click one to select it.");
         }
     } else if (key === 'l' || key === 'escape') {
         // Use the centralized function
         changeGameState(GAME_STATES.GALACTIC_MAP);

         selectedPlanetIndex = -1;
         handleInteraction();
     }
     return true;
 }

 function handlePlanetViewInput(key) {
     if (key === 'l') {
         returnToOrbit();
     }
     // We always "handle" input in the planet view
     return true;
 }

 function fireSensorPing() {
    // 1. Costs Fuel
    if (playerFuel < 5) {
        if (typeof showToast === 'function') showToast("INSUFFICIENT FUEL", "error");
        return;
    }
    playerFuel -= 5;
    
    // 2. Visual/Audio Feedback
    if (typeof soundManager !== 'undefined') soundManager.playScan();
    triggerSensorPulse(); // The cool blue expanding ring!
    
    // 3. Scan the grid!
    // Base radius is 5, but the Long Range Sensors perk boosts it to 10!
    let scanRadius = 5;
    if (typeof playerPerks !== 'undefined' && 
        ((playerPerks.has && playerPerks.has('LONG_RANGE_SENSORS')) || 
         (playerPerks.includes && playerPerks.includes('LONG_RANGE_SENSORS')))) {
        scanRadius = 10;
    }

    let foundSomething = false;
    let scanLog = `<span style='color:var(--accent-color); font-weight:bold;'>[ ACTIVE PING ]</span> Sector scan complete. Fuel consumed (-5).<br>`;

    for (let dy = -scanRadius; dy <= scanRadius; dy++) {
        for (let dx = -scanRadius; dx <= scanRadius; dx++) {
            if (dx === 0 && dy === 0) continue; // Don't scan yourself
            
            const scanX = playerX + dx;
            const scanY = playerY + dy;
            const tile = chunkManager.getTile(scanX, scanY);
            const char = getTileChar(tile);
            
            // What are we looking for?
            if (char === DERELICT_CHAR_VAL) {
                foundSomething = true;
                const dirY = dy < 0 ? "North" : "South";
                const dirX = dx > 0 ? "East" : "West";
                scanLog += `> Anomalous signature (Derelict): ${Math.abs(dy)} ${dirY}, ${Math.abs(dx)} ${dirX}.<br>`;
            }
            if (char === WORMHOLE_CHAR_VAL) {
                foundSomething = true;
                scanLog += `> <span style="color:#FFB800;">Gravimetric Shear (Wormhole)</span> detected nearby.<br>`;
            }
            if (tile && tile.isPirateBase && !tile.cleared) {
                foundSomething = true;
                scanLog += `> <span style="color:var(--danger);">WARNING: heavily shielded compound detected nearby.</span><br>`;
            }
        }
    }

    if (!foundSomething) {
        scanLog += "> Only cosmic background radiation detected.";
    }
    
    logMessage(scanLog);
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
}

// --- INPUT HANDLING WITH SMOOTHING ---
let lastInputTime = 0;
const INPUT_DELAY = 120; 

document.addEventListener('keydown', function(event) {
    // Instant Rejection
    // If the key is being held down (repeating), ignore it immediately.
    // This stops the browser from running the massive Switch statement 60x a second!
    if (event.repeat) return; 

    const now = Date.now();
    if (now - lastInputTime < INPUT_DELAY) {
        return; // Ignore input if too fast (key mashing)
    }

    // --- 0. BLOCK INPUT IF TYPING ---
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        // Allow Enter and Escape to pass through for specific UI handlers (like the Spire hack!)
        if (event.key === 'Enter' || event.key === 'Escape') {
            // Let it pass through
        } else {
            return; // Stop game from processing movement/UI keys while typing
        }
    }
    
    const key = event.key.toLowerCase();

    // 1. TIMING CHECK (The Smoother)
    const isMovementKey = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);

    if (isMovementKey && (now - lastInputTime < INPUT_DELAY)) {
        return; // Ignore input if too fast
    }

    // --- DEV CHEATS ---
    if (key === '$') {
        playerCredits += 50000;
        playerHull = MAX_PLAYER_HULL;
        logMessage("<span style='color:#00FF00'>DEV OVERRIDE: Funds injected, Hull stabilized.</span>");
        if (typeof renderUIStats === 'function') renderUIStats();
        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        return;
    }

    // --- QoL: DOCK / INTERACT HOTKEY ---
    // We removed 'e' from here so it can pass through to your native contextual menus!
    // 'Enter' remains as a global backup.
    if (key === 'enter' && currentGameState === GAME_STATES.GALACTIC_MAP && event.target.tagName !== 'INPUT') {
        if (typeof reEnterCurrentTile === 'function') {
            reEnterCurrentTile();
        }
        return;
    }

    if (currentGameState === GAME_STATES.TITLE_SCREEN) return;

    let inputHandled = false;

    // --- 2. Top-level "Blocking" Contexts (Menus, Overlays, etc.) ---
    const genericModal = document.getElementById('genericModalOverlay');

    if (genericModal && genericModal.style.display === 'flex') {
        if (key === 'escape') closeGenericModal();
        event.preventDefault(); // Stop standard browser behaviors
        return; // Halt all game input!
    }
    if (typeof codexOverlayElement !== 'undefined' && codexOverlayElement.style.display === 'flex') {
        inputHandled = handleCodexInput(key);
    } else if (typeof currentOutfitContext !== 'undefined' && currentOutfitContext && currentOutfitContext.step === 'viewingCargo') {
        if (key === 'escape' || key === 'i') closeCargoModal();
        inputHandled = true;
    } else if (typeof currentMissionContext !== 'undefined' && currentMissionContext) {
        inputHandled = handleMissionInput(key);
    } else if (typeof currentOutfitContext !== 'undefined' && currentOutfitContext) {
        inputHandled = handleOutfitInput(key);
    } else if (typeof currentTradeContext !== 'undefined' && currentTradeContext) {
        inputHandled = handleTradeInput(key);
    } 
    // (Fixed: Deleted the ghost Shipyard context check that was causing errors!)

    // --- 3. Game State Contexts ---
    else if (currentGameState === GAME_STATES.COMBAT) {
        inputHandled = handleCombatInput(key);
    } else if (currentGameState === GAME_STATES.GALACTIC_MAP) {
        inputHandled = handleGalacticMapInput(key);
    } else if (currentGameState === GAME_STATES.SYSTEM_MAP) {
        inputHandled = handleSystemMapInput(key);
    } else if (currentGameState === GAME_STATES.PLANET_VIEW) {
        inputHandled = handlePlanetViewInput(key);
    }

    // --- 4. Finalize ---
    if (inputHandled) {
        event.preventDefault();
        // Only update the timer if we actually moved
        if (isMovementKey) lastInputTime = now;
    }
});

 // --- Theme Toggle Function ---
function toggleTheme() {
     const body = document.body;
     const isLight = body.classList.toggle('light-mode');
     const themeBtn = document.getElementById('themeButton');

     // Update button text
     themeBtn.textContent = isLight ? "Dark Mode" : "Light Mode";

     // Save preference
     localStorage.setItem('wayfinderTheme', isLight ? 'light' : 'dark');

     // --- UPDATE CACHED COLOR ---
     cachedAccentColor = getThemeColor('--accent-color', '#00E0E0');

     // --- FORCE RENDER IMMEDIATELY ---
     if (typeof render === 'function') {
         render();
     }
 }

// --- INITIALIZATION HELPERS ---

// --- GLOBALS FOR VIEWPORT ---
let VIEWPORT_WIDTH_TILES = MAP_WIDTH;
let VIEWPORT_HEIGHT_TILES = MAP_HEIGHT;

function setupCanvas() {
    gameCanvas = document.getElementById('gameCanvas');
    ctx = gameCanvas.getContext('2d');

    // We wrap the logic in a sub-function so we can call it on resize!
    function updateCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile stays locked to a portrait-friendly view
            // Reduced width to 11 to fit standard phones (11 * 32px = 352px)
            VIEWPORT_WIDTH_TILES = 11; 
            VIEWPORT_HEIGHT_TILES = 15;
        } else {
            // --- DYNAMIC DESKTOP VIEWPORT ---
            // Calculate how many tiles can fit in the available screen space.
            // We subtract 100px for side margins, and 250px for the Top HUD and Bottom Deck.
            let tilesX = Math.floor((window.innerWidth - 100) / TILE_SIZE);
            let tilesY = Math.floor((window.innerHeight - 250) / TILE_SIZE);

            // Ensure the grid is always an ODD number so the player is perfectly centered
            if (tilesX % 2 === 0) tilesX--;
            if (tilesY % 2 === 0) tilesY--;

            // Set safe minimums so the map doesn't break if the window is tiny
            VIEWPORT_WIDTH_TILES = Math.max(21, tilesX); 
            VIEWPORT_HEIGHT_TILES = Math.max(11, tilesY);
        }

        // Calculate exact pixel dimensions
        const physicalWidth = VIEWPORT_WIDTH_TILES * TILE_SIZE;
        const physicalHeight = VIEWPORT_HEIGHT_TILES * TILE_SIZE;

        // 1. Set Internal Canvas Resolution
        gameCanvas.width = physicalWidth * dpr;
        gameCanvas.height = physicalHeight * dpr;
        
        // 2. Set CSS Display Size (Prevents weird stretching/squishing)
        gameCanvas.style.width = `${physicalWidth}px`;
        gameCanvas.style.height = `${physicalHeight}px`;

        // 3. MAGIC TRICK: Tell CSS exactly how wide the map is!
        document.documentElement.style.setProperty('--canvas-width', `${physicalWidth}px`);

        // Apply rendering contexts
        ctx.scale(dpr, dpr);
        ctx.font = `bold ${TILE_SIZE}px 'Roboto Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; 
        gameCanvas.style.imageRendering = "pixelated";

        // Force a redraw if we resize while looking at the map
        if (typeof currentGameState !== 'undefined' && currentGameState === GAME_STATES.GALACTIC_MAP) {
            render();
        }
    }

    // Run it immediately on load
    updateCanvasSize();

    // Re-run it automatically whenever the user resizes their browser window!
    window.addEventListener('resize', updateCanvasSize);
}

function setRandomPlayerPortrait() {
    const portraitEl = document.getElementById('playerPortrait'); // Ensure your HTML <img> has this ID
    if (portraitEl && PLAYER_PORTRAITS.length > 0) {
        const randomIndex = Math.floor(Math.random() * PLAYER_PORTRAITS.length);
        portraitEl.src = PLAYER_PORTRAITS[randomIndex];
    }
}

function initializeDOMElements() {

    menuLevelElement = document.getElementById('menuLevel');
    menuXPElement = document.getElementById('menuXP');
    menuShipElement = document.getElementById('menuShip');
    menuRepElement = document.getElementById('menuRep');

    fuelBarElement = document.getElementById('fuelBar');
    shieldBarElement = document.getElementById('shieldBar');
    hullBarElement = document.getElementById('hullBar');

    fuelValElement = document.getElementById('fuelVal');
    shieldValElement = document.getElementById('shieldVal');
    hullValElement = document.getElementById('hullVal');

    hudLevelStatElement = document.getElementById('hudLevelStat');
    hudXpStatElement = document.getElementById('hudXpStat');
    statusOverlayElement = document.getElementById('statusOverlay');

    // Global Click Listener for UI Sounds
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            soundManager.playUIClick();
        }
    });

    // 1. Map ID References
    messageAreaElement = document.getElementById('messageArea');
    fuelStatElement = document.getElementById('fuelStat');
    creditsStatElement = document.getElementById('creditsStat');
    cargoStatElement = document.getElementById('cargoStat');
    shieldsStatElement = document.getElementById('shieldsStat');
    hullStatElement = document.getElementById('hullStat');
    sectorNameStatElement = document.getElementById('sectorNameStat');
    sectorCoordsStatElement = document.getElementById('sectorCoordsStat');
    levelXpStatElement = document.getElementById('levelXpStat');
    shipClassStatElement = document.getElementById('shipClassStat');
    notorietyStatElement = document.getElementById('notorietyStat');
    codexOverlayElement = document.getElementById('codexOverlay');
    codexCategoriesElement = document.getElementById('codexCategories');
    codexEntriesElement = document.getElementById('codexEntries');
    codexEntryTextElement = document.getElementById('codexEntryText');
    stardateStatElement = document.getElementById('stardateStat');
    
    // 2. Button Listeners & Start Game Logic
    saveButtonElement = document.getElementById('saveButton');
    if (saveButtonElement) saveButtonElement.onclick = saveGame;

    // --- Define variables BEFORE using them ---
    const seedInput = document.getElementById('seedInput');
    const startButton = document.getElementById('startButton');

    if (startButton) {
        startButton.addEventListener('click', () => {
            soundManager.init(); // Initialize Audio Context
            initializeGame(); 
            startGame(seedInput ? seedInput.value : "");
            hideTitleScreen();
        });
    }

    createLevelUpDOM();

    function createLevelUpDOM() {
    // Create the overlay container if it doesn't exist
    if (!document.getElementById('levelUpOverlay')) {
        const div = document.createElement('div');
        div.id = 'levelUpOverlay';
        // Note: Styles are now handled in style.css!
        div.innerHTML = `
            <div style="text-align:center; margin-bottom:30px;">
                <h1 style="color:#FFD700; font-family:'Orbitron', sans-serif; font-size:40px; margin:0; text-shadow: 0 0 10px #FFaa00;">LEVEL UP!</h1>
                <p style="color:#FFF; font-family:'Roboto Mono', monospace;">Select a specialized upgrade for your captain.</p>
            </div>
            <div id="perkCardsContainer" style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;"></div>
        `;
        if (document.body) {
            document.body.appendChild(div);
        } else {
            window.addEventListener('DOMContentLoaded', () => document.body.appendChild(div));
        }
    }
}
    
    // Enter key support for seed input
    if (seedInput) {
        seedInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                soundManager.init(); // Initialize Audio Context
                initializeGame();
                startGame(seedInput.value);
                hideTitleScreen();
            }
        });
    }

    const soundBtn = document.getElementById('soundButton');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            const isEnabled = soundManager.toggleMute();
            soundBtn.textContent = isEnabled ? "Mute Audio" : "Enable Audio";
        });
    }

     // Nav-Computer Toggle Logic
    window.navAssistEnabled = localStorage.getItem('wayfinder_nav_assist') !== 'false'; // Default to true
    const navBtn = document.getElementById('navToggleButton');
    
    if (navBtn) {
        // Set initial button text based on saved preference
        navBtn.textContent = window.navAssistEnabled ? "Disable Nav-Assist" : "Enable Nav-Assist";
        
        navBtn.addEventListener('click', () => {
            window.navAssistEnabled = !window.navAssistEnabled;
            localStorage.setItem('wayfinder_nav_assist', window.navAssistEnabled ? 'true' : 'false');
            navBtn.textContent = window.navAssistEnabled ? "Disable Nav-Assist" : "Enable Nav-Assist";
            
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
            if (typeof render === 'function') render(); // Force map to hide/show the arrow instantly
        });
    }

    // --- Mobile D-Pad Listeners (Safe Version) ---
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    if (btnUp) {
        // Shared flag to prevent double-firing (Touch + Click)
        let lastTouchTime = 0;

        const bindMove = (btn, key) => {
            // 1. Handle Touch (Instant response)
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Stop zooming/scrolling
                lastTouchTime = Date.now(); // Record time
                
                if (currentGameState === GAME_STATES.GALACTIC_MAP) {
                    handleGalacticMapInput(key);
                    if (typeof triggerHaptic === 'function') triggerHaptic(10);
                }
            }, { passive: false });

            // 2. Handle Mouse Click (Desktop/Fallback)
            btn.addEventListener('click', (e) => {
                // If a touch event happened less than 500ms ago, ignore this click
                // (This prevents the "Ghost Click" that happens after a tap)
                if (Date.now() - lastTouchTime < 500) return;

                if (currentGameState === GAME_STATES.GALACTIC_MAP) {
                    handleGalacticMapInput(key);
                }
            });
        };

        bindMove(btnUp, 'w');
        bindMove(btnDown, 's');
        bindMove(btnLeft, 'a');
        bindMove(btnRight, 'd');
    }

    const btnWait = document.getElementById('btnWait');
    if (btnWait) {
        btnWait.addEventListener('click', (e) => {
            if (currentGameState === GAME_STATES.GALACTIC_MAP) {
                logMessage("Holding position. Systems recharging...");
                advanceGameTime(0.15); 
                render();
            }
        });
    }
    
    const loadBtn = document.getElementById('loadButton');
    if (loadBtn) loadBtn.onclick = loadGame; 

    document.getElementById('themeButton').addEventListener('click', toggleTheme);
    document.getElementById("codexCloseButton").addEventListener("click", () => toggleCodex(false));
    
    const closeTradeBtn = document.getElementById('closeTradeBtn');
    if(closeTradeBtn) closeTradeBtn.addEventListener('click', closeTradeModal);

    const closeCargoBtn = document.getElementById('closeCargoBtn');
    if(closeCargoBtn) closeCargoBtn.addEventListener('click', closeCargoModal);

    // 4. System Menu Toggle
    const menuBtn = document.getElementById('menuToggle');
    const sysMenu = document.getElementById('systemMenu');
    if (menuBtn && sysMenu) {
        menuBtn.addEventListener('click', () => {
            sysMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!sysMenu.contains(e.target) && e.target !== menuBtn) {
                sysMenu.classList.add('hidden');
            }
        });
    }

    // 5. Save on Window Close
    window.addEventListener('beforeunload', () => {
        if (typeof currentGameState !== 'undefined' && 
            currentGameState !== 'title_screen' && 
            currentGameState !== 'GAME_OVER') { 
            performSave('AUTO'); // Safely pass the correct string
        }
    });

    // PFP Logic
    const pfpImage = document.getElementById('pfpImage');
    const prevPfpBtn = document.getElementById('prevPfpBtn');
    const nextPfpBtn = document.getElementById('nextPfpBtn');

    // NEW: Start with a random index instead of 0
    let currentPfpIndex = Math.floor(Math.random() * PLAYER_PORTRAITS.length);

    function updatePfp() {
        // Use the list from config.js
        playerPfp = PLAYER_PORTRAITS[currentPfpIndex];
        if(pfpImage) pfpImage.src = playerPfp;
    }
    
    if (prevPfpBtn) {
        prevPfpBtn.addEventListener('click', () => {
            currentPfpIndex = (currentPfpIndex - 1 + PLAYER_PORTRAITS.length) % PLAYER_PORTRAITS.length;
            updatePfp();
        });
    }
    
    if (nextPfpBtn) {
        nextPfpBtn.addEventListener('click', () => {
            currentPfpIndex = (currentPfpIndex + 1) % PLAYER_PORTRAITS.length;
            updatePfp();
        });
    }
    
    // Apply the random face immediately
    updatePfp();
}

function closeTradeModal() {
    // Just redirect to the generic closer, since Trade now uses the Generic Modal
    closeGenericModal();
}

// ==========================================
// === SAVE SYSTEM & AUTO-LOGIN LOGIC ===
// ==========================================

let currentCampaignId = null;

// --- START GAME (Starts Autosave Timer) ---
function startGame(seedString) {
     playerName = document.getElementById('playerNameInput').value || "Captain";

     // Generate a unique ID for this specific character/playthrough
     currentCampaignId = "cmp_" + Date.now();

     if (seedString && !isNaN(parseInt(seedString))) {
         WORLD_SEED = parseInt(seedString);
     } else if (seedString) {
         let hash = 0;
         for (let i = 0; i < seedString.length; i++) {
             const char = seedString.charCodeAt(i);
             hash = ((hash << 5) - hash) + char;
             hash |= 0;
         }
         WORLD_SEED = hash;
     } else {
         WORLD_SEED = Math.floor(Math.random() * 99999999);
     }

     const titleOverlay = document.getElementById('titleOverlay');
     titleOverlay.style.opacity = '0';
     setTimeout(() => { titleOverlay.style.display = 'none'; }, 500);

     currentGameState = GAME_STATES.GALACTIC_MAP;

     logMessage(`World Seed: ${WORLD_SEED}`);
     logMessage('Welcome, Wayfinder! Use WASD to move.');

     // --- Start Autosave Timer ---
     if (autoSaveInterval) clearInterval(autoSaveInterval);
     autoSaveInterval = setInterval(autoSaveGame, AUTOSAVE_DELAY);
     autoSaveGame(); // Initial save so "Continue" works immediately
 }

// --- SAVE FUNCTIONS ---

// 1. Manual Save
function saveGame() {
    performSave('MANUAL');
    logMessage("Game Saved Manually.");
    showToast("GAME PROGRESS SAVED", "success");
}

// 2. Auto Save
function autoSaveGame() {
    if (currentGameState === GAME_STATES.TITLE_SCREEN || playerHull <= 0) return;
    performSave('AUTO');
    console.log("Autosave complete.");
}

// 3. Shared Save Logic (Multi-Profile Support)
function performSave(saveType) {
    if (typeof performGarbageCollection === 'function') performGarbageCollection();
    if (!currentCampaignId) currentCampaignId = "cmp_" + Date.now();
    const safeSaveType = (saveType === 'MANUAL') ? 'MANUAL' : 'AUTO';

    const saveFile = {
        version: GAME_VERSION,
        realTimestamp: Date.now(),
        campaignId: currentCampaignId, 
        saveType: safeSaveType,
        
        // 🚨 NEW: Save the entire GameState object instantly!
        coreState: GameState, 
        
        // Metadata / Collections
        playerName, playerPfp, playerCrew,
        playerPerks: Array.from(playerPerks),
        concordEscortJumps: window.concordEscortJumps || 0, 
        playerHasColonyCharter: typeof playerHasColonyCharter !== 'undefined' ? playerHasColonyCharter : false,
        playerColonies: typeof playerColonies !== 'undefined' ? playerColonies : {},
        playerActiveMission, playerActiveBounty, currentStationBounties, activeMarketTrend, 
        mystery_wayfinder_progress, mystery_wayfinder_finalLocation,
        mystery_first_nexus_location, mystery_nexus_activated, xerxesPuzzleLevel,
        worldStateDeltas: worldStateDeltas || {},
        activeProbes: window.activeProbes || [],
        
        // Sets
        visitedSectors: Array.from(visitedSectors),
        scannedObjectTypes: Array.from(scannedObjectTypes),
        discoveredLocations: Array.from(discoveredLocations),
        playerCompletedMissions: Array.from(playerCompletedMissions),
        discoveredLoreEntries: Array.from(discoveredLoreEntries)
    };

    try {
        const slotPrefix = safeSaveType === 'MANUAL' ? 'wayfinder_manual_' : 'wayfinder_auto_';
        localStorage.setItem(slotPrefix + currentCampaignId, JSON.stringify(saveFile));
    } catch (error) {
        // Did we hit the 5MB browser limit?
        if (error.name === 'QuotaExceededError' || error.message.toLowerCase().includes('quota')) {
            console.warn("Storage quota exceeded! Forcing aggressive garbage collection...");
            logMessage("<span style='color:var(--warning)'>WARNING: Memory banks full. Purging old navigational data to save game...</span>");
            
            // Force aggressive purge of non-critical tiles
            const keys = Object.keys(worldStateDeltas);
            
            // Sort by oldest interaction time so we delete the oldest memories first
            keys.sort((a, b) => (worldStateDeltas[a].lastInteraction || 0) - (worldStateDeltas[b].lastInteraction || 0));
            
            let purged = 0;
            for(let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const delta = worldStateDeltas[key];
                
                // Never delete critical flags (Colonies, Puzzles, Wormholes)
                if (key === 'CRAFTING_BONUSES' || delta.activated || delta.isUnique || delta.hasColony || delta.isDiscoveredWormhole) continue;
                
                delete worldStateDeltas[key];
                purged++;
                
                // Delete up to 50% of stored tiles to free up massive space
                if (purged > keys.length / 2) break; 
            }
            
            try { 
                // Try saving one more time with the slimmed-down data
                saveFile.worldStateDeltas = worldStateDeltas;
                localStorage.setItem(slotPrefix + currentCampaignId, JSON.stringify(saveFile));
                logMessage("<span style='color:var(--success)'>Emergency purge successful. Game saved.</span>");
            } catch (e) {
                console.error("Emergency save failed:", e);
                logMessage("<span style='color:var(--danger)'>CRITICAL ERROR: Save failed. Storage completely full.</span>");
            }
        } else {
            console.error("Save failed:", error);
            logMessage("<span style='color:var(--danger)'>Save Failed: Unknown Error</span>");
        }
    }
}

// --- GAME OVER LOGIC ---

function triggerGameOver(reason) {
    // 1. Stop the game loop / interaction
    changeGameState(GAME_STATES.GAME_OVER);
    
    // 2. Calculate Penalty (10% XP and 25% Credits)
    const creditPenalty = Math.floor(playerCredits * 0.25);
    
    // 3. Update UI
    document.getElementById('deathReason').innerHTML = `Cause of Death: <span style="color:#ff5555">${reason}</span>`;
    document.getElementById('deathLevel').textContent = playerLevel;
    document.getElementById('deathCreditPenalty').textContent = `-${creditPenalty}c`;
    
    // 4. Show Screen
    document.getElementById('gameOverOverlay').style.display = 'flex';
}

function respawnPlayer() {
    // 1. Apply Penalty
    playerCredits = Math.floor(playerCredits * 0.75);
    playerXP = Math.max(0, playerXP - 100); 

    // 2. Reset Stats
    playerHull = MAX_PLAYER_HULL;
    playerShields = MAX_SHIELDS;
    playerFuel = MAX_FUEL;

    playerAbilityCooldown = 0;

    // 3. Move to Starbase Alpha (Safe Zone)
    // We use the coordinates defined in your locations.js
    playerX = MAP_WIDTH - 7;
    playerY = MAP_HEIGHT - 5;
    
    // --- RESET WORLD CACHE ---
    // This forces the map to stop looking at your death-site and load the Starbase area
    chunkManager.loadedChunks = {}; 
    chunkManager.lastChunkKey = null;
    chunkManager.lastChunkRef = null;

    currentSectorX = Math.floor(playerX / SECTOR_SIZE);
    currentSectorY = Math.floor(playerY / SECTOR_SIZE);
    currentSectorName = generateSectorName(currentSectorX, currentSectorY);

    // 4. Clear Enemies & Combat State 
    activeEnemies = []; // Wipe the galaxy map clean of old pursuers
    activeNPCs = [];    // Wipe neutral traffic from the death site
    currentCombatContext = null; // Tell the game the fight is over!

    // 5. Reset UI and State
    document.getElementById('gameOverOverlay').style.display = 'none';
    
    // Ensure we switch back to the map state
    changeGameState(GAME_STATES.GALACTIC_MAP);
    
    logMessage(`<span style="color:#00FF00">CLONE ACTIVATED. Welcome back, Commander.</span>`);
    
    // Force immediate render and interaction check
    handleInteraction(); 
    render();
    
    saveGame(); // Auto-save on respawn

    // Stumble Protection: Prevent accidental movement for 500ms after transition
    lastInputTime = Date.now() + 500;
}

function quitToTitle() {
    location.reload(); // Simplest way to "Quit"
}

function addMilestone(message) {
    if (typeof currentGameDate === 'undefined') return;
    const dateStr = currentGameDate.toFixed(2);
    GameState.player.milestones.unshift(`[SD ${dateStr}] ${message}`); // Newest at top
    // Keep it from getting too massive in the save file
    if (GameState.player.milestones.length > 100) GameState.player.milestones.pop();
}

// --- LOAD LOGIC ---

function loadGame() {
    // Look for the current campaign's specific manual save first
    let savedString = localStorage.getItem('wayfinder_manual_' + currentCampaignId);

    // Legacy fallback just in case
    if (!savedString) savedString = localStorage.getItem('wayfinderSaveData');

    if (savedString) {
        loadGameData(savedString);
    } else {
        logMessage("No manual save found for this campaign.");
    }
}

// --- LOAD LOGIC ---

function loadGameData(jsonString) {
    if (!jsonString) return;

    try {
        const savedState = JSON.parse(jsonString);

        currentCampaignId = savedState.campaignId || ("cmp_" + Date.now()); 
        
        if (savedState.version !== GAME_VERSION) {
            console.warn(`Version mismatch: ${savedState.version} vs ${GAME_VERSION}`);
        }

        // --- 1. CORE STATE RESTORATION ---
        // If this is a NEW save, unpack the centralized GameState safely
        if (savedState.coreState) {
            Object.assign(GameState.player, savedState.coreState.player);
            Object.assign(GameState.ship, savedState.coreState.ship);
            Object.assign(GameState.world, savedState.coreState.world);
            Object.assign(GameState.ui, savedState.coreState.ui);
        } else {
            // If this is an OLD legacy save, manually map the loose variables to the new state
            if (savedState.playerShip) playerShip = savedState.playerShip;
            if (savedState.playerCargo) playerCargo = savedState.playerCargo;
            
            playerX = savedState.playerX || 0;
            playerY = savedState.playerY || 0;
            playerFuel = savedState.playerFuel || 220;
            playerCredits = savedState.playerCredits || 1000;
            playerShields = savedState.playerShields || 50;
            playerHull = savedState.playerHull || 100;
            playerNotoriety = savedState.playerNotoriety || 0;
            playerLevel = savedState.playerLevel || 1;
            playerXP = savedState.playerXP || 0;
            lastNotorietyDecayTime = savedState.lastNotorietyDecayTime || savedState.currentGameDate;
            WORLD_SEED = savedState.WORLD_SEED;
            currentGameDate = savedState.currentGameDate || 2458.0;
        }

        // --- 2. METADATA & ARRAYS ---
        playerName = savedState.playerName || "Captain";
        playerPfp = savedState.playerPfp || "assets/pfp_01.png";
        playerCrew = savedState.playerCrew || [];
        playerPerks = new Set(savedState.playerPerks || []);
        window.concordEscortJumps = savedState.concordEscortJumps || 0;

        GameState.player.milestones = savedState.coreState?.player?.milestones || []; 
        
        isAwaitingRescue = savedState.isAwaitingRescue || false; 
        rescueTargetStation = savedState.rescueTargetStation || null; 
        rescueFeePaid = savedState.rescueFeePaid || 0; 
        freebieUsed = savedState.freebieUsed || false; 
        
        xerxesPuzzleLevel = savedState.xerxesPuzzleLevel || 0;
        mystery_wayfinder_progress = savedState.mystery_wayfinder_progress || 0;
        mystery_wayfinder_finalLocation = savedState.mystery_wayfinder_finalLocation || null;
        mystery_first_nexus_location = savedState.mystery_first_nexus_location || null;
        mystery_nexus_activated = savedState.mystery_nexus_activated || false;
        
        playerActiveMission = savedState.playerActiveMission || null;
        playerActiveBounty = savedState.playerActiveBounty || null;
        currentStationBounties = savedState.currentStationBounties || [];
        activeMarketTrend = savedState.activeMarketTrend || null;

        // --- 3. COLONIES ---
        playerHasColonyCharter = savedState.playerHasColonyCharter || false;
        playerColonies = savedState.playerColonies || {};

        // MIGRATION: Convert old single-colony saves to the new dictionary format
        if (savedState.playerColony && savedState.playerColony.established && Object.keys(playerColonies).length === 0) {
            const oldCol = savedState.playerColony;
            const safeName = oldCol.planetName ? oldCol.planetName.replace(/\s+/g, '') : 'Unknown';
            const oldId = `${oldCol.x}_${oldCol.y}_${safeName}`;
            oldCol.id = oldId;
            playerColonies[oldId] = oldCol;
        }

        // --- 4. MAPS & SETS ---
        visitedSectors = new Set(savedState.visitedSectors || []);
        scannedObjectTypes = new Set(savedState.scannedObjectTypes || []);
        discoveredLocations = new Set(savedState.discoveredLocations || []);
        playerCompletedMissions = new Set(savedState.playerCompletedMissions || []);
        discoveredLoreEntries = new Set(savedState.discoveredLoreEntries || []);
        
        // Restore the internal database switches        
        discoveredLoreEntries.forEach(loreId => {
            if (LORE_DATABASE[loreId]) {
                LORE_DATABASE[loreId].unlocked = true;
            }
        });
        
        worldStateDeltas = savedState.worldStateDeltas || {};
        
        // --- 5. ACTIVE PROBES ---
        window.activeProbes = savedState.activeProbes || [];
        if (typeof activeEnemies !== 'undefined') {
            window.activeProbes.forEach(probe => {
                activeEnemies = activeEnemies.filter(e => e.id !== probe.id);
                activeEnemies.push({
                    x: probe.x, y: probe.y, id: probe.id,
                    char: '📡', color: '#00FF00', name: "Active Probe", isProbe: true
                });
            });
        }
        
        // --- 6. RESET LOGIC & RECALCULATION ---
        chunkManager.loadedChunks = {}; 
        chunkManager.lastChunkKey = null;
        chunkManager.lastChunkRef = null;

        currentSectorX = Math.floor(playerX / SECTOR_SIZE);
        currentSectorY = Math.floor(playerY / SECTOR_SIZE);
        currentSectorName = generateSectorName(currentSectorX, currentSectorY);

        applyPlayerShipStats();
        updateNotorietyTitle();
        updateCurrentCargoLoad();
        xpToNextLevel = calculateXpToNextLevel(playerLevel);

        // --- 7. RE-INJECT ACTIVE BOUNTY SHIP ---
        if (playerActiveBounty) {
            if (typeof activeEnemies !== 'undefined') {
                activeEnemies = activeEnemies.filter(e => e.id !== playerActiveBounty.id);
                activeEnemies.push({
                    id: playerActiveBounty.id,
                    x: playerActiveBounty.x,
                    y: playerActiveBounty.y,
                    name: playerActiveBounty.targetName,
                    shipClass: playerActiveBounty.shipClass,
                    faction: playerActiveBounty.faction,
                    isBountyTarget: true,
                    level: playerActiveBounty.difficulty,
                    hp: playerActiveBounty.difficulty * 50,
                    maxHp: playerActiveBounty.difficulty * 50,
                    shields: playerActiveBounty.difficulty * 25,
                    maxShields: playerActiveBounty.difficulty * 25,
                    char: 'V', 
                    color: 'var(--danger)' 
                });
            }
        }

        // --- 8. FUEL RAT RELOAD PROTECTION ---
        if (isAwaitingRescue && rescueTargetStation) {
            if (typeof activeNPCs !== 'undefined') {
                activeNPCs.push({
                    x: playerX + 10, 
                    y: playerY + 10,
                    name: "Fuel Rats Rescue Tug",
                    char: "R",
                    color: "#FFAA00",
                    state: "RESCUE",
                    isFuelRat: true
                });
            }
            logMessage("<span style='color:var(--warning)'>Sensors picking up the Fuel Rat tug. They are almost here.</span>");
        }

        // --- 9. RESUME GAME ---
        logMessage("Game Loaded Successfully.");
        currentTradeContext = null;
        currentCombatContext = null;
        changeGameState(GAME_STATES.GALACTIC_MAP);
        handleInteraction();
        if (typeof renderMissionTracker === 'function') renderMissionTracker();
        render();
        
        // START AUTOSAVE TIMER
        if (typeof autoSaveInterval !== 'undefined' && autoSaveInterval) clearInterval(autoSaveInterval);
        window.autoSaveInterval = setInterval(autoSaveGame, typeof AUTOSAVE_DELAY !== 'undefined' ? AUTOSAVE_DELAY : 60000);

    } catch (error) {
        console.error("Load failed:", error);
        logMessage("Error loading save file.");
    }
}

// --- INITIALIZATION & EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Managers
    chunkManager.initializeStaticLocations();

    // 2. Setup Canvas
    setupCanvas(); 

    // 3. Setup DOM
    initializeDOMElements();

    // 4. Apply Theme
    const savedTheme = localStorage.getItem('wayfinderTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('themeButton').textContent = "Dark Mode";
    }

    cachedAccentColor = getThemeColor('--accent-color', '#00E0E0');

    // 5. Setup Auto-Login
    setupAutoLoginUI();

    // 6. Check Save State
    checkSaveStateAndRenderTitle();

    // --- 7. FIX: REVEAL THE GAME (ANTI-FLASH) ---
    // Small timeout ensures the browser has painted the styles before we fade in
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50); 
});

// --- HELPER FUNCTIONS ---

// Updated function accepts 'forceMenu' to prevent auto-login after deleting a save
function checkSaveStateAndRenderTitle(forceMenu = false) {
    const autoLoginEnabled = localStorage.getItem('wayfinderAutoLogin') === 'true';

    // 1. Gather ALL saves from the browser
    let allSaves = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Includes legacy keys to seamlessly migrate your current game!
        if (key.startsWith('wayfinder_manual_') || key.startsWith('wayfinder_auto_') || key.startsWith('wayfinder_save_') || key === 'wayfinderSaveData' || key === 'wayfinderAutoSave') {
            try {
                const parsed = JSON.parse(localStorage.getItem(key));
                allSaves.push({ key: key, raw: localStorage.getItem(key), data: parsed });
            } catch(e) {}
        }
    }

    // 2. Sort by most recently played
    allSaves.sort((a, b) => (b.data.realTimestamp || 0) - (a.data.realTimestamp || 0));

    // Get Elements
    const titleOverlay = document.getElementById('titleOverlay');
    const newGameCont = document.getElementById('newGameContainer');
    const saveSelectCont = document.getElementById('saveSelectContainer');
    const bootEl = document.getElementById('systemBoot');

    // 3. AUTO-LOGIN (Loads the most recently played character)
    if (!forceMenu && autoLoginEnabled && allSaves.length > 0) {
        console.log("Auto-login enabled. Loading most recent commander...");
        try {
            initializeGame();
            loadGameData(allSaves[0].raw); // Load the newest one
            if (titleOverlay) {
                titleOverlay.style.display = 'none';
                titleOverlay.style.opacity = '0';
            }
            return; 
        } catch (e) {
            console.error("Auto-login failed. Disabling.", e);
            localStorage.setItem('wayfinderAutoLogin', 'false');
        }
    }

    const loadingDelay = forceMenu ? 2000 : 3000;

    setTimeout(() => {
        if (bootEl) bootEl.style.display = 'none';

        if (allSaves.length > 0) {
            if (newGameCont) newGameCont.style.display = 'none';
            if (saveSelectCont) {
                saveSelectCont.style.display = 'block';
                renderSaveSlots(allSaves);
            }
        } else {
            if (saveSelectCont) saveSelectCont.style.display = 'none';
            if (typeof playIntroVideo === 'function') playIntroVideo(); 
        }
    }, loadingDelay);
}

function deleteSave(key) {
    showConfirmationModal(
        "WARNING: Protocol 77-Alpha. Deleting this save file is permanent and cannot be undone. Proceed?",
        () => {
            // This code only runs if they click "CONFIRM DELETION"
            localStorage.removeItem(key);
            logMessage("Save file purge complete.");
            checkSaveStateAndRenderTitle(true);
        }
    );
}

function renderSaveSlots(savesArray) {
    const list = document.getElementById('saveList');
    list.innerHTML = '';

    savesArray.forEach(saveObj => {
        const data = saveObj.data;
        const type = data.saveType || 'AUTO';
        
        const card = document.createElement('div');
        card.className = 'save-slot-card';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'save-card-content';
        
        const typeLabel = type === 'AUTO' ? '<span class="save-type-badge auto-badge">AUTOSAVE</span>' : '<span class="save-type-badge">MANUAL</span>';
        const dateStr = new Date(data.realTimestamp || Date.now()).toLocaleDateString() + " " + new Date(data.realTimestamp || Date.now()).toLocaleTimeString();
        const pfpSrc = data.playerPfp || 'assets/pfp_01.png';

        contentDiv.innerHTML = `
            <img src="${pfpSrc}" class="save-pfp-icon" alt="Cmdr">
            <div class="save-info">
                <div class="save-name">${data.playerName} ${typeLabel}</div>
                <div class="save-meta">Lvl ${data.playerLevel} | ${data.currentSectorName || 'Deep Space'}</div>
                <div class="save-meta">${dateStr}</div>
            </div>
        `;
        
        contentDiv.onclick = () => {
            initializeGame();
            loadGameData(saveObj.raw);
            if (typeof hideTitleScreen === 'function') hideTitleScreen();
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'save-delete-btn';
        deleteBtn.innerHTML = '&times;'; 
        deleteBtn.title = "Delete Save";
        
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); 
            if (typeof deleteSave === 'function') deleteSave(saveObj.key);
        };

        card.appendChild(contentDiv);
        card.appendChild(deleteBtn);
        list.appendChild(card);
    });
}

function setupAutoLoginUI() {
    const checkbox = document.getElementById('autoLoginCheck');
    if (checkbox) {
        checkbox.checked = localStorage.getItem('wayfinderAutoLogin') === 'true';
        checkbox.addEventListener('change', (e) => {
            localStorage.setItem('wayfinderAutoLogin', e.target.checked);
        });
    }

    // UI Buttons
    document.getElementById('showNewGameBtn').addEventListener('click', () => {
        document.getElementById('saveSelectContainer').style.display = 'none';
        document.getElementById('newGameContainer').style.display = 'block';
        document.getElementById('backToSavesBtn').style.display = 'inline-block';
    });

    document.getElementById('backToSavesBtn').addEventListener('click', () => {
        document.getElementById('newGameContainer').style.display = 'none';
        document.getElementById('saveSelectContainer').style.display = 'block';
    });
    
    // Main Menu Button (In System Menu)
    const mainMenuBtn = document.getElementById('mainMenuButton');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
            location.reload(); // Simplest way to return to title logic
        });
    }
}

// --- CUSTOM CONFIRMATION MODAL LOGIC ---
function showConfirmationModal(message, onConfirm) {
    const overlay = document.getElementById('confirmationOverlay');
    const msgEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn = document.getElementById('confirmNoBtn');

    // Set the text
    msgEl.textContent = message;
    
    // Show the modal
    overlay.style.display = 'flex';

    // Define Button Actions
    // Note: We overwrite .onclick to ensure we don't stack multiple listeners
    yesBtn.onclick = () => {
        onConfirm(); // Run the delete logic
        overlay.style.display = 'none'; // Close modal
    };

    noBtn.onclick = () => {
        overlay.style.display = 'none'; // Just close
    };
}

function hideTitleScreen() {
    const titleOverlay = document.getElementById('titleOverlay');
    titleOverlay.style.opacity = '0';
    setTimeout(() => {
        titleOverlay.style.display = 'none';
    }, 500);
}

// --- UNIVERSAL OVERLAY CLOSER ---
['tradeOverlay', 'cargoOverlay', 'codexOverlay', 'levelUpOverlay', 'genericModalOverlay', 'stationOverlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', (e) => {
            // Only close if clicking the dark background itself
            if (e.target === el) {
                if (id === 'tradeOverlay' || id === 'genericModalOverlay') closeGenericModal();
                else if (id === 'cargoOverlay') closeCargoModal();
                else if (id === 'codexOverlay') toggleCodex(false);
                else if (id === 'stationOverlay') closeStationView();
                // levelUpOverlay intentionally excluded; player MUST pick a perk!
            }
        });
    }
});

// --- LEGACY WRAPPER (Prevents crashes from old code or events) ---
function factionAction(faction) {
    console.warn(`factionAction('${faction}') is deprecated. Routing to new modular system...`);
    
    if (faction === 'CONCORD') {
        clearConcordBounty();
    } else if (faction === 'KTHARR') {
        openKtharrProvingGrounds();
    } else if (faction === 'ECLIPSE') {
        fenceEclipseContraband();
    } else {
        logMessage("Faction terminal offline.");
    }
}

// --- CONCORD SECURITY OFFICE ---

function openSecurityOffice() {
    if (playerNotoriety <= 0) {
        showToast("Record Clean. Have a safe flight.", "info");
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        return;
    }

    openGenericModal("CONCORD SECURITY OFFICE");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Calculate Costs & Bribe Eligibility
    const standardFine = playerNotoriety * 500;
    const bribeAmount = Math.floor(standardFine * 0.5); // 50% discount
    const canBribe = playerPerks.has('SILVER_TONGUE') || hasCrewPerk('TRADE_BONUS');

    // 2. Render the Wanted Poster (Left Pane)
    listEl.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 60px; margin-bottom: 15px; animation: pulse-warning 2s infinite;">🚔</div>
            <h3 style="color:var(--danger); margin-bottom:5px; letter-spacing: 2px;">ACTIVE WARRANT</h3>
            <p style="color:var(--text-color); font-weight:bold; margin-bottom:15px;">Target: Captain ${playerName}</p>
            <div style="background:rgba(255,0,0,0.1); border:1px solid var(--danger); padding:10px; border-radius:4px;">
                <p style="color:var(--warning); margin:0; font-size:12px; text-transform:uppercase;">Threat Level: ${playerNotorietyTitle}</p>
                <p style="color:var(--danger); margin:5px 0 0 0; font-size:16px; font-weight:bold;">${playerNotoriety} Infractions</p>
            </div>
        </div>
    `;

    // 3. Render the Dialogue & Math Area (Right Pane)
    detailEl.innerHTML = `
        <div style="padding: 15px;">
            <h3 style="color:var(--accent-color); margin-top:0;">OUTSTANDING FINES</h3>
            <p style="font-size: 13px; color:var(--item-desc-color); line-height: 1.5;">"You've got a lot of red on your ledger, Commander. You can pay the official fine to clear your record, or... maybe we can come to an understanding."</p>
            
            <div class="trade-math-area" style="margin-top: 20px;">
                <div class="trade-stat-row">
                    <span>Official Fine:</span> 
                    <span style="color:var(--danger); font-weight:bold;">${formatNumber(standardFine)}c</span>
                </div>
                <div class="trade-stat-row" style="margin-top: 10px; border-top: 1px solid #333; padding-top: 10px;">
                    <span>Under-the-Table Bribe:</span> 
                    <span style="color:${canBribe ? 'var(--gold-text)' : '#555'}; font-weight:bold;">${formatNumber(bribeAmount)}c</span>
                </div>
                <div style="font-size:10px; color:#888; text-align:right; margin-top:5px; font-style:italic;">
                    ${canBribe ? 'Smuggler Crew / Silver Tongue Perk Active' : 'Requires Smuggler Crew or Silver Tongue Perk'}
                </div>
            </div>
        </div>
    `;

    // 4. Render Action Buttons
    let btnHtml = '';
    
    // Official Pay Button
    if (playerCredits >= standardFine) {
        btnHtml += `<button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="processBountyPayment(false, ${standardFine})">PAY OFFICIAL FINE (${formatNumber(standardFine)}c)</button>`;
    } else {
        btnHtml += `<button class="action-button" disabled>INSUFFICIENT FUNDS (${formatNumber(standardFine)}c)</button>`;
    }

    // Bribe Button
    if (canBribe) {
        if (playerCredits >= bribeAmount) {
            btnHtml += `<button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text); box-shadow: 0 0 10px rgba(255,215,0,0.2);" onclick="processBountyPayment(true, ${bribeAmount})">BRIBE OFFICIAL (${formatNumber(bribeAmount)}c)</button>`;
        } else {
            btnHtml += `<button class="action-button" disabled style="border-color:#555; color:#555;">CANNOT AFFORD BRIBE (${formatNumber(bribeAmount)}c)</button>`;
        }
    }

    actionsEl.innerHTML = btnHtml;
}

function processBountyPayment(isBribe, amount) {
    if (playerCredits < amount) return;
    
    // Deduct credits and clear record
    playerCredits -= amount;
    playerNotoriety = 0;
    updateNotorietyTitle();
    
    if (isBribe) {
        logMessage(`<span style="color:var(--gold-text)">[ BRIBE ACCEPTED ] Security logs corrupted. Warrants deleted for ${formatNumber(amount)}c.</span>`);
        showToast("BOUNTY CLEARED (BRIBED)", "success");
    } else {
        logMessage(`<span style="color:var(--success)">[ FINE PAID ] All outstanding warrants cleared for ${formatNumber(amount)}c.</span>`);
        showToast("BOUNTY CLEARED", "success");
    }

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    
    renderUIStats();
    closeGenericModal();
}

// --- XERXES ROGUE PLANET LOGIC ---

let xerxesPuzzleLevel = 0; // 0 = Locked, 1 = Gate Open, 2 = Level 2, etc.

function openXerxesView() {
    updateModalInfoBar('xerxesInfoBar');
    document.getElementById('xerxesOverlay').style.display = 'flex';
    
    // Draw the art
    drawXerxesArt('xerxesCanvas');
    
    // Render the menu
    renderXerxesMenu();
}

function closeXerxesView() {
    document.getElementById('xerxesOverlay').style.display = 'none';
    updateSideBorderVisibility();
}

function drawXerxesArt(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width; const h = canvas.height;
    
    ctx.fillStyle = '#050010'; // Deep dark void
    ctx.fillRect(0,0,w,h);
    
    // Draw the Planet
    const cx = w/2, cy = h/2;
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
    grad.addColorStop(0, '#220044');
    grad.addColorStop(1, '#080010');
    
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI*2); ctx.fill();
    
    // Draw the "Spire" lights (City)
    ctx.fillStyle = '#9933FF';
    for(let i=0; i<30; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 20 + Math.random() * 35;
        const lx = cx + Math.cos(ang)*rad;
        const ly = cy + Math.sin(ang)*rad;
        ctx.globalAlpha = Math.random() * 0.8;
        ctx.fillRect(lx, ly, 2, 2);
    }
    ctx.globalAlpha = 1.0;
    
    // Atmosphere Ring
    ctx.strokeStyle = '#551188';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 65, 0, Math.PI*2); ctx.stroke();
}

function renderXerxesMenu() {
    const menu = document.getElementById('xerxesMenu');
    menu.innerHTML = '';
    
    // 1. Standard Services (Always Available)
    const stdBtns = [
        { icon: '⛽', label: 'Black Market Fuel', sub: 'Refuel (Premium)', action: 'xerxesRefuel' },
        { icon: '🔧', label: 'Shadow Dock', sub: 'Repair Hull', action: 'xerxesRepair' }
    ];
    
    stdBtns.forEach(b => {
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn" onclick="${b.action}()">
                <div class="btn-icon">${b.icon}</div>
                <div>
                    <div class="btn-label">${b.label}</div>
                    <span class="btn-sub">${b.sub}</span>
                </div>
            </button>
        `;
    });

    // --- THE CRYPTARCH (Always available at the Spire) ---
    menu.innerHTML += `
        <button class="station-action-btn xerxes-btn" style="border-left: 3px solid var(--accent-color);" onclick="visitCryptarch()">
            <div class="btn-icon">👁️</div>
            <div>
                <div class="btn-label">The Cryptarch</div>
                <span class="btn-sub" style="color:var(--accent-color)">Decrypt Ancient Engrams</span>
            </div>
        </button>
    `;

    // --- 2. THE BLACK MARKET (Shadow Network) ---
    if (typeof xerxesPuzzleLevel !== 'undefined' && xerxesPuzzleLevel >= 1) {
        // BUY BUTTON
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn xerxes-spire-btn" onclick="openTradeModal('buy')">
                <div class="btn-icon">💀</div>
                <div>
                    <div class="btn-label">Shadow Network : Buy</div>
                    <span class="btn-sub" style="color:var(--success)">Acquire Contraband</span>
                </div>
            </button>
        `;
        // SELL BUTTON
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn xerxes-spire-btn" onclick="openTradeModal('sell')">
                <div class="btn-icon">💰</div>
                <div>
                    <div class="btn-label">Shadow Network : Sell</div>
                    <span class="btn-sub" style="color:var(--success)">Fence Goods & Cargo</span>
                </div>
            </button>
        `;
    } else {
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn" disabled style="opacity:0.5; border-color:#555;">
                <div class="btn-icon">🔒</div>
                <div>
                    <div class="btn-label">Shadow Network</div>
                    <span class="btn-sub" style="color:#888;">Complete Spire Layer 1 to Unlock</span>
                </div>
            </button>
        `;
    }

    // --- 3. THE SPIRE PUZZLE & VAULT INJECTION ---
    if (typeof xerxesPuzzleLevel !== 'undefined' && typeof SPIRE_PUZZLES !== 'undefined' && xerxesPuzzleLevel < SPIRE_PUZZLES.length) {
        const pz = SPIRE_PUZZLES[xerxesPuzzleLevel];
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn xerxes-spire-btn" onclick="enterTheSpire()">
                <div class="btn-icon">🏯</div>
                <div>
                    <div class="btn-label">${pz.title}</div>
                    <span class="btn-sub" style="color:#DDA0DD">Decrypt Layer ${xerxesPuzzleLevel + 1}</span>
                </div>
            </button>
        `;
    } else {
        // --- NEW: THE CORE VAULT ---
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn xerxes-spire-btn" style="border-color: #FF33FF; box-shadow: 0 0 15px rgba(255,51,255,0.3);" onclick="closeXerxesView(); enterPrecursorVault();">
                <div class="btn-icon" style="color:#FF33FF; filter: drop-shadow(0 0 5px #FF33FF);">🌀</div>
                <div>
                    <div class="btn-label" style="color:#FF33FF;">Descend into the Core</div>
                    <span class="btn-sub" style="color:#DDA0DD;">Enter the Precursor Vault</span>
                </div>
            </button>
        `;
    }
    
    // --- 4. LEAVE ---
    menu.innerHTML += `
        <button class="station-action-btn xerxes-btn" onclick="closeXerxesView()">
            <div class="btn-icon">🚀</div>
            <div>
                <div class="btn-label">Depart Orbit</div>
                <span class="btn-sub">Return to Deep Space</span>
            </div>
        </button>
    `;
}

function xerxesRefuel() {
    if(playerCredits < 50) { xerxesLog("Dockmaster: 'Credits first, outlander.'", "bad"); return; }
    if(playerFuel >= MAX_FUEL) { xerxesLog("Tanks already full.", "neutral"); return; }
    playerCredits -= 50;
    playerFuel = MAX_FUEL;
    soundManager.playUIHover();
    xerxesLog("Refueled. The fuel smells like sulfur...", "good");
    updateModalInfoBar('xerxesInfoBar');
}

function xerxesRepair() {
    repairShip(); // Reuse standard logic, but it will log to main console behind modal. 
    // Let's add a local log too:
    xerxesLog("Hull plates welded. Crude work, but solid.", "good");
    updateModalInfoBar('xerxesInfoBar');
}

function xerxesLog(msg, type) {
    const log = document.getElementById('xerxesLog');
    const color = type === 'bad' ? '#FF5555' : (type === 'good' ? '#00FF00' : '#DDA0DD');
    log.innerHTML += `<div style="color:${color}">> ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

// --- DYNAMIC PUZZLE LOGIC ---

function enterTheSpire() {
    // Safety check: Are we out of puzzles?
    if (xerxesPuzzleLevel >= SPIRE_PUZZLES.length) return;

    const puzzle = SPIRE_PUZZLES[xerxesPuzzleLevel];

    // Hide the standard log to make room for the terminal
    const log = document.getElementById('xerxesLog');
    if (log) log.style.display = "none"; 
    
    // Build the Terminal UI (Now in Shadow Network Purple!)
    const menu = document.getElementById('xerxesMenu');
    menu.innerHTML = `
        <div id="spireTerminal" style="grid-column: span 2; background: #020005; border: 2px solid #9933FF; box-shadow: inset 0 0 30px rgba(153, 51, 255, 0.2), 0 0 15px rgba(153, 51, 255, 0.4); padding: 20px; font-family: 'Roboto Mono', monospace; color: #DDA0DD; height: 340px; display: flex; flex-direction: column; position: relative; border-radius: 4px; transition: all 0.3s;">
            
            <div style="font-size: 10px; letter-spacing: 2px; border-bottom: 1px solid #9933FF; margin-bottom: 10px; padding-bottom: 5px; opacity: 0.8;">
                SHADOW NETWORK // OVERRIDE TERMINAL
            </div>

            <div id="terminalOutput" style="flex: 1; overflow-y: auto; font-size: 13px; line-height: 1.6; text-shadow: 0 0 5px rgba(221, 160, 221, 0.5); white-space: pre-wrap; padding-right: 5px;"></div>
            
            <div style="display: flex; align-items: center; margin-top: 10px; border-top: 1px dashed #9933FF; padding-top: 15px;">
                <span style="margin-right: 10px; font-weight: bold; font-size: 16px; color: #9933FF;">>_</span>
                <input type="text" id="spireInput" autocomplete="off" spellcheck="false"
                    style="flex: 1; background: transparent; border: none; color: #DDA0DD; font-family: 'Roboto Mono', monospace; font-size: 16px; outline: none; text-shadow: 0 0 5px rgba(221, 160, 221, 0.8); text-transform: uppercase;" 
                    onkeydown="if(event.key === 'Enter') checkSpireAnswer()">
            </div>

            <button onclick="abortSpireHack()" style="position: absolute; top: 15px; right: 15px; background: transparent; color: #DDA0DD; border: 1px solid #9933FF; cursor: pointer; padding: 4px 10px; font-family: 'Roboto Mono', monospace; font-size: 10px; transition: 0.2s;">ABORT OVERRIDE</button>
        </div>
    `;
    
    const output = document.getElementById('terminalOutput');
    const input = document.getElementById('spireInput');
    input.disabled = true; // Lock input during boot sequence

    // --- Simulated Boot Sequence Animation ---
    const bootLines = [
        `ESTABLISHING SECURE HANDSHAKE... [OK]`,
        `BYPASSING OUTER FIREWALL... [OK]`,
        `ACCESSING LAYER ${xerxesPuzzleLevel + 1} MAINFRAME...`,
        `<span style="color:#FF5555">WARNING: LETHAL COUNTERMEASURES DETECTED.</span>`,
        `\nENCRYPTION CIPHER ACTIVE:\n"<span style="color:#FFF;">${puzzle.riddle}</span>"\n`,
        `AWAITING DECRYPTION KEY...`
    ];

    let delay = 0;
    bootLines.forEach((line, index) => {
        setTimeout(() => {
            output.innerHTML += line + "<br>";
            output.scrollTop = output.scrollHeight;
            
            // Beep sound for every line of code loaded
            if (typeof soundManager !== 'undefined') soundManager.playUIHover(); 
            
            // Once the boot sequence finishes, unlock the input
            if (index === bootLines.length - 1) {
                input.disabled = false;
                input.focus();
            }
        }, delay);
        
        // Add a dramatic pause right before the riddle displays
        delay += (index === bootLines.length - 2) ? 1200 : 400; 
    });
}

function checkSpireAnswer() {
    if (xerxesPuzzleLevel >= SPIRE_PUZZLES.length) return;

    const puzzle = SPIRE_PUZZLES[xerxesPuzzleLevel];
    const inputEl = document.getElementById('spireInput');
    const output = document.getElementById('terminalOutput');
    const terminal = document.getElementById('spireTerminal');
    
    const answer = inputEl.value.trim().toLowerCase();
    if (answer === "") return;

    // Echo the user's input to the terminal screen
    inputEl.value = "";
    output.innerHTML += `<br><span style="color:#9933FF">>_</span> ${answer.toUpperCase()}<br>`;
    output.scrollTop = output.scrollHeight;

    // --- THE FIX: FORGIVING EVALUATION ---
    let isCorrect = false;
    if (Array.isArray(puzzle.answers)) {
        // Check if the user's typed string CONTAINS any of the accepted answers
        isCorrect = puzzle.answers.some(ans => answer.includes(ans.toLowerCase()));
    } else if (typeof puzzle.answers === 'string') {
        isCorrect = answer.includes(puzzle.answers.toLowerCase());
    }
    
    if (isCorrect) {
        // --- SUCCESS SEQUENCE ---
        inputEl.disabled = true;
        terminal.style.borderColor = "#DDA0DD";
        terminal.style.boxShadow = "inset 0 0 50px rgba(153, 51, 255, 0.4)";
        
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        
        xerxesPuzzleLevel++;

        if (typeof unlockLoreEntry === 'function') unlockLoreEntry("XENO_THE_SPIRE");
        
        // Give Rewards
        if (puzzle.rewardXP > 0) {
            playerXP += puzzle.rewardXP;
            if (typeof showToast === 'function') showToast(`DECRYPTED: +${puzzle.rewardXP} XP`, "success");
        }
        if (puzzle.rewardCredit > 0) {
            playerCredits += puzzle.rewardCredit;
            if (typeof showToast === 'function') showToast(`DATA CACHE: +${puzzle.rewardCredit}c`, "success");
        }

        if (xerxesPuzzleLevel === 1) {
            if (typeof showToast === 'function') showToast("Layer Decrypted. Shadow Network Unlocked.", "success");
        }

        if (typeof updateModalInfoBar === 'function') updateModalInfoBar('xerxesInfoBar');

        // --- BUG FIX: We removed the premature checkLevelUp() from here! ---

        output.innerHTML += `<span style="color:#DDA0DD; font-weight:bold; font-size:16px;">[ ACCESS GRANTED ]</span><br>${puzzle.flavorSuccess}<br><br>Rebooting station interfaces...`;
        output.scrollTop = output.scrollHeight;

        // Auto-close terminal and return to menu after 3 seconds
        setTimeout(() => {
            if (typeof abortSpireHack === 'function') abortSpireHack();
            
            // --- Trigger the Level Up and Auto-Save SAFELY after the terminal closes ---
            if (typeof checkLevelUp === 'function') checkLevelUp();
            if (typeof autoSaveGame === 'function') autoSaveGame(); 
        }, 3000); 
        
    } else {
        // --- FAILURE SEQUENCE ---
        if (typeof soundManager !== 'undefined') soundManager.playError();
        if (typeof triggerHaptic === "function") triggerHaptic(300);
        
        playerHull -= 15;
        updateModalInfoBar('xerxesInfoBar');
        
        // Visual Red Flash on the Terminal
        terminal.style.backgroundColor = "#220000";
        terminal.style.borderColor = "#FF0000";
        terminal.style.boxShadow = "inset 0 0 40px rgba(255, 0, 0, 0.6)";
        inputEl.style.color = "#FF0000";
        
        output.innerHTML += `<span style="color:#FF5555; font-weight:bold;">[ ACCESS DENIED ]<br>LETHAL COUNTERMEASURE DEPLOYED! Hull Integrity -15.</span><br>`;
        output.scrollTop = output.scrollHeight;

        // Reset colors back to purple after the flash
        setTimeout(() => {
            terminal.style.backgroundColor = "#020005";
            terminal.style.borderColor = "#9933FF";
            terminal.style.boxShadow = "inset 0 0 30px rgba(153, 51, 255, 0.2)";
            inputEl.style.color = "#DDA0DD";
        }, 400);

        if (playerHull <= 0) {
            if (typeof closeXerxesView === 'function') closeXerxesView();
            triggerGameOver(`Vaporized by ${puzzle.title} Protocols`);
        }
    }
}

// Helper to safely exit the hacking minigame
function abortSpireHack() {
    // Restore the standard layout
    const log = document.getElementById('xerxesLog');
    if (log) log.style.display = "block"; 
    
    renderXerxesMenu();
}

// --- INTRO VIDEO LOGIC ---
function playIntroVideo() {
    const videoCont = document.getElementById('introVideoContainer');
    const video = document.getElementById('introVideo');
    
    // Fallback if the HTML isn't set up
    if (!videoCont || !video) {
        skipIntroVideo();
        return;
    }

    // --- THEME-MATCHING LOGIC ---
    const isLightMode = document.body.classList.contains('light-mode');
    
    // Swap the video source based on the theme
    video.src = isLightMode ? 'assets/intro_white.mp4' : 'assets/intro_black.mp4';
    
    // Match the container's background color to the fade color 
    // so the edges of the video blend seamlessly into the screen!
    videoCont.style.backgroundColor = isLightMode ? '#FFFFFF' : '#050510';

    videoCont.style.display = 'flex';

    // Attempt to play the video
    video.play().catch(error => {
        console.warn("Autoplay prevented by browser. Skipping intro.", error);
        skipIntroVideo();
    });

    // When the video finishes naturally, move to character creation
    video.onended = () => {
        skipIntroVideo();
    };
}

function skipIntroVideo() {
    const videoCont = document.getElementById('introVideoContainer');
    const video = document.getElementById('introVideo');
    const newGameCont = document.getElementById('newGameContainer');

    // Stop the video and rewind it
    if (video) {
        video.pause();
        video.currentTime = 0;
    }

    // Hide the video container and show the Character Creation screen
    if (videoCont) videoCont.style.display = 'none';
    
    // Add a slight fade-in effect to the new game container for polish
    if (newGameCont) {
        newGameCont.style.opacity = '0';
        newGameCont.style.display = 'block';
        setTimeout(() => newGameCont.style.opacity = '1', 50);
    }
}

function generateBountyTargets() {
    currentStationBounties = [];
    const numBounties = Math.floor(Math.random() * 3) + 2; // 2 to 4 bounties per station
    
    const firstNames = ["'Mad Dog'", "Viper", "'Iron'", "Jax", "Silas", "Kaelen", "'Ghost'", "Rook", "Vane", "Kira"];
    const lastNames = ["Vance", "Karn", "Trex", "the Butcher", "Valerius", "Thorne", "Graves", "Black", "Kryik"];
    const crimeList = ["Smuggling", "Piracy", "Assassination", "Data Theft", "Illegal Cybernetics", "Shipjacking"];
    
    for (let i = 0; i < numBounties; i++) {
        // Pick a random direction and distance to spawn the target
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.floor(Math.random() * 15) + 5; // 5 to 20 tiles away
        
        const targetX = Math.floor(playerX + Math.cos(angle) * distance);
        const targetY = Math.floor(playerY + Math.sin(angle) * distance);
        
        // Scale difficulty with player level
        let difficultyLevel = playerLevel;
        if (Math.random() > 0.7) difficultyLevel += 2; 
        
        // --- DYNAMIC ECONOMY MATH ---
        const baseReward = (difficultyLevel * 1500) + Math.floor(Math.random() * 500);
        const distanceBonus = distance * 50; // +50c per tile of travel distance
        const totalReward = baseReward + distanceBonus;
        
        currentStationBounties.push({
            // 🚨 FIXED: Added random entropy to prevent duplicate Bounty IDs
            id: `BOUNTY_${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`,
            targetName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            crime: crimeList[Math.floor(Math.random() * crimeList.length)],
            x: targetX,
            y: targetY,
            difficulty: difficultyLevel,
            reward: totalReward, 
            faction: "ECLIPSE", 
            shipClass: difficultyLevel > 5 ? "STRIKER" : "SCOUT" 
        });
    }
}

// --- AMBIENT MAP ANIMATION ---
// Gives the galactic map a heartbeat so stars twinkle naturally without player movement
setInterval(() => {
    // Only run if we are looking at the map, and no fast-animations (particles/pulse) are already rendering it
    if (typeof currentGameState !== 'undefined' && 
        currentGameState === 'galactic_map' && 
        !particleAnimationId && 
        typeof sensorPulseActive !== 'undefined' && !sensorPulseActive) {
        
        render();
    }
}, 200); // 5 FPS is perfectly smooth for a slow twinkle, while keeping browser CPU usage extremely low.

// ==========================================
// --- DYNAMIC ECONOMY ENGINE ---
// ==========================================

function generateMarketTrend() {
    if (typeof LOCATIONS_DATA === 'undefined' || typeof COMMODITIES === 'undefined') return;

    // Grab all valid stations and legal commodities
    const stations = Object.keys(LOCATIONS_DATA).filter(k => LOCATIONS_DATA[k].isMajorHub || LOCATIONS_DATA[k].type === 'O');
    const items = Object.keys(COMMODITIES).filter(k => !COMMODITIES[k].illegal);
    
    if (stations.length === 0 || items.length === 0) return;

    const targetStation = stations[Math.floor(Math.random() * stations.length)];
    const targetItem = items[Math.floor(Math.random() * items.length)];
    const isBoom = Math.random() > 0.5; // 50% chance for Boom (High Demand), 50% for Bust (Surplus)

    activeMarketTrend = {
        station: targetStation,
        item: targetItem,
        isBoom: isBoom,
        expiry: currentGameDate + 60.0 // Lasts for roughly 60 stardates
    };

    // 20% chance the player casually intercepts this news on the comms channel while flying!
    if (Math.random() < 0.20) {
        const trendType = isBoom ? "<span style='color:var(--warning)'>CRITICAL SHORTAGE</span>" : "<span style='color:var(--success)'>MARKET SURPLUS</span>";
        logMessage(`<span style="color:#A2D2FF">[ GALACTIC NEWS ]</span> ${trendType} of <span style="color:var(--gold-text)">${COMMODITIES[targetItem].name}</span> reported at ${targetStation}.`);
    }
}

// ==========================================
// --- DEVELOPER DEBUG CONSOLE ---
// ==========================================

function openDevMenu() {
    openGenericModal("🛠️ DEVELOPER CONSOLE 🛠️");
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Dynamically adjust the pink text so it doesn't vanish on white backgrounds
    const isLight = document.body.classList.contains('light-mode');
    const pinkHex = isLight ? '#CC00CC' : '#FF55FF';

    // Add pointer cursors so they act like real buttons
    listEl.innerHTML = `
        <div class="generic-list-item" onclick="devGiveCredits()" style="cursor: pointer; border-left: 3px solid var(--gold-text);">
            <strong style="color:var(--gold-text);">💰 Inject 100,000 Credits</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Instantly fund your galactic empire.</div>
        </div>
        <div class="generic-list-item" onclick="devGiveColonyItems()" style="cursor: pointer; border-left: 3px solid var(--accent-color);">
            <strong style="color:var(--accent-color);">📦 Spawn Colony Supplies</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Adds 1 Charter, 5 Habs, 2 Atmos, 10 Settlers.</div>
        </div>
        <div class="generic-list-item" onclick="devMaxStats()" style="cursor: pointer; border-left: 3px solid var(--success);">
            <strong style="color:var(--success);">🛠️ Restore Ship Vitals</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Max Hull, Max Shields, Max Fuel.</div>
        </div>
        <div class="generic-list-item" onclick="devLevelUp()" style="cursor: pointer; border-left: 3px solid ${pinkHex};">
            <strong style="color:${pinkHex};">⭐ Power Level (+5)</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Grants 5,000 XP and forces a level up.</div>
        </div>
        <div class="generic-list-item" onclick="enterPrecursorVault()" style="cursor: pointer; border-left: 3px solid #9933FF;">
            <strong style="color:#9933FF;">🏛️ Spawn Precursor Vault</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Instantly trigger the Vault mini-game.</div>
        </div>
    `;

    detailEl.innerHTML = `
        <div style="padding: 40px 20px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 10px;">⚠️</div>
            <h3 style="color:var(--danger); margin-bottom: 10px;">DEBUG MODE ACTIVE</h3>
            <p style="color:var(--item-desc-color);">Use these tools to bypass the game economy and test new features. Use with caution, as excessive item spawning may exceed your cargo limits.</p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button danger-btn" onclick="closeGenericModal()">CLOSE DEV MENU</button>
    `;
}

// --- CHEAT FUNCTIONS ---

function devGiveCredits() {
    playerCredits += 100000;
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
    if (typeof soundManager !== 'undefined' && soundManager.playBuy) soundManager.playBuy();
    if (typeof showToast === 'function') showToast("DEV: +100,000 Credits", "success");
}

function devGiveColonyItems() {
    // Add items directly to cargo
    playerCargo["COLONY_CHARTER"] = (playerCargo["COLONY_CHARTER"] || 0) + 1;
    playerCargo["HAB_MODULE"] = (playerCargo["HAB_MODULE"] || 0) + 5;
    playerCargo["ATMOS_PROCESSOR"] = (playerCargo["ATMOS_PROCESSOR"] || 0) + 2;
    playerCargo["SETTLER_MANIFEST"] = (playerCargo["SETTLER_MANIFEST"] || 0) + 10;
    
    // Force a cargo recalculation so the event bus fires the quest hook!
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    
    if (typeof soundManager !== 'undefined' && soundManager.playBuy) soundManager.playBuy();
    if (typeof showToast === 'function') showToast("DEV: Colony Gear Spawns", "success");
}

function devMaxStats() {
    playerHull = typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100;
    playerShields = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50;
    playerFuel = typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220;
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
    if (typeof showToast === 'function') showToast("DEV: Vitals Restored", "success");
}

function devLevelUp() {
    playerLevel += 5;
    playerXP += 5000;
    if (typeof checkLevelUp === 'function') checkLevelUp();
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
    if (typeof showToast === 'function') showToast("DEV: Leveled Up", "success");
}

// ==========================================
// --- FACTION HIRELING PASSIVES ---
// ==========================================

function processMercenaryDrawbacks() {
    // 1. Eclipse Mercenary Cargo Theft (5% chance per sector jump)
    if (window.hasEclipseMerc && Math.random() < 0.05) { 
        const cargoItems = Object.keys(playerCargo).filter(k => playerCargo[k] > 0);
        if (cargoItems.length > 0) {
            const stolenItem = cargoItems[Math.floor(Math.random() * cargoItems.length)];
            playerCargo[stolenItem]--;
            if (playerCargo[stolenItem] <= 0) delete playerCargo[stolenItem];
            
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
            logMessage(`<span style="color:#9933FF; font-weight:bold;">[ CARTEL OPERATIVE ]</span> You catch your mercenary slipping away from the cargo bay. 1x ${COMMODITIES[stolenItem].name} is missing.`);
            if (typeof showToast === 'function') showToast("CARGO STOLEN", "warning");
            if (typeof renderUIStats === 'function') renderUIStats();
        }
    }

    // 2. Concord Escort Jump Tracking
    if (window.concordEscortJumps && window.concordEscortJumps > 0) {
        window.concordEscortJumps--;
        if (window.concordEscortJumps <= 0) {
            logMessage("<span style='color:var(--accent-color); font-weight:bold;'>[ AEGIS COMMAND ]</span> Escort contract concluded. The gunship breaks formation and jumps away.");
            if (typeof showToast === 'function') showToast("ESCORT DEPARTED", "info");
        } else {
            // 10% chance to hear your escort checking in on the comms!
            if (Math.random() < 0.1) {
                logMessage("<span style='color:var(--accent-color);'>[ AEGIS WING ]</span> <i>'We have your six, Commander. Proceed to next waypoint.'</i>");
            }
        }
    }
}

// ==========================================
// --- CREW PERK ENGINE HOOKS ---
// ==========================================

// Safely intercept the stat calculation function to apply our Crew Shield Boost!
if (typeof window.applyPlayerShipStats === 'function' && !window._originalApplyStats) {
    window._originalApplyStats = window.applyPlayerShipStats;
    
    window.applyPlayerShipStats = function() {
        // 1. Run your original math first
        window._originalApplyStats();
        
        // 2. Apply the Chief Engineer Shield Boost (25% Extra Shields)
        if (typeof hasCrewPerk === 'function' && hasCrewPerk('SHIELD_BOOST')) {
            if (typeof MAX_SHIELDS !== 'undefined') {
                MAX_SHIELDS = Math.floor(MAX_SHIELDS * 1.25);
                playerShields = Math.min(playerShields, MAX_SHIELDS); // Cap current shields
            }
        }
    };
}

// ==========================================
// --- ADVANCED MERCENARY DATAPAD UI ---
// ==========================================

function displayMissionBoard() {
    openGenericModal("MERCENARY DATAPAD V2.0");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Ensure missions exist via your native generator
    const currentLocation = getCombinedLocationData(playerX, playerY);
    if (typeof generateMissionsForStation === 'function' && (!missionsAvailableAtStation || missionsAvailableAtStation.length === 0)) {
        generateMissionsForStation(currentLocation ? currentLocation.name : "Local Hub"); 
    }

    // 2. Setup Context
    currentMissionContext = { step: 'selectMission', availableMissions: missionsAvailableAtStation };

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--danger); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">ENCRYPTED CONTRACTS</div>`;

    if (!missionsAvailableAtStation || missionsAvailableAtStation.length === 0) {
         listEl.innerHTML += `<div style="padding:15px; color:#888;">No contracts available in this sector.</div>`;
    } else {
         missionsAvailableAtStation.forEach((mission, index) => {
             const row = document.createElement('div');
             row.className = 'trade-item-row';
             row.style.cursor = 'pointer';
             row.style.padding = '12px 10px';
             
             const title = mission.title || (mission.template ? mission.template.title_template : "Unknown Contract");
             const reward = mission.rewards ? mission.rewards.credits : 0;
             
             // Dynamic styling based on mission type
             let icon = '📦';
             let color = 'var(--accent-color)';
             if (mission.type === 'BOUNTY') { icon = '🎯'; color = 'var(--danger)'; }
             else if (mission.type === 'SURVEY') { icon = '🛰️'; color = '#9933FF'; }
             else if (mission.type === 'ACQUIRE') { icon = '💎'; color = 'var(--gold-text)'; }

             row.innerHTML = `
                 <div style="display:flex; align-items:center; gap: 15px;">
                     <div style="font-size:24px; filter: drop-shadow(0 0 5px ${color});">${icon}</div>
                     <div style="display:flex; flex-direction:column; gap: 4px;">
                         <span style="color:${color}; font-weight:bold; font-size:12px; letter-spacing:0.5px;">${title.toUpperCase()}</span> 
                         <span style="color:var(--text-color); font-size:10px;">Payout: <span style="color:var(--gold-text);">${formatNumber(reward)}c</span></span>
                     </div>
                 </div>
             `;
             row.onclick = () => displayMissionDetails(index);
             listEl.appendChild(row);
         });
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; opacity:0.3;">📡</div>
            <h3 style="color:var(--text-color); margin-bottom:10px; letter-spacing:2px;">SECURE BROKER NETWORK</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.6;">
                Connect your datapad to the local brokerage node. Review hazard pay, target profiles, and route data before accepting a contract. 
                <br><br><span style="color:var(--warning);">Note: Concord law dictates freelancers may only hold one active contract at a time.</span>
            </p>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="openStationView()">DISCONNECT DATAPAD</button>`;
}

function displayMissionDetails(index) {
    const mission = missionsAvailableAtStation[index];
    if (!mission) return;

    currentMissionContext.step = 'confirmMission';
    currentMissionContext.selectedMissionIndex = index;

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const title = mission.title || "Contract";
    const desc = mission.description || "Mission details unavailable.";
    const reward = mission.rewards ? mission.rewards.credits : 0;
    const xp = mission.rewards ? mission.rewards.xp : 0;
    
    let typeLabel = "LOGISTICS CONTRACT";
    let typeColor = "var(--accent-color)";
    let visualHTML = "";
    let objectiveDataHTML = "";

    // --- DYNAMIC CONTENT GENERATION ---
    if (mission.type === 'BOUNTY') {
        typeLabel = "ASSASSINATION DIRECTIVE";
        typeColor = "var(--danger)";
        
        // Procedurally grab a random player portrait and use CSS to turn it into a red wanted poster!
        const mugshotIndex = Math.floor(Math.random() * (typeof PLAYER_PORTRAITS !== 'undefined' ? PLAYER_PORTRAITS.length : 6));
        const mugshotSrc = typeof PLAYER_PORTRAITS !== 'undefined' ? PLAYER_PORTRAITS[mugshotIndex] : `assets/pfp_01.png`;
        const targetName = mission.targetName || "Classified Hostile";

        visualHTML = `
            <div style="position:relative; display:inline-block; margin-bottom:15px;">
                <img src="${mugshotSrc}" style="width:100px; height:100px; border-radius:4px; border:2px solid var(--danger); filter: grayscale(100%) contrast(1.5) sepia(1.2) hue-rotate(300deg); box-shadow: 0 0 15px rgba(255,0,0,0.3);">
                <div style="position:absolute; bottom:5px; left:0; width:100%; background:rgba(255,0,0,0.8); color:#fff; font-size:10px; font-weight:bold; letter-spacing:1px; text-align:center;">WANTED</div>
            </div>
        `;
        
        const hazardBonus = Math.floor(reward * 0.3); // Fake math to make the lore look deep
        objectiveDataHTML = `
            <div class="trade-stat-row"><span>Target Alias:</span> <span style="color:var(--text-color);">${targetName}</span></div>
            <div class="trade-stat-row"><span>Last Known Sector:</span> <span style="color:var(--warning);">[ REDACTED UNTIL ACCEPTED ]</span></div>
            <div class="trade-stat-row"><span>Hazard Pay Included:</span> <span style="color:var(--gold-text);">+${hazardBonus}c</span></div>
        `;
    } else if (mission.type === 'DELIVERY') {
        typeLabel = "PRIORITY FREIGHT";
        typeColor = "var(--accent-color)";
        visualHTML = `<div style="font-size:60px; filter: drop-shadow(0 0 15px var(--accent-color)); margin-bottom:15px;">📦</div>`;
        
        const dest = mission.objectives && mission.objectives[0] ? mission.objectives[0].destinationName : "Unknown Hub";
        objectiveDataHTML = `
            <div class="trade-stat-row"><span>Destination:</span> <span style="color:var(--accent-color);">${dest}</span></div>
            <div class="trade-stat-row"><span>Cargo Type:</span> <span style="color:var(--text-color);">Fragile / Time-Sensitive</span></div>
            <div class="trade-stat-row"><span>Transit Risk:</span> <span style="color:var(--warning);">Moderate (Pirate Activity)</span></div>
        `;
    } else if (mission.type === 'SURVEY') {
        typeLabel = "DEEP SPACE ASTROMETRICS";
        typeColor = "#9933FF";
        visualHTML = `<div style="font-size:60px; filter: drop-shadow(0 0 15px #9933FF); margin-bottom:15px;">🛰️</div>`;
        objectiveDataHTML = `
            <div class="trade-stat-row"><span>Target Class:</span> <span style="color:#9933FF;">Spatial Anomaly</span></div>
            <div class="trade-stat-row"><span>Sensor Requirement:</span> <span style="color:var(--text-color);">Standard Array or Higher</span></div>
        `;
    } else if (mission.type === 'ACQUIRE') {
        typeLabel = "PROCUREMENT CONTRACT";
        typeColor = "var(--gold-text)";
        visualHTML = `<div style="font-size:60px; filter: drop-shadow(0 0 15px var(--gold-text)); margin-bottom:15px;">💎</div>`;
        objectiveDataHTML = `
            <div class="trade-stat-row"><span>Client:</span> <span style="color:var(--text-color);">Anonymous Corporate Buyer</span></div>
            <div class="trade-stat-row"><span>Acquisition Method:</span> <span style="color:var(--warning);">Discretionary (Legal or Illegal)</span></div>
        `;
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:10px; color:${typeColor}; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px; display:inline-block;">${typeLabel}</div>
            
            <br>${visualHTML}
            
            <h3 style="color:var(--item-name-color); margin:0 0 15px 0; font-size:16px;">${title.toUpperCase()}</h3>
            
            <p style="font-size:12px; color:var(--text-color); margin-bottom: 20px; line-height: 1.6; text-align:left; background:rgba(0,0,0,0.4); padding:12px; border-left:2px solid ${typeColor};">
                "${desc}"
            </p>
            
            <div class="trade-math-area" style="text-align:left; margin-bottom:15px; background:var(--bg-color);">
                <div style="font-size:10px; color:#666; margin-bottom:5px; letter-spacing:1px;">MISSION PARAMETERS</div>
                ${objectiveDataHTML}
            </div>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Total Payout:</span> <span style="color:var(--gold-text); font-weight:bold; font-size:14px;">${formatNumber(reward)}c</span></div>
                <div class="trade-stat-row"><span>Experience Yield:</span> <span style="color:var(--success); font-weight:bold;">+${xp} XP</span></div>
            </div>
        </div>
    `;

    if (playerActiveMission) {
        actionsEl.innerHTML = `
            <button class="action-button" disabled style="opacity:0.5;">LIMIT: ONE ACTIVE CONTRACT</button>
            <button class="action-button" onclick="displayMissionBoard()">BACK TO LIST</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:${typeColor}; color:${typeColor}; box-shadow: 0 0 15px ${typeColor}44;" onclick="acceptMissionUI(${index})">
                SIGN CONTRACT
            </button>
            <button class="action-button" onclick="displayMissionBoard()">CANCEL</button>
        `;
    }
}

function acceptMissionUI(index) {
    // Re-use your flawless existing acceptMission logic!
    currentMissionContext.selectedMissionIndex = index;
    
    if (typeof acceptMission === 'function') {
        acceptMission(); 
        
        // Polish the UI output
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast("CONTRACT SIGNED", "success");
        
        displayMissionBoard(); // Refresh the board
        if (typeof renderUIStats === 'function') renderUIStats();
    } else {
        logMessage("Mission system offline.", "color:red");
    }
}

// ==========================================
// --- LEGENDARY BOUNTIES & EXOTIC LOOT ---
// ==========================================

// 1. Inject Exotic Weapons & Boss Ships into the existing Databases
if (typeof COMPONENTS_DATABASE !== 'undefined') {
    COMPONENTS_DATABASE['WEAPON_SINGULARITY_CANNON'] = {
        name: "Singularity Cannon", type: "weapon", slot: "weapon", manufacturer: "UNKNOWN",
        description: "Fires localized micro-black holes. Devastating hull damage. Prototype hardwired to ship.",
        cost: 999999, // Unbuyable in normal shops
        stats: { damage: 85, hitChance: 0.85, maxAmmo: 8 }
    };
    COMPONENTS_DATABASE['WEAPON_VOID_BEAM'] = {
        name: "K'tharr Void-Beam", type: "weapon", slot: "weapon", manufacturer: "KTHARR",
        description: "An experimental continuous beam weapon stolen by the Cartel. Melts shields instantly.",
        cost: 999999, 
        stats: { damage: 45, hitChance: 0.95, vsShieldBonus: 50, maxAmmo: 12 }
    };
}

if (typeof PIRATE_SHIP_CLASSES !== 'undefined') {
    PIRATE_SHIP_CLASSES['BOSS_VOSS'] = { id: "BOSS_VOSS", name: "The Butcher's Blade", baseHull: 400, baseShields: 150 };
    PIRATE_SHIP_CLASSES['BOSS_THORNE'] = { id: "BOSS_THORNE", name: "Rogue Aegis Interceptor", baseHull: 200, baseShields: 350 };
}

// 2. The Target Manifest
const LEGENDARY_BOUNTIES = {
    "DREAD_PIRATE_VOSS": {
        id: "DREAD_PIRATE_VOSS",
        name: "Voss 'The Butcher'",
        title: "Dread Pirate Voss",
        shipClassKey: "BOSS_VOSS", 
        description: "A ruthless Cartel enforcer wanted for the destruction of the orbital shipyards at Ceti Alpha. Highly armored. Approach with extreme caution.",
        reward: 15000,
        exclusiveDrop: "WEAPON_SINGULARITY_CANNON",
        minLevel: 1, // Kept at 1 so you can test it immediately!
        color: "var(--danger)"
    },
    "RENEGADE_COMMANDER": {
        id: "RENEGADE_COMMANDER",
        name: "Cmdr. Elias Thorne",
        title: "Renegade Aegis Commander",
        shipClassKey: "BOSS_THORNE", 
        description: "A former Concord hero who went rogue after a botched first contact mission. Heavily shielded and highly dangerous.",
        reward: 12000,
        exclusiveDrop: "WEAPON_VOID_BEAM",
        minLevel: 5,
        color: "var(--accent-color)"
    }
};

window.defeatedLegendaries = window.defeatedLegendaries || [];

// 3. The Bounty Board UI
function openLegendaryBounties() {
    openGenericModal("SEC-COM: HIGH VALUE TARGETS");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--danger); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">MOST WANTED</div>`;

    const playerLevelEstimate = Math.floor(playerXP / 100) + 1;

    for (const bossId in LEGENDARY_BOUNTIES) {
        const boss = LEGENDARY_BOUNTIES[bossId];
        
        if (window.defeatedLegendaries.includes(boss.id)) {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.opacity = '0.4';
            row.innerHTML = `<span style="color:#666; text-decoration:line-through;">${boss.title}</span> <span style="color:var(--success); font-size:10px;">DECEASED</span>`;
            listEl.appendChild(row);
        } else if (playerLevelEstimate >= boss.minLevel) {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <span style="color:${boss.color}; font-weight:bold; font-size:12px;">${boss.name}</span>
                    <span style="color:var(--gold-text); font-size:10px;">Bounty: ${formatNumber(boss.reward)}c</span>
                </div>
            `;
            row.onclick = () => showLegendaryDetails(bossId);
            listEl.appendChild(row);
        } else {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.opacity = '0.5';
            row.innerHTML = `
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <span style="color:var(--text-color); font-weight:bold; font-size:12px;">CLASSIFIED TARGET</span>
                    <span style="color:var(--danger); font-size:10px;">Clearance Level ${boss.minLevel} Required</span>
                </div>
            `;
            listEl.appendChild(row);
        }
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px var(--danger)); opacity:0.6;">🎯</div>
            <h3 style="color:var(--danger); margin-bottom:10px;">HIGH VALUE TARGETS</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                These bounties represent the most dangerous individuals in the sector. Concord SEC-COM authorizes extreme prejudice. 
                Targets are known to carry exotic, black-market armaments.
            </p>
        </div>
    `;

    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="openStationView()">RETURN TO CONCOURSE</button>`;
}

function showLegendaryDetails(bossId) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const boss = LEGENDARY_BOUNTIES[bossId];
    const weaponName = COMPONENTS_DATABASE[boss.exclusiveDrop]?.name || "Exotic Weapon";

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:10px; color:var(--danger); letter-spacing:2px; margin-bottom:5px;">WANTED: DEAD OR ALIVE</div>
            <h3 style="color:${boss.color}; margin:0 0 15px 0; letter-spacing: 1px;">${boss.title.toUpperCase()}</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 20px;">
                <div style="font-size:80px; filter: drop-shadow(0 0 15px ${boss.color}); opacity:0.8;">☠️</div>
            </div>

            <p style="color:var(--text-color); font-size:12px; line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${boss.color}; margin-bottom:20px; text-align:left;">
                "${boss.description}"
            </p>

            <div class="trade-math-area" style="text-align:left; background:rgba(0,0,0,0.5);">
                <div class="trade-stat-row"><span>Bounty Reward:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(boss.reward)}c</span></div>
                <div class="trade-stat-row"><span>Known Armament:</span> <span style="color:#FF33FF; font-weight:bold;">${weaponName}</span></div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button danger-btn" style="box-shadow: 0 0 10px rgba(255,0,0,0.2);" onclick="trackLegendaryTarget('${bossId}')">
            TRACK TARGET LOCATION
        </button>
        <button class="action-button" onclick="openLegendaryBounties()">CANCEL</button>
    `;
}

// 4. The Map Spawner
function trackLegendaryTarget(bossId) {
    const boss = LEGENDARY_BOUNTIES[bossId];
    
    // Spawn them 5 to 10 tiles away from the player's current location!
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.floor(Math.random() * 5);
    const bx = Math.floor(playerX + Math.cos(angle) * dist);
    const by = Math.floor(playerY + Math.sin(angle) * dist);
    
    if (typeof activeEnemies === 'undefined') window.activeEnemies = [];
    
    activeEnemies.push({
        x: bx,
        y: by,
        id: boss.id + "_" + Date.now(),
        type: 'BOSS',
        char: '☠️', // They get a literal skull on the map!
        color: boss.color,
        shipClassKey: boss.shipClassKey,
        isBoss: true,
        name: boss.title,
        
        // --- Combat Hooks ---
        isLegendary: true,
        exclusiveDrop: boss.exclusiveDrop,
        difficultyMultiplier: 1.5, // 50% harder than normal scaling
        reward: boss.reward 
    });
    
    logMessage(`<span style='color:${boss.color}; font-weight:bold;'>[ SEC-COM ALERT ]</span> ${boss.title} located at local coordinates [${bx}, ${by}]. Updating Nav-Computer.`);
    if (typeof showToast === 'function') showToast("TARGET LOCATED ON MAP", "warning");
    
    closeGenericModal();
    if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
    if (typeof render === 'function') render();
}

// ==========================================
// --- DEEP SPACE ASTRONOMY & PHENOMENA ---
// ==========================================

if (typeof COMMODITIES !== 'undefined') {
    // Existing Data
    COMMODITIES['DATA_PULSAR'] = { name: "Pulsar Timing Data", basePrice: 2500, illegal: false, description: "Precise millisecond pulsar telemetry." };
    COMMODITIES['DATA_MAGNETAR'] = { name: "Magnetar Harmonics", basePrice: 4000, illegal: false, description: "Raw magnetic field fluctuation data." };
    COMMODITIES['DATA_SINGULARITY'] = { name: "Singularity Telemetry", basePrice: 8500, illegal: false, description: "Gravitational lensing spectroscopy." };
    
    // NEW Data
    COMMODITIES['DATA_QUASAR'] = { name: "Quasar Spectrography", basePrice: 12000, illegal: false, description: "Incredibly rare relativistic jet measurements." };
    COMMODITIES['DATA_SUPERNOVA'] = { name: "Supernova Isotope Data", basePrice: 6000, illegal: false, description: "Measurements of heavy element nucleosynthesis." };
    COMMODITIES['TELEMETRY_PROBE'] = { name: "Autonomous Telemetry Probe", basePrice: 1500, illegal: false, description: "Deploy in deep space to passively gather valuable astrometric data over time." };
}

function handleAnomaly() { 
    openGenericModal("DEEP SPACE ASTROMETRICS");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = ''; 

    const phenomena = [
        // ... (Original 3: Pulsar, Magnetar, Singularity)
        {
            id: 'PULSAR', title: "MILLISECOND PULSAR", icon: "💫", color: "#00E0E0",
            desc: "A rapidly rotating neutron star emitting beams of intense electromagnetic radiation.",
            science: "Because of the conservation of angular momentum, it is spinning at hundreds of revolutions per second.",
            flavor: "You calibrate your ship's optical array to filter the blinding radiation.",
            actionLabel: "RECORD TIMING DATA (Risk Shields)",
            execute: () => resolvePhenomenon('PULSAR')
        },
        {
            id: 'MAGNETAR', title: "MAGNETAR FIELD", icon: "🧲", color: "#FF00FF",
            desc: "A rare neutron star with an overwhelmingly powerful magnetic field.",
            science: "Crustal stresses cause 'starquakes', releasing massive bursts of soft gamma repeaters.",
            flavor: "The magnetic shear is already causing your ship's hull to groan.",
            actionLabel: "CAPTURE HARMONICS (Risk Hull)",
            execute: () => resolvePhenomenon('MAGNETAR')
        },
        {
            id: 'SINGULARITY', title: "MICRO-SINGULARITY", icon: "⚫", color: "#9933FF",
            desc: "A localized, rogue black hole actively feeding on the interstellar medium.",
            science: "By skimming the ergosphere, you can theoretically extract rotational energy via the Penrose process.",
            flavor: "You route all auxiliary power to your thrusters.",
            actionLabel: "SKIM ERGOSPHERE (Risk Fuel & Hull)",
            execute: () => resolvePhenomenon('SINGULARITY')
        },
        // --- NEW PHENOMENA ---
        {
            id: 'QUASAR', title: "QUASAR JET", icon: "🎇", color: "var(--warning)",
            desc: "An active galactic nucleus powered by a supermassive black hole, firing a relativistic jet of plasma directly across your flight path.",
            science: "The jet is traveling at 99.9% the speed of light. Minor misalignment will instantly vaporize your vessel.",
            flavor: "Your proximity alarms are screaming. The sheer radiation output is scrambling your HUD.",
            actionLabel: "MEASURE RELATIVISTIC JET (High Risk)",
            execute: () => resolvePhenomenon('QUASAR')
        },
        {
            id: 'SUPERNOVA', title: "SUPERNOVA REMNANT", icon: "💥", color: "var(--danger)",
            desc: "The expanding shockwave of a detonated star, creating a vast, superheated cloud of ionized gas.",
            science: "The immense heat of the blast wave is actively forging heavy, rare-earth isotopes.",
            flavor: "You can plunge into the shockwave to physically scoop the heavy isotopes, but the thermal load will be immense.",
            actionLabel: "SCOOP ISOTOPES (Risk Hull)",
            execute: () => resolvePhenomenon('SUPERNOVA')
        },
        {
            id: 'WHITE_DWARF', title: "BINARY MERGER", icon: "✨", color: "var(--gold-text)",
            desc: "Two white dwarfs locked in a decaying orbit, spiraling toward a catastrophic merger.",
            science: "The orbital decay is emitting massive gravitational waves that are distorting spacetime around your ship.",
            flavor: "Your navigation computer struggles to compensate for the shifting geometry of space.",
            actionLabel: "RECORD GRAVITY WAVES",
            execute: () => resolvePhenomenon('WHITE_DWARF')
        }
    ];

    const encounter = phenomena[Math.floor(Math.random() * phenomena.length)];

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px ${encounter.color});">${encounter.icon}</div>
            <h3 style="color:${encounter.color}; margin-bottom:15px; letter-spacing: 2px;">${encounter.title}</h3>
            <div style="text-align:left; background:rgba(0,0,0,0.4); padding:15px; border-left:3px solid ${encounter.color}; margin-bottom:15px;">
                <p style="color:var(--text-color); font-size:13px; line-height:1.6; margin-top:0;">${encounter.desc}</p>
                <p style="color:var(--item-desc-color); font-size:12px; line-height:1.5; margin-bottom:0; font-style:italic;"><strong>Astrometrics:</strong> ${encounter.science}</p>
            </div>
            <p style="color:var(--accent-color); font-size:13px; line-height:1.5; padding: 0 10px;">${encounter.flavor}</p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:${encounter.color}; color:${encounter.color}; box-shadow: 0 0 10px ${encounter.color}44;" onclick="(${encounter.execute})()">${encounter.actionLabel}</button>
        <button class="action-button" onclick="evadeAnomaly()">ABORT AND RETREAT</button>
    `;
}

function resolvePhenomenon(type) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    let resultHtml = "";

    // Original 3 (Pulsar, Magnetar, Singularity)
    if (type === 'PULSAR') {
        if (Math.random() < 0.6) {
            playerShields -= 25;
            if (playerShields < 0) { playerHull += playerShields; playerShields = 0; }
            resultHtml += `<span style="color:var(--danger)">RADIATION SURGE!</span> Stripped <span style="color:var(--danger)">25 Shields</span>.<br><br>`;
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 0, reason: "Radiation Burst" });
        }
        playerCargo['DATA_PULSAR'] = (playerCargo['DATA_PULSAR'] || 0) + 1;
        playerXP += 100;
        resultHtml += `<span style="color:var(--success)">DATA ACQUIRED.</span> Gained <span style="color:var(--gold-text)">1x Pulsar Timing Data</span> and <span style="color:var(--success)">+100 XP</span>!`;
    } 
    else if (type === 'MAGNETAR') {
        const dmg = 15 + Math.floor(Math.random() * 20);
        playerHull -= dmg;
        resultHtml += `<span style="color:var(--danger)">STARQUAKE!</span> Hull takes <span style="color:var(--danger)">${dmg} damage</span>.<br><br>`;
        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: dmg, reason: "Magnetic Shear" });
        playerCargo['DATA_MAGNETAR'] = (playerCargo['DATA_MAGNETAR'] || 0) + 1;
        playerXP += 150;
        resultHtml += `<span style="color:var(--success)">HARMONICS RECORDED.</span> Gained <span style="color:var(--gold-text)">1x Magnetar Harmonics</span> and <span style="color:var(--success)">+150 XP</span>!`;
    }
    else if (type === 'SINGULARITY') {
        if (playerFuel < 50) {
            playerHull -= 50;
            resultHtml += `<span style="color:var(--danger)">INSUFFICIENT THRUST!</span> Took <span style="color:var(--danger)">50 damage</span>.<br><br>`;
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 50, reason: "Gravitational Shear" });
        } else {
            playerFuel -= 50;
            playerCargo['DATA_SINGULARITY'] = (playerCargo['DATA_SINGULARITY'] || 0) + 1;
            playerXP += 300;
            resultHtml += `<span style="color:var(--success)">TELEMETRY SECURED.</span> Gained <span style="color:#FF33FF">1x Singularity Telemetry</span> and <span style="color:var(--success)">+300 XP</span>!`;
        }
    }
    // NEW 3 (Quasar, Supernova, White Dwarf)
    else if (type === 'QUASAR') {
        if (Math.random() < 0.5) {
            playerHull -= 40;
            resultHtml += `<span style="color:var(--danger)">MISALIGNMENT!</span> The jet scorches your hull for <span style="color:var(--danger)">40 damage</span>.<br><br>`;
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 40, reason: "Relativistic Jet" });
        } else {
            playerCargo['DATA_QUASAR'] = (playerCargo['DATA_QUASAR'] || 0) + 1;
            playerXP += 400;
            resultHtml += `<span style="color:var(--success)">PERFECT ALIGNMENT.</span> Gained <span style="color:var(--gold-text)">1x Quasar Spectrography</span> and <span style="color:var(--success)">+400 XP</span>!`;
        }
    }
    else if (type === 'SUPERNOVA') {
        playerHull -= 20;
        playerCargo['DATA_SUPERNOVA'] = (playerCargo['DATA_SUPERNOVA'] || 0) + 1;
        playerCargo['RARE_METALS'] = (playerCargo['RARE_METALS'] || 0) + 3;
        playerXP += 200;
        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 20, reason: "Thermal Overload" });
        resultHtml += `<span style="color:var(--warning)">THERMAL OVERLOAD.</span> You scoop the plasma but take <span style="color:var(--danger)">20 damage</span>.<br>Gained <span style="color:var(--gold-text)">1x Supernova Data</span> and <span style="color:var(--accent-color)">3x Rare Metals</span>!`;
    }
    else if (type === 'WHITE_DWARF') {
        playerXP += 250;
        resultHtml += `<span style="color:var(--success)">GRAVITATIONAL WAVES RECORDED.</span> A completely safe, but awe-inspiring observation. Gained <span style="color:var(--success)">+250 XP</span>.`;
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    if (playerHull <= 0) {
        closeGenericModal();
        if (typeof triggerGameOver === 'function') triggerGameOver("Crushed by stellar forces.");
        return;
    }

    detailEl.innerHTML = `<div style="text-align:center; padding: 40px 20px;"><h3 style="color:var(--text-color); margin-bottom:20px;">OBSERVATION COMPLETE</h3><p style="font-size:14px; line-height:1.6; background:rgba(0,0,0,0.3); padding:15px; border-radius:4px;">${resultHtml}</p></div>`;
    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="closeGenericModal(); changeGameState(GAME_STATES.GALACTIC_MAP); render();">RESUME COURSE</button>`;
    
    if (typeof renderUIStats === 'function') renderUIStats();
}

function evadeAnomaly() {
    logMessage("<span style='color:var(--warning)'>You alter your heading to avoid the stellar phenomenon.</span>");
    closeGenericModal();
    if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
    if (typeof render === 'function') render();
}

// ==========================================
// --- AUTONOMOUS PROBES ---
// ==========================================

window.activeProbes = window.activeProbes || [];

// You can call this from the console for now, or we can bind it to a hotkey!
function deployProbe() {
    if (!playerCargo['TELEMETRY_PROBE'] || playerCargo['TELEMETRY_PROBE'] <= 0) {
        if (typeof showToast === 'function') showToast("No Probes in Cargo Hold!", "error");
        return;
    }
    
    const loc = chunkManager.getTile(playerX, playerY);
    if (loc && (loc.type === 'station' || loc.type === 'planet')) {
        if (typeof showToast === 'function') showToast("Interference too high. Deploy in Deep Space.", "warning");
        return;
    }
    
    playerCargo['TELEMETRY_PROBE']--;
    if (playerCargo['TELEMETRY_PROBE'] <= 0) delete playerCargo['TELEMETRY_PROBE'];
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    // Generate the ID once so it perfectly matches in both arrays!
    const probeId = "PROBE_" + Date.now();

    // Register the probe's logic
    window.activeProbes.push({
        x: playerX,
        y: playerY,
        id: probeId,
        deployedAt: currentGameDate,
        dataGathered: 0
    });

    // Spawn it as a friendly "Enemy" on the map so you can fly into it!
    if (typeof activeEnemies === 'undefined') window.activeEnemies = [];
    activeEnemies.push({
        x: playerX, y: playerY, id: probeId,
        char: '📡', color: '#00FF00', name: "Active Probe", isProbe: true
    });

    logMessage("<span style='color:var(--success)'>[ PROBE DEPLOYED ]</span> It will passively gather data over time.");
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    if (typeof render === 'function') render();
}

// Intercept the Combat Engine so when you bump into a Probe, it collects it instead of fighting it!
if (typeof window.startCombat === 'function' && !window._originalStartCombatForProbes) {
    window._originalStartCombatForProbes = window.startCombat;
    
    window.startCombat = function(specificEnemyEntity = null) {
        if (specificEnemyEntity && specificEnemyEntity.isProbe) {
            const probeIdx = window.activeProbes.findIndex(p => p.x === specificEnemyEntity.x && p.y === specificEnemyEntity.y);
            if (probeIdx > -1) {
                const probe = window.activeProbes[probeIdx];
                // Earn 1 random Data Drive for every 10 stardates it sat there
                const dataAmount = Math.floor((currentGameDate - probe.deployedAt) / 10);
                
                playerCargo['TELEMETRY_PROBE'] = (playerCargo['TELEMETRY_PROBE'] || 0) + 1; // Get probe back
                
                if (dataAmount > 0) {
                    const dataTypes = ['DATA_PULSAR', 'DATA_MAGNETAR', 'DATA_SINGULARITY'];
                    const dataId = dataTypes[Math.floor(Math.random() * dataTypes.length)];
                    playerCargo[dataId] = (playerCargo[dataId] || 0) + dataAmount;
                    logMessage(`<span style='color:var(--success)'>[ PROBE RECOVERED ]</span> Harvested ${dataAmount}x ${COMMODITIES[dataId].name}!`);
                } else {
                    logMessage("<span style='color:var(--warning)'>[ PROBE RECOVERED ]</span> Probe retrieved. Not enough time passed to gather data.");
                }
                
                if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                window.activeProbes.splice(probeIdx, 1);
                activeEnemies = activeEnemies.filter(e => e.id !== specificEnemyEntity.id);
                
                if (typeof soundManager !== 'undefined') soundManager.playGain();
                if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
                if (typeof render === 'function') render();
            }
            return; // Abort combat!
        }
        
        // Otherwise, run normal combat!
        window._originalStartCombatForProbes(specificEnemyEntity);
    };
}

// ==========================================
// --- SHIPBOARD SYNTHESIS (CRAFTING) ---
// ==========================================

// 1. Safely store bonuses in a variable we KNOW gets saved to localStorage!
function getCraftingBonuses() {
    if (!worldStateDeltas['CRAFTING_BONUSES']) {
        worldStateDeltas['CRAFTING_BONUSES'] = { hull: 0, shields: 0, fuel: 0, damage: 0 };
    }
    return worldStateDeltas['CRAFTING_BONUSES'];
}

// 2. Intercept applyPlayerShipStats to apply our permanent bonuses automatically
if (typeof window.applyPlayerShipStats === 'function' && !window._craftingApplyStatsHook) {
    window._craftingApplyStatsHook = window.applyPlayerShipStats;
    
    window.applyPlayerShipStats = function() {
        // Run the original stat calculations (and previous Crew hooks)
        window._craftingApplyStatsHook();
        
        // Apply permanent crafted bonuses!
        const bonuses = getCraftingBonuses();
        if (typeof MAX_PLAYER_HULL !== 'undefined') MAX_PLAYER_HULL += bonuses.hull;
        if (typeof MAX_SHIELDS !== 'undefined') MAX_SHIELDS += bonuses.shields;
        if (typeof MAX_FUEL !== 'undefined') MAX_FUEL += bonuses.fuel;
        if (typeof PLAYER_ATTACK_DAMAGE !== 'undefined') PLAYER_ATTACK_DAMAGE += bonuses.damage;
    };
}

function openCraftingMenu() {
    openGenericModal("ENGINEERING WORKBENCH");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const recipes = [
        { id: 'HEAL', name: "Field Repairs", desc: "Instantly patches 25 Hull integrity using raw minerals.", cost: { MINERALS: 10 }, effect: "Restore 25 Hull" },
        { id: 'MAX_HULL', name: "Reinforced Plating", desc: "Weld extra armor to the chassis.", cost: { MINERALS: 15, RARE_METALS: 2 }, effect: "+5 Max Hull (Permanent)" },
        { id: 'MAX_SHIELD', name: "Capacitor Overclock", desc: "Rewire the power grid for stronger baseline shields.", cost: { TECH_PARTS: 5, RARE_METALS: 1 }, effect: "+5 Max Shields (Permanent)" },
        { id: 'MAX_FUEL', name: "Fuel Compression", desc: "Enhance containment fields to hold more plasma.", cost: { TECH_PARTS: 5, VOID_CRYSTALS: 2 }, effect: "+10 Max Fuel (Permanent)" },
        { id: 'DAMAGE', name: "Weapon Calibration", desc: "Use alien telemetry to permanently tune weapon convergence.", cost: { ALIEN_SPECIMEN: 2, VOID_CRYSTALS: 5 }, effect: "+2 Base Damage (Permanent)" }
    ];

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">AVAILABLE SCHEMATICS</div>`;

    recipes.forEach((rec, idx) => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; gap: 4px;">
                <span style="color:var(--text-color); font-weight:bold; font-size:12px;">${rec.name}</span>
                <span style="color:var(--success); font-size:10px;">${rec.effect}</span>
            </div>
        `;
        row.onclick = () => showCraftingDetails(recipes, idx);
        listEl.appendChild(row);
    });

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px var(--accent-color)); opacity:0.7;">🛠️</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">SHIPBOARD SYNTHESIS</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Utilize the raw materials in your cargo hold to fabricate emergency supplies or permanently reinforce your vessel's subsystems.
            </p>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="closeGenericModal()">CLOSE WORKBENCH</button>`;
}

function showCraftingDetails(recipes, idx) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const rec = recipes[idx];

    let reqHtml = '';
    let canAfford = true;

    for (const [itemId, qty] of Object.entries(rec.cost)) {
        const itemName = typeof COMMODITIES !== 'undefined' && COMMODITIES[itemId] ? COMMODITIES[itemId].name : itemId;
        const have = playerCargo[itemId] || 0;
        const color = have >= qty ? 'var(--success)' : 'var(--danger)';
        if (have < qty) canAfford = false;

        reqHtml += `<div class="trade-stat-row">
            <span>${itemName}:</span> 
            <span style="color:${color}; font-weight:bold;">${have} / ${qty}</span>
        </div>`;
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:5px;">SYNTHESIS SCHEMATIC</div>
            <h3 style="color:var(--item-name-color); margin:0 0 15px 0; letter-spacing: 1px;">${rec.name.toUpperCase()}</h3>
            
            <p style="color:var(--text-color); font-size:12px; line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--accent-color); margin-bottom:20px; text-align:left;">
                "${rec.desc}"
            </p>

            <div class="trade-math-area" style="text-align:left;">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">REQUIRED MATERIALS</div>
                ${reqHtml}
            </div>
        </div>
    `;

    if (canAfford) {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2);" onclick="executeCrafting('${rec.id}', ${idx})">
                INITIATE SYNTHESIS
            </button>
            <button class="action-button" onclick="openCraftingMenu()">CANCEL</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" disabled>INSUFFICIENT MATERIALS</button>
            <button class="action-button" onclick="openCraftingMenu()">BACK</button>
        `;
    }
}

function executeCrafting(recipeId, idx) {
    // Quick rebuild of the recipe list to grab costs
    const recipes = [
        { id: 'HEAL', cost: { MINERALS: 10 } },
        { id: 'MAX_HULL', cost: { MINERALS: 15, RARE_METALS: 2 } },
        { id: 'MAX_SHIELD', cost: { TECH_PARTS: 5, RARE_METALS: 1 } },
        { id: 'MAX_FUEL', cost: { TECH_PARTS: 5, VOID_CRYSTALS: 2 } },
        { id: 'DAMAGE', cost: { ALIEN_SPECIMEN: 2, VOID_CRYSTALS: 5 } }
    ];
    
    const rec = recipes[idx];
    if (!rec || rec.id !== recipeId) return;

    // 1. Deduct Materials
    for (const [itemId, qty] of Object.entries(rec.cost)) {
        playerCargo[itemId] -= qty;
        if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
    }
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

    // 2. Apply Effect to Base Bonuses
    const bonuses = getCraftingBonuses();

    if (recipeId === 'MAX_HULL') bonuses.hull += 5;
    else if (recipeId === 'MAX_SHIELD') bonuses.shields += 5;
    else if (recipeId === 'MAX_FUEL') bonuses.fuel += 10;
    else if (recipeId === 'DAMAGE') bonuses.damage += 2;

    // 3. Force engine to recalculate MAX stats!
    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();

    // 4. NOW apply the current vitals heal, so the new MAX cap isn't violated
    if (recipeId === 'HEAL') {
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 25);
        logMessage("<span style='color:var(--success)'>[ SYNTHESIS ] Field repairs complete. Hull integrity restored (+25).</span>");
    } else if (recipeId === 'MAX_HULL') {
        playerHull += 5;
        logMessage("<span style='color:var(--success)'>[ SYNTHESIS ] Plating welded. Max Hull permanently increased!</span>");
    } else if (recipeId === 'MAX_SHIELD') {
        playerShields += 5;
        logMessage("<span style='color:var(--success)'>[ SYNTHESIS ] Capacitors upgraded. Max Shields permanently increased!</span>");
    } else if (recipeId === 'MAX_FUEL') {
        playerFuel += 10;
        logMessage("<span style='color:var(--success)'>[ SYNTHESIS ] Containment expanded. Max Fuel permanently increased!</span>");
    } else if (recipeId === 'DAMAGE') {
        logMessage("<span style='color:var(--success)'>[ SYNTHESIS ] Calibration successful. Base Weapon Damage permanently increased!</span>");
    }

    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
    if (typeof showToast === 'function') showToast("SYNTHESIS COMPLETE", "success");
    if (typeof renderUIStats === 'function') renderUIStats();
    
    openCraftingMenu(); // Refresh UI
}

// ==========================================
// --- PRECURSOR PUZZLE VAULTS ---
// ==========================================

// 1. High-Tier Vault Loot
if (typeof COMMODITIES !== 'undefined') {
    COMMODITIES['PRECURSOR_ARTIFACT'] = { name: "Precursor Artifact", basePrice: 15000, illegal: false, description: "A humming, geometric shape defying local physics." };
    COMMODITIES['VOID_ENGINE_CORE'] = { name: "Void Engine Core", basePrice: 25000, illegal: true, description: "A functioning zero-point energy source." };
}

// 2. The Vault Database (You can add as many of these as you want!)
const VAULT_PUZZLES = [
    {
        room: "THE VESTIBULE",
        text: "A massive door sealed by a light-matrix. An ancient inscription translates to: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind.'",
        answer: ["echo", "an echo"],
        penalty: 15,
        successText: "The light-matrix shifts from hostile red to a welcoming cyan. The heavy stone grinds open."
    },
    {
        room: "THE INNER SANCTUM",
        text: "The walls are lined with stasis pods containing terrifying, multi-limbed horrors. The console asks for the prime directive of the Architects: 'It dictates all, yet has no voice. It consumes all, yet never eats. It ends all, yet has no intent.'",
        answer: ["time", "entropy", "death"],
        penalty: 25,
        successText: "The stasis pods power down safely. A bridge of hard-light extends across the chasm."
    },
    {
        room: "THE APEX CORE",
        text: "The central vault. The final cipher shifts constantly on a floating monolith: 'The more you take, the more you leave behind.'",
        answer: ["footsteps", "footprints", "steps", "space"],
        penalty: 40,
        successText: "The ultimate mechanism unlocks, revealing the shimmering artifacts within."
    }
];

let currentVaultRoom = 0;

// 3. Vault UI Engine
function enterPrecursorVault() {
    currentVaultRoom = 0;
    renderVaultRoom();
}

function renderVaultRoom() {
    // Check for Victory!
    if (currentVaultRoom >= VAULT_PUZZLES.length) {
        openGenericModal("VAULT SECURED");
        document.getElementById('genericModalList').innerHTML = '';
        document.getElementById('genericDetailContent').innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <div style="font-size:60px; filter: drop-shadow(0 0 20px var(--success)); margin-bottom: 20px;">💠</div>
                <h3 style="color:var(--success);">SYSTEMS OVERRIDDEN</h3>
                <p style="color:var(--text-color); font-size:14px; line-height:1.6;">You have bypassed all security measures. The ancient technology is yours.</p>
            </div>
        `;
        
        // Grant Massive Rewards
        playerCargo['PRECURSOR_ARTIFACT'] = (playerCargo['PRECURSOR_ARTIFACT'] || 0) + 1;
        if (Math.random() > 0.4) playerCargo['VOID_ENGINE_CORE'] = (playerCargo['VOID_ENGINE_CORE'] || 0) + 1;
        playerXP += 1500;
        
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        if (typeof checkLevelUp === 'function') checkLevelUp();
        if (typeof soundManager !== 'undefined') soundManager.playGain();

        document.getElementById('genericModalActions').innerHTML = `<button class="action-button full-width-btn" onclick="closeGenericModal(); if(typeof renderUIStats === 'function') renderUIStats();">EXTRACT LOOT & DEPART</button>`;
        return;
    }

    const room = VAULT_PUZZLES[currentVaultRoom];
    openGenericModal(`PRECURSOR VAULT: ${room.room}`);
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = ''; // Hide left pane for immersive full-screen reading

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:50px; margin-bottom:15px; opacity:0.8; filter: drop-shadow(0 0 15px #9933FF);">🏛️</div>
            <h3 style="color:#9933FF; margin-bottom:15px; letter-spacing: 2px;">${room.room}</h3>
            
            <div style="background:rgba(0,0,0,0.5); border:1px solid #9933FF; padding:20px; border-radius:4px; text-align:left;">
                <p style="color:var(--text-color); font-size:14px; line-height:1.6; font-style:italic;">
                    "${room.text}"
                </p>
            </div>

            <div style="margin-top: 20px; text-align:left;">
                <span style="color:var(--danger); font-size:10px; letter-spacing:1px; display:block; margin-bottom:5px;">SECURITY OVERRIDE TERMINAL</span>
                <input type="text" id="vaultInput" autocomplete="off" placeholder="ENTER CIPHER..."
                    style="width:100%; background: #000; border: 1px solid #9933FF; color: #DDA0DD; padding: 10px; font-family: 'Roboto Mono', monospace; font-size: 14px; outline: none; text-transform: uppercase;" 
                    onkeydown="if(event.key === 'Enter') submitVaultCipher()">
            </div>
            <div id="vaultFeedback" style="margin-top: 15px; font-weight:bold; font-size:12px; min-height:20px;"></div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:#9933FF; color:#9933FF; box-shadow: 0 0 10px rgba(153,51,255,0.2);" onclick="submitVaultCipher()">SUBMIT CIPHER</button>
        <button class="action-button danger-btn" onclick="abortVault()">EVACUATE VAULT</button>
    `;

    // Focus input automatically
    setTimeout(() => {
        const input = document.getElementById('vaultInput');
        if (input) input.focus();
    }, 100);
}

function submitVaultCipher() {
    const inputEl = document.getElementById('vaultInput');
    const feedbackEl = document.getElementById('vaultFeedback');
    if (!inputEl || !feedbackEl) return;

    const guess = inputEl.value.trim().toLowerCase();
    if (guess === "") return;

    const room = VAULT_PUZZLES[currentVaultRoom];
    
    let isCorrect = false;
    if (Array.isArray(room.answer)) {
        isCorrect = room.answer.includes(guess);
    } else {
        isCorrect = (guess === room.answer.toLowerCase());
    }

    if (isCorrect) {
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        feedbackEl.style.color = "var(--success)";
        feedbackEl.innerHTML = `[ CIPHER ACCEPTED ]<br><span style="color:var(--text-color); font-weight:normal;">${room.successText}</span>`;
        inputEl.disabled = true;
        
        setTimeout(() => {
            currentVaultRoom++;
            renderVaultRoom();
        }, 3000);
    } else {
        if (typeof soundManager !== 'undefined') soundManager.playError();
        if (typeof triggerHaptic === 'function') triggerHaptic(300);
        
        playerHull -= room.penalty;
        feedbackEl.style.color = "var(--danger)";
        feedbackEl.innerHTML = `[ INCORRECT ] LETHAL DEFENSES ACTIVATED. HULL INTEGRITY -${room.penalty}`;
        
        // Clear the input so they can guess again quickly
        inputEl.value = "";
        
        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 0, reason: "Vault Defenses" });
        if (typeof renderUIStats === 'function') renderUIStats();
        
        if (playerHull <= 0) {
            closeGenericModal();
            if (typeof triggerGameOver === 'function') triggerGameOver("Disintegrated by Precursor Defenses");
        }
    }
}

function abortVault() {
    logMessage("<span style='color:var(--warning)'>You retreat to your ship, leaving the vault's mysteries unsolved.</span>");
    closeGenericModal();
}

// ==========================================
// --- SUBSPACE ROUTING (WORMHOLES) ---
// ==========================================

function traverseWormhole() {
    const tile = chunkManager.getTile(playerX, playerY);
    if (getTileChar(tile) !== WORMHOLE_CHAR_VAL) {
        logMessage("No stable wormhole detected at these coordinates.");
        return;
    }

    // 1. Register this wormhole as discovered!
    // We save it to worldStateDeltas so it permanently persists in the player's save file!
    updateWorldState(playerX, playerY, { 
        isDiscoveredWormhole: true, 
        customName: `Fracture Node [${Math.abs(playerX % 100)}-${Math.abs(playerY % 100)}]` 
    });

    // 2. Gather all known wormholes from the save state
    const knownWormholes = [];
    for (const key in worldStateDeltas) {
        if (worldStateDeltas[key].isDiscoveredWormhole) {
            // Keys are formatted as "X,Y"
            const coords = key.split('_')[0].split(',');
            const x = parseInt(coords[0], 10);
            const y = parseInt(coords[1], 10);
            
            if (!isNaN(x) && !isNaN(y)) {
                knownWormholes.push({
                    x: x, 
                    y: y, 
                    name: worldStateDeltas[key].customName || `Anomaly [${x}, ${y}]`
                });
            }
        }
    }

    // 3. Open the UI Modal
    openGenericModal("SUBSPACE ROUTING SYSTEM");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">STABLE FRACTURES</div>`;

    if (knownWormholes.length <= 1) {
        listEl.innerHTML += `<div style="padding:15px; color:var(--item-desc-color); font-size:12px; line-height:1.5;">No other stable subspace fractures have been mapped yet. Explore the galaxy to establish a network.</div>`;
    }

    knownWormholes.forEach(wh => {
        const isCurrent = (wh.x === playerX && wh.y === playerY);
        const dist = Math.floor(Math.sqrt(Math.pow(wh.x - playerX, 2) + Math.pow(wh.y - playerY, 2)));
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = isCurrent ? 'default' : 'pointer';
        row.style.opacity = isCurrent ? '0.5' : '1';
        
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; gap: 4px;">
                <span style="color:${isCurrent ? '#888' : '#FFB800'}; font-weight:bold; font-size:12px;">${wh.name}</span>
                <span style="color:var(--item-desc-color); font-size:10px;">${isCurrent ? 'CURRENT LOCATION' : `Distance: ${dist}ly`}</span>
            </div>
        `;
        
        if (!isCurrent) {
            row.onclick = () => showWormholeDetails(wh, dist);
        }
        listEl.appendChild(row);
    });

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px #FFB800); opacity:0.8;">🌀</div>
            <h3 style="color:#FFB800; margin-bottom:10px;">WORMHOLE NETWORK</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Select a mapped subspace fracture to initiate a high-velocity transit. 
                Warning: Subspace traversal is highly unstable. Hull damage may occur based on distance.
            </p>
        </div>
    `;

    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="closeGenericModal()">ABORT JUMP</button>`;
}

function showWormholeDetails(targetWh, distance) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Fuel cost: Flat fee + small distance scaling, highly efficient compared to normal flight
    const fuelCost = Math.floor(15 + (distance * 0.05)); 
    const canAfford = playerFuel >= fuelCost;
    
    // Damage Risk: Scales with distance, maxes out at 75%
    const damageRisk = Math.min(75, Math.floor(5 + (distance * 0.02))); 

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:10px; color:#FFB800; letter-spacing:2px; margin-bottom:5px;">TARGET LOCK ESTABLISHED</div>
            <h3 style="color:var(--item-name-color); margin:0 0 15px 0; letter-spacing: 1px;">${targetWh.name}</h3>
            
            <div style="position:relative; display:inline-block; margin-bottom: 20px;">
                <div style="font-size:60px; filter: drop-shadow(0 0 20px #FFB800);">🌌</div>
            </div>

            <div class="trade-math-area" style="text-align:left; background:rgba(0,0,0,0.5);">
                <div class="trade-stat-row">
                    <span>Coordinates:</span> 
                    <span style="color:var(--accent-color); font-weight:bold;">[${targetWh.x}, ${-targetWh.y}]</span>
                </div>
                <div class="trade-stat-row">
                    <span>Fuel Requirement:</span> 
                    <span style="color:${canAfford ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${fuelCost} Units</span>
                </div>
                <div class="trade-stat-row" style="margin-top: 10px; border-top: 1px dashed #333; padding-top: 10px;">
                    <span>Structural Risk:</span> 
                    <span style="color:var(--warning); font-weight:bold;">${damageRisk}% Chance of Damage</span>
                </div>
            </div>
        </div>
    `;

    if (canAfford) {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:#FFB800; color:#FFB800; box-shadow: 0 0 15px rgba(255, 184, 0, 0.3);" onclick="executeWormholeJump(${targetWh.x}, ${targetWh.y}, ${fuelCost}, ${damageRisk})">
                INITIATE JUMP
            </button>
            <button class="action-button" onclick="traverseWormhole()">CANCEL</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" disabled>INSUFFICIENT FUEL</button>
            <button class="action-button" onclick="traverseWormhole()">BACK</button>
        `;
    }
}

function executeWormholeJump(targetX, targetY, fuelCost, damageRisk) {
    playerFuel -= fuelCost;
    
    // 1. Resolve structural damage before moving
    let damageLog = "";
    if (Math.random() * 100 < damageRisk) {
        const dmg = Math.floor(Math.random() * 25) + 10; // 10 to 35 damage
        damageLog = `<br><span style="color:var(--danger)">Subspace turbulence caused ${dmg} hull damage!</span>`;
        
        // This will deduct health and trigger screen shake perfectly
        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: dmg, reason: "Wormhole Collapse" });
    } else {
        damageLog = `<br><span style="color:var(--success)">Transit completed with zero structural anomalies.</span>`;
    }

    // Trigger Visual Warp Effect
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.classList.remove('warp-effect');
        void canvas.offsetWidth; // Magic trick to restart CSS animation instantly
        canvas.classList.add('warp-effect');
    }

    // 2. Move Player
    playerX = targetX;
    playerY = targetY;

    // 3. Force map chunk cache clear so the destination renders instantly!
    chunkManager.loadedChunks = {}; 
    chunkManager.lastChunkKey = null;
    chunkManager.lastChunkRef = null;
    updateSectorState();
    
    // 4. Progress Time (Fast travel still takes some time!)
    if (typeof processGameTick === 'function') processGameTick(0.5, true); 

    // 5. UI Updates
    if (typeof soundManager !== 'undefined') soundManager.playWarp();
    if (typeof showToast === 'function') showToast("SUBSPACE JUMP COMPLETE", "warning");
    
    logMessage(`<span style="color:#FFB800">[ SUBSPACE TRANSIT ] Arrived at destination coordinates.</span>${damageLog}`);

    closeGenericModal();
    if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
    if (typeof render === 'function') render();
    if (typeof renderUIStats === 'function') renderUIStats();
    
    // Always auto-save after a massive jump!
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// ==========================================
// --- COLONY CRISES & BOOMS ---
// ==========================================

const COLONY_EVENTS = [
    {
        id: "PIRATE_RAID",
        title: "COLONY UNDER ATTACK",
        icon: "☠️",
        color: "var(--danger)",
        getText: (colony) => `Emergency hail from ${colony.name}! An Eclipse Cartel raiding party has breached the outer perimeter. The militia is holding them back, but they need immediate support!`,
        choices: [
            {
                label: "WIRE RANSOM FUNDS (5,000c)",
                condition: () => playerCredits >= 5000,
                execute: (colony) => {
                    playerCredits -= 5000;
                    logMessage(`<span style='color:var(--warning)'>[ COLONY ] You wired 5,000c to the raiders. They took the credits and left ${colony.name} alone.</span>`);
                    closeGenericModal();
                }
            },
            {
                label: "IGNORE THE HAIL (Lose Hab Module)",
                condition: () => true,
                execute: (colony) => {
                    // Correctly targets the suppliesDelivered object
                    if (colony.suppliesDelivered.habModules > 0) colony.suppliesDelivered.habModules--;
                    logMessage(`<span style='color:var(--danger)'>[ COLONY ] The raiders bombarded ${colony.name}, destroying a Habitation Module before Concord authorities arrived.</span>`);
                    closeGenericModal();
                }
            }
        ]
    },
    {
        id: "RESOURCE_BOOM",
        title: "DEEP VEIN DISCOVERED",
        icon: "💎",
        color: "var(--gold-text)",
        getText: (colony) => `Great news from ${colony.name}, Commander! Our automated excavators just broke through into a massive, previously undetected vein of rare materials!`,
        choices: [
            {
                label: "ACKNOWLEDGE (Yield Increased)",
                condition: () => true,
                execute: (colony) => {
                    if (!colony.inventory) colony.inventory = {};
                    colony.inventory['RARE_METALS'] = (colony.inventory['RARE_METALS'] || 0) + 15;
                    colony.inventory['VOID_CRYSTALS'] = (colony.inventory['VOID_CRYSTALS'] || 0) + 2;
                    logMessage(`<span style='color:var(--success)'>[ COLONY ] ${colony.name} successfully extracted the deep vein materials! They are waiting in the colony storage.</span>`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    closeGenericModal();
                }
            }
        ]
    },
    {
        id: "MEDICAL_EMERGENCY",
        title: "OUTBREAK DETECTED",
        icon: "☣️",
        color: "var(--success)", 
        getText: (colony) => `Priority alert from ${colony.name}! A dormant, indigenous pathogen has infected the water supply. We desperately need Medical Supplies!`,
        choices: [
            {
                label: "TRANSFER 5 MEDICAL SUPPLIES",
                condition: () => (playerCargo['MEDICAL_SUPPLIES'] || 0) >= 5,
                execute: (colony) => {
                    playerCargo['MEDICAL_SUPPLIES'] -= 5;
                    if (playerCargo['MEDICAL_SUPPLIES'] <= 0) delete playerCargo['MEDICAL_SUPPLIES'];
                    playerXP += 200;
                    logMessage(`<span style='color:var(--success)'>[ COLONY ] You remotely deployed Medical Supplies to ${colony.name}. The outbreak is contained! (+200 XP)</span>`);
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    closeGenericModal();
                }
            },
            {
                label: "INITIATE QUARANTINE (Production Halted)",
                condition: () => true,
                execute: (colony) => {
                    colony.quarantined = true; 
                    logMessage(`<span style='color:var(--warning)'>[ COLONY ] You ordered ${colony.name} into strict quarantine. The population will survive, but production will suffer for a time.</span>`);
                    closeGenericModal();
                }
            }
        ]
    }
];

function triggerColonyEvent(colony) {
    const event = COLONY_EVENTS[Math.floor(Math.random() * COLONY_EVENTS.length)];
    
    openGenericModal("INCOMING TRANSMISSION");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = ''; 

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px ${event.color});">${event.icon}</div>
            <h3 style="color:${event.color}; margin-bottom:15px; letter-spacing: 2px;">${event.title}</h3>
            
            <div style="text-align:left; background:rgba(0,0,0,0.5); padding:20px; border-left:3px solid ${event.color}; margin-bottom:15px; border-radius:4px;">
                <p style="color:var(--text-color); font-size:14px; line-height:1.6; margin:0;">
                    ${event.getText(colony)}
                </p>
            </div>
        </div>
    `;

    actionsEl.innerHTML = '';
    
    event.choices.forEach(choice => {
        if (choice.condition()) {
            const btn = document.createElement('button');
            btn.className = 'action-button';
            btn.style.width = '100%';
            btn.style.marginBottom = '10px';
            btn.innerHTML = choice.label;
            
            if (choice.label.includes("Lose") || choice.label.includes("Halted") || choice.label.includes("IGNORE")) {
                btn.style.borderColor = "var(--danger)";
                btn.style.color = "var(--danger)";
            } else if (choice.label.includes("TRANSFER") || choice.label.includes("ACKNOWLEDGE")) {
                btn.style.borderColor = "var(--success)";
                btn.style.color = "var(--success)";
            }

            btn.onclick = () => {
                choice.execute(colony);
                if (typeof renderUIStats === 'function') renderUIStats();
                if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
                if (typeof render === 'function') render();
            };
            actionsEl.appendChild(btn);
        }
    });
    
    if (typeof soundManager !== 'undefined') soundManager.playWarning();
}

// ==========================================
// --- SHIPBOARD SYNTHESIS (CRAFTING) ---
// ==========================================

const CRAFTING_RECIPES = {
    TELEMETRY_PROBE: {
        targetId: "TELEMETRY_PROBE",
        name: "Telemetry Probe",
        icon: "🛰️",
        desc: "A single-use sensor probe for mapping deep space anomalies and gathering passive data.",
        yield: 1,
        ingredients: { 'TECH_PARTS': 2, 'MINERALS': 3 }
    },
    PRECURSOR_CIPHER: {
        targetId: "PRECURSOR_CIPHER",
        name: "Precursor Cipher",
        icon: "🔑",
        desc: "A quantum decryption key. Crucial for cracking Encrypted Engrams without paying a Cryptarch.",
        yield: 1,
        ingredients: { 'TECH_PARTS': 4, 'RARE_METALS': 2, 'VOID_CRYSTALS': 1 }
    },
    MEDICAL_SUPPLIES: {
        targetId: "MEDICAL_SUPPLIES",
        name: "Medical Supplies",
        icon: "⚕️",
        desc: "Synthesize trauma kits and stims. Highly valued during colony outbreaks.",
        yield: 1,
        ingredients: { 'GENETIC_SAMPLES': 2, 'FOOD_SUPPLIES': 1 }
    },
    FUEL_CELLS: {
        targetId: "FUEL_CELLS",
        name: "Emergency Fuel Cells",
        icon: "🔋",
        desc: "Refine raw minerals into low-grade hydrogen fuel.",
        yield: 10,
        ingredients: { 'MINERALS': 5 }
    },
    HULL_PATCH: {
        targetId: "NANO_REPAIR_KIT",
        name: "Nano-Repair Kit",
        icon: "🔧",
        desc: "Synthesize a portable canister of smart-matter. Can be used from your cargo hold to repair 25 Hull Integrity.",
        yield: 1,
        ingredients: { 'MINERALS': 4, 'TECH_PARTS': 2 }
    }
};

function openCraftingMenu() {
    openGenericModal("SHIPBOARD SYNTHESIS");
    renderCraftingList();
}

function renderCraftingList() {
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">AVAILABLE SCHEMATICS</div>`;
    
    for (const key in CRAFTING_RECIPES) {
        const recipe = CRAFTING_RECIPES[key];
        
        // Evaluate if the player has enough raw materials
        let canCraft = true;
        for (const req in recipe.ingredients) {
            if ((playerCargo[req] || 0) < recipe.ingredients[req]) {
                canCraft = false;
                break;
            }
        }
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.style.opacity = canCraft ? '1' : '0.4'; // Dim uncraftable items
        row.style.borderLeft = canCraft ? '3px solid var(--accent-color)' : '3px solid transparent';
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap: 10px;">
                <span style="font-size:18px;">${recipe.icon}</span>
                <span style="color:${canCraft ? 'var(--item-name-color)' : 'var(--item-desc-color)'}; font-weight:bold; font-size:13px;">${recipe.name.toUpperCase()}</span>
            </div>
        `;
        row.onclick = () => showCraftingDetails(key, canCraft);
        listEl.appendChild(row);
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; opacity:0.3; filter: drop-shadow(0 0 15px var(--accent-color));">⚗️</div>
            <h3 style="color:var(--text-color); margin-bottom:10px; letter-spacing:2px;">FABRICATOR IDLE</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.6;">
                Select a schematic from the manifest to review required materials and initiate molecular synthesis.
            </p>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="closeGenericModal()">CLOSE TERMINAL</button>`;
}

function showCraftingDetails(recipeKey, canCraft) {
    const recipe = CRAFTING_RECIPES[recipeKey];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    let reqHtml = '';
    for (const req in recipe.ingredients) {
        const need = recipe.ingredients[req];
        const have = playerCargo[req] || 0;
        const hasEnough = have >= need;
        
        // Fetch the beautiful name from the COMMODITIES database
        const itemDef = typeof COMMODITIES !== 'undefined' && COMMODITIES[req] ? COMMODITIES[req] : { name: req };
        
        reqHtml += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; border-bottom:1px dashed #333; padding-bottom:4px;">
                <span style="color:var(--text-color);">${itemDef.name}</span>
                <span style="color:${hasEnough ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${have} / ${need}</span>
            </div>
        `;
    }

    // Special text for instant healing
    const yieldText = recipe.targetId === "INSTANT_HEAL" 
        ? `<span style="color:var(--success);">Repairs ${recipe.yield} Hull Integrity</span>`
        : `<span style="color:var(--gold-text);">Yields: ${recipe.yield}x ${recipe.name}</span>`;

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px; filter: drop-shadow(0 0 10px var(--accent-color));">${recipe.icon}</div>
            <h3 style="color:var(--accent-color); margin:0; letter-spacing:1px;">${recipe.name.toUpperCase()}</h3>
            <p style="font-size:12px; color:var(--item-desc-color); margin:15px 0; line-height:1.5;">${recipe.desc}</p>
            
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:15px; border-radius:4px; text-align:left;">
                <div style="color:var(--text-color); font-size:11px; margin-bottom:12px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid var(--accent-color); padding-bottom:5px;">REQUIRED MATERIALS:</div>
                ${reqHtml}
                <div style="margin-top:15px; text-align:right; font-size:12px; font-weight:bold;">
                    ${yieldText}
                </div>
            </div>
        </div>
    `;

    if (canCraft) {
        // Prevent healing if hull is already full
        if (recipe.targetId === "INSTANT_HEAL" && playerHull >= MAX_PLAYER_HULL) {
            actionsEl.innerHTML = `
                <button class="action-button" disabled style="opacity:0.5;">HULL ALREADY AT MAXIMUM</button>
                <button class="action-button" onclick="renderCraftingList()">BACK</button>
            `;
        } else {
            actionsEl.innerHTML = `
                <button class="action-button" style="border-color:var(--success); color:var(--success); box-shadow: 0 0 15px rgba(0,255,0,0.2);" onclick="executeCrafting('${recipeKey}')">
                    INITIATE SYNTHESIS
                </button>
                <button class="action-button" onclick="renderCraftingList()">CANCEL</button>
            `;
        }
    } else {
        actionsEl.innerHTML = `
            <button class="action-button danger-btn" disabled>INSUFFICIENT MATERIALS</button>
            <button class="action-button" onclick="renderCraftingList()">BACK</button>
        `;
    }
}

function executeCrafting(recipeKey) {
    const recipe = CRAFTING_RECIPES[recipeKey];
    
    // 1. Deduct ingredients
    for (const req in recipe.ingredients) {
        playerCargo[req] -= recipe.ingredients[req];
        if (playerCargo[req] <= 0) delete playerCargo[req];
    }
    
    // 2. Grant the product or effect
    if (recipe.targetId === "INSTANT_HEAL") {
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + recipe.yield);
        logMessage(`<span style="color:var(--success)">[ SYNTHESIS ] Nano-sealant deployed. Hull integrity restored by ${recipe.yield}.</span>`);
        if (typeof showToast === 'function') showToast("HULL REPAIRED", "success");
    } else {
        playerCargo[recipe.targetId] = (playerCargo[recipe.targetId] || 0) + recipe.yield;
        logMessage(`<span style="color:var(--success)">[ SYNTHESIS ] Successfully fabricated ${recipe.yield}x ${recipe.name}.</span>`);
        if (typeof showToast === 'function') showToast("SYNTHESIS COMPLETE", "success");
    }
    
    // 3. Update global UI and dependencies
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate(); 
    
    // 4. Re-evaluate if they can craft it again and refresh the panel
    let canCraft = true;
    for (const req in recipe.ingredients) {
        if ((playerCargo[req] || 0) < recipe.ingredients[req]) {
            canCraft = false;
            break;
        }
    }
    
    showCraftingDetails(recipeKey, canCraft);
}
