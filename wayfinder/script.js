// ==========================================
// --- SHARED MODULE UI & GAME STATES ---
// ==========================================

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

    // --- THE FIX ---
    // Override the default two-column flex layout and enable scrolling.
    modalContent.style.cssText = "display: block; overflow-y: auto;";

    // Dynamically choose between the image portrait or the ASCII character
    let imageHtml = '';
    if (npc.image) {
        // Use the image portrait
        imageHtml = `
            <img src="${npc.image}" alt="${npc.name}" 
                 style="width: 120px; height: 120px; border-radius: 50%; border: 2px solid ${npc.color}; 
                        object-fit: cover; object-position: top; margin-bottom: 15px; background: #000; 
                        box-shadow: 0 0 15px ${npc.color};">
        `;
    } else {
        // Fallback to the ship character
        imageHtml = `
            <div style="font-size:60px; margin-bottom:15px; color:${npc.color}; text-shadow: 0 0 15px ${npc.color};">${npc.char}</div>
        `;
    }

    // Procedural telemetry data (this part remains the same)
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

    // Render the modal (this part remains the same)
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

            <div class="trade-btn-group" style="margin-top: 20px; width: 100%; display: flex; gap: 10px;">
                <button class="action-button" onclick="closeGenericModal()" style="flex: 1;">
                    MAINTAIN COURSE
                </button>
                <button class="action-button danger-btn" onclick="commitPiracy(${index})" style="flex: 1;">
                    POWER WEAPONS
                </button>
            </div>
        </div>
    `;
}

let visitedSectors;

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

// ==========================================
// --- COLONY BUILDER STATE ---
// ==========================================

// Tracks if the player has legally purchased the right to settle
let playerHasColonyCharter = false; 

// The main object tracking the player's settlement
let playerColony = {
    established: false,
    name: "Unclaimed Settlement",
    x: null,
    y: null,
    planetName: null,
    biome: null,
    
    // PROGRESSION PHASES: "SURVEYED" -> "OUTPOST" -> "POPULATED" -> "OPERATIONAL"
    phase: "NONE", 
    
    population: 0,
    morale: 100,
    
    // Track what supplies have been delivered to construct the base
    suppliesDelivered: {
        habModules: 0,
        atmosProcessors: 0
    }
};


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
    
    // 2. The Invisible Quest Hook
    // If they have the charter in their hold, but haven't formally started the quest:
    if (playerCargo["COLONY_CHARTER"] > 0 && !playerHasColonyCharter) {
        playerHasColonyCharter = true;
        
        // Fire off the ceremonial Pioneer notifications!
        if (typeof showToast === 'function') showToast("CONCORD PIONEER STATUS GRANTED", "success");
        logMessage("<span style='color:var(--gold-text); font-weight:bold;'>QUEST UPDATE:</span> You are now a legally recognized Pioneer of the Concord Dominion. Find a habitable world to establish your settlement.");
        if (typeof soundManager !== 'undefined' && soundManager.playBuy) soundManager.playBuy();
    }

    // 3. Update the UI
    GameBus.emit('UI_REFRESH_REQUESTED');
});

// Whenever vitals, credits, or stats change, refresh the UI
GameBus.on('UI_REFRESH_REQUESTED', () => {
    if (typeof renderUIStats === 'function') renderUIStats();
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
        // Perform a final clear/draw only if we are currently looking at the map
        if (currentGameState === GAME_STATES.GALACTIC_MAP) {
            render(); 
        }
        return;
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

    // Only redraw the screen if we are actually looking at the Galactic Map.
    // This prevents the game from trying to re-render the System Map or Planet View 
    // repeatedly (which causes UI freezing and high CPU usage).
    if (currentGameState === GAME_STATES.GALACTIC_MAP) {
        render(); 
    }
    
    // Continue the loop
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
                         ...location,       // 1. Spread location data first (including type: '#')
                         char: location.type, // 2. Ensure char is set
                         type: 'location'   // 3. FORCE type to 'location' so interaction works
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
         const MAX_CHUNK_DIST = 5; // Keep 5 chunks in every direction (approx 80 tiles)
         const keys = Object.keys(this.loadedChunks);
         let prunedCount = 0;

         keys.forEach(key => {
             const [cx, cy] = key.split(',').map(Number);
             const dist = Math.sqrt(Math.pow(cx - playerChunkX, 2) + Math.pow(cy - playerChunkY, 2));

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

 let currentGameState;

 let playerAbilityCooldown = 0; // Turns until ability is ready

 let playerX, playerY, playerFuel, playerCredits, playerShields;
 let playerShip;
 let playerNotoriety;
 let playerNotorietyTitle;
 let playerIsChargingAttack;
 let playerIsEvading;

 let worldStateDeltas = {};

 function performGarbageCollection() {
    const keys = Object.keys(worldStateDeltas);
    let cleanedCount = 0;
    
    // --- NEW: Thresholds for Memory Management ---
    const MAX_DELTAS = 1000;
    const isBloated = keys.length > MAX_DELTAS;

    keys.forEach(key => {
        const delta = worldStateDeltas[key];

        // SAFETY CHECK: Never delete critical story/lore flags
        if (delta.activated || delta.studied || delta.isUnique) {
            return; 
        }

        // 1. Standard Time Check
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

 let playerLevel;
 let playerXP;
 let xpToNextLevel;

 let currentShipyardContext = null;

 const SECTOR_SIZE = 480; // Let's say a sector is a 160x160 tile area.
 let currentSectorX, currentSectorY;

 let playerCargo = {};
 let currentCargoLoad = 0;

 const TILE_SIZE = 32;

 let gameCanvas, ctx; // For our new canvas

 const MAX_LOG_MESSAGES = 50; // The maximum number of messages to keep in the log
 let messageLog = []; // This array will hold our message history

 let currentTradeItemIndex = -1;
 let currentTradeQty = 1;

 let currentTradeContext = null;
 let currentCombatContext = null;
 let currentOutfitContext = null;
 let currentMissionContext = null;
 let playerActiveMission = null;
 let missionsAvailableAtStation = [];
 let MISSIONS_DATABASE = {};

 let scannedObjectTypes;
 let discoveredLocations;
 let playerCompletedMissions;


 let currentQuantityInput = "";

 let discoveredLoreEntries;
 let currentEncounterContext = null;

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

    // 1. Calculate Percentages for Bars
    const fuelPct = Math.max(0, (playerFuel / MAX_FUEL) * 100);
    const shieldPct = Math.max(0, (playerShields / MAX_SHIELDS) * 100);
    const hullPct = Math.max(0, (playerHull / MAX_PLAYER_HULL) * 100);

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
     
    if (exactFaction === "KTHARR") { factionName = "Hegemony"; fColor = "#00FF44"; }
    else if (exactFaction === "CONCORD") { factionName = "Concord"; fColor = "#00AAFF"; }
    else if (exactFaction === "ECLIPSE") { factionName = "Cartel"; fColor = "#FF4444"; }

    const dist = Math.sqrt((playerX * playerX) + (playerY * playerY));
    let threat = "SAFE";
    let threatColor = "#00FF00"; 
     
    if (dist > 2000) { threat = "DEADLY"; threatColor = "#FF0000"; } 
    else if (dist > 1200) { threat = "HIGH"; threatColor = "#FF5555"; } 
    else if (dist > 600) { threat = "MODERATE"; threatColor = "#FFFF00"; } 

    if (sectorNameStatElement) {
        sectorNameStatElement.innerHTML = `${currentSectorName} <span style="color:${fColor}; opacity:0.9;">[${factionName}]</span> <span style="color:${threatColor}; font-size: 0.8em; margin-left: 8px;">[${threat}]</span>`;
        sectorNameStatElement.style.color = "#00E0E0"; 
    }
     
    if (sectorCoordsStatElement) sectorCoordsStatElement.textContent = `[${playerX}, ${-playerY}]`;

    // 6. Log Handling
    if (messageAreaElement) {
        messageAreaElement.innerHTML = messageLog.join('<br>');
        messageAreaElement.scrollTop = 0;
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
     playerNotoriety += amount;
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

function unlockLoreEntry(entryKey, silent = false) {
     if (LORE_DATABASE[entryKey] && !discoveredLoreEntries.has(entryKey)) {
         discoveredLoreEntries.add(entryKey);
         LORE_DATABASE[entryKey].unlocked = true;
         
         // Only print to the log if we aren't using the silent override
         if (!silent) {
            logMessage(`<span style='color:#A2D2FF;'>Codex Updated: ${LORE_DATABASE[entryKey].title}</span>`, true);
         }
     }
 }

 let WORLD_SEED;
 let systemCache = {};
 let currentSystemData;
 let currentGameDate;

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

    // 3. Player State Reset
    playerX = Math.floor(MAP_WIDTH / 2);
    playerY = Math.floor(MAP_HEIGHT / 2);

    currentSectorX = Math.floor(playerX / SECTOR_SIZE);
    currentSectorY = Math.floor(playerY / SECTOR_SIZE);
    currentSectorName = generateSectorName(currentSectorX, currentSectorY);

    playerShip = {
        shipClass: "LIGHT_FREIGHTER",
        components: {
            weapon: "WEAPON_PULSE_LASER_MK1",
            shield: "SHIELD_BASIC_ARRAY_A",
            engine: "ENGINE_STD_DRIVE_MK1",
            scanner: "SCANNER_BASIC_SUITE",
            utility: "UTIL_NONE"
        },
        ammo: {}
    };

    // Initialize Ammo if applicable
    const startingWeapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    if (startingWeapon.stats.maxAmmo) {
        playerShip.ammo[playerShip.components.weapon] = startingWeapon.stats.maxAmmo;
    }

    applyPlayerShipStats(); // Calculates MAX values based on components
    
    playerFuel = MAX_FUEL;
    playerCredits = INITIAL_CREDITS;
    playerHull = MAX_PLAYER_HULL;
    playerShields = MAX_SHIELDS;
    playerNotoriety = 0;

    // --- Reset Faction Standing ---
    playerFactionStanding = {
        "CONCORD": 0,
        "KTHARR": 0,
        "INDEPENDENT": 0,
        "ECLIPSE": 0 
    };

    updateNotorietyTitle();
    playerActiveMission = null;
    currentMissionContext = null;

    playerLevel = 1;
    playerXP = 0;
    xpToNextLevel = calculateXpToNextLevel(playerLevel);
    
    // Add starting sector to visited
    visitedSectors.add("0,0");
    currentGameDate = 2458.0;

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

        html += `
           <div onclick="selectPlanet(${index})" ondblclick="examinePlanet(${index})" 
                style="border: ${borderStyle}; background: ${bgStyle}; padding: 15px; border-radius: 8px; text-align: center; flex: 1; min-width: 140px; max-width: 220px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s;">
               
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

     // First, select the planet so the highlight appears correctly
     selectedPlanetIndex = index;

     // Now, perform the examine logic
     const planet = currentSystemData.planets[index];
     let scanReport = `Scan of Planet ${index + 1} (${planet.biome.name}):\n`;
     scanReport += `${planet.biome.description}\n`;
     scanReport += `Potential Resources: ${planet.biome.resources.join(', ')}`;

     // logMessage will call render() for us, which will update the screen.
     logMessage(scanReport);
 }

 function renderGalacticMap() {
    // --- 1. Check Theme Status ---
    const isLightMode = document.body.classList.contains('light-mode');

    // --- 2. Calculate Camera Position ---
    const halfViewW = Math.floor(VIEWPORT_WIDTH_TILES / 2);
    const halfViewH = Math.floor(VIEWPORT_HEIGHT_TILES / 2);
    let camX = playerX - halfViewW;
    let camY = playerY - halfViewH;

    // --- 3. Clear Canvas & Reset Alignment ---
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Enforce center alignment every frame so symbols stay locked to their grid cells
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // --- 4A. DRAW FACTION BACKGROUNDS (LAYER 0) ---
    if (sensorPulseActive) {
        const pulseIntensity = (1 - (sensorPulseRadius / MAX_PULSE_RADIUS)) * 0.2;
        ctx.fillStyle = isLightMode 
            ? `rgba(0, 119, 119, ${0.05 + pulseIntensity})` 
            : `rgba(0, 40, 40, ${0.4 + pulseIntensity})`;
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    } else {
        ctx.fillStyle = isLightMode ? '#FFFFFF' : '#000000';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    }

    const tileSize = TILE_SIZE;
    
    for (let y = 0; y < VIEWPORT_HEIGHT_TILES; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH_TILES; x++) {
            const worldX = Math.floor(camX + x);
            const worldY = Math.floor(camY + y);
            
            // --- FACTION LAYER ---
            const factionKey = getFactionAt(worldX, worldY);
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
            const hazard = getHazardType(worldX, worldY);
            if (hazard === 'RADIATION_BELT') {
                ctx.fillStyle = isLightMode ? 'rgba(255, 80, 0, 0.15)' : 'rgba(255, 165, 0, 0.25)';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                
                if (Math.random() < 0.06) {
                    ctx.fillStyle = isLightMode ? '#FF3300' : '#FFAA00';
                    ctx.fillRect((x * tileSize) + Math.random()*tileSize, (y * tileSize) + Math.random()*tileSize, 2, 2);
                }
            }
        }
    }

    // --- 4B. DRAW TILES & OBJECTS (LAYER 1) ---
    for (let y = 0; y < VIEWPORT_HEIGHT_TILES; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH_TILES; x++) {
            const worldX = Math.floor(camX + x);
            const worldY = Math.floor(camY + y);

            const tileData = chunkManager.getTile(worldX, worldY);
            const tileChar = getTileChar(tileData);

            // --- XERXES SPECIAL RENDER ---
            if (tileData && tileData.name && tileData.name.includes("Xerxes")) {
                ctx.save();
                const pulse = (Math.sin(Date.now() / 500) + 1) / 2;
                ctx.shadowBlur = 20 + (pulse * 10);
                ctx.shadowColor = '#8A2BE2'; 
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
                ctx.shadowBlur = 25 + (pulse * 15);
                ctx.shadowColor = '#FFD700';
                ctx.fillStyle = '#FFAA00'; 
                const sizeMod = 1.1 + (pulse * 0.1);
                ctx.font = `bold ${TILE_SIZE * sizeMod}px 'Orbitron', monospace`;
                ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2);
                ctx.restore();
                continue; 
            }

            // Custom colored tiles
            if (tileData && tileData.customColor) {
                ctx.save();
                const pulse = (Math.sin(Date.now() / 600) + 1) / 2;
                ctx.shadowBlur = 12 + (pulse * 8);
                ctx.shadowColor = tileData.customColor;
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
                    const visualStarData = generateStarData(worldX, worldY);
                    
                    let starColor = visualStarData.color;
                    if (typeof isLightMode !== 'undefined' && isLightMode) {
                        if (visualStarData.class === "A") starColor = "#444444";       
                        else if (visualStarData.class === "F") starColor = "#999900";  
                        else if (visualStarData.class === "B") starColor = "#3355BB";  
                        else if (visualStarData.class === "O") starColor = "#0033AA";  
                    }
                    
                    ctx.fillStyle = starColor; 
                    if (visualStarData.class === "O" || visualStarData.class === "B") {
                        ctx.shadowBlur = (typeof isLightMode !== 'undefined' && isLightMode) ? 5 : 15;
                        ctx.shadowColor = starColor;
                    } else {
                        ctx.shadowBlur = (typeof isLightMode !== 'undefined' && isLightMode) ? 0 : 5; 
                        ctx.shadowColor = starColor;
                    }
                    break;
                case PLANET_CHAR_VAL: ctx.fillStyle = '#88CCFF'; break;
                case STARBASE_CHAR_VAL: 
                    ctx.save();
                    const pulse = (Math.sin(Date.now() / 300) + 1) / 2; 
                    ctx.shadowBlur = 15 + (pulse * 15); 
                    ctx.shadowColor = '#00FFFF'; 
                    ctx.fillStyle = '#00FFFF';
                    const sizeMod = 1.0 + (pulse * 0.1); 
                    ctx.font = `bold ${TILE_SIZE * 1.3 * sizeMod}px 'Orbitron', monospace`;
                    ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                    ctx.restore(); 
                    break;
                case OUTPOST_CHAR_VAL: ctx.fillStyle = '#AADD99'; break;
                case ASTEROID_CHAR_VAL: ctx.fillStyle = '#FFAA66'; break;
                case NEBULA_CHAR_VAL: ctx.fillStyle = '#DD99FF'; break;
                case DERELICT_CHAR_VAL: ctx.fillStyle = '#88AACC'; break;
                case ANOMALY_CHAR_VAL: ctx.fillStyle = '#FF33FF'; break;
                case WORMHOLE_CHAR_VAL: ctx.fillStyle = '#FFB800'; break;
                case NEXUS_CHAR_VAL: ctx.fillStyle = '#40E0D0'; break;
                case PIRATE_CHAR_VAL: ctx.fillStyle = '#FF5555'; break;
                case EMPTY_SPACE_CHAR_VAL:
                default:
                    ctx.fillStyle = isLightMode ? '#444455' : '#909090';
                    break;
            }

            if (tileChar !== STARBASE_CHAR_VAL) {
                ctx.fillText(tileChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }
            
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0; 
            
        } 
    } 

    // --- 5. Draw Dynamic Entities (LAYER 2) ---
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

    // --- NEW: BOUNTY TRACKING RETICLE ---
    if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty !== null) {
        const screenX = playerActiveBounty.x - camX;
        const screenY = playerActiveBounty.y - camY;

        // Draw only if it is currently inside the camera's view
        if (screenX >= 0 && screenX < VIEWPORT_WIDTH_TILES && screenY >= 0 && screenY < VIEWPORT_HEIGHT_TILES) {
            const pixelX = screenX * TILE_SIZE;
            const pixelY = screenY * TILE_SIZE;
            
            ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 300));
            // Ensure brackets draw relative to the top-left of the tile
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.4 + (pulse * 0.6)})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'var(--danger)';
            
            const m = 4; // Margin outside the tile
            const s = TILE_SIZE;
            ctx.beginPath();
            // Top Left
            ctx.moveTo(pixelX - m + 8, pixelY - m);
            ctx.lineTo(pixelX - m, pixelY - m);
            ctx.lineTo(pixelX - m, pixelY - m + 8);
            // Bottom Left
            ctx.moveTo(pixelX - m, pixelY + s + m - 8);
            ctx.lineTo(pixelX - m, pixelY + s + m);
            ctx.lineTo(pixelX - m + 8, pixelY + s + m);
            // Top Right
            ctx.moveTo(pixelX + s + m - 8, pixelY - m);
            ctx.lineTo(pixelX + s + m, pixelY - m);
            ctx.lineTo(pixelX + s + m, pixelY - m + 8);
            // Bottom Right
            ctx.moveTo(pixelX + s + m, pixelY + s + m - 8);
            ctx.lineTo(pixelX + s + m, pixelY + s + m);
            ctx.lineTo(pixelX + s + m - 8, pixelY + s + m);
            
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw Particles
    activeParticles.forEach(p => {
        const screenX = (p.x - camX) * TILE_SIZE;
        const screenY = (p.y - camY) * TILE_SIZE;
        if (screenX >= -TILE_SIZE && screenX <= gameCanvas.width && screenY >= -TILE_SIZE) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life; 
            ctx.fillRect(screenX, screenY, p.size, p.size);
            ctx.globalAlpha = 1.0; 
        }
    });

    // Draw Enemies (Updated for Bounty Support)
    activeEnemies.forEach(enemy => {
        const screenX = (enemy.x - camX) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (enemy.y - camY) * TILE_SIZE + TILE_SIZE / 2;
        if (screenX >= -TILE_SIZE && screenX <= gameCanvas.width && screenY >= -TILE_SIZE && screenY <= gameCanvas.height) {
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
            if (screenX >= -TILE_SIZE && screenX <= gameCanvas.width && screenY >= -TILE_SIZE && screenY <= gameCanvas.height) {
                ctx.save();
                ctx.fillStyle = npc.color; 
                ctx.shadowBlur = 10;
                ctx.shadowColor = npc.color;
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

    // --- 6. Update UI Stats ---
    document.getElementById('versionInfo').textContent = `Wayfinder: Echoes of the Void - ${GAME_VERSION}`;
    if (typeof renderUIStats === 'function') renderUIStats();
}

// ==========================================
// --- QoL: RE-ENTER / DOCK AT CURRENT TILE ---
// ==========================================
function reEnterCurrentTile() {
    // 1. Only allow this if we are actively flying on the map
    if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') {
        return; 
    }

    // THE FIX: Fetch the tile first, then pass it to the global helper function
    const tileData = chunkManager.getTile(playerX, playerY);
    const tileChar = getTileChar(tileData);

    // 2. Check if there is actually something interactable here
    if (tileChar === '#' || tileChar === 'O' || tileChar === OUTPOST_CHAR_VAL || (tileData && tileData.name)) {
        
        if (typeof soundManager !== 'undefined') soundManager.playUIClick();
        if (typeof showToast === 'function') showToast("DOCKING SEQUENCE INITIATED", "info");
        
        // 3. Re-trigger your main interaction loop
        if (typeof handleInteraction === 'function') {
            handleInteraction(); 
        }

        // 4. Force the visual station view to open if it's a major hub
        if (tileChar === '#' && typeof openStationView === 'function') {
            openStationView();
        }

    } else {
        // Player pushed the button in empty space
        if (typeof showToast === 'function') showToast("NO DOCKING TARGET DETECTED", "warning");
        logMessage("Sensors detect only empty space here. Nothing to interact with.");
    }
}

function processLootTable(tableName) {
    const table = LOOT_TABLES[tableName];
    if (!table) return;

    const outcome = getWeightedRandomOutcome(table);
    logMessage(outcome.text);

    // Handle specific outcome types
    if (outcome.type === "ITEM") {
        const qty = outcome.min + Math.floor(Math.random() * (outcome.max - outcome.min + 1));
        const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        const actualQty = Math.min(qty, spaceLeft);

        if (actualQty > 0) {
            playerCargo[outcome.id] = (playerCargo[outcome.id] || 0) + actualQty;
            updateCurrentCargoLoad();
            logMessage(`Received: ${actualQty} x ${COMMODITIES[outcome.id].name}`, true);
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
        playerHull -= outcome.damage;
        triggerDamageEffect(); // Uses your visual FX!
        if (playerHull < 1) playerHull = 1;
    }
    else if (outcome.type === "TRAP_PIRATE") {
        startCombat();
    }
    
    renderUIStats();
}

let currentSectorName = "Sol Sector"; // Changed to let


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

 function getCombinedLocationData(y, x) {
     // Get the tile data from the chunk manager at the player's coordinates
     const tileObject = chunkManager.getTile(x, y);

     // Check if the tile is a location type (starbase, planet, etc.)
     if (tileObject && tileObject.type === 'location') {
         return tileObject; // Return the location data object
     }

     // If it's not a location, return null
     return null;
 }

 function movePlayer(dx, dy) {
     // 1. Check for blocking UI states
     if (currentTradeContext || currentOutfitContext || currentMissionContext || currentEncounterContext || currentShipyardContext) {
         logMessage("Complete current action first.");
         return;
     }

     // 2. Check for Combat
     if (currentCombatContext) {
         logMessage("In combat! (F)ight or (R)un.");
         return;
     }

     // 3. Calculate Fuel Cost
     // We define this early so we can check if you can afford the move
     const currentEngine = COMPONENTS_DATABASE[playerShip.components.engine];
     let actualFuelPerMove = BASE_FUEL_PER_MOVE * (currentEngine.stats.fuelEfficiency || 1.0);

     // --- PERK HOOK ---
        if (playerPerks.has('EFFICIENT_THRUSTERS')) {
            actualFuelPerMove *= 0.8; // 20% reduction
        }

    // 4. Check Fuel Availability
    if (playerFuel < actualFuelPerMove && (dx !== 0 || dy !== 0)) {
        triggerHaptic(200);
        logMessage("<span style='color:red'>CRITICAL: OUT OF FUEL! Engines offline.</span>");
        
        // Spawn the interactive buttons on the bottom right!
        const strandedActions = [
            { label: 'Distress Beacon', key: 'z', onclick: activateDistressBeacon },
            { label: 'Drift & Wait', key: '.', onclick: playerWaitTurn },
            { label: 'Self Destruct', key: 'x', onclick: confirmSelfDestruct }
        ];
        renderContextualActions(strandedActions);
        
        return;
    }

     // 5. Update Player Coordinates
     playerX += dx;
     playerY += dy;

     // 6. Deduct Fuel and Advance Time
     if (dx !== 0 || dy !== 0) {

        currentStationRecruits = []; 

        playerFuel -= actualFuelPerMove;
        playerFuel = parseFloat(playerFuel.toFixed(1)); 
        if (playerFuel < 0) playerFuel = 0;
        
        advanceGameTime(0.01); // Time passes when you move

        // --- Thruster Particles ---
        // Spawn particles behind the ship (opposite to dx, dy)
        spawnParticles(playerX - dx, playerY - dy, 'thruster', { x: dx, y: dy });

        // --- HAZARD EFFECTS ---
        const hazard = getHazardType(playerX, playerY);
        const hasRadShield = playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY';

        if (hazard === 'RADIATION_BELT' && !hasRadShield) {
            if (playerShields > 0) {
                playerShields = Math.max(0, playerShields - 1.5); // Minor shield drain
                // 10% chance to log so it doesn't spam the feed every step
                if (Math.random() < 0.10) {
                    logMessage("<span style='color:#FFAA00'>Dosimeters detect Ionized Radiation Belt. Shields degrading.</span>");
                }
            } else {
                 playerFuel = Math.max(0, playerFuel - 0.5); // Nuisance fuel drain if shields are down
                 if (Math.random() < 0.15) {
                     logMessage("<span style='color:#FF5555'>Radiation interfering with plasma injectors. Excess fuel consumed.</span>");
                 }
            }
            
            // Random chance to trigger the UI screen shake/red flash effect
            if (Math.random() < 0.1 && typeof triggerDamageEffect === 'function') {
                triggerDamageEffect();
            }
        }
     }

     // 7. Update Sector Information
     updateSectorState();

     // Only run this occasionally to save CPU (e.g., every time we cross a chunk boundary)
    // or just run it every move (it's fast enough for simple 2D arrays).
    const pCX = Math.floor(playerX / chunkManager.CHUNK_SIZE);
    const pCY = Math.floor(playerY / chunkManager.CHUNK_SIZE);
    chunkManager.pruneChunks(pCX, pCY);
     
     // 8. Move Enemies
     // This makes every pirate on the map take a step towards you
     if (typeof updateEnemies === "function") {
         updateEnemies();
     }

     // --- UPDATE & MOVE AMBIENT TRAFFIC ---
     if (typeof updateAmbientNPCs === "function") {
         updateAmbientNPCs();
     }

     // --- SPAWN AMBIENT TRAFFIC ---
     // 5% chance per tile moved to spawn a new neutral ship nearby
     if (Math.random() < 0.05 && typeof spawnAmbientNPCs === "function") {
         spawnAmbientNPCs();
     }

     // 9. Check for Collision (Did you run into them, or did they catch you?)
     // We filter to see if any enemy is NOW at your location
     if (typeof activeEnemies !== 'undefined') {
         const enemyAtLoc = activeEnemies.find(e => e.x === playerX && e.y === playerY);
         if (enemyAtLoc) {
             // --- HAPTIC FEEDBACK: COLLISION ---
             triggerHaptic(200);

             startCombat(enemyAtLoc);
             // Remove the map icon since we are now "in" the combat screen
             removeEnemyAt(playerX, playerY);
             return; 
         }
     }

     // 10. Handle Random Events (Spawn Pirate OR Goodies OR Normal)
     const encounterRoll = Math.random();

     if (encounterRoll < PIRATE_ENCOUNTER_CHANCE) {
         // Spawn a pirate nearby to chase the player
         if (typeof spawnPirateNearPlayer === "function") {
             spawnPirateNearPlayer();
         } else {
             startCombat(); // Fallback to instant combat if function missing
         }
     } else if (encounterRoll < PIRATE_ENCOUNTER_CHANCE + 0.015) {
         // Good Luck: 1.5% Chance for Space Debris
         triggerRandomEvent();
     } else {
         // Normal: Just look at the tile (Planet? Star? Empty?)
         handleInteraction();
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

        // --- 4. GENERIC LOCATION FALLBACK ---
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
        // --- 5. DEEP SPACE PHENOMENA ---
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
                
                // 3. Deep Scoop
                availableActions.push({ 
                    label: `Deep Scoop (${starData.scoopYield} Fuel)`, 
                    key: 'h', 
                    onclick: () => {
                        if (starData.class === "O" || starData.class === "B") {
                            const util = COMPONENTS_DATABASE[playerShip.components.utility || "UTIL_NONE"];
                            if (!util || !util.radImmunity) {
                                playerHull -= 20;
                                if (typeof triggerHaptic === 'function') triggerHaptic(200);
                                logMessage("<span style='color:var(--danger);'>Radiation shielding breached! Hull integrity compromised while scooping.</span>");
                            }
                        }
                        if (playerFuel < MAX_FUEL) {
                            playerFuel = Math.min(MAX_FUEL, playerFuel + starData.scoopYield);
                            if (typeof showToast === 'function') showToast(`SCOOPED +${starData.scoopYield} HYDROGEN`, "info");
                            logMessage(`Successfully harvested ${starData.scoopYield} units of coronal plasma.`);
                            if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                            if (typeof advanceGameTime === 'function') advanceGameTime(1.0);
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
                if (tile && tile.mined) {
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
                bM = `You've entered the unstable anomaly!`;
                if (tileObject.studied) bM = "This anomaly has dissipated.";
                else handleAnomalyEncounter(tileObject); 
                unlockLoreEntry("XENO_ANOMALIES");
                break;
            case DERELICT_CHAR_VAL:
                unlockLoreEntry("XENO_DERELICTS");
                
                // NATIVE FIX: Render the button before opening the view!
                availableActions.push({ label: 'Board Derelict', key: 'e', onclick: openDerelictView });
                if (typeof renderContextualActions === 'function') renderContextualActions(availableActions);

                openDerelictView();
                return; // Stop processing generic text logs
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
    
    // 1. Get 3 Random Perks (that we don't already have)
    const availablePerks = Object.values(PERKS_DATABASE).filter(p => !playerPerks.has(p.id));
    
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
        
        // Check in case they had enough banked XP for multiple level ups at once
        checkLevelUp(); 
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
    
    logMessage(`<span style="color:#FFD700">UPGRADE INSTALLED: ${PERKS_DATABASE[perkId].name}</span>`);
    showToast(`${PERKS_DATABASE[perkId].name} Acquired!`, 'success');
    
    document.getElementById('levelUpOverlay').style.display = 'none';
    
    // Resume Game
    changeGameState(GAME_STATES.GALACTIC_MAP);
    renderUIStats();
    saveGame(); // Auto-save on level up
    checkLevelUp();
}

/**
 * Procedurally generates environmental hazards using continuous wave noise.
 */

function getHazardType(worldX, worldY) {
    // --- SPAWN PROTECTION ---
    // Ensure the immediate starting area is always free of hazards
    const spawnX = Math.floor(MAP_WIDTH / 2);
    const spawnY = Math.floor(MAP_HEIGHT / 2);
    const distFromSpawn = Math.sqrt(Math.pow(worldX - spawnX, 2) + Math.pow(worldY - spawnY, 2));
    
    // Guarantees a completely clear 25-tile radius around the starting point
    if (distFromSpawn < 25) {
        return null; 
    }

    const scale = 0.08; 
    
    // Combine sine and cosine waves to create organic, blob-like structures
    const noise = Math.sin(worldX * scale) + Math.cos(worldY * scale) + Math.sin((worldX + worldY) * scale * 0.5);
    
    // Threshold: 2.4 makes these zones very rare and scattered
    if (noise > 2.4) {
        return 'RADIATION_BELT';
    }
    
    return null; // Safe space
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

    // 4. Territory Check
    if (effectiveX < -22) return 'ECLIPSE';
    if (effectiveX > 22) return 'KTHARR';
    
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
    // 1. Check if the lore exists in the database
    if (!LORE_DATABASE[loreId]) {
        console.warn(`Attempted to unlock missing lore ID: ${loreId}`);
        return;
    }

    // 2. Check if the player already has it
    if (discoveredLoreEntries.has(loreId)) {
        return; // Already unlocked, do nothing silently
    }

    // 3. Unlock it!
    discoveredLoreEntries.add(loreId);
    
    // 4. Notify the player
    showToast(`CODEX UPDATED: ${LORE_DATABASE[loreId].title}`, "info");
    logMessage(`<span style="color:var(--accent-color)">> NEW ARCHIVE ENTRY UNLOCKED: ${LORE_DATABASE[loreId].title}</span>`);
    
    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
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

function findNearestStation(px, py) {
    let nearest = null;
    let minDist = Infinity;

    if (typeof LOCATIONS_DATA !== 'undefined') {
        for (const key in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[key];
            if (loc.type === '#' || loc.type === 'O' || loc.type === OUTPOST_CHAR_VAL) {
                const dist = Math.sqrt(Math.pow(px - loc.coords.x, 2) + Math.pow(py - loc.coords.y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    nearest = { name: key, x: loc.coords.x, y: loc.coords.y };
                }
            }
        }
    }
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
    openGenericModal("INCOMING TRANSMISSION");
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Adjust layout width for a "View Screen" feel
    listEl.style.flex = "0 0 35%";
    detailEl.style.flex = "1";

    // --- LEFT PANE: PORTRAIT & DATA ---
    listEl.innerHTML = `
        <div style="text-align:center; padding: 20px 10px;">
            <img src="assets/fuel_rats.png" alt="Fuel Rat Dispatcher" 
                 onerror="this.src='assets/default_npc.png'"
                 style="width:120px; height:120px; object-fit:cover; border-radius:50%; border:2px solid var(--warning); box-shadow: 0 0 20px rgba(255,170,0,0.3); background:#000; margin-bottom:15px; image-rendering: pixelated;">
            
            <h3 style="color:var(--warning); margin:0 0 5px 0;">DISPATCHER 'ROOK'</h3>
            <div style="color:var(--item-desc-color); font-size:11px; letter-spacing:2px; margin-bottom: 15px;">THE MISCHIEF</div>
            
            <div style="background:rgba(255,170,0,0.1); border:1px solid var(--warning); padding:10px; border-radius:4px; text-align:left; font-size:11px; color:var(--text-color);">
                <strong style="color:var(--warning)">TUG:</strong> Modified Hauler<br>
                <strong style="color:var(--warning)">STATUS:</strong> Docked at ${rescueTargetStation.name}<br>
                <strong style="color:var(--warning)">MOTTO:</strong> "We have fuel. You don't."
            </div>
        </div>
    `;

    // --- RIGHT PANE: DIALOGUE & ADVICE ---
    let dialogue = "";
    let receiptHtml = "";

    if (freebieUsed && rescueFeePaid === 0) {
        dialogue = `"Look at you, floating out there with empty pockets and dead engines. Lucky for you, the Mischief doesn't leave spacers to die. We towed you to <strong>${rescueTargetStation.name}</strong> on the house. Consider it a charity case."`;
        receiptHtml = `<span style="color:var(--success); font-weight:bold;">TOW & FUEL WAIVED (CHARITY)</span>`;
    } else if (freebieUsed) {
        dialogue = `"Scraping the bottom of the barrel, eh? We took the last <strong>${rescueFeePaid}c</strong> you had to your name and dragged you to <strong>${rescueTargetStation.name}</strong>. You're broke, but you're alive."`;
        receiptHtml = `<span style="color:var(--danger); font-weight:bold;">ALL REMAINING FUNDS SEIZED (-${rescueFeePaid}c)</span>`;
    } else {
        dialogue = `"Tractor beam disengaged. We've deposited your hull at <strong>${rescueTargetStation.name}</strong>. Try to keep an eye on your gauges next time, Commander. Space is too big to fly blind."`;
        receiptHtml = `<span style="color:var(--danger); font-weight:bold;">TOW & FUEL FEE: -${rescueFeePaid}c</span>`;
    }

    detailEl.innerHTML = `
        <div style="padding: 15px;">
            <h2 style="color:var(--warning); margin-top:0; border-bottom:1px solid #333; padding-bottom:10px;">RESCUE COMPLETE</h2>
            
            <div style="background: rgba(0,0,0,0.5); border-left: 3px solid var(--warning); padding: 15px; margin-bottom: 20px; font-style: italic; color: #FFF; line-height: 1.6;">
                ${dialogue}
            </div>

            <div style="background:var(--bg-color); border:1px dashed var(--border-color); padding: 15px; border-radius: 4px; margin-bottom:20px;">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px;">TRANSACTION RECEIPT</div>
                ${receiptHtml}
            </div>

            <h4 style="color:var(--accent-color); font-size:12px; margin-bottom:8px; border-bottom: 1px solid #333; padding-bottom:4px;">RAT'S ADVICE: AVOIDING DEAD ENGINES</h4>
            <ul style="color:var(--item-desc-color); font-size:13px; line-height:1.6; padding-left:20px; margin:0;">
                <li>Always top off your tanks at the <strong>Refuel</strong> terminal when docked.</li>
                <li>Install a <strong>Dosimetry Array</strong> utility module to safely scoop fuel from bright O & B class stars without melting your hull.</li>
                <li>Press <strong>(H)</strong> while parked directly on a Star or Nebula to emergency siphon hydrogen.</li>
            </ul>
        </div>
    `;

    renderFuelRatActions();
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
    
    // Advance Time
    advanceGameTime(0.15); 
    
    // The World Keeps Moving!
    if (typeof updateEnemies === "function") updateEnemies();
    if (typeof updateAmbientNPCs === "function") updateAmbientNPCs();
    
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
    const currentLocation = getCombinedLocationData(playerY, playerX);
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
            case 'space':
                const currentTileForE = chunkManager.getTile(playerX, playerY);
                if (!currentTileForE) return true;
                
                // 1. Station & Hub Routing
                if (currentTileForE.isMajorHub || currentTileForE.char === OUTPOST_CHAR_VAL) {
                    if (typeof performCustomsScan === 'function' && currentTileForE.isMajorHub) {
                        if (!performCustomsScan()) return true; // Stop if they fail customs!
                    }
                    openStationView();
                } 
                // 2. Planetary Routing
                else if (currentTileForE.char === 'O' || (currentTileForE.name && currentTileForE.name.toLowerCase().includes("planet")) || currentTileForE.biome) {
                    openPlanetView(currentTileForE);
                } 
                // 3. Xerxes/Black Market Routing
                else if (currentTileForE.name && currentTileForE.name.includes("Xerxes")) {
                    if (typeof openXerxesView === 'function') openXerxesView();
                }
                return true;
            case 'c':
                if (playerActiveMission && playerActiveMission.type === "DELIVERY") {
                    handleCompleteDelivery();
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
                // If docked, V goes to the Cantina
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
            
        case 'e': {
            const currentTile = chunkManager.getTile(playerX, playerY);
            // Safely get the character
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

            } else {
                setTimeout(() => {
                    if (typeof scanLocation === 'function') scanLocation();
                }, 300);
            }
            return true;
        }
        
        // --- HOTKEY: DEEP SCAN (V) ---
        case 'v': { 
            const currentTile = chunkManager.getTile(playerX, playerY);
            let tileChar = '.';
            if (typeof getTileChar === 'function') tileChar = getTileChar(currentTile);
            else if (currentTile && currentTile.char) tileChar = currentTile.char;
            
            if (tileChar === STAR_CHAR_VAL) {
                const starData = generateStarData(playerX, playerY);
                const starId = `${playerX}_${playerY}`;
                
                if (typeof soundManager !== 'undefined') soundManager.playUIHover();
                evaluateStar(starData, starId);
            } else {
                logMessage("Deep scanners read nothing but the void.");
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
            
        case 't': { 
            const tileForWormhole = chunkManager.getTile(playerX, playerY);
            let whType = '';
            if (typeof getTileType === 'function') whType = getTileType(tileForWormhole);
            
            if (whType === 'wormhole' && typeof traverseWormhole === 'function') traverseWormhole();
            else logMessage("No wormhole here.");
            return true;
        }
        
        // --- NEW STRANDED / WAIT CONTROLS ---
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
            // Not a recognized global key
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

 // --- INPUT HANDLING WITH SMOOTHING ---
let lastInputTime = 0;
const INPUT_DELAY = 120; // 120ms cooldown between moves (Adjust this to change "weight")

document.addEventListener('keydown', function(event) {
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
    const now = Date.now();

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

    // --- TACTICAL WAIT ---
    // (Fixed: Removed 'w' so WASD 'Up' movement works again!)
    if (key === ' ') {
        if (typeof advanceGameTime === 'function') advanceGameTime(1.0); 
        logMessage("Systems cycling. You hold position and wait.");
        if (typeof renderUIStats === 'function') renderUIStats();
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
        document.body.appendChild(div);
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
            performSave('wayfinderAutoSave');
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

// --- START GAME (Starts Autosave Timer) ---
function startGame(seedString) {
     playerName = document.getElementById('playerNameInput').value || "Captain";

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

// 1. Manual Save (Attached to Button)
function saveGame() {
    performSave('wayfinderSaveData');
    logMessage("Game Saved Manually.");
    showToast("GAME PROGRESS SAVED", "success");
}

// 2. Auto Save (Internal)
function autoSaveGame() {
    // Only autosave if we are actually playing (not dead, not in title)
    if (currentGameState === GAME_STATES.TITLE_SCREEN || playerHull <= 0) return;
    
    performSave('wayfinderAutoSave');
    console.log("Autosave complete.");
}

// 3. Shared Save Logic
function performSave(storageKey) {
    if (typeof performGarbageCollection === 'function') performGarbageCollection();
    const gameState = {
        version: GAME_VERSION,
        realTimestamp: Date.now(), // Store real time for the UI
        
        // Stats
        playerX, playerY, playerFuel, playerCredits, playerShields, playerHull,
        playerNotoriety, playerLevel, playerXP, playerName, playerPfp, playerCrew,

        playerPerks: Array.from(playerPerks), 
        
        // --- COLONY BUILDER STATE ---
        playerHasColonyCharter: typeof playerHasColonyCharter !== 'undefined' ? playerHasColonyCharter : false,
        playerColony: typeof playerColony !== 'undefined' ? playerColony : null,
        // ----------------------------
        
        // Inventory & World
        playerShip, playerCargo,
        WORLD_SEED, currentGameDate, playerActiveMission, playerActiveBounty, currentStationBounties, activeMarketTrend, 
        
        // Mystery & Deltas
        mystery_wayfinder_progress, mystery_wayfinder_finalLocation,
        mystery_first_nexus_location, mystery_nexus_activated,
        xerxesPuzzleLevel,
        worldStateDeltas: worldStateDeltas || {},
        currentSectorName, 

        // Data Structures
        visitedSectors: Array.from(visitedSectors),
        scannedObjectTypes: Array.from(scannedObjectTypes),
        discoveredLocations: Array.from(discoveredLocations),
        playerCompletedMissions: Array.from(playerCompletedMissions),
        discoveredLoreEntries: Array.from(discoveredLoreEntries)
    };

    try {
        localStorage.setItem(storageKey, JSON.stringify(gameState));
    } catch (error) {
        console.error("Save failed:", error);
        logMessage("<span style='color:red'>Save Failed: Storage Full!</span>");
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

// --- LOAD LOGIC ---

function loadGame() {
    // This button is now "Load Manual Save" inside the game menu
    const savedString = localStorage.getItem('wayfinderSaveData');
    if (savedString) {
        loadGameData(savedString);
    } else {
        logMessage("No manual save found.");
    }
}

// Internal function that parses the JSON string
function loadGameData(jsonString) {
    if (!jsonString) return;

    try {
        const savedState = JSON.parse(jsonString);
        
        if (savedState.version !== GAME_VERSION) {
            console.warn(`Version mismatch: ${savedState.version} vs ${GAME_VERSION}`);
        }

        // Restore Variables
        playerName = savedState.playerName || "Captain";

        isAwaitingRescue = savedState.isAwaitingRescue || false; 
        rescueTargetStation = savedState.rescueTargetStation || null; // NEW
        rescueFeePaid = savedState.rescueFeePaid || 0; // NEW
        freebieUsed = savedState.freebieUsed || false; // NEW
        playerPfp = savedState.playerPfp || "assets/pfp_01.png";
        playerX = savedState.playerX;
        playerY = savedState.playerY;
        playerFuel = savedState.playerFuel;
        playerCredits = savedState.playerCredits;
        playerShields = savedState.playerShields;
        playerHull = savedState.playerHull;
        playerNotoriety = savedState.playerNotoriety;
        playerLevel = savedState.playerLevel;
        playerXP = savedState.playerXP;
        playerCrew = savedState.playerCrew || [];

        xerxesPuzzleLevel = savedState.xerxesPuzzleLevel || 0;

        playerPerks = new Set(savedState.playerPerks || []); // Convert Array back to Set
        
        WORLD_SEED = savedState.WORLD_SEED;
        playerActiveMission = savedState.playerActiveMission;

        playerActiveBounty = savedState.playerActiveBounty || null;
        currentStationBounties = savedState.currentStationBounties || [];
        activeMarketTrend = savedState.activeMarketTrend || null;

        // --- RESTORE COLONY BUILDER STATE ---
        playerHasColonyCharter = savedState.playerHasColonyCharter || false;
        playerColony = savedState.playerColony || {
            established: false,
            name: "Unclaimed Settlement",
            x: null,
            y: null,
            planetName: null,
            biome: null,
            phase: "NONE", 
            population: 0,
            morale: 100,
            suppliesDelivered: { habModules: 0, atmosProcessors: 0 }
        };

        currentGameDate = savedState.currentGameDate;
        
        mystery_wayfinder_progress = savedState.mystery_wayfinder_progress;
        mystery_wayfinder_finalLocation = savedState.mystery_wayfinder_finalLocation;
        mystery_first_nexus_location = savedState.mystery_first_nexus_location;
        mystery_nexus_activated = savedState.mystery_nexus_activated;
        // Load the level, default to 0 if missing (backward compatibility)
        xerxesPuzzleLevel = savedState.xerxesPuzzleLevel || 0;
        
        playerShip = savedState.playerShip;
        playerCargo = savedState.playerCargo;
        
        visitedSectors = new Set(savedState.visitedSectors);
        scannedObjectTypes = new Set(savedState.scannedObjectTypes);
        discoveredLocations = new Set(savedState.discoveredLocations);
        playerCompletedMissions = new Set(savedState.playerCompletedMissions);
        discoveredLoreEntries = new Set(savedState.discoveredLoreEntries);
        
        worldStateDeltas = savedState.worldStateDeltas || {}; 
        
        // Reset Logic
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

        // --- RE-INJECT ACTIVE BOUNTY SHIP ---
        // If the player had an active contract, we must respawn the ship on the map!
        if (playerActiveBounty) {
            if (typeof activeEnemies !== 'undefined') {
                // Ensure we don't duplicate it if the array persisted somehow
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

        // --- FUEL RAT RELOAD PROTECTION ---
        if (isAwaitingRescue && rescueTargetStation) {
            if (typeof activeNPCs !== 'undefined') {
                activeNPCs.push({
                    x: playerX + 10, // Spawn them close by so they arrive soon!
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

        // Resume Game
        logMessage("Game Loaded Successfully.");
        currentTradeContext = null;
        currentCombatContext = null;
        changeGameState(GAME_STATES.GALACTIC_MAP);
        handleInteraction();
        renderMissionTracker();
        render();
        
        // START AUTOSAVE TIMER
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        autoSaveInterval = setInterval(autoSaveGame, AUTOSAVE_DELAY);

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
    const manualSave = localStorage.getItem('wayfinderSaveData');
    const autoSave = localStorage.getItem('wayfinderAutoSave');

    // Get Elements
    const titleOverlay = document.getElementById('titleOverlay');
    const newGameCont = document.getElementById('newGameContainer');
    const saveSelectCont = document.getElementById('saveSelectContainer');
    const bootEl = document.getElementById('systemBoot');

    // 1. AUTO-LOGIN (Fast Track)
    // If auto-login is on, we skip the delay so you get into the game fast.
    if (!forceMenu && autoLoginEnabled && (autoSave || manualSave)) {
        console.log("Auto-login enabled. Loading...");
        try {
            const targetSave = autoSave || manualSave; 
            initializeGame();
            loadGameData(targetSave);
            
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

    // 2. CALCULATE DELAY
    // If booting up (forceMenu is false), wait 3 seconds for effect.
    // If just refreshing after a delete (forceMenu is true), wait 2 seconds.
    const loadingDelay = forceMenu ? 2000 : 3000;

    // 3. START THE TIMER
    setTimeout(() => {
        // Hide the "Initializing..." text
        if (bootEl) bootEl.style.display = 'none';

        // Show the correct menu
        if (manualSave || autoSave) {
            // Has Saves -> Show Save Select
            if (newGameCont) newGameCont.style.display = 'none';
            if (saveSelectCont) {
                saveSelectCont.style.display = 'block';
                renderSaveSlots(manualSave, autoSave);
            }
        } else {
            // No Saves -> Play the Intro Video instead of jumping straight to creation!
            if (saveSelectCont) saveSelectCont.style.display = 'none';
            playIntroVideo(); 
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

function renderSaveSlots(manualJson, autoJson) {
    const list = document.getElementById('saveList');
    list.innerHTML = '';

    const createCard = (json, type) => {
        try {
            const data = JSON.parse(json);
            
            // 1. Create the Main Card Container
            const card = document.createElement('div');
            card.className = 'save-slot-card';
            
            // 2. Create the "Clickable" Content Area (Load Game)
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
            
            // Load Game on clicking the content
            contentDiv.onclick = () => {
                initializeGame();
                loadGameData(json);
                hideTitleScreen();
            };

            // 3. Create the Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'save-delete-btn';
            deleteBtn.innerHTML = '&times;'; // The 'X' symbol
            deleteBtn.title = "Delete Save";
            
            // Delete Logic
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Stop click from triggering the load
                const key = type === 'AUTO' ? 'wayfinderAutoSave' : 'wayfinderSaveData';
                deleteSave(key);
            };

            // 4. Assemble
            card.appendChild(contentDiv);
            card.appendChild(deleteBtn);
            list.appendChild(card);

        } catch (e) {
            console.error("Corrupt save found", e);
        }
    };

    // Render Auto Save first (usually most recent)
    if (autoJson) createCard(autoJson, 'AUTO');
    if (manualJson) createCard(manualJson, 'MANUAL');
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
    // Tied into your puzzle progression!
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
        // Teaser button so the player knows what they are working towards!
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

    // --- 3. THE SPIRE PUZZLE ---
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
        menu.innerHTML += `
            <button class="station-action-btn xerxes-btn" disabled style="opacity:0.5; border-color:#555;">
                <div class="btn-icon">🔒</div>
                <div>
                    <div class="btn-label">Spire Core Sealed</div>
                    <span class="btn-sub">Awaiting Future Update</span>
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

    // Strict Evaluation Logic
    let isCorrect = false;
    if (Array.isArray(puzzle.answers)) {
        isCorrect = puzzle.answers.some(ans => ans.toLowerCase() === answer);
    } else if (typeof puzzle.answers === 'string') {
        isCorrect = puzzle.answers.toLowerCase() === answer;
    }
    
    if (isCorrect) {
        // --- SUCCESS SEQUENCE ---
        inputEl.disabled = true;
        terminal.style.borderColor = "#DDA0DD";
        terminal.style.boxShadow = "inset 0 0 50px rgba(153, 51, 255, 0.4)";
        
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        
        xerxesPuzzleLevel++;
        
        // Give Rewards
        if (puzzle.rewardXP > 0) {
            playerXP += puzzle.rewardXP;
            showToast(`DECRYPTED: +${puzzle.rewardXP} XP`, "success");
        }
        if (puzzle.rewardCredit > 0) {
            playerCredits += puzzle.rewardCredit;
            showToast(`DATA CACHE: +${puzzle.rewardCredit}c`, "success");
        }

        if (xerxesPuzzleLevel === 1) {
            showToast("Layer Decrypted. Shadow Network Unlocked.", "success");
        }

        updateModalInfoBar('xerxesInfoBar');
        checkLevelUp();
        if (typeof autoSaveGame === 'function') autoSaveGame(); 

        output.innerHTML += `<span style="color:#DDA0DD; font-weight:bold; font-size:16px;">[ ACCESS GRANTED ]</span><br>${puzzle.flavorSuccess}<br><br>Rebooting station interfaces...`;
        output.scrollTop = output.scrollHeight;

        // Auto-close terminal and return to menu after 3 seconds
        setTimeout(abortSpireHack, 3000); 
        
    } else {
        // --- FAILURE SEQUENCE ---
        if (typeof soundManager !== 'undefined') soundManager.playError();
        if (typeof triggerHaptic === "function") triggerHaptic(300);
        
        playerHull -= 15;
        updateModalInfoBar('xerxesInfoBar');
        
        // Visual Red Flash on the Terminal (Keep the red for danger!)
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

    // --- NEW: THEME-MATCHING LOGIC ---
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
        
        // Scale difficulty with player level, with a chance for a "Hard" bounty
        let difficultyLevel = playerLevel;
        if (Math.random() > 0.7) difficultyLevel += 2; 
        
        const reward = (difficultyLevel * 1500) + Math.floor(Math.random() * 500);
        
        currentStationBounties.push({
            id: `BOUNTY_${Date.now()}_${i}`,
            targetName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            crime: crimeList[Math.floor(Math.random() * crimeList.length)],
            x: targetX,
            y: targetY,
            difficulty: difficultyLevel,
            reward: reward,
            faction: "ECLIPSE", // Defaulting to Cartel/Pirates
            shipClass: difficultyLevel > 5 ? "STRIKER" : "SCOUT" // Can expand this later!
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
// --- DEVELOPER DEBUG CONSOLE ---
// ==========================================

function openDevMenu() {
    openGenericModal("🛠️ DEVELOPER CONSOLE 🛠️");
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

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
        <div class="generic-list-item" onclick="devLevelUp()" style="cursor: pointer; border-left: 3px solid #FF55FF;">
            <strong style="color:#FF55FF;">⭐ Power Level (+5)</strong>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">Grants 5,000 XP and forces a level up.</div>
        </div>
    `;

    detailEl.innerHTML = `
        <div style="padding: 40px 20px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 10px;">⚠️</div>
            <h3 style="color:var(--danger); margin-bottom: 10px;">DEBUG MODE ACTIVE</h3>
            <p style="color:var(--item-desc-color);">Use these tools to bypass the game economy and test new features. Use with caution, as excessive item spawning may exceed your cargo limits.</p>
        </div>
    `;

    // A clean exit
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
